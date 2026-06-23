
-- Add structured product properties
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS materials text,
  ADD COLUMN IF NOT EXISTS care_instructions text,
  ADD COLUMN IF NOT EXISTS available_sizes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS available_colors text[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS products_tags_idx ON public.products USING gin (tags);

-- Helper to swap display_order between two categories atomically
CREATE OR REPLACE FUNCTION public.swap_category_order(a uuid, b uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  oa int;
  ob int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  SELECT display_order INTO oa FROM public.categories WHERE id = a;
  SELECT display_order INTO ob FROM public.categories WHERE id = b;
  UPDATE public.categories SET display_order = ob WHERE id = a;
  UPDATE public.categories SET display_order = oa WHERE id = b;
END;
$$;

REVOKE ALL ON FUNCTION public.swap_category_order(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.swap_category_order(uuid, uuid) TO authenticated;
