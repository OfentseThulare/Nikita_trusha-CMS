# Nikita Trusha CMS

Content Management System for [nikitatrusha.co.za](https://nikitatrusha.co.za) — the professional website of Nikita Naidoo, Sanlam Financial Adviser.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **Editor**: TipTap (rich text)
- **Booking**: Google Calendar API + Google Meet
- **Deployment**: Vercel

## Features

- Blog post management with rich text editing
- Media library with drag-and-drop uploads
- Google Calendar & Meet booking integration
- Availability schedule management
- Public API for the main website
- Admin dashboard with analytics

## Getting Started

See [IMPLEMENTATION-PROMPT.md](./IMPLEMENTATION-PROMPT.md) for the full implementation guide.

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in Supabase, Google Calendar, and other credentials

# Run development server
npm run dev
```

## Environment Variables

Required variables are documented in `IMPLEMENTATION-PROMPT.md` Phase 1.

## License

Private — All rights reserved.
