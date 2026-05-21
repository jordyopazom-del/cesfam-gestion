import { Clock, Sparkles, Calendar, TrendingUp } from "lucide-react";

export default function HorasPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Clock className="h-8 w-8 text-blue-600 animate-pulse" /> Estado de Horas
        </h1>
        <p className="text-slate-500 font-medium">
          Visualización y analítica del rendimiento de horas médicas y no médicas en APS.
        </p>
      </div>

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-slate-700/50 flex flex-col items-center text-center space-y-6">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/30 rounded-full blur-xl animate-ping" />
          <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
        </div>

        <div className="space-y-2 max-w-xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            ⚡ PRÓXIMO MÓDULO
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Optimización y Control de Agenda Médica
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Herramienta avanzada para el monitoreo de la oferta, demanda y rendimiento de horas asistenciales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-6">
          {[
            { icon: Calendar, label: "Disponibilidad en Tiempo Real", color: "blue", desc: "Monitoreo continuo de cupos disponibles por sector y policlínico." },
            { icon: TrendingUp, label: "Control de Inasistencias (NSP)", color: "amber", desc: "Métricas clave de ausentismo para implementar recordatorios." },
            { icon: Clock, label: "Rendimiento por Profesional", color: "indigo", desc: "Gráficos de productividad clínica para planificación de turnos." },
          ].map(({ icon: Icon, label, color, desc }) => (
            <div key={label} className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 hover:border-white/20 transition-all text-left space-y-3">
              <div className={`p-2.5 rounded-xl bg-${color}-500/20 text-${color}-400 w-fit`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-white text-sm">{label}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
