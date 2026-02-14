# MediaTech Empire - AI-Powered Media Platform

## Overview

MediaTech Empire is an AI-powered media platform and monetization engine designed for managing a podcast network. It provides a command center dashboard for tracking revenue, content multiplication, advertiser management, and audience analytics. The platform takes podcast episodes and uses AI to multiply them into various content formats (video clips, articles, social posts, newsletters, SEO assets).

The application follows a full-stack TypeScript architecture with a React frontend and Express backend, backed by PostgreSQL via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript (non-RSC, client-side rendering)
- **Routing**: Wouter (lightweight client-side router)
- **State Management**: TanStack React Query for server state; no global client state library
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS v4 with CSS variables for theming (dark theme by default with HSL color system), `tw-animate-css` for animations
- **Charts**: Recharts for data visualization (area charts, bar charts, pie charts)
- **Build Tool**: Vite with React plugin, Tailwind CSS vite plugin
- **Fonts**: Inter (UI), JetBrains Mono (monospace/code), Rajdhani (display headings)
- **Path Aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Pages
- **Login** (`/login`): Authentication page with first-time admin setup flow
- **Dashboard** (`/`): Command Center with KPI cards, revenue charts, alerts, processing status
- **Content Factory** (`/content`): AI content multiplication pipeline showing episode processing stages
- **Monetization** (`/monetization`): Revenue engine with advertiser management, CPM tracking, revenue breakdown
- **Network** (`/network`): Podcast network management with show cards
- **User Management** (`/users`): Admin user CRUD with role assignment and permission toggles
- **Customize** (`/customize`): Branding management for logo, favicon, banner, colors, company name, and hero carousel slide management (upload images, set titles/subtitles/links, reorder, enable/disable)
- **Commercial CRM** (`/sales`): B2B sales CRM with Companies, Contacts, and Deals pipeline management for ad campaigns and sponsorships
- **Subscriber CRM** (`/audience`): Subscriber audience management with smart cross-pollination suggestions
- **Podcast Directory** (`/podcasts`): iHeart-inspired podcast discovery page with visual show cards grid, search, featured shows, numbered rankings, and subscriber counts
- **Show Detail** (`/show/:podcastId`): Unified show hub with hero header, tabbed Episodes/Articles/About sections, audio/video type badges, and subscriber widgets
- **Episode Page** (`/listen/:podcastId/episode/:episodeId`): Public episode detail page with video player (for video/both episodes), audio player UI, type badges, related content, and subscriber capture widgets
- **AI Content Agent** (`/moderation`): Moderation queue for AI-generated stories with preview, edit, approve/reject workflow, and manual story generation dialog
- **Author Profile** (`/author/:authorId`): Public-facing author profile page showing bio, photo, social links, and list of published articles
- **Analytics** (`/analytics`): Coming soon placeholder
- **Settings** (`/settings`): Platform configuration with general, content pipeline, notifications, and security sections

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript, executed via `tsx` in development
- **API Pattern**: RESTful JSON API under `/api/` prefix with CRUD endpoints for all entities
- **Development**: Vite dev server integrated as middleware for HMR; in production, static files served from `dist/public`
- **Build**: Custom build script using esbuild for server bundling and Vite for client bundling; output is a single CJS file at `dist/index.cjs`
- **Logging**: Custom request logger for API routes with timing information

### Authentication & Authorization
- **Auth**: Session-based authentication using express-session + connect-pg-simple (PostgreSQL session store)
- **Password Hashing**: bcryptjs with 10 rounds
- **Session Security**: Secure cookies in production, SESSION_SECRET required in production
- **RBAC**: Three roles (admin, editor, viewer) with granular permissions (dashboard.view, content.view, content.edit, etc.)
- **First-time Setup**: `/api/auth/setup` creates the first admin account when no users exist
- **Auth Context**: React AuthProvider (client/src/lib/auth.tsx) manages login state, permission checks
- **Route Protection**: Frontend PermissionGate component blocks unauthorized page access; backend requirePermission middleware blocks unauthorized API access

### API Endpoints
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/check-setup`, `POST /api/auth/setup`
- `GET/PATCH /api/profile` (auth-gated: user's own profile with photo, bio, title, LinkedIn URL, dashboard widgets)
- `POST /api/profile/analyze-linkedin` (auth-gated: scrapes LinkedIn profile OG tags to extract photo, name, title, bio)
- `GET/POST /api/subscribers`, `GET/PATCH/DELETE /api/subscribers/:id` (permission-gated: audience.view)
- `POST/DELETE /api/subscribers/:id/podcasts/:podcastId` (manage podcast subscriptions)
- `POST /api/subscribers/analyze-social` (auth-gated: scrapes LinkedIn/X/Facebook profiles for photo, name, title)
- `GET /api/subscribers/:id/suggestions` (smart cross-pollination: ranks unsubscribed podcasts by interest match)
- `POST /api/public/subscribe` (no auth: visitor subscription from story/episode pages, deduplicates by email)
- `GET /api/public/episodes/:id` (no auth: public episode detail with podcast and content pieces)
- `GET /api/public/podcasts/:podcastId/episodes` (no auth: published episodes listing for a podcast)
- `GET /api/public/shows/:podcastId` (no auth: unified show detail with podcast info, episodes with video fields, and articles)
- `GET /api/public/authors/:id` (no auth: author profile with published articles, only active users)
- `POST /api/companies/analyze-website` (permission-gated: sales.edit - scrapes company website for name, logo, phone, address, slogan, timezone, brand colors, etc.)
- `GET/POST /api/companies`, `GET/PATCH/DELETE /api/companies/:id` (permission-gated: sales.view, sales.edit)
- `GET/POST /api/contacts`, `GET/PATCH/DELETE /api/contacts/:id` (permission-gated: sales.view, sales.edit)
- `GET/POST /api/deals`, `GET/PATCH/DELETE /api/deals/:id` (permission-gated: sales.view, sales.edit)
- `GET/POST /api/deals/:dealId/activities`, `PATCH/DELETE /api/deal-activities/:id` (permission-gated: sales.view, sales.edit)
- `GET/POST /api/users`, `PATCH/DELETE /api/users/:id` (permission-gated: users.view, users.edit)
- `GET/POST /api/podcasts`, `GET/PATCH/DELETE /api/podcasts/:id`
- `GET/POST /api/episodes`, `GET/PATCH /api/episodes/:id`
- `GET/POST /api/content-pieces`, `PATCH /api/content-pieces/:id`
- `GET/POST /api/advertisers`, `GET/PATCH /api/advertisers/:id`
- `GET/POST /api/campaigns`, `PATCH /api/campaigns/:id`
- `GET /api/metrics/latest`, `POST /api/metrics`
- `GET/POST /api/alerts`, `PATCH /api/alerts/:id`
- `GET/PUT /api/branding`
- `GET/POST /api/hero-slides`, `PATCH/DELETE /api/hero-slides/:id` (permission-gated: customize.view, customize.edit)
- `GET /api/public/hero-slides` (no auth: active hero carousel slides for public homepage)
- `GET/PUT /api/settings` (permission-gated: settings.view, settings.edit)
- `GET/POST /api/outbound-campaigns`, `GET/PATCH/DELETE /api/outbound-campaigns/:id` (auth-gated: campaign CRUD with audience filter)
- `GET /api/outbound-campaigns/:id/recipients` (auth-gated: preview consented recipients)
- `POST /api/outbound-campaigns/:id/send` (auth-gated: sends campaign to consented recipients via SendGrid/Twilio)

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation
- **Schema location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Connection**: `pg` (node-postgres) Pool

### Data Models
- **users**: id, username, password, email, displayName, role (admin/editor/viewer), permissions (text array), status (active/inactive), profilePhoto, bio, title, linkedinUrl, dashboardWidgets (text array - toggleable dashboard sections), createdAt, lastLoginAt
- **subscribers**: id, firstName, lastName, email, phone, address, city, state, zip, country, profilePhoto, linkedinUrl, twitterUrl, facebookUrl, bio, title, company, interests (text array), tags (text array), notes, source, status, marketingConsent, marketingConsentAt, smsConsent, smsConsentAt, createdAt, updatedAt
- **subscriberPodcasts**: id, subscriberId, podcastId, subscribedAt (join table for subscriber-podcast relationships)
- **companies**: id, name, industry, website, phone, email, address, city, state, zip, country, logo, description, slogan, timezone, brandColors (text array), annualRevenue, employeeCount, companyType (advertiser/sponsor/partner), status, notes, createdAt, updatedAt
- **companyContacts**: id, companyId, firstName, lastName, email, phone, title, department, profilePhoto, linkedinUrl, twitterUrl, facebookUrl, bio, isPrimary, tags (text array), notes, status, marketingConsent, marketingConsentAt, smsConsent, smsConsentAt, createdAt, updatedAt
- **deals**: id, companyId, contactId, title, description, value, stage (lead/qualified/proposal/negotiation/closed_won/closed_lost), dealType (ad_campaign/sponsorship/partnership), priority, probability, startDate, closeDate, podcastId, notes, status, createdAt, updatedAt
- **dealActivities**: id, dealId, activityType (note/call/meeting/email/content_upload), title, description, fileUrl, fileType, contentStatus (draft/review/approved/live), createdBy, createdAt
- **podcasts**: id, title, host, description, coverImage, subscribers, growthPercent, multiplicationFactor, status
- **episodes**: id, podcastId, title, description, duration, audioUrl, videoUrl, thumbnailUrl, episodeType (audio/video/both), transcript, transcriptStatus, publishedAt, processingStatus, processingProgress
- **contentPieces**: id, episodeId, type, title, platform, status
- **advertisers**: id, name, monthlySpend, type, status
- **campaigns**: linked to advertisers
- **metrics**: platform-wide KPIs
- **alerts**: system notifications
- **outboundCampaigns**: id, name, type (email/sms), audience (subscribers/contacts), status (draft/sending/sent/failed), subject, body, podcastFilter, recipientCount, sentCount, failedCount, createdBy, createdAt, scheduledAt, sentAt
- **platformSettings**: timezone, dateFormat, defaultLanguage, autoPublishContent, contentTypes (array), defaultPlatforms (array), aiQuality, emailNotifications, alertThreshold, weeklyDigest, revenueAlerts, processingAlerts, sessionTimeoutMinutes, maxLoginAttempts, requireStrongPasswords, twoFactorEnabled, updatedAt

### Storage Layer
- Single `storage` object in `server/storage.ts` implementing the `IStorage` interface
- Direct Drizzle queries against PostgreSQL
- All IDs are UUIDs generated by PostgreSQL (`gen_random_uuid()`)

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connected via `DATABASE_URL` environment variable. Used for all data persistence through Drizzle ORM.

### Key NPM Packages
- **Frontend**: React, Wouter, TanStack React Query, Recharts, Radix UI (full suite), shadcn/ui components, embla-carousel-react, react-hook-form, date-fns, cmdk, vaul (drawer), react-day-picker, react-resizable-panels, input-otp
- **Backend**: Express 5, Drizzle ORM, pg (node-postgres), connect-pg-simple, express-session, passport, passport-local, zod, nanoid, ws (WebSockets)
- **Build**: Vite, esbuild, tsx, drizzle-kit
- **Replit-specific**: @replit/vite-plugin-runtime-error-modal, @replit/vite-plugin-cartographer (dev only), @replit/vite-plugin-dev-banner (dev only)

### Noted but Potentially Unused Dependencies
The build script allowlist suggests planned integrations with: OpenAI, Google Generative AI, Stripe, Nodemailer, Multer, XLSX, Axios, JSON Web Tokens — these are bundled for production but may not all be actively used yet.