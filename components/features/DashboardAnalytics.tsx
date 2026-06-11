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
        <Card className="bg-primary text-primary-foreground relative overflow-hidden group border-0 shadow-md">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Omset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRp(dashboard.totalOmset)}</div>
            <p className="text-xs text-primary-foreground/70 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> +12% dari kemarin</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Transaksi</CardTitle>
            <div className="p-2 bg-secondary rounded-lg text-primary">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Order diproses</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Produk</CardTitle>
            <div className="p-2 bg-secondary rounded-lg text-primary">
              <Package className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.totalPcs}</div>
            <p className="text-xs text-muted-foreground mt-1">Pcs terjual</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customer Aktif</CardTitle>
            <div className="p-2 bg-secondary rounded-lg text-primary">
              <Users className="w-4 h-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard.uniqueCustomers.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Outlet bertransaksi</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variant Performance */}
        <Card className="shadow-sm border-border/50">
          <CardHeader>
            <CardTitle className="text-lg font-serif flex items-center gap-2">
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
                  .map(([sku, data]) => {
                    const percentage = dashboard.totalOmset > 0 ? ((data.omset / dashboard.totalOmset) * 100).toFixed(1) : '0';
                    return (
                      <div key={sku} className="group">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-semibold">{sku} <span className="text-muted-foreground font-normal ml-1">({data.qty} pcs)</span></span>
                          <span className="font-medium text-primary">{percentage}% <span className="text-muted-foreground text-xs font-normal ml-1">({formatRp(data.omset)})</span></span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-primary h-2.5 rounded-full transition-all duration-1000 ease-out" 
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
              <CardTitle className="text-lg font-serif flex items-center gap-2">
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
                        <tr key={cust} className="border-b border-secondary last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4 text-sm font-semibold">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
                                {idx + 1}
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
