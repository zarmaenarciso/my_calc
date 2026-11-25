import { z } from 'zod'

export const personFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be at most 100 characters.'),
  notes: z
    .string()
    .trim()
    .max(500, 'Notes must be at most 500 characters.')
    .default(''),
})

export const personItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  notes: z.string(),
})

export const recordTypeSchema = z.enum(['Credit', 'Debit'], {
  message: 'Please select Credit or Debit.',
})

export const recordFormSchema = z.object({
  item: z
    .string()
    .trim()
    .min(1, 'Item is required.')
    .max(120, 'Item must be at most 120 characters.'),
  type: recordTypeSchema,
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please select a valid date.'),
  amount: z.coerce
    .number({ message: 'Please enter a valid amount.' })
    .refine((val) => Number.isFinite(val), 'Please enter a valid amount.'),
  note: z
    .string()
    .trim()
    .max(500, 'Note must be at most 500 characters.')
    .default(''),
  imageUrl: z
    .string()
    .max(500_000, 'Image is too large. Please choose a smaller image.')
    .nullable()
    .optional()
    .default(null),
})

export const recordItemSchema = z.object({
  id: z.string().min(1),
  item: z.string(),
  type: recordTypeSchema,
  date: z.string(),
  amount: z.number(),
  note: z.string(),
  imageUrl: z.string().nullable(),
})

export type PersonFormInput = z.input<typeof personFormSchema>
export type PersonFormData = z.output<typeof personFormSchema>
export type PersonItem = z.infer<typeof personItemSchema>

export type RecordFormInput = z.input<typeof recordFormSchema>
export type RecordFormData = z.output<typeof recordFormSchema>
export type RecordItem = z.infer<typeof recordItemSchema>
