"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Package, AlertTriangle, Bookmark, History, PlusCircle } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [addStockModal, setAddStockModal] = useState({ isOpen: false, sku: '', addedStock: 0 });
  const [selectedSku, setSelectedSku] = useState<string | null>(null);

  useEffect(() => {
    fetchInventory();
    fetchMovements();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setInventory(data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async () => {
    try {
      const res = await fetch('/api/inventory/movements');
      const data = await res.json();
      if (data.success) {
        setMovements(data.data);
      }
    } catch (error) {
      console.error('Error fetching movements:', error);
    }
  };

  const handleAddStock = async () => {
    if (!addStockModal.sku || addStockModal.addedStock <= 0) return;
    
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: addStockModal.sku,
          addedStock: addStockModal.addedStock
        })
      });
      const data = await res.json();
      if (data.success) {
        setAddStockModal({ isOpen: false, sku: '', addedStock: 0 });
        fetchInventory();
        fetchMovements();
      } else {
        alert('Gagal menambah stok: ' + data.error);
      }
    } catch (error) {
      console.error('Error adding stock:', error);
    }
  };

  const getStatusIndicator = (available: number, minStock: number) => {
    if (available <= minStock * 0.3) return { color: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50', dot: 'bg-rose-500', label: 'Critical' };
    if (available <= minStock) return { color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50', dot: 'bg-amber-500', label: 'Low Stock' };
    return { color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50', dot: 'bg-emerald-500', label: 'Safe' };
  };

  const totalSKU = inventory.length;
  const lowStockCount = inventory.filter(i => i.availableStock <= i.minStock).length;
  const reservedTotal = inventory.reduce((acc, curr) => acc + curr.reservedStock, 0);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar activeMenu="inventory" setActiveMenu={() => {}} isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
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
              Inventory Center
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100/50 dark:from-blue-900/20 dark:to-indigo-900/10 rounded-2xl shadow-sm border border-blue-100/50 dark:border-blue-800/30 p-6 flex flex-col relative overflow-hidden group transition-all duration-300 hover:shadow-md">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-xl group-hover:bg-blue-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800/70 dark:text-blue-300/70">Total SKU Aktif</span>
              </div>
              <span className="text-4xl font-black text-blue-950 dark:text-white tracking-tight">{totalSKU}</span>
            </div>
            
            <div className="bg-gradient-to-br from-amber-50 to-orange-100/50 dark:from-amber-900/20 dark:to-orange-900/10 rounded-2xl shadow-sm border border-amber-100/50 dark:border-amber-800/30 p-6 flex flex-col relative overflow-hidden group transition-all duration-300 hover:shadow-md">
              <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-400/5 rounded-full blur-xl group-hover:bg-amber-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800/70 dark:text-amber-300/70">Low Stock / Critical</span>
              </div>
              <span className="text-4xl font-black text-amber-950 dark:text-white tracking-tight">{lowStockCount}</span>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-100/50 dark:from-purple-900/20 dark:to-pink-900/10 rounded-2xl shadow-sm border border-purple-100/50 dark:border-purple-800/30 p-6 flex flex-col relative overflow-hidden group transition-all duration-300 hover:shadow-md">
              <div className="absolute right-0 top-0 w-24 h-24 bg-purple-500/5 dark:bg-purple-400/5 rounded-full blur-xl group-hover:bg-purple-500/10 transition-colors"></div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl">
                  <Bookmark className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-800/70 dark:text-purple-300/70">Total Direservasi</span>
              </div>
              <span className="text-4xl font-black text-purple-950 dark:text-white tracking-tight">{reservedTotal}</span>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-500" />
                Daftar Stok Produk
              </h2>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data inventory...</div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-6 py-4">SKU / Produk</th>
                      <th className="px-6 py-4">Total Stok</th>
                      <th className="px-6 py-4">Direservasi</th>
                      <th className="px-6 py-4 text-blue-600 dark:text-blue-400">Tersedia</th>
                      <th className="px-6 py-4">Min Stok</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inventory.map((item, idx) => {
                      const status = getStatusIndicator(item.availableStock, item.minStock);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-all duration-200 group">
                          <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200 cursor-pointer group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" onClick={() => setSelectedSku(item.sku)}>
                            {item.sku}
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{item.totalStock}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-medium">{item.reservedStock}</td>
                          <td className="px-6 py-4 font-bold text-lg text-slate-800 dark:text-slate-200">{item.availableStock}</td>
                          <td className="px-6 py-4 text-slate-400 dark:text-slate-500 font-medium">{item.minStock}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide rounded-full border ${status.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setSelectedSku(item.sku)}
                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-400 dark:hover:bg-indigo-900/30 rounded-lg transition-colors tooltip-trigger"
                                title="Audit Trail"
                              >
                                <History className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setAddStockModal({ isOpen: true, sku: item.sku, addedStock: 0 })}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors tooltip-trigger"
                                title="Tambah Stok"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {inventory.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          Belum ada data inventory. Silakan buat pesanan baru.
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

      {/* Add Stock Modal */}
      {addStockModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tambah Stok Manual</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
              <input type="text" value={addStockModal.sku} disabled className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white" />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Tambahan</label>
              <input 
                type="number" 
                value={addStockModal.addedStock || ''}
                onChange={(e) => setAddStockModal({...addStockModal, addedStock: parseInt(e.target.value) || 0})}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white" 
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setAddStockModal({ isOpen: false, sku: '', addedStock: 0 })}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleAddStock}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Detail / Audit Trail Drawer */}
      {selectedSku && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl transform transition-transform border-l border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Audit: {selectedSku}</h3>
            <button onClick={() => setSelectedSku(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Inventory Movements</h4>
            <div className="space-y-4">
              {movements.filter(m => m.sku === selectedSku).length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Belum ada riwayat pergerakan stok.</p>
              ) : (
                movements.filter(m => m.sku === selectedSku).map((mov, idx) => (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>
                        {mov.movementType}
                      </span>
                      <span className="text-xs text-gray-500">{new Date(mov.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      Qty: <span className="font-bold">{mov.quantity}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Ref: {mov.refType} ({mov.refId})</div>
                    {mov.notes && <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">"{mov.notes}"</div>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
