import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Users, TrendingUp, Headphones, Search } from "lucide-react";
import { useState } from "react";
import { AdPlaceholder } from "@/components/AdPlaceholder";

function formatSubscribers(count: number | null) {
  if (!count) return null;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

export default function PodcastDirectory() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: podcasts, isLoading } = useQuery({
    queryKey: ["/api/public/podcasts"],
    queryFn: async () => {
      const res = await fetch("/api/public/podcasts");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const filtered = podcasts?.filter((p: any) =>
    !searchQuery ||
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.host?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="bg-white min-h-screen" data-testid="podcast-directory">
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4" data-testid="text-directory-title">
              Our Shows
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Discover podcasts across our network. From deep dives to daily briefings, find your next favorite show.
            </p>
          </div>
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search shows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              data-testid="input-search-shows"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center py-4 bg-gray-50/50 border-b border-gray-100">
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
                <Skeleton className="aspect-square bg-gray-100" />
                <div className="p-4">
                  <Skeleton className="h-5 w-3/4 mb-2 bg-gray-100" />
                  <Skeleton className="h-4 w-1/2 bg-gray-50" />
                </div>
              </div>
            ))}
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
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-featured-heading">Featured Shows</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {filtered.slice(0, 3).map((podcast: any, idx: number) => (
                    <Link key={podcast.id} href={`/show/${podcast.id}`} className="block group" data-testid={`card-featured-${podcast.id}`}>
                      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 text-white aspect-[4/3]">
                        {podcast.coverImage ? (
                          <img
                            src={podcast.coverImage}
                            alt={podcast.title}
                            className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity"
                          />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <div className="flex items-center gap-3 mb-3">
                            {podcast.coverImage ? (
                              <img src={podcast.coverImage} alt="" className="h-14 w-14 rounded-xl object-cover ring-2 ring-white/20 shadow-lg" />
                            ) : (
                              <div className="h-14 w-14 rounded-xl bg-amber-500 flex items-center justify-center ring-2 ring-white/20">
                                <Mic className="h-7 w-7 text-gray-900" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <h3 className="text-lg font-bold leading-tight truncate group-hover:text-amber-400 transition-colors" data-testid={`text-featured-title-${podcast.id}`}>
                                {podcast.title}
                              </h3>
                              <p className="text-gray-400 text-sm">with {podcast.host}</p>
                            </div>
                          </div>
                          {podcast.description && (
                            <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">{podcast.description}</p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                            {podcast.subscribers && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {formatSubscribers(podcast.subscribers)} subscribers
                              </span>
                            )}
                          </div>
                        </div>
                        {idx === 0 && (
                          <div className="absolute top-4 right-4 bg-amber-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full">
                            FEATURED
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-center my-8">
              <AdPlaceholder width={728} height={90} label="Mid-Content Leaderboard" className="hidden md:flex" />
              <AdPlaceholder width={320} height={100} label="Mid-Content Mobile" className="md:hidden" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-8" data-testid="text-all-shows-heading">
                {searchQuery ? `Results for "${searchQuery}"` : "All Shows"}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5" data-testid="shows-grid">
                {filtered.map((podcast: any, idx: number) => (
                  <Link key={podcast.id} href={`/show/${podcast.id}`} className="block group" data-testid={`card-show-${podcast.id}`}>
                    <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-200">
                      <div className="aspect-square relative bg-gray-50 overflow-hidden">
                        {podcast.coverImage ? (
                          <img
                            src={podcast.coverImage}
                            alt={podcast.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                            <Mic className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 bg-gray-900/80 text-white text-xs font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                          #{idx + 1}
                        </div>
                      </div>
                      <div className="p-3.5">
                        <h3 className="font-bold text-gray-900 text-sm leading-snug truncate group-hover:text-amber-600 transition-colors" data-testid={`text-show-title-${podcast.id}`}>
                          {podcast.title}
                        </h3>
                        <p className="text-gray-500 text-xs mt-0.5 truncate">with {podcast.host}</p>
                        {podcast.subscribers && (
                          <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {formatSubscribers(podcast.subscribers)}
                          </p>
                        )}
                      </div>
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
