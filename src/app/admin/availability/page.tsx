import { createClient } from '@/lib/supabase/server'
import { WeeklySchedule } from '@/components/availability/weekly-schedule'
import { DateOverrideSection } from '@/components/availability/date-override'

export default async function AvailabilityPage() {
  const supabase = await createClient()

  const [{ data: slots }, { data: overrides }] = await Promise.all([
    supabase.from('availability_slots').select('*').order('day_of_week'),
    supabase.from('date_overrides').select('*').order('date'),
  ])

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Availability Settings</h1>
      <WeeklySchedule slots={slots ?? []} />
      <DateOverrideSection overrides={overrides ?? []} />
    </div>
  )
}
