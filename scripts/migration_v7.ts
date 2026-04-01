import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function migrate() {
    console.log('Iniciando migración v7 (Campo status en users)...');

    try {
        // Add status column to users table
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';`;
        console.log('Columna status añadida a users.');

        // Update existing users to active
        await sql`UPDATE users SET status = 'active' WHERE status = 'pending';`;
        console.log('Usuarios existentes marcados como active.');

        console.log('Migración v7 completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración v7:', error);
        process.exit(1);
    }
}

migrate();
