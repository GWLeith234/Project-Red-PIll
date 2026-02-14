import { useState, useEffect } from "react";
import { ChevronRight, DollarSign, Headphones, Briefcase, Shield, Factory } from "lucide-react";
import { CelebrationOverlay, useCelebration, useActivityMonitor } from "@/components/CelebrationOverlay";
import { cn } from "@/lib/utils";
import { useEpisodes, useContentPieces, useSubscribers, useDeals } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import ContentFactoryScreen from "@/components/screens/ContentFactoryScreen";
import RevenueFactoryScreen from "@/components/screens/RevenueFactoryScreen";
import CRMScreen from "@/components/screens/CRMScreen";
import AudienceScreen from "@/components/screens/AudienceScreen";
import AdminScreen from "@/components/screens/AdminScreen";

const SCREENS = [
  { key: "content", label: "Content Factory", icon: Factory },
  { key: "revenue", label: "Revenue Factory", icon: DollarSign },
  { key: "crm", label: "CRM", icon: Briefcase },
  { key: "audience", label: "Audience", icon: Headphones },
  { key: "admin", label: "Admin", icon: Shield },
] as const;

type ScreenKey = (typeof SCREENS)[number]["key"];

const SCREEN_QUERY_KEYS: Record<ScreenKey, string[][]> = {
  content: [["/api/episodes"], ["/api/content-pieces"], ["/api/moderation/counts"], ["/api/scheduled-posts"], ["/api/podcasts"], ["/api/outbound-campaigns"]],
  revenue: [["/api/advertisers"], ["/api/campaigns"], ["/api/deals"], ["/api/products"]],
  crm: [["/api/companies"], ["/api/contacts"], ["/api/deals"]],
  audience: [["/api/subscribers"], ["/api/podcasts"], ["/api/outbound-campaigns"]],
  admin: [["/api/admin/dashboard-stats"]],
};

export default function Dashboard() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("content");
  const queryClient = useQueryClient();

  const { events: celebrationEvents, celebrate, dismiss: dismissCelebration } = useCelebration();
  const activityCheck = useActivityMonitor(celebrate);
  const { data: monitorEpisodes } = useEpisodes();
  const { data: monitorContent } = useContentPieces();
  const { data: monitorSubscribers } = useSubscribers();
  const { data: monitorDeals } = useDeals();

  useEffect(() => {
    activityCheck({
      episodes: monitorEpisodes || [],
      contentPieces: monitorContent || [],
      subscribers: monitorSubscribers || [],
      deals: monitorDeals || [],
    });
  }, [monitorEpisodes, monitorContent, monitorSubscribers, monitorDeals, activityCheck]);

  useEffect(() => {
    const interval = setInterval(() => {
      const keys = SCREEN_QUERY_KEYS[activeScreen];
      keys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
    }, 30000);
    return () => clearInterval(interval);
  }, [activeScreen, queryClient]);

  const currentIdx = SCREENS.findIndex(s => s.key === activeScreen);
  const goPrev = () => {
    const prev = (currentIdx - 1 + SCREENS.length) % SCREENS.length;
    setActiveScreen(SCREENS[prev].key);
  };
  const goNext = () => {
    const next = (currentIdx + 1) % SCREENS.length;
    setActiveScreen(SCREENS[next].key);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeScreen]);

  const activeScreenData = SCREENS[currentIdx];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] animate-in fade-in duration-500" data-testid="command-center">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-foreground flex items-center gap-2">
              Command Center
              <span className="text-[10px] font-mono text-accent bg-accent/10 border border-accent/30 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">Live</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" data-testid="button-prev-screen">
            <ChevronRight className="h-4 w-4 rotate-180" />
          </button>
          <div className="flex items-center gap-1">
            {SCREENS.map((screen) => (
              <button
                key={screen.key}
                onClick={() => setActiveScreen(screen.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded-sm transition-all",
                  activeScreen === screen.key
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                )}
                data-testid={`button-screen-${screen.key}`}
              >
                <screen.icon className="h-3 w-3" />
                {screen.label}
              </button>
            ))}
          </div>
          <button onClick={goNext} className="p-1.5 rounded-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground" data-testid="button-next-screen">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 border border-border/40 rounded-lg bg-background/50 p-4 relative overflow-hidden" style={{ aspectRatio: "16/9" }} data-testid="screen-viewport">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="h-full w-full">
          {activeScreen === "content" && <ContentFactoryScreen />}
          {activeScreen === "revenue" && <RevenueFactoryScreen />}
          {activeScreen === "crm" && <CRMScreen />}
          {activeScreen === "audience" && <AudienceScreen />}
          {activeScreen === "admin" && <AdminScreen />}
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
          {SCREENS.map((screen) => (
            <button
              key={screen.key}
              onClick={() => setActiveScreen(screen.key)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                activeScreen === screen.key ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
              data-testid={`dot-screen-${screen.key}`}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 flex-shrink-0">
        <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-wider">
          {activeScreenData.label} &middot; Screen {currentIdx + 1} of {SCREENS.length}
        </p>
        <p className="text-[10px] font-mono text-muted-foreground/50">
          Use arrow keys or click to navigate
        </p>
      </div>

      <CelebrationOverlay events={celebrationEvents} onDismiss={dismissCelebration} />
    </div>
  );
}