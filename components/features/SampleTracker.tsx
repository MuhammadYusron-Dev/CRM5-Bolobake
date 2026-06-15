"use client";

import React, { useState, useMemo } from 'react';
import { Gift, Calendar, Search, TrendingDown, Package, PieChart, Target, Trophy, Download, Printer, ArrowUpRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
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

  const BUDGET_CAP = 2000000; // Rp 2.000.000 default budget

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
    
    const customerStats: Record<string, { pcs: number, cost: number }> = {};
    const productStats: Record<string, { pcs: number, cost: number }> = {};
    const sampleGivenMap: Record<string, Record<string, number>> = {};
    
    // Sort all orders chronological for conversion logic
    const allParsedOrders = initialOrders.map(order => {
      let orderDate = order.productionDate;
      if (!orderDate) {
        try { orderDate = new Date(order.timestamp || '').toISOString().split('T')[0]; } catch (e) { orderDate = '2026-01-01'; }
      }
      return { ...order, parsedDate: parseDateToNumber(orderDate), strDate: orderDate };
    }).sort((a, b) => a.parsedDate - b.parsedDate);

    allParsedOrders.forEach(order => {
      const orderNum = order.parsedDate;
      const cust = order.customer;
      
      const items = order.items || [];
      items.forEach(item => {
        const isSample = item.sku.includes('(sample)');
        const baseSku = item.sku.replace(' (sample)', '').replace('(sample) ', '');
        
        if (isSample) {
            // Record the first time sample was given
            if (!sampleGivenMap[cust]) sampleGivenMap[cust] = {};
            if (!sampleGivenMap[cust][baseSku]) {
                sampleGivenMap[cust][baseSku] = orderNum;
            }
            
            const withinDate = (!startNum || orderNum >= startNum) && (!endNum || orderNum <= endNum);
            const isMatchSearch = !searchQuery || cust.toLowerCase().includes(searchQuery.toLowerCase()) || baseSku.toLowerCase().includes(searchQuery.toLowerCase());
            
            if (withinDate && isMatchSearch) {
                const cost = Number(item.price) * item.qty;
                totalSamplePcs += item.qty;
                totalBudgetEaten += cost;
                
                sampleItems.push({
                    orderId: order.id,
                    date: order.strDate,
                    customer: cust,
                    sku: baseSku,
                    qty: item.qty,
                    basePrice: Number(item.price),
                    totalCost: cost,
                    isConverted: false // Will be updated if conversion found
                });
                
                if (!customerStats[cust]) customerStats[cust] = { pcs: 0, cost: 0 };
                customerStats[cust].pcs += item.qty;
                customerStats[cust].cost += cost;
                
                if (!productStats[baseSku]) productStats[baseSku] = { pcs: 0, cost: 0 };
                productStats[baseSku].pcs += item.qty;
                productStats[baseSku].cost += cost;
            }
        } else {
            // Regular purchase check for conversion
            if (sampleGivenMap[cust] && sampleGivenMap[cust][baseSku]) {
                if (orderNum > sampleGivenMap[cust][baseSku]) { // Must buy AFTER getting sample
                    // Mark previously recorded sample items as converted
                    sampleItems.filter(s => s.customer === cust && s.sku === baseSku).forEach(s => s.isConverted = true);
                }
            }
        }
      });
    });

    sampleItems.sort((a, b) => b.orderId - a.orderId); // Show newest first
    
    // Analytics calculation
    const convertedCount = sampleItems.filter(s => s.isConverted).length;
    const conversionRate = sampleItems.length > 0 ? (convertedCount / sampleItems.length) * 100 : 0;
    
    const topCustomers = Object.entries(customerStats).sort((a, b) => b[1].cost - a[1].cost).slice(0, 5);
    const topProducts = Object.entries(productStats).sort((a, b) => b[1].pcs - a[1].pcs).slice(0, 5);

    return { totalBudgetEaten, totalSamplePcs, sampleItems, conversionRate, convertedCount, topCustomers, topProducts };
  }, [initialOrders, filterStartDate, filterEndDate, searchQuery]);

  const budgetUsedPct = Math.min((sampleData.totalBudgetEaten / BUDGET_CAP) * 100, 100);
  const budgetColor = budgetUsedPct > 90 ? 'bg-red-500' : budgetUsedPct > 75 ? 'bg-orange-500' : 'bg-emerald-500';
  const isOverBudget = sampleData.totalBudgetEaten > BUDGET_CAP;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tgl Produksi,Customer,Produk Sampel,Qty,Harga Asli,Cost (Budget),Status Konversi\n";
    
    sampleData.sampleItems.forEach(item => {
      const status = item.isConverted ? "Berhasil (Beli)" : "Belum Konversi";
      csvContent += `${item.date},"${item.customer}","${item.sku}",${item.qty},${item.basePrice},${item.totalCost},"${status}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Sampel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 shrink-0 bg-white/50 dark:bg-black/20 backdrop-blur-md border-b border-border shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-purple-500" />
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Tracking & Analytics Sample</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-400 transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 transition-colors">
              <Printer className="w-4 h-4" /> Cetak
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 print:p-0 print:overflow-visible">
          
          {/* Header Print */}
          <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-black">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-center">Laporan Distribusi Sampel Produk</h1>
            <p className="text-center text-sm mt-1">Periode: {filterStartDate || 'Awal'} s/d {filterEndDate || 'Akhir'}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between print:hidden">
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4 print:gap-4 print:break-inside-avoid">
            {/* Card 1: Konversi */}
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0 shadow-lg print:border print:border-black print:text-black print:bg-none print:shadow-none">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 print:text-black font-medium text-xs mb-1 uppercase tracking-wider">Tingkat Konversi</p>
                    <h3 className="text-3xl font-bold">{sampleData.conversionRate.toFixed(1)}<span className="text-lg font-normal opacity-80">%</span></h3>
                    <p className="text-xs text-blue-100 print:text-black mt-1">{sampleData.convertedCount} dari {sampleData.sampleItems.length} berbuah Sales</p>
                  </div>
                  <div className="p-2.5 bg-white/20 print:hidden rounded-2xl backdrop-blur-sm">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Total Sampel */}
            <Card className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white border-0 shadow-lg print:border print:border-black print:text-black print:bg-none print:shadow-none">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-purple-100 print:text-black font-medium text-xs mb-1 uppercase tracking-wider">Total Sampel Diberikan</p>
                    <h3 className="text-3xl font-bold">{sampleData.totalSamplePcs} <span className="text-lg font-normal opacity-80">pcs</span></h3>
                    <p className="text-xs text-purple-100 print:text-black mt-1">Dalam {sampleData.sampleItems.length} transaksi</p>
                  </div>
                  <div className="p-2.5 bg-white/20 print:hidden rounded-2xl backdrop-blur-sm">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Total Anggaran Terpakai */}
            <Card className={`bg-gradient-to-br ${isOverBudget ? 'from-red-600 to-rose-700' : 'from-orange-500 to-red-600'} text-white border-0 shadow-lg print:border print:border-black print:text-black print:bg-none print:shadow-none lg:col-span-2`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-orange-100 print:text-black font-medium text-xs mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      Budget Terpakai {isOverBudget && <ShieldAlert className="w-3.5 h-3.5 text-yellow-300 print:hidden animate-pulse" />}
                    </p>
                    <h3 className="text-2xl font-bold">{formatRp(sampleData.totalBudgetEaten)}</h3>
                  </div>
                  <div className="p-2.5 bg-white/20 print:hidden rounded-2xl backdrop-blur-sm">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                {/* Budget Progress Bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] mb-1 print:text-black">
                    <span className="opacity-80">Limit: {formatRp(BUDGET_CAP)}/bln</span>
                    <span className="font-bold">{budgetUsedPct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden print:border print:border-black">
                    <div className={`h-full transition-all duration-500 ${budgetColor} print:bg-black`} style={{ width: `${budgetUsedPct}%` }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 print:grid-cols-2 print:break-inside-avoid">
            {/* Leaderboard Customer */}
            <Card className="border-border/50 shadow-sm overflow-hidden print:border-black print:shadow-none">
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 border-b border-border print:border-black">
                <h3 className="font-bold text-sm flex items-center gap-2 print:text-black">
                  <Trophy className="w-4 h-4 text-amber-500 print:hidden" /> Top 5 Customer (Cost)
                </h3>
              </div>
              <div className="p-0">
                {sampleData.topCustomers.length === 0 ? (
                  <p className="text-center text-sm p-6 text-muted-foreground">Belum ada data</p>
                ) : (
                  <ul className="divide-y divide-border print:divide-black/20">
                    {sampleData.topCustomers.map(([cust, stats], idx) => (
                      <li key={cust} className="flex justify-between items-center p-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'} print:bg-transparent print:border print:text-black`}>{idx + 1}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 print:text-black truncate max-w-[120px]">{cust}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black">{formatRp(stats.cost)}</p>
                          <p className="text-[10px] text-muted-foreground print:text-black">{stats.pcs} pcs</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            {/* Leaderboard Product */}
            <Card className="border-border/50 shadow-sm overflow-hidden print:border-black print:shadow-none">
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 border-b border-border print:border-black">
                <h3 className="font-bold text-sm flex items-center gap-2 print:text-black">
                  <PieChart className="w-4 h-4 text-purple-500 print:hidden" /> Top 5 Produk Sampel (Qty)
                </h3>
              </div>
              <div className="p-0">
                {sampleData.topProducts.length === 0 ? (
                  <p className="text-center text-sm p-6 text-muted-foreground">Belum ada data</p>
                ) : (
                  <ul className="divide-y divide-border print:divide-black/20">
                    {sampleData.topProducts.map(([sku, stats], idx) => (
                      <li key={sku} className="flex justify-between items-center p-3 text-sm">
                        <div className="flex items-center gap-3">
                          <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-muted text-muted-foreground print:bg-transparent print:border print:text-black">{idx + 1}</span>
                          <span className="font-semibold text-primary print:text-black truncate max-w-[120px]">{sku}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black">{stats.pcs} pcs</p>
                          <p className="text-[10px] text-muted-foreground print:text-black">{formatRp(stats.cost)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>

            <Card className="border-border/50 shadow-sm overflow-hidden lg:col-span-3 print:col-span-2 print:border-black print:shadow-none">
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 border-b border-border flex justify-between items-center print:border-black print:bg-white">
                <h3 className="font-bold text-sm flex items-center gap-2 print:text-black">
                  <Gift className="w-4 h-4 text-primary print:hidden" />
                  Rincian Distribusi & Status Konversi
                </h3>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold print:border print:border-black print:text-black print:bg-transparent">
                  {sampleData.sampleItems.length} Transaksi
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold print:bg-transparent print:text-black print:border-b print:border-black">
                    <tr>
                      <th className="px-4 py-3">Tgl</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Produk Sampel</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Harga Asli</th>
                      <th className="px-4 py-3 text-right">Cost (Budget)</th>
                      <th className="px-4 py-3 text-center">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border print:divide-black/20 print:text-black">
                    {sampleData.sampleItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground print:text-black">
                          <Gift className="w-12 h-12 mx-auto mb-3 opacity-20 print:hidden" />
                          <p>Tidak ada sampel yang tercatat pada periode ini.</p>
                        </td>
                      </tr>
                    ) : (
                      sampleData.sampleItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-muted-foreground print:text-black whitespace-nowrap">
                            {item.date}
                          </td>
                          <td className="px-4 py-3 font-bold text-foreground print:text-black">
                            {item.customer}
                          </td>
                          <td className="px-4 py-3 font-medium text-primary print:text-black">
                            {item.sku}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-secondary px-2 py-0.5 rounded text-xs font-bold print:bg-transparent print:border print:border-black">
                              {item.qty}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-muted-foreground print:text-black text-xs">
                            {formatRp(item.basePrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-orange-600 dark:text-orange-400 print:text-black">
                            {formatRp(item.totalCost)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.isConverted ? (
                              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full text-[10px] font-bold print:bg-transparent print:border print:border-black print:text-black">
                                <CheckCircle2 className="w-3 h-3 print:hidden" /> Beli
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-full text-[10px] font-medium print:bg-transparent print:border print:border-black/50 print:text-black">
                                Belum
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
