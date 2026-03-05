'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createCalendarEvent, cancelCalendarEvent, isGoogleConnected } from '@/lib/google/calendar'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()

  if (!admin) redirect('/login')
  return { supabase, user }
}

export async function confirmBooking(id: string) {
  const { supabase } = await requireAdmin()

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !booking) return { error: 'Booking not found' }

  let meetLink: string | null = null
  let googleEventId: string | null = null

  const googleConnected = await isGoogleConnected()
  if (googleConnected) {
    try {
      const eventResult = await createCalendarEvent({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        date: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
        notes: booking.notes,
      })
      meetLink = eventResult.meetLink
      googleEventId = eventResult.eventId
    } catch (err) {
      console.error('Failed to create Google Calendar event:', err)
      // Continue without Google Calendar
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'confirmed',
      meet_link: meetLink,
      google_event_id: googleEventId,
    })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/bookings')
  return { success: true, meetLink }
}

export async function cancelBooking(id: string) {
  const { supabase } = await requireAdmin()

  const { data: booking } = await supabase
    .from('bookings')
    .select('google_event_id')
    .eq('id', id)
    .single()

  if (booking?.google_event_id) {
    try {
      await cancelCalendarEvent(booking.google_event_id)
    } catch (err) {
      console.error('Failed to cancel Google Calendar event:', err)
    }
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/bookings')
  return { success: true }
}

export async function completeBooking(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/bookings')
  return { success: true }
}
