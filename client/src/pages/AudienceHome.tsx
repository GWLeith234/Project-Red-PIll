import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Play, Clock, Users, Headphones, Video, FileText, ChevronRight, ArrowRight, Zap, ChevronLeft, Bookmark } from "lucide-react";
import { useReadLater } from "@/hooks/use-read-later";
import type { HeroSlide } from "@shared/schema";
import { AdPlaceholder } from "@/components/AdPlaceholder";

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

function usePublicBranding() {
  return useQuery({
    queryKey: ["/api/branding"],
    queryFn: async () => {
      const res = await fetch("/api/branding");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });
}

function EpisodeTypeBadge({ type }: { type: string }) {
  if (type === "video" || type === "both") {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded uppercase">
        <Video className="h-2.5 w-2.5" />
        {type === "both" ? "Video" : "Video"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase">
      <Headphones className="h-2.5 w-2.5" />
      Audio
    </span>
  );
}

function HeroCarousel({ primaryColor }: { primaryColor: string }) {
  const { data: slides = [] } = useQuery<HeroSlide[]>({
    queryKey: ["/api/public/hero-slides"],
    queryFn: async () => {
      const res = await fetch("/api/public/hero-slides");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goNext = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrent((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const goPrev = useCallback(() => {
    if (slides.length <= 1) return;
    setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const interval = setInterval(goNext, 6000);
    return () => clearInterval(interval);
  }, [isPaused, goNext, slides.length]);

  useEffect(() => {
    if (current >= slides.length && slides.length > 0) {
      setCurrent(0);
    }
  }, [slides.length, current]);

  if (slides.length === 0) return null;

  const slide = slides[current];

  const slideContent = (
    <div className="relative w-full overflow-hidden" style={{ height: "clamp(280px, 45vw, 520px)" }}>
      {slides.map((s, idx) => (
        <div
          key={s.id}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: idx === current ? 1 : 0, zIndex: idx === current ? 1 : 0 }}
        >
          <img
            src={s.imageUrl}
            alt={s.title || ""}
            className="w-full h-full object-cover"
            loading={idx === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        </div>
      ))}

      <div className="absolute bottom-0 left-0 right-0 z-10 p-6 sm:p-10 lg:p-14">
        <div className="max-w-7xl mx-auto">
          {slide?.title && (
            <h2
              className="text-white text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight leading-tight mb-2 drop-shadow-lg"
              style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
              data-testid="text-hero-carousel-title"
            >
              {slide.title}
            </h2>
          )}
          {slide?.subtitle && (
            <p
              className="text-gray-200 text-sm sm:text-base lg:text-lg max-w-2xl mb-4 drop-shadow"
              data-testid="text-hero-carousel-subtitle"
            >
              {slide.subtitle}
            </p>
          )}
          {slide?.linkUrl && (
            <span
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-gray-950 hover:brightness-110 transition-all shadow-lg"
              style={{ backgroundColor: primaryColor }}
              data-testid="btn-hero-cta"
            >
              {slide.linkText || "Learn More"}
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goPrev(); }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/50 transition-all"
            aria-label="Previous slide"
            data-testid="btn-hero-prev"
          >
            <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goNext(); }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/10 flex items-center justify-center text-white hover:bg-black/50 transition-all"
            aria-label="Next slide"
            data-testid="btn-hero-next"
          >
            <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>

          <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(idx); }}
                className={`transition-all rounded-full ${
                  idx === current
                    ? "w-8 h-2.5"
                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/60"
                }`}
                style={idx === current ? { backgroundColor: primaryColor } : undefined}
                aria-label={`Go to slide ${idx + 1}`}
                data-testid={`btn-hero-dot-${idx}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (slide?.linkUrl) {
    const isExternal = slide.linkUrl.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={slide.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          data-testid="hero-carousel"
        >
          {slideContent}
        </a>
      );
    }
    return (
      <Link
        href={slide.linkUrl}
        className="block"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        data-testid="hero-carousel"
      >
        {slideContent}
      </Link>
    );
  }

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      data-testid="hero-carousel"
    >
      {slideContent}
    </div>
  );
}

function ArticleCardWithBookmark({ article }: { article: any }) {
  const { isSaved, toggleArticle } = useReadLater();
  const saved = isSaved(article.id);

  return (
    <div className="relative group" data-testid={`card-article-${article.id}`}>
      <Link
        href={`/news/${article.podcastId}/article/${article.id}`}
        className="block"
      >
        <div className="flex gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
          {article.coverImage && (
            <img src={article.coverImage} alt="" className="w-24 h-24 sm:w-28 sm:h-20 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-amber-600 transition-colors line-clamp-2 pr-8" data-testid={`text-art-title-${article.id}`}>
              {article.title}
            </h3>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <span>{article.podcastTitle}</span>
              {article.readingTime && (
                <>
                  <span className="text-gray-200">|</span>
                  <span>{article.readingTime} min read</span>
                </>
              )}
              {article.publishedAt && (
                <>
                  <span className="text-gray-200">|</span>
                  <span>{timeAgo(article.publishedAt)}</span>
                </>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-300 self-center flex-shrink-0 group-hover:text-amber-500 transition-colors" />
        </div>
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
            podcastId: article.podcastId,
            podcastTitle: article.podcastTitle,
            readingTime: article.readingTime,
            publishedAt: article.publishedAt,
          });
        }}
        className={`absolute top-5 right-5 p-1.5 rounded-lg transition-all ${
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

export default function AudienceHome() {
  const { data: branding } = usePublicBranding();
  const { data: feed, isLoading } = useQuery({
    queryKey: ["/api/public/feed"],
    queryFn: async () => {
      const res = await fetch("/api/public/feed");
      if (!res.ok) throw new Error("Failed to load feed");
      return res.json();
    },
  });

  const platformName = branding?.companyName || "MediaTech Empire";
  const tagline = branding?.tagline || "AI-Powered Media Platform";
  const primaryColor = branding?.primaryColor || "#E5C100";

  if (isLoading) {
    return (
      <div className="bg-white">
        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-16">
          <div className="max-w-7xl mx-auto px-4">
            <Skeleton className="h-12 w-80 mb-4 bg-gray-800" />
            <Skeleton className="h-6 w-96 bg-gray-800" />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const episodes = feed?.episodes || [];
  const articles = feed?.articles || [];
  const podcasts = feed?.podcasts || [];
  const featuredEpisode = episodes[0];
  const latestEpisodes = episodes.slice(1, 7);
  const latestArticles = articles.slice(0, 6);

  return (
    <div className="bg-white" data-testid="audience-home">
      <HeroCarousel primaryColor={primaryColor} />

      <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5" style={{ color: primaryColor }} />
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: primaryColor }}>Now Streaming</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3" data-testid="text-hero-title">
                {platformName}
              </h1>
              <p className="text-gray-400 text-lg max-w-xl mb-6">{tagline}</p>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Mic className="h-4 w-4" />
                  {podcasts.length} Shows
                </span>
                <span className="text-gray-700">|</span>
                <span className="flex items-center gap-1">
                  <Headphones className="h-4 w-4" />
                  {episodes.length}+ Episodes
                </span>
                <span className="text-gray-700">|</span>
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {articles.length}+ Articles
                </span>
              </div>
            </div>

            {featuredEpisode && (
              <Link
                href={`/listen/${featuredEpisode.podcastId}/episode/${featuredEpisode.id}`}
                className="block w-full lg:w-[420px] flex-shrink-0 group"
                data-testid="card-featured-episode"
              >
                <div className="relative rounded-2xl overflow-hidden bg-gray-800 border border-gray-700/50">
                  {featuredEpisode.thumbnailUrl ? (
                    <img src={featuredEpisode.thumbnailUrl} alt="" className="w-full aspect-video object-cover opacity-60 group-hover:opacity-70 transition-opacity" />
                  ) : (
                    <div className="w-full aspect-video bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      {featuredEpisode.episodeType === "video" || featuredEpisode.episodeType === "both" ? (
                        <Video className="h-12 w-12 text-gray-600" />
                      ) : (
                        <Headphones className="h-12 w-12 text-gray-600" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded" style={{ backgroundColor: primaryColor, color: "#111" }}>
                      Latest
                    </span>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl">
                      <Play className="h-6 w-6 text-gray-900 ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <EpisodeTypeBadge type={featuredEpisode.episodeType || "audio"} />
                    <h3 className="text-white font-bold text-lg mt-2 line-clamp-2 leading-snug group-hover:text-amber-300 transition-colors" data-testid="text-featured-title">
                      {featuredEpisode.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                      <span>{featuredEpisode.podcastTitle}</span>
                      {featuredEpisode.duration && (
                        <>
                          <span className="text-gray-600">|</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{featuredEpisode.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center py-4 bg-gray-50/50 border-b border-gray-100">
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {latestEpisodes.length > 0 && (
          <section className="mb-14" data-testid="section-latest-episodes">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Headphones className="h-6 w-6 text-gray-400" />
                Latest Episodes
              </h2>
              <Link href="/podcasts" className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1" data-testid="link-all-episodes">
                Browse all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {latestEpisodes.map((ep: any) => (
                <Link
                  key={ep.id}
                  href={`/listen/${ep.podcastId}/episode/${ep.id}`}
                  className="block group"
                  data-testid={`card-episode-${ep.id}`}
                >
                  <div className="rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all overflow-hidden bg-white">
                    <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                      {ep.thumbnailUrl ? (
                        <img src={ep.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : ep.podcastCoverImage ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          <img src={ep.podcastCoverImage} alt="" className="h-16 w-16 rounded-xl object-cover shadow-sm" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50">
                          <Headphones className="h-10 w-10 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <EpisodeTypeBadge type={ep.episodeType || "audio"} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center shadow-lg">
                          <Play className="h-5 w-5 text-gray-900 ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug truncate group-hover:text-amber-600 transition-colors" data-testid={`text-ep-title-${ep.id}`}>
                        {ep.title}
                      </h3>
                      <p className="text-gray-500 text-xs mt-1 truncate">{ep.podcastTitle}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        {ep.publishedAt && <span>{timeAgo(ep.publishedAt)}</span>}
                        {ep.duration && (
                          <>
                            <span className="text-gray-200">|</span>
                            <span>{ep.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-center my-8">
          <AdPlaceholder width={728} height={90} label="Mid-Content Leaderboard" className="hidden md:flex" />
          <AdPlaceholder width={320} height={100} label="Mid-Content Mobile" className="md:hidden" />
        </div>

        {latestArticles.length > 0 && (
          <section className="mb-14" data-testid="section-latest-articles">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-gray-400" />
                Latest Articles
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {latestArticles.map((article: any) => (
                <ArticleCardWithBookmark key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-center my-8">
          <AdPlaceholder width={728} height={90} label="Bottom Leaderboard" className="hidden md:flex" />
          <AdPlaceholder width={320} height={100} label="Bottom Mobile" className="md:hidden" />
        </div>

        {podcasts.length > 0 && (
          <section data-testid="section-our-shows">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Mic className="h-6 w-6 text-gray-400" />
                Our Shows
              </h2>
              <Link href="/podcasts" className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1" data-testid="link-all-shows">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {podcasts.map((p: any) => (
                <Link key={p.id} href={`/show/${p.id}`} className="block group" data-testid={`card-show-${p.id}`}>
                  <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all">
                    <div className="aspect-square relative bg-gray-50 overflow-hidden">
                      {p.coverImage ? (
                        <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                          <Mic className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-3.5">
                      <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-amber-600 transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-gray-500 text-xs mt-0.5 truncate">with {p.host}</p>
                      {p.subscribers && (
                        <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {formatSubscribers(p.subscribers)}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
