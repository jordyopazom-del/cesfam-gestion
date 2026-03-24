import { db } from '@vercel/postgres';

process.env.POSTGRES_URL = "postgresql://neondb_owner:npg_AkZu5qHOP2Mx@ep-rough-star-adt8q611-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function migrate() {
    const client = await db.connect();
    try {
        console.log('Starting migration...');
        await client.sql`
            ALTER TABLE requests 
            ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(500),
            ADD COLUMN IF NOT EXISTS assigned_admin VARCHAR(255),
            ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;
        `;
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
