"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChefHat, CheckCircle2, ScanLine, Menu, XCircle, RotateCcw, Trash2, AlertTriangle, CalendarRange } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Order, Product, Customer, OrderStatus } from '@/lib/types';
import { OrderForm } from './OrderForm';
import { DashboardAnalytics } from './DashboardAnalytics';
import { HistoryTable } from './HistoryTable';
import { Sidebar } from '@/components/layout/Sidebar';
import { DateRangeFilter } from './DateRangeFilter';
import { SalesTutorial } from './SalesTutorial';
import { CatalogManager } from './CatalogManager';
import { ProductionBoard } from './ProductionBoard';
import { PackingBoard } from './PackingBoard';
import { SampleTracker } from './SampleTracker';
import { SalesCRM } from './SalesCRM';

export function OrderManager({ 
  initialOrders, 
  initialCatalog,
  initialCustomers = []
}: { 
  initialOrders: Order[], 
  initialCatalog: Product[],
  initialCustomers?: Customer[]
}) {
  const [katalog] = useState<Product[]>(initialCatalog);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [orderHistory, setOrderHistory] = useState<Order[]>(initialOrders);
  
  const [activeMenu, setActiveMenu] = useState('new_order');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentDateString, setCurrentDateString] = useState('');
  const [currentHour, setCurrentHour] = useState(12); // Default safe hour for SSR
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const tab = searchParams.get('tab');
      if (tab) {
        setActiveMenu(tab);
        // Clean up URL without triggering navigation
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
      setCurrentDateString(new Intl.DateTimeFormat('id-ID', options).format(now));
      setCurrentHour(now.getHours());
    };
    updateTime();
    
    // Check the time periodically
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel: string;
    onConfirm: (() => Promise<void>) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    actionLabel: '',
    onConfirm: null,
  });

  const closeConfirmDialog = () => {
    if (!isSubmitting) {
      setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    }
  };
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastOptions, setToastOptions] = useState<{show: boolean; message: string; isUndoable?: boolean; onUndo?: () => void}>({show: false, message: ''});
  
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const undoTimeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});
  const backupOrdersRef = useRef<Record<number, Order>>({});

  const dashboard = useMemo(() => {
    let totalOmset = 0;
    let totalOrders = 0;
    let totalPcs = 0;
    const uniqueCustomers = new Set<string>();
    const variantPerformance: Record<string, { qty: number; omset: number }> = {};
    const customerLeaderboard: Record<string, { freq: number; totalBelanja: number }> = {};

    let activeProductionOrders = 0;
    const customerFirstOrderDate: Record<string, string> = {};
    let croissantSales = 0;
    let cakeSales = 0;
    
    const today = new Date();
    // Offset for local timezone roughly, or just use string
    const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);

    orderHistory.forEach(order => {
      const tsStr = String(order.timestamp || '');
      let d = String(order.productionDate || tsStr.split('T')[0] || '');
      
      const custStr = String(order.customer || '');
      if (!customerFirstOrderDate[custStr] || d < customerFirstOrderDate[custStr]) {
        customerFirstOrderDate[custStr] = d;
      }
      if (d >= todayStr) {
        activeProductionOrders++;
      }
    });

    const parseDateToNumber = (dateStr: any) => {
      if (!dateStr) return 0;
      const str = String(dateStr);
      const match1 = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (match1) return parseInt(`${match1[1]}${match1[2].padStart(2, '0')}${match1[3].padStart(2, '0')}`);
      const match2 = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match2) return parseInt(`${match2[3]}${match2[2].padStart(2, '0')}${match2[1].padStart(2, '0')}`);
      try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) return parseInt(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);
      } catch (e) {}
      return 0;
    };

    const startNum = parseDateToNumber(filterStartDate);
    const endNum = parseDateToNumber(filterEndDate);

    const filteredOrders = orderHistory.filter(order => {
      let orderDate = order.productionDate;
      if (!orderDate) {
        try { orderDate = new Date(order.timestamp || '').toISOString().split('T')[0]; } catch (e) { orderDate = '2026-01-01'; }
      }
      
      const orderNum = parseDateToNumber(orderDate);
      if (orderNum === 0) return true;
      
      if (startNum > 0 && orderNum < startNum) return false;
      if (endNum > 0 && orderNum > endNum) return false;
      return true;
    });

    totalOrders = filteredOrders.length;
    filteredOrders.forEach(order => {
      totalOmset += order.grandTotal || 0;
      totalPcs += order.totalPcs || 0;
      const custName = order.customer || 'Unknown';
      uniqueCustomers.add(custName);

      (order.items || []).forEach(item => {
        const sku = item.sku || 'Unknown';
        const qty = Number(item.qty || 0);

        const product = katalog.find(p => p.nama === sku || p.id === sku);
        const category = product?.kategori?.toLowerCase() || 'other';

        if (category.includes('croissant') || category.includes('artisan')) {
           croissantSales += qty;
        } else {
           cakeSales += qty;
        }

        if (!variantPerformance[sku]) variantPerformance[sku] = { qty: 0, omset: 0 };
        variantPerformance[sku].qty += qty;
        variantPerformance[sku].omset += (Number(item.price || 0) * qty);
      });

      if (!customerLeaderboard[custName]) customerLeaderboard[custName] = { freq: 0, totalBelanja: 0 };
      customerLeaderboard[custName].freq += 1;
      customerLeaderboard[custName].totalBelanja += order.grandTotal || 0;
    });

    let newCustomersThisMonth = 0;
    uniqueCustomers.forEach(cust => {
      const firstOrder = customerFirstOrderDate[cust];
      if (firstOrder && typeof firstOrder === 'string' && firstOrder.startsWith(currentMonthStr)) {
        newCustomersThisMonth++;
      }
    });

    let trendText: string | null = null;
    if (filterStartDate && filterStartDate === filterEndDate) {
       const filterDateObj = new Date(filterStartDate);
       filterDateObj.setDate(filterDateObj.getDate() - 1);
       const prevDayStr = filterDateObj.toISOString().split('T')[0];
       
       const prevDayOmset = orderHistory.filter(o => (String(o.productionDate) || String(o.timestamp || '').split('T')[0]) === prevDayStr).reduce((sum, o) => sum + o.grandTotal, 0);
       
       if (prevDayOmset === 0 && totalOmset > 0) {
         trendText = "+100% dari kemarin";
       } else if (prevDayOmset > 0) {
         const diff = ((totalOmset - prevDayOmset) / prevDayOmset) * 100;
         trendText = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% dari kemarin`;
       }
    }

    return { 
      totalOmset, totalOrders, totalPcs, 
      uniqueCustomers: Array.from(uniqueCustomers), 
      variantPerformance, customerLeaderboard,
      trendText, activeProductionOrders, newCustomersThisMonth,
      categorySales: { croissant: croissantSales, cake: cakeSales }
    };
  }, [orderHistory, filterStartDate, filterEndDate, katalog]);

  const showToast = (message: string, isUndoable = false, onUndo?: () => void) => {
    setToastOptions({ show: true, message, isUndoable, onUndo });
    if (!isUndoable) {
      setTimeout(() => setToastOptions(prev => ({...prev, show: false})), 3000);
    }
  };

  const persistOrderToDb = async (order: Order, isEdit: boolean, imageFile?: File | null) => {
    try {
      let body: any;
      let headers: HeadersInit = {};

      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('data', JSON.stringify(order));
        body = formData;
      } else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(order);
      }

      const response = await fetch('/api/orders', {
        method: isEdit ? 'PUT' : 'POST',
        headers,
        body
      });
      if (!response.ok) throw new Error('Failed to save to Sheets');
      
      // Log Action
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'ADMIN', user_name: 'Admin', action_type: isEdit ? 'EDIT_ORDER' : 'CREATE_ORDER', details: JSON.stringify(order) })
      }).catch(e => console.error("Failed to log:", e));

    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan ke Google Sheets. Periksa koneksi internet Anda.');
    }
  };

  const handleSaveOrder = async (order: Order, imageFile?: File | null) => {
    setIsSubmitting(true);
    
    const isEdit = !!order.rowNumber;
    
    try {
      await persistOrderToDb(order, isEdit, imageFile);
      
      // Optimistic update so UI is fast
      if (isEdit) {
        setOrderHistory(prev => prev.map(o => o.id === order.id ? order : o));
      } else {
        setOrderHistory(prev => [order, ...prev]);
      }

      // Background sync
      fetch('/api/orders').then(res => res.json()).then(data => {
        if (data.success && data.data) setOrderHistory(data.data);
      }).catch(console.error);

      setEditingOrder(null);
      showToast(isEdit ? 'Pesanan berhasil diperbarui di server!' : 'Pesanan berhasil dikirim ke Dapur & Sheet!');
    } catch (error) {
      console.error("Save failed", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReorder = (order: Order) => {
    const duplicatedOrder = {
      ...order,
      id: Date.now(),
      productionDate: '', // Clear date
      deliveryDate: '', // Clear date
      rowNumber: undefined,
    };
    setEditingOrder(duplicatedOrder);
    setActiveMenu('new_order');
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!order.rowNumber) return;
    
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Pesanan?',
      message: `Tindakan ini akan menghapus pesanan ${order.customer} secara permanen dari sistem dan Google Sheets.`,
      actionLabel: 'Hapus Permanen',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const response = await fetch(`/api/orders?rowNumber=${order.rowNumber}`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to delete from Sheets');
          
          setOrderHistory(prev => prev.filter(o => o.id !== order.id));
          setEditingOrder(null);
          setActiveMenu('history');
          showToast('Pesanan berhasil dihapus!');
          closeConfirmDialog();
        } catch (err) {
          console.error(err);
          alert('Gagal menghapus pesanan.');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleClearAllOrders = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Kosongkan Semua Riwayat?',
      message: 'PERINGATAN KRITIS: Anda akan menghapus SEMUA pesanan dari sistem secara permanen. Tindakan ini TIDAK DAPAT DIBATALKAN!',
      actionLabel: 'Ya, Kosongkan Semua',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          const response = await fetch(`/api/orders?clearAll=true`, {
            method: 'DELETE',
          });
          if (!response.ok) throw new Error('Failed to clear all orders');
          
          setOrderHistory([]);
          showToast('Semua pesanan berhasil dihapus!');
          closeConfirmDialog();
        } catch (err) {
          console.error(err);
          alert('Gagal menghapus semua pesanan.');
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    const orderIndex = orderHistory.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    const order = orderHistory[orderIndex];
    
    // Optimistic Update
    setOrderHistory(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    try {
      const response = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowNumber: order.rowNumber, status: newStatus })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error);
      }
      
      // Update with precise server timestamps
      if (data.data?.timestamps) {
         setOrderHistory(prev => prev.map(o => {
           if (o.id === orderId) {
             return { ...o, status: newStatus, statusTimestamps: {
               dikonfirmasi: data.data.timestamps[0],
               produksi: data.data.timestamps[1],
               packing: data.data.timestamps[2],
               delivery: data.data.timestamps[3],
               diterima: data.data.timestamps[4],
             }};
           }
           return o;
         }));
      }

      showToast(`Status diperbarui: ${newStatus}`);
    } catch (err) {
      console.error(err);
      // Revert if failed
      setOrderHistory(prev => prev.map(o => o.id === orderId ? { ...o, status: order.status } : o));
      alert('Gagal memperbarui status');
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="w-full mx-auto space-y-4">
            <div className="relative z-50 flex items-center justify-between mb-4 bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-sm font-semibold">
                <div className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary rounded-lg border border-primary/20 shadow-sm">
                  <CalendarRange className="w-4 h-4" />
                </div>
                <span className="text-foreground/90 tracking-tight">Periode Produksi</span>
              </div>
              <DateRangeFilter 
                filterStartDate={filterStartDate}
                setFilterStartDate={setFilterStartDate}
                filterEndDate={filterEndDate}
                setFilterEndDate={setFilterEndDate}
              />
            </div>
            <DashboardAnalytics dashboard={dashboard} isLoading={false} error={null} />
          </div>
        );
      case 'history':
        return (
          <div className="w-full mx-auto">
              <HistoryTable 
                orderHistory={orderHistory}
                editingOrderId={editingOrder?.id || null}
                handleEditOrder={(order) => {
                  setEditingOrder(order);
                  setActiveMenu('new_order');
                }}
                handleReorder={handleReorder}
                handleClearAll={handleClearAllOrders}
                handleUpdateStatus={handleUpdateStatus}
                filterStartDate={filterStartDate}
                setFilterStartDate={setFilterStartDate}
                filterEndDate={filterEndDate}
                setFilterEndDate={setFilterEndDate}
              />
          </div>
        );
      case 'catalog':
        return <CatalogManager />;
      case 'produksi':
        return <ProductionBoard initialOrders={orderHistory} />;
      case 'packing':
        return <PackingBoard initialOrders={orderHistory} />;
      case 'samples':
        return <SampleTracker initialOrders={orderHistory} initialCatalog={katalog} />;
      case 'sales':
        return <SalesCRM initialOrders={orderHistory} />;
      case 'new_order':
      default:
        return (
          <div className="w-full mx-auto">
              <OrderForm 
                katalog={katalog}
                customers={customers}
                orderToEdit={editingOrder} 
                onSave={handleSaveOrder} 
                onDelete={handleDeleteOrder}
                onCancelEdit={() => {
                  setEditingOrder(null);
                  setActiveMenu('history');
                }} 
                isSubmitting={isSubmitting} 
              />
          </div>
        );
    }
  };

  const getGreeting = () => {
    if (currentHour >= 5 && currentHour < 12) return 'Selamat Pagi, Admin ☀️';
    if (currentHour >= 12 && currentHour < 15) return 'Selamat Siang, Admin 🌤️';
    if (currentHour >= 15 && currentHour < 18) return 'Selamat Sore, Admin 🌅';
    if (currentHour >= 18 && currentHour < 19) return 'Selamat Petang, Admin 🌇';
    return 'Selamat Malam, Admin 🌙';
  };

  const headerTextColor = 'text-foreground';
  const subTextColor = 'text-muted-foreground';
  const menuIconColor = 'text-foreground hover:bg-accent';

  return (
    <div className="flex h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-hidden relative">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 transform ${toastOptions.show ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <div className="bg-foreground text-background px-6 py-3 rounded-full shadow-2xl flex items-center gap-4">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">{toastOptions.message}</span>
          {toastOptions.isUndoable && (
            <button onClick={toastOptions.onUndo} className="flex items-center gap-1 text-xs font-bold text-black bg-primary px-3 py-1.5 rounded-full hover:bg-primary/90 transition-colors ml-2">
              <RotateCcw className="w-3.5 h-3.5" />
              BATALKAN (UNDO)
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-transparent relative z-10">
        <header className="relative h-16 flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 shadow-sm md:shadow-none bg-card border-b border-border">

          {/* Left Content */}
          <div className="relative z-10 flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden p-2 -ml-2 rounded-lg transition-colors ${menuIconColor}`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <h1 className={`text-lg sm:text-xl font-medium transition-colors duration-1000 ${headerTextColor}`}>
                {activeMenu === 'dashboard' ? 'Dashboard' : 
                 activeMenu === 'history' ? 'Riwayat Pesanan' : 
                 activeMenu === 'catalog' ? 'Katalog Manager' :
                 activeMenu === 'produksi' ? 'Divisi Produksi' :
                 activeMenu === 'packing' ? 'Divisi Packing' :
                 activeMenu === 'samples' ? 'Tracking Sample' :
                 activeMenu === 'sales' ? 'Sales CRM' :
                 'Buat Pesanan Baru'}
              </h1>
              {activeMenu === 'dashboard' && currentDateString && (
                <span className={`text-xs mt-0 transition-colors duration-1000 ${subTextColor}`}>{currentDateString}</span>
              )}
            </div>
          </div>

          {/* Middle Content - Centered Greeting */}
          <div className="absolute left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center justify-center pointer-events-none">
            {activeMenu === 'dashboard' && isMounted && (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-accent/50 text-foreground">
                {getGreeting()}
              </span>
            )}
          </div>
          
          {/* Right Content */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="hidden sm:flex px-3 py-1.5 rounded-full text-[11px] font-medium items-center gap-1.5 border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              <span className="relative flex h-2 w-2 mr-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System Online
            </div>
            <SalesTutorial />
          </div>
        </header>

        <div className={`flex-1 overflow-y-auto relative z-0 ${['dashboard', 'history', 'new_order', 'sales', 'samples', 'catalog'].includes(activeMenu) ? 'p-4 sm:p-6 lg:p-8' : ''}`}>
          {renderContent()}
        </div>
      </main>

      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <DialogContent className="sm:max-w-md border-destructive/20 shadow-2xl overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500"></div>
          
          <div className="flex flex-col items-center justify-center pt-8 pb-2 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-full flex items-center justify-center mb-5 ring-8 ring-red-50/50 dark:ring-red-900/20">
              <AlertTriangle className="w-8 h-8 text-red-500 drop-shadow-sm" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium px-4 text-sm sm:text-base leading-relaxed">
              {confirmDialog.message}
            </DialogDescription>
          </div>
          
          <DialogFooter className="flex flex-row gap-3 mt-8 p-1 sm:justify-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeConfirmDialog} 
              disabled={isSubmitting}
              className="flex-1 font-bold h-12 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 border-slate-200 dark:border-slate-700 transition-all rounded-xl"
            >
              Batal
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={() => confirmDialog.onConfirm?.()} 
              disabled={isSubmitting}
              className="flex-1 font-bold h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] transition-all rounded-xl"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Memproses...
                </span>
              ) : confirmDialog.actionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
