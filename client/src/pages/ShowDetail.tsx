import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Clock, Play, Users, Headphones, Video, FileText, Calendar, BookOpen, Rss, ExternalLink, ChevronRight } from "lucide-react";
import { ArticlePreviewPopup } from "@/components/ArticlePreviewPopup";
import { useState } from "react";
import { SidebarSubscribeWidget, StickyBottomSubscribeBar } from "@/components/SubscriberWidgets";
import { useSubscription } from "@/hooks/use-subscription";

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
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function avgDuration(episodes: any[]) {
  const durations = episodes.filter(e => e.duration).map(e => {
    const parts = e.duration.split(":").map(Number);
    if (parts.length === 3) return parts[0] * 60 + parts[1];
    if (parts.length === 2) return parts[0];
    return 0;
  }).filter(Boolean);
  if (!durations.length) return null;
  const avg = Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length);
  return `${avg} min`;
}

type TabId = "episodes" | "articles" | "about";

export default function ShowDetail() {
  const params = useParams<{ podcastId: string }>();
  const [activeTab, setActiveTab] = useState<TabId>("episodes");
  const [episodeLimit, setEpisodeLimit] = useState(10);
  const { isSubscribed, recommendations, subscriberName } = useSubscription(params.podcastId);

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
      <div className="bg-background min-h-screen">
        <div className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] bg-muted animate-pulse" />
        <div className="max-w-6xl mx-auto px-4 py-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full mb-4 bg-card rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center py-20">
        <div className="text-center bg-card rounded-2xl shadow-sm border border-border p-10">
          <Mic className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Show not found</h1>
          <p className="text-muted-foreground mb-4">This show doesn't exist or is no longer available.</p>
          <Link href="/podcasts" className="text-primary hover:underline font-medium text-sm">
            Browse all shows
          </Link>
        </div>
      </div>
    );
  }

  const { podcast, episodes, articles } = data;
  const accent = podcast.accentColor || "#C0392B";
  const heroImg = podcast.heroImageUrl;
  const latestEp = episodes[0];
  const avgDur = avgDuration(episodes);

  const tabs: { id: TabId; label: string; count: number; icon: typeof Headphones }[] = [
    { id: "episodes", label: "Episodes", count: episodes.length, icon: Headphones },
    { id: "articles", label: "Articles", count: articles.length, icon: FileText },
    { id: "about", label: "About", count: 0, icon: BookOpen },
  ];

  return (
    <div className="bg-background min-h-screen" data-testid="show-detail">
      <div
        className="relative w-full overflow-hidden"
        style={{ height: "clamp(50vh, 60vh, 70vh)" }}
      >
        {heroImg ? (
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            data-testid="img-hero-background"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/90" />

        <div className="relative h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-end pb-10 sm:pb-14">
          <div className="flex-1 min-w-0 z-10">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-white/60 mb-3" data-testid="label-podcast">
              PODCAST
            </span>
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-white leading-[1.1] mb-4 max-w-3xl"
              data-testid="text-show-title"
            >
              {podcast.title}
            </h1>
            <div className="flex items-center gap-3 mb-3">
              {podcast.hostImageUrl ? (
                <img src={podcast.hostImageUrl} alt={podcast.host} className="h-8 w-8 rounded-full object-cover ring-2 ring-white/30" data-testid="img-host-avatar" />
              ) : null}
              <span className="text-white/90 text-base font-medium">{podcast.host}</span>
            </div>
            {podcast.description && (
              <p className="text-white/70 text-sm sm:text-base leading-relaxed max-w-2xl line-clamp-2 mb-5">
                {podcast.description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
              <button
                className="px-6 py-2.5 rounded-full text-sm font-bold text-white shadow-lg transition-all hover:brightness-110"
                style={{ backgroundColor: accent }}
                data-testid="button-subscribe"
              >
                Subscribe
              </button>
              {latestEp && (
                <Link
                  href={`/listen/${params.podcastId}/episode/${latestEp.id}`}
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-white border border-white/40 hover:bg-white/10 transition-all flex items-center gap-2"
                  data-testid="button-latest-episode"
                >
                  <Play className="h-4 w-4" />
                  Latest Episode
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 text-white/50 text-xs sm:text-sm">
              <span>Weekly</span>
              <span className="w-1 h-1 rounded-full bg-white/30" />
              <span>{episodes.length} episodes</span>
            </div>
          </div>

          {podcast.coverImage && (
            <div className="hidden md:block flex-shrink-0 ml-8 relative z-10 mb-[-20px]">
              <img
                src={podcast.coverImage}
                alt={podcast.title}
                className="w-40 lg:w-44 h-40 lg:h-44 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10"
                data-testid="img-show-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div className="border-b border-border" style={{ backgroundColor: `${accent}15` }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-center sm:justify-start gap-6 sm:gap-10 flex-wrap">
            <div className="text-center">
              <p className="text-xl sm:text-2xl font-extrabold text-foreground">{episodes.length}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Episodes</p>
            </div>
            <div className="h-8 w-px bg-border hidden sm:block" />
            {podcast.subscribers > 0 && (
              <>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-foreground">{formatSubscribers(podcast.subscribers)}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Subscribers</p>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block" />
              </>
            )}
            {avgDur && (
              <>
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-foreground">{avgDur}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Avg Duration</p>
                </div>
                <div className="h-8 w-px bg-border hidden sm:block" />
              </>
            )}
            {latestEp?.publishedAt && (
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-foreground">{timeAgo(latestEp.publishedAt)}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-medium">Latest</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-card border-b border-border sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-2 py-3" data-testid="show-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full transition-all"
                  style={activeTab === tab.id ? { backgroundColor: accent, color: "white" } : undefined}
                  data-testid={`tab-${tab.id}`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full
                      ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            {activeTab === "episodes" && (
              <EpisodesTab episodes={episodes} podcastId={params.podcastId!} podcastTitle={podcast.title} accent={accent} limit={episodeLimit} onLoadMore={() => setEpisodeLimit(l => l + 10)} />
            )}
            {activeTab === "articles" && (
              <ArticlesTab articles={articles} podcastId={params.podcastId!} accent={accent} />
            )}
            {activeTab === "about" && (
              <AboutTab podcast={podcast} episodeCount={episodes.length} articleCount={articles.length} accent={accent} />
            )}
          </div>

          <aside className="hidden lg:block w-[300px] shrink-0 print:hidden">
            <div className="sticky top-32 space-y-6">
              <SidebarSubscribeWidget
                podcastId={podcast.id}
                podcastTitle={podcast.title}
                podcastImage={podcast.coverImage}
                source="show_detail_sidebar"
                isSubscribed={isSubscribed}
                recommendations={recommendations}
                subscriberName={subscriberName}
              />
            </div>
          </aside>
        </div>
      </main>

      <StickyBottomSubscribeBar
        podcastId={podcast.id}
        podcastTitle={podcast.title}
        source="show_detail_sticky"
        isSubscribed={isSubscribed}
        recommendations={recommendations}
        subscriberName={subscriberName}
      />
    </div>
  );
}

function EpisodeTypeBadge({ type }: { type: string }) {
  if (type === "video" || type === "both") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-semibold rounded-full">
        <Video className="h-3 w-3" />
        {type === "both" ? "Video + Audio" : "Video"}
      </span>
    );
  }
  return null;
}

function EpisodesTab({ episodes, podcastId, podcastTitle, accent, limit, onLoadMore }: {
  episodes: any[]; podcastId: string; podcastTitle: string; accent: string; limit: number; onLoadMore: () => void;
}) {
  if (episodes.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border">
        <Headphones className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-lg font-medium">No episodes yet</p>
        <p className="text-muted-foreground text-sm mt-1">New episodes will appear here when published.</p>
      </div>
    );
  }

  const visible = episodes.slice(0, limit);

  return (
    <div data-testid="episodes-list">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Latest Episodes</h2>
        <span className="text-sm text-muted-foreground">{episodes.length} total</span>
      </div>
      <div className="space-y-1">
        {visible.map((ep: any, idx: number) => (
          <Link
            key={ep.id}
            href={`/listen/${podcastId}/episode/${ep.id}`}
            className="block"
            data-testid={`card-episode-${ep.id}`}
          >
            <div
              className="group flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-card transition-all"
              style={{ backgroundColor: idx % 2 === 0 ? "transparent" : "rgba(128,128,128,0.03)" }}
            >
              <span className="text-xs font-mono text-muted-foreground/50 w-6 text-right flex-shrink-0">
                {idx + 1}
              </span>
              <div className="flex-shrink-0 relative">
                {ep.thumbnailUrl ? (
                  <img src={ep.thumbnailUrl} alt="" className="h-14 w-14 rounded-lg object-cover bg-muted" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                    {ep.episodeType === "video" || ep.episodeType === "both" ? (
                      <Video className="h-6 w-6 text-muted-foreground/50" />
                    ) : (
                      <Headphones className="h-6 w-6 text-muted-foreground/50" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-foreground text-sm leading-snug truncate group-hover:text-white transition-colors" data-testid={`text-episode-title-${ep.id}`}>
                    {ep.title}
                  </h3>
                  <EpisodeTypeBadge type={ep.episodeType || "audio"} />
                </div>
                {ep.description && (
                  <p className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">{ep.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground/70">
                  {ep.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ep.duration}
                    </span>
                  )}
                  {ep.publishedAt && (
                    <span>{timeAgo(ep.publishedAt)}</span>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center shadow-lg"
                  style={{ backgroundColor: accent }}
                >
                  <Play className="h-4 w-4 text-white ml-0.5" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {limit < episodes.length && (
        <div className="text-center mt-6">
          <button
            onClick={(e) => { e.preventDefault(); onLoadMore(); }}
            className="px-6 py-2.5 rounded-full text-sm font-semibold border border-border text-foreground hover:bg-card transition-all"
            data-testid="button-load-more"
          >
            Load More Episodes
          </button>
        </div>
      )}
    </div>
  );
}

function ArticlesTab({ articles, podcastId, accent }: { articles: any[]; podcastId: string; accent: string }) {
  if (articles.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-2xl border border-border">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-lg font-medium">No articles yet</p>
        <p className="text-muted-foreground text-sm mt-1">AI-generated articles from episodes will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="articles-list">
      <h2 className="text-xl font-bold text-foreground mb-6">Articles</h2>
      {articles.map((article: any) => (
        <ArticlePreviewPopup key={article.id} article={article} podcastId={podcastId}>
          <Link
            href={`/news/${podcastId}/article/${article.id}`}
            className="block"
            data-testid={`card-article-${article.id}`}
          >
            <article className="group bg-card rounded-xl border border-border hover:shadow-md transition-all p-5 cursor-pointer" style={{ borderLeftWidth: "3px", borderLeftColor: accent }}>
              <div className="flex gap-5">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground leading-snug group-hover:text-white transition-colors mb-2" data-testid={`text-article-title-${article.id}`}>
                    {article.title}
                  </h3>
                  {article.description && (
                    <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 mb-3">
                      {article.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {article.publishedAt && <span>{timeAgo(article.publishedAt)}</span>}
                    {article.readingTime && <span>{article.readingTime} min read</span>}
                    <span style={{ color: accent }} className="font-medium">Read more &rarr;</span>
                  </div>
                </div>
                {article.coverImage && (
                  <div className="flex-shrink-0">
                    <img src={article.coverImage} alt="" className="w-[140px] h-[90px] object-cover rounded-xl bg-muted" />
                  </div>
                )}
              </div>
            </article>
          </Link>
        </ArticlePreviewPopup>
      ))}
    </div>
  );
}

function AboutTab({ podcast, episodeCount, articleCount, accent }: { podcast: any; episodeCount: number; articleCount: number; accent: string }) {
  return (
    <div className="max-w-2xl space-y-6" data-testid="about-section">
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-5 mb-6">
          {podcast.coverImage ? (
            <img src={podcast.coverImage} alt="" className="h-24 w-24 rounded-2xl object-cover shadow-md" />
          ) : (
            <div className="h-24 w-24 rounded-2xl flex items-center justify-center" style={{ backgroundColor: accent }}>
              <Mic className="h-10 w-10 text-white" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">{podcast.title}</h2>
            <p className="text-muted-foreground text-lg">with {podcast.host}</p>
          </div>
        </div>

        {podcast.description && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">About This Show</h3>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{podcast.description}</p>
          </div>
        )}

        {podcast.category && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Category</h3>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium border" style={{ borderColor: accent, color: accent }}>
              {podcast.category}
            </span>
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-3">Subscribe & Follow</h3>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <ExternalLink className="h-3 w-3" /> Apple Podcasts
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <ExternalLink className="h-3 w-3" /> Spotify
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              <Rss className="h-3 w-3" /> RSS Feed
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-2xl font-bold text-foreground">{episodeCount}</p>
          <p className="text-muted-foreground text-xs mt-1">Episodes</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-2xl font-bold text-foreground">{articleCount}</p>
          <p className="text-muted-foreground text-xs mt-1">Articles</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <p className="text-2xl font-bold text-foreground">{formatSubscribers(podcast.subscribers) || "0"}</p>
          <p className="text-muted-foreground text-xs mt-1">Subscribers</p>
        </div>
      </div>
    </div>
  );
}
