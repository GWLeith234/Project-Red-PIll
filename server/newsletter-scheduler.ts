import { storage } from "./storage";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

function computeNextRun(cadence: string, dayOfWeek: number | null, dayOfMonth: number | null, sendHour: number | null, sendMinute: number | null): Date {
  const now = new Date();
  const hour = sendHour ?? 9;
  const minute = sendMinute ?? 0;

  if (cadence === "daily") {
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    return next;
  }

  if (cadence === "weekly") {
    const dow = dayOfWeek ?? 1;
    const next = new Date(now);
    next.setHours(hour, minute, 0, 0);
    const currentDow = next.getDay();
    let daysUntil = dow - currentDow;
    if (daysUntil < 0) daysUntil += 7;
    if (daysUntil === 0 && next <= now) daysUntil = 7;
    next.setDate(next.getDate() + daysUntil);
    return next;
  }

  const dom = dayOfMonth ?? 1;
  const next = new Date(now.getFullYear(), now.getMonth(), dom, hour, minute, 0, 0);
  if (next <= now) {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

async function checkAndRunSchedules() {
  try {
    const schedules = await storage.getActiveNewsletterSchedules();
    const now = new Date();

    for (const schedule of schedules) {
      if (!schedule.nextRunAt) {
        const nextRun = computeNextRun(schedule.cadence, schedule.dayOfWeek, schedule.dayOfMonth, schedule.sendHour, schedule.sendMinute);
        await storage.updateNewsletterSchedule(schedule.id, { nextRunAt: nextRun });
        continue;
      }

      if (new Date(schedule.nextRunAt) <= now) {
        console.log(`[newsletter-scheduler] Running schedule: ${schedule.name} (${schedule.cadence})`);

        try {
          const { generateNewsletterByCadence } = await import("./ai-content-agent");
          const newsletter = await generateNewsletterByCadence(schedule.cadence, schedule.contentTypes || undefined);

          const run = await storage.createNewsletterRun({
            title: newsletter.title,
            period: newsletter.period,
            cadence: schedule.cadence,
            body: newsletter.body,
            contentPieceIds: newsletter.contentPieceIds,
            scheduleId: schedule.id,
            status: schedule.autoSend ? "sending" : "draft",
          });

          if (schedule.autoSend) {
            try {
              await storage.createOutboundCampaign({
                name: run.title,
                type: "email",
                audience: "subscribers",
                status: "draft",
                subject: run.title,
                body: run.body || "",
              });
              await storage.updateNewsletterRun(run.id, { status: "sent", sentAt: new Date() });
            } catch (sendErr) {
              console.error(`[newsletter-scheduler] Failed to auto-send for schedule ${schedule.id}:`, sendErr);
              await storage.updateNewsletterRun(run.id, { status: "draft" });
            }
          }

          const nextRun = computeNextRun(schedule.cadence, schedule.dayOfWeek, schedule.dayOfMonth, schedule.sendHour, schedule.sendMinute);
          await storage.updateNewsletterSchedule(schedule.id, {
            lastRunAt: now,
            nextRunAt: nextRun,
          });

          console.log(`[newsletter-scheduler] Generated newsletter: "${newsletter.title}" (next run: ${nextRun.toISOString()})`);
        } catch (err) {
          console.error(`[newsletter-scheduler] Failed to generate newsletter for schedule ${schedule.id}:`, err);
          const nextRun = computeNextRun(schedule.cadence, schedule.dayOfWeek, schedule.dayOfMonth, schedule.sendHour, schedule.sendMinute);
          await storage.updateNewsletterSchedule(schedule.id, { nextRunAt: nextRun });
        }
      }
    }
  } catch (err) {
    console.error("[newsletter-scheduler] Error checking schedules:", err);
  }
}

export function startNewsletterScheduler() {
  console.log("[newsletter-scheduler] Starting newsletter scheduler (checking every 5 minutes)");
  checkAndRunSchedules();
  setInterval(checkAndRunSchedules, CHECK_INTERVAL_MS);
}
