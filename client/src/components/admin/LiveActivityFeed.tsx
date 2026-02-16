import { useEffect, useRef, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  UserPlus, FileText, Bell, MessageSquare, BarChart, Calendar, Star,
  Activity
} from "lucide-react";

interface ActivityItem {
  id: string;
  type: string;
  icon: string;
  description: string;
  timestamp: string | Date;
  metadata?: any;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  UserPlus,
  FileText,
  Bell,
  MessageSquare,
  BarChart,
  Calendar,
  Star,
};

export default function LiveActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop } = scrollRef.current;
    setAutoScroll(scrollTop < 10);
  }, []);

  useEffect(() => {
    const es = new EventSource("/api/analytics/live-feed", { withCredentials: true });

    es.addEventListener("history", (e) => {
      setConnected(true);
      try {
        const data = JSON.parse(e.data);
        setActivities(data.activities || []);
      } catch {}
    });

    es.addEventListener("activity", (e) => {
      try {
        const activity = JSON.parse(e.data) as ActivityItem;
        setActivities((prev) => [activity, ...prev].slice(0, 50));
        setNewIds((prev) => new Set(prev).add(activity.id));
        setTimeout(() => {
          setNewIds((prev) => {
            const next = new Set(prev);
            next.delete(activity.id);
            return next;
          });
        }, 3000);
      } catch {}
    });

    es.onerror = () => setConnected(false);

    return () => es.close();
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activities, autoScroll]);

  return (
    <div data-testid="live-activity-feed">
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-block w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
        <span className="text-xs font-mono uppercase tracking-wider text-green-400" data-testid="text-feed-status">
          {connected ? "Live" : "Connecting..."}
        </span>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="max-h-[500px] overflow-y-auto space-y-1 pr-1"
        data-testid="activity-feed-scroll"
      >
        {activities.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Activity className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Waiting for activity...</p>
          </div>
        )}
        {activities.map((item) => {
          const IconComponent = ICON_MAP[item.icon] || Activity;
          const isNew = newIds.has(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 py-2.5 px-3 rounded-md border border-transparent transition-all duration-500 ${
                isNew ? "bg-primary/10 border-primary/20 translate-y-0 opacity-100" : "opacity-90"
              }`}
              style={isNew ? { animation: "slideIn 0.4s ease-out" } : undefined}
              data-testid={`activity-item-${item.id}`}
            >
              <div className="mt-0.5 p-1.5 rounded-md bg-muted flex-shrink-0">
                <IconComponent className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug" data-testid={`text-activity-desc-${item.id}`}>
                  {item.description}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono" data-testid={`text-activity-time-${item.id}`}>
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
