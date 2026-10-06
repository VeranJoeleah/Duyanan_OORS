package com.duyanan.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Data
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reservation_id")
    @JsonIgnoreProperties({"orders", "user"})
    private Reservation reservation;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Column(nullable = false)
    private Double totalAmount;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED

    @Column(nullable = false)
    private LocalDateTime orderDate = LocalDateTime.now();

    @Column(name = "order_type")
    private String orderType = "DELIVERY"; // DINE_IN, DELIVERY, PICKUP

    private String notes;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    @OneToOne(mappedBy = "order", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnoreProperties("order")
    private Feedback feedback;
}
