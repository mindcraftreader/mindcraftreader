import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

function checkAuth(request: Request): boolean {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const expected = process.env.INGEST_TOKEN;
  if (!expected || !token) return false;
  return token === expected;
}

// POST /api/ingest/issue
// Pipeline pushes a full assembled issue with all sections
http.route({
  path: "/api/ingest/issue",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const {
      market_slug,
      issue_date,
      headline,
      sub_headline,
      word_count,
      page_count,
      pdf_url,
      sections,
    } = body;

    // Find or validate market
    const market = await ctx.runQuery(api.markets.getBySlug, {
      slug: market_slug,
    });
    if (!market) {
      return new Response(
        JSON.stringify({ error: `Market not found: ${market_slug}` }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Create the issue
    const issueId = await ctx.runMutation(api.issues.create, {
      marketId: market._id,
      issueDate: issue_date,
      headline,
      subHeadline: sub_headline,
      status: "published",
      wordCount: word_count ?? 0,
      pageCount: page_count ?? 1,
      pdfUrl: pdf_url,
      canonicalUrl: `/${market_slug}/${issue_date}`,
    });

    // Create all sections
    if (sections && Array.isArray(sections)) {
      for (const section of sections) {
        await ctx.runMutation(api.sections.create, {
          issueId,
          sectionType: section.type,
          title: section.title,
          order: section.order,
          contentHtml: section.content_html,
          contentText: section.content_text ?? "",
          contentJson: section.content_json
            ? JSON.stringify(section.content_json)
            : undefined,
          status: "approved",
          wordCount: section.word_count ?? 0,
          measuredHeight: section.measured_height,
        });
      }
    }

    // Mark web distribution as delivered
    await ctx.runMutation(api.distributions.create, {
      issueId,
      platform: "web",
      status: "delivered",
      externalUrl: `/${market_slug}/${issue_date}`,
    });

    return new Response(
      JSON.stringify({
        issueId,
        canonicalUrl: `/${market_slug}/${issue_date}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

// POST /api/ingest/analytics
http.route({
  path: "/api/ingest/analytics",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    await ctx.runMutation(api.analyticsData.snapshot, body);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/ingest/distribution
http.route({
  path: "/api/ingest/distribution",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    if (body.distribution_id) {
      await ctx.runMutation(api.distributions.updateStatus, {
        distributionId: body.distribution_id,
        status: body.status,
        externalId: body.external_id,
        externalUrl: body.external_url,
        error: body.error,
      });
    } else {
      await ctx.runMutation(api.distributions.create, {
        issueId: body.issue_id,
        platform: body.platform,
        status: body.status,
        externalId: body.external_id,
        externalUrl: body.external_url,
        metadata: body.metadata ? JSON.stringify(body.metadata) : undefined,
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

export default http;
