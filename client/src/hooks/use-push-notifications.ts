import { useState, useEffect, useCallback } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushPreferences {
  articles: boolean;
  episodes: boolean;
  breaking: boolean;
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [vapidKey, setVapidKey] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<PushPreferences>({ articles: true, episodes: true, breaking: true });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (!supported) return;

    setPermission(Notification.permission);

    fetch("/api/public/vapid-key")
      .then((r) => r.json())
      .then((d) => setVapidKey(d.publicKey))
      .catch(() => {});

    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setIsSubscribed(true);
        setSubscription(sub);
        try {
          const res = await fetch("/api/public/push/get-preferences", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.preferences) setPreferences(data.preferences);
          }
        } catch {}
      }
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) return "denied" as NotificationPermission;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, [isSupported]);

  const subscribe = useCallback(async (email?: string) => {
    if (!vapidKey) return null;
    const perm = await requestPermission();
    if (perm !== "granted") return null;

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const keys = sub.toJSON().keys || {};
    await fetch("/api/public/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: {
          endpoint: sub.endpoint,
          keys: { p256dh: keys.p256dh, auth: keys.auth },
        },
        email,
        preferences,
      }),
    });

    setIsSubscribed(true);
    setSubscription(sub);
    return sub;
  }, [vapidKey, requestPermission, preferences]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    await subscription.unsubscribe();
    await fetch("/api/public/push/unsubscribe", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });
    setIsSubscribed(false);
    setSubscription(null);
  }, [subscription]);

  const updatePreferences = useCallback(async (newPrefs: Partial<PushPreferences>) => {
    const merged = { ...preferences, ...newPrefs };
    setPreferences(merged);
    if (subscription) {
      await fetch("/api/public/push/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint, preferences: merged }),
      });
    }
  }, [preferences, subscription]);

  return {
    isSupported,
    isSubscribed,
    permission,
    preferences,
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
  };
}
