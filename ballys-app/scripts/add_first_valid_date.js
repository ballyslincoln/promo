import { neon } from '@neondatabase/serverless';

const dbUrl = "postgresql://neondb_owner:npg_3IOi0CKjqomx@ep-dry-boat-aeb1v1gd-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require";
const sql = neon(dbUrl);

async function migrate() {
    try {
        console.log('Adding first_valid_date column to mail_jobs table...');
        await sql`
            ALTER TABLE mail_jobs 
            ADD COLUMN IF NOT EXISTS first_valid_date TEXT;
        `;
        console.log('Migration successful!');
    } catch (e) {
        console.error('Migration failed:', e);
    }
}

migrate();

