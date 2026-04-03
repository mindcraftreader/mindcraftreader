import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Reap stale jobs (no heartbeat for 3 min) every 2 minutes
crons.interval(
  "reap stale jobs",
  { minutes: 2 },
  internal.pipeline.jobs.reapStaleJobs
);

// Auto-create pipeline runs for all active markets every Monday at 1 PM UTC (8 AM ET)
crons.cron(
  "weekly pipeline kickoff",
  "0 13 * * 1",
  internal.pipeline.scheduler.createWeeklyRuns
);

export default crons;
