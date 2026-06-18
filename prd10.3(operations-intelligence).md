# PRD PHASE 3 - OPERATIONS INTELLIGENCE & PREDICTIVE CONTROL SYSTEM

## Intelligent Manufacturing Control Layer (Analytics + Prediction + Early Warning System)

---

# ⚠️ IMPORTANT INSTRUCTION

This is NOT a workflow modification phase.

This is an **INTELLIGENCE & OBSERVABILITY LAYER on top of Phase 1 & Phase 2 systems**.

You MUST:

* NOT modify Lifecycle FSM (Phase 1)
* NOT modify QC / NCR engine (Phase 2)
* NOT change database structure
* ONLY ADD analytics, prediction, monitoring, and alert systems

---

# 1. PHASE 3 OBJECTIVE

Transform system from:

> “Reactive production system (tracking + QC)”

into:

> “Predictive operational intelligence system”

---

# 2. CORE MODULES

---

## 2.1 BOTTLENECK PREDICTION ENGINE

### PURPOSE

Detect delays BEFORE they become operational issues.

---

### INPUT SOURCES

* Lifecycle events (HANDOVER, ACCEPT, COMPLETE)
* QC_PENDING duration
* NCR frequency
* WAITING states (Phase 1)

---

### OUTPUT METRICS

```ts id="bp01"
BottleneckSignal {
  orderId: string,
  stage: "ADMIN" | "PRODUCTION" | "PACKING" | "DELIVERY",
  riskLevel: "LOW" | "MEDIUM" | "HIGH",
  reason: string,
  predictedDelayMinutes: number
}
```

---

### LOGIC RULE

If:

* WAITING > SLA threshold
* OR QC_PENDING > 30 min
* OR NCR frequency > baseline

→ trigger BOTTLENECK SIGNAL

---

# 2.2 QC ANALYTICS ENGINE (PHASE 2 EXTENSION)

### NEW METRICS

* QC PASS RATE per stage
* QC FAILURE RATE per SKU
* REWORK FREQUENCY
* QC TIME AVERAGE

---

### OUTPUT

```ts id="qc_metrics"
QCAnalytics {
  productionPassRate: number,
  packingPassRate: number,
  avgQCResponseTime: number,
  topFailureCauses: string[]
}
```

---

# 2.3 NCR INTELLIGENCE LAYER

### PURPOSE

Convert NCR logs into structured intelligence.

---

### ENHANCEMENT (NON-BREAKING)

Extend NCR interpretation:

```ts id="ncr_ai"
NCRInsight {
  recurringIssues: string[],
  severityTrend: "IMPROVING" | "STABLE" | "WORSENING",
  affectedStages: string[]
}
```

---

# 2.4 SLA EARLY WARNING SYSTEM

### RULE

If:

```text id="sla_warn"
WAITING_TIME > 70% SLA_THRESHOLD
```

→ trigger WARNING BEFORE breach

---

### STATES

* NORMAL
* WARNING
* BREACHED

---

# 2.5 WORKER PERFORMANCE INDEX (WPI)

### PURPOSE

Measure operational efficiency per actor.

---

### METRICS

* average completion time
* QC failure rate per worker
* task throughput

---

### OUTPUT

```ts id="wpi"
WorkerPerformance {
  userId: string,
  efficiencyScore: number,
  qcErrorRate: number,
  avgTaskTime: number
}
```

---

# 3. REAL-TIME OPERATIONS DASHBOARD (NEW LAYER)

---

## 3.1 CONTROL TOWER UI

Add new dashboard section:

### <OperationsControlTower />

Contains:

* Bottleneck heatmap
* QC failure trend graph
* NCR severity timeline
* SLA breach warnings
* Worker ranking list

---

## 3.2 ALERT SYSTEM (NON-INTRUSIVE)

### ALERT TYPES

* Bottleneck Warning
* QC Risk Alert
* NCR Spike Alert
* SLA Breach Warning

---

### RULE

Alerts must be:

* non-blocking
* real-time
* visually prioritized

---

# 4. MINOR SYSTEM IMPROVEMENTS (FROM PHASE 2 REVIEW)

---

## 4.1 QC METRIC AGGREGATION (ENABLE NOW)

Enable aggregation pipeline for:

* QC pass rate per team
* QC failure per SKU
* QC trend over time

---

## 4.2 NCR ROOT CAUSE TAGGING (EXTENSION ONLY)

Add classification:

```ts id="ncr_causes"
CAUSE_CATEGORY:
- HUMAN_ERROR
- MATERIAL_ISSUE
- PROCESS_ERROR
- EQUIPMENT_FAILURE
```

---

## 4.3 QC TIME SLA TRACKING

Track:

```text id="qc_time"
QC_PENDING → QC_CHECK duration
```

Used for SLA improvement analytics only.

---

# 5. DATA ARCHITECTURE RULES

You MUST ensure:

* NO DB schema changes required
* ALL metrics computed from existing lifecycle + QC + NCR logs
* ALL intelligence is derived (not stored as source of truth)

---

# 6. NON-FUNCTIONAL REQUIREMENTS

* All analytics must be lazy computed or cached
* Dashboard must not block lifecycle operations
* Prediction must not modify workflow decisions
* System must remain backward compatible with Phase 1 & 2

---

# 7. FINAL SYSTEM GOAL

After Phase 3 implementation:

System must achieve:

> “Predict operational failure BEFORE it happens, not after it occurs”

---

# 8. OUTPUT REQUIREMENTS

After implementation, you MUST provide:

1. Bottleneck detection logic explanation
2. QC analytics computation flow
3. NCR intelligence mapping
4. SLA warning system architecture
5. Worker performance scoring model
6. Dashboard control tower layout explanation

---

END OF PRD PHASE 3
