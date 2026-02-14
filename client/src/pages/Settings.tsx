import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings, useSocialAccounts, useCreateSocialAccount, useUpdateSocialAccount, useDeleteSocialAccount, usePodcasts } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
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
import {
  Globe, Zap, FileText, Bell, Shield, Wifi, WifiOff,
  Save, Loader2, AlertTriangle, Sparkles, MapPin,
  CheckCircle2, ArrowRight, Lightbulb, Facebook, Linkedin,
  Building2, Eye, Edit3, RefreshCw, Trash2, Radio,
} from "lucide-react";

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
  { value: "X", label: "X (Twitter)" },
  { value: "LinkedIn", label: "LinkedIn" },
  { value: "Facebook", label: "Facebook" },
  { value: "Pinterest", label: "Pinterest" },
];

const AI_QUALITY_OPTIONS = [
  { value: "fast", label: "Fast", desc: "Lower quality, faster processing" },
  { value: "balanced", label: "Balanced", desc: "Good quality with reasonable speed" },
  { value: "premium", label: "Premium", desc: "Highest quality, slower processing" },
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
      <div className="grid grid-cols-2 gap-2">
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
    emailNotifications: true,
    alertThreshold: "all",
    weeklyDigest: true,
    revenueAlerts: true,
    processingAlerts: true,
    sessionTimeoutMinutes: 10080,
    maxLoginAttempts: 5,
    requireStrongPasswords: true,
    twoFactorEnabled: false,
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
        defaultPlatforms: (settings.defaultPlatforms || ["TikTok", "Reels", "Shorts", "X", "LinkedIn"]).map((p: string) => p === "Twitter" ? "X" : p),
        aiQuality: settings.aiQuality || "balanced",
        emailNotifications: settings.emailNotifications ?? true,
        alertThreshold: settings.alertThreshold || "all",
        weeklyDigest: settings.weeklyDigest ?? true,
        revenueAlerts: settings.revenueAlerts ?? true,
        processingAlerts: settings.processingAlerts ?? true,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes ?? 10080,
        maxLoginAttempts: settings.maxLoginAttempts ?? 5,
        requireStrongPasswords: settings.requireStrongPasswords ?? true,
        twoFactorEnabled: settings.twoFactorEnabled ?? false,
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary uppercase tracking-wider" data-testid="text-settings-title">
            Platform Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your platform preferences and security policies</p>
        </div>
        <div className="flex items-center gap-3">
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
        <div className="border border-border bg-card/50 p-6 space-y-5" data-testid="section-general">
          <SectionHeader icon={Globe} title="General" description="Regional and display preferences" />

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

        <div className="border border-border bg-card/50 p-6 space-y-5" data-testid="section-content-pipeline">
          <SectionHeader icon={Zap} title="Content Pipeline" description="AI content generation defaults" />

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

          <ToggleField
            label="Auto-Publish Content"
            description="Automatically publish generated content when processing completes"
            checked={form.autoPublishContent}
            onChange={(v) => setForm(f => ({ ...f, autoPublishContent: v }))}
            testId="auto-publish"
            disabled={!canEdit}
          />
        </div>

        <div className="border border-border bg-card/50 p-6 space-y-5" data-testid="section-content-types">
          <SectionHeader icon={FileText} title="Content Types" description="Types of content to generate from episodes" />

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
        </div>

        <div className="border border-border bg-card/50 p-6 space-y-5" data-testid="section-notifications">
          <SectionHeader icon={Bell} title="Notifications" description="Alert and notification preferences" />

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
            <ToggleField
              label="Email Notifications"
              description="Receive email alerts for important platform events"
              checked={form.emailNotifications}
              onChange={(v) => setForm(f => ({ ...f, emailNotifications: v }))}
              testId="email-notifications"
              disabled={!canEdit}
            />
            <ToggleField
              label="Weekly Digest"
              description="Receive a weekly summary of platform activity and metrics"
              checked={form.weeklyDigest}
              onChange={(v) => setForm(f => ({ ...f, weeklyDigest: v }))}
              testId="weekly-digest"
              disabled={!canEdit}
            />
            <ToggleField
              label="Revenue Alerts"
              description="Get notified when revenue thresholds are reached or anomalies detected"
              checked={form.revenueAlerts}
              onChange={(v) => setForm(f => ({ ...f, revenueAlerts: v }))}
              testId="revenue-alerts"
              disabled={!canEdit}
            />
            <ToggleField
              label="Processing Alerts"
              description="Get notified when content processing completes or encounters errors"
              checked={form.processingAlerts}
              onChange={(v) => setForm(f => ({ ...f, processingAlerts: v }))}
              testId="processing-alerts"
              disabled={!canEdit}
            />
          </div>
        </div>

        <SocialConnectionsSection canEdit={canEdit} />

        <div className="border border-border bg-card/50 p-6 space-y-5 lg:col-span-2" data-testid="section-security">
          <SectionHeader icon={Shield} title="Security" description="Authentication and access control policies" />

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
                description="Require 2FA for all user accounts (not yet implemented)"
                checked={form.twoFactorEnabled}
                onChange={(v) => setForm(f => ({ ...f, twoFactorEnabled: v }))}
                testId="two-factor"
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>
      </div>
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
    case "x": return "X (Twitter)";
    case "facebook": return "Facebook";
    case "linkedin": return "LinkedIn";
    case "google_business": return "Google Business";
    case "instagram": return "Instagram";
    case "tiktok": return "TikTok";
    default: return platform;
  }
}

const PLATFORM_CARDS = [
  { platform: "x", label: "X (Twitter)", description: "Post updates and threads", color: "text-foreground", bgGradient: "from-zinc-800 to-zinc-900" },
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
    <div className="border border-border bg-card/50 p-6 space-y-5 lg:col-span-2" data-testid="section-social-connections">
      <div className="flex items-start gap-3 mb-2">
        <div className="h-10 w-10 border border-primary/30 bg-primary/5 flex items-center justify-center flex-shrink-0">
          <Wifi className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-display font-bold text-primary uppercase tracking-wider">
            Social Connections
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage social media platform connections per podcast or company-wide
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="flex items-center gap-3 p-3 border border-border/50 bg-card/30 rounded-sm">
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground whitespace-nowrap">Show for:</Label>
        <Select value={ownerFilter} onValueChange={setOwnerFilter}>
          <SelectTrigger className="w-[250px]" data-testid="select-social-owner-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Connections</SelectItem>
            <SelectItem value="company">
              <span className="flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Company-wide
              </span>
            </SelectItem>
            {podcasts?.map((p: any) => (
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
                <div key={acc.id} className="flex items-center gap-3 px-4 py-2.5" data-testid={`social-account-row-${acc.id}`}>
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
                        {podcasts?.map((p: any) => (
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
                    <div className="grid grid-cols-3 gap-2">
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
