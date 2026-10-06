package com.duyanan.backend.repository;

import com.duyanan.backend.model.*;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
}
