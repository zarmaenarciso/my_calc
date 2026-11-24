import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { clientEnv, isFirebaseConfigured } from './env'

const firebaseConfig = {
  apiKey: clientEnv.VITE_FIREBASE_API_KEY,
  authDomain: clientEnv.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: clientEnv.VITE_FIREBASE_PROJECT_ID,
  storageBucket: clientEnv.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: clientEnv.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: clientEnv.VITE_FIREBASE_APP_ID,
}

/**
 * Firebase client singletons.
 * Uses ONLY public Firebase Web SDK config (`VITE_FIREBASE_*`).
 * Privileged service-account credentials must NEVER be exposed in frontend code.
 */
export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(firebaseApp)
export const db = getFirestore(firebaseApp)

export { isFirebaseConfigured }
