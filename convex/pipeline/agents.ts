import { internalAction } from "../_generated/server";
import { v } from "convex/values";

export const wakeAgents = internalAction({
  args: {
    role: v.string(),
    count: v.number(),
  },
  handler: async (_ctx, args) => {
    const OPENCLAW_WEBHOOK_URL = process.env.OPENCLAW_WEBHOOK_URL;
    const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY;

    if (!OPENCLAW_WEBHOOK_URL) {
      console.log(
        `[agents] No OPENCLAW_WEBHOOK_URL set. ${args.count} ${args.role} jobs waiting.`
      );
      return;
    }

    try {
      const response = await fetch(OPENCLAW_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(OPENCLAW_API_KEY
            ? { Authorization: `Bearer ${OPENCLAW_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({
          event: "jobs_available",
          agentRole: args.role,
          jobCount: args.count,
          claimUrl: `${process.env.CONVEX_SITE_URL}/api/agent/claim`,
        }),
      });

      if (!response.ok) {
        console.error(
          `[agents] OpenClaw webhook failed: ${response.status} ${response.statusText}`
        );
      }
    } catch (error) {
      console.error("[agents] OpenClaw webhook error:", error);
    }
  },
});
