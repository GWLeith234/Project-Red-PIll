import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function EventsWidget({ limit = 3 }: { limit?: number }) {
  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public/events"],
    queryFn: async () => {
      const res = await fetch("/api/public/events");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const upcoming = events.slice(0, limit);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="h-12 w-12 rounded-lg bg-muted flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (upcoming.length === 0) {
    return (
      <div className="text-center py-6">
        <CalendarDays className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">No upcoming events</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="events-widget">
      {upcoming.map((event: any) => {
        const d = new Date(event.startDate);
        const month = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
        const day = d.getDate();
        return (
          <div key={event.id} className="flex items-center gap-3 group" data-testid={`widget-event-${event.id}`}>
            <div className="h-12 w-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-amber-400 leading-none">{month}</span>
              <span className="text-lg font-bold text-foreground leading-tight">{day}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate group-hover:text-amber-400 transition-colors">{event.title}</p>
              {event.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <Link href="/events" className="flex items-center gap-1 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors pt-1" data-testid="link-view-all-events">
        View All Events <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
