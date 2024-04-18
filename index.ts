import { db } from './db/db.ts'
import { users } from './schema.ts'
import { getHash, genRandString } from "./utils/hashing.ts";
import { signJwt, verifyJwt, decodeJwt } from "./utils/jwt.ts";
import { z } from 'zod'
import { fetchUuid, verifyOtp, getCount } from './utils/users.ts';
import { getDuplicates, insertNewUrl, findMatch } from './utils/urls.ts';

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
    // password: string,
    active_code?: string | null
}

const zUserData: z.ZodType<UserData> = z.object({
    user_id: z.string().trim().min(4),
    email: z.string().trim().email(),
    // password: z.string().trim(),
    active_code: z.string().trim().nullable()
})

const server = Bun.serve({
    port: Bun.env.PORT,
    hostname: Bun.env.HOSTNAME,
    async fetch(req) {
        const url = new URL(req.url);
        const verifyEndpoint = new RegExp('/api/verify', 'i')
        // console.log(req.headers) // debug only

        if (url.pathname === '/') {
            return new Response(Bun.file("./index.html"), {
                headers: {
                    "Content-Type": "text/html",
                }
            })
        } else if (req.method === 'GET' && url.pathname === '/api/decode-token') {
            const token: string = (req.headers.get('x-api-key'))?.trim() as string
            const { userId, email } = await decodeJwt(token)
            return Response.json({ success: true, status: 200, user: userId, email: email })
        } else if (req.method === 'GET' && url.pathname === '/api/refresh-token') {
            /**
             * x-api-key: <user's expired token>
             */
            const token: string = (req.headers.get('x-api-key'))?.trim() as string
            const { userId, email } = await decodeJwt(token)
            await verifyJwt(token)
            try {
                const counter = await getCount(userId as string, email as string)
                if (counter[0].value === 1) {
                    const signedToken: string = await signJwt({ userId: userId as string, email: email as string })
                    return Response.json({ success: true, status: 200, token: signedToken})
                }
            } catch (error) {
                console.log(error)
                throw new Error("Failed to query the database.")
            }
            
            return Response.json({ success: false })
        } else if (req.method === 'POST' && url.pathname === '/api/shorten-url') {
            /**
             * x-api-key: <user_jwt_token>
             * {
             *  long_url: <url>
             *  expire_time_hours: <number>
             * }
             */
            const clientJwt: string = (req.headers.get('x-api-key'))?.trim() as string
            // TODO: add rate limiter
            const { userId, email } = await decodeJwt(clientJwt)
            await verifyJwt(clientJwt)
            
            const payload: JsonData = (await req.json()) as JsonData
            const data = zJsonData.parse(payload)
            const hashString: string = await getHash(data.long_url)

            const longUrl: string = data.long_url as string
            const shortUrl: string = `http://${url.hostname}:${url.port}/${hashString}`
            const userUuid: string = await fetchUuid(userId as string, email as string)
            const dateCreated: number = Date.now()
            const dateExpires: number = dateCreated + data.expire_time_hours*60*60*1000

            console.log('checking duplicates')
            const result = await getDuplicates({ longUrl })

            if (Object(result).length === 0) {
                try {
                    await insertNewUrl({
                        long_url: longUrl,
                        short_url: hashString,
                        created_by: userUuid,
                        created_at: new Date(dateCreated).toString(),
                        expires_on: new Date(dateExpires).toString()
                    })
                    console.log('Done inserting data...')

                    return Response.json({
                        success: true,
                        status: 200,
                        long_url: longUrl,
                        short_url: shortUrl,
                        created_at: new Date(dateCreated).toString(),
                        expires_on: new Date(dateExpires).toString()
                    })
                } catch (error) {
                    console.log(error)
                    throw new Error('Failed to insert the data.')
                }
                
            }

            if (Object(result).length > 0) {
                console.log('A duplicate is found...')
                console.log(result[0])

                return Response.json({
                    success: true,
                    status: 200,
                    long_url: result[0].long_url,
                    shortUrl: `http://${url.hostname}:${url.port}/${result[0].short_url}`,
                    expires_on: result[0].expires_on
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
            const token: string = (req.headers.get('x-api-key'))?.trim() as string
            if (token === Bun.env.ADMIN_TOKEN) {
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
                    console.log(error)
                    throw new Error('Failed to insert data.')                    
                }
                return Response.json({
                    success: true,
                    activation_code: activation_code,
                    token: signedToken
                })
            }
            return Response.json({ success: false })
        } else if (req.method === 'GET' && verifyEndpoint.exec(url.pathname)) {
            /**
             * Verify OTP
             */
            const clientJwt: string = (req.headers.get('x-api-key'))?.trim() as string
            const { userId, email } = await decodeJwt(clientJwt)
            await verifyJwt(clientJwt)

            const activation_code = url.pathname.split('=')[1]
            console.log(activation_code)
            if (await verifyOtp(userId as string, email as string, activation_code as string)) {
                return Response.json({ success: true })
            }
            
            return Response.json({ success: false })
        }

        //
        console.log(req)
        console.log(url)
        const urlHash: string = url.pathname.slice(1)
        const result = await findMatch({ path: urlHash})
        console.log(result)

        if (Object(result).length === 1) {
            // TODO check link expiration date
            const longUrl: string = result[0].long_url as string
            return Response.redirect(longUrl, 302)
        }

        return new Response("Page not found.", { status: 404 })
    }
})

console.log(`Listening on ${server.url}`)
