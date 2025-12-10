
import React, { useState, useEffect } from 'react';
import { AppTab, Expense, ItineraryItem, User } from './types';
import ItineraryView from './components/ItineraryView';
import ExpenseView from './components/ExpenseView';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import LoginView from './components/LoginView';
import { Calendar, CreditCard, MessageCircle, MapPin, Compass, LogOut } from 'lucide-react';
import { subscribeToExpenses, subscribeToItinerary, subscribeToUsers, checkAndCreateUser } from './services/firebaseService';
import { subscribeToAuthChanges, logout } from './services/authService';
import { User as FirebaseUser } from 'firebase/auth';

const App: React.FC = () => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ITINERARY);
  
  // Real-time Data from Firebase
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // 1. Handle Authentication
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            // Sync this user to the trip database
            await checkAndCreateUser({
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                uid: currentUser.uid
            });
        }
        setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle Data Sync (Only if logged in)
  useEffect(() => {
    if (!user) return;

    const unsubscribeItinerary = subscribeToItinerary(setItineraryItems);
    const unsubscribeExpenses = subscribeToExpenses(setExpenses);
    const unsubscribeUsers = subscribeToUsers(setUsers);

    return () => {
      unsubscribeItinerary();
      unsubscribeExpenses();
      unsubscribeUsers();
    };
  }, [user]);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.ITINERARY:
        return <ItineraryView items={itineraryItems} />;
      case AppTab.MAP:
        return <MapView />;
      case AppTab.EXPENSES:
        return <ExpenseView expenses={expenses} users={users} />;
      case AppTab.AI_GUIDE:
        return <ChatView />;
      default:
        return <ItineraryView items={itineraryItems} />;
    }
  };

  // Loading Screen
  if (authLoading) {
    return (
        <div className="h-full w-full bg-cream flex items-center justify-center">
            <Compass size={48} className="text-cocoa animate-spin" />
        </div>
    );
  }

  // Not Logged In
  if (!user) {
      return <LoginView />;
  }

  // Main App
  return (
    <div className="h-full flex flex-col bg-cream text-cocoa font-sans max-w-md mx-auto relative shadow-2xl border-x border-sand/50 overflow-hidden">
      {/* Header - Fixed */}
      <header className="flex-none bg-cream/95 backdrop-blur-md z-20 px-6 pt-safe-top pb-3 border-b border-sand/30 flex justify-between items-center h-[calc(60px+env(safe-area-inset-top))]">
        <div className="pt-2">
          <h1 className="text-2xl font-serif font-bold text-cocoa leading-none">
            Seoul<span className="text-accent">Mate</span>.
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="flex -space-x-1">
                {users.slice(0, 3).map((u, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-latte border border-cream text-[8px] flex items-center justify-center text-white uppercase overflow-hidden">
                        {/* Try to use avatar if available, else initial */}
                        {/* We don't have avatars in User type yet, but logic is ready for future */}
                        {u.name.charAt(0)}
                    </div>
                ))}
             </div>
             <p className="text-[10px] text-latte font-bold tracking-[0.2em] uppercase">{users.length > 1 ? 'Shared Trip' : 'My Trip'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
            {/* User Avatar / Logout */}
            <div className="relative group">
                <button className="w-9 h-9 rounded-full bg-white border border-sand flex items-center justify-center shadow-sm overflow-hidden">
                    {user.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-cocoa font-bold">{user.displayName?.charAt(0)}</span>
                    )}
                </button>
                {/* Dropdown for Logout */}
                <div className="absolute right-0 top-10 w-32 bg-white rounded-xl shadow-xl p-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                    <button onClick={logout} className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-50 rounded-lg flex items-center">
                        <LogOut size={12} className="mr-2"/> Sign Out
                    </button>
                </div>
            </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 overflow-hidden relative w-full">
        {renderContent()}
      </main>

      {/* Bottom Navigation - Fixed */}
      <nav className="flex-none bg-white/95 backdrop-blur-lg border-t border-sand pb-safe z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2rem] h-[calc(70px+env(safe-area-inset-bottom))]">
        <div className="flex justify-around items-start h-full pt-3 px-4">
          <button 
            onClick={() => setActiveTab(AppTab.ITINERARY)}
            className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors ${activeTab === AppTab.ITINERARY ? 'text-cocoa' : 'text-gray-300 hover:text-latte'}`}
          >
            <Calendar size={22} strokeWidth={activeTab === AppTab.ITINERARY ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-wide">PLAN</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.MAP)}
            className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors ${activeTab === AppTab.MAP ? 'text-cocoa' : 'text-gray-300 hover:text-latte'}`}
          >
            <MapPin size={22} strokeWidth={activeTab === AppTab.MAP ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-wide">MAP</span>
          </button>
          
          <button 
            onClick={() => setActiveTab(AppTab.AI_GUIDE)}
            className="flex flex-col items-center justify-center w-16 -mt-8"
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${activeTab === AppTab.AI_GUIDE ? 'bg-cocoa scale-110 ring-4 ring-cream' : 'bg-cocoa hover:bg-latte'}`}>
                <MessageCircle size={26} className="text-white" fill="white" />
            </div>
            <span className={`text-[9px] font-bold mt-2 ${activeTab === AppTab.AI_GUIDE ? 'text-cocoa' : 'text-gray-300'}`}>AI</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.EXPENSES)}
            className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors ${activeTab === AppTab.EXPENSES ? 'text-cocoa' : 'text-gray-300 hover:text-latte'}`}
          >
            <CreditCard size={22} strokeWidth={activeTab === AppTab.EXPENSES ? 2.5 : 2} />
            <span className="text-[9px] font-bold tracking-wide">MONEY</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
