import { query } from "./_generated/server";
import { v } from "convex/values";

export const listByMarket = query({
  args: { marketId: v.id("markets") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketSources")
      .withIndex("by_market", (q) => q.eq("marketId", args.marketId))
      .collect();
  },
});

export const listByMarketSection = query({
  args: { marketId: v.id("markets"), sectionType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketSources")
      .withIndex("by_market_section", (q) =>
        q.eq("marketId", args.marketId).eq("sectionType", args.sectionType)
      )
      .collect();
  },
});

export const listBySection = query({
  args: { sectionType: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("marketSources")
      .withIndex("by_section", (q) => q.eq("sectionType", args.sectionType))
      .collect();
  },
});
