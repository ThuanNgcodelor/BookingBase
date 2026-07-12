package com.booking.system.service;

import com.booking.system.dto.BookingCarRequest;
import com.booking.system.entity.BookingCar;
import com.booking.system.entity.User;
import com.booking.system.entity.Vehicle;
import com.booking.system.enums.RoleEnum;
import com.booking.system.repository.BookingCarRepository;
import com.booking.system.repository.UserRepository;
import com.booking.system.repository.VehicleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingCarServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookingCarRepository bookingCarRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private BookingCarService bookingCarService;

    @Test
    void createBookingIgnoresRequesterIdFromRequestBody() {
        User requester = user("user-1", "Nhan vien", RoleEnum.EMPLOYEE);
        User spoofedRequester = user("user-2", "User khac", RoleEnum.EMPLOYEE);
        Vehicle vehicle = new Vehicle();
        vehicle.setId("vehicle-1");

        BookingCarRequest request = new BookingCarRequest();
        request.setRequesterId(spoofedRequester.getId());
        request.setVehicleId(vehicle.getId());
        request.setDeparture("Office");
        request.setDestination("Airport");
        request.setStartTime(LocalDateTime.now().plusHours(1));
        request.setEndTime(LocalDateTime.now().plusHours(2));

        when(vehicleRepository.findByIdWithLock(vehicle.getId())).thenReturn(Optional.of(vehicle));
        when(userRepository.findById(requester.getId())).thenReturn(Optional.of(requester));
        when(bookingCarRepository.countOverlappingBookings(vehicle.getId(), request.getStartTime(), request.getEndTime())).thenReturn(0L);
        when(bookingCarRepository.save(any(BookingCar.class))).thenAnswer(invocation -> {
            BookingCar booking = invocation.getArgument(0);
            booking.setId("booking-car-1");
            return booking;
        });
        when(userRepository.findByRole(RoleEnum.ADMIN)).thenReturn(List.of());

        BookingCar saved = bookingCarService.createBooking(request, requester);

        assertThat(saved.getRequester().getId()).isEqualTo(requester.getId());
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
