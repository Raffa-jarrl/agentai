/**
 * Inngest client for serverless background jobs (Phase 2+).
 * For Phase 1, jobs are handled via simple webhooks + cron endpoints.
 *
 * To enable: install inngest, set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY.
 * See https://www.inngest.com/ for setup.
 */

let Inngest: any = null;
try {
  Inngest = require("inngest").Inngest;
} catch {
  // Inngest not installed — Phase 2 feature
}

export const inngest = Inngest ? new Inngest({ id: "agentai" }) : null;

// Placeholder: implement job functions once Inngest is installed
// export const exampleJob = inngest?.createFunction(
//   { id: "example-job", concurrency: { limit: 10 } },
//   { event: "app/example" },
//   async ({ event, step }: any) => {
//     await step.run("log", async () => console.log("Job", event));
//     return { ok: true };
//   },
// );

/**
 * Production jobs to implement:
 *
 * export const generateWeeklyReport = inngest.createFunction(
 *   { id: "generate-weekly-report", concurrency: { limit: 50 } },
 *   { cron: "0 8 * * 0" }, // Sunday 08:00 UTC
 *   async ({ step }) => {
 *     const agents = await step.run("fetch-agents", async () => {
 *       const svc = createServiceClient();
 *       const { data } = await svc.from("agents").select("id, whatsapp_business_number");
 *       return data ?? [];
 *     });
 *
 *     for (const agent of agents) {
 *       await step.run(`report-${agent.id}`, async () => {
 *         const report = await generateReportForAgent(agent.id);
 *         // Send WhatsApp + push notification
 *       });
 *     }
 *   },
 * );
 *
 * export const cleanupPhotos = inngest.createFunction(
 *   { id: "cleanup-old-photos" },
 *   { cron: "0 2 * * 0" }, // Weekly Sunday 02:00
 *   async ({ step }) => {
 *     const agents = await step.run("fetch-agents", async () => {
 *       const svc = createServiceClient();
 *       const { data } = await svc.from("agents").select("id");
 *       return data ?? [];
 *     });
 *     for (const agent of agents) {
 *       await step.run(`cleanup-${agent.id}`, async () => {
 *         await cleanupOldPhotos(agent.id);
 *       });
 *     }
 *   },
 * );
 */
