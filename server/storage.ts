import { eq, desc, sql, gte, lte, count, inArray, ilike } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { and } from "drizzle-orm";
import {
  users, podcasts, episodes, contentPieces, advertisers, campaigns, metrics, alerts, branding, platformSettings, comments,
  subscribers, subscriberPodcasts, companies, companyContacts, deals, dealActivities, dealLineItems, products, adCreatives, outboundCampaigns, campaignEmails, heroSlides,
  socialAccounts, scheduledPosts, clipAssets, newsletterSchedules, newsletterRuns, newsLayoutSections, crmLists, auditLogs, apiKeys,
  tasks, taskComments, taskActivityLogs, npsSurveys,
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
  type Product, type InsertProduct,
  type AdCreative, type InsertAdCreative,
  type OutboundCampaign, type InsertOutboundCampaign,
  type DealLineItem, type InsertDealLineItem,
  type CampaignEmail, type InsertCampaignEmail,
  type HeroSlide, type InsertHeroSlide,
  type SocialAccount, type InsertSocialAccount,
  type ScheduledPost, type InsertScheduledPost,
  type ClipAsset, type InsertClipAsset,
  type NewsletterSchedule, type InsertNewsletterSchedule,
  type NewsletterRun, type InsertNewsletterRun,
  type AuditLog, type InsertAuditLog,
  type ApiKey, type InsertApiKey,
  type NewsLayoutSection, type InsertNewsLayoutSection,
  type CrmList, type InsertCrmList,
  type Task, type InsertTask,
  type TaskComment, type InsertTaskComment,
  type TaskActivityLog, type InsertTaskActivityLog,
  type NpsSurvey, type InsertNpsSurvey,
  readLaterItems,
  type ReadLaterItem, type InsertReadLaterItem,
  legalTemplates, type LegalTemplate, type InsertLegalTemplate,
  deviceRegistrations, type DeviceRegistration, type InsertDeviceRegistration,
  pushNotifications, type PushNotification, type InsertPushNotification,
  contentBookmarks, type ContentBookmark, type InsertContentBookmark,
  sitePages, type SitePage, type InsertSitePage,
  pageRows, type PageRow, type InsertPageRow,
  pageWidgets, type PageWidget, type InsertPageWidget,
  pageTemplates, type PageTemplate, type InsertPageTemplate,
  communityEvents, type CommunityEvent, type InsertCommunityEvent,
  obituaries, type Obituary, type InsertObituary,
  classifieds, type Classified, type InsertClassified,
  communityPolls, type CommunityPoll, type InsertCommunityPoll,
  pollVotes, type PollVote, type InsertPollVote,
  communityAnnouncements, type CommunityAnnouncement, type InsertCommunityAnnouncement,
  communityPosts, type CommunityPost, type InsertCommunityPost,
  communityLikes, type CommunityLike, type InsertCommunityLike,
  businessListings, type BusinessListing, type InsertBusinessListing,
  aiLayoutExamples, type AiLayoutExample, type InsertAiLayoutExample,
  adInjectionLog, type AdInjectionLog, type InsertAdInjectionLog,
  devicePushSubscriptions, type DevicePushSubscription, type InsertDevicePushSubscription,
  adminPageConfigs, type AdminPageConfig, type InsertAdminPageConfig,
  adminNavSections, type AdminNavSection, type InsertAdminNavSection,
  commercialLeads, type CommercialLead, type InsertCommercialLead,
  commercialProposals, type CommercialProposal, type InsertCommercialProposal,
  commercialOrders, type CommercialOrder, type InsertCommercialOrder,
  campaignPerformance, type CampaignPerformance, type InsertCampaignPerformance,
  aiAdvertiserPrompts, type AiAdvertiserPrompt, type InsertAiAdvertiserPrompt,
  aiContentLog, type AiContentLog, type InsertAiContentLog,
  notifications, type Notification, type InsertNotification,
  aiAgents, type AiAgent, type InsertAiAgent,
  pushCampaigns, type PushCampaign, type InsertPushCampaign,
  pushCampaignLogs, type PushCampaignLog, type InsertPushCampaignLog,
  builtPages, type BuiltPage, type InsertBuiltPage,
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
  getContentPiecesFiltered(filters: { status?: string; type?: string; assignedTo?: string; source?: string; priority?: string; search?: string }): Promise<ContentPiece[]>;
  getContentMetricsCounts(): Promise<Record<string, number>>;
  createContentPiece(piece: InsertContentPiece): Promise<ContentPiece>;
  updateContentPiece(id: string, data: Partial<InsertContentPiece>): Promise<ContentPiece | undefined>;
  reorderContentPieces(pieceIds: string[]): Promise<void>;

  getAdvertisers(): Promise<Advertiser[]>;
  getAdvertiser(id: string): Promise<Advertiser | undefined>;
  createAdvertiser(advertiser: InsertAdvertiser): Promise<Advertiser>;
  updateAdvertiser(id: string, data: Partial<InsertAdvertiser>): Promise<Advertiser | undefined>;

  getCampaigns(filters?: { advertiserId?: string; companyId?: string; dealId?: string }): Promise<Campaign[]>;
  getCampaignByDealId(dealId: string): Promise<Campaign | undefined>;
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

  getAuditLogs(limit?: number, offset?: number): Promise<AuditLog[]>;
  createAuditLog(data: InsertAuditLog): Promise<AuditLog>;
  getAuditLogCount(): Promise<number>;

  getApiKeys(): Promise<ApiKey[]>;
  createApiKey(data: InsertApiKey): Promise<ApiKey>;
  revokeApiKey(id: string): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<void>;

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

  getProducts(status?: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, data: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<void>;
  reorderProducts(productIds: string[]): Promise<void>;

  getDealLineItems(dealId: string): Promise<DealLineItem[]>;
  createDealLineItem(item: InsertDealLineItem): Promise<DealLineItem>;
  updateDealLineItem(id: string, data: Partial<InsertDealLineItem>): Promise<DealLineItem | undefined>;
  deleteDealLineItem(id: string): Promise<void>;
  replaceDealLineItems(dealId: string, items: InsertDealLineItem[]): Promise<DealLineItem[]>;
  reorderDealLineItems(dealId: string, itemIds: string[]): Promise<void>;

  getAdCreatives(dealId: string): Promise<AdCreative[]>;
  getAdCreativesByFormat(format: string): Promise<AdCreative[]>;
  getAdCreative(id: string): Promise<AdCreative | undefined>;
  createAdCreative(creative: InsertAdCreative): Promise<AdCreative>;
  updateAdCreative(id: string, data: Partial<InsertAdCreative>): Promise<AdCreative | undefined>;
  deleteAdCreative(id: string): Promise<void>;

  getOutboundCampaigns(audience?: string): Promise<OutboundCampaign[]>;
  getOutboundCampaign(id: string): Promise<OutboundCampaign | undefined>;
  createOutboundCampaign(campaign: InsertOutboundCampaign): Promise<OutboundCampaign>;
  updateOutboundCampaign(id: string, data: Partial<InsertOutboundCampaign>): Promise<OutboundCampaign | undefined>;
  deleteOutboundCampaign(id: string): Promise<void>;

  getCampaignEmails(campaignId: string): Promise<CampaignEmail[]>;
  getCampaignEmail(id: string): Promise<CampaignEmail | undefined>;
  createCampaignEmail(email: InsertCampaignEmail): Promise<CampaignEmail>;
  updateCampaignEmail(id: string, data: Partial<InsertCampaignEmail>): Promise<CampaignEmail | undefined>;
  deleteCampaignEmail(id: string): Promise<void>;
  reorderCampaignEmails(campaignId: string, emailIds: string[]): Promise<void>;
  getConsentedSubscribers(type: "email" | "sms", podcastId?: string): Promise<Subscriber[]>;
  getConsentedContacts(type: "email" | "sms"): Promise<CompanyContact[]>;

  getHeroSlides(): Promise<HeroSlide[]>;
  getActiveHeroSlides(): Promise<HeroSlide[]>;
  getHeroSlide(id: string): Promise<HeroSlide | undefined>;
  createHeroSlide(slide: InsertHeroSlide): Promise<HeroSlide>;
  updateHeroSlide(id: string, data: Partial<InsertHeroSlide>): Promise<HeroSlide | undefined>;
  deleteHeroSlide(id: string): Promise<void>;

  getSocialAccounts(filter?: { ownerType?: string; podcastId?: string }): Promise<SocialAccount[]>;
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

  getNewsletterSchedules(): Promise<NewsletterSchedule[]>;
  getNewsletterSchedule(id: string): Promise<NewsletterSchedule | undefined>;
  getActiveNewsletterSchedules(): Promise<NewsletterSchedule[]>;
  createNewsletterSchedule(schedule: InsertNewsletterSchedule): Promise<NewsletterSchedule>;
  updateNewsletterSchedule(id: string, data: Partial<InsertNewsletterSchedule>): Promise<NewsletterSchedule | undefined>;
  deleteNewsletterSchedule(id: string): Promise<void>;

  getNewsletterRuns(): Promise<NewsletterRun[]>;
  getNewsletterRun(id: string): Promise<NewsletterRun | undefined>;
  getNewsletterRunsBySchedule(scheduleId: string): Promise<NewsletterRun[]>;
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

  getTasks(filters?: { status?: string; assigneeId?: string; podcastId?: string }): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  getTasksByAssignee(userId: string): Promise<Task[]>;
  getTasksByDueDate(from: Date, to: Date): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;
  deleteTaskComment(id: string): Promise<void>;
  getTaskActivityLogs(taskId: string): Promise<TaskActivityLog[]>;
  createTaskActivityLog(log: InsertTaskActivityLog): Promise<TaskActivityLog>;

  getNpsSurveys(): Promise<NpsSurvey[]>;
  createNpsSurvey(survey: InsertNpsSurvey): Promise<NpsSurvey>;
  getNpsSurveysByUser(userId: string): Promise<NpsSurvey[]>;

  getSubscribersPaginated(limit: number, offset: number): Promise<{ data: Subscriber[]; total: number }>;
  getCompaniesPaginated(limit: number, offset: number): Promise<{ data: Company[]; total: number }>;
  getContactsPaginated(limit: number, offset: number, companyId?: string): Promise<{ data: CompanyContact[]; total: number }>;
  getDealsPaginated(limit: number, offset: number, companyId?: string, stage?: string): Promise<{ data: Deal[]; total: number }>;
  getContentPiecesPaginated(limit: number, offset: number, episodeId?: string): Promise<{ data: ContentPiece[]; total: number }>;
  getEpisodesPaginated(limit: number, offset: number, podcastId?: string): Promise<{ data: Episode[]; total: number }>;

  getReadLaterItems(userId: string): Promise<ReadLaterItem[]>;
  addReadLaterItem(data: InsertReadLaterItem): Promise<ReadLaterItem>;
  removeReadLaterItem(userId: string, contentPieceId: string): Promise<void>;
  clearReadLaterItems(userId: string): Promise<void>;
  isReadLater(userId: string, contentPieceId: string): Promise<boolean>;

  getLegalTemplates(): Promise<LegalTemplate[]>;
  getLegalTemplate(id: string): Promise<LegalTemplate | undefined>;
  getLegalTemplateByType(templateType: string): Promise<LegalTemplate | undefined>;
  createLegalTemplate(data: InsertLegalTemplate): Promise<LegalTemplate>;
  updateLegalTemplate(id: string, data: Partial<InsertLegalTemplate>): Promise<LegalTemplate | undefined>;
  deleteLegalTemplate(id: string): Promise<void>;

  registerDevice(data: InsertDeviceRegistration): Promise<DeviceRegistration>;
  getDevicesBySubscriber(subscriberId: string): Promise<DeviceRegistration[]>;

  createPushNotification(data: InsertPushNotification): Promise<PushNotification>;
  getPushNotifications(limit?: number): Promise<PushNotification[]>;

  getBookmarks(subscriberId: string): Promise<ContentBookmark[]>;
  addBookmark(data: InsertContentBookmark): Promise<ContentBookmark>;
  removeBookmark(subscriberId: string, contentId: string): Promise<void>;

  getSitePages(): Promise<SitePage[]>;
  getSitePage(id: string): Promise<SitePage | undefined>;
  getSitePageBySlug(slug: string): Promise<SitePage | undefined>;
  createSitePage(data: InsertSitePage): Promise<SitePage>;
  updateSitePage(id: string, data: Partial<InsertSitePage>): Promise<SitePage | undefined>;
  deleteSitePage(id: string): Promise<void>;

  getPageRows(pageId: string): Promise<PageRow[]>;
  createPageRow(data: InsertPageRow): Promise<PageRow>;
  updatePageRow(id: string, data: Partial<InsertPageRow>): Promise<PageRow | undefined>;
  deletePageRow(id: string): Promise<void>;

  getPageWidgets(rowId: string): Promise<PageWidget[]>;
  getPageWidgetsByPage(pageId: string): Promise<PageWidget[]>;
  createPageWidget(data: InsertPageWidget): Promise<PageWidget>;
  updatePageWidget(id: string, data: Partial<InsertPageWidget>): Promise<PageWidget | undefined>;
  deletePageWidget(id: string): Promise<void>;

  getPageTemplates(): Promise<PageTemplate[]>;
  getPageTemplate(id: string): Promise<PageTemplate | undefined>;
  createPageTemplate(data: InsertPageTemplate): Promise<PageTemplate>;
  deletePageTemplate(id: string): Promise<void>;

  getCommunityEvents(status?: string): Promise<CommunityEvent[]>;
  getCommunityEvent(id: string): Promise<CommunityEvent | undefined>;
  createCommunityEvent(data: InsertCommunityEvent): Promise<CommunityEvent>;
  updateCommunityEvent(id: string, data: Partial<InsertCommunityEvent>): Promise<CommunityEvent | undefined>;
  deleteCommunityEvent(id: string): Promise<void>;

  getObituaries(): Promise<Obituary[]>;
  getObituary(id: string): Promise<Obituary | undefined>;
  createObituary(data: InsertObituary): Promise<Obituary>;
  updateObituary(id: string, data: Partial<InsertObituary>): Promise<Obituary | undefined>;
  deleteObituary(id: string): Promise<void>;

  getClassifieds(category?: string, status?: string): Promise<Classified[]>;
  getClassified(id: string): Promise<Classified | undefined>;
  createClassified(data: InsertClassified): Promise<Classified>;
  updateClassified(id: string, data: Partial<InsertClassified>): Promise<Classified | undefined>;
  deleteClassified(id: string): Promise<void>;

  getCommunityPolls(): Promise<CommunityPoll[]>;
  getCommunityPoll(id: string): Promise<CommunityPoll | undefined>;
  getCommunityPollById(id: string): Promise<CommunityPoll | undefined>;
  createCommunityPoll(data: InsertCommunityPoll): Promise<CommunityPoll>;
  updateCommunityPoll(id: string, data: Partial<InsertCommunityPoll>): Promise<CommunityPoll | undefined>;
  deleteCommunityPoll(id: string): Promise<void>;

  getPollVotes(pollId: string): Promise<PollVote[]>;
  castPollVote(data: InsertPollVote): Promise<PollVote>;

  getCommunityPosts(parentId?: string): Promise<CommunityPost[]>;
  getCommunityPostById(id: string): Promise<CommunityPost | undefined>;
  createCommunityPost(data: InsertCommunityPost): Promise<CommunityPost>;
  updateCommunityPost(id: string, data: Partial<InsertCommunityPost>): Promise<CommunityPost | undefined>;
  deleteCommunityPost(id: string): Promise<void>;
  toggleCommunityLike(postId: string, likerIdentifier: string): Promise<{ liked: boolean }>;

  getCommunityAnnouncements(status?: string): Promise<CommunityAnnouncement[]>;
  getCommunityAnnouncement(id: string): Promise<CommunityAnnouncement | undefined>;
  createCommunityAnnouncement(data: InsertCommunityAnnouncement): Promise<CommunityAnnouncement>;
  updateCommunityAnnouncement(id: string, data: Partial<InsertCommunityAnnouncement>): Promise<CommunityAnnouncement | undefined>;
  deleteCommunityAnnouncement(id: string): Promise<void>;

  getBusinessListings(category?: string): Promise<BusinessListing[]>;
  getBusinessListing(id: string): Promise<BusinessListing | undefined>;
  getBusinessListingBySlug(slug: string): Promise<BusinessListing | undefined>;
  createBusinessListing(data: InsertBusinessListing): Promise<BusinessListing>;
  updateBusinessListing(id: string, data: Partial<InsertBusinessListing>): Promise<BusinessListing | undefined>;
  deleteBusinessListing(id: string): Promise<void>;

  getAiLayoutExamples(pageType?: string): Promise<AiLayoutExample[]>;
  getAiLayoutExample(id: string): Promise<AiLayoutExample | undefined>;
  createAiLayoutExample(data: InsertAiLayoutExample): Promise<AiLayoutExample>;
  updateAiLayoutExample(id: string, data: Partial<InsertAiLayoutExample>): Promise<AiLayoutExample | undefined>;
  deleteAiLayoutExample(id: string): Promise<void>;

  getAdInjectionLogs(pageId?: string): Promise<AdInjectionLog[]>;
  createAdInjectionLog(data: InsertAdInjectionLog): Promise<AdInjectionLog>;

  getAdminPageConfigs(): Promise<AdminPageConfig[]>;
  getAdminPageConfigByKey(pageKey: string): Promise<AdminPageConfig | undefined>;
  upsertAdminPageConfig(data: InsertAdminPageConfig): Promise<AdminPageConfig>;
  updateAdminPageConfig(pageKey: string, data: Partial<InsertAdminPageConfig>): Promise<AdminPageConfig | undefined>;
  deleteAdminPageConfig(pageKey: string): Promise<boolean>;
  batchUpdatePageConfigOrder(pages: { pageKey: string; sortOrder: number; navSection: string }[]): Promise<void>;
  deleteAllAdminPageConfigs(): Promise<void>;

  // Commercial Leads
  getCommercialLeads(filters?: { pipelineType?: string; pipelineStage?: string }): Promise<CommercialLead[]>;
  getCommercialLead(id: string): Promise<CommercialLead | undefined>;
  createCommercialLead(data: InsertCommercialLead): Promise<CommercialLead>;
  updateCommercialLead(id: string, data: Partial<InsertCommercialLead>): Promise<CommercialLead | undefined>;
  deleteCommercialLead(id: string): Promise<void>;

  // Commercial Proposals
  getCommercialProposals(leadId?: string): Promise<CommercialProposal[]>;
  getCommercialProposal(id: string): Promise<CommercialProposal | undefined>;
  createCommercialProposal(data: InsertCommercialProposal): Promise<CommercialProposal>;
  updateCommercialProposal(id: string, data: Partial<InsertCommercialProposal>): Promise<CommercialProposal | undefined>;

  // Commercial Orders
  getCommercialOrders(filters?: { leadId?: string; status?: string }): Promise<CommercialOrder[]>;
  getCommercialOrder(id: string): Promise<CommercialOrder | undefined>;
  createCommercialOrder(data: InsertCommercialOrder): Promise<CommercialOrder>;
  updateCommercialOrder(id: string, data: Partial<InsertCommercialOrder>): Promise<CommercialOrder | undefined>;

  // Campaign Performance
  getCampaignPerformance(orderId?: string): Promise<CampaignPerformance[]>;
  createCampaignPerformance(data: InsertCampaignPerformance): Promise<CampaignPerformance>;
  updateCampaignPerformance(id: string, data: Partial<InsertCampaignPerformance>): Promise<CampaignPerformance | undefined>;

  // AI Advertiser Prompts
  getAiAdvertiserPrompts(status?: string): Promise<AiAdvertiserPrompt[]>;
  createAiAdvertiserPrompt(data: InsertAiAdvertiserPrompt): Promise<AiAdvertiserPrompt>;
  updateAiAdvertiserPrompt(id: string, data: Partial<InsertAiAdvertiserPrompt>): Promise<AiAdvertiserPrompt | undefined>;

  // AI Content Log
  createAiContentLog(data: InsertAiContentLog): Promise<AiContentLog>;
  getAiContentLogs(limit?: number): Promise<AiContentLog[]>;
  getAiContentLogCountToday(): Promise<number>;

  // Notifications
  getNotifications(userId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  createNotification(data: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  // Community Posts enhanced
  getCommunityPostsByTopic(topic: string): Promise<CommunityPost[]>;
  getCommunityThreadReplies(parentId: string): Promise<CommunityPost[]>;
  getFlaggedCommunityPosts(): Promise<CommunityPost[]>;
  moderateCommunityPost(id: string, status: string, moderatedBy: string): Promise<CommunityPost | undefined>;
  flagCommunityPost(id: string, reason: string): Promise<CommunityPost | undefined>;

  // AI Agents
  getAiAgents(): Promise<AiAgent[]>;
  getAiAgent(id: string): Promise<AiAgent | undefined>;
  createAiAgent(data: InsertAiAgent): Promise<AiAgent>;
  updateAiAgent(id: string, data: Partial<InsertAiAgent>): Promise<AiAgent | undefined>;
  deleteAiAgent(id: string): Promise<void>;

  // Push Campaigns
  getPushCampaigns(): Promise<PushCampaign[]>;
  getPushCampaign(id: string): Promise<PushCampaign | undefined>;
  createPushCampaign(data: InsertPushCampaign): Promise<PushCampaign>;
  updatePushCampaign(id: string, data: Partial<InsertPushCampaign>): Promise<PushCampaign | undefined>;
  deletePushCampaign(id: string): Promise<void>;
  getPushCampaignLogs(campaignId: string): Promise<PushCampaignLog[]>;
  createPushCampaignLog(data: InsertPushCampaignLog): Promise<PushCampaignLog>;

  // Built Pages
  getBuiltPages(): Promise<BuiltPage[]>;
  getBuiltPage(id: string): Promise<BuiltPage | undefined>;
  getBuiltPageBySlug(slug: string): Promise<BuiltPage | undefined>;
  createBuiltPage(data: InsertBuiltPage): Promise<BuiltPage>;
  updateBuiltPage(id: string, data: Partial<InsertBuiltPage>): Promise<BuiltPage | undefined>;
  deleteBuiltPage(id: string): Promise<void>;
  publishBuiltPage(id: string): Promise<BuiltPage | undefined>;
  unpublishBuiltPage(id: string): Promise<BuiltPage | undefined>;
  duplicateBuiltPage(id: string): Promise<BuiltPage | undefined>;
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
    const [updated] = await db.update(podcasts).set({ ...data, updatedAt: new Date() }).where(eq(podcasts.id, id)).returning();
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
    const [updated] = await db.update(episodes).set({ ...data, updatedAt: new Date() }).where(eq(episodes.id, id)).returning();
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
    const results = await db.select({ contentPiece: contentPieces })
      .from(contentPieces)
      .innerJoin(episodes, eq(contentPieces.episodeId, episodes.id))
      .where(and(eq(episodes.podcastId, podcastId), eq(contentPieces.type, "article")))
      .orderBy(desc(contentPieces.publishedAt));
    return results.map(r => r.contentPiece);
  }
  async createContentPiece(piece: InsertContentPiece) {
    const [created] = await db.insert(contentPieces).values(piece).returning();
    return created;
  }
  async updateContentPiece(id: string, data: Partial<InsertContentPiece>) {
    const [updated] = await db.update(contentPieces).set({ ...data, updatedAt: new Date() }).where(eq(contentPieces.id, id)).returning();
    return updated;
  }
  async getContentPiecesFiltered(filters: { status?: string; type?: string; assignedTo?: string; source?: string; priority?: string; search?: string }) {
    const conditions = [];
    if (filters.status) conditions.push(eq(contentPieces.status, filters.status));
    if (filters.type) conditions.push(eq(contentPieces.type, filters.type));
    if (filters.assignedTo) conditions.push(eq(contentPieces.assignedTo, filters.assignedTo));
    if (filters.source) conditions.push(eq(contentPieces.source, filters.source));
    if (filters.priority) conditions.push(eq(contentPieces.priority, filters.priority));
    if (filters.search) conditions.push(ilike(contentPieces.title, `%${filters.search}%`));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    return db.select().from(contentPieces).where(where).orderBy(desc(contentPieces.updatedAt));
  }
  async getContentMetricsCounts() {
    const all = await db.select({ status: contentPieces.status }).from(contentPieces);
    const counts: Record<string, number> = { total: all.length, draft: 0, in_review: 0, approved: 0, scheduled: 0, published: 0, rejected: 0, ai_generated: 0 };
    for (const row of all) {
      const s = row.status || "draft";
      if (counts[s] !== undefined) counts[s]++;
    }
    const aiCount = await db.select().from(contentPieces).where(eq(contentPieces.source, "ai_generated"));
    counts.ai_generated = aiCount.length;
    return counts;
  }
  async reorderContentPieces(pieceIds: string[]) {
    if (pieceIds.length === 0) return;
    const cases = pieceIds.map((id, i) => sql`WHEN id = ${id} THEN ${i}`);
    await db.execute(sql`UPDATE content_pieces SET sort_order = CASE ${sql.join(cases, sql` `)} END WHERE id IN (${sql.join(pieceIds.map(id => sql`${id}`), sql`, `)})`);
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
    const [updated] = await db.update(advertisers).set({ ...data, updatedAt: new Date() }).where(eq(advertisers.id, id)).returning();
    return updated;
  }

  async getCampaigns(filters?: { advertiserId?: string; companyId?: string; dealId?: string }) {
    if (filters?.dealId) {
      return db.select().from(campaigns).where(eq(campaigns.dealId, filters.dealId));
    }
    if (filters?.companyId) {
      return db.select().from(campaigns).where(eq(campaigns.companyId, filters.companyId));
    }
    if (filters?.advertiserId) {
      return db.select().from(campaigns).where(eq(campaigns.advertiserId, filters.advertiserId));
    }
    return db.select().from(campaigns);
  }
  async getCampaignByDealId(dealId: string) {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.dealId, dealId)).limit(1);
    return campaign;
  }
  async createCampaign(campaign: InsertCampaign) {
    const [created] = await db.insert(campaigns).values(campaign).returning();
    return created;
  }
  async updateCampaign(id: string, data: Partial<InsertCampaign>) {
    const [updated] = await db.update(campaigns).set({ ...data, updatedAt: new Date() }).where(eq(campaigns.id, id)).returning();
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
    await db.update(alerts).set({ read: true, updatedAt: new Date() }).where(eq(alerts.id, id));
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

  async getAuditLogs(limit = 50, offset = 0) {
    return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
  }

  async createAuditLog(data: InsertAuditLog) {
    const [log] = await db.insert(auditLogs).values(data).returning();
    return log;
  }

  async getAuditLogCount() {
    const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLogs);
    return result?.count || 0;
  }

  async getApiKeys() {
    return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async createApiKey(data: InsertApiKey) {
    const [key] = await db.insert(apiKeys).values(data).returning();
    return key;
  }

  async revokeApiKey(id: string) {
    const [key] = await db.update(apiKeys).set({ revokedAt: new Date() }).where(eq(apiKeys.id, id)).returning();
    return key;
  }

  async deleteApiKey(id: string) {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
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
    await db.transaction(async (tx) => {
      await tx.delete(subscriberPodcasts).where(eq(subscriberPodcasts.subscriberId, id));
      await tx.delete(subscribers).where(eq(subscribers.id, id));
    });
  }
  async getSubscriberPodcasts(subscriberId: string) {
    return db.select().from(subscriberPodcasts).where(eq(subscriberPodcasts.subscriberId, subscriberId));
  }
  async getSubscribersByPodcast(podcastId: string) {
    const results = await db.select({ subscriber: subscribers })
      .from(subscribers)
      .innerJoin(subscriberPodcasts, eq(subscribers.id, subscriberPodcasts.subscriberId))
      .where(eq(subscriberPodcasts.podcastId, podcastId))
      .orderBy(desc(subscribers.createdAt));
    return results.map(r => r.subscriber);
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
    await db.transaction(async (tx) => {
      const companyDeals = await tx.select({ id: deals.id }).from(deals).where(eq(deals.companyId, id));
      const dealIds = companyDeals.map(d => d.id);
      if (dealIds.length > 0) {
        await tx.delete(dealLineItems).where(inArray(dealLineItems.dealId, dealIds));
        await tx.delete(dealActivities).where(inArray(dealActivities.dealId, dealIds));
        await tx.delete(deals).where(eq(deals.companyId, id));
      }
      await tx.delete(companyContacts).where(eq(companyContacts.companyId, id));
      await tx.delete(companies).where(eq(companies.id, id));
    });
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
    await db.transaction(async (tx) => {
      await tx.delete(dealLineItems).where(eq(dealLineItems.dealId, id));
      await tx.delete(dealActivities).where(eq(dealActivities.dealId, id));
      await tx.delete(deals).where(eq(deals.id, id));
    });
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

  async getDealLineItems(dealId: string) {
    return db.select().from(dealLineItems).where(eq(dealLineItems.dealId, dealId)).orderBy(dealLineItems.sortOrder);
  }
  async createDealLineItem(item: InsertDealLineItem) {
    const [created] = await db.insert(dealLineItems).values(item).returning();
    return created;
  }
  async updateDealLineItem(id: string, data: Partial<InsertDealLineItem>) {
    const [updated] = await db.update(dealLineItems).set(data).where(eq(dealLineItems.id, id)).returning();
    return updated;
  }
  async deleteDealLineItem(id: string) {
    await db.delete(dealLineItems).where(eq(dealLineItems.id, id));
  }
  async replaceDealLineItems(dealId: string, items: InsertDealLineItem[]) {
    await db.delete(dealLineItems).where(eq(dealLineItems.dealId, dealId));
    if (items.length === 0) return [];
    const created = await db.insert(dealLineItems).values(items).returning();
    return created;
  }
  async reorderDealLineItems(dealId: string, itemIds: string[]) {
    if (itemIds.length === 0) return;
    const cases = itemIds.map((id, i) => sql`WHEN id = ${id} THEN ${i}`);
    await db.execute(sql`UPDATE deal_line_items SET sort_order = CASE ${sql.join(cases, sql` `)} END WHERE id IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`);
  }

  async getProducts(status?: string) {
    if (status) {
      return db.select().from(products).where(eq(products.status, status)).orderBy(products.sortOrder);
    }
    return db.select().from(products).orderBy(products.sortOrder);
  }
  async getProduct(id: string) {
    const [p] = await db.select().from(products).where(eq(products.id, id));
    return p;
  }
  async createProduct(product: InsertProduct) {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }
  async updateProduct(id: string, data: Partial<InsertProduct>) {
    const [updated] = await db.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    return updated;
  }
  async deleteProduct(id: string) {
    await db.delete(products).where(eq(products.id, id));
  }
  async reorderProducts(productIds: string[]) {
    if (productIds.length === 0) return;
    const cases = productIds.map((id, i) => sql`WHEN id = ${id} THEN ${i}`);
    await db.execute(sql`UPDATE products SET sort_order = CASE ${sql.join(cases, sql` `)} END WHERE id IN (${sql.join(productIds.map(id => sql`${id}`), sql`, `)})`);
  }

  async getAdCreatives(dealId: string) {
    return db.select().from(adCreatives).where(eq(adCreatives.dealId, dealId)).orderBy(desc(adCreatives.createdAt));
  }
  async getAdCreativesByFormat(format: string) {
    return db.select().from(adCreatives).where(eq(adCreatives.format, format));
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
    await db.transaction(async (tx) => {
      await tx.delete(campaignEmails).where(eq(campaignEmails.campaignId, id));
      await tx.delete(outboundCampaigns).where(eq(outboundCampaigns.id, id));
    });
  }

  async getCampaignEmails(campaignId: string) {
    return db.select().from(campaignEmails).where(eq(campaignEmails.campaignId, campaignId)).orderBy(campaignEmails.sortOrder);
  }
  async getCampaignEmail(id: string) {
    const [email] = await db.select().from(campaignEmails).where(eq(campaignEmails.id, id)).limit(1);
    return email;
  }
  async createCampaignEmail(email: InsertCampaignEmail) {
    const [created] = await db.insert(campaignEmails).values(email).returning();
    return created;
  }
  async updateCampaignEmail(id: string, data: Partial<InsertCampaignEmail>) {
    const [updated] = await db.update(campaignEmails).set({ ...data, updatedAt: new Date() }).where(eq(campaignEmails.id, id)).returning();
    return updated;
  }
  async deleteCampaignEmail(id: string) {
    await db.delete(campaignEmails).where(eq(campaignEmails.id, id));
  }
  async reorderCampaignEmails(campaignId: string, emailIds: string[]) {
    if (emailIds.length === 0) return;
    const sortCases = emailIds.map((id, i) => sql`WHEN id = ${id} THEN ${i}`);
    const dayCases = emailIds.map((id, i) => sql`WHEN id = ${id} THEN ${i + 1}`);
    await db.execute(sql`UPDATE campaign_emails SET sort_order = CASE ${sql.join(sortCases, sql` `)} END, day_number = CASE ${sql.join(dayCases, sql` `)} END WHERE id IN (${sql.join(emailIds.map(id => sql`${id}`), sql`, `)})`);
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
    const [updated] = await db.update(heroSlides).set({ ...data, updatedAt: new Date() }).where(eq(heroSlides.id, id)).returning();
    return updated;
  }
  async deleteHeroSlide(id: string) {
    await db.delete(heroSlides).where(eq(heroSlides.id, id));
  }

  async getSocialAccounts(filter?: { ownerType?: string; podcastId?: string }) {
    const conditions = [];
    if (filter?.ownerType) conditions.push(eq(socialAccounts.ownerType, filter.ownerType));
    if (filter?.podcastId) conditions.push(eq(socialAccounts.podcastId, filter.podcastId));
    if (conditions.length > 0) {
      return db.select().from(socialAccounts).where(and(...conditions)).orderBy(desc(socialAccounts.createdAt));
    }
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
    const [updated] = await db.update(socialAccounts).set({ ...data, updatedAt: new Date() }).where(eq(socialAccounts.id, id)).returning();
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
    const [updated] = await db.update(scheduledPosts).set({ ...data, updatedAt: new Date() }).where(eq(scheduledPosts.id, id)).returning();
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
    const [updated] = await db.update(clipAssets).set({ ...data, updatedAt: new Date() }).where(eq(clipAssets.id, id)).returning();
    return updated;
  }
  async deleteClipAsset(id: string) {
    await db.delete(clipAssets).where(eq(clipAssets.id, id));
  }

  async getNewsletterSchedules() {
    return db.select().from(newsletterSchedules).orderBy(desc(newsletterSchedules.createdAt));
  }
  async getNewsletterSchedule(id: string) {
    const [schedule] = await db.select().from(newsletterSchedules).where(eq(newsletterSchedules.id, id));
    return schedule;
  }
  async getActiveNewsletterSchedules() {
    return db.select().from(newsletterSchedules).where(eq(newsletterSchedules.active, true));
  }
  async createNewsletterSchedule(schedule: InsertNewsletterSchedule) {
    const [created] = await db.insert(newsletterSchedules).values(schedule).returning();
    return created;
  }
  async updateNewsletterSchedule(id: string, data: Partial<InsertNewsletterSchedule>) {
    const [updated] = await db.update(newsletterSchedules).set(data).where(eq(newsletterSchedules.id, id)).returning();
    return updated;
  }
  async deleteNewsletterSchedule(id: string) {
    await db.delete(newsletterSchedules).where(eq(newsletterSchedules.id, id));
  }

  async getNewsletterRuns() {
    return db.select().from(newsletterRuns).orderBy(desc(newsletterRuns.createdAt));
  }
  async getNewsletterRun(id: string) {
    const [run] = await db.select().from(newsletterRuns).where(eq(newsletterRuns.id, id));
    return run;
  }
  async getNewsletterRunsBySchedule(scheduleId: string) {
    return db.select().from(newsletterRuns).where(eq(newsletterRuns.scheduleId, scheduleId)).orderBy(desc(newsletterRuns.createdAt));
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
    const [updated] = await db.update(newsLayoutSections).set({ ...data, updatedAt: new Date() }).where(eq(newsLayoutSections.id, id)).returning();
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

  async getTasks(filters?: { status?: string; assigneeId?: string; podcastId?: string }) {
    const conditions = [];
    if (filters?.status) conditions.push(eq(tasks.status, filters.status));
    if (filters?.assigneeId) conditions.push(eq(tasks.assigneeId, filters.assigneeId));
    if (filters?.podcastId) conditions.push(eq(tasks.podcastId, filters.podcastId));
    if (conditions.length > 0) {
      return db.select().from(tasks).where(and(...conditions)).orderBy(tasks.sortOrder, desc(tasks.createdAt));
    }
    return db.select().from(tasks).orderBy(tasks.sortOrder, desc(tasks.createdAt));
  }
  async getTaskById(id: string) {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }
  async getTasksByAssignee(userId: string) {
    return db.select().from(tasks).where(eq(tasks.assigneeId, userId)).orderBy(tasks.sortOrder, desc(tasks.createdAt));
  }
  async getTasksByDueDate(from: Date, to: Date) {
    return db.select().from(tasks).where(and(gte(tasks.dueDate, from), lte(tasks.dueDate, to))).orderBy(tasks.sortOrder, desc(tasks.createdAt));
  }
  async createTask(task: InsertTask) {
    const [created] = await db.insert(tasks).values(task).returning();
    return created;
  }
  async updateTask(id: string, updates: Partial<InsertTask>) {
    const [updated] = await db.update(tasks).set({ ...updates, updatedAt: new Date() }).where(eq(tasks.id, id)).returning();
    return updated;
  }
  async deleteTask(id: string) {
    await db.transaction(async (tx) => {
      await tx.delete(taskActivityLogs).where(eq(taskActivityLogs.taskId, id));
      await tx.delete(taskComments).where(eq(taskComments.taskId, id));
      await tx.delete(tasks).where(eq(tasks.id, id));
    });
  }
  async getTaskComments(taskId: string) {
    return db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(desc(taskComments.createdAt));
  }
  async createTaskComment(comment: InsertTaskComment) {
    const [created] = await db.insert(taskComments).values(comment).returning();
    return created;
  }
  async deleteTaskComment(id: string) {
    await db.delete(taskComments).where(eq(taskComments.id, id));
  }
  async getTaskActivityLogs(taskId: string) {
    return db.select().from(taskActivityLogs).where(eq(taskActivityLogs.taskId, taskId)).orderBy(desc(taskActivityLogs.createdAt));
  }
  async createTaskActivityLog(log: InsertTaskActivityLog) {
    const [created] = await db.insert(taskActivityLogs).values(log).returning();
    return created;
  }

  async getNpsSurveys() {
    return db.select().from(npsSurveys).orderBy(desc(npsSurveys.createdAt));
  }
  async createNpsSurvey(survey: InsertNpsSurvey) {
    const [created] = await db.insert(npsSurveys).values(survey).returning();
    return created;
  }
  async getNpsSurveysByUser(userId: string) {
    return db.select().from(npsSurveys).where(eq(npsSurveys.userId, userId)).orderBy(desc(npsSurveys.createdAt));
  }

  async getSubscribersPaginated(limit: number, offset: number) {
    const [{ value: total }] = await db.select({ value: count() }).from(subscribers);
    const data = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt)).limit(limit).offset(offset);
    return { data, total: Number(total) };
  }

  async getCompaniesPaginated(limit: number, offset: number) {
    const [{ value: total }] = await db.select({ value: count() }).from(companies);
    const data = await db.select().from(companies).orderBy(desc(companies.createdAt)).limit(limit).offset(offset);
    return { data, total: Number(total) };
  }

  async getContactsPaginated(limit: number, offset: number, companyId?: string) {
    if (companyId) {
      const [{ value: total }] = await db.select({ value: count() }).from(companyContacts).where(eq(companyContacts.companyId, companyId));
      const data = await db.select().from(companyContacts).where(eq(companyContacts.companyId, companyId)).orderBy(desc(companyContacts.createdAt)).limit(limit).offset(offset);
      return { data, total: Number(total) };
    }
    const [{ value: total }] = await db.select({ value: count() }).from(companyContacts);
    const data = await db.select().from(companyContacts).orderBy(desc(companyContacts.createdAt)).limit(limit).offset(offset);
    return { data, total: Number(total) };
  }

  async getDealsPaginated(limit: number, offset: number, companyId?: string, stage?: string) {
    const conditions = [];
    if (companyId) conditions.push(eq(deals.companyId, companyId));
    if (stage) conditions.push(eq(deals.stage, stage));
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const [{ value: total }] = whereClause
      ? await db.select({ value: count() }).from(deals).where(whereClause)
      : await db.select({ value: count() }).from(deals);
    const query = db.select().from(deals);
    const data = whereClause
      ? await query.where(whereClause).orderBy(desc(deals.createdAt)).limit(limit).offset(offset)
      : await query.orderBy(desc(deals.createdAt)).limit(limit).offset(offset);
    return { data, total: Number(total) };
  }

  async getContentPiecesPaginated(limit: number, offset: number, episodeId?: string) {
    if (episodeId) {
      const [{ value: total }] = await db.select({ value: count() }).from(contentPieces).where(eq(contentPieces.episodeId, episodeId));
      const data = await db.select().from(contentPieces).where(eq(contentPieces.episodeId, episodeId)).limit(limit).offset(offset);
      return { data, total: Number(total) };
    }
    const [{ value: total }] = await db.select({ value: count() }).from(contentPieces);
    const data = await db.select().from(contentPieces).limit(limit).offset(offset);
    return { data, total: Number(total) };
  }

  async getEpisodesPaginated(limit: number, offset: number, podcastId?: string) {
    if (podcastId) {
      const [{ value: total }] = await db.select({ value: count() }).from(episodes).where(eq(episodes.podcastId, podcastId));
      const data = await db.select().from(episodes).where(eq(episodes.podcastId, podcastId)).orderBy(desc(episodes.publishedAt)).limit(limit).offset(offset);
      return { data, total: Number(total) };
    }
    const [{ value: total }] = await db.select({ value: count() }).from(episodes);
    const data = await db.select().from(episodes).orderBy(desc(episodes.publishedAt)).limit(limit).offset(offset);
    return { data, total: Number(total) };
  }
  async getReadLaterItems(userId: string) {
    return db.select().from(readLaterItems).where(eq(readLaterItems.userId, userId)).orderBy(desc(readLaterItems.savedAt));
  }

  async addReadLaterItem(data: InsertReadLaterItem) {
    const existing = await db.select().from(readLaterItems)
      .where(and(eq(readLaterItems.userId, data.userId), eq(readLaterItems.contentPieceId, data.contentPieceId)));
    if (existing.length > 0) return existing[0];
    const [item] = await db.insert(readLaterItems).values(data).returning();
    return item;
  }

  async removeReadLaterItem(userId: string, contentPieceId: string) {
    await db.delete(readLaterItems).where(and(eq(readLaterItems.userId, userId), eq(readLaterItems.contentPieceId, contentPieceId)));
  }

  async clearReadLaterItems(userId: string) {
    await db.delete(readLaterItems).where(eq(readLaterItems.userId, userId));
  }

  async isReadLater(userId: string, contentPieceId: string) {
    const rows = await db.select().from(readLaterItems)
      .where(and(eq(readLaterItems.userId, userId), eq(readLaterItems.contentPieceId, contentPieceId)));
    return rows.length > 0;
  }

  async getLegalTemplates() {
    return db.select().from(legalTemplates).orderBy(desc(legalTemplates.createdAt));
  }
  async getLegalTemplate(id: string) {
    const [t] = await db.select().from(legalTemplates).where(eq(legalTemplates.id, id));
    return t;
  }
  async getLegalTemplateByType(templateType: string) {
    const [t] = await db.select().from(legalTemplates).where(eq(legalTemplates.templateType, templateType));
    return t;
  }
  async createLegalTemplate(data: InsertLegalTemplate) {
    const [created] = await db.insert(legalTemplates).values(data).returning();
    return created;
  }
  async updateLegalTemplate(id: string, data: Partial<InsertLegalTemplate>) {
    const [updated] = await db.update(legalTemplates).set({ ...data, updatedAt: new Date() }).where(eq(legalTemplates.id, id)).returning();
    return updated;
  }
  async deleteLegalTemplate(id: string) {
    await db.delete(legalTemplates).where(eq(legalTemplates.id, id));
  }

  async registerDevice(data: InsertDeviceRegistration) {
    const [created] = await db.insert(deviceRegistrations).values(data).returning();
    return created;
  }
  async getDevicesBySubscriber(subscriberId: string) {
    return db.select().from(deviceRegistrations).where(eq(deviceRegistrations.subscriberId, subscriberId));
  }

  async createPushNotification(data: InsertPushNotification) {
    const [created] = await db.insert(pushNotifications).values(data).returning();
    return created;
  }
  async getPushNotifications(limit = 50) {
    return db.select().from(pushNotifications).orderBy(desc(pushNotifications.sentAt)).limit(limit);
  }

  async getBookmarks(subscriberId: string) {
    return db.select().from(contentBookmarks).where(eq(contentBookmarks.subscriberId, subscriberId)).orderBy(desc(contentBookmarks.bookmarkedAt));
  }
  async addBookmark(data: InsertContentBookmark) {
    const [created] = await db.insert(contentBookmarks).values(data).returning();
    return created;
  }
  async removeBookmark(subscriberId: string, contentId: string) {
    await db.delete(contentBookmarks).where(and(eq(contentBookmarks.subscriberId, subscriberId), eq(contentBookmarks.contentId, contentId)));
  }

  async getSitePages() {
    return db.select().from(sitePages).orderBy(desc(sitePages.createdAt));
  }
  async getSitePage(id: string) {
    const [page] = await db.select().from(sitePages).where(eq(sitePages.id, id));
    return page;
  }
  async getSitePageBySlug(slug: string) {
    const [page] = await db.select().from(sitePages).where(eq(sitePages.slug, slug));
    return page;
  }
  async createSitePage(data: InsertSitePage) {
    const [created] = await db.insert(sitePages).values(data).returning();
    return created;
  }
  async updateSitePage(id: string, data: Partial<InsertSitePage>) {
    const [updated] = await db.update(sitePages).set({ ...data, updatedAt: new Date() }).where(eq(sitePages.id, id)).returning();
    return updated;
  }
  async deleteSitePage(id: string) {
    await db.delete(sitePages).where(eq(sitePages.id, id));
  }

  async getPageRows(pageId: string) {
    return db.select().from(pageRows).where(eq(pageRows.pageId, pageId)).orderBy(pageRows.displayOrder);
  }
  async createPageRow(data: InsertPageRow) {
    const [created] = await db.insert(pageRows).values(data).returning();
    return created;
  }
  async updatePageRow(id: string, data: Partial<InsertPageRow>) {
    const [updated] = await db.update(pageRows).set(data).where(eq(pageRows.id, id)).returning();
    return updated;
  }
  async deletePageRow(id: string) {
    await db.delete(pageRows).where(eq(pageRows.id, id));
  }

  async getPageWidgets(rowId: string) {
    return db.select().from(pageWidgets).where(eq(pageWidgets.rowId, rowId)).orderBy(pageWidgets.displayOrder);
  }
  async getPageWidgetsByPage(pageId: string) {
    return db.select().from(pageWidgets).where(eq(pageWidgets.pageId, pageId)).orderBy(pageWidgets.displayOrder);
  }
  async createPageWidget(data: InsertPageWidget) {
    const [created] = await db.insert(pageWidgets).values(data).returning();
    return created;
  }
  async updatePageWidget(id: string, data: Partial<InsertPageWidget>) {
    const [updated] = await db.update(pageWidgets).set({ ...data, updatedAt: new Date() }).where(eq(pageWidgets.id, id)).returning();
    return updated;
  }
  async deletePageWidget(id: string) {
    await db.delete(pageWidgets).where(eq(pageWidgets.id, id));
  }

  async getPageTemplates() {
    return db.select().from(pageTemplates).orderBy(desc(pageTemplates.createdAt));
  }
  async getPageTemplate(id: string) {
    const [t] = await db.select().from(pageTemplates).where(eq(pageTemplates.id, id));
    return t;
  }
  async createPageTemplate(data: InsertPageTemplate) {
    const [created] = await db.insert(pageTemplates).values(data).returning();
    return created;
  }
  async deletePageTemplate(id: string) {
    await db.delete(pageTemplates).where(eq(pageTemplates.id, id));
  }

  async getCommunityEvents(status?: string) {
    if (status) {
      return db.select().from(communityEvents).where(eq(communityEvents.status, status)).orderBy(desc(communityEvents.createdAt));
    }
    return db.select().from(communityEvents).orderBy(desc(communityEvents.createdAt));
  }
  async getCommunityEvent(id: string) {
    const [event] = await db.select().from(communityEvents).where(eq(communityEvents.id, id));
    return event;
  }
  async createCommunityEvent(data: InsertCommunityEvent) {
    const [created] = await db.insert(communityEvents).values(data).returning();
    return created;
  }
  async updateCommunityEvent(id: string, data: Partial<InsertCommunityEvent>) {
    const [updated] = await db.update(communityEvents).set(data).where(eq(communityEvents.id, id)).returning();
    return updated;
  }
  async deleteCommunityEvent(id: string) {
    await db.delete(communityEvents).where(eq(communityEvents.id, id));
  }

  async getObituaries() {
    return db.select().from(obituaries).orderBy(desc(obituaries.createdAt));
  }
  async getObituary(id: string) {
    const [obit] = await db.select().from(obituaries).where(eq(obituaries.id, id));
    return obit;
  }
  async createObituary(data: InsertObituary) {
    const [created] = await db.insert(obituaries).values(data).returning();
    return created;
  }
  async updateObituary(id: string, data: Partial<InsertObituary>) {
    const [updated] = await db.update(obituaries).set(data).where(eq(obituaries.id, id)).returning();
    return updated;
  }
  async deleteObituary(id: string) {
    await db.delete(obituaries).where(eq(obituaries.id, id));
  }

  async getClassifieds(category?: string, status?: string) {
    const conditions = [];
    if (category) conditions.push(eq(classifieds.category, category));
    if (status) conditions.push(eq(classifieds.status, status));
    if (conditions.length > 0) {
      return db.select().from(classifieds).where(and(...conditions)).orderBy(desc(classifieds.createdAt));
    }
    return db.select().from(classifieds).orderBy(desc(classifieds.createdAt));
  }
  async getClassified(id: string) {
    const [c] = await db.select().from(classifieds).where(eq(classifieds.id, id));
    return c;
  }
  async createClassified(data: InsertClassified) {
    const [created] = await db.insert(classifieds).values(data).returning();
    return created;
  }
  async updateClassified(id: string, data: Partial<InsertClassified>) {
    const [updated] = await db.update(classifieds).set(data).where(eq(classifieds.id, id)).returning();
    return updated;
  }
  async deleteClassified(id: string) {
    await db.delete(classifieds).where(eq(classifieds.id, id));
  }

  async getCommunityPolls() {
    return db.select().from(communityPolls).orderBy(desc(communityPolls.createdAt));
  }
  async getCommunityPoll(id: string) {
    const [poll] = await db.select().from(communityPolls).where(eq(communityPolls.id, id));
    return poll;
  }
  async createCommunityPoll(data: InsertCommunityPoll) {
    const [created] = await db.insert(communityPolls).values(data).returning();
    return created;
  }
  async updateCommunityPoll(id: string, data: Partial<InsertCommunityPoll>) {
    const [updated] = await db.update(communityPolls).set(data).where(eq(communityPolls.id, id)).returning();
    return updated;
  }
  async deleteCommunityPoll(id: string) {
    await db.delete(communityPolls).where(eq(communityPolls.id, id));
  }

  async getCommunityPollById(id: string) {
    const [poll] = await db.select().from(communityPolls).where(eq(communityPolls.id, id));
    return poll;
  }

  async getPollVotes(pollId: string): Promise<PollVote[]> {
    return db.select().from(pollVotes).where(eq(pollVotes.pollId, pollId));
  }
  async castPollVote(data: InsertPollVote): Promise<PollVote> {
    const [vote] = await db.insert(pollVotes).values(data).returning();
    return vote;
  }

  async getCommunityPosts(parentId?: string): Promise<CommunityPost[]> {
    if (parentId) {
      return db.select().from(communityPosts).where(eq(communityPosts.parentId, parentId)).orderBy(desc(communityPosts.createdAt));
    }
    return db.select().from(communityPosts).orderBy(desc(communityPosts.createdAt));
  }
  async getCommunityPostById(id: string): Promise<CommunityPost | undefined> {
    const [post] = await db.select().from(communityPosts).where(eq(communityPosts.id, id));
    return post;
  }
  async createCommunityPost(data: InsertCommunityPost): Promise<CommunityPost> {
    const [created] = await db.insert(communityPosts).values(data).returning();
    return created;
  }
  async updateCommunityPost(id: string, data: Partial<InsertCommunityPost>): Promise<CommunityPost | undefined> {
    const [updated] = await db.update(communityPosts).set(data).where(eq(communityPosts.id, id)).returning();
    return updated;
  }
  async deleteCommunityPost(id: string): Promise<void> {
    await db.delete(communityLikes).where(eq(communityLikes.postId, id));
    await db.delete(communityPosts).where(eq(communityPosts.id, id));
  }
  async toggleCommunityLike(postId: string, likerIdentifier: string): Promise<{ liked: boolean }> {
    const existing = await db.select().from(communityLikes).where(and(eq(communityLikes.postId, postId), eq(communityLikes.likerIdentifier, likerIdentifier)));
    if (existing.length > 0) {
      await db.delete(communityLikes).where(and(eq(communityLikes.postId, postId), eq(communityLikes.likerIdentifier, likerIdentifier)));
      await db.update(communityPosts).set({ likesCount: sql`GREATEST(0, likes_count - 1)` }).where(eq(communityPosts.id, postId));
      return { liked: false };
    }
    await db.insert(communityLikes).values({ postId, likerIdentifier });
    await db.update(communityPosts).set({ likesCount: sql`likes_count + 1` }).where(eq(communityPosts.id, postId));
    return { liked: true };
  }

  async getCommunityAnnouncements(status?: string) {
    if (status) {
      return db.select().from(communityAnnouncements).where(eq(communityAnnouncements.status, status)).orderBy(desc(communityAnnouncements.createdAt));
    }
    return db.select().from(communityAnnouncements).orderBy(desc(communityAnnouncements.createdAt));
  }
  async getCommunityAnnouncement(id: string) {
    const [a] = await db.select().from(communityAnnouncements).where(eq(communityAnnouncements.id, id));
    return a;
  }
  async createCommunityAnnouncement(data: InsertCommunityAnnouncement) {
    const [created] = await db.insert(communityAnnouncements).values(data).returning();
    return created;
  }
  async updateCommunityAnnouncement(id: string, data: Partial<InsertCommunityAnnouncement>) {
    const [updated] = await db.update(communityAnnouncements).set(data).where(eq(communityAnnouncements.id, id)).returning();
    return updated;
  }
  async deleteCommunityAnnouncement(id: string) {
    await db.delete(communityAnnouncements).where(eq(communityAnnouncements.id, id));
  }

  async getBusinessListings(category?: string) {
    if (category) {
      return db.select().from(businessListings).where(eq(businessListings.category, category)).orderBy(desc(businessListings.createdAt));
    }
    return db.select().from(businessListings).orderBy(desc(businessListings.createdAt));
  }
  async getBusinessListing(id: string) {
    const [listing] = await db.select().from(businessListings).where(eq(businessListings.id, id));
    return listing;
  }
  async getBusinessListingBySlug(slug: string) {
    const [listing] = await db.select().from(businessListings).where(eq(businessListings.slug, slug));
    return listing;
  }
  async createBusinessListing(data: InsertBusinessListing) {
    const [created] = await db.insert(businessListings).values(data).returning();
    return created;
  }
  async updateBusinessListing(id: string, data: Partial<InsertBusinessListing>) {
    const [updated] = await db.update(businessListings).set(data).where(eq(businessListings.id, id)).returning();
    return updated;
  }
  async deleteBusinessListing(id: string) {
    await db.delete(businessListings).where(eq(businessListings.id, id));
  }

  async getAiLayoutExamples(pageType?: string) {
    if (pageType) {
      return db.select().from(aiLayoutExamples).where(eq(aiLayoutExamples.pageType, pageType)).orderBy(aiLayoutExamples.displayOrder);
    }
    return db.select().from(aiLayoutExamples).orderBy(aiLayoutExamples.displayOrder);
  }
  async getAiLayoutExample(id: string) {
    const [ex] = await db.select().from(aiLayoutExamples).where(eq(aiLayoutExamples.id, id));
    return ex;
  }
  async createAiLayoutExample(data: InsertAiLayoutExample) {
    const [created] = await db.insert(aiLayoutExamples).values(data).returning();
    return created;
  }
  async updateAiLayoutExample(id: string, data: Partial<InsertAiLayoutExample>) {
    const [updated] = await db.update(aiLayoutExamples).set({ ...data, updatedAt: new Date() }).where(eq(aiLayoutExamples.id, id)).returning();
    return updated;
  }
  async deleteAiLayoutExample(id: string) {
    await db.delete(aiLayoutExamples).where(eq(aiLayoutExamples.id, id));
  }

  async getAdInjectionLogs(pageId?: string) {
    if (pageId) {
      return db.select().from(adInjectionLog).where(eq(adInjectionLog.pageId, pageId)).orderBy(desc(adInjectionLog.injectedAt));
    }
    return db.select().from(adInjectionLog).orderBy(desc(adInjectionLog.injectedAt));
  }
  async createAdInjectionLog(data: InsertAdInjectionLog) {
    const [created] = await db.insert(adInjectionLog).values(data).returning();
    return created;
  }

  async upsertPushSubscription(data: InsertDevicePushSubscription): Promise<DevicePushSubscription> {
    const existing = await db.select().from(devicePushSubscriptions).where(eq(devicePushSubscriptions.endpoint, data.endpoint));
    if (existing.length > 0) {
      const [updated] = await db.update(devicePushSubscriptions)
        .set({ ...data, lastUsed: new Date() })
        .where(eq(devicePushSubscriptions.endpoint, data.endpoint))
        .returning();
      return updated;
    }
    const [created] = await db.insert(devicePushSubscriptions).values(data).returning();
    return created;
  }

  async updatePushPreferences(endpoint: string, preferences: any): Promise<DevicePushSubscription | undefined> {
    const [updated] = await db.update(devicePushSubscriptions)
      .set({ preferences, lastUsed: new Date() })
      .where(eq(devicePushSubscriptions.endpoint, endpoint))
      .returning();
    return updated;
  }

  async deletePushSubscription(endpoint: string): Promise<void> {
    await db.delete(devicePushSubscriptions).where(eq(devicePushSubscriptions.endpoint, endpoint));
  }

  async getAllPushSubscriptions(): Promise<DevicePushSubscription[]> {
    return db.select().from(devicePushSubscriptions);
  }

  async getAdminPageConfigs(): Promise<AdminPageConfig[]> {
    return db.select().from(adminPageConfigs).orderBy(adminPageConfigs.sortOrder);
  }

  async getAdminPageConfigByKey(pageKey: string): Promise<AdminPageConfig | undefined> {
    const [config] = await db.select().from(adminPageConfigs).where(eq(adminPageConfigs.pageKey, pageKey));
    return config;
  }

  async upsertAdminPageConfig(data: InsertAdminPageConfig): Promise<AdminPageConfig> {
    const [result] = await db.insert(adminPageConfigs).values(data).onConflictDoUpdate({ target: adminPageConfigs.pageKey, set: data }).returning();
    return result;
  }

  async updateAdminPageConfig(pageKey: string, data: Partial<InsertAdminPageConfig>): Promise<AdminPageConfig | undefined> {
    const [updated] = await db.update(adminPageConfigs).set(data).where(eq(adminPageConfigs.pageKey, pageKey)).returning();
    return updated;
  }

  async deleteAdminPageConfig(pageKey: string): Promise<boolean> {
    const result = await db.delete(adminPageConfigs).where(eq(adminPageConfigs.pageKey, pageKey)).returning();
    return result.length > 0;
  }

  async batchUpdatePageConfigOrder(pages: { pageKey: string; sortOrder: number; navSection: string }[]): Promise<void> {
    for (const p of pages) {
      await db.update(adminPageConfigs).set({ sortOrder: p.sortOrder, navSection: p.navSection }).where(eq(adminPageConfigs.pageKey, p.pageKey));
    }
  }

  async deleteAllAdminPageConfigs(): Promise<void> {
    await db.delete(adminPageConfigs);
  }

  async getAdminNavSections(): Promise<AdminNavSection[]> {
    return db.select().from(adminNavSections).orderBy(adminNavSections.sortOrder);
  }

  async upsertAdminNavSection(data: InsertAdminNavSection): Promise<AdminNavSection> {
    const [result] = await db.insert(adminNavSections).values(data).onConflictDoUpdate({ target: adminNavSections.sectionKey, set: data }).returning();
    return result;
  }

  async updateAdminNavSection(sectionKey: string, data: Partial<InsertAdminNavSection>): Promise<AdminNavSection | undefined> {
    const [updated] = await db.update(adminNavSections).set(data).where(eq(adminNavSections.sectionKey, sectionKey)).returning();
    return updated;
  }

  async deleteAdminNavSection(sectionKey: string): Promise<boolean> {
    const result = await db.delete(adminNavSections).where(eq(adminNavSections.sectionKey, sectionKey)).returning();
    return result.length > 0;
  }

  async batchUpdateNavSectionOrder(sections: { sectionKey: string; sortOrder: number }[]): Promise<void> {
    for (const s of sections) {
      await db.update(adminNavSections).set({ sortOrder: s.sortOrder }).where(eq(adminNavSections.sectionKey, s.sectionKey));
    }
  }

  // Commercial Leads
  async getCommercialLeads(filters?: { pipelineType?: string; pipelineStage?: string }) {
    const conditions = [];
    if (filters?.pipelineType) conditions.push(eq(commercialLeads.pipelineType, filters.pipelineType));
    if (filters?.pipelineStage) conditions.push(eq(commercialLeads.pipelineStage, filters.pipelineStage));
    return db.select().from(commercialLeads).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(commercialLeads.createdAt));
  }
  async getCommercialLead(id: string) {
    const [lead] = await db.select().from(commercialLeads).where(eq(commercialLeads.id, id));
    return lead;
  }
  async createCommercialLead(data: InsertCommercialLead) {
    const [created] = await db.insert(commercialLeads).values(data).returning();
    return created;
  }
  async updateCommercialLead(id: string, data: Partial<InsertCommercialLead>) {
    const [updated] = await db.update(commercialLeads).set({ ...data, updatedAt: new Date() }).where(eq(commercialLeads.id, id)).returning();
    return updated;
  }
  async deleteCommercialLead(id: string) {
    await db.delete(commercialLeads).where(eq(commercialLeads.id, id));
  }

  // Commercial Proposals
  async getCommercialProposals(leadId?: string) {
    if (leadId) {
      return db.select().from(commercialProposals).where(eq(commercialProposals.leadId, leadId)).orderBy(desc(commercialProposals.createdAt));
    }
    return db.select().from(commercialProposals).orderBy(desc(commercialProposals.createdAt));
  }
  async getCommercialProposal(id: string) {
    const [proposal] = await db.select().from(commercialProposals).where(eq(commercialProposals.id, id));
    return proposal;
  }
  async createCommercialProposal(data: InsertCommercialProposal) {
    const [created] = await db.insert(commercialProposals).values(data).returning();
    return created;
  }
  async updateCommercialProposal(id: string, data: Partial<InsertCommercialProposal>) {
    const [updated] = await db.update(commercialProposals).set(data).where(eq(commercialProposals.id, id)).returning();
    return updated;
  }

  // Commercial Orders
  async getCommercialOrders(filters?: { leadId?: string; status?: string }) {
    const conditions = [];
    if (filters?.leadId) conditions.push(eq(commercialOrders.leadId, filters.leadId));
    if (filters?.status) conditions.push(eq(commercialOrders.status, filters.status));
    return db.select().from(commercialOrders).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(commercialOrders.createdAt));
  }
  async getCommercialOrder(id: string) {
    const [order] = await db.select().from(commercialOrders).where(eq(commercialOrders.id, id));
    return order;
  }
  async createCommercialOrder(data: InsertCommercialOrder) {
    const [created] = await db.insert(commercialOrders).values(data).returning();
    return created;
  }
  async updateCommercialOrder(id: string, data: Partial<InsertCommercialOrder>) {
    const [updated] = await db.update(commercialOrders).set(data).where(eq(commercialOrders.id, id)).returning();
    return updated;
  }

  // Campaign Performance
  async getCampaignPerformance(orderId?: string) {
    if (orderId) {
      return db.select().from(campaignPerformance).where(eq(campaignPerformance.orderId, orderId)).orderBy(desc(campaignPerformance.createdAt));
    }
    return db.select().from(campaignPerformance).orderBy(desc(campaignPerformance.createdAt));
  }
  async createCampaignPerformance(data: InsertCampaignPerformance) {
    const [created] = await db.insert(campaignPerformance).values(data).returning();
    return created;
  }
  async updateCampaignPerformance(id: string, data: Partial<InsertCampaignPerformance>) {
    const [updated] = await db.update(campaignPerformance).set(data).where(eq(campaignPerformance.id, id)).returning();
    return updated;
  }

  // AI Advertiser Prompts
  async getAiAdvertiserPrompts(status?: string) {
    if (status) {
      return db.select().from(aiAdvertiserPrompts).where(eq(aiAdvertiserPrompts.status, status)).orderBy(desc(aiAdvertiserPrompts.createdAt));
    }
    return db.select().from(aiAdvertiserPrompts).orderBy(desc(aiAdvertiserPrompts.createdAt));
  }
  async createAiAdvertiserPrompt(data: InsertAiAdvertiserPrompt) {
    const [created] = await db.insert(aiAdvertiserPrompts).values(data).returning();
    return created;
  }
  async updateAiAdvertiserPrompt(id: string, data: Partial<InsertAiAdvertiserPrompt>) {
    const [updated] = await db.update(aiAdvertiserPrompts).set(data).where(eq(aiAdvertiserPrompts.id, id)).returning();
    return updated;
  }

  // AI Content Log
  async createAiContentLog(data: InsertAiContentLog) {
    const [created] = await db.insert(aiContentLog).values(data).returning();
    return created;
  }
  async getAiContentLogs(limit = 50) {
    return db.select().from(aiContentLog).orderBy(desc(aiContentLog.generatedAt)).limit(limit);
  }
  async getAiContentLogCountToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [result] = await db.select({ count: count() }).from(aiContentLog).where(gte(aiContentLog.generatedAt, today));
    return result?.count ?? 0;
  }

  // Notifications
  async getNotifications(userId: string) {
    return db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt)).limit(50);
  }
  async getUnreadNotificationCount(userId: string) {
    const [result] = await db.select({ count: count() }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
    return result?.count ?? 0;
  }
  async createNotification(data: InsertNotification) {
    const [created] = await db.insert(notifications).values(data).returning();
    return created;
  }
  async markNotificationRead(id: string) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  }
  async markAllNotificationsRead(userId: string) {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  // Community Posts enhanced
  async getCommunityPostsByTopic(topic: string) {
    return db.select().from(communityPosts).where(and(eq(communityPosts.topic, topic), eq(communityPosts.isThreadStarter, true))).orderBy(desc(communityPosts.createdAt));
  }
  async getCommunityThreadReplies(parentId: string) {
    return db.select().from(communityPosts).where(eq(communityPosts.parentId, parentId)).orderBy(communityPosts.createdAt);
  }
  async getFlaggedCommunityPosts() {
    return db.select().from(communityPosts).where(eq(communityPosts.isFlagged, true)).orderBy(desc(communityPosts.createdAt));
  }
  async moderateCommunityPost(id: string, status: string, moderatedBy: string) {
    const [updated] = await db.update(communityPosts).set({ moderationStatus: status, moderatedBy, moderatedAt: new Date() }).where(eq(communityPosts.id, id)).returning();
    return updated;
  }
  async flagCommunityPost(id: string, reason: string) {
    const [updated] = await db.update(communityPosts).set({ isFlagged: true, flaggedReason: reason }).where(eq(communityPosts.id, id)).returning();
    return updated;
  }

  // AI Agents
  async getAiAgents() {
    return db.select().from(aiAgents).orderBy(desc(aiAgents.createdAt));
  }
  async getAiAgent(id: string) {
    const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, id));
    return agent;
  }
  async createAiAgent(data: InsertAiAgent) {
    const [created] = await db.insert(aiAgents).values(data).returning();
    return created;
  }
  async updateAiAgent(id: string, data: Partial<InsertAiAgent>) {
    const [updated] = await db.update(aiAgents).set(data).where(eq(aiAgents.id, id)).returning();
    return updated;
  }
  async deleteAiAgent(id: string) {
    await db.delete(aiAgents).where(eq(aiAgents.id, id));
  }

  // Push Campaigns
  async getPushCampaigns() {
    return db.select().from(pushCampaigns).orderBy(desc(pushCampaigns.createdAt));
  }
  async getPushCampaign(id: string) {
    const [campaign] = await db.select().from(pushCampaigns).where(eq(pushCampaigns.id, id));
    return campaign;
  }
  async createPushCampaign(data: InsertPushCampaign) {
    const [created] = await db.insert(pushCampaigns).values(data).returning();
    return created;
  }
  async updatePushCampaign(id: string, data: Partial<InsertPushCampaign>) {
    const [updated] = await db.update(pushCampaigns).set({ ...data, updatedAt: new Date() }).where(eq(pushCampaigns.id, id)).returning();
    return updated;
  }
  async deletePushCampaign(id: string) {
    await db.delete(pushCampaignLogs).where(eq(pushCampaignLogs.campaignId, id));
    await db.delete(pushCampaigns).where(eq(pushCampaigns.id, id));
  }
  async getPushCampaignLogs(campaignId: string) {
    return db.select().from(pushCampaignLogs).where(eq(pushCampaignLogs.campaignId, campaignId)).orderBy(desc(pushCampaignLogs.createdAt));
  }
  async createPushCampaignLog(data: InsertPushCampaignLog) {
    const [created] = await db.insert(pushCampaignLogs).values(data).returning();
    return created;
  }

  async getBuiltPages() {
    return db.select().from(builtPages).orderBy(desc(builtPages.updatedAt));
  }
  async getBuiltPage(id: string) {
    const [p] = await db.select().from(builtPages).where(eq(builtPages.id, id));
    return p;
  }
  async getBuiltPageBySlug(slug: string) {
    const [p] = await db.select().from(builtPages).where(eq(builtPages.slug, slug));
    return p;
  }
  async createBuiltPage(data: InsertBuiltPage) {
    const [created] = await db.insert(builtPages).values(data).returning();
    return created;
  }
  async updateBuiltPage(id: string, data: Partial<InsertBuiltPage>) {
    const [updated] = await db.update(builtPages).set({ ...data, updatedAt: new Date() }).where(eq(builtPages.id, id)).returning();
    return updated;
  }
  async deleteBuiltPage(id: string) {
    await db.delete(builtPages).where(eq(builtPages.id, id));
  }
  async publishBuiltPage(id: string) {
    const [updated] = await db.update(builtPages).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() }).where(eq(builtPages.id, id)).returning();
    return updated;
  }
  async unpublishBuiltPage(id: string) {
    const [updated] = await db.update(builtPages).set({ status: "draft", publishedAt: null, updatedAt: new Date() }).where(eq(builtPages.id, id)).returning();
    return updated;
  }
  async duplicateBuiltPage(id: string) {
    const original = await this.getBuiltPage(id);
    if (!original) return undefined;
    const [created] = await db.insert(builtPages).values({
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      status: "draft",
      pageType: original.pageType,
      layout: original.layout,
      metaTitle: original.metaTitle,
      metaDescription: original.metaDescription,
      coverImage: original.coverImage,
      createdBy: original.createdBy,
    }).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
