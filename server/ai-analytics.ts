import { claude } from "./ai-providers";
import { db } from "./storage";
import { pageAnalytics, npsResponses, userFeedback, aiInsightsCache } from "@shared/schema";
import { sql, desc, eq } from "drizzle-orm";

export async function generateAnalyticsInsights(period: "7d" | "30d" | "90d" = "30d") {
  const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [pvResult, uvResult, avgDur, bounceResult, topPagesResult, deviceResult, referrerResult, npsResult] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) as count FROM page_analytics WHERE created_at >= ${startDate}`),
    db.execute(sql`SELECT COUNT(DISTINCT visitor_id) as count FROM page_analytics WHERE created_at >= ${startDate} AND visitor_id IS NOT NULL`),
    db.execute(sql`SELECT COALESCE(AVG(time_on_page), 0) as avg FROM page_analytics WHERE created_at >= ${startDate} AND time_on_page IS NOT NULL`),
    db.execute(sql`
      WITH total AS (SELECT COUNT(DISTINCT session_id) as c FROM page_analytics WHERE created_at >= ${startDate}),
      bounced AS (SELECT COUNT(*) as c FROM (SELECT session_id FROM page_analytics WHERE created_at >= ${startDate} GROUP BY session_id HAVING COUNT(*) = 1) sub)
      SELECT CASE WHEN total.c > 0 THEN ROUND(100.0 * bounced.c / total.c, 1) ELSE 0 END as rate FROM total, bounced
    `),
    db.execute(sql`SELECT url, COUNT(*) as views FROM page_analytics WHERE created_at >= ${startDate} GROUP BY url ORDER BY views DESC LIMIT 10`),
    db.execute(sql`SELECT device_type, COUNT(*) as count FROM page_analytics WHERE created_at >= ${startDate} GROUP BY device_type ORDER BY count DESC`),
    db.execute(sql`SELECT referrer, COUNT(*) as count FROM page_analytics WHERE created_at >= ${startDate} GROUP BY referrer ORDER BY count DESC LIMIT 10`),
    db.execute(sql`SELECT score FROM nps_responses WHERE created_at >= ${startDate}`),
  ]);

  const totalPageviews = Number(pvResult.rows[0]?.count || 0);
  const uniqueVisitors = Number(uvResult.rows[0]?.count || 0);
  const avgSessionDuration = Math.round(Number(avgDur.rows[0]?.avg || 0));
  const bounceRate = Number(bounceResult.rows[0]?.rate || 0);
  const topPages = (topPagesResult.rows as any[]).map(r => `${r.url}: ${r.views} views`).join(", ");
  const devices = (deviceResult.rows as any[]).map(r => `${r.device_type}: ${r.count}`).join(", ");
  const referrers = (referrerResult.rows as any[]).map(r => `${r.referrer || 'direct'}: ${r.count}`).join(", ");

  const npsScores = (npsResult.rows as any[]).map(r => Number(r.score));
  const promoters = npsScores.filter(s => s >= 9).length;
  const detractors = npsScores.filter(s => s <= 6).length;
  const npsScore = npsScores.length > 0 ? Math.round(((promoters - detractors) / npsScores.length) * 100) : null;

  const dataPrompt = `Analytics data for the last ${days} days:
- Total Pageviews: ${totalPageviews}
- Unique Visitors: ${uniqueVisitors}
- Average Session Duration: ${avgSessionDuration} seconds
- Bounce Rate: ${bounceRate}%
- Top Pages: ${topPages || "No data"}
- Device Mix: ${devices || "No data"}
- Top Referrers: ${referrers || "No data"}
- NPS Score: ${npsScore !== null ? npsScore : "No NPS data"}
- NPS Responses: ${npsScores.length}`;

  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `You are an analytics expert for a conservative media platform. Analyze this data and provide:
1) Three key insights about audience behavior
2) Two concerning trends that need attention
3) Three actionable recommendations to grow engagement

Be specific with numbers and percentages. Return ONLY valid JSON in this format:
{"insights":["...","...","..."],"concerns":["...","..."],"recommendations":["...","...","..."]}

${dataPrompt}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");
  return JSON.parse(jsonMatch[0]);
}

export async function analyzeContentPerformance(articleIds?: string[]) {
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const topContent = await db.execute(sql`
    SELECT cp.title, cp.type, cp.author, COUNT(pa.id) as views, COALESCE(AVG(pa.time_on_page), 0) as avg_time
    FROM content_pieces cp
    LEFT JOIN page_analytics pa ON pa.url LIKE '%' || cp.id || '%' AND pa.created_at >= ${startDate}
    GROUP BY cp.id, cp.title, cp.type, cp.author
    ORDER BY views DESC LIMIT 20
  `);

  const contentData = (topContent.rows as any[]).map(r =>
    `"${r.title}" (${r.type}, by ${r.author || "unknown"}): ${r.views} views, avg ${Math.round(Number(r.avg_time))}s`
  ).join("\n");

  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Analyze the performance of these content pieces from a conservative media platform. Identify which topics, formats, and publish times perform best. Suggest 3 content ideas that would likely perform well based on these patterns.

Return ONLY valid JSON: {"topPerformers":["..."],"patterns":["..."],"suggestions":["..."]}

Content data:
${contentData || "No content data available"}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");
  return JSON.parse(jsonMatch[0]);
}

export async function analyzeFeedbackSentiment(feedbackTexts: { id: string; text: string; type: "nps" | "feedback" }[]) {
  if (feedbackTexts.length === 0) return { items: [], summary: "No feedback to analyze" };

  const textsForAI = feedbackTexts.map((f, i) => `[${i}] ${f.text}`).join("\n");

  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1500,
    messages: [{
      role: "user",
      content: `Classify each piece of feedback as positive, neutral, or negative. Extract the key theme (content quality, site speed, missing feature, etc.). Summarize overall sentiment trends.

Return ONLY valid JSON: {"items":[{"index":0,"sentiment":"positive","theme":"content quality"}],"summary":"..."}

Feedback:
${textsForAI}`,
    }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to parse AI response");
  const parsed = JSON.parse(jsonMatch[0]);

  for (const item of parsed.items || []) {
    const original = feedbackTexts[item.index];
    if (!original) continue;
    if (original.type === "nps") {
      await db.update(npsResponses).set({ sentiment: item.sentiment }).where(eq(npsResponses.id, original.id));
    } else {
      await db.update(userFeedback).set({ sentiment: item.sentiment }).where(eq(userFeedback.id, original.id));
    }
  }

  return parsed;
}

export async function generateWeeklyDigest() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [thisWeek, lastWeek, topPages, newSubs, npsData] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) as pv, COUNT(DISTINCT visitor_id) as uv FROM page_analytics WHERE created_at >= ${weekAgo}`),
    db.execute(sql`SELECT COUNT(*) as pv, COUNT(DISTINCT visitor_id) as uv FROM page_analytics WHERE created_at >= ${twoWeeksAgo} AND created_at < ${weekAgo}`),
    db.execute(sql`SELECT url, COUNT(*) as views FROM page_analytics WHERE created_at >= ${weekAgo} GROUP BY url ORDER BY views DESC LIMIT 5`),
    db.execute(sql`SELECT COUNT(*) as count FROM subscribers WHERE created_at >= ${weekAgo}`),
    db.execute(sql`SELECT score FROM nps_responses WHERE created_at >= ${weekAgo}`),
  ]);

  const currentPV = Number(thisWeek.rows[0]?.pv || 0);
  const lastPV = Number(lastWeek.rows[0]?.pv || 0);
  const pvChange = lastPV > 0 ? Math.round(((currentPV - lastPV) / lastPV) * 100) : 0;
  const currentUV = Number(thisWeek.rows[0]?.uv || 0);
  const lastUV = Number(lastWeek.rows[0]?.uv || 0);
  const uvChange = lastUV > 0 ? Math.round(((currentUV - lastUV) / lastUV) * 100) : 0;
  const topPagesStr = (topPages.rows as any[]).map(r => `${r.url}: ${r.views} views`).join(", ");
  const subs = Number(newSubs.rows[0]?.count || 0);

  const npsScores = (npsData.rows as any[]).map(r => Number(r.score));
  const promoters = npsScores.filter(s => s >= 9).length;
  const detractors = npsScores.filter(s => s <= 6).length;
  const npsScore = npsScores.length > 0 ? Math.round(((promoters - detractors) / npsScores.length) * 100) : null;

  const response = await claude.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1000,
    messages: [{
      role: "user",
      content: `Write a concise weekly analytics digest for the platform owner. Include: traffic summary with week-over-week change, top performing content, audience growth, NPS movement, and one key recommendation. Format as a brief executive summary, 3-4 paragraphs. No markdown headers or bullets — just clean paragraphs.

Data:
- This week: ${currentPV} pageviews (${pvChange > 0 ? "+" : ""}${pvChange}% WoW), ${currentUV} unique visitors (${uvChange > 0 ? "+" : ""}${uvChange}% WoW)
- Top pages: ${topPagesStr || "No data"}
- New subscribers: ${subs}
- NPS: ${npsScore !== null ? npsScore : "No data"} (${npsScores.length} responses)`,
    }],
  });

  const digest = response.content[0].type === "text" ? response.content[0].text : "";
  return { digest, generatedAt: new Date() };
}

export async function getCachedInsight(insightType: string, maxAgeHours = 24) {
  const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
  const result = await db.execute(sql`
    SELECT * FROM ai_insights_cache 
    WHERE insight_type = ${insightType} AND generated_at >= ${cutoff}
    ORDER BY generated_at DESC LIMIT 1
  `);
  return result.rows[0] || null;
}

export async function cacheInsight(insightType: string, data: any) {
  await db.insert(aiInsightsCache).values({ insightType, data });
}
