'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { deleteMedia, updateMediaAltText } from '@/lib/actions/media'
import { formatDate } from '@/lib/utils/dates'
import type { Media } from '@/types'
import { Copy, Trash2, Edit3, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface MediaGridProps {
  media: Media[]
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function MediaGrid({ media }: MediaGridProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [altText, setAltText] = useState('')
  const [copied, setCopied] = useState(false)

  function handleSelect(item: Media) {
    setSelectedMedia(item)
    setAltText(item.alt_text ?? '')
  }

  function handleCopyUrl() {
    if (!selectedMedia) return
    navigator.clipboard.writeText(selectedMedia.public_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveAltText() {
    if (!selectedMedia) return
    const result = await updateMediaAltText(selectedMedia.id, altText)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Alt text saved')
      startTransition(() => router.refresh())
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    const result = await deleteMedia(deleteId)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Image deleted')
      setSelectedMedia(null)
      startTransition(() => router.refresh())
    }
    setDeleteId(null)
  }

  return (
    <>
      {media.length === 0 ? (
        <div className="py-12 text-center text-gray-500 text-sm">
          No images uploaded yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {media.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="group relative aspect-square rounded-md overflow-hidden border border-gray-200 bg-gray-50 hover:border-[#0033A0] transition-colors"
            >
              <Image
                src={item.public_url}
                alt={item.alt_text || item.filename}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </button>
          ))}
        </div>
      )}

      {/* Detail panel */}
      <Sheet open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
        <SheetContent className="w-80">
          <SheetHeader>
            <SheetTitle>Image Details</SheetTitle>
          </SheetHeader>
          {selectedMedia && (
            <div className="mt-4 space-y-4">
              <div className="relative aspect-video rounded-md overflow-hidden bg-gray-100">
                <Image
                  src={selectedMedia.public_url}
                  alt={selectedMedia.alt_text || selectedMedia.filename}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900 truncate">{selectedMedia.filename}</p>
                <p className="text-gray-500">{formatBytes(selectedMedia.size_bytes)}</p>
                <p className="text-gray-500">{formatDate(selectedMedia.created_at)}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Alt Text</Label>
                <Input
                  value={altText}
                  onChange={e => setAltText(e.target.value)}
                  placeholder="Describe the image..."
                  className="text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveAltText}
                >
                  <Edit3 className="mr-2 h-3.5 w-3.5" />
                  Save Alt Text
                </Button>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <Check className="mr-2 h-3.5 w-3.5 text-green-600" />
                ) : (
                  <Copy className="mr-2 h-3.5 w-3.5" />
                )}
                {copied ? 'Copied!' : 'Copy URL'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => setDeleteId(selectedMedia.id)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete Image
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the image from storage. Any posts using this image will have broken links.
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
    </>
  )
}
