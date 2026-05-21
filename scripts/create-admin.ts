import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'calvarado@munifutrono.cl';
  const password = await bcrypt.hash('160878', 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
      role: 'ADMIN',
      name: 'Claudio Alvarado',
      status: 'active'
    },
    create: {
      email,
      password,
      role: 'ADMIN',
      name: 'Claudio Alvarado',
      status: 'active'
    },
  });

  console.log('Usuario administrador creado/actualizado:', user.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
