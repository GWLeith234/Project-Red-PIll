import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Calendar, Cross, Newspaper, BarChart3, Building2, Megaphone, MessageSquare,
  Plus, Pencil, Trash2, Check, X, Star, StarOff, Eye, EyeOff,
  ShieldCheck, ShieldOff, Search, Loader2, Heart, Pin, PinOff,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";

async function api(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: "include", headers: { "Content-Type": "application/json" }, ...options });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }
  if (res.status === 204) return null;
  return res.json();
}

const TABS = [
  { key: "events", label: "Events", icon: Calendar },
  { key: "obituaries", label: "Obituaries", icon: Cross },
  { key: "classifieds", label: "Classifieds", icon: Newspaper },
  { key: "polls", label: "Polls", icon: BarChart3 },
  { key: "discussion", label: "Discussion", icon: MessageSquare },
  { key: "directory", label: "Directory", icon: Building2 },
  { key: "announcements", label: "Announcements", icon: Megaphone },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function CommunityAdmin() {
  const [activeTab, setActiveTab] = useState<TabKey>("events");

  return (
    <div data-testid="community-admin-page" className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary tracking-tight" data-testid="text-page-title">
          Community Content
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Manage community events, announcements, classifieds, and more</p>
      </div>

      <div className="flex items-center gap-1 mb-6 flex-wrap border-b border-border" data-testid="community-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            }`}
            data-testid={`tab-${tab.key}`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "events" && <EventsTab />}
      {activeTab === "obituaries" && <ObituariesTab />}
      {activeTab === "classifieds" && <ClassifiedsTab />}
      {activeTab === "polls" && <PollsTab />}
      {activeTab === "discussion" && <DiscussionTab />}
      {activeTab === "directory" && <DirectoryTab />}
      {activeTab === "announcements" && <AnnouncementsTab />}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
    active: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    sold: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    expired: "bg-gray-500/15 text-gray-400 border-gray-500/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-md border ${colors[status] || colors.pending}`} data-testid={`badge-status-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DeleteConfirmation({ onConfirm, onCancel, isPending, name }: { onConfirm: () => void; onCancel: () => void; isPending: boolean; name: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" data-testid="delete-confirmation">
      <div className="bg-card border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <p className="text-sm text-foreground mb-4">
          Delete <span className="font-medium">{name}</span>? This cannot be undone.
        </p>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="px-3 py-1.5 text-xs font-medium text-muted-foreground border border-border rounded-md hover:bg-muted transition-colors" data-testid="button-cancel-delete">Cancel</button>
          <button onClick={onConfirm} disabled={isPending} className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50" data-testid="button-confirm-delete">
            {isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormOverlay({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8" data-testid="form-overlay">
      <div className="bg-card border border-border rounded-xl p-6 max-w-2xl w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground" data-testid="text-form-title">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground" data-testid="button-close-form">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children, testId }: { label: string; children: React.ReactNode; testId?: string }) {
  return (
    <div data-testid={testId}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full bg-background border border-border px-3 py-2 text-sm text-foreground rounded-md focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20";
const selectClass = inputClass + " appearance-none cursor-pointer";
const textareaClass = inputClass + " min-h-[80px] resize-y";

function EventsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: events = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/community-events"], queryFn: () => api("/api/community-events") });

  const createMut = useMutation({
    mutationFn: (d: any) => api("/api/community-events", { method: "POST", body: JSON.stringify(d) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-events"] }); setShowForm(false); },
  });
  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api(`/api/community-events/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-events"] }); setEditing(null); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/community-events/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-events"] }); setDeleting(null); },
  });

  const filtered = events.filter((e: any) => !search || e.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="events-tab">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} data-testid="input-search-events" />
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90 transition-all" data-testid="button-add-event">
          <Plus className="h-4 w-4" /> Add Event
        </button>
      </div>

      {(showForm || editing) && (
        <FormOverlay title={editing ? "Edit Event" : "Add Event"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <EventForm initial={editing} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} isPending={createMut.isPending || updateMut.isPending} error={createMut.error?.message || updateMut.error?.message} />
        </FormOverlay>
      )}

      {deleting && <DeleteConfirmation name={deleting.title} onConfirm={() => deleteMut.mutate(deleting.id)} onCancel={() => setDeleting(null)} isPending={deleteMut.isPending} />}

      {isLoading ? <LoadingSkeleton /> : filtered.length === 0 ? <EmptyState text="No events found" /> : (
        <div className="border border-border rounded-xl bg-card/30 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_120px_100px_90px_70px_80px] gap-3 px-5 py-2.5 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
            <span>Title</span><span>Date</span><span>Category</span><span>Status</span><span>Featured</span><span className="text-right">Actions</span>
          </div>
          {filtered.map((e: any) => (
            <div key={e.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_120px_100px_90px_70px_80px] gap-3 px-5 py-3 border-b border-border/60 last:border-b-0 hover:bg-muted/5 items-start sm:items-center" data-testid={`row-event-${e.id}`}>
              <span className="text-sm font-medium text-foreground truncate" data-testid={`text-event-title-${e.id}`}>{e.title}</span>
              <span className="text-xs text-muted-foreground">{e.startDate || "—"}</span>
              <span className="text-xs text-muted-foreground capitalize">{e.category || "general"}</span>
              <StatusBadge status={e.status || "pending"} />
              <span className="text-xs">{e.isFeatured ? <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> : <StarOff className="h-4 w-4 text-muted-foreground/30" />}</span>
              <div className="flex items-center justify-end gap-1">
                {e.status === "pending" && (
                  <>
                    <button onClick={() => updateMut.mutate({ id: e.id, data: { status: "approved" } })} className="p-1.5 hover:bg-emerald-500/10 rounded-md text-muted-foreground hover:text-emerald-400" title="Approve" data-testid={`button-approve-event-${e.id}`}><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => updateMut.mutate({ id: e.id, data: { status: "rejected" } })} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400" title="Reject" data-testid={`button-reject-event-${e.id}`}><X className="h-3.5 w-3.5" /></button>
                  </>
                )}
                <button onClick={() => updateMut.mutate({ id: e.id, data: { isFeatured: !e.isFeatured } })} className="p-1.5 hover:bg-yellow-500/10 rounded-md text-muted-foreground hover:text-yellow-400" title={e.isFeatured ? "Unfeature" : "Feature"} data-testid={`button-feature-event-${e.id}`}>
                  {e.isFeatured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setEditing(e)} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title="Edit" data-testid={`button-edit-event-${e.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleting(e)} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400" title="Delete" data-testid={`button-delete-event-${e.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EventForm({ initial, onSubmit, isPending, error }: { initial?: any; onSubmit: (d: any) => void; isPending: boolean; error?: string }) {
  const [form, setForm] = useState({
    title: initial?.title || "", description: initial?.description || "", venueName: initial?.venueName || "",
    venueAddress: initial?.venueAddress || "", startDate: initial?.startDate || "", endDate: initial?.endDate || "",
    startTime: initial?.startTime || "", endTime: initial?.endTime || "", category: initial?.category || "general",
    imageUrl: initial?.imageUrl || "", ticketUrl: initial?.ticketUrl || "", organizerName: initial?.organizerName || "",
    organizerEmail: initial?.organizerEmail || "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4" data-testid="event-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Title" testId="field-event-title"><input value={form.title} onChange={e => set("title", e.target.value)} className={inputClass} required data-testid="input-event-title" /></FormField>
        <FormField label="Category" testId="field-event-category">
          <select value={form.category} onChange={e => set("category", e.target.value)} className={selectClass} data-testid="select-event-category">
            {["general","sports","music","business","community","education"].map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
          </select>
        </FormField>
        <FormField label="Start Date" testId="field-event-start-date"><DatePicker value={form.startDate} onChange={v => set("startDate", v)} placeholder="Pick start date" data-testid="input-event-start-date" /></FormField>
        <FormField label="End Date" testId="field-event-end-date"><DatePicker value={form.endDate} onChange={v => set("endDate", v)} placeholder="Pick end date" data-testid="input-event-end-date" /></FormField>
        <FormField label="Start Time" testId="field-event-start-time"><input type="time" value={form.startTime} onChange={e => set("startTime", e.target.value)} className={inputClass} data-testid="input-event-start-time" /></FormField>
        <FormField label="End Time" testId="field-event-end-time"><input type="time" value={form.endTime} onChange={e => set("endTime", e.target.value)} className={inputClass} data-testid="input-event-end-time" /></FormField>
        <FormField label="Venue Name" testId="field-event-venue"><input value={form.venueName} onChange={e => set("venueName", e.target.value)} className={inputClass} data-testid="input-event-venue" /></FormField>
        <FormField label="Venue Address" testId="field-event-address"><input value={form.venueAddress} onChange={e => set("venueAddress", e.target.value)} className={inputClass} data-testid="input-event-address" /></FormField>
        <FormField label="Organizer Name" testId="field-event-organizer"><input value={form.organizerName} onChange={e => set("organizerName", e.target.value)} className={inputClass} data-testid="input-event-organizer" /></FormField>
        <FormField label="Organizer Email" testId="field-event-organizer-email"><input type="email" value={form.organizerEmail} onChange={e => set("organizerEmail", e.target.value)} className={inputClass} data-testid="input-event-organizer-email" /></FormField>
        <FormField label="Image URL" testId="field-event-image"><input value={form.imageUrl} onChange={e => set("imageUrl", e.target.value)} className={inputClass} data-testid="input-event-image" /></FormField>
        <FormField label="Ticket URL" testId="field-event-ticket"><input value={form.ticketUrl} onChange={e => set("ticketUrl", e.target.value)} className={inputClass} data-testid="input-event-ticket" /></FormField>
      </div>
      <FormField label="Description" testId="field-event-description"><textarea value={form.description} onChange={e => set("description", e.target.value)} className={textareaClass} data-testid="input-event-description" /></FormField>
      {error && <p className="text-sm text-red-400" data-testid="text-form-error">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50" data-testid="button-submit-event">
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />} {initial ? "Update" : "Create"} Event
        </button>
      </div>
    </form>
  );
}

function ObituariesTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/obituaries"], queryFn: () => api("/api/obituaries") });
  const createMut = useMutation({ mutationFn: (d: any) => api("/api/obituaries", { method: "POST", body: JSON.stringify(d) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/obituaries"] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => api(`/api/obituaries/${id}`, { method: "PATCH", body: JSON.stringify(data) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/obituaries"] }); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => api(`/api/obituaries/${id}`, { method: "DELETE" }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/obituaries"] }); setDeleting(null); } });

  const filtered = items.filter((o: any) => !search || `${o.firstName} ${o.lastName}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="obituaries-tab">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search obituaries..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} data-testid="input-search-obituaries" />
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90" data-testid="button-add-obituary">
          <Plus className="h-4 w-4" /> Add Obituary
        </button>
      </div>

      {(showForm || editing) && (
        <FormOverlay title={editing ? "Edit Obituary" : "Add Obituary"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <ObituaryForm initial={editing} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} isPending={createMut.isPending || updateMut.isPending} error={createMut.error?.message || updateMut.error?.message} />
        </FormOverlay>
      )}
      {deleting && <DeleteConfirmation name={`${deleting.firstName} ${deleting.lastName}`} onConfirm={() => deleteMut.mutate(deleting.id)} onCancel={() => setDeleting(null)} isPending={deleteMut.isPending} />}

      {isLoading ? <LoadingSkeleton /> : filtered.length === 0 ? <EmptyState text="No obituaries found" /> : (
        <div className="border border-border rounded-xl bg-card/30 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_120px_1fr_90px_80px] gap-3 px-5 py-2.5 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
            <span>Name</span><span>Dates</span><span>Funeral Home</span><span>Published</span><span className="text-right">Actions</span>
          </div>
          {filtered.map((o: any) => (
            <div key={o.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_120px_1fr_90px_80px] gap-3 px-5 py-3 border-b border-border/60 last:border-b-0 hover:bg-muted/5 items-start sm:items-center" data-testid={`row-obituary-${o.id}`}>
              <span className="text-sm font-medium text-foreground" data-testid={`text-obituary-name-${o.id}`}>{o.firstName} {o.lastName}</span>
              <span className="text-xs text-muted-foreground">{o.birthDate && o.deathDate ? `${o.birthDate} — ${o.deathDate}` : o.deathDate || "—"}</span>
              <span className="text-xs text-muted-foreground truncate">{o.funeralHome || "—"}</span>
              <span>{o.publishedAt ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Published</span> : <span className="text-xs text-muted-foreground/50">Draft</span>}</span>
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => updateMut.mutate({ id: o.id, data: { publishedAt: o.publishedAt ? null : new Date().toISOString() } })} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title={o.publishedAt ? "Unpublish" : "Publish"} data-testid={`button-publish-obituary-${o.id}`}>
                  {o.publishedAt ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setEditing(o)} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title="Edit" data-testid={`button-edit-obituary-${o.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleting(o)} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400" title="Delete" data-testid={`button-delete-obituary-${o.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ObituaryForm({ initial, onSubmit, isPending, error }: { initial?: any; onSubmit: (d: any) => void; isPending: boolean; error?: string }) {
  const [form, setForm] = useState({
    firstName: initial?.firstName || "", lastName: initial?.lastName || "", birthDate: initial?.birthDate || "",
    deathDate: initial?.deathDate || "", obituaryText: initial?.obituaryText || "", funeralHome: initial?.funeralHome || "",
    serviceDetails: initial?.serviceDetails || "", photoUrl: initial?.photoUrl || "", tributeUrl: initial?.tributeUrl || "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4" data-testid="obituary-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="First Name" testId="field-obit-first"><input value={form.firstName} onChange={e => set("firstName", e.target.value)} className={inputClass} required data-testid="input-obit-first" /></FormField>
        <FormField label="Last Name" testId="field-obit-last"><input value={form.lastName} onChange={e => set("lastName", e.target.value)} className={inputClass} required data-testid="input-obit-last" /></FormField>
        <FormField label="Birth Date" testId="field-obit-birth"><DatePicker value={form.birthDate} onChange={v => set("birthDate", v)} placeholder="Pick birth date" data-testid="input-obit-birth" /></FormField>
        <FormField label="Death Date" testId="field-obit-death"><DatePicker value={form.deathDate} onChange={v => set("deathDate", v)} placeholder="Pick death date" data-testid="input-obit-death" /></FormField>
        <FormField label="Funeral Home" testId="field-obit-funeral"><input value={form.funeralHome} onChange={e => set("funeralHome", e.target.value)} className={inputClass} data-testid="input-obit-funeral" /></FormField>
        <FormField label="Photo URL" testId="field-obit-photo"><input value={form.photoUrl} onChange={e => set("photoUrl", e.target.value)} className={inputClass} data-testid="input-obit-photo" /></FormField>
        <FormField label="Tribute URL" testId="field-obit-tribute"><input value={form.tributeUrl} onChange={e => set("tributeUrl", e.target.value)} className={inputClass} data-testid="input-obit-tribute" /></FormField>
      </div>
      <FormField label="Service Details" testId="field-obit-service"><textarea value={form.serviceDetails} onChange={e => set("serviceDetails", e.target.value)} className={textareaClass} data-testid="input-obit-service" /></FormField>
      <FormField label="Obituary Text" testId="field-obit-text"><textarea value={form.obituaryText} onChange={e => set("obituaryText", e.target.value)} className={textareaClass} rows={5} data-testid="input-obit-text" /></FormField>
      {error && <p className="text-sm text-red-400" data-testid="text-form-error">{error}</p>}
      <div className="flex justify-end"><button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50" data-testid="button-submit-obituary">{isPending && <Loader2 className="h-4 w-4 animate-spin" />} {initial ? "Update" : "Create"}</button></div>
    </form>
  );
}

function ClassifiedsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/classifieds"], queryFn: () => api("/api/classifieds") });
  const createMut = useMutation({ mutationFn: (d: any) => api("/api/classifieds", { method: "POST", body: JSON.stringify(d) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/classifieds"] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => api(`/api/classifieds/${id}`, { method: "PATCH", body: JSON.stringify(data) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/classifieds"] }); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => api(`/api/classifieds/${id}`, { method: "DELETE" }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/classifieds"] }); setDeleting(null); } });

  const filtered = items.filter((c: any) => !search || c.title?.toLowerCase().includes(search.toLowerCase()));

  const formatPrice = (price: any, priceType: string) => {
    if (priceType === "free") return "Free";
    if (priceType === "contact") return "Contact";
    if (price) return `$${Number(price).toFixed(2)}${priceType === "negotiable" ? " (neg)" : ""}`;
    return "—";
  };

  return (
    <div data-testid="classifieds-tab">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search classifieds..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} data-testid="input-search-classifieds" />
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90" data-testid="button-add-classified">
          <Plus className="h-4 w-4" /> Add Classified
        </button>
      </div>

      {(showForm || editing) && (
        <FormOverlay title={editing ? "Edit Classified" : "Add Classified"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <ClassifiedForm initial={editing} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} isPending={createMut.isPending || updateMut.isPending} error={createMut.error?.message || updateMut.error?.message} />
        </FormOverlay>
      )}
      {deleting && <DeleteConfirmation name={deleting.title} onConfirm={() => deleteMut.mutate(deleting.id)} onCancel={() => setDeleting(null)} isPending={deleteMut.isPending} />}

      {isLoading ? <LoadingSkeleton /> : filtered.length === 0 ? <EmptyState text="No classifieds found" /> : (
        <div className="border border-border rounded-xl bg-card/30 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_100px_90px_80px_100px_80px] gap-3 px-5 py-2.5 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
            <span>Title</span><span>Category</span><span>Price</span><span>Status</span><span>Expires</span><span className="text-right">Actions</span>
          </div>
          {filtered.map((c: any) => (
            <div key={c.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_100px_90px_80px_100px_80px] gap-3 px-5 py-3 border-b border-border/60 last:border-b-0 hover:bg-muted/5 items-start sm:items-center" data-testid={`row-classified-${c.id}`}>
              <span className="text-sm font-medium text-foreground truncate" data-testid={`text-classified-title-${c.id}`}>{c.title}</span>
              <span className="text-xs text-muted-foreground capitalize">{(c.category || "for_sale").replace("_", " ")}</span>
              <span className="text-xs text-foreground font-medium">{formatPrice(c.price, c.priceType)}</span>
              <StatusBadge status={c.status || "active"} />
              <span className="text-xs text-muted-foreground">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</span>
              <div className="flex items-center justify-end gap-1">
                {c.status === "active" && (
                  <>
                    <button onClick={() => updateMut.mutate({ id: c.id, data: { status: "sold" } })} className="p-1.5 hover:bg-blue-500/10 rounded-md text-muted-foreground hover:text-blue-400 text-[10px] font-medium" title="Mark Sold" data-testid={`button-sold-classified-${c.id}`}>Sold</button>
                    <button onClick={() => updateMut.mutate({ id: c.id, data: { status: "expired" } })} className="p-1.5 hover:bg-gray-500/10 rounded-md text-muted-foreground hover:text-gray-400 text-[10px] font-medium" title="Mark Expired" data-testid={`button-expire-classified-${c.id}`}>Expire</button>
                  </>
                )}
                <button onClick={() => setEditing(c)} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title="Edit" data-testid={`button-edit-classified-${c.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleting(c)} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400" title="Delete" data-testid={`button-delete-classified-${c.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassifiedForm({ initial, onSubmit, isPending, error }: { initial?: any; onSubmit: (d: any) => void; isPending: boolean; error?: string }) {
  const [form, setForm] = useState({
    title: initial?.title || "", description: initial?.description || "", category: initial?.category || "for_sale",
    price: initial?.price?.toString() || "", priceType: initial?.priceType || "fixed", contactName: initial?.contactName || "",
    contactEmail: initial?.contactEmail || "", contactPhone: initial?.contactPhone || "", location: initial?.location || "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, price: form.price ? parseFloat(form.price) : null }); }} className="space-y-4" data-testid="classified-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Title" testId="field-class-title"><input value={form.title} onChange={e => set("title", e.target.value)} className={inputClass} required data-testid="input-class-title" /></FormField>
        <FormField label="Category" testId="field-class-category">
          <select value={form.category} onChange={e => set("category", e.target.value)} className={selectClass} data-testid="select-class-category">
            {["jobs","housing","for_sale","services","autos","wanted"].map(c => <option key={c} value={c}>{c.replace("_"," ").replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        </FormField>
        <FormField label="Price" testId="field-class-price"><input type="number" step="0.01" value={form.price} onChange={e => set("price", e.target.value)} className={inputClass} data-testid="input-class-price" /></FormField>
        <FormField label="Price Type" testId="field-class-price-type">
          <select value={form.priceType} onChange={e => set("priceType", e.target.value)} className={selectClass} data-testid="select-class-price-type">
            {["fixed","negotiable","free","contact"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </FormField>
        <FormField label="Contact Name" testId="field-class-contact"><input value={form.contactName} onChange={e => set("contactName", e.target.value)} className={inputClass} data-testid="input-class-contact" /></FormField>
        <FormField label="Contact Email" testId="field-class-email"><input type="email" value={form.contactEmail} onChange={e => set("contactEmail", e.target.value)} className={inputClass} data-testid="input-class-email" /></FormField>
        <FormField label="Contact Phone" testId="field-class-phone"><input value={form.contactPhone} onChange={e => set("contactPhone", e.target.value)} className={inputClass} data-testid="input-class-phone" /></FormField>
        <FormField label="Location" testId="field-class-location"><input value={form.location} onChange={e => set("location", e.target.value)} className={inputClass} data-testid="input-class-location" /></FormField>
      </div>
      <FormField label="Description" testId="field-class-desc"><textarea value={form.description} onChange={e => set("description", e.target.value)} className={textareaClass} data-testid="input-class-desc" /></FormField>
      {error && <p className="text-sm text-red-400" data-testid="text-form-error">{error}</p>}
      <div className="flex justify-end"><button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50" data-testid="button-submit-classified">{isPending && <Loader2 className="h-4 w-4 animate-spin" />} {initial ? "Update" : "Create"}</button></div>
    </form>
  );
}

function PollsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [viewingPoll, setViewingPoll] = useState<any>(null);

  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/community-polls"], queryFn: () => api("/api/community-polls") });
  const createMut = useMutation({ mutationFn: (d: any) => api("/api/community-polls", { method: "POST", body: JSON.stringify(d) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-polls"] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => api(`/api/community-polls/${id}`, { method: "PATCH", body: JSON.stringify(data) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-polls"] }); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => api(`/api/community-polls/${id}`, { method: "DELETE" }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-polls"] }); setDeleting(null); } });

  const getOptionsCount = (opts: any) => { if (Array.isArray(opts)) return opts.length; return 0; };

  return (
    <div data-testid="polls-tab">
      <div className="flex items-center justify-end mb-4">
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90" data-testid="button-add-poll">
          <Plus className="h-4 w-4" /> Add Poll
        </button>
      </div>

      {(showForm || editing) && (
        <FormOverlay title={editing ? "Edit Poll" : "Add Poll"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <PollForm initial={editing} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} isPending={createMut.isPending || updateMut.isPending} error={createMut.error?.message || updateMut.error?.message} />
        </FormOverlay>
      )}
      {deleting && <DeleteConfirmation name={deleting.question?.slice(0, 40)} onConfirm={() => deleteMut.mutate(deleting.id)} onCancel={() => setDeleting(null)} isPending={deleteMut.isPending} />}

      {viewingPoll && (
        <FormOverlay title="Poll Results" onClose={() => setViewingPoll(null)}>
          <PollResults poll={viewingPoll} />
        </FormOverlay>
      )}

      {isLoading ? <LoadingSkeleton /> : items.length === 0 ? <EmptyState text="No polls found" /> : (
        <div className="border border-border rounded-xl bg-card/30 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_80px_80px_70px_100px_100px] gap-3 px-5 py-2.5 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
            <span>Question</span><span>Options</span><span>Votes</span><span>Active</span><span>Expires</span><span className="text-right">Actions</span>
          </div>
          {items.map((p: any) => (
            <div key={p.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_80px_80px_70px_100px_100px] gap-3 px-5 py-3 border-b border-border/60 last:border-b-0 hover:bg-muted/5 items-start sm:items-center" data-testid={`row-poll-${p.id}`}>
              <span className="text-sm font-medium text-foreground truncate cursor-pointer hover:text-primary" onClick={() => setViewingPoll(p)} data-testid={`text-poll-question-${p.id}`}>{p.question}</span>
              <span className="text-xs text-muted-foreground">{getOptionsCount(p.options)}</span>
              <span className="text-xs text-foreground font-medium">{p.totalVotes || 0}</span>
              <span>{p.isActive ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />Yes</span> : <span className="text-xs text-muted-foreground/50">No</span>}</span>
              <span className="text-xs text-muted-foreground">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "—"}</span>
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => setViewingPoll(p)} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title="View Results" data-testid={`button-view-poll-${p.id}`}><BarChart3 className="h-3.5 w-3.5" /></button>
                <button onClick={() => updateMut.mutate({ id: p.id, data: { isActive: !p.isActive } })} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title={p.isActive ? "Deactivate" : "Activate"} data-testid={`button-toggle-poll-${p.id}`}>
                  {p.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setEditing(p)} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title="Edit" data-testid={`button-edit-poll-${p.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleting(p)} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400" title="Delete" data-testid={`button-delete-poll-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PollResults({ poll }: { poll: any }) {
  const options = Array.isArray(poll.options) ? poll.options : [];
  const maxVotes = Math.max(...options.map((o: any) => o.votes || 0), 1);
  return (
    <div className="space-y-3" data-testid="poll-results">
      <p className="text-sm font-medium text-foreground mb-4">{poll.question}</p>
      {options.map((opt: any, i: number) => (
        <div key={i} className="space-y-1" data-testid={`poll-option-${i}`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground">{opt.text || opt.label || `Option ${i + 1}`}</span>
            <span className="text-muted-foreground font-medium">{opt.votes || 0} votes</span>
          </div>
          <div className="h-6 bg-muted/30 rounded-md overflow-hidden">
            <div className="h-full bg-primary/60 rounded-md transition-all" style={{ width: `${((opt.votes || 0) / maxVotes) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-3">Total votes: {poll.totalVotes || 0}</p>
    </div>
  );
}

function PollForm({ initial, onSubmit, isPending, error }: { initial?: any; onSubmit: (d: any) => void; isPending: boolean; error?: string }) {
  const existingOptions = initial?.options && Array.isArray(initial.options) ? initial.options.map((o: any) => o.text || o.label || "") : ["", ""];
  const [question, setQuestion] = useState(initial?.question || "");
  const [options, setOptions] = useState<string[]>(existingOptions.length >= 2 ? existingOptions : ["", ""]);
  const [expiresAt, setExpiresAt] = useState(initial?.expiresAt ? new Date(initial.expiresAt).toISOString().split("T")[0] : "");

  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, v: string) => { const n = [...options]; n[i] = v; setOptions(n); };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ question, options: options.filter(o => o.trim()).map(text => ({ text, votes: 0 })), expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null }); }} className="space-y-4" data-testid="poll-form">
      <FormField label="Question" testId="field-poll-question"><input value={question} onChange={e => setQuestion(e.target.value)} className={inputClass} required data-testid="input-poll-question" /></FormField>
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">Options</label>
        {options.map((opt, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <input value={opt} onChange={e => updateOption(i, e.target.value)} className={inputClass} placeholder={`Option ${i + 1}`} data-testid={`input-poll-option-${i}`} />
            {options.length > 2 && <button type="button" onClick={() => removeOption(i)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-md" data-testid={`button-remove-option-${i}`}><X className="h-4 w-4" /></button>}
          </div>
        ))}
        <button type="button" onClick={addOption} className="text-xs text-primary hover:underline" data-testid="button-add-option">+ Add Option</button>
      </div>
      <FormField label="Expires At" testId="field-poll-expires"><DatePicker value={expiresAt} onChange={v => setExpiresAt(v)} placeholder="Pick expiry date" data-testid="input-poll-expires" /></FormField>
      {error && <p className="text-sm text-red-400" data-testid="text-form-error">{error}</p>}
      <div className="flex justify-end"><button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50" data-testid="button-submit-poll">{isPending && <Loader2 className="h-4 w-4 animate-spin" />} {initial ? "Update" : "Create"}</button></div>
    </form>
  );
}

function DirectoryTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/business-listings"], queryFn: () => api("/api/business-listings") });
  const createMut = useMutation({ mutationFn: (d: any) => api("/api/business-listings", { method: "POST", body: JSON.stringify(d) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/business-listings"] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => api(`/api/business-listings/${id}`, { method: "PATCH", body: JSON.stringify(data) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/business-listings"] }); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => api(`/api/business-listings/${id}`, { method: "DELETE" }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/business-listings"] }); setDeleting(null); } });

  const filtered = items.filter((b: any) => !search || b.businessName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="directory-tab">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search businesses..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} data-testid="input-search-directory" />
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90" data-testid="button-add-listing">
          <Plus className="h-4 w-4" /> Add Business
        </button>
      </div>

      {(showForm || editing) && (
        <FormOverlay title={editing ? "Edit Business" : "Add Business"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <DirectoryForm initial={editing} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} isPending={createMut.isPending || updateMut.isPending} error={createMut.error?.message || updateMut.error?.message} />
        </FormOverlay>
      )}
      {deleting && <DeleteConfirmation name={deleting.businessName} onConfirm={() => deleteMut.mutate(deleting.id)} onCancel={() => setDeleting(null)} isPending={deleteMut.isPending} />}

      {isLoading ? <LoadingSkeleton /> : filtered.length === 0 ? <EmptyState text="No business listings found" /> : (
        <div className="border border-border rounded-xl bg-card/30 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_100px_90px_70px_70px_100px] gap-3 px-5 py-2.5 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
            <span>Business</span><span>Category</span><span>City</span><span>Featured</span><span>Verified</span><span className="text-right">Actions</span>
          </div>
          {filtered.map((b: any) => (
            <div key={b.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_100px_90px_70px_70px_100px] gap-3 px-5 py-3 border-b border-border/60 last:border-b-0 hover:bg-muted/5 items-start sm:items-center" data-testid={`row-listing-${b.id}`}>
              <span className="text-sm font-medium text-foreground truncate" data-testid={`text-listing-name-${b.id}`}>{b.businessName}</span>
              <span className="text-xs text-muted-foreground capitalize">{b.category || "—"}</span>
              <span className="text-xs text-muted-foreground">{b.city || "—"}</span>
              <span>{b.isFeatured ? <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" /> : <StarOff className="h-4 w-4 text-muted-foreground/30" />}</span>
              <span>{b.isVerified ? <ShieldCheck className="h-4 w-4 text-emerald-400" /> : <ShieldOff className="h-4 w-4 text-muted-foreground/30" />}</span>
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => updateMut.mutate({ id: b.id, data: { isFeatured: !b.isFeatured } })} className="p-1.5 hover:bg-yellow-500/10 rounded-md text-muted-foreground hover:text-yellow-400" title={b.isFeatured ? "Unfeature" : "Feature"} data-testid={`button-feature-listing-${b.id}`}>
                  {b.isFeatured ? <StarOff className="h-3.5 w-3.5" /> : <Star className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => updateMut.mutate({ id: b.id, data: { isVerified: !b.isVerified } })} className="p-1.5 hover:bg-emerald-500/10 rounded-md text-muted-foreground hover:text-emerald-400" title={b.isVerified ? "Unverify" : "Verify"} data-testid={`button-verify-listing-${b.id}`}>
                  {b.isVerified ? <ShieldOff className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setEditing(b)} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title="Edit" data-testid={`button-edit-listing-${b.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleting(b)} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400" title="Delete" data-testid={`button-delete-listing-${b.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DirectoryForm({ initial, onSubmit, isPending, error }: { initial?: any; onSubmit: (d: any) => void; isPending: boolean; error?: string }) {
  const [form, setForm] = useState({
    businessName: initial?.businessName || "", slug: initial?.slug || "", description: initial?.description || "",
    category: initial?.category || "", subcategory: initial?.subcategory || "", website: initial?.website || "",
    phone: initial?.phone || "", email: initial?.email || "", address: initial?.address || "",
    city: initial?.city || "", postalCode: initial?.postalCode || "", logoUrl: initial?.logoUrl || "", coverImage: initial?.coverImage || "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4" data-testid="directory-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Business Name" testId="field-biz-name"><input value={form.businessName} onChange={e => set("businessName", e.target.value)} className={inputClass} required data-testid="input-biz-name" /></FormField>
        <FormField label="Slug" testId="field-biz-slug"><input value={form.slug} onChange={e => set("slug", e.target.value)} className={inputClass} data-testid="input-biz-slug" /></FormField>
        <FormField label="Category" testId="field-biz-category"><input value={form.category} onChange={e => set("category", e.target.value)} className={inputClass} data-testid="input-biz-category" /></FormField>
        <FormField label="Subcategory" testId="field-biz-subcategory"><input value={form.subcategory} onChange={e => set("subcategory", e.target.value)} className={inputClass} data-testid="input-biz-subcategory" /></FormField>
        <FormField label="Website" testId="field-biz-website"><input value={form.website} onChange={e => set("website", e.target.value)} className={inputClass} data-testid="input-biz-website" /></FormField>
        <FormField label="Phone" testId="field-biz-phone"><input value={form.phone} onChange={e => set("phone", e.target.value)} className={inputClass} data-testid="input-biz-phone" /></FormField>
        <FormField label="Email" testId="field-biz-email"><input type="email" value={form.email} onChange={e => set("email", e.target.value)} className={inputClass} data-testid="input-biz-email" /></FormField>
        <FormField label="Address" testId="field-biz-address"><input value={form.address} onChange={e => set("address", e.target.value)} className={inputClass} data-testid="input-biz-address" /></FormField>
        <FormField label="City" testId="field-biz-city"><input value={form.city} onChange={e => set("city", e.target.value)} className={inputClass} data-testid="input-biz-city" /></FormField>
        <FormField label="Postal Code" testId="field-biz-postal"><input value={form.postalCode} onChange={e => set("postalCode", e.target.value)} className={inputClass} data-testid="input-biz-postal" /></FormField>
        <FormField label="Logo URL" testId="field-biz-logo"><input value={form.logoUrl} onChange={e => set("logoUrl", e.target.value)} className={inputClass} data-testid="input-biz-logo" /></FormField>
        <FormField label="Cover Image" testId="field-biz-cover"><input value={form.coverImage} onChange={e => set("coverImage", e.target.value)} className={inputClass} data-testid="input-biz-cover" /></FormField>
      </div>
      <FormField label="Description" testId="field-biz-desc"><textarea value={form.description} onChange={e => set("description", e.target.value)} className={textareaClass} data-testid="input-biz-desc" /></FormField>
      {error && <p className="text-sm text-red-400" data-testid="text-form-error">{error}</p>}
      <div className="flex justify-end"><button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50" data-testid="button-submit-listing">{isPending && <Loader2 className="h-4 w-4 animate-spin" />} {initial ? "Update" : "Create"}</button></div>
    </form>
  );
}

function AnnouncementsTab() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: items = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/community-announcements"], queryFn: () => api("/api/community-announcements") });
  const createMut = useMutation({ mutationFn: (d: any) => api("/api/community-announcements", { method: "POST", body: JSON.stringify(d) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-announcements"] }); setShowForm(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: string; data: any }) => api(`/api/community-announcements/${id}`, { method: "PATCH", body: JSON.stringify(data) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-announcements"] }); setEditing(null); } });
  const deleteMut = useMutation({ mutationFn: (id: string) => api(`/api/community-announcements/${id}`, { method: "DELETE" }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-announcements"] }); setDeleting(null); } });

  const filtered = items.filter((a: any) => !search || a.names?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="announcements-tab">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search announcements..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} data-testid="input-search-announcements" />
        </div>
        <button onClick={() => { setShowForm(true); setEditing(null); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-medium text-sm rounded-lg hover:bg-primary/90" data-testid="button-add-announcement">
          <Plus className="h-4 w-4" /> Add Announcement
        </button>
      </div>

      {(showForm || editing) && (
        <FormOverlay title={editing ? "Edit Announcement" : "Add Announcement"} onClose={() => { setShowForm(false); setEditing(null); }}>
          <AnnouncementForm initial={editing} onSubmit={d => editing ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} isPending={createMut.isPending || updateMut.isPending} error={createMut.error?.message || updateMut.error?.message} />
        </FormOverlay>
      )}
      {deleting && <DeleteConfirmation name={deleting.names} onConfirm={() => deleteMut.mutate(deleting.id)} onCancel={() => setDeleting(null)} isPending={deleteMut.isPending} />}

      {isLoading ? <LoadingSkeleton /> : filtered.length === 0 ? <EmptyState text="No announcements found" /> : (
        <div className="border border-border rounded-xl bg-card/30 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[100px_1fr_90px_100px_80px] gap-3 px-5 py-2.5 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
            <span>Type</span><span>Names</span><span>Status</span><span>Date</span><span className="text-right">Actions</span>
          </div>
          {filtered.map((a: any) => (
            <div key={a.id} className="flex flex-col sm:grid sm:grid-cols-[100px_1fr_90px_100px_80px] gap-3 px-5 py-3 border-b border-border/60 last:border-b-0 hover:bg-muted/5 items-start sm:items-center" data-testid={`row-announcement-${a.id}`}>
              <span className="text-xs font-medium text-foreground capitalize" data-testid={`text-announcement-type-${a.id}`}>{a.type}</span>
              <span className="text-sm text-foreground truncate" data-testid={`text-announcement-names-${a.id}`}>{a.names}</span>
              <StatusBadge status={a.status || "pending"} />
              <span className="text-xs text-muted-foreground">{a.eventDate || "—"}</span>
              <div className="flex items-center justify-end gap-1">
                {a.status === "pending" && (
                  <>
                    <button onClick={() => updateMut.mutate({ id: a.id, data: { status: "approved" } })} className="p-1.5 hover:bg-emerald-500/10 rounded-md text-muted-foreground hover:text-emerald-400" title="Approve" data-testid={`button-approve-announcement-${a.id}`}><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => updateMut.mutate({ id: a.id, data: { status: "rejected" } })} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400" title="Reject" data-testid={`button-reject-announcement-${a.id}`}><X className="h-3.5 w-3.5" /></button>
                  </>
                )}
                <button onClick={() => setEditing(a)} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title="Edit" data-testid={`button-edit-announcement-${a.id}`}><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => setDeleting(a)} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400" title="Delete" data-testid={`button-delete-announcement-${a.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnnouncementForm({ initial, onSubmit, isPending, error }: { initial?: any; onSubmit: (d: any) => void; isPending: boolean; error?: string }) {
  const [form, setForm] = useState({
    type: initial?.type || "wedding", names: initial?.names || "", description: initial?.description || "",
    photoUrl: initial?.photoUrl || "", eventDate: initial?.eventDate || "",
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-4" data-testid="announcement-form">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Type" testId="field-ann-type">
          <select value={form.type} onChange={e => set("type", e.target.value)} className={selectClass} data-testid="select-ann-type">
            {["wedding","engagement","birth","anniversary","milestone"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </FormField>
        <FormField label="Names" testId="field-ann-names"><input value={form.names} onChange={e => set("names", e.target.value)} className={inputClass} required data-testid="input-ann-names" /></FormField>
        <FormField label="Event Date" testId="field-ann-date"><DatePicker value={form.eventDate} onChange={v => set("eventDate", v)} placeholder="Pick event date" data-testid="input-ann-date" /></FormField>
        <FormField label="Photo URL" testId="field-ann-photo"><input value={form.photoUrl} onChange={e => set("photoUrl", e.target.value)} className={inputClass} data-testid="input-ann-photo" /></FormField>
      </div>
      <FormField label="Description" testId="field-ann-desc"><textarea value={form.description} onChange={e => set("description", e.target.value)} className={textareaClass} data-testid="input-ann-desc" /></FormField>
      {error && <p className="text-sm text-red-400" data-testid="text-form-error">{error}</p>}
      <div className="flex justify-end"><button type="submit" disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50" data-testid="button-submit-announcement">{isPending && <Loader2 className="h-4 w-4 animate-spin" />} {initial ? "Update" : "Create"}</button></div>
    </form>
  );
}

function LoadingSkeleton() {
  return (
    <div className="border border-border rounded-xl bg-card/30" data-testid="loading-skeleton">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-b-0 animate-pulse">
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-3 w-48 bg-muted/50 rounded" />
          </div>
          <div className="h-6 w-16 bg-muted rounded-full" />
        </div>
      ))}
    </div>
  );
}

function DiscussionTab() {
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<any>(null);

  const { data: posts = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/community-posts"], queryFn: () => api("/api/community-posts") });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api(`/api/community-posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] }); },
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => api(`/api/community-posts/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/community-posts"] }); setDeleting(null); },
  });

  const filtered = posts.filter((p: any) => !search || p.content?.toLowerCase().includes(search.toLowerCase()) || p.authorName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="discussion-tab">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input type="text" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} className={`${inputClass} pl-9`} data-testid="input-search-posts" />
        </div>
        <span className="text-xs text-muted-foreground">{posts.length} posts</span>
      </div>

      {deleting && <DeleteConfirmation name={deleting.authorName + "'s post"} onConfirm={() => deleteMut.mutate(deleting.id)} onCancel={() => setDeleting(null)} isPending={deleteMut.isPending} />}

      {isLoading ? <LoadingSkeleton /> : filtered.length === 0 ? <EmptyState text="No discussion posts yet" /> : (
        <div className="border border-border rounded-xl bg-card/30 overflow-hidden">
          <div className="hidden sm:grid grid-cols-[1fr_120px_80px_60px_60px_90px] gap-3 px-5 py-2.5 border-b border-border bg-muted/20 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/70">
            <span>Content</span><span>Author</span><span>Likes</span><span>Pinned</span><span>Hidden</span><span className="text-right">Actions</span>
          </div>
          {filtered.map((p: any) => (
            <div key={p.id} className="flex flex-col sm:grid sm:grid-cols-[1fr_120px_80px_60px_60px_90px] gap-3 px-5 py-3 border-b border-border/60 last:border-b-0 hover:bg-muted/5 items-start sm:items-center" data-testid={`row-post-${p.id}`}>
              <span className="text-sm text-foreground line-clamp-2" data-testid={`text-post-content-${p.id}`}>{p.content}</span>
              <span className="text-xs text-muted-foreground truncate">{p.authorName}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3" />{p.likesCount || 0}</span>
              <span>{p.isPinned ? <Pin className="h-3.5 w-3.5 text-primary" /> : <span className="text-xs text-muted-foreground/30">—</span>}</span>
              <span>{p.isHidden ? <EyeOff className="h-3.5 w-3.5 text-red-400" /> : <Eye className="h-3.5 w-3.5 text-emerald-400" />}</span>
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => updateMut.mutate({ id: p.id, data: { isPinned: !p.isPinned } })} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title={p.isPinned ? "Unpin" : "Pin"} data-testid={`button-pin-post-${p.id}`}>
                  {p.isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => updateMut.mutate({ id: p.id, data: { isHidden: !p.isHidden } })} className="p-1.5 hover:bg-muted/80 rounded-md text-muted-foreground hover:text-foreground" title={p.isHidden ? "Show" : "Hide"} data-testid={`button-hide-post-${p.id}`}>
                  {p.isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setDeleting(p)} className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-400" title="Delete" data-testid={`button-delete-post-${p.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="border border-border rounded-xl bg-card/30 text-center py-16" data-testid="empty-state">
      <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
        <Heart className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground font-medium">{text}</p>
    </div>
  );
}
