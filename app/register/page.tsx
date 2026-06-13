"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Loader2, Lock, User, KeyRound, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Ukuran gambar maksimal 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('secretCode', secretCode);
      if (imageFile) formData.append('image', imageFile);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setSuccess('Akun berhasil dibuat! Mengalihkan ke halaman login...');
        setTimeout(() => router.push('/login'), 2000);
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
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-3xl shadow-xl border border-border">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-3 text-primary">
            <ChefHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-center">Daftar Akun Admin</h1>
          <p className="text-muted-foreground mt-1 text-sm text-center">Buat profil admin Anda untuk mengakses B2B Dashboard Bolobake</p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-6 border border-destructive/20 text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm p-3 rounded-lg mb-6 border border-emerald-500/20 text-center font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          <div className="flex flex-col items-center justify-center mb-4">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden group ${imagePreview ? 'border-primary' : 'border-border hover:border-primary'}`}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <UploadCloud className="w-6 h-6 text-white" />
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground group-hover:text-primary">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-medium text-center leading-tight px-2">Upload Foto<br/>(Opsional)</span>
                </div>
              )}
            </div>
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange} />
          </div>

          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                required
                type="text"
                placeholder="Nama Pengguna (Username)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-10 h-12 bg-secondary/50 border-border"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                required
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 h-12 bg-secondary/50 border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
              <Input 
                required
                type="password"
                placeholder="Kode Verifikasi Rahasia"
                value={secretCode}
                onChange={(e) => setSecretCode(e.target.value)}
                className="pl-10 h-12 bg-amber-500/5 border-amber-500/30 focus-visible:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-muted-foreground px-1">Masukkan kode undangan / rahasia yang diberikan oleh tim manajemen.</p>
          </div>

          <Button 
            type="submit" 
            disabled={loading || !!success}
            className="w-full h-12 font-bold text-base mt-4 shadow-md shadow-primary/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buat Akun Admin'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Sudah punya akun? <Link href="/login" className="text-primary hover:underline font-bold">Kembali ke Login</Link>
        </div>
      </div>
    </div>
  );
}
