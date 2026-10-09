# Manufacturing Digital Operations System

An enterprise-grade Manufacturing Operations Management (MOM) MVP. This system digitizes the core supply chain workflow from procurement through inventory, production, and quality control.

## 🚀 Implemented Features (MVP Scope)

**Backend Modules & Business Logic (100% Complete)**
- **Authentication & RBAC**: JWT-based login with strict role-based access control (Admin, Manager, Production, QC).
- **Inventory Management**: Atomic inventory transactions enforcing strict constraints (e.g., no negative stock).
- **Procurement**: Purchase Requests (PR), Purchase Orders (PO), and Goods Receipt workflows.
- **Production Management**: Bill of Materials (BoM) processing, dynamic material availability checks, logical reservations, and consumption.
- **Quality Control**: Pass/Fail inspections with defect categorization enforcing 1:1 quantity traceability.
- **Audit Logs**: Immutable activity logging for every critical state change.
- **Dashboard**: Real-time aggregation of operational metrics (Low Stock, Pending PRs, Active Production, Recent Defects).

**Frontend UI (Operational Focus)**
- Built with React, Tailwind CSS v4, and React Router.
- Designed with strict "Anti-Slop" principles: functional, data-dense, operational tables without decorative fluff or fabricated data.
- **Included Screens**: Dashboard, Inventory, Purchase Approvals, Production Execution (Check/Reserve/Record), and Quality Control Inspections.
- **Note**: Creation forms for Master Data (Materials, Suppliers, Products) and Order Origination (Draft PRs, POs, ProdOs) are intentionally omitted from the MVP UI to focus on operational execution, though their backend APIs are fully functional and tested.

## 🏗️ Architecture
- **Monorepo**: NPM Workspaces
- **Frontend**: React (Vite, Zustand, Tailwind, Axios, Lucide Icons)
- **Backend**: Node.js (Express, TypeScript, Knex.js, Zod, Jest, Bcrypt, JWT)
- **Database**: SQLite (Development/Test) / PostgreSQL (Production ready via Knex)

## 🛠️ Setup & Run Instructions

### Prerequisites
- Node.js (v18+)
- NPM

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Navigate to the backend and configure your environment:
```bash
cp apps/backend/.env.example apps/backend/.env
```
*(The default configuration uses an in-memory or file-based SQLite database for immediate development if PostgreSQL is not configured).*

### 3. Database Migrations
```bash
npm run migrate --workspace=backend
```

### 4. Run Development Servers
Start both the Frontend (Vite) and Backend (Express) concurrently:
```bash
npm run dev
```
- Frontend runs at: `http://localhost:5173`
- Backend runs at: `http://localhost:3000`

## 🧪 Testing and Verification

The system includes comprehensive automated tests covering all critical business rules, RBAC blocks, and transaction rollbacks.

```bash
# Run all backend integration tests
npm test --workspace=backend

# Run typechecking
npx tsc -b apps/frontend
npx tsc --noEmit --project apps/backend/tsconfig.json

# Run frontend linter
npm run lint
```

## 🚀 Deployment (Zero-Cost Architecture)
The MVP is designed to run entirely within free tiers.

- **Frontend (Vercel)**: Connect your repository to Vercel. Set `Framework Preset` to `Vite`, `Build Command` to `npm run build`, and `Output Directory` to `apps/frontend/dist`. Ensure `VITE_API_URL` is set in Vercel's Environment Variables pointing to your Render backend URL.
- **Backend (Render)**: Create a Web Service connected to your repository. Set `Root Directory` to `apps/backend`, `Build Command` to `npm install && npm run build`, and `Start Command` to `npm start`. Configure your `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, and `FRONTEND_URL` environment variables.
- **Database (Neon Serverless PostgreSQL)**: Provision a free tier Postgres database. Copy the connection string into the `DATABASE_URL` environment variable for your Render Web Service.

**Migrations in Production**: You will need to apply migrations to your Neon database either locally or by running a one-off job on Render: `npx knex migrate:latest` inside the `apps/backend` directory.

## 🔒 Security Posture & Known Limitations

- **Authentication**: Uses `bcrypt` for password hashing and stateless JWTs.
- **Data Integrity**: Uses ACID database transactions via Knex for multi-step workflows (e.g., Goods Receipt, Production Reservation).
- **Authorization**: Enforced at the middleware level (`requireRole`).
- **Limitation**: The system does not currently have a formal `finished_goods_inventory` ledger table as it was intentionally excluded from the original ERD scope to maintain MVP boundaries. Products are logged directly into `finished_goods_records`.
- **Limitation**: Error handling in the UI relies on native alerts for simplicity; a production system would use toast notifications.

*Built as an independent portfolio project demonstrating modern, restrained software engineering for enterprise domains.*
