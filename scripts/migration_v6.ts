import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function migrate() {
    console.log('Iniciando migración v6 (Campos adicionales en agenda_openings)...');

    try {
        // Add request_type column
        await sql`ALTER TABLE agenda_openings ADD COLUMN IF NOT EXISTS request_type TEXT DEFAULT 'Apertura';`;
        console.log('Columna request_type añadida.');

        // Add category_type column
        await sql`ALTER TABLE agenda_openings ADD COLUMN IF NOT EXISTS category_type TEXT;`;
        console.log('Columna category_type añadida.');

        console.log('Migración v6 completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración v6:', error);
        process.exit(1);
    }
}

migrate();
