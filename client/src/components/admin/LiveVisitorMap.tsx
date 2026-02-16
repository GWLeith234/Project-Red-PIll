import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

interface LiveSession {
  id: string;
  sessionId: string;
  latitude: string | null;
  longitude: string | null;
  country: string | null;
  city: string | null;
  currentPage: string | null;
  deviceType: string | null;
}

interface TopCountry {
  country: string;
  count: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", GB: "🇬🇧", FR: "🇫🇷", DE: "🇩🇪", JP: "🇯🇵", AU: "🇦🇺",
  RU: "🇷🇺", MX: "🇲🇽", BR: "🇧🇷", SG: "🇸🇬", AE: "🇦🇪", KR: "🇰🇷",
  IN: "🇮🇳", KE: "🇰🇪", CA: "🇨🇦", SE: "🇸🇪", CN: "🇨🇳", IT: "🇮🇹",
  ES: "🇪🇸", NL: "🇳🇱",
};

interface Props {
  fullscreen?: boolean;
}

export default function LiveVisitorMap({ fullscreen = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Map<string, { lat: number; lng: number; el?: SVGCircleElement }>>(new Map());
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  const [activeSessions, setActiveSessions] = useState(0);
  const [topCountries, setTopCountries] = useState<TopCountry[]>([]);
  const [pagesPerMinute, setPagesPerMinute] = useState(0);
  const [showStats, setShowStats] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const drawMap = useCallback(async () => {
    if (!svgRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

    const projection = d3.geoNaturalEarth1()
      .scale(width / 5.5)
      .translate([width / 2, height / 2]);
    projectionRef.current = projection;

    const path = d3.geoPath().projection(projection);

    try {
      const resp = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
      const world = await resp.json() as Topology;
      const countries = topojson.feature(world, world.objects.countries as GeometryCollection);

      svg.append("rect").attr("width", width).attr("height", height).attr("fill", "#0d0d1a");

      svg.append("g")
        .selectAll("path")
        .data((countries as any).features)
        .enter()
        .append("path")
        .attr("d", path as any)
        .attr("fill", "#1a1a2e")
        .attr("stroke", "#16213e")
        .attr("stroke-width", 0.5);

      svg.append("g").attr("class", "dots-layer");
    } catch (err) {
      console.error("Failed to load world map:", err);
    }
  }, []);

  useEffect(() => {
    drawMap();
    const handleResize = () => drawMap();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawMap]);

  const addDot = useCallback((lat: number, lng: number, sessionId: string, isPing = false) => {
    if (!svgRef.current || !projectionRef.current) return;
    const svg = d3.select(svgRef.current);
    const dotsLayer = svg.select(".dots-layer");
    if (dotsLayer.empty()) return;

    const coords = projectionRef.current([lng, lat]);
    if (!coords) return;
    const [x, y] = coords;

    const existing = dotsLayer.select(`[data-session="${sessionId}"]`);
    if (!existing.empty()) {
      existing.attr("cx", x).attr("cy", y);
      return;
    }

    if (isPing) {
      dotsLayer.append("circle")
        .attr("cx", x).attr("cy", y).attr("r", 3)
        .attr("fill", "none").attr("stroke", "#f59e0b").attr("stroke-width", 2).attr("opacity", 1)
        .transition().duration(2000)
        .attr("r", 20).attr("opacity", 0).remove();
    }

    const dot = dotsLayer.append("circle")
      .attr("data-session", sessionId)
      .attr("cx", x).attr("cy", y)
      .attr("fill", "#f59e0b").attr("opacity", isPing ? 1 : 0.6)
      .attr("r", isPing ? 5 : 3);

    if (isPing) {
      dot.transition().duration(3000).attr("r", 3).attr("opacity", 0.6);
    }

    dotsRef.current.set(sessionId, { lat, lng });
  }, []);

  const removeDot = useCallback((sessionId: string) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.select(`[data-session="${sessionId}"]`)
      .transition().duration(1000).attr("opacity", 0).remove();
    dotsRef.current.delete(sessionId);
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/analytics/live-visitors", { withCredentials: true });

    es.addEventListener("snapshot", (e) => {
      setConnected(true);
      try {
        const data = JSON.parse(e.data);
        setActiveSessions(data.sessions.length);
        for (const s of data.sessions) {
          if (s.latitude && s.longitude) {
            addDot(Number(s.latitude), Number(s.longitude), s.sessionId);
          }
        }
      } catch {}
    });

    es.addEventListener("update", (e) => {
      try {
        const data = JSON.parse(e.data);
        setActiveSessions(data.activeSessions);
        setTopCountries(data.topCountries || []);
        setPagesPerMinute(data.pagesPerMinute || 0);

        const activeIds = new Set(data.sessions.map((s: LiveSession) => s.sessionId));
        Array.from(dotsRef.current.keys()).forEach((sid) => {
          if (!activeIds.has(sid)) removeDot(sid);
        });
        for (const s of data.sessions) {
          if (s.latitude && s.longitude) {
            addDot(Number(s.latitude), Number(s.longitude), s.sessionId);
          }
        }
      } catch {}
    });

    es.addEventListener("ping", (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.lat != null && data.lng != null) {
          const sid = `ping_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          addDot(data.lat, data.lng, sid, true);
        }
      } catch {}
    });

    es.onerror = () => setConnected(false);

    return () => es.close();
  }, [addDot, removeDot]);

  return (
    <div
      ref={containerRef}
      className={`relative ${fullscreen ? "w-screen h-screen" : "w-full aspect-[16/9]"} bg-[#0d0d1a] rounded-lg overflow-hidden`}
      data-testid="live-visitor-map"
    >
      <svg ref={svgRef} className="w-full h-full" />

      {/* Settings gear */}
      <div
        className="absolute top-3 right-3 opacity-0 hover:opacity-100 transition-opacity z-10"
        onMouseEnter={() => setShowSettings(true)}
        onMouseLeave={() => setShowSettings(false)}
      >
        <button
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70"
          onClick={() => setShowSettings(!showSettings)}
          data-testid="button-map-settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        {showSettings && (
          <div className="absolute top-10 right-0 bg-background/80 rounded-lg p-3 space-y-2 min-w-[160px] text-xs text-foreground">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showStats} onChange={(e) => setShowStats(e.target.checked)} className="rounded" />
              Stats Bar
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="rounded" />
              Country Labels
            </label>
          </div>
        )}
      </div>

      {/* Stats overlay bar */}
      {showStats && (
        <div className="absolute bottom-0 left-0 right-0 bg-background/60 backdrop-blur-sm px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-foreground" data-testid="map-stats-bar">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
              <span className="text-xs font-mono uppercase tracking-wider text-red-400">LIVE</span>
            </div>
            <span className="text-2xl font-bold font-mono tabular-nums" data-testid="text-active-visitors">
              {activeSessions}
            </span>
            <span className="text-xs text-foreground/60">visitors</span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            {topCountries.slice(0, 5).map((tc) => (
              <div key={tc.country} className="flex items-center gap-1" data-testid={`country-badge-${tc.country}`}>
                <span>{COUNTRY_FLAGS[tc.country] || "🌍"}</span>
                <span className="font-mono">{tc.count}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-foreground/60">Pages/min:</span>
            <span className="font-mono font-semibold text-amber-400" data-testid="text-pages-per-min">{pagesPerMinute}</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
