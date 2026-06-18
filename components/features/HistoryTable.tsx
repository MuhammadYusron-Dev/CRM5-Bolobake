import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History, Filter, Search, X, Clock, Calendar, Truck, Edit, Trash2, Printer, AlertTriangle } from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DateRangeFilter } from './DateRangeFilter';
import { formatDate } from '@/lib/utils';
import { StatusBadge, OrderTimeline, ActionControl } from './OrderLifecycleUI';


interface HistoryTableProps {
  orderHistory: Order[];
  editingOrderId: number | null;
  handleEditOrder: (order: Order) => void;
  filterStartDate: string;
  setFilterStartDate: (date: string) => void;
  filterEndDate: string;
  setFilterEndDate: (date: string) => void;
  handleReorder?: (order: Order) => void;
  handleClearAll?: () => void;
  handleUpdateStatus?: (orderId: number, status: OrderStatus) => void;
  currentUser?: { userId: string; name: string; role: string } | null;
  onRefresh?: () => void;
}

export function HistoryTable({
  orderHistory,
  editingOrderId,
  handleEditOrder,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  handleReorder,
  handleClearAll,
  handleUpdateStatus,
  currentUser,
  onRefresh
}: HistoryTableProps) {
  const [searchHistoryInput, setSearchHistoryInput] = useState('');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [highlightedOutlet, setHighlightedOutlet] = useState('');
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handlePrintReceipt = (order: Order) => {
    setPrintingOrder(order);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  useEffect(() => {
    const timer = setTimeout(() => setSearchHistoryQuery(searchHistoryInput), 300);
    return () => clearTimeout(timer);
  }, [searchHistoryInput]);

  const filteredHistory = useMemo(() => {
    const parseDateToNumber = (dateStr: any) => {
      if (!dateStr) return 0;
      const str = String(dateStr);
      // Try YYYY-MM-DD
      const match1 = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (match1) {
        return parseInt(`${match1[1]}${match1[2].padStart(2, '0')}${match1[3].padStart(2, '0')}`);
      }
      // Try DD-MM-YYYY
      const match2 = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match2) {
        return parseInt(`${match2[3]}${match2[2].padStart(2, '0')}${match2[1].padStart(2, '0')}`);
      }
      // Fallback
      try {
        const d = new Date(str);
        if (!isNaN(d.getTime())) {
          return parseInt(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);
        }
      } catch (e) {}
      return 0;
    };

    const startNum = parseDateToNumber(filterStartDate);
    const endNum = parseDateToNumber(filterEndDate);

    return orderHistory.filter(order => {
      if (searchHistoryQuery) {
        const query = searchHistoryQuery.toLowerCase();
        const matchCustomer = (order.customer || '').toLowerCase().includes(query);
        const matchNotes = order.notes?.toLowerCase().includes(query);
        const matchItems = (order.items || []).some(item => (item.sku || '').toLowerCase().includes(query));
        
        if (!matchCustomer && !matchNotes && !matchItems) {
          return false;
        }
      }
      
      let orderDate = order.productionDate;
      if (!orderDate) {
        try { 
          const tsStr = String(order.timestamp || '');
          const ts = new Date(tsStr);
          if (!isNaN(ts.getTime())) {
            orderDate = ts.toISOString().split('T')[0];
          }
        } catch (e) {}
      }
      
      if (!orderDate) return true; // Show items with no valid date
      
      const orderNum = parseDateToNumber(orderDate);
      if (orderNum === 0) return true; // Show if we completely fail to parse
      
      if (startNum > 0 && orderNum < startNum) return false;
      if (endNum > 0 && orderNum > endNum) return false;
      
      return true;
    });
  }, [orderHistory, filterStartDate, filterEndDate, searchHistoryQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Dikonfirmasi': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Produksi': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Packing': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Delivery': return 'bg-teal-100 text-teal-700 border-teal-200';
      case 'Diterima': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="space-y-4 mb-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-serif flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Riwayat Pesanan
          </h3>
          {handleClearAll && orderHistory.length > 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAll}
              className="text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Kosongkan Riwayat
            </Button>
          )}
        </div>

        {/* Date Period Filter */}
        <div className="relative z-50 flex items-center justify-between bg-muted/50 p-3 rounded-xl border border-border">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Filter className="w-4 h-4 text-primary" />
            Periode
          </div>
          <DateRangeFilter 
            filterStartDate={filterStartDate}
            setFilterStartDate={setFilterStartDate}
            filterEndDate={filterEndDate}
            setFilterEndDate={setFilterEndDate}
          />
        </div>

        {/* Search Filter */}
        <div className="flex items-center bg-background p-2 rounded-xl border border-border shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <div className="pl-3 pr-2 text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchHistoryInput}
            onChange={(e) => {
              setSearchHistoryInput(e.target.value);
              if (highlightedOutlet) setHighlightedOutlet('');
            }}
            placeholder="Cari nama outlet, produk, atau catatan..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground font-medium"
          />
          {searchHistoryInput && (
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => {
                setHighlightedOutlet(searchHistoryInput);
                setSearchHistoryInput('');
              }}
              className="h-7 text-xs font-semibold flex items-center gap-1.5"
            >
              Tampilkan Semua
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
          <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm">{orderHistory.length === 0 ? 'Belum ada pesanan yang dibuat.' : 'Tidak ada pesanan pada periode ini.'}</p>
        </div>
      ) : (() => {
        const d = new Date();
        const todayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        
        const sortedHistory = [...filteredHistory].sort((a, b) => {
          const dateA = a.productionDate || '';
          const dateB = b.productionDate || '';
          if (dateA !== dateB) return dateA.localeCompare(dateB);
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

        const priorityOrders = sortedHistory.filter(o => 
          o.currentState === 'REWORK_REQUIRED' || 
          (o.currentStage === 'ADMIN' && o.currentState === 'REVIEW_REQUIRED')
        );

        const nonPriorityHistory = sortedHistory.filter(o => 
          o.currentState !== 'REWORK_REQUIRED' && 
          !(o.currentStage === 'ADMIN' && o.currentState === 'REVIEW_REQUIRED')
        );

        const leftOrders = nonPriorityHistory.filter(o => !o.productionDate || o.productionDate <= todayStr);
        const rightOrders = nonPriorityHistory.filter(o => o.productionDate && o.productionDate > todayStr);

        const renderOrderCard = (order: Order) => {
            const isHighlighted = highlightedOutlet && order.customer.toLowerCase().includes(highlightedOutlet.toLowerCase());
            return (
              <Card key={order.id} className={`transition-all duration-300 ${editingOrderId === order.id ? 'border-blue-300 bg-blue-50/30 shadow-md transform scale-[1.02]' : isHighlighted && !searchHistoryInput ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/40 scale-[1.01] z-10 relative' : 'hover:border-primary/50 hover:shadow-md'}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <StatusBadge stage={order.currentStage} state={order.currentState} health={order.healthStatus} />
                        {!isNaN(new Date(order.timestamp).getTime()) && (
                          <span className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{new Date(order.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                      <h4 className="font-bold">{order.customer}</h4>
                      {(order.productionDate || order.deliveryDate) && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {order.productionDate && (
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> Prod: {
                              (() => {
                                return formatDate(order.productionDate);
                              })()
                            }</span>
                          )}
                          {order.deliveryDate && (
                            <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5"/> Kirim: {
                              (() => {
                                return formatDate(order.deliveryDate);
                              })()
                            }</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {handleReorder && (
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(order)}
                          className="h-8 text-xs font-bold gap-1.5"
                        >
                          <History className="w-3.5 h-3.5" /> Ulangi
                        </Button>
                      )}
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintReceipt(order)}
                        className="h-8 text-xs font-bold gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Cetak Struk</span>
                      </Button>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => setTimelineOrder(order)}
                        className="h-8 text-xs font-bold gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Timeline</span>
                      </Button>
                      <Button 
                        variant={editingOrderId === order.id ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                        className="h-8 text-xs font-bold gap-1.5"
                      >
                        {editingOrderId === order.id ? 'Sedang Diedit' : <><Edit className="w-3.5 h-3.5" /> Edit</>}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-3 rounded-lg text-sm space-y-1 mb-3 border border-border">
                    {(order.items || []).map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.qty}x {item.sku.endsWith(' (sample)') ? (
                            <>{item.sku.replace(' (sample)', '')} <span className="italic text-xs text-primary ml-1">(sample)</span></>
                          ) : item.sku}
                          {item.isSplitInvoice && <span className="text-[10px] text-orange-600 border border-orange-500 bg-orange-50 px-1 rounded ml-1.5 font-bold">[Pisah Nota]</span>}
                        </span>
                        <span className="text-muted-foreground">{formatRp(item.qty * (item.sku.endsWith(' (sample)') ? 0 : item.price))}</span>
                      </div>
                    ))}
                    {order.shippingCost > 0 && (
                      <div className="flex justify-between border-t border-border mt-2 pt-2 text-xs">
                        <span>Ongkos Kirim</span>
                        <span>{formatRp(order.shippingCost)}</span>
                      </div>
                    )}
                  </div>
                  {order.notes && (
                    <div className="text-[11px] bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-2 rounded mb-3 border border-red-200 dark:border-red-800/50">
                      <span className="font-bold block mb-0.5">Catatan Produksi:</span>
                      {order.notes}
                    </div>
                  )}
                  {order.deliveryNotes && (
                    <div className="text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-2 rounded mb-3 border border-blue-200 dark:border-blue-800/50">
                      <span className="font-bold block mb-0.5">Catatan Pengiriman:</span>
                      {order.deliveryNotes}
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center font-bold pt-1">
                    <span className="text-sm">Total Tagihan</span>
                    <span className="text-primary text-lg">{formatRp(order.grandTotal)}</span>
                  </div>

                  <ActionControl 
                    order={order} 
                    currentUser={currentUser} 
                    onActionComplete={() => {
                      if (onRefresh) {
                        onRefresh();
                      } else if (handleUpdateStatus) {
                        // Fallback
                        window.location.reload();
                      }
                    }} 
                  />
                </CardContent>
              </Card>
            );
          };

          return (
            <div className="space-y-6">
              {priorityOrders.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-red-800 bg-red-100 p-3 rounded-lg border border-red-200 flex items-center justify-between shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-red-500 animate-pulse"></div>
                    <span className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> ⚠️ PRIORITAS: Menunggu Rebake / Konfirmasi</span>
                    <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded border border-red-700 font-bold shadow-sm">{priorityOrders.length} Pesanan</span>
                  </h4>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    {priorityOrders.map(renderOrderCard)}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-700 bg-slate-100 p-3 rounded-lg border flex items-center justify-between shadow-sm">
                  <span>Hari Ini & Sebelumnya</span>
                  <span className="bg-white text-slate-700 text-[10px] px-2 py-0.5 rounded border font-bold shadow-sm">{leftOrders.length} Pesanan</span>
                </h4>
                <div className="space-y-4">
                  {leftOrders.map(renderOrderCard)}
                  {leftOrders.length === 0 && (
                    <p className="text-sm text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
                      Tidak ada pesanan
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-slate-700 bg-slate-100 p-3 rounded-lg border flex items-center justify-between shadow-sm">
                  <span>Besok & Selanjutnya</span>
                  <span className="bg-white text-slate-700 text-[10px] px-2 py-0.5 rounded border font-bold shadow-sm">{rightOrders.length} Pesanan</span>
                </h4>
                <div className="space-y-4">
                  {rightOrders.map(renderOrderCard)}
                  {rightOrders.length === 0 && (
                    <p className="text-sm text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
                      Tidak ada pesanan
                    </p>
                  )}
                </div>
              </div>
              </div>
            </div>
          );
      })()}

      {printingOrder && (
        <Dialog open={!!printingOrder} onOpenChange={(open) => !open && setPrintingOrder(null)}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto print:max-w-[80mm] print:w-full print:p-0 print:m-0 print:h-auto print:overflow-visible print:border-none print:shadow-none bg-white print:static print:transform-none print:inset-auto">
            <style>
              {`
                @media print {
                  @page {
                    size: 80mm auto; /* Ukuran kertas printer thermal (80mm) */
                    margin: 0mm;
                  }
                  body {
                    margin: 0;
                    padding: 0;
                    background: white;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  /* Menyembunyikan elemen background dari radix dialog */
                  [data-radix-focus-guard],
                  body > *:not([data-radix-portal]) {
                    display: none !important;
                  }
                }
              `}
            </style>
            <DialogHeader className="print:hidden">
              <DialogTitle>Cetak Struk Pesanan</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-8 print:gap-4 print:p-2 print:mx-auto print:w-[80mm] print:text-xs">
              {/* Nota Utama */}
              <div className="border border-slate-200 rounded-xl p-6 print:border-none print:p-0 print:rounded-none">
                <div className="text-center mb-6 border-b border-dashed border-slate-300 pb-4 print:border-black print:mb-2 print:pb-2">
                  <h2 className="text-xl font-bold uppercase tracking-widest text-black mb-1 print:text-lg">BOLOBAKE</h2>
                  <p className="text-sm text-slate-600 print:text-black print:text-xs">Receipt / Struk Pesanan</p>
                </div>
                
                <div className="flex justify-between text-sm mb-4 text-black print:text-[10px] print:mb-2">
                  <div>
                    <p><span className="font-semibold w-16 inline-block">Pelanggan</span>: {printingOrder.customer}</p>
                    <p><span className="font-semibold w-16 inline-block">Tanggal</span>: {formatDate(printingOrder.deliveryDate || printingOrder.productionDate)}</p>
                  </div>
                  <div className="text-right">
                    <p><span className="font-semibold">Order ID</span>: #{printingOrder.id.toString().slice(-6)}</p>
                  </div>
                </div>

                <div className="mb-4 text-sm text-black print:text-[10px] print:mb-2">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-300 print:border-black">
                        <th className="text-left py-2 print:py-1">Item</th>
                        <th className="text-center py-2 print:py-1">Qty</th>
                        <th className="text-right py-2 print:py-1">Harga</th>
                        <th className="text-right py-2 print:py-1">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printingOrder.items.filter(i => !i.isSplitInvoice).map((item, idx) => (
                        <tr key={idx} className="border-b border-dashed border-slate-200 print:border-black/50">
                          <td className="py-2 pr-2 print:py-1">{item.sku}</td>
                          <td className="py-2 text-center print:py-1">{item.qty}</td>
                          <td className="py-2 text-right print:py-1">{formatRp(item.sku.endsWith(' (sample)') ? 0 : item.price)}</td>
                          <td className="py-2 text-right print:py-1">{formatRp(item.qty * (item.sku.endsWith(' (sample)') ? 0 : item.price))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col items-end text-sm text-black space-y-1 pt-2 print:text-[10px] print:pt-1">
                  <div className="flex justify-between w-48 print:w-40">
                    <span>Subtotal:</span>
                    <span>{formatRp(printingOrder.items.filter(i => !i.isSplitInvoice).reduce((acc, i) => acc + ((i.sku.endsWith(' (sample)') ? 0 : i.price) * i.qty), 0))}</span>
                  </div>
                  <div className="flex justify-between w-48 print:w-40 border-b border-slate-300 print:border-black pb-2 print:pb-1">
                    <span>Ongkir:</span>
                    <span>{formatRp(printingOrder.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between w-48 print:w-40 font-bold pt-1 text-lg print:text-sm">
                    <span>Total:</span>
                    <span>{formatRp(printingOrder.items.filter(i => !i.isSplitInvoice).reduce((acc, i) => acc + ((i.sku.endsWith(' (sample)') ? 0 : i.price) * i.qty), 0) + printingOrder.shippingCost)}</span>
                  </div>
                </div>
                
                {printingOrder.notes && (
                  <div className="mt-6 pt-4 border-t border-dashed border-slate-300 print:border-black text-xs text-black print:mt-2 print:pt-2 print:text-[10px]">
                    <span className="font-bold">Catatan:</span> {printingOrder.notes}
                  </div>
                )}
                <div className="mt-8 text-center text-xs text-slate-500 print:text-black print:mt-4 print:text-[10px]">
                  <p>Terima kasih atas pesanan Anda!</p>
                </div>
              </div>

              {/* Nota Pisah */}
              {printingOrder.items.some(i => i.isSplitInvoice) && (
                <div className="border border-slate-200 rounded-xl p-6 print:border-none print:p-0 print:rounded-none print:break-before-page mt-8 print:mt-4">
                  <div className="text-center mb-6 border-b border-dashed border-slate-300 pb-4 print:border-black print:mb-2 print:pb-2">
                    <h2 className="text-xl font-bold uppercase tracking-widest text-black mb-1 print:text-lg">BOLOBAKE</h2>
                    <p className="text-sm text-slate-600 print:text-black print:text-xs">Receipt / Struk Pesanan</p>
                    <span className="inline-block border border-black font-bold uppercase text-[10px] px-2 py-0.5 mt-1 tracking-widest">[NOTA PISAH]</span>
                  </div>
                  
                  <div className="flex justify-between text-sm mb-4 text-black print:text-[10px] print:mb-2">
                    <div>
                      <p><span className="font-semibold w-16 inline-block">Pelanggan</span>: {printingOrder.customer} (Pisah)</p>
                      <p><span className="font-semibold w-16 inline-block">Tanggal</span>: {formatDate(printingOrder.deliveryDate || printingOrder.productionDate)}</p>
                    </div>
                    <div className="text-right">
                      <p><span className="font-semibold">Order ID</span>: #{printingOrder.id.toString().slice(-6)}-P</p>
                    </div>
                  </div>

                  <div className="mb-4 text-sm text-black print:text-[10px] print:mb-2">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-300 print:border-black">
                          <th className="text-left py-2 print:py-1">Item</th>
                          <th className="text-center py-2 print:py-1">Qty</th>
                          <th className="text-right py-2 print:py-1">Harga</th>
                          <th className="text-right py-2 print:py-1">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {printingOrder.items.filter(i => i.isSplitInvoice).map((item, idx) => (
                          <tr key={idx} className="border-b border-dashed border-slate-200 print:border-black/50">
                            <td className="py-2 pr-2 print:py-1">{item.sku}</td>
                            <td className="py-2 text-center print:py-1">{item.qty}</td>
                            <td className="py-2 text-right print:py-1">{formatRp(item.sku.endsWith(' (sample)') ? 0 : item.price)}</td>
                            <td className="py-2 text-right print:py-1">{formatRp(item.qty * (item.sku.endsWith(' (sample)') ? 0 : item.price))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-col items-end text-sm text-black space-y-1 pt-2 print:text-[10px] print:pt-1">
                    <div className="flex justify-between w-48 print:w-40">
                      <span>Subtotal:</span>
                      <span>{formatRp(printingOrder.items.filter(i => i.isSplitInvoice).reduce((acc, i) => acc + ((i.sku.endsWith(' (sample)') ? 0 : i.price) * i.qty), 0))}</span>
                    </div>
                    <div className="flex justify-between w-48 print:w-40 border-b border-slate-300 print:border-black pb-2 print:pb-1">
                      <span>Ongkir:</span>
                      <span>Rp 0</span>
                    </div>
                    <div className="flex justify-between w-48 print:w-40 font-bold pt-1 text-lg print:text-sm">
                      <span>Total:</span>
                      <span>{formatRp(printingOrder.items.filter(i => i.isSplitInvoice).reduce((acc, i) => acc + ((i.sku.endsWith(' (sample)') ? 0 : i.price) * i.qty), 0))}</span>
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center text-xs text-slate-500 print:text-black print:mt-4 print:text-[10px]">
                    <p>Terima kasih atas pesanan Anda!</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-4 print:hidden">
              <Button variant="outline" onClick={() => setPrintingOrder(null)}>Tutup</Button>
              <Button onClick={() => handlePrintReceipt(printingOrder)}>
                <Printer className="w-4 h-4 mr-2" /> Cetak
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {timelineOrder && (
        <Dialog open={!!timelineOrder} onOpenChange={(open) => !open && setTimelineOrder(null)}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Timeline: {timelineOrder.customer}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <OrderTimeline events={timelineOrder.lifecycleData} />
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setTimelineOrder(null)}>Tutup</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
