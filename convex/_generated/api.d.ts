/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analyticsData from "../analyticsData.js";
import type * as crons from "../crons.js";
import type * as distributions from "../distributions.js";
import type * as http from "../http.js";
import type * as issues from "../issues.js";
import type * as markets from "../markets.js";
import type * as pipeline_agents from "../pipeline/agents.js";
import type * as pipeline_approvals from "../pipeline/approvals.js";
import type * as pipeline_jobs from "../pipeline/jobs.js";
import type * as pipeline_notifications from "../pipeline/notifications.js";
import type * as pipeline_runs from "../pipeline/runs.js";
import type * as pipeline_scheduler from "../pipeline/scheduler.js";
import type * as sections from "../sections.js";
import type * as subscribers from "../subscribers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analyticsData: typeof analyticsData;
  crons: typeof crons;
  distributions: typeof distributions;
  http: typeof http;
  issues: typeof issues;
  markets: typeof markets;
  "pipeline/agents": typeof pipeline_agents;
  "pipeline/approvals": typeof pipeline_approvals;
  "pipeline/jobs": typeof pipeline_jobs;
  "pipeline/notifications": typeof pipeline_notifications;
  "pipeline/runs": typeof pipeline_runs;
  "pipeline/scheduler": typeof pipeline_scheduler;
  sections: typeof sections;
  subscribers: typeof subscribers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
