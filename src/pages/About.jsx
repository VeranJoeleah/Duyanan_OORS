import React, { useEffect, useRef, useState } from 'react';
import '../styles/about.css';
import duyananBg from '../assets/img/duyanan_bg.jpg';

// Fallback images for hardcoded events (used when API is unreachable)
import eventCatering from '../assets/img/event_catering.png';
import eventFiesta from '../assets/img/event_fiesta.png';
import eventOpening from '../assets/img/event_opening.png';
import eventCooking from '../assets/img/event_cooking.png';
import eventBirthday from '../assets/img/event_birthday.png';
import eventCharity from '../assets/img/event_charity.png';

const API_URL = import.meta.env.VITE_API_URL;

/* ── Fallback Events (shown when API is unreachable or no events exist) ── */
const fallbackEvents = [
    {
        id: 'fb-1',
        eventDate: 'June 2023',
        category: 'Milestone',
        title: 'Grand Opening Day',
        description:
            'Duyanan Restaurant officially opened its doors in Padre Burgos, Quezon. Over 200 guests joined us for a ribbon-cutting ceremony and a free buffet tasting of our signature dishes.',
        img: eventOpening,
    },
    {
        id: 'fb-2',
        eventDate: 'December 2023',
        category: 'Community',
        title: 'Christmas Charity Feeding Program',
        description:
            'In the spirit of the holiday season, Duyanan hosted a community feeding program for 150+ families in Barangay Danlagan. Free meals, games, and gifts were shared with everyone.',
        img: eventCharity,
    },
    {
        id: 'fb-3',
        eventDate: 'February 2024',
        category: 'Celebration',
        title: "Valentine's Day Dinner Special",
        description:
            'A sold-out candlelight dinner event featuring a 5-course Filipino-fusion menu, live acoustic music, and flower bouquets for every couple. A night to remember!',
        img: eventBirthday,
    },
    {
        id: 'fb-4',
        eventDate: 'May 2024',
        category: 'Fiesta',
        title: 'Pahiyas Festival Catering',
        description:
            'Duyanan proudly catered the Pahiyas Festival street party in Lucban, Quezon — serving over 500 plates of Pancit Habhab and Sizzling Fried Chicken to locals and tourists alike.',
        img: eventFiesta,
    },
    {
        id: 'fb-5',
        eventDate: 'August 2024',
        category: 'Workshop',
        title: 'Lutong Pinoy Cooking Class',
        description:
            'Our head chef hosted a hands-on Filipino cooking workshop where 30 participants learned to cook Sinigang, Kare-Kare, and our secret SFC recipe from scratch.',
        img: eventCooking,
    },
    {
        id: 'fb-6',
        eventDate: 'March 2025',
        category: 'Event',
        title: 'Corporate Gala Catering',
        description:
            'Duyanan was selected to cater a 300-guest corporate gala in Lucena City, featuring a premium boodle-fight-style dinner with live carving stations and dessert bars.',
        img: eventCatering,
    },
];

/* ── Values Data ── */
const values = [
    { icon: '🥗', title: 'Fresh Ingredients', desc: 'We source the finest local ingredients to ensure every dish bursts with authentic flavor and quality.' },
    { icon: '🤲', title: 'Warm Hospitality', desc: 'Our team is dedicated to making you feel at home. Experience service that treats you like family.' },
    { icon: '🌿', title: 'Filipino Heritage', desc: 'Every dish is a tribute to traditional Filipino recipes, passed down through generations with love.' },
    { icon: '🎉', title: 'Community Spirit', desc: 'We believe in giving back — from charity events to local partnerships, Duyanan is rooted in community.' },
];

/* ── Scroll Observer Hook ── */
function useScrollReveal() {
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
        );

        const elements = ref.current?.querySelectorAll('.about-fade-in, .about-fade-in-left, .about-fade-in-right');
        elements?.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return ref;
}

const About = () => {
    const containerRef = useScrollReveal();
    const [events, setEvents] = useState([]);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [useFallback, setUseFallback] = useState(false);

    // Fetch events from the API
    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await fetch(`${API_URL}/api/events`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.length > 0) {
                        setEvents(data);
                        setUseFallback(false);
                    } else {
                        // No events in DB — use fallback
                        setEvents(fallbackEvents);
                        setUseFallback(true);
                    }
                } else {
                    setEvents(fallbackEvents);
                    setUseFallback(true);
                }
            } catch {
                // API unreachable — use fallback
                setEvents(fallbackEvents);
                setUseFallback(true);
            }
            setEventsLoading(false);
        };
        fetchEvents();
    }, []);

    // Re-run scroll reveal when events load
    useEffect(() => {
        if (!eventsLoading && containerRef.current) {
            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('visible');
                        }
                    });
                },
                { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
            );
            const elements = containerRef.current.querySelectorAll('.about-fade-in, .about-fade-in-left, .about-fade-in-right');
            elements.forEach((el) => observer.observe(el));
            return () => observer.disconnect();
        }
    }, [eventsLoading, events]);

    /**
     * Get the image source for an event.
     * - DB events have `imageUrl` like "/uploads/events/uuid.jpg" → prepend API_URL
     * - Fallback events have `img` as a direct import
     */
    const getEventImage = (event) => {
        if (event.imageUrl) {
            return `${API_URL}${event.imageUrl}`;
        }
        if (event.img) {
            return event.img;
        }
        return null;
    };

    return (
        <div ref={containerRef}>
            {/* ════════════════════════════════════════════
                Hero Section
               ════════════════════════════════════════════ */}
            <header
                className="about-hero"
                style={{ backgroundImage: `url(${duyananBg})` }}
            >
                <div className="about-hero-overlay" />
                <div className="about-hero-content">
                    <h1>About Duyanan</h1>
                    <hr className="about-hero-divider" />
                    <p>
                        Where comfort meets flavor — discover the heart, the story,
                        and the milestones behind your favorite Filipino restaurant.
                    </p>
                </div>
            </header>

            {/* ════════════════════════════════════════════
                Our Story Section
               ════════════════════════════════════════════ */}
            <section className="about-story-section">
                <div className="container">
                    <div className="about-story-card about-fade-in">
                        <div className="about-story-text text-center">
                            <h2>Our Story</h2>
                            <p>
                                Born from a love of traditional Filipino hospitality and modern culinary experiences,{' '}
                                <span className="highlight">Duyanan</span> is more than just a restaurant. It's a place
                                to relax, unwind, and enjoy good food with good company.
                            </p>
                            <p>
                                Our name, inspired by the "<span className="highlight">Duyan</span>" (hammock), reflects
                                our commitment to providing a laid-back, comforting atmosphere. Since opening in 2023,
                                we've grown from a humble eatery into a beloved gathering place for families, friends,
                                and the entire Padre Burgos community.
                            </p>
                            <p>
                                Every dish we serve tells a story — from the sizzle of our signature fried chicken to
                                the warmth of a home-cooked Sinigang. At Duyanan, you don't just eat; you experience
                                the heart of Filipino cuisine.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════
                Values Section
               ════════════════════════════════════════════ */}
            <section className="about-values-section">
                <div className="container">
                    <h2 className="about-values-heading about-fade-in">✦ &nbsp; What We Stand For &nbsp; ✦</h2>
                    <div className="row g-4">
                        {values.map((v, i) => (
                            <div className="col-md-6 col-lg-3" key={i}>
                                <div className={`about-value-card about-fade-in`} style={{ transitionDelay: `${i * 0.1}s` }}>
                                    <span className="about-value-icon">{v.icon}</span>
                                    <h4>{v.title}</h4>
                                    <p>{v.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════════════
                Events Timeline Section
               ════════════════════════════════════════════ */}
            <section className="about-events-section">
                <div className="container">
                    <h2 className="about-events-heading about-fade-in">Our Events &amp; Milestones</h2>
                    <p className="about-events-subheading about-fade-in">
                        From grand openings to community outreach, here are the moments
                        that define the Duyanan journey.
                    </p>

                    {eventsLoading ? (
                        <div className="text-center py-5">
                            <div className="duyanan-loading-overlay" style={{ minHeight: '20vh' }}>
                                <div className="duyanan-loading-card">
                                    <div className="duyanan-loading-icon-wrap">
                                        <span className="duyanan-loading-leaf">🍃</span>
                                        <span className="duyanan-loading-ring"></span>
                                    </div>
                                    <p className="duyanan-loading-text">Loading events<span className="duyanan-loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
                                    <p className="duyanan-loading-sub">Duyanan Restaurant</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="events-timeline">
                            {events.map((event, index) => {
                                const imgSrc = getEventImage(event);
                                return (
                                    <div className="timeline-item" key={event.id}>
                                        <div className="timeline-dot" />
                                        <div
                                            className={`timeline-content ${
                                                index % 2 === 0 ? 'about-fade-in-left' : 'about-fade-in-right'
                                            }`}
                                            style={{ transitionDelay: `${index * 0.1}s` }}
                                        >
                                            {imgSrc && (
                                                <div className="timeline-img-wrap">
                                                    <img src={imgSrc} alt={event.title} />
                                                    <span className="timeline-date-badge">
                                                        <i className="bi bi-calendar-event me-1" />
                                                        {event.eventDate}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="timeline-body">
                                                <span className="timeline-category">{event.category}</span>
                                                <h3>{event.title}</h3>
                                                <p>{event.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* ════════════════════════════════════════════
                Visit Us Section
               ════════════════════════════════════════════ */}
            <section className="about-visit-section">
                <div className="container">
                    <div className="about-visit-card about-fade-in">
                        <h2>Visit Us</h2>
                        <p className="visit-info">
                            <strong>Duyanan Restaurant</strong>
                        </p>
                        <p className="visit-info">
                            <i className="bi bi-geo-alt-fill" />
                            Sitio Hacienda, Brgy. Danlagan, Padre Burgos, Quezon
                        </p>
                        <p className="visit-info">
                            <i className="bi bi-clock-fill" />
                            Open Daily: 10:00 AM – 9:00 PM
                        </p>
                        <hr style={{ borderColor: 'rgba(160,64,0,0.15)', width: '50%', margin: '24px auto' }} />
                        <p className="visit-info">
                            <i className="bi bi-telephone-fill" />
                            0928-391-0105
                        </p>
                        <p className="visit-info">
                            <i className="bi bi-envelope-fill" />
                            duyanan.ph@gmail.com
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default About;
