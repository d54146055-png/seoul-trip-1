import React, { useState, useEffect } from 'react';
import { AppTab, Expense, ItineraryItem, User } from './types';
import ItineraryView from './components/ItineraryView';
import ExpenseView from './components/ExpenseView';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import { Calendar, CreditCard, MessageCircle, MapPin, Compass, CloudOff } from 'lucide-react';
import { subscribeToExpenses, subscribeToItinerary, subscribeToUsers } from './services/firebaseService';
import { isFirebaseConfigured } from './firebaseConfig';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.ITINERARY);
  
  // Real-time Data from Firebase
  const [itineraryItems, setItineraryItems] = useState<ItineraryItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Setup listeners
    const unsubscribeItinerary = subscribeToItinerary((items) => {
      setItineraryItems(items);
    });

    const unsubscribeExpenses = subscribeToExpenses((items) => {
      setExpenses(items);
    });

    const unsubscribeUsers = subscribeToUsers((items) => {
      setUsers(items);
    });

    // Initialize default users for demo if empty in local mode
    if (!isFirebaseConfigured) {
        // Give the UI a moment to check local storage
        setTimeout(() => {
            const localUsers = localStorage.getItem('seoul_users_seoul-trip-demo');
            if (!localUsers || JSON.parse(localUsers).length === 0) {
                 localStorage.setItem('seoul_users_seoul-trip-demo', JSON.stringify([
                     { id: '1', name: 'You' },
                     { id: '2', name: 'Friend' }
                 ]));
                 window.dispatchEvent(new Event('local-storage-update'));
            }
        }, 500);
    }

    return () => {
      unsubscribeItinerary();
      unsubscribeExpenses();
      unsubscribeUsers();
    };
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.ITINERARY:
        // Pass read-only items, manipulation happens via service calls inside component
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
                    <div key={i} className="w-4 h-4 rounded-full bg-latte border border-cream text-[8px] flex items-center justify-center text-white uppercase">{u.name.charAt(0)}</div>
                ))}
             </div>
             <p className="text-[10px] text-latte font-bold tracking-[0.2em] uppercase">{users.length > 1 ? 'Shared Trip' : 'Travel Companion'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2">
            {!isFirebaseConfigured && (
                <div className="flex items-center text-[10px] bg-sand/30 px-2 py-1 rounded-full text-cocoa/50 font-bold" title="Demo Mode (Local Storage)">
                    <CloudOff size={12} className="mr-1" />
                    Offline
                </div>
            )}
            <div className="w-9 h-9 rounded-full bg-white border border-sand flex items-center justify-center shadow-sm">
                <Compass size={18} className="text-cocoa" />
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