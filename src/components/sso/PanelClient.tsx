"use client";

import { useState } from "react";
import { 
  Users, Key, Shield, UserX, UserCheck, Search, Download, 
  Settings, CheckCircle2, Info, FileSpreadsheet, Lock
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { 
  createUser, deleteUser, changeUserPassword, 
  updateUserRoleAndPermissions, getBackupDemands 
} from "@/app/sso/admin/panel/actions";

export default function PanelClient({ 
  initialUsers 
}: { 
  initialUsers: any[]; 
}) {
  const [activeTab, setActiveTab] = useState("usuarios");
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Forms
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USUARIO" });
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Expandable sections
  const [expandPassword, setExpandPassword] = useState(false);
  const [expandRole, setExpandRole] = useState(false);
  const [expandDelete, setExpandDelete] = useState(false);

  // For role and permissions editing
  const [editRole, setEditRole] = useState("USUARIO");
  const [permissions, setPermissions] = useState({
    accessLogistica: false,
    accessSolicitudes: false,
    accessReservas: false,
    accessAgendas: false,
  });

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    const user = users.find(u => u.id === userId);
    if (user) {
      setEditRole(user.role);
      setPermissions({
        accessLogistica: !!user.accessLogistica,
        accessSolicitudes: !!user.accessSolicitudes,
        accessReservas: !!user.accessReservas,
        accessAgendas: !!user.accessAgendas,
      });
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Todos los campos son obligatorios");
      return;
    }
    
    const loadingToast = toast.loading("Creando usuario...");
    const res = await createUser(newUser.name, newUser.email, newUser.password, newUser.role);
    
    if (res.success) {
      toast.success(`Usuario ${newUser.name} creado exitosamente`, { id: loadingToast });
      setNewUser({ name: "", email: "", password: "", role: "USUARIO" });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(res.error || "Error al crear", { id: loadingToast });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !newPassword || !confirmPassword) {
      return toast.error("Completa todos los campos");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Las contraseñas no coinciden");
    }
    if (newPassword.length < 6) {
      return toast.error("La contraseña debe tener al menos 6 caracteres");
    }

    const t = toast.loading("Cambiando contraseña...");
    const res = await changeUserPassword(selectedUserId, newPassword);
    if (res.success) {
      toast.success("Contraseña cambiada exitosamente", { id: t });
      setNewPassword("");
      setConfirmPassword("");
      setExpandPassword(false);
    } else {
      toast.error(res.error || "Error al cambiar contraseña", { id: t });
    }
  };

  const handleUpdateRoleAndPermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return toast.error("Seleccione un usuario");

    const t = toast.loading("Actualizando permisos...");
    const res = await updateUserRoleAndPermissions(selectedUserId, editRole, permissions);
    if (res.success) {
      toast.success("Permisos y rol actualizados correctamente", { id: t });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(res.error || "Error al actualizar", { id: t });
    }
  };

  const handleDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return toast.error("Seleccione un usuario");

    const t = toast.loading("Eliminando usuario...");
    const res = await deleteUser(selectedUserId);
    if (res.success) {
      toast.success("Usuario eliminado correctamente", { id: t });
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error(res.error || "Error al eliminar", { id: t });
    }
  };

  const handleDownloadBackup = async () => {
    const t = toast.loading("Generando Excel de Respaldo...");
    const res = await getBackupDemands();
    
    if (res.success && res.data) {
      try {
        const worksheet = XLSX.utils.json_to_sheet(res.data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "RespaldoDemanda");
        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(workbook, `sso_demand_backup_${dateStr}.xlsx`);
        toast.success("Respaldo descargado con éxito", { id: t });
      } catch (err) {
        toast.error("Error al generar el archivo Excel", { id: t });
      }
    } else {
      toast.error(res.error || "Error al obtener datos", { id: t });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[70vh]">
      
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        <button 
          onClick={() => setActiveTab('usuarios')}
          className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'usuarios' ? 'bg-white border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <Users className="h-4 w-4" /> Gestión de Usuarios
        </button>
        <button 
          onClick={() => setActiveTab('respaldo')}
          className={`flex-1 py-4 px-6 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'respaldo' ? 'bg-white border-b-2 border-blue-600 text-blue-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          <Download className="h-4 w-4" /> Respaldo y Datos
        </button>
      </div>

      <div className="p-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
        
        {/* --- TAB USUARIOS --- */}
        {activeTab === 'usuarios' && (
          <div className="space-y-8">
            
            {/* Crear Usuario */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" /> Registrar Nuevo Funcionario
              </h3>
              <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Nombre Completo</label>
                  <input 
                    type="text" placeholder="Ej: Juan Pérez" required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Correo Electrónico</label>
                  <input 
                    type="email" placeholder="Ej: juan.perez@cesfam.cl" required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Contraseña</label>
                  <input 
                    type="password" placeholder="Mínimo 6 caracteres" required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Rol Principal</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-700"
                    value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="USUARIO">Usuario (Gestor)</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="COORDINADOR">Coordinador</option>
                    <option value="SOLICITANTE">Solicitante</option>
                  </select>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-2.5 text-sm shadow-sm transition-colors cursor-pointer">
                  Registrar Funcionario
                </button>
              </form>
            </div>

            {/* Listado de Usuarios */}
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-slate-600" /> Funcionarios del Sistema
                </h3>
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" placeholder="Buscar por nombre o correo..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Nombre</th>
                      <th className="px-6 py-3">Correo</th>
                      <th className="px-6 py-3">Rol</th>
                      <th className="px-6 py-3">Módulos Habilitados</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                    {filteredUsers.map((u: any) => {
                      const enabledModules = [];
                      if (u.role === "ADMIN") enabledModules.push("Acceso Total (Admin)");
                      else {
                        if (u.accessLogistica) enabledModules.push("Logística");
                        if (u.accessSolicitudes) enabledModules.push("Solicitudes");
                        if (u.accessReservas) enabledModules.push("Reservas");
                        if (u.accessAgendas) enabledModules.push("Agendas");
                        if (enabledModules.length === 0) enabledModules.push("Ninguno");
                      }

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-slate-900">{u.name || "Sin nombre"}</td>
                          <td className="px-6 py-3.5 text-slate-600 font-normal">{u.email}</td>
                          <td className="px-6 py-3.5">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                              u.role === "ADMIN" 
                                ? "bg-rose-50 border-rose-200 text-rose-700" 
                                : u.role === "COORDINADOR"
                                ? "bg-purple-50 border-purple-200 text-purple-700"
                                : "bg-blue-50 border-blue-200 text-blue-700"
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex flex-wrap gap-1">
                              {enabledModules.map((m, i) => (
                                <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  m.includes("Total") 
                                    ? "bg-slate-800 text-white" 
                                    : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}>
                                  {m}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 font-bold">
                          No se encontraron usuarios.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Acciones Avanzadas */}
            <div className="border-t border-slate-200 pt-8">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-slate-600" /> Acciones Avanzadas de Administración
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Seleccionar Usuario */}
                <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-blue-600" /> 1. Selecciona Funcionario
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">Elige el usuario que deseas modificar o eliminar.</p>
                  <select 
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-700"
                    value={selectedUserId}
                    onChange={(e) => handleUserSelect(e.target.value)}
                  >
                    <option value="" disabled>Seleccione funcionario...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
                    ))}
                  </select>
                </div>

                {/* Modificar Rol y Permisos */}
                <div className={`border p-6 rounded-xl space-y-4 transition-all ${
                  selectedUserId 
                    ? "bg-white border-slate-200 shadow-sm" 
                    : "bg-slate-100/50 border-slate-200 opacity-50 pointer-events-none"
                }`}>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-blue-600" /> 2. Rol y Permisos de Módulos
                  </h4>
                  
                  <form onSubmit={handleUpdateRoleAndPermissions} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Rol del Sistema</label>
                      <select 
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-semibold text-slate-700"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                      >
                        <option value="USUARIO">USUARIO (GESTOR)</option>
                        <option value="ADMIN">ADMINISTRADOR</option>
                        <option value="COORDINADOR">COORDINADOR</option>
                        <option value="SOLICITANTE">SOLICITANTE</option>
                      </select>
                    </div>

                    {editRole !== "ADMIN" && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 mb-2 block">Módulos Habilitados</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: "accessLogistica", label: "🚚 Logística" },
                            { id: "accessSolicitudes", label: "📋 Solicitudes" },
                            { id: "accessReservas", label: "🔑 Reservas" },
                            { id: "accessAgendas", label: "📅 Agendas" }
                          ].map((mod) => (
                            <label key={mod.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer">
                              <input 
                                type="checkbox"
                                checked={(permissions as any)[mod.id]}
                                onChange={(e) => setPermissions({ ...permissions, [mod.id]: e.target.checked })}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              {mod.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <button type="submit" className="w-full bg-slate-800 text-white font-bold py-2 rounded-lg text-xs hover:bg-slate-900 transition-colors cursor-pointer">
                      Guardar Permisos
                    </button>
                  </form>
                </div>

                {/* Password / Delete */}
                <div className={`space-y-4 transition-all ${
                  selectedUserId 
                    ? "opacity-100" 
                    : "opacity-50 pointer-events-none"
                }`}>
                  
                  {/* Cambiar Contraseña */}
                  <div className="border border-slate-200 bg-white rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setExpandPassword(!expandPassword)}
                      className="w-full px-5 py-3.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 font-bold text-xs text-slate-800 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2"><Key className="h-4 w-4 text-amber-500" /> Cambiar Contraseña</span>
                    </button>
                    {expandPassword && (
                      <form onSubmit={handleChangePassword} className="p-4 border-t border-slate-200 space-y-3 bg-white">
                        <input 
                          type="password" placeholder="Nueva contraseña" required 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" 
                          value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        />
                        <input 
                          type="password" placeholder="Confirmar contraseña" required 
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs" 
                          value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                        />
                        <button type="submit" className="w-full bg-slate-800 text-white font-bold py-2 rounded-lg text-xs hover:bg-slate-900 transition-colors cursor-pointer">Cambiar Contraseña</button>
                      </form>
                    )}
                  </div>

                  {/* Eliminar Usuario */}
                  <div className="border border-red-200 bg-white rounded-xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setExpandDelete(!expandDelete)}
                      className="w-full px-5 py-3.5 flex items-center justify-between bg-red-50 hover:bg-red-100/70 font-bold text-xs text-red-700 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2"><UserX className="h-4 w-4 text-red-500" /> Eliminar Funcionario</span>
                    </button>
                    {expandDelete && (
                      <form onSubmit={handleDeleteUser} className="p-4 border-t border-red-100 bg-white space-y-3">
                        <p className="text-[10px] text-red-500 font-bold">Esta acción borrará permanentemente la cuenta de este funcionario en el sistema.</p>
                        <button type="submit" className="w-full bg-red-600 text-white font-bold py-2 rounded-lg text-xs hover:bg-red-700 transition-colors cursor-pointer">Confirmar Eliminación</button>
                      </form>
                    )}
                  </div>

                </div>

              </div>
            </div>

          </div>
        )}

        {/* --- TAB RESPALDO --- */}
        {activeTab === 'respaldo' && (
          <div className="space-y-6 flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
            <div className="bg-blue-50 text-blue-600 p-6 rounded-full mb-4">
              <FileSpreadsheet className="h-16 w-16" />
            </div>
            <h2 className="text-2xl font-black text-slate-800">Respaldo Completo de Rechazos y Derivaciones</h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Descarga una copia exacta en formato Excel de toda la tabla de Rechazos y Derivaciones. Este proceso se hace instantáneamente en tu navegador.
            </p>
            <button 
              onClick={handleDownloadBackup}
              className="mt-6 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <Download className="h-6 w-6" />
              Descargar Backup Excel
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
