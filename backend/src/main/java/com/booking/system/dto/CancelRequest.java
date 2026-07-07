package com.booking.system.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CancelRequest {
    @NotBlank(message = "ID người hủy không được để trống")
    private String cancellerId;
    
    private String reason;
}
