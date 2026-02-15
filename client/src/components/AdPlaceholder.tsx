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
        <span className="absolute bottom-0 right-0 bg-black/60 text-white text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 opacity-60">
          Ad
        </span>
      </a>
    );
  }

  return (
    <div
      className={`bg-gray-100 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 overflow-hidden ${className || ""}`}
      style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
      data-testid={`ad-slot-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-300 mb-1">Advertisement</span>
      <span className="text-xs font-mono font-medium text-gray-400">{width}×{height}</span>
      <span className="text-[10px] text-gray-300 mt-0.5">{label}</span>
    </div>
  );
}
