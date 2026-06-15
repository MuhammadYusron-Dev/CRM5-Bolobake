"use client";

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, PackageCheck, Clock, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
// import { formatRp } from '@/lib/utils'; // Removed to fix TS2305
import { ProductionSchedule } from '@/components/features/ProductionSchedule';

export interface ColumnDef {
  id: string;
  title: string;
  description?: string;
  statuses: OrderStatus[];
  actionLabel?: string;
  nextStatus?: OrderStatus;
  colorClass: string;
}

interface KanbanBoardProps {
  initialOrders: Order[];
  columns: ColumnDef[];
  divisionName: string;
  icon?: 'produksi' | 'packing';
  showOverview?: boolean;
  extraHeaderAction?: React.ReactNode;
}

export function KanbanBoard({ initialOrders, columns, divisionName, icon, showOverview, extraHeaderAction }: KanbanBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isUpdating, setIsUpdating] = useState<number | null>(null);
  const [lastSync, setLastSync] = useState<string>(() => new Date().toLocaleTimeString('id-ID'));
  const [activeView, setActiveView] = useState<'board' | 'schedule'>('board');

  // Polling every 30 seconds
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success && data.data) {
          setOrders(data.data);
          setLastSync(new Date().toLocaleTimeString('id-ID'));
        }
      } catch (err) {
        console.error("Failed to poll orders:", err);
      }
    };

    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId: number, newStatus: OrderStatus) => {
    setIsUpdating(orderId);
    
    // Find the order
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      setIsUpdating(null);
      return;
    }
    const order = orders[orderIndex];

    // Optimistic UI
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

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
      
      // Merge precise timestamps if returned
      if (data.data?.timestamps) {
         setOrders(prev => prev.map(o => {
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
    } catch (error) {
      console.error(error);
      // Revert Optimistic
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: order.status } : o));
      alert('Gagal memperbarui status');
    } finally {
      setIsUpdating(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* Header */}
      <header className="min-h-16 h-auto py-3 sm:py-0 bg-white dark:bg-slate-900 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-6 shrink-0 shadow-sm z-10 gap-3 sm:gap-0 print:hidden">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {icon === 'produksi' ? (
            <ChefHat className="w-6 h-6 text-purple-600 shrink-0" />
          ) : (
            <PackageCheck className="w-6 h-6 text-orange-600 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight truncate">Divisi {divisionName}</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate">Bolobake Workflow System</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {showOverview && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex-1 sm:flex-none justify-between sm:justify-start">
              <button 
                onClick={() => setActiveView('board')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${activeView === 'board' ? 'bg-white shadow-sm text-primary dark:bg-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Papan Antrean
              </button>
              <button 
                onClick={() => setActiveView('schedule')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${activeView === 'schedule' ? 'bg-white shadow-sm text-primary dark:bg-slate-700' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              >
                Rekap Target
              </button>
            </div>
          )}
          <div className="shrink-0 flex-1 sm:flex-none">
            {extraHeaderAction}
          </div>
        </div>
      </header>

      {/* View Switcher */}
      {showOverview && activeView === 'schedule' ? (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
          <ProductionSchedule orders={orders} />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 print:hidden">
        <div className="flex h-full gap-6 items-start w-full min-w-max">
          {columns.map((col) => {
            const colOrders = orders.filter(o => col.statuses.includes(o.status || 'Pesanan Dibuat'));
            
            return (
              <div key={col.id} className="flex-1 min-w-[320px] flex flex-col h-full bg-slate-100 dark:bg-slate-900/50 rounded-2xl border shadow-sm">
                {/* Column Header */}
                <div className={`p-4 rounded-t-2xl border-b flex flex-col gap-1.5 ${col.colorClass}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{col.title}</h3>
                    <span className="bg-white/50 dark:bg-black/20 text-xs px-2 py-1 rounded-full font-bold shrink-0 ml-2">
                      {colOrders.length}
                    </span>
                  </div>
                  {col.description && (
                    <div className="flex items-start gap-1.5 opacity-85 mt-0.5 text-inherit">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <p className="text-[10px] leading-snug font-medium italic">{col.description}</p>
                    </div>
                  )}
                </div>

                {/* Column Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                  {colOrders.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-sm font-medium border-2 border-dashed rounded-xl m-2">
                      Kosong
                    </div>
                  ) : (
                    colOrders.map(order => (
                      <Card 
                        key={order.id} 
                        draggable={true}
                        onDragStart={(e) => {
                            e.dataTransfer.setData('application/bolobake-order', JSON.stringify(order));
                            e.dataTransfer.effectAllowed = 'copy';
                        }}
                        className={`shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${isUpdating === order.id ? 'opacity-50 pointer-events-none' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm">{order.customer}</h4>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                              {order.status || 'Pesanan Dibuat'}
                            </span>
                          </div>
                          
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg text-xs space-y-1 mb-3 border">
                            {(order.items || []).map((item, idx) => (
                              <div key={idx} className="flex justify-between gap-2">
                                <span className="font-medium text-slate-700 dark:text-slate-300 leading-tight">
                                  {item.qty}x {item.sku.replace(' (sample)', '')}
                                  {item.isSample && <span className="text-[10px] bg-orange-100 text-orange-700 px-1 ml-1 rounded">S</span>}
                                </span>
                              </div>
                            ))}
                          </div>

                          {order.notes && divisionName === 'Produksi' && (
                            <div className="mb-3 text-[11px] bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-2 rounded border border-red-200 dark:border-red-800/50 leading-tight">
                              <span className="font-bold block mb-0.5 flex items-center gap-1"><ChefHat className="w-3 h-3"/> Catatan Produksi:</span>
                              {order.notes}
                            </div>
                          )}

                          {order.deliveryNotes && divisionName === 'Packing' && (
                            <div className="mb-3 text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-2 rounded border border-blue-200 dark:border-blue-800/50 leading-tight">
                              <span className="font-bold block mb-0.5 flex items-center gap-1"><PackageCheck className="w-3 h-3"/> Catatan Pengiriman:</span>
                              {order.deliveryNotes}
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-4">
                            {order.productionDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Prod: {order.productionDate}</span>}
                          </div>

                          {/* Action Button */}
                          {col.nextStatus && (
                            <Button 
                              size="sm" 
                              className="w-full h-8 text-xs font-bold"
                              onClick={() => handleUpdateStatus(order.id, col.nextStatus!)}
                              disabled={isUpdating === order.id}
                            >
                              {col.actionLabel}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}
      
      {/* Footer / Info */}
      <div className="min-h-8 h-auto py-1.5 sm:py-0 bg-slate-900 text-slate-400 text-[10px] flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 font-medium shrink-0 print:hidden gap-1 sm:gap-0">
        <span className="truncate sm:whitespace-normal">Sinkronisasi realtime. Status otomatis tercatat.</span>
        <span className="flex items-center gap-1.5 shrink-0" suppressHydrationWarning><RotateCcw className="w-3 h-3" /> Update: {lastSync}</span>
      </div>
    </div>
  );
}
