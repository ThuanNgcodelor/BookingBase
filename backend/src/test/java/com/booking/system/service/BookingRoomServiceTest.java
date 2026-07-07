package com.booking.system.service;

import com.booking.system.dto.BookingRoomRequest;
import com.booking.system.entity.BookingRoom;
import com.booking.system.entity.Room;
import com.booking.system.entity.User;
import com.booking.system.enums.NotificationType;
import com.booking.system.enums.RoleEnum;
import com.booking.system.enums.RoomStatus;
import com.booking.system.event.NotificationEvent;
import com.booking.system.repository.BookingRoomRepository;
import com.booking.system.repository.RoomRepository;
import com.booking.system.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingRoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingRoomRepository bookingRoomRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BookingRoomService bookingRoomService;

    @Test
    void createBookingPublishesPendingApprovalNotificationForApprover() {
        User requester = user("user-1", "Nhân viên", RoleEnum.EMPLOYEE);
        User admin = user("admin-1", "Quản lý", RoleEnum.ADMIN);
        Room room = new Room();
        room.setId("room-1");
        room.setName("Phòng họp A");
        room.setStatus(RoomStatus.ACTIVE);

        BookingRoomRequest request = new BookingRoomRequest();
        request.setRequesterId(requester.getId());
        request.setRoomId(room.getId());
        request.setTitle("Họp sprint");
        request.setStartTime(LocalDateTime.now().plusHours(1));
        request.setEndTime(LocalDateTime.now().plusHours(2));
        request.setAttendeeCount(6);

        when(roomRepository.findByIdWithLock(room.getId())).thenReturn(Optional.of(room));
        when(userRepository.findById(requester.getId())).thenReturn(Optional.of(requester));
        when(bookingRoomRepository.countOverlappingBookings(room.getId(), request.getStartTime(), request.getEndTime())).thenReturn(0L);
        when(bookingRoomRepository.save(any(BookingRoom.class))).thenAnswer(invocation -> {
            BookingRoom booking = invocation.getArgument(0);
            booking.setId("booking-room-1");
            return booking;
        });
        when(userRepository.findByRole(RoleEnum.ADMIN)).thenReturn(List.of(admin));

        bookingRoomService.createBooking(request);

        ArgumentCaptor<NotificationEvent> captor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher, org.mockito.Mockito.times(2)).publishEvent(captor.capture());
        assertThat(captor.getAllValues())
                .anySatisfy(event -> {
                    assertThat(event.recipientId()).isEqualTo(admin.getId());
                    assertThat(event.senderId()).isEqualTo(requester.getId());
                    assertThat(event.type()).isEqualTo(NotificationType.BOOKING_PENDING_APPROVAL);
                    assertThat(event.targetUrl()).isEqualTo("/admin/approvals");
                });
    }

    private User user(String id, String fullName, RoleEnum role) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@example.com");
        user.setFullName(fullName);
        user.setRole(role);
        return user;
    }
}
