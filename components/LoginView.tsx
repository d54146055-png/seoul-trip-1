
import React, { useState } from 'react';
import { loginWithGoogle } from '../services/authService';
import { Compass, Loader2 } from 'lucide-react';

const LoginView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      // Auth state change will be caught by App.tsx
    } catch (err: any) {
      console.error(err);
      setError('Failed to sign in. Please check your connection or configuration.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-cream flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-latte/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-cocoa/10 rounded-full blur-3xl"></div>

      <div className="z-10 text-center space-y-8 animate-[slideDown_0.8s_ease-out]">
        <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-cocoa text-white rounded-[2rem] flex items-center justify-center shadow-2xl rotate-3">
                <Compass size={48} />
            </div>
        </div>

        <div>
            <h1 className="text-4xl font-serif font-bold text-cocoa mb-2">Seoul<span className="text-accent">Mate</span>.</h1>
            <p className="text-latte font-medium tracking-wide">Your Shared Travel Companion</p>
        </div>

        <div className="bg-white/50 backdrop-blur-sm p-6 rounded-3xl border border-sand shadow-sm max-w-xs mx-auto">
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Sync itineraries, split expenses, and explore Seoul together with your friends.
            </p>

            <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full bg-white text-gray-700 font-bold py-4 px-6 rounded-xl shadow-md border border-gray-200 flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-95 disabled:opacity-70"
            >
                {isLoading ? (
                    <Loader2 size={20} className="animate-spin text-cocoa" />
                ) : (
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                )}
                <span>Continue with Google</span>
            </button>
            
            {error && (
                <p className="text-xs text-red-500 mt-4 font-bold">{error}</p>
            )}
        </div>
      </div>
      
      <div className="absolute bottom-8 text-[10px] text-latte uppercase tracking-widest">
          Ready for landing
      </div>
    </div>
  );
};

export default LoginView;
