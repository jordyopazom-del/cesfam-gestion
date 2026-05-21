"use server";

import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

/**
 * Adapts the cesfam_session JWT to the SSO user profile format
 * ADMIN role maps to "admin" (full access), anything else → "gestor"
 */
export async function getSSOUser() {
  const session = await getSession();
  if (!session?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.email },
    select: { name: true, email: true, role: true },
  });

  if (!user) return null;

  return {
    name: user.name || user.email || "Usuario",
    email: user.email || "",
    role: user.role === "ADMIN" ? "admin" : "gestor",
  };
}
