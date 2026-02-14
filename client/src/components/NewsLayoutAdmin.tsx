import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Save, Loader2, GripVertical, ChevronUp, ChevronDown,
  Power, Sparkles, Wand2, LayoutGrid, List, Hash, Play, Newspaper,
  Eye, EyeOff, X,
} from "lucide-react";
import type { NewsLayoutSection, Podcast } from "@shared/schema";

async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }
  if (res.status === 204) return null;
  return res.json();
}

const SECTION_TYPE_ICONS: Record<string, React.ReactNode> = {
  hero: <Newspaper className="h-4 w-4" />,
  grid: <LayoutGrid className="h-4 w-4" />,
  list: <List className="h-4 w-4" />,
  numbered_list: <Hash className="h-4 w-4" />,
  carousel: <Play className="h-4 w-4" />,
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  hero: "Hero",
  grid: "Grid",
  list: "List",
  numbered_list: "Numbered List",
  carousel: "Carousel",
};

const CONTENT_RULE_LABELS: Record<string, string> = {
  latest: "Most Recent",
  trending: "Trending",
  editors_pick: "Editor's Picks",
  by_podcast: "By Show",
  video: "Video Content",
};

const LAYOUT_LABELS: Record<string, string> = {
  full_width: "Full Width",
  with_sidebar: "With Sidebar",
};

interface SectionForm {
  name: string;
  sectionType: string;
  contentRule: string;
  maxItems: number;
  showImages: boolean;
  layout: string;
  active: boolean;
  contentFilters: any;
}

const DEFAULT_FORM: SectionForm = {
  name: "",
  sectionType: "list",
  contentRule: "latest",
  maxItems: 6,
  showImages: true,
  layout: "full_width",
  active: true,
  contentFilters: {},
};

export default function NewsLayoutAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SectionForm>(DEFAULT_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<number>>(new Set());

  const { data: sections = [], isLoading } = useQuery<NewsLayoutSection[]>({
    queryKey: ["/api/news-layout-sections"],
    queryFn: () => apiRequest("/api/news-layout-sections"),
  });

  const { data: podcasts = [] } = useQuery<Podcast[]>({
    queryKey: ["/api/podcasts"],
    queryFn: () => apiRequest("/api/podcasts"),
  });

  const sorted = [...sections].sort((a, b) => a.displayOrder - b.displayOrder);

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/news-layout-sections", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news-layout-sections"] });
      toast({ title: "Section Created", description: "New layout section added." });
      closeForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/news-layout-sections/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news-layout-sections"] });
      toast({ title: "Section Updated", description: "Layout section saved." });
      closeForm();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/news-layout-sections/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news-layout-sections"] });
      toast({ title: "Section Deleted" });
      setDeleteConfirm(null);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const smartSuggestMutation = useMutation({
    mutationFn: () => apiRequest("/api/news-layout-sections/smart-suggest", { method: "POST", body: JSON.stringify({}) }),
    onSuccess: (data: any) => {
      setSuggestions(data);
      setAppliedSuggestions(new Set());
      setShowSuggestions(true);
      toast({ title: "AI Suggestions Ready", description: `${data.length} layout sections suggested.` });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(DEFAULT_FORM);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...DEFAULT_FORM, displayOrder: sorted.length } as any);
    setShowForm(true);
  };

  const openEdit = (section: NewsLayoutSection) => {
    setEditingId(section.id);
    setForm({
      name: section.name,
      sectionType: section.sectionType,
      contentRule: section.contentRule,
      maxItems: section.maxItems ?? 6,
      showImages: section.showImages ?? true,
      layout: section.layout ?? "full_width",
      active: section.active,
      contentFilters: section.contentFilters ?? {},
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Validation Error", description: "Section name is required.", variant: "destructive" });
      return;
    }
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...form });
    } else {
      createMutation.mutate({ ...form, displayOrder: sorted.length });
    }
  };

  const moveSection = (id: string, direction: "up" | "down") => {
    const idx = sorted.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;

    const current = sorted[idx];
    const swap = sorted[swapIdx];
    updateMutation.mutate({ id: current.id, displayOrder: swap.displayOrder });
    updateMutation.mutate({ id: swap.id, displayOrder: current.displayOrder });
  };

  const toggleActive = (section: NewsLayoutSection) => {
    updateMutation.mutate({ id: section.id, active: !section.active });
  };

  const applyAllSuggestions = async () => {
    for (const section of sorted) {
      await apiRequest(`/api/news-layout-sections/${section.id}`, { method: "DELETE" });
    }
    for (const s of suggestions) {
      await apiRequest("/api/news-layout-sections", { method: "POST", body: JSON.stringify(s) });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/news-layout-sections"] });
    setAppliedSuggestions(new Set(suggestions.map((_, i) => i)));
    setShowSuggestions(false);
    toast({ title: "Layout Applied", description: "All AI-suggested sections have been created." });
  };

  const applySingleSuggestion = async (index: number) => {
    const s = suggestions[index];
    await apiRequest("/api/news-layout-sections", { method: "POST", body: JSON.stringify({ ...s, displayOrder: sorted.length + index }) });
    queryClient.invalidateQueries({ queryKey: ["/api/news-layout-sections"] });
    setAppliedSuggestions((prev) => new Set(prev).add(index));
    toast({ title: "Section Added", description: `"${s.name}" has been added.` });
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32" data-testid="news-layout-loading">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="news-layout-admin">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-bold text-primary tracking-tight" data-testid="heading-news-layout">
            NEWS LAYOUT SECTIONS
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Configure the sections displayed on the public news page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => smartSuggestMutation.mutate()}
            disabled={smartSuggestMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-primary/30 text-sm text-primary hover:bg-primary/10 transition-colors"
            data-testid="btn-smart-layout"
          >
            {smartSuggestMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI Smart Layout
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            data-testid="btn-add-section"
          >
            <Plus className="h-4 w-4" />
            Add Section
          </button>
        </div>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-5" data-testid="section-ai-suggestions">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-mono uppercase tracking-widest text-primary font-semibold">AI Suggested Layout</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={applyAllSuggestions}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors uppercase tracking-wider"
                data-testid="btn-apply-all-suggestions"
              >
                <Wand2 className="h-3 w-3" />
                Apply All
              </button>
              <button
                onClick={() => setShowSuggestions(false)}
                className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="btn-close-suggestions"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 border transition-colors ${
                  appliedSuggestions.has(i) ? "border-green-500/50 bg-green-500/10" : "border-border bg-card/50"
                }`}
                data-testid={`suggestion-section-${i}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-primary">{SECTION_TYPE_ICONS[s.sectionType] || <LayoutGrid className="h-4 w-4" />}</span>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{s.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {SECTION_TYPE_LABELS[s.sectionType] || s.sectionType}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {CONTENT_RULE_LABELS[s.contentRule] || s.contentRule}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {s.maxItems} items
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => applySingleSuggestion(i)}
                  disabled={appliedSuggestions.has(i)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-all ${
                    appliedSuggestions.has(i)
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : "border-border hover:border-primary/50 text-foreground hover:bg-primary/5"
                  }`}
                  data-testid={`btn-apply-suggestion-${i}`}
                >
                  {appliedSuggestions.has(i) ? "Applied" : "Add"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="border border-primary/30 bg-card/50 p-5" data-testid="section-form">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-mono uppercase tracking-widest text-primary font-semibold">
              {editingId ? "Edit Section" : "Add Section"}
            </h3>
            <button onClick={closeForm} className="p-1.5 text-muted-foreground hover:text-foreground" data-testid="btn-close-form">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. Featured Stories"
                data-testid="input-section-name"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Section Type</label>
              <select
                value={form.sectionType}
                onChange={(e) => setForm({ ...form, sectionType: e.target.value })}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                data-testid="select-section-type"
              >
                <option value="hero">Hero</option>
                <option value="grid">Grid</option>
                <option value="list">List</option>
                <option value="numbered_list">Numbered List</option>
                <option value="carousel">Carousel</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Content Rule</label>
              <select
                value={form.contentRule}
                onChange={(e) => setForm({ ...form, contentRule: e.target.value, contentFilters: e.target.value === "by_podcast" ? form.contentFilters : {} })}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                data-testid="select-content-rule"
              >
                <option value="latest">Most Recent</option>
                <option value="trending">Trending</option>
                <option value="editors_pick">Editor's Picks</option>
                <option value="by_podcast">By Show</option>
                <option value="video">Video Content</option>
              </select>
            </div>

            {form.contentRule === "by_podcast" && (
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Podcast / Show</label>
                <select
                  value={(form.contentFilters as any)?.podcastId || ""}
                  onChange={(e) => setForm({ ...form, contentFilters: { ...form.contentFilters, podcastId: e.target.value } })}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  data-testid="select-podcast"
                >
                  <option value="">Select a show...</option>
                  {podcasts.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Max Items</label>
              <input
                type="number"
                min={1}
                max={50}
                value={form.maxItems}
                onChange={(e) => setForm({ ...form, maxItems: parseInt(e.target.value) || 6 })}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                data-testid="input-max-items"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Layout</label>
              <select
                value={form.layout}
                onChange={(e) => setForm({ ...form, layout: e.target.value })}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                data-testid="select-layout"
              >
                <option value="full_width">Full Width</option>
                <option value="with_sidebar">With Sidebar</option>
              </select>
            </div>

            <div className="flex items-center gap-6 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer" data-testid="checkbox-show-images">
                <input
                  type="checkbox"
                  checked={form.showImages}
                  onChange={(e) => setForm({ ...form, showImages: e.target.checked })}
                  className="accent-primary"
                />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Show Images</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer" data-testid="checkbox-active">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="accent-primary"
                />
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              data-testid="btn-save-section"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editingId ? "Update Section" : "Create Section"}
            </button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="border border-dashed border-border bg-card/30 p-8 text-center" data-testid="empty-sections">
          <LayoutGrid className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No layout sections configured yet.</p>
          <p className="text-xs text-muted-foreground mt-1">Add sections manually or use AI Smart Layout to get started.</p>
        </div>
      ) : (
        <div className="space-y-2" data-testid="sections-list">
          {sorted.map((section, idx) => (
            <div
              key={section.id}
              className={`flex items-center gap-3 p-4 border bg-card/50 transition-colors ${
                section.active ? "border-border" : "border-border/50 opacity-60"
              }`}
              data-testid={`section-card-${section.id}`}
            >
              <div className="flex flex-col gap-1" data-testid={`section-reorder-${section.id}`}>
                <button
                  onClick={() => moveSection(section.id, "up")}
                  disabled={idx === 0}
                  className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  data-testid={`btn-move-up-${section.id}`}
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                <button
                  onClick={() => moveSection(section.id, "down")}
                  disabled={idx === sorted.length - 1}
                  className="p-0.5 text-muted-foreground hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed"
                  data-testid={`btn-move-down-${section.id}`}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              <span className="text-primary">{SECTION_TYPE_ICONS[section.sectionType] || <LayoutGrid className="h-4 w-4" />}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground" data-testid={`text-section-name-${section.id}`}>{section.name}</span>
                  {!section.active && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5">Inactive</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {SECTION_TYPE_LABELS[section.sectionType] || section.sectionType}
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {CONTENT_RULE_LABELS[section.contentRule] || section.contentRule}
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {section.maxItems} items
                  </span>
                  <span className="text-muted-foreground/50">·</span>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    {LAYOUT_LABELS[section.layout ?? "full_width"] || section.layout}
                  </span>
                  {section.showImages ? (
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  ) : (
                    <EyeOff className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleActive(section)}
                  className={`p-2 transition-colors ${section.active ? "text-green-400 hover:text-green-300" : "text-muted-foreground hover:text-foreground"}`}
                  title={section.active ? "Deactivate" : "Activate"}
                  data-testid={`btn-toggle-active-${section.id}`}
                >
                  <Power className="h-4 w-4" />
                </button>
                <button
                  onClick={() => openEdit(section)}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                  title="Edit"
                  data-testid={`btn-edit-section-${section.id}`}
                >
                  <Save className="h-4 w-4" />
                </button>
                {deleteConfirm === section.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => deleteMutation.mutate(section.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white hover:bg-red-600 transition-colors"
                      data-testid={`btn-confirm-delete-${section.id}`}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
                      data-testid={`btn-cancel-delete-${section.id}`}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(section.id)}
                    className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                    title="Delete"
                    data-testid={`btn-delete-section-${section.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
