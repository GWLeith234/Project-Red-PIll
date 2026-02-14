import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "mediatech_read_later";

export interface ReadLaterArticle {
  id: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  podcastId: string;
  podcastTitle?: string;
  readingTime?: string | null;
  publishedAt?: string | null;
  savedAt: string;
}

function loadSavedArticles(): ReadLaterArticle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function persistArticles(articles: ReadLaterArticle[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
  } catch {}
}

export function useReadLater() {
  const [savedArticles, setSavedArticles] = useState<ReadLaterArticle[]>(loadSavedArticles);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSavedArticles(loadSavedArticles());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isSaved = useCallback(
    (articleId: string) => savedArticles.some((a) => a.id === articleId),
    [savedArticles]
  );

  const saveArticle = useCallback((article: Omit<ReadLaterArticle, "savedAt">) => {
    setSavedArticles((prev) => {
      if (prev.some((a) => a.id === article.id)) return prev;
      const next = [{ ...article, savedAt: new Date().toISOString() }, ...prev];
      persistArticles(next);
      return next;
    });
  }, []);

  const removeArticle = useCallback((articleId: string) => {
    setSavedArticles((prev) => {
      const next = prev.filter((a) => a.id !== articleId);
      persistArticles(next);
      return next;
    });
  }, []);

  const toggleArticle = useCallback(
    (article: Omit<ReadLaterArticle, "savedAt">) => {
      if (isSaved(article.id)) {
        removeArticle(article.id);
      } else {
        saveArticle(article);
      }
    },
    [isSaved, saveArticle, removeArticle]
  );

  const clearAll = useCallback(() => {
    setSavedArticles([]);
    persistArticles([]);
  }, []);

  return {
    savedArticles,
    savedCount: savedArticles.length,
    isSaved,
    saveArticle,
    removeArticle,
    toggleArticle,
    clearAll,
  };
}
