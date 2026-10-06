package com.duyanan.backend.repository;

import com.duyanan.backend.model.*;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByOrderDateDesc(Long userId);
    List<Order> findAllByOrderByOrderDateDesc();
    List<Order> findByStatus(String status);
    List<Order> findByReservationId(Long reservationId);
}
