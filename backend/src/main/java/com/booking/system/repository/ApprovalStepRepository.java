package com.booking.system.repository;

import com.booking.system.entity.ApprovalStep;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApprovalStepRepository extends JpaRepository<ApprovalStep, String> {
    @EntityGraph(attributePaths = {"approver", "approver.department"})
    List<ApprovalStep> findByBookingRoomIdOrderByActedAtDesc(String bookingRoomId);

    @EntityGraph(attributePaths = {"approver", "approver.department"})
    List<ApprovalStep> findByBookingCarIdOrderByActedAtDesc(String bookingCarId);
}
