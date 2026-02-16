import React, { useState, useMemo, useCallback } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useContentPieces, useContentMetrics, useUpdateContentPiece } from "@/lib/api";
import { StatusBadge, PriorityBadge, TypeBadge, CONTENT_TYPES, CONTENT_PRIORITIES } from "@/components/ContentStatusBar";
import { ContentEditor } from "@/components/ContentEditor";
import {
  Plus, Search, GripVertical, Filter, X, AlertCircle, Sparkles, Loader2,
} from "lucide-react";

const COLUMNS = [
  { id: "draft", label: "Draft", description: "Content being created", color: "border-border", headerColor: "text-muted-foreground", bg: "bg-muted/20" },
  { id: "in_review", label: "In Review", description: "Pending editorial review", color: "border-yellow-500/30", headerColor: "text-yellow-400", bg: "bg-yellow-500/5" },
  { id: "approved", label: "Approved", description: "Ready for scheduling or publishing", color: "border-green-500/30", headerColor: "text-green-400", bg: "bg-green-500/5" },
  { id: "scheduled", label: "Scheduled", description: "Queued for future publication", color: "border-blue-500/30", headerColor: "text-blue-400", bg: "bg-blue-500/5" },
  { id: "published", label: "Published", description: "Live and accessible", color: "border-emerald-500/30", headerColor: "text-emerald-400", bg: "bg-emerald-500/5" },
  { id: "rejected", label: "Rejected", description: "Needs revision", color: "border-red-500/30", headerColor: "text-red-400", bg: "bg-red-500/5" },
] as const;

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function DraggableContentCard({ piece, users, onClick, onDragStart }: { piece: any; users: any[]; onClick: () => void; onDragStart: (e: React.DragEvent, pieceId: string) => void }) {
  const assignee = users?.find((u: any) => u.id === piece.assignedTo);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", piece.id);
        onDragStart(e, piece.id);
      }}
      className="group"
      data-testid={`card-content-${piece.id}`}
    >
      <Card
        className="border-border/40 bg-card/60 hover:border-border/70 hover:bg-card/80 transition-all cursor-pointer shadow-sm"
        onClick={onClick}
      >
        {piece.coverImage && (
          <div className="h-20 overflow-hidden rounded-t-lg">
            <img src={piece.coverImage} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <CardContent className="p-3 space-y-2">
          <div className="flex items-start gap-2">
            <div
              className="mt-1 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none shrink-0"
              data-testid={`drag-handle-${piece.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-tight truncate" data-testid={`text-content-title-${piece.id}`}>
                {piece.title}
              </p>
            </div>
            {piece.aiGenerated && (
              <Sparkles className="h-3.5 w-3.5 text-purple-400 shrink-0" data-testid={`icon-ai-${piece.id}`} />
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <TypeBadge type={piece.type} className="text-[10px] h-5 px-1.5" />
            <PriorityBadge priority={piece.priority || "medium"} className="text-[10px] h-5 px-1.5" />
          </div>

          <div className="flex items-center justify-end">
            {assignee && (
              <Avatar className="h-6 w-6" data-testid={`avatar-assignee-${piece.id}`}>
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
  pieces,
  users,
  onAddContent,
  onPieceClick,
  onDragStart,
  onDrop,
  isDropTarget,
}: {
  column: typeof COLUMNS[number];
  pieces: any[];
  users: any[];
  onAddContent: () => void;
  onPieceClick: (piece: any) => void;
  onDragStart: (e: React.DragEvent, pieceId: string) => void;
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
              {pieces.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={onAddContent}
            data-testid={`button-add-content-${column.id}`}
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
        {pieces.map(piece => (
          <DraggableContentCard
            key={piece.id}
            piece={piece}
            users={users || []}
            onClick={() => onPieceClick(piece)}
            onDragStart={onDragStart}
          />
        ))}
        {pieces.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground/40">
            <AlertCircle className="h-6 w-6 mb-2" />
            <p className="text-xs font-mono">No content</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateContentDialog({
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
    type: "article",
    priority: "medium",
    assignedTo: "",
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/content-pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] }),
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast({ title: "Required", description: "Content title is required.", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: columnStatus,
      type: form.type,
      priority: form.priority,
      assignedTo: form.assignedTo || null,
    }, {
      onSuccess: () => {
        toast({ title: "Content Created", description: "New content piece has been added to the board." });
        onClose();
        setForm({ title: "", description: "", type: "article", priority: "medium", assignedTo: "" });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-create-content">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Content
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Title *</Label>
            <Input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Content title..."
              data-testid="input-content-title"
            />
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Content description..."
              className="min-h-[80px]"
              data-testid="input-content-description"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger data-testid="select-content-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger data-testid="select-content-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Assigned To</Label>
            <Select value={form.assignedTo || "__none__"} onValueChange={v => setForm(f => ({ ...f, assignedTo: v === "__none__" ? "" : v }))}>
              <SelectTrigger data-testid="select-content-assignee">
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-content">Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-submit-content">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function KanbanBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogStatus, setCreateDialogStatus] = useState("draft");
  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const { data: allPieces = [], isLoading } = useContentPieces();
  const { data: metrics } = useContentMetrics();
  const updateMutation = useUpdateContentPiece();
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const filteredPieces = useMemo(() => {
    let result = allPieces as any[];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p: any) =>
        p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
      );
    }
    if (filterType) {
      result = result.filter((p: any) => p.type === filterType);
    }
    if (filterPriority) {
      result = result.filter((p: any) => p.priority === filterPriority);
    }
    return result;
  }, [allPieces, searchQuery, filterType, filterPriority]);

  const columnPieces = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    COLUMNS.forEach(col => { grouped[col.id] = []; });
    filteredPieces.forEach((p: any) => {
      if (grouped[p.status]) {
        grouped[p.status].push(p);
      } else {
        grouped.draft?.push(p);
      }
    });
    return grouped;
  }, [filteredPieces]);

  const handleDragStart = useCallback((_e: React.DragEvent, _pieceId: string) => {}, []);

  const handleDrop = useCallback(async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const pieceId = e.dataTransfer.getData("text/plain");
    if (!pieceId) return;

    const piece = (allPieces as any[]).find((p: any) => p.id === pieceId);
    if (!piece || piece.status === columnId) return;

    try {
      await updateMutation.mutateAsync({ id: pieceId, status: columnId });
      toast({ title: "Status Updated", description: `Moved to ${COLUMNS.find(c => c.id === columnId)?.label}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }, [allPieces, updateMutation, toast]);

  const handleAddContent = useCallback((status: string) => {
    setCreateDialogStatus(status);
    setCreateDialogOpen(true);
  }, []);

  const handlePieceClick = useCallback((piece: any) => {
    setSelectedPiece(piece);
    setEditorOpen(true);
  }, []);

  const hasFilters = searchQuery || filterType || filterPriority;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="kanban-board">
      <PageHeader
        pageKey="kanban"
        onPrimaryAction={() => handleAddContent("draft")}
        primaryActionOverride="New Content"
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search content..."
            className="pl-9"
            data-testid="input-search-content"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterType || "__all__"} onValueChange={v => setFilterType(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[140px]" data-testid="select-filter-type">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Types</SelectItem>
              {CONTENT_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPriority || "__all__"} onValueChange={v => setFilterPriority(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-[140px]" data-testid="select-filter-priority">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Priorities</SelectItem>
              {CONTENT_PRIORITIES.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasFilters && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => { setSearchQuery(""); setFilterType(""); setFilterPriority(""); }}
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {metrics && (
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground ml-auto">
            <span data-testid="text-total-count">Total: {metrics.total || 0}</span>
            {metrics.ai_generated > 0 && (
              <span className="flex items-center gap-1 text-purple-400" data-testid="text-ai-count">
                <Sparkles className="h-3 w-3" /> {metrics.ai_generated} AI
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4" data-testid="kanban-columns">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            pieces={columnPieces[column.id] || []}
            users={users || []}
            onAddContent={() => handleAddContent(column.id)}
            onPieceClick={handlePieceClick}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            isDropTarget={dragOverColumn === column.id}
          />
        ))}
      </div>

      <CreateContentDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        columnStatus={createDialogStatus}
        users={users || []}
      />

      <ContentEditor
        piece={selectedPiece}
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setSelectedPiece(null);
        }}
        users={users || []}
      />
    </div>
  );
}
