import { createClient } from '@/lib/supabase/server'
import { PostList } from '@/components/posts/post-list'
import type { Post } from '@/types'

export default async function PostsPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('posts')
    .select('*, category:categories(id, name, slug)')
    .order('updated_at', { ascending: false })

  return <PostList posts={(posts ?? []) as unknown as Post[]} />
}
