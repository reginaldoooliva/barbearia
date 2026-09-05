---
name: concurrency-race-check
description: |
  Verifies the barbershop app's core correctness invariant — that the unique
  DB index on (barbeiroId, dataHoraInicio) prevents two clients from booking
  the same barber at the same time — by firing two truly simultaneous
  POST /appointments requests at the same slot and asserting exactly one
  succeeds.
  Trigger: "/concurrency-race-check", "testa a trava de concorrência",
  "testa condição de corrida do agendamento".
user-invocable: true
---

# Concurrency Race Check

This tests the single most important architectural guarantee in the
codebase (see `CLAUDE.md` → "Booking concurrency is a DB constraint, not app
logic"): `AppointmentsService.criarReserva` relies on the Postgres unique
index `@@unique([barbeiroId, dataHoraInicio])` and a caught `P2002` error to
turn a race into a clean `201` + `409` pair instead of a double-booking. Unit
tests against a mocked Prisma client cannot catch a regression here — only a
real concurrent hit against a real Postgres can. Run this after any change
to `appointments.service.ts`, `appointments.controller.ts`, or the
`Agendamento` model/migrations.

## Why not two sequential curl calls

Two `Bash` tool calls, even launched close together, are not guaranteed to
race at the HTTP layer — one may fully complete before the other's request
is even sent, which would make this test pass even with the protection
removed. The requests must be issued from the same process via
`Promise.all`, not from two separate shell invocations.

## Steps

1. **Confirm the backend is running** at `http://localhost:3000` (start it
   per `CLAUDE.md` if not: `cd backend && npm run start:dev`, background,
   wait for the startup log).

2. **Get a client JWT and the barbeiroId/servicoId to use.** If there's no
   known test data, run the `seed-test-data` skill first, or fetch existing
   ids via `GET /barbeiros` / `GET /services-catalog` and log in with
   `POST /auth/login` for a client account.

3. **Pick a `dataHoraInicio` that is not already booked** for that barbeiro
   — check `GET /appointments/disponibilidade?barbeiroId=<id>&data=<date>`
   and choose a timestamp not present in the returned occupied list (or just
   use a far-future date/time unlikely to have been used by other test
   runs, e.g. next year).

4. **Write a small throwaway Node script** (Node 18+ has global `fetch`) to
   a scratch/temp location and run it with `node <path>` — do not try to
   inline this as a one-line shell command, the string escaping across
   `curl`/PowerShell/bash is not worth it. The script must fire both
   requests via a single `Promise.all` so they're genuinely concurrent:

   ```js
   const BASE = 'http://localhost:3000';
   const TOKEN = process.argv[2];
   const barbeiroId = process.argv[3];
   const servicoId = process.argv[4];
   const dataHoraInicio = process.argv[5];

   const body = JSON.stringify({ barbeiroId, servicoId, dataHoraInicio });
   const opts = {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
     body,
   };

   Promise.all([
     fetch(`${BASE}/appointments`, opts).then((r) => r.json().then((j) => ({ status: r.status, j }))),
     fetch(`${BASE}/appointments`, opts).then((r) => r.json().then((j) => ({ status: r.status, j }))),
   ]).then(([a, b]) => {
     console.log(JSON.stringify({ a, b }, null, 2));
     const statuses = [a.status, b.status].sort();
     const pass = statuses[0] === 201 && statuses[1] === 409;
     console.log(pass ? 'PASS: exactly one 201 and one 409' : 'FAIL: expected [201, 409], got ' + JSON.stringify(statuses));
     process.exit(pass ? 0 : 1);
   });
   ```

   Run it as: `node race-check.js <clientJwt> <barbeiroId> <servicoId> <dataHoraInicio>`

5. **Assert the outcome**:
   - **Pass**: one response is `201` (the created `Agendamento`, status
     `RESERVADO`), the other is `409` with the message "Esse horário acabou
     de ser reservado por outro cliente".
   - **Fail / regression**: both `201` (double-booking — the protection is
     broken, likely because the unique index was dropped from the schema/a
     migration, or the `P2002` catch in `criarReserva` was changed/removed),
     both `409` (something else broke request handling), or any other
     combination.

6. **Report** pass/fail plainly, and if it fails, point directly at
   `backend/src/appointments/appointments.service.ts` (`criarReserva`) and
   `backend/prisma/schema.prisma` (the `slot_unico` index on `Agendamento`)
   as the first two places to check — do not start debugging elsewhere.

## Notes

- This leaves one real `RESERVADO` row in the database (the winning
  request). No cleanup needed — it will lazy-expire like any other
  unpaid reservation once `RESERVATION_HOLD_MINUTES` passes, per the
  reservation lifecycle described in `CLAUDE.md`.
- Only run this against a local/dev database.
