import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@cesfam.cl';
  const password = 'admin'; // Contraseña temporal
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      accessLogistica: true,
      accessSolicitudes: true,
      accessReservas: true,
      accessAgendas: true
    },
    create: {
      email: email,
      name: 'Administrador Sistema',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'active',
      accessLogistica: true,
      accessSolicitudes: true,
      accessReservas: true,
      accessAgendas: true
    },
  });
  
  console.log('✅ Usuario Administrador Creado con éxito!');
  console.log('-------------------------------------------');
  console.log(`Email: ${user.email}`);
  console.log(`Clave: ${password}`);
  console.log('-------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error creando usuario:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
