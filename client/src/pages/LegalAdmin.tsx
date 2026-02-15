import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import type { LegalTemplate } from "@shared/schema";
import {
  FileText, Plus, Save, Trash2, Loader2, Eye, X, Shield,
  CheckCircle2, XCircle,
} from "lucide-react";

async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }
  if (res.status === 204) return null;
  return res.json();
}

const TEMPLATE_TYPES = [
  { value: "terms_of_service", label: "Terms of Service" },
  { value: "privacy_policy", label: "Privacy Policy" },
  { value: "cookie_policy", label: "Cookie Policy" },
  { value: "accessibility_statement", label: "Accessibility Statement" },
  { value: "dmca_policy", label: "DMCA Policy" },
];

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getTypeLabel(type: string) {
  return TEMPLATE_TYPES.find(t => t.value === type)?.label || type;
}

export default function LegalAdmin() {
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEdit = hasPermission("settings.edit");

  const [editing, setEditing] = useState<LegalTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formType, setFormType] = useState("terms_of_service");
  const [formBody, setFormBody] = useState("");
  const [formVersion, setFormVersion] = useState(1);
  const [formIsActive, setFormIsActive] = useState(true);

  const { data: templates = [], isLoading } = useQuery<LegalTemplate[]>({
    queryKey: ["/api/legal-templates"],
    queryFn: () => apiRequest("/api/legal-templates"),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/legal-templates", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-templates"] });
      resetForm();
      toast({ title: "Template Created", description: "Legal template has been created successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/legal-templates/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-templates"] });
      resetForm();
      toast({ title: "Template Updated", description: "Legal template has been updated successfully." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/legal-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-templates"] });
      resetForm();
      setDeleteConfirm(null);
      toast({ title: "Template Deleted", description: "Legal template has been deleted." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  function resetForm() {
    setEditing(null);
    setCreating(false);
    setShowPreview(false);
    setPreviewHtml("");
    setFormTitle("");
    setFormType("terms_of_service");
    setFormBody("");
    setFormVersion(1);
    setFormIsActive(true);
  }

  function openCreate() {
    resetForm();
    setCreating(true);
  }

  function openEdit(template: LegalTemplate) {
    setCreating(false);
    setShowPreview(false);
    setPreviewHtml("");
    setEditing(template);
    setFormTitle(template.title);
    setFormType(template.templateType);
    setFormBody(template.body);
    setFormVersion(template.version ?? 1);
    setFormIsActive(template.isActive ?? true);
  }

  function handleSave() {
    const data = {
      title: formTitle,
      templateType: formType,
      body: formBody,
      version: formVersion,
      isActive: formIsActive,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  }

  async function handlePreview() {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/public/legal/${formType}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch preview");
      const data = await res.json();
      setPreviewHtml(data.body || data.content || formBody);
      setShowPreview(true);
    } catch {
      setPreviewHtml(formBody);
      setShowPreview(true);
    } finally {
      setPreviewLoading(false);
    }
  }

  const isFormOpen = creating || editing !== null;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6" data-testid="legal-admin-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 border border-primary/30 bg-primary/5 flex items-center justify-center flex-shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary uppercase tracking-wider" data-testid="text-page-title">
              Legal Templates
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage legal document templates for your platform</p>
          </div>
        </div>
        {canEdit && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors"
            data-testid="button-add-template"
          >
            <Plus className="h-4 w-4" />
            Add Template
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="border border-border bg-card/60 backdrop-blur-sm p-6" data-testid="template-form">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary/15 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {editing ? "Edit Template" : "Create New Template"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editing ? `Updating "${editing.title}"` : "Add a new legal document template"}
                </p>
              </div>
            </div>
            <button onClick={resetForm} className="p-1.5 hover:bg-muted rounded-sm transition-colors text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!showPreview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">Title</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Terms of Service"
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    data-testid="input-template-title"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">Template Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    data-testid="select-template-type"
                  >
                    {TEMPLATE_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">Version</label>
                  <input
                    type="number"
                    value={formVersion}
                    onChange={(e) => setFormVersion(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                    data-testid="input-template-version"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center justify-between gap-4 w-full py-2">
                    <div>
                      <span className="text-sm font-medium text-foreground">Active</span>
                      <p className="text-xs text-muted-foreground mt-0.5">Make this template publicly visible</p>
                    </div>
                    <button
                      onClick={() => setFormIsActive(!formIsActive)}
                      className={`relative w-11 h-6 rounded-sm transition-colors flex-shrink-0 ${formIsActive ? 'bg-primary' : 'bg-muted'}`}
                      data-testid="toggle-template-active"
                    >
                      <span className={`absolute top-0.5 h-5 w-5 bg-background border border-border transition-transform ${formIsActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">Body (Markdown)</label>
                <textarea
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Enter legal document content in Markdown format..."
                  rows={16}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary font-mono resize-y min-h-[200px]"
                  data-testid="textarea-template-body"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  {editing && canEdit && (
                    <button
                      onClick={() => setDeleteConfirm(editing.id)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                      data-testid="button-delete-template"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePreview}
                    disabled={previewLoading}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
                    data-testid="button-preview-template"
                  >
                    {previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                    Preview
                  </button>
                  {canEdit && (
                    <button
                      onClick={handleSave}
                      disabled={isSaving || !formTitle || !formBody}
                      className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
                      data-testid="button-save-template"
                    >
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-display font-bold text-primary uppercase tracking-wider">Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider border border-border text-muted-foreground hover:bg-muted/50 transition-colors"
                >
                  Back to Editor
                </button>
              </div>
              <div
                className="bg-background border border-border p-6 prose prose-invert prose-sm max-w-none min-h-[300px] whitespace-pre-wrap"
                data-testid="preview-content"
              >
                {previewHtml}
              </div>
            </div>
          )}

          {deleteConfirm && (
            <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <p className="text-sm text-red-400">
                Delete this template? This cannot be undone.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border hover:bg-muted transition-colors"
                  data-testid="button-cancel-delete"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                  data-testid="button-confirm-delete"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <div className="border border-border bg-card/30 backdrop-blur-sm text-center py-16">
          <div className="h-12 w-12 bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">No legal templates found</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Create your first legal document template to get started.</p>
        </div>
      ) : (
        <div className="border border-border bg-card/30 backdrop-blur-sm overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_1fr_80px_80px_100px_70px] gap-3 px-5 py-2.5 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
            <span>Title</span>
            <span>Type</span>
            <span>Version</span>
            <span>Status</span>
            <span>Updated</span>
            <span className="text-right">Actions</span>
          </div>

          {templates.map((template: LegalTemplate) => (
            <div
              key={template.id}
              className={`border-b border-border/60 last:border-b-0 transition-colors hover:bg-muted/5 cursor-pointer ${editing?.id === template.id ? 'bg-muted/10' : ''}`}
              onClick={() => openEdit(template)}
              data-testid={`row-template-${template.id}`}
            >
              <div className="flex flex-col sm:grid sm:grid-cols-[1fr_1fr_80px_80px_100px_70px] gap-3 px-5 py-3 items-start sm:items-center">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate" data-testid={`text-template-title-${template.id}`}>
                    {template.title}
                  </span>
                </div>

                <span className="text-sm text-muted-foreground truncate" data-testid={`text-template-type-${template.id}`}>
                  {getTypeLabel(template.templateType)}
                </span>

                <span className="text-sm text-muted-foreground font-mono">
                  v{template.version ?? 1}
                </span>

                <span data-testid={`text-template-status-${template.id}`}>
                  {template.isActive ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </span>

                <span className="text-xs text-muted-foreground/60">
                  {formatDate(template.updatedAt as string | null)}
                </span>

                <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(template)}
                    className="p-1.5 hover:bg-muted/80 rounded-sm transition-colors text-muted-foreground/60 hover:text-foreground"
                    title="Edit template"
                    data-testid={`button-edit-template-${template.id}`}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setDeleteConfirm(template.id);
                        setEditing(template);
                      }}
                      className="p-1.5 hover:bg-red-500/10 rounded-sm transition-colors text-muted-foreground/60 hover:text-red-400"
                      title="Delete template"
                      data-testid={`button-delete-template-${template.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}