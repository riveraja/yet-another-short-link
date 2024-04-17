import { db } from '../db/db.ts'
import { like, and, eq, count } from 'drizzle-orm'
import { users } from '../schema.ts'

export const getCount = async (userId: string, email: string) => {
    return await db.select({
        value: count()
    })
    .from(users)
    .where(and(like(users.user_id, userId as string), like(users.email, email as string)))
    .limit(1)
}

export const fetchUuid = async (userId: string, email: string) => {
    try {
        const result = await db.select({
            uuid: users.id
        }).from(users).where(and(like(users.user_id, userId as string), like(users.email, email as string), eq(users.is_active, true))).limit(1)
        return result[0].uuid
    } catch (error) {
        throw new Error("Failed to fetch data.")
    }
}

export const verifyOtp = async (userId: string, email: string, otp: string) => {
    try {
        const result = await db.select({
            active_code: users.active_code
        }).from(users).where(and(like(users.user_id, userId), like(users.email, email))).limit(1)
        if (Object(result).length === 1 && result[0].active_code === otp) {
            await db.update(users)
                    .set({ is_active: true })
                    .where(and(eq(users.user_id, userId), eq(users.email, email)))
            return true
        }
    } catch (error) {
        console.log(error)
        throw new Error('Failed verifying otp.')        
    }
    return false
}
