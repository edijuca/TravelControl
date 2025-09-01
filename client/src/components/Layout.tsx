import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Car,
  Plus,
  BarChart3,
  MapPin,
  Settings,
  HelpCircle,
  Menu,
  X,
  Route,
  User,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Nova Viagem", href: "/new-trip", icon: Plus },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
  { name: "Rotas", href: "/routes", icon: MapPin },
  { name: "Configurações", href: "/settings", icon: Settings },
  { name: "Ajuda", href: "/help", icon: HelpCircle },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={cn(
          "sidebar-transition fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="gradient-bg w-8 h-8 rounded-lg flex items-center justify-center">
              <Route className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-sidebar-foreground">TravelControl</h1>
          </div>
          {isMobile && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-sidebar-foreground hover:text-sidebar-primary"
              data-testid="button-close-sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
                  )}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  data-testid={`link-${item.name.toLowerCase().replace(' ', '-')}`}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <User className="h-4 w-4 text-accent-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate" data-testid="text-user-name">
                João Silva
              </p>
              <p className="text-xs text-muted-foreground truncate">Colaborador</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-card border-b border-border p-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-open-sidebar"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
          data-testid="overlay-sidebar"
        />
      )}
    </div>
  );
}
