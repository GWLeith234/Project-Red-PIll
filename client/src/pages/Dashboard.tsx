import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid } from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, Zap, DollarSign, Users, Layers, ExternalLink, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const revenueData = [
  { name: "Jan", revenue: 24000, projected: 30000 },
  { name: "Feb", revenue: 45000, projected: 50000 },
  { name: "Mar", revenue: 78000, projected: 80000 },
  { name: "Apr", revenue: 120000, projected: 110000 },
  { name: "May", revenue: 160000, projected: 150000 },
  { name: "Jun", revenue: 210000, projected: 200000 },
  { name: "Jul", revenue: 250000, projected: 240000 },
];

const sourceData = [
  { name: "Podcast Ads", value: 45 },
  { name: "Programmatic", value: 25 },
  { name: "Affiliate AI", value: 20 },
  { name: "Lead Gen", value: 10 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Command Center</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">System Status: OPERATIONAL | v2.4.0</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-mono text-xs uppercase tracking-wider border-primary/20 hover:border-primary/50 hover:bg-primary/10 hover:text-primary">
            <ExternalLink className="mr-2 h-3 w-3" />
            Export Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider">
            <Zap className="mr-2 h-3 w-3" />
            Deploy Agent
          </Button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Monthly Revenue" 
          value="$2.18M" 
          change="+12.5%" 
          trend="up"
          icon={DollarSign}
          color="text-primary"
        />
        <MetricCard 
          title="Active Listeners" 
          value="842.3K" 
          change="+5.2%" 
          trend="up"
          icon={Users}
          color="text-chart-2"
        />
        <MetricCard 
          title="Content Pieces" 
          value="1,248" 
          change="+18.2%" 
          trend="up"
          icon={Layers}
          color="text-chart-4"
        />
        <MetricCard 
          title="Ad Fill Rate" 
          value="98.5%" 
          change="-0.4%" 
          trend="down"
          icon={Activity}
          color="text-chart-3"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="font-display tracking-wide text-lg">Revenue Trajectory</CardTitle>
            <CardDescription className="font-mono text-xs">Actual vs Projected Performance (YTD)</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    fontFamily="JetBrains Mono"
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `$${value}`} 
                    fontFamily="JetBrains Mono"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px'
                    }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="projected" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fillOpacity={1} 
                    fill="url(#colorProjected)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="font-display tracking-wide text-lg">Revenue Composition</CardTitle>
            <CardDescription className="font-mono text-xs">Distribution by Source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} opacity={0.4} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    width={80}
                    fontFamily="JetBrains Mono"
                  />
                  <Tooltip 
                     cursor={{fill: 'transparent'}}
                     contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))',
                      fontFamily: 'JetBrains Mono',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display tracking-wide text-lg">AI Content Engine</CardTitle>
              <CardDescription className="font-mono text-xs">Live Generation Queue</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse">
              PROCESSING
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Ep #142: Market Trends", action: "Generating Clips", progress: 78, time: "2m ago" },
                { title: "Interview: Sen. Paul", action: "Writing Articles", progress: 45, time: "5m ago" },
                { title: "Weekly Roundup", action: "SEO Optimization", progress: 92, time: "12m ago" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 border border-border/50 bg-card/30 rounded-sm">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{item.title}</p>
                    <div className="flex items-center text-xs text-muted-foreground font-mono">
                      <span className="text-primary mr-2">●</span>
                      {item.action}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-accent">{item.progress}%</span>
                    <p className="text-[10px] text-muted-foreground">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
           <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display tracking-wide text-lg">Network Alerts</CardTitle>
              <CardDescription className="font-mono text-xs">System Notifications</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <span className="sr-only">Settings</span>
              <Settings className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
               {[
                { title: "Ad Inventory Low", desc: "Slots for Q4 are 95% filled. Increase rate card.", type: "warning" },
                { title: "New Affiliate Partner", desc: "TechSpace joined network. projected $5k/mo.", type: "success" },
                { title: "Server Load Spike", desc: "Traffic surge from viral clip #8821.", type: "info" },
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 border-l-2 border-border bg-card/20 rounded-r-sm hover:bg-card/40 transition-colors">
                  <div className={cn(
                    "mt-0.5 h-2 w-2 rounded-full",
                    item.type === "warning" ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" : 
                    item.type === "success" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                  )} />
                  <div>
                    <p className="text-sm font-medium leading-none mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, trend, icon: Icon, color }: any) {
  return (
    <Card className="glass-panel border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">
          {title}
        </CardTitle>
        <Icon className={cn("h-4 w-4", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display tracking-tight text-foreground">{value}</div>
        <div className="flex items-center text-xs mt-1">
          {trend === 'up' ? (
            <ArrowUpRight className="h-3 w-3 text-accent mr-1" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-destructive mr-1" />
          )}
          <span className={cn("font-mono font-medium", trend === 'up' ? "text-accent" : "text-destructive")}>
            {change}
          </span>
          <span className="text-muted-foreground ml-1">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
