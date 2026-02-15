import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface ReadLaterArticle {
  id: string;
  userId: string;
  contentPieceId: string;
  savedAt: string;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  podcastId: string;
  podcastTitle?: string;
  readingTime?: number | null;
  publishedAt?: string | null;
}

export function useReadLater() {
  const queryClient = useQueryClient();

  const { data: savedArticles = [] } = useQuery<ReadLaterArticle[]>({
    queryKey: ["/api/read-later"],
    retry: false,
    staleTime: 30000,
  });

  const addMutation = useMutation({
    mutationFn: async (contentPieceId: string) => {
      const res = await apiRequest("POST", "/api/read-later", { contentPieceId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/read-later"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (contentPieceId: string) => {
      const res = await apiRequest("DELETE", `/api/read-later/${contentPieceId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/read-later"] });
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/read-later");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/read-later"] });
    },
  });

  const isSaved = (articleId: string) =>
    savedArticles.some((a) => a.contentPieceId === articleId);

  const saveArticle = (article: { id: string; [key: string]: any }) => {
    addMutation.mutate(article.id);
  };

  const removeArticle = (contentPieceId: string) => {
    removeMutation.mutate(contentPieceId);
  };

  const toggleArticle = (article: { id: string; [key: string]: any }) => {
    if (isSaved(article.id)) {
      removeArticle(article.id);
    } else {
      saveArticle(article);
    }
  };

  const clearAll = () => {
    clearMutation.mutate();
  };

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
