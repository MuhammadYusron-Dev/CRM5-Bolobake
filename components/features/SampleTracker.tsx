"use client";

import React, { useState, useMemo } from 'react';
import { Gift, Calendar, Search, TrendingDown, Package, PieChart, Target, Trophy, Download, Printer, ShieldAlert, CheckCircle2, MessageSquare, Save, X, Clock } from 'lucide-react';
import { Order, Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Sidebar } from '@/components/layout/Sidebar';
import { DateRangeFilter } from './DateRangeFilter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SampleTrackerProps {
  initialOrders: Order[];
  initialCatalog: Product[];
}

export function SampleTracker({ initialOrders: serverOrders, initialCatalog }: SampleTrackerProps) {
  const [initialOrders, setInitialOrders] = useState<Order[]>(serverOrders);
  const [activeMenu, setActiveMenu] = useState('samples');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback Modal State
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    orderId: number;
    sku: string;
    customer: string;
    currentFeedback: string;
    currentStatus: string;
  } | null>(null);

  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  const BUDGET_CAP = 2000000;

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const sampleData = useMemo(() => {
    let totalBudgetEaten = 0;
    let totalSamplePcs = 0;
    const sampleItems: any[] = [];
    
    const customerStats: Record<string, { pcs: number, cost: number, clv: number }> = {};
    const productStats: Record<string, { pcs: number, cost: number }> = {};
    const sampleGivenMap: Record<string, Record<string, number>> = {};
    
    // First Pass: Calculate CLV (Customer Lifetime Value) - total spending of all time
    const clvMap: Record<string, number> = {};
    initialOrders.forEach(o => {
        if (!clvMap[o.customer]) clvMap[o.customer] = 0;
        clvMap[o.customer] += o.grandTotal || 0;
    });

    const parseDateToTime = (dateStr: any) => {
      if (!dateStr) return 0;
      const str = String(dateStr);
      const match1 = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (match1) return new Date(parseInt(match1[1]), parseInt(match1[2])-1, parseInt(match1[3])).getTime();
      const match2 = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match2) return new Date(parseInt(match2[3]), parseInt(match2[2])-1, parseInt(match2[1])).getTime();
      try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) return d.getTime();
      } catch (e) {}
      return 0;
    };

    const startTime = parseDateToTime(filterStartDate);
    const endTime = parseDateToTime(filterEndDate);

    const allOrders = initialOrders.map(order => {
      let orderDate = order.productionDate;
      if (!orderDate) {
        try { orderDate = new Date(order.timestamp || '').toISOString().split('T')[0]; } catch (e) { orderDate = '2026-01-01'; }
      }
      return { ...order, parsedTime: parseDateToTime(orderDate), strDate: orderDate };
    }).sort((a, b) => a.parsedTime - b.parsedTime);

    let totalConvertDays = 0;
    let convertedCountForAvg = 0;

    allOrders.forEach(order => {
      const orderTime = order.parsedTime;
      const cust = order.customer;
      
      const items = order.items || [];
      items.forEach(item => {
        const isSample = item.sku.includes('(sample)');
        const baseSku = item.sku.replace(' (sample)', '').replace('(sample) ', '');
        
        if (isSample) {
            if (!sampleGivenMap[cust]) sampleGivenMap[cust] = {};
            if (!sampleGivenMap[cust][baseSku]) {
                sampleGivenMap[cust][baseSku] = orderTime;
            }
            
            // Check filters for displaying in table
            const withinDate = (!startTime || orderTime >= startTime) && (!endTime || orderTime <= endTime);
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
                    originalSku: item.sku,
                    qty: item.qty,
                    basePrice: Number(item.price),
                    totalCost: cost,
                    isConverted: false,
                    convertDays: 0,
                    feedback: item.sampleFeedback || '',
                    status: item.sampleStatus || 'Pending'
                });
                
                if (!customerStats[cust]) customerStats[cust] = { pcs: 0, cost: 0, clv: clvMap[cust] || 0 };
                customerStats[cust].pcs += item.qty;
                customerStats[cust].cost += cost;
                
                if (!productStats[baseSku]) productStats[baseSku] = { pcs: 0, cost: 0 };
                productStats[baseSku].pcs += item.qty;
                productStats[baseSku].cost += cost;
            }
        } else {
            // Conversion Check
            if (sampleGivenMap[cust] && sampleGivenMap[cust][baseSku]) {
                if (orderTime > sampleGivenMap[cust][baseSku]) { 
                    const daysToConvert = Math.round((orderTime - sampleGivenMap[cust][baseSku]) / (1000 * 3600 * 24));
                    
                    sampleItems.filter(s => s.customer === cust && s.sku === baseSku).forEach(s => {
                        if (!s.isConverted) {
                            s.isConverted = true;
                            s.convertDays = daysToConvert;
                            totalConvertDays += daysToConvert;
                            convertedCountForAvg++;
                        }
                    });
                }
            }
        }
      });
    });

    sampleItems.sort((a, b) => b.orderId - a.orderId); // Newest first
    
    const convertedCount = sampleItems.filter(s => s.isConverted).length;
    const conversionRate = sampleItems.length > 0 ? (convertedCount / sampleItems.length) * 100 : 0;
    const avgConvertDays = convertedCountForAvg > 0 ? (totalConvertDays / convertedCountForAvg) : 0;
    
    const topCustomers = Object.entries(customerStats).sort((a, b) => b[1].cost - a[1].cost).slice(0, 5);
    const topProducts = Object.entries(productStats).sort((a, b) => b[1].pcs - a[1].pcs).slice(0, 5);

    return { totalBudgetEaten, totalSamplePcs, sampleItems, conversionRate, convertedCount, topCustomers, topProducts, avgConvertDays };
  }, [initialOrders, filterStartDate, filterEndDate, searchQuery]);

  const budgetUsedPct = Math.min((sampleData.totalBudgetEaten / BUDGET_CAP) * 100, 100);
  const budgetColor = budgetUsedPct > 90 ? 'bg-red-500' : budgetUsedPct > 75 ? 'bg-orange-500' : 'bg-emerald-500';
  const isOverBudget = sampleData.totalBudgetEaten > BUDGET_CAP;

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Tgl Produksi,Customer,Produk Sampel,Qty,Harga Asli,Cost (Budget),Status Konversi,Waktu Konversi (Hari),Status Follow-Up,Feedback\n";
    
    sampleData.sampleItems.forEach(item => {
      const status = item.isConverted ? "Berhasil (Beli)" : "Belum Konversi";
      const convertDays = item.isConverted ? item.convertDays : "";
      csvContent += `${item.date},"${item.customer}","${item.sku}",${item.qty},${item.basePrice},${item.totalCost},"${status}",${convertDays},"${item.status}","${item.feedback}"\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Sampel_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveFeedback = async () => {
    if (!feedbackModal) return;
    setIsSavingFeedback(true);

    try {
      const orderIndex = initialOrders.findIndex(o => o.id === feedbackModal.orderId);
      if (orderIndex === -1) throw new Error("Order not found");
      const order = initialOrders[orderIndex];

      const updatedItems = order.items.map(item => {
        if (item.sku === feedbackModal.sku) {
          return {
            ...item,
            sampleFeedback: feedbackModal.currentFeedback,
            sampleStatus: feedbackModal.currentStatus
          };
        }
        return item;
      });

      const updatedOrder = { ...order, items: updatedItems };

      const response = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedOrder)
      });

      if (!response.ok) throw new Error("Failed to save feedback");

      setInitialOrders(prev => prev.map(o => o.id === feedbackModal.orderId ? updatedOrder : o));
      setFeedbackModal(null);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan feedback. Periksa koneksi.");
    } finally {
      setIsSavingFeedback(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Positive': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Negative': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400';
      case 'Followed Up': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400';
    }
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
          
          <div className="hidden print:block mb-8 border-b-2 border-black pb-4 text-black">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-center">Laporan CRM Sampel Produk</h1>
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
                    <p className="text-blue-100 print:text-black font-medium text-[11px] mb-1 uppercase tracking-wider">Tingkat Konversi (ROI)</p>
                    <h3 className="text-3xl font-bold">{sampleData.conversionRate.toFixed(1)}<span className="text-lg font-normal opacity-80">%</span></h3>
                    <p className="text-xs text-blue-100 print:text-black mt-1">{sampleData.convertedCount} dari {sampleData.sampleItems.length} Sales</p>
                  </div>
                  <div className="p-2.5 bg-white/20 print:hidden rounded-2xl backdrop-blur-sm">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Time to Conversion */}
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg print:border print:border-black print:text-black print:bg-none print:shadow-none">
              <CardContent className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-indigo-100 print:text-black font-medium text-[11px] mb-1 uppercase tracking-wider">Avg Time-to-Convert</p>
                    <h3 className="text-3xl font-bold">{sampleData.avgConvertDays.toFixed(1)} <span className="text-lg font-normal opacity-80">Hari</span></h3>
                    <p className="text-[10px] text-indigo-100 print:text-black mt-1">Rata-rata waktu order rutin</p>
                  </div>
                  <div className="p-2.5 bg-white/20 print:hidden rounded-2xl backdrop-blur-sm">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Total Anggaran */}
            <Card className={`bg-gradient-to-br ${isOverBudget ? 'from-red-600 to-rose-700' : 'from-orange-500 to-red-600'} text-white border-0 shadow-lg print:border print:border-black print:text-black print:bg-none print:shadow-none lg:col-span-2`}>
              <CardContent className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-orange-100 print:text-black font-medium text-xs mb-1 uppercase tracking-wider flex items-center gap-1.5">
                      Budget Terpakai {isOverBudget && <ShieldAlert className="w-3.5 h-3.5 text-yellow-300 print:hidden animate-pulse" />}
                    </p>
                    <h3 className="text-2xl font-bold">{formatRp(sampleData.totalBudgetEaten)} <span className="text-sm opacity-80 font-normal ml-1">({sampleData.totalSamplePcs} pcs)</span></h3>
                  </div>
                  <div className="p-2.5 bg-white/20 print:hidden rounded-2xl backdrop-blur-sm">
                    <TrendingDown className="w-6 h-6 text-white" />
                  </div>
                </div>
                
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:break-inside-avoid">
            {/* Leaderboard Customer + CLV */}
            <Card className="border-border/50 shadow-sm overflow-hidden print:border-black print:shadow-none">
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 border-b border-border print:border-black">
                <h3 className="font-bold text-sm flex items-center gap-2 print:text-black">
                  <Trophy className="w-4 h-4 text-amber-500 print:hidden" /> Top 5 Customer (vs CLV)
                </h3>
              </div>
              <div className="p-0">
                {sampleData.topCustomers.length === 0 ? (
                  <p className="text-center text-sm p-6 text-muted-foreground">Belum ada data</p>
                ) : (
                  <ul className="divide-y divide-border print:divide-black/20">
                    {sampleData.topCustomers.map(([cust, stats], idx) => {
                      const clvRatio = stats.clv > 0 ? (stats.cost / stats.clv) * 100 : 0;
                      return (
                        <li key={cust} className="flex justify-between items-center p-3 text-sm">
                          <div className="flex items-center gap-3">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${idx === 0 ? 'bg-amber-100 text-amber-700' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground'} print:bg-transparent print:border print:text-black`}>{idx + 1}</span>
                            <div className="flex flex-col">
                               <span className="font-semibold text-slate-700 dark:text-slate-300 print:text-black truncate max-w-[120px]">{cust}</span>
                               <span className="text-[9px] text-muted-foreground print:text-black">CLV: {formatRp(stats.clv)}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <p className="font-bold text-slate-800 dark:text-slate-200 print:text-black">{formatRp(stats.cost)}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${clvRatio > 10 ? 'bg-red-100 text-red-600 print:border-black print:border' : 'bg-green-100 text-green-700 print:border-black print:border'}`}>{clvRatio.toFixed(1)}% Ratio</span>
                          </div>
                        </li>
                      )
                    })}
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
                          <span className="font-semibold text-primary print:text-black truncate max-w-[150px]">{sku}</span>
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

            {/* Rincian Feedback & Tabel */}
            <Card className="border-border/50 shadow-sm overflow-hidden lg:col-span-2 print:col-span-2 print:border-black print:shadow-none">
              <div className="bg-slate-100/50 dark:bg-slate-900/50 p-4 border-b border-border flex justify-between items-center print:border-black print:bg-white">
                <h3 className="font-bold text-sm flex items-center gap-2 print:text-black">
                  <MessageSquare className="w-4 h-4 text-primary print:hidden" />
                  Rincian Distribusi & Feedback Pelanggan
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold print:bg-transparent print:text-black print:border-b print:border-black">
                    <tr>
                      <th className="px-4 py-3">Tgl</th>
                      <th className="px-4 py-3">Customer & Produk</th>
                      <th className="px-4 py-3 text-center">ROI</th>
                      <th className="px-4 py-3">Status Follow-up</th>
                      <th className="px-4 py-3">Feedback</th>
                      <th className="px-4 py-3 text-center print:hidden">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border print:divide-black/20 print:text-black">
                    {sampleData.sampleItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground print:text-black">
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
                          <td className="px-4 py-3">
                            <div className="font-bold text-foreground print:text-black">{item.customer}</div>
                            <div className="text-[11px] font-medium text-primary print:text-black">{item.sku} <span className="text-muted-foreground font-normal">({item.qty} pcs - {formatRp(item.totalCost)})</span></div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {item.isConverted ? (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full text-[10px] font-bold print:bg-transparent print:border print:border-black print:text-black">
                                  <CheckCircle2 className="w-3 h-3 print:hidden" /> Beli
                                </span>
                                <span className="text-[9px] text-muted-foreground mt-0.5">{item.convertDays} hr kmdn</span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 px-2 py-1 rounded-full text-[10px] font-medium print:bg-transparent print:border print:border-black/50 print:text-black">
                                Belum
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-block border px-2 py-1 rounded-md text-[10px] font-bold ${getStatusColor(item.status)} print:border-black print:text-black print:bg-transparent`}>
                               {item.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300 italic max-w-[200px] truncate print:whitespace-normal print:text-black">
                            {item.feedback || "-"}
                          </td>
                          <td className="px-4 py-3 text-center print:hidden">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-[10px] font-bold px-2"
                              onClick={() => setFeedbackModal({
                                orderId: item.orderId,
                                sku: item.originalSku,
                                customer: item.customer,
                                currentFeedback: item.feedback,
                                currentStatus: item.status
                              })}
                            >
                              <MessageSquare className="w-3 h-3 mr-1.5" /> Catat
                            </Button>
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

      {/* Modal Feedback */}
      <Dialog open={!!feedbackModal} onOpenChange={(open) => !open && setFeedbackModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tindak Lanjut & Feedback Sampel</DialogTitle>
          </DialogHeader>
          {feedbackModal && (
            <div className="flex flex-col gap-4 py-4">
               <div>
                 <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Customer</p>
                 <p className="font-semibold">{feedbackModal.customer}</p>
               </div>
               <div>
                 <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Produk Sampel</p>
                 <p className="font-semibold text-primary">{feedbackModal.sku.replace('(sample)','').trim()}</p>
               </div>
               
               <div className="space-y-2 mt-2">
                 <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Status Follow-up</label>
                 <div className="flex flex-wrap gap-2">
                   {['Pending', 'Followed Up', 'Positive', 'Negative'].map(status => (
                     <button
                       key={status}
                       onClick={() => setFeedbackModal(prev => prev ? {...prev, currentStatus: status} : null)}
                       className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${feedbackModal.currentStatus === status ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted text-foreground border-border'}`}
                     >
                       {status}
                     </button>
                   ))}
                 </div>
               </div>

               <div className="space-y-2 mt-2">
                 <label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Catatan Feedback / Komentar</label>
                 <textarea
                   className="w-full h-24 p-3 bg-muted/50 border border-border rounded-xl text-sm focus-visible:ring-1 focus-visible:ring-primary outline-none"
                   placeholder="Contoh: Customer suka tapi harganya masih kemahalan..."
                   value={feedbackModal.currentFeedback}
                   onChange={e => setFeedbackModal(prev => prev ? {...prev, currentFeedback: e.target.value} : null)}
                 />
               </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setFeedbackModal(null)} disabled={isSavingFeedback}>Batal</Button>
            <Button onClick={handleSaveFeedback} disabled={isSavingFeedback}>
              {isSavingFeedback ? 'Menyimpan...' : <><Save className="w-4 h-4 mr-2" /> Simpan Feedback</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
