import { mutation, query, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { Id, Doc } from "../_generated/dataModel";

const DEFAULT_SECTIONS = [
  "weather", "feature", "hs_sports", "college_sports", "pro_sports",
  "public_safety", "home_garden", "arts_leisure", "community_calendar",
  "business_spotlight", "meteorologist_corner", "brainteaser",
];

const AGENT_ROLE_MAP: Record<string, string> = {
  writing: "copywriter",
  editing: "editor",
  review: "researcher",
};

const TIMEOUT_MAP: Record<string, number> = {
  research: 300_000,
  writing: 300_000,
  editing: 180_000,
  review: 300_000,
  assembly: 600_000,
  distribution: 900_000,
};

// ── QUERIES ──

export const get = query({
  args: { id: v.id("pipelineRuns") },
  handler: async (ctx, args) => ctx.db.get(args.id),
});

export const getByMarketDate = query({
  args: { marketId: v.id("markets"), issueDate: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pipelineRuns")
      .withIndex("by_market_date", (q) =>
        q.eq("marketId", args.marketId).eq("issueDate", args.issueDate)
      )
      .first();
  },
});

export const listActive = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("pipelineRuns").collect();
    return all.filter(
      (r) => r.stage !== "complete" && r.stage !== "failed"
    );
  },
});

export const getDashboard = query({
  args: { marketId: v.id("markets") },
  handler: async (ctx, args) => {
    const runs = await ctx.db
      .query("pipelineRuns")
      .withIndex("by_market_date", (q) => q.eq("marketId", args.marketId))
      .order("desc")
      .take(1);
    const run = runs[0];
    if (!run) return null;

    const jobs = await ctx.db
      .query("sectionJobs")
      .withIndex("by_pipeline", (q) => q.eq("pipelineRunId", run._id))
      .collect();

    return { run, jobs };
  },
});

// ── MUTATIONS ──

export const create = mutation({
  args: {
    marketSlug: v.string(),
    issueDate: v.string(),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const market = await ctx.db
      .query("markets")
      .withIndex("by_slug", (q) => q.eq("slug", args.marketSlug))
      .first();
    if (!market) throw new Error(`Market not found: ${args.marketSlug}`);

    const existing = await ctx.db
      .query("pipelineRuns")
      .withIndex("by_market_date", (q) =>
        q.eq("marketId", market._id).eq("issueDate", args.issueDate)
      )
      .first();
    if (existing)
      throw new Error(
        `Pipeline run already exists for ${args.marketSlug} ${args.issueDate}`
      );

    const sections = market.defaultSections ?? DEFAULT_SECTIONS;
    const now = Date.now();

    const runId = await ctx.db.insert("pipelineRuns", {
      marketId: market._id,
      issueDate: args.issueDate,
      stage: "research",
      priority: args.priority ?? 100,
      sectionsTotal: sections.length,
      researchComplete: 0,
      writingComplete: 0,
      editingComplete: 0,
      reviewComplete: 0,
      revisionCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    for (const sectionType of sections) {
      await ctx.db.insert("sectionJobs", {
        pipelineRunId: runId,
        marketId: market._id,
        issueDate: args.issueDate,
        sectionType,
        phase: "research",
        status: "pending",
        agentRole: "researcher",
        attempt: 1,
        maxAttempts: 3,
        timeoutMs: TIMEOUT_MAP.research,
        inputData: JSON.stringify({
          marketSlug: args.marketSlug,
          marketName: market.name,
          state: market.state,
          county: market.county,
          timezone: market.timezone,
          issueDate: args.issueDate,
          sectionType,
        }),
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.insert("agentEvents", {
      pipelineRunId: runId,
      eventType: "pipeline.created",
      marketSlug: args.marketSlug,
      issueDate: args.issueDate,
      summary: `Pipeline created for ${args.marketSlug} ${args.issueDate} with ${sections.length} sections`,
      createdAt: now,
    });

    await ctx.scheduler.runAfter(
      0,
      internal.pipeline.agents.wakeAgents,
      { role: "researcher", count: sections.length }
    );

    return runId;
  },
});

// ── GATE LOGIC ──

export const checkGateAndAdvance = internalMutation({
  args: { pipelineRunId: v.id("pipelineRuns") },
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.pipelineRunId);
    if (!run) return;

    const market = await ctx.db.get(run.marketId);
    const marketSlug = market?.slug ?? "unknown";
    const now = Date.now();

    switch (run.stage) {
      case "research":
        if (run.researchComplete >= run.sectionsTotal) {
          await advanceToStage(ctx, run, "writing", marketSlug, now);
        }
        break;

      case "writing":
        if (run.writingComplete >= run.sectionsTotal) {
          await advanceToStage(ctx, run, "editing", marketSlug, now);
        }
        break;

      case "editing":
        if (run.editingComplete >= run.sectionsTotal) {
          await handleEditingGate(ctx, run, marketSlug, now);
        }
        break;

      case "review":
        if (run.reviewComplete >= run.sectionsTotal) {
          await advanceToStage(ctx, run, "assembly", marketSlug, now);
        }
        break;
    }
  },
});

async function handleEditingGate(
  ctx: any,
  run: Doc<"pipelineRuns">,
  marketSlug: string,
  now: number
) {
  const editJobs = await ctx.db
    .query("sectionJobs")
    .withIndex("by_pipeline_phase", (q: any) =>
      q.eq("pipelineRunId", run._id).eq("phase", "editing")
    )
    .collect();

  // Get latest completed edit per section
  const latestBySection = new Map<string, Doc<"sectionJobs">>();
  for (const j of editJobs) {
    if (j.status === "complete") {
      const existing = latestBySection.get(j.sectionType);
      if (!existing || j.completedAt! > existing.completedAt!) {
        latestBySection.set(j.sectionType, j);
      }
    }
  }

  const failedSections: Array<{
    sectionType: string;
    score: number | undefined;
    issues: string | undefined;
  }> = [];
  for (const [sectionType, job] of latestBySection) {
    if ((job.confidenceScore ?? 0) < 80) {
      failedSections.push({
        sectionType,
        score: job.confidenceScore,
        issues: job.editIssues,
      });
    }
  }

  if (failedSections.length === 0) {
    await advanceToStage(ctx, run, "review", marketSlug, now);
    return;
  }

  // Bounce failed sections back to writing
  for (const failed of failedSections) {
    await ctx.db.insert("sectionJobs", {
      pipelineRunId: run._id,
      marketId: run.marketId,
      issueDate: run.issueDate,
      sectionType: failed.sectionType,
      phase: "writing" as const,
      status: "pending" as const,
      agentRole: "copywriter",
      attempt: 1,
      maxAttempts: 3,
      timeoutMs: TIMEOUT_MAP.writing,
      revisionNotes: failed.issues,
      inputData: JSON.stringify({
        reason: "confidence_below_threshold",
        score: failed.score,
      }),
      createdAt: now,
      updatedAt: now,
    });
  }

  await ctx.db.patch(run._id, {
    stage: "writing" as const,
    writingComplete: run.sectionsTotal - failedSections.length,
    editingComplete: run.sectionsTotal - failedSections.length,
    updatedAt: now,
  });

  await ctx.db.insert("agentEvents", {
    pipelineRunId: run._id,
    eventType: "gate.editing_bounce",
    marketSlug,
    issueDate: run.issueDate,
    summary: `${failedSections.length} sections below 80 confidence, sent back to writing`,
    metadata: JSON.stringify(
      failedSections.map((f) => ({ section: f.sectionType, score: f.score }))
    ),
    createdAt: now,
  });

  await ctx.scheduler.runAfter(0, internal.pipeline.agents.wakeAgents, {
    role: "copywriter",
    count: failedSections.length,
  });
}

async function advanceToStage(
  ctx: any,
  run: Doc<"pipelineRuns">,
  nextStage: string,
  marketSlug: string,
  now: number
) {
  await ctx.db.patch(run._id, { stage: nextStage, updatedAt: now });

  await ctx.db.insert("agentEvents", {
    pipelineRunId: run._id,
    eventType: `gate.${run.stage}_met`,
    marketSlug,
    issueDate: run.issueDate,
    summary: `Pipeline advanced to ${nextStage}`,
    createdAt: now,
  });

  // Assembly: single job
  if (nextStage === "assembly") {
    const allJobs = await ctx.db
      .query("sectionJobs")
      .withIndex("by_pipeline", (q: any) => q.eq("pipelineRunId", run._id))
      .collect();

    const reviewOutputs: Record<string, unknown> = {};
    for (const j of allJobs) {
      if (j.phase === "review" && j.status === "complete") {
        reviewOutputs[j.sectionType] = {
          outputData: j.outputData,
          outputHtml: j.outputHtml,
          wordCount: j.wordCount,
        };
      }
    }

    await ctx.db.insert("sectionJobs", {
      pipelineRunId: run._id,
      marketId: run.marketId,
      issueDate: run.issueDate,
      sectionType: "_assembly",
      phase: "assembly" as const,
      status: "pending" as const,
      agentRole: "assembler",
      attempt: 1,
      maxAttempts: 2,
      timeoutMs: TIMEOUT_MAP.assembly,
      inputData: JSON.stringify({
        marketSlug,
        issueDate: run.issueDate,
        sections: reviewOutputs,
      }),
      createdAt: now,
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.pipeline.agents.wakeAgents, {
      role: "assembler",
      count: 1,
    });
    return;
  }

  // Per-section jobs for writing, editing, review
  const phaseMap: Record<string, string> = {
    writing: "research",
    editing: "writing",
    review: "editing",
  };

  const previousPhase = phaseMap[nextStage];
  if (!previousPhase) return;

  const prevJobs = await ctx.db
    .query("sectionJobs")
    .withIndex("by_pipeline_phase", (q: any) =>
      q.eq("pipelineRunId", run._id).eq("phase", previousPhase)
    )
    .collect();

  const latestBySection = new Map<string, Doc<"sectionJobs">>();
  for (const j of prevJobs) {
    if (j.status === "complete") {
      const existing = latestBySection.get(j.sectionType);
      if (!existing || j.completedAt! > existing.completedAt!) {
        latestBySection.set(j.sectionType, j);
      }
    }
  }

  const agentRole = AGENT_ROLE_MAP[nextStage] ?? nextStage;

  for (const [sectionType, prevJob] of latestBySection) {
    await ctx.db.insert("sectionJobs", {
      pipelineRunId: run._id,
      marketId: run.marketId,
      issueDate: run.issueDate,
      sectionType,
      phase: nextStage as any,
      status: "pending" as const,
      agentRole,
      attempt: 1,
      maxAttempts: 3,
      timeoutMs: TIMEOUT_MAP[nextStage] ?? 300_000,
      inputData: JSON.stringify({
        previousOutput: prevJob.outputData,
        previousHtml: prevJob.outputHtml,
        marketSlug,
        issueDate: run.issueDate,
        sectionType,
      }),
      createdAt: now,
      updatedAt: now,
    });
  }

  await ctx.scheduler.runAfter(0, internal.pipeline.agents.wakeAgents, {
    role: agentRole,
    count: latestBySection.size,
  });
}
