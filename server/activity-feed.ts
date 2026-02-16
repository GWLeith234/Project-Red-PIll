import type { Response } from "express";

export interface Activity {
  id: string;
  type: string;
  icon: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

const BUFFER_SIZE = 100;
const buffer: Activity[] = [];
let idCounter = 0;

const sseClients: Response[] = [];

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local[0]}***@${domain}`;
}

export function addActivity(type: string, icon: string, description: string, metadata?: any) {
  const activity: Activity = {
    id: `act_${++idCounter}`,
    type,
    icon,
    description,
    timestamp: new Date(),
    metadata,
  };
  buffer.unshift(activity);
  if (buffer.length > BUFFER_SIZE) buffer.pop();

  for (const client of sseClients) {
    try {
      client.write(`event: activity\ndata: ${JSON.stringify(activity)}\n\n`);
    } catch {}
  }
}

export function getRecentActivities(count = 20): Activity[] {
  return buffer.slice(0, count);
}

export function addFeedClient(res: Response) {
  sseClients.push(res);
  res.on("close", () => {
    const idx = sseClients.indexOf(res);
    if (idx >= 0) sseClients.splice(idx, 1);
  });
}

export function trackSubscriber(email: string) {
  addActivity("subscriber", "UserPlus", `New subscriber: ${maskEmail(email)}`);
}

export function trackArticlePublished(title: string) {
  addActivity("content", "FileText", `Published: "${title}"`);
}

export function trackPushSent(count: number) {
  addActivity("push", "Bell", `Push notification delivered to ${count} subscribers`);
}

export function trackCommunityPost(name: string) {
  addActivity("community", "MessageSquare", `New community post by ${name}`);
}

export function trackPollVote(question: string) {
  addActivity("poll", "BarChart", `Vote cast on: "${question}"`);
}

export function trackEventCreated(title: string) {
  addActivity("event", "Calendar", `New event: "${title}"`);
}

export function trackNpsSubmission(score: number) {
  addActivity("feedback", "Star", `NPS score received: ${score}/10`);
}
