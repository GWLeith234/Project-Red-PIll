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
  useSubscriber, useSubscriberSuggestions, useAnalyzeSocial, usePodcasts,
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
  Pencil, Trash2, Globe, Building, Tag, StickyNote, Sparkles, Radio
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
      if (result.bio && !form.notes) updates.notes = result.bio;
      if (result.linkedinUrl) updates.linkedinUrl = result.linkedinUrl;
      if (result.twitterUrl) updates.twitterUrl = result.twitterUrl;
      if (result.facebookUrl) updates.facebookUrl = result.facebookUrl;
      setForm(prev => ({ ...prev, ...updates }));
      toast({ title: "Profile Imported", description: `Grabbed data from ${result.platform || "social"} profile.` });
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
                  <Twitter className="h-3 w-3 mr-1" /> X / Twitter
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
            <Input value={form.twitterUrl} onChange={e => setForm(f => ({ ...f, twitterUrl: e.target.value }))} placeholder="X / Twitter URL" className="text-xs" data-testid="input-twitter" />
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
  const [editing, setEditing] = useState(false);
  const { data: podcasts } = usePodcasts();
  const updateSubscriber = useUpdateSubscriber();
  const { toast } = useToast();

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
                <Twitter className="h-3 w-3" /> X / Twitter
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
              <Radio className="h-5 w-5 text-primary" />
              Subscribed Shows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {sub.subscribedPodcasts.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-sm bg-card/30" data-testid={`subscribed-podcast-${p.id}`}>
                  {p.coverImage && <img src={p.coverImage} alt={p.title} className="h-10 w-10 rounded-sm object-cover" />}
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.host}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : suggestions?.length > 0 ? (
            <div className="space-y-3">
              {suggestions.map((s: any) => (
                <div key={s.podcast.id} className="flex items-start gap-4 p-3 border border-border/50 rounded-sm bg-card/30 hover:border-primary/30 transition-colors" data-testid={`suggestion-${s.podcast.id}`}>
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold font-display text-sm shrink-0">
                    {s.score}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{s.podcast.title}</p>
                      {s.score >= 70 && <Star className="h-3 w-3 text-primary fill-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">Hosted by {s.podcast.host}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.reasons.slice(0, 3).map((r: string, i: number) => (
                        <span key={i} className="text-[10px] font-mono text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  {s.podcast.subscribers && (
                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono text-muted-foreground">{(s.podcast.subscribers / 1000).toFixed(0)}K</span>
                      {s.podcast.growthPercent > 0 && (
                        <div className="flex items-center gap-0.5 text-accent text-[10px] font-mono">
                          <TrendingUp className="h-3 w-3" /> +{s.podcast.growthPercent}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Add interests and subscribe to shows to get personalized suggestions.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SubscriberCRM() {
  const [filterPodcast, setFilterPodcast] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSubscriberId, setSelectedSubscriberId] = useState<string | null>(null);
  const { data: subscribers, isLoading } = useSubscribers(filterPodcast);
  const { data: podcasts } = usePodcasts();
  const createSubscriber = useCreateSubscriber();
  const deleteSubscriber = useDeleteSubscriber();
  const { toast } = useToast();

  const filteredSubscribers = (subscribers || []).filter((s: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.firstName || "").toLowerCase().includes(term) ||
      (s.lastName || "").toLowerCase().includes(term) ||
      (s.email || "").toLowerCase().includes(term) ||
      (s.company || "").toLowerCase().includes(term) ||
      (s.phone || "").includes(term)
    );
  });

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
            {filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? "s" : ""} | Cross-Pollination Engine Active
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-add-subscriber">
          <UserPlus className="mr-2 h-3 w-3" />
          Add Subscriber
        </Button>
      </div>

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
      </div>

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
    </div>
  );
}
