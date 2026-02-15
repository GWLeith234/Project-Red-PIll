import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Calendar, Plus, Trash2, Edit3, Clock, Sparkles, Lightbulb, Loader2,
  Linkedin, Facebook, Building2, ChevronLeft, ChevronRight, Zap,
  Newspaper, PenLine, Mail, Mic, Video, ArrowRight, CalendarIcon, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useContentPieces, useScheduledPosts, useCreateScheduledPost,
  useUpdateScheduledPost, useDeleteScheduledPost, useSmartSuggestions,
  useAutoSchedule, useEpisodes,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48c1.77-1.77 2.36-4.26 2.36-5.95V9.26a8.27 8.27 0 004.85 1.57V7.39a4.85 4.85 0 01-1.63-.7z"/>
  </svg>
);

const CHANNEL_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: any }> = {
  x: { label: "X", color: "text-sky-400", bg: "bg-sky-500/15", border: "border-sky-500/40", icon: XIcon },
  facebook: { label: "Facebook", color: "text-blue-500", bg: "bg-blue-500/15", border: "border-blue-500/40", icon: Facebook },
  instagram: { label: "Instagram", color: "text-pink-500", bg: "bg-pink-500/15", border: "border-pink-500/40", icon: InstagramIcon },
  linkedin: { label: "LinkedIn", color: "text-blue-600", bg: "bg-blue-600/15", border: "border-blue-600/40", icon: Linkedin },
  tiktok: { label: "TikTok", color: "text-fuchsia-400", bg: "bg-fuchsia-500/15", border: "border-fuchsia-500/40", icon: TikTokIcon },
  blog: { label: "Blog", color: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-500/40", icon: PenLine },
  newsletter: { label: "Newsletter", color: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-500/40", icon: Mail },
  podcast: { label: "Podcast", color: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-500/40", icon: Mic },
  google_business: { label: "Google Biz", color: "text-red-400", bg: "bg-red-500/15", border: "border-red-500/40", icon: Building2 },
};

function getChannelConfig(platform: string) {
  return CHANNEL_CONFIG[platform] || { label: platform, color: "text-muted-foreground", bg: "bg-muted/20", border: "border-border/50", icon: Calendar };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_MAP: Record<string, number> = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

function parseSuggestionTime(timeStr: string): string | null {
  try {
    const lower = timeStr.toLowerCase();
    const timeMatch = lower.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
    let hours = 9, minutes = 0;
    if (timeMatch) {
      hours = parseInt(timeMatch[1]);
      minutes = parseInt(timeMatch[2]);
      if (timeMatch[3]?.toLowerCase() === "pm" && hours < 12) hours += 12;
      if (timeMatch[3]?.toLowerCase() === "am" && hours === 12) hours = 0;
    }
    const now = new Date();
    let targetDate = new Date(now);
    for (const [dayName, dayNum] of Object.entries(WEEKDAY_MAP)) {
      if (lower.includes(dayName)) {
        const diff = (dayNum - now.getDay() + 7) % 7 || 7;
        targetDate = new Date(now);
        targetDate.setDate(now.getDate() + diff);
        break;
      }
    }
    if (targetDate.getTime() === now.getTime()) {
      targetDate.setDate(now.getDate() + 1);
    }
    return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, "0")}-${String(targetDate.getDate()).padStart(2, "0")}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  } catch {
    return null;
  }
}

export default function SchedulerPage() {
  const { data: posts, isLoading } = useScheduledPosts();
  const { data: contentPieces } = useContentPieces();
  const { data: episodes } = useEpisodes();
  const createPost = useCreateScheduledPost();
  const updatePost = useUpdateScheduledPost();
  const deletePost = useDeleteScheduledPost();
  const smartSuggestions = useSmartSuggestions();
  const autoSchedule = useAutoSchedule();
  const { toast } = useToast();

  function getContentUrl(piece: any): string {
    if (!piece) return "";
    const episode = episodes?.find((e: any) => e.id === piece.episodeId);
    const base = window.location.origin;
    if (episode?.podcastId) {
      return `${base}/news/${episode.podcastId}/article/${piece.id}`;
    }
    return `${base}/news/article/${piece.id}`;
  }

  function resolveLinks(text: string, piece: any): string {
    if (!text || !piece) return text;
    const url = getContentUrl(piece);
    return text.replace(/\[LINK\]/gi, url);
  }

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [draggedPost, setDraggedPost] = useState<any>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [autoScheduleResult, setAutoScheduleResult] = useState<any>(null);
  const [smartFillOpen, setSmartFillOpen] = useState(false);
  const [smartFillMode, setSmartFillMode] = useState<"review" | "auto">("review");
  const [smartFillRange, setSmartFillRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [form, setForm] = useState({
    contentPieceId: "",
    platform: "",
    scheduledAt: "",
    postText: "",
    hashtags: "",
  });
  const [suggestions, setSuggestions] = useState<any>(null);
  const [filterChannel, setFilterChannel] = useState<string>("all");

  function toLocalDateKey(dateVal: string | Date) {
    const d = new Date(dateVal);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const postsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    if (!posts) return map;
    for (const post of posts) {
      if (!post.scheduledAt) continue;
      const dateKey = toLocalDateKey(post.scheduledAt);
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(post);
    }
    return map;
  }, [posts]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  function prevMonth() {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  }
  function goToToday() {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  }

  function openNewDialog(dateStr?: string) {
    setEditingPost(null);
    const dt = dateStr ? `${dateStr}T09:00` : "";
    setForm({ contentPieceId: "", platform: "", scheduledAt: dt, postText: "", hashtags: "" });
    setDialogOpen(true);
  }

  function openEditDialog(post: any) {
    setEditingPost(post);
    setForm({
      contentPieceId: post.contentPieceId,
      platform: post.platform,
      scheduledAt: post.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0, 16) : "",
      postText: post.postText || "",
      hashtags: (post.hashtags || []).join(", "),
    });
    setDialogOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const selectedPiece = contentPieces?.find((p: any) => p.id === form.contentPieceId);
    const data: any = {
      contentPieceId: form.contentPieceId,
      platform: form.platform,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : new Date().toISOString(),
      postText: resolveLinks(form.postText || "", selectedPiece),
      hashtags: form.hashtags ? form.hashtags.split(",").map(h => h.trim()).filter(Boolean) : [],
    };

    if (editingPost) {
      updatePost.mutate({ id: editingPost.id, ...data }, {
        onSuccess: () => { toast({ title: "Post Updated" }); setDialogOpen(false); },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    } else {
      createPost.mutate(data, {
        onSuccess: () => { toast({ title: "Post Scheduled" }); setDialogOpen(false); },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      });
    }
  }

  function handleDelete(id: string) {
    deletePost.mutate(id, {
      onSuccess: () => toast({ title: "Post Deleted" }),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleGetSuggestions() {
    if (!form.contentPieceId) return;
    const piece = contentPieces?.find((p: any) => p.id === form.contentPieceId);
    if (!piece?.episodeId) return;
    smartSuggestions.mutate({ episodeId: piece.episodeId }, {
      onSuccess: (data: any) => setSuggestions(data),
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  function handleAutoSchedule() {
    const startDate = smartFillRange.from
      ? smartFillRange.from.toISOString()
      : new Date(currentYear, currentMonth, 1).toISOString();
    const endDate = smartFillRange.to
      ? smartFillRange.to.toISOString()
      : undefined;
    const isAuto = smartFillMode === "auto";

    autoSchedule.mutate(
      { contentPieceIds: [], startDate, endDate, autoCreate: isAuto },
      {
        onSuccess: (data: any) => {
          setSmartFillOpen(false);
          if (isAuto && data.autoCreated) {
            toast({
              title: "Content Calendar Ready!",
              description: `${data.createdCount} posts auto-scheduled and awaiting your review. Check the calendar for pending items.`,
            });
            setAutoScheduleResult(null);
          } else {
            setAutoScheduleResult(data);
            if (data.scheduledItems?.length > 0) {
              toast({ title: "AI Schedule Ready", description: `${data.scheduledItems.length} slots suggested. Review and confirm below.` });
            } else {
              toast({ title: "No Gaps Found", description: data.strategy || "Your schedule looks full!" });
            }
          }
        },
        onError: (err: any) => toast({ title: "Auto-Schedule Error", description: err.message, variant: "destructive" }),
      }
    );
  }

  function confirmAutoScheduleItem(item: any) {
    createPost.mutate(
      {
        contentPieceId: item.contentPieceId,
        platform: item.platform,
        scheduledAt: item.scheduledAt,
        postText: item.postText || "",
        hashtags: [],
      },
      {
        onSuccess: () => {
          toast({ title: "Scheduled", description: `Post added to ${getChannelConfig(item.platform).label}` });
          setAutoScheduleResult((prev: any) => ({
            ...prev,
            scheduledItems: prev.scheduledItems.filter((i: any) => i !== item),
          }));
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  }

  function confirmAllAutoSchedule() {
    if (!autoScheduleResult?.scheduledItems?.length) return;
    for (const item of autoScheduleResult.scheduledItems) {
      confirmAutoScheduleItem(item);
    }
  }

  function handleDragStart(post: any) {
    setDraggedPost(post);
  }

  function handleDragOver(e: React.DragEvent, dateStr: string) {
    e.preventDefault();
    setDragOverDate(dateStr);
  }

  function handleDragLeave() {
    setDragOverDate(null);
  }

  function handleDrop(e: React.DragEvent, dateStr: string) {
    e.preventDefault();
    setDragOverDate(null);
    if (!draggedPost) return;

    const oldDate = new Date(draggedPost.scheduledAt);
    const [year, month, day] = dateStr.split("-").map(Number);
    const newDate = new Date(year, month - 1, day, oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    updatePost.mutate(
      { id: draggedPost.id, scheduledAt: newDate.toISOString() },
      {
        onSuccess: () => {
          toast({ title: "Rescheduled", description: `Moved to ${newDate.toLocaleDateString()}` });
          setDraggedPost(null);
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err.message, variant: "destructive" });
          setDraggedPost(null);
        },
      }
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "published": return "border-emerald-500 text-emerald-500 bg-emerald-500/10";
      case "scheduled": return "border-primary text-primary bg-primary/10";
      case "draft": return "border-muted text-muted-foreground";
      case "failed": return "border-red-500 text-red-500 bg-red-500/10";
      default: return "border-muted text-muted-foreground";
    }
  };

  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) {
    calendarCells.push({ day: 0, dateStr: "" });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarCells.push({ day: d, dateStr });
  }

  const todayStr = toLocalDateKey(today);

  const channelStats = useMemo(() => {
    const stats: Record<string, number> = {};
    if (!posts) return stats;
    for (const post of posts) {
      const d = new Date(post.scheduledAt);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        stats[post.platform] = (stats[post.platform] || 0) + 1;
      }
    }
    return stats;
  }, [posts, currentMonth, currentYear]);

  const selectedDatePosts = selectedDate ? (postsByDate[selectedDate] || []) : [];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/50 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Content Calendar</h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Schedule, visualize, and optimize your content distribution</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              setSmartFillRange({
                from: new Date(currentYear, currentMonth, 1),
                to: new Date(currentYear, currentMonth + 1, 0),
              });
              setSmartFillMode("review");
              setSmartFillOpen(true);
            }}
            disabled={autoSchedule.isPending}
            variant="outline"
            className="font-mono text-xs uppercase tracking-wider border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground"
            data-testid="button-ai-auto-schedule"
          >
            {autoSchedule.isPending ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1.5 h-3 w-3" />}
            AI Smart Fill
          </Button>
          <Button onClick={() => openNewDialog()} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-schedule-post">
            <Plus className="mr-1.5 h-3 w-3" /> Schedule Post
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mr-1">Channels:</span>
        <Badge
          variant="outline"
          className={cn("font-mono text-[10px] cursor-pointer transition-all", filterChannel === "all" ? "bg-primary/20 border-primary/50 text-primary" : "hover:bg-card/60")}
          onClick={() => setFilterChannel("all")}
          data-testid="filter-all"
        >
          All
        </Badge>
        {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => {
          const count = channelStats[key] || 0;
          return (
            <Badge
              key={key}
              variant="outline"
              className={cn(
                "font-mono text-[10px] cursor-pointer transition-all gap-1",
                filterChannel === key ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "hover:bg-card/60"
              )}
              onClick={() => setFilterChannel(filterChannel === key ? "all" : key)}
              data-testid={`filter-${key}`}
            >
              <cfg.icon className="h-2.5 w-2.5" />
              {cfg.label}
              {count > 0 && <span className="ml-0.5 opacity-70">({count})</span>}
            </Badge>
          );
        })}
      </div>

      {autoScheduleResult && autoScheduleResult.scheduledItems?.length > 0 && (
        <Card className="glass-panel border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Suggested Schedule
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="font-mono text-[10px] uppercase tracking-wider"
                  onClick={() => setAutoScheduleResult(null)}
                  data-testid="button-dismiss-suggestions"
                >
                  Dismiss
                </Button>
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-[10px] uppercase tracking-wider"
                  onClick={confirmAllAutoSchedule}
                  disabled={createPost.isPending}
                  data-testid="button-confirm-all"
                >
                  <Zap className="mr-1 h-3 w-3" /> Accept All
                </Button>
              </div>
            </div>
            {autoScheduleResult.strategy && (
              <CardDescription className="font-mono text-xs mt-1">{autoScheduleResult.strategy}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {autoScheduleResult.gapsIdentified?.length > 0 && (
              <div className="mb-3 space-y-1">
                <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Gaps Found:</span>
                {autoScheduleResult.gapsIdentified.map((gap: string, i: number) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ArrowRight className="h-2.5 w-2.5 text-primary shrink-0" /> {gap}
                  </p>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {autoScheduleResult.scheduledItems.map((item: any, i: number) => {
                const cfg = getChannelConfig(item.platform);
                const piece = contentPieces?.find((p: any) => p.id === item.contentPieceId);
                return (
                  <div key={i} className={cn("p-3 rounded-lg border", cfg.bg, cfg.border)} data-testid={`ai-suggestion-${i}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <cfg.icon className={cn("h-3.5 w-3.5", cfg.color)} />
                        <span className={cn("font-mono text-xs font-semibold", cfg.color)}>{cfg.label}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-2 font-mono text-[9px] uppercase text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => confirmAutoScheduleItem(item)}
                        disabled={createPost.isPending}
                        data-testid={`button-accept-${i}`}
                      >
                        Accept
                      </Button>
                    </div>
                    <p className="text-xs font-medium truncate">{piece?.title || "Content"}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground font-mono">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(item.scheduledAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </div>
                    {item.reason && <p className="text-[10px] text-muted-foreground/70 mt-1 italic">{item.reason}</p>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-9">
          <Card className="glass-panel border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={prevMonth} data-testid="button-prev-month">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="font-display text-lg font-bold min-w-[180px] text-center" data-testid="text-current-month">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </h2>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={nextMonth} data-testid="button-next-month">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="font-mono text-[10px] uppercase tracking-wider" onClick={goToToday} data-testid="button-today">
                    Today
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <div className="overflow-x-auto">
              <div className="grid grid-cols-7 gap-px bg-border/30 rounded-lg overflow-hidden min-w-[700px]">
                {DAY_NAMES.map(day => (
                  <div key={day} className="bg-card/50 p-2 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{day}</span>
                  </div>
                ))}

                {calendarCells.map((cell, idx) => {
                  if (cell.day === 0) {
                    return <div key={`empty-${idx}`} className="bg-card/20 min-h-[100px]" />;
                  }
                  const dayPosts = postsByDate[cell.dateStr] || [];
                  const filteredPosts = filterChannel === "all" ? dayPosts : dayPosts.filter(p => p.platform === filterChannel);
                  const isToday = cell.dateStr === todayStr;
                  const isSelected = cell.dateStr === selectedDate;
                  const isDragOver = cell.dateStr === dragOverDate;

                  return (
                    <div
                      key={cell.dateStr}
                      className={cn(
                        "bg-card/30 min-h-[100px] p-1.5 transition-all cursor-pointer relative group",
                        isToday && "bg-primary/5 ring-1 ring-inset ring-primary/30",
                        isSelected && "bg-primary/10 ring-1 ring-inset ring-primary/50",
                        isDragOver && "bg-primary/20 ring-2 ring-inset ring-primary/60",
                        "hover:bg-card/50"
                      )}
                      onClick={() => setSelectedDate(cell.dateStr === selectedDate ? null : cell.dateStr)}
                      onDragOver={(e) => handleDragOver(e, cell.dateStr)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, cell.dateStr)}
                      data-testid={`calendar-day-${cell.dateStr}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={cn(
                          "font-mono text-xs font-semibold",
                          isToday ? "text-primary bg-primary/20 rounded-full w-6 h-6 flex items-center justify-center" : "text-muted-foreground"
                        )}>
                          {cell.day}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); openNewDialog(cell.dateStr); }}
                          data-testid={`button-add-${cell.dateStr}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="space-y-0.5">
                        {filteredPosts.slice(0, 3).map((post: any) => {
                          const cfg = getChannelConfig(post.platform);
                          const piece = contentPieces?.find((p: any) => p.id === post.contentPieceId);
                          return (
                            <HoverCard key={post.id} openDelay={200} closeDelay={100}>
                              <HoverCardTrigger asChild>
                                <div
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[9px] font-mono truncate border cursor-grab active:cursor-grabbing transition-all hover:opacity-80",
                                    cfg.bg, cfg.border, cfg.color
                                  )}
                                  draggable
                                  onDragStart={(e) => { e.stopPropagation(); handleDragStart(post); }}
                                  onClick={(e) => { e.stopPropagation(); openEditDialog(post); }}
                                  data-testid={`calendar-post-${post.id}`}
                                >
                                  <span className="flex items-center gap-1">
                                    <cfg.icon className="h-2 w-2 shrink-0" />
                                    {piece?.title?.slice(0, 20) || "Post"}
                                  </span>
                                </div>
                              </HoverCardTrigger>
                              <HoverCardContent side="right" align="start" className="w-72 p-0 border-border/60 bg-card z-50" sideOffset={8}>
                                <div className={cn("px-3 py-2 border-b flex items-center gap-2", cfg.bg, cfg.border)}>
                                  <cfg.icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
                                  <span className={cn("font-mono text-xs font-semibold", cfg.color)}>{cfg.label}</span>
                                  <Badge variant="outline" className={cn("ml-auto font-mono text-[8px] uppercase", statusColor(post.status))}>
                                    {post.status}
                                  </Badge>
                                </div>
                                <div className="px-3 py-2.5 space-y-2">
                                  <p className="text-sm font-medium leading-tight">{piece?.title || "Untitled"}</p>
                                  {piece?.description && (
                                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-3">{piece.description}</p>
                                  )}
                                  {post.postText && (
                                    <div className="bg-muted/30 rounded p-2 border border-border/30">
                                      <p className="text-[11px] text-foreground/80 leading-snug line-clamp-4">{post.postText}</p>
                                    </div>
                                  )}
                                  {post.hashtags && post.hashtags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {post.hashtags.slice(0, 5).map((tag: string, ti: number) => (
                                        <span key={ti} className="text-[9px] font-mono text-primary/70 bg-primary/5 rounded px-1.5 py-0.5">#{tag}</span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono pt-1 border-t border-border/30">
                                    <Clock className="h-2.5 w-2.5" />
                                    {new Date(post.scheduledAt).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                  </div>
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          );
                        })}
                        {filteredPosts.length > 3 && (
                          <span className="text-[8px] font-mono text-muted-foreground px-1">+{filteredPosts.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-4">
          <Card className="glass-panel border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm">
                {selectedDate ? (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {new Date(selectedDate + "T00:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Day Detail
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedDate ? (
                <p className="text-xs text-muted-foreground font-mono py-4 text-center">Click a day on the calendar to see details</p>
              ) : selectedDatePosts.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-xs text-muted-foreground font-mono mb-2">No posts scheduled</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="font-mono text-[10px] uppercase tracking-wider"
                    onClick={() => openNewDialog(selectedDate)}
                    data-testid="button-add-from-detail"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDatePosts.map((post: any) => {
                    const cfg = getChannelConfig(post.platform);
                    const piece = contentPieces?.find((p: any) => p.id === post.contentPieceId);
                    return (
                      <div key={post.id} className={cn("p-2.5 rounded-lg border", cfg.bg, cfg.border)} data-testid={`detail-post-${post.id}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <cfg.icon className={cn("h-3 w-3", cfg.color)} />
                            <span className={cn("font-mono text-[10px] font-semibold", cfg.color)}>{cfg.label}</span>
                          </div>
                          <div className="flex gap-0.5">
                            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEditDialog(post)} data-testid={`button-edit-detail-${post.id}`}>
                              <Edit3 className="h-2.5 w-2.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-5 w-5 text-red-500 hover:text-red-400" onClick={() => handleDelete(post.id)} data-testid={`button-delete-detail-${post.id}`}>
                              <Trash2 className="h-2.5 w-2.5" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs font-medium truncate">{piece?.title || "Untitled"}</p>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-muted-foreground font-mono">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(post.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        </div>
                        {post.postText && (
                          <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{post.postText}</p>
                        )}
                        <Badge variant="outline" className={cn("font-mono text-[8px] uppercase mt-1.5", statusColor(post.status))}>
                          {post.status}
                        </Badge>
                      </div>
                    );
                  })}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full font-mono text-[10px] uppercase tracking-wider mt-2"
                    onClick={() => openNewDialog(selectedDate)}
                    data-testid="button-add-more"
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-panel border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Monthly Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => {
                const count = channelStats[key] || 0;
                if (count === 0 && key !== "x" && key !== "blog" && key !== "newsletter" && key !== "podcast") return null;
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", cfg.bg, cfg.border, "border")} />
                      <span className="font-mono text-xs">{cfg.label}</span>
                    </div>
                    <span className={cn("font-mono text-xs font-semibold", count > 0 ? cfg.color : "text-muted-foreground/40")}>{count}</span>
                  </div>
                );
              })}
              <div className="border-t border-border/30 pt-2 mt-2 flex items-center justify-between">
                <span className="font-mono text-xs font-semibold">Total</span>
                <span className="font-mono text-xs font-bold text-foreground">
                  {Object.values(channelStats).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-panel border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingPost ? "Edit Scheduled Post" : "Schedule New Post"}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {editingPost ? "Update the scheduled post details" : "Schedule content to be published on social platforms"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Content Piece</Label>
              <Select value={form.contentPieceId} onValueChange={(v) => setForm({ ...form, contentPieceId: v })}>
                <SelectTrigger data-testid="select-schedule-content">
                  <SelectValue placeholder="Select content..." />
                </SelectTrigger>
                <SelectContent>
                  {contentPieces?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.contentPieceId && (() => {
                const piece = contentPieces?.find((p: any) => p.id === form.contentPieceId);
                if (!piece) return null;
                const contentUrl = getContentUrl(piece);
                return (
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/30 border border-border/30">
                    <Newspaper className="h-3 w-3 text-primary shrink-0" />
                    <a
                      href={contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline truncate font-mono"
                      data-testid="link-content-preview"
                    >
                      {piece.title}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-auto h-5 px-1.5 text-[9px] font-mono"
                      onClick={() => {
                        navigator.clipboard.writeText(contentUrl);
                        toast({ title: "Link Copied" });
                      }}
                      data-testid="button-copy-content-link"
                    >
                      Copy Link
                    </Button>
                  </div>
                );
              })()}
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Channel</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger data-testid="select-schedule-platform">
                  <SelectValue placeholder="Select channel..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <cfg.icon className={cn("h-3 w-3", cfg.color)} />
                        {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Date & Time</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !form.scheduledAt && "text-muted-foreground"
                      )}
                      data-testid="input-schedule-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.scheduledAt
                        ? new Date(form.scheduledAt).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarPicker
                      mode="single"
                      selected={form.scheduledAt ? new Date(form.scheduledAt) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const prev = form.scheduledAt ? new Date(form.scheduledAt) : new Date();
                          date.setHours(prev.getHours(), prev.getMinutes());
                          setForm({ ...form, scheduledAt: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` });
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-1">
                  <Select
                    value={form.scheduledAt ? String(new Date(form.scheduledAt).getHours()) : ""}
                    onValueChange={(h) => {
                      const d = form.scheduledAt ? new Date(form.scheduledAt) : new Date();
                      d.setHours(parseInt(h));
                      setForm({ ...form, scheduledAt: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` });
                    }}
                  >
                    <SelectTrigger className="w-[70px]" data-testid="select-schedule-hour">
                      <SelectValue placeholder="HH" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground font-mono">:</span>
                  <Select
                    value={form.scheduledAt ? String(new Date(form.scheduledAt).getMinutes()) : ""}
                    onValueChange={(m) => {
                      const d = form.scheduledAt ? new Date(form.scheduledAt) : new Date();
                      d.setMinutes(parseInt(m));
                      setForm({ ...form, scheduledAt: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}` });
                    }}
                  >
                    <SelectTrigger className="w-[70px]" data-testid="select-schedule-minute">
                      <SelectValue placeholder="MM" />
                    </SelectTrigger>
                    <SelectContent className="max-h-48">
                      {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {String(m).padStart(2, "0")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Post Text</Label>
              <Textarea
                value={form.postText}
                onChange={(e) => setForm({ ...form, postText: e.target.value })}
                placeholder="Write your post text..."
                rows={4}
                data-testid="input-schedule-text"
              />
              {form.postText?.includes("[LINK]") && form.contentPieceId && (
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-amber-400 font-mono">[LINK] will be replaced with the content URL on save</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1.5 text-[9px] font-mono text-primary"
                    onClick={() => {
                      const piece = contentPieces?.find((p: any) => p.id === form.contentPieceId);
                      setForm({ ...form, postText: resolveLinks(form.postText, piece) });
                    }}
                    data-testid="button-resolve-link"
                  >
                    Replace Now
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Hashtags</Label>
              <Input
                value={form.hashtags}
                onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                placeholder="#podcast, #ai, #content"
                data-testid="input-schedule-hashtags"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetSuggestions}
                disabled={!form.contentPieceId || smartSuggestions.isPending}
                className="font-mono text-xs"
                data-testid="button-get-suggestions"
              >
                {smartSuggestions.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                Get Suggestions
              </Button>
            </div>
            {suggestions && (
              <div className="space-y-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                {suggestions.overallStrategy && (
                  <p className="text-xs text-foreground/80 mb-2">{suggestions.overallStrategy}</p>
                )}
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Click a suggestion to apply it:</p>
                {Array.isArray(suggestions.suggestions) && suggestions.suggestions.slice(0, 5).map((s: any, i: number) => {
                  const cfg = getChannelConfig(s.platform || "");
                  const selectedPieceForCheck = contentPieces?.find((p: any) => p.id === form.contentPieceId);
                  const resolvedText = resolveLinks(s.suggestedText || s.postText || "", selectedPieceForCheck);
                  const isApplied = form.platform === s.platform && form.postText === resolvedText;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const updates: any = { ...form };
                        if (s.platform) updates.platform = s.platform;
                        const selectedPiece = contentPieces?.find((p: any) => p.id === form.contentPieceId);
                        if (s.suggestedText || s.postText) {
                          const rawText = s.suggestedText || s.postText;
                          updates.postText = resolveLinks(rawText, selectedPiece);
                        }
                        if (s.hashtags) updates.hashtags = Array.isArray(s.hashtags) ? s.hashtags.join(", ") : s.hashtags;
                        if (s.bestTime) {
                          const parsed = parseSuggestionTime(s.bestTime);
                          if (parsed) updates.scheduledAt = parsed;
                        }
                        setForm(updates);
                        toast({ title: "Suggestion Applied", description: `${cfg.label} recommendation loaded into form` });
                      }}
                      className={cn(
                        "w-full text-left rounded-lg p-2.5 border transition-all",
                        isApplied
                          ? "bg-primary/10 border-primary/40 ring-1 ring-primary/30"
                          : "bg-background/50 border-border/40 hover:border-primary/30 hover:bg-primary/5"
                      )}
                      data-testid={`suggestion-apply-${i}`}
                    >
                      <div className="flex items-center gap-2">
                        <cfg.icon className={cn("h-3.5 w-3.5 shrink-0", cfg.color)} />
                        <span className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</span>
                        {s.bestTime && (
                          <span className="text-[10px] text-muted-foreground ml-auto font-mono">{s.bestTime}</span>
                        )}
                        {isApplied && <Check className="h-3 w-3 text-primary ml-1" />}
                      </div>
                      {s.tip && <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{s.tip}</p>}
                      {(s.suggestedText || s.postText) && (
                        <p className="text-[10px] text-foreground/70 mt-1.5 leading-snug line-clamp-2 italic">"{(s.suggestedText || s.postText).slice(0, 120)}..."</p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="font-mono text-xs" data-testid="button-cancel-schedule">Cancel</Button>
              <Button type="submit" disabled={createPost.isPending || updatePost.isPending || !form.contentPieceId || !form.platform} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-schedule">
                {(createPost.isPending || updatePost.isPending) ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Calendar className="mr-2 h-3 w-3" />}
                {editingPost ? "Update" : "Schedule"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={smartFillOpen} onOpenChange={setSmartFillOpen}>
        <DialogContent className="glass-panel border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Smart Fill
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              Let AI analyze your calendar and fill scheduling gaps automatically
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase tracking-wider">Date Range</Label>
              <div className="flex justify-center">
                <CalendarPicker
                  mode="range"
                  selected={smartFillRange}
                  onSelect={(range: any) => {
                    if (range) setSmartFillRange({ from: range.from, to: range.to });
                  }}
                  numberOfMonths={1}
                />
              </div>
              {smartFillRange.from && smartFillRange.to && (
                <p className="text-center text-[11px] font-mono text-muted-foreground">
                  {smartFillRange.from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} — {smartFillRange.to.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="font-mono text-xs uppercase tracking-wider">Schedule Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSmartFillMode("review")}
                  className={cn(
                    "rounded-lg p-3 border text-left transition-all",
                    smartFillMode === "review"
                      ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                      : "bg-background/50 border-border/40 hover:border-primary/30"
                  )}
                  data-testid="smartfill-mode-review"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Edit3 className={cn("h-4 w-4", smartFillMode === "review" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-mono text-xs font-semibold">Review First</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    AI suggests posts for you to review and accept individually
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setSmartFillMode("auto")}
                  className={cn(
                    "rounded-lg p-3 border text-left transition-all",
                    smartFillMode === "auto"
                      ? "bg-primary/10 border-primary/50 ring-1 ring-primary/30"
                      : "bg-background/50 border-border/40 hover:border-primary/30"
                  )}
                  data-testid="smartfill-mode-auto"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={cn("h-4 w-4", smartFillMode === "auto" ? "text-primary" : "text-muted-foreground")} />
                    <span className="font-mono text-xs font-semibold">Auto Schedule</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    AI creates posts automatically and notifies you when ready to moderate
                  </p>
                </button>
              </div>
            </div>

            {smartFillMode === "auto" && (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5">
                <p className="text-[11px] text-amber-400 font-mono leading-snug">
                  Auto mode will create scheduled posts with "pending review" status. You'll be notified when the content calendar is ready for moderation.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setSmartFillOpen(false)} className="font-mono text-xs" data-testid="button-cancel-smart-fill">
              Cancel
            </Button>
            <Button
              onClick={handleAutoSchedule}
              disabled={autoSchedule.isPending || !smartFillRange.from || !smartFillRange.to}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider"
              data-testid="button-run-smart-fill"
            >
              {autoSchedule.isPending ? (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              ) : smartFillMode === "auto" ? (
                <Zap className="mr-2 h-3 w-3" />
              ) : (
                <Sparkles className="mr-2 h-3 w-3" />
              )}
              {autoSchedule.isPending ? "Generating..." : smartFillMode === "auto" ? "Auto Schedule" : "Generate Suggestions"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
