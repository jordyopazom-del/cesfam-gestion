import { sql } from '@vercel/postgres';

process.env.POSTGRES_URL = "postgresql://neondb_owner:npg_AkZu5qHOP2Mx@ep-rough-star-adt8q611-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function migrate() {
    console.log('Iniciando migración v4 (ampliación de columnas pdf_url)...');

    try {
        // Change pdf_url to TEXT for both tables to support base64 storage
        await sql`ALTER TABLE requests ALTER COLUMN pdf_url TYPE TEXT;`
            .catch(e => console.log('Requests column might already be correct or table missing:', e.message));
        console.log('Columna pdf_url en requests cambiada a TEXT.');

        await sql`ALTER TABLE agenda_openings ALTER COLUMN pdf_url TYPE TEXT;`
            .catch(e => console.log('Agenda_openings column might already be correct or table missing:', e.message));
        console.log('Columna pdf_url en agenda_openings cambiada a TEXT.');

        console.log('Migración v4 completada con éxito.');
        process.exit(0);
    } catch (error) {
        console.error('Error durante la migración v4:', error);
        process.exit(1);
    }
}

migrate();
