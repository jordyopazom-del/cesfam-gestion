import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== VERIFICANDO CONECTIVIDAD Y TABLAS DEL SISTEMA ===");
  const tables = [
    { name: "User", count: () => prisma.user.count() },
    { name: "Account", count: () => prisma.account.count() },
    { name: "Session", count: () => prisma.session.count() },
    { name: "Personnel", count: () => prisma.personnel.count() },
    { name: "AgendaBlockRequest", count: () => prisma.agendaBlockRequest.count() },
    { name: "AgendaOpening", count: () => prisma.agendaOpening.count() },
    { name: "SolicitudAdministrativa", count: () => prisma.solicitudAdministrativa.count() },
    { name: "Balance", count: () => prisma.balance.count() },
    { name: "Room", count: () => prisma.room.count() },
    { name: "Asset", count: () => prisma.asset.count() },
    { name: "Reservation", count: () => prisma.reservation.count() },
    { name: "ReservationAsset", count: () => prisma.reservationAsset.count() },
    { name: "RoomSchedule", count: () => prisma.roomSchedule.count() },
    { name: "Posta", count: () => prisma.posta.count() },
    { name: "Vehiculo", count: () => prisma.vehiculo.count() },
    { name: "PersonalLogistica", count: () => prisma.personalLogistica.count() },
    { name: "Ronda", count: () => prisma.ronda.count() },
    { name: "SolicitudSalida", count: () => prisma.solicitudSalida.count() },
    { name: "PacienteLogistica", count: () => prisma.pacienteLogistica.count() },
    { name: "AgendaBlock", count: () => prisma.agendaBlock.count() },
    { name: "BlockedPatient", count: () => prisma.blockedPatient.count() },
    { name: "DemandRequest", count: () => prisma.demandRequest.count() },
    { name: "DemandAuditLog", count: () => prisma.demandAuditLog.count() }
  ];

  for (const t of tables) {
    try {
      const c = await t.count();
      console.log(`✅ Tabla [${t.name}]: ${c} registros`);
    } catch (err: any) {
      console.log(`❌ Error en Tabla [${t.name}]: ${err.message}`);
    }
  }

  console.log("\n=== COMPROBACIÓN DE USUARIO ADMINISTRADOR ===");
  try {
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    });
    if (admin) {
      console.log(`✅ Administrador encontrado: ${admin.email} (Nombre: ${admin.name}, Estado: ${admin.status})`);
    } else {
      console.log("⚠️ No se encontró ningún usuario con rol ADMIN");
    }
  } catch (err: any) {
    console.log(`❌ Error al buscar administrador: ${err.message}`);
  }

  await prisma.$disconnect();
}

main();
