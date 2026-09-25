---
name: booking-smoke-test
description: |
  End-to-end smoke test of the barbershop app's two main flows — client
  booking (login → choose barber/service → schedule, confirmed immediately
  since payment happens in person at the shop) and owner agenda (login →
  dashboard) — driven through a real browser against the locally running
  backend and frontend.
  Trigger: "/booking-smoke-test", "testa o fluxo de agendamento", "roda o smoke test".
user-invocable: true
---

# Booking Smoke Test

Walks the app the same way a person would, using the Playwright browser
tools, and reports which steps passed or failed. This is the regression
check for the booking flow — run it after touching anything under
`backend/src/appointments`, `backend/src/barbeiros`,
`backend/src/services-catalog`, `frontend/app/(client)/`, or
`frontend/app/(owner)/`.

## Prerequisites

1. **Backend running** at `http://localhost:3000`. If not, start it:
   `cd backend && npm run start:dev` (background, watch mode — wait for the
   "Nest application successfully started" log).
2. **Frontend running**, typically `http://localhost:8081`. If not, start it:
   `cd frontend && npm run web` (background — wait for the Metro bundler
   ready log, then confirm with a quick navigate before proceeding).
3. **Test data exists** — a barbeiro, a servico, and a client + owner
   account. If unsure, run the `seed-test-data` skill first, or check via
   `GET /barbeiros` and `GET /services-catalog`.

## Steps (use the Playwright MCP tools — navigate, snapshot, click, type/fill_form)

1. Navigate to `http://localhost:8081/login-client`. Fill email/senha with
   the client test account, click "Entrar". **Expect**: redirect to `/home`
   with no console errors. (If it lands back on `/login-client` with
   "E-mail ou senha inválidos", check whether `frontend/src/services/storage.ts`
   still wraps every SecureStore call — a regression there breaks every API
   call on web silently, and is the most likely cause if login "just fails".)

2. Click "Agendar horário". **Expect**: navigation to
   `/choose-barber-service`, and at least one barbeiro and one servico
   listed (empty lists mean there's no seed data — stop and suggest running
   `seed-test-data`).

3. Select the first barbeiro and first servico, click "Continuar".
   **Expect**: navigation to `/schedule?barbeiroId=...&servicoId=...` with
   both query params populated (not empty/undefined).

4. Click any time slot. **Expect**: either
   - navigation to `/my-appointments` showing the new appointment with
     status "Confirmado" (booking succeeded — it confirms immediately,
     there is no payment step in the app), or
   - an inline error "Esse horário acabou de ser reservado por outro
     cliente" if that exact slot+date was already booked by a prior run —
     retry with a different slot in that case.

5. Navigate to `http://localhost:8081/login-owner`, log in with the owner
   test account. **Expect**: redirect to `/dashboard` with 0 console errors
   (the list can legitimately be empty if no appointment was booked for
   *today* — the booking flow above uses whatever fixed date is hardcoded in
   `schedule.tsx`, which usually is not today).

6. To actually verify the booked appointment landed correctly, call
   `GET /appointments/agenda?data=<the date used in schedule.tsx>` with the
   owner's JWT directly (curl) and confirm the created appointment appears
   with the right cliente/barbeiro/servico — the dashboard screen won't show
   it unless the date matches today.

## Reporting

End with a short pass/fail list, one line per step above — not a full
transcript. Call out anything that failed for a reason **not** already
documented as a known gap in `CLAUDE.md` (there is no date/business-hours
picker in `schedule.tsx` — it uses a fixed hardcoded date/slot list).
