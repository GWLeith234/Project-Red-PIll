import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  users, podcasts, episodes, contentPieces, advertisers, campaigns, metrics, alerts, branding, platformSettings,
  type User, type InsertUser,
  type Podcast, type InsertPodcast,
  type Episode, type InsertEpisode,
  type ContentPiece, type InsertContentPiece,
  type Advertiser, type InsertAdvertiser,
  type Campaign, type InsertCampaign,
  type Metrics, type InsertMetrics,
  type Alert, type InsertAlert,
  type Branding, type InsertBranding,
  type PlatformSettings, type InsertPlatformSettings,
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<void>;
  updateLastLogin(id: string): Promise<void>;

  getPodcasts(): Promise<Podcast[]>;
  getPodcast(id: string): Promise<Podcast | undefined>;
  createPodcast(podcast: InsertPodcast): Promise<Podcast>;
  updatePodcast(id: string, data: Partial<InsertPodcast>): Promise<Podcast | undefined>;
  deletePodcast(id: string): Promise<void>;

  getEpisodes(podcastId?: string): Promise<Episode[]>;
  getEpisode(id: string): Promise<Episode | undefined>;
  createEpisode(episode: InsertEpisode): Promise<Episode>;
  updateEpisode(id: string, data: Partial<InsertEpisode>): Promise<Episode | undefined>;

  getContentPieces(episodeId?: string): Promise<ContentPiece[]>;
  getContentPiece(id: string): Promise<ContentPiece | undefined>;
  createContentPiece(piece: InsertContentPiece): Promise<ContentPiece>;
  updateContentPiece(id: string, data: Partial<InsertContentPiece>): Promise<ContentPiece | undefined>;

  getAdvertisers(): Promise<Advertiser[]>;
  getAdvertiser(id: string): Promise<Advertiser | undefined>;
  createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser>;
  updateAdvertiser(id: string, data: Partial<InsertAdvertiser>): Promise<Advertiser | undefined>;

  getCampaigns(advertiserId?: string): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<InsertCampaign>): Promise<Campaign | undefined>;

  getLatestMetrics(): Promise<Metrics | undefined>;
  createMetrics(m: InsertMetrics): Promise<Metrics>;

  getTrendingArticles(limit?: number): Promise<ContentPiece[]>;

  getAlerts(): Promise<Alert[]>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  markAlertRead(id: string): Promise<void>;

  getBranding(): Promise<Branding | undefined>;
  upsertBranding(data: Partial<InsertBranding>): Promise<Branding>;

  getSettings(): Promise<PlatformSettings | undefined>;
  upsertSettings(data: Partial<InsertPlatformSettings>): Promise<PlatformSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByUsername(username: string) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }
  async getUsers() {
    return db.select().from(users).orderBy(desc(users.createdAt));
  }
  async createUser(user: InsertUser) {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }
  async updateUser(id: string, data: Partial<InsertUser>) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }
  async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }
  async updateLastLogin(id: string) {
    await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  async getPodcasts() {
    return db.select().from(podcasts);
  }
  async getPodcast(id: string) {
    const [p] = await db.select().from(podcasts).where(eq(podcasts.id, id));
    return p;
  }
  async createPodcast(podcast: InsertPodcast) {
    const [created] = await db.insert(podcasts).values(podcast).returning();
    return created;
  }
  async updatePodcast(id: string, data: Partial<InsertPodcast>) {
    const [updated] = await db.update(podcasts).set(data).where(eq(podcasts.id, id)).returning();
    return updated;
  }
  async deletePodcast(id: string) {
    await db.delete(podcasts).where(eq(podcasts.id, id));
  }

  async getEpisodes(podcastId?: string) {
    if (podcastId) {
      return db.select().from(episodes).where(eq(episodes.podcastId, podcastId)).orderBy(desc(episodes.publishedAt));
    }
    return db.select().from(episodes).orderBy(desc(episodes.publishedAt));
  }
  async getEpisode(id: string) {
    const [ep] = await db.select().from(episodes).where(eq(episodes.id, id));
    return ep;
  }
  async createEpisode(episode: InsertEpisode) {
    const [created] = await db.insert(episodes).values(episode).returning();
    return created;
  }
  async updateEpisode(id: string, data: Partial<InsertEpisode>) {
    const [updated] = await db.update(episodes).set(data).where(eq(episodes.id, id)).returning();
    return updated;
  }

  async getContentPieces(episodeId?: string) {
    if (episodeId) {
      return db.select().from(contentPieces).where(eq(contentPieces.episodeId, episodeId));
    }
    return db.select().from(contentPieces);
  }
  async getContentPiece(id: string) {
    const [cp] = await db.select().from(contentPieces).where(eq(contentPieces.id, id));
    return cp;
  }
  async getArticlesForPodcast(podcastId: string) {
    const eps = await db.select().from(episodes).where(eq(episodes.podcastId, podcastId));
    if (eps.length === 0) return [];
    const epIds = eps.map(e => e.id);
    const all = await db.select().from(contentPieces).where(eq(contentPieces.type, "article")).orderBy(desc(contentPieces.publishedAt));
    return all.filter(cp => epIds.includes(cp.episodeId));
  }
  async createContentPiece(piece: InsertContentPiece) {
    const [created] = await db.insert(contentPieces).values(piece).returning();
    return created;
  }
  async updateContentPiece(id: string, data: Partial<InsertContentPiece>) {
    const [updated] = await db.update(contentPieces).set(data).where(eq(contentPieces.id, id)).returning();
    return updated;
  }

  async getAdvertisers() {
    return db.select().from(advertisers);
  }
  async getAdvertiser(id: string) {
    const [a] = await db.select().from(advertisers).where(eq(advertisers.id, id));
    return a;
  }
  async createAdvertiser(advertiser: InsertAdvertiser) {
    const [created] = await db.insert(advertisers).values(advertiser).returning();
    return created;
  }
  async updateAdvertiser(id: string, data: Partial<InsertAdvertiser>) {
    const [updated] = await db.update(advertisers).set(data).where(eq(advertisers.id, id)).returning();
    return updated;
  }

  async getCampaigns(advertiserId?: string) {
    if (advertiserId) {
      return db.select().from(campaigns).where(eq(campaigns.advertiserId, advertiserId));
    }
    return db.select().from(campaigns);
  }
  async createCampaign(campaign: InsertCampaign) {
    const [created] = await db.insert(campaigns).values(campaign).returning();
    return created;
  }
  async updateCampaign(id: string, data: Partial<InsertCampaign>) {
    const [updated] = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning();
    return updated;
  }

  async getLatestMetrics() {
    const [m] = await db.select().from(metrics).orderBy(desc(metrics.date)).limit(1);
    return m;
  }
  async createMetrics(m: InsertMetrics) {
    const [created] = await db.insert(metrics).values(m).returning();
    return created;
  }

  async getTrendingArticles(limit = 5) {
    return db.select().from(contentPieces)
      .where(eq(contentPieces.type, "article"))
      .orderBy(desc(contentPieces.publishedAt))
      .limit(limit);
  }

  async getAlerts() {
    return db.select().from(alerts).orderBy(desc(alerts.createdAt));
  }
  async createAlert(alert: InsertAlert) {
    const [created] = await db.insert(alerts).values(alert).returning();
    return created;
  }
  async markAlertRead(id: string) {
    await db.update(alerts).set({ read: true }).where(eq(alerts.id, id));
  }

  async getBranding() {
    const [b] = await db.select().from(branding).limit(1);
    return b;
  }

  async upsertBranding(data: Partial<InsertBranding>) {
    const existing = await this.getBranding();
    if (existing) {
      const [updated] = await db.update(branding).set({ ...data, updatedAt: new Date() }).where(eq(branding.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(branding).values(data as InsertBranding).returning();
    return created;
  }

  async getSettings() {
    const [s] = await db.select().from(platformSettings).limit(1);
    return s;
  }

  async upsertSettings(data: Partial<InsertPlatformSettings>) {
    const existing = await this.getSettings();
    if (existing) {
      const [updated] = await db.update(platformSettings).set({ ...data, updatedAt: new Date() }).where(eq(platformSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(platformSettings).values(data as InsertPlatformSettings).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
