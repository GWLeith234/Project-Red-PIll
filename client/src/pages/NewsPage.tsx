import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Clock, Bookmark } from "lucide-react";
import { useReadLater } from "@/hooks/use-read-later";
import { SidebarSubscribeWidget, StickyBottomSubscribeBar } from "@/components/SubscriberWidgets";
import { useSubscription } from "@/hooks/use-subscription";
import { AdPlaceholder } from "@/components/AdPlaceholder";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours === 1 ? "about an hour" : hours + " hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days === 1 ? "yesterday" : days + " days ago"}`;
}

function NewsArticleCard({ article, podcastId, podcastTitle }: { article: any; podcastId: string; podcastTitle: string }) {
  const { isSaved, toggleArticle } = useReadLater();
  const saved = isSaved(article.id);

  return (
    <div className="relative group">
      <Link
        href={`/news/${podcastId}/article/${article.id}`}
        className="block"
      >
        <article
          className="py-6 first:pt-0 cursor-pointer"
          data-testid={`article-${article.id}`}
        >
          <div className="flex gap-5">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors mb-2 pr-10" data-testid={`text-article-title-${article.id}`}>
                {article.title}
              </h3>
              {article.description && (
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-3">
                  {article.description}
                </p>
              )}
              <div className="flex items-center text-xs text-gray-400">
                <Clock className="h-3 w-3 mr-1" />
                <time>{article.publishedAt ? timeAgo(article.publishedAt) : "Just now"}</time>
                <span className="mx-2">&middot;</span>
                <span>Read more &gt;</span>
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
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleArticle({
            id: article.id,
            title: article.title,
            description: article.description,
            coverImage: article.coverImage,
            podcastId,
            podcastTitle,
            readingTime: article.readingTime,
            publishedAt: article.publishedAt,
          });
        }}
        className={`absolute top-6 right-0 p-1.5 rounded-lg transition-all ${
          saved
            ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
            : "text-gray-300 hover:text-amber-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100"
        }`}
        title={saved ? "Remove from Read Later" : "Save for later"}
        data-testid={`button-bookmark-${article.id}`}
      >
        <Bookmark className={`h-4 w-4 ${saved ? "fill-amber-600" : ""}`} />
      </button>
    </div>
  );
}

export default function NewsPage() {
  const params = useParams<{ id: string }>();
  const { isSubscribed, recommendations, subscriberName } = useSubscription(params.id);
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/podcasts", params.id, "articles"],
    queryFn: async () => {
      const res = await fetch(`/api/podcasts/${params.id}/articles`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Skeleton className="h-10 w-64 mb-8 bg-gray-200" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-6 border-b border-gray-100">
              <Skeleton className="h-6 w-3/4 mb-3 bg-gray-200" />
              <Skeleton className="h-4 w-full mb-2 bg-gray-100" />
              <Skeleton className="h-3 w-24 bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
          <p className="text-gray-500 mb-4">This podcast doesn't exist or has no news page.</p>
        </div>
      </div>
    );
  }

  const { podcast, articles } = data;
  const publishedArticles = articles.filter((a: any) => a.status === "ready");

  return (
    <div className="bg-white" data-testid="news-page">
      <div className="bg-gray-950 text-white">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center gap-5">
            {podcast.coverImage ? (
              <img src={podcast.coverImage} alt={podcast.title} className="h-20 w-20 rounded-xl object-cover border-2 border-gray-700" />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-gray-800 flex items-center justify-center">
                <Mic className="h-10 w-10 text-gray-500" />
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-1" data-testid="text-news-title">{podcast.title}</h1>
              <p className="text-gray-400 text-sm">with {podcast.host}</p>
              {podcast.description && (
                <p className="text-gray-500 text-sm mt-2 max-w-xl line-clamp-2">{podcast.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-4 bg-gray-50/50 border-b border-gray-100">
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Latest Stories</h2>
            <p className="text-gray-500 text-sm mb-6">AI-generated articles from {podcast.title}</p>

            {publishedArticles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-400 text-lg">No published articles yet.</p>
                <p className="text-gray-400 text-sm mt-1">Articles will appear here once they are generated and approved.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100" data-testid="articles-list">
                {publishedArticles.map((article: any) => (
                  <NewsArticleCard key={article.id} article={article} podcastId={params.id!} podcastTitle={podcast.title} />
                ))}
              </div>
            )}
          </div>

          <aside className="hidden lg:block w-[300px] shrink-0" data-testid="news-sidebar">
            <div className="sticky top-20 space-y-6">
              <AdPlaceholder width={300} height={250} label="Sidebar Rectangle" />

              <SidebarSubscribeWidget
                podcastId={podcast.id}
                podcastTitle={podcast.title}
                podcastImage={podcast.coverImage}
                source="news_sidebar"
                isSubscribed={isSubscribed}
                recommendations={recommendations}
                subscriberName={subscriberName}
              />

              <AdPlaceholder width={300} height={600} label="Sidebar Half Page" />

              <div className="border border-gray-100 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">About the Show</h3>
                <div className="flex items-center space-x-3 mb-3">
                  {podcast.coverImage ? (
                    <img src={podcast.coverImage} alt={podcast.title} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-900 flex items-center justify-center">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{podcast.title}</p>
                    <p className="text-gray-500 text-xs">Hosted by {podcast.host}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {podcast.subscribers ? `${(podcast.subscribers / 1000).toFixed(0)}K subscribers` : ""}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <StickyBottomSubscribeBar
        podcastId={podcast.id}
        podcastTitle={podcast.title}
        source="news_sticky"
        isSubscribed={isSubscribed}
        recommendations={recommendations}
        subscriberName={subscriberName}
      />
    </div>
  );
}
