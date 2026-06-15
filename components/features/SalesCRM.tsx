"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Trophy, AlertTriangle, UserMinus, Crown, MessageCircle, BarChart3, Users, Filter, Plus, Edit, Send } from 'lucide-react';
import { Order, Customer } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface SalesCRMProps {
  initialOrders: Order[];
}

export function SalesCRM({ initialOrders }: SalesCRMProps) {
  const [activeTab, setActiveTab] = useState<'rfm' | 'leads' | 'broadcast'>('rfm');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch data with SWR
  const { data: orders = initialOrders, mutate: mutateOrders } = useSWR('/api/orders', fetcher, { fallbackData: initialOrders });
  const { data: customers = [], mutate: mutateCustomers, isLoading: isCustomersLoading } = useSWR('/api/customers', fetcher);
  const { data: leads = [], mutate: mutateLeads, isLoading: isLeadsLoading } = useSWR('/api/leads', fetcher);
  
  const isLoading = isCustomersLoading || isLeadsLoading;

  // Modal States
  const [customerModal, setCustomerModal] = useState<{ isOpen: boolean, data: any } | null>(null);
  const [leadModal, setLeadModal] = useState<{ isOpen: boolean, data: any } | null>(null);

  // Broadcast States
  const [broadcastSegment, setBroadcastSegment] = useState<string>('Jadwal Restock');
  const [broadcastTemplate, setBroadcastTemplate] = useState<string>('Halo kak dari [NAMA_OUTLET],\n\nMenurut catatan kami stok [PRODUK_FAVORIT] kakak biasanya sudah mulai menipis hari ini. Apakah mau langsung kami proses orderan untuk pengiriman besok?');
  const [blastStatuses, setBlastStatuses] = useState<Record<string, { status: 'idle' | 'loading' | 'success' | 'failed', msg?: string }>>({});
  const [isBlasting, setIsBlasting] = useState(false);
  const [apiToken, setApiToken] = useState<string>('SIMULATOR');

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const rfmData = useMemo(() => {
    const now = new Date().getTime();
    const statsMap: Record<string, any> = {};

    // Initialize stats with known customers
    customers.forEach((c: any) => {
        statsMap[c.name] = { 
            name: c.name,
            whatsapp: c.whatsapp,
            address: c.address,
            tier: c.tier,
            rowNumber: c.rowNumber,
            id: c.id,
            totalOrders: 0, 
            totalSpent: 0, 
            firstOrderTime: 0,
            lastOrderTime: 0,
            skuCount: {}
        };
    });

    orders.forEach((order: Order) => {
      let orderTime = order.id; 
      if (order.productionDate) {
          orderTime = new Date(order.productionDate).getTime();
          if (isNaN(orderTime)) orderTime = order.id;
      }

      if (!statsMap[order.customer]) {
          statsMap[order.customer] = { 
              name: order.customer, 
              whatsapp: '', 
              address: '', 
              tier: 'STANDARD',
              totalOrders: 0, 
              totalSpent: 0, 
              firstOrderTime: 0,
              lastOrderTime: 0,
              skuCount: {}
          };
      }

      statsMap[order.customer].totalOrders++;
      statsMap[order.customer].totalSpent += (order.grandTotal || 0);
      
      if (statsMap[order.customer].firstOrderTime === 0 || orderTime < statsMap[order.customer].firstOrderTime) {
          statsMap[order.customer].firstOrderTime = orderTime;
      }
      
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
      
      // Calculate Average Restock Interval
      let avgOrderInterval = 0;
      if (stat.totalOrders > 1 && stat.firstOrderTime && stat.lastOrderTime) {
          const totalDaysSpan = Math.floor((stat.lastOrderTime - stat.firstOrderTime) / (1000 * 3600 * 24));
          avgOrderInterval = Math.max(1, Math.floor(totalDaysSpan / (stat.totalOrders - 1)));
      }

      // Restock Prediction
      let isRestockDay = false;
      if (avgOrderInterval > 0 && daysSinceLastOrder >= avgOrderInterval - 1) {
          isRestockDay = true;
      }

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
          avgOrderInterval,
          isRestockDay,
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
        restockToday: analyzed.filter(a => a.isRestockDay).length,
    };

    return { list: filtered, summary };
  }, [orders, customers, searchQuery]);

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
            mutateCustomers();
            setCustomerModal(null);
        } else {
            alert('Gagal menyimpan data customer');
        }
    } catch (e) {
        console.error(e);
    }
  };

  const generateWA = (whatsapp: string, name: string, favorite: string, days: number) => {
    if (!whatsapp) return '#';
    const p = whatsapp.replace(/^0/, '62');
    
    let text = `Halo kak dari ${name},\n\n`;
    if (days > 14) {
        text += `Wah sudah ${days} hari nih kakak belum stok ulang ${favorite} lagi di Bolobake. Stoknya masih aman kak? Kebetulan kita lagi ada...`;
    } else {
        text += `Gimana kabarnya kak? Pesanan ${favorite} kemarin aman ya kualitasnya?`;
    }

    return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
  };

  const handleSaveLead = async () => {
    if (!leadModal) return;
    const isNew = !leadModal.data.rowNumber;
    const url = '/api/leads';
    const method = isNew ? 'POST' : 'PUT';

    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(leadModal.data)
        });
        if (res.ok) {
            mutateLeads();
            setLeadModal(null);
        } else {
            alert('Gagal menyimpan data lead');
        }
    } catch (e) {
        console.error(e);
    }
  };

  const handleMoveLead = async (lead: any, newStatus: string) => {
    if (newStatus === 'Closed Won') {
        // Move to customer and delete lead
        const custData = { name: lead.name, whatsapp: lead.whatsapp, address: '', tier: 'STANDARD' };
        await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(custData) });
        await fetch(`/api/leads?rowNumber=${lead.rowNumber}`, { method: 'DELETE' });
        mutateLeads();
        mutateCustomers();
        return;
    }

    try {
        await fetch('/api/leads', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...lead, status: newStatus })
        });
        mutateLeads();
    } catch (e) {
        console.error(e);
    }
  };

  // Broadcast Logic
  const filteredBroadcastTargets = useMemo(() => {
      if (broadcastSegment === 'Semua') return rfmData.list;
      if (broadcastSegment === 'Jadwal Restock') return rfmData.list.filter(c => c.isRestockDay);
      return rfmData.list.filter(c => c.segment === broadcastSegment);
  }, [rfmData.list, broadcastSegment]);

  const generateBroadcastMessage = (cust: any) => {
      let msg = broadcastTemplate;
      msg = msg.replace(/\[NAMA_OUTLET\]/g, cust.name || '');
      msg = msg.replace(/\[HARI_TERAKHIR_ORDER\]/g, cust.daysSinceLastOrder === 999 ? 'lama' : cust.daysSinceLastOrder.toString());
      msg = msg.replace(/\[PRODUK_FAVORIT\]/g, cust.favoriteProduct === '-' ? 'produk' : cust.favoriteProduct);
      return msg;
  };

  const handleBlastWhatsApp = async () => {
    if (filteredBroadcastTargets.length === 0) return;
    setIsBlasting(true);

    const newStatuses = { ...blastStatuses };

    for (const cust of filteredBroadcastTargets) {
      if (!cust.phone && !cust.whatsapp) {
        newStatuses[cust.id] = { status: 'failed', msg: 'No WA Kosong' };
        setBlastStatuses({ ...newStatuses });
        continue;
      }

      newStatuses[cust.id] = { status: 'loading' };
      setBlastStatuses({ ...newStatuses });

      try {
        const msg = generateBroadcastMessage(cust);
        const res = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cust.whatsapp || cust.phone,
            message: msg,
            token: apiToken
          })
        });

        const result = await res.json();
        if (result.success) {
          newStatuses[cust.id] = { status: 'success', msg: result.simulated ? 'Simulated ✅' : 'Sent ✅' };
        } else {
          newStatuses[cust.id] = { status: 'failed', msg: result.error || 'Gagal' };
        }
      } catch (e) {
        newStatuses[cust.id] = { status: 'failed', msg: 'Network Error' };
      }
      setBlastStatuses({ ...newStatuses });
    }

    setIsBlasting(false);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Sales & Marketing CRM</h2>
          </div>
        </header>

        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-600 to-cyan-500 border-0 shadow-lg">
                    <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                        <Crown className="w-8 h-8 text-white/90 mb-2" />
                        <h4 className="text-2xl font-bold text-white">{rfmData.summary.champions}</h4>
                        <p className="text-xs text-white/80 uppercase font-bold tracking-wider mt-1">Champions</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-violet-600 to-fuchsia-500 border-0 shadow-lg">
                    <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                        <Users className="w-8 h-8 text-white/90 mb-2" />
                        <h4 className="text-2xl font-bold text-white">{rfmData.summary.loyal}</h4>
                        <p className="text-xs text-white/80 uppercase font-bold tracking-wider mt-1">Loyal</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500 to-red-500 border-0 shadow-lg">
                    <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                        <AlertTriangle className="w-8 h-8 text-white/90 mb-2" />
                        <h4 className="text-2xl font-bold text-white">{rfmData.summary.atRisk}</h4>
                        <p className="text-xs text-white/80 uppercase font-bold tracking-wider mt-1">At Risk (&gt;14 Hari)</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-slate-600 to-slate-800 border-0 shadow-lg">
                    <CardContent className="p-4 flex flex-col justify-center items-center text-center">
                        <UserMinus className="w-8 h-8 text-white/70 mb-2" />
                        <h4 className="text-2xl font-bold text-white">{rfmData.summary.hibernating}</h4>
                        <p className="text-xs text-white/70 uppercase font-bold tracking-wider mt-1">Hibernating</p>
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
                {activeTab === 'leads' && (
                    <Button size="sm" onClick={() => setLeadModal({ isOpen: true, data: { name: '', whatsapp: '', notes: '', status: 'Prospek Baru' } })}>
                        <Plus className="w-4 h-4 mr-1" /> Tambah Leads
                    </Button>
                )}
            </div>

            {/* Tab: RFM Database */}
            {activeTab === 'rfm' && (
                <Card className="border-border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-sm text-left min-w-[800px]">
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
                                            <div className="text-[10px] text-muted-foreground font-medium">{cust.whatsapp || 'No WA (-) '} • {cust.tier}</div>
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
                                                href={generateWA(cust.whatsapp, cust.name, cust.favoriteProduct, cust.daysSinceLastOrder)} 
                                                target="_blank" rel="noreferrer"
                                                className={`inline-flex p-2 rounded-lg transition-colors ${!cust.whatsapp ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : cust.segment === 'At Risk' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
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

            {/* Tab: Leads Pipeline */}
            {activeTab === 'leads' && (
                <div className="flex gap-4 overflow-x-auto pb-4 items-start">
                    {['Prospek Baru', 'Dihubungi', 'Kirim Sampel', 'Negosiasi', 'Closed Won'].map(status => (
                        <div key={status} className="bg-slate-100 dark:bg-slate-900 rounded-xl p-3 w-80 shrink-0 border border-border">
                            <h3 className="font-bold mb-3 flex items-center justify-between">
                                {status}
                                <span className="bg-slate-200 dark:bg-slate-800 text-xs px-2 py-1 rounded-full text-slate-600 dark:text-slate-400">
                                    {leads.filter((l: any) => l.status === status).length}
                                </span>
                            </h3>
                            <div className="space-y-3 min-h-[500px]">
                                {leads.filter((l: any) => l.status === status).map((lead: any) => (
                                    <Card key={lead.id} className="cursor-pointer border-border hover:border-primary transition-colors">
                                        <CardContent className="p-3">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-sm">{lead.name}</h4>
                                                <button onClick={() => setLeadModal({ isOpen: true, data: lead })} className="text-muted-foreground hover:text-primary"><Edit className="w-3 h-3" /></button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mb-2">{lead.whatsapp || 'No WA (-)'}</p>
                                            {lead.notes && <p className="text-xs bg-muted p-2 rounded-md mb-2 italic line-clamp-2">{lead.notes}</p>}
                                            
                                            <div className="mt-3 pt-2 border-t border-border">
                                                <select 
                                                    className="w-full text-xs bg-transparent border-none focus:ring-0 cursor-pointer text-primary font-medium"
                                                    value={lead.status}
                                                    onChange={(e) => handleMoveLead(lead, e.target.value)}
                                                >
                                                    <option value="Prospek Baru">Pindah ke: Prospek Baru</option>
                                                    <option value="Dihubungi">Pindah ke: Dihubungi</option>
                                                    <option value="Kirim Sampel">Pindah ke: Kirim Sampel</option>
                                                    <option value="Negosiasi">Pindah ke: Negosiasi</option>
                                                    <option value="Closed Won">Goal! (Pindah ke Customer)</option>
                                                </select>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Tab: Smart Broadcast */}
            {activeTab === 'broadcast' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Template Editor */}
                    <Card className="border-border shadow-sm">
                        <CardContent className="p-6">
                            <h2 className="font-bold text-lg mb-4 flex items-center"><Send className="w-5 h-5 mr-2 text-primary" /> Editor Pesan (Smart Broadcast)</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-muted-foreground mb-2 block">Pilih Target Audience (Segmen)</label>
                                    <select 
                                        className="w-full p-2.5 rounded-lg border border-border bg-background"
                                        value={broadcastSegment}
                                        onChange={(e) => setBroadcastSegment(e.target.value)}
                                    >
                                        <option value="Jadwal Restock">🎯 Waktunya Restock Hari Ini ({rfmData.summary.restockToday})</option>
                                        <option value="Semua">Semua Pelanggan ({rfmData.list.length})</option>
                                        <option value="Champions">👑 Champions ({rfmData.summary.champions})</option>
                                        <option value="Loyal">👥 Loyal ({rfmData.summary.loyal})</option>
                                        <option value="At Risk">⚠️ At Risk (&gt;14 Hari) ({rfmData.summary.atRisk})</option>
                                        <option value="Hibernating">💤 Hibernating (&gt;30 Hari) ({rfmData.summary.hibernating})</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-muted-foreground mb-2 flex items-center justify-between">
                                        API Key (Kosongkan = Simulator Gratis)
                                    </label>
                                    <Input 
                                        placeholder="Masukkan Token Fonnte / WABlas (Opsional)" 
                                        value={apiToken === 'SIMULATOR' ? '' : apiToken} 
                                        onChange={e => setApiToken(e.target.value || 'SIMULATOR')} 
                                    />
                                    {apiToken === 'SIMULATOR' && <p className="text-xs text-amber-600 mt-1">Saat ini berjalan di Mode Simulator. Pesan tidak akan benar-benar terkirim ke WhatsApp.</p>}
                                </div>

                                <div>
                                    <label className="text-sm font-bold text-muted-foreground mb-2 flex items-center justify-between">
                                        Template Pesan WA
                                        <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-md">Gunakan Variabel Ajaib</span>
                                    </label>
                                    <textarea 
                                        className="w-full p-3 rounded-lg border border-border bg-background min-h-[150px] text-sm"
                                        value={broadcastTemplate}
                                        onChange={(e) => setBroadcastTemplate(e.target.value)}
                                        placeholder="Ketik pesan Anda di sini..."
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <button onClick={() => setBroadcastTemplate(prev => prev + ' [NAMA_OUTLET]')} className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded hover:bg-slate-300 transition-colors">[NAMA_OUTLET]</button>
                                        <button onClick={() => setBroadcastTemplate(prev => prev + ' [HARI_TERAKHIR_ORDER]')} className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded hover:bg-slate-300 transition-colors">[HARI_TERAKHIR_ORDER]</button>
                                        <button onClick={() => setBroadcastTemplate(prev => prev + ' [PRODUK_FAVORIT]')} className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded hover:bg-slate-300 transition-colors">[PRODUK_FAVORIT]</button>
                                    </div>
                                </div>

                                <Button onClick={handleBlastWhatsApp} disabled={isBlasting || filteredBroadcastTargets.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 flex items-center justify-center">
                                    <Send className={`w-5 h-5 mr-2 ${isBlasting ? 'animate-pulse' : ''}`} /> 
                                    {isBlasting ? 'Sedang Mem-Blast...' : 'Tembak Pesan Sekarang! (Direct Blast API)'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Right: Preview List */}
                    <Card className="border-border shadow-sm bg-slate-50 dark:bg-slate-900/50">
                        <CardContent className="p-6">
                            <h2 className="font-bold text-lg mb-4 flex items-center justify-between">
                                Daftar Antrian Tembak
                                <span className="text-sm bg-primary text-white px-3 py-1 rounded-full">{filteredBroadcastTargets.length} Outlet</span>
                            </h2>
                            
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                                {filteredBroadcastTargets.length === 0 && (
                                    <p className="text-muted-foreground text-center py-8">Tidak ada outlet di antrian ini.</p>
                                )}
                                {filteredBroadcastTargets.map((cust, idx) => {
                                    const previewMsg = generateBroadcastMessage(cust);
                                    const blastStatus = blastStatuses[cust.id];

                                    return (
                                        <div key={idx} className={`p-3 rounded-lg border shadow-sm flex flex-col gap-2 relative transition-all ${blastStatus?.status === 'success' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20' : blastStatus?.status === 'failed' ? 'bg-red-50 border-red-200 dark:bg-red-950/20' : 'bg-white dark:bg-slate-950 border-border'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold text-sm">{cust.name}</h4>
                                                    <p className="text-[10px] text-muted-foreground">{cust.whatsapp || cust.phone || 'No WA Kosong'}</p>
                                                </div>
                                                <div className="text-right">
                                                    {blastStatus?.status === 'loading' && <span className="text-xs text-blue-500 animate-pulse font-bold">Sedang Mengirim...</span>}
                                                    {blastStatus?.status === 'success' && <span className="text-xs text-emerald-600 font-bold">{blastStatus.msg}</span>}
                                                    {blastStatus?.status === 'failed' && <span className="text-xs text-red-600 font-bold">{blastStatus.msg}</span>}
                                                    {!blastStatus && <span className="text-xs text-muted-foreground font-medium">Menunggu Antrian</span>}
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2 rounded-md">
                                                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{previewMsg}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            
      </div>

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

      {/* Lead Form Modal */}
      <Dialog open={!!leadModal} onOpenChange={(open) => !open && setLeadModal(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader><DialogTitle>{leadModal?.data.rowNumber ? 'Edit Leads Prospek' : 'Tambah Prospek Baru'}</DialogTitle></DialogHeader>
            {leadModal && (
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Nama Prospek / Kafe</label>
                        <Input value={leadModal.data.name} onChange={e => setLeadModal(prev => prev ? { ...prev, data: { ...prev.data, name: e.target.value } } : null)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">No WhatsApp PIC</label>
                        <Input placeholder="Contoh: 08123456789" value={leadModal.data.whatsapp} onChange={e => setLeadModal(prev => prev ? { ...prev, data: { ...prev.data, whatsapp: e.target.value } } : null)} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Catatan / Estimasi Kebutuhan</label>
                        <textarea className="w-full border border-border bg-background p-2 rounded-md text-sm min-h-[80px]" placeholder="Misal: Butuh 100pcs croissant per minggu" value={leadModal.data.notes} onChange={e => setLeadModal(prev => prev ? { ...prev, data: { ...prev.data, notes: e.target.value } } : null)} />
                    </div>
                </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={() => setLeadModal(null)}>Batal</Button>
                <Button onClick={handleSaveLead}>Simpan Data</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
