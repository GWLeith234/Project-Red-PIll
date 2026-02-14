import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

export type CelebrationEvent = {
  id: string;
  type: "transcription" | "content_shipped" | "subscriber" | "revenue";
  title: string;
  subtitle?: string;
  timestamp?: number;
};

const EVENT_CONFIG: Record<string, { emoji: string; color: string; glow: string; label: string }> = {
  transcription: { emoji: "\u{1F3A7}", color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/40", label: "TRANSCRIPTION COMPLETE" },
  content_shipped: { emoji: "\u{1F680}", color: "from-emerald-500 to-green-500", glow: "shadow-emerald-500/40", label: "CONTENT SHIPPED" },
  subscriber: { emoji: "\u{1F389}", color: "from-violet-500 to-purple-500", glow: "shadow-violet-500/40", label: "NEW SUBSCRIBER" },
  revenue: { emoji: "\u{1F4B0}", color: "from-amber-500 to-yellow-500", glow: "shadow-amber-500/40", label: "REVENUE BOOKED" },
};

function Particle({ delay, x }: { delay: number; x: number }) {
  const shapes = ["\u2728", "\u2B50", "\u{1F31F}", "\u{1F4AB}", "\u2728"];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  return (
    <span
      className="absolute text-sm pointer-events-none animate-[celebParticle_1.2s_ease-out_forwards]"
      style={{
        left: `${x}%`,
        bottom: "0",
        animationDelay: `${delay}ms`,
        opacity: 0,
      }}
    >
      {shape}
    </span>
  );
}

function CelebrationToast({ event, onDone }: { event: CelebrationEvent; onDone: () => void }) {
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.content_shipped;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("show"), 50);
    const t2 = setTimeout(() => setPhase("exit"), 2800);
    const t3 = setTimeout(onDone, 3300);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const particles = Array.from({ length: 8 }, (_, i) => ({
    delay: Math.random() * 400,
    x: 10 + Math.random() * 80,
  }));

  return (
    <div className={cn(
      "relative flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 backdrop-blur-xl transition-all duration-500 overflow-hidden",
      `bg-gradient-to-r ${config.color} shadow-lg ${config.glow}`,
      phase === "enter" && "translate-y-4 opacity-0 scale-95",
      phase === "show" && "translate-y-0 opacity-100 scale-100",
      phase === "exit" && "-translate-y-2 opacity-0 scale-95",
    )}>
      <div className="relative">
        {particles.map((p, i) => <Particle key={i} delay={p.delay} x={p.x} />)}
      </div>
      <span className="text-2xl animate-[celebBounce_0.6s_ease-out]">{config.emoji}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-mono font-bold text-white/80 uppercase tracking-widest">{config.label}</p>
        <p className="text-sm font-semibold text-white truncate">{event.title}</p>
        {event.subtitle && <p className="text-[10px] text-white/70 font-mono truncate">{event.subtitle}</p>}
      </div>
      <div className="absolute inset-0 bg-white/10 animate-[celebFlash_0.4s_ease-out]" />
    </div>
  );
}

export function useCelebration() {
  const [events, setEvents] = useState<CelebrationEvent[]>([]);
  const [winLog, setWinLog] = useState<CelebrationEvent[]>([]);

  const celebrate = useCallback((event: Omit<CelebrationEvent, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const fullEvent = { ...event, id, timestamp: Date.now() };
    setEvents(prev => [...prev, fullEvent]);
    setWinLog(prev => [fullEvent, ...prev].slice(0, 50));
  }, []);

  const dismiss = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  return { events, celebrate, dismiss, winLog };
}

export { EVENT_CONFIG };

export function CelebrationOverlay({
  events,
  onDismiss,
}: {
  events: CelebrationEvent[];
  onDismiss: (id: string) => void;
}) {
  if (events.length === 0) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none max-w-sm">
      {events.slice(-4).map((ev) => (
        <div key={ev.id} className="pointer-events-auto">
          <CelebrationToast event={ev} onDone={() => onDismiss(ev.id)} />
        </div>
      ))}
    </div>
  );
}

export function useActivityMonitor(celebrate: (e: Omit<CelebrationEvent, "id">) => void) {
  const prevRef = useRef<{
    completedEps: Set<string>;
    shippedContent: Set<string>;
    subscriberCount: number;
    wonDeals: Set<string>;
    init: boolean;
  }>({ completedEps: new Set(), shippedContent: new Set(), subscriberCount: 0, wonDeals: new Set(), init: false });

  const check = useCallback((data: {
    episodes?: any[];
    contentPieces?: any[];
    subscribers?: any[];
    deals?: any[];
  }) => {
    const prev = prevRef.current;
    const { episodes = [], contentPieces = [], subscribers = [], deals = [] } = data;

    const completedEps = new Set(
      episodes.filter((ep: any) => ep.transcriptStatus === "complete").map((ep: any) => ep.id)
    );
    const shippedContent = new Set(
      contentPieces.filter((cp: any) => cp.status === "approved" || cp.status === "published").map((cp: any) => cp.id)
    );
    const subCount = subscribers.length;
    const wonDeals = new Set(
      deals.filter((d: any) => d.stage === "closed_won").map((d: any) => d.id)
    );

    if (!prev.init) {
      prev.completedEps = completedEps;
      prev.shippedContent = shippedContent;
      prev.subscriberCount = subCount;
      prev.wonDeals = wonDeals;
      prev.init = true;
      return;
    }

    completedEps.forEach((id) => {
      if (!prev.completedEps.has(id)) {
        const ep = episodes.find((e: any) => e.id === id);
        celebrate({ type: "transcription", title: ep?.title || "Episode", subtitle: "Transcription complete" });
      }
    });

    shippedContent.forEach((id) => {
      if (!prev.shippedContent.has(id)) {
        const cp = contentPieces.find((c: any) => c.id === id);
        celebrate({ type: "content_shipped", title: cp?.title || "Content", subtitle: cp?.type || "Published" });
      }
    });

    if (subCount > prev.subscriberCount) {
      const diff = subCount - prev.subscriberCount;
      celebrate({ type: "subscriber", title: `${diff} new subscriber${diff > 1 ? "s" : ""}`, subtitle: "Audience growing" });
    }

    wonDeals.forEach((id) => {
      if (!prev.wonDeals.has(id)) {
        const deal = deals.find((d: any) => d.id === id);
        const value = deal?.value ? `$${Number(deal.value).toLocaleString()}` : "";
        celebrate({ type: "revenue", title: deal?.name || "New Deal Won", subtitle: value ? `${value} booked` : "Revenue booked" });
      }
    });

    prev.completedEps = completedEps;
    prev.shippedContent = shippedContent;
    prev.subscriberCount = subCount;
    prev.wonDeals = wonDeals;
  }, [celebrate]);

  return check;
}
