import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiiBOQvEf5lOi5ggcwa0gEg7sIdDPWmSg",
  authDomain: "skill-junction-aea36.firebaseapp.com",
  projectId: "skill-junction-aea36",
  storageBucket: "skill-junction-aea36.firebasestorage.app",
  messagingSenderId: "447638287844",
  appId: "1:447638287844:web:bc9923156090dedf66c3f1",
  measurementId: "G-FMSPTNQ1M0",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

