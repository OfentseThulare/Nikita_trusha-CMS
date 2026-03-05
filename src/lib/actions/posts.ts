'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { postSchema } from '@/lib/validators/post'
import { calculateReadingTime, extractExcerpt } from '@/lib/utils/reading-time'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!admin) redirect('/login')
  return { supabase, user }
}

export async function createPost(formData: unknown) {
  const { supabase } = await requireAdmin()

  const parsed = postSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const content = data.content as Record<string, unknown> | null
  const readingTime = calculateReadingTime(content)
  const excerpt = data.excerpt || extractExcerpt(content)
  const publishedAt = data.status === 'published' ? new Date().toISOString() : null

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      ...data,
      excerpt,
      reading_time: readingTime,
      published_at: publishedAt,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/posts')
  redirect(`/admin/posts/${post.id}/edit`)
}

export async function updatePost(id: string, formData: unknown) {
  const { supabase } = await requireAdmin()

  const parsed = postSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data = parsed.data
  const content = data.content as Record<string, unknown> | null
  const readingTime = calculateReadingTime(content)
  const excerpt = data.excerpt || extractExcerpt(content)

  // Get current post to check if we need to set published_at
  const { data: currentPost } = await supabase
    .from('posts')
    .select('status, published_at')
    .eq('id', id)
    .single()

  let publishedAt = currentPost?.published_at
  if (data.status === 'published' && !publishedAt) {
    publishedAt = new Date().toISOString()
  }

  const { error } = await supabase
    .from('posts')
    .update({
      ...data,
      excerpt,
      reading_time: readingTime,
      published_at: publishedAt,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/posts')
  revalidatePath(`/admin/posts/${id}/edit`)
  return { success: true }
}

export async function publishPost(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/posts')
  return { success: true }
}

export async function unpublishPost(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('posts')
    .update({ status: 'draft' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/posts')
  return { success: true }
}

export async function archivePost(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('posts')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/posts')
  return { success: true }
}

export async function deletePost(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/posts')
  return { success: true }
}

export async function checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
  const supabase = await createClient()
  let query = supabase.from('posts').select('id').eq('slug', slug)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query
  return (data?.length ?? 0) > 0
}
