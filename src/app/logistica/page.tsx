'use client'

import './logistica.css'
import dynamic from 'next/dynamic'
import { AuthProvider } from '@/context/logistica/AuthContext'

// Cargamos dinámicamente con SSR desactivado para evitar errores de Leaflet (window is not defined)
const AppContent = dynamic(() => import('@/components/logistica/AppContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 font-medium">Iniciando Sistema de Logística...</p>
      </div>
    </div>
  )
})

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

