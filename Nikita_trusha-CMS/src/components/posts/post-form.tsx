'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { TipTapEditor } from '@/components/editor/tiptap-editor'
import { generateSlug } from '@/lib/utils/slug'
import { createPost, updatePost } from '@/lib/actions/posts'
import type { Post, Category } from '@/types'
import { ArrowLeft, Loader2, ChevronDown, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface PostFormProps {
  post?: Post
  categories: Category[]
}

export function PostForm({ post, categories }: PostFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!!post)
  const [content, setContent] = useState<Record<string, unknown> | null>(post?.content as Record<string, unknown> | null ?? null)
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(post?.cover_image_url ?? '')
  const [categoryId, setCategoryId] = useState(post?.category_id ?? '')
  const [status, setStatus] = useState<'draft' | 'published' | 'archived'>(post?.status ?? 'draft')
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? '')
  const [metaDescription, setMetaDescription] = useState(post?.meta_description ?? '')
  const [seoOpen, setSeoOpen] = useState(false)

  function handleTitleChange(value: string) {
    setTitle(value)
    if (!slugManuallyEdited) {
      setSlug(generateSlug(value))
    }
  }

  const handleContentChange = useCallback((newContent: Record<string, unknown>) => {
    setContent(newContent)
  }, [])

  async function handleSave(targetStatus?: 'draft' | 'published') {
    setSaving(true)
    const saveStatus = targetStatus ?? status

    const formData = {
      title,
      slug,
      content,
      excerpt: excerpt || null,
      cover_image_url: coverImageUrl || null,
      category_id: categoryId || null,
      status: saveStatus,
      seo_title: seoTitle || null,
      meta_description: metaDescription || null,
    }

    const result = post
      ? await updatePost(post.id, formData)
      : await createPost(formData)

    if (result?.error) {
      const errorMsg = typeof result.error === 'string'
        ? result.error
        : Object.values(result.error).flat().join(', ')
      toast.error(errorMsg)
    } else {
      toast.success(saveStatus === 'published' ? 'Post published!' : 'Post saved!')
      if (saveStatus !== status) setStatus(saveStatus)
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Actions bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 -mx-4 lg:-mx-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/posts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSave('draft')}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Save Draft
          </Button>
          <Button
            size="sm"
            className="bg-[#0033A0] hover:bg-[#001F6B]"
            onClick={() => handleSave('published')}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Publish
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 mt-6">
        {/* Left: Editor */}
        <div className="flex-1 space-y-4">
          <div>
            <input
              type="text"
              placeholder="Post title..."
              value={title}
              onChange={e => handleTitleChange(e.target.value)}
              className="w-full text-3xl font-bold border-0 border-b border-gray-200 pb-2 focus:outline-none focus:border-[#0033A0] placeholder:text-gray-300 bg-transparent"
            />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">Slug:</span>
              <input
                type="text"
                value={slug}
                onChange={e => {
                  setSlug(e.target.value)
                  setSlugManuallyEdited(true)
                }}
                className="text-xs text-[#0033A0] border-0 focus:outline-none bg-transparent flex-1"
                placeholder="post-slug"
              />
            </div>
          </div>

          <TipTapEditor content={content} onChange={handleContentChange} />
        </div>

        {/* Right: Metadata sidebar */}
        <div className="lg:w-72 space-y-4">
          {/* Status */}
          <div className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-medium text-sm text-gray-900">Status</h3>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {post?.reading_time && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                <Badge variant="secondary" className="text-xs">{post.reading_time} min read</Badge>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-medium text-sm text-gray-900">Category</h3>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cover Image */}
          <div className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-medium text-sm text-gray-900">Cover Image</h3>
            {coverImageUrl && (
              <div className="relative aspect-video rounded-md overflow-hidden">
                <Image src={coverImageUrl} alt="Cover" fill className="object-cover" />
              </div>
            )}
            <Input
              placeholder="https://... or paste URL"
              value={coverImageUrl}
              onChange={e => setCoverImageUrl(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Excerpt */}
          <div className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="font-medium text-sm text-gray-900">Excerpt</h3>
            <Textarea
              placeholder="Short preview text (auto-generated if empty)"
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              rows={3}
              maxLength={300}
              className="text-sm resize-none"
            />
            <p className="text-xs text-gray-400 text-right">{excerpt.length}/300</p>
          </div>

          {/* SEO */}
          <Collapsible open={seoOpen} onOpenChange={setSeoOpen}>
            <div className="rounded-md border border-gray-200 bg-white p-4">
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <h3 className="font-medium text-sm text-gray-900">SEO (optional)</h3>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${seoOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">SEO Title</Label>
                  <Input
                    value={seoTitle}
                    onChange={e => setSeoTitle(e.target.value)}
                    placeholder="Defaults to post title"
                    maxLength={70}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600">Meta Description</Label>
                  <Textarea
                    value={metaDescription}
                    onChange={e => setMetaDescription(e.target.value)}
                    placeholder="Defaults to excerpt"
                    maxLength={160}
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        </div>
      </div>
    </div>
  )
}
