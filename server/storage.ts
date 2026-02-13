import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { and } from "drizzle-orm";
import {
  users, podcasts, episodes, contentPieces, advertisers, campaigns, metrics, alerts, branding, platformSettings, comments,
  subscribers, subscriberPodcasts, companies, companyContacts, deals, dealActivities,
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
  type Comment, type InsertComment,
  type Subscriber, type InsertSubscriber,
  type SubscriberPodcast, type InsertSubscriberPodcast,
  type Company, type InsertCompany,
  type CompanyContact, type InsertCompanyContact,
  type Deal, type InsertDeal,
  type DealActivity, type InsertDealActivity,
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

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
  getContentPieceBySlug(slug: string): Promise<ContentPiece | undefined>;
  getContentPiecesByStatus(status: string, type?: string): Promise<ContentPiece[]>;
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

  updateUserProfile(id: string, data: { profilePhoto?: string; bio?: string; title?: string; linkedinUrl?: string; dashboardWidgets?: string[]; displayName?: string }): Promise<User | undefined>;

  getAuthorPublicProfile(id: string): Promise<{ id: string; displayName: string | null; profilePhoto: string | null; bio: string | null; title: string | null; linkedinUrl: string | null } | undefined>;
  getContentPiecesByAuthor(authorId: string): Promise<ContentPiece[]>;

  getCommentsByArticle(articleId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;

  getSubscribers(): Promise<Subscriber[]>;
  getSubscriber(id: string): Promise<Subscriber | undefined>;
  getSubscriberByEmail(email: string): Promise<Subscriber | undefined>;
  createSubscriber(subscriber: InsertSubscriber): Promise<Subscriber>;
  updateSubscriber(id: string, data: Partial<InsertSubscriber>): Promise<Subscriber | undefined>;
  deleteSubscriber(id: string): Promise<void>;
  getSubscriberPodcasts(subscriberId: string): Promise<SubscriberPodcast[]>;
  getSubscribersByPodcast(podcastId: string): Promise<Subscriber[]>;
  addSubscriberToPodcast(data: InsertSubscriberPodcast): Promise<SubscriberPodcast>;
  removeSubscriberFromPodcast(subscriberId: string, podcastId: string): Promise<void>;

  getCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, data: Partial<InsertCompany>): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<void>;

  getCompanyContacts(companyId?: string): Promise<CompanyContact[]>;
  getCompanyContact(id: string): Promise<CompanyContact | undefined>;
  createCompanyContact(contact: InsertCompanyContact): Promise<CompanyContact>;
  updateCompanyContact(id: string, data: Partial<InsertCompanyContact>): Promise<CompanyContact | undefined>;
  deleteCompanyContact(id: string): Promise<void>;

  getDeals(companyId?: string, stage?: string): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, data: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: string): Promise<void>;

  getDealActivities(dealId: string): Promise<DealActivity[]>;
  createDealActivity(activity: InsertDealActivity): Promise<DealActivity>;
  updateDealActivity(id: string, data: Partial<InsertDealActivity>): Promise<DealActivity | undefined>;
  deleteDealActivity(id: string): Promise<void>;
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
  async getContentPieceBySlug(slug: string) {
    const [cp] = await db.select().from(contentPieces).where(eq(contentPieces.slug, slug));
    return cp;
  }
  async getContentPiecesByStatus(status: string, type?: string) {
    if (type) {
      return db.select().from(contentPieces).where(and(eq(contentPieces.status, status), eq(contentPieces.type, type))).orderBy(desc(contentPieces.publishedAt));
    }
    return db.select().from(contentPieces).where(eq(contentPieces.status, status)).orderBy(desc(contentPieces.publishedAt));
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
  async updateUserProfile(id: string, data: { profilePhoto?: string; bio?: string; title?: string; linkedinUrl?: string; dashboardWidgets?: string[] }) {
    const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return updated;
  }

  async getAuthorPublicProfile(id: string) {
    const [user] = await db.select({
      id: users.id,
      displayName: users.displayName,
      profilePhoto: users.profilePhoto,
      bio: users.bio,
      title: users.title,
      linkedinUrl: users.linkedinUrl,
    }).from(users).where(
      and(
        eq(users.id, id),
        eq(users.status, "active"),
      )
    );
    return user;
  }

  async getContentPiecesByAuthor(authorId: string) {
    return db.select().from(contentPieces)
      .where(and(eq(contentPieces.authorId, authorId), eq(contentPieces.status, "published")))
      .orderBy(desc(contentPieces.publishedAt));
  }

  async getCommentsByArticle(articleId: string) {
    return db.select().from(comments).where(eq(comments.articleId, articleId)).orderBy(desc(comments.createdAt));
  }
  async createComment(comment: InsertComment) {
    const [created] = await db.insert(comments).values(comment).returning();
    return created;
  }
  async deleteComment(id: string) {
    await db.delete(comments).where(eq(comments.id, id));
  }

  async getSubscribers() {
    return db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
  }
  async getSubscriber(id: string) {
    const [s] = await db.select().from(subscribers).where(eq(subscribers.id, id));
    return s;
  }
  async getSubscriberByEmail(email: string) {
    const [s] = await db.select().from(subscribers).where(eq(subscribers.email, email));
    return s;
  }
  async createSubscriber(subscriber: InsertSubscriber) {
    const [created] = await db.insert(subscribers).values(subscriber).returning();
    return created;
  }
  async updateSubscriber(id: string, data: Partial<InsertSubscriber>) {
    const [updated] = await db.update(subscribers).set({ ...data, updatedAt: new Date() }).where(eq(subscribers.id, id)).returning();
    return updated;
  }
  async deleteSubscriber(id: string) {
    await db.delete(subscriberPodcasts).where(eq(subscriberPodcasts.subscriberId, id));
    await db.delete(subscribers).where(eq(subscribers.id, id));
  }
  async getSubscriberPodcasts(subscriberId: string) {
    return db.select().from(subscriberPodcasts).where(eq(subscriberPodcasts.subscriberId, subscriberId));
  }
  async getSubscribersByPodcast(podcastId: string) {
    const links = await db.select().from(subscriberPodcasts).where(eq(subscriberPodcasts.podcastId, podcastId));
    if (links.length === 0) return [];
    const subIds = links.map(l => l.subscriberId);
    const all = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
    return all.filter(s => subIds.includes(s.id));
  }
  async addSubscriberToPodcast(data: InsertSubscriberPodcast) {
    const existing = await db.select().from(subscriberPodcasts)
      .where(and(eq(subscriberPodcasts.subscriberId, data.subscriberId), eq(subscriberPodcasts.podcastId, data.podcastId)));
    if (existing.length > 0) return existing[0];
    const [created] = await db.insert(subscriberPodcasts).values(data).returning();
    return created;
  }
  async removeSubscriberFromPodcast(subscriberId: string, podcastId: string) {
    await db.delete(subscriberPodcasts).where(
      and(eq(subscriberPodcasts.subscriberId, subscriberId), eq(subscriberPodcasts.podcastId, podcastId))
    );
  }

  async getCompanies() {
    return db.select().from(companies).orderBy(desc(companies.createdAt));
  }
  async getCompany(id: string) {
    const [c] = await db.select().from(companies).where(eq(companies.id, id));
    return c;
  }
  async createCompany(company: InsertCompany) {
    const [created] = await db.insert(companies).values(company).returning();
    return created;
  }
  async updateCompany(id: string, data: Partial<InsertCompany>) {
    const [updated] = await db.update(companies).set({ ...data, updatedAt: new Date() }).where(eq(companies.id, id)).returning();
    return updated;
  }
  async deleteCompany(id: string) {
    await db.delete(dealActivities).where(
      eq(dealActivities.dealId, db.select({ id: deals.id }).from(deals).where(eq(deals.companyId, id)).limit(1) as any)
    ).catch(() => {});
    await db.delete(deals).where(eq(deals.companyId, id));
    await db.delete(companyContacts).where(eq(companyContacts.companyId, id));
    await db.delete(companies).where(eq(companies.id, id));
  }

  async getCompanyContacts(companyId?: string) {
    if (companyId) {
      return db.select().from(companyContacts).where(eq(companyContacts.companyId, companyId)).orderBy(desc(companyContacts.createdAt));
    }
    return db.select().from(companyContacts).orderBy(desc(companyContacts.createdAt));
  }
  async getCompanyContact(id: string) {
    const [c] = await db.select().from(companyContacts).where(eq(companyContacts.id, id));
    return c;
  }
  async createCompanyContact(contact: InsertCompanyContact) {
    const [created] = await db.insert(companyContacts).values(contact).returning();
    return created;
  }
  async updateCompanyContact(id: string, data: Partial<InsertCompanyContact>) {
    const [updated] = await db.update(companyContacts).set({ ...data, updatedAt: new Date() }).where(eq(companyContacts.id, id)).returning();
    return updated;
  }
  async deleteCompanyContact(id: string) {
    await db.delete(companyContacts).where(eq(companyContacts.id, id));
  }

  async getDeals(companyId?: string, stage?: string) {
    if (companyId && stage) {
      return db.select().from(deals).where(and(eq(deals.companyId, companyId), eq(deals.stage, stage))).orderBy(desc(deals.createdAt));
    }
    if (companyId) {
      return db.select().from(deals).where(eq(deals.companyId, companyId)).orderBy(desc(deals.createdAt));
    }
    if (stage) {
      return db.select().from(deals).where(eq(deals.stage, stage)).orderBy(desc(deals.createdAt));
    }
    return db.select().from(deals).orderBy(desc(deals.createdAt));
  }
  async getDeal(id: string) {
    const [d] = await db.select().from(deals).where(eq(deals.id, id));
    return d;
  }
  async createDeal(deal: InsertDeal) {
    const [created] = await db.insert(deals).values(deal).returning();
    return created;
  }
  async updateDeal(id: string, data: Partial<InsertDeal>) {
    const [updated] = await db.update(deals).set({ ...data, updatedAt: new Date() }).where(eq(deals.id, id)).returning();
    return updated;
  }
  async deleteDeal(id: string) {
    await db.delete(dealActivities).where(eq(dealActivities.dealId, id));
    await db.delete(deals).where(eq(deals.id, id));
  }

  async getDealActivities(dealId: string) {
    return db.select().from(dealActivities).where(eq(dealActivities.dealId, dealId)).orderBy(desc(dealActivities.createdAt));
  }
  async createDealActivity(activity: InsertDealActivity) {
    const [created] = await db.insert(dealActivities).values(activity).returning();
    return created;
  }
  async updateDealActivity(id: string, data: Partial<InsertDealActivity>) {
    const [updated] = await db.update(dealActivities).set(data).where(eq(dealActivities.id, id)).returning();
    return updated;
  }
  async deleteDealActivity(id: string) {
    await db.delete(dealActivities).where(eq(dealActivities.id, id));
  }
}

export const storage = new DatabaseStorage();
