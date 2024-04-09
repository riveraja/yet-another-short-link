import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = import.meta.env.CONNECTION_STRING

if (!connectionString) {
    throw new Error('Connection String is not set.')
}

const migrationClient = postgres(connectionString, { max: 1 })

console.log('Database migration starting...')
migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' })
console.log('Database migration completed.')
