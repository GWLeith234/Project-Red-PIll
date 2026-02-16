import { storage } from "./storage";
import type { Subscriber } from "@shared/schema";

export interface SegmentationSummary {
  total: number;
  new: number;
  engaged: number;
  active: number;
  atRisk: number;
  churned: number;
}

type EngagementStage = "new" | "engaged" | "active" | "at_risk" | "churned";

function classifySubscriber(subscriber: Subscriber, now: Date): EngagementStage {
  const createdAt = subscriber.createdAt ? new Date(subscriber.createdAt) : null;
  const lastEmailOpenedAt = subscriber.lastEmailOpenedAt ? new Date(subscriber.lastEmailOpenedAt) : null;
  const lastPushClickedAt = subscriber.lastPushClickedAt ? new Date(subscriber.lastPushClickedAt) : null;
  const lastVisitAt = subscriber.lastVisitAt ? new Date(subscriber.lastVisitAt) : null;
  const updatedAt = subscriber.updatedAt ? new Date(subscriber.updatedAt) : null;
  const emailsOpenedCount = subscriber.emailsOpenedCount ?? 0;
  const visitCount = subscriber.visitCount ?? 0;

  const msPerDay = 86_400_000;
  const daysSinceCreated = createdAt ? (now.getTime() - createdAt.getTime()) / msPerDay : Infinity;

  if (daysSinceCreated <= 7) {
    return "new";
  }

  const latestActivity = [lastEmailOpenedAt, lastPushClickedAt, lastVisitAt, updatedAt]
    .filter((d): d is Date => d !== null)
    .reduce<Date | null>((latest, d) => (!latest || d > latest ? d : latest), null);

  const daysSinceAnyActivity = latestActivity
    ? (now.getTime() - latestActivity.getTime()) / msPerDay
    : Infinity;

  if (daysSinceAnyActivity >= 60) {
    return "churned";
  }

  const daysSinceEmailOpen = lastEmailOpenedAt
    ? (now.getTime() - lastEmailOpenedAt.getTime()) / msPerDay
    : Infinity;
  const daysSinceVisit = lastVisitAt
    ? (now.getTime() - lastVisitAt.getTime()) / msPerDay
    : Infinity;

  if (daysSinceEmailOpen >= 14 && daysSinceVisit >= 14) {
    return "at_risk";
  }

  if (emailsOpenedCount >= 3 && daysSinceAnyActivity <= 30) {
    return "active";
  }

  if (emailsOpenedCount >= 3 || visitCount >= 5) {
    return "engaged";
  }

  return "active";
}

export async function runSegmentation(): Promise<SegmentationSummary> {
  const subscribers = await storage.getSubscribers();
  const now = new Date();

  const summary: SegmentationSummary = {
    total: subscribers.length,
    new: 0,
    engaged: 0,
    active: 0,
    atRisk: 0,
    churned: 0,
  };

  const updates: Promise<unknown>[] = [];

  for (const subscriber of subscribers) {
    const stage = classifySubscriber(subscriber, now);

    switch (stage) {
      case "new": summary.new++; break;
      case "engaged": summary.engaged++; break;
      case "active": summary.active++; break;
      case "at_risk": summary.atRisk++; break;
      case "churned": summary.churned++; break;
    }

    if (subscriber.engagementStage !== stage) {
      updates.push(storage.updateSubscriber(subscriber.id, { engagementStage: stage }));
    }
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    await Promise.all(updates.slice(i, i + BATCH_SIZE));
  }

  return summary;
}
