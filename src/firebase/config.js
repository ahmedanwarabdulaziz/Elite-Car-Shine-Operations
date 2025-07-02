import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCVrEiqsCDMsPsi9TCJhUH_BvWraCbKTDg",
  authDomain: "elite-car-shine-24067.firebaseapp.com",
  projectId: "elite-car-shine-24067",
  storageBucket: "elite-car-shine-24067.firebasestorage.app",
  messagingSenderId: "364622019136",
  appId: "1:364622019136:web:f0f0efaad6e1ec50ddfda5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app; 