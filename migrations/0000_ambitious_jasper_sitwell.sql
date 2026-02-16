CREATE TABLE "ad_creatives" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar NOT NULL,
	"name" text NOT NULL,
	"format" text DEFAULT 'banner_300x250' NOT NULL,
	"file_url" text,
	"thumbnail_url" text,
	"click_url" text,
	"alt_text" text,
	"headline" text,
	"body_text" text,
	"cta_text" text,
	"targeted_impressions" integer DEFAULT 0,
	"delivered_impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"status" text DEFAULT 'draft' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"podcast_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ad_injection_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" varchar,
	"page_slug" text,
	"ads_injected" integer NOT NULL,
	"violations_found" text[] DEFAULT '{}',
	"injected_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_page_configs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_key" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"icon_name" text NOT NULL,
	"primary_action_label" text,
	"ai_action_label" text,
	"metrics_config" jsonb,
	"sort_order" integer NOT NULL,
	"is_visible" boolean DEFAULT true,
	"nav_section" text DEFAULT 'ungrouped',
	"nav_parent" text,
	"route" text DEFAULT '/' NOT NULL,
	"permission" text DEFAULT 'dashboard.view' NOT NULL,
	CONSTRAINT "admin_page_configs_page_key_unique" UNIQUE("page_key")
);
--> statement-breakpoint
CREATE TABLE "advertisers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"monthly_spend" real DEFAULT 0,
	"type" text DEFAULT 'Direct',
	"status" text DEFAULT 'Active',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_advertiser_prompts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"lead_id" varchar,
	"prompt_message" text NOT NULL,
	"suggested_increase" real,
	"projections" jsonb,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "ai_content_log" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_type" text NOT NULL,
	"prompt_summary" text,
	"model_used" text,
	"tokens_used" integer,
	"user_id" varchar,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_insights_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"insight_type" text NOT NULL,
	"data" jsonb,
	"generated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ai_layout_examples" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_type" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"layout_json" jsonb NOT NULL,
	"is_default" boolean DEFAULT false,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text DEFAULT 'info',
	"read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"permissions" text[] DEFAULT ARRAY[]::text[],
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_by_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"user_name" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" varchar,
	"details" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "branding" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text DEFAULT 'MediaTech Empire',
	"tagline" text DEFAULT 'AI-Powered Media Platform',
	"logo_url" text,
	"favicon_url" text,
	"banner_url" text,
	"primary_color" text DEFAULT '#E5C100',
	"accent_color" text DEFAULT '#22C55E',
	"twitter_url" text,
	"facebook_url" text,
	"instagram_url" text,
	"youtube_url" text,
	"linkedin_url" text,
	"tiktok_url" text,
	"website_url" text,
	"contact_email" text,
	"contact_phone" text,
	"theme_mode" text DEFAULT 'dark',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "business_listings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"slug" text,
	"description" text,
	"category" text,
	"subcategory" text,
	"logo_url" text,
	"cover_image" text,
	"website" text,
	"phone" text,
	"email" text,
	"address" text,
	"city" text,
	"postal_code" text,
	"hours" jsonb DEFAULT '{}'::jsonb,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"is_featured" boolean DEFAULT false,
	"is_verified" boolean DEFAULT false,
	"advertiser_id" varchar,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "business_listings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "campaign_emails" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar NOT NULL,
	"day_number" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"subject" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"wait_duration" integer DEFAULT 1,
	"wait_unit" text DEFAULT 'days',
	"sort_order" integer DEFAULT 0,
	"delivered" integer DEFAULT 0,
	"opened" integer DEFAULT 0,
	"clicked" integer DEFAULT 0,
	"bounced" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_performance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"campaign_name" text NOT NULL,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"conversions" integer DEFAULT 0,
	"spend" real DEFAULT 0,
	"revenue" real DEFAULT 0,
	"ctr" real,
	"roas" real,
	"period_start" timestamp,
	"period_end" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"advertiser_id" varchar,
	"company_id" varchar,
	"deal_id" varchar,
	"name" text NOT NULL,
	"budget" real DEFAULT 0,
	"spent" real DEFAULT 0,
	"impressions" integer DEFAULT 0,
	"clicks" integer DEFAULT 0,
	"status" text DEFAULT 'scheduled',
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "classifieds" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" text DEFAULT 'for_sale',
	"price" real,
	"price_type" text DEFAULT 'fixed',
	"images" text[] DEFAULT ARRAY[]::text[],
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"location" text,
	"status" text DEFAULT 'active',
	"expires_at" timestamp,
	"submitted_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clip_assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" varchar NOT NULL,
	"title" text NOT NULL,
	"hook_text" text,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"duration" text,
	"transcript_excerpt" text,
	"viral_score" integer DEFAULT 0,
	"status" text DEFAULT 'suggested' NOT NULL,
	"clip_url" text,
	"thumbnail_url" text,
	"platform" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"article_id" varchar NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commercial_leads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text,
	"contact_email" text,
	"contact_phone" text,
	"source" text,
	"pipeline_stage" text DEFAULT 'lead',
	"pipeline_type" text DEFAULT 'new_logo',
	"estimated_value" real DEFAULT 0,
	"notes" text,
	"ai_score" integer,
	"ai_recommendation" text,
	"last_activity_at" timestamp,
	"assigned_to" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commercial_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"proposal_id" varchar,
	"order_name" text NOT NULL,
	"products" jsonb,
	"total_value" real DEFAULT 0,
	"status" text DEFAULT 'active',
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commercial_proposals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar NOT NULL,
	"proposal_name" text NOT NULL,
	"products" jsonb,
	"total_value" real DEFAULT 0,
	"status" text DEFAULT 'draft',
	"sent_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"names" text NOT NULL,
	"description" text,
	"photo_url" text,
	"event_date" text,
	"submitted_by" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"location" text,
	"venue_name" text,
	"venue_address" text,
	"event_url" text,
	"cover_image" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"start_time" text,
	"end_time" text,
	"is_featured" boolean DEFAULT false,
	"is_virtual" boolean DEFAULT false,
	"category" text DEFAULT 'general',
	"image_url" text,
	"ticket_url" text,
	"organizer_name" text,
	"organizer_email" text,
	"status" text DEFAULT 'upcoming',
	"submitted_by" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_likes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" varchar NOT NULL,
	"liker_identifier" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_polls" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"poll_type" text DEFAULT 'single',
	"options" jsonb NOT NULL,
	"results" jsonb DEFAULT '{}'::jsonb,
	"total_votes" integer DEFAULT 0,
	"status" text DEFAULT 'active',
	"is_featured" boolean DEFAULT false,
	"closes_at" timestamp,
	"created_by" varchar,
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" text NOT NULL,
	"author_email" text,
	"author_avatar" text,
	"content" text NOT NULL,
	"parent_id" varchar,
	"likes_count" integer DEFAULT 0,
	"is_pinned" boolean DEFAULT false,
	"is_hidden" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"website" text,
	"phone" text,
	"email" text,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"logo" text,
	"description" text,
	"slogan" text,
	"timezone" text,
	"brand_colors" text[],
	"annual_revenue" real,
	"employee_count" integer,
	"company_type" text DEFAULT 'advertiser',
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "company_contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"title" text,
	"department" text,
	"profile_photo" text,
	"linkedin_url" text,
	"twitter_url" text,
	"facebook_url" text,
	"bio" text,
	"is_primary" boolean DEFAULT false,
	"tags" text[] DEFAULT ARRAY[]::text[],
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"marketing_consent" boolean DEFAULT false,
	"marketing_consent_at" timestamp,
	"sms_consent" boolean DEFAULT false,
	"sms_consent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_bookmarks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" varchar NOT NULL,
	"content_type" text NOT NULL,
	"content_id" varchar NOT NULL,
	"bookmarked_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "content_pieces" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" varchar NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"body" text,
	"cover_image" text,
	"platform" text,
	"status" text DEFAULT 'pending',
	"slug" text,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text[] DEFAULT ARRAY[]::text[],
	"summary" text,
	"reading_time" integer,
	"ai_generated" boolean DEFAULT false,
	"author_id" varchar,
	"moderated_by" varchar,
	"moderated_at" timestamp,
	"published_at" timestamp DEFAULT now(),
	"sort_order" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "crm_lists" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"crm_type" text NOT NULL,
	"entity_type" text NOT NULL,
	"filters" text DEFAULT '{}' NOT NULL,
	"item_count" integer DEFAULT 0,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deal_activities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar NOT NULL,
	"activity_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"file_url" text,
	"file_type" text,
	"content_status" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deal_line_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"rate" real NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"total" real DEFAULT 0 NOT NULL,
	"notes" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"contact_id" varchar,
	"title" text NOT NULL,
	"description" text,
	"value" real DEFAULT 0,
	"stage" text DEFAULT 'lead' NOT NULL,
	"deal_type" text DEFAULT 'ad_campaign' NOT NULL,
	"priority" text DEFAULT 'medium',
	"probability" integer DEFAULT 50,
	"start_date" timestamp,
	"close_date" timestamp,
	"podcast_id" varchar,
	"product_id" varchar,
	"product_rate" real,
	"product_quantity" integer,
	"notes" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device_push_subscriptions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_email" text,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"preferences" jsonb DEFAULT '{"articles":true,"episodes":true,"breaking":true}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"last_used" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "device_registrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" varchar,
	"platform" text NOT NULL,
	"push_token" text,
	"device_model" text,
	"os_version" text,
	"app_version" text,
	"last_active_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "device_registrations_push_token_unique" UNIQUE("push_token")
);
--> statement-breakpoint
CREATE TABLE "episodes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"podcast_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"duration" text,
	"audio_url" text,
	"video_url" text,
	"thumbnail_url" text,
	"episode_type" text DEFAULT 'audio',
	"transcript" text,
	"transcript_status" text DEFAULT 'pending',
	"extracted_keywords" text[] DEFAULT ARRAY[]::text[],
	"keyword_analysis" text,
	"published_at" timestamp DEFAULT now(),
	"processing_status" text DEFAULT 'pending',
	"processing_progress" integer DEFAULT 0,
	"processing_step" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "hero_slides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"image_url" text NOT NULL,
	"title" text,
	"subtitle" text,
	"link_url" text,
	"link_text" text,
	"display_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "legal_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"version" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" timestamp DEFAULT now(),
	"monthly_revenue" real DEFAULT 0,
	"active_listeners" integer DEFAULT 0,
	"content_pieces_count" integer DEFAULT 0,
	"ad_fill_rate" real DEFAULT 0,
	"avg_cpm" real DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "news_layout_sections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"section_type" text DEFAULT 'list' NOT NULL,
	"content_rule" text DEFAULT 'latest' NOT NULL,
	"content_filters" jsonb DEFAULT '{}'::jsonb,
	"pinned_article_ids" text[] DEFAULT ARRAY[]::text[],
	"display_order" integer DEFAULT 0 NOT NULL,
	"max_items" integer DEFAULT 6,
	"active" boolean DEFAULT true NOT NULL,
	"show_images" boolean DEFAULT true,
	"layout" text DEFAULT 'full_width',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"period" text NOT NULL,
	"cadence" text DEFAULT 'monthly',
	"body" text,
	"content_piece_ids" text[] DEFAULT ARRAY[]::text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"schedule_id" varchar,
	"outbound_campaign_id" varchar,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_schedules" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cadence" text DEFAULT 'weekly' NOT NULL,
	"day_of_week" integer DEFAULT 1,
	"day_of_month" integer DEFAULT 1,
	"send_hour" integer DEFAULT 9,
	"send_minute" integer DEFAULT 0,
	"timezone" text DEFAULT 'America/New_York',
	"active" boolean DEFAULT true NOT NULL,
	"content_types" text[] DEFAULT ARRAY['article','blog','social_post','newsletter']::text[],
	"subject_template" text,
	"intro_template" text,
	"podcast_id" varchar,
	"auto_send" boolean DEFAULT false NOT NULL,
	"last_run_at" timestamp,
	"next_run_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nps_responses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"respondent_email" text,
	"sentiment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "nps_surveys" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar,
	"score" integer NOT NULL,
	"feedback" text,
	"category" varchar(50) DEFAULT 'general',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "obituaries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"photo_url" text,
	"birth_date" text,
	"death_date" text,
	"obituary_text" text,
	"funeral_home" text,
	"service_details" text,
	"tribute_url" text,
	"created_at" timestamp DEFAULT now(),
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "outbound_campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"audience" text NOT NULL,
	"company_id" varchar,
	"status" text DEFAULT 'draft' NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"podcast_filter" varchar,
	"recipient_count" integer DEFAULT 0,
	"sent_count" integer DEFAULT 0,
	"failed_count" integer DEFAULT 0,
	"open_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"bounce_count" integer DEFAULT 0,
	"delivery_rate" real DEFAULT 0,
	"open_rate" real DEFAULT 0,
	"click_to_open_rate" real DEFAULT 0,
	"cadence_type" text DEFAULT 'single',
	"start_date" timestamp,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now(),
	"scheduled_at" timestamp,
	"sent_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_analytics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"url" text NOT NULL,
	"page_title" text,
	"session_id" text NOT NULL,
	"visitor_id" text,
	"ip_address" text,
	"user_agent" text,
	"referrer" text,
	"device_type" text,
	"browser" text,
	"os" text,
	"country" text,
	"region" text,
	"time_on_page" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_rows" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_id" varchar NOT NULL,
	"display_order" integer DEFAULT 0,
	"row_type" text DEFAULT 'content',
	"column_count" integer DEFAULT 1,
	"background_color" text,
	"background_image" text,
	"padding_top" integer DEFAULT 24,
	"padding_bottom" integer DEFAULT 24,
	"css_class" text,
	"visible" boolean DEFAULT true,
	"device_visibility" text DEFAULT 'all',
	"conditions" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"template_type" text DEFAULT 'custom',
	"thumbnail_url" text,
	"rows_config" jsonb DEFAULT '[]'::jsonb,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "page_widgets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"row_id" varchar NOT NULL,
	"page_id" varchar NOT NULL,
	"widget_type" varchar NOT NULL,
	"display_order" integer DEFAULT 0,
	"column_span" integer DEFAULT 1,
	"column_position" integer DEFAULT 0,
	"config" jsonb DEFAULT '{}'::jsonb,
	"title_override" text,
	"visible" boolean DEFAULT true,
	"cache_ttl" integer DEFAULT 300,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_location" text,
	"timezone" text DEFAULT 'America/New_York',
	"date_format" text DEFAULT 'MM/DD/YYYY',
	"default_language" text DEFAULT 'en',
	"auto_publish_content" boolean DEFAULT false,
	"content_types" text[] DEFAULT ARRAY['video_clip','article','social_post','newsletter','seo_asset']::text[],
	"default_platforms" text[] DEFAULT ARRAY['TikTok','Reels','Shorts','X','LinkedIn']::text[],
	"ai_quality" text DEFAULT 'balanced',
	"content_tone" text DEFAULT 'professional',
	"article_word_count" integer DEFAULT 800,
	"social_post_length" text DEFAULT 'medium',
	"max_clip_duration" integer DEFAULT 60,
	"transcription_language" text DEFAULT 'auto',
	"seo_keyword_density" text DEFAULT 'moderate',
	"newsletter_frequency" text DEFAULT 'weekly',
	"content_approval_required" boolean DEFAULT true,
	"email_notifications" boolean DEFAULT true,
	"alert_threshold" text DEFAULT 'all',
	"weekly_digest" boolean DEFAULT true,
	"revenue_alerts" boolean DEFAULT true,
	"processing_alerts" boolean DEFAULT true,
	"crm_alerts" boolean DEFAULT true,
	"system_alerts" boolean DEFAULT true,
	"push_notifications" boolean DEFAULT false,
	"quiet_hours_enabled" boolean DEFAULT false,
	"quiet_hours_start" text DEFAULT '22:00',
	"quiet_hours_end" text DEFAULT '07:00',
	"notification_digest_time" text DEFAULT '09:00',
	"session_timeout_minutes" integer DEFAULT 10080,
	"max_login_attempts" integer DEFAULT 5,
	"require_strong_passwords" boolean DEFAULT true,
	"two_factor_enabled" boolean DEFAULT false,
	"password_expiry_days" integer DEFAULT 0,
	"ip_allowlist" text,
	"audit_log_enabled" boolean DEFAULT true,
	"data_retention_days" integer DEFAULT 365,
	"api_keys_enabled" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "podcasts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"host" text NOT NULL,
	"description" text,
	"cover_image" text,
	"category" text DEFAULT 'Talk',
	"subscribers" integer DEFAULT 0,
	"growth_percent" real DEFAULT 0,
	"multiplication_factor" integer DEFAULT 50,
	"status" text DEFAULT 'active',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" varchar NOT NULL,
	"option_id" text NOT NULL,
	"voter_identifier" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'display_ads' NOT NULL,
	"description" text,
	"rate_model" text DEFAULT 'cpm' NOT NULL,
	"wholesale_rate" real DEFAULT 0 NOT NULL,
	"suggested_retail_rate" real DEFAULT 0 NOT NULL,
	"minimum_rate" real DEFAULT 0,
	"override_threshold_percent" integer DEFAULT 10,
	"fulfillment_requirements" jsonb DEFAULT '[]'::jsonb,
	"deliverables" text,
	"unit_label" text DEFAULT 'impressions',
	"minimum_units" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"sort_order" integer DEFAULT 0,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"type" text DEFAULT 'general',
	"target_audience" text DEFAULT 'all',
	"content_id" varchar,
	"podcast_id" varchar,
	"sent_at" timestamp DEFAULT now(),
	"delivered_count" integer DEFAULT 0,
	"opened_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "read_later_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"content_piece_id" varchar NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scheduled_posts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_piece_id" varchar NOT NULL,
	"platform" text NOT NULL,
	"social_account_id" varchar,
	"scheduled_at" timestamp NOT NULL,
	"published_at" timestamp,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"post_text" text,
	"hashtags" text[] DEFAULT ARRAY[]::text[],
	"media_urls" text[] DEFAULT ARRAY[]::text[],
	"ai_suggestion" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "site_pages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"page_type" text DEFAULT 'custom',
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text[] DEFAULT ARRAY[]::text[],
	"og_image" text,
	"layout_type" text DEFAULT 'full_width',
	"status" text DEFAULT 'draft',
	"is_homepage" boolean DEFAULT false,
	"template_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"published_at" timestamp,
	CONSTRAINT "site_pages_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "social_accounts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"platform" text NOT NULL,
	"account_name" text NOT NULL,
	"account_url" text,
	"access_token" text,
	"refresh_token" text,
	"token_expires_at" timestamp,
	"status" text DEFAULT 'disconnected' NOT NULL,
	"last_posted_at" timestamp,
	"owner_type" text DEFAULT 'company' NOT NULL,
	"podcast_id" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriber_bookmarks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_email" text NOT NULL,
	"article_id" text NOT NULL,
	"article_title" text,
	"article_description" text,
	"cover_image" text,
	"podcast_id" text,
	"podcast_title" text,
	"reading_time" text,
	"published_at" timestamp,
	"saved_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscriber_podcasts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscriber_id" varchar NOT NULL,
	"podcast_id" varchar NOT NULL,
	"subscribed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"country" text,
	"profile_photo" text,
	"linkedin_url" text,
	"twitter_url" text,
	"facebook_url" text,
	"bio" text,
	"title" text,
	"company" text,
	"interests" text[] DEFAULT ARRAY[]::text[],
	"tags" text[] DEFAULT ARRAY[]::text[],
	"notes" text,
	"source" text DEFAULT 'manual',
	"status" text DEFAULT 'active' NOT NULL,
	"marketing_consent" boolean DEFAULT false,
	"marketing_consent_at" timestamp,
	"sms_consent" boolean DEFAULT false,
	"sms_consent_at" timestamp,
	"last_email_opened_at" timestamp,
	"emails_opened_count" integer DEFAULT 0,
	"last_push_clicked_at" timestamp,
	"push_clicked_count" integer DEFAULT 0,
	"last_visit_at" timestamp,
	"visit_count" integer DEFAULT 0,
	"engagement_stage" text DEFAULT 'new',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"actor_id" varchar,
	"actor_name" text,
	"action" text NOT NULL,
	"field" text,
	"from_value" text,
	"to_value" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" varchar NOT NULL,
	"author_id" varchar NOT NULL,
	"author_name" text NOT NULL,
	"content" text NOT NULL,
	"parent_id" varchar,
	"resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" text DEFAULT 'uploaded' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assignee_id" varchar,
	"reviewer_id" varchar,
	"created_by_id" varchar,
	"episode_id" varchar,
	"content_piece_id" varchar,
	"podcast_id" varchar,
	"due_date" timestamp,
	"publish_date" timestamp,
	"estimated_effort" text,
	"tags" text[],
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_feedback" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rating" integer NOT NULL,
	"feedback_text" text,
	"respondent_email" text,
	"page_url" text,
	"sentiment" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"display_name" text,
	"role" text DEFAULT 'viewer' NOT NULL,
	"permissions" text[] DEFAULT ARRAY[]::text[],
	"status" text DEFAULT 'active' NOT NULL,
	"profile_photo" text,
	"banner_image" text,
	"bio" text,
	"title" text,
	"linkedin_url" text,
	"dashboard_widgets" text[] DEFAULT ARRAY['revenue','listeners','content','alerts','trending','processing']::text[],
	"created_at" timestamp DEFAULT now(),
	"last_login_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "nps_surveys" ADD CONSTRAINT "nps_surveys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_creatives_deal_id_idx" ON "ad_creatives" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "ad_creatives_format_idx" ON "ad_creatives" USING btree ("format");--> statement-breakpoint
CREATE INDEX "ai_advertiser_prompts_order_id_idx" ON "ai_advertiser_prompts" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "ai_advertiser_prompts_status_idx" ON "ai_advertiser_prompts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "campaign_performance_order_id_idx" ON "campaign_performance" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "campaigns_deal_id_idx" ON "campaigns" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "campaigns_company_id_idx" ON "campaigns" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "commercial_leads_pipeline_stage_idx" ON "commercial_leads" USING btree ("pipeline_stage");--> statement-breakpoint
CREATE INDEX "commercial_leads_pipeline_type_idx" ON "commercial_leads" USING btree ("pipeline_type");--> statement-breakpoint
CREATE INDEX "commercial_orders_lead_id_idx" ON "commercial_orders" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "commercial_proposals_lead_id_idx" ON "commercial_proposals" USING btree ("lead_id");--> statement-breakpoint
CREATE UNIQUE INDEX "community_likes_post_liker_idx" ON "community_likes" USING btree ("post_id","liker_identifier");--> statement-breakpoint
CREATE INDEX "company_contacts_company_id_idx" ON "company_contacts" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "content_bookmarks_subscriber_idx" ON "content_bookmarks" USING btree ("subscriber_id");--> statement-breakpoint
CREATE INDEX "content_pieces_episode_id_idx" ON "content_pieces" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "content_pieces_status_idx" ON "content_pieces" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_pieces_type_idx" ON "content_pieces" USING btree ("type");--> statement-breakpoint
CREATE INDEX "deal_activities_deal_id_idx" ON "deal_activities" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "deal_line_items_deal_id_idx" ON "deal_line_items" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "deals_company_id_idx" ON "deals" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "deals_stage_idx" ON "deals" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "device_push_subs_endpoint_idx" ON "device_push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "episodes_podcast_id_idx" ON "episodes" USING btree ("podcast_id");--> statement-breakpoint
CREATE INDEX "page_analytics_session_idx" ON "page_analytics" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "page_analytics_created_idx" ON "page_analytics" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "page_analytics_url_idx" ON "page_analytics" USING btree ("url");--> statement-breakpoint
CREATE INDEX "page_rows_page_id_idx" ON "page_rows" USING btree ("page_id");--> statement-breakpoint
CREATE INDEX "page_widgets_row_id_idx" ON "page_widgets" USING btree ("row_id");--> statement-breakpoint
CREATE INDEX "page_widgets_page_id_idx" ON "page_widgets" USING btree ("page_id");--> statement-breakpoint
CREATE UNIQUE INDEX "poll_votes_poll_voter_idx" ON "poll_votes" USING btree ("poll_id","voter_identifier");--> statement-breakpoint
CREATE INDEX "read_later_user_idx" ON "read_later_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "read_later_content_idx" ON "read_later_items" USING btree ("content_piece_id");--> statement-breakpoint
CREATE INDEX "scheduled_posts_content_piece_id_idx" ON "scheduled_posts" USING btree ("content_piece_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriber_bookmarks_email_article_idx" ON "subscriber_bookmarks" USING btree ("subscriber_email","article_id");--> statement-breakpoint
CREATE INDEX "subscriber_bookmarks_email_idx" ON "subscriber_bookmarks" USING btree ("subscriber_email");--> statement-breakpoint
CREATE INDEX "subscriber_podcasts_composite_idx" ON "subscriber_podcasts" USING btree ("subscriber_id","podcast_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscribers_email_idx" ON "subscribers" USING btree ("email");