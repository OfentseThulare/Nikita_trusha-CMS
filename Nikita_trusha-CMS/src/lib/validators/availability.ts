import { z } from 'zod'

export const availabilitySlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  is_active: z.boolean().default(true),
})

export const dateOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  is_available: z.boolean().default(false),
  start_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
  reason: z.string().max(200).nullable().optional(),
})

export type AvailabilitySlotFormData = z.infer<typeof availabilitySlotSchema>
export type DateOverrideFormData = z.infer<typeof dateOverrideSchema>
