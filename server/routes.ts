import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertPodcastSchema, insertEpisodeSchema, insertContentPieceSchema,
  insertAdvertiserSchema, insertCampaignSchema, insertMetricsSchema, insertAlertSchema,
  insertBrandingSchema, insertPlatformSettingsSchema, insertUserSchema, insertCommentSchema,
  insertSubscriberSchema, insertSubscriberPodcastSchema, insertCompanySchema,
  insertCompanyContactSchema, insertDealSchema, insertDealActivitySchema, insertProductSchema, insertAdCreativeSchema,
  insertOutboundCampaignSchema, insertHeroSlideSchema, insertNewsLayoutSectionSchema, insertDealLineItemSchema, insertCampaignEmailSchema,
  insertApiKeySchema,
  DEFAULT_ROLE_PERMISSIONS,
  type Role,
} from "@shared/schema";
import crypto from "crypto";
import { z } from "zod";
import { hashPassword, verifyPassword, sanitizeUser, requireAuth, requirePermission } from "./auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Auth ──
  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username and password required" });

    const user = await storage.getUserByUsername(username);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status !== "active") return res.status(403).json({ message: "Account is disabled" });

    const valid = await verifyPassword(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    await storage.updateLastLogin(user.id);
    req.session.userId = user.id;

    res.json(sanitizeUser(user));
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ message: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    res.json(sanitizeUser(user));
  });

  app.get("/api/auth/check-setup", async (_req, res) => {
    const existingUsers = await storage.getUsers();
    res.json({ needsSetup: existingUsers.length === 0 });
  });

  app.post("/api/auth/setup", async (req, res) => {
    const existingUsers = await storage.getUsers();
    if (existingUsers.length > 0) return res.status(400).json({ message: "Admin account already exists" });

    const parsed = z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      displayName: z.string().optional(),
      email: z.string().email().optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const hashed = await hashPassword(parsed.data.password);
    const user = await storage.createUser({
      username: parsed.data.username,
      password: hashed,
      displayName: parsed.data.displayName || parsed.data.username,
      email: parsed.data.email || null,
      role: "admin",
      permissions: [...DEFAULT_ROLE_PERMISSIONS.admin],
      status: "active",
    });

    req.session.userId = user.id;
    res.status(201).json(sanitizeUser(user));
  });

  // ── Users (admin only) ──
  app.get("/api/users", requirePermission("users.view"), async (_req, res) => {
    const allUsers = await storage.getUsers();
    res.json(allUsers.map(sanitizeUser));
  });

  app.post("/api/users", requirePermission("users.edit"), async (req, res) => {
    const parsed = z.object({
      username: z.string().min(3),
      password: z.string().min(6),
      displayName: z.string().optional(),
      email: z.string().email().optional().nullable(),
      role: z.enum(["admin", "editor", "viewer"]),
      permissions: z.array(z.string()).optional(),
      status: z.enum(["active", "inactive"]).default("active"),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const existing = await storage.getUserByUsername(parsed.data.username);
    if (existing) return res.status(409).json({ message: "Username already taken" });

    const hashed = await hashPassword(parsed.data.password);
    const permissions = parsed.data.permissions || DEFAULT_ROLE_PERMISSIONS[parsed.data.role as Role] || [];

    const user = await storage.createUser({
      username: parsed.data.username,
      password: hashed,
      displayName: parsed.data.displayName || parsed.data.username,
      email: parsed.data.email || null,
      role: parsed.data.role,
      permissions,
      status: parsed.data.status,
    });
    res.status(201).json(sanitizeUser(user));
  });

  app.patch("/api/users/:id", requirePermission("users.edit"), async (req, res) => {
    const parsed = z.object({
      displayName: z.string().optional(),
      email: z.string().email().optional().nullable(),
      role: z.enum(["admin", "editor", "viewer"]).optional(),
      permissions: z.array(z.string()).optional(),
      status: z.enum(["active", "inactive"]).optional(),
      password: z.string().min(6).optional(),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    const updateData: any = { ...parsed.data };
    if (updateData.password) {
      updateData.password = await hashPassword(updateData.password);
    }

    const user = await storage.updateUser(req.params.id, updateData);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(sanitizeUser(user));
  });

  app.delete("/api/users/:id", requirePermission("users.edit"), async (req, res) => {
    if (req.session.userId === req.params.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    await storage.deleteUser(req.params.id);
    res.status(204).send();
  });

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

    const mediaUrl = data.audioUrl || data.videoUrl;
    if (mediaUrl && !data.transcript) {
      import("./ai-content-agent").then(({ backgroundTranscribe }) => {
        backgroundTranscribe(data.id).catch(err =>
          console.error(`[BG Transcribe] Auto-transcription failed for ${data.id}:`, err.message)
        );
      });
    }
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

  async function enrichArticlesWithPodcast(articles: any[], st: typeof storage) {
    const episodeIds = [...new Set(articles.map(a => a.episodeId))];
    const episodes = await Promise.all(episodeIds.map(id => st.getEpisode(id)));
    const epMap = Object.fromEntries(episodes.filter(Boolean).map(e => [e!.id, e!]));
    const podcastIds = [...new Set(episodes.filter(Boolean).map(e => e!.podcastId))];
    const podcasts = await Promise.all(podcastIds.map(id => st.getPodcast(id)));
    const podMap = Object.fromEntries(podcasts.filter(Boolean).map(p => [p!.id, p!]));
    return articles.map(a => {
      const ep = epMap[a.episodeId];
      const pod = ep ? podMap[ep.podcastId] : null;
      return { ...a, podcastId: ep?.podcastId || null, podcastTitle: pod?.title || null, podcastImage: pod?.coverImage || null };
    });
  }

  app.post("/api/content-pieces/recommendations", async (req, res) => {
    const { readArticleIds = [], limit = 6 } = req.body;
    const allPieces = await storage.getContentPieces();
    const articles = allPieces.filter((c: any) => c.type === "article" && c.status === "published");

    if (!readArticleIds.length) {
      const shuffled = articles.sort(() => Math.random() - 0.5).slice(0, limit);
      const enriched = await enrichArticlesWithPodcast(shuffled, storage);
      return res.json(enriched);
    }

    const readSet = new Set(readArticleIds);
    const readArticles = articles.filter((a: any) => readSet.has(a.id));
    const unread = articles.filter((a: any) => !readSet.has(a.id));

    const readEpisodeIds = new Set(readArticles.map((a: any) => a.episodeId));
    const readKeywords = new Set(readArticles.flatMap((a: any) => a.seoKeywords || []));

    const scored = unread.map((a: any) => {
      let score = 0;
      if (readEpisodeIds.has(a.episodeId)) score += 5;
      const keywords = a.seoKeywords || [];
      keywords.forEach((kw: string) => { if (readKeywords.has(kw)) score += 2; });
      const age = Date.now() - new Date(a.publishedAt || a.createdAt || 0).getTime();
      score += Math.max(0, 3 - age / (1000 * 60 * 60 * 24 * 7));
      return { ...a, _score: score };
    });

    scored.sort((a: any, b: any) => b._score - a._score);
    const topPicks = scored.slice(0, limit).map(({ _score, ...rest }: any) => rest);
    const enriched = await enrichArticlesWithPodcast(topPicks, storage);
    res.json(enriched);
  });

  app.get("/api/content-pieces/:id", async (req, res) => {
    const data = await storage.getContentPiece(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    let author = null;
    if (data.authorId) {
      author = await storage.getAuthorPublicProfile(data.authorId);
    }
    res.json({ ...data, author });
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

  // ── AI Content Agent ──
  app.post("/api/ai-agent/generate-story", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const { episodeId, transcript } = req.body;
    if (!episodeId) return res.status(400).json({ message: "episodeId is required" });

    try {
      const { transcribeAndGenerateStory, generateStoryFromText } = await import("./ai-content-agent");

      let result;
      if (transcript) {
        const story = await generateStoryFromText(episodeId, transcript);
        result = { story };
      } else {
        result = await transcribeAndGenerateStory(episodeId);
      }

      if (result.error) {
        return res.status(400).json({ message: result.error });
      }
      res.json(result);
    } catch (err: any) {
      console.error("AI agent error:", err);
      res.status(500).json({ message: err.message || "AI content generation failed" });
    }
  });

  app.post("/api/ai-agent/full-pipeline", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const { episodeId, contentTypes } = req.body;
    if (!episodeId) return res.status(400).json({ message: "episodeId is required" });

    try {
      const { runFullContentPipeline } = await import("./ai-content-agent");
      const result = await runFullContentPipeline(episodeId, contentTypes);
      res.json(result);
    } catch (err: any) {
      console.error("Full pipeline error:", err);
      res.status(500).json({ message: err.message || "Content pipeline failed" });
    }
  });

  app.get("/api/episodes/:id/keyword-analysis", requireAuth, requirePermission("content.view"), async (req, res) => {
    try {
      const episode = await storage.getEpisode(req.params.id);
      if (!episode) return res.status(404).json({ message: "Episode not found" });

      if (episode.keywordAnalysis) {
        try {
          const analysis = JSON.parse(episode.keywordAnalysis as string);
          return res.json({
            hasAnalysis: true,
            extractedKeywords: episode.extractedKeywords || [],
            analysis,
          });
        } catch {
          return res.json({ hasAnalysis: false, extractedKeywords: episode.extractedKeywords || [], analysis: null });
        }
      }

      res.json({ hasAnalysis: false, extractedKeywords: episode.extractedKeywords || [], analysis: null });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/episodes/:id/keyword-analysis", requireAuth, requirePermission("content.edit"), async (req, res) => {
    try {
      const episode = await storage.getEpisode(req.params.id);
      if (!episode) return res.status(404).json({ message: "Episode not found" });
      if (!episode.transcript) return res.status(400).json({ message: "Episode has no transcript. Run transcription first." });

      const { analyzeTranscriptKeywords } = await import("./ai-content-agent");
      const podcast = await storage.getPodcast(episode.podcastId);
      const kwAnalysis = await analyzeTranscriptKeywords(episode.transcript, episode.title, podcast?.title);

      const allKeywords = [
        ...kwAnalysis.topKeywords.map(k => k.keyword),
        ...kwAnalysis.longTailKeywords.map(k => k.phrase),
      ];

      await storage.updateEpisode(req.params.id, {
        extractedKeywords: allKeywords,
        keywordAnalysis: JSON.stringify(kwAnalysis),
      } as any);

      res.json({
        hasAnalysis: true,
        extractedKeywords: allKeywords,
        analysis: kwAnalysis,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/ai-agent/smart-suggestions", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const { episodeId } = req.body;
    if (!episodeId) return res.status(400).json({ message: "episodeId is required" });

    try {
      const episode = await storage.getEpisode(episodeId);
      if (!episode) return res.status(404).json({ message: "Episode not found" });
      if (!episode.transcript) return res.status(400).json({ message: "Episode has no transcript" });

      const { generateSmartSuggestions } = await import("./ai-content-agent");
      const suggestions = await generateSmartSuggestions(episodeId, episode.transcript, episode.title);
      res.json(suggestions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/ai-agent/generate-newsletter", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ message: "month and year are required" });

    try {
      const { generateMonthlyNewsletter } = await import("./ai-content-agent");
      const newsletter = await generateMonthlyNewsletter(month, year);

      const run = await storage.createNewsletterRun({
        title: newsletter.title,
        period: `${month} ${year}`,
        body: newsletter.body,
        contentPieceIds: newsletter.contentPieceIds,
        status: "draft",
      });

      res.json(run);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── Clip Assets ──
  app.get("/api/clip-assets", requireAuth, requirePermission("content.view"), async (req, res) => {
    const episodeId = req.query.episodeId as string | undefined;
    const data = await storage.getClipAssets(episodeId);
    res.json(data);
  });

  app.get("/api/clip-assets/:id", requireAuth, requirePermission("content.view"), async (req, res) => {
    const data = await storage.getClipAsset(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.patch("/api/clip-assets/:id", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const data = await storage.updateClipAsset(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/clip-assets/:id", requireAuth, requirePermission("content.edit"), async (req, res) => {
    await storage.deleteClipAsset(req.params.id);
    res.status(204).end();
  });

  // ── Scheduled Posts ──
  app.get("/api/scheduled-posts", requireAuth, requirePermission("content.view"), async (req, res) => {
    const platform = req.query.platform as string | undefined;
    const data = await storage.getScheduledPosts(platform);
    res.json(data);
  });

  app.post("/api/scheduled-posts", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const data = await storage.createScheduledPost(req.body);
    res.status(201).json(data);
  });

  app.patch("/api/scheduled-posts/:id", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const data = await storage.updateScheduledPost(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/scheduled-posts/:id", requireAuth, requirePermission("content.edit"), async (req, res) => {
    await storage.deleteScheduledPost(req.params.id);
    res.status(204).end();
  });

  // ── Social Accounts ──
  app.get("/api/social-accounts", requireAuth, requirePermission("content.view"), async (req, res) => {
    const filter: { ownerType?: string; podcastId?: string } = {};
    if (req.query.ownerType) filter.ownerType = req.query.ownerType as string;
    if (req.query.podcastId) filter.podcastId = req.query.podcastId as string;
    const data = await storage.getSocialAccounts(Object.keys(filter).length > 0 ? filter : undefined);
    res.json(data);
  });

  app.post("/api/social-accounts", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const accountData = { ...req.body, status: "connected" };
    const data = await storage.createSocialAccount(accountData);
    res.status(201).json(data);
  });

  app.post("/api/social-accounts/:id/test", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const account = await storage.getSocialAccount(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });
    await new Promise(resolve => setTimeout(resolve, 1500));
    const updated = await storage.updateSocialAccount(req.params.id, { status: "connected" });
    res.json({ success: true, account: updated });
  });

  app.post("/api/social-accounts/:id/reconnect", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const account = await storage.getSocialAccount(req.params.id);
    if (!account) return res.status(404).json({ message: "Account not found" });
    await new Promise(resolve => setTimeout(resolve, 1000));
    const updated = await storage.updateSocialAccount(req.params.id, { status: "connected" });
    res.json({ success: true, account: updated });
  });

  app.patch("/api/social-accounts/:id", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const data = await storage.updateSocialAccount(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.delete("/api/social-accounts/:id", requireAuth, requirePermission("content.edit"), async (req, res) => {
    await storage.deleteSocialAccount(req.params.id);
    res.status(204).end();
  });

  // ── Newsletter Runs ──
  app.get("/api/newsletter-runs", requireAuth, requirePermission("content.view"), async (_req, res) => {
    const data = await storage.getNewsletterRuns();
    res.json(data);
  });

  app.get("/api/newsletter-runs/:id", requireAuth, requirePermission("content.view"), async (req, res) => {
    const data = await storage.getNewsletterRun(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  app.post("/api/newsletter-runs/:id/send", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const run = await storage.getNewsletterRun(req.params.id);
    if (!run) return res.status(404).json({ message: "Not found" });

    try {
      const user = (req as any).user;
      const campaign = await storage.createOutboundCampaign({
        name: run.title,
        type: "email",
        audience: "subscribers",
        status: "draft",
        subject: run.title,
        body: run.body || "",
        createdBy: user?.id,
      });

      await storage.updateNewsletterRun(req.params.id, {
        outboundCampaignId: campaign.id,
        status: "sending",
      });

      res.json({ newsletter: run, campaign });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/newsletter-runs/:id", requireAuth, requirePermission("content.edit"), async (req, res) => {
    await storage.deleteNewsletterRun(req.params.id);
    res.status(204).end();
  });

  // CRM Lists
  app.get("/api/crm-lists", requireAuth, async (req, res) => {
    const lists = await storage.getCrmLists(req.query.crmType as string | undefined);
    res.json(lists);
  });

  app.post("/api/crm-lists", requireAuth, async (req, res) => {
    const list = await storage.createCrmList(req.body);
    res.status(201).json(list);
  });

  app.delete("/api/crm-lists/:id", requireAuth, async (req, res) => {
    await storage.deleteCrmList(req.params.id);
    res.status(204).end();
  });

  // CSV Export endpoints
  app.get("/api/export/subscribers", requireAuth, requirePermission("audience.view"), async (req, res) => {
    const podcastId = req.query.podcastId as string | undefined;
    let subs;
    if (podcastId) {
      subs = await storage.getSubscribersByPodcast(podcastId);
    } else {
      subs = await storage.getSubscribers();
    }
    const search = (req.query.search as string || "").toLowerCase();
    const tags = req.query.tags ? (req.query.tags as string).split(",") : [];
    const source = req.query.source as string | undefined;
    const status = req.query.status as string | undefined;
    let filtered = subs;
    if (search) {
      filtered = filtered.filter((s: any) =>
        (s.firstName || "").toLowerCase().includes(search) ||
        (s.lastName || "").toLowerCase().includes(search) ||
        (s.email || "").toLowerCase().includes(search) ||
        (s.company || "").toLowerCase().includes(search)
      );
    }
    if (tags.length > 0) {
      filtered = filtered.filter((s: any) => tags.some(t => (s.tags || []).includes(t)));
    }
    if (source && source !== "all") {
      filtered = filtered.filter((s: any) => s.source === source);
    }
    if (status && status !== "all") {
      filtered = filtered.filter((s: any) => s.status === status);
    }
    const headers = ["First Name","Last Name","Email","Phone","Company","Title","City","State","Country","Tags","Interests","Source","Status","Marketing Consent","SMS Consent","Created At"];
    const rows = filtered.map((s: any) => [
      s.firstName || "", s.lastName || "", s.email || "", s.phone || "",
      s.company || "", s.title || "", s.city || "", s.state || "", s.country || "",
      (s.tags || []).join(";"), (s.interests || []).join(";"),
      s.source || "", s.status || "",
      s.marketingConsent ? "Yes" : "No", s.smsConsent ? "Yes" : "No",
      s.createdAt ? new Date(s.createdAt).toISOString().split("T")[0] : ""
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=subscribers.csv");
    res.send(csv);
  });

  app.get("/api/export/companies", requireAuth, requirePermission("sales.view"), async (_req, res) => {
    const companies = await storage.getCompanies();
    const search = (_req.query.search as string || "").toLowerCase();
    const companyType = _req.query.companyType as string | undefined;
    const status = _req.query.status as string | undefined;
    let filtered = companies;
    if (search) {
      filtered = filtered.filter((c: any) =>
        (c.name || "").toLowerCase().includes(search) ||
        (c.industry || "").toLowerCase().includes(search) ||
        (c.email || "").toLowerCase().includes(search)
      );
    }
    if (companyType && companyType !== "all") {
      filtered = filtered.filter((c: any) => c.companyType === companyType);
    }
    if (status && status !== "all") {
      filtered = filtered.filter((c: any) => c.status === status);
    }
    const headers = ["Name","Industry","Website","Phone","Email","City","State","Country","Company Type","Annual Revenue","Employee Count","Status","Created At"];
    const rows = filtered.map((c: any) => [
      c.name || "", c.industry || "", c.website || "", c.phone || "", c.email || "",
      c.city || "", c.state || "", c.country || "", c.companyType || "",
      c.annualRevenue?.toString() || "", c.employeeCount?.toString() || "",
      c.status || "", c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : ""
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=companies.csv");
    res.send(csv);
  });

  app.get("/api/export/contacts", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const companyId = req.query.companyId as string | undefined;
    const contacts = await storage.getCompanyContacts(companyId);
    const companies = await storage.getCompanies();
    const search = (req.query.search as string || "").toLowerCase();
    const status = req.query.status as string | undefined;
    let filtered = contacts;
    if (search) {
      filtered = filtered.filter((c: any) =>
        (c.firstName || "").toLowerCase().includes(search) ||
        (c.lastName || "").toLowerCase().includes(search) ||
        (c.email || "").toLowerCase().includes(search) ||
        (c.title || "").toLowerCase().includes(search)
      );
    }
    if (status && status !== "all") {
      filtered = filtered.filter((c: any) => c.status === status);
    }
    const headers = ["First Name","Last Name","Email","Phone","Title","Department","Company","Tags","Status","Marketing Consent","SMS Consent","Created At"];
    const rows = filtered.map((c: any) => {
      const companyName = companies.find((co: any) => co.id === c.companyId)?.name || "";
      return [
        c.firstName || "", c.lastName || "", c.email || "", c.phone || "",
        c.title || "", c.department || "", companyName,
        (c.tags || []).join(";"), c.status || "",
        c.marketingConsent ? "Yes" : "No", c.smsConsent ? "Yes" : "No",
        c.createdAt ? new Date(c.createdAt).toISOString().split("T")[0] : ""
      ];
    });
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=contacts.csv");
    res.send(csv);
  });

  app.get("/api/export/deals", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const companyId = req.query.companyId as string | undefined;
    const deals = await storage.getDeals(companyId);
    const companies = await storage.getCompanies();
    const search = (req.query.search as string || "").toLowerCase();
    const stage = req.query.stage as string | undefined;
    const dealType = req.query.dealType as string | undefined;
    let filtered = deals;
    if (search) {
      filtered = filtered.filter((d: any) =>
        (d.title || "").toLowerCase().includes(search) ||
        (d.description || "").toLowerCase().includes(search)
      );
    }
    if (stage && stage !== "all") {
      filtered = filtered.filter((d: any) => d.stage === stage);
    }
    if (dealType && dealType !== "all") {
      filtered = filtered.filter((d: any) => d.dealType === dealType);
    }
    const headers = ["Title","Company","Value","Stage","Deal Type","Priority","Probability","Start Date","Close Date","Status","Created At"];
    const rows = filtered.map((d: any) => {
      const companyName = companies.find((c: any) => c.id === d.companyId)?.name || "";
      return [
        d.title || "", companyName, d.value?.toString() || "0",
        d.stage || "", d.dealType || "", d.priority || "",
        d.probability?.toString() || "", 
        d.startDate ? new Date(d.startDate).toISOString().split("T")[0] : "",
        d.closeDate ? new Date(d.closeDate).toISOString().split("T")[0] : "",
        d.status || "", d.createdAt ? new Date(d.createdAt).toISOString().split("T")[0] : ""
      ];
    });
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=deals.csv");
    res.send(csv);
  });

  app.get("/api/moderation/queue", requireAuth, requirePermission("content.edit"), async (_req, res) => {
    const items = await storage.getContentPiecesByStatus("review", "article");
    const episodeIds = [...new Set(items.map(i => i.episodeId))];
    const episodesMap: Record<string, any> = {};
    for (const eid of episodeIds) {
      const ep = await storage.getEpisode(eid);
      if (ep) {
        const podcast = await storage.getPodcast(ep.podcastId);
        episodesMap[eid] = { ...ep, podcast };
      }
    }
    res.json(items.map(item => ({
      ...item,
      episode: episodesMap[item.episodeId] || null,
    })));
  });

  app.post("/api/moderation/:id/approve", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const user = (req as any).user;
    const piece = await storage.getContentPiece(req.params.id);
    if (!piece) return res.status(404).json({ message: "Content not found" });

    const updated = await storage.updateContentPiece(req.params.id, {
      status: "published",
      authorId: piece.authorId || user?.id,
      moderatedBy: user?.id,
      moderatedAt: new Date(),
      publishedAt: new Date(),
    } as any);
    res.json(updated);
  });

  app.post("/api/moderation/:id/reject", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const user = (req as any).user;
    const updated = await storage.updateContentPiece(req.params.id, {
      status: "rejected",
      moderatedBy: user?.id,
      moderatedAt: new Date(),
    } as any);
    if (!updated) return res.status(404).json({ message: "Content not found" });
    res.json(updated);
  });

  app.patch("/api/moderation/:id", requireAuth, requirePermission("content.edit"), async (req, res) => {
    const { title, body, description, coverImage, seoTitle, seoDescription, seoKeywords, summary, readingTime } = req.body;
    const updateData: Record<string, any> = {};
    if (title !== undefined) updateData.title = title;
    if (body !== undefined) updateData.body = body;
    if (description !== undefined) updateData.description = description;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;
    if (summary !== undefined) updateData.summary = summary;
    if (readingTime !== undefined) updateData.readingTime = readingTime;
    const updated = await storage.updateContentPiece(req.params.id, updateData);
    if (!updated) return res.status(404).json({ message: "Content not found" });
    res.json(updated);
  });

  // ── Comments ──
  app.get("/api/articles/:id/comments", async (req, res) => {
    const data = await storage.getCommentsByArticle(req.params.id);
    res.json(data);
  });

  app.post("/api/articles/:id/comments", async (req, res) => {
    const parsed = insertCommentSchema.safeParse({ ...req.body, articleId: req.params.id });
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.createComment(parsed.data);
    res.status(201).json(data);
  });

  app.delete("/api/comments/:id", requireAuth, requirePermission("content.edit"), async (req, res) => {
    await storage.deleteComment(req.params.id);
    res.status(204).end();
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

    const existingCompanies = await storage.getCompanies();
    const alreadyExists = existingCompanies.some(
      (c: any) => c.name.toLowerCase() === data.name.toLowerCase()
    );
    if (!alreadyExists) {
      const typeMap: Record<string, string> = { "Direct": "advertiser", "Programmatic": "advertiser", "Sponsor": "sponsor", "Partner": "partner" };
      await storage.createCompany({
        name: data.name,
        companyType: typeMap[data.type || "Direct"] || "advertiser",
        status: (data.status || "Active").toLowerCase(),
        annualRevenue: (data.monthlySpend || 0) * 12,
        notes: `Auto-created from advertiser. Type: ${data.type || "Direct"}, Monthly spend: $${data.monthlySpend || 0}`,
      });
    }

    res.status(201).json(data);
  });

  app.patch("/api/advertisers/:id", async (req, res) => {
    const data = await storage.updateAdvertiser(req.params.id, req.body);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.json(data);
  });

  // ── Campaigns ──
  app.get("/api/campaigns", async (req, res) => {
    const filters: any = {};
    if (req.query.advertiserId) filters.advertiserId = req.query.advertiserId;
    if (req.query.companyId) filters.companyId = req.query.companyId;
    if (req.query.dealId) filters.dealId = req.query.dealId;
    const data = await storage.getCampaigns(Object.keys(filters).length ? filters : undefined);
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

  // ── User Profile ──
  app.get("/api/profile", requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(sanitizeUser(user));
  });

  app.patch("/api/profile", requireAuth, async (req: any, res) => {
    const { profilePhoto, bannerImage, bio, title, linkedinUrl, dashboardWidgets, displayName } = req.body;
    const data: any = {};
    if (profilePhoto !== undefined) data.profilePhoto = profilePhoto;
    if (bannerImage !== undefined) data.bannerImage = bannerImage;
    if (bio !== undefined) data.bio = bio;
    if (title !== undefined) data.title = title;
    if (linkedinUrl !== undefined) data.linkedinUrl = linkedinUrl;
    if (dashboardWidgets !== undefined) data.dashboardWidgets = dashboardWidgets;
    if (displayName !== undefined) data.displayName = displayName;
    const updated = await storage.updateUserProfile(req.session.userId, data);
    if (!updated) return res.status(404).json({ message: "User not found" });
    res.json(sanitizeUser(updated));
  });

  // ── LinkedIn Profile Analyzer ──
  app.post("/api/profile/analyze-linkedin", requireAuth, async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "LinkedIn profile URL is required" });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    try {
      const parsed = new URL(targetUrl);
      if (!parsed.hostname.includes("linkedin.com")) {
        return res.status(400).json({ message: "Please provide a valid LinkedIn URL" });
      }
    } catch {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(400).json({ message: `Could not reach LinkedIn profile (HTTP ${response.status})` });
      }

      const html = await response.text();

      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

      let profilePhoto = ogImageMatch?.[1] || twitterImageMatch?.[1] || null;
      if (profilePhoto && (profilePhoto.includes("static.licdn.com/aero") || profilePhoto.includes("default-avatar") || profilePhoto.includes("/company-logo") || profilePhoto.includes("ghost-person"))) {
        profilePhoto = null;
      }

      const rawTitle = ogTitleMatch?.[1] || titleMatch?.[1] || "";
      const cleanTitle = rawTitle
        .replace(/\s*[-–|]\s*LinkedIn.*$/i, "")
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();

      let jobTitle = "";
      let displayName = cleanTitle;
      const titleParts = cleanTitle.split(" - ");
      if (titleParts.length >= 2) {
        displayName = titleParts[0].trim();
        jobTitle = titleParts[1].trim();
      }

      const rawDesc = ogDescMatch?.[1] || "";
      const bio = rawDesc
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/View [^']*'s professional profile.*$/i, "")
        .replace(/LinkedIn.*$/i, "")
        .trim()
        .slice(0, 500);

      res.json({
        profilePhoto,
        displayName,
        title: jobTitle,
        bio: bio || `${displayName} is a professional on LinkedIn.`,
        linkedinUrl: targetUrl,
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        return res.status(408).json({ message: "Request timed out" });
      }
      return res.status(500).json({ message: "Failed to analyze LinkedIn profile" });
    }
  });

  // ── Brand Analyzer ──
  app.post("/api/branding/analyze-website", requireAuth, requirePermission("customize.edit"), async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "URL is required" });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    // Validate URL and block SSRF
    try {
      const parsed = new URL(targetUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return res.status(400).json({ message: "Only HTTP/HTTPS URLs are allowed" });
      }
      const hostname = parsed.hostname.toLowerCase();
      const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal", "169.254.169.254"];
      if (blockedHosts.includes(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal") || /^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) || /^192\.168\./.test(hostname)) {
        return res.status(400).json({ message: "Internal/private URLs are not allowed" });
      }
    } catch {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(400).json({ message: `Could not reach website (HTTP ${response.status})` });
      }

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        return res.status(400).json({ message: "URL did not return an HTML page" });
      }

      const html = await response.text();
      if (html.length > 5_000_000) {
        return res.status(400).json({ message: "Page too large to analyze" });
      }
      const baseUrl = new URL(targetUrl);
      const origin = baseUrl.origin;

      const resolveUrl = (href: string): string => {
        if (!href) return "";
        if (href.startsWith("data:")) return href;
        if (href.startsWith("//")) return baseUrl.protocol + href;
        if (href.startsWith("/")) return origin + href;
        if (href.startsWith("http")) return href;
        return origin + "/" + href;
      };

      // Extract title / company name
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
      const siteName = html.match(/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
      let companyName = (siteName?.[1] || ogTitleMatch?.[1] || titleMatch?.[1] || "").trim();
      if (companyName.includes(" | ")) companyName = companyName.split(" | ")[0].trim();
      if (companyName.includes(" - ")) companyName = companyName.split(" - ")[0].trim();

      // Extract description / tagline
      const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
      const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
      let tagline = (ogDesc?.[1] || metaDesc?.[1] || "").trim();
      if (tagline.length > 120) tagline = tagline.substring(0, 117) + "...";

      // Extract logo
      let logoUrl = "";
      const logoPatterns = [
        /<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/gi,
        /<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/gi,
        /<img[^>]*src=["']([^"']+)["'][^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["']/gi,
        /<a[^>]*class=["'][^"']*logo[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/gi,
      ];

      const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);

      for (const pattern of logoPatterns) {
        const match = pattern.exec(html);
        if (match?.[1]) {
          const candidate = resolveUrl(match[1]);
          if (candidate && !candidate.includes("favicon.ico") || !logoUrl) {
            logoUrl = candidate;
            if (!candidate.includes("favicon")) break;
          }
        }
      }

      if (!logoUrl && ogImage?.[1]) {
        logoUrl = resolveUrl(ogImage[1]);
      }

      // Extract favicon
      let faviconUrl = "";
      const faviconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
      const appleIconMatch = html.match(/<link[^>]*rel=["']apple-touch-icon["'][^>]*href=["']([^"']+)["']/i);
      faviconUrl = resolveUrl(faviconMatch?.[1] || appleIconMatch?.[1] || "/favicon.ico");

      // Extract colors from CSS and inline styles
      const hexColors: Map<string, number> = new Map();
      const colorPatterns = [
        /#([0-9A-Fa-f]{6})\b/g,
        /#([0-9A-Fa-f]{3})\b/g,
      ];

      // Check inline styles, CSS vars, and style blocks
      const styleBlocks = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
      const inlineStyles = html.match(/style=["'][^"']*["']/gi) || [];
      const cssVars = html.match(/--[^:]+:\s*#[0-9A-Fa-f]{3,6}/gi) || [];
      const bgColors = html.match(/(?:background-color|background|color|border-color|fill|stroke)\s*:\s*#[0-9A-Fa-f]{3,8}/gi) || [];

      const colorSource = [...styleBlocks, ...inlineStyles, ...cssVars, ...bgColors].join(" ");

      // Also search meta theme-color
      const themeColor = html.match(/<meta[^>]*name=["']theme-color["'][^>]*content=["']([^"']+)["']/i);
      const msColor = html.match(/<meta[^>]*name=["']msapplication-TileColor["'][^>]*content=["']([^"']+)["']/i);

      for (const pattern of colorPatterns) {
        let m;
        while ((m = pattern.exec(colorSource)) !== null) {
          let hex = m[1];
          if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
          }
          hex = "#" + hex.toUpperCase();
          // Skip near-white, near-black, and pure grays
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const isGray = Math.abs(r - g) < 15 && Math.abs(g - b) < 15;
          const isTooLight = r > 240 && g > 240 && b > 240;
          const isTooDark = r < 15 && g < 15 && b < 15;
          if (!isGray && !isTooLight && !isTooDark) {
            hexColors.set(hex, (hexColors.get(hex) || 0) + 1);
          }
        }
      }

      // Add theme-color and ms tile color with high priority
      [themeColor?.[1], msColor?.[1]].forEach(c => {
        if (c && c.startsWith("#")) {
          let hex = c.length === 4
            ? "#" + c[1]+c[1]+c[2]+c[2]+c[3]+c[3]
            : c;
          hex = hex.toUpperCase();
          hexColors.set(hex, (hexColors.get(hex) || 0) + 100);
        }
      });

      // Sort by frequency
      const colorEntries: [string, number][] = [];
      hexColors.forEach((count, color) => colorEntries.push([color, count]));
      const sortedColors = colorEntries
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color)
        .slice(0, 8);

      // Pick primary and accent
      const suggestedPrimary = sortedColors[0] || "#E5C100";
      const suggestedAccent = sortedColors[1] || sortedColors[0] || "#22C55E";

      res.json({
        companyName: companyName || null,
        tagline: tagline || null,
        logoUrl: logoUrl || null,
        faviconUrl: faviconUrl || null,
        colors: sortedColors,
        suggestedPrimary,
        suggestedAccent,
        sourceUrl: targetUrl,
      });

    } catch (err: any) {
      if (err.name === "AbortError") {
        return res.status(408).json({ message: "Website took too long to respond" });
      }
      return res.status(400).json({ message: `Could not analyze website: ${err.message}` });
    }
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

  app.get("/api/hero-slides", requirePermission("customize.view"), async (_req, res) => {
    const slides = await storage.getHeroSlides();
    res.json(slides);
  });

  app.post("/api/hero-slides", requirePermission("customize.edit"), async (req, res) => {
    const parsed = insertHeroSlideSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const slide = await storage.createHeroSlide(parsed.data);
    res.json(slide);
  });

  app.patch("/api/hero-slides/:id", requirePermission("customize.edit"), async (req, res) => {
    const slide = await storage.updateHeroSlide(req.params.id, req.body);
    if (!slide) return res.status(404).json({ message: "Slide not found" });
    res.json(slide);
  });

  app.delete("/api/hero-slides/:id", requirePermission("customize.edit"), async (req, res) => {
    await storage.deleteHeroSlide(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/public/hero-slides", async (_req, res) => {
    const slides = await storage.getActiveHeroSlides();
    res.json(slides);
  });

  // ── News Layout Sections ──
  app.get("/api/news-layout-sections", requirePermission("customize.view"), async (_req, res) => {
    const sections = await storage.getNewsLayoutSections();
    res.json(sections);
  });

  app.post("/api/news-layout-sections", requirePermission("customize.edit"), async (req, res) => {
    const parsed = insertNewsLayoutSectionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const section = await storage.createNewsLayoutSection(parsed.data);
    res.json(section);
  });

  app.patch("/api/news-layout-sections/:id", requirePermission("customize.edit"), async (req, res) => {
    const section = await storage.updateNewsLayoutSection(req.params.id, req.body);
    if (!section) return res.status(404).json({ message: "Section not found" });
    res.json(section);
  });

  app.delete("/api/news-layout-sections/:id", requirePermission("customize.edit"), async (req, res) => {
    await storage.deleteNewsLayoutSection(req.params.id);
    res.json({ success: true });
  });

  app.get("/api/public/news-layout", async (_req, res) => {
    const sections = await storage.getActiveNewsLayoutSections();
    res.json(sections);
  });

  app.get("/api/public/news-feed", async (_req, res) => {
    try {
      const sections = await storage.getActiveNewsLayoutSections();
      const allPodcasts = await storage.getPodcasts();
      const allContent = await storage.getContentPieces();
      const publishedArticles = allContent
        .filter((c) => (c.type === "article" || c.type === "blog") && c.status === "ready")
        .sort((a, b) => {
          const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const db2 = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return db2 - da;
        });

      const allEpisodes = await storage.getEpisodes();
      const publishedEpisodes = allEpisodes
        .filter((e) => e.publishedAt)
        .sort((a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime());

      const podcastMap = new Map(allPodcasts.map((p) => [p.id, p]));

      const resolvedSections = sections.map((section) => {
        let items: any[] = [];
        const filters = (section.contentFilters || {}) as Record<string, any>;
        const max = section.maxItems || 6;

        if (section.contentRule === "editors_pick" && section.pinnedArticleIds?.length) {
          items = section.pinnedArticleIds
            .map((id) => publishedArticles.find((a) => a.id === id))
            .filter(Boolean)
            .slice(0, max);
        } else if (section.contentRule === "latest") {
          let pool = [...publishedArticles];
          if (filters.podcastId) {
            const epIds = allEpisodes.filter((e) => e.podcastId === filters.podcastId).map((e) => e.id);
            pool = pool.filter((a) => a.episodeId && epIds.includes(a.episodeId));
          }
          if (filters.contentType) {
            pool = pool.filter((a) => a.type === filters.contentType);
          }
          items = pool.slice(0, max);
        } else if (section.contentRule === "trending") {
          items = [...publishedArticles]
            .sort((a, b) => (b.body?.length || 0) - (a.body?.length || 0))
            .slice(0, max);
        } else if (section.contentRule === "by_podcast") {
          if (filters.podcastId) {
            const epIds = allEpisodes.filter((e) => e.podcastId === filters.podcastId).map((e) => e.id);
            items = publishedArticles.filter((a) => a.episodeId && epIds.includes(a.episodeId)).slice(0, max);
          }
        } else if (section.contentRule === "video") {
          const videoEps = publishedEpisodes.filter((e) => e.episodeType === "video" || e.episodeType === "both");
          items = videoEps.slice(0, max).map((ep) => ({
            ...ep,
            isEpisode: true,
            podcastTitle: podcastMap.get(ep.podcastId)?.title,
            podcastCoverImage: podcastMap.get(ep.podcastId)?.coverImage,
          }));
        } else {
          items = publishedArticles.slice(0, max);
        }

        const enrichedItems = items.map((item) => {
          if ((item as any).isEpisode) return item;
          const episode = item.episodeId ? allEpisodes.find((e) => e.id === item.episodeId) : null;
          const podcast = episode?.podcastId ? podcastMap.get(episode.podcastId) : null;
          return {
            ...item,
            podcastId: podcast?.id,
            podcastTitle: podcast?.title,
            podcastCoverImage: podcast?.coverImage,
          };
        });

        return {
          ...section,
          items: enrichedItems,
        };
      });

      const defaultSections = resolvedSections.length > 0 ? resolvedSections : [
        {
          id: "default-featured",
          name: "Featured Stories",
          sectionType: "hero",
          contentRule: "latest",
          displayOrder: 0,
          maxItems: 1,
          active: true,
          showImages: true,
          layout: "full_width",
          items: publishedArticles.slice(0, 1).map((a) => {
            const ep = a.episodeId ? allEpisodes.find((e) => e.id === a.episodeId) : null;
            const p = ep?.podcastId ? podcastMap.get(ep.podcastId) : null;
            return { ...a, podcastId: p?.id, podcastTitle: p?.title, podcastCoverImage: p?.coverImage };
          }),
        },
        {
          id: "default-latest",
          name: "Latest Stories",
          sectionType: "grid",
          contentRule: "latest",
          displayOrder: 1,
          maxItems: 6,
          active: true,
          showImages: true,
          layout: "with_sidebar",
          items: publishedArticles.slice(1, 7).map((a) => {
            const ep = a.episodeId ? allEpisodes.find((e) => e.id === a.episodeId) : null;
            const p = ep?.podcastId ? podcastMap.get(ep.podcastId) : null;
            return { ...a, podcastId: p?.id, podcastTitle: p?.title, podcastCoverImage: p?.coverImage };
          }),
        },
        {
          id: "default-trending",
          name: "Trending",
          sectionType: "list",
          contentRule: "trending",
          displayOrder: 2,
          maxItems: 5,
          active: true,
          showImages: false,
          layout: "full_width",
          items: publishedArticles.slice(0, 5).map((a) => {
            const ep = a.episodeId ? allEpisodes.find((e) => e.id === a.episodeId) : null;
            const p = ep?.podcastId ? podcastMap.get(ep.podcastId) : null;
            return { ...a, podcastId: p?.id, podcastTitle: p?.title, podcastCoverImage: p?.coverImage };
          }),
        },
      ];

      res.json({
        sections: defaultSections,
        podcasts: allPodcasts.map((p) => ({ id: p.id, title: p.title, coverImage: p.coverImage })),
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/news-layout-sections/smart-suggest", requirePermission("customize.edit"), async (_req, res) => {
    try {
      const allPodcasts = await storage.getPodcasts();
      const allContent = await storage.getContentPieces();
      const allEpisodes = await storage.getEpisodes();

      const publishedArticles = allContent.filter((c) => (c.type === "article" || c.type === "blog") && c.status === "ready");
      const videoEpisodes = allEpisodes.filter((e) => (e.episodeType === "video" || e.episodeType === "both") && e.publishedAt);

      const suggestions: any[] = [];
      let order = 0;

      suggestions.push({
        name: "Featured Story",
        sectionType: "hero",
        contentRule: "latest",
        contentFilters: {},
        displayOrder: order++,
        maxItems: 1,
        active: true,
        showImages: true,
        layout: "full_width",
      });

      suggestions.push({
        name: "Latest Stories",
        sectionType: "grid",
        contentRule: "latest",
        contentFilters: {},
        displayOrder: order++,
        maxItems: 6,
        active: true,
        showImages: true,
        layout: "with_sidebar",
      });

      if (publishedArticles.length > 8) {
        suggestions.push({
          name: "Trending Now",
          sectionType: "numbered_list",
          contentRule: "trending",
          contentFilters: {},
          displayOrder: order++,
          maxItems: 5,
          active: true,
          showImages: false,
          layout: "full_width",
        });
      }

      if (videoEpisodes.length > 0) {
        suggestions.push({
          name: "Video Spotlight",
          sectionType: "carousel",
          contentRule: "video",
          contentFilters: {},
          displayOrder: order++,
          maxItems: 4,
          active: true,
          showImages: true,
          layout: "full_width",
        });
      }

      for (const podcast of allPodcasts.slice(0, 3)) {
        const epIds = allEpisodes.filter((e) => e.podcastId === podcast.id).map((e) => e.id);
        const podcastArticles = publishedArticles.filter((a) => a.episodeId && epIds.includes(a.episodeId));
        if (podcastArticles.length >= 2) {
          suggestions.push({
            name: podcast.title,
            sectionType: "list",
            contentRule: "by_podcast",
            contentFilters: { podcastId: podcast.id },
            displayOrder: order++,
            maxItems: 4,
            active: true,
            showImages: true,
            layout: "with_sidebar",
          });
        }
      }

      suggestions.push({
        name: "Editor's Picks",
        sectionType: "grid",
        contentRule: "editors_pick",
        contentFilters: {},
        pinnedArticleIds: publishedArticles.slice(0, 3).map((a) => a.id),
        displayOrder: order++,
        maxItems: 3,
        active: true,
        showImages: true,
        layout: "full_width",
      });

      res.json({ suggestions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ── Platform Settings ──
  app.get("/api/settings", requirePermission("settings.view"), async (_req, res) => {
    const data = await storage.getSettings();
    res.json(data || {
      timezone: "America/New_York",
      dateFormat: "MM/DD/YYYY",
      defaultLanguage: "en",
      autoPublishContent: false,
      contentTypes: ["video_clip", "article", "social_post", "newsletter", "seo_asset"],
      defaultPlatforms: ["TikTok", "Reels", "Shorts", "X", "LinkedIn"],
      aiQuality: "balanced",
      contentTone: "professional",
      articleWordCount: 800,
      socialPostLength: "medium",
      maxClipDuration: 60,
      transcriptionLanguage: "auto",
      seoKeywordDensity: "moderate",
      newsletterFrequency: "weekly",
      contentApprovalRequired: true,
      emailNotifications: true,
      alertThreshold: "all",
      weeklyDigest: true,
      revenueAlerts: true,
      processingAlerts: true,
      crmAlerts: true,
      systemAlerts: true,
      pushNotifications: false,
      quietHoursEnabled: false,
      quietHoursStart: "22:00",
      quietHoursEnd: "07:00",
      notificationDigestTime: "09:00",
      sessionTimeoutMinutes: 10080,
      maxLoginAttempts: 5,
      requireStrongPasswords: true,
      twoFactorEnabled: false,
      passwordExpiryDays: 0,
      ipAllowlist: null,
      auditLogEnabled: true,
      dataRetentionDays: 365,
      apiKeysEnabled: false,
    });
  });

  app.put("/api/settings", requirePermission("settings.edit"), async (req, res) => {
    const parsed = insertPlatformSettingsSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const data = await storage.upsertSettings(parsed.data);
    res.json(data);
  });

  app.post("/api/settings/smart-defaults", requirePermission("settings.edit"), async (req, res) => {
    const companyLocation = typeof req.body?.companyLocation === "string" ? req.body.companyLocation : "";
    const browserTimezone = typeof req.body?.browserTimezone === "string" ? req.body.browserTimezone : "";
    const browserLanguage = typeof req.body?.browserLanguage === "string" ? req.body.browserLanguage : "en";
    const accounts = await storage.getSocialAccounts();
    const connectedPlatforms = accounts.filter(a => a.status === "connected").map(a => a.platform);

    const LOCATION_TIMEZONE_MAP: Record<string, { timezone: string; dateFormat: string; language: string }> = {
      "US": { timezone: "America/New_York", dateFormat: "MM/DD/YYYY", language: "en" },
      "USA": { timezone: "America/New_York", dateFormat: "MM/DD/YYYY", language: "en" },
      "United States": { timezone: "America/New_York", dateFormat: "MM/DD/YYYY", language: "en" },
      "New York": { timezone: "America/New_York", dateFormat: "MM/DD/YYYY", language: "en" },
      "Los Angeles": { timezone: "America/Los_Angeles", dateFormat: "MM/DD/YYYY", language: "en" },
      "California": { timezone: "America/Los_Angeles", dateFormat: "MM/DD/YYYY", language: "en" },
      "Chicago": { timezone: "America/Chicago", dateFormat: "MM/DD/YYYY", language: "en" },
      "Denver": { timezone: "America/Denver", dateFormat: "MM/DD/YYYY", language: "en" },
      "Colorado": { timezone: "America/Denver", dateFormat: "MM/DD/YYYY", language: "en" },
      "Texas": { timezone: "America/Chicago", dateFormat: "MM/DD/YYYY", language: "en" },
      "Florida": { timezone: "America/New_York", dateFormat: "MM/DD/YYYY", language: "en" },
      "Alaska": { timezone: "America/Anchorage", dateFormat: "MM/DD/YYYY", language: "en" },
      "Hawaii": { timezone: "Pacific/Honolulu", dateFormat: "MM/DD/YYYY", language: "en" },
      "Canada": { timezone: "America/New_York", dateFormat: "MM/DD/YYYY", language: "en" },
      "Toronto": { timezone: "America/New_York", dateFormat: "MM/DD/YYYY", language: "en" },
      "Vancouver": { timezone: "America/Los_Angeles", dateFormat: "MM/DD/YYYY", language: "en" },
      "UK": { timezone: "Europe/London", dateFormat: "DD/MM/YYYY", language: "en" },
      "London": { timezone: "Europe/London", dateFormat: "DD/MM/YYYY", language: "en" },
      "United Kingdom": { timezone: "Europe/London", dateFormat: "DD/MM/YYYY", language: "en" },
      "France": { timezone: "Europe/Paris", dateFormat: "DD/MM/YYYY", language: "fr" },
      "Paris": { timezone: "Europe/Paris", dateFormat: "DD/MM/YYYY", language: "fr" },
      "Germany": { timezone: "Europe/Berlin", dateFormat: "DD/MM/YYYY", language: "de" },
      "Berlin": { timezone: "Europe/Berlin", dateFormat: "DD/MM/YYYY", language: "de" },
      "Spain": { timezone: "Europe/Paris", dateFormat: "DD/MM/YYYY", language: "es" },
      "Madrid": { timezone: "Europe/Paris", dateFormat: "DD/MM/YYYY", language: "es" },
      "Portugal": { timezone: "Europe/London", dateFormat: "DD/MM/YYYY", language: "pt" },
      "Brazil": { timezone: "America/New_York", dateFormat: "DD/MM/YYYY", language: "pt" },
      "Japan": { timezone: "Asia/Tokyo", dateFormat: "YYYY-MM-DD", language: "ja" },
      "Tokyo": { timezone: "Asia/Tokyo", dateFormat: "YYYY-MM-DD", language: "ja" },
      "China": { timezone: "Asia/Shanghai", dateFormat: "YYYY-MM-DD", language: "zh" },
      "Shanghai": { timezone: "Asia/Shanghai", dateFormat: "YYYY-MM-DD", language: "zh" },
      "Dubai": { timezone: "Asia/Dubai", dateFormat: "DD/MM/YYYY", language: "en" },
      "UAE": { timezone: "Asia/Dubai", dateFormat: "DD/MM/YYYY", language: "en" },
      "Australia": { timezone: "Australia/Sydney", dateFormat: "DD/MM/YYYY", language: "en" },
      "Sydney": { timezone: "Australia/Sydney", dateFormat: "DD/MM/YYYY", language: "en" },
      "New Zealand": { timezone: "Pacific/Auckland", dateFormat: "DD/MM/YYYY", language: "en" },
    };

    let timezone = browserTimezone || "America/New_York";
    let dateFormat = "MM/DD/YYYY";
    let language = browserLanguage?.split("-")[0] || "en";

    if (companyLocation) {
      const loc = companyLocation.trim();
      for (const [key, val] of Object.entries(LOCATION_TIMEZONE_MAP)) {
        if (loc.toLowerCase().includes(key.toLowerCase())) {
          timezone = val.timezone;
          dateFormat = val.dateFormat;
          language = val.language;
          break;
        }
      }
    }

    const PLATFORM_TO_DIST: Record<string, string[]> = {
      x: ["X"],
      facebook: ["Facebook"],
      instagram: ["Reels"],
      linkedin: ["LinkedIn"],
      tiktok: ["TikTok"],
      google_business: [],
    };
    let defaultPlatforms = ["TikTok", "Reels", "Shorts", "X", "LinkedIn"];
    if (connectedPlatforms.length > 0) {
      const suggested = new Set<string>(["Shorts"]);
      connectedPlatforms.forEach(p => {
        const mapped = PLATFORM_TO_DIST[p];
        if (mapped) mapped.forEach(d => suggested.add(d));
      });
      defaultPlatforms = Array.from(suggested);
    }

    const hasVideoFocused = connectedPlatforms.some(p => ["tiktok", "instagram"].includes(p));
    let contentTypes = ["video_clip", "article", "social_post", "newsletter", "seo_asset"];
    const aiQuality = hasVideoFocused ? "premium" : "balanced";

    const smartSettings: Record<string, any> = {
      companyLocation: companyLocation || null,
      timezone,
      dateFormat,
      defaultLanguage: language,
      defaultPlatforms,
      contentTypes,
      aiQuality,
      autoPublishContent: false,
      emailNotifications: true,
      alertThreshold: connectedPlatforms.length >= 4 ? "important" : "all",
      weeklyDigest: true,
      revenueAlerts: true,
      processingAlerts: true,
      sessionTimeoutMinutes: 10080,
      maxLoginAttempts: 5,
      requireStrongPasswords: true,
      twoFactorEnabled: false,
    };

    const reasons: Record<string, string> = {
      timezone: companyLocation ? `Based on "${companyLocation}" location` : "Detected from your browser",
      dateFormat: companyLocation ? `Standard format for ${companyLocation}` : "Based on detected timezone region",
      defaultLanguage: companyLocation ? `Primary language for ${companyLocation}` : "Detected from your browser",
      defaultPlatforms: connectedPlatforms.length > 0 ? `Based on ${connectedPlatforms.length} connected account(s)` : "Default recommended platforms",
      contentTypes: "All content types recommended for maximum reach",
      aiQuality: hasVideoFocused ? "Premium recommended for video-focused distribution" : "Balanced quality for general content",
      alertThreshold: connectedPlatforms.length >= 4 ? "Important-only recommended with many connected platforms" : "All alerts for full visibility",
    };

    res.json({ settings: smartSettings, reasons });
  });

  // ── Audit Logs ──
  app.get("/api/audit-logs", requirePermission("settings.view"), async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const offset = parseInt(req.query.offset as string) || 0;
    const [logs, count] = await Promise.all([
      storage.getAuditLogs(limit, offset),
      storage.getAuditLogCount(),
    ]);
    res.json({ logs, total: count });
  });

  // ── API Keys ──
  app.get("/api/api-keys", requirePermission("settings.view"), async (_req, res) => {
    const keys = await storage.getApiKeys();
    const safe = keys.map(k => ({ ...k, keyHash: undefined }));
    res.json(safe);
  });

  app.post("/api/api-keys", requirePermission("settings.edit"), async (req, res) => {
    const { name, permissions, expiresAt } = req.body;
    if (!name || typeof name !== "string") return res.status(400).json({ message: "Name is required" });
    const rawKey = `mte_${crypto.randomBytes(24).toString("hex")}`;
    const keyPrefix = rawKey.slice(0, 12) + "...";
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const user = (req as any).user;
    const key = await storage.createApiKey({
      name,
      keyPrefix,
      keyHash,
      permissions: permissions || [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdById: user?.id || null,
    });
    await storage.createAuditLog({
      userId: user?.id, userName: user?.displayName || user?.username,
      action: "create", resource: "api_key", resourceId: key.id,
      details: `Created API key "${name}"`,
      ipAddress: req.ip || null,
    });
    res.json({ ...key, keyHash: undefined, rawKey });
  });

  app.post("/api/api-keys/:id/revoke", requirePermission("settings.edit"), async (req, res) => {
    const key = await storage.revokeApiKey(req.params.id);
    if (!key) return res.status(404).json({ message: "API key not found" });
    const user = (req as any).user;
    await storage.createAuditLog({
      userId: user?.id, userName: user?.displayName || user?.username,
      action: "revoke", resource: "api_key", resourceId: key.id,
      details: `Revoked API key "${key.name}"`,
      ipAddress: req.ip || null,
    });
    res.json({ ...key, keyHash: undefined });
  });

  app.delete("/api/api-keys/:id", requirePermission("settings.edit"), async (req, res) => {
    const user = (req as any).user;
    await storage.deleteApiKey(req.params.id);
    await storage.createAuditLog({
      userId: user?.id, userName: user?.displayName || user?.username,
      action: "delete", resource: "api_key", resourceId: req.params.id,
      details: "Deleted API key",
      ipAddress: req.ip || null,
    });
    res.json({ success: true });
  });

  // ── Subscribers CRM ──
  app.get("/api/subscribers", requireAuth, requirePermission("audience.view"), async (req, res) => {
    const podcastId = req.query.podcastId as string | undefined;
    if (podcastId) {
      const subs = await storage.getSubscribersByPodcast(podcastId);
      return res.json(subs);
    }
    const subs = await storage.getSubscribers();
    res.json(subs);
  });

  app.get("/api/subscribers/:id", requireAuth, requirePermission("audience.view"), async (req, res) => {
    const sub = await storage.getSubscriber(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscriber not found" });
    const podcastLinks = await storage.getSubscriberPodcasts(sub.id);
    const allPodcasts = await storage.getPodcasts();
    const subscribedPodcasts = allPodcasts.filter(p => podcastLinks.some(l => l.podcastId === p.id));
    const otherPodcasts = allPodcasts.filter(p => !podcastLinks.some(l => l.podcastId === p.id));
    res.json({ ...sub, subscribedPodcasts, suggestedPodcasts: otherPodcasts });
  });

  app.post("/api/subscribers", requireAuth, requirePermission("audience.view"), async (req, res) => {
    const { podcastIds, ...subscriberData } = req.body;
    const parsed = insertSubscriberSchema.safeParse(subscriberData);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const sub = await storage.createSubscriber(parsed.data);
    if (podcastIds && Array.isArray(podcastIds)) {
      for (const pid of podcastIds) {
        await storage.addSubscriberToPodcast({ subscriberId: sub.id, podcastId: pid });
      }
    }
    res.status(201).json(sub);
  });

  app.patch("/api/subscribers/:id", requireAuth, requirePermission("audience.view"), async (req, res) => {
    const { podcastIds, ...updateData } = req.body;
    const parsed = insertSubscriberSchema.partial().safeParse(updateData);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const updated = await storage.updateSubscriber(req.params.id, parsed.data);
    if (!updated) return res.status(404).json({ message: "Subscriber not found" });
    if (podcastIds && Array.isArray(podcastIds)) {
      const existing = await storage.getSubscriberPodcasts(req.params.id);
      const existingIds = existing.map(e => e.podcastId);
      for (const pid of podcastIds) {
        if (!existingIds.includes(pid)) {
          await storage.addSubscriberToPodcast({ subscriberId: req.params.id, podcastId: pid });
        }
      }
      for (const eid of existingIds) {
        if (!podcastIds.includes(eid)) {
          await storage.removeSubscriberFromPodcast(req.params.id, eid);
        }
      }
    }
    res.json(updated);
  });

  app.delete("/api/subscribers/:id", requireAuth, requirePermission("audience.view"), async (req, res) => {
    await storage.deleteSubscriber(req.params.id);
    res.status(204).send();
  });

  app.post("/api/subscribers/:id/podcasts", requireAuth, requirePermission("audience.view"), async (req, res) => {
    const { podcastId } = req.body;
    if (!podcastId) return res.status(400).json({ message: "podcastId required" });
    const link = await storage.addSubscriberToPodcast({ subscriberId: req.params.id, podcastId });
    res.status(201).json(link);
  });

  app.delete("/api/subscribers/:id/podcasts/:podcastId", requireAuth, requirePermission("audience.view"), async (req, res) => {
    await storage.removeSubscriberFromPodcast(req.params.id, req.params.podcastId);
    res.status(204).send();
  });

  // ── Subscriber Social Profile Analyzer ──
  app.post("/api/subscribers/analyze-social", requireAuth, requirePermission("audience.view"), async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "Social profile URL is required" });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    try {
      const parsed = new URL(targetUrl);
      const hostname = parsed.hostname.toLowerCase();
      const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "::1", "metadata.google.internal", "169.254.169.254"];
      if (blockedHosts.includes(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal") || /^10\./.test(hostname) || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) || /^192\.168\./.test(hostname)) {
        return res.status(400).json({ message: "Internal/private URLs are not allowed" });
      }

      let platform = "unknown";
      if (hostname.includes("linkedin.com")) platform = "linkedin";
      else if (hostname.includes("twitter.com") || hostname.includes("x.com")) platform = "twitter";
      else if (hostname.includes("facebook.com") || hostname.includes("fb.com")) platform = "facebook";

      if (platform === "unknown") {
        return res.status(400).json({ message: "Please provide a LinkedIn, X, or Facebook profile URL" });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(400).json({ message: `Could not reach profile (HTTP ${response.status})` });
      }

      const html = await response.text();

      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
      const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
        || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);

      let profilePhoto = ogImageMatch?.[1] || twitterImageMatch?.[1] || null;
      if (profilePhoto && (profilePhoto.includes("static.licdn.com/aero") || profilePhoto.includes("default-avatar") || profilePhoto.includes("/company-logo") || profilePhoto.includes("ghost-person"))) {
        profilePhoto = null;
      }

      const rawTitle = (ogTitleMatch?.[1] || "")
        .replace(/\s*[-–|]\s*(LinkedIn|X|Facebook).*$/i, "")
        .replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();

      let name = rawTitle;
      let jobTitle = "";
      const titleParts = rawTitle.split(" - ");
      if (titleParts.length >= 2) {
        name = titleParts[0].trim();
        jobTitle = titleParts[1].trim();
      }
      const nameParts = name.split(/\s+/);
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      const bio = (ogDescMatch?.[1] || "")
        .replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
        .replace(/View [^']*profile.*$/i, "").replace(/(LinkedIn|X|Facebook).*$/i, "")
        .trim().slice(0, 500);

      const result: any = { profilePhoto, firstName, lastName, title: jobTitle, bio, platform };
      if (platform === "linkedin") result.linkedinUrl = targetUrl;
      else if (platform === "twitter") result.twitterUrl = targetUrl;
      else if (platform === "facebook") result.facebookUrl = targetUrl;

      res.json(result);
    } catch (err: any) {
      if (err.name === "AbortError") {
        return res.status(408).json({ message: "Request timed out" });
      }
      return res.status(500).json({ message: "Failed to analyze social profile" });
    }
  });

  app.get("/api/subscribers/:id/recent-episodes", requireAuth, requirePermission("audience.view"), async (req, res) => {
    const sub = await storage.getSubscriber(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscriber not found" });
    const podcastLinks = await storage.getSubscriberPodcasts(sub.id);
    const podcastIds = podcastLinks.map(l => l.podcastId);
    if (podcastIds.length === 0) return res.json([]);
    const allEpisodes = await storage.getEpisodes();
    const recentEpisodes = allEpisodes
      .filter(ep => podcastIds.includes(ep.podcastId))
      .sort((a, b) => {
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 20);
    const allPodcasts = await storage.getPodcasts();
    const podcastMap = Object.fromEntries(allPodcasts.map(p => [p.id, p]));
    const result = recentEpisodes.map(ep => ({
      id: ep.id,
      title: ep.title,
      description: ep.description,
      duration: ep.duration,
      publishedAt: ep.publishedAt,
      thumbnailUrl: ep.thumbnailUrl,
      episodeType: ep.episodeType,
      podcastId: ep.podcastId,
      podcastTitle: podcastMap[ep.podcastId]?.title || "Unknown",
      podcastCoverImage: podcastMap[ep.podcastId]?.coverImage || null,
    }));
    res.json(result);
  });

  // ── Smart Suggestions (Cross-Pollination) ──
  app.get("/api/subscribers/:id/suggestions", requireAuth, requirePermission("audience.view"), async (req, res) => {
    const sub = await storage.getSubscriber(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subscriber not found" });

    const podcastLinks = await storage.getSubscriberPodcasts(sub.id);
    const subscribedPodcastIds = podcastLinks.map(l => l.podcastId);
    const allPodcasts = await storage.getPodcasts();
    const subscribedPodcasts = allPodcasts.filter(p => subscribedPodcastIds.includes(p.id));
    const otherPodcasts = allPodcasts.filter(p => !subscribedPodcastIds.includes(p.id) && p.status === "active");

    const suggestions = otherPodcasts.map(podcast => {
      let score = 50;
      let reasons: string[] = [];

      const subInterests = (sub.interests || []).map(i => i.toLowerCase());
      const subTags = (sub.tags || []).map(t => t.toLowerCase());

      const podcastKeywords = [
        podcast.title.toLowerCase(),
        (podcast.host || "").toLowerCase(),
        (podcast.description || "").toLowerCase(),
      ].join(" ");

      for (const interest of subInterests) {
        if (podcastKeywords.includes(interest)) {
          score += 15;
          reasons.push(`Matches interest: ${interest}`);
        }
      }
      for (const tag of subTags) {
        if (podcastKeywords.includes(tag)) {
          score += 10;
          reasons.push(`Related topic: ${tag}`);
        }
      }

      if (podcast.subscribers && podcast.subscribers > 100000) {
        score += 10;
        reasons.push("Popular show (100K+ subscribers)");
      }
      if (podcast.growthPercent && podcast.growthPercent > 5) {
        score += 10;
        reasons.push(`Trending (${podcast.growthPercent}% growth)`);
      }

      for (const sp of subscribedPodcasts) {
        const existingDesc = (sp.description || "").toLowerCase();
        const candidateDesc = (podcast.description || "").toLowerCase();
        const words = existingDesc.split(/\s+/).filter(w => w.length > 4);
        const matches = words.filter(w => candidateDesc.includes(w)).length;
        if (matches > 3) {
          score += 15;
          reasons.push(`Similar to "${sp.title}"`);
        }
      }

      if (reasons.length === 0) {
        reasons.push("Expand their network with new perspectives");
      }

      return { podcast, score: Math.min(score, 100), reasons };
    });

    suggestions.sort((a, b) => b.score - a.score);
    res.json(suggestions.slice(0, 10));
  });

  // ── Public Podcasts (no auth - for audience navigation) ──
  app.get("/api/public/podcasts", async (_req, res) => {
    const all = await storage.getPodcasts();
    const active = all.filter(p => p.status === "active").map(p => ({
      id: p.id,
      title: p.title,
      host: p.host,
      description: p.description,
      coverImage: p.coverImage,
      subscribers: p.subscribers,
    }));
    res.json(active);
  });

  // ── Outbound Campaigns (auth-gated) ──
  app.get("/api/outbound-campaigns", requireAuth, async (req, res) => {
    const audience = req.query.audience as string | undefined;
    const campaigns = await storage.getOutboundCampaigns(audience);
    res.json(campaigns);
  });

  app.get("/api/outbound-campaigns/:id", requireAuth, async (req, res) => {
    const campaign = await storage.getOutboundCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(campaign);
  });

  app.post("/api/outbound-campaigns", requireAuth, async (req, res) => {
    const parsed = insertOutboundCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const campaign = await storage.createOutboundCampaign({ ...parsed.data, createdBy: (req.user as any)?.id });
    res.status(201).json(campaign);
  });

  app.patch("/api/outbound-campaigns/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateOutboundCampaign(req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: "Campaign not found" });
    res.json(updated);
  });

  app.delete("/api/outbound-campaigns/:id", requireAuth, async (req, res) => {
    await storage.deleteOutboundCampaign(req.params.id);
    res.status(204).send();
  });

  app.get("/api/outbound-campaigns/:id/recipients", requireAuth, async (req, res) => {
    const campaign = await storage.getOutboundCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    const channelType = campaign.type as "email" | "sms";
    if (campaign.audience === "subscribers") {
      const recipients = await storage.getConsentedSubscribers(channelType, campaign.podcastFilter || undefined);
      res.json({ count: recipients.length, recipients: recipients.map(r => ({ id: r.id, name: `${r.firstName || ""} ${r.lastName || ""}`.trim(), email: r.email, phone: r.phone })) });
    } else {
      const recipients = await storage.getConsentedContacts(channelType);
      res.json({ count: recipients.length, recipients: recipients.map(r => ({ id: r.id, name: `${r.firstName || ""} ${r.lastName || ""}`.trim(), email: r.email, phone: r.phone })) });
    }
  });

  app.post("/api/outbound-campaigns/:id/send", requireAuth, async (req, res) => {
    const campaign = await storage.getOutboundCampaign(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });
    if (campaign.status === "sending" || campaign.status === "sent") {
      return res.status(400).json({ message: "Campaign already sent or in progress" });
    }
    const channelType = campaign.type as "email" | "sms";
    let recipients: { email?: string | null; phone?: string | null; id: string }[];
    if (campaign.audience === "subscribers") {
      recipients = await storage.getConsentedSubscribers(channelType, campaign.podcastFilter || undefined);
    } else {
      recipients = await storage.getConsentedContacts(channelType);
    }
    if (recipients.length === 0) {
      return res.status(400).json({ message: "No consented recipients found. Recipients must opt-in to marketing before you can send campaigns." });
    }
    await storage.updateOutboundCampaign(campaign.id, { status: "sending", recipientCount: recipients.length } as any);

    let sentCount = 0;
    let failedCount = 0;
    for (const recipient of recipients) {
      try {
        if (channelType === "email" && recipient.email) {
          const sgKey = process.env.SENDGRID_API_KEY;
          if (sgKey) {
            const sgRes = await fetch("https://api.sendgrid.com/v3/mail/send", {
              method: "POST",
              headers: { Authorization: `Bearer ${sgKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                personalizations: [{ to: [{ email: recipient.email }] }],
                from: { email: process.env.SENDGRID_FROM_EMAIL || "noreply@mediatech.com", name: "MediaTech Empire" },
                subject: campaign.subject || campaign.name,
                content: [{ type: "text/html", value: campaign.body }],
              }),
            });
            if (sgRes.ok || sgRes.status === 202) { sentCount++; } else { failedCount++; }
          } else {
            sentCount++;
          }
        } else if (channelType === "sms" && recipient.phone) {
          const twilioSid = process.env.TWILIO_ACCOUNT_SID;
          const twilioToken = process.env.TWILIO_AUTH_TOKEN;
          const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
          if (twilioSid && twilioToken && twilioFrom) {
            const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`, {
              method: "POST",
              headers: {
                Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({ To: recipient.phone, From: twilioFrom, Body: campaign.body }).toString(),
            });
            if (twilioRes.ok) { sentCount++; } else { failedCount++; }
          } else {
            sentCount++;
          }
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }
    await storage.updateOutboundCampaign(campaign.id, {
      status: "sent",
      sentCount,
      failedCount,
      recipientCount: recipients.length,
    } as any);
    res.json({ message: "Campaign sent", sentCount, failedCount, recipientCount: recipients.length });
  });

  // ── Campaign Emails (cadence steps) ──
  app.get("/api/outbound-campaigns/:campaignId/emails", requireAuth, async (req, res) => {
    const data = await storage.getCampaignEmails(req.params.campaignId);
    res.json(data);
  });

  app.post("/api/outbound-campaigns/:campaignId/emails", requireAuth, async (req, res) => {
    const parsed = insertCampaignEmailSchema.safeParse({ ...req.body, campaignId: req.params.campaignId });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.createCampaignEmail(parsed.data);
    res.json(data);
  });

  app.patch("/api/campaign-emails/:id", requireAuth, async (req, res) => {
    const parsed = insertCampaignEmailSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.updateCampaignEmail(req.params.id, parsed.data);
    if (!data) return res.status(404).json({ message: "Email not found" });
    res.json(data);
  });

  app.delete("/api/campaign-emails/:id", requireAuth, async (req, res) => {
    await storage.deleteCampaignEmail(req.params.id);
    res.status(204).send();
  });

  app.put("/api/outbound-campaigns/:campaignId/emails/reorder", requireAuth, async (req, res) => {
    const { emailIds } = req.body;
    if (!Array.isArray(emailIds)) return res.status(400).json({ message: "Expected emailIds array" });
    await storage.reorderCampaignEmails(req.params.campaignId, emailIds);
    const data = await storage.getCampaignEmails(req.params.campaignId);
    res.json(data);
  });

  // ── Public Subscription Check + Smart Recommendations (no auth) ──
  app.post("/api/public/check-subscription", async (req, res) => {
    const { email, podcastId } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    const subscriber = await storage.getSubscriberByEmail(email.trim().toLowerCase());
    if (!subscriber) {
      return res.json({ subscribed: false, subscribedPodcastIds: [], recommendations: [] });
    }
    const podcastLinks = await storage.getSubscriberPodcasts(subscriber.id);
    const subscribedPodcastIds = podcastLinks.map(l => l.podcastId);
    const isSubscribedToThis = podcastId ? subscribedPodcastIds.includes(podcastId) : false;

    const allPodcasts = await storage.getPodcasts();
    const subscribedPodcasts = allPodcasts.filter(p => subscribedPodcastIds.includes(p.id));
    const otherPodcasts = allPodcasts.filter(p => !subscribedPodcastIds.includes(p.id) && p.status === "active");

    const subInterests = (subscriber.interests || []).map(i => i.toLowerCase());
    const subTags = (subscriber.tags || []).map(t => t.toLowerCase());

    const subscribedKeywords = subscribedPodcasts.flatMap(sp => {
      const words = ((sp.description || "") + " " + (sp.title || "")).toLowerCase().split(/\s+/).filter(w => w.length > 4);
      return words;
    });
    const keywordFreq = new Map<string, number>();
    subscribedKeywords.forEach(w => keywordFreq.set(w, (keywordFreq.get(w) || 0) + 1));
    const topKeywords = [...keywordFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([w]) => w);

    const recommendations = otherPodcasts.map(podcast => {
      let score = 0;
      const reasons: string[] = [];

      const podcastText = [podcast.title, podcast.host || "", podcast.description || ""].join(" ").toLowerCase();

      for (const interest of subInterests) {
        if (podcastText.includes(interest)) {
          score += 20;
          reasons.push(`Matches your interest in "${interest}"`);
        }
      }
      for (const tag of subTags) {
        if (podcastText.includes(tag)) {
          score += 12;
          reasons.push(`Related to "${tag}"`);
        }
      }

      let kwMatches = 0;
      for (const kw of topKeywords) {
        if (podcastText.includes(kw)) kwMatches++;
      }
      if (kwMatches >= 3) {
        score += Math.min(kwMatches * 5, 25);
        const similar = subscribedPodcasts.find(sp => {
          const spText = ((sp.description || "") + " " + sp.title).toLowerCase();
          return topKeywords.filter(kw => spText.includes(kw) && podcastText.includes(kw)).length >= 2;
        });
        if (similar) reasons.push(`Similar to "${similar.title}"`);
      }

      if (podcast.subscribers && podcast.subscribers > 50000) {
        score += 8;
        reasons.push("Popular show");
      }
      if (podcast.growthPercent && podcast.growthPercent > 5) {
        score += 10;
        reasons.push("Trending now");
      }

      if (reasons.length === 0 && score === 0) {
        score = 10;
        reasons.push("Discover something new");
      }

      return {
        id: podcast.id,
        title: podcast.title,
        host: podcast.host,
        coverImage: podcast.coverImage,
        subscribers: podcast.subscribers,
        growthPercent: podcast.growthPercent,
        description: podcast.description,
        score: Math.min(score, 100),
        reasons: reasons.slice(0, 3),
      };
    });

    recommendations.sort((a, b) => b.score - a.score);

    res.json({
      subscribed: isSubscribedToThis,
      subscribedPodcastIds,
      subscriberName: subscriber.firstName || null,
      recommendations: recommendations.slice(0, 6),
    });
  });

  // ── Public Subscribe (no auth - for visitor widgets on story/episode pages) ──
  app.post("/api/public/subscribe", async (req, res) => {
    const { email, firstName, lastName, podcastId, source, marketingConsent, smsConsent } = req.body;
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ message: "Valid email is required" });
    }
    const consentFields: any = {};
    if (marketingConsent) {
      consentFields.marketingConsent = true;
      consentFields.marketingConsentAt = new Date();
    }
    if (smsConsent) {
      consentFields.smsConsent = true;
      consentFields.smsConsentAt = new Date();
    }
    const existing = await storage.getSubscriberByEmail(email.trim().toLowerCase());
    if (existing) {
      if (Object.keys(consentFields).length > 0 && (!existing.marketingConsent || !existing.smsConsent)) {
        await storage.updateSubscriber(existing.id, consentFields);
      }
      if (podcastId) {
        const links = await storage.getSubscriberPodcasts(existing.id);
        if (!links.find(l => l.podcastId === podcastId)) {
          await storage.addSubscriberToPodcast({ subscriberId: existing.id, podcastId });
          await storage.incrementPodcastSubscribers(podcastId);
        }
      }
      return res.json({ message: "Subscribed successfully", alreadyExisted: true });
    }
    const sub = await storage.createSubscriber({
      email: email.trim().toLowerCase(),
      firstName: firstName?.trim() || null,
      lastName: lastName?.trim() || null,
      source: source || "website_widget",
      status: "active",
      ...consentFields,
    });
    if (podcastId) {
      await storage.addSubscriberToPodcast({ subscriberId: sub.id, podcastId });
      await storage.incrementPodcastSubscribers(podcastId);
    }
    res.status(201).json({ message: "Subscribed successfully", alreadyExisted: false });
  });

  // ── Public Episode Detail (no auth - for public episode pages) ──
  app.get("/api/public/episodes/:id", async (req, res) => {
    const episode = await storage.getEpisode(req.params.id);
    if (!episode) return res.status(404).json({ message: "Episode not found" });
    const podcast = await storage.getPodcast(episode.podcastId);
    const contentPieces = await storage.getContentPieces(episode.id);
    res.json({ episode, podcast, contentPieces });
  });

  // ── Suggested Episodes Algorithm (no auth - for public episode pages) ──
  app.get("/api/public/episodes/:id/suggested", async (req, res) => {
    const limit = Math.max(1, Math.min(parseInt(req.query.limit as string) || 8, 20));
    const currentEpisode = await storage.getEpisode(req.params.id);
    if (!currentEpisode) return res.status(404).json({ message: "Episode not found" });

    const allPodcasts = await storage.getPodcasts();
    const activePodcasts = allPodcasts.filter(p => p.status === "active");
    const podcastMap = new Map(activePodcasts.map(p => [p.id, p]));

    const allEpisodeLists = await Promise.all(
      activePodcasts.map(p => storage.getEpisodes(p.id))
    );
    const allEpisodes = allEpisodeLists.flat()
      .filter(e => e.processingStatus === "complete" && e.id !== currentEpisode.id);

    const now = Date.now();
    const scored = allEpisodes.map(ep => {
      let score = 0;
      const podcast = podcastMap.get(ep.podcastId);

      const sameShow = ep.podcastId === currentEpisode.podcastId;
      if (sameShow) score += 50;

      const epType = ep.episodeType || "audio";
      const curType = currentEpisode.episodeType || "audio";
      if (epType === curType) score += 15;
      if ((epType === "both" || curType === "both") && epType !== curType) score += 8;

      const ageMs = now - new Date(ep.publishedAt || 0).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyScore = Math.max(0, 25 - ageDays * 0.5);
      score += recencyScore;

      if (podcast?.subscribers) {
        score += Math.min(10, Math.log10(podcast.subscribers) * 2);
      }

      if (!sameShow) {
        score += 5;
      }

      return {
        episode: {
          id: ep.id,
          title: ep.title,
          description: ep.description,
          duration: ep.duration,
          videoUrl: ep.videoUrl,
          thumbnailUrl: ep.thumbnailUrl,
          episodeType: ep.episodeType || "audio",
          publishedAt: ep.publishedAt,
        },
        podcast: podcast ? {
          id: podcast.id,
          title: podcast.title,
          host: podcast.host,
          coverImage: podcast.coverImage,
        } : null,
        score,
        sameShow,
      };
    });

    scored.sort((a, b) => b.score - a.score);

    const sameShowEps = scored.filter(s => s.sameShow);
    const crossShowEps = scored.filter(s => !s.sameShow);
    const sameShowSlots = Math.min(Math.ceil(limit * 0.6), sameShowEps.length);
    const crossShowSlots = limit - sameShowSlots;

    const result = [
      ...sameShowEps.slice(0, sameShowSlots),
      ...crossShowEps.slice(0, crossShowSlots),
    ].sort((a, b) => b.score - a.score).slice(0, limit);

    res.json(result.map(({ episode, podcast, sameShow }) => ({
      episode,
      podcast,
      sameShow,
    })));
  });

  // ── Public Episodes by Podcast (no auth) ──
  app.get("/api/public/podcasts/:podcastId/episodes", async (req, res) => {
    const podcast = await storage.getPodcast(req.params.podcastId);
    if (!podcast) return res.status(404).json({ message: "Podcast not found" });
    const episodes = await storage.getEpisodes(req.params.podcastId);
    const published = episodes.filter(e => e.processingStatus === "complete");
    res.json({ podcast, episodes: published });
  });

  app.get("/api/public/shows/:podcastId", async (req, res) => {
    const podcast = await storage.getPodcast(req.params.podcastId);
    if (!podcast || podcast.status !== "active") return res.status(404).json({ message: "Show not found" });
    const allEpisodes = await storage.getEpisodes(req.params.podcastId);
    const publishedEpisodes = allEpisodes
      .filter(e => e.processingStatus === "complete")
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    const allContent = await Promise.all(
      allEpisodes.map(e => storage.getContentPieces(e.id))
    );
    const articles = allContent.flat()
      .filter(c => c.type === "article" && c.status === "ready")
      .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    res.json({
      podcast: {
        id: podcast.id,
        title: podcast.title,
        host: podcast.host,
        description: podcast.description,
        coverImage: podcast.coverImage,
        subscribers: podcast.subscribers,
        growthPercent: podcast.growthPercent,
      },
      episodes: publishedEpisodes.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        duration: e.duration,
        audioUrl: e.audioUrl,
        videoUrl: e.videoUrl,
        thumbnailUrl: e.thumbnailUrl,
        episodeType: e.episodeType || "audio",
        publishedAt: e.publishedAt,
      })),
      articles: articles.map(a => ({
        id: a.id,
        episodeId: a.episodeId,
        title: a.title,
        description: a.description,
        coverImage: a.coverImage,
        slug: a.slug,
        readingTime: a.readingTime,
        authorId: a.authorId,
        publishedAt: a.publishedAt,
      })),
    });
  });

  app.get("/api/public/feed", async (req, res) => {
    const allPodcasts = await storage.getPodcasts();
    const activePodcasts = allPodcasts.filter(p => p.status === "active");

    const allEpisodes: any[] = [];
    const allArticles: any[] = [];

    for (const podcast of activePodcasts) {
      const episodes = await storage.getEpisodes(podcast.id);
      const published = episodes.filter(e => e.processingStatus === "complete");

      for (const ep of published) {
        allEpisodes.push({
          id: ep.id,
          title: ep.title,
          description: ep.description,
          duration: ep.duration,
          videoUrl: ep.videoUrl,
          thumbnailUrl: ep.thumbnailUrl,
          episodeType: ep.episodeType || "audio",
          publishedAt: ep.publishedAt,
          podcastId: podcast.id,
          podcastTitle: podcast.title,
          podcastHost: podcast.host,
          podcastCoverImage: podcast.coverImage,
        });

        const content = await storage.getContentPieces(ep.id);
        const articles = content.filter(c => c.type === "article" && c.status === "ready");
        for (const a of articles) {
          allArticles.push({
            id: a.id,
            title: a.title,
            description: a.description,
            coverImage: a.coverImage,
            readingTime: a.readingTime,
            authorId: a.authorId,
            publishedAt: a.publishedAt,
            podcastId: podcast.id,
            podcastTitle: podcast.title,
            episodeId: ep.id,
          });
        }
      }
    }

    allEpisodes.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
    allArticles.sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());

    res.json({
      episodes: allEpisodes.slice(0, 20),
      articles: allArticles.slice(0, 20),
      podcasts: activePodcasts.map(p => ({
        id: p.id,
        title: p.title,
        host: p.host,
        description: p.description,
        coverImage: p.coverImage,
        subscribers: p.subscribers,
      })),
    });
  });

  app.get("/api/public/search", async (req, res) => {
    const q = (req.query.q as string || "").toLowerCase().trim();
    if (!q) return res.json({ episodes: [], articles: [], podcasts: [] });

    const allPodcasts = await storage.getPodcasts();
    const activePodcasts = allPodcasts.filter(p => p.status === "active");

    const matchingPodcasts = activePodcasts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.host?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    ).map(p => ({
      id: p.id, title: p.title, host: p.host, description: p.description,
      coverImage: p.coverImage, subscribers: p.subscribers,
    }));

    const matchingEpisodes: any[] = [];
    const matchingArticles: any[] = [];

    for (const podcast of activePodcasts) {
      const episodes = await storage.getEpisodes(podcast.id);
      const published = episodes.filter(e => e.processingStatus === "complete");

      for (const ep of published) {
        if (ep.title.toLowerCase().includes(q) || ep.description?.toLowerCase().includes(q)) {
          matchingEpisodes.push({
            id: ep.id, title: ep.title, description: ep.description,
            duration: ep.duration, episodeType: ep.episodeType || "audio",
            thumbnailUrl: ep.thumbnailUrl, publishedAt: ep.publishedAt,
            podcastId: podcast.id, podcastTitle: podcast.title,
            podcastCoverImage: podcast.coverImage,
          });
        }

        const content = await storage.getContentPieces(ep.id);
        const articles = content.filter(c => c.type === "article" && c.status === "ready");
        for (const a of articles) {
          if (a.title.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q)) {
            matchingArticles.push({
              id: a.id, title: a.title, description: a.description,
              coverImage: a.coverImage, readingTime: a.readingTime,
              publishedAt: a.publishedAt, podcastId: podcast.id,
              podcastTitle: podcast.title, episodeId: ep.id,
            });
          }
        }
      }
    }

    res.json({
      podcasts: matchingPodcasts.slice(0, 10),
      episodes: matchingEpisodes.slice(0, 15),
      articles: matchingArticles.slice(0, 15),
    });
  });

  // ── Public Author Profile (no auth) ──
  app.get("/api/public/authors/:id", async (req, res) => {
    const author = await storage.getAuthorPublicProfile(req.params.id);
    if (!author) return res.status(404).json({ message: "Author not found" });
    const articles = await storage.getContentPiecesByAuthor(req.params.id);
    const enrichedArticles = await Promise.all(
      articles.map(async (a) => {
        const episode = await storage.getEpisode(a.episodeId);
        const podcast = episode ? await storage.getPodcast(episode.podcastId) : null;
        return { ...a, episode, podcast };
      })
    );
    res.json({ author, articles: enrichedArticles });
  });

  // ── Commercial CRM: Companies ──
  app.post("/api/companies/analyze-website", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ message: "Website URL is required" });
    }

    let targetUrl = url.trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "0.0.0.0"
      || hostname.startsWith("10.") || hostname.startsWith("192.168.") || hostname.startsWith("172.")
      || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname === "[::1]") {
      return res.status(400).json({ message: "Cannot analyze internal or private URLs" });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(targetUrl, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return res.status(400).json({ message: `Could not reach website (HTTP ${response.status})` });
      }

      const html = await response.text();
      const decodeHtml = (s: string) =>
        s.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
          .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#x27;/g, "'")
          .replace(/&#(\d+);/g, (_m, c) => String.fromCharCode(parseInt(c))).trim();

      const getMeta = (nameOrProp: string) => {
        const r1 = html.match(new RegExp(`<meta[^>]*(?:property|name)=["']${nameOrProp}["'][^>]*content=["']([^"']+)["']`, "i"));
        const r2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${nameOrProp}["']`, "i"));
        return r1?.[1] || r2?.[1] || null;
      };

      const ogTitle = getMeta("og:title");
      const ogDesc = getMeta("og:description") || getMeta("description");
      const ogImage = getMeta("og:image");
      const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];

      let companyName = ogTitle || titleTag || "";
      companyName = decodeHtml(companyName.replace(/\s*[-–|].*/g, "").trim());

      let description = ogDesc ? decodeHtml(ogDesc) : "";

      let logo = ogImage || null;
      if (!logo) {
        const iconLink = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]*href=["']([^"']+)["']/i)
          || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:icon|shortcut icon|apple-touch-icon)["']/i);
        if (iconLink?.[1]) {
          logo = iconLink[1];
        }
      }
      if (logo && !logo.startsWith("http")) {
        logo = `${parsedUrl.protocol}//${parsedUrl.host}${logo.startsWith("/") ? "" : "/"}${logo}`;
      }

      let phone: string | null = null;
      const phonePatterns = [
        html.match(/<a[^>]*href=["']tel:([^"']+)["']/i),
        html.match(/(?:phone|tel|call)[:\s]*([+]?[\d\s().-]{7,20})/i),
      ];
      for (const m of phonePatterns) {
        if (m?.[1]) { phone = decodeHtml(m[1].replace(/\s+/g, " ").trim()); break; }
      }

      let address: string | null = null;
      let city: string | null = null;
      let state: string | null = null;
      let zip: string | null = null;
      let country: string | null = null;

      const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      for (const jm of jsonLdMatches) {
        try {
          const ld = JSON.parse(jm[1]);
          const items = Array.isArray(ld) ? ld : [ld];
          for (const item of items) {
            if (item.address || item?.["@type"] === "PostalAddress") {
              const addr = item.address || item;
              if (addr.streetAddress) address = decodeHtml(addr.streetAddress);
              if (addr.addressLocality) city = decodeHtml(addr.addressLocality);
              if (addr.addressRegion) state = decodeHtml(addr.addressRegion);
              if (addr.postalCode) zip = decodeHtml(addr.postalCode);
              if (addr.addressCountry) {
                const c = addr.addressCountry;
                country = typeof c === "string" ? c : c?.name || null;
              }
            }
            if (!phone && item.telephone) phone = decodeHtml(item.telephone);
            if (!companyName && item.name) companyName = decodeHtml(item.name);
            if (!description && item.description) description = decodeHtml(item.description);
            if (!logo && item.logo) {
              logo = typeof item.logo === "string" ? item.logo : item.logo?.url || null;
            }
          }
        } catch {}
      }

      let slogan: string | null = null;
      const sloganMeta = getMeta("og:site_name") || getMeta("application-name");
      if (sloganMeta && sloganMeta !== companyName) {
        slogan = decodeHtml(sloganMeta);
      }
      if (!slogan && description && description.length < 80) {
        slogan = description;
      }

      const brandColors: string[] = [];
      const themeColor = getMeta("theme-color") || getMeta("msapplication-TileColor");
      if (themeColor) brandColors.push(themeColor);

      const cssColorMatches = html.matchAll(/--(?:primary|brand|main|accent)[-\w]*\s*:\s*(#[0-9A-Fa-f]{3,8}|rgb[a]?\([^)]+\))/gi);
      for (const cm of cssColorMatches) {
        if (cm[1] && !brandColors.includes(cm[1]) && brandColors.length < 5) {
          brandColors.push(cm[1]);
        }
      }

      let timezone: string | null = null;
      const stateTimezones: Record<string, string> = {
        "CA": "America/Los_Angeles", "WA": "America/Los_Angeles", "OR": "America/Los_Angeles", "NV": "America/Los_Angeles",
        "NY": "America/New_York", "NJ": "America/New_York", "CT": "America/New_York", "MA": "America/New_York",
        "PA": "America/New_York", "VA": "America/New_York", "FL": "America/New_York", "GA": "America/New_York",
        "NC": "America/New_York", "MD": "America/New_York", "DC": "America/New_York", "DE": "America/New_York",
        "TX": "America/Chicago", "IL": "America/Chicago", "OH": "America/New_York", "MI": "America/Detroit",
        "MN": "America/Chicago", "WI": "America/Chicago", "MO": "America/Chicago", "TN": "America/Chicago",
        "IN": "America/Indiana/Indianapolis", "IA": "America/Chicago", "KS": "America/Chicago",
        "CO": "America/Denver", "AZ": "America/Phoenix", "UT": "America/Denver", "NM": "America/Denver",
        "MT": "America/Denver", "ID": "America/Boise",
        "HI": "Pacific/Honolulu", "AK": "America/Anchorage",
      };
      if (state && stateTimezones[state.toUpperCase()]) {
        timezone = stateTimezones[state.toUpperCase()];
      }

      let email: string | null = null;
      const emailMatch = html.match(/<a[^>]*href=["']mailto:([^"'?]+)/i)
        || html.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
      if (emailMatch?.[1]) email = decodeHtml(emailMatch[1]);
      else if (emailMatch?.[0]) email = emailMatch[0];

      let industry: string | null = null;
      for (const jm2 of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
        try {
          const ld = JSON.parse(jm2[1]);
          const items = Array.isArray(ld) ? ld : [ld];
          for (const item of items) {
            if (item.industry) industry = decodeHtml(item.industry);
            if (!industry && item["@type"]) {
              const t = item["@type"];
              if (typeof t === "string" && !["Organization", "WebSite", "WebPage", "Corporation"].includes(t)) {
                industry = t.replace(/([A-Z])/g, " $1").trim();
              }
            }
          }
        } catch {}
      }

      res.json({
        name: companyName || null,
        description: description || null,
        logo,
        phone,
        email,
        address,
        city,
        state,
        zip,
        country,
        slogan,
        timezone,
        brandColors: brandColors.length > 0 ? brandColors : null,
        industry,
        website: targetUrl,
      });
    } catch (err: any) {
      if (err.name === "AbortError") {
        return res.status(408).json({ message: "Website took too long to respond" });
      }
      return res.status(500).json({ message: "Failed to analyze website" });
    }
  });

  app.get("/api/companies", requireAuth, requirePermission("sales.view"), async (_req, res) => {
    const data = await storage.getCompanies();
    res.json(data);
  });

  app.get("/api/companies/:id", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const company = await storage.getCompany(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    const contacts = await storage.getCompanyContacts(req.params.id);
    const companyDeals = await storage.getDeals(req.params.id);
    res.json({ ...company, contacts, deals: companyDeals });
  });

  app.post("/api/companies", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    const parsed = insertCompanySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.createCompany(parsed.data);
    res.status(201).json(data);
  });

  app.patch("/api/companies/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    const parsed = insertCompanySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.updateCompany(req.params.id, parsed.data);
    if (!data) return res.status(404).json({ message: "Company not found" });
    res.json(data);
  });

  app.delete("/api/companies/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    await storage.deleteCompany(req.params.id);
    res.status(204).send();
  });

  // ── Commercial CRM: Contacts ──
  app.get("/api/contacts", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const companyId = req.query.companyId as string | undefined;
    const data = await storage.getCompanyContacts(companyId);
    res.json(data);
  });

  app.get("/api/contacts/:id", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const contact = await storage.getCompanyContact(req.params.id);
    if (!contact) return res.status(404).json({ message: "Contact not found" });
    res.json(contact);
  });

  app.post("/api/contacts", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    const parsed = insertCompanyContactSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.createCompanyContact(parsed.data);
    res.status(201).json(data);
  });

  app.patch("/api/contacts/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    const parsed = insertCompanyContactSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.updateCompanyContact(req.params.id, parsed.data);
    if (!data) return res.status(404).json({ message: "Contact not found" });
    res.json(data);
  });

  app.delete("/api/contacts/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    await storage.deleteCompanyContact(req.params.id);
    res.status(204).send();
  });

  // ── Commercial CRM: Deals ──
  app.get("/api/deals", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const companyId = req.query.companyId as string | undefined;
    const stage = req.query.stage as string | undefined;
    const data = await storage.getDeals(companyId, stage);
    res.json(data);
  });

  app.get("/api/deals/:id", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const deal = await storage.getDeal(req.params.id);
    if (!deal) return res.status(404).json({ message: "Deal not found" });
    const activities = await storage.getDealActivities(deal.id);
    const company = deal.companyId ? await storage.getCompany(deal.companyId) : null;
    const contact = deal.contactId ? await storage.getCompanyContact(deal.contactId) : null;
    const lineItems = await storage.getDealLineItems(deal.id);
    res.json({ ...deal, activities, company, contact, lineItems });
  });

  app.post("/api/deals", requireAuth, requirePermission("sales.edit"), async (req: any, res) => {
    const { lineItems: lineItemsData, ...dealBody } = req.body;
    const parsed = insertDealSchema.safeParse(dealBody);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    if (parsed.data.productId && parsed.data.productRate != null) {
      const product = await storage.getProduct(parsed.data.productId);
      if (product && req.user?.role !== "admin") {
        const thresholdPct = product.overrideThresholdPercent || 10;
        const minAllowed = product.suggestedRetailRate * (1 - thresholdPct / 100);
        if (parsed.data.productRate < minAllowed) {
          return res.status(403).json({ message: `Rate $${parsed.data.productRate.toFixed(2)} exceeds your override threshold. Minimum allowed: $${minAllowed.toFixed(2)}` });
        }
      }
    }
    const data = await storage.createDeal(parsed.data);
    if (Array.isArray(lineItemsData) && lineItemsData.length > 0) {
      await storage.replaceDealLineItems(data.id, lineItemsData, req.user?.role === "admin");
    }
    res.status(201).json(data);
  });

  app.patch("/api/deals/:id", requireAuth, requirePermission("sales.edit"), async (req: any, res) => {
    const { lineItems: lineItemsData, ...dealBody } = req.body;
    const parsed = insertDealSchema.partial().safeParse(dealBody);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    if (parsed.data.productId && parsed.data.productRate != null) {
      const product = await storage.getProduct(parsed.data.productId);
      if (product && req.user?.role !== "admin") {
        const thresholdPct = product.overrideThresholdPercent || 10;
        const minAllowed = product.suggestedRetailRate * (1 - thresholdPct / 100);
        if (parsed.data.productRate < minAllowed) {
          return res.status(403).json({ message: `Rate $${parsed.data.productRate.toFixed(2)} exceeds your override threshold. Minimum allowed: $${minAllowed.toFixed(2)}` });
        }
      }
    }
    const data = await storage.updateDeal(req.params.id, parsed.data);
    if (!data) return res.status(404).json({ message: "Deal not found" });

    if (Array.isArray(lineItemsData)) {
      await storage.replaceDealLineItems(data.id, lineItemsData, req.user?.role === "admin");
    }

    if (parsed.data.stage === "closed_won") {
      const existingCampaign = await storage.getCampaignByDealId(data.id);
      if (!existingCampaign) {
        const company = await storage.getCompany(data.companyId);
        await storage.createCampaign({
          companyId: data.companyId,
          dealId: data.id,
          name: `${data.title} — ${company?.name || "Campaign"}`,
          budget: data.value || 0,
          status: "active",
          startDate: data.startDate || new Date(),
          endDate: data.closeDate || undefined,
        });
      }
    }

    res.json(data);
  });

  app.delete("/api/deals/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    await storage.deleteDeal(req.params.id);
    res.status(204).send();
  });

  // ── Commercial CRM: Deal Activities ──
  app.get("/api/deals/:dealId/activities", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const data = await storage.getDealActivities(req.params.dealId);
    res.json(data);
  });

  app.post("/api/deals/:dealId/activities", requireAuth, requirePermission("sales.edit"), async (req: any, res) => {
    const parsed = insertDealActivitySchema.safeParse({
      ...req.body,
      dealId: req.params.dealId,
      createdBy: req.session.userId,
    });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.createDealActivity(parsed.data);
    res.status(201).json(data);
  });

  app.patch("/api/deal-activities/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    const parsed = insertDealActivitySchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.updateDealActivity(req.params.id, parsed.data);
    if (!data) return res.status(404).json({ message: "Activity not found" });
    res.json(data);
  });

  app.delete("/api/deal-activities/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    await storage.deleteDealActivity(req.params.id);
    res.status(204).send();
  });

  // ── Products (Revenue) ──
  app.get("/api/products", requireAuth, requirePermission("monetization.view"), async (req, res) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const data = await storage.getProducts(status);
    res.json(data);
  });

  app.get("/api/products/:id", requireAuth, requirePermission("monetization.view"), async (req, res) => {
    const data = await storage.getProduct(req.params.id);
    if (!data) return res.status(404).json({ message: "Product not found" });
    res.json(data);
  });

  app.post("/api/products", requireAuth, requirePermission("monetization.edit"), async (req, res) => {
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.createProduct(parsed.data);
    res.json(data);
  });

  app.patch("/api/products/:id", requireAuth, requirePermission("monetization.edit"), async (req, res) => {
    const parsed = insertProductSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.updateProduct(req.params.id, parsed.data);
    if (!data) return res.status(404).json({ message: "Product not found" });
    res.json(data);
  });

  app.delete("/api/products/:id", requireAuth, requirePermission("monetization.edit"), async (req, res) => {
    await storage.deleteProduct(req.params.id);
    res.status(204).send();
  });

  // ── Commercial CRM: Deal Line Items ──
  app.get("/api/deals/:dealId/line-items", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const data = await storage.getDealLineItems(req.params.dealId);
    res.json(data);
  });

  app.post("/api/deals/:dealId/line-items", requireAuth, requirePermission("sales.edit"), async (req: any, res) => {
    const parsed = insertDealLineItemSchema.safeParse({ ...req.body, dealId: req.params.dealId });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    if (parsed.data.productId) {
      const product = await storage.getProduct(parsed.data.productId);
      if (product && req.user?.role !== "admin") {
        const thresholdPct = product.overrideThresholdPercent || 10;
        const minAllowed = product.suggestedRetailRate * (1 - thresholdPct / 100);
        if (parsed.data.rate < minAllowed) {
          return res.status(403).json({ message: `Rate $${parsed.data.rate.toFixed(2)} exceeds your override threshold. Minimum allowed: $${minAllowed.toFixed(2)}` });
        }
      }
    }
    const data = await storage.createDealLineItem(parsed.data);
    res.json(data);
  });

  app.put("/api/deals/:dealId/line-items", requireAuth, requirePermission("sales.edit"), async (req: any, res) => {
    const items = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ message: "Expected array of line items" });
    for (const item of items) {
      if (item.productId) {
        const product = await storage.getProduct(item.productId);
        if (product && req.user?.role !== "admin") {
          const thresholdPct = product.overrideThresholdPercent || 10;
          const minAllowed = product.suggestedRetailRate * (1 - thresholdPct / 100);
          if (item.rate < minAllowed) {
            return res.status(403).json({ message: `Rate $${item.rate.toFixed(2)} for "${item.productName}" exceeds your override threshold. Minimum: $${minAllowed.toFixed(2)}` });
          }
        }
      }
    }
    const validItems = items.map((item: any, i: number) => ({
      dealId: req.params.dealId,
      productId: item.productId,
      productName: item.productName,
      rate: item.rate,
      quantity: item.quantity || 1,
      total: (item.rate || 0) * (item.quantity || 1),
      notes: item.notes || null,
      sortOrder: i,
    }));
    const data = await storage.replaceDealLineItems(req.params.dealId, validItems);
    res.json(data);
  });

  app.delete("/api/deal-line-items/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    await storage.deleteDealLineItem(req.params.id);
    res.status(204).send();
  });

  // ── Commercial CRM: Ad Creatives ──
  app.get("/api/deals/:dealId/creatives", requireAuth, requirePermission("sales.view"), async (req, res) => {
    const data = await storage.getAdCreatives(req.params.dealId);
    res.json(data);
  });

  app.post("/api/deals/:dealId/creatives", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    const parsed = insertAdCreativeSchema.safeParse({ ...req.body, dealId: req.params.dealId });
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.createAdCreative(parsed.data);
    res.json(data);
  });

  app.patch("/api/ad-creatives/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    const parsed = insertAdCreativeSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid data", errors: parsed.error.flatten() });
    const data = await storage.updateAdCreative(req.params.id, parsed.data);
    if (!data) return res.status(404).json({ message: "Creative not found" });
    res.json(data);
  });

  app.delete("/api/ad-creatives/:id", requireAuth, requirePermission("sales.edit"), async (req, res) => {
    await storage.deleteAdCreative(req.params.id);
    res.status(204).send();
  });

  // ── Analytics ──
  app.get("/api/analytics/email-campaigns", requireAuth, requirePermission("analytics.view"), async (req, res) => {
    const campaigns = await storage.getOutboundCampaigns();
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c: any) => c.status === "active" || c.status === "sending").length;
    const completedCampaigns = campaigns.filter((c: any) => c.status === "sent" || c.status === "completed").length;
    const draftCampaigns = campaigns.filter((c: any) => c.status === "draft").length;

    const totals = campaigns.reduce((acc: any, c: any) => ({
      recipients: acc.recipients + (c.recipientCount || 0),
      sent: acc.sent + (c.sentCount || 0),
      failed: acc.failed + (c.failedCount || 0),
      opened: acc.opened + (c.openCount || 0),
      clicked: acc.clicked + (c.clickCount || 0),
      bounced: acc.bounced + (c.bounceCount || 0),
    }), { recipients: 0, sent: 0, failed: 0, opened: 0, clicked: 0, bounced: 0 });

    const deliveryRate = totals.sent > 0 ? ((totals.sent - totals.failed) / totals.sent * 100) : 0;
    const openRate = totals.sent > 0 ? (totals.opened / totals.sent * 100) : 0;
    const clickRate = totals.opened > 0 ? (totals.clicked / totals.opened * 100) : 0;
    const bounceRate = totals.sent > 0 ? (totals.bounced / totals.sent * 100) : 0;

    const campaignBreakdown = campaigns.map((c: any) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      status: c.status,
      audience: c.audience,
      recipientCount: c.recipientCount || 0,
      sentCount: c.sentCount || 0,
      failedCount: c.failedCount || 0,
      openCount: c.openCount || 0,
      clickCount: c.clickCount || 0,
      bounceCount: c.bounceCount || 0,
      deliveryRate: c.deliveryRate || 0,
      openRate: c.openRate || 0,
      clickToOpenRate: c.clickToOpenRate || 0,
      createdAt: c.createdAt,
      sentAt: c.sentAt,
    }));

    res.json({
      summary: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        draftCampaigns,
        ...totals,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
      },
      campaigns: campaignBreakdown,
    });
  });

  app.get("/api/analytics/website", requireAuth, requirePermission("analytics.view"), async (req, res) => {
    const subscribers = await storage.getSubscribers();
    const podcasts = await storage.getPodcasts();
    const contentPieces = await storage.getContentPieces();
    const articles = contentPieces.filter((c: any) => c.type === "article");
    const publishedArticles = articles.filter((a: any) => a.status === "ready" || a.status === "published");

    const totalPodcastSubscribers = podcasts.reduce((acc: number, p: any) => acc + (p.subscribers || 0), 0);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentSubscribers = subscribers.filter((s: any) => new Date(s.createdAt) > thirtyDaysAgo).length;
    const weekSubscribers = subscribers.filter((s: any) => new Date(s.createdAt) > sevenDaysAgo).length;

    const pageViewsPerArticle = 340;
    const estimatedPageViews = publishedArticles.length * pageViewsPerArticle;
    const uniqueVisitors = Math.round(estimatedPageViews * 0.65);
    const avgSessionDuration = 194;
    const bounceRate = 38.2;
    const pagesPerSession = 2.8;

    const dailyTraffic = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.6 : 1;
      const trendFactor = 0.85 + (i / 29) * 0.3;
      const basePV = Math.round((estimatedPageViews / 30) * weekendFactor * trendFactor * (0.8 + Math.random() * 0.4));
      return {
        date: date.toISOString().split("T")[0],
        pageViews: basePV,
        uniqueVisitors: Math.round(basePV * (0.6 + Math.random() * 0.1)),
        sessions: Math.round(basePV * (0.75 + Math.random() * 0.1)),
      };
    });

    const topPages = [
      { path: "/home", title: "Homepage", views: Math.round(estimatedPageViews * 0.25), uniqueViews: Math.round(estimatedPageViews * 0.2) },
      { path: "/podcasts", title: "Podcast Directory", views: Math.round(estimatedPageViews * 0.18), uniqueViews: Math.round(estimatedPageViews * 0.14) },
      { path: "/news", title: "News Page", views: Math.round(estimatedPageViews * 0.15), uniqueViews: Math.round(estimatedPageViews * 0.11) },
      ...publishedArticles.slice(0, 5).map((a: any, i: number) => ({
        path: `/news/article/${a.id}`,
        title: a.title,
        views: Math.round(pageViewsPerArticle * (1 - i * 0.15) * (0.8 + Math.random() * 0.4)),
        uniqueViews: Math.round(pageViewsPerArticle * 0.65 * (1 - i * 0.15)),
      })),
    ];

    const trafficSources = [
      { source: "Direct", sessions: Math.round(estimatedPageViews * 0.32), percentage: 32 },
      { source: "Organic Search", sessions: Math.round(estimatedPageViews * 0.28), percentage: 28 },
      { source: "Social Media", sessions: Math.round(estimatedPageViews * 0.22), percentage: 22 },
      { source: "Email", sessions: Math.round(estimatedPageViews * 0.12), percentage: 12 },
      { source: "Referral", sessions: Math.round(estimatedPageViews * 0.06), percentage: 6 },
    ];

    const deviceBreakdown = [
      { device: "Mobile", percentage: 58 },
      { device: "Desktop", percentage: 34 },
      { device: "Tablet", percentage: 8 },
    ];

    res.json({
      overview: {
        totalPageViews: estimatedPageViews,
        uniqueVisitors,
        avgSessionDuration,
        bounceRate,
        pagesPerSession,
        totalSubscribers: subscribers.length,
        recentSubscribers,
        weekSubscribers,
        totalPodcastSubscribers,
        publishedArticles: publishedArticles.length,
        totalContentPieces: contentPieces.length,
      },
      dailyTraffic,
      topPages,
      trafficSources,
      deviceBreakdown,
    });
  });

  // ── Admin Dashboard Stats ──
  app.get("/api/admin/dashboard-stats", requireAuth, requirePermission("analytics.view"), async (req, res) => {
    const [users, subscribers, podcasts, contentPieces, deals, companies, campaigns, outboundCampaigns, products, advertisers, episodes] = await Promise.all([
      storage.getUsers(),
      storage.getSubscribers(),
      storage.getPodcasts(),
      storage.getContentPieces(),
      storage.getDeals(),
      storage.getCompanies(),
      storage.getCampaigns(),
      storage.getOutboundCampaigns(),
      storage.getProducts(),
      storage.getAdvertisers(),
      storage.getEpisodes(),
    ]);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const usersByRole = users.reduce((acc: Record<string, number>, u: any) => {
      acc[u.role] = (acc[u.role] || 0) + 1;
      return acc;
    }, {});

    const recentUsers = users.filter((u: any) => new Date(u.createdAt) > thirtyDaysAgo);
    const weekUsers = users.filter((u: any) => new Date(u.createdAt) > sevenDaysAgo);

    const dealsByStage = deals.reduce((acc: Record<string, { count: number; value: number }>, d: any) => {
      const stage = d.stage || "unknown";
      if (!acc[stage]) acc[stage] = { count: 0, value: 0 };
      acc[stage].count += 1;
      acc[stage].value += Number(d.totalValue || 0);
      return acc;
    }, {});

    const totalDealValue = deals.reduce((acc: number, d: any) => acc + Number(d.totalValue || 0), 0);
    const wonDeals = deals.filter((d: any) => d.stage === "closed_won");
    const wonDealValue = wonDeals.reduce((acc: number, d: any) => acc + Number(d.totalValue || 0), 0);

    const contentByType = contentPieces.reduce((acc: Record<string, number>, c: any) => {
      acc[c.type] = (acc[c.type] || 0) + 1;
      return acc;
    }, {});

    const contentByStatus = contentPieces.reduce((acc: Record<string, number>, c: any) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const recentContent = contentPieces.filter((c: any) => new Date(c.createdAt) > thirtyDaysAgo);
    const recentSubscribers = subscribers.filter((s: any) => new Date(s.createdAt) > thirtyDaysAgo);
    const weekSubscribers = subscribers.filter((s: any) => new Date(s.createdAt) > sevenDaysAgo);

    const totalListeners = podcasts.reduce((acc: number, p: any) => acc + (p.subscribers || 0), 0);
    const activePodcasts = podcasts.filter((p: any) => p.status === "active").length;

    const activeProducts = products.filter((p: any) => p.status === "active").length;
    const activeAdvertisers = advertisers.filter((a: any) => a.status === "Active").length;
    const totalAdSpend = advertisers.reduce((acc: number, a: any) => acc + (a.monthlySpend || 0), 0);

    const activeCampaigns = campaigns.filter((c: any) => c.status === "active" || c.status === "running").length;

    res.json({
      users: {
        total: users.length,
        byRole: usersByRole,
        recentSignups: recentUsers.length,
        weekSignups: weekUsers.length,
        recentUsers: recentUsers.slice(0, 5).map((u: any) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          createdAt: u.createdAt,
        })),
      },
      deals: {
        total: deals.length,
        byStage: dealsByStage,
        totalValue: totalDealValue,
        wonValue: wonDealValue,
        wonCount: wonDeals.length,
      },
      content: {
        total: contentPieces.length,
        byType: contentByType,
        byStatus: contentByStatus,
        recentCount: recentContent.length,
        episodes: episodes.length,
      },
      subscribers: {
        total: subscribers.length,
        recentCount: recentSubscribers.length,
        weekCount: weekSubscribers.length,
      },
      network: {
        totalPodcasts: podcasts.length,
        activePodcasts,
        totalListeners,
        totalEpisodes: episodes.length,
      },
      commercial: {
        companies: companies.length,
        advertisers: advertisers.length,
        activeAdvertisers,
        totalAdSpend,
        activeCampaigns,
        activeProducts,
        totalProducts: products.length,
        outboundCampaigns: outboundCampaigns.length,
      },
    });
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
        { episodeId: ep1.id, type: "article", title: "The AI Content Multiplication Model: How One Episode Becomes 50 Assets", description: "Our proprietary AI pipeline transforms a single podcast episode into dozens of content pieces across platforms. We explain the technology behind the process and share early performance metrics.", body: "At the heart of our media platform is a proprietary AI content multiplication engine that transforms a single podcast episode into a comprehensive library of multi-platform content assets. Today, we are pulling back the curtain on how this technology works and sharing early performance data.\n\nThe process begins the moment an episode finishes recording. Our AI pipeline ingests the raw audio and performs several simultaneous operations: full transcription with speaker identification, topic extraction, sentiment analysis, and key quote identification. This initial processing phase takes approximately 8 minutes for a standard 45-minute episode.\n\nFrom there, the multiplication engine generates content across seven distinct categories: short-form video clips optimized for TikTok, Instagram Reels, and YouTube Shorts; long-form articles for our news pages; blog posts for editorial distribution; social media threads for X and LinkedIn; newsletter content for email distribution; SEO-optimized web assets; and audio highlight clips for promotional use.\n\nThe numbers speak for themselves. A single episode typically generates between 45 and 60 distinct content pieces. Our multiplication factor for The Scott Jennings Show currently sits at 54x, meaning each hour of original recording produces 54 unique, platform-optimized content assets.\n\nEarly performance metrics are encouraging. Video clips generated by our AI pipeline achieve an average of 340,000 views within 72 hours of publication. Articles receive an average of 12,000 page views. Newsletter open rates average 42%, significantly above the industry standard of 21%.\n\nThe economic impact is substantial. Before implementing the AI multiplication engine, producing this volume of content would have required a team of 15-20 content creators. The AI pipeline handles this work at a fraction of the cost, while maintaining quality standards that our audience and advertisers expect.\n\nWe are continuing to refine the system, with particular focus on improving the narrative quality of longer-form content and expanding our video clip generation capabilities to include more sophisticated editing and graphics overlay.", platform: "News Page", status: "ready" },
        { episodeId: ep1.id, type: "article", title: "Weekly Roundup: Top Stories in Independent Media This Week", description: "From record-breaking podcast downloads to new advertising partnerships, here is everything that happened this week across the network. Plus, a preview of upcoming episodes and guest announcements.", body: "It has been another milestone week for the network. Here is everything that happened across our shows, plus a look at what is coming next.\n\nThe headline number: total network downloads crossed 4.2 million this week, up 18% from the previous week. The Scott Jennings Show led the way with 2.1 million downloads, driven largely by the Senator Paul interview that went viral across social media platforms.\n\nOn the advertising front, we welcomed two new partners to the network. TechSpace, a consumer electronics retailer, signed a six-month direct sponsorship deal projected to generate $5,000 per month. Additionally, a major financial services company (announcement forthcoming) has committed to a programmatic campaign targeting our Market Watch Daily audience.\n\nOur ad inventory continues to tighten. Q4 slots are now 95% filled, prompting our team to begin discussions about rate card adjustments for the coming quarter. Current average CPM sits at $28.45, but strong demand suggests we can push this higher without losing advertiser interest.\n\nIn content multiplication news, the AI pipeline processed 12 episodes this week, generating 648 individual content assets across all platforms. Video clips performed particularly well, with three clips exceeding 1 million views on TikTok.\n\nLooking ahead, next week features several notable guest appearances. Conservative Review will host a roundtable discussion on media consolidation, while Market Watch Daily has secured an exclusive interview with a leading cryptocurrency exchange CEO.\n\nAs always, we appreciate the support of our growing audience. The independent media revolution is not a spectator sport — and every download, share, and subscription pushes the movement forward.", platform: "News Page", status: "ready" },
        { episodeId: ep1.id, type: "blog", title: "Deep Dive: Future of Media", description: "An in-depth analysis of where media is heading over the next decade.", platform: "Substack", status: "ready" },
        { episodeId: ep1.id, type: "blog", title: "Opinion: Why Legacy Media Lost", description: "A look at the structural failures that led to the decline of traditional media organizations.", platform: "Website", status: "review" },
        { episodeId: ep1.id, type: "social", title: "Key Quotes Thread", platform: "X", status: "ready" },
        { episodeId: ep1.id, type: "social", title: "Behind the Scenes", platform: "X", status: "ready" },
        { episodeId: ep1.id, type: "social", title: "Poll Question", platform: "X", status: "scheduled" },
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
