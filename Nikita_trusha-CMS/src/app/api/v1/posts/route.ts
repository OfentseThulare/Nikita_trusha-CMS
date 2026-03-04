import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
  const category = searchParams.get('category')
  const offset = (page - 1) * limit

  const supabase = createAdminClient()

  let query = supabase
    .from('posts')
    .select('id, title, slug, excerpt, cover_image_url, reading_time, published_at, category:categories(id, name, slug)', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (category) {
    query = query.eq('categories.slug', category)
  }

  const { data: posts, count, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return NextResponse.json({
    posts,
    pagination: { page, limit, total, totalPages },
  })
}
