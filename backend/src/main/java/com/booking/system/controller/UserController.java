package com.booking.system.controller;

import com.booking.system.dto.AdminCreateUserRequest;
import com.booking.system.dto.ApiResponse;
import com.booking.system.dto.AuthResponse;
import com.booking.system.dto.ChangePasswordRequest;
import com.booking.system.dto.UpdateAvatarRequest;
import com.booking.system.entity.Department;
import com.booking.system.entity.User;
import com.booking.system.enums.RoleEnum;
import com.booking.system.enums.UserStatus;
import com.booking.system.repository.DepartmentRepository;
import com.booking.system.repository.UserRepository;
import com.booking.system.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserProfileService userProfileService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserDto>> me(@AuthenticationPrincipal User user) {
        User current = requireUser(user);
        return ResponseEntity.ok(ApiResponse.success(toUserDto(current), "Lấy thông tin người dùng thành công"));
    }

    @PatchMapping("/me/avatar")
    public ResponseEntity<ApiResponse<AuthResponse.UserDto>> updateAvatar(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateAvatarRequest request
    ) {
        try {
            User updated = userProfileService.updateAvatar(requireUser(user).getId(), request.avatarUrl());
            return ResponseEntity.ok(ApiResponse.success(toUserDto(updated), "Cập nhật ảnh đại diện thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }

    @PatchMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        try {
            userProfileService.changePassword(requireUser(user).getId(), request.currentPassword(), request.newPassword());
            return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, e.getMessage()));
        }
    }

    @GetMapping("/approvers")
    public ResponseEntity<ApiResponse<List<User>>> getApprovers() {
        // Lấy danh sách ADMIN và MANAGER
        List<User> approvers = userRepository.findByRoleIn(Arrays.asList(RoleEnum.ADMIN, RoleEnum.MANAGER));
        // Có thể sắp xếp Admin lên trước bằng Java Stream
        approvers.sort((u1, u2) -> {
            if (u1.getRole() == RoleEnum.ADMIN && u2.getRole() != RoleEnum.ADMIN) return -1;
            if (u1.getRole() != RoleEnum.ADMIN && u2.getRole() == RoleEnum.ADMIN) return 1;
            return 0;
        });
        return ResponseEntity.ok(ApiResponse.success(approvers, "Lấy danh sách người duyệt thành công"));
    }

    // Admin tạo tài khoản email/password cho nhân sự nội bộ.
    @PostMapping
    public ResponseEntity<ApiResponse<AuthResponse.UserDto>> createUser(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody AdminCreateUserRequest request
    ) {
        requireAdmin(currentUser);

        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest().body(ApiResponse.error(400, "Email đã tồn tại trong hệ thống"));
        }

        Department department = null;
        if (request.departmentId() != null && !request.departmentId().isBlank()) {
            department = departmentRepository.findById(request.departmentId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng ban"));
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setFullName(resolveFullName(request.fullName(), email));
        user.setRole(request.role() == null ? RoleEnum.EMPLOYEE : request.role());
        user.setStatus(UserStatus.ACTIVE);
        user.setDepartment(department);
        user.setJobPosition(request.jobPosition());

        User savedUser = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(toUserDto(savedUser), "Tạo tài khoản thành công"));
    }

    private User requireUser(User user) {
        if (user == null) {
            throw new RuntimeException("Chưa đăng nhập");
        }
        return user;
    }

    private void requireAdmin(User user) {
        User current = requireUser(user);
        if (current.getRole() != RoleEnum.ADMIN) {
            throw new RuntimeException("Chỉ quản trị viên được thực hiện thao tác này");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private String resolveFullName(String fullName, String email) {
        if (fullName != null && !fullName.isBlank()) {
            return fullName.trim();
        }
        return email.substring(0, email.indexOf("@"));
    }

    private AuthResponse.UserDto toUserDto(User user) {
        return new AuthResponse.UserDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole() == null ? null : user.getRole().name(),
                user.getAvatarUrl(),
                user.getDepartment() == null ? null : user.getDepartment().getId(),
                user.getDepartment() == null ? null : user.getDepartment().getName(),
                user.getJobPosition(),
                user.getPassword() != null
        );
    }
}
