
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in the Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyBPO5xK6-eFgItWQIEbYwsrUc3ZdAiq_y4",
  authDomain: "seoultriphavefun.firebaseapp.com",
  projectId: "seoultriphavefun",
  storageBucket: "seoultriphavefun.firebasestorage.app",
  messagingSenderId: "677388619970",
  appId: "1:677388619970:web:40a53b51773c037881ab5b"
};

// Simple check to see if the user has configured the app
// If apiKey is still the placeholder, we fall back to LocalStorage
export const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "";

let app;
let db: any;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // Fallback to local mode if init fails
  }
} else {
  console.warn("Firebase not configured. Using LocalStorage mode for demo purposes.");
}

export { db };

// Collection Reference Name
export const TRIP_ID = 'seoul-trip-demo'; 
