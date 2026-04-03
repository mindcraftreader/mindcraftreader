import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

async function postSlack(channel: string, payload: Record<string, unknown>) {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    console.log(`[notify] SLACK_BOT_TOKEN not set, skipping: ${channel}`);
    return;
  }

  try {
    const body: Record<string, unknown> = { channel, ...payload };
    const res = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error(`[notify] Slack error (${channel}): ${data.error}`);
    }
  } catch (error) {
    console.error(`[notify] Slack post failed (${channel}):`, error);
  }
}

export const requestApproval = internalAction({
  args: { pipelineRunId: v.id("pipelineRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.runQuery(api.pipeline.runs.get, {
      id: args.pipelineRunId,
    });
    if (!run) return;

    const market = await ctx.runQuery(api.markets.getBySlug, { slug: "" });
    // We don't have the slug easily here, but the run has marketId

    const details = [
      run.previewUrl ? `*Preview:* ${run.previewUrl}` : null,
      run.assembledPdfUrl ? `*PDF:* ${run.assembledPdfUrl}` : null,
      `*Sections:* ${run.sectionsTotal}`,
      run.revisionCount > 0
        ? `*Revision round:* ${run.revisionCount}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    await postSlack("#newsroom-publish", {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `${run.issueDate} — READY FOR APPROVAL`,
          },
        },
        {
          type: "section",
          text: { type: "mrkdwn", text: details },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "Approve" },
              style: "primary",
              action_id: "approve_pipeline",
              value: args.pipelineRunId,
            },
            {
              type: "button",
              text: { type: "plain_text", text: "Reject" },
              style: "danger",
              action_id: "reject_pipeline",
              value: args.pipelineRunId,
            },
          ],
        },
      ],
    });
  },
});

export const stageTransition = internalAction({
  args: {
    pipelineRunId: v.id("pipelineRuns"),
    marketSlug: v.string(),
    fromStage: v.string(),
    toStage: v.string(),
    detail: v.optional(v.string()),
  },
  handler: async (_ctx, args) => {
    const msg = args.detail
      ? `*${args.marketSlug}* ${args.fromStage} → *${args.toStage}* — ${args.detail}`
      : `*${args.marketSlug}* ${args.fromStage} → *${args.toStage}*`;

    await postSlack("#newsroom-pipeline", { text: msg });
  },
});

export const pipelineComplete = internalAction({
  args: { pipelineRunId: v.id("pipelineRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.runQuery(api.pipeline.runs.get, {
      id: args.pipelineRunId,
    });
    if (!run) return;

    await postSlack("#newsroom-publish", {
      text: `✓ *${run.issueDate}* — Distribution complete. All platforms delivered.`,
    });
  },
});

export const jobExhausted = internalAction({
  args: {
    pipelineRunId: v.id("pipelineRuns"),
    sectionJobId: v.id("sectionJobs"),
  },
  handler: async (ctx, args) => {
    const job = await ctx.runQuery(api.pipeline.jobs.get, {
      jobId: args.sectionJobId,
    });
    if (!job) return;

    await postSlack("#newsroom-alerts", {
      text: `ALERT: *${job.agentRole}* failed ${job.maxAttempts}x on *${job.sectionType}/${job.phase}* for ${job.issueDate}.\nLast error: ${job.error ?? "unknown"}\nManual action needed.`,
    });
  },
});

export const weeklyKickoff = internalAction({
  args: { marketCount: v.number(), issueDate: v.string() },
  handler: async (_ctx, args) => {
    await postSlack("#newsroom-pipeline", {
      text: `Pipeline kicked off for *${args.marketCount} markets*, issue date ${args.issueDate}. Research jobs queued.`,
    });
  },
});
