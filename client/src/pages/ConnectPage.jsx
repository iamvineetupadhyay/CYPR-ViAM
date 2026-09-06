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
  Clock,
  Phone,
  Moon,
  Sun,
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
import VoiceAssistant from '../components/VoiceAssistant';
import { getT } from '../utils/themeTokens';

export default function ConnectPage({
  onConnect,
  onOpenProfile,
  onToggleTheme,
  onGlobalVoiceAction,
  theme = 'dark'
}) {
  const L = theme === 'light';
  const T = getT(theme);

  const [userAccount, setUserAccount] = useState(() => {
    try {
      const saved = localStorage.getItem('cypr_user_account');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [name, setName] = useState(userAccount?.name || localStorage.getItem('cypr_user_name') || '');
  const [openFaq, setOpenFaq] = useState(null);

  const [inviteRoom] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return (params.get('room') || params.get('join') || '').trim().toLowerCase();
    } catch {
      return '';
    }
  });

  // Auth & Room Modal States (Auto-opens Signup if guest accessed an invite link without an account)
  const [authModalOpen, setAuthModalOpen] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = (params.get('room') || params.get('join') || '').trim().toLowerCase();
      const saved = localStorage.getItem('cypr_user_account');
      return Boolean(urlRoom && !saved);
    } catch {
      return false;
    }
  });
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
    if (!userAccount) {
      setAuthTab('signup');
      setAuthModalOpen(true);
      return;
    }
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

    if (inviteRoom) {
      onConnect({
        name: user.name,
        roomId: inviteRoom,
        passcode: sessionStorage.getItem(`cypr_passcode_${inviteRoom}`) || '',
        maxCapacity: 2,
        isPublic: false,
        isCreateMode: false
      });
      return;
    }

    setRoomModalMode('create');
    setRoomModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('cypr_user_account');
    setUserAccount(null);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window && text) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('[Speech Synthesis Warning]', e);
      }
    }
  };

  // Voice command intent validator on Landing/Connect Page
  const handleConnectPageVoiceAction = async (parsed) => {
    if (!parsed) return null;

    const savedAccount = userAccount || (() => {
      try { return JSON.parse(localStorage.getItem('cypr_user_account')); } catch { return null; }
    })();
    const isLoggedIn = Boolean(savedAccount && (savedAccount.email || savedAccount.name));
    const activeRoom = (sessionStorage.getItem('cypr_active_room') || '').trim();

    if (parsed.action === 'NAVIGATE' || parsed.action === 'SEARCH_AND_PLAY') {
      // 1. Guest user check: "agr user guest user h to Login and signup ko bole"
      if (!isLoggedIn) {
        const msg = "Please log in or sign up first to access this page.";
        speakText(msg);
        setAuthTab('signup');
        setAuthModalOpen(true);
        return {
          handled: true,
          success: false,
          feedback: "🔒 Pehle Login ya Signup karein! (Please Log In / Sign Up)"
        };
      }

      // If user is logged in and asks for profile: open profile drawer/page
      if (parsed.action === 'NAVIGATE' && parsed.page === 'profile') {
        const msg = "Opening User Profile";
        speakText(msg);
        if (onOpenProfile) onOpenProfile();
        else setIsProfileOpen(true);
        return { handled: true, success: true, feedback: `👤 ${msg}` };
      }

      // 2. User logged in, but room not created/joined: "agr user login h aur room nhi banaya to room banane ko bole"
      if (!activeRoom) {
        const msg = "Please create or join a room first to access this page.";
        speakText(msg);
        setRoomModalMode('create');
        setRoomModalOpen(true);
        return {
          handled: true,
          success: false,
          feedback: "🚪 Kripya pehle room banayein! (Please create a room first)"
        };
      }

      // 3. User logged in AND room created: "agr login bhi h room bhi created h to redirect kr do!!"
      return onGlobalVoiceAction?.(parsed);
    }

    if (parsed.action === 'CREATE_ROOM') {
      if (!isLoggedIn) {
        const msg = "Please log in or sign up first to create a room.";
        speakText(msg);
        setAuthTab('signup');
        setAuthModalOpen(true);
        return { handled: true, success: false, feedback: "🔒 Please Log In / Sign Up first" };
      }
      openCreateRoom();
      speakText("Opening room creation window.");
      return { handled: true, success: true, feedback: '✨ Create Room' };
    }

    if (parsed.action === 'JOIN_ROOM') {
      if (!isLoggedIn) {
        const msg = "Please log in or sign up first to join a room.";
        speakText(msg);
        setAuthTab('signup');
        setAuthModalOpen(true);
        return { handled: true, success: false, feedback: "🔒 Please Log In / Sign Up first" };
      }
      openJoinRoom();
      speakText("Opening join room window.");
      return { handled: true, success: true, feedback: '🚪 Join Room' };
    }

    if (parsed.action === 'AUTH') {
      setAuthTab(parsed.tab || 'signup');
      setAuthModalOpen(true);
      speakText(`Opening ${parsed.tab === 'login' ? 'login' : 'sign up'} window.`);
      return { handled: true, success: true, feedback: '🔑 Opening Auth...' };
    }

    // Pass through other commands (SWITCH_THEME, AI_QUERY, etc.)
    return onGlobalVoiceAction?.(parsed);
  };


  // Interactive Sandbox States
  const [presetIndex, setPresetIndex] = useState(0);
  const [isSimPlaying, setIsSimPlaying] = useState(true);
  const [simProgress, setSimProgress] = useState(35);
  const [burstParticles, setBurstParticles] = useState([]);

  const presets = [
    {
      title: 'Sci-Fi Cyberpunk Date',
      time: '14:20',
      tag: '4K Stream',
      bgGrad: L
        ? 'linear-gradient(135deg, rgba(255,85,0,0.15) 0%, rgba(255,255,255,0.95) 75%)'
        : 'radial-gradient(circle at center, rgba(255,85,0,0.35) 0%, rgba(11,8,6,0.95) 80%)'
    },
    {
      title: 'Chill Anime Night',
      time: '28:45',
      tag: 'Japanese Audio',
      bgGrad: L
        ? 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(255,255,255,0.95) 75%)'
        : 'radial-gradient(circle at center, rgba(128,0,255,0.35) 0%, rgba(11,8,6,0.95) 80%)'
    },
    {
      title: 'Midnight Cinema Lounge',
      time: '08:12',
      tag: 'Duo WebRTC Call',
      bgGrad: L
        ? 'linear-gradient(135deg, rgba(0,245,212,0.15) 0%, rgba(255,255,255,0.95) 75%)'
        : 'radial-gradient(circle at center, rgba(0,245,212,0.35) 0%, rgba(11,8,6,0.95) 80%)'
    }
  ];

  useEffect(() => {
    if (!isSimPlaying) return;
    const interval = setInterval(() => {
      setSimProgress((prev) => (prev >= 98 ? 0 : prev + 0.4));
    }, 400);
    return () => clearInterval(interval);
  }, [isSimPlaying]);

  const triggerEmojiBurst = (emojiStr) => {
    const newParticles = Array.from({ length: 22 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      emoji: emojiStr,
      left: Math.random() * 92 + 4,
      startBottom: Math.random() * 15,
      size: Math.floor(Math.random() * 24 + 28),
      duration: (Math.random() * 1.5 + 2.0).toFixed(2),
      delay: (Math.random() * 0.45).toFixed(2),
      driftX: Math.floor(Math.random() * 140 - 70)
    }));
    setBurstParticles((prev) => [...prev.slice(-40), ...newParticles]);
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
      q: 'How does video and audio stay in sync between partners?',
      a: 'CYPR ViAM utilizes microsecond WebSocket sync signals. When either partner clicks play, pause, seeks, or switches video servers, the change updates simultaneously on both screens in 0ms.'
    },
    {
      q: 'How does the 2-Hour Inactivity Cleanup rule work?',
      a: 'All chatting and room media remain permanently saved as long as members are using the room. When the last person leaves (0 members online), a 2-hour inactivity countdown starts. If someone rejoins, the timer cancels. If 2 continuous hours pass without activity, the empty room and its chats are automatically purged for total privacy.'
    },
    {
      q: 'Can the Room Host kick or throw out unwanted users?',
      a: 'Yes! Room Hosts have full administrative authority. In the dedicated Rooms page, the Host has a dedicated "Throw User" button next to each member to instantly evict them and revoke their room access.'
    },
    {
      q: 'Is our video call and chat end-to-end encrypted?',
      a: 'Absolutely. WebRTC video calls travel directly peer-to-peer between your devices, and text chat is encrypted right inside your browser using AES-GCM-256 cryptography.'
    },
    {
      q: 'What video sources can we co-watch together?',
      a: 'You can stream YouTube videos, direct MP4/WebM video links, HLS streams, or use our Neural AI Resolver by simply typing `/play <movie name>` in the chat!'
    }
  ];

  return (
    <div
      className="landing-container"
      style={{
        background: T.pageBg,
        color: T.textPrimary,
        minHeight: '100vh',
        overflowX: 'hidden',
        fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
        position: 'relative',
        transition: 'background 0.4s ease, color 0.35s ease'
      }}
    >
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
      {/* 1. TOP NAVBAR (DYNAMIC THEME COMPATIBLE + THEME TOGGLE) */}
      {/* ========================================================================= */}
      <header
        style={{
          height: '70px',
          width: '100%',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: T.headerBg,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${T.headerBorder}`,
          transition: 'background 0.4s ease, border-color 0.35s ease'
        }}
      >
        {/* Left: Brand Logo + Security Tag */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <img
            src="/viam_logo.png"
            alt="CYPR ViAM"
            className="viam-logo-animated"
            style={{ height: '58px', width: 'auto', objectFit: 'contain' }}
          />
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: '700',
              background: T.pillBg,
              border: `1px solid ${T.pillBorder}`,
              borderRadius: '20px',
              color: T.textMuted1,
              marginLeft: '4px',
              letterSpacing: '0.4px'
            }}
            title="AES-GCM-256 E2EE Cryptography Active"
          >
            <Lock size={11} color="#22c55e" />
            <span style={{ color: T.textPrimary }}>256-bit Encrypted</span>
          </span>
        </div>

        {/* Center: Minimal Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          {[
            { label: 'Sandbox', href: '#sandbox' },
            { label: 'Features', href: '#features' },
            { label: 'Security', href: '#why-cypr' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'FAQ', href: '#faq' }
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.href}
              style={{
                color: T.textMuted1,
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ff5500')}
              onMouseLeave={(e) => (e.currentTarget.style.color = T.textMuted1)}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right: Actions, Voice Assistant & Theme Toggle Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Theme Toggle Button */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              title={L ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: T.pillBg,
                border: `1px solid ${T.pillBorder}`,
                color: T.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.pillBg;
              }}
            >
              {L ? <Moon size={16} color="#6b5a44" /> : <Sun size={16} color="#ffaa00" />}
            </button>
          )}

          <VoiceAssistant onGlobalVoiceAction={handleConnectPageVoiceAction} theme={theme} showLabel={false} />

          {userAccount ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={openCreateRoom}
                style={{
                  background: '#ff5500',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  boxShadow: '0 0 16px rgba(255,85,0,0.35)'
                }}
              >
                <Sparkles size={13} />
                <span>Create Lounge</span>
              </button>
              <button
                onClick={openJoinRoom}
                style={{
                  background: T.pillBg,
                  border: `1px solid ${T.pillBorder}`,
                  color: T.textPrimary,
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '7px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff5500';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.pillBorder;
                }}
              >
                Join with Code
              </button>
              <HeaderProfileMenu
                userAccount={userAccount}
                onOpenProfile={onOpenProfile}
                onOpenHistory={onOpenProfile}
                onLogout={handleLogout}
                theme={theme}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={openJoinRoom}
                style={{
                  background: 'transparent',
                  border: `1px solid ${T.border2}`,
                  color: T.textPrimary,
                  fontSize: '12.5px',
                  fontWeight: '600',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#ff5500';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border2;
                }}
              >
                Join Lounge
              </button>
              <button
                onClick={() => {
                  setAuthTab('login');
                  setAuthModalOpen(true);
                }}
                style={{
                  background: T.pillBg,
                  border: `1px solid ${T.pillBorder}`,
                  color: T.textPrimary,
                  fontSize: '12.5px',
                  fontWeight: '600',
                  padding: '7px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = T.pillBg)}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setAuthTab('signup');
                  setAuthModalOpen(true);
                }}
                style={{
                  background: '#ff5500',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: '700',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(255,85,0,0.35)',
                  transition: 'opacity 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FULL HERO SECTION (PERFECT LIGHT & DARK BLENDING) */}
      {/* ========================================================================= */}
      <section
        style={{
          position: 'relative',
          minHeight: 'calc(100vh - 70px)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 64px',
          overflow: 'hidden'
        }}
      >
        {/* Full Background Video */}
        <video
          src="/hero_story.mp4"
          autoPlay
          loop
          muted
          playsInline
          onError={(e) => {
            e.currentTarget.src = '/A_widescreen_D_flat_vect.mp4';
          }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '65%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 1,
            opacity: L ? 0.35 : 0.45,
            maskImage: 'linear-gradient(to right, transparent 0%, black 40%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 40%)'
          }}
        />

        {/* Dynamic Theme Gradient Vignette Layer */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            pointerEvents: 'none',
            background: L
              ? 'linear-gradient(90deg, #faf8f5 0%, #faf8f5 35%, rgba(250,248,245,0.85) 65%, transparent 100%)'
              : 'linear-gradient(90deg, #07080c 0%, #07080c 40%, rgba(7,8,12,0.7) 70%, transparent 100%)'
          }}
        />

        {/* Left Column Content */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: '680px', textAlign: 'left' }}>
          {/* Top Pill Feature Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: L ? 'rgba(255,85,0,0.1)' : 'rgba(255,85,0,0.12)',
              border: '1px solid rgba(255,85,0,0.3)',
              color: '#ff5500',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.4px',
              marginBottom: '20px'
            }}
          >
            <Sparkles size={14} color="#ff5500" />
            <span>0ms Synchronized Frame Engine • AES-256 E2EE</span>
          </div>

          <h1
            style={{
              fontSize: '64px',
              fontWeight: '900',
              fontFamily: 'Outfit, Plus Jakarta Sans, sans-serif',
              lineHeight: '1.08',
              letterSpacing: '-1.5px',
              marginBottom: '22px',
              color: T.textPrimary
            }}
          >
            The Private Digital <br />
            Lounge For Couples <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #ff5500 0%, #ff8844 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Co-Watching.
            </span>
          </h1>

          <p
            style={{
              fontSize: '16.5px',
              color: T.textMuted1,
              lineHeight: '1.65',
              marginBottom: '36px',
              maxWidth: '560px'
            }}
          >
            Advanced zero-latency frame sync, real-time WebRTC video calls, private AES-256 client encryption, 2-hour privacy auto-purge, and interactive love reactions for couples who demand the highest standards of digital togetherness.
          </p>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={openCreateRoom}
              style={{
                background: '#ff5500',
                border: 'none',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '700',
                padding: '14px 28px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 30px rgba(255,85,0,0.45)',
                transition: 'transform 0.15s, opacity 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.opacity = '0.95';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.opacity = '1';
              }}
            >
              <Sparkles size={16} />
              <span>Create Private Lounge</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={openJoinRoom}
              style={{
                background: T.pillBg,
                border: `1.5px solid ${T.pillBorder}`,
                color: T.textPrimary,
                fontSize: '15px',
                fontWeight: '700',
                padding: '14px 24px',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,85,0,0.12)';
                e.currentTarget.style.borderColor = '#ff5500';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = T.pillBg;
                e.currentTarget.style.borderColor = T.pillBorder;
              }}
            >
              <Users size={16} color="#ff5500" />
              <span>Join with Code</span>
            </button>

            <a
              href="#sandbox"
              style={{
                background: T.pillBg,
                border: `1px solid ${T.pillBorder}`,
                color: T.textMuted1,
                fontSize: '14px',
                fontWeight: '600',
                padding: '13px 20px',
                borderRadius: '12px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = T.textPrimary;
                e.currentTarget.style.borderColor = '#ff5500';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = T.textMuted1;
                e.currentTarget.style.borderColor = T.pillBorder;
              }}
            >
              <span>Try Live Sandbox</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '36px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.textMuted1, background: T.pillBg, border: `1px solid ${T.pillBorder}`, padding: '6px 12px', borderRadius: '8px' }}>
              <Tv size={13} color="#ff5500" />
              <span>0ms Instant Sync</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.textMuted1, background: T.pillBg, border: `1px solid ${T.pillBorder}`, padding: '6px 12px', borderRadius: '8px' }}>
              <ShieldCheck size={13} color="#22c55e" />
              <span>AES-256 Encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.textMuted1, background: T.pillBg, border: `1px solid ${T.pillBorder}`, padding: '6px 12px', borderRadius: '8px' }}>
              <Clock size={13} color="#a855f7" />
              <span>2-Hr Idle Auto-Purge</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: T.textMuted1, background: T.pillBg, border: `1px solid ${T.pillBorder}`, padding: '6px 12px', borderRadius: '8px' }}>
              <Video size={13} color="#00f5d4" />
              <span>HD WebRTC Video Calls</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.5 ELEGANT HAND-DRAWN COUPLE SKETCH FEATURE BANNER */}
      {/* ========================================================================= */}
      <section style={{ padding: '40px 64px 80px', maxWidth: '1360px', margin: '0 auto' }}>
        <div
          style={{
            background: L ? 'rgba(255,255,255,0.92)' : 'rgba(18, 14, 11, 0.85)',
            border: `1.5px solid ${L ? 'rgba(255,85,0,0.22)' : 'rgba(255,85,0,0.35)'}`,
            borderRadius: '32px',
            padding: '44px 52px',
            display: 'grid',
            gridTemplateColumns: '1fr 1.1fr',
            gap: '48px',
            alignItems: 'center',
            boxShadow: L
              ? '0 20px 60px rgba(0,0,0,0.06), 0 0 30px rgba(255,85,0,0.08)'
              : '0 30px 80px rgba(0,0,0,0.8), 0 0 40px rgba(255,85,0,0.15)'
          }}
        >
          {/* Left: Hand-Drawn Sketch Illustration */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '16px',
              boxShadow: L ? '0 10px 30px rgba(0,0,0,0.08)' : '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(255,85,0,0.25)',
              border: '2px solid rgba(255,85,0,0.35)'
            }}
          >
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
            <h2 style={{ fontSize: '36px', fontWeight: '900', margin: '12px 0 16px', lineHeight: 1.2, fontFamily: 'Outfit, sans-serif', color: T.textPrimary }}>
              Feel Like You're Sitting Next to Each Other
            </h2>
            <p style={{ fontSize: '15px', color: T.textMuted1, lineHeight: 1.6, marginBottom: '24px' }}>
              Whether you're miles apart or in different cities, CYPR ViAM recreates the intimacy of a cozy couch movie date with 0ms frame-accurate playback, floating WebRTC video feeds, and synchronized love reactions.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255, 85, 0, 0.12)', border: '1px solid rgba(255, 85, 0, 0.3)', padding: '8px 16px', borderRadius: '16px', fontSize: '12.5px', fontWeight: '800', color: '#ff5500' }}>
                <Tv size={15} /> 0ms Frame Sync
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 16px', borderRadius: '16px', fontSize: '12.5px', fontWeight: '800', color: '#10b981' }}>
                <ShieldCheck size={15} /> AES-256 E2EE Private
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0, 245, 212, 0.12)', border: '1px solid rgba(0, 245, 212, 0.3)', padding: '8px 16px', borderRadius: '16px', fontSize: '12.5px', fontWeight: '800', color: '#00bfa5' }}>
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
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            TRY LIVE DEMO SIMULATOR
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif', color: T.textPrimary }}>
            Interactive Co-Watching Lounge Sandbox
          </h2>
          <p style={{ fontSize: '15px', color: T.textMuted1, maxWidth: '640px', margin: '0 auto' }}>
            Test 0ms frame sync, floating WebRTC partner video feeds, and instant love reactions live right now!
          </p>
        </div>

        {/* Preset Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setPresetIndex(idx)}
              style={{
                background: presetIndex === idx ? '#ff5500' : T.pillBg,
                border: '1px solid ' + (presetIndex === idx ? '#ff5500' : T.pillBorder),
                color: presetIndex === idx ? '#fff' : T.textPrimary,
                fontSize: '13px',
                fontWeight: '700',
                padding: '8px 20px',
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {p.title}
            </button>
          ))}
        </div>

        {/* Sandbox Video Stage Container */}
        <div
          style={{
            width: '100%',
            height: '480px',
            borderRadius: '28px',
            border: `1.5px solid ${L ? 'rgba(255,85,0,0.3)' : 'rgba(255,85,0,0.4)'}`,
            background: presets[presetIndex].bgGrad,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: L ? '0 20px 60px rgba(0,0,0,0.08)' : '0 30px 80px rgba(0,0,0,0.9), 0 0 50px rgba(255,85,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px'
          }}
        >
          {/* Top Stage Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: L ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)',
                padding: '6px 16px',
                borderRadius: '20px',
                border: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)'}`,
                backdropFilter: 'blur(10px)'
              }}
            >
              <span className="online-dot" />
              <span style={{ fontSize: '13px', fontWeight: '800', color: T.textPrimary }}>{presets[presetIndex].title}</span>
              <span style={{ fontSize: '11px', color: '#ff5500', fontFamily: 'monospace', fontWeight: '700' }}>0 ms SYNC</span>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <span
                style={{
                  fontSize: '12px',
                  background: 'rgba(16,185,129,0.15)',
                  color: '#10b981',
                  padding: '5px 12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(16,185,129,0.3)',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <ShieldCheck size={13} /> AES-256 E2EE ACTIVE
              </span>
            </div>
          </div>

          {/* Center Movie Visual & Floating Reaction Buttons */}
          <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', margin: '0 auto' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(255,85,0,0.15)',
                border: '1px solid rgba(255,85,0,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                color: '#ff5500',
                boxShadow: '0 0 25px rgba(255,85,0,0.3)'
              }}
            >
              <Film size={34} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: T.textPrimary }}>
              Synchronized Playback Stream Active
            </div>

            {/* Clickable Reactions Bar */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px', justifyContent: 'center' }}>
              {['💖', '🍿', '🔥', '✨', '🥰', '🎉'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => triggerEmojiBurst(emoji)}
                  style={{
                    background: L ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.5)',
                    border: `1px solid ${L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}`,
                    borderRadius: '50%',
                    width: '38px',
                    height: '38px',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.15s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  title="Send reaction to partner!"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Floating Partner Webcams (Bottom Right Overlay) */}
          <div style={{ position: 'absolute', bottom: '80px', right: '24px', zIndex: 20, display: 'flex', gap: '12px' }}>
            <div style={{ width: '100px', height: '70px', borderRadius: '14px', border: '2px solid #ff5500', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80" alt="Partner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '4px', left: '4px', fontSize: '9px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 5px', borderRadius: '6px', fontWeight: '800' }}>Partner</span>
            </div>
            <div style={{ width: '100px', height: '70px', borderRadius: '14px', border: '2px solid #00f5d4', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', position: 'relative' }}>
              <img src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80" alt="You" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span style={{ position: 'absolute', bottom: '4px', left: '4px', fontSize: '9px', background: 'rgba(0,0,0,0.7)', color: '#fff', padding: '2px 5px', borderRadius: '6px', fontWeight: '800' }}>You</span>
            </div>
          </div>

          {/* Bottom Scrubber Controls */}
          <div
            style={{
              background: L ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(12px)',
              padding: '12px 20px',
              borderRadius: '18px',
              border: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              zIndex: 10
            }}
          >
            <button
              onClick={() => setIsSimPlaying(!isSimPlaying)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#ff5500',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              {isSimPlaying ? <Pause size={16} /> : <Play size={16} fill="#fff" style={{ marginLeft: '2px' }} />}
            </button>
            <div style={{ flex: 1, height: '6px', background: L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)', borderRadius: '3px', position: 'relative' }}>
              <div style={{ width: `${simProgress}%`, height: '100%', background: 'linear-gradient(90deg, #ff5500, #8000ff)', borderRadius: '3px' }} />
            </div>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: T.textPrimary, fontWeight: '700' }}>
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
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            ENGINEERED FOR TOGETHERNESS
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif', color: T.textPrimary }}>
            Built Specifically For Long Distance Couples
          </h2>
          <p style={{ fontSize: '15px', color: T.textMuted1, maxWidth: '600px', margin: '0 auto' }}>
            Everything you need for romantic movie dates without latency, desync, or privacy concerns.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
          {[
            {
              icon: <Film size={26} color="#ff5500" />,
              title: '0ms Latency Frame Sync',
              desc: 'Stream YouTube, direct MP4, or custom video links with 100% exact sub-millisecond playback synchronization across both devices.',
              badge: 'Real-time'
            },
            {
              icon: <Video size={26} color="#8000ff" />,
              title: 'Duo WebRTC Video Calling',
              desc: 'Picture-in-picture floating webcam overlays with instant mic and camera toggles right over the movie player.',
              badge: 'P2P Mesh'
            },
            {
              icon: <ShieldCheck size={26} color="#10b981" />,
              title: 'AES-256 E2EE Cryptography',
              desc: 'Zero-knowledge client-side encryption. Nobody outside your room can access your chat, video call, or media stream.',
              badge: 'Client-side'
            },
            {
              icon: <Heart size={26} color="#00f5d4" />,
              title: 'Live Floating Love Reactions',
              desc: 'Send romantic emoji particle bursts (💖🍿🔥✨🥰🎉) that float live across your partner\'s video player in real-time.',
              badge: 'Interactive'
            },
            {
              icon: <Clock size={26} color="#eab308" />,
              title: '2-Hour Inactivity Auto-Purge',
              desc: 'All chats and lounge states are preserved while active. If an empty room remains idle for 2 hours, it is permanently deleted.',
              badge: 'Privacy'
            },
            {
              icon: <Globe size={26} color="#f43f5e" />,
              title: '100% Free & Cross-Platform',
              desc: 'Works seamlessly across desktop browsers, laptops, tablets, and smartphones with zero app downloads needed.',
              badge: 'Universal'
            }
          ].map((feat, idx) => (
            <div
              key={idx}
              style={{
                background: L ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '24px',
                padding: '32px',
                boxShadow: L ? '0 4px 20px rgba(0,0,0,0.04)' : 'none',
                transition: 'transform 0.2s ease, border-color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = '#ff5500';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ width: 48, height: 48, borderRadius: '12px', background: T.pillBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feat.icon}
                </div>
                <span style={{ fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: T.pillBg, color: T.textMuted2 }}>
                  {feat.badge}
                </span>
              </div>
              <h3 style={{ fontSize: '19px', fontWeight: '800', marginBottom: '10px', color: T.textPrimary }}>
                {feat.title}
              </h3>
              <p style={{ fontSize: '14px', color: T.textMuted1, lineHeight: '1.6', margin: 0 }}>
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. WHY CYPR COMPARISON TABLE (#why-cypr) */}
      {/* ========================================================================= */}
      <section id="why-cypr" style={{ padding: '80px 64px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            THE CLEAR WINNER
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif', color: T.textPrimary }}>
            Why CYPR Outperforms Other Platforms
          </h2>
        </div>

        <div
          style={{
            overflowX: 'auto',
            background: L ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.02)',
            borderRadius: '24px',
            border: `1px solid ${T.border2}`,
            padding: '24px',
            boxShadow: L ? '0 4px 20px rgba(0,0,0,0.04)' : 'none'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.borderDivider}` }}>
                <th style={{ padding: '16px', fontSize: '14px', color: T.textMuted2 }}>Feature Comparison</th>
                <th style={{ padding: '16px', fontSize: '16px', color: '#ff5500', fontWeight: '800' }}>CYPR ViAM</th>
                <th style={{ padding: '16px', fontSize: '14px', color: T.textMuted2 }}>Discord / Zoom</th>
                <th style={{ padding: '16px', fontSize: '14px', color: T.textMuted2 }}>Teleparty / Rave</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: `1px solid ${T.borderDivider}` }}>
                <td style={{ padding: '16px', fontWeight: '700', color: T.textPrimary }}>0ms Latency Frame Sync</td>
                <td style={{ padding: '16px', color: '#10b981', fontWeight: '800' }}>✓ 100% Perfect</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ Screen Lag / Choppy</td>
                <td style={{ padding: '16px', color: '#f59e0b' }}>⚠️ Often Desynced</td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${T.borderDivider}` }}>
                <td style={{ padding: '16px', fontWeight: '700', color: T.textPrimary }}>Integrated HD WebRTC Video Call</td>
                <td style={{ padding: '16px', color: '#10b981', fontWeight: '800' }}>✓ Built-In Duo Cams</td>
                <td style={{ padding: '16px', color: '#10b981' }}>✓ Built-In</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ No Video Calling</td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${T.borderDivider}` }}>
                <td style={{ padding: '16px', fontWeight: '700', color: T.textPrimary }}>AES-256 E2EE Cryptography</td>
                <td style={{ padding: '16px', color: '#10b981', fontWeight: '800' }}>✓ Client-Side E2EE</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ Server Monitored</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ Unencrypted</td>
              </tr>
              <tr style={{ borderBottom: `1px solid ${T.borderDivider}` }}>
                <td style={{ padding: '16px', fontWeight: '700', color: T.textPrimary }}>2-Hour Inactivity Privacy Purge</td>
                <td style={{ padding: '16px', color: '#10b981', fontWeight: '800' }}>✓ Auto-Purged</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ Logs Kept Forever</td>
                <td style={{ padding: '16px', color: '#ef4444' }}>✕ Cloud Stored</td>
              </tr>
              <tr>
                <td style={{ padding: '16px', fontWeight: '700', color: T.textPrimary }}>100% Free & Zero Ads</td>
                <td style={{ padding: '16px', color: '#10b981', fontWeight: '800' }}>✓ Free Forever</td>
                <td style={{ padding: '16px', color: '#f59e0b' }}>⚠️ Nitro Upsells</td>
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
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            FOUR EASY STEPS
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif', color: T.textPrimary }}>
            How To Start Your First Co-Watch Lounge
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
          {[
            { num: '01', title: 'Create Room Code', desc: 'Click Create Lounge to set up your private room with an optional passcode.' },
            { num: '02', title: 'Share Code With Partner', desc: 'Send the 6-character room code or invite link to your partner so they can enter.' },
            { num: '03', title: 'Pick a Movie or Show', desc: 'Paste any YouTube link, MP4 URL, or ask ViAM AI in chat with /play <movie>.' },
            { num: '04', title: 'Enjoy Together!', desc: 'Turn on WebRTC video call, chat privately, and react with live floating hearts!' }
          ].map((st, idx) => (
            <div
              key={idx}
              style={{
                background: L ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '24px',
                padding: '28px',
                textAlign: 'left',
                boxShadow: L ? '0 4px 20px rgba(0,0,0,0.04)' : 'none'
              }}
            >
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: '900',
                  color: '#ff5500',
                  display: 'block',
                  marginBottom: '12px',
                  fontFamily: 'monospace'
                }}
              >
                {st.num}
              </span>
              <h4 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: T.textPrimary }}>
                {st.title}
              </h4>
              <p style={{ fontSize: '13.5px', color: T.textMuted1, lineHeight: '1.6', margin: 0 }}>
                {st.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (#faq) */}
      {/* ========================================================================= */}
      <section id="faq" style={{ padding: '80px 64px', maxWidth: '960px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#ff5500', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            GOT QUESTIONS?
          </span>
          <h2 style={{ fontSize: '38px', fontWeight: '900', margin: '10px 0 14px', fontFamily: 'Outfit, sans-serif', color: T.textPrimary }}>
            Frequently Asked Questions
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              onClick={() => toggleFaq(idx)}
              style={{
                background: L ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.03)',
                border: '1px solid ' + (openFaq === idx ? '#ff5500' : L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'),
                borderRadius: '18px',
                padding: '20px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: L ? '0 2px 10px rgba(0,0,0,0.03)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '16.5px', fontWeight: '700', color: T.textPrimary, margin: 0 }}>
                  {faq.q}
                </h4>
                <ChevronDown
                  size={18}
                  color="#ff5500"
                  style={{
                    transform: openFaq === idx ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.2s'
                  }}
                />
              </div>
              {openFaq === idx && (
                <p style={{ fontSize: '14px', color: T.textMuted1, marginTop: '14px', lineHeight: '1.6', margin: '14px 0 0' }}>
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
        <div
          style={{
            background: L
              ? 'linear-gradient(135deg, rgba(255,85,0,0.14) 0%, rgba(255,255,255,0.95) 100%)'
              : 'radial-gradient(circle at center, rgba(255,85,0,0.25) 0%, rgba(11,8,6,0.95) 80%)',
            borderRadius: '32px',
            border: `1.5px solid ${L ? 'rgba(255,85,0,0.3)' : 'rgba(255,85,0,0.4)'}`,
            padding: '60px 32px',
            textAlign: 'center',
            boxShadow: L
              ? '0 20px 60px rgba(255,85,0,0.12)'
              : '0 30px 80px rgba(0,0,0,0.9), 0 0 60px rgba(255,85,0,0.3)'
          }}
        >
          <h2 style={{ fontSize: '42px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', marginBottom: '16px', color: T.textPrimary }}>
            Ready To Turn Distance Into Togetherness?
          </h2>
          <p style={{ fontSize: '16px', color: T.textMuted1, maxWidth: '600px', margin: '0 auto 32px', lineHeight: '1.6' }}>
            Join thousands of long distance couples co-watching movies with 0ms frame sync and WebRTC video calls today.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={openCreateRoom}
              style={{
                background: '#ff5500',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '800',
                padding: '16px 36px',
                borderRadius: '16px',
                cursor: 'pointer',
                boxShadow: '0 0 35px rgba(255,85,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={18} />
              <span>Create Private Lounge</span>
            </button>
            <button
              onClick={openJoinRoom}
              style={{
                background: T.pillBg,
                border: `1.5px solid ${T.pillBorder}`,
                color: T.textPrimary,
                fontSize: '16px',
                fontWeight: '700',
                padding: '16px 30px',
                borderRadius: '16px',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
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
      <footer
        style={{
          borderTop: `1px solid ${T.borderDivider}`,
          padding: '32px 64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: T.headerBg,
          backdropFilter: 'blur(16px)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'Outfit, sans-serif', color: T.textPrimary }}>
            CYPR
          </span>
          <span style={{ fontSize: '12px', color: T.textMuted2 }}>
            © 2026 CYPR ViAM Inc. All rights reserved.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: T.textMuted1 }}>
          <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }}>Features</a>
          <a href="#sandbox" style={{ color: 'inherit', textDecoration: 'none' }}>Sandbox</a>
          <a href="#why-cypr" style={{ color: 'inherit', textDecoration: 'none' }}>Why CYPR?</a>
          <a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy & Security</a>
        </div>
      </footer>

      {/* Floating Bottom Right Action Button */}
      <div
        onClick={openCreateRoom}
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 999,
          width: '54px',
          height: '54px',
          borderRadius: '50%',
          background: '#ff5500',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 0 30px rgba(255,85,0,0.8)',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
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
        inviteRoom={inviteRoom}
        theme={theme}
      />

      {/* Room Setup & Capacity Modal */}
      <RoomModal
        isOpen={roomModalOpen}
        onClose={() => setRoomModalOpen(false)}
        userAccount={userAccount}
        theme={theme}
        defaultRoomId={
          new URLSearchParams(window.location.search).get('room') ||
          new URLSearchParams(window.location.search).get('join') ||
          ''
        }
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
        theme={theme}
        onLogout={() => {
          localStorage.removeItem('cypr_user_account');
          setUserAccount(null);
          setIsProfileOpen(false);
        }}
        onRejoinRoom={(code) => {
          const finalName = name.trim() || userAccount?.name || 'Guest User';
          onConnect?.({ name: finalName, roomId: code.toLowerCase() });
        }}
        onPlayShow={() => {
          const finalName = name.trim() || userAccount?.name || 'Guest User';
          onConnect?.({ name: finalName, roomId: 'cinema' });
        }}
      />
    </div>
  );
}
