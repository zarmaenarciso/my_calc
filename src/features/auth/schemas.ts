import { z } from 'zod'

export const authCredentialsSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long.')
    .max(128, 'Password must be at most 128 characters long.'),
})

export type AuthCredentials = z.infer<typeof authCredentialsSchema>
