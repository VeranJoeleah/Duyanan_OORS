package com.duyanan.backend.repository;

import com.duyanan.backend.model.*;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByUserIdOrderByReservationDateDesc(Long userId);
    List<Reservation> findAllByOrderByReservationDateDesc();
    List<Reservation> findByStatus(String status);
    List<Reservation> findByReservationDate(LocalDate date);
    boolean existsByUserIdAndGuestNameAndReservationDateAndReservationTimeAndStatusNot(
        Long userId, String guestName, LocalDate reservationDate, LocalTime reservationTime, String status
    );
}
