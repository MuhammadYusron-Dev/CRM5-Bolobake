"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Loader2, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTos, setAgreeTos] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { 
      img: "/login_slides/slide1.png", 
      title: "Dashboard Analitik", 
      desc: "Pantau Total Omzet, Jumlah Transaksi, Total Produk, Customer Aktif, Performa Varian Terlaris, dan Top Customer secara real-time."
    },
    { 
      img: "/login_slides/slide2.png", 
      title: "Buat Pesanan Baru", 
      desc: "Proses pesanan kilat menggunakan Smart Text Parser AI (Gemini) dari chat pembeli, lengkapi Informasi Customer dan Detail Pesanan."
    },
    { 
      img: "/login_slides/slide3.png", 
      title: "Sales CRM", 
      desc: "Pantau klasifikasi customer (Champions, Loyal, At Risk, Hibernating), dan gunakan Editor Pesan untuk Smart Broadcast ke Daftar Antrian."
    },
    { 
      img: "/login_slides/slide4.png", 
      title: "Tracking Sample", 
      desc: "Analisis efektivitas sampel produk lewat Tingkat Konversi (ROI), Avg Time-to-Convert, Budget Terpakai, dan Top 5 Customer vs CLV."
    },
  ];
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
          router.push('/login');
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
      <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 font-sans">
        {/* Left Side: Blue Banner */}
        <div className="hidden md:flex flex-col w-1/2 bg-gradient-to-tr from-blue-700 to-cyan-500 text-white p-8 lg:p-12 relative overflow-hidden">
          {/* Logo */}
          <div className="absolute top-8 left-8 flex items-center gap-3 z-20">
            <ChefHat className="w-8 h-8" />
            <span className="text-2xl font-bold font-serif tracking-wide">Bolobake</span>
          </div>

          {/* Center Content: Title, Subtitle, and Carousel Image */}
          <div className="flex-1 flex flex-col justify-center items-start w-full z-10 pt-16 pb-8 px-4 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 tracking-tight drop-shadow-md transition-opacity duration-500">
              {slides[currentSlide].title}
            </h1>
            <p className="text-base lg:text-lg text-white/90 font-medium mb-12 max-w-xl leading-relaxed transition-opacity duration-500">
              {slides[currentSlide].desc}
            </p>

            {/* Float Mockup Container Without Frame */}
            <div className="w-full relative mt-4 perspective-1000">
              <div className="w-full relative">
                {slides.map((slide, i) => (
                  <div
                    key={i}
                    className={`transition-all duration-1000 ease-out ${i === currentSlide ? 'opacity-100 z-10 translate-y-0 scale-100 relative' : 'opacity-0 z-0 translate-y-8 scale-95 absolute inset-0'}`}
                  >
                    <img 
                      src={slide.img} 
                      alt={slide.title} 
                      className="w-full h-auto object-contain rounded-xl shadow-2xl animate-float border border-white/10" 
                      style={{ 
                        transform: 'translateZ(0)', 
                        willChange: 'transform' 
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Carousel Indicators */}
          <div className="flex justify-center items-center gap-6 z-20 mt-auto">
            <button 
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-md text-slate-800"
              aria-label="Previous slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-2.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/70'}`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button 
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-md text-slate-800"
              aria-label="Next slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-4 sm:p-8 relative bg-slate-50">
          <div className="w-full max-w-[420px] bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Buat akun baru</h2>
              <p className="text-slate-500 text-sm">Selamat datang! Isi data Anda untuk mulai</p>
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
                text="continue_with"
                shape="rectangular"
              />
            </div>

            <div className="relative flex items-center py-2 mb-6">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">atau</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label className="text-xs font-bold text-slate-700">Nama depan</label>
                  <Input 
                    required
                    type="text"
                    placeholder="Nama depan"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-11 rounded-lg border-slate-300 focus-visible:ring-1 focus-visible:ring-orange-500"
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
                    className="h-11 rounded-lg border-slate-300 focus-visible:ring-1 focus-visible:ring-orange-500"
                  />
                </div>
              </div>

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

              <div className="flex items-start gap-2 pt-1">
                <input 
                  type="checkbox" 
                  id="tos" 
                  checked={agreeTos}
                  onChange={(e) => setAgreeTos(e.target.checked)}
                  className="mt-1 border-slate-300 rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="tos" className="text-xs text-slate-500 leading-snug cursor-pointer">
                  I agree to the <Link href="#" className="underline hover:text-slate-800">Terms of Service</Link> and <Link href="#" className="underline hover:text-slate-800">Privacy Policy</Link>
                </label>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-sm mt-2 rounded-lg shadow-md transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat Akun'}
              </Button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-500 font-medium">
              Sudah punya akun? <Link href="/login" className="text-blue-600 dark:text-cyan-400 hover:underline font-bold">Masuk</Link>
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
