import React from 'react';

const Footer = () => {
    return (
        <footer className="text-center text-lg-start mt-auto py-5" style={{ 
            backgroundColor: '#ffffff', 
            color: '#333333', 
            borderTop: '1px solid rgba(0, 0, 0, 0.08)'
        }}>
            <div className="container px-4">
                <div className="row align-items-center">
                    {/* Left Column (50% Width): Emphasized Brand Logo occupying the space */}
                    <div className="col-lg-6 col-md-12 mb-4 mb-lg-0 d-flex flex-column justify-content-center">
                        <div className="d-flex flex-column" style={{ lineHeight: 0.9 }}>
                            <span style={{ 
                                fontSize: 'clamp(6rem, 14vw, 12rem)', 
                                fontWeight: 900, 
                                letterSpacing: '-0.05em', 
                                color: 'var(--dark-brown)',
                                fontFamily: "'Jost', sans-serif"
                            }}>
                                Duyanan
                            </span>
                            <span style={{ 
                                fontSize: 'clamp(1.5rem, 3.8vw, 3rem)', 
                                fontWeight: 700, 
                                letterSpacing: '0.62em', 
                                textTransform: 'uppercase', 
                                color: 'var(--accent-orange)',
                                marginTop: '20px',
                                fontFamily: "'Jost', sans-serif"
                            }}>
                                Restaurant
                            </span>
                        </div>
                        <p className="text-muted mt-4 mb-0" style={{ maxWidth: '500px', fontSize: '0.96rem', lineHeight: '1.6' }}>
                            Experience the best of Filipino cuisine with a modern twist. 
                            Tuloy po kayo!
                        </p>
                    </div>

                    {/* Right Column (50% Width): Contact Section (Links section is removed) */}
                    <div className="col-lg-6 col-md-12 d-flex flex-column align-items-lg-end justify-content-center">
                        <div className="text-lg-end">
                            <h6 className="text-uppercase fw-bold mb-3" style={{ color: 'var(--dark-brown)', letterSpacing: '0.12em', fontSize: '0.9rem' }}>
                                Contact Us
                            </h6>
                            <ul className="list-unstyled mb-0 text-muted" style={{ fontSize: '0.92rem', lineHeight: '1.8' }}>
                                <li className="mb-2">
                                    <i className="bi bi-geo-alt me-2" style={{ color: 'var(--accent-orange)' }}></i>
                                    Sitio Hacienda, Brgy. Danlagan, Padre Burgos, Quezon
                                </li>
                                <li className="mb-2">
                                    <i className="bi bi-telephone me-2" style={{ color: 'var(--accent-orange)' }}></i>
                                    FOR INQUIRIES, RESERVATION & DELIVERY
                                    <br></br>PLEASE CALL or TEXT: 0928-391-0105
                                </li>
                                <li>
                                    <i className="bi bi-envelope me-2" style={{ color: 'var(--accent-orange)' }}></i>
                                    <a href="mailto:duyanan.ph@gmail.com" style={{ color: '#333333', fontWeight: 600, textDecoration: 'none', borderBottom: '1px dashed rgba(0,0,0,0.2)' }} className="hover-orange-text">
                                        duyanan.ph@gmail.com
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar: Copyright & Muted Links */}
                <div className="row mt-5 pt-4 border-top" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
                    <div className="col-md-6 text-center text-md-start text-muted small mb-2 mb-md-0">
                        © 2026 Duyanan Restaurant. All rights reserved.
                    </div>
                    <div className="col-md-6 text-center text-md-end small">
                        <a href="/" className="me-3 text-muted text-decoration-none hover-orange">Home</a>
                        <a href="/menu" className="me-3 text-muted text-decoration-none hover-orange">Menu</a>
                        <a href="/book-reservation" className="text-muted text-decoration-none hover-orange">Book Reservation</a>
                    </div>
                </div>
            </div>

            <style>{`
                .hover-orange:hover {
                    color: var(--accent-orange) !important;
                }
                .hover-orange-text:hover {
                    color: var(--accent-orange) !important;
                    border-bottom-color: var(--accent-orange) !important;
                }
            `}</style>
        </footer>
    );
};

export default Footer;
