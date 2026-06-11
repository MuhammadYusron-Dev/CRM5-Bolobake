"use client";

import React, { useState, useMemo } from 'react';
import { ChefHat, CheckCircle2, ScanLine } from 'lucide-react';
import Link from 'next/link';
import { Order, Product } from '@/lib/types';
import { OrderForm } from './OrderForm';
import { DashboardAnalytics } from './DashboardAnalytics';
import { HistoryTable } from './HistoryTable';

export function OrderManager({ 
  initialOrders, 
  initialCatalog 
}: { 
  initialOrders: Order[], 
  initialCatalog: Product[] 
}) {
  const [katalog] = useState<Product[]>(initialCatalog);
  const [orderHistory, setOrderHistory] = useState<Order[]>(initialOrders);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
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
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan ke Google Sheets. Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground lg:overflow-hidden relative">
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-foreground text-background px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      </div>

      {/* LEFT PANEL */}
      <div className="w-full lg:w-[55%] flex flex-col lg:h-full border-b lg:border-b-0 lg:border-r border-border bg-background">
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-border bg-background/50 backdrop-blur-sm z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-primary" />
              Bolobake
            </h1>
            <p className="text-sm text-muted-foreground font-medium tracking-wide mt-1">B2B ORDER MANAGEMENT</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/catalog"
              className="bg-background border border-border text-foreground px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:border-primary hover:text-primary transition-all shadow-sm"
            >
              <ScanLine className="w-4 h-4" />
              Catalog Manager
            </Link>
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Online
            </div>
          </div>
        </div>

        <OrderForm 
          katalog={katalog} 
          orderToEdit={editingOrder} 
          onSave={handleSaveOrder} 
          onCancelEdit={() => setEditingOrder(null)} 
          isSubmitting={isSubmitting} 
        />
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[45%] bg-card h-auto lg:h-full lg:overflow-y-auto flex flex-col">
        <div className="p-4 sm:p-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border sticky top-0 bg-card z-10 gap-4 sm:gap-0">
          <h2 className="text-3xl font-serif">Insights & Data</h2>
          <div className="flex bg-muted p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Riwayat
              {orderHistory.length > 0 && <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">{orderHistory.length}</span>}
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-8 pt-6 flex-1">
          {activeTab === 'dashboard' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2 bg-muted/50 p-3 rounded-xl border border-border">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="w-4 h-4 text-primary">📅</span>
                  Periode Produksi
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="text-xs border border-border rounded-md px-2 py-1.5 bg-background outline-none"
                  />
                  <span className="text-muted-foreground text-xs">-</span>
                  <input 
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="text-xs border border-border rounded-md px-2 py-1.5 bg-background outline-none"
                  />
                </div>
              </div>
              <DashboardAnalytics dashboard={dashboard} isLoading={false} error={null} />
            </div>
          ) : (
            <HistoryTable 
              orderHistory={orderHistory}
              editingOrderId={editingOrder?.id || null}
              handleEditOrder={setEditingOrder}
              filterStartDate={filterStartDate}
              setFilterStartDate={setFilterStartDate}
              filterEndDate={filterEndDate}
              setFilterEndDate={setFilterEndDate}
            />
          )}
        </div>
      </div>
    </div>
  );
}
