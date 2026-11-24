import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { useEffect } from 'react'
import { auth, db, isFirebaseConfigured } from '../../lib/firebase'
import {
  type SignInInput,
  signInSchema,
  type SignUpInput,
  signUpSchema,
  type UpdatePasswordInput,
  updatePasswordSchema,
  usernameToEmail,
} from './schemas'

export const authKeys = {
  session: ['auth', 'session'] as const,
  superUser: (uid: string) => ['auth', 'superUser', uid] as const,
}

export interface AuthState {
  user: User | null
  isConfigured: boolean
}

function fetchInitialAuthState(): Promise<AuthState> {
  if (!isFirebaseConfigured) {
    return Promise.resolve({ user: null, isConfigured: false })
  }

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve({ user, isConfigured: true })
    })
  })
}

export function useAuthSession() {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      queryClient.setQueryData<AuthState>(authKeys.session, {
        user,
        isConfigured: true,
      })
    })

    return () => {
      unsubscribe()
    }
  }, [queryClient])

  return useQuery({
    queryKey: authKeys.session,
    queryFn: fetchInitialAuthState,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useIsSuperUser(user: User | null | undefined) {
  return useQuery({
    queryKey: authKeys.superUser(user?.uid ?? 'anonymous'),
    enabled: Boolean(user) && isFirebaseConfigured,
    queryFn: async (): Promise<boolean> => {
      if (!user) {
        return false
      }

      const tokenResult = await user.getIdTokenResult()
      if (tokenResult.claims.superUser === true) {
        return true
      }

      const superUserSnap = await getDoc(doc(db, 'superusers', user.uid))
      return superUserSnap.exists()
    },
  })
}

export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SignInInput) => {
      const parsed = signInSchema.parse(input)
      const credential = await signInWithEmailAndPassword(
        auth,
        usernameToEmail(parsed.username),
        parsed.password,
      )
      return credential.user
    },
    onSuccess: (user) => {
      queryClient.setQueryData<AuthState>(authKeys.session, {
        user,
        isConfigured: true,
      })
    },
  })
}

export function useSignUp() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SignUpInput) => {
      const parsed = signUpSchema.parse(input)
      const credential = await createUserWithEmailAndPassword(
        auth,
        usernameToEmail(parsed.username),
        parsed.password,
      )

      await updateProfile(credential.user, {
        displayName: parsed.name,
      })

      await setDoc(doc(db, 'profiles', credential.user.uid), {
        name: parsed.name,
        username: parsed.username,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      return credential.user
    },
    onSuccess: (user) => {
      queryClient.setQueryData<AuthState>(authKeys.session, {
        user,
        isConfigured: true,
      })
    },
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (input: UpdatePasswordInput) => {
      const parsed = updatePasswordSchema.parse(input)
      const currentUser = auth.currentUser
      if (!currentUser || !currentUser.email) {
        throw new Error('You must be signed in to update your password.')
      }

      const credential = EmailAuthProvider.credential(
        currentUser.email,
        parsed.currentPassword,
      )
      await reauthenticateWithCredential(currentUser, credential)
      await updatePassword(currentUser, parsed.newPassword)
    },
  })
}

export function useSignOut() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await signOut(auth)
    },
    onSuccess: () => {
      queryClient.setQueryData<AuthState>(authKeys.session, {
        user: null,
        isConfigured: true,
      })
      queryClient.removeQueries({ queryKey: ['profile'] })
      queryClient.removeQueries({ queryKey: ['people'] })
      queryClient.removeQueries({ queryKey: ['auth', 'superUser'] })
    },
  })
}
