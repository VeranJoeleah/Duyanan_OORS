package com.duyanan.backend.controller;

import com.duyanan.backend.model.*;
import com.duyanan.backend.repository.*;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReservationRepository reservationRepository;
    private final EventRepository eventRepository;

    public AdminController(UserRepository userRepository,
                           ProductRepository productRepository,
                           OrderRepository orderRepository,
                           ReservationRepository reservationRepository,
                           EventRepository eventRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.reservationRepository = reservationRepository;
        this.eventRepository = eventRepository;
    }

    // ── Users ──────────────────────────────────────────────
    @GetMapping("/users")
    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream().map(u -> Map.<String, Object>of(
                "id", u.getId(),
                "firstName", u.getFirstName(),
                "lastName", u.getLastName(),
                "email", u.getEmail(),
                "role", u.getRole()
        )).toList();
    }

    // ── Products ──────────────────────────────────────────
    @GetMapping("/products")
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody Product product) {
        Product saved = productRepository.save(product);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        return productRepository.findById(id).map(existing -> {
            existing.setName(product.getName());
            existing.setPriceSolo(product.getPriceSolo());
            existing.setPriceALaCarte(product.getPriceALaCarte());
            existing.setPriceALaCarte2(product.getPriceALaCarte2());
            existing.setPrice1Liter(product.getPrice1Liter());
            existing.setPrice1Point5Liter(product.getPrice1Point5Liter());
            existing.setPrice2Liter(product.getPrice2Liter());
            existing.setDescription(product.getDescription());
            
            if (product.getImageUrl() != null && !product.getImageUrl().equals(existing.getImageUrl())) {
                deleteOldImage(existing.getImageUrl());
            }
            existing.setImageUrl(product.getImageUrl());
            
            existing.setCategory(product.getCategory());
            existing.setFlavors(product.getFlavors());
            
            if (product.getCustomCombos() != null) {
                existing.getCustomCombos().clear();
                existing.getCustomCombos().addAll(product.getCustomCombos());
            }

            productRepository.save(existing);
            return ResponseEntity.ok(existing);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id).map(product -> {
            deleteOldImage(product.getImageUrl());
            productRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Product deleted successfully."));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/products/upload")
    public ResponseEntity<?> uploadProductImage(@RequestParam("image") MultipartFile image) {
        try {
            if (image == null || image.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Image file is required."));
            }
            String imageUrl = saveProductImage(image);
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    // ── Orders (Admin) ────────────────────────────────────
    @GetMapping("/orders")
    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String cancellationReason = body.get("cancellationReason");

        if ("CANCELLED".equalsIgnoreCase(status) && (cancellationReason == null || cancellationReason.trim().isEmpty())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cancellation reason is required when cancelling an order."));
        }

        return orderRepository.findById(id).map(order -> {
            order.setStatus(status);
            if ("CANCELLED".equalsIgnoreCase(status)) {
                order.setCancellationReason(cancellationReason.trim());
            }
            orderRepository.save(order);
            return ResponseEntity.ok(Map.of(
                    "message", "Order status updated.",
                    "orderId", order.getId(),
                    "status", order.getStatus()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Reservations (Admin) ──────────────────────────────
    @GetMapping("/reservations")
    public List<Reservation> getAllReservations() {
        return reservationRepository.findAllByOrderByReservationDateDesc();
    }

    @PutMapping("/reservations/{id}/status")
    public ResponseEntity<?> updateReservationStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        String cancellationReason = body.get("cancellationReason");

        if ("CANCELLED".equalsIgnoreCase(status) && (cancellationReason == null || cancellationReason.trim().isEmpty())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cancellation reason is required when cancelling a reservation."));
        }

        return reservationRepository.findById(id).map(reservation -> {
            reservation.setStatus(status);
            if ("CANCELLED".equalsIgnoreCase(status)) {
                reservation.setCancellationReason(cancellationReason.trim());
            }
            reservationRepository.save(reservation);
            return ResponseEntity.ok(Map.of(
                    "message", "Reservation status updated.",
                    "reservationId", reservation.getId(),
                    "status", reservation.getStatus()
            ));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Events (Admin) ────────────────────────────────────
    private static final String UPLOAD_DIR = "uploads/events/";

    @GetMapping("/events")
    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("eventDate") String eventDate,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        try {
            Event event = new Event();
            event.setTitle(title);
            event.setDescription(description);
            event.setCategory(category);
            event.setEventDate(eventDate);
            event.setCreatedAt(LocalDateTime.now());

            if (image != null && !image.isEmpty()) {
                String imageUrl = saveImage(image);
                event.setImageUrl(imageUrl);
            }

            Event saved = eventRepository.save(event);
            return ResponseEntity.ok(saved);
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload image: " + e.getMessage()));
        }
    }

    @PutMapping("/events/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("category") String category,
            @RequestParam("eventDate") String eventDate,
            @RequestParam(value = "image", required = false) MultipartFile image) {

        return eventRepository.findById(id).map(existing -> {
            existing.setTitle(title);
            existing.setDescription(description);
            existing.setCategory(category);
            existing.setEventDate(eventDate);

            if (image != null && !image.isEmpty()) {
                try {
                    deleteOldImage(existing.getImageUrl());
                    String imageUrl = saveImage(image);
                    existing.setImageUrl(imageUrl);
                } catch (IOException e) {
                    return ResponseEntity.badRequest().body((Object) Map.of("error", "Failed to upload image."));
                }
            }

            eventRepository.save(existing);
            return ResponseEntity.ok((Object) existing);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long id) {
        return eventRepository.findById(id).map(event -> {
            deleteOldImage(event.getImageUrl());
            eventRepository.deleteById(id);
            return ResponseEntity.ok(Map.of("message", "Event deleted successfully."));
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Image Upload Helpers ──────────────────────────────
    private String saveImage(MultipartFile image) throws IOException {
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = image.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;

        Path filePath = uploadPath.resolve(filename);
        Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/events/" + filename;
    }

    private static final String PRODUCT_UPLOAD_DIR = "uploads/products/";

    private String saveProductImage(MultipartFile image) throws IOException {
        Path uploadPath = Paths.get(PRODUCT_UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        String originalFilename = image.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String filename = UUID.randomUUID().toString() + extension;

        Path filePath = uploadPath.resolve(filename);
        Files.copy(image.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/products/" + filename;
    }

    private void deleteOldImage(String imageUrl) {
        if (imageUrl != null && imageUrl.startsWith("/uploads/")) {
            try {
                Path oldFile = Paths.get(imageUrl.substring(1));
                Files.deleteIfExists(oldFile);
            } catch (IOException ignored) {
            }
        }
    }
}
