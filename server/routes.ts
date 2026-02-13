import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPodcastSchema, insertEpisodeSchema, insertContentPieceSchema,
  insertAdvertiserSchema, insertCampaignSchema, insertMetricsSchema, insertAlertSchema,
  insertBrandingSchema,
} from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Podcasts ──
  app.get("/api/podcasts", async (_req, res) => {
    const data = await storage.getPodcasts();
    res.json(data);
  });

  app.get("/api/podcasts/:id", async (req, res) => {
    const data = await storage.getPodcast(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.post("/api/podcasts", async (req, res) => {
    const parsed = insertPodcastSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.createPodcast(parsed.data);
    res.status(201).json(data);
  });

  app.patch("/api/podcasts/:id", async (req, res) => {
    const data = await storage.updatePodcast(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/podcasts/:id", async (req, res) => {
    await storage.deletePodcast(req.params.id);
    res.status(204).send();
  });

  // ── Episodes ──
  app.get("/api/episodes", async (req, res) => {
    const podcastId = req.query.podcastId as string | undefined;
    const data = await storage.getEpisodes(podcastId);
    res.json(data);
  });

  app.get("/api/episodes/:id", async (req, res) => {
    const data = await storage.getEpisode(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.post("/api/episodes", async (req, res) => {
    const parsed = insertEpisodeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.createEpisode(parsed.data);
    res.status(201).json(data);
  });

  app.patch("/api/episodes/:id", async (req, res) => {
    const data = await storage.updateEpisode(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  // ── Content Pieces ──
  app.get("/api/content-pieces", async (req, res) => {
    const episodeId = req.query.episodeId as string | undefined;
    const data = await storage.getContentPieces(episodeId);
    res.json(data);
  });

  app.get("/api/podcasts/:id/articles", async (req, res) => {
    const podcast = await storage.getPodcast(req.params.id);
    if (!podcast) return res.status(404).json({ message: "Podcast not found" });
    const articles = await storage.getArticlesForPodcast(req.params.id);
    res.json({ podcast, articles });
  });

  app.get("/api/articles/trending", async (_req, res) => {
    const articles = await storage.getTrendingArticles(5);
    const episodeIds = [...new Set(articles.map(a => a.episodeId))];
    const episodeList = await Promise.all(episodeIds.map(id => storage.getEpisode(id)));
    const podcastIds = [...new Set(episodeList.filter(Boolean).map(e => e!.podcastId))];
    const podcastList = await Promise.all(podcastIds.map(id => storage.getPodcast(id)));
    const podcastMap = Object.fromEntries(podcastList.filter(Boolean).map(p => [p!.id, p]));
    const episodePodcastMap = Object.fromEntries(episodeList.filter(Boolean).map(e => [e!.id, e!.podcastId]));
    const result = articles.map(a => ({
      ...a,
      podcastId: episodePodcastMap[a.episodeId] || null,
      podcast: podcastMap[episodePodcastMap[a.episodeId]] || null,
    }));
    res.json(result);
  });

  app.get("/api/content-pieces/:id", async (req, res) => {
    const data = await storage.getContentPiece(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.post("/api/content-pieces", async (req, res) => {
    const parsed = insertContentPieceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.createContentPiece(parsed.data);
    res.status(201).json(data);
  });

  app.patch("/api/content-pieces/:id", async (req, res) => {
    const data = await storage.updateContentPiece(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  // ── Advertisers ──
  app.get("/api/advertisers", async (_req, res) => {
    const data = await storage.getAdvertisers();
    res.json(data);
  });

  app.get("/api/advertisers/:id", async (req, res) => {
    const data = await storage.getAdvertiser(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.post("/api/advertisers", async (req, res) => {
    const parsed = insertAdvertiserSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.createAdvertiser(parsed.data);
    res.status(201).json(data);
  });

  app.patch("/api/advertisers/:id", async (req, res) => {
    const data = await storage.updateAdvertiser(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  // ── Campaigns ──
  app.get("/api/campaigns", async (req, res) => {
    const advertiserId = req.query.advertiserId as string | undefined;
    const data = await storage.getCampaigns(advertiserId);
    res.json(data);
  });

  app.post("/api/campaigns", async (req, res) => {
    const parsed = insertCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.createCampaign(parsed.data);
    res.status(201).json(data);
  });

  app.patch("/api/campaigns/:id", async (req, res) => {
    const data = await storage.updateCampaign(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  // ── Metrics ──
  app.get("/api/metrics/latest", async (_req, res) => {
    const data = await storage.getLatestMetrics();
    res.json(data || {});
  });

  app.post("/api/metrics", async (req, res) => {
    const parsed = insertMetricsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.createMetrics(parsed.data);
    res.status(201).json(data);
  });

  // ── Alerts ──
  app.get("/api/alerts", async (_req, res) => {
    const data = await storage.getAlerts();
    res.json(data);
  });

  app.post("/api/alerts", async (req, res) => {
    const parsed = insertAlertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.createAlert(parsed.data);
    res.status(201).json(data);
  });

  app.patch("/api/alerts/:id/read", async (req, res) => {
    await storage.markAlertRead(req.params.id);
    res.json({ success: true });
  });

  // ── Branding ──
  app.get("/api/branding", async (_req, res) => {
    const data = await storage.getBranding();
    res.json(data || {
      companyName: "MediaTech Empire",
      tagline: "AI-Powered Media Platform",
      primaryColor: "#E5C100",
      accentColor: "#22C55E",
    });
  });

  app.put("/api/branding", async (req, res) => {
    const parsed = insertBrandingSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.upsertBranding(parsed.data);
    res.json(data);
  });

  // ── Object Storage (file uploads) ──
  registerObjectStorageRoutes(app);

  // ── Seed endpoint (development only) ──
  app.post("/api/seed", async (_req, res) => {
    try {
      const existingPodcasts = await storage.getPodcasts();
      if (existingPodcasts.length > 0) {
        return res.json({ message: "Already seeded" });
      }

      const p1 = await storage.createPodcast({
        title: "The Scott Jennings Show",
        host: "Scott Jennings",
        coverImage: "/images/podcast-cover-scott.png",
        subscribers: 842300,
        growthPercent: 12.0,
        multiplicationFactor: 54,
        status: "active",
      });

      const p2 = await storage.createPodcast({
        title: "Conservative Review",
        host: "Network Team",
        subscribers: 125000,
        growthPercent: 5.0,
        multiplicationFactor: 32,
        status: "active",
      });

      const p3 = await storage.createPodcast({
        title: "Market Watch Daily",
        host: "Finance Desk",
        subscribers: 45000,
        growthPercent: 22.0,
        multiplicationFactor: 45,
        status: "beta",
      });

      const ep1 = await storage.createEpisode({
        podcastId: p1.id,
        title: "Episode #142: The Future of Media",
        duration: "48:12",
        processingStatus: "processing",
        processingProgress: 78,
      });

      const ep2 = await storage.createEpisode({
        podcastId: p1.id,
        title: "Episode #141: Interview with Sen. Paul",
        duration: "55:30",
        processingStatus: "complete",
        processingProgress: 100,
      });

      const ep3 = await storage.createEpisode({
        podcastId: p1.id,
        title: "Episode #140: Weekly Roundup",
        duration: "32:45",
        processingStatus: "complete",
        processingProgress: 100,
      });

      const contentItems = [
        { episodeId: ep1.id, type: "video_clip", title: "The Mainstream Media Dying", platform: "TikTok", status: "ready" },
        { episodeId: ep1.id, type: "video_clip", title: "Why X Won the Election", platform: "Reels", status: "ready" },
        { episodeId: ep1.id, type: "video_clip", title: "Crypto Regulation Debate", platform: "Shorts", status: "generating" },
        { episodeId: ep1.id, type: "article", title: "5 Key Takeaways from Episode 142: The Future of Media", description: "From the decline of legacy networks to the rise of creator-owned platforms, this episode unpacked the forces reshaping how Americans consume news and entertainment. Here are the five most important insights.", body: "The media landscape is undergoing its most dramatic transformation since the invention of television. In Episode 142, we sat down to analyze the five most critical shifts happening right now — and what they mean for creators, advertisers, and audiences alike.\n\nFirst, legacy networks are losing their grip on the national conversation. Viewership for the big three broadcast networks has dropped 34% over the past five years, while independent podcast networks have seen audience growth exceeding 200% in the same period. The numbers tell a clear story: audiences are migrating to platforms where they feel a genuine connection with the host.\n\nSecond, the advertising model is being completely reinvented. Programmatic ad buying, once the exclusive domain of massive media conglomerates, is now accessible to independent creators through platforms like ours. Our average CPM of $28.45 outperforms most traditional radio and television placements, proving that engaged niche audiences are more valuable than passive mass audiences.\n\nThird, AI-powered content multiplication is changing the economics of content creation. A single 45-minute podcast episode can now be transformed into over 50 distinct content assets — video clips, articles, social posts, newsletters, and SEO assets — in a fraction of the time it would take a human team. This multiplier effect means one hour of original content can generate weeks of multi-platform engagement.\n\nFourth, direct-to-consumer relationships are becoming the most valuable asset in media. Unlike traditional media companies that rent their audience from platforms, podcast networks own their subscriber relationships. This creates a defensible moat that grows stronger with every episode.\n\nFinally, the revenue potential for independent media has never been higher. Our network is on pace for $26 million in annual revenue, driven by a combination of programmatic advertising, direct sponsorships, and premium content offerings. The era of independent media empires is not coming — it is already here.", platform: "News Page", status: "ready" },
        { episodeId: ep1.id, type: "article", title: "Media Tech Revolution: Why Independent Creators Are Winning", description: "The advertising dollars are shifting. For the first time, independent media creators are capturing more programmatic ad revenue than traditional outlets in key demographics. We break down what this means for the industry.", body: "For decades, the media industry operated on a simple premise: bigger audiences meant bigger revenue. Legacy networks invested billions in broad-appeal programming designed to capture the largest possible viewership. But the data from 2025 and early 2026 tells a radically different story.\n\nIndependent creators are now capturing more programmatic advertising revenue per listener than traditional outlets in key demographics. According to our internal analytics, the average independent podcast listener engages with 73% of ad placements — compared to just 12% engagement rates for traditional radio and 8% for linear television.\n\nThe reason is straightforward: trust. When a podcast host recommends a product, their audience listens because they have built a relationship over hundreds of hours of content. That trust translates directly into action, and advertisers are finally recognizing its value.\n\nOur network's data bears this out. Advertisers like MyPillow, Black Rifle Coffee, and ExpressVPN are reporting return-on-ad-spend figures that are 3-5x higher on our podcast network than on comparable traditional media buys. This is not a temporary trend — it is a structural shift in how advertising value is created and measured.\n\nThe implications extend beyond advertising. As independent creators build direct relationships with their audiences, they gain leverage that was previously impossible outside of major media conglomerates. They can launch products, negotiate sponsorships, and build media empires — all from a microphone and an internet connection.\n\nThe future of media is not about the size of your audience. It is about the depth of your connection.", platform: "News Page", status: "ready" },
        { episodeId: ep1.id, type: "article", title: "Breaking: New Crypto Regulation Bill Could Change Digital Advertising", description: "A bipartisan bill introduced this week would create new rules for cryptocurrency payments in digital advertising. Industry experts weigh in on what this means for podcast monetization and programmatic ad buying.", body: "A bipartisan bill introduced in the Senate this week could fundamentally alter how digital advertising payments are processed, with significant implications for the podcast industry and independent media creators.\n\nThe Digital Advertising Payment Transparency Act, sponsored by senators from both parties, would create new regulatory frameworks for cryptocurrency-based payment systems in digital advertising. Under the proposed legislation, programmatic ad platforms would need to register with the FTC and provide quarterly transparency reports on payment flows.\n\nFor podcast networks like ours, the bill presents both challenges and opportunities. On one hand, additional compliance requirements could increase operational costs. On the other hand, the transparency provisions could help legitimize cryptocurrency payments as a mainstream option for advertiser settlements, potentially opening up new revenue streams.\n\nIndustry analysts estimate that approximately $2.3 billion in digital advertising transactions currently involve some form of cryptocurrency payment, a figure that has grown 180% year over year. The bill's sponsors argue that this growth necessitates regulatory clarity to protect both advertisers and publishers.\n\nOur team is closely monitoring the bill's progress through committee. Early analysis suggests that the compliance requirements would be manageable for established networks while potentially creating barriers for smaller, less-organized operations. We will continue to provide updates as the legislation moves forward.\n\nRegardless of the bill's outcome, the trend toward cryptocurrency integration in advertising payments appears irreversible. Networks that build the infrastructure now will be best positioned to capitalize on this shift.", platform: "News Page", status: "ready" },
        { episodeId: ep1.id, type: "article", title: "Exclusive Interview: Senator Paul on Free Speech and Tech Policy", description: "In a wide-ranging conversation, Senator Paul discussed the intersection of technology regulation, free speech protections, and the growing influence of independent media in shaping public discourse.", body: "In a wide-ranging conversation recorded for Episode 141, Senator Rand Paul sat down with our host to discuss what he calls the most important intersection in modern politics: technology regulation and free speech.\n\nSenator Paul opened the interview by addressing the ongoing debate around content moderation on social media platforms. He argued that independent media — particularly podcasts — represents the healthiest expression of free speech in the digital age because the format resists the algorithmic manipulation that plagues social media.\n\n\"When someone subscribes to a podcast, they are making a deliberate choice,\" Paul explained. \"They are not being fed content by an algorithm designed to maximize engagement through outrage. That is a fundamentally different relationship, and I think it is a healthier one for our democracy.\"\n\nThe conversation then turned to the regulatory landscape. Paul expressed concern about proposals that would give federal agencies more authority over digital media platforms, arguing that such powers would inevitably be used to suppress speech rather than protect it.\n\nOn the question of independent media's growing political influence, Paul was direct: \"The reason independent creators are gaining influence is because people trust them more than legacy media. That is not a problem to be solved with regulation — it is a market responding to decades of institutional failure.\"\n\nThe full interview, which runs approximately 55 minutes, covers additional topics including cryptocurrency regulation, the future of Section 230, and Paul's thoughts on how AI-generated content should be treated under existing First Amendment frameworks.\n\nThis interview generated significant engagement across our network, with the episode receiving over 2.1 million downloads in its first 48 hours — a new record for the show.", platform: "News Page", status: "ready" },
        { episodeId: ep1.id, type: "article", title: "The AI Content Multiplication Model: How One Episode Becomes 50 Assets", description: "Our proprietary AI pipeline transforms a single podcast episode into dozens of content pieces across platforms. We explain the technology behind the process and share early performance metrics.", body: "At the heart of our media platform is a proprietary AI content multiplication engine that transforms a single podcast episode into a comprehensive library of multi-platform content assets. Today, we are pulling back the curtain on how this technology works and sharing early performance data.\n\nThe process begins the moment an episode finishes recording. Our AI pipeline ingests the raw audio and performs several simultaneous operations: full transcription with speaker identification, topic extraction, sentiment analysis, and key quote identification. This initial processing phase takes approximately 8 minutes for a standard 45-minute episode.\n\nFrom there, the multiplication engine generates content across seven distinct categories: short-form video clips optimized for TikTok, Instagram Reels, and YouTube Shorts; long-form articles for our news pages; blog posts for editorial distribution; social media threads for Twitter/X and LinkedIn; newsletter content for email distribution; SEO-optimized web assets; and audio highlight clips for promotional use.\n\nThe numbers speak for themselves. A single episode typically generates between 45 and 60 distinct content pieces. Our multiplication factor for The Scott Jennings Show currently sits at 54x, meaning each hour of original recording produces 54 unique, platform-optimized content assets.\n\nEarly performance metrics are encouraging. Video clips generated by our AI pipeline achieve an average of 340,000 views within 72 hours of publication. Articles receive an average of 12,000 page views. Newsletter open rates average 42%, significantly above the industry standard of 21%.\n\nThe economic impact is substantial. Before implementing the AI multiplication engine, producing this volume of content would have required a team of 15-20 content creators. The AI pipeline handles this work at a fraction of the cost, while maintaining quality standards that our audience and advertisers expect.\n\nWe are continuing to refine the system, with particular focus on improving the narrative quality of longer-form content and expanding our video clip generation capabilities to include more sophisticated editing and graphics overlay.", platform: "News Page", status: "ready" },
        { episodeId: ep1.id, type: "article", title: "Weekly Roundup: Top Stories in Independent Media This Week", description: "From record-breaking podcast downloads to new advertising partnerships, here is everything that happened this week across the network. Plus, a preview of upcoming episodes and guest announcements.", body: "It has been another milestone week for the network. Here is everything that happened across our shows, plus a look at what is coming next.\n\nThe headline number: total network downloads crossed 4.2 million this week, up 18% from the previous week. The Scott Jennings Show led the way with 2.1 million downloads, driven largely by the Senator Paul interview that went viral across social media platforms.\n\nOn the advertising front, we welcomed two new partners to the network. TechSpace, a consumer electronics retailer, signed a six-month direct sponsorship deal projected to generate $5,000 per month. Additionally, a major financial services company (announcement forthcoming) has committed to a programmatic campaign targeting our Market Watch Daily audience.\n\nOur ad inventory continues to tighten. Q4 slots are now 95% filled, prompting our team to begin discussions about rate card adjustments for the coming quarter. Current average CPM sits at $28.45, but strong demand suggests we can push this higher without losing advertiser interest.\n\nIn content multiplication news, the AI pipeline processed 12 episodes this week, generating 648 individual content assets across all platforms. Video clips performed particularly well, with three clips exceeding 1 million views on TikTok.\n\nLooking ahead, next week features several notable guest appearances. Conservative Review will host a roundtable discussion on media consolidation, while Market Watch Daily has secured an exclusive interview with a leading cryptocurrency exchange CEO.\n\nAs always, we appreciate the support of our growing audience. The independent media revolution is not a spectator sport — and every download, share, and subscription pushes the movement forward.", platform: "News Page", status: "ready" },
        { episodeId: ep1.id, type: "blog", title: "Deep Dive: Future of Media", description: "An in-depth analysis of where media is heading over the next decade.", platform: "Substack", status: "ready" },
        { episodeId: ep1.id, type: "blog", title: "Opinion: Why Legacy Media Lost", description: "A look at the structural failures that led to the decline of traditional media organizations.", platform: "Website", status: "review" },
        { episodeId: ep1.id, type: "social", title: "Key Quotes Thread", platform: "Twitter/X", status: "ready" },
        { episodeId: ep1.id, type: "social", title: "Behind the Scenes", platform: "Twitter/X", status: "ready" },
        { episodeId: ep1.id, type: "social", title: "Poll Question", platform: "Twitter/X", status: "scheduled" },
        { episodeId: ep1.id, type: "linkedin", title: "Industry Analysis", platform: "LinkedIn", status: "generating" },
        { episodeId: ep1.id, type: "newsletter", title: "Weekly Roundup", platform: "Email", status: "generating" },
        { episodeId: ep1.id, type: "seo", title: "Backlink Generation", platform: "Network", status: "pending" },
      ];
      for (const item of contentItems) {
        await storage.createContentPiece(item);
      }

      const advertisersData = [
        { name: "MyPillow", monthlySpend: 45000, type: "Direct", status: "Active" },
        { name: "Black Rifle Coffee", monthlySpend: 32000, type: "Direct", status: "Active" },
        { name: "Patriot Mobile", monthlySpend: 28000, type: "Direct", status: "Active" },
        { name: "Hillsdale College", monthlySpend: 25000, type: "Sponsorship", status: "Active" },
        { name: "ExpressVPN", monthlySpend: 18000, type: "Programmatic", status: "Active" },
      ];
      for (const ad of advertisersData) {
        await storage.createAdvertiser(ad);
      }

      await storage.createMetrics({
        monthlyRevenue: 2184000,
        activeListeners: 842300,
        contentPiecesCount: 1248,
        adFillRate: 98.5,
        avgCpm: 28.45,
      });

      await storage.createAlert({ title: "Ad Inventory Low", description: "Slots for Q4 are 95% filled. Increase rate card.", type: "warning" });
      await storage.createAlert({ title: "New Affiliate Partner", description: "TechSpace joined network. Projected $5k/mo.", type: "success" });
      await storage.createAlert({ title: "Server Load Spike", description: "Traffic surge from viral clip #8821.", type: "info" });

      res.json({ message: "Seeded successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
