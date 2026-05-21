import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const users = [
  { email: 'proyectogoread@munifutrono.cl',       name: 'Proyecto GORE AD',       password: 'cesfam2026' },
  { email: 'direccioncesfam@munifutrono.cl',       name: 'DIRECTORA CESFAM FUTRONO', password: 'cesfam2026' },
  { email: 'coordinaciontecnica@munifutrono.cl',   name: 'Coordinación Técnica',   password: 'cesfam2026' },
  { email: 'coordinacionsaludrural@munifutrono.cl',name: 'Coordinación Salud Rural',password: 'cesfam2026' },
  { email: 'coordinacioncecosf@munifutrono.cl',    name: 'Coordinación CECOSF',    password: 'cesfam2026' },
  { email: 'coordinacions1@munifutrono.cl',        name: 'Coordinación S1',        password: 'cesfam2026' },
  { email: 'coordinacions2@munifutrono.cl',        name: 'Coordinación S2',        password: 'cesfam2026' },
];

async function main() {
  console.log('🚀 Creando/actualizando usuarios coordinadores como SOLICITANTE...\n');

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);

    const result = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: 'SOLICITANTE',
        status: 'active',
        name: u.name,
        password: hashedPassword,
        accessSolicitudes: true,
        accessAgendas: false,
        accessReservas: false,
        accessLogistica: false,
      },
      create: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        role: 'SOLICITANTE',
        status: 'active',
        accessSolicitudes: true,
        accessAgendas: false,
        accessReservas: false,
        accessLogistica: false,
      },
    });

    console.log(`✅ ${result.email} → rol: ${result.role} | estado: ${result.status}`);
  }

  console.log('\n✨ Todos los usuarios procesados exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
