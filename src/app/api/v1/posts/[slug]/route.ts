import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, category:categories(id, name, slug)')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  let contentHtml = ''
  if (post.content) {
    try {
      contentHtml = generateHTML(post.content as Record<string, unknown>, [
        StarterKit,
        Image,
        Link,
        Underline,
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ])
    } catch {
      contentHtml = ''
    }
  }

  return NextResponse.json({
    post: {
      ...post,
      content_json: post.content,
      content_html: contentHtml,
      seo_title: post.seo_title || post.title,
      meta_description: post.meta_description || post.excerpt,
    },
  })
}
