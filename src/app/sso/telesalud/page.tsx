import { getTelesaludDemands } from "@/app/sso/demand/actions";
import TelesaludClient from "@/components/sso/TelesaludClient";

export const dynamic = "force-dynamic";

export default async function TelesaludPage() {
  const res = await getTelesaludDemands();
  const data = (res.success && res.data) ? res.data : [];

  const total = data.length;
  const alta = data.filter((d: any) => {
    const diff = Math.floor((Date.now() - new Date(d.requestDate).getTime()) / 86400000);
    return diff > 30;
  }).length;
  const media = data.filter((d: any) => {
    const diff = Math.floor((Date.now() - new Date(d.requestDate).getTime()) / 86400000);
    return diff > 15 && diff <= 30;
  }).length;
  const reciente = data.filter((d: any) => {
    const diff = Math.floor((Date.now() - new Date(d.requestDate).getTime()) / 86400000);
    return diff <= 15;
  }).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          💻 Gestión Telesalud
        </h1>
        <p className="text-slate-500 font-medium">
          Bandeja exclusiva de pacientes derivados a Telesalud — en espera de gestión y agendamiento.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total en Telesalud", value: total, color: "text-purple-600" },
          { label: "Prioridad Alta", value: alta, color: "text-rose-600" },
          { label: "Prioridad Media", value: media, color: "text-orange-600" },
          { label: "Recientes (≤15 días)", value: reciente, color: "text-emerald-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div className="text-sm font-bold text-slate-500">{label}</div>
            <div className={`text-xl font-black ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <TelesaludClient data={data} />
    </div>
  );
}
