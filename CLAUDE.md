# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Thai-language complaint reporting system (ระบบแจ้งเหตุ อบต) for a Subdistrict Administrative Organization. Citizens report issues via a public portal; staff manage complaints through an admin back-office.

## Commands

```bash
npm run dev          # Start dev server (default Next.js port)
npm run dev:debug    # Dev server on port 3003
npm run build        # prisma generate && next build
npm run lint         # next lint
npx prisma db push   # Sync schema to SQLite (no migrations)
npx prisma generate  # Regenerate Prisma client
node create-admin.js # Create an admin user
node seed-complaints.js # Seed sample complaint data
```

No test framework is configured.

## Architecture

### Two-App Structure (single Next.js instance)

- **Public Portal** (`/portal/*`) — citizen-facing pages: home, news, complaint form, tracking, FAQ
- **Admin Back-office** (`/admin/*`) — staff/admin pages: dashboard, complaint management, news CRUD, user management, audit log

### Layout Pattern

Server component layouts delegate to client component wrappers:
- `src/app/portal/layout.tsx` → `PortalLayoutClient.tsx`
- `src/app/admin/layout.tsx` → `AdminLayoutClient.tsx`

This pattern separates metadata (server) from interactive UI (client).

### API Routes (`src/app/api/`)

- `auth/login`, `auth/logout` — JWT-based auth
- `complaints`, `complaints/[id]`, `complaints/public` — complaint CRUD
- `admin/complaints/[id]` — admin-specific complaint actions
- `news`, `news/[id]` — news CRUD
- `users`, `users/[id]` — user management
- `upload` — file uploads
- `audit` — audit log queries

Auth middleware: `src/lib/apiAuth.ts` — `requireAuth()` verifies JWT from `auth-token` cookie. Admin-only endpoints additionally check `user.role === 'ADMIN'`.

### Database

SQLite via Prisma (`prisma/schema.prisma`). Four models: `User`, `Complaint`, `News`, `AuditLog`. Uses `prisma db push` (no migration files — migrations are gitignored).

Prisma client singleton: `src/lib/prisma.ts` (prevents hot-reload connection leaks).

### Auth Flow

JWT stored in httpOnly cookie (`auth-token`, 24h TTL). Login tries database first, falls back to a hardcoded mock admin (`admin@codemonday.go.th` / `admin123`). Roles: `ADMIN` (full access) and `STAFF` (no user management).

### Key Libraries

- `src/lib/auth.ts` — JWT sign/verify
- `src/lib/apiAuth.ts` — route protection middleware
- `src/lib/validation.ts` — Zod schemas for form validation
- `src/lib/thai-pdf-generator.ts` — Thai-language PDF generation for complaint reports
- `src/lib/excel-generator.ts` — Excel export
- `src/lib/rateLimit.ts` — rate limiting
- `src/lib/dateFormat.ts` — Thai date formatting utilities
- `src/lib/mockDatabase.ts` — fallback mock data when DB is unavailable

### Path Alias

`@/*` → `./src/*` (configured in tsconfig.json)

### UI

Tailwind CSS with a custom `primary` color scale (blue). Reusable UI components in `src/components/ui/`. Map integration uses Leaflet (`react-leaflet`) with optional heatmap layer.
