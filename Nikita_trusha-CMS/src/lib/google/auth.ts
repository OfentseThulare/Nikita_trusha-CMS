import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  )
}

export async function getAuthenticatedOAuth2Client(userId: string) {
  const supabase = createAdminClient()
  const { data: tokens, error } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !tokens) throw new Error('No Google tokens found')

  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: new Date(tokens.token_expiry).getTime(),
  })

  // Auto-refresh if needed
  oauth2Client.on('tokens', async (newTokens) => {
    await supabase
      .from('google_tokens')
      .update({
        access_token: newTokens.access_token!,
        token_expiry: new Date(newTokens.expiry_date!).toISOString(),
      })
      .eq('user_id', userId)
  })

  return oauth2Client
}

export async function saveGoogleTokens(
  userId: string,
  tokens: {
    access_token: string
    refresh_token: string
    expiry_date: number
    scope?: string
  }
) {
  const supabase = createAdminClient()
  const scopes = tokens.scope?.split(' ') ?? []

  await supabase.from('google_tokens').upsert(
    {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expiry: new Date(tokens.expiry_date).toISOString(),
      scopes,
    },
    { onConflict: 'user_id' }
  )
}

export async function deleteGoogleTokens(userId: string) {
  const supabase = createAdminClient()
  await supabase.from('google_tokens').delete().eq('user_id', userId)
}

export async function getAdminUserId(): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('admins').select('user_id').limit(1).single()
  return data?.user_id ?? null
}
