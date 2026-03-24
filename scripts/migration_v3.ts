import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function migrate() {
    console.log('Iniciando migración v3 (agenda_openings)...');

    try {
        // 1. Add assigned_admin
        await sql`ALTER TABLE agenda_openings ADD COLUMN IF NOT EXISTS assigned_admin TEXT;`;
        console.log('Columna assigned_admin añadida.');

        // 2. Add processed_at
        await sql`ALTER TABLE agenda_openings ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;`;
        console.log('Columna processed_at añadida.');
        
        // 3. Add pdf_url (optional but good for consistency)
        await sql`ALTER TABLE agenda_openings ADD COLUMN IF NOT EXISTS pdf_url TEXT;`;
        console.log('Columna pdf_url añadida.');

        console.log('Migración completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración:', error);
        process.exit(1);
    }
}

migrate();
