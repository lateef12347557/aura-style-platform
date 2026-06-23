import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PlaceOrderInput = z.object({
  items: z
    .array(
      z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().nullable(),
        quantity: z.number().int().positive(),
        unit_price: z.number().nonnegative(),
        product_name_snapshot: z.string(),
      }),
    )
    .min(1),
  shipping_address: z.object({
    full_name: z.string().min(1).max(120),
    line1: z.string().min(1).max(200),
    line2: z.string().max(200).optional(),
    city: z.string().min(1).max(100),
    region: z.string().min(1).max(100),
    postal_code: z.string().min(1).max(20),
    country: z.string().min(2).max(60),
  }),
  stripe_payment_id: z.string().optional(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PlaceOrderInput.parse(input))
  .handler(async ({ data, context }) => {
    const total = data.items.reduce((s, i) => s + i.unit_price * i.quantity, 0);
    const { data: order, error } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        status: "pending",
        total_amount: total,
        shipping_address: data.shipping_address,
        stripe_payment_id: data.stripe_payment_id || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    const { error: itemErr } = await context.supabase
      .from("order_items")
      .insert(data.items.map((i) => ({ ...i, order_id: order.id })));
    if (itemErr) throw new Error(itemErr.message);
    return { id: order.id };
  });

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, status, total_amount, created_at, order_items(quantity, product_name_snapshot)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return order;
  });

// --- Admin ---

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    const { data, error } = await context.supabase
      .from("orders")
      .select("id, status, total_amount, created_at, user_id, shipping_address")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminOrder = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    const { data: order, error } = await context.supabase
      .from("orders")
      .select("*, order_items(*, product:products(name,slug))")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return order;
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
