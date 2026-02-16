import { useState, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useOutboundCampaigns, useCreateOutboundCampaign, useDeleteOutboundCampaign,
  useSendOutboundCampaign, useUpdateOutboundCampaign, useCompanies,
} from "@/lib/api";
import CampaignBuilderComponent, { CampaignBlock, serializeBlocks, deserializeBlocks } from "@/components/CampaignBuilder";
import {
  Plus, Send, Mail, MessageSquare, Users, Calendar, Trash2,
  Building, Search, Pencil, BarChart3, FileText, Zap, Layout,
  Megaphone, Sparkles, ArrowUpRight, MousePointerClick, Eye,
  Headphones, ShoppingBag, Newspaper, CheckCircle2, Clock, AlertCircle,
  type LucideIcon,
} from "lucide-react";

const TEMPLATES: { name: string; description: string; icon: LucideIcon; color: string; blocks: () => CampaignBlock[] }[] = [
  {
    name: "Newsletter",
    description: "Weekly digest with articles & podcast highlights",
    icon: Newspaper,
    color: "text-chart-1 bg-chart-1/10 border-chart-1/20",
    blocks: () => [
      { id: `blk_${Date.now()}_1`, type: "header", content: "This Week's Digest", alignment: "center" },
      { id: `blk_${Date.now()}_2`, type: "richtext", content: "Hi {{firstName}},\n\nHere's what's new this week in our network. We've got fresh episodes, trending stories, and exclusive offers just for you." },
      { id: `blk_${Date.now()}_3`, type: "divider", content: "" },
      { id: `blk_${Date.now()}_4`, type: "richtext", content: "Featured content and updates from our shows..." },
      { id: `blk_${Date.now()}_5`, type: "button", content: "", linkText: "Read More on Our Site", linkUrl: "https://", buttonColor: "#6366f1", buttonTextColor: "#ffffff", alignment: "center" },
      { id: `blk_${Date.now()}_6`, type: "social_links", content: "Follow us on social media", socialPlatforms: ["facebook", "twitter", "linkedin", "instagram"] },
    ],
  },
  {
    name: "Product Launch",
    description: "Announce a new product or sponsorship opportunity",
    icon: ShoppingBag,
    color: "text-chart-2 bg-chart-2/10 border-chart-2/20",
    blocks: () => [
      { id: `blk_${Date.now()}_a1`, type: "header", content: "Introducing Something New", alignment: "center" },
      { id: `blk_${Date.now()}_a2`, type: "image", content: "", alignment: "center" },
      { id: `blk_${Date.now()}_a3`, type: "richtext", content: "Hi {{firstName}},\n\nWe're excited to announce our latest offering. Here's everything you need to know..." },
      { id: `blk_${Date.now()}_a4`, type: "button", content: "", linkText: "Get Started", linkUrl: "https://", buttonColor: "#10b981", buttonTextColor: "#ffffff", alignment: "center" },
    ],
  },
  {
    name: "Podcast Promo",
    description: "Promote a new episode or show launch",
    icon: Headphones,
    color: "text-chart-4 bg-chart-4/10 border-chart-4/20",
    blocks: () => [
      { id: `blk_${Date.now()}_b1`, type: "header", content: "New Episode Alert!", alignment: "center" },
      { id: `blk_${Date.now()}_b2`, type: "richtext", content: "Hi {{firstName}},\n\nA brand new episode just dropped! Don't miss this one." },
      { id: `blk_${Date.now()}_b3`, type: "podcast_art", content: "Listen now on your favorite platform", podcastTitle: "Select a podcast" },
      { id: `blk_${Date.now()}_b4`, type: "button", content: "", linkText: "Listen Now", linkUrl: "https://", buttonColor: "#8b5cf6", buttonTextColor: "#ffffff", alignment: "center" },
      { id: `blk_${Date.now()}_b5`, type: "social_links", content: "Share with friends", socialPlatforms: ["facebook", "twitter", "linkedin"] },
    ],
  },
  {
    name: "Blank Canvas",
    description: "Start from scratch with a clean slate",
    icon: Layout,
    color: "text-muted-foreground bg-muted/30 border-border/50",
    blocks: () => [],
  },
];

export default function CampaignBuilderPage() {
  const { toast } = useToast();
  const { data: campaignsList, isLoading } = useOutboundCampaigns("subscribers");
  const { data: companies } = useCompanies();
  const createCampaign = useCreateOutboundCampaign();
  const deleteCampaign = useDeleteOutboundCampaign();
  const sendCampaign = useSendOutboundCampaign();
  const updateCampaign = useUpdateOutboundCampaign();

  const [builderMode, setBuilderMode] = useState(false);
  const [builderBlocks, setBuilderBlocks] = useState<CampaignBlock[]>([]);
  const [builderCampaignName, setBuilderCampaignName] = useState("");
  const [builderCampaignSubject, setBuilderCampaignSubject] = useState("");
  const [builderCampaignType, setBuilderCampaignType] = useState<"email" | "sms">("email");
  const [builderEditingId, setBuilderEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const campaigns = campaignsList || [];

  const stats = useMemo(() => {
    const total = campaigns.length;
    const drafts = campaigns.filter((c: any) => c.status === "draft").length;
    const sent = campaigns.filter((c: any) => c.status === "sent").length;
    const totalRecipients = campaigns.reduce((s: number, c: any) => s + (c.recipientCount || 0), 0);
    const totalSent = campaigns.reduce((s: number, c: any) => s + (c.sentCount || 0), 0);
    const totalOpens = campaigns.reduce((s: number, c: any) => s + (c.openCount || 0), 0);
    const totalClicks = campaigns.reduce((s: number, c: any) => s + (c.clickCount || 0), 0);
    const totalBounces = campaigns.reduce((s: number, c: any) => s + (c.bounceCount || 0), 0);
    const avgDeliveryRate = sent > 0 ? campaigns.filter((c: any) => c.status === "sent").reduce((s: number, c: any) => s + (c.deliveryRate || 0), 0) / sent : 0;
    const avgOpenRate = sent > 0 ? campaigns.filter((c: any) => c.status === "sent").reduce((s: number, c: any) => s + (c.openRate || 0), 0) / sent : 0;
    const avgClickRate = sent > 0 ? campaigns.filter((c: any) => c.status === "sent").reduce((s: number, c: any) => s + (c.clickToOpenRate || 0), 0) / sent : 0;
    return { total, drafts, sent, totalRecipients, totalSent, totalOpens, totalClicks, totalBounces, avgDeliveryRate, avgOpenRate, avgClickRate };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c: any) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (c.name || "").toLowerCase().includes(term) || (c.subject || "").toLowerCase().includes(term);
    });
  }, [campaigns, statusFilter, searchTerm]);

  const openBuilder = (existingCampaign?: any) => {
    if (existingCampaign) {
      setBuilderCampaignName(existingCampaign.name);
      setBuilderCampaignSubject(existingCampaign.subject || "");
      setBuilderCampaignType(existingCampaign.type || "email");
      setBuilderBlocks(deserializeBlocks(existingCampaign.body || ""));
      setBuilderEditingId(existingCampaign.id);
    } else {
      setBuilderCampaignName("");
      setBuilderCampaignSubject("");
      setBuilderCampaignType("email");
      setBuilderBlocks([]);
      setBuilderEditingId(null);
    }
    setBuilderMode(true);
  };

  const openFromTemplate = (template: typeof TEMPLATES[number]) => {
    setBuilderCampaignName(template.name === "Blank Canvas" ? "" : `${template.name} - ${new Date().toLocaleDateString()}`);
    setBuilderCampaignSubject("");
    setBuilderCampaignType("email");
    setBuilderBlocks(template.blocks());
    setBuilderEditingId(null);
    setBuilderMode(true);
  };

  const handleBuilderSave = async () => {
    if (!builderCampaignName.trim()) {
      toast({ title: "Name Required", description: "Please enter a campaign name.", variant: "destructive" });
      return;
    }
    const body = serializeBlocks(builderBlocks);
    try {
      if (builderEditingId) {
        await updateCampaign.mutateAsync({ id: builderEditingId, name: builderCampaignName, subject: builderCampaignSubject, body });
        toast({ title: "Campaign Updated" });
      } else {
        await createCampaign.mutateAsync({ name: builderCampaignName, type: builderCampaignType, audience: "subscribers", subject: builderCampaignSubject, body, podcastFilter: null, companyId: null });
        toast({ title: "Campaign Created" });
      }
      setBuilderMode(false);
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSendCampaign = async (id: string) => {
    if (!confirm("Send this campaign to all matching subscribers?")) return;
    try {
      await sendCampaign.mutateAsync(id);
      toast({ title: "Campaign Sending", description: "Your campaign is being delivered." });
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

  if (builderMode) {
    return (
      <div className="animate-in fade-in duration-300 -m-8">
        <CampaignBuilderComponent
          campaignName={builderCampaignName}
          campaignSubject={builderCampaignSubject}
          campaignType={builderCampaignType}
          blocks={builderBlocks}
          onNameChange={setBuilderCampaignName}
          onSubjectChange={setBuilderCampaignSubject}
          onBlocksChange={setBuilderBlocks}
          onSave={handleBuilderSave}
          onBack={() => setBuilderMode(false)}
          isSaving={createCampaign.isPending || updateCampaign.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <PageHeader pageKey="campaigns" onPrimaryAction={() => openBuilder()} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Campaigns", value: stats.total, icon: FileText, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/20" },
          { label: "Drafts", value: stats.drafts, icon: Clock, color: "text-chart-4", bgColor: "bg-chart-4/10", borderColor: "border-chart-4/20" },
          { label: "Sent", value: stats.sent, icon: CheckCircle2, color: "text-accent", bgColor: "bg-accent/10", borderColor: "border-accent/20" },
          { label: "Total Recipients", value: stats.totalRecipients.toLocaleString(), icon: Users, color: "text-chart-1", bgColor: "bg-chart-1/10", borderColor: "border-chart-1/20" },
        ].map((stat) => (
          <Card key={stat.label} className={cn("glass-panel border", stat.borderColor)} data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <span className={cn("text-2xl font-bold font-display", stat.color)}>{stat.value}</span>
              </div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.sent > 0 && (
        <Card className="glass-panel border-border/50" data-testid="campaign-kpi-dashboard">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-display font-semibold uppercase tracking-wider">Campaign Performance</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[
                { label: "Avg Delivery Rate", value: `${stats.avgDeliveryRate.toFixed(1)}%`, color: "text-accent", bgColor: "bg-accent/10", icon: Send },
                { label: "Avg Open Rate", value: `${stats.avgOpenRate.toFixed(1)}%`, color: "text-chart-1", bgColor: "bg-chart-1/10", icon: Eye },
                { label: "Avg Click Rate", value: `${stats.avgClickRate.toFixed(1)}%`, color: "text-chart-2", bgColor: "bg-chart-2/10", icon: MousePointerClick },
                { label: "Total Opens", value: stats.totalOpens.toLocaleString(), color: "text-chart-1", bgColor: "bg-chart-1/10", icon: Eye },
                { label: "Total Clicks", value: stats.totalClicks.toLocaleString(), color: "text-chart-2", bgColor: "bg-chart-2/10", icon: MousePointerClick },
                { label: "Total Bounces", value: stats.totalBounces.toLocaleString(), color: "text-destructive", bgColor: "bg-destructive/10", icon: AlertCircle },
              ].map((kpi) => (
                <div key={kpi.label} className="text-center" data-testid={`kpi-${kpi.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mx-auto mb-2", kpi.bgColor)}>
                    <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                  </div>
                  <p className={cn("text-xl font-bold font-display", kpi.color)}>{kpi.value}</p>
                  <p className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Delivery", value: stats.avgDeliveryRate, color: "bg-accent" },
                { label: "Opens", value: stats.avgOpenRate, color: "bg-chart-1" },
                { label: "Clicks", value: stats.avgClickRate, color: "bg-chart-2" },
              ].map((bar) => (
                <div key={bar.label} data-testid={`bar-${bar.label.toLowerCase()}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{bar.label}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{bar.value.toFixed(1)}%</span>
                  </div>
                  <Progress value={bar.value} className="h-2 bg-muted/30" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {campaigns.length === 0 && !isLoading && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-display font-semibold uppercase tracking-wider">Quick Start Templates</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                onClick={() => openFromTemplate(tpl)}
                className="group text-left"
                data-testid={`template-${tpl.name.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Card className={cn("glass-panel border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg", tpl.color.split(" ").pop())}>
                  <CardContent className="p-5">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center mb-3 border", tpl.color)}>
                      <tpl.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-display font-semibold mb-1 group-hover:text-primary transition-colors">{tpl.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{tpl.description}</p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Use Template <ArrowUpRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-auto">
            <TabsList className="bg-card/50 border border-border/50 p-1 h-auto">
              <TabsTrigger value="all" className="font-mono text-[10px] uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-3 py-1.5" data-testid="tab-filter-all">
                All ({campaigns.length})
              </TabsTrigger>
              <TabsTrigger value="draft" className="font-mono text-[10px] uppercase tracking-wider data-[state=active]:bg-chart-4/20 data-[state=active]:text-chart-4 px-3 py-1.5" data-testid="tab-filter-draft">
                <Clock className="h-3 w-3 mr-1" /> Drafts ({stats.drafts})
              </TabsTrigger>
              <TabsTrigger value="sent" className="font-mono text-[10px] uppercase tracking-wider data-[state=active]:bg-accent/20 data-[state=active]:text-accent px-3 py-1.5" data-testid="tab-filter-sent">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Sent ({stats.sent})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 bg-card/50 border-border/50 text-sm"
              data-testid="input-search-campaigns"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}</div>
        ) : filteredCampaigns.length > 0 ? (
          <div className="space-y-3">
            {filteredCampaigns.map((c: any) => {
              const deliveryRate = c.recipientCount > 0 ? Math.round(((c.sentCount || 0) / c.recipientCount) * 100) : 0;
              const statusConfig: Record<string, { color: string; bgColor: string; icon: LucideIcon; label: string }> = {
                draft: { color: "text-chart-4", bgColor: "bg-chart-4/10 border-chart-4/20", icon: Clock, label: "Draft" },
                sending: { color: "text-chart-1", bgColor: "bg-chart-1/10 border-chart-1/20", icon: Zap, label: "Sending" },
                sent: { color: "text-accent", bgColor: "bg-accent/10 border-accent/20", icon: CheckCircle2, label: "Delivered" },
                failed: { color: "text-destructive", bgColor: "bg-destructive/10 border-destructive/20", icon: AlertCircle, label: "Failed" },
              };
              const st = statusConfig[c.status] || statusConfig.draft;
              const StatusIcon = st.icon;

              return (
                <Card
                  key={c.id}
                  className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer group hover:shadow-md"
                  onClick={() => openBuilder(c)}
                  data-testid={`campaign-card-${c.id}`}
                >
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className={cn("w-1 rounded-l-lg shrink-0", c.status === "draft" ? "bg-chart-4" : c.status === "sent" ? "bg-accent" : c.status === "sending" ? "bg-chart-1" : "bg-destructive")} />
                      <div className="flex-1 p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                            c.type === "email" ? "bg-chart-1/10 text-chart-1 border-chart-1/20" : "bg-chart-2/10 text-chart-2 border-chart-2/20"
                          )}>
                            {c.type === "email" ? <Mail className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold font-display truncate" data-testid={`text-campaign-name-${c.id}`}>{c.name}</h3>
                              <Badge variant="outline" className={cn("text-[10px] font-mono shrink-0 gap-1", st.bgColor, st.color)} data-testid={`badge-campaign-status-${c.id}`}>
                                <StatusIcon className="h-2.5 w-2.5" />
                                {st.label}
                              </Badge>
                            </div>
                            {c.companyId && (
                              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {(companies || []).find((co: any) => co.id === c.companyId)?.name || "Unknown"}
                              </p>
                            )}
                            {c.subject && (
                              <p className="text-xs text-muted-foreground mb-2 truncate" data-testid={`text-campaign-subject-${c.id}`}>
                                <span className="font-mono text-muted-foreground/50">Subject:</span> {c.subject}
                              </p>
                            )}
                            <div className="flex items-center gap-5 text-[11px] text-muted-foreground">
                              <span className="flex items-center gap-1.5" data-testid={`text-campaign-recipients-${c.id}`}>
                                <Users className="h-3 w-3" /> {c.recipientCount || 0} recipients
                              </span>
                              {(c.sentCount || 0) > 0 && (
                                <span className="flex items-center gap-1.5 text-accent" data-testid={`text-campaign-sent-${c.id}`}>
                                  <Send className="h-3 w-3" /> {c.sentCount} delivered
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" /> {new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>
                            {c.status === "sent" && c.recipientCount > 0 && (
                              <div className="mt-2.5 flex items-center gap-3">
                                <Progress value={deliveryRate} className="h-1.5 flex-1 max-w-48 bg-muted/30" />
                                <span className="text-[10px] font-mono text-accent">{deliveryRate}% delivered</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {c.status === "draft" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-[10px] font-mono uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10 gap-1"
                                  onClick={(e) => { e.stopPropagation(); openBuilder(c); }}
                                  data-testid={`button-edit-campaign-${c.id}`}
                                >
                                  <Pencil className="h-3 w-3" /> Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-[10px] font-mono uppercase tracking-wider border-accent/30 text-accent hover:bg-accent/10 gap-1"
                                  onClick={(e) => { e.stopPropagation(); handleSendCampaign(c.id); }}
                                  disabled={sendCampaign.isPending}
                                  data-testid={`button-send-campaign-${c.id}`}
                                >
                                  <Send className="h-3 w-3" /> Send
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id, c.name); }}
                                  data-testid={`button-delete-campaign-${c.id}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                            {c.status === "sent" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-[10px] font-mono uppercase tracking-wider gap-1"
                                onClick={(e) => { e.stopPropagation(); openBuilder(c); }}
                                data-testid={`button-view-campaign-${c.id}`}
                              >
                                <Eye className="h-3 w-3" /> View
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : campaigns.length > 0 ? (
          <Card className="glass-panel border-border/50">
            <CardContent className="py-10 text-center">
              <Search className="h-10 w-10 mx-auto text-muted-foreground/20 mb-3" />
              <h3 className="text-sm font-display font-semibold text-muted-foreground mb-1">No Matching Campaigns</h3>
              <p className="text-xs text-muted-foreground/70">Try adjusting your search or filter criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-panel border-border/50 border-dashed">
            <CardContent className="py-14 text-center">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <div className="absolute inset-0 bg-primary/10 rounded-2xl rotate-6" />
                <div className="absolute inset-0 bg-primary/5 rounded-2xl -rotate-3" />
                <div className="relative bg-card border border-border/50 rounded-2xl h-full flex items-center justify-center">
                  <Megaphone className="h-8 w-8 text-primary/60" />
                </div>
              </div>
              <h3 className="text-lg font-display font-bold text-foreground mb-2">Build Your First Campaign</h3>
              <p className="text-sm text-muted-foreground/70 max-w-md mx-auto mb-6">
                Use the drag-and-drop builder to create beautiful email campaigns with podcast art, product cards, merge tags, and more.
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button onClick={() => openBuilder()} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2" data-testid="button-create-first-campaign">
                  <Plus className="h-4 w-4" /> Create from Scratch
                </Button>
                <Button variant="outline" onClick={() => openFromTemplate(TEMPLATES[0])} className="gap-2 border-primary/30 text-primary hover:bg-primary/10" data-testid="button-use-newsletter-template">
                  <Sparkles className="h-4 w-4" /> Use Newsletter Template
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
