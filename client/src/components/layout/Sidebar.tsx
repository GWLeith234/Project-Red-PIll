import { useState, useEffect, createContext, useContext } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { cn } from "@/lib/utils";
import { useBranding } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { NpsFeedbackButton } from "@/components/NpsFeedbackWidget";
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
  Scaling,
  Kanban,
  ListTodo,
  Mail,
  Menu,
  X,
  MessageSquareHeart,
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
      { name: "Newsletters", href: "/newsletters", icon: Mail, permission: "content.view" },
      { name: "AI Content Editor", href: "/moderation", icon: Bot, permission: "content.edit" },
    ],
  },
  {
    label: "Project Management",
    items: [
      { name: "Kanban Board", href: "/kanban", icon: Kanban, permission: "content.view" },
      { name: "My Tasks", href: "/my-tasks", icon: ListTodo, permission: "content.view" },
    ],
  },
  {
    label: "Revenue Factory",
    items: [
      { name: "Monetization", href: "/monetization", icon: DollarSign, permission: "monetization.view" },
      { name: "Ad Resizer", href: "/ad-resizer", icon: Scaling, permission: "monetization.view" },
    ],
  },
  {
    label: "CRM",
    icon: ContactRound,
    items: [
      { name: "Commercial", href: "/sales", icon: Briefcase, permission: "sales.view" },
      { name: "Subscriber", href: "/audience", icon: Users, permission: "audience.view" },
    ],
  },
  {
    label: "Audience",
    items: [
      { name: "Podcasts", href: "/network", icon: Network, permission: "network.view" },
      { name: "View Live Site", href: "/home", icon: ExternalLink, permission: "dashboard.view" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Analytics", href: "/analytics", icon: BarChart3, permission: "analytics.view" },
    ],
  },
  {
    label: "Admin",
    items: [
      { name: "Customize", href: "/customize", icon: Paintbrush, permission: "customize.view" },
      { name: "User Management", href: "/users", icon: Shield, permission: "users.view" },
      { name: "Settings", href: "/settings", icon: Settings, permission: "settings.view" },
    ],
  },
];

function isItemActive(item: NavItem, location: string, searchString: string): boolean {
  if (!item.href.includes("?")) {
    if (item.href === "/analytics") {
      return location === "/analytics";
    }
    return location === item.href;
  }
  const [itemPath, itemQuery] = item.href.split("?");
  if (location !== itemPath) return false;
  const itemParams = new URLSearchParams(itemQuery);
  const currentParams = new URLSearchParams(searchString);
  const entries = Array.from(itemParams.entries());
  for (let i = 0; i < entries.length; i++) {
    if (currentParams.get(entries[i][0]) !== entries[i][1]) return false;
  }
  return true;
}

function NavGroupSection({ group, location, searchString, hasPermission, collapsed, onToggle, onNavigate }: {
  group: NavGroup;
  location: string;
  searchString: string;
  hasPermission: (p: string) => boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  const visibleItems = group.items.filter(item => hasPermission(item.permission));
  if (visibleItems.length === 0) return null;

  const hasActiveChild = visibleItems.some(item => isItemActive(item, location, searchString));
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
          const isActive = isItemActive(item, location, searchString);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
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

const MobileSidebarContext = createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} });

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileSidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const searchString = useSearch();
  const { data: branding } = useBranding();
  const { user, logout, hasPermission } = useAuth();
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <>
      <div className="flex items-center border-b border-border px-4 py-2.5">
        <div className="flex-1 min-w-0">
          {branding?.logoUrl ? (
            <Link href="/" className="flex items-center h-8" data-testid="sidebar-logo" onClick={onNavigate}>
              <img src={branding.logoUrl} alt={branding.companyName || "Logo"} className="h-6 max-w-[120px] object-contain" />
            </Link>
          ) : (
            <Link href="/customize" className="border border-dashed border-muted-foreground/50 rounded-sm px-2 py-1 flex items-center hover:border-gold/50 hover:bg-gold/5 transition-colors cursor-pointer group" data-testid="sidebar-logo-placeholder" onClick={onNavigate}>
              <ImageIcon className="h-3 w-3 text-muted-foreground mr-1.5 group-hover:text-gold" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground group-hover:text-gold">Logo</span>
            </Link>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-3">
        <nav className="px-3 space-y-0.5">
          {navGroups.map((group) => (
            <NavGroupSection
              key={group.label || "home"}
              group={group}
              location={location}
              searchString={searchString}
              hasPermission={hasPermission}
              collapsed={!!collapsedGroups[group.label]}
              onToggle={() => toggleGroup(group.label)}
              onNavigate={onNavigate}
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

      <div className="border-t border-border/50 px-3 py-2">
        <Link
          href="/analytics?section=nps"
          onClick={onNavigate}
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-all duration-200",
            location === "/analytics" && new URLSearchParams(searchString).get("section") === "nps"
              ? "bg-sidebar-primary/10 text-primary border-l-2 border-primary"
              : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          )}
          data-testid="link-nav-nps-feedback"
        >
          <MessageSquareHeart className="mr-3 h-4 w-4 flex-shrink-0" />
          <span className="truncate">NPS Feedback</span>
        </Link>
      </div>

      <div className="border-t border-border px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50 text-primary font-bold text-[10px] flex-shrink-0" data-testid="sidebar-user-avatar">
            {(user?.displayName || user?.username || "??").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight" data-testid="sidebar-user-name">
              {user?.displayName || user?.username || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider" data-testid="sidebar-user-role">
              {user?.role || "user"}
            </p>
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
    </>
  );
}

export function MobileHeader() {
  const { open, setOpen } = useMobileSidebar();
  const { data: branding } = useBranding();

  return (
    <div className={cn(
      "lg:hidden fixed top-0 left-0 right-0 z-40 bg-sidebar border-b border-border h-14 flex items-center px-4 gap-3 transition-transform duration-300 ease-in-out",
      open ? "translate-x-72" : "translate-x-0"
    )} data-testid="mobile-header">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-mobile-menu-toggle"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <div className="flex-1 min-w-0">
        {branding?.logoUrl ? (
          <img src={branding.logoUrl} alt={branding.companyName || "Logo"} className="h-5 max-w-[100px] object-contain" />
        ) : (
          <span className="text-sm font-display font-bold text-foreground truncate">
            {branding?.companyName || "MediaTech Empire"}
          </span>
        )}
      </div>
      <NpsFeedbackButton />
    </div>
  );
}

export function Sidebar() {
  const { open, setOpen } = useMobileSidebar();
  const [location] = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location, setOpen]);

  

  return (
    <>
      <div className="hidden lg:flex h-screen w-64 flex-col bg-sidebar border-r border-border text-sidebar-foreground font-sans fixed left-0 top-0 z-30">
        <SidebarContent />
      </div>

      <div
        className={cn(
          "lg:hidden fixed top-14 left-0 bottom-0 z-50 w-72 bg-sidebar border-r border-border text-sidebar-foreground font-sans flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        data-testid="mobile-sidebar"
      >
        <SidebarContent onNavigate={() => setOpen(false)} />
      </div>
    </>
  );
}
