import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState(() => {
        const savedCart = localStorage.getItem('duyanan_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    const [reservationId, setReservationId] = useState(() => {
        return localStorage.getItem('duyanan_reservation_id') || null;
    });

    useEffect(() => {
        localStorage.setItem('duyanan_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        if (reservationId) {
            localStorage.setItem('duyanan_reservation_id', reservationId);
        } else {
            localStorage.removeItem('duyanan_reservation_id');
        }
    }, [reservationId]);

    const addToCart = (product, variant = null, variantPrice = null) => {
        setCart((prevCart) => {
            const cartItemId = `${product.id}-${variant || 'base'}`;
            const existingItem = prevCart.find((item) => item.cartItemId === cartItemId);
            
            const priceToUse = variantPrice !== null ? variantPrice : product.price;

            if (existingItem) {
                return prevCart.map((item) =>
                    item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, cartItemId, variant, price: priceToUse, quantity: 1 }];
        });
    };

    const removeFromCart = (cartItemId) => {
        setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== cartItemId));
    };

    const updateQuantity = (cartItemId, newQty) => {
        if (newQty <= 0) {
            removeFromCart(cartItemId);
            return;
        }
        setCart((prevCart) =>
            prevCart.map((item) =>
                item.cartItemId === cartItemId ? { ...item, quantity: newQty } : item
            )
        );
    };

    const clearCart = () => {
        setCart([]);
        setReservationId(null);
    };

    const clearReservationLink = () => {
        setReservationId(null);
    };

    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            removeFromCart, 
            updateQuantity, 
            clearCart, 
            total,
            reservationId,
            setReservationId,
            clearReservationLink
        }}>
            {children}
        </CartContext.Provider>
    );
};
