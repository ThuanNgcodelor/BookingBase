# BookingBase Optimization Execution Plan

Generated: 2026-07-11

This plan breaks the optimization work into small reviewable tasks. Do not implement business-code changes without selecting a task and updating tests.

## Phase 0 - Baseline And Context

Status: IMPLEMENTED for this audit.

Tasks:

| Task | Files | Test | Rollback | Definition of Done |
|---|---|---|---|---|
| P0.0 Read source docs and repo | `docs/*`, backend/frontend/config | N/A | N/A | Source-of-truth map is documented. |
| P0.1 Run baseline commands | `frontend`, `backend` | `npm.cmd run build`, `npm.cmd run lint`, `mvnw.cmd test` | N/A | Results and metrics are recorded. |
| P0.2 Create AI context docs | docs listed in this plan | Review docs | Delete/restore docs if wrong | Future agents can understand flow without re-reading all code. |

## Phase 1 - Production Blockers And Security

Goal: protect identity, permissions, secrets, timezone, and production config before performance-only work.

### Task 1.1 - Trust requester from JWT

Files:
- `BookingRoomController.java`
- `BookingCarController.java`
- `BookingRoomService.java`
- `BookingCarService.java`
- `BookingRoomRequest.java`
- `BookingCarRequest.java`
- `CreateRoomBooking.jsx`
- `CreateCarBooking.jsx`
- backend tests

Plan:
- Add `@AuthenticationPrincipal User user` to create booking endpoints.
- Pass `user` or `user.getId()` into service as trusted requester.
- Keep `requesterId` in DTO temporarily for backward compatibility, but do not trust it.
- Later remove frontend-sent requesterId after compatibility window.

Tests:
- User A sends requesterId of User B; booking requester must be A or request fails.
- Valid room/car booking still succeeds.
- Overlap rejection still works.

Rollback:
- Revert controller/service signature changes only if tests reveal blocker.

Definition of Done:
- No booking create path uses client-sent requester identity.

### Task 1.2 - Trust approver/canceller from JWT

Files:
- `ApprovalController.java`
- `ApprovalService.java`
- `ApprovalRequest.java`
- `BookingRoomController.java`
- `BookingCarController.java`
- `BookingRoomService.java`
- `BookingCarService.java`
- `CancelRequest.java`
- `BookingDetail.jsx`
- tests

Plan:
- Add `@AuthenticationPrincipal User approver` to approval endpoints.
- Enforce role `ADMIN` or `MANAGER` before approve/reject.
- Use `reason`, not `note`, consistently.
- Add `@AuthenticationPrincipal User canceller` to cancel endpoints.
- Enforce requester/admin/manager cancel policy.

Tests:
- Employee cannot approve/reject.
- User cannot spoof another approver/canceller.
- Reject reason is persisted in `ApprovalStep`.
- Cancel permission follows policy.

Rollback:
- Keep old request DTO fields ignored to avoid frontend break while reverting UI payload changes.

Definition of Done:
- Approval and cancellation identity comes from Spring Security principal.

### Task 1.3 - Lock down dashboard and admin APIs

Files:
- `DashboardController.java`
- `DashboardService.java`
- `dashboardApi.js`
- `Dashboard.jsx`
- `AdminDashboard.jsx`
- `ClientDashboard.jsx`
- tests

Plan:
- Require `ADMIN` for `/dashboard/admin`.
- Replace `/dashboard/client/{userId}` usage with `/dashboard/me` or validate current user/admin.
- Review `users/approvers` exposure and return safe DTOs.

Tests:
- Employee calling admin dashboard returns 403.
- User A cannot fetch User B dashboard data.
- Admin dashboard still loads for admin.

Rollback:
- Keep old client path admin-only during transition.

Definition of Done:
- Dashboard data is scoped to authenticated user/role.

### Task 1.4 - Remove committed secrets and add env contract

Files:
- `backend/src/main/resources/application.yml`
- `docker-compose.yml`
- `.env.example`
- deploy docs

Plan:
- Remove real-looking defaults for DB, SMTP, VAPID, JWT, Google client ID.
- Add `.env.example` with placeholders only.
- Set production `show-sql=false`.
- Document required envs.
- Rotate leaked secrets outside the repo.

Tests:
- App starts with a complete local env.
- Missing required secret fails fast or logs a safe error.
- No real secret string remains in repo.

Rollback:
- Restore from secure local env, not from committed secrets.

Definition of Done:
- Repo contains no real production secret/default password.

### Task 1.5 - Timezone baseline

Files:
- `application.yml`
- `docker-compose.yml`
- `dateTime.js`
- tests/checklist

Plan:
- Pick policy: Vietnam local time for `LocalDateTime` or UTC with conversion.
- Short-term: align JDBC/backend/container/DB timezone.
- Long-term: evaluate `Instant`/`OffsetDateTime`.

Tests:
- Create booking near midnight.
- View on desktop/mobile.
- Restart container and verify time.

Rollback:
- Revert config-only timezone changes if display shifts.

Definition of Done:
- Time handling policy is documented and tested.

## Phase 2 - Calendar And Frontend Performance

Goal: reduce bundle, request volume, stale UI, and unnecessary renders.

### Task 2.1 - Route code splitting

Files:
- `frontend/src/App.jsx`

Plan:
- Use `React.lazy` and `Suspense` for heavy pages:
  - calendar pages
  - admin pages
  - profile/notification pages
- Keep login route lightweight.

Tests:
- `npm.cmd run build`
- Smoke test each route.
- Compare main JS chunk size.

Rollback:
- Revert `App.jsx` lazy import changes.

Definition of Done:
- Main JS is below target or heavy pages are split into route chunks.

### Task 2.2 - Calendar stale request guard

Files:
- `RoomBooking.jsx`
- `CarBooking.jsx`
- `bookingApi.js`

Plan:
- Add AbortController support or request sequence guard.
- Ignore stale responses when user changes date/view quickly.

Tests:
- Rapid month/week/day switching.
- Network throttling.
- No stale events appear after last navigation.

Rollback:
- Remove guard and restore simple fetch.

Definition of Done:
- Calendar state always reflects latest selected date/view.

### Task 2.3 - Memoize calendar event filtering and API resource filter

Files:
- `RoomBooking.jsx`
- `CarBooking.jsx`
- `BookingRoomController.java`
- `BookingCarController.java`

Plan:
- Use `useMemo` for `filteredEvents`.
- Pass `roomId` or `vehicleId` to API when selected.
- Keep no-resource behavior for all-resource calendar if needed.

Tests:
- Filter room/car.
- React Profiler render count.
- API request params include selected resource.

Rollback:
- Remove resource params and keep client filter.

Definition of Done:
- Less data fetched and fewer renders when filters change.

### Task 2.4 - Replace all-bookings admin/detail flows

Files:
- `AdminApprovals.jsx`
- `BookingDetail.jsx`
- `bookingApi.js`
- new backend endpoints/DTOs

Plan:
- Add pending approvals endpoint with pagination.
- Add booking detail endpoint by id/type or unified lookup.
- Return DTOs instead of raw entities.

Tests:
- Admin approvals list with large data set.
- Booking detail deep link.
- Unauthorized access checks.

Rollback:
- Keep old list endpoint available while UI switches.

Definition of Done:
- Admin/detail screens no longer call all-booking APIs.

## Phase 3 - Backend And Database

Goal: make query behavior explicit, indexed, and production-safe.

### Task 3.1 - Add migration framework

Files:
- `pom.xml`
- `src/main/resources/db/migration/*` or Liquibase equivalent
- `application.yml`

Plan:
- Choose Flyway or Liquibase.
- Create baseline migration for existing schema.
- Set production `ddl-auto=validate`.

Tests:
- Fresh DB migration.
- Existing DB dry run/staging migration.
- App starts with validate.

Rollback:
- DB backup before migration; rollback migration in staging first.

Definition of Done:
- Production schema no longer depends on Hibernate update.

### Task 3.2 - Add booking overlap indexes

Files:
- migration file
- optionally entity index annotations

Indexes:
- `booking_rooms(room_id, status, start_time, end_time)`
- `booking_cars(vehicle_id, status, start_time, end_time)`

Tests:
- `EXPLAIN` overlap queries.
- Insert production-like volume.
- Create overlap and non-overlap bookings.

Rollback:
- Drop indexes with rollback migration if harmful.

Definition of Done:
- Overlap query uses intended index and latency target is met.

### Task 3.3 - DTO/projection and pagination

Files:
- booking controllers/services/repositories
- DTO package

Plan:
- Avoid returning raw entities for booking list/detail.
- Add page/range endpoints where list size can grow.
- Use DTOs with only needed fields.

Tests:
- Serialization does not expose password or lazy proxy issues.
- Large list stays bounded.

Rollback:
- Keep legacy endpoint until frontend migration is done.

Definition of Done:
- Large user-facing flows use DTOs and bounded queries.

## Phase 4 - Notification, Email, Push

Goal: make async channels reliable without slowing booking transaction.

### Task 4.1 - Configurable email frontend URL

Files:
- `EmailService.java`
- `application.yml`
- `.env.example`

Plan:
- Add `app.frontend-url`.
- Build all links from config.

Tests:
- Local/staging/prod email links.
- Approve/reject/profile email paths.

Rollback:
- Revert to previous domain only if config breaks staging.

Definition of Done:
- No hard-coded frontend URL in email service.

### Task 4.2 - Bounded async executor

Files:
- new async config
- `BookingSystemApplication.java` if needed
- `NotificationEventListener.java`
- `EmailService.java`

Plan:
- Define named executor for async notification/email/push.
- Set pool size, queue capacity, rejection behavior.

Tests:
- Burst notifications.
- Booking transaction remains fast.
- Logs show rejected/queued tasks safely.

Rollback:
- Return to default executor temporarily.

Definition of Done:
- Async workload is bounded and observable.

### Task 4.3 - Push retry/backoff

Files:
- `PushService.java`
- tests

Plan:
- Retry only network/5xx with small limit/backoff.
- Do not retry 403/404/410.
- Keep 413 as no retry.

Tests:
- Mock 201/410/500/network.
- Ensure invalid subscriptions deactivate.

Rollback:
- Config flag disables retry.

Definition of Done:
- Temporary push errors are retried safely.

### Task 4.4 - Notification idempotency

Files:
- `NotificationService.java`
- `NotificationRepository.java`
- tests

Plan:
- Keep unique constraint.
- Treat duplicate-key on recipient/type/source as idempotent duplicate, not noisy failure.

Tests:
- Concurrent duplicate event creates one notification.

Rollback:
- Keep unique constraint and revert catch behavior.

Definition of Done:
- Duplicates are prevented cleanly.

## Phase 5 - PWA Android/iOS

Goal: reliable install, push, click, and offline behavior.

### Task 5.1 - Global service-worker navigate listener

Files:
- `main.jsx`
- `App.jsx` or small router helper
- `DashboardLayout.jsx`

Plan:
- Move `NAVIGATE` listener to a global component inside `BrowserRouter`.
- Keep protected route redirect behavior.

Tests:
- App open on dashboard, click push.
- App open on login, click push.
- App closed, click push.

Rollback:
- Restore listener in `DashboardLayout`.

Definition of Done:
- Notification click navigates from any app screen.

### Task 5.2 - Offline fallback without dynamic booking cache

Files:
- `sw.js`
- `vite.config.js`
- optional offline component

Plan:
- Add safe navigation fallback.
- Do not cache booking API responses.
- Display clear offline state.

Tests:
- Offline reload route.
- Offline create booking blocked/handled.
- Online reload refreshes data.

Rollback:
- Remove fallback route.

Definition of Done:
- Offline does not show stale booking data as current.

### Task 5.3 - Android/iOS checklist

Files:
- docs/checklist
- CSS if needed

Plan:
- Test Android install/push.
- Test iOS Add to Home Screen and installed PWA permission.
- Verify safe-area CSS.

Tests:
- Manual devices or browser device labs.

Rollback:
- CSS-only changes can be reverted if layout regresses.

Definition of Done:
- PWA checklist is signed off.

## Phase 6 - Docker/Deploy Hardening

Goal: repeatable production deployment.

### Task 6.1 - Production compose/app services

Files:
- `docker-compose.yml` or `docker-compose.prod.yml`
- backend Dockerfile
- frontend Dockerfile/nginx config if chosen

Plan:
- Add backend/frontend services.
- Add env file references.
- Add healthchecks and restart policies.
- Add resource limits for small VPS if applicable.

Tests:
- `docker compose up -d`
- Restart containers.
- DB persistence.
- Health endpoints.

Rollback:
- Keep current dev compose unchanged and introduce prod compose separately.

Definition of Done:
- Production can start from documented compose files.

### Task 6.2 - SPA fallback and Cloudflare

Files:
- `nginx.conf` or static server config
- `cloudflared-config.yml`
- deploy docs

Plan:
- Ensure React route refresh returns `index.html`.
- Remove local credential path from shared docs/config template.
- Verify ingress targets.

Tests:
- Refresh `/rooms`, `/cars`, `/admin/approvals/{id}`.
- Cloudflare HTTPS and CORS.

Rollback:
- Revert tunnel config to prior known-good copy.

Definition of Done:
- Deep links and push links do not 404.

## Phase 7 - Tests, Monitoring, Logging

Goal: prevent regressions and improve production diagnostics.

Tasks:
- Add service tests for requester spoofing.
- Add controller/security tests for approval/dashboard.
- Add integration/concurrency tests for overlap.
- Add notification duplicate test.
- Add push/mail failure tests.
- Add frontend smoke tests for calendar range and notification click if tooling exists.
- Add structured logs for notification source/type/user without secrets.
- Add health endpoint checks.

Definition of Done:
- Security and performance-sensitive behavior is covered by tests.
- Logs are useful and do not expose JWT, OTP, password, SMTP password, VAPID private key, DB password, or Authorization header.

## Recommended First PR

Title:
- `Phase 1: derive booking and approval identity from authenticated principal`

Scope:
- BB-P0-01 and BB-P0-02.
- Include tests.
- Do not touch UI design or unrelated profile flow.

Acceptance:
- `npm.cmd run build`
- `npm.cmd run lint`
- `.\mvnw.cmd test`
- Manual API spoof tests documented.
