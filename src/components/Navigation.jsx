import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Navigation = () => {
    const { cart } = useCart();
    const { isAuthenticated, isAdmin, user, logout } = useAuth();
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const location = useLocation();
    const navigate = useNavigate();
    const [isNavCollapsed, setIsNavCollapsed] = useState(true);
    const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
    const [pendingReservationsCount, setPendingReservationsCount] = useState(0);

    const fetchCounts = async () => {
        if (!isAuthenticated || !user?.token) return;
        try {
            const lastViewedOrderId = parseInt(localStorage.getItem('lastViewedOrderId') || '0', 10);
            const lastViewedReservationId = parseInt(localStorage.getItem('lastViewedReservationId') || '0', 10);
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

            const ordersRes = await fetch(`${API_URL}/api/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (ordersRes.ok) {
                const orders = await ordersRes.json();
                if (Array.isArray(orders)) {
                    const count = orders.filter(o => 
                        parseInt(o.id || 0, 10) > lastViewedOrderId &&
                        (o.status?.toUpperCase() === 'PENDING' || o.status?.toUpperCase() === 'PREPARING')
                    ).length;
                    setPendingOrdersCount(count);
                }
            }

            const resRes = await fetch(`${API_URL}/api/reservations/my-reservations`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            });
            if (resRes.ok) {
                const reservations = await resRes.json();
                if (Array.isArray(reservations)) {
                    const count = reservations.filter(r => 
                        parseInt(r.id || 0, 10) > lastViewedReservationId &&
                        (r.status?.toUpperCase() === 'PENDING' || r.status?.toUpperCase() === 'CONFIRMED')
                    ).length;
                    setPendingReservationsCount(count);
                }
            }
        } catch (err) {
            console.error("Error fetching notification counts for navbar dropdown:", err);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchCounts();
        } else {
            setPendingOrdersCount(0);
            setPendingReservationsCount(0);
        }
    }, [isAuthenticated, user?.token, location]);

    const totalNotifications = pendingOrdersCount + pendingReservationsCount;

    useEffect(() => { setIsNavCollapsed(true); }, [location]);

    const handleLogout = () => { logout(); navigate('/'); };
    const navClass = 'nav-filled';
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

    if (location.pathname === '/admin') return null;

    if (isAuthPage) {
        return (
            <nav className={`navbar navbar-expand-lg nav-glass fixed-top ${navClass}`} style={{ minHeight: 'var(--nav-height)' }}>
                <div className="container-fluid px-4 px-lg-5">
                    <Link className="navbar-brand d-flex align-items-center" to="/">
                        <span style={{ fontSize: '2rem', color: '#fff', marginRight: '5px', fontWeight: 'bold' }}>Duyanan</span>
                        <span style={{ fontSize: '1.5rem', transform: 'rotate(-20deg)', display: 'inline-block' }}>🍃</span>
                    </Link>
                    <div className="d-flex align-items-center">
                        {location.pathname === '/login' ? (
                            <Link to="/register" className="btn shadow-none" style={{ color: '#fff', fontSize: '1.5rem', padding: '8px' }}><i className="bi bi-person-plus"></i></Link>
                        ) : (
                            <Link to="/login" className="btn shadow-none" style={{ color: '#fff', fontSize: '1.5rem', padding: '8px' }}><i className="bi bi-person"></i></Link>
                        )}
                    </div>
                </div>
            </nav>
        );
    }

    return (
        <nav className={`navbar navbar-expand-lg nav-glass fixed-top ${navClass}`} style={{ minHeight: 'var(--nav-height)' }}>
            <div className="container-fluid px-4 px-lg-5">
                {/* Mobile Header Layout (visible only on small screens) */}
                <div className="d-flex justify-content-between align-items-center w-100 d-lg-none position-relative">
                    {/* Hamburger Menu on Left */}
                    <button className="navbar-toggler border-0 shadow-none px-0" type="button" onClick={() => setIsNavCollapsed(!isNavCollapsed)} aria-controls="navbarCollapse" aria-expanded={!isNavCollapsed} aria-label="Toggle navigation">
                        <i className={`bi ${isNavCollapsed ? 'bi-list' : 'bi-x-lg'} text-white`} style={{ fontSize: '2.2rem', display: 'inline-block', transition: 'transform 0.3s ease', transform: isNavCollapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}></i>
                    </button>
                    
                    {/* Brand Centered */}
                    <Link className="navbar-brand mx-auto d-flex align-items-center justify-content-center" to="/" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                        <span style={{ fontSize: '1.8rem', color: '#fff', fontWeight: 'bold', textShadow: '1px 1px 2px rgba(0,0,0,0.5)', marginRight: '4px' }}>Duyanan</span>
                        <span style={{ fontSize: '1.2rem', transform: 'rotate(-20deg)', filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.3))' }}>🍃</span>
                    </Link>

                    {/* Cart Button on Right */}
                    <Link className="btn bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm position-relative" to={isAuthenticated ? "/cart" : "/menu"} style={{ width: '42px', height: '42px' }}>
                        <i className="bi bi-cart3" style={{ fontSize: '1.3rem', color: 'var(--accent-orange)' }}></i>
                        {isAuthenticated && cartCount > 0 && (<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark" style={{ transform: 'translate(-30%, -30%)', fontSize: '0.7rem' }}>{cartCount}</span>)}
                    </Link>
                </div>

                {/* Desktop Brand (hidden on mobile) */}
                <Link className="navbar-brand d-none d-lg-flex align-items-center" to="/">
                   <span style={{ fontSize: '2rem', color: '#fff', marginRight: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>Duyanan</span>
                   <span style={{ fontSize: '1.5rem', transform: 'rotate(-20deg)', filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.3))' }}>🍃</span>
                </Link>
                <div className={`${isNavCollapsed ? 'collapse' : ''} navbar-collapse`} id="navbarCollapse">
                    <ul className="navbar-nav ms-auto align-items-center">
                        {/* Mobile Navigation Header */}
                        <li className="nav-item d-lg-none w-100 mb-2 nav-header">
                            <span className="px-3 fw-bold fs-5" style={{ color: 'var(--primary-brown)', letterSpacing: '1px' }}>Navigation</span>
                        </li>
                        <li className="nav-item"><Link className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} to="/" onClick={() => setIsNavCollapsed(true)} style={{ color: '#fff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}><i className="bi bi-house-door me-3 d-lg-none"></i>Home</Link></li>
                        <li className="nav-item"><Link className={`nav-link ${location.pathname === '/menu' ? 'active' : ''}`} to="/menu" onClick={() => setIsNavCollapsed(true)} style={{ color: '#fff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}><i className="bi bi-book me-3 d-lg-none"></i>Menu</Link></li>
                        <li className="nav-item"><Link className={`nav-link ${location.pathname === '/book-reservation' ? 'active' : ''}`} to="/book-reservation" onClick={() => setIsNavCollapsed(true)} style={{ color: '#fff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}><i className="bi bi-calendar-event me-3 d-lg-none"></i>Book Reservation</Link></li>
                        <li className="nav-item"><Link className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`} to="/about" onClick={() => setIsNavCollapsed(true)} style={{ color: '#fff', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}><i className="bi bi-info-circle me-3 d-lg-none"></i>About Us</Link></li>

                        {isAuthenticated && isAdmin && (
                            <li className="nav-item"><Link className="nav-link" to="/admin" onClick={() => setIsNavCollapsed(true)} style={{ color: '#ffd580', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}><i className="bi bi-shield-lock me-3"></i>Admin</Link></li>
                        )}

                        {isAuthenticated ? (
                            <>
                                <li className="nav-item dropdown ms-lg-2 d-none d-lg-flex align-items-center profile-dropdown-container" onMouseEnter={fetchCounts}>
                                     <Link className="btn shadow-none d-flex align-items-center position-relative" to="/profile" style={{ color: '#fff', padding: '8px', fontSize: '1.5rem' }}>
                                        <i className="bi bi-person"></i>
                                        {totalNotifications > 0 && (
                                            <span 
                                                className="position-absolute badge rounded-pill bg-danger shadow" 
                                                style={{ 
                                                    top: '2px', 
                                                    right: '2px', 
                                                    fontSize: '0.65rem',
                                                    padding: '3px 6px',
                                                    zIndex: 10
                                                }}
                                            >
                                                {totalNotifications}
                                            </span>
                                        )}
                                    </Link>
                                    <ul className="dropdown-menu dropdown-menu-end shadow border-0" style={{ margin: 0 }}>
                                        <li>
                                            <Link className="dropdown-item" to="/profile" state={{ tab: 'profile' }}>
                                                <i className="bi bi-person me-2"></i>My Profile
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item d-flex justify-content-between align-items-center" to="/profile" state={{ tab: 'orders' }}>
                                                <span><i className="bi bi-receipt me-2"></i>My Orders</span>
                                                {pendingOrdersCount > 0 && (
                                                    <span className="badge rounded-pill bg-danger px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                                                        {pendingOrdersCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                        <li>
                                            <Link className="dropdown-item d-flex justify-content-between align-items-center" to="/profile" state={{ tab: 'reservations' }}>
                                                <span><i className="bi bi-calendar-event me-2"></i>My Reservations</span>
                                                {pendingReservationsCount > 0 && (
                                                    <span className="badge rounded-pill bg-danger px-2 py-0.5" style={{ fontSize: '0.7rem' }}>
                                                        {pendingReservationsCount}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button className="dropdown-item text-danger" onClick={handleLogout} style={{ border: 'none', background: 'transparent', textAlign: 'left' }}>
                                                <i className="bi bi-box-arrow-right me-2"></i>Logout
                                            </button>
                                        </li>
                                    </ul>
                                </li>
                                <li className="nav-item w-100 d-lg-none">
                                     <Link className="nav-link d-flex justify-content-between align-items-center" to="/profile" onClick={() => setIsNavCollapsed(true)} style={{ color: '#fff', fontWeight: 'bold' }}>
                                        <span><i className="bi bi-person-circle me-3"></i>My Profile</span>
                                        {totalNotifications > 0 && (
                                            <span className="badge rounded-pill bg-danger px-2 py-1" style={{ fontSize: '0.75rem' }}>
                                                {totalNotifications}
                                            </span>
                                        )}
                                     </Link>
                                </li>
                                <li className="nav-item ms-lg-2 d-none d-lg-flex align-items-center position-relative">
                                     <Link className="btn shadow-sm d-flex align-items-center rounded-pill" to="/cart" style={{ backgroundColor: '#fff', color: 'var(--accent-orange)', padding: '8px 24px', fontWeight: 'bold', textDecoration: 'none' }}>
                                        <i className="bi bi-cart3 me-2" style={{ fontSize: '1.2rem', color: 'var(--accent-orange)' }}></i>
                                        Order Now
                                     </Link>
                                     {cartCount > 0 && (<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-dark shadow" style={{ transform: 'translate(-50%, -50%)', zIndex: 10 }}>{cartCount}</span>)}
                                </li>
                                <li className="nav-item w-100 d-lg-none" style={{ borderTop: '2px solid rgba(160, 64, 0, 0.1)' }}>
                                     <button className="nav-link text-danger w-100 text-start border-0 bg-transparent" onClick={handleLogout} style={{ fontWeight: 'bold' }}>
                                        <i className="bi bi-box-arrow-right me-3"></i>Log out
                                     </button>
                                </li>
                            </>
                        ) : (
                            <>
                                <li className="nav-item ms-lg-2 d-none d-lg-flex align-items-center">
                                    <Link className="btn shadow-none" to="/login" style={{ color: '#fff', padding: '8px', fontSize: '1.5rem' }}>
                                        <i className="bi bi-person"></i>
                                    </Link>
                                </li>
                                <li className="nav-item w-100 d-lg-none">
                                    <Link className="nav-link" to="/login" onClick={() => setIsNavCollapsed(true)} style={{ fontWeight: 'bold' }}>
                                        <i className="bi bi-box-arrow-in-right me-3"></i>Log In
                                    </Link>
                                </li>
                                <li className="nav-item ms-lg-2 d-none d-lg-flex align-items-center">
                                    <Link className="btn shadow-sm rounded-pill" to="/menu" style={{ backgroundColor: '#fff', color: 'var(--accent-orange)', padding: '8px 24px', fontWeight: 'bold', textDecoration: 'none' }}>
                                        <i className="bi bi-cart3 me-2" style={{ fontSize: '1.2rem', color: 'var(--accent-orange)' }}></i>
                                        Order Now
                                    </Link>
                                </li>
                            </>
                        )}
                    </ul>
                </div>
            </div>
            <style>{`
                .profile-dropdown-container {
                    position: relative;
                }
                .profile-dropdown-container:hover .dropdown-menu {
                    display: block;
                    animation: fadeInDropdown 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }
                .profile-dropdown-container .dropdown-menu {
                    display: none;
                    background: rgba(253, 251, 247, 0.98);
                    backdrop-filter: blur(20px);
                    border-radius: 14px;
                    padding: 8px 0;
                    min-width: 200px;
                    border: 1px solid rgba(139, 58, 15, 0.12) !important;
                    top: 100%;
                    right: 0;
                }
                .profile-dropdown-container .dropdown-item {
                    padding: 10px 16px;
                    margin: 2px 8px;
                    border-radius: 8px;
                    width: calc(100% - 16px) !important;
                    box-sizing: border-box;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--primary-brown) !important;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                }
                .profile-dropdown-container .dropdown-item:hover {
                    background-color: var(--accent-orange) !important;
                    color: #fff !important;
                }
                .profile-dropdown-container .dropdown-item i {
                    font-size: 1.05rem;
                    color: inherit;
                }
                .profile-dropdown-container .dropdown-divider {
                    margin: 6px 0;
                    border-top: 1px solid rgba(139, 58, 15, 0.08);
                }
                @keyframes fadeInDropdown {
                    from {
                        opacity: 0;
                        transform: translateY(12px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .navbar .badge.bg-danger {
                    background-color: #dc3545 !important;
                    color: #ffffff !important;
                    border: 1.5px solid #ffffff !important;
                    opacity: 1 !important;
                    font-weight: bold !important;
                    padding: 3px 6px !important;
                    letter-spacing: normal !important;
                }
            `}</style>
        </nav>
    );
};

export default Navigation;
