import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Clock, BarChart3, Check, ArrowRight } from "lucide-react";
import { Link } from "wouter";

function getFingerprint(): string {
  return btoa(navigator.userAgent + screen.width + screen.height);
}

function getSalemVotes(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem("salem_votes") || "{}");
  } catch {
    return {};
  }
}

function setSalemVote(pollId: string, optionIndex: number) {
  const votes = getSalemVotes();
  votes[pollId] = optionIndex;
  localStorage.setItem("salem_votes", JSON.stringify(votes));
}

export default function PollWidget({ pollId }: { pollId?: string }) {
  const queryClient = useQueryClient();
  const [votedIndex, setVotedIndex] = useState<number | null>(null);
  const [justVoted, setJustVoted] = useState(false);
  const [animateResults, setAnimateResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const endpoint = pollId
    ? `/api/public/polls/${pollId}`
    : `/api/public/polls/featured`;

  const queryKey = [endpoint];

  const { data: poll, isLoading } = useQuery<any>({
    queryKey,
    queryFn: async () => {
      const res = await fetch(endpoint);
      if (!res.ok) return null;
      return res.json();
    },
  });

  useEffect(() => {
    if (poll?.id) {
      const saved = getSalemVotes();
      if (saved[poll.id] !== undefined) {
        setVotedIndex(saved[poll.id]);
      }
    }
  }, [poll?.id]);

  useEffect(() => {
    if (votedIndex !== null) {
      const t = setTimeout(() => setAnimateResults(true), 50);
      return () => clearTimeout(t);
    }
  }, [votedIndex]);

  const isExpired = poll?.expiresAt
    ? new Date(poll.expiresAt).getTime() <= Date.now()
    : false;

  const isClosed = poll?.status === "closed" || isExpired;

  const getDeadlineText = () => {
    if (!poll?.expiresAt) return "No deadline";
    const diff = new Date(poll.expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Closed";
    const days = Math.floor(diff / 86400000);
    const hrs = Math.floor((diff % 86400000) / 3600000);
    if (days === 0 && hrs === 0) return "Closes today";
    if (days > 0) return `Closes in ${days}d ${hrs}h`;
    return `Closes in ${hrs}h`;
  };

  const handleVote = async (optionIndex: number) => {
    if (!poll || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/polls/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionId: String(optionIndex),
          voterIdentifier: getFingerprint(),
        }),
      });
      if (res.ok || res.status === 409) {
        setVotedIndex(optionIndex);
        setJustVoted(true);
        setSalemVote(poll.id, optionIndex);
        queryClient.invalidateQueries({ queryKey });
      }
    } catch (err) {
      console.error("Vote error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const containerClass =
    "w-[300px] h-[300px] max-w-[300px] max-h-[300px] overflow-hidden rounded-lg bg-card border border-border flex flex-col p-3";

  if (isLoading) {
    return (
      <div className={containerClass}>
        <div className="h-3 bg-muted rounded w-1/2 mb-3" />
        <div className="h-4 bg-muted rounded w-3/4 mb-auto" />
        <div className="space-y-1.5">
          <div className="h-8 bg-muted rounded-md" />
          <div className="h-8 bg-muted rounded-md" />
          <div className="h-8 bg-muted rounded-md" />
        </div>
        <div className="h-3 bg-muted rounded w-1/3 mt-2" />
      </div>
    );
  }

  if (!poll) {
    return (
      <div className={containerClass + " items-center justify-center"}>
        <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
        <span className="text-sm text-muted-foreground">No active polls</span>
      </div>
    );
  }

  const options: { text: string; votes: number }[] = poll.options || [];
  const totalVotes = options.reduce(
    (sum: number, o: any) => sum + (o.votes || 0),
    0
  );
  const showResults = votedIndex !== null || isClosed;

  const maxVotes = Math.max(...options.map((o: any) => o.votes || 0));

  if (showResults) {
    return (
      <div className={containerClass} data-testid={`poll-widget-${poll.id}`}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase text-muted-foreground tracking-wider">
            Community Poll
          </span>
          {isClosed ? (
            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
              Poll Closed
            </span>
          ) : justVoted ? (
            <span className="text-[10px] text-green-400">Vote recorded</span>
          ) : null}
        </div>

        <p className="text-sm font-bold text-foreground line-clamp-2 mt-2">
          {poll.question}
        </p>

        <div className="flex flex-col gap-1.5 mt-auto">
          {options.map((option: any, idx: number) => {
            const pct =
              totalVotes > 0
                ? Math.round(((option.votes || 0) / totalVotes) * 100)
                : 0;
            const isWinner = (option.votes || 0) === maxVotes && maxVotes > 0;
            const isVoted = votedIndex === idx;

            return (
              <div
                key={idx}
                className="h-7 rounded-md bg-muted/50 border border-border overflow-hidden relative flex items-center"
                data-testid={`poll-result-${poll.id}-${idx}`}
              >
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-[600ms] ease-out ${
                    isWinner ? "bg-primary/20" : "bg-muted"
                  }`}
                  style={{ width: animateResults ? `${pct}%` : "0%" }}
                />
                <span className="text-[11px] font-medium z-10 relative px-2 flex items-center gap-1 flex-1 truncate">
                  {isVoted && <Check className="h-3 w-3 flex-shrink-0" />}
                  {option.text}
                </span>
                <span className="text-[11px] font-bold z-10 relative px-2">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-muted-foreground">
            {totalVotes} total votes
          </span>
          {isClosed && (
            <Link
              href="/polls"
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-0.5"
            >
              View all polls <ArrowRight className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass} data-testid={`poll-widget-${poll.id}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase text-muted-foreground tracking-wider">
          Community Poll
        </span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {getDeadlineText()}
        </span>
      </div>

      <p className="text-sm font-bold text-foreground line-clamp-2 mt-2">
        {poll.question}
      </p>

      <div className="flex flex-col gap-1.5 mt-auto">
        {options.map((option: any, idx: number) => (
          <button
            key={idx}
            onClick={() => handleVote(idx)}
            disabled={submitting}
            className="w-full h-8 rounded-md border border-border bg-muted/50 text-foreground text-xs font-medium hover:border-primary/50 transition-colors disabled:opacity-50 px-2 text-left"
            data-testid={`poll-option-${poll.id}-${idx}`}
          >
            {option.text}
          </button>
        ))}
      </div>

      <div className="mt-2">
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Users className="h-3 w-3" />
          {totalVotes} votes cast
        </span>
      </div>
    </div>
  );
}
