import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

const GroupMeals = () => {
    const [meals, setMeals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Fetch all products
        axios.get(`${API_URL}/api/products`)
            .then(response => {
                const allProducts = response.data;
                // Filter only Group Meals
                const groupMeals = allProducts.filter(p => p.category === 'Group Meals').map(p => ({
                    ...p,
                    imageUrl: p.imageUrl && p.imageUrl.startsWith('/uploads/') ? `${API_URL}${p.imageUrl}` : (p.imageUrl && !p.imageUrl.startsWith('http') && !p.imageUrl.startsWith('/') ? `/img/${p.imageUrl}` : p.imageUrl)
                }));
                
                setMeals(groupMeals);
            })
            .catch(error => {
                console.error('Error fetching group meals:', error);
                // Fallback mock group meals
                setMeals([
                    {
                        id: 801,
                        name: 'Duyanan Fiesta Bundle',
                        priceSolo: 1299.00,
                        description: 'A delicious feast for the family. Serves 4-6 pax. Includes Sizzling Fried Chicken, Pancit Habhab, Lumpiang Turon, rice, and a pitcher of Iced Tea.',
                        imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
                        category: 'Group Meals'
                    },
                    {
                        id: 802,
                        name: 'Barkada Feast',
                        priceSolo: 1899.00,
                        description: 'Great for hangouts and friendly gatherings. Serves 6-8 pax. Includes Sizzling Fried Chicken, Pancit Habhab, Nachos, French Fries, rice, and two pitchers of Milk Shakes.',
                        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60',
                        category: 'Group Meals'
                    },
                    {
                        id: 803,
                        name: 'Family Salo-Salo',
                        priceSolo: 2499.00,
                        description: 'Our ultimate grand sharing platter. Serves 8-10 pax. Includes a double portion of Sizzling Fried Chicken, Pancit Habhab, Home-Made Siomai, soup, garlic rice, and drinks of your choice.',
                        imageUrl: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?w=500&auto=format&fit=crop&q=60',
                        category: 'Group Meals'
                    }
                ]);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const handleAddMealToCart = (meal) => {
        if (!isAuthenticated) {
            Swal.fire({
                icon: 'info',
                title: 'Login Required',
                html: 'You need an account to add items to cart.<br/><br/>Please <b>log in</b> or <b>register</b> to continue.',
                showCancelButton: true,
                confirmButtonText: '🔑 Login',
                cancelButtonText: 'Register',
                confirmButtonColor: 'var(--primary-brown)',
                cancelButtonColor: 'var(--accent-orange)',
                reverseButtons: false
            }).then((result) => {
                if (result.isConfirmed) {
                    navigate('/login');
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    navigate('/register');
                }
            });
            return;
        }

        // Add directly with 'Group Meal' as variant so it resolves to priceSolo
        addToCart(meal, 'Group Meal', meal.priceSolo);

        Swal.fire({
            toast: true,
            position: 'bottom-end',
            icon: 'success',
            title: 'Added to cart',
            text: `${meal.name} has been added.`,
            showConfirmButton: false,
            timer: 2500,
            timerProgressBar: true
        });
    };

    const filteredMeals = meals.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', paddingTop: '100px', backgroundColor: '#fdfcfb' }}>
            {/* Header Banner */}
            <div className="py-5 text-center text-white" style={{ background: 'linear-gradient(135deg, var(--primary-brown) 0%, var(--accent-orange) 100%)', marginBottom: '40px' }}>
                <h1 className="fw-bold mb-2 text-white" style={{ fontFamily: 'Jost' }}>🍃 Duyanan Group Meals</h1>
                <p className="lead mb-0 px-3" style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                    Share the love with our special family and group platter bundles
                </p>
            </div>

            <div className="container px-4 px-lg-5">
                {/* Search Bar */}
                <div className="d-flex justify-content-center mb-5">
                    <div className="position-relative" style={{ width: '100%', maxWidth: '500px' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input 
                            type="text" 
                            className="form-control rounded-pill ps-5 py-2 shadow-sm" 
                            placeholder="Search Group Meals" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ border: '1px solid rgba(0,0,0,0.1)' }}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="duyanan-loading-overlay">
                        <div className="duyanan-loading-card">
                            <div className="duyanan-loading-icon-wrap">
                                <span className="duyanan-loading-leaf">🍃</span>
                                <span className="duyanan-loading-ring"></span>
                            </div>
                            <p className="duyanan-loading-text">Loading group meals<span className="duyanan-loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
                        </div>
                    </div>
                ) : (
                    <>
                        {filteredMeals.length > 0 ? (
                            <div className="row g-4 mb-5">
                                {filteredMeals.map(meal => (
                                    <div className="col-md-6 col-lg-4" key={meal.id}>
                                        <div className="card h-100 border-0 shadow-sm bg-white" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                                                <img 
                                                    src={meal.imageUrl || 'https://placehold.co/400x250?text=Group+Meal'} 
                                                    alt={meal.name} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                />
                                                <div className="position-absolute bottom-0 end-0 bg-dark text-white fw-bold px-3 py-2 m-3 rounded-3" style={{ fontSize: '1.1rem', backgroundColor: 'rgba(0,0,0,0.75)' }}>
                                                    ₱{meal.priceSolo.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                </div>
                                            </div>
                                            <div className="card-body p-4 d-flex flex-column">
                                                <h4 className="card-title fw-bold mb-2" style={{ color: 'var(--primary-brown)', fontSize: '1.25rem' }}>{meal.name}</h4>
                                                <p className="card-text text-muted small mb-4" style={{ lineHeight: '1.5', flexGrow: 1 }}>{meal.description}</p>
                                                <button 
                                                    className="btn text-white w-100 py-2 fw-bold" 
                                                    style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '10px', fontSize: '0.9rem', transition: 'all 0.2s' }}
                                                    onClick={() => handleAddMealToCart(meal)}
                                                >
                                                    Add to Order
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-inbox fs-1 d-block mb-3 text-muted"></i>
                                <h5>No group meals found matching your search.</h5>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default GroupMeals;
