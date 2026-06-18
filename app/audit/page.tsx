"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ShieldAlert, Search, RefreshCw, X, Filter, ChevronDown, ArrowRightLeft, Trash2, Plus, LogIn, LogOut, RotateCcw, ShoppingCart, Package, Settings } from 'lucide-react';

interface AuditLog {
  log_id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  module: string;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  before_data: string;
  after_data: string;
  snapshot: string;
  _is_legacy?: boolean;
}

const MODULE_OPTIONS = ['Semua', 'ORDER', 'CATALOG', 'INVENTORY', 'SYSTEM'];
const ACTION_OPTIONS = ['Semua', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT', 'FAILED_LOGIN'];

const MODULE_LABELS: Record<string, string> = {
  ORDER: 'Pesanan', CATALOG: 'Katalog', INVENTORY: 'Inventory', SYSTEM: 'Sistem', PRODUCTION: 'Produksi', SALES: 'Penjualan',
};
const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Buat Baru', UPDATE: 'Perbarui', DELETE: 'Hapus', STATUS_CHANGE: 'Ubah Status',
  LOGIN: 'Login', LOGOUT: 'Logout', FAILED_LOGIN: 'Login Gagal',
};

function getActionIcon(action: string) {
  switch (action) {
    case 'CREATE': return <Plus className="w-3.5 h-3.5" />;
    case 'UPDATE': return <ArrowRightLeft className="w-3.5 h-3.5" />;
    case 'DELETE': return <Trash2 className="w-3.5 h-3.5" />;
    case 'STATUS_CHANGE': return <RotateCcw className="w-3.5 h-3.5" />;
    case 'LOGIN': return <LogIn className="w-3.5 h-3.5" />;
    case 'LOGOUT': return <LogOut className="w-3.5 h-3.5" />;
    case 'FAILED_LOGIN': return <ShieldAlert className="w-3.5 h-3.5" />;
    default: return <Settings className="w-3.5 h-3.5" />;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'CREATE': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'DELETE': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
    case 'STATUS_CHANGE': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'LOGIN': return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
    case 'LOGOUT': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
    case 'FAILED_LOGIN': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800';
    default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  }
}

function getModuleIcon(module: string) {
  switch (module) {
    case 'ORDER': return <ShoppingCart className="w-3.5 h-3.5" />;
    case 'CATALOG': return <Package className="w-3.5 h-3.5" />;
    case 'INVENTORY': return <Package className="w-3.5 h-3.5" />;
    case 'SYSTEM': return <Settings className="w-3.5 h-3.5" />;
    default: return null;
  }
}

/**
 * Parses a log entry to extract a human-readable description.
 * Handles both v2 (structured) and v1 (legacy) formats.
 */
function getLogDisplay(log: AuditLog): { title: string; detail: string; action: string; module: string } {
  // V2 format: structured description is available
  if (log.description) {
    return {
      title: log.description,
      detail: '',
      action: log.action,
      module: log.module,
    };
  }

  // V1 Legacy format: parse from old columns
  let rawAction = log.module; // In v1, module column had action_type
  let rawDetails = log.action; // In v1, action column had details JSON
  
  // Detect if module column contains JSON (v1 misalignment)
  if (rawAction && (rawAction.startsWith('{') || rawAction.startsWith('['))) {
    rawDetails = rawAction;
    rawAction = '';
  }

  let title = rawAction || 'Aktivitas Sistem';
  let detail = '';

  try {
    const parsed = JSON.parse(rawDetails || '{}');
    if (parsed.customer && parsed.items) {
      const orderAction = rawAction === 'EDIT_ORDER' ? 'Mengedit Pesanan' : 'Membuat Pesanan Baru';
      const totalPcs = parsed.totalPcs || parsed.items.reduce((acc: number, i: any) => acc + (Number(i.qty) || 0), 0);
      const itemsList = parsed.items.map((i: any) => `${i.qty}x ${i.sku}`).join(', ');
      title = `${orderAction} untuk ${parsed.customer}`;
      detail = `${totalPcs} Pcs - ${itemsList}`;
      if (parsed.grandTotal) {
        detail += ` (Total: Rp ${parsed.grandTotal.toLocaleString('id-ID')})`;
      }
    }
  } catch (e) {
    // Not JSON
  }

  if (title === 'CREATE_ORDER') title = 'Membuat Pesanan Baru';
  if (title === 'EDIT_ORDER') title = 'Mengedit Pesanan';

  return { title, detail, action: rawAction.includes('DELETE') ? 'DELETE' : rawAction.includes('EDIT') ? 'UPDATE' : 'CREATE', module: 'ORDER' };
}

/**
 * Renders a Before → After comparison table from JSON strings.
 */
function DiffView({ beforeStr, afterStr }: { beforeStr: string; afterStr: string }) {
  let before: Record<string, any> = {};
  let after: Record<string, any> = {};
  try { before = JSON.parse(beforeStr); } catch (e) {}
  try { after = JSON.parse(afterStr); } catch (e) {}

  const allKeys = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(
    k => k !== 'items' && k !== 'id' && k !== 'rowNumber' && k !== 'timestamp' && k !== 'rowIndex'
  );
  const changedKeys = allKeys.filter(k => JSON.stringify(before[k]) !== JSON.stringify(after[k]));

  if (changedKeys.length === 0) return <p className="text-xs text-slate-400 italic">Tidak ada perubahan field yang terdeteksi.</p>;

  const labels: Record<string, string> = {
    customer: 'Customer', grandTotal: 'Grand Total', totalPcs: 'Total Pcs', productionDate: 'Tgl Produksi',
    deliveryDate: 'Tgl Pengiriman', status: 'Status', nama: 'Nama Produk', harga: 'Harga', kategori: 'Kategori',
    satuan: 'Satuan', aktif: 'Status Aktif', notes: 'Catatan', shippingCost: 'Ongkir', sku: 'SKU',
    availableStock: 'Stok Tersedia', addedStock: 'Stok Ditambahkan', email: 'Email',
  };

  const fmt = (key: string, val: any) => {
    if (val === undefined || val === null || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Ya' : 'Tidak';
    if (['grandTotal', 'harga', 'shippingCost', 'subtotal'].includes(key)) return `Rp ${Number(val).toLocaleString('id-ID')}`;
    return String(val);
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400">
            <th className="px-3 py-2 text-left font-semibold">Field</th>
            <th className="px-3 py-2 text-left font-semibold text-red-500">Sebelum</th>
            <th className="px-3 py-2 text-left font-semibold text-emerald-500">Sesudah</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {changedKeys.map(key => (
            <tr key={key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
              <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">{labels[key] || key}</td>
              <td className="px-3 py-2 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/10">{fmt(key, before[key])}</td>
              <td className="px-3 py-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10">{fmt(key, after[key])}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Renders a snapshot data view (for DELETE events).
 */
function SnapshotView({ snapshotStr }: { snapshotStr: string }) {
  let data: Record<string, any> = {};
  try { data = JSON.parse(snapshotStr); } catch (e) { return <p className="text-xs text-slate-400 italic">Data snapshot tidak tersedia.</p>; }

  const labels: Record<string, string> = {
    customer: 'Customer', grandTotal: 'Grand Total', totalPcs: 'Total Pcs', id: 'ID', nama: 'Nama Produk',
    harga: 'Harga', kategori: 'Kategori', satuan: 'Satuan', aktif: 'Status', status: 'Status Order',
    productionDate: 'Tgl Produksi', deliveryDate: 'Tgl Pengiriman', totalOrders: 'Total Pesanan', totalOmset: 'Total Omset',
    deliveryNotes: 'Catatan Kirim', sku: 'SKU',
  };

  const fmt = (key: string, val: any) => {
    if (val === undefined || val === null || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Ya' : 'Tidak';
    if (['grandTotal', 'harga', 'shippingCost', 'totalOmset'].includes(key)) return `Rp ${Number(val).toLocaleString('id-ID')}`;
    if (Array.isArray(val)) return val.map((i: any) => `${i.qty}x ${i.sku}`).join(', ');
    return String(val);
  };

  const keys = Object.keys(data);

  return (
    <div className="rounded-lg border border-red-200 dark:border-red-800/50 overflow-hidden bg-red-50/30 dark:bg-red-900/10">
      <div className="px-3 py-2 bg-red-100/50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/50">
        <span className="text-xs font-bold text-red-600 dark:text-red-400">📋 Data yang Dihapus</span>
      </div>
      <div className="p-3 space-y-1.5">
        {keys.map(key => (
          <div key={key} className="flex gap-2 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-400 min-w-[100px] shrink-0">{labels[key] || key}:</span>
            <span className="text-slate-800 dark:text-slate-200">{fmt(key, data[key])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [filterModule, setFilterModule] = useState('Semua');
  const [filterAction, setFilterAction] = useState('Semua');

  // Detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    const display = getLogDisplay(log);
    const textMatch =
      (log.user_name || log.user_id).toLowerCase().includes(q) ||
      display.title.toLowerCase().includes(q) ||
      display.detail.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q);

    const moduleMatch = filterModule === 'Semua' || display.module === filterModule;
    const actionMatch = filterAction === 'Semua' || display.action === filterAction;

    return textMatch && moduleMatch && actionMatch;
  });

  const activeFilterCount = (filterModule !== 'Semua' ? 1 : 0) + (filterAction !== 'Semua' ? 1 : 0);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar activeMenu="audit" setActiveMenu={() => {}} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-600 to-slate-900 dark:from-slate-200 dark:to-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              Audit Logs
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => fetchLogs(false)}
              className={`p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isRefreshing}
              title="Refresh Logs"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col" style={{ minHeight: 'calc(100vh - 180px)' }}>
            {/* Filter Bar */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rekam Jejak Operasional</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Log aktivitas real-time dari seluruh admin & sistem.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari user, aksi, atau detail..."
                    className="pl-10 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-slate-500 focus:border-slate-500 dark:text-white sm:text-sm h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterModule}
                  onChange={(e) => setFilterModule(e.target.value)}
                  className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:ring-slate-400 focus:border-slate-400"
                >
                  {MODULE_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt === 'Semua' ? '🏷️ Semua Modul' : `${MODULE_LABELS[opt] || opt}`}</option>
                  ))}
                </select>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 px-3 py-1.5 focus:ring-slate-400 focus:border-slate-400"
                >
                  {ACTION_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt === 'Semua' ? '⚡ Semua Aksi' : `${ACTION_LABELS[opt] || opt}`}</option>
                  ))}
                </select>
                {activeFilterCount > 0 && (
                  <button
                    onClick={() => { setFilterModule('Semua'); setFilterAction('Semua'); }}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <X className="w-3 h-3" /> Reset Filter ({activeFilterCount})
                  </button>
                )}
                <span className="text-xs text-slate-400 ml-auto">{filteredLogs.length} log ditemukan</span>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
                  <div className="flex flex-col items-center">
                    <RefreshCw className="w-8 h-8 text-slate-500 animate-spin mb-2" />
                    <span className="text-slate-600 dark:text-slate-400 font-medium text-sm">Memuat Log...</span>
                  </div>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  Tidak ada log yang ditemukan.
                </div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-5 py-3.5 w-44">Waktu</th>
                      <th className="px-5 py-3.5 w-36">User</th>
                      <th className="px-5 py-3.5 w-24">Modul</th>
                      <th className="px-5 py-3.5 w-28">Aksi</th>
                      <th className="px-5 py-3.5">Aktivitas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredLogs.map((log, idx) => {
                      const display = getLogDisplay(log);
                      const hasDetail = log.before_data || log.after_data || log.snapshot;

                      return (
                        <tr
                          key={log.log_id || idx}
                          onClick={() => hasDetail && setSelectedLog(log)}
                          className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group ${hasDetail ? 'cursor-pointer' : ''}`}
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium align-top">
                            {log.timestamp}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap align-top">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-[10px] shrink-0">
                                {(log.user_name || log.user_id || 'A')[0].toUpperCase()}
                              </div>
                              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                                {log.user_name || log.user_id || 'Admin'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 align-top">
                            {display.module && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                {getModuleIcon(display.module)}
                                {MODULE_LABELS[display.module] || display.module}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 align-top">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionColor(display.action)}`}>
                              {getActionIcon(display.action)}
                              {ACTION_LABELS[display.action] || display.action}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 align-top">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-snug">
                                {display.title}
                              </span>
                              {display.detail && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  {display.detail}
                                </span>
                              )}
                              {hasDetail && (
                                <span className="text-[10px] text-blue-500 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                                  Klik untuk lihat detail →
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedLog(null)}>
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${getActionColor(getLogDisplay(selectedLog).action)}`}>
                    {getActionIcon(getLogDisplay(selectedLog).action)}
                    {ACTION_LABELS[getLogDisplay(selectedLog).action] || getLogDisplay(selectedLog).action}
                  </span>
                  {getLogDisplay(selectedLog).module && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      {MODULE_LABELS[getLogDisplay(selectedLog).module] || getLogDisplay(selectedLog).module}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                  {getLogDisplay(selectedLog).title}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>🕐 {selectedLog.timestamp}</span>
                  <span>👤 {selectedLog.user_name || selectedLog.user_id || 'Admin'}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-auto space-y-4">
              {/* Before → After Diff */}
              {(selectedLog.before_data || selectedLog.after_data) && selectedLog.action !== 'DELETE' && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Perubahan Data (Before → After)</h4>
                  <DiffView beforeStr={selectedLog.before_data} afterStr={selectedLog.after_data} />
                </div>
              )}

              {/* Snapshot (for DELETE) */}
              {selectedLog.snapshot && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Snapshot Data</h4>
                  <SnapshotView snapshotStr={selectedLog.snapshot} />
                </div>
              )}

              {/* After Data only (for CREATE) */}
              {selectedLog.after_data && !selectedLog.before_data && selectedLog.action !== 'DELETE' && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Data yang Dibuat</h4>
                  <SnapshotView snapshotStr={selectedLog.after_data} />
                </div>
              )}

              {selectedLog.entity_id && (
                <div className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
                  Entity ID: <span className="font-mono">{selectedLog.entity_id}</span> · Log ID: <span className="font-mono">{selectedLog.log_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
