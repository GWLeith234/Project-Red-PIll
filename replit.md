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
- **Customize** (`/customize`): Branding management for logo, favicon, banner, colors, company name
- **Audience** (`/audience`): Coming soon placeholder
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
- `GET/POST /api/users`, `PATCH/DELETE /api/users/:id` (permission-gated: users.view, users.edit)
- `GET/POST /api/podcasts`, `GET/PATCH/DELETE /api/podcasts/:id`
- `GET/POST /api/episodes`, `GET/PATCH /api/episodes/:id`
- `GET/POST /api/content-pieces`, `PATCH /api/content-pieces/:id`
- `GET/POST /api/advertisers`, `GET/PATCH /api/advertisers/:id`
- `GET/POST /api/campaigns`, `PATCH /api/campaigns/:id`
- `GET /api/metrics/latest`, `POST /api/metrics`
- `GET/POST /api/alerts`, `PATCH /api/alerts/:id`
- `GET/PUT /api/branding`
- `GET/PUT /api/settings` (permission-gated: settings.view, settings.edit)

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema validation
- **Schema location**: `shared/schema.ts` (shared between client and server)
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization
- **Connection**: `pg` (node-postgres) Pool

### Data Models
- **users**: id, username, password, email, displayName, role (admin/editor/viewer), permissions (text array), status (active/inactive), profilePhoto, bio, title, linkedinUrl, dashboardWidgets (text array - toggleable dashboard sections), createdAt, lastLoginAt
- **podcasts**: id, title, host, description, coverImage, subscribers, growthPercent, multiplicationFactor, status
- **episodes**: id, podcastId, title, duration, publishedAt, processingStatus, processingProgress
- **contentPieces**: id, episodeId, type, title, platform, status
- **advertisers**: id, name, monthlySpend, type, status
- **campaigns**: linked to advertisers
- **metrics**: platform-wide KPIs
- **alerts**: system notifications
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