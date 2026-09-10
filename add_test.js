const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const fullName = "CONSTANZA GALLARDO GOME";
  const cleanCargo = "KINESIOLOGO";
  const cleanEmail = "conny.gallardo98@gmail.com";
  
  try {
    const res = await prisma.personnel.create({
        data: {
            name: fullName,
            profession: cleanCargo,
            type: 'CLINICO',
            email: cleanEmail,
            birthDate: '25-10-1972'
        }
    });
    console.log("Personnel success", res);
  } catch(e) {
    console.log("Error en Personnel", e);
  }
}
main().finally(() => prisma.$disconnect());
