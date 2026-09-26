import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Standard structured Firebase configuration for TRACKMEDS Command Center
const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyD-TRACKMEDS-DEMO-KEY-2026",
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "trackmeds-health.firebaseapp.com",
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "trackmeds-health",
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "trackmeds-health.appspot.com",
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:1029384756:web:trackmeds2026"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
