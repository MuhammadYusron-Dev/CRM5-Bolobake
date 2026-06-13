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
}

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
  subtotal: number;
  grandTotal: number;
  totalPcs: number;
  timestamp: string;
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
