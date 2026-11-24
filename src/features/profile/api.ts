import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from '../../lib/firebase'
import type { UserProfile } from '../../types/firebase.types'
import { authKeys } from '../auth/api'
import { emailToUsername } from '../auth/schemas'
import { type UpdateProfileInput, updateProfileSchema } from './schemas'

export const profileKeys = {
  detail: (uid: string) => ['profile', uid] as const,
}

export interface ProfileData {
  name: string
  username: string
}

export function useUserProfile(uid: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(uid ?? 'anonymous'),
    enabled: Boolean(uid) && isFirebaseConfigured,
    queryFn: async (): Promise<ProfileData> => {
      if (!uid) {
        throw new Error('User ID is required.')
      }

      const snapshot = await getDoc(doc(db, 'profiles', uid))
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<UserProfile>
        return {
          name: data.name ?? auth.currentUser?.displayName ?? '',
          username:
            data.username ?? emailToUsername(auth.currentUser?.email),
        }
      }

      return {
        name: auth.currentUser?.displayName ?? '',
        username: emailToUsername(auth.currentUser?.email),
      }
    },
  })
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: UpdateProfileInput): Promise<ProfileData> => {
      const parsed = updateProfileSchema.parse(input)
      const currentUser = auth.currentUser
      if (!currentUser) {
        throw new Error('You must be signed in to update your profile.')
      }

      await updateProfile(currentUser, {
        displayName: parsed.name,
      })

      const profileRef = doc(db, 'profiles', currentUser.uid)
      const existing = await getDoc(profileRef)

      await setDoc(
        profileRef,
        {
          name: parsed.name,
          username: parsed.username,
          ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )

      return {
        name: parsed.name,
        username: parsed.username,
      }
    },
    onSuccess: (updated) => {
      const uid = auth.currentUser?.uid
      if (uid) {
        queryClient.setQueryData<ProfileData>(profileKeys.detail(uid), updated)
      }
      void queryClient.invalidateQueries({ queryKey: authKeys.session })
    },
  })
}
