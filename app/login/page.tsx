"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { FloatingPastry } from '@/components/ui/FloatingPastry';

export default function LoginPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoginView, setIsLoginView] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [agreeTos, setAgreeTos] = useState(false);


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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreeTos) {
      setError('Anda harus menyetujui Terms of Service dan Privacy Policy.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', email);
      formData.append('password', password);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        // Auto login after register
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginData.success) {
          router.push('/');
        } else {
          setIsLoginView(true);
        }
      } else {
        setError(data.message || 'Pendaftaran gagal.');
      }
    } catch (err) {
      setError('Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID"}>
      <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center bg-white/50 font-sans relative overflow-hidden px-4">
        
        {/* Floating Pastries Background */}
        <div className="absolute inset-0 z-0 pointer-events-auto">
           <FloatingPastry src="/assets/pastries/user_croissant.png" size={160} speed={1.5} rotationSpeed={0.5} containerRef={containerRef} />
           <FloatingPastry src="/assets/pastries/user_bagel.png" size={140} speed={1.2} rotationSpeed={-0.4} containerRef={containerRef} />
           <FloatingPastry src="/assets/pastries/user_donut.png" size={130} speed={1.8} rotationSpeed={0.6} containerRef={containerRef} />
           <FloatingPastry src="/assets/pastries/user_croissant.png" size={150} speed={1.1} rotationSpeed={-0.5} containerRef={containerRef} />
           <FloatingPastry src="/assets/pastries/user_bagel.png" size={120} speed={1.4} rotationSpeed={0.3} containerRef={containerRef} />
        </div>

        {/* Logo at Top Left */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 z-30 pointer-events-none">
          <ChefHat className="w-8 h-8 text-brand-green-dark" />
          <span className="text-2xl font-extrabold tracking-tight text-slate-900">Bolobake.</span>
        </div>

        <div className="relative grid place-items-center w-full max-w-4xl mt-12 md:mt-0 pointer-events-none">
          
          {/* Landing Page Content */}
          <div 
            className={`col-start-1 row-start-1 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col items-center text-center z-10 w-full px-4 pointer-events-none
              ${showLoginForm ? 'opacity-0 scale-90 blur-sm translate-y-4' : 'opacity-100 scale-100 blur-0 translate-y-0 delay-150'}`}
          >
            <span className="text-slate-500 font-medium mb-4 tracking-wide text-sm md:text-base">Welcome to Bolobake</span>
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black mb-6 tracking-tight text-slate-900 leading-[1.1]">
              Sistem Manajemen <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green-dark to-brand-green-light">Terpadu Bolobake</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mb-12 select-none">
              Pantau analitik, proses pesanan, dan kelola CRM pelanggan Anda dari satu tempat yang efisien.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-8 md:pb-0 pointer-events-auto">
              <Button 
                onClick={() => setShowLoginForm(true)}
                className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold text-base rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 border-0"
              >
                <ChefHat className="w-5 h-5" />
                Masuk ke Akun
              </Button>
            </div>
          </div>

          {/* Login Form Content */}
          <div 
            className={`col-start-1 row-start-1 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] w-full max-w-[420px] bg-white/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-[0_30px_80px_rgb(0,0,0,0.12)] border border-slate-100/50 flex flex-col z-20 pointer-events-auto
              ${showLoginForm ? 'opacity-100 scale-100 blur-0 translate-y-0 delay-150' : 'opacity-0 scale-90 blur-sm pointer-events-none translate-y-4'}`}
          >
            <button 
              onClick={() => setShowLoginForm(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full outline-none focus:outline-none"
              title="Kembali"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            <div className="text-center mb-8 mt-2 transition-all duration-300">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                {isLoginView ? 'Masuk ke akun' : 'Buat akun baru'}
              </h2>
              <p className="text-slate-500 text-sm">
                {isLoginView ? 'Selamat datang kembali! Masuk untuk melanjutkan' : 'Selamat datang! Isi data Anda untuk mulai'}
              </p>
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
                text={isLoginView ? "signin_with" : "continue_with"}
                shape="rectangular"
              />
            </div>

            <div className="relative flex items-center py-2 mb-6">
              <div className="flex-grow border-t border-slate-100"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">atau</span>
              <div className="flex-grow border-t border-slate-100"></div>
            </div>

            <form onSubmit={isLoginView ? handleLogin : handleRegister} className="space-y-5 transition-all duration-300">
              {!isLoginView && (
                <div className="flex gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-bold text-slate-700">Nama depan</label>
                    <Input 
                      required
                      type="text"
                      placeholder="Nama depan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 rounded-lg border-slate-200 focus-visible:ring-2 focus-visible:ring-brand-green-light/50 focus-visible:border-brand-green-dark transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <label className="text-xs font-bold text-slate-700">Nama belakang</label>
                    <Input 
                      required
                      type="text"
                      placeholder="Nama belakang"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 rounded-lg border-slate-200 focus-visible:ring-2 focus-visible:ring-brand-green-light/50 focus-visible:border-brand-green-dark transition-all outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Alamat email</label>
                <Input 
                  required
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-lg border-slate-200 focus-visible:ring-2 focus-visible:ring-brand-green-light/50 focus-visible:border-brand-green-dark transition-all outline-none"
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
                    className="h-11 rounded-lg border-slate-200 pr-10 focus-visible:ring-2 focus-visible:ring-brand-green-light/50 focus-visible:border-brand-green-dark transition-all outline-none"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 outline-none focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {!isLoginView && (
                <div className="flex items-start gap-2 pt-1 animate-in fade-in duration-500">
                  <input 
                    type="checkbox" 
                    id="tos" 
                    checked={agreeTos}
                    onChange={(e) => setAgreeTos(e.target.checked)}
                    className="mt-1 border-slate-300 rounded text-brand-green-dark focus:ring-brand-green-dark"
                  />
                  <label htmlFor="tos" className="text-xs text-slate-500 leading-snug cursor-pointer">
                    I agree to the <Link href="#" className="underline hover:text-slate-800">Terms of Service</Link> and <Link href="#" className="underline hover:text-slate-800">Privacy Policy</Link>
                  </label>
                </div>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-brand-green-dark hover:bg-brand-green-dark/80 text-white font-bold text-sm mt-4 rounded-xl shadow-md shadow-brand-green-dark/20 transition-all hover:translate-y-[-1px] active:translate-y-[1px] outline-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Memproses...
                  </span>
                ) : (isLoginView ? 'Masuk Sekarang' : 'Buat Akun')}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              {isLoginView ? (
                <>Belum punya akun? <button type="button" onClick={() => setIsLoginView(false)} className="text-brand-green-dark hover:underline font-bold transition-colors">Daftar sekarang</button></>
              ) : (
                <>Sudah punya akun? <button type="button" onClick={() => setIsLoginView(true)} className="text-brand-green-dark hover:underline font-bold transition-colors">Masuk</button></>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-50 flex justify-center items-center">
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
