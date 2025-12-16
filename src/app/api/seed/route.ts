import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import { INITIAL_PERSONNEL } from '@/data/personnel';

export async function GET() {
  const client = await db.connect();

  try {
    await client.sql`BEGIN`;
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Users Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS users (
        email VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) NOT NULL,
        must_change_password BOOLEAN DEFAULT TRUE,
        reset_requested BOOLEAN DEFAULT FALSE,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL
      );
    `;

    // Requests Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS requests (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        coordinator VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        profession VARCHAR(255) NOT NULL,
        professional_name VARCHAR(255) NOT NULL,
        block_type VARCHAR(255) NOT NULL,
        start_date VARCHAR(50) NOT NULL,
        end_date VARCHAR(50) NOT NULL,
        selected_days TEXT NOT NULL, -- JSON string
        start_time VARCHAR(50) NOT NULL,
        end_time VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        agenda_blocked_status VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Agenda Openings Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS agenda_openings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        coordinator VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        profession VARCHAR(255) NOT NULL,
        professional_name VARCHAR(255) NOT NULL,
        performance INTEGER NOT NULL,
        start_time VARCHAR(50) NOT NULL,
        end_time VARCHAR(50) NOT NULL,
        selected_days TEXT NOT NULL, -- JSON string
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Personnel Table
    await client.sql`
      CREATE TABLE IF NOT EXISTS personnel (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        profession VARCHAR(255) NOT NULL
      );
    `;

    // Enable UUID extension if not exists
    await client.sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    // Seed Initial Users
    const initialUsers = [
      { email: 'direccioncesfam@munifutrono.cl', name: 'DIRECTORA CESFAM FUTRONO', role: 'Director' },
      { email: 'calvarado@munifutrono.cl', name: 'Claudio Alvarado', role: 'Admin' },
      { email: 'some.cesfam@munifutrono.cl', name: 'SOME CESFAM', role: 'Admin' },
      { email: 'coordinaciontecnica@munifutrono.cl', name: 'Coordinación Técnica', role: 'Coordinator' },
      { email: 'coordinacions2@munifutrono.cl', name: 'Coordinación S2', role: 'Coordinator' },
      { email: 'coordinacions1@munifutrono.cl', name: 'Coordinación S1', role: 'Coordinator' },
      { email: 'coordinacionsaludrural@munifutrono.cl', name: 'Coordinación Salud Rural', role: 'Coordinator' },
      { email: 'coordinacioncecosf@munifutrono.cl', name: 'Coordinación CECOSF', role: 'Coordinator' },
      { email: 'convenioscesfam@munifutrono.cl', name: 'Convenios CESFAM', role: 'Admin' },
      { email: 'gestiondemandafutrono@munifutrono.cl', name: 'Gestión Demanda Futrono', role: 'Admin' },
      { email: 'kkoandres@gmail.com', name: 'Andrés', role: 'Coordinator' },
      { email: 'proyectogoread@munifutrono.cl', name: 'Proyecto GORE AD', role: 'Coordinator' },
    ];

    const defaultPassword = 'cesfam2026'; // Should be hashed in production

    for (const user of initialUsers) {
      await client.sql`
            INSERT INTO users (email, password, must_change_password, reset_requested, name, role)
            VALUES (${user.email}, ${defaultPassword}, TRUE, FALSE, ${user.name}, ${user.role})
            ON CONFLICT (email) DO NOTHING;
        `;
    }

    // Seed Personnel
    for (const person of INITIAL_PERSONNEL) {
      await client.sql`
            INSERT INTO personnel (name, profession)
            VALUES (${person.name}, ${person.profession})
            ON CONFLICT (name) DO UPDATE SET profession = EXCLUDED.profession;
        `;
    }

    await client.sql`COMMIT`;

    return NextResponse.json({ message: 'Database seeded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Seed error:', error);
    await client.sql`ROLLBACK`;
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
