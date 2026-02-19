import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Clock, BarChart3, Loader2, CheckCircle } from "lucide-react";

function getVoterId(): string {
  let id = localStorage.getItem("community_voter_id");
  if (!id) {
    id = "anon_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("community_voter_id", id);
  }
  return id;
}

function useCountdown(endDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endDate) { setTimeLeft(""); return; }
    const update = () => {
      const diff = new Date(endDate).getTime() - Date.now();
      if (diff <= 0) { setIsExpired(true); setTimeLeft("Poll Closed"); return; }
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (days > 0) setTimeLeft(`Closes in ${days}d ${hrs}h`);
      else if (hrs > 0) setTimeLeft(`Closes in ${hrs}h ${mins}m`);
      else setTimeLeft(`Closes in ${mins}m`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return { timeLeft, isExpired };
}

export default function PollWidget({ pollId, zone }: { pollId?: string; zone?: string }) {
  const queryClient = useQueryClient();
  const voterId = getVoterId();
  const [votedOptionId, setVotedOptionId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [animateResults, setAnimateResults] = useState(false);

  const queryKey = pollId ? ["/api/public/polls", pollId] : ["/api/public/polls/zone", zone];
  const queryUrl = pollId ? `/api/public/polls/${pollId}` : `/api/public/polls/zone/${zone}`;

  const { data: poll, isLoading } = useQuery<any>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(queryUrl);
      if (!res.ok) return null;
      const data = await res.json();
      return data;
    },
    enabled: !!(pollId || zone),
  });

  const storageKey = poll ? `voted_poll_${poll.id}` : null;
  const hasVoted = votedOptionId !== null || (storageKey ? localStorage.getItem(storageKey) !== null : false);

  useEffect(() => {
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      if (saved) setVotedOptionId(saved);
    }
  }, [storageKey]);

  const { timeLeft, isExpired } = useCountdown(poll?.endDate);

  const handleVote = async (optionIndex: number) => {
    if (!poll || hasVoted || submitting || isExpired) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: String(optionIndex), voterIdentifier: voterId }),
      });
      if (res.ok) {
        const optId = String(optionIndex);
        setVotedOptionId(optId);
        if (storageKey) localStorage.setItem(storageKey, optId);
        setTimeout(() => setAnimateResults(true), 50);
        queryClient.invalidateQueries({ queryKey });
      }
    } catch (err) {
      console.error("Vote error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-4" />
        <div className="space-y-2">
          <div className="h-10 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!poll) return null;

  if (poll.startDate && new Date(poll.startDate) > new Date()) {
    const startStr = new Date(poll.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4" data-testid={`poll-widget-${poll.id}`}>
        <p className="text-sm font-semibold mb-2">{poll.question}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Poll opens {startStr}</span>
        </div>
      </div>
    );
  }

  const options: { text: string; votes: number }[] = poll.options || [];
  const totalVotes = options.reduce((sum: number, o: any) => sum + (o.votes || 0), 0);
  const showResults = hasVoted || isExpired || poll.showResultsBeforeVote;
  const savedVote = storageKey ? localStorage.getItem(storageKey) : null;

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4" data-testid={`poll-widget-${poll.id}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold">{poll.question}</p>
        <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      </div>

      <div className="space-y-2 mb-3">
        {options.map((option: any, idx: number) => {
          const pct = totalVotes > 0 ? Math.round(((option.votes || 0) / totalVotes) * 100) : 0;
          const isSelected = savedVote === String(idx) || votedOptionId === String(idx);

          if (showResults) {
            return (
              <div key={idx} className="relative" data-testid={`poll-result-${poll.id}-${idx}`}>
                <div className="relative h-9 rounded-lg overflow-hidden bg-muted border border-border">
                  <div
                    className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out ${
                      isSelected ? "bg-amber-500/30" : "bg-muted/50"
                    }`}
                    style={{ width: animateResults || hasVoted ? `${pct}%` : "0%" }}
                  />
                  <div className="relative flex items-center justify-between h-full px-3">
                    <span className={`text-xs font-medium ${isSelected ? "text-amber-300" : "text-foreground/80"}`}>
                      {isSelected && <CheckCircle className="h-3 w-3 inline mr-1" />}
                      {option.text}
                    </span>
                    <span className={`text-xs font-bold ${isSelected ? "text-amber-400" : "text-muted-foreground"}`}>
                      {pct}%
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={submitting || isExpired}
              className="w-full h-9 rounded-lg border border-border bg-muted text-foreground/80 text-xs font-medium hover:border-amber-500/50 hover:bg-amber-500/5 transition-all disabled:opacity-50 px-3 text-left"
              data-testid={`poll-option-${poll.id}-${idx}`}
            >
              {option.text}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
        </div>
        {timeLeft && (
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className={isExpired ? "text-red-400" : ""}>{timeLeft}</span>
          </div>
        )}
      </div>
    </div>
  );
}
