import { z } from 'zod'

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters.')
  .max(30, 'Username must be at most 30 characters.')
  .regex(
    /^[a-z0-9._-]+$/,
    'Username may only contain lowercase letters, numbers, dots, underscores, and hyphens.',
  )

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(128, 'Password must be at most 128 characters long.')

export const signInSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
})

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(80, 'Name must be at most 80 characters.'),
  username: usernameSchema,
  password: passwordSchema,
})

export const updatePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match.',
    path: ['confirmPassword'],
  })

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>

const SYNTHETIC_EMAIL_DOMAIN = 'users.calc.local'

/** Map a username to a deterministic email address for Firebase Email/Password Auth. */
export function usernameToEmail(username: string): string {
  const normalized = username.trim().toLowerCase()
  return normalized.includes('@')
    ? normalized
    : `${normalized}@${SYNTHETIC_EMAIL_DOMAIN}`
}

/** Extract the username portion from a synthetic or standard email address. */
export function emailToUsername(email: string | null | undefined): string {
  if (!email) {
    return ''
  }
  const [localPart] = email.split('@')
  return localPart ?? email
}
