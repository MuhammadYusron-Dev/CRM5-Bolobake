import React, { useState } from 'react';
import { ChefHat, LayoutDashboard, ShoppingCart, Clock, Search, X, ChevronLeft, ChevronRight, User, LogOut, Pencil, PackageCheck, Gift, BarChart3, PackageSearch, Factory, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { hasAccess } from '@/lib/rbac';

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
  const [isAccessDeniedOpen, setIsAccessDeniedOpen] = useState(false);
  const router = useRouter();

  const getRoleDisplayName = (role?: string) => {
    if (!role) return 'User Profile';
    switch (role) {
      case 'SYSTEM_ADMIN': return 'Developer & Admin';
      case 'OWNER': return 'Owner / Management';
      case 'ADMIN': return 'Admin Sales';
      case 'PRODUCTION': return 'Divisi Produksi';
      case 'PACKING': return 'Divisi Packing';
      case 'DELIVERY': return 'Logistik & Pengiriman';
      default: return role.replace('_', ' ');
    }
  };

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
        ...(user?.role === 'SYSTEM_ADMIN' || user?.role === 'OWNER' ? [{ id: 'users', label: 'Manajemen Pengguna', icon: User }] : [])
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
    if (user && !hasAccess(user.role || 'ADMIN', item.id)) {
      setIsAccessDeniedOpen(true);
      return;
    }

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
        className={`fixed md:static inset-y-0 left-0 z-50 bg-background md:bg-transparent border-r border-border/50 md:border-0 flex flex-col h-full min-h-0 transition-all duration-300 ease-in-out shadow-xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
        style={{ width: isCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)' }}
      >
        <div className="p-4 flex items-center h-16 shrink-0 mt-4 md:mt-6 mb-2">
          <div className="flex items-center overflow-hidden w-full px-2">
            <ChefHat className={`w-8 h-8 text-indigo-500 flex-shrink-0 transition-all duration-300 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
            <div className={`flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}`}>
              <span className="font-sans font-extrabold leading-tight tracking-tight text-slate-900" style={{ fontSize: 'var(--text-xl)' }}>Bolobake.</span>
            </div>
          </div>
          <button className="md:hidden p-1 rounded-md hover:bg-slate-100 text-slate-500" onClick={() => setIsMobileOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-6 px-4 custom-scrollbar min-h-0">
          {menuGroups.map((group, gIdx) => (
            <div key={gIdx} className="flex flex-col gap-1.5">
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-8 opacity-100'}`}>
                <span className="uppercase font-bold text-slate-400 tracking-wider px-4 block whitespace-nowrap" style={{ fontSize: 'var(--text-3xs)' }}>
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
                    className={`flex items-center py-3 rounded-2xl transition-all duration-300 group relative ${
                      isActive 
                        ? 'bg-white text-slate-900 font-bold shadow-[0_8px_20px_rgba(0,0,0,0.04)]' 
                        : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
                    } ${isCollapsed ? 'justify-center px-0' : 'px-4'}`}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ${isActive ? 'text-primary' : 'group-hover:scale-110'}`} />
                    <span className={`whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'max-w-[200px] opacity-100 ml-3'}`} style={{ fontSize: 'var(--text-sm)' }}>
                      {item.label}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="mt-auto px-6 pb-6 flex flex-col gap-4 shrink-0">

          <div className={`flex items-center transition-all duration-300 ease-in-out w-full gap-2 ${isCollapsed ? 'flex-col justify-center' : ''}`}>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex-1 flex items-center hover:bg-white/50 p-2 rounded-2xl transition-all min-w-0 text-left group"
              title="Pengaturan Profil"
            >
              <div className={`w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${isCollapsed ? 'mx-auto' : ''}`}>
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-600 font-bold text-lg">{user?.username?.[0]?.toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-hidden ${isCollapsed ? 'max-w-0 opacity-0 ml-0' : 'opacity-100 ml-3'}`}>
                <span className="font-bold text-slate-900 truncate leading-tight block" style={{ fontSize: 'var(--text-sm)' }}>{user?.fullName || user?.username || 'Admin'}</span>
                <span className="text-slate-500 truncate leading-tight block mt-0.5" style={{ fontSize: 'var(--text-3xs)' }}>
                  {getRoleDisplayName(user?.role)}
                </span>
              </div>
            </button>
            <div className={`overflow-hidden shrink-0 flex items-center transition-all duration-300 ease-in-out ${isCollapsed ? 'max-w-0 opacity-0 max-h-0' : 'max-w-[40px] opacity-100'}`}>
              <button onClick={handleLogout} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-800 transition-colors shrink-0 flex items-center justify-center" title="Keluar">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="hidden md:flex p-3 justify-end shrink-0 items-center">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors w-full flex justify-center"
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
            <p className="text-primary-foreground/80 text-sm font-medium">{getRoleDisplayName(user?.role)}</p>
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

      {/* Access Denied Dialog */}
      <Dialog open={isAccessDeniedOpen} onOpenChange={setIsAccessDeniedOpen}>
        <DialogContent className="sm:max-w-md border-destructive/20 shadow-2xl overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500"></div>
          <div className="flex flex-col items-center justify-center pt-8 pb-4 text-center px-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-red-50/50">
               <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
              Akses Ditolak
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium text-sm sm:text-base leading-relaxed">
              Ini bukan halaman job desk Anda. Silakan kembali ke halaman yang sesuai dengan peran Anda.
            </DialogDescription>
          </div>
          <DialogFooter className="flex justify-center mt-2 pb-2">
            <Button onClick={() => setIsAccessDeniedOpen(false)} className="px-8 font-bold rounded-xl h-12">
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
