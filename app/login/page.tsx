"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Loader2, Eye, EyeOff } from 'lucide-react';
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
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
        {/* Left Side: Orange Banner */}
        <div className="hidden md:flex flex-col w-1/2 bg-gradient-to-tr from-[#e65c00] to-[#ff9100] text-white p-8 lg:p-16 justify-between relative overflow-hidden">
          {/* Logo */}
          <div className="flex items-center gap-3 z-10">
            <ChefHat className="w-8 h-8" />
            <span className="text-2xl font-bold font-serif tracking-wide">Bolobake</span>
          </div>

          {/* Center Content */}
          <div className="flex flex-col items-center text-center mt-12 mb-auto z-10 max-w-lg mx-auto">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">Analytics Mendalam</h1>
            <p className="text-white/90 mb-12 text-sm lg:text-base">
              Dapatkan analitik mendalam untuk pesanan B2B Anda atau secara keseluruhan bisnis Bolobake Anda.
            </p>

            {/* Dashboard Mockup Representation */}
            <div className="w-full bg-white/95 rounded-2xl p-4 shadow-2xl text-slate-800">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <span className="font-bold text-sm">Analytics Mendalam</span>
                <div className="flex gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded">Daily</span>
                  <span>Weekly</span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-32 mb-4 w-full">
                {[40, 60, 45, 75, 55, 80, 65].map((h, i) => (
                  <div key={i} className="flex-1 bg-orange-400 rounded-sm" style={{ height: `${h}%` }}></div>
                ))}
              </div>
              <div className="flex justify-between items-center text-xs text-slate-500 mb-4 px-2">
                <span>Jan</span>
                <span>Mar</span>
                <span>May</span>
                <span>Jul</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-purple-50 text-purple-700 p-2 rounded-lg text-center font-bold">3.2%</div>
                <div className="bg-orange-50 text-orange-700 p-2 rounded-lg text-center font-bold">1,234</div>
                <div className="bg-green-50 text-green-700 p-2 rounded-lg text-center font-bold">250K</div>
                <div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-center font-bold">2.1%</div>
              </div>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center items-center gap-4 z-10 mt-8">
            <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">&lt;</button>
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-white"></span>
              <span className="w-2 h-2 rounded-full bg-white/50"></span>
              <span className="w-2 h-2 rounded-full bg-white/50"></span>
              <span className="w-2 h-2 rounded-full bg-white/50"></span>
            </div>
            <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">&gt;</button>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8 relative bg-slate-50">
          <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
            
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
                  className="h-11 rounded-lg border-slate-300 focus-visible:ring-1 focus-visible:ring-orange-500"
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
                    className="h-11 rounded-lg border-slate-300 pr-10 focus-visible:ring-1 focus-visible:ring-orange-500"
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
                className="w-full h-11 bg-[#ea580c] hover:bg-[#c2410c] text-white font-bold text-sm mt-4 rounded-lg shadow-md transition-colors"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Masuk ‣'}
              </Button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500 font-medium">
              Belum punya akun? <Link href="/register" className="text-[#ea580c] hover:underline font-bold">Daftar sekarang</Link>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-center items-center">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                Secured by <ChefHat className="w-3 h-3" /> Bolobake
              </span>
            </div>
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  );
}
