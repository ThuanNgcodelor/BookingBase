package com.booking.system.event;

import com.booking.system.enums.NotificationPriority;
import com.booking.system.enums.NotificationType;

public record NotificationEvent(
        String recipientId,
        String senderId,
        NotificationType type,
        String title,
        String message,
        String targetUrl,
        String sourceType,
        String sourceId,
        NotificationPriority priority,
        EmailInstruction emailInstruction
) {
    public NotificationEvent {
        if (priority == null) {
            priority = NotificationPriority.NORMAL;
        }
    }

    public record EmailInstruction(
            EmailType type,
            String resourceType,
            String requesterName,
            String title,
            String reason
    ) {
    }

    public enum EmailType {
        BOOKING_CREATED_TO_ADMIN,
        BOOKING_APPROVED,
        BOOKING_REJECTED
    }
}
