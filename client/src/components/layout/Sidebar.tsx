import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Factory, 
  DollarSign, 
  Network, 
  BarChart3, 
  Settings, 
  Zap,
  Radio,
  Users,
  Image as ImageIcon
} from "lucide-react";

const navigation = [
  { name: "Command Center", href: "/", icon: LayoutDashboard },
  { name: "Content Factory", href: "/content", icon: Factory },
  { name: "Monetization", href: "/monetization", icon: DollarSign },
  { name: "Podcast Network", href: "/network", icon: Radio },
  { name: "Audience Data", href: "/audience", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-border text-sidebar-foreground font-sans fixed left-0 top-0 z-30">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div className="border border-dashed border-muted-foreground/50 rounded-md p-1 flex items-center justify-center w-full h-10 hover:border-gold/50 hover:bg-gold/5 transition-colors cursor-pointer group">
          <ImageIcon className="h-4 w-4 text-muted-foreground mr-2 group-hover:text-gold" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground group-hover:text-gold">Your Logo Here</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
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
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary font-bold">
            SJ
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-foreground">Scott Jennings</p>
            <p className="text-xs text-muted-foreground">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
