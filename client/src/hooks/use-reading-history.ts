import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "mediatech_reading_history";
const MAX_HISTORY = 100;

export interface ReadHistoryEntry {
  id: string;
  title: string;
  type: string;
  episodeId: string;
  podcastId?: string;
  coverImage?: string | null;
  readAt: string;
}

function loadHistory(): ReadHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function persistHistory(entries: ReadHistoryEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {}
}

export function useReadingHistory() {
  const [history, setHistory] = useState<ReadHistoryEntry[]>(loadHistory);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setHistory(loadHistory());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const recordRead = useCallback((entry: Omit<ReadHistoryEntry, "readAt">) => {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== entry.id);
      const next = [{ ...entry, readAt: new Date().toISOString() }, ...filtered];
      persistHistory(next);
      return next.slice(0, MAX_HISTORY);
    });
  }, []);

  const getReadArticleIds = useCallback(() => {
    return history.map((h) => h.id);
  }, [history]);

  const getReadEpisodeIds = useCallback(() => {
    return Array.from(new Set(history.map((h) => h.episodeId)));
  }, [history]);

  const isRead = useCallback(
    (articleId: string) => history.some((h) => h.id === articleId),
    [history]
  );

  return {
    history,
    recordRead,
    getReadArticleIds,
    getReadEpisodeIds,
    isRead,
  };
}
