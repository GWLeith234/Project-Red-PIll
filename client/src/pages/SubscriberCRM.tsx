import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useSubscribers, useCreateSubscriber, useUpdateSubscriber, useDeleteSubscriber,
  useSubscriber, useSubscriberSuggestions, useSubscriberRecentEpisodes, useAddSubscriberPodcast,
  useAnalyzeSocial, usePodcasts,
  useOutboundCampaigns, useCreateOutboundCampaign, useDeleteOutboundCampaign, useSendOutboundCampaign,
  useCrmLists, useCreateCrmList, useDeleteCrmList, downloadCsvExport,
} from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  UserPlus, Search, Mail, Phone, MapPin, Linkedin, Twitter, Facebook,
  Loader2, Zap, X, ChevronRight, Star, TrendingUp, Users, ArrowLeft,
  Pencil, Trash2, Globe, Building, Tag, StickyNote, Sparkles, Radio,
  Send, FileText, MessageSquare, Plus, Calendar, Download, ListFilter, Save, Filter,
  Headphones, Clock, Play, Mic, CheckCircle2
} from "lucide-react";

function SubscriberForm({ onSubmit, initialData, podcasts, onCancel }: {
  onSubmit: (data: any) => void;
  initialData?: any;
  podcasts: any[];
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zip: initialData?.zip || "",
    country: initialData?.country || "",
    company: initialData?.company || "",
    title: initialData?.title || "",
    profilePhoto: initialData?.profilePhoto || "",
    bio: initialData?.bio || "",
    notes: initialData?.notes || "",
    linkedinUrl: initialData?.linkedinUrl || "",
    twitterUrl: initialData?.twitterUrl || "",
    facebookUrl: initialData?.facebookUrl || "",
    tags: (initialData?.tags || []).join(", "),
    interests: (initialData?.interests || []).join(", "),
  });
  const [selectedPodcasts, setSelectedPodcasts] = useState<string[]>(
    initialData?.subscribedPodcasts?.map((p: any) => p.id) || []
  );

  const analyzeSocial = useAnalyzeSocial();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [socialUrl, setSocialUrl] = useState("");
  const [showSocialDialog, setShowSocialDialog] = useState(false);

  const handleAnalyzeSocial = async () => {
    if (!socialUrl.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeSocial.mutateAsync({ url: socialUrl.trim() });
      const updates: any = {};
      if (result.profilePhoto) updates.profilePhoto = result.profilePhoto;
      if (result.firstName && !form.firstName) updates.firstName = result.firstName;
      if (result.lastName && !form.lastName) updates.lastName = result.lastName;
      if (result.title && !form.title) updates.title = result.title;
      if (result.bio && !form.bio) updates.bio = result.bio;
      if (result.linkedinUrl) updates.linkedinUrl = result.linkedinUrl;
      if (result.twitterUrl) updates.twitterUrl = result.twitterUrl;
      if (result.facebookUrl) updates.facebookUrl = result.facebookUrl;
      setForm(prev => ({ ...prev, ...updates }));
      const grabbed = Object.keys(updates).filter(k => updates[k]).length;
      toast({ title: "Profile Imported", description: `Grabbed ${grabbed} field${grabbed !== 1 ? "s" : ""} from ${result.platform || "social"} profile${result.profilePhoto ? " (including photo)" : ""}.` });
      setShowSocialDialog(false);
      setSocialUrl("");
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.email.trim()) {
      toast({ title: "Required Fields", description: "First name and email are required.", variant: "destructive" });
      return;
    }
    onSubmit({
      ...form,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      interests: form.interests ? form.interests.split(",").map((i: string) => i.trim()).filter(Boolean) : [],
      podcastIds: selectedPodcasts,
    });
  };

  const togglePodcast = (id: string) => {
    setSelectedPodcasts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{initialData ? "Edit Subscriber" : "Add Subscriber"}</h3>
        <Dialog open={showSocialDialog} onOpenChange={setShowSocialDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary/10" data-testid="button-import-social">
              <Globe className="h-3 w-3 mr-1" />
              Import from Social
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Smart Profile Import
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Paste a LinkedIn, X/Twitter, or Facebook profile URL to automatically import their photo, name, title, and bio.
              </p>
              <Input
                placeholder="https://linkedin.com/in/name or https://x.com/handle"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                data-testid="input-social-url"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-[#0A66C2] border-[#0A66C2]/30" onClick={() => setSocialUrl("https://linkedin.com/in/")} data-testid="button-linkedin-template">
                  <Linkedin className="h-3 w-3 mr-1" /> LinkedIn
                </Button>
                <Button size="sm" variant="outline" className="flex-1 border-border" onClick={() => setSocialUrl("https://x.com/")} data-testid="button-twitter-template">
                  <Twitter className="h-3 w-3 mr-1" /> X
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-[#1877F2] border-[#1877F2]/30" onClick={() => setSocialUrl("https://facebook.com/")} data-testid="button-facebook-template">
                  <Facebook className="h-3 w-3 mr-1" /> Facebook
                </Button>
              </div>
              <Button
                onClick={handleAnalyzeSocial}
                disabled={analyzing || !socialUrl.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-analyze-social"
              >
                {analyzing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Zap className="h-4 w-4 mr-2" /> Analyze & Import</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {form.profilePhoto && (
        <div className="flex items-center gap-4 p-3 border border-border/50 rounded-sm bg-card/30" data-testid="preview-profile-photo">
          <img src={form.profilePhoto} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 border-primary/20" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Profile Photo</p>
            <Input value={form.profilePhoto} onChange={e => setForm(f => ({ ...f, profilePhoto: e.target.value }))} placeholder="Photo URL" className="text-xs" data-testid="input-profile-photo" />
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => setForm(f => ({ ...f, profilePhoto: "" }))} data-testid="button-remove-photo">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">First Name *</label>
          <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" data-testid="input-first-name" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Last Name</label>
          <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe" data-testid="input-last-name" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Email *</label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" data-testid="input-email" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Phone / SMS</label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 123-4567" data-testid="input-phone" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Company</label>
          <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" data-testid="input-company" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Title</label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="VP Marketing" data-testid="input-title" />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Address</label>
        <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main Street" data-testid="input-address" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" data-testid="input-city" />
        <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State" data-testid="input-state" />
        <Input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="ZIP" data-testid="input-zip" />
        <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Country" data-testid="input-country" />
      </div>

      <div className="border-t border-border/50 pt-4">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Social Profiles</label>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-[#0A66C2] shrink-0" />
            <Input value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="LinkedIn URL" className="text-xs" data-testid="input-linkedin" />
          </div>
          <div className="flex items-center gap-2">
            <Twitter className="h-4 w-4 shrink-0" />
            <Input value={form.twitterUrl} onChange={e => setForm(f => ({ ...f, twitterUrl: e.target.value }))} placeholder="X (Twitter) URL" className="text-xs" data-testid="input-twitter" />
          </div>
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-[#1877F2] shrink-0" />
            <Input value={form.facebookUrl} onChange={e => setForm(f => ({ ...f, facebookUrl: e.target.value }))} placeholder="Facebook URL" className="text-xs" data-testid="input-facebook" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Interests (comma separated)</label>
          <Input value={form.interests} onChange={e => setForm(f => ({ ...f, interests: e.target.value }))} placeholder="technology, marketing, AI" data-testid="input-interests" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Tags (comma separated)</label>
          <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="VIP, early-adopter" data-testid="input-tags" />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Notes / Intel</label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this subscriber..." className="min-h-[80px]" data-testid="input-notes" />
      </div>

      {podcasts.length > 0 && (
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Subscribed Podcasts</label>
          <div className="flex flex-wrap gap-2">
            {podcasts.map((p: any) => (
              <Button
                key={p.id}
                variant={selectedPodcasts.includes(p.id) ? "default" : "outline"}
                size="sm"
                className={cn(
                  "text-xs",
                  selectedPodcasts.includes(p.id)
                    ? "bg-primary/20 text-primary border-primary/30"
                    : "border-border/50 text-muted-foreground"
                )}
                onClick={() => togglePodcast(p.id)}
                data-testid={`button-podcast-${p.id}`}
              >
                <Radio className="h-3 w-3 mr-1" />
                {p.title}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-save-subscriber">
          {initialData ? "Update Subscriber" : "Add Subscriber"}
        </Button>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel">Cancel</Button>
      </div>
    </div>
  );
}

function SubscriberDetail({ subscriberId, onBack }: { subscriberId: string; onBack: () => void }) {
  const { data: sub, isLoading } = useSubscriber(subscriberId);
  const { data: suggestions, isLoading: suggestionsLoading } = useSubscriberSuggestions(subscriberId);
  const { data: recentEpisodes, isLoading: episodesLoading } = useSubscriberRecentEpisodes(subscriberId);
  const [editing, setEditing] = useState(false);
  const { data: podcasts } = usePodcasts();
  const updateSubscriber = useUpdateSubscriber();
  const addPodcast = useAddSubscriberPodcast();
  const { toast } = useToast();
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (!sub) return <p className="text-muted-foreground">Subscriber not found.</p>;

  const initials = ((sub.firstName?.[0] || "") + (sub.lastName?.[0] || "")).toUpperCase() || "?";

  const handleUpdate = async (data: any) => {
    try {
      await updateSubscriber.mutateAsync({ id: subscriberId, ...data });
      toast({ title: "Subscriber Updated" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleQuickSubscribe = async (podcastId: string, podcastTitle: string) => {
    setSubscribingId(podcastId);
    try {
      await addPodcast.mutateAsync({ subscriberId, podcastId });
      toast({ title: "Subscribed!", description: `Added "${podcastTitle}" to this subscriber's shows.` });
    } catch (err: any) {
      toast({ title: "Subscribe Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubscribingId(null);
    }
  };

  const formatEpisodeDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  if (editing) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="mb-4" data-testid="button-back-from-edit">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Profile
        </Button>
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-6">
            <SubscriberForm
              onSubmit={handleUpdate}
              initialData={sub}
              podcasts={podcasts || []}
              onCancel={() => setEditing(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2" data-testid="button-back-to-list">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Subscribers
      </Button>

      <Card className="glass-panel border-border/50 overflow-hidden" data-testid="subscriber-detail-card">
        <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
        <CardContent className="-mt-8 relative">
          <div className="flex items-end gap-4 mb-4">
            <Avatar className="h-16 w-16 border-4 border-background shadow-xl ring-2 ring-primary/20">
              {sub.profilePhoto ? <AvatarImage src={sub.profilePhoto} /> : null}
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-display">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <h2 className="text-xl font-bold font-display" data-testid="text-subscriber-name">
                {sub.firstName} {sub.lastName}
              </h2>
              {sub.title && <p className="text-sm text-muted-foreground font-mono">{sub.title}{sub.company ? ` at ${sub.company}` : ""}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit-subscriber">
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          </div>

          {sub.bio && <p className="text-sm text-muted-foreground mb-3">{sub.bio}</p>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {sub.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary/70" /> {sub.email}
              </div>
            )}
            {sub.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary/70" /> {sub.phone}
              </div>
            )}
            {sub.source && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4 text-primary/70" />
                <span>Source: </span>
                <Badge variant="outline" className="text-[10px] font-mono bg-chart-1/10 text-chart-1 border-chart-1/20" data-testid="badge-detail-source">
                  {sub.source.replace(/_/g, " ")}
                </Badge>
              </div>
            )}
            {(sub.city || sub.state) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary/70" /> {[sub.city, sub.state, sub.country].filter(Boolean).join(", ")}
              </div>
            )}
            {sub.company && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4 text-primary/70" /> {sub.company}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-3">
            {sub.linkedinUrl && (
              <a href={sub.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] text-xs flex items-center gap-1 hover:underline">
                <Linkedin className="h-3 w-3" /> LinkedIn
              </a>
            )}
            {sub.twitterUrl && (
              <a href={sub.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:underline text-muted-foreground">
                <Twitter className="h-3 w-3" /> X
              </a>
            )}
            {sub.facebookUrl && (
              <a href={sub.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-[#1877F2] text-xs flex items-center gap-1 hover:underline">
                <Facebook className="h-3 w-3" /> Facebook
              </a>
            )}
          </div>

          {(sub.interests?.length > 0 || sub.tags?.length > 0) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {sub.interests?.map((i: string) => (
                <Badge key={i} variant="outline" className="bg-chart-2/10 text-chart-2 border-chart-2/20 text-[10px] font-mono">
                  {i}
                </Badge>
              ))}
              {sub.tags?.map((t: string) => (
                <Badge key={t} variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
                  <Tag className="h-2 w-2 mr-1" />{t}
                </Badge>
              ))}
            </div>
          )}

          {sub.notes && (
            <div className="mt-4 p-3 bg-card/30 border border-border/50 rounded-sm">
              <div className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                <StickyNote className="h-3 w-3" /> Intel / Notes
              </div>
              <p className="text-sm text-muted-foreground">{sub.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {sub.subscribedPodcasts?.length > 0 && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Headphones className="h-5 w-5 text-primary" />
              Subscribed Shows
              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border text-[10px] font-mono ml-1">
                {sub.subscribedPodcasts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sub.subscribedPodcasts.map((p: any) => (
                <div key={p.id} className="group flex gap-4 p-4 border border-border/50 rounded-lg bg-card/30 hover:border-primary/30 hover:bg-card/50 transition-all" data-testid={`subscribed-podcast-${p.id}`}>
                  <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {p.coverImage ? (
                      <img src={p.coverImage} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Mic className="h-6 w-6 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors truncate" data-testid={`text-podcast-title-${p.id}`}>{p.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.host}</p>
                    {p.description && (
                      <p className="text-xs text-muted-foreground/60 mt-1 line-clamp-2">{p.description}</p>
                    )}
                    {p.subscribers > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          <Users className="h-2.5 w-2.5 inline mr-0.5" />
                          {p.subscribers >= 1000 ? `${(p.subscribers / 1000).toFixed(0)}K` : p.subscribers}
                        </span>
                        {p.growthPercent > 0 && (
                          <span className="text-[10px] font-mono text-accent">
                            <TrendingUp className="h-2.5 w-2.5 inline mr-0.5" />+{p.growthPercent}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(sub.subscribedPodcasts?.length > 0) && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Recent Episodes
            </CardTitle>
            <CardDescription className="font-mono text-xs">Latest episodes from subscribed shows</CardDescription>
          </CardHeader>
          <CardContent>
            {episodesLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
            ) : recentEpisodes?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentEpisodes.map((ep: any) => (
                  <div key={ep.id} className="group flex gap-3 p-3 border border-border/50 rounded-lg bg-card/20 hover:border-primary/20 hover:bg-card/40 transition-all" data-testid={`recent-episode-${ep.id}`}>
                    <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-muted relative">
                      {ep.thumbnailUrl || ep.podcastCoverImage ? (
                        <img src={ep.thumbnailUrl || ep.podcastCoverImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                          <Headphones className="h-5 w-5 text-primary/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="h-5 w-5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors" data-testid={`text-episode-title-${ep.id}`}>{ep.title}</p>
                      <p className="text-[11px] text-primary/60 font-medium truncate">{ep.podcastTitle}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-2.5 w-2.5" />
                          {formatEpisodeDate(ep.publishedAt)}
                        </span>
                        {ep.duration && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {ep.duration}
                          </span>
                        )}
                        {ep.episodeType && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-border/50 text-muted-foreground/70">
                            {ep.episodeType}
                          </Badge>
                        )}
                      </div>
                      {ep.description && (
                        <p className="text-[11px] text-muted-foreground/50 mt-1 line-clamp-1">{ep.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No episodes found for subscribed shows yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="glass-panel border-primary/20">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Suggestions
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-[10px] ml-2">CROSS-POLLINATE</Badge>
          </CardTitle>
          <CardDescription className="font-mono text-xs">Recommended shows based on subscriber interests and listening patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {suggestionsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}</div>
          ) : suggestions?.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((s: any) => (
                <div key={s.podcast.id} className="flex items-center gap-4 p-4 border border-border/50 rounded-lg bg-card/30 hover:border-primary/30 transition-all" data-testid={`suggestion-${s.podcast.id}`}>
                  <div className="h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                    {s.podcast.coverImage ? (
                      <img src={s.podcast.coverImage} alt={s.podcast.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Mic className="h-6 w-6 text-primary/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{s.podcast.title}</p>
                      {s.score >= 70 && <Star className="h-3 w-3 text-primary fill-primary" />}
                      <Badge variant="outline" className="text-[10px] font-mono bg-primary/5 text-primary border-primary/20 ml-auto shrink-0">
                        {s.score}% match
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Hosted by {s.podcast.host}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {s.reasons.slice(0, 3).map((r: string, i: number) => (
                        <span key={i} className="text-[10px] font-mono text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                    {s.podcast.subscribers > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-mono text-muted-foreground/60">
                          {s.podcast.subscribers >= 1000 ? `${(s.podcast.subscribers / 1000).toFixed(0)}K` : s.podcast.subscribers} subscribers
                        </span>
                        {s.podcast.growthPercent > 0 && (
                          <span className="text-[10px] font-mono text-accent flex items-center gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5" /> +{s.podcast.growthPercent}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleQuickSubscribe(s.podcast.id, s.podcast.title)}
                    disabled={subscribingId === s.podcast.id}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 gap-1.5"
                    data-testid={`button-subscribe-${s.podcast.id}`}
                  >
                    {subscribingId === s.podcast.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Subscribe
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">
                Add interests and subscribe to shows to get personalized suggestions.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriberCRM() {
  const [activeTab, setActiveTab] = useState<"subscribers" | "campaigns">("subscribers");
  const [filterPodcast, setFilterPodcast] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showSaveListDialog, setShowSaveListDialog] = useState(false);
  const [showListsPanel, setShowListsPanel] = useState(false);
  const [listName, setListName] = useState("");
  const [campaignForm, setCampaignForm] = useState({ name: "", type: "email" as "email" | "sms", subject: "", body: "", podcastFilter: "" });
  const { data: subscribers, isLoading } = useSubscribers(filterPodcast);
  const { data: podcasts } = usePodcasts();
  const createSubscriber = useCreateSubscriber();
  const deleteSubscriber = useDeleteSubscriber();
  const { data: campaignsList, isLoading: campaignsLoading } = useOutboundCampaigns("subscribers");
  const createCampaign = useCreateOutboundCampaign();
  const deleteCampaign = useDeleteOutboundCampaign();
  const sendCampaign = useSendOutboundCampaign();
  const { data: savedLists } = useCrmLists("subscriber");
  const createCrmList = useCreateCrmList();
  const deleteCrmList = useDeleteCrmList();
  const { toast } = useToast();

  const allTags = [...new Set((subscribers || []).flatMap((s: any) => s.tags || []))].filter(Boolean).sort();
  const allSources = [...new Set((subscribers || []).map((s: any) => s.source).filter(Boolean))].sort();

  const filteredSubscribers = (subscribers || []).filter((s: any) => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!(
        (s.firstName || "").toLowerCase().includes(term) ||
        (s.lastName || "").toLowerCase().includes(term) ||
        (s.email || "").toLowerCase().includes(term) ||
        (s.company || "").toLowerCase().includes(term) ||
        (s.phone || "").includes(term)
      )) return false;
    }
    if (filterSource !== "all" && s.source !== filterSource) return false;
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (filterTag !== "all" && !(s.tags || []).includes(filterTag)) return false;
    return true;
  });

  const activeFilterCount = [filterSource !== "all", filterStatus !== "all", filterTag !== "all", !!filterPodcast].filter(Boolean).length;

  const handleSaveList = async () => {
    if (!listName.trim()) {
      toast({ title: "Name Required", variant: "destructive" });
      return;
    }
    try {
      await createCrmList.mutateAsync({
        name: listName.trim(),
        crmType: "subscriber",
        entityType: "subscribers",
        filters: JSON.stringify({ search: searchTerm, podcast: filterPodcast || "", source: filterSource, status: filterStatus, tag: filterTag }),
        itemCount: filteredSubscribers.length,
      });
      toast({ title: "List Saved", description: `"${listName}" saved with ${filteredSubscribers.length} subscribers.` });
      setShowSaveListDialog(false);
      setListName("");
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleLoadList = (list: any) => {
    try {
      const f = JSON.parse(list.filters);
      setSearchTerm(f.search || "");
      setFilterPodcast(f.podcast || undefined);
      setFilterSource(f.source || "all");
      setFilterStatus(f.status || "all");
      setFilterTag(f.tag || "all");
      setShowFilters(true);
      setShowListsPanel(false);
      toast({ title: "List Loaded", description: `Applied filters from "${list.name}".` });
    } catch {
      toast({ title: "Load Failed", variant: "destructive" });
    }
  };

  const handleDeleteList = async (id: string, name: string) => {
    if (!confirm(`Delete saved list "${name}"?`)) return;
    try {
      await deleteCrmList.mutateAsync(id);
      toast({ title: "List Deleted" });
    } catch {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  const handleExportCsv = () => {
    const params: Record<string, string> = {};
    if (searchTerm) params.search = searchTerm;
    if (filterPodcast) params.podcastId = filterPodcast;
    if (filterSource !== "all") params.source = filterSource;
    if (filterStatus !== "all") params.status = filterStatus;
    if (filterTag !== "all") params.tags = filterTag;
    downloadCsvExport("subscribers", params);
    toast({ title: "Export Started", description: `Exporting ${filteredSubscribers.length} subscribers to CSV.` });
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterPodcast(undefined);
    setFilterSource("all");
    setFilterStatus("all");
    setFilterTag("all");
  };

  const handleCreate = async (data: any) => {
    try {
      await createSubscriber.mutateAsync(data);
      toast({ title: "Subscriber Added" });
      setShowAddForm(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from your subscribers?`)) return;
    try {
      await deleteSubscriber.mutateAsync(id);
      toast({ title: "Subscriber Removed" });
    } catch {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim() || !campaignForm.body.trim()) {
      toast({ title: "Required Fields", description: "Name and body are required.", variant: "destructive" });
      return;
    }
    if (campaignForm.type === "email" && !campaignForm.subject.trim()) {
      toast({ title: "Required Fields", description: "Subject is required for email campaigns.", variant: "destructive" });
      return;
    }
    try {
      await createCampaign.mutateAsync({
        ...campaignForm,
        audience: "subscribers",
        podcastFilter: campaignForm.podcastFilter || null,
      });
      toast({ title: "Campaign Created" });
      setShowCampaignDialog(false);
      setCampaignForm({ name: "", type: "email", subject: "", body: "", podcastFilter: "" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSendCampaign = async (id: string) => {
    if (!confirm("Send this campaign to all matching subscribers?")) return;
    try {
      await sendCampaign.mutateAsync(id);
      toast({ title: "Campaign Sending", description: "Your campaign is being sent." });
    } catch (err: any) {
      toast({ title: "Send Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Delete campaign "${name}"?`)) return;
    try {
      await deleteCampaign.mutateAsync(id);
      toast({ title: "Campaign Deleted" });
    } catch {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-muted/50 text-muted-foreground border-border/50";
      case "sending": return "bg-chart-4/10 text-chart-4 border-chart-4/20";
      case "sent": return "bg-accent/10 text-accent border-accent/20";
      case "failed": return "bg-destructive/10 text-destructive border-destructive/20";
      default: return "bg-muted/50 text-muted-foreground border-border/50";
    }
  };

  if (selectedSubscriberId) {
    return (
      <div className="animate-in fade-in duration-300">
        <SubscriberDetail subscriberId={selectedSubscriberId} onBack={() => setSelectedSubscriberId(null)} />
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="animate-in fade-in duration-300">
        <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="mb-4" data-testid="button-back-from-add">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Subscribers
        </Button>
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-6">
            <SubscriberForm
              onSubmit={handleCreate}
              podcasts={podcasts || []}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Subscriber CRM</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {activeTab === "subscribers"
              ? `${filteredSubscribers.length} subscriber${filteredSubscribers.length !== 1 ? "s" : ""} | Cross-Pollination Engine Active`
              : `${(campaignsList || []).length} campaign${(campaignsList || []).length !== 1 ? "s" : ""}`}
          </p>
        </div>
        {activeTab === "subscribers" ? (
          <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-add-subscriber">
            <UserPlus className="mr-2 h-3 w-3" />
            Add Subscriber
          </Button>
        ) : (
          <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-new-campaign">
                <Plus className="mr-2 h-3 w-3" />
                New Campaign
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display flex items-center gap-2">
                  <Send className="h-5 w-5 text-primary" />
                  Compose Campaign
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Campaign Name *</label>
                  <Input
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Q1 Newsletter Blast"
                    data-testid="input-campaign-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Type *</label>
                    <Select value={campaignForm.type} onValueChange={(v) => setCampaignForm(f => ({ ...f, type: v as "email" | "sms" }))}>
                      <SelectTrigger data-testid="select-campaign-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email"><span className="flex items-center gap-2"><Mail className="h-3 w-3" /> Email</span></SelectItem>
                        <SelectItem value="sms"><span className="flex items-center gap-2"><MessageSquare className="h-3 w-3" /> SMS</span></SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Podcast Filter</label>
                    <Select value={campaignForm.podcastFilter || "all"} onValueChange={(v) => setCampaignForm(f => ({ ...f, podcastFilter: v === "all" ? "" : v }))}>
                      <SelectTrigger data-testid="select-campaign-podcast">
                        <SelectValue placeholder="All Subscribers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subscribers</SelectItem>
                        {(podcasts || []).map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {campaignForm.type === "email" && (
                  <div>
                    <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Subject *</label>
                    <Input
                      value={campaignForm.subject}
                      onChange={(e) => setCampaignForm(f => ({ ...f, subject: e.target.value }))}
                      placeholder="Your weekly podcast digest"
                      data-testid="input-campaign-subject"
                    />
                  </div>
                )}
                <div>
                  <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Body *</label>
                  <Textarea
                    value={campaignForm.body}
                    onChange={(e) => setCampaignForm(f => ({ ...f, body: e.target.value }))}
                    placeholder="Write your message content here..."
                    className="min-h-[120px]"
                    data-testid="input-campaign-body"
                  />
                </div>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={createCampaign.isPending}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  data-testid="button-save-campaign"
                >
                  {createCampaign.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                  ) : (
                    <><FileText className="h-4 w-4 mr-2" /> Create Campaign</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-1 border-b border-border/50">
        <button
          onClick={() => setActiveTab("subscribers")}
          className={cn(
            "px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px",
            activeTab === "subscribers"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          data-testid="tab-subscribers"
        >
          <Users className="h-3.5 w-3.5 inline mr-2" />
          Subscribers
        </button>
        <button
          onClick={() => setActiveTab("campaigns")}
          className={cn(
            "px-4 py-2 text-sm font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px",
            activeTab === "campaigns"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
          data-testid="tab-campaigns"
        >
          <Send className="h-3.5 w-3.5 inline mr-2" />
          Campaigns
        </button>
      </div>

      {activeTab === "subscribers" && (
        <>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscribers by name, email, company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-subscribers"
              />
            </div>
            <Select value={filterPodcast || "all"} onValueChange={(v) => setFilterPodcast(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-[220px]" data-testid="select-filter-podcast">
                <SelectValue placeholder="All Podcasts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Podcasts</SelectItem>
                {(podcasts || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={cn("font-mono text-xs", showFilters && "bg-primary/10 border-primary/30")} data-testid="button-toggle-filters">
              <Filter className="h-3 w-3 mr-1" />
              Filters
              {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{activeFilterCount}</Badge>}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowListsPanel(!showListsPanel)} className={cn("font-mono text-xs", showListsPanel && "bg-primary/10 border-primary/30")} data-testid="button-toggle-lists">
              <ListFilter className="h-3 w-3 mr-1" />
              Lists
              {(savedLists || []).length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{(savedLists || []).length}</Badge>}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="font-mono text-xs" data-testid="button-export-subscribers">
              <Download className="h-3 w-3 mr-1" />
              CSV
            </Button>
          </div>

          {showFilters && (
            <Card className="glass-panel border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Advanced Filters</p>
                <div className="flex gap-2">
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 text-xs font-mono text-muted-foreground" data-testid="button-clear-filters">
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Source</label>
                  <Select value={filterSource} onValueChange={setFilterSource}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-filter-source">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {allSources.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Status</label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-filter-status">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Tag</label>
                  <Select value={filterTag} onValueChange={setFilterTag}>
                    <SelectTrigger className="h-8 text-xs" data-testid="select-filter-tag">
                      <SelectValue placeholder="All Tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {allTags.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                <p className="text-xs text-muted-foreground font-mono">
                  {filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? "s" : ""} match
                </p>
                <Dialog open={showSaveListDialog} onOpenChange={setShowSaveListDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 text-xs font-mono" data-testid="button-save-list">
                      <Save className="h-3 w-3 mr-1" /> Save as List
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle className="font-display">Save Subscriber List</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                      <Input
                        placeholder="List name (e.g., VIP Subscribers)"
                        value={listName}
                        onChange={(e) => setListName(e.target.value)}
                        data-testid="input-list-name"
                      />
                      <p className="text-xs text-muted-foreground font-mono">
                        {filteredSubscribers.length} subscribers will be captured in this list.
                      </p>
                      <Button
                        onClick={handleSaveList}
                        disabled={createCrmList.isPending}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                        data-testid="button-confirm-save-list"
                      >
                        {createCrmList.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save List
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          )}

          {showListsPanel && (
            <Card className="glass-panel border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Saved Lists</p>
              </div>
              {(savedLists || []).length > 0 ? (
                <div className="space-y-2">
                  {(savedLists || []).map((list: any) => (
                    <div key={list.id} className="flex items-center justify-between p-2 rounded-sm border border-border/30 hover:border-primary/30 transition-colors group" data-testid={`saved-list-${list.id}`}>
                      <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => handleLoadList(list)}>
                        <ListFilter className="h-4 w-4 text-primary" />
                        <div>
                          <p className="text-sm font-semibold">{list.name}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {list.itemCount} subscribers &bull; {list.createdAt ? new Date(list.createdAt).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost" size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteList(list.id, list.name)}
                        data-testid={`button-delete-list-${list.id}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">No saved lists yet. Use filters and save them as a list.</p>
              )}
            </Card>
          )}

          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : filteredSubscribers.length > 0 ? (
            <div className="space-y-2">
              {filteredSubscribers.map((sub: any) => {
                const initials = ((sub.firstName?.[0] || "") + (sub.lastName?.[0] || "")).toUpperCase();
                return (
                  <Card
                    key={sub.id}
                    className="glass-panel border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                    data-testid={`subscriber-card-${sub.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 shrink-0" onClick={() => setSelectedSubscriberId(sub.id)}>
                          {sub.profilePhoto ? <AvatarImage src={sub.profilePhoto} /> : null}
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-display">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedSubscriberId(sub.id)}>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold group-hover:text-primary transition-colors" data-testid={`text-sub-name-${sub.id}`}>
                              {sub.firstName} {sub.lastName}
                            </p>
                            {sub.tags?.length > 0 && sub.tags.slice(0, 2).map((t: string) => (
                              <Badge key={t} variant="outline" className="text-[9px] font-mono bg-primary/5 text-primary border-primary/20">{t}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                            {sub.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {sub.email}</span>}
                            {sub.company && <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {sub.company}</span>}
                            {sub.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {sub.phone}</span>}
                            {sub.source && sub.source !== "manual" && (
                              <Badge variant="outline" className="text-[9px] font-mono bg-chart-1/10 text-chart-1 border-chart-1/20" data-testid={`badge-source-${sub.id}`}>
                                <Globe className="h-2 w-2 mr-1" />{sub.source.replace(/_/g, " ")}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {sub.linkedinUrl && <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />}
                          {sub.twitterUrl && <Twitter className="h-3.5 w-3.5 text-muted-foreground" />}
                          {sub.facebookUrl && <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />}
                          <Button
                            variant="ghost" size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => { e.stopPropagation(); handleDelete(sub.id, `${sub.firstName} ${sub.lastName}`); }}
                            data-testid={`button-delete-${sub.id}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="glass-panel border-border/50">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-display font-semibold text-muted-foreground mb-1">No Subscribers Yet</h3>
                <p className="text-sm text-muted-foreground/70 mb-4">Start building your subscriber CRM by adding your first contact.</p>
                <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-add-first-subscriber">
                  <UserPlus className="mr-2 h-4 w-4" /> Add First Subscriber
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {activeTab === "campaigns" && (
        <>
          {campaignsLoading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
          ) : (campaignsList || []).length > 0 ? (
            <div className="space-y-3">
              {(campaignsList || []).map((c: any) => (
                <Card key={c.id} className="glass-panel border-border/50 hover:border-primary/20 transition-colors" data-testid={`campaign-card-${c.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "h-10 w-10 rounded-sm flex items-center justify-center shrink-0",
                        c.type === "email" ? "bg-chart-1/10 text-chart-1" : "bg-chart-2/10 text-chart-2"
                      )}>
                        {c.type === "email" ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold font-display" data-testid={`text-campaign-name-${c.id}`}>{c.name}</p>
                          <Badge variant="outline" className={cn("text-[10px] font-mono", statusColor(c.status))} data-testid={`badge-campaign-status-${c.id}`}>
                            {c.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-mono bg-card/30 border-border/50 text-muted-foreground">
                            {c.type}
                          </Badge>
                        </div>
                        {c.subject && (
                          <p className="text-xs text-muted-foreground mb-1 truncate" data-testid={`text-campaign-subject-${c.id}`}>
                            <span className="font-mono text-muted-foreground/60">Subject:</span> {c.subject}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1" data-testid={`text-campaign-recipients-${c.id}`}>
                            <Users className="h-3 w-3" /> {c.recipientCount || 0} recipients
                          </span>
                          {c.sentCount > 0 && (
                            <span className="flex items-center gap-1 text-accent" data-testid={`text-campaign-sent-${c.id}`}>
                              <Send className="h-3 w-3" /> {c.sentCount} sent
                            </span>
                          )}
                          {c.failedCount > 0 && (
                            <span className="flex items-center gap-1 text-destructive">
                              {c.failedCount} failed
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {new Date(c.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {c.status === "draft" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs font-mono border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => handleSendCampaign(c.id)}
                              disabled={sendCampaign.isPending}
                              data-testid={`button-send-campaign-${c.id}`}
                            >
                              <Send className="h-3 w-3 mr-1" /> Send
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteCampaign(c.id, c.name)}
                              data-testid={`button-delete-campaign-${c.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-panel border-border/50">
              <CardContent className="py-12 text-center">
                <Send className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-display font-semibold text-muted-foreground mb-1">No Campaigns Yet</h3>
                <p className="text-sm text-muted-foreground/70 mb-4">Create your first outbound campaign to reach your subscribers.</p>
                <Button onClick={() => setShowCampaignDialog(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-create-first-campaign">
                  <Plus className="mr-2 h-4 w-4" /> Create First Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
