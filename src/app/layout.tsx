import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CESFAM Gestión",
  description: "Sistema de gestión para CESFAM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-blue-600 text-white shadow-md">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Link href="/" className="text-xl font-bold flex items-center gap-2">
              <img
                src="/header-logo.png"
                alt="Logo"
                className="w-8 h-8 rounded-full object-cover"
              />
              CESFAM Gestión
            </Link>
            <div className="flex gap-6">
              <Link href="/" className="hover:text-blue-200 transition-colors">Inicio</Link>
              <Link href="/admin/personnel" className="hover:text-blue-200 transition-colors">Administración</Link>
            </div>
          </div>
        </nav>
        <main className="min-h-screen bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}
