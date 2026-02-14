import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mic, FileText, Video, Linkedin, Mail, Newspaper, Facebook,
  ArrowRight, CheckCircle2, Loader2, Clock, Search, Upload, PenLine,
  Scissors, Play, ThumbsUp, ThumbsDown, Calendar, Plus, Trash2,
  Edit3, Eye, Building2, Sparkles, Zap, Send, Save,
  ChevronRight, AlertTriangle, ImagePlus, Music, Film, X as XCloseIcon,
  TrendingUp, Target, BarChart3, Lightbulb, Hash, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEpisodes, useContentPieces, usePodcasts, useCreateEpisode,
  useRunFullPipeline, useSmartSuggestions, useGenerateNewsletter,
  useClipAssets, useUpdateClipAsset, useDeleteClipAsset,
  useScheduledPosts, useCreateScheduledPost, useUpdateScheduledPost, useDeleteScheduledPost,
  useNewsletterRuns, useSendNewsletter, useDeleteNewsletterRun,
  useUpdateContentPiece
} from "@/lib/api";
import { useUpload } from "@/hooks/use-upload";
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

function getPlatformIcon(platform: string, className?: string) {
  switch (platform) {
    case "x": return <XIcon className={className || "h-4 w-4"} />;
    case "facebook": return <Facebook className={className || "h-4 w-4"} />;
    case "linkedin": return <Linkedin className={className || "h-4 w-4"} />;
    case "google_business": return <Building2 className={className || "h-4 w-4"} />;
    case "instagram": return <InstagramIcon className={className || "h-4 w-4"} />;
    case "tiktok": return <TikTokIcon className={className || "h-4 w-4"} />;
    default: return <Sparkles className={className || "h-4 w-4"} />;
  }
}

function getPlatformLabel(platform: string) {
  switch (platform) {
    case "x": return "X";
    case "facebook": return "Facebook";
    case "linkedin": return "LinkedIn";
    case "google_business": return "Google Business";
    case "instagram": return "Instagram";
    case "tiktok": return "TikTok";
    default: return platform;
  }
}

export default function ContentFactory() {
  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Content Factory</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">AI-Powered Content Production Pipeline</p>
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="bg-card/50 border border-border/50 p-1 h-auto flex-wrap" data-testid="tabs-content-factory">
          <TabsTrigger value="pipeline" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-pipeline">
            <Zap className="mr-1.5 h-3 w-3" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="upload" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-upload">
            <Upload className="mr-1.5 h-3 w-3" /> Upload
          </TabsTrigger>
          <TabsTrigger value="clips" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-clips">
            <Scissors className="mr-1.5 h-3 w-3" /> Clips
          </TabsTrigger>
          <TabsTrigger value="schedule" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-schedule">
            <Calendar className="mr-1.5 h-3 w-3" /> Schedule
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-newsletter">
            <Mail className="mr-1.5 h-3 w-3" /> Newsletter
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <PipelineTab />
        </TabsContent>
        <TabsContent value="upload" className="mt-4">
          <UploadTab />
        </TabsContent>
        <TabsContent value="clips" className="mt-4">
          <ClipsTab />
        </TabsContent>
        <TabsContent value="schedule" className="mt-4">
          <ScheduleTab />
        </TabsContent>
        <TabsContent value="newsletter" className="mt-4">
          <NewsletterTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TranscriptProgressBar({ status }: { status: string }) {
  const [progress, setProgress] = useState(status === "processing" ? 25 : 0);
  const [elapsed, setElapsed] = useState(0);
  const estimatedSeconds = status === "processing" ? 120 : 180;

  useEffect(() => {
    setProgress(status === "processing" ? 25 : 0);
    setElapsed(0);
  }, [status]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (status === "processing") {
          const target = Math.min(92, 25 + (next / estimatedSeconds) * 67);
          setProgress(target);
        } else {
          const target = Math.min(20, (next / estimatedSeconds) * 20);
          setProgress(target);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [status, estimatedSeconds]);

  const remaining = Math.max(0, estimatedSeconds - elapsed);
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  return (
    <div className="flex-1 min-w-[200px]" data-testid="transcript-progress-bar">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          {status === "processing" ? "Transcribing..." : "Queued for transcription"}
        </span>
        <span className="text-[10px] font-mono text-primary tabular-nums">
          ~{minutes}:{seconds.toString().padStart(2, "0")} remaining
        </span>
      </div>
      <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden border border-border/30">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-linear relative"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.7) 100%)",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
        </div>
      </div>
    </div>
  );
}

function KeywordAnalysisCard({ episodeId }: { episodeId: string }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["/api/episodes", episodeId, "keyword-analysis"],
    queryFn: async () => {
      const res = await fetch(`/api/episodes/${episodeId}/keyword-analysis`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!episodeId,
    staleTime: 30000,
  });

  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  async function runAnalysis() {
    setIsRunning(true);
    try {
      const res = await fetch(`/api/episodes/${episodeId}/keyword-analysis`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      refetch();
      toast({ title: "Keyword Analysis Complete", description: "Trending keywords have been identified." });
    } catch (err: any) {
      toast({ title: "Analysis Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  }

  if (isLoading) {
    return (
      <Card className="glass-panel border-border/50 col-span-1 md:col-span-2" data-testid="card-keyword-analysis">
        <CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent>
      </Card>
    );
  }

  const analysis = data?.analysis;
  const hasAnalysis = data?.hasAnalysis;

  if (!hasAnalysis) {
    return (
      <Card className="glass-panel border-border/50 col-span-1 md:col-span-2" data-testid="card-keyword-analysis">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-display">Keyword Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground mb-3">Run keyword analysis to discover trending topics and optimize your content for search ranking.</p>
            <Button
              onClick={runAnalysis}
              disabled={isRunning}
              variant="outline"
              size="sm"
              className="font-mono text-xs"
              data-testid="button-run-keyword-analysis"
            >
              {isRunning ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Search className="mr-2 h-3 w-3" />}
              Analyze Keywords
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const topKeywords = analysis?.topKeywords || [];
  const longTailKeywords = analysis?.longTailKeywords || [];
  const topicClusters = analysis?.topicClusters || [];
  const optimizationTips = analysis?.optimizationTips || [];

  return (
    <Card className="glass-panel border-primary/20 col-span-1 md:col-span-2" data-testid="card-keyword-analysis">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-display">Keyword Analysis</CardTitle>
            <Badge variant="outline" className="font-mono text-[10px] border-emerald-500/50 text-emerald-500">{topKeywords.length} keywords</Badge>
          </div>
          <Button
            onClick={runAnalysis}
            disabled={isRunning}
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            data-testid="button-rerun-keyword-analysis"
          >
            {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <BarChart3 className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Top Ranking Keywords</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {topKeywords.slice(0, 12).map((kw: any, i: number) => (
              <div
                key={i}
                className="group relative inline-flex items-center gap-1 px-2 py-1 border rounded text-xs font-mono transition-all hover:border-primary/50 cursor-default"
                style={{
                  borderColor: kw.trendingScore >= 80 ? 'rgba(229, 193, 0, 0.5)' :
                    kw.trendingScore >= 60 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(148, 163, 184, 0.3)',
                  backgroundColor: kw.trendingScore >= 80 ? 'rgba(229, 193, 0, 0.08)' :
                    kw.trendingScore >= 60 ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                }}
                data-testid={`keyword-${i}`}
              >
                {kw.trendingScore >= 80 && <TrendingUp className="h-2.5 w-2.5 text-[#E5C100]" />}
                <span className="text-foreground">{kw.keyword}</span>
                <span className={cn(
                  "text-[9px] font-bold",
                  kw.trendingScore >= 80 ? "text-[#E5C100]" : kw.trendingScore >= 60 ? "text-emerald-500" : "text-muted-foreground"
                )}>{kw.trendingScore}</span>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 w-48 p-2 bg-popover border border-border rounded shadow-lg text-[10px]">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Relevance</span>
                    <span className="font-bold">{kw.relevanceScore}/100</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Trending</span>
                    <span className="font-bold">{kw.trendingScore}/100</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Intent</span>
                    <span className="capitalize">{kw.searchIntent}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Competition</span>
                    <Badge variant="outline" className={cn(
                      "text-[8px] h-4 px-1",
                      kw.competitionLevel === "low" ? "text-emerald-500 border-emerald-500/50" :
                      kw.competitionLevel === "high" ? "text-red-400 border-red-400/50" :
                      "text-amber-400 border-amber-400/50"
                    )}>{kw.competitionLevel}</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 border-t border-border pt-1">{kw.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {longTailKeywords.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Hash className="h-3.5 w-3.5 text-emerald-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Long-Tail Phrases</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {longTailKeywords.map((lt: any, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/5 border border-emerald-500/20 rounded text-[11px] font-mono text-emerald-500" data-testid={`longtail-${i}`}>
                  {lt.phrase}
                  <span className="text-[9px] text-emerald-400/70">{lt.trendingScore}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {topicClusters.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="h-3.5 w-3.5 text-violet-500" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Topic Clusters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topicClusters.slice(0, 4).map((cluster: any, i: number) => (
                <div key={i} className="p-2 border border-border/50 rounded bg-card/30 space-y-1" data-testid={`cluster-${i}`}>
                  <span className="text-xs font-semibold text-foreground">{cluster.topic}</span>
                  <div className="flex flex-wrap gap-1">
                    {cluster.keywords?.map((kw: string, ki: number) => (
                      <span key={ki} className="text-[9px] px-1.5 py-0.5 bg-violet-500/10 border border-violet-500/20 rounded text-violet-400 font-mono">{kw}</span>
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground">{cluster.contentAngle}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {optimizationTips.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Optimization Tips</span>
            </div>
            <div className="space-y-1.5">
              {optimizationTips.slice(0, 5).map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground" data-testid={`tip-${i}`}>
                  <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {analysis?.suggestedTitle && (
          <div className="border-t border-border/50 pt-3 space-y-1.5">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Suggested SEO Title</span>
            </div>
            <p className="text-xs font-medium text-foreground bg-primary/5 border border-primary/20 rounded px-2.5 py-1.5" data-testid="text-suggested-title">{analysis.suggestedTitle}</p>
            {analysis.suggestedMetaDescription && (
              <p className="text-[10px] text-muted-foreground italic" data-testid="text-suggested-meta">{analysis.suggestedMetaDescription}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PipelineTab() {
  const { data: episodes, isLoading: epLoading } = useEpisodes();
  const { data: podcasts } = usePodcasts();
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>("");
  const { data: contentPieces, isLoading: contentLoading } = useContentPieces(selectedEpisodeId || undefined);
  const runPipeline = useRunFullPipeline();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [previewPiece, setPreviewPiece] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", body: "", summary: "", seoTitle: "", seoDescription: "" });
  const updatePiece = useUpdateContentPiece();

  const [contentTypes, setContentTypes] = useState<string[]>(["article", "blog", "social", "clips", "newsletter", "seo"]);

  const selectedEpisode = episodes?.find((e: any) => e.id === selectedEpisodeId);
  const podcast = podcasts?.find((p: any) => p.id === selectedEpisode?.podcastId);

  const pipelineSteps = [
    { label: "Transcription", key: "transcription" },
    { label: "Keyword Analysis", key: "keywords" },
    { label: "Article", key: "article" },
    { label: "Blog", key: "blog" },
    { label: "Social", key: "social" },
    { label: "Clips", key: "clips" },
    { label: "Newsletter", key: "newsletter" },
    { label: "SEO", key: "seo" },
  ];

  const progress = selectedEpisode?.processingProgress || 0;

  const isProcessing = selectedEpisode?.processingStatus === "processing" || (runPipeline.isPending);

  useEffect(() => {
    if (!isProcessing || !selectedEpisodeId) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0] as string;
        return key?.startsWith("/api/content-pieces") || key?.startsWith("/api/clip-assets");
      }});
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing, selectedEpisodeId, queryClient]);

  function toggleContentType(type: string) {
    setContentTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }

  function handleStatusChange(id: string, status: string) {
    updatePiece.mutate({ id, status }, {
      onSuccess: () => { toast({ title: "Status Updated", description: `Content piece is now "${status}".` }); setPreviewPiece(null); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleSaveEdit() {
    if (!previewPiece) return;
    updatePiece.mutate({ id: previewPiece.id, ...editForm }, {
      onSuccess: () => { toast({ title: "Content Updated" }); setPreviewPiece(null); setEditMode(false); },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleRunPipeline() {
    if (!selectedEpisodeId) return;
    runPipeline.mutate(
      { episodeId: selectedEpisodeId, contentTypes },
      {
        onSuccess: () => toast({ title: "Pipeline Started", description: "AI content generation has been initiated." }),
        onError: (err: any) => toast({ title: "Pipeline Error", description: err.message, variant: "destructive" }),
      }
    );
  }

  const grouped: Record<string, any[]> = {};
  if (contentPieces) {
    for (const piece of contentPieces) {
      const t = piece.type as string;
      if (!grouped[t]) grouped[t] = [];
      grouped[t].push(piece);
    }
  }

  const typeConfig: Record<string, { icon: any; title: string; color: string }> = {
    article: { icon: Newspaper, title: "Articles", color: "text-blue-500" },
    blog: { icon: PenLine, title: "Blog Posts", color: "text-violet-500" },
    social: { icon: FileText, title: "Social Posts", color: "text-sky-400" },
    video_clip: { icon: Video, title: "Clip Suggestions", color: "text-red-500" },
    newsletter: { icon: Mail, title: "Newsletter", color: "text-amber-400" },
    seo: { icon: Search, title: "SEO Assets", color: "text-emerald-400" },
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4 space-y-4">
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              Episode Selector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEpisodeId} onValueChange={setSelectedEpisodeId}>
              <SelectTrigger data-testid="select-episode-pipeline">
                <SelectValue placeholder="Select an episode..." />
              </SelectTrigger>
              <SelectContent>
                {epLoading ? (
                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                ) : (
                  episodes?.map((ep: any) => (
                    <SelectItem key={ep.id} value={ep.id}>
                      <span className="flex items-center gap-2">
                        {ep.title}
                        <Badge variant="outline" className="text-[9px] ml-1">
                          {ep.processingStatus || "pending"}
                        </Badge>
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedEpisode && (
          <>
            <Card className="glass-panel border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-base" data-testid="text-selected-episode">{selectedEpisode.title}</CardTitle>
                <CardDescription className="font-mono text-xs">
                  {podcast?.title || "Unknown Podcast"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {selectedEpisode.duration && (
                    <Badge variant="outline" className="font-mono text-xs">
                      <Clock className="mr-1 h-3 w-3" /> {selectedEpisode.duration}
                    </Badge>
                  )}
                  <Badge variant="outline" className="font-mono text-xs capitalize">
                    {selectedEpisode.episodeType || "audio"}
                  </Badge>
                  {(selectedEpisode.transcriptStatus === "pending" || selectedEpisode.transcriptStatus === "processing") ? (
                    <TranscriptProgressBar status={selectedEpisode.transcriptStatus} />
                  ) : (
                    <Badge variant="outline" className={cn(
                      "font-mono text-xs",
                      (selectedEpisode.transcriptStatus === "ready" || selectedEpisode.transcriptStatus === "complete") ? "border-emerald-500/50 text-emerald-500" :
                      selectedEpisode.transcriptStatus === "failed" ? "border-destructive/50 text-destructive" :
                      "border-muted text-muted-foreground"
                    )}>
                      Transcript: {selectedEpisode.transcriptStatus === "complete" ? "ready" : (selectedEpisode.transcriptStatus || "pending")}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 pt-2">
                  <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Content Types</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["article", "blog", "social", "clips", "newsletter", "seo"].map(type => (
                      <label key={type} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={contentTypes.includes(type)}
                          onCheckedChange={() => toggleContentType(type)}
                          data-testid={`checkbox-${type}`}
                        />
                        <span className="capitalize font-mono text-xs">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleRunPipeline}
                  disabled={runPipeline.isPending || contentTypes.length === 0}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider mt-2"
                  data-testid="button-run-pipeline"
                >
                  {runPipeline.isPending ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-3 w-3" />
                  )}
                  Run Full AI Pipeline
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-panel border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Pipeline Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="h-2 mb-3" />
                <div className="space-y-1.5">
                  {pipelineSteps.map((step, i) => {
                    const stepProgress = (i + 1) / pipelineSteps.length * 100;
                    const status = progress >= stepProgress ? "complete" : progress >= stepProgress - 14 ? "processing" : "pending";
                    return (
                      <div key={step.key} className="flex items-center text-xs gap-2">
                        {status === "complete" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                        {status === "processing" && <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />}
                        {status === "pending" && <div className="h-2 w-2 rounded-full bg-muted-foreground/30 mx-[3px]" />}
                        <span className={cn(
                          "font-mono",
                          status === "complete" ? "text-foreground" :
                          status === "processing" ? "text-primary" :
                          "text-muted-foreground"
                        )}>{step.label}</span>
                        {i < pipelineSteps.length - 1 && status === "complete" && (
                          <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="col-span-12 lg:col-span-8">
        {!selectedEpisodeId ? (
          <Card className="glass-panel border-border/50 h-64 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Mic className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-mono text-sm">Select an episode to view generated content</p>
            </div>
          </Card>
        ) : contentLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="glass-panel border-border/50"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <KeywordAnalysisCard episodeId={selectedEpisodeId} />
            {Object.entries(typeConfig).map(([type, config]) => {
              const items = grouped[type] || [];
              const Icon = config.icon;
              return (
                <Card key={type} className="glass-panel border-border/50 hover:border-primary/30 transition-all" data-testid={`card-content-${type}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={cn("h-4 w-4", config.color)} />
                      <CardTitle className="text-sm font-display">{config.title}</CardTitle>
                      <Badge variant="outline" className="ml-auto font-mono text-[10px]">{items.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {items.length > 0 ? (
                      <div className="space-y-2">
                        {items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-2 rounded bg-card/30 border border-transparent hover:border-border transition-colors text-sm" data-testid={`content-piece-${item.id}`}>
                            <span className="truncate max-w-[160px] font-medium text-xs">{item.title}</span>
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className={cn(
                                "text-[9px] uppercase font-mono h-5 px-1.5",
                                item.status === "ready" ? "border-emerald-500 text-emerald-500 bg-emerald-500/10" :
                                item.status === "generating" ? "border-primary text-primary bg-primary/10 animate-pulse" :
                                "border-muted text-muted-foreground"
                              )}>{item.status}</Badge>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setPreviewPiece(item); setEditMode(false); }} data-testid={`button-view-${item.id}`}>
                                <Eye className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground py-2">No items generated yet.</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!previewPiece} onOpenChange={(open) => { if (!open) { setPreviewPiece(null); setEditMode(false); } }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto glass-panel" data-testid="dialog-content-preview">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              {previewPiece?.title}
            </DialogTitle>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <Badge variant="outline" className="font-mono text-[10px] uppercase">{previewPiece?.type}</Badge>
              <Badge variant="outline" className={cn(
                "font-mono text-[10px] uppercase",
                previewPiece?.status === "ready" ? "border-emerald-500 text-emerald-500 bg-emerald-500/10" :
                previewPiece?.status === "published" ? "border-blue-500 text-blue-500 bg-blue-500/10" :
                previewPiece?.status === "generating" ? "border-primary text-primary bg-primary/10" :
                "border-muted text-muted-foreground"
              )}>{previewPiece?.status}</Badge>
              {previewPiece?.platform && (
                <Badge variant="outline" className="font-mono text-[10px] flex items-center gap-1">
                  {getPlatformIcon(previewPiece.platform, "h-3 w-3")}
                  {getPlatformLabel(previewPiece.platform)}
                </Badge>
              )}
            </div>
          </DialogHeader>

          {editMode ? (
            <div className="space-y-4 mt-4">
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                  className="font-mono text-sm mt-1"
                  data-testid="input-edit-title"
                />
              </div>
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Body</Label>
                <Textarea
                  value={editForm.body}
                  onChange={(e) => setEditForm(f => ({ ...f, body: e.target.value }))}
                  className="font-mono text-sm mt-1 min-h-[200px]"
                  data-testid="input-edit-body"
                />
              </div>
              <div>
                <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Summary</Label>
                <Textarea
                  value={editForm.summary}
                  onChange={(e) => setEditForm(f => ({ ...f, summary: e.target.value }))}
                  className="font-mono text-sm mt-1 min-h-[80px]"
                  data-testid="input-edit-summary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">SEO Title</Label>
                  <Input
                    value={editForm.seoTitle}
                    onChange={(e) => setEditForm(f => ({ ...f, seoTitle: e.target.value }))}
                    className="font-mono text-sm mt-1"
                    data-testid="input-edit-seo-title"
                  />
                </div>
                <div>
                  <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">SEO Description</Label>
                  <Input
                    value={editForm.seoDescription}
                    onChange={(e) => setEditForm(f => ({ ...f, seoDescription: e.target.value }))}
                    className="font-mono text-sm mt-1"
                    data-testid="input-edit-seo-description"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" className="font-mono text-xs" onClick={() => setEditMode(false)} data-testid="button-cancel-edit">
                  Cancel
                </Button>
                <Button size="sm" className="font-mono text-xs" onClick={handleSaveEdit} disabled={updatePiece.isPending} data-testid="button-save-edit">
                  {updatePiece.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Save className="mr-2 h-3 w-3" />}
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {previewPiece?.summary && (
                <div className="p-3 bg-muted/30 rounded border border-border/50">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-1">Summary</span>
                  <p className="text-sm text-foreground">{previewPiece.summary}</p>
                </div>
              )}

              <div className="prose prose-sm max-w-none">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">Content</span>
                <div className="bg-card/30 border border-border/50 rounded p-4 space-y-2">
                  {(previewPiece?.body || "No content generated yet.").split("\n").map((line: string, i: number) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <div key={i} className="h-2" />;
                    if (trimmed.startsWith("### ")) return <h3 key={i} className="text-sm font-display font-semibold text-foreground mt-3 mb-1">{trimmed.slice(4)}</h3>;
                    if (trimmed.startsWith("## ")) return <h2 key={i} className="text-base font-display font-bold text-foreground mt-4 mb-1">{trimmed.slice(3)}</h2>;
                    if (trimmed.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground text-sm">{trimmed.slice(2)}</blockquote>;
                    if (trimmed.startsWith("- ")) return <div key={i} className="flex items-start gap-2 text-sm text-foreground"><span className="text-primary mt-0.5">•</span><span>{trimmed.slice(2)}</span></div>;
                    return <p key={i} className="text-sm text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />;
                  })}
                </div>
              </div>

              {(previewPiece?.seoTitle || previewPiece?.seoDescription) && (
                <div className="p-3 bg-emerald-500/5 rounded border border-emerald-500/20">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-500 block mb-1">SEO</span>
                  {previewPiece.seoTitle && <p className="text-sm font-semibold text-foreground">{previewPiece.seoTitle}</p>}
                  {previewPiece.seoDescription && <p className="text-xs text-muted-foreground mt-1">{previewPiece.seoDescription}</p>}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => {
                      setEditMode(true);
                      setEditForm({
                        title: previewPiece?.title || "",
                        body: previewPiece?.body || "",
                        summary: previewPiece?.summary || "",
                        seoTitle: previewPiece?.seoTitle || "",
                        seoDescription: previewPiece?.seoDescription || "",
                      });
                    }}
                    data-testid="button-edit-content"
                  >
                    <Edit3 className="mr-1.5 h-3 w-3" /> Edit
                  </Button>
                </div>
                <div className="flex gap-2">
                  {previewPiece?.status !== "ready" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10"
                      onClick={() => handleStatusChange(previewPiece.id, "ready")}
                      disabled={updatePiece.isPending}
                      data-testid="button-mark-ready"
                    >
                      <CheckCircle2 className="mr-1.5 h-3 w-3" /> Mark Ready
                    </Button>
                  )}
                  {previewPiece?.status !== "published" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                      onClick={() => handleStatusChange(previewPiece.id, "published")}
                      disabled={updatePiece.isPending}
                      data-testid="button-publish"
                    >
                      <Send className="mr-1.5 h-3 w-3" /> Publish
                    </Button>
                  )}
                  {previewPiece?.status !== "review" && previewPiece?.status !== "draft" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs"
                      onClick={() => handleStatusChange(previewPiece.id, "review")}
                      disabled={updatePiece.isPending}
                      data-testid="button-back-to-review"
                    >
                      <RefreshCw className="mr-1.5 h-3 w-3" /> Back to Review
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FileDropzone({ label, accept, icon: Icon, uploadedPath, onClear, onFile, isUploading, progress }: {
  label: string; accept: string; icon: any; uploadedPath: string;
  onClear: () => void; onFile: (f: File) => void; isUploading: boolean; progress: number;
}) {
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all",
        dragOver ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/50",
        isUploading && "pointer-events-none opacity-70"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      onClick={() => ref.current?.click()}
      data-testid={`dropzone-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} data-testid={`input-file-${label.toLowerCase().replace(/\s/g, "-")}`} />
      {isUploading ? (
        <div className="space-y-2">
          <Loader2 className="h-8 w-8 text-primary mx-auto animate-spin" />
          <p className="font-mono text-xs text-primary">Uploading... {progress}%</p>
          <Progress value={progress} className="h-1.5 max-w-[200px] mx-auto" />
        </div>
      ) : uploadedPath ? (
        <div className="space-y-1 relative">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
          <p className="font-mono text-xs text-emerald-500">{label} uploaded</p>
          <p className="text-[10px] text-muted-foreground truncate max-w-[200px] mx-auto">{uploadedPath.split("/").pop()}</p>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="absolute top-0 right-0 p-1 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
            data-testid={`button-clear-${label.toLowerCase().replace(/\s/g, "-")}`}
          >
            <XCloseIcon className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          <Icon className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="font-mono text-xs text-muted-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">Drag & drop or click</p>
        </div>
      )}
    </div>
  );
}

function UploadTab() {
  const { data: podcasts } = usePodcasts();
  const { data: episodes } = useEpisodes();
  const createEpisode = useCreateEpisode();
  const { toast } = useToast();

  const [form, setForm] = useState({
    title: "",
    podcastId: "",
    description: "",
    duration: "",
    episodeType: "audio",
  });

  const [audioPath, setAudioPath] = useState("");
  const [videoPath, setVideoPath] = useState("");
  const [thumbnailPath, setThumbnailPath] = useState("");

  const audioUpload = useUpload({
    onSuccess: (r) => { setAudioPath(r.objectPath); toast({ title: "Audio Uploaded" }); },
    onError: (err) => toast({ title: "Audio Upload Failed", description: err.message, variant: "destructive" }),
  });
  const videoUpload = useUpload({
    onSuccess: (r) => { setVideoPath(r.objectPath); toast({ title: "Video Uploaded" }); },
    onError: (err) => toast({ title: "Video Upload Failed", description: err.message, variant: "destructive" }),
  });
  const thumbnailUpload = useUpload({
    onSuccess: (r) => { setThumbnailPath(r.objectPath); toast({ title: "Thumbnail Uploaded" }); },
    onError: (err) => toast({ title: "Thumbnail Upload Failed", description: err.message, variant: "destructive" }),
  });

  const showAudio = form.episodeType === "audio" || form.episodeType === "both";
  const showVideo = form.episodeType === "video" || form.episodeType === "both";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: any = {
      title: form.title,
      podcastId: form.podcastId,
      description: form.description || undefined,
      duration: form.duration || undefined,
      episodeType: form.episodeType,
    };
    if (audioPath) data.audioUrl = audioPath;
    if (videoPath) data.videoUrl = videoPath;
    if (thumbnailPath) data.thumbnailUrl = thumbnailPath;
    createEpisode.mutate(data, {
      onSuccess: () => {
        toast({ title: "Episode Created", description: `"${form.title}" has been added to the content factory.` });
        setForm({ title: "", podcastId: "", description: "", duration: "", episodeType: "audio" });
        setAudioPath("");
        setVideoPath("");
        setThumbnailPath("");
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  const recentEpisodes = (episodes || [])
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
    .slice(0, 5);

  const hasFile = showAudio ? !!audioPath : showVideo ? !!videoPath : (!!audioPath || !!videoPath);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-xl flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Episode
            </CardTitle>
            <CardDescription className="font-mono text-xs">Upload audio and video files for AI content processing</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Episode Title *</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Episode title..."
                    required
                    data-testid="input-upload-title"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Podcast *</Label>
                  <Select value={form.podcastId} onValueChange={(v) => setForm({ ...form, podcastId: v })}>
                    <SelectTrigger data-testid="select-upload-podcast">
                      <SelectValue placeholder="Select a podcast" />
                    </SelectTrigger>
                    <SelectContent>
                      {podcasts?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Episode description — helps AI generate better content..."
                  rows={3}
                  data-testid="input-upload-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Duration</Label>
                  <Input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    placeholder="e.g. 45:30"
                    data-testid="input-upload-duration"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Episode Type</Label>
                  <Select value={form.episodeType} onValueChange={(v) => {
                    setForm({ ...form, episodeType: v });
                    if (v === "audio") setVideoPath("");
                    if (v === "video") setAudioPath("");
                  }}>
                    <SelectTrigger data-testid="select-upload-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audio">Audio Only</SelectItem>
                      <SelectItem value="video">Video Only</SelectItem>
                      <SelectItem value="both">Audio + Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="font-mono text-xs uppercase tracking-wider mb-3 block">Media Files</Label>
                <div className={cn("grid gap-4", form.episodeType === "both" ? "grid-cols-3" : "grid-cols-2")}>
                  {showAudio && (
                    <FileDropzone
                      label="Audio File"
                      accept="audio/*"
                      icon={Music}
                      uploadedPath={audioPath}
                      onClear={() => setAudioPath("")}
                      onFile={(f) => audioUpload.uploadFile(f)}
                      isUploading={audioUpload.isUploading}
                      progress={audioUpload.progress}
                    />
                  )}
                  {showVideo && (
                    <FileDropzone
                      label="Video File"
                      accept="video/*"
                      icon={Film}
                      uploadedPath={videoPath}
                      onClear={() => setVideoPath("")}
                      onFile={(f) => videoUpload.uploadFile(f)}
                      isUploading={videoUpload.isUploading}
                      progress={videoUpload.progress}
                    />
                  )}
                  <FileDropzone
                    label="Thumbnail"
                    accept="image/*"
                    icon={ImagePlus}
                    uploadedPath={thumbnailPath}
                    onClear={() => setThumbnailPath("")}
                    onFile={(f) => thumbnailUpload.uploadFile(f)}
                    isUploading={thumbnailUpload.isUploading}
                    progress={thumbnailUpload.progress}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono mt-2">
                  Accepted: {showAudio && "MP3, WAV, AAC, OGG"}{showAudio && showVideo && " · "}{showVideo && "MP4, MOV, WEBM"} · Images: JPG, PNG, WEBP
                </p>
              </div>

              <Button
                type="submit"
                disabled={createEpisode.isPending || !form.title || !form.podcastId}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider h-11"
                data-testid="button-submit-upload"
              >
                {createEpisode.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Create Episode
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Recent Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentEpisodes.length > 0 ? (
              <div className="space-y-3">
                {recentEpisodes.map((ep: any) => {
                  const podcast = (podcasts || []).find((p: any) => p.id === ep.podcastId);
                  return (
                    <div key={ep.id} className="flex items-start gap-3 p-2 rounded-md border border-border/30 hover:border-primary/20 transition-colors" data-testid={`recent-episode-${ep.id}`}>
                      <div className="flex-shrink-0 mt-0.5">
                        {ep.episodeType === "video" ? (
                          <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center"><Film className="h-4 w-4 text-blue-400" /></div>
                        ) : ep.episodeType === "both" ? (
                          <div className="h-8 w-8 rounded bg-purple-500/10 flex items-center justify-center"><Video className="h-4 w-4 text-purple-400" /></div>
                        ) : (
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center"><Mic className="h-4 w-4 text-primary" /></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{ep.title}</p>
                        <p className="text-[10px] text-muted-foreground font-mono truncate">
                          {podcast?.title || "Unknown"} · {ep.duration || "—"}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={cn("text-[9px] h-4 px-1",
                            ep.processingStatus === "complete" ? "border-emerald-500/30 text-emerald-400" :
                            ep.processingStatus === "processing" ? "border-blue-500/30 text-blue-400" :
                            "border-border/50 text-muted-foreground"
                          )}>
                            {ep.processingStatus === "complete" ? "Ready" : ep.processingStatus === "processing" ? `${ep.processingProgress}%` : "Pending"}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-border/30 text-muted-foreground">
                            {ep.episodeType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">No episodes uploaded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Upload Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="flex gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p>Add a detailed description to help AI generate better articles and social posts.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p>Use "Audio + Video" type when you have both formats for maximum content multiplication.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p>Upload a thumbnail for better presentation on the podcast directory page.</p>
              </div>
              <div className="flex gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
                <p>After uploading, go to the Pipeline tab to run the full AI content suite.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClipsTab() {
  const { data: episodes } = useEpisodes();
  const [filterEpisodeId, setFilterEpisodeId] = useState<string>("all");
  const [sortByScore, setSortByScore] = useState(true);
  const { data: clips, isLoading } = useClipAssets(filterEpisodeId === "all" ? undefined : filterEpisodeId);
  const updateClip = useUpdateClipAsset();
  const deleteClip = useDeleteClipAsset();
  const { toast } = useToast();

  const sortedClips = clips ? [...clips].sort((a: any, b: any) =>
    sortByScore ? (b.viralScore || 0) - (a.viralScore || 0) : 0
  ) : [];

  function handleApprove(id: string) {
    updateClip.mutate({ id, status: "approved" }, {
      onSuccess: () => toast({ title: "Clip Approved" }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleReject(id: string) {
    deleteClip.mutate(id, {
      onSuccess: () => toast({ title: "Clip Rejected" }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function getScoreColor(score: number) {
    if (score >= 80) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
    if (score >= 50) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    return "bg-red-500/20 text-red-400 border-red-500/50";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Viral Clip Factory
          </h2>
          <p className="text-muted-foreground font-mono text-xs mt-1">AI-detected viral moments from your episodes</p>
        </div>
        <div className="flex gap-3">
          <Select value={filterEpisodeId} onValueChange={setFilterEpisodeId}>
            <SelectTrigger className="w-[220px]" data-testid="select-clips-episode">
              <SelectValue placeholder="All Episodes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Episodes</SelectItem>
              {episodes?.map((ep: any) => (
                <SelectItem key={ep.id} value={ep.id}>{ep.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortByScore(!sortByScore)}
            className="font-mono text-xs"
            data-testid="button-sort-clips"
          >
            {sortByScore ? "Sorted by Score" : "Default Order"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : sortedClips.length === 0 ? (
        <Card className="glass-panel border-border/50 py-12 text-center">
          <Scissors className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-mono text-sm">No clip suggestions yet. Run the pipeline to generate clips.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedClips.map((clip: any) => (
            <Card key={clip.id} className="glass-panel border-border/50 hover:border-primary/20 transition-all" data-testid={`card-clip-${clip.id}`}>
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <Badge className={cn("text-lg font-bold font-mono px-3 py-1 border", getScoreColor(clip.viralScore || 0))} data-testid={`badge-score-${clip.id}`}>
                      {clip.viralScore || 0}
                    </Badge>
                    <span className="text-[9px] font-mono uppercase text-muted-foreground">Viral</span>
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base truncate" data-testid={`text-clip-title-${clip.id}`}>{clip.title}</h3>
                      <Badge variant="outline" className={cn(
                        "font-mono text-[9px] uppercase",
                        clip.status === "approved" ? "border-emerald-500/50 text-emerald-500" :
                        clip.status === "exported" ? "border-primary/50 text-primary" :
                        "border-muted text-muted-foreground"
                      )}>{clip.status}</Badge>
                      {clip.platform && (
                        <Badge variant="outline" className="font-mono text-[9px]">
                          {getPlatformIcon(clip.platform, "h-3 w-3 mr-1 inline")}
                          {getPlatformLabel(clip.platform)}
                        </Badge>
                      )}
                    </div>

                    {clip.hookText && (
                      <p className="text-sm text-foreground/80 italic">"{clip.hookText}"</p>
                    )}

                    <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {clip.startTime} → {clip.endTime}
                      </span>
                      {clip.duration && <span>({clip.duration})</span>}
                    </div>

                    {clip.transcriptExcerpt && (
                      <blockquote className="border-l-2 border-primary/30 pl-3 text-xs text-muted-foreground italic mt-2 line-clamp-2">
                        {clip.transcriptExcerpt}
                      </blockquote>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(clip.id)}
                      disabled={updateClip.isPending || clip.status === "approved"}
                      className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                      data-testid={`button-approve-clip-${clip.id}`}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(clip.id)}
                      disabled={deleteClip.isPending}
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                      data-testid={`button-reject-clip-${clip.id}`}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleTab() {
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
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-8 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Scheduled Posts
          </h2>
          <Button onClick={openNewDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-schedule-post">
            <Plus className="mr-1.5 h-3 w-3" /> Schedule Post
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : !posts?.length ? (
          <Card className="glass-panel border-border/50 py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-mono text-sm">No scheduled posts yet.</p>
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

function NewsletterTab() {
  const { data: runs, isLoading } = useNewsletterRuns();
  const generateNewsletter = useGenerateNewsletter();
  const sendNewsletter = useSendNewsletter();
  const deleteRun = useDeleteNewsletterRun();
  const { toast } = useToast();

  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [previewRun, setPreviewRun] = useState<any>(null);
  const [confirmSendId, setConfirmSendId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sentCount = runs?.filter((r: any) => r.status === "sent").length || 0;
  const draftCount = runs?.filter((r: any) => r.status === "draft").length || 0;
  const totalCount = runs?.length || 0;

  const monthNames = Array.from({ length: 12 }, (_, i) =>
    new Date(2024, i).toLocaleString("default", { month: "long" })
  );

  function handleGenerate() {
    generateNewsletter.mutate({ month, year }, {
      onSuccess: () => toast({ title: "Newsletter Generated", description: `Newsletter for ${monthNames[parseInt(month) - 1]} ${year} has been created.` }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleSend(id: string) {
    sendNewsletter.mutate(id, {
      onSuccess: () => {
        toast({ title: "Newsletter Sent", description: "Newsletter has been sent to all subscribers." });
        setConfirmSendId(null);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setConfirmSendId(null);
      },
    });
  }

  function handleDelete(id: string) {
    deleteRun.mutate(id, {
      onSuccess: () => {
        toast({ title: "Newsletter Deleted" });
        if (previewRun?.id === id) setPreviewRun(null);
        setConfirmDeleteId(null);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
        setConfirmDeleteId(null);
      },
    });
  }

  function getStatusConfig(status: string) {
    switch (status) {
      case "sent": return { color: "border-l-emerald-500", badgeCls: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10", icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />, label: "Sent" };
      case "draft": return { color: "border-l-amber-500", badgeCls: "border-amber-500/40 text-amber-400 bg-amber-500/10", icon: <Edit3 className="h-3.5 w-3.5 text-amber-400" />, label: "Draft" };
      default: return { color: "border-l-primary", badgeCls: "border-primary/40 text-primary bg-primary/10", icon: <Mail className="h-3.5 w-3.5 text-primary" />, label: status };
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-panel border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold" data-testid="text-total-newsletters">{totalCount}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Total Runs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Send className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-emerald-400" data-testid="text-sent-newsletters">{sentCount}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Sent</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Edit3 className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-amber-400" data-testid="text-draft-newsletters">{draftCount}</p>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Drafts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-lg bg-primary/15 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm">Generate Newsletter</h3>
              <p className="text-[10px] font-mono text-muted-foreground">AI will compile highlights from your published content</p>
            </div>
          </div>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Month</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-[160px] bg-background/80 backdrop-blur" data-testid="select-newsletter-month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((name, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Year</Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-[110px] bg-background/80 backdrop-blur" data-testid="select-newsletter-year">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generateNewsletter.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider h-9 px-5"
              data-testid="button-generate-newsletter"
            >
              {generateNewsletter.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
              Generate for {monthNames[parseInt(month) - 1]}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-sm font-display font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
              <Calendar className="h-4 w-4" />
              Newsletter History
            </h2>
            {totalCount > 0 && (
              <span className="text-[10px] font-mono text-muted-foreground">{totalCount} {totalCount === 1 ? "run" : "runs"}</span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
          ) : !runs?.length ? (
            <Card className="glass-panel border-border/50 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-8 w-8 text-primary/30" />
                </div>
                <h3 className="font-display font-bold mb-1">No newsletters yet</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                  Select a month and year above to generate your first AI-powered newsletter from your published content.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {runs.map((run: any) => {
                const sc = getStatusConfig(run.status);
                const isSelected = previewRun?.id === run.id;
                return (
                  <Card
                    key={run.id}
                    className={cn(
                      "glass-panel border-border/50 cursor-pointer transition-all border-l-[3px] hover:bg-accent/30",
                      sc.color,
                      isSelected && "ring-1 ring-primary/30 bg-primary/5"
                    )}
                    onClick={() => setPreviewRun(run)}
                    data-testid={`card-newsletter-${run.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{sc.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h3 className="font-display font-bold text-sm truncate" data-testid={`text-newsletter-title-${run.id}`}>{run.title}</h3>
                            <Badge variant="outline" className={cn("font-mono text-[9px] uppercase shrink-0", sc.badgeCls)}>
                              {sc.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mb-1">{run.period}</p>
                          {run.body && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-2 leading-relaxed">{run.body.replace(/[#>*_]/g, "").substring(0, 150)}...</p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            {run.createdAt && (
                              <span className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5" />
                                {new Date(run.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            )}
                            {run.sentAt && (
                              <span className="text-[10px] text-emerald-400/70 font-mono flex items-center gap-1">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                Sent {new Date(run.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                          {run.status !== "sent" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmSendId(run.id)}
                              disabled={sendNewsletter.isPending}
                              className="font-mono text-[10px] h-7 px-2.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              data-testid={`button-send-newsletter-${run.id}`}
                            >
                              <Send className="h-3 w-3 mr-1" /> Send
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-400"
                            onClick={() => setConfirmDeleteId(run.id)}
                            data-testid={`button-delete-newsletter-${run.id}`}
                          >
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

        <div className="col-span-12 lg:col-span-5">
          <div className="sticky top-4 space-y-4">
            <Card className="glass-panel border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  Preview
                  {previewRun && (
                    <Badge variant="outline" className={cn("ml-auto font-mono text-[9px] uppercase", getStatusConfig(previewRun.status).badgeCls)}>
                      {previewRun.status}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {previewRun ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-primary/10 to-transparent rounded-lg p-4">
                      <h3 className="font-display font-bold text-base leading-snug mb-1" data-testid="text-preview-title">{previewRun.title}</h3>
                      <p className="text-xs font-mono text-muted-foreground">{previewRun.period}</p>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
                      <div className="prose prose-invert prose-sm max-w-none">
                        {previewRun.body?.split("\n").map((line: string, i: number) => {
                          if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-display font-semibold mt-4 mb-1.5 text-foreground">{line.replace("### ", "")}</h3>;
                          if (line.startsWith("## ")) return <h2 key={i} className="text-base font-display font-bold mt-5 mb-2 text-foreground border-b border-border/30 pb-1">{line.replace("## ", "")}</h2>;
                          if (line.startsWith("# ")) return <h1 key={i} className="text-lg font-display font-bold mt-5 mb-2 text-foreground">{line.replace("# ", "")}</h1>;
                          if (line.startsWith("- ")) return <li key={i} className="text-sm text-muted-foreground ml-4 mb-1 list-disc">{line.replace("- ", "")}</li>;
                          if (line.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-primary/40 pl-3 italic text-muted-foreground my-2 text-sm">{line.replace("> ", "")}</blockquote>;
                          if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-sm text-foreground mb-1">{line.replace(/\*\*/g, "")}</p>;
                          if (line.trim() === "---") return <hr key={i} className="border-border/30 my-4" />;
                          if (line.trim() === "") return <div key={i} className="h-2" />;
                          return <p key={i} className="mb-2 text-sm leading-relaxed text-muted-foreground">{line}</p>;
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-3 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
                      {previewRun.status !== "sent" ? (
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider"
                          onClick={() => setConfirmSendId(previewRun.id)}
                          disabled={sendNewsletter.isPending}
                          data-testid="button-preview-send"
                        >
                          <Send className="h-3.5 w-3.5 mr-2" /> Send to Subscribers
                        </Button>
                      ) : (
                        <div className="flex-1 text-center py-2">
                          <span className="text-xs font-mono text-emerald-400 flex items-center justify-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Already sent
                          </span>
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        onClick={() => setConfirmDeleteId(previewRun.id)}
                        data-testid="button-preview-delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-3">
                      <Eye className="h-7 w-7 text-muted-foreground/20" />
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">Click a newsletter to preview it here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={!!confirmSendId} onOpenChange={() => setConfirmSendId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-400" />
              Confirm Send
            </DialogTitle>
            <DialogDescription>
              This will send the newsletter to all your subscribers. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setConfirmSendId(null)} className="font-mono text-xs">Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-xs uppercase tracking-wider"
              onClick={() => confirmSendId && handleSend(confirmSendId)}
              disabled={sendNewsletter.isPending}
              data-testid="button-confirm-send"
            >
              {sendNewsletter.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Send className="mr-2 h-3 w-3" />}
              Send Newsletter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Delete Newsletter
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this newsletter? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)} className="font-mono text-xs">Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => confirmDeleteId && handleDelete(confirmDeleteId)}
              disabled={deleteRun.isPending}
              className="font-mono text-xs uppercase tracking-wider"
              data-testid="button-confirm-delete"
            >
              {deleteRun.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Trash2 className="mr-2 h-3 w-3" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
