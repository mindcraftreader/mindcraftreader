"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { IssueView } from "@/components/newspaper/IssueView";

export default function IssuePage() {
  const params = useParams();
  const slug = params.market as string;
  const issueDate = params.issueDate as string;

  const market = useQuery(api.markets.getBySlug, { slug });
  const issue = market
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useQuery(api.issues.getByMarketDate, {
        marketId: market._id,
        issueDate,
      })
    : undefined;

  if (market === undefined || issue === undefined) {
    return (
      <div
        className="flex flex-1 items-center justify-center"
        style={{ fontFamily: "var(--font-meta)" }}
      >
        Loading...
      </div>
    );
  }

  if (!market || !issue) {
    return (
      <div
        className="flex flex-1 items-center justify-center flex-col gap-4"
        style={{ fontFamily: "var(--font-meta)" }}
      >
        <p className="text-xl">Issue not found</p>
        <Link href="/" className="underline" style={{ color: "var(--color-accent)" }}>
          Back to all markets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <nav className="mb-6 flex gap-2 text-sm" style={{ fontFamily: "var(--font-meta)" }}>
        <Link href="/" className="hover:underline" style={{ color: "var(--color-accent)" }}>
          Home
        </Link>
        <span style={{ color: "var(--color-text-secondary)" }}>/</span>
        <Link
          href={`/${slug}`}
          className="hover:underline"
          style={{ color: "var(--color-accent)" }}
        >
          {market.senderName}
        </Link>
        <span style={{ color: "var(--color-text-secondary)" }}>/</span>
        <span style={{ color: "var(--color-text-secondary)" }}>{issueDate}</span>
      </nav>

      <IssueView issueId={issue._id} issue={issue} market={market} />
    </div>
  );
}
