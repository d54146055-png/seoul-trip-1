
import { db, TRIP_ID, isFirebaseConfigured } from '../firebaseConfig';
import { collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { ItineraryItem, Expense, User, ChatMessage } from '../types';

// ==========================================
// SERVICE IMPLEMENTATION (Cloud Only)
// ==========================================

const ensureConfig = () => {
    if (!isFirebaseConfigured) {
        alert("Firebase is not configured! Please update firebaseConfig.ts with your credentials.");
        throw new Error("Firebase not configured");
    }
}

// --- Sync Logic ---

// Check if the Google User exists in our Trip Users, if not, add them.
export const checkAndCreateUser = async (googleUser: { displayName: string | null, photoURL: string | null, uid: string }) => {
    ensureConfig();
    const name = googleUser.displayName || 'Traveler';
    const usersRef = collection(db, 'trips', TRIP_ID, 'users');
    
    // Check if user with this name already exists (Simple check)
    // In a production app, we should store the Auth UID in the user document
    const q = query(usersRef, where("name", "==", name));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        await addDoc(usersRef, { 
            name, 
            authId: googleUser.uid,
            avatar: googleUser.photoURL 
        });
        console.log(`User ${name} added to the trip.`);
    } else {
        console.log(`User ${name} already exists in trip.`);
    }
};

// --- Itinerary ---

export const subscribeToItinerary = (callback: (items: ItineraryItem[]) => void) => {
  ensureConfig();
  const q = query(collection(db, 'trips', TRIP_ID, 'itinerary'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryItem));
    callback(items);
  });
};

export const addItineraryItem = async (item: Omit<ItineraryItem, 'id'>) => {
  ensureConfig();
  await addDoc(collection(db, 'trips', TRIP_ID, 'itinerary'), item);
};

export const deleteItineraryItem = async (id: string) => {
  ensureConfig();
  await deleteDoc(doc(db, 'trips', TRIP_ID, 'itinerary', id));
};

// --- Expenses ---

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
  ensureConfig();
  const q = query(collection(db, 'trips', TRIP_ID, 'expenses'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    callback(items);
  });
};

export const addExpenseItem = async (item: Omit<Expense, 'id'>) => {
  ensureConfig();
  await addDoc(collection(db, 'trips', TRIP_ID, 'expenses'), item);
};

export const deleteExpenseItem = async (id: string) => {
  ensureConfig();
  await deleteDoc(doc(db, 'trips', TRIP_ID, 'expenses', id));
};

// --- Users ---

export const subscribeToUsers = (callback: (users: User[]) => void) => {
    ensureConfig();
    const q = query(collection(db, 'trips', TRIP_ID, 'users'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      callback(items);
    });
};

export const addUser = async (name: string) => {
    ensureConfig();
    await addDoc(collection(db, 'trips', TRIP_ID, 'users'), { name });
};

export const updateUser = async (id: string, newName: string) => {
    ensureConfig();
    await updateDoc(doc(db, 'trips', TRIP_ID, 'users', id), { name: newName });
};

export const deleteUser = async (id: string) => {
    ensureConfig();
    await deleteDoc(doc(db, 'trips', TRIP_ID, 'users', id));
};

// --- Chat ---

export const subscribeToChat = (callback: (messages: ChatMessage[]) => void) => {
    ensureConfig();
    const q = query(collection(db, 'trips', TRIP_ID, 'chat'), orderBy('timestamp', 'asc'), limit(50));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
        callback(items);
    });
};

export const sendChatMessage = async (message: Omit<ChatMessage, 'id'>) => {
    ensureConfig();
    await addDoc(collection(db, 'trips', TRIP_ID, 'chat'), message);
};
