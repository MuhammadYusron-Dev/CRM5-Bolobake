import { useMemo } from 'react';
import { Order, IntelligenceData, BottleneckSignal, WorkerPerformance, LifecycleEvent } from '@/lib/types';
import { SLA_CONFIG } from '@/lib/config/sla';

export function useOperationsIntelligence(orders: Order[]): IntelligenceData {
  return useMemo(() => {
    const today = new Date();
    const signals: BottleneckSignal[] = [];
    
    // Metrics Accumulators
    let prodQCPass = 0, prodQCTotal = 0;
    let packQCPass = 0, packQCTotal = 0;
    
    const qcResponseTimes: number[] = [];
    const ncrCauses: Record<string, number> = {};
    const ncrIssues: Record<string, number> = {};
    const ncrStages = new Set<string>();
    
    const workerStats: Record<string, { 
      name: string; role: string; 
      taskTimes: number[]; qcErrors: number; taskCount: number 
    }> = {};

    orders.forEach(order => {
      const lc = order.lifecycleData || [];
      
      // 1. BOTTLENECK SIGNALS (SLA EARLY WARNING)
      if (order.currentState === 'WAITING' && order.currentStage) {
        const lastHandover = [...lc].reverse().find(e => e.event === 'HANDOVER' && e.toStage === order.currentStage);
        if (lastHandover) {
          const waitMin = (today.getTime() - new Date(lastHandover.timestamp).getTime()) / 60000;
          let threshold = 60; // default
          if (order.currentStage === 'PRODUCTION') threshold = SLA_CONFIG.PRODUCTION_WAITING_MINUTES;
          if (order.currentStage === 'PACKING') threshold = SLA_CONFIG.PACKING_WAITING_MINUTES;
          if (order.currentStage === 'DELIVERY') threshold = SLA_CONFIG.DELIVERY_WAITING_MINUTES;
          
          if (waitMin > threshold) {
            signals.push({ orderId: order.id, customer: order.customer, stage: order.currentStage, riskLevel: 'BREACHED', reason: `Melewati SLA (${Math.round(waitMin)}m > ${threshold}m)`, predictedDelayMinutes: Math.round(waitMin - threshold) });
          } else if (waitMin > threshold * 0.7) {
            signals.push({ orderId: order.id, customer: order.customer, stage: order.currentStage, riskLevel: 'WARNING', reason: `Mendekati SLA (${Math.round(waitMin)}m / ${threshold}m)`, predictedDelayMinutes: 0 });
          }
        }
      }

      // QC Pending Bottleneck
      if (order.currentState === 'QC_PENDING' && order.qcMeta) {
        const qcWait = (today.getTime() - new Date(order.qcMeta.pendingAt).getTime()) / 60000;
        if (qcWait > 30) {
          signals.push({ orderId: order.id, customer: order.customer, stage: 'QC_' + order.qcMeta.stageOwner, riskLevel: qcWait > 60 ? 'BREACHED' : 'WARNING', reason: `QC Tertunda (${Math.round(qcWait)}m)`, predictedDelayMinutes: Math.round(qcWait) });
        }
      }

      // 2. QC ANALYTICS & WPI TRACKING
      let lastAccept: LifecycleEvent | null = null;
      let lastComplete: LifecycleEvent | null = null;

      lc.forEach((evt, idx) => {
        // Worker Performance - Task Duration
        if (evt.event === 'ACCEPT') {
          lastAccept = evt;
        }
        if (evt.event === 'COMPLETE') {
          lastComplete = evt;
          const uId = evt.actor.userId;
          if (!workerStats[uId]) workerStats[uId] = { name: evt.actor.name, role: evt.actor.role, taskTimes: [], qcErrors: 0, taskCount: 0 };
          workerStats[uId].taskCount++;
          
          if (lastAccept && lastAccept.stage === evt.stage) {
            const taskMin = (new Date(evt.timestamp).getTime() - new Date(lastAccept.timestamp).getTime()) / 60000;
            workerStats[uId].taskTimes.push(taskMin);
          }
        }

        // QC Tracking
        if (evt.event === 'QC_CHECK' && evt.qc) {
          if (evt.stage === 'PRODUCTION') {
            prodQCTotal++;
            if (evt.qc.status === 'PASSED') prodQCPass++;
          }
          if (evt.stage === 'PACKING') {
            packQCTotal++;
            if (evt.qc.status === 'PASSED') packQCPass++;
          }

          if (lastComplete && lastComplete.stage === evt.stage) {
            const qcMin = (new Date(evt.timestamp).getTime() - new Date(lastComplete.timestamp).getTime()) / 60000;
            qcResponseTimes.push(qcMin);
          }
          
          if (evt.qc.status === 'FAILED' && lastComplete) {
            // Attribute QC Error to the worker who completed it
            const uId = lastComplete.actor.userId;
            if (workerStats[uId]) workerStats[uId].qcErrors++;
          }
        }

        // NCR Insight
        if (evt.event === 'NCR_CREATED' && evt.ncr) {
          const issue = evt.ncr.issueType || 'UNKNOWN';
          const cause = evt.ncr.causeCategory || 'UNKNOWN';
          ncrIssues[issue] = (ncrIssues[issue] || 0) + 1;
          ncrCauses[cause] = (ncrCauses[cause] || 0) + 1;
          if (evt.stage) ncrStages.add(evt.stage);
        }
      });
    });

    // Formatting QC Analytics
    const qcAnalytics = {
      productionPassRate: prodQCTotal ? Math.round((prodQCPass / prodQCTotal) * 100) : 100,
      packingPassRate: packQCTotal ? Math.round((packQCPass / packQCTotal) * 100) : 100,
      avgQCResponseTimeMin: qcResponseTimes.length ? Math.round(qcResponseTimes.reduce((a, b) => a + b, 0) / qcResponseTimes.length) : 0,
      topFailureCauses: Object.entries(ncrCauses).map(([cause, count]) => ({ cause, count })).sort((a, b) => b.count - a.count)
    };

    // Formatting NCR Insight
    const ncrInsight = {
      recurringIssues: Object.entries(ncrIssues).map(([issue, count]) => ({ issue, count })).sort((a, b) => b.count - a.count),
      severityTrend: 'STABLE' as 'STABLE', // Placeholder for complex logic
      affectedStages: Array.from(ncrStages)
    };

    // Formatting Worker Performance
    const workerPerformances: WorkerPerformance[] = Object.entries(workerStats).map(([userId, stats]) => {
      const avgTaskTimeMin = stats.taskTimes.length ? Math.round(stats.taskTimes.reduce((a, b) => a + b, 0) / stats.taskTimes.length) : 0;
      const qcErrorRate = stats.taskCount ? (stats.qcErrors / stats.taskCount) * 100 : 0;
      
      // Simple Efficiency Score: base 100 - (errorRate * 2)
      let efficiencyScore = Math.max(0, 100 - (qcErrorRate * 2));
      
      return {
        userId,
        name: stats.name,
        role: stats.role,
        efficiencyScore: Math.round(efficiencyScore),
        qcErrorRate: Math.round(qcErrorRate),
        avgTaskTimeMin,
        taskCount: stats.taskCount
      };
    }).sort((a, b) => b.efficiencyScore - a.efficiencyScore); // Sort best first

    // Sort Signals by risk (BREACHED first, then WARNING)
    signals.sort((a, b) => {
      if (a.riskLevel === 'BREACHED' && b.riskLevel === 'WARNING') return -1;
      if (a.riskLevel === 'WARNING' && b.riskLevel === 'BREACHED') return 1;
      return b.predictedDelayMinutes - a.predictedDelayMinutes;
    });

    return {
      bottleneckSignals: signals,
      qcAnalytics,
      ncrInsight,
      workerPerformances
    };
  }, [orders]);
}
