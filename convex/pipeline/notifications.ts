import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

async function postSlack(
  webhookEnvVar: string,
  payload: Record<string, unknown>
) {
  const url = process.env[webhookEnvVar];
  if (!url) {
    console.log(`[notify] ${webhookEnvVar} not set, skipping Slack notification`);
    return;
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(`[notify] Slack post failed (${webhookEnvVar}):`, error);
  }
}

export const requestApproval = internalAction({
  args: { pipelineRunId: v.id("pipelineRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.runQuery(api.pipeline.runs.get, {
      id: args.pipelineRunId,
    });
    if (!run) return;

    const market = await ctx.runQuery(api.markets.getBySlug, {
      slug: "",
    });

    await postSlack("SLACK_PUBLISH_WEBHOOK", {
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
          text: {
            type: "mrkdwn",
            text: [
              run.previewUrl ? `*Preview:* ${run.previewUrl}` : null,
              run.assembledPdfUrl ? `*PDF:* ${run.assembledPdfUrl}` : null,
              `*Sections:* ${run.sectionsTotal}`,
              run.revisionCount > 0
                ? `*Revision round:* ${run.revisionCount}`
                : null,
            ]
              .filter(Boolean)
              .join("\n"),
          },
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

export const pipelineComplete = internalAction({
  args: { pipelineRunId: v.id("pipelineRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.runQuery(api.pipeline.runs.get, {
      id: args.pipelineRunId,
    });
    if (!run) return;

    await postSlack("SLACK_PUBLISH_WEBHOOK", {
      text: `${run.issueDate} — Distribution complete. All platforms delivered.`,
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

    await postSlack("SLACK_ALERTS_WEBHOOK", {
      text: `ALERT: ${job.agentRole} failed ${job.maxAttempts}x on ${job.sectionType}/${job.phase} for ${job.issueDate}. Last error: ${job.error ?? "unknown"}. Manual action needed.`,
    });
  },
});
