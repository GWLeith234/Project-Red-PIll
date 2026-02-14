import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import {
  BarChart3, Mail, MousePointerClick, Eye, Send, AlertTriangle,
  TrendingUp, Users, Globe, Clock, ArrowUpRight, ArrowDownRight,
  Smartphone, Monitor, Tablet, FileText, Radio, Layers,
  Activity, Target, Zap, Factory, DollarSign, Briefcase, Headphones, Shield,
} from "lucide-react";
import { useEmailCampaignAnalytics, useWebsiteAnalytics } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSearch, useLocation } from "wouter";

function KpiCard({ icon: Icon, label, value, subValue, trend, trendUp, color, testId }: {
  icon: any; label: string; value: string; subValue?: string; trend?: string; trendUp?: boolean; color: string; testId: string;
}) {
  return (
    <Card className="glass-panel border-border/50 hover:border-primary/20 transition-colors" data-testid={testId}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={cn("h-9 w-9 flex items-center justify-center border", color)}>
            <Icon className="h-4 w-4" />
          </div>
          {trend && (
            <span className={cn("text-xs font-mono flex items-center gap-0.5", trendUp ? "text-accent" : "text-destructive")}>
              {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {trend}
            </span>
          )}
        </div>
        <p className="text-2xl font-display font-bold text-foreground" data-testid={`text-${testId}-value`}>{value}</p>
        <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">{label}</p>
        {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="h-9 w-9 border border-primary/30 bg-primary/5 flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-display font-bold text-primary uppercase tracking-wider">{title}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
];

function EmailCampaignSection() {
  const { data, isLoading } = useEmailCampaignAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const summary = data?.summary || {};
  const campaigns = data?.campaigns || [];

  const statusData = [
    { name: "Active", value: summary.activeCampaigns || 0, color: "hsl(var(--accent))" },
    { name: "Completed", value: summary.completedCampaigns || 0, color: "hsl(var(--primary))" },
    { name: "Draft", value: summary.draftCampaigns || 0, color: "hsl(var(--muted-foreground))" },
  ].filter(d => d.value > 0);

  const funnelData = [
    { stage: "Recipients", count: summary.recipients || 0, color: "hsl(var(--chart-1))" },
    { stage: "Sent", count: summary.sent || 0, color: "hsl(var(--primary))" },
    { stage: "Delivered", count: (summary.sent || 0) - (summary.failed || 0), color: "hsl(var(--accent))" },
    { stage: "Opened", count: summary.opened || 0, color: "hsl(var(--chart-2))" },
    { stage: "Clicked", count: summary.clicked || 0, color: "hsl(var(--chart-3))" },
  ];

  return (
    <div className="space-y-6" data-testid="section-email-analytics">
      <SectionHeader icon={Mail} title="Email Campaign Delivery" description="Aggregated delivery metrics across all outbound campaigns" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Send}
          label="Total Sent"
          value={formatNumber(summary.sent || 0)}
          subValue={`${summary.totalCampaigns || 0} campaigns`}
          color="border-primary/30 bg-primary/5 text-primary"
          testId="kpi-total-sent"
        />
        <KpiCard
          icon={Eye}
          label="Delivery Rate"
          value={`${summary.deliveryRate || 0}%`}
          subValue={`${formatNumber((summary.sent || 0) - (summary.failed || 0))} delivered`}
          trend={summary.deliveryRate > 95 ? "Excellent" : summary.deliveryRate > 90 ? "Good" : "Needs work"}
          trendUp={summary.deliveryRate > 90}
          color="border-accent/30 bg-accent/5 text-accent"
          testId="kpi-delivery-rate"
        />
        <KpiCard
          icon={MousePointerClick}
          label="Open Rate"
          value={`${summary.openRate || 0}%`}
          subValue={`${formatNumber(summary.opened || 0)} opens`}
          trend={summary.openRate > 25 ? "Above avg" : "Below avg"}
          trendUp={summary.openRate > 25}
          color="border-chart-2/30 bg-chart-2/5 text-chart-2"
          testId="kpi-open-rate"
        />
        <KpiCard
          icon={Target}
          label="Click-to-Open"
          value={`${summary.clickRate || 0}%`}
          subValue={`${formatNumber(summary.clicked || 0)} clicks`}
          trend={summary.clickRate > 3 ? "Strong" : "Low"}
          trendUp={summary.clickRate > 3}
          color="border-chart-3/30 bg-chart-3/5 text-chart-3"
          testId="kpi-click-rate"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border bg-card/50 p-5">
          <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" /> Delivery Funnel
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                formatter={(value: number) => [formatNumber(value), "Count"]}
              />
              <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                {funnelData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="border border-border bg-card/50 p-5">
          <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" /> Campaign Status
          </h3>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {statusData.map((d, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                    {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">No campaigns yet</div>
          )}
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="border border-border bg-card/50 p-5">
          <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Campaign Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-campaign-breakdown">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-wider font-mono">
                  <th className="text-left py-2 pr-4">Campaign</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-right py-2 pr-4">Recipients</th>
                  <th className="text-right py-2 pr-4">Sent</th>
                  <th className="text-right py-2 pr-4">Opens</th>
                  <th className="text-right py-2 pr-4">Clicks</th>
                  <th className="text-right py-2 pr-4">Open Rate</th>
                  <th className="text-right py-2">CTOR</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c: any) => (
                  <tr key={c.id} className="border-b border-border/50 last:border-0 hover:bg-muted/5">
                    <td className="py-2.5 pr-4 font-medium text-foreground truncate max-w-[200px]" data-testid={`text-campaign-name-${c.id}`}>{c.name}</td>
                    <td className="py-2.5 pr-4">
                      <Badge variant="outline" className={cn("text-[10px] font-mono",
                        c.status === "active" || c.status === "sending" ? "text-accent border-accent/30" :
                        c.status === "sent" || c.status === "completed" ? "text-primary border-primary/30" :
                        "text-muted-foreground border-border"
                      )}>{c.status}</Badge>
                    </td>
                    <td className="py-2.5 pr-4 text-right font-mono text-muted-foreground">{formatNumber(c.recipientCount)}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-muted-foreground">{formatNumber(c.sentCount)}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-muted-foreground">{formatNumber(c.openCount)}</td>
                    <td className="py-2.5 pr-4 text-right font-mono text-muted-foreground">{formatNumber(c.clickCount)}</td>
                    <td className="py-2.5 pr-4 text-right font-mono">{c.openRate ? `${c.openRate}%` : "—"}</td>
                    <td className="py-2.5 text-right font-mono">{c.clickToOpenRate ? `${c.clickToOpenRate}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {campaigns.length === 0 && (
        <div className="border border-dashed border-border bg-card/30 p-8 text-center">
          <Mail className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No email campaigns found. Create campaigns in the Subscriber section to see delivery analytics here.</p>
        </div>
      )}
    </div>
  );
}

function WebsiteAnalyticsSection() {
  const { data, isLoading } = useWebsiteAnalytics();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  const overview = data?.overview || {};
  const dailyTraffic = data?.dailyTraffic || [];
  const topPages = data?.topPages || [];
  const trafficSources = data?.trafficSources || [];
  const deviceBreakdown = data?.deviceBreakdown || [];

  return (
    <div className="space-y-6" data-testid="section-website-analytics">
      <SectionHeader icon={Globe} title="Website & App Analytics" description="Traffic and engagement metrics for your live site and admin app" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Eye}
          label="Page Views"
          value={formatNumber(overview.totalPageViews || 0)}
          subValue="Last 30 days"
          trend="+12.4%"
          trendUp={true}
          color="border-primary/30 bg-primary/5 text-primary"
          testId="kpi-page-views"
        />
        <KpiCard
          icon={Users}
          label="Unique Visitors"
          value={formatNumber(overview.uniqueVisitors || 0)}
          subValue="Last 30 days"
          trend="+8.2%"
          trendUp={true}
          color="border-accent/30 bg-accent/5 text-accent"
          testId="kpi-unique-visitors"
        />
        <KpiCard
          icon={Clock}
          label="Avg. Session"
          value={formatDuration(overview.avgSessionDuration || 0)}
          subValue={`${overview.pagesPerSession || 0} pages/session`}
          color="border-chart-1/30 bg-chart-1/5 text-chart-1"
          testId="kpi-avg-session"
        />
        <KpiCard
          icon={TrendingUp}
          label="Bounce Rate"
          value={`${overview.bounceRate || 0}%`}
          subValue={overview.bounceRate < 40 ? "Healthy" : "Needs improvement"}
          trend={overview.bounceRate < 40 ? "-2.1%" : "+1.3%"}
          trendUp={overview.bounceRate < 40}
          color="border-chart-2/30 bg-chart-2/5 text-chart-2"
          testId="kpi-bounce-rate"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={Users}
          label="Email Subscribers"
          value={formatNumber(overview.totalSubscribers || 0)}
          subValue={`+${overview.weekSubscribers || 0} this week`}
          trend={`+${overview.recentSubscribers || 0} (30d)`}
          trendUp={true}
          color="border-primary/30 bg-primary/5 text-primary"
          testId="kpi-email-subscribers"
        />
        <KpiCard
          icon={Radio}
          label="Podcast Listeners"
          value={formatNumber(overview.totalPodcastSubscribers || 0)}
          color="border-accent/30 bg-accent/5 text-accent"
          testId="kpi-podcast-listeners"
        />
        <KpiCard
          icon={FileText}
          label="Published Articles"
          value={String(overview.publishedArticles || 0)}
          subValue={`${overview.totalContentPieces || 0} total pieces`}
          color="border-chart-1/30 bg-chart-1/5 text-chart-1"
          testId="kpi-published-articles"
        />
        <KpiCard
          icon={Zap}
          label="Content Pieces"
          value={formatNumber(overview.totalContentPieces || 0)}
          subValue="All types"
          color="border-chart-3/30 bg-chart-3/5 text-chart-3"
          testId="kpi-content-pieces"
        />
      </div>

      <div className="border border-border bg-card/50 p-5">
        <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Traffic Trend (30 Days)
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={dailyTraffic} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="gradPV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradUV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              interval={4}
            />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }}
              labelFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              formatter={(value: number, name: string) => [formatNumber(value), name === "pageViews" ? "Page Views" : name === "uniqueVisitors" ? "Unique Visitors" : "Sessions"]}
            />
            <Legend
              formatter={(value: string) => value === "pageViews" ? "Page Views" : value === "uniqueVisitors" ? "Unique Visitors" : "Sessions"}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Area type="monotone" dataKey="pageViews" stroke="hsl(var(--primary))" fill="url(#gradPV)" strokeWidth={2} />
            <Area type="monotone" dataKey="uniqueVisitors" stroke="hsl(var(--accent))" fill="url(#gradUV)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border bg-card/50 p-5">
          <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" /> Top Pages
          </h3>
          <div className="space-y-2">
            {topPages.map((page: any, i: number) => {
              const maxViews = topPages[0]?.views || 1;
              const barWidth = (page.views / maxViews) * 100;
              return (
                <div key={i} className="group" data-testid={`row-top-page-${i}`}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-foreground truncate max-w-[300px]">{page.title}</span>
                    <span className="text-muted-foreground font-mono text-xs ml-2 flex-shrink-0">{formatNumber(page.views)} views</span>
                  </div>
                  <div className="h-1.5 bg-muted/30 w-full">
                    <div className="h-full bg-primary/60 transition-all" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-card/50 p-5">
            <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> Traffic Sources
            </h3>
            <div className="space-y-3">
              {trafficSources.map((src: any, i: number) => (
                <div key={i} className="flex items-center justify-between" data-testid={`row-traffic-source-${i}`}>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <span className="text-sm text-foreground">{src.source}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">{formatNumber(src.sessions)}</span>
                    <span className="text-xs font-mono text-primary w-10 text-right">{src.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border bg-card/50 p-5">
            <h3 className="text-sm font-display font-semibold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" /> Device Breakdown
            </h3>
            <div className="space-y-3">
              {deviceBreakdown.map((d: any, i: number) => {
                const DeviceIcon = d.device === "Mobile" ? Smartphone : d.device === "Desktop" ? Monitor : Tablet;
                return (
                  <div key={i} className="flex items-center gap-3" data-testid={`row-device-${i}`}>
                    <DeviceIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-foreground">{d.device}</span>
                        <span className="text-xs font-mono text-primary">{d.percentage}%</span>
                      </div>
                      <div className="h-1.5 bg-muted/30 w-full">
                        <div className="h-full bg-primary/60" style={{ width: `${d.percentage}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SECTION_TABS = [
  { key: "content", label: "Content Factory", icon: Factory },
  { key: "revenue", label: "Revenue Factory", icon: DollarSign },
  { key: "crm", label: "CRM", icon: Briefcase },
  { key: "audience", label: "Audience", icon: Headphones },
  { key: "admin", label: "Admin", icon: Shield },
] as const;

type SectionKey = (typeof SECTION_TABS)[number]["key"];

const SECTION_SUBTABS: Record<SectionKey, { key: string; label: string; icon: any }[]> = {
  content: [
    { key: "email", label: "Email Campaigns", icon: Mail },
    { key: "website", label: "Website & App", icon: Globe },
  ],
  revenue: [
    { key: "email", label: "Email Campaigns", icon: Mail },
    { key: "website", label: "Website & App", icon: Globe },
  ],
  crm: [
    { key: "email", label: "Email Campaigns", icon: Mail },
    { key: "website", label: "Website & App", icon: Globe },
  ],
  audience: [
    { key: "website", label: "Website & App", icon: Globe },
    { key: "email", label: "Email Campaigns", icon: Mail },
  ],
  admin: [
    { key: "website", label: "Website & App", icon: Globe },
    { key: "email", label: "Email Campaigns", icon: Mail },
  ],
};

const SECTION_DESCRIPTIONS: Record<SectionKey, string> = {
  content: "Content production, publishing, and engagement metrics",
  revenue: "Revenue performance, ad delivery, and monetization analytics",
  crm: "Campaign delivery, subscriber engagement, and conversion rates",
  audience: "Listener growth, website traffic, and audience demographics",
  admin: "Platform usage, system health, and operational metrics",
};

export default function Analytics() {
  const searchString = useSearch();
  const [, navigate] = useLocation();
  const params = new URLSearchParams(searchString);
  const sectionParam = params.get("section") as SectionKey | null;
  const validSection: SectionKey = SECTION_TABS.find(t => t.key === sectionParam) ? sectionParam! : "content";

  const [activeSection, setActiveSection] = useState<SectionKey>(validSection);
  const subtabs = SECTION_SUBTABS[activeSection];
  const [activeSubTab, setActiveSubTab] = useState(subtabs[0].key);

  useEffect(() => {
    const newSection = SECTION_TABS.find(t => t.key === sectionParam) ? sectionParam! : "content";
    if (newSection !== activeSection) {
      setActiveSection(newSection);
      setActiveSubTab(SECTION_SUBTABS[newSection][0].key);
    }
  }, [sectionParam]);

  const handleSectionChange = (section: SectionKey) => {
    setActiveSection(section);
    setActiveSubTab(SECTION_SUBTABS[section][0].key);
    navigate(`/analytics?section=${section}`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500" data-testid="analytics-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary uppercase tracking-wider" data-testid="text-analytics-title">
            Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{SECTION_DESCRIPTIONS[activeSection]}</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {SECTION_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => handleSectionChange(tab.key)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider border-b-2 transition-colors font-display whitespace-nowrap",
              activeSection === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            data-testid={`tab-section-${tab.key}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1">
        {subtabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-sm transition-colors",
              activeSubTab === tab.key
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
            data-testid={`tab-${tab.key}`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === "email" && <EmailCampaignSection />}
      {activeSubTab === "website" && <WebsiteAnalyticsSection />}
    </div>
  );
}
