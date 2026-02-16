import { useState } from "react";
import { useLocation } from "wouter";
import PageHeader from "@/components/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot, CheckCircle2, XCircle, Eye, Edit3, Clock, FileText, Sparkles,
  Loader2, Wand2, Tag, Newspaper, Send,
  MessageSquare, Scissors, Mail, Search as SearchIcon, Globe,
  LayoutGrid, Mic, Film, Rocket, CalendarClock,
  ExternalLink, Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SortableList } from "@/components/ui/sortable-list";
import {
  useModerationQueue, useModerationCounts, useApproveStory, useRejectStory,
  useUpdateModerationPiece, useGenerateStory, useEpisodes, usePodcasts,
  useClipAssets, useUpdateClipAsset, useReorderContentPieces
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ArticleEditor, { type EditorBlock, markdownToBlocks, blocksToMarkdown } from "@/components/ArticleEditor";

const CONTENT_TABS = [
  { id: "all", label: "All Content", icon: LayoutGrid, type: undefined },
  { id: "article", label: "Articles", icon: Newspaper, type: "article" },
  { id: "blog", label: "Blogs", icon: FileText, type: "blog" },
  { id: "social", label: "Social Posts", icon: MessageSquare, type: "social" },
  { id: "clip", label: "Clips", icon: Scissors, type: "clip" },
  { id: "newsletter", label: "Newsletters", icon: Mail, type: "newsletter" },
  { id: "seo", label: "SEO Assets", icon: Globe, type: "seo" },
];

function getStatusConfig(status: string) {
  switch (status) {
    case "review": return { label: "Pending Review", color: "border-amber-500/50 text-amber-500 bg-amber-500/10", icon: Clock };
    case "draft": return { label: "Draft", color: "border-blue-500/50 text-blue-500 bg-blue-500/10", icon: Edit3 };
    case "pending": return { label: "Pending", color: "border-violet-500/50 text-violet-500 bg-violet-500/10", icon: Clock };
    case "suggested": return { label: "Suggested", color: "border-pink-500/50 text-pink-500 bg-pink-500/10", icon: Sparkles };
    default: return { label: status, color: "border-muted-foreground/50 text-muted-foreground", icon: Clock };
  }
}

function getTypeConfig(type: string) {
  switch (type) {
    case "article": return { label: "Article", icon: Newspaper, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
    case "blog": return { label: "Blog Post", icon: FileText, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" };
    case "social": return { label: "Social Post", icon: MessageSquare, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" };
    case "newsletter": return { label: "Newsletter", icon: Mail, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" };
    case "clip": return { label: "Clip", icon: Scissors, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" };
    case "seo": return { label: "SEO Asset", icon: Globe, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" };
    default: return { label: type, icon: FileText, color: "text-muted-foreground bg-muted/10 border-muted/20" };
  }
}

export default function ModerationQueue() {
  const [, navigate] = useLocation();
  const { data: counts } = useModerationCounts();
  const { data: episodes } = useEpisodes();
  const { data: podcasts } = usePodcasts();
  const { data: allClips } = useClipAssets();
  const approveStory = useApproveStory();
  const rejectStory = useRejectStory();
  const updatePiece = useUpdateModerationPiece();
  const updateClip = useUpdateClipAsset();
  const generateStory = useGenerateStory();
  const reorderContent = useReorderContentPieces();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editorBlocks, setEditorBlocks] = useState<EditorBlock[]>([]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState({ episodeId: "", transcript: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [shipPreviewItem, setShipPreviewItem] = useState<any | null>(null);

  const activeType = CONTENT_TABS.find(t => t.id === activeTab)?.type;
  const isClipTab = activeTab === "clip";
  const { data: queue, isLoading } = useModerationQueue(isClipTab ? undefined : activeType);

  const pendingClips = (allClips || []).filter((c: any) =>
    c.status === "suggested" || c.status === "draft" || c.status === "review"
  ).map((c: any) => {
    const ep = (episodes || []).find((e: any) => e.id === c.episodeId);
    const podcast = ep ? (podcasts || []).find((p: any) => p.id === ep.podcastId) : null;
    return { ...c, type: "clip", _isClip: true, episode: ep ? { ...ep, podcast } : null };
  });

  const combinedQueue = (() => {
    if (isClipTab) return pendingClips;
    const contentItems = (queue || []).filter((item: any) => activeType ? item.type === activeType : true);
    if (activeTab === "all") return [...contentItems, ...pendingClips];
    return contentItems;
  })();

  const filteredQueue = combinedQueue.filter((item: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (item.title?.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q) || item.body?.toLowerCase().includes(q) || item.hookText?.toLowerCase().includes(q));
  });

  const handleReorderContent = async (reordered: any[]) => {
    const ids = reordered.map((item: any) => item.id);
    try {
      await reorderContent.mutateAsync(ids);
    } catch (err: any) {
      toast({ title: "Reorder Failed", description: err.message, variant: "destructive" });
    }
  };

  function openEditor(item: any) {
    setEditItem({ ...item });
    setEditorBlocks(markdownToBlocks(item.body || ""));
  }

  function handleApprove(item: any) {
    setShipPreviewItem(item);
  }

  function handleShipNow() {
    if (!shipPreviewItem) return;
    const item = shipPreviewItem;
    if (item._isClip) {
      updateClip.mutate({ id: item.id, data: { status: "approved" } }, {
        onSuccess: () => { toast({ title: "Clip Approved & Shipped", description: "The clip is now live." }); setShipPreviewItem(null); },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    } else {
      approveStory.mutate(item.id, {
        onSuccess: () => { toast({ title: "Content Shipped", description: "The content is now live on your site." }); setShipPreviewItem(null); },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    }
  }

  function handleReject(item: any) {
    if (item._isClip) {
      updateClip.mutate({ id: item.id, data: { status: "rejected" } }, {
        onSuccess: () => toast({ title: "Clip Rejected", description: "Removed from the queue." }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    } else {
      rejectStory.mutate(item.id, {
        onSuccess: () => toast({ title: "Content Rejected", description: "Removed from the queue." }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    }
  }

  function handleSaveEdit() {
    if (!editItem) return;
    const body = blocksToMarkdown(editorBlocks);
    updatePiece.mutate(
      {
        id: editItem.id,
        data: {
          title: editItem.title, body,
          description: editItem.description, coverImage: editItem.coverImage,
          seoTitle: editItem.seoTitle, seoDescription: editItem.seoDescription,
          seoKeywords: editItem.seoKeywords, summary: editItem.summary,
          readingTime: editItem.readingTime,
        },
      },
      {
        onSuccess: () => { toast({ title: "Content Updated" }); setEditItem(null); },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  }

  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!genForm.episodeId) return;
    generateStory.mutate(
      { episodeId: genForm.episodeId, transcript: genForm.transcript || undefined },
      {
        onSuccess: () => {
          toast({ title: "Story Generated", description: "AI has created a new story. It's now in the moderation queue." });
          setGenerateOpen(false);
          setGenForm({ episodeId: "", transcript: "" });
        },
        onError: (err: any) => toast({ title: "Generation Failed", description: err.message, variant: "destructive" }),
      }
    );
  }

  const totalCount = counts?._total || 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700" data-testid="moderation-queue-page">
      <PageHeader pageKey="moderation" onPrimaryAction={() => setGenerateOpen(true)} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CONTENT_TABS.filter(t => t.id !== "all").map(tab => {
          const count = counts?.[tab.type!] || 0;
          const typeConf = getTypeConfig(tab.type!);
          const Icon = tab.icon;
          return (
            <Card
              key={tab.id}
              className={cn(
                "cursor-pointer border transition-all hover:border-primary/30",
                activeTab === tab.id ? "border-primary/50 bg-primary/5" : "border-border/50 bg-card/50"
              )}
              onClick={() => setActiveTab(tab.id)}
              data-testid={`counter-card-${tab.id}`}
            >
              <CardContent className="pt-4 pb-3 px-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border", typeConf.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {count > 0 && (
                    <Badge variant="outline" className="font-mono text-[10px] font-bold border-primary/30 text-primary">{count}</Badge>
                  )}
                </div>
                <p className="text-sm font-semibold">{tab.label}</p>
                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                  {count === 0 ? "No items" : `${count} pending`}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:flex-1 sm:max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/50 border-border/50 font-mono text-sm"
            data-testid="input-search-moderation"
          />
        </div>
        <div className="w-full sm:w-auto overflow-x-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card/50 border border-border/50 p-1 h-auto">
            {CONTENT_TABS.map(tab => {
              const Icon = tab.icon;
              const count = tab.id === "all" ? totalCount : (counts?.[tab.type!] || 0);
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="font-mono text-[10px] uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="mr-1 h-3 w-3" />
                  {tab.label}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 text-[9px] font-mono px-1">{count}</Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
        </div>
      ) : filteredQueue.length === 0 ? (
        <Card className="bg-card/50 border-border/50 border-dashed border-2">
          <CardContent className="py-16 text-center">
            <Bot className="w-14 h-14 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 font-display">
              {searchQuery ? "No matching content" : activeTab === "all" ? "No Content Pending Review" : `No ${CONTENT_TABS.find(t => t.id === activeTab)?.label} Pending`}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {searchQuery
                ? "Try a different search term or clear the filter."
                : "Run the pipeline on an episode to generate content, or click \"Generate Story\" to create an article."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <SortableList
          items={filteredQueue}
          onReorder={handleReorderContent}
          renderItem={(item: any) => (
            <ContentCard
              item={item}
              onPreview={() => setPreviewItem(item)}
              onEdit={() => openEditor(item)}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              approving={approveStory.isPending || updateClip.isPending}
              rejecting={rejectStory.isPending || updateClip.isPending}
            />
          )}
          renderOverlay={(item: any) => (
            <div className="p-3 bg-card rounded-lg border border-primary/30">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground font-mono capitalize">{item.type}</p>
            </div>
          )}
          className="space-y-1"
        />
      )}

      <PreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />

      <LiveSitePreviewDialog
        item={shipPreviewItem}
        onClose={() => setShipPreviewItem(null)}
        onShipNow={handleShipNow}
        onSchedule={() => {
          setShipPreviewItem(null);
          navigate("/scheduler");
        }}
        shipping={approveStory.isPending || updateClip.isPending}
      />

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Edit3 className="w-5 h-5 text-primary" /> Content Editor
            </DialogTitle>
            {editItem?.episode && (
              <p className="text-sm text-muted-foreground font-mono">
                Source: {editItem.episode.title}
                {editItem.episode.podcast && ` · ${editItem.episode.podcast.title}`}
              </p>
            )}
          </DialogHeader>
          {editItem && (
            <ArticleEditor
              title={editItem.title || ""}
              description={editItem.description || ""}
              coverImage={editItem.coverImage || ""}
              coverCaption=""
              blocks={editorBlocks}
              seoTitle={editItem.seoTitle || ""}
              seoDescription={editItem.seoDescription || ""}
              seoKeywords={editItem.seoKeywords || []}
              summary={editItem.summary || ""}
              readingTime={editItem.readingTime || 0}
              onTitleChange={(val) => setEditItem({ ...editItem, title: val })}
              onDescriptionChange={(val) => setEditItem({ ...editItem, description: val })}
              onCoverImageChange={(val) => setEditItem({ ...editItem, coverImage: val })}
              onCoverCaptionChange={() => {}}
              onBlocksChange={setEditorBlocks}
              onSeoTitleChange={(val) => setEditItem({ ...editItem, seoTitle: val })}
              onSeoDescriptionChange={(val) => setEditItem({ ...editItem, seoDescription: val })}
              onSeoKeywordsChange={(val) => setEditItem({ ...editItem, seoKeywords: val })}
              onSummaryChange={(val) => setEditItem({ ...editItem, summary: val })}
              onReadingTimeChange={(val) => setEditItem({ ...editItem, readingTime: val })}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updatePiece.isPending} data-testid="button-save-edit">
              {updatePiece.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <Wand2 className="w-5 h-5 text-primary" /> Generate Story from Episode
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <Label className="font-mono text-xs uppercase tracking-wider">Select Episode</Label>
              <Select value={genForm.episodeId} onValueChange={(val) => setGenForm({ ...genForm, episodeId: val })}>
                <SelectTrigger data-testid="select-episode">
                  <SelectValue placeholder="Choose an episode..." />
                </SelectTrigger>
                <SelectContent>
                  {episodes?.map((ep: any) => {
                    const podcast = podcasts?.find((p: any) => p.id === ep.podcastId);
                    return (
                      <SelectItem key={ep.id} value={ep.id}>
                        {ep.title} {podcast ? `(${podcast.title})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-mono text-xs uppercase tracking-wider">Transcript (optional)</Label>
              <Textarea
                value={genForm.transcript}
                onChange={(e) => setGenForm({ ...genForm, transcript: e.target.value })}
                rows={6}
                placeholder="Paste the episode transcript here, or leave empty to use auto-transcription..."
                className="text-sm"
                data-testid="input-transcript"
              />
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                If left empty, the AI will transcribe from the audio file.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setGenerateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!genForm.episodeId || generateStory.isPending} data-testid="button-submit-generate">
                {generateStory.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />Generate Story</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function renderLiveMarkdownBlock(block: string, key: number) {
  const trimmed = block.trim();
  if (!trimmed) return null;
  if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
    return <hr key={key} className="my-6 border-border" />;
  }
  if (trimmed.startsWith("## ")) {
    return <h2 key={key} className="text-2xl font-bold text-foreground mt-8 mb-3">{trimmed.replace("## ", "")}</h2>;
  }
  if (trimmed.startsWith("### ")) {
    return <h3 key={key} className="text-xl font-semibold text-foreground mt-6 mb-2">{trimmed.replace("### ", "")}</h3>;
  }
  if (trimmed.startsWith("> ")) {
    const lines = trimmed.split("\n").map((l: string) => l.replace(/^>\s*/, ""));
    const quoteText = lines[0]?.replace(/^"|"$/g, "") || "";
    return (
      <blockquote key={key} className="border-l-4 border-blue-500 pl-5 my-6 py-1">
        <p className="text-lg italic text-muted-foreground leading-relaxed">"{quoteText}"</p>
      </blockquote>
    );
  }
  const bulletLines = trimmed.split("\n");
  if (bulletLines.every((l: string) => /^[-*]\s/.test(l.trim()))) {
    return (
      <ul key={key} className="list-disc pl-6 space-y-1.5 my-4">
        {bulletLines.map((item: string, i: number) => (
          <li key={i} className="text-foreground text-[16px] leading-relaxed">{item.trim().replace(/^[-*]\s+/, "")}</li>
        ))}
      </ul>
    );
  }
  if (bulletLines.every((l: string) => /^\d+\.\s/.test(l.trim()))) {
    return (
      <ol key={key} className="list-decimal pl-6 space-y-1.5 my-4">
        {bulletLines.map((item: string, i: number) => (
          <li key={i} className="text-foreground text-[16px] leading-relaxed">{item.trim().replace(/^\d+\.\s+/, "")}</li>
        ))}
      </ol>
    );
  }
  return <p key={key} className="text-foreground leading-relaxed mb-4 text-[16px]">{trimmed}</p>;
}

function LiveSitePreviewDialog({ item, onClose, onShipNow, onSchedule, shipping }: {
  item: any;
  onClose: () => void;
  onShipNow: () => void;
  onSchedule: () => void;
  shipping: boolean;
}) {
  if (!item) return null;
  const isClip = item._isClip || item.type === "clip";
  const isSocial = item.type === "social";
  const isSeo = item.type === "seo";
  const isNewsletter = item.type === "newsletter";
  const typeConf = getTypeConfig(item.type);
  const contentBlocks = item.body ? item.body.split("\n\n") : [];

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col p-0" data-testid="dialog-live-preview">
        <div className="bg-gradient-to-r from-emerald-500/10 via-primary/10 to-blue-500/10 border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Eye className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold">Live Site Preview</h3>
                <p className="text-xs font-mono text-muted-foreground">This is how your content will appear to readers</p>
              </div>
            </div>
            <Badge variant="outline" className={cn("font-mono text-xs", typeConf.color)}>
              {typeConf.label}
            </Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="bg-muted min-h-[400px]">
            {isClip ? (
              <div className="max-w-2xl mx-auto px-6 py-8">
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                      <Scissors className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.episode?.podcast?.title || "Podcast"}</p>
                      <p className="text-xs text-muted-foreground">{item.episode?.title || "Episode"}</p>
                    </div>
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-3">{item.title}</h1>
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 mb-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Start</p>
                        <p className="text-lg font-mono font-bold text-foreground">{item.startTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">End</p>
                        <p className="text-lg font-mono font-bold text-foreground">{item.endTime}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Viral Score</p>
                        <p className="text-lg font-mono font-bold text-pink-600">{item.viralScore}/100</p>
                      </div>
                    </div>
                  </div>
                  {item.hookText && (
                    <blockquote className="border-l-4 border-pink-400 pl-4 my-4">
                      <p className="text-lg italic text-muted-foreground">"{item.hookText}"</p>
                    </blockquote>
                  )}
                  {item.transcriptExcerpt && (
                    <div className="bg-muted rounded-lg p-4 mt-4">
                      <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Transcript</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.transcriptExcerpt}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : isSocial ? (
              <div className="max-w-lg mx-auto px-6 py-8">
                <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                  <div className="p-4 flex items-center gap-3 border-b border-border">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">@brand</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.platform || "social"}</p>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-[15px] text-foreground leading-relaxed whitespace-pre-wrap">{item.body}</p>
                  </div>
                  {item.coverImage && (
                    <div className="px-4 pb-4">
                      <img src={item.coverImage} alt="" className="w-full rounded-xl object-cover max-h-80" />
                    </div>
                  )}
                  <div className="px-4 pb-3 flex items-center gap-6 text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <ArrowUpRight className="h-4 w-4" />
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ) : isSeo ? (
              <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                  <p className="text-xs text-muted-foreground uppercase font-medium mb-3">Google Search Preview</p>
                  <div className="space-y-1">
                    <p className="text-[13px] text-green-700 font-mono">{typeof window !== "undefined" ? window.location.origin : "https://yoursite.com"}/{item.slug || "page"}</p>
                    <h2 className="text-xl text-blue-700 hover:underline cursor-pointer">{item.seoTitle || item.title}</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.seoDescription || item.description || "No meta description set."}</p>
                  </div>
                </div>
                {item.seoKeywords?.length > 0 && (
                  <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-3">Target Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {item.seoKeywords.map((kw: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full font-medium">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}
                {item.body && (
                  <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                    <p className="text-xs text-muted-foreground uppercase font-medium mb-3">Content Preview</p>
                    <div>{contentBlocks.map((block: string, i: number) => renderLiveMarkdownBlock(block, i))}</div>
                  </div>
                )}
              </div>
            ) : isNewsletter ? (
              <div className="max-w-2xl mx-auto px-6 py-8">
                <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
                  <div className="bg-gradient-to-r from-popover to-muted px-8 py-6 text-center">
                    <Mail className="h-8 w-8 text-foreground mx-auto mb-2" />
                    <h1 className="text-xl font-bold text-foreground">{item.title}</h1>
                    {item.description && <p className="text-foreground/80 text-sm mt-1">{item.description}</p>}
                  </div>
                  <div className="px-8 py-6">
                    {contentBlocks.map((block: string, i: number) => renderLiveMarkdownBlock(block, i))}
                  </div>
                  <div className="px-8 py-4 bg-muted border-t border-border text-center">
                    <p className="text-xs text-muted-foreground">You're receiving this because you subscribed to our newsletter.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="bg-card rounded-xl shadow-sm border border-border p-6 sm:p-8">
                  <article>
                    <header className="mb-6">
                      <h1 className="text-3xl font-bold text-foreground leading-tight mb-3">{item.title}</h1>
                      {item.description && (
                        <p className="text-lg text-muted-foreground leading-relaxed mb-4">{item.description}</p>
                      )}
                      <div className="flex items-center text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          {item.episode?.podcast?.coverImage ? (
                            <img src={item.episode.podcast.coverImage} alt="" className="h-6 w-6 rounded-full object-cover" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-popover flex items-center justify-center">
                              <Mic className="h-3 w-3 text-foreground" />
                            </div>
                          )}
                          <span className="font-medium text-foreground">{item.episode?.podcast?.host || item.author?.displayName || "Editorial Team"}</span>
                        </div>
                        <span className="mx-3 text-foreground/80">|</span>
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        <span>Just now</span>
                        {item.readingTime && (
                          <>
                            <span className="mx-2 text-foreground/80">·</span>
                            <span>{item.readingTime} min read</span>
                          </>
                        )}
                      </div>
                      <div className="border-t border-border pt-3" />
                    </header>

                    {item.coverImage && (
                      <div className="mb-6">
                        <img src={item.coverImage} alt={item.title} className="w-full rounded-lg object-cover max-h-[360px] bg-muted" />
                      </div>
                    )}

                    <div className="prose prose-lg prose-gray max-w-none">
                      {contentBlocks.length > 0 ? (
                        contentBlocks.map((block: string, i: number) => renderLiveMarkdownBlock(block, i))
                      ) : item.summary ? (
                        <p className="text-foreground leading-relaxed text-[16px]">{item.summary}</p>
                      ) : (
                        <p className="text-muted-foreground italic">Content body is being generated...</p>
                      )}
                    </div>

                    {item.seoKeywords?.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-border">
                        <div className="flex flex-wrap gap-2">
                          {item.seoKeywords.map((kw: string, i: number) => (
                            <span key={i} className="px-2.5 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Ready to publish this content?
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose} data-testid="button-cancel-ship">
                Cancel
              </Button>
              <Button
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10"
                onClick={onSchedule}
                data-testid="button-schedule-later"
              >
                <CalendarClock className="w-4 h-4 mr-2" />
                Schedule for Later
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={onShipNow}
                disabled={shipping}
                data-testid="button-ship-now"
              >
                {shipping ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" />Shipping...</>
                ) : (
                  <><Rocket className="w-4 h-4 mr-2" />Ship Now</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContentCard({ item, onPreview, onEdit, onApprove, onReject, approving, rejecting }: {
  item: any;
  onPreview: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const typeConf = getTypeConfig(item.type);
  const TypeIcon = typeConf.icon;
  const isClip = item.type === "clip" || item._isClip;

  const subtitle = isClip
    ? `${item.startTime || ""}–${item.endTime || ""} · Score: ${item.viralScore || 0}/100`
    : item.platform
    ? item.platform
    : item.episode
    ? `${item.episode.title}${item.episode.podcast ? ` · ${item.episode.podcast.title}` : ""}`
    : item.summary?.slice(0, 80) || item.description?.slice(0, 80) || "";

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-card/40 hover:border-border hover:bg-card/60 transition-all group"
      data-testid={`card-moderation-${item.id}`}
    >
      <div className={cn(
        "w-1 self-stretch rounded-full shrink-0",
        item.status === "review" ? "bg-amber-500" : item.status === "suggested" ? "bg-pink-500" : item.status === "draft" ? "bg-blue-500" : "bg-violet-500"
      )} />

      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center shrink-0 border", typeConf.color)}>
        <TypeIcon className="h-3.5 w-3.5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight" data-testid={`text-story-title-${item.id}`}>{item.title}</p>
        <p className="text-[11px] text-muted-foreground font-mono truncate">{subtitle}</p>
      </div>

      {item.seoKeywords?.length > 0 && (
        <div className="hidden xl:flex items-center gap-1 shrink-0">
          {item.seoKeywords.slice(0, 2).map((kw: string, i: number) => (
            <span key={i} className="text-[9px] font-mono text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{kw}</span>
          ))}
          {item.seoKeywords.length > 2 && <span className="text-[9px] font-mono text-muted-foreground">+{item.seoKeywords.length - 2}</span>}
        </div>
      )}

      {item.aiGenerated && (
        <Bot className="h-3.5 w-3.5 text-primary/50 shrink-0 hidden md:block" title="AI Generated" />
      )}

      <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="sm" onClick={onPreview} className="h-7 w-7 p-0" title="Preview" data-testid={`button-preview-${item.id}`}>
          <Eye className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-7 w-7 p-0" title="Edit" data-testid={`button-edit-${item.id}`}>
          <Edit3 className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="sm"
          className="h-7 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-mono"
          onClick={onApprove}
          disabled={approving}
          data-testid={`button-approve-${item.id}`}
        >
          <CheckCircle2 className="w-3 h-3 mr-1" /> Ship
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          onClick={onReject}
          disabled={rejecting}
          title="Reject"
          data-testid={`button-reject-${item.id}`}
        >
          <XCircle className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PreviewDialog({ item, onClose }: { item: any; onClose: () => void }) {
  if (!item) return null;

  const typeConf = getTypeConfig(item.type);
  const TypeIcon = typeConf.icon;
  const isSocial = item.type === "social";

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={cn("text-[10px] font-mono", typeConf.color)}>
              <TypeIcon className="w-3 h-3 mr-1" /> {typeConf.label}
            </Badge>
          </div>
          <DialogTitle className="text-xl font-display">{item.title}</DialogTitle>
          {item.episode && (
            <p className="text-sm text-muted-foreground font-mono">
              Source: {item.episode.title}
              {item.episode.podcast && ` · ${item.episode.podcast.title}`}
            </p>
          )}
        </DialogHeader>

        {item._isClip || item.type === "clip" ? (
          <div className="mt-4 space-y-4">
            <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div><p className="text-[10px] font-mono uppercase text-muted-foreground">Start Time</p><p className="text-lg font-mono font-bold">{item.startTime}</p></div>
                <div><p className="text-[10px] font-mono uppercase text-muted-foreground">End Time</p><p className="text-lg font-mono font-bold">{item.endTime}</p></div>
                <div><p className="text-[10px] font-mono uppercase text-muted-foreground">Duration</p><p className="text-lg font-mono font-bold">{item.duration || "—"}</p></div>
                <div><p className="text-[10px] font-mono uppercase text-muted-foreground">Viral Score</p><p className="text-lg font-mono font-bold text-pink-400">{item.viralScore}/100</p></div>
              </div>
              {item.hookText && (
                <div className="border-t border-pink-500/10 pt-3 mb-3">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Hook Text</p>
                  <p className="text-base italic">"{item.hookText}"</p>
                </div>
              )}
              {item.transcriptExcerpt && (
                <div className="border-t border-pink-500/10 pt-3">
                  <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Transcript Excerpt</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.transcriptExcerpt}</p>
                </div>
              )}
            </div>
          </div>
        ) : isSocial ? (
          <div className="mt-4">
            <div className="bg-muted/20 border border-border/30 rounded-xl p-6 max-w-md mx-auto">
              {item.platform && (
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", typeConf.color)}>
                    <Send className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">@brand</p>
                    <p className="text-[10px] text-muted-foreground font-mono capitalize">{item.platform}</p>
                  </div>
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.body}</p>
            </div>
          </div>
        ) : (
          <div className="prose prose-invert max-w-none mt-4">
            {item.coverImage && (
              <figure className="mb-6">
                <img src={item.coverImage} alt={item.title} className="w-full rounded-lg object-cover max-h-80" />
              </figure>
            )}
            {item.description && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-4 italic">{item.description}</p>
            )}
            {item.body?.split("\n\n").map((block: string, i: number) => {
              const trimmed = block.trim();
              if (!trimmed) return null;
              if (trimmed === "---" || trimmed === "***" || trimmed === "___") return <hr key={i} className="my-6 border-border/50" />;
              if (trimmed.startsWith("## ")) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{trimmed.replace("## ", "")}</h2>;
              if (trimmed.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{trimmed.replace("### ", "")}</h3>;
              const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
              if (imgMatch) {
                return (
                  <figure key={i} className="my-6">
                    <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full rounded-lg object-cover" />
                    {imgMatch[1] && <figcaption className="text-xs text-muted-foreground mt-2 italic">{imgMatch[1]}</figcaption>}
                  </figure>
                );
              }
              if (trimmed.startsWith("> ")) {
                const lines = trimmed.split("\n").map((l: string) => l.replace(/^>\s*/, ""));
                return (
                  <blockquote key={i} className="border-l-4 border-primary/50 pl-4 my-4 py-1">
                    <p className="italic text-muted-foreground">{lines[0]?.replace(/^"|"$/g, "")}</p>
                  </blockquote>
                );
              }
              const bulletLines = trimmed.split("\n");
              if (bulletLines.every((l: string) => /^[-*]\s/.test(l.trim()))) {
                return (
                  <ul key={i} className="list-disc pl-6 space-y-1 my-4">
                    {bulletLines.map((line: string, j: number) => (
                      <li key={j} className="text-sm leading-relaxed">{line.trim().replace(/^[-*]\s+/, "")}</li>
                    ))}
                  </ul>
                );
              }
              if (bulletLines.every((l: string) => /^\d+\.\s/.test(l.trim()))) {
                return (
                  <ol key={i} className="list-decimal pl-6 space-y-1 my-4">
                    {bulletLines.map((line: string, j: number) => (
                      <li key={j} className="text-sm leading-relaxed">{line.trim().replace(/^\d+\.\s+/, "")}</li>
                    ))}
                  </ol>
                );
              }
              return <p key={i} className="mb-3 leading-relaxed">{trimmed}</p>;
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
