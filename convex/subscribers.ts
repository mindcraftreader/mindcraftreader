import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const subscribe = mutation({
  args: {
    email: v.string(),
    marketId: v.id("markets"),
    source: v.optional(v.string()),
    referredBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("subscribers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .collect();

    const alreadySubscribed = existing.find(
      (s) => s.marketId === args.marketId && s.status === "active"
    );
    if (alreadySubscribed) {
      return { status: "already_subscribed" as const, id: alreadySubscribed._id };
    }

    const id = await ctx.db.insert("subscribers", {
      email: args.email,
      marketId: args.marketId,
      status: "active",
      source: args.source ?? "organic",
      referredBy: args.referredBy,
      subscribedAt: Date.now(),
    });

    await ctx.db.patch(args.marketId, {
      subscriberCount: (
        await ctx.db.get(args.marketId)
      )!.subscriberCount + 1,
    });

    return { status: "subscribed" as const, id };
  },
});

export const countByMarket = query({
  args: { marketId: v.id("markets") },
  handler: async (ctx, args) => {
    const subs = await ctx.db
      .query("subscribers")
      .withIndex("by_market_status", (q) =>
        q.eq("marketId", args.marketId).eq("status", "active")
      )
      .collect();
    return subs.length;
  },
});
