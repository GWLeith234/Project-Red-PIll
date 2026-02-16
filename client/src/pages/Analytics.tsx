import { useQuery } from "@tanstack/react-query";
import { Globe, FileText, Heart } from "lucide-react";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";
import DataCard from "@/components/admin/DataCard";
import EmptyState from "@/components/admin/EmptyState";

export default function Analytics() {
  const { data } = useQuery({
    queryKey: ["/api/admin/page-metrics/analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/page-metrics/analytics", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load analytics metrics");
      return res.json();
    },
  });

  const metrics = [
    { label: "Total Pageviews", value: data?.metrics?.totalPageviews ?? "—" },
    { label: "Unique Visitors", value: data?.metrics?.uniqueVisitors ?? "—" },
    { label: "Avg. Session Duration", value: data?.metrics?.avgSessionDuration ?? "—" },
    { label: "Bounce Rate", value: data?.metrics?.bounceRate ?? "—" },
    { label: "Top Referrer", value: data?.metrics?.topReferrer ?? "—" },
    { label: "NPS Score", value: data?.metrics?.npsScore ?? "—" },
  ];

  return (
    <div className="space-y-6" data-testid="page-analytics">
      <PageHeader pageKey="analytics" />
      <MetricsStrip metrics={metrics} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataCard title="Website Analytics">
          <EmptyState icon={Globe} title="Website Analytics" description="Coming Soon" />
        </DataCard>
        <DataCard title="Content Performance">
          <EmptyState icon={FileText} title="Content Performance" description="Coming Soon" />
        </DataCard>
        <DataCard title="NPS & Satisfaction">
          <EmptyState icon={Heart} title="NPS & Satisfaction" description="Coming Soon" />
        </DataCard>
      </div>
    </div>
  );
}
