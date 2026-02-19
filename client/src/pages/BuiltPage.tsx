import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Loader2, FileX, Mail, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PollWidget from "@/components/widgets/PollWidget";
import EventsWidget from "@/components/widgets/EventsWidget";
import { useState } from "react";

interface PageBlock {
  id: string;
  type: string;
  settings: Record<string, any>;
  order: number;
}

function PodcastFeedBlock({ settings }: { settings: Record<string, any> }) {
  const limit = settings.limit || 6;
  const columns = settings.columns || 3;
  const showDescription = settings.showDescription !== false;
  const podcastId = settings.podcastId;

  const { data: episodes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public/podcast-episodes", limit, podcastId],
    queryFn: async () => {
      if (podcastId) {
        const res = await fetch(`/api/public/podcasts/${podcastId}/episodes`);
        if (!res.ok) return [];
        const data = await res.json();
        return (data || []).slice(0, limit);
      }
      const res = await fetch(`/api/public/feed?limit=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.episodes || data || []).slice(0, limit);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const gridCols =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : columns === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${gridCols} gap-6`} data-testid="podcast-feed-grid">
      {episodes.map((ep: any) => (
        <Card key={ep.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-episode-${ep.id}`}>
          {ep.thumbnailUrl && (
            <div className="aspect-video bg-muted overflow-hidden">
              <img src={ep.thumbnailUrl} alt={ep.title} className="w-full h-full object-cover" />
            </div>
          )}
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">{ep.title}</h3>
            {ep.podcastTitle && (
              <p className="text-xs text-muted-foreground mb-1">{ep.podcastTitle}</p>
            )}
            {ep.publishedAt && (
              <p className="text-xs text-muted-foreground">
                {new Date(ep.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            {showDescription && ep.description && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ep.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ArticleFeedBlock({ settings }: { settings: Record<string, any> }) {
  const limit = settings.limit || 6;
  const columns = settings.columns || 3;
  const showImage = settings.showImage !== false;
  const showExcerpt = settings.showExcerpt !== false;
  const category = settings.category;

  const params = new URLSearchParams({ limit: String(limit) });
  if (category) params.set("category", category);

  const { data: articles = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/public/blog", limit, category],
    queryFn: async () => {
      const blogParams = new URLSearchParams({ limit: String(limit) });
      if (category) blogParams.set("tag", category);
      const res = await fetch(`/api/public/blog?${blogParams.toString()}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.articles || data || [];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const gridCols =
    columns === 1
      ? "grid-cols-1"
      : columns === 2
        ? "grid-cols-1 sm:grid-cols-2"
        : columns === 4
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid ${gridCols} gap-6`} data-testid="article-feed-grid">
      {articles.map((article: any) => (
        <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-article-${article.id}`}>
          {showImage && article.coverImage && (
            <div className="aspect-video bg-muted overflow-hidden">
              <img src={article.coverImage} alt={article.title} className="w-full h-full object-cover" />
            </div>
          )}
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">{article.title}</h3>
            {article.publishedAt && (
              <p className="text-xs text-muted-foreground">
                {new Date(article.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
            {showExcerpt && (article.description || article.summary) && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-3">
                {article.description || article.summary}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function HeroBlock({ settings }: { settings: Record<string, any> }) {
  const {
    heading,
    subheading,
    backgroundImage,
    buttonText,
    buttonUrl,
    overlay = true,
    height = "400px",
  } = settings;

  const bgStyle: React.CSSProperties = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: "linear-gradient(135deg, #1e293b 0%, #0f172a 50%, #1e1b4b 100%)" };

  return (
    <div
      className="relative w-full flex items-center justify-center"
      style={{ ...bgStyle, minHeight: height }}
      data-testid="block-hero"
    >
      {overlay && backgroundImage && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      <div className="relative z-10 text-center px-6 py-12 max-w-3xl mx-auto">
        {heading && (
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{heading}</h1>
        )}
        {subheading && (
          <p className="text-lg md:text-xl text-white/80 mb-6">{subheading}</p>
        )}
        {buttonText && buttonUrl && (
          <a href={buttonUrl}>
            <Button size="lg" className="text-base" data-testid="hero-cta-button">
              {buttonText}
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

function TextBlock({ settings }: { settings: Record<string, any> }) {
  const { content, alignment = "left", maxWidth = "800px" } = settings;

  return (
    <div
      className="prose prose-invert max-w-none mx-auto"
      style={{ textAlign: alignment, maxWidth }}
      dangerouslySetInnerHTML={{ __html: content || "" }}
      data-testid="block-text"
    />
  );
}

function AdUnitBlock({ settings }: { settings: Record<string, any> }) {
  const { size = "728x90", adSlot } = settings;

  return (
    <div
      className="flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg py-6 px-4"
      data-testid="block-ad-unit"
    >
      <div className="text-center">
        <Badge variant="outline" className="text-xs text-muted-foreground mb-2">
          Advertisement
        </Badge>
        <p className="text-xs text-muted-foreground/50">{size}{adSlot ? ` · ${adSlot}` : ""}</p>
      </div>
    </div>
  );
}

function ImageBlock({ settings }: { settings: Record<string, any> }) {
  const { src, alt = "", caption, width = "100%", alignment = "center" } = settings;

  const alignClass =
    alignment === "left" ? "mr-auto" : alignment === "right" ? "ml-auto" : "mx-auto";

  return (
    <figure className={`${alignClass}`} style={{ maxWidth: width }} data-testid="block-image">
      {src && (
        <img
          src={src}
          alt={alt}
          className="w-full h-auto rounded-lg"
          loading="lazy"
        />
      )}
      {caption && (
        <figcaption className="text-sm text-muted-foreground text-center mt-2">{caption}</figcaption>
      )}
    </figure>
  );
}

function VideoBlock({ settings }: { settings: Record<string, any> }) {
  const { src, title, autoplay = false, controls = true } = settings;

  if (!src) return null;

  const isEmbed = src.includes("youtube") || src.includes("vimeo") || src.includes("embed");

  if (isEmbed) {
    return (
      <div className="aspect-video rounded-lg overflow-hidden" data-testid="block-video">
        <iframe
          src={src}
          title={title || "Video"}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden" data-testid="block-video">
      <video
        src={src}
        title={title}
        controls={controls}
        autoPlay={autoplay}
        className="w-full rounded-lg"
      />
    </div>
  );
}

function CtaBannerBlock({ settings }: { settings: Record<string, any> }) {
  const {
    heading,
    description,
    buttonText,
    buttonUrl,
    backgroundColor = "#1e293b",
  } = settings;

  return (
    <div
      className="rounded-xl p-8 md:p-12 text-center"
      style={{ backgroundColor }}
      data-testid="block-cta-banner"
    >
      {heading && (
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">{heading}</h2>
      )}
      {description && (
        <p className="text-white/80 mb-6 max-w-xl mx-auto">{description}</p>
      )}
      {buttonText && buttonUrl && (
        <a href={buttonUrl}>
          <Button size="lg" variant="secondary" data-testid="cta-banner-button">
            {buttonText}
          </Button>
        </a>
      )}
    </div>
  );
}

function DividerBlock({ settings }: { settings: Record<string, any> }) {
  const { style = "line", spacing = "md" } = settings;

  const spacingClass =
    spacing === "sm" ? "py-4" : spacing === "lg" ? "py-12" : "py-8";

  if (style === "space") {
    return <div className={spacingClass} data-testid="block-divider" />;
  }

  if (style === "dots") {
    return (
      <div className={`${spacingClass} flex items-center justify-center gap-2`} data-testid="block-divider">
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
      </div>
    );
  }

  return (
    <div className={spacingClass} data-testid="block-divider">
      <hr className="border-border" />
    </div>
  );
}

function SubscribeWidgetBlock({ settings }: { settings: Record<string, any> }) {
  const {
    heading = "Stay Updated",
    description = "Subscribe to our newsletter for the latest updates.",
    buttonText = "Subscribe",
  } = settings;

  const [email, setEmail] = useState("");

  return (
    <div className="rounded-xl border border-border bg-card p-8 text-center max-w-lg mx-auto" data-testid="block-subscribe-widget">
      <Mail className="h-8 w-8 text-amber-400 mx-auto mb-3" />
      {heading && <h3 className="text-xl font-bold mb-2">{heading}</h3>}
      {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          data-testid="input-subscribe-email"
        />
        <Button data-testid="button-subscribe">{buttonText}</Button>
      </div>
    </div>
  );
}

function HtmlBlock({ settings }: { settings: Record<string, any> }) {
  const { code } = settings;

  return (
    <div
      dangerouslySetInnerHTML={{ __html: code || "" }}
      data-testid="block-html"
    />
  );
}

function renderBlock(block: PageBlock) {
  const { type, settings, id } = block;

  switch (type) {
    case "hero":
      return <HeroBlock settings={settings} />;
    case "text":
      return <TextBlock settings={settings} />;
    case "podcast_feed":
      return <PodcastFeedBlock settings={settings} />;
    case "article_feed":
      return <ArticleFeedBlock settings={settings} />;
    case "poll_widget":
      return (
        <div className="max-w-md mx-auto" data-testid="block-poll-widget">
          <PollWidget zone={settings.zone} />
        </div>
      );
    case "events_widget":
      return (
        <div className="max-w-md mx-auto" data-testid="block-events-widget">
          <EventsWidget limit={settings.limit} />
        </div>
      );
    case "ad_unit":
      return <AdUnitBlock settings={settings} />;
    case "image":
      return <ImageBlock settings={settings} />;
    case "video":
      return <VideoBlock settings={settings} />;
    case "cta_banner":
      return <CtaBannerBlock settings={settings} />;
    case "divider":
      return <DividerBlock settings={settings} />;
    case "subscribe_widget":
      return <SubscribeWidgetBlock settings={settings} />;
    case "html":
      return <HtmlBlock settings={settings} />;
    default:
      return null;
  }
}

export default function BuiltPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: page, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/public/page", slug],
    queryFn: async () => {
      const res = await fetch(`/api/public/page/${slug}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen" data-testid="page-loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page || isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4" data-testid="page-not-found">
        <FileX className="h-16 w-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground">The page you're looking for doesn't exist or has been unpublished.</p>
      </div>
    );
  }

  const blocks: PageBlock[] = (page.layout || [])
    .slice()
    .sort((a: PageBlock, b: PageBlock) => a.order - b.order);

  return (
    <div className="min-h-screen" data-testid="built-page">
      {page.title && (
        <title>{page.title}</title>
      )}
      {blocks.map((block) => {
        const isFullWidth = block.type === "hero";
        return (
          <div
            key={block.id}
            className={isFullWidth ? "" : "py-8 px-4 md:px-8 max-w-6xl mx-auto"}
            data-testid={`block-container-${block.id}`}
          >
            {renderBlock(block)}
          </div>
        );
      })}
    </div>
  );
}
