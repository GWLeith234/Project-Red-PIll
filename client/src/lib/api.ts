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

export function useCampaigns(advertiserId?: string) {
  const url = advertiserId ? `/api/campaigns?advertiserId=${advertiserId}` : "/api/campaigns";
  return useQuery({ queryKey: ["/api/campaigns", advertiserId], queryFn: () => apiRequest(url) });
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

export function useAnalyzeSocial() {
  return useMutation({
    mutationFn: (data: { url: string }) => apiRequest("/api/subscribers/analyze-social", { method: "POST", body: JSON.stringify(data) }),
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

export function useSettings() {
  return useQuery({ queryKey: ["/api/settings"], queryFn: () => apiRequest("/api/settings") });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/settings"] }),
  });
}
