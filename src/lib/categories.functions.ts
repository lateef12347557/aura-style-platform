import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
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