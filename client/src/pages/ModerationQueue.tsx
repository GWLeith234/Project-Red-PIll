import { useState } from "react";
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
  Loader2, Wand2, ChevronDown, ChevronUp, Tag, Newspaper, Send,
  MessageSquare, Scissors, Mail, Search as SearchIcon, Globe, Filter,
  LayoutGrid, List, ArrowUpRight, Mic, Film
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useModerationQueue, useModerationCounts, useApproveStory, useRejectStory,
  useUpdateModerationPiece, useGenerateStory, useEpisodes, usePodcasts,
  useClipAssets, useUpdateClipAsset
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
  const { data: counts } = useModerationCounts();
  const { data: episodes } = useEpisodes();
  const { data: podcasts } = usePodcasts();
  const { data: allClips } = useClipAssets();
  const approveStory = useApproveStory();
  const rejectStory = useRejectStory();
  const updatePiece = useUpdateModerationPiece();
  const updateClip = useUpdateClipAsset();
  const generateStory = useGenerateStory();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("all");
  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editorBlocks, setEditorBlocks] = useState<EditorBlock[]>([]);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState({ episodeId: "", transcript: "" });
  const [searchQuery, setSearchQuery] = useState("");

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

  function openEditor(item: any) {
    setEditItem({ ...item });
    setEditorBlocks(markdownToBlocks(item.body || ""));
  }

  function handleApprove(item: any) {
    if (item._isClip) {
      updateClip.mutate({ id: item.id, data: { status: "approved" } }, {
        onSuccess: () => toast({ title: "Clip Approved", description: "The clip has been approved." }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    } else {
      approveStory.mutate(item.id, {
        onSuccess: () => toast({ title: "Content Published", description: "The content is now live." }),
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
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground flex items-center gap-3" data-testid="text-page-title">
            <Bot className="w-8 h-8 text-primary" />
            AI Content Agent
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Review, edit &amp; approve AI-generated content before publishing</p>
        </div>
        <Button onClick={() => setGenerateOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-xs uppercase tracking-wider" data-testid="button-generate-story">
          <Wand2 className="w-4 h-4 mr-2" />
          Generate Story
        </Button>
      </div>

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

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/50 border-border/50 font-mono text-sm"
            data-testid="input-search-moderation"
          />
        </div>
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
        <div className="space-y-3">
          {filteredQueue.map((item: any) => (
            <ContentCard
              key={item.id}
              item={item}
              onPreview={() => setPreviewItem(item)}
              onEdit={() => openEditor(item)}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              approving={approveStory.isPending || updateClip.isPending}
              rejecting={rejectStory.isPending || updateClip.isPending}
            />
          ))}
        </div>
      )}

      <PreviewDialog item={previewItem} onClose={() => setPreviewItem(null)} />

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

function ContentCard({ item, onPreview, onEdit, onApprove, onReject, approving, rejecting }: {
  item: any;
  onPreview: () => void;
  onEdit: () => void;
  onApprove: () => void;
  onReject: () => void;
  approving: boolean;
  rejecting: boolean;
}) {
  const [showSeo, setShowSeo] = useState(false);
  const typeConf = getTypeConfig(item.type);
  const statusConf = getStatusConfig(item.status);
  const TypeIcon = typeConf.icon;
  const StatusIcon = statusConf.icon;

  const isSocial = item.type === "social";
  const isSeo = item.type === "seo";
  const isClip = item.type === "clip" || item._isClip;

  return (
    <Card className="bg-card/50 border-border/50 overflow-hidden hover:border-border transition-colors group" data-testid={`card-moderation-${item.id}`}>
      <div className="flex">
        <div className={cn("w-1 shrink-0", item.status === "review" ? "bg-amber-500" : item.status === "suggested" ? "bg-pink-500" : item.status === "draft" ? "bg-blue-500" : "bg-violet-500")} />
        <div className="flex-1 min-w-0">
          <CardHeader className="pb-2 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" className={cn("text-[10px] font-mono", typeConf.color)}>
                    <TypeIcon className="w-3 h-3 mr-1" /> {typeConf.label}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10px] font-mono", statusConf.color)}>
                    <StatusIcon className="w-3 h-3 mr-1" /> {statusConf.label}
                  </Badge>
                  {item.aiGenerated && (
                    <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary bg-primary/5">
                      <Bot className="w-3 h-3 mr-1" /> AI Generated
                    </Badge>
                  )}
                  {item.readingTime && (
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
                      {item.readingTime} min read
                    </Badge>
                  )}
                  {item.platform && (
                    <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground capitalize">
                      <Send className="w-3 h-3 mr-1" /> {item.platform}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base leading-tight" data-testid={`text-story-title-${item.id}`}>{item.title}</CardTitle>
                {item.episode && (
                  <p className="text-xs text-muted-foreground mt-1 font-mono flex items-center gap-1">
                    {item.episode.episodeType === "video" ? <Film className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                    {item.episode.title}
                    {item.episode.podcast && <span className="text-muted-foreground/60"> · {item.episode.podcast.title}</span>}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" onClick={onPreview} className="h-8 px-2" data-testid={`button-preview-${item.id}`}>
                  <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                </Button>
                <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-2" data-testid={`button-edit-${item.id}`}>
                  <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                </Button>
                <Button
                  size="sm"
                  className="h-8 px-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={onApprove}
                  disabled={approving}
                  data-testid={`button-approve-${item.id}`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 px-2"
                  onClick={onReject}
                  disabled={rejecting}
                  data-testid={`button-reject-${item.id}`}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0 pb-4">
            {isSocial && item.body && (
              <div className="bg-muted/20 border border-border/30 rounded-lg p-3 mb-3">
                <p className="text-sm whitespace-pre-wrap">{item.body.slice(0, 280)}{item.body.length > 280 ? "..." : ""}</p>
              </div>
            )}

            {isClip && (
              <div className="bg-pink-500/5 border border-pink-500/20 rounded-lg p-3 mb-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                  <div>
                    <p className="text-[9px] font-mono uppercase text-muted-foreground">Start</p>
                    <p className="text-sm font-mono font-semibold">{item.startTime || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono uppercase text-muted-foreground">End</p>
                    <p className="text-sm font-mono font-semibold">{item.endTime || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono uppercase text-muted-foreground">Duration</p>
                    <p className="text-sm font-mono font-semibold">{item.duration || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-mono uppercase text-muted-foreground">Viral Score</p>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-mono font-bold text-pink-400">{item.viralScore || 0}</p>
                      <span className="text-[9px] text-muted-foreground">/100</span>
                    </div>
                  </div>
                </div>
                {item.hookText && (
                  <div className="mt-2 pt-2 border-t border-pink-500/10">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Hook</p>
                    <p className="text-sm italic text-pink-300/80">"{item.hookText}"</p>
                  </div>
                )}
                {item.transcriptExcerpt && (
                  <div className="mt-2 pt-2 border-t border-pink-500/10">
                    <p className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Transcript Excerpt</p>
                    <p className="text-xs text-muted-foreground line-clamp-3">{item.transcriptExcerpt}</p>
                  </div>
                )}
              </div>
            )}

            {isSeo && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                {item.seoTitle && (
                  <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">SEO Title</p>
                    <p className="text-sm font-medium">{item.seoTitle}</p>
                  </div>
                )}
                {item.seoDescription && (
                  <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                    <p className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Meta Description</p>
                    <p className="text-sm text-muted-foreground">{item.seoDescription}</p>
                  </div>
                )}
              </div>
            )}

            {!isSocial && !isSeo && !isClip && item.summary && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.summary}</p>
            )}

            {!isSocial && !isSeo && !isClip && item.description && !item.summary && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
            )}

            <div className="flex items-center gap-2 flex-wrap">
              {item.seoKeywords?.slice(0, 5).map((kw: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-[10px] font-mono">
                  <Tag className="w-2.5 h-2.5 mr-1" />{kw}
                </Badge>
              ))}
              {item.seoKeywords?.length > 5 && (
                <Badge variant="secondary" className="text-[10px] font-mono">+{item.seoKeywords.length - 5} more</Badge>
              )}
            </div>

            {(item.seoTitle || item.seoDescription || item.slug) && !isSeo && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-[10px] font-mono h-7 px-2"
                  onClick={() => setShowSeo(!showSeo)}
                >
                  {showSeo ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                  {showSeo ? "Hide SEO" : "Show SEO"}
                </Button>
                {showSeo && (
                  <div className="mt-2 p-3 rounded-lg bg-muted/20 border border-border/30 space-y-2 text-sm">
                    {item.seoTitle && <div><span className="font-mono text-[10px] text-muted-foreground uppercase">Title:</span> <span className="text-sm">{item.seoTitle}</span></div>}
                    {item.seoDescription && <div><span className="font-mono text-[10px] text-muted-foreground uppercase">Description:</span> <span className="text-sm">{item.seoDescription}</span></div>}
                    {item.slug && <div><span className="font-mono text-[10px] text-muted-foreground uppercase">Slug:</span> <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{item.slug}</code></div>}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </div>

        {!isSocial && item.coverImage && (
          <div className="w-40 shrink-0 relative hidden lg:block">
            <img src={item.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-card/80" />
          </div>
        )}
      </div>
    </Card>
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
