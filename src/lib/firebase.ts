import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD-8pJmfnFFK8hcd1syTk-vpw3CVNJ68Es",
  authDomain: "em-inventory-management.firebaseapp.com",
  projectId: "em-inventory-management",
  storageBucket: "em-inventory-management.firebasestorage.app",
  messagingSenderId: "981582303526",
  appId: "1:981582303526:web:9a2b9c76218ca91212b1e7",
  measurementId: "G-RTJV7S11H8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
