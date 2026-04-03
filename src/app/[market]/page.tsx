"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IssueView } from "@/components/newspaper/IssueView";

export default function MarketPage() {
  const params = useParams();
  const slug = params.market as string;

  const market = useQuery(api.markets.getBySlug, { slug });
  const latestIssue = market
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useQuery(api.issues.getLatestPublished, { marketId: market._id })
    : undefined;
  const allIssues = market
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useQuery(api.issues.listByMarket, { marketId: market._id })
    : undefined;

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

  const publishedIssues = (allIssues ?? []).filter(
    (i) => i.status === "published"
  );

  return (
    <div className="flex flex-1">
      {/* Main content */}
      <div className="flex-1 max-w-4xl mx-auto px-4 py-8">
        <header className="mb-8">
          <Link
            href="/"
            className="text-sm uppercase tracking-widest mb-4 block"
            style={{
              fontFamily: "var(--font-meta)",
              color: "var(--color-accent)",
            }}
          >
            &larr; All Markets
          </Link>
          <h1
            className="text-4xl font-black mb-1"
            style={{ fontFamily: "var(--font-masthead)" }}
          >
            {market.senderName}
          </h1>
          <p
            className="text-sm uppercase tracking-widest"
            style={{
              fontFamily: "var(--font-meta)",
              color: "var(--color-text-secondary)",
            }}
          >
            {market.name}, {market.state} &middot; {market.county} County
          </p>
        </header>

        {latestIssue ? (
          <IssueView issueId={latestIssue._id} issue={latestIssue} market={market} />
        ) : (
          <div
            className="text-center py-16"
            style={{ fontFamily: "var(--font-meta)" }}
          >
            No published issues yet. Check back soon.
          </div>
        )}
      </div>

      {/* Archive sidebar */}
      {publishedIssues.length > 0 && (
        <aside
          className="w-64 border-l p-6 hidden lg:block"
          style={{ borderColor: "var(--color-border-light)" }}
        >
          <h3
            className="text-sm uppercase tracking-widest mb-4 font-semibold"
            style={{ fontFamily: "var(--font-meta)" }}
          >
            Archive
          </h3>
          <ul className="space-y-2">
            {publishedIssues.map((issue) => (
              <li key={issue._id}>
                <Link
                  href={`/${slug}/${issue.issueDate}`}
                  className="text-sm hover:underline block"
                  style={{ fontFamily: "var(--font-meta)" }}
                >
                  {issue.issueDate} &mdash; {issue.headline}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      )}
    </div>
  );
}
