import { useState } from "react";
import { useSubmitNps, useMyNpsSurveys } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { MessageSquareHeart, X, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NPS_CATEGORIES } from "@shared/schema";

function getCategoryLabel(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

export function NpsFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [category, setCategory] = useState("general");
  const [submitted, setSubmitted] = useState(false);
  const submitNps = useSubmitNps();
  const { data: myResponses } = useMyNpsSurveys();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (score === null) return;
    try {
      await submitNps.mutateAsync({
        score,
        feedback: feedback.trim() || undefined,
        category,
      });
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setScore(null);
        setFeedback("");
        setCategory("general");
      }, 2000);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const getScoreLabel = (s: number) => {
    if (s <= 6) return "Detractor";
    if (s <= 8) return "Passive";
    return "Promoter";
  };

  const getScoreColor = (s: number) => {
    if (s <= 6) return "bg-red-500 border-red-400";
    if (s <= 8) return "bg-amber-500 border-amber-400";
    return "bg-emerald-500 border-emerald-400";
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-50 h-12 w-12 rounded-full bg-primary/30 text-primary shadow-md hover:bg-primary/50 transition-all flex items-center justify-center group backdrop-blur-sm"
        data-testid="button-nps-trigger"
      >
        <MessageSquareHeart className="h-5 w-5 group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 z-50 w-[340px] sm:w-[380px] bg-card border border-border rounded-lg shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300" data-testid="nps-feedback-widget">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquareHeart className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-foreground">Rate Your Experience</h3>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground p-1" data-testid="button-nps-close">
          <X className="h-4 w-4" />
        </button>
      </div>

      {submitted ? (
        <div className="p-8 text-center" data-testid="nps-success">
          <CheckCircle2 className="h-10 w-10 text-accent mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground">Thank you for your feedback!</p>
          <p className="text-xs text-muted-foreground mt-1">Your response helps us improve the platform.</p>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-3 font-mono uppercase tracking-wider">
              How likely are you to recommend this platform? (0-10)
            </p>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  className={cn(
                    "h-9 rounded-sm text-xs font-mono font-bold transition-all border",
                    score === i
                      ? getScoreColor(i) + " text-white scale-110 shadow-md"
                      : i <= 6
                        ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                        : i <= 8
                          ? "border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
                          : "border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                  )}
                  data-testid={`button-nps-score-${i}`}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-mono text-red-400/70">Not Likely</span>
              <span className="text-[9px] font-mono text-emerald-400/70">Very Likely</span>
            </div>
            {score !== null && (
              <p className="text-xs text-center mt-2 font-mono">
                Score: <span className={cn("font-bold", score <= 6 ? "text-red-400" : score <= 8 ? "text-amber-400" : "text-emerald-400")}>{score}</span>
                {" "}<span className="text-muted-foreground">({getScoreLabel(score)})</span>
              </p>
            )}
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-8 text-xs" data-testid="select-nps-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NPS_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{getCategoryLabel(cat)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1.5 block">Feedback (optional)</label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what we can improve..."
              className="h-20 text-sm resize-none"
              data-testid="textarea-nps-feedback"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={score === null || submitNps.isPending}
            className="w-full"
            data-testid="button-nps-submit"
          >
            {submitNps.isPending ? (
              <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</span>
            ) : (
              <span className="flex items-center gap-2"><Send className="h-4 w-4" /> Submit Feedback</span>
            )}
          </Button>

          {myResponses && myResponses.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center font-mono">
              You've submitted {myResponses.length} response{myResponses.length !== 1 ? "s" : ""} previously
            </p>
          )}
        </div>
      )}
    </div>
  );
}
