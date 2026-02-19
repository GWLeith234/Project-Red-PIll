import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import { useSettings, useUpdateSettings, useSocialAccounts, useCreateSocialAccount, useUpdateSocialAccount, useDeleteSocialAccount, usePodcasts, useBranding, useUpdateBranding, useAuditLogs, useApiKeys, useCreateApiKey, useRevokeApiKey, useDeleteApiKey } from "@/lib/api";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getIcon, searchIcons } from "@/lib/icon-resolver";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Globe, Zap, FileText, Bell, Shield, Wifi, WifiOff,
  Save, Loader2, AlertTriangle, Sparkles, MapPin, Upload, X,
  CheckCircle2, ArrowRight, Lightbulb, Facebook, Linkedin,
  Building2, Eye, EyeOff, Edit3, RefreshCw, Trash2, Radio, Image as ImageIcon,
  Key, Clock, Database, ScrollText, Copy, Plus, Ban, Mic,
  Search as SearchIcon, Hash, Mail, Volume2, VolumeX,
  Settings2, LayoutGrid, GripVertical, ChevronDown, ChevronRight,
  LayoutDashboard, DollarSign, BarChart3, Settings as SettingsIcon,
  Briefcase, ContactRound, Network, Send, CalendarClock, Scaling,
  Kanban, ListTodo, PanelLeft, Heart, Blocks, Factory, Paintbrush,
  Moon, Sun, Monitor, Check, FileIcon,
  type LucideIcon,
} from "lucide-react";

const TABS = [
  { id: "platform", label: "Platform Settings", icon: Settings2 },
  { id: "theme", label: "Theme", icon: Moon },
  { id: "page-config", label: "Page Configuration", icon: LayoutGrid },
] as const;

const TIMEZONES = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "America/Anchorage", "Pacific/Honolulu", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai", "Asia/Dubai",
  "Australia/Sydney", "Pacific/Auckland",
];

const DATE_FORMATS = ["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

const CONTENT_TYPE_OPTIONS = [
  { value: "video_clip", label: "Video Clips" },
  { value: "article", label: "Articles" },
  { value: "social_post", label: "Social Posts" },
  { value: "newsletter", label: "Newsletters" },
  { value: "seo_asset", label: "SEO Assets" },
];

const PLATFORM_OPTIONS = [
  { value: "TikTok", label: "TikTok" },
  { value: "Reels", label: "Instagram Reels" },
  { value: "Shorts", label: "YouTube Shorts" },
  { value: "X", label: "X" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Facebook", label: "Facebook" },
  { value: "Pinterest", label: "Pinterest" },
];

const AI_QUALITY_OPTIONS = [
  { value: "fast", label: "Fast", desc: "Lower quality, faster processing" },
  { value: "balanced", label: "Balanced", desc: "Good quality with reasonable speed" },
  { value: "premium", label: "Premium", desc: "Highest quality, slower processing" },
];

const CONTENT_TONE_OPTIONS = [
  { value: "professional", label: "Professional", desc: "Formal, authoritative tone for business audiences" },
  { value: "conversational", label: "Conversational", desc: "Friendly, approachable tone for general audiences" },
  { value: "academic", label: "Academic", desc: "Research-focused, data-driven tone" },
  { value: "edgy", label: "Edgy / Bold", desc: "Provocative, attention-grabbing tone" },
];

const SOCIAL_POST_LENGTH_OPTIONS = [
  { value: "short", label: "Short (< 100 chars)" },
  { value: "medium", label: "Medium (100-200 chars)" },
  { value: "long", label: "Long (200-300 chars)" },
];

const TRANSCRIPTION_LANG_OPTIONS = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "pt", label: "Portuguese" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
];

const SEO_DENSITY_OPTIONS = [
  { value: "light", label: "Light", desc: "Natural language, minimal keyword focus" },
  { value: "moderate", label: "Moderate", desc: "Balanced keyword placement for good ranking" },
  { value: "aggressive", label: "Aggressive", desc: "Heavy keyword optimization for maximum SEO" },
];

const NEWSLETTER_FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
];

const PASSWORD_EXPIRY_OPTIONS = [
  { value: 0, label: "Never" },
  { value: 30, label: "30 Days" },
  { value: 60, label: "60 Days" },
  { value: 90, label: "90 Days" },
  { value: 180, label: "180 Days" },
  { value: 365, label: "1 Year" },
];

const DATA_RETENTION_OPTIONS = [
  { value: 90, label: "90 Days" },
  { value: 180, label: "180 Days" },
  { value: 365, label: "1 Year" },
  { value: 730, label: "2 Years" },
  { value: 1825, label: "5 Years" },
  { value: 0, label: "Indefinite" },
];

const ALERT_THRESHOLD_OPTIONS = [
  { value: "all", label: "All Alerts" },
  { value: "important", label: "Important Only" },
  { value: "critical", label: "Critical Only" },
  { value: "none", label: "None" },
];

const SESSION_TIMEOUT_OPTIONS = [
  { value: 60, label: "1 Hour" },
  { value: 480, label: "8 Hours" },
  { value: 1440, label: "1 Day" },
  { value: 10080, label: "7 Days" },
  { value: 43200, label: "30 Days" },
];

function SectionHeader({ icon: Icon, title, description }: { icon: any; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="h-10 w-10 border border-primary/30 bg-primary/5 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-lg font-display font-bold text-primary uppercase tracking-wider" data-testid={`text-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
          {title}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange, testId, disabled }: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  testId: string;
  disabled?: boolean;
}) {
  return (
    <div data-testid={testId}>
      <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid={`select-${testId}`}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ToggleField({ label, description, checked, onChange, testId, disabled }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  testId: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border/50 last:border-0" data-testid={testId}>
      <div>
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative w-11 h-6 rounded-sm transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-muted'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        data-testid={`toggle-${testId}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 bg-background border border-border transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

function CheckboxGroup({ label, options, selected, onChange, testId, disabled }: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  testId: string;
  disabled?: boolean;
}) {
  const toggle = (val: string) => {
    if (disabled) return;
    if (selected.includes(val)) {
      onChange(selected.filter(s => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  return (
    <div data-testid={testId}>
      <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">{label}</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(o => (
          <label
            key={o.value}
            className={`flex items-center gap-2 px-3 py-2 border transition-colors text-sm ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
              selected.includes(o.value)
                ? 'border-primary/50 bg-primary/5 text-foreground'
                : 'border-border bg-card/30 text-muted-foreground hover:border-border/80'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
              disabled={disabled}
              className="sr-only"
              data-testid={`checkbox-${testId}-${o.value}`}
            />
            <span className={`h-4 w-4 border flex items-center justify-center flex-shrink-0 ${
              selected.includes(o.value) ? 'border-primary bg-primary' : 'border-muted-foreground'
            }`}>
              {selected.includes(o.value) && <span className="text-background text-xs font-bold">✓</span>}
            </span>
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function RadioGroup({ label, options, value, onChange, testId, disabled }: {
  label: string;
  options: { value: string; label: string; desc?: string }[];
  value: string;
  onChange: (v: string) => void;
  testId: string;
  disabled?: boolean;
}) {
  return (
    <div data-testid={testId}>
      <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">{label}</label>
      <div className="space-y-2">
        {options.map(o => (
          <label
            key={o.value}
            className={`flex items-start gap-3 px-3 py-2.5 border transition-colors ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${
              value === o.value
                ? 'border-primary/50 bg-primary/5'
                : 'border-border bg-card/30 hover:border-border/80'
            }`}
          >
            <input
              type="radio"
              checked={value === o.value}
              onChange={() => !disabled && onChange(o.value)}
              disabled={disabled}
              className="sr-only"
              data-testid={`radio-${testId}-${o.value}`}
            />
            <span className={`h-4 w-4 rounded-full border flex items-center justify-center flex-shrink-0 mt-0.5 ${
              value === o.value ? 'border-primary' : 'border-muted-foreground'
            }`}>
              {value === o.value && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <div>
              <span className="text-sm font-medium text-foreground">{o.label}</span>
              {o.desc && <p className="text-xs text-muted-foreground mt-0.5">{o.desc}</p>}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<string>("platform");
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: branding, isLoading: brandingLoading } = useBranding();
  const updateBranding = useUpdateBranding();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEdit = hasPermission("settings.edit");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartReasons, setSmartReasons] = useState<Record<string, string>>({});
  const [smartApplied, setSmartApplied] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);

  const [form, setForm] = useState({
    companyLocation: "",
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    defaultLanguage: "en",
    autoPublishContent: false,
    contentTypes: ["video_clip", "article", "social_post", "newsletter", "seo_asset"],
    defaultPlatforms: ["TikTok", "Reels", "Shorts", "X", "LinkedIn"],
    aiQuality: "balanced",
    contentTone: "professional",
    articleWordCount: 800,
    socialPostLength: "medium",
    maxClipDuration: 60,
    transcriptionLanguage: "auto",
    seoKeywordDensity: "moderate",
    newsletterFrequency: "weekly",
    contentApprovalRequired: true,
    emailNotifications: true,
    alertThreshold: "all",
    weeklyDigest: true,
    revenueAlerts: true,
    processingAlerts: true,
    crmAlerts: true,
    systemAlerts: true,
    pushNotifications: false,
    quietHoursEnabled: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    notificationDigestTime: "09:00",
    sessionTimeoutMinutes: 10080,
    maxLoginAttempts: 5,
    requireStrongPasswords: true,
    twoFactorEnabled: false,
    passwordExpiryDays: 0,
    ipAllowlist: "",
    auditLogEnabled: true,
    dataRetentionDays: 365,
    apiKeysEnabled: false,
  });

  useEffect(() => {
    if (branding) {
      setCompanyName(branding.companyName || "");
      setLogoUrl(branding.logoUrl || "");
    }
  }, [branding]);

  useEffect(() => {
    if (settings) {
      setForm({
        companyLocation: settings.companyLocation || "",
        timezone: settings.timezone || "America/New_York",
        dateFormat: settings.dateFormat || "MM/DD/YYYY",
        defaultLanguage: settings.defaultLanguage || "en",
        autoPublishContent: settings.autoPublishContent ?? false,
        contentTypes: settings.contentTypes || ["video_clip", "article", "social_post", "newsletter", "seo_asset"],
        defaultPlatforms: (settings.defaultPlatforms || ["TikTok", "Reels", "Shorts", "X", "LinkedIn"]).map((p: string) => p === "Twitter" ? "X" : p === "Twitter/X" ? "X" : p),
        aiQuality: settings.aiQuality || "balanced",
        contentTone: settings.contentTone || "professional",
        articleWordCount: settings.articleWordCount ?? 800,
        socialPostLength: settings.socialPostLength || "medium",
        maxClipDuration: settings.maxClipDuration ?? 60,
        transcriptionLanguage: settings.transcriptionLanguage || "auto",
        seoKeywordDensity: settings.seoKeywordDensity || "moderate",
        newsletterFrequency: settings.newsletterFrequency || "weekly",
        contentApprovalRequired: settings.contentApprovalRequired ?? true,
        emailNotifications: settings.emailNotifications ?? true,
        alertThreshold: settings.alertThreshold || "all",
        weeklyDigest: settings.weeklyDigest ?? true,
        revenueAlerts: settings.revenueAlerts ?? true,
        processingAlerts: settings.processingAlerts ?? true,
        crmAlerts: settings.crmAlerts ?? true,
        systemAlerts: settings.systemAlerts ?? true,
        pushNotifications: settings.pushNotifications ?? false,
        quietHoursEnabled: settings.quietHoursEnabled ?? false,
        quietHoursStart: settings.quietHoursStart || "22:00",
        quietHoursEnd: settings.quietHoursEnd || "07:00",
        notificationDigestTime: settings.notificationDigestTime || "09:00",
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes ?? 10080,
        maxLoginAttempts: settings.maxLoginAttempts ?? 5,
        requireStrongPasswords: settings.requireStrongPasswords ?? true,
        twoFactorEnabled: settings.twoFactorEnabled ?? false,
        passwordExpiryDays: settings.passwordExpiryDays ?? 0,
        ipAllowlist: settings.ipAllowlist || "",
        auditLogEnabled: settings.auditLogEnabled ?? true,
        dataRetentionDays: settings.dataRetentionDays ?? 365,
        apiKeysEnabled: settings.apiKeysEnabled ?? false,
      });
    }
  }, [settings]);

  const handleSaveBranding = () => {
    if (!canEdit) return;
    updateBranding.mutate({ companyName, logoUrl }, {
      onSuccess: () => {
        toast({ title: "Branding Saved", description: "Company name and logo have been updated." });
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    setLogoUploading(true);
    try {
      const urlRes = await fetch("/api/uploads/request-url", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();
      const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const newLogoUrl = objectPath;
      setLogoUrl(newLogoUrl);
      updateBranding.mutate({ companyName, logoUrl: newLogoUrl }, {
        onSuccess: () => toast({ title: "Logo Updated", description: "Your logo has been uploaded and saved." }),
      });
    } catch (err: any) {
      toast({ title: "Upload Error", description: err.message, variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = () => {
    if (!canEdit) return;
    updateSettings.mutate(form, {
      onSuccess: () => {
        toast({ title: "Settings Saved", description: "Platform settings have been updated." });
        setSmartApplied(false);
        setSmartReasons({});
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
    });
  };

  const handleSmartDefaults = async () => {
    setSmartLoading(true);
    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const browserLanguage = navigator.language;
      const res = await fetch("/api/settings/smart-defaults", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyLocation: form.companyLocation,
          browserTimezone,
          browserLanguage,
        }),
      });
      if (!res.ok) throw new Error("Failed to get smart defaults");
      const { settings: smart, reasons } = await res.json();
      setForm(f => ({
        ...f,
        timezone: smart.timezone,
        dateFormat: smart.dateFormat,
        defaultLanguage: smart.defaultLanguage,
        defaultPlatforms: smart.defaultPlatforms,
        contentTypes: smart.contentTypes,
        aiQuality: smart.aiQuality,
        alertThreshold: smart.alertThreshold,
        autoPublishContent: smart.autoPublishContent,
      }));
      setSmartReasons(reasons);
      setSmartApplied(true);
      toast({ title: "Smart Defaults Applied", description: "Settings have been optimized. Review and save to confirm." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSmartLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  function SmartBadge({ field }: { field: string }) {
    if (!smartApplied || !smartReasons[field]) return null;
    return (
      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-emerald-400 font-mono animate-in fade-in slide-in-from-left-2 duration-300">
        <Sparkles className="h-3 w-3" />
        <span>{smartReasons[field]}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      <PageHeader pageKey="settings" onPrimaryAction={canEdit ? handleSave : undefined} />

      <div className="flex items-center gap-1 border-b border-border -mt-2 mb-4 overflow-x-auto" data-testid="settings-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors whitespace-nowrap border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "theme" && <ThemeSettingsTab canEdit={canEdit} />}

      {activeTab === "page-config" && <PageConfigurationTab />}

      {activeTab === "platform" && <>
      <div className="flex items-center gap-3 flex-shrink-0 justify-end -mt-4 mb-4">
        {canEdit && (
          <button
            onClick={handleSmartDefaults}
            disabled={smartLoading}
            className="flex items-center gap-2 bg-card border border-primary/30 text-primary px-4 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-primary/10 transition-colors disabled:opacity-50"
            data-testid="button-smart-defaults"
          >
            {smartLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Smart Defaults
          </button>
        )}
        {canEdit && (
          <button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="button-save-settings"
          >
            {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        )}
      </div>

      {!canEdit && (
        <div className="border border-primary/30 bg-primary/5 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-primary flex-shrink-0" />
          <p className="text-sm text-muted-foreground">You have view-only access to settings. Contact an administrator to make changes.</p>
        </div>
      )}

      {smartApplied && (
        <div className="border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300" data-testid="smart-defaults-banner">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-emerald-400 font-medium">Smart defaults applied</p>
            <p className="text-xs text-muted-foreground mt-0.5">Settings have been optimized based on your location, browser, and connected accounts. Review the changes below and click <strong>Save Changes</strong> to confirm.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card/50 p-4 sm:p-6 space-y-5" data-testid="section-general">
          <SectionHeader icon={Globe} title="General" description="Company identity and regional preferences" />

          <div data-testid="company-name">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3" />
                Company Name
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. MediaTech Empire"
                disabled={!canEdit}
                className="flex-1 bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground/50"
                data-testid="input-company-name"
              />
              {canEdit && companyName !== (branding?.companyName || "") && (
                <button
                  onClick={handleSaveBranding}
                  disabled={updateBranding.isPending}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-mono uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50"
                  data-testid="button-save-company-name"
                >
                  {updateBranding.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Save
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Displayed in the sidebar, emails, and public pages</p>
          </div>

          <div data-testid="company-logo">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" />
                Company Logo
              </span>
            </label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <div className="relative group">
                  <div className="h-16 w-40 border border-border bg-background flex items-center justify-center p-2">
                    <img src={logoUrl} alt="Company logo" className="max-h-full max-w-full object-contain" />
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setLogoUrl("");
                        updateBranding.mutate({ companyName, logoUrl: "" }, {
                          onSuccess: () => toast({ title: "Logo Removed" }),
                        });
                      }}
                      className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      data-testid="button-remove-logo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="h-16 w-40 border border-dashed border-muted-foreground/30 bg-background/50 flex items-center justify-center text-muted-foreground/50">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              {canEdit && (
                <label className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border text-muted-foreground text-xs font-mono uppercase tracking-wider hover:border-primary/30 hover:text-foreground transition-colors cursor-pointer">
                  {logoUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {logoUploading ? "Uploading..." : "Upload Logo"}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" data-testid="input-logo-upload" />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recommended: PNG or SVG, at least 200px wide</p>
          </div>

          <div data-testid="company-location">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3" />
                Company Location
              </span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.companyLocation}
                onChange={(e) => setForm(f => ({ ...f, companyLocation: e.target.value }))}
                placeholder="e.g. New York, USA"
                disabled={!canEdit}
                className="flex-1 bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground/50"
                data-testid="input-company-location"
              />
              {canEdit && form.companyLocation && (
                <button
                  onClick={handleSmartDefaults}
                  disabled={smartLoading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-mono uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50"
                  data-testid="button-detect-location"
                >
                  {smartLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
                  Detect
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Used to auto-detect timezone, date format, and language</p>
          </div>

          <div>
            <SelectField
              label="Timezone"
              value={form.timezone}
              options={TIMEZONES.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
              onChange={(v) => setForm(f => ({ ...f, timezone: v }))}
              testId="timezone"
              disabled={!canEdit}
            />
            <SmartBadge field="timezone" />
          </div>
          <div>
            <SelectField
              label="Date Format"
              value={form.dateFormat}
              options={DATE_FORMATS.map(df => ({ value: df, label: df }))}
              onChange={(v) => setForm(f => ({ ...f, dateFormat: v }))}
              testId="date-format"
              disabled={!canEdit}
            />
            <SmartBadge field="dateFormat" />
          </div>
          <div>
            <SelectField
              label="Default Language"
              value={form.defaultLanguage}
              options={LANGUAGES}
              onChange={(v) => setForm(f => ({ ...f, defaultLanguage: v }))}
              testId="language"
              disabled={!canEdit}
            />
            <SmartBadge field="defaultLanguage" />
          </div>
        </div>

        <div className="border border-border bg-card/50 p-4 sm:p-6 space-y-5" data-testid="section-content-pipeline">
          <SectionHeader icon={Zap} title="Content Pipeline" description="AI content generation and processing defaults" />

          <div>
            <RadioGroup
              label="AI Processing Quality"
              options={AI_QUALITY_OPTIONS}
              value={form.aiQuality}
              onChange={(v) => setForm(f => ({ ...f, aiQuality: v }))}
              testId="ai-quality"
              disabled={!canEdit}
            />
            <SmartBadge field="aiQuality" />
          </div>

          <div>
            <RadioGroup
              label="Content Tone & Style"
              options={CONTENT_TONE_OPTIONS}
              value={form.contentTone}
              onChange={(v) => setForm(f => ({ ...f, contentTone: v }))}
              testId="content-tone"
              disabled={!canEdit}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-testid="article-word-count">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">
                <span className="flex items-center gap-1.5"><FileText className="h-3 w-3" />Article Word Count</span>
              </label>
              <select
                value={form.articleWordCount}
                onChange={(e) => setForm(f => ({ ...f, articleWordCount: parseInt(e.target.value) }))}
                disabled={!canEdit}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="select-article-word-count"
              >
                {[400, 600, 800, 1000, 1200, 1500, 2000].map(n => (
                  <option key={n} value={n}>{n} words</option>
                ))}
              </select>
            </div>

            <div data-testid="max-clip-duration">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">
                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />Max Clip Duration</span>
              </label>
              <select
                value={form.maxClipDuration}
                onChange={(e) => setForm(f => ({ ...f, maxClipDuration: parseInt(e.target.value) }))}
                disabled={!canEdit}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="select-max-clip-duration"
              >
                {[15, 30, 45, 60, 90, 120, 180].map(n => (
                  <option key={n} value={n}>{n < 60 ? `${n}s` : `${Math.floor(n/60)}m${n%60 ? ` ${n%60}s` : ""}`}</option>
                ))}
              </select>
            </div>
          </div>

          <SelectField
            label="Social Post Length"
            value={form.socialPostLength}
            options={SOCIAL_POST_LENGTH_OPTIONS}
            onChange={(v) => setForm(f => ({ ...f, socialPostLength: v }))}
            testId="social-post-length"
            disabled={!canEdit}
          />

          <SelectField
            label="Transcription Language"
            value={form.transcriptionLanguage}
            options={TRANSCRIPTION_LANG_OPTIONS}
            onChange={(v) => setForm(f => ({ ...f, transcriptionLanguage: v }))}
            testId="transcription-language"
            disabled={!canEdit}
          />

          <div className="space-y-0">
            <ToggleField
              label="Auto-Publish Content"
              description="Automatically publish generated content when processing completes"
              checked={form.autoPublishContent}
              onChange={(v) => setForm(f => ({ ...f, autoPublishContent: v }))}
              testId="auto-publish"
              disabled={!canEdit}
            />
            <ToggleField
              label="Require Content Approval"
              description="Route all AI-generated content through moderation queue before publishing"
              checked={form.contentApprovalRequired}
              onChange={(v) => setForm(f => ({ ...f, contentApprovalRequired: v }))}
              testId="content-approval"
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="border border-border bg-card/50 p-4 sm:p-6 space-y-5" data-testid="section-content-types">
          <SectionHeader icon={FileText} title="Content & SEO" description="Content types, SEO, and distribution" />

          <div>
            <CheckboxGroup
              label="Enabled Content Types"
              options={CONTENT_TYPE_OPTIONS}
              selected={form.contentTypes}
              onChange={(v) => setForm(f => ({ ...f, contentTypes: v }))}
              testId="content-types"
              disabled={!canEdit}
            />
            <SmartBadge field="contentTypes" />
          </div>

          <div>
            <CheckboxGroup
              label="Distribution Platforms"
              options={PLATFORM_OPTIONS}
              selected={form.defaultPlatforms}
              onChange={(v) => setForm(f => ({ ...f, defaultPlatforms: v }))}
              testId="platforms"
              disabled={!canEdit}
            />
            <SmartBadge field="defaultPlatforms" />
          </div>

          <div>
            <RadioGroup
              label="SEO Keyword Density"
              options={SEO_DENSITY_OPTIONS}
              value={form.seoKeywordDensity}
              onChange={(v) => setForm(f => ({ ...f, seoKeywordDensity: v }))}
              testId="seo-density"
              disabled={!canEdit}
            />
          </div>

          <SelectField
            label="Newsletter Frequency"
            value={form.newsletterFrequency}
            options={NEWSLETTER_FREQUENCY_OPTIONS}
            onChange={(v) => setForm(f => ({ ...f, newsletterFrequency: v }))}
            testId="newsletter-frequency"
            disabled={!canEdit}
          />
        </div>

        <div className="border border-border bg-card/50 p-4 sm:p-6 space-y-5" data-testid="section-notifications">
          <SectionHeader icon={Bell} title="Notifications" description="Alert preferences and delivery settings" />

          <div>
            <SelectField
              label="Alert Level"
              value={form.alertThreshold}
              options={ALERT_THRESHOLD_OPTIONS}
              onChange={(v) => setForm(f => ({ ...f, alertThreshold: v }))}
              testId="alert-threshold"
              disabled={!canEdit}
            />
            <SmartBadge field="alertThreshold" />
          </div>

          <div className="space-y-0">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Alert Categories</label>
            <ToggleField
              label="Email Notifications"
              description="Receive email alerts for important platform events"
              checked={form.emailNotifications}
              onChange={(v) => setForm(f => ({ ...f, emailNotifications: v }))}
              testId="email-notifications"
              disabled={!canEdit}
            />
            <ToggleField
              label="Revenue Alerts"
              description="Revenue thresholds reached or anomalies detected"
              checked={form.revenueAlerts}
              onChange={(v) => setForm(f => ({ ...f, revenueAlerts: v }))}
              testId="revenue-alerts"
              disabled={!canEdit}
            />
            <ToggleField
              label="Processing Alerts"
              description="Content processing completion or error notifications"
              checked={form.processingAlerts}
              onChange={(v) => setForm(f => ({ ...f, processingAlerts: v }))}
              testId="processing-alerts"
              disabled={!canEdit}
            />
            <ToggleField
              label="CRM Alerts"
              description="Deal updates, new contacts, and campaign status changes"
              checked={form.crmAlerts}
              onChange={(v) => setForm(f => ({ ...f, crmAlerts: v }))}
              testId="crm-alerts"
              disabled={!canEdit}
            />
            <ToggleField
              label="System Alerts"
              description="Security events, login failures, and system health warnings"
              checked={form.systemAlerts}
              onChange={(v) => setForm(f => ({ ...f, systemAlerts: v }))}
              testId="system-alerts"
              disabled={!canEdit}
            />
          </div>

          <div className="border-t border-border/50 pt-4 space-y-3">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block">Delivery Preferences</label>
            <ToggleField
              label="Weekly Digest"
              description="Receive a weekly summary of platform activity and metrics"
              checked={form.weeklyDigest}
              onChange={(v) => setForm(f => ({ ...f, weeklyDigest: v }))}
              testId="weekly-digest"
              disabled={!canEdit}
            />
            <ToggleField
              label="Push Notifications"
              description="Receive browser push notifications for urgent alerts"
              checked={form.pushNotifications}
              onChange={(v) => setForm(f => ({ ...f, pushNotifications: v }))}
              testId="push-notifications"
              disabled={!canEdit}
            />

            <div className="flex items-center gap-3 py-3 border-b border-border/50">
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  {form.quietHoursEnabled ? <VolumeX className="h-4 w-4 text-primary" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
                  Quiet Hours
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">Pause non-critical notifications during set hours</p>
              </div>
              <button
                onClick={() => !canEdit ? null : setForm(f => ({ ...f, quietHoursEnabled: !f.quietHoursEnabled }))}
                disabled={!canEdit}
                className={`relative w-11 h-6 rounded-sm transition-colors flex-shrink-0 ${form.quietHoursEnabled ? 'bg-primary' : 'bg-muted'} ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                data-testid="toggle-quiet-hours"
              >
                <span className={`absolute top-0.5 h-5 w-5 bg-background border border-border transition-transform ${form.quietHoursEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {form.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div>
                  <label className="text-xs text-muted-foreground font-mono block mb-1">Start</label>
                  <input
                    type="time"
                    value={form.quietHoursStart}
                    onChange={(e) => setForm(f => ({ ...f, quietHoursStart: e.target.value }))}
                    disabled={!canEdit}
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                    data-testid="input-quiet-start"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-mono block mb-1">End</label>
                  <input
                    type="time"
                    value={form.quietHoursEnd}
                    onChange={(e) => setForm(f => ({ ...f, quietHoursEnd: e.target.value }))}
                    disabled={!canEdit}
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                    data-testid="input-quiet-end"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground font-mono block mb-1">Digest Delivery Time</label>
              <input
                type="time"
                value={form.notificationDigestTime}
                onChange={(e) => setForm(f => ({ ...f, notificationDigestTime: e.target.value }))}
                disabled={!canEdit}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                data-testid="input-digest-time"
              />
              <p className="text-[10px] text-muted-foreground mt-1">When to send daily/weekly digest emails</p>
            </div>
          </div>
        </div>

        <SocialConnectionsSection canEdit={canEdit} />

        <div className="border border-border bg-card/50 p-4 sm:p-6 space-y-5 lg:col-span-2" data-testid="section-security">
          <SectionHeader icon={Shield} title="Security" description="Authentication, access control, and data policies" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <SelectField
                label="Session Timeout"
                value={String(form.sessionTimeoutMinutes)}
                options={SESSION_TIMEOUT_OPTIONS.map(o => ({ value: String(o.value), label: o.label }))}
                onChange={(v) => setForm(f => ({ ...f, sessionTimeoutMinutes: parseInt(v) }))}
                testId="session-timeout"
                disabled={!canEdit}
              />

              <div data-testid="max-login-attempts">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">Max Login Attempts</label>
                <select
                  value={form.maxLoginAttempts}
                  onChange={(e) => setForm(f => ({ ...f, maxLoginAttempts: parseInt(e.target.value) }))}
                  disabled={!canEdit}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="select-max-login-attempts"
                >
                  {[3, 5, 10, 15, 20].map(n => (
                    <option key={n} value={n}>{n} attempts</option>
                  ))}
                </select>
              </div>

              <SelectField
                label="Password Expiry"
                value={String(form.passwordExpiryDays)}
                options={PASSWORD_EXPIRY_OPTIONS.map(o => ({ value: String(o.value), label: o.label }))}
                onChange={(v) => setForm(f => ({ ...f, passwordExpiryDays: parseInt(v) }))}
                testId="password-expiry"
                disabled={!canEdit}
              />

              <SelectField
                label="Data Retention Period"
                value={String(form.dataRetentionDays)}
                options={DATA_RETENTION_OPTIONS.map(o => ({ value: String(o.value), label: o.label }))}
                onChange={(v) => setForm(f => ({ ...f, dataRetentionDays: parseInt(v) }))}
                testId="data-retention"
                disabled={!canEdit}
              />
            </div>

            <div className="space-y-0">
              <ToggleField
                label="Require Strong Passwords"
                description="Enforce minimum 8 characters with uppercase, lowercase, numbers, and symbols"
                checked={form.requireStrongPasswords}
                onChange={(v) => setForm(f => ({ ...f, requireStrongPasswords: v }))}
                testId="strong-passwords"
                disabled={!canEdit}
              />
              <ToggleField
                label="Two-Factor Authentication"
                description="Require 2FA for all user accounts"
                checked={form.twoFactorEnabled}
                onChange={(v) => setForm(f => ({ ...f, twoFactorEnabled: v }))}
                testId="two-factor"
                disabled={!canEdit}
              />
              <ToggleField
                label="Audit Logging"
                description="Track all user actions and system events for compliance"
                checked={form.auditLogEnabled}
                onChange={(v) => setForm(f => ({ ...f, auditLogEnabled: v }))}
                testId="audit-log-enabled"
                disabled={!canEdit}
              />
              <ToggleField
                label="API Key Access"
                description="Allow programmatic access via API keys"
                checked={form.apiKeysEnabled}
                onChange={(v) => setForm(f => ({ ...f, apiKeysEnabled: v }))}
                testId="api-keys-enabled"
                disabled={!canEdit}
              />

              <div className="pt-3">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">
                  <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" />IP Allowlist</span>
                </label>
                <textarea
                  value={form.ipAllowlist}
                  onChange={(e) => setForm(f => ({ ...f, ipAllowlist: e.target.value }))}
                  placeholder="Enter IP addresses, one per line (leave empty to allow all)"
                  disabled={!canEdit}
                  rows={3}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground/50 resize-none"
                  data-testid="input-ip-allowlist"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Restrict admin access to specific IP addresses</p>
              </div>
            </div>
          </div>
        </div>

        {form.apiKeysEnabled && <ApiKeyManagement canEdit={canEdit} />}

        <AuditLogViewer />
      </div>
      </>}
    </div>
  );
}


type PageCfg = {
  pageKey: string;
  title: string;
  description: string | null;
  iconName: string;
  route: string;
  permission: string;
  navSection: string | null;
  sortOrder: number;
  isVisible: boolean | null;
  primaryActionLabel: string | null;
  aiActionLabel: string | null;
};

function ThemeSettingsTab({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const { mode, setTheme, theme } = useTheme();
  const { data: branding } = useBranding();
  const updateBranding = useUpdateBranding();
  const [selectedMode, setSelectedMode] = useState<"light" | "dark" | "system">(mode);

  useEffect(() => {
    setSelectedMode(mode);
  }, [mode]);

  const handleSave = async () => {
    setTheme(selectedMode);
    try {
      await updateBranding.mutateAsync({ themeMode: selectedMode });
      toast({ title: "Theme updated", description: `Default theme set to ${selectedMode}` });
    } catch {
      toast({ title: "Error", description: "Failed to save theme", variant: "destructive" });
    }
  };

  const themeOptions = [
    { value: "dark" as const, label: "Dark Mode", icon: Moon, description: "Dark background with light text. Easier on the eyes in low light." },
    { value: "light" as const, label: "Light Mode", icon: Sun, description: "Light background with dark text. Best for bright environments." },
    { value: "system" as const, label: "System", icon: Monitor, description: "Automatically match your device's appearance settings." },
  ];

  return (
    <div className="space-y-6" data-testid="theme-settings-tab">
      <div className="bg-card border border-border p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-1">Theme Preference</h3>
        <p className="text-xs text-muted-foreground mb-6">Choose how the platform looks. This sets the default for all users. Individual users can override with the theme toggle button.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  setSelectedMode(opt.value);
                  setTheme(opt.value);
                }}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
                disabled={!canEdit}
                data-testid={`theme-option-${opt.value}`}
              >
                <div className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className={cn("text-sm font-semibold", isSelected ? "text-primary" : "text-foreground")}>{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                </div>
                {isSelected && (
                  <div className="flex items-center gap-1 text-primary text-xs font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-muted/50 border border-border p-4 mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Preview</h4>
          <div className={cn("rounded-lg overflow-hidden border border-border", theme === "dark" ? "bg-[hsl(222,47%,11%)]" : "bg-white")}>
            <div className={cn("h-8 flex items-center px-3 gap-2 border-b", theme === "dark" ? "bg-[hsl(222,47%,9%)] border-[hsl(217,32%,17%)]" : "bg-[hsl(220,14%,96%)] border-[hsl(220,13%,91%)]")}>
              <div className="flex gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500/70" />
                <div className="h-2 w-2 rounded-full bg-yellow-500/70" />
                <div className="h-2 w-2 rounded-full bg-green-500/70" />
              </div>
              <div className={cn("h-3 w-20 rounded-sm", theme === "dark" ? "bg-[hsl(217,19%,27%)]" : "bg-[hsl(220,13%,91%)]")} />
            </div>
            <div className="flex h-32">
              <div className={cn("w-16 p-2 space-y-1.5 border-r", theme === "dark" ? "bg-[hsl(222,47%,9%)] border-[hsl(217,32%,17%)]" : "bg-[hsl(220,14%,96%)] border-[hsl(220,13%,91%)]")}>
                {[1,2,3,4,5].map(i => (
                  <div key={i} className={cn("h-2 rounded-sm", i === 1 ? "bg-[hsl(217,91%,60%)]" : theme === "dark" ? "bg-[hsl(217,19%,27%)]" : "bg-[hsl(220,13%,91%)]")} />
                ))}
              </div>
              <div className="flex-1 p-3 space-y-2">
                <div className={cn("h-3 w-24 rounded-sm", theme === "dark" ? "bg-[hsl(45,93%,47%)]" : "bg-[hsl(45,93%,37%)]")} />
                <div className="grid grid-cols-3 gap-2">
                  {[1,2,3].map(i => (
                    <div key={i} className={cn("h-12 rounded-sm border", theme === "dark" ? "bg-[hsl(222,47%,13%)] border-[hsl(217,32%,17%)]" : "bg-white border-[hsl(220,13%,91%)]")}>
                      <div className={cn("h-2 w-8 mt-2 mx-2 rounded-sm", theme === "dark" ? "bg-[hsl(215,20%,65%)]" : "bg-[hsl(220,9%,46%)]")} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={handleSave}
            disabled={updateBranding.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="button-save-theme"
          >
            {updateBranding.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Theme Default
          </button>
        )}
      </div>
    </div>
  );
}

function IconPickerPopover({ value, onChange, testId }: { value: string; onChange: (v: string) => void; testId: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const icons = useMemo(() => searchIcons(search, 60), [search]);
  const CurrentIcon = getIcon(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-7 text-xs mt-0.5 w-full justify-start gap-2" data-testid={testId}>
          <CurrentIcon className="h-3 w-3" />
          {value || "Select icon"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search icons..."
          className="h-7 text-xs mb-2"
          data-testid={`${testId}-search`}
        />
        <div className="grid grid-cols-6 gap-1 max-h-48 overflow-y-auto">
          {icons.map((name) => {
            const Ic = getIcon(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => { onChange(name); setOpen(false); setSearch(""); }}
                className={cn(
                  "flex flex-col items-center gap-0.5 p-1.5 rounded hover:bg-muted transition-colors text-center",
                  value === name && "bg-primary/10 ring-1 ring-primary"
                )}
                title={name}
                data-testid={`${testId}-option-${name}`}
              >
                <Ic className="h-4 w-4" />
                <span className="text-[7px] leading-tight truncate w-full text-muted-foreground">{name}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type NavSectionData = {
  id: string;
  sectionKey: string;
  displayName: string;
  iconName: string | null;
  sortOrder: number;
  isCollapsedDefault: boolean | null;
};

function ManageSectionsArea({ navSections, configs }: { navSections: NavSectionData[]; configs: PageCfg[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ displayName: string; iconName: string; sortOrder: number; isCollapsedDefault: boolean }>({ displayName: "", iconName: "Blocks", sortOrder: 0, isCollapsedDefault: false });
  const [addingNew, setAddingNew] = useState(false);
  const [newForm, setNewForm] = useState({ sectionKey: "", displayName: "", iconName: "Blocks", isCollapsedDefault: false });
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ sectionKey: string; displayName: string } | null>(null);

  const sorted = useMemo(() => [...navSections].sort((a, b) => a.sortOrder - b.sortOrder), [navSections]);

  const pageCountMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of configs) {
      const s = c.navSection ?? "";
      m[s] = (m[s] || 0) + 1;
    }
    return m;
  }, [configs]);

  const saveSectionMutation = useMutation({
    mutationFn: async (section: { sectionKey: string; displayName: string; iconName: string | null; sortOrder: number; isCollapsedDefault?: boolean }) => {
      const res = await fetch("/api/admin/nav-sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(section),
      });
      if (!res.ok) throw new Error("Failed to save section");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
    },
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ sectionKey, sectionId, data }: { sectionKey: string; sectionId?: string; data: Record<string, any> }) => {
      const url = sectionKey ? `/api/admin/nav-sections/${sectionKey}` : `/api/admin/nav-sections-by-id/${sectionId}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update section");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionKey: string) => {
      const res = await fetch(`/api/admin/nav-sections/${sectionKey}?cascade=true`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete section");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
      setDeleteConfirm(null);
      toast({ title: "Section Deleted", description: "Section and all its pages have been removed." });
    },
  });

  const startEditing = (section: NavSectionData) => {
    setEditingKey(section.sectionKey);
    setEditForm({
      displayName: section.displayName,
      iconName: section.iconName || "Blocks",
      sortOrder: section.sortOrder,
      isCollapsedDefault: section.isCollapsedDefault ?? false,
    });
    setAddingNew(false);
  };

  const handleSave = (sectionKey: string, sectionId?: string) => {
    updateSectionMutation.mutate(
      { sectionKey, sectionId, data: { displayName: editForm.displayName, iconName: editForm.iconName, sortOrder: editForm.sortOrder, isCollapsedDefault: editForm.isCollapsedDefault } },
      {
        onSuccess: () => {
          setEditingKey(null);
          toast({ title: "Section Updated", description: "Nav section has been saved." });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleAddSection = () => {
    if (!newForm.sectionKey || !newForm.displayName) {
      toast({ title: "Missing fields", description: "Section key and display name are required.", variant: "destructive" });
      return;
    }
    const maxOrder = sorted.length > 0 ? Math.max(...sorted.map(s => s.sortOrder)) : 0;
    saveSectionMutation.mutate(
      { sectionKey: newForm.sectionKey, displayName: newForm.displayName, iconName: newForm.iconName, sortOrder: maxOrder + 1, isCollapsedDefault: newForm.isCollapsedDefault },
      {
        onSuccess: () => {
          setAddingNew(false);
          setNewForm({ sectionKey: "", displayName: "", iconName: "Blocks", isCollapsedDefault: false });
          toast({ title: "Section Added" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  };

  const handleDragStart = (e: React.DragEvent, sectionKey: string) => {
    setDragItem(sectionKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", sectionKey);
  };

  const handleDragOver = (e: React.DragEvent, sectionKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverItem(sectionKey);
  };

  const handleDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    const draggedKey = e.dataTransfer.getData("text/plain");
    if (!draggedKey || draggedKey === targetKey) {
      setDragItem(null);
      setDragOverItem(null);
      return;
    }
    const reordered = [...sorted];
    const fromIdx = reordered.findIndex(s => s.sectionKey === draggedKey);
    const toIdx = reordered.findIndex(s => s.sectionKey === targetKey);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    reordered.forEach((s, idx) => {
      updateSectionMutation.mutate({ sectionKey: s.sectionKey, data: { sortOrder: idx } });
    });
    setDragItem(null);
    setDragOverItem(null);
  };

  return (
    <div className="border rounded-sm border-border/50 mb-4" data-testid="manage-sections-area">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-card/30 border-b border-border/30">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground flex-1">
          Sections
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => { setAddingNew(true); setEditingKey(null); setNewForm({ sectionKey: "", displayName: "", iconName: "Blocks", isCollapsedDefault: false }); }}
          className="h-6 px-2 text-[10px] font-mono text-muted-foreground hover:text-foreground"
          data-testid="button-add-section"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Section
        </Button>
      </div>

      <div className="divide-y divide-border/20">
        {sorted.map((section) => {
          const SectionIcon = getIcon(section.iconName || "Blocks");
          const isEditing = editingKey === section.sectionKey;
          const isDragging = dragItem === section.sectionKey;
          const isDragOver = dragOverItem === section.sectionKey;
          const pageCount = pageCountMap[section.sectionKey] || 0;
          const hasPages = pageCount > 0;

          return (
            <div
              key={section.sectionKey}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, section.sectionKey)}
              onDragEnd={() => { setDragItem(null); setDragOverItem(null); }}
              onDragOver={(e) => handleDragOver(e, section.sectionKey)}
              onDrop={(e) => handleDrop(e, section.sectionKey)}
              className={cn(
                "group/section flex items-start gap-3 px-4 py-2.5 transition-all",
                isDragging && "opacity-40",
                isDragOver && "bg-primary/5",
                isEditing ? "bg-primary/5" : "hover:bg-card/50"
              )}
              data-testid={`manage-section-${section.sectionKey}`}
            >
              <div className="flex items-center gap-2 pt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing">
                <GripVertical className="h-4 w-4 text-muted-foreground/50" />
              </div>

              <div className="flex items-center justify-center h-8 w-8 rounded bg-card border border-border/50 flex-shrink-0">
                <SectionIcon className="h-4 w-4 text-muted-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Display Name</Label>
                        <Input
                          value={editForm.displayName}
                          onChange={(e) => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                          className="h-7 text-xs mt-0.5"
                          data-testid={`input-section-name-${section.sectionKey}`}
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Icon</Label>
                        <IconPickerPopover
                          value={editForm.iconName}
                          onChange={(v) => setEditForm(f => ({ ...f, iconName: v }))}
                          testId={`icon-picker-section-${section.sectionKey}`}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Sort Order</Label>
                        <Input
                          type="number"
                          value={editForm.sortOrder}
                          onChange={(e) => setEditForm(f => ({ ...f, sortOrder: parseInt(e.target.value) || 0 }))}
                          className="h-7 text-xs mt-0.5"
                          data-testid={`input-section-order-${section.sectionKey}`}
                        />
                      </div>
                      <div className="flex items-end pb-0.5">
                        <label className="flex items-center gap-2 cursor-pointer" data-testid={`toggle-collapsed-${section.sectionKey}`}>
                          <button
                            type="button"
                            onClick={() => setEditForm(f => ({ ...f, isCollapsedDefault: !f.isCollapsedDefault }))}
                            className={cn(
                              "relative w-9 h-5 rounded-sm transition-colors flex-shrink-0",
                              editForm.isCollapsedDefault ? "bg-primary" : "bg-muted"
                            )}
                          >
                            <span className={cn("absolute top-0.5 h-4 w-4 bg-background border border-border transition-transform", editForm.isCollapsedDefault ? "translate-x-4" : "translate-x-0.5")} />
                          </button>
                          <span className="text-[10px] font-mono uppercase text-muted-foreground">Collapsed by Default</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleSave(section.sectionKey, section.id)}
                        disabled={updateSectionMutation.isPending}
                        className="h-7 px-3 text-[10px] font-mono uppercase"
                        data-testid={`button-save-section-${section.sectionKey}`}
                      >
                        {updateSectionMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingKey(null)} className="h-7 px-2 text-[10px]" data-testid={`button-cancel-section-${section.sectionKey}`}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="min-w-0">
                      <span className="text-sm font-medium block truncate">{section.displayName}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{section.sectionKey}</span>
                    </div>
                  </div>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                    {pageCount} {pageCount === 1 ? "page" : "pages"}
                  </Badge>
                  {section.isCollapsedDefault && (
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                      collapsed
                    </Badge>
                  )}
                  <button
                    onClick={() => startEditing(section)}
                    className="p-1.5 rounded hover:bg-muted transition-colors"
                    title="Edit section"
                    data-testid={`button-edit-section-${section.sectionKey}`}
                  >
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => {
                      const visiblePages = configs.filter(c => c.navSection === section.sectionKey && c.isVisible !== false);
                      if (visiblePages.length > 0) {
                        toast({ title: "Cannot Delete", description: "This section has active content. Unpublish it before deleting.", variant: "destructive" });
                        return;
                      }
                      setDeleteConfirm({ sectionKey: section.sectionKey, displayName: section.displayName });
                    }}
                    className="p-1.5 rounded opacity-0 group-hover/section:opacity-100 transition-all hover:bg-destructive/10"
                    title="Delete section"
                    data-testid={`button-delete-section-${section.sectionKey}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {addingNew && (
          <div className="flex items-start gap-3 px-4 py-2.5 bg-primary/5" data-testid="add-section-form">
            <div className="flex items-center gap-2 pt-0.5 flex-shrink-0">
              <GripVertical className="h-4 w-4 text-muted-foreground/20" />
            </div>

            <div className="flex items-center justify-center h-8 w-8 rounded bg-card border border-border/50 flex-shrink-0">
              {(() => { const NewIcon = getIcon(newForm.iconName || "Blocks"); return <NewIcon className="h-4 w-4 text-muted-foreground" />; })()}
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Section Key</Label>
                  <Input
                    value={newForm.sectionKey}
                    onChange={(e) => setNewForm(f => ({ ...f, sectionKey: e.target.value }))}
                    placeholder="my-section"
                    className="h-7 text-xs mt-0.5"
                    data-testid="input-new-section-key"
                  />
                </div>
                <div>
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Display Name</Label>
                  <Input
                    value={newForm.displayName}
                    onChange={(e) => setNewForm(f => ({ ...f, displayName: e.target.value }))}
                    placeholder="My Section"
                    className="h-7 text-xs mt-0.5"
                    data-testid="input-new-section-display"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Icon</Label>
                  <IconPickerPopover value={newForm.iconName} onChange={(v) => setNewForm(f => ({ ...f, iconName: v }))} testId="icon-picker-new-section" />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer" data-testid="toggle-new-collapsed">
                    <button
                      type="button"
                      onClick={() => setNewForm(f => ({ ...f, isCollapsedDefault: !f.isCollapsedDefault }))}
                      className={cn(
                        "relative w-9 h-5 rounded-sm transition-colors flex-shrink-0",
                        newForm.isCollapsedDefault ? "bg-primary" : "bg-muted"
                      )}
                    >
                      <span className={cn("absolute top-0.5 h-4 w-4 bg-background border border-border transition-transform", newForm.isCollapsedDefault ? "translate-x-4" : "translate-x-0.5")} />
                    </button>
                    <span className="text-[10px] font-mono uppercase text-muted-foreground">Collapsed by Default</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  size="sm"
                  onClick={handleAddSection}
                  disabled={saveSectionMutation.isPending}
                  className="h-7 px-3 text-[10px] font-mono uppercase"
                  data-testid="button-confirm-add-section"
                >
                  {saveSectionMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                  Add
                </Button>
                <Button size="sm" variant="outline" onClick={() => setAddingNew(false)} className="h-7 px-2 text-[10px]" data-testid="button-cancel-add-section">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Delete "{deleteConfirm?.displayName}"? This will remove the section and all its subsections. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} data-testid="button-cancel-delete-section">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteConfirm) deleteSectionMutation.mutate(deleteConfirm.sectionKey); }}
              disabled={deleteSectionMutation.isPending}
              data-testid="button-confirm-delete-section"
            >
              {deleteSectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PageConfigurationTab() {
  const { toast } = useToast();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [dragOverSection, setDragOverSection] = useState<string | null>(null);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showAddPage, setShowAddPage] = useState<string | null>(null);
  const [newPageForm, setNewPageForm] = useState({ pageKey: "", title: "", route: "", iconName: "Blocks", permission: "dashboard.view" });
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [editNewSection, setEditNewSection] = useState("");
  const [deletePageConfirm, setDeletePageConfirm] = useState<{ pageKey: string; title: string; isVisible: boolean } | null>(null);
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<{ sectionKey: string; label: string } | null>(null);

  const { data: configs, isLoading } = useQuery<PageCfg[]>({
    queryKey: ["/api/admin/page-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/page-config", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load page config");
      return res.json();
    },
  });

  const { data: navSections } = useQuery<NavSectionData[]>({
    queryKey: ["/api/admin/nav-sections"],
    queryFn: async () => {
      const res = await fetch("/api/admin/nav-sections", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30000,
  });

  const sectionOrderMap = useMemo(() => {
    const m: Record<string, number> = {};
    const displayMap: Record<string, string> = {};
    if (navSections) {
      for (const ns of navSections) {
        m[ns.sectionKey] = ns.sortOrder;
        displayMap[ns.sectionKey] = ns.displayName;
      }
    }
    return { order: m, display: displayMap };
  }, [navSections]);

  const updateMutation = useMutation({
    mutationFn: async ({ pageKey, data }: { pageKey: string; data: Record<string, any> }) => {
      const res = await fetch(`/api/admin/page-config/${pageKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
      setEditingKey(null);
      toast({ title: "Saved", description: "Page configuration updated." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (pages: { pageKey: string; sortOrder: number; navSection: string }[]) => {
      const res = await fetch("/api/admin/page-config/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pages }),
      });
      if (!res.ok) throw new Error("Failed to reorder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/page-config/reset", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to reset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
      setShowResetDialog(false);
      toast({ title: "Reset Complete", description: "Navigation restored to defaults." });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await fetch("/api/admin/page-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create page");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
      setShowAddPage(null);
      setNewPageForm({ pageKey: "", title: "", route: "", iconName: "Blocks", permission: "dashboard.view" });
      toast({ title: "Page Added", description: "New page added to navigation." });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (pageKey: string) => {
      const res = await fetch(`/api/admin/page-config/${pageKey}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
      setDeletePageConfirm(null);
      toast({ title: "Deleted", description: "Page removed from navigation." });
    },
  });

  const deleteSectionCascadeMutation = useMutation({
    mutationFn: async (sectionKey: string) => {
      const res = await fetch(`/api/admin/nav-sections/${sectionKey}?cascade=true`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete section");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
      setDeleteSectionConfirm(null);
      toast({ title: "Section Deleted", description: "Section and all its pages have been removed." });
    },
  });

  const sections = useMemo(() => {
    if (!configs) return [];
    const grouped: Record<string, PageCfg[]> = {};
    for (const cfg of configs) {
      const s = cfg.navSection ?? "ungrouped";
      if (!grouped[s]) grouped[s] = [];
      grouped[s].push(cfg);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    const allKeys = Object.keys(grouped);
    allKeys.sort((a, b) => {
      const orderA = sectionOrderMap.order[a] ?? 999;
      const orderB = sectionOrderMap.order[b] ?? 999;
      return orderA - orderB;
    });
    return allKeys.map(s => ({
      key: s,
      label: sectionOrderMap.display[s] ?? s.charAt(0).toUpperCase() + s.slice(1),
      items: grouped[s] || [],
    }));
  }, [configs, sectionOrderMap]);

  const handleDragStart = (e: React.DragEvent, pageKey: string) => {
    setDragItem(pageKey);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", pageKey);
  };

  const handleDragOver = (e: React.DragEvent, sectionKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSection(sectionKey);
  };

  const handleDrop = (e: React.DragEvent, targetSection: string, targetIndex?: number) => {
    e.preventDefault();
    const draggedKey = e.dataTransfer.getData("text/plain");
    if (!draggedKey || !configs) return;

    const updatedConfigs = [...configs];
    const draggedIdx = updatedConfigs.findIndex(c => c.pageKey === draggedKey);
    if (draggedIdx === -1) return;

    const dragged = { ...updatedConfigs[draggedIdx] };
    dragged.navSection = targetSection;

    const sectionItems = updatedConfigs
      .filter(c => (c.navSection ?? "") === targetSection && c.pageKey !== draggedKey)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const insertAt = targetIndex !== undefined ? targetIndex : sectionItems.length;
    sectionItems.splice(insertAt, 0, dragged);

    const sectionBase = sections.find(s => s.key === targetSection);
    const baseOrder = sectionBase ? Math.min(...sectionBase.items.map(i => i.sortOrder), 999) : 0;

    const reorderPages = sectionItems.map((item, idx) => ({
      pageKey: item.pageKey,
      sortOrder: baseOrder + idx,
      navSection: targetSection,
    }));

    reorderMutation.mutate(reorderPages);
    setDragItem(null);
    setDragOverSection(null);
  };

  const toggleVisibility = (config: PageCfg) => {
    updateMutation.mutate({
      pageKey: config.pageKey,
      data: { isVisible: !(config.isVisible !== false) },
    });
  };

  const startEditing = (config: PageCfg) => {
    setEditingKey(config.pageKey);
    setEditForm({
      title: config.title || "",
      description: config.description || "",
      iconName: config.iconName || "",
      primaryActionLabel: config.primaryActionLabel || "",
      aiActionLabel: config.aiActionLabel || "",
      navSection: config.navSection || "",
    });
    setEditNewSection("");
  };

  const handleSave = (pageKey: string) => {
    const data: Record<string, any> = { ...editForm };
    if (editForm.navSection === "__new__" && editNewSection) {
      data.navSection = editNewSection;
    }
    updateMutation.mutate({ pageKey, data });
  };

  const handleAddPage = (sectionKey: string) => {
    if (!newPageForm.pageKey || !newPageForm.title || !newPageForm.route) {
      toast({ title: "Missing fields", description: "Page key, title, and route are required.", variant: "destructive" });
      return;
    }
    const sectionItems = configs?.filter(c => (c.navSection ?? "") === sectionKey) || [];
    const maxOrder = sectionItems.length > 0 ? Math.max(...sectionItems.map(i => i.sortOrder)) : 0;
    createMutation.mutate({
      ...newPageForm,
      navSection: sectionKey,
      sortOrder: maxOrder + 1,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="page-config-tab">
      <div className="flex items-center justify-between">
        <SectionHeader icon={LayoutGrid} title="Navigation Manager" description="Organize sidebar pages, sections, and visibility. Drag pages between sections to reorganize." />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowResetDialog(true)}
          className="h-8 text-xs font-mono"
          data-testid="button-reset-nav"
        >
          <RefreshCw className="h-3 w-3 mr-1.5" />
          Reset to Default
        </Button>
      </div>

      {navSections && <ManageSectionsArea navSections={navSections} configs={configs || []} />}

      {sections.map((section) => {
        const isCollapsed = collapsedSections[section.key];
        return (
          <div
            key={section.key}
            className={cn(
              "border rounded-sm transition-colors",
              dragOverSection === section.key ? "border-primary bg-primary/5" : "border-border/50"
            )}
            onDragOver={(e) => handleDragOver(e, section.key)}
            onDragLeave={() => setDragOverSection(null)}
            onDrop={(e) => handleDrop(e, section.key)}
            data-testid={`section-${section.key || "dashboard"}`}
          >
            <div className="group/sectionhdr flex items-center gap-2 px-4 py-2.5 bg-card/30 border-b border-border/30">
              <button
                onClick={() => setCollapsedSections(prev => ({ ...prev, [section.key]: !prev[section.key] }))}
                className="text-muted-foreground hover:text-foreground"
                data-testid={`button-toggle-section-${section.key || "dashboard"}`}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label || "Ungrouped"}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-mono ml-1">
                ({section.items.length})
              </span>
              <div className="flex-1" />
              <button
                onClick={() => {
                  const hasVisibleContent = section.items.some(c => c.isVisible !== false);
                  if (hasVisibleContent) {
                    toast({ title: "Cannot Delete", description: "This section has active content. Unpublish it before deleting.", variant: "destructive" });
                    return;
                  }
                  setDeleteSectionConfirm({ sectionKey: section.key, label: section.label });
                }}
                className="p-1.5 rounded opacity-0 group-hover/sectionhdr:opacity-100 transition-all hover:bg-destructive/10"
                title="Delete section and all its pages"
                data-testid={`button-delete-section-group-${section.key || "dashboard"}`}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAddPage(section.key);
                  setNewPageForm({ pageKey: "", title: "", route: "", iconName: "Blocks", permission: "dashboard.view" });
                }}
                className="h-6 px-2 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                data-testid={`button-add-page-${section.key || "dashboard"}`}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Page
              </Button>
            </div>

            {!isCollapsed && (
              <div className="divide-y divide-border/20">
                {section.items.map((config, idx) => {
                  const Icon = getIcon(config.iconName);
                  const isEditing = editingKey === config.pageKey;
                  const isDragging = dragItem === config.pageKey;
                  const isHidden = config.isVisible === false;

                  return (
                    <div
                      key={config.pageKey}
                      draggable
                      onDragStart={(e) => handleDragStart(e, config.pageKey)}
                      onDragEnd={() => { setDragItem(null); setDragOverSection(null); }}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onDrop={(e) => { e.stopPropagation(); handleDrop(e, section.key, idx); }}
                      className={cn(
                        "group/pagerow flex items-start gap-3 px-4 py-2.5 transition-all",
                        isDragging && "opacity-40",
                        isHidden && "opacity-50",
                        isEditing ? "bg-primary/5" : "hover:bg-card/50"
                      )}
                      data-testid={`row-page-config-${config.pageKey}`}
                    >
                      <div className="flex items-center gap-2 pt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
                      </div>

                      <div className="flex items-center justify-center h-8 w-8 rounded bg-card border border-border/50 flex-shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {isEditing ? (
                          <div className="space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title</Label>
                                <Input
                                  value={editForm.title}
                                  onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                                  className="h-7 text-xs mt-0.5"
                                  data-testid={`input-title-${config.pageKey}`}
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Icon</Label>
                                <IconPickerPopover
                                  value={editForm.iconName}
                                  onChange={(v) => setEditForm(f => ({ ...f, iconName: v }))}
                                  testId={`icon-picker-${config.pageKey}`}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Description (tooltip)</Label>
                              <Input
                                value={editForm.description}
                                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                                className="h-7 text-xs mt-0.5"
                                data-testid={`input-description-${config.pageKey}`}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Nav Section</Label>
                                <Select value={editForm.navSection} onValueChange={(v) => setEditForm(f => ({ ...f, navSection: v }))}>
                                  <SelectTrigger className="h-7 text-xs mt-0.5" data-testid={`select-navsection-${config.pageKey}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {navSections?.filter(ns => ns.sectionKey).map(ns => (
                                      <SelectItem key={ns.sectionKey} value={ns.sectionKey}>{ns.displayName}</SelectItem>
                                    ))}
                                    <SelectItem value="__new__">New Section...</SelectItem>
                                  </SelectContent>
                                </Select>
                                {editForm.navSection === "__new__" && (
                                  <Input
                                    value={editNewSection}
                                    onChange={(e) => setEditNewSection(e.target.value)}
                                    placeholder="new-section-key"
                                    className="h-7 text-xs mt-1"
                                    data-testid={`input-new-navsection-${config.pageKey}`}
                                  />
                                )}
                              </div>
                              <div>
                                <Label className="text-[10px] font-mono uppercase text-muted-foreground">Primary Action Label</Label>
                                <Input
                                  value={editForm.primaryActionLabel}
                                  onChange={(e) => setEditForm(f => ({ ...f, primaryActionLabel: e.target.value }))}
                                  className="h-7 text-xs mt-0.5"
                                  data-testid={`input-primary-action-${config.pageKey}`}
                                />
                              </div>
                            </div>
                            <div>
                              <Label className="text-[10px] font-mono uppercase text-muted-foreground">AI Action Label</Label>
                              <Input
                                value={editForm.aiActionLabel}
                                onChange={(e) => setEditForm(f => ({ ...f, aiActionLabel: e.target.value }))}
                                className="h-7 text-xs mt-0.5"
                                data-testid={`input-ai-action-${config.pageKey}`}
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <Button
                                size="sm"
                                onClick={() => handleSave(config.pageKey)}
                                disabled={updateMutation.isPending}
                                className="h-7 px-3 text-[10px] font-mono uppercase"
                                data-testid={`button-save-config-${config.pageKey}`}
                              >
                                {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingKey(null)} className="h-7 px-2 text-[10px]" data-testid={`button-cancel-config-${config.pageKey}`}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <span className="text-sm font-medium block truncate">{config.title}</span>
                              <span className="text-[10px] font-mono text-muted-foreground">{config.route}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => toggleVisibility(config)}
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title={isHidden ? "Show in navigation" : "Hide from navigation"}
                            data-testid={`button-visibility-${config.pageKey}`}
                          >
                            {isHidden ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                          <button
                            onClick={() => startEditing(config)}
                            className="p-1.5 rounded hover:bg-muted transition-colors"
                            title="Edit page settings"
                            data-testid={`button-edit-${config.pageKey}`}
                          >
                            <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => {
                              if (config.isVisible !== false) {
                                toast({ title: "Cannot Delete", description: "This section has active content. Unpublish it before deleting.", variant: "destructive" });
                                return;
                              }
                              setDeletePageConfirm({ pageKey: config.pageKey, title: config.title || config.pageKey, isVisible: config.isVisible !== false });
                            }}
                            className="p-1.5 rounded opacity-0 group-hover/pagerow:opacity-100 transition-all hover:bg-destructive/10"
                            title="Remove from navigation"
                            data-testid={`button-delete-${config.pageKey}`}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {showAddPage === section.key && (
                  <div className="px-4 py-3 bg-primary/5 border-t border-border/30 space-y-2" data-testid={`add-page-form-${section.key}`}>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Page Key</Label>
                        <Input
                          value={newPageForm.pageKey}
                          onChange={(e) => setNewPageForm(f => ({ ...f, pageKey: e.target.value }))}
                          placeholder="my-page"
                          className="h-7 text-xs mt-0.5"
                          data-testid="input-new-page-key"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title</Label>
                        <Input
                          value={newPageForm.title}
                          onChange={(e) => setNewPageForm(f => ({ ...f, title: e.target.value }))}
                          placeholder="My Page"
                          className="h-7 text-xs mt-0.5"
                          data-testid="input-new-page-title"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Route</Label>
                        <Input
                          value={newPageForm.route}
                          onChange={(e) => setNewPageForm(f => ({ ...f, route: e.target.value }))}
                          placeholder="/my-page"
                          className="h-7 text-xs mt-0.5"
                          data-testid="input-new-page-route"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Icon</Label>
                        <IconPickerPopover
                          value={newPageForm.iconName}
                          onChange={(v) => setNewPageForm(f => ({ ...f, iconName: v }))}
                          testId="icon-picker-new-page"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-mono uppercase text-muted-foreground">Permission</Label>
                        <Select value={newPageForm.permission} onValueChange={(v) => setNewPageForm(f => ({ ...f, permission: v }))}>
                          <SelectTrigger className="h-7 text-xs mt-0.5" data-testid="select-new-page-permission">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["dashboard.view","content.view","content.edit","monetization.view","monetization.edit","network.view","audience.view","analytics.view","customize.view","customize.edit","settings.view","settings.edit","users.view","sales.view"].map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleAddPage(section.key)}
                        disabled={createMutation.isPending}
                        className="h-7 px-3 text-[10px] font-mono uppercase"
                        data-testid="button-confirm-add-page"
                      >
                        {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                        Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowAddPage(null)} className="h-7 px-2 text-[10px]" data-testid="button-cancel-add-page">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Navigation to Defaults?</DialogTitle>
            <DialogDescription>
              This will remove all customizations and restore the original navigation structure. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} data-testid="button-cancel-reset">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => resetMutation.mutate()}
              disabled={resetMutation.isPending}
              data-testid="button-confirm-reset"
            >
              {resetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset to Defaults
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletePageConfirm} onOpenChange={(open) => { if (!open) setDeletePageConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subsection</DialogTitle>
            <DialogDescription>
              Delete "{deletePageConfirm?.title}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePageConfirm(null)} data-testid="button-cancel-delete-page">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (deletePageConfirm) deleteMutation.mutate(deletePageConfirm.pageKey); }}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-page"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteSectionConfirm} onOpenChange={(open) => { if (!open) setDeleteSectionConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>
              Delete "{deleteSectionConfirm?.label}"? This will remove the section and all its subsections. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSectionConfirm(null)} data-testid="button-cancel-delete-section-cascade">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => { if (deleteSectionConfirm) deleteSectionCascadeMutation.mutate(deleteSectionConfirm.sectionKey); }}
              disabled={deleteSectionCascadeMutation.isPending}
              data-testid="button-confirm-delete-section-cascade"
            >
              {deleteSectionCascadeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const SocialXIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const SocialInstagramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const SocialTikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48c1.77-1.77 2.36-4.26 2.36-5.95V9.26a8.27 8.27 0 004.85 1.57V7.39a4.85 4.85 0 01-1.63-.7z"/>
  </svg>
);

function getSocialPlatformIcon(platform: string, className?: string) {
  switch (platform) {
    case "x": return <SocialXIcon className={className || "h-4 w-4"} />;
    case "facebook": return <Facebook className={className || "h-4 w-4"} />;
    case "linkedin": return <Linkedin className={className || "h-4 w-4"} />;
    case "google_business": return <Building2 className={className || "h-4 w-4"} />;
    case "instagram": return <SocialInstagramIcon className={className || "h-4 w-4"} />;
    case "tiktok": return <SocialTikTokIcon className={className || "h-4 w-4"} />;
    default: return <Sparkles className={className || "h-4 w-4"} />;
  }
}

function getSocialPlatformLabel(platform: string) {
  switch (platform) {
    case "x": return "X";
    case "facebook": return "Facebook";
    case "linkedin": return "LinkedIn";
    case "google_business": return "Google Business";
    case "instagram": return "Instagram";
    case "tiktok": return "TikTok";
    default: return platform;
  }
}

const PLATFORM_CARDS = [
  { platform: "x", label: "X", description: "Post updates and threads", color: "text-foreground", bgGradient: "from-zinc-800 to-zinc-900" },
  { platform: "facebook", label: "Facebook", description: "Pages and groups", color: "text-blue-500", bgGradient: "from-blue-950 to-blue-900" },
  { platform: "instagram", label: "Instagram", description: "Stories, reels, carousels", color: "text-pink-500", bgGradient: "from-pink-950 to-purple-900" },
  { platform: "linkedin", label: "LinkedIn", description: "Professional content", color: "text-[#0A66C2]", bgGradient: "from-blue-950 to-cyan-900" },
  { platform: "tiktok", label: "TikTok", description: "Short-form video", color: "text-foreground", bgGradient: "from-zinc-800 to-zinc-900" },
  { platform: "google_business", label: "Google Business", description: "Business profile", color: "text-emerald-500", bgGradient: "from-emerald-950 to-green-900" },
];

function SocialConnectionsSection({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const { data: allAccounts, isLoading: accountsLoading } = useSocialAccounts();
  const { data: podcasts, isLoading: podcastsLoading } = usePodcasts();
  const createAccount = useCreateSocialAccount();
  const updateAccount = useUpdateSocialAccount();
  const deleteAccount = useDeleteSocialAccount();
  const { toast } = useToast();

  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [connectDialog, setConnectDialog] = useState<{ open: boolean; platform: string }>({ open: false, platform: "" });
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; account: any | null }>({ open: false, account: null });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ accountName: "", accountUrl: "" });
  const [connectStep, setConnectStep] = useState<"form" | "verifying" | "success">("form");
  const [form, setForm] = useState({ accountName: "", accountUrl: "", ownerType: "company" as string, podcastId: "" });
  const [testingId, setTestingId] = useState<string | null>(null);
  const [reconnectingId, setReconnectingId] = useState<string | null>(null);

  const filteredAccounts = allAccounts?.filter((a: any) => {
    if (ownerFilter === "all") return true;
    if (ownerFilter === "company") return a.ownerType === "company" || !a.ownerType;
    return a.podcastId === ownerFilter;
  }) || [];

  function getAccountForPlatform(platform: string) {
    return filteredAccounts.find((a: any) => a.platform === platform);
  }

  function getStatusIndicator(status: string) {
    switch (status) {
      case "connected": return { color: "bg-emerald-500", label: "Connected", textColor: "text-emerald-400" };
      case "token_expired": return { color: "bg-amber-500", label: "Token Expired", textColor: "text-amber-400" };
      default: return { color: "bg-muted-foreground/30", label: "Not Connected", textColor: "text-muted-foreground" };
    }
  }

  function openConnectDialog(platform: string) {
    setForm({ accountName: "", accountUrl: "", ownerType: ownerFilter === "all" || ownerFilter === "company" ? "company" : "podcast", podcastId: ownerFilter !== "all" && ownerFilter !== "company" ? ownerFilter : "" });
    setConnectStep("form");
    setConnectDialog({ open: true, platform });
  }

  function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    if (form.ownerType === "podcast" && !form.podcastId) {
      toast({ title: "Please select a podcast", variant: "destructive" });
      return;
    }
    setConnectStep("verifying");
    createAccount.mutate(
      {
        platform: connectDialog.platform,
        accountName: form.accountName,
        accountUrl: form.accountUrl,
        ownerType: form.ownerType,
        podcastId: form.ownerType === "podcast" ? form.podcastId : null,
      },
      {
        onSuccess: () => {
          setConnectStep("success");
          setTimeout(() => {
            setConnectDialog({ open: false, platform: "" });
            setConnectStep("form");
            toast({ title: "Account Connected", description: `${getSocialPlatformLabel(connectDialog.platform)} has been successfully connected.` });
          }, 1500);
        },
        onError: (err: any) => {
          setConnectStep("form");
          toast({ title: "Connection Failed", description: err.message, variant: "destructive" });
        },
      }
    );
  }

  function handleDisconnect(id: string, platform: string) {
    deleteAccount.mutate(id, {
      onSuccess: () => {
        toast({ title: "Account Disconnected", description: `${getSocialPlatformLabel(platform)} has been disconnected.` });
        setDetailDialog({ open: false, account: null });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  }

  async function handleTestConnection(id: string) {
    setTestingId(id);
    try {
      const res = await fetch(`/api/social-accounts/${id}/test`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Connection test failed");
      qc.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      toast({ title: "Connection Verified" });
    } catch (err: any) {
      toast({ title: "Test Failed", description: err.message, variant: "destructive" });
    } finally {
      setTestingId(null);
    }
  }

  async function handleReconnect(id: string) {
    setReconnectingId(id);
    try {
      const res = await fetch(`/api/social-accounts/${id}/reconnect`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Reconnection failed");
      qc.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      toast({ title: "Reconnected" });
      if (detailDialog.account) {
        setDetailDialog({ open: true, account: { ...detailDialog.account, status: "connected" } });
      }
    } catch (err: any) {
      toast({ title: "Reconnect Failed", description: err.message, variant: "destructive" });
    } finally {
      setReconnectingId(null);
    }
  }

  function openDetailDialog(account: any) {
    setEditMode(false);
    setEditForm({ accountName: account.accountName, accountUrl: account.accountUrl || "" });
    setDetailDialog({ open: true, account });
  }

  function handleSaveEdit() {
    if (!detailDialog.account) return;
    updateAccount.mutate(
      { id: detailDialog.account.id, data: editForm },
      {
        onSuccess: () => {
          setEditMode(false);
          setDetailDialog({ open: true, account: { ...detailDialog.account, ...editForm } });
          toast({ title: "Account Updated" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
  }

  function getOwnerLabel(account: any) {
    if (account.ownerType === "podcast" && account.podcastId) {
      const podcast = podcasts?.find((p: any) => p.id === account.podcastId);
      return podcast?.title || "Unknown Podcast";
    }
    return "Company-wide";
  }

  const connectedCount = filteredAccounts.filter((a: any) => a.status === "connected").length;
  const totalPlatforms = PLATFORM_CARDS.length;
  const isLoading = accountsLoading || podcastsLoading;

  return (
    <div className="border border-border bg-card/50 p-4 sm:p-6 space-y-5 lg:col-span-2" data-testid="section-social-connections">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 border border-primary/30 bg-primary/5 flex items-center justify-center flex-shrink-0">
            <Wifi className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-display font-bold text-primary uppercase tracking-wider">
              Social Connections
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage social media platform connections per podcast or company-wide
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Expired</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 border border-border/50 bg-card/30 rounded-sm">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap">Show for:</Label>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-full sm:w-[250px]" data-testid="select-social-owner-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Connections</SelectItem>
            <SelectItem value="company">
              <span className="flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Company-wide
              </span>
            </SelectItem>
            {podcasts?.filter((p: any) => p.id).map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="flex items-center gap-2">
                  <Radio className="h-3 w-3" /> {p.title}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground font-mono">
          {connectedCount} of {totalPlatforms} connected
        </span>
      </div>

      {connectedCount > 0 && (
        <div className="w-full bg-card/30 rounded-full h-2 border border-border/30">
          <div
            className="bg-gradient-to-r from-primary to-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(connectedCount / totalPlatforms) * 100}%` }}
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-sm" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLATFORM_CARDS.map(({ platform, label, description, color, bgGradient }) => {
            const account = getAccountForPlatform(platform);
            const status = getStatusIndicator(account?.status || "disconnected");
            const isConnected = account?.status === "connected";
            const isExpired = account?.status === "token_expired";

            return (
              <Card
                key={platform}
                className={cn(
                  "glass-panel border-border/50 transition-all duration-300 overflow-hidden group",
                  isConnected && "border-emerald-500/30 hover:border-emerald-500/50",
                  isExpired && "border-amber-500/30 hover:border-amber-500/50",
                  !account && "hover:border-primary/30"
                )}
                data-testid={`card-social-${platform}`}
              >
                <div className={cn("h-1.5 w-full bg-gradient-to-r", bgGradient, isConnected && "from-emerald-600 to-emerald-500", isExpired && "from-amber-600 to-amber-500")} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2.5 rounded-sm bg-card border border-border/50", color)}>
                      {getSocialPlatformIcon(platform, "h-6 w-6")}
                    </div>
                    <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono", status.textColor, isConnected ? "bg-emerald-500/10" : isExpired ? "bg-amber-500/10" : "bg-muted/30")}>
                      {isConnected && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>}
                      {isExpired && <AlertTriangle className="h-3 w-3" />}
                      {!account && <WifiOff className="h-3 w-3" />}
                      {status.label}
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-sm">{label}</h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">{description}</p>

                  {account ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-card/50 rounded-sm px-2.5 py-1.5 border border-border/30">
                        <span className="truncate">{account.accountName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[9px] font-mono bg-card/50 border-border/30">
                          {getOwnerLabel(account)}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetailDialog(account)}
                          className="flex-1 font-mono text-[10px] h-7"
                          data-testid={`button-manage-${platform}`}
                        >
                          <Eye className="h-3 w-3 mr-1" /> Manage
                        </Button>
                        {isExpired && (
                          <Button
                            size="sm"
                            onClick={() => handleReconnect(account.id)}
                            disabled={reconnectingId === account.id}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-mono text-[10px] h-7"
                            data-testid={`button-reconnect-${platform}`}
                          >
                            {reconnectingId === account.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                            Reconnect
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : canEdit ? (
                    <Button
                      onClick={() => openConnectDialog(platform)}
                      className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-mono text-[10px] uppercase tracking-wider h-8"
                      data-testid={`button-connect-${platform}`}
                    >
                      <Wifi className="h-3 w-3 mr-1" /> Connect
                    </Button>
                  ) : (
                    <p className="text-[10px] text-muted-foreground text-center py-2">Not connected</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {ownerFilter === "all" && allAccounts?.length > 0 && (
        <div className="border border-border/50 rounded-sm overflow-hidden">
          <div className="bg-card/30 px-4 py-2 border-b border-border/30">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">All Connected Accounts</h4>
          </div>
          <div className="divide-y divide-border/30">
            {allAccounts.map((acc: any) => {
              const status = getStatusIndicator(acc.status);
              return (
                <div key={acc.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-2.5" data-testid={`social-account-row-${acc.id}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={cn("p-1.5 rounded-sm", acc.platform === "facebook" ? "text-blue-500" : acc.platform === "instagram" ? "text-pink-500" : acc.platform === "linkedin" ? "text-[#0A66C2]" : acc.platform === "google_business" ? "text-emerald-500" : "text-foreground")}>
                      {getSocialPlatformIcon(acc.platform, "h-4 w-4")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono truncate">{acc.accountName}</span>
                        <Badge variant="outline" className="text-[9px] font-mono bg-card/50 border-border/30 shrink-0">
                          {getSocialPlatformLabel(acc.platform)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 pl-10 sm:pl-0">
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                      {getOwnerLabel(acc)}
                    </Badge>
                    <div className={cn("h-2 w-2 rounded-full shrink-0", status.color)} />
                    <span className={cn("text-[10px] font-mono shrink-0", status.textColor)}>{status.label}</span>
                    {canEdit && (
                      <Button variant="ghost" size="sm" onClick={() => openDetailDialog(acc)} className="h-6 w-6 p-0" data-testid={`button-detail-${acc.id}`}>
                        <Eye className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={connectDialog.open} onOpenChange={(open) => { if (!open) { setConnectDialog({ open: false, platform: "" }); setConnectStep("form"); } }}>
        <DialogContent className="glass-panel border-border sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              {connectDialog.platform && (
                <div className="p-2 rounded-sm bg-card border border-border">
                  {getSocialPlatformIcon(connectDialog.platform, "h-6 w-6")}
                </div>
              )}
              <div>
                <DialogTitle className="font-display text-xl">Connect {getSocialPlatformLabel(connectDialog.platform)}</DialogTitle>
                <DialogDescription className="font-mono text-xs">Link your account to enable automated publishing</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {connectStep === "form" && (
            <form onSubmit={handleConnect} className="space-y-4">
              <div className="rounded-sm border border-border/50 bg-card/30 p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Connection Owner</Label>
                  <Select value={form.ownerType} onValueChange={v => setForm(f => ({ ...f, ownerType: v, podcastId: v === "company" ? "" : f.podcastId }))}>
                    <SelectTrigger data-testid="select-owner-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">
                        <span className="flex items-center gap-2"><Building2 className="h-3 w-3" /> Company-wide</span>
                      </SelectItem>
                      <SelectItem value="podcast">
                        <span className="flex items-center gap-2"><Radio className="h-3 w-3" /> Specific Podcast</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.ownerType === "podcast" && (
                  <div className="space-y-2">
                    <Label className="font-mono text-xs uppercase tracking-wider">Select Podcast</Label>
                    <Select value={form.podcastId} onValueChange={v => setForm(f => ({ ...f, podcastId: v }))}>
                      <SelectTrigger data-testid="select-podcast-id">
                        <SelectValue placeholder="Choose a podcast..." />
                      </SelectTrigger>
                      <SelectContent>
                        {podcasts?.filter((p: any) => p.id).map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Account Handle / Name</Label>
                  <Input
                    value={form.accountName}
                    onChange={(e) => setForm(f => ({ ...f, accountName: e.target.value }))}
                    placeholder={connectDialog.platform === "x" ? "@yourhandle" : "Your account name"}
                    required
                    data-testid="input-connect-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-mono text-xs uppercase tracking-wider">Profile URL <span className="text-muted-foreground">(optional)</span></Label>
                  <Input
                    value={form.accountUrl}
                    onChange={(e) => setForm(f => ({ ...f, accountUrl: e.target.value }))}
                    placeholder={`https://${connectDialog.platform === "x" ? "x.com" : connectDialog.platform === "linkedin" ? "linkedin.com/company" : connectDialog.platform + ".com"}/...`}
                    data-testid="input-connect-url"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-sm bg-primary/5 border border-primary/10 text-xs text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>We'll verify the connection after linking your account.</span>
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setConnectDialog({ open: false, platform: "" })} className="font-mono text-xs" data-testid="button-cancel-connect">Cancel</Button>
                <Button type="submit" disabled={createAccount.isPending || !form.accountName} className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider" data-testid="button-submit-connect">
                  <Wifi className="mr-2 h-3 w-3" />
                  Connect & Verify
                </Button>
              </DialogFooter>
            </form>
          )}

          {connectStep === "verifying" && (
            <div className="py-8 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-display font-bold">Verifying Connection...</p>
                <p className="text-xs text-muted-foreground font-mono">Authenticating with {getSocialPlatformLabel(connectDialog.platform)}</p>
              </div>
              <div className="space-y-2 w-full max-w-xs">
                {["Initializing OAuth handshake", "Validating credentials", "Testing API access"].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-left-2" style={{ animationDelay: `${i * 400}ms` }}>
                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                    <span className="text-muted-foreground">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {connectStep === "success" && (
            <div className="py-8 flex flex-col items-center gap-4 animate-in zoom-in-50 fade-in duration-300">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-display font-bold text-emerald-500">Connected Successfully!</p>
                <p className="text-xs text-muted-foreground font-mono">{getSocialPlatformLabel(connectDialog.platform)} is now linked</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialog.open} onOpenChange={(open) => { if (!open) setDetailDialog({ open: false, account: null }); }}>
        <DialogContent className="glass-panel border-border sm:max-w-lg">
          {detailDialog.account && (() => {
            const acc = detailDialog.account;
            const status = getStatusIndicator(acc.status);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-sm bg-card border border-border">
                      {getSocialPlatformIcon(acc.platform, "h-7 w-7")}
                    </div>
                    <div>
                      <DialogTitle className="font-display text-xl">{getSocialPlatformLabel(acc.platform)}</DialogTitle>
                      <DialogDescription className="font-mono text-xs flex items-center gap-1.5 mt-0.5">
                        <div className={cn("h-2 w-2 rounded-full", status.color)} />
                        <span className={status.textColor}>{status.label}</span>
                        <span className="text-muted-foreground mx-1">•</span>
                        <span className="text-muted-foreground">{getOwnerLabel(acc)}</span>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {editMode ? (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase tracking-wider">Account Name</Label>
                        <Input
                          value={editForm.accountName}
                          onChange={(e) => setEditForm({ ...editForm, accountName: e.target.value })}
                          data-testid="input-edit-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-mono text-xs uppercase tracking-wider">Profile URL</Label>
                        <Input
                          value={editForm.accountUrl}
                          onChange={(e) => setEditForm({ ...editForm, accountUrl: e.target.value })}
                          data-testid="input-edit-url"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setEditMode(false)} className="font-mono text-xs">Cancel</Button>
                        <Button size="sm" onClick={handleSaveEdit} disabled={updateAccount.isPending} className="font-mono text-xs bg-primary hover:bg-primary/90">
                          {updateAccount.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-sm border border-border/50 bg-card/30 divide-y divide-border/30">
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Account</span>
                        <span className="text-sm font-mono">{acc.accountName}</span>
                      </div>
                      {acc.accountUrl && (
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">URL</span>
                          <a href={acc.accountUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-primary hover:underline truncate max-w-[200px]">{acc.accountUrl}</a>
                        </div>
                      )}
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Owner</span>
                        <span className="text-sm font-mono">{getOwnerLabel(acc)}</span>
                      </div>
                      <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Connected</span>
                        <span className="text-sm font-mono">{acc.createdAt ? new Date(acc.createdAt).toLocaleDateString() : "—"}</span>
                      </div>
                      {acc.lastPostedAt && (
                        <div className="flex items-center justify-between px-4 py-3">
                          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Last Post</span>
                          <span className="text-sm font-mono">{new Date(acc.lastPostedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {canEdit && !editMode && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setEditMode(true); setEditForm({ accountName: acc.accountName, accountUrl: acc.accountUrl || "" }); }}
                        className="font-mono text-xs"
                        data-testid="button-edit-account"
                      >
                        <Edit3 className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(acc.id)}
                        disabled={testingId === acc.id}
                        className="font-mono text-xs"
                        data-testid="button-test-connection"
                      >
                        {testingId === acc.id ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Zap className="h-3 w-3 mr-1" />}
                        Test
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(acc.id, acc.platform)}
                        className="text-red-500 border-red-500/30 hover:bg-red-500/10 font-mono text-xs"
                        data-testid="button-disconnect-account"
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Remove
                      </Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ApiKeyManagement({ canEdit }: { canEdit: boolean }) {
  const { data: keys, isLoading } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const deleteKey = useDeleteApiKey();
  const { toast } = useToast();
  const [createDialog, setCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyRevealed, setNewKeyRevealed] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCreate = () => {
    if (!newKeyName.trim()) return;
    createKey.mutate({ name: newKeyName }, {
      onSuccess: (data: any) => {
        setNewKeyRevealed(data.rawKey);
        setNewKeyName("");
        toast({ title: "API Key Created", description: "Copy the key now - it won't be shown again." });
      },
      onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const activeKeys = keys?.filter((k: any) => !k.revokedAt) || [];
  const revokedKeys = keys?.filter((k: any) => k.revokedAt) || [];

  return (
    <div className="border border-border bg-card/50 p-4 sm:p-6 space-y-5 lg:col-span-2" data-testid="section-api-keys">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <SectionHeader icon={Key} title="API Keys" description="Manage programmatic access to the platform" />
        {canEdit && (
          <Button
            onClick={() => { setCreateDialog(true); setNewKeyRevealed(null); setNewKeyName(""); }}
            className="bg-primary text-primary-foreground font-mono text-xs uppercase tracking-wider"
            size="sm"
            data-testid="button-create-api-key"
          >
            <Plus className="h-3 w-3 mr-1" /> New Key
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : activeKeys.length === 0 && revokedKeys.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border/50 rounded-sm">
          <Key className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No API keys yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Create a key to enable programmatic access</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeKeys.map((k: any) => (
            <div key={k.id} className="flex items-center gap-3 p-3 border border-border/50 bg-card/30 rounded-sm" data-testid={`api-key-${k.id}`}>
              <div className="h-8 w-8 border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-center flex-shrink-0">
                <Key className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{k.name}</p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                  <span>{k.keyPrefix}</span>
                  <span>Created {new Date(k.createdAt).toLocaleDateString()}</span>
                  {k.lastUsedAt && <span>Last used {new Date(k.lastUsedAt).toLocaleDateString()}</span>}
                </div>
              </div>
              <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/30 text-emerald-400">Active</Badge>
              {canEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeKey.mutate(k.id, {
                    onSuccess: () => toast({ title: "Key Revoked" }),
                    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
                  })}
                  className="text-amber-500 border-amber-500/30 hover:bg-amber-500/10 font-mono text-[10px] h-7"
                  data-testid={`button-revoke-${k.id}`}
                >
                  <Ban className="h-3 w-3 mr-1" /> Revoke
                </Button>
              )}
            </div>
          ))}

          {revokedKeys.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-2">Revoked Keys</p>
              {revokedKeys.map((k: any) => (
                <div key={k.id} className="flex items-center gap-3 p-3 border border-border/30 bg-card/20 rounded-sm opacity-60" data-testid={`api-key-revoked-${k.id}`}>
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground truncate">{k.name}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">{k.keyPrefix} - Revoked {new Date(k.revokedAt).toLocaleDateString()}</span>
                  </div>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteKey.mutate(k.id, {
                        onSuccess: () => toast({ title: "Key Deleted" }),
                      })}
                      className="text-red-500/50 hover:text-red-500 font-mono text-[10px] h-7"
                      data-testid={`button-delete-${k.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="glass-panel border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create API Key</DialogTitle>
            <DialogDescription className="font-mono text-xs">Generate a new key for programmatic access</DialogDescription>
          </DialogHeader>

          {newKeyRevealed ? (
            <div className="space-y-4">
              <div className="p-3 border border-amber-500/30 bg-amber-500/5 rounded-sm">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono mb-2">
                  <AlertTriangle className="h-3 w-3" />
                  Copy this key now - it won't be shown again
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-background border border-border px-3 py-2 text-xs font-mono break-all select-all">{newKeyRevealed}</code>
                  <Button variant="outline" size="sm" onClick={() => handleCopy(newKeyRevealed)} className="h-8 w-8 p-0 shrink-0" data-testid="button-copy-key">
                    {copiedKey ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setCreateDialog(false)} className="font-mono text-xs">Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase tracking-wider">Key Name</Label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g. Production API, CI/CD Pipeline"
                  data-testid="input-api-key-name"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setCreateDialog(false)} className="font-mono text-xs">Cancel</Button>
                <Button onClick={handleCreate} disabled={createKey.isPending || !newKeyName.trim()} className="bg-primary hover:bg-primary/90 font-mono text-xs">
                  {createKey.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Key className="h-3 w-3 mr-1" />}
                  Generate Key
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AuditLogViewer() {
  const [page, setPage] = useState(0);
  const pageSize = 20;
  const { data, isLoading } = useAuditLogs(pageSize, page * pageSize);
  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  function getActionBadge(action: string) {
    switch (action) {
      case "create": return { color: "border-emerald-500/30 text-emerald-400", label: "CREATE" };
      case "update": return { color: "border-blue-500/30 text-blue-400", label: "UPDATE" };
      case "delete": return { color: "border-red-500/30 text-red-400", label: "DELETE" };
      case "revoke": return { color: "border-amber-500/30 text-amber-400", label: "REVOKE" };
      case "login": return { color: "border-primary/30 text-primary", label: "LOGIN" };
      default: return { color: "border-border text-muted-foreground", label: action.toUpperCase() };
    }
  }

  function getResourceIcon(resource: string) {
    switch (resource) {
      case "api_key": return <Key className="h-3 w-3" />;
      case "user": return <Shield className="h-3 w-3" />;
      case "settings": return <Globe className="h-3 w-3" />;
      case "content": return <FileText className="h-3 w-3" />;
      default: return <Database className="h-3 w-3" />;
    }
  }

  return (
    <div className="border border-border bg-card/50 p-4 sm:p-6 space-y-5 lg:col-span-2" data-testid="section-audit-log">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <SectionHeader icon={ScrollText} title="Audit Log" description="Track all user actions and system events" />
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground flex-shrink-0">
          <Database className="h-3 w-3" />
          {total} total entries
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border/50 rounded-sm">
          <ScrollText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No audit log entries yet</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Actions will be recorded here as they occur</p>
        </div>
      ) : (
        <>
          <div className="border border-border/50 rounded-sm overflow-hidden overflow-x-auto">
            <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-3 px-4 py-2 bg-card/30 border-b border-border/30 text-[10px] font-mono uppercase tracking-wider text-muted-foreground min-w-[500px]">
              <span>Time</span>
              <span>Details</span>
              <span>User</span>
              <span>Action</span>
              <span>Resource</span>
            </div>
            <div className="divide-y divide-border/30">
              {logs.map((log: any) => {
                const badge = getActionBadge(log.action);
                return (
                  <div key={log.id} className="flex flex-col gap-2 px-4 py-2.5 sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto] sm:gap-3 sm:items-center text-sm" data-testid={`audit-log-${log.id}`}>
                    <div className="flex items-center justify-between sm:contents">
                      <span className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex items-center gap-2 sm:hidden">
                        <Badge variant="outline" className={cn("text-[9px] font-mono", badge.color)}>{badge.label}</Badge>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                          {getResourceIcon(log.resource)}
                          <span>{log.resource}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs truncate text-foreground/80">{log.details || "—"}</span>
                    <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[100px] hidden sm:block">{log.userName || "System"}</span>
                    <Badge variant="outline" className={cn("text-[9px] font-mono hidden sm:inline-flex", badge.color)}>{badge.label}</Badge>
                    <div className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                      {getResourceIcon(log.resource)}
                      <span>{log.resource}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                  className="font-mono text-xs h-7"
                  data-testid="button-audit-prev"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                  className="font-mono text-xs h-7"
                  data-testid="button-audit-next"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
