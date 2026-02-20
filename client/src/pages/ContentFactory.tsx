import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  TrendingUp, Target, BarChart3, Lightbulb, Hash, RefreshCw, BellRing, LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import PageHeader from "@/components/admin/PageHeader";
import AIGenerateModal from "@/components/admin/AIGenerateModal";
import MetricsStrip from "@/components/admin/MetricsStrip";
import DataCard from "@/components/admin/DataCard";
import EmptyState from "@/components/admin/EmptyState";
import {
  useEpisodes, useContentPieces, usePodcasts, useCreateEpisode,
  useQueueTranscription, useRunFullPipeline, useSmartSuggestions, useGenerateNewsletter,
  useClipAssets, useUpdateClipAsset, useDeleteClipAsset,
  useNewsletterRuns, useSendNewsletter, useDeleteNewsletterRun,
  useUpdateContentPiece,
  useContentGenerationJobs, useGenerateContentPipeline, useContentPipelinePieces,
  useContentAnalytics, useRefreshContentAnalytics
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

function ProcessingQueue() {
  const { data: episodes } = useEpisodes();
  const { data: podcasts } = usePodcasts();
  const queryClient = useQueryClient();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const activeEpisodes = (episodes || []).filter((ep: any) =>
    (ep.processingStatus === "processing" || ep.transcriptStatus === "processing" ||
     ((ep.processingStatus === "completed" || ep.processingStatus === "error") &&
       ep.updatedAt && (Date.now() - new Date(ep.updatedAt).getTime()) < 3600000)) &&
    !dismissedIds.has(ep.id)
  );

  const processingCount = activeEpisodes.filter((ep: any) =>
    ep.processingStatus === "processing" || ep.transcriptStatus === "processing"
  ).length;

  useEffect(() => {
    if (processingCount === 0) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
    }, 3000);
    return () => clearInterval(interval);
  }, [processingCount, queryClient]);

  if (activeEpisodes.length === 0) return null;

  const stepLabels: Record<string, string> = {
    transcription: "Transcribing",
    keywords: "Keywords",
    article: "Article",
    blog: "Blog",
    social: "Social",
    clips: "Clips",
    newsletter: "Newsletter",
    seo: "SEO",
  };

  const canDismiss = (ep: any) =>
    ep.processingProgress >= 100 || ep.processingStatus === "completed" || ep.processingStatus === "error";

  return (
    <Card className="border-blue-500/30 bg-blue-500/5 shadow-lg shadow-blue-500/5" data-testid="processing-queue">
      <CardContent className="py-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative">
            <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-blue-400 font-semibold">
            Processing Queue
          </span>
          <Badge variant="outline" className="ml-auto font-mono text-[10px] border-blue-500/30 text-blue-400">
            {processingCount > 0 ? `${processingCount} active` : "done"}
          </Badge>
        </div>
        <div className="divide-y divide-border/30">
          {activeEpisodes.map((ep: any) => {
            const podcast = (podcasts || []).find((p: any) => p.id === ep.podcastId);
            const currentStep = ep.processingStep || "transcription";
            const progress = ep.processingProgress || 0;
            const isError = ep.processingStatus === "error";
            return (
              <div key={ep.id} className="flex items-center gap-3 h-12 group" data-testid={`queue-item-${ep.id}`}>
                <Mic className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                <div className="flex items-baseline gap-1.5 min-w-0 max-w-[300px]">
                  <span className="text-sm font-semibold truncate" data-testid={`queue-title-${ep.id}`}>{ep.title}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0">· {podcast?.title || "Unknown"}</span>
                </div>
                <div className="w-[120px] h-1.5 bg-muted/50 rounded-full overflow-hidden shrink-0 ml-auto">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${progress}%`,
                      background: isError
                        ? "hsl(0 72% 51%)"
                        : "linear-gradient(90deg, hsl(217 91% 60%) 0%, hsl(199 89% 48%) 100%)",
                    }}
                  />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-mono text-blue-400 tabular-nums w-8 text-right">{progress}%</span>
                  <span className={cn("text-[11px] w-20 truncate", isError ? "text-red-400" : "text-muted-foreground")}>
                    {isError ? "Failed" : stepLabels[currentStep] || "Processing"}
                  </span>
                </div>
                <div className="w-6 shrink-0 flex justify-center">
                  {canDismiss(ep) && (
                    <button
                      onClick={() => setDismissedIds(prev => new Set([...prev, ep.id]))}
                      className="text-muted-foreground/40 hover:text-foreground p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid={`dismiss-queue-${ep.id}`}
                    >
                      <XCloseIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentPerformanceLeaderboard() {
  const { data: episodes } = useEpisodes();
  const [analyticsEpisodeId, setAnalyticsEpisodeId] = useState<string>("");
  const { data: analytics, isLoading: analyticsLoading } = useContentAnalytics(analyticsEpisodeId || undefined);
  const refreshAnalytics = useRefreshContentAnalytics();

  const pieces = analytics?.pieces || analytics?.contentPieces || (Array.isArray(analytics) ? analytics : []);

  return (
    <DataCard title="Content Performance Leaderboard" subtitle="Top content by engagement metrics">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Select value={analyticsEpisodeId} onValueChange={setAnalyticsEpisodeId}>
            <SelectTrigger className="flex-1 h-8 font-mono text-xs" data-testid="select-analytics-episode">
              <SelectValue placeholder="Select episode for analytics..." />
            </SelectTrigger>
            <SelectContent>
              {(episodes || []).map((ep: any) => (
                <SelectItem key={ep.id} value={ep.id} className="font-mono text-xs">
                  {ep.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className="font-mono text-[10px] uppercase tracking-wider shrink-0"
            onClick={() => refreshAnalytics.mutate()}
            disabled={refreshAnalytics.isPending}
            data-testid="button-refresh-analytics"
          >
            {refreshAnalytics.isPending ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1.5 h-3 w-3" />}
            Refresh
          </Button>
        </div>

        {!analyticsEpisodeId ? (
          <EmptyState
            icon={BarChart3}
            title="Select an Episode"
            description="Choose an episode above to view content performance analytics"
          />
        ) : analyticsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : pieces.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No Analytics Data"
            description="No content performance data available for this episode yet"
          />
        ) : (
          <div className="border border-border/30 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[1fr_80px_80px_100px] gap-2 px-3 py-2 bg-muted/20 border-b border-border/30">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Content</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground text-right">Impressions</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground text-right">Clicks</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground text-right">Engagement</span>
            </div>
            <div className="divide-y divide-border/20">
              {pieces.map((piece: any, idx: number) => {
                const impressions = piece.impressions ?? piece.views ?? 0;
                const clicks = piece.clicks ?? 0;
                const engagement = piece.engagementRate ?? (impressions > 0 ? ((clicks / impressions) * 100) : 0);
                return (
                  <div key={piece.id || idx} className="grid grid-cols-[1fr_80px_80px_100px] gap-2 px-3 py-2.5 hover:bg-card/30 transition-colors" data-testid={`analytics-row-${piece.id || idx}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="font-mono text-[8px] uppercase shrink-0 h-4 px-1">{piece.type || "content"}</Badge>
                      <span className="text-xs font-medium truncate" data-testid={`analytics-title-${piece.id || idx}`}>{piece.title || "Untitled"}</span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-right" data-testid={`analytics-impressions-${piece.id || idx}`}>
                      {impressions.toLocaleString()}
                    </span>
                    <span className="text-xs font-mono tabular-nums text-right" data-testid={`analytics-clicks-${piece.id || idx}`}>
                      {clicks.toLocaleString()}
                    </span>
                    <div className="flex items-center justify-end gap-1.5">
                      <div className="w-12 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            engagement >= 5 ? "bg-emerald-500" : engagement >= 2 ? "bg-amber-400" : "bg-red-500"
                          )}
                          style={{ width: `${Math.min(engagement * 10, 100)}%` }}
                        />
                      </div>
                      <span className={cn(
                        "text-[10px] font-mono font-bold tabular-nums w-10 text-right",
                        engagement >= 5 ? "text-emerald-500" : engagement >= 2 ? "text-amber-400" : "text-red-500"
                      )} data-testid={`analytics-engagement-${piece.id || idx}`}>
                        {engagement.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DataCard>
  );
}

export default function ContentFactory() {
  const urlParams = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const initialTab = urlParams.get("tab") || "pipeline";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAIGenerate, setShowAIGenerate] = useState(false);

  const { data: metricsData } = useQuery<any>({
    queryKey: ["/api/admin/page-metrics/content-factory"],
  });

  const metricsItems = metricsData?.metrics
    ? [
        { label: "Total Pieces", value: metricsData.metrics.total ?? 0 },
        { label: "Published", value: metricsData.metrics.published ?? 0 },
        { label: "In Moderation", value: metricsData.metrics.inModeration ?? 0 },
        { label: "Drafts", value: metricsData.metrics.drafts ?? 0 },
        { label: "AI Generated", value: metricsData.metrics.aiGenerated ?? 0 },
        { label: "Avg. Time to Publish", value: metricsData.metrics.avgTimeToPublish ?? "—" },
      ]
    : [];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <PageHeader pageKey="content-factory" onAIAction={() => setShowAIGenerate(true)} onPrimaryAction={() => {}} primaryActionOverride="+ New Content" />

      {metricsItems.length > 0 && <MetricsStrip metrics={metricsItems} />}

      <ProcessingQueue />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full overflow-x-auto justify-start" data-testid="tabs-content-factory">
          <TabsTrigger value="pipeline" className="rounded-none border-b-2 border-transparent text-[14px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5" data-testid="tab-pipeline">
            <Zap className="mr-1.5 h-4 w-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="upload" className="rounded-none border-b-2 border-transparent text-[14px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5" data-testid="tab-upload">
            <Upload className="mr-1.5 h-4 w-4" /> Upload
          </TabsTrigger>
          <TabsTrigger value="clips" className="rounded-none border-b-2 border-transparent text-[14px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5" data-testid="tab-clips">
            <Scissors className="mr-1.5 h-4 w-4" /> Clips
          </TabsTrigger>
          <TabsTrigger value="newsletter" className="rounded-none border-b-2 border-transparent text-[14px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5" data-testid="tab-newsletter">
            <Mail className="mr-1.5 h-4 w-4" /> Newsletter
          </TabsTrigger>
          <TabsTrigger value="shows" className="rounded-none border-b-2 border-transparent text-[14px] font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:font-semibold data-[state=active]:shadow-none data-[state=active]:bg-transparent px-4 py-2.5" data-testid="tab-shows">
            <Mic className="mr-1.5 h-4 w-4" /> Shows
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
        <TabsContent value="newsletter" className="mt-4">
          <NewsletterTab />
        </TabsContent>
        <TabsContent value="shows" className="mt-4">
          <ShowBrandingTab />
        </TabsContent>
      </Tabs>

      <ContentPerformanceLeaderboard />

      {showAIGenerate && <AIGenerateModal onClose={() => setShowAIGenerate(false)} />}
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
  const queueTranscription = useQueueTranscription();
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
  const transcriptReady = selectedEpisode?.transcriptStatus === "ready" || selectedEpisode?.transcriptStatus === "complete";
  const transcriptProcessing = selectedEpisode?.transcriptStatus === "processing";

  useEffect(() => {
    if ((!isProcessing && !transcriptProcessing) || !selectedEpisodeId) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      queryClient.invalidateQueries({ predicate: (query) => {
        const key = query.queryKey[0] as string;
        return key?.startsWith("/api/content-pieces") || key?.startsWith("/api/clip-assets");
      }});
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing, transcriptProcessing, selectedEpisodeId, queryClient]);

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

  const [episodeSearch, setEpisodeSearch] = useState("");
  const [queueingId, setQueueingId] = useState<string | null>(null);

  const filteredEpisodes = (episodes || []).filter((ep: any) => {
    if (!episodeSearch) return true;
    return ep.title?.toLowerCase().includes(episodeSearch.toLowerCase());
  });

  const queuedEpisodes = filteredEpisodes.filter((ep: any) =>
    ep.processingStatus === "processing" || ep.processingStatus === "complete" || ep.processingStatus === "queued" ||
    ep.transcriptStatus === "processing" || ep.transcriptStatus === "ready" || ep.transcriptStatus === "complete"
  );
  const pendingEpisodes = filteredEpisodes.filter((ep: any) =>
    !queuedEpisodes.some((q: any) => q.id === ep.id)
  );

  function handleQueueEpisode(episodeId: string) {
    setQueueingId(episodeId);
    setSelectedEpisodeId(episodeId);
    queueTranscription.mutate(
      { episodeId },
      {
        onSuccess: () => {
          toast({ title: "Queued for Transcription", description: "The episode is being transcribed. You can generate content once transcription completes." });
          setQueueingId(null);
        },
        onError: (err: any) => {
          toast({ title: "Queue Error", description: err.message, variant: "destructive" });
          setQueueingId(null);
        },
      }
    );
  }

  const [cascadeEpisodeId, setCascadeEpisodeId] = useState<string>("");
  const generatePipeline = useGenerateContentPipeline();
  const { data: generationJobs } = useContentGenerationJobs(cascadeEpisodeId || undefined);
  const { data: pipelinePieces } = useContentPipelinePieces(cascadeEpisodeId || undefined);

  const pipelineTypeConfig: Record<string, { icon: any; title: string; color: string }> = {
    blog: { icon: PenLine, title: "Blog Posts", color: "text-violet-500" },
    newsletter: { icon: Mail, title: "Newsletter", color: "text-amber-400" },
    social_x: { icon: XIcon, title: "X / Twitter", color: "text-foreground" },
    social_facebook: { icon: Facebook, title: "Facebook", color: "text-blue-500" },
    social_linkedin: { icon: Linkedin, title: "LinkedIn", color: "text-sky-600" },
    social_instagram: { icon: InstagramIcon, title: "Instagram", color: "text-pink-500" },
    clip_suggestion: { icon: Scissors, title: "Clip Suggestions", color: "text-red-500" },
    seo_backlink: { icon: Search, title: "SEO Backlinks", color: "text-emerald-400" },
  };

  function getStageBadgeStyle(stage: string) {
    switch (stage) {
      case "generating": return "border-primary/50 text-primary bg-primary/10 animate-pulse";
      case "moderating": return "border-amber-400/50 text-amber-400 bg-amber-400/10";
      case "review_ready": return "border-sky-400/50 text-sky-400 bg-sky-400/10";
      case "approved": return "border-emerald-500/50 text-emerald-500 bg-emerald-500/10";
      case "scheduled": return "border-violet-500/50 text-violet-500 bg-violet-500/10";
      case "published": return "border-blue-500/50 text-blue-500 bg-blue-500/10";
      default: return "border-muted text-muted-foreground";
    }
  }

  function getModerationBadgeStyle(status: string) {
    switch (status) {
      case "approved": return "border-emerald-500/50 text-emerald-500";
      case "flagged": return "border-amber-400/50 text-amber-400";
      case "rejected": return "border-red-500/50 text-red-500";
      default: return "border-muted text-muted-foreground";
    }
  }

  function getQualityColor(score: number) {
    if (score >= 75) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-400";
    return "bg-red-500";
  }

  const pipelineGrouped: Record<string, any[]> = {};
  if (pipelinePieces && Array.isArray(pipelinePieces)) {
    for (const piece of pipelinePieces) {
      const t = piece.type as string;
      if (!pipelineGrouped[t]) pipelineGrouped[t] = [];
      pipelineGrouped[t].push(piece);
    }
  }

  function handleGenerateCascade() {
    if (!cascadeEpisodeId) return;
    generatePipeline.mutate(cascadeEpisodeId, {
      onSuccess: () => toast({ title: "Content Cascade Started", description: "AI is generating content for all channels." }),
      onError: (err: any) => toast({ title: "Generation Error", description: err.message, variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      <Card className="glass-panel border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent" data-testid="card-ai-content-factory">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="font-display text-lg">AI Content Factory</CardTitle>
            <Badge variant="outline" className="font-mono text-[10px] border-primary/50 text-primary ml-auto">Cascade Generator</Badge>
          </div>
          <CardDescription className="font-mono text-xs">Select an episode and generate content across all channels simultaneously</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={cascadeEpisodeId} onValueChange={setCascadeEpisodeId}>
              <SelectTrigger className="flex-1 h-9 font-mono text-xs" data-testid="select-cascade-episode">
                <SelectValue placeholder="Select an episode..." />
              </SelectTrigger>
              <SelectContent>
                {(episodes || []).map((ep: any) => (
                  <SelectItem key={ep.id} value={ep.id} className="font-mono text-xs">
                    {ep.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleGenerateCascade}
              disabled={!cascadeEpisodeId || generatePipeline.isPending}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider shrink-0"
              data-testid="button-generate-cascade"
            >
              {generatePipeline.isPending ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : (
                <Zap className="mr-2 h-3 w-3" />
              )}
              Generate Content Cascade
            </Button>
          </div>

          {generationJobs && Array.isArray(generationJobs) && generationJobs.length > 0 && (
            <div className="space-y-2" data-testid="generation-jobs-queue">
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Generation Queue</span>
                <Badge variant="outline" className="font-mono text-[10px] border-primary/30 text-primary ml-auto">
                  {generationJobs.filter((j: any) => j.status === "running").length} running
                </Badge>
              </div>
              <div className="divide-y divide-border/30 border border-border/30 rounded-lg overflow-hidden">
                {generationJobs.map((job: any) => (
                  <div key={job.id} className="flex items-center gap-3 px-3 py-2 bg-card/20" data-testid={`job-${job.id}`}>
                    <div className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      job.status === "completed" ? "bg-emerald-500" :
                      job.status === "running" ? "bg-primary animate-pulse" :
                      job.status === "failed" ? "bg-red-500" :
                      "bg-muted-foreground/40"
                    )} />
                    <span className="text-xs font-medium truncate flex-1" data-testid={`job-type-${job.id}`}>{job.contentType || job.type || "Content"}</span>
                    {job.progress != null && (
                      <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${job.progress}%` }} />
                      </div>
                    )}
                    <Badge variant="outline" className={cn(
                      "font-mono text-[8px] uppercase shrink-0",
                      job.status === "completed" ? "border-emerald-500/50 text-emerald-500" :
                      job.status === "running" ? "border-primary/50 text-primary" :
                      job.status === "failed" ? "border-red-500/50 text-red-500" :
                      "border-muted text-muted-foreground"
                    )} data-testid={`job-status-${job.id}`}>{job.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {cascadeEpisodeId && Object.keys(pipelineGrouped).length > 0 && (
        <div className="space-y-3" data-testid="pipeline-pieces-grouped">
          <div className="flex items-center gap-1.5">
            <LayoutGrid className="h-3.5 w-3.5 text-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Generated Content by Channel</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(pipelineTypeConfig).map(([type, config]) => {
              const items = pipelineGrouped[type] || [];
              if (items.length === 0) return null;
              const TypeIcon = config.icon;
              return (
                <Card key={type} className="glass-panel border-border/50 hover:border-primary/30 transition-all" data-testid={`pipeline-card-${type}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {typeof TypeIcon === "function" && TypeIcon.length <= 1 ? (
                        <TypeIcon className={cn("h-4 w-4", config.color)} />
                      ) : (
                        <TypeIcon className={cn("h-4 w-4", config.color)} />
                      )}
                      <CardTitle className="text-sm font-display">{config.title}</CardTitle>
                      <Badge variant="outline" className="ml-auto font-mono text-[10px]">{items.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items.map((piece: any) => (
                      <div key={piece.id} className="p-2.5 rounded-lg bg-card/30 border border-border/30 space-y-2" data-testid={`pipeline-piece-${piece.id}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium truncate">{piece.title}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setPreviewPiece(piece); setEditMode(false); }} data-testid={`button-view-pipeline-${piece.id}`}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {piece.pipelineStage && (
                            <Badge variant="outline" className={cn("text-[8px] uppercase font-mono h-4 px-1.5", getStageBadgeStyle(piece.pipelineStage))} data-testid={`stage-${piece.id}`}>
                              {piece.pipelineStage}
                            </Badge>
                          )}
                          {piece.moderationStatus && (
                            <Badge variant="outline" className={cn("text-[8px] uppercase font-mono h-4 px-1.5", getModerationBadgeStyle(piece.moderationStatus))} data-testid={`moderation-${piece.id}`}>
                              {piece.moderationStatus}
                            </Badge>
                          )}
                        </div>
                        {piece.aiQualityScore != null && (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[9px] text-muted-foreground shrink-0">Quality</span>
                            <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", getQualityColor(piece.aiQualityScore))}
                                style={{ width: `${piece.aiQualityScore}%` }}
                              />
                            </div>
                            <span className={cn(
                              "font-mono text-[9px] font-bold tabular-nums w-6 text-right",
                              piece.aiQualityScore >= 75 ? "text-emerald-500" :
                              piece.aiQualityScore >= 50 ? "text-amber-400" : "text-red-500"
                            )}>{piece.aiQualityScore}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <Card className="glass-panel border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-primary" />
              <CardTitle className="font-display text-lg">Select Episode</CardTitle>
            </div>
            <CardDescription className="font-mono text-xs">Queue and select episodes for content generation</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search episodes..."
              value={episodeSearch}
              onChange={(e) => setEpisodeSearch(e.target.value)}
              className="pl-8 h-8 text-xs font-mono"
              data-testid="input-search-episodes"
            />
          </div>

          {epLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : (
            <>
              {queuedEpisodes.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground pb-2">In Queue / Processing</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {queuedEpisodes.map((ep: any) => {
                      const epPodcast = podcasts?.find((p: any) => p.id === ep.podcastId);
                      const isActive = ep.id === selectedEpisodeId;
                      const isCurrentlyProcessing = ep.processingStatus === "processing" || ep.transcriptStatus === "processing";
                      return (
                        <div
                          key={ep.id}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border",
                            isActive ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" : "border-border/30 hover:bg-card/60 hover:border-border/50"
                          )}
                          onClick={() => setSelectedEpisodeId(ep.id)}
                          data-testid={`episode-row-${ep.id}`}
                        >
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                            isCurrentlyProcessing ? "bg-primary/20" : "bg-emerald-500/20"
                          )}>
                            {isCurrentlyProcessing ? (
                              <Loader2 className="h-4 w-4 text-primary animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{ep.title}</p>
                            <p className="text-[10px] font-mono text-muted-foreground truncate">{epPodcast?.title || "Unknown"}</p>
                          </div>
                          <Badge variant="outline" className={cn(
                            "font-mono text-[8px] uppercase shrink-0",
                            isCurrentlyProcessing ? "border-primary/50 text-primary animate-pulse" : "border-emerald-500/50 text-emerald-500"
                          )}>
                            {isCurrentlyProcessing ? "Processing" : "Done"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {pendingEpisodes.length > 0 && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground pt-2 pb-2">Available Episodes</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {pendingEpisodes.map((ep: any) => {
                      const epPodcast = podcasts?.find((p: any) => p.id === ep.podcastId);
                      const isActive = ep.id === selectedEpisodeId;
                      const isQueuing = queueingId === ep.id;
                      return (
                        <div
                          key={ep.id}
                          className={cn(
                            "flex items-center gap-3 p-2.5 rounded-lg transition-all border group",
                            isActive ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20" : "border-border/30 hover:bg-card/60 hover:border-border/50"
                          )}
                          data-testid={`episode-row-${ep.id}`}
                        >
                          <div className="h-8 w-8 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                            {ep.episodeType === "video" ? <Film className="h-4 w-4 text-muted-foreground" /> : <Mic className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedEpisodeId(ep.id)}>
                            <p className="text-xs font-medium truncate">{ep.title}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] font-mono text-muted-foreground truncate">{epPodcast?.title || "Unknown"}</p>
                              {ep.duration && (
                                <span className="text-[9px] font-mono text-muted-foreground/60 flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" /> {ep.duration}
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-[10px] font-mono uppercase tracking-wider opacity-70 group-hover:opacity-100 transition-opacity border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground shrink-0"
                            onClick={(e) => { e.stopPropagation(); handleQueueEpisode(ep.id); }}
                            disabled={isQueuing || queueTranscription.isPending}
                            data-testid={`button-start-${ep.id}`}
                          >
                            {isQueuing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><Zap className="h-3 w-3 mr-1" />Start</>
                            )}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredEpisodes.length === 0 && (
                <div className="text-center py-6">
                  <Mic className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground font-mono">No episodes found</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {selectedEpisode && (
        <Card className="glass-panel border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle className="font-display text-base" data-testid="text-selected-episode">{selectedEpisode.title}</CardTitle>
                <CardDescription className="font-mono text-xs">{podcast?.title || "Unknown Podcast"}</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
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
            </div>
          </CardHeader>
          <CardContent>
            {transcriptReady ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex flex-wrap gap-3 items-center">
                    <Label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Content Types:</Label>
                    {["article", "blog", "social", "clips", "newsletter", "seo"].map(type => (
                      <label key={type} className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={contentTypes.includes(type)}
                          onCheckedChange={() => toggleContentType(type)}
                          data-testid={`checkbox-${type}`}
                        />
                        <span className="capitalize font-mono text-xs">{type}</span>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={handleRunPipeline}
                    disabled={runPipeline.isPending || contentTypes.length === 0}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider"
                    data-testid="button-run-pipeline"
                  >
                    {runPipeline.isPending ? (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="mr-2 h-3 w-3" />
                    )}
                    Generate Content
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="font-mono text-[10px] text-muted-foreground shrink-0">{progress}%</span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {pipelineSteps.map((step, i) => {
                    const stepProgress = (i + 1) / pipelineSteps.length * 100;
                    const status = progress >= stepProgress ? "complete" : progress >= stepProgress - 14 ? "processing" : "pending";
                    return (
                      <div key={step.key} className="flex items-center text-xs gap-1.5">
                        {status === "complete" && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                        {status === "processing" && <Loader2 className="h-3 w-3 text-primary animate-spin" />}
                        {status === "pending" && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />}
                        <span className={cn(
                          "font-mono text-[10px]",
                          status === "complete" ? "text-foreground" :
                          status === "processing" ? "text-primary" :
                          "text-muted-foreground"
                        )}>{step.label}</span>
                        {i < pipelineSteps.length - 1 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/30" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : transcriptProcessing ? (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                  <p className="text-xs font-mono font-medium text-primary">Transcription in Progress</p>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">Content generation will be available once transcription completes.</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 border border-border/30 rounded-lg p-4">
                <p className="text-xs text-muted-foreground font-mono">Start transcription first to enable content generation.</p>
                <Button
                  onClick={() => handleQueueEpisode(selectedEpisodeId)}
                  disabled={queueTranscription.isPending}
                  variant="outline"
                  className="font-mono text-xs uppercase tracking-wider border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
                  data-testid="button-start-transcription"
                >
                  {queueTranscription.isPending ? (
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-3 w-3" />
                  )}
                  Start Transcription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedEpisodeId && (
        <div>
          {contentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="glass-panel border-border/50"><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <KeywordAnalysisCard episodeId={selectedEpisodeId} />
              {Object.entries(typeConfig).map(([type, config]) => {
                const items = grouped[type] || [];
                const TypeIcon = config.icon;
                return (
                  <Card key={type} className="glass-panel border-border/50 hover:border-primary/30 transition-all" data-testid={`card-content-${type}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <TypeIcon className={cn("h-4 w-4", config.color)} />
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
      )}

      {!selectedEpisodeId && (
        <Card className="glass-panel border-border/50 h-48 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Mic className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="font-mono text-sm">Select an episode above to view the pipeline</p>
            <p className="font-mono text-[10px] mt-1 text-muted-foreground/60">Queue an episode with "Start" to begin transcription</p>
          </div>
        </Card>
      )}

      <Dialog open={!!previewPiece} onOpenChange={(open) => { if (!open) { setPreviewPiece(null); setEditMode(false); } }}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto glass-panel" data-testid="dialog-content-preview">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
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
                  {previewPiece?.status === "published" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="font-mono text-xs border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                      onClick={async () => {
                        try {
                          const snippet = (previewPiece.body || previewPiece.summary || "").slice(0, 120);
                          const res = await fetch("/api/push-notifications/send", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              title: previewPiece.title || "New Content",
                              body: snippet,
                              url: `/news/${previewPiece.slug || previewPiece.id}`,
                              tag: `content-${previewPiece.id}`,
                              filterType: previewPiece.type === "article" || previewPiece.type === "blog" ? "articles" : "episodes",
                            }),
                          });
                          const data = await res.json();
                          if (res.ok) {
                            toast({ title: "Push Sent", description: `Delivered to ${data.delivered} subscriber(s)` });
                          } else {
                            toast({ title: "Error", description: data.message, variant: "destructive" });
                          }
                        } catch {
                          toast({ title: "Error", description: "Failed to send push notification", variant: "destructive" });
                        }
                      }}
                      data-testid="button-send-push"
                    >
                      <BellRing className="mr-1.5 h-3 w-3" /> Send Push
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

function FileDropzone({ label, accept, icon: Icon, uploadedPath, onClear, onFile, isUploading, progress, formats, color = "primary" }: {
  label: string; accept: string; icon: any; uploadedPath: string;
  onClear: () => void; onFile: (f: File) => void; isUploading: boolean; progress: number;
  formats?: string; color?: "primary" | "blue" | "purple" | "amber";
}) {
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const colorMap = {
    primary: { bg: "bg-primary/10", border: "border-primary", text: "text-primary", icon: "text-primary", ring: "ring-primary/30" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500", text: "text-blue-400", icon: "text-blue-400", ring: "ring-blue-500/30" },
    purple: { bg: "bg-purple-500/10", border: "border-purple-500", text: "text-purple-400", icon: "text-purple-400", ring: "ring-purple-500/30" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500", text: "text-amber-400", icon: "text-amber-400", ring: "ring-amber-500/30" },
  };
  const c = colorMap[color];

  const fileName = uploadedPath ? uploadedPath.split("/").pop() : "";

  return (
    <div
      className={cn(
        "relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer group",
        dragOver ? `${c.border} ${c.bg} scale-[1.02] ring-4 ${c.ring}` :
        uploadedPath ? "border-emerald-500/40 bg-emerald-500/5" :
        isUploading ? `${c.border}/30 ${c.bg}/50` :
        "border-border/40 hover:border-border hover:bg-muted/30"
      )}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      onClick={() => !uploadedPath && ref.current?.click()}
      data-testid={`dropzone-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} data-testid={`input-file-${label.toLowerCase().replace(/\s/g, "-")}`} />

      {isUploading ? (
        <div className="p-6 flex flex-col items-center gap-3">
          <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", c.bg)}>
            <Loader2 className={cn("h-6 w-6 animate-spin", c.icon)} />
          </div>
          <div className="text-center space-y-1 w-full">
            <p className={cn("text-sm font-semibold", c.text)}>Uploading {label}...</p>
            <p className="text-xs text-muted-foreground font-mono">{progress}% complete</p>
          </div>
          <div className="w-full max-w-[240px]">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      ) : uploadedPath ? (
        <div className="p-6 flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold text-emerald-400">{label} Ready</p>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-[220px]" title={fileName}>{fileName}</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={(e) => { e.stopPropagation(); ref.current?.click(); }}
              data-testid={`button-replace-${label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <Upload className="h-3 w-3" /> Replace
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              data-testid={`button-clear-${label.toLowerCase().replace(/\s/g, "-")}`}
            >
              <XCloseIcon className="h-3 w-3" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 flex flex-col items-center gap-3">
          <div className={cn(
            "h-14 w-14 rounded-full flex items-center justify-center transition-colors",
            dragOver ? c.bg : "bg-muted/50 group-hover:bg-muted"
          )}>
            <Icon className={cn("h-7 w-7 transition-colors", dragOver ? c.icon : "text-muted-foreground group-hover:text-foreground/70")} />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-xs text-muted-foreground">
              {dragOver ? (
                <span className={c.text}>Drop file here</span>
              ) : (
                <>Drag & drop or <span className={cn("underline underline-offset-2", c.text)}>browse</span></>
              )}
            </p>
          </div>
          {formats && (
            <div className="flex flex-wrap gap-1 justify-center">
              {formats.split(",").map((fmt) => (
                <Badge key={fmt.trim()} variant="outline" className="text-[9px] h-4 px-1.5 font-mono border-border/40 text-muted-foreground">
                  {fmt.trim()}
                </Badge>
              ))}
            </div>
          )}
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
  const queryClient = useQueryClient();

  const hasProcessing = (episodes || []).some((ep: any) => ep.transcriptStatus === "processing");
  useEffect(() => {
    if (!hasProcessing) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
    }, 4000);
    return () => clearInterval(interval);
  }, [hasProcessing, queryClient]);

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
        const hasMedia = !!audioPath || !!videoPath;
        toast({
          title: "Episode Created",
          description: hasMedia
            ? `"${form.title}" has been added. Transcription is running in the background — you can continue working.`
            : `"${form.title}" has been added to the content factory.`,
        });
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className={cn("grid gap-4", form.episodeType === "both" ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2")}>
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
                      formats="MP3, WAV, AAC, OGG"
                      color="primary"
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
                      formats="MP4, MOV, WEBM"
                      color="blue"
                    />
                  )}
                  <FileDropzone
                    label="Thumbnail Image"
                    accept="image/*"
                    icon={ImagePlus}
                    uploadedPath={thumbnailPath}
                    onClear={() => setThumbnailPath("")}
                    onFile={(f) => thumbnailUpload.uploadFile(f)}
                    isUploading={thumbnailUpload.isUploading}
                    progress={thumbnailUpload.progress}
                    formats="JPG, PNG, WEBP"
                    color="amber"
                  />
                </div>
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
                            ep.transcriptStatus === "ready" ? "border-emerald-500/30 text-emerald-400" :
                            ep.transcriptStatus === "processing" ? "border-blue-500/30 text-blue-400" :
                            ep.transcriptStatus === "failed" ? "border-red-500/30 text-red-400" :
                            "border-border/50 text-muted-foreground"
                          )}>
                            {ep.transcriptStatus === "ready" ? "Transcribed" :
                             ep.transcriptStatus === "processing" ? "Transcribing..." :
                             ep.transcriptStatus === "failed" ? "Failed" : "Pending"}
                          </Badge>
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-border/30 text-muted-foreground">
                            {ep.episodeType}
                          </Badge>
                        </div>
                        {ep.transcriptStatus === "processing" && (
                          <div className="mt-1.5">
                            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${ep.processingProgress || 5}%` }} />
                            </div>
                            <p className="text-[9px] text-blue-400 font-mono mt-0.5">{ep.processingProgress || 5}% — running in background</p>
                          </div>
                        )}
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

function ClipVideoPreview({ videoUrl, startTime }: { videoUrl: string; startTime?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    function parseTimeToSeconds(t: string): number {
      const parts = t.split(":").map(Number);
      if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
      if (parts.length === 2) return parts[0] * 60 + parts[1];
      return parts[0] || 0;
    }

    const handleLoaded = () => {
      if (startTime) {
        video.currentTime = parseTimeToSeconds(startTime);
      }
      video.play().catch(() => {});
    };

    video.addEventListener("loadeddata", handleLoaded);
    return () => video.removeEventListener("loadeddata", handleLoaded);
  }, [videoUrl, startTime]);

  return (
    <div className="aspect-video w-full rounded-lg overflow-hidden bg-background/50 relative">
      <video
        ref={videoRef}
        src={videoUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
        data-testid="clip-video-preview"
      />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/40 via-transparent to-transparent" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display flex items-center gap-2">
            <Scissors className="h-6 w-6 text-primary" />
            Viral Clip Factory
          </h2>
          <p className="text-muted-foreground font-mono text-xs mt-1">AI-detected viral moments from your episodes</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Select value={filterEpisodeId} onValueChange={setFilterEpisodeId}>
            <SelectTrigger className="w-full sm:w-[220px]" data-testid="select-clips-episode">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedClips.map((clip: any) => {
            const episode = (episodes || []).find((ep: any) => ep.id === clip.episodeId);
            const videoSrc = clip.clipUrl || episode?.videoUrl;
            return (
              <Card key={clip.id} className="glass-panel border-border/50 hover:border-primary/20 transition-all overflow-hidden" data-testid={`card-clip-${clip.id}`}>
                {videoSrc ? (
                  <ClipVideoPreview videoUrl={videoSrc} startTime={clip.startTime} />
                ) : (
                  <div className="aspect-video w-full bg-background/30 flex items-center justify-center">
                    <div className="text-center">
                      <Film className="h-8 w-8 text-muted-foreground/30 mx-auto mb-1" />
                      <span className="text-[10px] font-mono text-muted-foreground/50">Audio only</span>
                    </div>
                  </div>
                )}
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-sm truncate" data-testid={`text-clip-title-${clip.id}`}>{clip.title}</h3>
                        <Badge variant="outline" className={cn(
                          "font-mono text-[9px] uppercase flex-shrink-0",
                          clip.status === "approved" ? "border-emerald-500/50 text-emerald-500" :
                          clip.status === "exported" ? "border-primary/50 text-primary" :
                          "border-muted text-muted-foreground"
                        )}>{clip.status}</Badge>
                      </div>
                      {episode && (
                        <p className="text-[10px] font-mono text-muted-foreground mt-0.5 truncate">{episode.title}</p>
                      )}
                    </div>
                    <Badge className={cn("text-sm font-bold font-mono px-2 py-0.5 border flex-shrink-0", getScoreColor(clip.viralScore || 0))} data-testid={`badge-score-${clip.id}`}>
                      {clip.viralScore || 0}
                    </Badge>
                  </div>

                  {clip.hookText && (
                    <p className="text-xs text-foreground/80 italic line-clamp-2">"{clip.hookText}"</p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {clip.startTime} → {clip.endTime}
                    </span>
                    {clip.duration && <span>({clip.duration})</span>}
                    {clip.platform && (
                      <span className="flex items-center gap-1 ml-auto">
                        {getPlatformIcon(clip.platform, "h-3 w-3")}
                        {getPlatformLabel(clip.platform)}
                      </span>
                    )}
                  </div>

                  {clip.transcriptExcerpt && (
                    <blockquote className="border-l-2 border-primary/30 pl-3 text-[11px] text-muted-foreground italic line-clamp-2">
                      {clip.transcriptExcerpt}
                    </blockquote>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(clip.id)}
                      disabled={updateClip.isPending || clip.status === "approved"}
                      className="flex-1 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 text-xs"
                      data-testid={`button-approve-clip-${clip.id}`}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(clip.id)}
                      disabled={deleteClip.isPending}
                      className="flex-1 border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs"
                      data-testid={`button-reject-clip-${clip.id}`}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <SelectTrigger className="w-full sm:w-[160px] bg-background/80 backdrop-blur" data-testid="select-newsletter-month">
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
                <SelectTrigger className="w-full sm:w-[110px] bg-background/80 backdrop-blur" data-testid="select-newsletter-year">
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
                          if (line.startsWith("# ")) return <h2 key={i} className="text-lg font-display font-bold mt-5 mb-2 text-foreground">{line.replace("# ", "")}</h2>;
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

const HERO_IMAGES: Record<string, string> = {
  "News": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=1600",
  "Talk": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600",
  "Business": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1600",
  "Comedy": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1600",
  "Tech": "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1600",
  "Sports": "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=1600",
  "Culture": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1600",
  "default": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1600",
};

const ACCENT_PALETTE = ["#C0392B", "#2980B9", "#8E44AD", "#E67E22", "#27AE60", "#2C3E50"];

function ShowBrandingTab() {
  const { data: podcasts, isLoading } = usePodcasts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ heroImageUrl: "", accentColor: "", hostImageUrl: "", coverImage: "", description: "", host: "", title: "" });
  const [creatingShowPage, setCreatingShowPage] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, any> }) => {
      const res = await fetch(`/api/podcasts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] });
      toast({ title: "Saved", description: "Show branding updated." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const startEditing = (p: any) => {
    setEditingId(p.id);
    setForm({
      heroImageUrl: p.heroImageUrl || "",
      accentColor: p.accentColor || "#C0392B",
      hostImageUrl: p.hostImageUrl || "",
      coverImage: p.coverImage || "",
      description: p.description || "",
      host: p.host || "",
      title: p.title || "",
    });
  };

  const handleSave = () => {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        heroImageUrl: form.heroImageUrl || null,
        accentColor: form.accentColor || null,
        hostImageUrl: form.hostImageUrl || null,
        coverImage: form.coverImage || null,
        description: form.description || null,
        host: form.host,
        title: form.title,
      },
    }, { onSuccess: () => setEditingId(null) });
  };

  const regenerateHero = (category: string) => {
    const url = HERO_IMAGES[category] || HERO_IMAGES.default;
    setForm(f => ({ ...f, heroImageUrl: url }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const editingPodcast = podcasts?.find((p: any) => p.id === editingId);

  return (
    <div className="space-y-4" data-testid="show-branding-tab">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-foreground">Show Branding</h3>
          <p className="text-xs text-muted-foreground">Manage hero images, accent colors, and branding for each show</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(podcasts || []).map((p: any) => {
          const accent = p.accentColor || "#C0392B";
          return (
            <div
              key={p.id}
              className="rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer group"
              onClick={() => startEditing(p)}
              data-testid={`card-show-branding-${p.id}`}
            >
              <div className="relative h-32">
                {p.heroImageUrl ? (
                  <img src={p.heroImageUrl} alt="" className="w-full h-full object-cover" />
                ) : p.coverImage ? (
                  <img src={p.coverImage} alt="" className="w-full h-full object-cover opacity-50" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                    <Mic className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
                    <h4 className="text-white font-bold text-sm truncate">{p.title}</h4>
                  </div>
                  <p className="text-white/60 text-xs truncate">{p.host}</p>
                </div>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-white/90 text-gray-900 text-[10px] font-bold px-2 py-1 rounded-full">
                    Edit Branding
                  </span>
                </div>
              </div>
              <div className="p-3 flex items-center gap-2">
                <div className="h-4 w-4 rounded border" style={{ backgroundColor: accent }} />
                <span className="text-[10px] font-mono text-muted-foreground">{accent}</span>
                <div className="flex-1" />
                <span className={cn("text-[10px] font-mono", p.heroImageUrl ? "text-emerald-500" : "text-muted-foreground/50")}>
                  {p.heroImageUrl ? "Hero set" : "No hero"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editingId} onOpenChange={(open) => { if (!open) setEditingId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Show Branding</DialogTitle>
            <DialogDescription>{editingPodcast?.title} — {editingPodcast?.host}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-mono uppercase text-muted-foreground">Show Title</Label>
                <Input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1" data-testid="input-branding-title" />
              </div>
              <div>
                <Label className="text-xs font-mono uppercase text-muted-foreground">Host Name</Label>
                <Input value={form.host} onChange={(e) => setForm(f => ({ ...f, host: e.target.value }))} className="mt-1" data-testid="input-branding-host" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-mono uppercase text-muted-foreground">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" rows={3} data-testid="input-branding-description" />
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <ImagePlus className="h-4 w-4" />
                Branding
              </h4>

              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-mono uppercase text-muted-foreground">Hero Image URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input value={form.heroImageUrl} onChange={(e) => setForm(f => ({ ...f, heroImageUrl: e.target.value }))} placeholder="https://..." className="flex-1" data-testid="input-branding-hero" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => regenerateHero(editingPodcast?.category || "Talk")}
                      className="shrink-0 text-xs"
                      data-testid="button-regenerate-hero"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Regenerate
                    </Button>
                  </div>
                  {form.heroImageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden h-32 bg-muted">
                      <img src={form.heroImageUrl} alt="Hero preview" className="w-full h-full object-cover" data-testid="img-hero-preview" />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-mono uppercase text-muted-foreground">Host Image URL</Label>
                  <Input value={form.hostImageUrl} onChange={(e) => setForm(f => ({ ...f, hostImageUrl: e.target.value }))} placeholder="https://..." className="mt-1" data-testid="input-branding-host-image" />
                  {form.hostImageUrl && (
                    <div className="mt-2">
                      <img src={form.hostImageUrl} alt="Host preview" className="h-16 w-16 rounded-full object-cover ring-2 ring-border" data-testid="img-host-preview" />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-mono uppercase text-muted-foreground">Cover Image URL</Label>
                  <Input value={form.coverImage} onChange={(e) => setForm(f => ({ ...f, coverImage: e.target.value }))} placeholder="https://..." className="mt-1" data-testid="input-branding-cover" />
                  {form.coverImage && (
                    <div className="mt-2">
                      <img src={form.coverImage} alt="Cover preview" className="h-20 w-20 rounded-lg object-cover ring-1 ring-border" data-testid="img-cover-preview" />
                    </div>
                  )}
                </div>

                <div>
                  <Label className="text-xs font-mono uppercase text-muted-foreground">Accent Color</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="color"
                      value={form.accentColor || "#C0392B"}
                      onChange={(e) => setForm(f => ({ ...f, accentColor: e.target.value }))}
                      className="h-9 w-12 rounded border border-border cursor-pointer"
                      data-testid="input-branding-accent-color"
                    />
                    <Input
                      value={form.accentColor}
                      onChange={(e) => setForm(f => ({ ...f, accentColor: e.target.value }))}
                      placeholder="#C0392B"
                      className="w-28 font-mono text-xs"
                      data-testid="input-branding-accent-hex"
                    />
                    <div className="flex gap-1">
                      {ACCENT_PALETTE.map(c => (
                        <button
                          key={c}
                          onClick={() => setForm(f => ({ ...f, accentColor: c }))}
                          className="h-6 w-6 rounded-full border-2 transition-all hover:scale-110"
                          style={{ backgroundColor: c, borderColor: form.accentColor === c ? "white" : "transparent" }}
                          title={c}
                          data-testid={`button-accent-${c.replace('#', '')}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditingId(null)} data-testid="button-cancel-branding">
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                if (!editingId || creatingShowPage) return;
                setCreatingShowPage(true);
                try {
                  const checkRes = await fetch(`/api/pages/show/${editingId}`, { credentials: "include" });
                  if (checkRes.ok) {
                    const existingPage = await checkRes.json();
                    setEditingId(null);
                    navigate(`/page-builder?edit=${existingPage.id}`);
                    return;
                  }
                  const createRes = await fetch("/api/pages/show/create-from-template", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ podcastId: editingId }),
                  });
                  if (!createRes.ok) throw new Error("Failed to create show page");
                  const newPage = await createRes.json();
                  toast({ title: "Show Page Created", description: "Opening in the page builder..." });
                  setEditingId(null);
                  navigate(`/page-builder?edit=${newPage.id}`);
                } catch (err: any) {
                  toast({ title: "Error", description: err.message, variant: "destructive" });
                } finally {
                  setCreatingShowPage(false);
                }
              }}
              disabled={creatingShowPage}
              data-testid="button-create-show-page"
            >
              {creatingShowPage ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <LayoutGrid className="h-4 w-4 mr-1.5" />}
              Create Show Page
            </Button>
            <a
              href={`/show/${editingId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
              data-testid="button-preview-show"
            >
              <Eye className="h-4 w-4" />
              Preview
            </a>
            <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-branding">
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Save Branding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
