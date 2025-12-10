
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ==================================================================
// ⚠️ IMPORTANT: REPLACE THE OBJECT BELOW WITH YOUR FIREBASE CONFIG
// Go to Firebase Console -> Project Settings -> General -> Your apps
// ==================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBPO5xK6-eFgItWQIEbYwsrUc3ZdAiq_y4",
  authDomain: "seoultriphavefun.firebaseapp.com",
  projectId: "seoultriphavefun",
  storageBucket: "seoultriphavefun.firebasestorage.app",
  messagingSenderId: "677388619970",
  appId: "1:677388619970:web:40a53b51773c037881ab5b",
  measurementId: "G-CN8MM3SEQ2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Check if config is actually set
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "";

if (!isFirebaseConfigured) {
  console.error("Firebase config is missing! Data will NOT be saved to the cloud.");
}

export { db, auth, googleProvider };

// This ID groups all data for this specific trip. 
// Everyone using this deployed app will share this trip data.
export const TRIP_ID = 'seoul-trip-2025-v1';
