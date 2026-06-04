import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCLS_0hARtQCjdqpGe85d-FR0gHRWfskeA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "foodandnote.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "foodandnote",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "foodandnote.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1039429513177",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1039429513177:web:ed3e3b257073e99c2973c8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
