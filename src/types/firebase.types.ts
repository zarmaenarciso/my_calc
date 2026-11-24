import type { Timestamp } from 'firebase/firestore'

/**
 * Firestore document types.
 * Keep collection document interfaces aligned with `firestore.rules` and Zod schemas.
 */
export interface UserProfile {
  name: string
  username: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
