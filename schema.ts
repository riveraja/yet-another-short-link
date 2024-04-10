import { timestamp, text, uuid, unique, pgTable } from 'drizzle-orm/pg-core';
import { sql } from "drizzle-orm";

export const users = pgTable('users', {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    user_id: text('user_id').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    created_at: timestamp('created_at').default(sql`now()`),
}, (t) => ({
    uniqueKey1: unique().on(t.user_id, t.email),
}))
