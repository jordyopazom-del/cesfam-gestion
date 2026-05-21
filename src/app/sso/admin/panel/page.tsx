import { getSSOUser } from "@/lib/sso-session";
import { redirect } from "next/navigation";
import { getUsers } from "./actions";
import PanelClient from "@/components/sso/PanelClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Panel de Administración | SSO CESFAM",
};

export default async function AdminPanelPage() {
  const user = await getSSOUser();
  if (user?.role !== "admin") {
    redirect("/sso/dashboard");
  }

  const usersRes = await getUsers();
  const users = (usersRes.success && usersRes.data) ? usersRes.data : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Panel de Administración</h1>
        <p className="text-slate-500 font-medium">Gestiona los funcionarios del sistema, sus roles, permisos por módulo y respaldos de datos.</p>
      </div>
      
      <PanelClient initialUsers={users} />
    </div>
  );
}
