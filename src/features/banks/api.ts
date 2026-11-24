import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../../lib/firebase'
import type { BankDocument } from '../../types/firebase.types'
import {
  type BankFormInput,
  bankFormSchema,
  type BankItem,
  bankItemSchema,
} from './schemas'

export const banksKeys = {
  list: (uid: string) => ['banks', uid] as const,
}

function getBanksCollection(uid: string) {
  return collection(db, 'users', uid, 'banks')
}

export function useBanks(uid: string | undefined) {
  return useQuery({
    queryKey: banksKeys.list(uid ?? 'anonymous'),
    enabled: Boolean(uid) && isFirebaseConfigured,
    queryFn: async (): Promise<BankItem[]> => {
      if (!uid) {
        return []
      }

      const q = query(getBanksCollection(uid), orderBy('name', 'asc'))
      const snapshot = await getDocs(q)

      return snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as Partial<BankDocument>
        return bankItemSchema.parse({
          id: docSnap.id,
          name: raw.name ?? '',
        })
      })
    },
  })
}

export function useCreateBank(uid: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: BankFormInput) => {
      if (!uid) {
        throw new Error('You must be signed in to add a bank.')
      }

      const parsed = bankFormSchema.parse(input)
      await addDoc(getBanksCollection(uid), {
        name: parsed.name,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      if (uid) {
        void queryClient.invalidateQueries({ queryKey: banksKeys.list(uid) })
      }
    },
  })
}

export function useDeleteBank(uid: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bankId: string) => {
      if (!uid) {
        throw new Error('You must be signed in to delete a bank.')
      }

      await deleteDoc(doc(db, 'users', uid, 'banks', bankId))
    },
    onSuccess: () => {
      if (uid) {
        void queryClient.invalidateQueries({ queryKey: banksKeys.list(uid) })
      }
    },
  })
}
