import { getDemandsByOrigin } from "@/app/sso/demand/actions";
import RechazosClient from "@/components/sso/RechazosClient";

export const dynamic = "force-dynamic";

export default async function DerivacionesPage() {
  const res = await getDemandsByOrigin("Derivación Interna");
  const data = (res.success && res.data) ? res.data : [];

  const pendientes = data.filter((d: any) => ["📋 Pendiente", "📞 1er Llamado", "📞📞 2do Llamado"].includes(d.status)).length;
  const derivados = data.filter((d: any) => d.status === "🔄 Derivado").length;
  const telesalud = data.filter((d: any) => d.status === "💻 Telesalud").length;
  const resueltos = data.filter((d: any) => ["📅 Agendado", "🙅 Rechaza Atención", "❌ Repetido", "⛔ No Corresponde", "📵 No Ubicable"].includes(d.status)).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestión de Derivaciones</h1>
        <p className="text-slate-500 font-medium">Bandeja de Telesalud y Derivaciones Internas.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pendientes", value: pendientes, color: "text-amber-600" },
          { label: "Derivados", value: derivados, color: "text-emerald-600" },
          { label: "Telesalud", value: telesalud, color: "text-purple-600" },
          { label: "Resueltos", value: resueltos, color: "text-blue-600" },
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
