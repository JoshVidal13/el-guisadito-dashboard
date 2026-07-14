"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Clock, 
  ArrowRightLeft, 
  Menu, 
  X,
  ChefHat,
  ListOrdered,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Ciclos Financieros", href: "/cycles", icon: ArrowRightLeft },
  { name: "Registro Histórico", href: "/records", icon: ListOrdered },
  { name: "Calendario Operativo", href: "/calendar", icon: CalendarDays },
  { name: "Roles y Horarios", href: "/schedule", icon: Clock },
  { name: "Configuración", href: "/settings", icon: Settings },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-brand-bg text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden glass sticky top-0 z-50 flex items-center justify-between p-4 border-b border-brand-border">
        <div className="flex items-center gap-2 text-brand-primary font-bold text-xl">
          <ChefHat size={24} />
          <span>El Guisadito</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-brand-surface transition-colors">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:sticky top-0 left-0 z-40 h-screen w-64 glass border-r border-brand-border transition-transform duration-300 ease-in-out md:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden md:flex items-center gap-3 text-brand-primary font-bold text-2xl mb-6">
          <ChefHat size={32} />
          <span>El Guisadito</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/");
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-brand-primary/10 text-brand-primary font-medium" 
                    : "text-slate-400 hover:bg-brand-surface hover:text-slate-100"
                )}
              >
                <item.icon size={20} className={cn("transition-transform group-hover:scale-110", isActive && "text-brand-primary")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-br from-brand-surface to-slate-900 rounded-xl p-4 border border-brand-border">
             <div className="text-xs text-slate-400 mb-1">Semana Actual</div>
             <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Trabajo (Ingresos)
             </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
      
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
