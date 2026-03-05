'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

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

export async function uploadMedia(formData: FormData) {
  const { supabase } = await requireAdmin()

  const file = formData.get('file') as File
  const altText = formData.get('alt_text') as string | null

  if (!file) return { error: 'No file provided' }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { error: 'Invalid file type. Allowed: jpg, png, gif, webp, svg' }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: 'File too large. Maximum size is 5MB' }
  }

  const ext = file.name.split('.').pop()
  const filename = `${uuidv4()}.${ext}`
  const storagePath = `posts/${filename}`

  const buffer = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('blog-images')
    .upload(storagePath, buffer, { contentType: file.type })

  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = supabase.storage
    .from('blog-images')
    .getPublicUrl(storagePath)

  const { data: media, error: dbError } = await supabase
    .from('media')
    .insert({
      filename: file.name,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      mime_type: file.type,
      size_bytes: file.size,
      alt_text: altText,
    })
    .select()
    .single()

  if (dbError) return { error: dbError.message }

  revalidatePath('/admin/media')
  return { success: true, media }
}

export async function updateMediaAltText(id: string, altText: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('media')
    .update({ alt_text: altText })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/media')
  return { success: true }
}

export async function deleteMedia(id: string) {
  const { supabase } = await requireAdmin()

  const { data: media } = await supabase
    .from('media')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (media) {
    await supabase.storage.from('blog-images').remove([media.storage_path])
  }

  const { error } = await supabase.from('media').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/media')
  return { success: true }
}
