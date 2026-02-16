import { claude } from "./ai-providers";
import { storage } from "./storage";
import type { CommercialLead, CommercialOrder, CampaignPerformance } from "@shared/schema";

function extractJSON(text: string): any {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    return JSON.parse(objMatch[0]);
  }
  return JSON.parse(text);
}

export async function scoreLeads(leads: CommercialLead[]) {
  if (!leads.length) return [];

  try {
    const leadsData = leads.map(l => ({
      id: l.id,
      companyName: l.companyName,
      source: l.source,
      pipelineStage: l.pipelineStage,
      estimatedValue: l.estimatedValue,
      lastActivityAt: l.lastActivityAt,
      contactName: l.contactName,
      contactEmail: l.contactEmail,
    }));

    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `You are a sales intelligence AI for a conservative media advertising platform targeting an engaged audience of news readers and podcast listeners. Score each lead 0-100 based on: company size indicators, source quality (inbound > referral > cold_outreach > ai_generated), engagement recency, pipeline velocity, and estimated deal value.

Here are the leads to score:
${JSON.stringify(leadsData, null, 2)}

Return ONLY valid JSON as an array: [{ "leadId": "...", "score": 0-100, "reasoning": "..." }]`
      }]
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const results = extractJSON(text) as Array<{ leadId: string; score: number; reasoning: string }>;

    for (const result of results) {
      await storage.updateCommercialLead(result.leadId, { aiScore: result.score });
    }

    return results;
  } catch (error) {
    console.error("Error scoring leads:", error);
    return leads.map(l => ({
      leadId: l.id,
      score: 50,
      reasoning: "Unable to generate AI score at this time"
    }));
  }
}

export async function suggestUpsells(orders: CommercialOrder[]) {
  if (!orders.length) return [];

  try {
    const ordersWithPerf = await Promise.all(
      orders.map(async (order) => {
        const perfData = await storage.getCampaignPerformance(order.id);
        return {
          orderId: order.id,
          orderName: order.orderName,
          totalValue: order.totalValue,
          products: order.products,
          status: order.status,
          performance: perfData.map(p => ({
            campaignName: p.campaignName,
            impressions: p.impressions,
            clicks: p.clicks,
            ctr: p.ctr,
            roas: p.roas,
            spend: p.spend,
            revenue: p.revenue,
          })),
        };
      })
    );

    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `You are a sales intelligence AI for a conservative media advertising platform targeting an engaged audience of news readers and podcast listeners. Analyze these advertising orders and their performance. For each, determine upsell opportunities. Campaigns with CTR > 2% should increase spend. High impressions but low clicks need creative refresh. Single-product clients should get bundle offers.

Orders and performance data:
${JSON.stringify(ordersWithPerf, null, 2)}

Return ONLY valid JSON as an array: [{ "orderId": "...", "opportunity": "...", "suggestedAction": "...", "estimatedAdditionalRevenue": 0 }]`
      }]
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return extractJSON(text) as Array<{
      orderId: string;
      opportunity: string;
      suggestedAction: string;
      estimatedAdditionalRevenue: number;
    }>;
  } catch (error) {
    console.error("Error suggesting upsells:", error);
    return orders.map(o => ({
      orderId: o.id,
      opportunity: "Unable to analyze at this time",
      suggestedAction: "Review manually",
      estimatedAdditionalRevenue: 0
    }));
  }
}

export async function predictChurn(clients: CommercialLead[]) {
  if (!clients.length) return [];

  try {
    const clientsData = clients.map(c => ({
      id: c.id,
      companyName: c.companyName,
      pipelineStage: c.pipelineStage,
      estimatedValue: c.estimatedValue,
      lastActivityAt: c.lastActivityAt,
      source: c.source,
      notes: c.notes,
    }));

    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      messages: [{
        role: "user",
        content: `You are a sales intelligence AI for a conservative media advertising platform targeting an engaged audience of news readers and podcast listeners. Predict churn risk (high/medium/low) for each client based on activity recency, deal value trends, and communication frequency.

Client data:
${JSON.stringify(clientsData, null, 2)}

Return ONLY valid JSON as an array: [{ "leadId": "...", "churnRisk": "high|medium|low", "reasoning": "...", "retentionAction": "..." }]`
      }]
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const results = extractJSON(text) as Array<{
      leadId: string;
      churnRisk: string;
      reasoning: string;
      retentionAction: string;
    }>;

    for (const result of results) {
      await storage.updateCommercialLead(result.leadId, {
        aiRecommendation: result.retentionAction,
      });
    }

    return results;
  } catch (error) {
    console.error("Error predicting churn:", error);
    return clients.map(c => ({
      leadId: c.id,
      churnRisk: "medium" as const,
      reasoning: "Unable to generate churn prediction at this time",
      retentionAction: "Schedule a check-in call"
    }));
  }
}

export async function generateDealInsights(lead: CommercialLead) {
  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are a sales intelligence AI for a conservative media advertising platform targeting an engaged audience of news readers and podcast listeners. Provide deep analysis for this lead/deal.

Lead data:
${JSON.stringify({
  id: lead.id,
  companyName: lead.companyName,
  contactName: lead.contactName,
  contactEmail: lead.contactEmail,
  source: lead.source,
  pipelineStage: lead.pipelineStage,
  pipelineType: lead.pipelineType,
  estimatedValue: lead.estimatedValue,
  lastActivityAt: lead.lastActivityAt,
  notes: lead.notes,
}, null, 2)}

Return ONLY valid JSON: { "closeProb": 0-100, "nextAction": "...", "proposalSuggestion": "...", "positioning": "..." }`
      }]
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return extractJSON(text) as {
      closeProb: number;
      nextAction: string;
      proposalSuggestion: string;
      positioning: string;
    };
  } catch (error) {
    console.error("Error generating deal insights:", error);
    return {
      closeProb: 50,
      nextAction: "Schedule a discovery call to learn more about their advertising needs",
      proposalSuggestion: "Prepare a standard media kit with audience demographics",
      positioning: "Position as a premium conservative media platform with highly engaged readers and listeners"
    };
  }
}

export async function autoPromptAdvertiser(order: CommercialOrder, perfData: CampaignPerformance[]) {
  const highPerformers = perfData.filter(p =>
    (p.ctr && p.ctr > 2) || (p.roas && p.roas > 3)
  );

  if (highPerformers.length === 0) {
    return {
      shouldPrompt: false,
      message: "",
      suggestedIncrease: 0,
      projections: null
    };
  }

  try {
    const response = await claude.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `You are a sales intelligence AI for a conservative media advertising platform targeting an engaged audience of news readers and podcast listeners. Generate a personalized upsell message for an advertiser whose campaigns are performing well.

Order: ${JSON.stringify({
  id: order.id,
  orderName: order.orderName,
  totalValue: order.totalValue,
  products: order.products,
}, null, 2)}

High-performing campaigns:
${JSON.stringify(highPerformers.map(p => ({
  campaignName: p.campaignName,
  impressions: p.impressions,
  clicks: p.clicks,
  ctr: p.ctr,
  roas: p.roas,
  spend: p.spend,
  revenue: p.revenue,
})), null, 2)}

Return ONLY valid JSON: { "message": "personalized upsell message", "suggestedIncrease": dollar_amount, "projections": { "additionalImpressions": 0, "projectedCTR": 0, "projectedRevenue": 0 } }`
      }]
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const result = extractJSON(text) as {
      message: string;
      suggestedIncrease: number;
      projections: any;
    };

    return {
      shouldPrompt: true,
      message: result.message,
      suggestedIncrease: result.suggestedIncrease,
      projections: result.projections
    };
  } catch (error) {
    console.error("Error generating advertiser prompt:", error);
    return {
      shouldPrompt: true,
      message: `Your campaigns on ${order.orderName} are performing exceptionally well! Consider increasing your investment to reach even more of our engaged audience.`,
      suggestedIncrease: Math.round((order.totalValue || 0) * 0.25),
      projections: null
    };
  }
}
