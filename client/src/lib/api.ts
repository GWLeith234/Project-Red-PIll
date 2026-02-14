import { queryClient } from "./queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

async function apiRequest(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function usePodcasts() {
  return useQuery({ queryKey: ["/api/podcasts"], queryFn: () => apiRequest("/api/podcasts") });
}

export function useEpisodes(podcastId?: string) {
  const url = podcastId ? `/api/episodes?podcastId=${podcastId}` : "/api/episodes";
  return useQuery({ queryKey: ["/api/episodes", podcastId], queryFn: () => apiRequest(url) });
}

export function useContentPieces(episodeId?: string) {
  const url = episodeId ? `/api/content-pieces?episodeId=${episodeId}` : "/api/content-pieces";
  return useQuery({ queryKey: ["/api/content-pieces", episodeId], queryFn: () => apiRequest(url) });
}

export function useAdvertisers() {
  return useQuery({ queryKey: ["/api/advertisers"], queryFn: () => apiRequest("/api/advertisers") });
}

export function useCampaigns(filters?: { advertiserId?: string; companyId?: string; dealId?: string }) {
  const params = new URLSearchParams();
  if (filters?.advertiserId) params.set("advertiserId", filters.advertiserId);
  if (filters?.companyId) params.set("companyId", filters.companyId);
  if (filters?.dealId) params.set("dealId", filters.dealId);
  const url = params.toString() ? `/api/campaigns?${params}` : "/api/campaigns";
  return useQuery({ queryKey: ["/api/campaigns", filters], queryFn: () => apiRequest(url) });
}

export function useDealCampaign(dealId: string | undefined) {
  return useQuery({
    queryKey: ["/api/campaigns", "deal", dealId],
    queryFn: () => apiRequest(`/api/campaigns?dealId=${dealId}`),
    enabled: !!dealId,
  });
}

export function useMetrics() {
  return useQuery({ queryKey: ["/api/metrics/latest"], queryFn: () => apiRequest("/api/metrics/latest") });
}

export function useAlerts() {
  return useQuery({ queryKey: ["/api/alerts"], queryFn: () => apiRequest("/api/alerts") });
}

export function useTrendingArticles() {
  return useQuery({ queryKey: ["/api/articles/trending"], queryFn: () => apiRequest("/api/articles/trending") });
}

export function useCreatePodcast() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/podcasts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/podcasts"] }),
  });
}

export function useCreateEpisode() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/episodes", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/episodes"] }),
  });
}

export function useCreateAdvertiser() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/advertisers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/advertisers"] }),
  });
}

export function useCreateCampaign() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/campaigns", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] }),
  });
}

export function useBranding() {
  return useQuery({ queryKey: ["/api/branding"], queryFn: () => apiRequest("/api/branding") });
}

export function useUpdateBranding() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/branding", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/branding"] }),
  });
}

export function useMarkAlertRead() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/alerts/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/alerts"] }),
  });
}

export function useProfile() {
  return useQuery({ queryKey: ["/api/profile"], queryFn: () => apiRequest("/api/profile") });
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/profile", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useAnalyzeLinkedIn() {
  return useMutation({
    mutationFn: (data: { url: string }) => apiRequest("/api/profile/analyze-linkedin", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useSubscribers(podcastId?: string) {
  const url = podcastId ? `/api/subscribers?podcastId=${podcastId}` : "/api/subscribers";
  return useQuery({ queryKey: ["/api/subscribers", podcastId], queryFn: () => apiRequest(url) });
}

export function useSubscriber(id: string) {
  return useQuery({ queryKey: ["/api/subscribers", id], queryFn: () => apiRequest(`/api/subscribers/${id}`), enabled: !!id });
}

export function useCreateSubscriber() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/subscribers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] }),
  });
}

export function useUpdateSubscriber() {
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/subscribers/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] }),
  });
}

export function useDeleteSubscriber() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/subscribers/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] }),
  });
}

export function useSubscriberSuggestions(id: string) {
  return useQuery({ queryKey: ["/api/subscribers", id, "suggestions"], queryFn: () => apiRequest(`/api/subscribers/${id}/suggestions`), enabled: !!id });
}

export function useSubscriberRecentEpisodes(id: string) {
  return useQuery({ queryKey: ["/api/subscribers", id, "recent-episodes"], queryFn: () => apiRequest(`/api/subscribers/${id}/recent-episodes`), enabled: !!id });
}

export function useAddSubscriberPodcast() {
  return useMutation({
    mutationFn: ({ subscriberId, podcastId }: { subscriberId: string; podcastId: string }) =>
      apiRequest(`/api/subscribers/${subscriberId}/podcasts`, { method: "POST", body: JSON.stringify({ podcastId }) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscribers", variables.subscriberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscribers", variables.subscriberId, "suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/subscribers", variables.subscriberId, "recent-episodes"] });
    },
  });
}

export function useAnalyzeSocial() {
  return useMutation({
    mutationFn: (data: { url: string }) => apiRequest("/api/subscribers/analyze-social", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useAnalyzeWebsite() {
  return useMutation({
    mutationFn: (data: { url: string }) => apiRequest("/api/companies/analyze-website", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useCompanies() {
  return useQuery({ queryKey: ["/api/companies"], queryFn: () => apiRequest("/api/companies") });
}

export function useCompany(id: string) {
  return useQuery({ queryKey: ["/api/companies", id], queryFn: () => apiRequest(`/api/companies/${id}`), enabled: !!id });
}

export function useCreateCompany() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/companies", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/companies"] }),
  });
}

export function useUpdateCompany() {
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/companies/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/companies"] }),
  });
}

export function useDeleteCompany() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/companies/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/companies"] }),
  });
}

export function useContacts(companyId?: string) {
  const url = companyId ? `/api/contacts?companyId=${companyId}` : "/api/contacts";
  return useQuery({ queryKey: ["/api/contacts", companyId], queryFn: () => apiRequest(url) });
}

export function useContact(id: string) {
  return useQuery({ queryKey: ["/api/contacts", id], queryFn: () => apiRequest(`/api/contacts/${id}`), enabled: !!id });
}

export function useCreateContact() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/contacts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
  });
}

export function useUpdateContact() {
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/contacts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
  });
}

export function useDeleteContact() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
  });
}

export function useDeals(companyId?: string, stage?: string) {
  const params = new URLSearchParams();
  if (companyId) params.set("companyId", companyId);
  if (stage) params.set("stage", stage);
  const url = `/api/deals${params.toString() ? `?${params}` : ""}`;
  return useQuery({ queryKey: ["/api/deals", companyId, stage], queryFn: () => apiRequest(url) });
}

export function useDeal(id: string) {
  return useQuery({ queryKey: ["/api/deals", id], queryFn: () => apiRequest(`/api/deals/${id}`), enabled: !!id });
}

export function useCreateDeal() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/deals", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
  });
}

export function useUpdateDeal() {
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/deals/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
  });
}

export function useDeleteDeal() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/deals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
    },
  });
}

export function useDealActivities(dealId: string) {
  return useQuery({ queryKey: ["/api/deals", dealId, "activities"], queryFn: () => apiRequest(`/api/deals/${dealId}/activities`), enabled: !!dealId });
}

export function useCreateDealActivity() {
  return useMutation({
    mutationFn: ({ dealId, ...data }: any) => apiRequest(`/api/deals/${dealId}/activities`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
    },
  });
}

export function useUpdateDealActivity() {
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/deal-activities/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
  });
}

export function useDeleteDealActivity() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/deal-activities/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
  });
}

export function useProducts(status?: string) {
  const params = status ? `?status=${status}` : "";
  return useQuery({ queryKey: ["/api/products", status], queryFn: () => apiRequest(`/api/products${params}`) });
}

export function useProduct(id: string) {
  return useQuery({ queryKey: ["/api/products", id], queryFn: () => apiRequest(`/api/products/${id}`), enabled: !!id });
}

export function useCreateProduct() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/products", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
  });
}

export function useUpdateProduct() {
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
  });
}

export function useDeleteProduct() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/products/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/products"] }),
  });
}

export function useAdCreatives(dealId: string) {
  return useQuery({ queryKey: ["/api/deals", dealId, "creatives"], queryFn: () => apiRequest(`/api/deals/${dealId}/creatives`), enabled: !!dealId });
}

export function useCreateAdCreative() {
  return useMutation({
    mutationFn: ({ dealId, ...data }: any) => apiRequest(`/api/deals/${dealId}/creatives`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_d: any, vars: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals", vars.dealId, "creatives"] });
    },
  });
}

export function useUpdateAdCreative() {
  return useMutation({
    mutationFn: ({ id, dealId, ...data }: any) => apiRequest(`/api/ad-creatives/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_d: any, vars: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      if (vars.dealId) queryClient.invalidateQueries({ queryKey: ["/api/deals", vars.dealId, "creatives"] });
    },
  });
}

export function useDeleteAdCreative() {
  return useMutation({
    mutationFn: ({ id, dealId }: { id: string; dealId: string }) => apiRequest(`/api/ad-creatives/${id}`, { method: "DELETE" }),
    onSuccess: (_d: any, vars: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      if (vars.dealId) queryClient.invalidateQueries({ queryKey: ["/api/deals", vars.dealId, "creatives"] });
    },
  });
}

export function useDealLineItems(dealId: string | undefined) {
  return useQuery({
    queryKey: ["/api/deals", dealId, "line-items"],
    queryFn: () => apiRequest(`/api/deals/${dealId}/line-items`),
    enabled: !!dealId,
  });
}

export function useReplaceDealLineItems() {
  return useMutation({
    mutationFn: ({ dealId, items }: { dealId: string; items: any[] }) =>
      apiRequest(`/api/deals/${dealId}/line-items`, { method: "PUT", body: JSON.stringify(items) }),
    onSuccess: (_d: any, vars: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals", vars.dealId, "line-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
    },
  });
}

export function useDeleteDealLineItem() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/deal-line-items/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/deals"] }),
  });
}

export function useCampaignEmails(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["/api/outbound-campaigns", campaignId, "emails"],
    queryFn: () => apiRequest(`/api/outbound-campaigns/${campaignId}/emails`),
    enabled: !!campaignId,
  });
}

export function useCreateCampaignEmail() {
  return useMutation({
    mutationFn: ({ campaignId, ...data }: any) =>
      apiRequest(`/api/outbound-campaigns/${campaignId}/emails`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_d: any, vars: any) => queryClient.invalidateQueries({ queryKey: ["/api/outbound-campaigns", vars.campaignId, "emails"] }),
  });
}

export function useUpdateCampaignEmail() {
  return useMutation({
    mutationFn: ({ id, campaignId, ...data }: any) =>
      apiRequest(`/api/campaign-emails/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: (_d: any, vars: any) => queryClient.invalidateQueries({ queryKey: ["/api/outbound-campaigns", vars.campaignId, "emails"] }),
  });
}

export function useDeleteCampaignEmail() {
  return useMutation({
    mutationFn: ({ id, campaignId }: { id: string; campaignId: string }) =>
      apiRequest(`/api/campaign-emails/${id}`, { method: "DELETE" }),
    onSuccess: (_d: any, vars: any) => queryClient.invalidateQueries({ queryKey: ["/api/outbound-campaigns", vars.campaignId, "emails"] }),
  });
}

export function useReorderCampaignEmails() {
  return useMutation({
    mutationFn: ({ campaignId, emailIds }: { campaignId: string; emailIds: string[] }) =>
      apiRequest(`/api/outbound-campaigns/${campaignId}/emails/reorder`, { method: "PUT", body: JSON.stringify({ emailIds }) }),
    onSuccess: (_d: any, vars: any) => queryClient.invalidateQueries({ queryKey: ["/api/outbound-campaigns", vars.campaignId, "emails"] }),
  });
}

export function useUpdateOutboundCampaign() {
  return useMutation({
    mutationFn: ({ id, ...data }: any) =>
      apiRequest(`/api/outbound-campaigns/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/outbound-campaigns"] }),
  });
}

export function useSettings() {
  return useQuery({ queryKey: ["/api/settings"], queryFn: () => apiRequest("/api/settings") });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/settings"] }),
  });
}

export function useAuditLogs(limit = 50, offset = 0) {
  return useQuery({ queryKey: ["/api/audit-logs", limit, offset], queryFn: () => apiRequest(`/api/audit-logs?limit=${limit}&offset=${offset}`) });
}

export function useApiKeys() {
  return useQuery({ queryKey: ["/api/api-keys"], queryFn: () => apiRequest("/api/api-keys") });
}

export function useCreateApiKey() {
  return useMutation({
    mutationFn: (data: { name: string; permissions?: string[]; expiresAt?: string }) =>
      apiRequest("/api/api-keys", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
    },
  });
}

export function useRevokeApiKey() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/api-keys/${id}/revoke`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
    },
  });
}

export function useDeleteApiKey() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/api-keys/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/api-keys"] });
      queryClient.invalidateQueries({ queryKey: ["/api/audit-logs"] });
    },
  });
}

export function useRunFullPipeline() {
  return useMutation({
    mutationFn: (data: { episodeId: string; contentTypes?: string[] }) =>
      apiRequest("/api/ai-agent/full-pipeline", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clip-assets"] });
    },
  });
}

export function useSmartSuggestions() {
  return useMutation({
    mutationFn: (data: { episodeId: string }) =>
      apiRequest("/api/ai-agent/smart-suggestions", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useGenerateNewsletter() {
  return useMutation({
    mutationFn: (data: { month: string; year: string }) =>
      apiRequest("/api/ai-agent/generate-newsletter", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/newsletter-runs"] }),
  });
}

export function useUpdateContentPiece() {
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; [key: string]: any }) =>
      apiRequest(`/api/content-pieces/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation-queue"] });
    },
  });
}

export function useClipAssets(episodeId?: string) {
  const url = episodeId ? `/api/clip-assets?episodeId=${episodeId}` : "/api/clip-assets";
  return useQuery({ queryKey: ["/api/clip-assets", episodeId], queryFn: () => apiRequest(url) });
}

export function useUpdateClipAsset() {
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/clip-assets/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/clip-assets"] }),
  });
}

export function useDeleteClipAsset() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/clip-assets/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/clip-assets"] }),
  });
}

export function useScheduledPosts(platform?: string) {
  const url = platform ? `/api/scheduled-posts?platform=${platform}` : "/api/scheduled-posts";
  return useQuery({ queryKey: ["/api/scheduled-posts", platform], queryFn: () => apiRequest(url) });
}

export function useCreateScheduledPost() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/scheduled-posts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/scheduled-posts"] }),
  });
}

export function useUpdateScheduledPost() {
  return useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/scheduled-posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/scheduled-posts"] }),
  });
}

export function useDeleteScheduledPost() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/scheduled-posts/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/scheduled-posts"] }),
  });
}

export function useSocialAccounts(filter?: { ownerType?: string; podcastId?: string }) {
  const params = new URLSearchParams();
  if (filter?.ownerType) params.set("ownerType", filter.ownerType);
  if (filter?.podcastId) params.set("podcastId", filter.podcastId);
  const qs = params.toString();
  const url = `/api/social-accounts${qs ? `?${qs}` : ""}`;
  return useQuery({ queryKey: ["/api/social-accounts", filter], queryFn: () => apiRequest(url) });
}

export function useCreateSocialAccount() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/social-accounts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] }),
  });
}

export function useUpdateSocialAccount() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => apiRequest(`/api/social-accounts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] }),
  });
}

export function useDeleteSocialAccount() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/social-accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] }),
  });
}

export function useNewsletterRuns() {
  return useQuery({ queryKey: ["/api/newsletter-runs"], queryFn: () => apiRequest("/api/newsletter-runs") });
}

export function useSendNewsletter() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/newsletter-runs/${id}/send`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/newsletter-runs"] }),
  });
}

export function useDeleteNewsletterRun() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/newsletter-runs/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/newsletter-runs"] }),
  });
}

export function useModerationQueue(type?: string) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  const statuses = ["review", "draft", "pending"];
  const url = `/api/moderation/queue${params.toString() ? `?${params}` : ""}`;
  return useQuery({
    queryKey: ["/api/moderation/queue", type],
    queryFn: async () => {
      const results: any[] = [];
      for (const status of statuses) {
        const p = new URLSearchParams();
        if (type) p.set("type", type);
        p.set("status", status);
        const items = await apiRequest(`/api/moderation/queue?${p}`);
        results.push(...items);
      }
      return results;
    },
  });
}

export function useModerationCounts() {
  return useQuery({ queryKey: ["/api/moderation/counts"], queryFn: () => apiRequest("/api/moderation/counts") });
}

export function useGenerateStory() {
  return useMutation({
    mutationFn: (data: { episodeId: string; transcript?: string }) =>
      apiRequest("/api/ai-agent/generate-story", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] });
      queryClient.invalidateQueries({ queryKey: ["/api/episodes"] });
    },
  });
}

export function useApproveStory() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/moderation/${id}/approve`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("/api/moderation") });
      queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] });
    },
  });
}

export function useRejectStory() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/moderation/${id}/reject`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("/api/moderation") });
      queryClient.invalidateQueries({ queryKey: ["/api/content-pieces"] });
    },
  });
}

export function useUpdateModerationPiece() {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/moderation/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (q) => (q.queryKey[0] as string)?.includes("/api/moderation") });
    },
  });
}

export function useOutboundCampaigns(audience?: string) {
  const url = audience ? `/api/outbound-campaigns?audience=${audience}` : "/api/outbound-campaigns";
  return useQuery({ queryKey: ["/api/outbound-campaigns", audience], queryFn: () => apiRequest(url) });
}

export function useCreateOutboundCampaign() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/outbound-campaigns", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/outbound-campaigns"] }),
  });
}

export function useDeleteOutboundCampaign() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/outbound-campaigns/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/outbound-campaigns"] }),
  });
}

export function useSendOutboundCampaign() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/outbound-campaigns/${id}/send`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/outbound-campaigns"] }),
  });
}

export function useCampaignRecipients(campaignId: string) {
  return useQuery({
    queryKey: ["/api/outbound-campaigns", campaignId, "recipients"],
    queryFn: () => apiRequest(`/api/outbound-campaigns/${campaignId}/recipients`),
    enabled: !!campaignId,
  });
}

export function useCrmLists(crmType?: string) {
  return useQuery({
    queryKey: ["/api/crm-lists", crmType],
    queryFn: () => apiRequest(`/api/crm-lists${crmType ? `?crmType=${crmType}` : ""}`),
  });
}

export function useCreateCrmList() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/crm-lists", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/crm-lists"] }),
  });
}

export function useDeleteCrmList() {
  return useMutation({
    mutationFn: (id: string) => apiRequest(`/api/crm-lists/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/crm-lists"] }),
  });
}

export function useEmailCampaignAnalytics() {
  return useQuery({ queryKey: ["/api/analytics/email-campaigns"], queryFn: () => apiRequest("/api/analytics/email-campaigns") });
}

export function useWebsiteAnalytics() {
  return useQuery({ queryKey: ["/api/analytics/website"], queryFn: () => apiRequest("/api/analytics/website") });
}

export function useAdminDashboardStats() {
  return useQuery({ queryKey: ["/api/admin/dashboard-stats"], queryFn: () => apiRequest("/api/admin/dashboard-stats") });
}

export function downloadCsvExport(entity: string, params: Record<string, string> = {}) {
  const query = new URLSearchParams(params).toString();
  const url = `/api/export/${entity}${query ? `?${query}` : ""}`;
  const link = document.createElement("a");
  link.href = url;
  link.download = `${entity}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
