import OpenAI from "openai";
import { storage } from "./storage";
import type { Episode, ContentPiece } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)
    .replace(/^-|-$/g, "");
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 250));
}

export async function generateStoryFromTranscript(
  episodeId: string,
  transcript: string,
  episodeTitle: string,
  podcastTitle?: string
): Promise<ContentPiece> {
  const systemPrompt = `You are an expert editorial writer and SEO specialist for a media company. 
Your job is to transform podcast episode transcripts into polished, engaging articles that drive search traffic.

Write in a professional journalistic style. The article should:
- Have a compelling, SEO-optimized headline (different from the episode title)
- Include an engaging opening paragraph that hooks readers
- Be organized with clear subheadings (use ## for H2, ### for H3)
- Include key quotes from the conversation (use > blockquote format)
- End with a strong conclusion or call-to-action
- Be 800-1500 words
- Feel like an original article, not a transcript summary

Return your response as JSON with these exact fields:
{
  "title": "SEO-optimized article headline",
  "seoTitle": "Title tag for search engines (50-60 chars)",
  "seoDescription": "Meta description for search engines (150-160 chars)",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "summary": "2-3 sentence article summary for preview cards",
  "body": "Full article body in markdown format with ## headings, > blockquotes, **bold**, etc."
}`;

  const userPrompt = `Transform this podcast episode transcript into a polished article.

Episode Title: "${episodeTitle}"
${podcastTitle ? `Podcast: "${podcastTitle}"` : ""}

TRANSCRIPT:
${transcript.slice(0, 15000)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 8192,
  });

  const content = response.choices[0]?.message?.content || "{}";
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("AI returned invalid JSON for story generation");
  }

  const title = parsed.title || `Story: ${episodeTitle}`;
  const slug = generateSlug(title);
  const body = parsed.body || "";

  const piece = await storage.createContentPiece({
    episodeId,
    type: "article",
    title,
    description: parsed.summary || "",
    body,
    platform: "web",
    status: "review",
    slug,
    seoTitle: parsed.seoTitle || title,
    seoDescription: parsed.seoDescription || "",
    seoKeywords: parsed.seoKeywords || [],
    summary: parsed.summary || "",
    readingTime: estimateReadingTime(body),
    aiGenerated: true,
  });

  return piece;
}

export async function transcribeAndGenerateStory(episodeId: string): Promise<{
  transcript?: string;
  story?: ContentPiece;
  error?: string;
}> {
  const episode = await storage.getEpisode(episodeId);
  if (!episode) {
    return { error: "Episode not found" };
  }

  let transcript = episode.transcript;

  if (!transcript && episode.audioUrl) {
    try {
      await storage.updateEpisode(episodeId, { transcriptStatus: "processing" } as any);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      const audioResponse = await fetch(episode.audioUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!audioResponse.ok) {
        await storage.updateEpisode(episodeId, { transcriptStatus: "failed" } as any);
        return { error: "Failed to fetch audio file" };
      }

      const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());
      const { ensureCompatibleFormat } = await import("./replit_integrations/audio/client");
      const { buffer, format } = await ensureCompatibleFormat(audioBuffer);

      const { toFile } = await import("openai");
      const file = await toFile(buffer, `audio.${format}`);
      const transcriptionResult = await openai.audio.transcriptions.create({
        file,
        model: "gpt-4o-mini-transcribe",
        response_format: "json",
      });

      transcript = transcriptionResult.text;
      await storage.updateEpisode(episodeId, {
        transcript,
        transcriptStatus: "complete",
      } as any);
    } catch (err: any) {
      await storage.updateEpisode(episodeId, { transcriptStatus: "failed" } as any);
      return { error: `Transcription failed: ${err.message}` };
    }
  }

  if (!transcript) {
    return { error: "No transcript or audio URL available for this episode" };
  }

  let podcastTitle: string | undefined;
  const podcast = await storage.getPodcast(episode.podcastId);
  if (podcast) podcastTitle = podcast.title;

  try {
    const story = await generateStoryFromTranscript(
      episodeId,
      transcript,
      episode.title,
      podcastTitle
    );

    await storage.updateEpisode(episodeId, {
      processingStatus: "complete",
      processingProgress: 100,
    } as any);

    return { transcript, story };
  } catch (err: any) {
    return { transcript, error: `Story generation failed: ${err.message}` };
  }
}

export async function generateStoryFromText(
  episodeId: string,
  transcript: string
): Promise<ContentPiece> {
  const episode = await storage.getEpisode(episodeId);
  if (!episode) throw new Error("Episode not found");

  let podcastTitle: string | undefined;
  const podcast = await storage.getPodcast(episode.podcastId);
  if (podcast) podcastTitle = podcast.title;

  if (!episode.transcript) {
    await storage.updateEpisode(episodeId, {
      transcript,
      transcriptStatus: "complete",
    } as any);
  }

  return generateStoryFromTranscript(episodeId, transcript, episode.title, podcastTitle);
}
