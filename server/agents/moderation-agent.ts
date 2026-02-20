import { db } from "../storage";
import { contentPieces, contentGenerationJobs } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { openai } from "../ai-providers";

async function aiModerate(prompt: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
    temperature: 0.3,
  });
  return res.choices[0]?.message?.content || "";
}

function buildPrompt(piece: any): string {
  const ct = piece.contentType || piece.type;
  const title = piece.title || "";
  const body = (piece.body || "").substring(0, 4000);

  if (ct === "blog" || ct === "newsletter" || ct === "article") {
    return `You are a senior editor for a conservative media platform. Review this ${ct} content piece and provide your response as JSON:
{"score": <0-100>, "brand_voice_pass": <true/false>, "brand_voice_reason": "...", "improvements": ["1...", "2...", "3..."], "rewrite": "<if score below 75, rewrite the weakest paragraph, otherwise null>"}

Consider: writing quality, factual grounding, brand voice, engagement potential. Be direct and specific.

Title: ${title}
Content: ${body}`;
  }

  if (ct?.startsWith("social_")) {
    const platform = ct.replace("social_", "");
    return `Review this social media post for ${platform}. Respond as JSON:
{"score": <0-100>, "improvements": ["1...", "2..."], "rewrite": "<if score below 75, provide improved rewrite, otherwise null>"}

Score based on: platform-native feel, hook strength, shareability, conservative brand voice, character limits respected.

Title: ${title}
Content: ${body}`;
  }

  if (ct === "clip_suggestion") {
    return `Review these clip suggestions for viral potential. Respond as JSON:
{"score": <0-100>, "improvements": ["1...", "2..."], "rewrite": null}

Score based on: hook strength, emotional resonance, shareability, political relevance. Flag any that might be controversial.

Content: ${body}`;
  }

  if (ct === "seo_backlink") {
    return `Review these SEO backlink targets. Respond as JSON:
{"score": <0-100>, "improvements": ["top 3 to prioritize and why"], "rewrite": null}

Score the overall strategy based on: keyword relevance, achievability, traffic potential for a conservative media site.

Content: ${body}`;
  }

  return `Review this content piece and provide JSON: {"score": <0-100>, "improvements": ["1...", "2..."], "rewrite": null}. Title: ${title}. Content: ${body}`;
}

export async function moderateContentPiece(contentPieceId: string) {
  const [piece] = await db.select().from(contentPieces).where(eq(contentPieces.id, contentPieceId));
  if (!piece) throw new Error("Content piece not found");

  const prompt = buildPrompt(piece);
  const result = await aiModerate(prompt);

  let score = 70;
  let notes = result;
  let rewrite: string | null = null;

  try {
    const parsed = JSON.parse(result.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    score = typeof parsed.score === "number" ? Math.min(100, Math.max(0, parsed.score)) : 70;
    const improvements = Array.isArray(parsed.improvements) ? parsed.improvements.join("; ") : "";
    const brandNote = parsed.brand_voice_pass !== undefined
      ? `Brand Voice: ${parsed.brand_voice_pass ? "PASS" : "FAIL"} — ${parsed.brand_voice_reason || ""}. `
      : "";
    notes = `${brandNote}${improvements}`;
    rewrite = parsed.rewrite || null;
  } catch {}

  const moderationStatus = score >= 75 ? "approved" : "flagged";

  await db.update(contentPieces).set({
    aiQualityScore: score,
    aiQualityNotes: notes,
    aiRewriteSuggestion: rewrite,
    aiReviewedAt: new Date(),
    moderationStatus,
    pipelineStage: "review_ready",
  }).where(eq(contentPieces.id, contentPieceId));

  return { id: contentPieceId, score, moderationStatus, notes };
}

export async function moderateAll(episodeId: string) {
  const pieces = await db.select().from(contentPieces)
    .where(and(
      eq(contentPieces.sourceEpisodeId, episodeId),
      eq(contentPieces.moderationStatus, "pending")
    ));

  const results = [];
  for (const piece of pieces) {
    try {
      const r = await moderateContentPiece(piece.id);
      results.push(r);
    } catch (err: any) {
      results.push({ id: piece.id, score: 0, moderationStatus: "flagged", notes: `Error: ${err.message}` });
    }
  }

  const approved = results.filter(r => r.moderationStatus === "approved").length;
  const flagged = results.filter(r => r.moderationStatus === "flagged").length;
  const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;

  const job = await db.select().from(contentGenerationJobs)
    .where(eq(contentGenerationJobs.episodeId, episodeId))
    .limit(1);
  if (job.length > 0) {
    await db.update(contentGenerationJobs).set({
      status: "complete",
      completedAt: new Date(),
    }).where(eq(contentGenerationJobs.id, job[0].id));
  }

  return { total: results.length, approved, flagged, avgScore };
}

export async function moderateAllPending() {
  const pieces = await db.select().from(contentPieces)
    .where(eq(contentPieces.moderationStatus, "pending"));

  const results = [];
  for (const piece of pieces) {
    try {
      const r = await moderateContentPiece(piece.id);
      results.push(r);
    } catch (err: any) {
      results.push({ id: piece.id, score: 0, moderationStatus: "flagged", notes: `Error: ${err.message}` });
    }
  }

  const approved = results.filter(r => r.moderationStatus === "approved").length;
  const flagged = results.filter(r => r.moderationStatus === "flagged").length;
  const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;

  return { total: results.length, approved, flagged, avgScore };
}
