import { Sparkles, Loader2 } from "lucide-react";

interface AIActionButtonProps {
  label: string;
  onClick: () => void;
  isLoading?: boolean;
  className?: string;
}

export default function AIActionButton({ label, onClick, isLoading = false, className = "" }: AIActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-[14px] font-medium text-white transition-all disabled:opacity-70 h-9 ${className}`}
      style={{ backgroundColor: "#6C3FC5" }}
      onMouseEnter={(e) => { if (!isLoading) (e.currentTarget.style.backgroundColor = "#5A32A8"); }}
      onMouseLeave={(e) => { (e.currentTarget.style.backgroundColor = "#6C3FC5"); }}
      data-testid="button-ai-action"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
      {label}
    </button>
  );
}
