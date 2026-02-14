import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Mic, Headphones, Video, FileText, Clock, Search, Users } from "lucide-react";
import { useState, useEffect } from "react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSubscribers(count: number | null) {
  if (!count) return null;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count?.toString();
}

export default function SearchPage() {
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const initialQuery = urlParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/public/search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return { podcasts: [], episodes: [], articles: [] };
      const res = await fetch(`/api/public/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: true,
  });

  const podcasts = data?.podcasts || [];
  const episodes = data?.episodes || [];
  const articles = data?.articles || [];
  const hasResults = podcasts.length > 0 || episodes.length > 0 || articles.length > 0;
  const hasQuery = debouncedQuery.trim().length > 0;

  return (
    <div className="bg-white min-h-screen" data-testid="search-page">
      <div className="bg-gray-950 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14">
          <h1 className="text-3xl font-bold mb-6" data-testid="text-search-heading">Search</h1>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search episodes, articles, shows..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full bg-gray-800/80 border border-gray-700 rounded-xl pl-12 pr-4 py-4 text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
              data-testid="input-search"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {!hasQuery ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Search for episodes, articles, or shows</p>
            <p className="text-gray-400 text-sm mt-1">Start typing to see results</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !hasResults ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No results for "{debouncedQuery}"</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-10">
            {podcasts.length > 0 && (
              <section data-testid="search-results-shows">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Shows ({podcasts.length})</h2>
                <div className="space-y-2">
                  {podcasts.map((p: any) => (
                    <Link key={p.id} href={`/show/${p.id}`} className="block" data-testid={`search-show-${p.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                        {p.coverImage ? (
                          <img src={p.coverImage} alt="" className="h-14 w-14 rounded-xl object-cover flex-shrink-0" />
                        ) : (
                          <div className="h-14 w-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <Mic className="h-6 w-6 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm group-hover:text-amber-600 transition-colors">{p.title}</h3>
                          <p className="text-gray-500 text-xs mt-0.5">with {p.host}</p>
                          {p.subscribers && (
                            <p className="text-gray-400 text-xs mt-1 flex items-center gap-1">
                              <Users className="h-3 w-3" /> {formatSubscribers(p.subscribers)} subscribers
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded font-medium">SHOW</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {episodes.length > 0 && (
              <section data-testid="search-results-episodes">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Episodes ({episodes.length})</h2>
                <div className="space-y-2">
                  {episodes.map((ep: any) => (
                    <Link key={ep.id} href={`/listen/${ep.podcastId}/episode/${ep.id}`} className="block" data-testid={`search-episode-${ep.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                        <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                          {ep.thumbnailUrl ? (
                            <img src={ep.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : ep.podcastCoverImage ? (
                            <img src={ep.podcastCoverImage} alt="" className="w-full h-full object-cover" />
                          ) : ep.episodeType === "video" ? (
                            <Video className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Headphones className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm group-hover:text-amber-600 transition-colors truncate">{ep.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            <span>{ep.podcastTitle}</span>
                            {ep.duration && (
                              <>
                                <span className="text-gray-200">|</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{ep.duration}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase
                          ${ep.episodeType === "video" || ep.episodeType === "both"
                            ? "bg-purple-100 text-purple-700" : "bg-blue-50 text-blue-600"}`}>
                          {ep.episodeType === "video" ? "Video" : ep.episodeType === "both" ? "V+A" : "Audio"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {articles.length > 0 && (
              <section data-testid="search-results-articles">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Articles ({articles.length})</h2>
                <div className="space-y-2">
                  {articles.map((a: any) => (
                    <Link key={a.id} href={`/news/${a.podcastId}/article/${a.id}`} className="block" data-testid={`search-article-${a.id}`}>
                      <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                        {a.coverImage ? (
                          <img src={a.coverImage} alt="" className="h-12 w-16 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="h-5 w-5 text-gray-300" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-sm group-hover:text-amber-600 transition-colors truncate">{a.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                            <span>{a.podcastTitle}</span>
                            {a.readingTime && (
                              <>
                                <span className="text-gray-200">|</span>
                                <span>{a.readingTime} min read</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded font-medium">ARTICLE</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
