import TrendIndicator from "./TrendIndicator";

interface MetricItem {
  label: string;
  value: string | number;
  trend?: number;
  trendDirection?: "up" | "down";
  icon?: React.ReactNode;
}

interface MetricsStripProps {
  metrics: MetricItem[];
  columns?: 4 | 6;
}

export default function MetricsStrip({ metrics, columns = 6 }: MetricsStripProps) {
  const items = metrics.slice(0, columns);
  const gridClass = columns === 4
    ? "grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"
    : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6";
  return (
    <div className={gridClass} data-testid="metrics-strip">
      {items.map((m, i) => (
        <div
          key={i}
          className="bg-card border border-border rounded-md p-4 flex flex-col justify-between"
          style={{ minHeight: "80px" }}
          data-testid={`metric-card-${i}`}
        >
          <div className="flex items-center gap-1.5">
            {m.icon && <span className="text-muted-foreground">{m.icon}</span>}
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.05em] truncate" data-testid={`text-metric-label-${i}`}>
              {m.label}
            </span>
          </div>
          <div className="flex items-end justify-between mt-1">
            <span className="text-[28px] font-bold text-white leading-tight" data-testid={`text-metric-value-${i}`}>
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
