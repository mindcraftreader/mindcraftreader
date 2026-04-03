"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id, Doc } from "../../../convex/_generated/dataModel";
import { SectionRenderer } from "./SectionRenderer";
import Link from "next/link";

interface IssueViewProps {
  issueId: Id<"issues">;
  issue: Doc<"issues">;
  market: Doc<"markets">;
}

export function IssueView({ issueId, issue, market }: IssueViewProps) {
  const sections = useQuery(api.sections.listByIssue, { issueId });

  return (
    <article className="bg-white" style={{ fontFamily: "var(--font-body)" }}>
      {/* Masthead */}
      <header
        className="text-center pb-3 mb-4"
        style={{ borderBottom: "3px double var(--color-border)" }}
      >
        <h1
          className="font-black leading-none mb-1"
          style={{
            fontFamily: "var(--font-masthead)",
            fontSize: "var(--size-nameplate)",
            letterSpacing: "-0.02em",
          }}
        >
          {market.senderName}
        </h1>
        <p
          className="uppercase tracking-widest mb-2"
          style={{
            fontFamily: "var(--font-meta)",
            fontSize: "var(--size-meta)",
            color: "var(--color-text-secondary)",
            letterSpacing: "0.2em",
          }}
        >
          Your Trusted Source for {market.name} News
        </p>
        <div
          className="flex justify-between items-center pt-2"
          style={{
            fontFamily: "var(--font-meta)",
            fontSize: "var(--size-meta)",
            borderTop: "1px solid var(--color-border-light)",
          }}
        >
          <span>
            {market.name}, {market.state}
          </span>
          <span>{issue.issueDate}</span>
          <span>{market.subscriberCount} subscribers</span>
        </div>
      </header>

      {/* Lead headline */}
      <div className="mb-6">
        <h2
          className="font-bold leading-tight mb-2"
          style={{
            fontFamily: "var(--font-masthead)",
            fontSize: "var(--size-hed)",
          }}
        >
          {issue.headline}
        </h2>
        {issue.subHeadline && (
          <p
            className="italic"
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "var(--size-dek)",
              color: "var(--color-text-secondary)",
            }}
          >
            {issue.subHeadline}
          </p>
        )}
      </div>

      {/* Sections */}
      {sections === undefined ? (
        <div
          className="text-center py-8"
          style={{ fontFamily: "var(--font-meta)" }}
        >
          Loading sections...
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => (
            <SectionRenderer key={section._id} section={section} />
          ))}
        </div>
      )}

      {/* Footer */}
      <footer
        className="mt-8 pt-4 text-center"
        style={{
          borderTop: "2px solid var(--color-border)",
          fontFamily: "var(--font-meta)",
          fontSize: "var(--size-caption)",
          color: "var(--color-text-secondary)",
        }}
      >
        <p className="mb-2">
          {market.senderName} &middot; {market.name}, {market.state}
        </p>
        <Link
          href="/subscribe"
          className="font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-accent)" }}
        >
          Subscribe Free
        </Link>
        {issue.pdfUrl && (
          <>
            {" "}
            &middot;{" "}
            <a
              href={issue.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-accent)" }}
            >
              Download PDF
            </a>
          </>
        )}
      </footer>
    </article>
  );
}
