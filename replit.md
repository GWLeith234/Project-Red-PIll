# MediaTech Empire - AI-Powered Media Platform

## Overview
MediaTech Empire is an AI-powered media platform and monetization engine for managing a podcast network. It provides a command center dashboard for tracking revenue, content multiplication, advertiser management, and audience analytics. The platform uses AI to transform podcast episodes into diverse content formats like video clips, articles, social posts, newsletters, and SEO assets. The project aims to offer a comprehensive solution for content creators and businesses in the podcast industry, maximizing reach and revenue through intelligent automation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript (client-side rendering)
- **Routing**: Wouter
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui (new-york style) built on Radix UI with Tailwind CSS
- **Styling**: Tailwind CSS v4 with CSS variables, light/dark theme support via `.dark` class strategy, `tw-animate-css` for animations
- **Theme System**: Light/dark/system mode via `use-theme.ts` hook. CSS variables in `:root` (light) and `.dark` (dark). ThemeToggle component in sidebar and audience header. Settings page Theme tab for platform default. Inline script in index.html for flash-free loading. Branding table `theme_mode` column stores platform default.
- **Charts**: Recharts for data visualization
- **Build Tool**: Vite
- **Fonts**: Inter (UI), JetBrains Mono (monospace/code), Rajdhani (display headings)
- **Mobile Responsive**: Fully mobile-responsive admin layout with MobileSidebarProvider context, slide-in sidebar overlay on mobile (lg: breakpoint for desktop sidebar), hamburger menu toggle via MobileHeader component, responsive grids/headers/tabs across all pages

### Backend
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Build**: Custom build script using esbuild for server bundling and Vite for client bundling

### Authentication & Authorization
- **Auth**: Session-based authentication using `express-session` + `connect-pg-simple`
- **Password Hashing**: bcryptjs
- **RBAC**: Three roles (admin, editor, viewer) with granular permissions
- **First-time Setup**: Dedicated flow for initial admin account creation
- **Route Protection**: Frontend `PermissionGate` component and backend `requirePermission` middleware

### Core Features
- **Command Center Dashboard**: KPIs, revenue charts, alerts, processing status.
- **Content Factory**: AI content production pipeline including episode processing, multimedia content generation, viral clip factory, content scheduling, social account management, and automated newsletter generation with daily/weekly/monthly cadence scheduling, AI-powered content curation, and auto-send capability.
- **Monetization Engine**: Advertiser management, CPM tracking, revenue breakdown. Products catalog with wholesale/retail rates, override thresholds (permission-based), fulfillment requirements, rate models (CPM/CPC/CPA/flat/per-episode/per-month), and category management. **Ad Resizer Studio** for automated image resizing to 71 ad formats across 10 platforms (Facebook, Instagram, LinkedIn, Twitter/X, TikTok, YouTube, Pinterest, Google Display, Snapchat) using Sharp image processing with SSRF-protected URL fetching.
- **Project Management**: Kanban board with drag-and-drop columns (Uploaded, Transcribed, AI Processed, In Review, Published), task assignment with priorities and due dates, My Tasks dashboard with list and calendar views, threaded comments, and activity audit logs. Replaces Asana for content workflow management.
- **Network Management**: Podcast network and show management.
- **User Management**: Admin CRUD for users with role and permission assignment.
- **Customization**: Branding management (logo, favicon, colors), company name, and hero carousel slide management.
- **Commercial CRM**: B2B sales CRM for companies, contacts, and deals related to ad campaigns. Deals support multi-product line items with per-item rate override threshold enforcement. Deals moving to "closed_won" auto-create campaigns.
- **Subscriber CRM**: Audience management with cross-pollination suggestions. Campaign builder with email cadence designer (timeline-based step sequencing), KPI dashboard (delivery/open/click rates), and email step composer with reordering.
- **Public News/Podcast Directory**: Configurable public-facing news homepage and iHeart-inspired podcast discovery page with search and rankings.
- **Show/Episode Pages**: Unified show hubs and public episode detail pages with media players and related content.
- **AI Content Agent**: Moderation queue for AI-generated stories with editing and approval workflows.
- **Author Profiles**: Public profiles for authors with published articles.
- **Settings**: Comprehensive platform configuration with general (company info, timezone, language), content pipeline (AI quality, tone/style, word counts, clip duration, transcription, SEO density, newsletter frequency, approval requirements), notifications (per-category toggles for email/revenue/processing/CRM/system, push notifications, quiet hours, digest scheduling), security (session timeout, login attempts, password policy with expiry, 2FA, IP allowlist, data retention), audit log viewer with pagination, and API key management (create/revoke/delete with one-time key reveal).
- **Legal Privacy & Compliance**: Legal template management (/legal-admin) with variable substitution ({{COMPANY_NAME}}, {{SUPPORT_EMAIL}}, etc.), seeded TOS and Privacy Policy templates, WCAG 2.2-compliant Cookie Consent Banner with five categories (Strictly Necessary, Functional, Performance, Targeting, Advertising Delivery), IAB TCF-compliant consent storage in localStorage, and Cookie Settings link in public footer. Blog/insights content type with tag system.
- **AI-Powered Page Builder**: Full-featured site builder (/site-builder) with AI layout generation powered by Claude. Dashboard mode shows pages table with ad compliance badges and "Build New Page" wizard (4-step: page type selection, title/prompt, AI generation, review). Editor mode has three-panel layout (widget palette with AI suggestions, canvas with responsive preview, context-sensitive settings panel). 35+ widget types in 5 categories (Content, Podcast, Community, Commerce, Utility). AI features: generate layout from prompt, refine existing layout, widget suggestions, ad placement validation/auto-fix. Ad rules engine enforces min/max ads, spacing between ads, leaderboard requirement. Native HTML5 drag-and-drop, row/widget reordering, per-widget config forms. 8 page type presets (Homepage, Podcast Directory, Show Page, Community Hub, Article Page, Landing Page, Network Landing, Blank). Backend: `server/ai-page-builder.ts` with WIDGET_REGISTRY, PAGE_TYPE_PRESETS, AD_PLACEMENT_RULES, suggestion cache (5-min TTL). API: `/api/ai-page-builder/*` (generate, refine, suggest-widgets, validate-ads, auto-fix-ads, publish-validate, examples CRUD, ad-injection-report). DB tables: `ai_layout_examples`, `ad_injection_log`.
- **Community Content Management**: Tabbed admin interface (/community) for 6 community content types — Events (with approval workflow), Obituaries (publish/unpublish), Classifieds (categories, pricing, expiry), Polls (dynamic options, vote tracking), Business Directory (verification, featuring), and Announcements (wedding, birth, milestone types with approval).
- **Public Platform Infrastructure**: Device registration API for future mobile/web push notifications, content bookmark system for cross-platform saved content, push notification delivery tracking with read/unread status. **Web Push Notifications**: Full PWA push notification system using `web-push` with VAPID keys. `device_push_subscriptions` table stores endpoint/keys/preferences. Public API: `/api/public/vapid-key`, `/api/public/push/subscribe`, `/api/public/push/preferences`, `/api/public/push/unsubscribe`, `/api/public/push/get-preferences`. Service worker handles `push` and `notificationclick` events. Client hook `use-push-notifications.ts` manages subscription lifecycle. AudienceLayout bell icon with subscribe modal and preferences dropdown (articles/episodes/breaking toggles). Auto-triggers on article approve/publish, manual "Send Push" button in ContentFactory. `sendPushToAll()` helper filters by preferences and cleans stale 410 subscriptions.

### Database
- **Database**: PostgreSQL (required)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation
- **Schema**: Defined in `shared/schema.ts`
- **Migrations**: Drizzle Kit
- **IDs**: All IDs are UUIDs generated by PostgreSQL.

### AI Provider Architecture (Five-Role System)
- **Claude (The Brain)**: Anthropic `claude-sonnet-4-5-20250929` — All content generation, analysis, writing, SEO, newsletters, social copy, clip captions. Configured in `server/ai-providers.ts`.
- **Grok (The Eye)**: xAI `grok-imagine-image` + `grok-4-1-fast-reasoning` — Image generation, social listening (x_search), web search, advertiser RAG (Collections API). Uses OpenAI SDK with `https://api.x.ai/v1` baseURL.
- **Whisper (The Ears)**: OpenAI `gpt-4o-mini-transcribe` — Audio/video transcription only. Uses Replit's AI integration.
- **Gemini (The Viewer)**: Google `gemini-2.5-pro` — Video analysis, viral clip detection, editorial images. Uses `@google/generative-ai` SDK.
- **FFmpeg (The Hands)**: Local binary — Video clip extraction, format conversion, 9:16 reframing.
- **Provider Module**: `server/ai-providers.ts` exports `claude`, `openai`, `grok`, `gemini`, `genAI` clients.
- **API Keys**: ANTHROPIC_API_KEY, XAI_API_KEY, GOOGLE_API_KEY (new), AI_INTEGRATIONS_OPENAI_API_KEY (existing).
- **New Endpoints**: `/api/ai/health`, `/api/ai/analyze-video`, `/api/ai/extract-clips`, `/api/ai/social-listen`, `/api/ai/collections/*`.

## External Dependencies

### Required Services
- **PostgreSQL Database**: For all data persistence.

### Key NPM Packages
- **Frontend**: React, Wouter, TanStack React Query, Recharts, Radix UI, shadcn/ui, `react-hook-form`, `date-fns`.
- **Backend**: Express, Drizzle ORM, `pg`, `connect-pg-simple`, `express-session`, `passport`, `zod`, `nanoid`, `ws`, `@anthropic-ai/sdk`, `@google/generative-ai`.
- **Build**: Vite, esbuild, tsx, drizzle-kit.