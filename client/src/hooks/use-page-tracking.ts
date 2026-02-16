import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateId(storage: Storage, key: string): string {
  let id = storage.getItem(key);
  if (!id) {
    id = generateUUID();
    storage.setItem(key, id);
  }
  return id;
}

function sendTimeOnPage(pageviewId: string, timeOnPage: number) {
  const url = `/api/public/analytics/pageview/${pageviewId}`;
  const body = JSON.stringify({ timeOnPage: Math.round(timeOnPage) });
  try {
    fetch(url, { method: "PATCH", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {}
}

export function usePageTracking() {
  const [location] = useLocation();
  const pageviewIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (pageviewIdRef.current) {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      sendTimeOnPage(pageviewIdRef.current, elapsed);
    }

    pageviewIdRef.current = null;
    startTimeRef.current = Date.now();

    const sessionId = getOrCreateId(sessionStorage, "_mt_session_id");
    const visitorId = getOrCreateId(localStorage, "_mt_visitor_id");

    fetch("/api/public/analytics/pageview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: location,
        pageTitle: document.title,
        sessionId,
        visitorId,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      }),
    })
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.id) {
          pageviewIdRef.current = data.id;
        }
      })
      .catch(() => {});

    return () => {};
  }, [location]);

  useEffect(() => {
    const handleUnload = () => {
      if (pageviewIdRef.current) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        sendTimeOnPage(pageviewIdRef.current, elapsed);
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);
}
