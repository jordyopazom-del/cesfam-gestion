import React, { useState } from 'react';
import { useAuth } from '../../context/logistica/AuthContext';

const UserMenu: React.FC = () => {
  const { usuario, logout, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [newName, setNewName] = useState(usuario?.nombre || '');

  if (!usuario) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      if (newName !== usuario.nombre) {
        await updateUser({ nombre: newName });
      }
      alert('¡Nombre actualizado con éxito! 🎉');
      setShowSettings(false);
    } catch (error: any) {
      console.error(error);
      alert('Error: ' + (error.message || 'No se pudo actualizar la configuración.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const getRolLabel = (rol: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrador',
      coordinador: 'Coordinador',
      conductor: 'Conductor',
      personal: 'Personal'
    };
    return labels[rol] || rol;
  };

  return (
    <div className="user-menu-container" style={{ position: 'relative' }}>
      <button
        className="user-menu-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          padding: '8px 12px', borderRadius: '8px', transition: 'background 0.2s', width: '100%'
        }}
      >
        <div className="user-avatar" style={{
          width: '36px', height: '36px', borderRadius: '50%', background: '#007bff', color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
        }}>
          {usuario.nombre.charAt(0).toUpperCase()}
        </div>
        <div className="user-info" style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#1a1e23', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {usuario.nombre}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            {getRolLabel(usuario.rol)}
          </div>
        </div>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            onClick={() => setIsOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
          />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: 'white',
            borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0', minWidth: '260px', zIndex: 1000, overflow: 'hidden'
          }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '4px' }}>{usuario.nombre}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>{usuario.email}</div>
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: '999px',
                fontSize: '0.65rem', fontWeight: '700', textTransform: 'uppercase',
                background: usuario.rol === 'admin' ? '#fee2e2' : '#dcfce7',
                color: usuario.rol === 'admin' ? '#991b1b' : '#166534'
              }}>
                {getRolLabel(usuario.rol)}
              </span>
            </div>

            <div style={{ padding: '0.5rem' }}>
              <button
                style={{
                  width: '100%', padding: '0.6rem 1rem', background: 'transparent', border: 'none',
                  borderRadius: '8px', textAlign: 'left', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#475569'
                }}
                onClick={() => { setShowSettings(true); setIsOpen(false); }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span>⚙️</span> Mi Perfil
              </button>
              <button
                style={{
                  width: '100%', padding: '0.6rem 1rem', background: 'transparent', border: 'none',
                  borderRadius: '8px', textAlign: 'left', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', gap: '10px', fontSize: '0.8rem', color: '#dc3545'
                }}
                onClick={logout}
                onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span>🚪</span> Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}

      {showSettings && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '450px',
            padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>⚙️ Mi Perfil</h2>
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>Nombre Completo</label>
                <input
                  type="text" value={newName} onChange={e => setNewName(e.target.value)} required
                  placeholder="Tu nombre" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px', display: 'block' }}>Correo Electrónico</label>
                <input
                  type="email" value={usuario.email} readOnly
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', boxSizing: 'border-box' }}
                />
                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Para cambiar el correo contacta al administrador.</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                <button
                  type="button" onClick={() => setShowSettings(false)}
                  style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={isUpdating}
                  style={{
                    flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none',
                    background: '#007bff', color: 'white', fontWeight: '600',
                    cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.7 : 1
                  }}
                >
                  {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
