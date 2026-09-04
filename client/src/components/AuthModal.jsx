import React, { useState } from 'react';
import {
  X, Mail, Lock, User, Phone, CheckCircle2,
  AlertCircle, ArrowRight, Camera, UserPlus, LogIn, Sparkles, ShieldCheck, Key
} from 'lucide-react';
import { SERVER_URL } from '../utils/apiUrl';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
];

export default function AuthModal({ isOpen, onClose, onAuthSuccess, onSuccess, initialTab = 'signup' }) {
  const [tab, setTab] = useState(initialTab); // 'login' | 'signup'

  const notifySuccess = (user) => {
    if (typeof onAuthSuccess === 'function') onAuthSuccess(user);
    if (typeof onSuccess === 'function') onSuccess(user);
  };

  // Signup fields
  const [name, setName] = useState('');
  const [gender, setGender] = useState('Male');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [favoriteGenre, setFavoriteGenre] = useState('Sci-Fi');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // OTP Verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  // Status & errors
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Request Email OTP
  const handleSendOtp = async () => {
    setError('');
    setSuccessMsg('');
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Failed to send OTP.');
        return;
      }

      setOtpSent(true);
      setSuccessMsg(`Verification code sent to ${email}`);
    } catch (err) {
      setLoading(false);
      setError('Network error while requesting OTP.');
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setError('');
    if (!otpCode || otpCode.length < 4) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Invalid OTP code.');
        return;
      }

      setOtpVerified(true);
      setSuccessMsg('Email verified successfully.');
    } catch (err) {
      setLoading(false);
      setError('Error verifying OTP.');
    }
  };

  // Sign Up Submission
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!name.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setError('Please enter a valid email.');
    if (!password || password.length < 6) return setError('Password must be at least 6 characters.');
    if (!otpSent) return setError('Please request and verify Email OTP first.');
    if (!otpCode) return setError('Please enter your 6-digit Email OTP.');

    setLoading(true);
    try {
      const finalAvatar = customAvatarUrl.trim() || avatar;
      const res = await fetch(`${SERVER_URL}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          gender,
          phone: phone.trim(),
          dob,
          favoriteGenre,
          bio: bio.trim(),
          avatar: finalAvatar,
          email: email.trim(),
          password,
          otp: otpCode.trim()
        })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Signup failed.');
        return;
      }

      localStorage.setItem('cypr_user_account', JSON.stringify(data.user));
      localStorage.setItem('cypr_user_name', data.user.name);
      notifySuccess(data.user);
      onClose();
    } catch (err) {
      console.error('Registration error:', err);
      setLoading(false);
      setError(err?.message || 'Network error during registration.');
    }
  };

  // Login Submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setError(data.error || 'Login failed.');
        return;
      }

      localStorage.setItem('cypr_user_account', JSON.stringify(data.user));
      localStorage.setItem('cypr_user_name', data.user.name);
      notifySuccess(data.user);
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setLoading(false);
      setError(err?.message || 'Network error during login.');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(5, 5, 7, 0.85)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%', maxWidth: '440px',
        background: '#09090b', border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px', padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)',
        position: 'relative', maxHeight: '90vh', overflowY: 'auto',
        color: '#f4f4f5'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '18px', right: '18px',
            background: 'transparent', border: 'none',
            color: '#71717a', borderRadius: '50%',
            width: '30px', height: '30px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'color 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
        >
          <X size={18} />
        </button>

        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src="/viam_logo.png" alt="VIAM" style={{ height: '56px', width: 'auto', marginBottom: '8px', objectFit: 'contain' }} />
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
            {tab === 'signup' ? 'Create Account' : 'Welcome Back'}
          </h2>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
          background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '4px', borderRadius: '12px', marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(''); setSuccessMsg(''); }}
            style={{
              height: '38px', borderRadius: '9px', border: 'none',
              background: tab === 'signup' ? '#ff5500' : 'transparent',
              color: tab === 'signup' ? '#ffffff' : '#a1a1aa',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: tab === 'signup' ? '0 0 14px rgba(255,85,0,0.3)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <UserPlus size={14} />
            <span>Create Account</span>
          </button>
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            style={{
              height: '38px', borderRadius: '9px', border: 'none',
              background: tab === 'login' ? '#ff5500' : 'transparent',
              color: tab === 'login' ? '#ffffff' : '#a1a1aa',
              fontWeight: '700', fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: tab === 'login' ? '0 0 14px rgba(255,85,0,0.3)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '10px', padding: '10px 12px', marginBottom: '16px',
            color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)',
            borderRadius: '10px', padding: '10px 12px', marginBottom: '16px',
            color: '#4ade80', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <CheckCircle2 size={15} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SIGN UP FORM */}
        {tab === 'signup' && (
          <form onSubmit={handleSignUpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            
            {/* Minimal Profile Photo Area */}
            <div style={{ textAlign: 'center', marginBottom: '4px' }}>
              <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 8px' }}>
                <img
                  src={customAvatarUrl.trim() || avatar}
                  alt="Profile Avatar"
                  style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    objectFit: 'cover', border: '2px solid #27272a',
                    background: '#141417'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                  }}
                />
                <label
                  title="Edit Photo"
                  style={{
                    position: 'absolute', bottom: '0', right: '0',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: '#27272a', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', border: '2px solid #09090b'
                  }}
                >
                  <Camera size={12} />
                </label>
              </div>

              <input
                type="text"
                style={{
                  width: '100%', height: '34px', fontSize: '11px',
                  borderRadius: '8px', padding: '0 10px', textAlign: 'center',
                  background: '#141417', border: '1px solid #27272a',
                  color: '#a1a1aa', outline: 'none'
                }}
                placeholder="Paste avatar URL (optional)"
                value={customAvatarUrl}
                onChange={(e) => setCustomAvatarUrl(e.target.value)}
              />
            </div>

            {/* FULL NAME */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  style={{
                    width: '100%', height: '42px', background: '#141417',
                    border: '1px solid #27272a', borderRadius: '10px',
                    paddingLeft: '38px', paddingRight: '14px', fontSize: '14px',
                    color: '#fff', outline: 'none'
                  }}
                  placeholder="e.g. Vineet Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              </div>
            </div>

            {/* Gender & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: '100%', height: '42px', background: '#141417',
                    border: '1px solid #27272a', borderRadius: '10px',
                    padding: '0 10px', color: '#fff', fontSize: '13px', outline: 'none'
                  }}
                >
                  <option value="Male" style={{ background: '#141417' }}>Male</option>
                  <option value="Female" style={{ background: '#141417' }}>Female</option>
                  <option value="Non-binary" style={{ background: '#141417' }}>Non-binary</option>
                  <option value="Other" style={{ background: '#141417' }}>Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Phone Number
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    style={{
                      width: '100%', height: '42px', background: '#141417',
                      border: '1px solid #27272a', borderRadius: '10px',
                      paddingLeft: '34px', paddingRight: '10px', fontSize: '13px',
                      color: '#fff', outline: 'none'
                    }}
                    placeholder="+91 9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Phone size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                </div>
              </div>
            </div>

            {/* DOB & Favourite Genre */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  style={{
                    width: '100%', height: '42px', background: '#141417',
                    border: '1px solid #27272a', borderRadius: '10px',
                    padding: '0 10px', color: '#fff', fontSize: '13px',
                    outline: 'none', colorScheme: 'dark', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Favourite Genre
                </label>
                <select
                  value={favoriteGenre}
                  onChange={(e) => setFavoriteGenre(e.target.value)}
                  style={{
                    width: '100%', height: '42px', background: '#141417',
                    border: '1px solid #27272a', borderRadius: '10px',
                    padding: '0 10px', color: '#fff', fontSize: '13px', outline: 'none'
                  }}
                >
                  {['Action', 'Sci-Fi', 'Romance', 'Horror', 'Comedy', 'Thriller', 'Anime', 'Drama', 'Documentary', 'Fantasy'].map(g => (
                    <option key={g} value={g} style={{ background: '#141417' }}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Short Bio (optional)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell your co-watch partner about yourself..."
                rows={2}
                style={{
                  width: '100%', background: '#141417', border: '1px solid #27272a',
                  borderRadius: '10px', padding: '10px 14px', color: '#fff',
                  fontSize: '13px', outline: 'none', resize: 'none',
                  lineHeight: '1.5', boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Email & OTP */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Email Address *
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="email"
                    style={{
                      width: '100%', height: '42px', background: '#141417',
                      border: '1px solid #27272a', borderRadius: '10px',
                      paddingLeft: '38px', paddingRight: '14px', fontSize: '13px',
                      color: '#fff', outline: 'none'
                    }}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  style={{
                    height: '42px', background: '#27272a', border: 'none',
                    color: '#fff', borderRadius: '10px', padding: '0 14px',
                    fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                    whiteSpace: 'nowrap', flexShrink: 0, transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#3f3f46'}
                  onMouseLeave={e => e.currentTarget.style.background = '#27272a'}
                >
                  {otpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
            </div>

            {/* OTP Entry */}
            {otpSent && (
              <div style={{ background: '#141417', border: '1px solid #27272a', padding: '12px', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase' }}>6-Digit OTP</label>
                  <span style={{ fontSize: '10px', color: '#71717a' }}>Check inbox</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    style={{
                      flex: 1, height: '38px', background: '#09090b',
                      border: '1px solid #27272a', borderRadius: '8px',
                      textTransform: 'uppercase', letterSpacing: '4px', fontWeight: '700',
                      fontSize: '15px', textAlign: 'center', color: '#ff5500', outline: 'none'
                    }}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading || otpVerified}
                    style={{
                      height: '38px', background: otpVerified ? '#22c55e' : '#ff5500',
                      border: 'none', color: '#fff', borderRadius: '8px',
                      padding: '0 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                    }}
                  >
                    {otpVerified ? 'Verified ✓' : 'Verify'}
                  </button>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  style={{
                    width: '100%', height: '42px', background: '#141417',
                    border: '1px solid #27272a', borderRadius: '10px',
                    paddingLeft: '38px', paddingRight: '14px', fontSize: '14px',
                    color: '#fff', outline: 'none'
                  }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '44px', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600', color: '#fff',
                background: '#ff5500', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginTop: '6px', transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span>{loading ? 'Creating Account...' : 'Complete Sign Up'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        {/* LOG IN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  style={{
                    width: '100%', height: '42px', background: '#141417',
                    border: '1px solid #27272a', borderRadius: '10px',
                    paddingLeft: '38px', paddingRight: '14px', fontSize: '14px',
                    color: '#fff', outline: 'none'
                  }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  style={{
                    width: '100%', height: '42px', background: '#141417',
                    border: '1px solid #27272a', borderRadius: '10px',
                    paddingLeft: '38px', paddingRight: '14px', fontSize: '14px',
                    color: '#fff', outline: 'none'
                  }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: '44px', borderRadius: '10px',
                fontSize: '14px', fontWeight: '600', color: '#fff',
                background: '#ff5500', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                marginTop: '6px', transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={15} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
