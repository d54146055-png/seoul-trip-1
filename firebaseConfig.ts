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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Collection Reference Name
export const TRIP_ID = 'seoul-trip-demo'; // In a real app, this could be dynamic
