import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Truck, Package, Trash2, Plus, Edit, X, FileText, TrendingUp } from 'lucide-react';
import { Order, OrderItem, Product } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface OrderFormProps {
  katalog: Product[];
  orderToEdit: Order | null;
  onSave: (order: Order) => Promise<void>;
  onCancelEdit: () => void;
  isSubmitting: boolean;
}

export function OrderForm({
  katalog,
  orderToEdit,
  onSave,
  onCancelEdit,
  isSubmitting
}: OrderFormProps) {
  const [customer, setCustomer] = useState('');
  const [productionDate, setProductionDate] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [items, setItems] = useState<OrderItem[]>([{ id: Date.now(), sku: '', price: 0, qty: 1 }]);
  const [isFreeShipping, setIsFreeShipping] = useState(true);
  const [shippingCost, setShippingCost] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryOption, setDeliveryOption] = useState('');
  const [deliveryRoute, setDeliveryRoute] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  
  useEffect(() => {
    const draft = localStorage.getItem('bolobakeOrderDraft');
    if (draft && !orderToEdit) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.customer) setCustomer(parsed.customer);
        if (parsed.productionDate) setProductionDate(parsed.productionDate);
        if (parsed.deliveryDate) setDeliveryDate(parsed.deliveryDate);
        if (parsed.items && parsed.items.length > 0) setItems(parsed.items);
        if (parsed.notes) setNotes(parsed.notes);
        if (parsed.deliveryOption) setDeliveryOption(parsed.deliveryOption);
        if (parsed.deliveryRoute) setDeliveryRoute(parsed.deliveryRoute);
        if (parsed.isFreeShipping !== undefined) setIsFreeShipping(parsed.isFreeShipping);
        if (parsed.shippingCost) setShippingCost(parsed.shippingCost);
      } catch (e) {}
    }
    setIsDraftLoaded(true);
  }, []); // Run once on mount

  useEffect(() => {
    if (isDraftLoaded && !orderToEdit) {
      localStorage.setItem('bolobakeOrderDraft', JSON.stringify({
        customer, productionDate, deliveryDate, items, notes, deliveryOption, deliveryRoute, isFreeShipping, shippingCost
      }));
    }
  }, [customer, productionDate, deliveryDate, items, notes, deliveryOption, deliveryRoute, isFreeShipping, shippingCost, isDraftLoaded, orderToEdit]);

  useEffect(() => {
    if (orderToEdit) {
      setCustomer(orderToEdit.customer);
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
      if (isDraftLoaded && !localStorage.getItem('bolobakeOrderDraft')) {
        setCustomer('');
        setProductionDate('');
        setDeliveryDate('');
        setItems([{ id: Date.now(), sku: '', price: 0, qty: 1 }]);
        setNotes('');
        setDeliveryOption('');
        setDeliveryRoute('');
        setIsFreeShipping(true);
        setShippingCost('');
      }
    }
  }, [orderToEdit, isDraftLoaded]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now(), sku: '', price: 0, qty: 1 }]);
  };

  const handleItemChange = (id: number, field: string, value: string) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
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

  const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty)), 0);
  const finalShipping = isFreeShipping ? 0 : Number(shippingCost) || 0;
  const grandTotal = subtotal + finalShipping;
  const totalPcsOrder = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer.trim() || items.length === 0 || items.some(i => !i.sku.trim())) {
      alert('Mohon lengkapi nama customer dan detail produk.');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSubmit = () => {
    setShowConfirmModal(false);
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
        localStorage.removeItem('bolobakeOrderDraft');
        setCustomer('');
        setProductionDate('');
        setDeliveryDate('');
        setItems([{ id: Date.now(), sku: '', price: 0, qty: 1 }]);
        setNotes('');
        setDeliveryOption('');
        setDeliveryRoute('');
        setIsFreeShipping(true);
        setShippingCost('');
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
        {orderToEdit && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-bold">Mode Edit Pesanan Aktif</p>
                <p className="text-xs text-blue-600">Perubahan akan memperbarui data di Google Sheets otomatis.</p>
              </div>
            </div>
            <button type="button" onClick={onCancelEdit} className="p-2 hover:bg-blue-100 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <form id="orderForm" onSubmit={handleSubmitRequest} className="space-y-6 pb-6">
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm font-bold mb-3">
                  <Users className="w-4 h-4 text-primary" />
                  Informasi Customer
                </label>
                <Input 
                  id="customerInput"
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
                  placeholder="Cari atau masukkan nama outlet..."
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    Tgl Produksi
                  </label>
                  <Input 
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
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    <Truck className="w-3.5 h-3.5" />
                    Tgl Pengiriman
                  </label>
                  <Input 
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
                  Detail Pesanan (Katalog Pintar)
                </label>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">{katalog.length > 0 ? katalog.length : 0} SKU</span>
              </div>
              
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end group relative bg-muted/30 p-3 sm:p-2 rounded-lg border border-transparent hover:border-border transition-all">
                    <div className="w-full sm:flex-1 relative">
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Produk (SKU)</label>
                      <Input
                        id={`skuInput-${item.id}`}
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
                            const suggestions = katalog.filter(p => p.aktif && p.nama.toLowerCase().includes(item.sku.toLowerCase()));
                            if (activeDropdownId === item.id && suggestions.length > 0) {
                              handleItemChange(item.id, 'sku', suggestions[0].nama);
                            }
                            const next = document.getElementById(`qtyInput-${item.id}`);
                            if (next) next.focus();
                            setActiveDropdownId(null);
                          }
                        }}
                        placeholder="Ketik kata kunci..."
                      />
                      {activeDropdownId === item.id && (
                        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-xl max-h-60 overflow-y-auto">
                          {(() => {
                            const suggestions = katalog.filter(p => p.aktif && p.nama.toLowerCase().includes(item.sku.toLowerCase()));
                            if (suggestions.length === 0) {
                              return <div className="px-3 py-3 text-sm text-center text-muted-foreground">Tidak ada produk cocok.</div>;
                            }
                            
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
                                      const next = document.getElementById(`qtyInput-${item.id}`);
                                      if (next) next.focus();
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium text-sm group-hover:text-primary">{p.nama}</span>
                                    </div>
                                    <span className="text-xs font-bold text-primary">{formatRp(p.harga)}/{p.satuan || 'pcs'}</span>
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
                          id={`qtyInput-${item.id}`}
                          type="number"
                          min="1"
                          required
                          value={item.qty}
                          onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const next = document.getElementById(`priceInput-${item.id}`);
                              if (next) next.focus();
                            }
                          }}
                          className="text-center"
                        />
                      </div>
                      <div className="flex-[2]">
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Harga Satuan</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">Rp</span>
                          <Input
                            id={`priceInput-${item.id}`}
                            type="number"
                            min="0"
                            required
                            value={item.price}
                            onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const isLast = items.indexOf(item) === items.length - 1;
                                if (isLast) {
                                   const newItemId = Date.now();
                                   setItems(prev => [...prev, { id: newItemId, sku: '', price: 0, qty: 1 }]);
                                   setTimeout(() => {
                                     document.getElementById(`skuInput-${newItemId}`)?.focus();
                                   }, 50);
                                } else {
                                   const nextItem = items[items.indexOf(item) + 1];
                                   document.getElementById(`skuInput-${nextItem.id}`)?.focus();
                                }
                              }
                            }}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      
                      <Button 
                        type="button" 
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)} 
                        disabled={items.length === 1}
                        className={`mb-0.5 hover:bg-destructive/10 hover:text-destructive ${items.length === 1 ? 'opacity-50' : 'text-destructive/70'}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                type="button" 
                variant="ghost"
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
                          type="number" 
                          min="0"
                          placeholder="Nominal ongkir"
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
                  type="button" 
                  variant="secondary"
                  onClick={onCancelEdit}
                  disabled={isSubmitting}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold h-12 flex-1 sm:flex-none"
                >
                  Batal
                </Button>
              )}
              <Button 
                form="orderForm"
                type="submit" 
                disabled={isSubmitting}
                className={`font-bold h-12 flex-1 sm:flex-none ${orderToEdit ? 'bg-blue-600 hover:bg-blue-500 text-white' : ''}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Menyimpan...
                  </span>
                ) : (
                  <>
                    {orderToEdit ? 'Update' : <span className="hidden sm:inline">Kirim ke Dapur & Sheet</span>} 
                    {!orderToEdit && <span className="sm:hidden">Kirim</span>}
                    {orderToEdit ? <Edit className="w-4 h-4 sm:w-5 sm:h-5 ml-1" /> : <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />}
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
            <DialogDescription>
              Pastikan detail pesanan sudah sesuai sebelum mengirim ke dapur.
            </DialogDescription>
          </DialogHeader>
          
          <div className="my-4 space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Customer / Outlet</p>
              <p className="font-semibold text-lg">{customer}</p>
              {deliveryOption && (
                <p className="text-sm mt-1 flex items-center gap-2 text-muted-foreground">
                  <Truck className="w-4 h-4" /> {deliveryOption} {deliveryRoute ? `- ${deliveryRoute}` : ''}
                </p>
              )}
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
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Subtotal Produk ({totalPcsOrder} pcs)</span>
                <span>{formatRp(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Ongkos Kirim</span>
                <span>{formatRp(finalShipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-xl text-primary mt-2">
                <span>Grand Total</span>
                <span>{formatRp(grandTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Batal</Button>
            <Button onClick={confirmSubmit} className="font-bold">
              Kirim Pesanan Sekarang
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
