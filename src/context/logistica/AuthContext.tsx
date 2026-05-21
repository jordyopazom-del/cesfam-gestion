'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Usuario, AuthState } from '../../data/logistica/authTypes';

// ─────────────────────────────────────────────────────────────────────────────
// El módulo de Logística usa la sesión central de cesfam-app (cookie cesfam_session).
// NO tiene su propio sistema de autenticación — esto cumple el requisito de
// "un solo login para todo el sistema".
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextType extends AuthState {
  logout: () => void;
  updateUser: (usuario: Partial<Usuario>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    usuario: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    const loadCentralSession = async () => {
      try {
        // Leemos la sesión del sistema central via /api/auth/me
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          // No hay sesión activa → redirigir al login central
          window.location.href = '/login';
          return;
        }

        const session = await res.json();
        if (!session.authenticated || !session.email) {
          window.location.href = '/login';
          return;
        }

        // Leemos los permisos del usuario desde la API
        const userRes = await fetch('/api/user/me');
        let rol: Usuario['rol'] = 'personal';
        let nombre = session.email.split('@')[0];
        let hasAccessLogistica = false;
        let dbRole = 'USER';

        if (userRes.ok) {
          const userData = await userRes.json();
          nombre = userData.name || nombre;
          hasAccessLogistica = userData.accessLogistica === true;
          dbRole = userData.role || 'USER';
          if (userData.role === 'ADMIN' || userData.role === 'Admin') {
            rol = 'admin';
            hasAccessLogistica = true; // Admin siempre tiene acceso
          }
        }

        if (!hasAccessLogistica) {
          // Sin permiso para Logística → redirigir con mensaje
          window.location.href = '/?sin_acceso=logistica';
          return;
        }

        setAuthState({
          usuario: {
            id: session.email.replace(/[^a-zA-Z0-9]/g, '_'),
            nombre,
            email: session.email,
            rol,
            activo: true,
            fechaCreacion: new Date().toISOString(),
            dbRole
          },
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error('Error cargando sesión central en Logística:', error);
        window.location.href = '/login';
      }
    };

    loadCentralSession();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignorar
    }
    window.location.href = '/login';
  };

  const updateUser = (usuario: Partial<Usuario>) => {
    if (!authState.usuario) return;
    setAuthState(prev => ({
      ...prev,
      usuario: { ...prev.usuario!, ...usuario }
    }));
  };

  return (
    <AuthContext.Provider value={{ ...authState, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
