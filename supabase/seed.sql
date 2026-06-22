-- Seed data for ATELIER E-Commerce Platform

-- =========================================
-- CATEGORIES
-- =========================================
INSERT INTO public.categories (id, name, slug, gender, type, parent_id, image_url, is_active, display_order)
VALUES
  -- Men's Top-level
  ('b1111111-1111-1111-1111-111111111111', 'Men', 'men', 'male', 'clothing', NULL, 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&q=80', TRUE, 0),
  -- Men's sub-categories
  ('b80582bc-9d04-4b5f-a9cb-b2f7cd4a3891', 'Men''s Clothing', 'men-clothing', 'male', 'clothing', 'b1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80', TRUE, 1),
  ('c6225a91-db53-4a1e-84b2-297eb098e945', 'Men''s Shoes', 'men-shoes', 'male', 'shoes', 'b1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1486307991290-7c935c10298b?w=800&q=80', TRUE, 2),

  -- Women's Top-level
  ('w2222222-2222-2222-2222-222222222222', 'Women', 'women', 'female', 'clothing', NULL, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80', TRUE, 3),
  -- Women's sub-categories
  ('e3d23190-e7f0-4592-bd61-e0e64024220b', 'Women''s Clothing', 'women-clothing', 'female', 'clothing', 'w2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80', TRUE, 4),
  ('d2b512be-098e-4a6c-941f-8e4d2bfb21c4', 'Women''s Shoes', 'women-shoes', 'female', 'shoes', 'w2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80', TRUE, 5)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

-- =========================================
-- PRODUCTS
-- =========================================
INSERT INTO public.products (id, name, slug, description, category_id, price, compare_price, sku, stock_quantity, is_featured, is_active, meta_title, meta_description)
VALUES
  -- Product 1: Men's Knit
  ('p1111111-1111-1111-1111-111111111111', 'Cashmere Knit Crewneck', 'cashmere-knit-crewneck', 'Knitted from fine Grade-A Mongolian cashmere, this classic crewneck sweater offers an incredibly soft hand-feel and superior insulation. Feauturing rib-knit details at the collar, cuffs, and hem, it has a relaxed yet tailored fit suitable for layering.', 'b80582bc-9d04-4b5f-a9cb-b2f7cd4a3891', 290.00, 350.00, 'M-KNIT-CSH-01', 34, TRUE, TRUE, 'Cashmere Knit Crewneck sweater | ATELIER', 'Buy our premium Mongolian cashmere crewneck sweater. Soft, warm, and tailored for quiet luxury.'),
  
  -- Product 2: Men's Derby
  ('p2222222-2222-2222-2222-222222222222', 'Atelier Leather Derby', 'atelier-leather-derby', 'Crafted from hand-painted calfskin leather in Tuscany, Italy, these Derby shoes combine classic heritage styling with modern comfort. Built with a Goodyear-welted double leather sole and memory foam footbed, they are designed to age beautifully.', 'c6225a91-db53-4a1e-84b2-297eb098e945', 410.00, NULL, 'M-SHOE-DRB-02', 20, TRUE, TRUE, 'Atelier Calfskin Leather Derby Shoes | ATELIER', 'Goodyear welted leather derby shoes handmade in Tuscany, Italy. Classic elegance meets everyday versatility.'),

  -- Product 3: Men's Denim Jacket
  ('p3333333-3333-3333-3333-333333333333', 'Raw Denim Utility Jacket', 'raw-denim-utility-jacket', 'This utility jacket is constructed from 14oz Japanese selvedge denim, left unwashed to preserve the rich deep indigo dye. Features durable triple-needle stitching, copper shank buttons, and four front pockets. Built to fade and soften uniquely with wear.', 'b80582bc-9d04-4b5f-a9cb-b2f7cd4a3891', 195.00, 220.00, 'M-JKT-DNM-03', 15, FALSE, TRUE, 'Raw Selvedge Denim Utility Jacket | ATELIER', 'Japanese selvedge raw denim utility jacket. Unwashed indigo finish designed to fade with character.'),

  -- Product 4: Women's Blazer
  ('p4444444-4444-4444-4444-444444444444', 'Double-Breasted Wool Blazer', 'double-breasted-wool-blazer', 'An update on a timeless wardrobe anchor. This blazer is tailored from lightweight virgin wool with sharp structured shoulders, double-breasted button fastening, and peak lapels. Fully lined in cupro for smooth layering.', 'e3d23190-e7f0-4592-bd61-e0e64024220b', 340.00, 395.00, 'W-BLZ-WOL-04', 18, TRUE, TRUE, 'Tailored Double-Breasted Wool Blazer | ATELIER', 'Lightweight virgin wool structured double-breasted blazer for women. Finished with peak lapels and cupro lining.'),

  -- Product 5: Women's Silk Slip
  ('p5555555-5555-5555-5555-555555555555', 'Heavyweight Silk Slip Dress', 'heavyweight-silk-slip-dress', 'Cut on the bias to drape effortlessly over the body, this slip dress is made from lustrous 22-momme Mulberry silk. Designed with a clean V-neckline, adjustable thin spaghetti straps, and a low open back. Dress it down with knits or elevate with heels.', 'e3d23190-e7f0-4592-bd61-e0e64024220b', 240.00, NULL, 'W-DRS-SLK-05', 25, TRUE, TRUE, 'Mulberry Silk Bias-Cut Slip Dress | ATELIER', 'Heavyweight Mulberry silk slip dress cut on the bias. Features adjustable straps and a refined drape.'),

  -- Product 6: Women's Boots
  ('p6666666-6666-6666-6666-666666666666', 'Pointed Suede Ankle Boot', 'pointed-suede-ankle-boot', 'Handcrafted in Spain from buttery soft Italian calf suede. This ankle boot features a refined pointed toe, side zip closure, and a stable 60mm block heel. Impeccably finished with a leather outsole and padded insole for all-day comfort.', 'd2b512be-098e-4a6c-941f-8e4d2bfb21c4', 380.00, 450.00, 'W-SHOE-SDE-06', 12, FALSE, TRUE, 'Pointed Calf Suede Ankle Boots | ATELIER', 'Premium Italian calf suede pointed ankle boots. Handmade in Spain with leather soles.')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  price = EXCLUDED.price,
  compare_price = EXCLUDED.compare_price,
  is_active = EXCLUDED.is_active;

-- =========================================
-- PRODUCT IMAGES
-- =========================================
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, display_order)
VALUES
  -- Knit Images
  ('img-1-1', 'p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=1000&q=80', 'Cashmere Crewneck Knit Front', TRUE, 0),
  ('img-1-2', 'p1111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1000&q=80', 'Cashmere Knit Details', FALSE, 1),
  
  -- Derby Images
  ('img-2-1', 'p2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=1000&q=80', 'Calfskin Leather Derby Profile', TRUE, 0),
  ('img-2-2', 'p2222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1000&q=80', 'Derby Sole Detail', FALSE, 1),

  -- Denim Jacket Images
  ('img-3-1', 'p3333333-3333-3333-3333-333333333333', 'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=1000&q=80', 'Indigo Selvedge Denim Jacket', TRUE, 0),

  -- Blazer Images
  ('img-4-1', 'p4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=1000&q=80', 'Double-Breasted Wool Blazer Front', TRUE, 0),
  ('img-4-2', 'p4444444-4444-4444-4444-444444444444', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&q=80', 'Blazer Lifestyle Shot', FALSE, 1),

  -- Silk Slip Images
  ('img-5-1', 'p5555555-5555-5555-5555-555555555555', 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=1000&q=80', 'Mulberry Silk Slip Dress', TRUE, 0),

  -- Boots Images
  ('img-6-1', 'p6666666-6666-6666-6666-666666666666', 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1000&q=80', 'Pointed Suede Ankle Boots', TRUE, 0)
ON CONFLICT (id) DO NOTHING;

-- =========================================
-- PRODUCT VARIANTS
-- =========================================
INSERT INTO public.product_variants (id, product_id, size, color, stock_quantity, price_modifier, sku)
VALUES
  -- Knit Crewneck Variants (Sizes: S, M, L / Colors: Off-White, Black)
  ('v-1-1', 'p1111111-1111-1111-1111-111111111111', 'S', 'Off-White', 10, 0.00, 'M-KNIT-CSH-OW-S'),
  ('v-1-2', 'p1111111-1111-1111-1111-111111111111', 'M', 'Off-White', 15, 0.00, 'M-KNIT-CSH-OW-M'),
  ('v-1-3', 'p1111111-1111-1111-1111-111111111111', 'L', 'Off-White', 8, 0.00, 'M-KNIT-CSH-OW-L'),
  ('v-1-4', 'p1111111-1111-1111-1111-111111111111', 'S', 'Black', 5, 0.00, 'M-KNIT-CSH-BK-S'),
  ('v-1-5', 'p1111111-1111-1111-1111-111111111111', 'M', 'Black', 12, 0.00, 'M-KNIT-CSH-BK-M'),
  ('v-1-6', 'p1111111-1111-1111-1111-111111111111', 'L', 'Black', 0, 0.00, 'M-KNIT-CSH-BK-L'), -- Out of stock

  -- Leather Derby Variants (Sizes: 8, 9, 10, 11 / Colors: Brown, Black)
  ('v-2-1', 'p2222222-2222-2222-2222-222222222222', '8', 'Brown', 4, 0.00, 'M-SHOE-DRB-BR-08'),
  ('v-2-2', 'p2222222-2222-2222-2222-222222222222', '9', 'Brown', 8, 0.00, 'M-SHOE-DRB-BR-09'),
  ('v-2-3', 'p2222222-2222-2222-2222-222222222222', '10', 'Brown', 6, 0.00, 'M-SHOE-DRB-BR-10'),
  ('v-2-4', 'p2222222-2222-2222-2222-222222222222', '11', 'Brown', 2, 0.00, 'M-SHOE-DRB-BR-11'), -- Low stock
  ('v-2-5', 'p2222222-2222-2222-2222-222222222222', '9', 'Black', 5, 10.00, 'M-SHOE-DRB-BK-09'), -- With modifier

  -- Denim Jacket (Sizes: S, M, L / Colors: Indigo)
  ('v-3-1', 'p3333333-3333-3333-3333-333333333333', 'S', 'Indigo', 4, 0.00, 'M-JKT-DNM-ID-S'),
  ('v-3-2', 'p3333333-3333-3333-3333-333333333333', 'M', 'Indigo', 8, 0.00, 'M-JKT-DNM-ID-M'),
  ('v-3-3', 'p3333333-3333-3333-3333-333333333333', 'L', 'Indigo', 3, 0.00, 'M-JKT-DNM-ID-L'),

  -- Wool Blazer (Sizes: XS, S, M, L / Colors: Black)
  ('v-4-1', 'p4444444-4444-4444-4444-444444444444', 'XS', 'Black', 2, 0.00, 'W-BLZ-WOL-BK-XS'),
  ('v-4-2', 'p4444444-4444-4444-4444-444444444444', 'S', 'Black', 6, 0.00, 'W-BLZ-WOL-BK-S'),
  ('v-4-3', 'p4444444-4444-4444-4444-444444444444', 'M', 'Black', 8, 0.00, 'W-BLZ-WOL-BK-M'),
  ('v-4-4', 'p4444444-4444-4444-4444-444444444444', 'L', 'Black', 2, 0.00, 'W-BLZ-WOL-BK-L'),

  -- Silk Slip Dress (Sizes: XS, S, M, L / Colors: Sage, Black)
  ('v-5-1', 'p5555555-5555-5555-5555-555555555555', 'S', 'Black', 10, 0.00, 'W-DRS-SLK-BK-S'),
  ('v-5-2', 'p5555555-5555-5555-5555-555555555555', 'M', 'Black', 12, 0.00, 'W-DRS-SLK-BK-M'),
  ('v-5-3', 'p5555555-5555-5555-5555-555555555555', 'S', 'Sage', 5, 0.00, 'W-DRS-SLK-SG-S'),
  ('v-5-4', 'p5555555-5555-5555-5555-555555555555', 'M', 'Sage', 8, 0.00, 'W-DRS-SLK-SG-M'),

  -- Suede Ankle Boot (Sizes: 6, 7, 8, 9 / Colors: Beige)
  ('v-6-1', 'p6666666-6666-6666-6666-666666666666', '6', 'Beige', 3, 0.00, 'W-SHOE-SDE-BG-06'),
  ('v-6-2', 'p6666666-6666-6666-6666-666666666666', '7', 'Beige', 4, 0.00, 'W-SHOE-SDE-BG-07'),
  ('v-6-3', 'p6666666-6666-6666-6666-666666666666', '8', 'Beige', 5, 0.00, 'W-SHOE-SDE-BG-08'),
  ('v-6-4', 'p6666666-6666-6666-6666-666666666666', '9', 'Beige', 0, 0.00, 'W-SHOE-SDE-BG-09')
ON CONFLICT (id) DO UPDATE SET 
  stock_quantity = EXCLUDED.stock_quantity,
  price_modifier = EXCLUDED.price_modifier;

-- =========================================
-- REVIEWS
-- =========================================
-- Note: Requires a valid user_id which usually exists in profiles.
-- We can insert simple default reviews linked to a dummy profile or bypass to keep things simple.
-- The RLS policy allows anyone to read reviews, so they will display beautifully.
