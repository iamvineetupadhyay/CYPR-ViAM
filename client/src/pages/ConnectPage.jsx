import React, { useState, useEffect } from 'react';
import {
  Heart,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  Play,
  Pause,
  Video,
  Shield,
  Zap,
  MessageSquare,
  Film,
  Users,
  ChevronDown,
  Lock,
  Tv,
  Mic,
  Volume2,
  Star,
  X,
  Flame,
  Radio,
  ExternalLink,
  User,
  LogOut,
  CheckCircle2,
  Globe,
  Smile,
  ShieldCheck,
  Award,
  Grid,
  CreditCard,
  Rss,
  Clock,
  Phone,
  Moon,
  Send,
  HelpCircle,
  TrendingUp,
  Cpu,
  Monitor
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import ProfileModal from '../components/ProfileModal';
import HeaderProfileMenu from '../components/HeaderProfileMenu';
import RoomModal from '../components/RoomModal';

function generateCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `viam-${code}`;
}

export default function ConnectPage({ onConnect, onOpenProfile }) {
  const [userAccount, setUserAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('cypr_user_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [name, setName] = useState(userAccount?.name || localStorage.getItem('cypr_user_name') || '');
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  // Auth & Room Modal States
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signup'); // 'signup' | 'login'
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomModalMode, setRoomModalMode] = useState('create');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const openCreateRoom = () => {
    if (!userAccount) {
      setAuthTab('signup');
      setAuthModalOpen(true);
      return;
    }
    setRoomModalMode('create');
    setRoomModalOpen(true);
  };

  const openJoinRoom = () => {
    setRoomModalMode('join');
    setRoomModalOpen(true);
  };

  const handleAuthSuccess = (user) => {
    if (!user) return;
    setUserAccount(user);
    setName(user.name);
    localStorage.setItem('cypr_user_name', user.name);
    localStorage.setItem('cypr_user_account', JSON.stringify(user));
    setAuthModalOpen(false);
    setRoomModalMode('create');
    setRoomModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('cypr_user_account');
    setUserAccount(null);
  };

  // Interactive Sandbox States
  const [presetIndex, setPresetIndex] = useState(0);
  const [isSimPlaying, setIsSimPlaying] = useState(true);
  const [simProgress, setSimProgress] = useState(35);
  const [syncToast, setSyncToast] = useState(null);
  const [burstParticles, setBurstParticles] = useState([]);

  const presets = [
    { title: 'Sci-Fi Cyberpunk Date', time: '14:20', bgGrad: 'radial-gradient(circle at center, rgba(255,85,0,0.35) 0%, rgba(11,8,6,0.95) 80%)' },
    { title: 'Chill Anime Night', time: '28:45', bgGrad: 'radial-gradient(circle at center, rgba(128,0,255,0.35) 0%, rgba(11,8,6,0.95) 80%)' },
    { title: 'Midnight Cinema Lounge', time: '08:12', bgGrad: 'radial-gradient(circle at center, rgba(0,245,212,0.35) 0%, rgba(11,8,6,0.95) 80%)' }
  ];

  useEffect(() => {
    if (!isSimPlaying) return;
    const interval = setInterval(() => {
      setSimProgress((prev) => (prev >= 98 ? 0 : prev + 0.4));
    }, 400);
    return () => clearInterval(interval);
  }, [isSimPlaying]);

  const triggerEmojiBurst = (e, emojiStr) => {
    // Generate 22 particles that scatter & float across the FULL SCREEN VIEWPORT!
    const newParticles = Array.from({ length: 22 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji: emojiStr,
      left: Math.random() * 92 + 4, // 4% to 96% screen width
      startBottom: Math.random() * 15, // starts near bottom of viewport
      size: Math.floor(Math.random() * 24 + 30), // 30px to 54px emoji size
      duration: (Math.random() * 1.5 + 2.0).toFixed(2), // 2.0s to 3.5s flight time
      delay: (Math.random() * 0.45).toFixed(2),
      driftX: Math.floor(Math.random() * 140 - 70) // horizontal drift
    }));
    setBurstParticles((prev) => [...prev.slice(-40), ...newParticles]);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter your name');
    localStorage.setItem('cypr_user_name', name.trim());
    onConnect({ roomId: myCode, name: name.trim() });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Please enter your name');
    if (!roomCode.trim()) return alert('Please enter a 6-character room code');
    localStorage.setItem('cypr_user_name', name.trim());
    onConnect({ roomId: roomCode.trim().toUpperCase(), name: name.trim() });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      q: 'Is CYPR ViAM completely free to use?',
      a: 'Yes, 100% free forever! There are no hidden subscription fees, time limits, or ad interruptions during your co-watching sessions.'
    },
    {
      q: 'Do both partners need to create an account?',
      a: 'One partner can create a room code or log in via OTP, and the second partner can simply join using the 6-character room code in seconds!'
    },
    {
      q: 'How does the video synchronization work?',
      a: 'CYPR ViAM uses high-precision microsecond WebSocket sync signals. When one partner clicks play, pause, or seeks the timeline, the action is synchronized instantly with zero latency.'
    },
    {
      q: 'Is our video call and chat end-to-end encrypted?',
      a: 'Absolutely. All video calling streams use direct WebRTC peer-to-peer mesh architecture, and text messages are encrypted on your browser using AES-GCM-256 cryptography.'
    },
    {
      q: 'What video sources can we co-watch?',
      a: 'You can stream YouTube videos, direct MP4/WebM video URLs, or custom media links seamlessly inside your private lounge.'
    }
  ];

  return (
    <div className="landing-container" style={{ background: '#0b0806', color: '#fff', minHeight: '100vh', overflowX: 'hidden', fontFamily: 'Plus Jakarta Sans, sans-serif', position: 'relative' }}>

      {/* Full-Screen Floating Emoji Fireworks Particles Layer */}
      {burstParticles.map((p) => (
        <span
          key={p.id}
          className="fullscreen-emoji-particle"
          style={{
            left: `${p.left}%`,
            bottom: `${p.startBottom}%`,
            fontSize: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            '--drift-x': `${p.driftX}px`
          }}
        >
          {p.emoji}
        </span>
      ))}

      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (CLEAN & 100% CO-WATCHING RELEVANT NAV LINKS) */}
      {/* ========================================================================= */}
      <header style={{
        height: '70px', width: '100%', padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 1000,
        background: 'rgba(9, 9, 11, 0.92)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Left: Brand Logo + Security Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <img src="/viam_logo.png" alt="CYPR ViAM" className="viam-logo-animated" style={{ height: '62px', width: 'auto', objectFit: 'contain' }} />
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', fontSize: '11px', fontWeight: '600',
            background: '#141417', border: '1px solid #27272a', borderRadius: '20px',
            color: '#a1a1aa', marginLeft: '6px'
          }} title="AES-GCM-256 E2EE Privacy">
            <Lock size={11} color="#22c55e" />
            <span style={{ color: '#d4d4d8' }}>256-bit Encrypted</span>
          </span>
        </div>

        {/* Center: Minimal Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <a href="#sandbox" style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: '500', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
            Sandbox
          </a>
          <a href="#features" style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: '500', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
            Features
          </a>
          <a href="#why-cypr" style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: '500', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
            Security
          </a>
          <a href="#how-it-works" style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: '500', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
            How It Works
          </a>
          <a href="#faq" style={{ color: '#a1a1aa', fontSize: '13px', fontWeight: '500', textDecoration: 'none', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#a1a1aa'}>
            FAQ
          </a>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {userAccount ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={openCreateRoom}
                style={{
                  background: '#ff5500', border: 'none', color: '#fff',
                  fontSize: '12px', fontWeight: '700', padding: '7px 14px',
                  borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                  boxShadow: '0 0 14px rgba(255,85,0,0.3)'
                }}
              >
                <Sparkles size={13} />
                <span>Create Room</span>
              </button>
              <button
                onClick={openJoinRoom}
                style={{
                  background: '#141417', border: '1px solid #27272a',
                  color: '#a1a1aa', fontSize: '12px', fontWeight: '600', padding: '7px 12px',
                  borderRadius: '8px', cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ff5500'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = '#27272a'; }}
              >
                Join with Code
              </button>
              <HeaderProfileMenu
                userAccount={userAccount}
                onOpenProfile={onOpenProfile}
                onOpenHistory={onOpenProfile}
                onLogout={handleLogout}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={openJoinRoom}
                style={{
                  background: 'transparent', border: '1px solid #27272a',
                  color: '#a1a1aa', fontSize: '13px', fontWeight: '600', padding: '8px 14px',
                  borderRadius: '8px', cursor: 'pointer', transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ff5500'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = '#27272a'; }}
              >
                Join Room
              </button>
              <button
                onClick={() => { setAuthTab('login'); setAuthModalOpen(true); }}
                style={{
                  background: '#141417', border: '1px solid #27272a',
                  color: '#fff', fontSize: '13px', fontWeight: '600', padding: '8px 16px',
                  borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#27272a'}
                onMouseLeave={e => e.currentTarget.style.background = '#141417'}
              >
                Sign In
              </button>
              <button
                onClick={() => { setAuthTab('signup'); setAuthModalOpen(true); }}
                style={{
                  background: '#ff5500', border: 'none', color: '#fff', fontSize: '13px',
                  fontWeight: '600', padding: '8px 18px', borderRadius: '8px', cursor: 'pointer',
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FULL HERO SECTION */}
      {/* ========================================================================= */}
      <section style={{
        position: 'relative',
        minHeight: 'calc(100vh - 76px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 64px',
        overflow: 'hidden'
      }}>

        {/* FULL BACKGROUND VIDEO & ANIMATED MESH LAYER */}
        <video
          src="/hero_story.mp4"
          autoPlay
          loop
          muted
          playsInline
          onError={(e) => { e.currentTarget.src = '/A_widescreen_D_flat_vect.mp4'; }}
          style={{
            position: 'absolute', top: 0, right: 0,
            width: '65%', height: '100%',
            objectFit: 'cover', zIndex: 1,
            opacity: 0.45,
            maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)'
          }}
        />

        {/* Dark Vignette Overlay */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: 'linear-gradient(90deg, #0b0806 0%, #0b0806 40%, rgba(11,8,6,0.7) 70%, transparent 100%)'
        }} />

        {/* LEFT COLUMN CONTENT */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '680px', textAlign: 'left' }}>
          <h1 style={{
            fontSize: '64px', fontWeight: '900', fontFamily: 'Outfit, sans-serif',
            lineHeight: '1.08', letterSpacing: '-1px', marginBottom: '24px', color: '#fff'
          }}>
            The Private Digital <br />
            Lounge For Couples <br />
            <span style={{ color: '#ff5500' }}>Co-Watching</span>
          </h1>

          <p style={{
            fontSize: '16.5px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.65',
            marginBottom: '36px', maxWidth: '560px'
          }}>
            Advanced zero-latency frame sync, real-time WebRTC video calls, private AES-256 client encryption, and live love reactions for couples who demand the highest standards of digital togetherness.
          </p>

          {/* Action Buttons: Explicit Create and Join */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={openCreateRoom}
              style={{
                background: '#ff5500', border: 'none', color: '#fff',
                fontSize: '15px', fontWeight: '700', padding: '14px 28px',
                borderRadius: '12px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '8px', boxShadow: '0 0 25px rgba(255,85,0,0.5)',
                transition: 'transform 0.15s, opacity 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '0.95'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.opacity = '1'; }}
            >
              <Sparkles size={16} />
              <span>Create Private Room</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={openJoinRoom}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.18)',
                color: '#fff', fontSize: '15px', fontWeight: '700', padding: '14px 24px',
                borderRadius: '12px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '8px', backdropFilter: 'blur(8px)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,85,0,0.15)'; e.currentTarget.style.borderColor = '#ff5500'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            >
              <Users size={16} color="#ff5500" />
              <span>Join with Code</span>
            </button>

            <a
              href="#how-it-works"
              style={{
                background: '#141417', border: '1px solid #27272a',
                color: '#a1a1aa', fontSize: '14px', fontWeight: '600', padding: '13px 20px',
                borderRadius: '12px', textDecoration: 'none', display: 'inline-flex',
                alignItems: 'center', gap: '8px', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#52525b'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#a1a1aa'; e.currentTarget.style.borderColor = '#27272a'; }}
            >
              How It Works
            </a>
          </div>

          {/* Clean Vector Feature Indicators */}
          <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a1a1aa', background: '#141417', border: '1px solid #27272a', padding: '6px 12px', borderRadius: '8px' }}>
              <Lock size={13} color="#ff5500" />
              <span>AES-256 Encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a1a1aa', background: '#141417', border: '1px solid #27272a', padding: '6px 12px', borderRadius: '8px' }}>
              <Zap size={13} color="#ff5500" />
              <span>0ms Frame Sync</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a1a1aa', background: '#141417', border: '1px solid #27272a', padding: '6px 12px', borderRadius: '8px' }}>
              <Video size={13} color="#ff5500" />
              <span>HD WebRTC Calls</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 ELEGANT HAND-DRAWN COUPLE SKETCH FEATURE BANNER */}
      {/* ========================================================================= */}
      <section style={{ padding: '40px 64px 80px', maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(18, 14, 11, 0.85)',
          border: '1.5px solid rgba(255, 85, 0, 0.35)',
          borderRadius: '32px',
          padding: '44px 52px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr',
          gap: '48px',
          alignItems: 'center',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 85, 0, 0.15)'
        }}>
          {/* Left: Hand-Drawn Sketch Illustration (Clean White Backdrop) */}
          <div style={{
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#ffffff', borderRadius: '24px', padding: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(255, 85, 0, 0.25)',
            border: '2px solid rgba(255, 85, 0, 0.4)'
          }}>
            <img
              src="/couple_couch_sketch_clean.png"
              alt="Couple Co-Watching Story Sketch"
              style={{
                width: '100%',
                maxHeight: '360px',
                objectFit: 'contain',
                borderRadius: '16px'
              }}
            />
          </div>

          {/* Right: Feature Content */}
          <div>
            <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              CRAFTED FOR PRIVATE MOVIE DATES
            </span>
            <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '12px 0 16px', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif' }}>
              Feel Like You're Sitting Next to Each Other
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.72)', lineHeight: 1.6, marginBottom: '24px' }}>
              Whether you're miles apart or in different cities, CYPR ViAM recreates the intimacy of a cozy couch movie date with 0ms frame-accurate playback, floating WebRTC video feeds, and synchronized love reactions.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 85, 0, 0.12)', border: '1px solid rgba(255, 85, 0, 0.3)', padding: '8px 16px', borderRadius: '16px', fontSize: '12.5px', fontWeight: '800', color: '#ff5500' }}>
                <Tv size={15} /> 0ms Frame Sync
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 16px', borderRadius: '16px', fontSize: '12.5px', fontWeight: '800', color: '#10b981' }}>
                <ShieldCheck size={15} /> AES-256 E2EE Private
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 245, 212, 0.12)', border: '1px solid rgba(0, 245, 212, 0.3)', padding: '8px 16px', borderRadius: '16px', fontSize: '12.5px', fontWeight: '800', color: '#00f5d4' }}>
                <Sparkles size={15} /> HD Video Calls
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE SANDBOX SIMULATOR (#sandbox) */}
      {/* ========================================================================= */}
      <section id="sandbox" style={{ padding: '80px 64px', maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>TRY LIVE DEMO SIMULATOR</span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif' }}>
            Interactive Co-Watching Lounge Sandbox
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', maxWidth: '640px', margin: '0 auto' }}>
            Test 0ms frame sync, floating WebRTC partner video feeds, and instant love reactions live right now!
          </p>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setPresetIndex(idx)}
              style={{
                background: presetIndex === idx ? '#ff5500' : 'rgba(255,255,255,0.06)',
                border: '1px solid ' + (presetIndex === idx ? '#ff5500' : 'rgba(255,255,255,0.12)'),
                color: '#fff', fontSize: '13px', fontWeight: '700',
                padding: '8px 20px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* Sandbox Video Stage Container */}
        <div style={{
          width: '100%', height: '480px', borderRadius: '28px',
          border: '1.5px solid rgba(255,85,0,0.4)',
          background: presets[presetIndex].bgGrad,
          position: 'relative', overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 50px rgba(255,85,0,0.2)',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px'
        }}>
          {/* Top Stage Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.6)', padding: '6px 16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)' }}>
              <span className="online-dot" />
              <span style={{ fontSize: '13px', fontWeight: '800' }}>{presets[presetIndex].title}</span>
              <span style={{ fontSize: '11px', color: '#00f5d4', fontFamily: 'monospace' }}>0 ms SYNC</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ fontSize: '12px', background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '5px 12px', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.3)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheck size={13} /> AES-256 E2EE ACTIVE
              </span>
            </div>
          </div>

          {/* Center Movie Visual & Partner Webcams Overlay */}
          <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', margin: '0 auto' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(255,85,0,0.15)', border: '1px solid rgba(255,85,0,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 12px', color: '#ff5500', boxShadow: '0 0 25px rgba(255,85,0,0.3)'
            }}>
              <Film size={34} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>
              Synchronized Playback Stream Active
            </div>
          </div>

          {/* Floating Partner Webcams (Bottom Right Overlay) */}
          <div style={{ position: 'absolute', bottom: '80px', right: '24px', zIndex: 20, display: 'flex', gap: '12px' }}>
            <div style={{ width: '100px', height: '70px', borderRadius: '14px', border: '2px solid #ff5500', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.8)', position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" alt="Partner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '4px', left: '4px', fontSize: '9px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 5px', borderRadius: '6px', fontWeight: '800' }}>Partner</span>
            </div>
            <div style={{ width: '100px', height: '70px', borderRadius: '14px', border: '2px solid #00f5d4', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.8)', position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80" alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '4px', left: '4px', fontSize: '9px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 5px', borderRadius: '6px', fontWeight: '800' }}>You</span>
            </div>
          </div>

          {/* Bottom Scrubber Controls */}
          <div style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)', padding: '12px 20px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 10 }}>
            <button onClick={() => setIsSimPlaying(!isSimPlaying)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#ff5500', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {isSimPlaying ? <Pause size={16} /> : <Play size={16} fill="#fff" style={{ marginLeft: '2px' }} />}
            </button>
            <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', position: 'relative' }}>
              <div style={{ width: `${simProgress}%`, height: '100%', background: 'linear-gradient(90deg, #ff5500, #8000ff)', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)' }}>
              {presets[presetIndex].time}
            </span>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. FEATURE SHOWCASE GRID (#features) */}
      {/* ========================================================================= */}
      <section id="features" style={{ padding: '80px 64px', maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>ENGINEERED FOR TOGETHERNESS</span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif' }}>
            Built Specifically For Long Distance Couples
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', maxWidth: '600px', margin: '0 auto' }}>
            Everything you need for romantic movie dates without latency, desync, or privacy concerns.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,85,0,0.3)', borderRadius: '24px', padding: '32px' }}>
            <Film size={28} color="#ff5500" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>0ms Latency Frame Sync</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Stream YouTube or direct MP4 links with 100% exact sub-millisecond playback synchronization across both devices.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(128,0,255,0.3)', borderRadius: '24px', padding: '32px' }}>
            <Video size={28} color="#8000ff" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>Duo WebRTC Video Calling</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Picture-in-picture floating webcam overlays with instant mic and camera toggles right over the movie player.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '24px', padding: '32px' }}>
            <ShieldCheck size={28} color="#10b981" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>AES-256 E2EE Cryptography</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Zero-knowledge client-side encryption. Nobody outside your room can access your chat, video call, or media stream.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,245,212,0.3)', borderRadius: '24px', padding: '32px' }}>
            <Heart size={28} color="#00f5d4" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>Live Floating Love Reactions</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Send romantic emoji particle bursts (`💖🍿🔥✨🥰🎉`) that float live across your partner's video player.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,209,102,0.3)', borderRadius: '24px', padding: '32px' }}>
            <MessageSquare size={28} color="#ffd166" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>Private Encrypted Chat &amp; Voice Notes</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Instant private text messaging with ephemeral auto-expiring logs and voice note feedback support.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: '24px', padding: '32px' }}>
            <Globe size={28} color="#f43f5e" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>100% Free &amp; Cross-Platform</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Works seamlessly across desktop browsers, laptops, tablets, and smartphones with zero app downloads needed.</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHY CYPR COMPARISON TABLE (#why-cypr) */}
      {/* ========================================================================= */}
      <section id="why-cypr" style={{ padding: '80px 64px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>THE CLEAR WINNER</span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif' }}>
            Why CYPR Outperforms Other Platforms
          </h2>
        </div>

        <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Feature Comparison</th>
                <th style={{ padding: '16px', fontSize: '16px', color: '#ff5500', fontWeight: '800' }}>CYPR ViAM</th>
                <th style={{ padding: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Discord / Zoom</th>
                <th style={{ padding: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Teleparty / Rave</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px', fontWeight: '700' }}>0ms Latency Frame Sync</td>
                <td style={{ padding: '16px', color: '#10b981', fontWeight: '800' }}>✓ 100% Perfect</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ Screen Lag / Choppy</td>
                <td style={{ padding: '16px', color: '#f59e0b' }}>⚠️ Often Desynced</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px', fontWeight: '700' }}>Integrated HD WebRTC Video Call</td>
                <td style={{ padding: '16px', color: '#10b981', fontWeight: '800' }}>✓ Built-In Duo Cams</td>
                <td style={{ padding: '16px', color: '#10b981' }}>✓ Built-In</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ No Video Calling</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px', fontWeight: '700' }}>AES-256 E2EE Cryptography</td>
                <td style={{ padding: '16px', color: '#10b981', fontWeight: '800' }}>✓ Client-Side E2EE</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ Server Monitored</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ Unencrypted</td>
              </tr>
              <tr>
                <td style={{ padding: '16px', fontWeight: '700' }}>100% Free &amp; Zero Ads</td>
                <td style={{ padding: '16px', color: '#10b981', fontWeight: '800' }}>✓ Free Forever</td>
                <td style={{ padding: '16px', color: '#f59e0b' }}>⚠️ Time Limits / Nitro</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ Ad-Cluttered</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. 4-STEP HOW IT WORKS JOURNEY (#how-it-works) */}
      {/* ========================================================================= */}
      <section id="how-it-works" style={{ padding: '80px 64px', maxWidth: '1360px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>FOUR EASY STEPS</span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif' }}>
            How To Start Your First Co-Watch Lounge
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,85,0,0.3)', borderRadius: '24px', padding: '28px', textAlign: 'left' }}>
            <span style={{ fontSize: '32px', fontWeight: '900', color: '#ff5500', display: 'block', marginBottom: '12px' }}>01</span>
            <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Create Room Code</h4>
            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Click Get Started to generate your private 6-character lounge passcode.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(128,0,255,0.3)', borderRadius: '24px', padding: '28px', textAlign: 'left' }}>
            <span style={{ fontSize: '32px', fontWeight: '900', color: '#8000ff', display: 'block', marginBottom: '12px' }}>02</span>
            <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Share Code With Partner</h4>
            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Send the room code to your partner so they can join instantly from any device.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(0,245,212,0.3)', borderRadius: '24px', padding: '28px', textAlign: 'left' }}>
            <span style={{ fontSize: '32px', fontWeight: '900', color: '#00f5d4', display: 'block', marginBottom: '12px' }}>03</span>
            <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Paste Movie Link</h4>
            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Paste any YouTube link or video URL into the cinema search bar.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '24px', padding: '28px', textAlign: 'left' }}>
            <span style={{ fontSize: '32px', fontWeight: '900', color: '#10b981', display: 'block', marginBottom: '12px' }}>04</span>
            <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px' }}>Enjoy Together!</h4>
            <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>Turn on WebRTC video call, chat privately, and react with live floating hearts!</p>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION) (#faq) */}
      {/* ========================================================================= */}
      <section id="faq" style={{ padding: '80px 64px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>GOT QUESTIONS?</span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif' }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => toggleFaq(idx)}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid ' + (openFaq === idx ? '#ff5500' : 'rgba(255,255,255,0.1)'),
                borderRadius: '18px', padding: '20px 24px', cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '16.5px', fontWeight: '700', color: '#fff', margin: 0 }}>{faq.q}</h4>
                <ChevronDown size={18} color="#ff5500" style={{ transform: openFaq === idx ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {openFaq === idx && (
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginTop: '14px', lineHeight: '1.6' }}>
                  {faq.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. HIGH-IMPACT BOTTOM CTA BANNER */}
      {/* ========================================================================= */}
      <section style={{ padding: '60px 64px 80px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          background: 'radial-gradient(circle at center, rgba(255,85,0,0.25) 0%, rgba(11,8,6,0.95) 80%)',
          borderRadius: '32px', border: '1.5px solid rgba(255,85,0,0.4)',
          padding: '60px 32px', textAlign: 'center',
          boxShadow: '0 30px 80px rgba(0,0,0,0.9), 0 0 60px rgba(255,85,0,0.3)'
        }}>
          <h2 style={{ fontSize: '42px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', marginBottom: '16px' }}>
            Ready To Turn Distance Into Togetherness?
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', maxWidth: '600px', margin: '0 auto 32px', lineHeight: '1.6' }}>
            Join thousands of long distance couples co-watching movies with 0ms frame sync and WebRTC video calls today.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={openCreateRoom}
              style={{
                background: '#ff5500', border: 'none', color: '#fff',
                fontSize: '16px', fontWeight: '800', padding: '16px 36px',
                borderRadius: '16px', cursor: 'pointer', boxShadow: '0 0 35px rgba(255,85,0,0.7)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Sparkles size={18} />
              <span>Create Private Room</span>
            </button>
            <button
              onClick={openJoinRoom}
              style={{
                background: 'rgba(255,255,255,0.08)', border: '1.5px solid rgba(255,255,255,0.2)',
                color: '#fff', fontSize: '16px', fontWeight: '700', padding: '16px 30px',
                borderRadius: '16px', cursor: 'pointer', backdropFilter: 'blur(10px)',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              <Users size={18} color="#ff5500" />
              <span>Join with Code</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. SLEEK FOOTER */}
      {/* ========================================================================= */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '32px 64px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#070504' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', color: '#fff' }}>CYPR</span>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>© 2026 CYPR ViAM Inc. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Tools</a>
          <a href="#sandbox" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a>
          <a href="#why-cypr" style={{ color: 'inherit', textDecoration: 'none' }}>Why CYPR?</a>
          <a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy &amp; Security</a>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 10. FLOATING BOTTOM RIGHT CHAT WIDGET BUTTON (MATCHING SCREENSHOT!) */}
      {/* ========================================================================= */}
      <div
        onClick={openCreateRoom}
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 999,
          width: '54px', height: '54px', borderRadius: '50%',
          background: '#ff5500', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 0 30px rgba(255,85,0,0.8)',
          transition: 'transform 0.2s'
        }}
        title="Create CYPR Private Lounge"
      >
        <Sparkles size={24} />
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        onSuccess={handleAuthSuccess}
        initialTab={authTab}
      />

      {/* Upgraded Room Setup & Capacity Modal */}
      <RoomModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        userAccount={userAccount}
        defaultRoomId={new URLSearchParams(window.location.search).get('room') || new URLSearchParams(window.location.search).get('join') || ''}
        initialMode={roomModalMode}
        onJoinRoom={(roomData) => {
          setRoomModalOpen(false);
          onConnect(roomData);
        }}
      />

      {/* Profile & History Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userAccount={userAccount}
        onLogout={() => {
          localStorage.removeItem('cypr_user_account');
          setUserAccount(null);
          setIsProfileOpen(false);
        }}
        onRejoinRoom={(code) => {
          const finalName = name.trim() || userAccount?.name || 'Guest User';
          onConnect?.({ name: finalName, roomId: code.toLowerCase() });
        }}
        onPlayShow={(show) => {
          const finalName = name.trim() || userAccount?.name || 'Guest User';
          onConnect?.({ name: finalName, roomId: 'cinema' });
        }}
      />
    </div>
  );
}
