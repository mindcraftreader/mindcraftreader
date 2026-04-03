"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import Link from "next/link";

export default function SubscribePage() {
  const markets = useQuery(api.markets.list);
  const subscribe = useMutation(api.subscribers.subscribe);

  const [email, setEmail] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !selectedMarket) return;

    setSubmitting(true);
    try {
      const res = await subscribe({
        email,
        marketId: selectedMarket as Id<"markets">,
        source: "web",
      });
      setResult(
        res.status === "already_subscribed"
          ? "You're already subscribed to this market."
          : "Subscribed! Watch your inbox."
      );
      setEmail("");
    } catch {
      setResult("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-md bg-white p-8 border" style={{ borderColor: "var(--color-border-light)" }}>
        <Link
          href="/"
          className="text-sm uppercase tracking-widest mb-6 block"
          style={{ fontFamily: "var(--font-meta)", color: "var(--color-accent)" }}
        >
          &larr; Back
        </Link>

        <h1
          className="text-3xl font-black mb-2"
          style={{ fontFamily: "var(--font-masthead)" }}
        >
          Subscribe
        </h1>
        <p
          className="mb-6"
          style={{ fontFamily: "var(--font-meta)", color: "var(--color-text-secondary)", fontSize: "var(--size-meta)" }}
        >
          Get your neighborhood newspaper delivered to your inbox every Thursday.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-1 font-semibold"
              style={{ fontFamily: "var(--font-meta)" }}
            >
              Your Market
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              required
              className="w-full border p-2 text-sm"
              style={{ fontFamily: "var(--font-meta)", borderColor: "var(--color-border-light)" }}
            >
              <option value="">Select your neighborhood...</option>
              {(markets ?? []).map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}, {m.state}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className="block text-xs uppercase tracking-widest mb-1 font-semibold"
              style={{ fontFamily: "var(--font-meta)" }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border p-2 text-sm"
              style={{ fontFamily: "var(--font-meta)", borderColor: "var(--color-border-light)" }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 text-white text-sm font-semibold uppercase tracking-widest transition-opacity disabled:opacity-50"
            style={{ fontFamily: "var(--font-meta)", background: "var(--color-accent)" }}
          >
            {submitting ? "Subscribing..." : "Subscribe Free"}
          </button>
        </form>

        {result && (
          <p
            className="mt-4 text-sm text-center"
            style={{ fontFamily: "var(--font-meta)", color: "var(--color-accent)" }}
          >
            {result}
          </p>
        )}
      </div>
    </div>
  );
}
