import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOAuth2Client } from '@/lib/google/auth'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const oauth2Client = createOAuth2Client()
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.freebusy',
    ],
  })

  return NextResponse.redirect(authUrl)
}
