"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Trophy, AlertTriangle, UserMinus, Crown, MessageCircle, BarChart3, Users, Filter, Plus, Edit, Send } from 'lucide-react';
import { Order, Customer } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface SalesCRMProps {
  initialOrders: Order[];
}

export function SalesCRM({ initialOrders }: SalesCRMProps) {
  const [activeMenu, setActiveMenu] = useState('sales');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'rfm' | 'leads' | 'broadcast'>('rfm');
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Edit/Add Customer Modal
  const [customerModal, setCustomerModal] = useState<{ isOpen: boolean, data: any } | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const rfmData = useMemo(() => {
    const now = new Date().getTime();
    const statsMap: Record<string, any> = {};

    // Initialize stats with known customers
    customers.forEach(c => {
        statsMap[c.name] = { 
            name: c.name,
            phone: c.whatsapp,
            address: c.address,
            tier: c.tier,
            rowNumber: c.rowNumber,
            id: c.id,
            totalOrders: 0, 
            totalSpent: 0, 
            lastOrderTime: 0,
            skuCount: {}
        };
    });

    initialOrders.forEach(order => {
      let orderTime = order.id; 
      if (order.productionDate) {
          orderTime = new Date(order.productionDate).getTime();
          if (isNaN(orderTime)) orderTime = order.id;
      }

      if (!statsMap[order.customer]) {
          statsMap[order.customer] = { 
              name: order.customer, 
              phone: '', 
              address: '', 
              tier: 'STANDARD',
              totalOrders: 0, 
              totalSpent: 0, 
              lastOrderTime: 0,
              skuCount: {}
          };
      }

      statsMap[order.customer].totalOrders++;
      statsMap[order.customer].totalSpent += (order.grandTotal || 0);
      if (orderTime > statsMap[order.customer].lastOrderTime) {
          statsMap[order.customer].lastOrderTime = orderTime;
      }

      // Track favorite product
      order.items?.forEach(item => {
          if (!item.sku.includes('(sample)')) {
              statsMap[order.customer].skuCount[item.sku] = (statsMap[order.customer].skuCount[item.sku] || 0) + item.qty;
          }
      });
    });

    const analyzed = Object.values(statsMap).map(stat => {
      const daysSinceLastOrder = stat.lastOrderTime ? Math.floor((now - stat.lastOrderTime) / (1000 * 3600 * 24)) : 999;
      
      let segment = 'Loyal';
      let segmentColor = 'bg-blue-100 text-blue-700';
      let icon = Users;

      if (daysSinceLastOrder > 30) {
          segment = 'Hibernating';
          segmentColor = 'bg-slate-200 text-slate-600';
          icon = UserMinus;
      } else if (daysSinceLastOrder > 14) {
          segment = 'At Risk';
          segmentColor = 'bg-rose-100 text-rose-700 border border-rose-300';
          icon = AlertTriangle;
      } else if (stat.totalOrders >= 5 && stat.totalSpent > 1000000) {
          segment = 'Champions';
          segmentColor = 'bg-amber-100 text-amber-700 border border-amber-300';
          icon = Crown;
      }

      // Find favorite product
      let favoriteProduct = '-';
      let maxQty = 0;
      Object.entries(stat.skuCount).forEach(([sku, qty]) => {
          if ((qty as number) > maxQty) {
              maxQty = qty as number;
              favoriteProduct = sku;
          }
      });

      return {
          ...stat,
          daysSinceLastOrder,
          segment,
          segmentColor,
          icon,
          favoriteProduct
      };
    });

    // Filter by search
    let filtered = analyzed;
    if (searchQuery) {
        filtered = analyzed.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()) || a.segment.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    filtered.sort((a, b) => b.totalSpent - a.totalSpent); // Sort by monetary by default

    // Summary counts
    const summary = {
        champions: analyzed.filter(a => a.segment === 'Champions').length,
        loyal: analyzed.filter(a => a.segment === 'Loyal').length,
        atRisk: analyzed.filter(a => a.segment === 'At Risk').length,
        hibernating: analyzed.filter(a => a.segment === 'Hibernating').length,
    };

    return { list: filtered, summary };
  }, [initialOrders, customers, searchQuery]);

  const handleSaveCustomer = async () => {
    if (!customerModal) return;
    const isNew = !customerModal.data.rowNumber;
    const url = '/api/customers';
    const method = isNew ? 'POST' : 'PUT';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(customerModal.data)
        });
        if (res.ok) {
            fetchCustomers();
            setCustomerModal(null);
        } else {
            alert('Gagal menyimpan data customer');
        }
    } catch (e) {
        console.error(e);
    }
  };

  const generateWA = (phone: string, name: string, favorite: string, days: number) => {
    if (!phone) return '#';
    const p = phone.replace(/^0/, '62');
    
    let text = `Halo kak dari ${name},\n\n`;
    if (days > 14) {
        text += `Wah sudah ${days} hari nih kakak belum stok ulang ${favorite} lagi di Bolobake. Stoknya masih aman kak? Kebetulan kita lagi ada...`;
    } else {
        text += `Gimana kabarnya kak? Pesanan ${favorite} kemarin aman ya kualitasnya?`;
    }

    return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar 
        activeMenu={activeMenu} 
        setActiveMenu={setActiveMenu} 
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
        <header className="h-16 flex items-center justify-between px-4 sm:px-8 shrink-0 bg-white/50 dark:bg-black/20 backdrop-blur-md border-b border-border shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Sales & Marketing CRM</h1>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-border">
                    <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                        <Crown className="w-8 h-8 text-amber-500 mb-2" />
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{rfmData.summary.champions}</h4>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Champions</p>
                    </CardContent>
                </Card>
                <Card className="bg-white dark:bg-slate-900 shadow-sm border-border">
                    <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                        <Users className="w-8 h-8 text-blue-500 mb-2" />
                        <h4 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{rfmData.summary.loyal}</h4>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Loyal</p>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 shadow-sm">
                    <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                        <AlertTriangle className="w-8 h-8 text-red-500 mb-2" />
                        <h4 className="text-2xl font-bold text-red-700 dark:text-red-400">{rfmData.summary.atRisk}</h4>
                        <p className="text-xs text-red-600/80 dark:text-red-400/80 uppercase font-bold tracking-wider mt-1">At Risk (&gt;14 Hari)</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-100 dark:bg-slate-800 border-border shadow-sm">
                    <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                        <UserMinus className="w-8 h-8 text-slate-500 mb-2" />
                        <h4 className="text-2xl font-bold text-slate-700 dark:text-slate-300">{rfmData.summary.hibernating}</h4>
                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mt-1">Hibernating</p>
                    </CardContent>
                </Card>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-center bg-white dark:bg-slate-900 p-2 rounded-xl shadow-sm border border-border">
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto p-1">
                    <button onClick={() => setActiveTab('rfm')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'rfm' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Database & RFM</button>
                    <button onClick={() => setActiveTab('leads')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'leads' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Leads Pipeline</button>
                    <button onClick={() => setActiveTab('broadcast')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'broadcast' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>Smart Broadcast</button>
                </div>
                
                {activeTab === 'rfm' && (
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="flex-1 flex items-center bg-muted/50 px-3 py-1.5 rounded-lg border border-border focus-within:border-primary">
                            <Search className="w-4 h-4 text-muted-foreground mr-2" />
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari nama outlet..." className="bg-transparent text-sm outline-none w-full" />
                        </div>
                        <Button size="sm" onClick={() => setCustomerModal({ isOpen: true, data: { name: '', whatsapp: '', address: '', tier: 'STANDARD' } })}>
                            <Plus className="w-4 h-4 mr-1" /> Outlet
                        </Button>
                    </div>
                )}
            </div>

            {/* Tab: RFM Database */}
            {activeTab === 'rfm' && (
                <Card className="border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold">
                                <tr>
                                    <th className="px-4 py-3">Outlet</th>
                                    <th className="px-4 py-3">Segmen (RFM)</th>
                                    <th className="px-4 py-3 text-center">F (Freq)</th>
                                    <th className="px-4 py-3 text-right">M (Monetary / CLV)</th>
                                    <th className="px-4 py-3 text-center">R (Recency)</th>
                                    <th className="px-4 py-3">Rekomendasi / Top Produk</th>
                                    <th className="px-4 py-3 text-center">Aksi WA</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {isLoading ? (
                                    <tr><td colSpan={7} className="text-center py-8">Memuat data...</td></tr>
                                ) : rfmData.list.map((cust, idx) => (
                                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-foreground flex items-center gap-2">
                                                {cust.name}
                                                <button onClick={() => setCustomerModal({ isOpen: true, data: cust })} className="text-muted-foreground hover:text-primary"><Edit className="w-3 h-3" /></button>
                                            </div>
                                            <div className="text-[10px] text-muted-foreground font-medium">{cust.phone || 'No WA (-) '} • {cust.tier}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cust.segmentColor}`}>
                                                <cust.icon className="w-3 h-3" /> {cust.segment}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold">{cust.totalOrders}x</td>
                                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatRp(cust.totalSpent)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {cust.daysSinceLastOrder === 999 ? (
                                                <span className="text-muted-foreground text-xs italic">Belum Order</span>
                                            ) : (
                                                <span className={`font-bold ${cust.daysSinceLastOrder > 14 ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{cust.daysSinceLastOrder} Hari</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-xs">
                                            <span className="text-muted-foreground">Sering beli: </span>
                                            <span className="font-bold text-primary">{cust.favoriteProduct}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <a 
                                                href={generateWA(cust.phone, cust.name, cust.favoriteProduct, cust.daysSinceLastOrder)} 
                                                target="_blank" rel="noreferrer"
                                                className={`inline-flex p-2 rounded-lg transition-colors ${!cust.phone ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : cust.segment === 'At Risk' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Placeholder for other tabs */}
            {activeTab === 'leads' && (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl">
                    <Trophy className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Papan Kanban Prospek (Leads)</h2>
                    <p className="text-muted-foreground max-w-md">Fitur ini sedang dalam tahap pengembangan. Nantinya Anda bisa menggeser kartu klien baru dari 'Prospek' hingga 'Closed Won'.</p>
                </div>
            )}

            {activeTab === 'broadcast' && (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl">
                    <Send className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Smart Broadcast Generator</h2>
                    <p className="text-muted-foreground max-w-md">Kirim ribuan pesan WA personal berdasarkan DNA belanja outlet dalam sekali klik. Segera Hadir.</p>
                </div>
            )}
            
        </div>
      </main>

      {/* Customer Form Modal */}
      <Dialog open={!!customerModal} onOpenChange={(open) => !open && setCustomerModal(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{customerModal?.data.rowNumber ? 'Edit Outlet' : 'Tambah Outlet Baru'}</DialogTitle></DialogHeader>
            {customerModal && (
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Nama Outlet</label>
                        <Input value={customerModal.data.name} onChange={e => setCustomerModal(prev => prev ? { ...prev, data: { ...prev.data, name: e.target.value } } : null)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">No WhatsApp</label>
                        <Input placeholder="Contoh: 08123456789" value={customerModal.data.whatsapp} onChange={e => setCustomerModal(prev => prev ? { ...prev, data: { ...prev.data, whatsapp: e.target.value } } : null)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Tier Harga</label>
                        <select className="w-full border border-border p-2 rounded-md" value={customerModal.data.tier} onChange={e => setCustomerModal(prev => prev ? { ...prev, data: { ...prev.data, tier: e.target.value } } : null)}>
                            <option value="STANDARD">STANDARD</option>
                            <option value="TIER_A">TIER A</option>
                            <option value="TIER_B">TIER B</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Alamat</label>
                        <Input value={customerModal.data.address} onChange={e => setCustomerModal(prev => prev ? { ...prev, data: { ...prev.data, address: e.target.value } } : null)} />
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setCustomerModal(null)}>Batal</Button>
                <Button onClick={handleSaveCustomer}>Simpan Data</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
