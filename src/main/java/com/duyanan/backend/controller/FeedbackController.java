package com.duyanan.backend.controller;

import com.duyanan.backend.model.*;
import com.duyanan.backend.repository.*;
import com.duyanan.backend.util.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackRepository feedbackRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;

    public FeedbackController(FeedbackRepository feedbackRepository,
                              OrderRepository orderRepository,
                              UserRepository userRepository,
                              JwtUtil jwtUtil) {
        this.feedbackRepository = feedbackRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    // ── Submit feedback for an order ────────────────────────
    @PostMapping
    public ResponseEntity<?> createFeedback(@RequestHeader("Authorization") String authHeader,
                                            @RequestBody Map<String, Object> body) {
        try {
            String token = authHeader.replace("Bearer ", "");
            var claims = jwtUtil.validateToken(token);
            String email = claims.getSubject();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Long orderId = Long.valueOf(body.get("orderId").toString());
            Integer rating = Integer.valueOf(body.get("rating").toString());
            String comment = body.get("comment") != null ? body.get("comment").toString() : "";

            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

            // Validate that the order belongs to the user
            if (!order.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "You can only review your own orders."));
            }

            // Validate order status is completed
            if (!"COMPLETED".equalsIgnoreCase(order.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "You can only review completed orders."));
            }

            // Validate rating is 1-5
            if (rating < 1 || rating > 5) {
                return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5."));
            }

            // Check if feedback already exists for this order
            if (feedbackRepository.findByOrderId(orderId).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Feedback has already been submitted for this order."));
            }

            Feedback feedback = new Feedback();
            feedback.setOrder(order);
            feedback.setUser(user);
            feedback.setRating(rating);
            feedback.setComment(comment);
            feedback.setCreatedAt(LocalDateTime.now());

            Feedback saved = feedbackRepository.save(feedback);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Get feedback for a specific order ────────────────────
    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getFeedbackByOrder(@PathVariable Long orderId) {
        return feedbackRepository.findByOrderId(orderId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Get all feedback (Admin view) ────────────────────────
    @GetMapping
    public ResponseEntity<?> getAllFeedback() {
        return ResponseEntity.ok(feedbackRepository.findAllByOrderByCreatedAtDesc());
    }
}
