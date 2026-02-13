import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid } from "recharts";
import { ArrowUpRight, ArrowDownRight, Activity, Zap, DollarSign, Users, Layers, ExternalLink, Settings, TrendingUp, Clock, ChevronRight, Linkedin, Camera, GripVertical, Eye, EyeOff, Pencil, Check, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useMetrics, useAlerts, useEpisodes, useContentPieces, useTrendingArticles, useProfile, useUpdateProfile, useAnalyzeLinkedIn } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

const ALL_WIDGETS = [
  { id: "revenue", label: "Revenue Chart" },
  { id: "composition", label: "Revenue Composition" },
  { id: "trending", label: "Trending Articles" },
  { id: "processing", label: "AI Content Engine" },
  { id: "alerts", label: "Network Alerts" },
];

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return `${n}`;
}

function ProfileCard() {
  const { user, refresh } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const analyzeLinkedIn = useAnalyzeLinkedIn();
  const { toast } = useToast();
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [showLinkedinDialog, setShowLinkedinDialog] = useState(false);

  const displayProfile = profile || user;
  const initials = (displayProfile?.displayName || displayProfile?.username || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAnalyzeLinkedIn = async () => {
    if (!linkedinUrl.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeLinkedIn.mutateAsync({ url: linkedinUrl.trim() });
      const profileData: any = {};
      if (result.profilePhoto) profileData.profilePhoto = result.profilePhoto;
      if (result.title) profileData.title = result.title;
      if (result.bio) profileData.bio = result.bio;
      if (result.displayName) profileData.displayName = result.displayName;
      profileData.linkedinUrl = result.linkedinUrl;

      await updateProfile.mutateAsync(profileData);
      await refresh();
      toast({ title: "Profile Updated", description: "Your LinkedIn profile data has been imported successfully." });
      setShowLinkedinDialog(false);
      setLinkedinUrl("");
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message || "Could not analyze LinkedIn profile.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateProfile.mutateAsync({ bio: editBio, title: editTitle });
      await refresh();
      setEditMode(false);
      toast({ title: "Profile Updated" });
    } catch {
      toast({ title: "Update Failed", variant: "destructive" });
    }
  };

  const startEdit = () => {
    setEditBio(displayProfile?.bio || "");
    setEditTitle(displayProfile?.title || "");
    setEditMode(true);
  };

  return (
    <Card className="glass-panel border-border/50 overflow-hidden" data-testid="profile-card">
      <div className="h-20 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent relative">
        <div className="absolute inset-0 bg-[url('/images/command-center-bg.png')] bg-cover opacity-20" />
      </div>
      <CardContent className="-mt-10 relative">
        <div className="flex items-end gap-4 mb-4">
          <Avatar className="h-20 w-20 border-4 border-background shadow-xl ring-2 ring-primary/20" data-testid="img-profile-photo">
            {displayProfile?.profilePhoto ? (
              <AvatarImage src={displayProfile.profilePhoto} alt={displayProfile.displayName || "Profile"} />
            ) : null}
            <AvatarFallback className="bg-primary/20 text-primary text-xl font-display">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 pb-1">
            <h2 className="text-xl font-bold font-display tracking-tight" data-testid="text-profile-name">
              {displayProfile?.displayName || displayProfile?.username || "User"}
            </h2>
            {editMode ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="h-7 text-sm mt-1 bg-background/50"
                placeholder="Your job title..."
                data-testid="input-edit-title"
              />
            ) : (
              <p className="text-sm text-muted-foreground font-mono" data-testid="text-profile-title">
                {displayProfile?.title || "Set your title"}
              </p>
            )}
          </div>
          <div className="flex gap-2 pb-1">
            {editMode ? (
              <>
                <Button size="sm" variant="ghost" onClick={() => setEditMode(false)} data-testid="button-cancel-edit">
                  <X className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={handleSaveEdit} className="bg-primary text-primary-foreground" data-testid="button-save-edit">
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={startEdit} className="border-border/50 hover:border-primary/50" data-testid="button-edit-profile">
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Dialog open={showLinkedinDialog} onOpenChange={setShowLinkedinDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-[#0A66C2] hover:bg-[#004182] text-white" data-testid="button-import-linkedin">
                      <Linkedin className="h-3 w-3 mr-1" />
                      Import LinkedIn
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-display flex items-center gap-2">
                        <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                        Import LinkedIn Profile
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                      <p className="text-sm text-muted-foreground">
                        Paste your LinkedIn profile URL below. We'll grab your photo, title, and bio automatically.
                      </p>
                      <Input
                        placeholder="https://linkedin.com/in/yourname"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        data-testid="input-linkedin-url"
                      />
                      <Button
                        onClick={handleAnalyzeLinkedIn}
                        disabled={analyzing || !linkedinUrl.trim()}
                        className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                        data-testid="button-analyze-linkedin"
                      >
                        {analyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing Profile...
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Analyze & Import
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
        {editMode ? (
          <Textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            className="bg-background/50 text-sm min-h-[60px]"
            placeholder="Write a short bio..."
            data-testid="input-edit-bio"
          />
        ) : displayProfile?.bio ? (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3" data-testid="text-profile-bio">
            {displayProfile.bio}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic" data-testid="text-profile-bio-empty">
            No bio yet. Click "Import LinkedIn" or "Edit" to add one.
          </p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px] uppercase">
            {displayProfile?.role || "user"}
          </Badge>
          {displayProfile?.linkedinUrl && (
            <a href={displayProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] hover:underline text-xs flex items-center gap-1 font-mono" data-testid="link-linkedin">
              <Linkedin className="h-3 w-3" /> LinkedIn Profile
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function WidgetCustomizer({ widgets, onToggle }: { widgets: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ALL_WIDGETS.map((w) => {
        const active = widgets.includes(w.id);
        return (
          <Button
            key={w.id}
            variant={active ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs font-mono uppercase tracking-wider",
              active ? "bg-primary/20 text-primary border-primary/30 hover:bg-primary/30" : "border-border/50 text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onToggle(w.id)}
            data-testid={`button-toggle-widget-${w.id}`}
          >
            {active ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
            {w.label}
          </Button>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = useMetrics();
  const { data: alertsData, isLoading: alertsLoading } = useAlerts();
  const { data: episodes, isLoading: episodesLoading } = useEpisodes();
  const { data: trendingArticles, isLoading: trendingLoading } = useTrendingArticles();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCustomizer, setShowCustomizer] = useState(false);

  const activeWidgets = profile?.dashboardWidgets || user?.dashboardWidgets || ["revenue", "composition", "trending", "processing", "alerts"];

  const toggleWidget = async (id: string) => {
    const current = [...activeWidgets];
    const idx = current.indexOf(id);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(id);
    }
    try {
      await updateProfile.mutateAsync({ dashboardWidgets: current });
    } catch {
      toast({ title: "Failed to update widgets", variant: "destructive" });
    }
  };

  const processingEpisodes = episodes?.filter((ep: any) => ep.processingStatus !== "complete")?.slice(0, 3) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Command Center</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">System Status: OPERATIONAL | v2.4.0</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className={cn(
              "font-mono text-xs uppercase tracking-wider border-primary/20 hover:border-primary/50 hover:bg-primary/10 hover:text-primary",
              showCustomizer && "bg-primary/10 border-primary/50 text-primary"
            )}
            onClick={() => setShowCustomizer(!showCustomizer)}
            data-testid="button-customize-dashboard"
          >
            <Settings className="mr-2 h-3 w-3" />
            Customize
          </Button>
          <Button variant="outline" className="font-mono text-xs uppercase tracking-wider border-primary/20 hover:border-primary/50 hover:bg-primary/10 hover:text-primary" data-testid="button-export">
            <ExternalLink className="mr-2 h-3 w-3" />
            Export Report
          </Button>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-deploy-agent">
            <Zap className="mr-2 h-3 w-3" />
            Deploy Agent
          </Button>
        </div>
      </div>

      <ProfileCard />

      {showCustomizer && (
        <Card className="glass-panel border-primary/20 animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-mono uppercase tracking-wider text-primary">Dashboard Widgets</CardTitle>
            <CardDescription className="text-xs">Toggle widgets on or off to customize your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <WidgetCustomizer widgets={activeWidgets} onToggle={toggleWidget} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="glass-panel border-border/50">
              <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-32 mt-2" /></CardContent>
            </Card>
          ))
        ) : (
          <>
            <MetricCard title="Monthly Revenue" value={metrics?.monthlyRevenue ? formatNumber(metrics.monthlyRevenue) : "$0"} change="+12.5%" trend="up" icon={DollarSign} color="text-primary" />
            <MetricCard title="Active Listeners" value={metrics?.activeListeners ? formatNumber(metrics.activeListeners) : "0"} change="+5.2%" trend="up" icon={Users} color="text-chart-2" />
            <MetricCard title="Content Pieces" value={metrics?.contentPiecesCount?.toLocaleString() || "0"} change="+18.2%" trend="up" icon={Layers} color="text-chart-4" />
            <MetricCard title="Ad Fill Rate" value={metrics?.adFillRate ? `${metrics.adFillRate}%` : "0%"} change="-0.4%" trend="down" icon={Activity} color="text-chart-3" />
          </>
        )}
      </div>

      {(activeWidgets.includes("revenue") || activeWidgets.includes("composition")) && (
        <div className="grid gap-6 md:grid-cols-7">
          {activeWidgets.includes("revenue") && (
            <Card className={cn("glass-panel border-border/50", activeWidgets.includes("composition") ? "col-span-4" : "col-span-7")}>
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
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} fontFamily="JetBrains Mono" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'JetBrains Mono', fontSize: '12px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} />
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                      <Area type="monotone" dataKey="projected" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorProjected)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {activeWidgets.includes("composition") && (
            <Card className={cn("glass-panel border-border/50", activeWidgets.includes("revenue") ? "col-span-3" : "col-span-7")}>
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
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={80} fontFamily="JetBrains Mono" />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'JetBrains Mono', fontSize: '12px' }} />
                      <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeWidgets.includes("trending") && (
        <Card className="glass-panel border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Trending Articles
              </CardTitle>
              <CardDescription className="font-mono text-xs">Top stories across the network</CardDescription>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">
              LIVE
            </Badge>
          </CardHeader>
          <CardContent>
            {trendingLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-4 p-3">
                    <Skeleton className="h-5 w-5 mt-0.5" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-full mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : trendingArticles?.length > 0 ? (
              <div className="divide-y divide-border/30" data-testid="trending-articles">
                {trendingArticles.map((article: any, index: number) => (
                  <Link
                    key={article.id}
                    href={article.podcastId ? `/news/${article.podcastId}/article/${article.id}` : "#"}
                    className="block"
                  >
                    <div
                      className="flex items-start gap-4 p-3 hover:bg-card/40 transition-colors cursor-pointer group"
                      data-testid={`trending-article-${article.id}`}
                    >
                      <span className="text-2xl font-bold font-display text-primary/40 leading-none mt-0.5 w-6 text-right shrink-0">
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1 line-clamp-2" data-testid={`text-trending-title-${article.id}`}>
                          {article.title}
                        </h4>
                        {article.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">
                            {article.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          {article.podcast && (
                            <>
                              <span className="text-primary/70">{article.podcast.title}</span>
                              <span className="text-border">|</span>
                            </>
                          )}
                          <Clock className="h-3 w-3" />
                          <span>{article.publishedAt ? timeAgo(article.publishedAt) : "Just now"}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors mt-1 shrink-0" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">No trending articles yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {activeWidgets.includes("processing") && (
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
              <div className="space-y-4" data-testid="content-engine-queue">
                {episodesLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : processingEpisodes.length > 0 ? (
                  processingEpisodes.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border border-border/50 bg-card/30 rounded-sm" data-testid={`episode-queue-${item.id}`}>
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{item.title}</p>
                        <div className="flex items-center text-xs text-muted-foreground font-mono">
                          <span className="text-primary mr-2">●</span>
                          {item.processingStatus === "processing" ? "Generating Content" : item.processingStatus}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-accent">{item.processingProgress}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No episodes processing.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeWidgets.includes("alerts") && (
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
              <div className="space-y-4" data-testid="alerts-list">
                {alertsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
                ) : alertsData?.length > 0 ? (
                  alertsData.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 border-l-2 border-border bg-card/20 rounded-r-sm hover:bg-card/40 transition-colors" data-testid={`alert-${item.id}`}>
                      <div className={cn(
                        "mt-0.5 h-2 w-2 rounded-full",
                        item.type === "warning" ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]" :
                        item.type === "success" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      )} />
                      <div>
                        <p className="text-sm font-medium leading-none mb-1">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No alerts.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, trend, icon: Icon, color }: any) {
  return (
    <Card className="glass-panel border-border/50 hover:border-primary/30 transition-colors" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-display tracking-tight text-foreground" data-testid={`text-${title.toLowerCase().replace(/\s+/g, '-')}-value`}>{value}</div>
        <div className="flex items-center text-xs mt-1">
          {trend === 'up' ? <ArrowUpRight className="h-3 w-3 text-accent mr-1" /> : <ArrowDownRight className="h-3 w-3 text-destructive mr-1" />}
          <span className={cn("font-mono font-medium", trend === 'up' ? "text-accent" : "text-destructive")}>{change}</span>
          <span className="text-muted-foreground ml-1">from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}
