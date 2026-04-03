import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const get = query({
  args: { jobId: v.id("sectionJobs") },
  handler: async (ctx, args) => ctx.db.get(args.jobId),
});

export const claim = mutation({
  args: {
    agentRole: v.string(),
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("sectionJobs")
      .withIndex("by_status_role", (q) =>
        q.eq("status", "pending").eq("agentRole", args.agentRole)
      )
      .first();

    if (!pending) return null;

    const now = Date.now();
    await ctx.db.patch(pending._id, {
      status: "claimed",
      agentId: args.agentId,
      claimedAt: now,
      heartbeatAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("agentEvents", {
      pipelineRunId: pending.pipelineRunId,
      sectionJobId: pending._id,
      eventType: "job.claimed",
      agentRole: args.agentRole,
      agentId: args.agentId,
      issueDate: pending.issueDate,
      summary: `${args.agentRole} claimed ${pending.sectionType}/${pending.phase}`,
      createdAt: now,
    });

    return {
      jobId: pending._id,
      pipelineRunId: pending.pipelineRunId,
      marketId: pending.marketId,
      issueDate: pending.issueDate,
      sectionType: pending.sectionType,
      phase: pending.phase,
      inputData: pending.inputData,
      revisionNotes: pending.revisionNotes,
      attempt: pending.attempt,
      timeoutMs: pending.timeoutMs,
    };
  },
});

export const heartbeat = mutation({
  args: {
    jobId: v.id("sectionJobs"),
    agentId: v.string(),
    status: v.optional(v.union(v.literal("running"), v.literal("claimed"))),
    progress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    if (job.agentId !== args.agentId) throw new Error("Agent mismatch");
    if (job.status !== "claimed" && job.status !== "running") {
      throw new Error(`Job in unexpected state: ${job.status}`);
    }

    const now = Date.now();
    const patch: Record<string, unknown> = {
      heartbeatAt: now,
      updatedAt: now,
    };

    if (args.status === "running" && job.status === "claimed") {
      patch.status = "running";
      patch.startedAt = now;
    }

    await ctx.db.patch(args.jobId, patch);
    return { ok: true };
  },
});

export const complete = mutation({
  args: {
    jobId: v.id("sectionJobs"),
    agentId: v.string(),
    outputData: v.optional(v.string()),
    outputHtml: v.optional(v.string()),
    confidenceScore: v.optional(v.number()),
    editIssues: v.optional(v.string()),
    wordCount: v.optional(v.number()),
    assembledHtml: v.optional(v.string()),
    previewUrl: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    if (job.agentId !== args.agentId) throw new Error("Agent mismatch");
    if (job.status !== "claimed" && job.status !== "running") {
      throw new Error(`Cannot complete job in state: ${job.status}`);
    }

    const now = Date.now();
    await ctx.db.patch(args.jobId, {
      status: "complete",
      completedAt: now,
      outputData: args.outputData,
      outputHtml: args.outputHtml,
      confidenceScore: args.confidenceScore,
      editIssues: args.editIssues,
      wordCount: args.wordCount,
      updatedAt: now,
    });

    const run = await ctx.db.get(job.pipelineRunId);
    if (!run) return;

    // Handle assembly completion
    if (job.phase === "assembly") {
      await ctx.db.patch(run._id, {
        stage: "pending_approval",
        assembledHtml: args.assembledHtml,
        assembledPdfUrl: args.pdfUrl,
        previewUrl: args.previewUrl,
        approvalRequestedAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("agentEvents", {
        pipelineRunId: run._id,
        eventType: "pipeline.pending_approval",
        issueDate: run.issueDate,
        summary: "Assembly complete, awaiting approval",
        createdAt: now,
      });

      await ctx.scheduler.runAfter(
        0,
        internal.pipeline.notifications.requestApproval,
        { pipelineRunId: run._id }
      );
      return;
    }

    // Handle distribution completion
    if (job.phase === "distribution") {
      await ctx.db.patch(run._id, {
        stage: "complete",
        completedAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("agentEvents", {
        pipelineRunId: run._id,
        eventType: "pipeline.completed",
        issueDate: run.issueDate,
        summary: "Distribution complete",
        createdAt: now,
      });

      await ctx.scheduler.runAfter(
        0,
        internal.pipeline.notifications.pipelineComplete,
        { pipelineRunId: run._id }
      );
      return;
    }

    // Update phase counter
    const counterMap: Record<string, string> = {
      research: "researchComplete",
      writing: "writingComplete",
      editing: "editingComplete",
      review: "reviewComplete",
    };

    const field = counterMap[job.phase];
    if (field) {
      const patch: Record<string, unknown> = { updatedAt: now };
      patch[field] = (run as any)[field] + 1;
      await ctx.db.patch(run._id, patch);
    }

    await ctx.db.insert("agentEvents", {
      pipelineRunId: run._id,
      sectionJobId: args.jobId,
      eventType: "job.completed",
      agentRole: job.agentRole,
      agentId: args.agentId,
      issueDate: job.issueDate,
      summary: `${job.agentRole} completed ${job.sectionType}/${job.phase}${args.confidenceScore != null ? ` (score: ${args.confidenceScore})` : ""}`,
      createdAt: now,
    });

    // Check gate
    await ctx.scheduler.runAfter(
      0,
      internal.pipeline.runs.checkGateAndAdvance,
      { pipelineRunId: job.pipelineRunId }
    );
  },
});

export const fail = mutation({
  args: {
    jobId: v.id("sectionJobs"),
    agentId: v.string(),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");
    if (job.agentId !== args.agentId) throw new Error("Agent mismatch");

    const now = Date.now();
    await ctx.db.patch(args.jobId, {
      status: "failed",
      error: args.error,
      updatedAt: now,
    });

    await ctx.db.insert("agentEvents", {
      pipelineRunId: job.pipelineRunId,
      sectionJobId: job._id,
      eventType: "job.failed",
      agentRole: job.agentRole,
      agentId: args.agentId,
      issueDate: job.issueDate,
      summary: `${job.agentRole} failed ${job.sectionType}/${job.phase}: ${args.error}`,
      createdAt: now,
    });

    if (job.attempt < job.maxAttempts) {
      await ctx.db.insert("sectionJobs", {
        pipelineRunId: job.pipelineRunId,
        marketId: job.marketId,
        issueDate: job.issueDate,
        sectionType: job.sectionType,
        phase: job.phase,
        status: "pending",
        agentRole: job.agentRole,
        inputData: job.inputData,
        revisionNotes: job.revisionNotes,
        attempt: job.attempt + 1,
        maxAttempts: job.maxAttempts,
        timeoutMs: job.timeoutMs,
        createdAt: now,
        updatedAt: now,
      });

      await ctx.scheduler.runAfter(
        0,
        internal.pipeline.agents.wakeAgents,
        { role: job.agentRole, count: 1 }
      );
    } else {
      await ctx.scheduler.runAfter(
        0,
        internal.pipeline.notifications.jobExhausted,
        { pipelineRunId: job.pipelineRunId, sectionJobId: job._id }
      );
    }
  },
});

export const reapStaleJobs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const HEARTBEAT_TIMEOUT = 180_000; // 3 minutes

    const active = await ctx.db
      .query("sectionJobs")
      .withIndex("by_status_phase")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "claimed"),
          q.eq(q.field("status"), "running")
        )
      )
      .collect();

    for (const job of active) {
      const heartbeatAge = now - (job.heartbeatAt ?? job.claimedAt ?? 0);
      if (heartbeatAge > HEARTBEAT_TIMEOUT) {
        await ctx.db.patch(job._id, {
          status: "pending",
          agentId: undefined,
          claimedAt: undefined,
          heartbeatAt: undefined,
          updatedAt: now,
        });

        await ctx.db.insert("agentEvents", {
          pipelineRunId: job.pipelineRunId,
          sectionJobId: job._id,
          eventType: "job.timeout",
          agentRole: job.agentRole,
          agentId: job.agentId,
          issueDate: job.issueDate,
          summary: `${job.agentRole} timed out on ${job.sectionType}/${job.phase} (${Math.round(heartbeatAge / 1000)}s)`,
          createdAt: now,
        });
      }
    }
  },
});
