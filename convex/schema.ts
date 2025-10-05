import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Id } from "./_generated/dataModel";

const applicationTables = {
  programs: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    hostId: v.optional(v.id("people")),
  }),
  people: defineTable({
    name: v.string(),
    telegramAccount: v.optional(v.string()),
  }),
  genres: defineTable({
    name: v.string(),
  }).index("by_name", ["name"]),
  recordings: defineTable({
    programId: v.id("programs"),
    episodeTitle: v.string(),
    description: v.optional(v.string()),
    type: v.union(v.literal("live"), v.literal("podcast")),
    airDate: v.string(),
    duration: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("hidden")
    ),
    keywords: v.optional(v.string()),
    audioFileId: v.id("_storage"),
  })
    .index("by_program", ["programId"])
    .index("by_air_date", ["airDate"])
    .index("by_status", ["status"]),
  recordingGenres: defineTable({
    recordingId: v.id("recordings"),
    genreId: v.id("genres"),
  })
    .index("by_recording", ["recordingId"])
    .index("by_genre", ["genreId"]),
  recordingPeople: defineTable({
    recordingId: v.id("recordings"),
    personId: v.id("people"),
    role: v.union(v.literal("host"), v.literal("guest")),
  })
    .index("by_recording", ["recordingId"])
    .index("by_person", ["personId"])
    .index("by_recording_and_person", ["recordingId", "personId"]),
};

export type Recording = {
  _id: Id<"recordings">;
} & (typeof applicationTables)["recordings"];

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
