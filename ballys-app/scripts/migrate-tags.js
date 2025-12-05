import { neon } from '@neondatabase/serverless';

const dbUrl = "postgresql://neondb_owner:npg_3IOi0CKjqomx@ep-dry-boat-aeb1v1gd-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const sql = neon(dbUrl);

async function run() {
    try {
        console.log("Adding tags column...");
        await sql`ALTER TABLE mail_jobs ADD COLUMN IF NOT EXISTS tags JSONB`;
        console.log("Done.");
    } catch (e) {
        console.error("Migration failed:", e);
        process.exit(1);
    }
}

run();
