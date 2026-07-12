# Luồng Dự Án BookingBase

Cập nhật: 2026-07-12

File này mô tả flow nghiệp vụ hiện tại bằng tiếng Việt. Giữ nguyên thuật ngữ kỹ thuật như `JWT`, `DTO`, `WebSocket`, `Service Worker`, `PWA`, `Redis`, `range-based fetch`.

## 1. Login, Register, Forgot Password

Login:
1. Frontend gửi email/password tới `POST /api/v1/auth/login`.
2. Backend validate user, password và status.
3. Backend trả access token, refresh token và user info.
4. Frontend lưu token/user vào cookie.
5. Protected route kiểm tra token; nếu hết access token nhưng còn refresh token thì gọi silent refresh.

Google login:
1. Frontend lấy Google id token.
2. Gửi tới `POST /api/v1/auth/google`.
3. Backend xác minh và trả token.

Register OTP:
1. User gửi email tới `/api/v1/auth/register/request-otp`.
2. Backend tạo OTP và lưu Redis TTL.
3. Backend gửi email OTP.
4. User verify qua `/api/v1/auth/register/verify`.

Forgot password OTP:
1. User gửi email tới `/api/v1/auth/forgot-password/request-otp`.
2. Backend gửi OTP nếu email tồn tại.
3. User reset password qua `/api/v1/auth/forgot-password/reset`.

Quy tắc:
- Không đổi login/profile flow nếu task không yêu cầu.
- Token/refresh token phải được xử lý nhất quán.

## 2. Tạo Room Booking

1. User mở `/rooms`.
2. Frontend load rooms bằng `resourceApi.getRooms`.
3. Calendar fetch bookings theo visible range.
4. User chọn slot hoặc bấm create.
5. Frontend gửi booking request.
6. Backend lấy requester từ `@AuthenticationPrincipal`.
7. Backend validate thời gian và resource.
8. Backend lock room trước overlap check.
9. Nếu không overlap, tạo booking `PENDING`.
10. Sau commit, publish notification/email/push cho approver.

Không được:
- Tin `requesterId` từ request body.
- Bỏ validation `startTime < endTime`.
- Bỏ overlap check.

## 3. Tạo Car Booking

Luồng tương tự room booking:
1. User mở `/cars`.
2. Frontend load vehicles.
3. Calendar fetch bookings theo visible range.
4. User tạo booking xe.
5. Backend lấy requester từ principal.
6. Backend lock vehicle trước overlap check.
7. Tạo booking `PENDING`.
8. Dispatch notification/email/push sau commit.

Car event title có thể lấy từ title hoặc route `departure - destination`.

## 4. Overlap Check

Overlap logic chuẩn:

```text
existing.start < new.end
AND
existing.end > new.start
```

Blocking statuses:
- `PENDING`
- `APPROVED`

Room/vehicle phải được lock trước overlap check nếu chưa có giải pháp tương đương đã chứng minh.

## 5. Approve Hoặc Reject Booking

1. Approver mở approval list hoặc booking detail.
2. Approver approve/reject.
3. Frontend gửi `reason`; legacy `note` vẫn được backend nhận để backward compatibility.
4. Backend lấy approver từ `@AuthenticationPrincipal`.
5. Backend enforce `ADMIN` hoặc `MANAGER`.
6. Backend ignore `approverId` từ body.
7. Backend lưu `ApprovalStep` với approver thật và reason.
8. Booking status chuyển `APPROVED` hoặc `REJECTED`.
9. Dispatch notification/email/push cho requester sau commit.

Reject reason phải hiển thị được ở booking detail.

## 6. Cancel Booking

Luồng cancel cần giữ nguyên các quy tắc bảo mật:
- Canceller phải lấy từ authenticated principal.
- Không tin `cancellerId` từ request body.
- Cần preserve status/cancel reason.
- Notification sau cancel không được rollback transaction nếu mail/push fail.

Nếu chạm cancel flow, thêm test chống giả mạo user.

## 7. Load Calendar

Frontend calendar:
1. Tính visible range theo view `month`, `week`, `day`.
2. Fetch bookings theo `start`, `end`, resource filter và status filter.
3. Dùng `AbortController` để hủy request cũ.
4. Dùng request sequence guard để stale response không ghi đè state mới.
5. Dùng `useMemo` cho event mapping/filter.
6. Calendar responsive theo resize/orientation.

Màu event:
- Event quá khứ: màu xám/lịch sử.
- Pending quá hạn: màu cảnh báo.
- Approved hiện tại/tương lai: màu chính.
- Pending tương lai: màu chờ duyệt.

Không để notification list update làm Calendar render lại nếu không liên quan.

## 8. Admin Approval List Và Booking Detail

Admin approval list:
- Hiển thị booking pending/approved/rejected theo API hiện tại.
- Không dùng dữ liệu mẫu cho người duyệt.

Booking detail:
- Load booking detail.
- Load approval steps.
- Hiển thị approver thật, role/department nếu có.
- Hiển thị reject/approve reason.
- Cho phép approve/reject nếu user là `ADMIN` hoặc `MANAGER` và booking còn xử lý được.

## 9. Notification Database

Database notification là `Source of Truth`.

Notification nên có:
- recipient.
- sender.
- type.
- title/message.
- targetUrl.
- sourceType/sourceId.
- read state.

Idempotency:
- Tránh duplicate notification theo source type/source id/event.
- Không rollback business transaction vì notification side effect fail.

## 10. Realtime Qua WebSocket

1. Frontend tạo STOMP client qua SockJS.
2. CONNECT gửi JWT trong header.
3. Backend WebSocket/STOMP phải validate JWT.
4. Client subscribe `/user/queue/notifications`.
5. Khi nhận realtime notification:
   - upsert notification list.
   - tăng unread count nếu chưa đọc.
   - hiện toast.
6. Nếu parse lỗi hoặc STOMP error, refresh unread count.

Provider value đã memo hóa; subscription có cleanup.

## 11. Email

Email là kênh độc lập/fallback.

Rule:
- Email gửi async.
- Email fail chỉ log, không rollback booking.
- Không đưa email vào booking transaction.
- Link email cần đúng domain/environment.
- Không log SMTP password hoặc secret.

Rủi ro đã biết:
- Cần verify frontend URL config cho email trước production email rollout.

## 12. Web Push

Subscribe:
1. Frontend lấy VAPID public key.
2. Browser tạo PushSubscription.
3. Frontend gửi endpoint, p256dh, auth, device info lên backend.

Send:
1. Backend tạo payload.
2. Backend gửi Web Push tới active subscriptions.
3. Retry giới hạn cho network/408/429/5xx.
4. 403/404/410 deactivate subscription và không retry.

PWA:
- Required notification gate chỉ áp dụng khi app chạy dạng installed PWA trên Android/iOS.
- Web không thể tự bật permission nếu user đã block; user phải bật lại trong Settings.

## 13. Scheduler Reminder/Completed

Chưa phải trọng tâm hiện tại. Nếu thêm scheduler:
- Không spam notification/email.
- Phải idempotent.
- Phải có sourceType/sourceId.
- Phải test timezone.

## 14. Docker Và Deploy

Production hiện tại:
- `build-prod.bat`: build frontend + package backend jar.
- `run.bat`: start `db`, `redis`, Spring Boot jar, Cloudflare Tunnel.
- `stop-prod.bat`: stop production.

Docker:
- MySQL/Redis được constrain để giảm RAM.
- Adminer không start mặc định trong production script.

Cloudflare:
- Web/API đều trỏ backend `8080`.
- Spring Boot serve SPA static files.
- Deep link refresh không 404 nhờ `SpaForwardController`.
