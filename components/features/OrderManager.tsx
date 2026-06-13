"use client";

import React, { useState, useMemo, useRef } from 'react';
import { ChefHat, CheckCircle2, ScanLine, Menu, XCircle, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Order, Product, Customer } from '@/lib/types';
import { OrderForm } from './OrderForm';
import { DashboardAnalytics } from './DashboardAnalytics';
import { HistoryTable } from './HistoryTable';
import { Sidebar } from '@/components/layout/Sidebar';
import { DateRangeFilter } from './DateRangeFilter';

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
  
  const [filterStartDate, setFilterStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterEndDate, setFilterEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const undoTimeoutsRef = useRef<Record<number, NodeJS.Timeout>>({});
  const backupOrdersRef = useRef<Record<number, Order>>({});

  const dashboard = useMemo(() => {
    let totalOmset = 0;
    let totalOrders = 0;
    let totalPcs = 0;
    const uniqueCustomers = new Set<string>();
    const variantPerformance: Record<string, { qty: number; omset: number }> = {};
    const customerLeaderboard: Record<string, { freq: number; totalBelanja: number }> = {};

    const parseDateToNumber = (dateStr: string) => {
      if (!dateStr) return 0;
      const match1 = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (match1) return parseInt(`${match1[1]}${match1[2].padStart(2, '0')}${match1[3].padStart(2, '0')}`);
      const match2 = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match2) return parseInt(`${match2[3]}${match2[2].padStart(2, '0')}${match2[1].padStart(2, '0')}`);
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return parseInt(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);
      } catch (e) {}
      return 0;
    };

    const startNum = parseDateToNumber(filterStartDate);
    const endNum = parseDateToNumber(filterEndDate);

    const filteredOrders = orderHistory.filter(order => {
      let orderDate = order.productionDate;
      if (!orderDate) {
        try { orderDate = new Date(order.timestamp).toISOString().split('T')[0]; } catch (e) { orderDate = '2026-01-01'; }
      }
      
      const orderNum = parseDateToNumber(orderDate);
      if (orderNum === 0) return true;
      
      if (startNum > 0 && orderNum < startNum) return false;
      if (endNum > 0 && orderNum > endNum) return false;
      return true;
    });

    totalOrders = filteredOrders.length;
    filteredOrders.forEach(order => {
      totalOmset += order.grandTotal;
      totalPcs += order.totalPcs;
      uniqueCustomers.add(order.customer);

      order.items.forEach(item => {
        if (!variantPerformance[item.sku]) variantPerformance[item.sku] = { qty: 0, omset: 0 };
        variantPerformance[item.sku].qty += Number(item.qty);
        variantPerformance[item.sku].omset += (Number(item.price) * Number(item.qty));
      });

      if (!customerLeaderboard[order.customer]) customerLeaderboard[order.customer] = { freq: 0, totalBelanja: 0 };
      customerLeaderboard[order.customer].freq += 1;
      customerLeaderboard[order.customer].totalBelanja += order.grandTotal;
    });

    return { totalOmset, totalOrders, totalPcs, uniqueCustomers: Array.from(uniqueCustomers), variantPerformance, customerLeaderboard };
  }, [orderHistory, filterStartDate, filterEndDate]);

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
      
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setOrderHistory(data.data);
          }
        } else {
          throw new Error('Fetch failed');
        }
      } catch (fetchErr) {
        // Optimistic fallback
        if (isEdit) {
          setOrderHistory(prev => prev.map(o => o.id === order.id ? order : o));
        } else {
          setOrderHistory(prev => [order, ...prev]);
        }
      }

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

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="relative z-50 flex items-center justify-between mb-4 bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="w-5 h-5 flex items-center justify-center bg-primary/20 text-primary rounded-md">📅</span>
                Periode Produksi
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
          <div className="max-w-7xl mx-auto">
              <HistoryTable 
                orderHistory={orderHistory}
                editingOrderId={editingOrder?.id || null}
                handleEditOrder={(order) => {
                  setEditingOrder(order);
                  setActiveMenu('new_order');
                }}
                handleReorder={handleReorder}
                handleClearAll={handleClearAllOrders}
                filterStartDate={filterStartDate}
                setFilterStartDate={setFilterStartDate}
                filterEndDate={filterEndDate}
                setFilterEndDate={setFilterEndDate}
              />
          </div>
        );
      case 'new_order':
      default:
        return (
          <div className="max-w-5xl mx-auto">
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
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Selamat Pagi, Admin ☀️';
    if (hour >= 12 && hour < 15) return 'Selamat Siang, Admin 🌤️';
    if (hour >= 15 && hour < 19) return 'Selamat Sore, Admin 🌅';
    return 'Selamat Malam, Admin 🌙';
  };

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

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#F9FAFB]">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-8 shrink-0 z-10 shadow-sm md:shadow-none">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              {activeMenu === 'dashboard' && <span className="text-slate-500 text-sm font-medium mb-0.5">{getGreeting()}</span>}
              <h1 className="text-xl font-bold text-foreground">
                {activeMenu === 'dashboard' ? 'Dashboard Analitik' : activeMenu === 'history' ? 'Riwayat Pesanan' : 'Buat Pesanan Baru'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold items-center gap-2 border border-primary/20">
              <span className="relative flex h-2.5 w-2.5 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              System Online
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>

      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && closeConfirmDialog()}>
        <DialogContent className="sm:max-w-md border-destructive/20 shadow-2xl overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-orange-500"></div>
          
          <div className="flex flex-col items-center justify-center pt-8 pb-2 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 ring-8 ring-red-50/50">
              <AlertTriangle className="w-8 h-8 text-red-500 drop-shadow-sm" />
            </div>
            <DialogTitle className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 font-medium px-4 text-sm sm:text-base leading-relaxed">
              {confirmDialog.message}
            </DialogDescription>
          </div>
          
          <DialogFooter className="flex flex-row gap-3 mt-8 p-1 sm:justify-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeConfirmDialog} 
              disabled={isSubmitting}
              className="flex-1 font-bold h-12 text-slate-600 hover:bg-slate-100 hover:text-slate-800 border-slate-200 transition-all rounded-xl"
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
