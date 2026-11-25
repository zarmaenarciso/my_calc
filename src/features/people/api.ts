import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../../lib/firebase'
import type {
  PersonDocument,
  PersonRecordDocument,
} from '../../types/firebase.types'
import {
  type PersonFormInput,
  personFormSchema,
  type PersonItem,
  personItemSchema,
  type RecordFormInput,
  recordFormSchema,
  type RecordItem,
  recordItemSchema,
} from './schemas'

export const peopleKeys = {
  list: (uid: string) => ['people', uid] as const,
  detail: (uid: string, personId: string) => ['people', uid, personId] as const,
  records: (uid: string, personId: string) =>
    ['people', uid, personId, 'records'] as const,
}

function getPeopleCollection(uid: string) {
  return collection(db, 'users', uid, 'people')
}

function getRecordsCollection(uid: string, personId: string) {
  return collection(db, 'users', uid, 'people', personId, 'records')
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

export function usePerson(
  uid: string | undefined,
  personId: string | undefined,
) {
  return useQuery({
    queryKey: peopleKeys.detail(uid ?? 'anonymous', personId ?? 'none'),
    enabled: Boolean(uid) && Boolean(personId) && isFirebaseConfigured,
    queryFn: async (): Promise<PersonItem | null> => {
      if (!uid || !personId) {
        return null
      }

      const snapshot = await getDoc(doc(db, 'users', uid, 'people', personId))
      if (!snapshot.exists()) {
        return null
      }

      const raw = snapshot.data() as Partial<PersonDocument>
      return personItemSchema.parse({
        id: snapshot.id,
        name: raw.name ?? '',
        notes: raw.notes ?? '',
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
    onSuccess: (_data, variables) => {
      if (uid) {
        void queryClient.invalidateQueries({ queryKey: peopleKeys.list(uid) })
        void queryClient.invalidateQueries({
          queryKey: peopleKeys.detail(uid, variables.id),
        })
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

export function usePersonRecords(
  uid: string | undefined,
  personId: string | undefined,
) {
  return useQuery({
    queryKey: peopleKeys.records(uid ?? 'anonymous', personId ?? 'none'),
    enabled: Boolean(uid) && Boolean(personId) && isFirebaseConfigured,
    queryFn: async (): Promise<RecordItem[]> => {
      if (!uid || !personId) {
        return []
      }

      const q = query(
        getRecordsCollection(uid, personId),
        orderBy('date', 'desc'),
      )
      const snapshot = await getDocs(q)

      return snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as Partial<PersonRecordDocument>
        return recordItemSchema.parse({
          id: docSnap.id,
          item: raw.item ?? '',
          type: raw.type === 'Credit' || raw.type === 'Debit' ? raw.type : 'Debit',
          date: raw.date ?? '',
          amount: typeof raw.amount === 'number' ? raw.amount : 0,
          note: raw.note ?? '',
          imageUrl: typeof raw.imageUrl === 'string' ? raw.imageUrl : null,
        })
      })
    },
  })
}

export function useCreatePersonRecord(
  uid: string | undefined,
  personId: string | undefined,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RecordFormInput) => {
      if (!uid || !personId) {
        throw new Error('Missing user or person context.')
      }

      const parsed = recordFormSchema.parse(input)
      await addDoc(getRecordsCollection(uid, personId), {
        item: parsed.item,
        type: parsed.type,
        date: parsed.date,
        amount: parsed.amount,
        note: parsed.note,
        imageUrl: parsed.imageUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    },
    onSuccess: () => {
      if (uid && personId) {
        void queryClient.invalidateQueries({
          queryKey: peopleKeys.records(uid, personId),
        })
      }
    },
  })
}

export function useUpdatePersonRecord(
  uid: string | undefined,
  personId: string | undefined,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      recordId,
      ...input
    }: RecordFormInput & { recordId: string }) => {
      if (!uid || !personId) {
        throw new Error('Missing user or person context.')
      }

      const parsed = recordFormSchema.parse(input)
      await updateDoc(
        doc(db, 'users', uid, 'people', personId, 'records', recordId),
        {
          item: parsed.item,
          type: parsed.type,
          date: parsed.date,
          amount: parsed.amount,
          note: parsed.note,
          imageUrl: parsed.imageUrl,
          updatedAt: serverTimestamp(),
        },
      )
    },
    onSuccess: () => {
      if (uid && personId) {
        void queryClient.invalidateQueries({
          queryKey: peopleKeys.records(uid, personId),
        })
      }
    },
  })
}

export function useDeletePersonRecord(
  uid: string | undefined,
  personId: string | undefined,
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (recordId: string) => {
      if (!uid || !personId) {
        throw new Error('Missing user or person context.')
      }

      await deleteDoc(
        doc(db, 'users', uid, 'people', personId, 'records', recordId),
      )
    },
    onSuccess: () => {
      if (uid && personId) {
        void queryClient.invalidateQueries({
          queryKey: peopleKeys.records(uid, personId),
        })
      }
    },
  })
}
