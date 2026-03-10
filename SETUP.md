# Stars Law College - Development Setup Guide

## 🎯 Quick Answer to Your Questions

### Q1: Where should .env file be?

**Answer:** Keep ONE `.env` file in `/slc` (root directory). The system automatically syncs it to subdirectories.

### Q2: Should I run Prisma commands from /slc or /slc/apps/api?

**Answer:** Run from `/slc/apps/api` but the `.env` file is now synced there automatically.

---

## 📁 .env File Management

### Current Setup (FIXED):

```
/slc/.env                    ← MAIN FILE (edit this one)
/slc/apps/api/.env          ← Auto-synced (don't edit)
/slc/apps/web/.env.local    ← Auto-synced (don't edit)
```

### How It Works:

- `npm run dev` automatically runs `npm run sync:env` first
- This copies `/slc/.env` to both subdirectories
- If you manually edit `.env`, run: `npm run sync:env`

---

## 🚀 Complete Setup (From Scratch)

```bash
# 1. Navigate to project
cd /slc

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# 4. Start infrastructure (PostgreSQL, Redis, MinIO)
npm run dev:infra

# 5. Wait 5 seconds, then setup database
cd apps/api
npx prisma db push --schema=../../prisma/schema.prisma
npx tsx ../../prisma/seed.ts
cd ../..

# 6. Start development servers
npm run dev
```

---

## 🛠️ Prisma Commands Reference

### From `/slc/apps/api`:

```bash
# Generate Prisma Client
npx prisma generate --schema=../../prisma/schema.prisma

# Push schema to DB (development)
npx prisma db push --schema=../../prisma/schema.prisma

# Create migration
npx prisma migrate dev --name <name> --schema=../../prisma/schema.prisma

# Apply migrations (production)
npx prisma migrate deploy --schema=../../prisma/schema.prisma

# Open Prisma Studio
npx prisma studio --schema=../../prisma/schema.prisma

# Seed database
# npx tsx ../../prisma/seed.ts
```

### Why --schema flag?

Because `schema.prisma` is in `/slc/prisma/` not `/slc/apps/api/prisma/`

---

## 📝 Available NPM Scripts

### From `/slc` (root):

| Command              | What It Does                           |
| -------------------- | -------------------------------------- |
| `npm run dev`        | Start API + Frontend (auto-syncs .env) |
| `npm run dev:infra`  | Start PostgreSQL, Redis, MinIO only    |
| `npm run sync:env`   | Manually sync .env to subdirectories   |
| `npm run stop:infra` | Stop infrastructure containers         |
| `npm run build`      | Build API + Frontend for production    |
| `npm run test`       | Run API tests                          |
| `npm run lint`       | Lint API + Frontend                    |

---

## 🔧 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Solution:** Run `npm run sync:env` to copy .env to subdirectories

### Error: "Can't reach database server at localhost:5432"

**Solution:** Run `npm run dev:infra` to start PostgreSQL

### Frontend can't connect to API

**Check:**

1. API is running on http://localhost:3001
2. `.env` has `NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1`
3. Run `npm run sync:env` to update web/.env.local

---

## ✅ Your Current Status

✅ Infrastructure running (PostgreSQL, Redis, MinIO)
✅ Database schema created
✅ Killed tasks on port 3000 and 3001
✅ .env sync system configured
✅ Ready to develop!

**Next:** Run `npm run dev` and open http://localhost:3000
