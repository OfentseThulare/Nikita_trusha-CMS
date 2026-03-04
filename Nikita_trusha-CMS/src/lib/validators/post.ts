import { z } from 'zod'

export const postSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  content: z.record(z.string(), z.unknown()).nullable().optional(),
  excerpt: z.string().max(300).nullable().optional(),
  cover_image_url: z.string().url().or(z.literal('')).nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seo_title: z.string().max(70).nullable().optional(),
  meta_description: z.string().max(160).nullable().optional(),
})

export type PostFormData = z.infer<typeof postSchema>
