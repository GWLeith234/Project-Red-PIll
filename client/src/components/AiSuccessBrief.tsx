import { useState, useCallback, useRef, useEffect } from "react";
import { X, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiSuccessBriefProps {
  open: boolean;
  onClose: () => void;
}

export function AiSuccessBrief({ open, onClose }: AiSuccessBriefProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setContent("");
    setHasGenerated(true);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/ai-brief", {
        signal: abortRef.current.signal,
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to generate brief");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;

      while (!finished) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              finished = true;
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.error) {
                setError(parsed.error);
                finished = true;
                break;
              }
              if (parsed.content) {
                setContent(prev => prev + parsed.content);
              }
            } catch {}
          }
        }
      }

      reader.cancel();
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !hasGenerated) {
      generate();
    }
  }, [open, hasGenerated, generate]);

  useEffect(() => {
    if (!open) {
      setHasGenerated(false);
      setContent("");
      setError(null);
      abortRef.current?.abort();
    }
  }, [open]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" data-testid="ai-brief-overlay">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative w-full max-w-lg mx-4 rounded-xl border border-violet-500/30 bg-background/95 backdrop-blur-xl shadow-2xl shadow-violet-500/10",
        "animate-in fade-in zoom-in-95 duration-300"
      )}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-500/20 border border-violet-500/30">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground" data-testid="text-ai-brief-title">AI Success Brief</h2>
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Platform Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={generate}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
              data-testid="button-refresh-brief"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              data-testid="button-close-brief"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div ref={contentRef} className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {error ? (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3" data-testid="text-ai-brief-error">
              {error}
            </div>
          ) : content ? (
            <div className="space-y-2" data-testid="text-ai-brief-content">
              <BriefContent text={content} />
              {loading && <span className="inline-block w-1.5 h-4 bg-violet-400 animate-pulse ml-0.5 align-middle rounded-sm" />}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-400 animate-spin" />
                <Sparkles className="h-4 w-4 text-violet-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Analyzing platform metrics...</p>
            </div>
          ) : null}
        </div>

        <div className="px-5 py-3 border-t border-border/50">
          <p className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider text-center">
            Powered by AI &middot; Based on real-time platform data
          </p>
        </div>
      </div>
    </div>
  );
}

function InlineText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={key++} className="text-violet-300 font-semibold">{match[1]}</strong>);
    } else if (match[2]) {
      parts.push(<em key={key++}>{match[2]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}

function BriefContent({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <br key={i} />;

        if (trimmed.startsWith("# ")) {
          return <h2 key={i} className="text-base font-bold text-foreground mt-1 mb-1"><InlineText text={trimmed.slice(2)} /></h2>;
        }
        if (trimmed.startsWith("## ")) {
          return <h3 key={i} className="text-sm font-semibold text-foreground mt-2 mb-1"><InlineText text={trimmed.slice(3)} /></h3>;
        }
        if (trimmed.startsWith("### ")) {
          return <h4 key={i} className="text-sm font-semibold text-foreground mt-2 mb-1"><InlineText text={trimmed.slice(4)} /></h4>;
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 items-start text-sm text-muted-foreground leading-relaxed">
              <span className="text-violet-400 mt-0.5 shrink-0">&bull;</span>
              <span><InlineText text={trimmed.slice(2)} /></span>
            </div>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const match = trimmed.match(/^(\d+)\.\s(.*)/);
          if (match) {
            return (
              <div key={i} className="flex gap-2 items-start text-sm text-muted-foreground leading-relaxed">
                <span className="text-violet-400 font-mono text-xs mt-0.5 shrink-0">{match[1]}.</span>
                <span><InlineText text={match[2]} /></span>
              </div>
            );
          }
        }

        return <p key={i} className="text-sm text-muted-foreground leading-relaxed"><InlineText text={trimmed} /></p>;
      })}
    </>
  );
}
