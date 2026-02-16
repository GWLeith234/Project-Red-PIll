import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useBranding, useUpdateBranding } from "@/lib/api";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Palette, Type, Save, Eye, Loader2, Trash2, X, Globe, Wand2, Check, Sparkles, ArrowRight, Plus, GripVertical, Power, ExternalLink, Layers, Paintbrush, Blend, Grid3X3, Link, FileText, RectangleHorizontal, Square, SlidersHorizontal } from "lucide-react";
import { SortableList } from "@/components/ui/sortable-list";
import type { Branding, HeroSlide } from "@shared/schema";
import NewsLayoutAdmin from "@/components/NewsLayoutAdmin";
import PageHeader from "@/components/admin/PageHeader";

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
    backgroundType: "solid" as string,
    backgroundColor: "#0f172a",
    backgroundGradient: "",
    backgroundImageUrl: "" as string | null,
    backgroundOverlayOpacity: "0.8",
    backgroundPosition: "center",
    backgroundSize: "cover",
    backgroundPattern: "",
    bannerHeading: "",
    bannerSubheading: "",
    bannerCtaText: "",
    bannerCtaLink: "",
  });

  const [showPreview, setShowPreview] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<WebsiteAnalysis | null>(null);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());
  const [gradientColor1, setGradientColor1] = useState("#0f172a");
  const [gradientColor2, setGradientColor2] = useState("#1e3a5f");
  const [gradientAngle, setGradientAngle] = useState(135);
  const [bannerAspectRatio, setBannerAspectRatio] = useState("16:9");
  const [aiBrandingSuggestions, setAiBrandingSuggestions] = useState<any>(null);
  const [loadingAiBranding, setLoadingAiBranding] = useState(false);
  const [loadingBannerCopy, setLoadingBannerCopy] = useState(false);

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
        backgroundType: (branding as any).backgroundType || "solid",
        backgroundColor: (branding as any).backgroundColor || "#0f172a",
        backgroundGradient: (branding as any).backgroundGradient || "",
        backgroundImageUrl: (branding as any).backgroundImageUrl || null,
        backgroundOverlayOpacity: (branding as any).backgroundOverlayOpacity || "0.8",
        backgroundPosition: (branding as any).backgroundPosition || "center",
        backgroundSize: (branding as any).backgroundSize || "cover",
        backgroundPattern: (branding as any).backgroundPattern || "",
        bannerHeading: (branding as any).bannerHeading || "",
        bannerSubheading: (branding as any).bannerSubheading || "",
        bannerCtaText: (branding as any).bannerCtaText || "",
        bannerCtaLink: (branding as any).bannerCtaLink || "",
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

  const handleAiBrandingSuggestions = async () => {
    setLoadingAiBranding(true);
    setAiBrandingSuggestions(null);
    try {
      const res = await fetch("/api/ai/branding-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          tagline: form.tagline,
          primaryColor: form.primaryColor,
          accentColor: form.accentColor,
        }),
      });
      if (!res.ok) throw new Error("Failed to get AI suggestions");
      const data = await res.json();
      setAiBrandingSuggestions(data);
      toast({ title: "AI Suggestions Ready", description: "Review and apply suggestions below." });
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingAiBranding(false);
    }
  };

  const handleAiBannerCopy = async () => {
    setLoadingBannerCopy(true);
    try {
      const res = await fetch("/api/ai/banner-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          tagline: form.tagline,
        }),
      });
      if (!res.ok) throw new Error("Failed to generate banner copy");
      const data = await res.json();
      setForm(f => ({
        ...f,
        bannerHeading: data.heading || "",
        bannerSubheading: data.subheading || "",
        bannerCtaText: data.ctaText || "",
      }));
      toast({ title: "Banner Copy Generated", description: "Text fields have been filled." });
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message, variant: "destructive" });
    } finally {
      setLoadingBannerCopy(false);
    }
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
      <PageHeader pageKey="customize" onPrimaryAction={handleSave} />
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end -mt-4 mb-4">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center justify-center gap-2 px-4 py-2 border border-border text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors flex-1 sm:flex-none"
          data-testid="btn-toggle-preview"
        >
          {showPreview ? <X className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? "Close Preview" : "Preview"}
        </button>
        <button
          onClick={handleSave}
          disabled={updateBranding.isPending}
          className="flex items-center justify-center gap-2 px-5 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex-1 sm:flex-none"
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

      <div className="border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-5" data-testid="section-smart-analyzer">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary font-semibold">Smart Brand Analyzer</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Enter your company website and we'll automatically extract your brand colors, logo, name, and tagline
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
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
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 w-full sm:w-auto"
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
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

      {/* Section 1: Background Selector */}
      <div className="border border-border bg-card/30 p-5" data-testid="section-background-selector">
        <div className="flex items-center gap-2 mb-4">
          <Paintbrush className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">Background</h2>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {(["solid", "gradient", "image", "pattern"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setForm({ ...form, backgroundType: mode })}
              className={`flex items-center gap-2 px-4 py-2 border text-sm font-semibold uppercase tracking-wider transition-all ${
                form.backgroundType === mode
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
              data-testid={`btn-bg-mode-${mode}`}
            >
              {mode === "solid" && <Palette className="h-4 w-4" />}
              {mode === "gradient" && <Blend className="h-4 w-4" />}
              {mode === "image" && <ImageIcon className="h-4 w-4" />}
              {mode === "pattern" && <Grid3X3 className="h-4 w-4" />}
              {mode === "solid" ? "Solid Color" : mode === "gradient" ? "Gradient" : mode === "image" ? "Image" : "Pattern"}
            </button>
          ))}
        </div>

        {form.backgroundType === "solid" && (
          <div className="space-y-4" data-testid="bg-solid-options">
            <ColorInput
              label="Background Color"
              value={form.backgroundColor}
              onChange={(v) => setForm({ ...form, backgroundColor: v })}
              testId="color-background"
            />
          </div>
        )}

        {form.backgroundType === "gradient" && (
          <div className="space-y-4" data-testid="bg-gradient-options">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Preset Gradients</label>
              <div className="grid grid-cols-5 gap-2">
                {[
                  "linear-gradient(135deg, #0f172a, #1e3a5f)",
                  "linear-gradient(135deg, #1a1a2e, #16213e)",
                  "linear-gradient(135deg, #0c0c1d, #1a1a3e)",
                  "linear-gradient(135deg, #1b2838, #2a4a6b)",
                  "linear-gradient(135deg, #0d1117, #161b22)",
                  "linear-gradient(135deg, #1e1e2e, #313244)",
                  "linear-gradient(135deg, #0f0f23, #1a1a40)",
                  "linear-gradient(135deg, #1c1c3c, #2d2d5f)",
                  "linear-gradient(135deg, #141e30, #243b55)",
                  "linear-gradient(135deg, #232526, #414345)",
                ].map((gradient, i) => (
                  <button
                    key={i}
                    onClick={() => setForm({ ...form, backgroundGradient: gradient })}
                    className={`h-12 border-2 transition-all ${
                      form.backgroundGradient === gradient ? "border-primary scale-105" : "border-border/50 hover:border-primary/50"
                    }`}
                    style={{ background: gradient }}
                    data-testid={`btn-preset-gradient-${i}`}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Custom Gradient</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono block mb-1">Color 1</label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 border border-border flex-shrink-0 cursor-pointer relative overflow-hidden" style={{ backgroundColor: gradientColor1 }}>
                      <input type="color" value={gradientColor1} onChange={(e) => setGradientColor1(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" data-testid="input-gradient-color1" />
                    </div>
                    <input type="text" value={gradientColor1} onChange={(e) => setGradientColor1(e.target.value)} className="w-full bg-background border border-border px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary" data-testid="input-text-gradient-color1" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono block mb-1">Color 2</label>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 border border-border flex-shrink-0 cursor-pointer relative overflow-hidden" style={{ backgroundColor: gradientColor2 }}>
                      <input type="color" value={gradientColor2} onChange={(e) => setGradientColor2(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" data-testid="input-gradient-color2" />
                    </div>
                    <input type="text" value={gradientColor2} onChange={(e) => setGradientColor2(e.target.value)} className="w-full bg-background border border-border px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary" data-testid="input-text-gradient-color2" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-mono block mb-1">Angle: {gradientAngle}°</label>
                  <input type="range" min="0" max="360" value={gradientAngle} onChange={(e) => setGradientAngle(Number(e.target.value))} className="w-full accent-primary" data-testid="input-gradient-angle" />
                </div>
              </div>
              <button
                onClick={() => setForm({ ...form, backgroundGradient: `linear-gradient(${gradientAngle}deg, ${gradientColor1}, ${gradientColor2})` })}
                className="mt-3 flex items-center gap-2 px-4 py-2 border border-primary/30 text-sm text-primary hover:bg-primary/10 transition-colors"
                data-testid="btn-apply-custom-gradient"
              >
                <Check className="h-3.5 w-3.5" />
                Apply Custom Gradient
              </button>
            </div>
          </div>
        )}

        {form.backgroundType === "image" && (
          <div className="space-y-4" data-testid="bg-image-options">
            <UploadZone
              label="Background Image"
              description="Upload a background image. High-resolution recommended."
              currentUrl={form.backgroundImageUrl}
              accept="image/*"
              onUpload={(path) => setForm({ ...form, backgroundImageUrl: path })}
              onClear={() => setForm({ ...form, backgroundImageUrl: null })}
              previewHeight="120px"
              testId="upload-bg-image"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">
                  Overlay Opacity: {Math.round(parseFloat(form.backgroundOverlayOpacity) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(parseFloat(form.backgroundOverlayOpacity) * 100)}
                  onChange={(e) => setForm({ ...form, backgroundOverlayOpacity: (Number(e.target.value) / 100).toFixed(2) })}
                  className="w-full accent-primary"
                  data-testid="input-overlay-opacity"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Position</label>
                <select
                  value={form.backgroundPosition}
                  onChange={(e) => setForm({ ...form, backgroundPosition: e.target.value })}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  data-testid="select-bg-position"
                >
                  <option value="center">Center</option>
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Size</label>
                <select
                  value={form.backgroundSize}
                  onChange={(e) => setForm({ ...form, backgroundSize: e.target.value })}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                  data-testid="select-bg-size"
                >
                  <option value="cover">Cover</option>
                  <option value="contain">Contain</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
            {form.backgroundImageUrl && (
              <div className="relative w-full h-32 border border-border overflow-hidden" data-testid="bg-image-preview-with-overlay">
                <img src={form.backgroundImageUrl} alt="Background" className="w-full h-full object-cover" style={{ objectPosition: form.backgroundPosition }} />
                <div className="absolute inset-0 bg-black" style={{ opacity: parseFloat(form.backgroundOverlayOpacity) }} />
              </div>
            )}
          </div>
        )}

        {form.backgroundType === "pattern" && (
          <div className="space-y-4" data-testid="bg-pattern-options">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Select a Pattern</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { name: "Subtle Dots", css: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)", size: "20px 20px" },
                { name: "Diagonal Lines", css: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px)", size: "" },
                { name: "Grid", css: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)", size: "20px 20px" },
                { name: "Chevron", css: "linear-gradient(135deg, rgba(255,255,255,0.04) 25%, transparent 25%) -10px 0, linear-gradient(225deg, rgba(255,255,255,0.04) 25%, transparent 25%) -10px 0, linear-gradient(315deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%)", size: "20px 20px" },
                { name: "Cross-hatch", css: "repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px), repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 11px)", size: "" },
                { name: "Diamond", css: "linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%, transparent 75%, rgba(255,255,255,0.04) 75%)", size: "20px 20px" },
                { name: "Waves", css: "repeating-radial-gradient(circle at 0 0, transparent 0, rgba(255,255,255,0.03) 10px), repeating-linear-gradient(rgba(255,255,255,0.02), rgba(255,255,255,0.04))", size: "" },
                { name: "Polka", css: "radial-gradient(circle, rgba(255,255,255,0.06) 2px, transparent 2px)", size: "30px 30px" },
              ].map((pattern, i) => (
                <button
                  key={i}
                  onClick={() => setForm({ ...form, backgroundPattern: JSON.stringify(pattern) })}
                  className={`flex flex-col items-center gap-2 p-3 border transition-all ${
                    (() => { try { return JSON.parse(form.backgroundPattern)?.name === pattern.name; } catch { return false; } })()
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  data-testid={`btn-pattern-${i}`}
                >
                  <div
                    className="w-full h-16 border border-border/30"
                    style={{
                      backgroundColor: "#0f172a",
                      backgroundImage: pattern.css,
                      backgroundSize: pattern.size || "auto",
                    }}
                  />
                  <span className="text-xs text-muted-foreground font-mono">{pattern.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Live Preview</label>
          <div
            className="w-full max-w-[200px] h-[120px] border border-border relative overflow-hidden"
            data-testid="bg-live-preview"
            style={{
              ...(form.backgroundType === "solid" ? { backgroundColor: form.backgroundColor } : {}),
              ...(form.backgroundType === "gradient" && form.backgroundGradient ? { background: form.backgroundGradient } : {}),
              ...(form.backgroundType === "image" && form.backgroundImageUrl
                ? { backgroundImage: `url(${form.backgroundImageUrl})`, backgroundPosition: form.backgroundPosition, backgroundSize: form.backgroundSize }
                : {}),
              ...(form.backgroundType === "pattern"
                ? (() => { try { const p = JSON.parse(form.backgroundPattern); return { backgroundColor: "#0f172a", backgroundImage: p.css, backgroundSize: p.size || "auto" }; } catch { return { backgroundColor: "#0f172a" }; } })()
                : {}),
            }}
          >
            {form.backgroundType === "image" && form.backgroundImageUrl && (
              <div className="absolute inset-0 bg-black" style={{ opacity: parseFloat(form.backgroundOverlayOpacity) }} />
            )}
            <div className="absolute inset-3 bg-card/80 border border-border/50 p-2 flex flex-col justify-center items-center">
              <div className="h-2 w-16 bg-primary/60 mb-1" />
              <div className="h-1.5 w-12 bg-muted-foreground/30" />
              <div className="h-1.5 w-20 bg-muted-foreground/20 mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: AI Branding Suggestions */}
      <div className="border border-primary/30 bg-gradient-to-r from-primary/5 to-transparent p-5" data-testid="section-ai-branding">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary font-semibold">AI Branding Suggestions</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Let AI analyze your brand and suggest color palettes, fonts, taglines, and background styles.
        </p>
        <button
          onClick={handleAiBrandingSuggestions}
          disabled={loadingAiBranding}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
          data-testid="btn-ai-suggest-branding"
        >
          {loadingAiBranding ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              AI Suggest Branding
            </>
          )}
        </button>

        {aiBrandingSuggestions && (
          <div className="mt-5 space-y-5" data-testid="ai-branding-results">
            {aiBrandingSuggestions.palette && aiBrandingSuggestions.palette.length > 0 && (
              <div data-testid="ai-color-palette">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-2">Suggested Color Palette</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {aiBrandingSuggestions.palette.map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 border border-border p-3" data-testid={`ai-palette-${i}`}>
                      <div className="h-10 w-10 border border-white/20 flex-shrink-0" style={{ backgroundColor: c.hex }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-foreground block">{c.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">{c.hex}</span>
                        {c.usage && <span className="text-[10px] text-muted-foreground block">{c.usage}</span>}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={() => setForm(f => ({ ...f, primaryColor: c.hex }))}
                          className="text-[10px] px-2 py-1 border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
                          data-testid={`btn-apply-primary-${i}`}
                        >
                          Primary
                        </button>
                        <button
                          onClick={() => setForm(f => ({ ...f, accentColor: c.hex }))}
                          className="text-[10px] px-2 py-1 border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
                          data-testid={`btn-apply-accent-${i}`}
                        >
                          Accent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiBrandingSuggestions.fontPair && (
              <div className="border border-border p-4" data-testid="ai-font-pair">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-1">Font Pairing Recommendation</span>
                <p className="text-sm text-foreground">{aiBrandingSuggestions.fontPair}</p>
              </div>
            )}

            {aiBrandingSuggestions.taglines && aiBrandingSuggestions.taglines.length > 0 && (
              <div data-testid="ai-taglines">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-2">Tagline Suggestions</span>
                <div className="space-y-2">
                  {aiBrandingSuggestions.taglines.map((tagline: string, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 border border-border p-3" data-testid={`ai-tagline-${i}`}>
                      <span className="text-sm text-foreground flex-1">{tagline}</span>
                      <button
                        onClick={() => setForm(f => ({ ...f, tagline }))}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                        data-testid={`btn-use-tagline-${i}`}
                      >
                        <ArrowRight className="h-3 w-3" />
                        Use This
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiBrandingSuggestions.backgroundStyle && (
              <div className="border border-border p-4" data-testid="ai-bg-style">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono block mb-1">Recommended Background Style</span>
                <p className="text-sm text-foreground">{aiBrandingSuggestions.backgroundStyle}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Banner Management */}
      <div className="border border-border bg-card/30 p-5" data-testid="section-banner-management">
        <div className="flex items-center gap-2 mb-4">
          <RectangleHorizontal className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary">Banner Management</h2>
        </div>

        <UploadZone
          label="Banner / Hero Image"
          description="Upload a banner image for your site header area."
          currentUrl={form.bannerUrl}
          accept="image/*"
          onUpload={(path) => setForm({ ...form, bannerUrl: path })}
          onClear={() => setForm({ ...form, bannerUrl: null })}
          previewHeight="120px"
          testId="upload-banner-hero"
        />

        <div className="mt-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Aspect Ratio</label>
          <div className="flex flex-wrap gap-2">
            {["16:9", "4:3", "3:1", "1:1"].map((ratio) => (
              <button
                key={ratio}
                onClick={() => setBannerAspectRatio(ratio)}
                className={`flex items-center gap-1.5 px-4 py-2 border text-sm font-mono transition-all ${
                  bannerAspectRatio === ratio
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
                data-testid={`btn-aspect-${ratio.replace(":", "-")}`}
              >
                {ratio === "1:1" ? <Square className="h-3.5 w-3.5" /> : <RectangleHorizontal className="h-3.5 w-3.5" />}
                {ratio}
              </button>
            ))}
          </div>
        </div>

        {form.bannerUrl && (
          <div className="mt-4">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Preview</label>
            <div
              className="border border-border overflow-hidden bg-background"
              style={{
                aspectRatio: bannerAspectRatio.replace(":", "/"),
                maxHeight: "300px",
              }}
              data-testid="banner-aspect-preview"
            >
              <img src={form.bannerUrl} alt="Banner preview" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono">Banner Text</label>
            <button
              onClick={handleAiBannerCopy}
              disabled={loadingBannerCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 transition-colors uppercase tracking-wider disabled:opacity-50"
              data-testid="btn-ai-banner-copy"
            >
              {loadingBannerCopy ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Writing...
                </>
              ) : (
                <>
                  <Wand2 className="h-3 w-3" />
                  AI Write Banner Copy
                </>
              )}
            </button>
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Heading</label>
            <input
              type="text"
              value={form.bannerHeading}
              onChange={(e) => setForm({ ...form, bannerHeading: e.target.value })}
              placeholder="e.g. Welcome to Our Platform"
              className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              data-testid="input-banner-heading"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Subheading</label>
            <input
              type="text"
              value={form.bannerSubheading}
              onChange={(e) => setForm({ ...form, bannerSubheading: e.target.value })}
              placeholder="e.g. Discover the latest in media and technology"
              className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
              data-testid="input-banner-subheading"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">CTA Button Text</label>
              <input
                type="text"
                value={form.bannerCtaText}
                onChange={(e) => setForm({ ...form, bannerCtaText: e.target.value })}
                placeholder="e.g. Get Started"
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                data-testid="input-banner-cta-text"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">CTA Link</label>
              <input
                type="text"
                value={form.bannerCtaLink}
                onChange={(e) => setForm({ ...form, bannerCtaLink: e.target.value })}
                placeholder="e.g. /subscribe or https://..."
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                data-testid="input-banner-cta-link"
              />
            </div>
          </div>
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-mono uppercase tracking-widest text-primary font-semibold">Hero Carousel</h2>
          <span className="text-xs text-muted-foreground ml-2">({slides.length} slides)</span>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors w-full sm:w-auto justify-center"
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
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 border p-3 transition-all ${
                    slide.active ? "border-border bg-card/50" : "border-border/50 bg-card/20 opacity-60"
                  }`}
                  data-testid={`hero-slide-${slide.id}`}
                >
                  <div className="w-full sm:w-40 h-32 sm:h-20 flex-shrink-0 border border-border/50 overflow-hidden bg-background">
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
                  <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
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
              className="absolute top-3 right-3 p-1 bg-background/60 text-foreground rounded-full hover:bg-background/80"
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
