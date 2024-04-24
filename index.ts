import { db } from './db/db.ts'
import { users } from './schema.ts'
import { getHash, genRandString } from "./utils/hashing.ts";
import { signJwt, verifyJwt, decodeJwt } from "./utils/jwt.ts";
import { z } from 'zod'
import { fetchUuid, verifyOtp, getCount } from './utils/users.ts';
import { getUrlDuplicates, insertNewUrl, findMatch, updateUrlDates } from './utils/urls.ts';

const logger = require('pino')({ level: 'debug'});

interface JsonData {
    long_url: string,
    expire_time_hours: number
}

const zJsonData: z.ZodType<JsonData> = z.object({
    long_url: z.string().trim().url(),
    expire_time_hours: z.number()
})

interface UserData {
    user_id: string,
    email: string,
    active_code?: string | null
}

const zUserData: z.ZodType<UserData> = z.object({
    user_id: z.string().trim().min(4),
    email: z.string().trim().email(),
    active_code: z.string().trim().nullable().optional()
})

declare global {
    var token: string
    var userId: string
    var email: string
    var userUuid: string
}

const server = Bun.serve({
    port: Bun.env.PORT,
    hostname: Bun.env.HOSTNAME,
    async fetch(req) {
        const url = new URL(req.url);
        const verifyEndpoint = new RegExp('/api/verify', 'i')

        /*
        console.log('req', req)
        console.log('url', url)
        */

        if (req.headers.has('x-api-key')) var hasApiKey = true; else hasApiKey = false
        
        if (hasApiKey) {
            globalThis.token = (req.headers.get('x-api-key'))?.trim() as string
        }
        
        // console.log(req.headers) // debug only

        if (url.pathname === '/') {
            return new Response(Bun.file("./index.html"), {
                headers: {
                    "Content-Type": "text/html",
                }
            })
        } else if (req.method === 'GET' && url.pathname === '/api/decode-token') {
            if (hasApiKey) {
                const { userId, email } = await decodeJwt(globalThis.token)
                return Response.json({ success: true, status: 200, user: userId, email: email })
            }
            return Response.json({ success: false })
        } else if (req.method === 'GET' && url.pathname === '/api/refresh-token') {
            /**
             * x-api-key: <user's expired token>
             */
            if (hasApiKey) {
                const { userId, email } = await decodeJwt(globalThis.token)
                await verifyJwt(globalThis.token)
                try {
                    const counter = await getCount(userId as string, email as string)
                    if (counter[0].value === 1) {
                        const signedToken: string = await signJwt({ userId: userId as string, email: email as string })
                        return Response.json({ success: true, status: 200, token: signedToken})
                    }
                } catch (error) {
                    logger.error(error)
                    throw new Error("Failed to query the database.")
                }
            }
            
            return Response.json({ success: false })
        } else if (req.method === 'POST' && url.pathname === '/api/shorten-url') {
            /**
             * x-api-key: <user_jwt_token> [optional]
             * {
             *  long_url: <url>
             *  expire_time_hours: <number>
             * }
             */

            const expireHoursMax = 8
            const expireHoursMin = 1
            // TODO: add rate limiter
            if (hasApiKey) {
                const { userId, email } = await decodeJwt(globalThis.token)
                globalThis.userId = userId as string
                globalThis.email = email as string
                await verifyJwt(globalThis.token)
            }
            
            const payload: JsonData = (await req.json()) as JsonData
            const data = zJsonData.parse(payload)
            const hashString: string = await getHash()

            /*
                Get short URL expire hours
            */
            let expire_hours: number = 0
            if (hasApiKey && data.expire_time_hours < 1) {
                expire_hours = expireHoursMin
            } else if (hasApiKey && data.expire_time_hours > 8) { 
                expire_hours = expireHoursMax
            } else if (!hasApiKey) {
                expire_hours = 0.5
            } else if (hasApiKey) {
                expire_hours = Math.floor(data.expire_time_hours)
            }

            const longUrl: string = data.long_url as string
            // const shortUrl: string = `http://${url.hostname}:${url.port}/${hashString}`
            const dateCreated: number = Date.now()
            const dateExpires: number = dateCreated + expire_hours*60*60*1000

            logger.info('Checking duplicates...')
            const result = await getUrlDuplicates({ longUrl })

            if (Object(result).length === 0) {
                try {
                    const data = {
                        long_url: longUrl,
                        short_url: hashString,
                        created_by: hasApiKey ? await fetchUuid(globalThis.userId, globalThis.email) : null,
                        created_at: new Date(dateCreated).toISOString(),
                        expires_on: new Date(dateExpires).toISOString()
                    }
                    await insertNewUrl(data)
                    logger.info('New data inserted...')

                    return Response.json({
                        success: true,
                        status: 200,
                        ...data
                    })
                } catch (error) {
                    logger.error(error)
                    throw new Error('Failed to insert the data.')
                }
                
            }

            if (Object(result).length > 0) {
                logger.info('A duplicate is found')
                logger.info(result[0])

                const expire_date = new Date(result[0].expires_on).getTime()
                const today = Date.now()
                const checkDate: string = (today > expire_date) ? 'Expired URL found, needs updates.' : 'Unexpired URL found, not updating.'
                logger.debug(checkDate)
                if (today > expire_date) {
                    logger.info('Updating created_at and expires_on...')
                    const create_date: string = new Date(today).toISOString()
                    const expiree_date: string = new Date(expire_date).toISOString()
                    await updateUrlDates({
                        long_url: longUrl,
                        createdAt: create_date,
                        expiresOn: expiree_date
                    })

                    const data = {
                        long_url: longUrl,
                        short_url: `http://${url.hostname}:${url.port}/${result[0].short_url}`,
                        created_at: create_date,
                        expires_on: expiree_date
                    }

                    logger.info(data)
                    return Response.json({
                        success: true,
                        status: 200,
                        ...data
                    })
                }
                return Response.json({
                    success: true,
                    status: 200,
                    ...data
                })
            }

            return Response.json({ success: false })
            
        } else if (req.method === 'POST' && url.pathname === '/api/register') {
            /**
             * x-api-key: <create_token>
             * {
             *  user_id: <user_id>
             *  email: <user_email>
             * }
             */

            if (hasApiKey) {
                if (globalThis.token === Bun.env.ADMIN_TOKEN) {
                    const userData: UserData = (await req.json()) as UserData
                    const data = zUserData.parse(userData)
                    const activation_code: string = await genRandString()
                    const hUserData: UserData = {
                        user_id: data.user_id,
                        email: data.email,
                        active_code: activation_code
                    }
                    const signedToken: string = await signJwt({ userId: data.user_id, email: data.email })

                    try {
                        // TODO: move to utils/users.ts
                        await db.insert(users).values(hUserData)
                    } catch (error) {
                        logger.error(error)
                        throw new Error('Failed to insert data.')                    
                    }
                    return Response.json({
                        success: true,
                        activation_code: activation_code,
                        token: signedToken
                    })
                }
            }
            return Response.json({ success: false })
        } else if (req.method === 'GET' && verifyEndpoint.exec(url.pathname)) {
            /**
             * Verify OTP
             * url: /api/verify=<activation-code>
             */
            if (hasApiKey) {
                const { userId, email } = await decodeJwt(globalThis.token)
                await verifyJwt(globalThis.token)
                const activation_code = url.pathname.split('=')[1]
                if (await verifyOtp(userId as string, email as string, activation_code as string)) {
                    return Response.json({ success: true })
                }
            }
            
            return Response.json({ success: false })
        }

        const urlHash: string = url.pathname.slice(1)
        const result = await findMatch({ path: urlHash})
        logger.info(result)

        if (Object(result).length === 1) {
            // TODO check link expiration date
            const longUrl: string = result[0].long_url as string
            return Response.redirect(longUrl, 302)
        }

        return new Response("Page not found.", { status: 404 })
    }
})

logger.info(`Listening on ${server.url}`)
