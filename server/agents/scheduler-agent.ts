import { db } from "../storage";
import { contentPieces, scheduledPosts } from "@shared/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { openai } from "../ai-providers";

async function aiSchedule(prompt: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
    temperature: 0.4,
  });
  return res.choices[0]?.message?.content || "";
}

export async function suggestSchedule(episodeId: string) {
  const pieces = await db.select().from(contentPieces)
    .where(and(
      eq(contentPieces.sourceEpisodeId, episodeId),
      eq(contentPieces.moderationStatus, "approved")
    ));

  if (pieces.length === 0) return [];

  const piecesList = pieces.map(p => `- ${p.contentType || p.type} (id: ${p.id}): "${p.title}"`).join("\n");

  const result = await aiSchedule(
    `You are a social media scheduler for a conservative news/podcast platform. We have the following approved content pieces ready to publish:\n${piecesList}\n\nCreate an optimal publishing schedule for the next 7 days starting from now. Rules:\n1) Blog article publishes first (drives SEO and backlinks)\n2) Newsletter sends day 2 morning\n3) Social posts stagger across the week — don't post same platform twice in one day\n4) Best times: X/Twitter 7am and 6pm CT, Facebook 9am and 3pm CT, LinkedIn 8am Tuesday-Thursday, Instagram 12pm any day\n5) Clip suggestions go to video editor queue — schedule them but mark as clip_ready\n\nRespond as a JSON array: [{"content_piece_id": "...", "content_type": "...", "platform": "blog|newsletter|x|facebook|linkedin|instagram", "scheduled_datetime": "ISO format in CT timezone", "reason": "1 sentence why this time"}]`
  );

  try {
    const schedule = JSON.parse(result.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    return Array.isArray(schedule) ? schedule : [];
  } catch {
    return [];
  }
}

export async function confirmSchedule(episodeId: string, schedule: any[]) {
  const posts = [];
  for (const item of schedule) {
    const scheduledAt = new Date(item.scheduled_datetime || item.scheduledDatetime || item.scheduled_at);
    if (isNaN(scheduledAt.getTime())) continue;

    const platform = item.platform || "blog";
    const contentPieceId = item.content_piece_id || item.contentPieceId;
    if (!contentPieceId) continue;

    const [post] = await db.insert(scheduledPosts).values({
      contentPieceId,
      platform,
      scheduledAt,
      status: "scheduled",
      aiSuggested: true,
      aiSuggestionReason: item.reason || "",
      aiSuggestion: item.reason || "",
    }).returning();

    await db.update(contentPieces).set({
      pipelineStage: "scheduled",
      scheduledPublishAt: scheduledAt,
      platform,
    }).where(eq(contentPieces.id, contentPieceId));

    posts.push(post);
  }
  return posts;
}

export async function publishDueItems() {
  const now = new Date();
  const duePosts = await db.select().from(scheduledPosts)
    .where(and(
      lte(scheduledPosts.scheduledAt, now),
      eq(scheduledPosts.status, "scheduled")
    ));

  const published = [];
  for (const post of duePosts) {
    await db.update(scheduledPosts).set({
      status: "published",
      publishedAt: now,
    }).where(eq(scheduledPosts.id, post.id));

    await db.update(contentPieces).set({
      pipelineStage: "published",
      publishedAt: now,
      status: "published",
    }).where(eq(contentPieces.id, post.contentPieceId));

    published.push(post.id);
  }
  return published;
}

let publishInterval: NodeJS.Timeout | null = null;

export function startPublishScheduler() {
  if (publishInterval) return;
  publishInterval = setInterval(async () => {
    try {
      const published = await publishDueItems();
      if (published.length > 0) {
        console.log(`[Scheduler] Auto-published ${published.length} items`);
      }
    } catch (err) {
      console.error("[Scheduler] Auto-publish error:", err);
    }
  }, 5 * 60 * 1000);
  console.log("[Scheduler] Auto-publisher started (every 5 min)");
}
