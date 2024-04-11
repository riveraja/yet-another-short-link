import bcrypt from "bcrypt";
import { db } from './db/db.ts'
import { users } from './schema.ts'
import { createPasswordHash, verifyPasswordHash } from "./utils/hashing.ts";
import { signJwt, verifyJwt, decodeJwt } from "./utils/jwt.ts";
import { z } from 'zod'
import { like, and, count } from 'drizzle-orm'

const saltrounds: number = 10;

interface JsonData {
    long_url: string
}

const zJsonData = z.object({
    long_url: z.string().trim().url()
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

// interface LoginData {
//     user_id: string,
//     password: string
// }

// const zLoginData = z.object({
//     user_id: z.string().trim().min(4),
//     password: z.string().trim()
// })

async function getHash(url:string) {
    const salt: string = await bcrypt.genSalt(saltrounds);
    const hashString: string = await bcrypt.hash(url, salt)
    return hashString.substring(7).substring(22).substring(1,6)
}

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
                throw new Error("Failed to query the database.")
            }
            
            return Response.json({ success: false })
        }

        /**
         * x-api-key: <user_jwt_token>
         * {
         *  long_url: <url>
         * }
         */
        if (req.method === 'POST' && url.pathname === '/api/create-link') {
            const clientJwt: string = (req.headers.get('x-api-key'))?.trim() as string
            await verifyJwt(clientJwt)
            const payload: JsonData = (await req.json()) as JsonData
            const data = zJsonData.parse(payload)
            const hashString: String = await getHash(data.long_url)
            const short_url: String = `http://${url.hostname}:${url.port}/${hashString}`
            return Response.json({ success: true, data, short_url: short_url })
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
                    throw new Error('Failed to insert data.')                    
                }
                return Response.json({ success: true, user_id: hUserData.user_id, email: hUserData.email, token: signedToken })
            }
            return Response.json({ success: false })
        }

        return new Response("Page not found.", { status: 404 })
    }
})

console.log(`Listening on ${server.url}`)
