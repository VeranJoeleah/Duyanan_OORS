import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Swal from 'sweetalert2';
import 'bootstrap-icons/font/bootstrap-icons.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '';
    try {
        const [hoursStr, minutesStr] = timeStr.split(':');
        let hours = parseInt(hoursStr, 10);
        const minutes = minutesStr ? minutesStr.substring(0, 2) : '00';
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
};

const Profile = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const { user, login } = useAuth(); // We might need to update auth context if email/name changes
    const { setReservationId } = useCart();
    const navigate = useNavigate();
    
    const location = useLocation();

    useEffect(() => {
        if (location.state?.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location]);

    const [myOrders, setMyOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [myReservations, setMyReservations] = useState([]);
    const [lastViewedOrderId, setLastViewedOrderId] = useState(() => 
        parseInt(localStorage.getItem('lastViewedOrderId') || '0', 10)
    );
    const [lastViewedReservationId, setLastViewedReservationId] = useState(() => 
        parseInt(localStorage.getItem('lastViewedReservationId') || '0', 10)
    );
    const [loadingReservations, setLoadingReservations] = useState(false);
    const [editingReservation, setEditingReservation] = useState(null);
    const [editForm, setEditForm] = useState({
        seatingType: '',
        date: '',
        time: '',
        guests: '',
        request: '',
        eventType: 'Casual Dining 🍽️'
    });
    const [loadingProfile, setLoadingProfile] = useState(true);
    
    // Feedback/Review State
    const [selectedOrderForFeedback, setSelectedOrderForFeedback] = useState(null);
    const [feedbackRating, setFeedbackRating] = useState(5);
    const [feedbackComment, setFeedbackComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    
    // Profile Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        address: ''
    });

    const [commPrefs, setCommPrefs] = useState({
        offersPush: false,
        offersEmail: false,
        offersSms: false,
        updatesPush: true
    });

    useEffect(() => {
        if (user?.token) {
            fetchUserProfile();
            fetchOrders();
            fetchReservations();
        } else {
            setLoadingProfile(false);
        }
    }, [user?.token]);

    useEffect(() => {
        if (activeTab === 'orders' && myOrders.length > 0) {
            const maxId = myOrders.reduce((max, o) => Math.max(max, parseInt(o.id || 0, 10)), 0);
            if (maxId > lastViewedOrderId) {
                localStorage.setItem('lastViewedOrderId', maxId.toString());
                setLastViewedOrderId(maxId);
            }
        }
    }, [activeTab, myOrders, lastViewedOrderId]);

    useEffect(() => {
        if (activeTab === 'reservations' && myReservations.length > 0) {
            const maxId = myReservations.reduce((max, r) => Math.max(max, parseInt(r.id || 0, 10)), 0);
            if (maxId > lastViewedReservationId) {
                localStorage.setItem('lastViewedReservationId', maxId.toString());
                setLastViewedReservationId(maxId);
            }
        }
    }, [activeTab, myReservations, lastViewedReservationId]);

    const fetchUserProfile = () => {
        setLoadingProfile(true);
        fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${user.token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        })
        .then(data => {
            setProfileData({
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || ''
            });
        })
        .catch(err => console.error("Error fetching profile:", err))
        .finally(() => setLoadingProfile(false));
    };

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = () => {
        if (!profileData.firstName || !profileData.lastName) {
            Swal.fire('Error', 'First Name and Last Name are required.', 'error');
            return;
        }

        fetch(`${API_URL}/api/auth/me`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.token}` 
            },
            body: JSON.stringify(profileData)
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) {
                Swal.fire('Error', data.error, 'error');
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Profile Updated',
                    text: 'Your information has been successfully updated.',
                    confirmButtonColor: '#8B3A0F'
                });
                setIsEditing(false);
                // Update context if name changed
                if (login && user) {
                    const updatedUser = { ...user, firstName: data.firstName, lastName: data.lastName };
                    login(updatedUser);
                }
            }
        })
        .catch(err => {
            console.error(err);
            Swal.fire('Error', 'An unexpected error occurred.', 'error');
        });
    };

    const handleToggle = (key) => {
        setCommPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const fetchOrders = () => {
        if (user?.token) {
            setLoadingOrders(true);
            fetch(`${API_URL}/api/orders/my-orders`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMyOrders(data);
            })
            .catch(err => console.error("Error fetching orders:", err))
            .finally(() => setLoadingOrders(false));
        }
    };

    const fetchReservations = () => {
        if (user?.token) {
            setLoadingReservations(true);
            fetch(`${API_URL}/api/reservations/my-reservations`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMyReservations(data);
            })
            .catch(err => console.error("Error fetching reservations:", err))
            .finally(() => setLoadingReservations(false));
        }
    };

    const handleOpenEditReservation = (res) => {
        setEditingReservation(res);
        setEditForm({
            seatingType: res.seatingType || '',
            date: res.reservationDate || '',
            time: res.reservationTime || '',
            guests: res.numberOfGuests || '',
            request: res.specialRequests || '',
            eventType: res.eventType || ''
        });
    };

    const handleUpdateReservation = async (e) => {
        e.preventDefault();

        const selectedDateTime = new Date(`${editForm.date}T${editForm.time}`);
        if (selectedDateTime < new Date()) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Date/Time',
                text: 'Reservation date and time cannot be in the past!',
                confirmButtonColor: 'var(--primary-brown)'
            });
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/reservations/${editingReservation.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    guestName: editingReservation.guestName,
                    contactNumber: editingReservation.contactNumber,
                    reservationDate: editForm.date,
                    reservationTime: editForm.time,
                    numberOfGuests: editForm.guests,
                    specialRequests: editForm.request,
                    seatingType: editForm.seatingType,
                    eventType: editForm.eventType
                })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Reservation Updated!',
                    text: 'Your reservation details have been successfully modified.',
                    confirmButtonColor: 'var(--primary-brown)',
                    timer: 3000
                });
                setEditingReservation(null);
                fetchReservations();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: data.error || 'Something went wrong. Please try again.',
                    confirmButtonColor: 'var(--primary-brown)'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: 'Could not connect to the server. Please check your internet.',
                confirmButtonColor: 'var(--primary-brown)'
            });
        }
    };

    const handleCancelReservation = async (resId) => {
        const result = await Swal.fire({
            title: 'Cancel Reservation?',
            text: 'Are you sure you want to cancel this reservation? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, cancel it',
            cancelButtonText: 'Keep it'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_URL}/api/reservations/${resId}/cancel`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Reservation Cancelled',
                        text: 'Your reservation has been successfully cancelled.',
                        confirmButtonColor: 'var(--primary-brown)',
                        timer: 3000
                    });
                    fetchReservations();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cancellation Failed',
                        text: data.error || 'Something went wrong. Please try again.',
                        confirmButtonColor: 'var(--primary-brown)'
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Could not connect to the server. Please check your internet.',
                    confirmButtonColor: 'var(--primary-brown)'
                });
            }
        }
    };

    const handleCancelOrder = async (orderId) => {
        const { value: reason, isConfirmed } = await Swal.fire({
            title: 'Cancel Order',
            html: `
                <p style="color:#666; font-size:0.92rem; margin-bottom:12px;">
                    Please tell us why you want to cancel this order.
                </p>
                <textarea
                    id="cancel-reason-input"
                    class="swal2-textarea"
                    placeholder="e.g. Changed my mind, ordered wrong item, etc."
                    rows="3"
                    style="font-size:0.9rem; resize:none;"
                ></textarea>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#6c757d',
            confirmButtonText: '<i class="bi bi-x-circle me-1"></i> Yes, Cancel Order',
            cancelButtonText: 'Keep Order',
            focusConfirm: false,
            preConfirm: () => {
                const val = document.getElementById('cancel-reason-input')?.value?.trim();
                if (!val) {
                    Swal.showValidationMessage('⚠️ A cancellation reason is required before proceeding.');
                    return false;
                }
                return val;
            }
        });

        if (isConfirmed && reason) {
            try {
                const response = await fetch(`${API_URL}/api/orders/${orderId}/cancel`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({
                        cancellationReason: reason
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Order Cancelled',
                        text: 'Your order has been successfully cancelled.',
                        confirmButtonColor: 'var(--primary-brown)',
                        timer: 3000
                    });
                    fetchOrders();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cancellation Failed',
                        text: data.error || 'Something went wrong. Please try again.',
                        confirmButtonColor: 'var(--primary-brown)'
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Could not connect to the server. Please check your internet.',
                    confirmButtonColor: 'var(--primary-brown)'
                });
            }
        }
    };


    const handleOpenFeedbackModal = (order) => {
        setSelectedOrderForFeedback(order);
        setFeedbackRating(5);
        setFeedbackComment('');
    };

    const handleSubmitFeedback = async (e) => {
        e.preventDefault();
        if (!selectedOrderForFeedback) return;
        
        setSubmittingFeedback(true);
        try {
            const response = await fetch(`${API_URL}/api/feedback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    orderId: selectedOrderForFeedback.id,
                    rating: feedbackRating,
                    comment: feedbackComment
                })
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Feedback Submitted!',
                    text: 'Thank you for your feedback!',
                    confirmButtonColor: 'var(--primary-brown)',
                    timer: 3000
                });
                setSelectedOrderForFeedback(null);
                fetchOrders(); // Refresh order list to reflect the new feedback!
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Submission Failed',
                    text: data.error || 'Something went wrong.',
                    confirmButtonColor: 'var(--primary-brown)'
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: 'Could not connect to the server.',
                confirmButtonColor: 'var(--primary-brown)'
            });
        } finally {
            setSubmittingFeedback(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'orders') fetchOrders();
        if (activeTab === 'reservations') fetchReservations();
    }, [activeTab, user?.token]);

    const getStatusInfo = (status) => {
        switch (status?.toUpperCase()) {
            case 'PENDING': return { text: 'Order Placed', width: '33%', color: 'var(--accent-orange)', icon: 'bi-clock' };
            case 'PREPARING': return { text: 'Preparing Food', width: '66%', color: '#f39c12', icon: 'bi-fire' };
            case 'COMPLETED': return { text: 'Completed', width: '100%', color: '#2ecc71', icon: 'bi-check-circle-fill' };
            case 'CANCELLED': return { text: 'Cancelled', width: '100%', color: '#e74c3c', icon: 'bi-x-circle' };
            default: return { text: 'Pending', width: '33%', color: 'var(--accent-orange)', icon: 'bi-clock' };
        }
    };

    const renderMainContent = () => {
        if (activeTab === 'profile') {
            return (
                <>
                    <div className="mb-4 d-flex justify-content-between align-items-end">
                        <div>
                            <h4 className="fw-bold mb-1" style={{ color: 'var(--text-dark)' }}>My Profile</h4>
                            <p className="text-muted small mb-0">Manage your personal information</p>
                        </div>
                        {!isEditing ? (
                            <button onClick={() => setIsEditing(true)} className="btn btn-sm text-white px-3 py-2 fw-bold shadow-sm" style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '8px' }}>
                                <i className="bi bi-pencil-square me-1"></i> Edit Profile
                            </button>
                        ) : (
                            <div className="d-flex gap-2">
                                <button onClick={() => { setIsEditing(false); fetchUserProfile(); }} className="btn btn-sm btn-light px-3 py-2 fw-bold shadow-sm" style={{ borderRadius: '8px' }}>
                                    Cancel
                                </button>
                                <button onClick={handleSaveProfile} className="btn btn-sm text-white px-3 py-2 fw-bold shadow-sm" style={{ backgroundColor: '#2ecc71', borderRadius: '8px' }}>
                                    <i className="bi bi-check-circle me-1"></i> Save Changes
                                </button>
                            </div>
                        )}
                    </div>

                    {loadingProfile ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-secondary" role="status"></div>
                            <p className="text-muted mt-3 small">Loading profile...</p>
                        </div>
                    ) : (
                        <div className="card border-0 bg-white" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <div className="card-body p-4 p-md-5">
                                
                                <div className="row g-4">
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small fw-bold text-uppercase tracking-wide"><i className="bi bi-person me-2"></i>First Name</label>
                                        {isEditing ? (
                                            <input type="text" className="form-control form-control-lg bg-light border-0" name="firstName" value={profileData.firstName} onChange={handleProfileChange} />
                                        ) : (
                                            <p className="fs-5 fw-medium mb-0">{profileData.firstName || <span className="text-muted fst-italic fs-6">Not provided</span>}</p>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small fw-bold text-uppercase tracking-wide"><i className="bi bi-person me-2"></i>Last Name</label>
                                        {isEditing ? (
                                            <input type="text" className="form-control form-control-lg bg-light border-0" name="lastName" value={profileData.lastName} onChange={handleProfileChange} />
                                        ) : (
                                            <p className="fs-5 fw-medium mb-0">{profileData.lastName || <span className="text-muted fst-italic fs-6">Not provided</span>}</p>
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small fw-bold text-uppercase tracking-wide"><i className="bi bi-envelope me-2"></i>Email Address</label>
                                        <p className="fs-5 fw-medium mb-0 text-muted">{profileData.email}</p>
                                        {isEditing && <small className="text-muted d-block mt-1"><i className="bi bi-info-circle me-1"></i>Email cannot be changed.</small>}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label text-muted small fw-bold text-uppercase tracking-wide"><i className="bi bi-telephone me-2"></i>Mobile Number</label>
                                        {isEditing ? (
                                            <input type="text" className="form-control form-control-lg bg-light border-0" name="phone" value={profileData.phone} onChange={handleProfileChange} placeholder="+63 9XX XXX XXXX" />
                                        ) : (
                                            <p className="fs-5 fw-medium mb-0">{profileData.phone || <span className="text-muted fst-italic fs-6">Not provided</span>}</p>
                                        )}
                                    </div>
                                    <div className="col-12 mt-4 pt-3 border-top">
                                        <label className="form-label text-muted small fw-bold text-uppercase tracking-wide"><i className="bi bi-geo-alt me-2"></i>Delivery Address</label>
                                        {isEditing ? (
                                            <textarea className="form-control bg-light border-0" rows="3" name="address" value={profileData.address} onChange={handleProfileChange} placeholder="Enter your full delivery address..."></textarea>
                                        ) : (
                                            <p className="fs-5 fw-medium mb-0">{profileData.address || <span className="text-muted fst-italic fs-6">Not provided</span>}</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}
                </>
            );
        }



        if (activeTab === 'orders') {
            return (
                <>
                    <div className="mb-4 d-flex justify-content-between align-items-end">
                        <div>
                            <h4 className="fw-bold mb-1" style={{ color: 'var(--text-dark)' }}>My Orders</h4>
                            <p className="text-muted small mb-0">Track your order history effortlessly</p>
                        </div>
                        <button onClick={fetchOrders} className="btn btn-sm text-white px-3 py-2 fw-bold" style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '8px' }}>
                            <i className="bi bi-arrow-clockwise me-1"></i> Refresh Status
                        </button>
                    </div>

                    {loadingOrders ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-secondary" role="status"></div>
                            <p className="text-muted mt-3 small">Fetching your orders...</p>
                        </div>
                    ) : myOrders.length === 0 ? (
                        <div className="card border-0 bg-white text-center py-5" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <i className="bi bi-bag text-muted mb-3 d-block" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                            <h5 className="fw-bold mb-2" style={{ color: 'var(--text-dark)' }}>Your order history is empty</h5>
                            <p className="text-muted small mb-4">You haven't placed any orders yet.</p>
                            <div>
                                <Link to="/menu" className="btn btn-sm shadow-sm" style={{ backgroundColor: 'var(--accent-orange)', color: '#fff', borderRadius: '50px', padding: '10px 30px', fontWeight: 'bold' }}>
                                    Order Now
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="orders-list d-flex flex-column gap-4">
                            {myOrders.map(order => {
                                const statusInfo = getStatusInfo(order.status);
                                const dateStr = new Date(order.orderDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
                                
                                return (
                                    <div key={order.id} className="card border-0 bg-white" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                                        <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
                                            <div>
                                                <div className="text-muted small mb-0 d-flex align-items-center gap-2 flex-wrap">
                                                    <span><i className="bi bi-calendar3 me-1"></i> {dateStr}</span>
                                                    {(order.orderType === 'DINE_IN' || order.reservation) && (
                                                        <span className="badge bg-warning text-dark border">
                                                            🍽️ Dine-In Pre-Order {order.reservation?.id ? `(Res #${order.reservation.id})` : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-end">
                                                <h5 className="fw-bold mb-0" style={{ color: 'var(--text-dark)' }}>₱{order.totalAmount.toFixed(2)}</h5>
                                                <span className="badge rounded-pill" style={{ backgroundColor: `${statusInfo.color}20`, color: statusInfo.color }}>
                                                    <i className={`bi ${statusInfo.icon} me-1`}></i>
                                                    {statusInfo.text}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="card-body px-4 py-3">
                                            {order.status !== 'CANCELLED' && (
                                                <div className="mb-4 mt-2">
                                                    <div className="progress" style={{ height: '6px', borderRadius: '10px', backgroundColor: '#f0f0f0' }}>
                                                        <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" 
                                                             style={{ width: statusInfo.width, backgroundColor: statusInfo.color, borderRadius: '10px' }}></div>
                                                    </div>
                                                    <div className="d-flex justify-content-between mt-2 text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                                        <span style={{ color: statusInfo.width === '33%' ? statusInfo.color : '' }}>Placed</span>
                                                        <span style={{ color: statusInfo.width === '66%' ? statusInfo.color : '' }}>Preparing</span>
                                                        <span style={{ color: statusInfo.width === '100%' ? statusInfo.color : '' }}>Completed</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="order-items-preview bg-light rounded-3 p-3 mt-3">
                                                {order.items?.map((item, idx) => (
                                                    <div key={idx} className="d-flex justify-content-between mb-2 small">
                                                        <span><span className="fw-bold me-2 text-primary">{item.quantity}x</span> {item.product?.name || 'Item'}</span>
                                                        <span className="fw-medium">₱{item.subtotal.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                {order.notes && (
                                                    <div className="mt-3 pt-3 border-top small text-muted">
                                                        <i className="bi bi-chat-text me-1"></i> Note: {order.notes}
                                                    </div>
                                                )}
                                            </div>

                                            {order.status === 'CANCELLED' && order.cancellationReason && (
                                                <div className="mt-3 p-3 rounded-3 d-flex align-items-start gap-2" style={{ backgroundColor: 'rgba(231, 76, 60, 0.06)', border: '1.5px solid rgba(231, 76, 60, 0.15)', borderLeft: '4px solid #e74c3c', borderRadius: '10px' }}>
                                                    <i className="bi bi-info-circle-fill" style={{ color: '#e74c3c', fontSize: '1rem', marginTop: '1px', flexShrink: 0 }}></i>
                                                    <div>
                                                        <div className="fw-bold small" style={{ color: '#c0392b', marginBottom: '2px' }}>Reason for Cancellation</div>
                                                        <div className="small" style={{ color: '#6c757d' }}>{order.cancellationReason}</div>
                                                    </div>
                                                </div>
                                            )}

                                            {order.status === 'COMPLETED' && (
                                                <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                                                    {order.feedback ? (
                                                        <div className="small">
                                                            <span className="text-muted fw-bold me-2">Your Review:</span>
                                                            <span className="text-warning">
                                                                {Array.from({ length: order.feedback.rating }).map((_, i) => (
                                                                    <i key={i} className="bi bi-star-fill me-1"></i>
                                                                ))}
                                                                {Array.from({ length: 5 - order.feedback.rating }).map((_, i) => (
                                                                    <i key={i} className="bi bi-star me-1"></i>
                                                                ))}
                                                            </span>
                                                            {order.feedback.comment && (
                                                                <p className="text-muted mb-0 mt-1 fst-italic">"{order.feedback.comment}"</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-muted small"><i className="bi bi-chat-left-heart me-1"></i>How was your food?</span>
                                                            <button 
                                                                onClick={() => handleOpenFeedbackModal(order)} 
                                                                className="btn btn-sm text-white px-3 fw-bold shadow-sm" 
                                                                style={{ backgroundColor: 'var(--primary-brown)', borderRadius: '8px', fontSize: '0.8rem' }}
                                                            >
                                                                Leave Feedback
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* ── Cancel Order Button (PENDING only) ── */}
                                            {order.status === 'PENDING' && (
                                                <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                                                    <span className="small text-muted">
                                                        <i className="bi bi-info-circle me-1"></i>
                                                        You can cancel this order while it's still pending.
                                                    </span>
                                                    <button
                                                        onClick={() => handleCancelOrder(order.id)}
                                                        className="btn btn-sm px-3 py-2 fw-bold"
                                                        style={{ backgroundColor: '#fdf0f0', color: '#e74c3c', border: '1.5px solid #f5c6cb', borderRadius: '8px', fontSize: '0.82rem' }}
                                                    >
                                                        <i className="bi bi-x-circle me-1"></i> Cancel Order
                                                    </button>
                                                </div>
                                            )}

                                            {/* ── Non-cancellable notice (PREPARING / READY) ── */}
                                            {(order.status === 'PREPARING' || order.status === 'READY') && (
                                                <div className="mt-3 pt-3 border-top d-flex align-items-center gap-2" style={{ fontSize: '0.82rem', color: '#856404' }}>
                                                    <i className="bi bi-lock-fill" style={{ flexShrink: 0 }}></i>
                                                    <span>Your order is already being <strong>prepared</strong> and can no longer be cancelled.</span>
                                                </div>
                                            )}

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            );
        }

        if (activeTab === 'communications') {
            return (
                <>
                    <div className="mb-4">
                        <h4 className="fw-bold mb-1" style={{ color: 'var(--text-dark)' }}>Communications</h4>
                        <p className="text-muted small mb-0">Manage your communication preferences and notifications</p>
                    </div>

                    <div className="card border-0 bg-white" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                        <div className="card-body p-4 p-md-5">
                            
                            <div className="row mb-5">
                                <div className="col-12 col-md-6 mb-3 mb-md-0">
                                    <h6 className="fw-bold" style={{ color: 'var(--text-dark)' }}>Offers & Deals</h6>
                                    <p className="text-muted small mb-0 pe-md-4">Get notified and be the first to know about Duyanan exclusive offers and marketing communications.</p>
                                </div>
                                <div className="col-12 col-md-6 d-flex flex-column justify-content-center gap-3">
                                    <div className="form-check form-switch d-flex align-items-center gap-2 m-0 p-0">
                                        <input className="form-check-input m-0 toggle-switch" type="checkbox" role="switch" id="offersPush" 
                                            checked={commPrefs.offersPush} onChange={() => handleToggle('offersPush')} 
                                            style={{ cursor: 'pointer', height: '1.2rem', width: '2.4rem' }}/>
                                        <label className="form-check-label small fw-medium" htmlFor="offersPush" style={{ cursor: 'pointer', color: 'var(--text-dark)' }}>Push notification</label>
                                    </div>
                                    <div className="form-check form-switch d-flex align-items-center gap-2 m-0 p-0">
                                        <input className="form-check-input m-0 toggle-switch" type="checkbox" role="switch" id="offersEmail" 
                                            checked={commPrefs.offersEmail} onChange={() => handleToggle('offersEmail')} 
                                            style={{ cursor: 'pointer', height: '1.2rem', width: '2.4rem' }}/>
                                        <label className="form-check-label small fw-medium" htmlFor="offersEmail" style={{ cursor: 'pointer', color: 'var(--text-dark)' }}>Email</label>
                                    </div>
                                    <div className="form-check form-switch d-flex align-items-center gap-2 m-0 p-0">
                                        <input className="form-check-input m-0 toggle-switch" type="checkbox" role="switch" id="offersSms" 
                                            checked={commPrefs.offersSms} onChange={() => handleToggle('offersSms')} 
                                            style={{ cursor: 'pointer', height: '1.2rem', width: '2.4rem' }}/>
                                        <label className="form-check-label small fw-medium" htmlFor="offersSms" style={{ cursor: 'pointer', color: 'var(--text-dark)' }}>SMS</label>
                                    </div>
                                </div>
                            </div>
                            
                            <hr style={{ opacity: 0.1 }} />

                            <div className="row mt-4">
                                <div className="col-12 col-md-6 mb-3 mb-md-0">
                                    <h6 className="fw-bold" style={{ color: 'var(--text-dark)' }}>Important Updates</h6>
                                    <p className="text-muted small mb-0 pe-md-4">Receive important updates on your orders and new features via push notification, email, and SMS.</p>
                                </div>
                                <div className="col-12 col-md-6 d-flex align-items-center">
                                    <div className="form-check form-switch d-flex align-items-center gap-2 m-0 p-0">
                                        <input className="form-check-input m-0 toggle-switch" type="checkbox" role="switch" id="updatesPush" 
                                            checked={commPrefs.updatesPush} onChange={() => handleToggle('updatesPush')} 
                                            style={{ cursor: 'pointer', height: '1.2rem', width: '2.4rem' }}/>
                                        <label className="form-check-label small fw-medium" htmlFor="updatesPush" style={{ cursor: 'pointer', color: 'var(--text-dark)' }}>Enabled</label>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </>
            );
        }

        if (activeTab === 'reservations') {
            return (
                <>
                    <div className="mb-4 d-flex justify-content-between align-items-end">
                        <div>
                            <h4 className="fw-bold mb-1" style={{ color: 'var(--text-dark)' }}>My Reservations</h4>
                            <p className="text-muted small mb-0">Track your table bookings and statuses</p>
                        </div>
                        <button onClick={fetchReservations} className="btn btn-sm text-white px-3 py-2 fw-bold shadow-sm" style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '8px' }}>
                            <i className="bi bi-arrow-clockwise me-1"></i> Refresh Status
                        </button>
                    </div>

                    {loadingReservations ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-secondary" role="status"></div>
                            <p className="text-muted mt-3 small">Fetching your reservations...</p>
                        </div>
                    ) : myReservations.length === 0 ? (
                        <div className="card border-0 bg-white text-center py-5" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)' }}>
                            <i className="bi bi-calendar-x text-muted mb-3 d-block" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                            <h5 className="fw-bold mb-2" style={{ color: 'var(--text-dark)' }}>No reservations found</h5>
                            <p className="text-muted small mb-4">You haven't booked any tables yet.</p>
                            <div>
                                <Link to="/book-reservation" className="btn btn-sm shadow-sm text-white" style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '50px', padding: '10px 30px', fontWeight: 'bold' }}>
                                    Book a Table
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="reservations-list d-flex flex-column gap-4 animate__animated animate__fadeIn">
                            {myReservations.map(res => {
                                const statusColors = {
                                    PENDING: { bg: '#fff9e6', text: '#b7791f', border: '#fdebd0' },
                                    CONFIRMED: { bg: '#e6ffed', text: '#1e8449', border: '#d5f5e3' },
                                    CANCELLED: { bg: '#fdf0f0', text: '#e74c3c', border: '#f5e5e5' },
                                    COMPLETED: { bg: '#ebf5fb', text: '#2980b9', border: '#d4e6f1' }
                                };
                                const colors = statusColors[res.status?.toUpperCase()] || statusColors.PENDING;
                                const dateStr = new Date(res.reservationDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                const timeStr = formatTime12Hour(res.reservationTime);

                                return (
                                     <div key={res.id} className="card border-0 bg-white reservation-card" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                         <div className="card-header bg-transparent border-bottom-0 pt-4 pb-0 px-4 d-flex justify-content-between align-items-center">
                                             <div>
                                                 <h6 className="fw-bold mb-1" style={{ color: 'var(--primary-brown)', display: 'flex', alignItems: 'center' }}>
                                                     <i className="bi bi-calendar-check-fill me-2" style={{ color: 'var(--accent-orange)' }}></i>
                                                     Table Reservation
                                                 </h6>
                                                 <p className="text-muted small mb-0">
                                                     <i className="bi bi-calendar3 me-1"></i> {dateStr} at <strong className="text-dark">{timeStr}</strong>
                                                 </p>
                                             </div>
                                             <div>
                                                 <span className="badge rounded-pill px-3 py-1.5" style={{ backgroundColor: colors.bg, color: colors.text, border: `1.5px solid ${colors.border}`, fontSize: '0.72rem', fontWeight: 700 }}>
                                                     {res.status}
                                                 </span>
                                             </div>
                                         </div>
                                         <div className="card-body px-4 py-3">
                                             <div className="res-info-box p-3 mt-2">
                                                 <div className="row g-3">
                                                     <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
                                                         <div className="res-detail-label mb-1">
                                                             <i className="bi bi-person-fill me-1" style={{ color: 'var(--accent-orange)' }}></i> Guest Name
                                                         </div>
                                                         <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>{res.guestName}</div>
                                                     </div>
                                                     <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
                                                         <div className="res-detail-label mb-1">
                                                             <i className="bi bi-people-fill me-1" style={{ color: 'var(--accent-orange)' }}></i> Party Size
                                                         </div>
                                                         <div className="fw-bold text-dark" style={{ fontSize: '0.92rem' }}>{res.numberOfGuests} Guests</div>
                                                     </div>
                                                     <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
                                                         <div className="res-detail-label mb-1">
                                                             <i className="bi bi-geo-alt-fill me-1" style={{ color: 'var(--accent-orange)' }}></i> Seating Type
                                                         </div>
                                                         <div className="fw-bold" style={{ fontSize: '0.92rem' }}>
                                                             {res.seatingType ? (
                                                                 res.seatingType.toLowerCase() === 'indoor' ? (
                                                                     <span className="badge px-2.5 py-1.5" style={{ backgroundColor: 'rgba(41, 128, 185, 0.08)', color: '#2980b9', borderRadius: '6px', border: '1px solid rgba(41, 128, 185, 0.15)' }}>🏠 Indoor</span>
                                                                 ) : (
                                                                     <span className="badge px-2.5 py-1.5" style={{ backgroundColor: 'rgba(39, 174, 96, 0.08)', color: '#27ae60', borderRadius: '6px', border: '1px solid rgba(39, 174, 96, 0.15)' }}>🌿 Outdoor</span>
                                                                 )
                                                             ) : (
                                                                 <span className="badge px-2.5 py-1.5" style={{ backgroundColor: 'rgba(108, 117, 125, 0.08)', color: '#6c757d', borderRadius: '6px', border: '1px solid rgba(108, 117, 125, 0.15)' }}>N/A</span>
                                                             )}
                                                         </div>
                                                     </div>
                                                     <div className="col-md-3 col-sm-6">
                                                         <div className="res-detail-label mb-1">
                                                             <i className="bi bi-tag-fill me-1" style={{ color: 'var(--accent-orange)' }}></i> Event Type
                                                         </div>
                                                         <div className="fw-bold" style={{ fontSize: '0.92rem' }}>
                                                             <span className="badge px-2.5 py-1.5" style={{ backgroundColor: 'rgba(139, 58, 15, 0.08)', color: 'var(--primary-brown)', borderRadius: '6px', border: '1px solid rgba(139, 58, 15, 0.15)' }}>
                                                                 {res.eventType || 'Casual Dining 🍽️'}
                                                             </span>
                                                         </div>
                                                     </div>
                                                     {res.specialRequests && (
                                                         <div className="col-12 mt-2 pt-2 border-top" style={{ borderColor: 'rgba(139, 58, 15, 0.08)' }}>
                                                             <div className="res-detail-label mb-1">
                                                                 <i className="bi bi-chat-text-fill me-1" style={{ color: 'var(--accent-orange)' }}></i> Special Requests
                                                             </div>
                                                             <div className="res-special-request-box p-3 mt-1 fw-normal text-muted" style={{ fontSize: '0.85rem', whiteSpace: 'pre-line' }}>
                                                                 {res.specialRequests}
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>

                                             {/* Linked Pre-orders */}
                                             {(() => {
                                                 const linkedOrders = (res.orders && res.orders.length > 0)
                                                     ? res.orders
                                                     : myOrders.filter(o => o.reservation && String(o.reservation.id) === String(res.id));
                                                 if (!linkedOrders || linkedOrders.length === 0) return null;
                                                 return (
                                                     <div className="mt-3">
                                                         {linkedOrders.map(order => (
                                                             <div key={order.id} className="p-3 rounded-3 mb-2" style={{ backgroundColor: 'rgba(211, 84, 0, 0.04)', border: '1px solid rgba(211, 84, 0, 0.15)', borderRadius: '10px' }}>
                                                                 <div className="d-flex justify-content-between align-items-center mb-2">
                                                                     <span className="fw-bold small" style={{ color: 'var(--primary-brown)' }}>
                                                                         🍽️ Pre-Ordered Food (Order #{order.id})
                                                                     </span>
                                                                     <span className="badge bg-white text-dark border fw-bold">
                                                                         ₱{order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}
                                                                     </span>
                                                                 </div>
                                                                 {order.items?.map((item, idx) => (
                                                                     <div key={idx} className="d-flex justify-content-between small text-muted">
                                                                         <span>{item.quantity}x {item.product?.name || 'Item'} {item.variant ? `(${item.variant})` : ''}</span>
                                                                         <span>₱{item.subtotal ? item.subtotal.toFixed(2) : '0.00'}</span>
                                                                     </div>
                                                                 ))}
                                                             </div>
                                                         ))}
                                                     </div>
                                                 );
                                             })()}

                                             {res.status === 'CANCELLED' && res.cancellationReason && (
                                                 <div className="mt-3 p-3 rounded-3 d-flex align-items-start gap-2" style={{ backgroundColor: 'rgba(231, 76, 60, 0.06)', border: '1.5px solid rgba(231, 76, 60, 0.15)', borderLeft: '4px solid #e74c3c', borderRadius: '10px' }}>
                                                     <i className="bi bi-info-circle-fill" style={{ color: '#e74c3c', fontSize: '1rem', marginTop: '1px', flexShrink: 0 }}></i>
                                                     <div>
                                                         <div className="fw-bold small" style={{ color: '#c0392b', marginBottom: '2px' }}>Reason for Cancellation</div>
                                                         <div className="small" style={{ color: '#6c757d' }}>{res.cancellationReason}</div>
                                                     </div>
                                                 </div>
                                             )}
 
                                             <div className="d-flex justify-content-between align-items-center mt-3 gap-2 flex-wrap">
                                                <div>
                                                    {res.status === 'PENDING' ? (
                                                        <button
                                                            onClick={() => {
                                                                setReservationId(res.id.toString());
                                                                navigate('/menu');
                                                            }}
                                                            className="btn btn-sm text-white fw-bold shadow-sm"
                                                            style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '8px', fontSize: '0.82rem' }}
                                                        >
                                                            <i className="bi bi-cart-plus me-1"></i> Pre-Order Food
                                                        </button>
                                                    ) : res.status === 'CONFIRMED' ? (
                                                        <span 
                                                            className="badge px-2.5 py-1.5 fw-semibold" 
                                                            style={{ 
                                                                backgroundColor: '#f8f9fa', 
                                                                color: '#6c757d', 
                                                                border: '1px solid #dee2e6', 
                                                                borderRadius: '8px', 
                                                                fontSize: '0.78rem' 
                                                            }}
                                                            title="Pre-ordering is no longer available once the reservation is confirmed by the admin"
                                                        >
                                                            <i className="bi bi-lock-fill me-1 text-muted"></i> Pre-Order Unavailable (Confirmed)
                                                        </span>
                                                    ) : null}
                                                </div>
                                                 {res.status === 'PENDING' && (
                                                     <div className="d-flex gap-2">
                                                         <button 
                                                             onClick={() => handleCancelReservation(res.id)} 
                                                             className="btn btn-sm px-3 py-2 fw-bold shadow-sm" 
                                                             style={{ fontSize: '0.85rem', backgroundColor: '#fdf0f0', color: '#e74c3c', border: '1.5px solid #f5c6cb', borderRadius: '8px' }}
                                                         >
                                                             <i className="bi bi-x-circle me-1"></i> Cancel
                                                         </button>
                                                         <button 
                                                             onClick={() => handleOpenEditReservation(res)} 
                                                             className="btn btn-sm btn-edit-reservation text-white px-3 py-2 fw-bold shadow-sm" 
                                                             style={{ fontSize: '0.85rem' }}
                                                         >
                                                             <i className="bi bi-pencil-square me-1"></i> Edit Details
                                                         </button>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     </div>
                                );
                            })}
                        </div>
                    )}
                </>
            );
        }

        return (
            <div className="card border-0 bg-white text-center py-5" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <i className="bi bi-tools text-muted mb-3 d-block" style={{ fontSize: '3rem', opacity: 0.3 }}></i>
                <h5 className="fw-bold mb-2" style={{ color: 'var(--text-dark)' }}>Under Construction</h5>
                <p className="text-muted small mb-0">This section is currently being updated.</p>
            </div>
        );
    };

    const pendingOrdersCount = myOrders.filter(o => 
        parseInt(o.id || 0, 10) > lastViewedOrderId &&
        (o.status?.toUpperCase() === 'PENDING' || o.status?.toUpperCase() === 'PREPARING')
    ).length;

    const pendingReservationsCount = myReservations.filter(r => 
        parseInt(r.id || 0, 10) > lastViewedReservationId &&
        (r.status?.toUpperCase() === 'PENDING' || r.status?.toUpperCase() === 'CONFIRMED')
    ).length;

    return (
        <div className="container" style={{ marginTop: 'calc(var(--nav-height) + 40px)', marginBottom: '60px', minHeight: '60vh' }}>
            <div className="mb-4">
                <h3 className="fw-bold mb-0" style={{ color: 'var(--text-dark)' }}>Account Management</h3>
            </div>

            <div className="row g-5">
                {/* Sidebar Navigation */}
                <div className="col-12 col-md-3">
                    <style>
                        {`
                        .profile-sidebar-btn {
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            width: 100%;
                            padding: 12px 16px;
                            margin-bottom: 8px;
                            border: none;
                            background: transparent;
                            border-radius: 10px;
                            color: #6c757d;
                            font-weight: 500;
                            text-align: left;
                            transition: all 0.2s ease;
                        }
                        .profile-sidebar-btn i {
                            font-size: 1.1rem;
                            transition: transform 0.2s ease;
                        }
                        .profile-sidebar-btn:hover {
                            background-color: rgba(139, 58, 15, 0.05);
                            color: var(--primary-brown);
                            transform: translateX(4px);
                        }
                        .profile-sidebar-btn.active {
                            background-color: var(--accent-orange);
                            color: white;
                            box-shadow: 0 4px 12px rgba(230, 126, 34, 0.2);
                        }
                        .profile-sidebar-btn.active:hover {
                            transform: none;
                        }
                        .profile-sidebar-btn.active i {
                            color: white;
                        }
                        .sidebar-heading {
                            font-size: 0.75rem;
                            font-weight: 700;
                            text-transform: uppercase;
                            letter-spacing: 1px;
                            color: #adb5bd;
                            margin-bottom: 12px;
                            margin-top: 24px;
                            padding-left: 16px;
                        }
                        .sidebar-heading:first-child {
                            margin-top: 0;
                        }
                        .profile-sidebar-btn .badge.rounded-pill {
                            font-size: 0.72rem !important;
                            font-weight: bold !important;
                            padding: 4px 8px !important;
                            border-radius: 10px !important;
                            letter-spacing: normal !important;
                            transition: all 0.2s ease;
                        }
                        .profile-sidebar-btn.active .badge.rounded-pill {
                            background-color: #ffffff !important;
                            color: var(--accent-orange) !important;
                            border: none !important;
                        }
                        .profile-sidebar-btn:not(.active) .badge.rounded-pill {
                            background-color: rgba(220, 53, 69, 0.1) !important;
                            color: #dc3545 !important;
                            border: 1px solid rgba(220, 53, 69, 0.2) !important;
                        }
                        `}
                    </style>

                    <div className="sidebar-heading">Account</div>
                    <div className="d-flex flex-column mb-3">
                        <button className={`profile-sidebar-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
                            <i className="bi bi-person"></i> My Profile
                        </button>
                        <button className={`profile-sidebar-btn ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
                            <i className="bi bi-credit-card"></i> Payment Methods
                        </button>
                        <button className={`profile-sidebar-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
                            <i className="bi bi-receipt"></i> My Orders
                            {pendingOrdersCount > 0 && (
                                <span className="badge rounded-pill ms-auto px-2 py-1">
                                    {pendingOrdersCount}
                                </span>
                            )}
                        </button>
                        <button className={`profile-sidebar-btn ${activeTab === 'reservations' ? 'active' : ''}`} onClick={() => setActiveTab('reservations')}>
                            <i className="bi bi-calendar-event"></i> My Reservations
                            {pendingReservationsCount > 0 && (
                                <span className="badge rounded-pill ms-auto px-2 py-1">
                                    {pendingReservationsCount}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="sidebar-heading">Settings</div>
                    <div className="d-flex flex-column mb-3">
                        <button className={`profile-sidebar-btn ${activeTab === 'communications' ? 'active' : ''}`} onClick={() => setActiveTab('communications')}>
                            <i className="bi bi-arrow-left-right"></i> Communications
                        </button>
                    </div>

                    <div className="sidebar-heading">Support</div>
                    <div className="d-flex flex-column mb-4">
                        <button className={`profile-sidebar-btn ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>
                            <i className="bi bi-question-circle"></i> Help Center
                        </button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="col-12 col-md-9">
                    <style>
                        {`
                        @keyframes slideFadeIn {
                            from { opacity: 0; transform: translateY(15px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .fade-in-content {
                            animation: slideFadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        }
                        .reservation-card {
                            transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
                            border: 1px solid rgba(0,0,0,0.04) !important;
                        }
                        .reservation-card:hover {
                            transform: translateY(-3px);
                            box-shadow: 0 12px 30px rgba(139, 58, 15, 0.08) !important;
                            border-color: rgba(139, 58, 15, 0.15) !important;
                        }
                        .res-info-box {
                            background: linear-gradient(135deg, rgba(253, 251, 247, 0.9), rgba(245, 237, 226, 0.75)) !important;
                            border: 1.5px solid rgba(139, 58, 15, 0.07) !important;
                            border-radius: 12px;
                        }
                        .res-detail-label {
                            font-size: 0.72rem;
                            font-weight: 700;
                            letter-spacing: 0.6px;
                            text-transform: uppercase;
                            color: #8b624b !important;
                        }
                        .btn-edit-reservation {
                            background-color: var(--accent-orange) !important;
                            border: none !important;
                            border-radius: 8px !important;
                            transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease !important;
                        }
                        .btn-edit-reservation:hover {
                            background-color: #d35400 !important;
                            transform: translateY(-1px);
                            box-shadow: 0 4px 12px rgba(211, 84, 0, 0.25) !important;
                        }
                        .res-special-request-box {
                            background-color: #ffffff;
                            border: 1px solid rgba(139, 58, 15, 0.08);
                            border-left: 3.5px solid var(--accent-orange) !important;
                            border-radius: 6px;
                        }
                        `}
                    </style>
                    <div className="fade-in-content" key={activeTab}>
                        {renderMainContent()}
                    </div>
                </div>
            </div>

            {/* Editing modal */}
            {editingReservation && (
                <div
                    className="modal show d-block animate__animated animate__fadeIn animate__faster"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 1070 }}
                    onClick={(e) => { if (e.target === e.currentTarget) setEditingReservation(null); }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div
                            className="modal-content border-0"
                            style={{
                                borderRadius: '24px',
                                overflow: 'hidden',
                                background: 'rgba(253, 251, 247, 0.95)',
                                backdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                boxShadow: '0 16px 64px rgba(0,0,0,0.3)'
                            }}
                        >
                            {/* Header */}
                            <div
                                className="modal-header border-0"
                                style={{
                                    background: 'linear-gradient(135deg, var(--accent-orange), var(--dark-brown))',
                                    padding: '20px 24px'
                                }}
                            >
                                <h5
                                    className="modal-title w-100 text-center mb-0"
                                    style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                                >
                                    ✏️ Edit Reservation
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => setEditingReservation(null)}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: '1.1rem',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body */}
                            <div className="modal-body" style={{ padding: '24px' }}>
                                <form onSubmit={handleUpdateReservation}>
                                    {/* Event Type */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold" style={{ color: 'var(--primary-brown)' }}>Event Type</label>
                                        <select
                                            name="eventType"
                                            value={editForm.eventType}
                                            onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                                            required
                                            className="form-select bg-white"
                                            style={{ borderRadius: '8px', border: '1.5px solid rgba(160, 64, 0, 0.3)' }}
                                        >
                                            <option value="" disabled hidden>Select Event Type</option>
                                            <option value="Casual Dining 🍽️">Casual Dining 🍽️</option>
                                            <option value="Birthday Celebration 🎂">Birthday Celebration 🎂</option>
                                            <option value="Anniversary 💑">Anniversary 💑</option>
                                            <option value="Wedding / Reception 💍">Wedding / Reception 💍</option>
                                            <option value="Business Meeting 💼">Business Meeting 💼</option>
                                            <option value="Other Event 🎉">Other Event 🎉</option>
                                        </select>
                                    </div>

                                    {/* Seating Type */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold" style={{ color: 'var(--primary-brown)' }}>Seating Type</label>
                                        <select
                                            name="seatingType"
                                            value={editForm.seatingType}
                                            onChange={(e) => setEditForm({ ...editForm, seatingType: e.target.value })}
                                            required
                                            className="form-select bg-white"
                                            style={{ borderRadius: '8px', border: '1.5px solid rgba(160, 64, 0, 0.3)' }}
                                        >
                                            <option value="" disabled hidden>Select Seating Type</option>
                                            <option value="indoor">Indoor 🏠</option>
                                            <option value="outdoor">Outdoor 🌿</option>
                                        </select>
                                    </div>

                                    {/* Date & Time */}
                                    <div className="row g-3 mb-3">
                                        <div className="col-6">
                                            <label className="form-label small fw-bold" style={{ color: 'var(--primary-brown)' }}>Date</label>
                                            <input
                                                type="date"
                                                name="date"
                                                value={editForm.date}
                                                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                                required
                                                min={new Date().toLocaleDateString('en-CA')}
                                                className="form-control bg-white"
                                                style={{ borderRadius: '8px', border: '1.5px solid rgba(160, 64, 0, 0.3)' }}
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label small fw-bold" style={{ color: 'var(--primary-brown)' }}>Time</label>
                                            <input
                                                type="time"
                                                name="time"
                                                value={editForm.time}
                                                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                                required
                                                className="form-control bg-white"
                                                style={{ borderRadius: '8px', border: '1.5px solid rgba(160, 64, 0, 0.3)' }}
                                            />
                                        </div>
                                    </div>

                                    {/* Guests */}
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold" style={{ color: 'var(--primary-brown)' }}>Number of Guests</label>
                                        <input
                                            type="number"
                                            name="guests"
                                            value={editForm.guests}
                                            onChange={(e) => setEditForm({ ...editForm, guests: e.target.value })}
                                            required
                                            min="1"
                                            className="form-control bg-white"
                                            style={{ borderRadius: '8px', border: '1.5px solid rgba(160, 64, 0, 0.3)' }}
                                        />
                                    </div>

                                    {/* Special Request */}
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold" style={{ color: 'var(--primary-brown)' }}>Special Request (optional)</label>
                                        <textarea
                                            name="request"
                                            value={editForm.request}
                                            onChange={(e) => setEditForm({ ...editForm, request: e.target.value })}
                                            rows="3"
                                            className="form-control bg-white"
                                            style={{ borderRadius: '8px', border: '1.5px solid rgba(160, 64, 0, 0.3)', resize: 'none' }}
                                        ></textarea>
                                    </div>

                                    {/* Submit */}
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-light w-50 fw-bold" onClick={() => setEditingReservation(null)} style={{ borderRadius: '10px' }}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn text-white w-50 fw-bold" style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '10px' }}>
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback Modal */}
            {selectedOrderForFeedback && (
                <div
                    className="modal show d-block animate__animated animate__fadeIn animate__faster"
                    tabIndex="-1"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', zIndex: 1070 }}
                    onClick={(e) => { if (e.target === e.currentTarget) setSelectedOrderForFeedback(null); }}
                >
                    <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
                        <div
                            className="modal-content border-0"
                            style={{
                                borderRadius: '24px',
                                overflow: 'hidden',
                                background: 'rgba(253, 251, 247, 0.95)',
                                backdropFilter: 'blur(24px)',
                                border: '1px solid rgba(255,255,255,0.5)',
                                boxShadow: '0 16px 64px rgba(0,0,0,0.3)'
                            }}
                        >
                            {/* Header */}
                            <div
                                className="modal-header border-0"
                                style={{
                                    background: 'linear-gradient(135deg, var(--accent-orange), var(--dark-brown))',
                                    padding: '20px 24px'
                                }}
                            >
                                <h5
                                    className="modal-title w-100 text-center mb-0"
                                    style={{ color: '#fff', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}
                                >
                                    ⭐ Leave Order Feedback
                                </h5>
                                <button
                                    type="button"
                                    onClick={() => setSelectedOrderForFeedback(null)}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: '1.1rem',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                        transition: 'background 0.2s'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Body */}
                            <div className="modal-body" style={{ padding: '24px' }}>
                                <form onSubmit={handleSubmitFeedback}>
                                    <div className="text-center mb-4">
                                        <p className="text-muted small mb-3">How would you rate your order from {new Date(selectedOrderForFeedback.orderDate).toLocaleDateString()}?</p>
                                        <div className="d-flex justify-content-center gap-2">
                                            {[1, 2, 3, 4, 5].map((starVal) => (
                                                <i
                                                    key={starVal}
                                                    className={`bi ${feedbackRating >= starVal ? 'bi-star-fill text-warning' : 'bi-star text-secondary'} fs-1`}
                                                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                                                    onClick={() => setFeedbackRating(starVal)}
                                                ></i>
                                            ))}
                                        </div>
                                        <span className="badge mt-2 bg-light text-dark border fw-bold">
                                            {feedbackRating === 1 ? 'Terrible 😞' :
                                             feedbackRating === 2 ? 'Poor 😕' :
                                             feedbackRating === 3 ? 'Ok 🙂' :
                                             feedbackRating === 4 ? 'Very Good 😃' : 'Excellent! 😍'}
                                        </span>
                                    </div>

                                    {/* Feedback Comment */}
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold" style={{ color: 'var(--primary-brown)' }}>Tell us about your experience</label>
                                        <textarea
                                            value={feedbackComment}
                                            onChange={(e) => setFeedbackComment(e.target.value)}
                                            required
                                            rows="4"
                                            maxLength="1000"
                                            placeholder="Write your review here... How was the taste, portions, and delivery?"
                                            className="form-control bg-white"
                                            style={{ borderRadius: '8px', border: '1.5px solid rgba(160, 64, 0, 0.3)', resize: 'none' }}
                                        ></textarea>
                                    </div>

                                    {/* Submit */}
                                    <div className="d-flex gap-2">
                                        <button type="button" className="btn btn-light w-50 fw-bold" onClick={() => setSelectedOrderForFeedback(null)} style={{ borderRadius: '10px' }} disabled={submittingFeedback}>
                                            Cancel
                                        </button>
                                        <button type="submit" className="btn text-white w-50 fw-bold" style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '10px' }} disabled={submittingFeedback}>
                                            {submittingFeedback ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
