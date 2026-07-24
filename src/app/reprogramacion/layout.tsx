import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Toaster } from "react-hot-toast";

export default function ReprogramacionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center">
          <Link 
            href="/"
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium text-sm bg-slate-100 hover:bg-blue-50 px-4 py-2 rounded-lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Inicio
          </Link>
          <div className="ml-6 font-bold text-slate-800 border-l border-slate-200 pl-6">
            Módulo de Reprogramación
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
