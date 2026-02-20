import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail, MessageSquare, Plus, RotateCcw, Users, TrendingUp, DollarSign, BarChart3, X, Brain } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";
import DataCard from "@/components/admin/DataCard";
import EmptyState from "@/components/admin/EmptyState";
import PipelineBoard, { type PipelineColumn, type PipelineItem } from "@/components/admin/PipelineBoard";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend } from "recharts";

type Tab = "audience" | "commercial";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local[0]}${"*".repeat(Math.max(1, local.length - 2))}${local[local.length - 1]}@${domain}`;
}

function daysSince(date: string | Date | null | undefined): number {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

interface AddLeadFormData {
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  source: string;
  pipelineType: string;
  estimatedValue: string;
  notes: string;
}

function AddLeadModal({ onClose, onSubmit, isSubmitting }: { onClose: () => void; onSubmit: (data: AddLeadFormData) => void; isSubmitting: boolean }) {
  const [form, setForm] = useState<AddLeadFormData>({
    companyName: "", contactName: "", contactEmail: "", contactPhone: "",
    source: "inbound", pipelineType: "new_logo", estimatedValue: "", notes: "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60" onClick={onClose} data-testid="add-lead-modal">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Add New Lead</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="close-modal"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Company Name *</label>
            <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" data-testid="input-company-name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Contact Name</label>
              <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" data-testid="input-contact-name" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <input value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" data-testid="input-contact-email" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Phone</label>
              <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" data-testid="input-contact-phone" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Estimated Value ($)</label>
              <input value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} type="number" className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" data-testid="input-estimated-value" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Source</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" data-testid="select-source">
                <option value="inbound">Inbound</option>
                <option value="referral">Referral</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="ai_generated">AI Generated</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pipeline Type</label>
              <select value={form.pipelineType} onChange={(e) => setForm({ ...form, pipelineType: e.target.value })} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground" data-testid="select-pipeline-type">
                <option value="new_logo">New Business</option>
                <option value="existing_client">Existing Client</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground resize-none" data-testid="input-notes" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground" data-testid="button-cancel">Cancel</button>
            <button onClick={() => onSubmit(form)} disabled={!form.companyName || isSubmitting} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50" data-testid="button-submit-lead">
              {isSubmitting ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AISuggestModal({ onClose }: { onClose: () => void }) {
  const [aiTab, setAiTab] = useState<"scoring" | "upsells" | "churn">("scoring");
  const scoreMutation = useMutation({
    mutationFn: () => fetch("/api/crm/ai/score-leads", { method: "POST", credentials: "include" }).then(r => r.json()),
  });
  const upsellMutation = useMutation({
    mutationFn: () => fetch("/api/crm/ai/suggest-upsells", { method: "POST", credentials: "include" }).then(r => r.json()),
  });
  const churnMutation = useMutation({
    mutationFn: () => fetch("/api/crm/ai/predict-churn", { method: "POST", credentials: "include" }).then(r => r.json()),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60" onClick={onClose} data-testid="ai-suggest-modal">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-semibold text-foreground">AI Sales Intelligence</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground" data-testid="close-ai-modal"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex gap-2 mb-4">
          {(["scoring", "upsells", "churn"] as const).map((t) => (
            <button key={t} onClick={() => setAiTab(t)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${aiTab === t ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-muted-foreground hover:text-foreground"}`} data-testid={`ai-tab-${t}`}>
              {t === "scoring" ? "Lead Scoring" : t === "upsells" ? "Upsell Opportunities" : "Churn Predictions"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {aiTab === "scoring" && (
            <div className="space-y-3">
              <button onClick={() => scoreMutation.mutate()} disabled={scoreMutation.isPending} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50" data-testid="button-rescore">
                {scoreMutation.isPending ? "Scoring..." : "Rescore All Leads"}
              </button>
              {scoreMutation.data && Array.isArray(scoreMutation.data) && scoreMutation.data.map((s: any, i: number) => (
                <div key={i} className="bg-background border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{s.leadId?.substring(0, 8)}...</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${s.score >= 70 ? "bg-green-500/20 text-green-400 border-green-500/30" : s.score >= 40 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                      {s.score}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.reasoning}</p>
                </div>
              ))}
            </div>
          )}
          {aiTab === "upsells" && (
            <div className="space-y-3">
              <button onClick={() => upsellMutation.mutate()} disabled={upsellMutation.isPending} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50" data-testid="button-upsells">
                {upsellMutation.isPending ? "Analyzing..." : "Find Upsell Opportunities"}
              </button>
              {upsellMutation.data && Array.isArray(upsellMutation.data) && upsellMutation.data.map((u: any, i: number) => (
                <div key={i} className="bg-background border border-border rounded-lg p-3">
                  <p className="text-sm font-medium text-foreground">{u.opportunity}</p>
                  <p className="text-xs text-muted-foreground mt-1">{u.suggestedAction}</p>
                  {u.estimatedAdditionalRevenue > 0 && (
                    <span className="inline-block mt-2 text-xs font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      +${u.estimatedAdditionalRevenue?.toLocaleString()}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
          {aiTab === "churn" && (
            <div className="space-y-3">
              <button onClick={() => churnMutation.mutate()} disabled={churnMutation.isPending} className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50" data-testid="button-churn">
                {churnMutation.isPending ? "Predicting..." : "Predict Churn Risk"}
              </button>
              {churnMutation.data && Array.isArray(churnMutation.data) && churnMutation.data.map((c: any, i: number) => (
                <div key={i} className="bg-background border border-border rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono px-2 py-0.5 rounded-full border ${c.churnRisk === "high" ? "bg-red-500/20 text-red-400 border-red-500/30" : c.churnRisk === "medium" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}`}>
                      {c.churnRisk}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.reasoning}</p>
                  <p className="text-xs text-primary mt-1">Action: {c.retentionAction}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Network() {
  const [tab, setTab] = useState<Tab>("commercial");
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAiSuggest, setShowAiSuggest] = useState(false);
  const queryClient = useQueryClient();

  const STAGE_MAP: Record<string, { title: string; color: string }> = {
    lead: { title: "Leads", color: "#3B82F6" },
    qualified: { title: "Qualified", color: "#8B5CF6" },
    proposal: { title: "Proposal", color: "#F59E0B" },
    negotiation: { title: "Negotiation", color: "#F97316" },
    closed_won: { title: "Closed Won", color: "#10B981" },
    closed_lost: { title: "Closed Lost", color: "#EF4444" },
  };

  const ENGAGEMENT_MAP: Record<string, { title: string; color: string }> = {
    new: { title: "New", color: "#3B82F6" },
    engaged: { title: "Engaged", color: "#8B5CF6" },
    active: { title: "Active", color: "#10B981" },
    at_risk: { title: "At Risk", color: "#F59E0B" },
    churned: { title: "Churned", color: "#EF4444" },
  };

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/leads"],
    queryFn: () => fetch("/api/crm/leads", { credentials: "include" }).then(r => r.json()),
  });

  const { data: subscribers = [] } = useQuery<any[]>({
    queryKey: ["/api/subscribers"],
    queryFn: () => fetch("/api/subscribers", { credentials: "include" }).then(r => r.json()).catch(() => []),
  });

  const { data: revenueByProduct = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/revenue/by-product"],
    queryFn: () => fetch("/api/crm/revenue/by-product", { credentials: "include" }).then(r => r.json()).catch(() => []),
    enabled: tab === "commercial",
  });

  const { data: revenueByRep = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/revenue/by-rep"],
    queryFn: () => fetch("/api/crm/revenue/by-rep", { credentials: "include" }).then(r => r.json()).catch(() => []),
    enabled: tab === "commercial",
  });

  const { data: pipelineValue } = useQuery<Record<string, { count: number; value: number }>>({
    queryKey: ["/api/crm/revenue/pipeline-value"],
    queryFn: () => fetch("/api/crm/revenue/pipeline-value", { credentials: "include" }).then(r => r.json()).catch(() => ({})),
    enabled: tab === "commercial",
  });

  const { data: monthlyRevenue = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/revenue/monthly"],
    queryFn: () => fetch("/api/crm/revenue/monthly", { credentials: "include" }).then(r => r.json()).catch(() => []),
    enabled: tab === "commercial",
  });

  const { data: pendingPrompts = [] } = useQuery<any[]>({
    queryKey: ["/api/crm/ai/pending-prompts"],
    queryFn: () => fetch("/api/crm/ai/pending-prompts", { credentials: "include" }).then(r => r.json()).catch(() => []),
  });

  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      fetch(`/api/crm/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ pipelineStage: stage }) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] }),
  });

  const addLeadMutation = useMutation({
    mutationFn: (data: AddLeadFormData) =>
      fetch("/api/crm/leads", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ ...data, estimatedValue: parseFloat(data.estimatedValue) || 0 }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/crm/leads"] }); setShowAddLead(false); },
  });

  const resegmentMutation = useMutation({
    mutationFn: () => fetch("/api/crm/audience/resegment", { method: "POST", credentials: "include" }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] }),
  });

  const newLogoLeads = leads.filter((l: any) => l.pipelineType === "new_logo" || !l.pipelineType);
  const existingLeads = leads.filter((l: any) => l.pipelineType === "existing_client");

  function buildLeadColumns(leadsSubset: any[]): PipelineColumn[] {
    return Object.entries(STAGE_MAP).map(([key, { title, color }]) => ({
      key,
      title,
      color,
      items: leadsSubset.filter((l: any) => (l.pipelineStage || "lead") === key).map((l: any): PipelineItem => ({
        id: l.id,
        title: l.companyName,
        subtitle: l.contactName || l.contactEmail || "",
        value: l.estimatedValue || 0,
        aiScore: l.aiScore,
        daysInStage: daysSince(l.updatedAt),
        stage: l.pipelineStage,
      })),
    }));
  }

  function buildAudienceColumns(): PipelineColumn[] {
    return Object.entries(ENGAGEMENT_MAP).map(([key, { title, color }]) => ({
      key,
      title,
      color,
      items: subscribers.filter((s: any) => (s.engagementStage || "new") === key).map((s: any): PipelineItem => ({
        id: s.id,
        title: maskEmail(s.email),
        subtitle: `Opens: ${s.emailsOpenedCount || 0} | Visits: ${s.visitCount || 0}`,
        value: undefined,
        daysInStage: daysSince(s.updatedAt),
      })),
    }));
  }

  const handlePipelineDrop = (itemId: string, _fromStage: string, toStage: string) => {
    updateStageMutation.mutate({ id: itemId, stage: toStage });
  };

  const totalLeads = leads.length;
  const totalPipelineValue = leads.reduce((s: number, l: any) => s + (l.estimatedValue || 0), 0);
  const closedWonValue = leads.filter((l: any) => l.pipelineStage === "closed_won").reduce((s: number, l: any) => s + (l.estimatedValue || 0), 0);

  const audienceMetrics = [
    { label: "TOTAL SUBSCRIBERS", value: subscribers.length },
    { label: "NEW", value: subscribers.filter((s: any) => s.engagementStage === "new").length },
    { label: "ENGAGED", value: subscribers.filter((s: any) => s.engagementStage === "engaged").length },
    { label: "AT RISK", value: subscribers.filter((s: any) => s.engagementStage === "at_risk").length },
    { label: "CHURNED", value: subscribers.filter((s: any) => s.engagementStage === "churned").length },
    { label: "AVG ENGAGEMENT", value: "—" },
  ];

  const commercialMetrics = [
    { label: "TOTAL LEADS", value: totalLeads },
    { label: "PIPELINE VALUE", value: `$${Math.round(totalPipelineValue).toLocaleString()}` },
    { label: "CLOSED WON", value: `$${Math.round(closedWonValue).toLocaleString()}` },
    { label: "PENDING AI PROMPTS", value: pendingPrompts.length },
    { label: "NEW THIS WEEK", value: "N/A" },
    { label: "AVG DEAL SIZE", value: "—" },
  ];

  const pipelineChartData = pipelineValue ? Object.entries(STAGE_MAP).map(([key, { title }]) => ({
    stage: title,
    value: pipelineValue[key]?.value || 0,
    count: pipelineValue[key]?.count || 0,
  })) : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader pageKey="network" onAIAction={() => {}} aiActionOverride="AI Suggest" onPrimaryAction={() => setShowAddLead(true)} primaryActionOverride="+ Add Lead" />

      <MetricsStrip metrics={tab === "commercial" ? commercialMetrics : audienceMetrics} />

      <div className="flex items-center gap-1 border-b border-border" data-testid="tab-toggle">
        <button onClick={() => setTab("audience")} className={`flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-medium transition-all border-b-2 -mb-px ${tab === "audience" ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`} data-testid="tab-audience">
          <Users className="w-4 h-4" />Audience
        </button>
        <button onClick={() => setTab("commercial")} className={`flex items-center gap-1.5 px-4 py-2.5 text-[14px] font-medium transition-all border-b-2 -mb-px ${tab === "commercial" ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"}`} data-testid="tab-commercial">
          <DollarSign className="w-4 h-4" />Commercial
        </button>
      </div>

      {tab === "audience" && (
        <div className="space-y-6">
          {resegmentMutation.data && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-xs text-green-400" data-testid="resegment-result">
              Segmentation complete: {resegmentMutation.data.total} subscribers classified — {resegmentMutation.data.new} new, {resegmentMutation.data.engaged} engaged, {resegmentMutation.data.active} active, {resegmentMutation.data.atRisk} at risk, {resegmentMutation.data.churned} churned
            </div>
          )}
          <DataCard title="Audience Engagement Pipeline">
            <PipelineBoard columns={buildAudienceColumns()} draggable={false} />
          </DataCard>
          <div className="grid gap-4 md:grid-cols-2">
            <DataCard title="Email Opens & CTR">
              <div className="text-center py-6">
                <div className="text-3xl font-bold text-foreground">{subscribers.reduce((s: number, sub: any) => s + (sub.emailsOpenedCount || 0), 0)}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Email Opens</div>
              </div>
            </DataCard>
            <DataCard title="SMS Engagement">
              <div className="text-center py-6">
                <div className="text-3xl font-bold text-foreground">{subscribers.reduce((s: number, sub: any) => s + (sub.pushClickedCount || 0), 0)}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Push Clicks</div>
              </div>
            </DataCard>
          </div>
        </div>
      )}

      {tab === "commercial" && (
        <div className="space-y-6">
          <DataCard title="New Business Pipeline">
            <PipelineBoard columns={buildLeadColumns(newLogoLeads)} draggable onDrop={handlePipelineDrop} />
          </DataCard>

          <DataCard title="Existing Clients Pipeline">
            <PipelineBoard columns={buildLeadColumns(existingLeads)} draggable onDrop={handlePipelineDrop} />
          </DataCard>

          <div className="grid gap-4 md:grid-cols-2">
            <DataCard title="Revenue by Product">
              {revenueByProduct.length > 0 ? (
                <div className="space-y-2">
                  {revenueByProduct.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <span className="text-sm text-foreground">{r.product}</span>
                      <span className="text-sm font-mono text-primary">${r.revenue?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={TrendingUp} title="No Revenue Data" description="Close deals to see revenue breakdown" />
              )}
            </DataCard>

            <DataCard title="Revenue by Rep">
              {revenueByRep.length > 0 ? (
                <div className="space-y-2">
                  {revenueByRep.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <span className="text-sm text-foreground">{r.rep}</span>
                      <span className="text-sm font-mono text-primary">${r.revenue?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Users} title="No Rep Data" description="Assign leads to see rep performance" />
              )}
            </DataCard>
          </div>

          {(pipelineChartData.length > 0 || monthlyRevenue.length > 0) && (
            <DataCard title="Pipeline vs Revenue">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={pipelineChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="stage" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                    <Legend />
                    <Bar dataKey="value" fill="hsl(var(--primary))" name="Pipeline Value ($)" radius={[4, 4, 0, 0]} />
                    <Line dataKey="count" stroke="#10B981" name="Deal Count" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </DataCard>
          )}

          {pendingPrompts.length > 0 && (
            <DataCard title={`Pending AI Advertiser Prompts (${pendingPrompts.length})`}>
              <div className="space-y-3">
                {pendingPrompts.map((p: any) => (
                  <div key={p.id} className="bg-background border border-border rounded-lg p-3">
                    <p className="text-sm text-foreground">{p.promptMessage}</p>
                    {p.suggestedIncrease > 0 && (
                      <span className="inline-block mt-2 text-xs font-mono px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                        Suggested increase: ${p.suggestedIncrease?.toLocaleString()}
                      </span>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700" data-testid={`approve-prompt-${p.id}`}>Approve</button>
                      <button className="px-3 py-1 text-xs bg-muted text-muted-foreground rounded hover:bg-muted/80" data-testid={`dismiss-prompt-${p.id}`}>Dismiss</button>
                    </div>
                  </div>
                ))}
              </div>
            </DataCard>
          )}
        </div>
      )}

      {showAddLead && (
        <AddLeadModal
          onClose={() => setShowAddLead(false)}
          onSubmit={(data) => addLeadMutation.mutate(data)}
          isSubmitting={addLeadMutation.isPending}
        />
      )}
      {showAiSuggest && <AISuggestModal onClose={() => setShowAiSuggest(false)} />}
    </div>
  );
}
