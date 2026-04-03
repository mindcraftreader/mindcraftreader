import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listByMarket = query({
  args: { marketId: v.id("markets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_market", (q) => q.eq("marketId", args.marketId))
      .order("desc")
      .collect();
  },
});

export const getLatestPublished = query({
  args: { marketId: v.id("markets") },
  handler: async (ctx, args) => {
    const issues = await ctx.db
      .query("issues")
      .withIndex("by_market", (q) => q.eq("marketId", args.marketId))
      .order("desc")
      .collect();
    return issues.find((i) => i.status === "published") ?? issues[0] ?? null;
  },
});

export const getByMarketDate = query({
  args: { marketId: v.id("markets"), issueDate: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_market_date", (q) =>
        q.eq("marketId", args.marketId).eq("issueDate", args.issueDate)
      )
      .first();
  },
});

export const create = mutation({
  args: {
    marketId: v.id("markets"),
    issueDate: v.string(),
    headline: v.string(),
    subHeadline: v.optional(v.string()),
    status: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("approved"),
      v.literal("published"),
      v.literal("archived")
    ),
    wordCount: v.number(),
    pageCount: v.number(),
    pdfUrl: v.optional(v.string()),
    canonicalUrl: v.optional(v.string()),
    ogImageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("issues", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const updateStatus = mutation({
  args: {
    issueId: v.id("issues"),
    status: v.union(
      v.literal("draft"),
      v.literal("review"),
      v.literal("approved"),
      v.literal("published"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = { status: args.status };
    if (args.status === "published") {
      patch.publishedAt = Date.now();
    }
    await ctx.db.patch(args.issueId, patch);
  },
});
