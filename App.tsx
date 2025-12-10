import React, { useState, useEffect } from 'react';
import { AppTab, Expense, ItineraryItem, User } from './types';
import ItineraryView from './components/ItineraryView';
import ExpenseView from './components/ExpenseView';
import ChatView from './components/ChatView';
import MapView from './components/MapView';
import { Calendar, CreditCard, MessageCircle, MapPin, Compass, Users } from 'lucide-react';
import { subscribeToExpenses, subscribeToItinerary, subscribeToUsers } from './services/firebaseService';

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
    <div className="min-h-screen bg-cream text-cocoa font-sans max-w-md mx-auto relative shadow-2xl overflow-hidden border-x border-sand/50">
      {/* Header */}
      <header className="bg-cream/90 backdrop-blur-md sticky top-0 z-20 px-6 py-5 border-b border-sand/30 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-cocoa">
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
        <div className="w-10 h-10 rounded-full bg-white border border-sand flex items-center justify-center shadow-sm">
             <Compass size={20} className="text-cocoa" />
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-140px)] bg-cream">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-sand pb-safe max-w-md mx-auto shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[2rem]">
        <div className="flex justify-around items-center h-20 px-4">
          <button 
            onClick={() => setActiveTab(AppTab.ITINERARY)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === AppTab.ITINERARY ? 'text-cocoa' : 'text-gray-300 hover:text-latte'}`}
          >
            <Calendar size={24} strokeWidth={activeTab === AppTab.ITINERARY ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide">PLAN</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.MAP)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === AppTab.MAP ? 'text-cocoa' : 'text-gray-300 hover:text-latte'}`}
          >
            <MapPin size={24} strokeWidth={activeTab === AppTab.MAP ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide">MAP</span>
          </button>
          
          <button 
            onClick={() => setActiveTab(AppTab.AI_GUIDE)}
            className="flex flex-col items-center justify-center w-full h-full -mt-8"
          >
            <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${activeTab === AppTab.AI_GUIDE ? 'bg-cocoa scale-110 ring-4 ring-cream' : 'bg-cocoa hover:bg-latte'}`}>
                <MessageCircle size={28} className="text-white" fill="white" />
            </div>
            <span className={`text-[10px] font-bold mt-2 ${activeTab === AppTab.AI_GUIDE ? 'text-cocoa' : 'text-gray-300'}`}>AI</span>
          </button>

          <button 
            onClick={() => setActiveTab(AppTab.EXPENSES)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${activeTab === AppTab.EXPENSES ? 'text-cocoa' : 'text-gray-300 hover:text-latte'}`}
          >
            <CreditCard size={24} strokeWidth={activeTab === AppTab.EXPENSES ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-wide">MONEY</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default App;