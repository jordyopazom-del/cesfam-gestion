import React from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/logistica/AuthContext';
import type { UserRole } from '../../data/logistica/authTypes';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, usuario, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner-large">
          <div className="spinner"></div>
          <p>Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !usuario) {
    return null;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(usuario.rol)) {
      return (
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-error" style={{ margin: '2rem 0' }}>
              <span>🚫</span> Acceso denegado
            </div>
            <p style={{ textAlign: 'center', color: '#64748b' }}>
              No tienes permisos para acceder a esta sección.
            </p>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#94a3b8' }}>
              Tu rol actual: <strong>{usuario.rol}</strong>
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default AuthGuard;
