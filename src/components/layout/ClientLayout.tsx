"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isLoginPage = pathname === "/login";

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium animate-pulse">Loading CRM...</p>
      </div>
    );
  }

  // If on login page, don't show sidebar
  if (isLoginPage) {
    return <main className="min-h-screen">{children}</main>;
  }

  // Otherwise, show the full authenticated layout
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900">
      {user && <Sidebar />}
      <main className="flex-1 h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Shell>{children}</Shell>
    </AuthProvider>
  );
}
