import { google } from 'googleapis'
import { v4 as uuidv4 } from 'uuid'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAuthenticatedOAuth2Client, getAdminUserId } from './auth'

export async function isGoogleConnected(): Promise<boolean> {
  const userId = await getAdminUserId()
  if (!userId) return false

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('google_tokens')
    .select('id')
    .eq('user_id', userId)
    .single()

  return !!data
}

export async function createCalendarEvent(params: {
  clientName: string
  clientEmail: string
  date: string
  startTime: string
  endTime: string
  notes: string | null
}): Promise<{ eventId: string; meetLink: string | null }> {
  const userId = await getAdminUserId()
  if (!userId) throw new Error('No admin user found')

  const oauth2Client = await getAuthenticatedOAuth2Client(userId)
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const sanitizedNotes = params.notes?.replace(/[<>&"']/g, '') ?? ''

  const event = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    sendUpdates: 'all',
    requestBody: {
      summary: `Consultation — ${params.clientName}`,
      description: `Financial planning consultation\nClient: ${params.clientName}\nEmail: ${params.clientEmail}${sanitizedNotes ? `\nNotes: ${sanitizedNotes}` : ''}`,
      start: {
        dateTime: `${params.date}T${params.startTime}:00+02:00`,
        timeZone: 'Africa/Johannesburg',
      },
      end: {
        dateTime: `${params.date}T${params.endTime}:00+02:00`,
        timeZone: 'Africa/Johannesburg',
      },
      attendees: [
        { email: params.clientEmail },
        { email: 'nikita.naidoo@sanlam4u.co.za' },
      ],
      conferenceData: {
        createRequest: {
          requestId: uuidv4(),
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    },
  })

  const meetLink =
    event.data.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri ?? null

  return {
    eventId: event.data.id!,
    meetLink,
  }
}

export async function cancelCalendarEvent(eventId: string): Promise<void> {
  const userId = await getAdminUserId()
  if (!userId) return

  const oauth2Client = await getAuthenticatedOAuth2Client(userId)
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  await calendar.events.delete({
    calendarId: 'primary',
    eventId,
    sendUpdates: 'all',
  })
}

export async function checkBusyTimes(
  date: string
): Promise<Array<{ start: string; end: string }>> {
  const userId = await getAdminUserId()
  if (!userId) return []

  try {
    const oauth2Client = await getAuthenticatedOAuth2Client(userId)
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    const timeMin = `${date}T00:00:00+02:00`
    const timeMax = `${date}T23:59:59+02:00`

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: 'Africa/Johannesburg',
        items: [{ id: 'primary' }],
      },
    })

    const busy = response.data.calendars?.primary?.busy ?? []
    return busy.map(b => ({
      start: b.start ? b.start.substring(11, 16) : '',
      end: b.end ? b.end.substring(11, 16) : '',
    }))
  } catch {
    return []
  }
}

export async function createTestEvent(): Promise<{ success: boolean; meetLink?: string | null }> {
  try {
    const result = await createCalendarEvent({
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '10:30',
      notes: 'This is a test event — please delete',
    })
    return { success: true, meetLink: result.meetLink }
  } catch (err) {
    console.error('Test event failed:', err)
    return { success: false }
  }
}
