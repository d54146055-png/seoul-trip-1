
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

// Check if config is actually set and valid
// We check for "YOUR_API_KEY" (placeholder) or empty string
export const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_API_KEY" && 
  firebaseConfig.apiKey !== "";

let app;
let db: any;
let auth: any;
let googleProvider: any;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.log("Firebase initialized successfully (Cloud Mode)");
  } catch (e) {
    console.error("Firebase initialization failed:", e);
    db = null;
    auth = null;
    googleProvider = null;
  }
} else {
  console.warn("Firebase config missing. App is running in Local Storage Mode.");
  db = null;
  auth = null;
  googleProvider = null;
}

export { db, auth, googleProvider };

// This ID groups all data for this specific trip. 
export const TRIP_ID = 'seoul-trip-2025-v1';
