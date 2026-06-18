"use client";

import React, { useState } from 'react';
import { Order, OrderStatus } from '@/lib/types';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { Clock, RotateCcw } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ActionControl, StatusBadge } from '@/components/features/OrderLifecycleUI';

function getBatchLabel(timestamp: string): { label: string, color: string } {
  if (!timestamp) return { label: 'Batch Unknown', color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
  const time = new Date(timestamp);
  const hour = time.getHours();
  
  if (hour < 8) return { label: 'Batch Pagi (08:00)', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' };
  if (hour >= 8 && hour < 10) return { label: 'Tambahan (09:00)', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' };
  if (hour >= 10 && hour < 15) return { label: 'Update Siang (14:00)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' };
  return { label: 'Final Malam (22:00)', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' };
}

function isCakeOrOther(sku: string) {
  const s = sku.toLowerCase();
  return s.includes('cake') || s.includes('brownie') || s.includes('cookie') || s.includes('dessert') || s.includes('tiramisu') || s.includes('macaron');
}

const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export function ProductionTableBoard({ initialOrders, currentUser }: { initialOrders: Order[], currentUser?: { userId: string; name: string; role: string } | null }) {
  const canEditStatus = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'PRODUCTION';
  const { data: orders = initialOrders, mutate } = useSWR<Order[]>('/api/orders', fetcher, { 
    fallbackData: initialOrders,
    refreshInterval: 15000 
  });
  const { data: orders = initialOrders, mutate } = useSWR<Order[]>('/api/orders', fetcher, { 
    fallbackData: initialOrders,
    refreshInterval: 15000 
  });

  const groupedOrders = orders.reduce((acc, order) => {
    if (order.currentStage !== 'PRODUCTION') return acc;
    
    const date = order.productionDate || 'Tanpa Tanggal';
    if (!acc[date]) acc[date] = [];
    acc[date].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  const sortedDates = Object.keys(groupedOrders).sort((a, b) => a.localeCompare(b));

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar">
        {sortedDates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <p>Tidak ada pesanan produksi aktif.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedDates.map((date) => {
              const dateOrders = groupedOrders[date].sort((a, b) => a.customer.localeCompare(b.customer));
              
              return (
                <div key={date} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-600" />
                      Produksi: {formatDate(date)}
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                        <tr>
                          <th className="px-4 py-3 border-b dark:border-slate-700 w-12 text-center">No</th>
                          <th className="px-4 py-3 border-b dark:border-slate-700 min-w-[200px]">Outlet</th>
                          <th className="px-4 py-3 border-b dark:border-slate-700 min-w-[200px]">Catatan</th>
                          <th className="px-4 py-3 border-b dark:border-slate-700 min-w-[300px]">Pesanan (Produk & Qty)</th>
                          <th className="px-4 py-3 border-b dark:border-slate-700 w-48">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {dateOrders.map((order, idx) => {
                          const batch = getBatchLabel(order.timestamp);
                          
                          // Split items
                          const croissantItems = order.items.filter(item => !isCakeOrOther(item.sku));
                          const cakeItems = order.items.filter(item => isCakeOrOther(item.sku));

                          return (
                            <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-4 py-3 align-top text-center text-slate-500 font-medium">{idx + 1}</td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-1.5 items-start">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-normal line-clamp-2">{order.customer}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${batch.color} mb-1`}>
                                    {batch.label}
                                  </span>
                                  <StatusBadge stage={order.currentStage} state={order.currentState} health={order.health} />
                                  {order.deliveryDate && (
                                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 mt-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                      Tgl Kirim: {formatDate(order.deliveryDate)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top whitespace-normal text-xs text-slate-600 dark:text-slate-300">
                                <div className="flex flex-col gap-2">
                                  {order.notes && (
                                    <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-2 rounded border border-red-100 dark:border-red-900/30">
                                      <span className="font-bold block mb-0.5 text-[10px] uppercase">Catatan Dapur:</span>
                                      {order.notes}
                                    </div>
                                  )}
                                  
                                  {order.deliveryNotes && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-2 rounded border border-blue-100 dark:border-blue-900/30">
                                      <span className="font-bold block mb-0.5 text-[10px] uppercase">Pengiriman:</span>
                                      {order.deliveryNotes}
                                    </div>
                                  )}

                                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 space-y-1 mt-1 text-[10px]">
                                    <div className="flex justify-between font-bold">
                                      <span>Logistik:</span>
                                      <span>{order.isFreeShipping ? 'Gratis Ongkir' : `Rp ${formatRp(order.shippingCost || 0).replace('Rp', '').trim()}`}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-primary border-t border-slate-200 dark:border-slate-700 pt-1">
                                      <span>Grand Total:</span>
                                      <span>{formatRp(order.grandTotal || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-3">
                                  {croissantItems.length > 0 && (
                                    <div>
                                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">
                                        Croissant / Artisan Bakery
                                      </div>
                                      <ul className="space-y-1">
                                        {croissantItems.map((item, i) => (
                                          <li key={i} className="flex justify-between items-start text-xs gap-4 text-slate-700 dark:text-slate-300">
                                            <span className="whitespace-normal flex-1">
                                              {item.sku.replace(' (sample)', '')}
                                              {item.isSample && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 ml-1 rounded inline-block">Sample</span>}
                                              {item.isSplitInvoice && <span className="text-[9px] border border-orange-500 text-orange-600 bg-orange-50 px-1 ml-1 rounded inline-block font-bold">Pisah Nota</span>}
                                            </span>
                                            <span className="font-bold whitespace-nowrap">{item.qty} pcs</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  
                                  {cakeItems.length > 0 && (
                                    <div>
                                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 border-b border-slate-200 dark:border-slate-700 pb-1 mt-1">
                                        Cake / Other
                                      </div>
                                      <ul className="space-y-1">
                                        {cakeItems.map((item, i) => (
                                          <li key={i} className="flex justify-between items-start text-xs gap-4 text-slate-700 dark:text-slate-300">
                                            <span className="whitespace-normal flex-1">
                                              {item.sku.replace(' (sample)', '')}
                                              {item.isSample && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 ml-1 rounded inline-block">Sample</span>}
                                              {item.isSplitInvoice && <span className="text-[9px] border border-orange-500 text-orange-600 bg-orange-50 px-1 ml-1 rounded inline-block font-bold">Pisah Nota</span>}
                                            </span>
                                            <span className="font-bold whitespace-nowrap">{item.qty} pcs</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 align-top">
                                <ActionControl order={order} currentUser={currentUser} onActionComplete={() => mutate()} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="min-h-8 h-auto py-1.5 sm:py-0 bg-slate-900 text-slate-400 text-[10px] flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 font-medium shrink-0 print:hidden gap-1 sm:gap-0">
        <span className="truncate sm:whitespace-normal">Sinkronisasi realtime. Status otomatis tercatat.</span>
        <span className="flex items-center gap-1.5 shrink-0"><RotateCcw className="w-3 h-3" /> Update: {new Date().toLocaleTimeString('id-ID')}</span>
      </div>
    </div>
  );
}
