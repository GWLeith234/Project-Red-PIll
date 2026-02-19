import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Eye, Trash2, X, BarChart3, Users, Clock, CheckCircle, XCircle, Loader2, AlertTriangle, Pencil } from "lucide-react";
import type { PushCampaign } from "@shared/schema";

const SEGMENT_LABELS: Record<string, string> = { all: "All Subscribers", new: "New (7 days)", engaged: "Engaged", at_risk: "At Risk" };
const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground" },
  scheduled: { bg: "bg-blue-500/15", text: "text-blue-400" },
  sending: { bg: "bg-yellow-500/15", text: "text-yellow-400" },
  sent: { bg: "bg-green-500/15", text: "text-green-400" },
  failed: { bg: "bg-red-500/15", text: "text-red-400" },
  cancelled: { bg: "bg-muted", text: "text-muted-foreground" },
};

const emptyCampaign = { name: "", title: "", body: "", iconUrl: "", clickUrl: "", imageUrl: "", targetSegment: "all", scheduledAt: "" };

export default function PushCampaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [composerOpen, setComposerOpen] = useState(false);
  const [editing, setEditing] = useState<PushCampaign | null>(null);
  const [form, setForm] = useState(emptyCampaign);
  const [sendConfirm, setSendConfirm] = useState<PushCampaign | null>(null);
  const [statsModal, setStatsModal] = useState<PushCampaign | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: campaigns = [], isLoading } = useQuery<PushCampaign[]>({
    queryKey: ["/api/push/campaigns"],
    queryFn: async () => { const r = await fetch("/api/push/campaigns", { credentials: "include" }); if (!r.ok) throw new Error("Failed to fetch campaigns"); return r.json(); },
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/push/stats"],
    queryFn: async () => { const r = await fetch("/api/push/stats", { credentials: "include" }); if (!r.ok) throw new Error("Failed"); return r.json(); },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof emptyCampaign) => {
      const r = await fetch("/api/push/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push/campaigns"] }); queryClient.invalidateQueries({ queryKey: ["/api/push/stats"] }); setComposerOpen(false); toast({ title: "Campaign created" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const r = await fetch(`/api/push/campaigns/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(data) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push/campaigns"] }); setComposerOpen(false); setEditing(null); toast({ title: "Campaign updated" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/push/campaigns/${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push/campaigns"] }); queryClient.invalidateQueries({ queryKey: ["/api/push/stats"] }); toast({ title: "Campaign deleted" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/push/campaigns/${id}/send`, { method: "POST", credentials: "include" });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
      return r.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/push/campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["/api/push/stats"] });
      setSendConfirm(null);
      toast({ title: "Campaign sent", description: `Delivered to ${data.delivered}/${data.recipientCount} subscribers` });
    },
    onError: (err: Error) => { setSendConfirm(null); toast({ title: "Send failed", description: err.message, variant: "destructive" }); },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/push/campaigns/${id}/cancel`, { method: "POST", credentials: "include" });
      if (!r.ok) { const e = await r.json(); throw new Error(e.message); }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/push/campaigns"] }); toast({ title: "Campaign cancelled" }); },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyCampaign);
    setComposerOpen(true);
  }

  function openEdit(c: PushCampaign) {
    setEditing(c);
    setForm({
      name: c.name,
      title: c.title,
      body: c.body,
      iconUrl: c.iconUrl || "",
      clickUrl: c.clickUrl || "",
      imageUrl: c.imageUrl || "",
      targetSegment: c.targetSegment,
      scheduledAt: c.scheduledAt ? new Date(c.scheduledAt).toISOString().slice(0, 16) : "",
    });
    setComposerOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.title.trim() || !form.body.trim()) {
      toast({ title: "Missing fields", description: "Name, title, and body are required", variant: "destructive" });
      return;
    }
    if (form.title.length > 65) { toast({ title: "Title too long", description: "Max 65 characters", variant: "destructive" }); return; }
    if (form.body.length > 120) { toast({ title: "Body too long", description: "Max 120 characters", variant: "destructive" }); return; }

    const hasSchedule = !!form.scheduledAt;
    const resolvedSchedule = form.scheduledAt || null;

    const payload = {
      ...form,
      iconUrl: form.iconUrl || null,
      clickUrl: form.clickUrl || null,
      imageUrl: form.imageUrl || null,
      scheduledAt: resolvedSchedule,
      status: hasSchedule ? "scheduled" : "draft",
    };

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload as any);
    }
  }

  const filtered = statusFilter === "all" ? campaigns : campaigns.filter(c => c.status === statusFilter);

  const metrics = [
    { label: "Subscribers", value: stats?.totalSubscribers ?? "—" },
    { label: "Sent This Month", value: stats?.sentThisMonth ?? "—" },
    { label: "Delivery Rate", value: stats?.avgDeliveryRate !== undefined ? `${stats.avgDeliveryRate}%` : "—" },
    { label: "Total Delivered", value: stats?.totalDelivered ?? "—" },
    { label: "Clicks (Month)", value: stats?.clicksThisMonth ?? "—" },
    { label: "Draft Campaigns", value: campaigns.filter(c => c.status === "draft").length },
  ];

  return (
    <div className="space-y-6" data-testid="push-campaigns-page">
      <PageHeader pageKey="push-campaigns" onPrimaryAction={openCreate} />
      <MetricsStrip metrics={metrics} />

      <div className="flex items-center gap-3" data-testid="push-filter-bar">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="sending">Sending</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground" data-testid="text-campaign-count">{filtered.length} campaign{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-lg" data-testid="empty-campaigns">
          <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-lg font-medium text-foreground">No campaigns yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first push notification campaign</p>
          <Button onClick={openCreate} className="mt-4" data-testid="button-create-first">+ New Campaign</Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden" data-testid="campaigns-table">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Campaign</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Segment</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Recipients</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Delivered</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Clicks</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const style = STATUS_STYLES[c.status] || STATUS_STYLES.draft;
                  const deliveryRate = c.recipientCount ? Math.round(((c.deliveredCount || 0) / c.recipientCount) * 100) : 0;
                  const ctr = c.deliveredCount ? Math.round(((c.clickedCount || 0) / c.deliveredCount) * 100) : 0;
                  return (
                    <tr key={c.id} className="border-b border-border hover:bg-muted/20 transition-colors" data-testid={`row-campaign-${c.id}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground" data-testid={`text-campaign-name-${c.id}`}>{c.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{c.title}</div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-xs" data-testid={`text-segment-${c.id}`}>{SEGMENT_LABELS[c.targetSegment] || c.targetSegment}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`${style.bg} ${style.text} border-0 text-xs`} data-testid={`badge-status-${c.id}`}>
                          {c.status}
                        </Badge>
                        {c.status === "sent" && c.recipientCount ? (
                          <span className="text-xs text-muted-foreground ml-2">{deliveryRate}%</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground" data-testid={`text-recipients-${c.id}`}>{c.recipientCount || "—"}</td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground" data-testid={`text-delivered-${c.id}`}>{c.deliveredCount || "—"}</td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell text-muted-foreground" data-testid={`text-clicks-${c.id}`}>{c.clickedCount || "—"}{c.deliveredCount ? <span className="text-xs ml-1">({ctr}%)</span> : null}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {(c.status === "draft" || c.status === "scheduled") && (
                            <>
                              <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Edit" data-testid={`button-edit-${c.id}`}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                              </button>
                              <button onClick={() => setSendConfirm(c)} className="p-1.5 rounded hover:bg-muted transition-colors" title="Send Now" data-testid={`button-send-${c.id}`}>
                                <Send className="h-4 w-4 text-blue-400" />
                              </button>
                            </>
                          )}
                          {c.status === "scheduled" && (
                            <button onClick={() => cancelMutation.mutate(c.id)} disabled={cancelMutation.isPending} className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50" title="Cancel" data-testid={`button-cancel-${c.id}`}>
                              {cancelMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin text-yellow-400" /> : <X className="h-4 w-4 text-yellow-400" />}
                            </button>
                          )}
                          {c.status === "sent" && (
                            <button onClick={() => setStatsModal(c)} className="p-1.5 rounded hover:bg-muted transition-colors" title="View Stats" data-testid={`button-stats-${c.id}`}>
                              <BarChart3 className="h-4 w-4 text-green-400" />
                            </button>
                          )}
                          {c.status === "draft" && (
                            <button onClick={() => { if (confirm("Delete this draft campaign?")) deleteMutation.mutate(c.id); }} disabled={deleteMutation.isPending} className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-50" title="Delete" data-testid={`button-delete-${c.id}`}>
                              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin text-red-400" /> : <Trash2 className="h-4 w-4 text-red-400" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={composerOpen} onOpenChange={(open) => { if (!open) { setComposerOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-lg" data-testid="composer-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "New Push Campaign"}</DialogTitle>
            <DialogDescription>
              {editing ? "Update campaign details" : "Create a notification to send to your subscribers"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Weekly Update" data-testid="input-campaign-name" />
            </div>
            <div>
              <Label>Notification Title <span className="text-xs text-muted-foreground">({form.title.length}/65)</span></Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value.slice(0, 65) }))} placeholder="New episode available!" maxLength={65} data-testid="input-title" />
            </div>
            <div>
              <Label>Notification Body <span className="text-xs text-muted-foreground">({form.body.length}/120)</span></Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value.slice(0, 120) }))} placeholder="Check out our latest episode..." rows={2} maxLength={120} data-testid="input-body" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Target Segment</Label>
                <Select value={form.targetSegment} onValueChange={v => setForm(f => ({ ...f, targetSegment: v }))}>
                  <SelectTrigger data-testid="select-segment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subscribers{stats?.segmentCounts ? ` (${stats.segmentCounts.all})` : ""}</SelectItem>
                    <SelectItem value="new">New (7 days){stats?.segmentCounts ? ` (${stats.segmentCounts.new})` : ""}</SelectItem>
                    <SelectItem value="engaged">Engaged{stats?.segmentCounts ? ` (${stats.segmentCounts.engaged})` : ""}</SelectItem>
                    <SelectItem value="at_risk">At Risk{stats?.segmentCounts ? ` (${stats.segmentCounts.at_risk})` : ""}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Schedule (optional)</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} data-testid="input-schedule" />
              </div>
            </div>
            <div>
              <Label>Click URL (optional)</Label>
              <Input value={form.clickUrl} onChange={e => setForm(f => ({ ...f, clickUrl: e.target.value }))} placeholder="https://..." data-testid="input-click-url" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Icon URL (optional)</Label>
                <Input value={form.iconUrl} onChange={e => setForm(f => ({ ...f, iconUrl: e.target.value }))} placeholder="/icon-192.png" data-testid="input-icon-url" />
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." data-testid="input-image-url" />
              </div>
            </div>

            <div className="bg-muted/50 border border-border rounded-lg p-4" data-testid="notification-preview">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">Preview</p>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  {form.iconUrl ? <img src={form.iconUrl} className="w-8 h-8 rounded" alt="" /> : <Bell className="h-5 w-5 text-primary" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">{form.title || "Notification Title"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{form.body || "Notification body text will appear here..."}</p>
                </div>
              </div>
              {form.imageUrl && <img src={form.imageUrl} className="mt-2 rounded-lg w-full h-24 object-cover" alt="" />}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setComposerOpen(false); setEditing(null); }} data-testid="button-cancel-compose">Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-campaign">
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editing ? "Update" : form.scheduledAt ? "Schedule" : "Save Draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sendConfirm} onOpenChange={(open) => !open && setSendConfirm(null)}>
        <DialogContent className="max-w-sm" data-testid="send-confirm-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-yellow-400" /> Confirm Send</DialogTitle>
            <DialogDescription>This action cannot be undone</DialogDescription>
          </DialogHeader>
          {sendConfirm && (
            <div className="space-y-3">
              <p className="text-sm text-foreground">
                Send "<span className="font-medium">{sendConfirm.title}</span>" to {SEGMENT_LABELS[sendConfirm.targetSegment] || "all"}?
              </p>
              <p className="text-xs text-muted-foreground">
                Targeting: {stats?.segmentCounts?.[sendConfirm.targetSegment] ?? "unknown"} subscribers
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendConfirm(null)} data-testid="button-cancel-send">Cancel</Button>
            <Button onClick={() => sendConfirm && sendMutation.mutate(sendConfirm.id)} disabled={sendMutation.isPending} className="bg-blue-600 hover:bg-blue-700" data-testid="button-confirm-send">
              {sendMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!statsModal} onOpenChange={(open) => !open && setStatsModal(null)}>
        <DialogContent className="max-w-md" data-testid="stats-dialog">
          <DialogHeader>
            <DialogTitle>Campaign Results</DialogTitle>
            <DialogDescription>{statsModal?.name}</DialogDescription>
          </DialogHeader>
          {statsModal && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                <p className="font-medium text-foreground">{statsModal.title}</p>
                <p className="text-sm text-muted-foreground">{statsModal.body}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard icon={<Users className="h-4 w-4" />} label="Recipients" value={statsModal.recipientCount || 0} />
                <StatCard icon={<CheckCircle className="h-4 w-4 text-green-400" />} label="Delivered" value={statsModal.deliveredCount || 0} sub={statsModal.recipientCount ? `${Math.round(((statsModal.deliveredCount || 0) / statsModal.recipientCount) * 100)}%` : undefined} />
                <StatCard icon={<XCircle className="h-4 w-4 text-red-400" />} label="Failed" value={statsModal.failedCount || 0} />
                <StatCard icon={<Eye className="h-4 w-4 text-blue-400" />} label="Clicks" value={statsModal.clickedCount || 0} sub={statsModal.deliveredCount ? `${Math.round(((statsModal.clickedCount || 0) / statsModal.deliveredCount) * 100)}% CTR` : undefined} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Sent {statsModal.sentAt ? new Date(statsModal.sentAt).toLocaleString() : "—"}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatsModal(null)} data-testid="button-close-stats">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">{icon}{label}</div>
      <div className="text-xl font-bold text-foreground">{value.toLocaleString()}{sub && <span className="text-xs text-muted-foreground ml-1.5 font-normal">{sub}</span>}</div>
    </div>
  );
}
