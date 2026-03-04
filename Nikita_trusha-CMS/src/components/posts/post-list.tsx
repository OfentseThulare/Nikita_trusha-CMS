'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PostStatusBadge } from './post-status-badge'
import { formatDate } from '@/lib/utils/dates'
import { publishPost, unpublishPost, archivePost, deletePost } from '@/lib/actions/posts'
import type { Post } from '@/types'
import { MoreHorizontal, Plus, Search, Edit, Trash2, Eye, EyeOff, Archive } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PostListProps {
  posts: Post[]
}

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

export function PostList({ posts }: PostListProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    return matchesSearch && matchesStatus
  })

  async function handleAction(action: string, id: string) {
    let result
    switch (action) {
      case 'publish': result = await publishPost(id); break
      case 'unpublish': result = await unpublishPost(id); break
      case 'archive': result = await archivePost(id); break
    }
    if (result?.error) toast.error(result.error)
    else {
      toast.success('Post updated')
      startTransition(() => router.refresh())
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deletePost(deleteId)
    if (result?.error) toast.error(result.error)
    else {
      toast.success('Post deleted')
      startTransition(() => router.refresh())
    }
    setDeleteId(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Blog Posts</h1>
        <Button size="sm" className="bg-[#0033A0] hover:bg-[#001F6B]" asChild>
          <Link href="/admin/posts/new">
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            {STATUS_TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 text-sm h-9"
          />
        </div>
      </div>

      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">
            No posts found.{' '}
            <Link href="/admin/posts/new" className="text-[#0033A0] hover:underline">
              Create your first post
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Published</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(post => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-xs">{post.title}</p>
                      <p className="text-xs text-gray-400 truncate max-w-xs">{post.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <PostStatusBadge status={post.status} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">
                    {post.category?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                    {post.published_at ? formatDate(post.published_at) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/posts/${post.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {post.status === 'draft' && (
                          <DropdownMenuItem onClick={() => handleAction('publish', post.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Publish
                          </DropdownMenuItem>
                        )}
                        {post.status === 'published' && (
                          <DropdownMenuItem onClick={() => handleAction('unpublish', post.id)}>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Unpublish
                          </DropdownMenuItem>
                        )}
                        {post.status !== 'archived' && (
                          <DropdownMenuItem onClick={() => handleAction('archive', post.id)}>
                            <Archive className="mr-2 h-4 w-4" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteId(post.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
