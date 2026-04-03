import { internalMutation } from "../_generated/server";
import { api } from "../_generated/api";

export const createWeeklyRuns = internalMutation({
  args: {},
  handler: async (ctx) => {
    const markets = await ctx.db
      .query("markets")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Calculate next Thursday's date (the publish date)
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilThursday = (4 - dayOfWeek + 7) % 7 || 7;
    const nextThursday = new Date(now);
    nextThursday.setUTCDate(now.getUTCDate() + daysUntilThursday);
    const issueDate = nextThursday.toISOString().split("T")[0];

    let created = 0;
    for (const market of markets) {
      // Check if run already exists
      const existing = await ctx.db
        .query("pipelineRuns")
        .withIndex("by_market_date", (q) =>
          q.eq("marketId", market._id).eq("issueDate", issueDate)
        )
        .first();

      if (existing) continue;

      const sections = market.defaultSections ?? [
        "weather", "feature", "hs_sports", "college_sports", "pro_sports",
        "public_safety", "home_garden", "arts_leisure", "community_calendar",
        "business_spotlight", "meteorologist_corner", "brainteaser",
      ];

      const runNow = Date.now();
      const runId = await ctx.db.insert("pipelineRuns", {
        marketId: market._id,
        issueDate,
        stage: "research",
        priority: 100,
        sectionsTotal: sections.length,
        researchComplete: 0,
        writingComplete: 0,
        editingComplete: 0,
        reviewComplete: 0,
        revisionCount: 0,
        createdAt: runNow,
        updatedAt: runNow,
      });

      for (const sectionType of sections) {
        await ctx.db.insert("sectionJobs", {
          pipelineRunId: runId,
          marketId: market._id,
          issueDate,
          sectionType,
          phase: "research",
          status: "pending",
          agentRole: "researcher",
          attempt: 1,
          maxAttempts: 3,
          timeoutMs: 300_000,
          inputData: JSON.stringify({
            marketSlug: market.slug,
            marketName: market.name,
            state: market.state,
            county: market.county,
            timezone: market.timezone,
            issueDate,
            sectionType,
          }),
          createdAt: runNow,
          updatedAt: runNow,
        });
      }

      await ctx.db.insert("agentEvents", {
        pipelineRunId: runId,
        eventType: "pipeline.created",
        marketSlug: market.slug,
        issueDate,
        summary: `Weekly pipeline auto-created for ${market.slug} (${sections.length} sections)`,
        createdAt: runNow,
      });

      created++;
    }

    if (created > 0) {
      console.log(
        `[scheduler] Created ${created} pipeline runs for ${issueDate}`
      );
    }
  },
});
