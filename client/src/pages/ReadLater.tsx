import { Link } from "wouter";
import { Bookmark, Trash2, Clock, ChevronRight, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReadLater } from "@/hooks/use-read-later";
import { AdPlaceholder } from "@/components/AdPlaceholder";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ReadLater() {
  const { savedArticles, removeArticle, clearAll } = useReadLater();

  return (
    <div className="min-h-[60vh]">
      <div className="bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Bookmark className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-read-later-title">Read Later</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-read-later-count">
                {savedArticles.length === 0
                  ? "No saved articles"
                  : `${savedArticles.length} saved article${savedArticles.length !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-4 bg-background/50 border-b border-border">
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {savedArticles.length === 0 ? (
          <div className="text-center py-16" data-testid="empty-read-later">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">No saved articles yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Tap the bookmark icon on any article to save it for later reading.
            </p>
            <Link href="/home">
              <Button variant="outline" className="border-border text-muted-foreground" data-testid="button-browse-articles">
                Browse Articles
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">Sorted by most recently saved</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs"
                data-testid="button-clear-all"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="space-y-4" data-testid="read-later-list">
              {savedArticles.map((article) => (
                <div
                  key={article.articleId}
                  className="group bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all hover:border-border"
                  data-testid={`saved-article-${article.articleId}`}
                >
                  <div className="flex gap-4">
                    {article.coverImage && (
                      <img
                        src={article.coverImage}
                        alt=""
                        className="w-24 h-20 rounded-lg object-cover flex-shrink-0 bg-muted"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/news/${article.podcastId}/article/${article.articleId}`}
                        className="block"
                        data-testid={`link-saved-article-${article.articleId}`}
                      >
                        <h3 className="font-bold text-foreground text-base leading-snug group-hover:text-amber-600 transition-colors line-clamp-2 mb-1">
                          {article.articleTitle}
                        </h3>
                      </Link>
                      {article.articleDescription && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{article.articleDescription}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {article.podcastTitle && <span>{article.podcastTitle}</span>}
                        {article.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {article.readingTime} min read
                          </span>
                        )}
                        <span>Saved {timeAgo(article.savedAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => removeArticle(article.articleId)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove from Read Later"
                        data-testid={`button-remove-${article.articleId}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <Link href={`/news/${article.podcastId}/article/${article.articleId}`}>
                        <button
                          className="p-2 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Read now"
                          data-testid={`button-read-${article.articleId}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
