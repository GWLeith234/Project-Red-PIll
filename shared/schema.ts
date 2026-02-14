import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core";
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
  subscribers: integer("subscribers").default(0),
  growthPercent: real("growth_percent").default(0),
  multiplicationFactor: integer("multiplication_factor").default(50),
  status: text("status").default("active"),
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
  publishedAt: timestamp("published_at").defaultNow(),
  processingStatus: text("processing_status").default("pending"),
  processingProgress: integer("processing_progress").default(0),
});

export const contentPieces = pgTable("content_pieces", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  episodeId: varchar("episode_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  body: text("body"),
  coverImage: text("cover_image"),
  platform: text("platform"),
  status: text("status").default("pending"),
  slug: text("slug"),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords").array().default(sql`ARRAY[]::text[]`),
  summary: text("summary"),
  readingTime: integer("reading_time"),
  aiGenerated: boolean("ai_generated").default(false),
  authorId: varchar("author_id"),
  moderatedBy: varchar("moderated_by"),
  moderatedAt: timestamp("moderated_at"),
  publishedAt: timestamp("published_at").defaultNow(),
});

export const advertisers = pgTable("advertisers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  monthlySpend: real("monthly_spend").default(0),
  type: text("type").default("Direct"),
  status: text("status").default("Active"),
});

export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  advertiserId: varchar("advertiser_id").notNull(),
  name: text("name").notNull(),
  budget: real("budget").default(0),
  spent: real("spent").default(0),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  status: text("status").default("active"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
});

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
});

export const branding = pgTable("branding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").default("MediaTech Empire"),
  tagline: text("tagline").default("AI-Powered Media Platform"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  bannerUrl: text("banner_url"),
  primaryColor: text("primary_color").default("#E5C100"),
  accentColor: text("accent_color").default("#22C55E"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const platformSettings = pgTable("platform_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timezone: text("timezone").default("America/New_York"),
  dateFormat: text("date_format").default("MM/DD/YYYY"),
  defaultLanguage: text("default_language").default("en"),
  autoPublishContent: boolean("auto_publish_content").default(false),
  contentTypes: text("content_types").array().default(sql`ARRAY['video_clip','article','social_post','newsletter','seo_asset']::text[]`),
  defaultPlatforms: text("default_platforms").array().default(sql`ARRAY['TikTok','Reels','Shorts','Twitter','LinkedIn']::text[]`),
  aiQuality: text("ai_quality").default("balanced"),
  emailNotifications: boolean("email_notifications").default(true),
  alertThreshold: text("alert_threshold").default("all"),
  weeklyDigest: boolean("weekly_digest").default(true),
  revenueAlerts: boolean("revenue_alerts").default(true),
  processingAlerts: boolean("processing_alerts").default(true),
  sessionTimeoutMinutes: integer("session_timeout_minutes").default(10080),
  maxLoginAttempts: integer("max_login_attempts").default(5),
  requireStrongPasswords: boolean("require_strong_passwords").default(true),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  articleId: varchar("article_id").notNull(),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subscribers = pgTable("subscribers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const subscriberPodcasts = pgTable("subscriber_podcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull(),
  podcastId: varchar("podcast_id").notNull(),
  subscribedAt: timestamp("subscribed_at").defaultNow(),
});

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
});

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
  notes: text("notes"),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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
});

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
  status: text("status").default("draft").notNull(),
  subject: text("subject"),
  body: text("body").notNull(),
  podcastFilter: varchar("podcast_filter"),
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
});

export const SOCIAL_PLATFORMS = ["x", "facebook", "linkedin", "google_business", "instagram", "tiktok"] as const;
export type SocialPlatform = typeof SOCIAL_PLATFORMS[number];

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
  createdAt: timestamp("created_at").defaultNow(),
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
});

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
});

export const newsletterRuns = pgTable("newsletter_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  period: text("period").notNull(),
  body: text("body"),
  contentPieceIds: text("content_piece_ids").array().default(sql`ARRAY[]::text[]`),
  status: text("status").default("draft").notNull(),
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
export const insertCrmListSchema = createInsertSchema(crmLists).omit({ id: true, createdAt: true });
export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({ id: true, createdAt: true });
export const insertScheduledPostSchema = createInsertSchema(scheduledPosts).omit({ id: true, createdAt: true });
export const insertClipAssetSchema = createInsertSchema(clipAssets).omit({ id: true, createdAt: true });
export const insertNewsletterRunSchema = createInsertSchema(newsletterRuns).omit({ id: true, createdAt: true });
export const insertHeroSlideSchema = createInsertSchema(heroSlides).omit({ id: true, createdAt: true });
export const insertOutboundCampaignSchema = createInsertSchema(outboundCampaigns).omit({ id: true, createdAt: true, sentAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCompanyContactSchema = createInsertSchema(companyContacts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDealSchema = createInsertSchema(deals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertDealActivitySchema = createInsertSchema(dealActivities).omit({ id: true, createdAt: true });
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
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });

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

export type InsertOutboundCampaign = z.infer<typeof insertOutboundCampaignSchema>;
export type OutboundCampaign = typeof outboundCampaigns.$inferSelect;
export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;
export type HeroSlide = typeof heroSlides.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertScheduledPost = z.infer<typeof insertScheduledPostSchema>;
export type ScheduledPost = typeof scheduledPosts.$inferSelect;
export type InsertClipAsset = z.infer<typeof insertClipAssetSchema>;
export type ClipAsset = typeof clipAssets.$inferSelect;
export type InsertNewsletterRun = z.infer<typeof insertNewsletterRunSchema>;
export type NewsletterRun = typeof newsletterRuns.$inferSelect;
export type InsertCrmList = z.infer<typeof insertCrmListSchema>;
export type CrmList = typeof crmLists.$inferSelect;

export * from "./models/chat";
