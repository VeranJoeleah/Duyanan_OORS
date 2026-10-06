import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import 'bootstrap-icons/font/bootstrap-icons.css';
import duyananBg from '../assets/img/duyanan_bg.jpg';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. No token provided.');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_URL}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await response.json();

            if (response.ok) {
                setIsSuccess(true);
                Swal.fire({
                    icon: 'success',
                    title: 'Password Reset!',
                    text: data.message || 'Your password has been reset successfully.',
                    confirmButtonColor: '#c2703a',
                    background: '#1a1a2e',
                    color: '#fff',
                    timer: 4000,
                    timerProgressBar: true,
                }).then(() => {
                    navigate('/login');
                });
            } else {
                setError(data.error || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setError('Could not connect to the server. Please try again later.');
        } finally {
            setIsLoading(false);
        }
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

            {/* Glass card */}
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
                        Reset Your Password
                    </h3>
                    <p style={{ color: 'rgba(255,200,120,0.85)', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        Create a new password for your Duyanan account.
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
                    {/* Lock icon */}
                    <div className="text-center mb-3">
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(194,112,58,0.3), rgba(194,112,58,0.1))',
                            border: '2px solid rgba(194,112,58,0.4)',
                        }}>
                            <i className="bi bi-shield-lock" style={{ fontSize: '28px', color: '#c2703a' }}></i>
                        </div>
                    </div>

                    <h2 className="fw-bold mb-1 text-center" style={{ color: '#fff', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                        Set New Password
                    </h2>
                    <p className="mb-4 text-center" style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.88rem' }}>
                        Enter your new password below
                    </p>

                    {isSuccess ? (
                        <div className="text-center">
                            <div style={{
                                background: 'rgba(40,167,69,0.15)',
                                border: '1px solid rgba(40,167,69,0.4)',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px',
                            }}>
                                <i className="bi bi-check-circle-fill" style={{ fontSize: '40px', color: '#28a745' }}></i>
                                <p className="mt-3 mb-0" style={{ color: '#a8e6b0', fontSize: '0.95rem' }}>
                                    Your password has been reset successfully!<br />
                                    Redirecting to login...
                                </p>
                            </div>
                        </div>
                    ) : !token ? (
                        <div className="text-center">
                            <div style={{
                                background: 'rgba(220,53,69,0.15)',
                                border: '1px solid rgba(220,53,69,0.4)',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px',
                            }}>
                                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '40px', color: '#dc3545' }}></i>
                                <p className="mt-3 mb-0" style={{ color: '#ffaaaa', fontSize: '0.95rem' }}>
                                    Invalid reset link. Please request a new password reset from the login page.
                                </p>
                            </div>
                            <Link to="/login" className="btn-brand" style={{ borderRadius: '50px', padding: '12px 40px', textDecoration: 'none', display: 'inline-block' }}>
                                Go to Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* New Password */}
                            <div className="mb-3 position-relative">
                                <i className="bi bi-lock position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', zIndex: 1 }}></i>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="form-control input-auth ps-5 pe-5"
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '12px' }}
                                />
                                <i
                                    className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} position-absolute`}
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', zIndex: 1 }}
                                ></i>
                            </div>

                            {/* Confirm Password */}
                            <div className="mb-3 position-relative">
                                <i className="bi bi-lock-fill position-absolute" style={{ left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', zIndex: 1 }}></i>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="form-control input-auth ps-5 pe-5"
                                    placeholder="Confirm New Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', borderRadius: '12px' }}
                                />
                                <i
                                    className={`bi ${showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'} position-absolute`}
                                    onClick={() => setShowConfirmPassword(p => !p)}
                                    style={{ right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', zIndex: 1 }}
                                ></i>
                            </div>

                            {/* Password strength hints */}
                            <div className="mb-3" style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                    <i className={`bi ${newPassword.length >= 6 ? 'bi-check-circle-fill text-success' : 'bi-circle'}`} style={{ fontSize: '0.75rem' }}></i>
                                    <span style={{ color: newPassword.length >= 6 ? '#a8e6b0' : 'inherit' }}>At least 6 characters</span>
                                </div>
                                <div className="d-flex align-items-center gap-2">
                                    <i className={`bi ${newPassword && newPassword === confirmPassword ? 'bi-check-circle-fill text-success' : 'bi-circle'}`} style={{ fontSize: '0.75rem' }}></i>
                                    <span style={{ color: newPassword && newPassword === confirmPassword ? '#a8e6b0' : 'inherit' }}>Passwords match</span>
                                </div>
                            </div>

                            {error && (
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
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn-brand w-100"
                                style={{ borderRadius: '50px', padding: '13px' }}
                                disabled={isLoading}
                            >
                                {isLoading
                                    ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Resetting...</>
                                    : 'Reset Password'
                                }
                            </button>
                        </form>
                    )}

                    {/* Back to login link */}
                    {!isSuccess && (
                        <div className="mt-4 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '16px' }}>
                            <span className="small" style={{ color: 'rgba(255,255,255,0.55)' }}>Remember your password? </span>
                            <Link to="/login" className="text-decoration-none fw-bold small" style={{ color: 'rgba(255,200,120,0.9)' }}>Back to Login</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
