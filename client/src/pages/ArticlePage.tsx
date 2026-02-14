import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, ChevronRight, Clock, Mail, Facebook, Linkedin, Link2, Printer, MessageSquare, Check, Send, User, Bookmark, Sparkles, Share2, X as XClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { InlineSubscribeWidget, SidebarSubscribeWidget, StickyBottomSubscribeBar } from "@/components/SubscriberWidgets";
import { useSubscription } from "@/hooks/use-subscription";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { useReadLater } from "@/hooks/use-read-later";
import { useReadingProgress } from "@/hooks/use-reading-progress";
import { useReadingHistory } from "@/hooks/use-reading-history";
import { ArticlePreviewPopup } from "@/components/ArticlePreviewPopup";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours === 1 ? "about an hour" : hours + " hours"} ago`;
  const days = Math.floor(hours / 24);
  return `${days === 1 ? "yesterday" : days + " days ago"}`;
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}


function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
    </svg>
  );
}

function ShareBar({ title, shareUrl, compact, description }: { title: string; shareUrl: string; compact?: boolean; description?: string }) {
  const [copied, setCopied] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description || title, url: shareUrl });
      } catch {}
    }
  };

  const primaryItems = [
    {
      label: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      bg: "bg-[#1877F2]",
      hoverBg: "hover:bg-[#166FE5]",
    },
    {
      label: "X",
      icon: <XIcon className="h-3.5 w-3.5" />,
      href: `https://x.com/share?text=${encodedTitle}&url=${encodedUrl}`,
      bg: "bg-black",
      hoverBg: "hover:bg-gray-800",
    },
    {
      label: "LinkedIn",
      icon: <Linkedin className="h-4 w-4" />,
      href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      bg: "bg-[#0A66C2]",
      hoverBg: "hover:bg-[#0959A8]",
    },
    {
      label: "WhatsApp",
      icon: <WhatsAppIcon className="h-4 w-4" />,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      bg: "bg-[#25D366]",
      hoverBg: "hover:bg-[#20BD5A]",
    },
  ];

  const moreItems = [
    {
      label: "Reddit",
      icon: <RedditIcon className="h-4 w-4" />,
      href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      bg: "bg-[#FF4500]",
      hoverBg: "hover:bg-[#E63E00]",
    },
    {
      label: "Telegram",
      icon: <TelegramIcon className="h-4 w-4" />,
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      bg: "bg-[#0088CC]",
      hoverBg: "hover:bg-[#007AB8]",
    },
    {
      label: "Pinterest",
      icon: <PinterestIcon className="h-4 w-4" />,
      href: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedDescription}`,
      bg: "bg-[#E60023]",
      hoverBg: "hover:bg-[#CC001F]",
    },
    {
      label: "Email",
      icon: <Mail className="h-4 w-4" />,
      href: `mailto:?subject=${encodedTitle}&body=Check%20this%20out:%20${encodedUrl}`,
      bg: "bg-gray-600",
      hoverBg: "hover:bg-gray-700",
    },
    {
      label: "Text",
      icon: <MessageSquare className="h-4 w-4" />,
      href: `sms:?body=${encodedTitle}%20${encodedUrl}`,
      bg: "bg-green-600",
      hoverBg: "hover:bg-green-700",
    },
  ];

  const btnSize = compact ? "h-8 w-8" : "h-9 w-9";

  return (
    <div className="relative" data-testid="share-bar">
      <div className={`flex items-center flex-wrap ${compact ? "gap-1" : "gap-1.5"}`}>
        {primaryItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            title={`Share on ${item.label}`}
            className={`inline-flex items-center justify-center rounded-full text-white transition-all duration-200 shadow-sm ${item.bg} ${item.hoverBg} ${btnSize}`}
            data-testid={`button-share-${item.label.toLowerCase()}`}
          >
            {item.icon}
          </a>
        ))}
        <button
          onClick={handleCopyLink}
          title="Copy link"
          className={`inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:bg-gray-100 ${btnSize}`}
          data-testid="button-copy-link"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
        </button>
        {typeof navigator !== "undefined" && navigator.share && (
          <button
            onClick={handleNativeShare}
            title="Share"
            className={`inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:bg-gray-100 ${btnSize}`}
            data-testid="button-native-share"
          >
            <Share2 className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => setShowMore(!showMore)}
          title="More sharing options"
          className={`inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-all duration-200 hover:bg-gray-100 text-xs font-bold ${btnSize}`}
          data-testid="button-share-more"
        >
          •••
        </button>
      </div>

      {showMore && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200" data-testid="share-more-menu">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">More ways to share</span>
              <button onClick={() => setShowMore(false)} className="text-gray-400 hover:text-gray-600" data-testid="button-close-share-more">
                <XClose className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-1">
              {moreItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.label === "Email" || item.label === "Text" ? "_self" : "_blank"}
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  data-testid={`button-share-more-${item.label.toLowerCase()}`}
                >
                  <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full text-white ${item.bg}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{item.label}</span>
                </a>
              ))}
              <button
                onClick={() => { window.print(); setShowMore(false); }}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group w-full"
                data-testid="button-share-more-print"
              >
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full text-white bg-gray-500">
                  <Printer className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Print</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FloatingShareButton({ title, shareUrl, description }: { title: string; shareUrl: string; description?: string }) {
  const [open, setOpen] = useState(false);

  const handleFloatingClick = async () => {
    if (!open && typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: description || title, url: shareUrl });
        return;
      } catch {
        setOpen(true);
        return;
      }
    }
    setOpen(!open);
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);

  const quickLinks = [
    { label: "Facebook", icon: <Facebook className="h-4 w-4" />, href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, bg: "bg-[#1877F2]" },
    { label: "X", icon: <XIcon className="h-3.5 w-3.5" />, href: `https://x.com/share?text=${encodedTitle}&url=${encodedUrl}`, bg: "bg-black" },
    { label: "WhatsApp", icon: <WhatsAppIcon className="h-4 w-4" />, href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`, bg: "bg-[#25D366]" },
    { label: "LinkedIn", icon: <Linkedin className="h-4 w-4" />, href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`, bg: "bg-[#0A66C2]" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 print:hidden" data-testid="floating-share">
      {open && (
        <>
          <div className="fixed inset-0" onClick={() => setOpen(false)} />
          <div className="absolute bottom-14 right-0 flex flex-col gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {quickLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`Share on ${item.label}`}
                className={`inline-flex items-center justify-center h-10 w-10 rounded-full text-white shadow-lg transition-transform hover:scale-110 ${item.bg}`}
                data-testid={`floating-share-${item.label.toLowerCase()}`}
              >
                {item.icon}
              </a>
            ))}
          </div>
        </>
      )}
      <button
        onClick={handleFloatingClick}
        className="h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 flex items-center justify-center hover:scale-105"
        title="Share this article"
        data-testid="button-floating-share"
      >
        {open ? <XClose className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
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

      <form onSubmit={handleSubmit} className="mb-8 bg-white rounded-xl border border-gray-200 p-5 shadow-sm" data-testid="form-add-comment">
        <div className="mb-3">
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            required
            maxLength={100}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors"
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
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white transition-colors resize-none"
            data-testid="input-comment-content"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={addComment.isPending || !authorName.trim() || !content.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

function ReadingProgressBar({ progress }: { progress: number }) {
  if (progress <= 0) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200/50 print:hidden" data-testid="reading-progress-bar">
      <div
        className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
      {progress > 5 && (
        <div className="absolute right-3 -bottom-6 bg-gray-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none" style={{ opacity: progress > 0 && progress < 100 ? 0.7 : 0 }}>
          {progress}%
        </div>
      )}
    </div>
  );
}

function RecommendedArticles({ currentArticleId, podcastId }: { currentArticleId: string; podcastId?: string }) {
  const { getReadArticleIds } = useReadingHistory();
  const readIds = getReadArticleIds();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["/api/content-pieces/recommendations", readIds.slice(0, 20)],
    queryFn: async () => {
      const res = await fetch("/api/content-pieces/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readArticleIds: readIds.slice(0, 20), limit: 6 }),
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = (recommendations || []).filter((r: any) => r.id !== currentArticleId);

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="recommendations-loading">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-16 w-16 rounded-lg bg-gray-200 shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2 bg-gray-200" />
              <Skeleton className="h-3 w-2/3 bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!filtered.length) return null;

  return (
    <div data-testid="recommended-articles">
      {filtered.slice(0, 4).map((rec: any) => (
        <ArticlePreviewPopup key={rec.id} article={rec} podcastId={podcastId}>
          <Link
            href={`/news/${rec.podcastId || podcastId}/article/${rec.id}`}
            className="flex gap-3 py-3 border-b border-gray-100 last:border-0 group cursor-pointer"
            data-testid={`recommended-article-${rec.id}`}
          >
            {rec.coverImage ? (
              <img src={rec.coverImage} alt="" className="h-16 w-16 rounded-lg object-cover bg-gray-100 shrink-0 group-hover:opacity-80 transition-opacity" />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                <Mic className="h-5 w-5 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                {rec.title}
              </h4>
              <div className="flex items-center gap-2 mt-1">
                {rec.podcastTitle && (
                  <span className="text-[11px] text-gray-500 truncate">{rec.podcastTitle}</span>
                )}
                {rec.readingTime && (
                  <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                    <Clock className="h-3 w-3" /> {rec.readingTime} min
                  </span>
                )}
              </div>
            </div>
          </Link>
        </ArticlePreviewPopup>
      ))}
    </div>
  );
}

function RecommendedArticlesBottom({ currentArticleId, podcastId }: { currentArticleId: string; podcastId?: string }) {
  const { getReadArticleIds } = useReadingHistory();
  const readIds = getReadArticleIds();

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["/api/content-pieces/recommendations", readIds.slice(0, 20)],
    queryFn: async () => {
      const res = await fetch("/api/content-pieces/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readArticleIds: readIds.slice(0, 20), limit: 6 }),
      });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = (recommendations || []).filter((r: any) => r.id !== currentArticleId);
  if (isLoading || !filtered.length) return null;

  return (
    <div className="mt-10 pt-8 border-t border-gray-200" data-testid="recommended-articles-bottom">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-blue-500" />
        Recommended For You
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.slice(0, 6).map((rec: any) => (
          <ArticlePreviewPopup key={rec.id} article={rec} podcastId={podcastId}>
            <Link
              href={`/news/${rec.podcastId || podcastId}/article/${rec.id}`}
              className="group bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer block"
              data-testid={`recommended-bottom-${rec.id}`}
            >
              {rec.coverImage ? (
                <div className="h-32 overflow-hidden">
                  <img src={rec.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                  <Mic className="h-8 w-8 text-gray-300" />
                </div>
              )}
              <div className="p-3">
                <h4 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {rec.title}
                </h4>
                <div className="flex items-center gap-2 mt-2">
                  {rec.podcastTitle && (
                    <span className="text-[11px] text-gray-500 truncate">{rec.podcastTitle}</span>
                  )}
                  {rec.readingTime && (
                    <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                      <Clock className="h-3 w-3" /> {rec.readingTime} min
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </ArticlePreviewPopup>
        ))}
      </div>
    </div>
  );
}

export default function ArticlePage() {
  const params = useParams<{ podcastId: string; articleId: string }>();
  const { isSubscribed, recommendations, subscriberName } = useSubscription(params.podcastId);
  const { isSaved, toggleArticle } = useReadLater();
  const articleContentRef = useRef<HTMLElement>(null);
  const progress = useReadingProgress(articleContentRef);
  const { recordRead } = useReadingHistory();

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

  useEffect(() => {
    if (article && params.podcastId) {
      recordRead({
        id: article.id,
        title: article.title,
        type: article.type || "article",
        episodeId: article.episodeId,
        podcastId: params.podcastId,
        coverImage: article.coverImage,
      });
    }
  }, [article?.id]);

  if (articleLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <Skeleton className="h-10 w-3/4 mb-4 bg-gray-200" />
            <Skeleton className="h-4 w-48 mb-8 bg-gray-100" />
            <Skeleton className="h-5 w-full mb-3 bg-gray-100" />
            <Skeleton className="h-5 w-full mb-3 bg-gray-100" />
            <Skeleton className="h-5 w-3/4 mb-6 bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (articleError || !article) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center py-20">
        <div className="text-center bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Article not found</h1>
          <p className="text-gray-500 mb-4">This article doesn't exist or has been removed.</p>
          <Link href="/news" className="text-blue-600 hover:underline text-sm">Back to News</Link>
        </div>
      </div>
    );
  }

  const podcast = podcastData;
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const paragraphs = article.body ? article.body.split("\n\n") : [];

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="article-page">
      <ReadingProgressBar progress={progress} />

      {progress > 10 && (
        <FloatingShareButton title={article.title} shareUrl={shareUrl} description={article.description || undefined} />
      )}

      <nav className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center space-x-1 text-sm text-gray-500 py-3">
            <Link href="/news" className="hover:text-gray-900 cursor-pointer">{podcast?.title || "News"}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium truncate max-w-[300px]">{article.title}</span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 mt-4 flex justify-center print:hidden">
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 max-w-[720px]">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <article ref={articleContentRef} data-testid={`article-detail-${article.id}`}>
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
                      {article.author ? (
                        <>
                          {article.author.profilePhoto ? (
                            <img src={article.author.profilePhoto} alt={article.author.displayName} className="h-6 w-6 rounded-full object-cover" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-900 flex items-center justify-center">
                              <User className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <Link href={`/author/${article.author.id}`} className="font-medium text-gray-700 hover:text-blue-600 hover:underline cursor-pointer" data-testid="link-article-author">
                            {article.author.displayName || "Staff Writer"}
                          </Link>
                        </>
                      ) : (
                        <>
                          {podcast?.coverImage ? (
                            <img src={podcast.coverImage} alt={podcast?.title} className="h-6 w-6 rounded-full object-cover" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-gray-900 flex items-center justify-center">
                              <Mic className="h-3 w-3 text-white" />
                            </div>
                          )}
                          <span className="font-medium text-gray-700">{podcast?.host || "Editorial Team"}</span>
                        </>
                      )}
                    </div>
                    <span className="mx-3 text-gray-300">|</span>
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    <time>{article.publishedAt ? timeAgo(article.publishedAt) : "Just now"}</time>
                  </div>

                  <div className="border-t border-b border-gray-100 py-3 flex items-center justify-between">
                    <ShareBar title={article.title} shareUrl={shareUrl} description={article.description || undefined} />
                    <button
                      onClick={() =>
                        toggleArticle({
                          id: article.id,
                          title: article.title,
                          description: article.description,
                          coverImage: article.coverImage,
                          podcastId: params.podcastId!,
                          podcastTitle: podcast?.title,
                          readingTime: article.readingTime,
                          publishedAt: article.publishedAt,
                        })
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isSaved(article.id)
                          ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                      data-testid="button-read-later"
                    >
                      <Bookmark className={`h-4 w-4 ${isSaved(article.id) ? "fill-amber-600" : ""}`} />
                      {isSaved(article.id) ? "Saved" : "Read Later"}
                    </button>
                  </div>
                </header>

                {article.coverImage && (
                  <div className="mb-8">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full rounded-lg object-cover max-h-[400px] bg-gray-100"
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
                                isSubscribed={isSubscribed}
                                recommendations={recommendations}
                                subscriberName={subscriberName}
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
                  <ShareBar title={article.title} shareUrl={shareUrl} description={article.description || undefined} />
                </div>

                <RecommendedArticlesBottom currentArticleId={article.id} podcastId={params.podcastId} />

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
                    <Link href="/news">
                      <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50" data-testid="button-more-stories">
                        More Stories
                      </Button>
                    </Link>
                  </div>
                </footer>
              </article>
            </div>
          </div>

          <aside className="hidden lg:block w-[300px] shrink-0 print:hidden" data-testid="article-sidebar">
            <div className="sticky top-20 space-y-6">
              <SidebarSubscribeWidget
                podcastId={podcast?.id}
                podcastTitle={podcast?.title}
                podcastImage={podcast?.coverImage}
                source="article_sidebar"
                isSubscribed={isSubscribed}
                recommendations={recommendations}
                subscriberName={subscriberName}
              />

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  Recommended For You
                </h3>
                <RecommendedArticles currentArticleId={article.id} podcastId={params.podcastId} />
              </div>

              <AdPlaceholder width={300} height={250} label="Sidebar Rectangle" />

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
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
                <Link href="/news">
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs border-gray-300 rounded-lg" data-testid="button-sidebar-all-stories">
                    View All Stories
                  </Button>
                </Link>
              </div>

              <AdPlaceholder width={300} height={600} label="Sidebar Half Page" />
            </div>
          </aside>
        </div>
      </main>

      <StickyBottomSubscribeBar
        podcastId={podcast?.id}
        podcastTitle={podcast?.title}
        source="article_sticky"
        isSubscribed={isSubscribed}
        recommendations={recommendations}
        subscriberName={subscriberName}
      />
    </div>
  );
}
