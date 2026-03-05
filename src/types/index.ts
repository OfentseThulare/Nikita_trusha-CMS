export type PostStatus = 'draft' | 'published' | 'archived'
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: Record<string, unknown> | null
  excerpt: string | null
  cover_image_url: string | null
  category_id: string | null
  category?: Category
  status: PostStatus
  seo_title: string | null
  meta_description: string | null
  reading_time: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface Media {
  id: string
  filename: string
  storage_path: string
  public_url: string
  mime_type: string
  size_bytes: number | null
  alt_text: string | null
  created_at: string
}

export interface AvailabilitySlot {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
  created_at: string
}

export interface DateOverride {
  id: string
  date: string
  is_available: boolean
  start_time: string | null
  end_time: string | null
  reason: string | null
  created_at: string
}

export interface Booking {
  id: string
  client_name: string
  client_email: string
  client_phone: string | null
  booking_date: string
  start_time: string
  end_time: string
  status: BookingStatus
  notes: string | null
  meet_link: string | null
  google_event_id: string | null
  created_at: string
  updated_at: string
}

export interface GoogleToken {
  id: string
  user_id: string
  access_token: string
  refresh_token: string
  token_expiry: string
  scopes: string[] | null
  created_at: string
  updated_at: string
}

export interface TimeSlot {
  start: string
  end: string
}
