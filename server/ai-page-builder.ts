import { claude } from "./ai-providers";

export interface WidgetDefinition {
  type: string;
  label: string;
  category: "Content" | "Podcast" | "Community" | "Commerce" | "Utility";
  description: string;
  defaultConfig: Record<string, any>;
  configSchema: { key: string; label: string; type: string; options?: string[] }[];
  isAdUnit: boolean;
  minWidth: number;
  previewHeight: number;
}

export const WIDGET_REGISTRY: Record<string, WidgetDefinition> = {
  article_grid: {
    type: "article_grid",
    label: "Article Grid",
    category: "Content",
    description: "Grid of article cards with thumbnails",
    defaultConfig: { columns: 3, showImage: true, showExcerpt: true, limit: 6, category: "" },
    configSchema: [
      { key: "columns", label: "Columns", type: "select", options: ["2", "3", "4"] },
      { key: "limit", label: "Max Articles", type: "number" },
      { key: "category", label: "Category Filter", type: "text" },
      { key: "showImage", label: "Show Images", type: "boolean" },
      { key: "showExcerpt", label: "Show Excerpt", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 6,
    previewHeight: 280,
  },
  article_hero: {
    type: "article_hero",
    label: "Article Hero",
    category: "Content",
    description: "Featured article with large image",
    defaultConfig: { showOverlay: true, height: "400px" },
    configSchema: [
      { key: "showOverlay", label: "Show Text Overlay", type: "boolean" },
      { key: "height", label: "Height", type: "select", options: ["300px", "400px", "500px"] },
    ],
    isAdUnit: false,
    minWidth: 8,
    previewHeight: 400,
  },
  article_list: {
    type: "article_list",
    label: "Article List",
    category: "Content",
    description: "Vertical list of articles with thumbnails",
    defaultConfig: { limit: 10, showDate: true, showAuthor: true },
    configSchema: [
      { key: "limit", label: "Max Articles", type: "number" },
      { key: "showDate", label: "Show Date", type: "boolean" },
      { key: "showAuthor", label: "Show Author", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 320,
  },
  article_carousel: {
    type: "article_carousel",
    label: "Article Carousel",
    category: "Content",
    description: "Scrollable carousel of articles",
    defaultConfig: { autoPlay: true, interval: 5000, limit: 8 },
    configSchema: [
      { key: "autoPlay", label: "Auto Play", type: "boolean" },
      { key: "interval", label: "Interval (ms)", type: "number" },
      { key: "limit", label: "Max Articles", type: "number" },
    ],
    isAdUnit: false,
    minWidth: 8,
    previewHeight: 260,
  },
  category_tabs: {
    type: "category_tabs",
    label: "Category Tabs",
    category: "Content",
    description: "Tabbed content by category",
    defaultConfig: { categories: ["News", "Sports", "Entertainment"], articlesPerTab: 4 },
    configSchema: [
      { key: "articlesPerTab", label: "Articles Per Tab", type: "number" },
    ],
    isAdUnit: false,
    minWidth: 8,
    previewHeight: 300,
  },
  hero_carousel: {
    type: "hero_carousel",
    label: "Hero Carousel",
    category: "Content",
    description: "Full-width hero image slider",
    defaultConfig: { autoPlay: true, interval: 6000, showDots: true },
    configSchema: [
      { key: "autoPlay", label: "Auto Play", type: "boolean" },
      { key: "interval", label: "Interval (ms)", type: "number" },
      { key: "showDots", label: "Show Dots", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 12,
    previewHeight: 400,
  },
  rich_text: {
    type: "rich_text",
    label: "Rich Text Block",
    category: "Content",
    description: "Custom HTML/text content block",
    defaultConfig: { content: "<p>Your content here</p>" },
    configSchema: [
      { key: "content", label: "Content (HTML)", type: "textarea" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 120,
  },
  trending_stories: {
    type: "trending_stories",
    label: "Trending Stories",
    category: "Content",
    description: "List of trending/popular stories",
    defaultConfig: { limit: 5, timeRange: "24h" },
    configSchema: [
      { key: "limit", label: "Max Stories", type: "number" },
      { key: "timeRange", label: "Time Range", type: "select", options: ["24h", "7d", "30d"] },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 240,
  },
  breaking_news: {
    type: "breaking_news",
    label: "Breaking News Ticker",
    category: "Content",
    description: "Scrolling breaking news banner",
    defaultConfig: { speed: "medium", showIcon: true },
    configSchema: [
      { key: "speed", label: "Scroll Speed", type: "select", options: ["slow", "medium", "fast"] },
      { key: "showIcon", label: "Show Alert Icon", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 12,
    previewHeight: 48,
  },
  network_directory: {
    type: "network_directory",
    label: "Network Directory",
    category: "Podcast",
    description: "Browse all shows in the network",
    defaultConfig: { layout: "grid", showDescription: true },
    configSchema: [
      { key: "layout", label: "Layout", type: "select", options: ["grid", "list"] },
      { key: "showDescription", label: "Show Description", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 8,
    previewHeight: 320,
  },
  podcast_carousel: {
    type: "podcast_carousel",
    label: "Podcast Carousel",
    category: "Podcast",
    description: "Scrollable podcast show cards",
    defaultConfig: { limit: 8, showRating: true },
    configSchema: [
      { key: "limit", label: "Max Shows", type: "number" },
      { key: "showRating", label: "Show Ratings", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 8,
    previewHeight: 240,
  },
  episode_feed: {
    type: "episode_feed",
    label: "Episode Feed",
    category: "Podcast",
    description: "Latest episodes from all shows",
    defaultConfig: { limit: 10, showDescription: true, showDuration: true },
    configSchema: [
      { key: "limit", label: "Max Episodes", type: "number" },
      { key: "showDescription", label: "Show Description", type: "boolean" },
      { key: "showDuration", label: "Show Duration", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 6,
    previewHeight: 400,
  },
  player_embed: {
    type: "player_embed",
    label: "Player Embed",
    category: "Podcast",
    description: "Embedded audio player for an episode",
    defaultConfig: { showId: "", episodeId: "", style: "compact" },
    configSchema: [
      { key: "showId", label: "Show ID", type: "text" },
      { key: "episodeId", label: "Episode ID", type: "text" },
      { key: "style", label: "Player Style", type: "select", options: ["compact", "full"] },
    ],
    isAdUnit: false,
    minWidth: 6,
    previewHeight: 120,
  },
  listen_on_badges: {
    type: "listen_on_badges",
    label: "Listen-On Badges",
    category: "Podcast",
    description: "Platform badges (Apple, Spotify, etc.)",
    defaultConfig: { platforms: ["apple", "spotify", "google"], alignment: "center" },
    configSchema: [
      { key: "alignment", label: "Alignment", type: "select", options: ["left", "center", "right"] },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 60,
  },
  host_profile: {
    type: "host_profile",
    label: "Host Profile",
    category: "Podcast",
    description: "Show host bio card",
    defaultConfig: { showSocial: true, showBio: true },
    configSchema: [
      { key: "showSocial", label: "Show Social Links", type: "boolean" },
      { key: "showBio", label: "Show Bio", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 200,
  },
  top_charts: {
    type: "top_charts",
    label: "Top Charts",
    category: "Podcast",
    description: "Top-ranked shows by category",
    defaultConfig: { limit: 10, category: "all" },
    configSchema: [
      { key: "limit", label: "Max Shows", type: "number" },
      { key: "category", label: "Category", type: "text" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 320,
  },
  events_calendar: {
    type: "events_calendar",
    label: "Events Calendar",
    category: "Community",
    description: "Upcoming community events",
    defaultConfig: { layout: "list", limit: 5, showMap: false },
    configSchema: [
      { key: "layout", label: "Layout", type: "select", options: ["list", "calendar", "cards"] },
      { key: "limit", label: "Max Events", type: "number" },
      { key: "showMap", label: "Show Map", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 6,
    previewHeight: 280,
  },
  obituaries: {
    type: "obituaries",
    label: "Obituaries",
    category: "Community",
    description: "Recent obituary listings",
    defaultConfig: { limit: 5, showPhoto: true },
    configSchema: [
      { key: "limit", label: "Max Listings", type: "number" },
      { key: "showPhoto", label: "Show Photo", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 300,
  },
  classifieds: {
    type: "classifieds",
    label: "Classifieds",
    category: "Community",
    description: "Classified ad listings",
    defaultConfig: { limit: 8, showPrice: true, category: "" },
    configSchema: [
      { key: "limit", label: "Max Listings", type: "number" },
      { key: "showPrice", label: "Show Price", type: "boolean" },
      { key: "category", label: "Category Filter", type: "text" },
    ],
    isAdUnit: false,
    minWidth: 6,
    previewHeight: 280,
  },
  weather: {
    type: "weather",
    label: "Weather",
    category: "Community",
    description: "Local weather widget",
    defaultConfig: { location: "", units: "metric", showForecast: true },
    configSchema: [
      { key: "location", label: "Location", type: "text" },
      { key: "units", label: "Units", type: "select", options: ["metric", "imperial"] },
      { key: "showForecast", label: "Show Forecast", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 200,
  },
  community_poll: {
    type: "community_poll",
    label: "Community Poll",
    category: "Community",
    description: "Interactive voting poll",
    defaultConfig: { showResults: true, allowMultiple: false },
    configSchema: [
      { key: "showResults", label: "Show Results", type: "boolean" },
      { key: "allowMultiple", label: "Allow Multiple Votes", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 200,
  },
  announcements: {
    type: "announcements",
    label: "Announcements",
    category: "Community",
    description: "Community announcements board",
    defaultConfig: { limit: 5, types: ["wedding", "birth", "milestone"] },
    configSchema: [
      { key: "limit", label: "Max Announcements", type: "number" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 240,
  },
  ad_banner: {
    type: "ad_banner",
    label: "Ad Banner",
    category: "Commerce",
    description: "Display advertisement banner (leaderboard/rectangle)",
    defaultConfig: { size: "leaderboard", position: "inline", campaignId: "" },
    configSchema: [
      { key: "size", label: "Ad Size", type: "select", options: ["leaderboard", "rectangle", "skyscraper", "billboard"] },
      { key: "position", label: "Position", type: "select", options: ["inline", "sticky-top", "sticky-bottom"] },
      { key: "campaignId", label: "Campaign ID", type: "text" },
    ],
    isAdUnit: true,
    minWidth: 4,
    previewHeight: 100,
  },
  sponsored_content: {
    type: "sponsored_content",
    label: "Sponsored Content",
    category: "Commerce",
    description: "Native ad / sponsored article placement",
    defaultConfig: { label: "Sponsored", showBadge: true, campaignId: "" },
    configSchema: [
      { key: "label", label: "Sponsor Label", type: "text" },
      { key: "showBadge", label: "Show Sponsored Badge", type: "boolean" },
      { key: "campaignId", label: "Campaign ID", type: "text" },
    ],
    isAdUnit: true,
    minWidth: 4,
    previewHeight: 180,
  },
  business_directory: {
    type: "business_directory",
    label: "Business Directory",
    category: "Commerce",
    description: "Local business listings",
    defaultConfig: { limit: 6, showMap: false, category: "" },
    configSchema: [
      { key: "limit", label: "Max Listings", type: "number" },
      { key: "showMap", label: "Show Map", type: "boolean" },
      { key: "category", label: "Category Filter", type: "text" },
    ],
    isAdUnit: false,
    minWidth: 6,
    previewHeight: 280,
  },
  newsletter_signup: {
    type: "newsletter_signup",
    label: "Newsletter Signup",
    category: "Commerce",
    description: "Email subscription form",
    defaultConfig: { title: "Subscribe to our newsletter", buttonText: "Subscribe", showName: false },
    configSchema: [
      { key: "title", label: "Title", type: "text" },
      { key: "buttonText", label: "Button Text", type: "text" },
      { key: "showName", label: "Ask for Name", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 140,
  },
  media_kit_cta: {
    type: "media_kit_cta",
    label: "Media Kit CTA",
    category: "Commerce",
    description: "Advertiser call-to-action button",
    defaultConfig: { text: "Advertise With Us", url: "/media-kit", style: "primary" },
    configSchema: [
      { key: "text", label: "Button Text", type: "text" },
      { key: "url", label: "URL", type: "text" },
      { key: "style", label: "Style", type: "select", options: ["primary", "secondary", "outline"] },
    ],
    isAdUnit: false,
    minWidth: 3,
    previewHeight: 80,
  },
  sidebar_ad: {
    type: "sidebar_ad",
    label: "Sidebar Ad",
    category: "Commerce",
    description: "Sticky sidebar advertisement",
    defaultConfig: { size: "rectangle", sticky: true, campaignId: "" },
    configSchema: [
      { key: "size", label: "Ad Size", type: "select", options: ["rectangle", "half-page"] },
      { key: "sticky", label: "Sticky Position", type: "boolean" },
      { key: "campaignId", label: "Campaign ID", type: "text" },
    ],
    isAdUnit: true,
    minWidth: 3,
    previewHeight: 250,
  },
  image_block: {
    type: "image_block",
    label: "Image Block",
    category: "Utility",
    description: "Static image with optional caption",
    defaultConfig: { src: "", alt: "", caption: "", fit: "cover" },
    configSchema: [
      { key: "src", label: "Image URL", type: "text" },
      { key: "alt", label: "Alt Text", type: "text" },
      { key: "caption", label: "Caption", type: "text" },
      { key: "fit", label: "Fit", type: "select", options: ["cover", "contain", "fill"] },
    ],
    isAdUnit: false,
    minWidth: 3,
    previewHeight: 200,
  },
  social_feed: {
    type: "social_feed",
    label: "Social Feed",
    category: "Utility",
    description: "Embedded social media feed",
    defaultConfig: { platform: "twitter", handle: "", limit: 5 },
    configSchema: [
      { key: "platform", label: "Platform", type: "select", options: ["twitter", "facebook", "instagram"] },
      { key: "handle", label: "Handle/URL", type: "text" },
      { key: "limit", label: "Max Posts", type: "number" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 300,
  },
  divider_spacer: {
    type: "divider_spacer",
    label: "Divider/Spacer",
    category: "Utility",
    description: "Visual separator or whitespace",
    defaultConfig: { style: "line", height: "24px" },
    configSchema: [
      { key: "style", label: "Style", type: "select", options: ["line", "dots", "space"] },
      { key: "height", label: "Height", type: "select", options: ["12px", "24px", "48px", "64px"] },
    ],
    isAdUnit: false,
    minWidth: 12,
    previewHeight: 24,
  },
  search_bar: {
    type: "search_bar",
    label: "Search Bar",
    category: "Utility",
    description: "Site-wide search input",
    defaultConfig: { placeholder: "Search...", showFilter: false },
    configSchema: [
      { key: "placeholder", label: "Placeholder", type: "text" },
      { key: "showFilter", label: "Show Filters", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 60,
  },
  embed: {
    type: "embed",
    label: "Embed (iframe)",
    category: "Utility",
    description: "External content embed via iframe",
    defaultConfig: { url: "", height: "400px", allowFullscreen: true },
    configSchema: [
      { key: "url", label: "Embed URL", type: "text" },
      { key: "height", label: "Height", type: "select", options: ["200px", "300px", "400px", "600px"] },
      { key: "allowFullscreen", label: "Allow Fullscreen", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 4,
    previewHeight: 300,
  },
  navigation_menu: {
    type: "navigation_menu",
    label: "Navigation Menu",
    category: "Utility",
    description: "Site navigation bar",
    defaultConfig: { style: "horizontal", showLogo: true },
    configSchema: [
      { key: "style", label: "Style", type: "select", options: ["horizontal", "vertical", "mega-menu"] },
      { key: "showLogo", label: "Show Logo", type: "boolean" },
    ],
    isAdUnit: false,
    minWidth: 12,
    previewHeight: 60,
  },
  footer: {
    type: "footer",
    label: "Footer",
    category: "Utility",
    description: "Site footer with links and info",
    defaultConfig: { showSocial: true, showNewsletter: true, columns: 4 },
    configSchema: [
      { key: "showSocial", label: "Show Social Links", type: "boolean" },
      { key: "showNewsletter", label: "Show Newsletter", type: "boolean" },
      { key: "columns", label: "Link Columns", type: "select", options: ["2", "3", "4"] },
    ],
    isAdUnit: false,
    minWidth: 12,
    previewHeight: 200,
  },
};

export interface PageTypePreset {
  type: string;
  label: string;
  description: string;
  suggestedWidgets: string[];
  defaultLayout: LayoutRow[];
}

export interface LayoutRow {
  columns: number;
  widgets: { type: string; config?: Record<string, any>; width?: number }[];
}

export const PAGE_TYPE_PRESETS: Record<string, PageTypePreset> = {
  homepage: {
    type: "homepage",
    label: "News Homepage",
    description: "SooToday-style homepage with hero, articles, ads, and community widgets",
    suggestedWidgets: ["hero_carousel", "breaking_news", "article_grid", "article_list", "ad_banner", "trending_stories", "weather", "community_poll", "newsletter_signup"],
    defaultLayout: [
      { columns: 1, widgets: [{ type: "navigation_menu", width: 12 }] },
      { columns: 1, widgets: [{ type: "breaking_news", width: 12 }] },
      { columns: 1, widgets: [{ type: "hero_carousel", width: 12 }] },
      { columns: 2, widgets: [{ type: "article_grid", config: { columns: 3, limit: 6 }, width: 8 }, { type: "ad_banner", config: { size: "rectangle" }, width: 4 }] },
      { columns: 1, widgets: [{ type: "ad_banner", config: { size: "leaderboard" }, width: 12 }] },
      { columns: 2, widgets: [{ type: "trending_stories", width: 4 }, { type: "article_list", config: { limit: 5 }, width: 4 }, { type: "weather", width: 4 }] },
      { columns: 1, widgets: [{ type: "newsletter_signup", width: 12 }] },
      { columns: 1, widgets: [{ type: "footer", width: 12 }] },
    ],
  },
  podcast_directory: {
    type: "podcast_directory",
    label: "Podcast Directory",
    description: "iHeart-style podcast discovery page with search, charts, and categories",
    suggestedWidgets: ["search_bar", "podcast_carousel", "top_charts", "network_directory", "episode_feed", "ad_banner"],
    defaultLayout: [
      { columns: 1, widgets: [{ type: "navigation_menu", width: 12 }] },
      { columns: 1, widgets: [{ type: "search_bar", width: 12 }] },
      { columns: 1, widgets: [{ type: "podcast_carousel", config: { limit: 10 }, width: 12 }] },
      { columns: 2, widgets: [{ type: "top_charts", width: 4 }, { type: "network_directory", config: { layout: "grid" }, width: 8 }] },
      { columns: 1, widgets: [{ type: "ad_banner", config: { size: "leaderboard" }, width: 12 }] },
      { columns: 1, widgets: [{ type: "episode_feed", config: { limit: 20 }, width: 12 }] },
      { columns: 1, widgets: [{ type: "footer", width: 12 }] },
    ],
  },
  show_page: {
    type: "show_page",
    label: "Show Page",
    description: "Individual podcast show page with player, episodes, and host profile",
    suggestedWidgets: ["player_embed", "episode_feed", "host_profile", "listen_on_badges", "ad_banner", "newsletter_signup"],
    defaultLayout: [
      { columns: 1, widgets: [{ type: "navigation_menu", width: 12 }] },
      { columns: 2, widgets: [{ type: "host_profile", width: 4 }, { type: "player_embed", config: { style: "full" }, width: 8 }] },
      { columns: 1, widgets: [{ type: "listen_on_badges", width: 12 }] },
      { columns: 1, widgets: [{ type: "ad_banner", config: { size: "leaderboard" }, width: 12 }] },
      { columns: 1, widgets: [{ type: "episode_feed", config: { limit: 20 }, width: 12 }] },
      { columns: 1, widgets: [{ type: "newsletter_signup", width: 12 }] },
      { columns: 1, widgets: [{ type: "footer", width: 12 }] },
    ],
  },
  community_hub: {
    type: "community_hub",
    label: "Community Hub",
    description: "Community-focused page with events, classifieds, polls, and announcements",
    suggestedWidgets: ["events_calendar", "obituaries", "classifieds", "community_poll", "announcements", "ad_banner", "business_directory"],
    defaultLayout: [
      { columns: 1, widgets: [{ type: "navigation_menu", width: 12 }] },
      { columns: 2, widgets: [{ type: "events_calendar", config: { layout: "calendar" }, width: 8 }, { type: "ad_banner", config: { size: "rectangle" }, width: 4 }] },
      { columns: 2, widgets: [{ type: "community_poll", width: 4 }, { type: "announcements", width: 4 }, { type: "classifieds", config: { limit: 6 }, width: 4 }] },
      { columns: 1, widgets: [{ type: "ad_banner", config: { size: "leaderboard" }, width: 12 }] },
      { columns: 2, widgets: [{ type: "obituaries", width: 6 }, { type: "business_directory", width: 6 }] },
      { columns: 1, widgets: [{ type: "footer", width: 12 }] },
    ],
  },
  article_page: {
    type: "article_page",
    label: "Article/Story Page",
    description: "Article detail page with sidebar ads and related content",
    suggestedWidgets: ["article_hero", "rich_text", "ad_banner", "sidebar_ad", "article_list", "newsletter_signup"],
    defaultLayout: [
      { columns: 1, widgets: [{ type: "navigation_menu", width: 12 }] },
      { columns: 1, widgets: [{ type: "article_hero", width: 12 }] },
      { columns: 2, widgets: [{ type: "rich_text", width: 8 }, { type: "sidebar_ad", config: { sticky: true }, width: 4 }] },
      { columns: 1, widgets: [{ type: "ad_banner", config: { size: "leaderboard" }, width: 12 }] },
      { columns: 1, widgets: [{ type: "article_list", config: { limit: 4 }, width: 12 }] },
      { columns: 1, widgets: [{ type: "newsletter_signup", width: 12 }] },
      { columns: 1, widgets: [{ type: "footer", width: 12 }] },
    ],
  },
  landing_page: {
    type: "landing_page",
    label: "Landing Page",
    description: "Marketing landing page for the network",
    suggestedWidgets: ["hero_carousel", "podcast_carousel", "article_carousel", "media_kit_cta", "newsletter_signup"],
    defaultLayout: [
      { columns: 1, widgets: [{ type: "navigation_menu", width: 12 }] },
      { columns: 1, widgets: [{ type: "hero_carousel", width: 12 }] },
      { columns: 1, widgets: [{ type: "podcast_carousel", width: 12 }] },
      { columns: 1, widgets: [{ type: "article_carousel", width: 12 }] },
      { columns: 2, widgets: [{ type: "media_kit_cta", width: 6 }, { type: "newsletter_signup", width: 6 }] },
      { columns: 1, widgets: [{ type: "footer", width: 12 }] },
    ],
  },
  network_landing: {
    type: "network_landing",
    label: "Network Landing",
    description: "Cumulus-style network overview with all shows and branding",
    suggestedWidgets: ["hero_carousel", "network_directory", "podcast_carousel", "episode_feed", "ad_banner", "social_feed"],
    defaultLayout: [
      { columns: 1, widgets: [{ type: "navigation_menu", width: 12 }] },
      { columns: 1, widgets: [{ type: "hero_carousel", width: 12 }] },
      { columns: 1, widgets: [{ type: "network_directory", config: { layout: "grid" }, width: 12 }] },
      { columns: 1, widgets: [{ type: "ad_banner", config: { size: "leaderboard" }, width: 12 }] },
      { columns: 2, widgets: [{ type: "episode_feed", config: { limit: 10 }, width: 8 }, { type: "social_feed", width: 4 }] },
      { columns: 1, widgets: [{ type: "footer", width: 12 }] },
    ],
  },
  blank: {
    type: "blank",
    label: "Blank Page",
    description: "Start from scratch with an empty canvas",
    suggestedWidgets: [],
    defaultLayout: [],
  },
};

export interface AdPlacementRules {
  minAdsPerPage: number;
  maxAdsPerPage: number;
  contentRowsPerAd: number;
  requireSidebarAd: boolean;
  requireLeaderboard: boolean;
  firstAdMaxPosition: number;
  adTypes: string[];
}

export const DEFAULT_AD_RULES: AdPlacementRules = {
  minAdsPerPage: 1,
  maxAdsPerPage: 6,
  contentRowsPerAd: 3,
  requireSidebarAd: false,
  requireLeaderboard: true,
  firstAdMaxPosition: 4,
  adTypes: ["ad_banner", "sponsored_content", "sidebar_ad"],
};

export interface AdValidationResult {
  isValid: boolean;
  violations: string[];
  adCount: number;
  suggestions: string[];
}

export function validateAdPlacements(
  layout: LayoutRow[],
  rules: AdPlacementRules = DEFAULT_AD_RULES
): AdValidationResult {
  const violations: string[] = [];
  const suggestions: string[] = [];
  let adCount = 0;
  let lastAdRow = -1;
  let hasLeaderboard = false;
  let hasSidebarAd = false;

  layout.forEach((row, idx) => {
    row.widgets.forEach((w) => {
      const def = WIDGET_REGISTRY[w.type];
      if (def?.isAdUnit) {
        adCount++;
        if (lastAdRow >= 0 && idx - lastAdRow < rules.contentRowsPerAd) {
          violations.push(`Ads in rows ${lastAdRow + 1} and ${idx + 1} are too close (min ${rules.contentRowsPerAd} content rows between ads)`);
        }
        lastAdRow = idx;
        if (w.type === "ad_banner" && w.config?.size === "leaderboard") hasLeaderboard = true;
        if (w.type === "sidebar_ad") hasSidebarAd = true;
      }
    });
  });

  if (adCount < rules.minAdsPerPage) {
    violations.push(`Page has ${adCount} ad(s), minimum required is ${rules.minAdsPerPage}`);
    suggestions.push("Add an ad_banner widget to meet minimum ad requirements");
  }
  if (adCount > rules.maxAdsPerPage) {
    violations.push(`Page has ${adCount} ad(s), maximum allowed is ${rules.maxAdsPerPage}`);
  }
  if (rules.requireLeaderboard && !hasLeaderboard) {
    violations.push("Page requires at least one leaderboard ad banner");
    suggestions.push("Add an ad_banner with size 'leaderboard' to a full-width row");
  }
  if (rules.requireSidebarAd && !hasSidebarAd) {
    violations.push("Page requires at least one sidebar ad");
    suggestions.push("Add a sidebar_ad widget to a multi-column row");
  }

  const firstAdIdx = layout.findIndex((row) =>
    row.widgets.some((w) => WIDGET_REGISTRY[w.type]?.isAdUnit)
  );
  if (firstAdIdx > rules.firstAdMaxPosition) {
    violations.push(`First ad appears at row ${firstAdIdx + 1}, should be within first ${rules.firstAdMaxPosition} rows`);
  }

  return {
    isValid: violations.length === 0,
    violations,
    adCount,
    suggestions,
  };
}

export function enforceAdPlacements(
  layout: LayoutRow[],
  rules: AdPlacementRules = DEFAULT_AD_RULES
): { layout: LayoutRow[]; injectedCount: number; changes: string[] } {
  const result = [...layout.map((r) => ({ ...r, widgets: [...r.widgets] }))];
  const changes: string[] = [];
  let injectedCount = 0;

  const validation = validateAdPlacements(result, rules);
  if (validation.isValid) return { layout: result, injectedCount: 0, changes: [] };

  const adCount = validation.adCount;
  const hasLeaderboard = result.some((r) =>
    r.widgets.some((w) => w.type === "ad_banner" && w.config?.size === "leaderboard")
  );

  if (adCount < rules.minAdsPerPage && rules.requireLeaderboard && !hasLeaderboard) {
    const insertIdx = Math.min(rules.firstAdMaxPosition, result.length);
    result.splice(insertIdx, 0, {
      columns: 1,
      widgets: [{ type: "ad_banner", config: { size: "leaderboard" }, width: 12 }],
    });
    changes.push(`Inserted leaderboard ad at row ${insertIdx + 1}`);
    injectedCount++;
  } else if (adCount < rules.minAdsPerPage) {
    const insertIdx = Math.min(rules.firstAdMaxPosition, result.length);
    result.splice(insertIdx, 0, {
      columns: 1,
      widgets: [{ type: "ad_banner", config: { size: "leaderboard" }, width: 12 }],
    });
    changes.push(`Inserted ad banner at row ${insertIdx + 1}`);
    injectedCount++;
  }

  if (rules.requireSidebarAd) {
    const hasSidebar = result.some((r) =>
      r.widgets.some((w) => w.type === "sidebar_ad")
    );
    if (!hasSidebar) {
      const multiColRow = result.findIndex((r) => r.columns >= 2 && r.widgets.length < 3);
      if (multiColRow >= 0) {
        result[multiColRow].widgets.push({ type: "sidebar_ad", config: { sticky: true }, width: 4 });
        const mainWidget = result[multiColRow].widgets[0];
        if (mainWidget.width && mainWidget.width > 8) mainWidget.width = 8;
        changes.push(`Added sidebar ad to row ${multiColRow + 1}`);
        injectedCount++;
      }
    }
  }

  return { layout: result, injectedCount, changes };
}

const suggestionCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCachedSuggestion(key: string): any | null {
  const entry = suggestionCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  if (entry) suggestionCache.delete(key);
  return null;
}

function setCachedSuggestion(key: string, data: any): void {
  suggestionCache.set(key, { data, timestamp: Date.now() });
}

export async function generateAIPageLayout(
  pageType: string,
  prompt: string,
  existingContent?: { articles?: number; shows?: number; episodes?: number; events?: number }
): Promise<{ layout: LayoutRow[]; reasoning: string }> {
  const preset = PAGE_TYPE_PRESETS[pageType];
  const widgetList = Object.values(WIDGET_REGISTRY)
    .map((w) => `- ${w.type}: ${w.description} (category: ${w.category}, isAd: ${w.isAdUnit})`)
    .join("\n");

  const cacheKey = `generate:${pageType}:${prompt}`;
  const cached = getCachedSuggestion(cacheKey);
  if (cached) return cached;

  const systemPrompt = `You are an AI page layout generator for a media platform. Generate page layouts using the available widgets.

Available widgets:
${widgetList}

Ad placement rules:
- Minimum 1 ad per page
- Maximum 6 ads per page
- At least 3 content rows between ads
- First ad should appear within first 4 rows
- Include at least one leaderboard ad (ad_banner with size "leaderboard")

Layout format: Each row has "columns" (1-3) and "widgets" array. Each widget has "type", optional "config", and "width" (out of 12-column grid).

${preset ? `Page type "${pageType}" suggested widgets: ${preset.suggestedWidgets.join(", ")}` : ""}

${existingContent ? `Available content: ${JSON.stringify(existingContent)}` : ""}

Return ONLY valid JSON: { "layout": [...rows], "reasoning": "explanation" }`;

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: "user", content: `Generate a ${pageType} page layout. Requirements: ${prompt}` }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      setCachedSuggestion(cacheKey, parsed);
      return parsed;
    }
  } catch (error: any) {
    console.error("AI layout generation failed:", error.message);
  }

  if (preset) {
    return {
      layout: preset.defaultLayout,
      reasoning: `Used default ${preset.label} template (AI generation unavailable)`,
    };
  }

  return {
    layout: PAGE_TYPE_PRESETS.homepage.defaultLayout,
    reasoning: "Used default homepage template as fallback",
  };
}

export async function refineAIPageLayout(
  currentLayout: LayoutRow[],
  instruction: string
): Promise<{ layout: LayoutRow[]; reasoning: string; changes: string[] }> {
  const widgetList = Object.values(WIDGET_REGISTRY)
    .map((w) => `- ${w.type}: ${w.description} (category: ${w.category}, isAd: ${w.isAdUnit})`)
    .join("\n");

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4000,
      system: `You are an AI layout editor. Modify the given page layout based on instructions.

Available widgets:
${widgetList}

Current layout:
${JSON.stringify(currentLayout, null, 2)}

Ad rules: min 1 ad, max 6, 3 content rows between ads, leaderboard required.

Return ONLY valid JSON: { "layout": [...], "reasoning": "...", "changes": ["change1", "change2"] }`,
      messages: [{ role: "user", content: instruction }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch (error: any) {
    console.error("AI layout refinement failed:", error.message);
  }

  return {
    layout: currentLayout,
    reasoning: "Unable to refine layout (AI unavailable)",
    changes: [],
  };
}

export async function suggestWidgets(
  currentLayout: LayoutRow[],
  pageType: string
): Promise<{ suggestions: { type: string; reason: string; position: string }[] }> {
  const cacheKey = `suggest:${pageType}:${currentLayout.length}`;
  const cached = getCachedSuggestion(cacheKey);
  if (cached) return cached;

  const currentWidgets = currentLayout.flatMap((r) => r.widgets.map((w) => w.type));
  const preset = PAGE_TYPE_PRESETS[pageType];
  const missing = preset
    ? preset.suggestedWidgets.filter((w) => !currentWidgets.includes(w))
    : [];

  const suggestions = missing.slice(0, 5).map((type) => {
    const def = WIDGET_REGISTRY[type];
    return {
      type,
      reason: def ? `${def.description} — recommended for ${pageType} pages` : "Recommended widget",
      position: "bottom",
    };
  });

  const result = { suggestions };
  setCachedSuggestion(cacheKey, result);
  return result;
}

export function getContentInventory(): {
  widgetCount: number;
  categories: { name: string; count: number }[];
  adWidgets: string[];
  allTypes: string[];
} {
  const widgets = Object.values(WIDGET_REGISTRY);
  const categories: Record<string, number> = {};
  const adWidgets: string[] = [];

  widgets.forEach((w) => {
    categories[w.category] = (categories[w.category] || 0) + 1;
    if (w.isAdUnit) adWidgets.push(w.type);
  });

  return {
    widgetCount: widgets.length,
    categories: Object.entries(categories).map(([name, count]) => ({ name, count })),
    adWidgets,
    allTypes: widgets.map((w) => w.type),
  };
}
