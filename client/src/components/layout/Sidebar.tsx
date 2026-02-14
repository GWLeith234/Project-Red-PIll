import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useBranding } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  Factory, 
  DollarSign, 
  Radio,
  BarChart3, 
  Settings, 
  Users,
  Image as ImageIcon,
  Paintbrush,
  Shield,
  LogOut,
  Briefcase,
  Bot,
  ChevronDown,
  ExternalLink,
  ContactRound,
  Network,
  Send,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  permission: string;
};

type NavGroup = {
  label: string;
  icon?: LucideIcon;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "",
    items: [
      { name: "Command Center", href: "/", icon: LayoutDashboard, permission: "dashboard.view" },
    ],
  },
  {
    label: "Content Factory",
    items: [
      { name: "AI Content Generator", href: "/content", icon: Factory, permission: "content.view" },
      { name: "AI Content Scheduler", href: "/scheduler", icon: CalendarClock, permission: "content.view" },
      { name: "AI Campaign Builder", href: "/campaigns", icon: Send, permission: "content.view" },
      { name: "AI Content Editor", href: "/moderation", icon: Bot, permission: "content.edit" },
      { name: "Analytics", href: "/analytics?section=content", icon: BarChart3, permission: "analytics.view" },
    ],
  },
  {
    label: "Revenue Factory",
    items: [
      { name: "Monetization", href: "/monetization", icon: DollarSign, permission: "monetization.view" },
      { name: "Analytics", href: "/analytics?section=revenue", icon: BarChart3, permission: "analytics.view" },
    ],
  },
  {
    label: "CRM",
    icon: ContactRound,
    items: [
      { name: "Commercial", href: "/sales", icon: Briefcase, permission: "sales.view" },
      { name: "Subscriber", href: "/audience", icon: Users, permission: "audience.view" },
      { name: "Analytics", href: "/analytics?section=crm", icon: BarChart3, permission: "analytics.view" },
    ],
  },
  {
    label: "Audience",
    items: [
      { name: "Podcasts", href: "/network", icon: Network, permission: "network.view" },
      { name: "View Live Site", href: "/home", icon: ExternalLink, permission: "dashboard.view" },
      { name: "Analytics", href: "/analytics?section=audience", icon: BarChart3, permission: "analytics.view" },
    ],
  },
  {
    label: "Admin",
    items: [
      { name: "Customize", href: "/customize", icon: Paintbrush, permission: "customize.view" },
      { name: "User Management", href: "/users", icon: Shield, permission: "users.view" },
      { name: "Settings", href: "/settings", icon: Settings, permission: "settings.view" },
      { name: "Analytics", href: "/analytics?section=admin", icon: BarChart3, permission: "analytics.view" },
    ],
  },
];

function NavGroupSection({ group, location, hasPermission, collapsed, onToggle }: {
  group: NavGroup;
  location: string;
  hasPermission: (p: string) => boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const visibleItems = group.items.filter(item => hasPermission(item.permission));
  if (visibleItems.length === 0) return null;

  const hasActiveChild = visibleItems.some(item => item.href === location);
  const isUngrouped = !group.label;
  const isCollapsed = collapsed && !hasActiveChild;
  const groupId = `nav-group-${group.label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className={isUngrouped ? "" : "mt-2"}>
      {!isUngrouped && (
        <button
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          aria-controls={groupId}
          className={cn(
            "w-full flex items-center justify-between px-3 py-1.5 mb-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] hover:text-muted-foreground transition-colors font-mono",
            hasActiveChild ? "text-primary/70" : "text-muted-foreground/70"
          )}
          data-testid={`button-nav-group-${group.label.toLowerCase()}`}
        >
          <span className="flex items-center gap-1.5">
            {group.icon && <group.icon className="h-3 w-3" />}
            {group.label}
          </span>
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform duration-200",
            isCollapsed && "-rotate-90"
          )} />
        </button>
      )}
      <div
        id={groupId}
        role="region"
        className={cn(
          "space-y-0.5 overflow-hidden transition-all duration-200",
          !isUngrouped && isCollapsed && "max-h-0 opacity-0",
          !isUngrouped && !isCollapsed && "max-h-96 opacity-100",
        )}
      >
        {visibleItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                !isUngrouped && "pl-5",
              )}
              data-testid={`link-nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <item.icon
                className={cn(
                  "mr-3 h-4 w-4 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { data: branding } = useBranding();
  const { user, logout, hasPermission } = useAuth();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

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
      
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="px-3 space-y-0.5">
          {navGroups.map((group) => (
            <NavGroupSection
              key={group.label || "home"}
              group={group}
              location={location}
              hasPermission={hasPermission}
              collapsed={!!collapsedGroups[group.label]}
              onToggle={() => toggleGroup(group.label)}
            />
          ))}
        </nav>

        <div className="mt-6 mx-3 pt-4 border-t border-border/50">
          <h3 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-[0.15em] mb-2 font-mono px-3">
            System Status
          </h3>
          <div className="space-y-2.5 px-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">AI Engine</span>
              <span className="text-accent flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mr-1.5 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ad Server</span>
              <span className="text-accent flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-accent mr-1.5 animate-pulse"></span>
                ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">CDN Link</span>
              <span className="text-primary flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
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
