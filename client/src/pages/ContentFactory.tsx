import { useState, useCallback, useRef } from "react";
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
  Edit3, Eye, Building2, Wifi, WifiOff, Sparkles, Zap, Send, Save,
  ChevronRight, AlertTriangle, ImagePlus, Music, Film, X as XCloseIcon,
  TrendingUp, Target, BarChart3, Lightbulb, Hash, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEpisodes, useContentPieces, usePodcasts, useCreateEpisode,
  useRunFullPipeline, useSmartSuggestions, useGenerateNewsletter,
  useClipAssets, useUpdateClipAsset, useDeleteClipAsset,
  useScheduledPosts, useCreateScheduledPost, useUpdateScheduledPost, useDeleteScheduledPost,
  useSocialAccounts, useCreateSocialAccount, useUpdateSocialAccount, useDeleteSocialAccount,
  useNewsletterRuns, useSendNewsletter, useDeleteNewsletterRun
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
    case "x": return "X (Twitter)";
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
          <TabsTrigger value="social" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-social">
            <Wifi className="mr-1.5 h-3 w-3" /> Social
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
        <TabsContent value="social" className="mt-4">
          <SocialTab />
        </TabsContent>
        <TabsContent value="newsletter" className="mt-4">
          <NewsletterTab />
        </TabsContent>
      </Tabs>
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

  function toggleContentType(type: string) {
    setContentTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
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
                  <Badge variant="outline" className={cn(
                    "font-mono text-xs",
                    selectedEpisode.transcriptStatus === "ready" ? "border-emerald-500/50 text-emerald-500" :
                    selectedEpisode.transcriptStatus === "processing" ? "border-primary/50 text-primary" :
                    "border-muted text-muted-foreground"
                  )}>
                    Transcript: {selectedEpisode.transcriptStatus || "pending"}
                  </Badge>
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
                              <Button variant="ghost" size="icon" className="h-6 w-6" data-testid={`button-view-${item.id}`}>
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
              <div className="space-y-3 text-sm">
                {typeof suggestions === "object" && suggestions.suggestions ? (
                  Array.isArray(suggestions.suggestions) ? suggestions.suggestions.map((s: any, i: number) => (
                    <div key={i} className="p-3 rounded bg-card/50 border border-border/50 text-xs">
                      <p className="text-foreground">{typeof s === "string" ? s : s.text || JSON.stringify(s)}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground">{JSON.stringify(suggestions.suggestions)}</p>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground">Select a content piece and click "Get Suggestions" in the schedule dialog.</p>
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
                  <SelectItem value="x">X (Twitter)</SelectItem>
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

function SocialTab() {
  const qc = useQueryClient();
  const { data: accounts, isLoading } = useSocialAccounts();
  const createAccount = useCreateSocialAccount();
  const updateAccount = useUpdateSocialAccount();
  const deleteAccount = useDeleteSocialAccount();
  const { toast } = useToast();
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; platform: string }>({ open: false, platform: "" });
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; account: any | null }>({ open: false, account: null });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ accountName: "", accountUrl: "" });
  const [connectStep, setConnectStep] = useState<"form" | "verifying" | "success">("form");
  const [form, setForm] = useState({ accountName: "", accountUrl: "" });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [reconnectingId, setReconnectingId] = useState<string | null>(null);

  const platformCards = [
    { platform: "x", label: "X (Twitter)", description: "Post updates, threads, and engage followers", icon: <XIcon className="h-8 w-8" />, color: "text-foreground", bgGradient: "from-zinc-800 to-zinc-900" },
    { platform: "facebook", label: "Facebook", description: "Share content to pages and groups", icon: <Facebook className="h-8 w-8" />, color: "text-blue-500", bgGradient: "from-blue-950 to-blue-900" },
    { platform: "instagram", label: "Instagram", description: "Visual stories, reels, and carousels", icon: <InstagramIcon className="h-8 w-8" />, color: "text-pink-500", bgGradient: "from-pink-950 to-purple-900" },
    { platform: "linkedin", label: "LinkedIn", description: "Professional content and B2B engagement", icon: <Linkedin className="h-8 w-8" />, color: "text-[#0A66C2]", bgGradient: "from-blue-950 to-cyan-900" },
    { platform: "tiktok", label: "TikTok", description: "Short-form video clips and trends", icon: <TikTokIcon className="h-8 w-8" />, color: "text-foreground", bgGradient: "from-zinc-800 to-zinc-900" },
    { platform: "google_business", label: "Google Business", description: "Update your business profile and posts", icon: <Building2 className="h-8 w-8" />, color: "text-emerald-500", bgGradient: "from-emerald-950 to-green-900" },
  ];

  function getAccountForPlatform(platform: string) {
    return accounts?.find((a: any) => a.platform === platform);
  }

  function getStatusIndicator(status: string) {
    switch (status) {
      case "connected": return { color: "bg-emerald-500", pulseColor: "bg-emerald-500/50", label: "Connected", textColor: "text-emerald-400", icon: <CheckCircle2 className="h-3.5 w-3.5" /> };
      case "token_expired": return { color: "bg-amber-500", pulseColor: "bg-amber-500/50", label: "Token Expired", textColor: "text-amber-400", icon: <AlertTriangle className="h-3.5 w-3.5" /> };
      default: return { color: "bg-muted-foreground/30", pulseColor: "", label: "Not Connected", textColor: "text-muted-foreground", icon: <WifiOff className="h-3.5 w-3.5" /> };
    }
  }

  function openConnectDialog(platform: string) {
    setForm({ accountName: "", accountUrl: "" });
    setConnectStep("form");
    setConnectDialog({ open: true, platform });
  }

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnectStep("verifying");
    createAccount.mutate(
      { platform: connectDialog.platform, accountName: form.accountName, accountUrl: form.accountUrl },
      {
        onSuccess: () => {
          setConnectStep("success");
          setTimeout(() => {
            setConnectDialog({ open: false, platform: "" });
            setConnectStep("form");
            toast({ title: "Account Connected", description: `${getPlatformLabel(connectDialog.platform)} has been successfully connected.` });
          }, 1500);
        },
        onError: (err: any) => {
          setConnectStep("form");
          toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
        },
      }
    );
  }

  function handleDisconnect(id: string, platform: string) {
    deleteAccount.mutate(id, {
      onSuccess: () => {
        toast({ title: "Account Disconnected", description: `${getPlatformLabel(platform)} has been disconnected.` });
        setDetailDialog({ open: false, account: null });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  async function handleTestConnection(id: string) {
    setTestingId(id);
    try {
      const res = await fetch(`/api/social-accounts/${id}/test`, { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Connection test failed");
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      toast({ title: "Connection Verified", description: "The connection is working properly." });
    } catch (err: any) {
      toast({ title: "Test Failed", description: err.message || "Could not verify the connection.", variant: "destructive" });
    } finally {
      setTestingId(null);
    }
  }

  async function handleReconnect(id: string) {
    setReconnectingId(id);
    try {
      const res = await fetch(`/api/social-accounts/${id}/reconnect`, { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Reconnection failed");
      const data = await res.json();
      qc.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      toast({ title: "Reconnected", description: "Token has been refreshed successfully." });
      if (detailDialog.account) {
        setDetailDialog({ open: true, account: { ...detailDialog.account, status: "connected" } });
      }
    } catch (err: any) {
      toast({ title: "Reconnect Failed", description: err.message || "Could not reconnect.", variant: "destructive" });
    } finally {
      setReconnectingId(null);
    }
  }

  function openDetailDialog(account: any) {
    setEditMode(false);
    setEditForm({ accountName: account.accountName, accountUrl: account.accountUrl || "" });
    setDetailDialog({ open: true, account });
  }

  function handleSaveEdit() {
    if (!detailDialog.account) return;
    updateAccount.mutate(
      { id: detailDialog.account.id, data: editForm },
      {
        onSuccess: (updated: any) => {
          setEditMode(false);
          setDetailDialog({ open: true, account: { ...detailDialog.account, ...editForm } });
          toast({ title: "Account Updated" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  }

  const connectedCount = accounts?.filter((a: any) => a.status === "connected").length || 0;
  const totalPlatforms = platformCards.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            Platform Connections
          </h2>
          <p className="text-muted-foreground font-mono text-xs mt-1">
            {connectedCount} of {totalPlatforms} platforms connected
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Expired</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
              <span className="text-muted-foreground">Inactive</span>
            </div>
          </div>
        </div>
      </div>

      {connectedCount > 0 && (
        <div className="w-full bg-card/30 rounded-full h-2 border border-border/30">
          <div
            className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(connectedCount / totalPlatforms) * 100}%` }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platformCards.map(({ platform, label, description, icon, color, bgGradient }) => {
            const account = getAccountForPlatform(platform);
            const status = getStatusIndicator(account?.status || "disconnected");
            const isConnected = account?.status === "connected";
            const isExpired = account?.status === "token_expired";

            return (
              <Card
                key={platform}
                className={cn(
                  "glass-panel border-border/50 transition-all duration-300 overflow-hidden group",
                  isConnected && "border-emerald-500/30 hover:border-emerald-500/50",
                  isExpired && "border-amber-500/30 hover:border-amber-500/50",
                  !account && "hover:border-primary/30"
                )}
                data-testid={`card-social-${platform}`}
              >
                <div className={cn("h-1.5 w-full bg-gradient-to-r", bgGradient, isConnected && "from-emerald-600 to-emerald-500", isExpired && "from-amber-600 to-amber-500")} />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("p-3 rounded-xl bg-card border border-border/50", color)}>
                      {icon}
                    </div>
                    <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono", status.textColor, isConnected ? "bg-emerald-500/10" : isExpired ? "bg-amber-500/10" : "bg-muted/30")}>
                      {isConnected && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>}
                      {isExpired && <AlertTriangle className="h-3 w-3" />}
                      {!account && <WifiOff className="h-3 w-3" />}
                      {status.label}
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-base">{label}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-4">{description}</p>

                  {account ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono bg-card/50 rounded-lg px-3 py-2 border border-border/30">
                        <span className="truncate">{account.accountName}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailDialog(account)}
                          className="flex-1 font-mono text-xs"
                          data-testid={`button-manage-${platform}`}
                        >
                          <Eye className="h-3 w-3 mr-1" /> Manage
                        </Button>
                        {isExpired && (
                          <Button
                            size="sm"
                            onClick={() => handleReconnect(account.id)}
                            disabled={reconnectingId === account.id}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs"
                            data-testid={`button-reconnect-${platform}`}
                          >
                            {reconnectingId === account.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                            Reconnect
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => openConnectDialog(platform)}
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-mono text-xs uppercase tracking-wider"
                      data-testid={`button-connect-${platform}`}
                    >
                      <Wifi className="h-3 w-3 mr-1.5" /> Connect {label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={connectDialog.open} onOpenChange={(open) => { if (!open) { setConnectDialog({ open: false, platform: "" }); setConnectStep("form"); } }}>
        <DialogContent className="glass-panel border-border sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              {connectDialog.platform && (
                <div className="p-2 rounded-lg bg-card border border-border">
                  {getPlatformIcon(connectDialog.platform, "h-6 w-6")}
                </div>
              )}
              <div>
                <DialogTitle className="font-display text-xl">Connect {getPlatformLabel(connectDialog.platform)}</DialogTitle>
                <DialogDescription className="font-mono text-xs">Link your account to enable automated publishing</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {connectStep === "form" && (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="rounded-lg border border-border/50 bg-card/30 p-4 space-y-4">
                <div className="flex items-start gap-3 text-xs">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                    <span className="font-mono font-bold text-primary text-xs">1</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-wider">Account Handle / Name</Label>
                    <Input
                      value={form.accountName}
                      onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                      placeholder={connectDialog.platform === "x" ? "@yourhandle" : "Your account name"}
                      required
                      data-testid="input-connect-name"
                    />
                  </div>
                </div>
                <div className="flex items-start gap-3 text-xs">
                  <div className="rounded-full bg-primary/10 p-1.5 mt-0.5">
                    <span className="font-mono font-bold text-primary text-xs">2</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-wider">Profile URL <span className="text-muted-foreground">(optional)</span></Label>
                    <Input
                      value={form.accountUrl}
                      onChange={(e) => setForm({ ...form, accountUrl: e.target.value })}
                      placeholder={`https://${connectDialog.platform === "x" ? "x.com" : connectDialog.platform === "linkedin" ? "linkedin.com/company" : connectDialog.platform + ".com"}/...`}
                      data-testid="input-connect-url"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>We'll verify the connection after linking your account.</span>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setConnectDialog({ open: false, platform: "" })} className="font-mono text-xs" data-testid="button-cancel-connect">Cancel</Button>
                <Button type="submit" disabled={createAccount.isPending || !form.accountName} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-connect">
                  <Wifi className="mr-2 h-3 w-3" />
                  Connect & Verify
                </Button>
              </DialogFooter>
            </form>
          )}

          {connectStep === "verifying" && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              </div>
              <div className="text-center space-y-1">
                <p className="font-display font-bold">Verifying Connection...</p>
                <p className="text-xs text-muted-foreground font-mono">Authenticating with {getPlatformLabel(connectDialog.platform)}</p>
              </div>
              <div className="space-y-2 w-full max-w-xs">
                {["Initializing OAuth handshake", "Validating credentials", "Testing API access"].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 400}ms` }}>
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                    <span className="text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {connectStep === "success" && (
            <div className="py-8 flex flex-col items-center gap-4 animate-in zoom-in-50 fade-in duration-300">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-display font-bold text-emerald-500">Connected Successfully!</p>
                <p className="text-xs text-muted-foreground font-mono">{getPlatformLabel(connectDialog.platform)} is now linked to your platform</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialog.open} onOpenChange={(open) => { if (!open) setDetailDialog({ open: false, account: null }); }}>
        <DialogContent className="glass-panel border-border sm:max-w-lg">
          {detailDialog.account && (() => {
            const acc = detailDialog.account;
            const status = getStatusIndicator(acc.status);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-card border border-border">
                      {getPlatformIcon(acc.platform, "h-7 w-7")}
                    </div>
                    <div>
                      <DialogTitle className="font-display text-xl">{getPlatformLabel(acc.platform)}</DialogTitle>
                      <DialogDescription className="font-mono text-xs flex items-center gap-1.5 mt-0.5">
                        <div className={cn("h-2 w-2 rounded-full", status.color)} />
                        <span className={status.textColor}>{status.label}</span>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {editMode ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase tracking-wider">Account Name</Label>
                        <Input
                          value={editForm.accountName}
                          onChange={(e) => setEditForm({ ...editForm, accountName: e.target.value })}
                          data-testid="input-edit-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase tracking-wider">Profile URL</Label>
                        <Input
                          value={editForm.accountUrl}
                          onChange={(e) => setEditForm({ ...editForm, accountUrl: e.target.value })}
                          data-testid="input-edit-url"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditMode(false)} className="font-mono text-xs">Cancel</Button>
                        <Button size="sm" onClick={handleSaveEdit} disabled={updateAccount.isPending} className="font-mono text-xs bg-primary hover:bg-primary/90">
                          {updateAccount.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border/50 bg-card/30 divide-y divide-border/30">
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Account</span>
                        <span className="text-sm font-mono">{acc.accountName}</span>
                      </div>
                      {acc.accountUrl && (
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">URL</span>
                          <a href={acc.accountUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-primary hover:underline truncate max-w-[200px]">{acc.accountUrl}</a>
                        </div>
                      )}
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Connected</span>
                        <span className="text-sm font-mono">{acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : "—"}</span>
                      </div>
                      {acc.lastPostedAt && (
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Last Post</span>
                          <span className="text-sm font-mono">{new Date(acc.lastPostedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {!editMode && (
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditMode(true); setEditForm({ accountName: acc.accountName, accountUrl: acc.accountUrl || "" }); }}
                        className="font-mono text-xs"
                        data-testid="button-edit-account"
                      >
                        <Edit3 className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(acc.id)}
                        disabled={testingId === acc.id}
                        className="font-mono text-xs"
                        data-testid="button-test-connection"
                      >
                        {testingId === acc.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(acc.id, acc.platform)}
                        className="text-red-500 border-red-500/30 hover:bg-red-500/10 font-mono text-xs"
                        data-testid="button-disconnect-account"
                      >
                        <WifiOff className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
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

  function handleGenerate() {
    generateNewsletter.mutate({ month, year }, {
      onSuccess: () => toast({ title: "Newsletter Generated", description: `Newsletter for ${month}/${year} has been created.` }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleSend(id: string) {
    sendNewsletter.mutate(id, {
      onSuccess: () => toast({ title: "Newsletter Sent", description: "Newsletter has been sent to subscribers." }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleDelete(id: string) {
    deleteRun.mutate(id, {
      onSuccess: () => {
        toast({ title: "Newsletter Deleted" });
        if (previewRun?.id === id) setPreviewRun(null);
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-7 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Newsletter Runs
          </h2>
        </div>

        <Card className="glass-panel border-border/50">
          <CardContent className="p-4">
            <div className="flex items-end gap-3">
              <div className="space-y-1">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Month</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-[120px]" data-testid="select-newsletter-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {new Date(2024, i).toLocaleString("default", { month: "long" })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Year</Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-[100px]" data-testid="select-newsletter-year">
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider"
                data-testid="button-generate-newsletter"
              >
                {generateNewsletter.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
                Generate Monthly Newsletter
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : !runs?.length ? (
          <Card className="glass-panel border-border/50 py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-mono text-sm">No newsletter runs yet. Generate one above.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {runs.map((run: any) => (
              <Card key={run.id} className={cn("glass-panel border-border/50 cursor-pointer transition-all", previewRun?.id === run.id && "border-primary/50")} onClick={() => setPreviewRun(run)} data-testid={`card-newsletter-${run.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-display font-bold text-sm truncate" data-testid={`text-newsletter-title-${run.id}`}>{run.title}</h3>
                        <Badge variant="outline" className={cn(
                          "font-mono text-[9px] uppercase",
                          run.status === "sent" ? "border-emerald-500 text-emerald-500 bg-emerald-500/10" :
                          run.status === "draft" ? "border-muted text-muted-foreground" :
                          "border-primary text-primary bg-primary/10"
                        )}>{run.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{run.period}</p>
                      {run.body && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{run.body}</p>
                      )}
                      {run.createdAt && (
                        <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
                          Created: {new Date(run.createdAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 ml-3" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSend(run.id)}
                        disabled={sendNewsletter.isPending || run.status === "sent"}
                        className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10"
                        data-testid={`button-send-newsletter-${run.id}`}
                      >
                        <Send className="h-3 w-3 mr-1" /> Send
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 hover:text-red-400"
                        onClick={() => handleDelete(run.id)}
                        data-testid={`button-delete-newsletter-${run.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-12 lg:col-span-5">
        <Card className="glass-panel border-border/50 sticky top-4">
          <CardHeader>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Newsletter Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewRun ? (
              <div className="space-y-3">
                <h3 className="font-display font-bold text-lg" data-testid="text-preview-title">{previewRun.title}</h3>
                <p className="text-xs font-mono text-muted-foreground">{previewRun.period}</p>
                <div className="prose prose-invert prose-sm max-w-none border-t border-border/50 pt-3">
                  {previewRun.body?.split("\n").map((line: string, i: number) => {
                    if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold mt-3 mb-1">{line.replace("### ", "")}</h3>;
                    if (line.startsWith("## ")) return <h2 key={i} className="text-base font-bold mt-4 mb-2">{line.replace("## ", "")}</h2>;
                    if (line.startsWith("# ")) return <h1 key={i} className="text-lg font-bold mt-4 mb-2">{line.replace("# ", "")}</h1>;
                    if (line.startsWith("> ")) return <blockquote key={i} className="border-l-2 border-primary/30 pl-3 italic text-muted-foreground my-2">{line.replace("> ", "")}</blockquote>;
                    if (line.trim() === "") return <br key={i} />;
                    return <p key={i} className="mb-1.5 text-sm leading-relaxed">{line}</p>;
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Eye className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="font-mono text-xs">Select a newsletter to preview</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
