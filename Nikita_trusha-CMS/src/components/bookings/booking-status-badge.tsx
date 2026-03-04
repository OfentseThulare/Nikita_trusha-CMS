import { Badge } from '@/components/ui/badge'
import type { BookingStatus } from '@/types'

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
  completed: { label: 'Completed', className: 'bg-blue-100 text-blue-700 border-blue-200' },
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  )
}
