import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Users, Headphones, Search, Play, Crown } from "lucide-react";
import { useState, useMemo } from "react";

function formatSubscribers(count: number | null) {
  if (!count) return null;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

const CATEGORIES = ["All", "Talk", "News", "Comedy", "Tech", "Business", "Sports", "Culture", "True Crime", "Health"];

export default function PodcastDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: podcasts, isLoading } = useQuery({
    queryKey: ["/api/public/podcasts", activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeCategory !== "All") params.set("category", activeCategory);
      const res = await fetch(`/api/public/podcasts?${params.toString()}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    const list = podcasts || [];
    const searched = list.filter((p: any) =>
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.host?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return [...searched].sort((a: any, b: any) => (b.subscribers || 0) - (a.subscribers || 0));
  }, [podcasts, searchQuery]);

  const featured = useMemo(() => {
    if (!filtered.length || searchQuery) return null;
    return filtered[0];
  }, [filtered, searchQuery]);

  return (
    <div className="bg-background min-h-screen" data-testid="podcast-directory">
      <div className="bg-gradient-to-b from-gray-900 via-background to-background text-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(192,57,43,0.15),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-10 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white" data-testid="text-directory-title">
              Shows & Podcasts
            </h1>
            <p className="text-white/60 text-lg leading-relaxed">
              Subscribe to your favorite conservative voices
            </p>
          </div>

          <div className="max-w-xl mx-auto relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search shows, hosts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-md border border-white/15 rounded-full pl-12 pr-4 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/30 transition-all"
              data-testid="input-search-shows"
            />
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-white text-gray-900 shadow-lg"
                    : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                }`}
                data-testid={`filter-category-${cat.toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-card border border-border">
                <Skeleton className="aspect-[4/5] bg-muted" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Headphones className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              {searchQuery ? "No shows found" : "No shows yet"}
            </h2>
            <p className="text-muted-foreground">
              {searchQuery ? "Try a different search term." : "Shows will appear here once they're published."}
            </p>
          </div>
        ) : (
          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
            data-testid="shows-grid"
          >
            {featured && !searchQuery && (
              <Link
                href={`/show/${featured.id}`}
                className="block sm:col-span-2 group"
                data-testid={`card-featured-${featured.id}`}
              >
                <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-[360px] sm:h-[400px] shadow-xl group-hover:shadow-2xl transition-all duration-300 group-hover:scale-[1.01]">
                  {featured.heroImageUrl ? (
                    <img
                      src={featured.heroImageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : featured.coverImage ? (
                    <img
                      src={featured.coverImage}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                    style={{ boxShadow: `inset 0 0 80px ${featured.accentColor || '#C0392B'}` }}
                  />

                  <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                    <div className="bg-amber-500 text-gray-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide">
                      <Crown className="h-3 w-3" />
                      Featured
                    </div>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <div
                      className="h-14 w-14 rounded-full flex items-center justify-center shadow-2xl"
                      style={{ backgroundColor: featured.accentColor || '#C0392B' }}
                    >
                      <Play className="h-6 w-6 text-white ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2 line-clamp-2" data-testid={`text-featured-title-${featured.id}`}>
                      {featured.title}
                    </h3>
                    <p className="text-white/70 text-sm mb-2">{featured.host}</p>
                    {featured.description && (
                      <p className="text-white/50 text-sm line-clamp-2 leading-relaxed">{featured.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-white/40 text-xs">
                      {featured.subscribers > 0 && (
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {formatSubscribers(featured.subscribers)}</span>
                      )}
                      <span>Weekly</span>
                    </div>
                  </div>

                  <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: featured.accentColor || '#C0392B' }}
                  />
                </div>
              </Link>
            )}

            {filtered.filter((p: any) => !featured || searchQuery || p.id !== featured.id).map((podcast: any) => (
              <ShowCard key={podcast.id} podcast={podcast} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShowCard({ podcast }: { podcast: any }) {
  const accent = podcast.accentColor || "#C0392B";
  const heroImg = podcast.heroImageUrl || podcast.coverImage;

  return (
    <Link href={`/show/${podcast.id}`} className="block group" data-testid={`card-show-${podcast.id}`}>
      <div className="relative rounded-2xl overflow-hidden bg-gray-900 h-[360px] shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-[1.03]">
        <div className="absolute inset-0 h-[60%]">
          {heroImg ? (
            <img
              src={heroImg}
              alt=""
              className="w-full h-full object-cover opacity-70 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <Mic className="h-16 w-16 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-900" />
        </div>

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10" style={{ top: 0, bottom: "40%" }}>
          <div
            className="h-12 w-12 rounded-full flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform"
            style={{ backgroundColor: accent }}
          >
            <Play className="h-5 w-5 text-white ml-0.5" />
          </div>
        </div>

        <div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ boxShadow: `inset 0 0 40px ${accent}30, 0 0 20px ${accent}15` }}
        />

        <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gray-900 p-4 flex flex-col">
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-r"
            style={{ backgroundColor: accent }}
          />

          <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 mb-1 pl-2" data-testid={`text-show-title-${podcast.id}`}>
            {podcast.title}
          </h3>
          <p className="text-white/50 text-xs mb-2 pl-2 truncate">{podcast.host}</p>

          <div className="flex items-center gap-2 pl-2 mb-2">
            {podcast.subscribers > 0 && (
              <span className="text-white/40 text-[10px] flex items-center gap-1">
                <Users className="h-3 w-3" /> {formatSubscribers(podcast.subscribers)}
              </span>
            )}
            <span className="text-white/30 text-[10px]">Weekly</span>
          </div>

          {podcast.description && (
            <p className="text-white/30 text-[10px] line-clamp-2 leading-relaxed pl-2 mt-auto">
              {podcast.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
