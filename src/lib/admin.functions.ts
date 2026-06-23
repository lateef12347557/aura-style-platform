import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");

    const [{ data: orders }, { count: productCount }, { count: customerCount }] = await Promise.all(
      [
        context.supabase.from("orders").select("id,total_amount,created_at,status,user_id"),
        context.supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
        context.supabase.from("profiles").select("id", { count: "exact", head: true }),
      ],
    );

    const all = orders ?? [];
    const totalRevenue = all
      .filter((o) => o.status !== "cancelled")
      .reduce((s, o) => s + Number(o.total_amount), 0);

    const days: { day: string; revenue: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ day: key, revenue: 0 });
    }
    const byDay = new Map(days.map((d) => [d.day, d]));
    for (const o of all) {
      const key = o.created_at.slice(0, 10);
      const row = byDay.get(key);
      if (row && o.status !== "cancelled") row.revenue += Number(o.total_amount);
    }

    const recent = all
      .slice()
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 8);

    return {
      totalRevenue,
      totalOrders: all.length,
      activeProducts: productCount ?? 0,
      newCustomers: customerCount ?? 0,
      revenueByDay: days,
      recentOrders: recent,
    };
  });

export const listCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");
    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, full_name, created_at");
    if (error) throw new Error(error.message);
    const { data: orders } = await context.supabase
      .from("orders")
      .select("user_id, total_amount, status");
    const stats = new Map<string, { count: number; total: number }>();
    for (const o of orders ?? []) {
      const s = stats.get(o.user_id) ?? { count: 0, total: 0 };
      s.count++;
      if (o.status !== "cancelled") s.total += Number(o.total_amount);
      stats.set(o.user_id, s);
    }
    return (profiles ?? []).map((p) => ({
      ...p,
      order_count: stats.get(p.id)?.count ?? 0,
      total_spent: stats.get(p.id)?.total ?? 0,
    }));
  });

export const promoteSelfToAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // Only allowed if no admin exists yet (bootstrap)
    const { count } = await context.supabase
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("An admin already exists");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getAdminCustomer = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");

    const { data: profile, error: profileError } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);
    if (!profile) throw new Error("Customer not found");

    const { data: orders, error: ordersError } = await context.supabase
      .from("orders")
      .select("id, status, total_amount, created_at")
      .eq("user_id", data.id)
      .order("created_at", { ascending: false });
    if (ordersError) throw new Error(ordersError.message);

    const orderCount = orders?.length ?? 0;
    const totalSpent = (orders ?? [])
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total_amount), 0);

    let email: string | null = null;
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(data.id);
      if (authUser?.user) {
        email = authUser.user.email ?? null;
      }
    } catch (e) {
      console.error("Failed to fetch email from admin auth", e);
    }

    return {
      profile: {
        ...profile,
        email,
      },
      orders: orders ?? [],
      metrics: {
        orderCount,
        totalSpent,
      },
    };
  });
