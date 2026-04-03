"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Link from "next/link";

export default function Home() {
  const markets = useQuery(api.markets.list);

  return (
    <div className="flex flex-col flex-1 items-center px-4 py-12">
      <header className="text-center mb-12">
        <h1
          className="text-5xl font-black tracking-tight mb-2"
          style={{ fontFamily: "var(--font-masthead)" }}
        >
          MindCraft Reader
        </h1>
        <p
          className="text-lg"
          style={{
            fontFamily: "var(--font-meta)",
            color: "var(--color-text-secondary)",
          }}
        >
          Hyperlocal newspapers for your neighborhood
        </p>
      </header>

      {markets === undefined ? (
        <div
          className="text-center py-16"
          style={{ fontFamily: "var(--font-meta)" }}
        >
          Loading markets...
        </div>
      ) : markets.length === 0 ? (
        <div
          className="text-center py-16 max-w-md"
          style={{ fontFamily: "var(--font-meta)" }}
        >
          <p className="text-xl mb-4">No markets yet</p>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Markets will appear here once the pipeline publishes its first
            issue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {markets.map((market) => (
            <Link
              key={market._id}
              href={`/${market.slug}`}
              className="bg-white border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <h2
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "var(--font-masthead)" }}
              >
                {market.senderName}
              </h2>
              <p
                className="text-sm uppercase tracking-widest mb-3"
                style={{
                  fontFamily: "var(--font-meta)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {market.name}, {market.state}
              </p>
              <div
                className="text-xs pt-3 border-t"
                style={{
                  fontFamily: "var(--font-meta)",
                  color: "var(--color-text-secondary)",
                  borderColor: "var(--color-border-light)",
                }}
              >
                {market.subscriberCount} subscribers
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
