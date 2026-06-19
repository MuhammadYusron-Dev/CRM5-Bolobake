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
        {/* Left Side: Illustration */}
        <div className="hidden md:flex flex-col w-1/2 bg-white text-slate-800 relative overflow-hidden items-center pt-24 lg:pt-32">
          {/* Logo */}
          <div className="absolute top-8 left-8 flex items-center gap-3 z-30 text-blue-600">
            <ChefHat className="w-8 h-8" />
            <span className="text-2xl font-bold font-serif tracking-wide text-slate-900">Bolobake</span>
          </div>

          {/* Text Content (Layer Belakang) */}
          <div className="text-center max-w-md z-0 px-8 relative">
            <h1 className="text-3xl lg:text-4xl font-black mb-4 tracking-tight text-slate-900 leading-tight">
              Sistem Manajemen <br/><span className="text-blue-600">Terpadu Bolobake</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Pantau analitik, proses pesanan, dan kelola CRM pelanggan Anda dari satu tempat yang efisien.
            </p>
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
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm mt-4 rounded-lg shadow-md transition-all"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : 'Masuk Sekarang'}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Belum punya akun? <Link href="/register" className="text-blue-600 dark:text-cyan-400 hover:underline font-bold">Daftar sekarang</Link>
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
