# Audit Performance, Security Và Production Cho BookingBase

Cập nhật: 2026-07-12

File này là audit tiếng Việt, dùng để định hướng tối ưu. Giữ nguyên thuật ngữ: `P0`, `P1`, `JWT`, `DTO`, `WebSocket`, `PWA`, `Service Worker`, `runtime cache`, `EXPLAIN`, `React Profiler`.

## 1. Tóm Tắt Điều Hành

BookingBase đã có đủ các module chính: auth, booking, approval, calendar, notification, WebSocket, email, Web Push/PWA và production scripts. Các rủi ro lớn nhất hiện tại:

- Test backend fail trên JDK 23 do Mockito/ByteBuddy attach issue.
- Production secrets vẫn cần đưa ra environment variables.
- Email frontend URL/domain cần verify.
- Frontend bundle còn warning chunk lớn.
- PWA push cần test trên thiết bị thật.
- Chưa có Playwright mobile screenshots.

## 2. Baseline Hiện Tại

Frontend:
- `npm.cmd run build`: pass.
- `npm.cmd run lint`: pass, còn warning cũ ở `CustomDateHeader.jsx`.
- Main chunk khoảng 750 KB minified.
- `inlineDynamicImports` warning đã được xử lý bằng `rolldownOptions.output.codeSplitting = false` cho Service Worker build.

Backend:
- Từng pass 18 tests sau các task 7.9/7.11.
- Hiện `.\mvnw.cmd test` fail trên JDK 23 vì Mockito/ByteBuddy không self-attach.
- Cần dùng JDK 21 hoặc cấu hình Mockito Java agent.

Runtime:
- `run.bat` production-only, không build.
- `build-prod.bat` build frontend và package backend jar.
- `stop-prod.bat` stop production.
- Spring Boot serve frontend static assets từ jar.

## 3. Trạng Thái Code So Với Mục Tiêu

Đã làm:
- Không tin `requesterId/approverId` từ body cho booking/approval.
- Enforce `ADMIN` hoặc `MANAGER` cho approve/reject.
- Chuẩn hóa `reason/note`.
- Calendar có stale request guard và memoization.
- WebSocket provider value memoized.
- Unread count tách khỏi notification list.
- Web Push retry bounded.
- Bounded async executor.
- Global Service Worker `NAVIGATE` listener.
- Offline fallback không runtime-cache booking API.
- Production script nhẹ RAM hơn.

Chưa đủ hoặc cần verify:
- Cancel flow cần audit lại nếu chạm vào.
- Dashboard client/admin scope cần tiếp tục hardening nếu task liên quan.
- Email URL config cần đưa về env/config nếu chưa xong.
- DB index/migration framework chưa phải trọng tâm đã hoàn tất.

## 4. Điểm Đang Làm Tốt

- Notification được tách khỏi transaction bằng event async.
- WebSocket chỉ dùng realtime delivery, DB notification là `Source of Truth`.
- Calendar không load all-bookings khi đã có range fetch.
- PWA không runtime-cache dynamic booking/API responses.
- Production không còn cần Node/Vite preview.
- Có rollback path rõ qua `stop-prod.bat` và build artifact.

## 5. Backlog P0/P1

P0:
- Fix backend test environment: JDK 21 hoặc Mockito Java agent.
- Đưa secrets production ra environment variables.
- Verify CORS/domain/API khi Spring Boot serve cả SPA.
- Test production jar thật bằng `build-prod.bat` + `run.bat`.

P1:
- Verify email link/domain config.
- Audit cancel/dashboard identity.
- Test WebSocket/STOMP CONNECT JWT.
- Test PWA push trên Android/iOS.
- Add Playwright mobile screenshots cho Calendar/PWA gate.

## 6. Findings P2/P3

P2:
- Frontend chunk lớn, cân nhắc lazy route/code splitting.
- Email template đang khó maintain nếu hard-code HTML string.
- DB indexes cần đo bằng `EXPLAIN` với data thực.

P3:
- Có thể thêm smoke scripts cho production URLs.
- Có thể thêm structured logging cho notification/mail/push.
- Có thể thêm metrics qua Actuator.

## 7. Lộ Trình

### Giai Đoạn 0 - Baseline

- Giữ `CURRENT_WORK_STATUS.md` cập nhật.
- Ghi lại lệnh test/build đã chạy.
- Không dựa vào docs cũ nếu khác code.

### Giai Đoạn 1 - Security

- Identity từ `@AuthenticationPrincipal`.
- Role enforcement cho admin/approver.
- 401/403 đúng cho protected/admin APIs.
- Không log secrets.

### Giai Đoạn 2 - Calendar / Frontend Performance

- Range-based fetch.
- Abort/stale request guard.
- `useMemo` cho mapping/filter.
- Responsive/mobile validation.
- Không để notification update kéo Calendar render.

### Giai Đoạn 3 - Backend / DB

- DTO/projection cho API lớn.
- Pagination/range filter.
- Index overlap/status/time nếu đo thấy cần.
- Migration framework nếu bắt đầu quản lý schema nghiêm túc.

### Giai Đoạn 4 - Notification / Email / Push

- Bounded executor.
- Push retry/backoff bounded.
- Notification idempotency.
- Email URL từ config.

### Giai Đoạn 5 - PWA

- Global `NAVIGATE`.
- Offline fallback.
- Không runtime-cache booking API.
- Test Android/iOS installed PWA.

### Giai Đoạn 6 - Deploy

- Production jar serve SPA.
- Docker RAM constraints.
- Cloudflare tunnel trỏ đúng backend.
- Scripts rõ: build/start/stop.

### Giai Đoạn 7 - Tests / Monitoring

- Fix Mockito/JDK issue.
- Add smoke tests.
- Add Playwright mobile screenshots.
- Add logging/metrics khi cần.

## 8. File Theo Giai Đoạn

Security:
- `ApprovalController.java`
- `BookingRoomController.java`
- `BookingCarController.java`
- `ApprovalService.java`
- booking services
- relevant tests

Calendar:
- `RoomBooking.jsx`
- `CarBooking.jsx`
- calendar components/hooks
- booking/resource APIs

Notification/PWA:
- `NotificationContext.jsx`
- `NotificationContextCore.js`
- `useNotificationCenter.js`
- `DashboardLayout.jsx`
- `usePushNotifications.js`
- `sw.js`
- `PushService.java`
- `AsyncConfig.java`

Production:
- `run.bat`
- `build-prod.bat`
- `stop-prod.bat`
- `docker-compose.yml`
- `cloudflared-config.yml`
- `backend/pom.xml`
- `application-prod.yml`
- `SpaForwardController.java`
- `SecurityConfig.java`

## 9. Ma Trận Test

Frontend:
- `npm.cmd run lint`
- `npm.cmd run build`
- Manual: login, rooms calendar, cars calendar, notifications, PWA gate.

Backend:
- `.\mvnw.cmd test`
- Nếu fail vì Mockito/JDK 23: ghi rõ môi trường và dùng JDK 21/agent.

Production:
- `build-prod.bat`
- `run.bat`
- Verify:
  - `http://localhost:8080`
  - `https://cfcbooking.io.vn`
  - `https://api.cfcbooking.io.vn/api/v1/...`

Mobile/PWA:
- Android install + push.
- iOS Add to Home Screen + push nếu OS hỗ trợ.
- Notification click open/closed app.
- Offline navigation fallback.

## 10. Baseline Và Target Metrics

Frontend:
- Build pass.
- Lint pass.
- Main chunk cần giảm nếu bắt đầu thấy load chậm.
- Calendar không re-render vì notification list không liên quan.

Backend:
- Booking create p95 mục tiêu < 500 ms, không tính async notification.
- Overlap query p95 mục tiêu < 50 ms với data đủ lớn.
- Backend startup local mục tiêu < 30 s.

Docker/RAM:
- Java production trong `run.bat`: `-Xms256m -Xmx768m`.
- Docker chỉ start `db` + `redis` trong production.
- Adminer không start mặc định.

## 11. Rủi Ro Và Rollback

- Security principal changes: giữ DTO field cũ nhưng backend ignore để backward compatibility.
- Production jar serve SPA: rollback bằng cách quay lại chạy frontend preview riêng nếu cần.
- Docker RAM constraints: rollback command MySQL/Redis nếu DB workload thật cần RAM hơn.
- Push retry: disable hoặc hạ retry count bằng config nếu gây spam.
- PWA gate: nếu user bị block do thiết bị không hỗ trợ, cần policy rõ cho bypass/admin.

## 12. Lệnh / Ghi Chú

Lệnh đã biết:
- `npm.cmd run build`
- `npm.cmd run lint`
- `.\mvnw.cmd test`
- `build-prod.bat`
- `run.bat`
- `stop-prod.bat`

Ghi chú:
- `hs_err_pid*.log` và `replay_pid*.log` là JVM crash/debug logs, không commit.
- `.gitignore` đã ignore `*.log`.

## 13. Tác Vụ Triển Khai Đầu Tiên Tiếp Theo

Ưu tiên tiếp theo nên là fix backend test environment:

1. Dùng JDK 21 đúng với `pom.xml`.
2. Hoặc cấu hình Mockito/ByteBuddy Java agent cho JDK 23.
3. Chạy lại `.\mvnw.cmd test`.
4. Sau khi pass, chạy `build-prod.bat` để xác nhận production artifact.
