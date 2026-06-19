import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, Package, Users, User, Hand, AlertCircle, Search, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DashboardData {
  totalOmset: number;
  totalOrders: number;
  totalPcs: number;
  uniqueCustomers: string[];
  variantPerformance: Record<string, { qty: number; omset: number }>;
  customerLeaderboard: Record<string, { freq: number; totalBelanja: number }>;
  trendText: string | null;
  activeProductionOrders: number;
  newCustomersThisMonth: number;
  categorySales?: { croissant: number; cake: number };
  bottlenecks?: {
    waiting: { orderId: number, customer: string, stage: string, durationMin: number }[];
    atRiskCount: number;
    blockedCount: number;
    overdueCount: number;
    ncrList: { orderId: number, customer: string, stage: string, issue: string, severity: string }[];
    qcPendingList: { orderId: number, customer: string, stage: string, durationMin: number }[];
  };
}

const AnimatedProgressBar = ({ percentage, colorClass }: { percentage: string; colorClass: string }) => {
  const [width, setWidth] = React.useState('0%');
  
  React.useEffect(() => {
    // Delay setting width so CSS transition triggers properly from 0% on mount
    const timer = setTimeout(() => {
      setWidth(`${percentage}%`);
    }, 50);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div 
      className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${colorClass}`}
      style={{ width }}
    ></div>
  );
};

export function DashboardAnalytics({ 
  dashboard, 
  isLoading, 
  error 
}: { 
  dashboard: DashboardData; 
  isLoading: boolean; 
  error: string | null; 
}) {
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const [customerSearch, setCustomerSearch] = useState('');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse h-[104px]" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 bg-destructive/10 text-destructive p-4 rounded-xl border border-destructive/20">
        <div className="flex items-center gap-2 mb-2 font-bold">
          <AlertCircle className="w-5 h-5" /> Error:
        </div>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const filteredLeaderboard = Object.entries(dashboard.customerLeaderboard)
    .filter(([cust]) => cust.toLowerCase().includes(customerSearch.toLowerCase()))
    .sort((a, b) => b[1].totalBelanja - a[1].totalBelanja);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Omset */}
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group !bg-gradient-to-br !from-[#0D0F12]/95 !to-[#1C1E26]/95 backdrop-blur-3xl !border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-[14px] bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
               <TrendingUp className="w-5 h-5" />
            </div>
            {dashboard.trendText && (
              <div className={`px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ${dashboard.trendText.startsWith('+') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                 <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={dashboard.trendText.startsWith('+') ? "M7 17L17 7M17 7H7M17 7V17" : "M17 7L7 17M7 17H17M7 17V7"}/>
                 </svg>
                 {dashboard.trendText.split(' ')[0]}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-[28px] font-extrabold text-white mb-1 leading-tight">{formatRp(dashboard.totalOmset)}</h3>
            <p className="text-sm font-bold text-slate-300 mb-1">Total Omset</p>
            <p className="text-xs text-slate-500 truncate">
               {dashboard.trendText ? dashboard.trendText.substring(dashboard.trendText.indexOf(' ') + 1) : 'Total pendapatan kotor hari ini'}
            </p>
          </div>
          <div className="mt-6">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 2: Jumlah Transaksi */}
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group !bg-gradient-to-br !from-[#0D0F12]/95 !to-[#1C1E26]/95 backdrop-blur-3xl !border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-[14px] bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
               <ShoppingBag className="w-5 h-5" />
            </div>
            {dashboard.activeProductionOrders > 0 && (
              <div className="px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {dashboard.activeProductionOrders} Active
              </div>
            )}
          </div>
          <div>
            <h3 className="text-[28px] font-extrabold text-white mb-1 leading-tight">{dashboard.totalOrders}</h3>
            <p className="text-sm font-bold text-slate-300 mb-1">Jumlah Transaksi</p>
            <p className="text-xs text-slate-500 truncate">
               Pesanan yang diproses hari ini
            </p>
          </div>
          <div className="mt-6">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 rounded-full" style={{ width: dashboard.totalOrders > 0 ? '100%' : '0%' }}></div>
            </div>
          </div>
        </div>

        {/* Card 3: Total Produk */}
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group !bg-gradient-to-br !from-[#0D0F12]/95 !to-[#1C1E26]/95 backdrop-blur-3xl !border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-[14px] bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
               <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-[28px] font-extrabold text-white mb-1 leading-tight">{dashboard.totalPcs}</h3>
            <p className="text-sm font-bold text-slate-300 mb-1">Total Produk</p>
            <p className="text-xs text-slate-500 truncate">
               Rasio Croissant vs Cake
            </p>
          </div>
          <div className="mt-6">
            {(() => {
              const croissant = dashboard.categorySales?.croissant || 0;
              const cake = dashboard.categorySales?.cake || 0;
              const total = croissant + cake;
              const croissantPct = total > 0 ? (croissant / total) * 100 : 60;

              return (
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: `${croissantPct}%` }}></div>
                  <div className="h-full bg-amber-500 rounded-r-full" style={{ width: `${100 - croissantPct}%` }}></div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Card 4: Customer Aktif */}
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group !bg-gradient-to-br !from-[#0D0F12]/95 !to-[#1C1E26]/95 backdrop-blur-3xl !border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-[14px] bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
               <Users className="w-5 h-5" />
            </div>
            {dashboard.newCustomersThisMonth > 0 && (
              <div className="px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-cyan-500/20 text-cyan-300">
                 +{dashboard.newCustomersThisMonth} Baru
              </div>
            )}
          </div>
          <div>
            <h3 className="text-[28px] font-extrabold text-white mb-1 leading-tight">{dashboard.uniqueCustomers.length}</h3>
            <p className="text-sm font-bold text-slate-300 mb-1">Customer Aktif</p>
            <p className="text-xs text-slate-500 truncate">
               Total pelanggan unik hari ini
            </p>
          </div>
          <div className="mt-6">
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full" style={{ width: '40%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variant Performance */}
        <Card className="glass-panel p-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Performa Varian Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {Object.entries(dashboard.variantPerformance).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Belum ada data penjualan hari ini.</p>
                </div>
              ) : (
                Object.entries(dashboard.variantPerformance)
                  .sort((a, b) => b[1].omset - a[1].omset)
                  .slice(0, 7) // Show top 7 max
                  .map(([sku, data], idx) => {
                    const percentage = dashboard.totalOmset > 0 ? ((data.omset / dashboard.totalOmset) * 100).toFixed(1) : '0';
                    return (
                      <div key={sku} className="group">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold">{sku} <span className="text-muted-foreground font-normal ml-1">({data.qty} pcs)</span></span>
                          <span className="font-medium text-primary">{percentage}% <span className="text-muted-foreground text-xs font-normal ml-1">({formatRp(data.omset)})</span></span>
                        </div>
                        <div className={`w-full bg-secondary rounded-full h-2.5 overflow-hidden ${idx === 0 ? 'shimmer-bar' : ''}`}>
                          <AnimatedProgressBar 
                            percentage={percentage} 
                            colorClass={idx === 0 ? 'bg-gradient-to-r from-blue-600 to-cyan-500' : idx === 1 ? 'bg-gradient-to-r from-violet-600 to-fuchsia-500' : 'bg-gradient-to-r from-orange-500 to-red-500'} 
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottlenecks Panel */}
        <Card className="glass-panel p-0 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/50">
            <CardTitle className="text-lg flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Operational Bottlenecks & SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-orange-50 dark:glass-panel-warning border border-orange-100 dark:border-transparent rounded-lg text-center transition-all">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{dashboard.bottlenecks?.atRiskCount || 0}</p>
                <p className="text-xs font-semibold text-orange-800 dark:text-orange-300">AT RISK</p>
              </div>
              <div className="p-3 bg-red-50 dark:glass-panel-danger border border-red-100 dark:border-transparent rounded-lg text-center transition-all">
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{dashboard.bottlenecks?.blockedCount || 0}</p>
                <p className="text-xs font-semibold text-red-800 dark:text-red-300">BLOCKED</p>
              </div>
              <div className="p-3 bg-red-100 dark:glass-panel-danger border border-red-200 dark:border-transparent rounded-lg text-center transition-all">
                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{dashboard.bottlenecks?.overdueCount || 0}</p>
                <p className="text-xs font-semibold text-red-900 dark:text-red-300">OVERDUE</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-bold text-sm mb-3">Menunggu Diterima (Handover Waiting)</h5>
                <div className="overflow-x-auto border dark:border-white/10 rounded-md max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 dark:bg-black/40 dark:backdrop-blur-md sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Pelanggan</th>
                        <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Divisi</th>
                        <th className="py-2 px-3 font-semibold text-slate-600 dark:text-slate-300">Durasi Menunggu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!dashboard.bottlenecks?.waiting || dashboard.bottlenecks.waiting.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 text-center text-slate-500">Tidak ada antrian.</td></tr>
                      ) : (
                        dashboard.bottlenecks.waiting.map(w => (
                          <tr key={`w-${w.orderId}`} className="border-b dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="py-2 px-3 font-medium">{w.customer}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{w.stage}</td>
                            <td className="py-2 px-3 text-red-600 dark:text-red-400 font-medium">{w.durationMin} Menit</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-sm mb-3 text-cyan-700 dark:text-cyan-400">Antrian Verifikasi QC (QC Pending)</h5>
                <div className="overflow-x-auto border dark:border-white/10 rounded-md max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-cyan-50 dark:bg-black/40 dark:backdrop-blur-md sticky top-0 z-10">
                      <tr>
                        <th className="py-2 px-3 font-semibold text-cyan-800 dark:text-cyan-300">Pelanggan</th>
                        <th className="py-2 px-3 font-semibold text-cyan-800 dark:text-cyan-300">Sumber QC</th>
                        <th className="py-2 px-3 font-semibold text-cyan-800 dark:text-cyan-300">Durasi Menunggu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!dashboard.bottlenecks?.qcPendingList || dashboard.bottlenecks.qcPendingList.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 text-center text-slate-500">Semua QC Tuntas.</td></tr>
                      ) : (
                        dashboard.bottlenecks.qcPendingList.map(w => (
                          <tr key={`qc-${w.orderId}`} className="border-b dark:border-white/5 last:border-0 hover:bg-cyan-50/30 dark:hover:bg-white/5 transition-colors">
                            <td className="py-2 px-3 font-medium">{w.customer}</td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{w.stage}</td>
                            <td className="py-2 px-3 text-red-600 dark:text-red-400 font-medium">{w.durationMin} Menit</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {dashboard.bottlenecks?.ncrList && dashboard.bottlenecks.ncrList.length > 0 && (
              <div className="mt-6">
                <h5 className="font-bold text-sm mb-3 text-red-700 dark:text-red-400 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Non-Conformance Report (Unresolved NCR)</h5>
                <div className="overflow-x-auto border border-red-200 dark:border-white/10 rounded-md">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-red-50 dark:bg-black/40">
                      <tr>
                        <th className="py-2 px-3 font-semibold text-red-800 dark:text-red-300">Pelanggan</th>
                        <th className="py-2 px-3 font-semibold text-red-800 dark:text-red-300">Divisi Rework</th>
                        <th className="py-2 px-3 font-semibold text-red-800 dark:text-red-300">Isu QC</th>
                        <th className="py-2 px-3 font-semibold text-red-800 dark:text-red-300">Tingkat (Severity)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.bottlenecks.ncrList.map(n => (
                        <tr key={`ncr-${n.orderId}`} className="border-b border-red-100 dark:border-white/5 last:border-0 hover:bg-red-50/50 dark:hover:bg-white/5 transition-colors">
                          <td className="py-2 px-3 font-medium text-red-900 dark:text-red-300">{n.customer}</td>
                          <td className="py-2 px-3 text-red-700 dark:text-red-400">{n.stage}</td>
                          <td className="py-2 px-3 text-red-700 dark:text-red-400">{n.issue}</td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${n.severity === 'HIGH' ? 'bg-red-600 text-white' : n.severity === 'MEDIUM' ? 'bg-orange-500 text-white' : 'bg-yellow-400 text-yellow-900'}`}>{n.severity}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Leaderboard */}
        <Card className="glass-panel p-0 flex flex-col lg:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
                Top Customer
              </CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Cari customer..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 h-9 text-sm w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[300px]">
                <thead className="bg-muted/50 dark:bg-black/40 sticky top-0 z-10 backdrop-blur-sm">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground dark:text-slate-300">
                    <th className="py-3 px-4 font-semibold">Nama Outlet / Customer</th>
                    <th className="py-3 px-4 font-semibold text-center">Freq</th>
                    <th className="py-3 px-4 font-semibold text-right">Total Belanja</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                        {customerSearch ? 'Customer tidak ditemukan.' : 'Belum ada order masuk.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLeaderboard.map(([cust, data], idx) => (
                        <tr key={cust} className="border-b border-secondary dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer">
                          <td className="py-3 px-4 text-sm font-semibold">
                            <div className="flex items-center gap-4">
                              <div className={`rounded-full flex items-center justify-center font-extrabold shrink-0 relative transition-all duration-300 ${
                                idx === 0 ? 'w-8 h-8 text-base bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 text-white shadow-[0_0_10px_rgba(251,191,36,0.6)] border border-yellow-200 z-10' :
                                idx === 1 ? 'w-7 h-7 text-sm bg-gradient-to-br from-slate-100 via-slate-300 to-slate-400 text-slate-700 shadow-md border border-white z-10' :
                                idx === 2 ? 'w-6 h-6 text-xs bg-gradient-to-br from-orange-100 via-orange-300 to-orange-400 text-orange-900 shadow-sm border border-white z-10' :
                                'w-6 h-6 text-xs bg-secondary text-muted-foreground'
                              }`}>
                                <span className={idx <= 2 ? 'drop-shadow-md' : ''}>{idx + 1}</span>
                                {idx === 0 && (
                                  <>
                                    <span className="absolute -top-2.5 -right-1.5 text-base drop-shadow-md animate-bounce">👑</span>
                                    <span className="absolute inset-0 rounded-full animate-ping opacity-20 bg-yellow-400"></span>
                                  </>
                                )}
                                {idx === 1 && <span className="absolute -top-1 -right-1 text-[10px] drop-shadow-sm">🥈</span>}
                                {idx === 2 && <span className="absolute -top-0.5 -right-0.5 text-[8px] drop-shadow-sm">🥉</span>}
                              </div>
                              <span className="truncate">{cust}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-center">
                            <span className="bg-secondary px-2 py-1 rounded-md text-xs font-bold text-muted-foreground">{data.freq}x</span>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-primary text-right whitespace-nowrap">
                            {formatRp(data.totalBelanja)}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
