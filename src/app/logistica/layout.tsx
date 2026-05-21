import './logistica.css';

export default function LogisticaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="logistica-module">
      {children}
    </div>
  );
}
