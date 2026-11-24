import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { useEffect } from 'react'
import { auth, isFirebaseConfigured } from '../../lib/firebase'
import { type AuthCredentials, authCredentialsSchema } from './schemas'

export const authKeys = {
  session: ['auth', 'session'] as const,
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

export function useSignIn() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: AuthCredentials) => {
      const parsed = authCredentialsSchema.parse(credentials)
      const credential = await signInWithEmailAndPassword(
        auth,
        parsed.email,
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
    mutationFn: async (credentials: AuthCredentials) => {
      const parsed = authCredentialsSchema.parse(credentials)
      const credential = await createUserWithEmailAndPassword(
        auth,
        parsed.email,
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
    },
  })
}
