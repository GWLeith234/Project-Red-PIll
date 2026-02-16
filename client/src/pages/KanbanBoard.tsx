import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Plus, Search, Calendar, Tag, User, MessageSquare,
  Clock, Loader2, Trash2, Send, GripVertical,
  Filter, X, Activity, AlertCircle,
} from "lucide-react";
import type { Task, TaskComment, TaskActivityLog } from "@shared/schema";

const COLUMNS = [
  { id: "uploaded", label: "Uploaded", description: "Raw media files waiting for transcription", color: "border-border", headerColor: "text-muted-foreground", bg: "bg-muted/20" },
  { id: "transcribed", label: "Transcribed", description: "Transcript complete, ready for AI", color: "border-blue-500/30", headerColor: "text-blue-400", bg: "bg-blue-500/5" },
  { id: "ai_processed", label: "AI Processed", description: "AI content ready for review", color: "border-purple-500/30", headerColor: "text-purple-400", bg: "bg-purple-500/5" },
  { id: "in_review", label: "In Review", description: "Team reviewing and editing", color: "border-amber-500/30", headerColor: "text-amber-400", bg: "bg-amber-500/5" },
  { id: "published", label: "Published", description: "Approved and live", color: "border-emerald-500/30", headerColor: "text-emerald-400", bg: "bg-emerald-500/5" },
] as const;

const PRIORITY_CONFIG: Record<string, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-muted/50 text-muted-foreground border-border" },
  medium: { label: "Medium", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  high: { label: "High", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  urgent: { label: "Urgent", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function isOverdue(date: string | Date | null | undefined) {
  if (!date) return false;
  return new Date(date) < new Date();
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DraggableTaskCard({ task, users, onClick, onDragStart }: { task: Task; users: any[]; onClick: () => void; onDragStart: (e: React.DragEvent, taskId: string) => void }) {
  const assignee = users?.find((u: any) => u.id === task.assigneeId);
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const overdue = isOverdue(task.dueDate);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart(e, task.id);
      }}
      className="group"
      data-testid={`card-task-${task.id}`}
    >
      <Card
        className="border-border/40 bg-card/60 hover:border-border/70 hover:bg-card/80 transition-all cursor-pointer shadow-sm"
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div
              className="mt-1 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none shrink-0"
              data-testid={`drag-handle-${task.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate" data-testid={`text-task-title-${task.id}`}>
                {task.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 font-mono", priority.className)} data-testid={`badge-priority-${task.id}`}>
              {priority.label}
            </Badge>

            {task.dueDate && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] h-5 px-1.5 font-mono gap-1",
                  overdue ? "bg-red-500/10 text-red-400 border-red-500/20" : "text-muted-foreground border-border/50"
                )}
                data-testid={`badge-due-${task.id}`}
              >
                <Calendar className="h-2.5 w-2.5" />
                {formatDate(task.dueDate)}
              </Badge>
            )}

            {task.tags && task.tags.length > 0 && task.tags.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-[10px] h-5 px-1.5 font-mono text-muted-foreground border-border/30">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
              {task.episodeId && (
                <span className="flex items-center gap-0.5 truncate max-w-[120px]">
                  <Tag className="h-2.5 w-2.5 shrink-0" />
                  Episode linked
                </span>
              )}
            </div>
            {assignee && (
              <Avatar className="h-6 w-6" data-testid={`avatar-assignee-${task.id}`}>
                {assignee.profilePhoto && <AvatarImage src={assignee.profilePhoto} alt={assignee.displayName || assignee.username} />}
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                  {getInitials(assignee.displayName || assignee.username)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function KanbanColumn({
  column,
  tasks,
  users,
  onAddTask,
  onTaskClick,
  onDragStart,
  onDrop,
  isDropTarget,
}: {
  column: typeof COLUMNS[number];
  tasks: Task[];
  users: any[];
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDrop: (e: React.DragEvent, columnId: string) => void;
  isDropTarget: boolean;
}) {
  return (
    <div className="flex flex-col min-w-[280px] w-[280px] shrink-0" data-testid={`column-${column.id}`}>
      <div className={cn("rounded-t-lg border-t-2 px-3 py-2.5", column.color, column.bg)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className={cn("font-display text-sm font-bold", column.headerColor)}>{column.label}</h3>
            <Badge variant="outline" className="text-[10px] h-5 font-mono border-border/30 text-muted-foreground">
              {tasks.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onAddTask}
            data-testid={`button-add-task-${column.id}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{column.description}</p>
      </div>
      <div
        className={cn(
          "flex-1 rounded-b-lg border border-t-0 border-border/20 bg-muted/10 p-2 space-y-2 min-h-[200px] overflow-y-auto max-h-[calc(100vh-280px)] transition-colors",
          isDropTarget && "bg-primary/5 border-primary/30"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }}
        onDrop={(e) => onDrop(e, column.id)}
      >
        {tasks.map(task => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            users={users || []}
            onClick={() => onTaskClick(task)}
            onDragStart={onDragStart}
          />
        ))}
        {tasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
            <AlertCircle className="h-6 w-6 mb-2" />
            <p className="text-xs font-mono">No tasks</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateTaskDialog({
  open,
  onClose,
  columnStatus,
  users,
}: {
  open: boolean;
  onClose: () => void;
  columnStatus: string;
  users: any[];
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigneeId: "",
    dueDate: "",
    tags: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task Created", description: "New task has been added to the board." });
      onClose();
      setForm({ title: "", description: "", priority: "medium", assigneeId: "", dueDate: "", tags: "" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ title: "Required", description: "Task title is required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: columnStatus,
      priority: form.priority,
      assigneeId: form.assigneeId || null,
      dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      tags: form.tags ? form.tags.split(",").map(t => t.trim()).filter(Boolean) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-create-task">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Task
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Title *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Task title..."
              data-testid="input-task-title"
            />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Task description..."
              className="min-h-[80px]"
              data-testid="input-task-description"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger data-testid="select-task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Assignee</Label>
              <Select value={form.assigneeId || "__none__"} onValueChange={v => setForm(f => ({ ...f, assigneeId: v === "__none__" ? "" : v }))}>
                <SelectTrigger data-testid="select-task-assignee">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {(users || []).map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.displayName || u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Due Date</Label>
            <DatePicker
              value={form.dueDate}
              onChange={v => setForm(f => ({ ...f, dueDate: v }))}
              placeholder="Pick due date"
              data-testid="input-task-due-date"
            />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Tags (comma separated)</Label>
            <Input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="video, urgent, episode-42"
              data-testid="input-task-tags"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-task">Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-submit-task">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TaskDetailDialog({
  task,
  open,
  onClose,
  users,
}: {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  users: any[];
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editForm, setEditForm] = useState<any>({});
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "comments" | "activity">("details");

  const taskId = task?.id;

  const { data: comments } = useQuery<TaskComment[]>({
    queryKey: ["/api/tasks", taskId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/comments`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch comments");
      return res.json();
    },
    enabled: !!taskId && open && activeTab === "comments",
  });

  const { data: activityLogs } = useQuery<TaskActivityLog[]>({
    queryKey: ["/api/tasks", taskId, "activity"],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/activity`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    enabled: !!taskId && open && activeTab === "activity",
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/tasks/${taskId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task Updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({ title: "Task Deleted" });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/tasks/${taskId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", taskId, "comments"] });
      setCommentText("");
      toast({ title: "Comment Added" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (task && open) {
      setEditForm({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        status: task.status,
        assigneeId: task.assigneeId || "",
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
        tags: (task.tags || []).join(", "),
      });
      setActiveTab("details");
    }
  }, [task, open]);

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto" data-testid="dialog-task-detail">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-lg">
            Task Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border/30 mb-4">
          {(["details", "comments", "activity"] as const).map(tab => (
            <button
              key={tab}
              className={cn(
                "px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors",
                activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveTab(tab)}
              data-testid={`tab-${tab}`}
            >
              {tab === "details" && "Details"}
              {tab === "comments" && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" /> Comments
                </span>
              )}
              {tab === "activity" && (
                <span className="flex items-center gap-1">
                  <Activity className="h-3 w-3" /> Activity
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "details" && (
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input
                value={editForm.title || ""}
                onChange={e => setEditForm((f: any) => ({ ...f, title: e.target.value }))}
                data-testid="input-edit-task-title"
              />
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea
                value={editForm.description || ""}
                onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                className="min-h-[80px]"
                data-testid="input-edit-task-description"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={editForm.status || ""} onValueChange={v => setEditForm((f: any) => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-edit-task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map(col => (
                      <SelectItem key={col.id} value={col.id}>{col.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Priority</Label>
                <Select value={editForm.priority || ""} onValueChange={v => setEditForm((f: any) => ({ ...f, priority: v }))}>
                  <SelectTrigger data-testid="select-edit-task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Assignee</Label>
                <Select value={editForm.assigneeId || "__none__"} onValueChange={v => setEditForm((f: any) => ({ ...f, assigneeId: v === "__none__" ? "" : v }))}>
                  <SelectTrigger data-testid="select-edit-task-assignee">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Unassigned</SelectItem>
                    {(users || []).map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>{u.displayName || u.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Due Date</Label>
                <DatePicker
                  value={editForm.dueDate || ""}
                  onChange={v => setEditForm((f: any) => ({ ...f, dueDate: v }))}
                  placeholder="Pick due date"
                  data-testid="input-edit-task-due-date"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Tags (comma separated)</Label>
              <Input
                value={editForm.tags || ""}
                onChange={e => setEditForm((f: any) => ({ ...f, tags: e.target.value }))}
                data-testid="input-edit-task-tags"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                onClick={() => {
                  updateMutation.mutate({
                    title: editForm.title,
                    description: editForm.description || null,
                    status: editForm.status,
                    priority: editForm.priority,
                    assigneeId: editForm.assigneeId || null,
                    dueDate: editForm.dueDate ? new Date(editForm.dueDate).toISOString() : null,
                    tags: editForm.tags ? editForm.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : null,
                  });
                }}
                disabled={updateMutation.isPending}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-save-task"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-task"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-4">
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {(comments || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 font-mono">No comments yet</p>
              )}
              {(comments || []).map((comment: TaskComment) => (
                <div key={comment.id} className="border border-border/30 rounded-lg p-3 space-y-1" data-testid={`comment-${comment.id}`}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                        {getInitials(comment.authorName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold">{comment.authorName}</span>
                    <span className="text-[10px] text-muted-foreground font-mono ml-auto">
                      {comment.createdAt ? formatDate(comment.createdAt) : ""}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 pl-7">{comment.content}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={e => { if (e.key === "Enter" && commentText.trim()) commentMutation.mutate(commentText.trim()); }}
                data-testid="input-comment"
              />
              <Button
                size="icon"
                onClick={() => { if (commentText.trim()) commentMutation.mutate(commentText.trim()); }}
                disabled={commentMutation.isPending || !commentText.trim()}
                data-testid="button-send-comment"
              >
                {commentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {(activityLogs || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 font-mono">No activity yet</p>
            )}
            {(activityLogs || []).map((log: TaskActivityLog) => (
              <div key={log.id} className="flex items-start gap-2 py-2 border-b border-border/20 last:border-0" data-testid={`activity-${log.id}`}>
                <div className="h-6 w-6 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs">
                    <span className="font-semibold">{log.actorName || "System"}</span>
                    {" "}{log.action}
                    {log.field && (
                      <span className="text-muted-foreground">
                        {" "}{log.field}
                        {log.fromValue && <> from <Badge variant="outline" className="text-[9px] h-4 px-1">{log.fromValue}</Badge></>}
                        {log.toValue && <> to <Badge variant="outline" className="text-[9px] h-4 px-1">{log.toValue}</Badge></>}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {log.createdAt ? formatDate(log.createdAt) : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function KanbanBoard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createColumnStatus, setCreateColumnStatus] = useState("uploaded");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (err: any) => {
      toast({ title: "Error moving task", description: err.message, variant: "destructive" });
    },
  });

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    setDragTaskId(taskId);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== columnId) {
        updateMutation.mutate({ id: taskId, data: { status: columnId } });
      }
    }
    setDragTaskId(null);
    setDropTargetColumn(null);
  }, [tasks, updateMutation]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }
    if (filterPriority) {
      result = result.filter(t => t.priority === filterPriority);
    }
    if (filterAssignee) {
      result = result.filter(t => t.assigneeId === filterAssignee);
    }
    return result;
  }, [tasks, searchQuery, filterPriority, filterAssignee]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    COLUMNS.forEach(col => { map[col.id] = []; });
    filteredTasks.forEach(task => {
      const col = map[task.status];
      if (col) col.push(task);
      else if (map["uploaded"]) map["uploaded"].push(task);
    });
    return map;
  }, [filteredTasks]);

  const hasFilters = searchQuery || filterPriority || filterAssignee;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-700" data-testid="kanban-board">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-6">
        <PageHeader pageKey="kanban" />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs border-border/50">
            {tasks.length} tasks
          </Badge>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap" data-testid="filter-bar">
        <div className="relative flex-1 min-w-[200px] sm:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9"
            data-testid="input-search-tasks"
          />
        </div>
        <Select value={filterPriority || "__all__"} onValueChange={v => setFilterPriority(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-filter-priority">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAssignee || "__all__"} onValueChange={v => setFilterAssignee(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-filter-assignee">
            <User className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Assignees</SelectItem>
            {(users || []).map((u: any) => (
              <SelectItem key={u.id} value={u.id}>{u.displayName || u.username}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSearchQuery(""); setFilterPriority(""); setFilterAssignee(""); }}
            className="text-xs font-mono"
            data-testid="button-clear-filters"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-mono">Loading tasks...</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 sm:mx-0 sm:px-0" data-testid="kanban-columns">
            {COLUMNS.map(column => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={tasksByColumn[column.id] || []}
                users={users}
                onAddTask={() => {
                  setCreateColumnStatus(column.id);
                  setCreateDialogOpen(true);
                }}
                onTaskClick={(task) => {
                  setSelectedTask(task);
                  setDetailOpen(true);
                }}
                onDragStart={handleDragStart}
                onDrop={handleDrop}
                isDropTarget={false}
              />
            ))}
          </div>
      )}

      <CreateTaskDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        columnStatus={createColumnStatus}
        users={users}
      />

      <TaskDetailDialog
        task={selectedTask}
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedTask(null); }}
        users={users}
      />
    </div>
  );
}
