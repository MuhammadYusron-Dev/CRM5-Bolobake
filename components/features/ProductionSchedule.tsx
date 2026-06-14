"use client";

import React, { useMemo } from 'react';
import { Order } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Printer, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ProductionSchedule({ orders }: { orders: Order[] }) {
  const scheduleData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    // Filter statuses we want to ignore (already passed production)
    const ignoreStatuses = ['Packing', 'Delivery', 'Diterima'];

    const grouped: Record<string, Record<string, { qty: number; notes: string[] }>> = {};

    orders.forEach(order => {
      // 1. Skip if no date or invalid date
      if (!order.productionDate) return;
      const prodDate = new Date(order.productionDate);
      if (isNaN(prodDate.getTime())) return;
      
      // 2. Skip if status is already done with production
      if (order.status && ignoreStatuses.includes(order.status)) return;

      // 3. Filter next 30 days
      if (prodDate >= today && prodDate <= thirtyDaysLater) {
        const dateKey = order.productionDate; // format is YYYY-MM-DD
        if (!grouped[dateKey]) grouped[dateKey] = {};

        order.items.forEach(item => {
          const skuName = item.sku.replace(' (sample)', '');
          if (!grouped[dateKey][skuName]) {
            grouped[dateKey][skuName] = { qty: 0, notes: [] };
          }
          
          grouped[dateKey][skuName].qty += item.qty;
          
          if (order.notes && order.notes.trim() !== '') {
            grouped[dateKey][skuName].notes.push(`[${order.customer}]: ${order.notes.trim()}`);
          }
        });
      }
    });

    // Convert to array and sort by Date
    const sortedByDate = Object.entries(grouped).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));

    // Sort inner items by QTY descending
    return sortedByDate.map(([dateKey, items]) => {
      const sortedItems = Object.entries(items).sort(([, a], [, b]) => b.qty - a.qty);
      return { dateKey, items: sortedItems };
    });
  }, [orders]);

  const handlePrint = () => {
    window.print();
  };

  if (scheduleData.length === 0) return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 border-b p-4 sm:p-6 shrink-0 flex flex-col gap-3 print:hidden">
      <div className="flex items-center justify-between text-slate-800 dark:text-slate-200">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-sm uppercase tracking-wider">Sisa Target Produksi (30 Hari)</h2>
        </div>
      </div>
      <div className="text-sm text-muted-foreground p-4 bg-white dark:bg-slate-950 rounded-xl border border-dashed text-center">
        Tidak ada jadwal produksi yang tersisa.
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:grid { display: grid !important; }
          .print\\:flex-wrap { flex-wrap: wrap !important; }
          @page { size: A4 portrait; margin: 1.5cm; }
        }
      `}} />

      <div className="w-full bg-slate-100 dark:bg-slate-900 border-b p-4 sm:p-6 shrink-0 flex flex-col gap-3 print:bg-white print:p-0 print:border-none print:w-full print:max-w-full">
        
        <div className="flex items-center justify-between text-slate-800 dark:text-slate-200 print:mb-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary print:text-black" />
            <h2 className="font-bold text-sm uppercase tracking-wider print:text-xl print:border-b-2 print:border-black print:pb-1">Sisa Target Produksi (30 Hari)</h2>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="print:hidden h-8 font-bold text-xs gap-2 border-primary/20 hover:bg-primary/5">
            <Printer className="w-3.5 h-3.5" />
            Cetak Rekap (A4)
          </Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar print:flex-wrap print:grid print:grid-cols-2 print:gap-8 print:overflow-visible">
          {scheduleData.map(({ dateKey, items }) => {
            let displayDate = dateKey;
            try {
              const [y, m, d] = dateKey.split('-');
              displayDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
            } catch(e) {}

            return (
              <Card key={dateKey} className="min-w-[260px] max-w-[300px] shrink-0 border-primary/20 shadow-sm bg-white dark:bg-slate-950 print:break-inside-avoid print:min-w-0 print:max-w-none print:w-full print:shadow-none print:border print:border-black print:rounded-none">
                <div className="bg-primary/10 border-b border-primary/10 p-2.5 rounded-t-xl text-center print:bg-slate-100 print:rounded-none print:border-black">
                  <span className="font-bold text-primary text-sm print:text-black print:text-base">{displayDate}</span>
                </div>
                <CardContent className="p-3 print:p-4">
                  <div className="space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1 print:max-h-none print:overflow-visible">
                    {items.map(([sku, data]) => (
                      <div key={sku} className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 last:border-0 last:pb-0 last:mb-0 print:border-black/20">
                        <div className="flex justify-between items-start text-xs print:text-sm">
                          <span className="text-slate-700 dark:text-slate-300 pr-2 font-medium print:text-black leading-snug">
                            {sku}
                            {data.notes.length > 0 && (
                              <span className="inline-block ml-1.5 text-red-500 print:text-black" title="Ada Catatan Khusus!">
                                <AlertTriangle className="w-3.5 h-3.5 inline-block -mt-0.5" />
                              </span>
                            )}
                          </span>
                          <span className="font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-primary print:bg-transparent print:text-black print:border print:border-black shrink-0">
                            {data.qty}
                          </span>
                        </div>
                        {data.notes.length > 0 && (
                          <div className="mt-1.5 text-[10px] text-red-600 bg-red-50 p-1.5 rounded-md border border-red-100 print:text-sm print:font-medium print:text-black print:bg-transparent print:border-black/50 print:border-dashed">
                            <span className="font-bold block mb-0.5">Catatan Khusus:</span>
                            <ul className="list-disc pl-3 space-y-0.5">
                              {data.notes.map((note, i) => (
                                <li key={i}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
