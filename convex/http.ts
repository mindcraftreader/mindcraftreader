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

function checkAgentAuth(request: Request): boolean {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  const expected = process.env.AGENT_TOKEN;
  if (!expected || !token) return false;
  return token === expected;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ── READER INGEST ENDPOINTS ─────────────────────────

http.route({
  path: "/api/ingest/issue",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const { market_slug, issue_date, headline, sub_headline, word_count, page_count, pdf_url, sections } = body;

    const market = await ctx.runQuery(api.markets.getBySlug, { slug: market_slug });
    if (!market) return json({ error: `Market not found: ${market_slug}` }, 404);

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

    if (sections && Array.isArray(sections)) {
      for (const section of sections) {
        await ctx.runMutation(api.sections.create, {
          issueId,
          sectionType: section.type,
          title: section.title,
          order: section.order,
          contentHtml: section.content_html,
          contentText: section.content_text ?? "",
          contentJson: section.content_json ? JSON.stringify(section.content_json) : undefined,
          status: "approved",
          wordCount: section.word_count ?? 0,
          measuredHeight: section.measured_height,
        });
      }
    }

    await ctx.runMutation(api.distributions.create, {
      issueId,
      platform: "web",
      status: "delivered",
      externalUrl: `/${market_slug}/${issue_date}`,
    });

    return json({ issueId, canonicalUrl: `/${market_slug}/${issue_date}` });
  }),
});

http.route({
  path: "/api/ingest/analytics",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
    const body = await request.json();
    await ctx.runMutation(api.analyticsData.snapshot, body);
    return json({ ok: true });
  }),
});

http.route({
  path: "/api/ingest/distribution",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
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
    return json({ ok: true });
  }),
});

// ── AGENT ENDPOINTS ─────────────────────────────────

http.route({
  path: "/api/agent/claim",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAgentAuth(request)) return new Response("Unauthorized", { status: 401 });

    const { agentRole, agentId } = await request.json();
    if (!agentRole || !agentId) {
      return json({ error: "agentRole and agentId required" }, 400);
    }

    const job = await ctx.runMutation(api.pipeline.jobs.claim, { agentRole, agentId });
    return json({ job: job ?? null });
  }),
});

http.route({
  path: "/api/agent/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAgentAuth(request)) return new Response("Unauthorized", { status: 401 });

    const { jobId, agentId, status, progress } = await request.json();
    const result = await ctx.runMutation(api.pipeline.jobs.heartbeat, {
      jobId,
      agentId,
      status,
      progress,
    });
    return json(result);
  }),
});

http.route({
  path: "/api/agent/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAgentAuth(request)) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    await ctx.runMutation(api.pipeline.jobs.complete, body);
    return json({ ok: true });
  }),
});

http.route({
  path: "/api/agent/fail",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!checkAgentAuth(request)) return new Response("Unauthorized", { status: 401 });

    const { jobId, agentId, error } = await request.json();
    await ctx.runMutation(api.pipeline.jobs.fail, { jobId, agentId, error });
    return json({ ok: true });
  }),
});

http.route({
  path: "/api/agent/job",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!checkAgentAuth(request)) return new Response("Unauthorized", { status: 401 });

    const url = new URL(request.url);
    const jobId = url.searchParams.get("id");
    if (!jobId) return json({ error: "id parameter required" }, 400);

    const job = await ctx.runQuery(api.pipeline.jobs.get, { jobId: jobId as any });
    return json({ job });
  }),
});

// ── PIPELINE STATUS ─────────────────────────────────

http.route({
  path: "/api/pipeline/status",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    if (!checkAuth(request) && !checkAgentAuth(request)) {
      return new Response("Unauthorized", { status: 401 });
    }

    const url = new URL(request.url);
    const marketSlug = url.searchParams.get("market");

    if (marketSlug) {
      const market = await ctx.runQuery(api.markets.getBySlug, { slug: marketSlug });
      if (!market) return json({ error: "Market not found" }, 404);

      const dashboard = await ctx.runQuery(api.pipeline.runs.getDashboard, {
        marketId: market._id,
      });
      return json(dashboard);
    }

    const active = await ctx.runQuery(api.pipeline.runs.listActive, {});
    return json({ runs: active });
  }),
});

// ── SLACK APPROVAL WEBHOOK ──────────────────────────

http.route({
  path: "/api/approval/submit",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const formData = await request.text();
    const payload = JSON.parse(
      decodeURIComponent(formData.replace("payload=", ""))
    );

    const action = payload.actions?.[0];
    if (!action) return new Response("OK", { status: 200 });

    const pipelineRunId = action.value;
    const approver = payload.user?.name ?? "jonah";

    if (action.action_id === "approve_pipeline") {
      await ctx.runMutation(api.pipeline.approvals.submit, {
        pipelineRunId,
        decision: "approve",
        approver,
      });
    } else if (action.action_id === "reject_pipeline") {
      await ctx.runMutation(api.pipeline.approvals.submit, {
        pipelineRunId,
        decision: "reject",
        approver,
        notes: "Rejected via Slack",
      });
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
