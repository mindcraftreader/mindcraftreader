"use client";

import { Doc } from "../../../convex/_generated/dataModel";
import { SECTION_LABELS } from "@/lib/constants";

interface SectionRendererProps {
  section: Doc<"sections">;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const label = SECTION_LABELS[section.sectionType] ?? section.title;

  return (
    <section
      className="pb-4"
      style={{ borderBottom: "1px solid var(--color-border-light)" }}
    >
      {/* Section header */}
      <div
        className="flex items-center gap-3 mb-3 pb-2"
        style={{ borderBottom: "2px solid var(--color-border)" }}
      >
        <h3
          className="font-bold uppercase tracking-widest"
          style={{
            fontFamily: "var(--font-meta)",
            fontSize: "var(--size-label)",
            color: "var(--color-accent)",
          }}
        >
          {label}
        </h3>
        <div
          className="flex-1 h-px"
          style={{ background: "var(--color-border-light)" }}
        />
      </div>

      {/* Section title (if different from section type label) */}
      {section.title !== label && (
        <h4
          className="font-bold mb-2 leading-tight"
          style={{
            fontFamily: "var(--font-masthead)",
            fontSize: "1.25rem",
          }}
        >
          {section.title}
        </h4>
      )}

      {/* Content */}
      <div
        className="newspaper-section-body"
        style={{
          fontFamily: "var(--font-body)",
          fontSize: "var(--size-body)",
          lineHeight: 1.6,
        }}
        dangerouslySetInnerHTML={{ __html: section.contentHtml }}
      />
    </section>
  );
}
