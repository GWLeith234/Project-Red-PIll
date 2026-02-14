import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useOutboundCampaigns, useCreateOutboundCampaign, useDeleteOutboundCampaign,
  useSendOutboundCampaign, useUpdateOutboundCampaign, useCompanies,
} from "@/lib/api";
import CampaignBuilderComponent, { CampaignBlock, serializeBlocks, deserializeBlocks } from "@/components/CampaignBuilder";
import {
  Plus, Send, Mail, MessageSquare, Users, Calendar, Trash2, ChevronRight,
  Building, ArrowLeft, Search, Pencil,
} from "lucide-react";

export default function CampaignBuilderPage() {
  const [, setLocation] = useLocation();
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

  const handleBuilderSave = async () => {
    if (!builderCampaignName.trim()) {
      toast({ title: "Name Required", description: "Please enter a campaign name.", variant: "destructive" });
      return;
    }
    const body = serializeBlocks(builderBlocks);
    try {
      if (builderEditingId) {
        await updateCampaign.mutateAsync({
          id: builderEditingId,
          name: builderCampaignName,
          subject: builderCampaignSubject,
          body,
        });
        toast({ title: "Campaign Updated" });
      } else {
        await createCampaign.mutateAsync({
          name: builderCampaignName,
          type: builderCampaignType,
          audience: "subscribers",
          subject: builderCampaignSubject,
          body,
          podcastFilter: null,
          companyId: null,
        });
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

  const filteredCampaigns = (campaignsList || []).filter((c: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (c.name || "").toLowerCase().includes(term) || (c.subject || "").toLowerCase().includes(term);
  });

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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground" data-testid="text-campaigns-title">Campaign Builder</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">
            {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? "s" : ""} | Drag-and-drop email builder
          </p>
        </div>
        <Button onClick={() => openBuilder()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-new-campaign">
          <Plus className="mr-2 h-3 w-3" />
          New Campaign
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-card/50 border-border/50"
            data-testid="input-search-campaigns"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : filteredCampaigns.length > 0 ? (
        <div className="space-y-3">
          {filteredCampaigns.map((c: any) => (
            <Card key={c.id} className="glass-panel border-border/50 hover:border-primary/20 transition-colors cursor-pointer" onClick={() => openBuilder(c)} data-testid={`campaign-card-${c.id}`}>
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
                    {c.companyId && (
                      <p className="text-xs text-muted-foreground mb-0.5 flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {(companies || []).find((co: any) => co.id === c.companyId)?.name || "Unknown Customer"}
                      </p>
                    )}
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
                          className="text-xs font-mono border-chart-1/30 text-chart-1 hover:bg-chart-1/10"
                          onClick={(e) => { e.stopPropagation(); openBuilder(c); }}
                          data-testid={`button-edit-campaign-${c.id}`}
                        >
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-mono border-primary/30 text-primary hover:bg-primary/10"
                          onClick={(e) => { e.stopPropagation(); handleSendCampaign(c.id); }}
                          disabled={sendCampaign.isPending}
                          data-testid={`button-send-campaign-${c.id}`}
                        >
                          <Send className="h-3 w-3 mr-1" /> Send
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.id, c.name); }}
                          data-testid={`button-delete-campaign-${c.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
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
            <p className="text-sm text-muted-foreground/70 mb-4">Create your first campaign with the drag-and-drop builder.</p>
            <Button onClick={() => openBuilder()} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-create-first-campaign">
              <Plus className="mr-2 h-4 w-4" /> Create First Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
