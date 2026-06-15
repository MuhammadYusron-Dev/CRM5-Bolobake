"use client";

import React, { useState, useMemo } from 'react';
import { Gift, Calendar, Search, TrendingDown, Package, PieChart } from 'lucide-react';
import { Order, Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Sidebar } from '@/components/layout/Sidebar';
import { DateRangeFilter } from './DateRangeFilter';

interface SampleTrackerProps {
  initialOrders: Order[];
  initialCatalog: Product[];
}

export function SampleTracker({ initialOrders, initialCatalog }: SampleTrackerProps) {
  const [activeMenu, setActiveMenu] = useState('samples');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const sampleData = useMemo(() => {
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

    let totalBudgetEaten = 0;
    let totalSamplePcs = 0;
    const sampleItems: any[] = [];
    
    // Process all orders to extract sample items
    initialOrders.forEach(order => {
      let orderDate = order.productionDate;
      if (!orderDate) {
        try { orderDate = new Date(order.timestamp || '').toISOString().split('T')[0]; } catch (e) { orderDate = '2026-01-01'; }
      }
      
      const orderNum = parseDateToNumber(orderDate);
      if (startNum > 0 && orderNum > 0 && orderNum < startNum) return;
      if (endNum > 0 && orderNum > 0 && orderNum > endNum) return;

      const items = order.items || [];
      items.forEach(item => {
        if (item.sku.includes('(sample)')) {
          const isMatchSearch = 
            order.customer.toLowerCase().includes(searchQuery.toLowerCase()) || 
            item.sku.toLowerCase().includes(searchQuery.toLowerCase());

          if (searchQuery && !isMatchSearch) return;

          const baseSku = item.sku.replace(' (sample)', '').replace('(sample) ', '');
          const originalPrice = Number(item.price);
          const totalCost = originalPrice * item.qty;

          totalSamplePcs += item.qty;
          totalBudgetEaten += totalCost;

          sampleItems.push({
            orderId: order.id,
            date: orderDate,
            customer: order.customer,
            sku: baseSku,
            qty: item.qty,
            basePrice: originalPrice,
            totalCost: totalCost
          });
        }
      });
    });

    sampleItems.sort((a, b) => b.orderId - a.orderId);

    return { totalBudgetEaten, totalSamplePcs, sampleItems };
  }, [initialOrders, filterStartDate, filterEndDate, searchQuery]);

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 shrink-0 bg-white/50 dark:bg-black/20 backdrop-blur-md border-b border-border shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Tracking Sample</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 flex w-full items-center bg-white dark:bg-slate-900 p-2 rounded-xl border border-border shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="pl-3 pr-2 text-muted-foreground"><Search className="w-4 h-4" /></div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama outlet atau produk..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground font-medium"
              />
            </div>
            <div className="w-full sm:w-auto bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-border flex items-center shrink-0 shadow-sm">
              <DateRangeFilter 
                filterStartDate={filterStartDate}
                setFilterStartDate={setFilterStartDate}
                filterEndDate={filterEndDate}
                setFilterEndDate={setFilterEndDate}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 font-medium text-sm mb-1 uppercase tracking-wider">Total Sampel Diberikan</p>
                    <h3 className="text-4xl font-bold">{sampleData.totalSamplePcs} <span className="text-xl font-normal opacity-80">pcs</span></h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-orange-100 font-medium text-sm mb-1 uppercase tracking-wider">Total Anggaran (Budget Cost)</p>
                    <h3 className="text-3xl font-bold mt-1">{formatRp(sampleData.totalBudgetEaten)}</h3>
                  </div>
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                    <TrendingDown className="w-8 h-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/50 shadow-sm overflow-hidden">
            <div className="bg-muted/30 p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                Rincian Distribusi Sampel
              </h3>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold">
                {sampleData.sampleItems.length} Transaksi
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-4">Tgl Produksi</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Produk Sampel</th>
                    <th className="px-6 py-4 text-center">Qty</th>
                    <th className="px-6 py-4 text-right">Harga Asli</th>
                    <th className="px-6 py-4 text-right">Cost (Budget)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sampleData.sampleItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                        <Gift className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Tidak ada sampel yang tercatat pada periode ini.</p>
                      </td>
                    </tr>
                  ) : (
                    sampleData.sampleItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-muted-foreground">
                          {item.date}
                        </td>
                        <td className="px-6 py-4 font-bold text-foreground">
                          {item.customer}
                        </td>
                        <td className="px-6 py-4 font-medium text-primary">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="bg-secondary px-2 py-1 rounded font-bold">
                            {item.qty}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          {formatRp(item.basePrice)}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-orange-600 dark:text-orange-400">
                          {formatRp(item.totalCost)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
