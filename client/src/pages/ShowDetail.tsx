import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Clock, Play, Users, Headphones, Video, FileText, ChevronRight, Calendar, BookOpen } from "lucide-react";
import { useState } from "react";
import { SidebarSubscribeWidget, StickyBottomSubscribeBar } from "@/components/SubscriberWidgets";

function formatSubscribers(count: number | null) {
  if (!count) return null;
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
  return count.toString();
}

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type TabId = "episodes" | "articles" | "about";

export default function ShowDetail() {
  const params = useParams<{ podcastId: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("episodes");

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/public/shows", params.podcastId],
    queryFn: async () => {
      const res = await fetch(`/api/public/shows/${params.podcastId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="bg-gray-950 text-white">
          <div className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center gap-6">
              <Skeleton className="h-32 w-32 rounded-2xl bg-gray-800" />
              <div>
                <Skeleton className="h-8 w-64 mb-3 bg-gray-800" />
                <Skeleton className="h-5 w-40 bg-gray-800" />
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 py-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full mb-4 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white flex items-center justify-center py-20">
        <div className="text-center">
          <Mic className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Show not found</h1>
          <p className="text-gray-500 mb-4">This show doesn't exist or is no longer available.</p>
          <Link href="/podcasts" className="text-amber-600 hover:text-amber-700 font-medium text-sm">
            Browse all shows
          </Link>
        </div>
      </div>
    );
  }

  const { podcast, episodes, articles } = data;

  const tabs: { id: TabId; label: string; count: number; icon: typeof Headphones }[] = [
    { id: "episodes", label: "Episodes", count: episodes.length, icon: Headphones },
    { id: "articles", label: "Articles", count: articles.length, icon: FileText },
    { id: "about", label: "About", count: 0, icon: BookOpen },
  ];

  return (
    <div className="bg-white" data-testid="show-detail">
      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              {podcast.coverImage ? (
                <img
                  src={podcast.coverImage}
                  alt={podcast.title}
                  className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
                  data-testid="img-show-cover"
                />
              ) : (
                <div className="h-36 w-36 sm:h-44 sm:w-44 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-2xl">
                  <Mic className="h-16 w-16 text-gray-900" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/15 text-amber-400 text-xs font-semibold uppercase tracking-wider rounded-md">
                  <Mic className="h-3 w-3" />
                  Podcast
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2" data-testid="text-show-title">
                {podcast.title}
              </h1>
              <p className="text-gray-400 text-lg mb-4">with {podcast.host}</p>
              {podcast.description && (
                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl line-clamp-3 mb-5">
                  {podcast.description}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm">
                {podcast.subscribers && (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <Users className="h-4 w-4" />
                    {formatSubscribers(podcast.subscribers)} subscribers
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-gray-400">
                  <Headphones className="h-4 w-4" />
                  {episodes.length} episodes
                </span>
                {articles.length > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-400">
                    <FileText className="h-4 w-4" />
                    {articles.length} articles
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 bg-white sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-0 -mb-px" data-testid="show-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? "border-amber-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full
                      ${activeTab === tab.id ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {activeTab === "episodes" && (
              <EpisodesTab episodes={episodes} podcastId={params.podcastId!} podcastTitle={podcast.title} />
            )}
            {activeTab === "articles" && (
              <ArticlesTab articles={articles} podcastId={params.podcastId!} />
            )}
            {activeTab === "about" && (
              <AboutTab podcast={podcast} episodeCount={episodes.length} articleCount={articles.length} />
            )}
          </div>

          <aside className="hidden lg:block w-[300px] shrink-0 print:hidden">
            <div className="sticky top-32 space-y-6">
              <SidebarSubscribeWidget
                podcastId={podcast.id}
                podcastTitle={podcast.title}
                podcastImage={podcast.coverImage}
                source="show_detail_sidebar"
              />
            </div>
          </aside>
        </div>
      </main>

      <StickyBottomSubscribeBar
        podcastId={podcast.id}
        podcastTitle={podcast.title}
        source="show_detail_sticky"
      />
    </div>
  );
}

function EpisodeTypeBadge({ type }: { type: string }) {
  if (type === "video" || type === "both") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
        <Video className="h-3 w-3" />
        {type === "both" ? "Video + Audio" : "Video"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
      <Headphones className="h-3 w-3" />
      Audio
    </span>
  );
}

function EpisodesTab({ episodes, podcastId, podcastTitle }: { episodes: any[]; podcastId: string; podcastTitle: string }) {
  if (episodes.length === 0) {
    return (
      <div className="text-center py-16">
        <Headphones className="h-12 w-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 text-lg font-medium">No episodes yet</p>
        <p className="text-gray-400 text-sm mt-1">New episodes will appear here when published.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="episodes-list">
      {episodes.map((ep: any) => (
        <Link
          key={ep.id}
          href={`/listen/${podcastId}/episode/${ep.id}`}
          className="block"
          data-testid={`card-episode-${ep.id}`}
        >
          <div className="group flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
            <div className="flex-shrink-0 relative">
              {ep.thumbnailUrl ? (
                <img src={ep.thumbnailUrl} alt="" className="h-20 w-20 sm:h-24 sm:w-28 rounded-lg object-cover bg-gray-100" />
              ) : (
                <div className="h-20 w-20 sm:h-24 sm:w-28 rounded-lg bg-gray-100 flex items-center justify-center">
                  {ep.episodeType === "video" || ep.episodeType === "both" ? (
                    <Video className="h-8 w-8 text-gray-300" />
                  ) : (
                    <Headphones className="h-8 w-8 text-gray-300" />
                  )}
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                  <Play className="h-4 w-4 text-gray-900 ml-0.5" />
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1.5">
                <EpisodeTypeBadge type={ep.episodeType || "audio"} />
              </div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug group-hover:text-amber-600 transition-colors truncate" data-testid={`text-episode-title-${ep.id}`}>
                {ep.title}
              </h3>
              {ep.description && (
                <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">{ep.description}</p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {ep.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(ep.publishedAt)}
                  </span>
                )}
                {ep.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {ep.duration}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ArticlesTab({ articles, podcastId }: { articles: any[]; podcastId: string }) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="h-12 w-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 text-lg font-medium">No articles yet</p>
        <p className="text-gray-400 text-sm mt-1">AI-generated articles from episodes will appear here.</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100" data-testid="articles-list">
      {articles.map((article: any) => (
        <Link
          key={article.id}
          href={`/news/${podcastId}/article/${article.id}`}
          className="block"
          data-testid={`card-article-${article.id}`}
        >
          <article className="group py-5 first:pt-0 cursor-pointer">
            <div className="flex gap-5">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-amber-600 transition-colors mb-2" data-testid={`text-article-title-${article.id}`}>
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-2">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {article.publishedAt && (
                    <span>{timeAgo(article.publishedAt)}</span>
                  )}
                  {article.readingTime && (
                    <span>{article.readingTime} min read</span>
                  )}
                  <span className="text-amber-600 font-medium">Read more &rarr;</span>
                </div>
              </div>
              {article.coverImage && (
                <div className="flex-shrink-0">
                  <img
                    src={article.coverImage}
                    alt=""
                    className="w-[140px] h-[90px] object-cover rounded-lg bg-gray-100"
                  />
                </div>
              )}
            </div>
          </article>
        </Link>
      ))}
    </div>
  );
}

function AboutTab({ podcast, episodeCount, articleCount }: { podcast: any; episodeCount: number; articleCount: number }) {
  return (
    <div className="max-w-2xl" data-testid="about-section">
      <div className="flex items-center gap-5 mb-8">
        {podcast.coverImage ? (
          <img src={podcast.coverImage} alt="" className="h-24 w-24 rounded-2xl object-cover shadow-md" />
        ) : (
          <div className="h-24 w-24 rounded-2xl bg-amber-500 flex items-center justify-center">
            <Mic className="h-10 w-10 text-gray-900" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{podcast.title}</h2>
          <p className="text-gray-500 text-lg">with {podcast.host}</p>
        </div>
      </div>

      {podcast.description && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">About This Show</h3>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{podcast.description}</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{episodeCount}</p>
          <p className="text-gray-500 text-xs mt-1">Episodes</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{articleCount}</p>
          <p className="text-gray-500 text-xs mt-1">Articles</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{formatSubscribers(podcast.subscribers) || "0"}</p>
          <p className="text-gray-500 text-xs mt-1">Subscribers</p>
        </div>
      </div>
    </div>
  );
}
