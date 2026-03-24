'use server';

import { sql } from '@vercel/postgres';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

export interface Official {
    name: string;
    profession: string;
    type?: 'CLINICO' | 'ADMINISTRATIVO' | 'COORDINADOR';
}

export async function getPersonnel(): Promise<Official[]> {
    noStore();
    try {
        // Migration: Add type column if it doesn't exist
        await sql`ALTER TABLE personnel ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'CLINICO'`;
        
        // Migration: Unify professions
        await sql`UPDATE personnel SET profession = 'FONOAUDIÓLOGA/O' WHERE profession = 'FONOAUDIOLOGO'`;
        await sql`UPDATE personnel SET profession = 'TRABAJADORA/O SOCIAL' WHERE profession LIKE '%TRABAJADOR%SOCIAL%' OR profession LIKE '%TRABAJADORA/O SOCIAL%'`;
        await sql`UPDATE personnel SET profession = 'ODONTOLOGO' WHERE profession ILIKE 'ODONTOLOGA%' OR profession ILIKE 'ODONTÓLOGA%'`;
        await sql`UPDATE personnel SET name = UPPER(TRIM(name)), profession = UPPER(TRIM(profession))`;
        await sql`UPDATE personnel SET profession = 'ODONTOLOGO' WHERE name ILIKE 'CATALINA%DIAZ%'`;

        // Migration: Assign types based on profession or name
        await sql`UPDATE personnel SET type = 'ADMINISTRATIVO' WHERE profession IN ('ADMINISTRATIVO', 'SECRETARIA', 'TECNICO')`;
        await sql`UPDATE personnel SET type = 'COORDINADOR' WHERE profession LIKE '%COORDINADOR%' OR name IN ('ANDRES', 'CLAUDIO ALVARADO', 'GESTION DEMANDA FUTRONO', 'PROYECTO GORE AD', 'CONVENIOS CESFAM', 'DIRECTORA CESFAM FUTRONO')`;
        // Defaults to CLINICO as per column definition

        // Migration: Remove inactive personnel
        await sql`DELETE FROM personnel WHERE name = 'VALERIA SOLIS' OR name = 'CAROLINA OSES'`;

        // Migration: Add new psychologists
        await sql`INSERT INTO personnel (name, profession) VALUES ('BARBARA CORTEZ', 'PSICOLOGA/O') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('ELISABETH REYES', 'PSICOLOGA/O') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('CATALINA ROMERO', 'PSICOLOGA/O') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('ALVARO PEREIRA', 'ORTODONCISTA') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('JACQUELINE RAUQUE', 'TERAPEUTA OCUPACIONAL') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('YOSETT SANDOVAL', 'MATRONA/ÓN') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('JOAQUIN VELASQUEZ', 'PSICOLOGA/O') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('VICTORIA SALDIVIA', 'ENFERMERA/O') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('NICOL RIVAS', 'KINESIOLOGA/O') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('KATHERINE ZUÑIGA', 'TRABAJADORA/O SOCIAL') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('ANDRES FLANDEZ', 'KINESIOLOGA/O') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('KATHERINE ROMERO', 'MEDICO') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('NICOLL AVILA', 'ODONTOLOGO') ON CONFLICT (name) DO NOTHING`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('CATALINA DIAZ', 'ODONTOLOGO') ON CONFLICT (name) DO UPDATE SET profession = 'ODONTOLOGO'`;
        await sql`INSERT INTO personnel (name, profession) VALUES ('IGNACIO MONTECINOS', 'ENFERMERA/O') ON CONFLICT (name) DO NOTHING`;
        await sql`UPDATE personnel SET profession = 'ODONTOLOGO' WHERE name = 'CATALINA DIAZ'`;

        const { rows } = await sql`SELECT * FROM personnel ORDER BY name ASC`;
        return rows.map(row => ({
            name: row.name,
            profession: row.profession,
            type: row.type as any
        }));
    } catch (error) {
        console.error('Error reading personnel data:', error);
        return [];
    }
}

export async function addOfficial(official: Official): Promise<void> {
    try {
        await sql`
            INSERT INTO personnel (name, profession, type)
            VALUES (${official.name}, ${official.profession}, ${official.type || 'CLINICO'})
        `;
        revalidatePath('/admin/personnel');
    } catch (error) {
        console.error('Error adding official:', error);
        throw error;
    }
}

export async function updateOfficial(oldName: string, updatedOfficial: Official): Promise<void> {
    try {
        await sql`
            UPDATE personnel 
            SET name = ${updatedOfficial.name}, profession = ${updatedOfficial.profession}, type = ${updatedOfficial.type}
            WHERE name = ${oldName}
        `;
        revalidatePath('/admin/personnel');
    } catch (error) {
        console.error('Error updating official:', error);
        throw error;
    }
}

export async function deleteOfficial(name: string): Promise<void> {
    try {
        await sql`DELETE FROM personnel WHERE name = ${name}`;
        revalidatePath('/admin/personnel');
    } catch (error) {
        console.error('Error deleting official:', error);
        throw error;
    }
}
