import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Users, TrendingUp, Headphones, Search, Star, Play, Crown, ArrowUpRight, ArrowDownRight, Flame, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";
import { AdPlaceholder } from "@/components/AdPlaceholder";

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

  const filtered = podcasts?.filter((p: any) =>
    !searchQuery ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.host?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const trending = useMemo(() => {
    if (!podcasts?.length) return [];
    return [...podcasts]
      .filter((p: any) => (p.growthPercent || 0) > 0)
      .sort((a: any, b: any) => (b.growthPercent || 0) - (a.growthPercent || 0))
      .slice(0, 5);
  }, [podcasts]);

  const networkStats = useMemo(() => {
    if (!podcasts?.length) return null;
    const totalSubs = podcasts.reduce((s: number, p: any) => s + (p.subscribers || 0), 0);
    const avgGrowth = podcasts.reduce((s: number, p: any) => s + (p.growthPercent || 0), 0) / podcasts.length;
    return { totalShows: podcasts.length, totalSubs, avgGrowth };
  }, [podcasts]);

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="podcast-directory">
      <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(168,85,247,0.1),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-8 sm:pt-16 sm:pb-10 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5">
              <Headphones className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-gray-300">Podcast Network</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent" data-testid="text-directory-title">
              Our Shows
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Discover podcasts across our network. From deep dives to daily briefings, find your next favorite show.
            </p>
          </div>

          <div className="max-w-xl mx-auto relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search shows, hosts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full pl-12 pr-4 py-3.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/40 focus:bg-white/15 transition-all"
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
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
                }`}
                data-testid={`filter-category-${cat.toLowerCase()}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-center py-4 bg-gray-50/50 border-b border-gray-100">
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {isLoading ? (
          <div>
            <div className="mb-12">
              <Skeleton className="h-7 w-48 mb-6 bg-gray-200" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-gray-200 bg-white">
                    <Skeleton className="aspect-[4/3] bg-gray-100" />
                    <div className="p-5">
                      <Skeleton className="h-5 w-3/4 mb-2 bg-gray-100" />
                      <Skeleton className="h-4 w-1/2 bg-gray-50" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center">
                  <Skeleton className="h-32 w-32 rounded-full bg-gray-200 mb-3" />
                  <Skeleton className="h-4 w-24 bg-gray-100 mb-1" />
                  <Skeleton className="h-3 w-16 bg-gray-50" />
                </div>
              ))}
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Headphones className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {searchQuery ? "No shows found" : "No shows yet"}
            </h2>
            <p className="text-gray-500">
              {searchQuery ? "Try a different search term." : "Shows will appear here once they're published."}
            </p>
          </div>
        ) : (
          <>
            {filtered.length >= 3 && !searchQuery && (
              <div className="mb-14">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900" data-testid="text-featured-heading">Featured Shows</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {filtered.slice(0, 3).map((podcast: any, idx: number) => (
                    <Link key={podcast.id} href={`/show/${podcast.id}`} className="block group" data-testid={`card-featured-${podcast.id}`}>
                      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white aspect-[4/3] shadow-xl group-hover:shadow-2xl transition-shadow">
                        {podcast.coverImage ? (
                          <img
                            src={podcast.coverImage}
                            alt={podcast.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        <div className="absolute top-4 left-4 flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                            {idx + 1}
                          </div>
                          {idx === 0 && (
                            <div className="bg-amber-500 text-gray-900 text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide">
                              <Crown className="h-3 w-3" />
                              Top Pick
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <div className="flex items-end gap-3">
                            {podcast.coverImage ? (
                              <img src={podcast.coverImage} alt="" className="h-16 w-16 rounded-full object-cover ring-2 ring-white/30 shadow-lg flex-shrink-0" />
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center ring-2 ring-white/30 flex-shrink-0">
                                <Mic className="h-8 w-8 text-white" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-bold leading-tight truncate group-hover:text-red-400 transition-colors" data-testid={`text-featured-title-${podcast.id}`}>
                                {podcast.title}
                              </h3>
                              <p className="text-gray-400 text-sm truncate">with {podcast.host}</p>
                              {podcast.subscribers && (
                                <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {formatSubscribers(podcast.subscribers)} subscribers
                                </p>
                              )}
                            </div>
                            <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                              <Play className="h-5 w-5 text-white ml-0.5" />
                            </div>
                          </div>
                          {podcast.description && (
                            <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed mt-3">{podcast.description}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {(trending.length > 0 || networkStats) && !searchQuery && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
                {networkStats && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6" data-testid="network-stats-widget">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center">
                        <BarChart3 className="h-3.5 w-3.5 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Network Stats</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <p className="text-2xl font-extrabold text-gray-900">{networkStats.totalShows}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Shows</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-extrabold text-gray-900">{formatSubscribers(networkStats.totalSubs)}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Subscribers</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-2xl font-extrabold ${networkStats.avgGrowth >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {networkStats.avgGrowth >= 0 ? "+" : ""}{networkStats.avgGrowth.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mt-0.5">Avg Growth</p>
                      </div>
                    </div>
                  </div>
                )}

                {trending.length > 0 && (
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6" data-testid="trending-shows-widget">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                        <Flame className="h-3.5 w-3.5 text-white" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Trending Now</h3>
                    </div>
                    <div className="space-y-2.5">
                      {trending.map((p: any, idx: number) => (
                        <Link key={p.id} href={`/show/${p.id}`} className="flex items-center gap-3 group hover:bg-gray-50 rounded-xl p-2 -mx-2 transition-colors" data-testid={`trending-show-${p.id}`}>
                          <span className="text-lg font-black text-gray-200 w-6 text-right tabular-nums">{idx + 1}</span>
                          {p.coverImage ? (
                            <img src={p.coverImage} alt="" className="h-10 w-10 rounded-full object-cover ring-1 ring-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Mic className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-red-600 transition-colors">{p.title}</p>
                            <p className="text-xs text-gray-500 truncate">{p.host} · {formatSubscribers(p.subscribers)} subs</p>
                          </div>
                          <div className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${p.growthPercent >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
                            {p.growthPercent >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                            {Math.abs(p.growthPercent).toFixed(1)}%
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center my-8">
              <AdPlaceholder width={728} height={90} label="Mid-Content Leaderboard" className="hidden md:flex" />
              <AdPlaceholder width={320} height={100} label="Mid-Content Mobile" className="md:hidden" />
            </div>

            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-8 w-8 rounded-lg bg-gray-900 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900" data-testid="text-all-shows-heading">
                  {searchQuery ? `Results for "${searchQuery}"` : "All Shows"}
                </h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-5 gap-y-8" data-testid="shows-grid">
                {filtered.map((podcast: any, idx: number) => (
                  <Link key={podcast.id} href={`/show/${podcast.id}`} className="block group" data-testid={`card-show-${podcast.id}`}>
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3">
                        <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-full overflow-hidden ring-2 ring-gray-200 group-hover:ring-red-500 group-hover:ring-4 transition-all duration-300 shadow-md group-hover:shadow-xl bg-gray-100">
                          {podcast.coverImage ? (
                            <img
                              src={podcast.coverImage}
                              alt={podcast.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                              <Mic className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -top-1 -left-1 h-7 w-7 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shadow-md ring-2 ring-white">
                          {idx + 1}
                        </div>
                        <div className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                          <Play className="h-4 w-4 ml-0.5" />
                        </div>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm leading-snug truncate max-w-full group-hover:text-red-600 transition-colors" data-testid={`text-show-title-${podcast.id}`}>
                        {podcast.title}
                      </h3>
                      <p className="text-gray-500 text-xs mt-0.5 truncate max-w-full">with {podcast.host}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap justify-center">
                        {podcast.subscribers > 0 && (
                          <span className="text-gray-400 text-xs flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {formatSubscribers(podcast.subscribers)}
                          </span>
                        )}
                        {podcast.growthPercent !== 0 && (
                          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${podcast.growthPercent > 0 ? "text-emerald-600" : "text-red-500"}`}>
                            {podcast.growthPercent > 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                            {Math.abs(podcast.growthPercent).toFixed(1)}%
                          </span>
                        )}
                      </div>
                      {podcast.category && (
                        <span className="mt-1 inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded-full">{podcast.category}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
