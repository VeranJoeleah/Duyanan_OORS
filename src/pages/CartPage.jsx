import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

/* ─── Scoped Styles ─── */
const styles = `
    .cart-page { padding-top: calc(var(--nav-height) + 30px); padding-bottom: 60px; }

    /* Step indicator */
    .cart-steps { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 36px; }
    .cart-step { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; font-weight: 600; color: #bbb; transition: color 0.3s; }
    .cart-step.active { color: var(--accent-orange); }
    .cart-step.done { color: #27ae60; }
    .cart-step-num { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
        font-size: 0.8rem; font-weight: 700; border: 2px solid #ddd; background: #fff; color: #bbb; transition: all 0.3s; }
    .cart-step.active .cart-step-num { border-color: var(--accent-orange); background: var(--accent-orange); color: #fff; box-shadow: 0 2px 12px rgba(211,84,0,0.25); }
    .cart-step.done .cart-step-num { border-color: #27ae60; background: #27ae60; color: #fff; }
    .cart-step-line { width: 60px; height: 2px; background: #e0e0e0; margin: 0 8px; border-radius: 2px; }
    .cart-step-line.active { background: linear-gradient(90deg, var(--accent-orange), #e0e0e0); }
    .cart-step-line.done { background: #27ae60; }

    /* Item cards */
    .cart-item-card { background: #fff; border-radius: 16px; padding: 18px 20px; margin-bottom: 14px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.04); border: 1px solid #f0ece8;
        transition: all 0.25s ease; animation: cartItemIn 0.35s ease-out both; position: relative; overflow: hidden; }
    .cart-item-card:hover { box-shadow: 0 4px 20px rgba(160,64,0,0.08); border-color: #e8ddd4; transform: translateY(-1px); }
    .cart-item-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
        background: linear-gradient(180deg, var(--accent-orange), var(--primary-brown)); border-radius: 4px 0 0 4px; opacity: 0; transition: opacity 0.3s; }
    .cart-item-card:hover::before { opacity: 1; }

    @keyframes cartItemIn {
        from { opacity: 0; transform: translateX(-12px); }
        to { opacity: 1; transform: translateX(0); }
    }

    .cart-item-img { width: 72px; height: 72px; object-fit: cover; border-radius: 12px; flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

    /* Quantity stepper */
    .qty-stepper { display: inline-flex; align-items: center; gap: 0; border: 1.5px solid #e8e0d8; border-radius: 10px; overflow: hidden; background: #fdfbf9; }
    .qty-stepper button { width: 32px; height: 32px; border: none; background: transparent; color: var(--primary-brown);
        font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .qty-stepper button:hover { background: rgba(160,64,0,0.08); }
    .qty-stepper button:active { transform: scale(0.92); }
    .qty-stepper .qty-value { width: 36px; text-align: center; font-weight: 700; font-size: 0.92rem; color: var(--text-dark); 
        border-left: 1px solid #ede7e0; border-right: 1px solid #ede7e0; padding: 4px 0; }

    /* Remove button */
    .cart-remove-btn { width: 34px; height: 34px; border-radius: 10px; border: 1.5px solid #f5e5e5; background: #fff;
        color: #e74c3c; display: flex; align-items: center; justify-content: center; cursor: pointer;
        transition: all 0.25s ease; font-size: 0.85rem; }
    .cart-remove-btn:hover { background: #fdf0f0; border-color: #e74c3c; transform: scale(1.08); }

    /* Order summary card */
    .order-summary { background: #fff; border-radius: 20px; padding: 28px; border: 1px solid #f0ece8;
        box-shadow: 0 4px 24px rgba(0,0,0,0.06); position: sticky; top: calc(var(--nav-height) + 30px); }
    .summary-divider { height: 1px; background: linear-gradient(90deg, transparent, #e0d6cc, transparent); margin: 16px 0; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
    .summary-row.total { padding: 12px 0 4px; }

    /* Checkout button */
    .checkout-btn { width: 100%; padding: 14px 20px; border: none; border-radius: 14px;
        background: linear-gradient(135deg, var(--accent-orange), var(--primary-brown));
        color: #fff; font-weight: 700; font-size: 1rem; cursor: pointer;
        transition: all 0.3s ease; box-shadow: 0 4px 16px rgba(160,64,0,0.2); position: relative; overflow: hidden; }
    .checkout-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(160,64,0,0.3); }
    .checkout-btn:active { transform: translateY(0); }
    .checkout-btn::after { content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); transition: left 0.5s; }
    .checkout-btn:hover::after { left: 100%; }

    .add-more-btn { width: 100%; padding: 12px 20px; border: 1.5px solid #e0d6cc; border-radius: 14px;
        background: transparent; color: var(--primary-brown); font-weight: 600; font-size: 0.92rem; cursor: pointer;
        transition: all 0.25s ease; margin-top: 10px; }
    .add-more-btn:hover { background: rgba(160,64,0,0.04); border-color: var(--accent-orange); }

    /* Clear cart button */
    .clear-cart-btn { background: none; border: none; color: #ccc; font-size: 0.78rem; font-weight: 600; cursor: pointer;
        transition: color 0.2s; padding: 0; }
    .clear-cart-btn:hover { color: #e74c3c; }

    /* Group meal badges */
    .gm-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 6px;
        font-size: 0.7rem; font-weight: 600; }
    .gm-badge-people { background: #fef5e7; color: #b7791f; border: 1px solid #fdebd0; }
    .gm-badge-savings { background: #eafaf1; color: #1e8449; border: 1px solid #d5f5e3; }

    /* Empty cart */
    .empty-cart { min-height: 55vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
        animation: fadeUp 0.5s ease-out; }
    .empty-cart-icon { font-size: 4.5rem; opacity: 0.12; animation: floatBag 3s ease-in-out infinite; }
    @keyframes floatBag { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

    /* Price animation */
    .price-pop { animation: pricePop 0.3s ease; }
    @keyframes pricePop { 0% { transform: scale(1); } 50% { transform: scale(1.12); } 100% { transform: scale(1); } }

    /* Checkbox styles */
    .cart-checkbox { width: 20px; height: 20px; accent-color: var(--accent-orange); cursor: pointer; flex-shrink: 0;
        border-radius: 4px; margin-top: 2px; transition: transform 0.15s ease; }
    .cart-checkbox:hover { transform: scale(1.15); }
    .cart-checkbox:checked { animation: checkPop 0.25s ease; }
    @keyframes checkPop { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }
    .cart-item-card.unselected { opacity: 0.55; }
    .cart-item-card.unselected:hover { opacity: 0.75; }
    .select-all-bar { display: flex; align-items: center; gap: 10px; padding: 10px 16px; background: #fdfbf9;
        border: 1.5px solid #f0ece8; border-radius: 12px; margin-bottom: 14px; }
    .select-all-bar label { font-size: 0.85rem; font-weight: 600; color: var(--primary-brown); cursor: pointer; user-select: none; margin: 0; }
    .selected-count-badge { font-size: 0.75rem; font-weight: 700; color: #fff; background: var(--accent-orange);
        padding: 2px 8px; border-radius: 20px; margin-left: auto; }

    /* Responsive */
    @media (max-width: 767px) {
        .cart-item-img { width: 56px; height: 56px; }
        .order-summary { position: static; margin-top: 24px; }
        .cart-step span:not(.cart-step-num) { display: none; }
        .cart-step-line { width: 32px; }
    }

    /* Step 2 Form styling */
    .checkout-form-card { background: #fff; border-radius: 18px; padding: 24px; border: 1px solid #f0ece8; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
    .form-group-custom { margin-bottom: 18px; }
    .form-group-custom label { font-size: 0.82rem; font-weight: 700; color: var(--primary-brown); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; display: block; }
    .form-group-custom input, .form-group-custom textarea, .form-group-custom select { width: 100%; padding: 12px 16px; border: 1.5px solid #e8e0d8; border-radius: 10px; font-size: 0.92rem; color: var(--text-dark); background: #fdfbf9; transition: all 0.25s ease; }
    .form-group-custom input:focus, .form-group-custom textarea:focus, .form-group-custom select:focus { border-color: var(--accent-orange); outline: none; background: #fff; box-shadow: 0 0 0 3px rgba(211,84,0,0.08); }
    
    /* Payment methods */
    .payment-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
    .payment-option-card { border: 1.5px solid #e8e0d8; border-radius: 12px; padding: 14px; text-align: center; cursor: pointer; background: #fdfbf9; transition: all 0.2s; }
    .payment-option-card.selected { border-color: var(--accent-orange); background: rgba(211, 84, 0, 0.03); box-shadow: 0 2px 8px rgba(211,84,0,0.08); }
    .payment-option-card i { font-size: 1.4rem; color: var(--accent-orange); display: block; margin-bottom: 4px; }
    .payment-option-card span { font-size: 0.88rem; font-weight: 600; color: var(--primary-brown); }

    /* Fulfillment (Delivery / Pick-Up) toggle */
    .fulfillment-options { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
    .fulfillment-option-card { border: 1.5px solid #e8e0d8; border-radius: 14px; padding: 18px 14px; text-align: center; cursor: pointer; background: #fdfbf9; transition: all 0.25s; }
    .fulfillment-option-card.selected { border-color: var(--accent-orange); background: rgba(211, 84, 0, 0.04); box-shadow: 0 3px 14px rgba(211,84,0,0.12); }
    .fulfillment-option-card.disabled { opacity: 0.38; cursor: not-allowed; pointer-events: none; }
    .fulfillment-option-card i { font-size: 1.8rem; color: var(--accent-orange); display: block; margin-bottom: 6px; }
    .fulfillment-option-card .fc-title { font-size: 0.9rem; font-weight: 700; color: var(--primary-brown); display: block; }
    .fulfillment-option-card .fc-sub { font-size: 0.72rem; color: #aaa; display: block; margin-top: 2px; }
    .delivery-area-notice { border-radius: 12px; padding: 12px 16px; font-size: 0.82rem; display: flex; align-items: flex-start; gap: 10px; margin-top: 10px; line-height: 1.5; }
    .delivery-area-notice.ineligible { background: #fff8f0; border: 1.5px solid #fde4c2; color: #a04000; }
    .delivery-area-notice.eligible { background: #f0fff6; border: 1.5px solid #b7e4c7; color: #1a7a3e; }

    /* Success Card */
    .success-card { background: #fff; border-radius: 24px; padding: 40px; border: 1px solid #f0ece8; box-shadow: 0 4px 24px rgba(0,0,0,0.06); text-align: center; max-width: 600px; margin: 0 auto; animation: successFadeUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .success-icon-container { width: 80px; height: 80px; border-radius: 50%; background: rgba(39, 174, 96, 0.1); color: #27ae60; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 2.5rem; animation: popCheck 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both; }
    
    @keyframes successFadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes popCheck { 0% { transform: scale(0); } 100% { transform: scale(1); } }

    .receipt-box { background: #fdfbf9; border: 1px dashed #e8dcd0; border-radius: 14px; padding: 20px; text-align: left; margin: 24px 0; }
    .receipt-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid rgba(160,64,0,0.04); font-size: 0.88rem; }
    .receipt-row:last-child { border-bottom: none; }
    .receipt-total { border-top: 1.5px solid #e8dcd0; padding-top: 10px; margin-top: 10px; font-weight: 700; font-size: 1.05rem; }
`;

/* ─── Format Group Meal JSON ─── */
const formatDescription = (desc) => {
    if (!desc) return null;
    try {
        const parsed = JSON.parse(desc);
        if (parsed && typeof parsed === 'object' && parsed.inclusions) {
            const items = parsed.inclusions
                .split(/\\n|\n/)
                .map(s => s.trim())
                .filter(Boolean);
            return (
                <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', lineHeight: 1.6 }}>
                        {items.map((item, i) => (
                            <span key={i}>{item}{i < items.length - 1 ? ', ' : ''}</span>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {parsed.goodFor && (
                            <span className="gm-badge gm-badge-people">👥 Good for {parsed.goodFor}</span>
                        )}
                        {parsed.savings > 0 && (
                            <span className="gm-badge gm-badge-savings">💰 Save ₱{parsed.savings}</span>
                        )}
                    </div>
                </div>
            );
        }
    } catch (e) { /* not JSON */ }
    return <div style={{ fontSize: '0.75rem', color: '#999', marginTop: 4 }}>{desc}</div>;
};

const CartPage = () => {
    const { cart, addToCart, removeFromCart, updateQuantity, clearCart, reservationId, clearReservationLink } = useCart();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [step, setStep] = useState(1);
    const [checkoutForm, setCheckoutForm] = useState({
        recipientName: '',
        contactNumber: '',
        deliveryAddress: '',
        paymentMethod: 'COD', // COD or GCASH
        notes: ''
    });
    const [orderResult, setOrderResult] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [fulfillmentMethod, setFulfillmentMethod] = useState('DELIVERY'); // 'DELIVERY' or 'PICKUP'
    const [isEligibleForDelivery, setIsEligibleForDelivery] = useState(false);

    // ── Item selection state (checkboxes) ──
    const [selectedItems, setSelectedItems] = useState(() => {
        // Default: all items selected
        return new Set(cart.map(item => item.cartItemId));
    });

    // Keep selectedItems in sync when cart changes (items added/removed externally)
    React.useEffect(() => {
        setSelectedItems(prev => {
            const cartIds = new Set(cart.map(item => item.cartItemId));
            const updated = new Set();
            // Keep existing selections that are still in cart
            for (const id of prev) {
                if (cartIds.has(id)) updated.add(id);
            }
            // Auto-select newly added items
            for (const id of cartIds) {
                if (!prev.has(id) && prev.size > 0) updated.add(id);
                else if (prev.size === 0) updated.add(id);
            }
            return updated;
        });
    }, [cart]);

    const toggleItem = (cartItemId) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(cartItemId)) next.delete(cartItemId);
            else next.add(cartItemId);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === cart.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(cart.map(item => item.cartItemId)));
        }
    };

    const isAllSelected = cart.length > 0 && selectedItems.size === cart.length;
    const selectedCart = cart.filter(item => selectedItems.has(item.cartItemId));

    React.useEffect(() => {
        if (reservationId) {
            fetch(`${API_URL}/api/reservations/${reservationId}`)
                .then(res => {
                    if (!res.ok) return null;
                    return res.json();
                })
                .then(data => {
                    if (data && data.status) {
                        if (data.status === 'CONFIRMED') {
                            clearReservationLink();
                            Swal.fire({
                                icon: 'info',
                                title: 'Pre-Order Unavailable',
                                text: `Reservation #${reservationId} has been confirmed by the admin. Pre-ordering is no longer available. Your cart has been switched to regular checkout.`,
                                confirmButtonColor: '#A04000'
                            });
                        } else if (data.status !== 'PENDING') {
                            clearReservationLink();
                        }
                    }
                })
                .catch(err => console.error("Error validating reservation pre-order:", err));
        }
    }, [reservationId]);

    // Totals are computed from SELECTED items only
    const itemCount = selectedCart.reduce((sum, item) => sum + item.quantity, 0);
    const total = selectedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    const handleIncrement = (item) => {
        updateQuantity(item.cartItemId, item.quantity + 1);
    };

    const handleDecrement = (item) => {
        updateQuantity(item.cartItemId, item.quantity - 1);
    };

    const handleClearCart = async () => {
        const result = await Swal.fire({
            title: 'Clear Cart?',
            text: 'This will remove all items from your cart.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#999',
            confirmButtonText: 'Yes, clear it'
        });
        if (result.isConfirmed) clearCart();
    };

    const handleProceedToCheckout = () => {
        if (selectedCart.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Items Selected',
                text: 'Please select at least one item to checkout.',
                confirmButtonColor: '#A04000'
            });
            return;
        }
        if (!isAuthenticated) {
            Swal.fire({
                icon: 'warning',
                title: 'Sign In Required',
                text: 'Please log in to proceed to checkout.',
                confirmButtonColor: '#A04000'
            });
            navigate('/login');
            return;
        }
        
        // Fetch user profile to prefill the checkout form
        if (user?.token) {
            setLoadingProfile(true);
            fetch(`${API_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${user.token}` }
            })
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch profile");
                return res.json();
            })
            .then(data => {
                const eligible = (data.address || '').toLowerCase().includes('padre burgos');
                setIsEligibleForDelivery(eligible);
                setFulfillmentMethod(eligible ? 'DELIVERY' : 'PICKUP');
                setCheckoutForm(prev => ({
                    ...prev,
                    recipientName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                    contactNumber: data.phone || '',
                    deliveryAddress: reservationId ? `Dine-In (Pre-Order for Reservation #${reservationId})` : (data.address || '')
                }));
            })
            .catch(err => {
                console.error("Error fetching user profile for checkout:", err);
            })
            .finally(() => {
                setLoadingProfile(false);
                setStep(2);
            });
        } else {
            setCheckoutForm(prev => ({
                ...prev,
                deliveryAddress: reservationId ? `Dine-In (Pre-Order for Reservation #${reservationId})` : prev.deliveryAddress
            }));
            setStep(2);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setCheckoutForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectPayment = (method) => {
        setCheckoutForm(prev => ({ ...prev, paymentMethod: method }));
    };

    const handlePlaceOrder = async () => {
        if (selectedCart.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Items Selected',
                text: 'Please go back and select items to checkout.',
                confirmButtonColor: '#A04000'
            });
            return;
        }
        const needsAddress = !reservationId && fulfillmentMethod === 'DELIVERY';
        if (!checkoutForm.recipientName || !checkoutForm.contactNumber || (needsAddress && !checkoutForm.deliveryAddress)) {
            Swal.fire({
                icon: 'warning',
                title: 'Required Fields',
                text: needsAddress
                    ? 'Please fill in your name, contact number, and delivery address.'
                    : 'Please fill in your name and contact number.',
                confirmButtonColor: '#A04000'
            });
            return;
        }

        const result = await Swal.fire({
            title: 'Place Order?',
            html: `<div style="font-size:0.95rem">Confirm order for <b>${itemCount} item${itemCount !== 1 ? 's' : ''}</b> totaling <b style="color:#a04000">₱${total.toFixed(2)}</b> via <b>${checkoutForm.paymentMethod === 'COD' ? 'Cash on Delivery' : 'G-Cash'}</b>?</div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#A04000',
            cancelButtonColor: '#999',
            confirmButtonText: '<i class="bi bi-check-lg me-1"></i> Yes, Place Order'
        });

        if (result.isConfirmed) {
            setIsCheckingOut(true);
            try {
                const isDineIn = !!reservationId;
                const isPickup = !isDineIn && fulfillmentMethod === 'PICKUP';
                const addressOrType = isDineIn
                    ? `Dine-In (Pre-order for Reservation #${reservationId})`
                    : isPickup ? 'Pick-Up at Duyanan Restaurant' : checkoutForm.deliveryAddress;
                const paymentLabel = checkoutForm.paymentMethod === 'COD' 
                    ? (isDineIn ? 'Pay at Restaurant' : 'Cash on Delivery') 
                    : 'G-Cash';

                const combinedNotes = isDineIn
                    ? `ORDER TYPE: DINE-IN (Reservation #${reservationId}) | Guest: ${checkoutForm.recipientName} | Contact: ${checkoutForm.contactNumber} | Payment: ${paymentLabel} | Notes: ${checkoutForm.notes || 'None'}`
                    : isPickup
                        ? `ORDER TYPE: PICK-UP | Recipient: ${checkoutForm.recipientName} | Contact: ${checkoutForm.contactNumber} | Payment: ${paymentLabel} | Notes: ${checkoutForm.notes || 'None'}`
                        : `ORDER TYPE: DELIVERY | Recipient: ${checkoutForm.recipientName} | Contact: ${checkoutForm.contactNumber} | Address: ${checkoutForm.deliveryAddress} | Payment: ${paymentLabel} | Notes: ${checkoutForm.notes || 'None'}`;
                
                const response = await fetch(`${API_URL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${user.token}`
                    },
                    body: JSON.stringify({
                        reservationId: reservationId ? parseInt(reservationId, 10) : null,
                        orderType: isDineIn ? "DINE_IN" : fulfillmentMethod,
                        notes: combinedNotes,
                        items: selectedCart.map(item => ({
                            productId: item.id,
                            quantity: item.quantity,
                            variant: item.variant,
                            price: item.price
                        }))
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    setOrderResult({
                        id: data.id || data.orderId || 'N/A',
                        total: total,
                        recipientName: checkoutForm.recipientName,
                        deliveryAddress: addressOrType,
                        paymentMethod: checkoutForm.paymentMethod,
                        isDineIn: isDineIn,
                        isPickup: isPickup,
                        reservationId: reservationId
                    });
                    
                    Swal.fire({
                        icon: 'success',
                        title: isDineIn ? 'Pre-Order Placed! 🍽️' : 'Order Placed! 🎉',
                        text: isDineIn
                            ? 'Your pre-ordered food is confirmed and will be prepared for your reserved table!'
                            : isPickup
                                ? 'Your order is confirmed! Please pick it up at Duyanan Restaurant when ready.'
                                : 'Your delicious meal is being prepared and will be delivered shortly.',
                        confirmButtonColor: '#A04000',
                        timer: 3000
                    });

                    // Only remove the selected/checked-out items from cart, keep the rest
                    selectedCart.forEach(item => removeFromCart(item.cartItemId));
                    setSelectedItems(new Set());
                    setStep(3);
                } else {
                    if (data.error && (data.error.includes('confirmed') || data.error.includes('Pre-ordering'))) {
                        clearReservationLink();
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'Order Failed',
                        text: data.error || 'There was a problem placing your order.',
                        confirmButtonColor: '#A04000'
                    });
                }
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Checkout Error',
                    text: 'Could not reach the server. Please try again later.',
                    confirmButtonColor: '#A04000'
                });
            }
            setIsCheckingOut(false);
        }
    };

    /* ─── Empty Cart State ─── */
    if (cart.length === 0) {
        return (
            <>
                <style>{styles}</style>
                <div className="container cart-page">
                    <div className="empty-cart">
                        <div className="empty-cart-icon">🛒</div>
                        <h3 style={{ color: 'var(--primary-brown)', fontWeight: 700, marginBottom: 4 }}>Your cart is empty</h3>
                        <p style={{ color: '#999', fontSize: '0.95rem', maxWidth: 340, textAlign: 'center', lineHeight: 1.5 }}>
                            Looks like you haven't added any delicious meals yet. Explore our menu and find something you'll love!
                        </p>
                        <Link to="/menu" className="checkout-btn" style={{ width: 'auto', padding: '12px 36px', display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                            <i className="bi bi-card-list"></i> Browse Menu
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style>{styles}</style>
            <div className="container cart-page">

                {/* ─── Step Progress ─── */}
                <div className="cart-steps">
                    <div className={`cart-step ${step === 1 ? 'active' : step > 1 ? 'done' : ''}`}>
                        <span className="cart-step-num">{step > 1 ? <i className="bi bi-check-lg"></i> : '1'}</span>
                        <span>Review Order</span>
                    </div>
                    <div className={`cart-step-line ${step > 1 ? 'done' : ''}`}></div>
                    <div className={`cart-step ${step === 2 ? 'active' : step > 2 ? 'done' : ''}`}>
                        <span className="cart-step-num">{step > 2 ? <i className="bi bi-check-lg"></i> : '2'}</span>
                        <span>Checkout</span>
                    </div>
                    <div className={`cart-step-line ${step > 2 ? 'done' : ''}`}></div>
                    <div className={`cart-step ${step === 3 ? 'active' : ''}`}>
                        <span className="cart-step-num">3</span>
                        <span>Order Confirmed</span>
                    </div>
                </div>

                <div className="row g-4">
                    {step === 1 && (
                        <>
                            {/* ─── Left: Cart Items ─── */}
                            <div className="col-lg-8">
                                {reservationId && (
                                    <div style={{
                                        background: 'linear-gradient(135deg, #fff3cd, #ffe8a1)',
                                        border: '1.5px solid #ffeba2',
                                        borderRadius: '14px',
                                        padding: '14px 20px',
                                        marginBottom: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        color: '#856404',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontSize: '1.5rem' }}>🍽️</span>
                                            <div>
                                                <strong style={{ fontSize: '0.95rem', display: 'block' }}>Pre-ordering for Reservation #{reservationId}</strong>
                                                <span style={{ fontSize: '0.82rem', opacity: 0.9 }}>This order will be linked to your reservation.</span>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={clearReservationLink}
                                            style={{
                                                background: 'rgba(133, 100, 4, 0.1)',
                                                border: '1px solid rgba(133, 100, 4, 0.2)',
                                                borderRadius: '8px',
                                                color: '#856404',
                                                fontSize: '0.78rem',
                                                fontWeight: 700,
                                                padding: '6px 12px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Unlink
                                        </button>
                                    </div>
                                )}

                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h4 style={{ color: 'var(--primary-brown)', fontWeight: 700, margin: 0 }}>
                                        <i className="bi bi-bag-check me-2" style={{ opacity: 0.6 }}></i>
                                        Your Order
                                        <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#aaa', marginLeft: 8 }}>
                                            ({cartTotalCount} {cartTotalCount === 1 ? 'item' : 'items'})
                                        </span>
                                    </h4>
                                    <button className="clear-cart-btn" onClick={handleClearCart}>
                                        <i className="bi bi-trash3 me-1"></i> Clear All
                                    </button>
                                </div>

                                {/* Select All Bar */}
                                <div className="select-all-bar">
                                    <input
                                        type="checkbox"
                                        className="cart-checkbox"
                                        id="select-all-checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                    />
                                    <label htmlFor="select-all-checkbox">
                                        {isAllSelected ? 'Deselect All' : 'Select All'}
                                    </label>
                                    {selectedItems.size > 0 && selectedItems.size < cart.length && (
                                        <span className="selected-count-badge">
                                            {selectedItems.size} of {cart.length} selected
                                        </span>
                                    )}
                                    {selectedItems.size === cart.length && (
                                        <span className="selected-count-badge">
                                            All selected
                                        </span>
                                    )}
                                </div>

                                {cart.map((item, index) => (
                                    <div className={`cart-item-card ${!selectedItems.has(item.cartItemId) ? 'unselected' : ''}`} key={item.cartItemId} style={{ animationDelay: `${index * 0.06}s` }}>
                                        <div className="d-flex align-items-start gap-3">
                                            <input
                                                type="checkbox"
                                                className="cart-checkbox"
                                                checked={selectedItems.has(item.cartItemId)}
                                                onChange={() => toggleItem(item.cartItemId)}
                                                title={selectedItems.has(item.cartItemId) ? 'Deselect item' : 'Select item for checkout'}
                                            />
                                            <img 
                                                src={item.imageUrl || 'https://placehold.co/72x72/f5ebe0/a04000?text=🍽️'} 
                                                alt={item.name} 
                                                className="cart-item-img" 
                                            />
                                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                <div className="d-flex justify-content-between align-items-start">
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <h6 style={{ fontWeight: 700, color: '#2c2c2c', margin: 0, fontSize: '0.95rem' }}>
                                                            {item.name}
                                                        </h6>
                                                        {item.variant && (
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', fontWeight: 600 }}>
                                                                {item.variant}
                                                            </span>
                                                        )}
                                                        {formatDescription(item.description)}
                                                    </div>
                                                    <button 
                                                        className="cart-remove-btn ms-2 flex-shrink-0" 
                                                        onClick={() => removeFromCart(item.cartItemId)} 
                                                        title="Remove item"
                                                    >
                                                        <i className="bi bi-trash3"></i>
                                                    </button>
                                                </div>

                                                {/* Bottom: Price + Qty */}
                                                <div className="d-flex justify-content-between align-items-center mt-3">
                                                    <div className="qty-stepper">
                                                        <button 
                                                            onClick={() => handleDecrement(item)}
                                                            title={item.quantity <= 1 ? "Remove item" : "Decrease quantity"}
                                                        >
                                                            {item.quantity <= 1 ? <i className="bi bi-trash3" style={{ fontSize: '0.75rem', color: '#e74c3c' }}></i> : '−'}
                                                        </button>
                                                        <span className="qty-value">{item.quantity}</span>
                                                        <button onClick={() => handleIncrement(item)} title="Increase quantity">+</button>
                                                    </div>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary-brown)' }}>
                                                            ₱{(item.price * item.quantity).toFixed(2)}
                                                        </div>
                                                        {item.quantity > 1 && (
                                                            <div style={{ fontSize: '0.72rem', color: '#bbb' }}>
                                                                ₱{item.price.toFixed(2)} each
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* ─── Right: Order Summary ─── */}
                            <div className="col-lg-4">
                                <div className="order-summary">
                                    <h5 style={{ fontWeight: 700, color: 'var(--primary-brown)', marginBottom: 20 }}>
                                        <i className="bi bi-receipt me-2" style={{ opacity: 0.5 }}></i>
                                        Order Summary
                                    </h5>

                                    <div className="summary-row">
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Selected ({itemCount} of {cartTotalCount})</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>₱{total.toFixed(2)}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>{reservationId ? 'Order Type' : 'Fulfillment'}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#27ae60' }}>
                                            {reservationId ? 'Dine-In 🍽️' : fulfillmentMethod === 'PICKUP' ? '🏃 Pick-Up' : '🚚 Delivery'}
                                        </span>
                                    </div>

                                    <div className="summary-divider"></div>

                                    <div className="summary-row total">
                                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#333' }}>Total</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-brown)' }}>
                                            ₱{total.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="summary-divider"></div>

                                    <button 
                                        className="checkout-btn" 
                                        onClick={handleProceedToCheckout}
                                        disabled={loadingProfile || selectedItems.size === 0}
                                        style={selectedItems.size === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                    >
                                        {loadingProfile ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span> Loading...</>
                                        ) : (
                                            <><i className="bi bi-arrow-right-circle me-2"></i> Proceed to Checkout</>
                                        )}
                                    </button>

                                    <Link to="/menu" className="add-more-btn text-center d-block" style={{ textDecoration: 'none' }}>
                                        <i className="bi bi-plus-lg me-1"></i> Add More Items
                                    </Link>

                                    {/* Trust badges */}
                                    <div className="text-center mt-4" style={{ opacity: 0.4 }}>
                                        <div style={{ fontSize: '0.72rem', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                                            <span><i className="bi bi-shield-check me-1"></i>Secure</span>
                                            <span>•</span>
                                            <span><i className="bi bi-clock me-1"></i>Fast Prep</span>
                                            <span>•</span>
                                            <span><i className="bi bi-heart me-1"></i>Fresh</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            {/* ─── Left: Checkout Details ─── */}
                            <div className="col-lg-8">
                                <div className="checkout-form-card">
                                    <h5 style={{ fontWeight: 700, color: 'var(--primary-brown)', marginBottom: 20 }}>
                                        <i className={`bi ${reservationId ? 'bi-shop' : 'bi-truck'} me-2`} style={{ opacity: 0.6 }}></i>
                                        {reservationId ? `Dine-In Pre-Order Details (Reservation #${reservationId})` : 'Delivery & Recipient Details'}
                                    </h5>
                                    
                                    <div className="form-group-custom">
                                        <label>Guest / Contact Full Name <span className="text-danger">*</span></label>
                                        <input 
                                            type="text" 
                                            name="recipientName"
                                            value={checkoutForm.recipientName}
                                            onChange={handleFormChange}
                                            placeholder="Enter full name"
                                            required
                                        />
                                    </div>

                                    <div className="form-group-custom">
                                        <label>Contact Number <span className="text-danger">*</span></label>
                                        <input 
                                            type="text" 
                                            name="contactNumber"
                                            value={checkoutForm.contactNumber}
                                            onChange={handleFormChange}
                                            placeholder="e.g. 09123456789"
                                            required
                                        />
                                    </div>

                                    {reservationId ? (
                                        <div className="form-group-custom">
                                            <label>Order Type & Table Location</label>
                                            <div style={{ background: '#fff9e6', border: '1.5px solid #ffe8a1', borderRadius: '12px', padding: '14px 18px', color: '#856404' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span>🍽️ Dine-In Pre-Order</span>
                                                    <span className="badge bg-warning text-dark border">Reservation #{reservationId}</span>
                                                </div>
                                                <div style={{ fontSize: '0.82rem', marginTop: 4, opacity: 0.9 }}>
                                                    Your ordered dishes will be prepared fresh and served directly at your reserved table upon arrival!
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* ── Fulfillment Method Toggle ── */}
                                            <div className="form-group-custom">
                                                <label>Fulfillment Method <span className="text-danger">*</span></label>
                                                <div className="fulfillment-options">
                                                    <div
                                                        id="fulfillment-delivery"
                                                        className={`fulfillment-option-card ${fulfillmentMethod === 'DELIVERY' ? 'selected' : ''} ${!isEligibleForDelivery ? 'disabled' : ''}`}
                                                        onClick={() => isEligibleForDelivery && setFulfillmentMethod('DELIVERY')}
                                                    >
                                                        <i className="bi bi-truck"></i>
                                                        <span className="fc-title">Delivery</span>
                                                        <span className="fc-sub">To your door</span>
                                                    </div>
                                                    <div
                                                        id="fulfillment-pickup"
                                                        className={`fulfillment-option-card ${fulfillmentMethod === 'PICKUP' ? 'selected' : ''}`}
                                                        onClick={() => setFulfillmentMethod('PICKUP')}
                                                    >
                                                        <i className="bi bi-bag-check"></i>
                                                        <span className="fc-title">Pick-Up</span>
                                                        <span className="fc-sub">At the restaurant</span>
                                                    </div>
                                                </div>

                                                {isEligibleForDelivery ? (
                                                    <div className="delivery-area-notice eligible">
                                                        <i className="bi bi-check-circle-fill" style={{ flexShrink: 0, marginTop: 1 }}></i>
                                                        <span>Your address is within our delivery area in <strong>Padre Burgos, Quezon Province</strong>. Delivery is available!</span>
                                                    </div>
                                                ) : (
                                                    <div className="delivery-area-notice ineligible">
                                                        <i className="bi bi-info-circle-fill" style={{ flexShrink: 0, marginTop: 1 }}></i>
                                                        <span>Delivery is only available within <strong>Padre Burgos, Quezon Province</strong>. Your registered address is outside the delivery area — your order is set to <strong>Pick-Up</strong>.</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ── Address or Pick-Up Location ── */}
                                            {fulfillmentMethod === 'DELIVERY' ? (
                                                <div className="form-group-custom">
                                                    <label>Delivery Address <span className="text-danger">*</span></label>
                                                    <textarea
                                                        name="deliveryAddress"
                                                        value={checkoutForm.deliveryAddress}
                                                        onChange={handleFormChange}
                                                        rows="3"
                                                        placeholder="Enter complete house number, street, barangay, and municipality"
                                                        required
                                                    />
                                                </div>
                                            ) : (
                                                <div className="form-group-custom">
                                                    <label>Pick-Up Location</label>
                                                    <div style={{ background: '#f9f5f1', border: '1.5px solid #e8ddd4', borderRadius: '12px', padding: '14px 18px', color: 'var(--primary-brown)', display: 'flex', alignItems: 'center', gap: 12 }}>
                                                        <i className="bi bi-geo-alt-fill" style={{ fontSize: '1.2rem', color: 'var(--accent-orange)', flexShrink: 0 }}></i>
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Duyanan Restaurant</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#999', marginTop: 2 }}>Padre Burgos, Quezon Province</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="form-group-custom">
                                        <label>Payment Method <span className="text-danger">*</span></label>
                                        <div className="payment-options">
                                            <div 
                                                className={`payment-option-card ${checkoutForm.paymentMethod === 'COD' ? 'selected' : ''}`}
                                                onClick={() => handleSelectPayment('COD')}
                                            >
                                                <i className={`bi ${reservationId ? 'bi-shop-window' : 'bi-cash-stack'}`}></i>
                                                <span>{reservationId ? 'Pay at Restaurant' : 'Cash on Delivery'}</span>
                                            </div>
                                            <div 
                                                className={`payment-option-card ${checkoutForm.paymentMethod === 'GCASH' ? 'selected' : ''}`}
                                                onClick={() => handleSelectPayment('GCASH')}
                                            >
                                                <i className="bi bi-phone"></i>
                                                <span>G-Cash</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group-custom">
                                        <label>Order Notes / Special Instructions (Optional)</label>
                                        <textarea 
                                            name="notes"
                                            value={checkoutForm.notes}
                                            onChange={handleFormChange}
                                            rows="2"
                                            placeholder="Any notes for the kitchen or delivery rider..."
                                        />
                                    </div>

                                    <button 
                                        className="btn border-0 py-2.5 px-4 mt-2" 
                                        onClick={() => setStep(1)} 
                                        style={{ 
                                            background: 'transparent', 
                                            color: 'var(--primary-brown)', 
                                            fontWeight: 600, 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: 8,
                                            padding: '8px 16px',
                                            border: '1.5px solid #e0d6cc',
                                            borderRadius: '12px'
                                        }}
                                    >
                                        <i className="bi bi-arrow-left"></i> Back to Review Order
                                    </button>
                                </div>
                            </div>

                            {/* ─── Right: Summary / Confirm ─── */}
                            <div className="col-lg-4">
                                <div className="order-summary">
                                    <h5 style={{ fontWeight: 700, color: 'var(--primary-brown)', marginBottom: 20 }}>
                                        <i className="bi bi-receipt me-2" style={{ opacity: 0.5 }}></i>
                                        Order Summary
                                    </h5>

                                    <div className="summary-row">
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Items ({itemCount})</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>₱{total.toFixed(2)}</span>
                                    </div>
                                    <div className="summary-row">
                                        <span style={{ color: '#888', fontSize: '0.9rem' }}>{reservationId ? 'Order Type' : 'Fulfillment'}</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#27ae60' }}>
                                            {reservationId ? 'Dine-In 🍽️' : fulfillmentMethod === 'PICKUP' ? '🏃 Pick-Up' : '🚚 Delivery'}
                                        </span>
                                    </div>

                                    <div className="summary-divider"></div>

                                    <div className="summary-row total">
                                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#333' }}>Total</span>
                                        <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-brown)' }}>
                                            ₱{total.toFixed(2)}
                                        </span>
                                    </div>

                                    <div className="summary-divider"></div>

                                    <button 
                                        className="checkout-btn" 
                                        onClick={handlePlaceOrder}
                                        disabled={isCheckingOut}
                                    >
                                        {isCheckingOut ? (
                                            <><span className="spinner-border spinner-border-sm me-2"></span> Placing Order...</>
                                        ) : (
                                            <><i className="bi bi-check2-circle me-2"></i> Confirm & Place Order</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {step === 3 && (
                        <div className="col-12">
                            <div className="success-card">
                                <div className="success-icon-container">
                                    <i className="bi bi-check-lg"></i>
                                </div>
                                <h3 style={{ color: 'var(--primary-brown)', fontWeight: 800, marginBottom: 8 }}>
                                    {orderResult?.isDineIn ? 'Dine-In Pre-Order Placed! 🍽️' : 'Order Placed Successfully! 🎉'}
                                </h3>
                                <p style={{ color: '#666', fontSize: '0.95rem', maxWidth: 450, margin: '0 auto 24px' }}>
                                    {orderResult?.isDineIn
                                        ? 'Thank you! Your pre-ordered food is confirmed and will be served at your reserved table upon your arrival.'
                                        : orderResult?.isPickup
                                            ? 'Thank you! Your order is confirmed. Please visit Duyanan Restaurant to pick it up once it\'s ready.'
                                            : 'Thank you for your purchase. Your delicious meal is being prepared and will be delivered shortly.'}
                                </p>

                                {orderResult && (
                                    <div className="receipt-box">
                                        <h6 style={{ fontWeight: 700, color: 'var(--primary-brown)', borderBottom: '1.5px dashed #e8dcd0', paddingBottom: 8, marginBottom: 12 }}>
                                            Receipt Details
                                        </h6>
                                        <div className="receipt-row">
                                            <span className="text-muted">Order ID</span>
                                            <span className="fw-bold text-dark">#{orderResult.id}</span>
                                        </div>
                                        <div className="receipt-row">
                                            <span className="text-muted">{orderResult.isDineIn ? 'Guest Name' : 'Recipient'}</span>
                                            <span className="text-dark fw-semibold">{orderResult.recipientName}</span>
                                        </div>
                                        <div className="receipt-row">
                                            <span className="text-muted">{orderResult.isDineIn ? 'Order Type' : orderResult.isPickup ? 'Pick-Up At' : 'Delivery Address'}</span>
                                            <span className="text-dark fw-semibold">
                                                {orderResult.isDineIn ? (
                                                    <span className="badge bg-warning text-dark border">
                                                        🍽️ Dine-In (Reservation #{orderResult.reservationId})
                                                    </span>
                                                ) : orderResult.isPickup ? (
                                                    <span className="badge" style={{ background: '#fff3e0', color: '#a04000', border: '1px solid #ffcc80', fontSize: '0.85rem' }}>
                                                        🏃 Pick-Up at Duyanan Restaurant
                                                    </span>
                                                ) : orderResult.deliveryAddress}
                                            </span>
                                        </div>
                                        <div className="receipt-row">
                                            <span className="text-muted">Payment Method</span>
                                            <span className="text-dark fw-semibold">
                                                {orderResult.paymentMethod === 'COD' 
                                                    ? (orderResult.isDineIn ? 'Pay at Restaurant' : 'Cash on Delivery (COD)') 
                                                    : 'G-Cash'}
                                            </span>
                                        </div>
                                        <div className="receipt-row receipt-total">
                                            <span>Total Amount Paid</span>
                                            <span style={{ color: 'var(--accent-orange)' }}>₱{orderResult.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
                                    <button 
                                        className="checkout-btn" 
                                        onClick={() => navigate('/profile', { state: { tab: 'orders' } })}
                                        style={{ width: 'auto', padding: '12px 30px' }}
                                    >
                                        <i className="bi bi-receipt me-2"></i> Track My Order
                                    </button>
                                    <button 
                                        className="add-more-btn" 
                                        onClick={() => navigate('/menu')}
                                        style={{ width: 'auto', padding: '12px 30px', marginTop: 0 }}
                                    >
                                        <i className="bi bi-shop me-2"></i> Order More Food
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default CartPage;
