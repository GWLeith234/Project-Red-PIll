import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PageHeader from "@/components/admin/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Search, Calendar, Clock, Loader2, Filter, X,
  AlertCircle, CheckCircle2, ListTodo, ChevronLeft,
  ChevronRight, CalendarDays, ClipboardList, Target,
} from "lucide-react";
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth,
  isSameDay, isToday, isBefore, startOfDay, addDays,
} from "date-fns";
import type { Task } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  uploaded: { label: "Uploaded", className: "bg-muted/50 text-muted-foreground border-border" },
  transcribed: { label: "Transcribed", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  ai_processed: { label: "AI Processed", className: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  in_review: { label: "In Review", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  published: { label: "Published", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const PRIORITY_CONFIG: Record<string, { label: string; className: string; calColor: string }> = {
  low: { label: "Low", className: "bg-muted/50 text-muted-foreground border-border", calColor: "bg-muted-foreground" },
  medium: { label: "Medium", className: "bg-blue-500/10 text-blue-400 border-blue-500/20", calColor: "bg-blue-500" },
  high: { label: "High", className: "bg-orange-500/10 text-orange-400 border-orange-500/20", calColor: "bg-orange-500" },
  urgent: { label: "Urgent", className: "bg-red-500/10 text-red-400 border-red-500/20", calColor: "bg-red-500" },
};

function isOverdue(date: string | Date | null | undefined, status?: string) {
  if (!date || status === "published") return false;
  return isBefore(new Date(date), startOfDay(new Date()));
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  return format(new Date(date), "MMM d, yyyy");
}

type SortKey = "dueDate" | "priority" | "status";
type SortDir = "asc" | "desc";

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER: Record<string, number> = { uploaded: 0, transcribed: 1, ai_processed: 2, in_review: 3, published: 4 };

function StatsHeader({ tasks }: { tasks: Task[] }) {
  const now = new Date();
  const weekEnd = addDays(startOfDay(now), 7);

  const total = tasks.length;
  const overdue = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const dueThisWeek = tasks.filter(t => {
    if (!t.dueDate || t.status === "published") return false;
    const d = new Date(t.dueDate);
    return d >= startOfDay(now) && d <= weekEnd;
  }).length;
  const completedThisMonth = tasks.filter(t => {
    if (t.status !== "published") return false;
    const d = t.updatedAt ? new Date(t.updatedAt) : null;
    return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const stats = [
    { label: "Total Tasks", value: total, icon: ListTodo, color: "border-primary/30 bg-primary/5 text-primary" },
    { label: "Overdue", value: overdue, icon: AlertCircle, color: "border-red-500/30 bg-red-500/5 text-red-400" },
    { label: "Due This Week", value: dueThisWeek, icon: Clock, color: "border-amber-500/30 bg-amber-500/5 text-amber-400" },
    { label: "Completed This Month", value: completedThisMonth, icon: CheckCircle2, color: "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6" data-testid="stats-header">
      {stats.map(s => (
        <Card key={s.label} className="glass-panel border-border/50 hover:border-primary/20 transition-colors" data-testid={`stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className={cn("h-9 w-9 flex items-center justify-center border", s.color)}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold text-foreground" data-testid={`text-stat-value-${s.label.toLowerCase().replace(/\s+/g, "-")}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mt-1">{s.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TaskDetailPanel({ task, onClose }: { task: Task; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editForm, setEditForm] = useState({
    title: task.title,
    description: task.description || "",
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/tasks/${task.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task Updated" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      title: editForm.title,
      description: editForm.description || null,
      priority: editForm.priority,
      status: editForm.status,
      dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
    });
  };

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur" data-testid="task-detail-panel">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-primary">Edit Task</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} data-testid="button-close-detail">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Title</Label>
          <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} data-testid="input-edit-title" />
        </div>
        <div>
          <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Description</Label>
          <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} className="min-h-[60px]" data-testid="input-edit-description" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Status</Label>
            <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
              <SelectTrigger data-testid="select-edit-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Priority</Label>
            <Select value={editForm.priority} onValueChange={v => setEditForm(f => ({ ...f, priority: v }))}>
              <SelectTrigger data-testid="select-edit-priority"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Due Date</Label>
            <DatePicker value={editForm.dueDate} onChange={v => setEditForm(f => ({ ...f, dueDate: v }))} placeholder="Pick due date" data-testid="input-edit-due-date" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} data-testid="button-cancel-edit">Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-save-edit">
            {updateMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ListView({ tasks }: { tasks: Task[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("dueDate");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = [...tasks];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }
    if (statusFilter !== "all") result = result.filter(t => t.status === statusFilter);
    if (priorityFilter !== "all") result = result.filter(t => t.priority === priorityFilter);

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "dueDate") {
        const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        cmp = da - db;
      } else if (sortKey === "priority") {
        cmp = (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      } else if (sortKey === "status") {
        cmp = (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [tasks, search, statusFilter, priorityFilter, sortKey, sortDir]);

  const SortButton = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      className={cn("text-left text-xs font-mono uppercase tracking-wider flex items-center gap-1 hover:text-foreground transition-colors",
        sortKey === field ? "text-primary" : "text-muted-foreground")}
      onClick={() => toggleSort(field)}
      data-testid={`sort-${field}`}
    >
      {label}
      {sortKey === field && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap" data-testid="filter-bar">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
            data-testid="input-search-tasks"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter-status">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[160px]" data-testid="select-filter-priority">
            <Target className="h-3 w-3 mr-1" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border border-border/30 bg-card/50 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_100px_120px_140px] gap-4 px-4 py-2.5 border-b border-border/30 bg-muted/10">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Title</span>
          <SortButton label="Status" field="status" />
          <SortButton label="Priority" field="priority" />
          <SortButton label="Due Date" field="dueDate" />
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Content</span>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/40" data-testid="empty-list">
            <ClipboardList className="h-8 w-8 mb-3" />
            <p className="text-sm font-mono">No tasks found</p>
          </div>
        )}

        {filtered.map(task => {
          const overdue = isOverdue(task.dueDate, task.status);
          const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.uploaded;
          const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

          return (
            <div key={task.id}>
              <div
                className={cn(
                  "grid grid-cols-[1fr_120px_100px_120px_140px] gap-4 px-4 py-3 border-b border-border/20 cursor-pointer hover:bg-muted/10 transition-colors items-center",
                  overdue && "border-l-2 border-l-red-500 bg-red-500/5",
                  selectedTask?.id === task.id && "bg-primary/5 border-l-2 border-l-primary"
                )}
                onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}
                data-testid={`row-task-${task.id}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" data-testid={`text-task-title-${task.id}`}>{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
                </div>
                <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-mono w-fit", statusCfg.className)} data-testid={`badge-status-${task.id}`}>
                  {statusCfg.label}
                </Badge>
                <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-mono w-fit", priorityCfg.className)} data-testid={`badge-priority-${task.id}`}>
                  {priorityCfg.label}
                </Badge>
                <span className={cn("text-xs font-mono", overdue ? "text-red-400" : "text-muted-foreground")} data-testid={`text-due-date-${task.id}`}>
                  {formatDate(task.dueDate)}
                </span>
                <span className="text-xs text-muted-foreground truncate" data-testid={`text-content-link-${task.id}`}>
                  {task.episodeId ? "Episode linked" : task.contentPieceId ? "Content linked" : "—"}
                </span>
              </div>
              {selectedTask?.id === task.id && (
                <div className="px-4 py-3 border-b border-border/20 bg-muted/5">
                  <TaskDetailPanel task={task} onClose={() => setSelectedTask(null)} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground font-mono">{filtered.length} task{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
}

function CalendarView({ currentUserId }: { currentUserId?: string }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const fromStr = format(calStart, "yyyy-MM-dd");
  const toStr = format(calEnd, "yyyy-MM-dd");

  const { data: calendarTasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/calendar", fromStr, toStr],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/calendar?from=${fromStr}&to=${toStr}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch calendar tasks");
      return res.json();
    },
  });

  const myTasks = useMemo(() => {
    if (!currentUserId) return calendarTasks;
    return calendarTasks.filter(t => t.assigneeId === currentUserId);
  }, [calendarTasks, currentUserId]);

  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    myTasks.forEach(task => {
      if (!task.dueDate) return;
      const key = format(new Date(task.dueDate), "yyyy-MM-dd");
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [myTasks]);

  const selectedDayTasks = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return tasksByDay[key] || [];
  }, [selectedDay, tasksByDay]);

  return (
    <div className="flex gap-6" data-testid="calendar-view">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg" data-testid="text-calendar-month">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => subMonths(m, 1))} data-testid="button-prev-month">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-xs font-mono" onClick={() => setCurrentMonth(new Date())} data-testid="button-today">
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(m => addMonths(m, 1))} data-testid="button-next-month">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="border border-border/30 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7">
              {dayHeaders.map(d => (
                <div key={d} className="text-center text-[10px] font-mono uppercase tracking-wider text-muted-foreground py-2 border-b border-border/30 bg-muted/10">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map(day => {
                const key = format(day, "yyyy-MM-dd");
                const dayTasks = tasksByDay[key] || [];
                const inMonth = isSameMonth(day, currentMonth);
                const today = isToday(day);
                const selected = selectedDay && isSameDay(day, selectedDay);

                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-[80px] border-b border-r border-border/20 p-1 cursor-pointer hover:bg-muted/10 transition-colors",
                      !inMonth && "opacity-30",
                      today && "bg-primary/5",
                      selected && "ring-1 ring-primary ring-inset bg-primary/10"
                    )}
                    onClick={() => setSelectedDay(day)}
                    data-testid={`calendar-day-${key}`}
                  >
                    <span className={cn(
                      "text-xs font-mono block text-right mb-1",
                      today ? "text-primary font-bold" : "text-muted-foreground"
                    )}>
                      {format(day, "d")}
                    </span>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map(task => {
                        const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                        return (
                          <div
                            key={task.id}
                            className={cn("text-[9px] px-1 py-0.5 rounded truncate text-white/90", pCfg.calColor)}
                            title={task.title}
                            data-testid={`calendar-task-${task.id}`}
                          >
                            {task.title}
                          </div>
                        );
                      })}
                      {dayTasks.length > 3 && (
                        <span className="text-[9px] text-muted-foreground font-mono pl-1">+{dayTasks.length - 3} more</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedDay && (
        <div className="w-72 shrink-0" data-testid="day-side-panel">
          <Card className="border-border/40 bg-card/60 sticky top-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-bold text-sm">{format(selectedDay, "EEEE, MMM d")}</h4>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDay(null)} data-testid="button-close-day-panel">
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {selectedDayTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground font-mono py-4 text-center">No tasks due this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayTasks.map(task => {
                    const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.uploaded;
                    const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                    return (
                      <div key={task.id} className="border border-border/30 rounded p-2.5 space-y-1.5" data-testid={`day-task-${task.id}`}>
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={cn("text-[9px] h-4 px-1 font-mono", statusCfg.className)}>{statusCfg.label}</Badge>
                          <Badge variant="outline" className={cn("text-[9px] h-4 px-1 font-mono", priorityCfg.className)}>{priorityCfg.label}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function MyTasks() {
  const [activeTab, setActiveTab] = useState<"list" | "calendar">("list");

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/my"],
  });

  const { data: me } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="my-tasks-loading">
        <PageHeader pageKey="my-tasks" />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="my-tasks-page">
      <PageHeader pageKey="my-tasks" />

      <StatsHeader tasks={tasks} />

      <div className="flex gap-1 border-b border-border/30 mb-2">
        <button
          className={cn(
            "px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2",
            activeTab === "list" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("list")}
          data-testid="tab-list-view"
        >
          <ClipboardList className="h-3.5 w-3.5" />
          List View
        </button>
        <button
          className={cn(
            "px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-2",
            activeTab === "calendar" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
          )}
          onClick={() => setActiveTab("calendar")}
          data-testid="tab-calendar-view"
        >
          <Calendar className="h-3.5 w-3.5" />
          Calendar View
        </button>
      </div>

      {activeTab === "list" && <ListView tasks={tasks} />}
      {activeTab === "calendar" && <CalendarView currentUserId={me?.id} />}
    </div>
  );
}
