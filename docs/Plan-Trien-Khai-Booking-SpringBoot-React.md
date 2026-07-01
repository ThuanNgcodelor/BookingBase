# KẾ HOẠCH TRIỂN KHAI
# Hệ thống Booking Phòng họp & Xe nội bộ — Spring Boot + React (Vite)

Dựa trên tài liệu thiết kế `Thiet-ke-He-thong-Booking-Noi-bo.md`, mục tiêu: MVP chạy được trong 6-8 tuần.

---

## 1. TECH STACK

**Backend**
- Java 21 + Spring Boot 4.0.0
- MySQL 8 + Spring Data JPA (Hibernate)
- Redis (session cache + BullMQ queue)
- BullMQ — queue gửi email
- Passport.js — `passport-google-oauth20`
- Socket.io — notification realtime (V2)
- Joi / Zod — validate API request
- Nodemailer + template HTML (hoặc SendGrid/SES nếu công ty đã có)

**Frontend**
- React 18 + Vite (JavaScript)
- TailwindCSS
- React Router
- TanStack Query (React Query) — gọi API, cache
- Zustand — state nhẹ (user, notification)
- react-hook-form + zod — form + validate
- FullCalendar hoặc react-big-calendar — lịch phòng/xe
- Recharts — biểu đồ báo cáo
- date-fns / dayjs — xử lý thời gian, timezone

**Hạ tầng**
- Docker + Docker Compose (dev & prod)
- Nginx reverse proxy + HTTPS (Let's Encrypt hoặc cert nội bộ)
- GitHub Actions — CI/CD build & deploy
- Triển khai: server nội bộ / VPS riêng công ty (ưu tiên vì yêu cầu dữ liệu không rời khỏi kiểm soát nội bộ)

---

## 2. CẤU TRÚC PROJECT (Monorepo)

```
booking-system/
├── backend/               # Spring Boot Project
│   ├── src/main/java/com/booking/system/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── entities/
│   │   ├── security/
│   │   └── dtos/
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
├── frontend/              # React (Vite) Project
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
```
├── docker-compose.dev.yml
└── .github/workflows/deploy.yml
```

---

## 3. DATA MODEL (Prisma schema — rút gọn theo Mục 7-8 tài liệu)

Thực thể chính: `User, Department, Room, Vehicle, VehicleType, Driver, BookingRoom, BookingCar, BookingParticipant, ApprovalStep, PurposeCategory, Notification, EmailLog, AuditLog, Role, Permission`

Điểm cần lưu ý khi thiết kế schema:
- `BookingRoom` và `BookingCar` tách bảng riêng (theo đúng ghi chú thiết kế trong tài liệu).
- `ApprovalStep`, `BookingParticipant` dùng chung qua cặp `(ref_id, booking_type)`.
- Check trùng lịch: dùng **transaction + row-level lock (SELECT ... FOR UPDATE)** hoặc **Redis Distributed Lock** — do MySQL không có tính năng EXCLUDE constraint như Postgres, việc xử lý chống overlapping (trùng lịch) cần được khoá chặt ở tầng DB (row lock) hoặc tầng cache (Redis) để tránh race-condition.

---

## 4. LỘ TRÌNH THEO SPRINT (Sprint 2 tuần/sprint, tổng 4 sprint = 8 tuần cho MVP)

### Sprint 0 — Setup (2-3 ngày, trước Sprint 1)
- Khởi tạo monorepo, Docker Compose (MySQL, Redis, API, Web)
- Cấu hình Google OAuth2 Console (domain restriction, redirect URI)
- Setup CI cơ bản (lint, build, test skeleton)
- Định nghĩa Entity (JPA) đầy đủ + tự động generate tables

### Sprint 1 — Auth + Nền tảng (Tuần 1-2)
- Đăng nhập Google OAuth2, tạo/đồng bộ hồ sơ nhân viên (provisioning)
- JWT session, middleware auth, RBAC cơ bản (Admin/Manager/Employee)
- Layout FE: Sidebar, Header, Dashboard rỗng, routing bảo vệ theo role
- Quản trị danh mục cơ bản: Room, Vehicle, VehicleType, Driver, PurposeCategory (CRUD)

### Sprint 2 — Booking Phòng + Xe (Tuần 3-4)
- API + UI: danh sách phòng/xe, calendar tuần/tháng (FullCalendar)
- Form đặt phòng / đặt xe + validate trùng lịch real-time
- Logic check trùng lịch với transaction + constraint DB
- Sửa/hủy booking theo điều kiện trạng thái

### Sprint 3 — Workflow duyệt + Email (Tuần 5-6)
- Approval Inbox: duyệt/từ chối 1 cấp, ghi ApprovalStep
- Trigger email qua BullMQ (tạo/duyệt/từ chối/nhắc giờ/hoàn thành) — template HTML
- Job định kỳ (cron): auto chuyển Approved → Completed, nhắc trước giờ họp
- Audit Log cơ bản (tạo/sửa/duyệt)

### Sprint 4 — Dashboard + Hoàn thiện MVP (Tuần 7-8)
- Dashboard: 4 thẻ số liệu + 2 danh sách (booking hôm nay/sắp tới)
- Kiểm thử toàn luồng, sửa bug, tối ưu UX form
- Responsive cơ bản, deploy staging, UAT với vài phòng ban thật
- Viết hướng dẫn sử dụng ngắn cho nhân viên

**→ Kết thúc Sprint 4: đủ điều kiện release MVP theo đúng scope Mục 13.1 trong tài liệu.**

### Sau MVP — V2 (4-6 tuần tiếp theo, không tính vào 8 tuần trên)
- Notification realtime (Socket.io), Calendar tổng hợp Phòng+Xe
- Báo cáo/Dashboard BI (Recharts), xuất Excel/PDF
- Duyệt nhiều cấp, SLA nhắc duyệt, đồng bộ 2 chiều Google Calendar

---

## 5. PHÂN CÔNG GỢI Ý (nếu team 2-3 người)

| Vai trò | Phụ trách |
|---|---|
| Fullstack Dev 1 | Backend: Auth, Booking Room/Car, Approval, Email queue |
| Fullstack Dev 2 | Frontend: Calendar, Form booking, Dashboard, Admin UI |
| Dev 3 (nếu có) / kiêm nhiệm | DevOps: Docker, CI/CD, Prisma schema, Notification, Audit Log |

Nếu chỉ có 1 dev: theo đúng thứ tự sprint ở trên, có thể kéo dài MVP lên 10-12 tuần.

---

## 6. DEPLOY

**Giai đoạn dev/staging (nhanh):**
- Docker Compose 1 lệnh: `docker compose up -d` (MySQL + Redis)
- Chạy Backend bằng Maven: `./mvnw spring-boot:run`
- Chạy Frontend bằng pnpm: `cd frontend && pnpm dev`
- Deploy thử trên Railway/Render nếu cần demo nhanh cho sếp duyệt trước khi đưa vào hạ tầng nội bộ

**Giai đoạn production (theo đúng yêu cầu bảo mật trong tài liệu):**
- Deploy trên VPS/server nội bộ công ty
- Nginx reverse proxy + HTTPS
- GitHub Actions: build Docker image → push → SSH deploy tự động khi merge vào `main`
- Backup MySQL tự động hàng ngày (cron + mysqldump)

---

## 7. RỦI RO KỸ THUẬT CẦN LƯU Ý SỚM (theo Mục 14 tài liệu)

- Race condition khi đặt trùng lịch → xử lý ngay từ Sprint 2 bằng DB constraint, không để tới cuối
- Timezone → chuẩn hoá lưu UTC ở DB từ đầu, convert ở FE
- Google Workspace Org Unit không chuẩn → cần xác nhận cấu trúc phòng ban với IT/HCNS trước Sprint 1
