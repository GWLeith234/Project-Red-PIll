import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { StatusBadge, CONTENT_STATUSES, CONTENT_TYPES, CONTENT_PRIORITIES } from "@/components/ContentStatusBar";
import { useUpdateContentPiece } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save, X } from "lucide-react";

interface ContentEditorProps {
  piece: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users?: any[];
}

export function ContentEditor({ piece, open, onOpenChange, users = [] }: ContentEditorProps) {
  const [form, setForm] = useState<any>({});
  const updateMutation = useUpdateContentPiece();
  const { toast } = useToast();

  useEffect(() => {
    if (piece) {
      setForm({
        title: piece.title || "",
        description: piece.description || "",
        body: piece.body || "",
        type: piece.type || "article",
        status: piece.status || "draft",
        priority: piece.priority || "medium",
        assignedTo: piece.assignedTo || "",
        reviewerNotes: piece.reviewerNotes || "",
        seoTitle: piece.seoTitle || "",
        seoDescription: piece.seoDescription || "",
        scheduledPublishAt: piece.scheduledPublishAt ? new Date(piece.scheduledPublishAt).toISOString().slice(0, 16) : "",
      });
    }
  }, [piece]);

  if (!piece) return null;

  const handleSave = async () => {
    try {
      const payload: any = { ...form };
      if (payload.scheduledPublishAt) {
        payload.scheduledPublishAt = new Date(payload.scheduledPublishAt);
      } else {
        payload.scheduledPublishAt = null;
      }
      if (!payload.assignedTo) payload.assignedTo = null;
      await updateMutation.mutateAsync({ id: piece.id, data: payload });
      toast({ title: "Saved", description: "Content piece updated successfully." });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const update = (field: string, value: any) => setForm((f: any) => ({ ...f, [field]: value }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent data-testid="content-editor-panel" side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Content</SheetTitle>
          <SheetDescription>
            <StatusBadge status={piece.status} />
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div>
            <Label htmlFor="editor-title">Title</Label>
            <Input data-testid="editor-title" id="editor-title" value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>

          <div>
            <Label htmlFor="editor-description">Description</Label>
            <Textarea data-testid="editor-description" id="editor-description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => update("type", v)}>
                <SelectTrigger data-testid="editor-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v)}>
                <SelectTrigger data-testid="editor-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
                <SelectTrigger data-testid="editor-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CONTENT_PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assigned To</Label>
              <Select value={form.assignedTo || "unassigned"} onValueChange={(v) => update("assignedTo", v === "unassigned" ? "" : v)}>
                <SelectTrigger data-testid="editor-assigned-to"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.displayName || u.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {form.status === "scheduled" && (
            <div>
              <Label htmlFor="editor-schedule">Scheduled Publish</Label>
              <Input data-testid="editor-schedule" id="editor-schedule" type="datetime-local" value={form.scheduledPublishAt} onChange={(e) => update("scheduledPublishAt", e.target.value)} />
            </div>
          )}

          <div>
            <Label htmlFor="editor-body">Body</Label>
            <Textarea data-testid="editor-body" id="editor-body" value={form.body} onChange={(e) => update("body", e.target.value)} rows={8} className="font-mono text-xs" />
          </div>

          <div>
            <Label htmlFor="editor-notes">Reviewer Notes</Label>
            <Textarea data-testid="editor-notes" id="editor-notes" value={form.reviewerNotes} onChange={(e) => update("reviewerNotes", e.target.value)} rows={2} placeholder="Notes for reviewers..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="editor-seo-title">SEO Title</Label>
              <Input data-testid="editor-seo-title" id="editor-seo-title" value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="editor-seo-desc">SEO Description</Label>
              <Input data-testid="editor-seo-desc" id="editor-seo-desc" value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button data-testid="editor-save" onClick={handleSave} disabled={updateMutation.isPending} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button data-testid="editor-cancel" variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
