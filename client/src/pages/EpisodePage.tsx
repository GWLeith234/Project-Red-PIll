import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Mic, ArrowLeft, Clock, Play, Pause, ChevronRight, FileText, Video, MessageSquare, Share2, Headphones } from "lucide-react";
import { useState } from "react";
import { InlineSubscribeWidget, SidebarSubscribeWidget, StickyBottomSubscribeBar, EpisodeSubscribeWidget } from "@/components/SubscriberWidgets";

function formatDuration(duration: string | null) {
  if (!duration) return "";
  return duration;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours === 1 ? "about an hour" : hours + " hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days === 1 ? "yesterday" : days + " days ago"}`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const contentTypeIcons: Record<string, typeof FileText> = {
  article: FileText,
  video_clip: Video,
  social_post: MessageSquare,
  newsletter: Share2,
};

function AudioPlayerUI({ title, duration, podcastTitle }: { title: string; duration: string | null; podcastTitle: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  return (
    <div className="bg-gray-900 p-5 mb-8" data-testid="audio-player">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setPlaying(!playing)}
          className="h-12 w-12 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center flex-shrink-0 transition-colors"
          data-testid="button-play-pause"
        >
          {playing ? <Pause className="h-5 w-5 text-gray-900" /> : <Play className="h-5 w-5 text-gray-900 ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate" data-testid="text-player-title">{title}</p>
          <p className="text-gray-400 text-xs">{podcastTitle}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-gray-500 text-xs font-mono flex-shrink-0">
              {duration ? formatDuration(duration) : "--:--"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EpisodePage() {
  const params = useParams<{ podcastId: string; episodeId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/public/episodes", params.episodeId],
    queryFn: async () => {
      const res = await fetch(`/api/public/episodes/${params.episodeId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Skeleton className="h-10 w-3/4 mb-4 bg-gray-200" />
          <Skeleton className="h-4 w-48 mb-8 bg-gray-100" />
          <Skeleton className="h-20 w-full mb-6 bg-gray-100" />
          <Skeleton className="h-5 w-full mb-3 bg-gray-100" />
          <Skeleton className="h-5 w-3/4 mb-6 bg-gray-100" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Episode not found</h1>
          <p className="text-gray-500 mb-4">This episode doesn't exist or hasn't been published yet.</p>
          <Link href={`/listen/${params.podcastId}`} className="text-blue-600 hover:underline text-sm">Back to Episodes</Link>
        </div>
      </div>
    );
  }

  const { episode, podcast, contentPieces } = data;
  const articles = contentPieces?.filter((cp: any) => cp.type === "article" && cp.status === "ready") || [];
  const otherContent = contentPieces?.filter((cp: any) => cp.type !== "article" && cp.status === "ready") || [];

  return (
    <div className="min-h-screen bg-white" data-testid="episode-page">
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
              <h1 className="text-lg font-bold text-gray-900 leading-tight">{podcast?.title || "Podcast"}</h1>
            </div>
            <Link href={`/listen/${params.podcastId}`} className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors" data-testid="link-back-episodes">
              <ArrowLeft className="h-4 w-4 mr-1" />
              All Episodes
            </Link>
          </div>
        </div>
      </header>

      <nav className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center space-x-1 text-sm text-gray-500 py-3">
            <Link href={`/listen/${params.podcastId}`} className="hover:text-gray-900 cursor-pointer">Episodes</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium truncate max-w-[300px]">{episode.title}</span>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 max-w-[720px]">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-700 text-xs font-semibold uppercase tracking-wider">
                  <Headphones className="h-3 w-3" />
                  Episode
                </span>
                {episode.duration && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(episode.duration)}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3" data-testid="text-episode-title">
                {episode.title}
              </h1>
              <div className="flex items-center text-sm text-gray-500 mb-5">
                <div className="flex items-center space-x-3">
                  {podcast?.coverImage ? (
                    <img src={podcast.coverImage} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-gray-900 flex items-center justify-center">
                      <Mic className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <span className="font-medium text-gray-700">{podcast?.host || "Host"}</span>
                </div>
                <span className="mx-3 text-gray-300">|</span>
                <time>{episode.publishedAt ? timeAgo(episode.publishedAt) : "Recently"}</time>
              </div>
            </div>

            <AudioPlayerUI
              title={episode.title}
              duration={episode.duration}
              podcastTitle={podcast?.title || "Podcast"}
            />

            <InlineSubscribeWidget
              podcastId={podcast?.id}
              podcastTitle={podcast?.title}
              source="episode_inline"
            />

            {articles.length > 0 && (
              <div className="mt-8" data-testid="episode-articles">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-gray-400" />
                  Related Articles
                </h2>
                <div className="space-y-4">
                  {articles.map((article: any) => (
                    <Link
                      key={article.id}
                      href={`/news/${params.podcastId}/article/${article.id}`}
                      className="block"
                    >
                      <div className="group border border-gray-100 hover:border-gray-300 p-4 transition-colors cursor-pointer" data-testid={`link-article-${article.id}`}>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors mb-1" data-testid={`text-article-title-${article.id}`}>
                          {article.title}
                        </h3>
                        {article.description && (
                          <p className="text-gray-500 text-sm line-clamp-2">{article.description}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {otherContent.length > 0 && (
              <div className="mt-8" data-testid="episode-content">
                <h2 className="text-lg font-bold text-gray-900 mb-4">From This Episode</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {otherContent.map((piece: any) => {
                    const Icon = contentTypeIcons[piece.type] || FileText;
                    return (
                      <div key={piece.id} className="border border-gray-100 p-3" data-testid={`content-piece-${piece.id}`}>
                        <Icon className="h-4 w-4 text-gray-400 mb-2" />
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2">{piece.title}</p>
                        <p className="text-[10px] text-gray-400 uppercase mt-1">{piece.type.replace("_", " ")}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-10">
              <EpisodeSubscribeWidget
                podcastId={podcast?.id}
                podcastTitle={podcast?.title}
                podcastImage={podcast?.coverImage}
                source="episode_bottom"
              />
            </div>

            <footer className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {podcast?.coverImage ? (
                    <img src={podcast.coverImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center">
                      <Mic className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{podcast?.host || "Host"}</p>
                    <p className="text-gray-500 text-xs">{podcast?.title}</p>
                  </div>
                </div>
                <Link href={`/listen/${params.podcastId}`}>
                  <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50" data-testid="button-more-episodes">
                    More Episodes
                  </Button>
                </Link>
              </div>
            </footer>
          </div>

          <aside className="hidden lg:block w-[300px] shrink-0 print:hidden" data-testid="episode-sidebar">
            <div className="sticky top-20 space-y-6">
              <SidebarSubscribeWidget
                podcastId={podcast?.id}
                podcastTitle={podcast?.title}
                podcastImage={podcast?.coverImage}
                source="episode_sidebar"
              />

              <div className="border border-gray-100 bg-gray-50 p-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">About the Show</h3>
                <div className="flex items-center space-x-3 mb-3">
                  {podcast?.coverImage ? (
                    <img src={podcast.coverImage} alt="" className="h-12 w-12 rounded-full object-cover" />
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
                {podcast?.description && (
                  <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-4">{podcast.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  {podcast?.subscribers ? `${(podcast.subscribers / 1000).toFixed(0)}K subscribers` : ""}
                </p>
                <Link href={`/news/${params.podcastId}`}>
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs border-gray-300" data-testid="button-sidebar-stories">
                    View Stories
                  </Button>
                </Link>
              </div>

              {episode.publishedAt && (
                <div className="border border-gray-100 bg-gray-50 p-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Episode Details</h3>
                  <dl className="space-y-2 text-xs">
                    <div>
                      <dt className="text-gray-400">Published</dt>
                      <dd className="text-gray-700 font-medium">{formatDate(episode.publishedAt)}</dd>
                    </div>
                    {episode.duration && (
                      <div>
                        <dt className="text-gray-400">Duration</dt>
                        <dd className="text-gray-700 font-medium">{formatDuration(episode.duration)}</dd>
                      </div>
                    )}
                    {contentPieces && contentPieces.length > 0 && (
                      <div>
                        <dt className="text-gray-400">Content Generated</dt>
                        <dd className="text-gray-700 font-medium">{contentPieces.length} pieces</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
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
        source="episode_sticky"
      />
    </div>
  );
}
