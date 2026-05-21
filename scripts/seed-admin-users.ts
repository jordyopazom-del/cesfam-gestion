import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const admins = [
  { email: 'some.cesfam@munifutrono.cl',          name: 'SOME CESFAM',            password: 'cesfam2026' },
  { email: 'convenioscesfam@munifutrono.cl',       name: 'Convenios CESFAM',       password: 'cesfam2026' },
  { email: 'gestiondemandafutrono@munifutrono.cl', name: 'Gestión Demanda Futrono', password: 'cesfam2026' },
];

async function main() {
  console.log('🚀 Creando/actualizando usuarios como ADMIN...\n');

  for (const u of admins) {
    const hashedPassword = await bcrypt.hash(u.password, 10);

    const result = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: 'ADMIN',
        status: 'active',
        name: u.name,
        password: hashedPassword,
        accessSolicitudes: true,
        accessAgendas: true,
        accessReservas: true,
        accessLogistica: true,
      },
      create: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        role: 'ADMIN',
        status: 'active',
        accessSolicitudes: true,
        accessAgendas: true,
        accessReservas: true,
        accessLogistica: true,
      },
    });

    console.log(`✅ ${result.email} → rol: ${result.role} | estado: ${result.status}`);
  }

  console.log('\n✨ Todos los administradores procesados exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
