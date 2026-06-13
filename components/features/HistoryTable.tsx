import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History, Filter, Search, X, Clock, Calendar, Truck, Edit } from 'lucide-react';
import { Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DateRangeFilter } from './DateRangeFilter';

interface HistoryTableProps {
  orderHistory: Order[];
  editingOrderId: number | null;
  handleEditOrder: (order: Order) => void;
  filterStartDate: string;
  setFilterStartDate: (date: string) => void;
  filterEndDate: string;
  setFilterEndDate: (date: string) => void;
  handleReorder?: (order: Order) => void;
}

export function HistoryTable({
  orderHistory,
  editingOrderId,
  handleEditOrder,
  filterStartDate,
  setFilterStartDate,
  filterEndDate,
  setFilterEndDate,
  handleReorder
}: HistoryTableProps) {
  const [searchHistoryInput, setSearchHistoryInput] = useState('');
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [highlightedOutlet, setHighlightedOutlet] = useState('');

  const formatRp = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  useEffect(() => {
    const timer = setTimeout(() => setSearchHistoryQuery(searchHistoryInput), 300);
    return () => clearTimeout(timer);
  }, [searchHistoryInput]);

  const filteredHistory = useMemo(() => {
    const parseDateToNumber = (dateStr: string) => {
      if (!dateStr) return 0;
      // Try YYYY-MM-DD
      const match1 = dateStr.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
      if (match1) {
        return parseInt(`${match1[1]}${match1[2].padStart(2, '0')}${match1[3].padStart(2, '0')}`);
      }
      // Try DD-MM-YYYY
      const match2 = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
      if (match2) {
        return parseInt(`${match2[3]}${match2[2].padStart(2, '0')}${match2[1].padStart(2, '0')}`);
      }
      // Fallback
      try {
        const d = new Date(dateStr);
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
        const matchCustomer = order.customer.toLowerCase().includes(query);
        const matchNotes = order.notes?.toLowerCase().includes(query);
        const matchItems = order.items.some(item => item.sku.toLowerCase().includes(query));
        
        if (!matchCustomer && !matchNotes && !matchItems) {
          return false;
        }
      }
      
      let orderDate = order.productionDate;
      if (!orderDate) {
        try { 
          const ts = new Date(order.timestamp);
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

  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="space-y-4 mb-2">
        <h3 className="text-lg font-serif flex items-center gap-2">
          <History className="w-5 h-5 text-primary" />
          Riwayat Pesanan
        </h3>

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
              <Card key={order.id} className={`transition-all duration-300 ${editingOrderId === order.id ? 'border-blue-300 bg-blue-50/30 shadow-md transform scale-[1.02]' : isHighlighted && !searchHistoryInput ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/40 scale-[1.01] z-10 relative' : 'hover:border-primary/50 hover:shadow-md'}`}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Terkirim</span>
                        <span className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{isNaN(new Date(order.timestamp).getTime()) ? order.timestamp : new Date(order.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <h4 className="font-bold">{order.customer}</h4>
                      {(order.productionDate || order.deliveryDate) && (
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                          {order.productionDate && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> Prod: {order.productionDate}</span>
                          )}
                          {order.deliveryDate && (
                            <span className="flex items-center gap-1"><Truck className="w-3 h-3"/> Kirim: {order.deliveryDate}</span>
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
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>
                          {item.qty}x {item.sku.endsWith(' (sample)') ? (
                            <>{item.sku.replace(' (sample)', '')} <span className="italic text-xs">(sample)</span></>
                          ) : item.sku}
                        </span>
                        <span className="text-muted-foreground">{formatRp(item.qty * item.price)}</span>
                      </div>
                    ))}
                    {order.shippingCost > 0 && (
                      <div className="flex justify-between border-t border-border mt-2 pt-2 text-xs">
                        <span>Ongkos Kirim</span>
                        <span>{formatRp(order.shippingCost)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center font-bold pt-1">
                    <span className="text-sm">Total Tagihan</span>
                    <span className="text-primary text-lg">{formatRp(order.grandTotal)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })
      )}
    </div>
  );
}
