import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Linkedin, Clock, FileText, User, ArrowRight, Tag, Newspaper } from "lucide-react";
import { AdPlaceholder } from "@/components/AdPlaceholder";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours === 1 ? "about an hour" : hours + " hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days === 1 ? "yesterday" : days + " days ago"}`;
  const months = Math.floor(days / 30);
  return `${months === 1 ? "1 month" : months + " months"} ago`;
}

export default function AuthorProfile() {
  const params = useParams<{ authorId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/public/authors", params.authorId],
    queryFn: async () => {
      const res = await fetch(`/api/public/authors/${params.authorId}`);
      if (!res.ok) throw new Error("Author not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-start gap-6 mb-10">
            <Skeleton className="h-24 w-24 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-8 w-48 mb-3 bg-gray-200" />
              <Skeleton className="h-4 w-32 mb-4 bg-gray-100" />
              <Skeleton className="h-4 w-full mb-2 bg-gray-100" />
              <Skeleton className="h-4 w-3/4 bg-gray-100" />
            </div>
          </div>
          <Skeleton className="h-6 w-40 mb-6 bg-gray-200" />
          {[1, 2, 3].map(i => (
            <div key={i} className="mb-6">
              <Skeleton className="h-5 w-3/4 mb-2 bg-gray-200" />
              <Skeleton className="h-4 w-full mb-1 bg-gray-100" />
              <Skeleton className="h-4 w-2/3 bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data?.author) {
    return (
      <div className="bg-white flex items-center justify-center py-20 min-h-screen">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Author not found</h1>
          <p className="text-gray-500">This author profile doesn't exist.</p>
        </div>
      </div>
    );
  }

  const { author, articles } = data;

  return (
    <div className="bg-white min-h-screen" data-testid="author-profile-page">
      <div className="border-b border-gray-100 bg-gray-50/80">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex items-start gap-6">
            {author.profilePhoto ? (
              <img
                src={author.profilePhoto}
                alt={author.displayName || "Author"}
                className="h-24 w-24 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
                data-testid="img-author-photo"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0" data-testid="img-author-placeholder">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-1" data-testid="text-author-name">
                {author.displayName || "Unknown Author"}
              </h1>
              {author.title && (
                <p className="text-lg text-gray-500 mb-3" data-testid="text-author-title">{author.title}</p>
              )}
              {author.bio && (
                <p className="text-gray-700 leading-relaxed max-w-2xl" data-testid="text-author-bio">{author.bio}</p>
              )}
              <div className="flex items-center gap-4 mt-4">
                {author.linkedinUrl && (
                  <a
                    href={author.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-[#0A66C2] hover:underline"
                    data-testid="link-author-linkedin"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                <span className="text-sm text-gray-400">
                  <FileText className="h-4 w-4 inline mr-1" />
                  {articles?.length || 0} {articles?.length === 1 ? "article" : "articles"} published
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-4 bg-gray-50/50 border-b border-gray-100">
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2" data-testid="text-articles-heading">
          <Newspaper className="h-5 w-5 text-gray-400" />
          Articles by {author.displayName || "this author"}
        </h2>

        {!articles?.length ? (
          <div className="text-center py-12 text-gray-400">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-lg">No published articles yet.</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-100">
            {articles.map((article: any) => (
              <article key={article.id} className="py-6 group" data-testid={`card-author-article-${article.id}`}>
                <div className="flex gap-4">
                  {article.coverImage && (
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-32 h-20 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={article.podcast ? `/news/${article.podcast.id}/article/${article.id}` : "#"}
                      className="block"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight mb-1.5 cursor-pointer" data-testid={`text-article-title-${article.id}`}>
                        {article.title}
                      </h3>
                    </Link>
                    {article.summary && (
                      <p className="text-sm text-gray-500 leading-relaxed mb-2 line-clamp-2">{article.summary}</p>
                    )}
                    {article.description && !article.summary && (
                      <p className="text-sm text-gray-500 leading-relaxed mb-2 line-clamp-2">{article.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {article.podcast && (
                        <span className="font-medium text-gray-500">{article.podcast.title}</span>
                      )}
                      {article.publishedAt && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(article.publishedAt)}
                          </span>
                        </>
                      )}
                      {article.readingTime && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>{article.readingTime} min read</span>
                        </>
                      )}
                    </div>
                    {article.seoKeywords?.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {article.seoKeywords.slice(0, 4).map((kw: string, i: number) => (
                          <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link
                    href={article.podcast ? `/news/${article.podcast.id}/article/${article.id}` : "#"}
                    className="flex-shrink-0 self-center"
                  >
                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors cursor-pointer" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
