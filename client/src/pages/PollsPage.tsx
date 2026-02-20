import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Vote } from "lucide-react";
import PollWidget from "@/components/widgets/PollWidget";

export default function PollsPage() {
  const [closedLimit, setClosedLimit] = useState(20);

  const { data: activePolls = [], isLoading: loadingActive } = useQuery<any[]>({
    queryKey: ["/api/public/polls", "active"],
    queryFn: async () => {
      const res = await fetch("/api/public/polls?status=active");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: closedPolls = [], isLoading: loadingClosed } = useQuery<any[]>({
    queryKey: ["/api/public/polls", "closed", closedLimit],
    queryFn: async () => {
      const res = await fetch(`/api/public/polls?status=closed&limit=${closedLimit}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="bg-background text-foreground min-h-screen" data-testid="polls-page">
      <div className="relative py-16 px-4 text-center bg-gradient-to-b from-background to-background">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-semibold mb-4">
            <BarChart3 className="h-3.5 w-3.5" />
            COMMUNITY POLLS
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3" data-testid="text-polls-title">
            Community Polls
          </h1>
          <p className="text-muted-foreground text-lg" data-testid="text-polls-subtitle">
            Vote on the issues that matter. Results updated in real time.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-16">
        <div className="mb-12">
          <h2 className="flex items-center gap-2 text-xl font-bold mb-6" data-testid="text-active-polls-heading">
            <Vote className="h-5 w-5" />
            Open for Voting
          </h2>

          {loadingActive ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-[300px] h-[300px] bg-card border border-border rounded-lg animate-pulse" />
              ))}
            </div>
          ) : activePolls.length === 0 ? (
            <div className="text-center py-16" data-testid="empty-active-polls">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active polls right now. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center" data-testid="active-polls-grid">
              {activePolls.map((poll: any) => (
                <PollWidget key={poll.id} pollId={poll.id} />
              ))}
            </div>
          )}
        </div>

        {(closedPolls.length > 0 || loadingClosed) && (
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold mb-6" data-testid="text-closed-polls-heading">
              <BarChart3 className="h-5 w-5" />
              Past Polls
            </h2>

            {loadingClosed ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-[300px] h-[300px] bg-card border border-border rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center" data-testid="closed-polls-grid">
                  {closedPolls.map((poll: any) => (
                    <PollWidget key={poll.id} pollId={poll.id} />
                  ))}
                </div>

                {closedPolls.length >= closedLimit && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={() => setClosedLimit((prev) => prev + 20)}
                      className="px-5 py-2.5 rounded-full text-sm font-semibold border border-border text-foreground/80 hover:border-purple-500/50 hover:text-purple-400 transition-colors"
                      data-testid="button-load-more-polls"
                    >
                      Load more
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
