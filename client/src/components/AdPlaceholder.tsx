export function AdPlaceholder({ width, height, label, className }: { width: number; height: number; label: string; className?: string }) {
  return (
    <div
      className={`bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 overflow-hidden ${className || ""}`}
      style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
      data-testid={`ad-slot-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-300 mb-1">Advertisement</span>
      <span className="text-xs font-mono font-medium text-gray-400">{width}×{height}</span>
      <span className="text-[10px] text-gray-300 mt-0.5">{label}</span>
    </div>
  );
}
