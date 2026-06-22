import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );
}

const ListInput = z.object({
  gender: z.enum(["male", "female", "unisex"]).optional(),
  type: z.enum(["clothing", "shoes"]).optional(),
  categorySlug: z.string().optional(),
  featured: z.boolean().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "best_rated"]).default("newest"),
  limit: z.number().int().min(1).max(100).default(24),
  sizes: z.array(z.string()).optional(),
  colors: z.array(z.string()).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  search: z.string().optional(),
});

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => ListInput.parse(input ?? {}))
  .handler(async ({ data }) => {
    const sb = publicClient();
    
    // Determine if we need to inner join variants for filtering
    const hasVariantFilter = (data.sizes && data.sizes.length > 0) || (data.colors && data.colors.length > 0);
    
    let selectStr = "id, name, slug, price, compare_price, is_featured, created_at, category:categories!inner(id,name,slug,gender,type), images:product_images(image_url,is_primary,display_order)";
    
    if (hasVariantFilter) {
      selectStr += ", variants:product_variants!inner(id,size,color,stock_quantity)";
    } else {
      selectStr += ", variants:product_variants(id,size,color,stock_quantity)";
    }
    
    // For rating sort, we need reviews
    selectStr += ", reviews(rating)";

    let q = sb
      .from("products")
      .select(selectStr)
      .eq("is_active", true);

    if (data.gender) q = q.eq("category.gender", data.gender);
    if (data.type) q = q.eq("category.type", data.type);
    if (data.categorySlug) q = q.eq("category.slug", data.categorySlug);
    if (data.featured) q = q.eq("is_featured", true);
    if (data.minPrice !== undefined) q = q.gte("price", data.minPrice);
    if (data.maxPrice !== undefined) q = q.lte("price", data.maxPrice);
    if (data.search) q = q.ilike("name", `%${data.search}%`);

    if (data.sizes && data.sizes.length > 0) {
      q = q.in("variants.size", data.sizes);
    }
    if (data.colors && data.colors.length > 0) {
      q = q.in("variants.color", data.colors);
    }

    if (data.sort === "price_asc") {
      q = q.order("price", { ascending: true });
    } else if (data.sort === "price_desc") {
      q = q.order("price", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: false });
    }

    q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let result = (rows ?? []) as any[];

    // If sorting by best_rated, compute average rating and sort in JavaScript
    if (data.sort === "best_rated") {
      result = result.map(row => {
        const revs = row.reviews ?? [];
        const avg = revs.length ? revs.reduce((sum: number, r: any) => sum + r.rating, 0) / revs.length : 0;
        return { ...row, avgRating: avg };
      }).sort((a, b) => b.avgRating - a.avgRating);
    }

    return result;
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: product, error } = await sb
      .from("products")
      .select(
        "id, name, slug, description, price, compare_price, sku, stock_quantity, meta_title, meta_description, category:categories(id,name,slug,gender,type), images:product_images(id,image_url,alt_text,is_primary,display_order), variants:product_variants(id,size,color,stock_quantity,price_modifier), reviews(id,rating,comment,created_at,user_id)",
      )
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return product;
  });

// ----- Admin -----

const ProductUpsert = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  category_id: z.string().uuid(),
  price: z.number().nonnegative(),
  compare_price: z.number().nonnegative().nullable().optional(),
  sku: z.string().max(100).optional().nullable(),
  stock_quantity: z.number().int().nonnegative().default(0),
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  meta_title: z.string().max(200).optional().nullable(),
  meta_description: z.string().max(500).optional().nullable(),
  images: z
    .array(
      z.object({
        image_url: z.string().url(),
        alt_text: z.string().max(200).optional().nullable(),
        is_primary: z.boolean().default(false),
        display_order: z.number().int().default(0),
      }),
    )
    .default([]),
  variants: z
    .array(
      z.object({
        size: z.string().max(50).optional().nullable(),
        color: z.string().max(50).optional().nullable(),
        stock_quantity: z.number().int().nonnegative().default(0),
        price_modifier: z.number().default(0),
      }),
    )
    .default([]),
});

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProductUpsert.parse(input))
  .handler(async ({ data, context }) => {
    const sb = context.supabase;
    const { data: adminCheck } = await sb.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");

    const { images, variants, id, ...productData } = data;
    let productId = id;
    if (productId) {
      const { error } = await sb.from("products").update(productData).eq("id", productId);
      if (error) throw new Error(error.message);
      await sb.from("product_images").delete().eq("product_id", productId);
      await sb.from("product_variants").delete().eq("product_id", productId);
    } else {
      const { data: inserted, error } = await sb
        .from("products")
        .insert(productData)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      productId = inserted.id;
    }
    if (images.length) {
      const { error: e } = await sb
        .from("product_images")
        .insert(images.map((img) => ({ ...img, product_id: productId! })));
      if (e) throw new Error(e.message);
    }
    if (variants.length) {
      const { error: e } = await sb
        .from("product_variants")
        .insert(variants.map((v) => ({ ...v, product_id: productId! })));
      if (e) throw new Error(e.message);
    }
    return { id: productId };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("products")
      .select(
        "id, name, slug, price, stock_quantity, is_active, is_featured, created_at, category:categories(name,gender,type)",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    const { data: product, error } = await context.supabase
      .from("products")
      .select(
        "*, images:product_images(*), variants:product_variants(*)",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return product;
  });

export const bulkUpdateStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ ids: z.array(z.string().uuid()), is_active: z.boolean() }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");

    const { error } = await context.supabase
      .from("products")
      .update({ is_active: data.is_active })
      .in("id", data.ids);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkDeleteProducts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ ids: z.array(z.string().uuid()) }).parse(input)
  )
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");

    const { error } = await context.supabase
      .from("products")
      .delete()
      .in("id", data.ids);

    if (error) throw new Error(error.message);
    return { ok: true };
  });