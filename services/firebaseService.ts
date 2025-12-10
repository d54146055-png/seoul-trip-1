
import { db, TRIP_ID, isFirebaseConfigured } from '../firebaseConfig';
import { collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { ItineraryItem, Expense, User, ChatMessage } from '../types';

// ==========================================
// HYBRID SERVICE IMPLEMENTATION
// Automatically switches between Cloud (Firestore) and Local (LocalStorage)
// FIXED: Uses CustomEvents for local updates instead of page reload
// ==========================================

const useCloud = isFirebaseConfigured && db;

// --- Local Storage Helpers ---
const getLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(`${TRIP_ID}_${key}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const setLocal = (key: string, data: any[]) => {
  localStorage.setItem(`${TRIP_ID}_${key}`, JSON.stringify(data));
  // Dispatch a custom event so the UI knows to update without reloading
  window.dispatchEvent(new Event(`local_update_${key}`));
};

// --- Itinerary ---

export const subscribeToItinerary = (callback: (items: ItineraryItem[]) => void) => {
  if (useCloud) {
    const q = query(collection(db, 'trips', TRIP_ID, 'itinerary'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryItem));
      callback(items);
    });
  } else {
    // Local Subscription Pattern
    const load = () => callback(getLocal<ItineraryItem>('itinerary'));
    window.addEventListener('local_update_itinerary', load);
    load(); // Initial load
    return () => window.removeEventListener('local_update_itinerary', load);
  }
};

export const addItineraryItem = async (item: Omit<ItineraryItem, 'id'>) => {
  if (useCloud) {
    await addDoc(collection(db, 'trips', TRIP_ID, 'itinerary'), item);
  } else {
    const items = getLocal<ItineraryItem>('itinerary');
    const newItem = { ...item, id: Date.now().toString() } as ItineraryItem;
    setLocal('itinerary', [...items, newItem]);
  }
};

export const deleteItineraryItem = async (id: string) => {
  if (useCloud) {
    await deleteDoc(doc(db, 'trips', TRIP_ID, 'itinerary', id));
  } else {
    const items = getLocal<ItineraryItem>('itinerary');
    setLocal('itinerary', items.filter(i => i.id !== id));
  }
};

// --- Expenses ---

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
  if (useCloud) {
    const q = query(collection(db, 'trips', TRIP_ID, 'expenses'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      callback(items);
    });
  } else {
    const load = () => callback(getLocal<Expense>('expenses'));
    window.addEventListener('local_update_expenses', load);
    load();
    return () => window.removeEventListener('local_update_expenses', load);
  }
};

export const addExpenseItem = async (item: Omit<Expense, 'id'>) => {
  if (useCloud) {
    await addDoc(collection(db, 'trips', TRIP_ID, 'expenses'), item);
  } else {
    const items = getLocal<Expense>('expenses');
    const newItem = { ...item, id: Date.now().toString() } as Expense;
    setLocal('expenses', [newItem, ...items]);
  }
};

export const deleteExpenseItem = async (id: string) => {
  if (useCloud) {
    await deleteDoc(doc(db, 'trips', TRIP_ID, 'expenses', id));
  } else {
    const items = getLocal<Expense>('expenses');
    setLocal('expenses', items.filter(i => i.id !== id));
  }
};

// --- Users ---

export const subscribeToUsers = (callback: (users: User[]) => void) => {
    if (useCloud) {
      const q = query(collection(db, 'trips', TRIP_ID, 'users'));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        callback(items);
      });
    } else {
      const load = () => callback(getLocal<User>('users'));
      window.addEventListener('local_update_users', load);
      load();
      return () => window.removeEventListener('local_update_users', load);
    }
};

export const addUser = async (name: string) => {
    if (useCloud) {
      await addDoc(collection(db, 'trips', TRIP_ID, 'users'), { name });
    } else {
      const items = getLocal<User>('users');
      // Prevent duplicates
      if (!items.find(u => u.name === name)) {
        const newItem = { id: Date.now().toString(), name };
        setLocal('users', [...items, newItem]);
      }
    }
};

export const updateUser = async (id: string, newName: string) => {
    if (useCloud) {
        await updateDoc(doc(db, 'trips', TRIP_ID, 'users', id), { name: newName });
    } else {
        const items = getLocal<User>('users');
        const updated = items.map(u => u.id === id ? { ...u, name: newName } : u);
        setLocal('users', updated);
    }
};

export const deleteUser = async (id: string) => {
    if (useCloud) {
        await deleteDoc(doc(db, 'trips', TRIP_ID, 'users', id));
    } else {
        const items = getLocal<User>('users');
        setLocal('users', items.filter(u => u.id !== id));
    }
};

// --- Chat ---

export const subscribeToChat = (callback: (messages: ChatMessage[]) => void) => {
    if (useCloud) {
      const q = query(collection(db, 'trips', TRIP_ID, 'chat'), orderBy('timestamp', 'asc'), limit(50));
      return onSnapshot(q, (snapshot) => {
          const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
          callback(items);
      });
    } else {
      const load = () => {
          const items = getLocal<ChatMessage>('chat');
          // Sort by timestamp
          items.sort((a, b) => a.timestamp - b.timestamp);
          callback(items);
      }
      window.addEventListener('local_update_chat', load);
      load();
      return () => window.removeEventListener('local_update_chat', load);
    }
};

export const sendChatMessage = async (message: Omit<ChatMessage, 'id'>) => {
    if (useCloud) {
      await addDoc(collection(db, 'trips', TRIP_ID, 'chat'), message);
    } else {
      const items = getLocal<ChatMessage>('chat');
      const newItem = { ...message, id: Date.now().toString() } as ChatMessage;
      // Limit local chat history to 50 items
      const updated = [...items, newItem].slice(-50);
      setLocal('chat', updated);
    }
};
