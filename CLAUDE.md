# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Barbershop scheduling app: NestJS + Prisma/PostgreSQL backend, Expo (React Native) frontend running on mobile and web from the same codebase. Two independent npm projects, no root package.json or workspace tooling — always `cd backend` or `cd frontend` first.

## Commands

### Backend (`backend/`)
```
npm install
cp .env.example .env        # fill DATABASE_URL, JWT_SECRET, MERCADOPAGO_ACCESS_TOKEN, BACKEND_URL
npx prisma migrate dev --name <name>   # or: npm run prisma:migrate
npm run prisma:generate
npm run start:dev           # nest start --watch, serves on $PORT (default 3000)
npm run build                # nest build
npm run start:prod           # node dist/main
```
No local Postgres? Quick throwaway container:
```
docker run -d --name barbershop-postgres -e POSTGRES_USER=barbershop -e POSTGRES_PASSWORD=barbershop -e POSTGRES_DB=barbershop -p 5432:5432 postgres:16-alpine
```
There is **no lint or test script** in `backend/package.json` and no test framework installed — don't assume `npm test` works.

### Frontend (`frontend/`)
```
npm install
npm run start     # expo start (Metro/Expo Dev Tools)
npm run web        # expo start --web
npm run android
npm run ios         # needs a Mac
```
Also has no lint/test scripts configured. `react` and `react-dom` must stay pinned to the same version (`18.2.0` for Expo SDK 51) — letting npm resolve `react-dom` independently produces an ERESOLVE peer conflict.

`src/services/api.ts` has a hardcoded `baseURL: 'http://localhost:3000'`. When testing on a physical device, change it to your machine's LAN IP — `localhost` won't reach the backend from the device.

## Architecture

### Booking concurrency is a DB constraint, not app logic
The core invariant of this app — two clients can never book the same barber at the same time — is enforced by the unique index `@@unique([barbeiroId, dataHoraInicio])` on `Agendamento` (`backend/prisma/schema.prisma`), not by a check-then-insert in code. `AppointmentsService.criarReserva` inserts optimistically and catches Prisma's `P2002` unique-violation error, converting it into a `409 ConflictException`. Any change to the booking flow must preserve this pattern — don't replace it with a pre-check, which would reintroduce the race condition.

### Reservation lifecycle
`Agendamento.status` moves `RESERVADO` → `CONFIRMADO` (on payment) or `CANCELADO` (expired/cancelled). A reservation holds the slot until `expiraEm` (`RESERVATION_HOLD_MINUTES` env var, default 10 min). Expiry is **lazy and narrow**: `criarReserva` calls `expirarReservasVencidas` which only flips stale `RESERVADO` rows for the *same barbeiro+timeslot* being requested, right before inserting. There is no cron/background job that sweeps orphaned expired reservations elsewhere in the table — this is a known gap.

### Payments (Mercado Pago Pix)
`PaymentsService` creates a Pix charge tied to one `Agendamento` (`Pagamento` is 1:1). The webhook (`POST /payments/webhook`, intentionally public/unauthenticated) confirms payment inside a `$transaction` that updates both `Pagamento` and `Agendamento` to `CONFIRMADO` atomically. Known gaps: no webhook signature verification, and the Pix charge's payer email is hardcoded rather than using the logged-in user's real email.

### Auth and role guards
JWT-based (`passport-jwt`). Role checks use `@Roles(Role.CLIENTE | Role.PROPRIETARIO)` + `RolesGuard`, which reads metadata via `Reflector` and allows the request through if no `@Roles()` is set on the handler (i.e. guards must be explicitly opted into role-restriction, not opted out).

### Backend module map
`PrismaModule` is `@Global()` — any module can inject `PrismaService` without importing it explicitly. Feature modules: `AuthModule`, `UsersModule`, `AppointmentsModule` (booking + availability + owner agenda), `PaymentsModule`, `ServicesCatalogModule`, `BarbeirosModule` — the latter two are simple public-read/owner-write catalogs (list is public, create requires `@Roles(Role.PROPRIETARIO)`), and are the data source the frontend's barber/service picker depends on.

### Frontend routing and structure
File-based routing via `expo-router`; route groups map to user flows: `(auth)` (login-client, login-owner — there is no register screen yet), `(client)` (home → choose-barber-service → schedule → payment, plus my-appointments), `(owner)` (dashboard, reads `GET /appointments/agenda`). `AuthContext` holds `papel` (role) in memory only — it does not restore the session on app relaunch.

**Web storage pitfall**: `expo-secure-store` has no real web implementation (its web module resolves to an empty object), so calling it directly on web throws before any network request fires. `src/services/storage.ts` wraps it — `localStorage` on `Platform.OS === 'web'`, `SecureStore` elsewhere — and both `api.ts` (token-injection interceptor) and `AuthContext.tsx` go through this wrapper, never through `expo-secure-store` directly. Keep any new persisted-token code going through `storage.ts`.

### Client booking flow specifics
`schedule.tsx` uses a fixed candidate slot list (`09:00`–`16:00`) and a hardcoded `DATA` constant rather than fetching from `GET /appointments/disponibilidade` or a date picker — there's an explicit `TODO` in `AppointmentsService.listarHorariosDisponiveis` about not yet cross-referencing barber business hours. `barbeiroId`/`servicoId` are passed into `schedule.tsx` via route params from `choose-barber-service.tsx`, which is the only place those IDs come from (they are not editable elsewhere).
