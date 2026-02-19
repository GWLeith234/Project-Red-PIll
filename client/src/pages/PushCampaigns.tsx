import { useState, useMemo } from "react";
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
  Bell, Send, CheckCircle, MousePointerClick, Plus, Edit3, Trash2, Eye,
  Loader2, XCircle, BarChart3, Image, Link, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  sent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
  scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/30",
};

const SEGMENT_OPTIONS = [
  { value: "all", label: "All Subscribers" },
  { value: "article_readers", label: "Article Readers" },
  { value: "episode_listeners", label: "Episode Listeners" },
  { value: "breaking_news", label: "Breaking News" },
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

type CampaignForm = {
  name: string;
  title: string;
  body: string;
  clickUrl: string;
  iconUrl: string;
  imageUrl: string;
  targetSegment: string;
};

const defaultForm: CampaignForm = {
  name: "",
  title: "",
  body: "",
  clickUrl: "",
  iconUrl: "",
  imageUrl: "",
  targetSegment: "all",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
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

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>({ ...defaultForm });

  const [statsOpen, setStatsOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsCampaign, setStatsCampaign] = useState<Campaign | null>(null);
  const [statsData, setStatsData] = useState<any>(null);

  const [confirmSend, setConfirmSend] = useState<Campaign | null>(null);

  const createCampaign = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/push-campaigns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/push-campaigns"] });
      toast({ title: "Campaign Created", description: "Push campaign has been created." });
      setComposerOpen(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateCampaign = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      await apiRequest("PUT", `/api/push-campaigns/${id}`, data);
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
      toast({ title: "Campaign Deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendCampaign = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/push-campaigns/${id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/push-campaigns"] });
      toast({ title: "Campaign Sent", description: "Push notifications are being delivered." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
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

  const metrics = useMemo(() => {
    const total = campaigns.length;
    const sent = campaigns.filter(c => c.status === "sent").length;
    const totalDelivered = campaigns.reduce((sum, c) => sum + (c.deliveredCount || 0), 0);
    const totalClicked = campaigns.reduce((sum, c) => sum + (c.clickedCount || 0), 0);
    const clickRate = totalDelivered > 0 ? ((totalClicked / totalDelivered) * 100).toFixed(1) : "0.0";
    return { total, sent, totalDelivered, clickRate };
  }, [campaigns]);

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
    });
    setEditingId(campaign.id);
    setComposerOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.title.trim() || !form.body.trim()) {
      toast({ title: "Required Fields", description: "Name, title, and body are required.", variant: "destructive" });
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

  const isMutating = createCampaign.isPending || updateCampaign.isPending;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <PageHeader pageKey="push-campaigns" onPrimaryAction={openCreateDialog} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="metrics-strip">
        {[
          { label: "Total Campaigns", value: metrics.total, icon: Bell, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/20" },
          { label: "Sent", value: metrics.sent, icon: Send, color: "text-chart-4", bgColor: "bg-chart-4/10", borderColor: "border-chart-4/20" },
          { label: "Total Delivered", value: metrics.totalDelivered, icon: CheckCircle, color: "text-accent", bgColor: "bg-accent/10", borderColor: "border-accent/20" },
          { label: "Click Rate", value: `${metrics.clickRate}%`, icon: MousePointerClick, color: "text-chart-1", bgColor: "bg-chart-1/10", borderColor: "border-chart-1/20" },
        ].map((stat) => (
          <Card key={stat.label} className={cn("glass-panel border", stat.borderColor)} data-testid={`metric-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <span className={cn("text-2xl font-bold font-display", stat.color)} data-testid={`metric-value-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>{stat.value}</span>
              </div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</p>
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
            <h3 className="text-sm font-display font-semibold text-muted-foreground mb-1">No Push Campaigns Yet</h3>
            <p className="text-xs text-muted-foreground/70 mb-4">Create your first push campaign</p>
            <Button onClick={openCreateDialog} variant="outline" size="sm" className="font-mono text-xs" data-testid="button-create-first-campaign">
              <Plus className="mr-1.5 h-3 w-3" /> Create Campaign
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
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Title / Body</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Status</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Segment</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Recipients</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Delivered</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Clicks</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Created</TableHead>
                  <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id} className="border-border/30 hover:bg-card/50" data-testid={`campaign-row-${c.id}`}>
                    <TableCell className="text-sm font-semibold" data-testid={`text-campaign-name-${c.id}`}>{c.name}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="text-sm truncate" data-testid={`text-campaign-title-${c.id}`}>{c.title}</div>
                      <div className="text-xs text-muted-foreground truncate" data-testid={`text-campaign-body-${c.id}`}>{c.body}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px] font-mono", STATUS_COLORS[c.status] || "")} data-testid={`badge-status-${c.id}`}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground" data-testid={`text-segment-${c.id}`}>{segmentLabel(c.targetSegment)}</TableCell>
                    <TableCell className="text-xs" data-testid={`text-recipients-${c.id}`}>{c.recipientCount}</TableCell>
                    <TableCell className="text-xs" data-testid={`text-delivered-${c.id}`}>{c.deliveredCount}</TableCell>
                    <TableCell className="text-xs" data-testid={`text-clicks-${c.id}`}>{c.clickedCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground" data-testid={`text-created-${c.id}`}>{formatDate(c.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {c.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditDialog(c)}
                              data-testid={`button-edit-${c.id}`}
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300"
                              onClick={() => setConfirmSend(c)}
                              data-testid={`button-send-${c.id}`}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteCampaign.mutate(c.id)}
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
                            data-testid={`button-cancel-${c.id}`}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => openStats(c)}
                          data-testid={`button-stats-${c.id}`}
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="composer-dialog">
          <DialogHeader>
            <DialogTitle data-testid="text-composer-title">{editingId ? "Edit Campaign" : "Create Push Campaign"}</DialogTitle>
            <DialogDescription>Configure your push notification campaign details.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="campaign-name">Name</Label>
                <Input
                  id="campaign-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Internal campaign reference"
                  className="mt-1"
                  data-testid="input-name"
                />
              </div>
              <div>
                <Label htmlFor="campaign-title">Title</Label>
                <Input
                  id="campaign-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value.slice(0, 50) })}
                  placeholder="Notification title"
                  maxLength={50}
                  className="mt-1"
                  data-testid="input-title"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{form.title.length}/50</p>
              </div>
              <div>
                <Label htmlFor="campaign-body">Body</Label>
                <Textarea
                  id="campaign-body"
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value.slice(0, 200) })}
                  placeholder="Notification body text"
                  maxLength={200}
                  rows={3}
                  className="mt-1"
                  data-testid="input-body"
                />
                <p className="text-[10px] text-muted-foreground mt-1">{form.body.length}/200</p>
              </div>
              <div>
                <Label htmlFor="campaign-click-url">Click URL</Label>
                <div className="relative mt-1">
                  <Link className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="campaign-click-url"
                    value={form.clickUrl}
                    onChange={(e) => setForm({ ...form, clickUrl: e.target.value })}
                    placeholder="https://example.com/article"
                    className="pl-9"
                    data-testid="input-click-url"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="campaign-icon-url">Icon URL</Label>
                <div className="relative mt-1">
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
              </div>
              <div>
                <Label htmlFor="campaign-image-url">Image URL</Label>
                <div className="relative mt-1">
                  <Image className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="campaign-image-url"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
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
            </div>
            <div>
              <Label className="mb-2 block">Preview</Label>
              <div className="rounded-lg border border-border/50 bg-card/50 p-4 space-y-3" data-testid="notification-preview">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {form.iconUrl ? (
                      <img src={form.iconUrl} alt="icon" className="h-full w-full object-cover rounded-lg" />
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
                  <div className="rounded-md overflow-hidden border border-border/30">
                    <img src={form.imageUrl} alt="preview" className="w-full h-32 object-cover" data-testid="preview-image" />
                  </div>
                )}
                <div className="text-[10px] text-muted-foreground/50 font-mono">just now</div>
              </div>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setComposerOpen(false)} data-testid="button-cancel-composer">Cancel</Button>
            <Button onClick={handleSubmit} disabled={isMutating} data-testid="button-save-campaign">
              {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? "Update Campaign" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <div className="space-y-6">
              <div className="rounded-lg border border-border/50 bg-card/50 p-4">
                <p className="text-sm font-semibold" data-testid="stats-campaign-title">{statsCampaign.title}</p>
                <p className="text-xs text-muted-foreground mt-1" data-testid="stats-campaign-body">{statsCampaign.body}</p>
                {statsCampaign.sentAt && (
                  <p className="text-[10px] text-muted-foreground/70 mt-2 font-mono" data-testid="stats-sent-at">Sent: {formatDate(statsCampaign.sentAt)}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Total Recipients", value: statsCampaign.recipientCount, testId: "stats-recipients" },
                  { label: "Delivered", value: statsCampaign.deliveredCount, testId: "stats-delivered" },
                  { label: "Failed", value: statsCampaign.failedCount, testId: "stats-failed" },
                  { label: "Clicked", value: statsCampaign.clickedCount, testId: "stats-clicked" },
                ].map(m => {
                  const pct = statsCampaign.recipientCount > 0 ? ((m.value / statsCampaign.recipientCount) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={m.label} className="rounded-lg border border-border/50 bg-card/30 p-3" data-testid={m.testId}>
                      <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{m.label}</p>
                      <p className="text-lg font-bold mt-1">{m.value}</p>
                      <p className="text-[10px] text-muted-foreground">{pct}%</p>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Delivery Rate</span>
                    <span data-testid="stats-delivery-rate">{statsCampaign.recipientCount > 0 ? ((statsCampaign.deliveredCount / statsCampaign.recipientCount) * 100).toFixed(1) : "0.0"}%</span>
                  </div>
                  <Progress value={statsCampaign.recipientCount > 0 ? (statsCampaign.deliveredCount / statsCampaign.recipientCount) * 100 : 0} className="h-2" data-testid="progress-delivery" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Click Rate</span>
                    <span data-testid="stats-click-rate">{statsCampaign.deliveredCount > 0 ? ((statsCampaign.clickedCount / statsCampaign.deliveredCount) * 100).toFixed(1) : "0.0"}%</span>
                  </div>
                  <Progress value={statsCampaign.deliveredCount > 0 ? (statsCampaign.clickedCount / statsCampaign.deliveredCount) * 100 : 0} className="h-2" data-testid="progress-clicks" />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No stats available.</p>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmSend} onOpenChange={(open) => !open && setConfirmSend(null)}>
        <AlertDialogContent data-testid="confirm-send-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Send Push Campaign</AlertDialogTitle>
            <AlertDialogDescription data-testid="confirm-send-description">
              Send this campaign to {confirmSend?.recipientCount || 0} subscribers? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-send">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSend} data-testid="button-confirm-send">
              {sendCampaign.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}