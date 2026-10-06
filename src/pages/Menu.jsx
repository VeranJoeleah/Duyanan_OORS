import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import sfcImg from '../assets/img/sfc.png';
import habhabImg from '../assets/img/habhab.jpg';
import logoImg from '../assets/img/duyanan_logo.png';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const API_URL = import.meta.env.VITE_API_URL;

const parseGroupMealDescription = (desc) => {
    if (!desc) {
        return { inclusions: '', goodFor: '', savings: 0 };
    }
    try {
        const parsed = JSON.parse(desc);
        if (parsed && typeof parsed === 'object') {
            return {
                inclusions: parsed.inclusions || '',
                goodFor: parsed.goodFor || '',
                savings: parsed.savings || 0
            };
        }
    } catch (e) {}

    let goodFor = '';
    let savings = 0;

    const goodForMatch = desc.match(/\(?(Good\s+for\s+[^)]+)\)?/i) || desc.match(/(Good\s+for\s+\d+-\d+|Good\s+for\s+\d+)/i);
    if (goodForMatch) {
        goodFor = goodForMatch[1].replace(/Good\s+for\s+/i, '').trim();
        goodFor = goodFor.replace(/[()]/g, '').trim();
    }

    const savingsMatch = desc.match(/Save\s+(?:up\s+to\s+)?(?:₱|PHP)?\s*(\d+)/i);
    if (savingsMatch) {
        savings = parseFloat(savingsMatch[1]) || 0;
    }

    let cleanInclusions = desc;
    if (goodForMatch) {
        cleanInclusions = cleanInclusions.replace(goodForMatch[0], '');
    }
    const savePattern = /Save\s+(?:up\s+to\s+)?(?:₱|PHP)?\s*\d+\s*!?/i;
    cleanInclusions = cleanInclusions.replace(savePattern, '');
    cleanInclusions = cleanInclusions.replace(/^[\s,.;:|[\]-]+|[\s,.;:|[\]-]+$/g, '').trim();

    return {
        inclusions: cleanInclusions || desc,
        goodFor: goodFor,
        savings: savings
    };
};

const Menu = () => {
    const [activeTab, setActiveTab] = useState('Menu');
    const [products, setProducts] = useState([]);
    const [eventPackages, setEventPackages] = useState([]);
    const [groupMeals, setGroupMeals] = useState([]);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToCart } = useCart();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedGroupMeal, setSelectedGroupMeal] = useState(null);
    const [customSelections, setCustomSelections] = useState({
        mains: [],
        sides: [],
        drinks: []
    });

    const categories = ['All', 'Rice Meals', 'Sizzling Meals', 'Duyanan Specials', 'Burger', 'French Fries', 'Nachos', 'Home-Made Siomai', 'Drinks', 'Soup', 'Milk Shakes', 'Sandwich', 'Student Meals', 'Extras'];

    const categoryScrollRef = useRef(null);
    const scrollCategories = (direction) => {
        if (categoryScrollRef.current) {
            const scrollAmount = 200;
            categoryScrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        axios.get(`${API_URL}/api/products`)
            .then(response => {
                const updatedProducts = response.data.map(p => {
                    let finalImg = p.imageUrl;
                    if (p.name === 'Sizzling Fried Chicken' || p.name === 'Chicken Inasal' || p.imageUrl === 'sfc.png' || p.imageUrl === 'sfc.jpg') {
                        finalImg = sfcImg;
                    } else if (p.name === 'Pancit Habhab' || p.imageUrl === 'habhab.jpg' || p.imageUrl === 'habhab.png') {
                        finalImg = habhabImg;
                    } else if (p.imageUrl === 'duyanan_logo.png') {
                        finalImg = logoImg;
                    } else if (p.imageUrl && p.imageUrl.startsWith('/uploads/')) {
                        finalImg = `${API_URL}${p.imageUrl}`;
                    } else if (p.imageUrl && !p.imageUrl.startsWith('http') && !p.imageUrl.startsWith('data:') && !p.imageUrl.startsWith('/')) {
                        finalImg = `/img/${p.imageUrl}`;
                    }
                    return { ...p, imageUrl: finalImg };
                });

                // Partition standard products, event packages, and group meals
                const filteredProducts = updatedProducts.filter(p => p.category !== 'Event Packages' && p.category !== 'Group Meals');
                const filteredEventPackages = updatedProducts.filter(p => p.category === 'Event Packages');
                const filteredGroupMeals = updatedProducts.filter(p => p.category === 'Group Meals');

                setProducts(filteredProducts);
                setMenuItems(filteredProducts);
                setEventPackages(filteredEventPackages);
                setGroupMeals(filteredGroupMeals);
            })
            .catch(error => {
                console.error('Error fetching products:', error);
                
                // Fallbacks
                const fallbackRegular = [
                    { id: 1, name: 'Sizzling Fried Chicken', priceSolo: 109.00, priceALaCarte: 159.00, description: 'Solo | Ala Carte', imageUrl: sfcImg, category: 'Sizzling Meals' },
                    { id: 2, name: 'Pancit Habhab', priceALaCarte: 250.00, description: 'Ala Carte', imageUrl: habhabImg, category: 'Duyanan Specials' },
                    { id: 3, name: 'Lumpiang Turon', priceSolo: 50.00, description: '10pcs', imageUrl: 'https://placehold.co/300x200/brown/white?text=Turon', category: 'Extras' },
                    { id: 4, name: 'Chicken Inasal', priceSolo: 120.00, priceALaCarte: 170.00, description: 'Solo | Ala Carte', imageUrl: sfcImg, category: 'Rice Meals' },
                ];
                setProducts(fallbackRegular);
                setMenuItems(fallbackRegular);

                setEventPackages([
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

                setGroupMeals([
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
        return { mains: 3, sides: 1, drinks: 1 };
    };

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
        const { mains, sides, drinks } = customSelections;
        if (mains.some(m => !m) || sides.some(s => !s) || drinks.some(d => !d)) {
            Swal.fire('Incomplete Selections', 'Please select all items for your package before adding it to your order.', 'warning');
            return;
        }
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

    const handleAddGroupMealToCart = (meal) => {
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
        setSelectedGroupMeal(meal);
    };

    const handleConfirmGroupMeal = (meal) => {
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
        setSelectedGroupMeal(null);
    };

    // Filter products by search query
    const searchedProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const searchedPackages = eventPackages.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const searchedMeals = groupMeals.filter(m => 
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group products by category
    const productsByCategory = categories.slice(1).reduce((acc, category) => {
        acc[category] = searchedProducts.filter(p => p.category === category);
        return acc;
    }, {});

    const scrollToCategory = (categoryName) => {
        setActiveCategory(categoryName);
        if (categoryName === 'All') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        const element = document.getElementById(`category-${categoryName}`);
        if (element) {
            // Adjust offset for the sticky headers
            const y = element.getBoundingClientRect().top + window.scrollY - 180;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const handleAddToCart = (product) => {
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

        const addAction = (variant = null, price = null) => {
            addToCart(product, variant, price);
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Added to cart',
                text: `${product.name}${variant ? ` (${variant})` : ''} has been added.`,
                showConfirmButton: false,
                timer: 2500,
                timerProgressBar: true
            });
        };

        const comboPrices = (product.customCombos || []).map(c => c.price);
        const activePrices = [product.priceSolo, product.priceALaCarte, product.priceALaCarte2, product.price1Liter, product.price1Point5Liter, product.price2Liter, ...comboPrices].filter(p => p > 0);
        const hasVariants = activePrices.length > 1 || (product.category === 'Milk Shakes' && product.flavors && product.flavors.length > 0);

        if (hasVariants) {
            const flavorsList = product.flavors ? product.flavors.split(',').map(f => f.trim()).filter(f => f.length > 0) : [];
            const flavorDropdownHtml = flavorsList.length > 0 ? `
                <div class="mb-3 text-start px-1">
                    <label class="form-label fw-bold mb-1" style="color: #555; font-size: 0.85rem;">Select Flavor <span class="text-danger">*</span></label>
                    <select id="flavor-select" class="form-select shadow-sm" style="border-radius: 8px; border: 2px solid rgba(0,0,0,0.05); font-weight: 600; color: #444; padding: 6px 12px; cursor: pointer; font-size: 0.9rem;">
                        <option value="" disabled selected>Choose a flavor...</option>
                        ${flavorsList.map(f => `<option value="${f}">${f}</option>`).join('')}
                    </select>
                    <div id="flavor-error" class="text-danger mt-1 small d-none fw-bold"><i class="bi bi-exclamation-circle me-1"></i>Please select a flavor</div>
                </div>
            ` : '';

            Swal.fire({
                title: '',
                html: `
                    <style>
                        .swal2-popup {
                            border-radius: 24px !important;
                            overflow: hidden !important;
                            width: 26em !important;
                        }
                        .swal2-html-container {
                            overflow: hidden !important;
                            padding: 24px !important;
                        }
                        .variant-btn {
                            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                            border: 2px solid transparent;
                            position: relative;
                            overflow: hidden;
                            cursor: pointer;
                        }
                        .variant-btn:hover {
                            transform: translateY(-2px) scale(1.01);
                            box-shadow: 0 4px 12px rgba(139, 58, 15, 0.2) !important;
                            border-color: rgba(255, 255, 255, 0.3);
                        }
                        .variant-btn:active {
                            transform: translateY(1px) scale(0.99);
                        }
                        .variant-btn::after {
                            content: '';
                            position: absolute;
                            top: 50%; left: 50%;
                            width: 150%; height: 150%;
                            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%);
                            transform: translate(-50%, -50%) scale(0);
                            transition: transform 0.4s ease-out;
                            opacity: 0;
                        }
                        .variant-btn:hover::after {
                            transform: translate(-50%, -50%) scale(1);
                            opacity: 1;
                        }
                        .swal-custom-cancel {
                            background-color: transparent !important;
                            color: #8B3A0F !important;
                            border: 2px solid rgba(139, 58, 15, 0.2) !important;
                            border-radius: 10px !important;
                            font-weight: 700 !important;
                            padding: 8px 24px !important;
                            font-size: 0.9rem !important;
                            transition: all 0.2s !important;
                            box-shadow: none !important;
                        }
                        .swal-custom-cancel:hover {
                            background-color: rgba(139, 58, 15, 0.05) !important;
                            border-color: #8B3A0F !important;
                            transform: translateY(-2px);
                        }
                        .swal2-actions {
                            margin-top: 8px !important;
                            padding-top: 0 !important;
                        }
                        .swal2-html-container {
                            padding-bottom: 8px !important;
                        }
                    </style>
                    <div class="d-flex align-items-center mb-3 text-start pb-3" style="border-bottom: 2px solid rgba(0,0,0,0.05);">
                        <div style="width: 45px; height: 45px; flex-shrink: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.08); margin-right: 12px;">
                            <img src="${product.imageUrl || 'https://placehold.co/300x200?text=No+Image'}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                        <div>
                            <h4 style="color: var(--primary-brown); font-weight: 800; margin: 0 0 2px 0; font-size: 1.1rem; letter-spacing: -0.5px;">Choose Variant</h4>
                            <p style="margin: 0; color: #666; font-size: 0.85rem; font-weight: 600;">${product.name}</p>
                        </div>
                    </div>
                    ${flavorDropdownHtml}

                    <div class="d-flex flex-column px-1" style="gap: 8px;">
                        ${product.priceSolo > 0 ? `
                            <button id="btn-solo" class="variant-btn btn text-white py-2 fw-bold shadow-sm d-flex justify-content-between align-items-center px-3" style="background: linear-gradient(135deg, #8B3A0F, #5C1F00); border-radius: 12px !important; font-size: 0.95rem; min-height: 48px; border: 2px solid transparent;">
                                <span>${['Drinks', 'Milk Shakes'].includes(product.category) ? 'Glass' : ['Duyanan Specials', 'Burger', 'French Fries', 'Home-Made Siomai', 'Soup'].includes(product.category) ? 'Price 1' : 'Solo'}</span>
                                <span style="color: rgba(255,255,255,0.9);">₱${product.priceSolo.toFixed(2)}</span>
                            </button>
                        ` : ''}
                        ${!['Drinks', 'Milk Shakes'].includes(product.category) && product.priceALaCarte > 0 ? `
                            <button id="btn-alacarte" class="variant-btn btn text-white py-2 fw-bold shadow-sm d-flex justify-content-between align-items-center px-3" style="background: linear-gradient(135deg, #D35400, #A04000); border-radius: 12px !important; font-size: 0.95rem; min-height: 48px; border: 2px solid transparent;">
                                <span>${['Duyanan Specials', 'Burger', 'French Fries', 'Home-Made Siomai', 'Soup'].includes(product.category) ? 'Price 2' : (product.priceALaCarte2 > 0 ? 'A La Carte 1' : 'A La Carte')}</span>
                                <span style="color: rgba(255,255,255,0.9);">₱${product.priceALaCarte.toFixed(2)}</span>
                            </button>
                        ` : ''}
                        ${!['Drinks', 'Milk Shakes'].includes(product.category) && product.priceALaCarte2 > 0 ? `
                            <button id="btn-alacarte2" class="variant-btn btn text-white py-2 fw-bold shadow-sm d-flex justify-content-between align-items-center px-3" style="background: linear-gradient(135deg, #D35400, #A04000); border-radius: 12px !important; font-size: 0.95rem; min-height: 48px; border: 2px solid transparent;">
                                <span>A La Carte 2</span>
                                <span style="color: rgba(255,255,255,0.9);">₱${product.priceALaCarte2.toFixed(2)}</span>
                            </button>
                        ` : ''}
                        ${['Drinks', 'Milk Shakes'].includes(product.category) && product.price1Liter > 0 ? `
                            <button id="btn-1l" class="variant-btn btn text-white py-2 fw-bold shadow-sm d-flex justify-content-between align-items-center px-3" style="background: linear-gradient(135deg, #D35400, #A04000); border-radius: 12px !important; font-size: 0.95rem; min-height: 48px; border: 2px solid transparent;">
                                <span>1 Liter</span>
                                <span style="color: rgba(255,255,255,0.9);">₱${product.price1Liter.toFixed(2)}</span>
                            </button>
                        ` : ''}
                        ${['Drinks', 'Milk Shakes'].includes(product.category) && product.price1Point5Liter > 0 ? `
                            <button id="btn-15l" class="variant-btn btn text-white py-2 fw-bold shadow-sm d-flex justify-content-between align-items-center px-3" style="background: linear-gradient(135deg, #D35400, #A04000); border-radius: 12px !important; font-size: 0.95rem; min-height: 48px; border: 2px solid transparent;">
                                <span>1.5 Liters</span>
                                <span style="color: rgba(255,255,255,0.9);">₱${product.price1Point5Liter.toFixed(2)}</span>
                            </button>
                        ` : ''}
                        ${['Drinks', 'Milk Shakes'].includes(product.category) && product.price2Liter > 0 ? `
                            <button id="btn-2l" class="variant-btn btn text-white py-2 fw-bold shadow-sm d-flex justify-content-between align-items-center px-3" style="background: linear-gradient(135deg, #D35400, #A04000); border-radius: 12px !important; font-size: 0.95rem; min-height: 48px; border: 2px solid transparent;">
                                <span>2 Liters</span>
                                <span style="color: rgba(255,255,255,0.9);">₱${product.price2Liter.toFixed(2)}</span>
                            </button>
                        ` : ''}
                        ${product.combo1Name && product.combo1Price > 0 ? `
                            <button id="btn-combo1" class="variant-btn btn text-white py-2 fw-bold shadow-sm d-flex justify-content-between align-items-center px-3" style="background: linear-gradient(135deg, #D35400, #A04000); border-radius: 12px !important; font-size: 0.95rem; min-height: 48px; border: 2px solid transparent;">
                                <span>Combo: ${product.combo1Name}</span>
                                <span style="color: rgba(255,255,255,0.9);">₱${product.combo1Price.toFixed(2)}</span>
                            </button>
                        ` : ''}
                        ${product.combo2Name && product.combo2Price > 0 ? `
                            <button id="btn-combo2" class="variant-btn btn text-white py-2 fw-bold shadow-sm d-flex justify-content-between align-items-center px-3" style="background: linear-gradient(135deg, #D35400, #A04000); border-radius: 12px !important; font-size: 0.95rem; min-height: 48px; border: 2px solid transparent;">
                                <span>Combo: ${product.combo2Name}</span>
                                <span style="color: rgba(255,255,255,0.9);">₱${product.combo2Price.toFixed(2)}</span>
                            </button>
                        ` : ''}
                    </div>
                `,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: 'Cancel',
                buttonsStyling: false,
                customClass: {
                    cancelButton: 'swal-custom-cancel mt-2'
                },
                didOpen: () => {
                    const btnSolo = document.getElementById('btn-solo');
                    const btnAlaCarte = document.getElementById('btn-alacarte');
                    const btnAlaCarte2 = document.getElementById('btn-alacarte2');
                    const btn1L = document.getElementById('btn-1l');
                    const btn15L = document.getElementById('btn-15l');
                    const btn2L = document.getElementById('btn-2l');
                    const btnCombo1 = document.getElementById('btn-combo1');
                    const btnCombo2 = document.getElementById('btn-combo2');
                    const flavorSelect = document.getElementById('flavor-select');
                    const flavorError = document.getElementById('flavor-error');
                    
                    const validateFlavorAndAdd = (baseVariantName, price) => {
                        let finalVariantName = baseVariantName;
                        if (flavorSelect) {
                            if (!flavorSelect.value) {
                                flavorSelect.style.borderColor = '#dc3545';
                                flavorError.classList.remove('d-none');
                                // Shake animation
                                flavorSelect.classList.add('animate__animated', 'animate__headShake');
                                setTimeout(() => flavorSelect.classList.remove('animate__animated', 'animate__headShake'), 500);
                                return;
                            }
                            finalVariantName = `${flavorSelect.value} - ${baseVariantName}`;
                        }
                        Swal.close();
                        addAction(finalVariantName, price);
                    };

                    if (flavorSelect) {
                        flavorSelect.addEventListener('change', () => {
                            flavorSelect.style.borderColor = 'rgba(0,0,0,0.05)';
                            flavorError.classList.add('d-none');
                        });
                    }

                    if (btnSolo) {
                        btnSolo.addEventListener('click', () => {
                            validateFlavorAndAdd(['Drinks', 'Milk Shakes'].includes(product.category) ? 'Glass' : ['Duyanan Specials', 'Burger', 'French Fries', 'Home-Made Siomai', 'Soup'].includes(product.category) ? 'Price 1' : 'Solo', product.priceSolo);
                        });
                    }
                    if (btnAlaCarte) {
                        btnAlaCarte.addEventListener('click', () => {
                            validateFlavorAndAdd(['Duyanan Specials', 'Burger', 'French Fries', 'Home-Made Siomai', 'Soup'].includes(product.category) ? 'Price 2' : (product.priceALaCarte2 > 0 ? 'A La Carte 1' : 'A La Carte'), product.priceALaCarte);
                        });
                    }
                    if (btnAlaCarte2) {
                        btnAlaCarte2.addEventListener('click', () => {
                            validateFlavorAndAdd('A La Carte 2', product.priceALaCarte2);
                        });
                    }
                    (product.customCombos || []).forEach((combo, idx) => {
                        const btn = document.getElementById(`btn-combo-${idx}`);
                        if (btn) {
                            btn.addEventListener('click', () => {
                                validateFlavorAndAdd(`Combo: ${combo.name}`, combo.price);
                            });
                        }
                    });
                    if (btn1L) {
                        btn1L.addEventListener('click', () => {
                            validateFlavorAndAdd('1 Liter', product.price1Liter);
                        });
                    }
                    if (btn15L) {
                        btn15L.addEventListener('click', () => {
                            validateFlavorAndAdd('1.5 Liters', product.price1Point5Liter);
                        });
                    }
                    if (btn2L) {
                        btn2L.addEventListener('click', () => {
                            validateFlavorAndAdd('2 Liters', product.price2Liter);
                        });
                    }
                }
            });
        } else {
            let activeVariant = null;
            let activePrice = 0;
            if (product.priceSolo > 0) { activeVariant = ['Drinks', 'Milk Shakes'].includes(product.category) ? 'Glass' : ['Duyanan Specials', 'Burger', 'French Fries', 'Home-Made Siomai', 'Soup'].includes(product.category) ? 'Price 1' : 'Solo'; activePrice = product.priceSolo; }
            else if (product.priceALaCarte > 0) { activeVariant = product.category === 'Drinks' ? null : ['Duyanan Specials', 'Burger', 'French Fries', 'Home-Made Siomai', 'Soup'].includes(product.category) ? 'Price 2' : (product.priceALaCarte2 > 0 ? 'A La Carte 1' : 'A La Carte'); activePrice = product.priceALaCarte; }
            else if (product.priceALaCarte2 > 0) { activeVariant = 'A La Carte 2'; activePrice = product.priceALaCarte2; }
            else if (product.price1Liter > 0) { activeVariant = '1 Liter'; activePrice = product.price1Liter; }
            else if (product.price1Point5Liter > 0) { activeVariant = '1.5 Liters'; activePrice = product.price1Point5Liter; }
            else if (product.price2Liter > 0) { activeVariant = '2 Liters'; activePrice = product.price2Liter; }
            
            // For milk shakes with only 1 variant (or 0) but multiple flavors, they will trigger the modal due to hasVariants.
            // If they reach here, it means 0 or 1 price AND 0 or 1 flavors.
            const singleFlavor = (product.category === 'Milk Shakes' && product.flavors) ? product.flavors.split(',')[0].trim() : null;
            if (singleFlavor && activeVariant) {
                activeVariant = `${singleFlavor} - ${activeVariant}`;
            }

            addAction(activeVariant, activePrice);
        }
    };

    return (
        <div className="container-fluid px-0" style={{ minHeight: '100vh', paddingTop: 'var(--nav-height)', paddingBottom: '40px' }}>
            {/* Guest info banner */}
            {!isAuthenticated && (
                <div style={{
                    background: 'linear-gradient(90deg, #7B3F00 0%, #D35400 100%)',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '10px 20px',
                    fontSize: '0.92rem',
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px'
                }}>
                    <i className="bi bi-eye-fill" style={{ fontSize: '1.1rem' }}></i>
                    You&apos;re browsing as a guest — <strong>&nbsp;view only.</strong>&nbsp;
                    <a href="/login" style={{ color: '#ffd580', textDecoration: 'underline', fontWeight: 700 }}>Log in</a>
                    &nbsp;or&nbsp;
                    <a href="/register" style={{ color: '#ffd580', textDecoration: 'underline', fontWeight: 700 }}>Register</a>
                    &nbsp;to order.
                </div>
            )}

            {/* Sticky header bar */}
            <div className="sticky-top bg-white pt-4 pb-3 px-4 shadow-sm z-3" style={{ top: 'var(--nav-height)' }}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                    <h2 className="m-0" style={{ color: 'var(--primary-brown)', fontWeight: 'bold' }}>Duyanan {activeTab}</h2>
                    
                    {/* Tab Switcher */}
                    <div className="d-flex p-1 bg-light rounded-pill border" style={{ gap: '4px' }}>
                        {['Menu', 'Event Packages', 'Group Meals'].map((tab) => (
                            <button
                                key={tab}
                                className="btn rounded-pill border-0 px-3 py-1.5 fw-bold text-nowrap"
                                style={{
                                    backgroundColor: activeTab === tab ? 'var(--accent-orange)' : 'transparent',
                                    color: activeTab === tab ? '#fff' : '#6c757d',
                                    boxShadow: activeTab === tab ? '0 4px 10px rgba(211, 84, 0, 0.2)' : 'none',
                                    transition: 'all 0.25s ease',
                                    fontSize: '0.9rem',
                                    padding: '6px 16px'
                                }}
                                onClick={() => {
                                    setActiveTab(tab);
                                    setSearchQuery('');
                                    setActiveCategory('All');
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                            >
                                {tab === 'Menu' && <i className="bi bi-book me-2"></i>}
                                {tab === 'Event Packages' && <i className="bi bi-gift me-2"></i>}
                                {tab === 'Group Meals' && <i className="bi bi-people me-2"></i>}
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="d-flex align-items-center flex-wrap flex-md-nowrap gap-3">
                    {/* Search Bar */}
                    <div className="position-relative" style={{ minWidth: '250px' }}>
                        <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input 
                            type="text" 
                            className="form-control rounded-pill ps-5" 
                            placeholder="Search all items..."
                            value={searchQuery}
                            onChange={(e) => {
                                const query = e.target.value;
                                setSearchQuery(query);

                                if (query.trim()) {
                                    const q = query.toLowerCase();
                                    const menuHits = products.filter(p => p.name.toLowerCase().includes(q)).length;
                                    const pkgHits = eventPackages.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)).length;
                                    const mealHits = groupMeals.filter(m => m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)).length;

                                    // Auto-switch to the tab with results if current tab has none
                                    const currentHits = activeTab === 'Menu' ? menuHits : activeTab === 'Event Packages' ? pkgHits : mealHits;
                                    if (currentHits === 0) {
                                        if (menuHits > 0) setActiveTab('Menu');
                                        else if (pkgHits > 0) setActiveTab('Event Packages');
                                        else if (mealHits > 0) setActiveTab('Group Meals');
                                    }
                                }
                            }}
                            style={{ border: '1px solid #ccc', boxShadow: 'none' }}
                        />
                    </div>

                    {/* Horizontal Scroller for Categories with Arrows (Only for regular Menu) */}
                    {activeTab === 'Menu' && (
                        <div className="d-flex align-items-center flex-grow-1" style={{ minWidth: 0 }}>
                            <button className="btn btn-sm border-0 text-muted px-1 me-1" onClick={() => scrollCategories('left')}>
                                <i className="bi bi-chevron-left fs-5"></i>
                            </button>
                            
                            <div ref={categoryScrollRef} className="overflow-x-auto no-scrollbar d-flex align-items-center gap-2 flex-grow-1 px-1" style={{ whiteSpace: 'nowrap', scrollBehavior: 'smooth' }}>
                                <button 
                                    className="btn rounded-pill border-0 fw-bold px-4 py-2"
                                    onClick={() => scrollToCategory('All')}
                                    style={{ 
                                        backgroundColor: activeCategory === 'All' ? 'var(--accent-orange)' : 'transparent', 
                                        color: activeCategory === 'All' ? '#fff' : '#6c757d', 
                                    }}
                                >
                                    All
                                </button>
                                {categories.slice(1).map(cat => (
                                    <button 
                                        key={cat}
                                        className="btn rounded-pill border-0 fw-bold px-4 py-2"
                                        onClick={() => scrollToCategory(cat)}
                                        style={{ 
                                            backgroundColor: activeCategory === cat ? 'var(--accent-orange)' : 'transparent', 
                                            color: activeCategory === cat ? '#fff' : '#6c757d', 
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            <button className="btn btn-sm border-0 text-muted px-1 ms-1" onClick={() => scrollCategories('right')}>
                                <i className="bi bi-chevron-right fs-5"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Areas */}
            <div className="px-4 mt-4">
                {isLoading ? (
                    <div className="duyanan-loading-overlay">
                        <div className="duyanan-loading-card">
                            <div className="duyanan-loading-icon-wrap">
                                <span className="duyanan-loading-leaf">🍃</span>
                                <span className="duyanan-loading-ring"></span>
                            </div>
                            <p className="duyanan-loading-text">Preparing the menu<span className="duyanan-loading-dots"><span>.</span><span>.</span><span>.</span></span></p>
                            <p className="duyanan-loading-sub">Duyanan Restaurant</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* 1. Standard A La Carte Menu View */}
                        {activeTab === 'Menu' && (
                            <>
                                {/* Show search results at the top when searching */}
                                {searchQuery.trim() && searchedProducts.length > 0 && (
                                    <div className="mb-5 pt-2">
                                        <h3 className="mb-4 pb-2 d-flex align-items-center gap-2" style={{ color: 'var(--primary-brown)', fontWeight: 'bold', borderBottom: '2px solid rgba(160, 64, 0, 0.1)' }}>
                                            <i className="bi bi-search" style={{ fontSize: '1.1rem', opacity: 0.5 }}></i>
                                            Results for "{searchQuery}"
                                            <span className="badge rounded-pill" style={{ backgroundColor: 'rgba(211,84,0,0.1)', color: 'var(--accent-orange)', fontSize: '0.75rem', fontWeight: 600 }}>
                                                {searchedProducts.length} {searchedProducts.length === 1 ? 'item' : 'items'}
                                            </span>
                                        </h3>
                                        <div className="row g-4">
                                            {searchedProducts.map(product => (
                                                <div className="col-md-6 col-lg-6 col-xl-4" key={product.id}>
                                                    {/* Reuse the same card component */}
                                                    <div className="card h-100 border-0 bg-white position-relative" style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)', position: 'relative' }}>
                                                        <span className="badge rounded-pill position-absolute" style={{ backgroundColor: 'rgba(160,64,0,0.08)', color: 'var(--primary-brown)', fontSize: '0.65rem', fontWeight: 600, top: '12px', right: '12px', zIndex: 1 }}>
                                                            {product.category}
                                                        </span>
                                                        <div className="d-flex h-100 align-items-center p-3">
                                                            <div style={{ width: '120px', height: '120px', flexShrink: 0, overflow: 'hidden', borderRadius: '10px' }}>
                                                                <img src={product.imageUrl || 'https://placehold.co/300x200?text=No+Image'} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </div>
                                                            <div className="ms-3 d-flex flex-column h-100 justify-content-center w-100 pt-1">
                                                                <div className="mb-1" style={{ paddingRight: '80px' }}>
                                                                    <h5 className="mb-0" style={{ color: '#222', fontWeight: '700', fontSize: '1.05rem', lineHeight: '1.3' }}>
                                                                        {product.category === 'Milk Shakes' && product.flavors ? product.flavors : product.name}
                                                                    </h5>
                                                                </div>
                                                                <p className="text-muted mb-2" style={{ fontSize: '0.82rem', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                    {product.description}
                                                                </p>
                                                                <div className="d-flex justify-content-between align-items-center mt-auto pt-1">
                                                                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-orange)', fontWeight: '700' }}>
                                                                        ₱{(product.priceSolo || product.priceALaCarte || product.price1Liter || 0).toFixed(2)}
                                                                        {(product.priceALaCarte > 0 && product.priceSolo > 0) ? ` - ₱${product.priceALaCarte.toFixed(2)}` : ''}
                                                                    </span>
                                                                    <button 
                                                                        className="btn btn-sm px-3 fw-bold rounded-pill text-nowrap"
                                                                        style={{ backgroundColor: 'rgba(211, 84, 0, 0.08)', color: 'var(--accent-orange)', fontSize: '0.8rem', transition: 'all 0.2s ease', border: '1px solid rgba(211, 84, 0, 0.15)' }}
                                                                        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-orange)'; e.currentTarget.style.color = '#fff'; }}
                                                                        onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(211, 84, 0, 0.08)'; e.currentTarget.style.color = 'var(--accent-orange)'; }}
                                                                        onClick={() => handleAddToCart(product)}
                                                                    >
                                                                        <i className="bi bi-plus-lg me-1"></i>Add
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {searchQuery.trim() && searchedProducts.length === 0 && (
                                    <div className="text-center py-5 text-muted mb-4">
                                        <i className="bi bi-search fs-1 d-block mb-3" style={{ opacity: 0.15 }}></i>
                                        <h5>No items found for "{searchQuery}"</h5>
                                        <p className="small">Try a different keyword or browse by category below.</p>
                                    </div>
                                )}

                                {/* Category sections — hidden when actively searching */}
                                {!searchQuery.trim() && categories.slice(1).map(category => {
                                    const categoryProducts = productsByCategory[category] || [];
                                    
                                    if (categoryProducts.length === 0) return null;

                                    return (
                                        <div key={category} id={`category-${category}`} className="mb-5 pt-2">
                                            <h3 className="mb-4 pb-2" style={{ color: 'var(--primary-brown)', fontWeight: 'bold', borderBottom: '2px solid rgba(160, 64, 0, 0.1)' }}>
                                                {category}
                                            </h3>
                                            
                                            {categoryProducts.length > 0 ? (
                                                <div className="row g-4">
                                                    {categoryProducts.map(product => (
                                                        <div className="col-md-6 col-lg-6 col-xl-4" key={product.id}>
                                                            <div className="card h-100 border-0 bg-white" style={{ borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                                <div className="d-flex h-100 align-items-center p-3">
                                                                    {/* Image Container */}
                                                                    <div style={{ width: '120px', height: '120px', flexShrink: 0, overflow: 'hidden', borderRadius: '10px' }}>
                                                                        <img 
                                                                            src={product.imageUrl || 'https://placehold.co/300x200?text=No+Image'} 
                                                                            alt={product.name} 
                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                                        />
                                                                    </div>
                                                                    
                                                                    {/* Content Container */}
                                                                    <div className="ms-3 d-flex flex-column h-100 justify-content-center w-100 pt-1">
                                                                        <h5 className="mb-1" style={{ color: '#222', fontWeight: '700', fontSize: '1.05rem', lineHeight: '1.3' }}>
                                                                            {product.category === 'Milk Shakes' && product.flavors ? product.flavors : product.name}
                                                                        </h5>
                                                                        <p className="text-muted mb-2" style={{ fontSize: '0.82rem', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                            {product.description}
                                                                        </p>
                                                                        <div className="d-flex justify-content-between align-items-center mt-auto pt-1">
                                                                            <div className="d-flex flex-column">
                                                                                {['Milk Shakes', 'Drinks'].includes(product.category) && (
                                                                                    <>
                                                                                        {product.priceSolo > 0 && (
                                                                                            <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '600', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                                Glass: <span style={{ color: 'var(--accent-orange)', fontSize: '0.82rem' }}>₱{product.priceSolo.toFixed(2)}</span>
                                                                                            </span>
                                                                                        )}
                                                                                        {product.priceALaCarte > 0 && (
                                                                                            <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '600', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                                <span style={{ color: 'var(--accent-orange)', fontSize: '0.82rem' }}>₱{product.priceALaCarte.toFixed(2)}</span>
                                                                                            </span>
                                                                                        )}
                                                                                        {product.price1Liter > 0 && (
                                                                                            <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '600', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                                1 Liter: <span style={{ color: 'var(--accent-orange)', fontSize: '0.82rem' }}>₱{product.price1Liter.toFixed(2)}</span>
                                                                                            </span>
                                                                                        )}
                                                                                        {product.price1Point5Liter > 0 && (
                                                                                            <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '600', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                                1.5 Liters: <span style={{ color: 'var(--accent-orange)', fontSize: '0.82rem' }}>₱{product.price1Point5Liter.toFixed(2)}</span>
                                                                                            </span>
                                                                                        )}
                                                                                        {product.price2Liter > 0 && (
                                                                                            <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '600', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                                2 Liters: <span style={{ color: 'var(--accent-orange)', fontSize: '0.82rem' }}>₱{product.price2Liter.toFixed(2)}</span>
                                                                                            </span>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                                
                                                                                {['Duyanan Specials', 'Burger', 'French Fries', 'Home-Made Siomai', 'Soup'].includes(product.category) && (
                                                                                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-orange)', fontWeight: '700', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                        {product.priceSolo > 0 && product.priceALaCarte > 0 
                                                                                            ? `₱${product.priceSolo.toFixed(2)} - ₱${product.priceALaCarte.toFixed(2)}` 
                                                                                            : `₱${(product.priceSolo || product.priceALaCarte || 0).toFixed(2)}`}
                                                                                    </span>
                                                                                )}

                                                                                {['Nachos', 'Sandwich', 'Student Meals'].includes(product.category) && (
                                                                                    <span style={{ fontSize: '0.85rem', color: 'var(--accent-orange)', fontWeight: '700', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                        ₱{(product.priceSolo || 0).toFixed(2)}
                                                                                    </span>
                                                                                )}

                                                                                {!['Milk Shakes', 'Drinks', 'Duyanan Specials', 'Burger', 'French Fries', 'Home-Made Siomai', 'Soup', 'Nachos', 'Sandwich', 'Student Meals'].includes(product.category) && (
                                                                                    <>
                                                                                        {product.priceSolo > 0 && (
                                                                                            <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '600', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                                Solo: <span style={{ color: 'var(--accent-orange)', fontSize: '0.82rem' }}>₱{product.priceSolo.toFixed(2)}</span>
                                                                                            </span>
                                                                                        )}
                                                                                        {product.priceALaCarte > 0 && (
                                                                                            <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '600', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                                {product.priceALaCarte2 > 0 ? 'A La Carte 1' : 'A La Carte'}: <span style={{ color: 'var(--accent-orange)', fontSize: '0.82rem' }}>₱{product.priceALaCarte.toFixed(2)}</span>
                                                                                            </span>
                                                                                        )}
                                                                                        {product.priceALaCarte2 > 0 && (
                                                                                            <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: '600', lineHeight: '1.2', whiteSpace: 'nowrap' }}>
                                                                                                A La Carte 2: <span style={{ color: 'var(--accent-orange)', fontSize: '0.82rem' }}>₱{product.priceALaCarte2.toFixed(2)}</span>
                                                                                            </span>
                                                                                        )}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                            <button 
                                                                                className="btn btn-sm px-3 fw-bold rounded-pill text-nowrap" 
                                                                                style={{ 
                                                                                    backgroundColor: 'rgba(211, 84, 0, 0.08)', 
                                                                                    color: 'var(--accent-orange)',
                                                                                    fontSize: '0.8rem',
                                                                                    transition: 'all 0.2s ease',
                                                                                    opacity: isAuthenticated ? 1 : 0.75,
                                                                                    cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                                                                                    border: '1px solid rgba(211, 84, 0, 0.15)'
                                                                                }}
                                                                                onMouseOver={(e) => {
                                                                                    if (isAuthenticated) {
                                                                                        e.currentTarget.style.backgroundColor = 'var(--accent-orange)';
                                                                                        e.currentTarget.style.color = '#fff';
                                                                                    }
                                                                                }}
                                                                                onMouseOut={(e) => {
                                                                                    if (isAuthenticated) {
                                                                                        e.currentTarget.style.backgroundColor = 'rgba(211, 84, 0, 0.08)';
                                                                                        e.currentTarget.style.color = 'var(--accent-orange)';
                                                                                    }
                                                                                }}
                                                                                onClick={() => handleAddToCart(product)}
                                                                                title={!isAuthenticated ? 'Login to add items to cart' : ''}
                                                                            >
                                                                                {!isAuthenticated && <i className="bi bi-lock-fill me-1" style={{ fontSize: '0.7rem' }}></i>}
                                                                                Add Order
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted">No products match your search in this category.</p>
                                            )}
                                        </div>
                                    );
                                })}

                                {searchedProducts.length === 0 && searchQuery !== '' && (
                                    <div className="text-center py-5">
                                        <i className="bi bi-search" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                                        <h4 className="mt-3 text-muted">No results found for "{searchQuery}"</h4>
                                        <p className="text-muted">Try adjusting your search term.</p>
                                    </div>
                                )}
                            </>
                        )}

                        {/* 2. Event Packages View */}
                        {activeTab === 'Event Packages' && (
                            <div className="py-2 animate__animated animate__fadeIn">
                                <div className="text-center mb-5">
                                    <h3 style={{ color: 'var(--primary-brown)', fontWeight: 'bold' }}>🍃 Duyanan Event Packages</h3>
                                    <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
                                        Celebrate your special moments with authentic Filipino catering customized by you. Perfect for major gatherings, milestones, and weddings.
                                    </p>
                                </div>
                                {searchedPackages.length > 0 ? (
                                    <div className="row g-4 mb-5">
                                        {searchedPackages.map(pkg => (
                                            <div className="col-md-6 col-lg-4" key={pkg.id}>
                                                <div className="card h-100 border-0 bg-white" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
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
                                        <h5>No event packages found matching your search.</h5>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 3. Group Meals View */}
                        {activeTab === 'Group Meals' && (
                            <div className="py-2 animate__animated animate__fadeIn">

                                {searchedMeals.length > 0 ? (
                                    <div className="row g-4 mb-5">
                                        {searchedMeals.map(meal => (
                                            <div className="col-md-6 col-lg-4" key={meal.id}>
                                                <div className="card h-100 border-0 bg-white" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
                                                    <div style={{ height: '220px', overflow: 'hidden', position: 'relative' }}>
                                                        <img 
                                                            src={meal.imageUrl || 'https://placehold.co/400x250?text=Group+Meal'} 
                                                            alt={meal.name} 
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                                        />
                                                        <div className="position-absolute bottom-0 end-0 m-3 d-flex flex-column align-items-end" style={{ gap: 0 }}>
                                                            {(() => {
                                                                const d = parseGroupMealDescription(meal.description);
                                                                return d.savings > 0 ? (
                                                                    <div className="fw-bold px-2 py-1 text-center" style={{ 
                                                                        fontSize: '0.7rem', 
                                                                        backgroundColor: 'var(--accent-orange)', 
                                                                        color: '#fff',
                                                                        borderRadius: '6px 6px 0 0', 
                                                                        letterSpacing: '0.02em',
                                                                        lineHeight: 1.2,
                                                                        minWidth: '80px'
                                                                    }}>
                                                                        Save ₱{d.savings}
                                                                    </div>
                                                                ) : null;
                                                            })()}
                                                            <div className="text-white fw-bold px-3 py-2 text-center" style={{ 
                                                                fontSize: '1.1rem', 
                                                                backgroundColor: 'var(--dark-brown)',
                                                                borderRadius: (() => {
                                                                    const d = parseGroupMealDescription(meal.description);
                                                                    return d.savings > 0 ? '0 0 8px 8px' : '8px';
                                                                })(),
                                                                minWidth: '80px'
                                                            }}>
                                                                ₱{meal.priceSolo.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="card-body p-4 d-flex flex-column">
                                                        <h4 className="card-title fw-bold mb-2" style={{ color: 'var(--primary-brown)', fontSize: '1.25rem' }}>{meal.name}</h4>
                                                        {(() => {
                                                            const details = parseGroupMealDescription(meal.description);
                                                            return (
                                                                <div className="card-text text-muted small mb-4" style={{ lineHeight: '1.5', flexGrow: 1 }}>
                                                                    <div className="mb-2 text-truncate" style={{ maxWidth: '100%' }} title={details.inclusions}>
                                                                        <span className="fw-bold text-dark">Includes:</span> {details.inclusions}
                                                                    </div>
                                                                    <div className="d-flex flex-wrap gap-2 mt-2">
                                                                        {details.goodFor && (
                                                                            <span className="badge bg-light text-dark border px-2 py-1 rounded-pill">
                                                                                <i className="bi bi-people-fill me-1 text-primary"></i> Good for {details.goodFor}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                        <button 
                                                            className="btn text-white w-100 py-2 fw-bold" 
                                                            style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '10px', fontSize: '0.9rem', transition: 'all 0.2s' }}
                                                            onClick={() => handleAddGroupMealToCart(meal)}
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
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Customization Modal for Event Packages */}
            {selectedPackage && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                    <div className="card border-0 shadow-lg rounded-4 overflow-hidden animate__animated animate__zoomIn animate__faster" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', backgroundColor: '#fffaf5' }}>
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
                                            className="form-select bg-white shadow-sm" 
                                            value={val}
                                            onChange={(e) => handleSelectChange('mains', idx, e.target.value)}
                                            required
                                            style={{ borderRadius: '8px' }}
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
                                            className="form-select bg-white shadow-sm" 
                                            value={val}
                                            onChange={(e) => handleSelectChange('sides', idx, e.target.value)}
                                            required
                                            style={{ borderRadius: '8px' }}
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
                                            className="form-select bg-white shadow-sm" 
                                            value={val}
                                            onChange={(e) => handleSelectChange('drinks', idx, e.target.value)}
                                            required
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <option value="">-- Choose a Drink --</option>
                                            {getDrinkOptions().map(item => (
                                                <option key={item.id} value={item.name}>{item.name} ({item.category})</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}

                                <div className="mt-4 pt-3 d-flex justify-content-end gap-2 border-top">
                                    <button type="button" className="btn btn-light px-4" onClick={() => setSelectedPackage(null)} style={{ borderRadius: '8px' }}>Cancel</button>
                                    <button type="submit" className="btn text-white px-4 fw-bold" style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '8px' }}>
                                        Add to Cart • ₱{selectedPackage.priceSolo.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Details Modal for Group Meals */}
            {selectedGroupMeal && (() => {
                const details = parseGroupMealDescription(selectedGroupMeal.description);
                return (
                    <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate__animated animate__fadeIn" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
                        <div className="card border-0 shadow-lg animate__animated animate__zoomIn animate__faster" style={{ width: '90%', maxWidth: '850px', backgroundColor: '#fffaf5', borderRadius: '24px', overflow: 'hidden' }}>
                            <div className="row g-0 align-items-stretch">
                                {/* Left side: Image (visible on md screens and up) */}
                                <div className="col-md-5 d-none d-md-block" style={{ position: 'relative', minHeight: '420px' }}>
                                    <img 
                                        src={selectedGroupMeal.imageUrl || 'https://placehold.co/500x250?text=Group+Meal'} 
                                        alt={selectedGroupMeal.name} 
                                        style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', top: 0, left: 0 }} 
                                    />
                                    <div className="position-absolute bottom-0 start-0 w-100 p-4 text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)' }}>
                                        <h3 className="fw-bold m-0" style={{ fontSize: '1.4rem', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>{selectedGroupMeal.name}</h3>
                                    </div>
                                </div>
                                
                                {/* Right side: Details */}
                                <div className="col-12 col-md-7 p-4 d-flex flex-column justify-content-between" style={{ minHeight: '420px' }}>
                                    {/* Mobile image and header (hidden on md and up) */}
                                    <div className="d-md-none mb-3">
                                        <div style={{ height: '140px', borderRadius: '16px', overflow: 'hidden', position: 'relative', marginBottom: '8px' }}>
                                            <img 
                                                src={selectedGroupMeal.imageUrl || 'https://placehold.co/500x250?text=Group+Meal'} 
                                                alt={selectedGroupMeal.name} 
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                            />
                                            <div className="position-absolute bottom-0 start-0 w-100 p-2 text-white" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                                                <h4 className="fw-bold m-0" style={{ fontSize: '1.05rem' }}>{selectedGroupMeal.name}</h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="text-uppercase fw-bold text-muted small m-0" style={{ letterSpacing: '1.2px', fontSize: '0.78rem' }}>Meal Package Details</h6>
                                        <button className="btn-close" onClick={() => setSelectedGroupMeal(null)} aria-label="Close" style={{ padding: '0.5rem' }}></button>
                                    </div>

                                    <div className="mb-3 flex-grow-1" style={{ minHeight: 0 }}>
                                        <div className="fw-bold text-dark mb-2" style={{ fontSize: '0.9rem' }}>
                                            <i className="bi bi-egg-fried me-2 text-warning"></i>Inclusions:
                                        </div>
                                        <div className="text-muted bg-white p-3 rounded-3 border no-scrollbar" style={{ fontSize: '0.85rem', lineHeight: '1.5', maxHeight: '160px', overflowY: 'auto', whiteSpace: 'pre-line' }}>
                                            {details.inclusions}
                                        </div>
                                    </div>

                                    <div className="row g-2 mb-3">
                                        {details.goodFor && (
                                            <div className="col-6">
                                                <div className="d-flex align-items-center p-3 rounded-3 border bg-white h-100">
                                                    <i className="bi bi-people-fill text-primary fs-4 me-3"></i>
                                                    <div>
                                                        <div className="small text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Good For</div>
                                                        <div className="fw-bold text-dark" style={{ fontSize: '0.82rem' }}>{details.goodFor} pax</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {details.savings > 0 && (
                                            <div className="col-6">
                                                <div className="d-flex align-items-center p-3 rounded-3 border bg-success-subtle h-100" style={{ backgroundColor: '#e6ffed' }}>
                                                    <i className="bi bi-piggy-bank-fill text-success fs-4 me-3"></i>
                                                    <div>
                                                        <div className="small text-success fw-bold" style={{ fontSize: '0.7rem' }}>Money Saved</div>
                                                        <div className="fw-bold text-success" style={{ fontSize: '0.82rem' }}>₱{details.savings}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-2">
                                        <div>
                                            <div className="small text-muted fw-bold" style={{ fontSize: '0.7rem' }}>Total Price</div>
                                            <div className="fs-4 fw-bold" style={{ color: 'var(--accent-orange)' }}>₱{selectedGroupMeal.priceSolo.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-outline-secondary px-3" onClick={() => setSelectedGroupMeal(null)} style={{ borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem' }}>
                                                Cancel
                                            </button>
                                            <button type="button" className="btn text-white px-4 fw-bold" style={{ backgroundColor: 'var(--accent-orange)', borderRadius: '10px', fontSize: '0.85rem' }} onClick={() => handleConfirmGroupMeal(selectedGroupMeal)}>
                                                Confirm Order
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default Menu;
