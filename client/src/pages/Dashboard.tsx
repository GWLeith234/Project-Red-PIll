import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import {
  ArrowUpRight, ArrowDownRight, Activity, Zap, DollarSign, Users, Layers,
  ExternalLink, Settings, TrendingUp, Clock, ChevronRight, Linkedin, Camera,
  Eye, EyeOff, Pencil, Check, X, Loader2, ImagePlus, Upload,
  Radio, Headphones, Newspaper, Bell, Target, BarChart3, PieChart as PieChartIcon,
  Mic, Mail, Building2, Megaphone, LayoutGrid,
  Shield, UserPlus, Briefcase, Package, Server, Send,
  Bot, CalendarClock, FileText, Scissors, CheckCircle2, CircleDot, CircleDashed, Film,
  Inbox, Rocket, Trophy, Factory
} from "lucide-react";
import { CelebrationOverlay, useCelebration, useActivityMonitor, EVENT_CONFIG, type CelebrationEvent } from "@/components/CelebrationOverlay";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  useMetrics, useAlerts, useEpisodes, useContentPieces, useTrendingArticles,
  useProfile, useUpdateProfile, useAnalyzeLinkedIn, usePodcasts, useSubscribers,
  useAdvertisers, useAdminDashboardStats, useScheduledPosts, useOutboundCampaigns,
  useModerationCounts, useDeals
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { SortableList } from "@/components/ui/sortable-list";

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

const WIDGET_CATEGORIES = [
  {
    label: "KPIs",
    widgets: [
      { id: "kpi_revenue", label: "Revenue", icon: DollarSign, size: "sm" },
      { id: "kpi_listeners", label: "Listeners", icon: Headphones, size: "sm" },
      { id: "kpi_content", label: "Content Pieces", icon: Layers, size: "sm" },
      { id: "kpi_adFill", label: "Ad Fill Rate", icon: Activity, size: "sm" },
    ],
  },
  {
    label: "Charts",
    widgets: [
      { id: "revenue_chart", label: "Revenue Trajectory", icon: TrendingUp, size: "lg" },
      { id: "revenue_composition", label: "Revenue Composition", icon: PieChartIcon, size: "md" },
    ],
  },
  {
    label: "Content",
    widgets: [
      { id: "wins", label: "Recent Wins", icon: Trophy, size: "md" },
      { id: "agent_activity", label: "Agent Activity Hub", icon: Bot, size: "lg" },
      { id: "queue_rollup", label: "Processing Queue", icon: Inbox, size: "md" },
      { id: "trending", label: "Trending Articles", icon: Newspaper, size: "lg" },
      { id: "processing", label: "AI Content Engine", icon: Zap, size: "md" },
      { id: "content_stats", label: "Content Breakdown", icon: BarChart3, size: "md" },
    ],
  },
  {
    label: "Network",
    widgets: [
      { id: "podcasts", label: "Podcast Network", icon: Radio, size: "md" },
      { id: "subscribers", label: "Subscriber Overview", icon: Users, size: "md" },
      { id: "advertisers", label: "Advertiser Pipeline", icon: Megaphone, size: "md" },
    ],
  },
  {
    label: "Admin",
    widgets: [
      { id: "user_stats", label: "User Statistics", icon: Shield, size: "md" },
      { id: "deal_pipeline", label: "Deal Pipeline", icon: Briefcase, size: "md" },
      { id: "system_overview", label: "System Overview", icon: Server, size: "lg" },
    ],
  },
  {
    label: "System",
    widgets: [
      { id: "alerts", label: "Network Alerts", icon: Bell, size: "md" },
    ],
  },
];

const ALL_WIDGETS = WIDGET_CATEGORIES.flatMap(c => c.widgets);

const DEFAULT_WIDGETS = [
  "kpi_revenue", "kpi_listeners", "kpi_content", "kpi_adFill",
  "wins", "agent_activity", "queue_rollup",
  "revenue_chart", "revenue_composition",
  "trending", "processing", "podcasts", "alerts",
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

function formatCount(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
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
  const [showPhotoDialog, setShowPhotoDialog] = useState(false);
  const [showBannerDialog, setShowBannerDialog] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const displayProfile = profile || user;
  const initials = (displayProfile?.displayName || displayProfile?.username || "U")
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const uploadFile = async (file: File): Promise<string> => {
    const resp = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
    });
    if (!resp.ok) throw new Error("Failed to get upload URL");
    const { uploadURL, objectPath } = await resp.json();
    const uploadResp = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    if (!uploadResp.ok) throw new Error("Failed to upload file");
    return objectPath;
  };

  const handlePhotoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const path = await uploadFile(file);
      await updateProfile.mutateAsync({ profilePhoto: path });
      await refresh();
      toast({ title: "Photo Updated" });
      setShowPhotoDialog(false);
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePhotoUrlSave = async () => {
    if (!photoUrl.trim()) return;
    try {
      await updateProfile.mutateAsync({ profilePhoto: photoUrl.trim() });
      await refresh();
      toast({ title: "Photo Updated" });
      setShowPhotoDialog(false);
      setPhotoUrl("");
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const path = await uploadFile(file);
      await updateProfile.mutateAsync({ bannerImage: path });
      await refresh();
      toast({ title: "Banner Updated" });
      setShowBannerDialog(false);
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleBannerUrlSave = async () => {
    if (!bannerUrl.trim()) return;
    try {
      await updateProfile.mutateAsync({ bannerImage: bannerUrl.trim() });
      await refresh();
      toast({ title: "Banner Updated" });
      setShowBannerDialog(false);
      setBannerUrl("");
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

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
      <div className="h-24 relative group cursor-pointer" onClick={() => setShowBannerDialog(true)} data-testid="button-edit-banner">
        {displayProfile?.bannerImage ? (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${displayProfile.bannerImage})` }} />
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
            <div className="absolute inset-0 bg-[url('/images/command-center-bg.png')] bg-cover opacity-20" />
          </>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex items-center gap-2 text-white text-xs font-mono">
            <ImagePlus className="h-4 w-4" />
            Change Banner
          </div>
        </div>
      </div>
      <CardContent className="-mt-10 relative">
        <div className="flex items-end gap-4 mb-4">
          <div className="relative group/avatar cursor-pointer" onClick={() => setShowPhotoDialog(true)} data-testid="button-edit-photo">
            <Avatar className="h-20 w-20 border-4 border-background shadow-xl ring-2 ring-primary/20" data-testid="img-profile-photo">
              {displayProfile?.profilePhoto ? (
                <AvatarImage src={displayProfile.profilePhoto} alt={displayProfile.displayName || "Profile"} />
              ) : null}
              <AvatarFallback className="bg-primary/20 text-primary text-xl font-display">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 border-4 border-transparent">
              <Camera className="h-5 w-5 text-white" />
            </div>
          </div>
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
                    <Button size="sm" className="bg-[#0A66C2] hover:bg-[#004182] text-white" title="Import LinkedIn" data-testid="button-import-linkedin">
                      <Linkedin className="h-3.5 w-3.5" />
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
              <Linkedin className="h-4 w-4" />
            </a>
          )}
        </div>

        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoFileUpload} data-testid="input-photo-upload" />
        <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerFileUpload} data-testid="input-banner-upload" />

        <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Profile Photo
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {displayProfile?.profilePhoto && (
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24 border-2 border-primary/30">
                    <AvatarImage src={displayProfile.profilePhoto} />
                    <AvatarFallback className="bg-primary/20 text-primary text-2xl font-display">{initials}</AvatarFallback>
                  </Avatar>
                </div>
              )}
              <div className="space-y-2">
                <Button
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  variant="outline"
                  className="w-full"
                  data-testid="button-upload-photo-file"
                >
                  {uploadingPhoto ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload Image File
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-mono">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <Input
                  placeholder="Paste image URL..."
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  data-testid="input-photo-url"
                />
                <Button
                  onClick={handlePhotoUrlSave}
                  disabled={!photoUrl.trim()}
                  className="w-full bg-primary hover:bg-primary/90"
                  data-testid="button-save-photo-url"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Photo URL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBannerDialog} onOpenChange={setShowBannerDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <ImagePlus className="h-5 w-5 text-primary" />
                Banner Image
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {displayProfile?.bannerImage && (
                <div className="rounded-md overflow-hidden h-24 bg-cover bg-center" style={{ backgroundImage: `url(${displayProfile.bannerImage})` }} />
              )}
              <div className="space-y-2">
                <Button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  variant="outline"
                  className="w-full"
                  data-testid="button-upload-banner-file"
                >
                  {uploadingBanner ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload Banner Image
                </Button>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-mono">OR</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <Input
                  placeholder="Paste banner image URL..."
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  data-testid="input-banner-url"
                />
                <Button
                  onClick={handleBannerUrlSave}
                  disabled={!bannerUrl.trim()}
                  className="w-full bg-primary hover:bg-primary/90"
                  data-testid="button-save-banner-url"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Banner URL
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function KPIWidget({ title, value, change, trend, icon: Icon, color, loading }: any) {
  if (loading) {
    return (
      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
        <CardContent><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-32 mt-2" /></CardContent>
      </Card>
    );
  }
  return (
    <Card className="glass-panel border-border/50 hover:border-primary/30 transition-colors group" data-testid={`metric-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground font-mono uppercase tracking-wider">{title}</CardTitle>
        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center bg-muted/50 group-hover:bg-primary/10 transition-colors", color)}>
          <Icon className="h-4 w-4" />
        </div>
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

function RevenueChartWidget() {
  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Revenue Trajectory
        </CardTitle>
        <CardDescription className="font-mono text-xs">Actual vs Projected Performance (YTD)</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="h-[280px]">
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
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}K`} fontFamily="JetBrains Mono" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'JetBrains Mono', fontSize: '12px' }} itemStyle={{ color: 'hsl(var(--foreground))' }} formatter={(v: any) => `$${(v / 1000).toFixed(0)}K`} />
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} vertical={false} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="Actual" />
              <Area type="monotone" dataKey="projected" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorProjected)" name="Projected" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function RevenueCompositionWidget() {
  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];
  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Revenue Composition
        </CardTitle>
        <CardDescription className="font-mono text-xs">Distribution by Source</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={sourceData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                {sourceData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', fontFamily: 'JetBrains Mono', fontSize: '12px' }} formatter={(v: any) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {sourceData.map((s, i) => (
            <div key={s.name} className="flex items-center gap-2 text-xs">
              <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span className="text-muted-foreground font-mono truncate">{s.name}</span>
              <span className="text-foreground font-semibold ml-auto">{s.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TrendingWidget() {
  const { data: trendingArticles, isLoading } = useTrendingArticles();
  return (
    <Card className="glass-panel border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Trending Articles
          </CardTitle>
          <CardDescription className="font-mono text-xs">Top stories across the network</CardDescription>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px]">LIVE</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : trendingArticles?.length > 0 ? (
          <div className="divide-y divide-border/30" data-testid="trending-articles">
            {trendingArticles.slice(0, 5).map((article: any, index: number) => (
              <Link key={article.id} href={article.podcastId ? `/news/${article.podcastId}/article/${article.id}` : "#"} className="block">
                <div className="flex items-start gap-4 p-3 hover:bg-card/40 transition-colors cursor-pointer group" data-testid={`trending-article-${article.id}`}>
                  <span className="text-2xl font-bold font-display text-primary/40 leading-none mt-0.5 w-6 text-right shrink-0">{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug mb-1 line-clamp-2" data-testid={`text-trending-title-${article.id}`}>{article.title}</h4>
                    {article.description && <p className="text-xs text-muted-foreground line-clamp-1 mb-1.5">{article.description}</p>}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      {article.podcast && (<><span className="text-primary/70">{article.podcast.title}</span><span className="text-border">|</span></>)}
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
  );
}

function ProcessingWidget() {
  const { data: episodes, isLoading } = useEpisodes();
  const processingEpisodes = episodes?.filter((ep: any) => ep.processingStatus !== "complete")?.slice(0, 5) || [];
  return (
    <Card className="glass-panel border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            AI Content Engine
          </CardTitle>
          <CardDescription className="font-mono text-xs">Live Generation Queue</CardDescription>
        </div>
        {processingEpisodes.length > 0 && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse font-mono text-[10px]">PROCESSING</Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid="content-engine-queue">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : processingEpisodes.length > 0 ? (
            processingEpisodes.map((item: any) => (
              <div key={item.id} className="p-3 border border-border/50 bg-card/30 rounded-lg space-y-2" data-testid={`episode-queue-${item.id}`}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate mr-2">{item.title}</p>
                  <span className="text-xs font-mono font-bold text-primary shrink-0">{item.processingProgress}%</span>
                </div>
                <Progress value={item.processingProgress} className="h-1.5" />
                <div className="flex items-center text-xs text-muted-foreground font-mono">
                  <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", item.processingStatus === "processing" ? "bg-primary animate-pulse" : item.processingStatus === "failed" ? "bg-destructive" : "bg-muted-foreground")} />
                  {item.processingStatus === "processing" ? "Generating content..." : item.processingStatus === "failed" ? "Failed" : item.processingStatus}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Zap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">All episodes processed</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentStatsWidget() {
  const { data: contentPieces, isLoading } = useContentPieces();
  if (isLoading) return <Card className="glass-panel border-border/50"><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;

  const pieces = contentPieces || [];
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  pieces.forEach((p: any) => {
    byType[p.type || "other"] = (byType[p.type || "other"] || 0) + 1;
    byStatus[p.status || "draft"] = (byStatus[p.status || "draft"] || 0) + 1;
  });

  const typeData = Object.entries(byType).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count })).sort((a, b) => b.count - a.count);
  const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader>
        <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Content Breakdown
        </CardTitle>
        <CardDescription className="font-mono text-xs">{pieces.length} total pieces generated</CardDescription>
      </CardHeader>
      <CardContent>
        {typeData.length > 0 ? (
          <div className="space-y-3">
            {typeData.map((t, i) => (
              <div key={t.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{t.name}</span>
                  <span className="font-mono text-xs font-semibold">{t.count}</span>
                </div>
                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(t.count / pieces.length) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm text-center py-4">No content generated yet.</p>
        )}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-border/30">
          <div className="text-center">
            <p className="text-lg font-bold font-display">{byStatus["ready"] || 0}</p>
            <p className="text-[10px] font-mono text-accent uppercase">Ready</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-display">{byStatus["draft"] || 0}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">Drafts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold font-display">{byStatus["pending_review"] || 0}</p>
            <p className="text-[10px] font-mono text-primary uppercase">Review</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PodcastsWidget() {
  const { data: podcasts, isLoading } = usePodcasts();
  if (isLoading) return <Card className="glass-panel border-border/50"><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;

  const shows = podcasts || [];
  const activeShows = shows.filter((p: any) => p.status === "active");
  const totalSubs = shows.reduce((sum: number, p: any) => sum + (p.subscribers || 0), 0);

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
            <Radio className="h-5 w-5 text-primary" />
            Podcast Network
          </CardTitle>
          <CardDescription className="font-mono text-xs">{activeShows.length} active shows &middot; {formatCount(totalSubs)} subscribers</CardDescription>
        </div>
        <Link href="/network">
          <Button variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary" data-testid="link-view-network">
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shows.slice(0, 4).map((p: any) => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/40 transition-colors group" data-testid={`podcast-widget-${p.id}`}>
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted shrink-0">
                {p.coverImage ? (
                  <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Mic className="h-4 w-4 text-primary/50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{p.title}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{p.host}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono font-semibold">{formatCount(p.subscribers || 0)}</p>
                {p.growthPercent > 0 && (
                  <p className="text-[10px] font-mono text-accent flex items-center justify-end gap-0.5">
                    <TrendingUp className="h-2.5 w-2.5" />+{p.growthPercent}%
                  </p>
                )}
              </div>
              <Badge variant="outline" className={cn(
                "text-[9px] font-mono shrink-0",
                p.status === "active" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/50 text-muted-foreground"
              )}>
                {p.status || "active"}
              </Badge>
            </div>
          ))}
          {shows.length === 0 && (
            <div className="text-center py-6">
              <Radio className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No podcasts yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SubscribersWidget() {
  const { data: subscribers, isLoading } = useSubscribers();
  if (isLoading) return <Card className="glass-panel border-border/50"><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;

  const subs = subscribers || [];
  const bySrc: Record<string, number> = {};
  subs.forEach((s: any) => {
    const src = s.source?.replace(/_/g, " ") || "Unknown";
    bySrc[src] = (bySrc[src] || 0) + 1;
  });
  const srcEntries = Object.entries(bySrc).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Subscriber Overview
          </CardTitle>
          <CardDescription className="font-mono text-xs">{subs.length} total subscribers</CardDescription>
        </div>
        <Link href="/subscriber-crm">
          <Button variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary" data-testid="link-view-subscribers">
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-card/30 border border-border/30 rounded-lg text-center">
            <p className="text-2xl font-bold font-display">{subs.length}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">Total</p>
          </div>
          <div className="p-3 bg-card/30 border border-border/30 rounded-lg text-center">
            <p className="text-2xl font-bold font-display">{subs.filter((s: any) => s.status === "active").length}</p>
            <p className="text-[10px] font-mono text-accent uppercase">Active</p>
          </div>
        </div>
        {srcEntries.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">By Source</p>
            {srcEntries.map(([src, count]) => (
              <div key={src} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono capitalize">{src}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-primary/60" style={{ width: `${(count / subs.length) * 100}%` }} />
                  </div>
                  <span className="font-mono font-semibold w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {subs.length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">No subscribers yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdvertisersWidget() {
  const { data: advertisers, isLoading } = useAdvertisers();
  if (isLoading) return <Card className="glass-panel border-border/50"><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;

  const ads = advertisers || [];
  const activeAds = ads.filter((a: any) => a.status === "active");
  const totalSpend = ads.reduce((sum: number, a: any) => sum + (a.totalSpend || 0), 0);

  return (
    <Card className="glass-panel border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            Advertiser Pipeline
          </CardTitle>
          <CardDescription className="font-mono text-xs">{activeAds.length} active &middot; {formatNumber(totalSpend)} total spend</CardDescription>
        </div>
        <Link href="/monetization">
          <Button variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary" data-testid="link-view-advertisers">
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {ads.slice(0, 4).map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/40 transition-colors" data-testid={`advertiser-widget-${a.id}`}>
              <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-chart-2/20 to-chart-2/5 flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-chart-2/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.name}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{a.contactEmail || a.industry || "—"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono font-semibold">${((a.cpm || 0)).toFixed(0)} CPM</p>
                <Badge variant="outline" className={cn(
                  "text-[9px] font-mono",
                  a.status === "active" ? "bg-accent/10 text-accent border-accent/20" : "bg-muted/50 text-muted-foreground"
                )}>
                  {a.status || "active"}
                </Badge>
              </div>
            </div>
          ))}
          {ads.length === 0 && (
            <div className="text-center py-6">
              <Megaphone className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">No advertisers yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsWidget() {
  const { data: alertsData, isLoading } = useAlerts();
  return (
    <Card className="glass-panel border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Network Alerts
          </CardTitle>
          <CardDescription className="font-mono text-xs">System Notifications</CardDescription>
        </div>
        {alertsData?.length > 0 && (
          <Badge variant="outline" className="bg-chart-3/10 text-chart-3 border-chart-3/20 font-mono text-[10px]">
            {alertsData.filter((a: any) => !a.read).length} NEW
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3" data-testid="alerts-list">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : alertsData?.length > 0 ? (
            alertsData.slice(0, 5).map((item: any) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 border-l-2 rounded-r-lg bg-card/20 hover:bg-card/40 transition-colors" style={{
                borderLeftColor: item.type === "warning" ? "hsl(var(--chart-4))" : item.type === "success" ? "hsl(var(--accent))" : "hsl(var(--chart-1))"
              }} data-testid={`alert-${item.id}`}>
                <div className={cn(
                  "mt-0.5 h-2 w-2 rounded-full shrink-0",
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
            <p className="text-muted-foreground text-sm text-center py-4">No alerts.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function UserStatsWidget() {
  const { data: stats, isLoading } = useAdminDashboardStats();
  if (isLoading) return <Card className="glass-panel border-border/50"><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;

  const users = stats?.users || {};
  const byRole = users.byRole || {};
  const recentUsers = users.recentUsers || [];
  const ROLE_COLORS: Record<string, string> = {
    admin: "hsl(var(--primary))",
    editor: "hsl(var(--accent))",
    viewer: "hsl(var(--chart-2))",
  };

  const roleData = Object.entries(byRole).map(([role, count]) => ({
    name: role.charAt(0).toUpperCase() + role.slice(1),
    value: count as number,
    color: ROLE_COLORS[role] || "hsl(var(--muted-foreground))",
  }));

  return (
    <Card className="glass-panel border-border/50" data-testid="widget-user-stats">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            User Statistics
          </CardTitle>
          <CardDescription className="font-mono text-xs">{users.total || 0} total platform users</CardDescription>
        </div>
        <Link href="/users">
          <Button variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary" data-testid="link-view-users">
            Manage <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-card/30 border border-border/30 rounded-lg text-center">
            <p className="text-2xl font-bold font-display" data-testid="text-total-users">{users.total || 0}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">Total</p>
          </div>
          <div className="p-3 bg-card/30 border border-border/30 rounded-lg text-center">
            <p className="text-2xl font-bold font-display text-accent" data-testid="text-recent-signups">{users.recentSignups || 0}</p>
            <p className="text-[10px] font-mono text-accent uppercase">30d Signups</p>
          </div>
          <div className="p-3 bg-card/30 border border-border/30 rounded-lg text-center">
            <p className="text-2xl font-bold font-display text-primary" data-testid="text-week-signups">{users.weekSignups || 0}</p>
            <p className="text-[10px] font-mono text-primary uppercase">7d Signups</p>
          </div>
        </div>

        {roleData.length > 0 && (
          <div className="mb-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Users by Role</p>
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-muted/30">
              {roleData.map((r) => (
                <div
                  key={r.name}
                  className="h-full transition-all"
                  style={{ width: `${(r.value / (users.total || 1)) * 100}%`, backgroundColor: r.color }}
                  title={`${r.name}: ${r.value}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {roleData.map((r) => (
                <span key={r.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: r.color }} />
                  {r.name}: {r.value}
                </span>
              ))}
            </div>
          </div>
        )}

        {recentUsers.length > 0 && (
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Recent Signups</p>
            <div className="space-y-2">
              {recentUsers.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/40 transition-colors" data-testid={`user-recent-${u.id}`}>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <UserPlus className="h-3.5 w-3.5 text-primary/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.displayName || u.username}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">@{u.username}</p>
                  </div>
                  <Badge variant="outline" className={cn(
                    "text-[9px] font-mono shrink-0",
                    u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" :
                    u.role === "editor" ? "bg-accent/10 text-accent border-accent/20" :
                    "bg-muted/50 text-muted-foreground"
                  )}>
                    {u.role}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DealPipelineWidget() {
  const { data: stats, isLoading } = useAdminDashboardStats();
  if (isLoading) return <Card className="glass-panel border-border/50"><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;

  const deals = stats?.deals || {};
  const byStage = deals.byStage || {};
  const commercial = stats?.commercial || {};

  const stageOrder = ["discovery", "proposal", "negotiation", "closed_won", "closed_lost"];
  const stageLabels: Record<string, string> = {
    discovery: "Discovery",
    proposal: "Proposal",
    negotiation: "Negotiation",
    closed_won: "Won",
    closed_lost: "Lost",
  };
  const stageColors: Record<string, string> = {
    discovery: "hsl(var(--chart-1))",
    proposal: "hsl(var(--chart-2))",
    negotiation: "hsl(var(--primary))",
    closed_won: "hsl(var(--accent))",
    closed_lost: "hsl(var(--destructive))",
  };

  const stageData = stageOrder
    .filter(s => byStage[s])
    .map(s => ({
      stage: stageLabels[s] || s,
      count: byStage[s]?.count || 0,
      value: byStage[s]?.value || 0,
      color: stageColors[s] || "hsl(var(--muted-foreground))",
    }));

  const fmtCurrency = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };

  return (
    <Card className="glass-panel border-border/50" data-testid="widget-deal-pipeline">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Deal Pipeline
          </CardTitle>
          <CardDescription className="font-mono text-xs">{deals.total || 0} deals &middot; {fmtCurrency(deals.totalValue || 0)} pipeline</CardDescription>
        </div>
        <Link href="/sales">
          <Button variant="ghost" size="sm" className="text-xs font-mono text-muted-foreground hover:text-primary" data-testid="link-view-deals">
            View All <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-card/30 border border-border/30 rounded-lg text-center">
            <p className="text-xl font-bold font-display" data-testid="text-total-deals">{deals.total || 0}</p>
            <p className="text-[10px] font-mono text-muted-foreground uppercase">Total Deals</p>
          </div>
          <div className="p-3 bg-card/30 border border-border/30 rounded-lg text-center">
            <p className="text-xl font-bold font-display text-accent" data-testid="text-won-deals">{deals.wonCount || 0}</p>
            <p className="text-[10px] font-mono text-accent uppercase">Won</p>
          </div>
          <div className="p-3 bg-card/30 border border-border/30 rounded-lg text-center">
            <p className="text-xl font-bold font-display text-primary" data-testid="text-won-value">{fmtCurrency(deals.wonValue || 0)}</p>
            <p className="text-[10px] font-mono text-primary uppercase">Won Value</p>
          </div>
        </div>

        {stageData.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pipeline Stages</p>
            {stageData.map((s) => (
              <div key={s.stage} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                    {s.stage}
                  </span>
                  <span className="font-mono font-semibold">{s.count} &middot; {fmtCurrency(s.value)}</span>
                </div>
                <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(s.count / Math.max(deals.total || 1, 1)) * 100}%`, backgroundColor: s.color }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">No deals in pipeline</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-mono">{commercial.companies || 0} Companies</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Package className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground font-mono">{commercial.activeProducts || 0}/{commercial.totalProducts || 0} Products</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SystemOverviewWidget() {
  const { data: stats, isLoading } = useAdminDashboardStats();
  if (isLoading) return <Card className="glass-panel border-border/50"><CardContent className="pt-6"><Skeleton className="h-48 w-full" /></CardContent></Card>;

  const content = stats?.content || {};
  const network = stats?.network || {};
  const subscribers = stats?.subscribers || {};
  const commercial = stats?.commercial || {};
  const users = stats?.users || {};

  const metrics = [
    { label: "Users", value: users.total || 0, icon: Users, color: "text-primary", bg: "bg-primary/10" },
    { label: "Subscribers", value: subscribers.total || 0, icon: Mail, color: "text-accent", bg: "bg-accent/10" },
    { label: "Podcasts", value: network.totalPodcasts || 0, icon: Radio, color: "text-chart-1", bg: "bg-chart-1/10" },
    { label: "Episodes", value: network.totalEpisodes || 0, icon: Mic, color: "text-chart-2", bg: "bg-chart-2/10" },
    { label: "Content", value: content.total || 0, icon: Layers, color: "text-chart-3", bg: "bg-chart-3/10" },
    { label: "Advertisers", value: commercial.advertisers || 0, icon: Megaphone, color: "text-chart-4", bg: "bg-chart-4/10" },
    { label: "Ad Campaigns", value: commercial.activeCampaigns || 0, icon: Target, color: "text-primary", bg: "bg-primary/10" },
    { label: "Outbound", value: commercial.outboundCampaigns || 0, icon: Send, color: "text-accent", bg: "bg-accent/10" },
  ];

  const contentByType = content.byType || {};
  const typeEntries = Object.entries(contentByType)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 6);
  const TYPE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

  return (
    <Card className="glass-panel border-border/50" data-testid="widget-system-overview">
      <CardHeader>
        <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          System Overview
        </CardTitle>
        <CardDescription className="font-mono text-xs">Platform-wide statistics at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 mb-5">
          {metrics.map((m) => {
            const Ic = m.icon;
            return (
              <div key={m.label} className="p-2.5 bg-card/30 border border-border/30 rounded-lg text-center group hover:border-primary/20 transition-colors" data-testid={`metric-system-${m.label.toLowerCase()}`}>
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center mx-auto mb-1.5", m.bg)}>
                  <Ic className={cn("h-3.5 w-3.5", m.color)} />
                </div>
                <p className="text-lg font-bold font-display">{formatCount(m.value)}</p>
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider">{m.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Content by Type</p>
            {typeEntries.length > 0 ? (
              <div className="space-y-2">
                {typeEntries.map(([type, count], i) => (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-muted-foreground capitalize">{type.replace(/_/g, " ")}</span>
                      <span className="font-mono font-semibold">{count as number}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${((count as number) / Math.max(content.total || 1, 1)) * 100}%`, backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No content yet</p>
            )}
          </div>

          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Growth Indicators</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 bg-card/30 border border-border/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs text-muted-foreground font-mono">New Users (30d)</span>
                </div>
                <span className="text-sm font-bold font-display text-accent">{users.recentSignups || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-card/30 border border-border/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground font-mono">New Subs (30d)</span>
                </div>
                <span className="text-sm font-bold font-display text-primary">{subscribers.recentCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-card/30 border border-border/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-chart-3" />
                  <span className="text-xs text-muted-foreground font-mono">Content (30d)</span>
                </div>
                <span className="text-sm font-bold font-display text-chart-3">{content.recentCount || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-card/30 border border-border/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Headphones className="h-3.5 w-3.5 text-chart-2" />
                  <span className="text-xs text-muted-foreground font-mono">Podcast Listeners</span>
                </div>
                <span className="text-sm font-bold font-display text-chart-2">{formatCount(network.totalListeners || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QueueRollupWidget() {
  const { data: episodes } = useEpisodes();
  const { data: contentPieces } = useContentPieces();
  const { data: counts } = useModerationCounts();
  const { data: scheduledPosts } = useScheduledPosts();

  const eps = episodes || [];
  const pieces = contentPieces || [];
  const posts = scheduledPosts || [];

  const processing = eps.filter((ep: any) => ep.processingStatus === "processing").length;
  const transcribing = eps.filter((ep: any) => ep.transcriptStatus === "processing").length;
  const queued = eps.filter((ep: any) => ep.processingStatus === "pending" || ep.processingStatus === "queued").length;
  const completed = eps.filter((ep: any) => ep.processingStatus === "complete" || ep.transcriptStatus === "complete").length;
  const pendingReview = counts?._total || 0;
  const published = pieces.filter((p: any) => p.status === "approved" || p.status === "published").length;
  const scheduled = posts.filter((p: any) => p.status === "scheduled").length;
  const totalPipeline = processing + transcribing + queued + pendingReview + scheduled;

  return (
    <Card className={cn("glass-panel border-border/50 relative overflow-hidden", (processing > 0 || transcribing > 0) && "border-primary/30")} data-testid="widget-queue-rollup">
      {(processing > 0 || transcribing > 0) && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-blue-500 to-primary animate-pulse" />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
              <Inbox className="h-5 w-5 text-primary" />
              Processing Queue
            </CardTitle>
            <CardDescription className="font-mono text-xs">{totalPipeline} items in pipeline</CardDescription>
          </div>
          {(processing > 0 || transcribing > 0) && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 animate-pulse font-mono text-[10px]">
              LIVE
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
            <Loader2 className={cn("h-3.5 w-3.5 text-blue-400", (processing + transcribing) > 0 && "animate-spin")} />
            <div className="min-w-0">
              <p className="text-lg font-bold font-display text-blue-400 leading-none">{processing + transcribing}</p>
              <p className="text-[9px] font-mono text-blue-400/70 uppercase">Processing</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <CircleDashed className="h-3.5 w-3.5 text-amber-400" />
            <div className="min-w-0">
              <p className="text-lg font-bold font-display text-amber-400 leading-none">{queued}</p>
              <p className="text-[9px] font-mono text-amber-400/70 uppercase">Queued</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-violet-500/5 border border-violet-500/15">
            <Eye className="h-3.5 w-3.5 text-violet-400" />
            <div className="min-w-0">
              <p className="text-lg font-bold font-display text-violet-400 leading-none">{pendingReview}</p>
              <p className="text-[9px] font-mono text-violet-400/70 uppercase">Review</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <div className="min-w-0">
              <p className="text-lg font-bold font-display text-emerald-400 leading-none">{published}</p>
              <p className="text-[9px] font-mono text-emerald-400/70 uppercase">Shipped</p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>Pipeline Flow</span>
            <span>{completed} episodes complete</span>
          </div>
          <div className="flex h-2 w-full rounded-full overflow-hidden bg-muted/20">
            {processing + transcribing > 0 && (
              <div className="h-full bg-blue-500 animate-pulse" style={{ width: `${((processing + transcribing) / Math.max(totalPipeline + completed, 1)) * 100}%` }} />
            )}
            {queued > 0 && (
              <div className="h-full bg-amber-500" style={{ width: `${(queued / Math.max(totalPipeline + completed, 1)) * 100}%` }} />
            )}
            {pendingReview > 0 && (
              <div className="h-full bg-violet-500" style={{ width: `${(pendingReview / Math.max(totalPipeline + completed, 1)) * 100}%` }} />
            )}
            {scheduled > 0 && (
              <div className="h-full bg-cyan-500" style={{ width: `${(scheduled / Math.max(totalPipeline + completed, 1)) * 100}%` }} />
            )}
            {published > 0 && (
              <div className="h-full bg-emerald-500" style={{ width: `${(published / Math.max(totalPipeline + completed, 1)) * 100}%` }} />
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Processing</span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Queued</span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-violet-500" />Review</span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />Scheduled</span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Shipped</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/30 flex items-center justify-between">
          <Link href="/moderation" className="text-[10px] text-primary font-mono hover:underline flex items-center gap-1" data-testid="link-view-queue">
            Review Queue <ChevronRight className="h-3 w-3" />
          </Link>
          <Link href="/content" className="text-[10px] text-primary font-mono hover:underline flex items-center gap-1" data-testid="link-view-pipeline">
            Pipeline <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentActivityWidget() {
  const { data: episodes } = useEpisodes();
  const { data: scheduledPosts } = useScheduledPosts();
  const { data: contentPieces } = useContentPieces();
  const { data: outboundCampaigns } = useOutboundCampaigns();
  const { data: podcasts } = usePodcasts();
  const queryClient = useQueryClient();

  const processingEps = (episodes || []).filter((ep: any) =>
    ep.processingStatus === "processing" || ep.transcriptStatus === "processing"
  );

  const queuedEps = (episodes || []).filter((ep: any) =>
    ep.processingStatus === "pending" || ep.processingStatus === "queued"
  );

  const scheduledItems = (scheduledPosts || []).filter((sp: any) => sp.status === "scheduled");
  const draftContent = (contentPieces || []).filter((cp: any) => cp.status === "draft" || cp.status === "pending_review");
  const activeCampaigns = (outboundCampaigns || []).filter((c: any) => c.status === "scheduled" || c.status === "sending");

  useEffect(() => {
    if (processingEps.length === 0) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
    }, 4000);
    return () => clearInterval(interval);
  }, [processingEps.length, queryClient]);

  const stepLabels: Record<string, string> = {
    transcription: "Transcribing", keywords: "Keywords", article: "Article",
    blog: "Blog", social: "Social", clips: "Clips", newsletter: "Newsletter", seo: "SEO",
  };
  const allSteps = ["transcription", "keywords", "article", "blog", "social", "clips", "newsletter", "seo"];

  const totalInProgress = processingEps.length;
  const totalQueued = queuedEps.length;
  const totalScheduled = scheduledItems.length + activeCampaigns.length;
  const totalDrafts = draftContent.length;
  const hasActivity = totalInProgress > 0 || totalQueued > 0 || totalScheduled > 0 || totalDrafts > 0;

  return (
    <Card className={cn("glass-panel border-border/50 relative overflow-hidden", totalInProgress > 0 && "border-blue-500/30")} data-testid="widget-agent-activity">
      {totalInProgress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-primary to-blue-500 animate-pulse" />
      )}
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-display tracking-wide text-lg flex items-center gap-2">
              <div className="relative">
                <Bot className="h-5 w-5 text-primary" />
                {totalInProgress > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse border border-background" />
                )}
              </div>
              Agent Activity Hub
            </CardTitle>
            <CardDescription className="font-mono text-xs">Live platform operations &amp; AI workload</CardDescription>
          </div>
          {hasActivity && (
            <div className="flex items-center gap-1.5">
              {totalInProgress > 0 && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 font-mono text-[10px] animate-pulse">
                  {totalInProgress} active
                </Badge>
              )}
              {totalQueued > 0 && (
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 font-mono text-[10px]">
                  {totalQueued} queued
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2.5 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Loader2 className={cn("h-4 w-4 text-blue-400", totalInProgress > 0 && "animate-spin")} />
            </div>
            <p className="text-lg font-bold font-display text-blue-400">{totalInProgress}</p>
            <p className="text-[9px] font-mono text-blue-400/70 uppercase tracking-wider">In Progress</p>
          </div>
          <div className="text-center p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <CircleDashed className="h-4 w-4 text-amber-400" />
            </div>
            <p className="text-lg font-bold font-display text-amber-400">{totalQueued}</p>
            <p className="text-[9px] font-mono text-amber-400/70 uppercase tracking-wider">Queued</p>
          </div>
          <div className="text-center p-2.5 bg-violet-500/5 border border-violet-500/20 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <CalendarClock className="h-4 w-4 text-violet-400" />
            </div>
            <p className="text-lg font-bold font-display text-violet-400">{totalScheduled}</p>
            <p className="text-[9px] font-mono text-violet-400/70 uppercase tracking-wider">Scheduled</p>
          </div>
          <div className="text-center p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <FileText className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-lg font-bold font-display text-emerald-400">{totalDrafts}</p>
            <p className="text-[9px] font-mono text-emerald-400/70 uppercase tracking-wider">Drafts</p>
          </div>
        </div>

        {processingEps.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <CircleDot className="h-3 w-3 animate-pulse" />
              Active Jobs
            </p>
            {processingEps.slice(0, 4).map((ep: any) => {
              const podcast = (podcasts || []).find((p: any) => p.id === ep.podcastId);
              const currentStep = ep.processingStep || "transcription";
              const currentStepIdx = Math.max(0, allSteps.indexOf(currentStep));
              return (
                <div key={ep.id} className="p-2.5 border border-blue-500/15 bg-blue-500/5 rounded-lg space-y-2" data-testid={`agent-job-${ep.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {ep.episodeType === "video" ? (
                        <Film className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <Mic className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{ep.title}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">{podcast?.title || ""}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400 tabular-nums shrink-0 ml-2 font-bold">{ep.processingProgress || 0}%</span>
                  </div>
                  <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${ep.processingProgress || 0}%`, background: "linear-gradient(90deg, hsl(217 91% 60%), hsl(199 89% 48%))" }} />
                  </div>
                  <div className="flex items-center gap-0.5 flex-wrap">
                    {allSteps.map((step, i) => {
                      const isDone = i < currentStepIdx;
                      const isActive = step === currentStep;
                      return (
                        <span key={step} className={cn(
                          "text-[8px] font-mono px-1 py-0.5 rounded",
                          isDone && "text-emerald-400",
                          isActive && "text-blue-400 font-semibold animate-pulse",
                          !isDone && !isActive && "text-muted-foreground/30"
                        )}>
                          {isDone && <CheckCircle2 className="inline h-2 w-2 mr-0.5 -mt-px" />}
                          {isActive && <Loader2 className="inline h-2 w-2 mr-0.5 -mt-px animate-spin" />}
                          {stepLabels[step]}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {processingEps.length > 4 && (
              <p className="text-[10px] text-muted-foreground font-mono text-center">+ {processingEps.length - 4} more jobs</p>
            )}
          </div>
        )}

        {scheduledItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
              <CalendarClock className="h-3 w-3" />
              Upcoming Scheduled Content
            </p>
            {scheduledItems.slice(0, 3).map((sp: any) => (
              <div key={sp.id} className="flex items-center justify-between p-2 border border-violet-500/15 bg-violet-500/5 rounded-lg" data-testid={`scheduled-item-${sp.id}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Send className="h-3 w-3 text-violet-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{sp.title || sp.content?.slice(0, 50) || "Scheduled Post"}</p>
                    <p className="text-[9px] text-muted-foreground font-mono">{sp.platform || "social"}</p>
                  </div>
                </div>
                <span className="text-[9px] font-mono text-violet-400/80 shrink-0 ml-2">
                  {sp.scheduledAt ? new Date(sp.scheduledAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : ""}
                </span>
              </div>
            ))}
            {scheduledItems.length > 3 && (
              <Link href="/content" className="text-[10px] text-violet-400 font-mono flex items-center gap-1 justify-center hover:underline">
                View all {scheduledItems.length} scheduled <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}

        {activeCampaigns.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Mail className="h-3 w-3" />
              Active Email Campaigns
            </p>
            {activeCampaigns.slice(0, 3).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 border border-primary/15 bg-primary/5 rounded-lg" data-testid={`campaign-item-${c.id}`}>
                <div className="flex items-center gap-2 min-w-0">
                  <Megaphone className="h-3 w-3 text-primary shrink-0" />
                  <p className="text-xs font-medium truncate">{c.name || c.subject || "Campaign"}</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono border-primary/20 text-primary shrink-0">{c.status}</Badge>
              </div>
            ))}
          </div>
        )}

        {!hasActivity && (
          <div className="text-center py-6">
            <Bot className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">All agents idle</p>
            <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">No active jobs, queued tasks, or scheduled content</p>
          </div>
        )}

        <div className="pt-2 border-t border-border/30">
          <Link href="/content" className="flex items-center justify-center gap-1.5 text-xs text-primary font-mono hover:underline" data-testid="link-view-pipeline">
            Open AI Content Generator <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function WidgetCustomizer({
  activeWidgets,
  widgetOrder,
  onToggle,
  onReorder,
  onClose,
}: {
  activeWidgets: string[];
  widgetOrder: string[];
  onToggle: (id: string) => void;
  onReorder: (newOrder: string[]) => void;
  onClose: () => void;
}) {
  const orderedActive = widgetOrder.filter(id => activeWidgets.includes(id));

  const handleDragReorder = (reordered: Array<{ id: string }>) => {
    const newOrder = [...widgetOrder];
    const reorderedIds = reordered.map(r => r.id);
    let reorderIdx = 0;
    for (let i = 0; i < newOrder.length; i++) {
      if (activeWidgets.includes(newOrder[i])) {
        newOrder[i] = reorderedIds[reorderIdx++];
      }
    }
    onReorder(newOrder);
  };

  return (
    <Card className="glass-panel border-primary/30 animate-in slide-in-from-top-2 duration-300">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-mono uppercase tracking-wider text-primary flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Customize Dashboard
          </CardTitle>
          <CardDescription className="text-xs">Toggle widgets on/off and drag to reorder</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="button-close-customizer">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {WIDGET_CATEGORIES.map((cat) => (
          <div key={cat.label}>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{cat.label}</p>
            <div className="flex flex-wrap gap-2">
              {cat.widgets.map((w) => {
                const active = activeWidgets.includes(w.id);
                const Ic = w.icon;
                return (
                  <Button
                    key={w.id}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "text-xs font-mono tracking-wider gap-1.5",
                      active ? "bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30" : "border-border/50 text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => onToggle(w.id)}
                    data-testid={`button-toggle-widget-${w.id}`}
                  >
                    {active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    <Ic className="h-3 w-3" />
                    {w.label}
                  </Button>
                );
              })}
            </div>
          </div>
        ))}

        {orderedActive.length > 0 && (
          <div className="pt-3 border-t border-border/30">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Widget Order (drag to rearrange)</p>
            <SortableList
              items={orderedActive.map(id => ({ id }))}
              onReorder={handleDragReorder}
              className="space-y-1"
              renderItem={(item) => {
                const w = ALL_WIDGETS.find(w => w.id === item.id);
                if (!w) return null;
                const Ic = w.icon;
                return (
                  <div className="flex items-center gap-2 p-2 rounded-lg border border-border/30 bg-card/30">
                    <Ic className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                    <span className="text-xs font-mono flex-1">{w.label}</span>
                  </div>
                );
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function WinsWidget({ winLog }: { winLog: CelebrationEvent[] }) {
  const { data: episodes } = useEpisodes();
  const { data: contentPieces } = useContentPieces();
  const { data: subscribers } = useSubscribers();
  const { data: deals } = useDeals();

  const initialWins: CelebrationEvent[] = [];

  (episodes || [])
    .filter((ep: any) => ep.transcriptStatus === "complete")
    .slice(0, 3)
    .forEach((ep: any) => {
      initialWins.push({ id: `init-ep-${ep.id}`, type: "transcription", title: ep.title || "Episode", subtitle: "Transcription complete", timestamp: new Date(ep.updatedAt || ep.createdAt || Date.now()).getTime() });
    });

  (contentPieces || [])
    .filter((cp: any) => cp.status === "approved" || cp.status === "published")
    .slice(0, 3)
    .forEach((cp: any) => {
      initialWins.push({ id: `init-cp-${cp.id}`, type: "content_shipped", title: cp.title || "Content", subtitle: cp.type || "Published", timestamp: new Date(cp.updatedAt || cp.createdAt || Date.now()).getTime() });
    });

  if ((subscribers || []).length > 0) {
    initialWins.push({ id: "init-sub", type: "subscriber", title: `${(subscribers || []).length} subscribers`, subtitle: "Audience active", timestamp: Date.now() });
  }

  (deals || [])
    .filter((d: any) => d.stage === "closed_won")
    .slice(0, 3)
    .forEach((d: any) => {
      const value = d.value ? `$${Number(d.value).toLocaleString()}` : "";
      initialWins.push({ id: `init-deal-${d.id}`, type: "revenue", title: d.name || "Deal Won", subtitle: value ? `${value} booked` : "Revenue booked", timestamp: new Date(d.updatedAt || d.createdAt || Date.now()).getTime() });
    });

  const liveIds = new Set(winLog.map(w => w.id));
  const combined = [...winLog, ...initialWins.filter(w => !liveIds.has(w.id))];
  combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  const display = combined.slice(0, 8);

  return (
    <Card className="glass-panel border-border/50 hover:border-accent/30 transition-colors" data-testid="widget-wins">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5" /> Recent Wins
          </h3>
          <Badge variant="outline" className="text-[9px] font-mono border-accent/30 text-accent">{display.length} wins</Badge>
        </div>
        {display.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Wins will appear here as your platform runs</p>
        ) : (
          <div className="space-y-1.5">
            {display.map((win) => {
              const config = EVENT_CONFIG[win.type] || EVENT_CONFIG.content_shipped;
              const ago = win.timestamp ? formatWinTime(win.timestamp) : "";
              return (
                <div key={win.id} className="flex items-center gap-2.5 py-1.5 px-2 rounded-sm hover:bg-muted/20 transition-colors group">
                  <span className="text-base flex-shrink-0">{config.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{win.title}</p>
                    {win.subtitle && <p className="text-[10px] text-muted-foreground font-mono truncate">{win.subtitle}</p>}
                  </div>
                  {ago && <span className="text-[9px] text-muted-foreground/60 font-mono flex-shrink-0">{ago}</span>}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatWinTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function renderWidget(id: string, metrics: any, metricsLoading: boolean, winLog: CelebrationEvent[] = []) {
  switch (id) {
    case "kpi_revenue":
      return <KPIWidget key={id} title="Monthly Revenue" value={metrics?.monthlyRevenue ? formatNumber(metrics.monthlyRevenue) : "$0"} change="+12.5%" trend="up" icon={DollarSign} color="text-primary" loading={metricsLoading} />;
    case "kpi_listeners":
      return <KPIWidget key={id} title="Active Listeners" value={metrics?.activeListeners ? formatCount(metrics.activeListeners) : "0"} change="+5.2%" trend="up" icon={Headphones} color="text-chart-2" loading={metricsLoading} />;
    case "kpi_content":
      return <KPIWidget key={id} title="Content Pieces" value={metrics?.contentPiecesCount?.toLocaleString() || "0"} change="+18.2%" trend="up" icon={Layers} color="text-chart-4" loading={metricsLoading} />;
    case "kpi_adFill":
      return <KPIWidget key={id} title="Ad Fill Rate" value={metrics?.adFillRate ? `${metrics.adFillRate}%` : "0%"} change="-0.4%" trend="down" icon={Activity} color="text-chart-3" loading={metricsLoading} />;
    case "wins":
      return <WinsWidget key={id} winLog={winLog} />;
    case "revenue_chart":
      return <RevenueChartWidget key={id} />;
    case "revenue_composition":
      return <RevenueCompositionWidget key={id} />;
    case "trending":
      return <TrendingWidget key={id} />;
    case "agent_activity":
      return <AgentActivityWidget key={id} />;
    case "queue_rollup":
      return <QueueRollupWidget key={id} />;
    case "processing":
      return <ProcessingWidget key={id} />;
    case "content_stats":
      return <ContentStatsWidget key={id} />;
    case "podcasts":
      return <PodcastsWidget key={id} />;
    case "subscribers":
      return <SubscribersWidget key={id} />;
    case "advertisers":
      return <AdvertisersWidget key={id} />;
    case "alerts":
      return <AlertsWidget key={id} />;
    case "user_stats":
      return <UserStatsWidget key={id} />;
    case "deal_pipeline":
      return <DealPipelineWidget key={id} />;
    case "system_overview":
      return <SystemOverviewWidget key={id} />;
    default:
      return null;
  }
}

const SCREENS = [
  { key: "content", label: "Content Factory", icon: Factory },
  { key: "revenue", label: "Revenue Factory", icon: DollarSign },
  { key: "crm", label: "CRM", icon: Briefcase },
  { key: "audience", label: "Audience", icon: Headphones },
  { key: "admin", label: "Admin", icon: Shield },
] as const;

type ScreenKey = (typeof SCREENS)[number]["key"];

function ContentFactoryScreen() {
  const { data: episodes, isLoading: epsLoading } = useEpisodes();
  const { data: contentPieces, isLoading: cpLoading } = useContentPieces();
  const { data: counts } = useModerationCounts();
  const { data: scheduledPosts } = useScheduledPosts();
  const { data: podcasts } = usePodcasts();
  const { data: campaigns } = useOutboundCampaigns();

  const eps = episodes || [];
  const pieces = contentPieces || [];
  const posts = scheduledPosts || [];
  const shows = podcasts || [];
  const camps = campaigns || [];

  const totalEpisodes = eps.length;
  const transcribed = eps.filter((e: any) => e.transcriptStatus === "complete").length;
  const processing = eps.filter((e: any) => e.processingStatus === "processing" || e.transcriptStatus === "processing").length;
  const queued = eps.filter((e: any) => e.processingStatus === "pending" || e.processingStatus === "queued").length;
  const completed = eps.filter((e: any) => e.processingStatus === "complete").length;

  const totalContent = pieces.length;
  const byType: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  pieces.forEach((p: any) => {
    byType[p.type || "other"] = (byType[p.type || "other"] || 0) + 1;
    byStatus[p.status || "draft"] = (byStatus[p.status || "draft"] || 0) + 1;
  });
  const typeData = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const published = (byStatus["approved"] || 0) + (byStatus["published"] || 0);
  const drafts = byStatus["draft"] || 0;
  const pendingReview = counts?._total || 0;
  const scheduled = posts.filter((p: any) => p.status === "scheduled").length;
  const activeCampaigns = camps.filter((c: any) => c.status === "active" || c.status === "sending").length;

  const processingEps = eps.filter((e: any) => e.processingStatus === "processing" || e.transcriptStatus === "processing").slice(0, 4);
  const allSteps = ["transcription", "keywords", "article", "blog", "social", "clips", "newsletter", "seo"];
  const stepLabels: Record<string, string> = {
    transcription: "Transcribe", keywords: "Keywords", article: "Article",
    blog: "Blog", social: "Social", clips: "Clips", newsletter: "Newsletter", seo: "SEO",
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

  const isLoading = epsLoading || cpLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 grid-rows-3 gap-3 h-full">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-full w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 grid-rows-3 gap-3 h-full" data-testid="screen-content-factory">
      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-total-episodes">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Total Episodes</span>
          <Mic className="h-4 w-4 text-primary/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{totalEpisodes}</p>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-accent">{transcribed} transcribed</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-primary">{completed} processed</span>
        </div>
      </div>

      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-total-content">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Content Pieces</span>
          <Layers className="h-4 w-4 text-accent/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{totalContent}</p>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-accent">{published} shipped</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-primary">{drafts} drafts</span>
        </div>
      </div>

      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-pipeline-status">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pipeline</span>
          {processing > 0 ? (
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse">LIVE</Badge>
          ) : (
            <Zap className="h-4 w-4 text-chart-3/60" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-2xl font-display font-bold text-blue-400">{processing}</p>
            <p className="text-[9px] font-mono text-blue-400/70 uppercase">Processing</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-amber-400">{queued}</p>
            <p className="text-[9px] font-mono text-amber-400/70 uppercase">Queued</p>
          </div>
        </div>
      </div>

      <div className="col-span-3 row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-distribution">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Distribution</span>
          <Send className="h-4 w-4 text-violet-400/60" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div className="text-center">
            <p className="text-xl font-display font-bold text-violet-400">{pendingReview}</p>
            <p className="text-[8px] font-mono text-violet-400/70 uppercase">Review</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-bold text-cyan-400">{scheduled}</p>
            <p className="text-[8px] font-mono text-cyan-400/70 uppercase">Scheduled</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-bold text-emerald-400">{activeCampaigns}</p>
            <p className="text-[8px] font-mono text-emerald-400/70 uppercase">Campaigns</p>
          </div>
        </div>
      </div>

      <div className="col-span-5 row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-content-breakdown">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Content Breakdown
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{totalContent} total</span>
        </div>
        <div className="flex-1 min-h-0">
          {typeData.length > 0 ? (
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData.slice(0, 8).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " "), count }))} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                    {typeData.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No content yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-4 row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-active-jobs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" /> AI Agent Jobs
          </h3>
          {processing > 0 && (
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse">
              {processing} active
            </Badge>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {processingEps.length > 0 ? processingEps.map((ep: any) => {
            const podcast = shows.find((p: any) => p.id === ep.podcastId);
            const currentStep = ep.processingStep || "transcription";
            const currentStepIdx = Math.max(0, allSteps.indexOf(currentStep));
            return (
              <div key={ep.id} className="p-2.5 border border-blue-500/15 bg-blue-500/5 rounded-lg space-y-2" data-testid={`job-${ep.id}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{ep.title}</p>
                    <p className="text-[9px] text-muted-foreground font-mono truncate">{podcast?.title || ""}</p>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 font-bold ml-2">{ep.processingProgress || 0}%</span>
                </div>
                <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ep.processingProgress || 0}%`, background: "linear-gradient(90deg, hsl(217 91% 60%), hsl(199 89% 48%))" }} />
                </div>
                <div className="flex items-center gap-0.5 flex-wrap">
                  {allSteps.map((step, i) => {
                    const isDone = i < currentStepIdx;
                    const isActive = step === currentStep;
                    return (
                      <span key={step} className={cn(
                        "text-[7px] font-mono px-0.5 py-0.5 rounded",
                        isDone && "text-emerald-400",
                        isActive && "text-blue-400 font-semibold animate-pulse",
                        !isDone && !isActive && "text-muted-foreground/30"
                      )}>
                        {isDone && <CheckCircle2 className="inline h-2 w-2 mr-0.5" />}
                        {isActive && <Loader2 className="inline h-2 w-2 mr-0.5 animate-spin" />}
                        {stepLabels[step]}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Bot className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground">All agents idle</p>
              <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5">Queue episodes to start processing</p>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-3 row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-content-status">
        <h3 className="text-xs font-mono font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <Target className="h-3.5 w-3.5" /> Status Breakdown
        </h3>
        <div className="flex-1 space-y-2.5 overflow-y-auto">
          {[
            { label: "Published", count: published, color: "bg-emerald-500", textColor: "text-emerald-400" },
            { label: "Approved", count: byStatus["approved"] || 0, color: "bg-accent", textColor: "text-accent" },
            { label: "Pending Review", count: pendingReview, color: "bg-violet-500", textColor: "text-violet-400" },
            { label: "Drafts", count: drafts, color: "bg-muted-foreground", textColor: "text-muted-foreground" },
            { label: "Scheduled Posts", count: scheduled, color: "bg-cyan-500", textColor: "text-cyan-400" },
            { label: "Active Campaigns", count: activeCampaigns, color: "bg-primary", textColor: "text-primary" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-sm flex-shrink-0", item.color)} />
              <span className="text-[10px] font-mono text-muted-foreground flex-1 truncate">{item.label}</span>
              <span className={cn("text-sm font-display font-bold tabular-nums", item.textColor)}>{item.count}</span>
            </div>
          ))}

          <div className="pt-2 mt-2 border-t border-border/30">
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60 mb-2">Shows</p>
            {shows.slice(0, 4).map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 py-1">
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Radio className="h-2.5 w-2.5 text-primary/60" />
                </div>
                <span className="text-[10px] font-mono text-foreground truncate flex-1">{p.title}</span>
                <span className="text-[9px] font-mono text-muted-foreground">{eps.filter((e: any) => e.podcastId === p.id).length} ep</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderScreen({ label, icon: Icon }: { label: string; icon: any }) {
  return (
    <div className="h-full flex flex-col items-center justify-center" data-testid={`screen-${label.toLowerCase().replace(/\s+/g, "-")}-placeholder`}>
      <Icon className="h-16 w-16 text-muted-foreground/15 mb-4" />
      <p className="text-xl font-display font-bold text-muted-foreground/40 uppercase tracking-wider">{label}</p>
      <p className="text-xs font-mono text-muted-foreground/30 mt-1">Coming Soon</p>
    </div>
  );
}

export default function Dashboard() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("content");

  const { events: celebrationEvents, celebrate, dismiss: dismissCelebration, winLog } = useCelebration();
  const activityCheck = useActivityMonitor(celebrate);
  const { data: monitorEpisodes } = useEpisodes();
  const { data: monitorContent } = useContentPieces();
  const { data: monitorSubscribers } = useSubscribers();
  const { data: monitorDeals } = useDeals();

  useEffect(() => {
    activityCheck({
      episodes: monitorEpisodes || [],
      contentPieces: monitorContent || [],
      subscribers: monitorSubscribers || [],
      deals: monitorDeals || [],
    });
  }, [monitorEpisodes, monitorContent, monitorSubscribers, monitorDeals, activityCheck]);

  const currentIdx = SCREENS.findIndex(s => s.key === activeScreen);
  const goPrev = () => {
    const prev = (currentIdx - 1 + SCREENS.length) % SCREENS.length;
    setActiveScreen(SCREENS[prev].key);
  };
  const goNext = () => {
    const next = (currentIdx + 1) % SCREENS.length;
    setActiveScreen(SCREENS[next].key);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeScreen]);

  const activeScreenData = SCREENS[currentIdx];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] animate-in fade-in duration-500" data-testid="command-center">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              Command Center
              <span className="text-[10px] font-mono text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">Live</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" data-testid="button-prev-screen">
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <div className="flex items-center gap-1">
            {SCREENS.map((screen) => (
              <button
                key={screen.key}
                onClick={() => setActiveScreen(screen.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-all",
                  activeScreen === screen.key
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                data-testid={`button-screen-${screen.key}`}
              >
                <screen.icon className="h-3 w-3" />
                {screen.label}
              </button>
            ))}
          </div>
          <button onClick={goNext} className="p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" data-testid="button-next-screen">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 border border-border/40 rounded-lg bg-background/50 p-4 relative overflow-hidden" style={{ aspectRatio: "16/9" }} data-testid="screen-viewport">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="h-full w-full">
          {activeScreen === "content" && <ContentFactoryScreen />}
          {activeScreen === "revenue" && <PlaceholderScreen label="Revenue Factory" icon={DollarSign} />}
          {activeScreen === "crm" && <PlaceholderScreen label="CRM" icon={Briefcase} />}
          {activeScreen === "audience" && <PlaceholderScreen label="Audience" icon={Headphones} />}
          {activeScreen === "admin" && <PlaceholderScreen label="Admin" icon={Shield} />}
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {SCREENS.map((screen) => (
            <button
              key={screen.key}
              onClick={() => setActiveScreen(screen.key)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                activeScreen === screen.key ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              data-testid={`dot-screen-${screen.key}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 flex-shrink-0">
        <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
          {activeScreenData.label} &middot; Screen {currentIdx + 1} of {SCREENS.length}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground/50">
          Use arrow keys or click to navigate
        </p>
      </div>

      <CelebrationOverlay events={celebrationEvents} onDismiss={dismissCelebration} />
    </div>
  );
}
