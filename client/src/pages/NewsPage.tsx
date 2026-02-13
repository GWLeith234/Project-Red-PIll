import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, ChevronRight, Clock, ArrowLeft } from "lucide-react";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours === 1 ? "about an hour" : hours + " hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days === 1 ? "yesterday" : days + " days ago"}`;
}

export default function NewsPage() {
  const params = useParams<{ id: string }>();
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
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
          <p className="text-gray-500 mb-4">This podcast doesn't exist or has no news page.</p>
          <Link href="/network" className="text-blue-600 hover:underline text-sm">Back to Network</Link>
        </div>
      </div>
    );
  }

  const { podcast, articles } = data;
  const publishedArticles = articles.filter((a: any) => a.status === "ready");

  return (
    <div className="min-h-screen bg-white" data-testid="news-page">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {podcast.coverImage ? (
                <img src={podcast.coverImage} alt={podcast.title} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight" data-testid="text-news-title">{podcast.title}</h1>
              </div>
            </div>
            <Link href="/network" className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="link-back-network">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center space-x-1 text-sm text-gray-500 py-3">
            <span className="hover:text-gray-900 cursor-pointer">Home</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium">News</span>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Latest News</h2>
        <p className="text-gray-500 text-sm mb-8">AI-generated articles from {podcast.title}</p>

        {publishedArticles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-lg">No published articles yet.</p>
            <p className="text-gray-400 text-sm mt-1">Articles will appear here once they are generated and approved.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100" data-testid="articles-list">
            {publishedArticles.map((article: any, index: number) => (
              <article
                key={article.id}
                className="group py-6 first:pt-0 cursor-pointer"
                data-testid={`article-${article.id}`}
              >
                <div className="flex gap-5">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 leading-snug group-hover:text-blue-700 transition-colors mb-2" data-testid={`text-article-title-${article.id}`}>
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
                      <span className="mx-2">·</span>
                      <span>Read more &gt;</span>
                    </div>
                  </div>
                  {article.coverImage && (
                    <div className="flex-shrink-0">
                      <img
                        src={article.coverImage}
                        alt=""
                        className="w-[120px] h-[80px] object-cover rounded-sm bg-gray-100"
                      />
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4" />
              <span>{podcast.title}</span>
            </div>
            <p>Powered by MediaTech Empire</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
