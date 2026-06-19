import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, Package, Users, User, Hand, AlertCircle, Search, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AnimatedStockChartBg = ({ colorClass, id }: { colorClass: string, id: string }) => {
  const pathData = "M0,90 C30,90 40,40 70,40 C100,40 110,85 140,85 C170,85 180,30 210,30 C240,30 250,60 270,60 C285,60 290,15 300,15";
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[24px] opacity-80 flex items-end">
      <svg className={`w-full h-24 ${colorClass}`} preserveAspectRatio="none" viewBox="0 0 300 100">
        <style>
          {`
            @keyframes drawLine-${id} {
              0% { stroke-dashoffset: 100; }
              100% { stroke-dashoffset: 0; }
            }
            .path-draw-${id} {
              stroke-dasharray: 100;
              animation: drawLine-${id} 4s ease-in-out infinite alternate;
            }
            @keyframes fadeFill-${id} {
              0% { opacity: 0; }
              100% { opacity: 1; }
            }
            .fill-fade-${id} {
              animation: fadeFill-${id} 4s ease-in-out infinite alternate;
            }
          `}
        </style>
        <defs>
          <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
          <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="2" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path 
          d={`${pathData} L300,100 L0,100 Z`} 
          fill={`url(#grad-${id})`} 
          className={`fill-fade-${id}`}
        />
        <path 
          id={`glowLinePath-${id}`}
          d={pathData} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="4" 
          strokeLinecap="round"
          pathLength="100"
          className={`path-draw-${id} opacity-50`}
          filter={`url(#glow-${id})`}
        />
        <path 
          id={`linePath-${id}`}
          d={pathData} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round"
          pathLength="100"
          className={`path-draw-${id}`}
        />
      </svg>
    </div>
  );
};

const AnimatedBarsBg = ({ colorClass }: { colorClass: string }) => (
  <div className="absolute inset-x-0 bottom-0 h-24 z-0 pointer-events-none overflow-hidden rounded-[24px] opacity-20 flex items-end justify-between px-4 gap-2">
    {[...Array(12)].map((_, i) => (
      <div 
        key={i} 
        className={`w-full bg-current ${colorClass} rounded-t-sm animate-pulse`} 
        style={{ 
          height: `${20 + Math.random() * 80}%`, 
          animationDelay: `${i * 0.15}s`,
          animationDuration: `${1 + Math.random()}s`
        }} 
      />
    ))}
  </div>
);

const AnimatedGlowingOrbsBg = () => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[24px] opacity-30">
    <div className="absolute -left-4 top-4 w-32 h-32 bg-amber-500 rounded-full mix-blend-screen filter blur-2xl animate-pulse" style={{ animationDuration: '4s' }} />
    <div className="absolute right-0 -bottom-4 w-40 h-40 bg-emerald-500 rounded-full mix-blend-screen filter blur-[32px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
  </div>
);

const AnimatedNetworkBg = ({ colorClass }: { colorClass: string }) => (
  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-[24px] opacity-30">
    <svg className={`w-full h-full ${colorClass}`} viewBox="0 0 200 100">
      <circle cx="30" cy="40" r="3" className="animate-pulse" style={{ animationDelay: '0.1s' }} fill="currentColor" />
      <circle cx="80" cy="20" r="4" className="animate-pulse" style={{ animationDelay: '0.4s' }} fill="currentColor" />
      <circle cx="150" cy="50" r="2" className="animate-pulse" style={{ animationDelay: '0.7s' }} fill="currentColor" />
      <circle cx="110" cy="80" r="3" className="animate-pulse" style={{ animationDelay: '0.2s' }} fill="currentColor" />
      <circle cx="180" cy="85" r="4" className="animate-pulse" style={{ animationDelay: '0.8s' }} fill="currentColor" />
      <circle cx="50" cy="85" r="2.5" className="animate-pulse" style={{ animationDelay: '0.5s' }} fill="currentColor" />
      
      <line x1="30" y1="40" x2="80" y2="20" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
      <line x1="80" y1="20" x2="150" y2="50" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
      <line x1="150" y1="50" x2="110" y2="80" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
      <line x1="110" y1="80" x2="50" y2="85" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
      <line x1="50" y1="85" x2="30" y2="40" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
      <line x1="80" y1="20" x2="110" y2="80" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
      <line x1="150" y1="50" x2="180" y2="85" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.5" />
    </svg>
  </div>
);

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
          <AnimatedStockChartBg colorClass="text-emerald-400" id="chart1" />
          <div className="flex justify-between items-start mb-6 z-10">
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
          <div className="z-10 mt-auto">
            <h3 className="text-[28px] font-extrabold text-white mb-1 leading-tight">{formatRp(dashboard.totalOmset)}</h3>
            <p className="text-sm font-bold text-slate-300 mb-1">Total Omset</p>
            <p className="text-xs text-slate-500 truncate">
               {dashboard.trendText ? dashboard.trendText.substring(dashboard.trendText.indexOf(' ') + 1) : 'Total pendapatan kotor hari ini'}
            </p>
          </div>
        </div>

        {/* Card 2: Jumlah Transaksi */}
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group !bg-gradient-to-br !from-[#0D0F12]/95 !to-[#1C1E26]/95 backdrop-blur-3xl !border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <AnimatedBarsBg colorClass="text-violet-400" />
          <div className="flex justify-between items-start mb-6 z-10">
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
          <div className="z-10 mt-auto">
            <h3 className="text-[28px] font-extrabold text-white mb-1 leading-tight">{dashboard.totalOrders}</h3>
            <p className="text-sm font-bold text-slate-300 mb-1">Jumlah Transaksi</p>
            <p className="text-xs text-slate-500 truncate">
               Pesanan yang diproses hari ini
            </p>
          </div>
        </div>

        {/* Card 3: Total Produk */}
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group !bg-gradient-to-br !from-[#0D0F12]/95 !to-[#1C1E26]/95 backdrop-blur-3xl !border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <AnimatedGlowingOrbsBg />
          <div className="flex justify-between items-start mb-6 z-10">
            <div className="w-10 h-10 rounded-[14px] bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
               <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="z-10 mt-auto">
            <h3 className="text-[28px] font-extrabold text-white mb-1 leading-tight">{dashboard.totalPcs}</h3>
            <p className="text-sm font-bold text-slate-300 mb-1">Total Produk</p>
            <p className="text-xs text-slate-500 truncate">
               Rasio Croissant vs Cake
            </p>
          </div>
        </div>

        {/* Card 4: Customer Aktif */}
        <div className="glass-panel p-6 flex flex-col relative overflow-hidden group !bg-gradient-to-br !from-[#0D0F12]/95 !to-[#1C1E26]/95 backdrop-blur-3xl !border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.3)]">
          <AnimatedNetworkBg colorClass="text-cyan-400" />
          <div className="flex justify-between items-start mb-6 z-10">
            <div className="w-10 h-10 rounded-[14px] bg-white/10 flex items-center justify-center text-white backdrop-blur-sm">
               <Users className="w-5 h-5" />
            </div>
            {dashboard.newCustomersThisMonth > 0 && (
              <div className="px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 bg-cyan-500/20 text-cyan-300">
                 +{dashboard.newCustomersThisMonth} Baru
              </div>
            )}
          </div>
          <div className="z-10 mt-auto">
            <h3 className="text-[28px] font-extrabold text-white mb-1 leading-tight">{dashboard.uniqueCustomers.length}</h3>
            <p className="text-sm font-bold text-slate-300 mb-1">Customer Aktif</p>
            <p className="text-xs text-slate-500 truncate">
               Total pelanggan unik hari ini
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variant Performance */}
        {/* Variant Performance */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
              <Package className="w-5 h-5 text-slate-700 dark:text-slate-300" />
              Performa Varian Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex-1">
            <div className="space-y-5">
              {Object.entries(dashboard.variantPerformance).length === 0 ? (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
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
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{sku} <span className="text-slate-500 font-normal ml-1">({data.qty} pcs)</span></span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{percentage}% <span className="text-slate-500 text-xs font-normal ml-1">({formatRp(data.omset)})</span></span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <AnimatedProgressBar 
                            percentage={percentage} 
                            colorClass="bg-slate-800 dark:bg-slate-300" 
                          />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Leaderboard */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
                <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                Top Customer
              </CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input 
                  placeholder="Cari customer..." 
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9 h-9 text-sm w-full sm:w-64 border-slate-200 dark:border-slate-800 bg-transparent"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse min-w-[300px]">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                  <tr className="text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    <th className="py-3 px-4 font-semibold border-b border-slate-200 dark:border-slate-800">Nama Outlet / Customer</th>
                    <th className="py-3 px-4 font-semibold text-center border-b border-slate-200 dark:border-slate-800">Freq</th>
                    <th className="py-3 px-4 font-semibold text-right border-b border-slate-200 dark:border-slate-800">Total Belanja</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-slate-500 text-sm border-b border-slate-100 dark:border-slate-800/50">
                        {customerSearch ? 'Customer tidak ditemukan.' : 'Belum ada order masuk.'}
                      </td>
                    </tr>
                  ) : (
                    filteredLeaderboard.map(([cust, data], idx) => (
                        <tr key={cust} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer">
                          <td className="py-3 px-4 text-sm font-semibold text-slate-900 dark:text-slate-200">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs shrink-0 border ${
                                idx === 0 ? 'bg-slate-800 text-white border-slate-900 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200' :
                                idx === 1 ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600' :
                                idx === 2 ? 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700' :
                                'bg-transparent text-slate-500 border-transparent'
                              }`}>
                                {idx + 1}
                              </div>
                              <span className="truncate">{cust}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm text-center">
                            <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded text-xs font-semibold text-slate-600 dark:text-slate-300">{data.freq}x</span>
                          </td>
                          <td className="py-3 px-4 text-sm font-bold text-slate-900 dark:text-slate-200 text-right whitespace-nowrap">
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

        {/* Bottlenecks Panel */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900 dark:text-white">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Operational Bottlenecks & SLA
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500"></div>
                <div className="flex flex-col ml-2">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{dashboard.bottlenecks?.atRiskCount || 0}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">At Risk</p>
                </div>
                <AlertTriangle className="w-6 h-6 text-amber-500 opacity-80" />
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-600"></div>
                <div className="flex flex-col ml-2">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{dashboard.bottlenecks?.blockedCount || 0}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Blocked</p>
                </div>
                <Hand className="w-6 h-6 text-red-600 opacity-80" />
              </div>
              <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm flex items-center justify-between relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-700"></div>
                <div className="flex flex-col ml-2">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{dashboard.bottlenecks?.overdueCount || 0}</p>
                  <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">Overdue</p>
                </div>
                <AlertCircle className="w-6 h-6 text-red-700 opacity-80" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-bold text-sm mb-3 text-slate-900 dark:text-slate-100">Menunggu Diterima (Handover Waiting)</h5>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-md max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Pelanggan</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Divisi</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Durasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!dashboard.bottlenecks?.waiting || dashboard.bottlenecks.waiting.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 px-4 text-center text-slate-500">Tidak ada antrian.</td></tr>
                      ) : (
                        dashboard.bottlenecks.waiting.map(w => (
                          <tr key={`w-${w.orderId}`} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-200">{w.customer}</td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{w.stage}</td>
                            <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${w.durationMin > 60 ? 'bg-red-600' : w.durationMin > 30 ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                              <span className="text-slate-700 dark:text-slate-300">{w.durationMin} mnt</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h5 className="font-bold text-sm mb-3 text-slate-900 dark:text-slate-100">Antrian Verifikasi QC (QC Pending)</h5>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-md max-h-64 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Pelanggan</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Sumber QC</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Durasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!dashboard.bottlenecks?.qcPendingList || dashboard.bottlenecks.qcPendingList.length === 0 ? (
                        <tr><td colSpan={3} className="py-4 px-4 text-center text-slate-500">Semua QC Tuntas.</td></tr>
                      ) : (
                        dashboard.bottlenecks.qcPendingList.map(w => (
                          <tr key={`qc-${w.orderId}`} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-200">{w.customer}</td>
                            <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{w.stage}</td>
                            <td className="py-2.5 px-4 font-medium flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${w.durationMin > 60 ? 'bg-red-600' : w.durationMin > 30 ? 'bg-amber-500' : 'bg-slate-300'}`}></span>
                              <span className="text-slate-700 dark:text-slate-300">{w.durationMin} mnt</span>
                            </td>
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
                <h5 className="font-bold text-sm mb-3 text-slate-900 dark:text-slate-100 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-600" /> Non-Conformance Report (Unresolved NCR)</h5>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-md">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Pelanggan</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Divisi Rework</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Isu QC</th>
                        <th className="py-2.5 px-4 font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">Tingkat (Severity)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.bottlenecks.ncrList.map(n => (
                        <tr key={`ncr-${n.orderId}`} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-slate-200">{n.customer}</td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{n.stage}</td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">{n.issue}</td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${n.severity === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300' : n.severity === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-300' : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}>
                              {n.severity}
                            </span>
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

      </div>
    </div>
  );
}
