# Operational Reporting & Manufacturing Insights

## 1. Overview & Objective

The **Manufacturing Digital Operations System** provides an auditable, real-time reporting engine delivering actionable visibility across four mission-critical operational domains:
1. **Inventory Movements & Threshold Compliance**
2. **Procurement Spend & Supplier Commitments**
3. **Production Output & Yield Performance**
4. **Quality Control Inspections & Defect Distributions**

All metrics and KPIs are calculated dynamically from persisted SQL transactional records via Knex query builders. In accordance with project engineering rules:
- **No Fabricated Data**: Zero values are strictly separated from absent data. No random multipliers, simulated trends, or arbitrary targets are introduced.
- **Strict Data Consistency**: Aggregations execute atomically against live operational tables.
- **Zero-Division Safeguards**: Formula calculations (yield rate, defect rate) safely guard against zero denominators.
- **CSV Injection Defense**: Exported spreadsheets sanitize cell values against formula injection attacks.

---

## 2. Architecture & Data Source Mapping

```
┌────────────────────────────────────────────────────────┐
│               Frontend: /reports Page                 │
│      (Tabular KPIs, Presets, Custom Date Filters)      │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP GET (JSON / CSV)
┌───────────────────────────▼────────────────────────────┐
│         API Layer: /api/reports (requireAuth)          │
│        Zod Schema Validation (Range & ISO Dates)       │
└───────────────────────────┬────────────────────────────┘
                            │ Service Aggregations
┌───────────────────────────▼────────────────────────────┐
│                    ReportsService                      │
│   ├─ getSummary()                                      │
│   ├─ getInventoryReport()                              │
│   ├─ getProcurementReport()                            │
│   ├─ getProductionReport()                             │
│   ├─ getQualityReport()                                │
│   └─ exportReport() (Sanitized CSV Stream)             │
└───────────────────────────┬────────────────────────────┘
                            │ Knex SQL Queries
┌───────────────────────────▼────────────────────────────┐
│                PostgreSQL / SQLite DB                  │
│   • materials & inventory_transactions                 │
│   • purchase_requests, purchase_orders & items         │
│   • production_orders                                  │
│   • qc_inspections & defect_records                    │
└────────────────────────────────────────────────────────┘
```

---

## 3. Metric Formulations & Calculations

### 3.1 Inventory Metrics
* **Total Stock Quantity**: `SUM(current_stock)` across active materials.
* **Low Stock Count**: Number of active materials where `current_stock > 0` and `current_stock <= min_stock`.
* **Out of Stock Count**: Number of active materials where `current_stock = 0`.
* **Material Stock Status**:
  - `OUT_OF_STOCK`: When `current_stock <= 0`.
  - `LOW_STOCK`: When `current_stock <= min_stock` and `current_stock > 0`.
  - `HEALTHY`: When `current_stock > min_stock`.
* **Stock Movements (Receipts / Consumptions / Adjustments)**:
  - `Receipts`: `SUM(quantity)` from `inventory_transactions` where `type = 'RECEIPT'` within the date window.
  - `Consumptions`: `SUM(ABS(quantity))` from `inventory_transactions` where `type = 'ISSUE'` within the date window.
  - `Adjustments`: `SUM(quantity)` from `inventory_transactions` where `type = 'ADJUSTMENT'` within the date window.
  - `Net Change`: `receipts - consumptions + adjustments`.

### 3.2 Procurement Metrics
* **Total Committed Spend**: `SUM(poi.quantity * poi.unit_price)` from `purchase_order_items` joined to `purchase_orders` where `po.status != 'CANCELLED'` within the date window.
* **Purchase Order Counts**: Total POs, Completed POs, and Open/Pending POs.
* **Purchase Request Pipeline**: Status grouping counts (`DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED`, `CONVERTED_TO_PO`).
* **Top Suppliers by Spend**: Grouped by supplier ID and name, ordered by descending total spend.

### 3.3 Production Metrics
* **Total Work Orders**: `COUNT(*)` from `production_orders` within the date window.
* **Planned vs Actual Output**: `SUM(planned_quantity)` and `SUM(actual_quantity)`.
* **Status Distribution**: Breakdown by `DRAFT`, `PLANNED`, `RELEASED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
* **Yield Rate**:
  $$\text{Yield Rate (\%)} = \begin{cases} \text{round}\left(\frac{\text{actual\_quantity}}{\text{planned\_quantity}} \times 100, 2\right), & \text{if planned\_quantity} > 0 \\ 0, & \text{if planned\_quantity} = 0 \end{cases}$$

### 3.4 Quality Control Metrics
* **Total Inspections**: `COUNT(*)` from `qc_inspections` within the date window.
* **Inspected Units**: `SUM(sample_size)`.
* **Passed vs Defective Units**: `SUM(sample_size - defect_count)` vs `SUM(defect_count)`.
* **Inspection Status Breakdown**: `PASSED`, `FAILED`, `PENDING`.
* **Defect Rate**:
  $$\text{Defect Rate (\%)} = \begin{cases} \text{round}\left(\frac{\text{defective\_units}}{\text{inspected\_units}} \times 100, 2\right), & \text{if inspected\_units} > 0 \\ 0, & \text{if inspected\_units} = 0 \end{cases}$$
* **Defect Root Cause Distribution**: Count of defect occurrences grouped by `defect_type` from `defect_records`.

---

## 4. API Endpoints Specification

All endpoints are authenticated with `requireAuth` and accept date range query parameters.

### 4.1 Filter Parameters
| Parameter | Type | Validation / Allowed Values | Description |
| :--- | :--- | :--- | :--- |
| `range` | String | `7d`, `30d`, `all`, `custom` | Predefined or custom time filter |
| `startDate`| ISO String | Valid ISO date format | Start timestamp (required if `range=custom`) |
| `endDate` | ISO String | Valid ISO date format | End timestamp (required if `range=custom`, must be $\ge$ `startDate`) |
| `materialId`| UUID | Optional UUID | Specific material filter for inventory transactions |

### 4.2 Endpoint Catalog
1. **`GET /api/reports/summary`**: Cross-functional operational overview containing summary cards for all 4 domains.
2. **`GET /api/reports/inventory`**: Stock valuation, stock health classification, and transaction movement ledger.
3. **`GET /api/reports/procurement`**: Financial commitment totals, PO and PR breakdowns, and supplier ranking.
4. **`GET /api/reports/production`**: Output comparison, work order status distribution, and yield rate.
5. **`GET /api/reports/quality`**: Inspection volume, pass/fail metrics, defect rate, and defect category Pareto breakdown.
6. **`GET /api/reports/export?domain=<domain>&range=<range>`**: Secure streaming CSV export with formula injection prevention. Supported domains: `inventory`, `procurement`, `production`, `quality`, `all`.

---

## 5. Security & Export Hardening

### CSV Formula Injection Defense
When spreadsheets (Microsoft Excel, LibreOffice Calc, Google Sheets) open CSV files, cells starting with formula command triggers can execute untrusted system commands (DDE) or external web requests.

The export engine (`sanitizeCsvField`) applies strict sanitization:
1. Detects prefix characters: `=`, `+`, `-`, `@`, `\t`, `\r`.
2. Prefixes dangerous triggers with an apostrophe `'` to force text interpretation.
3. Escapes embedded double-quotes as `""` and wraps cells in quotes.

---

## 6. Frontend User Interface

The frontend reporting interface is implemented at `/reports` matching `DESIGN.md` guidelines:
- **Navigation**: Accessible directly via the sidebar navigation item `Reports`.
- **Date Range Toolbar**: One-click preset toggles (`7d`, `30d`, `All Time`, `Custom`) with reactive date pickers.
- **Domain Tabs**: Quick-switch tabs for Overview, Inventory, Procurement, Production, and Quality.
- **Dense Industrial Design**: Information-dense tables, monospace alignment for quantities and SKUs, and unambiguous status badges.
- **Export Action**: Direct file download trigger that queries `/api/reports/export` and saves sanitized `.csv` files locally.
- **Resilience**: Zero-state displays, skeleton loading, and explicit error retry flows.
