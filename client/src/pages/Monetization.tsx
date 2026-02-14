import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from "recharts";
import {
  DollarSign, Users, Target, Briefcase, Plus, Download, Loader2, UserPlus,
  Package, Edit3, Trash2, Tag, Layers, ShieldCheck, AlertTriangle, CheckCircle2, Archive
} from "lucide-react";
import { useAdvertisers, useMetrics, useCreateAdvertiser, useCreateCampaign, useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { PRODUCT_CATEGORIES, RATE_MODELS, type Product } from "@shared/schema";
import { useAuth } from "@/lib/auth";

const cpmData = [
  { time: "00:00", value: 12 }, { time: "04:00", value: 10 }, { time: "08:00", value: 25 },
  { time: "12:00", value: 35 }, { time: "16:00", value: 30 }, { time: "20:00", value: 22 }, { time: "23:59", value: 15 },
];

const pieData = [
  { name: 'Direct Sales', value: 65, color: 'hsl(var(--primary))' },
  { name: 'Programmatic', value: 25, color: 'hsl(var(--accent))' },
  { name: 'Affiliate', value: 10, color: 'hsl(var(--muted-foreground))' },
];

function getCategoryLabel(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function getRateModelLabel(model: string) {
  const labels: Record<string, string> = {
    cpm: "CPM (Cost Per Mille)",
    cpc: "CPC (Cost Per Click)",
    cpa: "CPA (Cost Per Action)",
    flat_rate: "Flat Rate",
    per_episode: "Per Episode",
    per_month: "Per Month",
    custom: "Custom",
  };
  return labels[model] || model;
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case "display_ads": return <Layers className="h-4 w-4" />;
    case "audio_ads": return <Target className="h-4 w-4" />;
    case "video_ads": return <Target className="h-4 w-4" />;
    case "sponsorship": return <Briefcase className="h-4 w-4" />;
    case "branded_content": return <Tag className="h-4 w-4" />;
    case "newsletter": return <DollarSign className="h-4 w-4" />;
    case "social_media": return <Users className="h-4 w-4" />;
    case "events": return <Package className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-green-500/10 text-green-400 border-green-500/20";
    case "inactive": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "archived": return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
    default: return "bg-muted text-muted-foreground";
  }
}

const emptyProductForm = {
  name: "",
  category: "display_ads",
  description: "",
  rateModel: "cpm",
  wholesaleRate: "",
  suggestedRetailRate: "",
  minimumRate: "",
  overrideThresholdPercent: "10",
  deliverables: "",
  unitLabel: "impressions",
  minimumUnits: "0",
  notes: "",
  fulfillmentRequirements: [] as string[],
};

function ProductsTab() {
  const { data: products, isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const { toast } = useToast();
  const { user } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProductForm);
  const [newReq, setNewReq] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isAdmin = user?.role === "admin";
  const canEdit = isAdmin || user?.permissions?.includes("monetization.edit");

  function openCreate() {
    setEditingProduct(null);
    setForm(emptyProductForm);
    setDialogOpen(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setForm({
      name: p.name,
      category: p.category,
      description: p.description || "",
      rateModel: p.rateModel,
      wholesaleRate: String(p.wholesaleRate),
      suggestedRetailRate: String(p.suggestedRetailRate),
      minimumRate: String(p.minimumRate || 0),
      overrideThresholdPercent: String(p.overrideThresholdPercent || 10),
      deliverables: p.deliverables || "",
      unitLabel: p.unitLabel || "impressions",
      minimumUnits: String(p.minimumUnits || 0),
      notes: p.notes || "",
      fulfillmentRequirements: Array.isArray(p.fulfillmentRequirements) ? (p.fulfillmentRequirements as string[]) : [],
    });
    setDialogOpen(true);
  }

  function addRequirement() {
    if (newReq.trim()) {
      setForm({ ...form, fulfillmentRequirements: [...form.fulfillmentRequirements, newReq.trim()] });
      setNewReq("");
    }
  }

  function removeRequirement(idx: number) {
    setForm({ ...form, fulfillmentRequirements: form.fulfillmentRequirements.filter((_, i) => i !== idx) });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      category: form.category,
      description: form.description || undefined,
      rateModel: form.rateModel,
      wholesaleRate: parseFloat(form.wholesaleRate) || 0,
      suggestedRetailRate: parseFloat(form.suggestedRetailRate) || 0,
      minimumRate: parseFloat(form.minimumRate) || 0,
      overrideThresholdPercent: parseInt(form.overrideThresholdPercent) || 10,
      deliverables: form.deliverables || undefined,
      unitLabel: form.unitLabel,
      minimumUnits: parseInt(form.minimumUnits) || 0,
      notes: form.notes || undefined,
      fulfillmentRequirements: form.fulfillmentRequirements,
    };

    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, ...payload }, {
        onSuccess: () => {
          toast({ title: "Product Updated", description: `"${form.name}" has been updated.` });
          setDialogOpen(false);
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => {
          toast({ title: "Product Created", description: `"${form.name}" is now available for deals.` });
          setDialogOpen(false);
          setForm(emptyProductForm);
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: string) {
    deleteProduct.mutate(id, {
      onSuccess: () => {
        toast({ title: "Product Deleted", description: "Product has been removed." });
        setDeleteConfirm(null);
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleStatusToggle(p: Product) {
    const newStatus = p.status === "active" ? "inactive" : "active";
    updateProduct.mutate({ id: p.id, status: newStatus }, {
      onSuccess: () => {
        toast({ title: "Status Updated", description: `"${p.name}" is now ${newStatus}.` });
      },
    });
  }

  const filtered = statusFilter === "all" ? products : products?.filter((p: Product) => p.status === statusFilter);
  const activeCount = products?.filter((p: Product) => p.status === "active").length || 0;
  const totalProducts = products?.length || 0;
  const margin = products?.length
    ? (products.reduce((sum: number, p: Product) => sum + (p.suggestedRetailRate - p.wholesaleRate), 0) / products.length).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-panel border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground font-mono">TOTAL PRODUCTS</p>
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl font-bold font-display" data-testid="text-total-products">{totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">{activeCount} active</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground font-mono">AVG MARGIN</p>
              <DollarSign className="h-4 w-4 text-green-400" />
            </div>
            <div className="text-2xl font-bold font-display" data-testid="text-avg-margin">${margin}</div>
            <p className="text-xs text-muted-foreground mt-1">Retail - Wholesale spread</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <p className="text-sm font-medium text-muted-foreground font-mono">CATEGORIES</p>
              <Layers className="h-4 w-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-display" data-testid="text-categories">
              {new Set(products?.map((p: Product) => p.category)).size || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Product types offered</p>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display">Product Catalog</CardTitle>
            <CardDescription className="font-mono text-xs">Manage your media products, rates, and fulfillment requirements</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] font-mono text-xs" data-testid="select-product-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            {canEdit && (
              <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-new-product">
                <Plus className="mr-2 h-3 w-3" />
                New Product
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
            </div>
          ) : filtered?.length > 0 ? (
            <div className="space-y-3" data-testid="products-list">
              {filtered.map((p: Product) => (
                <div
                  key={p.id}
                  className="relative p-5 bg-card/30 rounded-lg border border-transparent hover:border-primary/20 transition-all group"
                  style={{ borderLeftWidth: 3, borderLeftColor: p.status === "active" ? "hsl(var(--primary))" : p.status === "inactive" ? "hsl(45, 90%, 50%)" : "hsl(var(--muted-foreground))" }}
                  data-testid={`card-product-${p.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary border border-primary/20 mt-0.5">
                        {getCategoryIcon(p.category)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground" data-testid={`text-product-name-${p.id}`}>{p.name}</h3>
                          <Badge variant="outline" className={`${getStatusColor(p.status)} uppercase font-mono text-[10px]`} data-testid={`badge-product-status-${p.id}`}>
                            {p.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
                          <span>{getCategoryLabel(p.category)}</span>
                          <span>|</span>
                          <span>{getRateModelLabel(p.rateModel)}</span>
                          {p.unitLabel && <><span>|</span><span>Unit: {p.unitLabel}</span></>}
                        </div>
                        {p.description && (
                          <p className="text-sm text-muted-foreground mt-1 max-w-xl">{p.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right space-y-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Wholesale</p>
                            <p className="font-bold text-foreground" data-testid={`text-wholesale-${p.id}`}>${p.wholesaleRate.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Retail</p>
                            <p className="font-bold text-primary" data-testid={`text-retail-${p.id}`}>${p.suggestedRetailRate.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-muted-foreground uppercase">Margin</p>
                            <p className="font-bold text-green-400">${(p.suggestedRetailRate - p.wholesaleRate).toFixed(2)}</p>
                          </div>
                        </div>
                        {(p.overrideThresholdPercent ?? 0) > 0 && (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-amber-400">
                            <ShieldCheck className="h-3 w-3" />
                            Override threshold: {p.overrideThresholdPercent}%
                          </div>
                        )}
                      </div>

                      {canEdit && (
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)} data-testid={`button-edit-product-${p.id}`}>
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleStatusToggle(p)} data-testid={`button-toggle-product-${p.id}`}>
                            {p.status === "active" ? <AlertTriangle className="h-3.5 w-3.5 text-yellow-400" /> : <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteConfirm(p.id)} data-testid={`button-delete-product-${p.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {Array.isArray(p.fulfillmentRequirements) && (p.fulfillmentRequirements as string[]).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Fulfillment Requirements</p>
                      <div className="flex flex-wrap gap-2">
                        {(p.fulfillmentRequirements as string[]).map((req, i) => (
                          <Badge key={i} variant="outline" className="font-mono text-[10px] bg-card/50 border-border/50">
                            {req}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {p.deliverables && (
                    <div className="mt-2 pt-2 border-t border-border/30">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Deliverables</p>
                      <p className="text-xs text-muted-foreground">{p.deliverables}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No products configured yet</p>
              <p className="text-xs text-muted-foreground/60 font-mono mb-4">Create your first product to start building deals</p>
              {canEdit && (
                <Button onClick={openCreate} variant="outline" className="font-mono text-xs" data-testid="button-new-product-empty">
                  <Plus className="mr-2 h-3 w-3" />
                  Create First Product
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-panel border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{editingProduct ? "Edit Product" : "Create New Product"}</DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {editingProduct ? "Update product details, rates, and requirements" : "Define a new product with rates and fulfillment requirements"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Product Name *</Label>
                <Input placeholder="e.g. Standard Display Ad Package" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required data-testid="input-product-name" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Category *</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger data-testid="select-product-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Rate Model *</Label>
                <Select value={form.rateModel} onValueChange={(v) => setForm({ ...form, rateModel: v })}>
                  <SelectTrigger data-testid="select-product-rate-model">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RATE_MODELS.map(m => (
                      <SelectItem key={m} value={m}>{getRateModelLabel(m)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Description</Label>
              <Textarea placeholder="Describe what this product includes..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} data-testid="input-product-description" />
            </div>

            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-4">
              <h4 className="font-mono text-xs uppercase tracking-wider text-primary flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5" />
                Pricing & Rates
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Wholesale Rate ($) *</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.wholesaleRate} onChange={(e) => setForm({ ...form, wholesaleRate: e.target.value })} required data-testid="input-product-wholesale" />
                  <p className="text-[10px] text-muted-foreground">Internal cost basis</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Suggested Retail ($) *</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.suggestedRetailRate} onChange={(e) => setForm({ ...form, suggestedRetailRate: e.target.value })} required data-testid="input-product-retail" />
                  <p className="text-[10px] text-muted-foreground">Can be overridden per deal</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Minimum Rate ($)</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" value={form.minimumRate} onChange={(e) => setForm({ ...form, minimumRate: e.target.value })} data-testid="input-product-minimum" />
                  <p className="text-[10px] text-muted-foreground">Floor price (optional)</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 space-y-4">
              <h4 className="font-mono text-xs uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" />
                Override Controls
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Override Threshold (%)</Label>
                  <Input type="number" min="0" max="100" placeholder="10" value={form.overrideThresholdPercent} onChange={(e) => setForm({ ...form, overrideThresholdPercent: e.target.value })} data-testid="input-product-threshold" />
                  <p className="text-[10px] text-muted-foreground">Max discount % non-admin users can apply</p>
                </div>
                <div className="space-y-2 flex flex-col justify-end">
                  <div className="p-3 rounded bg-card/50 border border-border/50">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">Effective Range</p>
                    <p className="text-sm font-mono">
                      ${(parseFloat(form.suggestedRetailRate || "0") * (1 - (parseInt(form.overrideThresholdPercent || "0") / 100))).toFixed(2)}
                      {" — "}
                      ${parseFloat(form.suggestedRetailRate || "0").toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">Admins can override beyond this range</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Unit Label</Label>
                <Input placeholder="e.g. impressions, episodes, posts" value={form.unitLabel} onChange={(e) => setForm({ ...form, unitLabel: e.target.value })} data-testid="input-product-unit" />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Minimum Units</Label>
                <Input type="number" min="0" placeholder="0" value={form.minimumUnits} onChange={(e) => setForm({ ...form, minimumUnits: e.target.value })} data-testid="input-product-min-units" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Deliverables</Label>
              <Textarea placeholder="What the advertiser receives (e.g. 3 banner placements across network, monthly performance report)" value={form.deliverables} onChange={(e) => setForm({ ...form, deliverables: e.target.value })} rows={2} data-testid="input-product-deliverables" />
            </div>

            <div className="space-y-3">
              <Label className="font-mono text-xs uppercase tracking-wider">Fulfillment Requirements</Label>
              <div className="flex gap-2">
                <Input placeholder="e.g. Creative assets required 5 days before launch" value={newReq} onChange={(e) => setNewReq(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRequirement(); } }} data-testid="input-product-requirement" />
                <Button type="button" variant="outline" onClick={addRequirement} className="font-mono text-xs shrink-0" data-testid="button-add-requirement">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              {form.fulfillmentRequirements.length > 0 && (
                <div className="space-y-2">
                  {form.fulfillmentRequirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-card/50 border border-border/30">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-sm flex-1">{req}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeRequirement(i)} data-testid={`button-remove-req-${i}`}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Internal Notes</Label>
              <Textarea placeholder="Notes visible only to your team..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} data-testid="input-product-notes" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="font-mono text-xs" data-testid="button-cancel-product">Cancel</Button>
              <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-product">
                {(createProduct.isPending || updateProduct.isPending) ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Package className="mr-2 h-3 w-3" />}
                {editingProduct ? "Update Product" : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Delete Product</DialogTitle>
            <DialogDescription className="font-mono text-xs">This action cannot be undone. Any deals referencing this product will keep their existing configuration.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirm(null)} className="font-mono text-xs" data-testid="button-cancel-delete-product">Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirm && handleDelete(deleteConfirm)} disabled={deleteProduct.isPending} className="font-mono text-xs uppercase tracking-wider" data-testid="button-confirm-delete-product">
              {deleteProduct.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3" />}
              Delete Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

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
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-card/50 border border-border/50 p-1">
          <TabsTrigger value="overview" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-revenue-overview">
            <DollarSign className="mr-2 h-3.5 w-3.5" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="products" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-revenue-products">
            <Package className="mr-2 h-3.5 w-3.5" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAdvOpen(true)} className="font-mono text-xs uppercase tracking-wider border-border bg-card/50" data-testid="button-new-advertiser">
              <UserPlus className="mr-2 h-3 w-3" />
              New Advertiser
            </Button>
            <Button onClick={() => setCampOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-new-campaign">
              <Plus className="mr-2 h-3 w-3" />
              New Campaign
            </Button>
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
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <ProductsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
