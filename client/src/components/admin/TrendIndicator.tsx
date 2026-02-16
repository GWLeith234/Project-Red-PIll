import { ArrowUp, ArrowDown } from "lucide-react";

interface TrendIndicatorProps {
  value: number;
  direction: "up" | "down";
}

export default function TrendIndicator({ value, direction }: TrendIndicatorProps) {
  const isPositive = direction === "up";
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}
      data-testid={`trend-${direction}`}
    >
      {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}
