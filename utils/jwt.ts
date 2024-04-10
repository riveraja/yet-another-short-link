import * as jose from 'jose'
import { db } from '../db/db.ts'

const key: Uint8Array = new TextEncoder().encode(import.meta.env.JWT_SECRET)
const alg: string = import.meta.env.JWT_ALG as string
const iss: string = import.meta.env.JWT_ISSUER as string
const aud: string = import.meta.env.JWT_AUDIENCE as string
const exp: string = import.meta.env.JWT_EXPIRATION_TIME as string

export const signJwt = async (data: { userId: string, email: string }) => {
    return await new jose.SignJWT(data)
        .setProtectedHeader({ alg: alg })
        .setIssuedAt()
        .setIssuer(iss)
        .setAudience(aud)
        .setExpirationTime(exp)
        .sign(key)
}

export const verifyJwt = async (clientJwt: string) => {
    try {
        await jose.jwtVerify(clientJwt, key, {
            issuer: iss,
            audience: aud
        })    
    } catch (error) {
        throw new Error('Token verification failed.')
    }
}
