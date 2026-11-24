import { z } from 'zod'
import { usernameSchema } from '../auth/schemas'

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(80, 'Name must be at most 80 characters.'),
  username: usernameSchema,
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
