import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { and } from "drizzle-orm";
import {
  users, podcasts, episodes, contentPieces, advertisers, campaigns, metrics, alerts, branding, platformSettings, comments,
  subscribers, subscriberPodcasts, companies, companyContacts, deals, dealActivities, adCreatives, outboundCampaigns, heroSlides,
  socialAccounts, scheduledPosts, clipAssets, newsletterRuns, newsLayoutSections, crmLists,
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
  type AdCreative, type InsertAdCreative,
  type OutboundCampaign, type InsertOutboundCampaign,
  type HeroSlide, type InsertHeroSlide,
  type SocialAccount, type InsertSocialAccount,
  type ScheduledPost, type InsertScheduledPost,
  type ClipAsset, type InsertClipAsset,
  type NewsletterRun, type InsertNewsletterRun,
  type NewsLayoutSection, type InsertNewsLayoutSection,
  type CrmList, type InsertCrmList,
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
  incrementPodcastSubscribers(id: string): Promise<void>;
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

  getAdCreatives(dealId: string): Promise<AdCreative[]>;
  getAdCreative(id: string): Promise<AdCreative | undefined>;
  createAdCreative(creative: InsertAdCreative): Promise<AdCreative>;
  updateAdCreative(id: string, data: Partial<InsertAdCreative>): Promise<AdCreative | undefined>;
  deleteAdCreative(id: string): Promise<void>;

  getOutboundCampaigns(audience?: string): Promise<OutboundCampaign[]>;
  getOutboundCampaign(id: string): Promise<OutboundCampaign | undefined>;
  createOutboundCampaign(campaign: InsertOutboundCampaign): Promise<OutboundCampaign>;
  updateOutboundCampaign(id: string, data: Partial<InsertOutboundCampaign>): Promise<OutboundCampaign | undefined>;
  deleteOutboundCampaign(id: string): Promise<void>;
  getConsentedSubscribers(type: "email" | "sms", podcastId?: string): Promise<Subscriber[]>;
  getConsentedContacts(type: "email" | "sms"): Promise<CompanyContact[]>;

  getHeroSlides(): Promise<HeroSlide[]>;
  getActiveHeroSlides(): Promise<HeroSlide[]>;
  getHeroSlide(id: string): Promise<HeroSlide | undefined>;
  createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide>;
  updateHeroSlide(id: string, data: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined>;
  deleteHeroSlide(id: string): Promise<void>;

  getSocialAccounts(): Promise<SocialAccount[]>;
  getSocialAccount(id: string): Promise<SocialAccount | undefined>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: string, data: Partial<InsertSocialAccount>): Promise<SocialAccount | undefined>;
  deleteSocialAccount(id: string): Promise<void>;

  getScheduledPosts(platform?: string): Promise<ScheduledPost[]>;
  getScheduledPost(id: string): Promise<ScheduledPost | undefined>;
  createScheduledPost(post: InsertScheduledPost): Promise<ScheduledPost>;
  updateScheduledPost(id: string, data: Partial<InsertScheduledPost>): Promise<ScheduledPost | undefined>;
  deleteScheduledPost(id: string): Promise<void>;

  getClipAssets(episodeId?: string): Promise<ClipAsset[]>;
  getClipAsset(id: string): Promise<ClipAsset | undefined>;
  createClipAsset(clip: InsertClipAsset): Promise<ClipAsset>;
  updateClipAsset(id: string, data: Partial<InsertClipAsset>): Promise<ClipAsset | undefined>;
  deleteClipAsset(id: string): Promise<void>;

  getNewsletterRuns(): Promise<NewsletterRun[]>;
  getNewsletterRun(id: string): Promise<NewsletterRun | undefined>;
  createNewsletterRun(run: InsertNewsletterRun): Promise<NewsletterRun>;
  updateNewsletterRun(id: string, data: Partial<InsertNewsletterRun>): Promise<NewsletterRun | undefined>;
  deleteNewsletterRun(id: string): Promise<void>;

  getNewsLayoutSections(): Promise<NewsLayoutSection[]>;
  getActiveNewsLayoutSections(): Promise<NewsLayoutSection[]>;
  getNewsLayoutSection(id: string): Promise<NewsLayoutSection | undefined>;
  createNewsLayoutSection(section: InsertNewsLayoutSection): Promise<NewsLayoutSection>;
  updateNewsLayoutSection(id: string, data: Partial<InsertNewsLayoutSection>): Promise<NewsLayoutSection | undefined>;
  deleteNewsLayoutSection(id: string): Promise<void>;

  getCrmLists(crmType?: string): Promise<CrmList[]>;
  getCrmList(id: string): Promise<CrmList | undefined>;
  createCrmList(list: InsertCrmList): Promise<CrmList>;
  deleteCrmList(id: string): Promise<void>;
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
  async incrementPodcastSubscribers(id: string) {
    await db.update(podcasts).set({ subscribers: sql`COALESCE(${podcasts.subscribers}, 0) + 1` }).where(eq(podcasts.id, id));
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

  async getAdCreatives(dealId: string) {
    return db.select().from(adCreatives).where(eq(adCreatives.dealId, dealId)).orderBy(desc(adCreatives.createdAt));
  }
  async getAdCreative(id: string) {
    const [c] = await db.select().from(adCreatives).where(eq(adCreatives.id, id));
    return c;
  }
  async createAdCreative(creative: InsertAdCreative) {
    const [created] = await db.insert(adCreatives).values(creative).returning();
    return created;
  }
  async updateAdCreative(id: string, data: Partial<InsertAdCreative>) {
    const [updated] = await db.update(adCreatives).set({ ...data, updatedAt: new Date() }).where(eq(adCreatives.id, id)).returning();
    return updated;
  }
  async deleteAdCreative(id: string) {
    await db.delete(adCreatives).where(eq(adCreatives.id, id));
  }

  async getOutboundCampaigns(audience?: string) {
    if (audience) {
      return db.select().from(outboundCampaigns).where(eq(outboundCampaigns.audience, audience)).orderBy(desc(outboundCampaigns.createdAt));
    }
    return db.select().from(outboundCampaigns).orderBy(desc(outboundCampaigns.createdAt));
  }
  async getOutboundCampaign(id: string) {
    const [c] = await db.select().from(outboundCampaigns).where(eq(outboundCampaigns.id, id));
    return c;
  }
  async createOutboundCampaign(campaign: InsertOutboundCampaign) {
    const [created] = await db.insert(outboundCampaigns).values(campaign).returning();
    return created;
  }
  async updateOutboundCampaign(id: string, data: Partial<InsertOutboundCampaign>) {
    const [updated] = await db.update(outboundCampaigns).set(data).where(eq(outboundCampaigns.id, id)).returning();
    return updated;
  }
  async deleteOutboundCampaign(id: string) {
    await db.delete(outboundCampaigns).where(eq(outboundCampaigns.id, id));
  }
  async getConsentedSubscribers(type: "email" | "sms", podcastId?: string) {
    const consentField = type === "email" ? subscribers.marketingConsent : subscribers.smsConsent;
    if (podcastId) {
      const results = await db.select({ subscriber: subscribers })
        .from(subscribers)
        .innerJoin(subscriberPodcasts, eq(subscribers.id, subscriberPodcasts.subscriberId))
        .where(and(eq(consentField, true), eq(subscribers.status, "active"), eq(subscriberPodcasts.podcastId, podcastId)));
      return results.map(r => r.subscriber);
    }
    return db.select().from(subscribers).where(and(eq(consentField, true), eq(subscribers.status, "active")));
  }
  async getConsentedContacts(type: "email" | "sms") {
    const consentField = type === "email" ? companyContacts.marketingConsent : companyContacts.smsConsent;
    return db.select().from(companyContacts).where(and(eq(consentField, true), eq(companyContacts.status, "active")));
  }

  async getHeroSlides() {
    return db.select().from(heroSlides).orderBy(heroSlides.displayOrder);
  }
  async getActiveHeroSlides() {
    return db.select().from(heroSlides).where(eq(heroSlides.active, true)).orderBy(heroSlides.displayOrder);
  }
  async getHeroSlide(id: string) {
    const [slide] = await db.select().from(heroSlides).where(eq(heroSlides.id, id));
    return slide;
  }
  async createHeroSlide(slide: InsertHeroSlide) {
    const [created] = await db.insert(heroSlides).values(slide).returning();
    return created;
  }
  async updateHeroSlide(id: string, data: Partial<InsertHeroSlide>) {
    const [updated] = await db.update(heroSlides).set(data).where(eq(heroSlides.id, id)).returning();
    return updated;
  }
  async deleteHeroSlide(id: string) {
    await db.delete(heroSlides).where(eq(heroSlides.id, id));
  }

  async getSocialAccounts() {
    return db.select().from(socialAccounts).orderBy(desc(socialAccounts.createdAt));
  }
  async getSocialAccount(id: string) {
    const [account] = await db.select().from(socialAccounts).where(eq(socialAccounts.id, id));
    return account;
  }
  async createSocialAccount(account: InsertSocialAccount) {
    const [created] = await db.insert(socialAccounts).values(account).returning();
    return created;
  }
  async updateSocialAccount(id: string, data: Partial<InsertSocialAccount>) {
    const [updated] = await db.update(socialAccounts).set(data).where(eq(socialAccounts.id, id)).returning();
    return updated;
  }
  async deleteSocialAccount(id: string) {
    await db.delete(socialAccounts).where(eq(socialAccounts.id, id));
  }

  async getScheduledPosts(platform?: string) {
    if (platform) {
      return db.select().from(scheduledPosts).where(eq(scheduledPosts.platform, platform)).orderBy(scheduledPosts.scheduledAt);
    }
    return db.select().from(scheduledPosts).orderBy(scheduledPosts.scheduledAt);
  }
  async getScheduledPost(id: string) {
    const [post] = await db.select().from(scheduledPosts).where(eq(scheduledPosts.id, id));
    return post;
  }
  async createScheduledPost(post: InsertScheduledPost) {
    const [created] = await db.insert(scheduledPosts).values(post).returning();
    return created;
  }
  async updateScheduledPost(id: string, data: Partial<InsertScheduledPost>) {
    const [updated] = await db.update(scheduledPosts).set(data).where(eq(scheduledPosts.id, id)).returning();
    return updated;
  }
  async deleteScheduledPost(id: string) {
    await db.delete(scheduledPosts).where(eq(scheduledPosts.id, id));
  }

  async getClipAssets(episodeId?: string) {
    if (episodeId) {
      return db.select().from(clipAssets).where(eq(clipAssets.episodeId, episodeId)).orderBy(desc(clipAssets.viralScore));
    }
    return db.select().from(clipAssets).orderBy(desc(clipAssets.createdAt));
  }
  async getClipAsset(id: string) {
    const [clip] = await db.select().from(clipAssets).where(eq(clipAssets.id, id));
    return clip;
  }
  async createClipAsset(clip: InsertClipAsset) {
    const [created] = await db.insert(clipAssets).values(clip).returning();
    return created;
  }
  async updateClipAsset(id: string, data: Partial<InsertClipAsset>) {
    const [updated] = await db.update(clipAssets).set(data).where(eq(clipAssets.id, id)).returning();
    return updated;
  }
  async deleteClipAsset(id: string) {
    await db.delete(clipAssets).where(eq(clipAssets.id, id));
  }

  async getNewsletterRuns() {
    return db.select().from(newsletterRuns).orderBy(desc(newsletterRuns.createdAt));
  }
  async getNewsletterRun(id: string) {
    const [run] = await db.select().from(newsletterRuns).where(eq(newsletterRuns.id, id));
    return run;
  }
  async createNewsletterRun(run: InsertNewsletterRun) {
    const [created] = await db.insert(newsletterRuns).values(run).returning();
    return created;
  }
  async updateNewsletterRun(id: string, data: Partial<InsertNewsletterRun>) {
    const [updated] = await db.update(newsletterRuns).set(data).where(eq(newsletterRuns.id, id)).returning();
    return updated;
  }
  async deleteNewsletterRun(id: string) {
    await db.delete(newsletterRuns).where(eq(newsletterRuns.id, id));
  }

  async getNewsLayoutSections() {
    return db.select().from(newsLayoutSections).orderBy(newsLayoutSections.displayOrder);
  }
  async getActiveNewsLayoutSections() {
    return db.select().from(newsLayoutSections).where(eq(newsLayoutSections.active, true)).orderBy(newsLayoutSections.displayOrder);
  }
  async getNewsLayoutSection(id: string) {
    const [section] = await db.select().from(newsLayoutSections).where(eq(newsLayoutSections.id, id));
    return section;
  }
  async createNewsLayoutSection(section: InsertNewsLayoutSection) {
    const [created] = await db.insert(newsLayoutSections).values(section).returning();
    return created;
  }
  async updateNewsLayoutSection(id: string, data: Partial<InsertNewsLayoutSection>) {
    const [updated] = await db.update(newsLayoutSections).set(data).where(eq(newsLayoutSections.id, id)).returning();
    return updated;
  }
  async deleteNewsLayoutSection(id: string) {
    await db.delete(newsLayoutSections).where(eq(newsLayoutSections.id, id));
  }

  async getCrmLists(crmType?: string) {
    if (crmType) {
      return db.select().from(crmLists).where(eq(crmLists.crmType, crmType)).orderBy(desc(crmLists.createdAt));
    }
    return db.select().from(crmLists).orderBy(desc(crmLists.createdAt));
  }
  async getCrmList(id: string) {
    const [list] = await db.select().from(crmLists).where(eq(crmLists.id, id));
    return list;
  }
  async createCrmList(list: InsertCrmList) {
    const [created] = await db.insert(crmLists).values(list).returning();
    return created;
  }
  async deleteCrmList(id: string) {
    await db.delete(crmLists).where(eq(crmLists.id, id));
  }
}

export const storage = new DatabaseStorage();
