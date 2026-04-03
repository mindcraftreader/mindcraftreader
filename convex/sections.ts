import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("sections")
      .withIndex("by_issue_order", (q) => q.eq("issueId", args.issueId))
      .collect();
  },
});

export const create = mutation({
  args: {
    issueId: v.id("issues"),
    sectionType: v.string(),
    title: v.string(),
    order: v.number(),
    contentHtml: v.string(),
    contentText: v.string(),
    contentJson: v.optional(v.string()),
    status: v.union(
      v.literal("research"),
      v.literal("draft"),
      v.literal("review"),
      v.literal("approved")
    ),
    wordCount: v.number(),
    measuredHeight: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("sections", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});
