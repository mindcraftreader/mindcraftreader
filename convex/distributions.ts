import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const listByIssue = query({
  args: { issueId: v.id("issues") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("distributions")
      .withIndex("by_issue", (q) => q.eq("issueId", args.issueId))
      .collect();
  },
});

export const create = mutation({
  args: {
    issueId: v.id("issues"),
    platform: v.union(
      v.literal("beehive"),
      v.literal("pdf"),
      v.literal("web"),
      v.literal("twitter"),
      v.literal("facebook"),
      v.literal("instagram"),
      v.literal("nextdoor"),
      v.literal("slack")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    scheduledAt: v.optional(v.number()),
    externalId: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    metadata: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("distributions", {
      ...args,
      sentAt: args.status === "sent" || args.status === "delivered" ? Date.now() : undefined,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    distributionId: v.id("distributions"),
    status: v.union(
      v.literal("pending"),
      v.literal("scheduled"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed")
    ),
    externalId: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { distributionId, ...patch } = args;
    if (patch.status === "sent" || patch.status === "delivered") {
      (patch as Record<string, unknown>).sentAt = Date.now();
    }
    await ctx.db.patch(distributionId, patch);
  },
});
