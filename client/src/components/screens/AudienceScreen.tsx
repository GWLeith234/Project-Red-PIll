import { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { Mail, Headphones, Send, Radio, PieChart as PieChartIcon, Megaphone, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSubscribers, usePodcasts, useOutboundCampaigns } from "@/lib/api";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function formatCount(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return String(n);
}

export default function AudienceScreen() {
  const { data: subscribers, isLoading: subLoading } = useSubscribers();
  const { data: podcasts, isLoading: podLoading } = usePodcasts();
  const { data: outboundCampaigns, isLoading: campLoading } = useOutboundCampaigns();

  const subs = subscribers || [];
  const pods = podcasts || [];
  const camps = outboundCampaigns || [];

  const audienceStats = useMemo(() => {
    const totalSubs = subs.length;
    const totalListeners = pods.reduce((sum: number, p: any) => sum + (Number(p.subscribers) || 0), 0);
    const totalCamps = camps.length;
    const totalSent = camps.reduce((sum: number, c: any) => sum + (Number(c.sentCount) || 0), 0);
    const totalOpens = camps.reduce((sum: number, c: any) => sum + (Number(c.openCount) || 0), 0);
    const openRate = totalSent > 0 ? Math.round((totalOpens / totalSent) * 100) : 0;
    return { totalSubs, totalListeners, totalCamps, totalSent, totalOpens, openRate };
  }, [subs, pods, camps]);

  const sourceData = useMemo(() => {
    const sourceMap: Record<string, number> = {};
    subs.forEach((s: any) => { sourceMap[s.source || "unknown"] = (sourceMap[s.source || "unknown"] || 0) + 1; });
    return Object.entries(sourceMap).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value })).sort((a, b) => b.value - a.value);
  }, [subs]);

  const { totalSubs, totalListeners, totalCamps, totalSent, openRate } = audienceStats;

  const isLoading = subLoading || podLoading || campLoading;
  if (isLoading) {
    return <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(80px,1fr)] lg:grid-rows-3 gap-3 h-full">{Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-full min-h-[80px] w-full rounded-lg" />)}</div>;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-12 auto-rows-auto lg:grid-rows-3 gap-3 h-full" data-testid="screen-audience">
      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-total-subscribers">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Total Subscribers</span>
          <Mail className="h-4 w-4 text-primary/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{formatCount(totalSubs)}</p>
        <span className="text-[9px] font-mono uppercase text-primary">{subs.filter((s: any) => s.status === "active").length} active</span>
      </div>

      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-podcast-listeners">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Podcast Listeners</span>
          <Headphones className="h-4 w-4 text-accent/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{formatCount(totalListeners)}</p>
        <span className="text-[9px] font-mono uppercase text-accent">{pods.length} shows</span>
      </div>

      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-email-campaigns">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Email Campaigns</span>
          <Send className="h-4 w-4 text-chart-2/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{totalCamps}</p>
        <span className="text-[9px] font-mono uppercase text-chart-2">{formatCount(totalSent)} sent</span>
      </div>

      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-engagement">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Engagement</span>
          <Activity className="h-4 w-4 text-chart-3/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{openRate}%</p>
        <span className="text-[9px] font-mono uppercase text-chart-3">open rate</span>
      </div>

      <div className="col-span-2 lg:col-span-4 lg:row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-subscriber-sources">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <PieChartIcon className="h-3.5 w-3.5" /> Subscriber Sources
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{totalSubs} total</span>
        </div>
        <div className="flex-1 min-h-0">
          {sourceData.length > 0 ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" innerRadius="40%" paddingAngle={2}>
                      {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {sourceData.slice(0, 5).map((s, i) => (
                  <span key={s.name} className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground">
                    <span className="h-2 w-2 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />{s.name}: {s.value}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center"><p className="text-xs text-muted-foreground">No subscriber data</p></div>
          )}
        </div>
      </div>

      <div className="col-span-2 lg:col-span-4 lg:row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-network-shows">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5" /> Network Shows
          </h3>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {pods.length > 0 ? pods.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-2 rounded-lg border border-border/30 bg-card/20 hover:bg-card/40 transition-colors" data-testid={`podcast-item-${p.id}`}>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{p.title}</p>
                <p className="text-[9px] font-mono text-muted-foreground">{formatCount(Number(p.subscribers) || 0)} listeners</p>
              </div>
              <Badge variant="outline" className={cn("text-[9px] font-mono shrink-0 ml-2",
                p.status === "active" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/50 text-muted-foreground border-border/50"
              )}>{p.status || "draft"}</Badge>
            </div>
          )) : <p className="text-xs text-muted-foreground text-center py-4">No podcasts yet</p>}
        </div>
      </div>

      <div className="col-span-2 lg:col-span-4 lg:row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-campaign-performance">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Megaphone className="h-3.5 w-3.5" /> Campaign Performance
          </h3>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
          {camps.length > 0 ? camps.slice(0, 8).map((c: any) => (
            <div key={c.id} className="p-2 rounded-lg border border-border/30 bg-card/20 hover:bg-card/40 transition-colors" data-testid={`outbound-campaign-${c.id}`}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium truncate flex-1 min-w-0">{c.name || "Campaign"}</p>
                <Badge variant="outline" className={cn("text-[9px] font-mono shrink-0 ml-2",
                  c.status === "active" || c.status === "sending" ? "bg-accent/10 text-accent border-accent/20" :
                  c.status === "completed" ? "bg-primary/10 text-primary border-primary/20" :
                  "bg-muted/50 text-muted-foreground border-border/50"
                )}>{c.status || "draft"}</Badge>
              </div>
              <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground">
                <span>{c.sentCount || 0} sent</span>
                <span>{c.openCount || 0} opens</span>
                <span>{c.clickCount || 0} clicks</span>
              </div>
            </div>
          )) : <p className="text-xs text-muted-foreground text-center py-4">No campaigns yet</p>}
        </div>
      </div>
    </div>
  );
}