import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Mic, Users, Plus, MoreHorizontal, Settings, BarChart3, Globe, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePodcasts, useCreatePodcast } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Network() {
  const { data: podcasts, isLoading } = usePodcasts();
  const createPodcast = useCreatePodcast();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", host: "", description: "", coverImage: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createPodcast.mutate(
      { title: form.title, host: form.host, description: form.description || undefined, coverImage: form.coverImage || undefined },
      {
        onSuccess: () => {
          toast({ title: "Show Added", description: `${form.title} has been onboarded to the network.` });
          setOpen(false);
          setForm({ title: "", host: "", description: "", coverImage: "" });
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Podcast Network</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            Managing {podcasts?.length || 0} Shows | Total Reach: {
              podcasts ? (podcasts.reduce((acc: number, p: any) => acc + (p.subscribers || 0), 0) / 1000000).toFixed(1) + "M" : "..."
            }
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-add-show">
          <Plus className="mr-2 h-3 w-3" />
          Add Show
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass-panel border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Onboard New Show</DialogTitle>
            <DialogDescription className="font-mono text-xs">Add a podcast to your network</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="font-mono text-xs uppercase tracking-wider">Show Title</Label>
              <Input id="title" placeholder="e.g. The Daily Insight" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required data-testid="input-podcast-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="host" className="font-mono text-xs uppercase tracking-wider">Host Name</Label>
              <Input id="host" placeholder="e.g. Jane Doe" value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })} required data-testid="input-podcast-host" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="font-mono text-xs uppercase tracking-wider">Description</Label>
              <Textarea id="description" placeholder="Brief show description..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} data-testid="input-podcast-description" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverImage" className="font-mono text-xs uppercase tracking-wider">Cover Image URL</Label>
              <Input id="coverImage" placeholder="https://..." value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} data-testid="input-podcast-cover" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="font-mono text-xs" data-testid="button-cancel-podcast">Cancel</Button>
              <Button type="submit" disabled={createPodcast.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-podcast">
                {createPodcast.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Plus className="mr-2 h-3 w-3" />}
                Add Show
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="glass-panel border-border/50">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
          ))
        ) : (
          podcasts?.map((show: any) => (
            <Card key={show.id} className="glass-panel border-border/50 overflow-hidden group hover:border-primary/40 transition-all duration-300" data-testid={`card-podcast-${show.id}`}>
              <div className="h-32 bg-secondary/50 relative">
                {show.coverImage ? (
                  <img src={show.coverImage} alt={show.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-card">
                    <Mic className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-sm border-transparent text-foreground uppercase text-[10px] font-mono">
                    {show.status}
                  </Badge>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="font-display text-xl">{show.title}</CardTitle>
                    <CardDescription className="text-sm">{show.host}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-mono uppercase">Audience</p>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1 text-primary" />
                      <span className="font-bold text-lg" data-testid={`text-subscribers-${show.id}`}>
                        {show.subscribers >= 1000000 ? (show.subscribers / 1000000).toFixed(1) + "M" :
                         show.subscribers >= 1000 ? (show.subscribers / 1000).toFixed(0) + "K" : show.subscribers}
                      </span>
                    </div>
                    <p className="text-[10px] text-accent">+{show.growthPercent}% this month</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-mono uppercase">Content Power</p>
                    <div className="flex items-center">
                      <Globe className="h-3 w-3 mr-1 text-purple-400" />
                      <span className="font-bold text-lg">{show.multiplicationFactor}x</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Assets per Ep</p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Network Saturation</span>
                    <span className="text-foreground font-mono">85%</span>
                  </div>
                  <Progress value={85} className="h-1" indicatorClassName="bg-gradient-to-r from-primary to-purple-500" />
                </div>
              </CardContent>

              <CardFooter className="bg-card/30 p-4 flex gap-2 border-t border-border/50">
                <Button className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary-foreground text-xs h-8" data-testid={`button-manage-${show.id}`}>
                  <Settings className="mr-2 h-3 w-3" />
                  Manage
                </Button>
                <Button className="flex-1 bg-secondary/50 text-foreground hover:bg-secondary hover:text-white text-xs h-8" data-testid={`button-analytics-${show.id}`}>
                  <BarChart3 className="mr-2 h-3 w-3" />
                  Analytics
                </Button>
              </CardFooter>
            </Card>
          ))
        )}

        <button onClick={() => setOpen(true)} className="border-2 border-dashed border-border/50 rounded-lg flex flex-col items-center justify-center h-full min-h-[300px] hover:border-primary/50 hover:bg-primary/5 transition-all group" data-testid="button-onboard-show">
          <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Plus className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
          </div>
          <h3 className="font-display text-lg font-medium text-muted-foreground group-hover:text-primary">Onboard New Show</h3>
          <p className="text-sm text-muted-foreground/50 mt-1 max-w-[200px] text-center">Import RSS feed or create from scratch</p>
        </button>
      </div>
    </div>
  );
}
