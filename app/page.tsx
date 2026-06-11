"use client";
import React, { useState, useMemo } from 'react';
import { Plus, Trash2, ShoppingBag, TrendingUp, Users, Package, ChefHat, CheckCircle2, Truck, FileText, History, Edit, X, Clock, ScanLine, Calendar, Filter, Search } from 'lucide-react';
import Link from 'next/link';

// --- MOCK DATA KATALOG (Representasi 110+ SKU) ---
// Katalog akan di-fetch dari Google Sheets (API)

interface OrderItem {
  id: number;
  sku: string;
  price: number;
  qty: number;
}

interface Order {
  id: number;
  rowNumber?: number;
  customer: string;
  productionDate?: string;
  deliveryDate?: string;
  items: OrderItem[];
  isFreeShipping: boolean;
  shippingCost: number;
  notes: string;
  subtotal: number;
  grandTotal: number;
  totalPcs: number;
  timestamp: string;
}

export default function Home() {
  // --- STATE MODUL INPUT (PANEL KIRI) ---
  const [katalog, setKatalog] = useState<any[]>([]);
  const [customer, setCustomer] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ id: Date.now(), sku: '', price: 0, qty: 1 }]);
  const [isFreeShipping, setIsFreeShipping] = useState(true);
  const [shippingCost, setShippingCost] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('');
  const [deliveryRoute, setDeliveryRoute] = useState('');
  
  // UI States & Edit Feature
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');
  const [orderHistory, setOrderHistory] = useState<Order[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);
  
  // Analytics Filters
  const [filterStartDate, setFilterStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterEndDate, setFilterEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchHistoryInput, setSearchHistoryInput] = useState('');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [highlightedOutlet, setHighlightedOutlet] = useState('');

  React.useEffect(() => {
    const timer = setTimeout(() => setSearchHistoryQuery(searchHistoryInput), 300);
    return () => clearTimeout(timer);
  }, [searchHistoryInput]);
  
  // Fetch Katalog & Orders
  const fetchOrders = () => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setOrderHistory(data.data);
        }
      })
      .catch(err => console.error("Failed to load orders", err));
  };

  React.useEffect(() => {
    fetch('/api/catalog')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setKatalog(data.data);
        }
      })
      .catch(err => console.error("Failed to load catalog", err));
      
    fetchOrders();
  }, []);
  
  // --- STATE MODUL ANALITIK (PANEL KANAN) DIKALKULASI OTOMATIS ---
  const dashboard = useMemo(() => {
    let totalOmset = 0;
    let totalOrders = 0;
    let totalPcs = 0;
    const uniqueCustomers = new Set<string>();
    const variantPerformance: Record<string, { qty: number; omset: number }> = {};
    const customerLeaderboard: Record<string, { freq: number; totalBelanja: number }> = {};

    // Helper to safely parse mixed date formats (YYYY-MM-DD or DD/MM/YYYY)
    const getTimestamp = (dateStr: string) => {
      if (!dateStr) return 0;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr).getTime();
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3 && parts[2].length === 4) {
        return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`).getTime();
      }
      const ts = new Date(dateStr).getTime();
      return isNaN(ts) ? 0 : ts;
    };

    const filteredOrders = orderHistory.filter(order => {
      let orderDate = order.productionDate;
      if (!orderDate) {
        try {
          orderDate = new Date(order.timestamp).toISOString().split('T')[0];
        } catch (e) {
          orderDate = '2026-01-01';
        }
      }
      
      const orderTime = getTimestamp(orderDate);
      
      if (filterStartDate) {
        const startTime = new Date(filterStartDate).getTime();
        if (orderTime < startTime) return false;
      }
      
      if (filterEndDate) {
        // Tambahkan 24 jam untuk mencakup seluruh hari pada tanggal akhir
        const endTime = new Date(filterEndDate).getTime() + (24 * 60 * 60 * 1000) - 1;
        if (orderTime > endTime) return false;
      }
      
      return true;
    });

    totalOrders = filteredOrders.length;

    filteredOrders.forEach(order => {
      totalOmset += order.grandTotal;
      totalPcs += order.totalPcs;
      uniqueCustomers.add(order.customer);

      order.items.forEach(item => {
        if (!variantPerformance[item.sku]) variantPerformance[item.sku] = { qty: 0, omset: 0 };
        variantPerformance[item.sku].qty += Number(item.qty);
        variantPerformance[item.sku].omset += (Number(item.price) * Number(item.qty));
      });

      if (!customerLeaderboard[order.customer]) customerLeaderboard[order.customer] = { freq: 0, totalBelanja: 0 };
      customerLeaderboard[order.customer].freq += 1;
      customerLeaderboard[order.customer].totalBelanja += order.grandTotal;
    });

    return {
      totalOmset,
      totalOrders,
      totalPcs,
      uniqueCustomers: Array.from(uniqueCustomers),
      variantPerformance,
      customerLeaderboard
    };
  }, [orderHistory, filterStartDate, filterEndDate]);

  // Filtered history for Riwayat tab (shares the same date filter as Dashboard)
  const filteredHistory = useMemo(() => {
    const getTimestamp = (dateStr: string) => {
      if (!dateStr) return 0;
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return new Date(dateStr).getTime();
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3 && parts[2].length === 4) {
        return new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`).getTime();
      }
      const ts = new Date(dateStr).getTime();
      return isNaN(ts) ? 0 : ts;
    };

    return orderHistory.filter(order => {
      // 1. Prioritize search query so it works instantly regardless of dates
      if (searchHistoryQuery && !order.customer.toLowerCase().includes(searchHistoryQuery.toLowerCase())) {
        return false;
      }

      // 2. Then check dates
      const orderDate = order.productionDate || '';
      if (!orderDate) return true;
      
      const orderTime = getTimestamp(orderDate);
      
      if (filterStartDate) {
        const startTime = new Date(filterStartDate).getTime();
        if (orderTime < startTime) return false;
      }
      
      if (filterEndDate) {
        const endTime = new Date(filterEndDate).getTime() + (24 * 60 * 60 * 1000) - 1;
        if (orderTime > endTime) return false;
      }

      return true;
    });
  }, [orderHistory, filterStartDate, filterEndDate, searchHistoryQuery]);

  // --- HANDLER MULTI-ITEM PICKER ---
  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), sku: '', price: 0, qty: 1 }]);
  };

  const handleItemChange = (id: number, field: string, value: string) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto-fill harga jika SKU dipilih dari katalog
        if (field === 'sku') {
          const foundProduct = katalog.find(p => p.nama.toLowerCase() === value.toLowerCase());
          if (foundProduct) updated.price = foundProduct.harga;
        }
        return updated;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  // --- KALKULASI LIVE ---
  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  const finalShipping = isFreeShipping ? 0 : Number(shippingCost) || 0;
  const grandTotal = subtotal + finalShipping;
  const totalPcsOrder = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  // --- HANDLER EDIT ORDER ---
  const handleEditOrder = (order: Order) => {
    setCustomer(order.customer);
    setProductionDate(order.productionDate || '');
    setDeliveryDate(order.deliveryDate || '');
    setItems(order.items);
    setIsFreeShipping(order.isFreeShipping);
    setShippingCost(order.shippingCost === 0 ? '' : String(order.shippingCost));
    
    // Parse Delivery metadata from notes if it exists
    let orderNotes = order.notes;
    const deliveryMatch = orderNotes.match(/^\[Delivery: (.*?)\]\n?/);
    if (deliveryMatch) {
      const parts = deliveryMatch[1].split(' - ');
      setDeliveryOption(parts[0]);
      if (parts[1]) setDeliveryRoute(parts[1]);
      orderNotes = orderNotes.replace(/^\[Delivery: (.*?)\]\n?/, '');
    } else {
      setDeliveryOption('');
      setDeliveryRoute('');
    }
    
    setNotes(orderNotes);
    setEditingOrderId(order.id);
  };

  const handleCancelEdit = () => {
    setCustomer('');
    setProductionDate('');
    setDeliveryDate('');
    setItems([{ id: Date.now(), sku: '', price: 0, qty: 1 }]);
    setNotes('');
    setDeliveryOption('');
    setDeliveryRoute('');
    setIsFreeShipping(true);
    setShippingCost('');
    setEditingOrderId(null);
  };

  const handleDeleteOrder = async () => {
    if (!editingOrderId) return;
    const orderToDelete = orderHistory.find(o => o.id === editingOrderId);
    if (!orderToDelete || !orderToDelete.rowNumber) {
      alert('Tidak dapat menemukan data pesanan untuk dihapus.');
      return;
    }

    if (!confirm('Apakah Anda yakin ingin membatalkan/menghapus pesanan ini secara permanen?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/orders?rowNumber=${orderToDelete.rowNumber}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Gagal menghapus dari Sheets');

      setToastMessage('Pesanan berhasil dibatalkan dan dihapus dari sistem!');
      fetchOrders();
      handleCancelEdit();
      
      setIsSubmitting(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus pesanan. Periksa koneksi internet Anda.');
      setIsSubmitting(false);
    }
  };

  // --- SUBMIT ORDER (OPERATIONAL WORKFLOW) ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi dasar
    if (!customer.trim() || items.length === 0 || items.some(i => !i.sku.trim())) {
      alert('Mohon lengkapi nama customer dan detail produk.');
      return;
    }

    setIsSubmitting(true);

    // Simulasi delay jaringan (API Call)
    setTimeout(async () => {
      const orderToEdit = editingOrderId ? orderHistory.find(o => o.id === editingOrderId) : null;
      
      const deliveryString = deliveryOption ? `[Delivery: ${deliveryOption}${deliveryRoute ? ` - ${deliveryRoute}` : ''}]` : '';
      const finalNotes = deliveryString ? `${deliveryString}\n${notes}` : notes;

      const newOrder: Order = {
        id: editingOrderId || Date.now(),
        rowNumber: orderToEdit?.rowNumber,
        customer: customer.trim(),
        productionDate,
        deliveryDate,
        items: [...items],
        isFreeShipping,
        shippingCost: finalShipping,
        notes: finalNotes,
        subtotal,
        grandTotal,
        totalPcs: totalPcsOrder,
        timestamp: orderToEdit ? orderToEdit.timestamp : new Date().toISOString()
      };

      try {
        const response = await fetch('/api/orders', {
          method: editingOrderId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newOrder)
        });
        
        if (!response.ok) throw new Error('Failed to save to Sheets');

        if (editingOrderId) {
          // Mode Edit: Update order yang sudah ada
          setToastMessage('Pesanan berhasil diperbarui (Sync to Sheets)!');
        } else {
          // Mode Buat Baru
          setToastMessage('Pesanan berhasil dikirim ke Dapur & Sheet!');
        }

        // Re-fetch data from API to ensure it matches Sheets
        fetchOrders();

        // Reset Form setelah sukses
        handleCancelEdit();
        
        setIsSubmitting(false);
        
        // Tampilkan Toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) {
        console.error(err);
        alert('Gagal menyimpan ke Google Sheets. Periksa koneksi internet Anda.');
        setIsSubmitting(false);
      }
    }, 600); // 600ms loading effect
  };

  // Helper untuk format rupiah
  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen lg:h-screen bg-[#FAF8F5] text-[#2C1810] font-sans selection:bg-[#D4A847] selection:text-white lg:overflow-hidden relative">
      
      {/* Custom Scrollbar */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #D4A847; }
      `}</style>

      {/* --- TOAST NOTIFICATION --- */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform ${showToast ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0 pointer-events-none'}`}>
        <div className="bg-[#2C1810] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-[#D4A847]" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PANEL KIRI: MODUL INPUT & ORDER MANAGEMENT                     */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[55%] flex flex-col lg:h-full border-b lg:border-b-0 lg:border-r border-[#e5e0d8] bg-[#FAF8F5]">
        
        {/* Header Fixed */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 border-b border-[#e5e0d8] bg-white/50 backdrop-blur-sm z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#2C1810] flex items-center gap-2">
              <ChefHat className="w-8 h-8 text-[#D4A847]" />
              Bolobake
            </h1>
            <p className="text-sm text-gray-500 font-medium tracking-wide mt-1">B2B ORDER MANAGEMENT</p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/catalog"
              className="bg-white border border-[#e5e0d8] text-[#2C1810] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 hover:border-[#D4A847] hover:text-[#D4A847] transition-all shadow-sm"
            >
              <ScanLine className="w-4 h-4" />
              Catalog Manager
            </Link>
            <div className="bg-[#D4A847]/10 text-[#D4A847] px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              System Online
            </div>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {editingOrderId && (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-bold">Mode Edit Pesanan Aktif</p>
                  <p className="text-xs text-blue-600">Perubahan akan memperbarui data di Google Sheets otomatis.</p>
                </div>
              </div>
              <button type="button" onClick={handleCancelEdit} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <form id="orderForm" onSubmit={handleSubmit} className="space-y-6 pb-6">
            
            {/* Header Pesanan */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e5e0d8] transition-all hover:shadow-md">
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-bold text-[#2C1810] mb-3">
                  <Users className="w-4 h-4 text-[#D4A847]" />
                  Informasi Customer
                </label>
                <input 
                  id="customerInput"
                  type="text" 
                  required
                  value={customer}
                  onChange={(e) => setCustomer(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const next = document.getElementById('productionDateInput');
                      if (next) { next.focus(); try { (next as any).showPicker(); } catch(e){} }
                    }
                  }}
                  className="w-full p-2 sm:p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] focus:border-transparent outline-none transition-all"
                  placeholder="Cari atau masukkan nama outlet..."
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    Tgl Produksi
                  </label>
                  <input 
                    id="productionDateInput"
                    type="date"
                    required
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = document.getElementById('deliveryDateInput');
                        if (next) { next.focus(); try { (next as any).showPicker(); } catch(e){} }
                      }
                    }}
                    className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none text-gray-600"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                    <Truck className="w-3.5 h-3.5" />
                    Tgl Pengiriman
                  </label>
                  <input 
                    id="deliveryDateInput"
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const next = document.getElementById(`skuInput-${items[0].id}`);
                        if (next) next.focus();
                      }
                    }}
                    className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Smart Multi-Item Picker */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e5e0d8] transition-all hover:shadow-md">
              <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                <label className="flex items-center gap-2 text-sm font-bold text-[#2C1810]">
                  <Package className="w-4 h-4 text-[#D4A847]" />
                  Detail Pesanan (Katalog Pintar)
                </label>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">110+ SKU</span>
              </div>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end group relative bg-gray-50/50 p-3 sm:p-2 rounded-lg border border-transparent hover:border-gray-200 transition-all">
                    <div className="w-full sm:flex-1 relative">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Produk (SKU)</label>
                      <input
                        id={`skuInput-${item.id}`}
                        type="text"
                        autoComplete="off"
                        required
                        value={item.sku}
                        onChange={(e) => {
                          handleItemChange(item.id, 'sku', e.target.value);
                          setActiveDropdownId(item.id);
                        }}
                        onFocus={() => setActiveDropdownId(item.id)}
                        onBlur={() => setTimeout(() => setActiveDropdownId(null), 200)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const next = document.getElementById(`qtyInput-${item.id}`);
                            if (next) next.focus();
                            setActiveDropdownId(null);
                          }
                        }}
                        className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#D4A847] outline-none"
                        placeholder="Ketik kata kunci..."
                      />
                      {activeDropdownId === item.id && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-y-auto">
                          {katalog
                            .filter(p => p.isActive && p.nama.toLowerCase().includes(item.sku.toLowerCase()))
                            .map(p => (
                              <div
                                key={p.id}
                                className="px-3 py-2 text-sm hover:bg-[#D4A847]/10 cursor-pointer flex justify-between items-center border-b border-gray-50 last:border-0"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleItemChange(item.id, 'sku', p.nama);
                                  setActiveDropdownId(null);
                                  const next = document.getElementById(`qtyInput-${item.id}`);
                                  if (next) next.focus();
                                }}
                              >
                                <span className="font-medium text-[#2C1810]">{p.nama}</span>
                                <span className="text-xs font-bold text-[#D4A847]">{formatRp(p.harga)}</span>
                              </div>
                            ))}
                          {katalog.filter(p => p.isActive && p.nama.toLowerCase().includes(item.sku.toLowerCase())).length === 0 && (
                            <div className="px-3 py-3 text-sm text-center text-gray-400">Tidak ada produk cocok.</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto items-end">
                      <div className="flex-1 sm:w-20">
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Qty</label>
                      <input
                        id={`qtyInput-${item.id}`}
                        type="number"
                        min="1"
                        required
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                        className="w-full p-2.5 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#D4A847] outline-none text-center"
                      />
                      </div>
                      <div className="flex-[2]">
                        <label className="block text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Harga Satuan</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                        <input
                          type="number"
                          min="0"
                          required
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                          className="w-full p-2.5 pl-8 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#D4A847] outline-none"
                        />
                      </div>
                      </div>
                      
                      <button 
                        type="button" 
                        onClick={() => handleRemoveItem(item.id)} 
                        disabled={items.length === 1}
                        className={`mb-0.5 p-2.5 rounded-md transition-all ${items.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-400 hover:bg-red-50 hover:text-red-600'}`}
                      >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                type="button" 
                onClick={handleAddItem}
                className="mt-4 flex items-center gap-2 text-[#D4A847] font-semibold text-sm hover:text-[#b58e37] transition-colors px-2 py-1 sm:px-3 sm:py-2 rounded-md hover:bg-[#D4A847]/10"
              >
                <Plus className="w-4 h-4" /> Tambah Baris Produk
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Shipping & Logistics */}
              <div className="space-y-6">
                {/* Opsi Delivery */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e5e0d8] transition-all hover:shadow-md">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#2C1810] mb-4">
                    <Truck className="w-4 h-4 text-[#D4A847]" />
                    Opsi Delivery
                  </label>
                  <select
                    value={deliveryOption}
                    onChange={(e) => {
                      setDeliveryOption(e.target.value);
                      if (e.target.value !== 'DELIVERY BUDIMAS') setDeliveryRoute('');
                    }}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none appearance-none bg-white cursor-pointer mb-3 text-sm"
                  >
                    <option value="">Pilih Ekspedisi...</option>
                    <option value="DELIVERY BOLOBAKE">DELIVERY BOLOBAKE</option>
                    <option value="DELIVERY BUDIMAS">DELIVERY BUDIMAS</option>
                    <option value="EKSPEDISI KALOG">EKSPEDISI KALOG</option>
                    <option value="EKSPEDISI PAXEL">EKSPEDISI PAXEL</option>
                    <option value="TRAVEL">TRAVEL</option>
                  </select>

                  {deliveryOption === 'DELIVERY BUDIMAS' && (
                    <select
                      value={deliveryRoute}
                      onChange={(e) => setDeliveryRoute(e.target.value)}
                      required
                      className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none appearance-none bg-gray-50 cursor-pointer text-sm"
                    >
                      <option value="">Pilih Rute Budimas...</option>
                      <option value="Wonogiri">Wonogiri</option>
                      <option value="Boyolali">Boyolali</option>
                      <option value="Tawangmangu">Tawangmangu</option>
                    </select>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e5e0d8] transition-all hover:shadow-md">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#2C1810] mb-4">
                    <Package className="w-4 h-4 text-[#D4A847]" />
                    Logistik & Ongkir
                  </label>
                <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${isFreeShipping ? 'border-[#D4A847] bg-[#D4A847]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" checked={isFreeShipping} onChange={() => setIsFreeShipping(true)} className="w-4 h-4 accent-[#D4A847]"/>
                      <span className="text-sm font-medium">Gratis Ongkir (Solo)</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${!isFreeShipping ? 'border-[#D4A847] bg-[#D4A847]/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="radio" checked={!isFreeShipping} onChange={() => setIsFreeShipping(false)} className="w-4 h-4 accent-[#D4A847]"/>
                      <span className="text-sm font-medium">Luar Kota / Berbayar</span>
                    </label>
                </div>
                {!isFreeShipping && (
                    <div className="mt-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                        <input 
                          type="number" 
                          min="0"
                          placeholder="Nominal ongkir"
                          value={shippingCost} 
                          onChange={(e) => setShippingCost(e.target.value)}
                          className="w-full p-2.5 pl-8 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-[#D4A847] outline-none"
                        />
                      </div>
                    </div>
                )}
              </div>
            </div>

              {/* Catatan Khusus */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-[#e5e0d8] transition-all hover:shadow-md">
                <label className="flex items-center gap-2 text-sm font-bold text-[#2C1810] mb-4">
                  <FileText className="w-4 h-4 text-[#D4A847]" />
                  Instruksi Dapur
                </label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#D4A847] outline-none resize-none"
                  rows={4}
                  placeholder="Misal: Kirim jam 06.00 pagi, packing box terpisah, dll..."
                />
              </div>
            </div>
            
            {/* Spacer for sticky footer */}
            <div className="h-10"></div>
          </form>
        </div>

        {/* Sticky Footer / Action Bar */}
        <div className="bg-[#2C1810] text-white p-4 sm:p-6 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 sticky bottom-0 lg:static">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
              <div className="space-y-1 w-full sm:w-auto border-b sm:border-0 border-[#40261b] pb-4 sm:pb-0">
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span className="w-24">Subtotal:</span>
                  <span>{formatRp(subtotal)}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span className="w-24">Ongkir:</span>
                  <span>{formatRp(finalShipping)}</span>
                </div>
                <div className="flex items-center gap-4 text-2xl font-serif text-[#D4A847] pt-2">
                  <span className="w-24 font-sans text-lg font-normal text-white">Total:</span>
                  <span>{formatRp(grandTotal)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                {editingOrderId && (
                  <button 
                    type="button" 
                    onClick={handleDeleteOrder}
                    disabled={isSubmitting}
                    className="bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 border border-red-200 px-3 sm:px-5 py-3 sm:py-4 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 justify-center flex-1 sm:flex-none text-sm sm:text-base"
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> <span className="hidden sm:inline">Hapus</span>
                  </button>
                )}
                {editingOrderId && (
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                    className="bg-gray-700 hover:bg-gray-600 active:scale-95 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed flex-1 sm:flex-none text-sm sm:text-base"
                  >
                    Batal
                  </button>
                )}
                <button 
                  form="orderForm"
                  type="submit" 
                  disabled={isSubmitting}
                  className={`${editingOrderId ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-[#D4A847] hover:bg-[#b58e37] shadow-[#D4A847]/20'} active:scale-95 text-white px-4 sm:px-8 py-2 sm:py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg flex-1 sm:flex-none text-sm sm:text-base`}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Menyimpan...
                    </span>
                  ) : (
                    <>
                      {editingOrderId ? 'Update' : <span className="hidden sm:inline">Kirim ke Dapur & Sheet</span>} 
                      {!editingOrderId && <span className="sm:hidden">Kirim</span>}
                      {editingOrderId ? <Edit className="w-4 h-4 sm:w-5 sm:h-5 ml-1" /> : <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />}
                    </>
                  )}
                </button>
              </div>
            </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PANEL KANAN: MODUL ANALITIK & DASHBOARD (FIXED)                */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[45%] bg-white h-auto lg:h-full lg:overflow-y-auto flex flex-col">
        <div className="p-4 sm:p-8 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-10 gap-4 sm:gap-0">
          <h2 className="text-3xl font-serif text-[#2C1810]">Insights & Data</h2>
          
          {/* TAB NAVIGATION */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-white text-[#2C1810] shadow-sm' : 'text-gray-500 hover:text-[#2C1810]'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-[#2C1810] shadow-sm' : 'text-gray-500 hover:text-[#2C1810]'}`}
            >
              Riwayat
              {orderHistory.length > 0 && <span className="bg-[#D4A847] text-white text-[10px] px-1.5 py-0.5 rounded-full">{orderHistory.length}</span>}
            </button>
          </div>
        </div>
        
        <div className="p-4 sm:p-8 pt-6 flex-1">
          {activeTab === 'dashboard' ? (
            <div key="dashboard-view" className="animate-in fade-in">
              {/* Analytics Date Filter */}
              <div className="flex items-center justify-between mb-6 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#2C1810]">
                  <Filter className="w-4 h-4 text-[#D4A847]" />
                  Periode Produksi
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-[#D4A847] outline-none text-gray-700 bg-white"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input 
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-[#D4A847] outline-none text-gray-700 bg-white"
                  />
                  <button 
                    onClick={() => { 
                      const today = new Date().toISOString().split('T')[0];
                      setFilterStartDate(today); 
                      setFilterEndDate(today); 
                    }}
                    className="text-xs text-gray-400 hover:text-red-500 ml-1"
                    title="Reset Filter"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Global Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-[#2C1810] to-[#40261b] text-white p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp className="w-24 h-24" />
                  </div>
                  <p className="text-sm text-gray-300 mb-2 font-medium">Total Omset (Periode)</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#D4A847]">{formatRp(dashboard.totalOmset)}</p>
                </div>
                
                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#e5e0d8] flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-[#D4A847]">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Jumlah Transaksi</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-[#2C1810]">{dashboard.totalOrders} <span className="text-sm sm:text-base font-normal text-gray-400">Order</span></p>
                </div>

                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#e5e0d8] flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-[#D4A847]">
                      <Package className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Total Produk Terjual</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-[#2C1810]">{dashboard.totalPcs} <span className="text-sm sm:text-base font-normal text-gray-400">Pcs</span></p>
                </div>

                <div className="bg-[#FAF8F5] p-5 rounded-2xl border border-[#e5e0d8] flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-[#D4A847]">
                      <Users className="w-5 h-5" />
                    </div>
                    <p className="text-sm text-gray-500 font-medium">Customer Aktif</p>
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-[#2C1810]">{dashboard.uniqueCustomers.length} <span className="text-sm sm:text-base font-normal text-gray-400">Outlet</span></p>
                </div>
              </div>

              {/* Variant Performance */}
              <div className="mb-10 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-serif mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#D4A847] rounded-full"></span>
                  Performa Varian Terlaris
                </h3>
                
                <div className="space-y-5">
                  {Object.entries(dashboard.variantPerformance).length === 0 ? (
                    <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Belum ada data penjualan hari ini.</p>
                    </div>
                  ) : (
                    Object.entries(dashboard.variantPerformance)
                      .sort((a, b) => b[1].qty - a[1].qty)
                      .map(([sku, data]) => {
                        const percentage = dashboard.totalOmset > 0 ? ((data.omset / dashboard.totalOmset) * 100).toFixed(1) : '0';
                        return (
                          <div key={sku} className="group">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="font-semibold text-[#2C1810]">{sku} <span className="text-gray-400 font-normal ml-1">({data.qty} pcs)</span></span>
                              <span className="font-medium text-[#D4A847]">{percentage}% <span className="text-gray-400 text-xs font-normal ml-1">({formatRp(data.omset)})</span></span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-[#D4A847] h-2.5 rounded-full transition-all duration-1000 ease-out group-hover:bg-[#b58e37]" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>

              {/* Customer Leaderboard */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-serif mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-[#2C1810] rounded-full"></span>
                  Top Customer Hari Ini
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[300px]">
                    <thead>
                      <tr className="border-b-2 border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                        <th className="pb-3 font-semibold">Nama Outlet / Customer</th>
                        <th className="pb-3 font-semibold text-center">Freq</th>
                        <th className="pb-3 font-semibold text-right">Total Belanja</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(dashboard.customerLeaderboard).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 text-center text-gray-400 text-sm">
                            Belum ada order masuk.
                          </td>
                        </tr>
                      ) : (
                        Object.entries(dashboard.customerLeaderboard)
                          .sort((a, b) => b[1].totalBelanja - a[1].totalBelanja)
                          .map(([cust, data], idx) => (
                            <tr key={cust} className="border-b border-gray-50 last:border-0 hover:bg-[#FAF8F5] transition-colors">
                              <td className="py-4 text-sm font-semibold text-[#2C1810]">
                                <div className="flex items-center gap-3">
                                  <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                  </div>
                                  {cust}
                                </div>
                              </td>
                              <td className="py-4 text-sm text-center text-gray-500">
                                <span className="bg-gray-100 px-2 py-1 rounded-md text-xs font-bold">{data.freq}x</span>
                              </td>
                              <td className="py-4 text-sm font-bold text-[#D4A847] text-right">
                                {formatRp(data.totalBelanja)}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div key="history-view" className="space-y-4">
              <div className="space-y-4 mb-2">
                <h3 className="text-lg font-serif flex items-center gap-2">
                  <History className="w-5 h-5 text-[#D4A847]" />
                  Riwayat Pesanan
                </h3>

                {/* Date Period Filter */}
                <div className="flex items-center justify-between bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#2C1810]">
                    <Filter className="w-4 h-4 text-[#D4A847]" />
                    Periode
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="date"
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-[#D4A847] outline-none text-gray-700 bg-white"
                    />
                    <span className="text-gray-400 text-xs">—</span>
                    <input 
                      type="date"
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-[#D4A847] outline-none text-gray-700 bg-white"
                    />
                    <button 
                      onClick={() => { 
                        const today = new Date().toISOString().split('T')[0];
                        setFilterStartDate(today); 
                        setFilterEndDate(today); 
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 ml-1"
                      title="Reset Filter"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Search Filter */}
                <div className="flex items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm focus-within:border-[#D4A847]/50 focus-within:ring-2 focus-within:ring-[#D4A847]/20 transition-all">
                  <div className="pl-3 pr-2 text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchHistoryInput}
                    onChange={(e) => {
                      setSearchHistoryInput(e.target.value);
                      if (highlightedOutlet) setHighlightedOutlet('');
                    }}
                    placeholder="Cari nama outlet..."
                    className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder:text-gray-400 font-medium"
                  />
                  {searchHistoryInput && (
                    <button 
                      onClick={() => {
                        setHighlightedOutlet(searchHistoryInput);
                        setSearchHistoryInput('');
                      }}
                      className="px-3 py-1.5 text-gray-500 hover:text-[#D4A847] bg-gray-50 hover:bg-[#D4A847]/10 rounded-lg transition-colors text-xs font-semibold flex items-center gap-1.5 border border-gray-200 hover:border-[#D4A847]/30"
                    >
                      Tampilkan Semua
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                  <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">{orderHistory.length === 0 ? 'Belum ada pesanan yang dibuat.' : 'Tidak ada pesanan pada periode ini.'}</p>
                </div>
              ) : (
                [...filteredHistory]
                  .sort((a, b) => {
                    const dateA = a.productionDate || '';
                    const dateB = b.productionDate || '';
                    if (dateA !== dateB) return dateB.localeCompare(dateA);
                    return b.id - a.id;
                  })
                  .map(order => {
                    const isHighlighted = highlightedOutlet && order.customer.toLowerCase().includes(highlightedOutlet.toLowerCase());
                    return (
                  <div key={order.id} className={`p-5 rounded-2xl border transition-all duration-300 ${editingOrderId === order.id ? 'border-blue-300 bg-blue-50/30 shadow-md transform scale-[1.02]' : isHighlighted && !searchHistoryInput ? 'border-[#D4A847] bg-[#D4A847]/5 shadow-md shadow-[#D4A847]/20 ring-2 ring-[#D4A847]/40 scale-[1.01] z-10 relative' : 'border-gray-200 bg-white hover:border-[#D4A847]/50 hover:shadow-md'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Terkirim</span>
                          <span className="text-xs text-gray-400 whitespace-pre-line leading-relaxed">{isNaN(new Date(order.timestamp).getTime()) ? order.timestamp : new Date(order.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <h4 className="font-bold text-[#2C1810]">{order.customer}</h4>
                        {(order.productionDate || order.deliveryDate) && (
                          <div className="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                            {order.productionDate && (
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Prod: {order.productionDate}</span>
                            )}
                            {order.deliveryDate && (
                              <span className="flex items-center gap-1"><Truck className="w-3 h-3"/> Kirim: {order.deliveryDate}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => handleEditOrder(order)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${editingOrderId === order.id ? 'bg-blue-100 text-blue-700 cursor-default' : 'bg-gray-100 text-gray-600 hover:bg-[#D4A847] hover:text-white'}`}
                      >
                        {editingOrderId === order.id ? 'Sedang Diedit' : <><Edit className="w-3.5 h-3.5" /> Edit</>}
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 space-y-1 mb-3 border border-gray-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.qty}x {item.sku}</span>
                          <span className="text-gray-400">{formatRp(item.qty * item.price)}</span>
                        </div>
                      ))}
                      {order.shippingCost > 0 && (
                        <div className="flex justify-between border-t border-gray-200 mt-2 pt-2 text-xs">
                          <span>Ongkos Kirim</span>
                          <span>{formatRp(order.shippingCost)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center font-bold text-[#2C1810] pt-1">
                      <span className="text-sm">Total Tagihan</span>
                      <span className="text-[#D4A847] text-lg">{formatRp(order.grandTotal)}</span>
                    </div>
                  </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
