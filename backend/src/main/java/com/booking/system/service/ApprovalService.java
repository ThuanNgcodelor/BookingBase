package com.booking.system.service;

import com.booking.system.dto.ApprovalRequest;
import com.booking.system.entity.ApprovalStep;
import com.booking.system.entity.BookingCar;
import com.booking.system.entity.BookingRoom;
import com.booking.system.entity.User;
import com.booking.system.enums.ApprovalStatus;
import com.booking.system.enums.BookingStatus;
import com.booking.system.enums.NotificationPriority;
import com.booking.system.enums.NotificationType;
import com.booking.system.event.NotificationEvent;
import com.booking.system.repository.ApprovalStepRepository;
import com.booking.system.repository.BookingCarRepository;
import com.booking.system.repository.BookingRoomRepository;
import com.booking.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final BookingRoomRepository bookingRoomRepository;
    private final BookingCarRepository bookingCarRepository;
    private final UserRepository userRepository;
    private final ApprovalStepRepository approvalStepRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public void approveRoom(String bookingId, ApprovalRequest request) {
        BookingRoom booking = bookingRoomRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch đặt phòng"));
        User approver = userRepository.findById(request.getApproverId())
                .orElseThrow(() -> new RuntimeException("Người duyệt không tồn tại"));

        booking.setStatus(BookingStatus.APPROVED);
        bookingRoomRepository.save(booking);

        saveApprovalStep(approver, booking, null, ApprovalStatus.APPROVED, request.getReason());
        
        if (!approver.getId().equals(booking.getRequester().getId())) {
            eventPublisher.publishEvent(new NotificationEvent(
                    booking.getRequester().getId(),
                    approver.getId(),
                    NotificationType.BOOKING_APPROVED,
                    "Yêu cầu đặt phòng đã được duyệt",
                    "Lịch đặt phòng '" + booking.getTitle() + "' đã được duyệt.",
                    "/rooms",
                    "BOOKING_ROOM",
                    booking.getId(),
                    NotificationPriority.NORMAL,
                    new NotificationEvent.EmailInstruction(
                            NotificationEvent.EmailType.BOOKING_APPROVED,
                            "phòng",
                            null,
                            booking.getTitle(),
                            null
                    )
            ));
        }
    }

    @Transactional
    public void rejectRoom(String bookingId, ApprovalRequest request) {
        BookingRoom booking = bookingRoomRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch đặt phòng"));
        User approver = userRepository.findById(request.getApproverId())
                .orElseThrow(() -> new RuntimeException("Người duyệt không tồn tại"));

        booking.setStatus(BookingStatus.REJECTED);
        bookingRoomRepository.save(booking);

        saveApprovalStep(approver, booking, null, ApprovalStatus.REJECTED, request.getReason());
        
        if (!approver.getId().equals(booking.getRequester().getId())) {
            eventPublisher.publishEvent(new NotificationEvent(
                    booking.getRequester().getId(),
                    approver.getId(),
                    NotificationType.BOOKING_REJECTED,
                    "Yêu cầu đặt phòng bị từ chối",
                    "Lịch đặt phòng '" + booking.getTitle() + "' bị từ chối. Lý do: " + request.getReason(),
                    "/rooms",
                    "BOOKING_ROOM",
                    booking.getId(),
                    NotificationPriority.HIGH,
                    new NotificationEvent.EmailInstruction(
                            NotificationEvent.EmailType.BOOKING_REJECTED,
                            "phòng",
                            null,
                            booking.getTitle(),
                            request.getReason()
                    )
            ));
        }
    }

    @Transactional
    public void approveCar(String bookingId, ApprovalRequest request) {
        BookingCar booking = bookingCarRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch đặt xe"));
        User approver = userRepository.findById(request.getApproverId())
                .orElseThrow(() -> new RuntimeException("Người duyệt không tồn tại"));

        booking.setStatus(BookingStatus.APPROVED);
        bookingCarRepository.save(booking);

        saveApprovalStep(approver, null, booking, ApprovalStatus.APPROVED, request.getReason());
        
        if (!approver.getId().equals(booking.getRequester().getId())) {
            eventPublisher.publishEvent(new NotificationEvent(
                    booking.getRequester().getId(),
                    approver.getId(),
                    NotificationType.BOOKING_APPROVED,
                    "Yêu cầu đặt xe đã được duyệt",
                    "Lịch đặt xe từ '" + booking.getDeparture() + "' đi '" + booking.getDestination() + "' đã được duyệt.",
                    "/cars",
                    "BOOKING_CAR",
                    booking.getId(),
                    NotificationPriority.NORMAL,
                    new NotificationEvent.EmailInstruction(
                            NotificationEvent.EmailType.BOOKING_APPROVED,
                            "xe",
                            null,
                            booking.getDeparture() + " - " + booking.getDestination(),
                            null
                    )
            ));
        }
    }

    @Transactional
    public void rejectCar(String bookingId, ApprovalRequest request) {
        BookingCar booking = bookingCarRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch đặt xe"));
        User approver = userRepository.findById(request.getApproverId())
                .orElseThrow(() -> new RuntimeException("Người duyệt không tồn tại"));

        booking.setStatus(BookingStatus.REJECTED);
        bookingCarRepository.save(booking);

        saveApprovalStep(approver, null, booking, ApprovalStatus.REJECTED, request.getReason());
        
        if (!approver.getId().equals(booking.getRequester().getId())) {
            eventPublisher.publishEvent(new NotificationEvent(
                    booking.getRequester().getId(),
                    approver.getId(),
                    NotificationType.BOOKING_REJECTED,
                    "Yêu cầu đặt xe bị từ chối",
                    "Lịch đặt xe từ '" + booking.getDeparture() + "' đi '" + booking.getDestination() + "' bị từ chối. Lý do: " + request.getReason(),
                    "/cars",
                    "BOOKING_CAR",
                    booking.getId(),
                    NotificationPriority.HIGH,
                    new NotificationEvent.EmailInstruction(
                            NotificationEvent.EmailType.BOOKING_REJECTED,
                            "xe",
                            null,
                            booking.getDeparture() + " - " + booking.getDestination(),
                            request.getReason()
                    )
            ));
        }
    }

    private void saveApprovalStep(User approver, BookingRoom room, BookingCar car, ApprovalStatus status, String reason) {
        ApprovalStep step = new ApprovalStep();
        step.setApprover(approver);
        step.setBookingRoom(room);
        step.setBookingCar(car);
        step.setStatus(status);
        step.setReason(reason);
        step.setActedAt(LocalDateTime.now());
        approvalStepRepository.save(step);
    }
}
