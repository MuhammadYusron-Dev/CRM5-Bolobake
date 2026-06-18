import React, { useState } from 'react';
import { Order, OrderStage, OrderState, OrderHealth, LifecycleEvent, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2, User, ArrowRight, Play, RefreshCcw, XCircle, FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export function StatusBadge({ stage, state, health }: { stage?: OrderStage, state?: OrderState, health?: OrderHealth }) {
  if (!stage || !state) return <Badge variant="outline" className="bg-slate-100 text-slate-700">Legacy Mode</Badge>;

  let bgColor = 'bg-slate-100 text-slate-700';
  let icon = null;

  if (state === 'WAITING') {
    bgColor = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    icon = <Clock className="w-3 h-3 mr-1" />;
  } else if (state === 'ACCEPTED' || state === 'IN_PROGRESS') {
    bgColor = 'bg-blue-100 text-blue-800 border-blue-300';
    icon = <Play className="w-3 h-3 mr-1" />;
  } else if (state === 'REVIEW_REQUIRED' || state === 'REWORK_REQUIRED' || state === 'QC_FAILED') {
    bgColor = 'bg-red-100 text-red-800 border-red-300';
    icon = <XCircle className="w-3 h-3 mr-1" />;
  } else if (state === 'COMPLETED' || state === 'QC_PASSED') {
    bgColor = 'bg-green-100 text-green-800 border-green-300';
    icon = <CheckCircle2 className="w-3 h-3 mr-1" />;
  } else if (state === 'QC_PENDING') {
    bgColor = 'bg-cyan-100 text-cyan-800 border-cyan-300 animate-pulse';
    icon = <FileText className="w-3 h-3 mr-1" />;
  }

  let healthIndicator = null;
  if (health === 'AT_RISK') {
    healthIndicator = <span className="ml-2 flex items-center text-orange-600 animate-pulse"><AlertTriangle className="w-3 h-3 mr-0.5" /> AT RISK</span>;
  } else if (health === 'BLOCKED') {
    healthIndicator = <span className="ml-2 flex items-center text-red-600 font-bold"><XCircle className="w-3 h-3 mr-0.5" /> BLOCKED</span>;
  } else if (health === 'OVERDUE') {
    healthIndicator = <span className="ml-2 flex items-center text-red-600 font-bold animate-bounce"><AlertTriangle className="w-3 h-3 mr-0.5" /> OVERDUE</span>;
  }

  return (
    <div className="flex items-center text-[10px] font-bold">
      <Badge variant="outline" className={`flex items-center px-2 py-0.5 rounded-full uppercase tracking-wider ${bgColor}`}>
        {icon}
        {stage} {state !== 'IN_PROGRESS' ? ` - ${state}` : ''}
      </Badge>
      {healthIndicator}
    </div>
  );
}

export function OrderTimeline({ events }: { events?: LifecycleEvent[] }) {
  if (!events || events.length === 0) {
    return <div className="text-xs text-slate-500 italic">Tidak ada data timeline (Legacy).</div>;
  }

  return (
    <div className="relative border-l-2 border-slate-200 ml-3 mt-4 mb-2 space-y-4">
      {events.map((evt, idx) => {
        let eventColor = 'bg-slate-400';
        if (evt.event === 'HANDOVER') eventColor = 'bg-yellow-500';
        if (evt.event === 'ACCEPT') eventColor = 'bg-blue-500';
        if (evt.event === 'COMPLETE') eventColor = 'bg-green-500';
        if (evt.event === 'REJECT') eventColor = 'bg-red-500';
        if (evt.event === 'QC_CHECK') eventColor = evt.qc?.status === 'PASSED' ? 'bg-green-500' : 'bg-red-600';
        if (evt.event === 'NCR_CREATED') eventColor = 'bg-red-700 ring-red-200';
        
        let deltaText = null;
        if (evt.event === 'ACCEPT' && evt.handoverAt) {
          const deltaMin = Math.round((new Date(evt.timestamp).getTime() - new Date(evt.handoverAt).getTime()) / 60000);
          deltaText = `Response: ${deltaMin} min`;
        }

        return (
          <div key={evt.eventId || idx} className="relative pl-6">
            <div className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ring-white ${eventColor}`} />
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  {evt.event}
                  {evt.toStage && <span className="text-slate-500 font-normal">→ {evt.toStage}</span>}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-[10px] text-slate-500 flex items-center gap-1"><User className="w-3 h-3"/> {evt.actor?.name || 'System'} ({evt.actor?.role || 'System'})</p>
                  <span className="text-slate-300">•</span>
                  <p className="text-[10px] text-slate-500">{new Date(evt.timestamp).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              {deltaText && (
                <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-600 shrink-0">
                  <Clock className="w-3 h-3 mr-1" /> {deltaText}
                </Badge>
              )}
            </div>

            {/* PHASE 2: QC Rendering */}
            {evt.event === 'QC_CHECK' && evt.qc && (
              <div className={`mt-2 text-xs p-2 rounded border flex flex-col gap-1.5 ${evt.qc.status === 'PASSED' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                <div className="font-bold flex items-center gap-1">
                  {evt.qc.status === 'PASSED' ? <CheckCircle2 className="w-3.5 h-3.5"/> : <XCircle className="w-3.5 h-3.5"/>}
                  QC {evt.qc.status}
                </div>
                {evt.qc.checklist && evt.qc.checklist.length > 0 && (
                  <div className="text-[10px] pl-4">
                    <ul className="list-disc text-slate-600">
                      {evt.qc.checklist.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* PHASE 2: NCR Rendering */}
            {evt.event === 'NCR_CREATED' && evt.ncr && (
              <div className="mt-2 text-xs p-3 rounded bg-red-100 border border-red-300 text-red-900 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] px-2 py-0.5 rounded-bl font-bold uppercase">
                  {evt.ncr.severity} SEVERITY
                </div>
                <div className="font-bold flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-4 h-4"/> NON-CONFORMANCE REPORT ({evt.ncr.issueType})
                </div>
                <div className="mt-1">{evt.ncr.description}</div>
                {evt.ncr.actionRequired && <div className="mt-1 pt-1 border-t border-red-200/50"><strong>Action:</strong> {evt.ncr.actionRequired}</div>}
              </div>
            )}

            {(evt.notes || evt.reason) && (
              <div className="mt-2 text-xs bg-slate-50 p-2 rounded text-slate-700 border border-slate-100 flex items-start gap-1.5">
                <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0"/>
                <span>{evt.notes || evt.reason}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ActionControl({ 
  order, 
  currentUser, 
  onActionComplete 
}: { 
  order: Order, 
  currentUser?: { userId: string, name: string, role: string } | null,
  onActionComplete: () => void 
}) {
  const [modalState, setModalState] = useState<{ isOpen: boolean; action: string; targetStage?: string } | null>(null);

  if (!currentUser) return null;
  const role = currentUser.role as Role;
  const stage = order.currentStage;
  const state = order.currentState;

  const isSuperAdmin = role === 'SUPER_ADMIN';
  
  // Matrix rules
  const hasRoleAccess = isSuperAdmin || stage === role;
  const canHandover = hasRoleAccess && (state === 'COMPLETED' || state === 'QC_PASSED' || (stage === 'ADMIN' && state !== 'WAITING'));
  const canAccept = hasRoleAccess && state === 'WAITING';
  const canComplete = hasRoleAccess && (state === 'ACCEPTED' || state === 'IN_PROGRESS' || state === 'REWORK_REQUIRED');
  const canReject = hasRoleAccess && state !== 'COMPLETED' && stage !== 'ADMIN';
  const canQc = hasRoleAccess && state === 'QC_PENDING';

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-slate-100">
        {canAccept && (
          <Button size="sm" onClick={() => setModalState({ isOpen: true, action: 'ACCEPT' })} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
            <Play className="w-3 h-3 mr-1.5" /> Terima Tugas
          </Button>
        )}
        
        {canComplete && (
          <Button size="sm" onClick={() => setModalState({ isOpen: true, action: 'COMPLETE' })} className="h-7 text-xs bg-green-600 hover:bg-green-700">
            <CheckCircle2 className="w-3 h-3 mr-1.5" /> Selesaikan {state === 'REWORK_REQUIRED' ? 'Rework' : ''}
          </Button>
        )}

        {canQc && (
          <Button size="sm" onClick={() => setModalState({ isOpen: true, action: 'QC_CHECK' })} className="h-7 text-xs bg-cyan-600 hover:bg-cyan-700 animate-pulse">
            <FileText className="w-3 h-3 mr-1.5" /> Verifikasi QC
          </Button>
        )}

        {canHandover && (
          <Button size="sm" variant="outline" onClick={() => setModalState({ isOpen: true, action: 'HANDOVER' })} className="h-7 text-xs border-yellow-500 text-yellow-700 hover:bg-yellow-50">
            <ArrowRight className="w-3 h-3 mr-1.5" /> Handover
          </Button>
        )}

        {canReject && (
          <Button size="sm" variant="outline" onClick={() => setModalState({ isOpen: true, action: 'REJECT' })} className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50">
            <XCircle className="w-3 h-3 mr-1.5" /> Tolak / Revisi
          </Button>
        )}
      </div>

      {modalState && (
        <ActionModal 
          isOpen={modalState.isOpen}
          action={modalState.action}
          order={order}
          onClose={() => setModalState(null)}
          onSuccess={() => {
            setModalState(null);
            onActionComplete();
          }}
        />
      )}
    </>
  );
}

function ActionModal({ isOpen, action, order, onClose, onSuccess }: { isOpen: boolean, action: string, order: Order, onClose: () => void, onSuccess: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [targetStage, setTargetStage] = useState(
    action === 'HANDOVER' ? (
      order.currentStage === 'ADMIN' ? 'PRODUCTION' : 
      order.currentStage === 'PRODUCTION' ? 'PACKING' : 
      order.currentStage === 'PACKING' ? 'DELIVERY' : 'COMPLETED'
    ) : ''
  );
  
  // Phase 2 QC States
  const [qcStatus, setQcStatus] = useState<'PASSED' | 'FAILED' | ''>('');
  const [qcChecklist, setQcChecklist] = useState({
    qty: false,
    quality: false,
    packaging: false
  });
  const [ncrType, setNcrType] = useState('QUALITY');
  const [ncrSeverity, setNcrSeverity] = useState('MEDIUM');
  const [ncrCause, setNcrCause] = useState('HUMAN_ERROR');

  // Smart Decision Gate States
  const [failureMode, setFailureMode] = useState<'ALL' | 'PARTIAL'>('ALL');
  const [partialRejects, setPartialRejects] = useState<Record<number, number>>({});
  
  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  const isDeliveryToday = order.deliveryDate === todayStr;
  const [followUpAction, setFollowUpAction] = useState<'SCHEDULE_REBAKE' | 'ESCALATE_TO_ADMIN'>(isDeliveryToday ? 'ESCALATE_TO_ADMIN' : 'SCHEDULE_REBAKE');

  const handleSubmit = async () => {
    setErrorMsg(null);
    if (action === 'REJECT' && !notes.trim()) {
      setErrorMsg("Catatan penolakan wajib diisi.");
      return;
    }
    if (action === 'QC_CHECK') {
      if (!qcStatus) {
        setErrorMsg("Pilih keputusan QC (Lulus/Gagal).");
        return;
      }
      if (qcStatus === 'FAILED' && !notes.trim()) {
        setErrorMsg("Deskripsi NCR (Catatan Operasional) wajib diisi jika QC Gagal.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        rowNumber: order.rowNumber,
        orderId: order.id,
        action,
        targetStage: action === 'HANDOVER' ? targetStage : undefined,
        notes
      };

      if (action === 'QC_CHECK') {
        const checks = [];
        if (qcChecklist.qty) checks.push('Kuantitas Sesuai');
        if (qcChecklist.quality) checks.push('Kualitas Standar');
        if (qcChecklist.packaging) checks.push('Kemasan Aman');

        payload.qc = {
          status: qcStatus,
          notes,
          checklist: checks
        };

        if (qcStatus === 'FAILED') {
          let partialNote = '';
          if (failureMode === 'PARTIAL') {
            const rejectedItems = order.items.map((item, i) => {
              const r = partialRejects[i];
              return r && r > 0 ? `${item.sku} (Reject: ${r} pcs)` : null;
            }).filter(Boolean);
            partialNote = `Gagal Sebagian:\n- ${rejectedItems.join('\n- ')}\n\n`;
          }

          payload.ncr = {
            issueType: ncrType,
            severity: ncrSeverity,
            causeCategory: ncrCause,
            description: `${partialNote}${notes}`
          };
          payload.followUpAction = followUpAction;
          
          if (followUpAction === 'ESCALATE_TO_ADMIN') {
            payload.notes = `${partialNote}Menunggu Konfirmasi Penyesuaian Invoice oleh Admin.\nCatatan: ${notes}`;
          }
        }
      }

      const res = await fetch('/api/orders/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Structured error handling mapped to error types like ORDER_LOCKED
        const typePrefix = data.error === 'ORDER_LOCKED' ? '[LOCKED] ' : 
                           data.error === 'INVALID_STATE_TRANSITION' ? '[TRANSITION_ERROR] ' : '';
        throw new Error(typePrefix + (data.message || data.error || 'Terjadi kesalahan internal.'));
      }
      
      onSuccess();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (action) {
      case 'HANDOVER': return `Handover dari ${order.currentStage}`;
      case 'ACCEPT': return `Terima Tugas di ${order.currentStage}`;
      case 'COMPLETE': return `Selesaikan Tugas di ${order.currentStage}`;
      case 'REJECT': return `Tolak/Revisi Pesanan`;
      case 'QC_CHECK': return `Quality Control (QC Gate)`;
      default: return action;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className={action === 'QC_CHECK' ? 'sm:max-w-md' : ''}>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
          <div className="text-sm">
            <span className="font-semibold block">Pelanggan:</span> {order.customer}
          </div>
          
          {action === 'HANDOVER' && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Kirim Ke (Target Stage)</label>
              <Select value={targetStage} onValueChange={setTargetStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRODUCTION">Produksi</SelectItem>
                  <SelectItem value="PACKING">Packing</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                  <SelectItem value="COMPLETED">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'QC_CHECK' && (
            <div className="space-y-4 border-t border-slate-200 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold block">Ceklis Verifikasi</label>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={qcChecklist.qty} onChange={e => setQcChecklist(p => ({...p, qty: e.target.checked}))}/> Kuantitas Sesuai</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={qcChecklist.quality} onChange={e => setQcChecklist(p => ({...p, quality: e.target.checked}))}/> Kualitas Standar</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={qcChecklist.packaging} onChange={e => setQcChecklist(p => ({...p, packaging: e.target.checked}))}/> Kemasan Aman</label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold block">Keputusan QC</label>
                <div className="flex gap-2">
                  <Button type="button" variant={qcStatus === 'PASSED' ? 'default' : 'outline'} className={`flex-1 ${qcStatus === 'PASSED' ? 'bg-green-600 hover:bg-green-700' : ''}`} onClick={() => setQcStatus('PASSED')}><CheckCircle2 className="w-4 h-4 mr-2"/> LULUS QC</Button>
                  <Button type="button" variant={qcStatus === 'FAILED' ? 'destructive' : 'outline'} className="flex-1" onClick={() => setQcStatus('FAILED')}><XCircle className="w-4 h-4 mr-2"/> GAGAL QC (NCR)</Button>
                </div>
              </div>

              {qcStatus === 'FAILED' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-3">
                  <p className="text-xs font-bold text-red-800 uppercase flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Non-Conformance Report (NCR)</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={failureMode} onValueChange={(v: 'ALL'|'PARTIAL') => setFailureMode(v)}>
                      <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Mode Kegagalan" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Gagal Semua</SelectItem>
                        <SelectItem value="PARTIAL">Gagal Sebagian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {failureMode === 'PARTIAL' && (
                    <div className="bg-white p-2 rounded border border-red-100 space-y-2">
                      <p className="text-[10px] font-bold text-slate-600">Input Jumlah Gagal per Item:</p>
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-xs">
                          <span className="truncate flex-1">{item.sku} <span className="text-slate-400">(Pesan: {item.qty})</span></span>
                          <input 
                            type="number" 
                            min="0" max={item.qty} 
                            placeholder="Reject" 
                            className="w-16 p-1 border rounded text-xs text-center"
                            value={partialRejects[idx] || ''}
                            onChange={(e) => setPartialRejects(p => ({...p, [idx]: parseInt(e.target.value) || 0}))}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-white p-2 rounded border border-red-100 space-y-2">
                    <p className="text-[10px] font-bold text-slate-600">Smart Delivery-Date Checker:</p>
                    {isDeliveryToday ? (
                      <div className="text-xs text-red-700 font-semibold bg-red-100 p-1.5 rounded">
                        ⚠️ Kirim Hari Ini. Tidak ada waktu untuk rebake.
                      </div>
                    ) : (
                      <div className="text-xs text-green-700 font-semibold bg-green-100 p-1.5 rounded">
                        🟢 Kirim {order.deliveryDate}. Tersedia waktu rebake besok.
                      </div>
                    )}

                    <Select value={followUpAction} onValueChange={(v: any) => setFollowUpAction(v)}>
                      <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Tindak Lanjut" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SCHEDULE_REBAKE">Jadwalkan Rebake</SelectItem>
                        <SelectItem value="ESCALATE_TO_ADMIN">Eskalasi ke Admin (Konfirmasi Customer)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-red-200 pt-2">
                    <Select value={ncrType} onValueChange={setNcrType}>
                      <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUALITY">Kualitas Produk</SelectItem>
                        <SelectItem value="QUANTITY">Kuantitas Kurang</SelectItem>
                        <SelectItem value="PACKAGING">Kemasan Rusak</SelectItem>
                        <SelectItem value="PROCESS">Proses Salah</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={ncrSeverity} onValueChange={setNcrSeverity}>
                      <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Rendah (Low)</SelectItem>
                        <SelectItem value="MEDIUM">Sedang (Medium)</SelectItem>
                        <SelectItem value="HIGH">Tinggi (High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <Select value={ncrCause} onValueChange={setNcrCause}>
                      <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HUMAN_ERROR">Human Error (Kelalaian)</SelectItem>
                        <SelectItem value="MATERIAL_ISSUE">Material Cacat (Bahan Baku)</SelectItem>
                        <SelectItem value="PROCESS_ERROR">Kesalahan Proses / Resep</SelectItem>
                        <SelectItem value="EQUIPMENT_FAILURE">Kendala Mesin / Alat</SelectItem>
                        <SelectItem value="OTHER">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold">Catatan Operasional {action === 'REJECT' || (action === 'QC_CHECK' && qcStatus === 'FAILED') ? <span className="text-red-500">*</span> : ''}</label>
            <Textarea 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder={action === 'QC_CHECK' && qcStatus === 'FAILED' ? "Deskripsikan detail cacat produk / alasan NCR..." : "Opsional: Tambahkan catatan operasional..."}
              rows={3}
            />
          </div>
          
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Batal</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} variant={action === 'REJECT' ? 'destructive' : 'default'}>
            {isSubmitting ? 'Memproses...' : 'Konfirmasi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
