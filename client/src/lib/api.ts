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

export function useSettings() {
  return useQuery({ queryKey: ["/api/settings"], queryFn: () => apiRequest("/api/settings") });
}

export function useUpdateSettings() {
  return useMutation({
    mutationFn: (data: any) => apiRequest("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/settings"] }),
  });
}
