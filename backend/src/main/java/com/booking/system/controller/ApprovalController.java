package com.booking.system.controller;

import com.booking.system.dto.ApiResponse;
import com.booking.system.dto.ApprovalRequest;
import com.booking.system.dto.ApprovalStepResponse;
import com.booking.system.entity.User;
import com.booking.system.service.ApprovalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping("/rooms/{id}/steps")
    public ResponseEntity<ApiResponse<List<ApprovalStepResponse>>> getRoomApprovalSteps(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(
                approvalService.getRoomApprovalSteps(id),
                "Lấy lịch sử duyệt đặt phòng thành công"));
    }

    @GetMapping("/cars/{id}/steps")
    public ResponseEntity<ApiResponse<List<ApprovalStepResponse>>> getCarApprovalSteps(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(
                approvalService.getCarApprovalSteps(id),
                "Lấy lịch sử duyệt đặt xe thành công"));
    }

    @PostMapping("/rooms/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveRoom(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @Valid @RequestBody ApprovalRequest request) {
        try {
            approvalService.approveRoom(id, request, user);
            return ResponseEntity.ok(ApiResponse.success(null, "Phê duyệt đặt phòng thành công"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(403, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }

    @PostMapping("/rooms/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectRoom(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @Valid @RequestBody ApprovalRequest request) {
        try {
            approvalService.rejectRoom(id, request, user);
            return ResponseEntity.ok(ApiResponse.success(null, "Từ chối đặt phòng thành công"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(403, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }

    @PostMapping("/cars/{id}/approve")
    public ResponseEntity<ApiResponse<Void>> approveCar(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @Valid @RequestBody ApprovalRequest request) {
        try {
            approvalService.approveCar(id, request, user);
            return ResponseEntity.ok(ApiResponse.success(null, "Phê duyệt đặt xe thành công"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(403, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }

    @PostMapping("/cars/{id}/reject")
    public ResponseEntity<ApiResponse<Void>> rejectCar(
            @AuthenticationPrincipal User user,
            @PathVariable String id,
            @Valid @RequestBody ApprovalRequest request) {
        try {
            approvalService.rejectCar(id, request, user);
            return ResponseEntity.ok(ApiResponse.success(null, "Từ chối đặt xe thành công"));
        } catch (AccessDeniedException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(403, e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }
}
