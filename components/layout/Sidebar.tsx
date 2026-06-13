import React, { useState } from 'react';
import { ChefHat, LayoutDashboard, ShoppingCart, Clock, Search, X, ChevronLeft, ChevronRight, User, LogOut, Settings, Key, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ activeMenu, setActiveMenu, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [user, setUser] = useState<{username: string, avatarUrl: string} | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();

  React.useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setUser(data.user);
          setAvatarPreview(data.user.avatarUrl || '');
        }
      })
      .catch(console.error);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    try {
      const formData = new FormData();
      if (passwordInput) formData.append('password', passwordInput);
      if (avatarFile) formData.append('avatarFile', avatarFile);

      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setIsSettingsOpen(false);
        setPasswordInput('');
        // We do not alert because it's intrusive, we just close dialog and let it visually update
      } else {
        alert(data.message || 'Gagal update profil');
      }
    } catch(e) {
      alert('Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsUpdating(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard Analitik', icon: LayoutDashboard },
    { id: 'new_order', label: 'Buat Pesanan Baru', icon: ShoppingCart },
    { id: 'history', label: 'Riwayat Pesanan', icon: Clock },
    { id: 'catalog', label: 'Katalog Manager', icon: Search, isLink: true, href: '/catalog' },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.isLink && item.href) {
      router.push(item.href);
    } else {
      setActiveMenu(item.id);
    }
    setIsMobileOpen(false);
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={`fixed md:static inset-y-0 left-0 z-50 bg-card border-r border-border flex flex-col transition-all duration-300 ease-in-out shadow-xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'md:w-20' : 'w-64'}`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between h-16 shrink-0">
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}>
            <ChefHat className="w-8 h-8 text-primary flex-shrink-0 drop-shadow-sm" />
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap">
                <span className="font-serif text-xl font-bold leading-tight">Bolobake</span>
                <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">B2B Dashboard</span>
              </div>
            )}
          </div>
          <button className="md:hidden p-1 rounded-md hover:bg-muted" onClick={() => setIsMobileOpen(false)}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 flex flex-col gap-2 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item)}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? 'text-primary-foreground' : 'group-hover:scale-110'}`} />
                {!isCollapsed && <span className="font-semibold text-sm whitespace-nowrap">{item.label}</span>}
              </button>
            )
          })}
        </div>

        <div className="mt-auto px-4 pb-4 flex flex-col gap-4">
          <div className="flex justify-center w-full">
            <ThemeToggle isCollapsed={isCollapsed} />
          </div>

          <div className={`bg-secondary/40 rounded-2xl p-2 flex items-center gap-2 transition-all ${isCollapsed ? 'justify-center flex-col' : ''}`}>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-3 hover:bg-background/50 p-1.5 rounded-xl transition-all flex-1 text-left group"
              title="Pengaturan Profil"
            >
              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm border border-border/50 overflow-hidden group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-sm font-bold truncate group-hover:text-primary transition-colors">{user?.username || 'Admin'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                    <span className="text-xs text-muted-foreground truncate">Admin store</span>
                  </div>
                </div>
              )}
            </button>
            {!isCollapsed && (
              <button onClick={handleLogout} className="p-2 hover:bg-background rounded-xl text-muted-foreground transition-colors shrink-0" title="Keluar">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="hidden md:flex p-4 border-t border-border justify-end shrink-0 h-16 items-center bg-muted/20">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors w-full flex justify-center"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-primary" /> Pengaturan Profil</DialogTitle>
            <DialogDescription>
              Ubah foto profil dan password Anda di sini. Username Anda (<strong className="text-primary">{user?.username}</strong>) bersifat permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-bold flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Foto Profil Baru</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border border-border overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <Input 
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                        setAvatarPreview(URL.createObjectURL(file));
                      }
                    }} 
                    className="cursor-pointer file:cursor-pointer file:text-primary file:font-bold file:border-0 file:bg-transparent"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Pilih gambar dari galeri Anda.</p>
                </div>
              </div>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold flex items-center gap-2"><Key className="w-4 h-4" /> Password Baru</label>
              <Input 
                type="password"
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                placeholder="Biarkan kosong jika tidak ingin mengubah"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Batal</Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
