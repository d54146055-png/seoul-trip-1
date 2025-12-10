import React, { useState, useEffect } from 'react';
import { Upload, MapPin, Navigation, FileText, X } from 'lucide-react';
import { parseLocationsFromText } from '../services/geminiService';
import { ParsedLocation } from '../types';

const MapView: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [locations, setLocations] = useState<ParsedLocation[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);

  // Default center (Seoul City Hall)
  const SEOUL_CENTER = { lat: 37.5665, lng: 126.9780 };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.log("Loc error", err)
      );
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setInputText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    const results = await parseLocationsFromText(inputText);
    setLocations(results);
    setIsProcessing(false);
    setShowInput(false);
  };

  // Helper to normalize coordinates to SVG viewbox (0-100)
  // Simple Equirectangular projection approximation for small area
  const getRelativePosition = (lat: number, lng: number) => {
    // Find bounds
    const allLats = [...locations.map(l => l.lat), SEOUL_CENTER.lat];
    const allLngs = [...locations.map(l => l.lng), SEOUL_CENTER.lng];
    if (userLoc) {
        allLats.push(userLoc.lat);
        allLngs.push(userLoc.lng);
    }

    const minLat = Math.min(...allLats) - 0.02;
    const maxLat = Math.max(...allLats) + 0.02;
    const minLng = Math.min(...allLngs) - 0.02;
    const maxLng = Math.max(...allLngs) + 0.02;

    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    
    return { x, y };
  };

  const openGoogleMaps = (lat: number, lng: number, name: string) => {
    const query = encodeURIComponent(`${name}, Seoul`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}&query_place_id=${lat},${lng}`, '_blank');
  };

  return (
    <div className="pb-24 h-full flex flex-col">
      {/* Input Section */}
      {showInput && (
        <div className="p-4 bg-white/80 backdrop-blur rounded-b-3xl shadow-sm z-10 animate-[slideDown_0.3s]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-cocoa">Import Itinerary</h3>
            {locations.length > 0 && <button onClick={() => setShowInput(false)}><X size={20} className="text-gray-400"/></button>}
          </div>
          
          <textarea
            className="w-full h-32 p-3 bg-sand/30 rounded-xl border border-sand focus:outline-none focus:ring-1 focus:ring-cocoa text-sm mb-3 resize-none"
            placeholder="Paste your itinerary here or upload a file..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <div className="flex gap-3">
             <label className="flex-1 flex items-center justify-center p-3 border border-dashed border-cocoa/30 rounded-xl cursor-pointer hover:bg-sand/20 text-cocoa text-sm font-medium transition-colors">
                <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                <Upload size={16} className="mr-2" /> Upload .txt
             </label>
             <button 
                onClick={handleProcess}
                disabled={isProcessing || !inputText}
                className="flex-1 bg-cocoa text-white rounded-xl font-bold text-sm shadow-md hover:bg-cocoa/90 disabled:opacity-50 flex items-center justify-center"
             >
               {isProcessing ? 'Analyzing...' : 'Map It'}
             </button>
          </div>
        </div>
      )}

      {/* Map Visualization */}
      <div className="flex-1 relative overflow-hidden bg-sand/10">
        {!showInput && (
            <button 
                onClick={() => setShowInput(true)}
                className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full shadow-md text-cocoa"
            >
                <FileText size={20} />
            </button>
        )}

        {locations.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
             <MapPin size={48} className="mb-2" />
             <p>No locations loaded</p>
           </div>
        ) : (
          <div className="w-full h-full relative p-8">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
               {/* Connecting Lines (Simple path suggestion) */}
               <path 
                 d={`M ${locations.map(l => {
                    const pos = getRelativePosition(l.lat, l.lng);
                    return `${pos.x} ${pos.y}`;
                 }).join(' L ')}`}
                 fill="none"
                 stroke="#A1887F"
                 strokeWidth="0.5"
                 strokeDasharray="2 2"
                 className="opacity-50"
               />

               {/* Location Dots */}
               {locations.map((loc, i) => {
                 const pos = getRelativePosition(loc.lat, loc.lng);
                 return (
                   <g key={i} onClick={() => openGoogleMaps(loc.lat, loc.lng, loc.name)} className="cursor-pointer group">
                      <circle cx={pos.x} cy={pos.y} r="3" fill="#8D6E63" className="group-hover:fill-accent transition-colors shadow-lg" />
                      <circle cx={pos.x} cy={pos.y} r="8" fill="#8D6E63" className="opacity-10 animate-pulse" />
                      <text x={pos.x} y={pos.y - 5} textAnchor="middle" fontSize="3" fill="#5D4037" className="font-bold bg-white">{loc.name}</text>
                   </g>
                 );
               })}

               {/* User Location */}
               {userLoc && (
                  <g>
                     <circle cx={getRelativePosition(userLoc.lat, userLoc.lng).x} cy={getRelativePosition(userLoc.lat, userLoc.lng).y} r="2" fill="#3B82F6" />
                     <circle cx={getRelativePosition(userLoc.lat, userLoc.lng).x} cy={getRelativePosition(userLoc.lat, userLoc.lng).y} r="6" fill="#3B82F6" className="opacity-20" />
                  </g>
               )}
            </svg>
            <div className="absolute bottom-4 left-0 w-full text-center text-xs text-gray-400">
               Tap markers to open Google Maps
            </div>
          </div>
        )}
      </div>

      {/* Location List Card */}
      {locations.length > 0 && (
          <div className="bg-white/90 backdrop-blur rounded-t-3xl p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] max-h-48 overflow-y-auto">
             <h4 className="text-sm font-bold text-cocoa mb-3">Identified Places ({locations.length})</h4>
             <div className="space-y-3">
               {locations.map((loc, i) => (
                 <div key={i} className="flex items-center justify-between border-b border-sand pb-2 last:border-0">
                    <div className="flex-1">
                       <p className="font-medium text-cocoa text-sm">{loc.name}</p>
                       <p className="text-[10px] text-gray-500 truncate">{loc.description}</p>
                    </div>
                    <button 
                        onClick={() => openGoogleMaps(loc.lat, loc.lng, loc.name)}
                        className="bg-sand/50 p-2 rounded-full text-cocoa hover:bg-accent hover:text-white transition-colors"
                    >
                        <Navigation size={14} />
                    </button>
                 </div>
               ))}
             </div>
          </div>
      )}
    </div>
  );
};

export default MapView;