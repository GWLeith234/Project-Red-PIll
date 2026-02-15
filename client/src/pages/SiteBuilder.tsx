import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
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
  GripVertical,
  Plus,
  Trash2,
  Settings2,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Globe,
  Eye,
  EyeOff,
  ChevronDown,
  Loader2,
  X,
  Columns,
} from "lucide-react";

type WidgetTypeInfo = {
  type: string;
  label: string;
  icon: React.ElementType;
};

const WIDGET_CATEGORIES: { label: string; widgets: WidgetTypeInfo[] }[] = [
  {
    label: "Content",
    widgets: [
      { type: "article_grid", label: "Article Grid", icon: LayoutGrid },
      { type: "article_hero", label: "Article Hero", icon: Star },
      { type: "article_list", label: "Article List", icon: List },
      { type: "article_carousel", label: "Article Carousel", icon: SlidersHorizontal },
      { type: "category_tabs", label: "Category Tabs", icon: Layers },
      { type: "hero_carousel", label: "Hero Carousel", icon: ImageIcon },
      { type: "rich_text", label: "Rich Text Block", icon: Type },
    ],
  },
  {
    label: "Podcast",
    widgets: [
      { type: "network_directory", label: "Network Directory", icon: Radio },
      { type: "podcast_carousel", label: "Podcast Carousel", icon: Mic },
      { type: "episode_feed", label: "Episode Feed", icon: Headphones },
      { type: "player_embed", label: "Player Embed", icon: Play },
      { type: "listen_on_badges", label: "Listen-On Badges", icon: ExternalLink },
      { type: "host_profile", label: "Host Profile", icon: UserCircle },
    ],
  },
  {
    label: "Community",
    widgets: [
      { type: "events_calendar", label: "Events Calendar", icon: Calendar },
      { type: "obituaries", label: "Obituaries", icon: Heart },
      { type: "classifieds", label: "Classifieds", icon: Tag },
      { type: "weather", label: "Weather", icon: Cloud },
      { type: "community_poll", label: "Community Poll", icon: BarChart3 },
      { type: "announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    label: "Commerce",
    widgets: [
      { type: "ad_banner", label: "Ad Banner", icon: RectangleHorizontal },
      { type: "sponsored_content", label: "Sponsored Content", icon: Sparkles },
      { type: "business_directory", label: "Business Directory", icon: Building2 },
      { type: "newsletter_signup", label: "Newsletter Signup", icon: Mail },
      { type: "media_kit_cta", label: "Media Kit CTA", icon: FileText },
    ],
  },
  {
    label: "Utility",
    widgets: [
      { type: "image_block", label: "Image Block", icon: Frame },
      { type: "social_feed", label: "Social Feed", icon: Share2 },
      { type: "divider_spacer", label: "Divider/Spacer", icon: Minus },
      { type: "search_bar", label: "Search Bar", icon: Search },
      { type: "embed", label: "Embed (iframe)", icon: Code },
    ],
  },
];

const ALL_WIDGETS = WIDGET_CATEGORIES.flatMap((c) => c.widgets);

function getWidgetInfo(type: string): WidgetTypeInfo {
  return ALL_WIDGETS.find((w) => w.type === type) || { type, label: type, icon: Code };
}

type PreviewMode = "desktop" | "tablet" | "mobile";

export default function SiteBuilder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [showNewPageDialog, setShowNewPageDialog] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [draggingRowId, setDraggingRowId] = useState<string | null>(null);
  const [rowDropTarget, setRowDropTarget] = useState<string | null>(null);

  const { data: pages = [], isLoading: pagesLoading } = useQuery<any[]>({
    queryKey: ["/api/site-pages"],
  });

  const { data: currentPage, isLoading: pageLoading } = useQuery<any>({
    queryKey: ["/api/site-pages", selectedPageId],
    queryFn: async () => {
      const res = await fetch(`/api/site-pages/${selectedPageId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load page");
      return res.json();
    },
    enabled: !!selectedPageId,
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: { title: string; slug: string }) => {
      const res = await apiRequest("POST", "/api/site-pages", data);
      return res.json();
    },
    onSuccess: (page: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages"] });
      setSelectedPageId(page.id);
      setShowNewPageDialog(false);
      setNewPageTitle("");
      setNewPageSlug("");
      toast({ title: "Page Created", description: `"${page.title}" has been created.` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updatePageMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/site-pages/${selectedPageId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
      toast({ title: "Page Saved" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const publishPageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/site-pages/${selectedPageId}/publish`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
      toast({ title: "Page Published", description: "The page is now live." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addRowMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/site-pages/${selectedPageId}/rows`, { columns: 1 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
      toast({ title: "Row Updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteRowMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/page-rows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
      setSelectedRowId(null);
      toast({ title: "Row Deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const reorderRowsMutation = useMutation({
    mutationFn: async (rowIds: string[]) => {
      const res = await apiRequest("POST", `/api/site-pages/${selectedPageId}/rows/reorder`, { rowIds });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const addWidgetMutation = useMutation({
    mutationFn: async ({ rowId, widgetType }: { rowId: string; widgetType: string }) => {
      const res = await apiRequest("POST", `/api/page-rows/${rowId}/widgets`, { widgetType, config: {} });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
      toast({ title: "Widget Updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteWidgetMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/page-widgets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
      setSelectedWidgetId(null);
      toast({ title: "Widget Removed" });
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
      if (widgetType && selectedPageId) {
        addRowMutation.mutate(undefined, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/site-pages", selectedPageId] });
          },
        });
      }
    },
    [selectedPageId, addRowMutation, queryClient]
  );

  const handleRowDragStart = useCallback((e: React.DragEvent, rowId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/row-id", rowId);
    setDraggingRowId(rowId);
  }, []);

  const handleRowDragOver = useCallback((e: React.DragEvent, rowId: string) => {
    e.preventDefault();
    const draggedRowId = draggingRowId;
    if (draggedRowId && draggedRowId !== rowId) {
      setRowDropTarget(rowId);
    }
    const widgetType = e.dataTransfer.types.includes("application/widget-type");
    if (widgetType) {
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

  const canvasWidth = previewMode === "desktop" ? "100%" : previewMode === "tablet" ? "768px" : "375px";

  return (
    <div className="flex h-[calc(100vh-3.5rem)] lg:h-screen -mx-4 sm:-mx-6 lg:-mx-8 -mb-4 sm:-mb-6 lg:-mb-8 -mt-0 lg:-mt-0" data-testid="page-site-builder">
      <WidgetPalette onDragStart={handleWidgetDragStart} />

      <div className="flex-1 flex flex-col min-w-0">
        <CanvasToolbar
          pages={pages}
          selectedPageId={selectedPageId}
          onSelectPage={setSelectedPageId}
          onNewPage={() => setShowNewPageDialog(true)}
          previewMode={previewMode}
          onPreviewMode={setPreviewMode}
          onSave={() => updatePageMutation.mutate({})}
          onPublish={() => publishPageMutation.mutate()}
          saving={updatePageMutation.isPending}
          publishing={publishPageMutation.isPending}
          pagesLoading={pagesLoading}
        />

        <div className="flex-1 overflow-y-auto bg-background/50 p-4 lg:p-6">
          {!selectedPageId ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Globe className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider mb-2">No Page Selected</p>
              <p className="text-xs text-muted-foreground/70 mb-4">Select a page from the dropdown or create a new one</p>
              <Button variant="outline" size="sm" onClick={() => setShowNewPageDialog(true)} data-testid="button-new-page-empty">
                <Plus className="h-4 w-4 mr-2" /> New Page
              </Button>
            </div>
          ) : pageLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="mx-auto transition-all duration-300" style={{ maxWidth: canvasWidth }}>
              <div className="mb-4">
                <h2 className="text-lg font-display font-bold text-foreground">{currentPage?.title}</h2>
                <p className="text-xs font-mono text-muted-foreground">/{currentPage?.slug}</p>
              </div>

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
                  <CanvasRow
                    key={row.id}
                    row={row}
                    index={index}
                    isSelected={selectedRowId === row.id}
                    selectedWidgetId={selectedWidgetId}
                    isDragOver={dragOverRowId === row.id}
                    isRowDropTarget={rowDropTarget === row.id}
                    isDragging={draggingRowId === row.id}
                    onSelectRow={() => { setSelectedRowId(row.id); setSelectedWidgetId(null); }}
                    onSelectWidget={(wId) => { setSelectedWidgetId(wId); setSelectedRowId(null); }}
                    onDeleteRow={() => deleteRowMutation.mutate(row.id)}
                    onDragOver={(e) => handleRowDragOver(e, row.id)}
                    onDrop={(e) => handleRowDrop(e, row.id)}
                    onRowDragStart={(e) => handleRowDragStart(e, row.id)}
                    onRowDragEnd={() => { setDraggingRowId(null); setRowDropTarget(null); }}
                  />
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

      {(selectedWidget || selectedRow) && (
        <SettingsPanel
          widget={selectedWidget}
          row={selectedRow}
          onUpdateWidget={(data) => {
            if (selectedWidgetId) updateWidgetMutation.mutate({ id: selectedWidgetId, data });
          }}
          onDeleteWidget={() => {
            if (selectedWidgetId) deleteWidgetMutation.mutate(selectedWidgetId);
          }}
          onUpdateRow={(data) => {
            if (selectedRowId) updateRowMutation.mutate({ id: selectedRowId, data });
          }}
          onClose={() => { setSelectedWidgetId(null); setSelectedRowId(null); }}
          saving={updateWidgetMutation.isPending || updateRowMutation.isPending}
        />
      )}

      <Dialog open={showNewPageDialog} onOpenChange={setShowNewPageDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Create New Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Page Title</Label>
              <Input
                value={newPageTitle}
                onChange={(e) => {
                  setNewPageTitle(e.target.value);
                  setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                }}
                placeholder="e.g. Homepage"
                data-testid="input-new-page-title"
              />
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Slug</Label>
              <Input
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value)}
                placeholder="e.g. homepage"
                data-testid="input-new-page-slug"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPageDialog(false)}>Cancel</Button>
            <Button
              onClick={() => createPageMutation.mutate({ title: newPageTitle, slug: newPageSlug })}
              disabled={createPageMutation.isPending || !newPageTitle.trim()}
              data-testid="button-new-page"
            >
              {createPageMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function WidgetPalette({ onDragStart }: { onDragStart: (e: React.DragEvent, type: string) => void }) {
  return (
    <div className="hidden lg:flex w-64 flex-col border-r border-border bg-card/50 shrink-0">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">Widgets</h2>
      </div>
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={WIDGET_CATEGORIES.map((c) => c.label)} className="px-2 py-2">
          {WIDGET_CATEGORIES.map((cat) => (
            <AccordionItem key={cat.label} value={cat.label} className="border-b-0">
              <AccordionTrigger className="text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground py-2 px-2">
                {cat.label}
              </AccordionTrigger>
              <AccordionContent className="pb-2">
                <div className="space-y-1">
                  {cat.widgets.map((w) => (
                    <div
                      key={w.type}
                      draggable
                      onDragStart={(e) => onDragStart(e, w.type)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-sm text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors"
                      data-testid={`palette-widget-${w.type}`}
                    >
                      <w.icon className="h-4 w-4 shrink-0 text-primary/60" />
                      <span className="truncate">{w.label}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
}

function CanvasToolbar({
  pages,
  selectedPageId,
  onSelectPage,
  onNewPage,
  previewMode,
  onPreviewMode,
  onSave,
  onPublish,
  saving,
  publishing,
  pagesLoading,
}: {
  pages: any[];
  selectedPageId: string | null;
  onSelectPage: (id: string | null) => void;
  onNewPage: () => void;
  previewMode: PreviewMode;
  onPreviewMode: (m: PreviewMode) => void;
  onSave: () => void;
  onPublish: () => void;
  saving: boolean;
  publishing: boolean;
  pagesLoading: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/80 flex-wrap">
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <Select
          value={selectedPageId || ""}
          onValueChange={(v) => onSelectPage(v || null)}
        >
          <SelectTrigger className="w-[200px] h-8 text-xs" data-testid="select-page">
            <SelectValue placeholder={pagesLoading ? "Loading..." : "Select a page"} />
          </SelectTrigger>
          <SelectContent>
            {pages.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onNewPage} data-testid="button-new-page">
          <Plus className="h-3.5 w-3.5 mr-1" /> New Page
        </Button>
      </div>

      <div className="flex items-center gap-1 border border-border rounded-sm p-0.5">
        {([
          { mode: "desktop" as const, icon: Monitor },
          { mode: "tablet" as const, icon: Tablet },
          { mode: "mobile" as const, icon: Smartphone },
        ]).map(({ mode, icon: Icon }) => (
          <button
            key={mode}
            onClick={() => onPreviewMode(mode)}
            className={cn(
              "p-1.5 rounded-sm transition-colors",
              previewMode === mode ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
            data-testid={`button-preview-${mode}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={onSave}
          disabled={saving || !selectedPageId}
          data-testid="button-save-page"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Save
        </Button>
        <Button
          size="sm"
          className="h-8 text-xs"
          onClick={onPublish}
          disabled={publishing || !selectedPageId}
          data-testid="button-publish-page"
        >
          {publishing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Globe className="h-3.5 w-3.5 mr-1" />}
          Publish
        </Button>
      </div>
    </div>
  );
}

function CanvasRow({
  row,
  index,
  isSelected,
  selectedWidgetId,
  isDragOver,
  isRowDropTarget,
  isDragging,
  onSelectRow,
  onSelectWidget,
  onDeleteRow,
  onDragOver,
  onDrop,
  onRowDragStart,
  onRowDragEnd,
}: {
  row: any;
  index: number;
  isSelected: boolean;
  selectedWidgetId: string | null;
  isDragOver: boolean;
  isRowDropTarget: boolean;
  isDragging: boolean;
  onSelectRow: () => void;
  onSelectWidget: (id: string) => void;
  onDeleteRow: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRowDragStart: (e: React.DragEvent) => void;
  onRowDragEnd: () => void;
}) {
  const widgets = row.widgets || [];
  const colCount = row.columns || 1;

  return (
    <div
      className={cn(
        "border rounded-lg transition-all group",
        isSelected ? "border-primary/50 bg-primary/5" : "border-border/40 bg-card/30",
        isDragOver && "border-primary/40 bg-primary/10",
        isRowDropTarget && "border-blue-500/40 border-t-2",
        isDragging && "opacity-40"
      )}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={() => {}}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
        <div
          draggable
          onDragStart={onRowDragStart}
          onDragEnd={onRowDragEnd}
          className="text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </div>
        <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5 border-border/40">
          <Columns className="h-2.5 w-2.5 mr-1" />
          {colCount} col{colCount > 1 ? "s" : ""}
        </Badge>
        <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5 border-border/40">
          Row {index + 1}
        </Badge>
        {!row.visible && (
          <Badge variant="outline" className="text-[10px] font-mono h-5 px-1.5 border-amber-500/30 text-amber-400">
            <EyeOff className="h-2.5 w-2.5 mr-1" /> Hidden
          </Badge>
        )}
        <div className="flex-1" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onSelectRow(); }}
        >
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
          onClick={(e) => { e.stopPropagation(); onDeleteRow(); }}
          data-testid={`button-delete-row-${row.id}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div
        className={cn(
          "p-3 min-h-[60px]",
          isDragOver && "bg-primary/5"
        )}
        onClick={onSelectRow}
      >
        {widgets.length > 0 ? (
          <div className={cn("grid gap-2", `grid-cols-${Math.min(colCount, 4)}`)}>
            {widgets.map((widget: any) => {
              const info = getWidgetInfo(widget.widgetType);
              const Icon = info.icon;
              return (
                <Card
                  key={widget.id}
                  className={cn(
                    "cursor-pointer transition-all hover:border-primary/30",
                    selectedWidgetId === widget.id ? "border-primary ring-1 ring-primary/20" : "border-border/30"
                  )}
                  onClick={(e) => { e.stopPropagation(); onSelectWidget(widget.id); }}
                  data-testid={`widget-card-${widget.id}`}
                >
                  <CardContent className="p-3 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary/60 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{widget.titleOverride || info.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{info.type}</p>
                    </div>
                    {!widget.visible && <EyeOff className="h-3 w-3 text-amber-400 shrink-0" />}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 text-muted-foreground/30">
            <p className="text-xs font-mono">Drop widgets here</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsPanel({
  widget,
  row,
  onUpdateWidget,
  onDeleteWidget,
  onUpdateRow,
  onClose,
  saving,
}: {
  widget: any;
  row: any;
  onUpdateWidget: (data: any) => void;
  onDeleteWidget: () => void;
  onUpdateRow: (data: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  if (widget) {
    return (
      <WidgetSettings
        widget={widget}
        onUpdate={onUpdateWidget}
        onDelete={onDeleteWidget}
        onClose={onClose}
        saving={saving}
      />
    );
  }
  if (row) {
    return (
      <RowSettings
        row={row}
        onUpdate={onUpdateRow}
        onClose={onClose}
        saving={saving}
      />
    );
  }
  return null;
}

function WidgetSettings({
  widget,
  onUpdate,
  onDelete,
  onClose,
  saving,
}: {
  widget: any;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onClose: () => void;
  saving: boolean;
}) {
  const info = getWidgetInfo(widget.widgetType);
  const Icon = info.icon;
  const [config, setConfig] = useState<any>(widget.config || {});
  const [titleOverride, setTitleOverride] = useState(widget.titleOverride || "");
  const [visible, setVisible] = useState(widget.visible !== false);
  const [jsonConfig, setJsonConfig] = useState(JSON.stringify(widget.config || {}, null, 2));
  const prevWidgetId = useRef(widget.id);

  if (prevWidgetId.current !== widget.id) {
    prevWidgetId.current = widget.id;
    setConfig(widget.config || {});
    setTitleOverride(widget.titleOverride || "");
    setVisible(widget.visible !== false);
    setJsonConfig(JSON.stringify(widget.config || {}, null, 2));
  }

  const handleSave = () => {
    let finalConfig = config;
    if (!hasSpecificSettings(widget.widgetType)) {
      try { finalConfig = JSON.parse(jsonConfig); } catch { finalConfig = config; }
    }
    onUpdate({ config: finalConfig, titleOverride: titleOverride || null, visible });
  };

  return (
    <div className="hidden lg:flex w-80 flex-col border-l border-border bg-card/50 shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">{info.label}</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <WidgetConfigFields
            widgetType={widget.widgetType}
            config={config}
            setConfig={setConfig}
            jsonConfig={jsonConfig}
            setJsonConfig={setJsonConfig}
          />

          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Title Override</Label>
            <Input
              value={titleOverride}
              onChange={(e) => setTitleOverride(e.target.value)}
              placeholder={info.label}
              className="mt-1"
              data-testid="input-widget-config-title"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Visible</Label>
            <Switch checked={visible} onCheckedChange={setVisible} data-testid="toggle-widget-visible" />
          </div>

          <Button size="sm" className="w-full" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Apply Changes
          </Button>

          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={onDelete}
            data-testid={`button-delete-widget-${widget.id}`}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove Widget
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

function hasSpecificSettings(type: string): boolean {
  return ["article_grid", "article_hero", "episode_feed", "ad_banner", "rich_text", "newsletter_signup"].includes(type);
}

function WidgetConfigFields({
  widgetType,
  config,
  setConfig,
  jsonConfig,
  setJsonConfig,
}: {
  widgetType: string;
  config: any;
  setConfig: (c: any) => void;
  jsonConfig: string;
  setJsonConfig: (s: string) => void;
}) {
  const update = (key: string, val: any) => setConfig({ ...config, [key]: val });

  switch (widgetType) {
    case "article_grid":
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Max Items</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={config.maxItems || 6}
              onChange={(e) => update("maxItems", parseInt(e.target.value) || 6)}
              className="mt-1"
              data-testid="input-widget-config-maxItems"
            />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Columns</Label>
            <Select value={String(config.columns || 3)} onValueChange={(v) => update("columns", parseInt(v))}>
              <SelectTrigger className="mt-1" data-testid="input-widget-config-columns">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Content Rule</Label>
            <Select value={config.contentRule || "latest"} onValueChange={(v) => update("contentRule", v)}>
              <SelectTrigger className="mt-1" data-testid="input-widget-config-contentRule">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="editors_pick">Editor's Pick</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Show Images</Label>
            <Switch checked={config.showImages !== false} onCheckedChange={(v) => update("showImages", v)} data-testid="input-widget-config-showImages" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Show Summary</Label>
            <Switch checked={config.showSummary !== false} onCheckedChange={(v) => update("showSummary", v)} data-testid="input-widget-config-showSummary" />
          </div>
        </div>
      );

    case "article_hero":
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Article Source</Label>
            <Select value={config.articleSource || "latest"} onValueChange={(v) => update("articleSource", v)}>
              <SelectTrigger className="mt-1" data-testid="input-widget-config-articleSource">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="pinned">Pinned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Show Category</Label>
            <Switch checked={config.showCategory !== false} onCheckedChange={(v) => update("showCategory", v)} data-testid="input-widget-config-showCategory" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Show Author</Label>
            <Switch checked={config.showAuthor !== false} onCheckedChange={(v) => update("showAuthor", v)} data-testid="input-widget-config-showAuthor" />
          </div>
        </div>
      );

    case "episode_feed":
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Podcast Filter</Label>
            <Input
              value={config.podcastFilter || ""}
              onChange={(e) => update("podcastFilter", e.target.value)}
              placeholder="Podcast ID (optional)"
              className="mt-1"
              data-testid="input-widget-config-podcastFilter"
            />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Max Items</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={config.maxItems || 10}
              onChange={(e) => update("maxItems", parseInt(e.target.value) || 10)}
              className="mt-1"
              data-testid="input-widget-config-maxItems"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Show Description</Label>
            <Switch checked={config.showDescription !== false} onCheckedChange={(v) => update("showDescription", v)} data-testid="input-widget-config-showDescription" />
          </div>
        </div>
      );

    case "ad_banner":
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Placement</Label>
            <Select value={config.placement || "leaderboard"} onValueChange={(v) => update("placement", v)}>
              <SelectTrigger className="mt-1" data-testid="input-widget-config-placement">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="leaderboard">Leaderboard</SelectItem>
                <SelectItem value="rectangle">Rectangle</SelectItem>
                <SelectItem value="skyscraper">Skyscraper</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Size</Label>
            <Input
              value={config.size || ""}
              onChange={(e) => update("size", e.target.value)}
              placeholder="e.g. 728x90"
              className="mt-1"
              data-testid="input-widget-config-size"
            />
          </div>
        </div>
      );

    case "rich_text":
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Content</Label>
            <Textarea
              value={config.content || ""}
              onChange={(e) => update("content", e.target.value)}
              placeholder="Enter rich text content..."
              className="mt-1 min-h-[120px]"
              data-testid="input-widget-config-content"
            />
          </div>
        </div>
      );

    case "newsletter_signup":
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Style</Label>
            <Select value={config.style || "inline"} onValueChange={(v) => update("style", v)}>
              <SelectTrigger className="mt-1" data-testid="input-widget-config-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inline">Inline</SelectItem>
                <SelectItem value="banner">Banner</SelectItem>
                <SelectItem value="popup">Popup</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Button Text</Label>
            <Input
              value={config.buttonText || "Subscribe"}
              onChange={(e) => update("buttonText", e.target.value)}
              className="mt-1"
              data-testid="input-widget-config-buttonText"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Show Name Field</Label>
            <Switch checked={config.showNameField === true} onCheckedChange={(v) => update("showNameField", v)} data-testid="input-widget-config-showNameField" />
          </div>
        </div>
      );

    default:
      return (
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Config (JSON)</Label>
            <Textarea
              value={jsonConfig}
              onChange={(e) => setJsonConfig(e.target.value)}
              className="mt-1 min-h-[120px] font-mono text-xs"
              data-testid="input-widget-config-json"
            />
          </div>
        </div>
      );
  }
}

function RowSettings({
  row,
  onUpdate,
  onClose,
  saving,
}: {
  row: any;
  onUpdate: (data: any) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [columns, setColumns] = useState(String(row.columns || 1));
  const [bgColor, setBgColor] = useState(row.config?.backgroundColor || "");
  const [paddingTop, setPaddingTop] = useState(row.config?.paddingTop || 0);
  const [paddingBottom, setPaddingBottom] = useState(row.config?.paddingBottom || 0);
  const [deviceVisibility, setDeviceVisibility] = useState(row.config?.deviceVisibility || "all");
  const [visible, setVisible] = useState(row.visible !== false);
  const prevRowId = useRef(row.id);

  if (prevRowId.current !== row.id) {
    prevRowId.current = row.id;
    setColumns(String(row.columns || 1));
    setBgColor(row.config?.backgroundColor || "");
    setPaddingTop(row.config?.paddingTop || 0);
    setPaddingBottom(row.config?.paddingBottom || 0);
    setDeviceVisibility(row.config?.deviceVisibility || "all");
    setVisible(row.visible !== false);
  }

  const handleSave = () => {
    onUpdate({
      columns: parseInt(columns),
      visible,
      config: {
        backgroundColor: bgColor || null,
        paddingTop,
        paddingBottom,
        deviceVisibility,
      },
    });
  };

  return (
    <div className="hidden lg:flex w-80 flex-col border-l border-border bg-card/50 shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Columns className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-primary font-semibold">Row Settings</h3>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Column Count</Label>
            <Select value={columns} onValueChange={setColumns}>
              <SelectTrigger className="mt-1" data-testid="input-row-columns">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} Column{n > 1 ? "s" : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Background Color</Label>
            <Input
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              placeholder="e.g. #1a1a1a or transparent"
              className="mt-1"
              data-testid="input-row-bg-color"
            />
          </div>

          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Padding Top (px)</Label>
            <Input
              type="number"
              min={0}
              value={paddingTop}
              onChange={(e) => setPaddingTop(parseInt(e.target.value) || 0)}
              className="mt-1"
              data-testid="input-row-padding-top"
            />
          </div>

          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Padding Bottom (px)</Label>
            <Input
              type="number"
              min={0}
              value={paddingBottom}
              onChange={(e) => setPaddingBottom(parseInt(e.target.value) || 0)}
              className="mt-1"
              data-testid="input-row-padding-bottom"
            />
          </div>

          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Device Visibility</Label>
            <Select value={deviceVisibility} onValueChange={setDeviceVisibility}>
              <SelectTrigger className="mt-1" data-testid="input-row-device-visibility">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                <SelectItem value="desktop">Desktop Only</SelectItem>
                <SelectItem value="mobile">Mobile Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Visible</Label>
            <Switch checked={visible} onCheckedChange={setVisible} data-testid="toggle-row-visible" />
          </div>

          <Button size="sm" className="w-full" onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Apply Changes
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}
