"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);


  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      });
      const data = await res.json();
      if (data.success) {
        router.push('/');
      } else {
        setError(data.message || 'Login Google gagal.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan saat verifikasi Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (data.success) {
        router.push('/');
      } else {
        setError(data.message || 'Login gagal.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID"}>
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans relative overflow-hidden px-4">
        
        {/* Logo at Top Left */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 z-30 text-blue-600">
          <ChefHat className="w-8 h-8" />
          <span className="text-2xl font-bold font-serif tracking-wide text-slate-900">Bolobake</span>
        </div>

        {!showLoginForm ? (
          <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-4xl z-10">
            <span className="text-slate-500 font-medium mb-4 tracking-wide text-sm md:text-base">Welcome to Bolobake</span>
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
              Sistem Manajemen <br className="hidden md:block" />
              <span className="text-blue-600">Terpadu Bolobake</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mb-12">
              Pantau analitik, proses pesanan, dan kelola CRM pelanggan Anda dari satu tempat yang efisien.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button 
                onClick={() => setShowLoginForm(true)}
                className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-full shadow-lg transition-all hover:scale-105 flex items-center gap-2"
              >
                <ChefHat className="w-5 h-5" />
                Masuk ke Akun
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-500 z-10 relative">
            <button 
              onClick={() => setShowLoginForm(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
              title="Kembali"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Masuk ke akun</h2>
              <p className="text-slate-500 text-sm">Selamat datang kembali! Masuk untuk melanjutkan</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 border border-red-100 text-center font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Google Login Gagal.')}
                useOneTap
                theme="outline"
                text="signin_with"
                shape="rectangular"
              />
            </div>

            <div className="relative flex items-center py-2 mb-6">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">atau</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Alamat email</label>
                <Input 
                  required
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg border-slate-300 focus-visible:ring-1 focus-visible:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kata sandi</label>
                <div className="relative">
                  <Input 
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan kata sandi Anda"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 rounded-lg border-slate-300 pr-10 focus-visible:ring-1 focus-visible:ring-blue-500"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm mt-4 rounded-lg shadow-md transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : 'Masuk Sekarang'}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              Belum punya akun? <Link href="/register" className="text-blue-600 hover:underline font-bold">Daftar sekarang</Link>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center items-center">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                Secured by <ChefHat className="w-3 h-3" /> Bolobake
              </span>
            </div>
          </div>
        )}
      </div>
    </GoogleOAuthProvider>
  );
}
