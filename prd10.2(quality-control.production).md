# PRD PHASE 2 - QUALITY CONTROL & PRODUCTION EXECUTION SYSTEM

## Manufacturing Integrity Layer (QC + Production Control + NCR System)

---

# ⚠️ IMPORTANT INSTRUCTION

This is NOT a workflow redesign.

This is a **QUALITY ENFORCEMENT LAYER on top of Phase 1 lifecycle system**.

You MUST:

* NOT modify Phase 1 lifecycle engine
* NOT modify FSM or role system
* NOT change database structure drastically
* ONLY extend system with QC + production validation layer

---

# 1. PHASE 2 OBJECTIVE

Transform system from:

> “Order tracking system”

into:

> “Controlled production execution system with quality gate enforcement”

---

# 2. NEW CORE MODULES

## 2.1 QC (QUALITY CONTROL) MODULE

Each production stage MUST now support QC checkpoint.

---

### QC TRIGGERS

QC is triggered on:

* PRODUCTION COMPLETION
* PACKING COMPLETION

---

### QC DATA STRUCTURE (EXTENSION ONLY)

Add into lifecycle event (NO schema change required):

```ts id="qc01"
qc: {
  status: "PENDING" | "PASSED" | "FAILED",
  checkedBy: Actor,
  notes: string,
  checklist: string[],
  timestamp: string
}
```

---

## RULE

* QC does NOT affect lifecycle stage
* QC affects ONLY “approval to proceed”

---

# 2.2 NCR SYSTEM (NON CONFORMANCE REPORT)

## PURPOSE

Capture production failures in structured format.

---

### NCR EVENT TYPE

Add new event:

```text id="ncr01"
NCR_CREATED
```

---

### NCR STRUCTURE

```ts id="ncr02"
{
  event: "NCR_CREATED",
  orderId,
  stage,
  issueType: "QUALITY" | "QUANTITY" | "PROCESS" | "PACKAGING",
  severity: "LOW" | "MEDIUM" | "HIGH",
  description,
  actionRequired: string,
  createdBy: Actor,
  timestamp
}
```

---

## RULE

* NCR DOES NOT STOP workflow automatically
* NCR triggers BLOCKED healthStatus only if severity = HIGH

---

# 2.3 PRODUCTION EXECUTION CONTROL

## NEW BEHAVIOR

Production stage is no longer only “status change”

It becomes:

> EXECUTION + QC + VALIDATION PIPELINE

---

### PRODUCTION FLOW

1. ACCEPT (Production)
2. IN_PROGRESS
3. COMPLETE PRODUCTION
4. QC CHECK (mandatory gate)
5. PASS → forward to PACKING
6. FAIL → NCR + REWORK cycle

---

# 3. NEW STATE ENHANCEMENT (NO DATABASE CHANGE)

Extend lifecycle interpretation:

### New conceptual states:

* IN_PROGRESS_PRODUCTION
* QC_PENDING
* QC_PASSED
* QC_FAILED
* NCR_TRIGGERED
* REWORK_REQUIRED

---

# 4. QC RULE ENGINE

## RULES

### RULE 1

Production cannot move to PACKING unless:

```text id="qc_rule_1"
qc.status === "PASSED"
```

---

### RULE 2

If QC FAILED:

* must generate NCR
* must revert to PRODUCTION_REWORK state

---

### RULE 3

Super Admin can override QC

BUT MUST be logged as:

```text id="qc_rule_3"
OVERRIDE_QC
```

---

# 5. UI EXTENSIONS (STEP 3 COMPATIBLE)

## 5.1 QC PANEL (NEW UI COMPONENT)

Add:

### <QCPanel />

Must show:

* checklist items
* pass/fail buttons
* QC notes input
* QC status badge

---

## 5.2 NCR DASHBOARD MODULE

Add:

* NCR list table
* filter by severity
* filter by stage
* unresolved NCR count

---

## 5.3 PRODUCTION CONTROL VIEW

Production UI MUST show:

* current job list
* QC status indicator
* NCR warnings
* rework queue

---

# 6. SLA IMPACT LOGIC (ENHANCED)

QC delay must be included in SLA calculation:

### SLA formula:

```text id="sla_phase2"
total_time = production_time + qc_time + rework_time
```

---

# 7. BACKWARD COMPATIBILITY RULES

You MUST ensure:

* Phase 1 lifecycle remains intact
* No breaking changes to existing orders
* QC fields are OPTIONAL extensions
* NCR is additive only

---

# 8. NON-FUNCTIONAL REQUIREMENTS

* No performance degradation in order listing
* QC calculation must be lazy-loaded
* NCR must not block lifecycle API unless severity = HIGH + rule enforced

---

# 9. OUTPUT REQUIREMENTS AFTER IMPLEMENTATION

You MUST provide:

1. QC workflow architecture diagram
2. NCR event lifecycle mapping
3. Production execution flow explanation
4. SLA recalculation logic update
5. Role impact analysis for QC system
6. Failure scenario handling (QC fail / NCR / override)

---

# FINAL GOAL OF PHASE 2

System must now guarantee:

> “No product reaches delivery without quality verification traceability”

---

END OF PRD PHASE 2
