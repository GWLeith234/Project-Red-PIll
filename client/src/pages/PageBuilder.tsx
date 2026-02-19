import React, { useState, useCallback, useEffect, useRef } from "react";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LayoutGrid,
  Star,
  Image as ImageIcon,
  Type,
  Mic,
  Play,
  Calendar,
  BarChart3,
  Megaphone,
  RectangleHorizontal,
  Mail,
  Minus,
  Code,
  GripVertical,
  Plus,
  Trash2,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  Globe,
  Loader2,
  ArrowLeft,
  Copy,
  Pencil,
  Eye,
  EyeOff,
  Settings,
  Sparkles,
} from "lucide-react";

interface PageBlock {
  id: string;
  type: string;
  settings: Record<string, any>;
  order: number;
}

interface BuiltPage {
  id: string;
  title: string;
  slug: string;
  status: string;
  pageType: string;
  layout: PageBlock[];
  metaTitle: string | null;
  metaDescription: string | null;
  coverImage: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type PreviewMode = "desktop" | "tablet" | "mobile";

const BLOCK_ICON_MAP: Record<string, React.ElementType> = {
  hero: Star,
  text: Type,
  podcast_feed: Mic,
  article_feed: LayoutGrid,
  poll_widget: BarChart3,
  events_widget: Calendar,
  ad_unit: RectangleHorizontal,
  image: ImageIcon,
  video: Play,
  cta_banner: Megaphone,
  divider: Minus,
  subscribe_widget: Mail,
  html: Code,
};

const BLOCK_CATEGORIES: Record<string, { label: string; types: string[] }> = {
  content: { label: "Content", types: ["hero", "text", "article_feed"] },
  media: { label: "Media", types: ["image", "video", "podcast_feed"] },
  community: { label: "Community", types: ["poll_widget", "events_widget", "subscribe_widget"] },
  commerce: { label: "Commerce", types: ["ad_unit", "cta_banner"] },
  utility: { label: "Utility", types: ["divider", "html"] },
};

const BLOCK_LABELS: Record<string, string> = {
  hero: "Hero",
  text: "Text",
  article_feed: "Article Feed",
  podcast_feed: "Podcast Feed",
  poll_widget: "Poll Widget",
  events_widget: "Events Widget",
  ad_unit: "Ad Unit",
  image: "Image",
  video: "Video",
  cta_banner: "CTA Banner",
  divider: "Divider",
  subscribe_widget: "Subscribe Widget",
  html: "HTML",
};

function generateBlockId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function BlockSettingsPanel({
  block,
  onUpdate,
  metaTitle,
  metaDescription,
  onMetaChange,
}: {
  block: PageBlock;
  onUpdate: (settings: Record<string, any>) => void;
  metaTitle: string;
  metaDescription: string;
  onMetaChange: (field: "metaTitle" | "metaDescription", value: string) => void;
}) {
  const updateSetting = (key: string, value: any) => {
    onUpdate({ ...block.settings, [key]: value });
  };

  const renderFields = () => {
    switch (block.type) {
      case "hero":
        return (
          <>
            <div className="space-y-2">
              <Label>Heading</Label>
              <Input data-testid="input-hero-heading" value={block.settings.heading || ""} onChange={(e) => updateSetting("heading", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Subheading</Label>
              <Input data-testid="input-hero-subheading" value={block.settings.subheading || ""} onChange={(e) => updateSetting("subheading", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input data-testid="input-hero-buttonText" value={block.settings.buttonText || ""} onChange={(e) => updateSetting("buttonText", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Button URL</Label>
              <Input data-testid="input-hero-buttonUrl" value={block.settings.buttonUrl || ""} onChange={(e) => updateSetting("buttonUrl", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Height</Label>
              <Select value={block.settings.height || "400"} onValueChange={(v) => updateSetting("height", v)}>
                <SelectTrigger data-testid="select-hero-height"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">300px</SelectItem>
                  <SelectItem value="400">400px</SelectItem>
                  <SelectItem value="500">500px</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Overlay</Label>
              <Switch data-testid="switch-hero-overlay" checked={!!block.settings.overlay} onCheckedChange={(v) => updateSetting("overlay", v)} />
            </div>
          </>
        );
      case "text":
        return (
          <>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea data-testid="input-text-content" value={block.settings.content || ""} onChange={(e) => updateSetting("content", e.target.value)} rows={6} />
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select value={block.settings.alignment || "left"} onValueChange={(v) => updateSetting("alignment", v)}>
                <SelectTrigger data-testid="select-text-alignment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Width</Label>
              <Input data-testid="input-text-maxWidth" value={block.settings.maxWidth || ""} onChange={(e) => updateSetting("maxWidth", e.target.value)} placeholder="e.g. 800px" />
            </div>
          </>
        );
      case "podcast_feed":
        return (
          <>
            <div className="space-y-2">
              <Label>Limit</Label>
              <Input data-testid="input-podcast_feed-limit" type="number" value={block.settings.limit || 6} onChange={(e) => updateSetting("limit", parseInt(e.target.value) || 6)} />
            </div>
            <div className="space-y-2">
              <Label>Columns</Label>
              <Select value={String(block.settings.columns || 3)} onValueChange={(v) => updateSetting("columns", parseInt(v))}>
                <SelectTrigger data-testid="select-podcast_feed-columns"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Description</Label>
              <Switch data-testid="switch-podcast_feed-showDescription" checked={!!block.settings.showDescription} onCheckedChange={(v) => updateSetting("showDescription", v)} />
            </div>
          </>
        );
      case "article_feed":
        return (
          <>
            <div className="space-y-2">
              <Label>Limit</Label>
              <Input data-testid="input-article_feed-limit" type="number" value={block.settings.limit || 6} onChange={(e) => updateSetting("limit", parseInt(e.target.value) || 6)} />
            </div>
            <div className="space-y-2">
              <Label>Columns</Label>
              <Select value={String(block.settings.columns || 3)} onValueChange={(v) => updateSetting("columns", parseInt(v))}>
                <SelectTrigger data-testid="select-article_feed-columns"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Image</Label>
              <Switch data-testid="switch-article_feed-showImage" checked={block.settings.showImage !== false} onCheckedChange={(v) => updateSetting("showImage", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Excerpt</Label>
              <Switch data-testid="switch-article_feed-showExcerpt" checked={block.settings.showExcerpt !== false} onCheckedChange={(v) => updateSetting("showExcerpt", v)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input data-testid="input-article_feed-category" value={block.settings.category || ""} onChange={(e) => updateSetting("category", e.target.value)} placeholder="Filter by category" />
            </div>
          </>
        );
      case "poll_widget":
        return (
          <>
            <div className="space-y-2">
              <Label>Zone</Label>
              <Select value={block.settings.zone || "homepage"} onValueChange={(v) => updateSetting("zone", v)}>
                <SelectTrigger data-testid="select-poll_widget-zone"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="homepage">Homepage</SelectItem>
                  <SelectItem value="community_page">Community Page</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limit</Label>
              <Input data-testid="input-poll_widget-limit" type="number" value={block.settings.limit || 1} onChange={(e) => updateSetting("limit", parseInt(e.target.value) || 1)} />
            </div>
          </>
        );
      case "events_widget":
        return (
          <>
            <div className="space-y-2">
              <Label>Limit</Label>
              <Input data-testid="input-events_widget-limit" type="number" value={block.settings.limit || 5} onChange={(e) => updateSetting("limit", parseInt(e.target.value) || 5)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Past Events</Label>
              <Switch data-testid="switch-events_widget-showPastEvents" checked={!!block.settings.showPastEvents} onCheckedChange={(v) => updateSetting("showPastEvents", v)} />
            </div>
          </>
        );
      case "ad_unit":
        return (
          <>
            <div className="space-y-2">
              <Label>Size</Label>
              <Select value={block.settings.size || "banner"} onValueChange={(v) => updateSetting("size", v)}>
                <SelectTrigger data-testid="select-ad_unit-size"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="sidebar">Sidebar</SelectItem>
                  <SelectItem value="leaderboard">Leaderboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Position</Label>
              <Select value={block.settings.position || "inline"} onValueChange={(v) => updateSetting("position", v)}>
                <SelectTrigger data-testid="select-ad_unit-position"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inline">Inline</SelectItem>
                  <SelectItem value="sticky">Sticky</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "image":
        return (
          <>
            <div className="space-y-2">
              <Label>Source URL</Label>
              <Input data-testid="input-image-src" value={block.settings.src || ""} onChange={(e) => updateSetting("src", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Alt Text</Label>
              <Input data-testid="input-image-alt" value={block.settings.alt || ""} onChange={(e) => updateSetting("alt", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input data-testid="input-image-caption" value={block.settings.caption || ""} onChange={(e) => updateSetting("caption", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Alignment</Label>
              <Select value={block.settings.alignment || "center"} onValueChange={(v) => updateSetting("alignment", v)}>
                <SelectTrigger data-testid="select-image-alignment"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="center">Center</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "video":
        return (
          <>
            <div className="space-y-2">
              <Label>Source URL</Label>
              <Input data-testid="input-video-src" value={block.settings.src || ""} onChange={(e) => updateSetting("src", e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input data-testid="input-video-title" value={block.settings.title || ""} onChange={(e) => updateSetting("title", e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Autoplay</Label>
              <Switch data-testid="switch-video-autoplay" checked={!!block.settings.autoplay} onCheckedChange={(v) => updateSetting("autoplay", v)} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Controls</Label>
              <Switch data-testid="switch-video-controls" checked={block.settings.controls !== false} onCheckedChange={(v) => updateSetting("controls", v)} />
            </div>
          </>
        );
      case "cta_banner":
        return (
          <>
            <div className="space-y-2">
              <Label>Heading</Label>
              <Input data-testid="input-cta_banner-heading" value={block.settings.heading || ""} onChange={(e) => updateSetting("heading", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input data-testid="input-cta_banner-description" value={block.settings.description || ""} onChange={(e) => updateSetting("description", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input data-testid="input-cta_banner-buttonText" value={block.settings.buttonText || ""} onChange={(e) => updateSetting("buttonText", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Button URL</Label>
              <Input data-testid="input-cta_banner-buttonUrl" value={block.settings.buttonUrl || ""} onChange={(e) => updateSetting("buttonUrl", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Background Color</Label>
              <Input data-testid="input-cta_banner-backgroundColor" value={block.settings.backgroundColor || ""} onChange={(e) => updateSetting("backgroundColor", e.target.value)} placeholder="#1e40af" />
            </div>
          </>
        );
      case "divider":
        return (
          <>
            <div className="space-y-2">
              <Label>Style</Label>
              <Select value={block.settings.style || "line"} onValueChange={(v) => updateSetting("style", v)}>
                <SelectTrigger data-testid="select-divider-style"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line</SelectItem>
                  <SelectItem value="dots">Dots</SelectItem>
                  <SelectItem value="space">Space</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Spacing</Label>
              <Select value={block.settings.spacing || "md"} onValueChange={(v) => updateSetting("spacing", v)}>
                <SelectTrigger data-testid="select-divider-spacing"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm">Small</SelectItem>
                  <SelectItem value="md">Medium</SelectItem>
                  <SelectItem value="lg">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      case "subscribe_widget":
        return (
          <>
            <div className="space-y-2">
              <Label>Heading</Label>
              <Input data-testid="input-subscribe_widget-heading" value={block.settings.heading || ""} onChange={(e) => updateSetting("heading", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input data-testid="input-subscribe_widget-description" value={block.settings.description || ""} onChange={(e) => updateSetting("description", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input data-testid="input-subscribe_widget-buttonText" value={block.settings.buttonText || ""} onChange={(e) => updateSetting("buttonText", e.target.value)} />
            </div>
          </>
        );
      case "html":
        return (
          <div className="space-y-2">
            <Label>HTML Code</Label>
            <Textarea data-testid="input-html-code" value={block.settings.code || ""} onChange={(e) => updateSetting("code", e.target.value)} rows={10} className="font-mono text-xs" />
          </div>
        );
      default:
        return <p className="text-sm text-muted-foreground">No settings available for this block type.</p>;
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Block Settings</h3>
        <div className="space-y-4">
          {renderFields()}
        </div>
        <div className="border-t border-border pt-4 mt-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">SEO</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input data-testid="input-seo-metaTitle" value={metaTitle} onChange={(e) => onMetaChange("metaTitle", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Meta Description</Label>
              <Textarea data-testid="input-seo-metaDescription" value={metaDescription} onChange={(e) => onMetaChange("metaDescription", e.target.value)} rows={3} />
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

function BlockPreview({ block }: { block: PageBlock }) {
  const s = block.settings;
  switch (block.type) {
    case "hero":
      return (
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded p-6 text-center" style={{ minHeight: `${parseInt(s.height || "200") / 2}px` }}>
          <h2 className="text-lg font-bold">{s.heading || "Hero Heading"}</h2>
          {s.subheading && <p className="text-sm text-muted-foreground mt-1">{s.subheading}</p>}
          {s.buttonText && <div className="mt-3"><span className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs">{s.buttonText}</span></div>}
        </div>
      );
    case "text":
      return (
        <div className={cn("p-4", s.alignment === "center" && "text-center", s.alignment === "right" && "text-right")}>
          <p className="text-sm text-muted-foreground">{s.content || "Text content goes here..."}</p>
        </div>
      );
    case "article_feed":
      return (
        <div className={cn("grid gap-2 p-4", `grid-cols-${s.columns || 3}`)}>
          {Array.from({ length: Math.min(s.limit || 3, 3) }).map((_, i) => (
            <div key={i} className="bg-muted/30 rounded p-3 space-y-1">
              {s.showImage !== false && <div className="bg-muted rounded h-12 w-full" />}
              <div className="h-2 bg-muted rounded w-3/4" />
              {s.showExcerpt !== false && <div className="h-2 bg-muted/50 rounded w-full" />}
            </div>
          ))}
        </div>
      );
    case "podcast_feed":
      return (
        <div className={cn("grid gap-2 p-4", `grid-cols-${s.columns || 3}`)}>
          {Array.from({ length: Math.min(s.limit || 3, 3) }).map((_, i) => (
            <div key={i} className="bg-muted/30 rounded p-3 flex items-center gap-2">
              <Mic className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <div className="h-2 bg-muted rounded w-3/4" />
                {s.showDescription && <div className="h-2 bg-muted/50 rounded w-full" />}
              </div>
            </div>
          ))}
        </div>
      );
    case "poll_widget":
      return (
        <div className="p-4">
          <div className="bg-muted/30 rounded p-4 space-y-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <div className="h-2 bg-muted rounded w-1/2" />
            <div className="h-2 bg-primary/30 rounded w-3/4" />
            <div className="h-2 bg-primary/20 rounded w-1/2" />
          </div>
        </div>
      );
    case "events_widget":
      return (
        <div className="p-4 space-y-2">
          {Array.from({ length: Math.min(s.limit || 2, 2) }).map((_, i) => (
            <div key={i} className="bg-muted/30 rounded p-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="h-2 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      );
    case "ad_unit":
      return (
        <div className="p-4 flex justify-center">
          <div className={cn("border-2 border-dashed border-muted-foreground/30 rounded flex items-center justify-center text-xs text-muted-foreground",
            s.size === "leaderboard" ? "w-full h-16" : s.size === "sidebar" ? "w-40 h-48" : "w-full h-20"
          )}>
            Ad: {s.size || "banner"}
          </div>
        </div>
      );
    case "image":
      return (
        <div className={cn("p-4", s.alignment === "center" && "flex justify-center", s.alignment === "right" && "flex justify-end")}>
          {s.src ? (
            <img src={s.src} alt={s.alt || ""} className="max-h-32 rounded" />
          ) : (
            <div className="bg-muted/30 rounded h-24 w-full flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            </div>
          )}
          {s.caption && <p className="text-xs text-muted-foreground mt-1">{s.caption}</p>}
        </div>
      );
    case "video":
      return (
        <div className="p-4">
          <div className="bg-muted/30 rounded h-32 flex items-center justify-center">
            <Play className="h-10 w-10 text-muted-foreground/40" />
          </div>
          {s.title && <p className="text-xs text-muted-foreground mt-1">{s.title}</p>}
        </div>
      );
    case "cta_banner":
      return (
        <div className="p-4 rounded text-center" style={{ backgroundColor: s.backgroundColor || "#1e40af" }}>
          <h3 className="text-sm font-bold text-white">{s.heading || "CTA Heading"}</h3>
          {s.description && <p className="text-xs text-white/80 mt-1">{s.description}</p>}
          {s.buttonText && <div className="mt-2"><span className="bg-white text-black px-3 py-1 rounded text-xs">{s.buttonText}</span></div>}
        </div>
      );
    case "divider":
      return (
        <div className={cn("px-4", s.spacing === "sm" ? "py-2" : s.spacing === "lg" ? "py-8" : "py-4")}>
          {s.style === "dots" ? (
            <div className="flex justify-center gap-2">
              <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full" />
              <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full" />
              <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full" />
            </div>
          ) : s.style === "space" ? null : (
            <hr className="border-border" />
          )}
        </div>
      );
    case "subscribe_widget":
      return (
        <div className="p-4 bg-muted/20 rounded text-center">
          <Mail className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
          <p className="text-sm font-medium">{s.heading || "Subscribe"}</p>
          {s.description && <p className="text-xs text-muted-foreground">{s.description}</p>}
          <div className="mt-2 flex gap-2 max-w-xs mx-auto">
            <div className="flex-1 bg-muted rounded h-7" />
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs">{s.buttonText || "Subscribe"}</span>
          </div>
        </div>
      );
    case "html":
      return (
        <div className="p-4">
          <pre className="bg-muted/30 rounded p-3 text-xs font-mono text-muted-foreground overflow-hidden max-h-24">
            {s.code || "<div>Custom HTML</div>"}
          </pre>
        </div>
      );
    default:
      return (
        <div className="p-4 text-center text-sm text-muted-foreground">
          {BLOCK_LABELS[block.type] || block.type} block
        </div>
      );
  }
}

export default function PageBuilder() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [mode, setMode] = useState<"list" | "editor">("list");
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const [newTitle, setNewTitle] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newPageType, setNewPageType] = useState("landing");
  const [newAiPrompt, setNewAiPrompt] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const [layout, setLayout] = useState<PageBlock[]>([]);
  const [editableTitle, setEditableTitle] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [draggingBlockId, setDraggingBlockId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const { data: pages = [], isLoading: pagesLoading } = useQuery<BuiltPage[]>({
    queryKey: ["/api/pages"],
  });

  const { data: currentPage, isLoading: pageLoading } = useQuery<BuiltPage>({
    queryKey: ["/api/pages", editingPageId],
    queryFn: async () => {
      const res = await fetch(`/api/pages/${editingPageId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load page");
      return res.json();
    },
    enabled: !!editingPageId && mode === "editor",
  });

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ["/api/ai-page-builder/page-templates"],
  });

  useEffect(() => {
    if (currentPage) {
      setLayout(currentPage.layout || []);
      setEditableTitle(currentPage.title);
      setMetaTitle(currentPage.metaTitle || "");
      setMetaDescription(currentPage.metaDescription || "");
    }
  }, [currentPage]);

  const createPageMutation = useMutation({
    mutationFn: async (data: { title: string; slug: string; pageType: string; layout: PageBlock[] }) => {
      const res = await apiRequest("POST", "/api/pages", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setShowCreateDialog(false);
      resetCreateForm();
      toast({ title: "Page Created" });
      if (data?.id) {
        setEditingPageId(data.id);
        setMode("editor");
        setSelectedBlockId(null);
      }
    },
    onError: (err: any) => toast({ title: "Error creating page", description: err.message, variant: "destructive" }),
  });

  const updatePageMutation = useMutation({
    mutationFn: async (data: Partial<BuiltPage>) => {
      const res = await apiRequest("PATCH", `/api/pages/${editingPageId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pages", editingPageId] });
      toast({ title: "Page Saved" });
    },
    onError: (err: any) => toast({ title: "Error saving page", description: err.message, variant: "destructive" }),
  });

  const deletePageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/pages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      setShowDeleteDialog(null);
      toast({ title: "Page Deleted" });
    },
    onError: (err: any) => toast({ title: "Error deleting page", description: err.message, variant: "destructive" }),
  });

  const publishPageMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("[PageBuilder] Publishing page:", id);
      const res = await apiRequest("POST", `/api/pages/${id}/publish`);
      const data = await res.json();
      console.log("[PageBuilder] Publish response:", JSON.stringify(data));
      return data;
    },
    onSuccess: (data: any, id: string) => {
      console.log("[PageBuilder] Publish success, invalidating queries for id:", id, "editingPageId:", editingPageId);
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pages", id] });
      if (editingPageId && editingPageId !== id) {
        queryClient.invalidateQueries({ queryKey: ["/api/pages", editingPageId] });
      }
      toast({ title: "Page Published", description: `Your page is now live at /page/${data?.slug || ""}` });
    },
    onError: (err: any) => {
      console.error("[PageBuilder] Publish error:", err);
      toast({ title: "Error publishing page", description: err.message, variant: "destructive" });
    },
  });

  const unpublishPageMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("[PageBuilder] Unpublishing page:", id);
      const res = await apiRequest("POST", `/api/pages/${id}/unpublish`);
      const data = await res.json();
      console.log("[PageBuilder] Unpublish response:", JSON.stringify(data));
      return data;
    },
    onSuccess: (_data: any, id: string) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pages", id] });
      if (editingPageId && editingPageId !== id) {
        queryClient.invalidateQueries({ queryKey: ["/api/pages", editingPageId] });
      }
      toast({ title: "Page Unpublished" });
    },
    onError: (err: any) => {
      console.error("[PageBuilder] Unpublish error:", err);
      toast({ title: "Error unpublishing page", description: err.message, variant: "destructive" });
    },
  });

  const duplicatePageMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/pages/${id}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages"] });
      toast({ title: "Page Duplicated" });
    },
    onError: (err: any) => toast({ title: "Error duplicating page", description: err.message, variant: "destructive" }),
  });

  const generateLayoutMutation = useMutation({
    mutationFn: async (data: { pageType: string; prompt: string; title: string }) => {
      const res = await apiRequest("POST", "/api/pages/ai/generate-layout", data);
      return res.json();
    },
  });

  const resetCreateForm = () => {
    setNewTitle("");
    setNewSlug("");
    setNewPageType("landing");
    setNewAiPrompt("");
    setSelectedTemplateId(null);
  };

  const handleEditPage = (id: string) => {
    setEditingPageId(id);
    setMode("editor");
    setSelectedBlockId(null);
  };

  const handleBackToList = () => {
    setMode("list");
    setEditingPageId(null);
    setSelectedBlockId(null);
    setLayout([]);
  };

  const handleSave = () => {
    updatePageMutation.mutate({
      title: editableTitle,
      layout,
      metaTitle: metaTitle || null,
      metaDescription: metaDescription || null,
    });
  };

  const handleAddBlock = (type: string) => {
    const newBlock: PageBlock = {
      id: generateBlockId(),
      type,
      settings: {},
      order: layout.length,
    };
    setLayout((prev) => [...prev, newBlock]);
  };

  const handleDeleteBlock = (blockId: string) => {
    setLayout((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  const handleUpdateBlockSettings = (blockId: string, settings: Record<string, any>) => {
    setLayout((prev) => prev.map((b) => (b.id === blockId ? { ...b, settings } : b)));
  };

  const handleBlockDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("application/block-id", blockId);
    setDraggingBlockId(blockId);
  }, []);

  const handleBlockDragOver = useCallback((e: React.DragEvent, blockId: string) => {
    e.preventDefault();
    if (draggingBlockId && draggingBlockId !== blockId) {
      setDropTargetId(blockId);
    }
  }, [draggingBlockId]);

  const handleBlockDrop = useCallback((e: React.DragEvent, targetBlockId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("application/block-id");
    if (draggedId && draggedId !== targetBlockId) {
      setLayout((prev) => {
        const newLayout = [...prev];
        const fromIndex = newLayout.findIndex((b) => b.id === draggedId);
        const toIndex = newLayout.findIndex((b) => b.id === targetBlockId);
        if (fromIndex !== -1 && toIndex !== -1) {
          const [moved] = newLayout.splice(fromIndex, 1);
          newLayout.splice(toIndex, 0, moved);
          return newLayout.map((b, i) => ({ ...b, order: i }));
        }
        return prev;
      });
    }
    setDraggingBlockId(null);
    setDropTargetId(null);
  }, []);

  const handleBlockDragEnd = useCallback(() => {
    setDraggingBlockId(null);
    setDropTargetId(null);
  }, []);

  const handleLibraryDragStart = useCallback((e: React.DragEvent, blockType: string) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("application/new-block-type", blockType);
  }, []);

  const handleCanvasDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData("application/new-block-type");
    if (blockType) {
      handleAddBlock(blockType);
    }
  }, [layout.length]);

  const handleCanvasDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleCreatePage = () => {
    let initialLayout: PageBlock[] = [];
    if (selectedTemplateId) {
      const template = templates.find((t: any) => t.id === selectedTemplateId);
      if (template?.layout) {
        initialLayout = (template.layout as PageBlock[]).map((b, i) => ({
          ...b,
          id: generateBlockId(),
          order: i,
        }));
      }
    }
    createPageMutation.mutate({
      title: newTitle,
      slug: newSlug || slugify(newTitle),
      pageType: newPageType,
      layout: initialLayout,
    });
  };

  const filteredPages = pages.filter((p) => {
    if (statusFilter === "draft") return p.status === "draft";
    if (statusFilter === "published") return p.status === "published";
    return true;
  });

  const selectedBlock = layout.find((b) => b.id === selectedBlockId) || null;

  const canvasWidth = previewMode === "desktop" ? "100%" : previewMode === "tablet" ? "768px" : "375px";

  if (mode === "editor") {
    return (
      <div className="h-screen flex flex-col bg-background" data-testid="page-builder-editor">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={handleBackToList} data-testid="button-back-to-list">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Input
              data-testid="input-page-title"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="text-lg font-semibold bg-transparent border-none h-8 w-64 focus-visible:ring-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-border rounded-md">
              <Button variant={previewMode === "desktop" ? "secondary" : "ghost"} size="sm" onClick={() => setPreviewMode("desktop")} data-testid="button-preview-desktop">
                <Monitor className="h-4 w-4" />
              </Button>
              <Button variant={previewMode === "tablet" ? "secondary" : "ghost"} size="sm" onClick={() => setPreviewMode("tablet")} data-testid="button-preview-tablet">
                <Tablet className="h-4 w-4" />
              </Button>
              <Button variant={previewMode === "mobile" ? "secondary" : "ghost"} size="sm" onClick={() => setPreviewMode("mobile")} data-testid="button-preview-mobile">
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleSave} disabled={updatePageMutation.isPending} data-testid="button-save-page">
              {updatePageMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
            {currentPage?.status === "published" ? (
              <Button variant="outline" size="sm" onClick={() => {
                const pageId = editingPageId || currentPage?.id;
                console.log("[PageBuilder] Unpublish clicked, pageId:", pageId);
                if (pageId) unpublishPageMutation.mutate(pageId);
              }} disabled={unpublishPageMutation.isPending} data-testid="button-unpublish-page">
                <EyeOff className="h-4 w-4 mr-1" /> Unpublish
              </Button>
            ) : (
              <Button size="sm" onClick={() => {
                const pageId = editingPageId || currentPage?.id;
                console.log("[PageBuilder] Publish clicked, pageId:", pageId, "currentPage status:", currentPage?.status);
                if (pageId) publishPageMutation.mutate(pageId);
                else console.warn("[PageBuilder] Cannot publish: no page ID available");
              }} disabled={publishPageMutation.isPending || (!editingPageId && !currentPage?.id)} data-testid="button-publish-page">
                <Globe className="h-4 w-4 mr-1" /> Publish
              </Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[250px] border-r border-border bg-card overflow-y-auto" data-testid="block-library-panel">
            <div className="p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Block Library</h3>
              {Object.entries(BLOCK_CATEGORIES).map(([key, category]) => (
                <div key={key} className="mb-4">
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">{category.label}</h4>
                  <div className="space-y-1">
                    {category.types.map((type) => {
                      const Icon = BLOCK_ICON_MAP[type] || Code;
                      return (
                        <div
                          key={type}
                          draggable
                          onDragStart={(e) => handleLibraryDragStart(e, type)}
                          onClick={() => handleAddBlock(type)}
                          className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-grab active:cursor-grabbing transition-colors"
                          data-testid={`block-type-${type}`}
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{BLOCK_LABELS[type] || type}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto bg-muted/20 p-6"
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            data-testid="canvas-area"
          >
            {pageLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="mx-auto transition-all duration-300" style={{ width: canvasWidth, maxWidth: "100%" }}>
                {layout.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-border rounded-lg" data-testid="canvas-empty-state">
                    <Plus className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">Add blocks from the library to build your page</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {layout.map((block) => (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={(e) => handleBlockDragStart(e, block.id)}
                        onDragOver={(e) => handleBlockDragOver(e, block.id)}
                        onDrop={(e) => handleBlockDrop(e, block.id)}
                        onDragEnd={handleBlockDragEnd}
                        onClick={() => setSelectedBlockId(block.id)}
                        className={cn(
                          "bg-card rounded-lg border-2 transition-all cursor-pointer group relative",
                          selectedBlockId === block.id ? "border-blue-500 ring-1 ring-blue-500/20" : "border-border hover:border-muted-foreground/30",
                          draggingBlockId === block.id && "opacity-50",
                          dropTargetId === block.id && "border-blue-400 border-dashed"
                        )}
                        data-testid={`canvas-block-${block.id}`}
                      >
                        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-muted/30 rounded-t-lg">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                            <span className="text-xs font-medium text-muted-foreground">{BLOCK_LABELS[block.type] || block.type}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                              data-testid={`button-settings-block-${block.id}`}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                              data-testid={`button-delete-block-${block.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <BlockPreview block={block} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-[300px] border-l border-border bg-card" data-testid="block-settings-panel">
            {selectedBlock ? (
              <BlockSettingsPanel
                block={selectedBlock}
                onUpdate={(settings) => handleUpdateBlockSettings(selectedBlock.id, settings)}
                metaTitle={metaTitle}
                metaDescription={metaDescription}
                onMetaChange={(field, value) => {
                  if (field === "metaTitle") setMetaTitle(value);
                  else setMetaDescription(value);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Settings className="h-8 w-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select a block to edit its settings</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const publishedCount = pages.filter(p => p.status === "published").length;
  const draftCount = pages.filter(p => p.status === "draft").length;
  const totalViews = pages.reduce((sum, p) => sum + ((p as any).views || 0), 0);
  const avgBlocks = pages.length > 0 ? Math.round(pages.reduce((sum, p) => sum + ((p as any).layout?.length || 0), 0) / pages.length) : 0;
  const lastPublished = pages.filter(p => p.status === "published").sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  return (
    <div className="p-6" data-testid="page-builder-list">
      <PageHeader pageKey="page-builder" onPrimaryAction={() => { resetCreateForm(); setShowCreateDialog(true); }} primaryActionOverride="Create New Page" />

      <MetricsStrip metrics={[
        { label: "Total Pages", value: pages.length },
        { label: "Published", value: publishedCount },
        { label: "Drafts", value: draftCount },
        { label: "Total Views", value: totalViews || "N/A" },
        { label: "Avg Blocks/Page", value: avgBlocks },
        { label: "Last Published", value: lastPublished ? new Date(lastPublished.updatedAt).toLocaleDateString() : "N/A" },
      ]} />

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
        <TabsList data-testid="status-filter-tabs">
          <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          <TabsTrigger value="draft" data-testid="tab-draft">Draft</TabsTrigger>
          <TabsTrigger value="published" data-testid="tab-published">Published</TabsTrigger>
        </TabsList>
      </Tabs>

      {pagesLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredPages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center" data-testid="empty-state">
          <Globe className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Pages Yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Create your first page to get started with the page builder.
          </p>
          <Button onClick={() => { resetCreateForm(); setShowCreateDialog(true); }} data-testid="button-create-first-page">
            <Plus className="h-4 w-4 mr-2" /> Create New Page
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full" data-testid="pages-table">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Title</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Page Type</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Last Updated</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.map((page) => (
                <tr key={page.id} className="border-b border-border hover:bg-muted/30 transition-colors" data-testid={`row-page-${page.id}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium" data-testid={`text-title-${page.id}`}>{page.title}</p>
                      <p className="text-xs text-muted-foreground" data-testid={`text-slug-${page.id}`}>/{page.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={page.status === "published" ? "default" : "secondary"}
                      className={cn(
                        page.status === "published" && "bg-green-500/20 text-green-400 border-green-500/30",
                        page.status === "draft" && "bg-gray-500/20 text-gray-400 border-gray-500/30"
                      )}
                      data-testid={`badge-status-${page.id}`}
                    >
                      {page.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground capitalize" data-testid={`text-pageType-${page.id}`}>
                      {page.pageType?.replace(/_/g, " ") || "custom"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-muted-foreground" data-testid={`text-updated-${page.id}`}>
                      {new Date(page.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditPage(page.id)} data-testid={`button-edit-${page.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => duplicatePageMutation.mutate(page.id)} disabled={duplicatePageMutation.isPending} data-testid={`button-duplicate-${page.id}`}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {page.status === "published" ? (
                        <Button variant="ghost" size="sm" onClick={() => unpublishPageMutation.mutate(page.id)} disabled={unpublishPageMutation.isPending} data-testid={`button-unpublish-${page.id}`}>
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => publishPageMutation.mutate(page.id)} disabled={publishPageMutation.isPending} data-testid={`button-publish-${page.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setShowDeleteDialog(page.id)} data-testid={`button-delete-${page.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg" data-testid="create-page-dialog">
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                data-testid="input-new-title"
                value={newTitle}
                onChange={(e) => {
                  setNewTitle(e.target.value);
                  setNewSlug(slugify(e.target.value));
                }}
                placeholder="Page title"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input
                data-testid="input-new-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="page-slug"
              />
            </div>
            <div className="space-y-2">
              <Label>Page Type</Label>
              <Select value={newPageType} onValueChange={setNewPageType}>
                <SelectTrigger data-testid="select-new-pageType"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="landing">Landing</SelectItem>
                  <SelectItem value="show_page">Show Page</SelectItem>
                  <SelectItem value="content_hub">Content Hub</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>AI Prompt (optional)</Label>
              <Textarea
                data-testid="input-new-aiPrompt"
                value={newAiPrompt}
                onChange={(e) => setNewAiPrompt(e.target.value)}
                placeholder="Describe the page you want AI to generate..."
                rows={3}
              />
            </div>
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>Template</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  <div
                    onClick={() => setSelectedTemplateId(null)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors text-center text-sm",
                      selectedTemplateId === null ? "border-blue-500 bg-blue-500/10" : "border-border hover:border-muted-foreground/30"
                    )}
                    data-testid="template-blank"
                  >
                    Blank Page
                  </div>
                  {templates.map((template: any) => (
                    <div
                      key={template.id}
                      onClick={() => setSelectedTemplateId(template.id)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors text-center text-sm",
                        selectedTemplateId === template.id ? "border-blue-500 bg-blue-500/10" : "border-border hover:border-muted-foreground/30"
                      )}
                      data-testid={`template-${template.id}`}
                    >
                      {template.name || template.title}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create">Cancel</Button>
            <Button onClick={handleCreatePage} disabled={!newTitle.trim() || createPageMutation.isPending} data-testid="button-confirm-create">
              {createPageMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Create Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
        <AlertDialogContent data-testid="delete-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Page</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this page? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => showDeleteDialog && deletePageMutation.mutate(showDeleteDialog)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deletePageMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}