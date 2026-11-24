import type { Timestamp } from 'firebase/firestore'

/**
 * Firestore document types.
 * Keep collection document interfaces aligned with `firestore.rules` and Zod schemas.
 */
export interface UserProfile {
  displayName: string | null
  avatarUrl: string | null
  createdAt: Timestamp
  updatedAt: Timestamp
}
