import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const submit = mutation({
  args: {
    pipelineRunId: v.id("pipelineRuns"),
    decision: v.union(v.literal("approve"), v.literal("reject")),
    approver: v.string(),
    notes: v.optional(v.string()),
    affectedSections: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.pipelineRunId);
    if (!run) throw new Error("Pipeline run not found");
    if (run.stage !== "pending_approval") {
      throw new Error(`Pipeline not awaiting approval (stage: ${run.stage})`);
    }

    const market = await ctx.db.get(run.marketId);
    const marketSlug = market?.slug ?? "unknown";
    const now = Date.now();

    if (args.decision === "approve") {
      await ctx.db.patch(run._id, {
        stage: "distributing",
        approvedBy: args.approver,
        approvedAt: now,
        distributionStartedAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("sectionJobs", {
        pipelineRunId: run._id,
        marketId: run.marketId,
        issueDate: run.issueDate,
        sectionType: "_distribution",
        phase: "distribution",
        status: "pending",
        agentRole: "distributor",
        attempt: 1,
        maxAttempts: 2,
        timeoutMs: 900_000,
        inputData: JSON.stringify({
          marketSlug,
          issueDate: run.issueDate,
          assembledHtml: run.assembledHtml,
          assembledPdfUrl: run.assembledPdfUrl,
        }),
        createdAt: now,
        updatedAt: now,
      });

      await ctx.db.insert("agentEvents", {
        pipelineRunId: run._id,
        eventType: "pipeline.approved",
        marketSlug,
        issueDate: run.issueDate,
        summary: `Approved by ${args.approver}`,
        createdAt: now,
      });

      await ctx.scheduler.runAfter(
        0,
        internal.pipeline.agents.wakeAgents,
        { role: "distributor", count: 1 }
      );
    } else {
      // Rejection — create targeted revision jobs
      const defaultAll = [
        "weather", "feature", "hs_sports", "college_sports", "pro_sports",
        "public_safety", "home_garden", "arts_leisure", "community_calendar",
        "business_spotlight", "meteorologist_corner", "brainteaser",
      ];
      const affectedSections = args.affectedSections ?? defaultAll;

      await ctx.db.patch(run._id, {
        stage: "writing",
        rejectionNotes: args.notes,
        revisionCount: run.revisionCount + 1,
        writingComplete: run.sectionsTotal - affectedSections.length,
        editingComplete: run.sectionsTotal - affectedSections.length,
        reviewComplete: run.sectionsTotal - affectedSections.length,
        updatedAt: now,
      });

      for (const sectionType of affectedSections) {
        await ctx.db.insert("sectionJobs", {
          pipelineRunId: run._id,
          marketId: run.marketId,
          issueDate: run.issueDate,
          sectionType,
          phase: "revision",
          status: "pending",
          agentRole: "copywriter",
          revisionNotes: args.notes,
          attempt: 1,
          maxAttempts: 3,
          timeoutMs: 300_000,
          inputData: JSON.stringify({
            revisionNotes: args.notes,
            sectionType,
            issueDate: run.issueDate,
            marketSlug,
          }),
          createdAt: now,
          updatedAt: now,
        });
      }

      await ctx.db.insert("agentEvents", {
        pipelineRunId: run._id,
        eventType: "pipeline.rejected",
        marketSlug,
        issueDate: run.issueDate,
        summary: `Rejected by ${args.approver}: ${args.notes ?? "no notes"}. ${affectedSections.length} sections for revision.`,
        createdAt: now,
      });

      await ctx.scheduler.runAfter(
        0,
        internal.pipeline.agents.wakeAgents,
        { role: "copywriter", count: affectedSections.length }
      );
    }
  },
});
