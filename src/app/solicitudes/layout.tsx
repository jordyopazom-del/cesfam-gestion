import './solicitudes.css';

export default function SolicitudesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="solicitudes-module" style={{ height: '100%', minHeight: '100vh', background: '#f5f7fa' }}>
      {children}
    </div>
  );
}
