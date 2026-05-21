import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const excelData = [
  { p: "Acuña", m: "Arao", n: "Patricio Alejandro", rut: "12262734-9", nac: "25-10-72", email: "palejandro.a@gmail.com", cargo: "Conductor" },
  { p: "Rodriguez", m: "Hernandez", n: "Aimee", rut: "24939507-2", nac: "27-08-66", email: "aimee.r1966@gmail.com", cargo: "Medico" },
  { p: "Godoy", m: "Campusano", n: "Alejandra Andrea", rut: "12837330-6", nac: "30-09-74", email: "alejandragodoyc@gmail.com", cargo: "Administrativo" },
  { p: "Godoy", m: "Coronao", n: "Alejandra Patricia", rut: "16929628-6", nac: "07-10-88", email: "alejandragodoy28@gmail.com", cargo: "Enfermera(O)" },
  { p: "Aguayo", m: "Vidal", n: "Romina", rut: "19174969-3", nac: "18-09-95", email: "rominaaguayov@gmail.com", cargo: "Administrativo" },
  { p: "Agüero", m: "Hernández", n: "Karen Andrea", rut: "17863299-K", nac: "08-03-91", email: "karenaguerol@gmail.com", cargo: "Enfermera(O)" },
  { p: "Aguilera", m: "Quintana", n: "Oldenis", rut: "12119555-0", nac: "26-07-65", email: "oldi.aguilera@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Alvarado", m: "Muñoz", n: "Claudio Andrés", rut: "13401714-7", nac: "16-08-78", email: "kkoandres@gmail.com", cargo: "Informatico" },
  { p: "Perez", m: "Rosales", n: "Ana Patricia", rut: "7911199-6", nac: "27-07-56", email: "apperezr@gmail.com", cargo: "Enfermera(O)" },
  { p: "Jaure", m: "Villarroel", n: "Andrea Beatriz", rut: "16168472-4", nac: "12-06-85", email: "andreajaurev@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Anabalon", m: "Gutierrez", n: "Eder Andres", rut: "15849337-3", nac: "09-05-84", email: "eder.anabalon@gmail.com", cargo: "Profesor Educación Fisica" },
  { p: "Angulo", m: "Grandon", n: "Natalia Andrea", rut: "19272168-7", nac: "26-09-95", email: "natalia.angulo@gmail.com", cargo: "Nutricionista" },
  { p: "Antillanca", m: "Ñancumil", n: "Emilia Alejandra", rut: "20881915-1", nac: "23-09-01", email: "emiliantillanca@gmail.com", cargo: "Nutricionista" },
  { p: "Arriagada", m: "Merino", n: "Constanza Maria", rut: "18133041-4", nac: "15-04-92", email: "arriagadamaria@gmail.com", cargo: "Odontologo" },
  { p: "Tapia", m: "Arrate", n: "Angelica Maria", rut: "15265924-5", nac: "27-02-80", email: "angearrate@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Asenjo", m: "Calderón", n: "Aníbal Cornelio", rut: "18843786-9", nac: "13-09-94", email: "anibalasenjo@gmail.com", cargo: "Conductor" },
  { p: "Avendaño", m: "Chocano", n: "Katherine Edith", rut: "19552786-5", nac: "29-01-97", email: "katherineavenda@gmail.com", cargo: "Administrativo" },
  { p: "Ávila", m: "Vera", n: "Nicoll Magdali", rut: "17694362-9", nac: "22-02-91", email: "pbrfernandez@gmail.com", cargo: "Odontologo" },
  { p: "Bravo", m: "De La Guarda", n: "Armando Emilio", rut: "15548342-3", nac: "04-09-83", email: "armbravo@gmail.com", cargo: "Odontologo" },
  { p: "Maclean", m: "Acuña", n: "Barbara Rocio", rut: "18776279-0", nac: "16-02-87", email: "barbara.maclean@gmail.com", cargo: "Odontologo" },
  { p: "Ballestero", m: "Cardenas", n: "Rodrigo Valente", rut: "20176576-5", nac: "29-05-99", email: "rodrigo.ballestero@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Barra", m: "Godoy", n: "Eduardo Rodrigo", rut: "15712860-4", nac: "07-04-84", email: "eduardobarrag@gmail.com", cargo: "Auxiliar De Servicio" },
  { p: "Vera", m: "Quijon", n: "Camilo Antonio", rut: "16871292-8", nac: "20-11-87", email: "camilov87@gmail.com", cargo: "Terapeuta Ocupacional" },
  { p: "Barra", m: "Martinez", n: "Javier Alejandro", rut: "16543205-3", nac: "20-03-87", email: "javierbarra.n@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Beltran", m: "Pardo", n: "Catalina Paz", rut: "19485663-6", nac: "30-01-97", email: "dra.catalinapardo@gmail.com", cargo: "Medico" },
  { p: "Borquez", m: "Aguero", n: "Trachael Darlene", rut: "19555031-K", nac: "04-06-97", email: "trachael.danny@gmail.com", cargo: "Enfermera(O)" },
  { p: "Boutaud", m: "Miranda", n: "Carla Daniela", rut: "18288676-9", nac: "14-01-93", email: "carla.boutaud@gmail.com", cargo: "Matron(A)" },
  { p: "Pulgar", m: "Segovia", n: "Carlos Emilio", rut: "20469606-3", nac: "25-03-00", email: "carlospulgarc@gmail.com", cargo: "Medico" },
  { p: "Roa", m: "Torres", n: "Carolina Andrea", rut: "13319395-2", nac: "03-02-77", email: "estadisticasfutrono@gmail.com", cargo: "Tecnico Administrativo Nivel Superior" },
  { p: "Bravo", m: "Balmaceda", n: "Eduardo Sebastian", rut: "15384966-8", nac: "23-03-83", email: "bravobaleduard@gmail.com", cargo: "Quimico Farmaceutico" },
  { p: "Cabezas", m: "Cabezas", n: "Evelyn Prisila", rut: "18843876-8", nac: "27-03-90", email: "evelyncabezas@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Jobis", m: "Pizarro", n: "Carolina Fabiola", rut: "18549377-6", nac: "31-05-93", email: "carito.jobis@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Cabrera", m: "Gatica", n: "Dina Nicol", rut: "16929519-0", nac: "17-06-88", email: "cdina1494@gmail.com", cargo: "Tecnico De Nivel Superior" },
  { p: "Canelo", m: "Nigoevic", n: "Constanza", rut: "20471624-2", nac: "10-07-00", email: "", cargo: "Medico" },
  { p: "Cardenas", m: "Fuentealba", n: "Valentina Paz", rut: "20076787-K", nac: "21-11-98", email: "valeecardenas@gmail.com", cargo: "Matron(A)" },
  { p: "Cárdenas", m: "Azocar", n: "Sofia Elizabeth", rut: "20924675-9", nac: "13-06-01", email: "sofiaazocar1@gmail.com", cargo: "Tecnico De Nivel Superior" }
];

function getAreaType(cargo: string): "CLINICO" | "ADMINISTRATIVO" {
  const c = cargo.toUpperCase();
  if (
    c.includes("CONDUCTOR") ||
    c.includes("ADMINISTRATIVO") ||
    c.includes("INFORMATICO") ||
    c.includes("SERVICIO")
  ) {
    return "ADMINISTRATIVO";
  }
  return "CLINICO";
}

async function main() {
  console.log(`🚀 Iniciando importación de ${excelData.length} funcionarios desde el Excel...`);

  for (const item of excelData) {
    // 1. Reconstruir nombre completo en Mayúsculas
    const rawFullName = `${item.n} ${item.p} ${item.m}`.trim();
    const fullName = rawFullName.toUpperCase();
    const cleanEmail = item.email.trim().toLowerCase() || null;
    const cleanCargo = item.cargo.trim();
    const areaType = getAreaType(cleanCargo);

    console.log(`Processing: ${fullName} (${cleanCargo})`);

    // 2. Cargar en tabla Personnel (Agendas)
    await prisma.personnel.upsert({
      where: { name: fullName },
      update: {
        profession: cleanCargo.toUpperCase(),
        email: cleanEmail,
        type: areaType
      },
      create: {
        name: fullName,
        profession: cleanCargo.toUpperCase(),
        email: cleanEmail,
        type: areaType
      }
    });

    // 3. Cargar en tabla PersonalLogistica (Logística)
    const existingLogistica = await prisma.personalLogistica.findFirst({
      where: { nombre: fullName }
    });

    if (existingLogistica) {
      await prisma.personalLogistica.update({
        where: { id: existingLogistica.id },
        data: {
          especialidad: cleanCargo,
          correo: cleanEmail,
          disponibilidad: true
        }
      });
    } else {
      await prisma.personalLogistica.create({
        data: {
          nombre: fullName,
          especialidad: cleanCargo,
          correo: cleanEmail,
          disponibilidad: true
        }
      });
    }
  }

  console.log("✅ ¡Importación masiva completada con éxito en ambas tablas!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Error durante el seed de excel:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
