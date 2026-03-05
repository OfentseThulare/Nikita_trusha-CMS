'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { updateAvailabilitySlots } from '@/lib/actions/availability'
import { getDayName } from '@/lib/utils/dates'
import type { AvailabilitySlot } from '@/types'
import { Loader2 } from 'lucide-react'

interface DaySlot {
  day_of_week: number
  is_active: boolean
  start_time: string
  end_time: string
}

const DEFAULT_SLOTS: DaySlot[] = [0, 1, 2, 3, 4, 5, 6].map(day => ({
  day_of_week: day,
  is_active: day >= 1 && day <= 5,
  start_time: '09:00',
  end_time: '17:00',
}))

function buildSlots(existing: AvailabilitySlot[]): DaySlot[] {
  return [0, 1, 2, 3, 4, 5, 6].map(day => {
    const slot = existing.find(s => s.day_of_week === day)
    return {
      day_of_week: day,
      is_active: slot?.is_active ?? (day >= 1 && day <= 5),
      start_time: slot?.start_time ?? '09:00',
      end_time: slot?.end_time ?? '17:00',
    }
  })
}

export function WeeklySchedule({ slots: initialSlots }: { slots: AvailabilitySlot[] }) {
  const [, startTransition] = useTransition()
  const [slots, setSlots] = useState<DaySlot[]>(
    initialSlots.length > 0 ? buildSlots(initialSlots) : DEFAULT_SLOTS
  )
  const [saving, setSaving] = useState(false)

  function updateSlot(day: number, field: keyof DaySlot, value: boolean | string) {
    setSlots(prev =>
      prev.map(s => s.day_of_week === day ? { ...s, [field]: value } : s)
    )
  }

  async function handleSave() {
    setSaving(true)
    const result = await updateAvailabilitySlots(
      slots.filter(s => s.is_active).map(s => ({
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        is_active: true,
      }))
    )
    if (result.error) toast.error(result.error)
    else {
      toast.success('Schedule saved')
      startTransition(() => {})
    }
    setSaving(false)
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Weekly Schedule</h2>
        <Button size="sm" className="bg-[#0033A0] hover:bg-[#001F6B]" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Save Schedule
        </Button>
      </div>

      <div className="space-y-3">
        {slots.map(slot => (
          <div key={slot.day_of_week} className="flex items-center gap-4">
            <div className="w-24 flex items-center gap-2">
              <Switch
                checked={slot.is_active}
                onCheckedChange={v => updateSlot(slot.day_of_week, 'is_active', v)}
                id={`day-${slot.day_of_week}`}
              />
              <Label htmlFor={`day-${slot.day_of_week}`} className="text-sm font-medium w-16">
                {getDayName(slot.day_of_week).substring(0, 3)}
              </Label>
            </div>
            {slot.is_active ? (
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={slot.start_time}
                  onChange={e => updateSlot(slot.day_of_week, 'start_time', e.target.value)}
                  className="h-8 w-28 text-sm"
                />
                <span className="text-gray-400 text-sm">to</span>
                <Input
                  type="time"
                  value={slot.end_time}
                  onChange={e => updateSlot(slot.day_of_week, 'end_time', e.target.value)}
                  className="h-8 w-28 text-sm"
                />
              </div>
            ) : (
              <span className="text-sm text-gray-400">Unavailable</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
