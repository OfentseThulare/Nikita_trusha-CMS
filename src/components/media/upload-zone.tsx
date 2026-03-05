'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'

interface UploadZoneProps {
  onUploadComplete: () => void
}

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<string[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    setUploading(true)
    setProgress([])

    for (const file of acceptedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name}: File too large (max 5MB)`)
        continue
      }

      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/media/upload', {
        method: 'POST',
        body: formData,
      })
      const result = await res.json()

      if (result.error) {
        toast.error(`${file.name}: ${result.error}`)
      } else {
        setProgress(prev => [...prev, file.name])
      }
    }

    setUploading(false)
    setProgress([])
    onUploadComplete()
    toast.success('Upload complete')
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
      'image/svg+xml': ['.svg'],
    },
    maxSize: 5 * 1024 * 1024,
    disabled: uploading,
  })

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors ${
        isDragActive
          ? 'border-[#0033A0] bg-[#E8F0FB]'
          : 'border-gray-300 hover:border-[#0033A0] hover:bg-[#E8F0FB]/50'
      }`}
    >
      <input {...getInputProps()} />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#0033A0]" />
          <p className="text-sm text-gray-600">Uploading {progress.length} file(s)...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <Upload className="h-8 w-8 text-gray-400" />
          <p className="text-sm font-medium text-gray-700">
            {isDragActive ? 'Drop files here' : 'Drag & drop images, or click to browse'}
          </p>
          <p className="text-xs text-gray-400">JPG, PNG, GIF, WebP, SVG up to 5MB each</p>
        </div>
      )}
    </div>
  )
}
