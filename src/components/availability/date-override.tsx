'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { addDateOverride, deleteDateOverride } from '@/lib/actions/availability'
import { formatDate } from '@/lib/utils/dates'
import type { DateOverride } from '@/types'
import { Trash2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface DateOverrideProps {
  overrides: DateOverride[]
}

export function DateOverrideSection({ overrides }: DateOverrideProps) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const blockedDates = overrides
    .filter(o => !o.is_available)
    .map(o => new Date(o.date + 'T12:00:00'))

  function handleDateClick(date: Date | undefined) {
    if (!date) return
    setSelectedDate(date)
    setIsAvailable(false)
    setReason('')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!selectedDate) return
    setSaving(true)
    const result = await addDateOverride({
      date: format(selectedDate, 'yyyy-MM-dd'),
      is_available: isAvailable,
      start_time: isAvailable ? startTime : null,
      end_time: isAvailable ? endTime : null,
      reason: reason || null,
    })
    if (result.error) toast.error(typeof result.error === 'string' ? result.error : 'Error saving')
    else {
      toast.success('Date override saved')
      setDialogOpen(false)
      startTransition(() => router.refresh())
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    const result = await deleteDateOverride(id)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Override removed')
      startTransition(() => router.refresh())
    }
  }

  return (
    <div className="rounded-md border border-gray-200 bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Date Overrides</h2>
        <p className="text-xs text-gray-500">Click a date to block it or set custom hours</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateClick}
          className="rounded-md border border-gray-200"
          modifiers={{ blocked: blockedDates }}
          modifiersClassNames={{ blocked: 'bg-red-100 text-red-700 font-medium' }}
          disabled={date => date < new Date(new Date().setHours(0, 0, 0, 0))}
        />

        <div className="flex-1 space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Upcoming Overrides</h3>
          {overrides.length === 0 ? (
            <p className="text-sm text-gray-400">No overrides set</p>
          ) : (
            <div className="space-y-2">
              {overrides
                .sort((a, b) => a.date.localeCompare(b.date))
                .map(override => (
                  <div
                    key={override.id}
                    className="flex items-start justify-between p-3 rounded-md border border-gray-100 bg-gray-50"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(override.date)}
                        </span>
                        {override.is_available ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                            Custom hours
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                            Blocked
                          </Badge>
                        )}
                      </div>
                      {override.reason && (
                        <p className="text-xs text-gray-500 mt-0.5">{override.reason}</p>
                      )}
                      {override.is_available && override.start_time && override.end_time && (
                        <p className="text-xs text-gray-500">{override.start_time} – {override.end_time}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(override.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Override for {selectedDate ? format(selectedDate, 'dd MMM yyyy') : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} id="is-available" />
              <Label htmlFor="is-available">
                {isAvailable ? 'Available with custom hours' : 'Block this day entirely'}
              </Label>
            </div>
            {isAvailable && (
              <div className="flex items-center gap-3">
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Start time</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-8" />
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">End time</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="h-8" />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Reason (optional)</Label>
              <Input
                placeholder="e.g. Public holiday, Conference..."
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className={isAvailable ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isAvailable ? <Plus className="mr-2 h-3.5 w-3.5" /> : <Trash2 className="mr-2 h-3.5 w-3.5" />}
              {isAvailable ? 'Set Custom Hours' : 'Block Day'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
