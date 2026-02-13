import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, ChevronRight, Clock, ArrowLeft, Share2, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours === 1 ? "about an hour" : hours + " hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days === 1 ? "yesterday" : days + " days ago"}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ArticlePage() {
  const params = useParams<{ podcastId: string; articleId: string }>();

  const { data: article, isLoading: articleLoading, error: articleError } = useQuery({
    queryKey: ["/api/content-pieces", params.articleId],
    queryFn: async () => {
      const res = await fetch(`/api/content-pieces/${params.articleId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: podcastData } = useQuery({
    queryKey: ["/api/podcasts", params.podcastId],
    queryFn: async () => {
      const res = await fetch(`/api/podcasts/${params.podcastId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (articleLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
          <Skeleton className="h-10 w-3/4 mb-4 bg-gray-200" />
          <Skeleton className="h-4 w-48 mb-8 bg-gray-100" />
          <Skeleton className="h-5 w-full mb-3 bg-gray-100" />
          <Skeleton className="h-5 w-full mb-3 bg-gray-100" />
          <Skeleton className="h-5 w-3/4 mb-6 bg-gray-100" />
          <Skeleton className="h-5 w-full mb-3 bg-gray-100" />
          <Skeleton className="h-5 w-full mb-3 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (articleError || !article) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article not found</h1>
          <p className="text-gray-500 mb-4">This article doesn't exist or has been removed.</p>
          <Link href={`/news/${params.podcastId}`} className="text-blue-600 hover:underline text-sm">Back to News</Link>
        </div>
      </div>
    );
  }

  const podcast = podcastData;

  return (
    <div className="min-h-screen bg-white" data-testid="article-page">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              {podcast?.coverImage ? (
                <img src={podcast.coverImage} alt={podcast?.title} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">{podcast?.title || "News"}</h1>
              </div>
            </div>
            <Link href={`/news/${params.podcastId}`} className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="link-back-news">
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Stories
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center space-x-1 text-sm text-gray-500 py-3">
            <Link href={`/news/${params.podcastId}`} className="hover:text-gray-900 cursor-pointer">News</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium truncate max-w-[300px]">{article.title}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <article data-testid={`article-detail-${article.id}`}>
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4" data-testid="text-article-headline">
              {article.title}
            </h1>

            {article.description && (
              <p className="text-xl text-gray-500 leading-relaxed mb-6" data-testid="text-article-description">
                {article.description}
              </p>
            )}

            <div className="flex items-center justify-between border-t border-b border-gray-100 py-3">
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1.5" />
                <time>{article.publishedAt ? formatDate(article.publishedAt) : "Just now"}</time>
                {article.publishedAt && (
                  <>
                    <span className="mx-2 text-gray-300">|</span>
                    <span>{timeAgo(article.publishedAt)}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700 h-8 px-2" data-testid="button-share">
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-700 h-8 px-2" data-testid="button-bookmark">
                  <Bookmark className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {article.coverImage && (
            <div className="mb-8">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full rounded-sm object-cover max-h-[400px] bg-gray-100"
                data-testid="img-article-cover"
              />
            </div>
          )}

          <div className="prose prose-lg prose-gray max-w-none" data-testid="text-article-body">
            {article.body ? (
              article.body.split("\n\n").map((paragraph: string, i: number) => (
                <p key={i} className="text-gray-800 leading-relaxed mb-6 text-[17px]">
                  {paragraph}
                </p>
              ))
            ) : article.description ? (
              <p className="text-gray-800 leading-relaxed mb-6 text-[17px]">
                {article.description}
              </p>
            ) : (
              <p className="text-gray-400 italic">Full article content is being generated...</p>
            )}
          </div>

          <footer className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {podcast?.coverImage ? (
                  <img src={podcast.coverImage} alt={podcast?.title} className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center">
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{podcast?.host || "Editorial Team"}</p>
                  <p className="text-gray-500 text-xs">{podcast?.title}</p>
                </div>
              </div>
              <Link href={`/news/${params.podcastId}`}>
                <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50" data-testid="button-more-stories">
                  More Stories
                </Button>
              </Link>
            </div>
          </footer>
        </article>
      </main>

      <footer className="border-t border-gray-200 mt-8">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4" />
              <span>{podcast?.title || "MediaTech"}</span>
            </div>
            <p>Powered by MediaTech Empire</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
