package com.duyanan.backend.repository;

import com.duyanan.backend.model.*;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    Optional<Feedback> findByOrderId(Long orderId);
    List<Feedback> findAllByOrderByCreatedAtDesc();
}
