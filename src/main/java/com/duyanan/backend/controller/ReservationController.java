package com.duyanan.backend.controller;

import com.duyanan.backend.model.*;
import com.duyanan.backend.repository.*;
import com.duyanan.backend.util.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final JwtUtil jwtUtil;

    public ReservationController(ReservationRepository reservationRepository,
                                  UserRepository userRepository,
                                  OrderRepository orderRepository,
                                  JwtUtil jwtUtil) {
        this.reservationRepository = reservationRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.jwtUtil = jwtUtil;
    }

    // ── Create a new reservation ─────────────────────────────
    @PostMapping
    public ResponseEntity<?> createReservation(@RequestHeader("Authorization") String authHeader,
                                                @RequestBody Map<String, String> body) {
        try {
            String token = authHeader.replace("Bearer ", "");
            var claims = jwtUtil.validateToken(token);
            String email = claims.getSubject();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            LocalDate reservationDate = LocalDate.parse(body.get("reservationDate"));
            java.time.ZoneId manilaZone = java.time.ZoneId.of("Asia/Manila");
            LocalDate today = LocalDate.now(manilaZone);
            if (reservationDate.isBefore(today)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reservation date cannot be in the past!"));
            }
            LocalTime reservationTime = LocalTime.parse(body.get("reservationTime"));
            if (reservationDate.isEqual(today) && reservationTime.isBefore(LocalTime.now(manilaZone))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reservation time cannot be in the past!"));
            }
            String guestName = body.get("guestName");

            boolean duplicateExists = reservationRepository
                    .existsByUserIdAndGuestNameAndReservationDateAndReservationTimeAndStatusNot(
                            user.getId(), guestName, reservationDate, reservationTime, "CANCELLED"
                    );

            if (duplicateExists) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "A reservation with the exact same date and time already exists for this guest!"
                ));
            }

            Reservation reservation = new Reservation();
            reservation.setUser(user);
            reservation.setGuestName(guestName);
            reservation.setContactNumber(body.get("contactNumber"));
            reservation.setReservationDate(reservationDate);
            reservation.setReservationTime(reservationTime);
            reservation.setNumberOfGuests(Integer.valueOf(body.get("numberOfGuests")));
            reservation.setSpecialRequests(body.get("specialRequests"));
            reservation.setSeatingType(body.get("seatingType"));
            reservation.setEventType(body.getOrDefault("eventType", "Casual Dining 🍽️"));
            reservation.setStatus("PENDING");
            reservation.setCreatedAt(LocalDateTime.now());

            Reservation saved = reservationRepository.save(reservation);

            return ResponseEntity.ok(Map.of(
                    "message", "Reservation created successfully!",
                    "reservationId", saved.getId(),
                    "status", saved.getStatus()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Get current user's reservations ──────────────────────
    @GetMapping("/my-reservations")
    public ResponseEntity<?> getMyReservations(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            var claims = jwtUtil.validateToken(token);
            String email = claims.getSubject();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Reservation> reservations = reservationRepository.findByUserIdOrderByReservationDateDesc(user.getId());
            return ResponseEntity.ok(reservations);

        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
    }

    // ── Get reservation by ID ────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getReservationById(@PathVariable Long id) {
        return reservationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Update reservation details ───────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> updateReservation(@RequestHeader("Authorization") String authHeader,
                                                @PathVariable Long id,
                                                @RequestBody Map<String, String> body) {
        try {
            String token = authHeader.replace("Bearer ", "");
            var claims = jwtUtil.validateToken(token);
            String email = claims.getSubject();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Reservation not found"));

            // Safety check: Make sure this reservation belongs to the logged-in user
            if (!reservation.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access."));
            }

            // Safety check: Only allow editing if the status is PENDING
            if (!"PENDING".equalsIgnoreCase(reservation.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only pending reservations can be modified."));
            }

            LocalDate reservationDate = LocalDate.parse(body.get("reservationDate"));
            java.time.ZoneId manilaZone = java.time.ZoneId.of("Asia/Manila");
            LocalDate today = LocalDate.now(manilaZone);
            if (reservationDate.isBefore(today)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reservation date cannot be in the past!"));
            }
            LocalTime reservationTime = LocalTime.parse(body.get("reservationTime"));
            if (reservationDate.isEqual(today) && reservationTime.isBefore(LocalTime.now(manilaZone))) {
                return ResponseEntity.badRequest().body(Map.of("error", "Reservation time cannot be in the past!"));
            }
            String guestName = body.get("guestName");

            // Check if there exists another reservation with the same details (excluding this one)
            boolean isReallyDuplicate = reservationRepository.findAll().stream()
                    .anyMatch(r -> !r.getId().equals(id) 
                                   && r.getUser().getId().equals(user.getId())
                                   && r.getGuestName().equalsIgnoreCase(guestName)
                                   && r.getReservationDate().equals(reservationDate)
                                   && r.getReservationTime().equals(reservationTime)
                                   && !r.getStatus().equalsIgnoreCase("CANCELLED"));

            if (isReallyDuplicate) {
                return ResponseEntity.badRequest().body(Map.of(
                        "error", "A reservation with the exact same date and time already exists for this guest!"
                ));
            }

            reservation.setGuestName(guestName);
            reservation.setContactNumber(body.get("contactNumber"));
            reservation.setReservationDate(reservationDate);
            reservation.setReservationTime(reservationTime);
            reservation.setNumberOfGuests(Integer.valueOf(body.get("numberOfGuests")));
            reservation.setSpecialRequests(body.get("specialRequests"));
            reservation.setSeatingType(body.get("seatingType"));
            reservation.setEventType(body.getOrDefault("eventType", "Casual Dining 🍽️"));

            Reservation saved = reservationRepository.save(reservation);
            return ResponseEntity.ok(Map.of(
                    "message", "Reservation updated successfully!",
                    "reservationId", saved.getId(),
                    "status", saved.getStatus()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Cancel a pending reservation ─────────────────────────
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelReservation(@RequestHeader("Authorization") String authHeader,
                                                @PathVariable Long id) {
        try {
            String token = authHeader.replace("Bearer ", "");
            var claims = jwtUtil.validateToken(token);
            String email = claims.getSubject();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Reservation reservation = reservationRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Reservation not found"));

            // Safety check: Make sure this reservation belongs to the logged-in user
            if (!reservation.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access."));
            }

            // Safety check: Only allow cancelling if the status is PENDING
            if (!"PENDING".equalsIgnoreCase(reservation.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only pending reservations can be cancelled."));
            }

            reservation.setStatus("CANCELLED");
            reservationRepository.save(reservation);

            return ResponseEntity.ok(Map.of(
                    "message", "Reservation cancelled successfully.",
                    "reservationId", reservation.getId(),
                    "status", reservation.getStatus()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Get orders for a specific reservation ─────────────────
    @GetMapping("/{id}/orders")
    public ResponseEntity<?> getOrdersByReservation(@PathVariable Long id) {
        List<Order> orders = orderRepository.findByReservationId(id);
        return ResponseEntity.ok(orders);
    }
}
