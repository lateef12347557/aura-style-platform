import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const listCategories = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listAllCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const CategoryUpsert = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100),
  gender: z.enum(["male", "female", "unisex"]),
  type: z.enum(["clothing", "shoes"]),
  parent_id: z.string().uuid().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().default(0),
});

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CategoryUpsert.parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    if (data.id) {
      const { id, ...rest } = data;
      const { error } = await context.supabase.from("categories").update(rest).eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    }
    const { id: _ignore, ...rest } = data;
    void _ignore;
    const { data: row, error } = await context.supabase
      .from("categories")
      .insert(rest)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const toggleCategoryActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), is_active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("categories")
      .update({ is_active: data.is_active })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");

    // Block delete if products reference this category
    const { count, error: countError } = await context.supabase
      .from("products")
      .select("id", { head: true, count: "exact" })
      .eq("category_id", data.id);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) {
      throw new Error(
        `Cannot delete — ${count} product(s) use this category. Reassign or delete them first.`,
      );
    }

    const { error } = await context.supabase.from("categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), direction: z.enum(["up", "down"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");

    const { data: current, error: e1 } = await context.supabase
      .from("categories")
      .select("id, parent_id, display_order")
      .eq("id", data.id)
      .maybeSingle();
    if (e1) throw new Error(e1.message);
    if (!current) throw new Error("Not found");

    let siblingsQuery = context.supabase
      .from("categories")
      .select("id, display_order")
      .order("display_order", { ascending: true });
    siblingsQuery = current.parent_id
      ? siblingsQuery.eq("parent_id", current.parent_id)
      : siblingsQuery.is("parent_id", null);
    const { data: siblings, error: e2 } = await siblingsQuery;
    if (e2) throw new Error(e2.message);
    if (!siblings) return { ok: true };

    const idx = siblings.findIndex((s) => s.id === current.id);
    const swapIdx = data.direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return { ok: true };
    const other = siblings[swapIdx];

    const { error } = await context.supabase.rpc("swap_category_order", {
      a: current.id,
      b: other.id,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
