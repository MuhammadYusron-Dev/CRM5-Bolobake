import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, Package, Users, AlertCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface DashboardData {
  totalOmset: number;
  totalOrders: number;
  totalPcs: number;
  uniqueCustomers: string[];
  variantPerformance: Record<string, { qty: number; omset: number }>;
  customerLeaderboard: Record<string, { freq: number; totalBelanja: number }>;
}

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary text-primary-foreground relative overflow-hidden group border-0 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-24 h-24" />
          </div>
          <svg className="absolute bottom-0 right-0 w-full h-1/2 opacity-20 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 C20,80 40,90 60,70 C80,50 90,60 100,40 L100,100 L0,100 Z" fill="currentColor"/>
          </svg>
          <CardHeader className="pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Total Omset</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">{formatRp(dashboard.totalOmset)}</div>
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-white/30 text-emerald-800 backdrop-blur-sm border border-white/40 mt-2 shadow-sm">
              <svg className="w-3.5 h-3.5 animate-float-up" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M7 17L17 7M17 7H7M17 7V17"/>
              </svg>
              <span>+12% dari kemarin</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg relative overflow-hidden">
          <svg className="absolute bottom-0 right-0 w-full h-1/2 opacity-[0.03] pointer-events-none text-amber-600" preserveAspectRatio="none" viewBox="0 0 100 100">
             <path d="M0,100 C30,60 50,80 70,50 C90,20 100,40 100,40 L100,100 L0,100 Z" fill="currentColor"/>
          </svg>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Transaksi</CardTitle>
            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:-translate-y-1 transition-transform shadow-sm">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold">{dashboard.totalOrders}</div>
            <div className="flex items-center mt-1">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-xs text-muted-foreground">3 pesanan sedang diproduksi</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Produk</CardTitle>
            <div className="p-3 bg-secondary rounded-xl text-primary group-hover:rotate-12 transition-transform shadow-sm">
              <Package className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalPcs}</div>
            <p className="text-xs text-muted-foreground mt-1 mb-1">Rasio Savoury vs Pastry</p>
            <div className="w-full bg-secondary rounded-full h-1 mt-1 flex">
               <div className="bg-amber-600 h-1 rounded-l-full" style={{ width: '60%' }}></div>
               <div className="bg-amber-300 h-1 rounded-r-full" style={{ width: '40%' }}></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customer Aktif</CardTitle>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform duration-300 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.uniqueCustomers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">9 outlet baru bulan ini</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variant Performance */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
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
                          <div 
                            className={`bg-gradient-to-r from-amber-600 to-amber-400 h-2.5 rounded-full transition-all duration-1000 ease-out ${idx === 0 ? 'progress-striped relative' : ''}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Customer Leaderboard */}
        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <span className="w-1.5 h-6 bg-foreground rounded-full"></span>
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
                <thead className="bg-muted/50 sticky top-0 z-10 backdrop-blur-sm">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
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
                        <tr key={cust} className="border-b border-secondary last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                          <td className="py-3 px-4 text-sm font-semibold">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                idx === 0 ? 'bg-amber-100 text-amber-700 border border-amber-300' :
                                idx === 1 ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                                idx === 2 ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                                'bg-secondary text-muted-foreground'
                              }`}>
                                {idx + 1}
                                {idx === 0 && <span className="ml-0.5 text-[8px]">👑</span>}
                                {idx === 1 && <span className="ml-0.5 text-[8px]">🥈</span>}
                                {idx === 2 && <span className="ml-0.5 text-[8px]">🥉</span>}
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
