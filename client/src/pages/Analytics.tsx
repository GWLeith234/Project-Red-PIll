import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";
import DataCard from "@/components/admin/DataCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Lightbulb, AlertTriangle, Target, X, FileText, Loader2, Sparkles, Radio } from "lucide-react";
import LiveVisitorMap from "@/components/admin/LiveVisitorMap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function authFetch(url: string) {
  return fetch(url, { credentials: "include" }).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
  });
}

const DEVICE_COLORS: Record<string, string> = {
  desktop: "#8b5cf6",
  mobile: "#06b6d4",
  tablet: "#f59e0b",
};

export default function Analytics() {
  const [period, setPeriod] = useState("30");
  const [showComparison, setShowComparison] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const queryClient = useQueryClient();

  const { data: cachedInsights } = useQuery({
    queryKey: ["/api/analytics/ai/cached"],
    queryFn: () => authFetch("/api/analytics/ai/cached?type=insights"),
  });

  const insightsMutation = useMutation({
    mutationFn: () => fetch("/api/analytics/ai/insights", {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ period: `${period}d` }),
    }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/ai/cached"] });
      setShowAiPanel(true);
    },
  });

  const digestMutation = useMutation({
    mutationFn: () => fetch("/api/analytics/ai/digest", {
      method: "POST", credentials: "include",
    }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
  });

  const { data: overview } = useQuery({
    queryKey: ["/api/analytics/overview", period],
    queryFn: () => authFetch(`/api/analytics/overview?period=${period}`),
    refetchInterval: 10000,
  });

  const { data: pageviews } = useQuery({
    queryKey: ["/api/analytics/pageviews", period],
    queryFn: () => authFetch(`/api/analytics/pageviews?period=${period}`),
  });

  const { data: topPages } = useQuery({
    queryKey: ["/api/analytics/top-pages", period],
    queryFn: () => authFetch(`/api/analytics/top-pages?period=${period}&limit=20`),
  });

  const { data: devices } = useQuery({
    queryKey: ["/api/analytics/devices", period],
    queryFn: () => authFetch(`/api/analytics/devices?period=${period}`),
  });

  const { data: referrers } = useQuery({
    queryKey: ["/api/analytics/referrers", period],
    queryFn: () => authFetch(`/api/analytics/referrers?period=${period}`),
  });

  const { data: geo } = useQuery({
    queryKey: ["/api/analytics/geo", period],
    queryFn: () => authFetch(`/api/analytics/geo?period=${period}`),
  });

  const { data: sessions } = useQuery({
    queryKey: ["/api/analytics/sessions", period],
    queryFn: () => authFetch(`/api/analytics/sessions?period=${period}`),
  });

  const { data: bounceRate } = useQuery({
    queryKey: ["/api/analytics/bounce-rate", period],
    queryFn: () => authFetch(`/api/analytics/bounce-rate?period=${period}`),
  });

  const { data: nps } = useQuery({
    queryKey: ["/api/analytics/nps"],
    queryFn: () => authFetch("/api/analytics/nps"),
  });

  const { data: contentPerf } = useQuery({
    queryKey: ["/api/analytics/content-performance", period],
    queryFn: () => authFetch(`/api/analytics/content-performance?period=${period}`),
  });

  const metrics = [
    { label: "Live Visitors", value: overview?.liveVisitors ?? "—" },
    { label: "Total Pageviews", value: overview?.totalPageviews ?? "—" },
    { label: "Unique Visitors", value: overview?.uniqueVisitors ?? "—" },
    {
      label: "Avg Duration",
      value: overview?.avgSessionDuration ? formatDuration(overview.avgSessionDuration) : "—",
    },
    {
      label: "Bounce Rate",
      value: overview?.bounceRate != null ? `${overview.bounceRate}%` : "—",
    },
  ];

  const referrerTotal =
    referrers?.reduce((sum: number, r: any) => sum + (r.count || 0), 0) || 0;

  const deviceData = devices?.devices || [];
  const browserData = (devices?.browsers || []).slice(0, 5);
  const osData = (devices?.os || []).slice(0, 5);

  const aiInsights = insightsMutation.data || cachedInsights?.data;

  return (
    <div className="space-y-6" data-testid="page-analytics">
      <PageHeader pageKey="analytics" onAIAction={() => {
        if (cachedInsights?.data) {
          setShowAiPanel(true);
        } else {
          insightsMutation.mutate();
        }
      }} />

      <div className="flex items-center gap-2" data-testid="period-selector">
        <span className="text-xs text-muted-foreground font-mono uppercase">Period:</span>
        {[
          { label: "7 Days", value: "7" },
          { label: "30 Days", value: "30" },
          { label: "90 Days", value: "90" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              period === p.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            data-testid={`button-period-${p.value}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {showAiPanel && (
        <div className="fixed inset-0 z-50 flex justify-end" data-testid="ai-panel-overlay">
          <div className="absolute inset-0 bg-background/50" onClick={() => setShowAiPanel(false)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-400" /> AI Analytics</h2>
              <button onClick={() => setShowAiPanel(false)} className="p-1 hover:bg-muted rounded" data-testid="button-close-ai-panel"><X className="w-5 h-5" /></button>
            </div>
            {insightsMutation.isPending && (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-400" /><span className="ml-3 text-muted-foreground">Analyzing data...</span></div>
            )}
            {aiInsights && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-yellow-400"><Lightbulb className="w-4 h-4" /> Key Insights</h3>
                  <ul className="space-y-2">{(aiInsights.insights || []).map((t: string, i: number) => (
                    <li key={i} className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/40">{t}</li>
                  ))}</ul>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-red-400"><AlertTriangle className="w-4 h-4" /> Concerns</h3>
                  <ul className="space-y-2">{(aiInsights.concerns || []).map((t: string, i: number) => (
                    <li key={i} className="text-sm text-foreground bg-red-500/10 p-3 rounded-lg border border-red-500/20">{t}</li>
                  ))}</ul>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-green-400"><Target className="w-4 h-4" /> Recommendations</h3>
                  <ul className="space-y-2">{(aiInsights.recommendations || []).map((t: string, i: number) => (
                    <li key={i} className="text-sm text-foreground bg-green-500/10 p-3 rounded-lg border border-green-500/20">{t}</li>
                  ))}</ul>
                </div>
                <div className="pt-4 border-t border-border/40 space-y-3">
                  <Button variant="outline" size="sm" onClick={() => insightsMutation.mutate()} disabled={insightsMutation.isPending} data-testid="button-refresh-insights">
                    {insightsMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Refresh Insights
                  </Button>
                  <Button variant="outline" size="sm" className="ml-2" onClick={() => digestMutation.mutate()} disabled={digestMutation.isPending} data-testid="button-generate-digest">
                    {digestMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />} Weekly Digest
                  </Button>
                  {digestMutation.data?.digest && (
                    <div className="mt-3 p-4 bg-muted/30 rounded-lg border border-border/40 text-sm text-foreground whitespace-pre-wrap">{digestMutation.data.digest}</div>
                  )}
                </div>
              </>
            )}
            {!insightsMutation.isPending && !aiInsights && (
              <div className="text-center py-12">
                <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground mb-4">Generate AI-powered insights from your analytics data</p>
                <Button onClick={() => insightsMutation.mutate()} data-testid="button-generate-insights"><Sparkles className="w-4 h-4 mr-2" /> Generate Insights</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <DataCard title="Live Visitor Map" subtitle="Real-time global visitor activity" data-testid="card-live-map">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Broadcasting</span>
          </div>
          <div className="flex items-center gap-2">
            {process.env.NODE_ENV !== "production" && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-mono"
                onClick={async () => {
                  for (let i = 0; i < 10; i++) {
                    await fetch("/api/analytics/simulate-visitor", { method: "POST", credentials: "include" });
                    await new Promise(r => setTimeout(r, 500));
                  }
                }}
                data-testid="button-simulate-visitors"
              >
                Simulate 10 Visitors
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="text-xs font-mono"
              onClick={() => window.open("/analytics/live-map", "_blank")}
              data-testid="button-fullscreen-map"
            >
              Fullscreen
            </Button>
          </div>
        </div>
        <LiveVisitorMap />
      </DataCard>

      <Tabs defaultValue="website" data-testid="analytics-tabs">
        <TabsList data-testid="analytics-tabs-list">
          <TabsTrigger value="website" data-testid="tab-website">Website</TabsTrigger>
          <TabsTrigger value="nps" data-testid="tab-nps">NPS &amp; Satisfaction</TabsTrigger>
          <TabsTrigger value="content" data-testid="tab-content">Content Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="website" className="space-y-6 mt-4">
          <MetricsStrip metrics={metrics} />

          {cachedInsights?.data ? (
            <DataCard title="AI Insights" data-testid="card-ai-insights-cached">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {((cachedInsights.data as any)?.insights || []).slice(0, 2).map((t: string, i: number) => (
                      <span key={i} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded-md">{t.length > 100 ? t.slice(0, 100) + "..." : t}</span>
                    ))}
                  </div>
                  <button onClick={() => setShowAiPanel(true)} className="text-xs text-purple-400 hover:text-purple-300" data-testid="button-view-all-insights">View all insights →</button>
                </div>
              </div>
            </DataCard>
          ) : (
            <DataCard title="AI Insights" data-testid="card-ai-insights-empty">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">No cached insights.</span>
                <Button size="sm" variant="outline" onClick={() => insightsMutation.mutate()} disabled={insightsMutation.isPending} data-testid="button-generate-insights-inline">
                  {insightsMutation.isPending ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1" />} Generate
                </Button>
              </div>
            </DataCard>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataCard title="Live Visitors">
              <div className="flex items-center gap-3" data-testid="widget-live-visitors">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
                <span
                  className="text-4xl font-bold text-foreground tabular-nums transition-all duration-300"
                  data-testid="text-live-visitors-count"
                >
                  {overview?.liveVisitors ?? 0}
                </span>
                <span className="text-sm text-muted-foreground">online now</span>
              </div>
            </DataCard>

            <DataCard title={`Pageviews (${period} Days)`} className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer" data-testid="label-comparison-toggle">
                  <input
                    type="checkbox"
                    checked={showComparison}
                    onChange={(e) => setShowComparison(e.target.checked)}
                    className="rounded border-border"
                    data-testid="checkbox-comparison"
                  />
                  Show previous period
                </label>
              </div>
              <div data-testid="widget-pageviews-chart" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pageviews?.current || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      labelStyle={{ color: "#d1d5db" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                      name="Current"
                    />
                    {showComparison && pageviews?.previous && (
                      <Line
                        type="monotone"
                        dataKey="views"
                        data={pageviews.previous}
                        stroke="#6b7280"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                        dot={false}
                        name="Previous"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DataCard>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <DataCard title="Top Pages">
              <div className="overflow-x-auto" data-testid="widget-top-pages">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Page URL</th>
                      <th className="pb-2 font-medium text-right">Views</th>
                      <th className="pb-2 font-medium text-right">Avg Time</th>
                      <th className="pb-2 font-medium text-right">Bounce Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topPages || []).map((page: any, i: number) => (
                      <tr key={i} className="border-b border-border/50" data-testid={`row-top-page-${i}`}>
                        <td className="py-2 text-foreground" title={page.url}>
                          {page.url?.length > 40 ? page.url.slice(0, 40) + "…" : page.url}
                        </td>
                        <td className="py-2 text-right text-foreground">{page.views}</td>
                        <td className="py-2 text-right text-muted-foreground">
                          {page.avg_time != null ? formatDuration(Number(page.avg_time)) : "—"}
                        </td>
                        <td className="py-2 text-right text-muted-foreground">
                          {page.bounce_rate != null ? `${page.bounce_rate}%` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataCard title="Device Breakdown">
              <div data-testid="widget-device-breakdown" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      dataKey="count"
                      nameKey="type"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      label={({ name, percent }: any) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {deviceData.map((entry: any, index: number) => (
                        <Cell
                          key={index}
                          fill={DEVICE_COLORS[entry.type?.toLowerCase()] || "#8b5cf6"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </DataCard>

            <DataCard title="Browser & OS">
              <div className="grid grid-cols-2 gap-2" data-testid="widget-browser-os">
                <div className="h-56">
                  <p className="text-xs text-muted-foreground mb-1">Browsers</p>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={browserData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#9ca3af" }} width={60} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-56">
                  <p className="text-xs text-muted-foreground mb-1">Operating Systems</p>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={osData} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: "#9ca3af" }} width={60} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      />
                      <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </DataCard>

            <DataCard title="Referral Sources">
              <div className="overflow-x-auto" data-testid="widget-referrers">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Source Type</th>
                      <th className="pb-2 font-medium text-right">Count</th>
                      <th className="pb-2 font-medium text-right">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(referrers || []).map((ref: any, i: number) => (
                      <tr key={i} className="border-b border-border/50" data-testid={`row-referrer-${i}`}>
                        <td className="py-2 text-foreground">{ref.source || ref.type}</td>
                        <td className="py-2 text-right text-foreground">{ref.count}</td>
                        <td className="py-2 text-right text-muted-foreground">
                          {referrerTotal > 0
                            ? `${((ref.count / referrerTotal) * 100).toFixed(1)}%`
                            : "0%"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </DataCard>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataCard title="Geographic">
              <div data-testid="widget-geo">
                {geo && geo.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Country</th>
                        <th className="pb-2 font-medium text-right">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {geo.map((g: any, i: number) => (
                        <tr key={i} className="border-b border-border/50" data-testid={`row-geo-${i}`}>
                          <td className="py-2 text-foreground">{g.country}</td>
                          <td className="py-2 text-right text-foreground">{g.views}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-geo">
                    No geographic data available
                  </p>
                )}
              </div>
            </DataCard>

            <DataCard title="Session Duration">
              <div data-testid="widget-session-duration" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessions || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </DataCard>

            <DataCard title="Bounce Rate Trend">
              <div data-testid="widget-bounce-rate" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bounceRate || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      tickFormatter={(v: number) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      formatter={(value: number) => [`${value}%`, "Bounce Rate"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="bounce_rate"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DataCard>
          </div>
        </TabsContent>

        <TabsContent value="nps" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DataCard title="NPS Score">
              <div data-testid="widget-nps-score" className="flex flex-col items-center justify-center py-4">
                {(() => {
                  const score = nps?.npsScore ?? 0;
                  const color = score >= 50 ? "#22c55e" : score >= 0 ? "#f59e0b" : "#ef4444";
                  return (
                    <>
                      <div className="relative w-32 h-16 overflow-hidden">
                        <svg viewBox="0 0 120 60" className="w-full h-full">
                          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="#374151" strokeWidth="8" strokeLinecap="round" />
                          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${Math.max(0, ((score + 100) / 200) * 157)} 157`} />
                        </svg>
                      </div>
                      <span className="text-3xl font-display font-bold mt-2" style={{ color }}>{score}</span>
                      <span className="text-xs text-muted-foreground mt-1">{nps?.totalResponses ?? 0} responses</span>
                      <div className="flex gap-4 mt-3 text-xs">
                        <span className="text-green-400">Promoters: {nps?.promoters ?? 0}</span>
                        <span className="text-yellow-400">Passives: {nps?.passives ?? 0}</span>
                        <span className="text-red-400">Detractors: {nps?.detractors ?? 0}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </DataCard>

            <DataCard title="NPS Trend (Monthly)">
              <div data-testid="widget-nps-trend" className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(nps?.monthlyTrend || []).map((r: any) => ({
                    month: new Date(r.month).toLocaleDateString("en-US", { month: "short" }),
                    nps: r.total > 0 ? Math.round(((Number(r.promoters) - Number(r.detractors)) / Number(r.total)) * 100) : 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                    <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }} />
                    <Line type="monotone" dataKey="nps" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: "#8b5cf6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DataCard>

            <DataCard title="Satisfaction Ratings">
              <div data-testid="widget-satisfaction" className="space-y-4 py-2">
                <div className="text-center">
                  <span className="text-3xl font-display font-bold text-yellow-400">{(nps?.avgRating ?? 0).toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground ml-1">/ 5</span>
                  <div className="flex justify-center mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className={`text-lg ${s <= Math.round(nps?.avgRating ?? 0) ? "text-yellow-400" : "text-muted-foreground"}`}>★</span>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{nps?.totalFeedback ?? 0} ratings</span>
                </div>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const dist = (nps?.ratingDistribution || []) as any[];
                    const item = dist.find((d: any) => Number(d.rating) === star);
                    const count = Number(item?.count || 0);
                    const total = Math.max(nps?.totalFeedback ?? 1, 1);
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-4 text-right text-muted-foreground">{star}★</span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-8 text-right text-muted-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </DataCard>
          </div>

          <DataCard title="Recent Feedback">
            <div data-testid="widget-feedback-feed" className="max-h-80 overflow-y-auto space-y-2">
              {((nps?.recentFeedback || []) as any[]).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No feedback yet</p>
              ) : (
                ((nps?.recentFeedback || []) as any[]).map((fb: any) => (
                  <div key={fb.id} className="p-3 rounded-lg bg-muted/30 border border-border/40">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-yellow-400">{fb.rating}★</span>
                        {fb.sentiment && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            fb.sentiment === "positive" ? "bg-green-500/20 text-green-400" :
                            fb.sentiment === "negative" ? "bg-red-500/20 text-red-400" :
                            "bg-muted/50 text-muted-foreground"
                          }`}>{fb.sentiment}</span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(fb.created_at || fb.createdAt).toLocaleDateString()}</span>
                    </div>
                    {fb.feedback_text || fb.feedbackText ? (
                      <p className="text-sm text-foreground">{fb.feedback_text || fb.feedbackText}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </DataCard>
        </TabsContent>

        <TabsContent value="content" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DataCard title="Content Leaderboard by Type">
              <div data-testid="widget-content-by-tactic">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground">
                      <th className="text-left py-2 font-medium">Type</th>
                      <th className="text-right py-2 font-medium">Views</th>
                      <th className="text-right py-2 font-medium">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((contentPerf?.byTactic || []) as any[]).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-border/20">
                        <td className="py-2 capitalize">{row.type || "—"}</td>
                        <td className="text-right text-muted-foreground">{Number(row.views || 0)}</td>
                        <td className="text-right text-muted-foreground">{formatDuration(Number(row.avg_time || 0))}</td>
                      </tr>
                    ))}
                    {((contentPerf?.byTactic || []) as any[]).length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DataCard>

            <DataCard title="Content Leaderboard by Author">
              <div data-testid="widget-content-by-author">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground">
                      <th className="text-left py-2 font-medium">Author</th>
                      <th className="text-right py-2 font-medium">Pieces</th>
                      <th className="text-right py-2 font-medium">Views</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((contentPerf?.byAuthor || []) as any[]).map((row: any, i: number) => (
                      <tr key={i} className="border-b border-border/20">
                        <td className="py-2">{row.author || "Unknown"}</td>
                        <td className="text-right text-muted-foreground">{Number(row.pieces || 0)}</td>
                        <td className="text-right text-muted-foreground">{Number(row.views || 0)}</td>
                      </tr>
                    ))}
                    {((contentPerf?.byAuthor || []) as any[]).length === 0 && (
                      <tr><td colSpan={3} className="py-4 text-center text-muted-foreground">No data yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </DataCard>
          </div>

          <DataCard title="Engagement Funnel">
            <div data-testid="widget-engagement-funnel" className="flex items-end justify-center gap-6 py-6 h-64">
              {(() => {
                const funnel = contentPerf?.funnel || { impressions: 0, reads: 0, shares: 0, subscribes: 0 };
                const steps = [
                  { label: "Impressions", value: funnel.impressions, color: "#8b5cf6" },
                  { label: "Reads (>30s)", value: funnel.reads, color: "#06b6d4" },
                  { label: "Shares", value: funnel.shares, color: "#f59e0b" },
                  { label: "Subscribes", value: funnel.subscribes, color: "#22c55e" },
                ];
                const max = Math.max(...steps.map((s) => s.value), 1);
                return steps.map((step) => (
                  <div key={step.label} className="flex flex-col items-center gap-2 flex-1">
                    <span className="text-lg font-display font-bold" style={{ color: step.color }}>{step.value.toLocaleString()}</span>
                    <div className="w-full rounded-t-md" style={{
                      backgroundColor: step.color,
                      height: `${Math.max((step.value / max) * 160, 8)}px`,
                      opacity: 0.8,
                    }} />
                    <span className="text-xs text-muted-foreground text-center">{step.label}</span>
                  </div>
                ));
              })()}
            </div>
          </DataCard>

          <DataCard title="Top Content Pieces">
            <div data-testid="widget-top-content" className="max-h-80 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground">
                    <th className="text-left py-2 font-medium">Title</th>
                    <th className="text-left py-2 font-medium">Type</th>
                    <th className="text-left py-2 font-medium">Author</th>
                    <th className="text-right py-2 font-medium">Views</th>
                    <th className="text-right py-2 font-medium">Avg Time</th>
                  </tr>
                </thead>
                <tbody>
                  {((contentPerf?.topContent || []) as any[]).map((row: any, i: number) => (
                    <tr key={i} className="border-b border-border/20">
                      <td className="py-2 max-w-[200px] truncate">{row.title || "—"}</td>
                      <td className="py-2 capitalize text-muted-foreground">{row.type || "—"}</td>
                      <td className="py-2 text-muted-foreground">{row.author || "—"}</td>
                      <td className="text-right text-muted-foreground">{Number(row.views || 0)}</td>
                      <td className="text-right text-muted-foreground">{formatDuration(Number(row.avg_time || 0))}</td>
                    </tr>
                  ))}
                  {((contentPerf?.topContent || []) as any[]).length === 0 && (
                    <tr><td colSpan={5} className="py-4 text-center text-muted-foreground">No data yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </DataCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
