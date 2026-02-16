import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mail, MessageSquare } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";
import DataCard from "@/components/admin/DataCard";
import EmptyState from "@/components/admin/EmptyState";
import PipelineBoard from "@/components/admin/PipelineBoard";

export default function Network() {
  const [tab, setTab] = useState<"audience" | "commercial">("audience");

  const { data } = useQuery({
    queryKey: ["/api/admin/page-metrics/network"],
    queryFn: async () => {
      const res = await fetch("/api/admin/page-metrics/network", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load network metrics");
      return res.json();
    },
  });

  const audienceMetrics = [
    { label: "New This Week", value: data?.audience?.newThisWeek ?? 0 },
    { label: "Total Subscribers", value: data?.audience?.total ?? 0 },
    { label: "Active Campaigns", value: data?.audience?.activeCampaigns ?? 0 },
    { label: "Campaign Status", value: "—" },
  ];

  const commercialMetrics = [
    { label: "New Leads", value: data?.commercial?.leads ?? 0 },
    { label: "Active Proposals", value: data?.commercial?.proposals ?? 0 },
    { label: "Pending Orders", value: data?.commercial?.pendingOrders ?? 0 },
    { label: "Revenue MTD", value: data?.commercial?.revenueMTD ?? "$0" },
    { label: "Pipeline Value", value: data?.commercial?.pipelineValue ?? "$0" },
  ];

  const subscribers = (data?.audience?.subscribers ?? []).map((s: any) => ({
    id: String(s.id ?? s.name),
    title: s.name,
    subtitle: s.email,
  }));

  const audienceColumns = [
    { title: "New Subscribers", color: "#3B82F6", items: subscribers },
    { title: "Engaged", color: "#8B5CF6", items: [] },
    { title: "Active", color: "#10B981", items: [] },
    { title: "At Risk", color: "#F59E0B", items: [] },
    { title: "Churned", color: "#EF4444", items: [] },
  ];

  const commercialColumns = [
    { title: "Leads", color: "#3B82F6", items: [] },
    { title: "Qualified", color: "#8B5CF6", items: [] },
    { title: "Proposal", color: "#F59E0B", items: [] },
    { title: "Negotiation", color: "#F97316", items: [] },
    { title: "Closed Won", color: "#10B981", items: [] },
    { title: "Closed Lost", color: "#EF4444", items: [] },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader pageKey="podcasts" />

      <div className="flex gap-2" data-testid="tab-toggle">
        <button
          onClick={() => setTab("audience")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "audience"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-audience"
        >
          Audience
        </button>
        <button
          onClick={() => setTab("commercial")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === "commercial"
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
          data-testid="tab-commercial"
        >
          Commercial
        </button>
      </div>

      {tab === "audience" && (
        <div className="space-y-6">
          <MetricsStrip metrics={audienceMetrics} />
          <PipelineBoard columns={audienceColumns} />
          <div className="grid gap-4 md:grid-cols-2">
            <DataCard title="Email Opens">
              <EmptyState icon={Mail} title="Email Analytics" description="Coming soon" />
            </DataCard>
            <DataCard title="SMS Opens">
              <EmptyState icon={MessageSquare} title="SMS Analytics" description="Coming soon" />
            </DataCard>
          </div>
        </div>
      )}

      {tab === "commercial" && (
        <div className="space-y-6">
          <MetricsStrip metrics={commercialMetrics} />
          <PipelineBoard columns={commercialColumns} />
          <div className="grid gap-4 md:grid-cols-2">
            <DataCard title="Email Opens">
              <EmptyState icon={Mail} title="Email Analytics" description="Coming soon" />
            </DataCard>
            <DataCard title="SMS Opens">
              <EmptyState icon={MessageSquare} title="SMS Analytics" description="Coming soon" />
            </DataCard>
          </div>
        </div>
      )}
    </div>
  );
}
