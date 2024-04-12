import { db } from '../db/db.ts'
import { like, and } from 'drizzle-orm'
import { users } from '../schema.ts'

export const fetchUuid = async (userId: string, email: string) => {
    try {
        const result = await db.select({
            uuid: users.id
        }).from(users).where(and(like(users.user_id, userId as string), like(users.email, email as string))).limit(1)
        return result[0].uuid
    } catch (error) {
        throw new Error("Failed to fetch data.")
    }
}