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

export const getUrlDuplicates = async (data: {longUrl: string}) => {
    try {
        return await db.select({
            id: urls.id,
            long_url: urls.long_url,
            short_url: urls.short_url,
            created_at: urls.created_at,
            expires_on: urls.expires_on
        }).from(urls).where(like(urls.long_url, data.longUrl)).limit(1)
    } catch (error) {
        console.log(error)
        throw new Error('Failed to query the database.')
    }
}

export const updateUrlDates = async (data: {id: string, createdAt: string, expiresOn: string}) => {
    try {
        return await db.update(urls)
            .set({ created_at: data.createdAt, expires_on: data.expiresOn })
            .where(like(urls.id, data.id))
    } catch (error) {
        console.log(error)
        throw new Error('Failed to update the database.')
    }
}

export const getHashDuplicates = async (data: {hashString: string}) => {
    try {
        return await db.select({
            long_url: urls.long_url,
            short_url: urls.short_url,
            expires_on: urls.expires_on
        }).from(urls).where(like(urls.short_url, data.hashString)).limit(1)
    } catch (error) {
        console.log(error)
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
        console.log(error)
        throw new Error('Failed to insert data.')        
    }
}

export const findMatch = async (data: { path: string }) => {
    try {
        console.log('finding match for ', data.path)
        return await db.select({
            long_url: urls.long_url,
            expires_on: urls.expires_on
        }).from(urls).where(like(urls.short_url, data.path))
    } catch (error) {
        console.log(error)
        throw new Error('Failed to query the database.')
    }
}
