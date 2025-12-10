import React, { useState } from 'react';
import { ItineraryItem } from '../types';
import { Plus, Trash2, MapPin, Sparkles, Cloud, Sun, CloudRain, Snowflake, Wand2 } from 'lucide-react';
import { generateItinerarySuggestion } from '../services/geminiService';
import { addItineraryItem, deleteItineraryItem } from '../services/firebaseService';

interface Props {
  items: ItineraryItem[];
  // setItems removed as we use Firebase
}

const ItineraryView: React.FC<Props> = ({ items }) => {
  const [selectedDay, setSelectedDay] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form State
  const [newItem, setNewItem] = useState<Partial<ItineraryItem>>({ time: '09:00', day: 1 });
  
  // Smart Plan State
  const [targetAreas, setTargetAreas] = useState('');

  const dayItems = items
    .filter(i => i.day === selectedDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  const handleAddItem = async () => {
    if (newItem.activity && newItem.time) {
      await addItineraryItem({
        time: newItem.time!,
        activity: newItem.activity!,
        location: newItem.location || '',
        notes: newItem.notes || '',
        day: selectedDay,
        weather: { temp: 18, condition: 'sunny', icon: '☀️' } // Default mock
      });
      setIsModalOpen(false);
      setNewItem({ time: '09:00', day: selectedDay });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteItineraryItem(id);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Use the areas from input to guide Gemini
    const suggestedItems = await generateItinerarySuggestion(
        selectedDay, 
        "Aesthetic spots, hidden gems, good food", 
        targetAreas
    );
    
    if (suggestedItems.length > 0) {
      // Add each item to Firebase
      for (const item of suggestedItems) {
          await addItineraryItem(item);
      }
    }
    setIsGenerating(false);
    setIsPlanModalOpen(false);
    setTargetAreas('');
  };

  const openMap = (location: string) => {
    const query = encodeURIComponent(`${location}, Seoul`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const getWeatherIcon = (condition?: string) => {
    if (!condition) return <Sun size={14} className="text-orange-400" />;
    const c = condition.toLowerCase();
    if (c.includes('rain')) return <CloudRain size={14} className="text-blue-400" />;
    if (c.includes('snow')) return <Snowflake size={14} className="text-blue-200" />;
    if (c.includes('cloud')) return <Cloud size={14} className="text-gray-400" />;
    return <Sun size={14} className="text-orange-400" />;
  };

  return (
    <div className="pb-24">
      {/* Day Selector */}
      <div className="sticky top-0 z-10 bg-cream/95 backdrop-blur-sm border-b border-sand p-4 overflow-x-auto no-scrollbar flex space-x-3 shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
        {[1, 2, 3, 4, 5, 6, 7].map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`flex flex-col items-center justify-center min-w-[3.5rem] h-14 rounded-2xl transition-all duration-300 ${
              selectedDay === day 
                ? 'bg-cocoa text-white shadow-lg scale-105' 
                : 'bg-white text-gray-400 hover:bg-sand/30'
            }`}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">Day</span>
            <span className="text-lg font-bold font-serif">{day}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-5 space-y-6">
        {dayItems.length === 0 ? (
          <div className="text-center py-20 opacity-60">
            <div className="w-16 h-16 bg-sand rounded-full mx-auto mb-4 flex items-center justify-center text-cocoa">
               <MapPin className="animate-bounce" />
            </div>
            <p className="mb-6 text-cocoa font-medium">Empty schedule for Day {selectedDay}</p>
            <button 
              onClick={() => setIsPlanModalOpen(true)}
              className="inline-flex items-center px-6 py-3 bg-white border border-sand text-cocoa rounded-xl font-bold hover:bg-sand transition-colors shadow-sm"
            >
              <Wand2 size={18} className="mr-2 text-accent" />
              Auto-Plan Day
            </button>
          </div>
        ) : (
          <div className="relative border-l border-dashed border-latte/30 ml-3 space-y-8 pb-4">
             {/* Magic Plan Button (Small) when items exist */}
             <button 
                onClick={() => setIsPlanModalOpen(true)}
                className="absolute -top-4 right-0 text-xs bg-white border border-sand px-3 py-1 rounded-full text-cocoa hover:bg-sand flex items-center"
             >
                <Sparkles size={10} className="mr-1 text-accent"/> AI Plan
             </button>

            {dayItems.map((item) => (
              <div key={item.id} className="relative pl-8 group">
                {/* Timeline Node */}
                <div className="absolute -left-[5px] top-5 w-2.5 h-2.5 bg-cream border-2 border-cocoa rounded-full z-10"></div>
                
                <div className="bg-white p-5 rounded-3xl shadow-[0_4px_20px_rgba(93,64,55,0.05)] border border-transparent hover:border-sand transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-serif text-2xl text-cocoa font-medium">{item.time}</span>
                    
                    {/* Weather Badge */}
                    <div className="flex items-center space-x-2 bg-sand/30 px-3 py-1 rounded-full text-xs text-cocoa font-medium">
                       {getWeatherIcon(item.weather?.condition)}
                       <span>{item.weather?.temp ? `${item.weather.temp}°` : '20°'}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight">{item.activity}</h3>
                  
                  <div 
                    onClick={() => openMap(item.location)}
                    className="flex items-center text-latte text-sm mb-3 cursor-pointer hover:text-accent transition-colors"
                  >
                    <MapPin size={14} className="mr-1" />
                    <span className="underline decoration-dotted decoration-latte">{item.location}</span> 
                  </div>
                  
                  {item.notes && (
                    <div className="text-xs text-gray-500 bg-cream p-3 rounded-xl italic border border-sand/30">
                      "{item.notes}"
                    </div>
                  )}

                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-300 hover:text-red-400">
                        <Trash2 size={16} />
                      </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-cocoa text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-latte hover:rotate-90 transition-all z-20"
      >
        <Plus size={28} />
      </button>

      {/* Add Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-cocoa/20 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl animate-[float_0.3s_ease-out]">
            <h2 className="text-xl font-serif font-bold text-cocoa mb-6 text-center">New Memory</h2>
            
            <div className="space-y-4">
              <div className="flex gap-4">
                 <div className="w-1/3">
                    <label className="block text-xs font-bold text-latte uppercase mb-1">Time</label>
                    <input 
                      type="time" 
                      className="w-full p-3 bg-cream rounded-xl text-cocoa font-bold text-center focus:outline-none focus:ring-1 focus:ring-cocoa"
                      value={newItem.time}
                      onChange={e => setNewItem({...newItem, time: e.target.value})}
                    />
                 </div>
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-latte uppercase mb-1">Activity</label>
                    <input 
                      type="text" 
                      placeholder="Cafe, Palace..."
                      className="w-full p-3 bg-cream rounded-xl text-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
                      value={newItem.activity || ''}
                      onChange={e => setNewItem({...newItem, activity: e.target.value})}
                    />
                 </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-latte uppercase mb-1">Location</label>
                <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-3.5 text-latte" />
                    <input 
                    type="text" 
                    placeholder="Search or enter address"
                    className="w-full p-3 pl-10 bg-cream rounded-xl text-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa"
                    value={newItem.location || ''}
                    onChange={e => setNewItem({...newItem, location: e.target.value})}
                    />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-latte uppercase mb-1">Notes</label>
                <textarea 
                  placeholder="Details..."
                  className="w-full p-3 bg-cream rounded-xl text-cocoa focus:outline-none focus:ring-1 focus:ring-cocoa resize-none h-20"
                  value={newItem.notes || ''}
                  onChange={e => setNewItem({...newItem, notes: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 text-latte font-medium hover:bg-cream rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddItem}
                className="flex-1 py-3 bg-cocoa text-white font-bold rounded-xl shadow-lg hover:bg-latte transition-colors"
              >
                Add Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Magic AI Plan Modal */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 bg-cocoa/30 z-50 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[2rem] w-full max-w-sm p-6 shadow-2xl relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-latte rounded-t-[2rem]"></div>
                
                <h2 className="text-2xl font-serif font-bold text-cocoa mb-2 text-center flex items-center justify-center gap-2">
                    <Sparkles size={24} className="text-accent" />
                    Magic Plan
                </h2>
                <p className="text-center text-xs text-gray-400 mb-6">Tell us where you want to go, AI will sort it out.</p>

                <div className="bg-cream p-4 rounded-xl border border-sand mb-6">
                    <label className="block text-xs font-bold text-latte uppercase mb-2">Target Areas / Districts</label>
                    <textarea 
                        className="w-full bg-white p-3 rounded-lg text-cocoa text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none h-24"
                        placeholder="e.g. Hongdae shopping, then Yeonnam-dong cafes, dinner in Itaewon..."
                        value={targetAreas}
                        onChange={(e) => setTargetAreas(e.target.value)}
                    />
                </div>

                <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !targetAreas}
                    className="w-full py-4 bg-cocoa text-white font-bold rounded-xl shadow-lg hover:bg-latte disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                    {isGenerating ? (
                        <>
                            <Sparkles size={18} className="animate-spin" />
                            Creating Schedule...
                        </>
                    ) : (
                        'Generate Itinerary'
                    )}
                </button>
                <button onClick={() => setIsPlanModalOpen(false)} className="w-full mt-3 text-xs text-gray-400 py-2 hover:text-cocoa">
                    Cancel
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default ItineraryView;