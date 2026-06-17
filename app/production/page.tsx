"use client";

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/layout/Sidebar';

export default function ProductionPage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/production');
      const data = await res.json();
      if (data.success) {
        // Reverse to show newest first
        setQueue(data.data.reverse());
      }
    } catch (error) {
      console.error('Error fetching production queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (queueId: string, updates: { status?: string, assignedTo?: string }) => {
    try {
      const res = await fetch('/api/production', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId, ...updates })
      });
      const data = await res.json();
      if (data.success) {
        fetchQueue();
      } else {
        alert('Gagal memperbarui: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating production queue:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Pending': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'Waiting Stock': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'In Progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const pendingCount = queue.filter(q => q.status === 'Pending').length;
  const inProgressCount = queue.filter(q => q.status === 'In Progress').length;
  const completedTodayCount = queue.filter(q => q.status === 'Completed' && new Date(q.timestamp).toDateString() === new Date().toDateString()).length;
  const needAttentionCount = queue.filter(q => q.status === 'Waiting Stock' || (new Date(q.targetDate) < new Date() && q.status !== 'Completed' && q.status !== 'Cancelled')).length;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar activeMenu="production" setActiveMenu={() => {}} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 md:hidden transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              Production Center
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Queue</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{pendingCount}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">In Progress</span>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{inProgressCount}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed Today</span>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">{completedTodayCount}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Need Attention</span>
              <span className="text-3xl font-bold text-red-600 dark:text-red-400 mt-2">{needAttentionCount}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Antrean Produksi</h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data produksi...</div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-4">Tenggat (Target)</th>
                      <th className="px-6 py-4">SKU / Produk</th>
                      <th className="px-6 py-4">Ref Order ID</th>
                      <th className="px-6 py-4">Defisit Qty</th>
                      <th className="px-6 py-4">Assigned To</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {queue.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{item.targetDate}</td>
                        <td className="px-6 py-4 font-bold">{item.sku}</td>
                        <td className="px-6 py-4 text-xs text-gray-500">{item.sourceOrderId || '-'}</td>
                        <td className="px-6 py-4 text-red-600 dark:text-red-400 font-bold">{item.deficit}</td>
                        <td className="px-6 py-4">
                          <input 
                            type="text" 
                            className="w-24 px-2 py-1 text-sm bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-gray-900 dark:text-white"
                            placeholder="Nama..."
                            defaultValue={item.assignedTo}
                            onBlur={(e) => {
                              if (e.target.value !== item.assignedTo) {
                                handleUpdate(item.id, { assignedTo: e.target.value });
                              }
                            }}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            className={`px-2 py-1 text-xs font-bold rounded-lg border-none focus:ring-2 focus:ring-blue-500 ${getStatusColor(item.status)}`}
                            value={item.status}
                            onChange={(e) => handleUpdate(item.id, { status: e.target.value })}
                          >
                            <option value="Pending">Pending</option>
                            <option value="Waiting Stock">Waiting Stock</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === 'Completed' ? (
                            <span className="text-gray-400 dark:text-gray-600 text-xs italic">Selesai</span>
                          ) : (
                            <button
                              onClick={() => handleUpdate(item.id, { status: 'Completed' })}
                              className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-sm font-medium shadow-sm transition-colors"
                            >
                              Selesaikan
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {queue.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          Belum ada antrean produksi.
                        </td>
                      </tr>
                    )}
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
