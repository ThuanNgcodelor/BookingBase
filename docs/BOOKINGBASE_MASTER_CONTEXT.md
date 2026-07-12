# BOOKINGBASE MASTER CONTEXT

> Phiên bản tổng hợp: 11/07/2026  
> Mục đích: thay thế việc phải đọc riêng `AI_PROJECT_CONTEXT.md`, `PROJECT_FLOW.md`, `PERFORMANCE_AUDIT.md` và `OPTIMIZATION_EXECUTION_PLAN.md` trong các phiên làm việc tối ưu tiếp theo.  
> Trạng thái: tài liệu context và kế hoạch; chưa xác nhận rằng các task tối ưu bên dưới đã được triển khai.

---

## 1. Quy tắc nguồn sự thật

Khi tài liệu và code mâu thuẫn, ưu tiên theo thứ tự:

1. Code và config hiện tại trong repository.
2. Schema/migration database hiện tại.
3. File master này.
4. Các tài liệu audit, roadmap và thiết kế cũ.

Các tài liệu thiết kế cũ có thể mô tả chức năng dự kiến nhưng chưa tồn tại trong code. Không thay đổi code chỉ để khớp tài liệu cũ.

Trạng thái dùng trong tài liệu:

- `IMPLEMENTED`: đã tìm thấy trong code.
- `PARTIAL`: đã có một phần nhưng chưa hoàn chỉnh.
- `VERIFIED ISSUE`: đã xác minh vấn đề trong code.
- `NOT FOUND`: chưa tìm thấy trong lần audit.
- `OUTDATED DOC`: tài liệu cũ không còn đúng.
- `NEEDS TEST`: cần chạy test hoặc đo thực tế mới kết luận được.

---

## 2. Tổng quan hệ thống hiện tại

BookingBase là hệ thống nội bộ dùng để:

- Đặt phòng họp.
- Đặt xe công tác.
- Duyệt hoặc từ chối booking.
- Hiển thị lịch ngày/tuần/tháng.
- Dashboard cá nhân và quản trị.
- Notification trong ứng dụng.
- WebSocket realtime.
- Email.
- PWA/Web Push.
- Quản lý tài nguyên, người dùng và yêu cầu cập nhật hồ sơ.

### Frontend

- React 19.
- Vite 8.
- React Router 7.
- Axios.
- `react-big-calendar`.
- `date-fns`.
- STOMP qua SockJS.
- `vite-plugin-pwa`.
- Custom Service Worker: `frontend/src/sw.js`.

### Backend

- Spring Boot 4.0.0.
- Java 21.
- Spring Security + JWT.
- Spring Data JPA.
- MySQL.
- Redis lưu refresh token.
- Java Mail.
- WebSocket/STOMP.
- Web Push/VAPID.
- Notification/email/push xử lý async sau commit.

### Hạ tầng hiện tại

- `docker-compose.yml` mới có MySQL, Redis và Adminer.
- Cloudflare Tunnel:
  - `api.cfcbooking.io.vn` → backend port `8080`.
  - `cfcbooking.io.vn` và `www.cfcbooking.io.vn` → frontend preview port `4173`.
- Chưa tìm thấy:
  - Backend/frontend Docker service.
  - Root `Dockerfile`.
  - `nginx.conf`.
  - `.env.example`.
  - Healthcheck.
  - Resource limit.
- `cloudflared-config.yml` đang có đường dẫn credential tuyệt đối theo máy Windows local.

---

## 3. Cấu trúc quan trọng

### Backend

```text
backend/src/main/java/com/booking/system/
├── config/       Security, CORS, WebSocket, Web Push, seed
├── controller/   REST API
├── service/      Business logic
├── repository/   JPA queries
├── entity/       Database entities
├── dto/          Request/response DTO
├── event/        Notification event + listener
└── security/     JWT filter và JWT utils
```

Config chính:

```text
backend/src/main/resources/application.yml
```

Test:

```text
backend/src/test/java/com/booking/system/
```

### Frontend

```text
frontend/src/
├── App.jsx
├── main.jsx
├── api/
├── pages/
├── layouts/DashboardLayout.jsx
├── contexts/NotificationContext.jsx
├── hooks/usePushNotifications.js
├── components/calendar/
├── utils/dateTime.js
└── sw.js
```

PWA config:

```text
frontend/vite.config.js
frontend/index.html
```

---

## 4. Authentication và phân quyền thực tế

### Authentication đã triển khai

- Email/password.
- Google ID token.
- Đăng ký bằng OTP email.
- Quên mật khẩu bằng OTP email.
- Access token + refresh token.
- Refresh token lưu Redis theo key dạng `refreshToken:{email}`.
- Frontend lưu access token, refresh token và user JSON trong cookie.
- Axios thử refresh một lần khi gặp `401`.

### Role thực tế

```text
ADMIN
MANAGER
EMPLOYEE
```

`User` hiện chỉ có một field `role`, chưa phải mô hình multi-role hoặc scope-based đầy đủ như tài liệu thiết kế cũ.

### Lỗ hổng trust boundary đã xác minh

Backend đang tin ID từ client trong các nghiệp vụ bảo vệ:

- `requesterId` khi tạo booking.
- `approverId` khi duyệt/từ chối.
- `cancellerId` khi hủy.
- `userId` trên dashboard client.
- Admin dashboard chưa được ràng buộc principal/role đủ rõ.

Nguyên tắc sửa:

- Danh tính thực hiện thao tác phải lấy từ `@AuthenticationPrincipal`.
- Field ID cũ có thể giữ tạm để backward compatibility nhưng backend phải bỏ qua.
- Authorization phải kiểm tra tại backend, không dựa vào việc frontend ẩn nút hoặc route.

---

## 5. Entity chính

- `User`: email, fullName, password, avatar, chức vụ, role, trạng thái, phòng ban.
- `Room`: tên, vị trí, sức chứa, thiết bị, ảnh, trạng thái.
- `Vehicle`: biển số, loại xe, số chỗ, trạng thái.
- `BookingRoom`: phòng, requester, title, thời gian, số người, ghi chú, trạng thái, thông tin hủy.
- `BookingCar`: xe, requester, điểm đi/đến, thời gian, ghi chú, trạng thái, thông tin hủy.
- `ApprovalStep`: lịch sử thao tác duyệt.
- `Notification`: recipient, sender, type, title, message, target URL, source type/ID, priority, read state.
- `PushSubscription`: user, endpoint, key, thiết bị, trạng thái active.
- `ProfileUpdateRequest`: workflow cập nhật hồ sơ.

Vấn đề đã xác minh:

- Frontend gửi `title` khi tạo booking xe.
- `BookingCarRequest` và `BookingCar` chưa có `title`.
- Calendar xe đang đọc `b.title`.
- Cần quyết định thêm field bằng migration hoặc tạo title nhất quán từ điểm đi/đến.

---

## 6. API chính

### Authentication

```text
POST /api/v1/auth/login
POST /api/v1/auth/google
POST /api/v1/auth/register/request-otp
POST /api/v1/auth/register/verify
POST /api/v1/auth/forgot-password/request-otp
POST /api/v1/auth/forgot-password/reset
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
```

### Booking

```text
POST /api/v1/bookings/rooms
GET  /api/v1/bookings/rooms
POST /api/v1/bookings/rooms/{id}/cancel

POST /api/v1/bookings/cars
GET  /api/v1/bookings/cars
POST /api/v1/bookings/cars/{id}/cancel
```

Calendar range đã triển khai:

```text
GET /api/v1/bookings/rooms?start=...&end=...&roomId=&status=
GET /api/v1/bookings/cars?start=...&end=...&vehicleId=&status=
```

### Approval

```text
POST /api/v1/approvals/rooms/{id}/approve
POST /api/v1/approvals/rooms/{id}/reject
POST /api/v1/approvals/cars/{id}/approve
POST /api/v1/approvals/cars/{id}/reject
```

### Notification và Push

```text
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
PATCH  /api/v1/notifications/{id}/read
PATCH  /api/v1/notifications/read-all

GET    /api/v1/push/vapid-public-key
POST   /api/v1/push/subscriptions
DELETE /api/v1/push/subscriptions
GET    /api/v1/push/subscriptions
```

### Resource và Dashboard

```text
GET  /api/v1/resources/rooms
GET  /api/v1/resources/cars
GET  /api/v1/dashboard/admin
GET  /api/v1/dashboard/client/{userId}
GET  /api/v1/users/me
GET  /api/v1/users/approvers
POST /api/v1/users
```

---

## 7. Flow nghiệp vụ thực tế

### 7.1 Tạo booking phòng

```text
CreateRoomBooking.jsx
→ bookingApi.createRoomBooking
→ POST /bookings/rooms
→ BookingRoomController
→ BookingRoomService
→ validate start < end
→ khóa Room bằng pessimistic lock
→ kiểm tra overlap PENDING/APPROVED
→ lưu BookingRoom
→ publish NotificationEvent
→ transaction commit
→ NotificationEventListener AFTER_COMMIT
→ DB notification + WebSocket + email + Web Push
```

### 7.2 Tạo booking xe

Flow tương tự booking phòng:

```text
CreateCarBooking.jsx
→ BookingCarController
→ BookingCarService
→ khóa Vehicle
→ kiểm tra overlap
→ lưu BookingCar
→ notification sau commit
```

### 7.3 Công thức overlap

```text
resource_id = ?
AND status IN (PENDING, APPROVED)
AND existing.start_time < requested.end_time
AND existing.end_time > requested.start_time
```

Đã làm tốt:

- Công thức giao khoảng đúng.
- Lock resource trước overlap check.
- Notification không nằm trong transaction booking.

Còn thiếu:

- Composite index cho overlap.
- Integration test tạo booking đồng thời trên database thật.

### 7.4 Duyệt và từ chối

```text
BookingDetail.jsx
→ approvalApi
→ ApprovalController
→ ApprovalService
→ load booking
→ load approver theo ID client gửi
→ đổi trạng thái
→ lưu ApprovalStep
→ publish notification sau commit
```

Vấn đề:

- Tin `approverId` từ body.
- Chưa kiểm tra role/scope đủ chặt ở backend.
- Frontend gửi `note` nhưng DTO dùng `reason`, có nguy cơ mất lý do từ chối.

### 7.5 Hủy booking

```text
POST /bookings/{type}/{id}/cancel
→ controller
→ service
→ load canceller theo cancellerId từ body
→ đổi trạng thái CANCELLED
→ lưu và gửi notification
```

Cần lấy canceller từ principal và định nghĩa rõ policy:

- Requester được hủy booking của mình.
- Admin được hủy.
- Manager chỉ được hủy khi đúng phạm vi được giao.

### 7.6 Calendar

```text
RoomBooking.jsx / CarBooking.jsx
→ tính visible range theo month/week/day
→ gọi API với start/end
→ repository trả booking giao với range
→ map thành calendar event
→ lọc trạng thái và resource
→ react-big-calendar render
```

Đã triển khai:

- API range.
- Frontend fetch theo visible range.
- Backward compatibility khi không truyền range.

Cần tối ưu tiếp:

- AbortController hoặc request sequence guard.
- `useMemo` cho event mapping/filter.
- Gửi `roomId`/`vehicleId` lên API khi chọn resource.
- Responsive resize/orientation.
- Không để notification không liên quan làm Calendar render lại.

### 7.7 Admin approval và Booking Detail

Hai màn hình vẫn gọi toàn bộ booking phòng và xe rồi lọc ở frontend:

```text
AdminApprovals.jsx
→ getRoomBookings() + getCarBookings()
→ findAll()
→ lọc PENDING

BookingDetail.jsx
→ load toàn bộ room + car bookings
→ tìm booking theo ID trong memory
```

Đây là flow cần thay thế bằng:

- Pending approvals endpoint có pagination.
- Detail endpoint theo type + ID.
- DTO chỉ chứa dữ liệu cần thiết.
- Authorization theo principal.

### 7.8 Notification

```text
Business service
→ publish NotificationEvent
→ AFTER_COMMIT listener
→ NotificationService.createNotification
→ NotificationRepository.save
→ WebSocket realtime
→ email/push nếu có
```

Nguyên tắc:

- Database notification là source of truth.
- WebSocket chỉ là kênh realtime.
- Mất WebSocket không được làm mất notification.
- Mail/push lỗi không rollback booking.

Notification entity đã có index và unique constraint. Service nên coi duplicate-key là idempotent thay vì lỗi ồn.

### 7.9 WebSocket

- STOMP CONNECT có xác minh Bearer JWT.
- Principal WebSocket dùng user ID.
- Frontend subscribe `/user/queue/notifications`.
- Notification Context cập nhật list, unread count, toast và app badge.

Cần tối ưu:

- Memo hóa provider value.
- Có thể tách unread count khỏi notification list nếu profiler chứng minh re-render rộng.

### 7.10 Email

- Chạy async sau commit.
- Lỗi email được log, không rollback booking.
- Link đang hard-code `https://cfcbooking.io.vn`.

Cần:

```text
app.frontend-url=${APP_FRONTEND_URL}
```

Tất cả link email phải tạo từ config.

### 7.11 Web Push và PWA

Đã triển khai:

- Manifest và maskable icons.
- Subscribe/unsubscribe.
- iOS detection và yêu cầu Add to Home Screen.
- Cleanup subscription khi nhận `403/404/410`.
- Notification click focus app hoặc mở URL.
- DashboardLayout nghe message `NAVIGATE`.

Còn thiếu:

- Retry giới hạn cho lỗi network/5xx.
- Bounded async executor.
- Listener `NAVIGATE` toàn cục; hiện nằm trong protected layout.
- Offline fallback rõ ràng.
- Không được runtime-cache API booking khi chưa có invalidation.

### 7.12 Scheduler

Chưa tìm thấy:

- `@EnableScheduling`.
- `@Scheduled`.
- Job nhắc trước giờ.
- Job tự chuyển booking sang `COMPLETED`.

Không trộn scheduler vào các task security/performance đầu tiên. Chỉ triển khai sau khi có query/index và test phù hợp.

---

## 8. Baseline đã đo

Các lệnh đã chạy thành công:

```text
npm.cmd run build
npm.cmd run lint
.\mvnw.cmd test
```

Kết quả:

- Frontend build: PASS.
- Frontend lint: PASS, còn warning unused.
- Backend: 9 test PASS.
- Main JS: `738.44 kB` minified, `214.67 kB` gzip.
- Main CSS: `56.84 kB` minified, `10.56 kB` gzip.
- PWA precache: khoảng `1806.35 KiB`.
- Vite cảnh báo main chunk lớn hơn `500 kB`.

Mục tiêu ban đầu:

- Route-level code splitting.
- Initial main JS dưới khoảng `350 kB` minified hoặc tách rõ heavy route chunks.
- Calendar API p95 dưới `300 ms` với dữ liệu gần production.
- Overlap query p95 dưới `50 ms`.
- Booking create p95 dưới `500 ms`, không tính async notification.
- Các metric chưa đo phải ghi `NOT MEASURED`, không tự tạo số liệu.

---

## 9. Backlog ưu tiên

### P0 — Security và production blocker

1. Lấy requester từ JWT, không tin `requesterId`.
2. Lấy approver từ JWT và kiểm tra `ADMIN/MANAGER`.
3. Lấy canceller từ JWT và áp dụng cancel policy.
4. Khóa dashboard/admin API theo principal và role.
5. Xóa secret/default password thật khỏi `application.yml`.
6. Tạo `.env.example` chỉ chứa placeholder.
7. Rotate các secret đã từng commit.
8. Thống nhất timezone backend/JDBC/DB/container.
9. Thêm migration framework; production dùng `ddl-auto=validate`.

### P1 — Khả năng scale và độ ổn định

1. Route lazy loading cho calendar/admin/profile/notification.
2. Thay all-bookings flow ở AdminApprovals và BookingDetail.
3. Thêm composite index overlap:
   - `booking_rooms(room_id, status, start_time, end_time)`.
   - `booking_cars(vehicle_id, status, start_time, end_time)`.
4. Chuẩn hóa title/purpose của booking xe.
5. Email frontend URL lấy từ config.
6. Bounded executor cho notification/email/push.
7. Push retry giới hạn cho network/5xx.
8. Production Docker Compose có app services, healthcheck và restart policy.

### P2 — Tối ưu có kiểm chứng

1. Calendar stale-response guard.
2. `useMemo` cho mapped/filtered events.
3. Gửi resource filter lên API.
4. Memo hóa Notification Context value.
5. Chuyển Service Worker navigate listener lên global router layer.
6. Thêm offline fallback nhưng không cache dynamic booking API.
7. Test PWA Android/iOS và safe-area.

### P3 — Backlog dài hạn

- Scheduler reminder/completed.
- Audit log đầy đủ.
- Reporting/BI.
- Global search.
- Recurring booking.
- Multi-role/scope-based permission hoàn chỉnh.

Không đưa P3 vào PR tối ưu ban đầu.

---

## 10. Roadmap triển khai

### Phase 1 — Trust boundary và production config

- JWT principal cho create/approve/reject/cancel/dashboard.
- Backend authorization.
- Secret management và `.env.example`.
- Timezone policy.
- Test spoofing và role.

### Phase 2 — Frontend và Calendar

- Route code splitting.
- Stale request guard.
- Memo hóa event/filter.
- Resource filter ở API.
- Pending/detail endpoint thay all-bookings.

### Phase 3 — Database và API

- Flyway hoặc Liquibase.
- Baseline schema.
- Production `ddl-auto=validate`.
- Composite indexes.
- DTO/projection.
- Pagination.
- `EXPLAIN`.
- Concurrency test.

### Phase 4 — Notification, Email và Push

- Configurable frontend URL.
- Bounded executor.
- Push retry/backoff.
- Notification idempotency.
- Giảm re-render Notification Context.

### Phase 5 — PWA Android/iOS

- Global navigate listener.
- Offline fallback an toàn.
- Android closed-app push.
- iOS installed PWA push.
- Safe-area và deep link.

### Phase 6 — Docker/Deploy

- Giữ compose dev hiện tại.
- Tạo `docker-compose.prod.yml`.
- Backend/frontend Dockerfile.
- Healthcheck, restart, env, resource limit.
- SPA fallback.
- Cloudflare ingress.
- Backup/restore database.

### Phase 7 — Test, monitoring và logging

- Security controller/service tests.
- Overlap concurrency integration tests.
- Push/mail failure tests.
- Frontend calendar large-data smoke test.
- Structured logs không chứa secret.
- Health endpoint và production smoke test.

---

## 11. Test bắt buộc

### Security

- API protected không token → `401`.
- Employee gọi admin API → `403`.
- User A không tạo booking dưới danh nghĩa User B.
- Employee không duyệt bằng cách gửi ID admin.
- User A không hủy booking User B trái policy.
- User A không đọc dashboard User B.
- Log không chứa token, OTP, password hoặc secret.

### Booking

- `start < end`.
- `start >= end` bị từ chối.
- Non-overlap thành công.
- Overlap bị từ chối.
- Hai request đồng thời không tạo booking trùng.
- Approval/cancel lưu đúng actor.
- Notification chỉ chạy sau commit.

### Calendar

- Month/week/day đúng.
- Không mất event ở biên range.
- Chuyển view liên tục không hiển thị stale response.
- Resource filter giảm dữ liệu.
- Dataset lớn không làm treo UI.
- Mobile portrait/landscape.
- Booking sát nửa đêm.

### Notification, Email, Push

- Unread count.
- Mark read/read all.
- WebSocket reconnect không duplicate.
- SMTP fail không rollback booking.
- Link email đúng environment.
- Push `403/404/410` deactivate.
- Push `5xx/network` retry trong giới hạn.
- Android app đóng vẫn nhận push.
- iOS PWA cài đặt nhận push.
- Click notification mở đúng route.

### Docker/Deploy

- Container restart.
- DB giữ dữ liệu.
- Healthcheck pass.
- React deep link refresh không `404`.
- HTTPS và CORS đúng.
- Timezone container đúng policy.
- Backup/restore có tài liệu và được thử.

---

## 12. Quy tắc bắt buộc cho AI Agent

1. Đọc file này trước khi sửa code.
2. Code hiện tại là source of truth.
3. Chỉ triển khai một task/PR có scope rõ ràng.
4. Không refactor ngoài phạm vi.
5. Không thay đổi UI, Profile hoặc login flow nếu task không yêu cầu.
6. Không chuyển sang microservice.
7. Không thêm Kafka/queue chỉ vì best practice.
8. Redis hiện dùng cho refresh token; không mở rộng nếu chưa có bằng chứng tải.
9. Không đưa mail/push vào transaction booking.
10. Không cache API booking động trong Service Worker.
11. Không log JWT, OTP, password, SMTP password, VAPID private key, DB password hoặc Authorization header.
12. Giữ backward compatibility khi có thể.
13. Mọi identity protected phải lấy từ authenticated principal.
14. Sửa datetime phải test timezone và nửa đêm.
15. Sửa PWA phải test Android, iOS Safari và installed iOS PWA.
16. Sửa deploy phải test HTTPS, CORS, SPA refresh và DB persistence.
17. Sau mỗi task phải cập nhật trạng thái, test đã chạy và rollback.
18. Không tuyên bố “đã tối ưu” nếu chưa có build/test hoặc metric.

---

## 13. Task nên triển khai đầu tiên

### Tên PR

```text
Phase 1: derive booking and approval identity from authenticated principal
```

### Scope

- Booking requester lấy từ principal.
- Approval approver lấy từ principal.
- Backend role check cho approve/reject.
- Giữ field ID cũ nhưng bỏ qua tạm thời để không làm gãy frontend.
- Sửa mapping `note`/`reason`.
- Thêm test chống giả mạo identity.

Chưa đưa cancel/dashboard vào cùng PR nếu làm PR quá lớn; triển khai ngay ở PR kế tiếp.

### Acceptance

```text
npm.cmd run build
npm.cmd run lint
.\mvnw.cmd test
```

Manual API tests:

- User A gửi `requesterId` của User B.
- Employee gửi `approverId` của Admin.
- Booking vẫn thuộc User A hoặc request bị từ chối.
- Employee nhận `403` khi approve/reject.
- Admin/Manager hợp lệ vẫn thao tác được.
- Lý do reject được lưu đúng.

---

## 14. Câu lệnh mẫu cho AI Agent

```text
Đọc BOOKINGBASE_MASTER_CONTEXT.md và code liên quan.

Triển khai đúng task đầu tiên:
“Phase 1: derive booking and approval identity from authenticated principal”.

Yêu cầu:
- Code hiện tại là source of truth.
- Không thay đổi UI, Profile, login flow hoặc chức năng không liên quan.
- Booking requester và approval approver phải lấy từ @AuthenticationPrincipal.
- Không tin requesterId/approverId từ request body.
- Giữ field cũ tạm thời để backward compatibility nhưng backend bỏ qua.
- Enforce role ADMIN hoặc MANAGER cho approve/reject.
- Chuẩn hóa reason/note để lý do reject được lưu đúng.
- Thêm test chống giả mạo user.
- Chạy frontend build, lint và backend test.
- Báo rõ file đã sửa, test đã chạy, rủi ro và rollback.
```

---

## 15. Trạng thái tài liệu

File này là bản tổng hợp từ:

- `AI_PROJECT_CONTEXT.md`.
- `PROJECT_FLOW.md`.
- `PERFORMANCE_AUDIT.md`.
- `OPTIMIZATION_EXECUTION_PLAN.md`.

Các file gốc vẫn hữu ích khi cần bằng chứng chi tiết, nhưng AI Agent có thể dùng file master này làm điểm bắt đầu để tránh đọc lại toàn bộ audit.
