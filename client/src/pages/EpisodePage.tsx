import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Mic, Clock, Play, Pause, ChevronRight, FileText, Video, MessageSquare, Share2, Headphones, Sparkles, ListPlus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { InlineSubscribeWidget, SidebarSubscribeWidget, StickyBottomSubscribeBar, EpisodeSubscribeWidget } from "@/components/SubscriberWidgets";
import { useSubscription } from "@/hooks/use-subscription";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { useAudioPlayer, type AudioEpisode } from "@/components/AudioPlayerProvider";

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

function VideoPlayerUI({ episode, podcast }: { episode: any; podcast: any }) {
  const { play, pause, resume, isPlaying, currentEpisode, currentTime } = useAudioPlayer();
  const videoRef = useRef<HTMLVideoElement>(null);
  const isThisEpisode = currentEpisode?.id === episode.id;
  const isThisPlaying = isThisEpisode && isPlaying;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isThisEpisode) return;

    if (Math.abs(video.currentTime - currentTime) > 2) {
      video.currentTime = currentTime;
    }

    if (isPlaying && video.paused) {
      video.play().catch(() => {});
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isThisEpisode, isPlaying, currentTime]);

  const handleVideoPlay = () => {
    if (!isThisEpisode) {
      const audioEp: AudioEpisode = {
        id: episode.id,
        title: episode.title,
        podcastTitle: podcast?.title || "Podcast",
        audioUrl: episode.audioUrl || episode.videoUrl || "",
        coverImage: episode.thumbnailUrl || podcast?.coverImage,
        duration: episode.duration,
        podcastId: podcast?.id,
      };
      play(audioEp);
    } else {
      isPlaying ? pause() : resume();
    }
  };

  return (
    <div className="mb-8 rounded-xl overflow-hidden bg-black shadow-2xl" data-testid="video-player">
      <div className="relative aspect-video cursor-pointer" onClick={handleVideoPlay}>
        <video
          ref={videoRef}
          poster={episode.thumbnailUrl || undefined}
          className="w-full h-full object-contain bg-black"
          preload="metadata"
          data-testid="video-element"
          muted
        >
          <source src={episode.videoUrl} />
        </video>
        {!isThisPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center">
              <Play className="h-8 w-8 text-gray-900 ml-1" fill="currentColor" />
            </div>
          </div>
        )}
      </div>
      <div className="bg-gray-900 px-4 py-3">
        <p className="text-white text-sm font-semibold truncate">{episode.title}</p>
        <p className="text-xs text-gray-400 mt-1">Audio continues when you leave this page</p>
      </div>
    </div>
  );
}

function AudioPlayerUI({ episode, podcast }: { episode: any; podcast: any }) {
  const { play, pause, resume, isPlaying, currentEpisode, addToQueue } = useAudioPlayer();
  const isThisEpisode = currentEpisode?.id === episode.id;
  const isThisPlaying = isThisEpisode && isPlaying;

  const handlePlay = () => {
    if (isThisEpisode) {
      isPlaying ? pause() : resume();
    } else {
      const audioEp: AudioEpisode = {
        id: episode.id,
        title: episode.title,
        podcastTitle: podcast?.title || "Podcast",
        audioUrl: episode.audioUrl || episode.videoUrl || "",
        coverImage: episode.thumbnailUrl || podcast?.coverImage,
        duration: episode.duration,
        podcastId: podcast?.id,
      };
      play(audioEp);
    }
  };

  const handleQueue = () => {
    addToQueue({
      id: episode.id,
      title: episode.title,
      podcastTitle: podcast?.title || "Podcast",
      audioUrl: episode.audioUrl || episode.videoUrl || "",
      coverImage: episode.thumbnailUrl || podcast?.coverImage,
      duration: episode.duration,
      podcastId: podcast?.id,
    });
  };

  const isVideoOnly = episode.videoUrl && !episode.audioUrl;

  return (
    <div className="bg-gray-900 rounded-lg p-5 mb-8" data-testid="audio-player">
      {isVideoOnly && (
        <p className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
          <Headphones className="h-3 w-3" />
          Listen in background
        </p>
      )}
      <div className="flex items-center gap-4">
        <button
          onClick={handlePlay}
          className="h-14 w-14 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center flex-shrink-0 transition-colors shadow-lg shadow-amber-500/20"
          data-testid="button-play-pause"
        >
          {isThisPlaying ? <Pause className="h-6 w-6 text-gray-900" /> : <Play className="h-6 w-6 text-gray-900 ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate" data-testid="text-player-title">{episode.title}</p>
          <p className="text-gray-400 text-xs">{podcast?.title || "Podcast"}</p>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="text-gray-500 text-xs font-mono flex-shrink-0">
              {episode.duration ? formatDuration(episode.duration) : "--:--"}
            </span>
          </div>
        </div>
        {!isThisEpisode && (
          <button
            onClick={handleQueue}
            className="p-2 text-gray-500 hover:text-amber-500 transition-colors"
            title="Add to queue"
            data-testid="button-add-to-queue"
          >
            <ListPlus className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function EpisodeTypeBadge({ type }: { type: string }) {
  if (type === "video" || type === "both") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
        <Video className="h-3 w-3" />
        {type === "both" ? "Video + Audio" : "Video"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-semibold rounded">
      <Headphones className="h-3 w-3" />
      Audio
    </span>
  );
}

function SuggestedEpisodes({ episodeId, currentPodcastId }: { episodeId: string; currentPodcastId: string }) {
  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["/api/public/episodes", episodeId, "suggested"],
    queryFn: async () => {
      const res = await fetch(`/api/public/episodes/${episodeId}/suggested?limit=6`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="mt-10 pt-8 border-t border-gray-200" data-testid="suggested-episodes-loading">
        <Skeleton className="h-6 w-48 mb-4 bg-gray-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-16 w-16 rounded-lg bg-gray-100 flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-full mb-2 bg-gray-100" />
                <Skeleton className="h-3 w-24 bg-gray-50" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="mt-10 pt-8 border-t border-gray-200" data-testid="suggested-episodes">
      <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        Suggested Episodes
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {suggestions.map((item: any) => {
          const ep = item.episode;
          const pod = item.podcast;
          const podcastId = pod?.id || currentPodcastId;
          return (
            <Link
              key={ep.id}
              href={`/listen/${podcastId}/episode/${ep.id}`}
              className="block"
            >
              <div className="group flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer" data-testid={`suggested-episode-${ep.id}`}>
                <div className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {ep.thumbnailUrl ? (
                    <img src={ep.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : pod?.coverImage ? (
                    <img src={pod.coverImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <Mic className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2 leading-snug" data-testid={`text-suggested-title-${ep.id}`}>
                    {ep.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {pod && !item.sameShow && (
                      <span className="text-xs text-gray-500 truncate">{pod.title}</span>
                    )}
                    {ep.duration && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5 flex-shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        {ep.duration}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    {(ep.episodeType === "video" || ep.episodeType === "both") && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-600 font-medium">
                        <Video className="h-2.5 w-2.5" />
                        Video
                      </span>
                    )}
                    {item.sameShow && (
                      <span className="text-[10px] text-amber-600 font-medium">From this show</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function EpisodePage() {
  const params = useParams<{ podcastId: string; episodeId: string }>();
  const { isSubscribed, recommendations, subscriberName } = useSubscription(params.podcastId);

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
      <div className="bg-white">
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
      <div className="bg-white flex items-center justify-center py-20">
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
    <div className="bg-white" data-testid="episode-page">
      <nav className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center space-x-1 text-sm text-gray-500 py-3">
            <Link href={`/show/${params.podcastId}`} className="hover:text-gray-900 cursor-pointer">{podcast?.title || "Show"}</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 font-medium truncate max-w-[300px]">{episode.title}</span>
          </div>
        </div>
      </nav>

      <div className="flex justify-center py-4 bg-gray-50/50 border-b border-gray-100">
        <AdPlaceholder width={728} height={90} label="Leaderboard" className="hidden md:flex" />
        <AdPlaceholder width={320} height={50} label="Mobile Banner" className="md:hidden" />
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <div className="flex-1 min-w-0 max-w-[720px]">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <EpisodeTypeBadge type={episode.episodeType || "audio"} />
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

            {(episode.episodeType === "video" || episode.episodeType === "both") && episode.videoUrl && (
              <VideoPlayerUI episode={episode} podcast={podcast} />
            )}

            <AudioPlayerUI episode={episode} podcast={podcast} />

            <InlineSubscribeWidget
              podcastId={podcast?.id}
              podcastTitle={podcast?.title}
              source="episode_inline"
              isSubscribed={isSubscribed}
              recommendations={recommendations}
              subscriberName={subscriberName}
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
                      <div className="group border border-gray-100 hover:border-gray-300 rounded-lg p-4 transition-colors cursor-pointer" data-testid={`link-article-${article.id}`}>
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
                      <div key={piece.id} className="border border-gray-100 rounded-lg p-3" data-testid={`content-piece-${piece.id}`}>
                        <Icon className="h-4 w-4 text-gray-400 mb-2" />
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2">{piece.title}</p>
                        <p className="text-[10px] text-gray-400 uppercase mt-1">{piece.type.replace("_", " ")}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-center my-8">
              <AdPlaceholder width={728} height={90} label="Mid-Content Leaderboard" className="hidden md:flex" />
              <AdPlaceholder width={300} height={250} label="Mid-Content Rectangle" className="md:hidden" />
            </div>

            <SuggestedEpisodes episodeId={episode.id} currentPodcastId={params.podcastId} />

            <div className="mt-10">
              <EpisodeSubscribeWidget
                podcastId={podcast?.id}
                podcastTitle={podcast?.title}
                podcastImage={podcast?.coverImage}
                source="episode_bottom"
                isSubscribed={isSubscribed}
                recommendations={recommendations}
                subscriberName={subscriberName}
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
                <Link href={`/show/${params.podcastId}`}>
                  <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50" data-testid="button-more-episodes">
                    More from this Show
                  </Button>
                </Link>
              </div>
            </footer>
          </div>

          <aside className="hidden lg:block w-[300px] shrink-0 print:hidden" data-testid="episode-sidebar">
            <div className="sticky top-20 space-y-6">
              <AdPlaceholder width={300} height={250} label="Sidebar Rectangle" />

              <SidebarSubscribeWidget
                podcastId={podcast?.id}
                podcastTitle={podcast?.title}
                podcastImage={podcast?.coverImage}
                source="episode_sidebar"
                isSubscribed={isSubscribed}
                recommendations={recommendations}
                subscriberName={subscriberName}
              />

              <div className="border border-gray-100 bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">About the Show</h3>
                <div className="flex items-center space-x-3 mb-3">
                  {podcast?.coverImage ? (
                    <img src={podcast.coverImage} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-900 flex items-center justify-center">
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
                <Link href={`/show/${params.podcastId}`}>
                  <Button variant="outline" size="sm" className="w-full mt-3 text-xs border-gray-300" data-testid="button-sidebar-stories">
                    View All Content
                  </Button>
                </Link>
              </div>

              <AdPlaceholder width={300} height={600} label="Sidebar Half Page" />

              {episode.publishedAt && (
                <div className="border border-gray-100 bg-gray-50 rounded-lg p-4">
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

      <StickyBottomSubscribeBar
        podcastId={podcast?.id}
        podcastTitle={podcast?.title}
        source="episode_sticky"
        isSubscribed={isSubscribed}
        recommendations={recommendations}
        subscriberName={subscriberName}
      />
    </div>
  );
}
