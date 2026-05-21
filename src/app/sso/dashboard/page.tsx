import { getAllDemands } from "@/app/sso/demand/actions";
import DashboardClient from "@/components/sso/DashboardClient";

export const dynamic = "force-dynamic";

export default async function SSODashboardPage() {
  const res = await getAllDemands();
  const demands = (res.success && res.data) ? res.data : [];

  // Map Prisma field names to the format expected by DashboardClient
  const mappedDemands = demands.map((d: any) => ({
    id: d.id,
    rut: d.rut,
    full_name: d.fullName,
    age: d.age,
    request_date: d.requestDate,
    origin: d.origin,
    policlinic: d.policlinic,
    priority: d.priority,
    status: d.status,
    pregnancy: d.pregnancy,
    updated_at: d.updatedAt?.toISOString?.() || d.updatedAt || null,
  }));

  const auditLogs = demands.flatMap((d: any) =>
    (d.auditLogs || []).map((log: any) => ({
      demand_request_id: log.demandRequestId,
      timestamp: log.timestamp?.toISOString?.() || log.timestamp,
      new_value: log.newValue,
    }))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
      <DashboardClient demands={mappedDemands} auditLogs={auditLogs} />
    </div>
  );
}
