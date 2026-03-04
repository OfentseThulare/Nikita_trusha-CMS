import { createClient } from '@/lib/supabase/server'
import { BookingList } from '@/components/bookings/booking-list'
import type { Booking } from '@/types'

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*')
    .order('booking_date', { ascending: false })

  return <BookingList bookings={(bookings ?? []) as Booking[]} />
}
