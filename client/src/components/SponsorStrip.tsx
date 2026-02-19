import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { ExternalLink, QrCode } from "lucide-react";

interface SponsorData {
  id: string;
  advertiserName: string;
  advertiserUrl: string | null;
  logoUrl: string | null;
  logoDarkUrl: string | null;
  tagline: string | null;
  qrCodeUrl: string | null;
  qrCodeImageUrl: string | null;
  ctaText: string | null;
  hostReadCopy: string | null;
  package: {
    tier: string;
    includesShowHero: boolean;
    includesEpisodeCards: boolean;
    includesArticleInjection: boolean;
    includesQrCode: boolean;
    includesHostReadCopy: boolean;
    includesPushMention: boolean;
    includesNetworkWide: boolean;
  } | null;
}

function trackImpression(entityType: string, entityId: string, placement: string, showId?: string) {
  fetch("/api/public/ad/impression", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType, entityId, placement, showId, pageUrl: window.location.pathname }),
  }).catch(() => {});
}

function trackClick(entityType: string, entityId: string, placement: string) {
  fetch("/api/public/ad/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ entityType, entityId, placement, pageUrl: window.location.pathname }),
  }).catch(() => {});
}

function trackQrScan(sponsorshipId: string) {
  fetch("/api/public/ad/qr-scan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sponsorshipId, pageUrl: window.location.pathname }),
  }).catch(() => {});
}

function useImpressionTracker(sponsor: SponsorData | null | undefined, placement: string, showId?: string) {
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (sponsor && tracked.current !== sponsor.id) {
      tracked.current = sponsor.id;
      trackImpression("sponsorship", sponsor.id, placement, showId);
    }
  }, [sponsor?.id, placement, showId]);
}

export function ShowHeroSponsorStrip({ showId }: { showId: string }) {
  const { data: sponsor } = useQuery<SponsorData | null>({
    queryKey: ["/api/public/ad/sponsorship", showId],
    queryFn: async () => {
      const res = await fetch(`/api/public/ad/sponsorship/${showId}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  const visible = !!sponsor && !!sponsor.package?.includesShowHero;
  useImpressionTracker(visible ? sponsor : null, "show_hero", showId);

  if (!visible) return null;

  return (
    <div className="border-b border-border bg-card/60 backdrop-blur-sm" data-testid="sponsor-strip-hero">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 shrink-0">Sponsored by</span>
            {sponsor!.logoUrl && (
              <img src={sponsor!.logoUrl} alt={sponsor!.advertiserName} className="h-5 w-auto max-w-[100px] object-contain dark:hidden" data-testid="img-sponsor-logo" />
            )}
            {sponsor!.logoDarkUrl && (
              <img src={sponsor!.logoDarkUrl} alt={sponsor!.advertiserName} className="h-5 w-auto max-w-[100px] object-contain hidden dark:block" data-testid="img-sponsor-logo-dark" />
            )}
            {!sponsor!.logoUrl && !sponsor!.logoDarkUrl && (
              <span className="text-sm font-semibold text-foreground">{sponsor!.advertiserName}</span>
            )}
            {sponsor!.tagline && (
              <span className="text-xs text-muted-foreground truncate hidden sm:inline">{sponsor!.tagline}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {sponsor!.package?.includesQrCode && sponsor!.qrCodeImageUrl && (
              <button
                onClick={() => {
                  trackQrScan(sponsor!.id);
                  if (sponsor!.qrCodeUrl) window.open(sponsor!.qrCodeUrl, "_blank");
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-sponsor-qr"
              >
                <QrCode className="h-3.5 w-3.5" />
              </button>
            )}
            {sponsor!.advertiserUrl && (
              <a
                href={sponsor!.advertiserUrl}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackClick("sponsorship", sponsor!.id, "show_hero")}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                data-testid="link-sponsor-cta"
              >
                {sponsor!.ctaText || "Learn More"}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EpisodeSponsorBadge({ showId }: { showId: string }) {
  const { data: sponsor } = useQuery<SponsorData | null>({
    queryKey: ["/api/public/ad/sponsorship", showId],
    queryFn: async () => {
      const res = await fetch(`/api/public/ad/sponsorship/${showId}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  if (!sponsor || !sponsor.package?.includesEpisodeCards) return null;

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/70 font-medium"
      data-testid="badge-episode-sponsor"
    >
      <span className="text-[8px] uppercase tracking-wider">Sponsored</span>
      {sponsor.logoUrl && (
        <img src={sponsor.logoUrl} alt={sponsor.advertiserName} className="h-3 w-auto max-w-[60px] object-contain opacity-60 dark:hidden" />
      )}
      {sponsor.logoDarkUrl && (
        <img src={sponsor.logoDarkUrl} alt={sponsor.advertiserName} className="h-3 w-auto max-w-[60px] object-contain opacity-60 hidden dark:block" />
      )}
    </span>
  );
}

export function ArticleSponsorBanner({ showId }: { showId: string }) {
  const { data: sponsor } = useQuery<SponsorData | null>({
    queryKey: ["/api/public/ad/sponsorship", showId],
    queryFn: async () => {
      const res = await fetch(`/api/public/ad/sponsorship/${showId}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  const visible = !!sponsor && !!sponsor.package?.includesArticleInjection;
  useImpressionTracker(visible ? sponsor : null, "article_banner", showId);

  if (!visible) return null;

  return (
    <div className="rounded-xl border border-border bg-card/80 p-4 my-6" data-testid="sponsor-banner-article">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Sponsored</p>
          <div className="flex items-center gap-2 mb-1">
            {sponsor!.logoUrl && (
              <img src={sponsor!.logoUrl} alt={sponsor!.advertiserName} className="h-6 w-auto max-w-[120px] object-contain dark:hidden" />
            )}
            {sponsor!.logoDarkUrl && (
              <img src={sponsor!.logoDarkUrl} alt={sponsor!.advertiserName} className="h-6 w-auto max-w-[120px] object-contain hidden dark:block" />
            )}
            {!sponsor!.logoUrl && !sponsor!.logoDarkUrl && (
              <span className="text-sm font-semibold text-foreground">{sponsor!.advertiserName}</span>
            )}
          </div>
          {sponsor!.tagline && (
            <p className="text-xs text-muted-foreground line-clamp-1">{sponsor!.tagline}</p>
          )}
        </div>
        {sponsor!.package?.includesQrCode && sponsor!.qrCodeImageUrl && (
          <img
            src={sponsor!.qrCodeImageUrl}
            alt="Scan to visit sponsor"
            className="h-14 w-14 rounded bg-white p-1"
            data-testid="img-sponsor-qr"
          />
        )}
        {sponsor!.advertiserUrl && (
          <a
            href={sponsor!.advertiserUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => trackClick("sponsorship", sponsor!.id, "article_banner")}
            className="shrink-0 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            data-testid="link-sponsor-article-cta"
          >
            {sponsor!.ctaText || "Learn More"}
          </a>
        )}
      </div>
    </div>
  );
}

export function PlayerQrPanel({ showId }: { showId: string }) {
  const { data: sponsor } = useQuery<SponsorData | null>({
    queryKey: ["/api/public/ad/sponsorship", showId],
    queryFn: async () => {
      const res = await fetch(`/api/public/ad/sponsorship/${showId}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  if (!sponsor || !sponsor.package?.includesQrCode || !sponsor.qrCodeImageUrl) return null;

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-card rounded-xl border border-border" data-testid="player-qr-panel">
      <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Scan to visit sponsor</p>
      <img
        src={sponsor.qrCodeImageUrl}
        alt={`QR code for ${sponsor.advertiserName}`}
        className="h-20 w-20 rounded bg-white p-1"
        data-testid="img-player-qr"
      />
      <span className="text-[10px] text-muted-foreground">{sponsor.advertiserName}</span>
    </div>
  );
}

export function NetworkSponsorBanner() {
  const { data: sponsor } = useQuery<SponsorData | null>({
    queryKey: ["/api/public/ad/network-sponsor"],
    queryFn: async () => {
      const res = await fetch("/api/public/ad/network-sponsor");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60000,
  });

  useImpressionTracker(sponsor, "network_banner");

  if (!sponsor) return null;

  return (
    <div className="bg-card/60 border-b border-border backdrop-blur-sm" data-testid="network-sponsor-banner">
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center gap-3">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Network Partner</span>
        {sponsor.logoUrl && (
          <img src={sponsor.logoUrl} alt={sponsor.advertiserName} className="h-5 w-auto max-w-[100px] object-contain dark:hidden" />
        )}
        {sponsor.logoDarkUrl && (
          <img src={sponsor.logoDarkUrl} alt={sponsor.advertiserName} className="h-5 w-auto max-w-[100px] object-contain hidden dark:block" />
        )}
        {sponsor.tagline && (
          <span className="text-xs text-muted-foreground hidden sm:inline">{sponsor.tagline}</span>
        )}
        {sponsor.advertiserUrl && (
          <a
            href={sponsor.advertiserUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => trackClick("sponsorship", sponsor.id, "network_banner")}
            className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            data-testid="link-network-sponsor"
          >
            {sponsor.ctaText || "Visit"} <ExternalLink className="h-3 w-3 inline" />
          </a>
        )}
      </div>
    </div>
  );
}
