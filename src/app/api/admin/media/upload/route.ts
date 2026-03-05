import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { v4 as uuidv4 } from 'uuid'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
const MAX_SIZE_BYTES = 5 * 1024 * 1024

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const formData = await request.formData()
  const file = formData.get('file') as File
  const altText = formData.get('alt_text') as string | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large. Maximum 5MB' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const filename = `${uuidv4()}.${ext}`
  const storagePath = `posts/${filename}`

  const buffer = await file.arrayBuffer()
  const adminClient = createAdminClient()

  const { error: uploadError } = await adminClient.storage
    .from('blog-images')
    .upload(storagePath, buffer, { contentType: file.type })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = adminClient.storage
    .from('blog-images')
    .getPublicUrl(storagePath)

  const { data: media, error: dbError } = await adminClient
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

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 })

  return NextResponse.json({ media })
}
