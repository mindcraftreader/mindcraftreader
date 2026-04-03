import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("markets")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("markets")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const create = mutation({
  args: {
    slug: v.string(),
    name: v.string(),
    state: v.string(),
    county: v.string(),
    timezone: v.optional(v.string()),
    zipCodes: v.array(v.string()),
    nearbyCities: v.optional(v.array(v.string())),
    senderName: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    publishDay: v.optional(v.string()),
    publishFrequency: v.optional(v.string()),
    hsSchools: v.optional(v.array(v.string())),
    colleges: v.optional(v.array(v.string())),
    proTeams: v.optional(v.string()),
    cityWebsite: v.optional(v.string()),
    policeUrl: v.optional(v.string()),
    libraryUrl: v.optional(v.string()),
    parksUrl: v.optional(v.string()),
    councilUrl: v.optional(v.string()),
    localNewsRss: v.optional(v.string()),
    usdaZone: v.optional(v.string()),
    usdaNotes: v.optional(v.string()),
    historicalSocietyUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("markets")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error(`Market ${args.slug} already exists`);

    const isOhio = args.state === "OH";
    const tz = args.timezone ?? (isOhio ? "America/New_York" : "America/Phoenix");
    const now = Date.now();

    // Default sections for all markets
    const defaultSections = [
      "weather", "feature", "hs_sports", "college_sports", "pro_sports",
      "public_safety", "home_garden", "arts_leisure", "community_calendar",
      "business_spotlight", "meteorologist_corner", "brainteaser",
    ];

    // Create the market
    const marketId = await ctx.db.insert("markets", {
      slug: args.slug,
      name: args.name,
      state: args.state,
      county: args.county,
      timezone: tz,
      zipCodes: args.zipCodes,
      nearbyCities: args.nearbyCities ?? [],
      senderName: args.senderName,
      isActive: true,
      subscriberCount: 0,
      defaultSections,
      publishDay: args.publishDay ?? "thursday",
      publishTimeUtc: "12:00",
      createdAt: now,
    });

    // ── AUTO-GENERATE DATA SOURCES ──

    let sourceCount = 0;

    // Weather (Open-Meteo with coordinates)
    await ctx.db.insert("marketSources", {
      marketId,
      sectionType: "weather",
      sourceName: "Open-Meteo API",
      sourceUrl: `https://api.open-meteo.com/v1/forecast?latitude=${args.latitude}&longitude=${args.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&temperature_unit=fahrenheit&timezone=auto`,
      plugin: "weather_api",
      category: "weather",
      enabled: true,
      notes: "7-day forecast. Free, no key needed.",
      priority: 1,
      createdAt: now,
    });
    sourceCount++;

    // Pro sports
    const defaultProTeams = isOhio
      ? "Cleveland Guardians (MLB), Cleveland Cavaliers (NBA), Cleveland Browns (NFL), Columbus Crew (MLS)"
      : "Arizona Diamondbacks (MLB), Phoenix Suns (NBA), Arizona Cardinals (NFL)";
    await ctx.db.insert("marketSources", {
      marketId,
      sectionType: "pro_sports",
      sourceName: "ESPN API",
      sourceUrl: "https://site.api.espn.com/apis/site/v2/sports",
      plugin: "json_api",
      category: "sports",
      enabled: true,
      notes: `Pro teams: ${args.proTeams ?? defaultProTeams}`,
      priority: 1,
      createdAt: now,
    });
    sourceCount++;

    // City website → community_calendar + public_safety
    if (args.cityWebsite) {
      await ctx.db.insert("marketSources", {
        marketId,
        sectionType: "community_calendar",
        sourceName: `${args.name} City Events`,
        sourceUrl: args.cityWebsite,
        plugin: "html_calendar",
        category: "government",
        enabled: true,
        priority: 1,
        createdAt: now,
      });
      sourceCount++;
    }

    // Council
    if (args.councilUrl) {
      await ctx.db.insert("marketSources", {
        marketId,
        sectionType: "public_safety",
        sourceName: `${args.name} City Council`,
        sourceUrl: args.councilUrl,
        plugin: "html_calendar",
        category: "government",
        enabled: true,
        notes: "Council agendas, minutes, public meetings.",
        priority: 1,
        createdAt: now,
      });
      sourceCount++;
    }

    // Police
    if (args.policeUrl) {
      await ctx.db.insert("marketSources", {
        marketId,
        sectionType: "public_safety",
        sourceName: `${args.name} Police Department`,
        sourceUrl: args.policeUrl,
        plugin: "html_calendar",
        category: "safety",
        enabled: true,
        priority: 1,
        createdAt: now,
      });
      sourceCount++;
    }

    // Library
    if (args.libraryUrl) {
      await ctx.db.insert("marketSources", {
        marketId,
        sectionType: "community_calendar",
        sourceName: `${args.name} Library`,
        sourceUrl: args.libraryUrl,
        plugin: "html_calendar",
        category: "library",
        enabled: true,
        priority: 1,
        createdAt: now,
      });
      sourceCount++;
    }

    // Parks & Rec
    if (args.parksUrl) {
      await ctx.db.insert("marketSources", {
        marketId,
        sectionType: "community_calendar",
        sourceName: `${args.name} Parks & Rec`,
        sourceUrl: args.parksUrl,
        plugin: "html_calendar",
        category: "parks",
        enabled: true,
        priority: 1,
        createdAt: now,
      });
      sourceCount++;
    }

    // High schools → hs_sports
    if (args.hsSchools) {
      for (const school of args.hsSchools) {
        const schoolSlug = school.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        await ctx.db.insert("marketSources", {
          marketId,
          sectionType: "hs_sports",
          sourceName: `${school} (MaxPreps)`,
          sourceUrl: `https://www.maxpreps.com/${args.state.toLowerCase()}/${args.slug.split("-")[0]}/${schoolSlug}/`,
          plugin: "html_calendar",
          category: "sports",
          enabled: true,
          priority: 1,
          createdAt: now,
        });
        sourceCount++;
      }
    }

    // Colleges → college_sports
    if (args.colleges) {
      for (const college of args.colleges) {
        await ctx.db.insert("marketSources", {
          marketId,
          sectionType: "college_sports",
          sourceName: college,
          sourceUrl: `https://www.espn.com/college-sports/`,
          plugin: "html_calendar",
          category: "sports",
          enabled: true,
          notes: `Look up schedule for ${college}`,
          priority: 1,
          createdAt: now,
        });
        sourceCount++;
      }
    }

    // Local news RSS → feature
    if (args.localNewsRss) {
      await ctx.db.insert("marketSources", {
        marketId,
        sectionType: "feature",
        sourceName: `${args.name} Local News`,
        sourceUrl: args.localNewsRss,
        plugin: "rss_feed",
        category: "news",
        enabled: true,
        priority: 1,
        createdAt: now,
      });
      sourceCount++;
    }

    // Home & Garden (USDA zone)
    await ctx.db.insert("marketSources", {
      marketId,
      sectionType: "home_garden",
      sourceName: "USDA Plant Hardiness Zone",
      sourceUrl: "https://planthardiness.ars.usda.gov/",
      plugin: "manual",
      category: "gardening",
      enabled: true,
      notes: args.usdaNotes ?? `Zone ${args.usdaZone ?? "unknown"}. Research seasonal tips for ${args.county} County.`,
      priority: 1,
      createdAt: now,
    });
    sourceCount++;

    // Meteorologist corner
    await ctx.db.insert("marketSources", {
      marketId,
      sectionType: "meteorologist_corner",
      sourceName: "NOAA Climate Data",
      sourceUrl: isOhio ? "https://www.weather.gov/cle/" : "https://www.weather.gov/fgz/",
      plugin: "manual",
      category: "weather",
      enabled: true,
      notes: `NWS office for ${args.county} County. Historical averages, seasonal patterns.`,
      priority: 1,
      createdAt: now,
    });
    sourceCount++;

    // Brainteaser (historical society)
    await ctx.db.insert("marketSources", {
      marketId,
      sectionType: "brainteaser",
      sourceName: "Local Historical Society",
      sourceUrl: args.historicalSocietyUrl ?? (isOhio ? "https://www.wrhs.org/" : ""),
      plugin: "manual",
      category: "history",
      enabled: true,
      notes: `Local trivia for ${args.name}. Founding dates, notable residents, landmarks.`,
      priority: 1,
      createdAt: now,
    });
    sourceCount++;

    // Business spotlight (from outreach pipeline)
    await ctx.db.insert("marketSources", {
      marketId,
      sectionType: "business_spotlight",
      sourceName: "Outreach Pipeline",
      sourceUrl: "convex://businesses",
      plugin: "convex_query",
      category: "business",
      enabled: true,
      notes: "Pull confirmed businesses from the businesses table.",
      priority: 1,
      createdAt: now,
    });
    sourceCount++;

    return { marketId, slug: args.slug, sourcesCreated: sourceCount };
  },
});

export const addSource = mutation({
  args: {
    marketSlug: v.string(),
    sectionType: v.string(),
    sourceName: v.string(),
    sourceUrl: v.string(),
    plugin: v.string(),
    category: v.string(),
    notes: v.optional(v.string()),
    selectors: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const market = await ctx.db
      .query("markets")
      .withIndex("by_slug", (q) => q.eq("slug", args.marketSlug))
      .first();
    if (!market) throw new Error(`Market not found: ${args.marketSlug}`);

    return await ctx.db.insert("marketSources", {
      marketId: market._id,
      sectionType: args.sectionType,
      sourceName: args.sourceName,
      sourceUrl: args.sourceUrl,
      plugin: args.plugin,
      category: args.category,
      enabled: true,
      notes: args.notes,
      selectors: args.selectors,
      priority: args.priority ?? 1,
      createdAt: Date.now(),
    });
  },
});
