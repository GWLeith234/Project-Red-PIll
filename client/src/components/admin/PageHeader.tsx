import { useQuery } from "@tanstack/react-query";
import * as LucideIcons from "lucide-react";
import { Sparkles, Loader2 } from "lucide-react";
import AIActionButton from "./AIActionButton";
import { useBranding } from "@/lib/api";

interface PageHeaderProps {
  pageKey: string;
  onPrimaryAction?: () => void;
  onAIAction?: () => void;
  primaryActionOverride?: string;
  aiActionOverride?: string;
  isAILoading?: boolean;
}

function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  const Icon = (LucideIcons as any)[name];
  if (!Icon) return null;
  return <Icon className={className} style={style} />;
}

export default function PageHeader({
  pageKey,
  onPrimaryAction,
  onAIAction,
  primaryActionOverride,
  aiActionOverride,
  isAILoading = false,
}: PageHeaderProps) {
  const { data: configs } = useQuery({
    queryKey: ["/api/admin/page-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/page-config", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load page config");
      return res.json();
    },
  });

  const { data: brandingData } = useBranding();
  const primaryColor = brandingData?.primaryColor || "#E5C100";

  const config = configs?.find((c: any) => c.pageKey === pageKey);
  if (!config) return null;

  const primaryLabel = primaryActionOverride || config.primaryActionLabel;
  const aiLabel = aiActionOverride || config.aiActionLabel;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6" data-testid="page-header">
      <div className="flex items-center gap-3" data-testid="page-header-left">
        <div className="relative group">
          <DynamicIcon
            name={config.iconName}
            className="h-7 w-7"
            style={{ color: primaryColor }}
          />
          {config.description && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-1.5 text-xs text-white bg-gray-900 border border-gray-700 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
              {config.description}
              <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-px border-4 border-transparent border-t-gray-900" />
            </div>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight" data-testid="text-page-title">
          {config.title}
        </h1>
      </div>
      <div className="flex items-center gap-2" data-testid="page-header-actions">
        {aiLabel && onAIAction && (
          <AIActionButton label={aiLabel} onClick={onAIAction} isLoading={isAILoading} />
        )}
        {primaryLabel && onPrimaryAction && (
          <button
            onClick={onPrimaryAction}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}
            data-testid="button-primary-action"
          >
            {primaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
