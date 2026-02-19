import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin, ExternalLink, Globe, Loader2, Star, Download, History } from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 0) {
    const futureMins = Math.abs(mins);
    if (futureMins < 60) return `in ${futureMins}m`;
    const hours = Math.floor(futureMins / 60);
    if (hours < 24) return `in ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `in ${days}d`;
    if (days < 30) return `in ${Math.floor(days / 7)}w`;
    return `in ${Math.floor(days / 30)}mo`;
  }
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatEventTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function generateICS(event: any): string {
  const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = formatICSDate(new Date(event.startDate || event.date || event.eventDate));
  const end = event.endDate ? formatICSDate(new Date(event.endDate)) : formatICSDate(new Date(new Date(event.startDate || event.date || event.eventDate).getTime() + 3600000));
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MediaTech Empire//EN",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${(event.title || "").replace(/[,;\\]/g, " ")}`,
    `DESCRIPTION:${(event.description || "").replace(/[,;\\]/g, " ").replace(/\n/g, "\\n")}`,
    `LOCATION:${(event.location || "").replace(/[,;\\]/g, " ")}`,
    event.ticketUrl ? `URL:${event.ticketUrl}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

function downloadICS(event: any) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(event.title || "event").replace(/\s+/g, "-").toLowerCase()}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

const CATEGORIES = ["All", "General", "Sports", "Music", "Business", "Community", "Education"];

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-blue-500/20 text-blue-300",
  Sports: "bg-green-500/20 text-green-300",
  Music: "bg-purple-500/20 text-purple-300",
  Business: "bg-amber-500/20 text-amber-300",
  Community: "bg-pink-500/20 text-pink-300",
  Education: "bg-cyan-500/20 text-cyan-300",
};

export default function EventsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showPast, setShowPast] = useState(false);

  const fetchUrl = showPast ? "/api/public/events/all" : "/api/public/events";

  const { data: events = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public/events", showPast ? "all" : "upcoming"],
    queryFn: async () => {
      const res = await fetch(fetchUrl);
      if (res.ok) return res.json();
      const fallback = await fetch("/api/public/community-events");
      if (!fallback.ok) return [];
      return fallback.json();
    },
  });

  const filtered = activeCategory === "All"
    ? events
    : events.filter((e: any) => (e.category || "General").toLowerCase() === activeCategory.toLowerCase());

  return (
    <div className="bg-background text-foreground min-h-screen" data-testid="events-page">
      <div className="relative py-16 px-4 text-center bg-gradient-to-b from-background to-background">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold mb-4">
            <CalendarDays className="h-3.5 w-3.5" />
            COMMUNITY CALENDAR
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3" data-testid="text-events-title">Events</h1>
          <p className="text-muted-foreground text-lg" data-testid="text-events-subtitle">
            Discover upcoming community events, meetups, and experiences
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex flex-wrap gap-2 mb-8 justify-center" data-testid="filter-categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-amber-500 text-gray-950"
                  : "bg-muted text-foreground/80 hover:bg-muted hover:text-foreground"
              }`}
              data-testid={`filter-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-background border border-border rounded-xl overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" data-testid="empty-events">
            <CalendarDays className="h-16 w-16 text-foreground/80 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground">
              {activeCategory === "All"
                ? "There are no upcoming events at the moment. Check back soon!"
                : `No ${activeCategory} events right now. Try a different category.`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="events-grid">
            {filtered.map((event: any) => {
              const image = event.coverImage || event.imageUrl;
              const category = event.category || "General";
              const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.General;
              const link = event.ticketUrl || event.eventUrl;
              const location = event.location || event.venueName;
              const isFeatured = event.featured || event.isFeatured;
              const isVirtual = event.isVirtual || event.virtual;
              const eventDate = event.startDate || event.date || event.eventDate;
              const isPast = eventDate && new Date(eventDate) < new Date();

              return (
                <div
                  key={event.id}
                  className={`bg-background border rounded-xl overflow-hidden group transition-all hover:border-border ${
                    isFeatured ? "border-amber-500/50 ring-1 ring-amber-500/20" : "border-border"
                  } ${isPast ? "opacity-60" : ""}`}
                  data-testid={`card-event-${event.id}`}
                >
                  <div className="relative h-48 overflow-hidden bg-muted">
                    {image ? (
                      <>
                        <img
                          src={image}
                          alt={event.title || ""}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background to-background">
                        <CalendarDays className="h-12 w-12 text-foreground/80" />
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${colorClass}`} data-testid={`badge-category-${event.id}`}>
                        {category}
                      </span>
                      {isVirtual && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300" data-testid={`badge-virtual-${event.id}`}>
                          <Globe className="h-3 w-3" />
                          Virtual
                        </span>
                      )}
                      {isPast && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-gray-500/20 text-gray-400">
                          Past
                        </span>
                      )}
                    </div>

                    {isFeatured && (
                      <div className="absolute top-3 right-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-400" data-testid={`badge-featured-${event.id}`}>
                          <Star className="h-3 w-3 fill-amber-400" />
                          Featured
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-foreground mb-3 line-clamp-2 group-hover:text-amber-400 transition-colors" data-testid={`text-event-title-${event.id}`}>
                      {event.title}
                    </h3>

                    {eventDate && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2" data-testid={`text-event-date-${event.id}`}>
                        <CalendarDays className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span>
                          {formatEventDate(eventDate)}
                          {" · "}
                          {formatEventTime(eventDate)}
                        </span>
                      </div>
                    )}

                    {location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3" data-testid={`text-event-location-${event.id}`}>
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{location}</span>
                      </div>
                    )}

                    {event.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{event.description}</p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold bg-amber-500 text-gray-950 hover:bg-amber-400 transition-colors"
                          data-testid={`link-event-${event.id}`}
                        >
                          {event.ticketUrl ? "Get Tickets" : "Learn More"}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {eventDate && (
                        <button
                          onClick={() => downloadICS(event)}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium border border-border text-foreground/80 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
                          data-testid={`button-calendar-${event.id}`}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Add to Calendar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center mt-10">
          <button
            onClick={() => setShowPast(!showPast)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
              showPast
                ? "bg-amber-500 text-gray-950 hover:bg-amber-400"
                : "border border-border text-foreground/80 hover:border-amber-500/50 hover:text-amber-400"
            }`}
            data-testid="button-toggle-past-events"
          >
            <History className="h-4 w-4" />
            {showPast ? "Hide Past Events" : "Show Past Events"}
          </button>
        </div>
      </div>
    </div>
  );
}
