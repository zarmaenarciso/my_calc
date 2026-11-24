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
  updateDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../../lib/firebase'
import type { PersonDocument } from '../../types/firebase.types'
import {
  type PersonFormInput,
  personFormSchema,
  type PersonItem,
  personItemSchema,
} from './schemas'

export const peopleKeys = {
  list: (uid: string) => ['people', uid] as const,
}

function getPeopleCollection(uid: string) {
  return collection(db, 'users', uid, 'people')
}

export function usePeople(uid: string | undefined) {
  return useQuery({
    queryKey: peopleKeys.list(uid ?? 'anonymous'),
    enabled: Boolean(uid) && isFirebaseConfigured,
    queryFn: async (): Promise<PersonItem[]> => {
      if (!uid) {
        return []
      }

      const q = query(getPeopleCollection(uid), orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)

      return snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as Partial<PersonDocument>
        return personItemSchema.parse({
          id: docSnap.id,
          name: raw.name ?? '',
          notes: raw.notes ?? '',
        })
      })
    },
  })
}

export function useCreatePerson(uid: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: PersonFormInput) => {
      if (!uid) {
        throw new Error('You must be signed in to add a person.')
      }

      const parsed = personFormSchema.parse(input)
      await addDoc(getPeopleCollection(uid), {
        name: parsed.name,
        notes: parsed.notes,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      if (uid) {
        void queryClient.invalidateQueries({ queryKey: peopleKeys.list(uid) })
      }
    },
  })
}

export function useUpdatePerson(uid: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: PersonFormInput & { id: string }) => {
      if (!uid) {
        throw new Error('You must be signed in to update a person.')
      }

      const parsed = personFormSchema.parse(input)
      await updateDoc(doc(db, 'users', uid, 'people', id), {
        name: parsed.name,
        notes: parsed.notes,
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      if (uid) {
        void queryClient.invalidateQueries({ queryKey: peopleKeys.list(uid) })
      }
    },
  })
}

export function useDeletePerson(uid: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!uid) {
        throw new Error('You must be signed in to delete a person.')
      }

      await deleteDoc(doc(db, 'users', uid, 'people', id))
    },
    onSuccess: () => {
      if (uid) {
        void queryClient.invalidateQueries({ queryKey: peopleKeys.list(uid) })
      }
    },
  })
}
