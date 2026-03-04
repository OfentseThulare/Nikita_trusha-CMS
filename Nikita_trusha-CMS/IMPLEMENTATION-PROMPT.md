# CMS Implementation Prompt — Nikita Trusha CMS

> **Instructions for Claude Code**: Build a complete CMS admin panel from scratch using Next.js 15 App Router + Supabase + TipTap. This is a standalone application deployed separately from the main website (nikitatrusha.co.za). The CMS provides two core functions: blog management and booking/calendar management with Google Meet integration.

---

## TECH STACK (non-negotiable)

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router, Server Components, Server Actions) |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Rich Text | TipTap (JSON storage in JSONB column) |
| Auth | Supabase Auth (@supabase/ssr, cookie-based) |
| Calendar | Google Calendar API + Google Meet (googleapis npm) |
| Deployment | Vercel |
| Language | TypeScript (strict mode) |

---

## PROJECT STRUCTURE

```
nikita-trusha-cms/
├── .env.local                          # Environment variables (never commit)
├── .env.example                        # Template for env vars
├── next.config.ts
├── middleware.ts                        # Auth guard + CORS for API routes
├── package.json
├── tailwind.config.ts
├── tsconfig.json
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (Inter font, Toaster)
│   │   ├── page.tsx                    # Redirect to /admin/dashboard
│   │   │
│   │   ├── (auth)/                     # Route group: login (no sidebar)
│   │   │   ├── layout.tsx              # Centered card layout
│   │   │   └── login/
│   │   │       └── page.tsx            # Email/password + Google OAuth
│   │   │
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts            # OAuth callback handler
│   │   │
│   │   ├── admin/                      # Protected admin routes
│   │   │   ├── layout.tsx              # Sidebar + header + auth check
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx            # Overview: recent posts, upcoming bookings
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx            # Post list (draft/published filters)
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx        # TipTap editor — create new post
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx    # TipTap editor — edit existing
│   │   │   ├── media/
│   │   │   │   └── page.tsx            # Media library (upload, browse, delete)
│   │   │   ├── bookings/
│   │   │   │   └── page.tsx            # View/manage all bookings
│   │   │   ├── availability/
│   │   │   │   └── page.tsx            # Set weekly hours + block dates
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx            # Google Calendar connection + sync status
│   │   │   └── settings/
│   │   │       └── page.tsx            # Profile, Google account, API key
│   │   │
│   │   └── api/
│   │       └── v1/
│   │           ├── posts/
│   │           │   ├── route.ts        # GET published posts (public API)
│   │           │   └── [slug]/
│   │           │       └── route.ts    # GET single post by slug
│   │           ├── availability/
│   │           │   └── route.ts        # GET available booking slots
│   │           ├── book/
│   │           │   └── route.ts        # POST create a booking
│   │           └── categories/
│   │               └── route.ts        # GET all categories
│   │
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components (auto-generated)
│   │   ├── editor/
│   │   │   ├── tiptap-editor.tsx       # Main TipTap editor component
│   │   │   ├── toolbar.tsx             # Editor toolbar (bold, italic, headings, image, link)
│   │   │   └── image-upload.tsx        # Image upload within editor
│   │   ├── posts/
│   │   │   ├── post-form.tsx           # Full post create/edit form
│   │   │   ├── post-list.tsx           # DataTable of posts
│   │   │   └── post-status-badge.tsx   # Draft/Published badge
│   │   ├── bookings/
│   │   │   ├── booking-list.tsx        # DataTable of bookings
│   │   │   └── booking-status-badge.tsx
│   │   ├── availability/
│   │   │   ├── weekly-schedule.tsx      # Toggle hours per day of week
│   │   │   └── date-override.tsx       # Block specific dates
│   │   ├── media/
│   │   │   ├── media-grid.tsx          # Grid of uploaded images
│   │   │   ├── upload-zone.tsx         # Drag-and-drop upload
│   │   │   └── media-picker-dialog.tsx # Reusable image picker for editor
│   │   └── layout/
│   │       ├── admin-sidebar.tsx       # Sidebar navigation
│   │       ├── admin-header.tsx        # Top bar with user menu
│   │       └── mobile-nav.tsx          # Responsive mobile nav
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # createBrowserClient
│   │   │   ├── server.ts              # createServerClient (cookies)
│   │   │   └── admin.ts               # Service role client (API routes only)
│   │   ├── google/
│   │   │   ├── calendar.ts            # Google Calendar API helpers
│   │   │   └── auth.ts                # OAuth2 token management
│   │   ├── actions/
│   │   │   ├── posts.ts               # Server Actions: CRUD posts
│   │   │   ├── media.ts               # Server Actions: upload/delete media
│   │   │   ├── bookings.ts            # Server Actions: manage bookings
│   │   │   ├── availability.ts        # Server Actions: set availability
│   │   │   └── auth.ts                # Server Actions: login/logout
│   │   ├── utils/
│   │   │   ├── slug.ts                # Slug generation + uniqueness check
│   │   │   ├── reading-time.ts        # Calculate reading time from content
│   │   │   └── dates.ts               # Date/time helpers (SAST timezone)
│   │   └── validators/
│   │       ├── post.ts                # Zod schemas for posts
│   │       ├── booking.ts             # Zod schemas for bookings
│   │       └── availability.ts        # Zod schemas for availability
│   │
│   └── types/
│       ├── database.ts                # Supabase generated types
│       └── index.ts                   # Shared types
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql     # Full database schema
│
└── IMPLEMENTATION-PROMPT.md           # This file
```

---

## PHASE 1: PROJECT INITIALIZATION

### 1.1 Create Next.js project

```bash
npx create-next-app@latest nikita-trusha-cms --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 1.2 Install all dependencies

```bash
# Core
npm install @supabase/supabase-js @supabase/ssr

# UI
npx shadcn@latest init
npx shadcn@latest add button input textarea select dialog dropdown-menu \
  sidebar data-table tabs badge card separator form label avatar command \
  table toast sonner sheet popover calendar checkbox switch

# Rich Text Editor
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit \
  @tiptap/extension-image @tiptap/extension-link \
  @tiptap/extension-placeholder @tiptap/extension-underline \
  @tiptap/extension-text-align @tiptap/extension-code-block-lowlight \
  @tiptap/html lowlight

# Google Calendar
npm install googleapis uuid

# Utilities
npm install zod react-hook-form @hookform/resolvers \
  date-fns lucide-react react-dropzone sonner reading-time

# Dev
npm install -D @types/uuid supabase
```

### 1.3 Environment variables

Create `.env.example`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Calendar OAuth (for Nikita to connect her Google account)
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Stored after Nikita connects her Google account (populated at runtime)
GOOGLE_REFRESH_TOKEN=

# API Security
PUBLIC_API_KEY=generate-a-uuid-here
ALLOWED_ORIGIN=https://nikitatrusha.co.za

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-random-string
```

---

## PHASE 2: DATABASE SCHEMA (Supabase)

### 2.1 Create migration file

Create `supabase/migrations/001_initial_schema.sql` with the following:

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================
-- ADMIN HELPER
-- ============================================================
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- After Nikita signs up, insert her UUID:
-- INSERT INTO public.admins (user_id) VALUES ('her-uuid-here');

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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  -- Range column for overlap prevention
  duration TSTZRANGE GENERATED ALWAYS AS (
    tstzrange(
      (booking_date || ' ' || start_time)::timestamptz,
      (booking_date || ' ' || end_time)::timestamptz,
      '[)'
    )
  ) STORED,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,                             -- Client message
  meet_link TEXT,                         -- Google Meet URL (auto-generated)
  google_event_id TEXT,                   -- Google Calendar event ID
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- DATABASE-LEVEL double-booking prevention
  CONSTRAINT no_overlapping_bookings
    EXCLUDE USING GIST (duration WITH &&)
    WHERE (status NOT IN ('cancelled'))
);

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
-- GOOGLE TOKENS (store Nikita's OAuth tokens securely)
-- ============================================================
CREATE TABLE public.google_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER on_google_tokens_updated
  BEFORE UPDATE ON public.google_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- Only admin can access tokens
CREATE POLICY "Admin manages google tokens"
  ON public.google_tokens FOR ALL TO authenticated
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
```

### 2.2 Create Supabase Storage bucket

In Supabase Dashboard > Storage:
- Create bucket: `blog-images`
- Set to **Public** (images need to be visible on the website)
- Add storage policies:

```sql
-- Anyone can VIEW images
CREATE POLICY "Public read blog images"
  ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'blog-images');

-- Only admin can UPLOAD
CREATE POLICY "Admin upload blog images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-images' AND (SELECT public.is_admin()));

-- Only admin can DELETE
CREATE POLICY "Admin delete blog images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'blog-images' AND (SELECT public.is_admin()));
```

---

## PHASE 3: AUTHENTICATION

### 3.1 Supabase client setup

**`src/lib/supabase/client.ts`** — Browser client:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** — Server client (cookies):
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch { /* Server Component — ignore */ }
        },
      },
    }
  )
}
```

**`src/lib/supabase/admin.ts`** — Service role client (API routes only):
```typescript
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

### 3.2 Middleware — Auth guard + CORS

**`middleware.ts`** (project root):
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // --- CORS for public API routes ---
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    // Validate API key
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.PUBLIC_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
    return response
  }

  // --- Auth for admin routes ---
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: Use getUser(), NOT getSession()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/v1/:path*',
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 3.3 Login page

**`src/app/(auth)/login/page.tsx`**:
- Email + password form (Supabase `signInWithPassword`)
- "Sign in with Google" button (Supabase `signInWithOAuth({ provider: 'google' })`)
- Design: centered card on blue-gradient background matching nikitatrusha.co.za branding
- Colours: use `--blue-primary: #0033A0`, `--blue-dark: #001F6B`, white card
- After login: redirect to `/admin/dashboard`
- Error handling: show toast via Sonner

### 3.4 OAuth callback

**`src/app/auth/callback/route.ts`**:
```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/admin/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

### 3.5 Admin layout with auth check

**`src/app/admin/layout.tsx`**:
- Server Component
- Call `supabase.auth.getUser()` — redirect to `/login` if not authenticated
- Verify user is in `admins` table — redirect to `/` if not admin
- Render sidebar layout with:
  - Sidebar: Dashboard, Posts, Media, Bookings, Availability, Calendar, Settings
  - Header: "Nikita Trusha CMS" branding + user avatar dropdown (Sign Out)
  - Mobile: hamburger menu with sheet overlay

---

## PHASE 4: BLOG MANAGEMENT

### 4.1 Post list page (`/admin/posts`)

- DataTable with columns: Title, Status (badge), Category, Published Date, Actions
- Status filter tabs: All | Draft | Published | Archived
- Search by title (debounced, server-side `.ilike()`)
- "New Post" button → `/admin/posts/new`
- Actions dropdown: Edit, Preview, Publish/Unpublish, Delete (with confirmation dialog)

### 4.2 Post editor (`/admin/posts/new` and `/admin/posts/[id]/edit`)

**Layout**: Two-column on desktop (editor left, metadata sidebar right). Single column on mobile.

**Left column — Editor**:
- Title input (large, no border, placeholder "Post title...")
- Auto-generated slug below title (editable, with uniqueness check)
- TipTap editor with toolbar:
  - Text: Bold, Italic, Underline, Strikethrough
  - Headings: H2, H3, H4
  - Lists: Bullet, Ordered
  - Block: Blockquote, Code Block, Horizontal Rule
  - Media: Image (opens media picker dialog OR drag-drop upload)
  - Link: Insert/edit link
  - Alignment: Left, Centre, Right
- Editor stores content as JSON via `editor.getJSON()`
- Set `immediatelyRender: false` for SSR compatibility

**Right column — Metadata sidebar**:
- Status: Draft / Published (select)
- Category: dropdown (from categories table)
- Cover Image: upload zone (click or drag) → stores in Supabase Storage
- Excerpt: textarea (max 300 chars, auto-generated from content if empty)
- SEO section (collapsible):
  - SEO Title (optional, falls back to title)
  - Meta Description (optional, falls back to excerpt)
- Reading time: auto-calculated, displayed as badge

**Actions bar** (sticky top):
- Back button
- "Save Draft" button (saves without publishing)
- "Publish" button (sets status to published, sets published_at)
- Auto-save indicator

### 4.3 Server Actions for posts

**`src/lib/actions/posts.ts`**:

```typescript
'use server'

// createPost(formData) — insert new post as draft
// updatePost(id, formData) — update existing post
// publishPost(id) — set status='published', published_at=now()
// unpublishPost(id) — set status='draft'
// archivePost(id) — set status='archived'
// deletePost(id) — hard delete
// All actions: validate with Zod, check admin, revalidatePath
```

### 4.4 TipTap configuration

Extensions to include:
- `StarterKit` (Document, Paragraph, Text, Bold, Italic, Strike, Code, Headings H1-H6, BulletList, OrderedList, ListItem, Blockquote, HorizontalRule, HardBreak, History)
- `Image` (with upload handler → Supabase Storage)
- `Link` (with URL validation, `rel="noopener noreferrer"`, `target="_blank"`)
- `Placeholder` ("Start writing your article...")
- `Underline`
- `TextAlign` (left, centre, right)
- `CodeBlockLowlight` (syntax highlighting)

**Image upload in editor**: When user inserts an image:
1. Open media picker dialog (shows existing images from media table)
2. OR upload new image via drag-drop
3. Upload to Supabase Storage `blog-images/posts/` folder
4. Insert record into `media` table
5. Insert image node into TipTap with the public URL

---

## PHASE 5: MEDIA LIBRARY

### 5.1 Media library page (`/admin/media`)

- Grid of image thumbnails (responsive: 4 columns desktop, 2 mobile)
- Upload zone at top (drag-and-drop, react-dropzone)
- Each image card: thumbnail, filename, size, date, alt text
- Click image: show detail panel (edit alt text, copy URL, delete)
- Delete with confirmation dialog
- File type validation: only allow jpg, jpeg, png, gif, webp, svg
- Max file size: 5MB per image
- Upload to Supabase Storage bucket `blog-images`
- File path: `posts/{uuid}.{ext}` (UUID filenames prevent collisions)

### 5.2 Media picker dialog (reusable)

- Used in post editor when inserting images
- Shows grid of existing media
- "Upload New" tab
- Returns selected image URL to the editor

---

## PHASE 6: GOOGLE CALENDAR & MEET INTEGRATION

### 6.1 Google Cloud Console setup (document for Nikita)

Create a setup guide section in `/admin/calendar` that explains:
1. Go to console.cloud.google.com
2. Create project "Nikita Trusha CMS"
3. Enable Google Calendar API
4. Configure OAuth consent screen (External, Testing mode)
5. Add Nikita's Google email as a test user
6. Create OAuth 2.0 Client ID (Web application)
7. Set redirect URI: `{CMS_URL}/api/auth/google/callback`
8. Copy Client ID + Secret to CMS settings

### 6.2 Google OAuth flow for calendar access

**`src/app/api/auth/google/route.ts`** — Initiates OAuth:
```typescript
import { google } from 'googleapis'

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.freebusy',
    ],
  })

  return Response.redirect(authUrl)
}
```

**`src/app/api/auth/google/callback/route.ts`** — Handles callback:
```typescript
// Exchange code for tokens
// Store access_token, refresh_token in google_tokens table
// Redirect to /admin/calendar with success message
```

### 6.3 Google Calendar helper (`src/lib/google/calendar.ts`)

```typescript
import { google } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { createAdminClient } from '@/lib/supabase/admin'

// getOAuth2Client() — create client, load tokens from DB, auto-refresh if expired
// checkAvailability(date) — call freebusy.query, return busy periods
// createBookingEvent(booking) — create calendar event with conferenceData for Meet link
// cancelBookingEvent(googleEventId) — delete calendar event
```

**Creating event with auto Meet link**:
```typescript
const event = await calendar.events.insert({
  calendarId: 'primary',
  conferenceDataVersion: 1,        // REQUIRED for Meet link
  sendUpdates: 'all',              // Sends invite emails
  requestBody: {
    summary: `Consultation — ${clientName}`,
    description: `Financial planning consultation\nClient: ${clientName}\nEmail: ${clientEmail}`,
    start: {
      dateTime: `${date}T${startTime}:00+02:00`,
      timeZone: 'Africa/Johannesburg',
    },
    end: {
      dateTime: `${date}T${endTime}:00+02:00`,
      timeZone: 'Africa/Johannesburg',
    },
    attendees: [
      { email: clientEmail },
      { email: 'nikita.naidoo@sanlam4u.co.za' },
    ],
    conferenceData: {
      createRequest: {
        requestId: uuidv4(),       // MUST be unique per event
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 60 },
        { method: 'popup', minutes: 15 },
      ],
    },
  },
})

// Extract Meet link from response
const meetLink = event.data.conferenceData?.entryPoints
  ?.find(ep => ep.entryPointType === 'video')?.uri
```

### 6.4 Fallback: Manual availability (if Google not connected)

If Nikita has NOT connected her Google account:
- Availability is managed purely from the `availability_slots` and `date_overrides` tables
- Bookings are created in the database only (no Google Calendar event)
- No Meet link is auto-generated (Nikita manually sends one)
- Show a banner in `/admin/calendar`: "Connect your Google account to auto-generate Meet links"

The system must work fully without Google — Google is an enhancement, not a requirement.

---

## PHASE 7: AVAILABILITY & BOOKING MANAGEMENT

### 7.1 Availability page (`/admin/availability`)

**Weekly schedule editor**:
- 7-row grid (Sunday–Saturday)
- Each row: day name, toggle switch (active/inactive), start time picker, end time picker
- Default: Mon–Fri 09:00–17:00, Sat–Sun off
- Save button → upsert into `availability_slots` table

**Date overrides section**:
- Calendar view (shadcn Calendar component)
- Click a date to:
  - Block it entirely (add date_override with is_available=false)
  - Set custom hours (add date_override with is_available=true + custom times)
  - Add a reason (e.g., "Public holiday", "Conference")
- Show blocked dates highlighted in red on the calendar
- List of upcoming overrides with delete option

### 7.2 Bookings page (`/admin/bookings`)

- DataTable with columns: Client Name, Email, Phone, Date, Time, Status, Meet Link, Actions
- Status filter tabs: All | Pending | Confirmed | Completed | Cancelled
- Actions: Confirm, Cancel, Mark Complete
- Confirm action: if Google is connected, create Calendar event + Meet link
- Cancel action: if Google event exists, delete it from calendar
- Click row to expand: see client notes, booking details

### 7.3 Calendar page (`/admin/calendar`)

- Google account connection status
- "Connect Google Calendar" button (starts OAuth flow)
- "Disconnect" button (deletes tokens from DB)
- If connected: show sync status, last sync time, connected email
- Test button: "Create test event" to verify the connection works

---

## PHASE 8: PUBLIC API (for nikitatrusha.co.za)

### 8.1 Blog API

**`GET /api/v1/posts`** — List published posts:
- Query params: `page`, `limit`, `category`
- Returns: `{ posts: [...], pagination: { page, limit, total, totalPages } }`
- Each post includes: id, title, slug, excerpt, cover_image_url, category, reading_time, published_at
- Does NOT include full content (for listing pages)
- Requires `x-api-key` header

**`GET /api/v1/posts/[slug]`** — Single post:
- Returns full post including content (TipTap JSON)
- Include `seo_title`, `meta_description` for the website to use in meta tags
- Convert TipTap JSON to HTML using `generateHTML()` from `@tiptap/html`
- Return both `content_json` and `content_html`

**`GET /api/v1/categories`** — All categories

### 8.2 Availability/Booking API

**`GET /api/v1/availability?date=2026-03-10`** — Available slots for a date:
1. Check if date has a date_override (blocked or custom hours)
2. Get the day_of_week availability from availability_slots
3. Get existing bookings for that date
4. If Google is connected: also call `freebusy.query` for Nikita's calendar
5. Compute available time slots (subtract booked + busy from available)
6. Return array of `{ start: "09:00", end: "09:30" }` slots
- Requires `x-api-key` header

**`POST /api/v1/book`** — Create a booking:
- Body: `{ name, email, phone, date, start_time, end_time, notes }`
- Validate with Zod
- Insert into bookings table (DB exclusion constraint prevents double-booking)
- If Google connected: create Calendar event with Meet link
- Return: `{ booking_id, status, meet_link (if available) }`
- Requires `x-api-key` header

### 8.3 CORS configuration

All `/api/v1/*` routes must include CORS headers:
- `Access-Control-Allow-Origin`: value of `ALLOWED_ORIGIN` env var (default: `https://nikitatrusha.co.za`)
- `Access-Control-Allow-Methods`: `GET, POST, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type, x-api-key`
- Handle `OPTIONS` preflight requests

---

## PHASE 9: ADMIN DASHBOARD

### 9.1 Dashboard page (`/admin/dashboard`)

Simple overview with cards:
- **Recent Posts**: Last 5 posts with status badges
- **Upcoming Bookings**: Next 5 confirmed bookings with date/time
- **Quick Stats**: Total posts (published), Total bookings (this month), Google connection status
- Quick action buttons: "New Post", "View Bookings"

---

## PHASE 10: DESIGN & BRANDING

### 10.1 Colour palette (match nikitatrusha.co.za)

```css
/* Tailwind CSS custom colours in tailwind.config.ts */
colors: {
  brand: {
    primary: '#0033A0',     /* --blue-primary */
    dark: '#001F6B',        /* --blue-dark */
    light: '#E8F0FB',       /* --blue-light */
    accent: '#1A56DB',      /* --blue-accent */
  }
}
```

### 10.2 Design principles

- Clean, professional admin UI — not flashy, functional
- White backgrounds, subtle shadows, rounded corners
- Inter font (Google Fonts, same as main website)
- Sidebar: white with brand-primary active state
- Header: white with subtle bottom border
- Cards: white, shadow-sm, radius-md
- Buttons: brand-primary for primary actions, outline for secondary
- Status badges: green (published), yellow (draft/pending), grey (archived), red (cancelled)
- Toast notifications: bottom-right, via Sonner
- All forms: validation errors shown inline below fields
- Loading states: skeleton loaders for data tables, spinner for buttons

---

## PHASE 11: SECURITY

### 11.1 Authentication security

- Use `getUser()` on server, NEVER `getSession()` (getUser revalidates with Supabase Auth)
- Middleware protects ALL `/admin/*` routes
- Admin layout ALSO checks admin status (defence in depth)
- Server Actions ALSO verify admin before any mutation

### 11.2 API security

- All public API routes require `x-api-key` header
- CORS restricted to `ALLOWED_ORIGIN` (nikitatrusha.co.za)
- Rate limiting: implement via Vercel Edge Config or middleware counter
- Input validation: Zod schemas on all API inputs
- SQL injection: impossible (Supabase client uses parameterised queries)

### 11.3 Storage security

- Supabase Storage RLS: only admin can upload/delete
- File type validation: check MIME type server-side, not just extension
- Max file size: 5MB enforced in upload handler
- UUID filenames: prevent path traversal and filename collisions

### 11.4 Google token security

- Tokens stored in `google_tokens` table with RLS (admin only)
- Access token auto-refreshed using refresh token
- `SUPABASE_SERVICE_ROLE_KEY` never exposed to browser (no `NEXT_PUBLIC_` prefix)
- Google OAuth scopes: minimum required (`calendar.events` + `calendar.freebusy`)

### 11.5 Content security

- TipTap content stored as JSON (not raw HTML) — inherently safe
- When rendering HTML from TipTap JSON on the website, use `generateHTML()` with whitelisted extensions only
- Sanitise all text inputs (trim, max length)
- Escape user-provided data in Google Calendar event descriptions

### 11.6 Vercel security headers

Create `vercel.json` in project root:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

---

## PHASE 12: DEPLOYMENT

### 12.1 Pre-deployment checklist

- [ ] All environment variables set in Vercel
- [ ] Supabase project created with schema applied
- [ ] Storage bucket `blog-images` created and set to public
- [ ] Admin user created in Supabase Auth dashboard
- [ ] Admin user UUID added to `admins` table
- [ ] Google Cloud project created with Calendar API enabled (optional)
- [ ] OAuth consent screen configured (optional)
- [ ] `ALLOWED_ORIGIN` set to `https://nikitatrusha.co.za`
- [ ] `PUBLIC_API_KEY` generated and shared with the main website

### 12.2 Vercel deployment

1. Push CMS repo to GitHub
2. Import into Vercel
3. Install Supabase integration from Vercel Marketplace (auto-populates Supabase env vars)
4. Add remaining env vars manually
5. Deploy

### 12.3 Connect main website to CMS API

On nikitatrusha.co.za (the static site), add JavaScript to:
1. Fetch published blog posts from `{CMS_URL}/api/v1/posts` with `x-api-key` header
2. Render blog cards dynamically (replace static blog content)
3. Fetch available slots from `{CMS_URL}/api/v1/availability?date=YYYY-MM-DD`
4. Submit booking form to `{CMS_URL}/api/v1/book`
5. Display booking confirmation with Meet link (if available)

---

## SUCCESS CRITERIA

After implementation, the CMS must:

**Authentication:**
- [ ] Nikita can log in with email/password or Google OAuth
- [ ] Non-admin users are rejected
- [ ] All admin routes are protected by middleware + layout
- [ ] Session persists across page reloads

**Blog Management:**
- [ ] Create new blog post with TipTap rich text editor
- [ ] Upload images to Supabase Storage from within the editor
- [ ] Save posts as draft
- [ ] Publish posts (sets published_at timestamp)
- [ ] Edit existing posts
- [ ] Delete posts
- [ ] Filter posts by status (draft/published/archived)
- [ ] Search posts by title
- [ ] Auto-generate slug from title
- [ ] Auto-calculate reading time

**Media Library:**
- [ ] Upload images via drag-and-drop
- [ ] Browse uploaded images in grid view
- [ ] Delete images
- [ ] Pick images from media library in post editor

**Calendar & Bookings:**
- [ ] Set weekly availability hours per day
- [ ] Block specific dates with reason
- [ ] View all bookings in admin panel
- [ ] Confirm/cancel bookings
- [ ] System works fully without Google Calendar connected
- [ ] When Google is connected: auto-create Calendar event + Meet link on booking confirmation
- [ ] Double-booking prevented at database level

**Public API:**
- [ ] `GET /api/v1/posts` returns published posts with pagination
- [ ] `GET /api/v1/posts/[slug]` returns full post with HTML content
- [ ] `GET /api/v1/availability?date=...` returns available time slots
- [ ] `POST /api/v1/book` creates a booking
- [ ] All endpoints require `x-api-key` header
- [ ] CORS allows requests from nikitatrusha.co.za only

**Security:**
- [ ] RLS enabled on all tables
- [ ] Admin-only mutations verified at action level (not just middleware)
- [ ] File uploads validated (type + size)
- [ ] Google tokens stored securely with RLS
- [ ] Security headers set via vercel.json
- [ ] No secrets exposed to browser

---

## SKILLS TO USE DURING IMPLEMENTATION

```bash
# Security
npx skills add https://github.com/supercent-io/skills-template --skill security-best-practices
npx skills add https://github.com/better-auth/skills --skill better-auth-security-best-practices
npx skills add https://github.com/wshobson/agents --skill security-requirement-extraction

# SEO (for API responses consumed by the website)
npx skills add https://github.com/coreyhaines31/marketingskills --skill seo-audit
npx skills add https://github.com/coreyhaines31/marketingskills --skill ai-seo

# GSD workflow
npx skills add https://github.com/gsd-build/get-shit-done.git

# Prompt engineering
npx skills add https://github.com/google-labs-code/stitch-skills --skill enhance-prompt
npx skills add https://github.com/wshobson/agents --skill prompt-engineering-patterns
```
