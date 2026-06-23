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
        context.supabase
          .from("orders")
          .select("id,total_amount,created_at,status,user_id,shipping_address"),
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

export const seedCatalogFromAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: adminCheck } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!adminCheck) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Clean up
    await supabaseAdmin.from("reviews").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("order_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("product_variants")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("product_images")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin.from("products").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabaseAdmin
      .from("categories")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    // Seed categories
    const categories = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Male",
        slug: "men",
        gender: "male",
        type: "clothing",
        parent_id: null,
        image_url: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&q=80",
        is_active: true,
        display_order: 0,
      },
      {
        id: "11111111-1111-1111-1111-111111111112",
        name: "Trousers",
        slug: "men-trousers",
        gender: "male",
        type: "clothing",
        parent_id: "11111111-1111-1111-1111-111111111111",
        image_url: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80",
        is_active: true,
        display_order: 1,
      },
      {
        id: "11111111-1111-1111-1111-111111111113",
        name: "Shirts",
        slug: "men-shirts",
        gender: "male",
        type: "clothing",
        parent_id: "11111111-1111-1111-1111-111111111111",
        image_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1000&q=80",
        is_active: true,
        display_order: 2,
      },
      {
        id: "11111111-1111-1111-1111-111111111114",
        name: "Shoes",
        slug: "men-shoes",
        gender: "male",
        type: "shoes",
        parent_id: "11111111-1111-1111-1111-111111111111",
        image_url: "https://images.unsplash.com/photo-1486307991290-7c935c10298b?w=800&q=80",
        is_active: true,
        display_order: 3,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Female",
        slug: "women",
        gender: "female",
        type: "clothing",
        parent_id: null,
        image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
        is_active: true,
        display_order: 4,
      },
      {
        id: "22222222-2222-2222-2222-222222222223",
        name: "Trousers",
        slug: "women-trousers",
        gender: "female",
        type: "clothing",
        parent_id: "22222222-2222-2222-2222-222222222222",
        image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
        is_active: true,
        display_order: 5,
      },
      {
        id: "22222222-2222-2222-2222-222222222224",
        name: "Shirts",
        slug: "women-shirts",
        gender: "female",
        type: "clothing",
        parent_id: "22222222-2222-2222-2222-222222222222",
        image_url: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=1000&q=80",
        is_active: true,
        display_order: 6,
      },
      {
        id: "22222222-2222-2222-2222-222222222225",
        name: "Shoes",
        slug: "women-shoes",
        gender: "female",
        type: "shoes",
        parent_id: "22222222-2222-2222-2222-222222222222",
        image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
        is_active: true,
        display_order: 7,
      },
    ];

    for (const cat of categories) {
      const { error } = await supabaseAdmin.from("categories").insert(cat);
      if (error) throw new Error(error.message);
    }

    // Seed products
    const products = [
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Cashmere Knit Crewneck",
        slug: "cashmere-knit-crewneck",
        description:
          "Knitted from fine Grade-A Mongolian cashmere, this classic crewneck sweater offers an incredibly soft hand-feel and superior insulation. Featuring rib-knit details at the collar, cuffs, and hem, it has a relaxed yet tailored fit suitable for layering.",
        category_id: "11111111-1111-1111-1111-111111111113",
        price: 290.0,
        compare_price: 350.0,
        sku: "M-KNIT-CSH-01",
        stock_quantity: 34,
        is_featured: true,
        is_active: true,
        meta_title: "Cashmere Knit Crewneck sweater | MDCLASSIC WEARS",
        meta_description:
          "Buy our premium Mongolian cashmere crewneck sweater. Soft, warm, and tailored for quiet luxury.",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Classic Leather Derby",
        slug: "classic-leather-derby",
        description:
          "Crafted from hand-painted calfskin leather in Tuscany, Italy, these Derby shoes combine classic heritage styling with modern comfort. Built with a Goodyear-welted double leather sole and memory foam footbed, they are designed to age beautifully.",
        category_id: "11111111-1111-1111-1111-111111111114",
        price: 410.0,
        compare_price: null,
        sku: "M-SHOE-DRB-02",
        stock_quantity: 20,
        is_featured: true,
        is_active: true,
        meta_title: "Classic Calfskin Leather Derby Shoes | MDCLASSIC WEARS",
        meta_description:
          "Goodyear welted leather derby shoes handmade in Tuscany, Italy. Classic elegance meets everyday versatility.",
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        name: "Raw Denim Utility Jacket",
        slug: "raw-denim-utility-jacket",
        description:
          "This utility jacket is constructed from 14oz Japanese selvedge denim, left unwashed to preserve the rich deep indigo dye. Features durable triple-needle stitching, copper shank buttons, and four front pockets. Built to fade and soften uniquely with wear.",
        category_id: "11111111-1111-1111-1111-111111111113",
        price: 195.0,
        compare_price: 220.0,
        sku: "M-JKT-DNM-03",
        stock_quantity: 15,
        is_featured: false,
        is_active: true,
        meta_title: "Raw Selvedge Denim Utility Jacket | MDCLASSIC WEARS",
        meta_description:
          "Japanese selvedge raw denim utility jacket. Unwashed indigo finish designed to fade with character.",
      },
      {
        id: "00000000-0000-0000-0000-000000000004",
        name: "Double-Breasted Wool Blazer",
        slug: "double-breasted-wool-blazer",
        description:
          "An update on a timeless wardrobe anchor. This blazer is tailored from lightweight virgin wool with sharp structured shoulders, double-breasted button fastening, and peak lapels. Fully lined in cupro for smooth layering.",
        category_id: "22222222-2222-2222-2222-222222222224",
        price: 340.0,
        compare_price: 395.0,
        sku: "W-BLZ-WOL-04",
        stock_quantity: 18,
        is_featured: true,
        is_active: true,
        meta_title: "Tailored Double-Breasted Wool Blazer | MDCLASSIC WEARS",
        meta_description:
          "Lightweight virgin wool structured double-breasted blazer for women. Finished with peak lapels and cupro lining.",
      },
      {
        id: "00000000-0000-0000-0000-000000000005",
        name: "Heavyweight Silk Slip Dress",
        slug: "heavyweight-silk-slip-dress",
        description:
          "Cut on the bias to drape effortlessly over the body, this slip dress is made from lustrous 22-momme Mulberry silk. Designed with a clean V-neckline, adjustable thin spaghetti straps, and a low open back. Dress it down with knits or elevate with heels.",
        category_id: "22222222-2222-2222-2222-222222222224",
        price: 240.0,
        compare_price: null,
        sku: "W-DRS-SLK-05",
        stock_quantity: 25,
        is_featured: true,
        is_active: true,
        meta_title: "Mulberry Silk Bias-Cut Slip Dress | MDCLASSIC WEARS",
        meta_description:
          "Heavyweight Mulberry silk slip dress cut on the bias. Features adjustable straps and a refined drape.",
      },
      {
        id: "00000000-0000-0000-0000-000000000006",
        name: "Pointed Suede Ankle Boot",
        slug: "pointed-suede-ankle-boot",
        description:
          "Handcrafted in Spain from buttery soft Italian calf suede. This ankle boot features a refined pointed toe, side zip closure, and a stable 60mm block heel. Impeccably finished with a leather outsole and padded insole for all-day comfort.",
        category_id: "22222222-2222-2222-2222-222222222225",
        price: 380.0,
        compare_price: 450.0,
        sku: "W-SHOE-SDE-06",
        stock_quantity: 12,
        is_featured: false,
        is_active: true,
        meta_title: "Pointed Calf Suede Ankle Boots | MDCLASSIC WEARS",
        meta_description:
          "Premium Italian calf suede pointed ankle boots. Handmade in Spain with leather soles.",
      },
    ];

    for (const prod of products) {
      const { error } = await supabaseAdmin.from("products").insert(prod);
      if (error) throw new Error(error.message);
    }

    // Seed product images
    const images = [
      {
        id: "f1111111-1111-1111-1111-111111111111",
        product_id: "00000000-0000-0000-0000-000000000001",
        image_url: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=1000&q=80",
        alt_text: "Cashmere Crewneck Knit Front",
        is_primary: true,
        display_order: 0,
      },
      {
        id: "f1111111-1111-1111-1111-111111111112",
        product_id: "00000000-0000-0000-0000-000000000001",
        image_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1000&q=80",
        alt_text: "Cashmere Knit Details",
        is_primary: false,
        display_order: 1,
      },
      {
        id: "f2222222-2222-2222-2222-222222222221",
        product_id: "00000000-0000-0000-0000-000000000002",
        image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=1000&q=80",
        alt_text: "Calfskin Leather Derby Profile",
        is_primary: true,
        display_order: 0,
      },
      {
        id: "f2222222-2222-2222-2222-222222222222",
        product_id: "00000000-0000-0000-0000-000000000002",
        image_url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1000&q=80",
        alt_text: "Derby Sole Detail",
        is_primary: false,
        display_order: 1,
      },
      {
        id: "f3333333-3333-3333-3333-333333333331",
        product_id: "00000000-0000-0000-0000-000000000003",
        image_url: "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=1000&q=80",
        alt_text: "Indigo Selvedge Denim Jacket",
        is_primary: true,
        display_order: 0,
      },
      {
        id: "f4444444-4444-4444-4444-444444444441",
        product_id: "00000000-0000-0000-0000-000000000004",
        image_url: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=1000&q=80",
        alt_text: "Double-Breasted Wool Blazer Front",
        is_primary: true,
        display_order: 0,
      },
      {
        id: "f4444444-4444-4444-4444-444444444442",
        product_id: "00000000-0000-0000-0000-000000000004",
        image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&q=80",
        alt_text: "Blazer Lifestyle Shot",
        is_primary: false,
        display_order: 1,
      },
      {
        id: "f5555555-5555-5555-5555-555555555551",
        product_id: "00000000-0000-0000-0000-000000000005",
        image_url: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=1000&q=80",
        alt_text: "Mulberry Silk Slip Dress",
        is_primary: true,
        display_order: 0,
      },
      {
        id: "f6666666-6666-6666-6666-666666666661",
        product_id: "00000000-0000-0000-0000-000000000006",
        image_url: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1000&q=80",
        alt_text: "Pointed Suede Ankle Boots",
        is_primary: true,
        display_order: 0,
      },
    ];

    for (const img of images) {
      const { error } = await supabaseAdmin.from("product_images").insert(img);
      if (error) throw new Error(error.message);
    }

    // Seed product variants
    const variants = [
      {
        id: "e1111111-1111-1111-1111-111111111111",
        product_id: "00000000-0000-0000-0000-000000000001",
        size: "S",
        color: "Off-White",
        stock_quantity: 10,
        price_modifier: 0,
        sku: "M-KNIT-CSH-OW-S",
      },
      {
        id: "e1111111-1111-1111-1111-111111111112",
        product_id: "00000000-0000-0000-0000-000000000001",
        size: "M",
        color: "Off-White",
        stock_quantity: 15,
        price_modifier: 0,
        sku: "M-KNIT-CSH-OW-M",
      },
      {
        id: "e1111111-1111-1111-1111-111111111113",
        product_id: "00000000-0000-0000-0000-000000000001",
        size: "L",
        color: "Off-White",
        stock_quantity: 8,
        price_modifier: 0,
        sku: "M-KNIT-CSH-OW-L",
      },
      {
        id: "e1111111-1111-1111-1111-111111111114",
        product_id: "00000000-0000-0000-0000-000000000001",
        size: "S",
        color: "Black",
        stock_quantity: 5,
        price_modifier: 0,
        sku: "M-KNIT-CSH-BK-S",
      },
      {
        id: "e1111111-1111-1111-1111-111111111115",
        product_id: "00000000-0000-0000-0000-000000000001",
        size: "M",
        color: "Black",
        stock_quantity: 12,
        price_modifier: 0,
        sku: "M-KNIT-CSH-BK-M",
      },
      {
        id: "e1111111-1111-1111-1111-111111111116",
        product_id: "00000000-0000-0000-0000-000000000001",
        size: "L",
        color: "Black",
        stock_quantity: 0,
        price_modifier: 0,
        sku: "M-KNIT-CSH-BK-L",
      },
      {
        id: "e2222222-2222-2222-2222-222222222221",
        product_id: "00000000-0000-0000-0000-000000000002",
        size: "8",
        color: "Brown",
        stock_quantity: 4,
        price_modifier: 0,
        sku: "M-SHOE-DRB-BR-08",
      },
      {
        id: "e2222222-2222-2222-2222-222222222222",
        product_id: "00000000-0000-0000-0000-000000000002",
        size: "9",
        color: "Brown",
        stock_quantity: 8,
        price_modifier: 0,
        sku: "M-SHOE-DRB-BR-09",
      },
      {
        id: "e2222222-2222-2222-2222-222222222223",
        product_id: "00000000-0000-0000-0000-000000000002",
        size: "10",
        color: "Brown",
        stock_quantity: 6,
        price_modifier: 0,
        sku: "M-SHOE-DRB-BR-10",
      },
      {
        id: "e2222222-2222-2222-2222-222222222224",
        product_id: "00000000-0000-0000-0000-000000000002",
        size: "11",
        color: "Brown",
        stock_quantity: 2,
        price_modifier: 0,
        sku: "M-SHOE-DRB-BR-11",
      },
      {
        id: "e2222222-2222-2222-2222-222222222225",
        product_id: "00000000-0000-0000-0000-000000000002",
        size: "9",
        color: "Black",
        stock_quantity: 5,
        price_modifier: 10,
        sku: "M-SHOE-DRB-BK-09",
      },
      {
        id: "e3333333-3333-3333-3333-333333333331",
        product_id: "00000000-0000-0000-0000-000000000003",
        size: "S",
        color: "Indigo",
        stock_quantity: 4,
        price_modifier: 0,
        sku: "M-JKT-DNM-ID-S",
      },
      {
        id: "e3333333-3333-3333-3333-333333333332",
        product_id: "00000000-0000-0000-0000-000000000003",
        size: "M",
        color: "Indigo",
        stock_quantity: 8,
        price_modifier: 0,
        sku: "M-JKT-DNM-ID-M",
      },
      {
        id: "e3333333-3333-3333-3333-333333333333",
        product_id: "00000000-0000-0000-0000-000000000003",
        size: "L",
        color: "Indigo",
        stock_quantity: 3,
        price_modifier: 0,
        sku: "M-JKT-DNM-ID-L",
      },
      {
        id: "e4444444-4444-4444-4444-444444444441",
        product_id: "00000000-0000-0000-0000-000000000004",
        size: "XS",
        color: "Black",
        stock_quantity: 2,
        price_modifier: 0,
        sku: "W-BLZ-WOL-BK-XS",
      },
      {
        id: "e4444444-4444-4444-4444-444444444442",
        product_id: "00000000-0000-0000-0000-000000000004",
        size: "S",
        color: "Black",
        stock_quantity: 6,
        price_modifier: 0,
        sku: "W-BLZ-WOL-BK-S",
      },
      {
        id: "e4444444-4444-4444-4444-444444444443",
        product_id: "00000000-0000-0000-0000-000000000004",
        size: "M",
        color: "Black",
        stock_quantity: 8,
        price_modifier: 0,
        sku: "W-BLZ-WOL-BK-M",
      },
      {
        id: "e4444444-4444-4444-4444-444444444444",
        product_id: "00000000-0000-0000-0000-000000000004",
        size: "L",
        color: "Black",
        stock_quantity: 2,
        price_modifier: 0,
        sku: "W-BLZ-WOL-BK-L",
      },
      {
        id: "e5555555-5555-5555-5555-555555555551",
        product_id: "00000000-0000-0000-0000-000000000005",
        size: "S",
        color: "Black",
        stock_quantity: 10,
        price_modifier: 0,
        sku: "W-DRS-SLK-BK-S",
      },
      {
        id: "e5555555-5555-5555-5555-555555555552",
        product_id: "00000000-0000-0000-0000-000000000005",
        size: "M",
        color: "Black",
        stock_quantity: 12,
        price_modifier: 0,
        sku: "W-DRS-SLK-BK-M",
      },
      {
        id: "e5555555-5555-5555-5555-555555555553",
        product_id: "00000000-0000-0000-0000-000000000005",
        size: "S",
        color: "Sage",
        stock_quantity: 5,
        price_modifier: 0,
        sku: "W-DRS-SLK-SG-S",
      },
      {
        id: "e5555555-5555-5555-5555-555555555554",
        product_id: "00000000-0000-0000-0000-000000000005",
        size: "M",
        color: "Sage",
        stock_quantity: 8,
        price_modifier: 0,
        sku: "W-DRS-SLK-SG-M",
      },
      {
        id: "e6666666-6666-6666-6666-666666666661",
        product_id: "00000000-0000-0000-0000-000000000006",
        size: "6",
        color: "Beige",
        stock_quantity: 3,
        price_modifier: 0,
        sku: "W-SHOE-SDE-BG-06",
      },
      {
        id: "e6666666-6666-6666-6666-666666666662",
        product_id: "00000000-0000-0000-0000-000000000006",
        size: "7",
        color: "Beige",
        stock_quantity: 4,
        price_modifier: 0,
        sku: "W-SHOE-SDE-BG-07",
      },
      {
        id: "e6666666-6666-6666-6666-666666666663",
        product_id: "00000000-0000-0000-0000-000000000006",
        size: "8",
        color: "Beige",
        stock_quantity: 5,
        price_modifier: 0,
        sku: "W-SHOE-SDE-BG-08",
      },
      {
        id: "e6666666-6666-6666-6666-666666666664",
        product_id: "00000000-0000-0000-0000-000000000006",
        size: "9",
        color: "Beige",
        stock_quantity: 0,
        price_modifier: 0,
        sku: "W-SHOE-SDE-BG-09",
      },
    ];

    for (const v of variants) {
      const { error } = await supabaseAdmin.from("product_variants").insert(v);
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });
