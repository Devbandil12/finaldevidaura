import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "./schema"

const sql = neon(import.meta.env.VITE_DATABASE_URL);
export const db = drizzle({ client: sql },schema);
console.log("first")
// const result = await db.execute('select 1');
