import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAuth(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required");
  }
  return userId;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const recordings = await ctx.db.query("recordings").order("desc").collect();

    // Enrich with program data
    const enriched = await Promise.all(
      recordings.map(async (recording) => {
        const program = await ctx.db.get(recording.programId);
        return {
          ...recording,
          program: program?.name || "Неизвестная программа",
        };
      })
    );

    return enriched;
  },
});

export const get = query({
  args: { id: v.id("recordings") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const recording = await ctx.db.get(args.id);
    if (!recording) return null;

    // Get associated data
    const program = await ctx.db.get(recording.programId);

    // Get genres
    const recordingGenres = await ctx.db
      .query("recordingGenres")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.id))
      .collect();

    const genres = await Promise.all(
      recordingGenres.map(async (rg) => {
        const genre = await ctx.db.get(rg.genreId);
        return genre;
      })
    );

    // Get people
    const recordingPeople = await ctx.db
      .query("recordingPeople")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.id))
      .collect();

    const people = await Promise.all(
      recordingPeople.map(async (rp) => {
        const person = await ctx.db.get(rp.personId);
        return {
          ...person,
          role: rp.role,
        };
      })
    );

    return {
      ...recording,
      program,
      genres: genres.filter(Boolean),
      people: people.filter(Boolean),
    };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const create = mutation({
  args: {
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
    genreIds: v.array(v.id("genres")),
    hosts: v.array(v.id("people")),
    guests: v.array(v.id("people")),
    audioFileId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const { genreIds, hosts, guests, ...recordingData } = args;

    // Check for duplicate people (person can't be both host and guest)
    const allPeople = [...hosts, ...guests];
    const uniquePeople = new Set(allPeople);
    if (allPeople.length !== uniquePeople.size) {
      throw new Error("человек не может быть одновременно ведущим и гостем");
    }

    // Create recording
    const recordingId = await ctx.db.insert("recordings", recordingData);

    // Add genres
    for (const genreId of genreIds) {
      await ctx.db.insert("recordingGenres", {
        recordingId,
        genreId,
      });
    }

    // Add hosts
    for (const personId of hosts) {
      await ctx.db.insert("recordingPeople", {
        recordingId,
        personId,
        role: "host",
      });
    }

    // Add guests
    for (const personId of guests) {
      await ctx.db.insert("recordingPeople", {
        recordingId,
        personId,
        role: "guest",
      });
    }

    return recordingId;
  },
});

export const update = mutation({
  args: {
    id: v.id("recordings"),
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
    genreIds: v.array(v.id("genres")),
    hosts: v.array(v.id("people")),
    guests: v.array(v.id("people")),
    audioFileId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const { id, genreIds, hosts, guests, ...recordingData } = args;

    // Check for duplicate people (person can't be both host and guest)
    const allPeople = [...hosts, ...guests];
    const uniquePeople = new Set(allPeople);
    if (allPeople.length !== uniquePeople.size) {
      throw new Error("Человек не может быть одновременно ведущим и гостем");
    }

    // Update recording
    await ctx.db.patch(id, recordingData);

    // Remove existing associations
    const existingGenres = await ctx.db
      .query("recordingGenres")
      .withIndex("by_recording", (q) => q.eq("recordingId", id))
      .collect();

    for (const rg of existingGenres) {
      await ctx.db.delete(rg._id);
    }

    const existingPeople = await ctx.db
      .query("recordingPeople")
      .withIndex("by_recording", (q) => q.eq("recordingId", id))
      .collect();

    for (const rp of existingPeople) {
      await ctx.db.delete(rp._id);
    }

    // Add new associations
    for (const genreId of genreIds) {
      await ctx.db.insert("recordingGenres", {
        recordingId: id,
        genreId,
      });
    }

    for (const personId of hosts) {
      await ctx.db.insert("recordingPeople", {
        recordingId: id,
        personId,
        role: "host",
      });
    }

    for (const personId of guests) {
      await ctx.db.insert("recordingPeople", {
        recordingId: id,
        personId,
        role: "guest",
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("recordings") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const recording = await ctx.db.get(args.id);
    if (recording && recording.audioFileId)
      await ctx.storage.delete(recording.audioFileId);
    await ctx.db.delete(args.id);
  },
});

export const getRecordingPeople = query({
  args: { recordingId: v.id("recordings") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const recordingPeople = await ctx.db
      .query("recordingPeople")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .collect();

    const people = await Promise.all(
      recordingPeople.map(async (rp) => {
        const person = await ctx.db.get(rp.personId);
        return {
          ...person,
          role: rp.role,
        };
      })
    );

    return people.filter(Boolean);
  },
});

export const getRecordingGenres = query({
  args: { recordingId: v.id("recordings") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const recordingGenres = await ctx.db
      .query("recordingGenres")
      .withIndex("by_recording", (q) => q.eq("recordingId", args.recordingId))
      .collect();

    const genres = await Promise.all(
      recordingGenres.map(async (rg) => {
        const genre = await ctx.db.get(rg.genreId);
        return genre;
      })
    );

    return genres.filter(Boolean);
  },
});

export const getAudioUrl = query({
  args: { id: v.id("recordings") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const recording = await ctx.db.get(args.id);
    if (!recording) return null;
    return await ctx.storage.getUrl(recording.audioFileId);
  },
});

export const deleteUntaggedFiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const files = await ctx.db.system.query("_storage").collect();
    for (const file of files) {
      const recording = await ctx.db
        .query("recordings")
        .filter((q) => q.eq(q.field("audioFileId"), file._id))
        .collect();
      if (recording.length === 0) {
        await ctx.storage.delete(file._id);
      }
    }
  },
});
