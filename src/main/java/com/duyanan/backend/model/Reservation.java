package com.duyanan.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "reservations")
@Data
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany(mappedBy = "reservation", fetch = FetchType.EAGER)
    @JsonIgnoreProperties({"reservation", "user"})
    private List<Order> orders = new ArrayList<>();

    @Column(nullable = false)
    private String guestName;

    @Column(nullable = false)
    private String contactNumber;

    @Column(nullable = false)
    private LocalDate reservationDate;

    @Column(nullable = false)
    private LocalTime reservationTime;

    @Column(nullable = false)
    private Integer numberOfGuests;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, CONFIRMED, CANCELLED, COMPLETED

    private String specialRequests;

    @Column(name = "seating_type")
    private String seatingType;

    @Column(name = "event_type")
    private String eventType;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @Column(name = "pre_order_summary", columnDefinition = "TEXT")
    private String preOrderSummary;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
