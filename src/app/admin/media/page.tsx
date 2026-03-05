'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { UploadZone } from '@/components/media/upload-zone'
import { MediaGrid } from '@/components/media/media-grid'
import type { Media } from '@/types'
import { useEffect } from 'react'

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([])

  const fetchMedia = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
    setMedia((data ?? []) as Media[])
  }, [])

  useEffect(() => {
    fetchMedia()
  }, [fetchMedia])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Media Library</h1>
      <UploadZone onUploadComplete={fetchMedia} />
      <MediaGrid media={media} />
    </div>
  )
}
