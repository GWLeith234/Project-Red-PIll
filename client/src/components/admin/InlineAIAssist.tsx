import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Wand2, Minimize2, Maximize2, Palette, Type, Search, Mail, X, Loader2 } from "lucide-react";

interface InlineAIAssistProps {
  value: string;
  onChange: (newValue: string) => void;
  fieldType?: "text" | "email" | "article" | "general";
}

const ACTIONS = [
  { key: "improve", label: "Improve writing", icon: Wand2, description: "Rewrite for clarity and engagement" },
  { key: "shorten", label: "Make shorter", icon: Minimize2, description: "Condense while preserving key points" },
  { key: "lengthen", label: "Make longer", icon: Maximize2, description: "Expand with supporting details" },
  { key: "headlines", label: "Generate headlines", icon: Type, description: "5 headline variations" },
  { key: "seo_keywords", label: "Add SEO keywords", icon: Search, description: "Suggest keyword insertions" },
];

const TONES = ["professional", "conversational", "urgent", "persuasive", "authoritative"];

export default function InlineAIAssist({ value, onChange, fieldType = "general" }: InlineAIAssistProps) {
  const [open, setOpen] = useState(false);
  const [showTones, setShowTones] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const actions = [...ACTIONS];
  if (fieldType === "email") {
    actions.push({ key: "subject_lines", label: "Write subject lines", icon: Mail, description: "5 subject line options" });
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowTones(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const assistMutation = useMutation({
    mutationFn: async ({ action, options }: { action: string; options?: any }) => {
      const res = await fetch("/api/ai/inline-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action, text: value, options }),
      });
      if (!res.ok) throw new Error("AI assist failed");
      return res.json();
    },
    onSuccess: (data, variables) => {
      if (["improve", "shorten", "lengthen", "change_tone"].includes(variables.action)) {
        onChange(data.result);
      } else {
        onChange(value + "\n\n---\nAI Suggestions:\n" + data.result);
      }
      setOpen(false);
      setShowTones(false);
    },
  });

  if (!value || value.trim().length < 10) return null;

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-600/20 border border-purple-500/30 text-purple-400 hover:bg-purple-600/30 transition-colors"
        title="AI Assist"
        data-testid="button-inline-ai"
      >
        <Sparkles className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden" data-testid="inline-ai-popover">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border">
            <span className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" /> AI Assist
            </span>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {assistMutation.isPending ? (
            <div className="flex items-center justify-center py-8 gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              Processing...
            </div>
          ) : (
            <div className="py-1">
              {actions.map(action => (
                <button
                  key={action.key}
                  onClick={() => assistMutation.mutate({ action: action.key })}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                  data-testid={`ai-action-${action.key}`}
                >
                  <action.icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-foreground">{action.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{action.description}</div>
                  </div>
                </button>
              ))}

              <div className="border-t border-border mt-1 pt-1">
                <button
                  onClick={() => setShowTones(!showTones)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                  data-testid="ai-action-tone"
                >
                  <Palette className="w-3.5 h-3.5 text-muted-foreground" />
                  <div className="text-xs font-medium text-foreground">Change tone to...</div>
                </button>
                {showTones && (
                  <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                    {TONES.map(tone => (
                      <button
                        key={tone}
                        onClick={() => assistMutation.mutate({ action: "change_tone", options: { tone } })}
                        className="px-2 py-1 text-[10px] bg-muted/50 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
                        data-testid={`tone-${tone}`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
