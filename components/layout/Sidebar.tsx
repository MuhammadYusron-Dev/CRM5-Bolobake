import React, { useState } from 'react';
import { ChefHat, LayoutDashboard, ShoppingCart, Clock, Search, X, ChevronLeft, ChevronRight, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/features/ThemeToggle';

interface SidebarProps {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export function Sidebar({ activeMenu, setActiveMenu, isMobileOpen, setIsMobileOpen }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();

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

          <div className={`bg-secondary/40 rounded-2xl p-2 flex items-center gap-3 transition-all ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm border border-border/50">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col flex-1 overflow-hidden">
                <span className="text-sm font-bold truncate">Toko Demo Eco Soap</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                  <span className="text-xs text-muted-foreground truncate">Admin store</span>
                </div>
              </div>
            )}
            {!isCollapsed && (
              <button className="p-2 hover:bg-background rounded-xl text-muted-foreground transition-colors shrink-0">
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
    </>
  );
}
