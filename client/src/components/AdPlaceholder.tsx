import { useState, useEffect } from "react";

interface AdData {
  id: string;
  imageUrl: string;
  clickUrl: string;
  altText: string;
  headline: string;
  ctaText: string;
}

export function AdPlaceholder({ width, height, label, className }: { width: number; height: number; label: string; className?: string }) {
  const [ad, setAd] = useState<AdData | null>(null);

  useEffect(() => {
    fetch(`/api/public/ads?width=${width}&height=${height}`)
      .then(res => res.json())
      .then(data => { if (data) setAd(data); })
      .catch(() => {});
  }, [width, height]);

  if (ad) {
    return (
      <a
        href={ad.clickUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block overflow-hidden relative ${className || ""}`}
        style={{ maxWidth: "100%" }}
        data-testid={`ad-unit-${label.toLowerCase().replace(/\s+/g, "-")}`}
        data-ad-id={ad.id}
      >
        <img
          src={ad.imageUrl}
          alt={ad.altText || ad.headline || "Advertisement"}
          style={{ display: "block", maxWidth: "100%", height: "auto" }}
          loading="lazy"
        />
        <span className="absolute bottom-0 right-0 bg-background/60 text-foreground text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 opacity-60">
          Ad
        </span>
      </a>
    );
  }

  return null;
}
