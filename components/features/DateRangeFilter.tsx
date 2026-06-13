"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronDown, SlidersHorizontal, Check, X, RotateCcw } from 'lucide-react';

interface DateRangeFilterProps {
  filterStartDate: string;
  setFilterStartDate: (date: string) => void;
  filterEndDate: string;
  setFilterEndDate: (date: string) => void;
}

type FilterPreset = 
  | 'semua_waktu' | 'hari_ini' | 'kemarin' | '7_hari' | 'bulan_ini' | 'bulan_lalu'
  | 'q1' | 'q2' | 'q3' | 'q4'
  | 'tahun' | 'bulan_spesifik' | 'kustom';

export function DateRangeFilter({
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<FilterPreset>('semua_waktu');
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString());

  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine active preset based on dates on mount or when dates change externally
  useEffect(() => {
    if (!filterStartDate && !filterEndDate) {
      setActivePreset('semua_waktu');
    }
    // We could add more complex logic to detect other presets based on date ranges, 
    // but for simplicity, we'll mainly drive the dates from the preset selection.
  }, [filterStartDate, filterEndDate]);

  const applyPreset = (preset: FilterPreset, year = selectedYear, month = selectedMonth) => {
    setActivePreset(preset);
    const today = new Date();
    
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
      case 'semua_waktu':
        setFilterStartDate('');
        setFilterEndDate('');
        break;
      case 'hari_ini':
        setFilterStartDate(formatDate(today));
        setFilterEndDate(formatDate(today));
        break;
      case 'kemarin':
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        setFilterStartDate(formatDate(yesterday));
        setFilterEndDate(formatDate(yesterday));
        break;
      case '7_hari':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        setFilterStartDate(formatDate(sevenDaysAgo));
        setFilterEndDate(formatDate(today));
        break;
      case 'bulan_ini':
        const startThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setFilterStartDate(formatDate(startThisMonth));
        setFilterEndDate(formatDate(endThisMonth));
        break;
      case 'bulan_lalu':
        const startLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        setFilterStartDate(formatDate(startLastMonth));
        setFilterEndDate(formatDate(endLastMonth));
        break;
      case 'q1':
        setFilterStartDate(`${year}-01-01`);
        setFilterEndDate(`${year}-03-31`);
        break;
      case 'q2':
        setFilterStartDate(`${year}-04-01`);
        setFilterEndDate(`${year}-06-30`);
        break;
      case 'q3':
        setFilterStartDate(`${year}-07-01`);
        setFilterEndDate(`${year}-09-30`);
        break;
      case 'q4':
        setFilterStartDate(`${year}-10-01`);
        setFilterEndDate(`${year}-12-31`);
        break;
      case 'tahun':
        setFilterStartDate(`${year}-01-01`);
        setFilterEndDate(`${year}-12-31`);
        break;
      case 'bulan_spesifik':
        const sm = parseInt(month);
        const sy = parseInt(year);
        const startSpecific = new Date(sy, sm - 1, 1);
        const endSpecific = new Date(sy, sm, 0);
        setFilterStartDate(formatDate(startSpecific));
        setFilterEndDate(formatDate(endSpecific));
        break;
      case 'kustom':
        // Just keep the current dates but switch mode
        break;
    }
  };

  const presetLabels: Record<FilterPreset, string> = {
    semua_waktu: 'Semua Waktu',
    hari_ini: 'Hari Ini',
    kemarin: 'Kemarin',
    '7_hari': '7 Hari Terakhir',
    bulan_ini: 'Bulan Ini',
    bulan_lalu: 'Bulan Lalu',
    q1: 'Q1 (Jan-Mar)',
    q2: 'Q2 (Apr-Jun)',
    q3: 'Q3 (Jul-Sep)',
    q4: 'Q4 (Okt-Des)',
    tahun: `Tahun ${selectedYear}`,
    bulan_spesifik: 'Bulan Spesifik',
    kustom: 'Rentang Kustom'
  };

  const renderPresetButton = (preset: FilterPreset, label: string) => {
    const isActive = activePreset === preset;
    return (
      <button
        onClick={() => applyPreset(preset)}
        className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors ${
          isActive 
            ? 'bg-primary/10 border-primary text-primary font-semibold' 
            : 'bg-background border-border text-foreground hover:bg-muted'
        }`}
      >
        <span>{label}</span>
        {isActive && <Check className="w-4 h-4 text-primary" />}
      </button>
    );
  };

  const months = [
    { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' }, { value: '5', label: 'Mei' }, { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' }, { value: '8', label: 'Agu' }, { value: '9', label: 'Sep' },
    { value: '10', label: 'Okt' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Des' },
  ];

  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-background border border-border px-4 py-2 rounded-xl shadow-sm hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <CalendarIcon className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {activePreset === 'kustom' 
            ? `${filterStartDate || '...'} - ${filterEndDate || '...'}`
            : presetLabels[activePreset]}
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="text-sm font-bold text-foreground tracking-wide">FILTER WAKTU</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto">
            
            {/* Pilih Cepat */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Pilih Cepat</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {renderPresetButton('semua_waktu', 'Semua Waktu')}
                {renderPresetButton('hari_ini', 'Hari Ini')}
                {renderPresetButton('kemarin', 'Kemarin')}
                {renderPresetButton('7_hari', '7 Hari')}
                {renderPresetButton('bulan_ini', 'Bulan Ini')}
                {renderPresetButton('bulan_lalu', 'Bulan Lalu')}
              </div>
            </div>

            {/* Per Kuartal */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-3">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Per Kuartal ({selectedYear})</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {['q1', 'q2', 'q3', 'q4'].map((q) => {
                  const preset = q as FilterPreset;
                  const isActive = activePreset === preset;
                  return (
                    <button
                      key={q}
                      onClick={() => applyPreset(preset)}
                      className={`py-2 text-sm rounded-lg border transition-colors text-center font-medium ${
                        isActive 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {q.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Pilih Tahun */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Pilih Tahun</span>
                </div>
              </div>
              <div className="flex gap-2">
                <select 
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    if (activePreset === 'tahun') applyPreset('tahun', e.target.value);
                  }}
                  className="bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/50 flex-1"
                >
                  {[2024, 2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button
                  onClick={() => applyPreset('tahun')}
                  className={`px-4 py-2 text-sm rounded-lg border transition-colors font-medium ${
                    activePreset === 'tahun' 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-background border-border text-foreground hover:bg-muted'
                  }`}
                >
                  Terapkan
                </button>
              </div>
            </div>

            {/* Bulan Spesifik */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Bulan Spesifik</span>
                </div>
                <span className="bg-muted px-2 py-0.5 rounded text-[10px]">{selectedYear}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {months.map((m) => {
                  const isActive = activePreset === 'bulan_spesifik' && selectedMonth === m.value;
                  return (
                    <button
                      key={m.value}
                      onClick={() => {
                        setSelectedMonth(m.value);
                        applyPreset('bulan_spesifik', selectedYear, m.value);
                      }}
                      className={`py-1.5 text-xs rounded-lg border transition-colors text-center font-medium ${
                        isActive 
                          ? 'bg-primary/10 border-primary text-primary' 
                          : 'bg-background border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Kustom */}
            {activePreset === 'kustom' && (
              <div className="pt-2 border-t border-border mt-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-10">Mulai</span>
                    <input 
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="text-xs border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-primary/50 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-10">Akhir</span>
                    <input 
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="text-xs border border-border rounded-lg px-3 py-2 bg-background outline-none focus:ring-2 focus:ring-primary/50 flex-1"
                    />
                  </div>
                </div>
              </div>
            )}
            
          </div>

          <div className="p-3 border-t border-border bg-muted/10 grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                applyPreset('hari_ini');
                setIsOpen(false);
              }}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              onClick={() => setActivePreset('kustom')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                activePreset === 'kustom'
                  ? 'bg-primary/20 text-primary border-primary shadow-sm'
                  : 'bg-background border-border text-foreground hover:bg-muted'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Kustom
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl border border-transparent bg-primary text-primary-foreground shadow-md hover:bg-primary/90 transition-all"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
