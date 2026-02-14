import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "mediatech_subscriber_email";
const NAME_KEY = "mediatech_subscriber_name";

export function getSubscriberEmail(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSubscriberEmail(email: string, name?: string) {
  try {
    localStorage.setItem(STORAGE_KEY, email.trim().toLowerCase());
    if (name) localStorage.setItem(NAME_KEY, name);
  } catch {}
}

export function getSubscriberName(): string | null {
  try {
    return localStorage.getItem(NAME_KEY);
  } catch {
    return null;
  }
}

interface Recommendation {
  id: string;
  title: string;
  host: string;
  coverImage: string | null;
  subscribers: number | null;
  growthPercent: number | null;
  description: string | null;
  score: number;
  reasons: string[];
}

interface SubscriptionStatus {
  subscribed: boolean;
  subscribedPodcastIds: string[];
  subscriberName: string | null;
  recommendations: Recommendation[];
}

export function useSubscription(podcastId?: string) {
  const [email, setEmail] = useState<string | null>(getSubscriberEmail);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ["/api/public/check-subscription", email, podcastId],
    queryFn: async () => {
      if (!email) return { subscribed: false, subscribedPodcastIds: [], subscriberName: null, recommendations: [] };
      const res = await fetch("/api/public/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, podcastId }),
      });
      if (!res.ok) return { subscribed: false, subscribedPodcastIds: [], subscriberName: null, recommendations: [] };
      return res.json();
    },
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
  });

  const markSubscribed = useCallback((subscriberEmail: string, name?: string) => {
    setSubscriberEmail(subscriberEmail, name);
    setEmail(subscriberEmail.trim().toLowerCase());
    queryClient.invalidateQueries({ queryKey: ["/api/public/check-subscription"] });
  }, [queryClient]);

  const isSubscribedTo = useCallback((pid: string) => {
    return data?.subscribedPodcastIds?.includes(pid) || false;
  }, [data]);

  return {
    email,
    isSubscribed: data?.subscribed || false,
    subscribedPodcastIds: data?.subscribedPodcastIds || [],
    subscriberName: data?.subscriberName || getSubscriberName(),
    recommendations: data?.recommendations || [],
    isLoading: !!email && isLoading,
    markSubscribed,
    isSubscribedTo,
    hasAccount: !!email,
  };
}
