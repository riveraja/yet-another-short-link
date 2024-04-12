import type { Config } from 'drizzle-kit';
import 'dotenv/config'

export default {
  schema: './schema.ts',
  out: './drizzle',
  driver: 'pg', // 'pg' | 'mysql2' | 'better-sqlite' | 'libsql' | 'turso'
  dbCredentials: {
    connectionString: process.env.CONNECTION_STRING as string,
  },
} satisfies Config;