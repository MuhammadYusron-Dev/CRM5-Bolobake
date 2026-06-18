"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ShieldAlert, Search, RefreshCw } from 'lucide-react';

interface AuditLog {
  log_id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action_type: string;
  details: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    
    // Polling every 10 seconds for real-time updates
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      (log.user_name || log.user_id).toLowerCase().includes(q) ||
      log.action_type.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q)
    );
  });

  const formatJsonDetails = (detailsStr: string) => {
    try {
      const parsed = JSON.parse(detailsStr);
      return (
        <pre className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap bg-gray-100 dark:bg-gray-900/50 p-2 rounded border border-gray-200 dark:border-gray-700">
          {JSON.stringify(parsed, null, 2)}
        </pre>
      );
    } catch (e) {
      // Not JSON or plain string
      return <span className="text-sm text-gray-700 dark:text-gray-300">{detailsStr}</span>;
    }
  };

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

        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rekam Jejak Operasional</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Log aktivitas real-time dari seluruh admin.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari user, aksi, atau detail..."
                  className="pl-10 w-full rounded-xl border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-slate-500 focus:border-slate-500 dark:text-white sm:text-sm h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

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
                      <th className="px-6 py-4 w-48">Waktu</th>
                      <th className="px-6 py-4 w-40">User</th>
                      <th className="px-6 py-4">Aktivitas & Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredLogs.map((log, idx) => {
                      // Fix misalignment for old logs
                      let rawAction = log.action_type;
                      let rawDetails = log.details;
                      if (rawAction.startsWith('{') || rawAction.startsWith('[')) {
                        rawDetails = rawAction;
                        rawAction = '-';
                      }

                      let actionTitle = rawAction || 'Aktivitas Sistem';
                      let detailText = rawDetails;
                      let isJson = false;

                      try {
                        const parsed = JSON.parse(rawDetails);
                        isJson = true;

                        // Order Created / Edited
                        if (parsed.customer && parsed.items) {
                          const orderAction = rawAction === 'EDIT_ORDER' ? 'Mengedit Pesanan' : 'Membuat Pesanan Baru';
                          const totalPcs = parsed.totalPcs || parsed.items.reduce((acc: number, i: any) => acc + (Number(i.qty) || 0), 0);
                          const itemsList = parsed.items.map((i: any) => `${i.qty}x ${i.sku}`).join(', ');
                          
                          actionTitle = `${orderAction} untuk ${parsed.customer}`;
                          detailText = `${totalPcs} Pcs - ${itemsList}`;
                          if (parsed.grandTotal) {
                             detailText += ` (Total: Rp ${parsed.grandTotal.toLocaleString('id-ID')})`;
                          }
                        } 
                        // Inventory Adjustment
                        else if (parsed.sku && parsed.addedStock !== undefined) {
                          actionTitle = 'Penyesuaian Stok Manual';
                          const sign = parsed.addedStock >= 0 ? '+' : '';
                          detailText = `Menambahkan ${sign}${parsed.addedStock} stok untuk SKU: ${parsed.sku}`;
                        }
                        // Order Status Update
                        else if (parsed.orderId && parsed.status) {
                          actionTitle = 'Update Status Pesanan';
                          detailText = `Order ID ${parsed.orderId} diubah menjadi ${parsed.status}`;
                        }
                      } catch (e) {
                        // Not JSON, keep raw
                      }

                      // If title is just uppercase system text, make it prettier
                      if (actionTitle === 'CREATE_ORDER') actionTitle = 'Membuat Pesanan Baru';
                      if (actionTitle === 'EDIT_ORDER') actionTitle = 'Mengedit Pesanan';

                      return (
                        <tr key={log.log_id || idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors group">
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-medium align-top">
                            {log.timestamp}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap align-top">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs shrink-0">
                                {(log.user_name || log.user_id || 'A')[0].toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {log.user_name || log.user_id || 'Admin'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <div className="flex flex-col gap-1">
                               <span className="font-bold text-slate-800 dark:text-slate-200">
                                 {actionTitle}
                               </span>
                               {detailText && detailText !== '-' && (
                                 <span className="text-sm text-slate-600 dark:text-slate-400">
                                   {detailText}
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
    </div>
  );
}
