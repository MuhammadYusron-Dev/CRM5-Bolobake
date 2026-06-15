"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Printer, AlertTriangle, CheckCircle2, Plus, Minus, FileSpreadsheet, User, ClipboardList, Info, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { BomCalculator } from './BomCalculator';

export function ProductionSchedule({ orders }: { orders: Order[] }) {
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [rejects, setRejects] = useState<Record<string, number>>({});
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [qcChecked, setQcChecked] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [hiddenNotes, setHiddenNotes] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'target' | 'bom'>('target');

  const [searchQuery, setSearchQuery] = useState('');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });

  const toggleNotes = (key: string) => {
    setHiddenNotes(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const saved = localStorage.getItem('bolobake_production_progress');
    if (saved) {
      try { setProgress(JSON.parse(saved)); } catch (e) {}
    }
    const savedRejects = localStorage.getItem('bolobake_production_rejects');
    if (savedRejects) {
      try { setRejects(JSON.parse(savedRejects)); } catch (e) {}
    }
    const savedAssignees = localStorage.getItem('bolobake_production_assignees');
    if (savedAssignees) {
      try { setAssignees(JSON.parse(savedAssignees)); } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  const updateProgress = (dateKey: string, sku: string, amount: number, max: number) => {
    setProgress(prev => {
      const key = `${dateKey}|${sku}`;
      const current = prev[key] || 0;
      const next = Math.max(0, Math.min(max, current + amount));
      const newState = { ...prev, [key]: next };
      localStorage.setItem('bolobake_production_progress', JSON.stringify(newState));
      return newState;
    });
  };

  const updateReject = (dateKey: string, sku: string, amount: number) => {
    setRejects(prev => {
      const key = `${dateKey}|${sku}`;
      const current = prev[key] || 0;
      const next = Math.max(0, current + amount);
      const newState = { ...prev, [key]: next };
      localStorage.setItem('bolobake_production_rejects', JSON.stringify(newState));
      return newState;
    });
  };

  const updateAssignee = (dateKey: string, sku: string, name: string) => {
    setAssignees(prev => {
      const key = `${dateKey}|${sku}`;
      const newState = { ...prev, [key]: name };
      localStorage.setItem('bolobake_production_assignees', JSON.stringify(newState));
      return newState;
    });
  };

  const setExactProgress = (dateKey: string, sku: string, exactAmount: number, max: number) => {
    setProgress(prev => {
      const key = `${dateKey}|${sku}`;
      // Allow user to temporarily type empty string or invalid number (handled by fallback to 0 in UI), but store valid bounds.
      const next = Math.max(0, Math.min(max, exactAmount));
      const newState = { ...prev, [key]: next };
      localStorage.setItem('bolobake_production_progress', JSON.stringify(newState));
      return newState;
    });
  };
  const scheduleData = useMemo(() => {
    const startObj = new Date(startDate);
    startObj.setHours(0, 0, 0, 0);
    const endObj = new Date(endDate);
    endObj.setHours(23, 59, 59, 999);

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

      // Filter based on selected date range
      if (prodDate >= startObj && prodDate <= endObj) {
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
    setIsModalOpen(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleExportExcel = () => {
    const headers = ['Tanggal Produksi', 'Nama Produk (SKU)', 'Target Qty', 'Qty Selesai', 'Status', 'Catatan Khusus'];
    const rows: any[][] = [headers];

    scheduleData.forEach(({ dateKey, items }) => {
      items.forEach(([sku, data]) => {
        const key = `${dateKey}|${sku}`;
        const doneQty = progress[key] || 0;
        const targetQty = data.qty;
        const isComplete = doneQty >= targetQty;
        const statusText = isComplete ? 'Selesai' : 'Belum Selesai';
        const notesText = data.notes.join('; ');

        rows.push([
          dateKey,
          sku,
          targetQty,
          doneQty,
          statusText,
          notesText
        ]);
      });
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    
    // Set auto widths for columns to make it instantly neat
    worksheet['!cols'] = [
      { wch: 15 }, // Tanggal
      { wch: 35 }, // SKU
      { wch: 12 }, // Target Qty
      { wch: 12 }, // Qty Selesai
      { wch: 15 }, // Status
      { wch: 50 }, // Notes
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Produksi");
    
    XLSX.writeFile(workbook, `rekap_produksi_${startDate}_to_${endDate}.xlsx`);
    
    setIsModalOpen(false);
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
      <div className="w-full p-4 sm:p-6 flex flex-col gap-6 print:bg-white print:p-0 print:w-full print:max-w-full">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-800 dark:text-slate-200 print:mb-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary print:text-black" />
            <h2 className="font-bold text-sm uppercase tracking-wider print:text-xl print:border-b-2 print:border-black print:pb-1">Sisa Target Produksi</h2>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('target')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'target' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Target Produk
              </button>
              <button 
                onClick={() => setViewMode('bom')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${viewMode === 'bom' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Kebutuhan Adonan & Bahan
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsReportModalOpen(true)} className="h-8 font-bold text-xs gap-2 border-primary/20 hover:bg-white">
              <ClipboardList className="w-3.5 h-3.5" />
              Laporan Harian
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="h-8 font-bold text-xs gap-2 border-primary/20 hover:bg-white">
              <Printer className="w-3.5 h-3.5" />
              Cetak
            </Button>
          </div>
        </div>
        
        {viewMode === 'bom' ? (
          <BomCalculator scheduleData={scheduleData} progress={progress} />
        ) : (
          <div className="flex flex-col gap-4">
            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 print:hidden">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari produk (SKU)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                <input 
                  type="checkbox"
                  checked={hideCompleted}
                  onChange={e => setHideCompleted(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                Sembunyikan Selesai (100%)
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-2 print:flex-wrap print:grid print:grid-cols-2 print:gap-8 print:overflow-visible">
            {scheduleData.map(({ dateKey, items }) => {
              let displayDate = dateKey;
              try {
                const [y, m, d] = dateKey.split('-');
                displayDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(parseInt(y), parseInt(m) - 1, parseInt(d)));
              } catch(e) {}

              // Apply Filters
              const filteredItems = items.filter(([sku, data]) => {
                const key = `${dateKey}|${sku}`;
                const doneQty = isLoaded ? (progress[key] || 0) : 0;
                const isComplete = doneQty >= data.qty;
                
                if (hideCompleted && isComplete) return false;
                if (searchQuery && !sku.toLowerCase().includes(searchQuery.toLowerCase())) return false;
                return true;
              });

              if (filteredItems.length === 0) return null;

              return (
                <Card key={dateKey} className="flex flex-col h-full border-primary/20 shadow-sm bg-white dark:bg-slate-950 print:break-inside-avoid print:shadow-none print:border print:border-black print:rounded-none">
                  <div className="bg-primary/10 border-b border-primary/10 p-3 rounded-t-xl text-center print:bg-slate-100 print:rounded-none print:border-black">
                    <span className="font-bold text-primary text-sm print:text-black print:text-base">{displayDate}</span>
                  </div>
                  <CardContent className="p-4 flex-1">
                    <div className="space-y-2 pr-1">
                      {filteredItems.map(([sku, data]) => {
                        const key = `${dateKey}|${sku}`;
                        const doneQty = isLoaded ? (progress[key] || 0) : 0;
                        const rejectQty = isLoaded ? (rejects[key] || 0) : 0;
                        const assigneeName = isLoaded ? (assignees[key] || '') : '';
                        const targetQty = data.qty;
                        const isComplete = doneQty >= targetQty;
                        const pct = Math.min(100, Math.round((doneQty / targetQty) * 100));
                        const yieldRate = (doneQty + rejectQty) > 0 ? Math.round((doneQty / (doneQty + rejectQty)) * 100) : 100;
                        const isExpanded = expandedItems[key];

                        return (
                        <div key={sku} className={`flex flex-col border-b pb-3 mb-3 last:border-0 last:pb-0 last:mb-0 transition-all ${isComplete ? 'border-green-100 dark:border-green-900/30' : 'border-slate-100 dark:border-slate-800'} print:border-black/20`}>
                          
                          {/* Compact Header (Clickable for Accordion) */}
                          <div 
                            className="cursor-pointer group flex flex-col gap-2"
                            onClick={() => toggleExpand(key)}
                          >
                            <div className="flex justify-between items-start text-xs print:text-sm">
                              <div className="flex-1 pr-2">
                                <span className={`font-bold print:text-black leading-snug block mb-1.5 ${isComplete ? 'text-green-700 dark:text-green-400 line-through opacity-70' : 'text-slate-800 dark:text-slate-200'}`}>
                                  {sku}
                                  {isComplete && <CheckCircle2 className="w-3.5 h-3.5 inline-block ml-1.5 text-green-600 print:hidden" />}
                                  {data.notes.length > 0 && (
                                    <span className={`inline-block ml-1.5 transition-colors ${hiddenNotes[key] ? 'text-red-300' : 'text-red-500'} print:text-black`} title="Klik untuk melihat catatan" onClick={(e) => { e.stopPropagation(); toggleNotes(key); }}>
                                      <AlertTriangle className="w-3.5 h-3.5 inline-block -mt-0.5" />
                                    </span>
                                  )}
                                </span>
                                
                                {/* Mini PIC & Progress Bar when collapsed */}
                                <div className="flex items-center gap-2 opacity-90 print:opacity-100">
                                  <div className="flex items-center gap-1 min-w-[70px] max-w-[90px] text-slate-500">
                                    <User className="w-3 h-3 text-slate-400" />
                                    <span className="text-[9px] font-medium truncate">{assigneeName || 'Belum diassign'}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex-1 print:border print:border-black/20">
                                    <div className={`h-full transition-all duration-300 ${isComplete ? 'bg-green-500 print:bg-black' : 'bg-primary print:bg-black/50'}`} style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                                <span className={`font-bold px-1.5 py-0.5 rounded print:bg-transparent print:text-black print:border print:border-black ${isComplete ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-primary'}`}>
                                  {targetQty}
                                </span>
                                <div className="p-1 rounded bg-slate-50 dark:bg-slate-900 group-hover:bg-slate-100 dark:group-hover:bg-slate-800 transition-colors print:hidden">
                                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" /> : <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300" />}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Expanded Content (Stepper, QC, Reject) */}
                          {(isExpanded || typeof window === 'undefined') && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 print:block print:border-black/20" onClick={(e) => e.stopPropagation()}>
                              
                              {/* Assignee Tracker */}
                              <div className="flex items-center gap-1.5 mb-2 mt-[-2px] print:hidden bg-slate-50 dark:bg-slate-900/50 px-2 py-1.5 rounded-md border border-slate-100 dark:border-slate-800">
                                <User className="w-3.5 h-3.5 text-primary/60" />
                                <input 
                                  type="text" 
                                  placeholder="Ketik nama Koki/PIC di sini..."
                                  value={assigneeName}
                                  onChange={(e) => updateAssignee(dateKey, sku, e.target.value)}
                                  className="flex-1 text-[10px] font-bold bg-transparent border-none outline-none focus:ring-0 p-0 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 h-4"
                                />
                              </div>

                              {/* Interactive Tracker */}
                              <div className="flex flex-col gap-2 mt-2 print:hidden">
                                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                  
                                  {/* Progres Stepper */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sukses</span>
                                    <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm overflow-hidden h-7">
                                      <button 
                                        onClick={() => updateProgress(dateKey, sku, -1, targetQty)}
                                        disabled={doneQty <= 0}
                                        className="px-2 h-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center transition-colors"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <input 
                                        type="number" 
                                        min={0} 
                                        max={targetQty}
                                        value={doneQty}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setExactProgress(dateKey, sku, val === '' ? 0 : parseInt(val), targetQty);
                                        }}
                                        className="w-10 h-full text-center text-xs font-bold border-x border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-inset focus:ring-1 focus:ring-primary bg-transparent text-slate-800 dark:text-slate-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      />
                                      <button 
                                        onClick={() => updateProgress(dateKey, sku, 1, targetQty)}
                                        disabled={isComplete}
                                        className="px-2 h-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center transition-colors"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* QC & MAX */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <label htmlFor={`qc-${key}`} className="flex items-center gap-1 text-[9px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-1 rounded cursor-pointer hover:bg-slate-50 shadow-sm transition-colors" title="Menandakan bahwa produk telah dicek sesuai standar sebelum dipindahkan ke Packing.">
                                      <input 
                                        type="checkbox" 
                                        id={`qc-${key}`}
                                        checked={qcChecked[key] || false}
                                        onChange={e => setQcChecked(prev => ({...prev, [key]: e.target.checked}))}
                                        className="w-3 h-3 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
                                      />
                                      Lolos QC <Info className="w-2.5 h-2.5 text-slate-400" />
                                    </label>
                                    <button 
                                      onClick={() => setExactProgress(dateKey, sku, targetQty, targetQty)}
                                      disabled={isComplete || !qcChecked[key]}
                                      className="h-6 px-2 flex items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-bold disabled:opacity-50 hover:bg-primary hover:text-white transition-colors shadow-sm uppercase"
                                      title={!qcChecked[key] ? "Centang Lolos QC terlebih dahulu" : "Selesaikan 100%"}
                                    >
                                      Max
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Reject Tracker */}
                                <div className="flex flex-wrap items-center justify-between gap-2 mt-1 px-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Reject
                                    </span>
                                    <div className="flex items-center bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-md overflow-hidden h-6 shadow-sm">
                                      <button 
                                        onClick={() => updateReject(dateKey, sku, -1)}
                                        disabled={rejectQty <= 0}
                                        className="px-2 h-full text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50 flex items-center justify-center transition-colors"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="w-6 text-center text-xs font-bold text-red-600 dark:text-red-400 py-0.5 border-x border-red-100 dark:border-red-900/30">
                                        {rejectQty}
                                      </span>
                                      <button 
                                        onClick={() => updateReject(dateKey, sku, 1)}
                                        className="px-2 h-full text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {rejectQty > 0 && (
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 cursor-help ${yieldRate >= 95 ? 'bg-green-50 text-green-600' : yieldRate >= 80 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`} title="Persentase jumlah produk sukses dibandingkan dengan total (sukses + reject).">
                                      Yield: {yieldRate}% <Info className="w-2.5 h-2.5 opacity-70" />
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {data.notes.length > 0 && !hiddenNotes[key] && (
                            <div className="mt-2 text-[10px] text-red-600 bg-red-50 p-1.5 rounded-md border border-red-100 print:text-sm print:font-medium print:text-black print:bg-transparent print:border-black/50 print:border-dashed">
                              <span className="font-bold block mb-0.5">Catatan Khusus:</span>
                              <ul className="list-disc pl-3 space-y-0.5">
                                {data.notes.map((note, i) => (
                                  <li key={i}>{note}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          </div>
        )}
      </div>

      {/* Export Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pengaturan Cetak & Ekspor</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tanggal Mulai</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between gap-2">
            <Button type="button" variant="outline" onClick={handleExportExcel} className="gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 flex-1">
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel (.xlsx)
            </Button>
            <Button type="button" onClick={handlePrint} className="gap-2 flex-1">
              <Printer className="w-4 h-4" />
              Cetak Kertas (PDF)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End of Day Report Modal */}
      <Dialog open={isReportModalOpen} onOpenChange={setIsReportModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="print:hidden">
            <DialogTitle>Laporan Akhir Shift Produksi</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col gap-4 py-2 print:p-0 print:m-0" id="print-report-area">
            <div className="text-center mb-4 border-b pb-4 dark:border-slate-800">
              <h2 className="text-xl font-bold uppercase tracking-wider text-slate-900 dark:text-white print:text-black">Laporan Harian Produksi</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 print:text-black">Tanggal: {startDate} s/d {endDate}</p>
            </div>
            
            <div className="space-y-6">
              {scheduleData.map(({ dateKey, items }) => {
                let totalTarget = 0;
                let totalDone = 0;
                let totalReject = 0;
                
                const tableRows = items.map(([sku, data]) => {
                  const key = `${dateKey}|${sku}`;
                  const target = data.qty;
                  const done = progress[key] || 0;
                  const reject = rejects[key] || 0;
                  const assign = assignees[key] || '-';
                  
                  totalTarget += target;
                  totalDone += done;
                  totalReject += reject;
                  
                  const yieldPct = (done + reject) > 0 ? Math.round((done / (done + reject)) * 100) : 100;
                  
                  return (
                    <tr key={sku} className="border-b text-xs border-slate-200 dark:border-slate-800 print:border-black/20">
                      <td className="py-2 pr-2 text-slate-800 dark:text-slate-200 print:text-black">{sku}</td>
                      <td className="py-2 px-2 text-center text-slate-600 dark:text-slate-400 print:text-black">{assign}</td>
                      <td className="py-2 px-2 text-center text-slate-800 dark:text-slate-200 print:text-black">{target}</td>
                      <td className="py-2 px-2 text-center text-green-600 dark:text-green-500 font-bold">{done}</td>
                      <td className="py-2 px-2 text-center text-red-600 dark:text-red-500 font-bold">{reject}</td>
                      <td className="py-2 pl-2 text-right text-slate-800 dark:text-slate-200 print:text-black">{yieldPct}%</td>
                    </tr>
                  );
                });

                const totalYield = (totalDone + totalReject) > 0 ? Math.round((totalDone / (totalDone + totalReject)) * 100) : 100;

                return (
                  <div key={dateKey} className="border rounded-lg p-4 dark:border-slate-800 print:border-black/20 print:shadow-none print:bg-white bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-sm mb-3 text-primary">{dateKey}</h3>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b text-xs text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-700 print:border-black/40 print:text-black">
                          <th className="pb-2 font-medium">Nama Produk</th>
                          <th className="pb-2 font-medium text-center">PIC</th>
                          <th className="pb-2 font-medium text-center">Target</th>
                          <th className="pb-2 font-medium text-center">Sukses</th>
                          <th className="pb-2 font-medium text-center">Reject</th>
                          <th className="pb-2 font-medium text-right">Yield</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows}
                      </tbody>
                      <tfoot>
                        <tr className="font-bold text-xs bg-slate-100/50 dark:bg-slate-800/50 print:bg-transparent border-t-2 border-slate-300 dark:border-slate-700 print:border-black/50 text-slate-800 dark:text-slate-200 print:text-black">
                          <td className="py-3 pr-2" colSpan={2}>TOTAL KESELURUHAN</td>
                          <td className="py-3 px-2 text-center">{totalTarget}</td>
                          <td className="py-3 px-2 text-center text-green-700 dark:text-green-500">{totalDone}</td>
                          <td className="py-3 px-2 text-center text-red-700 dark:text-red-500">{totalReject}</td>
                          <td className="py-3 pl-2 text-right">{totalYield}%</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-4 flex justify-between text-sm print:flex print:mt-16 text-slate-800 dark:text-slate-200 print:text-black">
              <div className="text-center w-40">
                <p className="mb-16 text-xs text-slate-500 dark:text-slate-400 print:text-black">Dibuat Oleh,</p>
                <p className="font-bold border-b border-black dark:border-slate-600 print:border-black">Kepala Produksi</p>
              </div>
              <div className="text-center w-40">
                <p className="mb-16 text-xs text-slate-500 dark:text-slate-400 print:text-black">Diketahui Oleh,</p>
                <p className="font-bold border-b border-black dark:border-slate-600 print:border-black">Manajer / Owner</p>
              </div>
            </div>
          </div>
          
          <DialogFooter className="sm:justify-end print:hidden">
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>Tutup</Button>
            <Button onClick={() => {
              window.print();
            }} className="gap-2">
              <Printer className="w-4 h-4" /> Cetak Laporan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
