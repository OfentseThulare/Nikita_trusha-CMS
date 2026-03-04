'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { BookingStatusBadge } from './booking-status-badge'
import { confirmBooking, cancelBooking, completeBooking } from '@/lib/actions/bookings'
import { formatDate, formatTime } from '@/lib/utils/dates'
import type { Booking } from '@/types'
import { CheckCircle, XCircle, CheckCheck, ExternalLink, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function BookingList({ bookings }: { bookings: Booking[] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = statusFilter === 'all'
    ? bookings
    : bookings.filter(b => b.status === statusFilter)

  async function handleAction(action: 'confirm' | 'cancel' | 'complete', id: string) {
    let result
    switch (action) {
      case 'confirm': result = await confirmBooking(id); break
      case 'cancel': result = await cancelBooking(id); break
      case 'complete': result = await completeBooking(id); break
    }
    if (result?.error) toast.error(result.error)
    else {
      const messages = { confirm: 'Booking confirmed!', cancel: 'Booking cancelled', complete: 'Booking marked complete' }
      toast.success(messages[action])
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Bookings</h1>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList>
          {STATUS_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
              {tab.value !== 'all' && (
                <span className="ml-1.5 rounded-full bg-white/60 px-1.5 py-0.5 text-xs">
                  {bookings.filter(b => b.status === tab.value).length}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="rounded-md border border-gray-200 bg-white overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm">No bookings found.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map(booking => (
              <Collapsible
                key={booking.id}
                open={expandedId === booking.id}
                onOpenChange={open => setExpandedId(open ? booking.id : null)}
              >
                <CollapsibleTrigger className="w-full text-left">
                  <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <ChevronDown className={`h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0 transition-transform ${expandedId === booking.id ? 'rotate-180' : ''}`} />
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{booking.client_name}</p>
                        <p className="text-xs text-gray-500 truncate">{booking.client_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-gray-900">{formatDate(booking.booking_date)}</p>
                        <p className="text-xs text-gray-500">{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-4 pb-4 pt-1 bg-gray-50 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="text-gray-900">{booking.client_phone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-gray-900">{formatDate(booking.booking_date)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Time</p>
                        <p className="text-gray-900">{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Booked on</p>
                        <p className="text-gray-900">{formatDate(booking.created_at)}</p>
                      </div>
                    </div>

                    {booking.notes && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Client notes</p>
                        <p className="text-sm text-gray-700 bg-white rounded p-2 border border-gray-100">{booking.notes}</p>
                      </div>
                    )}

                    {booking.meet_link && (
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-500">Meet link:</p>
                        <a
                          href={booking.meet_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#0033A0] hover:underline flex items-center gap-1"
                        >
                          {booking.meet_link}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {booking.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                            onClick={() => handleAction('confirm', booking.id)}
                          >
                            <CheckCircle className="mr-1.5 h-3 w-3" />
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAction('cancel', booking.id)}
                          >
                            <XCircle className="mr-1.5 h-3 w-3" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {booking.status === 'confirmed' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 h-7 text-xs"
                            onClick={() => handleAction('complete', booking.id)}
                          >
                            <CheckCheck className="mr-1.5 h-3 w-3" />
                            Mark Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleAction('cancel', booking.id)}
                          >
                            <XCircle className="mr-1.5 h-3 w-3" />
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
