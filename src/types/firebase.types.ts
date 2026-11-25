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

export interface BankDocument {
  name: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface PersonDocument {
  name: string
  notes: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface PersonRecordDocument {
  item: string
  type: 'Credit' | 'Debit'
  date: string
  amount: number
  note: string
  imageUrl?: string | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
