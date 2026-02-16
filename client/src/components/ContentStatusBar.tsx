import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  FileEdit,
  Eye,
  CheckCircle,
  Clock,
  Globe,
  XCircle,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export const CONTENT_STATUSES = [
  { value: "draft", label: "Draft", icon: FileEdit, color: "bg-muted text-muted-foreground" },
  { value: "in_review", label: "In Review", icon: Eye, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "approved", label: "Approved", icon: CheckCircle, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "scheduled", label: "Scheduled", icon: Clock, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "published", label: "Published", icon: Globe, color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "bg-red-500/20 text-red-400 border-red-500/30" },
] as const;

export const CONTENT_TYPES = [
  { value: "article", label: "Article" },
  { value: "social_post", label: "Social Post" },
  { value: "video_clip", label: "Video Clip" },
  { value: "newsletter", label: "Newsletter" },
  { value: "seo_asset", label: "SEO Asset" },
  { value: "transcript", label: "Transcript" },
] as const;

export const CONTENT_PRIORITIES = [
  { value: "low", label: "Low", color: "text-muted-foreground" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "high", label: "High", color: "text-orange-400" },
  { value: "urgent", label: "Urgent", color: "text-red-400" },
] as const;

export function getStatusConfig(status: string) {
  return CONTENT_STATUSES.find((s) => s.value === status) || CONTENT_STATUSES[0];
}

export function getPriorityConfig(priority: string) {
  return CONTENT_PRIORITIES.find((p) => p.value === priority) || CONTENT_PRIORITIES[1];
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  return (
    <Badge data-testid={`badge-status-${status}`} className={cn("gap-1 border", config.color, className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: { priority: string; className?: string }) {
  const config = getPriorityConfig(priority);
  return (
    <Badge data-testid={`badge-priority-${priority}`} variant="outline" className={cn(config.color, className)}>
      {config.label}
    </Badge>
  );
}

export function TypeBadge({ type, className }: { type: string; className?: string }) {
  const config = CONTENT_TYPES.find((t) => t.value === type);
  return (
    <Badge data-testid={`badge-type-${type}`} variant="secondary" className={className}>
      {config?.label || type}
    </Badge>
  );
}

interface ContentStatusBarProps {
  metrics: Record<string, number>;
  activeStatus: string | undefined;
  onStatusChange: (status: string | undefined) => void;
  className?: string;
}

export function ContentStatusBar({ metrics, activeStatus, onStatusChange, className }: ContentStatusBarProps) {
  return (
    <div data-testid="content-status-bar" className={cn("flex flex-wrap gap-2", className)}>
      <button
        data-testid="status-filter-all"
        onClick={() => onStatusChange(undefined)}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
          !activeStatus ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
        )}
      >
        <span className="font-medium">All</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{metrics.total || 0}</span>
      </button>
      {CONTENT_STATUSES.map((s) => {
        const Icon = s.icon;
        const isActive = activeStatus === s.value;
        return (
          <button
            key={s.value}
            data-testid={`status-filter-${s.value}`}
            onClick={() => onStatusChange(isActive ? undefined : s.value)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              isActive ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="font-medium">{s.label}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{metrics[s.value] || 0}</span>
          </button>
        );
      })}
      <button
        data-testid="status-filter-ai_generated"
        onClick={() => onStatusChange(activeStatus === "ai_generated" ? undefined : "ai_generated")}
        className={cn(
          "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
          activeStatus === "ai_generated" ? "border-purple-500 bg-purple-500/10 text-purple-400" : "border-border hover:bg-muted"
        )}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span className="font-medium">AI Generated</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{metrics.ai_generated || 0}</span>
      </button>
    </div>
  );
}
