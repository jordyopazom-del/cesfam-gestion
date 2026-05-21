import { redirect } from "next/navigation";
import { getSSOUser } from "@/lib/sso-session";
import SSOSidebar from "@/components/sso/SSOSidebar";
import { Toaster } from "react-hot-toast";

export default async function SSOLayout({ children }: { children: React.ReactNode }) {
  const user = await getSSOUser();
  if (!user) redirect("/login");

  return (
    <div className="flex h-full">
      <SSOSidebar userName={user.name} userRole={user.role} />
      <main className="flex-1 ml-64 p-8 min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
