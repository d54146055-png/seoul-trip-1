import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, Map, Bot, User as UserIcon, Loader2, MapPin } from 'lucide-react';
import { chatWithTravelGuide } from '../services/geminiService';

const ChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Annyeonghaseyo! I\'m your Seoul Mate. Ask me about food, directions, or translations!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Get current location if possible (optional enhancement)
    let location;
    if (navigator.geolocation) {
       try {
         const pos: GeolocationPosition = await new Promise((resolve, reject) => 
            navigator.geolocation.getCurrentPosition(resolve, reject, {timeout: 5000})
         );
         location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
       } catch (e) {
         // ignore location error
       }
    }

    const response = await chatWithTravelGuide(userMsg.text, location);
    
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'model',
      text: response.text || "I couldn't find an answer to that.",
      mapChunks: response.mapChunks
    }]);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
                    {msg.role === 'user' ? <UserIcon size={16} className="text-white"/> : <Bot size={16} className="text-white"/>}
                </div>
                <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                }`}>
                    {msg.text}
                    {/* Render Map Links if available */}
                    {msg.mapChunks && msg.mapChunks.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase flex items-center">
                                <MapPin size={10} className="mr-1"/> Found Places
                            </p>
                            {msg.mapChunks.map((chunk, idx) => (
                                <a 
                                    key={idx} 
                                    href={chunk.source.uri} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="block bg-gray-50 p-2 rounded hover:bg-indigo-50 transition-colors text-indigo-600 text-xs truncate flex items-center"
                                >
                                    <Map size={12} className="mr-2 flex-shrink-0"/>
                                    {chunk.source.title}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
             </div>
          </div>
        ))}
        {loading && (
            <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 ml-10">
                    <Loader2 size={16} className="animate-spin text-emerald-500" />
                    <span className="text-xs text-gray-400">Thinking...</span>
                </div>
            </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 safe-area-bottom">
        <div className="flex gap-2">
            <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask Seoul Mate..."
                className="flex-1 bg-gray-100 text-gray-900 placeholder-gray-400 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
                <Send size={20} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
