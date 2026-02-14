import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Bookmark, Play, ChevronRight, TrendingUp, Newspaper, Video, Headphones } from "lucide-react";
import { useReadLater } from "@/hooks/use-read-later";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { useRef, useState, useEffect } from "react";

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

function BookmarkButton({ article, podcastId, podcastTitle }: { article: any; podcastId?: string; podcastTitle?: string }) {
  const { isSaved, toggleArticle } = useReadLater();
  const saved = isSaved(article.id);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleArticle({
          id: article.id,
          title: article.title,
          description: article.description,
          coverImage: article.coverImage,
          podcastId: podcastId || "",
          podcastTitle: podcastTitle || "",
          readingTime: article.readingTime,
          publishedAt: article.publishedAt,
        });
      }}
      className={`p-2 rounded-full transition-all ${
        saved
          ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
          : "text-gray-400 hover:text-amber-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100"
      }`}
      title={saved ? "Remove from Read Later" : "Save for later"}
      data-testid={`button-bookmark-${article.id}`}
    >
      <Bookmark className={`h-4 w-4 ${saved ? "fill-amber-600" : ""}`} />
    </button>
  );
}

function SectionNavTabs({ sections }: { sections: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el?.removeEventListener("scroll", checkScroll);
  }, [sections]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  if (!sections?.length) return null;

  return (
    <div className="relative bg-white border-b border-gray-200" data-testid="section-nav-tabs">
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-r from-white to-transparent flex items-center justify-center text-gray-400 hover:text-gray-700"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </button>
      )}
      <div className="max-w-7xl mx-auto px-4">
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto py-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {sections.map((section: any) => (
            <button
              key={section.id}
              onClick={() => {
                const el = document.querySelector(`[data-testid="news-section-${section.id}"]`);
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors whitespace-nowrap"
              data-testid={`tab-section-${section.id}`}
            >
              {section.name}
            </button>
          ))}
        </div>
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 bottom-0 z-10 w-8 bg-gradient-to-l from-white to-transparent flex items-center justify-center text-gray-400 hover:text-gray-700"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function HeroSection({ section }: { section: any }) {
  const item = section.items?.[0];
  if (!item) return null;

  const linkUrl = item.isEpisode
    ? `/listen/${item.podcastId}/episode/${item.id}`
    : `/news/${item.podcastId}/article/${item.id}`;

  return (
    <section className="mb-6" data-testid="news-section-hero">
      <Link href={linkUrl} className="block group">
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
          <div className="relative" style={{ minHeight: "360px" }}>
            {(item.coverImage || item.thumbnailUrl) ? (
              <img
                src={item.coverImage || item.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover absolute inset-0 group-hover:scale-[1.02] transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <Newspaper className="h-16 w-16 text-gray-500" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              {item.podcastTitle && (
                <span className="inline-block px-3 py-1 bg-amber-500 text-gray-900 text-[11px] font-bold uppercase tracking-wider rounded-full mb-3">
                  {item.podcastTitle}
                </span>
              )}
              <h2 className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight group-hover:text-amber-300 transition-colors" data-testid="text-hero-headline">
                {item.title}
              </h2>
              {item.description && (
                <p className="text-gray-300 text-sm sm:text-base mt-2 max-w-2xl line-clamp-2">{item.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
                {item.publishedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {timeAgo(item.publishedAt)}
                  </span>
                )}
                {item.readingTime && <span>{item.readingTime} min read</span>}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

function GridSection({ section }: { section: any }) {
  if (!section.items?.length) return null;
  return (
    <section className="mb-8" data-testid={`news-section-${section.id}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-amber-500 rounded-full" />
        <h2 className="text-lg font-bold text-gray-900">{section.name}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {section.items.map((item: any) => {
          const linkUrl = item.isEpisode
            ? `/listen/${item.podcastId}/episode/${item.id}`
            : `/news/${item.podcastId}/article/${item.id}`;
          return (
            <div key={item.id} className="relative group" data-testid={`card-news-${item.id}`}>
              <Link href={linkUrl} className="block">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  {section.showImages && (item.coverImage || item.thumbnailUrl) && (
                    <div className="relative aspect-[16/9] bg-gray-100 overflow-hidden">
                      <img
                        src={item.coverImage || item.thumbnailUrl}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {item.podcastTitle && (
                        <div className="absolute top-2.5 left-2.5">
                          <span className="px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full">
                            {item.podcastTitle}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-amber-600 transition-colors line-clamp-2 pr-8">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-gray-500 text-xs mt-1.5 line-clamp-2">{item.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2.5 text-[11px] text-gray-400">
                      {item.publishedAt && <span>{timeAgo(item.publishedAt)}</span>}
                      {item.readingTime && (
                        <>
                          <span className="text-gray-300">·</span>
                          <span>{item.readingTime} min</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              {!item.isEpisode && (
                <div className="absolute top-3 right-3 z-10">
                  <BookmarkButton article={item} podcastId={item.podcastId} podcastTitle={item.podcastTitle} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ListSection({ section }: { section: any }) {
  if (!section.items?.length) return null;
  return (
    <section className="mb-8" data-testid={`news-section-${section.id}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-amber-500 rounded-full" />
        <h2 className="text-lg font-bold text-gray-900">{section.name}</h2>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {section.items.map((item: any) => {
            const linkUrl = item.isEpisode
              ? `/listen/${item.podcastId}/episode/${item.id}`
              : `/news/${item.podcastId}/article/${item.id}`;
            return (
              <div key={item.id} className="relative group" data-testid={`card-news-${item.id}`}>
                <Link href={linkUrl} className="block">
                  <div className="flex gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-[15px] leading-snug group-hover:text-amber-600 transition-colors pr-8" data-testid={`text-news-title-${item.id}`}>
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                        {item.podcastTitle && (
                          <span className="text-amber-600 font-medium">{item.podcastTitle}</span>
                        )}
                        {item.publishedAt && (
                          <>
                            {item.podcastTitle && <span className="text-gray-300">·</span>}
                            <span>{timeAgo(item.publishedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {section.showImages && (item.coverImage || item.thumbnailUrl) && (
                      <img
                        src={item.coverImage || item.thumbnailUrl}
                        alt=""
                        className="w-[120px] h-[80px] rounded-lg object-cover flex-shrink-0 bg-gray-100"
                      />
                    )}
                  </div>
                </Link>
                {!item.isEpisode && (
                  <div className="absolute top-4 right-4 z-10">
                    <BookmarkButton article={item} podcastId={item.podcastId} podcastTitle={item.podcastTitle} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function NumberedListSection({ section }: { section: any }) {
  if (!section.items?.length) return null;
  return (
    <section className="mb-8" data-testid={`news-section-${section.id}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full">Trending</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{section.name}</h2>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {section.items.map((item: any, idx: number) => {
            const linkUrl = item.isEpisode
              ? `/listen/${item.podcastId}/episode/${item.id}`
              : `/news/${item.podcastId}/article/${item.id}`;
            return (
              <div key={item.id} className="relative group" data-testid={`card-trending-${item.id}`}>
                <Link href={linkUrl} className="block">
                  <div className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <span className="text-3xl font-black text-gray-200 w-8 text-right flex-shrink-0 leading-none mt-0.5 tabular-nums">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm leading-snug group-hover:text-amber-600 transition-colors pr-8">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
                        {item.podcastTitle && (
                          <span className="text-amber-600 font-medium">{item.podcastTitle}</span>
                        )}
                        {item.publishedAt && (
                          <>
                            {item.podcastTitle && <span className="text-gray-300">·</span>}
                            <span>{timeAgo(item.publishedAt)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function VideoCarouselSection({ section }: { section: any }) {
  if (!section.items?.length) return null;
  return (
    <section className="mb-8" data-testid={`news-section-${section.id}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-purple-500" />
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-full">Video</span>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{section.name}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {section.items.map((item: any) => (
          <Link
            key={item.id}
            href={`/listen/${item.podcastId}/episode/${item.id}`}
            className="block group"
            data-testid={`card-video-${item.id}`}
          >
            <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="relative aspect-video">
                {item.thumbnailUrl ? (
                  <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                ) : item.podcastCoverImage ? (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                    <img src={item.podcastCoverImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
                    <Video className="h-8 w-8 text-gray-500" />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-11 w-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play className="h-5 w-5 text-gray-900 ml-0.5" />
                  </div>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full uppercase">
                    <Video className="h-2.5 w-2.5" />
                    Video
                  </span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="font-semibold text-gray-900 text-xs leading-snug group-hover:text-amber-600 transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-[10px] mt-1.5 truncate">{item.podcastTitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function renderSection(section: any, index: number) {
  switch (section.sectionType) {
    case "hero":
      return <HeroSection key={section.id} section={section} />;
    case "grid":
      return <GridSection key={section.id} section={section} />;
    case "numbered_list":
      return <NumberedListSection key={section.id} section={section} />;
    case "carousel":
      return <VideoCarouselSection key={section.id} section={section} />;
    case "list":
    default:
      return <ListSection key={section.id} section={section} />;
  }
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

export default function PublicNewsPage() {
  const { data: branding } = usePublicBranding();
  const { data, isLoading } = useQuery({
    queryKey: ["/api/public/news-feed"],
    queryFn: async () => {
      const res = await fetch("/api/public/news-feed");
      if (!res.ok) throw new Error("Failed to load news");
      return res.json();
    },
  });

  const platformName = branding?.companyName || "MediaTech Empire";

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-6 bg-gray-200 rounded-lg" />
          <Skeleton className="h-[360px] w-full rounded-xl mb-6 bg-gray-200" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-xl bg-gray-200" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const sections = data?.sections || [];
  const namedSections = sections.filter((s: any) => s.sectionType !== "hero" && s.name);

  return (
    <div className="bg-gray-50 min-h-screen" data-testid="public-news-page">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900" data-testid="text-news-heading">
            {platformName} <span className="text-gray-400 font-normal">News</span>
          </h1>
        </div>
      </div>

      <SectionNavTabs sections={namedSections} />

      <div className="flex justify-center py-3 bg-white border-b border-gray-200">
        <AdPlaceholder width={970} height={250} label="Billboard Takeover" className="hidden lg:flex" />
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex lg:hidden" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {sections.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Newspaper className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No news sections configured yet.</p>
                <p className="text-gray-400 text-sm mt-1">An admin can set up the news layout from the Customize panel.</p>
              </div>
            ) : (
              <>
                {sections.map((section: any, idx: number) => (
                  <div key={section.id}>
                    {renderSection(section, idx)}
                    {idx === 0 && sections.length > 1 && (
                      <div className="flex justify-center my-5">
                        <AdPlaceholder width={728} height={90} label="Mid-Content Leaderboard" className="hidden md:flex" />
                        <AdPlaceholder width={320} height={100} label="Mid-Content Mobile" className="md:hidden" />
                      </div>
                    )}
                    {idx === 2 && sections.length > 3 && (
                      <div className="flex justify-center my-5">
                        <AdPlaceholder width={728} height={90} label="Mid-Content 2" className="hidden md:flex" />
                        <AdPlaceholder width={320} height={100} label="Mid-Content Mobile 2" className="md:hidden" />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          <aside className="hidden lg:block w-[300px] shrink-0" data-testid="news-sidebar-takeover">
            <div className="sticky top-20 space-y-5">
              <AdPlaceholder width={300} height={600} label="Page Takeover Skyscraper" />

              {data?.podcasts?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Our Shows</h3>
                  </div>
                  <div className="space-y-2">
                    {data.podcasts.slice(0, 5).map((p: any) => (
                      <Link
                        key={p.id}
                        href={`/show/${p.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        data-testid={`sidebar-show-${p.id}`}
                      >
                        {p.coverImage ? (
                          <img src={p.coverImage} alt="" className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Headphones className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700 group-hover:text-amber-600 transition-colors truncate flex-1">
                          {p.title}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <AdPlaceholder width={300} height={250} label="Sidebar Rectangle" />
            </div>
          </aside>
        </div>
      </main>

      <div className="flex justify-center py-5 bg-white border-t border-gray-200">
        <AdPlaceholder width={728} height={90} label="Bottom Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={100} label="Bottom Mobile" className="md:hidden" />
      </div>
    </div>
  );
}
