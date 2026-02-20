import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Mic, Play, Clock, Users, Headphones, Video, FileText, ChevronRight, ArrowRight, Zap, ChevronLeft, Bookmark, TrendingUp, Newspaper } from "lucide-react";
import { ArticlePreviewPopup } from "@/components/ArticlePreviewPopup";
import { useReadLater } from "@/hooks/use-read-later";
import type { HeroSlide } from "@shared/schema";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import PollWidget from "@/components/widgets/PollWidget";
import EventsWidget from "@/components/widgets/EventsWidget";

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
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] font-bold rounded-full uppercase">
        <Video className="h-2.5 w-2.5" />
        Video
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full uppercase">
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
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ height: "clamp(220px, 40vw, 420px)" }}>
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      ))}

      <div className="absolute bottom-0 left-0 right-0 z-10 p-5 sm:p-8">
        {slide?.title && (
          <h2
            className="text-foreground text-xl sm:text-2xl lg:text-4xl font-bold tracking-tight leading-tight mb-2"
            data-testid="text-hero-carousel-title"
          >
            {slide.title}
          </h2>
        )}
        {slide?.subtitle && (
          <p className="text-foreground/80 text-sm sm:text-base max-w-xl mb-3" data-testid="text-hero-carousel-subtitle">
            {slide.subtitle}
          </p>
        )}
        {slide?.linkUrl && (
          <span
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider text-gray-950 rounded-full hover:brightness-110 transition-all"
            style={{ backgroundColor: primaryColor }}
            data-testid="btn-hero-cta"
          >
            {slide.linkText || "Learn More"}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      {slides.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goPrev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/60 transition-all"
            aria-label="Previous slide"
            data-testid="btn-hero-prev"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goNext(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-9 w-9 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background/60 transition-all"
            aria-label="Next slide"
            data-testid="btn-hero-next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute bottom-3 right-5 z-20 flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrent(idx); }}
                className={`transition-all rounded-full ${
                  idx === current ? "w-6 h-2" : "w-2 h-2 bg-card/40 hover:bg-card/60"
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
        <a href={slide.linkUrl} target="_blank" rel="noopener noreferrer" className="block"
          onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} data-testid="hero-carousel">
          {slideContent}
        </a>
      );
    }
    return (
      <Link href={slide.linkUrl} className="block"
        onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} data-testid="hero-carousel">
        {slideContent}
      </Link>
    );
  }

  return (
    <div onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} data-testid="hero-carousel">
      {slideContent}
    </div>
  );
}

function ArticleCardCompact({ article }: { article: any }) {
  const { isSaved, toggleArticle } = useReadLater();
  const saved = isSaved(article.id);

  return (
    <ArticlePreviewPopup article={article} podcastId={article.podcastId}>
      <div className="relative group" data-testid={`card-article-${article.id}`}>
        <Link href={`/news/${article.podcastId}/article/${article.id}`} className="block">
          <div className="bg-card rounded-xl border border-border hover:border-border hover:shadow-md transition-all overflow-hidden">
            {article.coverImage && (
              <div className="aspect-[16/9] overflow-hidden bg-muted">
                <img src={article.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{article.podcastTitle}</span>
              </div>
              <h3 className="font-bold text-foreground text-sm leading-snug group-hover:text-amber-600 transition-colors line-clamp-2 pr-6" data-testid={`text-art-title-${article.id}`}>
                {article.title}
              </h3>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                {article.readingTime && <span>{article.readingTime} min read</span>}
                {article.publishedAt && (
                  <>
                    <span className="text-muted-foreground">|</span>
                    <span>{timeAgo(article.publishedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
        <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleArticle({
            id: article.id, title: article.title, description: article.description,
            coverImage: article.coverImage, podcastId: article.podcastId,
            podcastTitle: article.podcastTitle, readingTime: article.readingTime,
            publishedAt: article.publishedAt,
          });
        }}
        className={`absolute top-3 right-3 p-1.5 rounded-full transition-all ${
          saved ? "text-amber-600 bg-amber-50 hover:bg-amber-100" : "text-foreground/80 hover:text-amber-500 hover:bg-card/80 opacity-0 group-hover:opacity-100"
        }`}
        data-testid={`button-bookmark-${article.id}`}
      >
        <Bookmark className={`h-4 w-4 ${saved ? "fill-amber-600" : ""}`} />
      </button>
      </div>
    </ArticlePreviewPopup>
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
      <div className="bg-background">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <Skeleton className="h-[300px] w-full rounded-2xl mb-6 bg-muted" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl bg-muted" />
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
  const latestEpisodes = episodes.slice(1, 9);
  const latestArticles = articles.slice(0, 8);

  return (
    <div className="bg-background" data-testid="audience-home">
      <div className="max-w-[1400px] mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <div className="lg:col-span-2">
            <HeroCarousel primaryColor={primaryColor} />
          </div>

          {featuredEpisode && (
            <div className="hidden lg:block">
              <Link
                href={`/listen/${featuredEpisode.podcastId}/episode/${featuredEpisode.id}`}
                className="block group h-full"
                data-testid="card-featured-episode"
              >
                <div className="relative rounded-2xl overflow-hidden bg-background h-full" style={{ minHeight: "220px" }}>
                  {featuredEpisode.thumbnailUrl ? (
                    <img src={featuredEpisode.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity absolute inset-0" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-background to-background flex items-center justify-center">
                      <Headphones className="h-16 w-16 text-foreground/80" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4 flex items-center gap-2">
                    <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full" style={{ backgroundColor: primaryColor, color: "#111" }}>
                      Now Playing
                    </span>
                    <EpisodeTypeBadge type={featuredEpisode.episodeType || "audio"} />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-14 w-14 rounded-full bg-card/90 flex items-center justify-center shadow-xl">
                      <Play className="h-6 w-6 text-foreground ml-0.5" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-foreground font-bold text-base leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors" data-testid="text-featured-title">
                      {featuredEpisode.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{featuredEpisode.podcastTitle}</span>
                      {featuredEpisode.duration && (
                        <>
                          <span className="text-muted-foreground">|</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{featuredEpisode.duration}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
          <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
        </div>

        {latestEpisodes.length > 0 && (
          <section className="mb-10" data-testid="section-latest-episodes">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                  <Headphones className="h-3.5 w-3.5 text-gray-900" />
                </div>
                Latest Episodes
              </h2>
              <Link href="/podcasts" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: primaryColor }} data-testid="link-all-episodes">
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {latestEpisodes.map((ep: any) => (
                <Link
                  key={ep.id}
                  href={`/listen/${ep.podcastId}/episode/${ep.id}`}
                  className="block group"
                  data-testid={`card-episode-${ep.id}`}
                >
                  <div className="rounded-xl border border-border hover:border-border hover:shadow-md transition-all overflow-hidden bg-card">
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {ep.thumbnailUrl ? (
                        <img src={ep.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : ep.podcastCoverImage ? (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted">
                          <img src={ep.podcastCoverImage} alt="" className="h-16 w-16 rounded-xl object-cover shadow-sm" />
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <Headphones className="h-10 w-10 text-foreground/80" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <EpisodeTypeBadge type={ep.episodeType || "audio"} />
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-11 w-11 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: primaryColor }}>
                          <Play className="h-5 w-5 text-gray-900 ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-bold text-foreground text-xs leading-snug truncate group-hover:text-amber-600 transition-colors" data-testid={`text-ep-title-${ep.id}`}>
                        {ep.title}
                      </h3>
                      <p className="text-muted-foreground text-[11px] mt-1 truncate">{ep.podcastTitle}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-muted-foreground">
                        {ep.publishedAt && <span>{timeAgo(ep.publishedAt)}</span>}
                        {ep.duration && (
                          <>
                            <span className="text-muted-foreground">|</span>
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

        <div className="flex justify-center mb-6">
          <AdPlaceholder width={728} height={90} label="Mid-Content" className="hidden md:flex" />
          <AdPlaceholder width={320} height={100} label="Mid-Content Mobile" className="md:hidden" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-start gap-6">
              <PollWidget />
              <div className="hidden lg:flex flex-col justify-center py-4">
                <h3 className="text-lg font-bold text-foreground mb-2">Have Your Say</h3>
                <p className="text-sm text-muted-foreground mb-3">Vote on today's poll and see what the community thinks.</p>
                <Link href="/polls" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: primaryColor }}>
                  See all polls <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card/50 p-4">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" /> Upcoming Events
            </h3>
            <EventsWidget limit={3} />
          </div>
        </div>

        {latestArticles.length > 0 && (
          <section className="mb-10" data-testid="section-latest-articles">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center">
                  <Newspaper className="h-3.5 w-3.5 text-foreground" />
                </div>
                Latest Stories
              </h2>
              <Link href="/news" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: primaryColor }} data-testid="link-all-articles">
                All news <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestArticles.map((article: any) => (
                <ArticleCardCompact key={article.id} article={article} />
              ))}
            </div>
          </section>
        )}

        {podcasts.length > 0 && (
          <section className="mb-8" data-testid="section-our-shows">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-background flex items-center justify-center">
                  <Mic className="h-3.5 w-3.5 text-foreground" />
                </div>
                Our Shows
              </h2>
              <Link href="/podcasts" className="text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all" style={{ color: primaryColor }} data-testid="link-all-shows">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {podcasts.map((p: any) => (
                <Link key={p.id} href={`/show/${p.id}`} className="block group" data-testid={`card-show-${p.id}`}>
                  <div className="text-center">
                    <div className="aspect-square rounded-full overflow-hidden bg-muted ring-2 ring-border group-hover:ring-4 transition-all mx-auto mb-2 shadow-md group-hover:shadow-lg" style={{ maxWidth: "140px" }}>
                      {p.coverImage ? (
                        <img src={p.coverImage} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted">
                          <Mic className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-foreground text-xs leading-snug truncate group-hover:text-amber-600 transition-colors" data-testid={`text-show-title-${p.id}`}>
                      {p.title}
                    </h3>
                    {p.subscribers && (
                      <p className="text-muted-foreground text-[10px] mt-0.5">{formatSubscribers(p.subscribers)} listeners</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="flex justify-center mb-4">
          <AdPlaceholder width={728} height={90} label="Bottom Leaderboard" className="hidden md:flex" />
          <AdPlaceholder width={320} height={100} label="Bottom Mobile" className="md:hidden" />
        </div>
      </div>
    </div>
  );
}
