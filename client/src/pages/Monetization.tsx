import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { DollarSign, TrendingUp, Users, Target, Briefcase, Plus, Filter, Download } from "lucide-react";
import { useAdvertisers, useMetrics } from "@/lib/api";

const cpmData = [
  { time: "00:00", value: 12 }, { time: "04:00", value: 10 }, { time: "08:00", value: 25 },
  { time: "12:00", value: 35 }, { time: "16:00", value: 30 }, { time: "20:00", value: 22 }, { time: "23:59", value: 15 },
];

const pieData = [
  { name: 'Direct Sales', value: 65, color: 'hsl(var(--primary))' },
  { name: 'Programmatic', value: 25, color: 'hsl(var(--accent))' },
  { name: 'Affiliate', value: 10, color: 'hsl(var(--muted-foreground))' },
];

export default function Monetization() {
  const { data: advertisers, isLoading: adsLoading } = useAdvertisers();
  const { data: metrics, isLoading: metricsLoading } = useMetrics();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Revenue Engine</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Ad Server: ONLINE | Yield Optimization: ACTIVE</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-mono text-xs uppercase tracking-wider border-border bg-card/50" data-testid="button-filter">
            <Filter className="mr-2 h-3 w-3" />
            Filter View
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-new-campaign">
            <Plus className="mr-2 h-3 w-3" />
            New Campaign
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Card key={i} className="glass-panel border-border/50"><CardContent className="p-6"><Skeleton className="h-12 w-full" /></CardContent></Card>)
        ) : (
          <>
            <Card className="glass-panel border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground font-mono">AVG CPM</p>
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <div className="text-2xl font-bold font-display" data-testid="text-avg-cpm">${metrics?.avgCpm?.toFixed(2) || "0.00"}</div>
                <p className="text-xs text-accent mt-1">+4.2% from yesterday</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground font-mono">FILL RATE</p>
                  <Target className="h-4 w-4 text-accent" />
                </div>
                <div className="text-2xl font-bold font-display" data-testid="text-fill-rate">{metrics?.adFillRate?.toFixed(1) || "0"}%</div>
                <p className="text-xs text-muted-foreground mt-1">{(100 - (metrics?.adFillRate || 0)).toFixed(1)}% Unsold Inventory</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground font-mono">AD REQUESTS</p>
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold font-display">1.4M</div>
                <p className="text-xs text-accent mt-1">+12% traffic spike</p>
              </CardContent>
            </Card>
            <Card className="glass-panel border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <p className="text-sm font-medium text-muted-foreground font-mono">ACTIVE CAMPAIGNS</p>
                  <Briefcase className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold font-display" data-testid="text-active-campaigns">{advertisers?.length || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">3 pending approval</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2 glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Real-Time CPM Performance</CardTitle>
            <CardDescription className="font-mono text-xs">Dynamic pricing fluctuations over last 24h</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cpmData}>
                  <defs>
                    <linearGradient id="colorCpm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} fontFamily="JetBrains Mono"/>
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} fontFamily="JetBrains Mono"/>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'JetBrains Mono' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorCpm)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="font-display">Revenue Mix</CardTitle>
            <CardDescription className="font-mono text-xs">Source Distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'JetBrains Mono' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display">Top Advertisers</CardTitle>
            <CardDescription className="font-mono text-xs">Highest spenders this month</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="font-mono text-xs" data-testid="button-download-csv">
            <Download className="mr-2 h-3 w-3" />
            Download CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" data-testid="advertisers-list">
            {adsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : advertisers?.length > 0 ? (
              advertisers.map((ad: any) => (
                <div key={ad.id} className="flex items-center justify-between p-4 bg-card/30 rounded border border-transparent hover:border-primary/20 transition-colors" data-testid={`row-advertiser-${ad.id}`}>
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border border-primary/20">
                      {ad.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{ad.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{ad.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-bold text-foreground">${ad.monthlySpend?.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Monthly Spend</p>
                    </div>
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 uppercase font-mono text-[10px]">{ad.status}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">No advertisers yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
