import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export async function authenticateUser() { return null; }

export async function verifyCredentials(email: string, pass: string) {
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    // Check if the user exists in the Personnel directory
    const allPersonnel = await prisma.personnel.findMany();
    const official = allPersonnel.find(p => p.email && p.email.toLowerCase() === email.toLowerCase());

    if (official && official.email) {
      // Allow generic passwords
      const isGeneric = pass.toLowerCase() === 'cesfam123' || pass.toLowerCase() === 'cesfam2026';
      
      if (isGeneric) {
        // Automatically register the official as an active user with default permissions
        const hashedPassword = await bcrypt.hash(pass, 10);
        user = await prisma.user.create({
          data: {
            email: official.email.toLowerCase(),
            name: official.name,
            password: hashedPassword,
            status: 'active',
            role: 'USUARIO',
            accessLogistica: true,
            accessSolicitudes: true,
            accessReservas: true,
            accessAgendas: true
          }
        });
      }
    }
  }

  if (!user || !user.password) return null;
  const isValid = await bcrypt.compare(pass, user.password);
  if (!isValid) return null;
  return { email: user.email, name: user.name, role: user.role, status: user.status, mustChangePassword: false };
}

export async function updateUserPassword(email: string, pass: string) {
  const hashedPassword = await bcrypt.hash(pass, 10);
  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword }
  });
  return true;
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({ where: { email } });
}

export async function setPasswordResetRequest(email: string, req: boolean) {
  return false;
}

export async function adminResetUserPassword(email: string) {
  return false;
}

export async function getUsers() {
  return await prisma.user.findMany();
}

export async function registerUser(email: string, name: string, pass: string) {
  const hashedPassword = await bcrypt.hash(pass, 10);
  await prisma.user.create({
    data: { email, name, password: hashedPassword, status: 'pending', role: 'USUARIO' }
  });
  return true;
}

export async function updateUserStatusAndRole(
  email: string,
  status: string,
  role: string,
  permissions?: {
    accessLogistica: boolean;
    accessSolicitudes: boolean;
    accessReservas: boolean;
    accessAgendas: boolean;
  }
) {
  const data: any = { status, role };
  if (permissions) {
    data.accessLogistica = permissions.accessLogistica;
    data.accessSolicitudes = permissions.accessSolicitudes;
    data.accessReservas = permissions.accessReservas;
    data.accessAgendas = permissions.accessAgendas;
  }
  await prisma.user.update({
    where: { email },
    data
  });
  return true;
}

export async function deleteUser(email: string) {
  await prisma.user.delete({
    where: { email }
  });
  return true;
}

