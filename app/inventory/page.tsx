'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import { PackageSearch, Plus } from 'lucide-react';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skuToAdd, setSkuToAdd] = useState('');
  const [qtyToAdd, setQtyToAdd] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await fetch('/api/inventory');
      const data = await res.json();
      if (data.success) {
        setInventory(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async () => {
    if (!skuToAdd || !qtyToAdd) return;
    try {
      setLoading(true);
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: skuToAdd, addedStock: parseInt(qtyToAdd, 10) })
      });
      setSkuToAdd('');
      setQtyToAdd('');
      await fetchInventory();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar activeMenu="inventory" setActiveMenu={() => {}} isMobileOpen={false} setIsMobileOpen={() => {}} />
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-xl text-purple-600 dark:text-purple-400">
              <PackageSearch className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400">Inventory Center</h1>
          </div>
          <ThemeToggle />
        </header>

        <div className="p-6 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Tambah Stok Manual</h2>
            <div className="flex space-x-4">
              <input 
                type="text" 
                value={skuToAdd} 
                onChange={(e) => setSkuToAdd(e.target.value)} 
                placeholder="SKU Produk (misal: Butter Croissant 75gr)" 
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
              />
              <input 
                type="number" 
                value={qtyToAdd} 
                onChange={(e) => setQtyToAdd(e.target.value)} 
                placeholder="Jumlah" 
                className="w-32 px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
              />
              <button 
                onClick={handleAddStock}
                disabled={loading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all flex items-center shadow-md shadow-purple-200 dark:shadow-none"
              >
                <Plus className="w-5 h-5 mr-2" /> {loading ? 'Menyimpan...' : 'Tambah'}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">SKU</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">Stok Total</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">Direservasi</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">Tersedia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading && inventory.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-500">Memuat data...</td></tr>
                  ) : inventory.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-gray-500">Belum ada data inventory</td></tr>
                  ) : (
                    inventory.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">{item.sku}</td>
                        <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{item.totalStock}</td>
                        <td className="py-4 px-6 text-orange-600 dark:text-orange-400 font-medium">{item.reservedStock}</td>
                        <td className={`py-4 px-6 font-bold ${item.availableStock > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {item.availableStock}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
