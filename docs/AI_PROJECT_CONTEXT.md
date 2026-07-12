# BookingBase AI Project Context

Generated: 2026-07-11

This document is context for future AI agents. Code and configuration in the repository are the source of truth. Older design documents can describe intended behavior that is not implemented yet.

## Source Of Truth Order

1. Current code and config in this repository
2. Current database schema or migration files
3. `docs/OPTIMIZATION_PHASES.md`
4. `docs/rules.md`
5. `docs/Thiet-ke-He-thong-Booking-Noi-bo.md`

## System Goal

BookingBase is an internal booking system for meeting rooms and company cars. The actual repo implements authentication, booking, approval, dashboard, notification, WebSocket realtime, email, Web Push/PWA, profile update approval, and basic resource management.

## Actual Tech Stack

Frontend:
- React 19 + Vite 8
- React Router 7
- Axios
- `react-big-calendar`
- `date-fns`
- STOMP over SockJS
- `vite-plugin-pwa` with custom service worker at `frontend/src/sw.js`

Backend:
- Spring Boot 4.0.0, Java 21
- Spring Security + JWT
- Spring Data JPA
- MySQL
- Redis for refresh-token storage
- Java Mail
- WebSocket/STOMP
- Web Push/VAPID
- Async notification/email/push event handling

Infra/config:
- `docker-compose.yml` currently defines MySQL, Redis, and Adminer only.
- `cloudflared-config.yml` maps `api.cfcbooking.io.vn` to backend port 8080 and frontend domains to preview port 4173.
- No root `Dockerfile`, `nginx.conf`, or `.env.example` was found in the current repository scan.

## Folder Map

Backend:
- `backend/src/main/java/com/booking/system/controller`: REST controllers.
- `backend/src/main/java/com/booking/system/service`: business services.
- `backend/src/main/java/com/booking/system/repository`: JPA repositories.
- `backend/src/main/java/com/booking/system/entity`: JPA entities.
- `backend/src/main/java/com/booking/system/dto`: request/response DTOs.
- `backend/src/main/java/com/booking/system/event`: notification event and listener.
- `backend/src/main/java/com/booking/system/config`: security, CORS, WebSocket, Web Push, seed data.
- `backend/src/main/resources/application.yml`: runtime config.
- `backend/src/test/java/com/booking/system`: current tests.

Frontend:
- `frontend/src/App.jsx`: routes and route guards.
- `frontend/src/main.jsx`: app entry and PWA registration.
- `frontend/src/api`: Axios clients.
- `frontend/src/pages`: app screens.
- `frontend/src/layouts/DashboardLayout.jsx`: app shell, notification provider, service-worker message listener.
- `frontend/src/contexts/NotificationContext.jsx`: notification state and STOMP client.
- `frontend/src/hooks/usePushNotifications.js`: Web Push subscribe/unsubscribe.
- `frontend/src/sw.js`: custom service worker for push and notification click.
- `frontend/vite.config.js`: Vite and PWA manifest.

## Roles And Permission Model

Actual implementation:
- `RoleEnum`: `ADMIN`, `MANAGER`, `EMPLOYEE`.
- `User` has a single `role` field, not multiple roles.
- Some frontend routes hide admin/approver screens by cookie user role.
- Some backend controllers use manual `requireAdmin`.

Important current gaps:
- Booking create uses `requesterId` from request body.
- Approval uses `approverId` from request body.
- Cancel uses `cancellerId` from request body.
- Dashboard `/admin` and `/client/{userId}` do not use authenticated principal in the controller.

Design-doc mismatch:
- Multi-role and scope-based permission are not implemented as described in the design document. Treat that as OUTDATED DOC/PARTIAL until code changes.

## Main Entities

- `User`: email, fullName, password, avatarUrl, jobPosition, role, status, department.
- `Room`: name, location, capacity, equipment, imageUrl, status.
- `Vehicle`: licensePlate, vehicleType, seatCount, status. It reuses `RoomStatus`.
- `BookingRoom`: room, requester, title, startTime, endTime, attendeeCount, note, status, cancel info.
- `BookingCar`: vehicle, requester, departure, destination, startTime, endTime, note, status, cancel info.
- `ApprovalStep`: stores approval action for room or car booking.
- `Notification`: recipient, sender, type, title, message/description, targetUrl, sourceType, sourceId, priority, read state.
- `PushSubscription`: user, endpoint, p256dh/auth keys, device info, active state.
- `ProfileUpdateRequest`: profile change workflow.

## Main API Map

Auth:
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/google`
- `POST /api/v1/auth/register/request-otp`
- `POST /api/v1/auth/register/verify`
- `POST /api/v1/auth/forgot-password/request-otp`
- `POST /api/v1/auth/forgot-password/reset`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`

Booking:
- `POST /api/v1/bookings/rooms`
- `GET /api/v1/bookings/rooms`
- `POST /api/v1/bookings/rooms/{id}/cancel`
- `POST /api/v1/bookings/cars`
- `GET /api/v1/bookings/cars`
- `POST /api/v1/bookings/cars/{id}/cancel`

Calendar range support:
- `GET /api/v1/bookings/rooms?start=yyyy-MM-ddTHH:mm:ss&end=yyyy-MM-ddTHH:mm:ss&roomId=&status=`
- `GET /api/v1/bookings/cars?start=yyyy-MM-ddTHH:mm:ss&end=yyyy-MM-ddTHH:mm:ss&vehicleId=&status=`

Approval:
- `POST /api/v1/approvals/rooms/{id}/approve`
- `POST /api/v1/approvals/rooms/{id}/reject`
- `POST /api/v1/approvals/cars/{id}/approve`
- `POST /api/v1/approvals/cars/{id}/reject`

Notification and push:
- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread-count`
- `PATCH /api/v1/notifications/{id}/read`
- `PATCH /api/v1/notifications/read-all`
- `GET /api/v1/push/vapid-public-key`
- `POST /api/v1/push/subscriptions`
- `DELETE /api/v1/push/subscriptions`
- `GET /api/v1/push/subscriptions`

Resources and dashboard:
- `GET /api/v1/resources/rooms`
- `GET /api/v1/resources/cars`
- `GET /api/v1/dashboard/admin`
- `GET /api/v1/dashboard/client/{userId}`
- `GET /api/v1/users/me`
- `GET /api/v1/users/approvers`
- `POST /api/v1/users`

## Authentication Current State

Actual login options:
- Email/password.
- Google ID token login.
- OTP register and forgot password.

Token behavior:
- Backend signs JWT with `JwtUtils`.
- Refresh token is stored in Redis under `refreshToken:{email}`.
- Frontend stores access token, refresh token, and user JSON in cookies.
- `baseApi` retries once on 401 by calling `/auth/refresh`.

Risk:
- `application.yml` contains real-looking default JWT, DB, SMTP, VAPID, and Google client config. Production must use environment variables and remove real fallback secrets.

## Booking Flow Summary

Room booking:
- `CreateRoomBooking.jsx`
- `bookingApi.createRoomBooking`
- `POST /api/v1/bookings/rooms`
- `BookingRoomController.createBooking`
- `BookingRoomService.createBooking`
- `RoomRepository.findByIdWithLock`
- `BookingRoomRepository.countOverlappingBookings`
- `BookingRoomRepository.save`
- `NotificationEvent` published
- `NotificationEventListener` handles after commit

Car booking:
- `CreateCarBooking.jsx`
- `bookingApi.createCarBooking`
- `POST /api/v1/bookings/cars`
- `BookingCarController.createBooking`
- `BookingCarService.createBooking`
- `VehicleRepository.findByIdWithLock`
- `BookingCarRepository.countOverlappingBookings`
- `BookingCarRepository.save`
- `NotificationEvent` published
- `NotificationEventListener` handles after commit

Do not break:
- `PENDING` and `APPROVED` are the blocking statuses for overlap checks.
- Resource locks are used to reduce race conditions.
- Notifications are published after commit.

## Calendar Flow Summary

Room and car calendar pages:
- Compute visible range from month/week/day.
- Call `bookingApi.getRoomBookings({start,end})` or `bookingApi.getCarBookings({start,end})`.
- Backend repository returns interval intersections using `existing.startTime < rangeEnd` and `existing.endTime > rangeStart`.
- Frontend filters rejected/cancelled and selected room/car locally.

Current gaps:
- No `AbortController` or stale response guard.
- `filteredEvents` is not memoized.
- Selected room/car is not passed to API yet, so range can still include all resources.
- Admin approval and booking detail pages still fetch all room and car bookings.

## Notification Flow Summary

Database notification is source of truth:
- `NotificationEventListener.handle`
- `NotificationService.createNotification`
- `NotificationRepository.save`

Realtime:
- `NotificationService.pushRealtime`
- `SimpMessagingTemplate.convertAndSendToUser(recipientId, "/queue/notifications", payload)`
- Frontend `NotificationContext` subscribes to `/user/queue/notifications`.

Email:
- `NotificationEvent.EmailInstruction`
- `NotificationEventListener.sendEmailIfConfigured`
- `EmailService` async methods

Web Push:
- `NotificationEventListener.sendPushIfSubscribed`
- `PushSubscriptionService.findActiveByUser`
- `PushService.sendPush`
- Browser service worker receives `push` and displays OS notification if no focused client.

## PWA Current State

Implemented:
- PWA manifest in `vite.config.js`.
- Multiple icons plus maskable icons.
- Custom service worker at `frontend/src/sw.js`.
- Push subscribe/unsubscribe logic.
- iOS detection and Add to Home Screen guard in `usePushNotifications`.
- Notification click attempts to focus client and post `NAVIGATE`, or opens a new window.
- `DashboardLayout` listens for service-worker `NAVIGATE` messages.

Gaps:
- Listener lives in protected dashboard layout, not globally in `main.jsx`.
- No explicit production Nginx/SPA rewrite config found.
- Offline fallback is only precache-based; dynamic booking API is not runtime cached, which is good until invalidation exists.

## Current Verification Status

| Area | Status | Evidence |
|---|---|---|
| Calendar range API | IMPLEMENTED | Controllers accept `start/end`; repositories implement interval intersection. |
| Calendar visible range fetch | IMPLEMENTED | `RoomBooking.jsx` and `CarBooking.jsx` call booking API with range. |
| Stale request guard | NOT FOUND | No AbortController/request id guard in calendar pages. |
| Route lazy loading | NOT FOUND | `App.jsx` imports all pages synchronously. |
| Notification DB source | IMPLEMENTED | `NotificationService.createNotification` persists first. |
| Notification after commit | IMPLEMENTED | `@TransactionalEventListener(phase = AFTER_COMMIT)`. |
| WebSocket auth | IMPLEMENTED | STOMP CONNECT token validation in `WebSocketConfig`. |
| Booking requester from JWT | VERIFIED issue | Services use `request.getRequesterId()`. |
| Approval approver from JWT | VERIFIED issue | `ApprovalService` uses `request.getApproverId()`. |
| Cancel canceller from JWT | VERIFIED issue | Cancel services use `request.getCancellerId()`. |
| Booking overlap lock | IMPLEMENTED | Room/vehicle repositories use pessimistic write lock. |
| Booking overlap DB index | NOT FOUND | Booking entities do not declare composite indexes; no migration files found. |
| Notification indexes/unique | IMPLEMENTED | `Notification` has indexes and unique constraint. |
| Push endpoint unique | IMPLEMENTED | `PushSubscription` has unique endpoint constraint. |
| Push retry/backoff | NOT FOUND | `PushService` logs non-terminal failures but does not retry. |
| Email frontend URL config | VERIFIED issue | Email links hard-code `https://cfcbooking.io.vn`. |
| Secret management | VERIFIED issue | `application.yml` contains real-looking default secrets/passwords. |
| Production migration | NOT FOUND | `ddl-auto: update`; no Flyway/Liquibase migrations found. |
| Scheduler reminders/completed | NOT FOUND | No `@EnableScheduling` or `@Scheduled` methods found. |
| Docker backend/frontend service | NOT FOUND | Compose defines DB, Redis, Adminer only. |
| Backend tests | IMPLEMENTED baseline | `mvnw.cmd test` passed 9 tests. |
| Frontend build/lint | IMPLEMENTED baseline | `npm.cmd run build` and `npm.cmd run lint` passed. |

## Non-Negotiable Rules For Future Work

- Do not trust `requesterId`, `approverId`, `cancellerId`, or dashboard `userId` from the client for protected business actions.
- Do not put mail or push inside the booking transaction.
- Do not cache dynamic booking APIs in the service worker without invalidation.
- Do not add Redis/Kafka/queue just as a best practice. Current Redis is used for refresh tokens.
- Do not change login/profile/business flow just to match older docs.
- Do not expose secrets in logs, config defaults, docs, or examples.
- Preserve backward-compatible APIs unless the phase explicitly includes a migration.
- When touching datetime, test timezone and midnight boundary cases.
- When touching PWA, test Android, iOS Safari, and installed iOS PWA behavior.
- When touching Docker/deploy, test CORS, HTTPS, SPA refresh, and persistent DB volume.
