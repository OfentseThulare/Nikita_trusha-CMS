'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { availabilitySlotSchema, dateOverrideSchema } from '@/lib/validators/availability'

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

export async function updateAvailabilitySlots(slots: unknown[]) {
  const { supabase } = await requireAdmin()

  // Delete all existing slots and re-insert
  await supabase.from('availability_slots').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  const validSlots = slots
    .map(slot => availabilitySlotSchema.safeParse(slot))
    .filter(r => r.success)
    .map(r => r.data!)

  if (validSlots.length > 0) {
    const { error } = await supabase.from('availability_slots').insert(validSlots)
    if (error) return { error: error.message }
  }

  revalidatePath('/admin/availability')
  return { success: true }
}

export async function addDateOverride(formData: unknown) {
  const { supabase } = await requireAdmin()

  const parsed = dateOverrideSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('date_overrides')
    .upsert(parsed.data, { onConflict: 'date' })

  if (error) return { error: error.message }

  revalidatePath('/admin/availability')
  return { success: true }
}

export async function deleteDateOverride(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase.from('date_overrides').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/admin/availability')
  return { success: true }
}
