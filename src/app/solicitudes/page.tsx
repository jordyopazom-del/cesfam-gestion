'use client';

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/solicitudes/DashboardLayout";
import OfficialDashboard from "@/components/solicitudes/OfficialDashboard";
import AdminDashboard from "@/components/solicitudes/AdminDashboard";
import OfficialsModule from "@/components/solicitudes/OfficialsModule";
import ReportsModule from "@/components/solicitudes/ReportsModule";
import { useRouter } from "next/navigation";

interface UserData {
    role: string;
    balances: { type: string; total: number; remaining: number }[];
    requests: { id: string; type: string; start_date: Date; end_date: Date; status: string; days: number; description: string | null }[];
}

interface AdminDashboardData {
    allPendingRequests: { id: string; type: string; start_date: Date; end_date: Date; days: number; status: string; description: string | null; user: { name: string | null; email: string } }[];
    todayAbsencesCount: number;
    monthAbsences: Record<number, string[]>;
}

export default function SolicitudesPage() {
    const router = useRouter();
    const [view, setView] = useState('inicio');
    const [userData, setUserData] = useState<UserData | null>(null);
    const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await fetch('/api/solicitudes/dashboard');
            if (res.status === 401) {
                router.push('/login');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                const processedUser: UserData = {
                    ...data.user,
                    requests: data.user.requests.map((req: { start_date: string; end_date: string;[key: string]: any }) => ({
                        ...req,
                        start_date: new Date(req.start_date),
                        end_date: new Date(req.end_date)
                    }))
                };
                setUserData(processedUser);
                if (data.user.role === 'ADMIN') {
                    const processedAdmin: AdminDashboardData = {
                        ...data.adminData,
                        allPendingRequests: data.adminData.allPendingRequests.map((req: { start_date: string; end_date: string;[key: string]: any }) => ({
                            ...req,
                            start_date: new Date(req.start_date),
                            end_date: new Date(req.end_date)
                        }))
                    };
                    setAdminData(processedAdmin);
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Cargando módulo de Solicitudes...</div>;
    }

    if (!userData) return null;

    return (
        <DashboardLayout
            balances={userData.balances}
            activeView={view}
            onViewChange={(v) => setView(v)}
        >
            {userData.role === 'ADMIN' ? (
                <>
                    {view === 'inicio' ? (
                        <AdminDashboard
                            pendingRequests={adminData?.allPendingRequests || []}
                            todayAbsences={adminData?.todayAbsencesCount || 0}
                            calendarData={adminData?.monthAbsences || {}}
                        />
                    ) : view === 'funcionarios' ? (
                        <OfficialsModule />
                    ) : view === 'reportes' ? (
                        <ReportsModule />
                    ) : (
                        <div className="glass-panel" style={{ padding: '2rem', background: 'white', borderRadius: '8px' }}>Módulo en construcción</div>
                    )}
                </>
            ) : (
                <OfficialDashboard balances={userData.balances} requests={userData.requests} userName={userData.role} />
            )}
        </DashboardLayout>
    );
}
