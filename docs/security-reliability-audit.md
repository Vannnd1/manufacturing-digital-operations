# Phase 14 — Security & Reliability Hardening Audit Report

This document reports the findings, architectural remediations, and verification results of **Phase 14: Security & Reliability Hardening** for the Manufacturing Digital Operations System portfolio project.

---

## 1. Scope & Modules Inspected

The hardening audit covered the following architectural layers and boundaries:

| Layer / Domain | Modules & Files Inspected | Key Focus Areas |
|---|---|---|
| **Configuration & Secrets** | `apps/backend/src/config/env.ts`, `apps/backend/src/index.ts`, `.env.example`, `.gitignore` | Insecure fallbacks, environment startup validation, leaked secrets prevention |
| **HTTP & Middleware** | `apps/backend/src/app.ts`, `apps/backend/src/middleware/*` | Security headers, payload size limits (DoS), CORS validation, input sanitization |
| **Authentication** | `apps/backend/src/services/auth.service.ts`, `apps/backend/src/routes/auth.routes.ts`, `apps/backend/src/controllers/auth.controller.ts` | Token claims verification, email normalization, public seed route restriction |
| **Authorization (RBAC)** | `apps/backend/src/routes/*`, `apps/backend/src/middleware/requireRole.ts` | Server-side role enforcement on PR creation, audit logs, and operational endpoints |
| **Internal Controls (SoD)** | `apps/backend/src/services/procurement.service.ts`, `apps/backend/src/controllers/procurement.controller.ts` | Separation of Duties: self-approval prevention on Purchase Requests |
| **Business Invariants** | `apps/backend/src/services/*`, `apps/backend/src/schemas/*` | Inactive supplier validation, duplicate line item handling, negative stock protection |
| **Frontend Reliability** | `apps/frontend/src/store/useAuthStore.ts`, `apps/frontend/src/pages/*` | Corrupted storage crash resilience, double-click mutation protection, safe error presentation |

---

## 2. Verified Findings & Remediations

### Finding 1: Lack of Self-Approval Prevention on Purchase Requests (Segregation of Duties)
- **Severity:** HIGH
- **Root Cause:** `ProcurementService.approvePR` did not compare `pr.user_id` against the approving caller `userId`. An actor with Manager or Admin role who requested materials could approve their own purchase request, violating standard manufacturing four-eyes governance.
- **Fix Implemented:** Added rule in [`apps/backend/src/services/procurement.service.ts`](file:///c:/Users/panpe/Downloads/manufacturing-digital-operations/apps/backend/src/services/procurement.service.ts):
  `if (pr.user_id && pr.user_id === userId) throw new Error("SELF_APPROVAL_FORBIDDEN");`
  Mapped in controller to HTTP 403 Forbidden with `{ error: "Requesters cannot approve their own purchase requests (Segregation of Duties)", code: "FORBIDDEN" }`.
- **Status:** **Resolved & Verified**

### Finding 2: Missing Role Enforcement on Purchase Request Creation
- **Severity:** HIGH
- **Root Cause:** `POST /api/procurement/pr` in [`apps/backend/src/routes/procurement.routes.ts`](file:///c:/Users/panpe/Downloads/manufacturing-digital-operations/apps/backend/src/routes/procurement.routes.ts) only checked `requireAuth`. Any authenticated user (including Warehouse, QC, or Production staff) could directly issue Purchase Requests without role authorization.
- **Fix Implemented:** Attached `requireRole(["Admin", "Manager", "Purchasing"])` to `POST /api/procurement/pr`. Non-purchasing roles are rejected with HTTP 403 Forbidden.
- **Status:** **Resolved & Verified**

### Finding 3: Missing Role Enforcement on System Audit Trail
- **Severity:** HIGH
- **Root Cause:** Audit trail routes (`GET /api/audit/logs`, `GET /api/audit/traceability/prodo/:id`, `GET /api/audit/traceability/material/:id`) only checked `requireAuth`. Any authenticated user could inspect all organizational audit logs and stock traceability.
- **Fix Implemented:** Attached `requireRole(["Admin", "Manager"])` across all audit routes in [`apps/backend/src/routes/audit.routes.ts`](file:///c:/Users/panpe/Downloads/manufacturing-digital-operations/apps/backend/src/routes/audit.routes.ts).
- **Status:** **Resolved & Verified**

### Finding 4: Unauthenticated Public Demo Seeding Endpoint
- **Severity:** HIGH
- **Root Cause:** `GET /api/auth/seed-demo-users` was exposed as an open GET route that performed database mutations and inserted accounts with default passwords.
- **Fix Implemented:**
  1. Disabled entirely in production environments (`NODE_ENV === "production"`) returning HTTP 403 Forbidden.
  2. Protected in development by requiring `requireAuth` and `requireRole(["Admin"])`.
- **Status:** **Resolved & Verified**

### Finding 5: Insecure JWT Secret Fallback in Production
- **Severity:** MEDIUM
- **Root Cause:** Hardcoded fallback `"supersecretjwtkey_for_mvp_only"` was used whenever `process.env.JWT_SECRET` was missing, even in production.
- **Fix Implemented:**
  1. Created [`apps/backend/src/config/env.ts`](file:///c:/Users/panpe/Downloads/manufacturing-digital-operations/apps/backend/src/config/env.ts) with `validateStartupConfig()` which fails fast on process boot if `NODE_ENV === "production"` and `JWT_SECRET` or `DATABASE_URL` is missing or uses placeholder values.
  2. Updated `requireAuth.ts` and `auth.service.ts` to reject insecure defaults when running in production.
- **Status:** **Resolved & Verified**

### Finding 6: Missing HTTP Security Headers and Payload Size Limits
- **Severity:** MEDIUM
- **Root Cause:** Standard security response headers were not configured, `express.json()` lacked a body limit (permitting payload-based DoS), and CORS allowed wildcard with credentials enabled.
- **Fix Implemented:**
  1. Added native Express middleware in [`apps/backend/src/app.ts`](file:///c:/Users/panpe/Downloads/manufacturing-digital-operations/apps/backend/src/app.ts) configuring `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Strict-Transport-Security` in production.
  2. Enforced `express.json({ limit: "1mb" })` with HTTP 413 `PAYLOAD_TOO_LARGE` error handler.
  3. Sanitized CORS origin evaluation to validate origins against allowed domains.
- **Status:** **Resolved & Verified**

### Finding 7: Request Sanitization and Mass-Assignment Protection
- **Severity:** MEDIUM
- **Root Cause:** In [`apps/backend/src/middleware/validate.ts`](file:///c:/Users/panpe/Downloads/manufacturing-digital-operations/apps/backend/src/middleware/validate.ts), `schema.parse(...)` results were previously discarded. Any stripped unknown fields, defaults, or coerced values were not reflected in `req.body`, leaving raw unsanitized request bodies exposed to controllers.
- **Fix Implemented:** Reassigned parsed result properties back to `req.body`, `req.query`, and `req.params`.
- **Status:** **Resolved & Verified**

### Finding 8: Missing UUID Parameter Validation on Audit Endpoints
- **Severity:** MEDIUM
- **Root Cause:** Traceability endpoints accepted raw string route parameters without verifying UUID structure, resulting in internal PostgreSQL syntax errors instead of clean 400 Bad Request responses.
- **Fix Implemented:** Attached `prodoIdParamSchema` and `materialIdParamSchema` validators and created `auditLogsQuerySchema` for query limit/offset validation.
- **Status:** **Resolved & Verified**

### Finding 9: Inactive Supplier and Duplicate Line Item Safeguards
- **Severity:** MEDIUM
- **Root Cause:** `createPO` did not verify supplier active status or duplicate materials. `createGoodsReceipt` did not verify whether the same PO item ID appeared multiple times in a single submission.
- **Fix Implemented:**
  1. `createPO` checks `trx("suppliers").where({ id: supplierId, is_active: true })`.
  2. `createGoodsReceipt` checks `new Set(poItemIds).size === poItemIds.length` and rejects duplicates with HTTP 400.
- **Status:** **Resolved & Verified**

### Finding 10: Client Crash from Corrupted LocalStorage
- **Severity:** LOW
- **Root Cause:** In [`apps/frontend/src/store/useAuthStore.ts`](file:///c:/Users/panpe/Downloads/manufacturing-digital-operations/apps/frontend/src/store/useAuthStore.ts), `JSON.parse(localStorage.getItem("user") || "null")` threw an unhandled SyntaxError if storage was malformed, rendering a blank page on boot.
- **Fix Implemented:** Wrapped storage initialization in a safe try-catch helper `getInitialUser()` falling back safely to `null`.
- **Status:** **Resolved & Verified**

---

## 3. Automated Tests & Regression Coverage

A comprehensive test suite was added in [`apps/backend/src/security.reliability.test.ts`](file:///c:/Users/panpe/Downloads/manufacturing-digital-operations/apps/backend/src/security.reliability.test.ts) covering:

1. **Security Headers (1 test):** Verifies all 4 standard security headers.
2. **Payload Size Limits (1 test):** Verifies HTTP 413 `PAYLOAD_TOO_LARGE` on payloads > 1MB.
3. **Authentication Token & Claims (3 tests):** Verifies empty tokens, missing claim payloads, and expired tokens.
4. **PR Creation RBAC (4 tests):** Verifies Purchasing can create PR while Warehouse, QC, and Production are denied (403).
5. **Separation of Duties (2 tests):** Verifies self-approval rejection (403) and different manager approval success (200).
6. **Audit Trail RBAC & Param Validation (5 tests):** Verifies Manager/Admin access (200), Warehouse/Production denial (403), and malformed UUID rejection (400).
7. **Business Invariants (2 tests):** Verifies inactive supplier rejection and duplicate PO receipt rejection.
8. **Public Seed Route Protection (2 tests):** Verifies unauthenticated (401) and non-admin (403) rejection.
9. **Startup Configuration Safety (3 tests):** Verifies fail-fast behavior on missing/insecure production environment variables.

---

## 4. Verification Commands & Results

| Verification Step | Command | Result |
|---|---|---|
| **Backend Unit & Security Tests** | `npm test --workspace=backend` | **17 test suites passed, 180 tests passed, 0 failures** |
| **Frontend Production Build** | `npm run build --workspace=frontend` | **Clean build in ~2s (`tsc -b && vite build`), zero type errors** |

---

## 5. Known Limitations & Panasonic Boundary

- **Panasonic Boundary (`AGENTS.md`):** This application is an independent portfolio project and does not connect to or simulate any proprietary Panasonic corporate network, SSO, Active Directory, or internal ERP.
- **Single-Host Monolith Focus:** Rate limiting and DDoS protection are handled via Express payload limits and server-level guards. In high-traffic production deployments, upstream edge protection (e.g. AWS CloudFront / WAF or Cloudflare) would complement the application-level safeguards implemented here.
