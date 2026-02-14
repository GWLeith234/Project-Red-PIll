import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { Mic, Layers, Zap, Send, BarChart3, Bot, Target, Radio, Loader2, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useEpisodes, useContentPieces, useModerationCounts, useScheduledPosts, usePodcasts, useOutboundCampaigns } from "@/lib/api";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function ContentFactoryScreen() {
  const { data: episodes, isLoading: epsLoading } = useEpisodes();
  const { data: contentPieces, isLoading: cpLoading } = useContentPieces();
  const { data: counts } = useModerationCounts();
  const { data: scheduledPosts } = useScheduledPosts();
  const { data: podcasts } = usePodcasts();
  const { data: campaigns } = useOutboundCampaigns();

  const eps = episodes || [];
  const pieces = contentPieces || [];
  const posts = scheduledPosts || [];
  const shows = podcasts || [];
  const camps = campaigns || [];

  const episodeStats = useMemo(() => {
    const totalEpisodes = eps.length;
    const transcribed = eps.filter((e: any) => e.transcriptStatus === "complete").length;
    const processing = eps.filter((e: any) => e.processingStatus === "processing" || e.transcriptStatus === "processing").length;
    const queued = eps.filter((e: any) => e.processingStatus === "pending" || e.processingStatus === "queued").length;
    const completed = eps.filter((e: any) => e.processingStatus === "complete").length;
    return { totalEpisodes, transcribed, processing, queued, completed };
  }, [eps]);

  const contentStats = useMemo(() => {
    const totalContent = pieces.length;
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    pieces.forEach((p: any) => {
      byType[p.type || "other"] = (byType[p.type || "other"] || 0) + 1;
      byStatus[p.status || "draft"] = (byStatus[p.status || "draft"] || 0) + 1;
    });
    const typeData = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    const published = (byStatus["approved"] || 0) + (byStatus["published"] || 0);
    const drafts = byStatus["draft"] || 0;
    return { totalContent, byType, byStatus, typeData, published, drafts };
  }, [pieces]);

  const distributionStats = useMemo(() => {
    const pendingReview = counts?._total || 0;
    const scheduled = posts.filter((p: any) => p.status === "scheduled").length;
    const activeCampaigns = camps.filter((c: any) => c.status === "active" || c.status === "sending").length;
    return { pendingReview, scheduled, activeCampaigns };
  }, [counts, posts, camps]);

  const processingEps = useMemo(() => {
    return eps.filter((e: any) => e.processingStatus === "processing" || e.transcriptStatus === "processing").slice(0, 4);
  }, [eps]);

  const allSteps = ["transcription", "keywords", "article", "blog", "social", "clips", "newsletter", "seo"];
  const stepLabels: Record<string, string> = {
    transcription: "Transcribe", keywords: "Keywords", article: "Article",
    blog: "Blog", social: "Social", clips: "Clips", newsletter: "Newsletter", seo: "SEO",
  };

  const { totalEpisodes, transcribed, processing, queued, completed } = episodeStats;
  const { totalContent, byStatus, typeData, published, drafts } = contentStats;
  const { pendingReview, scheduled, activeCampaigns } = distributionStats;

  const isLoading = epsLoading || cpLoading;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[minmax(80px,1fr)] lg:grid-rows-3 gap-3 h-full">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-full min-h-[80px] w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-12 auto-rows-auto lg:grid-rows-3 gap-3 h-full" data-testid="screen-content-factory">
      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-total-episodes">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Total Episodes</span>
          <Mic className="h-4 w-4 text-primary/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{totalEpisodes}</p>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-accent">{transcribed} transcribed</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-primary">{completed} processed</span>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-total-content">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Content Pieces</span>
          <Layers className="h-4 w-4 text-accent/60" />
        </div>
        <p className="text-4xl font-display font-bold text-foreground">{totalContent}</p>
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-accent">{published} shipped</span>
          <span className="text-muted-foreground">|</span>
          <span className="text-primary">{drafts} drafts</span>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-pipeline-status">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Pipeline</span>
          {processing > 0 ? (
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse">LIVE</Badge>
          ) : (
            <Zap className="h-4 w-4 text-chart-3/60" />
          )}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-2xl font-display font-bold text-blue-400">{processing}</p>
            <p className="text-[9px] font-mono text-blue-400/70 uppercase">Processing</p>
          </div>
          <div>
            <p className="text-2xl font-display font-bold text-amber-400">{queued}</p>
            <p className="text-[9px] font-mono text-amber-400/70 uppercase">Queued</p>
          </div>
        </div>
      </div>

      <div className="col-span-1 lg:col-span-3 lg:row-span-1 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col justify-between" data-testid="card-distribution">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Distribution</span>
          <Send className="h-4 w-4 text-violet-400/60" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-3 gap-1">
          <div className="text-center">
            <p className="text-xl font-display font-bold text-violet-400">{pendingReview}</p>
            <p className="text-[8px] font-mono text-violet-400/70 uppercase">Review</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-bold text-cyan-400">{scheduled}</p>
            <p className="text-[8px] font-mono text-cyan-400/70 uppercase">Scheduled</p>
          </div>
          <div className="text-center">
            <p className="text-xl font-display font-bold text-emerald-400">{activeCampaigns}</p>
            <p className="text-[8px] font-mono text-emerald-400/70 uppercase">Campaigns</p>
          </div>
        </div>
      </div>

      <div className="col-span-2 lg:col-span-5 lg:row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-content-breakdown">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Content Breakdown
          </h3>
          <span className="text-[10px] font-mono text-muted-foreground">{totalContent} total</span>
        </div>
        <div className="flex-1 min-h-0">
          {typeData.length > 0 ? (
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData.slice(0, 8).map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " "), count }))} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", fontFamily: "JetBrains Mono", fontSize: "11px" }} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={14}>
                    {typeData.slice(0, 8).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No content yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-2 lg:col-span-4 lg:row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-active-jobs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" /> AI Agent Jobs
          </h3>
          {processing > 0 && (
            <Badge variant="outline" className="text-[9px] font-mono bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse">
              {processing} active
            </Badge>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {processingEps.length > 0 ? processingEps.map((ep: any) => {
            const podcast = shows.find((p: any) => p.id === ep.podcastId);
            const currentStep = ep.processingStep || "transcription";
            const currentStepIdx = Math.max(0, allSteps.indexOf(currentStep));
            return (
              <div key={ep.id} className="p-2.5 border border-blue-500/15 bg-blue-500/5 rounded-lg space-y-2" data-testid={`job-${ep.id}`}>
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{ep.title}</p>
                    <p className="text-[9px] text-muted-foreground font-mono truncate">{podcast?.title || ""}</p>
                  </div>
                  <span className="text-[10px] font-mono text-blue-400 font-bold ml-2">{ep.processingProgress || 0}%</span>
                </div>
                <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ep.processingProgress || 0}%`, background: "linear-gradient(90deg, hsl(217 91% 60%), hsl(199 89% 48%))" }} />
                </div>
                <div className="flex items-center gap-0.5 flex-wrap">
                  {allSteps.map((step, i) => {
                    const isDone = i < currentStepIdx;
                    const isActive = step === currentStep;
                    return (
                      <span key={step} className={cn(
                        "text-[7px] font-mono px-0.5 py-0.5 rounded",
                        isDone && "text-emerald-400",
                        isActive && "text-blue-400 font-semibold animate-pulse",
                        !isDone && !isActive && "text-muted-foreground/30"
                      )}>
                        {isDone && <CheckCircle2 className="inline h-2 w-2 mr-0.5" />}
                        {isActive && <Loader2 className="inline h-2 w-2 mr-0.5 animate-spin" />}
                        {stepLabels[step]}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          }) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Bot className="h-8 w-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs text-muted-foreground">All agents idle</p>
              <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5">Queue episodes to start processing</p>
            </div>
          )}
        </div>
      </div>

      <div className="col-span-2 lg:col-span-3 lg:row-span-2 border border-border/50 bg-card/40 rounded-lg p-4 flex flex-col" data-testid="card-content-status">
        <h3 className="text-xs font-mono font-semibold text-accent uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <Target className="h-3.5 w-3.5" /> Status Breakdown
        </h3>
        <div className="flex-1 space-y-2.5 overflow-y-auto">
          {[
            { label: "Published", count: published, color: "bg-emerald-500", textColor: "text-emerald-400" },
            { label: "Approved", count: byStatus["approved"] || 0, color: "bg-accent", textColor: "text-accent" },
            { label: "Pending Review", count: pendingReview, color: "bg-violet-500", textColor: "text-violet-400" },
            { label: "Drafts", count: drafts, color: "bg-muted-foreground", textColor: "text-muted-foreground" },
            { label: "Scheduled Posts", count: scheduled, color: "bg-cyan-500", textColor: "text-cyan-400" },
            { label: "Active Campaigns", count: activeCampaigns, color: "bg-primary", textColor: "text-primary" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className={cn("h-2.5 w-2.5 rounded-sm flex-shrink-0", item.color)} />
              <span className="text-[10px] font-mono text-muted-foreground flex-1 truncate">{item.label}</span>
              <span className={cn("text-sm font-display font-bold tabular-nums", item.textColor)}>{item.count}</span>
            </div>
          ))}

          <div className="pt-2 mt-2 border-t border-border/30">
            <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground/60 mb-2">Shows</p>
            {shows.slice(0, 4).map((p: any) => (
              <div key={p.id} className="flex items-center gap-2 py-1">
                <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Radio className="h-2.5 w-2.5 text-primary/60" />
                </div>
                <span className="text-[10px] font-mono text-foreground truncate flex-1">{p.title}</span>
                <span className="text-[9px] font-mono text-muted-foreground">{eps.filter((e: any) => e.podcastId === p.id).length} ep</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}