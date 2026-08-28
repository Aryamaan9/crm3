"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Copy, 
  Calendar, 
  Mail, 
  UsersRound, 
  Settings,
  LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Pipeline", href: "/pipeline", icon: Copy },
  { name: "Follow-ups", href: "/follow-ups", icon: Calendar },
  { name: "Email", href: "/email", icon: Mail },
  { name: "Distributors", href: "/distributors", icon: UsersRound },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Import", href: "/import", icon: Copy },
];

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAuth();
  
  const userRole = profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : "Loading...";

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="flex flex-col p-6 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Investor CRM</h1>
        <p className="text-sm text-slate-500 mt-1">Role: {userRole}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive 
                  ? "bg-slate-50 text-blue-700" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5", 
                  isActive ? "text-blue-700" : "text-slate-400"
                )} 
                strokeWidth={2}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-600" strokeWidth={2} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
