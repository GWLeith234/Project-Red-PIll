import { useState, useEffect, useRef } from "react";
import { useBranding, useUpdateBranding } from "@/lib/api";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";
import { Upload, Image as ImageIcon, Palette, Type, Save, Eye, Loader2, Trash2, X } from "lucide-react";
import type { Branding } from "@shared/schema";

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
    </div>
  );
}
