"use client";

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChefHat, PackageCheck, Clock, CheckCircle2, RotateCcw, AlertCircle, Edit2, Copy, Trash2, Printer, Plus, AlertTriangle, ArrowRight, CalendarDays, MoreVertical, Store, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ProductionSchedule } from '@/components/features/ProductionSchedule';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { ActionControl, StatusBadge } from '@/components/features/OrderLifecycleUI';

export interface ColumnDef {
  id: string;
  title: string;
  description?: string;
  filterFn: (order: Order) => boolean;
  colorClass: string;
}

// Helper to determine the batch based on timestamp
function getBatchLabel(timestamp: string): { label: string, color: string } {
  if (!timestamp) return { label: 'Batch Unknown', color: 'bg-slate-200 text-slate-700' };
  const time = new Date(timestamp);
  const hour = time.getHours();
  
  if (hour < 8) return { label: 'Batch Pagi (08:00)', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' };
  if (hour >= 8 && hour < 10) return { label: 'Tambahan (09:00)', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' };
  if (hour >= 10 && hour < 15) return { label: 'Update Siang (14:00)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' };
  return { label: 'Final Malam (22:00)', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' };
}

interface KanbanBoardProps {
  initialOrders: Order[];
  columns: ColumnDef[];
  divisionName: string;
  icon?: 'produksi' | 'packing';
  showOverview?: boolean;
  extraHeaderAction?: React.ReactNode;
  currentUser?: { userId: string; name: string; role: string } | null;
}

export function KanbanBoard({ initialOrders, columns, divisionName, icon, showOverview, extraHeaderAction, currentUser }: KanbanBoardProps) {
  const canEditStatus = 
    currentUser?.role === 'SYSTEM_ADMIN' || 
    (icon === 'produksi' && currentUser?.role === 'PRODUCTION') || 
    (icon === 'packing' && (currentUser?.role === 'PACKING' || currentUser?.role === 'DELIVERY'));
  const { data: orders = initialOrders, mutate, isLoading } = useSWR('/api/orders', fetcher, { 
    fallbackData: initialOrders,
    refreshInterval: 15000 // Poll every 15 seconds automatically
  });
  const [activeView, setActiveView] = useState<'board' | 'schedule'>('board');

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* Header */}
      <header className="py-3 flex flex-col sm:flex-row items-end sm:items-center justify-end px-4 sm:px-6 shrink-0 z-10 gap-3 print:hidden">
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
          {showOverview && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex-1 sm:flex-none justify-between sm:justify-start">
              <button 
                onClick={() => setActiveView('board')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${activeView === 'board' ? 'bg-white shadow-sm text-primary dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
              >
                Papan Antrean
              </button>
              <button 
                onClick={() => setActiveView('schedule')}
                className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-bold transition-all ${activeView === 'schedule' ? 'bg-white shadow-sm text-primary dark:bg-slate-700 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
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
          <ProductionSchedule initialOrders={orders} />
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 sm:p-6 print:hidden snap-x snap-mandatory scroll-smooth custom-scrollbar">
        <div className="flex h-full gap-4 sm:gap-6 items-start w-full min-w-max pb-2 sm:pb-0">
          {columns.map((col) => {
            const colOrders = orders.filter(col.filterFn).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            return (
              <div key={col.id} className="w-[85vw] max-w-[280px] sm:w-auto sm:flex-1 shrink-0 snap-start sm:snap-align-none flex flex-col h-full bg-slate-100 dark:glass-panel rounded-2xl border shadow-sm" style={{ minWidth: 'clamp(260px, 22vw, 320px)' }}>
                {/* Column Header */}
                <div className={`p-4 rounded-t-2xl border-b flex flex-col gap-1.5 ${col.colorClass}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{col.title}</h3>
                    <span className="bg-white/30 text-white text-xs px-2 py-1 rounded-full font-bold shrink-0 ml-2 backdrop-blur-sm">
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
                <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-4 custom-scrollbar">
                  {colOrders.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-sm font-medium border-2 border-dashed rounded-xl m-2">
                      Kosong
                    </div>
                  ) : (
                    // FLAT VIEW FOR CARDS
                    colOrders.map((order: Order) => {
                      const batch = getBatchLabel(order.timestamp);
                      return (
                        <Card 
                          key={order.id} 
                            draggable={true}
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/bolobake-order', JSON.stringify(order));
                                e.dataTransfer.effectAllowed = 'copy';
                            }}
                            className="shadow-sm transition-all hover:shadow-md dark:glass-panel cursor-grab active:cursor-grabbing hover:border-primary/50 dark:hover:shadow-[0_0_15px_rgba(0,89,255,0.4)]"
                          >
                            <CardContent className="p-3 sm:p-4">
                              <div className="flex flex-col gap-1.5 items-start mb-2">
                                <div className="flex items-center gap-2 w-full">
                                  <h4 className="font-bold text-sm line-clamp-2">{order.customer}</h4>
                                  <StatusBadge stage={order.currentStage} state={order.currentState} health={order.health} iconOnly={true} />
                                </div>
                                {order.deliveryDate && (
                                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                    Tgl Kirim: {formatDate(order.deliveryDate)}
                                  </span>
                                )}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${batch.color}`}>
                                  {batch.label}
                                </span>
                              </div>
                              
                              <div className="bg-slate-50 dark:bg-black/20 p-2 sm:p-2.5 rounded-lg text-xs space-y-1 mb-3 border dark:border-white/5">
                                {(order.items || []).map((item: any, idx: number) => (
                                  <div key={idx} className="flex justify-between gap-2">
                                    <span className="font-medium text-slate-700 dark:text-slate-300 leading-tight">
                                      {item.qty}x {item.sku.replace(' (sample)', '')}
                                      {item.isSample && <span className="text-[10px] bg-orange-100 text-orange-700 px-1 ml-1 rounded inline-block">S</span>}
                                    </span>
                                  </div>
                                ))}
                              </div>

                              {order.notes && divisionName === 'Produksi' && (
                                <div className="mb-3 text-[11px] bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-2 rounded border border-red-200 dark:border-red-800/50 leading-tight">
                                  <span className="font-bold flex items-center gap-1 mb-0.5"><ChefHat className="w-3 h-3 shrink-0"/> Catatan Produksi:</span>
                                  <p className="break-words">{order.notes}</p>
                                </div>
                              )}

                              {order.deliveryNotes && divisionName === 'Packing' && (
                                <div className="mb-3 text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-2 rounded border border-blue-200 dark:border-blue-800/50 leading-tight">
                                  <span className="font-bold flex items-center gap-1 mb-0.5"><PackageCheck className="w-3 h-3 shrink-0"/> Catatan Pengiriman:</span>
                                  <p className="break-words">{order.deliveryNotes}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3 sm:mb-4">
                                {order.productionDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0"/> Prod: {formatDate(order.productionDate)}</span>}
                              </div>

                              {/* Action Button */}
                              <ActionControl order={order} currentUser={currentUser} onActionComplete={() => mutate()} />
                            </CardContent>
                          </Card>
                        );
                      })
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
        <span className="flex items-center gap-1.5 shrink-0" suppressHydrationWarning><RotateCcw className="w-3 h-3" /> Update: {new Date().toLocaleTimeString('id-ID')}</span>
      </div>
    </div>
  );
}
