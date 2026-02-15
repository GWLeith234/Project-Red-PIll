import { db } from "./storage";
import { pageTemplates } from "@shared/schema";

async function seedPageTemplates() {
  console.log("Checking for existing page templates...");

  const existing = await db.select().from(pageTemplates);

  if (existing.length > 0) {
    console.log(`Found ${existing.length} existing page templates. Skipping seed.`);
    process.exit(0);
  }

  console.log("Inserting page templates...");

  await db.insert(pageTemplates).values([
    {
      name: "SooToday-Style Homepage",
      description: "A local news homepage inspired by SooToday with hero carousel, article grids, community sections, and local business directory.",
      templateType: "homepage",
      isDefault: true,
      rowsConfig: [
        {
          displayOrder: 0,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "hero_carousel",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Top Stories",
              config: { autoAdvance: true, interval: 6000, height: "tall", showOverlay: true, maxSlides: 5 },
            },
          ],
        },
        {
          displayOrder: 1,
          rowType: "content",
          columnCount: 3,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "article_grid",
              displayOrder: 0,
              columnSpan: 2,
              columnPosition: 0,
              titleOverride: "Latest News",
              config: { contentRule: "latest", maxItems: 8, columns: 2, showImages: true, showSummary: true, showAuthor: true, showDate: true },
            },
            {
              widgetType: "weather",
              displayOrder: 1,
              columnSpan: 1,
              columnPosition: 2,
              titleOverride: "Local Weather",
              config: { units: "fahrenheit", showForecast: true, forecastDays: 5, showHumidity: true, showWind: true },
            },
          ],
        },
        {
          displayOrder: 2,
          rowType: "content",
          columnCount: 1,
          backgroundColor: "#f0fdf4",
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "article_grid",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Good News",
              config: { contentRule: "category", category: "good_news", maxItems: 4, columns: 4, showImages: true, showSummary: false, cardStyle: "compact" },
            },
          ],
        },
        {
          displayOrder: 3,
          rowType: "content",
          columnCount: 3,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "episode_feed",
              displayOrder: 0,
              columnSpan: 2,
              columnPosition: 0,
              titleOverride: "Latest Episodes",
              config: { maxItems: 6, showDescription: true, showDuration: true, showPodcastName: true, layout: "list" },
            },
            {
              widgetType: "ad_banner",
              displayOrder: 1,
              columnSpan: 1,
              columnPosition: 2,
              titleOverride: null,
              config: { placement: "sidebar", size: "300x250", refreshInterval: 30000 },
            },
          ],
        },
        {
          displayOrder: 4,
          rowType: "content",
          columnCount: 2,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "events_calendar",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Upcoming Events",
              config: { maxItems: 5, showDate: true, showLocation: true, showCategory: true, layout: "list" },
            },
            {
              widgetType: "obituaries",
              displayOrder: 1,
              columnSpan: 1,
              columnPosition: 1,
              titleOverride: "Obituaries",
              config: { maxItems: 6, showPhoto: true, showDates: true, layout: "compact" },
            },
          ],
        },
        {
          displayOrder: 5,
          rowType: "content",
          columnCount: 2,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "business_directory",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Local Business Directory",
              config: { maxItems: 8, showLogo: true, showCategory: true, showPhone: true, layout: "grid", columns: 2 },
            },
            {
              widgetType: "newsletter_signup",
              displayOrder: 1,
              columnSpan: 1,
              columnPosition: 1,
              titleOverride: "Stay Connected",
              config: { style: "inline", buttonText: "Subscribe", showNameField: true, showDescription: true, description: "Get the latest local news delivered to your inbox." },
            },
          ],
        },
        {
          displayOrder: 6,
          rowType: "content",
          columnCount: 1,
          backgroundColor: "#fffbeb",
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "article_grid",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Village Picks",
              config: { contentRule: "featured", maxItems: 6, columns: 3, showImages: true, showSummary: true, showAuthor: false, cardStyle: "featured" },
            },
          ],
        },
      ],
    },
    {
      name: "iHeart Podcast Directory",
      description: "A podcast discovery page modeled after iHeart with category tabs, carousels, and a full directory grid.",
      templateType: "podcast_directory",
      isDefault: false,
      rowsConfig: [
        {
          displayOrder: 0,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "category_tabs",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Browse by Category",
              config: { categories: ["All", "News", "Comedy", "True Crime", "Business", "Sports", "Health", "Technology"], style: "pills", scrollable: true },
            },
          ],
        },
        {
          displayOrder: 1,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "podcast_carousel",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Popular Podcasts",
              config: { contentRule: "popular", maxItems: 12, showRank: true, showSubscribers: true, autoScroll: false, itemsPerView: 6 },
            },
          ],
        },
        {
          displayOrder: 2,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "podcast_carousel",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Featured Podcasts",
              config: { contentRule: "featured", maxItems: 10, showDescription: true, showCategory: true, autoScroll: true, scrollInterval: 5000, itemsPerView: 4 },
            },
          ],
        },
        {
          displayOrder: 3,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "ad_banner",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: null,
              config: { placement: "leaderboard", size: "728x90", backgroundColor: "#f8f9fa" },
            },
          ],
        },
        {
          displayOrder: 4,
          rowType: "content",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "podcast_grid",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "All Podcasts",
              config: { contentRule: "all", columns: 4, showDescription: true, showCategory: true, showSubscribers: true, showEpisodeCount: true, sortBy: "title", paginated: true, pageSize: 20 },
            },
          ],
        },
      ],
    },
    {
      name: "Cumulus Show Page",
      description: "A single show detail page inspired by Cumulus with hero, listen-on badges, episode feed, host profile, and related shows.",
      templateType: "show_detail",
      isDefault: false,
      rowsConfig: [
        {
          displayOrder: 0,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 0,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "show_hero",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: null,
              config: { showCoverArt: true, showDescription: true, showHost: true, showCategory: true, showSubscribeButton: true, overlayGradient: true },
            },
          ],
        },
        {
          displayOrder: 1,
          rowType: "content",
          columnCount: 1,
          paddingTop: 16,
          paddingBottom: 16,
          widgets: [
            {
              widgetType: "listen_on_badges",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Listen On",
              config: { platforms: ["apple_podcasts", "spotify", "google_podcasts", "amazon_music", "iheart", "overcast", "pocket_casts"], style: "badges", size: "medium" },
            },
          ],
        },
        {
          displayOrder: 2,
          rowType: "content",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "episode_feed",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Latest Episodes",
              config: { maxItems: 10, showDescription: true, showDuration: true, showPublishDate: true, showPlayButton: true, layout: "list", sortBy: "newest" },
            },
          ],
        },
        {
          displayOrder: 3,
          rowType: "content",
          columnCount: 3,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "host_profile",
              displayOrder: 0,
              columnSpan: 2,
              columnPosition: 0,
              titleOverride: "About the Host",
              config: { showPhoto: true, showBio: true, showSocialLinks: true, showTitle: true },
            },
            {
              widgetType: "ad_banner",
              displayOrder: 1,
              columnSpan: 1,
              columnPosition: 2,
              titleOverride: null,
              config: { placement: "sidebar", size: "300x250", refreshInterval: 30000 },
            },
          ],
        },
        {
          displayOrder: 4,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "podcast_carousel",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "More Shows You Might Like",
              config: { contentRule: "related", maxItems: 8, showDescription: false, showCategory: true, autoScroll: false, itemsPerView: 4 },
            },
          ],
        },
        {
          displayOrder: 5,
          rowType: "content",
          columnCount: 1,
          paddingTop: 16,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "tags",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Tags",
              config: { style: "chips", clickable: true, showCount: false, maxTags: 15 },
            },
          ],
        },
      ],
    },
    {
      name: "Community Events Page",
      description: "A community-focused page with events calendar, polls, classifieds, and advertising.",
      templateType: "events",
      isDefault: false,
      rowsConfig: [
        {
          displayOrder: 0,
          rowType: "content",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "rich_text",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Community Hub",
              config: { content: "<h2>What's Happening in Your Community</h2><p>Discover local events, have your say in community polls, and browse classifieds from your neighbors.</p>", textAlign: "center" },
            },
          ],
        },
        {
          displayOrder: 1,
          rowType: "content",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "events_calendar",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Upcoming Events",
              config: { maxItems: 12, showDate: true, showLocation: true, showCategory: true, showDescription: true, layout: "calendar", allowFilter: true, filterCategories: ["Music", "Sports", "Community", "Education", "Arts", "Charity"] },
            },
          ],
        },
        {
          displayOrder: 2,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "ad_banner",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: null,
              config: { placement: "leaderboard", size: "728x90", backgroundColor: "#f8f9fa" },
            },
          ],
        },
        {
          displayOrder: 3,
          rowType: "content",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "community_poll",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Community Poll",
              config: { showResults: true, showVoteCount: true, allowMultiple: false, style: "card" },
            },
          ],
        },
        {
          displayOrder: 4,
          rowType: "content",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "classifieds_grid",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Classifieds",
              config: { maxItems: 12, columns: 3, showImages: true, showPrice: true, showCategory: true, showDate: true, sortBy: "newest", paginated: true, pageSize: 12 },
            },
          ],
        },
      ],
    },
    {
      name: "Network Landing Page",
      description: "A network-level landing page with hero carousel, about section, show directory, articles, media kit CTA, and newsletter signup.",
      templateType: "custom",
      isDefault: false,
      rowsConfig: [
        {
          displayOrder: 0,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 0,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "hero_carousel",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: null,
              config: { autoAdvance: true, interval: 6000, height: "tall", showOverlay: true, maxSlides: 5, showNavArrows: true, showDots: true },
            },
          ],
        },
        {
          displayOrder: 1,
          rowType: "content",
          columnCount: 1,
          backgroundColor: "#f8fafc",
          paddingTop: 48,
          paddingBottom: 48,
          widgets: [
            {
              widgetType: "rich_text",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "About Our Network",
              config: { content: "<h2>About Our Network</h2><p>We are a premier media network delivering engaging content across podcasts, digital news, and community platforms. Our shows reach millions of listeners and readers every month.</p>", textAlign: "center", maxWidth: "800px" },
            },
          ],
        },
        {
          displayOrder: 2,
          rowType: "content",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "podcast_grid",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Our Shows",
              config: { contentRule: "all", columns: 4, showDescription: true, showCategory: true, showSubscribers: false, cardStyle: "cover", sortBy: "title" },
            },
          ],
        },
        {
          displayOrder: 3,
          rowType: "full_width",
          columnCount: 1,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "article_carousel",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Latest Articles",
              config: { contentRule: "latest", maxItems: 8, showImages: true, showSummary: true, showAuthor: true, showDate: true, autoScroll: false, itemsPerView: 3 },
            },
          ],
        },
        {
          displayOrder: 4,
          rowType: "full_width",
          columnCount: 1,
          backgroundColor: "#1e293b",
          paddingTop: 48,
          paddingBottom: 48,
          widgets: [
            {
              widgetType: "rich_text",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Advertise With Us",
              config: { content: "<h2 style='color:white'>Partner With Our Network</h2><p style='color:#94a3b8'>Reach our engaged audience across all platforms. Download our media kit to learn more about advertising opportunities.</p><a href='/media-kit' style='display:inline-block;padding:12px 32px;background:#E5C100;color:#1e293b;border-radius:8px;font-weight:bold;text-decoration:none;margin-top:16px'>Download Media Kit</a>", textAlign: "center", maxWidth: "700px" },
            },
          ],
        },
        {
          displayOrder: 5,
          rowType: "content",
          columnCount: 2,
          paddingTop: 24,
          paddingBottom: 24,
          widgets: [
            {
              widgetType: "newsletter_signup",
              displayOrder: 0,
              columnSpan: 1,
              columnPosition: 0,
              titleOverride: "Subscribe to Our Newsletter",
              config: { style: "inline", buttonText: "Subscribe", showNameField: true, showDescription: true, description: "Get weekly updates on new episodes, articles, and exclusive content." },
            },
            {
              widgetType: "social_feed",
              displayOrder: 1,
              columnSpan: 1,
              columnPosition: 1,
              titleOverride: "Follow Us",
              config: { platforms: ["twitter", "instagram", "facebook", "youtube", "tiktok"], style: "icons", size: "large", showFollowerCount: true },
            },
          ],
        },
      ],
    },
  ]);

  console.log("Successfully inserted 5 page templates.");
  process.exit(0);
}

seedPageTemplates().catch((err) => {
  console.error("Error seeding page templates:", err);
  process.exit(1);
});
