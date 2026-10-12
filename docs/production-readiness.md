# Production Readiness & Observability Runbook

## 1. System Overview & Architecture

The **Manufacturing Digital Operations System** operates as a modular monolith with an Express/TypeScript backend, PostgreSQL database (via Knex query builder), and React/TypeScript frontend.

This document serves as the operational runbook and observability reference for deploying, diagnosing, monitoring, and operating the system safely in development and production environments.

---

## 2. Environment Configuration

### 2.1 Configuration Keys Reference
| Variable | Required | Default (Dev) | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `development` | Target environment (`development`, `test`, `production`, `staging`). |
| `PORT` | Optional | `3001` | HTTP listening port (must be valid integer 1–65535). |
| `DATABASE_URL` | Yes (Prod) | `postgres://postgres:postgres@localhost:5432/manufacturing_db` | PostgreSQL connection URI. Masked in startup diagnostics. |
| `JWT_SECRET` | Yes (Prod) | `supersecretjwtkey_for_mvp_only` (dev only) | Secret for signing auth tokens. Minimum 16 characters in production. Default placeholders are rejected at boot. |
| `FRONTEND_URL` | Optional | `http://localhost:5173` | Allowed frontend origin for CORS policies. |

### 2.2 Boot-time Validation
The server executes `validateStartupConfig()` at startup before opening HTTP listeners:
- Rejects missing `DATABASE_URL` or placeholder `JWT_SECRET` in production (`NODE_ENV=production`).
- Rejects non-numeric or out-of-range ports (`PORT < 1` or `PORT > 65535`).
- Masks sensitive credentials via `getSafeConfigSummary()` before outputting configuration summaries.

---

## 3. Health, Liveness & Readiness Probes

The system provides separated probe endpoints following industry container orchestration conventions:

```
                      ┌──────────────────────────────────────┐
                      │          Load Balancer / Ingress     │
                      └──────────────┬───────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────┐             ┌───────────────────────────────────┐
│     Liveness Probes         │             │         Readiness Probes          │
│  GET /api/health            │             │   GET /api/health/readiness       │
│  GET /api/health/liveness   │             │                                   │
│  • Node event loop check    │             │   • Bounded DB query (3000ms)     │
│  • Process uptime           │             │   • Validates active connection   │
│  • Does NOT fail on DB blip │             │   • HTTP 200 = ready              │
│  • HTTP 200 = process ok    │             │   • HTTP 503 = traffic diversion  │
└─────────────────────────────┘             └───────────────────────────────────┘
```

### 3.1 `GET /api/health` & `GET /api/health/liveness` (Liveness)
- **Purpose**: Confirms the Node.js process and HTTP server are responsive.
- **Dependency Isolation**: Does **not** check external database connectivity. A temporary database blip will not cause container orchestrators (Kubernetes/Docker) to endlessly kill and restart the process.
- **Response**: HTTP 200 OK
  ```json
  {
    "status": "ok",
    "uptime": 1420,
    "timestamp": "2026-10-12T09:50:00.000Z"
  }
  ```

### 3.2 `GET /api/health/readiness` (Readiness)
- **Purpose**: Verifies the process is ready to serve production user traffic.
- **Dependency Verification**: Performs a bounded `SELECT 1 AS alive` query against the database with a 3000ms timeout limit.
- **Status Codes**:
  - `HTTP 200 OK`: Database connected, returns latency in milliseconds (`latencyMs`).
  - `HTTP 503 Service Unavailable`: Database unreachable or connection timed out.
- **Security Safeguard**: Never returns raw connection strings, usernames, passwords, or SQL stack traces.

### 3.3 `GET /api/health/diagnostics` (Safe Metrics)
- **Purpose**: Lightweight operational telemetry without external monitoring agents.
- **Metrics Collected**:
  - `nodeVersion`: Current Node runtime version.
  - `uptimeSeconds`: Cumulative uptime.
  - `memoryMb`: Memory breakdown (`rss`, `heapTotal`, `heapUsed`).
  - `databasePool`: Connection pool state (`used`, `free`, `pending`).

---

## 4. Structured Logging & Redaction

### 4.1 Log Format
- **Production (`NODE_ENV=production`)**: Single-line machine-parseable JSON for ingestion by log collectors (Datadog, CloudWatch, Loki).
- **Development**: Formatted human-readable console entries with ISO timestamp and log level.

### 4.2 Automatic Redaction
The logging system (`utils/logger.ts`) automatically scrubs sensitive credentials from payloads, arrays, and strings:
- Object keys: `password`, `token`, `secret`, `jwt`, `authorization`, `cookie`, `database_url`, `apiKey`.
- Bearer tokens: Replaced with `[REDACTED_TOKEN]`.
- Database URLs: Passwords extracted and replaced with `***` (e.g., `postgres://user:***@host:5432/db`).

---

## 5. Request Correlation & Diagnostics

### 5.1 `X-Request-Id` Propagation
- Every incoming request is assigned a unique identifier via `requestCorrelation` middleware.
- If a client or upstream proxy supplies `X-Request-Id` (or `X-Correlation-Id`), it is validated:
  - Allowed characters: alphanumeric, hyphens, underscores (`^[a-zA-Z0-9_-]{1,64}$`).
  - Malformed strings, header-splitting attempts (`\r`, `\n`), and oversized inputs are discarded and replaced with a newly generated UUIDv4.
- The validated ID is attached to:
  - Response header: `X-Request-Id: <id>`
  - Request object: `req.id`
  - All log entries emitted during request lifecycle
  - Client-facing error responses

### 5.2 HTTP Diagnostics
On response completion (`res.on("finish")`), completion diagnostics are logged with:
- Method, path, status code, duration in milliseconds (`durationMs`), client IP.
- Health probe queries with HTTP 200 are logged at `debug` level to prevent log spam in production.

---

## 6. Safe Error Responses & Translation

The centralized error handler standardizes error payloads and translates raw database errors into safe application errors:

| Underlying Error | Translated HTTP Code | Error Code | Sanitized Message |
| :--- | :--- | :--- | :--- |
| PG `23505` (Unique Violation) | `409 Conflict` | `CONFLICT` | "A record with these details already exists." |
| PG `23503` (Foreign Key) | `400 Bad Request` | `INVALID_REFERENCE` | "Referenced entity does not exist or cannot be modified." |
| Connection Timeout / Refused | `503 Unavailable` | `SERVICE_UNAVAILABLE` | "Database service temporarily unavailable." |
| Payload > 1MB | `413 Payload Too Large`| `PAYLOAD_TOO_LARGE` | "Payload too large. Maximum allowed request size is 1MB." |
| CORS Origin Violation | `403 Forbidden` | `FORBIDDEN` | "Origin not allowed by CORS policy." |
| Unhandled Exceptions | `500 Internal Error` | `INTERNAL_ERROR` | "Internal Server Error" (Stack traces hidden in prod) |

All error responses include the correlation ID:
```json
{
  "error": "A record with these details already exists.",
  "code": "CONFLICT",
  "requestId": "6a9e1e2d-3c4b-4f8a-9b1c-8e2a3b4c5d6e"
}
```

---

## 7. Graceful Startup & Shutdown Lifecycle

```
[SIGTERM / SIGINT Received]
          │
          ▼
Set isShuttingDown = true (ignore duplicate signals)
          │
          ▼
Start 10s Force Exit Timer (unref'd)
          │
          ▼
server.close() ───► Stop accepting new HTTP connections; drain active requests
          │
          ▼
closeDatabaseConnection() ───► Destroy Knex connection pool cleanly
          │
          ▼
process.exit(0) ───► Clean exit
```

- Handles `SIGTERM` (container orchestrator termination) and `SIGINT` (`Ctrl+C`).
- Prevents double-shutdown conflicts via atomic boolean flag.
- Safe fallback: 10-second timer forces process exit if active sockets or database queries hang.
- Listens to `uncaughtException` and `unhandledRejection` to log structured diagnostics before graceful exit.

---

## 8. Operational Troubleshooting Guide

### 8.1 Application Fails to Boot
- **Symptom**: Process exits immediately with code 1.
- **Diagnosis**: Check startup log for `startup_config_validation_failed`.
- **Resolution**:
  - Verify `PORT` is between 1 and 65535.
  - In production, verify `JWT_SECRET` is set and has at least 16 characters.
  - Verify `DATABASE_URL` is set in production.

### 8.2 Database Connection Fails / Readiness Returns 503
- **Symptom**: `GET /api/health/readiness` returns HTTP 503 `{ "status": "degraded", "database": "disconnected" }`.
- **Diagnosis**:
  - Verify PostgreSQL service is active on host/network.
  - Check credentials in `DATABASE_URL`.
  - Check connection pool metrics via `GET /api/health/diagnostics`.
- **Resolution**:
  - Test PostgreSQL connectivity using `pg_isready -d <DATABASE_URL>`.
  - Run database migrations: `npm run migrate`.

### 8.3 Frontend Cannot Reach Backend
- **Symptom**: Frontend shows "Backend server unreachable" network error alert.
- **Diagnosis**:
  - Check browser console for CORS error or `ERR_CONNECTION_REFUSED`.
  - Inspect `VITE_API_URL` build setting (defaults to `http://localhost:3001/api`).
  - Verify `FRONTEND_URL` in backend matches frontend domain for CORS whitelist.
- **Resolution**:
  - Set `FRONTEND_URL=https://your-frontend-domain.com` in backend environment.

### 8.4 Free-tier Hosting Constraints
- **Cold Starts**: On free container hosts (Render, Railway), applications spin down when idle. First request may take 30–50s to respond. Probes should use a 10s+ startup grace period.
- **Connection Limits**: Free tier PostgreSQL databases often cap max connections to 20. Backend Knex pool is configured with `min: 2, max: 10` to avoid connection exhaustion.
- **Ephemeral Filesystem**: Uploaded files or local SQLite files do not persist across redeploys. Use persisted PostgreSQL for all state.
