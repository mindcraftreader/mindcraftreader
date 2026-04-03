"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MarketContent } from "./MarketContent";

export default function MarketPage() {
  const params = useParams();
  const slug = params.market as string;
  const market = useQuery(api.markets.getBySlug, { slug });

  if (market === undefined) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ fontFamily: "var(--font-meta)" }}
      >
        Loading...
      </div>
    );
  }

  if (market === null) {
    return (
      <div
        className="flex flex-1 items-center justify-center flex-col gap-4"
        style={{ fontFamily: "var(--font-meta)" }}
      >
        <p className="text-xl">Market not found</p>
        <Link href="/" className="underline" style={{ color: "var(--color-accent)" }}>
          Back to all markets
        </Link>
      </div>
    );
  }

  return <MarketContent market={market} slug={slug} />;
}
