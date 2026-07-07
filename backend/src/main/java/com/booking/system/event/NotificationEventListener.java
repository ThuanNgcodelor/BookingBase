package com.booking.system.event;

import com.booking.system.dto.NotificationResponse;
import com.booking.system.entity.User;
import com.booking.system.repository.UserRepository;
import com.booking.system.service.EmailService;
import com.booking.system.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventListener {

    private final NotificationService notificationService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(NotificationEvent event) {
        try {
            NotificationResponse payload = notificationService.createNotification(
                    event.recipientId(),
                    event.senderId(),
                    event.type(),
                    event.title(),
                    event.message(),
                    event.targetUrl(),
                    event.sourceType(),
                    event.sourceId(),
                    event.priority()
            );
            if (payload != null) {
                notificationService.pushRealtime(event.recipientId(), payload);
            }
        } catch (Exception ex) {
            log.error("Failed to persist or push notification for recipient {} source {}:{}",
                    event.recipientId(), event.sourceType(), event.sourceId(), ex);
        }

        try {
            sendEmailIfConfigured(event);
        } catch (Exception ex) {
            log.error("Failed to trigger notification email for recipient {}", event.recipientId(), ex);
        }
    }

    private void sendEmailIfConfigured(NotificationEvent event) {
        if (event.emailInstruction() == null) {
            return;
        }

        User recipient = userRepository.findById(event.recipientId()).orElse(null);
        if (recipient == null) {
            return;
        }

        NotificationEvent.EmailInstruction email = event.emailInstruction();
        if (email.type() == NotificationEvent.EmailType.BOOKING_CREATED_TO_ADMIN) {
            emailService.sendBookingCreatedEmailToAdmin(
                    recipient.getEmail(),
                    email.requesterName(),
                    email.resourceType(),
                    email.title()
            );
        } else if (email.type() == NotificationEvent.EmailType.BOOKING_APPROVED) {
            emailService.sendBookingApprovedEmail(recipient.getEmail(), email.resourceType(), email.title());
        } else if (email.type() == NotificationEvent.EmailType.BOOKING_REJECTED) {
            emailService.sendBookingRejectedEmail(recipient.getEmail(), email.resourceType(), email.title(), email.reason());
        }
    }
}
