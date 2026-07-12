# BookingBase Project Flow

Generated: 2026-07-11

This file describes the actual flow found in the current codebase.

## 1. Login, Register, Forgot Password

Email/password login:

```text
Login.jsx
-> authApi.login(email, password)
-> POST /api/v1/auth/login
-> AuthController.login()
-> AuthService.authenticate()
-> UserRepository.findByEmail()
-> PasswordEncoder.matches()
-> JwtUtils.generateAccessToken()
-> JwtUtils.generateRefreshToken()
-> RedisTemplate.set("refreshToken:{email}")
-> frontend stores tokens and user in cookies
```

Google login:

```text
Login.jsx
-> authApi.googleLogin(idToken)
-> POST /api/v1/auth/google
-> AuthController.googleLogin()
-> AuthService.authenticateWithGoogle()
-> GoogleIdTokenVerifier.verify()
-> AuthService.processUserAuth()
-> create/update User
-> issue JWT + refresh token
```

Register OTP:

```text
Register.jsx
-> authApi.requestRegisterOtp()
-> POST /api/v1/auth/register/request-otp
-> AuthService.requestRegisterOtp()
-> OtpService.generateAndStoreOtp()
-> OtpMailService.sendRegisterOtp()

Register.jsx
-> authApi.verifyRegisterOtp()
-> POST /api/v1/auth/register/verify
-> AuthService.verifyRegisterOtp()
-> create EMPLOYEE user with encoded password
```

Forgot password OTP:

```text
ForgotPassword.jsx
-> authApi.requestForgotPasswordOtp()
-> POST /api/v1/auth/forgot-password/request-otp
-> AuthService.requestForgotPasswordOtp()
-> OtpService + OtpMailService

ForgotPassword.jsx
-> authApi.resetPasswordWithOtp()
-> POST /api/v1/auth/forgot-password/reset
-> AuthService.resetPasswordWithOtp()
-> PasswordEncoder.encode()
-> UserRepository.save()
```

Status:
- IMPLEMENTED: email/password, Google login, register OTP, forgot password OTP.
- OUTDATED DOC/PARTIAL: original design says Google Workspace only; current code also supports email/password/OTP.

## 2. Create Room Booking

```text
CreateRoomBooking.jsx
-> authApi.getUser()
-> payload includes requesterId from cookie user
-> bookingApi.createRoomBooking(payload)
-> POST /api/v1/bookings/rooms
-> BookingRoomController.createBooking()
-> BookingRoomService.createBooking()
-> validate startTime < endTime
-> RoomRepository.findByIdWithLock(roomId)
-> validate room status ACTIVE
-> UserRepository.findById(requesterId)
-> BookingRoomRepository.countOverlappingBookings(roomId, start, end)
-> BookingRoomRepository.save()
-> publish NotificationEvent for requester
-> publish NotificationEvent for each admin
-> transaction commits
-> NotificationEventListener.handle() AFTER_COMMIT + @Async
-> NotificationService.createNotification()
-> NotificationService.pushRealtime()
-> EmailService if event has EmailInstruction
-> PushService for active push subscriptions
-> frontend navigates back to /rooms
```

Important status:
- IMPLEMENTED: lock, overlap check, after-commit notification.
- VERIFIED issue: requester comes from request body, not authenticated principal.
- VERIFIED issue: controller returns `BookingRoom` entity directly.

## 3. Create Car Booking

```text
CreateCarBooking.jsx
-> authApi.getUser()
-> payload includes requesterId and title
-> bookingApi.createCarBooking(payload)
-> POST /api/v1/bookings/cars
-> BookingCarController.createBooking()
-> BookingCarService.createBooking()
-> validate startTime < endTime
-> VehicleRepository.findByIdWithLock(vehicleId)
-> UserRepository.findById(requesterId)
-> BookingCarRepository.countOverlappingBookings(vehicleId, start, end)
-> BookingCarRepository.save()
-> publish NotificationEvent for requester
-> publish NotificationEvent for each admin
-> AFTER_COMMIT notification/email/push
-> frontend navigates back to /cars
```

Important status:
- IMPLEMENTED: lock, overlap check, after-commit notification.
- VERIFIED issue: requester comes from request body, not authenticated principal.
- VERIFIED issue: frontend sends `title`, but `BookingCarRequest` has no title and `BookingCar` has no title; calendar maps `b.title`, so car event title can be missing.

## 4. Overlap Check

Room:

```text
BookingRoomService.createBooking()
-> RoomRepository.findByIdWithLock(roomId)
-> BookingRoomRepository.countOverlappingBookings()
-> JPQL:
   room.id = :roomId
   status in PENDING, APPROVED
   startTime < :endTime
   endTime > :startTime
```

Car:

```text
BookingCarService.createBooking()
-> VehicleRepository.findByIdWithLock(vehicleId)
-> BookingCarRepository.countOverlappingBookings()
-> JPQL:
   vehicle.id = :vehicleId
   status in PENDING, APPROVED
   startTime < :endTime
   endTime > :startTime
```

Status:
- IMPLEMENTED: correct interval intersection logic.
- IMPLEMENTED: pessimistic lock on resource row.
- NOT FOUND: composite indexes for booking overlap.
- NEEDS TEST: concurrent room/car create integration tests with real DB.

## 5. Approve Or Reject Booking

Room approve/reject:

```text
BookingDetail.jsx
-> approvalApi.approveRoom(id, { approverId, note })
-> POST /api/v1/approvals/rooms/{id}/approve
-> ApprovalController.approveRoom()
-> ApprovalService.approveRoom()
-> BookingRoomRepository.findById()
-> UserRepository.findById(request.approverId)
-> booking.status = APPROVED
-> ApprovalStepRepository.save()
-> publish NotificationEvent for requester
-> AFTER_COMMIT notification/email/push
```

Car approve/reject is the same shape with `BookingCarRepository`.

Important status:
- VERIFIED issue: controller does not use `@AuthenticationPrincipal`.
- VERIFIED issue: service trusts `approverId` from request body.
- VERIFIED issue: no backend role/scope check in approval endpoints.
- VERIFIED issue: frontend sends `note`, but DTO expects `reason`; reject reason can be lost.

## 6. Cancel Booking

Room cancel:

```text
Frontend caller
-> POST /api/v1/bookings/rooms/{id}/cancel
-> BookingRoomController.cancelBooking()
-> BookingRoomService.cancelBooking(id, CancelRequest)
-> BookingRoomRepository.findById()
-> UserRepository.findById(request.cancellerId)
-> set status CANCELLED
-> save
-> notify requester if canceller differs
```

Car cancel has the same shape.

Status:
- VERIFIED issue: canceller comes from request body, not authenticated principal.
- NEEDS TEST: permissions for requester/admin cancel.

## 7. Calendar Load

Room:

```text
RoomBooking.jsx
-> getCalendarRange(date, view)
-> bookingApi.getRoomBookings({ start, end })
-> GET /api/v1/bookings/rooms?start=...&end=...
-> BookingRoomController.getAllBookings(start, end, roomId, status)
-> BookingRoomService.getBookingsByDateRange()
-> BookingRoomRepository.findByDateRange()
-> frontend maps booking to calendar event
-> frontend filters rejected/cancelled and selectedRoom
-> react-big-calendar renders
```

Car:

```text
CarBooking.jsx
-> getCalendarRange(date, view)
-> bookingApi.getCarBookings({ start, end })
-> GET /api/v1/bookings/cars?start=...&end=...
-> BookingCarController.getAllBookings(start, end, vehicleId, status)
-> BookingCarService.getBookingsByDateRange()
-> BookingCarRepository.findByDateRange()
-> frontend maps booking to calendar event
-> frontend filters rejected/cancelled and selectedCar
```

Status:
- IMPLEMENTED: visible range fetch.
- IMPLEMENTED: backward compatibility when no `start/end`.
- PARTIAL: selected resource is filtered client-side, not passed to API.
- NOT FOUND: AbortController/stale response guard.
- NOT FOUND: `useMemo` for `filteredEvents`.

## 8. Admin Approval List And Booking Detail

Admin approvals:

```text
AdminApprovals.jsx
-> Promise.all([
     bookingApi.getRoomBookings(),
     bookingApi.getCarBookings()
   ])
-> GET room/cars without start/end
-> backend getAllBookings()
-> repository.findAll()
-> frontend filters status PENDING
```

Booking detail:

```text
BookingDetail.jsx
-> Promise.all([
     bookingApi.getRoomBookings(),
     bookingApi.getCarBookings(),
     userApi.getApprovers()
   ])
-> find requested booking in client memory
```

Status:
- VERIFIED issue: still uses all-bookings endpoints; this does not scale.
- Recommended: add detail endpoints and pending-approval endpoints with pagination.

## 9. Notification Database

```text
Business service publishes NotificationEvent
-> transaction commits
-> NotificationEventListener.handle() AFTER_COMMIT
-> NotificationService.createNotification()
-> duplicate check by recipient/type/sourceType/sourceId
-> NotificationRepository.save()
-> return NotificationResponse
```

Status:
- IMPLEMENTED: database notification is source of truth.
- IMPLEMENTED: `Notification` entity has indexes and unique constraint.
- PARTIAL: duplicate race is constrained by DB, but service does not explicitly handle unique-key exception as idempotent success.

## 10. WebSocket Realtime

Backend:

```text
WebSocketConfig.registerStompEndpoints()
-> /ws endpoint with SockJS
WebSocketConfig.configureClientInboundChannel()
-> on STOMP CONNECT validate Authorization Bearer token
-> set Principal name to user id
NotificationService.pushRealtime()
-> convertAndSendToUser(recipientId, "/queue/notifications", payload)
```

Frontend:

```text
NotificationContext.jsx
-> new STOMP Client with SockJS(getWsUrl())
-> connectHeaders Authorization Bearer token
-> subscribe /user/queue/notifications
-> upsertRealtimeNotification()
-> toast + unread count + app badge
```

Status:
- IMPLEMENTED: STOMP CONNECT authentication.
- PARTIAL: provider value is not memoized, so realtime updates can re-render all context consumers.

## 11. Email

```text
NotificationEvent has EmailInstruction
-> NotificationEventListener.sendEmailIfConfigured()
-> lookup recipient user
-> EmailService async method
-> JavaMailSender sends HTML email
-> failures are logged and not rethrown
```

Status:
- IMPLEMENTED: async email after commit.
- VERIFIED issue: email links hard-code `https://cfcbooking.io.vn`.
- NOT FOUND: retry/backoff or email log table.

## 12. Web Push

Subscribe:

```text
DashboardLayout
-> usePushNotifications({ autoRegister: true })
-> pushApi.getVapidPublicKey()
-> navigator.serviceWorker.ready
-> pushManager.getSubscription()
-> unsubscribe if VAPID key mismatch
-> pushManager.subscribe()
-> pushApi.subscribe()
-> POST /api/v1/push/subscriptions
-> PushSubscriptionController.subscribe()
-> PushSubscriptionService.subscribe()
-> save/update PushSubscription by endpoint
```

Send:

```text
NotificationEventListener.sendPushIfSubscribed()
-> PushSubscriptionService.findActiveByUser()
-> for each subscription: PushService.sendPush()
-> webPushClient.send()
-> 2xx marks success
-> 403/404/410 deactivate subscription
-> 413 logs payload too large
-> other errors log only
```

Click:

```text
Service worker notificationclick
-> focus existing client and post NAVIGATE
-> or clients.openWindow(targetUrl)
-> DashboardLayout service-worker message listener navigates protected app
```

Status:
- IMPLEMENTED: subscription lifecycle, invalid subscription cleanup, notification click.
- PARTIAL: NAVIGATE listener is in protected layout, not global app entry.
- NOT FOUND: retry/backoff for network/5xx.
- NOT FOUND: bounded executor dedicated to notification/email/push.

## 13. Scheduler Reminder/Completed

Status:
- NOT FOUND: no `@EnableScheduling` and no `@Scheduled` methods were found.
- Design docs describe reminders/completed transitions, but current code does not implement scheduler flow.

## 14. Docker And Deploy

Current compose:

```text
docker-compose.yml
-> db: mysql:8.0, named volume db_data
-> redis: redis:7-alpine, named volume redis_data
-> adminer
```

Current tunnel:

```text
cloudflared-config.yml
-> api.cfcbooking.io.vn -> localhost:8080
-> cfcbooking.io.vn -> localhost:4173
-> www.cfcbooking.io.vn -> localhost:4173
```

Status:
- PARTIAL: DB and Redis volumes exist.
- NOT FOUND: backend/frontend container services.
- NOT FOUND: healthchecks.
- NOT FOUND: resource limits.
- NOT FOUND: `.env.example`.
- NOT FOUND: root `Dockerfile` and `nginx.conf`.
- VERIFIED issue: cloudflared credentials path is an absolute local Windows path.
