import { db } from "../storage";
import { contentPieces, scheduledPosts } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

export async function reportContentPerformance(contentPieceId: string) {
  const [piece] = await db.select().from(contentPieces).where(eq(contentPieces.id, contentPieceId));
  if (!piece) return null;

  const impressions = piece.analyticsImpressions || 0;
  const clicks = piece.analyticsClicks || 0;
  const engagementRate = impressions > 0 ? (clicks / impressions) * 100 : 0;

  await db.update(contentPieces).set({
    analyticsEngagementRate: engagementRate,
    analyticsReportedAt: new Date(),
  }).where(eq(contentPieces.id, contentPieceId));

  return {
    id: contentPieceId,
    impressions,
    clicks,
    engagementRate: Math.round(engagementRate * 100) / 100,
  };
}

export async function getContentPerformanceSummary(episodeId: string) {
  const pieces = await db.select().from(contentPieces)
    .where(eq(contentPieces.sourceEpisodeId, episodeId));

  if (pieces.length === 0) {
    return { totalImpressions: 0, totalClicks: 0, avgEngagementRate: 0, bestPerformingPiece: null, bestPlatform: null, pieces: [] };
  }

  const totalImpressions = pieces.reduce((s, p) => s + (p.analyticsImpressions || 0), 0);
  const totalClicks = pieces.reduce((s, p) => s + (p.analyticsClicks || 0), 0);
  const avgEngagementRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const bestPerformingPiece = pieces.reduce((best, p) =>
    (p.analyticsImpressions || 0) > (best.analyticsImpressions || 0) ? p : best, pieces[0]);

  const platformStats: Record<string, number> = {};
  for (const p of pieces) {
    const platform = p.platform || p.contentType || "unknown";
    platformStats[platform] = (platformStats[platform] || 0) + (p.analyticsClicks || 0);
  }
  const bestPlatform = Object.entries(platformStats).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    totalImpressions,
    totalClicks,
    avgEngagementRate: Math.round(avgEngagementRate * 100) / 100,
    bestPerformingPiece: bestPerformingPiece ? { id: bestPerformingPiece.id, title: bestPerformingPiece.title, impressions: bestPerformingPiece.analyticsImpressions } : null,
    bestPlatform,
    pieces: pieces.map(p => ({
      id: p.id, title: p.title, contentType: p.contentType, platform: p.platform,
      impressions: p.analyticsImpressions, clicks: p.analyticsClicks,
      engagementRate: p.analyticsEngagementRate,
    })),
  };
}

export async function refreshAllPublishedAnalytics() {
  const published = await db.select().from(contentPieces)
    .where(eq(contentPieces.pipelineStage, "published"));

  for (const piece of published) {
    await reportContentPerformance(piece.id);
  }

  return { refreshed: published.length };
}
