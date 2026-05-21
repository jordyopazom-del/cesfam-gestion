"use server";

import { prisma } from "@/lib/prisma";
import { getSSOUser } from "@/lib/sso-session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// Verify that the user is an admin before performing operations
async function requireAdmin() {
  const user = await getSSOUser();
  if (user?.role !== "admin") {
    throw new Error("Acceso denegado. Se requieren privilegios de administrador.");
  }
}

export async function getUsers() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        accessLogistica: true,
        accessSolicitudes: true,
        accessReservas: true,
        accessAgendas: true,
      },
      orderBy: { name: "asc" },
    });
    return { success: true, data: users };
  } catch (error: any) {
    console.error("Error getting users:", error);
    return { success: false, error: error.message };
  }
}

export async function createUser(name: string, email: string, pass: string, role: string) {
  try {
    await requireAdmin();
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { success: false, error: "El correo ya está registrado." };
    }

    const passwordHash = await bcrypt.hash(pass, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        role: role.toUpperCase(),
        status: "active",
      },
    });

    revalidatePath("/sso/admin/panel");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating user:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: string) {
  try {
    await requireAdmin();
    
    // Safety check: don't let admins delete themselves or special system users if any
    const user = await getSSOUser();
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (targetUser?.email === user?.email) {
      return { success: false, error: "No puedes eliminar tu propio usuario." };
    }

    await prisma.user.delete({ where: { id } });
    
    revalidatePath("/sso/admin/panel");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { success: false, error: error.message };
  }
}

export async function changeUserPassword(id: string, pass: string) {
  try {
    await requireAdmin();
    const passwordHash = await bcrypt.hash(pass, 10);
    await prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error changing password:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserRoleAndPermissions(
  id: string,
  newRole: string,
  permissions: {
    accessLogistica: boolean;
    accessSolicitudes: boolean;
    accessReservas: boolean;
    accessAgendas: boolean;
  }
) {
  try {
    await requireAdmin();

    const targetUser = await prisma.user.findUnique({ where: { id } });
    const user = await getSSOUser();
    if (targetUser?.email === user?.email && newRole.toUpperCase() !== "ADMIN") {
      return { success: false, error: "No puedes quitarte el rol de Administrador a ti mismo." };
    }

    await prisma.user.update({
      where: { id },
      data: {
        role: newRole.toUpperCase(),
        ...permissions,
      },
    });

    revalidatePath("/sso/admin/panel");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating user role and permissions:", error);
    return { success: false, error: error.message };
  }
}

export async function getBackupDemands() {
  try {
    await requireAdmin();
    const demands = await prisma.demandRequest.findMany({
      orderBy: { requestDate: "desc" },
    });
    return { success: true, data: demands };
  } catch (error: any) {
    console.error("Error getting backup demands:", error);
    return { success: false, error: error.message };
  }
}
