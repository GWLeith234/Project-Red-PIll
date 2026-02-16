import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const NPS_STORAGE_KEY = "_mt_nps_shown";

function getScoreColor(score: number): string {
  if (score <= 2) return "bg-red-600 hover:bg-red-500";
  if (score <= 4) return "bg-orange-600 hover:bg-orange-500";
  if (score <= 6) return "bg-orange-500 hover:bg-orange-400";
  if (score <= 8) return "bg-yellow-500 hover:bg-yellow-400";
  return "bg-green-500 hover:bg-green-400";
}

export default function NpsWidget() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [thankYou, setThankYou] = useState(false);

  useEffect(() => {
    try {
      const shown = localStorage.getItem(NPS_STORAGE_KEY);
      if (shown !== "true") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setExpanded(false);
    setVisible(false);
    try {
      localStorage.setItem(NPS_STORAGE_KEY, "true");
    } catch {}
  };

  const handleSubmit = async () => {
    if (selectedScore === null) return;
    setSubmitting(true);
    try {
      await fetch("/api/public/feedback/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score: selectedScore, comment: comment || undefined }),
      });
    } catch {}
    try {
      localStorage.setItem(NPS_STORAGE_KEY, "true");
    } catch {}
    setSubmitting(false);
    setThankYou(true);
    setTimeout(() => {
      setThankYou(false);
      setExpanded(false);
      setVisible(false);
    }, 3000);
  };

  if (!visible) return null;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-popover text-foreground border border-border shadow-lg hover:bg-muted transition-all text-sm font-medium"
        data-testid="nps-trigger-button"
      >
        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
        Rate Us
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-20 right-4 z-40 w-80 rounded-xl bg-popover border border-border shadow-2xl overflow-hidden"
      data-testid="nps-widget-panel"
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h3 className="text-sm font-semibold text-foreground">How likely are you to recommend us?</h3>
        <button
          onClick={dismiss}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
          data-testid="nps-close-button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {thankYou ? (
        <div className="px-4 py-8 text-center">
          <p className="text-green-400 font-semibold text-base" data-testid="nps-thank-you">Thank you!</p>
        </div>
      ) : (
        <div className="px-4 pb-4 pt-2 space-y-3">
          <div className="flex justify-between gap-0.5" data-testid="nps-score-row">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setSelectedScore(i)}
                className={`h-7 w-7 rounded text-xs font-bold transition-all flex-shrink-0 ${
                  selectedScore === i
                    ? `${getScoreColor(i)} text-white ring-2 ring-white/50 scale-110`
                    : `bg-muted text-muted-foreground hover:text-foreground ${getScoreColor(i).split(" ")[1]}`
                }`}
                data-testid={`nps-score-${i}`}
              >
                {i}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
            <span>Not likely</span>
            <span>Very likely</span>
          </div>

          <Textarea
            placeholder="Any additional feedback? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm min-h-[60px] resize-none"
            rows={2}
            data-testid="nps-comment-input"
          />

          <Button
            onClick={handleSubmit}
            disabled={selectedScore === null || submitting}
            className="w-full bg-card text-foreground hover:bg-muted font-semibold text-sm"
            data-testid="nps-submit-button"
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </div>
      )}
    </div>
  );
}