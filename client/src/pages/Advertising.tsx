import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import { Megaphone, DollarSign, Eye, MousePointerClick, QrCode, Plus, Edit3, Trash2, Loader2, Sparkles, ArrowUpRight, Image, TrendingUp, Package, BarChart3, Target, Building2, ExternalLink, Check, X } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { usePodcasts } from "@/lib/api";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";
import EmptyState from "@/components/admin/EmptyState";

const ZONE_OPTIONS = [
  { value: "show_hero", label: "Show Hero" },
  { value: "episode_card", label: "Episode Card" },
  { value: "article_banner", label: "Article Banner" },
  { value: "player_panel", label: "Player Panel" },
  { value: "sidebar", label: "Sidebar" },
  { value: "footer", label: "Footer" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
  { value: "pending", label: "Pending" },
];

const FEATURE_FLAGS = [
  { key: "includesShowHero", label: "Show Hero" },
  { key: "includesEpisodeCards", label: "Episode Cards" },
  { key: "includesArticleInjection", label: "Article Injection" },
  { key: "includesQrCode", label: "QR Code" },
  { key: "includesHostReadCopy", label: "Host Read Copy" },
  { key: "includesPushMention", label: "Push Mention" },
  { key: "includesNetworkWide", label: "Network Wide" },
];

function formatCurrency(val: number | string | undefined) {
  const num = typeof val === "string" ? parseFloat(val) : (val || 0);
  return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "active": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "paused": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "expired": return "bg-red-500/10 text-red-400 border-red-500/20";
    case "pending": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-muted text-muted-foreground";
  }
}

function getTierBadgeClass(tier: string) {
  switch (tier?.toLowerCase()) {
    case "bronze": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "silver": return "bg-zinc-400/10 text-zinc-300 border-zinc-400/20";
    case "gold": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "platinum": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    default: return "bg-muted text-muted-foreground";
  }
}

const emptySponsorshipForm = {
  advertiserName: "",
  advertiserUrl: "",
  logoUrl: "",
  logoDarkUrl: "",
  tagline: "",
  packageId: "",
  showIds: [] as string[],
  qrCodeUrl: "",
  ctaText: "",
  monthlyValue: "",
  startDate: "",
  endDate: "",
  status: "pending",
  hostReadCopy: "",
};

const emptyAdUnitForm = {
  advertiserName: "",
  zone: "show_hero",
  imageUrl: "",
  clickUrl: "",
  altText: "",
  monthlyValue: "",
  priority: "5",
  startDate: "",
  endDate: "",
  status: "pending",
};

const emptyPackageForm = {
  price: "",
  impressionEstimate: "",
  includesShowHero: false,
  includesEpisodeCards: false,
  includesArticleInjection: false,
  includesQrCode: false,
  includesHostReadCopy: false,
  includesPushMention: false,
  includesNetworkWide: false,
};

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--muted-foreground))", "#6366f1", "#f43f5e", "#10b981"];

function SponsorshipsTab({ onNewClick }: { onNewClick: () => void }) {
  const { toast } = useToast();
  const { data: podcasts } = usePodcasts();

  const { data: sponsorships, isLoading } = useQuery({
    queryKey: ["/api/ad/sponsorships"],
    queryFn: () => fetch("/api/ad/sponsorships", { credentials: "include" }).then(r => r.json()),
  });

  const { data: packages } = useQuery({
    queryKey: ["/api/ad/packages"],
    queryFn: () => fetch("/api/ad/packages", { credentials: "include" }).then(r => r.json()),
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSponsorship, setEditingSponsorship] = useState<any>(null);
  const [form, setForm] = useState(emptySponsorshipForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const url = editingSponsorship
        ? `/api/ad/sponsorships/${editingSponsorship.id}`
        : "/api/ad/sponsorships";
      const method = editingSponsorship ? "PUT" : "POST";
      return fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }).then(r => { if (!r.ok) throw new Error("Failed to save"); return r.json(); });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad/sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ad/analytics/overview"] });
      setEditDialogOpen(false);
      toast({ title: editingSponsorship ? "Sponsorship Updated" : "Sponsorship Created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/ad/sponsorships/${id}`, { method: "DELETE", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error("Failed to delete"); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad/sponsorships"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ad/analytics/overview"] });
      setDeleteConfirm(null);
      toast({ title: "Sponsorship Deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const qrMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/ad/sponsorships/${id}/generate-qr`, { method: "POST", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error("Failed to generate QR"); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad/sponsorships"] });
      toast({ title: "QR Code Generated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openEdit(s: any) {
    setEditingSponsorship(s);
    setForm({
      advertiserName: s.advertiserName || "",
      advertiserUrl: s.advertiserUrl || "",
      logoUrl: s.logoUrl || "",
      logoDarkUrl: s.logoDarkUrl || "",
      tagline: s.tagline || "",
      packageId: s.packageId || "",
      showIds: s.showIds || [],
      qrCodeUrl: s.qrCodeUrl || "",
      ctaText: s.ctaText || "",
      monthlyValue: String(s.monthlyValue || ""),
      startDate: s.startDate?.split("T")[0] || "",
      endDate: s.endDate?.split("T")[0] || "",
      status: s.status || "pending",
      hostReadCopy: s.hostReadCopy || "",
    });
    setEditDialogOpen(true);
  }

  function openCreate() {
    setEditingSponsorship(null);
    setForm(emptySponsorshipForm);
    setEditDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      monthlyValue: parseFloat(form.monthlyValue) || 0,
    });
  }

  async function handleGenerateHostRead() {
    if (!editingSponsorship?.id) return;
    setAiLoading(true);
    try {
      const res = await fetch(`/api/ad/sponsorships/${editingSponsorship.id}/generate-host-read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productDescription: form.tagline || form.advertiserName }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      setForm(prev => ({ ...prev, hostReadCopy: data.hostReadCopy || data.copy || "" }));
      toast({ title: "Host Read Generated" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  }

  function toggleShow(showId: string) {
    setForm(prev => ({
      ...prev,
      showIds: prev.showIds.includes(showId)
        ? prev.showIds.filter(id => id !== showId)
        : [...prev.showIds, showId],
    }));
  }

  function getPackageTier(packageId: string) {
    const pkg = packages?.find((p: any) => p.id === packageId);
    return pkg?.tier || "—";
  }

  function getShowNames(showIds: string[]) {
    if (!showIds?.length || !podcasts) return "—";
    return showIds
      .map((id: string) => podcasts.find((p: any) => p.id === id)?.title || id)
      .join(", ");
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!sponsorships?.length ? (
        <EmptyState
          icon={Megaphone}
          title="No Sponsorships Yet"
          description="Create your first sponsorship to start monetizing your shows."
          actionLabel="New Sponsorship"
          onAction={onNewClick}
        />
      ) : (
        <Card className="glass-panel border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-sponsorships">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-xs font-mono uppercase text-muted-foreground">Advertiser</th>
                    <th className="text-left p-4 text-xs font-mono uppercase text-muted-foreground">Package</th>
                    <th className="text-left p-4 text-xs font-mono uppercase text-muted-foreground hidden md:table-cell">Shows</th>
                    <th className="text-left p-4 text-xs font-mono uppercase text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-xs font-mono uppercase text-muted-foreground">Monthly Value</th>
                    <th className="text-right p-4 text-xs font-mono uppercase text-muted-foreground hidden lg:table-cell">Impressions</th>
                    <th className="text-right p-4 text-xs font-mono uppercase text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sponsorships.map((s: any) => (
                    <tr key={s.id} className="border-b border-border/30 hover:bg-card/50 transition-colors" data-testid={`row-sponsorship-${s.id}`}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {s.logoUrl && <img src={s.logoUrl} alt="" className="h-8 w-8 rounded object-contain bg-white/10" />}
                          <div>
                            <p className="font-semibold text-foreground" data-testid={`text-sponsor-name-${s.id}`}>{s.advertiserName}</p>
                            {s.advertiserUrl && (
                              <a href={s.advertiserUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
                                <ExternalLink className="h-3 w-3" /> Visit
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`${getTierBadgeClass(getPackageTier(s.packageId))} uppercase font-mono text-[10px]`} data-testid={`badge-tier-${s.id}`}>
                          {getPackageTier(s.packageId)}
                        </Badge>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground max-w-[200px] truncate block">{getShowNames(s.showIds)}</span>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`${getStatusBadgeClass(s.status)} uppercase font-mono text-[10px]`} data-testid={`badge-status-${s.id}`}>
                          {s.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-bold" data-testid={`text-value-${s.id}`}>
                        {formatCurrency(s.monthlyValue)}
                      </td>
                      <td className="p-4 text-right hidden lg:table-cell text-muted-foreground" data-testid={`text-impressions-${s.id}`}>
                        {(s.impressions || 0).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => qrMutation.mutate(s.id)} data-testid={`button-qr-${s.id}`} disabled={qrMutation.isPending}>
                            <QrCode className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)} data-testid={`button-edit-sponsorship-${s.id}`}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(s.id)} data-testid={`button-delete-sponsorship-${s.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle>Delete Sponsorship</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this sponsorship? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-delete">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete">
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-panel border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingSponsorship ? "Edit Sponsorship" : "New Sponsorship"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Advertiser Name *</Label>
                <Input value={form.advertiserName} onChange={e => setForm({ ...form, advertiserName: e.target.value })} required data-testid="input-advertiser-name" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Advertiser URL</Label>
                <Input value={form.advertiserUrl} onChange={e => setForm({ ...form, advertiserUrl: e.target.value })} data-testid="input-advertiser-url" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Logo URL</Label>
                <Input value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} data-testid="input-logo-url" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Logo Dark URL</Label>
                <Input value={form.logoDarkUrl} onChange={e => setForm({ ...form, logoDarkUrl: e.target.value })} data-testid="input-logo-dark-url" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Tagline</Label>
                <Input value={form.tagline} onChange={e => setForm({ ...form, tagline: e.target.value })} data-testid="input-tagline" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Package</Label>
                <Select value={form.packageId} onValueChange={v => setForm({ ...form, packageId: v })}>
                  <SelectTrigger data-testid="select-package">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages?.map((pkg: any) => (
                      <SelectItem key={pkg.id} value={pkg.id}>{pkg.tier} — {formatCurrency(pkg.price)}/mo</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Shows</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg border border-border/50 max-h-40 overflow-y-auto" data-testid="shows-checklist">
                {podcasts?.map((p: any) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                    <Checkbox
                      checked={form.showIds.includes(p.id)}
                      onCheckedChange={() => toggleShow(p.id)}
                      data-testid={`checkbox-show-${p.id}`}
                    />
                    <span className="truncate">{p.title}</span>
                  </label>
                ))}
                {!podcasts?.length && <p className="text-xs text-muted-foreground">No shows available</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">QR Code URL</Label>
                <Input value={form.qrCodeUrl} onChange={e => setForm({ ...form, qrCodeUrl: e.target.value })} data-testid="input-qr-url" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">CTA Text</Label>
                <Input value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} placeholder="Learn More" data-testid="input-cta-text" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Monthly Value ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.monthlyValue} onChange={e => setForm({ ...form, monthlyValue: e.target.value })} data-testid="input-monthly-value" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} data-testid="input-start-date" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">End Date</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} data-testid="input-end-date" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="font-mono text-xs uppercase tracking-wider">Host Read Copy</Label>
                {editingSponsorship && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateHostRead}
                    disabled={aiLoading}
                    className="text-xs"
                    data-testid="button-generate-host-read"
                  >
                    {aiLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1 h-3 w-3" />}
                    Generate Host Read
                  </Button>
                )}
              </div>
              <Textarea
                value={form.hostReadCopy}
                onChange={e => setForm({ ...form, hostReadCopy: e.target.value })}
                rows={4}
                placeholder="Script for the host to read during the show..."
                data-testid="textarea-host-read"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-sponsorship">Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-sponsorship">
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingSponsorship ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdUnitsTab() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyAdUnitForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: adUnits, isLoading } = useQuery({
    queryKey: ["/api/ad/units"],
    queryFn: () => fetch("/api/ad/units", { credentials: "include" }).then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => {
      const url = editing ? `/api/ad/units/${editing.id}` : "/api/ad/units";
      const method = editing ? "PUT" : "POST";
      return fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }).then(r => { if (!r.ok) throw new Error("Failed to save"); return r.json(); });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad/units"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ad/analytics/overview"] });
      setDialogOpen(false);
      toast({ title: editing ? "Ad Unit Updated" : "Ad Unit Created" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/ad/units/${id}`, { method: "DELETE", credentials: "include" })
        .then(r => { if (!r.ok) throw new Error("Failed to delete"); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad/units"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ad/analytics/overview"] });
      setDeleteConfirm(null);
      toast({ title: "Ad Unit Deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openEdit(u: any) {
    setEditing(u);
    setForm({
      advertiserName: u.advertiserName || "",
      zone: u.zone || "show_hero",
      imageUrl: u.imageUrl || "",
      clickUrl: u.clickUrl || "",
      altText: u.altText || "",
      monthlyValue: String(u.monthlyValue || ""),
      priority: String(u.priority || 5),
      startDate: u.startDate?.split("T")[0] || "",
      endDate: u.endDate?.split("T")[0] || "",
      status: u.status || "pending",
    });
    setDialogOpen(true);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyAdUnitForm);
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      monthlyValue: parseFloat(form.monthlyValue) || 0,
      priority: parseInt(form.priority) || 5,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="font-mono text-xs uppercase tracking-wider" data-testid="button-new-ad-unit">
          <Plus className="mr-2 h-3 w-3" /> New Ad Unit
        </Button>
      </div>

      {!adUnits?.length ? (
        <EmptyState
          icon={Image}
          title="No Ad Units Yet"
          description="Create display ad units for different zones across your platform."
          actionLabel="New Ad Unit"
          onAction={openCreate}
        />
      ) : (
        <Card className="glass-panel border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-ad-units">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 text-xs font-mono uppercase text-muted-foreground">Advertiser</th>
                    <th className="text-left p-4 text-xs font-mono uppercase text-muted-foreground">Zone</th>
                    <th className="text-left p-4 text-xs font-mono uppercase text-muted-foreground hidden md:table-cell">Image</th>
                    <th className="text-left p-4 text-xs font-mono uppercase text-muted-foreground">Status</th>
                    <th className="text-right p-4 text-xs font-mono uppercase text-muted-foreground">Monthly Value</th>
                    <th className="text-center p-4 text-xs font-mono uppercase text-muted-foreground hidden lg:table-cell">Priority</th>
                    <th className="text-right p-4 text-xs font-mono uppercase text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adUnits.map((u: any) => (
                    <tr key={u.id} className="border-b border-border/30 hover:bg-card/50 transition-colors" data-testid={`row-adunit-${u.id}`}>
                      <td className="p-4 font-semibold" data-testid={`text-adunit-name-${u.id}`}>{u.advertiserName}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="font-mono text-[10px]" data-testid={`badge-zone-${u.id}`}>
                          {ZONE_OPTIONS.find(z => z.value === u.zone)?.label || u.zone}
                        </Badge>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {u.imageUrl ? (
                          <img src={u.imageUrl} alt={u.altText || ""} className="h-10 w-16 rounded object-cover bg-white/10" />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className={`${getStatusBadgeClass(u.status)} uppercase font-mono text-[10px]`} data-testid={`badge-adunit-status-${u.id}`}>
                          {u.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right font-bold" data-testid={`text-adunit-value-${u.id}`}>{formatCurrency(u.monthlyValue)}</td>
                      <td className="p-4 text-center hidden lg:table-cell text-muted-foreground" data-testid={`text-adunit-priority-${u.id}`}>{u.priority || 5}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(u)} data-testid={`button-edit-adunit-${u.id}`}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(u.id)} data-testid={`button-delete-adunit-${u.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle>Delete Ad Unit</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure you want to delete this ad unit?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-delete-adunit">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)} disabled={deleteMutation.isPending} data-testid="button-confirm-delete-adunit">
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-panel border-border max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editing ? "Edit Ad Unit" : "New Ad Unit"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Advertiser Name *</Label>
                <Input value={form.advertiserName} onChange={e => setForm({ ...form, advertiserName: e.target.value })} required data-testid="input-adunit-advertiser" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Zone *</Label>
                <Select value={form.zone} onValueChange={v => setForm({ ...form, zone: v })}>
                  <SelectTrigger data-testid="select-adunit-zone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONE_OPTIONS.map(z => (
                      <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Status</Label>
                <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                  <SelectTrigger data-testid="select-adunit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Image URL</Label>
                <Input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} data-testid="input-adunit-image" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Click URL</Label>
                <Input value={form.clickUrl} onChange={e => setForm({ ...form, clickUrl: e.target.value })} data-testid="input-adunit-click" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Alt Text</Label>
                <Input value={form.altText} onChange={e => setForm({ ...form, altText: e.target.value })} data-testid="input-adunit-alt" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Monthly Value ($)</Label>
                <Input type="number" step="0.01" min="0" value={form.monthlyValue} onChange={e => setForm({ ...form, monthlyValue: e.target.value })} data-testid="input-adunit-value" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Priority (1-10)</Label>
                <Input type="number" min="1" max="10" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} data-testid="input-adunit-priority" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Start Date</Label>
                <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} data-testid="input-adunit-start" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">End Date</Label>
                <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} data-testid="input-adunit-end" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-adunit">Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-adunit">
                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editing ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackagesTab() {
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [form, setForm] = useState(emptyPackageForm);

  const { data: packages, isLoading } = useQuery({
    queryKey: ["/api/ad/packages"],
    queryFn: () => fetch("/api/ad/packages", { credentials: "include" }).then(r => r.json()),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      fetch(`/api/ad/packages/${editingPackage.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      }).then(r => { if (!r.ok) throw new Error("Failed to update"); return r.json(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ad/packages"] });
      setEditDialogOpen(false);
      toast({ title: "Package Updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function openEdit(pkg: any) {
    setEditingPackage(pkg);
    setForm({
      price: String(pkg.price || ""),
      impressionEstimate: String(pkg.impressionEstimate || ""),
      includesShowHero: !!pkg.includesShowHero,
      includesEpisodeCards: !!pkg.includesEpisodeCards,
      includesArticleInjection: !!pkg.includesArticleInjection,
      includesQrCode: !!pkg.includesQrCode,
      includesHostReadCopy: !!pkg.includesHostReadCopy,
      includesPushMention: !!pkg.includesPushMention,
      includesNetworkWide: !!pkg.includesNetworkWide,
    });
    setEditDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      price: parseFloat(form.price) || 0,
      impressionEstimate: parseInt(form.impressionEstimate) || 0,
      includesShowHero: form.includesShowHero,
      includesEpisodeCards: form.includesEpisodeCards,
      includesArticleInjection: form.includesArticleInjection,
      includesQrCode: form.includesQrCode,
      includesHostReadCopy: form.includesHostReadCopy,
      includesPushMention: form.includesPushMention,
      includesNetworkWide: form.includesNetworkWide,
    });
  }

  const tierOrder = ["bronze", "silver", "gold", "platinum"];
  const sortedPackages = packages?.slice().sort((a: any, b: any) =>
    tierOrder.indexOf(a.tier?.toLowerCase()) - tierOrder.indexOf(b.tier?.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
      </div>
    );
  }

  if (!packages?.length) {
    return (
      <EmptyState
        icon={Package}
        title="No Packages Configured"
        description="Ad packages define the tiers and features available for sponsorships."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="packages-grid">
        {sortedPackages?.map((pkg: any) => (
          <Card key={pkg.id} className="glass-panel border-border/50 relative group" data-testid={`card-package-${pkg.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`${getTierBadgeClass(pkg.tier)} uppercase font-mono text-xs font-bold`} data-testid={`badge-package-tier-${pkg.id}`}>
                  {pkg.tier}
                </Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => openEdit(pkg)} data-testid={`button-edit-package-${pkg.id}`}>
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-3">
                <p className="text-3xl font-bold font-display" data-testid={`text-package-price-${pkg.id}`}>{formatCurrency(pkg.price)}</p>
                <p className="text-xs text-muted-foreground font-mono">/month</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span data-testid={`text-package-impressions-${pkg.id}`}>{(pkg.impressionEstimate || 0).toLocaleString()} impressions</span>
              </div>
              <div className="border-t border-border/30 pt-3 space-y-2">
                {FEATURE_FLAGS.map(flag => (
                  <div key={flag.key} className="flex items-center gap-2 text-sm">
                    {pkg[flag.key] ? (
                      <Check className="h-4 w-4 text-green-400 shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={pkg[flag.key] ? "text-foreground" : "text-muted-foreground/60"} data-testid={`text-feature-${flag.key}-${pkg.id}`}>
                      {flag.label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass-panel border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Edit {editingPackage?.tier} Package
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Price ($/mo)</Label>
                <Input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} data-testid="input-package-price" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Impression Est.</Label>
                <Input type="number" min="0" value={form.impressionEstimate} onChange={e => setForm({ ...form, impressionEstimate: e.target.value })} data-testid="input-package-impressions" />
              </div>
            </div>

            <div className="space-y-3 p-3 rounded-lg border border-border/50">
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Features</p>
              {FEATURE_FLAGS.map(flag => (
                <label key={flag.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={(form as any)[flag.key]}
                    onCheckedChange={(checked: boolean) => setForm(prev => ({ ...prev, [flag.key]: checked }))}
                    data-testid={`checkbox-feature-${flag.key}`}
                  />
                  <span>{flag.label}</span>
                </label>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)} data-testid="button-cancel-package">Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending} data-testid="button-save-package">
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AnalyticsTab() {
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/ad/analytics/revenue"],
    queryFn: () => fetch("/api/ad/analytics/revenue", { credentials: "include" }).then(r => r.json()),
  });

  const { data: placementData, isLoading: placementLoading } = useQuery({
    queryKey: ["/api/ad/analytics/by-placement"],
    queryFn: () => fetch("/api/ad/analytics/by-placement", { credentials: "include" }).then(r => r.json()),
  });

  const { data: overview } = useQuery({
    queryKey: ["/api/ad/analytics/overview"],
    queryFn: () => fetch("/api/ad/analytics/overview", { credentials: "include" }).then(r => r.json()),
  });

  const { data: sponsorships } = useQuery({
    queryKey: ["/api/ad/sponsorships"],
    queryFn: () => fetch("/api/ad/sponsorships", { credentials: "include" }).then(r => r.json()),
  });

  const topSponsors = sponsorships
    ?.filter((s: any) => s.status === "active")
    ?.sort((a: any, b: any) => (b.monthlyValue || 0) - (a.monthlyValue || 0))
    ?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs font-mono uppercase text-muted-foreground">Total Revenue</p>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <p className="text-2xl font-bold" data-testid="text-total-revenue">{formatCurrency(overview?.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs font-mono uppercase text-muted-foreground">Avg CTR</p>
              <MousePointerClick className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold" data-testid="text-avg-ctr">{(overview?.ctr || 0).toFixed(2)}%</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs font-mono uppercase text-muted-foreground">Fill Rate</p>
              <Target className="h-4 w-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold" data-testid="text-fill-rate">{(overview?.fillRate || 0).toFixed(0)}%</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between pb-2">
              <p className="text-xs font-mono uppercase text-muted-foreground">eCPM</p>
              <TrendingUp className="h-4 w-4 text-yellow-400" />
            </div>
            <p className="text-2xl font-bold" data-testid="text-ecpm">{formatCurrency(overview?.ecpm)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Revenue by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : revenueData?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData} data-testid="chart-revenue">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                  />
                  <Legend />
                  <Bar dataKey="sponsorship" stackId="a" fill="hsl(var(--primary))" name="Sponsorships" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="adUnit" stackId="a" fill="hsl(var(--accent))" name="Ad Units" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No revenue data available</div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-400" />
              Impressions by Placement
            </CardTitle>
          </CardHeader>
          <CardContent>
            {placementLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : placementData?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart data-testid="chart-impressions">
                  <Pie
                    data={placementData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {placementData.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(value: number) => [value.toLocaleString(), "Impressions"]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">No placement data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-green-400" />
            Top Sponsorships
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topSponsors.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" data-testid="table-top-sponsors">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-3 text-xs font-mono uppercase text-muted-foreground">#</th>
                    <th className="text-left p-3 text-xs font-mono uppercase text-muted-foreground">Advertiser</th>
                    <th className="text-right p-3 text-xs font-mono uppercase text-muted-foreground">Monthly Value</th>
                    <th className="text-right p-3 text-xs font-mono uppercase text-muted-foreground">Impressions</th>
                  </tr>
                </thead>
                <tbody>
                  {topSponsors.map((s: any, i: number) => (
                    <tr key={s.id} className="border-b border-border/30" data-testid={`row-top-sponsor-${i}`}>
                      <td className="p-3 text-muted-foreground font-mono">{i + 1}</td>
                      <td className="p-3 font-semibold">{s.advertiserName}</td>
                      <td className="p-3 text-right font-bold text-green-400">{formatCurrency(s.monthlyValue)}</td>
                      <td className="p-3 text-right text-muted-foreground">{(s.impressions || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No active sponsorships to rank</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Advertising() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("sponsorships");
  const [sponsorshipDialogTrigger, setSponsorshipDialogTrigger] = useState(0);

  const { data: overview } = useQuery({
    queryKey: ["/api/ad/analytics/overview"],
    queryFn: () => fetch("/api/ad/analytics/overview", { credentials: "include" }).then(r => r.json()),
  });

  const metrics = [
    { label: "Active Sponsorships", value: overview?.activeSponsorships ?? 0 },
    { label: "Revenue MTD", value: formatCurrency(overview?.revenueMtd) },
    { label: "Total Impressions", value: (overview?.totalImpressions ?? 0).toLocaleString() },
    { label: "CTR", value: `${(overview?.ctr ?? 0).toFixed(2)}%` },
    { label: "QR Scans", value: (overview?.qrScans ?? 0).toLocaleString() },
    { label: "Active Ad Units", value: overview?.activeAdUnits ?? 0 },
  ];

  function handleNewSponsorship() {
    setActiveTab("sponsorships");
    setSponsorshipDialogTrigger(prev => prev + 1);
  }

  function handleAISuggest() {
    toast({ title: "AI Suggest", description: "Analyzing your ad performance for optimization suggestions..." });
  }

  return (
    <div className="space-y-6 p-4 sm:p-6" data-testid="page-advertising">
      <PageHeader
        pageKey="advertising"
        onPrimaryAction={handleNewSponsorship}
        onAIAction={handleAISuggest}
        primaryActionOverride="New Sponsorship"
        aiActionOverride="AI Suggest"
      />

      <MetricsStrip metrics={metrics} />

      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="advertising-tabs">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full overflow-x-auto justify-start" data-testid="advertising-tabs-list">
          <TabsTrigger value="sponsorships" className="rounded-none border-b-2 border-transparent text-[14px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5" data-testid="tab-sponsorships">
            <Megaphone className="h-4 w-4 mr-1.5" />
            Sponsorships
          </TabsTrigger>
          <TabsTrigger value="adunits" className="rounded-none border-b-2 border-transparent text-[14px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5" data-testid="tab-adunits">
            <Image className="h-4 w-4 mr-1.5" />
            Ad Units
          </TabsTrigger>
          <TabsTrigger value="packages" className="rounded-none border-b-2 border-transparent text-[14px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5" data-testid="tab-packages">
            <Package className="h-4 w-4 mr-1.5" />
            Packages
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent text-[14px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4 mr-1.5" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sponsorships" className="mt-6">
          <SponsorshipsTab key={sponsorshipDialogTrigger} onNewClick={handleNewSponsorship} />
        </TabsContent>

        <TabsContent value="adunits" className="mt-6">
          <AdUnitsTab />
        </TabsContent>

        <TabsContent value="packages" className="mt-6">
          <PackagesTab />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
