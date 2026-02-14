import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Users, Layers, Radio, Building2, Shield, UserPlus, TrendingUp, Briefcase, Mail, Activity, DollarSign, Headphones, Target, PieChart as PieChartIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminDashboardStats } from "@/lib/api";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

const fmtCurrency = (n: number) => { if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`; if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`; return `$${n}`; };

export default function AdminScreen() {
  const { data: stats, isLoading } = useAdminDashboardStats();

  if (isLoading) {
    return <div className="grid grid-cols-4 grid-rows-3 gap-3 h-full">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-full w-full rounded-lg" />)}</div>;
  }

  const users = stats?.users || {};
  const content = stats?.content || {};
  const network = stats?.network || {};
  const commercial = stats?.commercial || {};
  const deals = stats?.deals || {};
  const subscribers = stats?.subscribers || {};
  const byRole = users.byRole || {};
  const recentUsers = users.recentUsers || [];

  const roleData = useMemo(() => {
    return Object.entries(byRole).map(([role, count]) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: count as number,
    }));
  }, [byRole]);

  return (
    <div className="grid grid-cols-12 grid-rows-3 gap-3 h-full" data-testid="screen-admin">
      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-total-users">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Total Users</span>
          <Users className="h-4 w-4 text-primary/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{users.total || 0}</p>
        <div className="flex items-center gap-2 text-[9px] font-mono">
          {Object.entries(byRole).slice(0, 3).map(([role, count], i) => (
            <span key={role} className={cn(i === 0 ? "text-primary" : i === 1 ? "text-accent" : "text-chart-2")}>{count as number} {role}</span>
          ))}
        </div>
      </div>

      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-content-library">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Content Library</span>
          <Layers className="h-4 w-4 text-accent/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{content.total || 0}</p>
        <span className="text-[9px] font-mono uppercase text-accent">{content.episodes || 0} episodes</span>
      </div>

      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-network">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Network</span>
          <Radio className="h-4 w-4 text-chart-2/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{network.totalPodcasts || 0}</p>
        <span className="text-[9px] font-mono uppercase text-chart-2">{formatCount(network.totalListeners || 0)} listeners</span>
      </div>

      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-commercial">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Commercial</span>
          <Building2 className="h-4 w-4 text-chart-3/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{commercial.companies || 0}</p>
        <span className="text-[9px] font-mono uppercase text-chart-3">{commercial.advertisers || 0} advertisers</span>
      </div>

      <div className="col-span-4 row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-users-by-role">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <PieChartIcon className="h-3.5 w-3.5" /> Users by Role
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{users.total || 0} total</span>
        </div>
        <div className="flex-1 min-h-0">
          {roleData.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" innerRadius="40%" paddingAngle={2}>
                      {roleData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {roleData.map((r, i) => (
                  <span key={r.name} className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
                    <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{r.name}: {r.value}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center"><p className="text-xs text-muted-foreground">No user data</p></div>
          )}
        </div>
      </div>

      <div className="col-span-4 row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-recent-signups">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" /> Recent Signups
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{users.recentSignups || 0} (30d)</span>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {recentUsers.length > 0 ? recentUsers.map((u: any) => (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg border border-border/30 bg-card/20 hover:bg-card/40 transition-colors" data-testid={`admin-user-${u.id}`}>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserPlus className="h-3.5 w-3.5 text-primary/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{u.displayName || u.username}</p>
                <p className="text-[9px] text-muted-foreground font-mono">@{u.username}</p>
              </div>
              <Badge variant="outline" className={cn("text-[9px] font-mono shrink-0",
                u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" :
                u.role === "editor" ? "bg-accent/10 text-accent border-accent/20" :
                "bg-muted/50 text-muted-foreground"
              )}>{u.role}</Badge>
            </div>
          )) : <p className="text-xs text-muted-foreground text-center py-4">No recent signups</p>}
        </div>
      </div>

      <div className="col-span-4 row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-platform-health">
        <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <Activity className="h-3.5 w-3.5" /> Platform Health
        </h3>
        <div className="flex-1 overflow-y-auto space-y-3">
          <div className="p-2.5 rounded-lg border border-border/30 bg-card/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[10px] font-mono text-muted-foreground">Total Deals</span>
            </div>
            <span className="text-sm font-bold font-display">{deals.total || 0}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border/30 bg-card/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-accent/60" />
              <span className="text-[10px] font-mono text-muted-foreground">Won Value</span>
            </div>
            <span className="text-sm font-bold font-display text-accent">{fmtCurrency(deals.wonValue || 0)}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border/30 bg-card/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[10px] font-mono text-muted-foreground">Subscribers (30d)</span>
            </div>
            <span className="text-sm font-bold font-display text-primary">{subscribers.recentCount || 0}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border/30 bg-card/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-chart-3/60" />
              <span className="text-[10px] font-mono text-muted-foreground">Content (30d)</span>
            </div>
            <span className="text-sm font-bold font-display text-chart-3">{content.recentCount || 0}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border/30 bg-card/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-chart-4/60" />
              <span className="text-[10px] font-mono text-muted-foreground">Ad Campaigns</span>
            </div>
            <span className="text-sm font-bold font-display">{commercial.activeCampaigns || 0}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-border/30 bg-card/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="h-3.5 w-3.5 text-chart-2/60" />
              <span className="text-[10px] font-mono text-muted-foreground">Listeners</span>
            </div>
            <span className="text-sm font-bold font-display text-chart-2">{formatCount(network.totalListeners || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}