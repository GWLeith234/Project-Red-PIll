import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Globe, Zap, FileText, Bell, Shield,
  Save, Loader2, AlertTriangle,
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
  { value: "Twitter", label: "X / Twitter" },
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

  const [form, setForm] = useState({
    timezone: "America/New_York",
    dateFormat: "MM/DD/YYYY",
    defaultLanguage: "en",
    autoPublishContent: false,
    contentTypes: ["video_clip", "article", "social_post", "newsletter", "seo_asset"],
    defaultPlatforms: ["TikTok", "Reels", "Shorts", "Twitter", "LinkedIn"],
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
        timezone: settings.timezone || "America/New_York",
        dateFormat: settings.dateFormat || "MM/DD/YYYY",
        defaultLanguage: settings.defaultLanguage || "en",
        autoPublishContent: settings.autoPublishContent ?? false,
        contentTypes: settings.contentTypes || ["video_clip", "article", "social_post", "newsletter", "seo_asset"],
        defaultPlatforms: settings.defaultPlatforms || ["TikTok", "Reels", "Shorts", "Twitter", "LinkedIn"],
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
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      },
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
    <div className="space-y-6" data-testid="settings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary uppercase tracking-wider" data-testid="text-settings-title">
            Platform Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your platform preferences and security policies</p>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-border bg-card/50 p-6 space-y-5" data-testid="section-general">
          <SectionHeader icon={Globe} title="General" description="Regional and display preferences" />

          <SelectField
            label="Timezone"
            value={form.timezone}
            options={TIMEZONES.map(tz => ({ value: tz, label: tz.replace(/_/g, ' ') }))}
            onChange={(v) => setForm(f => ({ ...f, timezone: v }))}
            testId="timezone"
            disabled={!canEdit}
          />
          <SelectField
            label="Date Format"
            value={form.dateFormat}
            options={DATE_FORMATS.map(df => ({ value: df, label: df }))}
            onChange={(v) => setForm(f => ({ ...f, dateFormat: v }))}
            testId="date-format"
            disabled={!canEdit}
          />
          <SelectField
            label="Default Language"
            value={form.defaultLanguage}
            options={LANGUAGES}
            onChange={(v) => setForm(f => ({ ...f, defaultLanguage: v }))}
            testId="language"
            disabled={!canEdit}
          />
        </div>

        <div className="border border-border bg-card/50 p-6 space-y-5" data-testid="section-content-pipeline">
          <SectionHeader icon={Zap} title="Content Pipeline" description="AI content generation defaults" />

          <RadioGroup
            label="AI Processing Quality"
            options={AI_QUALITY_OPTIONS}
            value={form.aiQuality}
            onChange={(v) => setForm(f => ({ ...f, aiQuality: v }))}
            testId="ai-quality"
            disabled={!canEdit}
          />

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

          <CheckboxGroup
            label="Enabled Content Types"
            options={CONTENT_TYPE_OPTIONS}
            selected={form.contentTypes}
            onChange={(v) => setForm(f => ({ ...f, contentTypes: v }))}
            testId="content-types"
            disabled={!canEdit}
          />

          <CheckboxGroup
            label="Distribution Platforms"
            options={PLATFORM_OPTIONS}
            selected={form.defaultPlatforms}
            onChange={(v) => setForm(f => ({ ...f, defaultPlatforms: v }))}
            testId="platforms"
            disabled={!canEdit}
          />
        </div>

        <div className="border border-border bg-card/50 p-6 space-y-5" data-testid="section-notifications">
          <SectionHeader icon={Bell} title="Notifications" description="Alert and notification preferences" />

          <SelectField
            label="Alert Level"
            value={form.alertThreshold}
            options={ALERT_THRESHOLD_OPTIONS}
            onChange={(v) => setForm(f => ({ ...f, alertThreshold: v }))}
            testId="alert-threshold"
            disabled={!canEdit}
          />

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
