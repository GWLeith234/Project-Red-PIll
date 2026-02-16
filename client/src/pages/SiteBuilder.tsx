import React, { useState, useCallback } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LayoutGrid,
  Star,
  List,
  SlidersHorizontal,
  Layers,
  Image as ImageIcon,
  Type,
  Radio,
  Mic,
  Headphones,
  Play,
  ExternalLink,
  UserCircle,
  Calendar,
  Heart,
  Tag,
  Cloud,
  BarChart3,
  Megaphone,
  RectangleHorizontal,
  Sparkles,
  Building2,
  Mail,
  FileText,
  Frame,
  Share2,
  Minus,
  Search,
  Code,
  Menu,
  PanelBottom,
  AlertCircle,
  TrendingUp,
  Trophy,
  GripVertical,
  Plus,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Globe,
  Loader2,
  X,
  ArrowLeft,
  Copy,
  CheckCircle,
  AlertTriangle,
  Wand2,
  Eye,
  ChevronRight,
  Shield,
  XCircle,
} from "lucide-react";

const WIDGET_ICON_MAP: Record<string, React.ElementType> = {
  article_grid: LayoutGrid,
  article_hero: Star,
  article_list: List,
  article_carousel: SlidersHorizontal,
  category_tabs: Layers,
  hero_carousel: ImageIcon,
  rich_text: Type,
  network_directory: Radio,
  podcast_carousel: Mic,
  episode_feed: Headphones,
  player_embed: Play,
  listen_on_badges: ExternalLink,
  host_profile: UserCircle,
  events_calendar: Calendar,
  obituaries: Heart,
  classifieds: Tag,
  weather: Cloud,
  community_poll: BarChart3,
  announcements: Megaphone,
  ad_banner: RectangleHorizontal,
  sponsored_content: Sparkles,
  business_directory: Building2,
  newsletter_signup: Mail,
  media_kit_cta: FileText,
  image_block: Frame,
  social_feed: Share2,
  divider_spacer: Minus,
  search_bar: Search,
  embed: Code,
  navigation_menu: Menu,
  footer: PanelBottom,
  breaking_news: AlertCircle,
  trending_stories: TrendingUp,
  top_charts: Trophy,
  sidebar_ad: RectangleHorizontal,
};

type PreviewMode = "desktop" | "tablet" | "mobile";
type Mode = "dashboard" | "editor";

export default function SiteBuilder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [mode, setMode] = useState<Mode>("dashboard");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [showNewPageDialog, setShowNewPageDialog] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedPageType, setSelectedPageType] = useState<string>("");
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [newPagePrompt, setNewPagePrompt] = useState("");
  const [generatedLayout, setGeneratedLayout] = useState<any>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [createProgress, setCreateProgress] = useState("");
  const [genStartTime, setGenStartTime] = useState<number | null>(null);
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
  const [rowDropTarget, setRowDropTarget] = useState<string | null>(null);
  const [showRefineDialog, setShowRefineDialog] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");

  const { data: pages = [], isLoading: pagesLoading } = useQuery<any[]>({
    queryKey: ["/api/site-pages"],
  });

  const { data: currentPage, isLoading: pageLoading } = useQuery<any>({
    queryKey: ["/api/site-pages", editingPageId],
    queryFn: async () => {
      const res = await fetch(`/api/site-pages/${editingPageId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load page");
      return res.json();
    },
    enabled: !!editingPageId && mode === "editor",
  });

  const { data: widgetRegistry = {} } = useQuery<Record<string, any>>({
    queryKey: ["/api/ai-page-builder/widget-registry"],
  });

  const { data: pageTypes = {} } = useQuery<Record<string, any>>({
    queryKey: ["/api/ai-page-builder/page-types"],
  });

  const { data: adValidation } = useQuery<any>({
    queryKey: ["/api/ai-page-builder/validate-ads", editingPageId],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/ai-page-builder/validate-ads", { pageId: editingPageId });
      return res.json();
    },
    enabled: !!editingPageId && mode === "editor",
  });

  const { data: widgetSuggestionsData } = useQuery<any>({
    queryKey: ["/api/ai-page-builder/suggest-widgets", editingPageId],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/ai-page-builder/suggest-widgets", { pageId: editingPageId });
      return res.json();
    },
    enabled: !!editingPageId && mode === "editor",
  });
  const widgetSuggestions: any[] = widgetSuggestionsData?.suggestions || [];

  const generateMutation = useMutation({
    mutationFn: async (data: { pageType: string; prompt: string }) => {
      setGenStartTime(Date.now());
      setAiUnavailable(false);
      const res = await apiRequest("POST", "/api/ai-page-builder/generate", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      setGenStartTime(null);
      const rawLayout = data.layout;
      const rows = Array.isArray(rawLayout) ? rawLayout : (rawLayout?.rows ?? data.rows ?? []);
      const reasoning = data.reasoning || "";
      const isFallback = reasoning.includes("unavailable") || reasoning.includes("fallback") || reasoning.includes("template");
      setGeneratedLayout({ rows, reasoning });
      if (isFallback) {
        setAiUnavailable(true);
      }
      setWizardStep(4);
    },
    onError: (err: any) => {
      setGenStartTime(null);
      setWizardStep(2);
      toast({ title: "AI service unavailable, using template layout instead", description: "You can still create the page with a default layout, or try again.", variant: "destructive" });
      const preset = pageTypes[selectedPageType];
      if (preset?.defaultLayout) {
        setGeneratedLayout({ rows: preset.defaultLayout, reasoning: "Using template default (AI unavailable)" });
        setAiUnavailable(true);
        setWizardStep(4);
      }
    },
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: { title: string; slug: string }) => {
      const res = await apiRequest("POST", "/api/site-pages", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createFullPageMutation = useMutation({
    mutationFn: async () => {
      setCreateProgress("Creating page...");
      const pageRes = await apiRequest("POST", "/api/site-pages", { title: newPageTitle, slug: newPageSlug });
      const page = await pageRes.json();
      const rows = generatedLayout?.rows || [];
      let rowsCreated = 0;
      let widgetsCreated = 0;
      let errors: string[] = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        setCreateProgress(`Adding row ${i + 1} of ${rows.length}...`);
        try {
          const rowRes = await apiRequest("POST", `/api/site-pages/${page.id}/rows`, { columns: row.columns || 1 });
          const createdRow = await rowRes.json();
          rowsCreated++;
          if (row.widgets) {
            for (const widget of row.widgets) {
              try {
                await apiRequest("POST", `/api/page-rows/${createdRow.id}/widgets`, {
                  widgetType: widget.type,
                  config: widget.config || {},
                });
                widgetsCreated++;
              } catch (widgetErr: any) {
                errors.push(`Widget ${widget.type}: ${widgetErr.message}`);
              }
            }
          }
        } catch (rowErr: any) {
          errors.push(`Row ${i + 1}: ${rowErr.message}`);
        }
      }
      setCreateProgress("");
      return { page, rowsCreated, widgetsCreated, errors };
    },
    onSuccess: (result: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages"] });
      setShowNewPageDialog(false);
      resetWizard();
      if (result.errors.length > 0) {
        toast({ title: "Page Created with Warnings", description: `Created with ${result.rowsCreated} rows and ${result.widgetsCreated} widgets. ${result.errors.length} item(s) could not be added.` });
      } else {
        toast({ title: "Page Created", description: `"${result.page.title}" created with ${result.rowsCreated} rows and ${result.widgetsCreated} widgets.` });
      }
    },
    onError: (err: any) => {
      setCreateProgress("");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/site-pages/${editingPageId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      toast({ title: "Page Saved" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const publishPageMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/ai-page-builder/publish-validate", { pageId: editingPageId });
      const res = await apiRequest("POST", `/api/site-pages/${editingPageId}/publish`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      toast({ title: "Page Published", description: "The page is now live." });
    },
    onError: (err: any) => toast({ title: "Publish Failed", description: err.message, variant: "destructive" }),
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/site-pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages"] });
      toast({ title: "Page Deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const duplicatePageMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/site-pages/${id}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages"] });
      toast({ title: "Page Duplicated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addRowMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/site-pages/${editingPageId}/rows`, { columns: 1 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      toast({ title: "Row Added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateRowMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/page-rows/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      toast({ title: "Row Updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteRowMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/page-rows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      setSelectedRowId(null);
      toast({ title: "Row Deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const reorderRowsMutation = useMutation({
    mutationFn: async (rowIds: string[]) => {
      const res = await apiRequest("POST", `/api/site-pages/${editingPageId}/rows/reorder`, { rowIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addWidgetMutation = useMutation({
    mutationFn: async ({ rowId, widgetType }: { rowId: string; widgetType: string }) => {
      const res = await apiRequest("POST", `/api/page-rows/${rowId}/widgets`, { widgetType, config: {} });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      toast({ title: "Widget Added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateWidgetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/page-widgets/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      toast({ title: "Widget Updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/page-widgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      setSelectedWidgetId(null);
      toast({ title: "Widget Removed" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const refineMutation = useMutation({
    mutationFn: async (data: { pageId: string; instruction: string; layout: any }) => {
      const res = await apiRequest("POST", "/api/ai-page-builder/refine", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      setShowRefineDialog(false);
      setRefineInstruction("");
      toast({ title: "Layout Refined", description: "AI has updated the layout." });
    },
    onError: (err: any) => toast({ title: "Refine Failed", description: err.message, variant: "destructive" }),
  });

  const autoFixAdsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai-page-builder/auto-fix-ads", { pageId: editingPageId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai-page-builder/validate-ads", editingPageId] });
      toast({ title: "Ads Fixed", description: "Ad placements have been auto-corrected." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const rows: any[] = currentPage?.rows || [];

  const selectedWidget = selectedWidgetId
    ? rows.flatMap((r: any) => r.widgets || []).find((w: any) => w.id === selectedWidgetId)
    : null;

  const selectedRow = selectedRowId
    ? rows.find((r: any) => r.id === selectedRowId)
    : null;

  const resetWizard = () => {
    setWizardStep(1);
    setSelectedPageType("");
    setNewPageTitle("");
    setNewPageSlug("");
    setNewPagePrompt("");
    setGeneratedLayout(null);
    setAiUnavailable(false);
    setCreateProgress("");
    setGenStartTime(null);
  };

  const handleEditPage = (pageId: string) => {
    setEditingPageId(pageId);
    setMode("editor");
    setSelectedWidgetId(null);
    setSelectedRowId(null);
  };

  const handleBackToDashboard = () => {
    setMode("dashboard");
    setEditingPageId(null);
    setSelectedWidgetId(null);
    setSelectedRowId(null);
  };

  const handleWidgetDragStart = useCallback((e: React.DragEvent, widgetType: string) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/widget-type", widgetType);
  }, []);

  const handleDropOnRow = useCallback(
    (e: React.DragEvent, rowId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverRowId(null);
      setDragOverCanvas(false);
      const widgetType = e.dataTransfer.getData("application/widget-type");
      if (widgetType) {
        addWidgetMutation.mutate({ rowId, widgetType });
      }
    },
    [addWidgetMutation]
  );

  const handleDropOnCanvas = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverCanvas(false);
      setDragOverRowId(null);
      const widgetType = e.dataTransfer.getData("application/widget-type");
      if (widgetType && editingPageId) {
        addRowMutation.mutate(undefined, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/site-pages", editingPageId] });
          },
        });
      }
    },
    [editingPageId, addRowMutation, queryClient]
  );

  const handleRowDragStart = useCallback((e: React.DragEvent, rowId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/row-id", rowId);
    setDraggingRowId(rowId);
  }, []);

  const handleRowDragOver = useCallback((e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    if (draggingRowId && draggingRowId !== rowId) {
      setRowDropTarget(rowId);
    }
    if (e.dataTransfer.types.includes("application/widget-type")) {
      setDragOverRowId(rowId);
      e.dataTransfer.dropEffect = "copy";
    }
  }, [draggingRowId]);

  const handleRowDrop = useCallback(
    (e: React.DragEvent, targetRowId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const draggedRowId = e.dataTransfer.getData("application/row-id");
      if (draggedRowId && draggedRowId !== targetRowId) {
        const currentRowIds = rows.map((r: any) => r.id);
        const fromIndex = currentRowIds.indexOf(draggedRowId);
        const toIndex = currentRowIds.indexOf(targetRowId);
        if (fromIndex !== -1 && toIndex !== -1) {
          const newOrder = [...currentRowIds];
          newOrder.splice(fromIndex, 1);
          newOrder.splice(toIndex, 0, draggedRowId);
          reorderRowsMutation.mutate(newOrder);
        }
      } else {
        handleDropOnRow(e, targetRowId);
      }
      setDraggingRowId(null);
      setRowDropTarget(null);
      setDragOverRowId(null);
    },
    [rows, reorderRowsMutation, handleDropOnRow]
  );

  const getWidgetIcon = (type: string): React.ElementType => {
    return WIDGET_ICON_MAP[type] || Code;
  };

  const getWidgetLabel = (type: string): string => {
    const reg = widgetRegistry[type];
    if (reg) return reg.label;
    return type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  };

  const isAdUnit = (type: string): boolean => {
    return widgetRegistry[type]?.isAdUnit || false;
  };

  const getPreviewHeight = (type: string): number => {
    return widgetRegistry[type]?.previewHeight || 120;
  };

  const canvasWidth = previewMode === "desktop" ? "100%" : previewMode === "tablet" ? "768px" : "375px";

  const registryCategories = Object.values(widgetRegistry).reduce((acc: Record<string, any[]>, w: any) => {
    const cat = w.category || "Utility";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(w);
    return acc;
  }, {});

  const adComplianceStatus = adValidation?.isValid === true ? "green" : adValidation?.isValid === false ? "red" : "yellow";

  if (mode === "dashboard") {
    return (
      <div className="h-[calc(100vh-3.5rem)] lg:h-screen -mx-4 sm:-mx-6 lg:-mx-8 -mb-4 sm:-mb-6 lg:-mb-8 flex flex-col" data-testid="page-site-builder">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <PageHeader pageKey="ai-site-editor" onPrimaryAction={() => { resetWizard(); setShowNewPageDialog(true); }} />
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {pagesLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center" data-testid="empty-state">
              <Globe className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h2 className="text-xl font-display font-semibold mb-2">No Pages Yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md">
                Get started by building your first page. Our AI assistant will help you create a professional layout in seconds.
              </p>
              <Button onClick={() => { resetWizard(); setShowNewPageDialog(true); }} data-testid="button-build-first-page">
                <Sparkles className="h-4 w-4 mr-2" />
                Build Your First Page
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Slug</th>
                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Ad Compliance</th>
                    <th className="text-left px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Last Modified</th>
                    <th className="text-right px-4 py-3 text-xs font-mono uppercase tracking-wider text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page: any) => (
                    <tr key={page.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors" data-testid={`row-page-${page.id}`}>
                      <td className="px-4 py-3">
                        <span className="font-medium" data-testid={`text-page-title-${page.id}`}>{page.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-sm text-muted-foreground" data-testid={`text-page-slug-${page.id}`}>/{page.slug}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={page.status === "published" ? "default" : "secondary"} data-testid={`badge-status-${page.id}`}>
                          {page.status || "draft"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <AdComplianceBadge pageId={page.id} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditPage(page.id)} data-testid={`button-edit-${page.id}`}>
                            <Eye className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => duplicatePageMutation.mutate(page.id)} data-testid={`button-duplicate-${page.id}`}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deletePageMutation.mutate(page.id)} data-testid={`button-delete-${page.id}`}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <NewPageWizardDialog
          open={showNewPageDialog}
          onOpenChange={(open) => { setShowNewPageDialog(open); if (!open) resetWizard(); }}
          step={wizardStep}
          setStep={setWizardStep}
          pageTypes={pageTypes}
          selectedPageType={selectedPageType}
          setSelectedPageType={setSelectedPageType}
          title={newPageTitle}
          setTitle={(t) => { setNewPageTitle(t); setNewPageSlug(t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")); }}
          slug={newPageSlug}
          setSlug={setNewPageSlug}
          prompt={newPagePrompt}
          setPrompt={setNewPagePrompt}
          generatedLayout={generatedLayout}
          aiUnavailable={aiUnavailable}
          createProgress={createProgress}
          genStartTime={genStartTime}
          onGenerate={() => generateMutation.mutate({ pageType: selectedPageType, prompt: newPagePrompt })}
          onCreatePage={() => createFullPageMutation.mutate()}
          generating={generateMutation.isPending}
          creating={createFullPageMutation.isPending}
          getWidgetIcon={getWidgetIcon}
          getWidgetLabel={getWidgetLabel}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-3.5rem)] lg:h-screen -mx-4 sm:-mx-6 lg:-mx-8 -mb-4 sm:-mb-6 lg:-mb-8" data-testid="page-site-builder">
      <div className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 shrink-0">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">Widgets</h2>
        </div>
        <Tabs defaultValue="palette" className="flex-1 flex flex-col">
          <TabsList className="mx-2 mt-2 grid grid-cols-2">
            <TabsTrigger value="palette" data-testid="tab-palette">Library</TabsTrigger>
            <TabsTrigger value="suggestions" data-testid="tab-suggestions">AI Suggest</TabsTrigger>
          </TabsList>
          <TabsContent value="palette" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <Accordion type="multiple" defaultValue={["Content", "Podcast", "Community", "Commerce", "Utility"]} className="px-2 py-2">
                {Object.entries(registryCategories).map(([cat, widgets]) => (
                  <AccordionItem key={cat} value={cat} className="border-b-0">
                    <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-2 px-2">
                      {cat}
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <div className="space-y-1">
                        {(widgets as any[]).map((w: any) => {
                          const Icon = getWidgetIcon(w.type);
                          return (
                            <div
                              key={w.type}
                              draggable
                              onDragStart={(e) => handleWidgetDragStart(e, w.type)}
                              className={cn(
                                "flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors",
                                w.isAdUnit && "border-l-2 border-amber-500/50"
                              )}
                              data-testid={`palette-widget-${w.type}`}
                            >
                              <Icon className="h-4 w-4 shrink-0 text-primary/60" />
                              <span className="truncate">{w.label}</span>
                              {w.isAdUnit && <Badge variant="outline" className="ml-auto text-[10px] border-amber-500/50 text-amber-500">AD</Badge>}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="suggestions" className="flex-1 mt-0">
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div className="p-3 space-y-2">
                {(widgetSuggestions as any[]).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">AI suggestions will appear based on your page content</p>
                ) : (
                  (widgetSuggestions as any[]).map((s: any, i: number) => {
                    const Icon = getWidgetIcon(s.type);
                    return (
                      <div
                        key={i}
                        draggable
                        onDragStart={(e) => handleWidgetDragStart(e, s.type)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm bg-primary/5 text-foreground cursor-grab active:cursor-grabbing border border-primary/10"
                        data-testid={`suggestion-widget-${s.type}`}
                      >
                        <Sparkles className="h-3 w-3 text-primary shrink-0" />
                        <Icon className="h-4 w-4 shrink-0 text-primary/60" />
                        <div className="min-w-0">
                          <span className="truncate block text-sm">{s.label || getWidgetLabel(s.type)}</span>
                          {s.reason && <span className="truncate block text-[10px] text-muted-foreground">{s.reason}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card/80 shrink-0">
          <Button variant="ghost" size="sm" onClick={handleBackToDashboard} data-testid="button-back-dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-display font-semibold truncate" data-testid="text-editor-title">
              {currentPage?.title || "Loading..."}
            </h2>
            <p className="text-[10px] font-mono text-muted-foreground truncate">/{currentPage?.slug}</p>
          </div>
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <Button variant={previewMode === "desktop" ? "secondary" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewMode("desktop")} data-testid="button-preview-desktop">
              <Monitor className="h-3.5 w-3.5" />
            </Button>
            <Button variant={previewMode === "tablet" ? "secondary" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewMode("tablet")} data-testid="button-preview-tablet">
              <Tablet className="h-3.5 w-3.5" />
            </Button>
            <Button variant={previewMode === "mobile" ? "secondary" : "ghost"} size="sm" className="h-7 w-7 p-0" onClick={() => setPreviewMode("mobile")} data-testid="button-preview-mobile">
              <Smartphone className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            {adComplianceStatus === "green" && (
              <Badge variant="outline" className="border-green-500/50 text-green-500 text-[10px]" data-testid="badge-ad-compliance">
                <CheckCircle className="h-3 w-3 mr-1" /> Ads OK
              </Badge>
            )}
            {adComplianceStatus === "yellow" && (
              <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 text-[10px]" data-testid="badge-ad-compliance">
                <AlertTriangle className="h-3 w-3 mr-1" /> Check Ads
              </Badge>
            )}
            {adComplianceStatus === "red" && (
              <>
                <Badge variant="outline" className="border-red-500/50 text-red-500 text-[10px]" data-testid="badge-ad-compliance">
                  <XCircle className="h-3 w-3 mr-1" /> Ad Issues
                </Badge>
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => autoFixAdsMutation.mutate()} disabled={autoFixAdsMutation.isPending} data-testid="button-auto-fix-ads">
                  {autoFixAdsMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Shield className="h-3 w-3 mr-1" />}
                  Auto-Fix
                </Button>
              </>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowRefineDialog(true)} data-testid="button-ai-refine">
            <Wand2 className="h-4 w-4 mr-1" /> Refine
          </Button>
          <Button variant="outline" size="sm" onClick={() => updatePageMutation.mutate({})} disabled={updatePageMutation.isPending} data-testid="button-save-page">
            {updatePageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
          <Button size="sm" onClick={() => publishPageMutation.mutate()} disabled={publishPageMutation.isPending} data-testid="button-publish-page">
            {publishPageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Globe className="h-4 w-4 mr-1" />}
            Publish
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto bg-background/50 p-4 lg:p-6">
          {pageLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mx-auto transition-all duration-300" style={{ maxWidth: canvasWidth }}>
              <div
                className={cn(
                  "min-h-[300px] space-y-3 transition-colors rounded-lg",
                  dragOverCanvas && rows.length === 0 && "bg-primary/5 border-2 border-dashed border-primary/30"
                )}
                data-testid="canvas-drop-zone"
                onDragOver={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.types.includes("application/widget-type")) {
                    setDragOverCanvas(true);
                    e.dataTransfer.dropEffect = "copy";
                  }
                }}
                onDragLeave={() => setDragOverCanvas(false)}
                onDrop={handleDropOnCanvas}
              >
                {rows.map((row: any, index: number) => (
                  <div
                    key={row.id}
                    className={cn(
                      "group relative rounded-lg border transition-all",
                      selectedRowId === row.id ? "border-primary ring-1 ring-primary/30" : "border-border",
                      dragOverRowId === row.id && "border-primary/50 bg-primary/5",
                      rowDropTarget === row.id && "border-dashed border-primary",
                      draggingRowId === row.id && "opacity-50"
                    )}
                    data-testid={`canvas-row-${row.id}`}
                    onClick={() => { setSelectedRowId(row.id); setSelectedWidgetId(null); }}
                    onDragOver={(e) => handleRowDragOver(e, row.id)}
                    onDrop={(e) => handleRowDrop(e, row.id)}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
                      draggable
                      onDragStart={(e) => handleRowDragStart(e, row.id)}
                      onDragEnd={() => { setDraggingRowId(null); setRowDropTarget(null); }}
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); deleteRowMutation.mutate(row.id); }} data-testid={`button-delete-row-${row.id}`}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="pl-7 pr-10 py-3">
                      <div className="text-[10px] font-mono text-muted-foreground/50 mb-2">Row {index + 1} · {row.columns || 1} col</div>
                      <div className={cn("grid gap-2", row.columns === 2 ? "grid-cols-2" : row.columns === 3 ? "grid-cols-3" : "grid-cols-1")}>
                        {(row.widgets || []).map((widget: any) => {
                          const Icon = getWidgetIcon(widget.widgetType);
                          const ad = isAdUnit(widget.widgetType);
                          const height = Math.min(getPreviewHeight(widget.widgetType), 200);
                          return (
                            <div
                              key={widget.id}
                              className={cn(
                                "rounded-md border p-3 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:bg-muted/30",
                                selectedWidgetId === widget.id ? "border-primary ring-1 ring-primary/30 bg-primary/5" : "border-border",
                                ad && "border-amber-500/50 bg-amber-500/5"
                              )}
                              style={{ minHeight: `${Math.max(height * 0.4, 60)}px` }}
                              onClick={(e) => { e.stopPropagation(); setSelectedWidgetId(widget.id); setSelectedRowId(null); }}
                              data-testid={`canvas-widget-${widget.id}`}
                            >
                              {ad && <Badge className="bg-amber-500 text-white text-[9px] px-1 py-0 mb-1">AD</Badge>}
                              <Icon className={cn("h-6 w-6", ad ? "text-amber-500" : "text-primary/40")} />
                              <span className="text-xs font-medium text-center">{getWidgetLabel(widget.widgetType)}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{widget.widgetType}</span>
                            </div>
                          );
                        })}
                        {(!row.widgets || row.widgets.length === 0) && (
                          <div className="py-6 text-center text-xs text-muted-foreground/50 border border-dashed border-border rounded">
                            Drop widgets here
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {rows.length === 0 && !dragOverCanvas && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                    <Layers className="h-10 w-10 mb-3" />
                    <p className="text-sm font-mono">Drag widgets here or add a row</p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addRowMutation.mutate()}
                  disabled={addRowMutation.isPending}
                  data-testid="button-add-row"
                >
                  {addRowMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  Add Row
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:flex w-72 flex-col border-l border-border bg-card/50 shrink-0">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">
            {selectedWidget ? "Widget Settings" : selectedRow ? "Row Settings" : "Page Settings"}
          </h2>
          {(selectedWidget || selectedRow) && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setSelectedWidgetId(null); setSelectedRowId(null); }} data-testid="button-close-settings">
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {selectedWidget ? (
              <WidgetSettingsPanel
                widget={selectedWidget}
                registry={widgetRegistry}
                onUpdate={(data) => updateWidgetMutation.mutate({ id: selectedWidgetId!, data })}
                onDelete={() => deleteWidgetMutation.mutate(selectedWidgetId!)}
                saving={updateWidgetMutation.isPending}
              />
            ) : selectedRow ? (
              <RowSettingsPanel
                row={selectedRow}
                onUpdate={(data) => updateRowMutation.mutate({ id: selectedRowId!, data })}
                onDelete={() => deleteRowMutation.mutate(selectedRowId!)}
                saving={updateRowMutation.isPending}
              />
            ) : (
              <PageSettingsPanel
                page={currentPage}
                onUpdate={(data) => updatePageMutation.mutate(data)}
                saving={updatePageMutation.isPending}
              />
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={showRefineDialog} onOpenChange={setShowRefineDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" /> AI Refine Layout
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Instruction</Label>
            <Textarea
              value={refineInstruction}
              onChange={(e) => setRefineInstruction(e.target.value)}
              placeholder="e.g. Add more ad placements, move weather widget to sidebar, add a breaking news ticker at the top..."
              rows={4}
              data-testid="input-refine-instruction"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRefineDialog(false)}>Cancel</Button>
            <Button
              onClick={() => refineMutation.mutate({
                pageId: editingPageId!,
                instruction: refineInstruction,
                layout: { rows: rows.map((r: any) => ({ id: r.id, columns: r.columns, widgets: (r.widgets || []).map((w: any) => ({ id: w.id, type: w.widgetType, config: w.config })) })) },
              })}
              disabled={refineMutation.isPending || !refineInstruction.trim()}
              data-testid="button-refine-submit"
            >
              {refineMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Sparkles className="h-4 w-4 mr-2" />
              Refine
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdComplianceBadge({ pageId }: { pageId: string }) {
  const { data } = useQuery<any>({
    queryKey: ["/api/ai-page-builder/validate-ads", pageId],
    queryFn: async () => {
      const res = await apiRequest("POST", "/api/ai-page-builder/validate-ads", { pageId });
      return res.json();
    },
    enabled: !!pageId,
    retry: false,
  });

  if (!data) return <Badge variant="outline" className="text-[10px] text-muted-foreground">—</Badge>;
  if (data.isValid) return (
    <Badge variant="outline" className="border-green-500/50 text-green-500 text-[10px]" data-testid={`badge-ad-ok-${pageId}`}>
      <CheckCircle className="h-3 w-3 mr-1" /> Compliant
    </Badge>
  );
  return (
    <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 text-[10px]" data-testid={`badge-ad-warn-${pageId}`}>
      <AlertTriangle className="h-3 w-3 mr-1" /> Review
    </Badge>
  );
}

function NewPageWizardDialog({
  open, onOpenChange, step, setStep, pageTypes, selectedPageType, setSelectedPageType,
  title, setTitle, slug, setSlug, prompt, setPrompt, generatedLayout,
  aiUnavailable, createProgress, genStartTime,
  onGenerate, onCreatePage, generating, creating, getWidgetIcon, getWidgetLabel,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; step: number; setStep: (s: number) => void;
  pageTypes: Record<string, any>; selectedPageType: string; setSelectedPageType: (t: string) => void;
  title: string; setTitle: (t: string) => void; slug: string; setSlug: (s: string) => void;
  prompt: string; setPrompt: (p: string) => void; generatedLayout: any;
  aiUnavailable?: boolean; createProgress?: string; genStartTime?: number | null;
  onGenerate: () => void; onCreatePage: () => void; generating: boolean; creating: boolean;
  getWidgetIcon: (type: string) => React.ElementType; getWidgetLabel: (type: string) => string;
}) {
  const [showRetry, setShowRetry] = useState(false);

  React.useEffect(() => {
    if (generating && genStartTime) {
      const timer = setTimeout(() => setShowRetry(true), 15000);
      return () => clearTimeout(timer);
    }
    setShowRetry(false);
  }, [generating, genStartTime]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Build New Page
            <span className="text-xs font-mono text-muted-foreground ml-auto">Step {step} of 4</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={cn("h-1.5 flex-1 rounded-full transition-colors", s <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose a page type to get started:</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(pageTypes).map((pt: any) => (
                <Card
                  key={pt.type}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/50",
                    selectedPageType === pt.type && "border-primary ring-1 ring-primary/30"
                  )}
                  onClick={() => setSelectedPageType(pt.type)}
                  data-testid={`card-page-type-${pt.type}`}
                >
                  <CardContent className="p-4">
                    <h3 className="font-display font-semibold text-sm mb-1">{pt.label}</h3>
                    <p className="text-xs text-muted-foreground">{pt.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <DialogFooter>
              <Button disabled={!selectedPageType} onClick={() => setStep(2)} data-testid="button-wizard-next-1">
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Page Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Homepage"
                data-testid="input-wizard-title"
              />
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Slug</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. homepage"
                className="font-mono"
                data-testid="input-wizard-slug"
              />
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Describe what you want</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. A news homepage with breaking news, trending stories, weather widget, and ad placements..."
                rows={4}
                data-testid="input-wizard-prompt"
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button
                disabled={!title.trim() || !slug.trim()}
                onClick={() => { setStep(3); onGenerate(); }}
                data-testid="button-wizard-generate"
              >
                <Sparkles className="h-4 w-4 mr-2" /> Generate Layout
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-primary animate-pulse mb-4" />
            <p className="text-sm font-display font-semibold mb-2">AI is generating your layout...</p>
            <p className="text-xs text-muted-foreground">This may take a few seconds</p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mt-4" />
            {showRetry && (
              <div className="mt-6 flex flex-col items-center gap-2">
                <p className="text-xs text-muted-foreground">Taking longer than expected?</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => { onGenerate(); setShowRetry(false); }} data-testid="button-retry-generate">
                    Retry
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)} data-testid="button-back-to-prompt">
                    <ArrowLeft className="h-3 w-3 mr-1" /> Back
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            {aiUnavailable && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5" data-testid="banner-ai-unavailable">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-amber-400">AI generation is using template defaults</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Set up your AI provider in Settings to enable custom AI layouts. You can still create this page and customize manually.</p>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground">Review the {aiUnavailable ? "template" : "generated"} layout before creating your page:</p>
            {generatedLayout?.reasoning && (
              <p className="text-[10px] text-muted-foreground font-mono italic">{generatedLayout.reasoning}</p>
            )}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto rounded-lg border border-border p-3">
              {generatedLayout?.rows?.map((row: any, i: number) => (
                <div key={i} className="rounded border border-border p-2 bg-muted/30">
                  <div className="text-[10px] font-mono text-muted-foreground mb-1">Row {i + 1} · {row.columns || 1} column(s)</div>
                  <div className="flex flex-wrap gap-2">
                    {row.widgets?.map((w: any, j: number) => {
                      const Icon = getWidgetIcon(w.type);
                      return (
                        <div key={j} className="flex items-center gap-1.5 bg-background rounded px-2 py-1 text-xs border border-border">
                          <Icon className="h-3 w-3 text-primary/60" />
                          {getWidgetLabel(w.type)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {(!generatedLayout?.rows || generatedLayout.rows.length === 0) && (
                <p className="text-xs text-muted-foreground text-center py-4">No layout generated. You can still create the page and add widgets manually.</p>
              )}
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={onCreatePage} disabled={creating} data-testid="button-wizard-create">
                {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {createProgress || "Create Page"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function WidgetSettingsPanel({ widget, registry, onUpdate, onDelete, saving }: {
  widget: any; registry: Record<string, any>; onUpdate: (data: any) => void; onDelete: () => void; saving: boolean;
}) {
  const def = registry[widget.widgetType];
  const schema = def?.configSchema || [];
  const [localConfig, setLocalConfig] = useState<Record<string, any>>(widget.config || {});

  const handleChange = (key: string, value: any) => {
    const updated = { ...localConfig, [key]: value };
    setLocalConfig(updated);
  };

  const Icon = WIDGET_ICON_MAP[widget.widgetType] || Code;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <div>
          <p className="font-display font-semibold text-sm">{def?.label || widget.widgetType}</p>
          <p className="text-[10px] font-mono text-muted-foreground">{widget.widgetType}</p>
        </div>
      </div>

      {schema.map((field: any) => (
        <div key={field.key} className="space-y-1">
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{field.label}</Label>
          {field.type === "text" && (
            <Input
              value={localConfig[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              data-testid={`input-widget-config-${field.key}`}
            />
          )}
          {field.type === "textarea" && (
            <Textarea
              value={localConfig[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              rows={3}
              data-testid={`input-widget-config-${field.key}`}
            />
          )}
          {field.type === "number" && (
            <Input
              type="number"
              value={localConfig[field.key] || ""}
              onChange={(e) => handleChange(field.key, parseInt(e.target.value) || 0)}
              data-testid={`input-widget-config-${field.key}`}
            />
          )}
          {field.type === "boolean" && (
            <div className="flex items-center gap-2">
              <Switch
                checked={!!localConfig[field.key]}
                onCheckedChange={(checked) => handleChange(field.key, checked)}
                data-testid={`input-widget-config-${field.key}`}
              />
              <span className="text-xs text-muted-foreground">{localConfig[field.key] ? "On" : "Off"}</span>
            </div>
          )}
          {field.type === "select" && field.options && (
            <Select value={String(localConfig[field.key] || "")} onValueChange={(v) => handleChange(field.key, v)}>
              <SelectTrigger data-testid={`input-widget-config-${field.key}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt: string) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={() => onUpdate({ config: localConfig })} disabled={saving} className="flex-1" data-testid="button-save-widget">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete} data-testid="button-delete-widget">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function RowSettingsPanel({ row, onUpdate, onDelete, saving }: {
  row: any; onUpdate: (data: any) => void; onDelete: () => void; saving: boolean;
}) {
  const [columns, setColumns] = useState(row.columns || 1);

  return (
    <div className="space-y-4">
      <p className="font-display font-semibold text-sm">Row Settings</p>
      <div className="space-y-1">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Columns</Label>
        <Select value={String(columns)} onValueChange={(v) => setColumns(parseInt(v))}>
          <SelectTrigger data-testid="input-row-columns">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 Column</SelectItem>
            <SelectItem value="2">2 Columns</SelectItem>
            <SelectItem value="3">3 Columns</SelectItem>
            <SelectItem value="4">4 Columns</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button size="sm" onClick={() => onUpdate({ columns })} disabled={saving} className="flex-1" data-testid="button-save-row">
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Save
        </Button>
        <Button variant="destructive" size="sm" onClick={onDelete} data-testid="button-delete-row">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function PageSettingsPanel({ page, onUpdate, saving }: {
  page: any; onUpdate: (data: any) => void; saving: boolean;
}) {
  const [title, setTitle] = useState(page?.title || "");
  const [slug, setSlug] = useState(page?.slug || "");
  const [seoTitle, setSeoTitle] = useState(page?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(page?.seoDescription || "");

  return (
    <div className="space-y-4">
      <p className="font-display font-semibold text-sm">Page Settings</p>
      <div className="space-y-1">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-page-title" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Slug</Label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" data-testid="input-page-slug" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">SEO Title</Label>
        <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} data-testid="input-page-seo-title" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">SEO Description</Label>
        <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={3} data-testid="input-page-seo-description" />
      </div>
      <Button size="sm" onClick={() => onUpdate({ title, slug, seoTitle, seoDescription })} disabled={saving} className="w-full" data-testid="button-save-page-settings">
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
        Save Page Settings
      </Button>
    </div>
  );
}