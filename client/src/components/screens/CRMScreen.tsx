import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Building2, Users, Briefcase, Trophy, BarChart3, Clock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useCompanies, useContacts, useDeals } from "@/lib/api";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const fmtCurrency = (n: number) => { if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`; if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`; return `$${n}`; };

export default function CRMScreen() {
  const { data: companies, isLoading: compLoading } = useCompanies();
  const { data: contacts, isLoading: contLoading } = useContacts();
  const { data: deals, isLoading: dealsLoading } = useDeals();

  const comps = companies || [];
  const conts = contacts || [];
  const allDeals = deals || [];

  const stageLabels: Record<string, string> = { lead: "Lead", discovery: "Discovery", qualified: "Qualified", proposal: "Proposal", negotiation: "Negotiation", closed_won: "Won", closed_lost: "Lost" };

  const dealStats = useMemo(() => {
    const openStages = ["lead", "discovery", "qualified", "proposal", "negotiation"];
    const openDeals = allDeals.filter((d: any) => openStages.includes(d.stage));
    const openValue = openDeals.reduce((sum: number, d: any) => sum + (Number(d.totalValue) || 0), 0);
    const closedWon = allDeals.filter((d: any) => d.stage === "closed_won").length;
    const closedLost = allDeals.filter((d: any) => d.stage === "closed_lost").length;
    const winRate = (closedWon + closedLost) > 0 ? Math.round((closedWon / (closedWon + closedLost)) * 100) : 0;
    return { openDeals, openValue, closedWon, closedLost, winRate };
  }, [allDeals]);

  const stageData = useMemo(() => {
    const stageOrder = ["lead", "discovery", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
    const stageColors: Record<string, string> = { lead: "hsl(var(--chart-1))", discovery: "hsl(var(--chart-2))", qualified: "hsl(var(--chart-3))", proposal: "hsl(var(--chart-4))", negotiation: "hsl(var(--primary))", closed_won: "hsl(var(--accent))", closed_lost: "hsl(var(--destructive))" };
    return stageOrder.map(s => {
      const stageDeals = allDeals.filter((d: any) => d.stage === s);
      return { name: stageLabels[s] || s, count: stageDeals.length, value: stageDeals.reduce((sum: number, d: any) => sum + (Number(d.totalValue) || 0), 0), color: stageColors[s] || COLORS[0] };
    }).filter(s => s.count > 0);
  }, [allDeals]);

  const companyMap = useMemo(() => {
    const map: Record<string, string> = {};
    comps.forEach((c: any) => { map[c.id] = c.name; });
    return map;
  }, [comps]);

  const recentDeals = useMemo(() => {
    return [...allDeals].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 8);
  }, [allDeals]);

  const { openDeals, openValue, closedWon, closedLost, winRate } = dealStats;

  const isLoading = compLoading || contLoading || dealsLoading;
  if (isLoading) {
    return <div className="grid grid-cols-4 grid-rows-3 gap-3 h-full">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-full w-full rounded-lg" />)}</div>;
  }

  return (
    <div className="grid grid-cols-12 grid-rows-3 gap-3 h-full" data-testid="screen-crm">
      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-companies">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Companies</span>
          <Building2 className="h-4 w-4 text-primary/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{comps.length}</p>
        <span className="text-[9px] font-mono uppercase text-primary">{comps.filter((c: any) => c.status === "active").length} active</span>
      </div>

      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-contacts">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Contacts</span>
          <Users className="h-4 w-4 text-accent/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{conts.length}</p>
        <span className="text-[9px] font-mono uppercase text-accent">{comps.length} companies</span>
      </div>

      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-active-deals">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Active Deals</span>
          <Briefcase className="h-4 w-4 text-chart-2/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{openDeals.length}</p>
        <span className="text-[9px] font-mono uppercase text-chart-2">{fmtCurrency(openValue)} pipeline</span>
      </div>

      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-win-rate">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Win Rate</span>
          <Trophy className="h-4 w-4 text-accent/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{winRate}%</p>
        <span className="text-[9px] font-mono uppercase text-accent">{closedWon}W / {closedLost}L</span>
      </div>

      <div className="col-span-5 row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-deal-funnel">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Deal Funnel
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{allDeals.length} total</span>
        </div>
        <div className="flex-1 min-h-0">
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                  {stageData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center"><p className="text-xs text-muted-foreground">No deal data</p></div>
          )}
        </div>
      </div>

      <div className="col-span-4 row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-recent-deals">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Recent Deals
          </h3>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {recentDeals.length > 0 ? recentDeals.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-card/20 hover:bg-card/40 transition-colors" data-testid={`crm-deal-${d.id}`}>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{d.title || "Untitled"}</p>
                <p className="text-[9px] font-mono text-muted-foreground">{companyMap[d.companyId] || "—"} · {fmtCurrency(Number(d.totalValue) || 0)}</p>
              </div>
              <Badge variant="outline" className={cn("text-[9px] font-mono shrink-0 ml-2",
                d.stage === "closed_won" ? "bg-accent/10 text-accent border-accent/20" :
                d.stage === "closed_lost" ? "bg-destructive/10 text-destructive border-destructive/20" :
                d.stage === "negotiation" ? "bg-primary/10 text-primary border-primary/20" :
                "bg-muted/50 text-muted-foreground border-border/50"
              )}>{stageLabels[d.stage] || d.stage}</Badge>
            </div>
          )) : <p className="text-xs text-muted-foreground text-center py-4">No deals yet</p>}
        </div>
      </div>

      <div className="col-span-3 row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-pipeline-summary">
        <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <Layers className="h-3.5 w-3.5" /> Pipeline Summary
        </h3>
        <div className="flex-1 overflow-y-auto space-y-2">
          {stageData.length > 0 ? stageData.map((s) => (
            <div key={s.name} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground">
                <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />{s.name}
              </span>
              <div className="text-right">
                <span className="text-[10px] font-mono font-semibold">{s.count}</span>
                <span className="text-[9px] font-mono text-muted-foreground ml-1.5">{fmtCurrency(s.value)}</span>
              </div>
            </div>
          )) : <p className="text-xs text-muted-foreground text-center py-4">No data</p>}
        </div>
      </div>
    </div>
  );
}