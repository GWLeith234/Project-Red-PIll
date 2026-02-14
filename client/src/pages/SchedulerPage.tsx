import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Calendar, Plus, Trash2, Edit3, Clock, Sparkles, Lightbulb, Loader2,
  Linkedin, Facebook, Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useContentPieces, useScheduledPosts, useCreateScheduledPost,
  useUpdateScheduledPost, useDeleteScheduledPost, useSmartSuggestions,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48c1.77-1.77 2.36-4.26 2.36-5.95V9.26a8.27 8.27 0 004.85 1.57V7.39a4.85 4.85 0 01-1.63-.7z"/>
  </svg>
);

function getPlatformIcon(platform: string, className = "h-4 w-4") {
  switch (platform) {
    case "x": return <XIcon className={className} />;
    case "facebook": return <Facebook className={className} />;
    case "instagram": return <InstagramIcon className={className} />;
    case "linkedin": return <Linkedin className={className} />;
    case "tiktok": return <TikTokIcon className={className} />;
    case "google_business": return <Building2 className={className} />;
    default: return <Calendar className={className} />;
  }
}

function getPlatformLabel(platform: string) {
  switch (platform) {
    case "x": return "X";
    case "facebook": return "Facebook";
    case "instagram": return "Instagram";
    case "linkedin": return "LinkedIn";
    case "tiktok": return "TikTok";
    case "google_business": return "Google Business";
    default: return platform;
  }
}

export default function SchedulerPage() {
  const { data: posts, isLoading } = useScheduledPosts();
  const { data: contentPieces } = useContentPieces();
  const createPost = useCreateScheduledPost();
  const updatePost = useUpdateScheduledPost();
  const deletePost = useDeleteScheduledPost();
  const smartSuggestions = useSmartSuggestions();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [form, setForm] = useState({
    contentPieceId: "",
    platform: "",
    scheduledAt: "",
    postText: "",
    hashtags: "",
  });
  const [suggestions, setSuggestions] = useState<any>(null);

  function openNewDialog() {
    setEditingPost(null);
    setForm({ contentPieceId: "", platform: "", scheduledAt: "", postText: "", hashtags: "" });
    setDialogOpen(true);
  }

  function openEditDialog(post: any) {
    setEditingPost(post);
    setForm({
      contentPieceId: post.contentPieceId,
      platform: post.platform,
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
      postText: post.postText || "",
      hashtags: (post.hashtags || []).join(", "),
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: any = {
      contentPieceId: form.contentPieceId,
      platform: form.platform,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : new Date().toISOString(),
      postText: form.postText || undefined,
      hashtags: form.hashtags ? form.hashtags.split(",").map(h => h.trim()).filter(Boolean) : [],
    };

    if (editingPost) {
      updatePost.mutate({ id: editingPost.id, ...data }, {
        onSuccess: () => { toast({ title: "Post Updated" }); setDialogOpen(false); },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    } else {
      createPost.mutate(data, {
        onSuccess: () => { toast({ title: "Post Scheduled" }); setDialogOpen(false); },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: string) {
    deletePost.mutate(id, {
      onSuccess: () => toast({ title: "Post Deleted" }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleGetSuggestions() {
    if (!form.contentPieceId) return;
    const piece = contentPieces?.find((p: any) => p.id === form.contentPieceId);
    if (!piece?.episodeId) return;
    smartSuggestions.mutate({ episodeId: piece.episodeId }, {
      onSuccess: (data: any) => setSuggestions(data),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "published": return "border-emerald-500 text-emerald-500 bg-emerald-500/10";
      case "scheduled": return "border-primary text-primary bg-primary/10";
      case "draft": return "border-muted text-muted-foreground";
      case "failed": return "border-red-500 text-red-500 bg-red-500/10";
      default: return "border-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Content Scheduler</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Schedule and manage social media posts</p>
        </div>
        <Button onClick={openNewDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-schedule-post">
          <Plus className="mr-1.5 h-3 w-3" /> Schedule Post
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : !posts?.length ? (
            <Card className="glass-panel border-border/50 py-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground font-mono text-sm">No scheduled posts yet.</p>
              <p className="text-muted-foreground/60 font-mono text-xs mt-1">Click "Schedule Post" to get started.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map((post: any) => {
                const piece = contentPieces?.find((p: any) => p.id === post.contentPieceId);
                return (
                  <Card key={post.id} className="glass-panel border-border/50" data-testid={`card-post-${post.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded bg-card border border-border">
                            {getPlatformIcon(post.platform)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate" data-testid={`text-post-title-${post.id}`}>
                              {piece?.title || "Untitled"}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                              <span>{getPlatformLabel(post.platform)}</span>
                              <span>•</span>
                              <span>{post.scheduledAt ? new Date(post.scheduledAt).toLocaleString() : "No date"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn("font-mono text-[9px] uppercase", statusColor(post.status))}>
                            {post.status}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(post)} data-testid={`button-edit-post-${post.id}`}>
                            <Edit3 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-400" onClick={() => handleDelete(post.id)} data-testid={`button-delete-post-${post.id}`}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-4">
          <Card className="glass-panel border-primary/20">
            <CardHeader>
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                SMART Suggestions
              </CardTitle>
              <CardDescription className="font-mono text-[10px]">AI-powered scheduling recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              {suggestions ? (
                <div className="space-y-3">
                  {suggestions.overallStrategy && (
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Lightbulb className="h-3 w-3 text-primary" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-semibold">Strategy</span>
                      </div>
                      <p className="text-foreground/80 leading-relaxed">{suggestions.overallStrategy}</p>
                    </div>
                  )}
                  {Array.isArray(suggestions.suggestions) && suggestions.suggestions.map((s: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg bg-card/50 border border-border/50 space-y-2" data-testid={`suggestion-${i}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {s.platform && getPlatformIcon(s.platform, "h-3.5 w-3.5")}
                          <span className="font-mono text-xs font-semibold capitalize">{getPlatformLabel(s.platform || "general")}</span>
                        </div>
                        {s.priority && (
                          <Badge variant="outline" className={cn(
                            "font-mono text-[9px] uppercase",
                            s.priority === "high" ? "border-emerald-500/50 text-emerald-400" :
                            s.priority === "medium" ? "border-amber-500/50 text-amber-400" :
                            "border-muted text-muted-foreground"
                          )}>{s.priority}</Badge>
                        )}
                      </div>
                      {s.bestTime && (
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{s.bestTime}</span>
                        </div>
                      )}
                      {s.format && (
                        <p className="text-[11px] text-foreground/70">{s.format}</p>
                      )}
                      {s.tip && (
                        <p className="text-[11px] text-foreground/80 border-l-2 border-primary/30 pl-2">{s.tip}</p>
                      )}
                      {s.hashtags && s.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {s.hashtags.map((h: string, hi: number) => (
                            <span key={hi} className="text-[9px] font-mono px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-primary">{h.startsWith("#") ? h : `#${h}`}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {suggestions.contentCalendarSuggestion && (
                    <div className="p-3 rounded-lg bg-card/50 border border-border/50 text-xs">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Calendar</span>
                      </div>
                      <p className="text-foreground/70 leading-relaxed">{suggestions.contentCalendarSuggestion}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Schedule a post to see AI recommendations for optimal posting times and content.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-panel border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingPost ? "Edit Scheduled Post" : "Schedule New Post"}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {editingPost ? "Update the scheduled post details" : "Schedule content to be published on social platforms"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Content Piece</Label>
              <Select value={form.contentPieceId} onValueChange={(v) => setForm({ ...form, contentPieceId: v })}>
                <SelectTrigger data-testid="select-schedule-content">
                  <SelectValue placeholder="Select content..." />
                </SelectTrigger>
                <SelectContent>
                  {contentPieces?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger data-testid="select-schedule-platform">
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="x">X</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="google_business">Google Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Date & Time</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                data-testid="input-schedule-datetime"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Post Text</Label>
              <Textarea
                value={form.postText}
                onChange={(e) => setForm({ ...form, postText: e.target.value })}
                placeholder="Write your post text..."
                rows={4}
                data-testid="input-schedule-text"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Hashtags</Label>
              <Input
                value={form.hashtags}
                onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                placeholder="#podcast, #ai, #content"
                data-testid="input-schedule-hashtags"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetSuggestions}
                disabled={!form.contentPieceId || smartSuggestions.isPending}
                className="font-mono text-xs"
                data-testid="button-get-suggestions"
              >
                {smartSuggestions.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Get Suggestions
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="font-mono text-xs" data-testid="button-cancel-schedule">Cancel</Button>
              <Button type="submit" disabled={createPost.isPending || updatePost.isPending || !form.contentPieceId || !form.platform} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-schedule">
                {(createPost.isPending || updatePost.isPending) ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Calendar className="mr-2 h-3 w-3" />}
                {editingPost ? "Update" : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
