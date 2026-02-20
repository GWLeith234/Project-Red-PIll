import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SortableList } from "@/components/ui/sortable-list";
import { ImageUploadField } from "@/components/ImageUploadField";
import {
  Type, Image, MousePointerClick, Minus, ArrowLeft,
  Plus, Trash2, Eye, Edit3, Save, Send, GripVertical,
  User, Building, Mail, Tag, Headphones, ShoppingBag,
  Share2, Layout, Square, Palette, ChevronDown, ChevronUp,
  Copy, ExternalLink, Sparkles, Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePodcasts, useProducts } from "@/lib/api";

export type BlockType = "header" | "richtext" | "image" | "button" | "divider" | "spacer" | "podcast_art" | "product_card" | "social_links";

export interface CampaignBlock {
  id: string;
  type: BlockType;
  content: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  caption?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  alignment?: "left" | "center" | "right";
  podcastId?: string;
  podcastTitle?: string;
  podcastImage?: string;
  productId?: string;
  productName?: string;
  productDescription?: string;
  productPrice?: string;
  productImage?: string;
  spacerHeight?: number;
  socialPlatforms?: string[];
}

interface CampaignBuilderProps {
  campaignName: string;
  campaignSubject: string;
  campaignType: "email" | "sms";
  blocks: CampaignBlock[];
  onNameChange: (name: string) => void;
  onSubjectChange: (subject: string) => void;
  onBlocksChange: (blocks: CampaignBlock[]) => void;
  onSave: () => void;
  onBack: () => void;
  isSaving?: boolean;
}

function genId() {
  return `blk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const BLOCK_PALETTE: { type: BlockType; label: string; icon: any; description: string }[] = [
  { type: "header", label: "Header", icon: Layout, description: "Logo & title banner" },
  { type: "richtext", label: "Rich Text", icon: Type, description: "Text with merge tags" },
  { type: "image", label: "Image", icon: Image, description: "Image with caption & link" },
  { type: "button", label: "Button / CTA", icon: MousePointerClick, description: "Call-to-action button" },
  { type: "divider", label: "Divider", icon: Minus, description: "Horizontal line" },
  { type: "spacer", label: "Spacer", icon: Square, description: "Vertical spacing" },
  { type: "podcast_art", label: "Podcast Art", icon: Headphones, description: "From your podcast library" },
  { type: "product_card", label: "Product Card", icon: ShoppingBag, description: "Upsell / lead gen card" },
  { type: "social_links", label: "Social Links", icon: Share2, description: "Social media links" },
];

const MERGE_TAGS = [
  { tag: "{{firstName}}", label: "First Name", icon: User },
  { tag: "{{lastName}}", label: "Last Name", icon: User },
  { tag: "{{email}}", label: "Email", icon: Mail },
  { tag: "{{company}}", label: "Company", icon: Building },
  { tag: "{{title}}", label: "Job Title", icon: Tag },
  { tag: "{{unsubscribeLink}}", label: "Unsubscribe Link", icon: ExternalLink },
];

export function serializeBlocks(blocks: CampaignBlock[]): string {
  return JSON.stringify({ version: 1, blocks });
}

export function deserializeBlocks(body: string): CampaignBlock[] {
  if (!body) return [createDefaultBlock("richtext")];
  try {
    const parsed = JSON.parse(body);
    if (parsed.version && Array.isArray(parsed.blocks)) {
      return parsed.blocks;
    }
  } catch {}
  return [{ id: genId(), type: "richtext", content: body }];
}

function createDefaultBlock(type: BlockType): CampaignBlock {
  const base: CampaignBlock = { id: genId(), type, content: "" };
  switch (type) {
    case "header":
      base.content = "Your Campaign Title";
      base.alignment = "center";
      break;
    case "button":
      base.linkText = "Click Here";
      base.linkUrl = "https://";
      base.buttonColor = "#6366f1";
      base.buttonTextColor = "#ffffff";
      base.alignment = "center";
      break;
    case "spacer":
      base.spacerHeight = 24;
      break;
    case "social_links":
      base.socialPlatforms = ["facebook", "twitter", "linkedin", "instagram"];
      break;
    case "richtext":
      base.content = "";
      break;
    case "image":
      base.alignment = "center";
      break;
  }
  return base;
}

function BlockPropertyEditor({ block, onChange, onInsertMergeTag }: {
  block: CampaignBlock;
  onChange: (block: CampaignBlock) => void;
  onInsertMergeTag: (tag: string) => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      {block.type === "header" && (
        <>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Header Text</label>
            <Input value={block.content} onChange={(e) => onChange({ ...block, content: e.target.value })} data-testid="input-block-header-text" />
          </div>
          <ImageUploadField
            label="Logo URL (optional)"
            value={block.imageUrl || ""}
            onChange={(url) => onChange({ ...block, imageUrl: url })}
            showPreview={true}
            previewHeight={64}
            testId="block-header-logo"
          />
        </>
      )}

      {block.type === "richtext" && (
        <>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Content</label>
            <Textarea
              value={block.content}
              onChange={(e) => onChange({ ...block, content: e.target.value })}
              rows={5}
              placeholder="Write your message here... Use merge tags for personalization."
              data-testid="input-block-richtext"
            />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Insert Merge Tag</label>
            <div className="flex flex-wrap gap-1">
              {MERGE_TAGS.map((mt) => {
                const Icon = mt.icon;
                return (
                  <Button
                    key={mt.tag}
                    variant="outline"
                    size="sm"
                    className="text-[10px] h-6 px-2 gap-1"
                    onClick={() => onInsertMergeTag(mt.tag)}
                    data-testid={`button-merge-tag-${mt.label.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <Icon className="h-2.5 w-2.5" /> {mt.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {block.type === "image" && (
        <>
          <ImageUploadField
            label="Image URL"
            value={block.imageUrl || ""}
            onChange={(url) => onChange({ ...block, imageUrl: url })}
            showPreview={true}
            previewHeight={160}
            testId="block-image"
          />
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Caption</label>
            <Input value={block.caption || ""} onChange={(e) => onChange({ ...block, caption: e.target.value })} data-testid="input-block-image-caption" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Link URL (optional)</label>
            <Input value={block.linkUrl || ""} onChange={(e) => onChange({ ...block, linkUrl: e.target.value })} placeholder="https://..." data-testid="input-block-image-link" />
          </div>
        </>
      )}

      {block.type === "button" && (
        <>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Button Text</label>
            <Input value={block.linkText || ""} onChange={(e) => onChange({ ...block, linkText: e.target.value })} data-testid="input-block-button-text" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Link URL</label>
            <Input value={block.linkUrl || ""} onChange={(e) => onChange({ ...block, linkUrl: e.target.value })} placeholder="https://..." data-testid="input-block-button-url" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Button Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={block.buttonColor || "#6366f1"} onChange={(e) => onChange({ ...block, buttonColor: e.target.value })} className="h-8 w-8 rounded cursor-pointer border-0" />
                <Input value={block.buttonColor || "#6366f1"} onChange={(e) => onChange({ ...block, buttonColor: e.target.value })} className="text-xs font-mono" />
              </div>
            </div>
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Text Color</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={block.buttonTextColor || "#ffffff"} onChange={(e) => onChange({ ...block, buttonTextColor: e.target.value })} className="h-8 w-8 rounded cursor-pointer border-0" />
                <Input value={block.buttonTextColor || "#ffffff"} onChange={(e) => onChange({ ...block, buttonTextColor: e.target.value })} className="text-xs font-mono" />
              </div>
            </div>
          </div>
        </>
      )}

      {block.type === "spacer" && (
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Height (px)</label>
          <Input type="number" value={block.spacerHeight || 24} onChange={(e) => onChange({ ...block, spacerHeight: parseInt(e.target.value) || 24 })} min={8} max={120} className="w-24" data-testid="input-block-spacer-height" />
        </div>
      )}

      {block.type === "podcast_art" && (
        <>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Linked Podcast</label>
            <p className="text-sm font-medium">{block.podcastTitle || "None selected"}</p>
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Caption Text</label>
            <Input value={block.content || ""} onChange={(e) => onChange({ ...block, content: e.target.value })} placeholder="Listen to the latest episode..." data-testid="input-block-podcast-caption" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Link URL</label>
            <Input value={block.linkUrl || ""} onChange={(e) => onChange({ ...block, linkUrl: e.target.value })} placeholder="https://..." data-testid="input-block-podcast-link" />
          </div>
        </>
      )}

      {block.type === "product_card" && (
        <>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Product</label>
            <p className="text-sm font-medium">{block.productName || "None selected"}</p>
            {block.productDescription && <p className="text-xs text-muted-foreground mt-1">{block.productDescription}</p>}
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">CTA Text</label>
            <Input value={block.linkText || "Learn More"} onChange={(e) => onChange({ ...block, linkText: e.target.value })} data-testid="input-block-product-cta" />
          </div>
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Link URL</label>
            <Input value={block.linkUrl || ""} onChange={(e) => onChange({ ...block, linkUrl: e.target.value })} placeholder="https://..." data-testid="input-block-product-link" />
          </div>
        </>
      )}

      {block.type === "social_links" && (
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Content Text</label>
          <Input value={block.content || "Follow us on social media"} onChange={(e) => onChange({ ...block, content: e.target.value })} data-testid="input-block-social-text" />
        </div>
      )}

      {["header", "richtext", "image", "button"].includes(block.type) && (
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Alignment</label>
          <div className="flex gap-1">
            {(["left", "center", "right"] as const).map((a) => (
              <Button key={a} variant={block.alignment === a ? "default" : "outline"} size="sm" className="text-xs flex-1 capitalize" onClick={() => onChange({ ...block, alignment: a })} data-testid={`button-align-${a}`}>
                {a}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BlockPreview({ block }: { block: CampaignBlock }) {
  const align = block.alignment || "left";
  const textAlign = { left: "text-left", center: "text-center", right: "text-right" }[align];

  switch (block.type) {
    case "header":
      return (
        <div className={cn("p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg", textAlign)}>
          {block.imageUrl && <img src={block.imageUrl} alt="Logo" className="max-h-10 object-contain mb-2 inline-block" />}
          <h2 className="text-lg font-bold font-display">{block.content || "Campaign Header"}</h2>
        </div>
      );
    case "richtext":
      return (
        <div className={cn("p-3", textAlign)}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{block.content || <span className="text-muted-foreground italic">Click to add text...</span>}</p>
        </div>
      );
    case "image":
      return (
        <div className={cn("p-2", textAlign)}>
          {block.imageUrl ? (
            <div>
              <img src={block.imageUrl} alt={block.caption || ""} className="max-w-full rounded-lg inline-block max-h-48 object-cover" />
              {block.caption && <p className="text-xs text-muted-foreground mt-1 italic">{block.caption}</p>}
            </div>
          ) : (
            <div className="border-2 border-dashed border-border/50 rounded-lg p-8 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Image className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Add an image URL</p>
              </div>
            </div>
          )}
        </div>
      );
    case "button":
      return (
        <div className={cn("p-4", textAlign)}>
          <a
            href={block.linkUrl || "#"}
            className="inline-block px-6 py-2.5 rounded-lg font-semibold text-sm no-underline"
            style={{ backgroundColor: block.buttonColor || "#6366f1", color: block.buttonTextColor || "#ffffff" }}
            onClick={(e) => e.preventDefault()}
          >
            {block.linkText || "Click Here"}
          </a>
        </div>
      );
    case "divider":
      return <div className="px-4 py-2"><Separator /></div>;
    case "spacer":
      return <div style={{ height: block.spacerHeight || 24 }} className="bg-muted/10 flex items-center justify-center"><span className="text-[10px] text-muted-foreground/30">{block.spacerHeight || 24}px</span></div>;
    case "podcast_art":
      return (
        <div className="p-3">
          <div className="flex items-center gap-3 bg-muted/20 rounded-lg p-3">
            {block.podcastImage ? (
              <img src={block.podcastImage} alt={block.podcastTitle || ""} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{block.podcastTitle || "Select a podcast"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{block.content || "Listen now"}</p>
            </div>
          </div>
        </div>
      );
    case "product_card":
      return (
        <div className="p-3">
          <div className="border border-border/50 rounded-lg overflow-hidden">
            {block.productImage && (
              <img src={block.productImage} alt={block.productName || ""} className="w-full h-32 object-cover" />
            )}
            <div className="p-3">
              <p className="font-semibold text-sm">{block.productName || "Select a product"}</p>
              {block.productDescription && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{block.productDescription}</p>}
              {block.productPrice && (
                <p className="text-sm font-bold text-primary mt-2">{block.productPrice}</p>
              )}
              <Button size="sm" className="mt-2 w-full text-xs" style={{ backgroundColor: "#6366f1" }}>
                {block.linkText || "Learn More"}
              </Button>
            </div>
          </div>
        </div>
      );
    case "social_links":
      return (
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground mb-2">{block.content || "Follow us"}</p>
          <div className="flex justify-center gap-3">
            {["facebook", "twitter", "linkedin", "instagram"].map((p) => (
              <div key={p} className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      );
    default:
      return <div className="p-3 text-muted-foreground text-sm">Unknown block</div>;
  }
}

function PodcastArtBrowser({ onSelect }: { onSelect: (podcast: any) => void }) {
  const { data: podcasts } = usePodcasts();
  return (
    <div className="space-y-2" data-testid="podcast-art-browser">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Podcast Cover Art</p>
      {(podcasts || []).length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No podcasts found</p>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {(podcasts || []).map((p: any) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="group relative rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all hover:ring-1 hover:ring-primary/30"
              data-testid={`podcast-art-${p.id}`}
            >
              {p.coverImage ? (
                <img src={p.coverImage} alt={p.title} className="w-full aspect-square object-cover" />
              ) : (
                <div className="w-full aspect-square bg-primary/10 flex items-center justify-center">
                  <Headphones className="h-8 w-8 text-primary/40" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-[10px] font-medium text-white truncate">{p.title}</p>
              </div>
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus className="h-6 w-6 text-white" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductBrowser({ onSelect }: { onSelect: (product: any) => void }) {
  const { data: products } = useProducts("active");
  return (
    <div className="space-y-2" data-testid="product-browser">
      <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Products & Offerings</p>
      {(products || []).length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No products found</p>
      ) : (
        <div className="space-y-2">
          {(products || []).map((p: any) => (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="w-full text-left p-2.5 rounded-lg border border-border/50 hover:border-primary/50 transition-all hover:bg-primary/5 group"
              data-testid={`product-item-${p.id}`}
            >
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShoppingBag className="h-4 w-4 text-primary/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground">{p.category} &bull; ${p.suggestedRetailRate || p.wholesaleRate || 0}/{p.rateModel}</p>
                  {p.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>}
                </div>
                <Plus className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CampaignBuilder({
  campaignName,
  campaignSubject,
  campaignType,
  blocks,
  onNameChange,
  onSubjectChange,
  onBlocksChange,
  onSave,
  onBack,
  isSaving,
}: CampaignBuilderProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<"properties" | "podcasts" | "products">("properties");
  const [previewMode, setPreviewMode] = useState(false);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  const addBlock = useCallback(
    (type: BlockType) => {
      const newBlock = createDefaultBlock(type);
      onBlocksChange([...blocks, newBlock]);
      setSelectedBlockId(newBlock.id);
      setRightPanel("properties");
    },
    [blocks, onBlocksChange]
  );

  const updateBlock = useCallback(
    (updated: CampaignBlock) => {
      onBlocksChange(blocks.map((b) => (b.id === updated.id ? updated : b)));
    },
    [blocks, onBlocksChange]
  );

  const deleteBlock = useCallback(
    (id: string) => {
      onBlocksChange(blocks.filter((b) => b.id !== id));
      if (selectedBlockId === id) setSelectedBlockId(null);
    },
    [blocks, onBlocksChange, selectedBlockId]
  );

  const duplicateBlock = useCallback(
    (id: string) => {
      const block = blocks.find((b) => b.id === id);
      if (!block) return;
      const copy = { ...block, id: genId() };
      const idx = blocks.findIndex((b) => b.id === id);
      const newBlocks = [...blocks];
      newBlocks.splice(idx + 1, 0, copy);
      onBlocksChange(newBlocks);
      setSelectedBlockId(copy.id);
    },
    [blocks, onBlocksChange]
  );

  const handleInsertMergeTag = useCallback(
    (tag: string) => {
      if (!selectedBlock || selectedBlock.type !== "richtext") return;
      updateBlock({ ...selectedBlock, content: (selectedBlock.content || "") + tag });
    },
    [selectedBlock, updateBlock]
  );

  const handleSelectPodcast = useCallback(
    (podcast: any) => {
      if (selectedBlock && selectedBlock.type === "podcast_art") {
        updateBlock({
          ...selectedBlock,
          podcastId: podcast.id,
          podcastTitle: podcast.title,
          podcastImage: podcast.coverImage || "",
          content: selectedBlock.content || `Listen to ${podcast.title}`,
        });
      } else {
        const newBlock = createDefaultBlock("podcast_art");
        newBlock.podcastId = podcast.id;
        newBlock.podcastTitle = podcast.title;
        newBlock.podcastImage = podcast.coverImage || "";
        newBlock.content = `Listen to ${podcast.title}`;
        onBlocksChange([...blocks, newBlock]);
        setSelectedBlockId(newBlock.id);
      }
      setRightPanel("properties");
    },
    [selectedBlock, blocks, onBlocksChange, updateBlock]
  );

  const handleSelectProduct = useCallback(
    (product: any) => {
      if (selectedBlock && selectedBlock.type === "product_card") {
        updateBlock({
          ...selectedBlock,
          productId: product.id,
          productName: product.name,
          productDescription: product.description || "",
          productPrice: `$${product.suggestedRetailRate || product.wholesaleRate || 0}/${product.rateModel}`,
          linkText: selectedBlock.linkText || "Learn More",
        });
      } else {
        const newBlock = createDefaultBlock("product_card");
        newBlock.productId = product.id;
        newBlock.productName = product.name;
        newBlock.productDescription = product.description || "";
        newBlock.productPrice = `$${product.suggestedRetailRate || product.wholesaleRate || 0}/${product.rateModel}`;
        newBlock.linkText = "Learn More";
        onBlocksChange([...blocks, newBlock]);
        setSelectedBlockId(newBlock.id);
      }
      setRightPanel("properties");
    },
    [selectedBlock, blocks, onBlocksChange, updateBlock]
  );

  if (previewMode) {
    return (
      <div className="min-h-screen bg-background" data-testid="campaign-preview-mode">
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/50 px-4 py-3">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => setPreviewMode(false)} data-testid="button-exit-preview">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Editor
            </Button>
            <Badge variant="outline" className="text-xs">Preview Mode</Badge>
          </div>
        </div>
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
            {blocks.map((block) => (
              <div key={block.id} className="text-gray-800">
                <BlockPreview block={block} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="campaign-builder">
      <div className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/50 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} data-testid="button-builder-back">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2">
              <Input
                value={campaignName}
                onChange={(e) => onNameChange(e.target.value)}
                className="font-display font-semibold text-sm border-0 bg-transparent h-8 p-0 focus-visible:ring-0 w-64"
                placeholder="Campaign Name..."
                data-testid="input-builder-campaign-name"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(true)} data-testid="button-preview-campaign">
              <Eye className="h-3.5 w-3.5 mr-1" /> Preview
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving} className="bg-primary text-primary-foreground" data-testid="button-save-campaign">
              <Save className="h-3.5 w-3.5 mr-1" /> {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
        {campaignType === "email" && (
          <div className="mt-2 flex items-center gap-2">
            <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Subject:</label>
            <Input
              value={campaignSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="text-sm border-0 bg-muted/30 h-7 rounded px-2 focus-visible:ring-1 flex-1"
              placeholder="Email subject line..."
              data-testid="input-builder-subject"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-56 border-r border-border/50 bg-card/30 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border/50">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Content Blocks</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {BLOCK_PALETTE.map((bp) => {
                const Icon = bp.icon;
                return (
                  <button
                    key={bp.type}
                    onClick={() => addBlock(bp.type)}
                    className="w-full text-left p-2 rounded-lg hover:bg-primary/10 transition-colors group flex items-center gap-2"
                    data-testid={`button-add-block-${bp.type}`}
                  >
                    <div className="w-7 h-7 rounded bg-muted/50 group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{bp.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{bp.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        <div className="flex-1 overflow-auto bg-muted/10">
          <div className="max-w-2xl mx-auto p-6">
            <div className="bg-card/50 rounded-xl border border-border/50 overflow-hidden min-h-[400px]">
              {blocks.length === 0 ? (
                <div className="p-12 text-center">
                  <Layout className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Start Building</h3>
                  <p className="text-xs text-muted-foreground/70 mb-4">Add content blocks from the left panel to build your campaign</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => addBlock("header")} data-testid="button-quick-add-header">
                      <Layout className="h-3 w-3 mr-1" /> Add Header
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => addBlock("richtext")} data-testid="button-quick-add-text">
                      <Type className="h-3 w-3 mr-1" /> Add Text
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => addBlock("image")} data-testid="button-quick-add-image">
                      <Image className="h-3 w-3 mr-1" /> Add Image
                    </Button>
                  </div>
                </div>
              ) : (
                <SortableList
                  items={blocks}
                  onReorder={onBlocksChange}
                  itemClassName="border-b border-border/30 last:border-b-0"
                  renderItem={(block, index) => (
                    <div
                      className={cn(
                        "relative group cursor-pointer transition-colors",
                        selectedBlockId === block.id ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-muted/20"
                      )}
                      onClick={() => {
                        setSelectedBlockId(block.id);
                        setRightPanel("properties");
                      }}
                      data-testid={`canvas-block-${index}`}
                    >
                      <BlockPreview block={block} />
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 bg-card/90 rounded-md border border-border/50 shadow-sm p-0.5">
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} data-testid={`button-duplicate-block-${index}`}>
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} data-testid={`button-delete-block-${index}`}>
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Badge variant="outline" className="text-[9px] bg-card/80 border-border/50 font-mono">
                          {BLOCK_PALETTE.find((p) => p.type === block.type)?.label}
                        </Badge>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </div>

        <div className="w-64 border-l border-border/50 bg-card/30 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-border/50">
            <div className="flex">
              <button
                onClick={() => setRightPanel("properties")}
                className={cn("flex-1 text-[10px] font-mono uppercase tracking-wider py-1.5 px-2 rounded-l transition-colors", rightPanel === "properties" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/30")}
              >
                Properties
              </button>
              <button
                onClick={() => setRightPanel("podcasts")}
                className={cn("flex-1 text-[10px] font-mono uppercase tracking-wider py-1.5 px-2 transition-colors", rightPanel === "podcasts" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/30")}
              >
                Podcasts
              </button>
              <button
                onClick={() => setRightPanel("products")}
                className={cn("flex-1 text-[10px] font-mono uppercase tracking-wider py-1.5 px-2 rounded-r transition-colors", rightPanel === "products" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/30")}
              >
                Products
              </button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3">
              {rightPanel === "properties" && (
                selectedBlock ? (
                  <BlockPropertyEditor
                    block={selectedBlock}
                    onChange={updateBlock}
                    onInsertMergeTag={handleInsertMergeTag}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Edit3 className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">Select a block to edit its properties</p>
                  </div>
                )
              )}
              {rightPanel === "podcasts" && (
                <PodcastArtBrowser onSelect={handleSelectPodcast} />
              )}
              {rightPanel === "products" && (
                <ProductBrowser onSelect={handleSelectProduct} />
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
