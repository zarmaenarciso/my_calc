import { z } from 'zod'

export const bankFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Bank name is required.')
    .max(100, 'Bank name must be at most 100 characters.'),
})

export const bankItemSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
})

export type BankFormInput = z.input<typeof bankFormSchema>
export type BankItem = z.infer<typeof bankItemSchema>
