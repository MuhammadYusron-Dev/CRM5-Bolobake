export interface OrderItem {
  id: number;
  sku: string;
  price: number;
  qty: number;
  isSample?: boolean;
  isSplitInvoice?: boolean;
  shape?: string;
  cut?: string;
  millescrepeType?: string;
  flavor1?: string;
  flavor2?: string;
  briocheCut?: string;
  bagelSplit?: string;
  bagelSplitType?: string;
  sampleFeedback?: string;
  sampleStatus?: string;
}

export type Role = 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'SALES' | 'PRODUCTION' | 'PACKING' | 'DELIVERY';

export interface Actor {
  userId: string;
  name: string;
  role: Role | string;
}

export type OrderStage = 'ADMIN' | 'PRODUCTION' | 'PACKING' | 'DELIVERY' | 'COMPLETED';
export type OrderState = 'WAITING' | 'ACCEPTED' | 'IN_PROGRESS' | 'REVIEW_REQUIRED' | 'COMPLETED' | 'QC_PENDING' | 'QC_PASSED' | 'QC_FAILED' | 'REWORK_REQUIRED';
export type OrderHealth = 'HEALTHY' | 'AT_RISK' | 'BLOCKED' | 'OVERDUE';
export type EventType = 'CREATE' | 'SUBMIT' | 'HANDOVER' | 'ACCEPT' | 'ASSIGN' | 'REJECT' | 'COMPLETE' | 'OVERRIDE' | 'QC_CHECK' | 'NCR_CREATED';
export type EventSource = 'WEB_APP' | 'SYSTEM' | 'MIGRATION';

export interface QCData {
  status: 'PENDING' | 'PASSED' | 'FAILED';
  checkedBy?: Actor;
  notes?: string;
  checklist?: string[];
  timestamp?: string;
}

export type CauseCategory = 'HUMAN_ERROR' | 'MATERIAL_ISSUE' | 'PROCESS_ERROR' | 'EQUIPMENT_FAILURE' | 'OTHER';

export interface NCRData {
  issueType: 'QUALITY' | 'QUANTITY' | 'PROCESS' | 'PACKAGING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  causeCategory?: CauseCategory;
  description: string;
  actionRequired?: string;
}

// ==========================================
// PHASE 3: INTELLIGENCE TYPES
// ==========================================
export interface BottleneckSignal {
  orderId: number;
  customer: string;
  stage: string;
  riskLevel: 'WARNING' | 'BREACHED';
  reason: string;
  predictedDelayMinutes: number;
}

export interface QCAnalytics {
  productionPassRate: number;
  packingPassRate: number;
  avgQCResponseTimeMin: number;
  topFailureCauses: { cause: string; count: number }[];
}

export interface NCRInsight {
  recurringIssues: { issue: string; count: number }[];
  severityTrend: 'IMPROVING' | 'STABLE' | 'WORSENING';
  affectedStages: string[];
}

export interface WorkerPerformance {
  userId: string;
  name: string;
  role: string;
  efficiencyScore: number;
  qcErrorRate: number;
  avgTaskTimeMin: number;
  taskCount: number;
}

export interface IntelligenceData {
  bottleneckSignals: BottleneckSignal[];
  qcAnalytics: QCAnalytics;
  ncrInsight: NCRInsight;
  workerPerformances: WorkerPerformance[];
}

export interface QCMeta {
  pendingAt: string;
  stageOwner: 'PRODUCTION' | 'PACKING' | string;
  isBlocked: boolean;
}

export interface LifecycleEvent {
  version: string;
  eventId: string;
  event: EventType;
  source: EventSource;
  actor: Actor;
  timestamp: string;
  
  // Contexts
  stage?: OrderStage;
  fromStage?: OrderStage;
  toStage?: OrderStage;
  assignedTo?: string;
  assignedToId?: string;
  department?: string;
  reason?: string;
  notes?: string;
  attachments?: string[];
  
  // SLA Fields
  handoverAt?: string;
  acceptedAt?: string;
  completedAt?: string;

  // Phase 2 Extensions
  qc?: QCData;
  ncr?: NCRData;
}

export type OrderStatus = 'Pesanan Dibuat' | 'Dikonfirmasi' | 'Produksi' | 'Packing' | 'Delivery' | 'Diterima' | string;

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
  currentStage?: OrderStage;
  currentState?: OrderState;
  healthStatus?: OrderHealth;
  lifecycleData?: LifecycleEvent[];
  statusTimestamps?: {
    dikonfirmasi?: string;
    produksi?: string;
    packing?: string;
    delivery?: string;
    diterima?: string;
  };
  qcMeta?: QCMeta;
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
  notes?: string;
}

// ==========================================
// DATA SOURCE ABSTRACTION LAYER (FUTURE READY)
// ==========================================
export interface DataSourceAdapter {
  getOrders(): Promise<Order[]>;
  updateOrder(orderId: number, data: Partial<Order>): Promise<boolean>;
  appendLifecycleEvent(orderId: number, event: LifecycleEvent): Promise<boolean>;
}
