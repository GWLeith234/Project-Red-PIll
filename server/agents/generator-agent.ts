import { db } from "../storage";
import { contentPieces, contentGenerationJobs } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { openai } from "../ai-providers";

async function aiGenerate(prompt: string): Promise<string> {
  const res = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4000,
    temperature: 0.7,
  });
  return res.choices[0]?.message?.content || "";
}

async function insertPiece(fields: {
  episodeId: string;
  sourceEpisodeId: string;
  title: string;
  body: string;
  type: string;
  contentType: string;
  platform?: string;
  description?: string;
  aiGenerated: boolean;
  pipelineStage: string;
  moderationStatus: string;
  source: string;
  aiQualityNotes?: string;
}) {
  const [piece] = await db.insert(contentPieces).values(fields).returning();
  return piece;
}

async function updateJobProgress(jobId: string, stageProgress: number, outputsGenerated?: number) {
  const updates: any = { stageProgress };
  if (outputsGenerated !== undefined) updates.outputsGenerated = outputsGenerated;
  await db.update(contentGenerationJobs).set(updates).where(eq(contentGenerationJobs.id, jobId));
}

export async function generateContentWaterfall(jobId: string) {
  const [job] = await db.select().from(contentGenerationJobs).where(eq(contentGenerationJobs.id, jobId));
  if (!job) throw new Error("Job not found");

  await db.update(contentGenerationJobs).set({
    status: "generating",
    startedAt: new Date(),
    stageProgress: 0,
  }).where(eq(contentGenerationJobs.id, jobId));

  const transcript = job.transcript || "";
  const showName = job.showName;
  const episodeTitle = job.episodeTitle;
  const episodeId = job.episodeId;
  let outputsGenerated = 0;

  const basePiece = {
    episodeId,
    sourceEpisodeId: episodeId,
    aiGenerated: true,
    pipelineStage: "moderating" as const,
    moderationStatus: "pending" as const,
    source: "ai_pipeline",
  };

  try {
    const blogResult = await aiGenerate(
      `You are a conservative media content writer for ${showName}. Based on this transcript, write a compelling long-form blog article (800-1200 words). Include: an attention-grabbing headline, an introduction that hooks the reader, 3-4 substantive sections with subheadings, key quotes from the episode pulled verbatim, a conclusion with a clear takeaway. Format the output as JSON: {"title": "...", "body": "<html content>", "excerpt": "150 char summary"}. Transcript: ${transcript.substring(0, 8000)}`
    );
    try {
      const blog = JSON.parse(blogResult.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      await insertPiece({ ...basePiece, title: blog.title || `${episodeTitle} - Blog`, body: blog.body || blogResult, type: "blog", contentType: "blog", description: blog.excerpt });
      outputsGenerated++;
    } catch { await insertPiece({ ...basePiece, title: `${episodeTitle} - Blog Article`, body: blogResult, type: "blog", contentType: "blog" }); outputsGenerated++; }
    await updateJobProgress(jobId, 15, outputsGenerated);

    const newsletterResult = await aiGenerate(
      `Write a newsletter-format email based on this podcast transcript. Format as JSON: {"subject": "max 60 chars subject line", "preview": "90 char preview", "body": "<html email format with opening paragraph, 3 key insights as bullets, 1 featured quote, CTA>"}. Keep total length under 500 words. Show: ${showName}. Transcript: ${transcript.substring(0, 8000)}`
    );
    try {
      const nl = JSON.parse(newsletterResult.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      await insertPiece({ ...basePiece, title: nl.subject || `${episodeTitle} Newsletter`, body: nl.body || newsletterResult, type: "newsletter", contentType: "newsletter", description: nl.preview });
      outputsGenerated++;
    } catch { await insertPiece({ ...basePiece, title: `${episodeTitle} - Newsletter`, body: newsletterResult, type: "newsletter", contentType: "newsletter" }); outputsGenerated++; }
    await updateJobProgress(jobId, 30, outputsGenerated);

    const xResult = await aiGenerate(
      `Write 3 different tweet-thread options based on this transcript. Each option: Tweet 1 (hook, max 280 chars), Tweet 2 (key point, max 280 chars), Tweet 3 (CTA, max 280 chars). Format as JSON array: [{"thread": ["tweet1", "tweet2", "tweet3"]}, ...]. Make them punchy, conservative in tone, shareable. Include relevant hashtags on Tweet 3 only. Show: ${showName}. Transcript: ${transcript.substring(0, 6000)}`
    );
    try {
      const threads = JSON.parse(xResult.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      for (let i = 0; i < Math.min(threads.length, 3); i++) {
        const thread = threads[i];
        const body = Array.isArray(thread.thread) ? thread.thread.join("\n\n---\n\n") : JSON.stringify(thread);
        await insertPiece({ ...basePiece, title: `${episodeTitle} - X Thread ${i + 1}`, body, type: "social", contentType: "social_x", platform: "x" });
        outputsGenerated++;
      }
    } catch { await insertPiece({ ...basePiece, title: `${episodeTitle} - X Threads`, body: xResult, type: "social", contentType: "social_x", platform: "x" }); outputsGenerated++; }
    await updateJobProgress(jobId, 45, outputsGenerated);

    const fbResult = await aiGenerate(
      `Write a Facebook post based on this podcast transcript. 150-250 words. Conversational tone. Start with a strong opening line that stops the scroll. Include the key insight from the episode. End with a question to drive comments. No hashtags. Show: ${showName}. Transcript: ${transcript.substring(0, 6000)}`
    );
    await insertPiece({ ...basePiece, title: `${episodeTitle} - Facebook Post`, body: fbResult, type: "social", contentType: "social_facebook", platform: "facebook" });
    outputsGenerated++;
    await updateJobProgress(jobId, 55, outputsGenerated);

    const liResult = await aiGenerate(
      `Write a LinkedIn post based on this podcast transcript. 200-300 words. Professional but engaging. Format: Bold opening line, 3-4 short paragraphs, 3-5 relevant hashtags at the end. Focus on the business/policy insight angle. Show: ${showName}. Transcript: ${transcript.substring(0, 6000)}`
    );
    await insertPiece({ ...basePiece, title: `${episodeTitle} - LinkedIn Post`, body: liResult, type: "social", contentType: "social_linkedin", platform: "linkedin" });
    outputsGenerated++;
    await updateJobProgress(jobId, 65, outputsGenerated);

    const igResult = await aiGenerate(
      `Write an Instagram caption based on this podcast transcript. 100-150 words. Energetic tone. Strong first line (shows before the 'more' cutoff). 5-7 relevant hashtags at the end. Also suggest a visual concept for the image (describe in 1 sentence what the graphic should show). Format as JSON: {"caption": "...", "visual_concept": "..."}. Show: ${showName}. Transcript: ${transcript.substring(0, 6000)}`
    );
    try {
      const ig = JSON.parse(igResult.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      await insertPiece({ ...basePiece, title: `${episodeTitle} - Instagram`, body: ig.caption || igResult, type: "social", contentType: "social_instagram", platform: "instagram", aiQualityNotes: ig.visual_concept });
      outputsGenerated++;
    } catch { await insertPiece({ ...basePiece, title: `${episodeTitle} - Instagram`, body: igResult, type: "social", contentType: "social_instagram", platform: "instagram" }); outputsGenerated++; }
    await updateJobProgress(jobId, 75, outputsGenerated);

    const clipResult = await aiGenerate(
      `Analyze this transcript and identify the 3-5 best moments for short-form video clips (30-90 seconds each). For each clip, provide as JSON array: [{"start": "MM:SS", "end": "MM:SS", "hook": "first sentence hook", "why_viral": "1 sentence reason", "caption": "social caption"}]. Transcript: ${transcript.substring(0, 8000)}`
    );
    try {
      const clips = JSON.parse(clipResult.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
      for (let i = 0; i < clips.length; i++) {
        await insertPiece({ ...basePiece, title: `${episodeTitle} - Clip ${i + 1}: ${clips[i].hook?.substring(0, 50) || ""}`, body: JSON.stringify(clips[i]), type: "clip", contentType: "clip_suggestion" });
        outputsGenerated++;
      }
    } catch { await insertPiece({ ...basePiece, title: `${episodeTitle} - Clip Suggestions`, body: clipResult, type: "clip", contentType: "clip_suggestion" }); outputsGenerated++; }
    await updateJobProgress(jobId, 90, outputsGenerated);

    const seoResult = await aiGenerate(
      `Based on this podcast transcript about ${showName}, identify 5-8 SEO backlink opportunities. For each: Target keyword phrase, Suggested anchor text, Recommended content type (article, listicle, FAQ), Brief description. Format as JSON array: [{"keyword": "...", "anchor_text": "...", "content_type": "...", "description": "..."}]. Transcript: ${transcript.substring(0, 6000)}`
    );
    await insertPiece({ ...basePiece, title: `${episodeTitle} - SEO Backlink Targets`, body: seoResult, type: "seo", contentType: "seo_backlink" });
    outputsGenerated++;
    await updateJobProgress(jobId, 100, outputsGenerated);

    await db.update(contentGenerationJobs).set({
      status: "moderating",
      stageProgress: 100,
      outputsGenerated,
    }).where(eq(contentGenerationJobs.id, jobId));

    return { jobId, outputsGenerated };

  } catch (err: any) {
    await db.update(contentGenerationJobs).set({
      status: "failed",
      errorMessage: err.message,
      completedAt: new Date(),
    }).where(eq(contentGenerationJobs.id, jobId));
    throw err;
  }
}
