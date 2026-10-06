package com.duyanan.backend.controller;

import com.duyanan.backend.model.Event;
import com.duyanan.backend.repository.EventRepository;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    /**
     * Public endpoint — returns all events for the About Us page.
     * No authentication required.
     */
    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByCreatedAtDesc();
    }
}
