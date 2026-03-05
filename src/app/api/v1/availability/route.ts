import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { TimeSlot } from '@/types'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date parameter required (YYYY-MM-DD)' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const targetDate = new Date(date + 'T12:00:00')
  const dayOfWeek = targetDate.getDay()

  // 1. Check date override
  const { data: override } = await supabase
    .from('date_overrides')
    .select('*')
    .eq('date', date)
    .single()

  if (override && !override.is_available) {
    return NextResponse.json({ slots: [], reason: override.reason || 'Not available' })
  }

  // 2. Get base availability
  let dayStart = '09:00'
  let dayEnd = '17:00'

  if (override?.is_available && override.start_time && override.end_time) {
    dayStart = override.start_time
    dayEnd = override.end_time
  } else {
    const { data: slot } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true)
      .single()

    if (!slot) {
      return NextResponse.json({ slots: [], reason: 'Not available' })
    }
    dayStart = slot.start_time
    dayEnd = slot.end_time
  }

  // 3. Get booking settings
  const { data: settings } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'booking')
    .single()

  const slotDuration = (settings?.value as Record<string, number>)?.slot_duration_minutes ?? 30
  const breakBetween = (settings?.value as Record<string, number>)?.break_between_minutes ?? 15

  // 4. Get existing bookings for this date
  const { data: bookings } = await supabase
    .from('bookings')
    .select('start_time, end_time')
    .eq('booking_date', date)
    .not('status', 'eq', 'cancelled')

  // 5. Compute available slots
  const blockedRanges = (bookings ?? []).map(b => ({
    start: timeToMinutes(b.start_time),
    end: timeToMinutes(b.end_time) + breakBetween,
  }))

  const slots: TimeSlot[] = []
  let current = timeToMinutes(dayStart)
  const endMinutes = timeToMinutes(dayEnd)

  while (current + slotDuration <= endMinutes) {
    const slotEnd = current + slotDuration
    const isBlocked = blockedRanges.some(
      block => current < block.end && slotEnd > block.start
    )
    if (!isBlocked) {
      slots.push({ start: minutesToTime(current), end: minutesToTime(slotEnd) })
    }
    current += slotDuration
  }

  return NextResponse.json({ slots })
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}
