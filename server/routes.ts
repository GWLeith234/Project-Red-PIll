import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPodcastSchema, insertEpisodeSchema, insertContentPieceSchema,
  insertAdvertiserSchema, insertCampaignSchema, insertMetricsSchema, insertAlertSchema,
} from "@shared/schema";

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
        { episodeId: ep1.id, type: "article", title: "5 Takeaways from Ep 142", platform: "Substack", status: "ready" },
        { episodeId: ep1.id, type: "article", title: "Media Tech Revolution", platform: "Website", status: "review" },
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
