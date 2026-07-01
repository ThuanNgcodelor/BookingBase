**TÀI LIỆU THIẾT KẾ HỆ THỐNG**

**WEBSITE BOOKING PHÒNG HỌP & XE NỘI BỘ DOANH NGHIỆP**

_(Giải pháp thay thế một phần Base Booking - Đăng nhập Google Workspace)_

Phiên bản 1.0 - Tháng 07/2026

Người lập: Senior Solution Architect

# MỤC LỤC

# 1\. PHÂN TÍCH NGHIỆP VỤ

## 1.1. Bối cảnh

Doanh nghiệp hiện đang sử dụng Base Booking để đặt phòng họp và xe công tác. Chi phí duy trì, giới hạn tuỳ biến và dữ liệu không thuộc quyền kiểm soát nội bộ khiến công ty có nhu cầu xây dựng một hệ thống Booking nội bộ (Internal Booking Portal) để thay thế một phần chức năng đang dùng, tối ưu chi phí và chủ động về dữ liệu, quy trình.

## 1.2. Mục tiêu dự án

- Thay thế một phần chức năng đặt phòng và đặt xe của Base Booking, không cần đầy đủ tính năng, ưu tiên đơn giản, dễ dùng, dễ mở rộng về sau.
- Đăng nhập một chạm bằng Google Workspace (OAuth2), tận dụng dữ liệu nhân sự có sẵn trên Google (avatar, họ tên, email, bộ phận, chức vụ), không nhập liệu lại.
- Chuẩn hoá quy trình duyệt booking theo cấp bậc quản lý, có lịch sử thay đổi minh bạch.
- Giảm tình trạng trùng lịch phòng/xe, tăng hiệu suất sử dụng tài nguyên nội bộ.
- Cung cấp số liệu thống kê phục vụ quản trị (báo cáo, dashboard BI).
- Chỉ phục vụ nhân viên nội bộ công ty, không public ra ngoài.

## 1.3. Phạm vi (Scope)

Trong phạm vi (In-scope): Booking phòng họp, Booking xe công tác, Dashboard, Calendar tổng hợp, Workflow duyệt, Email/Notification, Quản trị danh mục, Báo cáo, Nhật ký hệ thống, Phân quyền, Tìm kiếm.

Ngoài phạm vi (Out-of-scope ở giai đoạn đầu): Tích hợp thanh toán, đặt dịch vụ ăn uống/catering, tích hợp chấm công, ứng dụng di động native (chỉ Responsive Web), tích hợp đa công ty/đa chi nhánh phức tạp.

## 1.4. Đối tượng sử dụng

| **Đối tượng**         | **Mô tả**                                                                  | **Nhu cầu chính**                                        |
| --------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| Nhân viên             | Toàn bộ nhân viên công ty có tài khoản Google Workspace                    | Đặt phòng, đặt xe, xem lịch, nhận thông báo              |
| Người quản lý duyệt   | Trưởng/phó phòng phụ trách phòng họp hoặc xe được cấu hình làm người duyệt | Duyệt/từ chối booking, xem lịch của bộ phận              |
| Quản trị viên (Admin) | IT/HCNS phụ trách vận hành hệ thống                                        | Quản trị danh mục, phân quyền, báo cáo, nhật ký hệ thống |

# 2\. USER FLOW (LUỒNG NGƯỜI DÙNG)

## 2.1. Luồng đăng nhập

- Nhân viên truy cập Website nội bộ → Chọn 'Đăng nhập bằng Google'
- Hệ thống chuyển hướng sang Google OAuth2 Consent Screen (giới hạn domain công ty)
- Google trả về profile: họ tên, email, avatar, đơn vị (lấy qua Google Admin Directory API / Google Groups ánh xạ Phòng ban, Chức vụ)
- Hệ thống kiểm tra tài khoản đã tồn tại trong bảng User chưa: nếu chưa → tự động tạo mới (provisioning) với Role mặc định 'Nhân viên'; nếu có → cập nhật lại thông tin đồng bộ mới nhất
- Điều hướng vào Dashboard cá nhân

## 2.2. Luồng đặt phòng (happy path)

- Nhân viên vào 'Booking Phòng' → chọn phòng từ danh sách hoặc từ Calendar
- Xem lịch phòng theo ngày/tuần/tháng để kiểm tra khung giờ trống
- Nhấn 'Đặt phòng' → điền form (mục đích, thời gian bắt đầu/kết thúc, số người tham dự, ghi chú)
- Hệ thống kiểm tra trùng lịch real-time (validate trước khi submit)
- Booking được tạo với trạng thái 'Chờ duyệt' (Pending Approval), gửi email + notification cho người duyệt phòng
- Người duyệt xem chi tiết → Duyệt hoặc Từ chối (kèm lý do)
- Hệ thống gửi email + notification kết quả cho người đặt
- Đến giờ họp, hệ thống tự động nhắc trước (VD 15 phút) → sau khi kết thúc, booking tự chuyển 'Hoàn thành'

## 2.3. Luồng đặt xe (happy path)

- Nhân viên vào 'Booking Xe' → xem danh sách xe (biển số, loại xe, số chỗ, tài xế, trạng thái)
- Chọn xe còn trống → điền form: mục đích, điểm đi, điểm đến, thời gian bắt đầu/kết thúc, người đi cùng, ghi chú
- Hệ thống kiểm tra xe đã có người đặt trùng khung giờ chưa
- Booking chuyển trạng thái 'Chờ duyệt' → gửi email/notification cho người duyệt xe (thường là quản lý hành chính)
- Người duyệt Duyệt/Từ chối → hệ thống thông báo cho tài xế và người đặt
- Kết thúc chuyến đi → cập nhật trạng thái 'Hoàn thành', xe trở lại trạng thái sẵn sàng

# 3\. DANH SÁCH MODULE HỆ THỐNG

| **#** | **Module**                   | **Mô tả ngắn**                                     |
| ----- | ---------------------------- | -------------------------------------------------- |
| 1     | Authentication               | Đăng nhập Google OAuth2, đồng bộ hồ sơ nhân viên   |
| 2     | Booking Phòng                | Quản lý phòng họp, lịch, đặt/sửa/hủy               |
| 3     | Booking Xe                   | Quản lý xe, tài xế, đặt/sửa/hủy chuyến             |
| 4     | Dashboard                    | Trang tổng quan theo thời gian thực                |
| 5     | Calendar tổng hợp            | Lịch chung phòng + xe theo ngày/tuần/tháng         |
| 6     | Workflow duyệt               | Quy trình trạng thái booking, lịch sử thay đổi     |
| 7     | Email Notification           | Gửi email theo sự kiện                             |
| 8     | Notification trong app       | Chuông thông báo, badge, lịch sử                   |
| 9     | Quản trị (Admin)             | Danh mục phòng, xe, người quản lý, quyền, mục đích |
| 10    | Báo cáo & Thống kê           | Báo cáo theo tháng/phòng/xe/phòng ban/người dùng   |
| 11    | Nhật ký hệ thống (Audit Log) | Lưu vết tạo/sửa/duyệt                              |
| 12    | Phân quyền (RBAC)            | Admin / Manager / Employee                         |
| 13    | Tìm kiếm                     | Tìm booking theo nhiều tiêu chí                    |

# 4\. DANH SÁCH CHỨC NĂNG TỪNG MODULE

## 4.1. Module Booking Phòng

- Danh sách phòng: tên phòng, sức chứa, vị trí (tầng/toà nhà), thiết bị (máy chiếu, TV, loa...), ảnh phòng, trạng thái hoạt động
- Xem lịch phòng theo ngày / tuần / tháng dạng Calendar (kéo-thả để chọn khung giờ)
- Kiểm tra trùng lịch tự động (real-time validate trước khi submit form)
- Đặt phòng: mục đích, tiêu đề cuộc họp, thời gian bắt đầu/kết thúc, số người tham dự, người tham dự (chọn từ danh bạ Google), ghi chú, đính kèm (tuỳ chọn)
- Chỉnh sửa booking (chỉ khi ở trạng thái Draft/Pending hoặc trong quyền hạn cho phép trước giờ họp X phút)
- Hủy booking (kèm lý do hủy, hoàn trả slot lịch)
- Người quản lý phòng duyệt booking thuộc phòng mình phụ trách (cấu hình 1 phòng có 1 hoặc nhiều người duyệt, duyệt theo thứ tự hoặc duyệt song song)
- Email/Notification tự động theo từng mốc trạng thái

## 4.2. Module Booking Xe

- Danh sách xe: biển số, loại xe (4/7/16/45 chỗ...), số chỗ, tài xế phụ trách, trạng thái (sẵn sàng/đang sử dụng/bảo trì)
- Đặt xe: người đặt (tự động lấy từ tài khoản đăng nhập), mục đích, điểm đi, điểm đến, thời gian bắt đầu/kết thúc, danh sách người đi cùng, ghi chú
- Kiểm tra xe đã có người đặt trùng khung giờ chưa (bao gồm cả thời gian dự phòng di chuyển nếu cấu hình buffer)
- Chỉnh sửa / hủy chuyến đi
- Quy trình duyệt bởi người quản lý xe (thường là Admin hành chính hoặc trưởng bộ phận)
- Gán/đổi tài xế cho chuyến đi (do Admin hoặc người duyệt thực hiện)
- Cập nhật trạng thái xe tự động theo lịch (đang sử dụng/sẵn sàng)

## 4.3. Module Dashboard

- Số xe đang được sử dụng / tổng số xe
- Số phòng đang sử dụng / tổng số phòng
- Danh sách booking hôm nay (phòng + xe)
- Danh sách booking sắp tới (trong 24-48h)
- Danh sách booking đang chờ duyệt (dành cho người duyệt)
- Booking của tôi (lịch sử & sắp tới của người đang đăng nhập)
- Widget thống kê nhanh: tỷ lệ sử dụng phòng/xe trong tuần

## 4.4. Module Calendar tổng hợp

- Lịch tổng hợp hiển thị song song Phòng và Xe (có thể lọc riêng từng loại)
- Chuyển đổi chế độ xem: Ngày / Tuần / Tháng
- Lọc theo phòng ban, theo phòng cụ thể, theo xe cụ thể, theo trạng thái
- Màu sắc phân biệt theo trạng thái booking (Pending/Approved/Rejected/Completed)
- Click vào sự kiện xem nhanh chi tiết (popup) không cần chuyển trang

## 4.5. Module Workflow duyệt

- Định nghĩa trạng thái chuẩn cho mọi booking (xem chi tiết Mục 9)
- Cấu hình người duyệt theo từng phòng/xe (1 cấp hoặc nhiều cấp)
- Hiển thị lịch sử thay đổi trạng thái: ai tạo, ai duyệt/từ chối, thời gian, lý do
- Cho phép Admin can thiệp ghi đè trạng thái trong trường hợp đặc biệt (có ghi log)

## 4.6. Module Email Notification

- Email khi tạo booking mới (gửi người đặt xác nhận đã ghi nhận + gửi người duyệt yêu cầu duyệt)
- Email khi booking được duyệt
- Email khi booking bị từ chối (kèm lý do)
- Email nhắc trước giờ sử dụng (cấu hình được số phút/giờ nhắc trước)
- Email khi booking hoàn thành / khi booking bị hủy
- Email tổng hợp định kỳ cho quản lý (tuỳ chọn, VD báo cáo tuần)

## 4.7. Module Notification trong Website

- Chuông thông báo có badge đếm số lượng chưa đọc
- Danh sách thông báo dạng dropdown/panel, phân loại theo module (Phòng/Xe/Hệ thống)
- Đánh dấu đã đọc / đọc tất cả
- Lịch sử thông báo (xem lại thông báo cũ)
- Điều hướng nhanh: click thông báo → mở chi tiết booking liên quan

## 4.8. Module Quản trị

- Quản lý Phòng: thêm/sửa/xoá, cấu hình sức chứa, thiết bị, người duyệt phụ trách
- Quản lý Xe: thêm/sửa/xoá, cấu hình loại xe, tài xế, người duyệt phụ trách
- Quản lý Loại xe (danh mục)
- Quản lý Người quản lý duyệt (gán quyền duyệt theo phòng/xe/phòng ban)
- Quản lý Quyền (Role & Permission)
- Quản lý Danh mục mục đích sử dụng (Purpose Category): họp nội bộ, họp khách hàng, công tác, đưa đón...
- Cấu hình hệ thống: thời gian buffer, số phút nhắc email, số ngày tối đa được đặt trước...

## 4.9. Module Báo cáo & Thống kê

- Báo cáo theo tháng: tổng số booking, tỷ lệ duyệt/từ chối, tỷ lệ hủy
- Báo cáo theo phòng: tần suất sử dụng, giờ cao điểm
- Báo cáo theo xe: quãng thời gian sử dụng, tần suất, xe ít/nhiều dùng
- Báo cáo theo phòng ban: mức độ sử dụng tài nguyên theo từng bộ phận
- Top người sử dụng nhiều nhất (phòng/xe)
- Biểu đồ tần suất sử dụng theo thời gian (Dashboard BI: bar chart, line chart, heatmap)
- Xuất báo cáo Excel/PDF

## 4.10. Module Nhật ký hệ thống (Audit Log)

- Ghi nhận: Ai tạo booking, thời gian tạo
- Ghi nhận: Ai sửa, nội dung sửa (trước/sau), thời gian
- Ghi nhận: Ai duyệt/từ chối, lý do, thời gian
- Ghi nhận thao tác quản trị (thêm/sửa/xoá danh mục, đổi quyền)
- Cho phép Admin tra cứu, lọc theo người dùng/module/thời gian

## 4.11. Module Tìm kiếm

- Tìm theo người đặt, theo phòng, theo xe, theo biển số
- Tìm theo khoảng ngày, theo trạng thái
- Kết hợp nhiều điều kiện lọc (combo filter)
- Tìm kiếm nhanh (global search) trên thanh điều hướng

# 5\. DANH SÁCH ROLE (VAI TRÒ)

| **Role**                  | **Mô tả**                                                        | **Phạm vi truy cập**                                                          |
| ------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Admin (Quản trị hệ thống) | IT/HCNS vận hành toàn hệ thống                                   | Toàn quyền: danh mục, phân quyền, báo cáo, nhật ký, ghi đè trạng thái booking |
| Manager (Người duyệt)     | Trưởng/phó phòng được gán làm người quản lý phòng hoặc xe cụ thể | Duyệt/từ chối booking thuộc phạm vi phụ trách, xem báo cáo phạm vi phụ trách  |
| Employee (Nhân viên)      | Toàn bộ nhân viên có tài khoản Google Workspace                  | Đặt/sửa/hủy booking của bản thân, xem lịch, nhận thông báo                    |

Ghi chú: một tài khoản có thể vừa là Employee vừa là Manager (VD: Trưởng phòng vừa tự đặt phòng cho mình, vừa duyệt booking của nhân viên trong bộ phận). Hệ thống dùng mô hình gán quyền theo phạm vi (scope-based), không giới hạn 1 người 1 role duy nhất.

# 6\. DANH SÁCH PERMISSION (MA TRẬN PHÂN QUYỀN)

| **Chức năng**                              | **Admin** | **Manager**                 | **Employee**        |
| ------------------------------------------ | --------- | --------------------------- | ------------------- |
| Xem danh sách phòng/xe                     | ✔         | ✔                           | ✔                   |
| Xem lịch (Calendar)                        | ✔         | ✔                           | ✔                   |
| Tạo booking mới                            | ✔         | ✔                           | ✔                   |
| Sửa booking của chính mình                 | ✔         | ✔                           | ✔                   |
| Sửa booking của người khác                 | ✔         | ✘ (trừ khi được gán)        | ✘                   |
| Hủy booking của chính mình                 | ✔         | ✔                           | ✔                   |
| Duyệt / Từ chối booking                    | ✔         | ✔ (thuộc phạm vi phụ trách) | ✘                   |
| Ghi đè trạng thái booking                  | ✔         | ✘                           | ✘                   |
| Quản lý danh mục Phòng/Xe/Loại xe/Mục đích | ✔         | ✘                           | ✘                   |
| Quản lý người quản lý duyệt & phân quyền   | ✔         | ✘                           | ✘                   |
| Xem báo cáo toàn hệ thống                  | ✔         | ✘ (chỉ phạm vi phụ trách)   | ✘                   |
| Xem báo cáo cá nhân                        | ✔         | ✔                           | ✔                   |
| Xem Nhật ký hệ thống (Audit Log)           | ✔         | ✘                           | ✘                   |
| Tìm kiếm nâng cao (toàn hệ thống)          | ✔         | ✔ (phạm vi phụ trách)       | ✔ (booking cá nhân) |

# 7\. DANH SÁCH ENTITY (THỰC THỂ DỮ LIỆU)

| **Entity**         | **Mô tả**                                        | **Thuộc tính chính (rút gọn)**                                                                       |
| ------------------ | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| User               | Tài khoản nhân viên, đồng bộ từ Google Workspace | id, google_id, full_name, email, avatar_url, department, position, role, status, created_at          |
| Department         | Phòng ban                                        | id, name, parent_department_id                                                                       |
| Room               | Phòng họp                                        | id, name, location, capacity, equipment, image_url, status, manager_ids                              |
| Vehicle            | Xe công ty                                       | id, license_plate, vehicle_type_id, seat_count, driver_id, status                                    |
| VehicleType        | Loại xe (danh mục)                               | id, name, description                                                                                |
| Driver             | Tài xế                                           | id, full_name, phone, license_number, status                                                         |
| BookingRoom        | Đơn đặt phòng                                    | id, room_id, requester_id, title, purpose_id, start_time, end_time, attendee_count, note, status     |
| BookingCar         | Đơn đặt xe                                       | id, vehicle_id, requester_id, purpose_id, departure, destination, start_time, end_time, note, status |
| BookingParticipant | Người tham dự / đi cùng gắn với một booking      | id, booking_id, booking_type, user_id                                                                |
| ApprovalStep       | Bước duyệt trong quy trình                       | id, booking_id, booking_type, approver_id, level, action, reason, acted_at                           |
| PurposeCategory    | Danh mục mục đích sử dụng                        | id, name, apply_to (room/car/both)                                                                   |
| Notification       | Thông báo trong hệ thống                         | id, user_id, type, title, content, is_read, ref_id, created_at                                       |
| EmailLog           | Nhật ký email đã gửi                             | id, to_email, template, ref_id, status, sent_at                                                      |
| AuditLog           | Nhật ký hệ thống                                 | id, actor_id, action, entity, entity_id, before_data, after_data, created_at                         |
| Role               | Vai trò hệ thống                                 | id, name, description                                                                                |
| Permission         | Quyền chi tiết gắn với Role                      | id, role_id, module, action                                                                          |

# 8\. QUAN HỆ GIỮA CÁC ENTITY (ERD MÔ TẢ)

- User (1) - (N) BookingRoom: một nhân viên có thể tạo nhiều đơn đặt phòng (requester_id)
- User (1) - (N) BookingCar: một nhân viên có thể tạo nhiều đơn đặt xe
- Room (1) - (N) BookingRoom: một phòng có nhiều lượt đặt theo thời gian
- Vehicle (1) - (N) BookingCar: một xe có nhiều lượt đặt theo thời gian
- VehicleType (1) - (N) Vehicle: một loại xe áp dụng cho nhiều xe
- Driver (1) - (N) Vehicle: một tài xế có thể phụ trách nhiều xe (hoặc gán theo từng chuyến)
- Department (1) - (N) User: một phòng ban có nhiều nhân viên; Department có thể tự tham chiếu (parent_department_id) để tạo cây tổ chức
- Room (N) - (N) User (qua bảng trung gian Room_Manager): một phòng có thể có nhiều người duyệt, một người có thể duyệt nhiều phòng
- Vehicle (N) - (N) User (qua bảng trung gian Vehicle_Manager): tương tự cơ chế người duyệt của Room
- BookingRoom / BookingCar (1) - (N) ApprovalStep: mỗi booking có thể có một hoặc nhiều bước duyệt (duyệt nhiều cấp)
- BookingRoom / BookingCar (1) - (N) BookingParticipant: một booking có nhiều người tham dự/đi cùng
- BookingRoom / BookingCar (N) - (1) PurposeCategory: nhiều booking dùng chung một mục đích
- User (1) - (N) Notification: một người dùng nhận nhiều thông báo
- BookingRoom / BookingCar (1) - (N) EmailLog: mỗi thay đổi trạng thái có thể phát sinh một bản ghi email log
- User (1) - (N) AuditLog (với vai trò actor): mọi thao tác của người dùng đều được ghi log
- Role (1) - (N) Permission: một vai trò có nhiều quyền chi tiết theo module/action

_Ghi chú thiết kế: BookingRoom và BookingCar tách bảng riêng (thay vì gộp chung 1 bảng Booking đa hình) để đơn giản hoá logic nghiệp vụ đặc thù (phòng cần attendee_count, xe cần departure/destination). ApprovalStep và BookingParticipant dùng chung cho cả hai loại booking qua cặp (ref_id, booking_type) để tránh trùng lặp cấu trúc._

# 9\. LUỒNG BOOKING (BOOKING FLOW)

## 9.1. Luồng đặt phòng

- Người dùng chọn phòng + khung giờ trên Calendar
- Hệ thống kiểm tra real-time: khung giờ có bị trùng với booking đã Approved hoặc đang Pending không → nếu trùng, cảnh báo ngay và gợi ý khung giờ trống gần nhất
- Người dùng xác nhận thông tin (mục đích, số người, ghi chú) → Submit
- Booking được tạo với status = Pending Approval; hệ thống khoá tạm (soft-lock) khung giờ để tránh 2 người submit cùng lúc (xử lý race-condition bằng transaction + unique constraint theo room_id + time range)
- Trigger gửi email + notification tới (các) người duyệt của phòng
- Người duyệt xử lý → Approved hoặc Rejected
- Hệ thống cập nhật trạng thái, ghi ApprovalStep, gửi email/notification kết quả
- Tới thời điểm bắt đầu: hệ thống có thể tự chuyển trạng thái hiển thị 'Đang diễn ra' trên Dashboard/Calendar (không đổi status chính, chỉ là cờ hiển thị)
- Sau thời điểm kết thúc: job định kỳ tự động chuyển Approved → Completed

## 9.2. Luồng đặt xe

- Người dùng chọn xe + điền thông tin chuyến đi (điểm đi/đến, thời gian, người đi cùng)
- Hệ thống kiểm tra trùng lịch xe (tương tự phòng, có cộng thêm buffer di chuyển nếu cấu hình)
- Booking status = Pending Approval → gửi thông báo người duyệt xe
- Người duyệt Approved/Rejected, có thể chỉ định/đổi tài xế khi duyệt
- Khi Approved, trạng thái Vehicle chuyển 'Đã đặt trước' → tới giờ khởi hành chuyển 'Đang sử dụng'
- Sau khi hoàn thành chuyến đi, Admin/tài xế xác nhận hoàn thành hoặc hệ thống tự động Completed theo end_time, Vehicle trở lại 'Sẵn sàng'

# 10\. LUỒNG DUYỆT (APPROVAL WORKFLOW)

## 10.1. Sơ đồ trạng thái

**Draft → Pending Approval → (Approved | Rejected) → Completed / Cancelled**

| **Trạng thái**   | **Ý nghĩa**                                                      | **Ai có thể chuyển trạng thái tiếp theo**                                              |
| ---------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Draft            | Nháp, chưa gửi duyệt (tuỳ chọn, có thể bỏ qua nếu muốn đơn giản) | Người đặt (Submit → Pending)                                                           |
| Pending Approval | Đã gửi, chờ người có thẩm quyền duyệt                            | Người duyệt (Approve/Reject); Người đặt (Cancel)                                       |
| Approved         | Đã được duyệt, tài nguyên được giữ chỗ                           | Hệ thống tự chuyển Completed khi hết giờ; Người đặt/Admin có thể Cancel trước giờ dùng |
| Rejected         | Bị từ chối, tài nguyên được giải phóng                           | Người đặt có thể tạo booking mới (không sửa lại booking cũ)                            |
| Completed        | Đã sử dụng xong                                                  | Trạng thái cuối, chỉ xem, không chỉnh sửa                                              |
| Cancelled        | Bị hủy bởi người đặt hoặc Admin trước khi diễn ra                | Trạng thái cuối                                                                        |

## 10.2. Quy tắc duyệt

- Mỗi Phòng/Xe được cấu hình sẵn (các) người duyệt trong module Quản trị.
- Hỗ trợ duyệt 1 cấp (mặc định) hoặc nhiều cấp (VD: Trưởng phòng duyệt trước, sau đó Admin hành chính duyệt xe > 16 chỗ).
- Nếu có nhiều người duyệt cùng cấp, chỉ cần 1 người duyệt là đủ (first-response-wins), trừ khi cấu hình yêu cầu duyệt toàn bộ.
- Người duyệt từ chối bắt buộc phải nhập lý do.
- Nếu quá thời gian quy định (SLA, VD 24h) mà chưa được duyệt, hệ thống gửi nhắc lại cho người duyệt và cảnh báo cho Admin.
- Toàn bộ hành động duyệt được ghi vào ApprovalStep + AuditLog, hiển thị dạng timeline trên chi tiết booking.

# 11\. LUỒNG EMAIL (EMAIL NOTIFICATION FLOW)

| **Sự kiện**            | **Người nhận**                           | **Nội dung chính**                                                  |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Tạo booking (submit)   | Người đặt + Người duyệt                  | Xác nhận đã ghi nhận / Yêu cầu duyệt kèm link chi tiết              |
| Booking được duyệt     | Người đặt (+ người tham dự nếu cấu hình) | Xác nhận đã duyệt, thông tin chi tiết, nút thêm vào Google Calendar |
| Booking bị từ chối     | Người đặt                                | Lý do từ chối, gợi ý đặt lại                                        |
| Nhắc trước giờ sử dụng | Người đặt (+ người tham dự/tài xế)       | Nhắc trước X phút/giờ, thông tin phòng/xe                           |
| Booking hoàn thành     | Người đặt                                | Xác nhận hoàn thành, (tuỳ chọn) form đánh giá nhanh                 |
| Booking bị hủy         | Người đặt + Người duyệt liên quan        | Thông báo hủy, lý do (nếu có)                                       |
| Quá SLA chưa duyệt     | Người duyệt + Admin                      | Cảnh báo nhắc duyệt gấp                                             |

Toàn bộ email dùng template HTML chuẩn hoá (logo công ty, màu thương hiệu), gửi qua hàng đợi (queue) để tránh chặn luồng chính; mỗi email gửi thành công/thất bại đều lưu vào EmailLog để tra soát.

# 12\. WIREFRAME MÔ TẢ TỪNG MÀN HÌNH

| **Màn hình**                 | **Mô tả bố cục**                                                                                                                                                                                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Màn hình Đăng nhập           | Logo công ty ở giữa, nút 'Đăng nhập bằng Google', không có form nhập tay.                                                                                                                                                                                                     |
| Dashboard                    | Header (avatar, tên, badge thông báo) → Hàng thẻ số liệu (Xe đang dùng, Phòng đang dùng, Booking hôm nay, Chờ duyệt) → 2 cột: 'Booking sắp tới' và 'Booking của tôi' → Mini calendar góc phải.                                                                                |
| Danh sách Phòng              | Bộ lọc trên cùng (sức chứa, toà nhà, trạng thái) → Grid dạng card: ảnh phòng, tên, sức chứa, trạng thái hiện tại (Trống/Đang họp) → nút 'Xem lịch' và 'Đặt ngay' trên mỗi card.                                                                                               |
| Lịch phòng (Calendar)        | Thanh chuyển đổi Ngày/Tuần/Tháng ở trên → Lưới thời gian dạng cột theo phòng (view tuần) hoặc theo giờ trong ngày → Click ô trống mở nhanh form đặt; click sự kiện mở popup chi tiết.                                                                                         |
| Form đặt phòng               | Modal/side-panel gồm: tên phòng (readonly), tiêu đề cuộc họp, mục đích (dropdown danh mục), thời gian bắt đầu/kết thúc (date-time picker có kiểm tra trùng lịch ngay khi chọn), số người tham dự, chọn người tham dự (autocomplete từ danh bạ), ghi chú, nút Hủy/Gửi yêu cầu. |
| Danh sách Xe                 | Bảng/grid: biển số, loại xe, số chỗ, tài xế, trạng thái (badge màu) → nút 'Đặt xe' theo từng dòng.                                                                                                                                                                            |
| Form đặt xe                  | Modal gồm: chọn xe (hoặc để hệ thống tự gợi ý xe trống phù hợp số người), mục đích, điểm đi, điểm đến, thời gian bắt đầu/kết thúc, danh sách người đi cùng, ghi chú.                                                                                                          |
| Trang duyệt (Approval Inbox) | Danh sách dạng tab 'Chờ duyệt của tôi' / 'Đã duyệt' → mỗi dòng: người đặt, loại (phòng/xe), thời gian, mục đích → click mở chi tiết có 2 nút lớn Duyệt/Từ chối, ô nhập lý do khi từ chối.                                                                                     |
| Chi tiết Booking             | Thông tin đầy đủ booking ở trên, timeline lịch sử trạng thái (ApprovalStep) ở dưới dạng vertical stepper, khu vực bình luận/ghi chú nội bộ (tuỳ chọn).                                                                                                                        |
| Notification Panel           | Dropdown từ icon chuông: danh sách thông báo mới nhất, phân nhóm 'Hôm nay'/'Trước đó', nút 'Đánh dấu đã đọc tất cả', link 'Xem tất cả' sang trang lịch sử đầy đủ.                                                                                                             |
| Trang Quản trị               | Sidebar menu: Phòng, Xe, Loại xe, Người quản lý, Quyền, Danh mục mục đích, Cấu hình hệ thống → mỗi mục là bảng CRUD chuẩn (danh sách, tìm kiếm, thêm/sửa/xoá).                                                                                                                |
| Trang Báo cáo                | Bộ lọc (khoảng thời gian, phòng ban, loại tài nguyên) → khu vực biểu đồ (cột/đường/heatmap) → bảng chi tiết bên dưới → nút xuất Excel/PDF.                                                                                                                                    |
| Trang Tìm kiếm               | Thanh tìm kiếm + bộ lọc nâng cao (người đặt, phòng, xe, biển số, ngày, trạng thái) → kết quả dạng bảng có phân trang.                                                                                                                                                         |

# 13\. ROADMAP TRIỂN KHAI: MVP → V2 → V3

## 13.1. MVP (Giai đoạn 1 - mục tiêu 6-8 tuần)

- Đăng nhập Google OAuth2, tự động tạo/đồng bộ hồ sơ nhân viên
- Module Booking Phòng: danh sách, calendar tuần/tháng, đặt/sửa/hủy, kiểm tra trùng lịch
- Module Booking Xe: danh sách, đặt/sửa/hủy, kiểm tra trùng lịch
- Workflow duyệt 1 cấp cho cả phòng và xe
- Email notification cho các mốc: tạo, duyệt, từ chối, nhắc giờ, hoàn thành
- Dashboard cơ bản (4 thẻ số liệu + 2 danh sách)
- Phân quyền Admin/Manager/Employee (RBAC cơ bản)
- Quản trị danh mục cơ bản: Phòng, Xe, Loại xe, Người quản lý, Mục đích
- Nhật ký hệ thống cơ bản (tạo/sửa/duyệt)

## 13.2. Version 2 (Giai đoạn 2 - mục tiêu 4-6 tuần sau MVP)

- Calendar tổng hợp Phòng + Xe trên cùng một màn hình, lọc nâng cao
- Notification trong app (chuông, badge, lịch sử) - real-time qua WebSocket/SSE
- Báo cáo & Dashboard BI đầy đủ (biểu đồ, top user, tần suất, xuất Excel/PDF)
- Tìm kiếm nâng cao đa điều kiện
- Duyệt nhiều cấp, cấu hình SLA nhắc duyệt
- Dark Mode, tối ưu Mobile Responsive đầy đủ
- Đồng bộ hai chiều với Google Calendar (booking hiển thị trên Google Calendar cá nhân)

## 13.3. Version 3 (Giai đoạn 3 - mở rộng dài hạn)

- Booking định kỳ (recurring booking) cho họp lặp lại hàng tuần
- QR code check-in phòng họp, tự động giải phóng phòng nếu không check-in
- Tích hợp Slack/Zalo/Microsoft Teams gửi thông báo song song email
- Chức năng ủy quyền duyệt (delegate approver) khi người duyệt vắng mặt
- Quản lý bảo trì phòng/xe (maintenance mode) chặn đặt trong thời gian bảo trì
- Gợi ý phòng/xe thông minh dựa trên lịch sử sử dụng và sức chứa cần thiết
- App di động (PWA nâng cao hoặc native) nếu nhu cầu thực tế phát sinh
- Phân tích chi phí sử dụng xe theo phòng ban (cost center) phục vụ đối soát ngân sách

# 14\. DANH SÁCH RỦI RO KHI TRIỂN KHAI

| **Rủi ro**                                       | **Mô tả**                                                                          | **Biện pháp giảm thiểu**                                                                      |
| ------------------------------------------------ | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Race condition khi đặt trùng lịch                | Hai người submit cùng lúc cùng một khung giờ                                       | Dùng transaction + unique constraint / khoá tạm (soft-lock) ở tầng database                   |
| Đồng bộ dữ liệu Google Workspace không chính xác | Bộ phận/chức vụ không map đúng nếu cấu trúc Google Groups/Org Unit không chuẩn hoá | Chuẩn hoá cấu trúc Org Unit trước khi triển khai, có cơ chế Admin chỉnh tay khi cần           |
| Nghẽn quy trình duyệt                            | Người duyệt vắng mặt/không phản hồi làm chậm toàn bộ booking                       | Cấu hình SLA nhắc tự động, cho phép nhiều người duyệt cùng cấp, tính năng ủy quyền duyệt (V3) |
| Spam thông báo/email                             | Gửi quá nhiều email khiến người dùng bỏ qua thông báo quan trọng                   | Gộp nhóm thông báo, cho phép tuỳ chỉnh tần suất nhận email                                    |
| Người dùng ngại chuyển đổi từ Base Booking       | Thói quen cũ, thiếu tính năng quen thuộc                                           | Đào tạo, truyền thông nội bộ, giữ MVP đơn giản, thu thập phản hồi sớm                         |
| Bảo mật dữ liệu nội bộ                           | Dữ liệu nhân sự, lịch trình di chuyển là thông tin nhạy cảm                        | Giới hạn OAuth theo domain công ty, phân quyền chặt, mã hoá dữ liệu nhạy cảm, HTTPS bắt buộc  |
| Xung đột múi giờ/định dạng ngày giờ              | Nếu công ty có chi nhánh khác múi giờ                                              | Chuẩn hoá lưu UTC ở backend, hiển thị theo timezone người dùng                                |
| Thiếu cơ chế xử lý no-show                       | Người đặt không đến làm phòng/xe bị 'khoá ảo'                                      | Cấu hình auto-cancel nếu không check-in trong X phút (V2/V3)                                  |
| Single point of failure ở người duyệt            | Chỉ 1 người duyệt nghỉ phép gây tắc nghẽn toàn phòng ban                           | Bắt buộc cấu hình tối thiểu 2 người duyệt cho mỗi phòng/xe quan trọng                         |
| Leo thang phạm vi (scope creep)                  | Yêu cầu bổ sung liên tục làm trễ MVP                                               | Chốt rõ phạm vi MVP, các đề xuất mới đưa vào backlog V2/V3                                    |

# 15\. CHỨC NĂNG NÊN CÓ NHƯNG THƯỜNG BỊ BỎ QUÊN

- Buffer time giữa hai booking liên tiếp (VD: 10-15 phút dọn phòng, chuẩn bị xe) để tránh chồng chéo thực tế dù lịch không trùng.
- Giới hạn số lượng booking tối đa mỗi người/mỗi ngày hoặc mỗi tuần, tránh giữ chỗ tràn lan.
- Giới hạn số ngày được đặt trước tối đa (VD không cho đặt xa hơn 60 ngày) để tránh giữ chỗ quá lâu.
- Cơ chế auto-cancel/nhắc nhở khi không check-in hoặc không có hoạt động thực tế (no-show).
- Ủy quyền duyệt tạm thời khi người duyệt nghỉ phép/công tác.
- Đánh giá/phản hồi nhanh sau khi sử dụng phòng/xe (rating, báo cáo sự cố như phòng bẩn, xe hư).
- Chế độ bảo trì (maintenance mode) cho phòng/xe tạm ngưng phục vụ, tự động chặn đặt trong khoảng thời gian đó.
- Đặt booking định kỳ/lặp lại (recurring) cho các cuộc họp cố định hàng tuần.
- Xử lý xung đột khi hai người có quyền ngang nhau cùng sửa một booking (concurrency/optimistic locking).
- Giao diện dành riêng cho tài xế (xem lịch trình được giao trong ngày, xác nhận hoàn thành chuyến).
- Thông báo trước cho lễ tân/bảo vệ khi có khách ngoài công ty tham dự cuộc họp (nếu có tích hợp).
- Chính sách hủy trễ (late cancellation policy) và thống kê tỷ lệ hủy trễ theo từng nhân viên/bộ phận.
- Khả năng in/xuất lịch phòng dạng bảng hiển thị trước cửa phòng họp (màn hình tablet gắn tường - mở rộng tương lai).
- Cơ chế phân biệt rõ 'phòng đang có người dùng thực tế' và 'phòng chỉ được đặt nhưng chưa ai vào' trên Dashboard.
- Tùy chọn đặt phòng/xe thay mặt người khác (book on behalf of) dành cho trợ lý/lễ tân.

# GHI CHÚ TRIỂN KHAI

Toàn bộ quy trình nghiệp vụ, nhãn trạng thái, nội dung email và giao diện nên được xây dựng bằng tiếng Việt xuyên suốt, phù hợp với người dùng nội bộ là nhân viên Việt Nam. Định dạng ngày giờ theo chuẩn dd/MM/yyyy HH:mm, đơn vị tiền tệ (nếu phát sinh ở giai đoạn V3) theo VNĐ.

Đề xuất công nghệ tham khảo (không bắt buộc): Backend Spring Boot 4.0.0 (Java), Frontend React (Vite - JavaScript) / Vue, Database MySQL, xác thực Google OAuth2, Queue/Redis cho email, WebSocket/SSE cho notification real-time, triển khai trên hạ tầng nội bộ hoặc cloud riêng của công ty để đảm bảo dữ liệu không rời khỏi phạm vi kiểm soát.