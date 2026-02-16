import { useState, useEffect, useCallback, useRef } from "react";
import { getSubscriberEmail } from "./use-subscription";

export interface ReadLaterArticle {
  articleId: string;
  articleTitle: string;
  articleDescription?: string | null;
  coverImage?: string | null;
  podcastId: string;
  podcastTitle?: string;
  readingTime?: string | null;
  publishedAt?: string | null;
  savedAt: string;
}

const STORAGE_KEY = "mediatech_read_later";

function getLocalBookmarks(): ReadLaterArticle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalBookmarks(bookmarks: ReadLaterArticle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
  } catch {}
}

export function useReadLater() {
  const [savedArticles, setSavedArticles] = useState<ReadLaterArticle[]>(getLocalBookmarks);
  const [synced, setSynced] = useState(false);
  const emailRef = useRef<string | null>(null);

  useEffect(() => {
    const email = getSubscriberEmail();
    emailRef.current = email;
    if (email && !synced) {
      syncBookmarks(email);
    }
  }, []);

  const syncBookmarks = useCallback(async (email?: string) => {
    const syncEmail = email || emailRef.current || getSubscriberEmail();
    if (!syncEmail) return;
    try {
      const localBookmarks = getLocalBookmarks();
      const res = await fetch("/api/public/bookmarks/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: syncEmail, bookmarks: localBookmarks }),
      });
      if (res.ok) {
        const merged: ReadLaterArticle[] = await res.json();
        setSavedArticles(merged);
        setLocalBookmarks(merged);
        setSynced(true);
      }
    } catch {}
  }, []);

  const isSaved = useCallback((articleId: string) =>
    savedArticles.some((a) => a.articleId === articleId), [savedArticles]);

  const saveArticle = useCallback((article: {
    id: string;
    title?: string;
    description?: string | null;
    coverImage?: string | null;
    podcastId?: string;
    podcastTitle?: string;
    readingTime?: string | number | null;
    publishedAt?: string | null;
    [key: string]: any;
  }) => {
    const bookmark: ReadLaterArticle = {
      articleId: article.id,
      articleTitle: article.title || "",
      articleDescription: article.description || null,
      coverImage: article.coverImage || null,
      podcastId: article.podcastId || "",
      podcastTitle: article.podcastTitle || "",
      readingTime: article.readingTime != null ? String(article.readingTime) : null,
      publishedAt: article.publishedAt || null,
      savedAt: new Date().toISOString(),
    };

    setSavedArticles((prev) => {
      if (prev.some((a) => a.articleId === article.id)) return prev;
      const updated = [bookmark, ...prev];
      setLocalBookmarks(updated);
      return updated;
    });

    const email = emailRef.current || getSubscriberEmail();
    if (email) {
      fetch("/api/public/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, article: bookmark }),
      }).catch(() => {});
    }
  }, []);

  const removeArticle = useCallback((articleId: string) => {
    setSavedArticles((prev) => {
      const updated = prev.filter((a) => a.articleId !== articleId);
      setLocalBookmarks(updated);
      return updated;
    });

    const email = emailRef.current || getSubscriberEmail();
    if (email) {
      fetch("/api/public/bookmarks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, articleId }),
      }).catch(() => {});
    }
  }, []);

  const toggleArticle = useCallback((article: { id: string; [key: string]: any }) => {
    if (savedArticles.some((a) => a.articleId === article.id)) {
      removeArticle(article.id);
    } else {
      saveArticle(article);
    }
  }, [savedArticles, saveArticle, removeArticle]);

  const clearAll = useCallback(() => {
    setSavedArticles([]);
    setLocalBookmarks([]);
  }, []);

  return {
    savedArticles,
    savedCount: savedArticles.length,
    isSaved,
    saveArticle,
    removeArticle,
    toggleArticle,
    clearAll,
    syncBookmarks,
  };
}
