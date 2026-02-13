import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, ChevronRight, Clock, ArrowLeft, Mail, Facebook, Linkedin, Link2, Printer, MessageSquare, Check, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { InlineSubscribeWidget, SidebarSubscribeWidget, StickyBottomSubscribeBar } from "@/components/SubscriberWidgets";

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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function AdPlaceholder({ width, height, label, className }: { width: number; height: number; label: string; className?: string }) {
  return (
    <div
      className={`bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 overflow-hidden ${className || ""}`}
      style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
      data-testid={`ad-slot-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-300 mb-1">Advertisement</span>
      <span className="text-xs font-mono font-medium text-gray-400">{width}×{height}</span>
      <span className="text-[10px] text-gray-300 mt-0.5">{label}</span>
    </div>
  );
}

function ShareBar({ title, shareUrl, compact }: { title: string; shareUrl: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareItems = [
    {
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
      color: "hover:bg-gray-700 hover:text-white",
    },
    {
      label: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-[#1877F2] hover:text-white",
    },
    {
      label: "X",
      icon: <XIcon className="h-3.5 w-3.5" />,
      href: `https://x.com/share?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:bg-black hover:text-white",
    },
    {
      label: "LinkedIn",
      icon: <Linkedin className="h-4 w-4" />,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      color: "hover:bg-[#0A66C2] hover:text-white",
    },
    {
      label: "Text",
      icon: <MessageSquare className="h-4 w-4" />,
      href: `sms:?body=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-green-600 hover:text-white",
    },
  ];

  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-1.5"}`} data-testid="share-bar">
      {shareItems.map((item) => (
        <a
          key={item.label}
          href={item.href}
          target={item.label === "Email" || item.label === "Text" ? "_self" : "_blank"}
          rel="noopener noreferrer"
          title={`Share via ${item.label}`}
          className={`inline-flex items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 transition-all duration-200 ${item.color} ${compact ? "h-8 w-8" : "h-9 w-9"}`}
          data-testid={`button-share-${item.label.toLowerCase()}`}
        >
          {item.icon}
        </a>
      ))}
      <button
        onClick={handleCopyLink}
        title="Copy link"
        className={`inline-flex items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:bg-gray-700 hover:text-white ${compact ? "h-8 w-8" : "h-9 w-9"}`}
        data-testid="button-copy-link"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
      </button>
      <button
        onClick={() => window.print()}
        title="Print"
        className={`inline-flex items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:bg-gray-700 hover:text-white ${compact ? "h-8 w-8" : "h-9 w-9"}`}
        data-testid="button-print"
      >
        <Printer className="h-4 w-4" />
      </button>
    </div>
  );
}

function CommentSection({ articleId }: { articleId: string }) {
  const queryClient = useQueryClient();
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");

  const { data: commentsData, isLoading } = useQuery({
    queryKey: ["/api/articles", articleId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/articles/${articleId}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      return res.json();
    },
  });

  const addComment = useMutation({
    mutationFn: async (data: { authorName: string; content: string }) => {
      const res = await fetch(`/api/articles/${articleId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/articles", articleId, "comments"] });
      setAuthorName("");
      setContent("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !content.trim()) return;
    addComment.mutate({ authorName: authorName.trim(), content: content.trim() });
  };

  const commentsList = commentsData || [];

  return (
    <div className="mt-10 pt-8 border-t border-gray-200" data-testid="comment-section">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2" data-testid="text-comments-heading">
        <MessageSquare className="h-5 w-5" />
        Comments {commentsList.length > 0 && <span className="text-sm font-normal text-gray-500">({commentsList.length})</span>}
      </h3>

      <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 border border-gray-200 p-4" data-testid="form-add-comment">
        <div className="mb-3">
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
            maxLength={100}
            className="w-full px-3 py-2 bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors"
            data-testid="input-comment-author"
          />
        </div>
        <div className="mb-3">
          <textarea
            placeholder="Share your thoughts..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            maxLength={2000}
            rows={3}
            className="w-full px-3 py-2 bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 transition-colors resize-none"
            data-testid="input-comment-content"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={addComment.isPending || !authorName.trim() || !content.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-submit-comment"
          >
            <Send className="h-3.5 w-3.5" />
            {addComment.isPending ? "Posting..." : "Post Comment"}
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="border-b border-gray-100 pb-4">
              <Skeleton className="h-4 w-32 mb-2 bg-gray-200" />
              <Skeleton className="h-4 w-full bg-gray-100" />
              <Skeleton className="h-4 w-2/3 mt-1 bg-gray-100" />
            </div>
          ))}
        </div>
      ) : commentsList.length === 0 ? (
        <div className="text-center py-8 text-gray-400" data-testid="text-no-comments">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-gray-100" data-testid="comments-list">
          {commentsList.map((comment: any) => (
            <div key={comment.id} className="py-4" data-testid={`comment-item-${comment.id}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-3.5 w-3.5 text-gray-500" />
                </div>
                <span className="text-sm font-semibold text-gray-900" data-testid={`text-comment-author-${comment.id}`}>
                  {comment.authorName}
                </span>
                <span className="text-xs text-gray-400">
                  {comment.createdAt ? timeAgo(comment.createdAt) : "Just now"}
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed pl-9" data-testid={`text-comment-content-${comment.id}`}>
                {comment.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Skeleton className="h-10 w-3/4 mb-4 bg-gray-200" />
          <Skeleton className="h-4 w-48 mb-8 bg-gray-100" />
          <Skeleton className="h-5 w-full mb-3 bg-gray-100" />
          <Skeleton className="h-5 w-full mb-3 bg-gray-100" />
          <Skeleton className="h-5 w-3/4 mb-6 bg-gray-100" />
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
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const paragraphs = article.body ? article.body.split("\n\n") : [];

  return (
    <div className="min-h-screen bg-white" data-testid="article-page">
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-3">
              {podcast?.coverImage ? (
                <img src={podcast.coverImage} alt={podcast?.title} className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center">
                  <Mic className="h-4 w-4 text-white" />
                </div>
              )}
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{podcast?.title || "News"}</h1>
            </div>
            <Link href={`/news/${params.podcastId}`} className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="link-back-news">
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Stories
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 mt-4 flex justify-center print:hidden">
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <nav className="border-b border-gray-100 bg-gray-50/50 mt-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center space-x-1 text-sm text-gray-500 py-3">
            <Link href={`/news/${params.podcastId}`} className="hover:text-gray-900 cursor-pointer">News</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium truncate max-w-[300px]">{article.title}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 max-w-[720px]">
            <article data-testid={`article-detail-${article.id}`}>
              <header className="mb-6">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4" data-testid="text-article-headline">
                  {article.title}
                </h1>

                {article.description && (
                  <p className="text-lg text-gray-500 leading-relaxed mb-5" data-testid="text-article-description">
                    {article.description}
                  </p>
                )}

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-3">
                    {podcast?.coverImage ? (
                      <img src={podcast.coverImage} alt={podcast?.title} className="h-6 w-6 rounded-full object-cover" />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-900 flex items-center justify-center">
                        <Mic className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <span className="font-medium text-gray-700">{podcast?.host || "Editorial Team"}</span>
                  </div>
                  <span className="mx-3 text-gray-300">|</span>
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  <time>{article.publishedAt ? timeAgo(article.publishedAt) : "Just now"}</time>
                </div>

                <div className="border-t border-b border-gray-100 py-3 flex items-center justify-between">
                  <ShareBar title={article.title} shareUrl={shareUrl} />
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
                {paragraphs.length > 0 ? (
                  paragraphs.map((paragraph: string, i: number) => (
                    <div key={i}>
                      <p className="text-gray-800 leading-relaxed mb-6 text-[17px]">
                        {paragraph}
                      </p>
                      {i === 1 && paragraphs.length > 3 && (
                        <>
                          <div className="flex justify-center my-8 print:hidden" data-testid="ad-inline-1">
                            <AdPlaceholder width={300} height={250} label="In-Article 1" />
                          </div>
                          <div className="print:hidden">
                            <InlineSubscribeWidget
                              podcastId={podcast?.id}
                              podcastTitle={podcast?.title}
                              source="article_inline"
                            />
                          </div>
                        </>
                      )}
                      {i === Math.floor(paragraphs.length * 0.7) && paragraphs.length > 5 && (
                        <div className="flex justify-center my-8 print:hidden" data-testid="ad-inline-2">
                          <AdPlaceholder width={336} height={280} label="In-Article 2" />
                        </div>
                      )}
                    </div>
                  ))
                ) : article.description ? (
                  <p className="text-gray-800 leading-relaxed mb-6 text-[17px]">
                    {article.description}
                  </p>
                ) : (
                  <p className="text-gray-400 italic">Full article content is being generated...</p>
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-3">Share this story</p>
                <ShareBar title={article.title} shareUrl={shareUrl} />
              </div>

              <CommentSection articleId={article.id} />

              <div className="flex justify-center my-8 print:hidden">
                <AdPlaceholder width={728} height={90} label="Bottom Leaderboard" className="hidden md:flex" />
                <AdPlaceholder width={320} height={100} label="Mobile Leaderboard" className="md:hidden" />
              </div>

              <footer className="mt-8 pt-8 border-t border-gray-200">
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
          </div>

          <aside className="hidden lg:block w-[300px] shrink-0 print:hidden" data-testid="article-sidebar">
            <div className="sticky top-20 space-y-6">
              <SidebarSubscribeWidget
                podcastId={podcast?.id}
                podcastTitle={podcast?.title}
                podcastImage={podcast?.coverImage}
                source="article_sidebar"
              />

              <AdPlaceholder width={300} height={250} label="Sidebar Rectangle" />

              <div className="border border-gray-100 bg-gray-50 p-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">About the Show</h3>
                <div className="flex items-center space-x-3 mb-3">
                  {podcast?.coverImage ? (
                    <img src={podcast.coverImage} alt={podcast?.title} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center">
                      <Mic className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{podcast?.title}</p>
                    <p className="text-gray-500 text-xs">Hosted by {podcast?.host}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {podcast?.subscribers ? `${(podcast.subscribers / 1000).toFixed(0)}K subscribers` : ""}
                </p>
                <Link href={`/news/${params.podcastId}`}>
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs border-gray-300" data-testid="button-sidebar-all-stories">
                    View All Stories
                  </Button>
                </Link>
              </div>

              <AdPlaceholder width={300} height={600} label="Sidebar Half Page" />
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-8 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4" />
              <span>{podcast?.title || "MediaTech"}</span>
            </div>
            <p>Powered by MediaTech Empire</p>
          </div>
        </div>
      </footer>

      <StickyBottomSubscribeBar
        podcastId={podcast?.id}
        podcastTitle={podcast?.title}
        source="article_sticky"
      />
    </div>
  );
}
