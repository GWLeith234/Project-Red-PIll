import { useState, useEffect, useMemo } from "react";
import PageHeader from "@/components/admin/PageHeader";
import MetricsStrip from "@/components/admin/MetricsStrip";
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
  Plug, Brain, Globe2, Smartphone, Cookie, Megaphone,
  MessageSquare, Rss, CreditCard, BarChart, HardDrive,
  BellRing, Bot, BookOpen, Palette, Gauge, ShieldCheck,
  Home, Navigation, Wrench, Lock,
  Activity, Target, TrendingUp, AlertCircle, ToggleLeft,
  Scale, ArrowLeft, ExternalLink, Minus,
  type LucideIcon,
} from "lucide-react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import UnderlineExt from '@tiptap/extension-underline';
import LinkExt from '@tiptap/extension-link';

const TABS = [
  { id: "branding", label: "Branding", icon: Paintbrush },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "ai-config", label: "AI Configuration", icon: Brain },
  { id: "platform-config", label: "Platform Configuration", icon: LayoutGrid },
  { id: "live-site", label: "Live Site & App", icon: Globe2 },
  { id: "legal", label: "Legal", icon: Scale },
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
  const [activeTab, setActiveTab] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "branding";
  });
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { hasPermission } = useAuth();
  const { toast } = useToast();
  const canEdit = hasPermission("settings.edit");
  const [smartLoading, setSmartLoading] = useState(false);
  const [smartReasons, setSmartReasons] = useState<Record<string, string>>({});
  const [smartApplied, setSmartApplied] = useState(false);

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

      <MetricsStrip metrics={[
        { label: "Active Integrations", value: "N/A" },
        { label: "AI Tokens Used Today", value: 0 },
        { label: "Pages Published", value: "N/A" },
        { label: "Active Sponsorships", value: "N/A" },
        { label: "Team Members", value: "N/A" },
        { label: "System Uptime", value: "99.9%" },
      ]} />

      <div className="flex items-center gap-1 border-b border-border mb-4 overflow-x-auto" data-testid="settings-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-[14px] font-medium transition-colors whitespace-nowrap border-b-2 -mb-px",
                activeTab === tab.id
                  ? "border-primary text-primary font-semibold"
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

      {activeTab === "branding" && <BrandingTab canEdit={canEdit} />}

      {activeTab === "integrations" && <IntegrationsTab />}

      {activeTab === "ai-config" && <AIConfigurationTab />}

      {activeTab === "platform-config" && <PageConfigurationTab />}

      {activeTab === "live-site" && <LiveSiteAppTab />}

      {activeTab === "legal" && <LegalTab />}
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

function BrandingTab({ canEdit }: { canEdit: boolean }) {
  const { toast } = useToast();
  const { setTheme } = useTheme();
  const { data: branding, isLoading: brandingLoading } = useBranding();
  const updateBranding = useUpdateBranding();
  const { data: podcasts } = usePodcasts();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    identity: true, logos: true, colors: true, typography: true, email: true, shows: true,
  });

  const [form, setForm] = useState({
    companyName: "", tagline: "",
    logoUrl: "", logoDarkUrl: "", faviconUrl: "", ogImageUrl: "", pushNotificationIconUrl: "", watermarkUrl: "",
    primaryColor: "#1D4ED8", secondaryColor: "#6C3FC5", accentColor: "#F59E0B",
    backgroundColor: "#0f172a", surfaceColor: "", textPrimaryColor: "", textSecondaryColor: "",
    borderColor: "", successColor: "#22C55E", warningColor: "#F59E0B", dangerColor: "#EF4444",
    themeMode: "dark" as string,
    fontHeading: "Inter", fontBody: "Inter", fontScale: "medium", lineHeight: "normal",
    emailLogoUrl: "", emailFooterText: "",
  });

  const [logoUploading, setLogoUploading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (branding) {
      setForm({
        companyName: (branding as any).companyName || "",
        tagline: (branding as any).tagline || "",
        logoUrl: (branding as any).logoUrl || "",
        logoDarkUrl: (branding as any).logoDarkUrl || "",
        faviconUrl: (branding as any).faviconUrl || "",
        ogImageUrl: (branding as any).ogImageUrl || "",
        pushNotificationIconUrl: (branding as any).pushNotificationIconUrl || "",
        watermarkUrl: (branding as any).watermarkUrl || "",
        primaryColor: (branding as any).primaryColor || "#1D4ED8",
        secondaryColor: (branding as any).secondaryColor || "#6C3FC5",
        accentColor: (branding as any).accentColor || "#F59E0B",
        backgroundColor: (branding as any).backgroundColor || "#0f172a",
        surfaceColor: (branding as any).surfaceColor || "",
        textPrimaryColor: (branding as any).textPrimaryColor || "",
        textSecondaryColor: (branding as any).textSecondaryColor || "",
        borderColor: (branding as any).borderColor || "",
        successColor: (branding as any).successColor || "#22C55E",
        warningColor: (branding as any).warningColor || "#F59E0B",
        dangerColor: (branding as any).dangerColor || "#EF4444",
        themeMode: (branding as any).themeMode || "dark",
        fontHeading: (branding as any).fontHeading || "Inter",
        fontBody: (branding as any).fontBody || "Inter",
        fontScale: (branding as any).fontScale || "medium",
        lineHeight: (branding as any).lineHeight || "normal",
        emailLogoUrl: (branding as any).emailLogoUrl || "",
        emailFooterText: (branding as any).emailFooterText || "",
      });
    }
  }, [branding]);

  const updateField = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  const saveSection = async (sectionName: string, fields: Record<string, any>) => {
    setSaving(sectionName);
    try {
      await updateBranding.mutateAsync(fields);
      toast({ title: `${sectionName} Saved`, description: "Changes have been applied." });
    } catch {
      toast({ title: "Error", description: `Failed to save ${sectionName.toLowerCase()}`, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const saveAll = async () => {
    setSaving("all");
    try {
      await updateBranding.mutateAsync(form);
      toast({ title: "All Branding Saved", description: "All branding settings have been updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save branding settings", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldKey: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    setLogoUploading(true);
    try {
      const urlRes = await fetch("/api/uploads/request-url", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
      });
      if (!urlRes.ok) throw new Error("Failed to get upload URL");
      const { uploadURL, objectPath } = await urlRes.json();
      const uploadRes = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      if (!uploadRes.ok) throw new Error("Upload failed");
      updateField(fieldKey, objectPath);
      await updateBranding.mutateAsync({ [fieldKey]: objectPath });
      toast({ title: "Image Uploaded", description: "Your image has been saved." });
    } catch (err: any) {
      toast({ title: "Upload Error", description: err.message, variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  };

  const toggleSection = (key: string) => setExpanded(e => ({ ...e, [key]: !e[key] }));

  const COLOR_PRESETS = [
    { name: "Salem Dark", colors: { primaryColor: "#1D4ED8", accentColor: "#F59E0B", backgroundColor: "#0f172a", successColor: "#22C55E", warningColor: "#F59E0B", dangerColor: "#EF4444" } },
    { name: "Salem Light", colors: { primaryColor: "#2563EB", accentColor: "#D97706", backgroundColor: "#f8fafc", successColor: "#16A34A", warningColor: "#D97706", dangerColor: "#DC2626" } },
    { name: "Bold Red", colors: { primaryColor: "#DC2626", accentColor: "#F59E0B", backgroundColor: "#1a1a1a", successColor: "#22C55E", warningColor: "#F59E0B", dangerColor: "#EF4444" } },
    { name: "Deep Navy", colors: { primaryColor: "#1E3A5F", accentColor: "#0EA5E9", backgroundColor: "#0c1929", successColor: "#22C55E", warningColor: "#F59E0B", dangerColor: "#EF4444" } },
    { name: "Slate", colors: { primaryColor: "#475569", accentColor: "#8B5CF6", backgroundColor: "#1e293b", successColor: "#22C55E", warningColor: "#F59E0B", dangerColor: "#EF4444" } },
  ];

  const FONT_OPTIONS = [
    { value: "Inter", label: "Inter" },
    { value: "Roboto", label: "Roboto" },
    { value: "Playfair Display", label: "Playfair Display" },
    { value: "Merriweather", label: "Merriweather" },
    { value: "Georgia", label: "Georgia" },
    { value: "Arial", label: "Arial" },
  ];

  const FONT_SCALE_OPTIONS = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
    { value: "x-large", label: "X-Large" },
  ];

  const LINE_HEIGHT_OPTIONS = [
    { value: "tight", label: "Tight" },
    { value: "normal", label: "Normal" },
    { value: "relaxed", label: "Relaxed" },
  ];

  function CollapsibleSection({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) {
    return (
      <div className="border border-border bg-card/50" data-testid={`section-${id}`}>
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-card/80 transition-colors"
          data-testid={`button-toggle-${id}`}
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 border border-primary/30 bg-primary/5 flex items-center justify-center">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">{title}</h3>
          </div>
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", !expanded[id] && "-rotate-90")} />
        </button>
        {expanded[id] && <div className="px-4 sm:px-5 pb-5 space-y-5 border-t border-border/50 pt-5">{children}</div>}
      </div>
    );
  }

  function ImageField({ label, description, fieldKey, recommended }: { label: string; description: string; fieldKey: string; recommended: string }) {
    const value = (form as any)[fieldKey] || "";
    return (
      <div className="space-y-2" data-testid={`image-field-${fieldKey}`}>
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block">
          <span className="flex items-center gap-1.5"><ImageIcon className="h-3 w-3" />{label}</span>
        </label>
        <div className="flex items-start gap-4">
          {value ? (
            <div className="relative group">
              <div className="h-16 w-40 border border-border bg-background flex items-center justify-center p-2">
                <img src={value} alt={label} className="max-h-full max-w-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              {canEdit && (
                <button
                  onClick={() => { updateField(fieldKey, ""); updateBranding.mutate({ [fieldKey]: "" }); }}
                  className="absolute -top-2 -right-2 h-5 w-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-clear-${fieldKey}`}
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
          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={value}
              onChange={(e) => updateField(fieldKey, e.target.value)}
              placeholder="Enter image URL..."
              disabled={!canEdit}
              className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50 placeholder:text-muted-foreground/50"
              data-testid={`input-${fieldKey}`}
            />
            {canEdit && (
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-muted-foreground text-xs font-mono uppercase tracking-wider hover:border-primary/30 hover:text-foreground transition-colors cursor-pointer">
                {logoUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                Upload
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, fieldKey)} className="sr-only" data-testid={`upload-${fieldKey}`} />
              </label>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">{description} — {recommended}</p>
      </div>
    );
  }

  function ColorField({ label, fieldKey, description, readOnly }: { label: string; fieldKey: string; description?: string; readOnly?: boolean }) {
    const value = (form as any)[fieldKey] || "#000000";
    return (
      <div className="flex items-center gap-3" data-testid={`color-field-${fieldKey}`}>
        <input
          type="color"
          value={value}
          onChange={(e) => !readOnly && updateField(fieldKey, e.target.value)}
          disabled={!canEdit || readOnly}
          className="h-9 w-9 border border-border cursor-pointer disabled:cursor-not-allowed bg-transparent p-0"
          data-testid={`color-picker-${fieldKey}`}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">{label}</span>
            {readOnly && <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Locked</Badge>}
          </div>
          {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => !readOnly && updateField(fieldKey, e.target.value)}
          disabled={!canEdit || readOnly}
          className="w-24 bg-background border border-border px-2 py-1 text-xs font-mono text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
          data-testid={`input-color-${fieldKey}`}
        />
        <div className="h-6 w-6 border border-border" style={{ backgroundColor: value }} />
      </div>
    );
  }

  function SaveSectionButton({ sectionName, fields }: { sectionName: string; fields: Record<string, any> }) {
    if (!canEdit) return null;
    return (
      <button
        onClick={() => saveSection(sectionName, fields)}
        disabled={saving !== null}
        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-mono uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50"
        data-testid={`button-save-${sectionName.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {saving === sectionName ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        Save {sectionName}
      </button>
    );
  }

  if (brandingLoading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4" data-testid="branding-tab">
      <CollapsibleSection id="identity" title="Platform Identity" icon={Building2}>
        <div className="space-y-4">
          <div data-testid="field-platform-name">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">
              <span className="flex items-center gap-1.5"><Building2 className="h-3 w-3" />Platform Name</span>
            </label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value.slice(0, 50))}
              placeholder="e.g. MediaTech Empire"
              disabled={!canEdit}
              maxLength={50}
              className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50 placeholder:text-muted-foreground/50"
              data-testid="input-platform-name"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Displayed in the sidebar, emails, and public pages ({form.companyName.length}/50)</p>
          </div>

          <div data-testid="field-tagline">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">
              <span className="flex items-center gap-1.5"><FileText className="h-3 w-3" />Tagline</span>
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => updateField("tagline", e.target.value.slice(0, 100))}
              placeholder="e.g. Conservative Media Powered by AI"
              disabled={!canEdit}
              maxLength={100}
              className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50 placeholder:text-muted-foreground/50"
              data-testid="input-tagline"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Short description shown under the platform name ({form.tagline.length}/100)</p>
          </div>

          <div className="bg-muted/30 border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2">Sidebar Preview</p>
            <div className="bg-card border border-border p-3 flex items-center gap-3 max-w-xs">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="" className="h-8 max-w-[100px] object-contain" />
              ) : (
                <div className="h-8 w-8 bg-primary/10 border border-primary/30 flex items-center justify-center"><Building2 className="h-4 w-4 text-primary" /></div>
              )}
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">{form.companyName || "Platform Name"}</p>
                <p className="text-[10px] text-muted-foreground">{form.tagline || "Your tagline here"}</p>
              </div>
            </div>
          </div>

          <SaveSectionButton sectionName="Platform Identity" fields={{ companyName: form.companyName, tagline: form.tagline }} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="logos" title="Logos & Icons" icon={ImageIcon}>
        <div className="space-y-6">
          <ImageField label="Primary Logo (Light)" description="Used in audience site header and light mode" fieldKey="logoUrl" recommended="SVG/PNG transparent, max 200px wide" />
          <ImageField label="Primary Logo (Dark)" description="Used in dark mode and dark email templates" fieldKey="logoDarkUrl" recommended="White/light version" />
          <ImageField label="Favicon" description="Browser tab icon, bookmarks, PWA home screen" fieldKey="faviconUrl" recommended="32x32 or 64x64 PNG" />

          {form.faviconUrl && (
            <div className="bg-muted/30 border border-border p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2">Browser Tab Preview</p>
              <div className="bg-card border border-border inline-flex items-center gap-2 px-3 py-1.5 rounded-t-lg">
                <img src={form.faviconUrl} alt="" className="h-4 w-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="text-xs text-foreground truncate max-w-[120px]">{form.companyName || "Page Title"}</span>
                <X className="h-3 w-3 text-muted-foreground" />
              </div>
            </div>
          )}

          <ImageField label="Default Social Share Image" description="Shown when content shared on social without a specific image" fieldKey="ogImageUrl" recommended="1200x630px" />

          {form.ogImageUrl && (
            <div className="bg-muted/30 border border-border p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-2">Social Share Card Preview</p>
              <div className="bg-card border border-border max-w-sm overflow-hidden">
                <div className="h-40 bg-muted relative">
                  <img src={form.ogImageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-black/30 flex items-end p-3">
                    <span className="text-white text-sm font-semibold">{form.companyName || "Platform"}</span>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-xs text-muted-foreground uppercase">{form.companyName || "platform"}.com</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{form.companyName || "Platform Name"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{form.tagline || "Your platform description"}</p>
                </div>
              </div>
            </div>
          )}

          <ImageField label="Push Notification Icon" description="Shown in browser and mobile push notifications" fieldKey="pushNotificationIconUrl" recommended="192x192 PNG" />
          <ImageField label="AI Image Watermark" description="Applied to AI-generated images" fieldKey="watermarkUrl" recommended="PNG with transparency" />

          <SaveSectionButton sectionName="Logos & Icons" fields={{
            logoUrl: form.logoUrl, logoDarkUrl: form.logoDarkUrl, faviconUrl: form.faviconUrl,
            ogImageUrl: form.ogImageUrl, pushNotificationIconUrl: form.pushNotificationIconUrl, watermarkUrl: form.watermarkUrl,
          }} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="colors" title="Colors" icon={Palette}>
        <div className="space-y-5">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-3">Color Presets</p>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => { if (!canEdit) return; setForm(f => ({ ...f, ...preset.colors })); }}
                  className="flex items-center gap-2 px-3 py-2 border border-border bg-card/50 hover:border-primary/50 transition-colors text-xs font-medium"
                  data-testid={`preset-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="flex gap-0.5">
                    {Object.values(preset.colors).slice(0, 3).map((c, i) => (
                      <div key={i} className="h-4 w-4 border border-border/50" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono mb-3">Theme Default</p>
            <div className="flex gap-2">
              {([
                { value: "dark", label: "Dark", icon: Moon },
                { value: "light", label: "Light", icon: Sun },
                { value: "system", label: "System", icon: Monitor },
              ] as const).map((opt) => {
                const ThIcon = opt.icon;
                const isActive = form.themeMode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { if (!canEdit) return; updateField("themeMode", opt.value); setTheme(opt.value); }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 border-2 transition-all text-sm",
                      isActive ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground/30"
                    )}
                    data-testid={`theme-option-${opt.value}`}
                  >
                    <ThIcon className="h-4 w-4" />
                    {opt.label}
                    {isActive && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <ColorField label="Primary Color" fieldKey="primaryColor" description="Buttons, active states, links" />
            <ColorField label="Secondary Color" fieldKey="secondaryColor" description="AI actions are always purple for consistency" readOnly />
            <ColorField label="Accent Color" fieldKey="accentColor" description="Highlights, badges, callouts" />
            <ColorField label="Background Color" fieldKey="backgroundColor" description="Admin background" />
            <ColorField label="Surface Color" fieldKey="surfaceColor" description="Cards, panels" />
            <ColorField label="Text Primary" fieldKey="textPrimaryColor" description="Main text color" />
            <ColorField label="Text Secondary / Muted" fieldKey="textSecondaryColor" description="Secondary text, labels" />
            <ColorField label="Border Color" fieldKey="borderColor" description="Borders, dividers" />
            <ColorField label="Success" fieldKey="successColor" description="Success states, confirmations" />
            <ColorField label="Warning" fieldKey="warningColor" description="Warnings, caution states" />
            <ColorField label="Danger" fieldKey="dangerColor" description="Errors, destructive actions" />
          </div>

          <SaveSectionButton sectionName="Colors" fields={{
            primaryColor: form.primaryColor, secondaryColor: form.secondaryColor, accentColor: form.accentColor,
            backgroundColor: form.backgroundColor, surfaceColor: form.surfaceColor,
            textPrimaryColor: form.textPrimaryColor, textSecondaryColor: form.textSecondaryColor,
            borderColor: form.borderColor, successColor: form.successColor, warningColor: form.warningColor,
            dangerColor: form.dangerColor, themeMode: form.themeMode,
          }} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="typography" title="Typography" icon={FileIcon}>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-testid="field-font-heading">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">Heading Font</label>
              <select
                value={form.fontHeading}
                onChange={(e) => updateField("fontHeading", e.target.value)}
                disabled={!canEdit}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
                data-testid="select-font-heading"
              >
                {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div data-testid="field-font-body">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">Body Font</label>
              <select
                value={form.fontBody}
                onChange={(e) => updateField("fontBody", e.target.value)}
                disabled={!canEdit}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer disabled:opacity-50"
                data-testid="select-font-body"
              >
                {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div data-testid="field-font-scale">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">Font Scale</label>
              <div className="flex gap-1">
                {FONT_SCALE_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => canEdit && updateField("fontScale", o.value)}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-xs border transition-colors",
                      form.fontScale === o.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground/30"
                    )}
                    data-testid={`font-scale-${o.value}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div data-testid="field-line-height">
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">Line Height</label>
              <div className="flex gap-1">
                {LINE_HEIGHT_OPTIONS.map(o => (
                  <button
                    key={o.value}
                    onClick={() => canEdit && updateField("lineHeight", o.value)}
                    className={cn(
                      "flex-1 px-2 py-1.5 text-xs border transition-colors",
                      form.lineHeight === o.value ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-muted-foreground/30"
                    )}
                    data-testid={`line-height-${o.value}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border border-border p-5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-3">Preview</p>
            <div style={{ fontFamily: form.fontHeading }}>
              <h3 className="text-xl font-bold text-foreground mb-2">The Quick Brown Fox Jumps</h3>
            </div>
            <div style={{ fontFamily: form.fontBody }}>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
              </p>
            </div>
            <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold" style={{ fontFamily: form.fontBody }}>
              Sample Button
            </button>
          </div>

          <SaveSectionButton sectionName="Typography" fields={{ fontHeading: form.fontHeading, fontBody: form.fontBody, fontScale: form.fontScale, lineHeight: form.lineHeight }} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="email" title="Email Branding" icon={Mail}>
        <div className="space-y-5">
          <ImageField label="Email Logo" description="Displayed at the top of all outgoing emails" fieldKey="emailLogoUrl" recommended="PNG, max 400px wide" />

          <div data-testid="field-email-footer">
            <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1.5">
              <span className="flex items-center gap-1.5"><FileText className="h-3 w-3" />Email Footer Text</span>
            </label>
            <textarea
              value={form.emailFooterText}
              onChange={(e) => updateField("emailFooterText", e.target.value)}
              placeholder="© 2026 Salem Media. All rights reserved. | Unsubscribe"
              disabled={!canEdit}
              rows={3}
              className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50 placeholder:text-muted-foreground/50 resize-none"
              data-testid="input-email-footer"
            />
          </div>

          <div className="bg-muted/30 border border-border p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono mb-3">Email Preview</p>
            <div className="bg-white border border-gray-200 max-w-md mx-auto overflow-hidden rounded">
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-center min-h-[60px]">
                {form.emailLogoUrl ? (
                  <img src={form.emailLogoUrl} alt="" className="max-h-10 max-w-[200px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="text-gray-400 text-sm font-semibold">{form.companyName || "Your Logo"}</span>
                )}
              </div>
              <div className="p-5">
                <div className="h-3 w-3/4 bg-gray-200 rounded mb-3" />
                <div className="h-2 w-full bg-gray-100 rounded mb-2" />
                <div className="h-2 w-full bg-gray-100 rounded mb-2" />
                <div className="h-2 w-2/3 bg-gray-100 rounded mb-4" />
                <div className="h-8 w-32 bg-blue-500 rounded" />
              </div>
              <div className="bg-gray-50 border-t border-gray-200 p-3">
                <p className="text-[10px] text-gray-400 text-center">{form.emailFooterText || "\u00a9 2026 Company. All rights reserved."}</p>
              </div>
            </div>
          </div>

          <SaveSectionButton sectionName="Email Branding" fields={{ emailLogoUrl: form.emailLogoUrl, emailFooterText: form.emailFooterText }} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection id="shows" title="Show & Podcast Branding" icon={Mic}>
        <div className="space-y-4">
          {!podcasts || (podcasts as any[]).length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No podcasts found. Add podcasts in the Content Factory to configure show branding.</p>
          ) : (
            <div className="border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">Show Name</th>
                    <th className="text-left px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hidden md:table-cell">Hero Image</th>
                    <th className="text-left px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hidden md:table-cell">Accent Color</th>
                    <th className="text-left px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Host Image</th>
                    <th className="text-left px-4 py-2.5 text-xs font-mono uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(podcasts as any[]).map((podcast: any) => {
                    const hasBranding = !!(podcast.heroImageUrl || podcast.imageUrl);
                    return (
                      <tr key={podcast.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors" data-testid={`show-row-${podcast.id}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {podcast.imageUrl ? (
                              <img src={podcast.imageUrl} alt="" className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 bg-muted rounded flex items-center justify-center"><Mic className="h-4 w-4 text-muted-foreground" /></div>
                            )}
                            <span className="font-medium text-foreground">{podcast.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {podcast.heroImageUrl ? (
                            <div className="h-8 w-14 rounded overflow-hidden border border-border">
                              <img src={podcast.heroImageUrl} alt="" className="h-full w-full object-cover" />
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">\u2014</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {podcast.accentColor ? (
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded border border-border" style={{ backgroundColor: podcast.accentColor }} />
                              <span className="text-xs font-mono text-muted-foreground">{podcast.accentColor}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">\u2014</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {podcast.hostImageUrl ? (
                            <img src={podcast.hostImageUrl} alt="" className="h-8 w-8 rounded-full object-cover border border-border" />
                          ) : (
                            <span className="text-xs text-muted-foreground">\u2014</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={hasBranding ? "default" : "secondary"} className={cn("text-[10px]", hasBranding ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" : "")}>
                            {hasBranding ? "Branded" : "Needs Setup"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">To edit individual show branding, go to the show detail page in Content Factory \u2192 Branding tab.</p>
        </div>
      </CollapsibleSection>

      {canEdit && (
        <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4 -mx-4 sm:-mx-6 flex justify-end z-10">
          <button
            onClick={saveAll}
            disabled={saving !== null}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50"
            data-testid="button-save-all-branding"
          >
            {saving === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save All Branding
          </button>
        </div>
      )}
    </div>
  );
}

function IntegrationsTab() {
  const { toast } = useToast();
  const { data: integrations, isLoading } = useQuery({
    queryKey: ["/api/settings/integrations"],
    queryFn: () => fetch("/api/settings/integrations", { credentials: "include" }).then(r => r.json()),
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    social: true, podcast: true, email: true, sms: true, push: true, analytics: true, storage: true, payment: true
  });

  useEffect(() => {
    if (integrations) setForm(prev => ({ ...integrations, ...Object.fromEntries(Object.entries(prev).filter(([_, v]) => v !== "")) }));
  }, [integrations]);

  const f = (key: string) => form[key] || "";
  const setF = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(prev => ({ ...prev, [key]: true }));
  };
  const toggleVis = (key: string) => setVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleSection = (id: string) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const saveSection = async (sectionName: string, keys: string[]) => {
    setSaving(prev => ({ ...prev, [sectionName]: true }));
    try {
      const payload: Record<string, string> = {};
      keys.forEach(k => { payload[k] = f(k); });
      const res = await fetch("/api/settings/integrations", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      setForm(prev => ({ ...prev, ...updated }));
      keys.forEach(k => setDirty(prev => ({ ...prev, [k]: false })));
      queryClient.invalidateQueries({ queryKey: ["/api/settings/integrations"] });
      toast({ title: `${sectionName} settings saved` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  const testConnection = async (integration: string, label: string) => {
    setTesting(prev => ({ ...prev, [integration]: true }));
    try {
      const res = await fetch(`/api/settings/integrations/test/${integration}`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      toast({
        title: result.success ? `${label} Connected` : `${label} Test Failed`,
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } catch (e: any) {
      toast({ title: "Test Failed", description: e.message, variant: "destructive" });
    } finally {
      setTesting(prev => ({ ...prev, [integration]: false }));
    }
  };

  const hasValue = (key: string) => {
    const v = f(key);
    return v !== "" && v !== undefined;
  };

  type StatusType = "connected" | "partial" | "not_configured";
  const getStatus = (requiredKeys: string[]): StatusType => {
    const filled = requiredKeys.filter(k => hasValue(k)).length;
    if (filled === 0) return "not_configured";
    if (filled === requiredKeys.length) return "connected";
    return "partial";
  };

  const statusBadge = (status: StatusType) => {
    const cfg = {
      connected: { dot: "bg-emerald-500", text: "Connected", cls: "border-emerald-500/30 text-emerald-500" },
      partial: { dot: "bg-yellow-500", text: "Partial", cls: "border-yellow-500/30 text-yellow-500" },
      not_configured: { dot: "bg-muted-foreground/40", text: "Not Configured", cls: "border-border text-muted-foreground" },
    }[status];
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border", cfg.cls)}>
        <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
        {cfg.text}
      </span>
    );
  };

  function SecureField({ label, fieldKey, testId }: { label: string; fieldKey: string; testId: string }) {
    const isVisible = visibility[fieldKey];
    return (
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">{label}</label>
        <div className="flex gap-1">
          <input
            type={isVisible ? "text" : "password"}
            value={f(fieldKey)}
            onChange={(e) => setF(fieldKey, e.target.value)}
            placeholder={hasValue(fieldKey) && !dirty[fieldKey] ? "••••••••••••" : ""}
            className="flex-1 bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50 font-mono"
            data-testid={testId}
          />
          <button onClick={() => toggleVis(fieldKey)} className="px-2 border border-border bg-card hover:bg-muted transition-colors" data-testid={`toggle-${testId}`}>
            {isVisible ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        </div>
      </div>
    );
  }

  function TextField({ label, fieldKey, testId, readOnly, placeholder, note }: { label: string; fieldKey: string; testId: string; readOnly?: boolean; placeholder?: string; note?: string }) {
    return (
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">{label}</label>
        <input
          type="text"
          value={f(fieldKey)}
          onChange={(e) => setF(fieldKey, e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className={cn("w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50", readOnly && "opacity-60 cursor-not-allowed")}
          data-testid={testId}
        />
        {note && <p className="text-[11px] text-muted-foreground mt-1">{note}</p>}
      </div>
    );
  }

  function IntegrationCard({ name, icon: Icon, status, children, testId }: { name: string; icon: any; status: StatusType; children: React.ReactNode; testId: string }) {
    return (
      <div className="border border-border bg-card/30 p-4 space-y-3" data-testid={testId}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 border border-muted-foreground/20 bg-muted/20 flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">{name}</span>
          </div>
          {statusBadge(status)}
        </div>
        <div className="space-y-3">{children}</div>
      </div>
    );
  }

  function SectionSaveButton({ sectionName, keys }: { sectionName: string; keys: string[] }) {
    const isSaving = saving[sectionName];
    return (
      <button
        onClick={() => saveSection(sectionName, keys)}
        disabled={isSaving}
        className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 border border-primary/30 text-primary text-xs font-mono uppercase tracking-wider hover:bg-primary/20 transition-colors disabled:opacity-50 mt-3"
        data-testid={`button-save-${sectionName.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        Save {sectionName}
      </button>
    );
  }

  function TestButton({ integration, label }: { integration: string; label: string }) {
    const isTesting = testing[integration];
    return (
      <button
        onClick={() => testConnection(integration, label)}
        disabled={isTesting}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-xs font-mono uppercase tracking-wider hover:border-primary/30 hover:text-primary transition-colors disabled:opacity-50"
        data-testid={`button-test-${integration}`}
      >
        {isTesting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wifi className="h-3 w-3" />}
        Test Connection
      </button>
    );
  }

  function CollapsibleIntSection({ id, title, icon: Icon, status, children }: { id: string; title: string; icon: any; status: StatusType; children: React.ReactNode }) {
    const isOpen = openSections[id] !== false;
    return (
      <div className="border border-border bg-card/50" data-testid={`section-${id}`}>
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          data-testid={`toggle-section-${id}`}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border border-muted-foreground/20 bg-muted/20 flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            {statusBadge(status)}
            {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        </button>
        {isOpen && <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">{children}</div>}
      </div>
    );
  }

  const socialKeys = ["twitter_api_key", "twitter_api_secret", "twitter_access_token", "twitter_access_secret", "facebook_page_id", "facebook_access_token", "linkedin_org_id", "linkedin_access_token", "instagram_account_id", "youtube_channel_id", "youtube_api_key"];
  const podcastKeys = ["apple_podcasts_feed_url", "spotify_show_id", "iheart_feed_url", "rss_feed_url"];
  const emailKeys = ["email_provider", "sendgrid_api_key", "smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_from_name", "smtp_from_email", "mailgun_api_key", "mailgun_domain"];
  const smsKeys = ["twilio_account_sid", "twilio_auth_token", "twilio_phone_number"];
  const pushKeys = ["vapid_public_key", "vapid_private_key", "vapid_subject", "firebase_server_key"];
  const analyticsKeys = ["google_analytics_id", "meta_pixel_id", "gtm_container_id"];
  const storageKeys = ["storage_provider", "s3_bucket", "s3_region", "s3_access_key", "s3_secret_key", "cloudflare_r2_account_id", "cloudflare_r2_access_key", "cloudflare_r2_secret_key", "cloudflare_r2_bucket"];
  const paymentKeys = ["stripe_publishable_key", "stripe_secret_key", "stripe_webhook_secret"];

  const twitterStatus = getStatus(["twitter_api_key", "twitter_api_secret", "twitter_access_token", "twitter_access_secret"]);
  const facebookStatus = getStatus(["facebook_page_id", "facebook_access_token"]);
  const linkedinStatus = getStatus(["linkedin_org_id", "linkedin_access_token"]);
  const instagramStatus = getStatus(["instagram_account_id"]);
  const youtubeStatus = getStatus(["youtube_channel_id", "youtube_api_key"]);
  const socialConnected = [twitterStatus, facebookStatus, linkedinStatus, instagramStatus, youtubeStatus].filter(s => s === "connected").length;

  const emailProvider = f("email_provider");
  const emailStatus = (() => {
    if (emailProvider === "sendgrid") return getStatus(["sendgrid_api_key"]);
    if (emailProvider === "smtp") return getStatus(["smtp_host", "smtp_username", "smtp_password"]);
    if (emailProvider === "mailgun") return getStatus(["mailgun_api_key", "mailgun_domain"]);
    return "not_configured" as StatusType;
  })();
  const smsStatus = getStatus(smsKeys);
  const pushStatus = getStatus(["vapid_public_key", "vapid_private_key"]);
  const gaStatus = getStatus(["google_analytics_id"]);
  const pixelStatus = getStatus(["meta_pixel_id"]);
  const gtmStatus = getStatus(["gtm_container_id"]);
  const analyticsConnected = [gaStatus, pixelStatus, gtmStatus].filter(s => s === "connected").length;
  const storageProvider = f("storage_provider");
  const storageStatus = (() => {
    if (storageProvider === "s3") return getStatus(["s3_bucket", "s3_region", "s3_access_key", "s3_secret_key"]);
    if (storageProvider === "cloudflare_r2") return getStatus(["cloudflare_r2_account_id", "cloudflare_r2_bucket", "cloudflare_r2_access_key", "cloudflare_r2_secret_key"]);
    if (storageProvider === "local") return "connected" as StatusType;
    return "not_configured" as StatusType;
  })();
  const stripeStatus = getStatus(["stripe_publishable_key", "stripe_secret_key"]);

  const overallSocialStatus: StatusType = socialConnected === 5 ? "connected" : socialConnected > 0 ? "partial" : "not_configured";
  const overallAnalyticsStatus: StatusType = analyticsConnected === 3 ? "connected" : analyticsConnected > 0 ? "partial" : "not_configured";

  const summaryCards = [
    { id: "social", icon: MessageSquare, label: "Social", detail: `${socialConnected}/5`, status: overallSocialStatus },
    { id: "podcast", icon: Rss, label: "Podcast", detail: hasValue("rss_feed_url") ? "✓" : "-", status: hasValue("rss_feed_url") ? "connected" as StatusType : "not_configured" as StatusType },
    { id: "email", icon: Mail, label: "Email", detail: emailStatus === "connected" ? "✓" : "-", status: emailStatus },
    { id: "sms", icon: Smartphone, label: "SMS", detail: smsStatus === "connected" ? "✓" : "-", status: smsStatus },
    { id: "push", icon: BellRing, label: "Push", detail: pushStatus === "connected" ? "✓" : "-", status: pushStatus },
    { id: "analytics", icon: BarChart, label: "Analytics", detail: `${analyticsConnected}/3`, status: overallAnalyticsStatus },
    { id: "storage", icon: HardDrive, label: "Storage", detail: storageStatus === "connected" ? "✓" : "-", status: storageStatus },
    { id: "payment", icon: CreditCard, label: "Payment", detail: stripeStatus === "connected" ? "✓" : "-", status: stripeStatus },
  ];

  const handleCopyRss = () => {
    const url = f("rss_feed_url") || `${window.location.origin}/api/public/rss`;
    navigator.clipboard.writeText(url);
    toast({ title: "RSS Feed URL copied to clipboard" });
  };

  const handleGenerateVapid = async () => {
    const array = new Uint8Array(65);
    crypto.getRandomValues(array);
    const publicKey = btoa(String.fromCharCode(...array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const privateArray = new Uint8Array(32);
    crypto.getRandomValues(privateArray);
    const privateKey = btoa(String.fromCharCode(...privateArray)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    setF("vapid_public_key", publicKey);
    setF("vapid_private_key", privateKey);
    toast({ title: "VAPID keys generated", description: "Save to apply the new keys" });
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="integrations-tab-loading">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="integrations-tab">
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2" data-testid="integrations-summary">
        {summaryCards.map(card => {
          const Icon = card.icon;
          const dotColor = card.status === "connected" ? "bg-emerald-500" : card.status === "partial" ? "bg-yellow-500" : "bg-muted-foreground/40";
          return (
            <button
              key={card.id}
              onClick={() => {
                document.getElementById(`section-${card.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex flex-col items-center gap-1 p-2 border border-border bg-card/50 hover:border-primary/30 transition-colors"
              data-testid={`summary-${card.id}`}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground uppercase">{card.label}</span>
              <div className="flex items-center gap-1">
                <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
                <span className="text-[10px] font-semibold text-foreground">{card.detail}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div id="section-social">
        <CollapsibleIntSection id="social" title="Social Media" icon={MessageSquare} status={overallSocialStatus}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IntegrationCard name="Twitter / X" icon={MessageSquare} status={twitterStatus} testId="card-twitter">
              <SecureField label="API Key" fieldKey="twitter_api_key" testId="input-twitter-api-key" />
              <SecureField label="API Secret" fieldKey="twitter_api_secret" testId="input-twitter-api-secret" />
              <SecureField label="Access Token" fieldKey="twitter_access_token" testId="input-twitter-access-token" />
              <SecureField label="Access Token Secret" fieldKey="twitter_access_secret" testId="input-twitter-access-secret" />
              <TestButton integration="twitter" label="Twitter" />
            </IntegrationCard>

            <IntegrationCard name="Facebook" icon={Facebook} status={facebookStatus} testId="card-facebook">
              <TextField label="Page ID" fieldKey="facebook_page_id" testId="input-facebook-page-id" placeholder="e.g. 123456789" />
              <SecureField label="Page Access Token" fieldKey="facebook_access_token" testId="input-facebook-access-token" />
              <TestButton integration="facebook" label="Facebook" />
            </IntegrationCard>

            <IntegrationCard name="LinkedIn" icon={Linkedin} status={linkedinStatus} testId="card-linkedin">
              <TextField label="Organization ID" fieldKey="linkedin_org_id" testId="input-linkedin-org-id" />
              <SecureField label="Access Token" fieldKey="linkedin_access_token" testId="input-linkedin-access-token" />
            </IntegrationCard>

            <IntegrationCard name="Instagram" icon={ImageIcon} status={instagramStatus} testId="card-instagram">
              <TextField label="Account ID" fieldKey="instagram_account_id" testId="input-instagram-account-id" note="Instagram requires a Facebook Business account connection" />
            </IntegrationCard>

            <IntegrationCard name="YouTube" icon={Radio} status={youtubeStatus} testId="card-youtube">
              <TextField label="Channel ID" fieldKey="youtube_channel_id" testId="input-youtube-channel-id" />
              <SecureField label="API Key" fieldKey="youtube_api_key" testId="input-youtube-api-key" />
            </IntegrationCard>
          </div>
          <SectionSaveButton sectionName="Social Media" keys={socialKeys} />
        </CollapsibleIntSection>
      </div>

      <div id="section-podcast">
        <CollapsibleIntSection id="podcast" title="Podcast Distribution" icon={Rss} status={hasValue("apple_podcasts_feed_url") || hasValue("spotify_show_id") ? "connected" : "not_configured"}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IntegrationCard name="Apple Podcasts" icon={Rss} status={getStatus(["apple_podcasts_feed_url"])} testId="card-apple-podcasts">
              <TextField label="RSS Feed URL" fieldKey="apple_podcasts_feed_url" testId="input-apple-feed" placeholder="Your RSS feed URL to submit to Apple" />
              <p className="text-[11px] text-muted-foreground">Submit your RSS feed to Apple Podcasts Connect</p>
              <a href="https://podcastsconnect.apple.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                Open Apple Podcasts Connect <ArrowRight className="h-3 w-3" />
              </a>
            </IntegrationCard>

            <IntegrationCard name="Spotify" icon={Rss} status={getStatus(["spotify_show_id"])} testId="card-spotify">
              <TextField label="Show ID" fieldKey="spotify_show_id" testId="input-spotify-show-id" note="Add your RSS feed at podcasters.spotify.com to get your Show ID" />
              <a href="https://podcasters.spotify.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                Open Spotify for Podcasters <ArrowRight className="h-3 w-3" />
              </a>
            </IntegrationCard>

            <IntegrationCard name="iHeart" icon={Rss} status={getStatus(["iheart_feed_url"])} testId="card-iheart">
              <TextField label="Feed URL" fieldKey="iheart_feed_url" testId="input-iheart-feed" />
              <a href="https://www.iheart.com/podcast" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                Open iHeartRadio Podcast Portal <ArrowRight className="h-3 w-3" />
              </a>
            </IntegrationCard>

            <IntegrationCard name="RSS Feed" icon={Rss} status={"connected"} testId="card-rss">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Feed URL</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={f("rss_feed_url") || `${window.location.origin}/api/public/rss`}
                    readOnly
                    className="flex-1 bg-background border border-border px-3 py-2 text-sm text-foreground font-mono opacity-60 cursor-not-allowed"
                    data-testid="input-rss-feed-url"
                  />
                  <button onClick={handleCopyRss} className="px-3 border border-border bg-card hover:bg-muted transition-colors" data-testid="button-copy-rss">
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">Submit this URL to any podcast directory</p>
              </div>
            </IntegrationCard>
          </div>
          <SectionSaveButton sectionName="Podcast Distribution" keys={podcastKeys} />
        </CollapsibleIntSection>
      </div>

      <div id="section-email">
        <CollapsibleIntSection id="email" title="Email" icon={Mail} status={emailStatus}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Email Provider</label>
              <div className="flex gap-3">
                {(["sendgrid", "smtp", "mailgun"] as const).map(p => (
                  <label key={p} className={cn("flex items-center gap-2 px-3 py-2 border cursor-pointer transition-colors", emailProvider === p ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-border/80")}>
                    <input type="radio" name="email_provider" value={p} checked={emailProvider === p} onChange={() => setF("email_provider", p)} className="sr-only" />
                    <span className={cn("h-3 w-3 rounded-full border-2", emailProvider === p ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                    <span className="text-xs font-mono uppercase">{p}</span>
                  </label>
                ))}
              </div>
            </div>

            {emailProvider === "sendgrid" && (
              <IntegrationCard name="SendGrid" icon={Mail} status={getStatus(["sendgrid_api_key"])} testId="card-sendgrid">
                <SecureField label="API Key" fieldKey="sendgrid_api_key" testId="input-sendgrid-api-key" />
                <TextField label="From Name" fieldKey="smtp_from_name" testId="input-sendgrid-from-name" placeholder="e.g. MediaTech Empire" />
                <TextField label="From Email" fieldKey="smtp_from_email" testId="input-sendgrid-from-email" placeholder="e.g. noreply@example.com" />
                <TestButton integration="email" label="SendGrid" />
              </IntegrationCard>
            )}

            {emailProvider === "smtp" && (
              <IntegrationCard name="SMTP" icon={Mail} status={getStatus(["smtp_host", "smtp_username", "smtp_password"])} testId="card-smtp">
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Host" fieldKey="smtp_host" testId="input-smtp-host" placeholder="e.g. smtp.gmail.com" />
                  <TextField label="Port" fieldKey="smtp_port" testId="input-smtp-port" placeholder="587" />
                </div>
                <TextField label="Username" fieldKey="smtp_username" testId="input-smtp-username" />
                <SecureField label="Password" fieldKey="smtp_password" testId="input-smtp-password" />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="From Name" fieldKey="smtp_from_name" testId="input-smtp-from-name" />
                  <TextField label="From Email" fieldKey="smtp_from_email" testId="input-smtp-from-email" />
                </div>
                <TestButton integration="email" label="SMTP" />
              </IntegrationCard>
            )}

            {emailProvider === "mailgun" && (
              <IntegrationCard name="Mailgun" icon={Mail} status={getStatus(["mailgun_api_key", "mailgun_domain"])} testId="card-mailgun">
                <SecureField label="API Key" fieldKey="mailgun_api_key" testId="input-mailgun-api-key" />
                <TextField label="Domain" fieldKey="mailgun_domain" testId="input-mailgun-domain" placeholder="e.g. mg.example.com" />
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="From Name" fieldKey="smtp_from_name" testId="input-mailgun-from-name" />
                  <TextField label="From Email" fieldKey="smtp_from_email" testId="input-mailgun-from-email" />
                </div>
                <TestButton integration="email" label="Mailgun" />
              </IntegrationCard>
            )}
          </div>
          <SectionSaveButton sectionName="Email" keys={emailKeys} />
        </CollapsibleIntSection>
      </div>

      <div id="section-sms">
        <CollapsibleIntSection id="sms" title="SMS" icon={Smartphone} status={smsStatus}>
          <IntegrationCard name="Twilio" icon={Smartphone} status={smsStatus} testId="card-twilio">
            <SecureField label="Account SID" fieldKey="twilio_account_sid" testId="input-twilio-sid" />
            <SecureField label="Auth Token" fieldKey="twilio_auth_token" testId="input-twilio-token" />
            <TextField label="Phone Number" fieldKey="twilio_phone_number" testId="input-twilio-phone" placeholder="+1XXXXXXXXXX" />
            <TestButton integration="twilio" label="Twilio" />
          </IntegrationCard>
          <SectionSaveButton sectionName="SMS" keys={smsKeys} />
        </CollapsibleIntSection>
      </div>

      <div id="section-push">
        <CollapsibleIntSection id="push" title="Push Notifications" icon={BellRing} status={pushStatus}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <IntegrationCard name="VAPID Keys" icon={BellRing} status={getStatus(["vapid_public_key", "vapid_private_key"])} testId="card-vapid">
              <SecureField label="Public Key" fieldKey="vapid_public_key" testId="input-vapid-public" />
              <SecureField label="Private Key" fieldKey="vapid_private_key" testId="input-vapid-private" />
              <TextField label="Subject Email" fieldKey="vapid_subject" testId="input-vapid-subject" placeholder="mailto:admin@example.com" />
              <button
                onClick={handleGenerateVapid}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-primary/30 bg-primary/5 text-primary text-xs font-mono uppercase tracking-wider hover:bg-primary/10 transition-colors"
                data-testid="button-generate-vapid"
              >
                <RefreshCw className="h-3 w-3" /> Generate New VAPID Keys
              </button>
              <p className="text-[11px] text-yellow-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Changing VAPID keys will invalidate all existing push subscriptions
              </p>
            </IntegrationCard>

            <IntegrationCard name="Firebase (Optional)" icon={BellRing} status={getStatus(["firebase_server_key"])} testId="card-firebase">
              <SecureField label="Server Key" fieldKey="firebase_server_key" testId="input-firebase-key" />
              <p className="text-[11px] text-muted-foreground">Only required for native iOS/Android push. PWA uses VAPID.</p>
            </IntegrationCard>
          </div>
          <SectionSaveButton sectionName="Push Notifications" keys={pushKeys} />
        </CollapsibleIntSection>
      </div>

      <div id="section-analytics">
        <CollapsibleIntSection id="analytics" title="Analytics" icon={BarChart} status={overallAnalyticsStatus}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <IntegrationCard name="Google Analytics" icon={BarChart} status={gaStatus} testId="card-ga">
              <TextField label="Measurement ID" fieldKey="google_analytics_id" testId="input-ga-id" placeholder="G-XXXXXXXXXX" note="Add this ID to enable Google Analytics tracking on the audience site" />
            </IntegrationCard>

            <IntegrationCard name="Meta Pixel" icon={BarChart} status={pixelStatus} testId="card-meta-pixel">
              <TextField label="Pixel ID" fieldKey="meta_pixel_id" testId="input-meta-pixel-id" placeholder="e.g. 1234567890" note="Enables Facebook/Instagram conversion tracking" />
            </IntegrationCard>

            <IntegrationCard name="Google Tag Manager" icon={BarChart} status={gtmStatus} testId="card-gtm">
              <TextField label="Container ID" fieldKey="gtm_container_id" testId="input-gtm-id" placeholder="GTM-XXXXXXX" note="Use GTM to manage all tracking scripts in one place" />
            </IntegrationCard>
          </div>
          <SectionSaveButton sectionName="Analytics" keys={analyticsKeys} />
        </CollapsibleIntSection>
      </div>

      <div id="section-storage">
        <CollapsibleIntSection id="storage" title="Storage" icon={HardDrive} status={storageStatus}>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Storage Provider</label>
              <div className="flex gap-3">
                {([["local", "Local Storage"], ["s3", "Amazon S3"], ["cloudflare_r2", "Cloudflare R2"]] as const).map(([val, label]) => (
                  <label key={val} className={cn("flex items-center gap-2 px-3 py-2 border cursor-pointer transition-colors", storageProvider === val ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-border/80")}>
                    <input type="radio" name="storage_provider" value={val} checked={storageProvider === val} onChange={() => setF("storage_provider", val)} className="sr-only" />
                    <span className={cn("h-3 w-3 rounded-full border-2", storageProvider === val ? "border-primary bg-primary" : "border-muted-foreground/40")} />
                    <span className="text-xs font-mono uppercase">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {storageProvider === "local" && (
              <div className="border border-border bg-card/30 p-4" data-testid="card-local-storage">
                <p className="text-[11px] text-yellow-500 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Files stored on the server. Not recommended for production.
                </p>
              </div>
            )}

            {storageProvider === "s3" && (
              <IntegrationCard name="Amazon S3" icon={HardDrive} status={getStatus(["s3_bucket", "s3_region", "s3_access_key", "s3_secret_key"])} testId="card-s3">
                <div className="grid grid-cols-2 gap-3">
                  <TextField label="Bucket Name" fieldKey="s3_bucket" testId="input-s3-bucket" placeholder="my-bucket" />
                  <TextField label="Region" fieldKey="s3_region" testId="input-s3-region" placeholder="us-east-1" />
                </div>
                <SecureField label="Access Key ID" fieldKey="s3_access_key" testId="input-s3-access-key" />
                <SecureField label="Secret Access Key" fieldKey="s3_secret_key" testId="input-s3-secret-key" />
                <TestButton integration="storage" label="Amazon S3" />
              </IntegrationCard>
            )}

            {storageProvider === "cloudflare_r2" && (
              <IntegrationCard name="Cloudflare R2" icon={HardDrive} status={getStatus(["cloudflare_r2_account_id", "cloudflare_r2_bucket", "cloudflare_r2_access_key", "cloudflare_r2_secret_key"])} testId="card-r2">
                <TextField label="Account ID" fieldKey="cloudflare_r2_account_id" testId="input-r2-account-id" />
                <TextField label="Bucket Name" fieldKey="cloudflare_r2_bucket" testId="input-r2-bucket" />
                <SecureField label="Access Key ID" fieldKey="cloudflare_r2_access_key" testId="input-r2-access-key" />
                <SecureField label="Secret Access Key" fieldKey="cloudflare_r2_secret_key" testId="input-r2-secret-key" />
                <TestButton integration="storage" label="Cloudflare R2" />
              </IntegrationCard>
            )}
          </div>
          <SectionSaveButton sectionName="Storage" keys={storageKeys} />
        </CollapsibleIntSection>
      </div>

      <div id="section-payment">
        <CollapsibleIntSection id="payment" title="Payment" icon={CreditCard} status={stripeStatus}>
          <IntegrationCard name="Stripe" icon={CreditCard} status={stripeStatus} testId="card-stripe">
            <TextField label="Publishable Key" fieldKey="stripe_publishable_key" testId="input-stripe-pk" placeholder="pk_test_..." />
            <SecureField label="Secret Key" fieldKey="stripe_secret_key" testId="input-stripe-sk" />
            <SecureField label="Webhook Secret" fieldKey="stripe_webhook_secret" testId="input-stripe-webhook" />
            <p className="text-[11px] text-muted-foreground">Used for future subscription and commerce features</p>
            <div className="flex items-center gap-3">
              <TestButton integration="stripe" label="Stripe" />
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                Open Stripe Dashboard <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </IntegrationCard>
          <SectionSaveButton sectionName="Payment" keys={paymentKeys} />
        </CollapsibleIntSection>
      </div>
    </div>
  );
}

function AIConfigurationTab() {
  const { toast } = useToast();
  const { data: aiSettings, isLoading } = useQuery({
    queryKey: ["/api/settings/ai"],
    queryFn: () => fetch("/api/settings/ai", { credentials: "include" }).then(r => r.json()),
  });
  const { data: usage } = useQuery({
    queryKey: ["/api/settings/ai/usage"],
    queryFn: () => fetch("/api/settings/ai/usage", { credentials: "include" }).then(r => r.json()),
    refetchInterval: 60000,
  });

  const AI_DEFAULTS: Record<string, string> = {
    ai_primary_provider: "claude", ai_fallback_provider: "openai",
    ai_claude_model: "claude-opus-4-6", ai_openai_model: "gpt-4o",
    ai_temperature: "0.7", ai_max_tokens_per_request: "2000",
    ai_daily_token_budget: "500000", ai_token_alert_threshold: "80",
    ai_platform_name: "Salem Media",
    ai_brand_voice: "authoritative, conversational, patriotic, no-nonsense",
    ai_target_audience: "conservative Americans aged 35-65 who value traditional values, free speech, and limited government",
    ai_content_guidelines: "Always frame content from a conservative perspective. Avoid liberal media framing. Support free speech. Be direct and confident.",
    ai_prohibited_topics: "Do not generate content that promotes socialism, critical race theory, or mainstream media narratives without critical analysis.",
    ai_preferred_topics: "Politics, economics, foreign policy, Second Amendment, religious freedom, free speech, border security",
    ai_competitor_avoidance: "Do not reference or recommend CNN, MSNBC, NYT, WaPo, or similar outlets favorably",
    ai_auto_generate_articles: "true", ai_auto_generate_social: "true",
    ai_auto_generate_newsletter: "false", ai_auto_generate_seo: "true",
    ai_auto_generate_clips_summary: "true", ai_auto_publish_articles: "false",
    ai_article_min_word_count: "400", ai_article_max_word_count: "1200",
    ai_social_platforms: "twitter,facebook,linkedin",
    ai_moderation_enabled: "true", ai_moderation_sensitivity: "medium",
    ai_auto_hide_flagged: "false", ai_moderation_topics: "spam,harassment,profanity,threats",
    ai_advisor_enabled: "true", ai_advisor_ctr_threshold: "1.5",
    ai_advisor_qr_scan_threshold: "50", ai_advisor_auto_draft: "true",
    ai_analytics_digest_enabled: "true", ai_analytics_digest_schedule: "weekly",
    ai_analytics_digest_recipients: "", ai_insights_cache_hours: "24",
  };

  const [form, setForm] = useState<Record<string, string>>({ ...AI_DEFAULTS });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [moderationTags, setModerationTags] = useState<string[]>(["spam", "harassment", "profanity", "threats"]);
  const [newModTag, setNewModTag] = useState("");
  const [digestEmails, setDigestEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    provider: true, usage: true, brand: true, autogen: true, moderation: true, advisor: true,
  });

  useEffect(() => {
    if (aiSettings && typeof aiSettings === "object") {
      setForm(prev => {
        const merged = { ...AI_DEFAULTS };
        for (const [k, v] of Object.entries(aiSettings)) {
          if (typeof v === "string" && v !== "") merged[k] = v;
        }
        return merged;
      });
      const topics = (aiSettings.ai_moderation_topics || AI_DEFAULTS.ai_moderation_topics || "").split(",").filter(Boolean);
      setModerationTags(topics);
      const emails = (aiSettings.ai_analytics_digest_recipients || "").split(",").filter(Boolean);
      setDigestEmails(emails);
    }
  }, [aiSettings]);

  const f = (key: string) => form[key] || AI_DEFAULTS[key] || "";
  const setF = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleSection = (id: string) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const saveSection = async (sectionName: string, keys: string[]) => {
    setSaving(prev => ({ ...prev, [sectionName]: true }));
    try {
      const payload: Record<string, string> = {};
      keys.forEach(k => { payload[k] = f(k); });
      const res = await fetch("/api/settings/ai", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      queryClient.invalidateQueries({ queryKey: ["/api/settings/ai"] });
      toast({ title: `${sectionName} saved` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  const saveAll = async () => {
    setSaving(prev => ({ ...prev, all: true }));
    try {
      const res = await fetch("/api/settings/ai", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      queryClient.invalidateQueries({ queryKey: ["/api/settings/ai"] });
      toast({ title: "All AI settings saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(prev => ({ ...prev, all: false }));
    }
  };

  const testConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/ai/test", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const result = await res.json();
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTestLoading(false);
    }
  };

  function CollapsibleAISection({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) {
    const isOpen = openSections[id] !== false;
    return (
      <div className="border border-border bg-card/50" data-testid={`ai-section-${id}`}>
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          data-testid={`toggle-ai-section-${id}`}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border border-muted-foreground/20 bg-muted/20 flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">{title}</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        {isOpen && <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">{children}</div>}
      </div>
    );
  }

  function SaveSectionBtn({ section, keys, label }: { section: string; keys: string[]; label?: string }) {
    return (
      <div className="flex justify-end pt-2">
        <button
          onClick={() => saveSection(section, keys)}
          disabled={saving[section]}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          data-testid={`button-save-${section}`}
        >
          {saving[section] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {label || `Save ${section}`}
        </button>
      </div>
    );
  }

  const showClaude = f("ai_primary_provider") === "claude" || f("ai_primary_provider") === "auto" || f("ai_fallback_provider") === "claude";
  const showOpenAI = f("ai_primary_provider") === "openai" || f("ai_primary_provider") === "auto" || f("ai_fallback_provider") === "openai";

  const budget = parseInt(f("ai_daily_token_budget")) || 500000;
  const tokensToday = usage?.tokensToday || 0;
  const usagePercent = Math.min(100, Math.round((tokensToday / budget) * 100));
  const usageColor = usagePercent >= 80 ? "bg-red-500" : usagePercent >= 60 ? "bg-yellow-500" : "bg-emerald-500";

  const brandPreview = `You are an AI content assistant for ${f("ai_platform_name")}.\n\nBrand Voice: ${f("ai_brand_voice")}\n\nTarget Audience: ${f("ai_target_audience")}\n\nContent Guidelines: ${f("ai_content_guidelines")}\n\nProhibited Topics: ${f("ai_prohibited_topics")}\n\nPreferred Topics: ${f("ai_preferred_topics")}\n\nCompetitor Avoidance: ${f("ai_competitor_avoidance")}`;

  const tempVal = parseFloat(f("ai_temperature")) || 0.7;
  const tempLabel = tempVal <= 0.3 ? "Precise" : tempVal <= 0.7 ? "Balanced" : "Creative";

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="ai-config-tab">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="ai-config-tab">
      <SectionHeader icon={Brain} title="AI Configuration" description="Manage AI behavior, content rules, and provider settings across the platform" />

      {/* SECTION 1: Provider Settings */}
      <CollapsibleAISection id="provider" title="AI Provider Settings" icon={Bot}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-border bg-card/30 p-4 space-y-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Primary Provider</h4>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Primary Provider</label>
              <select value={f("ai_primary_provider")} onChange={e => setF("ai_primary_provider", e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-ai-primary-provider">
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI</option>
                <option value="auto">Auto (use best available)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Fallback Provider</label>
              <select value={f("ai_fallback_provider")} onChange={e => setF("ai_fallback_provider", e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-ai-fallback-provider">
                <option value="claude">Claude (Anthropic)</option>
                <option value="openai">OpenAI</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <p className="text-[11px] text-muted-foreground italic">Auto mode selects the best provider based on task type and availability</p>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-4">
            {showClaude && (
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">Claude Settings</h4>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Model</label>
                <select value={f("ai_claude_model")} onChange={e => setF("ai_claude_model", e.target.value)}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-ai-claude-model">
                  <option value="claude-opus-4-6">Claude Opus 4.6 (most capable, highest cost)</option>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (balanced)</option>
                  <option value="claude-haiku-4-5">Claude Haiku 4.5 (fastest, lowest cost)</option>
                </select>
              </div>
            )}
            {showOpenAI && (
              <div className={showClaude ? "mt-4" : ""}>
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground mb-2">OpenAI Settings</h4>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Model</label>
                <select value={f("ai_openai_model")} onChange={e => setF("ai_openai_model", e.target.value)}
                  className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-ai-openai-model">
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-4o-mini">GPT-4o Mini</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="border border-border bg-card/30 p-4 space-y-4">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Generation Parameters</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">
                Temperature: {tempVal.toFixed(1)} — {tempLabel}
              </label>
              <input type="range" min="0" max="1" step="0.1" value={tempVal}
                onChange={e => setF("ai_temperature", e.target.value)}
                className="w-full accent-primary" data-testid="slider-ai-temperature" />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>0.0 Precise</span><span>0.5 Balanced</span><span>1.0 Creative</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Max Tokens Per Request</label>
              <input type="number" min={500} max={8000} value={f("ai_max_tokens_per_request")}
                onChange={e => setF("ai_max_tokens_per_request", e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-ai-max-tokens" />
              <p className="text-[10px] text-muted-foreground mt-1">Range: 500 – 8,000</p>
            </div>
          </div>
        </div>

        <div className="border border-border bg-card/30 p-4 space-y-3">
          <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Test Connection</h4>
          <button onClick={testConnection} disabled={testLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            data-testid="button-test-ai-connection">
            {testLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
            Test AI Connection
          </button>
          {testResult && (
            <div className={cn("p-3 border text-sm", testResult.success ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400" : "border-red-500/30 bg-red-500/5 text-red-400")}
              data-testid="ai-test-result">
              {testResult.success ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Connected successfully</div>
                  <p className="text-[11px] text-muted-foreground">Provider: {testResult.provider} ({testResult.model}) — {testResult.responseTime}ms</p>
                  <p className="text-xs text-foreground/80 mt-1 italic">"{testResult.response}"</p>
                </div>
              ) : (
                <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {testResult.message}</div>
              )}
            </div>
          )}
        </div>

        <SaveSectionBtn section="Provider" keys={["ai_primary_provider", "ai_fallback_provider", "ai_claude_model", "ai_openai_model", "ai_temperature", "ai_max_tokens_per_request"]} />
      </CollapsibleAISection>

      {/* SECTION 2: Usage & Limits */}
      <CollapsibleAISection id="usage" title="Usage & Limits" icon={Gauge}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Tokens Today", value: tokensToday },
            { label: "Tokens This Week", value: usage?.tokensWeek || 0 },
            { label: "Tokens This Month", value: usage?.tokensMonth || 0 },
            { label: "Daily Average", value: usage?.dailyAverage || 0 },
          ].map(m => (
            <div key={m.label} className="border border-border bg-card/30 p-3 text-center" data-testid={`metric-${m.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{m.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{m.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="border border-border bg-card/30 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-mono uppercase tracking-wider">Daily Usage vs Budget</span>
            <span className="font-mono text-foreground">{tokensToday.toLocaleString()} / {budget.toLocaleString()}</span>
          </div>
          <div className="w-full h-3 bg-muted/30 border border-border overflow-hidden">
            <div className={cn("h-full transition-all", usageColor)} style={{ width: `${usagePercent}%` }} />
          </div>
          <p className="text-[10px] text-muted-foreground">{usagePercent}% of daily budget used</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Daily Token Budget</label>
              <input type="number" min={10000} value={f("ai_daily_token_budget")}
                onChange={e => setF("ai_daily_token_budget", e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-ai-daily-budget" />
              <p className="text-[10px] text-muted-foreground mt-1">{parseInt(f("ai_daily_token_budget") || "0").toLocaleString()} tokens</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">
                Alert Threshold: {f("ai_token_alert_threshold")}%
              </label>
              <input type="range" min="50" max="95" step="5" value={f("ai_token_alert_threshold")}
                onChange={e => setF("ai_token_alert_threshold", e.target.value)}
                className="w-full accent-primary" data-testid="slider-ai-alert-threshold" />
              <p className="text-[10px] text-muted-foreground mt-1">When usage reaches this threshold, a warning appears in the admin header</p>
            </div>
          </div>
          <div className="border border-border bg-card/30 p-4 space-y-2">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Cost Estimator</h4>
            {(() => {
              const daysElapsed = usage?.daysElapsed || 1;
              const projectedMonthly = Math.round((usage?.tokensMonth || 0) / daysElapsed * 30);
              const estimatedCost = (projectedMonthly / 1000000 * 3).toFixed(2);
              return (
                <>
                  <p className="text-sm text-foreground">Projected monthly: <span className="font-bold">{projectedMonthly.toLocaleString()}</span> tokens</p>
                  <p className="text-sm text-foreground">Estimated cost: <span className="font-bold">${estimatedCost}</span>/month</p>
                  <p className="text-[10px] text-muted-foreground italic">Estimate only. Actual costs vary by provider and model.</p>
                </>
              );
            })()}
          </div>
        </div>

        <SaveSectionBtn section="Usage" keys={["ai_daily_token_budget", "ai_token_alert_threshold"]} />
      </CollapsibleAISection>

      {/* SECTION 3: Brand Voice & Content Rules */}
      <CollapsibleAISection id="brand" title="Brand Voice & Content Rules" icon={Palette}>
        <p className="text-[11px] text-muted-foreground italic mb-2">These rules are injected into every AI prompt across the platform as system context.</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Platform Name</label>
              <input type="text" value={f("ai_platform_name")} onChange={e => setF("ai_platform_name", e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-ai-platform-name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Brand Voice</label>
              <input type="text" value={f("ai_brand_voice")} onChange={e => setF("ai_brand_voice", e.target.value)} maxLength={200}
                placeholder="authoritative, conversational, patriotic, no-nonsense"
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/50" data-testid="input-ai-brand-voice" />
              <p className="text-[10px] text-muted-foreground mt-1">Describe your brand's tone in 3-6 adjectives or phrases ({f("ai_brand_voice").length}/200)</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Target Audience</label>
              <textarea value={f("ai_target_audience")} onChange={e => setF("ai_target_audience", e.target.value)} maxLength={300} rows={2}
                placeholder="Conservative Americans aged 35-65 who value traditional values..."
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground/50" data-testid="input-ai-target-audience" />
              <p className="text-[10px] text-muted-foreground">{f("ai_target_audience").length}/300</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Content Guidelines</label>
              <textarea value={f("ai_content_guidelines")} onChange={e => setF("ai_content_guidelines", e.target.value)} maxLength={500} rows={3}
                placeholder="Always frame content from a conservative perspective..."
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground/50" data-testid="input-ai-content-guidelines" />
              <p className="text-[10px] text-muted-foreground">What should AI always do when creating content? ({f("ai_content_guidelines").length}/500)</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Prohibited Topics</label>
              <textarea value={f("ai_prohibited_topics")} onChange={e => setF("ai_prohibited_topics", e.target.value)} maxLength={500} rows={2}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground/50" data-testid="input-ai-prohibited-topics" />
              <p className="text-[10px] text-muted-foreground">What should AI never write about or how should it never frame things? ({f("ai_prohibited_topics").length}/500)</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Preferred Topics</label>
              <textarea value={f("ai_preferred_topics")} onChange={e => setF("ai_preferred_topics", e.target.value)} maxLength={300} rows={2}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground/50" data-testid="input-ai-preferred-topics" />
              <p className="text-[10px] text-muted-foreground">What topics does your audience care most about? ({f("ai_preferred_topics").length}/300)</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Competitor Avoidance</label>
              <textarea value={f("ai_competitor_avoidance")} onChange={e => setF("ai_competitor_avoidance", e.target.value)} maxLength={300} rows={2}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none placeholder:text-muted-foreground/50" data-testid="input-ai-competitor-avoidance" />
              <p className="text-[10px] text-muted-foreground">Which outlets or brands should AI avoid referencing favorably? ({f("ai_competitor_avoidance").length}/300)</p>
            </div>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-2 h-fit sticky top-4">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Eye className="h-3 w-3" /> How AI Sees Your Brand</h4>
            <pre className="text-[11px] text-foreground/80 whitespace-pre-wrap font-mono bg-background/50 border border-border p-3 max-h-[500px] overflow-y-auto" data-testid="ai-brand-preview">
              {brandPreview}
            </pre>
          </div>
        </div>

        <SaveSectionBtn section="Brand Voice" keys={["ai_platform_name", "ai_brand_voice", "ai_target_audience", "ai_content_guidelines", "ai_prohibited_topics", "ai_preferred_topics", "ai_competitor_avoidance"]} />
      </CollapsibleAISection>

      {/* SECTION 4: Auto-Generation Settings */}
      <CollapsibleAISection id="autogen" title="Auto-Generation Settings" icon={Sparkles}>
        <div className="space-y-3">
          {/* Articles */}
          <div className="border border-border bg-card/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Articles</span>
              </div>
              <button onClick={() => setF("ai_auto_generate_articles", f("ai_auto_generate_articles") === "true" ? "false" : "true")}
                className={cn("relative w-10 h-5 rounded-full transition-colors", f("ai_auto_generate_articles") === "true" ? "bg-primary" : "bg-muted")}
                data-testid="toggle-ai-auto-articles">
                <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", f("ai_auto_generate_articles") === "true" && "translate-x-5")} />
              </button>
            </div>
            {f("ai_auto_generate_articles") === "true" && (
              <div className="pl-6 space-y-3 border-l-2 border-primary/20">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Min Word Count</label>
                    <input type="number" value={f("ai_article_min_word_count")} onChange={e => setF("ai_article_min_word_count", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-ai-min-words" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Max Word Count</label>
                    <input type="number" value={f("ai_article_max_word_count")} onChange={e => setF("ai_article_max_word_count", e.target.value)}
                      className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-ai-max-words" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-foreground">Auto-publish (skip moderation queue)</span>
                    {f("ai_auto_publish_articles") === "true" && (
                      <p className="text-[10px] text-yellow-500 flex items-center gap-1 mt-0.5"><AlertTriangle className="h-3 w-3" /> Enabling this publishes AI content without human review</p>
                    )}
                  </div>
                  <button onClick={() => setF("ai_auto_publish_articles", f("ai_auto_publish_articles") === "true" ? "false" : "true")}
                    className={cn("relative w-10 h-5 rounded-full transition-colors", f("ai_auto_publish_articles") === "true" ? "bg-yellow-500" : "bg-muted")}
                    data-testid="toggle-ai-auto-publish">
                    <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", f("ai_auto_publish_articles") === "true" && "translate-x-5")} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Social Posts */}
          <div className="border border-border bg-card/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Social Posts</span>
              </div>
              <button onClick={() => setF("ai_auto_generate_social", f("ai_auto_generate_social") === "true" ? "false" : "true")}
                className={cn("relative w-10 h-5 rounded-full transition-colors", f("ai_auto_generate_social") === "true" ? "bg-primary" : "bg-muted")}
                data-testid="toggle-ai-auto-social">
                <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", f("ai_auto_generate_social") === "true" && "translate-x-5")} />
              </button>
            </div>
            {f("ai_auto_generate_social") === "true" && (
              <div className="pl-6 border-l-2 border-primary/20">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {["twitter", "facebook", "linkedin", "instagram"].map(p => {
                    const platforms = (f("ai_social_platforms") || "").split(",");
                    const active = platforms.includes(p);
                    return (
                      <button key={p} onClick={() => {
                        const updated = active ? platforms.filter(x => x !== p) : [...platforms, p];
                        setF("ai_social_platforms", updated.filter(Boolean).join(","));
                      }}
                        className={cn("px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors", active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/30")}
                        data-testid={`toggle-platform-${p}`}>
                        {p === "twitter" ? "Twitter/X" : p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Simple toggles */}
          {[
            { key: "ai_auto_generate_newsletter", label: "Newsletter", icon: Mail },
            { key: "ai_auto_generate_seo", label: "SEO Metadata", icon: Globe },
            { key: "ai_auto_generate_clips_summary", label: "Clips Summary", icon: Mic },
          ].map(item => (
            <div key={item.key} className="border border-border bg-card/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{item.label}</span>
              </div>
              <button onClick={() => setF(item.key, f(item.key) === "true" ? "false" : "true")}
                className={cn("relative w-10 h-5 rounded-full transition-colors", f(item.key) === "true" ? "bg-primary" : "bg-muted")}
                data-testid={`toggle-${item.key}`}>
                <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", f(item.key) === "true" && "translate-x-5")} />
              </button>
            </div>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground italic">These settings control what gets auto-generated when a podcast episode is processed. Individual episodes can override these defaults.</p>

        <SaveSectionBtn section="Auto-Generation" keys={["ai_auto_generate_articles", "ai_auto_generate_social", "ai_auto_generate_newsletter", "ai_auto_generate_seo", "ai_auto_generate_clips_summary", "ai_auto_publish_articles", "ai_article_min_word_count", "ai_article_max_word_count", "ai_social_platforms"]} />
      </CollapsibleAISection>

      {/* SECTION 5: Moderation Settings */}
      <CollapsibleAISection id="moderation" title="Moderation Settings" icon={ShieldCheck}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-semibold text-foreground">AI Moderation</span>
            <p className="text-[10px] text-muted-foreground">AI reviews community posts before they appear publicly</p>
          </div>
          <button onClick={() => setF("ai_moderation_enabled", f("ai_moderation_enabled") === "true" ? "false" : "true")}
            className={cn("relative w-10 h-5 rounded-full transition-colors", f("ai_moderation_enabled") === "true" ? "bg-primary" : "bg-muted")}
            data-testid="toggle-ai-moderation">
            <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", f("ai_moderation_enabled") === "true" && "translate-x-5")} />
          </button>
        </div>

        {f("ai_moderation_enabled") === "true" && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Sensitivity</label>
              <div className="space-y-2">
                {[
                  { value: "low", label: "Low", desc: "Flag only obvious violations (spam, threats)" },
                  { value: "medium", label: "Medium", desc: "Flag violations plus borderline content for human review (recommended)" },
                  { value: "high", label: "High", desc: "Flag anything potentially controversial — requires more human review" },
                ].map(opt => (
                  <label key={opt.value} className={cn("flex items-start gap-3 p-3 border cursor-pointer transition-colors",
                    f("ai_moderation_sensitivity") === opt.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/30")}
                    data-testid={`radio-moderation-${opt.value}`}>
                    <input type="radio" name="moderation_sensitivity" value={opt.value} checked={f("ai_moderation_sensitivity") === opt.value}
                      onChange={e => setF("ai_moderation_sensitivity", e.target.value)} className="mt-0.5 accent-primary" />
                    <div>
                      <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                      <p className="text-[10px] text-muted-foreground">{opt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-foreground">Auto-hide Flagged Posts</span>
                <p className="text-[10px] text-muted-foreground">If off, flagged posts stay visible until manually reviewed</p>
              </div>
              <button onClick={() => setF("ai_auto_hide_flagged", f("ai_auto_hide_flagged") === "true" ? "false" : "true")}
                className={cn("relative w-10 h-5 rounded-full transition-colors", f("ai_auto_hide_flagged") === "true" ? "bg-primary" : "bg-muted")}
                data-testid="toggle-ai-auto-hide">
                <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", f("ai_auto_hide_flagged") === "true" && "translate-x-5")} />
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Monitored Topics</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {moderationTags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-border bg-card/30 text-foreground" data-testid={`tag-moderation-${tag}`}>
                    {tag}
                    <button onClick={() => {
                      const updated = moderationTags.filter(t => t !== tag);
                      setModerationTags(updated);
                      setF("ai_moderation_topics", updated.join(","));
                    }} className="hover:text-red-400"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input type="text" value={newModTag} onChange={e => setNewModTag(e.target.value)} placeholder="Add topic..."
                  onKeyDown={e => {
                    if (e.key === "Enter" && newModTag.trim()) {
                      const updated = [...moderationTags, newModTag.trim()];
                      setModerationTags(updated);
                      setF("ai_moderation_topics", updated.join(","));
                      setNewModTag("");
                    }
                  }}
                  className="flex-1 bg-background border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-moderation-tag" />
                <button onClick={() => {
                  if (newModTag.trim()) {
                    const updated = [...moderationTags, newModTag.trim()];
                    setModerationTags(updated);
                    setF("ai_moderation_topics", updated.join(","));
                    setNewModTag("");
                  }
                }} className="px-3 py-1.5 border border-border bg-card hover:bg-muted transition-colors text-xs" data-testid="button-add-mod-tag">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">AI will flag posts containing these topics for review</p>
            </div>
          </div>
        )}

        <SaveSectionBtn section="Moderation" keys={["ai_moderation_enabled", "ai_moderation_sensitivity", "ai_auto_hide_flagged", "ai_moderation_topics"]} />
      </CollapsibleAISection>

      {/* SECTION 6: Advisor AI & Analytics */}
      <CollapsibleAISection id="advisor" title="Advisor AI & Analytics" icon={Lightbulb}>
        <div className="space-y-4">
          <div className="border border-border bg-card/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-foreground">AdvisorAI</span>
                <p className="text-[10px] text-muted-foreground">Automatically generate upsell prompts when ad campaigns perform above threshold</p>
              </div>
              <button onClick={() => setF("ai_advisor_enabled", f("ai_advisor_enabled") === "true" ? "false" : "true")}
                className={cn("relative w-10 h-5 rounded-full transition-colors", f("ai_advisor_enabled") === "true" ? "bg-primary" : "bg-muted")}
                data-testid="toggle-ai-advisor">
                <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", f("ai_advisor_enabled") === "true" && "translate-x-5")} />
              </button>
            </div>

            {f("ai_advisor_enabled") === "true" && (
              <div className="pl-4 border-l-2 border-primary/20 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">CTR Threshold (%)</label>
                  <input type="number" step="0.1" value={f("ai_advisor_ctr_threshold")} onChange={e => setF("ai_advisor_ctr_threshold", e.target.value)}
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-ai-ctr-threshold" />
                  <p className="text-[10px] text-muted-foreground mt-1">Generate upsell prompt when campaign CTR exceeds this percentage</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">QR Scan Threshold</label>
                  <input type="number" value={f("ai_advisor_qr_scan_threshold")} onChange={e => setF("ai_advisor_qr_scan_threshold", e.target.value)}
                    className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-ai-qr-threshold" />
                  <p className="text-[10px] text-muted-foreground mt-1">Generate upsell prompt when monthly QR scans exceed this number</p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-foreground">Auto-Draft Prompts</span>
                    <p className="text-[10px] text-muted-foreground">Automatically draft upsell messages (requires admin approval before sending)</p>
                  </div>
                  <button onClick={() => setF("ai_advisor_auto_draft", f("ai_advisor_auto_draft") === "true" ? "false" : "true")}
                    className={cn("relative w-10 h-5 rounded-full transition-colors", f("ai_advisor_auto_draft") === "true" ? "bg-primary" : "bg-muted")}
                    data-testid="toggle-ai-auto-draft">
                    <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", f("ai_advisor_auto_draft") === "true" && "translate-x-5")} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Analytics AI Settings</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Weekly Digest</span>
              <button onClick={() => setF("ai_analytics_digest_enabled", f("ai_analytics_digest_enabled") === "true" ? "false" : "true")}
                className={cn("relative w-10 h-5 rounded-full transition-colors", f("ai_analytics_digest_enabled") === "true" ? "bg-primary" : "bg-muted")}
                data-testid="toggle-ai-digest">
                <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", f("ai_analytics_digest_enabled") === "true" && "translate-x-5")} />
              </button>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Schedule</label>
              <select value={f("ai_analytics_digest_schedule")} onChange={e => setF("ai_analytics_digest_schedule", e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-ai-digest-schedule">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="off">Off</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-2">Recipients</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {digestEmails.map(email => (
                  <span key={email} className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-border bg-card/30 text-foreground" data-testid={`tag-email-${email}`}>
                    {email}
                    <button onClick={() => {
                      const updated = digestEmails.filter(e => e !== email);
                      setDigestEmails(updated);
                      setF("ai_analytics_digest_recipients", updated.join(","));
                    }} className="hover:text-red-400"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="email@example.com"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newEmail.trim() && newEmail.includes("@")) {
                      const updated = [...digestEmails, newEmail.trim()];
                      setDigestEmails(updated);
                      setF("ai_analytics_digest_recipients", updated.join(","));
                      setNewEmail("");
                    }
                  }}
                  className="flex-1 bg-background border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-digest-email" />
                <button onClick={() => {
                  if (newEmail.trim() && newEmail.includes("@")) {
                    const updated = [...digestEmails, newEmail.trim()];
                    setDigestEmails(updated);
                    setF("ai_analytics_digest_recipients", updated.join(","));
                    setNewEmail("");
                  }
                }} className="px-3 py-1.5 border border-border bg-card hover:bg-muted transition-colors text-xs" data-testid="button-add-digest-email">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Insights Cache (hours)</label>
              <input type="number" value={f("ai_insights_cache_hours")} onChange={e => setF("ai_insights_cache_hours", e.target.value)}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="input-ai-cache-hours" />
              <p className="text-[10px] text-muted-foreground mt-1">How long to cache AI-generated insights before regenerating</p>
            </div>
          </div>
        </div>

        <SaveSectionBtn section="Advisor & Analytics" keys={["ai_advisor_enabled", "ai_advisor_ctr_threshold", "ai_advisor_qr_scan_threshold", "ai_advisor_auto_draft", "ai_analytics_digest_enabled", "ai_analytics_digest_schedule", "ai_analytics_digest_recipients", "ai_insights_cache_hours"]} />
      </CollapsibleAISection>

      {/* Fixed Save All button */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border p-4 -mx-4 flex justify-end">
        <button onClick={saveAll} disabled={saving.all}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          data-testid="button-save-all-ai">
          {saving.all ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Save All AI Settings
        </button>
      </div>
    </div>
  );
}

function LiveSiteAppTab() {
  const { toast } = useToast();
  const { data: lsSettings, isLoading } = useQuery({
    queryKey: ["/api/settings/live-site"],
    queryFn: () => fetch("/api/settings/live-site", { credentials: "include" }).then(r => r.json()),
  });

  const LS_DEFAULTS: Record<string, string> = {
    ls_home_hero_enabled: "true", ls_home_hero_autoplay: "true", ls_home_hero_interval: "5000",
    ls_home_featured_poll_enabled: "true", ls_home_featured_poll_id: "",
    ls_home_featured_events_enabled: "true", ls_home_featured_events_count: "3",
    ls_home_latest_episodes_count: "6", ls_home_latest_articles_count: "6",
    ls_home_community_preview_enabled: "true", ls_home_community_preview_count: "3",
    ls_home_breaking_news_enabled: "false", ls_home_breaking_news_text: "",
    ls_nav_bottom_home: "true", ls_nav_bottom_listen: "true", ls_nav_bottom_news: "true",
    ls_nav_bottom_search: "true", ls_nav_bottom_community: "true",
    ls_nav_show_categories: "true", ls_nav_show_trending: "true",
    ls_nav_show_discover: "true", ls_nav_show_events: "true",
    ls_pwa_app_name: "Salem Media", ls_pwa_short_name: "Salem",
    ls_pwa_description: "Conservative news and podcasts powered by AI",
    ls_pwa_theme_color: "#1D4ED8", ls_pwa_background_color: "#0F172A",
    ls_pwa_display: "standalone", ls_pwa_orientation: "portrait",
    ls_pwa_icon_192_url: "", ls_pwa_icon_512_url: "", ls_pwa_splash_screen_url: "",
    ls_pwa_ios_status_bar: "black-translucent",
    ls_maintenance_mode_enabled: "false", ls_maintenance_mode_title: "We'll be right back",
    ls_maintenance_mode_message: "We're making some improvements. Check back soon.",
    ls_maintenance_mode_estimated_time: "", ls_maintenance_contact_email: "",
    ls_cookie_banner_enabled: "true",
    ls_cookie_banner_text: "We use cookies to improve your experience. By continuing, you agree to our Privacy Policy.",
    ls_cookie_banner_accept_text: "Accept", ls_cookie_banner_decline_text: "Decline",
    ls_cookie_banner_position: "bottom",
    ls_rate_us_enabled: "true", ls_rate_us_trigger_visits: "3",
    ls_rate_us_app_store_url: "", ls_rate_us_play_store_url: "",
    ls_search_enabled: "true", ls_dark_mode_toggle_enabled: "true", ls_bookmark_enabled: "true",
    ls_adzone_home_leaderboard_enabled: "true", ls_adzone_home_rectangle_enabled: "true",
    ls_adzone_article_inline_enabled: "true", ls_adzone_article_sidebar_enabled: "true",
    ls_adzone_podcast_player_enabled: "true", ls_adzone_mobile_banner_enabled: "true",
  };

  const [form, setForm] = useState<Record<string, string>>({ ...LS_DEFAULTS });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    homepage: true, navigation: true, pwa: true, maintenance: true,
    cookie: true, audience: true, adzones: true,
  });
  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false);
  const [pwaManifestOpen, setPwaManifestOpen] = useState(false);

  useEffect(() => {
    if (lsSettings && typeof lsSettings === "object") {
      setForm(prev => {
        const merged = { ...LS_DEFAULTS };
        for (const [k, v] of Object.entries(lsSettings)) {
          if (typeof v === "string" && v !== "") merged[k] = v as string;
        }
        return merged;
      });
    }
  }, [lsSettings]);

  const f = (key: string) => form[key] || LS_DEFAULTS[key] || "";
  const setF = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));
  const toggleSection = (id: string) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  const isOn = (key: string) => f(key) === "true";
  const toggleF = (key: string) => setF(key, isOn(key) ? "false" : "true");

  const saveSection = async (sectionName: string, keys: string[]) => {
    setSaving(prev => ({ ...prev, [sectionName]: true }));
    try {
      const payload: Record<string, string> = {};
      keys.forEach(k => { payload[k] = f(k); });
      const res = await fetch("/api/settings/live-site", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
      queryClient.invalidateQueries({ queryKey: ["/api/settings/live-site"] });
      toast({ title: `${sectionName} saved` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(prev => ({ ...prev, [sectionName]: false }));
    }
  };

  const saveAll = async () => {
    setSaving(prev => ({ ...prev, all: true }));
    try {
      const res = await fetch("/api/settings/live-site", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      queryClient.invalidateQueries({ queryKey: ["/api/settings/live-site"] });
      toast({ title: "All Live Site settings saved" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(prev => ({ ...prev, all: false }));
    }
  };

  const activateMaintenanceMode = async () => {
    try {
      const res = await fetch("/api/settings/live-site/maintenance", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to toggle maintenance mode");
      queryClient.invalidateQueries({ queryKey: ["/api/settings/live-site"] });
      const result = await res.json();
      setF("ls_maintenance_mode_enabled", result.maintenance_mode_enabled);
      toast({ title: result.maintenance_mode_enabled === "true" ? "Maintenance mode activated" : "Maintenance mode deactivated" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
    setMaintenanceConfirm(false);
  };

  function CollapsibleSection({ id, title, icon: Icon, children }: { id: string; title: string; icon: any; children: React.ReactNode }) {
    const isOpen = openSections[id] !== false;
    return (
      <div className="border border-border bg-card/50" data-testid={`ls-section-${id}`}>
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
          data-testid={`toggle-ls-section-${id}`}
        >
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 border border-muted-foreground/20 bg-muted/20 flex items-center justify-center">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">{title}</span>
          </div>
          {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </button>
        {isOpen && <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">{children}</div>}
      </div>
    );
  }

  function SaveBtn({ section, keys, label }: { section: string; keys: string[]; label?: string }) {
    return (
      <div className="flex justify-end pt-2">
        <button onClick={() => saveSection(section, keys)} disabled={saving[section]}
          className="flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          data-testid={`button-save-${section}`}>
          {saving[section] ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {label || `Save ${section}`}
        </button>
      </div>
    );
  }

  function ToggleRow({ label, settingKey, note, locked }: { label: string; settingKey: string; note?: string; locked?: boolean }) {
    return (
      <div className="flex items-center justify-between py-2">
        <div className="flex-1">
          <span className="text-sm text-foreground">{label}</span>
          {note && <p className="text-[11px] text-muted-foreground mt-0.5">{note}</p>}
        </div>
        <button
          onClick={() => !locked && toggleF(settingKey)}
          disabled={locked}
          className={cn(
            "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
            isOn(settingKey) ? "bg-primary" : "bg-muted-foreground/30",
            locked && "opacity-60 cursor-not-allowed"
          )}
          data-testid={`toggle-${settingKey}`}
        >
          <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform", isOn(settingKey) ? "translate-x-4" : "translate-x-0.5")} />
        </button>
      </div>
    );
  }

  const heroInterval = Math.round(parseInt(f("ls_home_hero_interval")) / 1000) || 5;
  const isMaintenance = isOn("ls_maintenance_mode_enabled");
  const activeAdZones = ["ls_adzone_home_leaderboard_enabled", "ls_adzone_home_rectangle_enabled", "ls_adzone_article_inline_enabled", "ls_adzone_article_sidebar_enabled", "ls_adzone_podcast_player_enabled", "ls_adzone_mobile_banner_enabled"].filter(k => isOn(k)).length;
  const pwaConfigured = f("ls_pwa_icon_192_url") !== "" && f("ls_pwa_icon_512_url") !== "";

  const manifest = JSON.stringify({
    name: f("ls_pwa_app_name"), short_name: f("ls_pwa_short_name"),
    description: f("ls_pwa_description"), theme_color: f("ls_pwa_theme_color"),
    background_color: f("ls_pwa_background_color"), display: f("ls_pwa_display"),
    orientation: f("ls_pwa_orientation"),
    icons: [
      ...(f("ls_pwa_icon_192_url") ? [{ src: f("ls_pwa_icon_192_url"), sizes: "192x192", type: "image/png" }] : []),
      ...(f("ls_pwa_icon_512_url") ? [{ src: f("ls_pwa_icon_512_url"), sizes: "512x512", type: "image/png" }] : []),
    ],
    start_url: "/", scope: "/",
  }, null, 2);

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="live-site-tab">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
      </div>
    );
  }

  const HOMEPAGE_KEYS = ["ls_home_hero_enabled","ls_home_hero_autoplay","ls_home_hero_interval","ls_home_featured_poll_enabled","ls_home_featured_poll_id","ls_home_featured_events_enabled","ls_home_featured_events_count","ls_home_latest_episodes_count","ls_home_latest_articles_count","ls_home_community_preview_enabled","ls_home_community_preview_count","ls_home_breaking_news_enabled","ls_home_breaking_news_text"];
  const NAV_KEYS = ["ls_nav_bottom_home","ls_nav_bottom_listen","ls_nav_bottom_news","ls_nav_bottom_search","ls_nav_bottom_community","ls_nav_show_categories","ls_nav_show_trending","ls_nav_show_discover","ls_nav_show_events"];
  const PWA_KEYS = ["ls_pwa_app_name","ls_pwa_short_name","ls_pwa_description","ls_pwa_theme_color","ls_pwa_background_color","ls_pwa_display","ls_pwa_orientation","ls_pwa_icon_192_url","ls_pwa_icon_512_url","ls_pwa_splash_screen_url","ls_pwa_ios_status_bar"];
  const MAINT_KEYS = ["ls_maintenance_mode_enabled","ls_maintenance_mode_title","ls_maintenance_mode_message","ls_maintenance_mode_estimated_time","ls_maintenance_contact_email"];
  const COOKIE_KEYS = ["ls_cookie_banner_enabled","ls_cookie_banner_text","ls_cookie_banner_accept_text","ls_cookie_banner_decline_text","ls_cookie_banner_position"];
  const AUDIENCE_KEYS = ["ls_rate_us_enabled","ls_rate_us_trigger_visits","ls_rate_us_app_store_url","ls_rate_us_play_store_url","ls_search_enabled","ls_dark_mode_toggle_enabled","ls_bookmark_enabled"];
  const ADZONE_KEYS = ["ls_adzone_home_leaderboard_enabled","ls_adzone_home_rectangle_enabled","ls_adzone_article_inline_enabled","ls_adzone_article_sidebar_enabled","ls_adzone_podcast_player_enabled","ls_adzone_mobile_banner_enabled"];

  return (
    <div className="space-y-4" data-testid="live-site-tab">
      <SectionHeader icon={Globe2} title="Live Site & App" description="Configure your audience-facing website and mobile app experience" />

      {/* Status Bar */}
      <div className="border border-border bg-card/50 p-4 flex flex-wrap items-center gap-4" data-testid="ls-status-bar">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Site Status:</span>
          {isMaintenance ? (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-[10px] font-mono uppercase" data-testid="badge-maintenance">Maintenance</Badge>
          ) : (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] font-mono uppercase" data-testid="badge-live">Live</Badge>
          )}
        </div>
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-mono">
          <span>Active Ad Zones: <strong className="text-foreground">{activeAdZones}/6</strong></span>
          <span>PWA Configured: <strong className={pwaConfigured ? "text-emerald-400" : "text-red-400"}>{pwaConfigured ? "Yes" : "No"}</strong></span>
          <span>Breaking News: <strong className={isOn("ls_home_breaking_news_enabled") ? "text-emerald-400" : "text-muted-foreground"}>{isOn("ls_home_breaking_news_enabled") ? "ON" : "OFF"}</strong></span>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => window.open("/", "_blank")}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border hover:bg-muted/30 transition-colors"
            data-testid="button-view-live-site"
          >
            <Globe2 className="h-3 w-3" /> View Live Site
          </button>
        </div>
      </div>

      {/* SECTION 1: Homepage Content */}
      <CollapsibleSection id="homepage" title="Homepage Content" icon={Home}>
        <div className="space-y-4">
          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Hero Carousel</h4>
            <ToggleRow label="Enable Hero Carousel" settingKey="ls_home_hero_enabled" />
            {isOn("ls_home_hero_enabled") && (
              <>
                <ToggleRow label="Autoplay" settingKey="ls_home_hero_autoplay" />
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Slide Interval (seconds)</label>
                  <Input type="number" min={3} max={10} value={heroInterval}
                    onChange={e => setF("ls_home_hero_interval", String(parseInt(e.target.value || "5") * 1000))}
                    className="h-8 text-sm max-w-[120px]" data-testid="input-hero-interval" />
                </div>
              </>
            )}
            <p className="text-[11px] text-muted-foreground italic">Manage hero slides in Page Builder → Home page</p>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Content Sections</h4>
            <ToggleRow label="Featured Poll" settingKey="ls_home_featured_poll_enabled" />
            {isOn("ls_home_featured_poll_enabled") && (
              <div className="pl-4 border-l-2 border-primary/30">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Poll Selection</label>
                <Input value={f("ls_home_featured_poll_id")} onChange={e => setF("ls_home_featured_poll_id", e.target.value)}
                  placeholder="Auto (latest active poll)" className="h-8 text-sm" data-testid="input-featured-poll-id" />
              </div>
            )}
            <ToggleRow label="Featured Events" settingKey="ls_home_featured_events_enabled" />
            {isOn("ls_home_featured_events_enabled") && (
              <div className="pl-4 border-l-2 border-primary/30">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Count</label>
                <select value={f("ls_home_featured_events_count")} onChange={e => setF("ls_home_featured_events_count", e.target.value)}
                  className="bg-background border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-events-count">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={String(n)}>{n}</option>)}
                </select>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Latest Episodes</span>
              <select value={f("ls_home_latest_episodes_count")} onChange={e => setF("ls_home_latest_episodes_count", e.target.value)}
                className="bg-background border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-episodes-count">
                {[3,6,9,12].map(n => <option key={n} value={String(n)}>{n}</option>)}
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Latest Articles</span>
              <select value={f("ls_home_latest_articles_count")} onChange={e => setF("ls_home_latest_articles_count", e.target.value)}
                className="bg-background border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-articles-count">
                {[3,6,9,12].map(n => <option key={n} value={String(n)}>{n}</option>)}
              </select>
            </div>
            <ToggleRow label="Community Preview" settingKey="ls_home_community_preview_enabled" />
            {isOn("ls_home_community_preview_enabled") && (
              <div className="pl-4 border-l-2 border-primary/30">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Count</label>
                <select value={f("ls_home_community_preview_count")} onChange={e => setF("ls_home_community_preview_count", e.target.value)}
                  className="bg-background border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-community-count">
                  {[1,2,3,4,5].map(n => <option key={n} value={String(n)}>{n}</option>)}
                </select>
              </div>
            )}
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Breaking News Ticker</h4>
            <ToggleRow label="Enable Breaking News Ticker" settingKey="ls_home_breaking_news_enabled" />
            {isOn("ls_home_breaking_news_enabled") && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Ticker Text</label>
                  <Input value={f("ls_home_breaking_news_text")} onChange={e => setF("ls_home_breaking_news_text", e.target.value.slice(0, 200))}
                    placeholder="BREAKING: Enter breaking news text here" maxLength={200}
                    className="h-8 text-sm" data-testid="input-breaking-news-text" />
                  <p className="text-[10px] text-muted-foreground mt-1">{f("ls_home_breaking_news_text").length}/200 characters</p>
                </div>
                <p className="text-[11px] text-muted-foreground italic">Appears as a scrolling banner at the top of the audience site when enabled</p>
                {f("ls_home_breaking_news_text") && (
                  <div className="bg-red-600 text-white py-1.5 px-4 text-xs font-semibold overflow-hidden whitespace-nowrap" data-testid="preview-breaking-news">
                    <div className="animate-pulse inline-block mr-2">BREAKING</div>
                    {f("ls_home_breaking_news_text")}
                  </div>
                )}
              </>
            )}
          </div>
          <SaveBtn section="Homepage" keys={HOMEPAGE_KEYS} />
        </div>
      </CollapsibleSection>

      {/* SECTION 2: Navigation & Menus */}
      <CollapsibleSection id="navigation" title="Navigation & Menus" icon={Navigation}>
        <div className="space-y-4">
          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Bottom Navigation Bar (Mobile)</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Home</span>
                  <Badge variant="outline" className="text-[9px] ml-1">Locked</Badge>
                </div>
                <button disabled className={cn("relative inline-flex h-5 w-9 items-center rounded-full bg-primary opacity-60 cursor-not-allowed")} data-testid="toggle-ls_nav_bottom_home">
                  <span className="inline-block h-3.5 w-3.5 rounded-full bg-white translate-x-4" />
                </button>
              </div>
              {[
                { key: "ls_nav_bottom_listen", icon: Volume2, label: "Listen" },
                { key: "ls_nav_bottom_news", icon: FileText, label: "News" },
                { key: "ls_nav_bottom_search", icon: SearchIcon, label: "Search" },
                { key: "ls_nav_bottom_community", icon: Heart, label: "Community" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <button onClick={() => toggleF(item.key)}
                    className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", isOn(item.key) ? "bg-primary" : "bg-muted-foreground/30")}
                    data-testid={`toggle-${item.key}`}>
                    <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform", isOn(item.key) ? "translate-x-4" : "translate-x-0.5")} />
                  </button>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground italic">Home tab cannot be disabled</p>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Top Navigation Categories</h4>
            <ToggleRow label="Show Categories Row" settingKey="ls_nav_show_categories" />
            <ToggleRow label="Show Trending" settingKey="ls_nav_show_trending" />
            <ToggleRow label="Show Discover" settingKey="ls_nav_show_discover" />
            <ToggleRow label="Show Events" settingKey="ls_nav_show_events" />
            <p className="text-[11px] text-muted-foreground italic">These appear in the horizontal scroll navigation below the site header</p>
          </div>
          <SaveBtn section="Navigation" keys={NAV_KEYS} />
        </div>
      </CollapsibleSection>

      {/* SECTION 3: PWA & Mobile App */}
      <CollapsibleSection id="pwa" title="PWA & Mobile App" icon={Smartphone}>
        <div className="space-y-4">
          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">App Identity</h4>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">App Name</label>
              <Input value={f("ls_pwa_app_name")} onChange={e => setF("ls_pwa_app_name", e.target.value.slice(0, 45))}
                maxLength={45} className="h-8 text-sm" data-testid="input-pwa-app-name" />
              <p className="text-[10px] text-muted-foreground mt-1">Full name shown in app stores and install prompts ({f("ls_pwa_app_name").length}/45)</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Short Name</label>
              <Input value={f("ls_pwa_short_name")} onChange={e => setF("ls_pwa_short_name", e.target.value.slice(0, 12))}
                maxLength={12} className="h-8 text-sm" data-testid="input-pwa-short-name" />
              <p className="text-[10px] text-muted-foreground mt-1">Shown on home screen under the icon ({f("ls_pwa_short_name").length}/12)</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Description</label>
              <textarea value={f("ls_pwa_description")} onChange={e => setF("ls_pwa_description", e.target.value.slice(0, 200))}
                maxLength={200} rows={2} className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" data-testid="input-pwa-description" />
              <p className="text-[10px] text-muted-foreground mt-1">{f("ls_pwa_description").length}/200</p>
            </div>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">App Colors</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Theme Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={f("ls_pwa_theme_color")} onChange={e => setF("ls_pwa_theme_color", e.target.value)}
                    className="h-8 w-10 border border-border cursor-pointer" data-testid="color-pwa-theme" />
                  <Input value={f("ls_pwa_theme_color")} onChange={e => setF("ls_pwa_theme_color", e.target.value)}
                    className="h-8 text-sm font-mono flex-1" data-testid="input-pwa-theme-color" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Browser chrome color on Android</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={f("ls_pwa_background_color")} onChange={e => setF("ls_pwa_background_color", e.target.value)}
                    className="h-8 w-10 border border-border cursor-pointer" data-testid="color-pwa-bg" />
                  <Input value={f("ls_pwa_background_color")} onChange={e => setF("ls_pwa_background_color", e.target.value)}
                    className="h-8 text-sm font-mono flex-1" data-testid="input-pwa-bg-color" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Splash screen background color</p>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">iOS Status Bar Style</label>
              <select value={f("ls_pwa_ios_status_bar")} onChange={e => setF("ls_pwa_ios_status_bar", e.target.value)}
                className="bg-background border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-ios-status-bar">
                <option value="default">Default</option>
                <option value="black">Black</option>
                <option value="black-translucent">Black Translucent</option>
              </select>
            </div>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">App Icons</h4>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">192x192 Icon URL</label>
              <Input value={f("ls_pwa_icon_192_url")} onChange={e => setF("ls_pwa_icon_192_url", e.target.value)}
                placeholder="https://..." className="h-8 text-sm" data-testid="input-pwa-icon-192" />
              {f("ls_pwa_icon_192_url") && <img src={f("ls_pwa_icon_192_url")} alt="192x192 icon" className="h-12 w-12 border border-border mt-2 object-contain" />}
              <p className="text-[10px] text-muted-foreground mt-1">Required for Android home screen and PWA install</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">512x512 Icon URL</label>
              <Input value={f("ls_pwa_icon_512_url")} onChange={e => setF("ls_pwa_icon_512_url", e.target.value)}
                placeholder="https://..." className="h-8 text-sm" data-testid="input-pwa-icon-512" />
              {f("ls_pwa_icon_512_url") && <img src={f("ls_pwa_icon_512_url")} alt="512x512 icon" className="h-16 w-16 border border-border mt-2 object-contain" />}
              <p className="text-[10px] text-muted-foreground mt-1">Required for splash screen and app stores</p>
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Splash Screen URL</label>
              <Input value={f("ls_pwa_splash_screen_url")} onChange={e => setF("ls_pwa_splash_screen_url", e.target.value)}
                placeholder="https://..." className="h-8 text-sm" data-testid="input-pwa-splash" />
              {f("ls_pwa_splash_screen_url") && <img src={f("ls_pwa_splash_screen_url")} alt="Splash screen" className="h-24 border border-border mt-2 object-contain" />}
              <p className="text-[10px] text-muted-foreground mt-1">Full screen image shown while app loads on iOS</p>
            </div>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Display Settings</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Display Mode</label>
                <select value={f("ls_pwa_display")} onChange={e => setF("ls_pwa_display", e.target.value)}
                  className="w-full bg-background border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-pwa-display">
                  <option value="standalone">Standalone (no browser chrome)</option>
                  <option value="fullscreen">Fullscreen</option>
                  <option value="minimal-ui">Minimal UI</option>
                  <option value="browser">Browser</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Orientation</label>
                <select value={f("ls_pwa_orientation")} onChange={e => setF("ls_pwa_orientation", e.target.value)}
                  className="w-full bg-background border border-border px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary" data-testid="select-pwa-orientation">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                  <option value="any">Any</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">PWA Manifest Preview</h4>
            <button onClick={() => setPwaManifestOpen(!pwaManifestOpen)}
              className="flex items-center gap-2 text-xs text-primary hover:underline font-mono" data-testid="toggle-manifest-preview">
              {pwaManifestOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              {pwaManifestOpen ? "Hide" : "View"} manifest.json
            </button>
            {pwaManifestOpen && (
              <pre className="bg-background border border-border p-3 text-xs font-mono text-foreground overflow-auto max-h-64" data-testid="manifest-preview">{manifest}</pre>
            )}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {f("ls_pwa_icon_192_url") ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                <span className={f("ls_pwa_icon_192_url") ? "text-emerald-400" : "text-red-400"}>192x192 Icon</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {f("ls_pwa_icon_512_url") ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                <span className={f("ls_pwa_icon_512_url") ? "text-emerald-400" : "text-red-400"}>512x512 Icon</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {f("ls_pwa_app_name") ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                <span className={f("ls_pwa_app_name") ? "text-emerald-400" : "text-red-400"}>Manifest Valid</span>
              </div>
            </div>
          </div>
          <SaveBtn section="PWA" keys={PWA_KEYS} />
        </div>
      </CollapsibleSection>

      {/* SECTION 4: Maintenance Mode */}
      <CollapsibleSection id="maintenance" title="Maintenance Mode" icon={Wrench}>
        <div className="space-y-4">
          {isMaintenance && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 flex items-center gap-2" data-testid="maintenance-active-warning">
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0" />
              <span className="text-xs text-red-400 font-semibold">MAINTENANCE MODE IS CURRENTLY ACTIVE — All audience visitors see the maintenance page</span>
            </div>
          )}

          <div className={cn("border p-4 space-y-3", isMaintenance ? "border-red-500/30 bg-red-500/5" : "border-border bg-card/30")}>
            <ToggleRow label="Enable Maintenance Mode" settingKey="ls_maintenance_mode_enabled" />
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-2 flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <span className="text-[11px] text-yellow-400">Enabling this will show a maintenance page to ALL audience visitors immediately</span>
            </div>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Page Title</label>
              <Input value={f("ls_maintenance_mode_title")} onChange={e => setF("ls_maintenance_mode_title", e.target.value)}
                className="h-8 text-sm" data-testid="input-maintenance-title" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Message</label>
              <textarea value={f("ls_maintenance_mode_message")} onChange={e => setF("ls_maintenance_mode_message", e.target.value)}
                rows={3} className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" data-testid="input-maintenance-message" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Estimated Return Time</label>
              <Input value={f("ls_maintenance_mode_estimated_time")} onChange={e => setF("ls_maintenance_mode_estimated_time", e.target.value)}
                placeholder="Back online in approximately 2 hours" className="h-8 text-sm" data-testid="input-maintenance-eta" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Contact Email</label>
              <Input value={f("ls_maintenance_contact_email")} onChange={e => setF("ls_maintenance_contact_email", e.target.value)}
                type="email" className="h-8 text-sm" data-testid="input-maintenance-email" />
            </div>
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Live Preview</h4>
            <div className="bg-background border border-border p-8 text-center space-y-3" data-testid="maintenance-preview">
              <Wrench className="h-10 w-10 mx-auto text-muted-foreground" />
              <h3 className="text-lg font-bold text-foreground">{f("ls_maintenance_mode_title") || "We'll be right back"}</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{f("ls_maintenance_mode_message") || "We're making some improvements. Check back soon."}</p>
              {f("ls_maintenance_mode_estimated_time") && (
                <p className="text-xs text-muted-foreground italic">{f("ls_maintenance_mode_estimated_time")}</p>
              )}
              {f("ls_maintenance_contact_email") && (
                <p className="text-xs text-muted-foreground">Contact: <span className="text-primary">{f("ls_maintenance_contact_email")}</span></p>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground italic">Admin users are never shown the maintenance page. Use an incognito window to test.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <SaveBtn section="Maintenance" keys={MAINT_KEYS} />
            <button onClick={() => setMaintenanceConfirm(true)}
              className={cn("flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider",
                isMaintenance ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-red-600 text-white hover:bg-red-700")}
              data-testid="button-activate-maintenance">
              <AlertTriangle className="h-3 w-3" />
              {isMaintenance ? "Deactivate Maintenance Mode" : "Activate Maintenance Mode"}
            </button>
          </div>
        </div>
      </CollapsibleSection>

      {/* Maintenance Confirmation Dialog */}
      <Dialog open={maintenanceConfirm} onOpenChange={setMaintenanceConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isMaintenance ? "Deactivate Maintenance Mode?" : "Activate Maintenance Mode?"}</DialogTitle>
            <DialogDescription>
              {isMaintenance
                ? "This will restore normal site access for all visitors."
                : "This will immediately show the maintenance page to all visitors. Continue?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMaintenanceConfirm(false)} data-testid="button-cancel-maintenance">Cancel</Button>
            <Button variant={isMaintenance ? "default" : "destructive"} onClick={activateMaintenanceMode} data-testid="button-confirm-maintenance">
              {isMaintenance ? "Deactivate" : "Activate Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SECTION 5: Cookie & Privacy Banner */}
      <CollapsibleSection id="cookie" title="Cookie & Privacy Banner" icon={Cookie}>
        <div className="space-y-4">
          <ToggleRow label="Enable Cookie Banner" settingKey="ls_cookie_banner_enabled" />

          {isOn("ls_cookie_banner_enabled") && (
            <div className="border border-border bg-card/30 p-4 space-y-3">
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Banner Text</label>
                <textarea value={f("ls_cookie_banner_text")} onChange={e => setF("ls_cookie_banner_text", e.target.value.slice(0, 200))}
                  maxLength={200} rows={2} className="w-full bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary resize-none" data-testid="input-cookie-text" />
                <p className="text-[10px] text-muted-foreground mt-1">{f("ls_cookie_banner_text").length}/200</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Accept Button Text</label>
                  <Input value={f("ls_cookie_banner_accept_text")} onChange={e => setF("ls_cookie_banner_accept_text", e.target.value)}
                    className="h-8 text-sm" data-testid="input-cookie-accept" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Decline Button Text</label>
                  <Input value={f("ls_cookie_banner_decline_text")} onChange={e => setF("ls_cookie_banner_decline_text", e.target.value)}
                    className="h-8 text-sm" data-testid="input-cookie-decline" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Position</label>
                <div className="flex gap-4">
                  {["bottom", "top"].map(pos => (
                    <label key={pos} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="cookie-position" checked={f("ls_cookie_banner_position") === pos}
                        onChange={() => setF("ls_cookie_banner_position", pos)} className="accent-primary" data-testid={`radio-cookie-${pos}`} />
                      <span className="text-sm capitalize">{pos}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Live Preview</h4>
                <div className="relative bg-background border border-border min-h-[120px]" data-testid="cookie-preview">
                  <div className="p-4 text-center text-xs text-muted-foreground">Page Content</div>
                  <div className={cn("absolute left-0 right-0 bg-card border-t border-border px-4 py-3 flex items-center justify-between gap-4",
                    f("ls_cookie_banner_position") === "top" ? "top-0 border-t-0 border-b" : "bottom-0")}>
                    <p className="text-[11px] text-foreground flex-1">{f("ls_cookie_banner_text")}</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="px-3 py-1 text-[10px] font-mono uppercase border border-border bg-card hover:bg-muted/50">{f("ls_cookie_banner_decline_text")}</button>
                      <button className="px-3 py-1 text-[10px] font-mono uppercase bg-primary text-primary-foreground">{f("ls_cookie_banner_accept_text")}</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <SaveBtn section="Cookie & Privacy" keys={COOKIE_KEYS} />
        </div>
      </CollapsibleSection>

      {/* SECTION 6: Audience Features */}
      <CollapsibleSection id="audience" title="Audience Features" icon={Heart}>
        <div className="space-y-4">
          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Rate Us Prompt</h4>
            <ToggleRow label="Enable Rate Us Prompt" settingKey="ls_rate_us_enabled" />
            {isOn("ls_rate_us_enabled") && (
              <div className="pl-4 border-l-2 border-primary/30 space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Show After X Visits</label>
                  <Input type="number" min={1} max={10} value={f("ls_rate_us_trigger_visits")}
                    onChange={e => setF("ls_rate_us_trigger_visits", e.target.value)}
                    className="h-8 text-sm max-w-[120px]" data-testid="input-rate-trigger" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">App Store URL</label>
                  <Input value={f("ls_rate_us_app_store_url")} onChange={e => setF("ls_rate_us_app_store_url", e.target.value)}
                    placeholder="https://apps.apple.com/app/..." className="h-8 text-sm" data-testid="input-appstore-url" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-mono block mb-1">Play Store URL</label>
                  <Input value={f("ls_rate_us_play_store_url")} onChange={e => setF("ls_rate_us_play_store_url", e.target.value)}
                    placeholder="https://play.google.com/store/apps/..." className="h-8 text-sm" data-testid="input-playstore-url" />
                </div>
              </div>
            )}
          </div>

          <div className="border border-border bg-card/30 p-4 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Other Feature Toggles</h4>
            <ToggleRow label="Enable Search" settingKey="ls_search_enabled" note="Shows search icon in header and /search page" />
            <ToggleRow label="Dark/Light Mode Toggle" settingKey="ls_dark_mode_toggle_enabled" note="Shows a moon/sun icon in the header for visitors to switch modes" />
            <ToggleRow label="Bookmarks" settingKey="ls_bookmark_enabled" note="Allows visitors to save articles and episodes" />
          </div>
          <SaveBtn section="Audience Features" keys={AUDIENCE_KEYS} />
        </div>
      </CollapsibleSection>

      {/* SECTION 7: Ad Zones */}
      <CollapsibleSection id="adzones" title="Ad Zones" icon={Megaphone}>
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">Enable or disable ad placement zones across the audience site. Disabling a zone removes ads from that location without deleting campaigns.</p>
          <div className="border border-border bg-card/30 divide-y divide-border">
            {[
              { key: "ls_adzone_home_leaderboard_enabled", label: "Home Page — Leaderboard", desc: "728x90 below hero" },
              { key: "ls_adzone_home_rectangle_enabled", label: "Home Page — Rectangle", desc: "300x250 in content feed" },
              { key: "ls_adzone_article_inline_enabled", label: "Article Pages — Inline", desc: "Between paragraphs" },
              { key: "ls_adzone_article_sidebar_enabled", label: "Article Pages — Sidebar", desc: "300x250 right column" },
              { key: "ls_adzone_podcast_player_enabled", label: "Podcast Player — Sponsor Panel", desc: "Sponsor display in player" },
              { key: "ls_adzone_mobile_banner_enabled", label: "Mobile — Banner", desc: "320x50 above bottom nav" },
            ].map(zone => (
              <div key={zone.key} className="flex items-center justify-between px-4 py-3">
                <div>
                  <span className="text-sm text-foreground font-medium">{zone.label}</span>
                  <p className="text-[11px] text-muted-foreground">{zone.desc}</p>
                </div>
                <button onClick={() => toggleF(zone.key)}
                  className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", isOn(zone.key) ? "bg-primary" : "bg-muted-foreground/30")}
                  data-testid={`toggle-${zone.key}`}>
                  <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform", isOn(zone.key) ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground italic">Manage ad content and sponsorships in Revenue Factory → Advertising</p>
          <SaveBtn section="Ad Zones" keys={ADZONE_KEYS} />
        </div>
      </CollapsibleSection>

      {/* Save All Footer */}
      <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur border-t border-border p-4 flex items-center justify-between -mx-4 mt-6" data-testid="ls-save-all-footer">
        <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Unsaved changes apply to all sections</span>
        <button onClick={saveAll} disabled={saving.all}
          className="flex items-center gap-2 px-6 py-2.5 text-xs font-mono uppercase tracking-wider bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          data-testid="button-save-all-live-site">
          {saving.all ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save All Live Site Settings
        </button>
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

function PageConfigurationTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [renamingSectionKey, setRenamingSectionKey] = useState<string | null>(null);
  const [sectionRenameValue, setSectionRenameValue] = useState("");
  const [renamingPageKey, setRenamingPageKey] = useState<string | null>(null);
  const [pageRenameValue, setPageRenameValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editNewSection, setEditNewSection] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showAddPage, setShowAddPage] = useState<string | null>(null);
  const [newPageForm, setNewPageForm] = useState({ pageKey: "", title: "", route: "", iconName: "Blocks", permission: "dashboard.view" });
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionForm, setNewSectionForm] = useState({ sectionKey: "", displayName: "", iconName: "Blocks" });
  const [deletePageConfirm, setDeletePageConfirm] = useState<{ pageKey: string; title: string; isVisible: boolean } | null>(null);
  const [deleteSectionConfirm, setDeleteSectionConfirm] = useState<{ sectionKey: string; label: string } | null>(null);

  const [dragSectionKey, setDragSectionKey] = useState<string | null>(null);
  const [dragOverSectionKey, setDragOverSectionKey] = useState<string | null>(null);
  const [dragPageKey, setDragPageKey] = useState<string | null>(null);
  const [dragOverPageTarget, setDragOverPageTarget] = useState<{ sectionKey: string; index?: number } | null>(null);

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

  const sortedSections = useMemo(() => {
    if (!navSections) return [];
    return [...navSections].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [navSections]);

  const sectionPages = useMemo(() => {
    if (!configs) return {};
    const grouped: Record<string, PageCfg[]> = {};
    for (const cfg of configs) {
      const s = cfg.navSection ?? "ungrouped";
      if (!grouped[s]) grouped[s] = [];
      grouped[s].push(cfg);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return grouped;
  }, [configs]);

  const updatePageMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-sections"] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateSectionMutation = useMutation({
    mutationFn: async ({ sectionKey, data }: { sectionKey: string; data: Record<string, any> }) => {
      const res = await fetch(`/api/admin/nav-sections/${sectionKey}`, {
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

  const reorderPagesMutation = useMutation({
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
      const res = await fetch("/api/admin/page-config/reset", { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error("Failed to reset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-sections"] });
      setShowResetDialog(false);
      toast({ title: "Reset Complete", description: "Navigation restored to defaults." });
    },
  });

  const createPageMutation = useMutation({
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
      toast({ title: "Page Added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createSectionMutation = useMutation({
    mutationFn: async (section: { sectionKey: string; displayName: string; iconName: string; sortOrder: number }) => {
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
      setAddingSection(false);
      setNewSectionForm({ sectionKey: "", displayName: "", iconName: "Blocks" });
      toast({ title: "Section Added" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageKey: string) => {
      console.log("[PageConfig] Deleting page:", pageKey);
      const res = await fetch(`/api/admin/page-config/${pageKey}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const errorBody = await res.text();
        console.error("[PageConfig] Delete page failed:", res.status, errorBody);
        throw new Error(`Failed to delete page: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-sections"] });
      setDeletePageConfirm(null);
      toast({ title: "Deleted", description: "Page removed from navigation." });
    },
    onError: (err: any) => {
      console.error("[PageConfig] Delete page mutation error:", err);
      toast({ title: "Delete Failed", description: err.message || "Could not delete page.", variant: "destructive" });
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionKey: string) => {
      console.log("[PageConfig] Deleting section:", sectionKey);
      const res = await fetch(`/api/admin/nav-sections/${sectionKey}?cascade=true`, { method: "DELETE", credentials: "include" });
      if (!res.ok) {
        const errorBody = await res.text();
        console.error("[PageConfig] Delete section failed:", res.status, errorBody);
        throw new Error(`Failed to delete section: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/nav-sections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/page-config"] });
      setDeleteSectionConfirm(null);
      toast({ title: "Section Deleted", description: "Section and its pages have been removed." });
    },
    onError: (err: any) => {
      console.error("[PageConfig] Delete section mutation error:", err);
      toast({ title: "Delete Failed", description: err.message || "Could not delete section.", variant: "destructive" });
    },
  });

  const handleSectionRenameStart = (section: NavSectionData) => {
    setRenamingSectionKey(section.sectionKey);
    setSectionRenameValue(section.displayName);
    setRenamingPageKey(null);
  };

  const handleSectionRenameSave = (sectionKey: string) => {
    if (!sectionRenameValue.trim()) { setRenamingSectionKey(null); return; }
    updateSectionMutation.mutate(
      { sectionKey, data: { displayName: sectionRenameValue.trim() } },
      { onSuccess: () => { setRenamingSectionKey(null); toast({ title: "Section renamed" }); } }
    );
  };

  const handlePageRenameStart = (config: PageCfg) => {
    setRenamingPageKey(config.pageKey);
    setPageRenameValue(config.title);
    setRenamingSectionKey(null);
  };

  const handlePageRenameSave = (pageKey: string) => {
    if (!pageRenameValue.trim()) { setRenamingPageKey(null); return; }
    updatePageMutation.mutate(
      { pageKey, data: { title: pageRenameValue.trim() } },
      { onSuccess: () => { setRenamingPageKey(null); toast({ title: "Page renamed" }); } }
    );
  };

  const toggleVisibility = (config: PageCfg) => {
    updatePageMutation.mutate({ pageKey: config.pageKey, data: { isVisible: !(config.isVisible !== false) } });
  };

  const startFullEdit = (config: PageCfg) => {
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
    setRenamingPageKey(null);
  };

  const handleFullSave = (pageKey: string) => {
    const data: Record<string, any> = { ...editForm };
    if (editForm.navSection === "__new__" && editNewSection) data.navSection = editNewSection;
    updatePageMutation.mutate({ pageKey, data }, { onSuccess: () => { setEditingKey(null); toast({ title: "Saved" }); } });
  };

  const handleSectionDragStart = (e: React.DragEvent, sectionKey: string) => {
    setDragSectionKey(sectionKey);
    setDragPageKey(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/section-key", sectionKey);
  };

  const handleSectionDragOver = (e: React.DragEvent, sectionKey: string) => {
    if (!dragSectionKey) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSectionKey(sectionKey);
  };

  const handleSectionDrop = (e: React.DragEvent, targetKey: string) => {
    e.preventDefault();
    if (!dragSectionKey || dragSectionKey === targetKey) {
      setDragSectionKey(null);
      setDragOverSectionKey(null);
      return;
    }
    const reordered = [...sortedSections];
    const fromIdx = reordered.findIndex(s => s.sectionKey === dragSectionKey);
    const toIdx = reordered.findIndex(s => s.sectionKey === targetKey);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    reordered.forEach((s, idx) => {
      updateSectionMutation.mutate({ sectionKey: s.sectionKey, data: { sortOrder: idx } });
    });
    setDragSectionKey(null);
    setDragOverSectionKey(null);
  };

  const handlePageDragStart = (e: React.DragEvent, pageKey: string) => {
    setDragPageKey(pageKey);
    setDragSectionKey(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/page-key", pageKey);
  };

  const handlePageDragOver = (e: React.DragEvent, sectionKey: string, index?: number) => {
    if (!dragPageKey) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setDragOverPageTarget({ sectionKey, index });
  };

  const handlePageDrop = (e: React.DragEvent, targetSection: string, targetIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragPageKey || !configs) return;

    const draggedIdx = configs.findIndex(c => c.pageKey === dragPageKey);
    if (draggedIdx === -1) return;

    const dragged = { ...configs[draggedIdx] };
    dragged.navSection = targetSection;

    const sectionItems = configs
      .filter(c => (c.navSection ?? "") === targetSection && c.pageKey !== dragPageKey)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const insertAt = targetIndex !== undefined ? targetIndex : sectionItems.length;
    sectionItems.splice(insertAt, 0, dragged);

    const reorderPages = sectionItems.map((item, idx) => ({
      pageKey: item.pageKey,
      sortOrder: idx,
      navSection: targetSection,
    }));

    reorderPagesMutation.mutate(reorderPages);
    setDragPageKey(null);
    setDragOverPageTarget(null);
  };

  const handleAddPage = (sectionKey: string) => {
    if (!newPageForm.pageKey || !newPageForm.title || !newPageForm.route) {
      toast({ title: "Missing fields", description: "Page key, title, and route are required.", variant: "destructive" });
      return;
    }
    const items = sectionPages[sectionKey] || [];
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.sortOrder)) : 0;
    createPageMutation.mutate({ ...newPageForm, navSection: sectionKey, sortOrder: maxOrder + 1 });
  };

  const handleAddSection = () => {
    if (!newSectionForm.sectionKey || !newSectionForm.displayName) {
      toast({ title: "Missing fields", description: "Section key and display name are required.", variant: "destructive" });
      return;
    }
    const maxOrder = sortedSections.length > 0 ? Math.max(...sortedSections.map(s => s.sortOrder)) : 0;
    createSectionMutation.mutate({ ...newSectionForm, sortOrder: maxOrder + 1 });
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
        <SectionHeader icon={LayoutGrid} title="Navigation Manager" description="Organize sidebar pages, sections, and visibility. Drag to reorder, click pencil to rename." />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setAddingSection(true); setNewSectionForm({ sectionKey: "", displayName: "", iconName: "Blocks" }); }}
            className="h-8 text-xs font-mono"
            data-testid="button-add-section"
          >
            <Plus className="h-3 w-3 mr-1.5" />
            Add Section
          </Button>
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
      </div>

      {addingSection && (
        <div className="border rounded-sm border-primary/30 bg-primary/5 p-4 space-y-2" data-testid="add-section-form">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Section Key</Label>
              <Input value={newSectionForm.sectionKey} onChange={(e) => setNewSectionForm(f => ({ ...f, sectionKey: e.target.value }))} placeholder="my-section" className="h-7 text-xs mt-0.5" data-testid="input-new-section-key" />
            </div>
            <div>
              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Display Name</Label>
              <Input value={newSectionForm.displayName} onChange={(e) => setNewSectionForm(f => ({ ...f, displayName: e.target.value }))} placeholder="My Section" className="h-7 text-xs mt-0.5" data-testid="input-new-section-display" />
            </div>
            <div>
              <Label className="text-[10px] font-mono uppercase text-muted-foreground">Icon</Label>
              <IconPickerPopover value={newSectionForm.iconName} onChange={(v) => setNewSectionForm(f => ({ ...f, iconName: v }))} testId="icon-picker-new-section" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleAddSection} disabled={createSectionMutation.isPending} className="h-7 px-3 text-[10px] font-mono uppercase" data-testid="button-confirm-add-section">
              {createSectionMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
              Add
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAddingSection(false)} className="h-7 px-2 text-[10px]" data-testid="button-cancel-add-section">Cancel</Button>
          </div>
        </div>
      )}

      <div className="border rounded-sm border-border/50">
        {sortedSections.map((section, sectionIdx) => {
          const SectionIcon = getIcon(section.iconName || "Blocks");
          const pages = sectionPages[section.sectionKey] || [];
          const isCollapsed = collapsedSections[section.sectionKey];
          const isSectionDragging = dragSectionKey === section.sectionKey;
          const isSectionDragOver = dragOverSectionKey === section.sectionKey && dragSectionKey !== null;
          const isPageDragOverSection = dragOverPageTarget?.sectionKey === section.sectionKey && dragPageKey !== null;
          const isRenamingSection = renamingSectionKey === section.sectionKey;

          return (
            <div key={section.sectionKey} data-testid={`section-${section.sectionKey}`}>
              {sectionIdx > 0 && <div className="border-t border-border/30" />}

              {isSectionDragOver && <div className="h-0.5 bg-primary mx-4" />}

              <div
                draggable={!isRenamingSection}
                onDragStart={(e) => handleSectionDragStart(e, section.sectionKey)}
                onDragEnd={() => { setDragSectionKey(null); setDragOverSectionKey(null); }}
                onDragOver={(e) => {
                  handleSectionDragOver(e, section.sectionKey);
                  if (dragPageKey) { e.preventDefault(); setDragOverPageTarget({ sectionKey: section.sectionKey }); }
                }}
                onDrop={(e) => {
                  if (dragSectionKey) handleSectionDrop(e, section.sectionKey);
                  else if (dragPageKey) handlePageDrop(e, section.sectionKey);
                }}
                className={cn(
                  "group/sectionrow flex items-center gap-2 px-4 py-2 transition-all",
                  isSectionDragging && "opacity-40",
                  isPageDragOverSection && "bg-primary/5 border-l-2 border-l-primary",
                  !isSectionDragging && "hover:bg-card/50"
                )}
                data-testid={`manage-section-${section.sectionKey}`}
              >
                <div className="cursor-grab active:cursor-grabbing flex-shrink-0">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                </div>

                <button
                  onClick={() => setCollapsedSections(prev => ({ ...prev, [section.sectionKey]: !prev[section.sectionKey] }))}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                  data-testid={`button-toggle-section-${section.sectionKey}`}
                >
                  {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                <SectionIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  {isRenamingSection ? (
                    <div className="flex items-center gap-1.5">
                      <Input
                        autoFocus
                        value={sectionRenameValue}
                        onChange={(e) => setSectionRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSectionRenameSave(section.sectionKey);
                          if (e.key === "Escape") setRenamingSectionKey(null);
                        }}
                        className="h-7 text-sm font-medium max-w-[200px]"
                        data-testid={`input-section-rename-${section.sectionKey}`}
                      />
                      <button onClick={() => handleSectionRenameSave(section.sectionKey)} className="p-1 rounded hover:bg-primary/10 text-primary" data-testid={`button-save-section-rename-${section.sectionKey}`}>
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setRenamingSectionKey(null)} className="p-1 rounded hover:bg-muted text-muted-foreground" data-testid={`button-cancel-section-rename-${section.sectionKey}`}>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold truncate block">{section.displayName}</span>
                  )}
                </div>

                <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 flex-shrink-0">
                  {pages.length}
                </Badge>

                {!isRenamingSection && (
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleSectionRenameStart(section)}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Rename section"
                      data-testid={`button-edit-section-${section.sectionKey}`}
                    >
                      <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        const visiblePages = (sectionPages[section.sectionKey] || []).filter(c => c.isVisible !== false);
                        if (visiblePages.length > 0) {
                          toast({ title: "Cannot Delete", description: "Hide all pages in this section first.", variant: "destructive" });
                          return;
                        }
                        setDeleteSectionConfirm({ sectionKey: section.sectionKey, label: section.displayName });
                      }}
                      className="p-1 rounded opacity-0 group-hover/sectionrow:opacity-100 transition-all hover:bg-destructive/10"
                      title="Delete section"
                      data-testid={`button-delete-section-${section.sectionKey}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                    <button
                      onClick={() => {
                        setShowAddPage(section.sectionKey);
                        setNewPageForm({ pageKey: "", title: "", route: "", iconName: "Blocks", permission: "dashboard.view" });
                      }}
                      className="p-1 rounded hover:bg-muted transition-colors"
                      title="Add page"
                      data-testid={`button-add-page-${section.sectionKey}`}
                    >
                      <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {!isCollapsed && (
                <div>
                  {pages.map((config, pageIdx) => {
                    const PageIcon = getIcon(config.iconName);
                    const isEditing = editingKey === config.pageKey;
                    const isRenamingPage = renamingPageKey === config.pageKey;
                    const isPageDragging = dragPageKey === config.pageKey;
                    const isHidden = config.isVisible === false;
                    const isDropTarget = dragOverPageTarget?.sectionKey === section.sectionKey && dragOverPageTarget?.index === pageIdx && dragPageKey !== null;

                    return (
                      <div key={config.pageKey} data-testid={`row-page-config-${config.pageKey}`}>
                        {isDropTarget && <div className="h-0.5 bg-primary ml-10 mr-4" />}

                        <div
                          draggable={!isEditing && !isRenamingPage}
                          onDragStart={(e) => handlePageDragStart(e, config.pageKey)}
                          onDragEnd={() => { setDragPageKey(null); setDragOverPageTarget(null); }}
                          onDragOver={(e) => handlePageDragOver(e, section.sectionKey, pageIdx)}
                          onDrop={(e) => handlePageDrop(e, section.sectionKey, pageIdx)}
                          className={cn(
                            "group/pagerow flex items-center gap-2 pl-10 pr-4 py-1.5 transition-all border-l-2 border-l-border/20 ml-6",
                            isPageDragging && "opacity-40",
                            isHidden && "opacity-50",
                            isEditing ? "bg-primary/5 border-l-primary/30" : "hover:bg-card/30"
                          )}
                        >
                          <div className="cursor-grab active:cursor-grabbing flex-shrink-0">
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30" />
                          </div>

                          <PageIcon className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2 py-1">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title</Label>
                                    <Input value={editForm.title} onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))} className="h-7 text-xs mt-0.5" data-testid={`input-title-${config.pageKey}`} />
                                  </div>
                                  <div>
                                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Icon</Label>
                                    <IconPickerPopover value={editForm.iconName} onChange={(v) => setEditForm(f => ({ ...f, iconName: v }))} testId={`icon-picker-${config.pageKey}`} />
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-[10px] font-mono uppercase text-muted-foreground">Description</Label>
                                  <Input value={editForm.description} onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))} className="h-7 text-xs mt-0.5" data-testid={`input-description-${config.pageKey}`} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Nav Section</Label>
                                    <Select value={editForm.navSection} onValueChange={(v) => setEditForm(f => ({ ...f, navSection: v }))}>
                                      <SelectTrigger className="h-7 text-xs mt-0.5" data-testid={`select-navsection-${config.pageKey}`}><SelectValue /></SelectTrigger>
                                      <SelectContent>
                                        {navSections?.filter(ns => ns.sectionKey).map(ns => (
                                          <SelectItem key={ns.sectionKey} value={ns.sectionKey}>{ns.displayName}</SelectItem>
                                        ))}
                                        <SelectItem value="__new__">New Section...</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {editForm.navSection === "__new__" && (
                                      <Input value={editNewSection} onChange={(e) => setEditNewSection(e.target.value)} placeholder="new-section-key" className="h-7 text-xs mt-1" data-testid={`input-new-navsection-${config.pageKey}`} />
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-[10px] font-mono uppercase text-muted-foreground">Primary Action</Label>
                                    <Input value={editForm.primaryActionLabel} onChange={(e) => setEditForm(f => ({ ...f, primaryActionLabel: e.target.value }))} className="h-7 text-xs mt-0.5" data-testid={`input-primary-action-${config.pageKey}`} />
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                  <Button size="sm" onClick={() => handleFullSave(config.pageKey)} disabled={updatePageMutation.isPending} className="h-7 px-3 text-[10px] font-mono uppercase" data-testid={`button-save-config-${config.pageKey}`}>
                                    {updatePageMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingKey(null)} className="h-7 px-2 text-[10px]" data-testid={`button-cancel-config-${config.pageKey}`}>Cancel</Button>
                                </div>
                              </div>
                            ) : isRenamingPage ? (
                              <div className="flex items-center gap-1.5">
                                <Input
                                  autoFocus
                                  value={pageRenameValue}
                                  onChange={(e) => setPageRenameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handlePageRenameSave(config.pageKey);
                                    if (e.key === "Escape") setRenamingPageKey(null);
                                  }}
                                  className="h-6 text-xs max-w-[200px]"
                                  data-testid={`input-page-rename-${config.pageKey}`}
                                />
                                <button onClick={() => handlePageRenameSave(config.pageKey)} className="p-0.5 rounded hover:bg-primary/10 text-primary" data-testid={`button-save-page-rename-${config.pageKey}`}>
                                  <Check className="h-3 w-3" />
                                </button>
                                <button onClick={() => setRenamingPageKey(null)} className="p-0.5 rounded hover:bg-muted text-muted-foreground" data-testid={`button-cancel-page-rename-${config.pageKey}`}>
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs font-medium truncate block">{config.title}</span>
                            )}
                          </div>

                          {!isEditing && !isRenamingPage && (
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <button onClick={() => toggleVisibility(config)} className="p-1 rounded hover:bg-muted transition-colors" title={isHidden ? "Show" : "Hide"} data-testid={`button-visibility-${config.pageKey}`}>
                                {isHidden ? <EyeOff className="h-3 w-3 text-muted-foreground" /> : <Eye className="h-3 w-3 text-muted-foreground" />}
                              </button>
                              <button onClick={() => handlePageRenameStart(config)} className="p-1 rounded hover:bg-muted transition-colors" title="Rename" data-testid={`button-rename-${config.pageKey}`}>
                                <Edit3 className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button onClick={() => startFullEdit(config)} className="p-1 rounded hover:bg-muted transition-colors opacity-0 group-hover/pagerow:opacity-100" title="Full edit" data-testid={`button-edit-${config.pageKey}`}>
                                <Settings2 className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button
                                onClick={() => {
                                  if (config.isVisible !== false) {
                                    toast({ title: "Cannot Delete", description: "Hide this page first before deleting.", variant: "destructive" });
                                    return;
                                  }
                                  setDeletePageConfirm({ pageKey: config.pageKey, title: config.title || config.pageKey, isVisible: config.isVisible !== false });
                                }}
                                className="p-1 rounded opacity-0 group-hover/pagerow:opacity-100 transition-all hover:bg-destructive/10"
                                title="Delete"
                                data-testid={`button-delete-${config.pageKey}`}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {showAddPage === section.sectionKey && (
                    <div className="pl-10 pr-4 py-3 bg-primary/5 border-t border-border/20 ml-6 border-l-2 border-l-primary/20 space-y-2" data-testid={`add-page-form-${section.sectionKey}`}>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Page Key</Label>
                          <Input value={newPageForm.pageKey} onChange={(e) => setNewPageForm(f => ({ ...f, pageKey: e.target.value }))} placeholder="my-page" className="h-7 text-xs mt-0.5" data-testid="input-new-page-key" />
                        </div>
                        <div>
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Title</Label>
                          <Input value={newPageForm.title} onChange={(e) => setNewPageForm(f => ({ ...f, title: e.target.value }))} placeholder="My Page" className="h-7 text-xs mt-0.5" data-testid="input-new-page-title" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Route</Label>
                          <Input value={newPageForm.route} onChange={(e) => setNewPageForm(f => ({ ...f, route: e.target.value }))} placeholder="/my-page" className="h-7 text-xs mt-0.5" data-testid="input-new-page-route" />
                        </div>
                        <div>
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Icon</Label>
                          <IconPickerPopover value={newPageForm.iconName} onChange={(v) => setNewPageForm(f => ({ ...f, iconName: v }))} testId="icon-picker-new-page" />
                        </div>
                        <div>
                          <Label className="text-[10px] font-mono uppercase text-muted-foreground">Permission</Label>
                          <Select value={newPageForm.permission} onValueChange={(v) => setNewPageForm(f => ({ ...f, permission: v }))}>
                            <SelectTrigger className="h-7 text-xs mt-0.5" data-testid="select-new-page-permission"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["dashboard.view","content.view","content.edit","monetization.view","monetization.edit","network.view","audience.view","analytics.view","customize.view","customize.edit","settings.view","settings.edit","users.view","sales.view"].map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" onClick={() => handleAddPage(section.sectionKey)} disabled={createPageMutation.isPending} className="h-7 px-3 text-[10px] font-mono uppercase" data-testid="button-confirm-add-page">
                          {createPageMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3 mr-1" />}
                          Add
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setShowAddPage(null)} className="h-7 px-2 text-[10px]" data-testid="button-cancel-add-page">Cancel</Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Navigation to Defaults?</DialogTitle>
            <DialogDescription>This will remove all customizations and restore the original navigation structure. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)} data-testid="button-cancel-reset">Cancel</Button>
            <Button variant="destructive" onClick={() => resetMutation.mutate()} disabled={resetMutation.isPending} data-testid="button-confirm-reset">
              {resetMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reset to Defaults
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletePageConfirm} onOpenChange={(open) => { if (!open) setDeletePageConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Page</DialogTitle>
            <DialogDescription>Delete "{deletePageConfirm?.title}"? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletePageConfirm(null)} data-testid="button-cancel-delete-page">Cancel</Button>
            <Button variant="destructive" onClick={() => {
              const key = deletePageConfirm?.pageKey;
              if (!key) { console.error("[PageConfig] No pageKey in deletePageConfirm"); return; }
              console.log("[PageConfig] Confirm delete page clicked:", key);
              deletePageMutation.mutate(key);
            }} disabled={deletePageMutation.isPending} data-testid="button-confirm-delete-page">
              {deletePageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteSectionConfirm} onOpenChange={(open) => { if (!open) setDeleteSectionConfirm(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Section</DialogTitle>
            <DialogDescription>Delete "{deleteSectionConfirm?.label}"? This will remove the section and all its pages. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteSectionConfirm(null)} data-testid="button-cancel-delete-section-cascade">Cancel</Button>
            <Button variant="destructive" onClick={() => {
              const key = deleteSectionConfirm?.sectionKey;
              if (!key) { console.error("[PageConfig] No sectionKey in deleteSectionConfirm"); return; }
              console.log("[PageConfig] Confirm delete section clicked:", key);
              deleteSectionMutation.mutate(key);
            }} disabled={deleteSectionMutation.isPending} data-testid="button-confirm-delete-section-cascade">
              {deleteSectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
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

const WCAG_ITEMS = [
  "Content uses plain language (reading level appropriate for general audience)",
  "All headings follow proper hierarchy (H1 → H2 → H3)",
  "No color used as the only means of conveying information",
  "Links have descriptive text (not \"click here\")",
  "Document has been reviewed by a human (not AI-only)",
  "Last reviewed within 12 months",
  "Contact information is accurate and up to date",
  "Document reflects current platform practices",
];

function getDocStatus(doc: any): { label: string; color: string } {
  if (!doc.isPublished) return { label: "Unpublished", color: "bg-muted text-muted-foreground" };
  if (doc.content !== doc.publishedVersion) return { label: "Draft Changes", color: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30" };
  return { label: "Published", color: "bg-green-500/20 text-green-600 border-green-500/30" };
}

function LegalEditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;

  const btn = (active: boolean) =>
    cn("h-8 w-8 flex items-center justify-center text-xs font-bold transition-colors border",
      active ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted");

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-card/50">
      <button className={btn(editor.isActive("heading", { level: 1 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
      <button className={btn(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
      <button className={btn(editor.isActive("heading", { level: 3 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
      <button className={btn(editor.isActive("heading", { level: 4 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>H4</button>
      <span className="w-px h-6 bg-border mx-1" />
      <button className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><span className="font-bold">B</span></button>
      <button className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><span className="italic">I</span></button>
      <button className={btn(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><span className="underline">U</span></button>
      <span className="w-px h-6 bg-border mx-1" />
      <button className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">•</button>
      <button className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Ordered List">1.</button>
      <span className="w-px h-6 bg-border mx-1" />
      <button
        className={btn(editor.isActive("link"))}
        onClick={() => {
          if (editor.isActive("link")) {
            editor.chain().focus().unsetLink().run();
          } else {
            const url = window.prompt("Enter URL:");
            if (url) editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }
        }}
        title="Link"
      >🔗</button>
      <button className={btn(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal Rule"><Minus className="h-3 w-3" /></button>
    </div>
  );
}

function LegalTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [wcagOpen, setWcagOpen] = useState(false);
  const [localTitle, setLocalTitle] = useState("");
  const [localMeta, setLocalMeta] = useState("");
  const [localChecklist, setLocalChecklist] = useState<boolean[]>(Array(8).fill(false));

  const { data: docs = [], isLoading: docsLoading } = useQuery({
    queryKey: ["/api/legal"],
    queryFn: async () => {
      const res = await fetch("/api/legal", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load legal documents");
      return res.json();
    },
  });

  const { data: activeDoc, isLoading: docLoading } = useQuery({
    queryKey: ["/api/legal", editingKey],
    queryFn: async () => {
      const res = await fetch(`/api/legal/${editingKey}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load document");
      return res.json();
    },
    enabled: !!editingKey,
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      LinkExt.configure({ openOnClick: false }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none p-4 min-h-[400px] focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (activeDoc && editor) {
      editor.commands.setContent(activeDoc.content || "");
      setLocalTitle(activeDoc.title || "");
      setLocalMeta(activeDoc.metaDescription || "");
      const checklist = activeDoc.wcagChecklist as boolean[] | null;
      setLocalChecklist(checklist && Array.isArray(checklist) ? checklist : Array(8).fill(false));
    }
  }, [activeDoc, editor]);

  const saveDraft = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/legal/${editingKey}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: localTitle,
          content: editor?.getHTML() || "",
          metaDescription: localMeta,
          wcagChecklist: localChecklist,
        }),
      });
      if (!res.ok) throw new Error("Failed to save draft");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Draft Saved", description: "Your changes have been saved." });
      qc.invalidateQueries({ queryKey: ["/api/legal"] });
      qc.invalidateQueries({ queryKey: ["/api/legal", editingKey] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const publishDoc = useMutation({
    mutationFn: async () => {
      await saveDraft.mutateAsync();
      const res = await fetch(`/api/legal/${editingKey}/publish`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to publish");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Published", description: "Document is now live." });
      setShowPublishDialog(false);
      qc.invalidateQueries({ queryKey: ["/api/legal"] });
      qc.invalidateQueries({ queryKey: ["/api/legal", editingKey] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const unpublishDoc = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/legal/${editingKey}/unpublish`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to unpublish");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Unpublished", description: "Document has been taken offline." });
      setShowUnpublishDialog(false);
      qc.invalidateQueries({ queryKey: ["/api/legal"] });
      qc.invalidateQueries({ queryKey: ["/api/legal", editingKey] });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (editingKey) {
    const status = activeDoc ? getDocStatus(activeDoc) : null;
    const publicUrl = activeDoc ? `${window.location.origin}${activeDoc.slug}` : "";

    return (
      <div className="space-y-4" data-testid="legal-tab">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => { setEditingKey(null); editor?.commands.clearContent(); }}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="legal-back"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to documents
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {status && <Badge className={cn("text-[10px] font-mono", status.color)}>{status.label}</Badge>}
            <Button
              variant="outline"
              size="sm"
              onClick={() => saveDraft.mutate()}
              disabled={saveDraft.isPending}
              data-testid="legal-save-draft"
            >
              {saveDraft.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
              Save Draft
            </Button>
            <Button
              size="sm"
              onClick={() => setShowPublishDialog(true)}
              disabled={publishDoc.isPending}
              data-testid="legal-publish"
            >
              {publishDoc.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
              Publish
            </Button>
            {activeDoc?.isPublished && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowUnpublishDialog(true)}
                disabled={unpublishDoc.isPending}
                data-testid="legal-unpublish"
              >
                {unpublishDoc.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Ban className="h-3 w-3 mr-1" />}
                Unpublish
              </Button>
            )}
          </div>
        </div>

        {docLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 border border-border bg-card/50 overflow-hidden" data-testid="legal-editor">
              <LegalEditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>

            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <SectionHeader icon={Settings2} title="Document Settings" description="Metadata and publishing options" />
                  <div>
                    <Label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Title</Label>
                    <Input
                      value={localTitle}
                      onChange={(e) => setLocalTitle(e.target.value)}
                      className="mt-1"
                      data-testid="input-legal-title"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">
                      Meta Description ({localMeta.length}/160)
                    </Label>
                    <textarea
                      value={localMeta}
                      onChange={(e) => setLocalMeta(e.target.value.slice(0, 160))}
                      className="w-full mt-1 bg-background border border-border px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:border-primary"
                      maxLength={160}
                      data-testid="input-legal-meta"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider font-mono text-muted-foreground">Public URL</Label>
                    <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-muted/30 border border-border text-sm text-muted-foreground truncate">
                      <Globe className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{publicUrl}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground font-mono">
                    <div>
                      <span className="block uppercase tracking-wider mb-0.5">Last Edited</span>
                      <span className="text-foreground">
                        {activeDoc?.lastEditedAt ? new Date(activeDoc.lastEditedAt).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="block uppercase tracking-wider mb-0.5">Last Published</span>
                      <span className="text-foreground">
                        {activeDoc?.lastPublishedAt ? new Date(activeDoc.lastPublishedAt).toLocaleDateString() : "Never"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    {activeDoc?.content === editor?.getHTML() ? (
                      <><CheckCircle2 className="h-3 w-3 text-green-500" /><span className="text-green-500">Synced</span></>
                    ) : (
                      <><AlertTriangle className="h-3 w-3 text-yellow-500" /><span className="text-yellow-500">Unsaved changes</span></>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <button
                    className="flex items-center justify-between w-full"
                    onClick={() => setWcagOpen(!wcagOpen)}
                    data-testid="wcag-checklist"
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">WCAG Compliance Checklist</span>
                    </div>
                    {wcagOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {wcagOpen && (
                    <div className="mt-3 space-y-2">
                      {WCAG_ITEMS.map((item, i) => (
                        <label key={i} className="flex items-start gap-2 cursor-pointer text-sm py-1">
                          <input
                            type="checkbox"
                            checked={localChecklist[i] || false}
                            onChange={() => {
                              const next = [...localChecklist];
                              next[i] = !next[i];
                              setLocalChecklist(next);
                            }}
                            className="mt-0.5"
                            data-testid={`wcag-item-${i}`}
                          />
                          <span className={localChecklist[i] ? "text-foreground" : "text-muted-foreground"}>{item}</span>
                        </label>
                      ))}
                      <p className="text-xs text-muted-foreground font-mono mt-2">
                        {localChecklist.filter(Boolean).length}/{WCAG_ITEMS.length} complete
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowPreview(true)}
                data-testid="legal-preview"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Document
              </Button>
            </div>
          </div>
        )}

        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Document</DialogTitle>
              <DialogDescription>
                This will make the document publicly accessible. The current draft content will become the published version.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPublishDialog(false)}>Cancel</Button>
              <Button onClick={() => publishDoc.mutate()} disabled={publishDoc.isPending}>
                {publishDoc.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Confirm Publish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Unpublish Document</DialogTitle>
              <DialogDescription>
                This will remove the document from public access. The draft content will be preserved.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUnpublishDialog(false)}>Cancel</Button>
              <Button variant="destructive" onClick={() => unpublishDoc.mutate()} disabled={unpublishDoc.isPending}>
                {unpublishDoc.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                Confirm Unpublish
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Document Preview</DialogTitle>
              <DialogDescription>How this document will appear to your audience</DialogDescription>
            </DialogHeader>
            <div className="mx-auto max-w-[720px] py-6">
              <h1 className="text-2xl font-bold mb-4">{localTitle}</h1>
              {activeDoc?.lastPublishedAt && (
                <p className="text-xs text-muted-foreground mb-6">
                  Last updated: {new Date(activeDoc.lastPublishedAt).toLocaleDateString()}
                </p>
              )}
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const publishedCount = docs.filter((d: any) => d.isPublished).length;
  const wcagCompleteCount = docs.filter((d: any) => {
    const cl = d.wcagChecklist as boolean[] | null;
    return cl && Array.isArray(cl) && cl.length === 8 && cl.every(Boolean);
  }).length;

  const complianceColor = publishedCount >= 6 ? "text-green-500" : publishedCount >= 4 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="space-y-5" data-testid="legal-tab">
      <SectionHeader icon={Scale} title="Legal Documents" description="Manage terms of service, privacy policy, and compliance documents" />

      <div
        className={cn("border border-border bg-card/50 p-4 flex flex-wrap items-center gap-4 text-sm font-mono", complianceColor)}
        data-testid="legal-compliance-bar"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>{publishedCount}/6 documents published</span>
        </div>
        <span className="text-border">|</span>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>{wcagCompleteCount}/6 WCAG checklists complete</span>
        </div>
      </div>

      {docsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {docs.map((doc: any) => {
            const status = getDocStatus(doc);
            const publicUrl = `${window.location.origin}${doc.slug}`;
            return (
              <Card key={doc.documentKey} className="border-border" data-testid={`legal-card-${doc.documentKey}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{doc.title}</h3>
                    <Badge className={cn("text-[10px] font-mono flex-shrink-0", status.color)}>{status.label}</Badge>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground font-mono">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      <span>
                        {doc.lastPublishedAt
                          ? `Published ${new Date(doc.lastPublishedAt).toLocaleDateString()}`
                          : "Never published"}
                      </span>
                    </div>
                    <div className={cn("flex items-center gap-1.5 truncate", !doc.isPublished && "opacity-40")}>
                      <Globe className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{publicUrl}</span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full font-mono text-xs"
                    onClick={() => setEditingKey(doc.documentKey)}
                    data-testid={`legal-edit-${doc.documentKey}`}
                  >
                    <Edit3 className="h-3 w-3 mr-1.5" />
                    Edit Document
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
