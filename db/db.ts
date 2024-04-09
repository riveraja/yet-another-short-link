import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(import.meta.env.CONNECTION_STRING as string)

export const db = drizzle(client)