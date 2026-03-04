import { createClient } from '@/lib/supabase/server'
import { CalendarConnect } from './calendar-connect'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tokens } = await supabase
    .from('google_tokens')
    .select('id, scopes, updated_at')
    .eq('user_id', user!.id)
    .single()

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Google Calendar</h1>
      <CalendarConnect isConnected={!!tokens} lastSync={tokens?.updated_at} />

      <div className="rounded-md border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Setup Guide</h2>
        <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
          <li>Go to <strong>console.cloud.google.com</strong></li>
          <li>Create a project called <strong>Nikita Trusha CMS</strong></li>
          <li>Enable the <strong>Google Calendar API</strong></li>
          <li>Configure the <strong>OAuth consent screen</strong> (External, Testing mode)</li>
          <li>Add your Google email as a test user</li>
          <li>Create an <strong>OAuth 2.0 Client ID</strong> (Web application)</li>
          <li>
            Set redirect URI: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">
              {process.env.NEXT_PUBLIC_SITE_URL}/api/auth/google/callback
            </code>
          </li>
          <li>Copy Client ID and Secret to your environment variables</li>
          <li>Click <strong>Connect Google Calendar</strong> above</li>
        </ol>
      </div>
    </div>
  )
}
