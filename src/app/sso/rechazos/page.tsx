import { getDemandsByOrigin } from "@/app/sso/demand/actions";
import RechazosClient from "@/components/sso/RechazosClient";

export const dynamic = "force-dynamic";

export default async function RechazosPage() {
  const res = await getDemandsByOrigin("Rechazo");
  const data = (res.success && res.data) ? res.data : [];

  const pendientes = data.filter((d: any) => ["📋 Pendiente", "📞 1er Llamado", "📞📞 2do Llamado"].includes(d.status)).length;
  const agendados = data.filter((d: any) => d.status === "📅 Agendado").length;
  const telesalud = data.filter((d: any) => d.status === "💻 Telesalud").length;
  const noUbicables = data.filter((d: any) => d.status === "📵 No Ubicable").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestión de Rechazos</h1>
        <p className="text-slate-500 font-medium">Bandeja operativa para gestionar pacientes derivados desde SOME.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pendientes", value: pendientes, color: "text-amber-600" },
          { label: "Agendados", value: agendados, color: "text-emerald-600" },
          { label: "Telesalud", value: telesalud, color: "text-purple-600" },
          { label: "No Ubicables", value: noUbicables, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="text-sm font-bold text-slate-500">{label}</div>
            <div className={`text-xl font-black ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <RechazosClient data={data} />
    </div>
  );
}
