import type { ReactNode } from "react";

interface DataCardProps {
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
  className?: string;
}

export default function DataCard({ title, subtitle, actionLabel, onAction, children, className = "" }: DataCardProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-5 ${className}`} data-testid="data-card">
      {(title || actionLabel) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-bold text-foreground" data-testid="text-card-title">{title}</h3>}
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5" data-testid="text-card-subtitle">{subtitle}</p>}
          </div>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              data-testid="button-card-action"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
