import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Mic, FileText, Video, Twitter, Linkedin, Mail, Newspaper,
  ArrowRight, CheckCircle2, Loader2, Clock, Search, Upload, PenLine
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEpisodes, useContentPieces, usePodcasts, useCreateEpisode } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function ContentFactory() {
  const { data: episodes, isLoading: epLoading } = useEpisodes();
  const { data: podcasts } = usePodcasts();
  const processingEp = episodes?.find((e: any) => e.processingStatus === "processing");
  const currentEpId = processingEp?.id;
  const { data: allContent, isLoading: contentLoading } = useContentPieces(currentEpId);
  const createEpisode = useCreateEpisode();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", podcastId: "", duration: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createEpisode.mutate(
      { title: form.title, podcastId: form.podcastId, duration: form.duration || undefined },
      {
        onSuccess: () => {
          toast({ title: "Episode Queued", description: `"${form.title}" has been added to the processing pipeline.` });
          setOpen(false);
          setForm({ title: "", podcastId: "", duration: "" });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  }

  const grouped: Record<string, { icon: any; title: string; subtitle: string; color: string; items: any[] }> = {
    video_clip: { icon: Video, title: "Viral Clips", subtitle: "Short-form video content", color: "text-red-500", items: [] },
    article: { icon: Newspaper, title: "News Articles", subtitle: "Podcaster news page stories", color: "text-blue-500", items: [] },
    blog: { icon: PenLine, title: "Blog Posts", subtitle: "Long-form editorial content", color: "text-violet-500", items: [] },
    social: { icon: Twitter, title: "Social Threads", subtitle: "Platform-native posts", color: "text-sky-400", items: [] },
    linkedin: { icon: Linkedin, title: "Professional Posts", subtitle: "B2B network content", color: "text-indigo-400", items: [] },
    newsletter: { icon: Mail, title: "Newsletter", subtitle: "Email subscriber content", color: "text-amber-400", items: [] },
    seo: { icon: Search, title: "SEO Assets", subtitle: "Search optimization assets", color: "text-emerald-400", items: [] },
  };

  if (allContent) {
    for (const piece of allContent) {
      const group = grouped[piece.type as string];
      if (group) group.items.push(piece);
    }
  }

  const steps = [
    { label: "Audio Transcription", threshold: 20 },
    { label: "Sentiment Analysis", threshold: 40 },
    { label: "Topic Extraction", threshold: 60 },
    { label: "Content Generation", threshold: 80 },
    { label: "SEO Optimization", threshold: 100 },
  ];

  const progress = processingEp?.processingProgress || 0;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Content Factory</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">AI Multiplication Engine: Active</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="font-mono text-xs uppercase tracking-wider border-border bg-card/50" data-testid="button-queue-history">
            <Clock className="mr-2 h-3 w-3" />
            Queue History
          </Button>
          <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-upload-episode">
            <Upload className="mr-2 h-3 w-3" />
            Upload New Episode
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Add New Episode</DialogTitle>
            <DialogDescription className="font-mono text-xs">Queue an episode for AI content multiplication</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ep-title" className="font-mono text-xs uppercase tracking-wider">Episode Title</Label>
              <Input id="ep-title" placeholder="e.g. Episode #143: AI Revolution" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-episode-title" />
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Show</Label>
              <Select value={form.podcastId} onValueChange={(v) => setForm({ ...form, podcastId: v })} required>
                <SelectTrigger data-testid="select-episode-podcast">
                  <SelectValue placeholder="Select a podcast" />
                </SelectTrigger>
                <SelectContent>
                  {podcasts?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ep-duration" className="font-mono text-xs uppercase tracking-wider">Duration</Label>
              <Input id="ep-duration" placeholder="e.g. 45:30" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} data-testid="input-episode-duration" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-mono text-xs" data-testid="button-cancel-episode">Cancel</Button>
              <Button type="submit" disabled={createEpisode.isPending || !form.podcastId} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-episode">
                {createEpisode.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
                Queue Episode
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card className="glass-panel border-primary/20 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent animate-pulse"></div>
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Mic className="mr-2 h-5 w-5" />
                Source Material
              </CardTitle>
              <CardDescription className="font-mono text-xs">Currently Processing</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-6">
              {epLoading ? (
                <div className="flex-1 flex items-center justify-center"><Skeleton className="h-32 w-32 rounded-full" /></div>
              ) : processingEp ? (
                <>
                  <div className="bg-card/50 p-6 rounded-lg border border-border flex flex-col items-center justify-center space-y-4 flex-1">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                      <Mic className="h-10 w-10 text-primary animate-pulse" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-lg font-bold font-display" data-testid="text-current-episode">{processingEp.title}</h3>
                      <p className="text-sm text-muted-foreground font-mono mt-1">{processingEp.duration}</p>
                    </div>
                    <div className="w-full h-16 flex items-center justify-center gap-1 mt-4">
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-1 bg-primary/50 rounded-full animate-[bounce_1s_infinite]" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.05}s` }} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-muted-foreground">Analysis Progress</span>
                      <span className="text-primary font-mono">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-secondary" indicatorClassName="bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <div className="space-y-2 mt-4">
                      {steps.map((step) => {
                        const status = progress >= step.threshold ? "complete" : progress >= step.threshold - 20 ? "processing" : "pending";
                        return <StepItem key={step.label} status={status} label={step.label} />;
                      })}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">No episodes processing.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-2 gap-4 h-full overflow-y-auto pr-2 pb-2">
            {contentLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="glass-panel border-border/50"><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
              ))
            ) : (
              Object.entries(grouped).map(([key, group]) => (
                <OutputCard
                  key={key}
                  icon={group.icon}
                  title={group.title}
                  subtitle={group.subtitle}
                  color={group.color}
                  items={group.items}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ status, label }: { status: "complete" | "processing" | "pending"; label: string }) {
  return (
    <div className="flex items-center text-sm">
      <div className="mr-3 w-5 flex justify-center">
        {status === "complete" && <CheckCircle2 className="h-4 w-4 text-accent" />}
        {status === "processing" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
        {status === "pending" && <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />}
      </div>
      <span className={cn(status === "complete" ? "text-foreground" : status === "processing" ? "text-primary font-medium" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

function OutputCard({ icon: Icon, title, subtitle, color, items }: any) {
  const readyCount = items.filter((i: any) => i.status === "ready").length;
  const total = Math.max(items.length, 1);
  return (
    <Card className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 group" data-testid={`card-content-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <div className={cn("p-2 rounded-md bg-card border border-border", color.replace("text-", "bg-") + "/10")}>
              <Icon className={cn("h-5 w-5", color)} />
            </div>
            <div>
              <CardTitle className="text-base font-bold">{title}</CardTitle>
              <CardDescription className="text-xs font-mono mt-0.5">{subtitle ? subtitle + " · " : ""}{readyCount}/{items.length} Ready</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <Progress value={(readyCount / total) * 100} className="h-1 mt-3" indicatorClassName={cn(color.replace("text-", "bg-"))} />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mt-2">
          {items.length > 0 ? items.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-2 rounded bg-card/30 border border-transparent hover:border-border transition-colors text-sm">
              <span className="truncate max-w-[140px] font-medium">{item.title}</span>
              <Badge variant="outline" className={cn(
                "text-[10px] uppercase font-mono h-5 px-1.5",
                item.status === "ready" ? "border-accent text-accent bg-accent/10" :
                item.status === "generating" ? "border-primary text-primary bg-primary/10 animate-pulse" :
                "border-muted text-muted-foreground"
              )}>{item.status}</Badge>
            </div>
          )) : (
            <p className="text-xs text-muted-foreground">No items yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
