import { mutation } from "./_generated/server";

// Every data source for every market for every section type.
// Researchers look this up to know exactly where to get data.

type SourceDef = {
  sectionType: string;
  sourceName: string;
  sourceUrl: string;
  plugin: string;
  category: string;
  enabled: boolean;
  selectors?: string;
  dateFormat?: string;
  apiParams?: string;
  notes?: string;
  priority: number;
};

// ── SHARED / ALL-MARKET SOURCES ─────────────────────

const SHARED_WEATHER: SourceDef = {
  sectionType: "weather",
  sourceName: "Open-Meteo API",
  sourceUrl: "https://api.open-meteo.com/v1/forecast",
  plugin: "weather_api",
  category: "weather",
  enabled: true,
  apiParams: JSON.stringify({
    params: "daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&temperature_unit=fahrenheit&timezone=auto",
    note: "Append &latitude=X&longitude=Y per market",
  }),
  notes: "7-day forecast. Coordinates per market. Free, no key needed.",
  priority: 1,
};

const SHARED_PRO_SPORTS: SourceDef[] = [
  { sectionType: "pro_sports", sourceName: "ESPN API", sourceUrl: "https://site.api.espn.com/apis/site/v2/sports", plugin: "json_api", category: "sports", enabled: true, apiParams: JSON.stringify({ endpoints: { mlb: "/baseball/mlb/scoreboard", nba: "/basketball/nba/scoreboard", nfl: "/football/nfl/scoreboard", nhl: "/hockey/nhl/scoreboard", mls: "/soccer/usa.1/scoreboard" } }), notes: "Free public API. Filter by team IDs.", priority: 1 },
  { sectionType: "pro_sports", sourceName: "ESPN Schedule", sourceUrl: "https://www.espn.com/", plugin: "html_calendar", category: "sports", enabled: true, notes: "Fallback: scrape schedule pages per team.", priority: 2 },
];

const SHARED_COLLEGE: SourceDef[] = [
  { sectionType: "college_sports", sourceName: "ESPN College API", sourceUrl: "https://site.api.espn.com/apis/site/v2/sports", plugin: "json_api", category: "sports", enabled: true, notes: "Same ESPN API, filter by college team IDs.", priority: 1 },
];

const REGIONAL_OHIO_SOURCES: SourceDef[] = [
  // Arts & Leisure
  { sectionType: "arts_leisure", sourceName: "Cleveland Museum of Art", sourceUrl: "https://www.clevelandart.org/calendar", plugin: "html_calendar", category: "arts", enabled: true, priority: 2 },
  { sectionType: "arts_leisure", sourceName: "Beachland Ballroom", sourceUrl: "https://www.beachlandballroom.com/events", plugin: "html_calendar", category: "music", enabled: true, priority: 3 },
  { sectionType: "arts_leisure", sourceName: "Grog Shop", sourceUrl: "https://grogshop.gs/calendar/", plugin: "html_calendar", category: "music", enabled: true, priority: 3 },
  { sectionType: "arts_leisure", sourceName: "Music Box Supper Club", sourceUrl: "https://www.musicboxcle.com/calendar/", plugin: "html_calendar", category: "music", enabled: true, priority: 3 },
  { sectionType: "arts_leisure", sourceName: "Blossom Music Center", sourceUrl: "https://www.livenation.com/venue/KovZpZAEk7aA/blossom-music-center-events", plugin: "html_calendar", category: "music", enabled: true, priority: 3 },
  // Community Calendar
  { sectionType: "community_calendar", sourceName: "Cleveland Public Library", sourceUrl: "https://cpl.org/events/", plugin: "html_calendar", category: "library", enabled: true, priority: 3 },
  { sectionType: "community_calendar", sourceName: "Akron-Summit County Library", sourceUrl: "https://www.akronlibrary.org/events", plugin: "html_calendar", category: "library", enabled: true, priority: 3 },
  // Feature / General
  { sectionType: "feature", sourceName: "Cleveland Scene", sourceUrl: "https://www.clevescene.com/cleveland/Rss.xml", plugin: "rss_feed", category: "news", enabled: true, notes: "Restaurant openings, local features, event previews.", priority: 2 },
  { sectionType: "feature", sourceName: "Cleveland.com Food", sourceUrl: "https://www.cleveland.com/food/", plugin: "rss_feed", category: "news", enabled: true, priority: 3 },
  { sectionType: "feature", sourceName: "r/Cleveland", sourceUrl: "https://www.reddit.com/r/Cleveland/.rss", plugin: "rss_feed", category: "social", enabled: true, notes: "Community pulse. Look for trending local topics.", priority: 4 },
  // Public Safety
  { sectionType: "public_safety", sourceName: "r/Cleveland (Safety)", sourceUrl: "https://www.reddit.com/r/Cleveland/.rss", plugin: "rss_feed", category: "social", enabled: true, notes: "Filter for safety/crime/council keywords.", priority: 4 },
];

const REGIONAL_AZ_SOURCES: SourceDef[] = [
  { sectionType: "arts_leisure", sourceName: "Sedona Arts Center", sourceUrl: "https://www.sedonaartscenter.org/events", plugin: "html_calendar", category: "arts", enabled: true, priority: 2 },
  { sectionType: "community_calendar", sourceName: "Sedona Public Library", sourceUrl: "https://www.sedonalibrary.org/events", plugin: "html_calendar", category: "library", enabled: true, priority: 2 },
  { sectionType: "feature", sourceName: "Sedona Red Rock News", sourceUrl: "https://www.redrocknews.com/feed/", plugin: "rss_feed", category: "news", enabled: true, priority: 2 },
];

// ── PER-MARKET SOURCES ──────────────────────────────

const MARKET_SOURCES: Record<string, SourceDef[]> = {
  "hudson-oh": [
    { sectionType: "community_calendar", sourceName: "Hudson City Events", sourceUrl: "https://www.hudson.oh.us/Calendar.aspx", plugin: "html_calendar", category: "government", enabled: true, selectors: JSON.stringify({ event_container: ".event-item", title: ".event-title", date: ".event-date", time: ".event-time", location: ".event-location", link: ".event-title a@href" }), priority: 1 },
    { sectionType: "community_calendar", sourceName: "Hudson Parks & Rec", sourceUrl: "https://www.hudson.oh.us/225/Parks-Recreation", plugin: "html_calendar", category: "parks", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "Hudson Library", sourceUrl: "https://hudsonlibrary.org/events/", plugin: "html_calendar", category: "library", enabled: true, priority: 1 },
    { sectionType: "hs_sports", sourceName: "Hudson Explorers (MaxPreps)", sourceUrl: "https://www.maxpreps.com/oh/hudson/hudson-explorers/", plugin: "html_calendar", category: "sports", enabled: true, notes: "Hudson High School. Suburban League. Scrape schedule page.", priority: 1 },
    { sectionType: "hs_sports", sourceName: "Hudson City Schools Athletics", sourceUrl: "https://www.hudson.k12.oh.us/domain/athletics", plugin: "html_calendar", category: "sports", enabled: true, priority: 2 },
    { sectionType: "public_safety", sourceName: "Hudson City Council", sourceUrl: "https://www.hudson.oh.us/AgendaCenter", plugin: "html_calendar", category: "government", enabled: true, notes: "Council agendas, minutes, public meetings.", priority: 1 },
    { sectionType: "public_safety", sourceName: "Hudson Police Dept", sourceUrl: "https://www.hudson.oh.us/165/Police-Department", plugin: "html_calendar", category: "safety", enabled: true, notes: "Check for press releases, incident reports.", priority: 1 },
    { sectionType: "college_sports", sourceName: "University of Akron Zips", sourceUrl: "https://gozips.com/calendar", plugin: "html_calendar", category: "sports", enabled: true, notes: "MAC D1. Primary college for Summit County markets.", priority: 1 },
  ],

  "lakewood-oh": [
    { sectionType: "community_calendar", sourceName: "Lakewood City Events", sourceUrl: "https://www.lakewoodoh.gov/calendar.aspx", plugin: "html_calendar", category: "government", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "Lakewood Parks & Rec", sourceUrl: "https://www.lakewoodoh.gov/departments/parks-and-recreation", plugin: "html_calendar", category: "parks", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "Lakewood Public Library", sourceUrl: "https://www.lkwdpl.org/events", plugin: "html_calendar", category: "library", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "Rising Star Coffee Lakewood", sourceUrl: "https://risingstarcoffee.com/pages/events", plugin: "html_calendar", category: "coffee", enabled: true, priority: 3 },
    { sectionType: "hs_sports", sourceName: "Lakewood Rangers (MaxPreps)", sourceUrl: "https://www.maxpreps.com/oh/lakewood/lakewood-rangers/", plugin: "html_calendar", category: "sports", enabled: true, notes: "Lakewood High School Rangers.", priority: 1 },
    { sectionType: "hs_sports", sourceName: "St. Edward Eagles (MaxPreps)", sourceUrl: "https://www.maxpreps.com/oh/lakewood/st-edward-eagles/", plugin: "html_calendar", category: "sports", enabled: true, notes: "Nearby powerhouse. Include if relevant.", priority: 2 },
    { sectionType: "public_safety", sourceName: "Lakewood City Council", sourceUrl: "https://www.lakewoodoh.gov/council/", plugin: "html_calendar", category: "government", enabled: true, priority: 1 },
  ],

  "tremont-oh": [
    { sectionType: "community_calendar", sourceName: "Tremont West Dev Corp", sourceUrl: "https://tremontwest.org/events/", plugin: "html_calendar", category: "community", enabled: true, priority: 1 },
    { sectionType: "arts_leisure", sourceName: "Cleveland Museum of Art", sourceUrl: "https://www.clevelandart.org/calendar", plugin: "html_calendar", category: "arts", enabled: true, notes: "Walking distance from Tremont.", priority: 1 },
    { sectionType: "hs_sports", sourceName: "Lincoln-West Wolverines", sourceUrl: "https://www.maxpreps.com/oh/cleveland/lincoln-west-wolverines/", plugin: "html_calendar", category: "sports", enabled: true, priority: 1 },
    { sectionType: "public_safety", sourceName: "Cleveland Ward 3 Council", sourceUrl: "https://www.clevelandcitycouncil.org/", plugin: "html_calendar", category: "government", enabled: true, notes: "Tremont is in Cleveland Ward 3.", priority: 1 },
  ],

  "ohio-city-oh": [
    { sectionType: "community_calendar", sourceName: "Ohio City Incorporated", sourceUrl: "https://www.ohiocity.org/events", plugin: "html_calendar", category: "community", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "West Side Market", sourceUrl: "https://www.westsidemarket.org/events", plugin: "html_calendar", category: "market", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "Rising Star Coffee Ohio City", sourceUrl: "https://risingstarcoffee.com/pages/events", plugin: "html_calendar", category: "coffee", enabled: true, priority: 3 },
    { sectionType: "hs_sports", sourceName: "St. Ignatius Wildcats", sourceUrl: "https://www.maxpreps.com/oh/cleveland/st-ignatius-wildcats/", plugin: "html_calendar", category: "sports", enabled: true, notes: "Top Ohio City school. Major athletics program.", priority: 1 },
    { sectionType: "public_safety", sourceName: "Cleveland Ward 3 Council", sourceUrl: "https://www.clevelandcitycouncil.org/", plugin: "html_calendar", category: "government", enabled: true, priority: 1 },
  ],

  "richfield-oh": [
    { sectionType: "community_calendar", sourceName: "Richfield Township Events", sourceUrl: "https://www.richfieldohio.org/calendar.aspx", plugin: "html_calendar", category: "government", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "Richfield Parks & Rec", sourceUrl: "https://www.richfieldohio.org/departments/parks-recreation", plugin: "html_calendar", category: "parks", enabled: true, priority: 1 },
    { sectionType: "hs_sports", sourceName: "Revere Minutemen (MaxPreps)", sourceUrl: "https://www.maxpreps.com/oh/richfield/revere-minutemen/", plugin: "html_calendar", category: "sports", enabled: true, notes: "Revere High School serves Richfield.", priority: 1 },
    { sectionType: "public_safety", sourceName: "Richfield Township Trustees", sourceUrl: "https://www.richfieldohio.org/government/trustees", plugin: "html_calendar", category: "government", enabled: true, priority: 1 },
    { sectionType: "college_sports", sourceName: "University of Akron Zips", sourceUrl: "https://gozips.com/calendar", plugin: "html_calendar", category: "sports", enabled: true, priority: 1 },
  ],

  "copley-oh": [
    { sectionType: "community_calendar", sourceName: "Copley Township Events", sourceUrl: "https://www.copley.oh.us/calendar.aspx", plugin: "html_calendar", category: "government", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "Copley Parks & Rec", sourceUrl: "https://www.copley.oh.us/departments/parks-recreation", plugin: "html_calendar", category: "parks", enabled: true, priority: 1 },
    { sectionType: "hs_sports", sourceName: "Copley Indians (MaxPreps)", sourceUrl: "https://www.maxpreps.com/oh/copley/copley-indians/", plugin: "html_calendar", category: "sports", enabled: true, priority: 1 },
    { sectionType: "public_safety", sourceName: "Copley Township Trustees", sourceUrl: "https://www.copley.oh.us/government/trustees", plugin: "html_calendar", category: "government", enabled: true, priority: 1 },
    { sectionType: "college_sports", sourceName: "University of Akron Zips", sourceUrl: "https://gozips.com/calendar", plugin: "html_calendar", category: "sports", enabled: true, priority: 1 },
  ],

  "cuyahoga-falls-oh": [
    { sectionType: "community_calendar", sourceName: "CF City Events", sourceUrl: "https://www.cityofcf.com/calendar.aspx", plugin: "html_calendar", category: "government", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "CF Parks & Rec", sourceUrl: "https://www.cityofcf.com/departments/parks-recreation", plugin: "html_calendar", category: "parks", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "CF Library", sourceUrl: "https://www.cuyahogafallslibrary.org/events", plugin: "html_calendar", category: "library", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "Nervous Dog Coffee CF", sourceUrl: "https://nervousdogcoffee.com/events", plugin: "html_calendar", category: "coffee", enabled: true, priority: 3 },
    { sectionType: "hs_sports", sourceName: "CF Black Tigers (MaxPreps)", sourceUrl: "https://www.maxpreps.com/oh/cuyahoga-falls/cuyahoga-falls-black-tigers/", plugin: "html_calendar", category: "sports", enabled: true, notes: "Suburban League. Primary HS.", priority: 1 },
    { sectionType: "hs_sports", sourceName: "Walsh Jesuit Warriors", sourceUrl: "https://www.maxpreps.com/oh/cuyahoga-falls/walsh-jesuit-warriors/", plugin: "html_calendar", category: "sports", enabled: true, notes: "Nearby private school, strong athletics.", priority: 2 },
    { sectionType: "public_safety", sourceName: "CF City Council", sourceUrl: "https://www.cityofcf.com/government/city-council", plugin: "html_calendar", category: "government", enabled: true, priority: 1 },
    { sectionType: "public_safety", sourceName: "CF Police Department", sourceUrl: "https://www.cityofcf.com/departments/police", plugin: "html_calendar", category: "safety", enabled: true, priority: 1 },
    { sectionType: "college_sports", sourceName: "University of Akron Zips", sourceUrl: "https://gozips.com/calendar", plugin: "html_calendar", category: "sports", enabled: true, priority: 1 },
    { sectionType: "college_sports", sourceName: "Kent State Golden Flashes", sourceUrl: "https://kentstatesports.com/calendar", plugin: "html_calendar", category: "sports", enabled: true, priority: 2 },
  ],

  "oak-creek-az": [
    { sectionType: "community_calendar", sourceName: "Village of Oak Creek Events", sourceUrl: "https://www.villageofoakcreek.com/events", plugin: "html_calendar", category: "community", enabled: true, priority: 1 },
    { sectionType: "community_calendar", sourceName: "Sedona Chamber of Commerce", sourceUrl: "https://visitsedona.com/events/", plugin: "html_calendar", category: "tourism", enabled: true, priority: 1 },
    { sectionType: "arts_leisure", sourceName: "Sedona Arts Center", sourceUrl: "https://www.sedonaartscenter.org/events", plugin: "html_calendar", category: "arts", enabled: true, priority: 1 },
    { sectionType: "arts_leisure", sourceName: "Sedona Film Festival", sourceUrl: "https://sedonafilmfestival.com/", plugin: "html_calendar", category: "arts", enabled: true, priority: 2 },
    { sectionType: "hs_sports", sourceName: "Sedona Red Rock HS (MaxPreps)", sourceUrl: "https://www.maxpreps.com/az/sedona/sedona-red-rock-scorpions/", plugin: "html_calendar", category: "sports", enabled: true, priority: 1 },
    { sectionType: "public_safety", sourceName: "Yavapai County Sheriff", sourceUrl: "https://www.yavapai.us/sheriff", plugin: "html_calendar", category: "safety", enabled: true, priority: 1 },
    { sectionType: "college_sports", sourceName: "Northern Arizona Lumberjacks", sourceUrl: "https://nauathletics.com/calendar", plugin: "html_calendar", category: "sports", enabled: true, notes: "FCS D1. Flagstaff, ~1hr from Oak Creek.", priority: 1 },
    { sectionType: "feature", sourceName: "Sedona Red Rock News", sourceUrl: "https://www.redrocknews.com/feed/", plugin: "rss_feed", category: "news", enabled: true, priority: 1 },
  ],
};

// Market coordinates for weather API
const MARKET_COORDS: Record<string, { lat: number; lon: number }> = {
  "hudson-oh": { lat: 41.2401, lon: -81.4407 },
  "lakewood-oh": { lat: 41.4820, lon: -81.8002 },
  "tremont-oh": { lat: 41.4820, lon: -81.7000 },
  "ohio-city-oh": { lat: 41.4830, lon: -81.7000 },
  "richfield-oh": { lat: 41.2398, lon: -81.6382 },
  "copley-oh": { lat: 41.0995, lon: -81.6446 },
  "cuyahoga-falls-oh": { lat: 41.1339, lon: -81.4846 },
  "oak-creek-az": { lat: 34.7803, lon: -111.7609 },
};

// Pro teams by region
const OHIO_PRO_TEAMS = "Cleveland Guardians (MLB), Cleveland Cavaliers (NBA), Cleveland Browns (NFL), Columbus Crew (MLS), Columbus Blue Jackets (NHL)";
const AZ_PRO_TEAMS = "Arizona Diamondbacks (MLB), Phoenix Suns (NBA), Phoenix Mercury (WNBA), Arizona Cardinals (NFL), Phoenix Rising FC (MLS Next Pro)";

export const seedSources = mutation({
  args: {},
  handler: async (ctx) => {
    // Clear existing sources
    const existing = await ctx.db.query("marketSources").collect();
    for (const s of existing) await ctx.db.delete(s._id);

    const markets = await ctx.db
      .query("markets")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const marketMap = new Map(markets.map((m) => [m.slug, m]));
    let total = 0;
    const now = Date.now();

    for (const [slug, market] of marketMap) {
      const isOhio = market.state === "OH";
      const coords = MARKET_COORDS[slug];

      // Weather source (per market with coordinates)
      await ctx.db.insert("marketSources", {
        marketId: market._id,
        sectionType: "weather",
        sourceName: "Open-Meteo API",
        sourceUrl: `https://api.open-meteo.com/v1/forecast?latitude=${coords?.lat}&longitude=${coords?.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode&temperature_unit=fahrenheit&timezone=auto`,
        plugin: "weather_api",
        category: "weather",
        enabled: true,
        notes: "Free API, no key. Returns 7-day forecast.",
        priority: 1,
        createdAt: now,
      });
      total++;

      // Pro sports (region-specific)
      await ctx.db.insert("marketSources", {
        marketId: market._id,
        sectionType: "pro_sports",
        sourceName: "ESPN API",
        sourceUrl: "https://site.api.espn.com/apis/site/v2/sports",
        plugin: "json_api",
        category: "sports",
        enabled: true,
        apiParams: JSON.stringify({
          endpoints: { mlb: "/baseball/mlb/scoreboard", nba: "/basketball/nba/scoreboard", nfl: "/football/nfl/scoreboard" },
          teams: isOhio ? OHIO_PRO_TEAMS : AZ_PRO_TEAMS,
        }),
        notes: isOhio ? `Pro teams: ${OHIO_PRO_TEAMS}` : `Pro teams: ${AZ_PRO_TEAMS}`,
        priority: 1,
        createdAt: now,
      });
      total++;

      // Home & Garden (USDA zone based)
      await ctx.db.insert("marketSources", {
        marketId: market._id,
        sectionType: "home_garden",
        sourceName: "USDA Plant Hardiness Zone",
        sourceUrl: isOhio ? "https://planthardiness.ars.usda.gov/" : "https://planthardiness.ars.usda.gov/",
        plugin: "manual",
        category: "gardening",
        enabled: true,
        notes: isOhio ? "Zone 6a (Summit/Cuyahoga County). Spring planting: peas, lettuce, spinach Apr. Tomatoes after May 15 frost date." : "Zone 8a (Yavapai County). Desert gardening: cacti, succulents, drought-tolerant. Hot season starts April.",
        priority: 1,
        createdAt: now,
      });
      total++;

      // Meteorologist corner
      await ctx.db.insert("marketSources", {
        marketId: market._id,
        sectionType: "meteorologist_corner",
        sourceName: "NOAA Climate Data",
        sourceUrl: "https://www.weather.gov/cle/",
        plugin: "manual",
        category: "weather",
        enabled: true,
        notes: isOhio ? "NWS Cleveland office. Historical averages, seasonal patterns, lake effect snow analysis." : "NWS Flagstaff office: https://www.weather.gov/fgz/. Monsoon season, wildfire risk, elevation weather patterns.",
        priority: 1,
        createdAt: now,
      });
      total++;

      // Brainteaser (local history sources)
      await ctx.db.insert("marketSources", {
        marketId: market._id,
        sectionType: "brainteaser",
        sourceName: "Local Historical Society",
        sourceUrl: isOhio ? "https://www.wrhs.org/" : "https://sedonaheritagemuseum.org/",
        plugin: "manual",
        category: "history",
        enabled: true,
        notes: isOhio ? `Western Reserve Historical Society + ${market.county} County historical records. Local trivia: founding dates, notable residents, landmarks.` : "Sedona Heritage Museum. Red rock geology, Native American history, early settlers trivia.",
        priority: 1,
        createdAt: now,
      });
      total++;

      // Business spotlight (manual/outreach driven)
      await ctx.db.insert("marketSources", {
        marketId: market._id,
        sectionType: "business_spotlight",
        sourceName: "Outreach Pipeline",
        sourceUrl: "convex://businesses",
        plugin: "convex_query",
        category: "business",
        enabled: true,
        notes: "Pull confirmed businesses from the businesses table. Check outreachStatus=confirmed. Include coupon data.",
        priority: 1,
        createdAt: now,
      });
      total++;

      // Market-specific sources
      const marketSpecific = MARKET_SOURCES[slug] ?? [];
      for (const src of marketSpecific) {
        await ctx.db.insert("marketSources", {
          marketId: market._id,
          ...src,
          createdAt: now,
        });
        total++;
      }

      // Regional sources
      const regional = isOhio ? REGIONAL_OHIO_SOURCES : REGIONAL_AZ_SOURCES;
      for (const src of regional) {
        await ctx.db.insert("marketSources", {
          marketId: market._id,
          ...src,
          createdAt: now,
        });
        total++;
      }
    }

    return { total, markets: marketMap.size };
  },
});
