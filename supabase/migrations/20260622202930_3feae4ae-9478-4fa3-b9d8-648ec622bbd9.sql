
-- Tighten newsletter WITH CHECK to require a basic email shape
DROP POLICY IF EXISTS "newsletter_insert_public" ON public.newsletter_subscribers;
CREATE POLICY "newsletter_insert_public" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND char_length(email) BETWEEN 3 AND 254 AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

-- Lock down SECURITY DEFINER functions: revoke broad EXECUTE, grant only where needed
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
