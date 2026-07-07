package com.booking.system.service;

import com.booking.system.dto.ApprovalRequest;
import com.booking.system.entity.BookingRoom;
import com.booking.system.entity.User;
import com.booking.system.enums.NotificationType;
import com.booking.system.event.NotificationEvent;
import com.booking.system.repository.ApprovalStepRepository;
import com.booking.system.repository.BookingCarRepository;
import com.booking.system.repository.BookingRoomRepository;
import com.booking.system.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApprovalServiceTest {

    @Mock
    private BookingRoomRepository bookingRoomRepository;

    @Mock
    private BookingCarRepository bookingCarRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApprovalStepRepository approvalStepRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ApprovalService approvalService;

    @Test
    void approveRoomPublishesNotificationForRequester() {
        User requester = user("user-1", "Nhân viên");
        User approver = user("admin-1", "Quản lý");
        BookingRoom booking = new BookingRoom();
        booking.setId("booking-room-1");
        booking.setTitle("Họp sprint");
        booking.setRequester(requester);
        ApprovalRequest request = new ApprovalRequest();
        request.setApproverId(approver.getId());
        request.setReason("OK");

        when(bookingRoomRepository.findById(booking.getId())).thenReturn(Optional.of(booking));
        when(userRepository.findById(approver.getId())).thenReturn(Optional.of(approver));
        when(bookingRoomRepository.save(booking)).thenReturn(booking);
        when(approvalStepRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        approvalService.approveRoom(booking.getId(), request);

        ArgumentCaptor<NotificationEvent> captor = ArgumentCaptor.forClass(NotificationEvent.class);
        verify(eventPublisher).publishEvent(captor.capture());
        assertThat(captor.getValue().recipientId()).isEqualTo(requester.getId());
        assertThat(captor.getValue().senderId()).isEqualTo(approver.getId());
        assertThat(captor.getValue().type()).isEqualTo(NotificationType.BOOKING_APPROVED);
        assertThat(captor.getValue().emailInstruction()).isNotNull();
    }

    private User user(String id, String fullName) {
        User user = new User();
        user.setId(id);
        user.setEmail(id + "@example.com");
        user.setFullName(fullName);
        return user;
    }
}
