import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bot, CheckCircle2, XCircle, Eye, Edit3, Clock, FileText, Sparkles,
  Loader2, Wand2, ChevronDown, ChevronUp, Tag, Search, Newspaper
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useModerationQueue, useApproveStory, useRejectStory,
  useUpdateModerationPiece, useGenerateStory, useEpisodes, usePodcasts
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ArticleEditor, { type EditorBlock, markdownToBlocks, blocksToMarkdown } from "@/components/ArticleEditor";

export default function ModerationQueue() {
  const { data: queue, isLoading } = useModerationQueue();
  const { data: episodes } = useEpisodes();
  const { data: podcasts } = usePodcasts();
  const approveStory = useApproveStory();
  const rejectStory = useRejectStory();
  const updatePiece = useUpdateModerationPiece();
  const generateStory = useGenerateStory();
  const { toast } = useToast();

  const [previewItem, setPreviewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editorBlocks, setEditorBlocks] = useState<EditorBlock[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [genForm, setGenForm] = useState({ episodeId: "", transcript: "" });

  function openEditor(item: any) {
    setEditItem({ ...item });
    setEditorBlocks(markdownToBlocks(item.body || ""));
  }

  function handleApprove(id: string) {
    approveStory.mutate(id, {
      onSuccess: () => toast({ title: "Story Published", description: "The story is now live on the public site." }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleReject(id: string) {
    rejectStory.mutate(id, {
      onSuccess: () => toast({ title: "Story Rejected", description: "The story has been removed from the queue." }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleSaveEdit() {
    if (!editItem) return;
    const body = blocksToMarkdown(editorBlocks);
    updatePiece.mutate(
      {
        id: editItem.id,
        data: {
          title: editItem.title,
          body,
          description: editItem.description,
          coverImage: editItem.coverImage,
          seoTitle: editItem.seoTitle,
          seoDescription: editItem.seoDescription,
          seoKeywords: editItem.seoKeywords,
          summary: editItem.summary,
          readingTime: editItem.readingTime,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Story Updated", description: "Your edits have been saved." });
          setEditItem(null);
        },
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

  return (
    <div className="space-y-6" data-testid="moderation-queue-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary flex items-center gap-3" data-testid="text-page-title">
            <Bot className="w-8 h-8" />
            AI Content Agent
          </h1>
          <p className="text-muted-foreground mt-1">Review and moderate AI-generated stories before publishing</p>
        </div>
        <Button onClick={() => setGenerateOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="button-generate-story">
          <Wand2 className="w-4 h-4 mr-2" />
          Generate Story
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold" data-testid="text-queue-count">{queue?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">AI Agent</p>
                <p className="text-xs text-muted-foreground">GPT-5.2 Powered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">SEO</p>
                <p className="text-xs text-muted-foreground">Auto-Optimized</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : !queue?.length ? (
        <Card className="bg-card/50 border-border/50">
          <CardContent className="py-16 text-center">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Stories Pending Review</h3>
            <p className="text-muted-foreground mb-4">Click "Generate Story" to have the AI agent create a new article from an episode.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {queue.map((item: any) => {
            const isExpanded = expandedId === item.id;
            return (
              <Card key={item.id} className="bg-card/50 border-border/50 overflow-hidden" data-testid={`card-moderation-${item.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                          <Clock className="w-3 h-3 mr-1" /> Pending Review
                        </Badge>
                        <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-500">
                          <Bot className="w-3 h-3 mr-1" /> AI Generated
                        </Badge>
                        {item.readingTime && (
                          <Badge variant="outline" className="text-xs">
                            {item.readingTime} min read
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg leading-tight" data-testid={`text-story-title-${item.id}`}>{item.title}</CardTitle>
                      {item.episode && (
                        <p className="text-sm text-muted-foreground mt-1">
                          From: <span className="text-foreground/80">{item.episode.title}</span>
                          {item.episode.podcast && (
                            <span> &bull; {item.episode.podcast.title}</span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewItem(item)} data-testid={`button-preview-${item.id}`}>
                        <Eye className="w-4 h-4 mr-1" /> Preview
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditor(item)} data-testid={`button-edit-${item.id}`}>
                        <Edit3 className="w-4 h-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleApprove(item.id)}
                        disabled={approveStory.isPending}
                        data-testid={`button-approve-${item.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReject(item.id)}
                        disabled={rejectStory.isPending}
                        data-testid={`button-reject-${item.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {item.summary && (
                    <p className="text-sm text-muted-foreground mb-3">{item.summary}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.seoKeywords?.map((kw: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />{kw}
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                    {isExpanded ? "Hide SEO Details" : "Show SEO Details"}
                  </Button>
                  {isExpanded && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/30 space-y-2 text-sm">
                      <div><span className="font-medium text-muted-foreground">SEO Title:</span> <span>{item.seoTitle}</span></div>
                      <div><span className="font-medium text-muted-foreground">Meta Description:</span> <span>{item.seoDescription}</span></div>
                      <div><span className="font-medium text-muted-foreground">Slug:</span> <code className="text-xs bg-muted px-1 rounded">{item.slug}</code></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{previewItem?.title}</DialogTitle>
            {previewItem?.episode && (
              <p className="text-sm text-muted-foreground">
                Source: {previewItem.episode.title}
                {previewItem.episode.podcast && ` • ${previewItem.episode.podcast.title}`}
              </p>
            )}
          </DialogHeader>
          <div className="prose prose-invert max-w-none mt-4">
            {previewItem?.coverImage && (
              <figure className="mb-6">
                <img src={previewItem.coverImage} alt={previewItem.title} className="w-full rounded-lg object-cover max-h-80" />
              </figure>
            )}
            {previewItem?.description && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-4 italic">{previewItem.description}</p>
            )}
            {previewItem?.body?.split("\n\n").map((block: string, i: number) => {
              const trimmed = block.trim();
              if (!trimmed) return null;
              if (trimmed === "---" || trimmed === "***" || trimmed === "___") return <hr key={i} className="my-6 border-border/50" />;
              if (trimmed.startsWith("## ")) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{trimmed.replace("## ", "")}</h2>;
              if (trimmed.startsWith("### ")) return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{trimmed.replace("### ", "")}</h3>;
              const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
              if (imgMatch) {
                const imgLines = trimmed.split("\n");
                let imgCredit = "";
                if (imgLines.length > 1) {
                  const cl = imgLines.slice(1).join(" ").trim();
                  const cm = cl.match(/^\*(.+)\*$/);
                  if (cm) imgCredit = cm[1];
                }
                return (
                  <figure key={i} className="my-6">
                    <img src={imgMatch[2]} alt={imgMatch[1]} className="w-full rounded-lg object-cover" />
                    {(imgMatch[1] || imgCredit) && (
                      <figcaption className="text-xs text-muted-foreground mt-2 italic">
                        {imgMatch[1]}{imgCredit && ` — ${imgCredit}`}
                      </figcaption>
                    )}
                  </figure>
                );
              }
              if (trimmed.startsWith("> ")) {
                const lines = trimmed.split("\n").map((l: string) => l.replace(/^>\s*/, ""));
                return (
                  <blockquote key={i} className="border-l-4 border-primary/50 pl-4 my-4 py-1">
                    <p className="italic text-muted-foreground">{lines[0]?.replace(/^"|"$/g, "")}</p>
                    {lines.length > 1 && <cite className="text-xs text-muted-foreground/70 not-italic">— {lines[lines.length - 1].replace(/^—\s*/, "")}</cite>}
                  </blockquote>
                );
              }
              const bulletLines = trimmed.split("\n");
              if (bulletLines.every((l: string) => /^[-*]\s/.test(l.trim()))) {
                return (
                  <ul key={i} className="list-disc pl-6 space-y-1 my-4">
                    {bulletLines.map((item: string, j: number) => (
                      <li key={j} className="text-sm leading-relaxed">{item.trim().replace(/^[-*]\s+/, "")}</li>
                    ))}
                  </ul>
                );
              }
              if (bulletLines.every((l: string) => /^\d+\.\s/.test(l.trim()))) {
                return (
                  <ol key={i} className="list-decimal pl-6 space-y-1 my-4">
                    {bulletLines.map((item: string, j: number) => (
                      <li key={j} className="text-sm leading-relaxed">{item.trim().replace(/^\d+\.\s+/, "")}</li>
                    ))}
                  </ol>
                );
              }
              return <p key={i} className="mb-3 leading-relaxed">{trimmed}</p>;
            })}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-primary" /> Article Editor
            </DialogTitle>
            {editItem?.episode && (
              <p className="text-sm text-muted-foreground">
                Source: {editItem.episode.title}
                {editItem.episode.podcast && ` • ${editItem.episode.podcast.title}`}
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
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" /> Generate Story from Episode
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <Label>Select Episode</Label>
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
              <Label>Transcript (optional)</Label>
              <Textarea
                value={genForm.transcript}
                onChange={(e) => setGenForm({ ...genForm, transcript: e.target.value })}
                rows={6}
                placeholder="Paste the episode transcript here, or leave empty to use auto-transcription from the audio file..."
                className="text-sm"
                data-testid="input-transcript"
              />
              <p className="text-xs text-muted-foreground mt-1">
                If left empty, the AI will attempt to transcribe from the episode's audio file.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setGenerateOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!genForm.episodeId || generateStory.isPending} data-testid="button-submit-generate">
                {generateStory.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Story
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
