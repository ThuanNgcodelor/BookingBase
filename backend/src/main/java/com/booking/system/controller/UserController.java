package com.booking.system.controller;

import com.booking.system.dto.ApiResponse;
import com.booking.system.dto.AuthResponse;
import com.booking.system.entity.User;
import com.booking.system.enums.RoleEnum;
import com.booking.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse.UserDto>> me(@AuthenticationPrincipal User user) {
        User current = requireUser(user);
        return ResponseEntity.ok(ApiResponse.success(toUserDto(current), "Lấy thông tin người dùng thành công"));
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

    private User requireUser(User user) {
        if (user == null) {
            throw new RuntimeException("Chưa đăng nhập");
        }
        return user;
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
