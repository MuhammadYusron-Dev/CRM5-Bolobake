# PRD - Production & Inventory Center

Version: 1.0

Author: Muhammad Yusron

Project: Bolobake ERP

Status: Draft → Approved for Development

Last Updated: June 2026

---

# 1. Executive Summary

Production & Inventory Center adalah modul baru yang akan diintegrasikan ke dalam ERP Bolobake yang sudah berjalan.

Tujuan utama modul ini adalah memberikan visibilitas stok secara real-time, mengotomatisasi reservasi stok ketika order dibuat, menghasilkan kebutuhan produksi secara otomatis, serta menjadi pusat kontrol operasional antara Admin, Produksi, dan Delivery.

Modul ini harus terintegrasi dengan sistem yang sudah ada tanpa mengubah workflow yang saat ini berjalan stabil.

---

# 2. Background

Saat ini sistem Bolobake telah memiliki beberapa modul:

* Sales Management
* Leads Management
* Customer Management
* Order Management
* Production Management
* Delivery Management

Workflow saat ini:

Sales
→ Leads
→ Customer
→ Admin Create Order
→ Production Receive Order
→ Delivery
→ Completed

Kelemahan saat ini:

* Tidak ada visibilitas stok real-time
* Admin tidak mengetahui ketersediaan stok sebelum membuat order
* Produksi tidak memiliki perencanaan produksi otomatis
* Tidak ada reservasi stok
* Tidak ada audit trail pergerakan stok
* Tidak ada warning low stock
* Tidak ada forecasting kebutuhan produksi

---

# 3. Product Goals

## Goal 1

Memberikan informasi stok aktual secara real-time.

## Goal 2

Mengurangi komunikasi manual antara Admin dan Produksi.

## Goal 3

Mengotomatisasi kebutuhan produksi berdasarkan order masuk.

## Goal 4

Menyediakan audit trail seluruh pergerakan stok.

## Goal 5

Menjadi fondasi menuju ERP Operations Center yang lebih lengkap.

---

# 4. Non Goals

Fitur berikut tidak termasuk scope versi pertama:

* Purchasing Management
* Supplier Management
* Raw Material Tracking
* Warehouse Multi Location
* AI Forecasting
* Automatic Purchase Order

Fitur tersebut dapat dikembangkan pada fase berikutnya.

---

# 5. Existing Workflow (Must Remain Unchanged)

Current workflow:

Sales
→ Leads
→ Customer
→ Admin Create Order
→ Production Receive Order
→ Delivery
→ Completed

Requirements:

* Workflow existing tidak boleh berubah
* UI existing tidak boleh diubah kecuali diperlukan
* Existing APIs tidak boleh dihapus
* Existing database structure tidak boleh dimodifikasi secara destruktif
* Existing pages harus tetap berfungsi jika Inventory Module dinonaktifkan

---

# 6. Technical Architecture

Approach:

Event Driven Architecture (Pub/Sub)

Flow:

Order Created

↓

emit("ORDER_CREATED")

↓

Inventory Engine

↓

Stock Reservation

↓

Stock Validation

↓

emit("STOCK_INSUFFICIENT")

↓

Production Engine

↓

Create Production Task

Tujuan:

* Loose Coupling
* Backward Compatible
* Easy Maintenance
* Easy Feature Expansion

---

# 7. User Roles

## Sales

Permissions:

* View Inventory
* View Available Stock

Cannot:

* Edit Stock
* Adjust Inventory

---

## Admin

Permissions:

* Create Order
* View Inventory
* View Reservation Status

Cannot:

* Directly Edit Inventory

---

## Production

Permissions:

* View Production Queue
* Complete Production
* Input Finished Goods

Cannot:

* Modify Orders

---

## Owner

Permissions:

* Full Access
* Analytics
* Reports
* Inventory Monitoring
* Production Monitoring

---

# 8. New Modules

## Inventory Center

Menu:

/inventory

Purpose:

Manage finished goods inventory.

Features:

* Inventory Dashboard
* Stock Monitoring
* Reservation Tracking
* Low Stock Monitoring
* Inventory Movement Logs

---

## Production Center

Menu:

/production

Purpose:

Manage production workload.

Features:

* Production Queue
* Production Completion
* Production Analytics

---

# 9. Database Design

Google Sheets Based

---

## Sheet: Inventory

Columns:

SKU

Product Name

Current Stock

Reserved Stock

Updated At

Formula:

Available Stock

=

Current Stock

*

Reserved Stock

Available Stock should NOT be stored.

Must be calculated dynamically.

---

## Sheet: InventoryMovements

Columns:

ID

Timestamp

SKU

Movement Type

Quantity

Reference Type

Reference ID

User

Notes

Movement Types:

PRODUCTION

RESERVATION

RELEASE

ADJUSTMENT

RETURN

WASTE

---

## Sheet: ProductionQueue

Columns:

ID

Created At

Target Date

SKU

Product Name

Required Qty

Priority

Status

Source Order ID

Assigned To

Status:

Pending

In Progress

Completed

Cancelled

---

# 10. Event System

File:

lib/events.ts

Purpose:

Internal Event Bus

Events:

ORDER_CREATED

ORDER_UPDATED

ORDER_CANCELLED

STOCK_INSUFFICIENT

PRODUCTION_COMPLETED

INVENTORY_ADJUSTED

Requirements:

* Must use try/catch isolation
* Event failure cannot block order creation
* Event processing must be asynchronous

---

# 11. Inventory Engine

File:

lib/inventory.ts

Responsibilities:

Listen:

ORDER_CREATED

Actions:

1. Read Inventory
2. Check Stock
3. Reserve Stock
4. Create Movement Log
5. Trigger Production Event if needed

Formula:

Available Stock

=

Current Stock

*

Reserved Stock

---

# 12. Production Engine

File:

lib/production.ts

Responsibilities:

Listen:

STOCK_INSUFFICIENT

Actions:

1. Calculate Deficit
2. Create Production Task
3. Insert ProductionQueue Record

Example:

Stock Available

20

Order

100

Deficit

80

System creates:

Production Task

80 pcs

---

# 13. Production Completion Flow

Production Queue

↓

Complete Production

↓

Update Inventory

↓

Add Current Stock

↓

Create Movement Log

↓

Mark Production Task Completed

Example:

Production Completed

100 Croissant

System:

Current Stock += 100

Movement Log Created

Queue Status = Completed

---

# 14. Inventory Page

Route:

/inventory

Widgets:

Inventory Summary

* Total SKU
* Low Stock
* Reserved Items

Inventory Table

Columns:

Product

Current Stock

Reserved

Available

Status

Status Rules:

Green

Safe

Yellow

Low

Red

Critical

---

# 15. Production Page

Route:

/production

Widgets:

Production Summary

* Pending Queue
* In Progress
* Completed Today

Production Queue Table

Columns:

SKU

Product

Required Qty

Priority

Deadline

Status

Assigned To

---

# 16. Operations Dashboard

Future Ready

Route:

/operations

Widgets:

Inventory Health

Production Queue

Low Stock Alerts

Production Recommendations

Waste Summary

Daily Production

---

# 17. Concurrency Protection

IMPORTANT

System uses Google Sheets.

Potential issue:

Race Condition

Example:

Admin A reserves 50

Admin B reserves 40

Same stock record

Potential overwrite risk.

Requirements:

* Implement Inventory Lock Manager
* Prevent simultaneous write collisions
* Retry mechanism minimum 3 times
* Log all conflicts

---

# 18. Error Handling

Requirements:

If Inventory Engine fails:

* Order Creation MUST succeed

If Production Engine fails:

* Order Creation MUST succeed

Errors must be logged.

No blocking behavior allowed.

---

# 19. Success Metrics

Inventory Accuracy

Target:

> 95%

Production Queue Automation

Target:

100%

Manual Coordination Reduction

Target:

> 50%

Stock Visibility

Target:

Real Time

---

# 20. Development Phases

Phase 1

* Inventory Sheet
* Inventory Dashboard
* Reservation System
* Event Bus
* Production Queue

Phase 2

* Inventory Movements
* Production Completion
* Low Stock Alerts
* Inventory Analytics

Phase 3

* Forecasting
* Production Recommendation
* Operations Dashboard

---

# 21. Development Rules

STRICT RULES

1. Analyze existing project structure first.
2. Do not refactor existing modules.
3. Do not rename existing files.
4. Do not modify CRM modules.
5. Do not modify Sales modules.
6. Do not modify Leads modules.
7. Do not modify Customer modules.
8. Integrate through event-driven hooks only.
9. Keep all changes backward compatible.
10. Existing workflow must continue working.
11. No breaking changes allowed.
12. Reuse existing UI components.
13. Reuse existing authentication.
14. Reuse existing Google Sheets infrastructure.
15. Ensure deployable state after every phase.
16. Run lint and type check after each phase.
17. Prefer additive changes over replacements.
18. If conflict occurs, create adapters instead of rewrites.

END OF DOCUMENT
