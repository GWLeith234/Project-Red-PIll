interface PipelineItem {
  id: string;
  title: string;
  subtitle?: string;
  value?: string;
}

interface PipelineColumn {
  title: string;
  color: string;
  items: PipelineItem[];
}

interface PipelineBoardProps {
  columns: PipelineColumn[];
}

export default function PipelineBoard({ columns }: PipelineBoardProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }} data-testid="pipeline-board">
      {columns.map((col, ci) => (
        <div key={ci} className="flex-shrink-0 w-56 min-w-[14rem]" data-testid={`pipeline-column-${ci}`}>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: col.color }} />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider truncate">{col.title}</span>
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0">
              {col.items.length}
            </span>
          </div>
          <div className="space-y-2">
            {col.items.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-border rounded-lg p-3 hover:border-primary/30 transition-colors"
                data-testid={`pipeline-card-${item.id}`}
              >
                <p className="text-sm font-medium text-foreground truncate" data-testid={`text-pipeline-title-${item.id}`}>{item.title}</p>
                {item.subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{item.subtitle}</p>}
                {item.value && (
                  <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {item.value}
                  </span>
                )}
              </div>
            ))}
            {col.items.length === 0 && (
              <div className="text-xs text-muted-foreground/50 text-center py-4 border border-dashed border-border rounded-lg">
                No items
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
