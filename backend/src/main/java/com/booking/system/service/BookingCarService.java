package com.booking.system.service;

import com.booking.system.dto.BookingCarRequest;
import com.booking.system.entity.BookingCar;
import com.booking.system.entity.Vehicle;
import com.booking.system.entity.User;
import com.booking.system.enums.BookingStatus;
import com.booking.system.enums.NotificationPriority;
import com.booking.system.event.NotificationEvent;
import com.booking.system.repository.BookingCarRepository;
import com.booking.system.repository.VehicleRepository;
import com.booking.system.repository.UserRepository;
import com.booking.system.enums.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingCarService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;
    private final BookingCarRepository bookingCarRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public BookingCar createBooking(BookingCarRequest request) {
        if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().isEqual(request.getEndTime())) {
            throw new RuntimeException("Thời gian bắt đầu phải trước thời gian kết thúc.");
        }

        Vehicle vehicle = vehicleRepository.findByIdWithLock(request.getVehicleId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy xe"));

        User requester = userRepository.findById(request.getRequesterId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người đặt"));

        long overlaps = bookingCarRepository.countOverlappingBookings(
                vehicle.getId(), request.getStartTime(), request.getEndTime());

        if (overlaps > 0) {
            throw new RuntimeException("Xe đã có người đặt trong khoảng thời gian này.");
        }

        BookingCar booking = new BookingCar();
        booking.setVehicle(vehicle);
        booking.setRequester(requester);
        booking.setDeparture(request.getDeparture());
        booking.setDestination(request.getDestination());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setNote(request.getNote());
        booking.setStatus(BookingStatus.PENDING);

        BookingCar saved = bookingCarRepository.save(booking);
        
        // Thông báo cho người đặt
        eventPublisher.publishEvent(new NotificationEvent(
                requester.getId(),
                null,
                NotificationType.BOOKING_CREATED,
                "Tạo yêu cầu đặt xe thành công",
                "Yêu cầu đặt xe từ '" + saved.getDeparture() + "' đi '" + saved.getDestination() + "' đã được gửi và đang chờ duyệt.",
                "/cars",
                "BOOKING_CAR",
                saved.getId(),
                NotificationPriority.NORMAL,
                null
        ));
            
        // Thông báo cho Admin
        java.util.List<User> admins = userRepository.findByRole(com.booking.system.enums.RoleEnum.ADMIN);
        for (User admin : admins) {
            if (admin.getId().equals(requester.getId())) {
                continue;
            }
            eventPublisher.publishEvent(new NotificationEvent(
                    admin.getId(),
                    requester.getId(),
                    NotificationType.BOOKING_PENDING_APPROVAL,
                    "Yêu cầu đặt xe mới (Cần duyệt)",
                    requester.getFullName() + " vừa tạo một yêu cầu đặt xe từ '" + saved.getDeparture() + "' đi '" + saved.getDestination() + "'.",
                    "/admin/approvals",
                    "BOOKING_CAR",
                    saved.getId(),
                    NotificationPriority.HIGH,
                    new NotificationEvent.EmailInstruction(
                            NotificationEvent.EmailType.BOOKING_CREATED_TO_ADMIN,
                            "xe",
                            requester.getFullName(),
                            saved.getDeparture() + " - " + saved.getDestination(),
                            null
                    )
            ));
        }
            
        return saved;
    }
    
    public List<BookingCar> getAllBookings() {
        return bookingCarRepository.findAll();
    }

    @Transactional
    public void cancelBooking(String bookingId, com.booking.system.dto.CancelRequest request) {
        BookingCar booking = bookingCarRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch đặt xe"));
        
        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Lịch đặt xe này đã bị hủy trước đó");
        }

        User canceller = userRepository.findById(request.getCancellerId())
                .orElseThrow(() -> new RuntimeException("Người hủy không tồn tại"));

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelReason(request.getReason());
        booking.setCancelledBy(canceller);
        
        bookingCarRepository.save(booking);

        // Notify if the canceller is not the requester
        if (!canceller.getId().equals(booking.getRequester().getId())) {
            eventPublisher.publishEvent(new NotificationEvent(
                    booking.getRequester().getId(),
                    canceller.getId(),
                    NotificationType.BOOKING_CANCELLED,
                    "Lịch đặt xe đã bị hủy",
                    "Lịch đặt xe từ '" + booking.getDeparture() + "' đi '" + booking.getDestination() + "' đã bị hủy. Lý do: " + request.getReason(),
                    "/cars",
                    "BOOKING_CAR",
                    booking.getId(),
                    NotificationPriority.HIGH,
                    null
            ));
        }
    }
}
