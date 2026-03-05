import { Badge } from '@/components/ui/badge'
import type { PostStatus } from '@/types'

const statusConfig: Record<PostStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  published: { label: 'Published', className: 'bg-green-100 text-green-800 border-green-200' },
  archived: { label: 'Archived', className: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export function PostStatusBadge({ status }: { status: PostStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
