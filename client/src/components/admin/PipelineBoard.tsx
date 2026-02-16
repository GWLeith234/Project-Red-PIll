import { useState, useRef, useCallback } from "react";
import { GripVertical } from "lucide-react";

export interface PipelineItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string | number;
  aiScore?: number | null;
  daysInStage?: number;
  stage?: string;
  meta?: Record<string, any>;
}

export interface PipelineColumn {
  key: string;
  title: string;
  color: string;
  items: PipelineItem[];
}

interface PipelineBoardProps {
  columns: PipelineColumn[];
  onDrop?: (itemId: string, fromStage: string, toStage: string) => void;
  draggable?: boolean;
  onCardClick?: (item: PipelineItem) => void;
}

function formatCurrency(value: string | number | undefined): string {
  if (!value) return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (score >= 40) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
}

export default function PipelineBoard({ columns, onDrop, draggable = false, onCardClick }: PipelineBoardProps) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragItemRef = useRef<{ id: string; fromStage: string } | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, itemId: string, fromStage: string) => {
    dragItemRef.current = { id: itemId, fromStage };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
    (e.currentTarget as HTMLElement).classList.add("opacity-50");
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove("opacity-50");
    setDragOverCol(null);
    dragItemRef.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverCol(colKey);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverCol(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toStage: string) => {
    e.preventDefault();
    setDragOverCol(null);
    if (dragItemRef.current && dragItemRef.current.fromStage !== toStage && onDrop) {
      onDrop(dragItemRef.current.id, dragItemRef.current.fromStage, toStage);
    }
    dragItemRef.current = null;
  }, [onDrop]);

  const totalValue = columns.reduce((sum, col) => {
    return sum + col.items.reduce((s, item) => {
      const v = typeof item.value === "number" ? item.value : parseFloat(String(item.value || "0"));
      return s + (isNaN(v) ? 0 : v);
    }, 0);
  }, 0);

  return (
    <div data-testid="pipeline-board">
      {totalValue > 0 && (
        <div className="mb-3 text-xs text-muted-foreground">
          Total Pipeline: <span className="font-semibold text-foreground">{formatCurrency(totalValue)}</span>
        </div>
      )}
      <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
        {columns.map((col) => {
          const colValue = col.items.reduce((s, item) => {
            const v = typeof item.value === "number" ? item.value : parseFloat(String(item.value || "0"));
            return s + (isNaN(v) ? 0 : v);
          }, 0);

          return (
            <div
              key={col.key}
              className={`flex-shrink-0 w-56 min-w-[14rem] transition-colors rounded-lg ${
                dragOverCol === col.key ? "bg-primary/5 ring-1 ring-primary/30" : ""
              }`}
              onDragOver={draggable ? (e) => handleDragOver(e, col.key) : undefined}
              onDragLeave={draggable ? handleDragLeave : undefined}
              onDrop={draggable ? (e) => handleDrop(e, col.key) : undefined}
              data-testid={`pipeline-column-${col.key}`}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider truncate">{col.title}</span>
                <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
                  {col.items.length}
                </span>
              </div>
              {colValue > 0 && (
                <div className="text-[10px] text-muted-foreground px-1 mb-2 font-mono">
                  {formatCurrency(colValue)}
                </div>
              )}
              <div className="space-y-2 min-h-[60px]">
                {col.items.map((item) => (
                  <div
                    key={item.id}
                    draggable={draggable}
                    onDragStart={draggable ? (e) => handleDragStart(e, item.id, col.key) : undefined}
                    onDragEnd={draggable ? handleDragEnd : undefined}
                    onClick={() => onCardClick?.(item)}
                    className={`bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors ${
                      draggable ? "cursor-grab active:cursor-grabbing" : ""
                    } ${onCardClick ? "cursor-pointer" : ""}`}
                    data-testid={`pipeline-card-${item.id}`}
                  >
                    <div className="flex items-start gap-1.5">
                      {draggable && (
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate" data-testid={`text-pipeline-title-${item.id}`}>
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {item.value !== undefined && item.value !== null && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {typeof item.value === "number" ? formatCurrency(item.value) : item.value}
                        </span>
                      )}
                      {item.aiScore !== undefined && item.aiScore !== null && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getScoreColor(item.aiScore)}`}
                          data-testid={`ai-score-${item.id}`}
                        >
                          AI: {item.aiScore}
                        </span>
                      )}
                      {item.daysInStage !== undefined && item.daysInStage > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {item.daysInStage}d
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {col.items.length === 0 && (
                  <div className={`text-xs text-muted-foreground/50 text-center py-6 border border-dashed rounded-lg ${
                    dragOverCol === col.key ? "border-primary/40 bg-primary/5" : "border-border"
                  }`}>
                    {draggable ? "Drop here" : "No items"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
