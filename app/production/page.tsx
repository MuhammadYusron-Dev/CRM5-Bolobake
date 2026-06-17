'use client';
import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ThemeToggle } from '@/components/features/ThemeToggle';
import { Factory, CheckCircle2 } from 'lucide-react';

export default function ProductionPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/production');
      const data = await res.json();
      if (data.success) {
        setQueue(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (queueId: string) => {
    try {
      setLoading(true);
      await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueId })
      });
      await fetchQueue();
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar activeMenu="production" setActiveMenu={() => {}} isMobileOpen={false} setIsMobileOpen={() => {}} />
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-xl text-orange-600 dark:text-orange-400">
              <Factory className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400">Production Queue</h1>
          </div>
          <ThemeToggle />
        </header>

        <div className="p-6 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">Tanggal Target</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">SKU (Produk)</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">Defisit / Jumlah</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                    <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {loading && queue.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-500">Memuat data...</td></tr>
                  ) : queue.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-gray-500">Tidak ada antrean produksi</td></tr>
                  ) : (
                    queue.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-6 font-medium text-gray-900 dark:text-gray-100">{item.targetDate}</td>
                        <td className="py-4 px-6 text-gray-700 dark:text-gray-300">{item.sku}</td>
                        <td className="py-4 px-6 font-bold text-red-600 dark:text-red-400">{item.deficit}</td>
                        <td className="py-4 px-6">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === 'Selesai' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          {item.status !== 'Selesai' && (
                            <button 
                              onClick={() => handleComplete(item.id)}
                              disabled={loading}
                              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-all shadow shadow-green-200 dark:shadow-none inline-flex items-center"
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" /> Selesai
                            </button>
                          )}
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
