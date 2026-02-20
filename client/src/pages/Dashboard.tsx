import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Factory, Users, BarChart3, Heart, ArrowRight } from "lucide-react";
import LiveActivityFeed from "@/components/admin/LiveActivityFeed";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";
import DataCard from "@/components/admin/DataCard";
import { AiSuccessBrief } from "@/components/AiSuccessBrief";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [showAiBrief, setShowAiBrief] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/admin/page-metrics/dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/page-metrics/dashboard", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load dashboard metrics");
      return res.json();
    },
  });

  const metrics = data?.metrics
    ? [
        { label: "Total Subscribers", value: data.metrics.totalSubscribers },
        { label: "Active Users Today", value: data.metrics.activeUsersToday },
        { label: "Published This Week", value: data.metrics.publishedThisWeek },
        { label: "Revenue MTD", value: data.metrics.revenueMTD },
        { label: "Push Delivery Rate", value: data.metrics.pushDeliveryRate },
        { label: "Avg. Session Duration", value: data.metrics.avgSessionDuration },
      ]
    : [];

  const quickAccess = data?.quickAccess;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500" data-testid="dashboard-page">
      <PageHeader pageKey="dashboard" onAIAction={() => setShowAiBrief(true)} onPrimaryAction={() => {}} primaryActionOverride="+ New Content" />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="metrics-skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[90px] rounded-lg" />
          ))}
        </div>
      ) : (
        <MetricsStrip metrics={metrics} />
      )}

      <DataCard title="Live Activity Feed" data-testid="card-activity-feed">
        <LiveActivityFeed />
      </DataCard>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="quick-access-skeleton">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="quick-access-grid">
          <Link href="/content" data-testid="link-content-factory">
            <DataCard title="Content Factory">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Factory className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold" data-testid="text-article-count">{quickAccess?.articleCount ?? 0} articles</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </DataCard>
          </Link>

          <Link href="/network" data-testid="link-network">
            <DataCard title="Network">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold" data-testid="text-subscriber-count">{quickAccess?.subscriberCount ?? 0} subscribers</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </DataCard>
          </Link>

          <Link href="/analytics" data-testid="link-analytics">
            <DataCard title="Analytics">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold text-muted-foreground" data-testid="text-analytics-status">Coming Soon</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </DataCard>
          </Link>

          <Link href="/community" data-testid="link-community">
            <DataCard title="Community">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold" data-testid="text-community-count">
                    {quickAccess?.eventsCount ?? 0} events + {quickAccess?.pollsCount ?? 0} polls
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </DataCard>
          </Link>
        </div>
      )}

      <AiSuccessBrief open={showAiBrief} onClose={() => setShowAiBrief(false)} />
    </div>
  );
}
