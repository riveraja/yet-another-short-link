import { db } from './db/db.ts'
import { users, urls } from './schema.ts'
import { createPasswordHash, verifyPasswordHash, getHash } from "./utils/hashing.ts";
import { signJwt, verifyJwt, decodeJwt } from "./utils/jwt.ts";
import { z } from 'zod'
import { like, and, count } from 'drizzle-orm'
import { fetchUuid } from './utils/users.ts';
import { getDuplicates, insertNewUrl, findMatch } from './utils/urls.ts';

interface JsonData {
    long_url: string,
    expire_time_hours: number
}

const zJsonData = z.object({
    long_url: z.string().trim().url(),
    expire_time_hours: z.number()
})

interface UserData {
    user_id: string,
    email: string,
    password: string
}

const zUserData = z.object({
    user_id: z.string().trim().min(4),
    email: z.string().trim().email(),
    password: z.string().trim()
})

const server = Bun.serve({
    port: import.meta.env.PORT,
    hostname: import.meta.env.HOSTNAME,
    async fetch(req) {
        const url = new URL(req.url);
        // console.log(req.headers) // debug only

        if (url.pathname === '/') {
            return Response.json({ success: true });
        }

        if (req.method === 'GET' && url.pathname === '/api/decode-token') {
            const token: string = (req.headers.get('x-api-key'))?.trim() as string
            const { userId, email } = await decodeJwt(token)
            return Response.json({ success: true, status: 200, user: userId, email: email })
        }

        /**
         * x-api-key: <user's expired token>
         */
        if (req.method === 'GET' && url.pathname === '/api/refresh-token') {
            const token: string = (req.headers.get('x-api-key'))?.trim() as string
            const { userId, email } = await decodeJwt(token)
            try {
                const counter = await db.select({
                    value: count()
                })
                    .from(users)
                    .where(and(like(users.user_id, userId as string), like(users.email, email as string)))
                    .limit(1)
                if (counter[0].value === 1) {
                    const signedToken: string = await signJwt({ userId: userId as string, email: email as string })
                    return Response.json({ success: true, status: 200, token: signedToken})
                }
            } catch (error) {
                console.log(error)
                throw new Error("Failed to query the database.")
            }
            
            return Response.json({ success: false })
        }

        /**
         * x-api-key: <user_jwt_token>
         * {
         *  long_url: <url>
         *  expire_time_hours: <number>
         * }
         */
        if (req.method === 'POST' && url.pathname === '/api/shorten-url') {
            const clientJwt: string = (req.headers.get('x-api-key'))?.trim() as string
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

            // await db.insert(urls).values(hUrlsData)
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
            
        }

        /**
         * x-api-key: <create_token>
         * {
         *  user_id: <user_id>
         *  email: <user_email>
         *  password: <user_password>
         * }
         */
        if (req.method === 'POST' && url.pathname === '/api/create-user') {
            const token: string = (req.headers.get('x-api-key'))?.trim() as string
            if (token === import.meta.env.CREATE_TOKEN) {
                const userData: UserData = (await req.json()) as UserData
                const data = zUserData.parse(userData)
                const hashedPassword: string = await createPasswordHash(data.password)
                const hUserData: UserData = {
                    user_id: data.user_id,
                    email: data.email,
                    password: hashedPassword
                }
                const isMatch: boolean = await verifyPasswordHash(data.password, hashedPassword)
                if (!isMatch) {
                    const message: string = 'Failed to verify the password hash.'
                    console.log(message)
                    return Response.json({ success: false, err: message, status: 403 })
                }
                const signedToken: string = await signJwt({ userId: data.user_id, email: data.email })

                try {
                    await db.insert(users).values(hUserData)
                } catch (error) {
                    console.log(error)
                    throw new Error('Failed to insert data.')                    
                }
                return Response.json({ success: true, user_id: hUserData.user_id, email: hUserData.email, token: signedToken })
            }
            return Response.json({ success: false })
        }

        const urlHash: string = url.pathname.slice(1)
        const result = await findMatch({ path: urlHash})
        console.log(result)

        if (Object(result).length === 1) {
            // TODO check link expiree
            const longUrl: string = result[0].long_url as string
            return Response.redirect(longUrl, 302)
        }

        return new Response("Page not found.", { status: 404 })
    }
})

console.log(`Listening on ${server.url}`)
