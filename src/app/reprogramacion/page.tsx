import { getSSOUser } from "@/lib/sso-session";
import { getActiveBlocks, getHistoryBlocks } from "./actions";
import ReproClient from "@/components/sso/ReproClient";

export const dynamic = "force-dynamic";

export default async function ReprogramacionPage() {
  const user = await getSSOUser();
  const [blocksRes, historyRes] = await Promise.all([getActiveBlocks(), getHistoryBlocks()]);
  const activeBlocks = (blocksRes.success && blocksRes.data) ? blocksRes.data : [];
  const historyBlocks = (historyRes.success && historyRes.data) ? historyRes.data : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
          📅 Reprogramación por Bloqueos (RAS)
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          Gestión de pacientes afectados por bloqueos de agenda de profesionales.
        </p>
      </div>
      <ReproClient
        initialActiveBlocks={activeBlocks}
        initialHistoryBlocks={historyBlocks}
        userRole={user?.role || "gestor"}
        userEmail={user?.email || ""}
        userName={user?.name || ""}
      />
    </div>
  );
}
