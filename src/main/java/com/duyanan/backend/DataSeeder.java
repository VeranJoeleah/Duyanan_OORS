package com.duyanan.backend;

import com.duyanan.backend.model.*;
import com.duyanan.backend.repository.*;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {

        // ── Seed admin user ──────────────────────────────────
        if (!userRepository.existsByEmail("admin@duyanan.com")) {
            User admin = new User();
            admin.setFirstName("Admin");
            admin.setLastName("Duyanan");
            admin.setEmail("admin@duyanan.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setRole("ADMIN");
            userRepository.save(admin);
            System.out.println("✅ Default admin account created: admin@duyanan.com / admin123");
        }

        // Product seeding has been removed per user request.
    }
}
