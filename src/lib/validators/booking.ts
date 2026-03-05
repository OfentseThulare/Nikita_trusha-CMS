import { z } from 'zod'

export const bookingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be HH:MM'),
  notes: z.string().max(1000).nullable().optional(),
})

export type BookingFormData = z.infer<typeof bookingSchema>
