import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  useCompanies, useCompany, useCreateCompany, useUpdateCompany, useDeleteCompany,
  useContacts, useCreateContact, useUpdateContact, useDeleteContact,
  useDeals, useDeal, useCreateDeal, useUpdateDeal, useDeleteDeal,
  useDealActivities, useCreateDealActivity, usePodcasts, useAnalyzeSocial,
  useAnalyzeWebsite,
  useOutboundCampaigns, useCreateOutboundCampaign, useDeleteOutboundCampaign, useSendOutboundCampaign,
} from "@/lib/api";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Mail, Phone, MapPin, Linkedin, Twitter, Facebook,
  Loader2, Zap, ChevronRight, Users, ArrowLeft, Building2,
  Pencil, Trash2, Globe, Building, Tag, StickyNote, Sparkles,
  Plus, DollarSign, Calendar, Upload, Briefcase, TrendingUp,
  Target, X, CheckCircle, XCircle, AlertCircle, Clock,
  Send, FileText, MessageSquare,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  lead: { label: "Lead", color: "text-gray-400", bgColor: "bg-gray-500/10", borderColor: "border-gray-500/20" },
  qualified: { label: "Qualified", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
  proposal: { label: "Proposal", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
  negotiation: { label: "Negotiation", color: "text-purple-400", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20" },
  closed_won: { label: "Closed Won", color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
  closed_lost: { label: "Closed Lost", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/20" },
};

const DEAL_TYPE_LABELS: Record<string, string> = {
  ad_campaign: "Ad Campaign",
  sponsorship: "Sponsorship",
  partnership: "Partnership",
};

const COMPANY_TYPE_LABELS: Record<string, string> = {
  advertiser: "Advertiser",
  sponsor: "Sponsor",
  partner: "Partner",
};

const ACTIVITY_ICONS: Record<string, any> = {
  note: StickyNote,
  call: Phone,
  meeting: Calendar,
  email: Mail,
  content_upload: Upload,
};

function formatCurrency(v: number | null | undefined) {
  if (!v) return "$0";
  return `$${v.toLocaleString()}`;
}

function CompanyForm({ onSubmit, initialData, onCancel }: {
  onSubmit: (data: any) => void;
  initialData?: any;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    industry: initialData?.industry || "",
    website: initialData?.website || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    address: initialData?.address || "",
    city: initialData?.city || "",
    state: initialData?.state || "",
    zip: initialData?.zip || "",
    country: initialData?.country || "",
    logo: initialData?.logo || "",
    description: initialData?.description || "",
    slogan: initialData?.slogan || "",
    timezone: initialData?.timezone || "",
    brandColors: initialData?.brandColors || [],
    annualRevenue: initialData?.annualRevenue?.toString() || "",
    employeeCount: initialData?.employeeCount?.toString() || "",
    companyType: initialData?.companyType || "advertiser",
    notes: initialData?.notes || "",
  });
  const { toast } = useToast();
  const analyzeWebsite = useAnalyzeWebsite();
  const [populatedFields, setPopulatedFields] = useState<string[]>([]);

  const handleSmartPopulate = () => {
    if (!form.website.trim()) {
      toast({ title: "Website Required", description: "Enter a website URL first, then click Smart Populate.", variant: "destructive" });
      return;
    }
    setPopulatedFields([]);
    analyzeWebsite.mutate({ url: form.website.trim() }, {
      onSuccess: (data: any) => {
        const filled: string[] = [];
        setForm(f => {
          const updated = { ...f };
          if (data.name && !f.name) { updated.name = data.name; filled.push("name"); }
          if (data.industry && !f.industry) { updated.industry = data.industry; filled.push("industry"); }
          if (data.phone && !f.phone) { updated.phone = data.phone; filled.push("phone"); }
          if (data.email && !f.email) { updated.email = data.email; filled.push("email"); }
          if (data.address && !f.address) { updated.address = data.address; filled.push("address"); }
          if (data.city && !f.city) { updated.city = data.city; filled.push("city"); }
          if (data.state && !f.state) { updated.state = data.state; filled.push("state"); }
          if (data.zip && !f.zip) { updated.zip = data.zip; filled.push("zip"); }
          if (data.country && !f.country) { updated.country = data.country; filled.push("country"); }
          if (data.logo) { updated.logo = data.logo; filled.push("logo"); }
          if (data.description && !f.description) { updated.description = data.description; filled.push("description"); }
          if (data.slogan) { updated.slogan = data.slogan; filled.push("slogan"); }
          if (data.timezone) { updated.timezone = data.timezone; filled.push("timezone"); }
          if (data.brandColors && data.brandColors.length > 0) { updated.brandColors = data.brandColors; filled.push("brand colors"); }
          if (data.website) { updated.website = data.website; }
          return updated;
        });
        setPopulatedFields(filled);
        if (filled.length > 0) {
          toast({ title: "Smart Populate Complete", description: `Found ${filled.length} field${filled.length > 1 ? "s" : ""}: ${filled.join(", ")}` });
        } else {
          toast({ title: "No New Data Found", description: "The website didn't return additional data, or all fields are already filled." });
        }
      },
      onError: (err: any) => {
        toast({ title: "Could not analyze website", description: err?.message || "Check the URL and try again.", variant: "destructive" });
      },
    });
  };

  const handleSubmit = () => {
    if (!form.name.trim()) {
      toast({ title: "Required Fields", description: "Company name is required.", variant: "destructive" });
      return;
    }
    onSubmit({
      ...form,
      annualRevenue: form.annualRevenue ? parseFloat(form.annualRevenue) : null,
      employeeCount: form.employeeCount ? parseInt(form.employeeCount) : null,
      brandColors: form.brandColors.length > 0 ? form.brandColors : null,
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-bold">{initialData ? "Edit Company" : "Add Company"}</h3>

      <div className="border border-dashed border-primary/30 bg-primary/5 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-1">Smart Populate from Website</p>
            <p className="text-xs text-muted-foreground mb-3">Enter a website URL below and click the button to automatically fill in company details like name, address, phone, logo, brand colors, timezone, and more.</p>
            <div className="flex gap-2">
              <Input
                value={form.website}
                onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                placeholder="https://example.com"
                className="flex-1"
                data-testid="input-company-website"
              />
              <Button
                onClick={handleSmartPopulate}
                disabled={analyzeWebsite.isPending || !form.website.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 whitespace-nowrap"
                data-testid="button-smart-populate"
              >
                {analyzeWebsite.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Smart Populate</>
                )}
              </Button>
            </div>
            {populatedFields.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5" data-testid="smart-populate-results">
                {populatedFields.map(f => (
                  <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full border border-green-500/20">
                    <CheckCircle className="h-3 w-3" /> {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Company Name *</label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Acme Corp" data-testid="input-company-name" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Industry</label>
          <Input value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))} placeholder="Technology" data-testid="input-company-industry" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Type</label>
          <Select value={form.companyType} onValueChange={v => setForm(f => ({ ...f, companyType: v }))}>
            <SelectTrigger data-testid="select-company-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="advertiser">Advertiser</SelectItem>
              <SelectItem value="sponsor">Sponsor</SelectItem>
              <SelectItem value="partner">Partner</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Slogan / Tagline</label>
          <Input value={form.slogan} onChange={e => setForm(f => ({ ...f, slogan: e.target.value }))} placeholder="Innovation for everyone" data-testid="input-company-slogan" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Phone</label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 123-4567" data-testid="input-company-phone" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Email</label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="info@example.com" data-testid="input-company-email" />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Address</label>
        <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main Street" data-testid="input-company-address" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" data-testid="input-company-city" />
        <Input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="State" data-testid="input-company-state" />
        <Input value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="ZIP" data-testid="input-company-zip" />
        <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="Country" data-testid="input-company-country" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Timezone (HQ)</label>
          <Input value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))} placeholder="America/New_York" data-testid="input-company-timezone" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Logo URL</label>
          <div className="flex gap-2 items-center">
            <Input value={form.logo} onChange={e => setForm(f => ({ ...f, logo: e.target.value }))} placeholder="https://..." className="flex-1" data-testid="input-company-logo" />
            {form.logo && (
              <img src={form.logo} alt="Logo" className="h-8 w-8 rounded object-contain bg-muted border border-border" data-testid="img-company-logo-preview" />
            )}
          </div>
        </div>
      </div>

      {form.brandColors.length > 0 && (
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Brand Colors</label>
          <div className="flex gap-2 items-center" data-testid="brand-colors-display">
            {form.brandColors.map((color: string, i: number) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md border border-border">
                <div className="h-5 w-5 rounded-sm border border-border" style={{ backgroundColor: color }} data-testid={`brand-color-swatch-${i}`} />
                <span className="text-xs font-mono text-muted-foreground">{color}</span>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, brandColors: f.brandColors.filter((_: string, idx: number) => idx !== i) }))}
                  className="text-muted-foreground hover:text-destructive ml-1"
                  data-testid={`button-remove-color-${i}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Annual Revenue ($)</label>
          <Input type="number" value={form.annualRevenue} onChange={e => setForm(f => ({ ...f, annualRevenue: e.target.value }))} placeholder="1000000" data-testid="input-company-revenue" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Employee Count</label>
          <Input type="number" value={form.employeeCount} onChange={e => setForm(f => ({ ...f, employeeCount: e.target.value }))} placeholder="50" data-testid="input-company-employees" />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the company..." className="min-h-[60px]" data-testid="input-company-description" />
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Notes</label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." className="min-h-[60px]" data-testid="input-company-notes" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-save-company">
          {initialData ? "Update Company" : "Add Company"}
        </Button>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-company">Cancel</Button>
      </div>
    </div>
  );
}

function ContactForm({ onSubmit, initialData, companies, onCancel }: {
  onSubmit: (data: any) => void;
  initialData?: any;
  companies: any[];
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    title: initialData?.title || "",
    department: initialData?.department || "",
    companyId: initialData?.companyId || "",
    profilePhoto: initialData?.profilePhoto || "",
    linkedinUrl: initialData?.linkedinUrl || "",
    twitterUrl: initialData?.twitterUrl || "",
    facebookUrl: initialData?.facebookUrl || "",
    bio: initialData?.bio || "",
    tags: (initialData?.tags || []).join(", "),
    notes: initialData?.notes || "",
    isPrimary: initialData?.isPrimary || false,
  });

  const analyzeSocial = useAnalyzeSocial();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [socialUrl, setSocialUrl] = useState("");
  const [showSocialDialog, setShowSocialDialog] = useState(false);

  const handleAnalyzeSocial = async () => {
    if (!socialUrl.trim()) return;
    setAnalyzing(true);
    try {
      const result = await analyzeSocial.mutateAsync({ url: socialUrl.trim() });
      const updates: any = {};
      if (result.profilePhoto) updates.profilePhoto = result.profilePhoto;
      if (result.firstName && !form.firstName) updates.firstName = result.firstName;
      if (result.lastName && !form.lastName) updates.lastName = result.lastName;
      if (result.title && !form.title) updates.title = result.title;
      if (result.bio && !form.bio) updates.bio = result.bio;
      if (result.linkedinUrl) updates.linkedinUrl = result.linkedinUrl;
      if (result.twitterUrl) updates.twitterUrl = result.twitterUrl;
      if (result.facebookUrl) updates.facebookUrl = result.facebookUrl;
      setForm(prev => ({ ...prev, ...updates }));
      const grabbed = Object.keys(updates).filter(k => updates[k]).length;
      toast({ title: "Profile Imported", description: `Grabbed ${grabbed} field${grabbed !== 1 ? "s" : ""} from ${result.platform || "social"} profile${result.profilePhoto ? " (including photo)" : ""}.` });
      setShowSocialDialog(false);
      setSocialUrl("");
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!form.firstName.trim() || !form.email.trim()) {
      toast({ title: "Required Fields", description: "First name and email are required.", variant: "destructive" });
      return;
    }
    onSubmit({
      ...form,
      companyId: form.companyId || null,
      tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{initialData ? "Edit Contact" : "Add Contact"}</h3>
        <Dialog open={showSocialDialog} onOpenChange={setShowSocialDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="border-primary/20 text-primary hover:bg-primary/10" data-testid="button-import-social">
              <Globe className="h-3 w-3 mr-1" />
              Import from Social
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Smart Profile Import
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Paste a LinkedIn, X/Twitter, or Facebook profile URL to automatically import their photo, name, title, and bio.
              </p>
              <Input
                placeholder="https://linkedin.com/in/name or https://x.com/handle"
                value={socialUrl}
                onChange={(e) => setSocialUrl(e.target.value)}
                data-testid="input-social-url"
              />
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-[#0A66C2] border-[#0A66C2]/30" onClick={() => setSocialUrl("https://linkedin.com/in/")} data-testid="button-linkedin-template">
                  <Linkedin className="h-3 w-3 mr-1" /> LinkedIn
                </Button>
                <Button size="sm" variant="outline" className="flex-1 border-border" onClick={() => setSocialUrl("https://x.com/")} data-testid="button-twitter-template">
                  <Twitter className="h-3 w-3 mr-1" /> X
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-[#1877F2] border-[#1877F2]/30" onClick={() => setSocialUrl("https://facebook.com/")} data-testid="button-facebook-template">
                  <Facebook className="h-3 w-3 mr-1" /> Facebook
                </Button>
              </div>
              <Button
                onClick={handleAnalyzeSocial}
                disabled={analyzing || !socialUrl.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-analyze-social"
              >
                {analyzing ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</>
                ) : (
                  <><Zap className="h-4 w-4 mr-2" /> Analyze & Import</>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {form.profilePhoto && (
        <div className="flex items-center gap-4 p-3 border border-border/50 rounded-sm bg-card/30" data-testid="preview-contact-profile-photo">
          <img src={form.profilePhoto} alt="Profile" className="h-16 w-16 rounded-full object-cover border-2 border-primary/20" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">Profile Photo</p>
            <Input value={form.profilePhoto} onChange={e => setForm(f => ({ ...f, profilePhoto: e.target.value }))} placeholder="Photo URL" className="text-xs" data-testid="input-contact-profile-photo" />
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => setForm(f => ({ ...f, profilePhoto: "" }))} data-testid="button-remove-contact-photo">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">First Name *</label>
          <Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} placeholder="John" data-testid="input-contact-first-name" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Last Name</label>
          <Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Doe" data-testid="input-contact-last-name" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Email *</label>
          <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" data-testid="input-contact-email" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Phone</label>
          <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 123-4567" data-testid="input-contact-phone" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Title</label>
          <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="VP Marketing" data-testid="input-contact-title" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Department</label>
          <Input value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="Marketing" data-testid="input-contact-department" />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Company</label>
        <Select value={form.companyId || "none"} onValueChange={v => setForm(f => ({ ...f, companyId: v === "none" ? "" : v }))}>
          <SelectTrigger data-testid="select-contact-company">
            <SelectValue placeholder="Select a company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Company</SelectItem>
            {companies.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t border-border/50 pt-4">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2 block">Social Profiles</label>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-[#0A66C2] shrink-0" />
            <Input value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} placeholder="LinkedIn URL" className="text-xs" data-testid="input-contact-linkedin" />
          </div>
          <div className="flex items-center gap-2">
            <Twitter className="h-4 w-4 shrink-0" />
            <Input value={form.twitterUrl} onChange={e => setForm(f => ({ ...f, twitterUrl: e.target.value }))} placeholder="X (Twitter) URL" className="text-xs" data-testid="input-contact-twitter" />
          </div>
          <div className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-[#1877F2] shrink-0" />
            <Input value={form.facebookUrl} onChange={e => setForm(f => ({ ...f, facebookUrl: e.target.value }))} placeholder="Facebook URL" className="text-xs" data-testid="input-contact-facebook" />
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Bio</label>
        <Textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Brief bio..." className="min-h-[60px]" data-testid="input-contact-bio" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Tags (comma separated)</label>
          <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="VIP, decision-maker" data-testid="input-contact-tags" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Notes</label>
          <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Internal notes..." data-testid="input-contact-notes" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={form.isPrimary}
          onCheckedChange={(checked) => setForm(f => ({ ...f, isPrimary: !!checked }))}
          data-testid="input-contact-primary"
        />
        <label className="text-sm text-muted-foreground">Primary Contact</label>
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-save-contact">
          {initialData ? "Update Contact" : "Add Contact"}
        </Button>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-contact">Cancel</Button>
      </div>
    </div>
  );
}

function DealForm({ onSubmit, initialData, companies, contacts, podcasts, onCancel }: {
  onSubmit: (data: any) => void;
  initialData?: any;
  companies: any[];
  contacts: any[];
  podcasts: any[];
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    companyId: initialData?.companyId || "",
    contactId: initialData?.contactId || "",
    value: initialData?.value?.toString() || "",
    stage: initialData?.stage || "lead",
    dealType: initialData?.dealType || "ad_campaign",
    priority: initialData?.priority || "medium",
    probability: initialData?.probability?.toString() || "50",
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split("T")[0] : "",
    closeDate: initialData?.closeDate ? new Date(initialData.closeDate).toISOString().split("T")[0] : "",
    podcastId: initialData?.podcastId || "",
    notes: initialData?.notes || "",
  });
  const { toast } = useToast();

  const filteredContacts = form.companyId
    ? contacts.filter((c: any) => c.companyId === form.companyId)
    : contacts;

  const handleSubmit = () => {
    if (!form.title.trim() || !form.companyId) {
      toast({ title: "Required Fields", description: "Title and company are required.", variant: "destructive" });
      return;
    }
    onSubmit({
      ...form,
      value: form.value ? parseFloat(form.value) : 0,
      probability: form.probability ? parseInt(form.probability) : 50,
      contactId: form.contactId || null,
      podcastId: form.podcastId || null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      closeDate: form.closeDate ? new Date(form.closeDate).toISOString() : null,
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display text-lg font-bold">{initialData ? "Edit Deal" : "Add Deal"}</h3>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Title *</label>
        <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Q1 Ad Campaign" data-testid="input-deal-title" />
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
        <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Deal description..." className="min-h-[60px]" data-testid="input-deal-description" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Company *</label>
          <Select value={form.companyId || "none"} onValueChange={v => setForm(f => ({ ...f, companyId: v === "none" ? "" : v, contactId: "" }))}>
            <SelectTrigger data-testid="select-deal-company">
              <SelectValue placeholder="Select a company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select a company</SelectItem>
              {companies.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Contact</label>
          <Select value={form.contactId || "none"} onValueChange={v => setForm(f => ({ ...f, contactId: v === "none" ? "" : v }))}>
            <SelectTrigger data-testid="select-deal-contact">
              <SelectValue placeholder="Select a contact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Contact</SelectItem>
              {filteredContacts.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Value ($)</label>
          <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="25000" data-testid="input-deal-value" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Stage</label>
          <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
            <SelectTrigger data-testid="select-deal-stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEAL_STAGES.map(s => (
                <SelectItem key={s} value={s}>{STAGE_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Deal Type</label>
          <Select value={form.dealType} onValueChange={v => setForm(f => ({ ...f, dealType: v }))}>
            <SelectTrigger data-testid="select-deal-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ad_campaign">Ad Campaign</SelectItem>
              <SelectItem value="sponsorship">Sponsorship</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Priority</label>
          <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
            <SelectTrigger data-testid="select-deal-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Probability (%)</label>
          <Input type="number" min="0" max="100" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} placeholder="50" data-testid="input-deal-probability" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Start Date</label>
          <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} data-testid="input-deal-start-date" />
        </div>
        <div>
          <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Close Date</label>
          <Input type="date" value={form.closeDate} onChange={e => setForm(f => ({ ...f, closeDate: e.target.value }))} data-testid="input-deal-close-date" />
        </div>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Podcast</label>
        <Select value={form.podcastId || "none"} onValueChange={v => setForm(f => ({ ...f, podcastId: v === "none" ? "" : v }))}>
          <SelectTrigger data-testid="select-deal-podcast">
            <SelectValue placeholder="Select a podcast" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Podcast</SelectItem>
            {podcasts.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1 block">Notes</label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Deal notes..." className="min-h-[60px]" data-testid="input-deal-notes" />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-save-deal">
          {initialData ? "Update Deal" : "Add Deal"}
        </Button>
        <Button variant="outline" onClick={onCancel} data-testid="button-cancel-deal">Cancel</Button>
      </div>
    </div>
  );
}

function CompanyDetail({ companyId, onBack }: { companyId: string; onBack: () => void }) {
  const { data: company, isLoading } = useCompany(companyId);
  const { data: contacts } = useContacts(companyId);
  const { data: deals } = useDeals(companyId);
  const [editing, setEditing] = useState(false);
  const updateCompany = useUpdateCompany();
  const { toast } = useToast();

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (!company) return <p className="text-muted-foreground">Company not found.</p>;

  const handleUpdate = async (data: any) => {
    try {
      await updateCompany.mutateAsync({ id: companyId, ...data });
      toast({ title: "Company Updated" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  if (editing) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="mb-4" data-testid="button-back-from-edit">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Profile
        </Button>
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-6">
            <CompanyForm onSubmit={handleUpdate} initialData={company} onCancel={() => setEditing(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[company.companyType] || {};

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2" data-testid="button-back-to-companies">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Companies
      </Button>

      <Card className="glass-panel border-border/50 overflow-hidden" data-testid="company-detail-card">
        <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
        <CardContent className="-mt-8 relative">
          <div className="flex items-end gap-4 mb-4">
            <div className="h-16 w-16 rounded-lg bg-primary/10 border-4 border-background shadow-xl ring-2 ring-primary/20 flex items-center justify-center overflow-hidden">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="h-full w-full object-contain" data-testid="img-company-logo" />
              ) : (
                <Building2 className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="flex-1 pb-1">
              <h2 className="text-xl font-bold font-display" data-testid="text-company-name">{company.name}</h2>
              {company.slogan && <p className="text-xs text-muted-foreground italic" data-testid="text-company-slogan">"{company.slogan}"</p>}
              <div className="flex items-center gap-2 mt-1">
                {company.industry && <span className="text-sm text-muted-foreground font-mono">{company.industry}</span>}
                <Badge variant="outline" className={cn("text-[10px] font-mono uppercase",
                  company.companyType === "advertiser" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                  company.companyType === "sponsor" && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                  company.companyType === "partner" && "bg-green-500/10 text-green-400 border-green-500/20",
                )}>
                  {COMPANY_TYPE_LABELS[company.companyType] || company.companyType}
                </Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit-company">
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          </div>

          {company.description && <p className="text-sm text-muted-foreground mb-3">{company.description}</p>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {company.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary/70" /> {company.email}
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary/70" /> {company.phone}
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4 text-primary/70" />
                <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary">{company.website}</a>
              </div>
            )}
            {(company.city || company.state) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary/70" /> {[company.city, company.state, company.country].filter(Boolean).join(", ")}
              </div>
            )}
            {company.annualRevenue && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4 text-primary/70" /> {formatCurrency(company.annualRevenue)} annual revenue
              </div>
            )}
            {company.employeeCount && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-primary/70" /> {company.employeeCount} employees
              </div>
            )}
            {company.timezone && (
              <div className="flex items-center gap-2 text-muted-foreground" data-testid="text-company-timezone">
                <Clock className="h-4 w-4 text-primary/70" /> {company.timezone}
              </div>
            )}
          </div>

          {company.brandColors && company.brandColors.length > 0 && (
            <div className="mt-3 flex items-center gap-2" data-testid="company-brand-colors">
              <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Brand:</span>
              {company.brandColors.map((color: string, i: number) => (
                <div key={i} className="flex items-center gap-1 px-1.5 py-0.5 bg-card/30 border border-border/50 rounded">
                  <div className="h-4 w-4 rounded-sm border border-border" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-mono text-muted-foreground">{color}</span>
                </div>
              ))}
            </div>
          )}

          {company.notes && (
            <div className="mt-4 p-3 bg-card/30 border border-border/50 rounded-sm">
              <div className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                <StickyNote className="h-3 w-3" /> Notes
              </div>
              <p className="text-sm text-muted-foreground">{company.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Contacts ({contacts?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contacts?.length > 0 ? (
            <div className="space-y-2">
              {contacts.map((c: any) => {
                const initials = ((c.firstName?.[0] || "") + (c.lastName?.[0] || "")).toUpperCase();
                return (
                  <div key={c.id} className="flex items-center gap-3 p-3 border border-border/50 rounded-sm bg-card/30" data-testid={`company-contact-${c.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-display">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{c.firstName} {c.lastName}</p>
                      <p className="text-xs text-muted-foreground">{c.title} {c.email && `• ${c.email}`}</p>
                    </div>
                    {c.isPrimary && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-mono">PRIMARY</Badge>}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No contacts linked to this company.</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            Deals ({deals?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deals?.length > 0 ? (
            <div className="space-y-2">
              {deals.map((d: any) => {
                const sc = STAGE_CONFIG[d.stage] || STAGE_CONFIG.lead;
                return (
                  <div key={d.id} className="flex items-center justify-between p-3 border border-border/50 rounded-sm bg-card/30" data-testid={`company-deal-${d.id}`}>
                    <div>
                      <p className="text-sm font-medium">{d.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={cn("text-[9px] font-mono", sc.bgColor, sc.color, sc.borderColor)}>
                          {sc.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{DEAL_TYPE_LABELS[d.dealType] || d.dealType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold font-display">{formatCurrency(d.value)}</p>
                      <p className="text-xs text-muted-foreground font-mono">{d.probability}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No deals linked to this company.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContactDetail({ contactId, companies, onBack }: { contactId: string; onBack: () => void; companies: any[] }) {
  const { data: allContacts } = useContacts();
  const contact = (allContacts || []).find((c: any) => c.id === contactId);
  const [editing, setEditing] = useState(false);
  const updateContact = useUpdateContact();
  const { toast } = useToast();

  if (!contact) return <p className="text-muted-foreground">Contact not found.</p>;

  const handleUpdate = async (data: any) => {
    try {
      await updateContact.mutateAsync({ id: contactId, ...data });
      toast({ title: "Contact Updated" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const initials = ((contact.firstName?.[0] || "") + (contact.lastName?.[0] || "")).toUpperCase() || "?";
  const companyName = companies.find((c: any) => c.id === contact.companyId)?.name;

  if (editing) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="mb-4" data-testid="button-back-from-edit">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Profile
        </Button>
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-6">
            <ContactForm onSubmit={handleUpdate} initialData={contact} companies={companies} onCancel={() => setEditing(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2" data-testid="button-back-to-contacts">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Contacts
      </Button>

      <Card className="glass-panel border-border/50 overflow-hidden" data-testid="contact-detail-card">
        <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent" />
        <CardContent className="-mt-8 relative">
          <div className="flex items-end gap-4 mb-4">
            <Avatar className="h-16 w-16 border-4 border-background shadow-xl ring-2 ring-primary/20">
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-display">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pb-1">
              <h2 className="text-xl font-bold font-display" data-testid="text-contact-name">
                {contact.firstName} {contact.lastName}
              </h2>
              {contact.title && <p className="text-sm text-muted-foreground font-mono">{contact.title}{companyName ? ` at ${companyName}` : ""}</p>}
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit-contact">
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          </div>

          {contact.bio && <p className="text-sm text-muted-foreground mb-3">{contact.bio}</p>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {contact.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary/70" /> {contact.email}
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary/70" /> {contact.phone}
              </div>
            )}
            {contact.department && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="h-4 w-4 text-primary/70" /> {contact.department}
              </div>
            )}
            {companyName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4 text-primary/70" /> {companyName}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-3">
            {contact.linkedinUrl && (
              <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-[#0A66C2] text-xs flex items-center gap-1 hover:underline">
                <Linkedin className="h-3 w-3" /> LinkedIn
              </a>
            )}
            {contact.twitterUrl && (
              <a href={contact.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 hover:underline text-muted-foreground">
                <Twitter className="h-3 w-3" /> X
              </a>
            )}
            {contact.facebookUrl && (
              <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-[#1877F2] text-xs flex items-center gap-1 hover:underline">
                <Facebook className="h-3 w-3" /> Facebook
              </a>
            )}
          </div>

          {contact.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {contact.tags.map((t: string) => (
                <Badge key={t} variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono">
                  <Tag className="h-2 w-2 mr-1" />{t}
                </Badge>
              ))}
            </div>
          )}

          {contact.isPrimary && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] font-mono mt-3">PRIMARY CONTACT</Badge>
          )}

          {contact.notes && (
            <div className="mt-4 p-3 bg-card/30 border border-border/50 rounded-sm">
              <div className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                <StickyNote className="h-3 w-3" /> Notes
              </div>
              <p className="text-sm text-muted-foreground">{contact.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DealDetail({ dealId, companies, contacts, onBack }: {
  dealId: string;
  companies: any[];
  contacts: any[];
  onBack: () => void;
}) {
  const { data: deal, isLoading } = useDeal(dealId);
  const { data: activities } = useDealActivities(dealId);
  const { data: podcasts } = usePodcasts();
  const updateDeal = useUpdateDeal();
  const createActivity = useCreateDealActivity();
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  const [actForm, setActForm] = useState({
    activityType: "note",
    title: "",
    description: "",
    fileUrl: "",
    contentStatus: "draft",
  });

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (!deal) return <p className="text-muted-foreground">Deal not found.</p>;

  const companyName = companies.find((c: any) => c.id === deal.companyId)?.name || "Unknown";
  const contactObj = contacts.find((c: any) => c.id === deal.contactId);
  const sc = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.lead;

  const handleUpdate = async (data: any) => {
    try {
      await updateDeal.mutateAsync({ id: dealId, ...data });
      toast({ title: "Deal Updated" });
      setEditing(false);
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleStageChange = async (newStage: string) => {
    try {
      await updateDeal.mutateAsync({ id: dealId, stage: newStage });
      toast({ title: "Stage Updated", description: `Deal moved to ${STAGE_CONFIG[newStage]?.label}` });
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleAddActivity = async () => {
    if (!actForm.title.trim()) {
      toast({ title: "Required", description: "Activity title is required.", variant: "destructive" });
      return;
    }
    try {
      await createActivity.mutateAsync({
        dealId,
        ...actForm,
        fileUrl: actForm.fileUrl || null,
        contentStatus: actForm.activityType === "content_upload" ? actForm.contentStatus : null,
      });
      toast({ title: "Activity Added" });
      setActForm({ activityType: "note", title: "", description: "", fileUrl: "", contentStatus: "draft" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  if (editing) {
    return (
      <div>
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="mb-4" data-testid="button-back-from-edit">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Deal
        </Button>
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-6">
            <DealForm
              onSubmit={handleUpdate}
              initialData={deal}
              companies={companies}
              contacts={contacts}
              podcasts={podcasts || []}
              onCancel={() => setEditing(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStageIdx = DEAL_STAGES.indexOf(deal.stage as any);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-2" data-testid="button-back-to-deals">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Pipeline
      </Button>

      <Card className="glass-panel border-border/50 overflow-hidden" data-testid="deal-detail-card">
        <div className={cn("h-16 bg-gradient-to-r to-transparent", sc.bgColor.replace("bg-", "from-"))} />
        <CardContent className="-mt-8 relative">
          <div className="flex items-end gap-4 mb-4">
            <div className={cn("h-16 w-16 rounded-lg border-4 border-background shadow-xl ring-2 ring-primary/20 flex items-center justify-center", sc.bgColor)}>
              <DollarSign className={cn("h-8 w-8", sc.color)} />
            </div>
            <div className="flex-1 pb-1">
              <h2 className="text-xl font-bold font-display" data-testid="text-deal-title">{deal.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground font-mono">{companyName}</span>
                <Badge variant="outline" className={cn("text-[10px] font-mono uppercase", sc.bgColor, sc.color, sc.borderColor)}>
                  {sc.label}
                </Badge>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={() => setEditing(true)} data-testid="button-edit-deal">
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-card/30 border border-border/50 rounded-sm text-center">
              <p className="text-xs font-mono uppercase text-muted-foreground">Value</p>
              <p className="text-xl font-bold font-display text-primary" data-testid="text-deal-value">{formatCurrency(deal.value)}</p>
            </div>
            <div className="p-3 bg-card/30 border border-border/50 rounded-sm text-center">
              <p className="text-xs font-mono uppercase text-muted-foreground">Probability</p>
              <p className="text-xl font-bold font-display" data-testid="text-deal-probability">{deal.probability}%</p>
            </div>
            <div className="p-3 bg-card/30 border border-border/50 rounded-sm text-center">
              <p className="text-xs font-mono uppercase text-muted-foreground">Type</p>
              <p className="text-sm font-semibold mt-1">{DEAL_TYPE_LABELS[deal.dealType] || deal.dealType}</p>
            </div>
          </div>

          {deal.description && <p className="text-sm text-muted-foreground mb-3">{deal.description}</p>}

          <div className="grid grid-cols-2 gap-4 text-sm">
            {contactObj && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 text-primary/70" /> {contactObj.firstName} {contactObj.lastName}
              </div>
            )}
            {deal.priority && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4 text-primary/70" /> Priority: {deal.priority}
              </div>
            )}
            {deal.startDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary/70" /> Start: {new Date(deal.startDate).toLocaleDateString()}
              </div>
            )}
            {deal.closeDate && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-primary/70" /> Close: {new Date(deal.closeDate).toLocaleDateString()}
              </div>
            )}
          </div>

          {deal.notes && (
            <div className="mt-4 p-3 bg-card/30 border border-border/50 rounded-sm">
              <div className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground mb-1">
                <StickyNote className="h-3 w-3" /> Notes
              </div>
              <p className="text-sm text-muted-foreground">{deal.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Pipeline Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {DEAL_STAGES.map((stage, idx) => {
              const stg = STAGE_CONFIG[stage];
              const isCurrent = deal.stage === stage;
              return (
                <Button
                  key={stage}
                  size="sm"
                  variant={isCurrent ? "default" : "outline"}
                  className={cn(
                    "text-xs font-mono",
                    isCurrent ? cn(stg.bgColor, stg.color, stg.borderColor, "border") : "border-border/50 text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => handleStageChange(stage)}
                  data-testid={`button-stage-${stage}`}
                >
                  {stage === "closed_won" && <CheckCircle className="h-3 w-3 mr-1" />}
                  {stage === "closed_lost" && <XCircle className="h-3 w-3 mr-1" />}
                  {stg.label}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel border-border/50">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Activity Timeline ({activities?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-border/50 rounded-sm p-4 bg-card/30 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Add Activity</h4>
            <div className="grid grid-cols-2 gap-3">
              <Select value={actForm.activityType} onValueChange={v => setActForm(f => ({ ...f, activityType: v }))}>
                <SelectTrigger data-testid="select-activity-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="content_upload">Content Upload</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Activity title"
                value={actForm.title}
                onChange={e => setActForm(f => ({ ...f, title: e.target.value }))}
                data-testid="input-activity-title"
              />
            </div>
            <Textarea
              placeholder="Description..."
              value={actForm.description}
              onChange={e => setActForm(f => ({ ...f, description: e.target.value }))}
              className="min-h-[60px]"
              data-testid="input-activity-description"
            />
            {actForm.activityType === "content_upload" && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="File URL"
                  value={actForm.fileUrl}
                  onChange={e => setActForm(f => ({ ...f, fileUrl: e.target.value }))}
                  data-testid="input-activity-file-url"
                />
                <Select value={actForm.contentStatus} onValueChange={v => setActForm(f => ({ ...f, contentStatus: v }))}>
                  <SelectTrigger data-testid="select-activity-content-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="live">Live</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={handleAddActivity}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={createActivity.isPending}
              data-testid="button-add-activity"
            >
              {createActivity.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
              Add Activity
            </Button>
          </div>

          {activities?.length > 0 ? (
            <div className="space-y-3">
              {activities.map((act: any) => {
                const Icon = ACTIVITY_ICONS[act.activityType] || StickyNote;
                return (
                  <div key={act.id} className="flex gap-3 p-3 border border-border/50 rounded-sm bg-card/30" data-testid={`activity-${act.id}`}>
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{act.title}</p>
                        <Badge variant="outline" className="text-[9px] font-mono bg-card/50 border-border/50">{act.activityType.replace("_", " ")}</Badge>
                        {act.contentStatus && (
                          <Badge variant="outline" className={cn("text-[9px] font-mono",
                            act.contentStatus === "live" && "bg-green-500/10 text-green-400 border-green-500/20",
                            act.contentStatus === "approved" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                            act.contentStatus === "review" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                            act.contentStatus === "draft" && "bg-gray-500/10 text-gray-400 border-gray-500/20",
                          )}>{act.contentStatus}</Badge>
                        )}
                      </div>
                      {act.description && <p className="text-xs text-muted-foreground mt-1">{act.description}</p>}
                      {act.fileUrl && (
                        <a href={act.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                          <Upload className="h-3 w-3" /> View File
                        </a>
                      )}
                      <p className="text-[10px] text-muted-foreground/60 font-mono mt-1">
                        {act.createdAt ? new Date(act.createdAt).toLocaleString() : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No activities yet. Add one above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CompaniesTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const { data: companies, isLoading } = useCompanies();
  const { data: contacts } = useContacts();
  const { data: deals } = useDeals();
  const createCompany = useCreateCompany();
  const deleteCompany = useDeleteCompany();
  const { toast } = useToast();

  const filteredCompanies = (companies || []).filter((c: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.name || "").toLowerCase().includes(term) ||
      (c.industry || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term)
    );
  });

  const handleCreate = async (data: any) => {
    try {
      await createCompany.mutateAsync(data);
      toast({ title: "Company Added" });
      setShowAddForm(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    try {
      await deleteCompany.mutateAsync(id);
      toast({ title: "Company Deleted" });
    } catch {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  if (selectedCompanyId) {
    return (
      <div className="animate-in fade-in duration-300">
        <CompanyDetail companyId={selectedCompanyId} onBack={() => setSelectedCompanyId(null)} />
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="animate-in fade-in duration-300">
        <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="mb-4" data-testid="button-back-from-add">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Companies
        </Button>
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-6">
            <CompanyForm onSubmit={handleCreate} onCancel={() => setShowAddForm(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies by name, industry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-companies"
          />
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-add-company">
          <Plus className="mr-2 h-3 w-3" />
          Add Company
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filteredCompanies.length > 0 ? (
        <div className="space-y-2">
          {filteredCompanies.map((co: any) => {
            const contactCount = (contacts || []).filter((c: any) => c.companyId === co.id).length;
            const dealCount = (deals || []).filter((d: any) => d.companyId === co.id).length;
            return (
              <Card
                key={co.id}
                className="glass-panel border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                data-testid={`company-card-${co.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20"
                      onClick={() => setSelectedCompanyId(co.id)}
                    >
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedCompanyId(co.id)}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors" data-testid={`text-company-name-${co.id}`}>
                          {co.name}
                        </p>
                        <Badge variant="outline" className={cn("text-[9px] font-mono uppercase",
                          co.companyType === "advertiser" && "bg-blue-500/10 text-blue-400 border-blue-500/20",
                          co.companyType === "sponsor" && "bg-purple-500/10 text-purple-400 border-purple-500/20",
                          co.companyType === "partner" && "bg-green-500/10 text-green-400 border-green-500/20",
                        )}>
                          {COMPANY_TYPE_LABELS[co.companyType] || co.companyType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                        {co.industry && <span>{co.industry}</span>}
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {contactCount} contacts</span>
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {dealCount} deals</span>
                        {co.annualRevenue && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" /> {formatCurrency(co.annualRevenue)}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDelete(co.id, co.name); }}
                        data-testid={`button-delete-company-${co.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass-panel border-border/50">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-display font-semibold text-muted-foreground mb-1">No Companies Yet</h3>
            <p className="text-sm text-muted-foreground/70 mb-4">Start building your commercial CRM by adding your first company.</p>
            <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-add-first-company">
              <Plus className="mr-2 h-4 w-4" /> Add First Company
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ContactsTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState<string | undefined>(undefined);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const { data: contacts, isLoading } = useContacts(filterCompany);
  const { data: companies } = useCompanies();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const { toast } = useToast();

  const filteredContacts = (contacts || []).filter((c: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.firstName || "").toLowerCase().includes(term) ||
      (c.lastName || "").toLowerCase().includes(term) ||
      (c.email || "").toLowerCase().includes(term) ||
      (c.title || "").toLowerCase().includes(term)
    );
  });

  const handleCreate = async (data: any) => {
    try {
      await createContact.mutateAsync(data);
      toast({ title: "Contact Added" });
      setShowAddForm(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    try {
      await deleteContact.mutateAsync(id);
      toast({ title: "Contact Removed" });
    } catch {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  if (selectedContactId) {
    return (
      <div className="animate-in fade-in duration-300">
        <ContactDetail contactId={selectedContactId} companies={companies || []} onBack={() => setSelectedContactId(null)} />
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="animate-in fade-in duration-300">
        <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="mb-4" data-testid="button-back-from-add-contact">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Contacts
        </Button>
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-6">
            <ContactForm onSubmit={handleCreate} companies={companies || []} onCancel={() => setShowAddForm(false)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts by name, email, title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-contacts"
          />
        </div>
        <Select value={filterCompany || "all"} onValueChange={(v) => setFilterCompany(v === "all" ? undefined : v)}>
          <SelectTrigger className="w-[220px]" data-testid="select-filter-company">
            <SelectValue placeholder="All Companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Companies</SelectItem>
            {(companies || []).map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-add-contact">
          <Plus className="mr-2 h-3 w-3" />
          Add Contact
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : filteredContacts.length > 0 ? (
        <div className="space-y-2">
          {filteredContacts.map((ct: any) => {
            const initials = ((ct.firstName?.[0] || "") + (ct.lastName?.[0] || "")).toUpperCase();
            const companyName = (companies || []).find((c: any) => c.id === ct.companyId)?.name;
            return (
              <Card
                key={ct.id}
                className="glass-panel border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                data-testid={`contact-card-${ct.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 shrink-0" onClick={() => setSelectedContactId(ct.id)}>
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-display">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedContactId(ct.id)}>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold group-hover:text-primary transition-colors" data-testid={`text-contact-name-${ct.id}`}>
                          {ct.firstName} {ct.lastName}
                        </p>
                        {ct.isPrimary && <Badge variant="outline" className="text-[9px] font-mono bg-primary/10 text-primary border-primary/20">PRIMARY</Badge>}
                        {ct.tags?.length > 0 && ct.tags.slice(0, 2).map((t: string) => (
                          <Badge key={t} variant="outline" className="text-[9px] font-mono bg-primary/5 text-primary border-primary/20">{t}</Badge>
                        ))}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                        {ct.title && <span>{ct.title}</span>}
                        {companyName && <span className="flex items-center gap-1"><Building className="h-3 w-3" /> {companyName}</span>}
                        {ct.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {ct.email}</span>}
                        {ct.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {ct.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ct.linkedinUrl && <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />}
                      {ct.twitterUrl && <Twitter className="h-3.5 w-3.5 text-muted-foreground" />}
                      {ct.facebookUrl && <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />}
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDelete(ct.id, `${ct.firstName} ${ct.lastName}`); }}
                        data-testid={`button-delete-contact-${ct.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="glass-panel border-border/50">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-display font-semibold text-muted-foreground mb-1">No Contacts Yet</h3>
            <p className="text-sm text-muted-foreground/70 mb-4">Add contacts to manage your commercial relationships.</p>
            <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-add-first-contact">
              <Plus className="mr-2 h-4 w-4" /> Add First Contact
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DealsTab() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const { data: deals, isLoading } = useDeals();
  const { data: companies } = useCompanies();
  const { data: contacts } = useContacts();
  const { data: podcasts } = usePodcasts();
  const createDeal = useCreateDeal();
  const deleteDeal = useDeleteDeal();
  const { toast } = useToast();

  const handleCreate = async (data: any) => {
    try {
      await createDeal.mutateAsync(data);
      toast({ title: "Deal Created" });
      setShowAddForm(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete deal "${title}"?`)) return;
    try {
      await deleteDeal.mutateAsync(id);
      toast({ title: "Deal Deleted" });
    } catch {
      toast({ title: "Delete Failed", variant: "destructive" });
    }
  };

  if (selectedDealId) {
    return (
      <div className="animate-in fade-in duration-300">
        <DealDetail dealId={selectedDealId} companies={companies || []} contacts={contacts || []} onBack={() => setSelectedDealId(null)} />
      </div>
    );
  }

  if (showAddForm) {
    return (
      <div className="animate-in fade-in duration-300">
        <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)} className="mb-4" data-testid="button-back-from-add-deal">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Pipeline
        </Button>
        <Card className="glass-panel border-border/50">
          <CardContent className="pt-6">
            <DealForm
              onSubmit={handleCreate}
              companies={companies || []}
              contacts={contacts || []}
              podcasts={podcasts || []}
              onCancel={() => setShowAddForm(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const dealsByStage = DEAL_STAGES.reduce((acc, stage) => {
    acc[stage] = (deals || []).filter((d: any) => d.stage === stage);
    return acc;
  }, {} as Record<string, any[]>);

  const totalValue = (deals || []).reduce((sum: number, d: any) => sum + (d.value || 0), 0);
  const wonValue = dealsByStage.closed_won.reduce((sum: number, d: any) => sum + (d.value || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground font-mono">
            <span className="text-foreground font-semibold">{(deals || []).length}</span> deals • Pipeline: <span className="text-primary font-semibold">{formatCurrency(totalValue)}</span> • Won: <span className="text-green-400 font-semibold">{formatCurrency(wonValue)}</span>
          </div>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-add-deal">
          <Plus className="mr-2 h-3 w-3" />
          Add Deal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-6 gap-3">
          {DEAL_STAGES.map(stage => {
            const sc = STAGE_CONFIG[stage];
            const stageDeals = dealsByStage[stage];
            const stageValue = stageDeals.reduce((s: number, d: any) => s + (d.value || 0), 0);
            return (
              <div key={stage} className="space-y-2" data-testid={`pipeline-column-${stage}`}>
                <div className={cn("p-2 rounded-sm border text-center", sc.bgColor, sc.borderColor)}>
                  <p className={cn("text-xs font-mono uppercase font-semibold", sc.color)}>{sc.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">{stageDeals.length} deals • {formatCurrency(stageValue)}</p>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {stageDeals.map((deal: any) => {
                    const companyName = (companies || []).find((c: any) => c.id === deal.companyId)?.name || "—";
                    return (
                      <Card
                        key={deal.id}
                        className="glass-panel border-border/50 hover:border-primary/30 transition-colors cursor-pointer group"
                        onClick={() => setSelectedDealId(deal.id)}
                        data-testid={`deal-card-${deal.id}`}
                      >
                        <CardContent className="p-3">
                          <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors" data-testid={`text-deal-title-${deal.id}`}>
                            {deal.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">{companyName}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-bold font-display text-primary">{formatCurrency(deal.value)}</span>
                            <Badge variant="outline" className="text-[8px] font-mono border-border/50">{DEAL_TYPE_LABELS[deal.dealType] || deal.dealType}</Badge>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center gap-1">
                              {deal.priority === "high" && <AlertCircle className="h-3 w-3 text-red-400" />}
                              {deal.priority === "medium" && <AlertCircle className="h-3 w-3 text-amber-400" />}
                              {deal.priority === "low" && <AlertCircle className="h-3 w-3 text-gray-400" />}
                              <span className="text-[10px] text-muted-foreground capitalize">{deal.priority}</span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-mono">{deal.probability}%</span>
                          </div>
                          <div className="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost" size="sm"
                              className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => { e.stopPropagation(); handleDelete(deal.id, deal.title); }}
                              data-testid={`button-delete-deal-${deal.id}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContactCampaignsTab() {
  const { data: campaigns, isLoading } = useOutboundCampaigns("contacts");
  const { data: podcasts } = usePodcasts();
  const createCampaign = useCreateOutboundCampaign();
  const deleteCampaign = useDeleteOutboundCampaign();
  const sendCampaign = useSendOutboundCampaign();
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ name: "", type: "email", subject: "", body: "", podcastFilter: "" });

  const handleCreate = async () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast({ title: "Required", description: "Name and body are required.", variant: "destructive" });
      return;
    }
    try {
      await createCampaign.mutateAsync({
        ...form,
        audience: "contacts",
        status: "draft",
        subject: form.type === "email" ? form.subject : undefined,
        podcastFilter: form.podcastFilter || undefined,
      });
      toast({ title: "Campaign Created" });
      setShowDialog(false);
      setForm({ name: "", type: "email", subject: "", body: "", podcastFilter: "" });
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleSend = async (id: string) => {
    if (!confirm("Send this campaign to all consented contacts?")) return;
    try {
      await sendCampaign.mutateAsync(id);
      toast({ title: "Campaign Sent" });
    } catch (err: any) {
      toast({ title: "Send Failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    try {
      await deleteCampaign.mutateAsync(id);
      toast({ title: "Campaign Deleted" });
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message, variant: "destructive" });
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "sent": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "sending": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "failed": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-muted text-muted-foreground border-border/50";
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-mono">{(campaigns || []).length} campaign{(campaigns || []).length !== 1 ? "s" : ""}</p>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-new-contact-campaign">
              <Plus className="h-3 w-3 mr-1" /> New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">Compose Campaign (Contacts)</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Campaign name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} data-testid="input-contact-campaign-name" />
              <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                <SelectTrigger data-testid="select-contact-campaign-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="email"><Mail className="h-3 w-3 inline mr-1" />Email</SelectItem>
                  <SelectItem value="sms"><MessageSquare className="h-3 w-3 inline mr-1" />SMS</SelectItem>
                </SelectContent>
              </Select>
              {form.type === "email" && (
                <Input placeholder="Subject line" value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} data-testid="input-contact-campaign-subject" />
              )}
              <Textarea placeholder="Message body..." rows={6} value={form.body} onChange={(e) => setForm(p => ({ ...p, body: e.target.value }))} data-testid="input-contact-campaign-body" />
              {podcasts && podcasts.length > 0 && (
                <Select value={form.podcastFilter || "all"} onValueChange={(v) => setForm(p => ({ ...p, podcastFilter: v === "all" ? "" : v }))}>
                  <SelectTrigger data-testid="select-contact-campaign-podcast"><SelectValue placeholder="All shows" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shows</SelectItem>
                    {podcasts.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={handleCreate} disabled={createCampaign.isPending} className="w-full bg-primary hover:bg-primary/90" data-testid="button-create-contact-campaign">
                {createCampaign.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                Create Draft
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (campaigns || []).length > 0 ? (
        <div className="space-y-3">
          {(campaigns || []).map((c: any) => (
            <Card key={c.id} className="glass-panel border-border/50 hover:border-primary/30 transition-colors" data-testid={`card-contact-campaign-${c.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-9 w-9 rounded-sm flex items-center justify-center", c.type === "sms" ? "bg-purple-500/10" : "bg-blue-500/10")}>
                      {c.type === "sms" ? <MessageSquare className="h-4 w-4 text-purple-400" /> : <Mail className="h-4 w-4 text-blue-400" />}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className={cn("text-[9px] font-mono", statusColor(c.status))}>{c.status}</Badge>
                        <Badge variant="outline" className="text-[9px] font-mono">{c.type}</Badge>
                        {c.subject && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{c.subject}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{c.recipientCount || 0} recipients</span>
                    {c.sentCount > 0 && <span className="text-green-400">{c.sentCount} sent</span>}
                    {c.failedCount > 0 && <span className="text-red-400">{c.failedCount} failed</span>}
                    {c.status === "draft" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleSend(c.id)} className="h-7 text-primary hover:text-primary/80" data-testid={`button-send-contact-campaign-${c.id}`}>
                          <Send className="h-3 w-3 mr-1" /> Send
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="h-7 text-destructive hover:text-destructive/80" data-testid={`button-delete-contact-campaign-${c.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-panel border-border/50">
          <CardContent className="py-12 text-center">
            <Send className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-display font-semibold text-muted-foreground mb-1">No Campaigns Yet</h3>
            <p className="text-sm text-muted-foreground/70 mb-4">Create your first outreach campaign to engage contacts.</p>
            <Button onClick={() => setShowDialog(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-first-contact-campaign">
              <Plus className="mr-2 h-4 w-4" /> Create First Campaign
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CommercialCRM() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Commercial CRM</h1>
        <p className="text-muted-foreground mt-1 font-mono text-sm">Pipeline Management | Deals & Partnerships</p>
      </div>

      <Tabs defaultValue="companies" className="w-full">
        <TabsList className="bg-card/50 border border-border/50" data-testid="crm-tabs">
          <TabsTrigger value="companies" className="font-mono text-xs uppercase tracking-wider data-[state=active]:text-primary" data-testid="tab-companies">
            <Building2 className="h-3 w-3 mr-1" /> Companies
          </TabsTrigger>
          <TabsTrigger value="contacts" className="font-mono text-xs uppercase tracking-wider data-[state=active]:text-primary" data-testid="tab-contacts">
            <Users className="h-3 w-3 mr-1" /> Contacts
          </TabsTrigger>
          <TabsTrigger value="deals" className="font-mono text-xs uppercase tracking-wider data-[state=active]:text-primary" data-testid="tab-deals">
            <Briefcase className="h-3 w-3 mr-1" /> Deals
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="font-mono text-xs uppercase tracking-wider data-[state=active]:text-primary" data-testid="tab-contact-campaigns">
            <Send className="h-3 w-3 mr-1" /> Campaigns
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <CompaniesTab />
        </TabsContent>
        <TabsContent value="contacts">
          <ContactsTab />
        </TabsContent>
        <TabsContent value="deals">
          <DealsTab />
        </TabsContent>
        <TabsContent value="campaigns">
          <ContactCampaignsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
