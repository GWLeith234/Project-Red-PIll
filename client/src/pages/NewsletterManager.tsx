import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Mail, Calendar, Clock, Sparkles, Send, Trash2, Play, Pause, Plus, Settings,
  Filter, Edit3, Eye, Loader2, CheckCircle2, FileText, MailOpen, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CADENCE_COLORS: Record<string, string> = {
  daily: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  weekly: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  monthly: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  sending: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  sent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
};

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern (ET)" },
  { value: "America/Chicago", label: "Central (CT)" },
  { value: "America/Denver", label: "Mountain (MT)" },
  { value: "America/Los_Angeles", label: "Pacific (PT)" },
  { value: "America/Anchorage", label: "Alaska (AKT)" },
  { value: "Pacific/Honolulu", label: "Hawaii (HST)" },
  { value: "UTC", label: "UTC" },
];

const CONTENT_TYPE_OPTIONS = [
  { value: "article", label: "Article" },
  { value: "blog", label: "Blog" },
  { value: "social_post", label: "Social Post" },
  { value: "newsletter", label: "Newsletter" },
  { value: "video_clip", label: "Video Clip" },
  { value: "seo_asset", label: "SEO Asset" },
];

function formatHour(h: number) {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

function formatTime(hour: number, minute: number, tz: string) {
  const tzLabel = TIMEZONES.find(t => t.value === tz)?.label || tz;
  return `${formatHour(hour)}:${String(minute).padStart(2, "0")} ${tzLabel}`;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

type ScheduleForm = {
  name: string;
  cadence: string;
  dayOfWeek: number;
  dayOfMonth: number;
  sendHour: number;
  sendMinute: number;
  timezone: string;
  contentTypes: string[];
  subjectTemplate: string;
  introTemplate: string;
  active: boolean;
  autoSend: boolean;
};

const defaultForm: ScheduleForm = {
  name: "",
  cadence: "weekly",
  dayOfWeek: 1,
  dayOfMonth: 1,
  sendHour: 9,
  sendMinute: 0,
  timezone: "America/New_York",
  contentTypes: ["article", "blog"],
  subjectTemplate: "",
  introTemplate: "",
  active: true,
  autoSend: false,
};

export default function NewsletterManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("schedules");

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery<any[]>({
    queryKey: ["/api/newsletter-schedules"],
  });

  const { data: runs = [], isLoading: runsLoading } = useQuery<any[]>({
    queryKey: ["/api/newsletter-runs"],
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>({ ...defaultForm });

  const [cadenceFilter, setCadenceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<{ type: "send" | "delete"; id: string; title: string } | null>(null);

  const createSchedule = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/newsletter-schedules", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-schedules"] });
      toast({ title: "Schedule Created", description: "Newsletter schedule has been created." });
      setDialogOpen(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateSchedule = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      await apiRequest("PATCH", `/api/newsletter-schedules/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-schedules"] });
      toast({ title: "Schedule Updated" });
      setDialogOpen(false);
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSchedule = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/newsletter-schedules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-schedules"] });
      toast({ title: "Schedule Deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const runNow = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/newsletter-schedules/${id}/run-now`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-runs"] });
      toast({ title: "Newsletter Generation Started", description: "A new newsletter run has been triggered." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendRun = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/newsletter-runs/${id}/send`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-runs"] });
      toast({ title: "Newsletter Sent", description: "The newsletter has been sent to subscribers." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteRun = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/newsletter-runs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-runs"] });
      toast({ title: "Run Deleted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await apiRequest("PATCH", `/api/newsletter-schedules/${id}`, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/newsletter-schedules"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const stats = useMemo(() => {
    const activeSchedules = (schedules || []).filter((s: any) => s.active).length;
    const totalRuns = (runs || []).length;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const sentThisMonth = (runs || []).filter((r: any) => r.status === "sent" && r.sentAt && new Date(r.sentAt) >= monthStart).length;
    const draftsPending = (runs || []).filter((r: any) => r.status === "draft").length;
    return { activeSchedules, totalRuns, sentThisMonth, draftsPending };
  }, [schedules, runs]);

  const filteredRuns = useMemo(() => {
    return (runs || []).filter((r: any) => {
      if (cadenceFilter !== "all" && r.cadence !== cadenceFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [runs, cadenceFilter, statusFilter]);

  function openCreateDialog() {
    setForm({ ...defaultForm });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEditDialog(schedule: any) {
    setForm({
      name: schedule.name || "",
      cadence: schedule.cadence || "weekly",
      dayOfWeek: schedule.dayOfWeek ?? 1,
      dayOfMonth: schedule.dayOfMonth ?? 1,
      sendHour: schedule.sendHour ?? 9,
      sendMinute: schedule.sendMinute ?? 0,
      timezone: schedule.timezone || "America/New_York",
      contentTypes: schedule.contentTypes || ["article", "blog"],
      subjectTemplate: schedule.subjectTemplate || "",
      introTemplate: schedule.introTemplate || "",
      active: schedule.active ?? true,
      autoSend: schedule.autoSend ?? false,
    });
    setEditingId(schedule.id);
    setDialogOpen(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) {
      toast({ title: "Name Required", variant: "destructive" });
      return;
    }
    const payload: any = { ...form };
    if (payload.cadence !== "weekly") delete payload.dayOfWeek;
    if (payload.cadence !== "monthly") delete payload.dayOfMonth;
    if (!payload.subjectTemplate) delete payload.subjectTemplate;
    if (!payload.introTemplate) delete payload.introTemplate;

    if (editingId) {
      updateSchedule.mutate({ id: editingId, ...payload });
    } else {
      createSchedule.mutate(payload);
    }
  }

  function handleConfirm() {
    if (!confirmDialog) return;
    if (confirmDialog.type === "send") sendRun.mutate(confirmDialog.id);
    if (confirmDialog.type === "delete") deleteRun.mutate(confirmDialog.id);
    setConfirmDialog(null);
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700">
      <div className="flex items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground" data-testid="text-newsletters-title">
            Newsletter Manager
          </h1>
          <p className="text-muted-foreground mt-1 font-mono text-sm">Automated Newsletter Schedules & History</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider gap-2"
          data-testid="button-create-schedule"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Schedule
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Schedules", value: stats.activeSchedules, icon: Sparkles, color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/20" },
          { label: "Total Runs", value: stats.totalRuns, icon: FileText, color: "text-chart-4", bgColor: "bg-chart-4/10", borderColor: "border-chart-4/20" },
          { label: "Sent This Month", value: stats.sentThisMonth, icon: Send, color: "text-accent", bgColor: "bg-accent/10", borderColor: "border-accent/20" },
          { label: "Drafts Pending", value: stats.draftsPending, icon: Clock, color: "text-chart-1", bgColor: "bg-chart-1/10", borderColor: "border-chart-1/20" },
        ].map((stat) => (
          <Card key={stat.label} className={cn("glass-panel border", stat.borderColor)} data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", stat.bgColor)}>
                  <stat.icon className={cn("h-4 w-4", stat.color)} />
                </div>
                <span className={cn("text-2xl font-bold font-display", stat.color)}>{stat.value}</span>
              </div>
              <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-card/50 border border-border/50 p-1 h-auto" data-testid="tabs-newsletter">
          <TabsTrigger value="schedules" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-schedules">
            <Settings className="mr-1.5 h-3 w-3" /> Schedules
          </TabsTrigger>
          <TabsTrigger value="history" className="font-mono text-xs uppercase tracking-wider data-[state=active]:bg-primary/20 data-[state=active]:text-primary" data-testid="tab-history">
            <Mail className="mr-1.5 h-3 w-3" /> Newsletter History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="mt-4">
          {schedulesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-lg bg-card/30 border border-border/30 animate-pulse" />
              ))}
            </div>
          ) : (schedules || []).length === 0 ? (
            <Card className="glass-panel border-border/50 border-dashed">
              <CardContent className="py-14 text-center">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                <h3 className="text-sm font-display font-semibold text-muted-foreground mb-1">No Schedules Yet</h3>
                <p className="text-xs text-muted-foreground/70 mb-4">Create your first automated newsletter schedule.</p>
                <Button onClick={openCreateDialog} variant="outline" size="sm" className="font-mono text-xs" data-testid="button-create-first-schedule">
                  <Plus className="mr-1.5 h-3 w-3" /> Create Schedule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(schedules || []).map((s: any) => (
                <Card key={s.id} className="glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 group" data-testid={`schedule-card-${s.id}`}>
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className={cn("w-1 rounded-l-lg shrink-0", s.active ? "bg-primary" : "bg-muted-foreground/30")} />
                      <div className="flex-1 p-4">
                        <div className="flex items-start gap-4">
                          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0 border", s.active ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/30 text-muted-foreground border-border/50")}>
                            <Mail className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="text-sm font-semibold font-display truncate" data-testid={`text-schedule-name-${s.id}`}>{s.name}</h3>
                              <Badge variant="outline" className={cn("text-[10px] font-mono shrink-0", CADENCE_COLORS[s.cadence] || "")} data-testid={`badge-cadence-${s.id}`}>
                                {s.cadence}
                              </Badge>
                              {!s.active && (
                                <Badge variant="outline" className="text-[10px] font-mono bg-muted/30 text-muted-foreground border-border/50">
                                  Inactive
                                </Badge>
                              )}
                              {s.autoSend && (
                                <Badge variant="outline" className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border-amber-500/30 gap-1" data-testid={`badge-autosend-${s.id}`}>
                                  <Send className="h-2.5 w-2.5" /> Auto-Send
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground flex-wrap mt-1">
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3" />
                                {formatTime(s.sendHour, s.sendMinute, s.timezone)}
                                {s.cadence === "weekly" && ` · ${DAYS_OF_WEEK[s.dayOfWeek] || ""}`}
                                {s.cadence === "monthly" && ` · Day ${s.dayOfMonth}`}
                              </span>
                              {s.nextRunAt && (
                                <span className="flex items-center gap-1.5">
                                  <Calendar className="h-3 w-3" /> Next: {formatDate(s.nextRunAt)}
                                </span>
                              )}
                              {s.lastRunAt && (
                                <span className="flex items-center gap-1.5 text-muted-foreground/60">
                                  Last: {formatDate(s.lastRunAt)}
                                </span>
                              )}
                            </div>
                            {s.contentTypes && s.contentTypes.length > 0 && (
                              <div className="flex gap-1 mt-2 flex-wrap">
                                {s.contentTypes.map((ct: string) => (
                                  <span key={ct} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-card border border-border/50 text-muted-foreground">
                                    {ct.replace("_", " ")}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Switch
                              checked={s.active}
                              onCheckedChange={(checked) => toggleActive.mutate({ id: s.id, active: checked })}
                              data-testid={`switch-active-${s.id}`}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-[10px] font-mono uppercase tracking-wider gap-1"
                              onClick={() => openEditDialog(s)}
                              data-testid={`button-edit-schedule-${s.id}`}
                            >
                              <Edit3 className="h-3 w-3" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-[10px] font-mono uppercase tracking-wider gap-1 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => runNow.mutate(s.id)}
                              disabled={runNow.isPending}
                              data-testid={`button-run-now-${s.id}`}
                            >
                              {runNow.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />} Run Now
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteSchedule.mutate(s.id)}
                              data-testid={`button-delete-schedule-${s.id}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Filters:</span>
            </div>
            <Select value={cadenceFilter} onValueChange={setCadenceFilter}>
              <SelectTrigger className="w-32 h-8 text-xs bg-card/50 border-border/50" data-testid="select-cadence-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cadences</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-8 text-xs bg-card/50 border-border/50" data-testid="select-status-filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {runsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 rounded-lg bg-card/30 border border-border/30 animate-pulse" />
              ))}
            </div>
          ) : filteredRuns.length === 0 ? (
            <Card className="glass-panel border-border/50 border-dashed">
              <CardContent className="py-14 text-center">
                <MailOpen className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                <h3 className="text-sm font-display font-semibold text-muted-foreground mb-1">No Newsletter Runs</h3>
                <p className="text-xs text-muted-foreground/70">Newsletter runs will appear here once schedules generate them.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <div className="hidden md:grid grid-cols-[1fr_100px_140px_100px_140px_100px] gap-3 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground/70">
                <span>Title</span>
                <span>Cadence</span>
                <span>Period</span>
                <span>Status</span>
                <span>Created</span>
                <span>Actions</span>
              </div>
              {filteredRuns.map((r: any) => (
                <div key={r.id} data-testid={`run-row-${r.id}`}>
                  <Card
                    className={cn(
                      "glass-panel border-border/50 hover:border-primary/30 transition-all duration-300 cursor-pointer",
                      expandedRunId === r.id && "border-primary/40"
                    )}
                    onClick={() => setExpandedRunId(expandedRunId === r.id ? null : r.id)}
                  >
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_140px_100px_140px_100px] gap-3 items-center px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Eye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-sm font-semibold font-display truncate" data-testid={`text-run-title-${r.id}`}>{r.title}</span>
                        </div>
                        <div>
                          <Badge variant="outline" className={cn("text-[10px] font-mono", CADENCE_COLORS[r.cadence] || "")} data-testid={`badge-run-cadence-${r.id}`}>
                            {r.cadence}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">{r.period || "—"}</span>
                        <div>
                          <Badge variant="outline" className={cn("text-[10px] font-mono gap-1", STATUS_COLORS[r.status] || "")} data-testid={`badge-run-status-${r.id}`}>
                            {r.status === "sent" && <CheckCircle2 className="h-2.5 w-2.5" />}
                            {r.status === "sending" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
                            {r.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {r.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] font-mono uppercase tracking-wider gap-1 border-accent/30 text-accent hover:bg-accent/10"
                              onClick={() => setConfirmDialog({ type: "send", id: r.id, title: r.title })}
                              data-testid={`button-send-run-${r.id}`}
                            >
                              <Send className="h-2.5 w-2.5" /> Send
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setConfirmDialog({ type: "delete", id: r.id, title: r.title })}
                            data-testid={`button-delete-run-${r.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {expandedRunId === r.id && r.body && (
                    <Card className="glass-panel border-primary/20 border-t-0 rounded-t-none mt-0" data-testid={`run-preview-${r.id}`}>
                      <CardContent className="p-5">
                        <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: r.body.replace(/\n/g, "<br />") }} />
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingId ? "Edit Schedule" : "Create Newsletter Schedule"}</DialogTitle>
            <DialogDescription>Configure your automated newsletter generation settings.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider">Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Daily News Digest"
                className="mt-1"
                data-testid="input-schedule-name"
              />
            </div>

            <div>
              <Label className="text-xs font-mono uppercase tracking-wider">Cadence</Label>
              <Select value={form.cadence} onValueChange={(v) => setForm({ ...form, cadence: v })}>
                <SelectTrigger className="mt-1" data-testid="select-cadence">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.cadence === "weekly" && (
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider">Day of Week</Label>
                <Select value={String(form.dayOfWeek)} onValueChange={(v) => setForm({ ...form, dayOfWeek: parseInt(v) })}>
                  <SelectTrigger className="mt-1" data-testid="select-day-of-week">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {form.cadence === "monthly" && (
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider">Day of Month</Label>
                <Select value={String(form.dayOfMonth)} onValueChange={(v) => setForm({ ...form, dayOfMonth: parseInt(v) })}>
                  <SelectTrigger className="mt-1" data-testid="select-day-of-month">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider">Send Hour</Label>
                <Select value={String(form.sendHour)} onValueChange={(v) => setForm({ ...form, sendHour: parseInt(v) })}>
                  <SelectTrigger className="mt-1" data-testid="select-send-hour">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{formatHour(i)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider">Send Minute</Label>
                <Select value={String(form.sendMinute)} onValueChange={(v) => setForm({ ...form, sendMinute: parseInt(v) })}>
                  <SelectTrigger className="mt-1" data-testid="select-send-minute">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 15, 30, 45].map((m) => (
                      <SelectItem key={m} value={String(m)}>{String(m).padStart(2, "0")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-mono uppercase tracking-wider">Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v })}>
                <SelectTrigger className="mt-1" data-testid="select-timezone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs font-mono uppercase tracking-wider mb-2 block">Content Types</Label>
              <div className="grid grid-cols-2 gap-2">
                {CONTENT_TYPE_OPTIONS.map((ct) => (
                  <div key={ct.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`ct-${ct.value}`}
                      checked={form.contentTypes.includes(ct.value)}
                      onCheckedChange={(checked) => {
                        setForm({
                          ...form,
                          contentTypes: checked
                            ? [...form.contentTypes, ct.value]
                            : form.contentTypes.filter(t => t !== ct.value),
                        });
                      }}
                      data-testid={`checkbox-content-type-${ct.value}`}
                    />
                    <label htmlFor={`ct-${ct.value}`} className="text-xs cursor-pointer">{ct.label}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs font-mono uppercase tracking-wider">Subject Template <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={form.subjectTemplate}
                onChange={(e) => setForm({ ...form, subjectTemplate: e.target.value })}
                placeholder="e.g., Your {{cadence}} digest for {{period}}"
                className="mt-1"
                data-testid="input-subject-template"
              />
            </div>

            <div>
              <Label className="text-xs font-mono uppercase tracking-wider">Intro Template <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                value={form.introTemplate}
                onChange={(e) => setForm({ ...form, introTemplate: e.target.value })}
                placeholder="Custom intro text for the newsletter..."
                className="mt-1 min-h-[60px]"
                data-testid="input-intro-template"
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-[11px] text-muted-foreground">Enable automatic newsletter generation</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                data-testid="switch-form-active"
              />
            </div>

            <div className="flex items-center justify-between border rounded-lg p-3 border-amber-500/20">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  Auto-Send
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                </p>
                <p className="text-[11px] text-muted-foreground">Automatically send to subscribers when generated</p>
              </div>
              <Switch
                checked={form.autoSend}
                onCheckedChange={(checked) => setForm({ ...form, autoSend: checked })}
                data-testid="switch-form-autosend"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} data-testid="button-cancel-schedule">Cancel</Button>
            <Button
              onClick={handleSubmit}
              disabled={createSchedule.isPending || updateSchedule.isPending}
              data-testid="button-save-schedule"
            >
              {(createSchedule.isPending || updateSchedule.isPending) && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {editingId ? "Update" : "Create"} Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {confirmDialog?.type === "send" ? "Send Newsletter?" : "Delete Newsletter Run?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.type === "send"
                ? `This will send "${confirmDialog?.title}" to all subscribers. This action cannot be undone.`
                : `This will permanently delete "${confirmDialog?.title}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={confirmDialog?.type === "delete" ? "bg-destructive hover:bg-destructive/90" : ""}
              data-testid="button-confirm-action"
            >
              {confirmDialog?.type === "send" ? "Send" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
