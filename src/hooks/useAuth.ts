'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  name: string | null;
  email: string;
  role: string;
  status: string;
  accessLogistica: boolean;
  accessSolicitudes: boolean;
  accessReservas: boolean;
  accessAgendas: boolean;
}

export function useAuth() {
  const [usuario, setUsuario] = useState<{ nombre: string | null; email: string; rol: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/user/me');
      if (res.ok) {
        const data: User = await res.json();
        setUsuario({
          nombre: data.name,
          email: data.email,
          rol: data.role.toLowerCase(), // normalize to lowercase 'admin' or 'usuario'
        });
        setIsAuthenticated(true);
      } else {
        setUsuario(null);
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error('Error fetching central session:', e);
      setUsuario(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUsuario(null);
      setIsAuthenticated(false);
      router.push('/login');
    } catch (e) {
      console.error('Error during logout:', e);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    usuario,
    logout,
    refreshSession: fetchUser
  };
}
