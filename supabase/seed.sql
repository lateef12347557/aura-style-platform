-- Enable pgcrypto extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Ensure the admin user exists in auth.users and has the admin role in public.user_roles
DO $$
DECLARE
  new_user_id UUID := 'a0000000-0000-0000-0000-000000000000'; -- Fixed custom UUID for testing admin
  pwd_hash TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'testing@gmail.com') THEN
    -- Admin user exists, make sure they have the admin role
    INSERT INTO public.user_roles (user_id, role)
    SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'testing@gmail.com'
    ON CONFLICT DO NOTHING;
  ELSE
    -- Hashing the password 'testing' with bcrypt
    pwd_hash := crypt('testing', gen_salt('bf', 10));

    -- Insert user into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role,
      created_at,
      updated_at
    )
    VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'testing@gmail.com',
      pwd_hash,
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Admin User"}',
      'authenticated',
      'authenticated',
      now(),
      now()
    );

    -- Insert role into public.user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (new_user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 2. Clean up existing catalog data to avoid constraint violations
DELETE FROM public.reviews;
DELETE FROM public.order_items;
DELETE FROM public.orders;
DELETE FROM public.product_variants;
DELETE FROM public.product_images;
DELETE FROM public.products;
DELETE FROM public.categories;

-- 3. Seed Categories
-- Only "Male" and "Female" top-level categories. Subcategories are linked to them.
INSERT INTO public.categories (id, name, slug, gender, type, parent_id, image_url, is_active, display_order)
VALUES
  -- Male Top-Level
  ('11111111-1111-1111-1111-111111111111', 'Male', 'men', 'male', 'clothing', NULL, 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=800&q=80', TRUE, 0),
  -- Male Subcategories
  ('11111111-1111-1111-1111-111111111112', 'Trousers', 'men-trousers', 'male', 'clothing', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=800&q=80', TRUE, 1),
  ('11111111-1111-1111-1111-111111111113', 'Shirts', 'men-shirts', 'male', 'clothing', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1000&q=80', TRUE, 2),
  ('11111111-1111-1111-1111-111111111114', 'Shoes', 'men-shoes', 'male', 'shoes', '11111111-1111-1111-1111-111111111111', 'https://images.unsplash.com/photo-1486307991290-7c935c10298b?w=800&q=80', TRUE, 3),

  -- Female Top-Level
  ('22222222-2222-2222-2222-222222222222', 'Female', 'women', 'female', 'clothing', NULL, 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&q=80', TRUE, 4),
  -- Female Subcategories
  ('22222222-2222-2222-2222-222222222223', 'Trousers', 'women-trousers', 'female', 'clothing', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80', TRUE, 5),
  ('22222222-2222-2222-2222-222222222224', 'Shirts', 'women-shirts', 'female', 'clothing', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=1000&q=80', TRUE, 6),
  ('22222222-2222-2222-2222-222222222225', 'Shoes', 'women-shoes', 'female', 'shoes', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80', TRUE, 7);

-- 4. Seed Products (Must be assigned to a leaf subcategory)
INSERT INTO public.products (id, name, slug, description, category_id, price, compare_price, sku, stock_quantity, is_featured, is_active, meta_title, meta_description)
VALUES
  -- Product 1: Men's Knit (Shirts/Sweaters Subcategory)
  ('00000000-0000-0000-0000-000000000001', 'Cashmere Knit Crewneck', 'cashmere-knit-crewneck', 'Knitted from fine Grade-A Mongolian cashmere, this classic crewneck sweater offers an incredibly soft hand-feel and superior insulation. Featuring rib-knit details at the collar, cuffs, and hem, it has a relaxed yet tailored fit suitable for layering.', '11111111-1111-1111-1111-111111111113', 290.00, 350.00, 'M-KNIT-CSH-01', 34, TRUE, TRUE, 'Cashmere Knit Crewneck sweater | MDCLASSIC WEARS', 'Buy our premium Mongolian cashmere crewneck sweater. Soft, warm, and tailored for quiet luxury.'),
  
  -- Product 2: Men's Derby (Shoes Subcategory)
  ('00000000-0000-0000-0000-000000000002', 'Classic Leather Derby', 'classic-leather-derby', 'Crafted from hand-painted calfskin leather in Tuscany, Italy, these Derby shoes combine classic heritage styling with modern comfort. Built with a Goodyear-welted double leather sole and memory foam footbed, they are designed to age beautifully.', '11111111-1111-1111-1111-111111111114', 410.00, NULL, 'M-SHOE-DRB-02', 20, TRUE, TRUE, 'Classic Calfskin Leather Derby Shoes | MDCLASSIC WEARS', 'Goodyear welted leather derby shoes handmade in Tuscany, Italy. Classic elegance meets everyday versatility.'),

  -- Product 3: Men's Denim Jacket (Shirts/Outerwear Subcategory)
  ('00000000-0000-0000-0000-000000000003', 'Raw Denim Utility Jacket', 'raw-denim-utility-jacket', 'This utility jacket is constructed from 14oz Japanese selvedge denim, left unwashed to preserve the rich deep indigo dye. Features durable triple-needle stitching, copper shank buttons, and four front pockets. Built to fade and soften uniquely with wear.', '11111111-1111-1111-1111-111111111113', 195.00, 220.00, 'M-JKT-DNM-03', 15, FALSE, TRUE, 'Raw Selvedge Denim Utility Jacket | MDCLASSIC WEARS', 'Japanese selvedge raw denim utility jacket. Unwashed indigo finish designed to fade with character.'),

  -- Product 4: Women's Blazer (Shirts/Outerwear Subcategory)
  ('00000000-0000-0000-0000-000000000004', 'Double-Breasted Wool Blazer', 'double-breasted-wool-blazer', 'An update on a timeless wardrobe anchor. This blazer is tailored from lightweight virgin wool with sharp structured shoulders, double-breasted button fastening, and peak lapels. Fully lined in cupro for smooth layering.', '22222222-2222-2222-2222-222222222224', 340.00, 395.00, 'W-BLZ-WOL-04', 18, TRUE, TRUE, 'Tailored Double-Breasted Wool Blazer | MDCLASSIC WEARS', 'Lightweight virgin wool structured double-breasted blazer for women. Finished with peak lapels and cupro lining.'),

  -- Product 5: Women's Silk Slip (Shirts/Dresses Subcategory)
  ('00000000-0000-0000-0000-000000000005', 'Heavyweight Silk Slip Dress', 'heavyweight-silk-slip-dress', 'Cut on the bias to drape effortlessly over the body, this slip dress is made from lustrous 22-momme Mulberry silk. Designed with a clean V-neckline, adjustable thin spaghetti straps, and a low open back. Dress it down with knits or elevate with heels.', '22222222-2222-2222-2222-222222222224', 240.00, NULL, 'W-DRS-SLK-05', 25, TRUE, TRUE, 'Mulberry Silk Bias-Cut Slip Dress | MDCLASSIC WEARS', 'Heavyweight Mulberry silk slip dress cut on the bias. Features adjustable straps and a refined drape.'),

  -- Product 6: Women's Boots (Shoes Subcategory)
  ('00000000-0000-0000-0000-000000000006', 'Pointed Suede Ankle Boot', 'pointed-suede-ankle-boot', 'Handcrafted in Spain from buttery soft Italian calf suede. This ankle boot features a refined pointed toe, side zip closure, and a stable 60mm block heel. Impeccably finished with a leather outsole and padded insole for all-day comfort.', '22222222-2222-2222-2222-222222222225', 380.00, 450.00, 'W-SHOE-SDE-06', 12, FALSE, TRUE, 'Pointed Calf Suede Ankle Boots | MDCLASSIC WEARS', 'Premium Italian calf suede pointed ankle boots. Handmade in Spain with leather soles.');

-- 5. Seed Product Images
INSERT INTO public.product_images (id, product_id, image_url, alt_text, is_primary, display_order)
VALUES
  ('f1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1614975058789-41316d0e2e9c?w=1000&q=80', 'Cashmere Crewneck Knit Front', TRUE, 0),
  ('f1111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=1000&q=80', 'Cashmere Knit Details', FALSE, 1),
  ('f2222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=1000&q=80', 'Calfskin Leather Derby Profile', TRUE, 0),
  ('f2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=1000&q=80', 'Derby Sole Detail', FALSE, 1),
  ('f3333333-3333-3333-3333-333333333331', '00000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=1000&q=80', 'Indigo Selvedge Denim Jacket', TRUE, 0),
  ('f4444444-4444-4444-4444-444444444441', '00000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=1000&q=80', 'Double-Breasted Wool Blazer Front', TRUE, 0),
  ('f4444444-4444-4444-4444-444444444442', '00000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&q=80', 'Blazer Lifestyle Shot', FALSE, 1),
  ('f5555555-5555-5555-5555-555555555551', '00000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=1000&q=80', 'Mulberry Silk Slip Dress', TRUE, 0),
  ('f6666666-6666-6666-6666-666666666661', '00000000-0000-0000-0000-000000000006', 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=1000&q=80', 'Pointed Suede Ankle Boots', TRUE, 0);

-- 6. Seed Product Variants
INSERT INTO public.product_variants (id, product_id, size, color, stock_quantity, price_modifier, sku)
VALUES
  ('e1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'S', 'Off-White', 10, 0, 'M-KNIT-CSH-OW-S'),
  ('e1111111-1111-1111-1111-111111111112', '00000000-0000-0000-0000-000000000001', 'M', 'Off-White', 15, 0, 'M-KNIT-CSH-OW-M'),
  ('e1111111-1111-1111-1111-111111111113', '00000000-0000-0000-0000-000000000001', 'L', 'Off-White', 8, 0, 'M-KNIT-CSH-OW-L'),
  ('e1111111-1111-1111-1111-111111111114', '00000000-0000-0000-0000-000000000001', 'S', 'Black', 5, 0, 'M-KNIT-CSH-BK-S'),
  ('e1111111-1111-1111-1111-111111111115', '00000000-0000-0000-0000-000000000001', 'M', 'Black', 12, 0, 'M-KNIT-CSH-BK-M'),
  ('e1111111-1111-1111-1111-111111111116', '00000000-0000-0000-0000-000000000001', 'L', 'Black', 0, 0, 'M-KNIT-CSH-BK-L'),
  ('e2222222-2222-2222-2222-222222222221', '00000000-0000-0000-0000-000000000002', '8', 'Brown', 4, 0, 'M-SHOE-DRB-BR-08'),
  ('e2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', '9', 'Brown', 8, 0, 'M-SHOE-DRB-BR-09'),
  ('e2222222-2222-2222-2222-222222222223', '00000000-0000-0000-0000-000000000002', '10', 'Brown', 6, 0, 'M-SHOE-DRB-BR-10'),
  ('e2222222-2222-2222-2222-222222222224', '00000000-0000-0000-0000-000000000002', '11', 'Brown', 2, 0, 'M-SHOE-DRB-BR-11'),
  ('e2222222-2222-2222-2222-222222222225', '00000000-0000-0000-0000-000000000002', '9', 'Black', 5, 10, 'M-SHOE-DRB-BK-09'),
  ('e3333333-3333-3333-3333-333333333331', '00000000-0000-0000-0000-000000000003', 'S', 'Indigo', 4, 0, 'M-JKT-DNM-ID-S'),
  ('e3333333-3333-3333-3333-333333333332', '00000000-0000-0000-0000-000000000003', 'M', 'Indigo', 8, 0, 'M-JKT-DNM-ID-M'),
  ('e3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000003', 'L', 'Indigo', 3, 0, 'M-JKT-DNM-ID-L'),
  ('e4444444-4444-4444-4444-444444444441', '00000000-0000-0000-0000-000000000004', 'XS', 'Black', 2, 0, 'W-BLZ-WOL-BK-XS'),
  ('e4444444-4444-4444-4444-444444444442', '00000000-0000-0000-0000-000000000004', 'S', 'Black', 6, 0, 'W-BLZ-WOL-BK-S'),
  ('e4444444-4444-4444-4444-444444444443', '00000000-0000-0000-0000-000000000004', 'M', 'Black', 8, 0, 'W-BLZ-WOL-BK-M'),
  ('e4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000004', 'L', 'Black', 2, 0, 'W-BLZ-WOL-BK-L'),
  ('e5555555-5555-5555-5555-555555555551', '00000000-0000-0000-0000-000000000005', 'S', 'Black', 10, 0, 'W-DRS-SLK-BK-S'),
  ('e5555555-5555-5555-5555-555555555552', '00000000-0000-0000-0000-000000000005', 'M', 'Black', 12, 0, 'W-DRS-SLK-BK-M'),
  ('e5555555-5555-5555-5555-555555555553', '00000000-0000-0000-0000-000000000005', 'S', 'Sage', 5, 0, 'W-DRS-SLK-SG-S'),
  ('e5555555-5555-5555-5555-555555555554', '00000000-0000-0000-0000-000000000005', 'M', 'Sage', 8, 0, 'W-DRS-SLK-SG-M'),
  ('e6666666-6666-6666-6666-666666666661', '00000000-0000-0000-0000-000000000006', '6', 'Beige', 3, 0, 'W-SHOE-SDE-BG-06'),
  ('e6666666-6666-6666-6666-666666666662', '00000000-0000-0000-0000-000000000006', '7', 'Beige', 4, 0, 'W-SHOE-SDE-BG-07'),
  ('e6666666-6666-6666-6666-666666666663', '00000000-0000-0000-0000-000000000006', '8', 'Beige', 5, 0, 'W-SHOE-SDE-BG-08'),
  ('e6666666-6666-6666-6666-666666666664', '00000000-0000-0000-0000-000000000006', '9', 'Beige', 0, 0, 'W-SHOE-SDE-BG-09');
