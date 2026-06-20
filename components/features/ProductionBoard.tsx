"use client";

import React, { useState } from 'react';
import { ProductionTimers } from '@/components/features/ProductionTimers';
import { ProductionTutorial } from '@/components/features/ProductionTutorial';
import { ProductionTableBoard } from '@/components/features/ProductionTableBoard';
import { ProductionSchedule } from '@/components/features/ProductionSchedule';
import { ChefHat } from 'lucide-react';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Order } from '@/lib/types';
import { HorizontalDateFilter } from '@/components/features/HorizontalDateFilter';

export function ProductionBoard({ initialOrders, currentUser }: { initialOrders: Order[], currentUser?: { userId: string; name: string; role: string } | null }) {
  const { data: orders = initialOrders } = useSWR<Order[]>('/api/orders', fetcher, { 
    fallbackData: initialOrders,
    refreshInterval: 15000 
  });
  
  const [activeView, setActiveView] = useState<'board' | 'schedule'>('board');

  const today = new Date();
  const formatYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  const todayYMD = formatYMD(today);
  const [filterStart, setFilterStart] = useState<string>(todayYMD);
  const [filterEnd, setFilterEnd] = useState<string>(todayYMD);

  const orderDates = new Set<string>();
  orders.forEach(o => {
    if (o.currentStage === 'PRODUCTION' && o.productionDate) {
      orderDates.add(o.productionDate);
    }
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      {/* Header with View Switcher */}
      <header className="py-3 flex flex-col sm:flex-row items-end sm:items-center justify-between px-4 sm:px-6 shrink-0 z-10 gap-3 print:hidden">
        <div className="w-full sm:w-auto">
          <HorizontalDateFilter 
            startDate={filterStart}
            endDate={filterEnd}
            onRangeChange={(s, e) => { setFilterStart(s); setFilterEnd(e); }}
            orderDates={orderDates}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto">
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
          <div className="shrink-0 flex-1 sm:flex-none">
            <ProductionTutorial />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {activeView === 'schedule' ? (
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-950">
          <ProductionSchedule initialOrders={orders} filterStart={filterStart} filterEnd={filterEnd} />
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex flex-col">
          <ProductionTableBoard initialOrders={orders} currentUser={currentUser} filterStart={filterStart} filterEnd={filterEnd} />
        </div>
      )}
      
      <ProductionTimers />
    </div>
  );
}
