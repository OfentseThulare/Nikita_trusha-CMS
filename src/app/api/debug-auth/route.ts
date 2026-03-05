import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const checks: Record<string, unknown> = {}

  // Check env vars
  checks.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'
  checks.supabase_url_value = process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
  checks.anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
  checks.anon_key_starts = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'

  try {
    const supabase = await createClient()
    checks.client_created = true

    const { data: { user }, error } = await supabase.auth.getUser()
    checks.user = user ? { id: user.id, email: user.email } : null
    checks.auth_error = error?.message ?? null

    // Check admins table
    const { data: admins, error: adminErr } = await supabase
      .from('admins')
      .select('user_id')
      .limit(5)
    checks.admins = admins
    checks.admins_error = adminErr?.message ?? null

    // Check if the user (if any) is in admins
    if (user) {
      const { data: admin, error: adErr } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single()
      checks.is_admin = !!admin
      checks.admin_check_error = adErr?.message ?? null
    }
  } catch (e: unknown) {
    checks.exception = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(checks, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
