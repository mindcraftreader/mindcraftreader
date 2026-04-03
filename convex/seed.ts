import { mutation } from "./_generated/server";

const MARKETS = [
  {
    slug: "hudson-oh",
    name: "Hudson",
    state: "OH",
    county: "Summit",
    timezone: "America/New_York",
    zipCodes: ["44236"],
    nearbyCities: ["Stow", "Twinsburg", "Macedonia"],
    senderName: "The Hudson Weekly",
  },
  {
    slug: "lakewood-oh",
    name: "Lakewood",
    state: "OH",
    county: "Cuyahoga",
    timezone: "America/New_York",
    zipCodes: ["44107"],
    nearbyCities: ["Rocky River", "Cleveland", "Westlake"],
    senderName: "The Lakewood Observer",
  },
  {
    slug: "tremont-oh",
    name: "Tremont",
    state: "OH",
    county: "Cuyahoga",
    timezone: "America/New_York",
    zipCodes: ["44113"],
    nearbyCities: ["Ohio City", "Downtown Cleveland", "Brooklyn"],
    senderName: "The Tremont Tribune",
  },
  {
    slug: "ohio-city-oh",
    name: "Ohio City",
    state: "OH",
    county: "Cuyahoga",
    timezone: "America/New_York",
    zipCodes: ["44113"],
    nearbyCities: ["Tremont", "Downtown Cleveland", "Lakewood"],
    senderName: "The Ohio City Chronicle",
  },
  {
    slug: "richfield-oh",
    name: "Richfield",
    state: "OH",
    county: "Summit",
    timezone: "America/New_York",
    zipCodes: ["44286"],
    nearbyCities: ["Bath", "Peninsula", "Brecksville"],
    senderName: "The Richfield Record",
  },
  {
    slug: "copley-oh",
    name: "Copley",
    state: "OH",
    county: "Summit",
    timezone: "America/New_York",
    zipCodes: ["44321"],
    nearbyCities: ["Fairlawn", "Bath", "Akron"],
    senderName: "The Copley Courier",
  },
  {
    slug: "cuyahoga-falls-oh",
    name: "Cuyahoga Falls",
    state: "OH",
    county: "Summit",
    timezone: "America/New_York",
    zipCodes: ["44221", "44222", "44223"],
    nearbyCities: ["Stow", "Tallmadge", "Akron", "Silver Lake"],
    senderName: "The Falls Weekly",
  },
  {
    slug: "oak-creek-az",
    name: "Oak Creek",
    state: "AZ",
    county: "Yavapai",
    timezone: "America/Phoenix",
    zipCodes: ["86351"],
    nearbyCities: ["Sedona", "Cottonwood", "Village of Oak Creek"],
    senderName: "The Oak Creek Sun",
  },
];

export const seedMarkets = mutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    let skipped = 0;

    for (const market of MARKETS) {
      const existing = await ctx.db
        .query("markets")
        .withIndex("by_slug", (q) => q.eq("slug", market.slug))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("markets", {
        ...market,
        isActive: true,
        subscriberCount: 0,
        defaultSections: [
          "weather", "feature", "hs_sports", "college_sports", "pro_sports",
          "public_safety", "home_garden", "arts_leisure", "community_calendar",
          "business_spotlight", "meteorologist_corner", "brainteaser",
        ],
        publishDay: "thursday",
        publishTimeUtc: "12:00",
        createdAt: Date.now(),
      });
      created++;
    }

    return { created, skipped, total: MARKETS.length };
  },
});
