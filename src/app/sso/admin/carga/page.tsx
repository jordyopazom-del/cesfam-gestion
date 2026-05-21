import { getSSOUser } from "@/lib/sso-session";
import { redirect } from "next/navigation";
import CargaClient from "@/components/sso/CargaClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Carga de Datos | SSO CESFAM",
};

export default async function CargaPage() {
  const user = await getSSOUser();
  if (user?.role !== "admin") {
    redirect("/sso/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Administración de Datos</h1>
        <p className="text-slate-500 font-medium">Sube archivos Excel para alimentar la base de datos de gestión de demanda.</p>
      </div>
      
      <CargaClient />
    </div>
  );
}
