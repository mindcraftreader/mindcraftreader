import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  markets: defineTable({
    slug: v.string(),
    name: v.string(),
    state: v.string(),
    county: v.string(),
    timezone: v.string(),
    zipCodes: v.array(v.string()),
    nearbyCities: v.array(v.string()),
    senderName: v.string(),
    isActive: v.boolean(),
    subscriberCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["isActive"]),

  issues: defineTable({
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
    approvedBy: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    pdfUrl: v.optional(v.string()),
    canonicalUrl: v.optional(v.string()),
    ogImageUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_market", ["marketId"])
    .index("by_market_date", ["marketId", "issueDate"])
    .index("by_status", ["status"])
    .index("by_published", ["publishedAt"]),

  sections: defineTable({
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
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_issue_order", ["issueId", "order"])
    .index("by_issue_type", ["issueId", "sectionType"]),

  subscribers: defineTable({
    email: v.string(),
    marketId: v.id("markets"),
    status: v.union(
      v.literal("active"),
      v.literal("unsubscribed"),
      v.literal("bounced")
    ),
    source: v.string(),
    referredBy: v.optional(v.string()),
    subscribedAt: v.number(),
    unsubscribedAt: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_market", ["marketId"])
    .index("by_market_status", ["marketId", "status"]),

  distributions: defineTable({
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
    sentAt: v.optional(v.number()),
    externalId: v.optional(v.string()),
    externalUrl: v.optional(v.string()),
    metadata: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_issue_platform", ["issueId", "platform"])
    .index("by_status", ["status"]),

  analytics: defineTable({
    issueId: v.id("issues"),
    distributionId: v.id("distributions"),
    snapshotAt: v.number(),
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
  })
    .index("by_issue", ["issueId"])
    .index("by_distribution", ["distributionId"])
    .index("by_snapshot", ["issueId", "snapshotAt"]),

  ads: defineTable({
    issueId: v.optional(v.id("issues")),
    marketId: v.id("markets"),
    placement: v.union(
      v.literal("top_banner"),
      v.literal("mid_banner"),
      v.literal("sidebar"),
      v.literal("classified"),
      v.literal("sponsored_section"),
      v.literal("spotlight_upgrade")
    ),
    advertiser: v.string(),
    rate: v.number(),
    status: v.union(
      v.literal("booked"),
      v.literal("creative_pending"),
      v.literal("ready"),
      v.literal("published"),
      v.literal("invoiced"),
      v.literal("paid")
    ),
    creativeHtml: v.optional(v.string()),
    invoiceId: v.optional(v.string()),
    paidAt: v.optional(v.number()),
    impressions: v.optional(v.number()),
    clicks: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_issue", ["issueId"])
    .index("by_market", ["marketId"])
    .index("by_status", ["status"])
    .index("by_advertiser", ["advertiser"]),

  businesses: defineTable({
    name: v.string(),
    marketId: v.id("markets"),
    category: v.string(),
    contactName: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    website: v.optional(v.string()),
    outreachStatus: v.union(
      v.literal("pending"),
      v.literal("contacted"),
      v.literal("followup"),
      v.literal("confirmed"),
      v.literal("declined"),
      v.literal("published"),
      v.literal("expired")
    ),
    source: v.string(),
    couponCode: v.optional(v.string()),
    couponDescription: v.optional(v.string()),
    couponExpires: v.optional(v.number()),
    spotlightIssueId: v.optional(v.id("issues")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_market", ["marketId"])
    .index("by_status", ["outreachStatus"])
    .index("by_market_status", ["marketId", "outreachStatus"]),
});
