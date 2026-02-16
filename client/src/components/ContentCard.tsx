import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, PriorityBadge, TypeBadge } from "@/components/ContentStatusBar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Eye, Edit, Trash2, Send, CheckCircle, Clock, XCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface ContentCardProps {
  piece: any;
  onEdit?: (piece: any) => void;
  onPreview?: (piece: any) => void;
  onStatusChange?: (piece: any, newStatus: string) => void;
  onDelete?: (piece: any) => void;
  compact?: boolean;
  className?: string;
}

export function ContentCard({ piece, onEdit, onPreview, onStatusChange, onDelete, compact, className }: ContentCardProps) {
  const statusTransitions: Record<string, { label: string; value: string; icon: any }[]> = {
    draft: [{ label: "Submit for Review", value: "in_review", icon: Send }],
    in_review: [
      { label: "Approve", value: "approved", icon: CheckCircle },
      { label: "Reject", value: "rejected", icon: XCircle },
    ],
    approved: [
      { label: "Schedule", value: "scheduled", icon: Clock },
      { label: "Publish Now", value: "published", icon: Eye },
    ],
    scheduled: [{ label: "Publish Now", value: "published", icon: Eye }],
    rejected: [{ label: "Move to Draft", value: "draft", icon: Edit }],
    published: [],
  };

  const transitions = statusTransitions[piece.status] || [];

  if (compact) {
    return (
      <div
        data-testid={`content-card-${piece.id}`}
        className={cn("flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer", className)}
        onClick={() => onEdit?.(piece)}
      >
        {piece.coverImage && (
          <img src={piece.coverImage} alt="" className="h-10 w-10 rounded object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{piece.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <TypeBadge type={piece.type} className="text-[10px] px-1.5 py-0" />
            {piece.aiGenerated && <Sparkles className="h-3 w-3 text-purple-400" />}
          </div>
        </div>
        <StatusBadge status={piece.status} className="text-[10px] px-1.5 py-0" />
      </div>
    );
  }

  return (
    <Card data-testid={`content-card-${piece.id}`} className={cn("overflow-hidden group", className)}>
      {piece.coverImage && (
        <div className="relative h-32 overflow-hidden">
          <img src={piece.coverImage} alt="" className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <StatusBadge status={piece.status} />
          </div>
        </div>
      )}
      <CardContent className={cn("p-4", piece.coverImage ? "" : "pt-4")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {!piece.coverImage && (
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={piece.status} />
              </div>
            )}
            <h3 className="text-sm font-semibold leading-tight line-clamp-2">{piece.title}</h3>
            {piece.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{piece.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button data-testid={`content-card-menu-${piece.id}`} variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onPreview && (
                <DropdownMenuItem data-testid={`action-preview-${piece.id}`} onClick={() => onPreview(piece)}>
                  <Eye className="h-4 w-4 mr-2" /> Preview
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem data-testid={`action-edit-${piece.id}`} onClick={() => onEdit(piece)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {transitions.length > 0 && <DropdownMenuSeparator />}
              {transitions.map((t) => (
                <DropdownMenuItem key={t.value} data-testid={`action-status-${t.value}-${piece.id}`} onClick={() => onStatusChange?.(piece, t.value)}>
                  <t.icon className="h-4 w-4 mr-2" /> {t.label}
                </DropdownMenuItem>
              ))}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem data-testid={`action-delete-${piece.id}`} className="text-destructive" onClick={() => onDelete(piece)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <TypeBadge type={piece.type} className="text-[10px]" />
          <PriorityBadge priority={piece.priority || "medium"} className="text-[10px]" />
          {piece.aiGenerated && (
            <Badge className="gap-1 bg-purple-500/20 text-purple-400 border-purple-500/30 text-[10px]">
              <Sparkles className="h-2.5 w-2.5" /> AI
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 text-[10px] text-muted-foreground">
          <span>{piece.updatedAt ? format(new Date(piece.updatedAt), "MMM d, yyyy") : ""}</span>
          {piece.scheduledPublishAt && piece.status === "scheduled" && (
            <span className="text-blue-400">
              <Clock className="inline h-3 w-3 mr-0.5" />
              {format(new Date(piece.scheduledPublishAt), "MMM d, h:mm a")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
