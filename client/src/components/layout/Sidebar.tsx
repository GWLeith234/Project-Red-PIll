import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useBranding } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Factory, 
  DollarSign, 
  Network, 
  BarChart3, 
  Settings, 
  Radio,
  Users,
  Image as ImageIcon,
  Paintbrush,
  Shield,
  LogOut,
  Briefcase,
} from "lucide-react";

const navigation = [
  { name: "Command Center", href: "/", icon: LayoutDashboard, permission: "dashboard.view" },
  { name: "Content Factory", href: "/content", icon: Factory, permission: "content.view" },
  { name: "Monetization", href: "/monetization", icon: DollarSign, permission: "monetization.view" },
  { name: "Commercial CRM", href: "/sales", icon: Briefcase, permission: "sales.view" },
  { name: "Podcast Network", href: "/network", icon: Radio, permission: "network.view" },
  { name: "Subscriber CRM", href: "/audience", icon: Users, permission: "audience.view" },
  { name: "Analytics", href: "/analytics", icon: BarChart3, permission: "analytics.view" },
  { name: "Customize", href: "/customize", icon: Paintbrush, permission: "customize.view" },
  { name: "User Management", href: "/users", icon: Shield, permission: "users.view" },
  { name: "Settings", href: "/settings", icon: Settings, permission: "settings.view" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: branding } = useBranding();
  const { user, logout, hasPermission } = useAuth();

  const visibleNav = navigation.filter(item => hasPermission(item.permission));

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-border text-sidebar-foreground font-sans fixed left-0 top-0 z-30">
      <div className="flex h-16 items-center border-b border-border px-6">
        {branding?.logoUrl ? (
          <Link href="/" className="flex items-center justify-center w-full h-10" data-testid="sidebar-logo">
            <img src={branding.logoUrl} alt={branding.companyName || "Logo"} className="h-8 max-w-full object-contain" />
          </Link>
        ) : (
          <Link href="/customize" className="border border-dashed border-muted-foreground/50 rounded-md p-1 flex items-center justify-center w-full h-10 hover:border-gold/50 hover:bg-gold/5 transition-colors cursor-pointer group" data-testid="sidebar-logo-placeholder">
            <ImageIcon className="h-4 w-4 text-muted-foreground mr-2 group-hover:text-gold" />
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-gold">Your Logo Here</span>
          </Link>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {visibleNav.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-all duration-200",
                    isActive
                      ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 px-6">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 font-mono">
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">AI Engine</span>
              <span className="text-accent flex items-center">
                <span className="w-2 h-2 rounded-full bg-accent mr-1 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ad Server</span>
              <span className="text-accent flex items-center">
                <span className="w-2 h-2 rounded-full bg-accent mr-1 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">CDN Link</span>
              <span className="text-primary flex items-center">
                <span className="w-2 h-2 rounded-full bg-primary mr-1"></span>
                98% LOAD
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-4 bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary font-bold text-xs flex-shrink-0">
              {(user?.displayName || user?.username || "??").slice(0, 2).toUpperCase()}
            </div>
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-foreground truncate" data-testid="text-sidebar-user">{user?.displayName || user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize" data-testid="text-sidebar-role">{user?.role || "User"}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            title="Sign out"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
