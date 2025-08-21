import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const fallbackConfig = {
  apiKey: "AIzaSyD-8pJmfnFFK8hcd1syTk-vpw3CVNJ68Es",
  authDomain: "em-inventory-management.firebaseapp.com",
  projectId: "em-inventory-management",
  storageBucket: "em-inventory-management.appspot.com",
  messagingSenderId: "981582303526",
  appId: "1:981582303526:web:9a2b9c76218ca91212b1e7",
  measurementId: "G-RTJV7S11H8",
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || fallbackConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || fallbackConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || fallbackConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || fallbackConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || fallbackConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || fallbackConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || fallbackConfig.measurementId,
};

// Initialize Firebase once
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
// Ensure session persists across page refreshes
try {
  setPersistence(auth, browserLocalPersistence);
} catch (e) {
  // Non-fatal if persistence cannot be set
}
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
