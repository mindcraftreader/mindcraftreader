import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const snapshot = mutation({
  args: {
    issueId: v.id("issues"),
    distributionId: v.id("distributions"),
    recipients: v.optional(v.number()),
    delivered: v.optional(v.number()),
    opened: v.optional(v.number()),
    clicked: v.optional(v.number()),
    bounced: v.optional(v.number()),
    unsubscribed: v.optional(v.number()),
    impressions: v.optional(v.number()),
    reach: v.optional(v.number()),
    pdfDownloads: v.optional(v.number()),
    webViews: v.optional(v.number()),
    topClicked: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analytics", {
      ...args,
      snapshotAt: Date.now(),
    });
  },
});

export const listByIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("analytics")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();
  },
});
