import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno desde .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

async function migrate() {
    console.log('Iniciando migración v7 (Soporte para múltiples PDFs)...');

    try {
        // 1. Migración para la tabla 'requests'
        // Cambiar nombre de columna
        await sql`ALTER TABLE requests RENAME COLUMN pdf_url TO pdf_urls;`;
        // Cambiar tipo a TEXT ARRAY
        await sql`
            ALTER TABLE requests 
            ALTER COLUMN pdf_urls TYPE TEXT[] 
            USING CASE 
                WHEN pdf_urls IS NULL THEN NULL 
                WHEN pdf_urls = '' THEN ARRAY[]::TEXT[]
                ELSE ARRAY[pdf_urls] 
            END;
        `;
        console.log('Tabla requests actualizada.');

        // 2. Migración para la tabla 'agenda_openings'
        // Cambiar nombre de columna
        await sql`ALTER TABLE agenda_openings RENAME COLUMN pdf_url TO pdf_urls;`;
        // Cambiar tipo a TEXT ARRAY
        await sql`
            ALTER TABLE agenda_openings 
            ALTER COLUMN pdf_urls TYPE TEXT[] 
            USING CASE 
                WHEN pdf_urls IS NULL THEN NULL 
                WHEN pdf_urls = '' THEN ARRAY[]::TEXT[]
                ELSE ARRAY[pdf_urls] 
            END;
        `;
        console.log('Tabla agenda_openings actualizada.');

        console.log('Migración v7 completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración v7:', error);
        process.exit(1);
    }
}

migrate();
