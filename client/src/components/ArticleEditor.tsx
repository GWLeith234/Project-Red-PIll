import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Type, Heading2, Heading3, Image, Quote, List, ListOrdered, Minus,
  GripVertical, Plus, Trash2, MoveUp, MoveDown, Eye, Edit3,
  Bold, Italic, Link, AlignLeft, FileText, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface EditorBlock {
  id: string;
  type: "paragraph" | "heading2" | "heading3" | "image" | "pullquote" | "bulletlist" | "numberedlist" | "divider";
  content: string;
  caption?: string;
  credit?: string;
}

interface ArticleEditorProps {
  title: string;
  description: string;
  coverImage: string;
  coverCaption: string;
  blocks: EditorBlock[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  summary: string;
  readingTime: number;
  onTitleChange: (val: string) => void;
  onDescriptionChange: (val: string) => void;
  onCoverImageChange: (val: string) => void;
  onCoverCaptionChange: (val: string) => void;
  onBlocksChange: (blocks: EditorBlock[]) => void;
  onSeoTitleChange: (val: string) => void;
  onSeoDescriptionChange: (val: string) => void;
  onSeoKeywordsChange: (val: string[]) => void;
  onSummaryChange: (val: string) => void;
  onReadingTimeChange: (val: number) => void;
}

function generateBlockId() {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const BLOCK_TYPES = [
  { type: "paragraph" as const, label: "Paragraph", icon: Type },
  { type: "heading2" as const, label: "Heading 2", icon: Heading2 },
  { type: "heading3" as const, label: "Heading 3", icon: Heading3 },
  { type: "image" as const, label: "Image", icon: Image },
  { type: "pullquote" as const, label: "Pull Quote", icon: Quote },
  { type: "bulletlist" as const, label: "Bullet List", icon: List },
  { type: "numberedlist" as const, label: "Numbered List", icon: ListOrdered },
  { type: "divider" as const, label: "Divider", icon: Minus },
];

function BlockEditor({
  block,
  index,
  total,
  onUpdate,
  onDelete,
  onMove,
}: {
  block: EditorBlock;
  index: number;
  total: number;
  onUpdate: (block: EditorBlock) => void;
  onDelete: () => void;
  onMove: (dir: "up" | "down") => void;
}) {
  const blockInfo = BLOCK_TYPES.find((b) => b.type === block.type);
  const Icon = blockInfo?.icon || Type;

  return (
    <div className="group relative flex gap-2 items-start" data-testid={`editor-block-${index}`}>
      <div className="flex flex-col items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onMove("up")}
          disabled={index === 0}
          data-testid={`button-move-up-${index}`}
        >
          <MoveUp className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onMove("down")}
          disabled={index === total - 1}
          data-testid={`button-move-down-${index}`}
        >
          <MoveDown className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={onDelete}
          data-testid={`button-delete-block-${index}`}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      <div className="flex-1 border border-border/50 rounded-lg p-3 hover:border-border transition-colors bg-card/30">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {blockInfo?.label}
          </span>
        </div>

        {block.type === "divider" ? (
          <div className="py-2">
            <Separator />
          </div>
        ) : block.type === "image" ? (
          <div className="space-y-2">
            <Input
              placeholder="Image URL..."
              value={block.content}
              onChange={(e) => onUpdate({ ...block, content: e.target.value })}
              className="text-sm"
              data-testid={`input-image-url-${index}`}
            />
            {block.content && (
              <div className="relative rounded-lg overflow-hidden bg-muted/30 max-h-48">
                <img
                  src={block.content}
                  alt={block.caption || ""}
                  className="w-full h-full object-cover max-h-48"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
            <Input
              placeholder="Caption (optional)..."
              value={block.caption || ""}
              onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
              className="text-sm text-muted-foreground"
              data-testid={`input-image-caption-${index}`}
            />
            <Input
              placeholder="Credit / Source (optional)..."
              value={block.credit || ""}
              onChange={(e) => onUpdate({ ...block, credit: e.target.value })}
              className="text-xs text-muted-foreground"
              data-testid={`input-image-credit-${index}`}
            />
          </div>
        ) : block.type === "pullquote" ? (
          <div className="space-y-2">
            <Textarea
              placeholder="Enter the quote text..."
              value={block.content}
              onChange={(e) => onUpdate({ ...block, content: e.target.value })}
              rows={2}
              className="text-sm italic border-l-4 border-primary/50 pl-3"
              data-testid={`input-quote-${index}`}
            />
            <Input
              placeholder="Attribution (optional)..."
              value={block.caption || ""}
              onChange={(e) => onUpdate({ ...block, caption: e.target.value })}
              className="text-xs text-muted-foreground"
              data-testid={`input-quote-attribution-${index}`}
            />
          </div>
        ) : block.type === "heading2" || block.type === "heading3" ? (
          <Input
            placeholder={block.type === "heading2" ? "Section heading..." : "Subheading..."}
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            className={cn(
              "border-0 bg-transparent p-0 focus-visible:ring-0",
              block.type === "heading2" ? "text-xl font-bold" : "text-lg font-semibold"
            )}
            data-testid={`input-heading-${index}`}
          />
        ) : block.type === "bulletlist" || block.type === "numberedlist" ? (
          <Textarea
            placeholder="Enter list items, one per line..."
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            rows={4}
            className="text-sm font-mono"
            data-testid={`input-list-${index}`}
          />
        ) : (
          <Textarea
            placeholder="Write your paragraph..."
            value={block.content}
            onChange={(e) => onUpdate({ ...block, content: e.target.value })}
            rows={3}
            className="text-sm"
            data-testid={`input-paragraph-${index}`}
          />
        )}
      </div>
    </div>
  );
}

function ArticlePreview({
  title,
  description,
  coverImage,
  coverCaption,
  blocks,
  readingTime,
}: {
  title: string;
  description: string;
  coverImage: string;
  coverCaption: string;
  blocks: EditorBlock[];
  readingTime: number;
}) {
  return (
    <div className="max-w-2xl mx-auto" data-testid="article-preview">
      <div className="mb-6">
        <Badge variant="outline" className="text-xs mb-3 border-primary/50 text-primary">
          Article Preview
        </Badge>
        <h1 className="text-3xl font-bold leading-tight mb-3">{title || "Untitled Article"}</h1>
        {description && (
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">{description}</p>
        )}
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" /> Staff Writer
          </span>
          <span>&bull;</span>
          {readingTime > 0 && (
            <>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" /> {readingTime} min read
              </span>
              <span>&bull;</span>
            </>
          )}
          <span>Just now</span>
        </div>
      </div>

      {coverImage && (
        <figure className="mb-6">
          <div className="rounded-lg overflow-hidden">
            <img src={coverImage} alt={title} className="w-full object-cover max-h-96" />
          </div>
          {coverCaption && (
            <figcaption className="text-xs text-muted-foreground mt-2 italic">{coverCaption}</figcaption>
          )}
        </figure>
      )}

      <div className="prose prose-invert max-w-none space-y-4">
        {blocks.map((block) => {
          switch (block.type) {
            case "paragraph":
              return block.content ? (
                <p key={block.id} className="text-base leading-relaxed text-foreground/90">
                  {block.content}
                </p>
              ) : null;
            case "heading2":
              return block.content ? (
                <h2 key={block.id} className="text-2xl font-bold mt-8 mb-3">
                  {block.content}
                </h2>
              ) : null;
            case "heading3":
              return block.content ? (
                <h3 key={block.id} className="text-xl font-semibold mt-6 mb-2">
                  {block.content}
                </h3>
              ) : null;
            case "image":
              return block.content ? (
                <figure key={block.id} className="my-6">
                  <div className="rounded-lg overflow-hidden">
                    <img src={block.content} alt={block.caption || ""} className="w-full object-cover" />
                  </div>
                  {(block.caption || block.credit) && (
                    <figcaption className="text-xs text-muted-foreground mt-2">
                      {block.caption && <span className="italic">{block.caption}</span>}
                      {block.caption && block.credit && " — "}
                      {block.credit && <span>{block.credit}</span>}
                    </figcaption>
                  )}
                </figure>
              ) : null;
            case "pullquote":
              return block.content ? (
                <blockquote
                  key={block.id}
                  className="border-l-4 border-primary/60 pl-6 my-6 py-2"
                >
                  <p className="text-lg italic text-foreground/80 leading-relaxed">
                    "{block.content}"
                  </p>
                  {block.caption && (
                    <cite className="text-sm text-muted-foreground mt-2 block not-italic">
                      — {block.caption}
                    </cite>
                  )}
                </blockquote>
              ) : null;
            case "bulletlist":
              return block.content ? (
                <ul key={block.id} className="list-disc pl-6 space-y-1.5 my-4">
                  {block.content.split("\n").filter(Boolean).map((item, i) => (
                    <li key={i} className="text-base text-foreground/90 leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null;
            case "numberedlist":
              return block.content ? (
                <ol key={block.id} className="list-decimal pl-6 space-y-1.5 my-4">
                  {block.content.split("\n").filter(Boolean).map((item, i) => (
                    <li key={i} className="text-base text-foreground/90 leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ol>
              ) : null;
            case "divider":
              return <hr key={block.id} className="my-8 border-border/50" />;
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}

export function blocksToMarkdown(blocks: EditorBlock[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          return block.content;
        case "heading2":
          return `## ${block.content}`;
        case "heading3":
          return `### ${block.content}`;
        case "image":
          const parts = [`![${block.caption || ""}](${block.content})`];
          if (block.caption || block.credit) {
            const meta = [block.caption, block.credit].filter(Boolean).join(" — ");
            parts.push(`*${meta}*`);
          }
          return parts.join("\n");
        case "pullquote":
          const lines = [`> "${block.content}"`];
          if (block.caption) lines.push(`> — ${block.caption}`);
          return lines.join("\n");
        case "bulletlist":
          return block.content
            .split("\n")
            .filter(Boolean)
            .map((item) => `- ${item}`)
            .join("\n");
        case "numberedlist":
          return block.content
            .split("\n")
            .filter(Boolean)
            .map((item, i) => `${i + 1}. ${item}`)
            .join("\n");
        case "divider":
          return "---";
        default:
          return block.content;
      }
    })
    .join("\n\n");
}

export function markdownToBlocks(markdown: string): EditorBlock[] {
  if (!markdown || !markdown.trim()) return [{ id: generateBlockId(), type: "paragraph", content: "" }];

  const lines = markdown.split("\n");
  const blocks: EditorBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({ id: generateBlockId(), type: "divider", content: "" });
      i++;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push({ id: generateBlockId(), type: "heading2", content: trimmed.replace("## ", "") });
      i++;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push({ id: generateBlockId(), type: "heading3", content: trimmed.replace("### ", "") });
      i++;
      continue;
    }

    if (trimmed.startsWith("![")) {
      const imgMatch = trimmed.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (imgMatch) {
        const block: EditorBlock = { id: generateBlockId(), type: "image", content: imgMatch[2], caption: imgMatch[1] || "" };
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith("*")) {
          const creditLine = lines[i + 1].trim().replace(/^\*|\*$/g, "");
          const creditParts = creditLine.split(" — ");
          if (creditParts.length > 1) {
            block.caption = creditParts[0];
            block.credit = creditParts.slice(1).join(" — ");
          } else {
            block.caption = creditLine;
          }
          i++;
        }
        blocks.push(block);
        i++;
        continue;
      }
    }

    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ""));
        i++;
      }
      const content = quoteLines[0]?.replace(/^"|"$/g, "") || "";
      const attribution = quoteLines.length > 1 ? quoteLines[quoteLines.length - 1].replace(/^—\s*/, "") : "";
      blocks.push({ id: generateBlockId(), type: "pullquote", content, caption: attribution || undefined });
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const listItems: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith("- ") || lines[i].trim().startsWith("* "))) {
        listItems.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      blocks.push({ id: generateBlockId(), type: "bulletlist", content: listItems.join("\n") });
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({ id: generateBlockId(), type: "numberedlist", content: listItems.join("\n") });
      continue;
    }

    blocks.push({ id: generateBlockId(), type: "paragraph", content: trimmed });
    i++;
  }

  if (blocks.length === 0) {
    blocks.push({ id: generateBlockId(), type: "paragraph", content: "" });
  }

  return blocks;
}

export default function ArticleEditor({
  title,
  description,
  coverImage,
  coverCaption,
  blocks,
  seoTitle,
  seoDescription,
  seoKeywords,
  summary,
  readingTime,
  onTitleChange,
  onDescriptionChange,
  onCoverImageChange,
  onCoverCaptionChange,
  onBlocksChange,
  onSeoTitleChange,
  onSeoDescriptionChange,
  onSeoKeywordsChange,
  onSummaryChange,
  onReadingTimeChange,
}: ArticleEditorProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  const addBlock = useCallback(
    (type: EditorBlock["type"], afterIndex?: number) => {
      const newBlock: EditorBlock = { id: generateBlockId(), type, content: "" };
      const newBlocks = [...blocks];
      const insertAt = afterIndex !== undefined ? afterIndex + 1 : newBlocks.length;
      newBlocks.splice(insertAt, 0, newBlock);
      onBlocksChange(newBlocks);
      setShowAddMenu(false);
    },
    [blocks, onBlocksChange]
  );

  const updateBlock = useCallback(
    (index: number, block: EditorBlock) => {
      const newBlocks = [...blocks];
      newBlocks[index] = block;
      onBlocksChange(newBlocks);
    },
    [blocks, onBlocksChange]
  );

  const deleteBlock = useCallback(
    (index: number) => {
      if (blocks.length <= 1) return;
      const newBlocks = blocks.filter((_, i) => i !== index);
      onBlocksChange(newBlocks);
    },
    [blocks, onBlocksChange]
  );

  const moveBlock = useCallback(
    (index: number, dir: "up" | "down") => {
      const newBlocks = [...blocks];
      const targetIndex = dir === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      onBlocksChange(newBlocks);
    },
    [blocks, onBlocksChange]
  );

  return (
    <div className="space-y-0" data-testid="article-editor">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="edit" className="gap-1.5">
              <Edit3 className="w-3.5 h-3.5" /> Editor
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Preview
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" /> SEO
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="edit" className="space-y-6 mt-0">
          <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/30">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Headline</Label>
              <Input
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="Article headline..."
                className="text-xl font-bold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/40"
                data-testid="input-editor-title"
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Subheadline</Label>
              <Textarea
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Brief description or teaser for the article..."
                rows={2}
                className="text-base border-0 bg-transparent p-0 focus-visible:ring-0 resize-none placeholder:text-muted-foreground/40"
                data-testid="input-editor-description"
              />
            </div>
            <Separator className="my-2" />
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 block">Cover Image</Label>
              <div className="flex gap-3">
                <Input
                  value={coverImage}
                  onChange={(e) => onCoverImageChange(e.target.value)}
                  placeholder="Image URL for the hero/cover image..."
                  className="text-sm flex-1"
                  data-testid="input-editor-cover-image"
                />
              </div>
              {coverImage && (
                <div className="mt-2 rounded-lg overflow-hidden max-h-40 bg-muted/30">
                  <img src={coverImage} alt="Cover" className="w-full object-cover max-h-40" />
                </div>
              )}
              <Input
                value={coverCaption}
                onChange={(e) => onCoverCaptionChange(e.target.value)}
                placeholder="Image caption / credit..."
                className="text-xs text-muted-foreground mt-2"
                data-testid="input-editor-cover-caption"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Content Blocks</Label>
              <span className="text-xs text-muted-foreground">{blocks.length} block{blocks.length !== 1 ? "s" : ""}</span>
            </div>

            {blocks.map((block, index) => (
              <BlockEditor
                key={block.id}
                block={block}
                index={index}
                total={blocks.length}
                onUpdate={(b) => updateBlock(index, b)}
                onDelete={() => deleteBlock(index)}
                onMove={(dir) => moveBlock(index, dir)}
              />
            ))}

            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed gap-2"
                onClick={() => setShowAddMenu(!showAddMenu)}
                data-testid="button-add-block"
              >
                <Plus className="w-4 h-4" /> Add Block
              </Button>
              {showAddMenu && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-popover border border-border rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1">
                  {BLOCK_TYPES.map((bt) => {
                    const BIcon = bt.icon;
                    return (
                      <Button
                        key={bt.type}
                        variant="ghost"
                        size="sm"
                        className="flex flex-col items-center gap-1 h-auto py-3 px-2"
                        onClick={() => addBlock(bt.type)}
                        data-testid={`button-add-${bt.type}`}
                      >
                        <BIcon className="w-4 h-4" />
                        <span className="text-[10px]">{bt.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="preview" className="mt-0">
          <div className="p-6 rounded-lg border border-border/50 bg-card/30 min-h-[400px]">
            <ArticlePreview
              title={title}
              description={description}
              coverImage={coverImage}
              coverCaption={coverCaption}
              blocks={blocks}
              readingTime={readingTime}
            />
          </div>
        </TabsContent>

        <TabsContent value="seo" className="mt-0">
          <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-card/30">
            <div>
              <Label>Summary</Label>
              <Textarea
                value={summary}
                onChange={(e) => onSummaryChange(e.target.value)}
                rows={3}
                placeholder="Brief article summary for cards and listings..."
                className="text-sm"
                data-testid="input-editor-summary"
              />
            </div>
            <div>
              <Label>Reading Time (minutes)</Label>
              <Input
                type="number"
                value={readingTime || ""}
                onChange={(e) => onReadingTimeChange(parseInt(e.target.value) || 0)}
                min={1}
                max={60}
                className="w-32"
                data-testid="input-editor-reading-time"
              />
            </div>
            <Separator />
            <div>
              <Label>SEO Title</Label>
              <Input
                value={seoTitle}
                onChange={(e) => onSeoTitleChange(e.target.value)}
                placeholder="SEO-optimized title (50-60 chars)..."
                data-testid="input-editor-seo-title"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {seoTitle.length}/60 characters
                <span className={cn("ml-2", seoTitle.length > 60 ? "text-destructive" : "text-emerald-500")}>
                  {seoTitle.length > 60 ? "Too long" : "Good"}
                </span>
              </p>
            </div>
            <div>
              <Label>SEO Description</Label>
              <Textarea
                value={seoDescription}
                onChange={(e) => onSeoDescriptionChange(e.target.value)}
                rows={2}
                placeholder="Meta description for search engines (120-160 chars)..."
                data-testid="input-editor-seo-description"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {seoDescription.length}/160 characters
                <span className={cn("ml-2", seoDescription.length > 160 ? "text-destructive" : "text-emerald-500")}>
                  {seoDescription.length > 160 ? "Too long" : "Good"}
                </span>
              </p>
            </div>
            <div>
              <Label>Keywords (comma-separated)</Label>
              <Input
                value={seoKeywords.join(", ")}
                onChange={(e) =>
                  onSeoKeywordsChange(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="keyword1, keyword2, keyword3..."
                data-testid="input-editor-seo-keywords"
              />
              <div className="flex gap-1 flex-wrap mt-2">
                {seoKeywords.map((kw, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
