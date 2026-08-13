import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) &&
  Boolean(firebaseConfig.projectId) &&
  Boolean(firebaseConfig.appId);

export function getFirebaseApp() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Add VITE_FIREBASE_* variables to your .env file.'
    );
  }

  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }

  return getApp();
}

export function getFirestoreDb() {
  return getFirestore(getFirebaseApp());
}
