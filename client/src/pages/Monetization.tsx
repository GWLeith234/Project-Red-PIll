import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { DollarSign, Users, Target, Briefcase, Plus, Filter, Download, Loader2, UserPlus } from "lucide-react";
import { useAdvertisers, useMetrics, useCreateAdvertiser, useCreateCampaign } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
  const createAdvertiser = useCreateAdvertiser();
  const createCampaign = useCreateCampaign();
  const { toast } = useToast();

  const [advOpen, setAdvOpen] = useState(false);
  const [campOpen, setCampOpen] = useState(false);
  const [advForm, setAdvForm] = useState({ name: "", type: "Direct", monthlySpend: "" });
  const [campForm, setCampForm] = useState({ name: "", advertiserId: "", budget: "", status: "active" });

  function handleAdvSubmit(e: React.FormEvent) {
    e.preventDefault();
    createAdvertiser.mutate(
      { name: advForm.name, type: advForm.type, monthlySpend: parseFloat(advForm.monthlySpend) || 0 },
      {
        onSuccess: () => {
          toast({ title: "Advertiser Added", description: `${advForm.name} is now in the network.` });
          setAdvOpen(false);
          setAdvForm({ name: "", type: "Direct", monthlySpend: "" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  }

  function handleCampSubmit(e: React.FormEvent) {
    e.preventDefault();
    createCampaign.mutate(
      { name: campForm.name, advertiserId: campForm.advertiserId, budget: parseFloat(campForm.budget) || 0, status: campForm.status },
      {
        onSuccess: () => {
          toast({ title: "Campaign Created", description: `"${campForm.name}" is now live.` });
          setCampOpen(false);
          setCampForm({ name: "", advertiserId: "", budget: "", status: "active" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Revenue Engine</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Ad Server: ONLINE | Yield Optimization: ACTIVE</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setAdvOpen(true)} className="font-mono text-xs uppercase tracking-wider border-border bg-card/50" data-testid="button-new-advertiser">
            <UserPlus className="mr-2 h-3 w-3" />
            New Advertiser
          </Button>
          <Button onClick={() => setCampOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-new-campaign">
            <Plus className="mr-2 h-3 w-3" />
            New Campaign
          </Button>
        </div>
      </div>

      <Dialog open={advOpen} onOpenChange={setAdvOpen}>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add Advertiser</DialogTitle>
            <DialogDescription className="font-mono text-xs">Register a new advertising partner</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdvSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adv-name" className="font-mono text-xs uppercase tracking-wider">Company Name</Label>
              <Input id="adv-name" placeholder="e.g. TechCorp Inc." value={advForm.name} onChange={(e) => setAdvForm({ ...advForm, name: e.target.value })} required data-testid="input-advertiser-name" />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Type</Label>
              <Select value={advForm.type} onValueChange={(v) => setAdvForm({ ...advForm, type: v })}>
                <SelectTrigger data-testid="select-advertiser-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Direct">Direct</SelectItem>
                  <SelectItem value="Programmatic">Programmatic</SelectItem>
                  <SelectItem value="Affiliate">Affiliate</SelectItem>
                  <SelectItem value="Agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adv-spend" className="font-mono text-xs uppercase tracking-wider">Monthly Spend ($)</Label>
              <Input id="adv-spend" type="number" placeholder="e.g. 25000" value={advForm.monthlySpend} onChange={(e) => setAdvForm({ ...advForm, monthlySpend: e.target.value })} data-testid="input-advertiser-spend" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdvOpen(false)} className="font-mono text-xs" data-testid="button-cancel-advertiser">Cancel</Button>
              <Button type="submit" disabled={createAdvertiser.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-advertiser">
                {createAdvertiser.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <UserPlus className="mr-2 h-3 w-3" />}
                Add Advertiser
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={campOpen} onOpenChange={setCampOpen}>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create Campaign</DialogTitle>
            <DialogDescription className="font-mono text-xs">Launch a new advertising campaign</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCampSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="camp-name" className="font-mono text-xs uppercase tracking-wider">Campaign Name</Label>
              <Input id="camp-name" placeholder="e.g. Q1 Brand Awareness" value={campForm.name} onChange={(e) => setCampForm({ ...campForm, name: e.target.value })} required data-testid="input-campaign-name" />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Advertiser</Label>
              <Select value={campForm.advertiserId} onValueChange={(v) => setCampForm({ ...campForm, advertiserId: v })} required>
                <SelectTrigger data-testid="select-campaign-advertiser">
                  <SelectValue placeholder="Select an advertiser" />
                </SelectTrigger>
                <SelectContent>
                  {advertisers?.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-budget" className="font-mono text-xs uppercase tracking-wider">Budget ($)</Label>
              <Input id="camp-budget" type="number" placeholder="e.g. 50000" value={campForm.budget} onChange={(e) => setCampForm({ ...campForm, budget: e.target.value })} data-testid="input-campaign-budget" />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Status</Label>
              <Select value={campForm.status} onValueChange={(v) => setCampForm({ ...campForm, status: v })}>
                <SelectTrigger data-testid="select-campaign-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCampOpen(false)} className="font-mono text-xs" data-testid="button-cancel-campaign">Cancel</Button>
              <Button type="submit" disabled={createCampaign.isPending || !campForm.advertiserId} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-campaign">
                {createCampaign.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                Launch Campaign
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
