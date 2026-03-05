# Stars Law College — Finance & Student Management System

A professional-grade full-stack web application for managing student admissions, academic progression, fee collection, and financial reporting.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend API | NestJS + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL 15 |
| Frontend | Next.js 14 + Tailwind CSS |
| Queue / Cache | Redis + BullMQ |
| File Storage | MinIO (S3-compatible) |
| Containers | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## Quick Start (Docker — Recommended)

```bash
# 1. Clone and enter the repo
git clone <your-repo-url> slc-system
cd slc-system

# 2. Copy environment config
cp .env.example .env

# 3. Start all services
docker compose up -d

# 4. Run database migrations
docker compose exec api npx prisma migrate deploy

# 5. Seed sample data (optional)
docker compose exec api npm run db:seed
```

Services will be available at:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001/api/v1
- **MinIO Console**: http://localhost:9001 (user: slc_minio_access / slc_minio_secret)

---

## Local Development (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Setup

```bash
# Install dependencies (root — installs all workspaces)
npm install

# Set up environment
cp .env.example .env
# Edit .env with your local DB/Redis connection strings

# Apply Prisma schema to database
cd apps/api
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate

# Seed development data
npm run db:seed

# Start API (port 3001)
npm run dev

# In another terminal — start frontend (port 3000)
cd ../web
npm run dev
```

---

## Project Structure

```
slc-system/
├── apps/
│   ├── api/                   # NestJS Backend
│   │   ├── src/
│   │   │   ├── common/
│   │   │   │   ├── filters/   # Global exception filter
│   │   │   │   ├── interceptors/
│   │   │   │   ├── pagination/
│   │   │   │   ├── prisma/    # Prisma service + module
│   │   │   │   ├── storage/   # MinIO service
│   │   │   │   ├── tests/     # Unit tests
│   │   │   │   └── workers/   # BullMQ processors
│   │   │   ├── config/
│   │   │   ├── modules/
│   │   │   │   ├── departments/
│   │   │   │   ├── sessions/
│   │   │   │   ├── students/
│   │   │   │   ├── finance/   # Ledger + FIFO allocation
│   │   │   │   ├── payments/
│   │   │   │   ├── accounts/
│   │   │   │   ├── reports/
│   │   │   │   ├── import-export/
│   │   │   │   └── audit/
│   │   │   ├── app.module.ts
│   │   │   ├── main.ts
│   │   │   └── worker.ts     # Background worker entrypoint
│   │   ├── prisma/
│   │   │   └── seed.ts
│   │   ├── Dockerfile
│   │   └── Dockerfile.worker
│   └── web/                   # Next.js Frontend
│       └── src/
│           ├── app/           # Next.js App Router pages
│           ├── components/
│           │   ├── layout/    # Sidebar, TopBar
│           │   └── ...
│           └── lib/
│               └── api/       # Typed API client
├── prisma/
│   └── schema.prisma          # Complete data model
├── scripts/
│   └── init-db.sql            # PostgreSQL receipt sequence
├── .github/
│   └── workflows/ci.yml       # GitHub Actions CI/CD
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

All responses wrapped in `{ data: ..., meta?: ... }`.  
All errors return `{ statusCode, message, errors[], path, timestamp }`.

### Departments
```
GET    /departments
POST   /departments
GET    /departments/:id
PUT    /departments/:id
DELETE /departments/:id
GET    /departments/:id/fee-structures
POST   /departments/fee-structures
GET    /departments/:id/migration-preview
```

### Sessions
```
GET    /departments/:deptId/sessions
POST   /departments/:deptId/sessions
PUT    /sessions/:id
DELETE /sessions/:id
```

### Students
```
GET    /students?q=&department=&session=&status=&page=&limit=
POST   /students
GET    /students/:id
PUT    /students/:id
DELETE /students/:id
GET    /students/:id/finance
POST   /students/:id/finance
POST   /students/:id/promote
```

### Payments
```
GET    /payments?studentId=&accountId=&methodId=&dateFrom=&dateTo=
POST   /payments
GET    /payments/:id
GET    /payments/:id/receipt
```

### Accounts
```
GET    /payment-methods
POST   /payment-methods
GET    /accounts
POST   /accounts
PUT    /accounts/:id
GET    /accounts/:id/ledger?from=&to=
```

### Reports
```
GET    /reports/dashboard
GET    /reports/outstanding?department=&session=
GET    /reports/outstanding/export   (CSV download)
GET    /reports/daily-receipts?date=
GET    /reports/daily-receipts/export?date=
GET    /reports/student-ledger?studentId=
GET    /reports/advance-summary?department=
```

### Import / Export
```
POST   /import/students?dryRun=true|false   (multipart file upload)
POST   /import/payments?dryRun=true|false
GET    /export/students?department=
GET    /export/payments?from=&to=
GET    /templates/students
GET    /templates/payments
```

---

## Running Tests

```bash
cd apps/api

# All tests
npm test

# With coverage
npm run test:cov

# Watch mode
npm run test:watch
```

---

## Database Management

```bash
cd apps/api

# Create a new migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (GUI)
npm run db:studio

# Reset + reseed (development only)
npx prisma migrate reset
npm run db:seed
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_URL` | Redis connection string | — |
| `MINIO_ENDPOINT` | MinIO host | localhost |
| `MINIO_PORT` | MinIO port | 9000 |
| `MINIO_ACCESS_KEY` | MinIO access key | — |
| `MINIO_SECRET_KEY` | MinIO secret key | — |
| `RECEIPT_PREFIX` | Receipt number prefix | SLC |
| `CURRENCY_SYMBOL` | Display currency | PKR |
| `NEXT_PUBLIC_API_URL` | Frontend API URL | http://localhost:3001/api/v1 |

---

## Business Rules Summary

- **Finance formula**: `remaining = feeDue - feePaid - advanceTaken`
- **Payment allocation**: FIFO by default (oldest outstanding term first); manual override supported
- **Promotion**: validates `currentSemester + 1 ≤ totalSemesters`; snapshots existing finance records; carries forward unpaid balance into new term; resets advance to 0
- **Receipt numbers**: format `SLC-YYYY-XXXXX`; generated from PostgreSQL sequence (atomic, race-condition-safe)
- **CNIC**: stored as 13 digits only (dashes stripped on input)
- **Immutable ledger**: finance records are never mutated after creation; promotions create new records
- **Audit log**: all create/update/delete/promote/payment/import operations logged with before/after snapshots
