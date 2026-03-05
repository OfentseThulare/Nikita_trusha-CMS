import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PostForm } from '@/components/posts/post-form'
import type { Post } from '@/types'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: post }, { data: categories }] = await Promise.all([
    supabase.from('posts').select('*, category:categories(id, name, slug)').eq('id', id).single(),
    supabase.from('categories').select('*').order('name'),
  ])

  if (!post) notFound()

  return <PostForm post={post as unknown as Post} categories={categories ?? []} />
}
