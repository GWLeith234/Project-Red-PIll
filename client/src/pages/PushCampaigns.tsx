import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import PageHeader from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Bell, Send, CheckCircle, MousePointerClick, Plus, Edit3, Trash2,
  Loader2, XCircle, BarChart3, Image, Link, Globe, Users, TrendingUp,
  Sparkles, Play, Calendar, ChevronDown, ChevronUp, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted/50 text-muted-foreground border-border/50",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  sending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30 animate-pulse",
  sent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  failed: "bg-red-500/10 text-red-400 border-red-500/30",
  cancelled: "bg-muted/30 text-muted-foreground/60 border-border/30",
};

const SEGMENT_OPTIONS = [
  { value: "all", label: "All Subscribers" },
  { value: "new", label: "New Subscribers (last 7 days)" },
  { value: "engaged", label: "Engaged" },
  { value: "at_risk", label: "At Risk" },
];

type Campaign = {
  id: string;
  name: string;
  title: string;
  body: string;
  iconUrl: string | null;
  clickUrl: string | null;
  imageUrl: string | null;
  targetSegment: string;
  status: string;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number;
  deliveredCount: number;
  failedCount: number;
  clickedCount: number;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

type PushStats = {
  totalSubscribers: number;
  sentThisMonth: number;
  avgDeliveryRate: number;
  totalDelivered: number;
  clicksThisMonth: number;
  segmentCounts: Record<string, number>;
};

type AiSuggestion = {
  name: string;
  title: string;
  body: string;
  segment: string;
  reasoning: string;
};

type CampaignForm = {
  name: string;
  title: string;
  body: string;
  clickUrl: string;
  iconUrl: string;
  imageUrl: string;
  targetSegment: string;
  scheduleMode: "now" | "later";
  scheduledAt: string;
};

const defaultForm: CampaignForm = {
  name: "",
  title: "",
  body: "",
  clickUrl: "",
  iconUrl: "",
  imageUrl: "",
  targetSegment: "all",
  scheduleMode: "now",
  scheduledAt: "",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function segmentLabel(value: string) {
  return SEGMENT_OPTIONS.find(s => s.value === value)?.label || value;
}

export default function PushCampaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/push-campaigns"],
  });

  const { data: stats } = useQuery<PushStats>({
    queryKey: ["/api/push/stats"],
    queryFn: async () => {
      const res = await fetch("/api/push/stats", { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>({ ...defaultForm });

  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsCampaign, setStatsCampaign] = useState<Campaign | null>(null);
  const [statsData, setStatsData] = useState<any>(null);

  const [confirmSend, setConfirmSend] = useState<Campaign | null>(null);

  const [aiSuggestOpen, setAiSuggestOpen] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  const estimatedRecipients = stats?.segmentCounts?.[form.targetSegment] ?? stats?.totalSubscribers ?? 0;

  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/push-campaigns", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/push-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/push/stats"] });
      toast({ title: "Campaign Created", description: "Push campaign saved as draft." });
      if (form.scheduleMode === "now") {
        setComposerOpen(false);
        setConfirmSend(data);
      } else {
        setComposerOpen(false);
      }
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      await apiRequest("PATCH", `/api/push-campaigns/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/push-campaigns"] });
      toast({ title: "Campaign Updated" });
      setComposerOpen(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteCampaign = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/push-campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/push-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/push/stats"] });
      toast({ title: "Campaign Deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendCampaign = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/push-campaigns/${id}/send`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/push-campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/push/stats"] });
      toast({ title: "Campaign Sent", description: `Push notifications sent to ${data?.recipientCount ?? 0} subscribers.` });
    },
    onError: (err: any) => toast({ title: "Send Failed", description: err.message, variant: "destructive" }),
  });

  const cancelCampaign = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/push-campaigns/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/push-campaigns"] });
      toast({ title: "Campaign Cancelled" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openCreateDialog() {
    setForm({ ...defaultForm });
    setEditingId(null);
    setComposerOpen(true);
  }

  function openEditDialog(campaign: Campaign) {
    setForm({
      name: campaign.name || "",
      title: campaign.title || "",
      body: campaign.body || "",
      clickUrl: campaign.clickUrl || "",
      iconUrl: campaign.iconUrl || "",
      imageUrl: campaign.imageUrl || "",
      targetSegment: campaign.targetSegment || "all",
      scheduleMode: campaign.scheduledAt ? "later" : "now",
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setEditingId(campaign.id);
    setComposerOpen(true);
  }

  function handleSubmit(action: "draft" | "send") {
    if (!form.name.trim() || !form.title.trim() || !form.body.trim()) {
      toast({ title: "Required Fields", description: "Name, title, and body are required.", variant: "destructive" });
      return;
    }
    if (form.title.length > 65) {
      toast({ title: "Title Too Long", description: "Title must be 65 characters or less.", variant: "destructive" });
      return;
    }
    if (form.body.length > 120) {
      toast({ title: "Body Too Long", description: "Body must be 120 characters or less.", variant: "destructive" });
      return;
    }
    const payload: any = {
      name: form.name,
      title: form.title,
      body: form.body,
      targetSegment: form.targetSegment,
    };
    if (form.clickUrl) payload.clickUrl = form.clickUrl;
    if (form.iconUrl) payload.iconUrl = form.iconUrl;
    if (form.imageUrl) payload.imageUrl = form.imageUrl;

    if (form.scheduleMode === "later" && form.scheduledAt) {
      payload.scheduledAt = new Date(form.scheduledAt).toISOString();
      payload.status = "scheduled";
    }

    if (editingId) {
      updateCampaign.mutate({ id: editingId, ...payload });
    } else {
      createCampaign.mutate(payload);
    }
  }

  async function openStats(campaign: Campaign) {
    setStatsCampaign(campaign);
    setStatsOpen(true);
    setStatsLoading(true);
    try {
      const res = await apiRequest("GET", `/api/push-campaigns/${campaign.id}/stats`);
      const data = await res.json();
      setStatsData(data);
    } catch {
      setStatsData(null);
    } finally {
      setStatsLoading(false);
    }
  }

  function handleConfirmSend() {
    if (!confirmSend) return;
    sendCampaign.mutate(confirmSend.id);
    setConfirmSend(null);
  }

  async function fetchAiSuggestions() {
    setAiLoading(true);
    setAiSuggestOpen(true);
    try {
      const res = await apiRequest("POST", "/api/push/ai-suggest");
      const data = await res.json();
      setAiSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setAiSuggestions([]);
      toast({ title: "AI Unavailable", description: "Could not generate suggestions.", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  }

  function useSuggestion(suggestion: AiSuggestion) {
    setForm({
      ...defaultForm,
      name: suggestion.name,
      title: suggestion.title,
      body: suggestion.body,
      targetSegment: suggestion.segment,
    });
    setEditingId(null);
    setAiSuggestOpen(false);
    setComposerOpen(true);
  }

  const isMutating = createCampaign.isPending || updateCampaign.isPending;

  const metricsCards = [
    { label: "Total Subscribers", value: stats?.totalSubscribers ?? 0, icon: Users, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/20" },
    { label: "Sent This Month", value: stats?.sentThisMonth ?? 0, icon: Send, color: "text-chart-4", bgColor: "bg-chart-4/10", borderColor: "border-chart-4/20" },
    { label: "Avg Delivery Rate", value: `${stats?.avgDeliveryRate ?? 0}%`, icon: TrendingUp, color: "text-accent", bgColor: "bg-accent/10", borderColor: "border-accent/20" },
    { label: "Total Delivered", value: stats?.totalDelivered ?? 0, icon: CheckCircle, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
    { label: "Clicks This Month", value: stats?.clicksThisMonth ?? 0, icon: MousePointerClick, color: "text-chart-1", bgColor: "bg-chart-1/10", borderColor: "border-chart-1/20" },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <PageHeader pageKey="push-campaigns" onPrimaryAction={openCreateDialog} onAIAction={fetchAiSuggestions} />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="metrics-strip">
        {metricsCards.map((stat) => (
          <Card key={stat.label} className={cn("glass-panel border", stat.borderColor)} data-testid={`metric-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
                </div>
                <span className={cn("text-xl font-bold font-display", stat.color)} data-testid={`metric-value-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>{stat.value}</span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-lg bg-card/30 border border-border/30 animate-pulse" />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="glass-panel border-border/50 border-dashed" data-testid="empty-state">
          <CardContent className="py-14 text-center">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
            <h3 className="text-sm font-display font-semibold text-muted-foreground mb-1" data-testid="text-empty-title">No campaigns yet</h3>
            <p className="text-xs text-muted-foreground/70 mb-4">Create your first push campaign to reach your subscribers</p>
            <Button onClick={openCreateDialog} variant="outline" size="sm" className="font-mono text-xs" data-testid="button-create-first-campaign">
              <Plus className="mr-1.5 h-3 w-3" /> Create your first campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-panel border-border/50" data-testid="campaigns-table">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Name</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Title</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Segment</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Date</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Recipients</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Delivered %</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Clicks</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => {
                  const deliveryPct = c.recipientCount > 0 ? ((c.deliveredCount / c.recipientCount) * 100).toFixed(1) : "\u2014";
                  return (
                    <TableRow key={c.id} className="border-border/30 hover:bg-card/50" data-testid={`campaign-row-${c.id}`}>
                      <TableCell className="text-sm font-semibold max-w-[150px] truncate" data-testid={`text-campaign-name-${c.id}`}>{c.name}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="text-sm truncate" data-testid={`text-campaign-title-${c.id}`}>{c.title.length > 40 ? c.title.slice(0, 40) + "\u2026" : c.title}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-mono" data-testid={`text-segment-${c.id}`}>{segmentLabel(c.targetSegment)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn("text-[10px] font-mono", STATUS_COLORS[c.status] || "")} data-testid={`badge-status-${c.id}`}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground" data-testid={`text-date-${c.id}`}>
                        {c.sentAt ? formatDate(c.sentAt) : c.scheduledAt ? formatDate(c.scheduledAt) : formatDate(c.createdAt)}
                      </TableCell>
                      <TableCell className="text-xs" data-testid={`text-recipients-${c.id}`}>{c.recipientCount}</TableCell>
                      <TableCell className="text-xs" data-testid={`text-delivered-${c.id}`}>{deliveryPct}{deliveryPct !== "\u2014" ? "%" : ""}</TableCell>
                      <TableCell className="text-xs" data-testid={`text-clicks-${c.id}`}>{c.clickedCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(c.status === "draft" || c.status === "scheduled") && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditDialog(c)}
                              title="Edit"
                              data-testid={`button-edit-${c.id}`}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {c.status === "draft" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300"
                                onClick={() => setConfirmSend(c)}
                                title="Send Now"
                                data-testid={`button-send-${c.id}`}
                              >
                                <Play className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteCampaign.mutate(c.id)}
                                title="Delete"
                                data-testid={`button-delete-${c.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {c.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
                              onClick={() => cancelCampaign.mutate(c.id)}
                              title="Cancel"
                              data-testid={`button-cancel-${c.id}`}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {c.status === "sent" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => openStats(c)}
                              title="View Stats"
                              data-testid={`button-stats-${c.id}`}
                            >
                              <BarChart3 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Campaign Composer Modal */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="composer-dialog">
          <DialogHeader>
            <DialogTitle data-testid="text-composer-title">{editingId ? "Edit Campaign" : "Create Push Campaign"}</DialogTitle>
            <DialogDescription>Configure your push notification campaign.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left — Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Scott Morning Brief - Feb 19"
                  className="mt-1"
                  data-testid="input-name"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="campaign-title">Notification Title</Label>
                  <span className={cn("text-[10px] font-mono", form.title.length > 65 ? "text-red-400" : "text-muted-foreground")} data-testid="char-count-title">{form.title.length}/65</span>
                </div>
                <Input
                  id="campaign-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Attention-grabbing title"
                  className={cn("mt-1", form.title.length > 65 && "border-red-500 focus-visible:ring-red-500")}
                  data-testid="input-title"
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="campaign-body">Notification Body</Label>
                  <span className={cn("text-[10px] font-mono", form.body.length > 120 ? "text-red-400" : "text-muted-foreground")} data-testid="char-count-body">{form.body.length}/120</span>
                </div>
                <Textarea
                  id="campaign-body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Creates urgency or curiosity..."
                  rows={3}
                  className={cn("mt-1", form.body.length > 120 && "border-red-500 focus-visible:ring-red-500")}
                  data-testid="input-body"
                />
              </div>
              <div>
                <Label htmlFor="campaign-icon-url">Icon URL</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="relative flex-1">
                    <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="campaign-icon-url"
                      value={form.iconUrl}
                      onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
                      placeholder="https://example.com/icon.png"
                      className="pl-9"
                      data-testid="input-icon-url"
                    />
                  </div>
                  {form.iconUrl && (
                    <div className="h-9 w-9 rounded border border-border/50 overflow-hidden flex-shrink-0">
                      <img src={form.iconUrl} alt="icon" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} data-testid="preview-icon-thumb" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="campaign-click-url">Click URL</Label>
                <div className="relative mt-1">
                  <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="campaign-click-url"
                    value={form.clickUrl}
                    onChange={(e) => setForm({ ...form, clickUrl: e.target.value })}
                    placeholder="https://yoursite.com/article/slug"
                    className="pl-9"
                    data-testid="input-click-url"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="campaign-image-url">Image URL (optional)</Label>
                <div className="relative mt-1">
                  <Image className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="campaign-image-url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                    className="pl-9"
                    data-testid="input-image-url"
                  />
                </div>
              </div>
              <div>
                <Label>Target Segment</Label>
                <Select value={form.targetSegment} onValueChange={(v) => setForm({ ...form, targetSegment: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SEGMENT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} data-testid={`select-segment-${opt.value}`}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule</Label>
                <RadioGroup
                  value={form.scheduleMode}
                  onValueChange={(v) => setForm({ ...form, scheduleMode: v as "now" | "later" })}
                  className="flex gap-4 mt-1"
                  data-testid="radio-schedule"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="now" id="schedule-now" />
                    <Label htmlFor="schedule-now" className="text-sm cursor-pointer">Send Now</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="later" id="schedule-later" />
                    <Label htmlFor="schedule-later" className="text-sm cursor-pointer">Schedule for Later</Label>
                  </div>
                </RadioGroup>
                {form.scheduleMode === "later" && (
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                    className="mt-2"
                    data-testid="input-scheduled-at"
                  />
                )}
              </div>
            </div>

            {/* Right — Live Preview */}
            <div>
              <Label className="mb-2 block">Live Preview</Label>
              <div className="rounded-2xl border-2 border-border/50 bg-zinc-900 p-3 space-y-3 shadow-xl" data-testid="notification-preview">
                <div className="flex items-center gap-2 px-1 mb-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                  <div className="text-[9px] font-mono text-muted-foreground/50 uppercase">Push Notification</div>
                </div>
                <div className="rounded-xl bg-card/90 border border-border/40 p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {form.iconUrl ? (
                        <img src={form.iconUrl} alt="icon" className="h-full w-full object-cover rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      ) : (
                        <Bell className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" data-testid="preview-title">{form.title || "Notification Title"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3" data-testid="preview-body">{form.body || "Notification body text will appear here..."}</p>
                    </div>
                  </div>
                  {form.imageUrl && (
                    <div className="rounded-md overflow-hidden border border-border/30 mt-3">
                      <img src={form.imageUrl} alt="preview" className="w-full h-32 object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} data-testid="preview-image" />
                    </div>
                  )}
                  <div className="text-[10px] text-muted-foreground/50 font-mono mt-2">just now</div>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border/50 bg-card/30 p-3" data-testid="estimated-recipients">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Estimated Recipients:</span>
                  <span className="text-sm font-bold text-foreground" data-testid="text-estimated-count">{estimatedRecipients.toLocaleString()} subscribers</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={isMutating} data-testid="button-save-draft">
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Draft
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setComposerOpen(false)} data-testid="button-cancel-composer">Cancel</Button>
              {form.scheduleMode === "now" ? (
                <Button onClick={() => handleSubmit("send")} disabled={isMutating} data-testid="button-send-now">
                  {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  {editingId ? "Update & Send" : "Send Now"}
                </Button>
              ) : (
                <Button onClick={() => handleSubmit("draft")} disabled={isMutating} data-testid="button-schedule">
                  {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Calendar className="mr-1.5 h-3.5 w-3.5" />
                  Schedule
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation */}
      <AlertDialog open={!!confirmSend} onOpenChange={(open) => !open && setConfirmSend(null)}>
        <AlertDialogContent data-testid="confirm-send-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle data-testid="text-confirm-title">Send Push Campaign?</AlertDialogTitle>
            <AlertDialogDescription data-testid="text-confirm-desc">
              Send &ldquo;{confirmSend?.title}&rdquo; to {estimatedRecipients.toLocaleString()} subscribers now? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend} disabled={sendCampaign.isPending} data-testid="button-confirm-send">
              {sendCampaign.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Modal */}
      <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
        <DialogContent className="max-w-lg" data-testid="stats-dialog">
          <DialogHeader>
            <DialogTitle data-testid="text-stats-title">Campaign Stats</DialogTitle>
            <DialogDescription>{statsCampaign?.name}</DialogDescription>
          </DialogHeader>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : statsCampaign ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-border/50 bg-card/50 p-4">
                <p className="text-sm font-semibold" data-testid="stats-campaign-title">{statsCampaign.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{statsCampaign.body}</p>
                <div className="flex items-center gap-3 mt-2">
                  {statsCampaign.sentAt && (
                    <span className="text-[10px] text-muted-foreground/70 font-mono" data-testid="stats-sent-at">Sent: {formatDate(statsCampaign.sentAt)}</span>
                  )}
                  <Badge variant="outline" className="text-[10px] font-mono">{segmentLabel(statsCampaign.targetSegment)}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Recipients", value: statsCampaign.recipientCount, testId: "stats-recipients" },
                  { label: "Delivered", value: statsCampaign.deliveredCount, testId: "stats-delivered" },
                  { label: "Failed", value: statsCampaign.failedCount, testId: "stats-failed" },
                  { label: "Clicked", value: statsCampaign.clickedCount, testId: "stats-clicked" },
                  { label: "Delivery Rate", value: `${statsCampaign.recipientCount > 0 ? ((statsCampaign.deliveredCount / statsCampaign.recipientCount) * 100).toFixed(1) : "0.0"}%`, testId: "stats-delivery-rate" },
                  { label: "Click Rate", value: `${statsCampaign.recipientCount > 0 ? ((statsCampaign.clickedCount / statsCampaign.recipientCount) * 100).toFixed(1) : "0.0"}%`, testId: "stats-click-rate" },
                ].map(m => (
                  <div key={m.label} className="rounded-lg border border-border/50 bg-card/30 p-3" data-testid={m.testId}>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{m.label}</p>
                    <p className="text-lg font-bold mt-1">{m.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Delivery Rate</span>
                    <span>{statsCampaign.recipientCount > 0 ? ((statsCampaign.deliveredCount / statsCampaign.recipientCount) * 100).toFixed(1) : "0.0"}%</span>
                  </div>
                  <Progress value={statsCampaign.recipientCount > 0 ? (statsCampaign.deliveredCount / statsCampaign.recipientCount) * 100 : 0} className="h-2" data-testid="progress-delivery" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Click Rate</span>
                    <span>{statsCampaign.recipientCount > 0 ? ((statsCampaign.clickedCount / statsCampaign.recipientCount) * 100).toFixed(1) : "0.0"}%</span>
                  </div>
                  <Progress value={statsCampaign.recipientCount > 0 ? (statsCampaign.clickedCount / statsCampaign.recipientCount) * 100 : 0} className="h-2" data-testid="progress-clicks" />
                </div>
              </div>

              <div className="rounded-lg border border-border/50 bg-card/30 p-4">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">Delivered vs Failed</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={[
                    { name: "Delivered", value: statsCampaign.deliveredCount },
                    { name: "Failed", value: statsCampaign.failedCount },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      <Cell fill="hsl(var(--chart-4))" />
                      <Cell fill="hsl(var(--destructive))" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* AI Suggestions Modal */}
      <Dialog open={aiSuggestOpen} onOpenChange={setAiSuggestOpen}>
        <DialogContent className="max-w-lg" data-testid="ai-suggest-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              AI Campaign Suggestions
            </DialogTitle>
            <DialogDescription>AI-generated push notification campaigns based on your content and history.</DialogDescription>
          </DialogHeader>
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              <p className="text-sm text-muted-foreground">Generating suggestions...</p>
            </div>
          ) : aiSuggestions.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No suggestions available. Try again later.</p>
            </div>
          ) : (
            <div className="space-y-3" data-testid="ai-suggestions-list">
              {aiSuggestions.map((suggestion, idx) => (
                <div key={idx} className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-2" data-testid={`ai-suggestion-${idx}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" data-testid={`ai-suggestion-title-${idx}`}>{suggestion.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2" data-testid={`ai-suggestion-body-${idx}`}>{suggestion.body}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">{segmentLabel(suggestion.segment)}</Badge>
                  </div>
                  <button
                    onClick={() => setExpandedSuggestion(expandedSuggestion === idx ? null : idx)}
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1 font-mono uppercase tracking-wider"
                    data-testid={`button-expand-reasoning-${idx}`}
                  >
                    {expandedSuggestion === idx ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Reasoning
                  </button>
                  {expandedSuggestion === idx && (
                    <p className="text-xs text-muted-foreground/80 bg-muted/30 rounded p-2" data-testid={`ai-reasoning-${idx}`}>{suggestion.reasoning}</p>
                  )}
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => useSuggestion(suggestion)}
                      className="h-7 text-xs font-mono"
                      data-testid={`button-use-suggestion-${idx}`}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Use This
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
