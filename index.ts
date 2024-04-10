import bcrypt from "bcrypt";
import { db } from './db/db.ts'
import { users } from './schema.ts'
import { createPasswordHash, verifyPasswordHash } from "./utils/hashing.ts";
import { signJwt } from "./utils/jwt.ts";
import { z } from 'zod'

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
    user_id: z.string().min(4),
    email: z.string().trim().email(),
    password: z.string().trim()
})

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

        if (url.pathname === '/') {
            return Response.json({ success: true });
        }

        if (req.method === 'POST' && url.pathname === '/api/create-link') {
            const payload: JsonData = (await req.json()) as JsonData
            const data = zJsonData.parse(payload)
            const hashString: String = await getHash(data.long_url)
            const short_url: String = `http://${url.hostname}:${url.port}/${hashString}`
            return Response.json({ success: true, data, short_url: short_url })
        }

        if (req.method === 'POST' && url.pathname === '/api/create-user') {
            const token: string = (req.headers.get('x-api-key')) as string
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
                const signedToken: string = await signJwt({ userId: data.user_id, email: data.email})

                try {
                    await db.insert(users).values(hUserData)
                } catch (error) {
                    throw new Error('Failed to insert data.')                    
                }
                return Response.json({ success: true, hUserData, token: signedToken })
            }
            return Response.json({ success: false })
        }

        return new Response("Page not found.", { status: 404 })
    }
})

console.log(`Listening on ${server.url}`)