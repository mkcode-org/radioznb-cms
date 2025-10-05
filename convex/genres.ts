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
    return await ctx.db.query("genres").order("asc").collect();
  },
});

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    
    // Check if genre already exists
    const existing = await ctx.db
      .query("genres")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .unique();
    
    if (existing) {
      throw new Error("Genre already exists");
    }
    
    return await ctx.db.insert("genres", { name: args.name });
  },
});

export const remove = mutation({
  args: { id: v.id("genres") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.id);
  },
});
