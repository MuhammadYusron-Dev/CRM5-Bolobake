"use client";

import React, { useState, useMemo } from 'react';
import { ChefHat, CheckCircle2, ScanLine, Menu } from 'lucide-react';
import Link from 'next/link';
import { Order, Product } from '@/lib/types';
import { OrderForm } from './OrderForm';
import { DashboardAnalytics } from './DashboardAnalytics';
import { HistoryTable } from './HistoryTable';
import { Sidebar } from '@/components/layout/Sidebar';

export function OrderManager({ 
  initialOrders, 
  initialCatalog 
}: { 
  initialOrders: Order[], 
  initialCatalog: Product[] 
}) {
  const [katalog] = useState<Product[]>(initialCatalog);
  const [orderHistory, setOrderHistory] = useState<Order[]>(initialOrders);
  
  const [activeMenu, setActiveMenu] = useState('new_order');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [filterStartDate, setFilterStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterEndDate, setFilterEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const dashboard = useMemo(() => {
    let totalOmset = 0;
    let totalOrders = 0;
    let totalPcs = 0;
    const uniqueCustomers = new Set<string>();
    const variantPerformance: Record<string, { qty: number; omset: number }> = {};
    const customerLeaderboard: Record<string, { freq: number; totalBelanja: number }> = {};

    const getTimestamp = (dateStr: string) => {
      if (!dateStr) return 0;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr).getTime();
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3 && parts[2].length === 4) {
        return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`).getTime();
      }
      const ts = new Date(dateStr).getTime();
      return isNaN(ts) ? 0 : ts;
    };

    const filteredOrders = orderHistory.filter(order => {
      let orderDate = order.productionDate;
      if (!orderDate) {
        try {
          orderDate = new Date(order.timestamp).toISOString().split('T')[0];
        } catch (e) {
          orderDate = '2026-01-01';
        }
      }
      
      const orderTime = getTimestamp(orderDate);
      
      if (filterStartDate) {
        const startTime = new Date(filterStartDate).getTime();
        if (orderTime < startTime) return false;
      }
      
      if (filterEndDate) {
        const endTime = new Date(filterEndDate).getTime() + (24 * 60 * 60 * 1000) - 1;
        if (orderTime > endTime) return false;
      }
      
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

    return {
      totalOmset,
      totalOrders,
      totalPcs,
      uniqueCustomers: Array.from(uniqueCustomers),
      variantPerformance,
      customerLeaderboard
    };
  }, [orderHistory, filterStartDate, filterEndDate]);

  const handleSaveOrder = async (order: Order) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders', {
        method: editingOrder ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      
      if (!response.ok) throw new Error('Failed to save to Sheets');

      setToastMessage(editingOrder ? 'Pesanan berhasil diperbarui (Sync to Sheets)!' : 'Pesanan berhasil dikirim ke Dapur & Sheet!');
      
      // Re-fetch data
      const resOrders = await fetch('/api/orders');
      const data = await resOrders.json();
      if (data.success) {
        setOrderHistory(data.data);
      }

      setEditingOrder(null);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      
      // Auto redirect to history after save new order? (Optional)
      // if (!editingOrder) setActiveMenu('history');
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan ke Google Sheets. Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <div className="max-w-7xl mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4 bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <span className="w-5 h-5 flex items-center justify-center bg-primary/20 text-primary rounded-md">📅</span>
                Periode Produksi
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="text-xs border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="text-muted-foreground text-xs font-medium">-</span>
                <input 
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="text-xs border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
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
                setActiveMenu('new_order'); // Redirect to form when editing
              }}
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
              orderToEdit={editingOrder} 
              onSave={handleSaveOrder} 
              onCancelEdit={() => {
                setEditingOrder(null);
                setActiveMenu('history'); // Back to history if cancelled
              }} 
              isSubmitting={isSubmitting} 
            />
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (activeMenu) {
      case 'dashboard': return 'Dashboard Analitik';
      case 'history': return 'Riwayat Pesanan';
      case 'new_order': return editingOrder ? 'Edit Pesanan' : 'Buat Pesanan Baru';
      default: return 'Bolobake B2B';
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-hidden relative">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-foreground text-background px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">{toastMessage}</span>
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
            <h1 className="text-xl font-serif font-bold text-foreground">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold items-center gap-2 border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Online
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
