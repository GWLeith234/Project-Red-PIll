import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBranding, useUpdateBranding } from "@/lib/api";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Palette, Type, Save, Eye, Loader2, Trash2, X, Globe, Wand2, Check, Sparkles, ArrowRight, Plus, GripVertical, Power, ExternalLink, Layers } from "lucide-react";
import { SortableList } from "@/components/ui/sortable-list";
import type { Branding, HeroSlide } from "@shared/schema";
import NewsLayoutAdmin from "@/components/NewsLayoutAdmin";

function UploadZone({
  label,
  description,
  currentUrl,
  accept,
  onUpload,
  onClear,
  previewHeight,
  testId,
}: {
  label: string;
  description: string;
  currentUrl?: string | null;
  accept: string;
  onUpload: (objectPath: string) => void;
  onClear: () => void;
  previewHeight?: string;
  testId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      onUpload(response.objectPath);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="border border-border bg-card/50 p-5" data-testid={testId}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-primary font-display uppercase tracking-wider">{label}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
        {currentUrl && (
          <button
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
            data-testid={`btn-clear-${testId}`}
          >
            <Trash2 className="h-3 w-3" />
            Remove
          </button>
        )}
      </div>

      {currentUrl ? (
        <div className="relative border border-border/50 bg-background/50 p-2 mb-3 flex items-center justify-center" style={{ minHeight: previewHeight || "80px" }}>
          <img
            src={currentUrl}
            alt={label}
            className="max-h-24 max-w-full object-contain"
            data-testid={`img-preview-${testId}`}
          />
        </div>
      ) : null}

      <label
        className="flex items-center justify-center gap-2 border border-dashed border-muted-foreground/30 py-3 px-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm text-muted-foreground hover:text-primary"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Uploading... {progress}%
          </>
        ) : (
          <>
            <Upload className="h-4 w-4" />
            {currentUrl ? "Replace File" : "Upload File"}
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading}
          data-testid={`input-file-${testId}`}
        />
      </label>
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center gap-3" data-testid={testId}>
      <div
        className="h-10 w-10 border border-border flex-shrink-0 cursor-pointer relative overflow-hidden"
        style={{ backgroundColor: value }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          data-testid={`input-color-${testId}`}
        />
      </div>
      <div className="flex-1">
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-background border border-border px-3 py-1.5 text-sm text-foreground font-mono mt-1 focus:outline-none focus:border-primary"
          data-testid={`input-text-color-${testId}`}
        />
      </div>
    </div>
  );
}

interface WebsiteAnalysis {
  companyName: string | null;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  colors: string[];
  suggestedPrimary: string;
  suggestedAccent: string;
  sourceUrl: string;
}

function SuggestionChip({ label, value, onApply, applied, testId }: {
  label: string;
  value: string;
  onApply: () => void;
  applied?: boolean;
  testId: string;
}) {
  return (
    <button
      onClick={onApply}
      disabled={applied}
      className={`flex items-center gap-2 px-3 py-2 border text-left text-sm transition-all ${
        applied
          ? "border-green-500/50 bg-green-500/10 text-green-400"
          : "border-border hover:border-primary/50 hover:bg-primary/5 text-foreground"
      }`}
      data-testid={testId}
    >
      <div className="flex-1 min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block">{label}</span>
        <span className="block truncate">{value}</span>
      </div>
      {applied ? (
        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
  );
}

function ColorSuggestion({ color, label, onApply, applied, testId }: {
  color: string;
  label: string;
  onApply: () => void;
  applied?: boolean;
  testId: string;
}) {
  return (
    <button
      onClick={onApply}
      className={`flex items-center gap-2.5 px-3 py-2 border transition-all ${
        applied
          ? "border-green-500/50 bg-green-500/10"
          : "border-border hover:border-primary/50 hover:bg-primary/5"
      }`}
      data-testid={testId}
    >
      <div className="h-8 w-8 border border-white/20 flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="text-left min-w-0">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block">{label}</span>
        <span className="text-sm font-mono text-foreground">{color}</span>
      </div>
      {applied ? (
        <Check className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto" />
      ) : (
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 ml-auto" />
      )}
    </button>
  );
}

export default function Customize() {
  const { data: branding, isLoading } = useBranding();
  const updateBranding = useUpdateBranding();
  const { toast } = useToast();

  const [form, setForm] = useState({
    companyName: "MediaTech Empire",
    tagline: "AI-Powered Media Platform",
    logoUrl: "" as string | null,
    faviconUrl: "" as string | null,
    bannerUrl: "" as string | null,
    primaryColor: "#E5C100",
    accentColor: "#22C55E",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (branding) {
      setForm({
        companyName: branding.companyName || "MediaTech Empire",
        tagline: branding.tagline || "AI-Powered Media Platform",
        logoUrl: branding.logoUrl || null,
        faviconUrl: branding.faviconUrl || null,
        bannerUrl: branding.bannerUrl || null,
        primaryColor: branding.primaryColor || "#E5C100",
        accentColor: branding.accentColor || "#22C55E",
      });
    }
  }, [branding]);

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) return;
    setAnalyzing(true);
    setAnalysis(null);
    setAppliedFields(new Set());
    try {
      const res = await fetch("/api/branding/analyze-website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Analysis failed" }));
        throw new Error(err.message);
      }
      const data = await res.json();
      setAnalysis(data);
      toast({ title: "Website Analyzed", description: "Smart suggestions are ready. Click any suggestion to apply it." });
    } catch (err: any) {
      toast({ title: "Analysis Failed", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const applyField = (field: string, value: any) => {
    setForm(f => ({ ...f, [field]: value }));
    setAppliedFields(prev => new Set(prev).add(field));
  };

  const applyAll = () => {
    if (!analysis) return;
    const updates: any = {};
    if (analysis.companyName) updates.companyName = analysis.companyName;
    if (analysis.tagline) updates.tagline = analysis.tagline;
    if (analysis.logoUrl) updates.logoUrl = analysis.logoUrl;
    if (analysis.faviconUrl) updates.faviconUrl = analysis.faviconUrl;
    updates.primaryColor = analysis.suggestedPrimary;
    updates.accentColor = analysis.suggestedAccent;
    setForm(f => ({ ...f, ...updates }));
    setAppliedFields(new Set(["companyName", "tagline", "logoUrl", "faviconUrl", "primaryColor", "accentColor"]));
    toast({ title: "All Suggestions Applied", description: "Review the changes and save when ready." });
  };

  const handleSave = () => {
    updateBranding.mutate(form, {
      onSuccess: () => {
        toast({ title: "Branding Updated", description: "Your changes have been saved." });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="page-customize">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary tracking-tight" data-testid="heading-customize">
            CUSTOMIZE BRANDING
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your platform's logo, favicon, banner, colors, and identity
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
            data-testid="btn-toggle-preview"
          >
            {showPreview ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Close Preview" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={updateBranding.isPending}
            className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="btn-save-branding"
          >
            {updateBranding.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </button>
        </div>
      </div>

      <div className="border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-5" data-testid="section-smart-analyzer">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary font-semibold">Smart Brand Analyzer</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Enter your company website and we'll automatically extract your brand colors, logo, name, and tagline
        </p>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="e.g. apple.com or https://yourcompany.com"
              className="w-full bg-background border border-border pl-10 pr-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
              data-testid="input-website-url"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !websiteUrl.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="button-analyze-website"
          >
            {analyzing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Analyze
              </>
            )}
          </button>
        </div>

        {analysis && (
          <div className="mt-5 space-y-4" data-testid="section-analysis-results">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                Suggestions from <span className="text-foreground">{analysis.sourceUrl}</span>
              </p>
              <button
                onClick={applyAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 transition-colors uppercase tracking-wider"
                data-testid="button-apply-all"
              >
                <Wand2 className="h-3 w-3" />
                Apply All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysis.companyName && (
                <SuggestionChip
                  label="Company Name"
                  value={analysis.companyName}
                  onApply={() => applyField("companyName", analysis.companyName)}
                  applied={appliedFields.has("companyName")}
                  testId="suggestion-company-name"
                />
              )}
              {analysis.tagline && (
                <SuggestionChip
                  label="Tagline"
                  value={analysis.tagline}
                  onApply={() => applyField("tagline", analysis.tagline)}
                  applied={appliedFields.has("tagline")}
                  testId="suggestion-tagline"
                />
              )}
            </div>

            {analysis.logoUrl && (
              <div className="flex items-center gap-3 border border-border p-3" data-testid="suggestion-logo">
                <div className="h-12 w-20 border border-border/50 bg-background flex items-center justify-center p-1 flex-shrink-0">
                  <img src={analysis.logoUrl} alt="Detected logo" className="max-h-10 max-w-full object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block">Detected Logo</span>
                  <span className="text-xs text-foreground truncate block">{analysis.logoUrl}</span>
                </div>
                <button
                  onClick={() => applyField("logoUrl", analysis.logoUrl)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-all flex-shrink-0 ${
                    appliedFields.has("logoUrl")
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : "border-border hover:border-primary/50 text-foreground"
                  }`}
                  data-testid="button-apply-logo"
                >
                  {appliedFields.has("logoUrl") ? <Check className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                  {appliedFields.has("logoUrl") ? "Applied" : "Use Logo"}
                </button>
              </div>
            )}

            {analysis.colors.length > 0 && (
              <div data-testid="suggestion-colors">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-2">Detected Brand Colors</span>
                <div className="flex gap-2 mb-3 flex-wrap">
                  {analysis.colors.map((color, i) => (
                    <div
                      key={i}
                      className="h-10 w-10 border border-white/10 cursor-pointer hover:scale-110 transition-transform relative group"
                      style={{ backgroundColor: color }}
                      title={color}
                      data-testid={`color-swatch-${i}`}
                    >
                      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {color}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <ColorSuggestion
                    color={analysis.suggestedPrimary}
                    label="Suggested Primary"
                    onApply={() => applyField("primaryColor", analysis.suggestedPrimary)}
                    applied={appliedFields.has("primaryColor")}
                    testId="suggestion-primary-color"
                  />
                  <ColorSuggestion
                    color={analysis.suggestedAccent}
                    label="Suggested Accent"
                    onApply={() => applyField("accentColor", analysis.suggestedAccent)}
                    applied={appliedFields.has("accentColor")}
                    testId="suggestion-accent-color"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showPreview && (
        <div className="border border-primary/30 bg-card/80 backdrop-blur-sm p-6 space-y-4" data-testid="section-preview">
          <h2 className="text-xs font-mono uppercase tracking-widest text-primary mb-4">Live Preview</h2>
          <div className="bg-background border border-border p-4">
            <div className="flex items-center gap-4 mb-4">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="Logo" className="h-10 max-w-[200px] object-contain" />
              ) : (
                <div className="h-10 w-40 border border-dashed border-muted-foreground/30 flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">Logo Area</span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-display font-bold" style={{ color: form.primaryColor }}>
                  {form.companyName}
                </h3>
                <p className="text-xs text-muted-foreground">{form.tagline}</p>
              </div>
            </div>
            {form.bannerUrl && (
              <div className="border border-border overflow-hidden mb-3">
                <img src={form.bannerUrl} alt="Banner" className="w-full h-32 object-cover" />
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <div className="h-8 px-4 flex items-center text-xs font-semibold" style={{ backgroundColor: form.primaryColor, color: "#000" }}>
                Primary Button
              </div>
              <div className="h-8 px-4 flex items-center text-xs font-semibold" style={{ backgroundColor: form.accentColor, color: "#fff" }}>
                Accent Button
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="border border-border bg-card/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Type className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">Identity</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  data-testid="input-company-name"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">
                  Tagline
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  data-testid="input-tagline"
                />
              </div>
            </div>
          </div>

          <div className="border border-border bg-card/30 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-mono uppercase tracking-widest text-primary">Color Scheme</h2>
            </div>
            <div className="space-y-4">
              <ColorInput
                label="Primary / Gold"
                value={form.primaryColor}
                onChange={(v) => setForm({ ...form, primaryColor: v })}
                testId="color-primary"
              />
              <ColorInput
                label="Accent / Success"
                value={form.accentColor}
                onChange={(v) => setForm({ ...form, accentColor: v })}
                testId="color-accent"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <UploadZone
            label="Logo"
            description="Recommended: SVG or PNG with transparent background, max 400×100px"
            currentUrl={form.logoUrl}
            accept="image/*"
            onUpload={(path) => setForm({ ...form, logoUrl: path })}
            onClear={() => setForm({ ...form, logoUrl: null })}
            previewHeight="60px"
            testId="upload-logo"
          />

          <UploadZone
            label="Favicon"
            description="Square image, 32×32 or 64×64 pixels, PNG or ICO"
            currentUrl={form.faviconUrl}
            accept="image/*,.ico"
            onUpload={(path) => setForm({ ...form, faviconUrl: path })}
            onClear={() => setForm({ ...form, faviconUrl: null })}
            previewHeight="48px"
            testId="upload-favicon"
          />

          <UploadZone
            label="Banner"
            description="Wide banner image for your news pages, recommended 1200×300px"
            currentUrl={form.bannerUrl}
            accept="image/*"
            onUpload={(path) => setForm({ ...form, bannerUrl: path })}
            onClear={() => setForm({ ...form, bannerUrl: null })}
            previewHeight="100px"
            testId="upload-banner"
          />
        </div>
      </div>

      <HeroCarouselManager />

      <NewsLayoutAdmin />
    </div>
  );
}

function HeroCarouselManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: slides = [], isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/hero-slides"],
    queryFn: async () => {
      const res = await fetch("/api/hero-slides", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load hero slides");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/hero-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create slide");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
      toast({ title: "Slide Added", description: "New hero slide has been created." });
      setShowAddForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/hero-slides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update slide");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hero-slides/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete slide");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-slides"] });
      toast({ title: "Slide Deleted" });
    },
  });

  const handleDragReorder = (reordered: HeroSlide[]) => {
    reordered.forEach((slide, idx) => {
      if (slide.displayOrder !== idx) {
        updateMutation.mutate({ id: slide.id, data: { displayOrder: idx } });
      }
    });
  };

  return (
    <div className="border border-primary/30 bg-card/30 p-5" data-testid="section-hero-carousel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary font-semibold">Hero Carousel</h2>
          <span className="text-xs text-muted-foreground ml-2">({slides.length} slides)</span>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          data-testid="btn-add-hero-slide"
        >
          <Plus className="h-4 w-4" />
          Add Slide
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-5">
        Full-width hero images that rotate on your public homepage. Recommended size: 1920x600px or wider. Use high-quality images for best results.
      </p>

      {showAddForm && (
        <HeroSlideForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowAddForm(false)}
          isPending={createMutation.isPending}
          nextOrder={slides.length}
        />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : slides.length === 0 && !showAddForm ? (
        <div className="text-center py-10 border border-dashed border-muted-foreground/20">
          <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No hero slides yet. Add your first slide to create a carousel on the public homepage.</p>
        </div>
      ) : (
        <SortableList
          items={[...slides].sort((a, b) => a.displayOrder - b.displayOrder)}
          onReorder={handleDragReorder}
          renderItem={(slide, idx) => (
            <div>
              {editingId === slide.id ? (
                <HeroSlideForm
                  slide={slide}
                  onSubmit={(data) => {
                    updateMutation.mutate({ id: slide.id, data }, {
                      onSuccess: () => {
                        setEditingId(null);
                        toast({ title: "Slide Updated" });
                      },
                    });
                  }}
                  onCancel={() => setEditingId(null)}
                  isPending={updateMutation.isPending}
                  nextOrder={slide.displayOrder}
                />
              ) : (
                <div
                  className={`flex items-center gap-4 border p-3 transition-all ${
                    slide.active ? "border-border bg-card/50" : "border-border/50 bg-card/20 opacity-60"
                  }`}
                  data-testid={`hero-slide-${slide.id}`}
                >
                  <div className="w-40 h-20 flex-shrink-0 border border-border/50 overflow-hidden bg-background">
                    <img src={slide.imageUrl} alt={slide.title || ""} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">#{idx + 1}</span>
                      {!slide.active && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider font-mono">
                          Hidden
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate mt-1">{slide.title || "(No title)"}</h3>
                    {slide.subtitle && <p className="text-xs text-muted-foreground truncate">{slide.subtitle}</p>}
                    {slide.linkUrl && (
                      <p className="text-xs text-primary/70 truncate flex items-center gap-1 mt-0.5">
                        <ExternalLink className="h-3 w-3" />
                        {slide.linkText || slide.linkUrl}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateMutation.mutate({ id: slide.id, data: { active: !slide.active } })}
                      className={`p-2 border transition-all ${
                        slide.active
                          ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                          : "border-border text-muted-foreground hover:border-primary/30"
                      }`}
                      title={slide.active ? "Disable slide" : "Enable slide"}
                      data-testid={`btn-toggle-${slide.id}`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(slide.id)}
                      className="p-2 border border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
                      title="Edit slide"
                      data-testid={`btn-edit-${slide.id}`}
                    >
                      <Type className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Delete this hero slide?")) deleteMutation.mutate(slide.id);
                      }}
                      className="p-2 border border-border text-muted-foreground hover:border-red-500/30 hover:text-red-400 transition-all"
                      title="Delete slide"
                      data-testid={`btn-delete-${slide.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}

function HeroSlideForm({
  slide,
  onSubmit,
  onCancel,
  isPending,
  nextOrder,
}: {
  slide?: HeroSlide;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isPending: boolean;
  nextOrder: number;
}) {
  const [form, setForm] = useState({
    imageUrl: slide?.imageUrl || "",
    title: slide?.title || "",
    subtitle: slide?.subtitle || "",
    linkUrl: slide?.linkUrl || "",
    linkText: slide?.linkText || "",
    displayOrder: slide?.displayOrder ?? nextOrder,
    active: slide?.active ?? true,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading, progress } = useUpload({
    onSuccess: (response) => {
      setForm((f) => ({ ...f, imageUrl: response.objectPath }));
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleSubmit = () => {
    if (!form.imageUrl.trim()) return;
    onSubmit(form);
  };

  return (
    <div className="border border-primary/30 bg-card/50 p-5 mb-4 space-y-4" data-testid="hero-slide-form">
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">
          Hero Image *
        </label>
        {form.imageUrl ? (
          <div className="relative border border-border/50 bg-background/50 p-2 mb-2">
            <img src={form.imageUrl} alt="Preview" className="w-full max-h-48 object-cover" data-testid="img-hero-preview" />
            <button
              onClick={() => setForm({ ...form, imageUrl: "" })}
              className="absolute top-3 right-3 p-1 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}
        <label className="flex items-center justify-center gap-2 border border-dashed border-muted-foreground/30 py-3 px-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm text-muted-foreground hover:text-primary">
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading... {progress}%
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              {form.imageUrl ? "Replace Image" : "Upload Image (1920x600 recommended)"}
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
            data-testid="input-hero-image"
          />
        </label>
        <p className="text-[10px] text-muted-foreground mt-1">Or paste an image URL:</p>
        <input
          type="text"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          placeholder="https://example.com/image.jpg"
          className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground font-mono mt-1 focus:outline-none focus:border-primary"
          data-testid="input-hero-image-url"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Headline</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. New Episode: The Future of AI"
            className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            data-testid="input-hero-title"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Subtitle</label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            placeholder="e.g. Season 3 is live now"
            className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            data-testid="input-hero-subtitle"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Link URL</label>
          <input
            type="text"
            value={form.linkUrl}
            onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
            placeholder="/show/abc or https://..."
            className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            data-testid="input-hero-link-url"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Button Text</label>
          <input
            type="text"
            value={form.linkText}
            onChange={(e) => setForm({ ...form, linkText: e.target.value })}
            placeholder="e.g. Listen Now"
            className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            data-testid="input-hero-link-text"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={isPending || !form.imageUrl.trim()}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          data-testid="btn-save-hero-slide"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {slide ? "Update Slide" : "Add Slide"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground border border-border transition-colors"
          data-testid="btn-cancel-hero-slide"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
