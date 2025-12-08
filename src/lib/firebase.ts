import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

// Validate Firebase config
const validateFirebaseConfig = () => {
  const requiredFields = ['apiKey', 'authDomain', 'projectId', 'appId']
  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])

  if (missingFields.length > 0) {
    console.error('Missing Firebase environment variables:', missingFields)
    console.error('Please check your .env.local file and ensure all Firebase configuration variables are set')
    return false
  }

  // Check if API key looks valid (starts with AIza)
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIza')) {
    console.warn('Firebase API key may be invalid. Please check your Firebase Console configuration')
  }

  return true
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | undefined
let auth: Auth | undefined
let googleProvider: GoogleAuthProvider | undefined
let isFirebaseInitialized = false

if (typeof window !== 'undefined') {
  // Only initialize on client-side
  try {
    if (validateFirebaseConfig()) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
      auth = getAuth(app)
      googleProvider = new GoogleAuthProvider()

      // Optional: Configure Google provider
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      })

      isFirebaseInitialized = true
      console.log('Firebase initialized successfully')
    } else {
      console.error('Firebase configuration validation failed')
      console.error('Firebase authentication will not be available')
    }
  } catch (error) {
    console.error('Firebase initialization error:', error)
    console.error('Firebase authentication will not be available')
  }
}

// Export Firebase status for debugging
export const getFirebaseStatus = () => ({
  isInitialized: isFirebaseInitialized,
  hasAuth: !!auth,
  hasGoogleProvider: !!googleProvider,
  config: firebaseConfig
})

export { auth, googleProvider }
export default app

