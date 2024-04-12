import { db } from '../db/db.ts'
import { like, and, count } from 'drizzle-orm'
import { urls } from '../schema.ts'

interface UrlsData {
    long_url: string,
    short_url: string,
    created_by: string,
    created_at: string,
    expires_on: string
}

export const getDuplicates = async (data: {longUrl: string}) => {
    try {
        return await db.select({
            long_url: urls.long_url,
            short_url: urls.short_url,
            expires_on: urls.expires_on
        }).from(urls).where(like(urls.long_url, data.longUrl)).limit(1)
    } catch (error) {
        throw new Error('Failed to query the database.')
    }
}

export const insertNewUrl = async (data: UrlsData) => {
    // console.log(data)
    try {
        console.log('Inserting data...')
        console.log(data)
        return await db.insert(urls).values({
            long_url: data.long_url,
            short_url: data.short_url,
            created_by: data.created_by,
            created_at: data.created_at,
            expires_on: data.expires_on
        })
    } catch (error) {
        throw new Error('Failed to insert data.')        
    }
}