export interface OrderItem {
  id: number;
  sku: string;
  price: number;
  qty: number;
  isSample?: boolean;
  shape?: string;
  cut?: string;
  millescrepeType?: string;
  flavor1?: string;
  flavor2?: string;
  briocheCut?: string;
  bagelSplit?: string;
  bagelSplitType?: string;
}

export type OrderStatus = 'Pesanan Dibuat' | 'Dikonfirmasi' | 'Produksi' | 'Packing' | 'Delivery' | 'Diterima';

export interface Order {
  id: number;
  rowNumber?: number;
  customer: string;
  productionDate?: string;
  deliveryDate?: string;
  items: OrderItem[];
  isFreeShipping: boolean;
  shippingCost: number;
  notes: string;
  deliveryNotes?: string;
  subtotal: number;
  grandTotal: number;
  totalPcs: number;
  timestamp: string;
  status?: OrderStatus;
  statusTimestamps?: {
    dikonfirmasi?: string;
    produksi?: string;
    packing?: string;
    delivery?: string;
    diterima?: string;
  };
}

export interface Product {
  id: string;
  nama: string;
  harga: number;
  kategori: string;
  satuan: string;
  aktif: boolean;
}

export interface Customer {
  id: string;
  name: string;
  tier: string;
  whatsapp: string;
  address: string;
}
