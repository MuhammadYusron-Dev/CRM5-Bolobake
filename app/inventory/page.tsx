"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

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

  const getStatusColor = (available: number, minStock: number) => {
    if (available <= minStock * 0.3) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    if (available <= minStock) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
  };

  const getStatusLabel = (available: number, minStock: number) => {
    if (available <= minStock * 0.3) return 'Critical';
    if (available <= minStock) return 'Low Stock';
    return 'Safe';
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total SKU Aktif</span>
              <span className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{totalSKU}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Low Stock / Critical</span>
              <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">{lowStockCount}</span>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Direservasi</span>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{reservedTotal}</span>
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar Stok Produk</h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data inventory...</div>
              ) : (
                <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                  <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-xs uppercase font-medium text-gray-500 dark:text-gray-400">
                    <tr>
                      <th className="px-6 py-4">SKU / Produk</th>
                      <th className="px-6 py-4">Total Stok</th>
                      <th className="px-6 py-4">Direservasi</th>
                      <th className="px-6 py-4">Tersedia</th>
                      <th className="px-6 py-4">Min Stok</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {inventory.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white cursor-pointer hover:underline" onClick={() => setSelectedSku(item.sku)}>
                          {item.sku}
                        </td>
                        <td className="px-6 py-4">{item.totalStock}</td>
                        <td className="px-6 py-4">{item.reservedStock}</td>
                        <td className="px-6 py-4 font-bold">{item.availableStock}</td>
                        <td className="px-6 py-4 text-gray-500">{item.minStock}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(item.availableStock, item.minStock)}`}>
                            {getStatusLabel(item.availableStock, item.minStock)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedSku(item.sku)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
                          >
                            Audit
                          </button>
                          <button
                            onClick={() => setAddStockModal({ isOpen: true, sku: item.sku, addedStock: 0 })}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                          >
                            + Tambah
                          </button>
                        </td>
                      </tr>
                    ))}
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
