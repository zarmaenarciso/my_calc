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

export type PersonFormInput = z.input<typeof personFormSchema>
export type PersonFormData = z.output<typeof personFormSchema>
export type PersonItem = z.infer<typeof personItemSchema>
