import { query, mutation } from "./_generated/server";
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
    const programs = await ctx.db.query("programs").order("desc").collect();
    
    // Enrich with host data
    const enriched = await Promise.all(
      programs.map(async (program) => {
        let host = null;
        if (program.hostId) {
          host = await ctx.db.get(program.hostId);
        }
        return {
          ...program,
          host,
        };
      })
    );
    
    return enriched;
  },
});

export const get = query({
  args: { id: v.id("programs") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    hostId: v.optional(v.id("people")),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.insert("programs", {
      name: args.name,
      description: args.description,
      hostId: args.hostId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("programs"),
    name: v.string(),
    description: v.optional(v.string()),
    hostId: v.optional(v.id("people")),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("programs") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.id);
  },
});
