import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { DollarSign, Megaphone, Target, Package, BarChart3, Briefcase, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdvertisers, useCampaigns, useDeals, useProducts } from "@/lib/api";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const fmtCurrency = (n: number) => { if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`; if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`; return `$${n}`; };

export default function RevenueFactoryScreen() {
  const { data: advertisers, isLoading: advLoading } = useAdvertisers();
  const { data: campaigns, isLoading: campLoading } = useCampaigns();
  const { data: deals, isLoading: dealsLoading } = useDeals();
  const { data: products, isLoading: prodLoading } = useProducts();

  const advs = advertisers || [];
  const camps = campaigns || [];
  const allDeals = deals || [];
  const prods = products || [];

  const revenueStats = useMemo(() => {
    const wonDeals = allDeals.filter((d: any) => d.stage === "closed_won");
    const totalRevenue = wonDeals.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0);
    const activeAdvs = advs.filter((a: any) => a.status === "active");
    const totalAdSpend = advs.reduce((sum: number, a: any) => sum + (Number(a.monthlySpend) || 0), 0);
    const activeCamps = camps.filter((c: any) => c.status === "active");
    const activeProducts = prods.filter((p: any) => p.status === "active");
    return { wonDeals, totalRevenue, activeAdvs, totalAdSpend, activeCamps, activeProducts };
  }, [allDeals, advs, camps, prods]);

  const stageData = useMemo(() => {
    const stageOrder = ["lead", "discovery", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"];
    const stageLabelsMap: Record<string, string> = { lead: "Lead", discovery: "Discovery", qualified: "Qualified", proposal: "Proposal", negotiation: "Negotiation", closed_won: "Won", closed_lost: "Lost" };
    const stageColors: Record<string, string> = { lead: "hsl(var(--chart-1))", discovery: "hsl(var(--chart-2))", qualified: "hsl(var(--chart-3))", proposal: "hsl(var(--chart-4))", negotiation: "hsl(var(--primary))", closed_won: "hsl(var(--accent))", closed_lost: "hsl(var(--destructive))" };
    return stageOrder.map(s => {
      const stageDeals = allDeals.filter((d: any) => d.stage === s);
      return { name: stageLabelsMap[s] || s, value: stageDeals.reduce((sum: number, d: any) => sum + (Number(d.value) || 0), 0), count: stageDeals.length, color: stageColors[s] || COLORS[0] };
    }).filter(s => s.count > 0);
  }, [allDeals]);

  const breakdownData = useMemo(() => {
    const rateModels: Record<string, number> = {};
    prods.forEach((p: any) => { rateModels[p.rateModel || "other"] = (rateModels[p.rateModel || "other"] || 0) + 1; });
    const industries: Record<string, number> = {};
    advs.forEach((a: any) => { industries[a.industry || "other"] = (industries[a.industry || "other"] || 0) + 1; });
    const categories: Record<string, number> = {};
    prods.forEach((p: any) => { categories[p.category || "other"] = (categories[p.category || "other"] || 0) + 1; });
    return { rateModels, industries, categories };
  }, [prods, advs]);

  const recentDeals = useMemo(() => {
    return [...allDeals].sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()).slice(0, 8);
  }, [allDeals]);

  const stageLabels: Record<string, string> = { lead: "Lead", discovery: "Discovery", qualified: "Qualified", proposal: "Proposal", negotiation: "Negotiation", closed_won: "Won", closed_lost: "Lost" };

  const { wonDeals, totalRevenue, activeAdvs, totalAdSpend, activeCamps, activeProducts } = revenueStats;
  const { rateModels, industries, categories } = breakdownData;

  const isLoading = advLoading || campLoading || dealsLoading || prodLoading;
  if (isLoading) {
    return <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(80px,1fr)] lg:grid-rows-3 gap-3 h-full">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-full min-h-[80px] w-full rounded-lg" />)}</div>;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-12 auto-rows-auto lg:grid-rows-3 gap-3 h-full" data-testid="screen-revenue-factory">
      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-total-revenue">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Total Revenue</span>
          <DollarSign className="h-4 w-4 text-accent/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{fmtCurrency(totalRevenue)}</p>
        <span className="text-[9px] font-mono uppercase text-accent">{wonDeals.length} deals closed</span>
      </div>

      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-active-advertisers">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Active Advertisers</span>
          <Megaphone className="h-4 w-4 text-primary/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{activeAdvs.length}</p>
        <span className="text-[9px] font-mono uppercase text-primary">{fmtCurrency(totalAdSpend)} ad spend</span>
      </div>

      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-active-campaigns">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Active Campaigns</span>
          <Target className="h-4 w-4 text-chart-2/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{activeCamps.length}</p>
        <span className="text-[9px] font-mono uppercase text-chart-2">{camps.length} total</span>
      </div>

      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-products">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Products</span>
          <Package className="h-4 w-4 text-chart-3/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{activeProducts.length}</p>
        <span className="text-[9px] font-mono uppercase text-chart-3">{prods.length} total</span>
      </div>

      <div className="col-span-2 lg:col-span-5 lg:row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-revenue-by-stage">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Revenue by Deal Stage
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{allDeals.length} deals</span>
        </div>
        <div className="flex-1 min-h-0">
          {stageData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontFamily: "JetBrains Mono", fontSize: "11px" }} formatter={(val: number) => fmtCurrency(val)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14}>
                  {stageData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center"><p className="text-xs text-muted-foreground">No deal data</p></div>
          )}
        </div>
      </div>

      <div className="col-span-2 lg:col-span-4 lg:row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-deal-pipeline">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5" /> Deal Pipeline
          </h3>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {recentDeals.length > 0 ? recentDeals.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-card/20 hover:bg-card/40 transition-colors" data-testid={`deal-item-${d.id}`}>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{d.title || "Untitled Deal"}</p>
                <p className="text-[9px] font-mono text-muted-foreground">{fmtCurrency(Number(d.value) || 0)}</p>
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

      <div className="col-span-2 lg:col-span-3 lg:row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-revenue-breakdown">
        <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <TrendingUp className="h-3.5 w-3.5" /> Revenue Breakdown
        </h3>
        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Rate Models</p>
            {Object.entries(rateModels).map(([model, count], i) => (
              <div key={model} className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground capitalize">
                  <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{model.replace(/_/g, " ")}
                </span>
                <span className="text-[10px] font-mono font-semibold">{count}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Industries</p>
            {Object.entries(industries).slice(0, 5).map(([ind, count], i) => (
              <div key={ind} className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground capitalize">
                  <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[(i + 2) % COLORS.length] }} />{ind}
                </span>
                <span className="text-[10px] font-mono font-semibold">{count}</span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Categories</p>
            {Object.entries(categories).slice(0, 5).map(([cat, count], i) => (
              <div key={cat} className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[10px] font-mono text-muted-foreground capitalize">
                  <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[(i + 4) % COLORS.length] }} />{cat}
                </span>
                <span className="text-[10px] font-mono font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}