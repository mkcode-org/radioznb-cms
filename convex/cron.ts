import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "delete untagged files",
  { hourUTC: 0, minuteUTC: 0 },
  internal.recordings.deleteUntaggedFiles
);

export default crons;
