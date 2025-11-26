'use client';

import { useState, useEffect } from 'react';
import { getPersonnel, Official } from '../../admin/personnel/actions';
import { Calendar, User, Search, BarChart3 } from 'lucide-react';
import { getRequests, BlockRequest } from '../../actions/requests';

interface OfficialStats {
    name: string;
    profession: string;
    totalBlocks: number;
    approvedBlocks: number;
    pendingBlocks: number;
    rejectedBlocks: number;
}

export default function BlockReportPage() {
    const [stats, setStats] = useState<OfficialStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            // Load personnel
            const personnel = await getPersonnel();

            // Load requests (assuming we can fetch them from an API or server action)
            // For now, we'll fetch from the API route we likely have or will create.
            // Since I don't have a direct server action for requests yet, I'll assume there's an endpoint
            // or I'll read the file directly if I was server-side, but this is a client component.
            // Let's assume we fetch from /api/requests or similar. 
            // Wait, I should probably create a server action for fetching requests too to be consistent.
            // For this step, I'll implement a fetch to a hypothetical endpoint or server action.
            // Let's create a server action for reports in the same file or a new one.

            // TEMPORARY: Fetching from the file directly via a server action I'll create below.
            const requests = await getRequests();

            const statsMap = new Map<string, OfficialStats>();

            // Initialize stats for all personnel
            personnel.forEach(p => {
                statsMap.set(p.name, {
                    name: p.name,
                    profession: p.profession,
                    totalBlocks: 0,
                    approvedBlocks: 0,
                    pendingBlocks: 0,
                    rejectedBlocks: 0
                });
            });

            // Aggregate stats
            requests.forEach((req: BlockRequest) => {
                const officialStats = statsMap.get(req.professionalName);
                if (officialStats) {
                    officialStats.totalBlocks++;
                    if (req.status === 'Authorized') officialStats.approvedBlocks++;
                    else if (req.status === 'Pending') officialStats.pendingBlocks++;
                    else if (req.status === 'Rejected') officialStats.rejectedBlocks++;
                }
            });

            setStats(Array.from(statsMap.values()));
        } catch (error) {
            console.error('Failed to load report data:', error);
        } finally {
            setLoading(false);
        }
    }

    const filteredStats = stats.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.profession.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <h1 className="text-3xl font-bold mb-8 text-gray-800 flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                Reporte de Bloqueos por Funcionario
            </h1>

            <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-gray-100">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o profesión..."
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando reporte...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium">
                                <tr>
                                    <th className="p-4">Funcionario</th>
                                    <th className="p-4">Profesión</th>
                                    <th className="p-4 text-center">Total Solicitudes</th>
                                    <th className="p-4 text-center text-green-600">Aprobadas</th>
                                    <th className="p-4 text-center text-yellow-600">Pendientes</th>
                                    <th className="p-4 text-center text-red-600">Rechazadas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStats.map((s, index) => (
                                    <tr key={`${s.name}-${index}`} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-gray-800 flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            {s.name}
                                        </td>
                                        <td className="p-4 text-gray-600">
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                                {s.profession}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center font-semibold">{s.totalBlocks}</td>
                                        <td className="p-4 text-center text-green-600 font-medium">{s.approvedBlocks}</td>
                                        <td className="p-4 text-center text-yellow-600 font-medium">{s.pendingBlocks}</td>
                                        <td className="p-4 text-center text-red-600 font-medium">{s.rejectedBlocks}</td>
                                    </tr>
                                ))}
                                {filteredStats.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-gray-500">
                                            No se encontraron resultados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
