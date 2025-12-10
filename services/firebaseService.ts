
import { db, TRIP_ID, isFirebaseConfigured } from '../firebaseConfig';
import { collection, doc, onSnapshot, addDoc, deleteDoc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { ItineraryItem, Expense, User, ChatMessage } from '../types';

// ==========================================
// LOCAL STORAGE HELPERS (Fallback)
// ==========================================
const LS_KEYS = {
  ITINERARY: `seoul_itinerary_${TRIP_ID}`,
  EXPENSES: `seoul_expenses_${TRIP_ID}`,
  USERS: `seoul_users_${TRIP_ID}`,
  CHAT: `seoul_chat_${TRIP_ID}`
};

const getLocal = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

const setLocal = (key: string, data: any[]) => {
  localStorage.setItem(key, JSON.stringify(data));
  // Dispatch event for local syncing
  window.dispatchEvent(new Event('local-storage-update'));
};

// ==========================================
// SERVICE IMPLEMENTATION
// ==========================================

// --- Itinerary ---

export const subscribeToItinerary = (callback: (items: ItineraryItem[]) => void) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'trips', TRIP_ID, 'itinerary'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItineraryItem));
      callback(items);
    });
  } else {
    // LocalStorage Mode
    const load = () => callback(getLocal<ItineraryItem>(LS_KEYS.ITINERARY));
    load(); // Initial load
    
    const handleStorageChange = () => load();
    window.addEventListener('local-storage-update', handleStorageChange);
    return () => window.removeEventListener('local-storage-update', handleStorageChange);
  }
};

export const addItineraryItem = async (item: Omit<ItineraryItem, 'id'>) => {
  if (isFirebaseConfigured && db) {
    await addDoc(collection(db, 'trips', TRIP_ID, 'itinerary'), item);
  } else {
    const items = getLocal<ItineraryItem>(LS_KEYS.ITINERARY);
    const newItem = { ...item, id: crypto.randomUUID() };
    setLocal(LS_KEYS.ITINERARY, [...items, newItem]);
  }
};

export const deleteItineraryItem = async (id: string) => {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'trips', TRIP_ID, 'itinerary', id));
  } else {
    const items = getLocal<ItineraryItem>(LS_KEYS.ITINERARY);
    setLocal(LS_KEYS.ITINERARY, items.filter(i => i.id !== id));
  }
};

// --- Expenses ---

export const subscribeToExpenses = (callback: (expenses: Expense[]) => void) => {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, 'trips', TRIP_ID, 'expenses'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      callback(items);
    });
  } else {
    const load = () => {
      const items = getLocal<Expense>(LS_KEYS.EXPENSES);
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(items);
    };
    load();
    const handleStorageChange = () => load();
    window.addEventListener('local-storage-update', handleStorageChange);
    return () => window.removeEventListener('local-storage-update', handleStorageChange);
  }
};

export const addExpenseItem = async (item: Omit<Expense, 'id'>) => {
  if (isFirebaseConfigured && db) {
    await addDoc(collection(db, 'trips', TRIP_ID, 'expenses'), item);
  } else {
    const items = getLocal<Expense>(LS_KEYS.EXPENSES);
    const newItem = { ...item, id: crypto.randomUUID() };
    setLocal(LS_KEYS.EXPENSES, [newItem, ...items]); 
  }
};

export const deleteExpenseItem = async (id: string) => {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'trips', TRIP_ID, 'expenses', id));
  } else {
    const items = getLocal<Expense>(LS_KEYS.EXPENSES);
    setLocal(LS_KEYS.EXPENSES, items.filter(i => i.id !== id));
  }
};

// --- Users ---

export const subscribeToUsers = (callback: (users: User[]) => void) => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'trips', TRIP_ID, 'users'));
      return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
        callback(items);
      });
    } else {
      const load = () => callback(getLocal<User>(LS_KEYS.USERS));
      load();
      const handleStorageChange = () => load();
      window.addEventListener('local-storage-update', handleStorageChange);
      return () => window.removeEventListener('local-storage-update', handleStorageChange);
    }
};

export const addUser = async (name: string) => {
    if (isFirebaseConfigured && db) {
      await addDoc(collection(db, 'trips', TRIP_ID, 'users'), { name });
    } else {
      const items = getLocal<User>(LS_KEYS.USERS);
      if (!items.find(u => u.name === name)) {
          setLocal(LS_KEYS.USERS, [...items, { id: crypto.randomUUID(), name }]);
      }
    }
};

export const updateUser = async (id: string, newName: string) => {
    if (isFirebaseConfigured && db) {
        await updateDoc(doc(db, 'trips', TRIP_ID, 'users', id), { name: newName });
    } else {
        const items = getLocal<User>(LS_KEYS.USERS);
        const updated = items.map(u => u.id === id ? { ...u, name: newName } : u);
        setLocal(LS_KEYS.USERS, updated);
    }
};

export const deleteUser = async (id: string) => {
    if (isFirebaseConfigured && db) {
        await deleteDoc(doc(db, 'trips', TRIP_ID, 'users', id));
    } else {
        const items = getLocal<User>(LS_KEYS.USERS);
        setLocal(LS_KEYS.USERS, items.filter(u => u.id !== id));
    }
};

// --- Chat ---

export const subscribeToChat = (callback: (messages: ChatMessage[]) => void) => {
    if (isFirebaseConfigured && db) {
        // Limit to last 50 messages to keep it performant, order by timestamp
        const q = query(collection(db, 'trips', TRIP_ID, 'chat'), orderBy('timestamp', 'asc'), limit(50));
        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
            callback(items);
        });
    } else {
        const load = () => {
            const items = getLocal<ChatMessage>(LS_KEYS.CHAT);
            // Simple sort
            items.sort((a, b) => a.timestamp - b.timestamp);
            callback(items);
        };
        load();
        const handleStorageChange = () => load();
        window.addEventListener('local-storage-update', handleStorageChange);
        return () => window.removeEventListener('local-storage-update', handleStorageChange);
    }
};

export const sendChatMessage = async (message: Omit<ChatMessage, 'id'>) => {
    if (isFirebaseConfigured && db) {
        await addDoc(collection(db, 'trips', TRIP_ID, 'chat'), message);
    } else {
        const items = getLocal<ChatMessage>(LS_KEYS.CHAT);
        const newItem = { ...message, id: crypto.randomUUID() };
        // Basic cleanup for local storage: keep last 50
        const updated = [...items, newItem].slice(-50);
        setLocal(LS_KEYS.CHAT, updated);
    }
};
