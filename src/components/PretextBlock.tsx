"use client";

import { useEffect, useRef, useState } from "react";

interface PretextBlockProps {
  text: string;
  font?: string;
  lineHeight?: number;
  className?: string;
}

/**
 * Renders text with pretext's typographic line-breaking engine.
 * Uses OffscreenCanvas (browser-native, no polyfill needed) for text measurement.
 * Falls back to plain text rendering if pretext isn't available.
 */
export function PretextBlock({
  text,
  font = '10.5pt "Unna", Georgia, serif',
  lineHeight = 1.6,
  className,
}: PretextBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function measure() {
      if (!containerRef.current || !text) return;

      // Wait for fonts to load before measuring
      await document.fonts.ready;

      const width = containerRef.current.clientWidth;
      if (width <= 0) return;

      try {
        const pretext = await import("@chenglou/pretext");
        const prepared = pretext.prepare(text, font);
        const laid = pretext.layout(prepared, width);

        if (!cancelled) {
          setLines(laid.map((line: { text: string }) => line.text));
        }
      } catch {
        // pretext not available — fall back to browser text layout
        if (!cancelled) {
          setLines(null);
        }
      }
    }

    measure();

    const observer = new ResizeObserver(() => measure());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [text, font]);

  return (
    <div ref={containerRef} className={className} style={{ lineHeight }}>
      {lines ? (
        lines.map((line, i) => (
          <span key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))
      ) : (
        <p>{text}</p>
      )}
    </div>
  );
}
