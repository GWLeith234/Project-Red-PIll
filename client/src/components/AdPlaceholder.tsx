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
    const ratio = width / height;
    const isWide = ratio > 2;
    const isMediumWide = ratio > 1.2 && ratio <= 2;

    if (isWide) {
      return (
        <a
          href={ad.clickUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`flex items-center justify-between overflow-hidden relative border border-gray-200 ${className || ""}`}
          style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
          data-testid={`ad-unit-${label.toLowerCase().replace(/\s+/g, "-")}`}
          data-ad-id={ad.id}
        >
          <div className="flex items-center h-full px-3 gap-3" style={{ flex: "1 1 auto", minWidth: 0 }}>
            <img
              src={ad.imageUrl}
              alt={ad.altText || ad.headline || "Advertisement"}
              className="h-full object-contain shrink-0"
              style={{ maxWidth: `${Math.min(height * 0.8, width * 0.25)}px` }}
              loading="lazy"
            />
            <div className="flex flex-col justify-center min-w-0" style={{ flex: "1 1 auto" }}>
              <span className="text-white font-bold truncate" style={{ fontSize: `${Math.max(10, Math.min(height * 0.28, 16))}px`, lineHeight: 1.2 }}>
                {ad.headline}
              </span>
              {height >= 60 && ad.altText && (
                <span className="text-gray-300 truncate mt-0.5" style={{ fontSize: `${Math.max(8, Math.min(height * 0.18, 11))}px` }}>
                  {ad.altText}
                </span>
              )}
            </div>
            {ad.ctaText && (
              <span
                className="shrink-0 bg-white text-gray-900 font-bold rounded-sm text-center whitespace-nowrap"
                style={{ fontSize: `${Math.max(8, Math.min(height * 0.22, 12))}px`, padding: `${Math.max(2, height * 0.1)}px ${Math.max(6, height * 0.2)}px` }}
              >
                {ad.ctaText}
              </span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 bg-black/50 text-white text-[7px] font-mono uppercase tracking-wider px-1 py-px opacity-50">
            Ad
          </span>
        </a>
      );
    }

    if (isMediumWide) {
      return (
        <a
          href={ad.clickUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`flex overflow-hidden relative border border-gray-200 ${className || ""}`}
          style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
          data-testid={`ad-unit-${label.toLowerCase().replace(/\s+/g, "-")}`}
          data-ad-id={ad.id}
        >
          <img
            src={ad.imageUrl}
            alt={ad.altText || ad.headline || "Advertisement"}
            className="h-full object-contain shrink-0"
            style={{ maxWidth: `${width * 0.4}px` }}
            loading="lazy"
          />
          <div className="flex flex-col justify-center items-start px-3 min-w-0" style={{ flex: "1 1 auto" }}>
            <span className="text-white font-bold leading-tight" style={{ fontSize: `${Math.max(12, Math.min(height * 0.14, 18))}px` }}>
              {ad.headline}
            </span>
            {ad.altText && (
              <span className="text-gray-300 mt-1 leading-tight" style={{ fontSize: `${Math.max(9, Math.min(height * 0.09, 12))}px` }}>
                {ad.altText}
              </span>
            )}
            {ad.ctaText && (
              <span
                className="mt-2 bg-white text-gray-900 font-bold rounded-sm"
                style={{ fontSize: `${Math.max(9, Math.min(height * 0.08, 12))}px`, padding: `${Math.max(3, height * 0.03)}px ${Math.max(8, height * 0.06)}px` }}
              >
                {ad.ctaText}
              </span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 bg-black/50 text-white text-[7px] font-mono uppercase tracking-wider px-1 py-px opacity-50">
            Ad
          </span>
        </a>
      );
    }

    return (
      <a
        href={ad.clickUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`block overflow-hidden relative ${className || ""}`}
        style={{ width: `${width}px`, height: `${height}px`, maxWidth: "100%" }}
        data-testid={`ad-unit-${label.toLowerCase().replace(/\s+/g, "-")}`}
        data-ad-id={ad.id}
      >
        <img
          src={ad.imageUrl}
          alt={ad.altText || ad.headline || "Advertisement"}
          className="w-full h-full object-contain"
          style={{ background: "linear-gradient(180deg, #f8f8f8 0%, #efefef 100%)" }}
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
