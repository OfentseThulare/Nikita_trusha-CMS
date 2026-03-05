import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { bookingSchema } from '@/lib/validators/booking'

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = bookingSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const supabase = createAdminClient()

  // Get booking settings for slot duration
  const { data: settings } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'booking')
    .single()

  const maxAdvanceDays = (settings?.value as Record<string, number>)?.max_advance_days ?? 60
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays)

  const bookingDate = new Date(data.date)
  if (bookingDate > maxDate) {
    return NextResponse.json(
      { error: `Bookings can only be made up to ${maxAdvanceDays} days in advance` },
      { status: 400 }
    )
  }

  // Insert booking — DB constraint prevents double-booking
  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      client_name: data.name,
      client_email: data.email,
      client_phone: data.phone ?? null,
      booking_date: data.date,
      start_time: data.start_time,
      end_time: data.end_time,
      notes: data.notes ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23P01') {
      // exclusion constraint violation = double booking
      return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    booking_id: booking.id,
    status: booking.status,
  })
}
