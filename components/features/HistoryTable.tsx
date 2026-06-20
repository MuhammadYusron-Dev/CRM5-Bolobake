import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History, Filter, Search, X, Clock, Calendar, Truck, Edit, Trash2, Printer, AlertTriangle } from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HorizontalDateFilter } from './HorizontalDateFilter';
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

  const orderDates = useMemo(() => {
    const dates = new Set<string>();
    orderHistory.forEach(order => {
      let dStr = order.productionDate;
      if (!dStr && order.timestamp) {
         try {
           const ts = new Date(order.timestamp);
           if (!isNaN(ts.getTime())) dStr = ts.toISOString().split('T')[0];
         } catch (e) {}
      }
      
      if (dStr) {
        // Normalize to YYYY-MM-DD
        const match2 = String(dStr).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (match2) {
          dStr = `${match2[3]}-${match2[2].padStart(2, '0')}-${match2[1].padStart(2, '0')}`;
        } else {
          const match1 = String(dStr).match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
          if (match1) {
            dStr = `${match1[1]}-${match1[2].padStart(2, '0')}-${match1[3].padStart(2, '0')}`;
          }
        }
        dates.add(dStr);
      }
    });
    return dates;
  }, [orderHistory]);

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
      case 'Produksi': return 'bg-brand-green-light/60 text-brand-green-dark border-brand-green-light/50';
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
          <h3 className="font-serif flex items-center gap-2" style={{ fontSize: 'var(--text-lg)' }}>
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

        {/* Horizontal Date Filter */}
        <div className="relative z-50 mt-4 mb-6">
          <HorizontalDateFilter 
            startDate={filterStartDate}
            endDate={filterEndDate}
            onRangeChange={(start, end) => {
              setFilterStartDate(start);
              setFilterEndDate(end);
            }}
            orderDates={orderDates}
          />
        </div>

        {/* Search Filter */}
        <div className="flex items-center bg-background dark:bg-black/20 p-2 rounded-xl border border-border dark:border-white/10 shadow-sm focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
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
            className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground font-medium"
            style={{ fontSize: 'var(--text-sm)' }}
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
        const sortedHistory = [...filteredHistory].sort((a, b) => {
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

        const priorityOrders = sortedHistory.filter(o => 
          o.currentState === 'REWORK_REQUIRED' || 
          (o.currentStage === 'ADMIN' && o.currentState === 'REVIEW_REQUIRED')
        );

        const normalOrders = sortedHistory.filter(o => !priorityOrders.some(po => po.id === o.id));

        const groupedOrders = normalOrders.reduce((acc, order) => {
          const date = order.productionDate || 'Tanpa Tanggal';
          if (!acc[date]) acc[date] = [];
          acc[date].push(order);
          return acc;
        }, {} as Record<string, Order[]>);

        const sortedDates = Object.keys(groupedOrders).sort((a, b) => {
          if (a === 'Tanpa Tanggal') return -1;
          if (b === 'Tanpa Tanggal') return 1;
          return b.localeCompare(a); // Sort descending dates or ascending? History usually descending. Let's do descending.
        });

        function getBatchLabel(timestamp: string): { label: string, color: string } {
          if (!timestamp) return { label: 'Batch Unknown', color: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
          const time = new Date(timestamp);
          const hour = time.getHours();
          
          if (hour < 8) return { label: 'Batch Pagi (08:00)', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' };
          if (hour >= 8 && hour < 10) return { label: 'Tambahan (09:00)', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' };
          if (hour >= 10 && hour < 15) return { label: 'Update Siang (14:00)', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' };
          return { label: 'Final Malam (22:00)', color: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300' };
        }

        function isCakeOrOther(sku: string) {
          const s = sku.toLowerCase();
          return s.includes('cake') || s.includes('brownie') || s.includes('cookie') || s.includes('dessert') || s.includes('tiramisu') || s.includes('macaron');
        }

        const renderTableRow = (order: Order, idx: number) => {
          const batch = getBatchLabel(order.timestamp);
          const croissantItems = (order.items || []).filter(item => !isCakeOrOther(item.sku));
          const cakeItems = (order.items || []).filter(item => isCakeOrOther(item.sku));

          return (
            <tr key={order.id} className="hover:bg-slate-50/50 dark:hover:bg-primary/5 transition-all duration-300">
              <td className="px-4 py-4 align-top text-center text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800/60">{idx + 1}</td>
              <td className="px-4 py-4 align-top border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col gap-1.5 items-start">
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-normal">{order.customer}</span>
                    <StatusBadge stage={order.currentStage} state={order.currentState} health={order.health} iconOnly={true} />
                  </div>
                  
                  {order.deliveryDate && (
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 mt-1">
                      Tgl Kirim: {formatDate(order.deliveryDate)}
                    </span>
                  )}
                  
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${batch.color} mt-0.5`}>
                    {batch.label}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 align-top whitespace-normal text-xs text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col gap-2 min-w-[200px]">
                  {order.notes && (
                    <div className="text-red-700 dark:text-red-400 flex items-start gap-1">
                      <span className="font-bold text-[10px] uppercase shrink-0 mt-[1px]">Catatan Dapur:</span>
                      <span className="text-[10px] font-medium mt-[1px] leading-tight">{order.notes}</span>
                    </div>
                  )}
                  
                  {order.deliveryNotes && (
                    <div className="text-blue-700 dark:text-blue-400 flex items-start gap-1">
                      <span className="font-bold text-[10px] uppercase shrink-0 mt-[1px]">Pengiriman:</span>
                      <span className="text-[10px] font-medium mt-[1px] leading-tight">{order.deliveryNotes.replace(/\[Delivery:\s*([^\]]+)\]/i, '$1')}</span>
                    </div>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 align-top border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col gap-3 min-w-[250px]">
                  {croissantItems.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 border-b border-slate-200 dark:border-slate-700 pb-1">
                        Croissant / Artisan Bakery
                      </div>
                      <ul className="space-y-1">
                        {croissantItems.map((item, i) => (
                          <li key={i} className="flex justify-between items-start text-xs gap-4 text-slate-700 dark:text-slate-300">
                            <span className="whitespace-normal flex-1">
                              {item.sku.replace(' (sample)', '')}
                              {item.isSample && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 ml-1 rounded inline-block">Sample</span>}
                              {item.isSplitInvoice && <span className="text-[9px] border border-orange-500 text-orange-600 bg-orange-50 px-1 ml-1 rounded inline-block font-bold">Pisah Nota</span>}
                            </span>
                            <span className="font-bold whitespace-nowrap">{item.qty} pcs</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {cakeItems.length > 0 && (
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 border-b border-slate-200 dark:border-slate-700 pb-1 mt-1">
                        Cake / Other
                      </div>
                      <ul className="space-y-1">
                        {cakeItems.map((item, i) => (
                          <li key={i} className="flex justify-between items-start text-xs gap-4 text-slate-700 dark:text-slate-300">
                            <span className="whitespace-normal flex-1">
                              {item.sku.replace(' (sample)', '')}
                              {item.isSample && <span className="text-[9px] bg-orange-100 text-orange-700 px-1 ml-1 rounded inline-block">Sample</span>}
                              {item.isSplitInvoice && <span className="text-[9px] border border-orange-500 text-orange-600 bg-orange-50 px-1 ml-1 rounded inline-block font-bold">Pisah Nota</span>}
                            </span>
                            <span className="font-bold whitespace-nowrap">{item.qty} pcs</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 space-y-1 text-[10px] mt-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-600 dark:text-slate-400">Logistik:</span>
                      <span className="text-slate-700 dark:text-slate-300">{order.isFreeShipping ? 'Gratis Ongkir' : `Rp ${formatRp(order.shippingCost || 0).replace('Rp', '').trim()}`}</span>
                    </div>
                    <div className="flex justify-between font-bold text-primary border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">
                      <span>Grand Total:</span>
                      <span>{formatRp(order.grandTotal || 0)}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 align-top border-b border-slate-100 dark:border-slate-800/60">
                <div className="flex flex-col gap-2 min-w-[180px]">
                  <ActionControl 
                    order={order} 
                    currentUser={currentUser} 
                    onActionComplete={() => {
                      if (onRefresh) {
                        onRefresh();
                      } else if (handleUpdateStatus) {
                        window.location.reload();
                      }
                    }} 
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {handleReorder && (
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => handleReorder(order)}
                        className="h-8 text-[10px] font-bold gap-1 px-2"
                      >
                        <History className="w-3 h-3" /> Ulangi
                      </Button>
                    )}
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrintReceipt(order)}
                      className="h-8 text-[10px] font-bold gap-1 px-2"
                    >
                      <Printer className="w-3 h-3" /> Cetak
                    </Button>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => setTimelineOrder(order)}
                      className="h-8 text-[10px] font-bold gap-1 px-2"
                    >
                      <Clock className="w-3 h-3" /> Timeline
                    </Button>
                    <Button 
                      variant={editingOrderId === order.id ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => handleEditOrder(order)}
                      className="h-8 text-[10px] font-bold gap-1 px-2"
                    >
                      {editingOrderId === order.id ? 'Loading' : <><Edit className="w-3 h-3" /> Edit</>}
                    </Button>
                  </div>
                </div>
              </td>
            </tr>
          );
        };

        const renderTableSection = (title: string, icon: React.ReactNode, orderList: Order[], isPriority: boolean = false) => {
          if (orderList.length === 0) return null;

          let totalOmset = 0;
          let totalQty = 0;
          let croissantQty = 0;
          let cakeQty = 0;

          orderList.forEach(order => {
            totalOmset += order.grandTotal || 0;
            if (order.items) {
              order.items.forEach(item => {
                totalQty += item.qty;
                if (isCakeOrOther(item.sku)) {
                  cakeQty += item.qty;
                } else {
                  croissantQty += item.qty;
                }
              });
            }
          });

          const croissantRatio = totalQty > 0 ? Math.round((croissantQty / totalQty) * 100) : 0;
          const cakeRatio = totalQty > 0 ? Math.round((cakeQty / totalQty) * 100) : 0;
          
          const maxCapacity = 1000;
          const capacityStatus = totalQty > maxCapacity ? 'Over Capacity' : totalQty > (maxCapacity * 0.8) ? 'Hampir Penuh' : 'Aman';
          const capacityColor = totalQty > maxCapacity ? 'text-red-600 dark:text-red-400' : totalQty > (maxCapacity * 0.8) ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400';

          return (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden mb-8">
              <div className={`px-4 py-3 border-b border-slate-200 dark:border-slate-700 ${isPriority ? 'bg-red-50 dark:bg-red-900/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <h3 className={`font-bold flex items-center gap-2 ${isPriority ? 'text-red-800 dark:text-red-300' : 'text-slate-800 dark:text-slate-200'}`}>
                    {icon}
                    {title}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded border font-bold shadow-sm ${isPriority ? 'bg-red-600 text-white border-red-700' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'}`}>
                    {orderList.length} Pesanan
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-[11px] font-medium text-slate-600 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/50 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="opacity-70">Omset:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Rp {formatRp(totalOmset).replace('Rp', '').trim()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="opacity-70">Produk:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{totalQty} pcs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="opacity-70">Rasio:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Croissant {croissantRatio}% / Cake {cakeRatio}%</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="opacity-70">Kapasitas:</span>
                    <span className={`font-bold ${capacityColor}`}>{capacityStatus} ({totalQty}/{maxCapacity})</span>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                    <tr>
                      <th className="px-4 py-3 border-b dark:border-slate-700 w-12 text-center">No</th>
                      <th className="px-4 py-3 border-b dark:border-slate-700 w-[20%]">Outlet</th>
                      <th className="px-4 py-3 border-b dark:border-slate-700 w-[25%]">Catatan</th>
                      <th className="px-4 py-3 border-b dark:border-slate-700 w-[30%]">Pesanan (Produk & Qty)</th>
                      <th className="px-4 py-3 border-b dark:border-slate-700 w-[25%]">Status & Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderList.map((order, idx) => renderTableRow(order, idx))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        };

        return (
          <div className="space-y-0">
            {renderTableSection(
              "PRIORITAS: Menunggu Rebake / Konfirmasi", 
              <AlertTriangle className="w-4 h-4" />, 
              priorityOrders, 
              true
            )}

            {sortedDates.map((date) => {
              const dateOrders = groupedOrders[date];
              return renderTableSection(
                `Produksi: ${date === 'Tanpa Tanggal' ? date : formatDate(date)}`,
                <Calendar className="w-4 h-4 text-blue-600" />,
                dateOrders
              );
            })}
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
