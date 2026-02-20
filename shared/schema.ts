import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real, jsonb, index, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const ROLES = ["admin", "editor", "viewer"] as const;
export type Role = typeof ROLES[number];

export const PERMISSIONS = [
  "dashboard.view",
  "content.view",
  "content.edit",
  "monetization.view",
  "monetization.edit",
  "network.view",
  "network.edit",
  "audience.view",
  "analytics.view",
  "customize.view",
  "customize.edit",
  "settings.view",
  "settings.edit",
  "users.view",
  "users.edit",
  "sales.view",
  "sales.edit",
] as const;
export type Permission = typeof PERMISSIONS[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [...PERMISSIONS],
  editor: [
    "dashboard.view",
    "content.view",
    "content.edit",
    "monetization.view",
    "network.view",
    "audience.view",
    "analytics.view",
    "sales.view",
  ],
  viewer: [
    "dashboard.view",
    "content.view",
    "monetization.view",
    "network.view",
    "audience.view",
    "analytics.view",
    "sales.view",
  ],
};

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email"),
  displayName: text("display_name"),
  role: text("role").default("viewer").notNull(),
  permissions: text("permissions").array().default(sql`ARRAY[]::text[]`),
  status: text("status").default("active").notNull(),
  profilePhoto: text("profile_photo"),
  bannerImage: text("banner_image"),
  bio: text("bio"),
  title: text("title"),
  linkedinUrl: text("linkedin_url"),
  dashboardWidgets: text("dashboard_widgets").array().default(sql`ARRAY['revenue','listeners','content','alerts','trending','processing']::text[]`),
  createdAt: timestamp("created_at").defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const podcasts = pgTable("podcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  host: text("host").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  heroImageUrl: text("hero_image_url"),
  accentColor: text("accent_color"),
  hostImageUrl: text("host_image_url"),
  category: text("category").default("Talk"),
  subscribers: integer("subscribers").default(0),
  growthPercent: real("growth_percent").default(0),
  multiplicationFactor: integer("multiplication_factor").default(50),
  status: text("status").default("active"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const episodes = pgTable("episodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  podcastId: varchar("podcast_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: text("duration"),
  audioUrl: text("audio_url"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  episodeType: text("episode_type").default("audio"),
  transcript: text("transcript"),
  transcriptStatus: text("transcript_status").default("pending"),
  extractedKeywords: text("extracted_keywords").array().default(sql`ARRAY[]::text[]`),
  keywordAnalysis: text("keyword_analysis"),
  publishedAt: timestamp("published_at").defaultNow(),
  processingStatus: text("processing_status").default("pending"),
  processingProgress: integer("processing_progress").default(0),
  processingStep: text("processing_step"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("episodes_podcast_id_idx").on(table.podcastId),
]);

export const contentPieces = pgTable("content_pieces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id"),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  body: text("body"),
  coverImage: text("cover_image"),
  platform: text("platform"),
  status: text("status").default("draft"),
  slug: text("slug"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array().default(sql`ARRAY[]::text[]`),
  summary: text("summary"),
  readingTime: integer("reading_time"),
  aiGenerated: boolean("ai_generated").default(false),
  source: text("source").default("manual"),
  authorId: varchar("author_id"),
  assignedTo: varchar("assigned_to"),
  priority: text("priority").default("medium"),
  reviewerNotes: text("reviewer_notes"),
  moderatedBy: varchar("moderated_by"),
  moderatedAt: timestamp("moderated_at"),
  submittedForReviewAt: timestamp("submitted_for_review_at"),
  scheduledPublishAt: timestamp("scheduled_publish_at"),
  publishedAt: timestamp("published_at"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("content_pieces_episode_id_idx").on(table.episodeId),
  index("content_pieces_status_idx").on(table.status),
  index("content_pieces_type_idx").on(table.type),
  index("content_pieces_assigned_to_idx").on(table.assignedTo),
  index("content_pieces_scheduled_idx").on(table.scheduledPublishAt),
]);

export const advertisers = pgTable("advertisers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  monthlySpend: real("monthly_spend").default(0),
  type: text("type").default("Direct"),
  status: text("status").default("Active"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id"),
  companyId: varchar("company_id"),
  dealId: varchar("deal_id"),
  name: text("name").notNull(),
  budget: real("budget").default(0),
  spent: real("spent").default(0),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  status: text("status").default("scheduled"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("campaigns_deal_id_idx").on(table.dealId),
  index("campaigns_company_id_idx").on(table.companyId),
]);

export const metrics = pgTable("metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").defaultNow(),
  monthlyRevenue: real("monthly_revenue").default(0),
  activeListeners: integer("active_listeners").default(0),
  contentPiecesCount: integer("content_pieces_count").default(0),
  adFillRate: real("ad_fill_rate").default(0),
  avgCpm: real("avg_cpm").default(0),
});

export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").default("info"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const branding = pgTable("branding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").default("MediaTech Empire"),
  tagline: text("tagline").default("AI-Powered Media Platform"),
  logoUrl: text("logo_url"),
  logoDarkUrl: text("logo_dark_url"),
  faviconUrl: text("favicon_url"),
  ogImageUrl: text("og_image_url"),
  pushNotificationIconUrl: text("push_notification_icon_url"),
  watermarkUrl: text("watermark_url"),
  bannerUrl: text("banner_url"),
  primaryColor: text("primary_color").default("#1D4ED8"),
  secondaryColor: text("secondary_color").default("#6C3FC5"),
  accentColor: text("accent_color").default("#F59E0B"),
  surfaceColor: text("surface_color"),
  textPrimaryColor: text("text_primary_color"),
  textSecondaryColor: text("text_secondary_color"),
  borderColor: text("border_color"),
  successColor: text("success_color").default("#22C55E"),
  warningColor: text("warning_color").default("#F59E0B"),
  dangerColor: text("danger_color").default("#EF4444"),
  fontHeading: text("font_heading").default("Inter"),
  fontBody: text("font_body").default("Inter"),
  fontScale: text("font_scale").default("medium"),
  lineHeight: text("line_height").default("normal"),
  emailLogoUrl: text("email_logo_url"),
  emailFooterText: text("email_footer_text"),
  twitterUrl: text("twitter_url"),
  facebookUrl: text("facebook_url"),
  instagramUrl: text("instagram_url"),
  youtubeUrl: text("youtube_url"),
  linkedinUrl: text("linkedin_url"),
  tiktokUrl: text("tiktok_url"),
  websiteUrl: text("website_url"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  themeMode: text("theme_mode").default("dark"),
  backgroundType: text("background_type").default("solid"),
  backgroundColor: text("background_color").default("#0f172a"),
  backgroundGradient: text("background_gradient"),
  backgroundImageUrl: text("background_image_url"),
  backgroundOverlayOpacity: text("background_overlay_opacity").default("0.8"),
  backgroundPosition: text("background_position").default("center"),
  backgroundSize: text("background_size").default("cover"),
  backgroundPattern: text("background_pattern"),
  bannerHeading: text("banner_heading"),
  bannerSubheading: text("banner_subheading"),
  bannerCtaText: text("banner_cta_text"),
  bannerCtaLink: text("banner_cta_link"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyLocation: text("company_location"),
  timezone: text("timezone").default("America/New_York"),
  dateFormat: text("date_format").default("MM/DD/YYYY"),
  defaultLanguage: text("default_language").default("en"),
  autoPublishContent: boolean("auto_publish_content").default(false),
  contentTypes: text("content_types").array().default(sql`ARRAY['video_clip','article','social_post','newsletter','seo_asset']::text[]`),
  defaultPlatforms: text("default_platforms").array().default(sql`ARRAY['TikTok','Reels','Shorts','X','LinkedIn']::text[]`),
  aiQuality: text("ai_quality").default("balanced"),
  contentTone: text("content_tone").default("professional"),
  articleWordCount: integer("article_word_count").default(800),
  socialPostLength: text("social_post_length").default("medium"),
  maxClipDuration: integer("max_clip_duration").default(60),
  transcriptionLanguage: text("transcription_language").default("auto"),
  seoKeywordDensity: text("seo_keyword_density").default("moderate"),
  newsletterFrequency: text("newsletter_frequency").default("weekly"),
  contentApprovalRequired: boolean("content_approval_required").default(true),
  emailNotifications: boolean("email_notifications").default(true),
  alertThreshold: text("alert_threshold").default("all"),
  weeklyDigest: boolean("weekly_digest").default(true),
  revenueAlerts: boolean("revenue_alerts").default(true),
  processingAlerts: boolean("processing_alerts").default(true),
  crmAlerts: boolean("crm_alerts").default(true),
  systemAlerts: boolean("system_alerts").default(true),
  pushNotifications: boolean("push_notifications").default(false),
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false),
  quietHoursStart: text("quiet_hours_start").default("22:00"),
  quietHoursEnd: text("quiet_hours_end").default("07:00"),
  notificationDigestTime: text("notification_digest_time").default("09:00"),
  sessionTimeoutMinutes: integer("session_timeout_minutes").default(10080),
  maxLoginAttempts: integer("max_login_attempts").default(5),
  requireStrongPasswords: boolean("require_strong_passwords").default(true),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  passwordExpiryDays: integer("password_expiry_days").default(0),
  ipAllowlist: text("ip_allowlist"),
  auditLogEnabled: boolean("audit_log_enabled").default(true),
  dataRetentionDays: integer("data_retention_days").default(365),
  apiKeysEnabled: boolean("api_keys_enabled").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  userName: text("user_name"),
  action: text("action").notNull(),
  resource: text("resource").notNull(),
  resourceId: varchar("resource_id"),
  details: text("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const apiKeys = pgTable("api_keys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keyHash: text("key_hash").notNull(),
  permissions: text("permissions").array().default(sql`ARRAY[]::text[]`),
  lastUsedAt: timestamp("last_used_at"),
  expiresAt: timestamp("expires_at"),
  createdById: varchar("created_by_id"),
  createdAt: timestamp("created_at").defaultNow(),
  revokedAt: timestamp("revoked_at"),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  profilePhoto: text("profile_photo"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  facebookUrl: text("facebook_url"),
  bio: text("bio"),
  title: text("title"),
  company: text("company"),
  interests: text("interests").array().default(sql`ARRAY[]::text[]`),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
  source: text("source").default("manual"),
  status: text("status").default("active").notNull(),
  marketingConsent: boolean("marketing_consent").default(false),
  marketingConsentAt: timestamp("marketing_consent_at"),
  smsConsent: boolean("sms_consent").default(false),
  smsConsentAt: timestamp("sms_consent_at"),
  lastEmailOpenedAt: timestamp("last_email_opened_at"),
  emailsOpenedCount: integer("emails_opened_count").default(0),
  lastPushClickedAt: timestamp("last_push_clicked_at"),
  pushClickedCount: integer("push_clicked_count").default(0),
  lastVisitAt: timestamp("last_visit_at"),
  visitCount: integer("visit_count").default(0),
  engagementStage: text("engagement_stage").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("subscribers_email_idx").on(table.email),
]);

export const subscriberPodcasts = pgTable("subscriber_podcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull(),
  podcastId: varchar("podcast_id").notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
}, (table) => [
  index("subscriber_podcasts_composite_idx").on(table.subscriberId, table.podcastId),
]);

export const companies = pgTable("companies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  industry: text("industry"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  country: text("country"),
  logo: text("logo"),
  description: text("description"),
  slogan: text("slogan"),
  timezone: text("timezone"),
  brandColors: text("brand_colors").array(),
  annualRevenue: real("annual_revenue"),
  employeeCount: integer("employee_count"),
  companyType: text("company_type").default("advertiser"),
  status: text("status").default("active").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companyContacts = pgTable("company_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull(),
  phone: text("phone"),
  title: text("title"),
  department: text("department"),
  profilePhoto: text("profile_photo"),
  linkedinUrl: text("linkedin_url"),
  twitterUrl: text("twitter_url"),
  facebookUrl: text("facebook_url"),
  bio: text("bio"),
  isPrimary: boolean("is_primary").default(false),
  tags: text("tags").array().default(sql`ARRAY[]::text[]`),
  notes: text("notes"),
  status: text("status").default("active").notNull(),
  marketingConsent: boolean("marketing_consent").default(false),
  marketingConsentAt: timestamp("marketing_consent_at"),
  smsConsent: boolean("sms_consent").default(false),
  smsConsentAt: timestamp("sms_consent_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("company_contacts_company_id_idx").on(table.companyId),
]);

export const DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "closed_won", "closed_lost"] as const;
export type DealStage = typeof DEAL_STAGES[number];
export const DEAL_TYPES = ["ad_campaign", "sponsorship", "partnership"] as const;
export type DealType = typeof DEAL_TYPES[number];

export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull(),
  contactId: varchar("contact_id"),
  title: text("title").notNull(),
  description: text("description"),
  value: real("value").default(0),
  stage: text("stage").default("lead").notNull(),
  dealType: text("deal_type").default("ad_campaign").notNull(),
  priority: text("priority").default("medium"),
  probability: integer("probability").default(50),
  startDate: timestamp("start_date"),
  closeDate: timestamp("close_date"),
  podcastId: varchar("podcast_id"),
  productId: varchar("product_id"),
  productRate: real("product_rate"),
  productQuantity: integer("product_quantity"),
  notes: text("notes"),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("deals_company_id_idx").on(table.companyId),
  index("deals_stage_idx").on(table.stage),
]);

export const dealActivities = pgTable("deal_activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull(),
  activityType: text("activity_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url"),
  fileType: text("file_type"),
  contentStatus: text("content_status"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("deal_activities_deal_id_idx").on(table.dealId),
]);

export const dealLineItems = pgTable("deal_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull(),
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull(),
  rate: real("rate").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  total: real("total").default(0).notNull(),
  notes: text("notes"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("deal_line_items_deal_id_idx").on(table.dealId),
]);

export const PRODUCT_CATEGORIES = ["display_ads", "audio_ads", "video_ads", "sponsorship", "branded_content", "newsletter", "social_media", "events", "custom"] as const;
export type ProductCategory = typeof PRODUCT_CATEGORIES[number];
export const PRODUCT_STATUSES = ["active", "inactive", "archived"] as const;
export type ProductStatus = typeof PRODUCT_STATUSES[number];
export const RATE_MODELS = ["cpm", "cpc", "cpa", "flat_rate", "per_episode", "per_month", "custom"] as const;
export type RateModel = typeof RATE_MODELS[number];

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  category: text("category").notNull().default("display_ads"),
  description: text("description"),
  rateModel: text("rate_model").notNull().default("cpm"),
  wholesaleRate: real("wholesale_rate").notNull().default(0),
  suggestedRetailRate: real("suggested_retail_rate").notNull().default(0),
  minimumRate: real("minimum_rate").default(0),
  overrideThresholdPercent: integer("override_threshold_percent").default(10),
  fulfillmentRequirements: jsonb("fulfillment_requirements").default(sql`'[]'::jsonb`),
  deliverables: text("deliverables"),
  unitLabel: text("unit_label").default("impressions"),
  minimumUnits: integer("minimum_units").default(0),
  status: text("status").default("active").notNull(),
  sortOrder: integer("sort_order").default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const AD_CREATIVE_FORMATS = ["banner_728x90", "banner_300x250", "banner_320x50", "banner_970x250", "video_preroll", "video_midroll", "audio_spot", "native", "sponsored_content", "page_takeover", "custom"] as const;
export type AdCreativeFormat = typeof AD_CREATIVE_FORMATS[number];
export const AD_CREATIVE_STATUSES = ["draft", "review", "approved", "live", "paused", "expired"] as const;
export type AdCreativeStatus = typeof AD_CREATIVE_STATUSES[number];

export const adCreatives = pgTable("ad_creatives", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dealId: varchar("deal_id").notNull(),
  name: text("name").notNull(),
  format: text("format").notNull().default("banner_300x250"),
  fileUrl: text("file_url"),
  thumbnailUrl: text("thumbnail_url"),
  clickUrl: text("click_url"),
  altText: text("alt_text"),
  headline: text("headline"),
  bodyText: text("body_text"),
  ctaText: text("cta_text"),
  targetedImpressions: integer("targeted_impressions").default(0),
  deliveredImpressions: integer("delivered_impressions").default(0),
  clicks: integer("clicks").default(0),
  status: text("status").default("draft").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  podcastId: varchar("podcast_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("ad_creatives_deal_id_idx").on(table.dealId),
  index("ad_creatives_format_idx").on(table.format),
]);

export const OUTBOUND_CAMPAIGN_TYPES = ["email", "sms"] as const;
export type OutboundCampaignType = typeof OUTBOUND_CAMPAIGN_TYPES[number];
export const OUTBOUND_CAMPAIGN_AUDIENCES = ["subscribers", "contacts"] as const;
export type OutboundCampaignAudience = typeof OUTBOUND_CAMPAIGN_AUDIENCES[number];
export const OUTBOUND_CAMPAIGN_STATUSES = ["draft", "scheduled", "sending", "sent", "failed"] as const;
export type OutboundCampaignStatus = typeof OUTBOUND_CAMPAIGN_STATUSES[number];

export const outboundCampaigns = pgTable("outbound_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(),
  audience: text("audience").notNull(),
  companyId: varchar("company_id"),
  status: text("status").default("draft").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  podcastFilter: varchar("podcast_filter"),
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  bounceCount: integer("bounce_count").default(0),
  deliveryRate: real("delivery_rate").default(0),
  openRate: real("open_rate").default(0),
  clickToOpenRate: real("click_to_open_rate").default(0),
  cadenceType: text("cadence_type").default("single"),
  startDate: timestamp("start_date"),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignEmails = pgTable("campaign_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull(),
  dayNumber: integer("day_number").default(1).notNull(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  body: text("body").default("").notNull(),
  waitDuration: integer("wait_duration").default(1),
  waitUnit: text("wait_unit").default("days"),
  sortOrder: integer("sort_order").default(0),
  delivered: integer("delivered").default(0),
  opened: integer("opened").default(0),
  clicked: integer("clicked").default(0),
  bounced: integer("bounced").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const SOCIAL_PLATFORMS = ["x", "facebook", "linkedin", "google_business", "instagram", "tiktok"] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

export const SOCIAL_OWNER_TYPES = ["company", "podcast"] as const;
export type SocialOwnerType = typeof SOCIAL_OWNER_TYPES[number];

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(),
  accountName: text("account_name").notNull(),
  accountUrl: text("account_url"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpiresAt: timestamp("token_expires_at"),
  status: text("status").default("disconnected").notNull(),
  lastPostedAt: timestamp("last_posted_at"),
  ownerType: text("owner_type").default("company").notNull(),
  podcastId: varchar("podcast_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const SCHEDULED_POST_STATUSES = ["draft", "scheduled", "publishing", "published", "failed"] as const;
export type ScheduledPostStatus = typeof SCHEDULED_POST_STATUSES[number];

export const scheduledPosts = pgTable("scheduled_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentPieceId: varchar("content_piece_id").notNull(),
  platform: text("platform").notNull(),
  socialAccountId: varchar("social_account_id"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  publishedAt: timestamp("published_at"),
  status: text("status").default("scheduled").notNull(),
  postText: text("post_text"),
  hashtags: text("hashtags").array().default(sql`ARRAY[]::text[]`),
  mediaUrls: text("media_urls").array().default(sql`ARRAY[]::text[]`),
  aiSuggestion: text("ai_suggestion"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("scheduled_posts_content_piece_id_idx").on(table.contentPieceId),
]);

export const clipAssets = pgTable("clip_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").notNull(),
  title: text("title").notNull(),
  hookText: text("hook_text"),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  duration: text("duration"),
  transcriptExcerpt: text("transcript_excerpt"),
  viralScore: integer("viral_score").default(0),
  status: text("status").default("suggested").notNull(),
  clipUrl: text("clip_url"),
  thumbnailUrl: text("thumbnail_url"),
  platform: text("platform"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsletterSchedules = pgTable("newsletter_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  cadence: text("cadence").notNull().default("weekly"),
  dayOfWeek: integer("day_of_week").default(1),
  dayOfMonth: integer("day_of_month").default(1),
  sendHour: integer("send_hour").default(9),
  sendMinute: integer("send_minute").default(0),
  timezone: text("timezone").default("America/New_York"),
  active: boolean("active").default(true).notNull(),
  contentTypes: text("content_types").array().default(sql`ARRAY['article','blog','social_post','newsletter']::text[]`),
  subjectTemplate: text("subject_template"),
  introTemplate: text("intro_template"),
  podcastId: varchar("podcast_id"),
  autoSend: boolean("auto_send").default(false).notNull(),
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const newsletterRuns = pgTable("newsletter_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  period: text("period").notNull(),
  cadence: text("cadence").default("monthly"),
  body: text("body"),
  contentPieceIds: text("content_piece_ids").array().default(sql`ARRAY[]::text[]`),
  status: text("status").default("draft").notNull(),
  scheduleId: varchar("schedule_id"),
  outboundCampaignId: varchar("outbound_campaign_id"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const heroSlides = pgTable("hero_slides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  title: text("title"),
  subtitle: text("subtitle"),
  linkUrl: text("link_url"),
  linkText: text("link_text"),
  displayOrder: integer("display_order").default(0).notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const newsLayoutSections = pgTable("news_layout_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sectionType: text("section_type").notNull().default("list"),
  contentRule: text("content_rule").notNull().default("latest"),
  contentFilters: jsonb("content_filters").default({}),
  pinnedArticleIds: text("pinned_article_ids").array().default(sql`ARRAY[]::text[]`),
  displayOrder: integer("display_order").default(0).notNull(),
  maxItems: integer("max_items").default(6),
  active: boolean("active").default(true).notNull(),
  showImages: boolean("show_images").default(true),
  layout: text("layout").default("full_width"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const crmLists = pgTable("crm_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  crmType: text("crm_type").notNull(),
  entityType: text("entity_type").notNull(),
  filters: text("filters").notNull().default("{}"),
  itemCount: integer("item_count").default(0),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertNewsLayoutSectionSchema = createInsertSchema(newsLayoutSections).omit({ id: true, createdAt: true });
export const insertCrmListSchema = createInsertSchema(crmLists).omit({ id: true, createdAt: true });
export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({ id: true, createdAt: true });
export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({ id: true, createdAt: true });
export const insertClipAssetSchema = createInsertSchema(clipAssets).omit({ id: true, createdAt: true });
export const insertNewsletterScheduleSchema = createInsertSchema(newsletterSchedules).omit({ id: true, createdAt: true });
export const insertNewsletterRunSchema = createInsertSchema(newsletterRuns).omit({ id: true, createdAt: true });
export const insertHeroSlideSchema = createInsertSchema(heroSlides).omit({ id: true, createdAt: true });
export const insertOutboundCampaignSchema = createInsertSchema(outboundCampaigns).omit({ id: true, createdAt: true, sentAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanyContactSchema = createInsertSchema(companyContacts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDealActivitySchema = createInsertSchema(dealActivities).omit({ id: true, createdAt: true });
export const insertAdCreativeSchema = createInsertSchema(adCreatives).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriberSchema = createInsertSchema(subscribers).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSubscriberPodcastSchema = createInsertSchema(subscriberPodcasts).omit({ id: true, subscribedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, lastLoginAt: true });
export const insertPodcastSchema = createInsertSchema(podcasts).omit({ id: true });
export const insertEpisodeSchema = createInsertSchema(episodes).omit({ id: true });
export const insertContentPieceSchema = createInsertSchema(contentPieces).omit({ id: true });
export const insertAdvertiserSchema = createInsertSchema(advertisers).omit({ id: true });
export const insertCampaignSchema = createInsertSchema(campaigns).omit({ id: true });
export const insertMetricsSchema = createInsertSchema(metrics).omit({ id: true });
export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true });
export const insertBrandingSchema = createInsertSchema(branding).omit({ id: true, updatedAt: true });
export const insertPlatformSettingsSchema = createInsertSchema(platformSettings).omit({ id: true, updatedAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertApiKeySchema = createInsertSchema(apiKeys).omit({ id: true, createdAt: true, lastUsedAt: true, revokedAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });
export const insertDealLineItemSchema = createInsertSchema(dealLineItems).omit({ id: true, createdAt: true });
export const insertCampaignEmailSchema = createInsertSchema(campaignEmails).omit({ id: true, createdAt: true, updatedAt: true });

// ── Project Management (Asana replacement) ──
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("uploaded").notNull(),
  priority: text("priority").default("medium").notNull(),
  assigneeId: varchar("assignee_id"),
  reviewerId: varchar("reviewer_id"),
  createdById: varchar("created_by_id"),
  episodeId: varchar("episode_id"),
  contentPieceId: varchar("content_piece_id"),
  podcastId: varchar("podcast_id"),
  dueDate: timestamp("due_date"),
  publishDate: timestamp("publish_date"),
  estimatedEffort: text("estimated_effort"),
  tags: text("tags").array(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull(),
  authorId: varchar("author_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  parentId: varchar("parent_id"),
  resolved: boolean("resolved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const taskActivityLogs = pgTable("task_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull(),
  actorId: varchar("actor_id"),
  actorName: text("actor_name"),
  action: text("action").notNull(),
  field: text("field"),
  fromValue: text("from_value"),
  toValue: text("to_value"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({ id: true, createdAt: true });
export const insertTaskActivityLogSchema = createInsertSchema(taskActivityLogs).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPodcast = z.infer<typeof insertPodcastSchema>;
export type Podcast = typeof podcasts.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertContentPiece = z.infer<typeof insertContentPieceSchema>;
export type ContentPiece = typeof contentPieces.$inferSelect;
export type InsertAdvertiser = z.infer<typeof insertAdvertiserSchema>;
export type Advertiser = typeof advertisers.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertMetrics = z.infer<typeof insertMetricsSchema>;
export type Metrics = typeof metrics.$inferSelect;
export type InsertAlert = z.infer<typeof insertAlertSchema>;
export type Alert = typeof alerts.$inferSelect;
export type InsertBranding = z.infer<typeof insertBrandingSchema>;
export type Branding = typeof branding.$inferSelect;
export type InsertPlatformSettings = z.infer<typeof insertPlatformSettingsSchema>;
export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertSubscriber = z.infer<typeof insertSubscriberSchema>;
export type Subscriber = typeof subscribers.$inferSelect;
export type InsertSubscriberPodcast = z.infer<typeof insertSubscriberPodcastSchema>;
export type SubscriberPodcast = typeof subscriberPodcasts.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompanyContact = z.infer<typeof insertCompanyContactSchema>;
export type CompanyContact = typeof companyContacts.$inferSelect;
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;
export type InsertDealActivity = z.infer<typeof insertDealActivitySchema>;
export type DealActivity = typeof dealActivities.$inferSelect;
export type InsertAdCreative = z.infer<typeof insertAdCreativeSchema>;
export type AdCreative = typeof adCreatives.$inferSelect;

export type InsertOutboundCampaign = z.infer<typeof insertOutboundCampaignSchema>;
export type OutboundCampaign = typeof outboundCampaigns.$inferSelect;
export type InsertDealLineItem = z.infer<typeof insertDealLineItemSchema>;
export type DealLineItem = typeof dealLineItems.$inferSelect;
export type InsertCampaignEmail = z.infer<typeof insertCampaignEmailSchema>;
export type CampaignEmail = typeof campaignEmails.$inferSelect;
export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertClipAsset = z.infer<typeof insertClipAssetSchema>;
export type ClipAsset = typeof clipAssets.$inferSelect;
export type InsertNewsletterSchedule = z.infer<typeof insertNewsletterScheduleSchema>;
export type NewsletterSchedule = typeof newsletterSchedules.$inferSelect;
export type InsertNewsletterRun = z.infer<typeof insertNewsletterRunSchema>;
export type NewsletterRun = typeof newsletterRuns.$inferSelect;
export type InsertNewsLayoutSection = z.infer<typeof insertNewsLayoutSectionSchema>;
export type NewsLayoutSection = typeof newsLayoutSections.$inferSelect;
export type InsertCrmList = z.infer<typeof insertCrmListSchema>;
export type CrmList = typeof crmLists.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;
export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskActivityLog = z.infer<typeof insertTaskActivityLogSchema>;
export type TaskActivityLog = typeof taskActivityLogs.$inferSelect;

export const NPS_CATEGORIES = ["usability", "features", "performance", "support", "content_quality", "value", "general"] as const;
export type NpsCategory = typeof NPS_CATEGORIES[number];

export const npsSurveys = pgTable("nps_surveys", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  score: integer("score").notNull(),
  feedback: text("feedback"),
  category: varchar("category", { length: 50 }).default("general"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNpsSurveySchema = createInsertSchema(npsSurveys).omit({ id: true, createdAt: true });
export type InsertNpsSurvey = z.infer<typeof insertNpsSurveySchema>;
export type NpsSurvey = typeof npsSurveys.$inferSelect;

// ── Read Later ──
export const readLaterItems = pgTable("read_later_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  contentPieceId: varchar("content_piece_id").notNull(),
  savedAt: timestamp("saved_at").defaultNow().notNull(),
}, (table) => [
  index("read_later_user_idx").on(table.userId),
  index("read_later_content_idx").on(table.contentPieceId),
]);

export const insertReadLaterItemSchema = createInsertSchema(readLaterItems).omit({ id: true, savedAt: true });
export type InsertReadLaterItem = z.infer<typeof insertReadLaterItemSchema>;
export type ReadLaterItem = typeof readLaterItems.$inferSelect;

// ── Legal Templates ──
export const legalTemplates = pgTable("legal_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateType: text("template_type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLegalTemplateSchema = createInsertSchema(legalTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLegalTemplate = z.infer<typeof insertLegalTemplateSchema>;
export type LegalTemplate = typeof legalTemplates.$inferSelect;

// ── Device Registrations (Multi-Platform) ──
export const deviceRegistrations = pgTable("device_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id"),
  platform: text("platform").notNull(),
  pushToken: text("push_token").unique(),
  deviceModel: text("device_model"),
  osVersion: text("os_version"),
  appVersion: text("app_version"),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDeviceRegistrationSchema = createInsertSchema(deviceRegistrations).omit({ id: true, createdAt: true, lastActiveAt: true });
export type InsertDeviceRegistration = z.infer<typeof insertDeviceRegistrationSchema>;
export type DeviceRegistration = typeof deviceRegistrations.$inferSelect;

// ── Push Notifications ──
export const pushNotifications = pgTable("push_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  body: text("body").notNull(),
  type: text("type").default("general"),
  targetAudience: text("target_audience").default("all"),
  contentId: varchar("content_id"),
  podcastId: varchar("podcast_id"),
  sentAt: timestamp("sent_at").defaultNow(),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
});

export const insertPushNotificationSchema = createInsertSchema(pushNotifications).omit({ id: true, sentAt: true });
export type InsertPushNotification = z.infer<typeof insertPushNotificationSchema>;
export type PushNotification = typeof pushNotifications.$inferSelect;

// ── Content Bookmarks (Server-Side) ──
export const contentBookmarks = pgTable("content_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull(),
  contentType: text("content_type").notNull(),
  contentId: varchar("content_id").notNull(),
  bookmarkedAt: timestamp("bookmarked_at").defaultNow(),
}, (table) => [
  index("content_bookmarks_subscriber_idx").on(table.subscriberId),
]);

export const insertContentBookmarkSchema = createInsertSchema(contentBookmarks).omit({ id: true, bookmarkedAt: true });
export type InsertContentBookmark = z.infer<typeof insertContentBookmarkSchema>;
export type ContentBookmark = typeof contentBookmarks.$inferSelect;

// ── Page Builder ──
export const sitePages = pgTable("site_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  pageType: text("page_type").default("custom"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array().default(sql`ARRAY[]::text[]`),
  ogImage: text("og_image"),
  layoutType: text("layout_type").default("full_width"),
  status: text("status").default("draft"),
  isHomepage: boolean("is_homepage").default(false),
  templateId: varchar("template_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const insertSitePageSchema = createInsertSchema(sitePages).omit({ id: true, createdAt: true, updatedAt: true, publishedAt: true });
export type InsertSitePage = z.infer<typeof insertSitePageSchema>;
export type SitePage = typeof sitePages.$inferSelect;

export const pageRows = pgTable("page_rows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull(),
  displayOrder: integer("display_order").default(0),
  rowType: text("row_type").default("content"),
  columnCount: integer("column_count").default(1),
  backgroundColor: text("background_color"),
  backgroundImage: text("background_image"),
  paddingTop: integer("padding_top").default(24),
  paddingBottom: integer("padding_bottom").default(24),
  cssClass: text("css_class"),
  visible: boolean("visible").default(true),
  deviceVisibility: text("device_visibility").default("all"),
  conditions: jsonb("conditions").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("page_rows_page_id_idx").on(table.pageId),
]);

export const insertPageRowSchema = createInsertSchema(pageRows).omit({ id: true, createdAt: true });
export type InsertPageRow = z.infer<typeof insertPageRowSchema>;
export type PageRow = typeof pageRows.$inferSelect;

export const pageWidgets = pgTable("page_widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rowId: varchar("row_id").notNull(),
  pageId: varchar("page_id").notNull(),
  widgetType: varchar("widget_type").notNull(),
  displayOrder: integer("display_order").default(0),
  columnSpan: integer("column_span").default(1),
  columnPosition: integer("column_position").default(0),
  config: jsonb("config").default({}),
  titleOverride: text("title_override"),
  visible: boolean("visible").default(true),
  cacheTtl: integer("cache_ttl").default(300),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("page_widgets_row_id_idx").on(table.rowId),
  index("page_widgets_page_id_idx").on(table.pageId),
]);

export const insertPageWidgetSchema = createInsertSchema(pageWidgets).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPageWidget = z.infer<typeof insertPageWidgetSchema>;
export type PageWidget = typeof pageWidgets.$inferSelect;

export const pageTemplates = pgTable("page_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  templateType: text("template_type").default("custom"),
  thumbnailUrl: text("thumbnail_url"),
  rowsConfig: jsonb("rows_config").default([]),
  layout: jsonb("layout").default([]),
  isDefault: boolean("is_default").default(false),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPageTemplateSchema = createInsertSchema(pageTemplates).omit({ id: true, createdAt: true });
export type InsertPageTemplate = z.infer<typeof insertPageTemplateSchema>;
export type PageTemplate = typeof pageTemplates.$inferSelect;

export const builtPages = pgTable("built_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  status: text("status").default("draft"),
  pageType: text("page_type").default("custom"),
  podcastId: varchar("podcast_id"),
  layout: jsonb("layout").notNull().default([]),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  coverImage: text("cover_image"),
  publishedAt: timestamp("published_at"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBuiltPageSchema = createInsertSchema(builtPages).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBuiltPage = z.infer<typeof insertBuiltPageSchema>;
export type BuiltPage = typeof builtPages.$inferSelect;

// ── Community Content ──
export const communityEvents = pgTable("community_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  venueName: text("venue_name"),
  venueAddress: text("venue_address"),
  eventUrl: text("event_url"),
  coverImage: text("cover_image"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  isFeatured: boolean("is_featured").default(false),
  isVirtual: boolean("is_virtual").default(false),
  category: text("category").default("general"),
  imageUrl: text("image_url"),
  ticketUrl: text("ticket_url"),
  organizerName: text("organizer_name"),
  organizerEmail: text("organizer_email"),
  status: text("status").default("upcoming"),
  submittedBy: text("submitted_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityEventSchema = createInsertSchema(communityEvents).omit({ id: true, createdAt: true });
export type InsertCommunityEvent = z.infer<typeof insertCommunityEventSchema>;
export type CommunityEvent = typeof communityEvents.$inferSelect;

export const obituaries = pgTable("obituaries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  photoUrl: text("photo_url"),
  birthDate: text("birth_date"),
  deathDate: text("death_date"),
  obituaryText: text("obituary_text"),
  funeralHome: text("funeral_home"),
  serviceDetails: text("service_details"),
  tributeUrl: text("tribute_url"),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

export const insertObituarySchema = createInsertSchema(obituaries).omit({ id: true, createdAt: true, publishedAt: true });
export type InsertObituary = z.infer<typeof insertObituarySchema>;
export type Obituary = typeof obituaries.$inferSelect;

export const classifieds = pgTable("classifieds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").default("for_sale"),
  price: real("price"),
  priceType: text("price_type").default("fixed"),
  images: text("images").array().default(sql`ARRAY[]::text[]`),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  location: text("location"),
  status: text("status").default("active"),
  expiresAt: timestamp("expires_at"),
  submittedBy: text("submitted_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertClassifiedSchema = createInsertSchema(classifieds).omit({ id: true, createdAt: true });
export type InsertClassified = z.infer<typeof insertClassifiedSchema>;
export type Classified = typeof classifieds.$inferSelect;

export const communityPolls = pgTable("community_polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  pollType: text("poll_type").default("single"),
  options: jsonb("options").notNull(),
  results: jsonb("results").default({}),
  totalVotes: integer("total_votes").default(0),
  status: text("status").default("active"),
  isFeatured: boolean("is_featured").default(false),
  closesAt: timestamp("closes_at"),
  createdBy: varchar("created_by"),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isPublished: boolean("is_published").default(false),
  showResultsBeforeVote: boolean("show_results_before_vote").default(false),
  placementZones: jsonb("placement_zones").default([]),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityPollSchema = createInsertSchema(communityPolls).omit({ id: true, createdAt: true });
export type InsertCommunityPoll = z.infer<typeof insertCommunityPollSchema>;
export type CommunityPoll = typeof communityPolls.$inferSelect;

export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull(),
  optionId: text("option_id").notNull(),
  voterIdentifier: text("voter_identifier").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("poll_votes_poll_voter_idx").on(table.pollId, table.voterIdentifier),
]);

export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({ id: true, createdAt: true });
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type PollVote = typeof pollVotes.$inferSelect;

export const communityAnnouncements = pgTable("community_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(),
  names: text("names").notNull(),
  description: text("description"),
  photoUrl: text("photo_url"),
  eventDate: text("event_date"),
  submittedBy: text("submitted_by"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityAnnouncementSchema = createInsertSchema(communityAnnouncements).omit({ id: true, createdAt: true });
export type InsertCommunityAnnouncement = z.infer<typeof insertCommunityAnnouncementSchema>;
export type CommunityAnnouncement = typeof communityAnnouncements.$inferSelect;

export const businessListings = pgTable("business_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessName: text("business_name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  category: text("category"),
  subcategory: text("subcategory"),
  logoUrl: text("logo_url"),
  coverImage: text("cover_image"),
  website: text("website"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  postalCode: text("postal_code"),
  hours: jsonb("hours").default({}),
  socialLinks: jsonb("social_links").default({}),
  isFeatured: boolean("is_featured").default(false),
  isVerified: boolean("is_verified").default(false),
  advertiserId: varchar("advertiser_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBusinessListingSchema = createInsertSchema(businessListings).omit({ id: true, createdAt: true });
export type InsertBusinessListing = z.infer<typeof insertBusinessListingSchema>;
export type BusinessListing = typeof businessListings.$inferSelect;

export const aiLayoutExamples = pgTable("ai_layout_examples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageType: text("page_type").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  layoutJson: jsonb("layout_json").notNull(),
  isDefault: boolean("is_default").default(false),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAiLayoutExampleSchema = createInsertSchema(aiLayoutExamples).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAiLayoutExample = z.infer<typeof insertAiLayoutExampleSchema>;
export type AiLayoutExample = typeof aiLayoutExamples.$inferSelect;

export const adInjectionLog = pgTable("ad_injection_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id"),
  pageSlug: text("page_slug"),
  adsInjected: integer("ads_injected").notNull(),
  violationsFound: text("violations_found").array().default([]),
  injectedAt: timestamp("injected_at").defaultNow(),
});

export const insertAdInjectionLogSchema = createInsertSchema(adInjectionLog).omit({ id: true, injectedAt: true });
export type InsertAdInjectionLog = z.infer<typeof insertAdInjectionLogSchema>;
export type AdInjectionLog = typeof adInjectionLog.$inferSelect;

// ── Web Push Subscriptions ──
export const devicePushSubscriptions = pgTable("device_push_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberEmail: text("subscriber_email"),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  userAgent: text("user_agent"),
  preferences: jsonb("preferences").default({ articles: true, episodes: true, breaking: true }),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsed: timestamp("last_used").defaultNow(),
}, (table) => [
  index("device_push_subs_endpoint_idx").on(table.endpoint),
]);

export const insertDevicePushSubscriptionSchema = createInsertSchema(devicePushSubscriptions).omit({ id: true, createdAt: true, lastUsed: true });
export type InsertDevicePushSubscription = z.infer<typeof insertDevicePushSubscriptionSchema>;
export type DevicePushSubscription = typeof devicePushSubscriptions.$inferSelect;

// ── Subscriber Bookmarks ──
export const subscriberBookmarks = pgTable("subscriber_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberEmail: text("subscriber_email").notNull(),
  articleId: text("article_id").notNull(),
  articleTitle: text("article_title"),
  articleDescription: text("article_description"),
  coverImage: text("cover_image"),
  podcastId: text("podcast_id"),
  podcastTitle: text("podcast_title"),
  readingTime: text("reading_time"),
  publishedAt: timestamp("published_at"),
  savedAt: timestamp("saved_at").defaultNow(),
}, (table) => [
  uniqueIndex("subscriber_bookmarks_email_article_idx").on(table.subscriberEmail, table.articleId),
  index("subscriber_bookmarks_email_idx").on(table.subscriberEmail),
]);

export const insertSubscriberBookmarkSchema = createInsertSchema(subscriberBookmarks).omit({ id: true, savedAt: true });
export type InsertSubscriberBookmark = z.infer<typeof insertSubscriberBookmarkSchema>;
export type SubscriberBookmark = typeof subscriberBookmarks.$inferSelect;

// ── Community Posts ──
export const communityPosts = pgTable("community_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email"),
  authorAvatar: text("author_avatar"),
  content: text("content").notNull(),
  parentId: varchar("parent_id"),
  likesCount: integer("likes_count").default(0),
  isPinned: boolean("is_pinned").default(false),
  isHidden: boolean("is_hidden").default(false),
  topic: text("topic"),
  title: text("title"),
  isThreadStarter: boolean("is_thread_starter").default(false),
  replyCount: integer("reply_count").default(0),
  isFlagged: boolean("is_flagged").default(false),
  flaggedReason: text("flagged_reason"),
  isAiGenerated: boolean("is_ai_generated").default(false),
  moderationStatus: text("moderation_status").default("visible"),
  moderatedBy: text("moderated_by"),
  moderatedAt: timestamp("moderated_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({ id: true, createdAt: true, likesCount: true, replyCount: true });
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;

export const communityLikes = pgTable("community_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull(),
  likerIdentifier: text("liker_identifier").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("community_likes_post_liker_idx").on(table.postId, table.likerIdentifier),
]);

export const insertCommunityLikeSchema = createInsertSchema(communityLikes).omit({ id: true, createdAt: true });
export type InsertCommunityLike = z.infer<typeof insertCommunityLikeSchema>;
export type CommunityLike = typeof communityLikes.$inferSelect;

export const adminPageConfigs = pgTable("admin_page_configs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageKey: text("page_key").unique().notNull(),
  title: text("title").notNull(),
  description: text("description"),
  iconName: text("icon_name").notNull(),
  primaryActionLabel: text("primary_action_label"),
  aiActionLabel: text("ai_action_label"),
  metricsConfig: jsonb("metrics_config"),
  sortOrder: integer("sort_order").notNull(),
  isVisible: boolean("is_visible").default(true),
  navSection: text("nav_section").default("ungrouped"),
  navParent: text("nav_parent"),
  route: text("route").notNull().default("/"),
  permission: text("permission").notNull().default("dashboard.view"),
});

export const insertAdminPageConfigSchema = createInsertSchema(adminPageConfigs).omit({ id: true });
export type InsertAdminPageConfig = z.infer<typeof insertAdminPageConfigSchema>;
export type AdminPageConfig = typeof adminPageConfigs.$inferSelect;

export const adminNavSections = pgTable("admin_nav_sections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sectionKey: text("section_key").unique().notNull(),
  displayName: text("display_name").notNull(),
  iconName: text("icon_name"),
  sortOrder: integer("sort_order").notNull().default(0),
  isCollapsedDefault: boolean("is_collapsed_default").default(false),
});

export const insertAdminNavSectionSchema = createInsertSchema(adminNavSections).omit({ id: true });
export type InsertAdminNavSection = z.infer<typeof insertAdminNavSectionSchema>;
export type AdminNavSection = typeof adminNavSections.$inferSelect;

export const pageAnalytics = pgTable("page_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  pageTitle: text("page_title"),
  sessionId: text("session_id").notNull(),
  visitorId: text("visitor_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  deviceType: text("device_type"),
  browser: text("browser"),
  os: text("os"),
  country: text("country"),
  region: text("region"),
  timeOnPage: integer("time_on_page"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("page_analytics_session_idx").on(table.sessionId),
  index("page_analytics_created_idx").on(table.createdAt),
  index("page_analytics_url_idx").on(table.url),
]);

export const insertPageAnalyticsSchema = createInsertSchema(pageAnalytics).omit({ id: true, createdAt: true });
export type InsertPageAnalytics = z.infer<typeof insertPageAnalyticsSchema>;
export type PageAnalytics = typeof pageAnalytics.$inferSelect;

export const npsResponses = pgTable("nps_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  score: integer("score").notNull(),
  comment: text("comment"),
  respondentEmail: text("respondent_email"),
  sentiment: text("sentiment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNpsResponseSchema = createInsertSchema(npsResponses).omit({ id: true, createdAt: true, sentiment: true });
export type InsertNpsResponse = z.infer<typeof insertNpsResponseSchema>;
export type NpsResponse = typeof npsResponses.$inferSelect;

export const userFeedback = pgTable("user_feedback", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rating: integer("rating").notNull(),
  feedbackText: text("feedback_text"),
  respondentEmail: text("respondent_email"),
  pageUrl: text("page_url"),
  sentiment: text("sentiment"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({ id: true, createdAt: true, sentiment: true });
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type UserFeedback = typeof userFeedback.$inferSelect;

export const aiInsightsCache = pgTable("ai_insights_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  insightType: text("insight_type").notNull(),
  data: jsonb("data"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const insertAiInsightsCacheSchema = createInsertSchema(aiInsightsCache).omit({ id: true, generatedAt: true });
export type InsertAiInsightsCache = z.infer<typeof insertAiInsightsCacheSchema>;
export type AiInsightsCache = typeof aiInsightsCache.$inferSelect;

export const commercialLeads = pgTable("commercial_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  source: text("source"),
  pipelineStage: text("pipeline_stage").default("lead"),
  pipelineType: text("pipeline_type").default("new_logo"),
  estimatedValue: real("estimated_value").default(0),
  notes: text("notes"),
  aiScore: integer("ai_score"),
  aiRecommendation: text("ai_recommendation"),
  lastActivityAt: timestamp("last_activity_at"),
  assignedTo: varchar("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("commercial_leads_pipeline_stage_idx").on(table.pipelineStage),
  index("commercial_leads_pipeline_type_idx").on(table.pipelineType),
]);

export const insertCommercialLeadSchema = createInsertSchema(commercialLeads).omit({ id: true, createdAt: true });
export type InsertCommercialLead = z.infer<typeof insertCommercialLeadSchema>;
export type CommercialLead = typeof commercialLeads.$inferSelect;

export const commercialProposals = pgTable("commercial_proposals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull(),
  proposalName: text("proposal_name").notNull(),
  products: jsonb("products"),
  totalValue: real("total_value").default(0),
  status: text("status").default("draft"),
  sentAt: timestamp("sent_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("commercial_proposals_lead_id_idx").on(table.leadId),
]);

export const insertCommercialProposalSchema = createInsertSchema(commercialProposals).omit({ id: true, createdAt: true });
export type InsertCommercialProposal = z.infer<typeof insertCommercialProposalSchema>;
export type CommercialProposal = typeof commercialProposals.$inferSelect;

export const commercialOrders = pgTable("commercial_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull(),
  proposalId: varchar("proposal_id"),
  orderName: text("order_name").notNull(),
  products: jsonb("products"),
  totalValue: real("total_value").default(0),
  status: text("status").default("active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("commercial_orders_lead_id_idx").on(table.leadId),
]);

export const insertCommercialOrderSchema = createInsertSchema(commercialOrders).omit({ id: true, createdAt: true });
export type InsertCommercialOrder = z.infer<typeof insertCommercialOrderSchema>;
export type CommercialOrder = typeof commercialOrders.$inferSelect;

export const campaignPerformance = pgTable("campaign_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  campaignName: text("campaign_name").notNull(),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  spend: real("spend").default(0),
  revenue: real("revenue").default(0),
  ctr: real("ctr"),
  roas: real("roas"),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("campaign_performance_order_id_idx").on(table.orderId),
]);

export const insertCampaignPerformanceSchema = createInsertSchema(campaignPerformance).omit({ id: true, createdAt: true });
export type InsertCampaignPerformance = z.infer<typeof insertCampaignPerformanceSchema>;
export type CampaignPerformance = typeof campaignPerformance.$inferSelect;

export const aiAdvertiserPrompts = pgTable("ai_advertiser_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  leadId: varchar("lead_id"),
  promptMessage: text("prompt_message").notNull(),
  suggestedIncrease: real("suggested_increase"),
  projections: jsonb("projections"),
  status: text("status").default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
}, (table) => [
  index("ai_advertiser_prompts_order_id_idx").on(table.orderId),
  index("ai_advertiser_prompts_status_idx").on(table.status),
]);

export const insertAiAdvertiserPromptSchema = createInsertSchema(aiAdvertiserPrompts).omit({ id: true, createdAt: true });
export type InsertAiAdvertiserPrompt = z.infer<typeof insertAiAdvertiserPromptSchema>;
export type AiAdvertiserPrompt = typeof aiAdvertiserPrompts.$inferSelect;

export const aiContentLog = pgTable("ai_content_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contentType: text("content_type").notNull(),
  promptSummary: text("prompt_summary"),
  modelUsed: text("model_used"),
  tokensUsed: integer("tokens_used"),
  userId: varchar("user_id"),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const insertAiContentLogSchema = createInsertSchema(aiContentLog).omit({ id: true, generatedAt: true });
export type InsertAiContentLog = z.infer<typeof insertAiContentLogSchema>;
export type AiContentLog = typeof aiContentLog.$inferSelect;

export const liveSessions = pgTable("live_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(),
  ipAddress: text("ip_address"),
  latitude: numeric("latitude"),
  longitude: numeric("longitude"),
  country: text("country"),
  city: text("city"),
  currentPage: text("current_page"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"),
  connectedAt: timestamp("connected_at").defaultNow(),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
});

export const insertLiveSessionSchema = createInsertSchema(liveSessions).omit({ id: true, connectedAt: true, lastActivityAt: true });
export type InsertLiveSession = z.infer<typeof insertLiveSessionSchema>;
export type LiveSession = typeof liveSessions.$inferSelect;

export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message"),
  link: text("link"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
  index("notifications_is_read_idx").on(table.isRead),
]);

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export const aiAgents = pgTable("ai_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentName: text("agent_name").notNull(),
  agentPersona: text("agent_persona").notNull(),
  agentAvatar: text("agent_avatar"),
  topics: text("topics").array().default(sql`ARRAY[]::text[]`),
  isActive: boolean("is_active").default(true),
  postingFrequency: text("posting_frequency").default("daily"),
  lastPostedAt: timestamp("last_posted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiAgentSchema = createInsertSchema(aiAgents).omit({ id: true, createdAt: true });
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;
export type AiAgent = typeof aiAgents.$inferSelect;

// ── Push Campaigns ──
export const pushCampaigns = pgTable("push_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  iconUrl: text("icon_url"),
  clickUrl: text("click_url"),
  imageUrl: text("image_url"),
  targetSegment: text("target_segment").notNull().default("all"),
  status: text("status").notNull().default("draft"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  recipientCount: integer("recipient_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  failedCount: integer("failed_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPushCampaignSchema = createInsertSchema(pushCampaigns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPushCampaign = z.infer<typeof insertPushCampaignSchema>;
export type PushCampaign = typeof pushCampaigns.$inferSelect;

export const pushCampaignLogs = pgTable("push_campaign_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: text("campaign_id").notNull(),
  subscriptionId: text("subscription_id").notNull(),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPushCampaignLogSchema = createInsertSchema(pushCampaignLogs).omit({ id: true, createdAt: true });
export type InsertPushCampaignLog = z.infer<typeof insertPushCampaignLogSchema>;
export type PushCampaignLog = typeof pushCampaignLogs.$inferSelect;

// ── Advertising System Tables ──

export const sponsorshipPackages = pgTable("sponsorship_packages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  tier: text("tier").notNull(),
  description: text("description"),
  priceMonthly: numeric("price_monthly"),
  pricePerEpisode: numeric("price_per_episode"),
  includesShowHero: boolean("includes_show_hero").default(false),
  includesEpisodeCards: boolean("includes_episode_cards").default(false),
  includesArticleInjection: boolean("includes_article_injection").default(false),
  includesPushMention: boolean("includes_push_mention").default(false),
  includesQrCode: boolean("includes_qr_code").default(false),
  includesHostReadCopy: boolean("includes_host_read_copy").default(false),
  includesNetworkWide: boolean("includes_network_wide").default(false),
  maxShows: integer("max_shows"),
  impressionEstimate: integer("impression_estimate"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSponsorshipPackageSchema = createInsertSchema(sponsorshipPackages).omit({ id: true, createdAt: true });
export type InsertSponsorshipPackage = z.infer<typeof insertSponsorshipPackageSchema>;
export type SponsorshipPackage = typeof sponsorshipPackages.$inferSelect;

export const sponsorships = pgTable("sponsorships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserName: text("advertiser_name").notNull(),
  advertiserUrl: text("advertiser_url"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  packageId: varchar("package_id"),
  showIds: jsonb("show_ids"),
  logoUrl: text("logo_url"),
  logoDarkUrl: text("logo_dark_url"),
  tagline: text("tagline"),
  qrCodeUrl: text("qr_code_url"),
  qrCodeImageUrl: text("qr_code_image_url"),
  hostReadCopy: text("host_read_copy"),
  ctaText: text("cta_text"),
  status: text("status").default("active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  monthlyValue: numeric("monthly_value"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSponsorshipSchema = createInsertSchema(sponsorships).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSponsorship = z.infer<typeof insertSponsorshipSchema>;
export type Sponsorship = typeof sponsorships.$inferSelect;

export const adUnits = pgTable("ad_units", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserName: text("advertiser_name").notNull(),
  advertiserUrl: text("advertiser_url"),
  contactEmail: text("contact_email"),
  zone: text("zone").notNull(),
  imageUrl: text("image_url"),
  clickUrl: text("click_url"),
  altText: text("alt_text"),
  status: text("status").default("active"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  monthlyValue: numeric("monthly_value"),
  priority: integer("priority").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdUnitSchema = createInsertSchema(adUnits).omit({ id: true, createdAt: true });
export type InsertAdUnit = z.infer<typeof insertAdUnitSchema>;
export type AdUnit = typeof adUnits.$inferSelect;

export const adImpressions = pgTable("ad_impressions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  placement: text("placement").notNull(),
  showId: varchar("show_id"),
  episodeId: varchar("episode_id"),
  articleId: varchar("article_id"),
  visitorId: text("visitor_id"),
  pageUrl: text("page_url"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("ad_impressions_entity_idx").on(table.entityId, table.entityType),
]);

export const insertAdImpressionSchema = createInsertSchema(adImpressions).omit({ id: true, createdAt: true });
export type InsertAdImpression = z.infer<typeof insertAdImpressionSchema>;
export type AdImpression = typeof adImpressions.$inferSelect;

export const adClicks = pgTable("ad_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  placement: text("placement").notNull(),
  visitorId: text("visitor_id"),
  pageUrl: text("page_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAdClickSchema = createInsertSchema(adClicks).omit({ id: true, createdAt: true });
export type InsertAdClick = z.infer<typeof insertAdClickSchema>;
export type AdClick = typeof adClicks.$inferSelect;

export const qrScans = pgTable("qr_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorshipId: varchar("sponsorship_id").notNull(),
  visitorId: text("visitor_id"),
  pageUrl: text("page_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQrScanSchema = createInsertSchema(qrScans).omit({ id: true, createdAt: true });
export type InsertQrScan = z.infer<typeof insertQrScanSchema>;
export type QrScan = typeof qrScans.$inferSelect;

export const autoUpsellDrafts = pgTable("auto_upsell_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorshipId: varchar("sponsorship_id").notNull(),
  message: text("message"),
  suggestedUpgradePackageId: varchar("suggested_upgrade_package_id"),
  estimatedAdditionalRevenue: numeric("estimated_additional_revenue"),
  status: text("status").default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAutoUpsellDraftSchema = createInsertSchema(autoUpsellDrafts).omit({ id: true, createdAt: true });
export type InsertAutoUpsellDraft = z.infer<typeof insertAutoUpsellDraftSchema>;
export type AutoUpsellDraft = typeof autoUpsellDrafts.$inferSelect;

export * from "./models/chat";
