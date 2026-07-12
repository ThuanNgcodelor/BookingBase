# Trạng Thái Công Việc Hiện Tại

Cập nhật lần cuối: 2026-07-12

## Mục Đích

File này là context bàn giao ngắn cho các phiên Codex sau. Khi mở chat mới, hãy đính kèm file này để AI nắm nhanh: đang làm tới đâu, phần nào đã xong, phần nào còn rủi ro, và file nào quan trọng.

## Trọng Tâm Hiện Tại

- BookingBase đã được tối ưu hướng chạy production/local để tránh chạy Node/Vite preview trong production.
- Hướng production hiện tại: build frontend trước, sau đó package `frontend/dist` vào Spring Boot jar.
- `run.bat` hiện là production starter. Nó không build, không chạy `npm install`, không chạy `npm run build`.

## Mô Hình Chạy

### Test / Development Bình Thường

- Có thể tiếp tục test frontend/backend riêng như trước.
- Frontend test/build: chạy `npm.cmd run build` trong thư mục `frontend`.
- Backend test/run: chạy riêng trong thư mục `backend`.

### Luồng Production

1. Test code bình thường.
2. Chạy `build-prod.bat`.
3. Nếu production cũ đang chạy, chạy `stop-prod.bat`.
4. Chạy `run.bat`.

### Ý Nghĩa Script

- `build-prod.bat`: build frontend `dist`, sau đó package backend jar kèm static assets của frontend.
- `run.bat`: bật Docker `db` + `redis`, chạy Spring Boot jar với profile `prod` và giới hạn RAM, sau đó bật Cloudflare Tunnel nếu có.
- `stop-prod.bat`: tắt cửa sổ backend/tunnel production và stop Docker `db` + `redis`.

## Kiến Trúc Production

- Frontend static files được Spring Boot serve từ jar đã package.
- Backend API vẫn nằm dưới `/api/v1/**`.
- SPA deep link được forward về `index.html` bằng `SpaForwardController`.
- Cloudflare domain trỏ về backend port `8080`:
  - `https://cfcbooking.io.vn`
  - `https://www.cfcbooking.io.vn`
  - `https://api.cfcbooking.io.vn`
- `npm run preview` không còn nằm trong production startup path.

## File Quan Trọng

- `run.bat`
- `build-prod.bat`
- `stop-prod.bat`
- `docker-compose.yml`
- `cloudflared-config.yml`
- `backend/pom.xml`
- `backend/src/main/resources/application-prod.yml`
- `backend/src/main/java/com/booking/system/controller/SpaForwardController.java`
- `backend/src/main/java/com/booking/system/config/SecurityConfig.java`
- `frontend/vite.config.js`

## Tổng Hợp Việc Đã Làm

### Approval / Reject Reason

- Approve/reject lấy người xử lý từ authenticated principal, không tin body ID.
- Backend ignore `requesterId` / `approverId` giả mạo.
- Chỉ `ADMIN` hoặc `MANAGER` được approve/reject.
- Chuẩn hóa `reason` và legacy `note` để reject reason được lưu đúng.
- Approval steps trả về approver thật và reason.

### Calendar

- Range-based fetch có `AbortController` và request sequence guard.
- Calendar event mapping/filtering dùng `useMemo`.
- Khi chọn resource, API nhận `roomId` hoặc `vehicleId`.
- Responsive calendar hook xử lý resize/orientation.
- Event quá khứ vẫn giữ để xem lịch sử và có màu riêng.

### Notifications / WebSocket

- Notification provider value đã memo hóa.
- STOMP subscription có cleanup để tránh duplicate subscription.
- Unread count đã tách riêng context:
  - `NotificationUnreadContext`
  - `NotificationListContext`
- Navbar badge chỉ đọc unread count; dropdown mới đọc notification list.

### Web Push / PWA

- Push retry có giới hạn cho lỗi network/408/429/5xx.
- Lỗi permanent 403/404/410 deactivate subscription và không retry.
- Thêm bounded Spring async executor.
- Service Worker `NAVIGATE` listener chuyển ra React component global.
- Thêm offline navigation fallback.
- Không runtime-cache booking/API responses.
- PWA Android/iOS có thể hiện required notification gate sau login.

### Production Runtime

- Frontend `dist` được embed vào backend jar.
- Thêm Spring profile `prod` với compression, DB pool nhỏ hơn, Tomcat thread thấp hơn.
- Docker MySQL/Redis được constrain để giảm RAM.
- Adminer không chạy mặc định trong `run.bat`.

## Rủi Ro / Chưa Xong

- Backend test gần đây fail trên JDK 23 vì Mockito/ByteBuddy không self-attach được. Đây giống lỗi môi trường JDK/Mockito agent hơn là lỗi business-code. Nên dùng JDK 21 để test hoặc cấu hình Mockito Java agent.
- Frontend build vẫn warning main chunk lớn khoảng 750 KB.
- Chưa thêm/chạy Playwright mobile screenshots.
- PWA push và required notification gate cần test trên Android/iOS installed PWA thật.
- Email link/domain config vẫn là rủi ro cần verify trước production email rollout.
- Production secrets phải lấy từ environment variables, không dùng committed defaults.

## Lệnh Đã Verify Gần Đây

- `npm.cmd run build`: pass.
- `npm.cmd run lint`: pass, còn một warning cũ ở `CustomDateHeader.jsx`.
- `git diff --check`: pass, chỉ có warning LF/CRLF trên Windows.
- `.\mvnw.cmd test`: hiện fail trên máy này vì Mockito/ByteBuddy attach dưới JDK 23.

## Ghi Chú Crash Log

- `hs_err_pid*.log` và `replay_pid*.log` là JVM crash/debug files.
- Chúng không phải source code và không nên commit.
- `.gitignore` đã ignore `*.log`, nên JVM crash logs sau này sẽ bị Git bỏ qua.
- Nếu JVM crash lại, chỉ giữ file `hs_err_pid*.log` mới nhất khi cần debug crash.

## Docs Context Nên Đọc

- `docs/CURRENT_WORK_STATUS.md`
- `docs/AI_PROJECT_CONTEXT.md`
- `docs/PROJECT_FLOW.md`
- `docs/PERFORMANCE_AUDIT.md`
- `docs/OPTIMIZATION_EXECUTION_PLAN.md`

Các docs dài/cũ/trùng lặp đã được prune để giảm token cho AI. Dùng 5 file trên làm context set hiện tại.

## Bước Tiếp Theo Gợi Ý

1. Fix backend test environment bằng JDK 21 hoặc Mockito/ByteBuddy Java agent.
2. Sau khi test ổn, chạy `build-prod.bat`.
3. Chạy `run.bat` và verify:
   - `http://localhost:8080`
   - `https://cfcbooking.io.vn`
   - `https://api.cfcbooking.io.vn/api/v1/...`
4. Test PWA install/push trên Android và iOS.
5. Cân nhắc Playwright mobile screenshots cho `/rooms`, `/cars`, và PWA notification gate.
