-- The admins table has RLS enabled by default in Supabase
-- but had no policies, so authenticated users couldn't read it.
-- This caused the admin layout to always redirect to /login.

-- Allow authenticated users to check their own admin status
CREATE POLICY "Authenticated can read own admin record"
  ON public.admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());
