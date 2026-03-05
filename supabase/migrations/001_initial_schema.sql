-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- ADMIN HELPER
-- ============================================================
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Authenticated users can check their own admin status
CREATE POLICY "Authenticated can read own admin record"
  ON public.admins FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Insert admin user
INSERT INTO public.admins (user_id) VALUES ('7c9bd88e-9f91-42c9-9364-d21098777022');

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = (SELECT auth.uid())
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '';

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read categories"
  ON public.categories FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin manages categories"
  ON public.categories FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Seed default categories
INSERT INTO public.categories (name, slug, description) VALUES
  ('Retirement Planning', 'retirement-planning', 'Articles about retirement annuities, two-pot system, and pension planning'),
  ('Tax-Free Investments', 'tax-free-investments', 'Articles about TFSA strategy, limits, and optimisation'),
  ('Business Protection', 'business-protection', 'Articles about key person insurance, buy-sell agreements, and business risk'),
  ('Financial Planning', 'financial-planning', 'General financial planning and wealth building articles'),
  ('Life Cover', 'life-cover', 'Articles about life insurance, disability, and income protection');

-- ============================================================
-- POSTS (Blog)
-- ============================================================
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB,                         -- TipTap JSON content
  excerpt TEXT,                          -- Short preview (max 300 chars)
  cover_image_url TEXT,                  -- Supabase Storage public URL
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  seo_title TEXT,                        -- Custom SEO title (optional)
  meta_description TEXT,                 -- Custom meta description (optional)
  reading_time INTEGER,                  -- Minutes, calculated on save
  published_at TIMESTAMPTZ,              -- Set when status changes to published
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_posts_updated
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_posts_slug ON public.posts(slug);
CREATE INDEX idx_posts_status ON public.posts(status, published_at DESC);
CREATE INDEX idx_posts_category ON public.posts(category_id);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Public reads published posts only (for the website API)
CREATE POLICY "Public can read published posts"
  ON public.posts FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Admin has full CRUD
CREATE POLICY "Admin full CRUD on posts"
  ON public.posts FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- ============================================================
-- MEDIA
-- ============================================================
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,            -- Path within Supabase Storage bucket
  public_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER,
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view media"
  ON public.media FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin manages media"
  ON public.media FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- ============================================================
-- AVAILABILITY (Calendar)
-- ============================================================
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      -- 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active availability"
  ON public.availability_slots FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Admin manages availability"
  ON public.availability_slots FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Seed default availability (Mon-Fri 9am-5pm SAST)
INSERT INTO public.availability_slots (day_of_week, start_time, end_time) VALUES
  (1, '09:00', '17:00'),  -- Monday
  (2, '09:00', '17:00'),  -- Tuesday
  (3, '09:00', '17:00'),  -- Wednesday
  (4, '09:00', '17:00'),  -- Thursday
  (5, '09:00', '17:00');  -- Friday

-- ============================================================
-- DATE OVERRIDES (block specific dates)
-- ============================================================
CREATE TABLE public.date_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  is_available BOOLEAN DEFAULT false,     -- false = blocked day
  start_time TIME,                        -- Custom hours (if is_available = true)
  end_time TIME,
  reason TEXT,                            -- e.g. "Public holiday", "Leave"
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.date_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read date overrides"
  ON public.date_overrides FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin manages date overrides"
  ON public.date_overrides FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  -- Range column for overlap prevention (populated by trigger)
  duration TSRANGE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,                             -- Client message
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- DATABASE-LEVEL double-booking prevention
  CONSTRAINT no_overlapping_bookings
    EXCLUDE USING GIST (duration WITH &&)
    WHERE (status NOT IN ('cancelled'))
);

-- Trigger to auto-populate the duration range from booking_date + start/end_time
CREATE OR REPLACE FUNCTION public.set_booking_duration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.duration := tsrange(
    (NEW.booking_date + NEW.start_time)::timestamp,
    (NEW.booking_date + NEW.end_time)::timestamp,
    '[)'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_booking_duration
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_booking_duration();

CREATE TRIGGER on_bookings_updated
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Public can create bookings (website visitors)
CREATE POLICY "Public can create bookings"
  ON public.bookings FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Public can read their own booking (by ID for confirmation page)
CREATE POLICY "Public can read bookings"
  ON public.bookings FOR SELECT TO anon, authenticated
  USING (true);

-- Admin has full access
CREATE POLICY "Admin manages bookings"
  ON public.bookings FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- ============================================================
-- SETTINGS (app-wide settings)
-- ============================================================
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read settings"
  ON public.settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin manages settings"
  ON public.settings FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Default settings
INSERT INTO public.settings (key, value) VALUES
  ('booking', '{"slot_duration_minutes": 30, "break_between_minutes": 15, "timezone": "Africa/Johannesburg", "max_advance_days": 60}'::jsonb),
  ('site', '{"name": "Nikita Naidoo Financial Advisory", "domain": "nikitatrusha.co.za"}'::jsonb);

-- ============================================================
-- STORAGE POLICIES (run in Supabase Dashboard > SQL Editor after creating bucket)
-- ============================================================
-- CREATE POLICY "Public read blog images"
--   ON storage.objects FOR SELECT TO anon, authenticated
--   USING (bucket_id = 'blog-images');
--
-- CREATE POLICY "Admin upload blog images"
--   ON storage.objects FOR INSERT TO authenticated
--   WITH CHECK (bucket_id = 'blog-images' AND (SELECT public.is_admin()));
--
-- CREATE POLICY "Admin delete blog images"
--   ON storage.objects FOR DELETE TO authenticated
--   USING (bucket_id = 'blog-images' AND (SELECT public.is_admin()));
