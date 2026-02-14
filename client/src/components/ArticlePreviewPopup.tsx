import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Clock, Mic, ArrowRight, Eye } from "lucide-react";

interface ArticlePreviewData {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  body?: string | null;
  readingTime?: number | null;
  publishedAt?: string | null;
  podcastId?: string | null;
  podcastTitle?: string | null;
  type?: string | null;
  seoKeywords?: string[] | null;
}

interface ArticlePreviewPopupProps {
  article: ArticlePreviewData;
  podcastId?: string;
  children: React.ReactNode;
}

function timeAgoShort(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getExcerpt(body: string | null | undefined, maxLen = 180): string {
  if (!body) return "";
  const clean = body.replace(/#{1,6}\s/g, "").replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\n+/g, " ").trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen).replace(/\s\S*$/, "") + "...";
}

export function ArticlePreviewPopup({ article, podcastId, children }: ArticlePreviewPopupProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; placement: "bottom" | "top" }>({ top: 0, left: 0, placement: "bottom" });
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const enterTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const targetPodcastId = article.podcastId || podcastId;
  const articleUrl = `/news/${targetPodcastId}/article/${article.id}`;
  const excerpt = article.description || getExcerpt(article.body);
  const keywords = (article.seoKeywords || []).slice(0, 3);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popupHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placement = spaceBelow < popupHeight && rect.top > popupHeight ? "top" : "bottom";
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - 360));

    setPosition({
      top: placement === "bottom" ? rect.bottom + 8 : rect.top - popupHeight - 8,
      left,
      placement,
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (leaveTimeout.current) {
      clearTimeout(leaveTimeout.current);
      leaveTimeout.current = null;
    }
    enterTimeout.current = setTimeout(() => {
      calculatePosition();
      setVisible(true);
    }, 400);
  }, [calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (enterTimeout.current) {
      clearTimeout(enterTimeout.current);
      enterTimeout.current = null;
    }
    leaveTimeout.current = setTimeout(() => {
      setVisible(false);
    }, 200);
  }, []);

  const handlePopupEnter = useCallback(() => {
    if (leaveTimeout.current) {
      clearTimeout(leaveTimeout.current);
      leaveTimeout.current = null;
    }
  }, []);

  const handlePopupLeave = useCallback(() => {
    leaveTimeout.current = setTimeout(() => {
      setVisible(false);
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (enterTimeout.current) clearTimeout(enterTimeout.current);
      if (leaveTimeout.current) clearTimeout(leaveTimeout.current);
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="contents"
      >
        {children}
      </div>

      {visible && (
        <div
          ref={popupRef}
          onMouseEnter={handlePopupEnter}
          onMouseLeave={handlePopupLeave}
          className="fixed z-[60] w-[340px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ top: position.top, left: position.left }}
          data-testid={`article-preview-popup-${article.id}`}
        >
          {article.coverImage && (
            <div className="h-[140px] overflow-hidden relative">
              <img
                src={article.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {article.type && (
                <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 text-gray-700">
                  {article.type}
                </span>
              )}
            </div>
          )}

          <div className="p-4">
            {article.podcastTitle && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 mb-1 block">
                {article.podcastTitle}
              </span>
            )}
            <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-2">
              {article.title}
            </h3>

            {excerpt && (
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">
                {excerpt}
              </p>
            )}

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {keywords.map((kw) => (
                  <span key={kw} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                    {kw}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-3 text-[11px] text-gray-400">
                {article.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.readingTime} min read
                  </span>
                )}
                {article.publishedAt && (
                  <span>{timeAgoShort(article.publishedAt)}</span>
                )}
              </div>
              <Link
                href={articleUrl}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                data-testid={`preview-read-more-${article.id}`}
              >
                <Eye className="h-3 w-3" />
                Read
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
