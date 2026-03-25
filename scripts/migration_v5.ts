import { sql } from '@vercel/postgres';

process.env.POSTGRES_URL = "postgresql://neondb_owner:npg_AkZu5qHOP2Mx@ep-rough-star-adt8q611-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function migrate() {
    console.log('Iniciando migración v5 (Solicitud de Desbloqueo)...');

    try {
        // Add unblock_status column
        await sql`ALTER TABLE requests ADD COLUMN IF NOT EXISTS unblock_status TEXT DEFAULT 'None';`;
        console.log('Columna unblock_status añadida.');

        // Add unblock_reason column
        await sql`ALTER TABLE requests ADD COLUMN IF NOT EXISTS unblock_reason TEXT;`;
        console.log('Columna unblock_reason añadida.');

        console.log('Migración v5 completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración v5:', error);
        process.exit(1);
    }
}

migrate();
