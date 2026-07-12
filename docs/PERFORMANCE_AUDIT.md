# BookingBase Performance, Security, And Production Audit

Generated: 2026-07-11

## 1. Executive Summary

The project already has a solid base: range-based calendar APIs, pessimistic resource locks, after-commit notification events, STOMP authentication, notification pagination, Web Push subscription storage, and a working frontend/backend build baseline.

The main direction to improve capability is not a large rewrite. The first improvements should harden the trust boundary and production config, then reduce all remaining all-bookings flows, then add DB indexes/migrations and focused frontend code splitting.

Highest priority:
1. Stop trusting client-sent `requesterId`, `approverId`, `cancellerId`, and dashboard `userId`.
2. Remove real-looking secrets/default passwords from committed config and add `.env.example`.
3. Add backend authorization checks for approval/dashboard/admin-like flows.
4. Replace remaining all-booking reads in admin approvals and detail pages.
5. Add production migrations and booking overlap indexes.
6. Add frontend route code splitting to reduce the initial JS chunk.

## 2. Baseline

Commands run:

| Command | Result |
|---|---|
| `npm run build` | Failed in PowerShell because `npm.ps1` is blocked by execution policy. |
| `npm.cmd run build` | PASS |
| `npm run lint` | Failed in PowerShell because `npm.ps1` is blocked by execution policy. |
| `npm.cmd run lint` | PASS with warnings |
| `.\mvnw.cmd test` | First run failed due sandboxed network access to Maven Central. |
| `.\mvnw.cmd test` with approved network | PASS |

Frontend build output:

| Metric | Value |
|---|---:|
| Main CSS | 56.84 kB minified, 10.56 kB gzip |
| Main JS | 738.44 kB minified, 214.67 kB gzip |
| Workbox asset | 5.65 kB minified, 2.20 kB gzip |
| Service worker | 18.16 kB minified, 6.23 kB gzip |
| PWA precache | 30 entries, 1806.35 KiB |
| Build warning | Main chunk is larger than 500 kB |

Lint:
- PASS with 5 warnings:
  - `CustomDateHeader.jsx`: unused `label`.
  - `BookingDetail.jsx`: unused imports `CheckCircle2`, `XCircle`, `Send`.
  - `BookingDetail.jsx`: unused variable `isAdmin`.

Backend tests:
- PASS: 9 tests, 0 failures, 0 errors.
- Residual warning: Mockito dynamic Java agent warning on current JDK.

## 3. Code Status Versus Design/Audit Docs

| Topic | Status | Evidence |
|---|---|---|
| Google login | IMPLEMENTED | `AuthService.authenticateWithGoogle`. |
| Email/password + OTP auth | IMPLEMENTED | Current code supports login/register/forgot password via OTP. |
| Google-only auth from design | OUTDATED DOC | Actual auth has email/password/OTP too. |
| Single role model | IMPLEMENTED | `User.role` is a single `RoleEnum`. |
| Multi-role/scope permission | OUTDATED DOC/PARTIAL | Not implemented in current entity/model. |
| Calendar range API | IMPLEMENTED | Room/car controllers accept `start/end`; repositories query interval intersection. |
| Calendar fetch by visible range | IMPLEMENTED | `RoomBooking.jsx`, `CarBooking.jsx`. |
| Calendar stale request guard | NOT FOUND | No abort/request id guard. |
| Route lazy loading | NOT FOUND | `App.jsx` imports pages synchronously. |
| Notification after commit | IMPLEMENTED | `NotificationEventListener` uses `@TransactionalEventListener(AFTER_COMMIT)`. |
| WebSocket auth | IMPLEMENTED | STOMP CONNECT validates JWT. |
| Push invalid subscription cleanup | IMPLEMENTED | 403/404/410 deactivate subscription. |
| Push retry/backoff | NOT FOUND | No retry for network/5xx. |
| Booking overlap indexes | NOT FOUND | No entity index or migration found for booking room/car overlap. |
| Notification indexes/unique | IMPLEMENTED | `Notification` has indexes and unique constraint. |
| Push endpoint unique | IMPLEMENTED | `PushSubscription` has unique endpoint constraint. |
| Production migration | NOT FOUND | `ddl-auto: update`; no Flyway/Liquibase files. |
| Scheduler reminders/completed | NOT FOUND | No scheduling annotations found. |
| Docker backend/frontend | NOT FOUND | Compose only has DB/Redis/Adminer. |
| `.env.example` | NOT FOUND | Not present in repo scan. |

## 4. Things The Project Is Doing Well

- Calendar room/car flow no longer loads all bookings for the main calendar path.
- Overlap logic uses the correct interval formula.
- Room and vehicle creation flow locks the resource row before overlap check.
- Notification, email, and push are triggered after transaction commit.
- WebSocket CONNECT requires a valid JWT.
- Notification APIs use pagination and cap page size in the controller.
- Notification and push subscription entities already include useful indexes/constraints.
- Service worker avoids showing OS notification when a focused app client exists.
- Frontend and backend baseline commands currently pass.

## 5. P0/P1 Backlog

| ID | Priority | Status | Layer | Van de | Bang chung tu code | File va method/component | Tac dong | Giai phap de xuat | Rui ro | Cach test | Rollback | Ket qua mong doi | Phase | Dependency |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| BB-P0-01 | P0 | VERIFIED | Security/Booking | Client can choose requester. | `request.getRequesterId()` is used in both booking services; create pages send `requesterId`. | `BookingRoomService.createBooking`, `BookingCarService.createBooking`, `CreateRoomBooking.jsx`, `CreateCarBooking.jsx` | User can create booking as another user if they know ID. | Controller takes `@AuthenticationPrincipal User`; service receives trusted requester or requesterId from principal; ignore body requesterId. | API contract changes if DTO validation still requires requesterId. | Login user A, post requesterId=user B; booking must belong to A or be rejected. | Temporarily keep field but ignore it server-side. | Requester identity is always from JWT. | Phase 1 | Auth principal available from JWT. |
| BB-P0-02 | P0 | VERIFIED | Security/Approval | Client can choose approver and backend lacks role check. | `ApprovalRequest.approverId`; `ApprovalService` loads approver by request body; controller has no principal. | `ApprovalController`, `ApprovalService`, `BookingDetail.jsx` | Non-approver can approve/reject by posting another approver ID. | Use `@AuthenticationPrincipal`; require ADMIN/MANAGER or scope; remove/trust-ignore body approverId; map `note` to `reason`. | Could block existing UI if role checks are too broad. | Employee token calls approve endpoint and must get 403. Admin/manager succeeds. Reject reason persists. | Feature flag old endpoint only for emergency, but keep server principal enforced. | Approval action is authenticated and authorized. | Phase 1 | Role/scope decision. |
| BB-P0-03 | P0 | VERIFIED | Security/Cancel | Client can choose canceller. | `CancelRequest.cancellerId`; services use request body. | `BookingRoomService.cancelBooking`, `BookingCarService.cancelBooking` | User can cancel as another user. | Use authenticated principal; enforce requester/admin/manager scope. | Need define who can cancel which booking. | User A attempts cancel user B booking; expect 403. Requester/admin valid path succeeds. | Keep body reason only; ignore body cancellerId. | Cancel audit identity is trusted. | Phase 1 | Permission policy. |
| BB-P0-04 | P0 | VERIFIED | Security/Dashboard | Dashboard user/admin access is not principal-bound. | `DashboardController.getAdminStats()` has no principal; `getClientStats(userId)` trusts path. | `DashboardController`, `DashboardService`, `dashboardApi.js` | Employee can request admin stats or another user's upcoming bookings if authenticated. | Add principal; require ADMIN for `/admin`; use current user id for client stats or validate admin override. | Frontend URL changes if client endpoint no longer accepts userId. | Employee `/dashboard/admin` -> 403; user A `/dashboard/client/B` -> 403 or ignored. | Add new `/dashboard/me` while keeping old path admin-only. | Dashboard data follows auth scope. | Phase 1 | Auth principal. |
| BB-P0-05 | P0 | VERIFIED | Config/Secrets | Real-looking secrets are committed as defaults. | `application.yml` includes DB password, SMTP app password, VAPID private key, JWT secret, Google client id. | `backend/src/main/resources/application.yml`, `docker-compose.yml` | Secret leakage and unsafe production defaults. | Remove sensitive defaults; require env vars; create `.env.example` with placeholders; rotate exposed secrets. | Deploy can fail if env not populated. | Start with missing env should fail fast or warn; no real secret appears in repo. | Restore from env backup; do not restore leaked values. | No committed production secret. | Phase 1 | Secret rotation. |
| BB-P0-06 | P0 | VERIFIED | Database/Production | Production schema depends on Hibernate update. | `spring.jpa.hibernate.ddl-auto: update`; no migration files found. | `application.yml`, `backend/src/main/resources` | Uncontrolled schema drift; indexes may not exist reliably. | Add Flyway or Liquibase migrations; set production `ddl-auto=validate`. | Migration ordering must match current DB. | Fresh DB migration + existing DB dry run; app starts with validate. | Revert migration in staging only; DB backup before prod. | Repeatable production schema. | Phase 3 | DB backup and current schema dump. |
| BB-P1-01 | P1 | VERIFIED | Frontend/Bundle | Initial JS bundle is large and routes are not lazy-loaded. | Build main JS 738.44 kB minified; no `React.lazy`/`Suspense` found. | `App.jsx` | Slower initial load, especially mobile/low-end devices. | Add route-level lazy imports for admin/calendar/profile pages; keep login shell light. | Lazy loading can break route guards if fallback poorly placed. | `npm.cmd run build`; compare main chunk and route chunks; smoke routes. | Revert App route import changes. | Smaller initial JS and separate route chunks. | Phase 2 | None. |
| BB-P1-02 | P1 | VERIFIED | Frontend/API | Admin approvals and booking detail still load all bookings. | `AdminApprovals.jsx` calls `getRoomBookings()`/`getCarBookings()` without params; `BookingDetail.jsx` does the same. | `AdminApprovals.jsx`, `BookingDetail.jsx`, booking controllers `getAllBookings()` | Large data sets slow admin pages and expose broader data surface. | Add `GET /approvals/pending?page&size` and `GET /bookings/{type}/{id}` DTO endpoints; frontend uses them. | New endpoint design must preserve room/car detail routing. | Seed many bookings; admin page should request only pending/page/detail. | Keep old list endpoint while switching UI. | Admin pages scale with data. | Phase 2/3 | DTOs and permission checks. |
| BB-P1-03 | P1 | VERIFIED | Frontend/BookingCar | Car title is sent but not stored or returned. | `CreateCarBooking.jsx` sends `title`; `BookingCarRequest` and `BookingCar` have no title; calendar maps `b.title`. | `CreateCarBooking.jsx`, `BookingCarRequest`, `BookingCar`, `CarBooking.jsx` | Car calendar/detail title can be blank/undefined. | Either add `purpose/title` to car DTO/entity/migration or derive title consistently from departure/destination. | DB migration if adding column. | Create car booking; calendar/detail show intended purpose. | Derive title client-side as fallback. | Car booking displays meaningful title. | Phase 2/3 | Product decision on title vs purpose. |
| BB-P1-04 | P1 | NOT FOUND | Database | Booking overlap query lacks composite indexes. | Booking entities have no index declarations; no migration files. | `BookingRoom`, `BookingCar`, repositories | Overlap checks can scan as data grows. | Add indexes: `booking_rooms(room_id,status,start_time,end_time)` and `booking_cars(vehicle_id,status,start_time,end_time)` in migration. | Index creation can lock large tables. | Use `EXPLAIN`; compare overlap query plan before/after. | Drop indexes using migration rollback if needed. | Stable overlap query latency. | Phase 3 | Migration framework. |
| BB-P1-05 | P1 | VERIFIED | Config/Timezone | Backend JDBC uses UTC while business UI uses local `LocalDateTime`. | JDBC URL has `serverTimezone=UTC`; frontend parses local datetime; entities use `LocalDateTime`. | `application.yml`, `dateTime.js`, booking entities | Booking can appear shifted across DB/container/browser contexts. | Align DB/backend/container timezone or move to `Instant/OffsetDateTime` with clear display conversion. | Time migration can corrupt historical display if rushed. | Test booking near midnight and after restart across desktop/mobile. | Keep current storage and only align container/JDBC first. | Consistent Vietnam-time display. | Phase 1/3 | Timezone policy. |
| BB-P1-06 | P1 | VERIFIED | Notification/Push | Push has cleanup but no retry/backoff or bounded executor. | `PushService` logs failures; no retry; `@Async` default executor. | `PushService`, `NotificationEventListener`, app async config | Temporary push provider/network issues lose push; async work can grow uncontrolled. | Add bounded task executor; retry limited for 5xx/network; never retry 403/404/410. | Bad retry can spam or block. | Mock 201/410/500/network; assert behavior. | Disable retry config. | Push is more reliable without blocking booking. | Phase 4 | Test doubles for Web Push. |
| BB-P1-07 | P1 | VERIFIED | Email/Config | Email links are hard-coded to production domain. | `EmailService` contains `https://cfcbooking.io.vn/...`. | `EmailService` | Local/staging links are wrong; domain change requires code change. | Add `app.frontend-url`; build all email links from config. | Missing env causes bad links. | Send test emails in local/staging/prod. | Default to configured production only in env, not code secret. | Email links match environment. | Phase 4 | Env config. |
| BB-P1-08 | P1 | NOT FOUND | Docker/Deploy | Compose lacks app services and healthchecks. | Compose only defines DB, Redis, Adminer; no backend/frontend; no healthcheck/resource limits. | `docker-compose.yml`, `cloudflared-config.yml` | Production runbook is incomplete; app restart/health not controlled. | Add backend/frontend service or separate production compose; healthchecks; restart; resource limits; env file. | Changes can disrupt current manual tunnel workflow. | `docker compose up -d`; restart; DB persists; health OK. | Keep dev compose and add `docker-compose.prod.yml`. | Repeatable deploy. | Phase 6 | Dockerfile/nginx decisions. |

## 6. P2/P3 Findings

| ID | Priority | Status | Layer | Finding | Suggested Direction | Phase |
|---|---|---|---|---|---|---|
| BB-P2-01 | P2 | NOT FOUND | Frontend | Calendar pages lack AbortController/stale response guard. | Add request id or AbortController when date/view changes. | Phase 2 |
| BB-P2-02 | P2 | NOT FOUND | Frontend | `filteredEvents` is recomputed every render. | Use `useMemo` for mapped/filtered events and stable callbacks. | Phase 2 |
| BB-P2-03 | P2 | PARTIAL | Frontend | Resource filter is client-side. | Pass `roomId`/`vehicleId` to range API when selected. | Phase 2 |
| BB-P2-04 | P2 | PARTIAL | Notification | Notification provider callbacks are memoized, but provider value object is not. | Wrap context value in `useMemo`; split unread count if needed. | Phase 4 |
| BB-P2-05 | P2 | PARTIAL | PWA | Service-worker `NAVIGATE` listener is in `DashboardLayout`, not globally. | Move listener near router entry so it works even from login/non-dashboard screens. | Phase 5 |
| BB-P2-06 | P2 | NOT FOUND | PWA | No explicit offline fallback route/page. | Add safe offline navigation fallback without caching dynamic booking API. | Phase 5 |
| BB-P2-07 | P2 | NOT FOUND | Scheduler | Reminder/completed scheduler from docs is not implemented. | Add scheduled jobs only after query/index strategy is ready. | Phase 7 |
| BB-P3-01 | P3 | OUTDATED DOC | Product | Design describes audit log, reports, global search, recurring booking. | Keep in future backlog; do not mix with performance hardening. | Later |

## 7. Roadmap Phase 0 To Phase 7

Phase 0 - Baseline and context:
- Completed in this audit: docs read, repo mapped, build/lint/test run, context docs created.

Phase 1 - Production blockers and security:
- Fix requester/approver/canceller/dashboard principal trust.
- Enforce backend role/scope for approval/admin endpoints.
- Remove committed secrets and add `.env.example`.
- Align timezone config.

Phase 2 - Calendar and frontend performance:
- Add route lazy loading.
- Add stale request guard.
- Memoize calendar event filtering.
- Pass resource ID to range API.
- Replace all-bookings admin/detail flows.

Phase 3 - Backend and database:
- Add migration framework.
- Add booking overlap indexes.
- Add DTO/detail/pending endpoints with pagination.
- Verify SQL with `EXPLAIN`.
- Add concurrency tests.

Phase 4 - Notification, email, push:
- Configure frontend URL for email links.
- Add bounded async executor.
- Add limited push retry/backoff.
- Treat notification unique conflict as idempotent.
- Reduce notification context re-render.

Phase 5 - PWA Android/iOS:
- Move SW navigate listener to global router layer.
- Add offline fallback that does not cache dynamic booking APIs.
- Test Android closed-app push and iOS installed PWA.
- Verify safe-area CSS.

Phase 6 - Docker/deploy hardening:
- Add production compose or app services.
- Add healthchecks, restart policy, env file, resource limits.
- Add SPA fallback if using Nginx/static server.
- Normalize Cloudflare tunnel docs and remove local credential path.
- Add backup/restore runbook.

Phase 7 - Tests, monitoring, logging:
- Add security tests for requester/approver/dashboard.
- Add overlap concurrency integration tests.
- Add push/mail failure tests.
- Add frontend calendar large-data smoke test.
- Add structured logging without secrets.

## 8. Files Affected By Phase

| Phase | Likely files |
|---|---|
| Phase 1 | `BookingRoomController.java`, `BookingCarController.java`, `BookingRoomService.java`, `BookingCarService.java`, `ApprovalController.java`, `ApprovalService.java`, `DashboardController.java`, `application.yml`, new `.env.example` |
| Phase 2 | `App.jsx`, `RoomBooking.jsx`, `CarBooking.jsx`, `AdminApprovals.jsx`, `BookingDetail.jsx`, `bookingApi.js` |
| Phase 3 | booking entities, repositories, new migration files, new DTOs/controllers/services/tests |
| Phase 4 | `EmailService.java`, `NotificationEventListener.java`, `PushService.java`, async config, `NotificationContext.jsx` |
| Phase 5 | `main.jsx`, `DashboardLayout.jsx`, `sw.js`, `vite.config.js`, global CSS |
| Phase 6 | `docker-compose.yml`, new production compose, Dockerfile/nginx config if chosen, `cloudflared-config.yml`, deploy docs |
| Phase 7 | backend tests, frontend tests/build scripts, logging config |

## 9. Test Matrix

Security:
- Protected API without token returns 401.
- Employee calling admin API returns 403.
- User A cannot create booking as User B.
- Employee cannot approve/reject by sending admin `approverId`.
- User A cannot cancel User B booking unless policy allows.
- User A cannot fetch User B dashboard data.
- Secrets/tokens do not appear in logs.

Booking:
- Start time before end time succeeds.
- Start >= end fails.
- Non-overlap succeeds.
- Overlap fails.
- Concurrent overlap fails safely.
- Cancel updates status and notification correctly.
- Approval updates status and notification after commit.

Calendar:
- Month/week/day range loads correct boundary events.
- Rapid switching does not show stale response.
- Room/car filter reduces API data when possible.
- Large data set does not freeze UI.
- Mobile portrait/landscape works.
- Midnight/timezone boundary works.

Notification:
- Unread count is correct.
- Mark read and mark all read work.
- WebSocket disconnect/reconnect does not duplicate.
- Multi-tab does not create duplicate OS notifications.
- Unique notification source prevents duplicate DB rows.

Email/push:
- SMTP failure does not rollback booking.
- Email link matches configured environment.
- Push 2xx marks success.
- Push 403/404/410 deactivates subscription.
- Push 5xx/network retries only within limit.
- Android receives push when app is closed.
- iOS PWA receives push when installed and permitted.
- Click notification opens correct route.

Docker/deploy:
- Restart containers.
- DB data persists.
- Healthchecks pass.
- React route refresh does not 404.
- Cloudflare HTTPS works.
- CORS accepts configured domains and rejects unknown domains.
- Timezone in containers matches policy.
- Backup and restore documented and tested.

## 10. Baseline And Target Metrics

| Metric | Current | Target |
|---|---:|---:|
| Initial frontend JS | 738.44 kB minified / 214.67 kB gzip | Under 350 kB minified initial, or route chunks split |
| Initial CSS | 56.84 kB minified / 10.56 kB gzip | Keep under 80 kB minified |
| Largest route chunk | NOT MEASURED | Under 300 kB gzip unless justified |
| Calendar API response time | NOT MEASURED | p95 under 300 ms for visible range |
| Bookings returned per calendar request | NOT MEASURED | Only visible range + selected resource when applicable |
| SQL query count per calendar request | NOT MEASURED | Stable and documented |
| Overlap query time | NOT MEASURED | p95 under 50 ms with production-like data |
| Calendar render count | NOT MEASURED | No extra render on unrelated notification update |
| Layout render on realtime notification | NOT MEASURED | Only notification consumers update unless needed |
| Backend startup | NOT MEASURED | Under 30 s local/dev |
| Backend tests | 9 passed | Security/concurrency coverage added |
| Push failure rate | NOT MEASURED | Logged and monitored |
| Booking create time | NOT MEASURED | p95 under 500 ms excluding async notification |

How to measure later:
- Frontend: `npm.cmd run build`, browser Performance panel, React Profiler.
- Backend: integration tests, SQL logging in test only, actuator metrics, API smoke timings.
- DB: `EXPLAIN` for overlap, notification, dashboard, pending approval queries.

## 11. Risk And Rollback

- Security principal changes: keep DTO fields temporarily but ignore them server-side to preserve frontend compatibility.
- Migration/index changes: take DB backup, add indexes in off-peak window, verify with `EXPLAIN`.
- Lazy route changes: keep route names unchanged; rollback is reverting `App.jsx`.
- Push retry: make retry count configurable and disable by env if it misbehaves.
- Timezone changes: do not convert historical data until policy is tested; start with env/JDBC alignment.
- Docker changes: add production compose separately before replacing existing dev compose.

## 12. Read/Created/Commands

Files read or inspected:
- `docs/OPTIMIZATION_PHASES.md`
- `docs/rules.md`
- `docs/Thiet-ke-He-thong-Booking-Noi-bo.md`
- Key backend controllers/services/repositories/entities/config/tests under `backend/src`
- Key frontend routes/API/calendar/notification/PWA files under `frontend/src`
- `backend/pom.xml`
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/index.html`
- `docker-compose.yml`
- `cloudflared-config.yml`

Files created by this audit:
- `docs/AI_PROJECT_CONTEXT.md`
- `docs/PROJECT_FLOW.md`
- `docs/PERFORMANCE_AUDIT.md`
- `docs/OPTIMIZATION_EXECUTION_PLAN.md`
- `AGENTS.md`

Commands that passed:
- `npm.cmd run build`
- `npm.cmd run lint`
- `.\mvnw.cmd test`

Commands that failed before workaround/approval:
- `npm run build`: PowerShell execution policy blocked `npm.ps1`.
- `npm run lint`: PowerShell execution policy blocked `npm.ps1`.
- `.\mvnw.cmd test`: initial sandbox network denied Maven Central dependency download.

## 13. First Implementation Task

Start with BB-P0-01 + BB-P0-02 together:
- Add authenticated principal to booking and approval controllers.
- Make booking requester and approval approver server-derived.
- Keep old fields as ignored/backward-compatible for one phase.
- Add tests proving user spoofing is blocked.

CHUA CHINH SUA CODE NGHIEP VU
