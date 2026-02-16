import TrendIndicator from "./TrendIndicator";

interface MetricItem {
  label: string;
  value: string | number;
  trend?: number;
  trendDirection?: "up" | "down";
}

interface MetricsStripProps {
  metrics: MetricItem[];
}

export default function MetricsStrip({ metrics }: MetricsStripProps) {
  const items = metrics.slice(0, 6);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="metrics-strip">
      {items.map((m, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-lg p-4 flex flex-col justify-between min-h-[90px]"
          data-testid={`metric-card-${i}`}
        >
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider truncate" data-testid={`text-metric-label-${i}`}>
            {m.label}
          </span>
          <div className="flex items-end justify-between mt-2">
            <span className="text-xl font-bold text-foreground" data-testid={`text-metric-value-${i}`}>
              {m.value}
            </span>
            {m.trend !== undefined && m.trendDirection && (
              <TrendIndicator value={m.trend} direction={m.trendDirection} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
