import { useState, useCallback, useRef } from "react";
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
  Edit3, Eye, Building2, Wifi, WifiOff, Sparkles, Zap, Send,
  ChevronRight, AlertTriangle, ImagePlus, Music, Film, X as XCloseIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useEpisodes, useContentPieces, usePodcasts, useCreateEpisode,
  useRunFullPipeline, useSmartSuggestions, useGenerateNewsletter,
  useClipAssets, useUpdateClipAsset, useDeleteClipAsset,
  useScheduledPosts, useCreateScheduledPost, useUpdateScheduledPost, useDeleteScheduledPost,
  useSocialAccounts, useCreateSocialAccount, useDeleteSocialAccount,
  useNewsletterRuns, useSendNewsletter, useDeleteNewsletterRun
} from "@/lib/api";
import { useUpload } from "@/hooks/use-upload";
import { useToast } from "@/hooks/use-toast";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

function getPlatformIcon(platform: string, className?: string) {
  switch (platform) {
    case "x": return <XIcon className={className || "h-4 w-4"} />;
    case "facebook": return <Facebook className={className || "h-4 w-4"} />;
    case "linkedin": return <Linkedin className={className || "h-4 w-4"} />;
    case "google_business": return <Building2 className={className || "h-4 w-4"} />;
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
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
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
  const { data: accounts, isLoading } = useSocialAccounts();
  const createAccount = useCreateSocialAccount();
  const deleteAccount = useDeleteSocialAccount();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ platform: "", accountName: "", accountUrl: "" });

  const platformCards = [
    { platform: "x", label: "X (Twitter)", icon: <XIcon className="h-8 w-8" />, color: "text-foreground" },
    { platform: "facebook", label: "Facebook", icon: <Facebook className="h-8 w-8" />, color: "text-blue-500" },
    { platform: "linkedin", label: "LinkedIn", icon: <Linkedin className="h-8 w-8" />, color: "text-[#0A66C2]" },
    { platform: "google_business", label: "Google Business Profile", icon: <Building2 className="h-8 w-8" />, color: "text-emerald-500" },
  ];

  function getAccountForPlatform(platform: string) {
    return accounts?.find((a: any) => a.platform === platform);
  }

  function getStatusIndicator(status: string) {
    switch (status) {
      case "connected": return { color: "bg-emerald-500", label: "Connected", textColor: "text-emerald-500" };
      case "token_expired": return { color: "bg-yellow-500", label: "Token Expired", textColor: "text-yellow-500" };
      default: return { color: "bg-muted-foreground/30", label: "Disconnected", textColor: "text-muted-foreground" };
    }
  }

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    createAccount.mutate(form, {
      onSuccess: () => {
        toast({ title: "Account Connected", description: `${getPlatformLabel(form.platform)} has been connected.` });
        setDialogOpen(false);
        setForm({ platform: "", accountName: "", accountUrl: "" });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleDisconnect(id: string) {
    deleteAccount.mutate(id, {
      onSuccess: () => toast({ title: "Account Disconnected" }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-display flex items-center gap-2">
            <Wifi className="h-5 w-5 text-primary" />
            Connected Accounts
          </h2>
          <p className="text-muted-foreground font-mono text-xs mt-1">Manage your social media platform connections</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-connect-account">
          <Plus className="mr-1.5 h-3 w-3" /> Connect Account
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {platformCards.map(({ platform, label, icon, color }) => {
            const account = getAccountForPlatform(platform);
            const status = getStatusIndicator(account?.status || "disconnected");
            return (
              <Card key={platform} className="glass-panel border-border/50 hover:border-primary/20 transition-all" data-testid={`card-social-${platform}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-lg bg-card border border-border", color)}>
                        {icon}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base">{label}</h3>
                        <p className="text-sm text-muted-foreground font-mono mt-0.5">
                          {account?.accountName || "Not Connected"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <div className={cn("h-2 w-2 rounded-full", status.color)} />
                          <span className={cn("text-xs font-mono", status.textColor)}>{status.label}</span>
                        </div>
                      </div>
                    </div>
                    {account ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(account.id)}
                        className="text-red-500 border-red-500/30 hover:bg-red-500/10 font-mono text-xs"
                        data-testid={`button-disconnect-${platform}`}
                      >
                        <WifiOff className="h-3 w-3 mr-1" /> Disconnect
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setForm({ platform, accountName: "", accountUrl: "" }); setDialogOpen(true); }}
                        className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10"
                        data-testid={`button-connect-${platform}`}
                      >
                        <Wifi className="h-3 w-3 mr-1" /> Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Connect Account</DialogTitle>
            <DialogDescription className="font-mono text-xs">Link a social media account to your platform</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger data-testid="select-connect-platform">
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="x">X (Twitter)</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="google_business">Google Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Account Name</Label>
              <Input
                value={form.accountName}
                onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                placeholder="@yourhandle"
                required
                data-testid="input-connect-name"
              />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Account URL</Label>
              <Input
                value={form.accountUrl}
                onChange={(e) => setForm({ ...form, accountUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-connect-url"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="font-mono text-xs" data-testid="button-cancel-connect">Cancel</Button>
              <Button type="submit" disabled={createAccount.isPending || !form.platform || !form.accountName} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-connect">
                {createAccount.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Wifi className="mr-2 h-3 w-3" />}
                Connect
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
