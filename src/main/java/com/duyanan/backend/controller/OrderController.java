package com.duyanan.backend.controller;

import com.duyanan.backend.model.*;
import com.duyanan.backend.repository.*;
import com.duyanan.backend.util.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final JwtUtil jwtUtil;

    public OrderController(OrderRepository orderRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository,
                           ReservationRepository reservationRepository,
                           JwtUtil jwtUtil) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
        this.jwtUtil = jwtUtil;
    }

    // ── Place a new order ────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestHeader("Authorization") String authHeader,
                                         @RequestBody Map<String, Object> body) {
        try {
            String token = authHeader.replace("Bearer ", "");
            var claims = jwtUtil.validateToken(token);
            String email = claims.getSubject();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order order = new Order();
            order.setUser(user);
            order.setNotes((String) body.get("notes"));
            order.setOrderDate(LocalDateTime.now());
            order.setStatus("PENDING");

            if (body.get("reservationId") != null && !body.get("reservationId").toString().trim().isEmpty() && !"null".equalsIgnoreCase(body.get("reservationId").toString())) {
                try {
                    Long reservationId = Long.valueOf(body.get("reservationId").toString().trim());
                    var resOpt = reservationRepository.findById(reservationId);
                    if (resOpt.isPresent()) {
                        Reservation r = resOpt.get();
                        if ("CONFIRMED".equalsIgnoreCase(r.getStatus())) {
                            return ResponseEntity.badRequest().body(Map.of(
                                "error", "Pre-ordering is no longer available once the reservation is confirmed by the admin."
                            ));
                        }
                        if (!"PENDING".equalsIgnoreCase(r.getStatus())) {
                            return ResponseEntity.badRequest().body(Map.of(
                                "error", "Pre-ordering is only available for pending reservations."
                            ));
                        }
                        order.setReservation(r);
                        order.setOrderType("DINE_IN");
                    } else {
                        return ResponseEntity.badRequest().body(Map.of(
                            "error", "Reservation not found: " + reservationId
                        ));
                    }
                } catch (NumberFormatException e) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Invalid reservation ID format."
                    ));
                }
            }

            if (body.get("orderType") != null) {
                order.setOrderType(body.get("orderType").toString());
            } else if (order.getReservation() != null) {
                order.setOrderType("DINE_IN");
            }

            // Parse items from request body
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> itemsData = (List<Map<String, Object>>) body.get("items");

            if (itemsData == null || itemsData.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Order must have at least one item."));
            }

            double totalAmount = 0;

            for (Map<String, Object> itemData : itemsData) {
                Long productId = Long.valueOf(itemData.get("productId").toString());
                Integer quantity = Integer.valueOf(itemData.get("quantity").toString());

                Product product = productRepository.findById(productId)
                        .orElseThrow(() -> new RuntimeException("Product not found: " + productId));

                String variant = itemData.get("variant") != null ? itemData.get("variant").toString() : null;
                
                // Resolve the unit price based on the variant name sent by the frontend.
                // The variant may be prefixed with a flavor (e.g. "Mango - Glass"), so we
                // strip the flavor prefix to get the base variant for price lookup.
                Double unitPrice = resolveUnitPrice(product, variant);

                // Fallback: if backend still resolved to 0, accept the price the frontend calculated.
                // This covers custom combo variants, event packages, group meals, and any
                // future variant types that haven't been mapped yet.
                if (unitPrice == null || unitPrice <= 0) {
                    if (itemData.get("price") != null) {
                        try {
                            unitPrice = Double.valueOf(itemData.get("price").toString());
                        } catch (NumberFormatException ignored) {}
                    }
                }
                if (unitPrice == null || unitPrice <= 0) {
                    // Last resort: use priceSolo
                    unitPrice = product.getPriceSolo() != null ? product.getPriceSolo() : 0.0;
                }

                OrderItem item = new OrderItem();
                item.setOrder(order);
                item.setProduct(product);
                item.setVariant(variant);
                item.setQuantity(quantity);
                item.setUnitPrice(unitPrice);
                item.setSubtotal(unitPrice * quantity);

                order.getItems().add(item);
                totalAmount += item.getSubtotal();
            }

            order.setTotalAmount(totalAmount);
            Order saved = orderRepository.save(order);

            // If order is linked to a reservation, update reservation's preOrderSummary & specialRequests
            if (saved.getReservation() != null) {
                try {
                    Reservation r = saved.getReservation();
                    StringBuilder sb = new StringBuilder();
                    sb.append("🍽️ PRE-ORDERED FOOD (Order #").append(saved.getId())
                      .append(" - ₱").append(String.format("%.2f", saved.getTotalAmount())).append("):\n");
                    for (OrderItem item : saved.getItems()) {
                        sb.append("• ").append(item.getQuantity()).append("x ").append(item.getProduct().getName());
                        if (item.getVariant() != null && !item.getVariant().isEmpty()) {
                            sb.append(" (").append(item.getVariant()).append(")");
                        }
                        sb.append(" - ₱").append(String.format("%.2f", item.getSubtotal())).append("\n");
                    }
                    String summaryStr = sb.toString().trim();
                    r.setPreOrderSummary(summaryStr);

                    String existingNotes = r.getSpecialRequests();
                    if (existingNotes != null && !existingNotes.trim().isEmpty()) {
                        if (!existingNotes.contains("PRE-ORDERED FOOD")) {
                            r.setSpecialRequests(existingNotes + "\n\n" + summaryStr);
                        }
                    } else {
                        r.setSpecialRequests(summaryStr);
                    }
                    reservationRepository.save(r);
                } catch (Exception ex) {
                    System.err.println("Failed to update reservation pre-order summary: " + ex.getMessage());
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Order placed successfully!",
                    "orderId", saved.getId(),
                    "totalAmount", saved.getTotalAmount(),
                    "status", saved.getStatus()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── Get current user's orders ────────────────────────────
    @GetMapping("/my-orders")
    public ResponseEntity<?> getMyOrders(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            var claims = jwtUtil.validateToken(token);
            String email = claims.getSubject();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(user.getId());
            return ResponseEntity.ok(orders);

        } catch (Exception e) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }
    }

    // ── Get order by ID ──────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        return orderRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── Get orders by reservation ID ─────────────────────────
    @GetMapping("/by-reservation/{reservationId}")
    public ResponseEntity<?> getOrdersByReservation(@PathVariable Long reservationId) {
        List<Order> orders = orderRepository.findByReservationId(reservationId);
        return ResponseEntity.ok(orders);
    }

    // ── Cancel a pending order ───────────────────────────────
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(@RequestHeader("Authorization") String authHeader,
                                         @PathVariable Long id,
                                         @RequestBody(required = false) Map<String, String> body) {
        try {
            String token = authHeader.replace("Bearer ", "");
            var claims = jwtUtil.validateToken(token);
            String email = claims.getSubject();

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found"));

            // Safety check: Make sure this order belongs to the logged-in user
            if (!order.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Unauthorized access."));
            }

            // Safety check: Only allow cancelling if status is PENDING (Order Placed)
            if (!"PENDING".equalsIgnoreCase(order.getStatus())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only pending orders can be cancelled. Orders that are preparing or completed cannot be cancelled."));
            }

            String reason = (body != null && body.get("cancellationReason") != null && !body.get("cancellationReason").trim().isEmpty())
                    ? body.get("cancellationReason")
                    : "Cancelled by customer";

            order.setStatus("CANCELLED");
            order.setCancellationReason(reason);
            orderRepository.save(order);

            return ResponseEntity.ok(Map.of(
                    "message", "Order cancelled successfully.",
                    "orderId", order.getId(),
                    "status", order.getStatus()
            ));

        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Resolves the correct unit price for a product based on the variant string
     * sent by the frontend. Handles flavor-prefixed variants like "Mango - Glass"
     * by stripping the flavor prefix before matching.
     */
    private Double resolveUnitPrice(Product product, String variant) {
        if (variant == null || variant.trim().isEmpty()) {
            // No variant specified — use priceSolo as default
            return product.getPriceSolo();
        }

        // Strip flavor prefix (e.g. "Mango - Glass" → "Glass")
        String baseVariant = variant;
        if (variant.contains(" - ")) {
            baseVariant = variant.substring(variant.lastIndexOf(" - ") + 3).trim();
        }

        String v = baseVariant.toLowerCase();

        // Solo / Glass / Price 1
        if (v.equals("solo") || v.equals("glass") || v.equals("price 1")) {
            if (product.getPriceSolo() != null && product.getPriceSolo() > 0) {
                return product.getPriceSolo();
            }
        }

        // A La Carte / A La Carte 1 / Price 2
        if (v.equals("a la carte") || v.equals("a la carte 1") || v.equals("price 2")) {
            if (product.getPriceALaCarte() != null && product.getPriceALaCarte() > 0) {
                return product.getPriceALaCarte();
            }
        }

        // A La Carte 2
        if (v.equals("a la carte 2")) {
            if (product.getPriceALaCarte2() != null && product.getPriceALaCarte2() > 0) {
                return product.getPriceALaCarte2();
            }
        }

        // 1 Liter
        if (v.equals("1 liter")) {
            if (product.getPrice1Liter() != null && product.getPrice1Liter() > 0) {
                return product.getPrice1Liter();
            }
        }

        // 1.5 Liters
        if (v.equals("1.5 liters")) {
            if (product.getPrice1Point5Liter() != null && product.getPrice1Point5Liter() > 0) {
                return product.getPrice1Point5Liter();
            }
        }

        // 2 Liters
        if (v.equals("2 liters")) {
            if (product.getPrice2Liter() != null && product.getPrice2Liter() > 0) {
                return product.getPrice2Liter();
            }
        }

        // Combo variants (e.g. "Combo: Chicken + Rice")
        if (v.startsWith("combo:") && product.getCustomCombos() != null) {
            String comboName = baseVariant.substring(baseVariant.indexOf(":") + 1).trim();
            for (ProductCombo combo : product.getCustomCombos()) {
                if (combo.getName() != null && combo.getName().trim().equalsIgnoreCase(comboName)) {
                    return combo.getPrice();
                }
            }
        }

        // Group Meal — use priceSolo as the set price
        if (v.equals("group meal")) {
            if (product.getPriceSolo() != null && product.getPriceSolo() > 0) {
                return product.getPriceSolo();
            }
        }

        // Event package variant (long string like "Mains: ... | Sides: ... | Drinks: ...")
        if (v.contains("mains:") || v.contains("sides:") || v.contains("drinks:")) {
            if (product.getPriceSolo() != null && product.getPriceSolo() > 0) {
                return product.getPriceSolo();
            }
        }

        // Default fallback — return null so caller can try other fallbacks
        return null;
    }
}
