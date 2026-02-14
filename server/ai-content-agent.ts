import OpenAI from "openai";
import { storage } from "./storage";
import type { Episode, ContentPiece, ClipAsset } from "@shared/schema";

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

export interface KeywordAnalysisResult {
  topKeywords: Array<{
    keyword: string;
    relevanceScore: number;
    trendingScore: number;
    searchIntent: "informational" | "navigational" | "transactional" | "commercial";
    competitionLevel: "low" | "medium" | "high";
    recommendation: string;
  }>;
  longTailKeywords: Array<{
    phrase: string;
    relevanceScore: number;
    trendingScore: number;
  }>;
  topicClusters: Array<{
    topic: string;
    keywords: string[];
    contentAngle: string;
  }>;
  optimizationTips: string[];
  suggestedTitle: string;
  suggestedMetaDescription: string;
}

export async function analyzeTranscriptKeywords(
  transcript: string,
  episodeTitle: string,
  podcastTitle?: string
): Promise<KeywordAnalysisResult> {
  const systemPrompt = `You are an expert SEO keyword analyst and content strategist. Analyze podcast transcripts to extract the most valuable keywords and phrases that are currently trending and have high search ranking potential.

Your analysis should:
1. Identify 10-15 top keywords/phrases that audiences are actively searching for
2. Score each keyword for relevance to the content (1-100) and trending potential (1-100)
3. Classify search intent for each keyword
4. Assess competition level
5. Find 5-8 long-tail keyword phrases (3-5 words) with high ranking potential
6. Group keywords into topic clusters for content optimization
7. Provide actionable SEO optimization tips specific to this content
8. Suggest an optimized title and meta description using top ranking keywords

Focus on keywords that:
- Have high current search volume and trending momentum
- Match the specific topics discussed in the episode
- Can realistically rank with content optimization
- Would attract the target audience

Return JSON:
{
  "topKeywords": [
    {
      "keyword": "keyword or short phrase",
      "relevanceScore": 85,
      "trendingScore": 92,
      "searchIntent": "informational",
      "competitionLevel": "medium",
      "recommendation": "Use in H2 heading and first paragraph"
    }
  ],
  "longTailKeywords": [
    {
      "phrase": "longer search phrase people use",
      "relevanceScore": 78,
      "trendingScore": 80
    }
  ],
  "topicClusters": [
    {
      "topic": "Main topic name",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "contentAngle": "Suggested angle to cover this topic cluster"
    }
  ],
  "optimizationTips": [
    "Specific actionable tip for optimizing content around these keywords"
  ],
  "suggestedTitle": "SEO-optimized title using top trending keywords",
  "suggestedMetaDescription": "150-160 char meta description with primary keywords"
}`;

  const userPrompt = `Analyze this podcast transcript for the most valuable, currently trending keywords to optimize for maximum search visibility and audience growth.

Episode Title: "${episodeTitle}"
${podcastTitle ? `Podcast: "${podcastTitle}"` : ""}

TRANSCRIPT:
${transcript.slice(0, 12000)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 3000,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

  return {
    topKeywords: (parsed.topKeywords || []).slice(0, 15),
    longTailKeywords: (parsed.longTailKeywords || []).slice(0, 8),
    topicClusters: parsed.topicClusters || [],
    optimizationTips: parsed.optimizationTips || [],
    suggestedTitle: parsed.suggestedTitle || episodeTitle,
    suggestedMetaDescription: parsed.suggestedMetaDescription || "",
  };
}

function buildKeywordContext(trendingKeywords?: string[]): string {
  if (!trendingKeywords || trendingKeywords.length === 0) return "";
  return `\n\nTRENDING KEYWORDS TO OPTIMIZE FOR (incorporate naturally into your content, headings, and SEO fields):
${trendingKeywords.slice(0, 15).map((k, i) => `${i + 1}. ${k}`).join("\n")}`;
}

export async function generateStoryFromTranscript(
  episodeId: string,
  transcript: string,
  episodeTitle: string,
  podcastTitle?: string,
  trendingKeywords?: string[]
): Promise<ContentPiece> {
  const keywordContext = buildKeywordContext(trendingKeywords);
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
${trendingKeywords?.length ? "- Strategically incorporate the provided trending keywords in headings, opening paragraphs, and throughout the article for maximum SEO impact" : ""}

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
${podcastTitle ? `Podcast: "${podcastTitle}"` : ""}${keywordContext}

TRANSCRIPT:
${transcript.slice(0, 15000)}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4096,
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

export async function generateBlogPost(
  episodeId: string,
  transcript: string,
  episodeTitle: string,
  podcastTitle?: string,
  trendingKeywords?: string[]
): Promise<ContentPiece> {
  const keywordContext = buildKeywordContext(trendingKeywords);
  const systemPrompt = `You are a professional blog writer and SEO content strategist. Transform podcast transcripts into engaging, SEO-optimized blog posts that are longer and more detailed than news articles.

The blog post should:
- Have a compelling, keyword-rich title optimized for search
- Be 1500-2500 words with in-depth analysis
- Include an engaging introduction with a hook
- Use ## and ### headings for structure
- Include practical takeaways, tips, or action items
- Feature pull quotes from the conversation (> blockquote)
- End with a conclusion and call-to-action
- Be written in an authoritative but accessible voice
- Include internal linking suggestions
${trendingKeywords?.length ? "- Strategically weave the provided trending keywords into headings, subheadings, and key paragraphs for SEO ranking" : ""}

Return JSON:
{
  "title": "Blog post title",
  "seoTitle": "SEO title tag (50-60 chars)",
  "seoDescription": "Meta description (150-160 chars)",
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6"],
  "summary": "2-3 sentence summary for preview",
  "body": "Full blog post in markdown"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Write a detailed blog post from this episode.\n\nEpisode: "${episodeTitle}"\n${podcastTitle ? `Show: "${podcastTitle}"` : ""}${keywordContext}\n\nTRANSCRIPT:\n${transcript.slice(0, 15000)}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 4096,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
  const title = parsed.title || `Blog: ${episodeTitle}`;
  const body = parsed.body || "";

  return storage.createContentPiece({
    episodeId,
    type: "blog",
    title,
    description: parsed.summary || "",
    body,
    platform: "web",
    status: "review",
    slug: generateSlug(title),
    seoTitle: parsed.seoTitle || title,
    seoDescription: parsed.seoDescription || "",
    seoKeywords: parsed.seoKeywords || [],
    summary: parsed.summary || "",
    readingTime: estimateReadingTime(body),
    aiGenerated: true,
  });
}

export async function generateSocialPosts(
  episodeId: string,
  transcript: string,
  episodeTitle: string,
  podcastTitle?: string,
  trendingKeywords?: string[]
): Promise<ContentPiece[]> {
  const keywordContext = trendingKeywords?.length
    ? `\n\nTRENDING KEYWORDS/HASHTAGS TO INCORPORATE: ${trendingKeywords.slice(0, 10).join(", ")}`
    : "";
  const systemPrompt = `You are a social media content strategist for a media company. Create platform-specific posts from podcast transcripts.

Generate posts for each platform with the right tone, length, and format:
- X: Punchy, 280 chars max, use threads for longer content. Include 2-3 hashtags.
- LinkedIn: Professional, 1300 chars, thought leadership angle. Include 3-5 hashtags.
- Facebook: Conversational, 500-800 chars, engaging question or story hook.
- Google Business: Brief update, 300 chars, local business focus.
${trendingKeywords?.length ? "- Use the provided trending keywords as hashtags and incorporate them naturally into post copy for maximum reach" : ""}

Return JSON:
{
  "posts": [
    {
      "platform": "x",
      "title": "Post title/hook",
      "body": "Full post text with hashtags",
      "hashtags": ["hashtag1", "hashtag2"]
    },
    {
      "platform": "linkedin",
      "title": "Post title",
      "body": "Full LinkedIn post",
      "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
    },
    {
      "platform": "facebook",
      "title": "Post title",
      "body": "Full Facebook post",
      "hashtags": ["hashtag1"]
    },
    {
      "platform": "google_business",
      "title": "Update title",
      "body": "Brief Google Business update",
      "hashtags": []
    }
  ]
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Create social media posts from this episode.\n\nEpisode: "${episodeTitle}"\n${podcastTitle ? `Show: "${podcastTitle}"` : ""}${keywordContext}\n\nTRANSCRIPT:\n${transcript.slice(0, 10000)}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || '{"posts":[]}');
  const posts = parsed.posts || [];
  const pieces: ContentPiece[] = [];

  for (const post of posts) {
    const piece = await storage.createContentPiece({
      episodeId,
      type: "social",
      title: post.title || `${post.platform} post`,
      description: post.body?.slice(0, 200) || "",
      body: post.body || "",
      platform: post.platform || "x",
      status: "review",
      slug: generateSlug(`${post.platform}-${episodeTitle}`),
      seoKeywords: post.hashtags || [],
      aiGenerated: true,
    });
    pieces.push(piece);
  }

  return pieces;
}

export async function generateClipSuggestions(
  episodeId: string,
  transcript: string,
  episodeTitle: string,
  duration?: string
): Promise<ClipAsset[]> {
  const systemPrompt = `You are a viral content strategist specializing in short-form video clips. Analyze podcast transcripts to identify the most engaging, shareable moments that would perform well as standalone clips on TikTok, YouTube Shorts, Instagram Reels, and X.

For each clip suggestion:
- Identify a 30-90 second segment with high viral potential
- Focus on: surprising insights, emotional moments, controversial takes, practical tips, quotable statements, funny exchanges
- Provide accurate timestamp estimates based on word position in transcript
- Write a compelling hook (first 3 seconds text overlay)
- Score viral potential 1-100

Return JSON:
{
  "clips": [
    {
      "title": "Clip title for internal reference",
      "hookText": "Hook text overlay for first 3 seconds",
      "startTime": "MM:SS",
      "endTime": "MM:SS",
      "duration": "duration in seconds",
      "transcriptExcerpt": "Key quote or excerpt from this segment",
      "viralScore": 85,
      "platform": "tiktok",
      "reason": "Why this clip has viral potential"
    }
  ]
}

Suggest 3-6 clips ordered by viral potential.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Find the most viral clip moments in this episode.\n\nEpisode: "${episodeTitle}"\nDuration: ${duration || "unknown"}\n\nTRANSCRIPT:\n${transcript.slice(0, 15000)}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || '{"clips":[]}');
  const clips = parsed.clips || [];
  const assets: ClipAsset[] = [];

  for (const clip of clips) {
    const asset = await storage.createClipAsset({
      episodeId,
      title: clip.title || "Untitled Clip",
      hookText: clip.hookText || "",
      startTime: clip.startTime || "00:00",
      endTime: clip.endTime || "01:00",
      duration: clip.duration ? `${clip.duration}s` : "60s",
      transcriptExcerpt: clip.transcriptExcerpt || "",
      viralScore: clip.viralScore || 50,
      status: "suggested",
      platform: clip.platform || "tiktok",
    });
    assets.push(asset);
  }

  return assets;
}

export async function generateNewsletterBlurb(
  episodeId: string,
  transcript: string,
  episodeTitle: string,
  podcastTitle?: string
): Promise<ContentPiece> {
  const systemPrompt = `You are a newsletter editor. Write a concise, engaging newsletter segment about a podcast episode. This will be included in a monthly digest newsletter.

The blurb should:
- Be 150-300 words
- Have a catchy subheading
- Summarize key takeaways
- Include a compelling reason to listen/read more
- Be formatted for email (simple markdown, no complex formatting)

Return JSON:
{
  "title": "Newsletter segment heading",
  "summary": "One-line teaser",
  "body": "Full newsletter blurb in simple markdown"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Write a newsletter blurb for this episode.\n\nEpisode: "${episodeTitle}"\n${podcastTitle ? `Show: "${podcastTitle}"` : ""}\n\nTRANSCRIPT:\n${transcript.slice(0, 8000)}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

  return storage.createContentPiece({
    episodeId,
    type: "newsletter",
    title: parsed.title || `Newsletter: ${episodeTitle}`,
    description: parsed.summary || "",
    body: parsed.body || "",
    platform: "email",
    status: "review",
    slug: generateSlug(`newsletter-${episodeTitle}`),
    summary: parsed.summary || "",
    readingTime: estimateReadingTime(parsed.body || ""),
    aiGenerated: true,
  });
}

export async function generateSEOAssets(
  episodeId: string,
  transcript: string,
  episodeTitle: string,
  podcastTitle?: string,
  trendingKeywords?: string[]
): Promise<ContentPiece> {
  const keywordContext = buildKeywordContext(trendingKeywords);
  const systemPrompt = `You are an SEO specialist. Generate comprehensive SEO assets from a podcast episode transcript.

Create:
- Optimized page title and meta description
- Focus keywords and long-tail keyword variations
- FAQ schema content (5-8 questions and answers from the episode)
- Schema markup suggestions
- Internal linking recommendations
${trendingKeywords?.length ? "- Prioritize the provided trending keywords in all SEO fields, titles, and FAQ questions to maximize search ranking potential" : ""}

Return JSON:
{
  "title": "SEO Asset Package: [Episode Title]",
  "seoTitle": "Optimized page title (50-60 chars)",
  "seoDescription": "Meta description (150-160 chars)",
  "seoKeywords": ["primary keyword", "secondary", "long-tail-1", "long-tail-2", "long-tail-3"],
  "body": "Full SEO asset content including FAQ section in markdown",
  "summary": "Brief description of SEO opportunities"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Generate SEO assets for this episode.\n\nEpisode: "${episodeTitle}"\n${podcastTitle ? `Show: "${podcastTitle}"` : ""}${keywordContext}\n\nTRANSCRIPT:\n${transcript.slice(0, 12000)}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

  return storage.createContentPiece({
    episodeId,
    type: "seo",
    title: parsed.title || `SEO Assets: ${episodeTitle}`,
    description: parsed.summary || "",
    body: parsed.body || "",
    platform: "web",
    status: "review",
    slug: generateSlug(`seo-${episodeTitle}`),
    seoTitle: parsed.seoTitle || "",
    seoDescription: parsed.seoDescription || "",
    seoKeywords: parsed.seoKeywords || [],
    summary: parsed.summary || "",
    aiGenerated: true,
  });
}

export async function generateSmartSuggestions(
  episodeId: string,
  transcript: string,
  episodeTitle: string
): Promise<any> {
  const systemPrompt = `You are a content distribution strategist. Analyze podcast content and provide SMART distribution recommendations.

Consider:
- Best posting times for each platform (based on general best practices)
- Content format recommendations per platform
- Audience targeting suggestions
- Hashtag strategy
- Cross-promotion opportunities
- Engagement optimization tips

Return JSON:
{
  "suggestions": [
    {
      "platform": "x",
      "bestTime": "Tuesday 9:00 AM EST",
      "format": "Thread with key takeaways",
      "hashtags": ["#podcast", "#media"],
      "tip": "Specific actionable recommendation",
      "priority": "high"
    }
  ],
  "overallStrategy": "Brief overall distribution strategy summary",
  "contentCalendarSuggestion": "Suggested posting schedule across the week"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Provide SMART distribution suggestions for this episode.\n\nEpisode: "${episodeTitle}"\n\nTRANSCRIPT EXCERPT:\n${transcript.slice(0, 5000)}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 1024,
  });

  return JSON.parse(response.choices[0]?.message?.content || '{"suggestions":[]}');
}

export async function generateMonthlyNewsletter(
  month: string,
  year: string
): Promise<{ title: string; body: string; contentPieceIds: string[] }> {
  const allContent = await storage.getContentPieces();
  const published = allContent.filter((p: ContentPiece) => p.status === "published" || p.status === "ready");
  const recent = published.slice(0, 20);

  if (recent.length === 0) {
    return {
      title: `Monthly Newsletter - ${month} ${year}`,
      body: "No published content available for this period.",
      contentPieceIds: [],
    };
  }

  const contentSummaries = recent.map((p: ContentPiece) =>
    `- "${p.title}" (${p.type}): ${p.summary || p.description || "No summary"}`
  ).join("\n");

  const systemPrompt = `You are a newsletter editor for a media company. Compile a monthly digest newsletter from recently published content.

The newsletter should:
- Have an engaging subject line
- Include a brief editorial introduction
- Highlight top stories with brief summaries and links
- Group content by category (articles, blog posts, clips, etc.)
- Include a closing section with what's coming next month
- Be formatted for email (HTML-compatible markdown)
- Be professional but warm in tone

Return JSON:
{
  "title": "Newsletter subject line",
  "body": "Full newsletter body in markdown"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Compile the ${month} ${year} monthly newsletter from this content:\n\n${contentSummaries}` },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2048,
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");

  return {
    title: parsed.title || `Monthly Newsletter - ${month} ${year}`,
    body: parsed.body || "",
    contentPieceIds: recent.map((p: ContentPiece) => p.id),
  };
}

async function resolveAudioUrl(url: string): Promise<string> {
  if (url.startsWith("/objects/")) return url;
  if (/\.(mp3|wav|m4a|aac|ogg|flac)(\?|$)/i.test(url)) return url;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("audio/") || contentType.includes("application/octet-stream")) {
      return url;
    }
    if (!contentType.includes("text/html")) {
      return url;
    }
    const html = await response.text();

    const jsonDataMatch = html.match(/window\.__data\s*=\s*(\{[\s\S]*?\});/);
    if (jsonDataMatch) {
      try {
        const data = JSON.parse(jsonDataMatch[1]);
        const audioUrl = data?.clip?.audioUrl || data?.audioUrl || data?.episode?.audioUrl;
        if (audioUrl) return audioUrl;
      } catch {}
    }

    const mp3Match = html.match(/"(https?:\/\/[^"]*audio\.mp3[^"]*)"/);
    if (mp3Match) return mp3Match[1].replace(/&amp;/g, "&");

    const podtracMatch = html.match(/"(https?:\/\/[^"]*podtrac\.com[^"]*\.mp3[^"]*)"/);
    if (podtracMatch) return podtracMatch[1].replace(/&amp;/g, "&");

    const trafficOmnyMatch = html.match(/"(https?:\/\/traffic\.omny\.fm[^"]*\/audio[^"]*)"/);
    if (trafficOmnyMatch) return trafficOmnyMatch[1].replace(/&amp;/g, "&");

    const audioMatch = html.match(/"(https?:\/\/[^"]*\.(mp3|wav|m4a|aac)(\?[^"]*)?)"/);
    if (audioMatch) return audioMatch[1].replace(/&amp;/g, "&");
  } catch (err) {
    console.warn(`[Pipeline] URL resolution failed for ${url}:`, (err as Error).message);
  }
  return url;
}

async function fetchAudioBuffer(audioUrl: string): Promise<Buffer> {
  if (audioUrl.startsWith("/objects/")) {
    const { ObjectStorageService } = await import("./replit_integrations/object_storage/objectStorage");
    const objectService = new ObjectStorageService();
    const objectFile = await objectService.getObjectEntityFile(audioUrl);
    const [contents] = await objectFile.download();
    return Buffer.from(contents);
  }

  const resolvedUrl = await resolveAudioUrl(audioUrl);
  console.log(`[Pipeline] Fetching audio from: ${resolvedUrl.substring(0, 80)}...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch(resolvedUrl, { signal: controller.signal, redirect: "follow" });
    if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to fetch audio file`);
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      throw new Error(`URL resolved to an HTML page instead of audio. The audio URL "${audioUrl}" could not be resolved to a direct audio file.`);
    }
    return Buffer.from(await response.arrayBuffer());
  } finally {
    clearTimeout(timeout);
  }
}

export async function runFullContentPipeline(episodeId: string, contentTypes: string[] = ["article", "blog", "social", "clips", "newsletter", "seo"]): Promise<{
  article?: ContentPiece;
  blog?: ContentPiece;
  socialPosts?: ContentPiece[];
  clips?: ClipAsset[];
  newsletterBlurb?: ContentPiece;
  seoAssets?: ContentPiece;
  keywordAnalysis?: KeywordAnalysisResult;
  suggestions?: any;
  errors: string[];
}> {
  const episode = await storage.getEpisode(episodeId);
  if (!episode) throw new Error("Episode not found");

  let transcript = episode.transcript;

  const mediaUrl = episode.audioUrl || episode.videoUrl;

  if (!transcript && mediaUrl) {
    try {
      await storage.updateEpisode(episodeId, { transcriptStatus: "processing", processingStatus: "processing", processingProgress: 2, processingStep: "transcription" } as any);

      console.log(`[Pipeline] Fetching media for episode: ${episode.title}`);
      const audioBuffer = await fetchAudioBuffer(mediaUrl);
      console.log(`[Pipeline] Media fetched: ${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB`);

      await storage.updateEpisode(episodeId, { processingProgress: 4 } as any);

      const { splitAudioIntoChunks } = await import("./replit_integrations/audio/client");
      const chunks = await splitAudioIntoChunks(audioBuffer);
      console.log(`[Pipeline] Audio split into ${chunks.length} chunk(s) for transcription`);

      await storage.updateEpisode(episodeId, { processingProgress: 5 } as any);

      const { toFile } = await import("openai");
      const transcriptParts: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        console.log(`[Pipeline] Transcribing chunk ${i + 1}/${chunks.length} (${(chunks[i].length / 1024 / 1024).toFixed(1)}MB)`);
        const file = await toFile(chunks[i], `audio_chunk_${i}.mp3`);
        const transcriptionResult = await openai.audio.transcriptions.create({
          file,
          model: "gpt-4o-mini-transcribe",
          response_format: "json",
        });
        transcriptParts.push(transcriptionResult.text);
        const chunkProgress = 5 + Math.floor(((i + 1) / chunks.length) * 5);
        await storage.updateEpisode(episodeId, { processingProgress: chunkProgress } as any);
      }

      transcript = transcriptParts.join("\n\n");
      console.log(`[Pipeline] Transcription complete: ${transcript.length} chars`);
      await storage.updateEpisode(episodeId, {
        transcript,
        transcriptStatus: "ready",
        processingProgress: 10,
      } as any);
    } catch (err: any) {
      console.error(`[Pipeline] Transcription error:`, err.message);
      await storage.updateEpisode(episodeId, { transcriptStatus: "failed", processingStatus: "failed" } as any);
      throw new Error(`Transcription failed: ${err.message}`);
    }
  }

  if (!transcript) {
    throw new Error("No transcript or audio/video URL available for this episode");
  }

  let podcastTitle: string | undefined;
  const podcast = await storage.getPodcast(episode.podcastId);
  if (podcast) podcastTitle = podcast.title;

  const result: any = { errors: [] };

  let trendingKeywords: string[] = [];
  try {
    await storage.updateEpisode(episodeId, { processingProgress: 12, processingStep: "keywords" } as any);
    const kwAnalysis = await analyzeTranscriptKeywords(transcript, episode.title, podcastTitle);
    result.keywordAnalysis = kwAnalysis;

    trendingKeywords = kwAnalysis.topKeywords
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .map(k => k.keyword);

    const allKeywords = [
      ...trendingKeywords,
      ...kwAnalysis.longTailKeywords.map(k => k.phrase),
    ];

    await storage.updateEpisode(episodeId, {
      extractedKeywords: allKeywords,
      keywordAnalysis: JSON.stringify(kwAnalysis),
      processingProgress: 20,
    } as any);
  } catch (err: any) {
    result.errors.push(`keyword_analysis: ${err.message}`);
    await storage.updateEpisode(episodeId, { processingProgress: 20 } as any);
  }

  let progressStep = 20;
  const stepSize = Math.floor(70 / contentTypes.length);

  for (const contentType of contentTypes) {
    try {
      await storage.updateEpisode(episodeId, { processingStep: contentType } as any);
      switch (contentType) {
        case "article":
          result.article = await generateStoryFromTranscript(episodeId, transcript, episode.title, podcastTitle, trendingKeywords);
          break;
        case "blog":
          result.blog = await generateBlogPost(episodeId, transcript, episode.title, podcastTitle, trendingKeywords);
          break;
        case "social":
          result.socialPosts = await generateSocialPosts(episodeId, transcript, episode.title, podcastTitle, trendingKeywords);
          break;
        case "clips":
          result.clips = await generateClipSuggestions(episodeId, transcript, episode.title, episode.duration || undefined);
          break;
        case "newsletter":
          result.newsletterBlurb = await generateNewsletterBlurb(episodeId, transcript, episode.title, podcastTitle);
          break;
        case "seo":
          result.seoAssets = await generateSEOAssets(episodeId, transcript, episode.title, podcastTitle, trendingKeywords);
          break;
      }
      progressStep += stepSize;
      await storage.updateEpisode(episodeId, { processingProgress: Math.min(progressStep, 95) } as any);
    } catch (err: any) {
      result.errors.push(`${contentType}: ${err.message}`);
    }
  }

  try {
    result.suggestions = await generateSmartSuggestions(episodeId, transcript, episode.title);
  } catch (err: any) {
    result.errors.push(`suggestions: ${err.message}`);
  }

  await storage.updateEpisode(episodeId, {
    processingStatus: result.errors.length > 0 ? "partial" : "complete",
    processingProgress: 100,
    processingStep: null,
  } as any);

  return result;
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

  const mediaUrl = episode.audioUrl || episode.videoUrl;

  if (!transcript && mediaUrl) {
    try {
      await storage.updateEpisode(episodeId, { transcriptStatus: "processing" } as any);

      const audioBuffer = await fetchAudioBuffer(mediaUrl);
      const { splitAudioIntoChunks } = await import("./replit_integrations/audio/client");
      const chunks = await splitAudioIntoChunks(audioBuffer);

      const { toFile } = await import("openai");
      const transcriptParts: string[] = [];

      for (let i = 0; i < chunks.length; i++) {
        const file = await toFile(chunks[i], `audio_chunk_${i}.mp3`);
        const transcriptionResult = await openai.audio.transcriptions.create({
          file,
          model: "gpt-4o-mini-transcribe",
          response_format: "json",
        });
        transcriptParts.push(transcriptionResult.text);
      }

      transcript = transcriptParts.join("\n\n");
      await storage.updateEpisode(episodeId, {
        transcript,
        transcriptStatus: "ready",
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

  let trendingKeywords: string[] = [];
  try {
    const kwAnalysis = await analyzeTranscriptKeywords(transcript, episode.title, podcastTitle);
    trendingKeywords = kwAnalysis.topKeywords
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .map(k => k.keyword);

    const allKeywords = [
      ...trendingKeywords,
      ...kwAnalysis.longTailKeywords.map(k => k.phrase),
    ];

    await storage.updateEpisode(episodeId, {
      extractedKeywords: allKeywords,
      keywordAnalysis: JSON.stringify(kwAnalysis),
    } as any);
  } catch {}

  try {
    const story = await generateStoryFromTranscript(
      episodeId,
      transcript,
      episode.title,
      podcastTitle,
      trendingKeywords
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
      transcriptStatus: "ready",
    } as any);
  }

  let trendingKeywords: string[] = [];
  try {
    const kwAnalysis = await analyzeTranscriptKeywords(transcript, episode.title, podcastTitle);
    trendingKeywords = kwAnalysis.topKeywords
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .map(k => k.keyword);

    await storage.updateEpisode(episodeId, {
      extractedKeywords: [
        ...trendingKeywords,
        ...kwAnalysis.longTailKeywords.map(k => k.phrase),
      ],
      keywordAnalysis: JSON.stringify(kwAnalysis),
    } as any);
  } catch {}

  return generateStoryFromTranscript(episodeId, transcript, episode.title, podcastTitle, trendingKeywords);
}

export async function backgroundTranscribe(episodeId: string): Promise<void> {
  const episode = await storage.getEpisode(episodeId);
  if (!episode) return;

  const mediaUrl = episode.audioUrl || episode.videoUrl;
  if (!mediaUrl) return;
  if (episode.transcript) return;

  try {
    console.log(`[BG Transcribe] Starting background transcription for episode ${episodeId}`);
    await storage.updateEpisode(episodeId, {
      transcriptStatus: "processing",
      processingStatus: "processing",
      processingProgress: 5,
      processingStep: "transcription",
    } as any);

    const audioBuffer = await fetchAudioBuffer(mediaUrl);
    await storage.updateEpisode(episodeId, { processingProgress: 20 } as any);

    const { splitAudioIntoChunks } = await import("./replit_integrations/audio/client");
    const chunks = await splitAudioIntoChunks(audioBuffer);
    await storage.updateEpisode(episodeId, { processingProgress: 30 } as any);

    const { toFile } = await import("openai");
    const transcriptParts: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const file = await toFile(chunks[i], `audio_chunk_${i}.mp3`);
      const transcriptionResult = await openai.audio.transcriptions.create({
        file,
        model: "gpt-4o-mini-transcribe",
        response_format: "json",
      });
      transcriptParts.push(transcriptionResult.text);
      const progress = 30 + Math.round(((i + 1) / chunks.length) * 60);
      await storage.updateEpisode(episodeId, { processingProgress: progress } as any);
    }

    const transcript = transcriptParts.join("\n\n");
    await storage.updateEpisode(episodeId, {
      transcript,
      transcriptStatus: "ready",
      processingStatus: "transcribed",
      processingProgress: 95,
    } as any);

    console.log(`[BG Transcribe] Transcription complete for episode ${episodeId} (${transcript.length} chars)`);

    try {
      await storage.updateEpisode(episodeId, { processingStep: "keywords" } as any);
      let podcastTitle: string | undefined;
      const podcast = await storage.getPodcast(episode.podcastId);
      if (podcast) podcastTitle = podcast.title;
      const kwAnalysis = await analyzeTranscriptKeywords(transcript, episode.title, podcastTitle);
      const allKeywords = [
        ...kwAnalysis.topKeywords.sort((a, b) => b.trendingScore - a.trendingScore).map(k => k.keyword),
        ...kwAnalysis.longTailKeywords.map(k => k.phrase),
      ];
      await storage.updateEpisode(episodeId, {
        extractedKeywords: allKeywords,
        keywordAnalysis: JSON.stringify(kwAnalysis),
        processingProgress: 100,
        processingStatus: "transcribed",
        processingStep: null,
      } as any);
      console.log(`[BG Transcribe] Keyword analysis complete for episode ${episodeId}`);
    } catch (kwErr: any) {
      console.warn(`[BG Transcribe] Keyword analysis failed (non-fatal): ${kwErr.message}`);
      await storage.updateEpisode(episodeId, { processingProgress: 100, processingStep: null } as any);
    }
  } catch (err: any) {
    console.error(`[BG Transcribe] Failed for episode ${episodeId}: ${err.message}`);
    await storage.updateEpisode(episodeId, {
      transcriptStatus: "failed",
      processingStatus: "failed",
      processingProgress: 0,
    } as any);
  }
}
