import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const newUsers = [
  { name: 'Administrativo Arquilhue', email: 'psrarquilhue@munifutrono.cl' },
  { name: 'Administrativo Curriñe', email: 'psrcurrine@munifutrono.cl' },
  { name: 'Administrativo Llifen', email: 'psrllifen@munifutrono.cl' },
  { name: 'Administrativo Loncopan', email: 'psrloncopan@munifutrono.cl' },
  { name: 'Administrativo Maihue', email: 'psrmaihue@munifutrono.cl' },
];

async function main() {
  console.log('🚀 Iniciando creación de nuevos usuarios administrativos...\n');

  const defaultPassword = 'cesfam2026';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  for (const u of newUsers) {
    // 1. Crear/Actualizar en la tabla de Usuarios (User)
    const userResult = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: 'USUARIO',
        status: 'active',
        password: hashedPassword,
        accessLogistica: true,
        accessSolicitudes: true,
        accessReservas: true,
        accessAgendas: true,
      },
      create: {
        email: u.email,
        name: u.name,
        role: 'USUARIO',
        status: 'active',
        password: hashedPassword,
        accessLogistica: true,
        accessSolicitudes: true,
        accessReservas: true,
        accessAgendas: true,
      },
    });

    console.log(`✅ Usuario Creado/Actualizado: ${userResult.name} (${userResult.email})`);

    // 2. Crear/Actualizar en la tabla de Personal (Personnel)
    // Buscamos si ya existe por nombre único
    const existingPersonnel = await prisma.personnel.findUnique({
      where: { name: u.name },
    });

    if (existingPersonnel) {
      await prisma.personnel.update({
        where: { name: u.name },
        data: {
          email: u.email,
          profession: 'Administrativo',
          type: 'ADMINISTRATIVO',
        },
      });
      console.log(`   🔄 Personal Actualizado en el directorio: ${u.name}`);
    } else {
      await prisma.personnel.create({
        data: {
          name: u.name,
          email: u.email,
          profession: 'Administrativo',
          type: 'ADMINISTRATIVO',
        },
      });
      console.log(`   ➕ Personal Creado en el directorio: ${u.name}`);
    }
  }

  console.log('\n✨ Todos los usuarios nuevos se han agregado exitosamente al sistema.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el proceso de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
