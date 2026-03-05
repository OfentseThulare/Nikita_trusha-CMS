'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import type { Media } from '@/types'
import { Loader2, Upload, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

interface MediaPickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (url: string) => void
}

export function MediaPickerDialog({ open, onClose, onSelect }: MediaPickerDialogProps) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [altText, setAltText] = useState('')

  const fetchMedia = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
    setMedia(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (open) fetchMedia()
  }, [open, fetchMedia])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    if (altText) formData.append('alt_text', altText)

    const res = await fetch('/api/admin/media/upload', {
      method: 'POST',
      body: formData,
    })
    const result = await res.json()

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Image uploaded')
      await fetchMedia()
    }
    setUploading(false)
    setAltText('')
  }

  function handleSelect() {
    if (selected) {
      onSelect(selected)
      setSelected(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="upload">Upload New</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="mt-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3 max-h-80 overflow-y-auto">
                {media.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelected(item.public_url)}
                    className="relative group aspect-square rounded-md overflow-hidden border-2 transition-colors hover:border-[#0033A0]"
                    style={{ borderColor: selected === item.public_url ? '#0033A0' : 'transparent' }}
                  >
                    <Image
                      src={item.public_url}
                      alt={item.alt_text || item.filename}
                      fill
                      className="object-cover"
                    />
                    {selected === item.public_url && (
                      <div className="absolute inset-0 bg-[#0033A0]/20 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button
                onClick={handleSelect}
                disabled={!selected}
                className="bg-[#0033A0] hover:bg-[#001F6B]"
              >
                Insert Image
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="alt-text">Alt text (optional)</Label>
              <Input
                id="alt-text"
                placeholder="Describe the image..."
                value={altText}
                onChange={e => setAltText(e.target.value)}
              />
            </div>
            <label className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-8 cursor-pointer hover:border-[#0033A0] hover:bg-[#E8F0FB]/50 transition-colors">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-[#0033A0]" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">Click to upload an image</span>
                  <span className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP, SVG up to 5MB</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
