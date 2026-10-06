import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

const EventPackages = () => {
    const [packages, setPackages] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');

    // Modal state for package customization
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [customSelections, setCustomSelections] = useState({
        mains: [],
        sides: [],
        drinks: []
    });

    useEffect(() => {
        // Fetch all products
        axios.get(`${API_URL}/api/products`)
            .then(response => {
                const allProducts = response.data;
                // Filter out Event Packages
                const eventPkgs = allProducts.filter(p => p.category === 'Event Packages').map(p => ({
                    ...p,
                    imageUrl: p.imageUrl && p.imageUrl.startsWith('/uploads/') ? `${API_URL}${p.imageUrl}` : (p.imageUrl && !p.imageUrl.startsWith('http') && !p.imageUrl.startsWith('/') ? `/img/${p.imageUrl}` : p.imageUrl)
                }));
                
                setPackages(eventPkgs);
                
                // Keep the rest as menu items to select from inside the customization modal
                const regularMenu = allProducts.filter(p => p.category !== 'Event Packages' && p.category !== 'Group Meals');
                setMenuItems(regularMenu);
            })
            .catch(error => {
                console.error('Error fetching event packages:', error);
                // Fallback mock event packages
                setPackages([
                    {
                        id: 901,
                        name: 'Classic Celebration Package',
                        priceSolo: 12500.00,
                        description: 'Perfect for small gatherings. Serves 20-25 pax. Includes 2 Main Dishes, 1 Side, and 1 Drink option.',
                        imageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=60',
                        category: 'Event Packages'
                    },
                    {
                        id: 902,
                        name: 'Grand Fiesta Package',
                        priceSolo: 24900.00,
                        description: 'Ideal for major milestones and corporate events. Serves 40-50 pax. Includes 3 Main Dishes, 2 Sides, and 2 Drink options.',
                        imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&auto=format&fit=crop&q=60',
                        category: 'Event Packages'
                    },
                    {
                        id: 903,
                        name: 'Royal Banquet Package',
                        priceSolo: 48000.00,
                        description: 'Exquisite premium catering package. Serves 80-100 pax. Includes 4 Main Dishes, 2 Sides, 2 Desserts, and 3 Drink options.',
                        imageUrl: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=500&auto=format&fit=crop&q=60',
                        category: 'Event Packages'
                    }
                ]);
            })
            .finally(() => setIsLoading(false));
    }, []);

    // Helper to extract how many items are allowed based on package details
    const getPackageLimits = (pkgName) => {
        const name = pkgName.toLowerCase();
        if (name.includes('classic') || name.includes('celebration')) {
            return { mains: 2, sides: 1, drinks: 1 };
        }
        if (name.includes('grand') || name.includes('fiesta')) {
            return { mains: 3, sides: 2, drinks: 2 };
        }
        if (name.includes('royal') || name.includes('banquet') || name.includes('wedding')) {
            return { mains: 4, sides: 4, drinks: 3 };
        }
        return { mains: 3, sides: 1, drinks: 1 }; // default fallback
    };

    // Filter menu items by category type for selection dropdowns
    const getMainOptions = () => menuItems.filter(item => ['Rice Meals', 'Sizzling Meals', 'Duyanan Specials'].includes(item.category));
    const getSideOptions = () => menuItems.filter(item => ['French Fries', 'Nachos', 'Home-Made Siomai', 'Soup', 'Extras', 'Sandwich', 'Student Meals'].includes(item.category));
    const getDrinkOptions = () => menuItems.filter(item => ['Drinks', 'Milk Shakes'].includes(item.category));

    const handleOpenCustomization = (pkg) => {
        if (!isAuthenticated) {
            Swal.fire({
                icon: 'info',
                title: 'Login Required',
                text: 'Please log in to customize and order an event package.',
                confirmButtonColor: 'var(--primary-brown)'
            });
            return;
        }

        const limits = getPackageLimits(pkg.name);
        
        // Initialize custom selections with empty values matching the limits
        setCustomSelections({
            mains: Array(limits.mains).fill(''),
            sides: Array(limits.sides).fill(''),
            drinks: Array(limits.drinks).fill('')
        });
        setSelectedPackage(pkg);
    };

    const handleSelectChange = (type, index, value) => {
        setCustomSelections(prev => {
            const list = [...prev[type]];
            list[index] = value;
            return { ...prev, [type]: list };
        });
    };

    const handleAddPackageToCart = (e) => {
        e.preventDefault();
        
        // Verify all selections are made
        const { mains, sides, drinks } = customSelections;
        if (mains.some(m => !m) || sides.some(s => !s) || drinks.some(d => !d)) {
            Swal.fire('Incomplete Selections', 'Please select all items for your package before adding it to your order.', 'warning');
            return;
        }

        // Build the variant string
        const variantString = `Mains: ${mains.join(', ')} | Sides: ${sides.join(', ')} | Drinks: ${drinks.join(', ')}`;
        
        addToCart(selectedPackage, variantString, selectedPackage.priceSolo);

        Swal.fire({
            icon: 'success',
            title: 'Package Added!',
            text: `${selectedPackage.name} has been added to your cart with your custom selections.`,
            timer: 2500,
            showConfirmButton: false
        });

        setSelectedPackage(null);
    };

    const filteredPackages = packages.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{ minHeight: '100vh', paddingTop: '100px', backgroundColor: '#fdfcfb' }}>
            {/* Header Banner */}
            <div className="py-5 text-center text-white" style={{ background: 'linear-gradient(135deg, var(--primary-brown) 0%, var(--accent-orange) 100%)', marginBottom: '40px' }}>
                <h1 className="fw-bold mb-2 text-white" style={{ fontFamily: 'Jost' }}>🍃 Duyanan Event Packages</h1>
                <p className="lead mb-0 px-3" style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                    Celebrate your special moments with authentic Filipino catering customized by you
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
                            placeholder="Search Event Packages" 
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
                            <p className="duyanan-loading-text">Loading packages<span className="duyanan-loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
                        </div>
                    </div>
                ) : (
                    <>
                        {filteredPackages.length > 0 ? (
                            <div className="row g-4 mb-5">
                                {filteredPackages.map(pkg => (
                                    <div className="col-md-6 col-lg-4" key={pkg.id}>
                                        <div className="card h-100 border-0 shadow-sm bg-white" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)' }}>
                                            <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                                                <img 
                                                    src={pkg.imageUrl || 'https://placehold.co/400x250?text=Event+Package'} 
                                                    alt={pkg.name} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                />
                                                <div className="position-absolute bottom-0 end-0 bg-dark text-white fw-bold px-3 py-2 m-3 rounded-3" style={{ fontSize: '1.1rem', backgroundColor: 'rgba(0,0,0,0.75)' }}>
                                                    ₱{pkg.priceSolo.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                </div>
                                            </div>
                                            <div className="card-body p-4 d-flex flex-column">
                                                <h4 className="card-title fw-bold mb-2" style={{ color: 'var(--primary-brown)', fontSize: '1.25rem' }}>{pkg.name}</h4>
                                                <p className="card-text text-muted small mb-4" style={{ lineHeight: '1.5', flexGrow: 1 }}>{pkg.description}</p>
                                                <button 
                                                    className="btn text-white w-100 py-2 fw-bold" 
                                                    style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '10px', fontSize: '0.9rem', transition: 'all 0.2s' }}
                                                    onClick={() => handleOpenCustomization(pkg)}
                                                >
                                                    Configure Package
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-inbox fs-1 d-block mb-3 text-muted"></i>
                                <h5>No packages found matching your search.</h5>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Customization Modal */}
            {selectedPackage && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', backgroundColor: '#fffaf5' }}>
                        <div className="card-header border-0 bg-white p-4 pb-3 d-flex justify-content-between align-items-center">
                            <div>
                                <span className="text-uppercase fw-bold text-muted small" style={{ letterSpacing: '1px' }}>Configure Inclusions</span>
                                <h4 className="fw-bold m-0" style={{ color: 'var(--primary-brown)' }}>{selectedPackage.name}</h4>
                            </div>
                            <button className="btn-close" onClick={() => setSelectedPackage(null)}></button>
                        </div>
                        <div className="card-body p-4 pt-2 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                            <p className="text-muted small mb-4">{selectedPackage.description}</p>
                            
                            <form onSubmit={handleAddPackageToCart}>
                                {/* Main Dishes Options */}
                                <h5 className="fw-bold mb-3" style={{ color: 'var(--primary-brown)', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '5px' }}>
                                    Main Dishes ({customSelections.mains.length})
                                </h5>
                                {customSelections.mains.map((val, idx) => (
                                    <div className="mb-3" key={`main-${idx}`}>
                                        <label className="form-label small fw-bold text-muted">Select Main Dish #{idx + 1}</label>
                                        <select 
                                            className="form-select bg-white" 
                                            value={val}
                                            onChange={(e) => handleSelectChange('mains', idx, e.target.value)}
                                            required
                                        >
                                            <option value="">-- Choose a Main Course --</option>
                                            {getMainOptions().map(item => (
                                                <option key={item.id} value={item.name}>{item.name} ({item.category})</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}

                                {/* Sides / Pasta Options */}
                                <h5 className="fw-bold mb-3 mt-4" style={{ color: 'var(--primary-brown)', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '5px' }}>
                                    Starters, Sides & Pastas ({customSelections.sides.length})
                                </h5>
                                {customSelections.sides.map((val, idx) => (
                                    <div className="mb-3" key={`side-${idx}`}>
                                        <label className="form-label small fw-bold text-muted">Select Side/Pasta #{idx + 1}</label>
                                        <select 
                                            className="form-select bg-white" 
                                            value={val}
                                            onChange={(e) => handleSelectChange('sides', idx, e.target.value)}
                                            required
                                        >
                                            <option value="">-- Choose a Side/Pasta --</option>
                                            {getSideOptions().map(item => (
                                                <option key={item.id} value={item.name}>{item.name} ({item.category})</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}

                                {/* Drinks Options */}
                                <h5 className="fw-bold mb-3 mt-4" style={{ color: 'var(--primary-brown)', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '5px' }}>
                                    Drinks ({customSelections.drinks.length})
                                </h5>
                                {customSelections.drinks.map((val, idx) => (
                                    <div className="mb-3" key={`drink-${idx}`}>
                                        <label className="form-label small fw-bold text-muted">Select Drink Option #{idx + 1}</label>
                                        <select 
                                            className="form-select bg-white" 
                                            value={val}
                                            onChange={(e) => handleSelectChange('drinks', idx, e.target.value)}
                                            required
                                        >
                                            <option value="">-- Choose a Drink --</option>
                                            {getDrinkOptions().map(item => (
                                                <option key={item.id} value={item.name}>{item.name} ({item.category})</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}

                                <div className="mt-4 pt-3 d-flex justify-content-end gap-2 border-top">
                                    <button type="button" className="btn btn-light px-4" onClick={() => setSelectedPackage(null)}>Cancel</button>
                                    <button type="submit" className="btn text-white px-4 fw-bold" style={{ backgroundColor: 'var(--accent-orange)' }}>
                                        Add to Cart • ₱{selectedPackage.priceSolo.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventPackages;
