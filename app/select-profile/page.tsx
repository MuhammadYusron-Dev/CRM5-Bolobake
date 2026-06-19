"use client";

import React, { useState, useEffect } from 'react';
import { TEAM_PROFILES } from '@/lib/profiles';
import { useRouter } from 'next/navigation';
import { X, Lock, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SelectProfilePage() {
  const [selectedProfile, setSelectedProfile] = useState<typeof TEAM_PROFILES[0] | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Reset PIN when modal opens/closes
  useEffect(() => {
    if (!selectedProfile) {
      setPin('');
      setError('');
    }
  }, [selectedProfile]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/pin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: selectedProfile.id, pin }),
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = '/'; // Hard reload to apply new token and redirect correctly
      } else {
        setError(data.message || 'PIN yang Anda masukkan salah.');
        setPin(''); // Auto clear PIN on error
      }
    } catch (err) {
      setError('Terjadi kesalahan sistem.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col items-center justify-center p-4 selection:bg-primary/30">
      
      {/* Brand */}
      <div className="absolute top-6 left-8 flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
        <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
          <span className="font-serif font-bold text-white text-xl">B</span>
        </div>
        <span className="font-serif text-xl font-bold tracking-tight">Bolobake.</span>
      </div>

      <div className="w-full max-w-5xl mx-auto flex flex-col items-center animate-in fade-in duration-1000 zoom-in-95">
        <h1 className="text-3xl md:text-5xl font-medium mb-12 tracking-tight">Siapa yang sedang bertugas?</h1>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {TEAM_PROFILES.map((profile, index) => (
            <button
              key={profile.id}
              onClick={() => setSelectedProfile(profile)}
              className="group flex flex-col items-center gap-4 transition-all duration-500 animate-float hover:animate-none"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-2xl overflow-hidden shadow-lg ring-4 ring-transparent group-hover:ring-primary/80 group-hover:shadow-[0_0_30px_rgba(90,87,255,0.4)] transition-all duration-500 transform group-hover:-translate-y-2 group-hover:scale-110">
                <img 
                  src={profile.avatar} 
                  alt={profile.name} 
                  className="w-full h-full object-cover bg-slate-800/50 backdrop-blur-sm"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors duration-500"></div>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-slate-300 group-hover:text-white font-medium text-lg md:text-xl transition-colors duration-300">
                  {profile.name}
                </span>
                <span className="text-slate-500 group-hover:text-primary-foreground/80 text-xs md:text-sm transition-colors duration-300 mt-1">
                  {profile.roleTitle}
                </span>
              </div>
            </button>
          ))}
        </div>
        
        <div className="mt-20">
          <button 
            className="border border-slate-600 text-slate-400 hover:text-white hover:border-white px-6 py-2 tracking-widest text-sm uppercase transition-all duration-300"
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              router.push('/login');
            }}
          >
            Ganti Akun Workspace
          </button>
        </div>
      </div>

      {/* PIN Modal */}
      {selectedProfile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-8 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-1"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-md overflow-hidden mb-4 shadow-lg ring-2 ring-white/20">
                <img src={selectedProfile.avatar} alt={selectedProfile.name} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">Hai, {selectedProfile.name}!</h2>
              <p className="text-sm text-slate-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Masukkan PIN akses Anda
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className={`w-full bg-black/40 border ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-white/20 focus:border-white focus:ring-white/20'} rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 outline-none focus:ring-2 transition-all text-center tracking-[0.5em] text-lg font-mono`}
                    placeholder="••••"
                    required
                    disabled={isLoading}
                  />
                </div>
                {error && <p className="text-red-400 text-xs mt-2 text-center font-medium animate-in slide-in-from-top-1">{error}</p>}
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 bg-white hover:bg-slate-200 text-black font-bold text-base rounded-xl transition-all"
                disabled={pin.length < 4 || isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buka Akses'}
              </Button>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}
