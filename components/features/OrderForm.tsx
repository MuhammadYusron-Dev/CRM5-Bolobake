import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Truck, Package, Trash2, Plus, Edit, X, FileText, TrendingUp, Sparkles, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { Order, OrderItem, Product, Customer } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

interface OrderFormProps {
  katalog: Product[];
  customers: Customer[];
  orderToEdit: Order | null;
  onSave: (order: Order) => Promise<void>;
  onCancelEdit: () => void;
  isSubmitting: boolean;
}

export function OrderForm({
  katalog,
  customers,
  orderToEdit,
  onSave,
  onCancelEdit,
  isSubmitting
}: OrderFormProps) {
  const [customer, setCustomer] = useState('');
  const [customerInput, setCustomerInput] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [selectedCustomerObj, setSelectedCustomerObj] = useState<Customer | null>(null);
  const [tierPrices, setTierPrices] = useState<Record<string, number>>({});
  
  const [productionDate, setProductionDate] = useState('');
  const [capacityWarning, setCapacityWarning] = useState('');
  
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ id: Date.now(), sku: '', price: 0, qty: 1 }]);
  const [isFreeShipping, setIsFreeShipping] = useState(true);
  const [shippingCost, setShippingCost] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('');
  const [deliveryRoute, setDeliveryRoute] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedOrder, setLastSavedOrder] = useState<Order | null>(null);

  const [aiText, setAiText] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const getSkuPrice = (skuCode: string, customerTier: string = "STANDARD") => {
    // Exception-based tier logic
    const baseProduct = katalog.find(p => p.nama.toLowerCase() === skuCode.toLowerCase());
    const basePrice = baseProduct ? baseProduct.harga : 0;
    
    // Future-proof: If customer tier is not STANDARD, check tierPrices dictionary
    if (customerTier !== "STANDARD" && tierPrices[skuCode]) {
      return tierPrices[skuCode];
    }
    
    return basePrice;
  };

  const fetchTierPrices = async (tier: string) => {
    try {
      const res = await fetch(`/api/pricing?tier_id=${tier}`);
      const data = await res.json();
      if (data.success) {
        const prices: Record<string, number> = {};
        data.data.forEach((p: any) => { prices[p.sku] = p.price; });
        setTierPrices(prices);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomerChange = (custName: string) => {
    setCustomer(custName);
    setCustomerInput(custName);
    const custObj = customers.find(c => c.name === custName);
    setSelectedCustomerObj(custObj || null);
    if (custObj && custObj.tier) {
      fetchTierPrices(custObj.tier);
    } else {
      setTierPrices({});
    }
  };

  const checkCapacity = async (date: string, pcs: number) => {
    if (!date) {
      setCapacityWarning('');
      return;
    }
    try {
      const res = await fetch(`/api/capacity?date=${date}`);
      const data = await res.json();
      if (data.success) {
        const { max_capacity_pcs, booked_pcs } = data.data;
        if (booked_pcs + pcs > max_capacity_pcs) {
          const available = max_capacity_pcs - booked_pcs;
          setCapacityWarning(`Peringatan: Kapasitas produksi tanggal ${date} tersisa ${available < 0 ? 0 : available} pcs. Total pesanan ini adalah ${pcs} pcs! Harap konfirmasi ke Dapur.`);
        } else {
          setCapacityWarning('');
        }
      }
    } catch(e) {
      setCapacityWarning('');
    }
  };

  const handleParseAi = async () => {
    if (!aiText.trim()) return;
    setIsParsingAi(true);
    try {
      const res = await fetch('/api/parse-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_text: aiText })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const parsed = data.data;
        if (parsed.customer_name) handleCustomerChange(parsed.customer_name);
        if (parsed.delivery_date) {
           setDeliveryDate(parsed.delivery_date);
           setProductionDate(parsed.delivery_date); // Default logic
        }
        if (parsed.items && Array.isArray(parsed.items)) {
          const newItems = parsed.items.map((i: any, idx: number) => {
            const matchedProduct = katalog.find(p => p.nama.toLowerCase().includes(i.detected_sku.toLowerCase()));
            const finalSku = matchedProduct ? matchedProduct.nama : i.detected_sku;
            const price = getSkuPrice(finalSku, selectedCustomerObj?.tier || "STANDARD");
            
            return { id: Date.now() + idx, sku: finalSku, price, qty: Number(i.qty) || 1 };
          });
          if (newItems.length > 0) setItems(newItems);
        }
        setAiText('');
      } else {
        alert("Gagal mem-parsing teks. Coba gunakan deskripsi yang lebih jelas.");
      }
    } catch(e) {
      alert("Error menghubungi AI Parser.");
    } finally {
      setIsParsingAi(false);
    }
  };

  useEffect(() => {
    if (orderToEdit) {
      handleCustomerChange(orderToEdit.customer);
      setProductionDate(orderToEdit.productionDate || '');
      setDeliveryDate(orderToEdit.deliveryDate || '');
      setItems(orderToEdit.items);
      setIsFreeShipping(orderToEdit.isFreeShipping);
      setShippingCost(orderToEdit.shippingCost === 0 ? '' : String(orderToEdit.shippingCost));
      
      let orderNotes = orderToEdit.notes;
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
    } else {
      setCustomer('');
      setSelectedCustomerObj(null);
      setTierPrices({});
      setProductionDate('');
      setDeliveryDate('');
      setItems([{ id: Date.now(), sku: '', price: 0, qty: 1 }]);
      setNotes('');
      setDeliveryOption('');
      setDeliveryRoute('');
      setIsFreeShipping(true);
      setShippingCost('');
      setCapacityWarning('');
    }
  }, [orderToEdit]);

  const totalPcsOrder = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  useEffect(() => {
    if (productionDate && totalPcsOrder > 0) {
      checkCapacity(productionDate, totalPcsOrder);
    } else {
      setCapacityWarning('');
    }
  }, [productionDate, totalPcsOrder]);


  const handleAddItem = () => setItems([...items, { id: Date.now(), sku: '', price: 0, qty: 1 }]);

  const handleItemChange = (id: number, field: string, value: string) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'sku') {
          updated.price = getSkuPrice(value, selectedCustomerObj?.tier || "STANDARD");
        }
        return updated;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const handleRemoveItem = (id: number) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  const finalShipping = isFreeShipping ? 0 : Number(shippingCost) || 0;
  const grandTotal = subtotal + finalShipping;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || items.length === 0 || items.some(i => !i.sku.trim())) {
      alert('Mohon lengkapi nama customer dan detail produk.');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    const deliveryString = deliveryOption ? `[Delivery: ${deliveryOption}${deliveryRoute ? ` - ${deliveryRoute}` : ''}]` : '';
    const finalNotes = deliveryString ? `${deliveryString}\n${notes}` : notes;

    const newOrder: Order = {
      id: orderToEdit?.id || Date.now(),
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

    onSave(newOrder).then(() => {
      setShowConfirmModal(false);
      setLastSavedOrder(newOrder);
      if (!orderToEdit?.rowNumber) {
        setShowSuccessModal(true);
      } else {
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setCustomer('');
    setCustomerInput('');
    setSelectedCustomerObj(null);
    setTierPrices({});
    setProductionDate('');
    setDeliveryDate('');
    setItems([{ id: Date.now(), sku: '', price: 0, qty: 1 }]);
    setNotes('');
    setDeliveryOption('');
    setDeliveryRoute('');
    setIsFreeShipping(true);
    setShippingCost('');
    setCapacityWarning('');
  };

  const handleWAShare = () => {
    if (!lastSavedOrder || !selectedCustomerObj || !selectedCustomerObj.whatsapp) {
       alert("Data customer atau nomor WA tidak tersedia.");
       return;
    }
    
    let msg = `*BOLOBAKE ORDER CONFIRMATION* 🥖\n\n`;
    msg += `Pelanggan: ${lastSavedOrder.customer}\n`;
    msg += `Tgl Pengiriman: ${lastSavedOrder.deliveryDate}\n`;
    msg += `Ekspedisi: ${deliveryOption || '-'}\n\n`;
    msg += `*Detail Pesanan:*\n`;
    lastSavedOrder.items.forEach(i => {
       msg += `- ${i.qty}x ${i.sku} (@${formatRp(i.price)}) = ${formatRp(i.qty * i.price)}\n`;
    });
    msg += `\nSubtotal: ${formatRp(lastSavedOrder.subtotal)}\n`;
    msg += `Ongkir: ${formatRp(lastSavedOrder.shippingCost)}\n`;
    msg += `*Total Pembayaran: ${formatRp(lastSavedOrder.grandTotal)}*\n\n`;
    msg += `Catatan Dapur: ${notes || '-'}\n\n`;
    msg += `_Pesanan telah dicatat di sistem dan masuk antrean produksi. Terima kasih!_`;

    const encoded = encodeURIComponent(msg);
    const waUrl = `https://api.whatsapp.com/send?phone=${selectedCustomerObj.whatsapp}&text=${encoded}`;
    window.open(waUrl, '_blank');
    setShowSuccessModal(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        {orderToEdit && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-bold">Mode Edit/Reorder Pesanan Aktif</p>
                <p className="text-xs text-blue-600">Perhatikan Tanggal Produksi dan Pengiriman.</p>
              </div>
            </div>
            <button type="button" onClick={onCancelEdit} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <Card className="mb-6 border-primary/20 bg-primary/5 shadow-sm overflow-visible">
          <CardContent className="p-4 sm:p-6">
            <label className="flex items-center gap-2 text-sm font-bold mb-3 text-primary">
              <Sparkles className="w-4 h-4" />
              Smart Text Parser AI (Gemini)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <textarea 
                value={aiText}
                onChange={e => setAiText(e.target.value)}
                placeholder="Paste chat WA pembeli di sini. Contoh: 'Pesan moci tiramisu 10 sama croissant butter 5 dikirim besok ya kak'"
                className="flex-1 p-3 text-sm border border-primary/30 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none bg-background shadow-inner h-20"
              />
              <Button 
                type="button" 
                onClick={handleParseAi} 
                disabled={isParsingAi || !aiText.trim()}
                className="h-20 sm:w-32 font-bold shadow-md"
              >
                {isParsingAi ? <LoaderSpin /> : 'Proses Pesanan AI'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <form id="orderForm" onSubmit={handleSubmitRequest} className="space-y-6 pb-6">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4 relative">
                <label className="flex items-center gap-2 text-sm font-bold mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  Informasi Customer
                </label>
                <Input
                  autoComplete="off"
                  required
                  value={customerInput}
                  onChange={(e) => {
                    setCustomerInput(e.target.value);
                    if (e.target.value !== customer) {
                       setCustomer('');
                       setSelectedCustomerObj(null);
                       setTierPrices({});
                    }
                  }}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 200)}
                  placeholder="Ketik untuk mencari nama outlet..."
                  className="w-full p-3 h-auto"
                />
                {isCustomerDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-xl max-h-60 overflow-y-auto">
                    {(() => {
                      const suggestions = customers.filter(c => c.name.toLowerCase().includes(customerInput.toLowerCase()));
                      if (suggestions.length === 0) return <div className="px-3 py-3 text-sm text-center text-muted-foreground">Tidak ada outlet cocok.</div>;
                      return suggestions.map(c => (
                        <div
                          key={c.id}
                          className="px-3 py-2 hover:bg-primary/10 cursor-pointer flex justify-between items-center border-b border-border/30 last:border-0 transition-colors group"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleCustomerChange(c.name);
                            setIsCustomerDropdownOpen(false);
                          }}
                        >
                          <span className="font-medium text-sm group-hover:text-primary">{c.name}</span>
                          <span className="text-xs font-bold text-muted-foreground">{c.tier}</span>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    Tgl Produksi
                  </label>
                  <Input 
                    type="date"
                    required
                    value={productionDate}
                    onChange={(e) => setProductionDate(e.target.value)}
                  />
                  {capacityWarning && (
                    <div className="absolute z-10 left-0 right-0 mt-2 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs p-2 rounded-lg flex items-start gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
                       <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-600 mt-0.5" />
                       <span className="font-medium">{capacityWarning}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    <Truck className="w-3.5 h-3.5" />
                    Tgl Pengiriman
                  </label>
                  <Input 
                    type="date"
                    required
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <Package className="w-4 h-4 text-primary" />
                  Detail Pesanan
                </label>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">{katalog.length} SKU Aktif</span>
              </div>
              
              <div className="space-y-3">
                {items.map((item) => {
                  const isTierPrice = !!tierPrices[item.sku];
                  return (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end group relative bg-muted/30 p-3 sm:p-2 rounded-lg border border-transparent hover:border-border transition-all">
                    <div className="w-full sm:flex-1 relative">
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Produk (SKU)</label>
                      <Input
                        autoComplete="off"
                        required
                        value={item.sku}
                        onChange={(e) => {
                          handleItemChange(item.id, 'sku', e.target.value);
                          setActiveDropdownId(item.id);
                        }}
                        onFocus={() => setActiveDropdownId(item.id)}
                        onBlur={() => setTimeout(() => setActiveDropdownId(null), 200)}
                        placeholder="Ketik kata kunci..."
                      />
                      {activeDropdownId === item.id && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-xl max-h-60 overflow-y-auto">
                          {(() => {
                            const suggestions = katalog.filter(p => p.aktif && p.nama.toLowerCase().includes(item.sku.toLowerCase()));
                            if (suggestions.length === 0) return <div className="px-3 py-3 text-sm text-center text-muted-foreground">Tidak ada produk cocok.</div>;
                            
                            const grouped = suggestions.reduce((acc, p) => {
                              const cat = p.kategori || 'Lainnya';
                              if (!acc[cat]) acc[cat] = [];
                              acc[cat].push(p);
                              return acc;
                            }, {} as Record<string, Product[]>);

                            return Object.entries(grouped).map(([category, prods]) => (
                              <div key={category}>
                                <div className="px-3 py-1 bg-muted/50 text-[10px] font-bold text-muted-foreground uppercase tracking-wider sticky top-0 backdrop-blur-sm z-10 border-y border-border/50">{category}</div>
                                {prods.map(p => (
                                  <div
                                    key={p.id}
                                    className="px-3 py-2 hover:bg-primary/10 cursor-pointer flex justify-between items-center border-b border-border/30 last:border-0 transition-colors group"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleItemChange(item.id, 'sku', p.nama);
                                      setActiveDropdownId(null);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium text-sm group-hover:text-primary">{p.nama}</span>
                                    </div>
                                    <span className="text-xs font-bold text-primary">{formatRp(tierPrices[p.nama] || p.harga)}/{p.satuan || 'pcs'}</span>
                                  </div>
                                ))}
                              </div>
                            ));
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto items-end">
                      <div className="flex-1 sm:w-20">
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Qty</label>
                        <Input
                          type="number" min="1" required
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                          className="text-center"
                        />
                      </div>
                      <div className="flex-[2] relative group/price">
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                          Harga Satuan
                          {isTierPrice && <span className="bg-primary text-primary-foreground text-[8px] px-1 rounded">TIER</span>}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                          <Input
                            type="number" min="0" required
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="button" variant="ghost" size="icon"
                        onClick={() => handleRemoveItem(item.id)} 
                        disabled={items.length === 1}
                        className={`mb-0.5 hover:bg-destructive/10 hover:text-destructive ${items.length === 1 ? 'opacity-50' : 'text-destructive/70'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )})}
              </div>
              
              <Button 
                type="button" variant="ghost"
                onClick={handleAddItem}
                className="mt-4 text-primary hover:text-primary hover:bg-primary/10 px-3 py-2 text-sm"
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah Baris Produk
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <label className="flex items-center gap-2 text-sm font-bold mb-4">
                  <Truck className="w-4 h-4 text-primary" />
                  Opsi Delivery
                </label>
                <select
                  value={deliveryOption}
                  onChange={(e) => {
                    setDeliveryOption(e.target.value);
                    if (e.target.value !== 'DELIVERY BUDIMAS') setDeliveryRoute('');
                  }}
                  className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-background cursor-pointer mb-3 text-sm"
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
                    className="w-full p-3 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none appearance-none bg-muted cursor-pointer text-sm"
                  >
                    <option value="">Pilih Rute Budimas...</option>
                    <option value="Wonogiri">Wonogiri</option>
                    <option value="Boyolali">Boyolali</option>
                    <option value="Tawangmangu">Tawangmangu</option>
                  </select>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <label className="flex items-center gap-2 text-sm font-bold mb-4">
                  <Package className="w-4 h-4 text-primary" />
                  Logistik & Ongkir
                </label>
                <div className="space-y-3">
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${isFreeShipping ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                      <input type="radio" checked={isFreeShipping} onChange={() => setIsFreeShipping(true)} className="w-4 h-4 accent-primary"/>
                      <span className="text-sm font-medium">Gratis Ongkir (Solo)</span>
                    </label>
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${!isFreeShipping ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}>
                      <input type="radio" checked={!isFreeShipping} onChange={() => setIsFreeShipping(false)} className="w-4 h-4 accent-primary"/>
                      <span className="text-sm font-medium">Luar Kota / Berbayar</span>
                    </label>
                </div>
                {!isFreeShipping && (
                    <div className="mt-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                        <Input 
                          type="number" min="0" placeholder="Nominal ongkir"
                          value={shippingCost} 
                          onChange={(e) => setShippingCost(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-6">
              <label className="flex items-center gap-2 text-sm font-bold mb-4">
                <FileText className="w-4 h-4 text-primary" />
                Instruksi Dapur
              </label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 text-sm border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none bg-background"
                rows={4}
                placeholder="Misal: Kirim jam 06.00 pagi, packing box terpisah, dll..."
              />
            </CardContent>
          </Card>
          <div className="h-10"></div>
        </form>
      </div>

      <div className="bg-foreground text-background p-4 sm:p-6 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20 sticky bottom-0 lg:static">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-0">
            <div className="space-y-1 w-full sm:w-auto border-b sm:border-0 border-muted-foreground/30 pb-4 sm:pb-0">
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="w-24">Subtotal:</span>
                <span>{formatRp(subtotal)}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-300">
                <span className="w-24">Ongkir:</span>
                <span>{formatRp(finalShipping)}</span>
              </div>
              <div className="flex items-center gap-4 text-2xl font-serif text-primary pt-2">
                <span className="w-24 font-sans text-lg font-normal text-white">Total:</span>
                <span>{formatRp(grandTotal)}</span>
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              {orderToEdit && (
                <Button 
                  type="button" variant="secondary" onClick={onCancelEdit} disabled={isSubmitting}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold h-12 flex-1 sm:flex-none"
                >
                  Batal
                </Button>
              )}
              <Button 
                form="orderForm" type="submit" disabled={isSubmitting}
                className={`font-bold h-12 flex-1 sm:flex-none ${orderToEdit ? 'bg-blue-600 hover:bg-blue-500 text-white' : ''}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2"><LoaderSpin /> Mengirim...</span>
                ) : (
                  <>
                    {orderToEdit?.rowNumber ? 'Update' : <span className="hidden sm:inline">Kirim ke Dapur & Sheet</span>} 
                    {!orderToEdit?.rowNumber && <span className="sm:hidden">Kirim</span>}
                    {orderToEdit?.rowNumber ? <Edit className="w-4 h-4 sm:w-5 sm:h-5 ml-1" /> : <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />}
                  </>
                )}
              </Button>
            </div>
          </div>
      </div>

      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Konfirmasi Pesanan</DialogTitle>
            <DialogDescription>Pastikan detail pesanan sudah sesuai sebelum mengirim ke dapur.</DialogDescription>
          </DialogHeader>
          
          <div className="my-4 space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Customer / Outlet</p>
              <p className="font-semibold text-lg">{customer}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-2">Rincian Produk</p>
              <div className="max-h-48 overflow-y-auto space-y-2 border border-border rounded-lg p-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm p-2 hover:bg-muted/50 rounded-md">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.sku}</span>
                      <span className="text-xs text-muted-foreground">{formatRp(Number(item.price))}</span>
                    </div>
                    <span className="font-bold bg-secondary px-2 py-1 rounded text-xs">{item.qty} pcs</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex justify-between font-bold text-xl text-primary mt-2">
                <span>Grand Total</span>
                <span>{formatRp(grandTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={isSubmitting}>Batal</Button>
            <Button onClick={confirmSubmit} disabled={isSubmitting} className="font-bold">
              {isSubmitting ? (
                <span className="flex items-center gap-2"><LoaderSpin /> Mengirim...</span>
              ) : (
                "Kirim Sekarang"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessModal} onOpenChange={(open) => {
        setShowSuccessModal(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-[400px] text-center border-green-500/20">
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl mb-2 text-foreground">Pesanan Berhasil Dicatat!</DialogTitle>
            <DialogDescription className="mb-6">
              Sistem akan memprosesnya dalam 10 detik. Anda dapat membagikan resi ini ke pelanggan sekarang.
            </DialogDescription>
            <div className="flex flex-col w-full gap-3">
              <Button onClick={handleWAShare} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold h-12 flex items-center gap-2">
                <Send className="w-5 h-5" /> Kirim Konfirmasi WA
              </Button>
              <Button variant="outline" onClick={() => {
                setShowSuccessModal(false);
                resetForm();
              }} className="w-full">
                Tutup
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isSubmitting && (
        <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-card p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border border-border min-w-[300px] text-center">
            <svg className="animate-spin text-primary h-12 w-12" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="font-bold text-xl animate-pulse text-primary">Mengirim Data...</p>
            <p className="text-sm text-muted-foreground">Mohon tunggu, jangan tutup halaman ini.</p>
          </div>
        </div>
      )}
    </div>
  );
}

const LoaderSpin = () => (
  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);
