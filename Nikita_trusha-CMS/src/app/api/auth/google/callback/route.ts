import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createOAuth2Client, saveGoogleTokens } from '@/lib/google/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${origin}/admin/calendar?error=google_auth_failed`)
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  try {
    const oauth2Client = createOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(`${origin}/admin/calendar?error=missing_tokens`)
    }

    await saveGoogleTokens(user.id, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date ?? Date.now() + 3600000,
      scope: tokens.scope ?? undefined,
    })

    return NextResponse.redirect(`${origin}/admin/calendar?success=google_connected`)
  } catch {
    return NextResponse.redirect(`${origin}/admin/calendar?error=token_exchange_failed`)
  }
}
