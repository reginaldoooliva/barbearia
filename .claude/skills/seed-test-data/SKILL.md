---
name: seed-test-data
description: |
  Seeds baseline test data (an owner account, a client account, one barbeiro,
  one servico) into the barbershop app's backend via its REST API, so there is
  something to test/demo against right after a fresh `prisma migrate`.
  Trigger: "/seed-test-data", "semeia dados de teste", "popula o banco de teste".
user-invocable: true
---

# Seed Test Data

Populates the local backend (NestJS + Prisma/PostgreSQL) with a minimal, known
set of test data using the existing REST endpoints — no direct DB writes,
because password hashing and validation live in the API layer.

Only ever run this against a **local/dev** database (the `DATABASE_URL` in
`backend/.env`). Never against a shared or production database — this is a
convenience for local iteration, not a migration.

## Defaults (override if the user gives different values)

- Owner: `dono.teste@example.com` / `123456`
- Client: `teste.cliente@example.com` / `123456`
- Barbeiro: `Joao Barbeiro`
- Servico: `Corte Masculino`, `duracaoMin: 30`, `precoCentavos: 4000`

## Steps

1. **Confirm the backend is reachable** at `http://localhost:3000` (or the
   configured `PORT`). If not, start it per `CLAUDE.md`:
   `cd backend && npm run start:dev` (in the background — it's a long-running
   watch process) and wait for the Nest startup log before continuing.

2. **Register the owner.** `POST /auth/register` with
   `{ nome, email, senha, papel: "PROPRIETARIO" }`. If the response is a
   validation/conflict error because the email already exists, fall back to
   `POST /auth/login` with the same credentials to obtain a token instead —
   this makes the skill idempotent to re-run.

3. **Register the client** the same way, with `papel: "CLIENTE"`. Same
   idempotent fallback to login on conflict.

4. **Create the barbeiro**, using the owner's JWT as `Authorization: Bearer
   <token>`: `POST /barbeiros { nome }`. If one with that name may already
   exist, it's fine to create a duplicate (there's no uniqueness constraint
   on `Barbeiro.nome`) — just reuse the id from the response for the summary.

5. **Create the servico**, same owner token: `POST /services-catalog
   { nome, duracaoMin, precoCentavos }`.

6. **Report a compact summary** to the user: the two accounts (email/senha),
   and the created `barbeiroId` / `servicoId` — these are exactly the IDs
   `booking-smoke-test` and `concurrency-race-check` need, and what you'd
   paste into `frontend/app/(client)/choose-barber-service.tsx` testing or a
   manual `POST /appointments` call.

## Notes

- All of this exists only because there is currently no seed script or admin
  UI for barbers/services in the project — this skill is the fast path until
  one exists.
- Do not create a fresh JWT secret or touch `backend/.env` — this skill only
  calls the running API.
