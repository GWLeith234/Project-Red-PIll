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
    if (!supported) {
      console.log("PUSH: browser does not support push notifications");
      return;
    }

    setPermission(Notification.permission);

    fetch("/api/public/vapid-key")
      .then((r) => r.json())
      .then((d) => {
        console.log("PUSH: fetched vapid key:", d.publicKey ? "present" : "missing");
        setVapidKey(d.publicKey);
      })
      .catch((err) => {
        console.error("PUSH ERROR: failed to fetch vapid key:", err);
      });

    navigator.serviceWorker.ready.then(async (reg) => {
      console.log("PUSH: service worker ready");
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        console.log("PUSH: existing subscription found");
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
      } else {
        console.log("PUSH: no existing subscription");
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
    try {
      console.log("PUSH: checking vapidKey", vapidKey ? "present" : "missing");
      if (!vapidKey) {
        console.error("PUSH ERROR: no vapid key available");
        return null;
      }

      console.log("PUSH: requesting permission");
      const perm = await requestPermission();
      console.log("PUSH: permission result:", perm);
      if (perm !== "granted") {
        console.error("PUSH ERROR: permission not granted:", perm);
        return null;
      }

      console.log("PUSH: getting SW registration");
      const reg = await navigator.serviceWorker.ready;
      console.log("PUSH: calling pushManager.subscribe");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      console.log("PUSH: subscription result:", sub ? "success" : "null");

      const keys = sub.toJSON().keys || {};
      console.log("PUSH: sending to server");
      const res = await fetch("/api/public/push/subscribe", {
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
      console.log("PUSH: server response status:", res.status);

      setIsSubscribed(true);
      setSubscription(sub);
      return sub;
    } catch (error) {
      console.error("PUSH ERROR:", error);
      return null;
    }
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
