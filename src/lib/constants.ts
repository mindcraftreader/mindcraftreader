export const SECTION_ORDER = [
  "weather",
  "feature",
  "hs_sports",
  "college_sports",
  "pro_sports",
  "public_safety",
  "home_garden",
  "arts_leisure",
  "community_calendar",
  "business_spotlight",
  "meteorologist_corner",
  "quick_hits",
  "brainteaser",
] as const;

export type SectionType = (typeof SECTION_ORDER)[number];

export const SECTION_LABELS: Record<string, string> = {
  weather: "Weather",
  feature: "Feature",
  hs_sports: "High School Sports",
  college_sports: "College Sports",
  pro_sports: "Pro Sports",
  public_safety: "Public Safety",
  home_garden: "Home & Garden",
  arts_leisure: "Arts & Leisure",
  community_calendar: "Community Calendar",
  business_spotlight: "Business Spotlight",
  meteorologist_corner: "Meteorologist Corner",
  quick_hits: "Quick Hits",
  brainteaser: "Brainteaser",
};

export const MARKETS_SEED = [
  { slug: "hudson-oh", name: "Hudson", state: "OH", county: "Summit", senderName: "The Hudson Weekly" },
  { slug: "lakewood-oh", name: "Lakewood", state: "OH", county: "Cuyahoga", senderName: "The Lakewood Observer" },
  { slug: "tremont-oh", name: "Tremont", state: "OH", county: "Cuyahoga", senderName: "The Tremont Tribune" },
  { slug: "ohio-city-oh", name: "Ohio City", state: "OH", county: "Cuyahoga", senderName: "The Ohio City Chronicle" },
  { slug: "richfield-oh", name: "Richfield", state: "OH", county: "Summit", senderName: "The Richfield Record" },
  { slug: "copley-oh", name: "Copley", state: "OH", county: "Summit", senderName: "The Copley Courier" },
  { slug: "cuyahoga-falls-oh", name: "Cuyahoga Falls", state: "OH", county: "Summit", senderName: "The Falls Weekly" },
  { slug: "oak-creek-az", name: "Oak Creek", state: "AZ", county: "Yavapai", senderName: "The Oak Creek Sun" },
];
