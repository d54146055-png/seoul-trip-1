import { db, TRIP_ID } from '../firebaseConfig';
import { collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ItineraryItem, Expense, User } from '../types';

// --- Itinerary ---

export const subscribeToItinerary = (callback: (items: ItineraryItem[]) => void) => {
  const q = query(collection(db, 'trips', TRIP_ID, 'itinerary'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryItem));
    callback(items);
  });
};

export const addItineraryItem = async (item: Omit<ItineraryItem, 'id'>) => {
  await addDoc(collection(db, 'trips', TRIP_ID, 'itinerary'), item);
};

export const deleteItineraryItem = async (id: string) => {
  await deleteDoc(doc(db, 'trips', TRIP_ID, 'itinerary', id));
};

// --- Expenses ---

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
  const q = query(collection(db, 'trips', TRIP_ID, 'expenses'), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
    callback(items);
  });
};

export const addExpenseItem = async (item: Omit<Expense, 'id'>) => {
  await addDoc(collection(db, 'trips', TRIP_ID, 'expenses'), item);
};

export const deleteExpenseItem = async (id: string) => {
  await deleteDoc(doc(db, 'trips', TRIP_ID, 'expenses', id));
};

// --- Users ---

export const subscribeToUsers = (callback: (users: User[]) => void) => {
    const q = query(collection(db, 'trips', TRIP_ID, 'users'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      callback(items);
    });
};

export const addUser = async (name: string) => {
    await addDoc(collection(db, 'trips', TRIP_ID, 'users'), { name });
};
