import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import 'bootstrap-icons/font/bootstrap-icons.css';
import duyananBg from '../assets/img/duyanan_bg.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '', rememberMe: false });
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated, user } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            if (user?.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/');
            }
        }
    }, [isAuthenticated, navigate, user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleForgotPassword = async () => {
        const { value: email } = await Swal.fire({
            title: 'Forgot Password?',
            text: 'Enter your email address and we will send you a reset link.',
            input: 'email',
            inputPlaceholder: 'Enter your email address',
            showCancelButton: true,
            confirmButtonText: 'Send Reset Link',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#c2703a',
            cancelButtonColor: '#6c757d',
            background: '#1a1a2e',
            color: '#fff',
            inputAttributes: {
                autocapitalize: 'off',
                autocorrect: 'off'
            },
            inputValidator: (value) => {
                if (!value) {
                    return 'Please enter your email address';
                }
            }
        });

        if (email) {
            Swal.fire({
                title: 'Sending...',
                text: 'Please wait while we process your request.',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading(),
                background: '#1a1a2e',
                color: '#fff',
            });

            try {
                const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Check Your Email!',
                        text: data.message || 'A password reset link has been sent to your email address.',
                        confirmButtonColor: '#c2703a',
                        background: '#1a1a2e',
                        color: '#fff',
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.error || 'Something went wrong. Please try again.',
                        confirmButtonColor: '#c2703a',
                        background: '#1a1a2e',
                        color: '#fff',
                    });
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Connection Error',
                    text: 'Could not connect to the server. Please try again later.',
                    confirmButtonColor: '#c2703a',
                    background: '#1a1a2e',
                    color: '#fff',
                });
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: credentials.email,
                    password: credentials.password,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                setLoginError(data.error || 'Login failed. Please try again.');
            } else {
                // Save user session via AuthContext
                login({
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role,
                    token: data.token,
                });
                // Route based on role
                if (data.role === 'ADMIN') {
                    navigate('/admin');
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            console.error("Login fetch error:", err);
            setLoginError('Could not connect to the server. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    const handleSocialLogin = (platform) => {
        if (platform === 'Facebook') {
            if (!window.FB) {
                Swal.fire('Error', 'Facebook SDK not loaded yet. Please refresh.', 'error');
                return;
            }

            window.FB.login((response) => {
                if (response.authResponse) {
                    const accessToken = response.authResponse.accessToken;
                    setIsLoading(true);

                    fetch(`${API_URL}/api/auth/facebook`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ accessToken })
                    })
                        .then(res => res.json())
                        .then(data => {
                            if (data.token) {
                                login(data);
                                navigate('/');
                            } else {
                                Swal.fire('Login Failed', data.error || 'Could not log in with Facebook', 'error');
                            }
                        })
                        .catch(() => Swal.fire('Error', 'Server communication failed', 'error'))
                        .finally(() => setIsLoading(false));
                }
            }, { scope: 'public_profile,email' });
            return;
        }

        Swal.fire({
            title: `${platform} Login`,
            text: `The ${platform} login feature is currently being integrated. Please use your email and password for now!`,
            icon: 'info',
            confirmButtonColor: 'var(--primary-brown)',
            timer: 3500
        });
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '100px 20px 40px',
                backgroundImage: `url(${duyananBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                position: 'relative',
            }}
        >
            {/* Dark gradient overlay */}
            <div style={{
                position: 'fixed', inset: 0,
                background: 'linear-gradient(160deg, rgba(0,0,0,0.45) 0%, rgba(110,44,0,0.55) 100%)',
                zIndex: 0,
            }} />

            {/* Two-column glass card */}
            <div
                className="position-relative d-flex w-100"
                style={{
                    maxWidth: '900px',
                    zIndex: 1,
                    borderRadius: '24px',
                    overflow: 'hidden',
                    boxShadow: '0 12px 48px rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                }}
            >
                {/* Left — Image Panel */}
                <div
                    className="d-none d-md-flex flex-column align-items-center justify-content-center"
                    style={{
                        width: '42%',
                        flexShrink: 0,
                        background: 'linear-gradient(160deg, rgba(110,44,0,0.85) 0%, rgba(40,10,0,0.95) 100%)',
                        backdropFilter: 'blur(12px)',
                        padding: '48px 32px',
                        borderRight: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    <img
                        src="/duyanan_logo.png"
                        alt="Duyanan Logo"
                        style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '50%', boxShadow: '0 8px 40px rgba(0,0,0,0.6)', marginBottom: '24px' }}
                    />
                    <h3 style={{ color: '#fff', fontWeight: 800, textAlign: 'center', textShadow: '0 2px 8px rgba(0,0,0,0.5)', marginBottom: '10px' }}>
                        Tuloy po kayo!
                    </h3>
                    <p style={{ color: 'rgba(255,200,120,0.85)', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        Experience authentic Filipino cuisine at Duyanan.
                    </p>
                </div>

                {/* Right — Form Panel */}
                <div
                    className="flex-grow-1 d-flex flex-column justify-content-center"
                    style={{
                        background: 'rgba(255,255,255,0.10)',
                        backdropFilter: 'blur(28px) saturate(200%)',
                        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
                        padding: '48px 44px',
                    }}
                >
                    <h2 className="fw-bold mb-1" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                        Welcome Back 👋
                    </h2>
                    <p className="mb-4" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem' }}>
                        Log in to your Duyanan account
                    </p>

                    <form onSubmit={handleSubmit}>
                        {/* Email */}
                        <div className="mb-3 position-relative">
                            <i className="bi bi-envelope position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', zIndex: 1 }}></i>
                            <input
                                type="email"
                                className="form-control input-auth ps-5"
                                placeholder="Email Address"
                                name="email"
                                value={credentials.email}
                                onChange={handleChange}
                                required
                                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '12px' }}
                            />
                        </div>

                        {/* Password */}
                        <div className="mb-3 position-relative">
                            <i className="bi bi-lock position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', zIndex: 1 }}></i>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="form-control input-auth ps-5 pe-5"
                                placeholder="Password"
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                required
                                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '12px' }}
                            />
                            <i
                                className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} position-absolute`}
                                onClick={() => setShowPassword(p => !p)}
                                style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', zIndex: 1 }}
                            ></i>
                        </div>

                        {/* Remember + Forgot */}
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id="rememberMe"
                                    name="rememberMe"
                                    checked={credentials.rememberMe}
                                    onChange={handleChange}
                                />
                                <label className="form-check-label small" htmlFor="rememberMe" style={{ color: 'rgba(255,255,255,0.7)' }}>
                                    Remember Me
                                </label>
                            </div>
                            <span
                                onClick={handleForgotPassword}
                                className="text-decoration-none small"
                                style={{ color: 'rgba(255,200,120,0.9)', cursor: 'pointer', transition: 'color 0.2s' }}
                                onMouseEnter={(e) => e.target.style.color = '#ffcc80'}
                                onMouseLeave={(e) => e.target.style.color = 'rgba(255,200,120,0.9)'}
                            >
                                Forgot Password?
                            </span>
                        </div>

                        {loginError && (
                            <div
                                className="mb-3 d-flex align-items-center gap-2"
                                style={{
                                    background: 'rgba(220,53,69,0.18)',
                                    border: '1px solid rgba(220,53,69,0.4)',
                                    borderRadius: '10px',
                                    padding: '10px 14px',
                                    color: '#ffaaaa',
                                    fontSize: '0.85rem',
                                }}
                            >
                                <i className="bi bi-exclamation-circle-fill"></i>
                                <span>{loginError}</span>
                            </div>
                        )}
                        <button
                            type="submit"
                            className="btn-brand w-100"
                            style={{ borderRadius: '50px', padding: '13px' }}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Logging in...</>
                                : 'Login Now'
                            }
                        </button>
                    </form>

                    {/* Social */}
                    <div className="mt-4 text-center">
                        <p className="small mb-3" style={{ color: 'rgba(255,255,255,0.45)' }}>Or continue with</p>
                        <div className="d-flex justify-content-center gap-3 mb-4">
                            <button type="button" onClick={() => handleSocialLogin('Google')} className="social-login-btn social-google border-0 bg-transparent p-0"><i className="bi bi-google"></i></button>
                            <button type="button" onClick={() => handleSocialLogin('Facebook')} className="social-login-btn social-facebook border-0 bg-transparent p-0"><i className="bi bi-facebook"></i></button>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '16px' }}>
                            <span className="small" style={{ color: 'rgba(255,255,255,0.55)' }}>Don't have an account? </span>
                            <Link to="/register" className="text-decoration-none fw-bold small" style={{ color: 'rgba(255,200,120,0.9)' }}>Sign Up</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

