import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createTestEvent } from '@/lib/google/calendar'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: admin } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', user.id)
    .single()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const result = await createTestEvent()
  return NextResponse.json(result)
}
