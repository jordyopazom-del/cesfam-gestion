import { Clock } from "lucide-react";
import DemandaDashboard from "@/components/demanda/DemandaDashboard";

export default function HorasPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Clock className="h-8 w-8 text-blue-600 animate-pulse" /> Estado de Horas
        </h1>
        <p className="text-slate-500 font-medium">
          Módulo de visualización y analítica para la distribución de horas en APS.
        </p>
      </div>

      <DemandaDashboard />
    </div>
  );
}
