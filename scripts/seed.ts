import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Load .env variables manually in case not running under Bun
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  envConfig.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length === 2) {
      const key = parts[0].trim();
      const val = parts[1].trim().replace(/['"]/g, "");
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
// Prefer Service Role Key for administrative bypass of RLS, fall back to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Error: Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log("Seeding ATELIER database...");

  // 1. Seed Categories
  const categories = [
    {
      id: "b1111111-1111-1111-1111-111111111111",
      name: "Men",
      slug: "men",
      gender: "male",
      type: "clothing",
      parent_id: null,
      image_url: "https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&q=80",
      is_active: true,
      display_order: 0,
    },
    {
      id: "b80582bc-9d04-4b5f-a9cb-b2f7cd4a3891",
      name: "Men's Clothing",
      slug: "men-clothing",
      gender: "male",
      type: "clothing",
      parent_id: "b1111111-1111-1111-1111-111111111111",
      image_url: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80",
      is_active: true,
      display_order: 1,
    },
    {
      id: "c6225a91-db53-4a1e-84b2-297eb098e945",
      name: "Men's Shoes",
      slug: "men-shoes",
      gender: "male",
      type: "shoes",
      parent_id: "b1111111-1111-1111-1111-111111111111",
      image_url: "https://images.unsplash.com/photo-1486307991290-7c935c10298b?w=800&q=80",
      is_active: true,
      display_order: 2,
    },
    {
      id: "w2222222-2222-2222-2222-222222222222",
      name: "Women",
      slug: "women",
      gender: "female",
      type: "clothing",
      parent_id: null,
      image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80",
      is_active: true,
      display_order: 3,
    },
    {
      id: "e3d23190-e7f0-4592-bd61-e0e64024220b",
      name: "Women's Clothing",
      slug: "women-clothing",
      gender: "female",
      type: "clothing",
      parent_id: "w2222222-2222-2222-2222-222222222222",
      image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80",
      is_active: true,
      display_order: 4,
    },
    {
      id: "d2b512be-098e-4a6c-941f-8e4d2bfb21c4",
      name: "Women's Shoes",
      slug: "women-shoes",
      gender: "female",
      type: "shoes",
      parent_id: "w2222222-2222-2222-2222-222222222222",
      image_url: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80",
      is_active: true,
      display_order: 5,
    },
  ];

  console.log("- Seeding categories...");
  for (const cat of categories) {
    const { error } = await supabase.from("categories").upsert(cat, { onConflict: "id" });
    if (error) console.error(`Error seeding category ${cat.name}:`, error.message);
  }

  // 2. Seed Products
  const products = [
    {
      id: "p1111111-1111-1111-1111-111111111111",
      name: "Cashmere Knit Crewneck",
      slug: "cashmere-knit-crewneck",
      description: "Knitted from fine Grade-A Mongolian cashmere, this classic crewneck sweater offers an incredibly soft hand-feel and superior insulation. Featuring rib-knit details at the collar, cuffs, and hem, it has a relaxed yet tailored fit suitable for layering.",
      category_id: "b80582bc-9d04-4b5f-a9cb-b2f7cd4a3891",
      price: 290.00,
      compare_price: 350.00,
      sku: "M-KNIT-CSH-01",
      stock_quantity: 34,
      is_featured: true,
      is_active: true,
      meta_title: "Cashmere Knit Crewneck sweater | ATELIER",
      meta_description: "Buy our premium Mongolian cashmere crewneck sweater. Soft, warm, and tailored for quiet luxury.",
    },
    {
      id: "p2222222-2222-2222-2222-222222222222",
      name: "Atelier Leather Derby",
      slug: "atelier-leather-derby",
      description: "Crafted from hand-painted calfskin leather in Tuscany, Italy, these Derby shoes combine classic heritage styling with modern comfort. Built with a Goodyear-welted double leather sole and memory foam footbed, they are designed to age beautifully.",
      category_id: "c6225a91-db53-4a1e-84b2-297eb098e945",
      price: 410.00,
      compare_price: null,
      sku: "M-SHOE-DRB-02",
      stock_quantity: 20,
      is_featured: true,
      is_active: true,
      meta_title: "Atelier Calfskin Leather Derby Shoes | ATELIER",
      meta_description: "Goodyear welted leather derby shoes handmade in Tuscany, Italy. Classic elegance meets everyday versatility.",
    },
    {
      id: "p3333333-3333-3333-3333-333333333333",
      name: "Raw Denim Utility Jacket",
      slug: "raw-denim-utility-jacket",
      description: "This utility jacket is constructed from 14oz Japanese selvedge denim, left unwashed to preserve the rich deep indigo dye. Features durable triple-needle stitching, copper shank buttons, and four front pockets. Built to fade and soften uniquely with wear.",
      category_id: "b80582bc-9d04-4b5f-a9cb-b2f7cd4a3891",
      price: 195.00,
      compare_price: 220.00,
      sku: "M-JKT-DNM-03",
      stock_quantity: 15,
      is_featured: false,
      is_active: true,
      meta_title: "Raw Selvedge Denim Utility Jacket | ATELIER",
      meta_description: "Japanese selvedge raw denim utility jacket. Unwashed indigo finish designed to fade with character.",
    },
    {
      id: "p4444444-4444-4444-4444-444444444444",
      name: "Double-Breasted Wool Blazer",
      slug: "double-breasted-wool-blazer",
      description: "An update on a timeless wardrobe anchor. This blazer is tailored from lightweight virgin wool with sharp structured shoulders, double-breasted button fastening, and peak lapels. Fully lined in cupro for smooth layering.",
      category_id: "e3d23190-e7f0-4592-bd61-e0e64024220b",
      price: 340.00,
      compare_price: 395.00,
      sku: "W-BLZ-WOL-04",
      stock_quantity: 18,
      is_featured: true,
      is_active: true,
      meta_title: "Tailored Double-Breasted Wool Blazer | ATELIER",
      meta_description: "Lightweight virgin wool structured double-breasted blazer for women. Finished with peak lapels and cupro lining.",
    },
    {
      id: "p5555555-5555-5555-5555-555555555555",
      name: "Heavyweight Silk Slip Dress",
      slug: "heavyweight-silk-slip-dress",
      description: "Cut on the bias to drape effortlessly over the body, this slip dress is made from lustrous 22-momme Mulberry silk. Designed with a clean V-neckline, adjustable thin spaghetti straps, and a low open back. Dress it down with knits or elevate with heels.",
      category_id: "e3d23190-e7f0-4592-bd61-e0e64024220b",
      price: 240.00,
      compare_price: null,
      sku: "W-DRS-SLK-05",
      stock_quantity: 25,
      is_featured: true,
      is_active: true,
      meta_title: "Mulberry Silk Bias-Cut Slip Dress | ATELIER",
      meta_description: "Heavyweight Mulberry silk slip dress cut on the bias. Features adjustable straps and a refined drape.",
    },
    {
      id: "p6666666-6666-6666-6666-666666666666",
      name: "Pointed Suede Ankle Boot",
      slug: "pointed-suede-ankle-boot",
      description: "Handcrafted in Spain from buttery soft Italian calf suede. This ankle boot features a refined pointed toe, side zip closure, and a stable 60mm block heel. Impeccably finished with a leather outsole and padded insole for all-day comfort.",
      category_id: "d2b512be-098e-4a6c-941f-8e4d2bfb21c4",
      price: 380.00,
      compare_price: 450.00,
      sku: "W-SHOE-SDE-06",
      stock_quantity: 12,
      is_featured: false,
      is_active: true,
      meta_title: "Pointed Calf Suede Ankle Boots | ATELIER",
      meta_description: "Premium Italian calf suede pointed ankle boots. Handmade in Spain with leather soles.",
    },
  ];

  console.log("- Seeding products...");
  for (const prod of products) {
    const { error } = await supabase.from("products").upsert(prod, { onConflict: "id" });
    if (error) console.error(`Error seeding product ${prod.name}:`, error.message);
  }

  // 3. Seed Images
  const images = [
    { id: "img-1-1", product_id: "p1111111-1111-1111-1111-111111111111", image_url: "https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=1000&q=80", alt_text: "Cashmere Crewneck Knit Front", is_primary: true, display_order: 0 },
    { id: "img-1-2", product_id: "p1111111-1111-1111-1111-111111111111", image_url: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1000&q=80", alt_text: "Cashmere Knit Details", is_primary: false, display_order: 1 },
    { id: "img-2-1", product_id: "p2222222-2222-2222-2222-222222222222", image_url: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=1000&q=80", alt_text: "Calfskin Leather Derby Profile", is_primary: true, display_order: 0 },
    { id: "img-2-2", product_id: "p2222222-2222-2222-2222-222222222222", image_url: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1000&q=80", alt_text: "Derby Sole Detail", is_primary: false, display_order: 1 },
    { id: "img-3-1", product_id: "p3333333-3333-3333-3333-333333333333", image_url: "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=1000&q=80", alt_text: "Indigo Selvedge Denim Jacket", is_primary: true, display_order: 0 },
    { id: "img-4-1", product_id: "p4444444-4444-4444-4444-444444444444", image_url: "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=1000&q=80", alt_text: "Double-Breasted Wool Blazer Front", is_primary: true, display_order: 0 },
    { id: "img-4-2", product_id: "p4444444-4444-4444-4444-444444444444", image_url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&q=80", alt_text: "Blazer Lifestyle Shot", is_primary: false, display_order: 1 },
    { id: "img-5-1", product_id: "p5555555-5555-5555-5555-555555555555", image_url: "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=1000&q=80", alt_text: "Mulberry Silk Slip Dress", is_primary: true, display_order: 0 },
    { id: "img-6-1", product_id: "p6666666-6666-6666-6666-666666666666", image_url: "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1000&q=80", alt_text: "Pointed Suede Ankle Boots", is_primary: true, display_order: 0 },
  ];

  console.log("- Seeding product images...");
  for (const img of images) {
    const { error } = await supabase.from("product_images").upsert(img, { onConflict: "id" });
    if (error) console.error(`Error seeding image ${img.id}:`, error.message);
  }

  // 4. Seed Variants
  const variants = [
    { id: "v-1-1", product_id: "p1111111-1111-1111-1111-111111111111", size: "S", color: "Off-White", stock_quantity: 10, price_modifier: 0, sku: "M-KNIT-CSH-OW-S" },
    { id: "v-1-2", product_id: "p1111111-1111-1111-1111-111111111111", size: "M", color: "Off-White", stock_quantity: 15, price_modifier: 0, sku: "M-KNIT-CSH-OW-M" },
    { id: "v-1-3", product_id: "p1111111-1111-1111-1111-111111111111", size: "L", color: "Off-White", stock_quantity: 8, price_modifier: 0, sku: "M-KNIT-CSH-OW-L" },
    { id: "v-1-4", product_id: "p1111111-1111-1111-1111-111111111111", size: "S", color: "Black", stock_quantity: 5, price_modifier: 0, sku: "M-KNIT-CSH-BK-S" },
    { id: "v-1-5", product_id: "p1111111-1111-1111-1111-111111111111", size: "M", color: "Black", stock_quantity: 12, price_modifier: 0, sku: "M-KNIT-CSH-BK-M" },
    { id: "v-1-6", product_id: "p1111111-1111-1111-1111-111111111111", size: "L", color: "Black", stock_quantity: 0, price_modifier: 0, sku: "M-KNIT-CSH-BK-L" },

    { id: "v-2-1", product_id: "p2222222-2222-2222-2222-222222222222", size: "8", color: "Brown", stock_quantity: 4, price_modifier: 0, sku: "M-SHOE-DRB-BR-08" },
    { id: "v-2-2", product_id: "p2222222-2222-2222-2222-222222222222", size: "9", color: "Brown", stock_quantity: 8, price_modifier: 0, sku: "M-SHOE-DRB-BR-09" },
    { id: "v-2-3", product_id: "p2222222-2222-2222-2222-222222222222", size: "10", color: "Brown", stock_quantity: 6, price_modifier: 0, sku: "M-SHOE-DRB-BR-10" },
    { id: "v-2-4", product_id: "p2222222-2222-2222-2222-222222222222", size: "11", color: "Brown", stock_quantity: 2, price_modifier: 0, sku: "M-SHOE-DRB-BR-11" },
    { id: "v-2-5", product_id: "p2222222-2222-2222-2222-222222222222", size: "9", color: "Black", stock_quantity: 5, price_modifier: 10, sku: "M-SHOE-DRB-BK-09" },

    { id: "v-3-1", product_id: "p3333333-3333-3333-3333-333333333333", size: "S", color: "Indigo", stock_quantity: 4, price_modifier: 0, sku: "M-JKT-DNM-ID-S" },
    { id: "v-3-2", product_id: "p3333333-3333-3333-3333-333333333333", size: "M", color: "Indigo", stock_quantity: 8, price_modifier: 0, sku: "M-JKT-DNM-ID-M" },
    { id: "v-3-3", product_id: "p3333333-3333-3333-3333-333333333333", size: "L", color: "Indigo", stock_quantity: 3, price_modifier: 0, sku: "M-JKT-DNM-ID-L" },

    { id: "v-4-1", product_id: "p4444444-4444-4444-4444-444444444444", size: "XS", color: "Black", stock_quantity: 2, price_modifier: 0, sku: "W-BLZ-WOL-BK-XS" },
    { id: "v-4-2", product_id: "p4444444-4444-4444-4444-444444444444", size: "S", color: "Black", stock_quantity: 6, price_modifier: 0, sku: "W-BLZ-WOL-BK-S" },
    { id: "v-4-3", product_id: "p4444444-4444-4444-4444-444444444444", size: "M", color: "Black", stock_quantity: 8, price_modifier: 0, sku: "W-BLZ-WOL-BK-M" },
    { id: "v-4-4", product_id: "p4444444-4444-4444-4444-444444444444", size: "L", color: "Black", stock_quantity: 2, price_modifier: 0, sku: "W-BLZ-WOL-BK-L" },

    { id: "v-5-1", product_id: "p5555555-5555-5555-5555-555555555555", size: "S", color: "Black", stock_quantity: 10, price_modifier: 0, sku: "W-DRS-SLK-BK-S" },
    { id: "v-5-2", product_id: "p5555555-5555-5555-5555-555555555555", size: "M", color: "Black", stock_quantity: 12, price_modifier: 0, sku: "W-DRS-SLK-BK-M" },
    { id: "v-5-3", product_id: "p5555555-5555-5555-5555-555555555555", size: "S", color: "Sage", stock_quantity: 5, price_modifier: 0, sku: "W-DRS-SLK-SG-S" },
    { id: "v-5-4", product_id: "p5555555-5555-5555-5555-555555555555", size: "M", color: "Sage", stock_quantity: 8, price_modifier: 0, sku: "W-DRS-SLK-SG-M" },

    { id: "v-6-1", product_id: "p6666666-6666-6666-6666-666666666666", size: "6", color: "Beige", stock_quantity: 3, price_modifier: 0, sku: "W-SHOE-SDE-BG-06" },
    { id: "v-6-2", product_id: "p6666666-6666-6666-6666-666666666666", size: "7", color: "Beige", stock_quantity: 4, price_modifier: 0, sku: "W-SHOE-SDE-BG-07" },
    { id: "v-6-3", product_id: "p6666666-6666-6666-6666-666666666666", size: "8", color: "Beige", stock_quantity: 5, price_modifier: 0, sku: "W-SHOE-SDE-BG-08" },
    { id: "v-6-4", product_id: "p6666666-6666-6666-6666-666666666666", size: "9", color: "Beige", stock_quantity: 0, price_modifier: 0, sku: "W-SHOE-SDE-BG-09" },
  ];

  console.log("- Seeding product variants...");
  for (const v of variants) {
    const { error } = await supabase.from("product_variants").upsert(v, { onConflict: "id" });
    if (error) console.error(`Error seeding variant ${v.sku}:`, error.message);
  }

  console.log("Database seeding completed successfully.");
}

runSeed().catch((err) => {
  console.error("Seed failed with error:", err);
  process.exit(1);
});
