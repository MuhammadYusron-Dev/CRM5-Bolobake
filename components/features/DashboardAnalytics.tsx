import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingBag, Package, Users, AlertCircle } from 'lucide-react';

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

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-primary text-primary-foreground relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Omset (Periode)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{formatRp(dashboard.totalOmset)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2 bg-secondary rounded-lg text-primary">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{dashboard.totalOrders} <span className="text-sm font-normal text-muted-foreground">Order</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2 bg-secondary rounded-lg text-primary">
              <Package className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Produk Terjual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{dashboard.totalPcs} <span className="text-sm font-normal text-muted-foreground">Pcs</span></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-3 space-y-0">
            <div className="p-2 bg-secondary rounded-lg text-primary">
              <Users className="w-5 h-5" />
            </div>
            <CardTitle className="text-sm font-medium text-muted-foreground">Customer Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{dashboard.uniqueCustomers.length} <span className="text-sm font-normal text-muted-foreground">Outlet</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Performance */}
      <Card>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-serif flex items-center gap-2">
            <span className="w-1.5 h-6 bg-foreground rounded-full"></span>
            Top Customer Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[300px]">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 font-semibold">Nama Outlet / Customer</th>
                  <th className="pb-3 font-semibold text-center">Freq</th>
                  <th className="pb-3 font-semibold text-right">Total Belanja</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(dashboard.customerLeaderboard).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                      Belum ada order masuk.
                    </td>
                  </tr>
                ) : (
                  Object.entries(dashboard.customerLeaderboard)
                    .sort((a, b) => b[1].totalBelanja - a[1].totalBelanja)
                    .map(([cust, data], idx) => (
                      <tr key={cust} className="border-b border-secondary last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-4 text-sm font-semibold">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-full bg-secondary text-muted-foreground flex items-center justify-center text-xs font-bold">
                              {idx + 1}
                            </div>
                            {cust}
                          </div>
                        </td>
                        <td className="py-4 text-sm text-center">
                          <span className="bg-secondary px-2 py-1 rounded-md text-xs font-bold">{data.freq}x</span>
                        </td>
                        <td className="py-4 text-sm font-bold text-primary text-right">
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
  );
}
