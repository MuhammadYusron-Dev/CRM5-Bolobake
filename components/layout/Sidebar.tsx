import React, { useState } from 'react';
import { ChefHat, LayoutDashboard, ShoppingCart, Clock, Search, X, ChevronLeft, ChevronRight, User, LogOut, Pencil, PackageCheck, Gift, BarChart3, PackageSearch, Factory, ShieldAlert } from 'lucide-react';
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
  const [user, setUser] = useState<{username: string, avatarUrl: string, email?: string, fullName?: string, role?: string} | null>(null);
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

  const menuGroups = [
    {
      title: 'DASHBOARD',
      items: [
        { id: 'dashboard', label: 'Dashboard Analitik', icon: LayoutDashboard },
        { id: 'sales', label: 'Sales CRM', icon: BarChart3 },
        { id: 'samples', label: 'Tracking Sample', icon: Gift },
        { id: 'catalog', label: 'Katalog Manager', icon: Search },
      ]
    },
    {
      title: 'PESANAN',
      items: [
        { id: 'new_order', label: 'Buat Pesanan Baru', icon: ShoppingCart },
        { id: 'history', label: 'Riwayat Pesanan', icon: Clock },
      ]
    },
    {
      title: 'MANAJEMEN',
      items: [
        { id: 'produksi', label: 'Divisi Produksi', icon: ChefHat },
        { id: 'packing', label: 'Divisi Packing', icon: PackageCheck },
        { id: 'audit', label: 'Audit Logs', icon: ShieldAlert },
        ...(user?.role === 'SUPER_ADMIN' ? [{ id: 'users', label: 'Manajemen Pengguna', icon: User }] : [])
      ]
    },
    {
      title: 'INVENTORY & PRODUKSI',
      items: [
        { id: 'inventory', label: 'Inventory Center', icon: PackageSearch },
      ]
    }
  ];

  const handleMenuClick = (item: { id: string }) => {
    if (['inventory', 'audit'].includes(item.id)) {
      if (item.id === 'inventory') router.push('/inventory');
      if (item.id === 'audit') router.push('/audit');
      if (item.id === 'production') router.push('/production');
    } else {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        router.push(`/?tab=${item.id}`);
      } else {
        setActiveMenu(item.id);
      }
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
        className={`fixed md:static inset-y-0 left-0 z-50 bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white flex flex-col transition-all duration-300 ease-in-out shadow-xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
      >
        <div className="p-4 flex items-center h-16 shrink-0 mt-2">
          <div className="flex items-center overflow-hidden w-full px-2">
            <ChefHat className={`w-8 h-8 text-white flex-shrink-0 drop-shadow-sm transition-all duration-300 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
            <div className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
              <span className="font-serif font-bold leading-tight" style={{ fontSize: 'var(--text-2xl)' }}>Bolobake</span>
              <span className="text-white/60 tracking-widest font-bold uppercase mt-0.5" style={{ fontSize: 'var(--text-3xs)' }}>Powered by Yusron</span>
            </div>
          </div>
          <button className="md:hidden p-1 rounded-md hover:bg-white/20" onClick={() => setIsMobileOpen(false)}>
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-6 px-0 custom-scrollbar min-h-0">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col gap-1">
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-8 opacity-100'}`}>
                <span className="uppercase font-bold text-white/70 tracking-widest px-6 block whitespace-nowrap" style={{ fontSize: 'var(--text-3xs)' }}>
                  {group.title}
                </span>
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item)}
                    title={isCollapsed ? item.label : undefined}
                    className={`flex items-center py-2.5 transition-all duration-300 group ${
                      isActive 
                        ? 'bg-white/20 text-white font-bold border-l-4 border-white border-r-4 border-r-transparent' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white border-l-4 border-transparent border-r-4 border-r-transparent'
                    } ${isCollapsed ? 'justify-center px-0' : 'px-5'}`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? 'text-white' : 'group-hover:scale-110'}`} />
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`} style={{ fontSize: 'var(--text-sm)' }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="mt-auto px-4 pb-4 flex flex-col gap-4 shrink-0">
          <div className="flex justify-center w-full">
            <ThemeToggle isCollapsed={isCollapsed} />
          </div>

          <div className={`flex items-center transition-all duration-300 ease-in-out w-full gap-1 ${isCollapsed ? 'flex-col justify-center' : ''}`}>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex-1 flex items-center hover:bg-white/10 p-2 rounded-xl transition-all min-w-0 text-left group"
              title="Pengaturan Profil"
            >
              <div className={`w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-sm border border-white/20 overflow-hidden transition-all duration-300 ${isCollapsed ? 'mx-auto' : ''}`}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">{user?.username?.[0]?.toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'opacity-100 ml-3'}`}>
                <span className="font-bold truncate leading-tight block" style={{ fontSize: 'var(--text-sm)' }}>{user?.fullName || user?.username || 'Admin'}</span>
                <span className="text-white/90 truncate leading-tight block mt-0.5" style={{ fontSize: 'var(--text-3xs)' }}>{user?.email || user?.username}</span>
                <div className="flex items-center mt-1.5">
                  <span className="bg-white/20 px-2 py-0.5 rounded-md font-medium text-white shadow-sm shrink-0" style={{ fontSize: 'var(--text-3xs)' }}>{user?.role || 'ADMIN'}</span>
                </div>
              </div>
            </button>
            <div className={`overflow-hidden shrink-0 flex items-center transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 max-h-0' : 'max-w-[40px] opacity-100'}`}>
              <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-xl text-white hover:text-white transition-colors shrink-0 flex items-center justify-center" title="Keluar">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="hidden md:flex p-3 border-t border-white/10 justify-end shrink-0 items-center">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors w-full flex justify-center"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[360px] p-0 overflow-hidden border-0 rounded-[2rem] bg-background gap-0 shadow-2xl">
          <DialogTitle className="sr-only">Pengaturan Profil</DialogTitle>
          <DialogDescription className="sr-only">Formulir pengaturan foto profil dan password.</DialogDescription>
          <div className="bg-primary pt-12 pb-10 flex flex-col items-center relative">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-muted shadow-md">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-full h-full p-4 text-muted-foreground" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-background p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <Pencil className="w-4 h-4 text-primary" />
                <Input 
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }} 
                />
              </label>
            </div>
            <h2 className="text-primary-foreground font-bold text-xl mt-4">{user?.username}</h2>
            <p className="text-primary-foreground/80 text-sm font-medium">Admin store</p>
          </div>
          
          <div className="bg-background px-8 pb-8 pt-8 -mt-6 rounded-t-3xl relative z-10 flex flex-col gap-5">
            <div className="grid gap-2">
              <label className="text-xs font-bold text-foreground/70 ml-1 uppercase tracking-wider">Username</label>
              <Input 
                value={user?.username} 
                disabled 
                className="bg-muted/50 border-0 rounded-2xl h-14 font-medium text-muted-foreground cursor-not-allowed px-4" 
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold text-foreground/70 ml-1 uppercase tracking-wider">Password Baru</label>
              <Input 
                type="password"
                value={passwordInput} 
                onChange={e => setPasswordInput(e.target.value)} 
                placeholder="Kosongkan jika tidak diubah"
                className="bg-muted/50 border-0 rounded-2xl h-14 font-medium px-4 focus-visible:ring-1 focus-visible:ring-primary"
              />
            </div>

            <Button 
              onClick={handleUpdateProfile} 
              disabled={isUpdating}
              className="w-full rounded-full h-14 mt-4 text-base font-bold shadow-xl shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5"
            >
              {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
