import React, { useState } from 'react';
import {
  Film, MessageSquare, Bot, Phone, Video, Sparkles,
  Music, Gamepad2, Image, ShieldCheck, Users, Copy, Check,
  LogOut, ArrowRight, Play, Pause, Zap, Layers, Lock, Flame,
  Radio, Compass, ChevronRight, User, Tv, Wifi, Globe,
  Headphones, MonitorPlay, MessageCircle, Sliders, ExternalLink,
  Crown, Sun, Moon
} from 'lucide-react';
import HeaderProfileMenu from '../components/HeaderProfileMenu';
import VoiceAssistant from '../components/VoiceAssistant';

export default function HomePage({
  currentUser,
  roomId,
  roomUsers = [],
  mediaState,
  onNavigate,
  onOpenCinema,
  onOpenChat,
  onOpenAI,
  onOpenRooms,
  onOpenCall,
  onOpenProfile,
  onLeave,
  onGlobalVoiceAction,
  onToggleTheme,
  theme = 'dark'
}) {
  const [copied, setCopied] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMediaActive = Boolean(mediaState?.url);
  const L = theme === 'light'; // shorthand: L = is Light mode

  // ═══════════════════════════════════════════════════════
  //  THEME TOKEN SYSTEM
  //  Every color is derived from L (isLight) toggle
  // ═══════════════════════════════════════════════════════
  const T = {
    // Page backgrounds
    pageBg: L
      ? 'linear-gradient(145deg, #f7f4ef 0%, #f0ebe0 50%, #ebe3d6 100%)'
      : '#07080c',
    pageRadials: L
      ? `radial-gradient(circle at 15% 15%, rgba(255,120,0,0.05) 0%, transparent 45%),
         radial-gradient(circle at 85% 20%, rgba(168,85,247,0.04) 0%, transparent 45%),
         radial-gradient(circle at 50% 80%, rgba(34,197,94,0.03) 0%, transparent 50%)`
      : `radial-gradient(circle at 15% 15%, rgba(255,85,0,0.08) 0%, transparent 45%),
         radial-gradient(circle at 85% 20%, rgba(168,85,247,0.07) 0%, transparent 45%),
         radial-gradient(circle at 50% 80%, rgba(34,197,94,0.05) 0%, transparent 50%),
         radial-gradient(circle at 50% 10%, #111420 0%, #07080c 70%)`,
    pageColor: L ? '#1a1208' : '#ffffff',

    // Header
    headerBg: L ? 'rgba(247, 242, 234, 0.95)' : 'rgba(10, 12, 18, 0.85)',
    headerBorder: L ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)',

    // Room pill / copy badge
    pillBg: L ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)',
    pillBorder: L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
    pillText: L ? '#5c4a36' : '#a1a1aa',

    // Header nav pills
    navPillBg: L ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)',
    navPillBorder: L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.09)',
    navPillText: L ? '#2a1f14' : '#f4f4f5',

    // Hero card
    heroBg: L
      ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,246,240,0.98) 100%)'
      : 'linear-gradient(135deg, rgba(22,25,38,0.85) 0%, rgba(13,14,22,0.95) 100%)',
    heroBorder: L ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.09)',
    heroShadow: L
      ? '0 24px 64px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)'
      : '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)',

    // Hero mini status badges (E2EE, 0ms sync)
    miniBadgeBg: L ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)',
    miniBadgeBorder: L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
    miniBadgeText: L ? '#5c4a36' : '#a1a1aa',

    // Hero title
    heroTitle: L ? '#1a1208' : '#ffffff',
    heroDesc: L ? '#6b5a44' : '#94a3b8',

    // Avatar ring
    avatarRing: L ? '#f0ebe0' : '#0d0e16',

    // Members text
    membersText: L ? '#7a6a54' : '#64748b',

    // Right mini card (theater state)
    rightCardBg: L ? 'rgba(255,255,255,0.92)' : 'rgba(15,17,26,0.9)',
    rightCardBorder: L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
    rightCardShadow: L ? '0 12px 32px rgba(0,0,0,0.12)' : '0 12px 32px rgba(0,0,0,0.4)',
    theaterLabel: L ? '#8a7060' : '#71717a',
    theaterTitle: L ? '#1a1208' : '#f4f4f5',

    // Section headers
    sectionTitle: L ? '#1a1208' : '#f1f5f9',
    sectionSub: L ? '#8a7060' : '#64748b',

    // Feature cards (cinema / chat / ai)
    cardBgCinema: (hov) => L
      ? hov ? 'linear-gradient(145deg, rgba(255,85,0,0.08) 0%, rgba(255,255,255,0.98) 100%)'
             : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(250,245,240,0.98) 100%)'
      : hov ? 'linear-gradient(145deg, rgba(255,85,0,0.14) 0%, rgba(20,23,36,0.98) 100%)'
             : 'linear-gradient(145deg, rgba(255,85,0,0.06) 0%, rgba(14,16,25,0.95) 100%)',
    cardBgChat: (hov) => L
      ? hov ? 'linear-gradient(145deg, rgba(34,197,94,0.07) 0%, rgba(255,255,255,0.98) 100%)'
             : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(245,252,248,0.98) 100%)'
      : hov ? 'linear-gradient(145deg, rgba(34,197,94,0.12) 0%, rgba(20,23,36,0.98) 100%)'
             : 'linear-gradient(145deg, rgba(34,197,94,0.05) 0%, rgba(14,16,25,0.95) 100%)',
    cardBgAi: (hov) => L
      ? hov ? 'linear-gradient(145deg, rgba(168,85,247,0.07) 0%, rgba(255,255,255,0.98) 100%)'
             : 'linear-gradient(145deg, rgba(255,255,255,0.95) 0%, rgba(248,245,252,0.98) 100%)'
      : hov ? 'linear-gradient(145deg, rgba(168,85,247,0.14) 0%, rgba(20,23,36,0.98) 100%)'
             : 'linear-gradient(145deg, rgba(168,85,247,0.06) 0%, rgba(14,16,25,0.95) 100%)',

    cardBorderCinema: (hov) => L
      ? hov ? '1.5px solid rgba(255,85,0,0.35)' : '1.5px solid rgba(255,85,0,0.18)'
      : hov ? '1.5px solid rgba(255,85,0,0.6)' : '1.5px solid rgba(255,85,0,0.22)',
    cardBorderChat: (hov) => L
      ? hov ? '1.5px solid rgba(34,197,94,0.35)' : '1.5px solid rgba(34,197,94,0.18)'
      : hov ? '1.5px solid rgba(34,197,94,0.6)' : '1.5px solid rgba(34,197,94,0.22)',
    cardBorderAi: (hov) => L
      ? hov ? '1.5px solid rgba(168,85,247,0.35)' : '1.5px solid rgba(168,85,247,0.18)'
      : hov ? '1.5px solid rgba(168,85,247,0.6)' : '1.5px solid rgba(168,85,247,0.22)',

    cardShadow: (accent, hov) => L
      ? hov ? `0 20px 48px ${accent}20, 0 4px 16px rgba(0,0,0,0.08)` : '0 4px 18px rgba(0,0,0,0.08)'
      : hov ? `0 20px 48px ${accent}38, inset 0 1px 0 rgba(255,255,255,0.1)` : '0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',

    cardTitle: L ? '#1a1208' : '#ffffff',
    cardDesc: L ? '#6b5a44' : '#94a3b8',
    cardDivider: L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',
    cardSubText: L ? '#8a7060' : '#64748b',

    // Station cards (smaller ones)
    stationBg: L ? 'rgba(255,255,255,0.85)' : 'rgba(17,20,30,0.75)',
    stationBorder: L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    stationTitle: L ? '#1a1208' : '#ffffff',
    stationDesc: L ? '#7a6a54' : '#94a3b8',
    stationHoverBg: (color) => L
      ? `rgba(${color},0.07)` : `rgba(${color},0.1)`,
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: T.pageBg,
      backgroundImage: T.pageRadials,
      color: T.pageColor,
      fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden',
      transition: 'background 0.4s ease, color 0.35s ease'
    }}>

      {/* ══ HEADER ══ */}
      <header style={{
        height: 64,
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: T.headerBg,
        backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.headerBorder}`,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        transition: 'background 0.4s ease, border-color 0.35s ease'
      }}>
        {/* Logo + Room Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div onClick={() => onNavigate?.('home')} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} title="CYPR ViAM Home">
            <img
              src="/viam_logo.png"
              alt="CYPR ViAM"
              style={{
                height: 62,
                width: 'auto',
                objectFit: 'contain',
                filter: L
                  ? 'drop-shadow(0 2px 12px rgba(255,85,0,0.35))'
                  : 'drop-shadow(0 2px 16px rgba(255,85,0,0.55))',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>

          <div
            onClick={copyInvite}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T.pillBg,
              border: `1px solid ${T.pillBorder}`,
              borderRadius: 24, padding: '4px 12px 4px 10px',
              cursor: 'pointer', fontSize: 12,
              color: T.pillText,
              fontWeight: 600, transition: 'all 0.2s ease',
              backdropFilter: 'blur(8px)'
            }}
            title="Click to copy invite link"
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ff5500';
              e.currentTarget.style.background = L ? 'rgba(255,85,0,0.07)' : 'rgba(255,85,0,0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = T.pillBorder;
              e.currentTarget.style.background = T.pillBg;
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ color: '#ff661a', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.5px' }}>
              {roomId}
            </span>
            {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} color={L ? '#8a7060' : '#71717a'} />}
          </div>
        </div>

        {/* Nav Pills + Voice + Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[
            { label: 'Cinema', icon: <Film size={15} color="#ff7733" />, onClick: onOpenCinema, accentRgb: '255,85,0' },
            { label: 'Lounge Chat', icon: <MessageSquare size={15} color="#22c55e" />, onClick: onOpenChat, accentRgb: '34,197,94' },
          ].map(({ label, icon, onClick, accentRgb }) => (
            <button
              key={label}
              onClick={onClick}
              className="cinema-header-pill"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: T.navPillBg,
                border: `1px solid ${T.navPillBorder}`,
                color: T.navPillText,
                padding: '7px 16px', borderRadius: 20,
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `rgba(${accentRgb},${L ? '0.1' : '0.15'})`;
                e.currentTarget.style.borderColor = `rgba(${accentRgb},${L ? '0.35' : '0.4'})`;
                e.currentTarget.style.color = L ? '#1a0f06' : '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = T.navPillBg;
                e.currentTarget.style.borderColor = T.navPillBorder;
                e.currentTarget.style.color = T.navPillText;
              }}
            >
              {icon}
              <span className="mobile-text-hidden">{label}</span>
            </button>
          ))}

          <VoiceAssistant onGlobalVoiceAction={onGlobalVoiceAction} theme={theme} />

          <button
            onClick={onOpenAI}
            className="cinema-header-pill"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: T.navPillBg,
              border: `1px solid ${T.navPillBorder}`,
              color: T.navPillText,
              padding: '7px 16px', borderRadius: 20,
              fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `rgba(168,85,247,${L ? '0.1' : '0.15'})`;
              e.currentTarget.style.borderColor = `rgba(168,85,247,${L ? '0.35' : '0.4'})`;
              e.currentTarget.style.color = L ? '#1a0f06' : '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = T.navPillBg;
              e.currentTarget.style.borderColor = T.navPillBorder;
              e.currentTarget.style.color = T.navPillText;
            }}
          >
            <Sparkles size={15} color="#c084fc" />
            <span className="mobile-text-hidden">ViAM AI</span>
          </button>

          {onOpenRooms && (
            <button
              onClick={onOpenRooms}
              className="cinema-header-pill"
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: T.navPillBg,
                border: `1px solid ${T.navPillBorder}`,
                color: T.navPillText,
                padding: '7px 16px', borderRadius: 20,
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `rgba(255,85,0,${L ? '0.1' : '0.15'})`;
                e.currentTarget.style.borderColor = `rgba(255,85,0,${L ? '0.35' : '0.4'})`;
                e.currentTarget.style.color = L ? '#1a0f06' : '#fff';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = T.navPillBg;
                e.currentTarget.style.borderColor = T.navPillBorder;
                e.currentTarget.style.color = T.navPillText;
              }}
              title="Manage Lounges & Members"
            >
              <Users size={15} color="#ff5500" />
              <span className="mobile-text-hidden">Rooms</span>
            </button>
          )}

          <div style={{ width: 1, height: 22, background: L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

          <HeaderProfileMenu
            userAccount={currentUser}
            onOpenProfile={onOpenProfile}
            onOpenHistory={onOpenProfile}
            onOpenRooms={onOpenRooms}
            onLogout={onLeave}
            theme={theme}
          />
        </div>
      </header>

      {/* ══ MAIN CONTENT ══ */}
      <main style={{
        maxWidth: 1280, width: '100%',
        margin: '0 auto',
        padding: '32px 28px 48px',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column', gap: 32
      }}>

        {/* ══ HERO CARD ══ */}
        <div style={{
          background: T.heroBg,
          border: `1px solid ${T.heroBorder}`,
          borderRadius: 24,
          padding: '32px 36px',
          boxShadow: T.heroShadow,
          backdropFilter: 'blur(24px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 28,
          position: 'relative', overflow: 'hidden',
          transition: 'background 0.4s ease, border-color 0.35s ease'
        }}>
          {/* Ambient backlight */}
          <div style={{
            position: 'absolute', top: -60, right: 120, width: 320, height: 240,
            background: L
              ? 'radial-gradient(circle, rgba(255,120,0,0.08) 0%, rgba(168,85,247,0.04) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255,85,0,0.15) 0%, rgba(168,85,247,0.08) 50%, transparent 70%)',
            pointerEvents: 'none', filter: 'blur(30px)'
          }} />

          {/* Left text block */}
          <div style={{ maxWidth: 660, zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {/* Room active badge */}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)',
                color: '#22c55e', fontSize: 11.5, fontWeight: 800,
                padding: '4px 12px', borderRadius: 20, letterSpacing: '0.4px'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                ROOM ACTIVE • {roomUsers.length} ONLINE
              </span>

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: T.miniBadgeBg, border: `1px solid ${T.miniBadgeBorder}`,
                color: T.miniBadgeText, fontSize: 11.5, fontWeight: 600, padding: '4px 12px', borderRadius: 20
              }}>
                <ShieldCheck size={13} color="#22c55e" />
                <span>AES-256 E2EE Verified</span>
              </span>

              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: T.miniBadgeBg, border: `1px solid ${T.miniBadgeBorder}`,
                color: T.miniBadgeText, fontSize: 11.5, fontWeight: 600, padding: '4px 12px', borderRadius: 20
              }}>
                <Zap size={13} color="#eab308" />
                <span>0ms Sync Mesh</span>
              </span>
            </div>

            <h1 style={{
              fontSize: '34px', fontWeight: 900,
              fontFamily: 'Outfit, sans-serif',
              margin: '0 0 12px', lineHeight: 1.15,
              letterSpacing: '-0.5px', color: T.heroTitle,
              transition: 'color 0.35s ease'
            }}>
              Welcome to the{' '}
              <span style={{
                background: 'linear-gradient(135deg, #ff7733 0%, #ff5500 50%, #e04400 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: 'none'
              }}>CYPR Lounge</span>{' '}Hub
            </h1>

            <p style={{
              fontSize: 14.5, color: T.heroDesc,
              margin: '0 0 20px', lineHeight: 1.6, maxWidth: 580,
              transition: 'color 0.35s ease'
            }}>
              Your centralized command deck for synchronized 4K co-watching, encrypted WhatsApp-style messaging, crystal clear WebRTC calls, and Groq 70B AI cinema intelligence.
            </p>

            {/* Member avatar strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}>
                {roomUsers.slice(0, 5).map((user, idx) => (
                  <div
                    key={user.socketId || idx}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: user.avatar ? 'transparent' : 'linear-gradient(135deg, #ff5500, #9333ea)',
                      border: `2px solid ${T.avatarRing}`,
                      marginLeft: idx > 0 ? -8 : 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 800, color: '#fff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                      overflow: 'hidden', transition: 'border-color 0.35s ease'
                    }}
                    title={user.name}
                  >
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : user.name?.charAt(0)?.toUpperCase() || 'U'
                    }
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: T.membersText, fontWeight: 600, transition: 'color 0.35s ease' }}>
                {roomUsers.length === 1
                  ? 'Solo Lounge (Share link with friends)'
                  : `${roomUsers.length} members connected in room`}
              </span>
            </div>
          </div>

          {/* Right mini theater-state card */}
          <div style={{
            minWidth: 280,
            background: T.rightCardBg,
            border: `1px solid ${T.rightCardBorder}`,
            borderRadius: 18, padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: T.rightCardShadow, zIndex: 2,
            transition: 'background 0.4s ease, border-color 0.35s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.theaterLabel, textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'color 0.35s ease' }}>
                Theater State
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: isMediaActive ? '#22c55e' : (L ? '#8a7060' : '#a1a1aa'),
                background: isMediaActive ? 'rgba(34,197,94,0.12)' : (L ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'),
                padding: '2px 8px', borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.35s ease'
              }}>
                {isMediaActive ? (
                  <>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                    {mediaState?.isPlaying ? 'PLAYING' : 'PAUSED'}
                  </>
                ) : 'IDLE / READY'}
              </span>
            </div>

            <div style={{
              fontSize: 13.5, fontWeight: 700, color: T.theaterTitle,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 240,
              transition: 'color 0.35s ease'
            }}>
              {mediaState?.title && mediaState.title !== 'No movie selected' ? mediaState.title : 'No Media Playing'}
            </div>

            <button
              onClick={onOpenCinema}
              style={{
                background: 'linear-gradient(135deg, #ff661a 0%, #ff5500 50%, #e04400 100%)',
                border: 'none', color: '#fff',
                padding: '12px 20px', borderRadius: 12,
                fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 8px 24px rgba(255,85,0,0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(255,85,0,0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,85,0,0.35)';
              }}
            >
              <Play size={15} fill="#fff" />
              <span>{isMediaActive ? 'Jump into Stream' : 'Launch Cinema Lounge'}</span>
            </button>
          </div>
        </div>

        {/* ══ FEATURE CARDS SECTION ══ */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{
              fontSize: 18, fontWeight: 800, margin: 0,
              display: 'flex', alignItems: 'center', gap: 9, color: T.sectionTitle,
              transition: 'color 0.35s ease'
            }}>
              <Compass size={19} color="#ff661a" />
              <span>Lounge Facilities &amp; Command Hubs</span>
            </h2>
            <span style={{ fontSize: 12, color: T.sectionSub, transition: 'color 0.35s ease' }}>Select any station to enter</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 22 }}>

            {/* CARD 1: CINEMA */}
            <div
              onClick={onOpenCinema}
              onMouseEnter={() => setHoveredCard('cinema')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: T.cardBgCinema(hoveredCard === 'cinema'),
                border: T.cardBorderCinema(hoveredCard === 'cinema'),
                borderRadius: 22, padding: '26px 28px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: 240,
                boxShadow: T.cardShadow('rgba(255,85,0)', hoveredCard === 'cinema'),
                transform: hoveredCard === 'cinema' ? 'translateY(-4px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 140, height: 140,
                background: L
                  ? 'radial-gradient(circle, rgba(255,85,0,0.1) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(255,85,0,0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 15,
                    background: 'linear-gradient(135deg, #ff661a 0%, #b83200 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 6px 18px rgba(255,85,0,0.45)'
                  }}>
                    <Film size={24} />
                  </div>
                  <span style={{
                    fontSize: 10.5, fontWeight: 800,
                    background: 'rgba(255,85,0,0.16)', border: '1px solid rgba(255,85,0,0.3)',
                    color: '#ff7733', padding: '4px 10px', borderRadius: 20,
                    letterSpacing: '0.5px', textTransform: 'uppercase'
                  }}>0ms Sync Stream</span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: T.cardTitle, letterSpacing: '-0.3px', transition: 'color 0.35s ease' }}>
                  Cinema Co-Watch Lounge
                </h3>
                <p style={{ fontSize: 13.5, color: T.cardDesc, margin: 0, lineHeight: 1.55, transition: 'color 0.35s ease' }}>
                  Synchronized 4K streaming player with YouTube, direct MP4, multiple servers, and in-sync timeline controls.
                </p>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T.cardDivider}`,
                transition: 'border-color 0.35s ease'
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#ff7733', display: 'flex', alignItems: 'center', gap: 7 }}>
                  Open Cinema Theater <ArrowRight size={15} />
                </span>
                <span style={{ fontSize: 11.5, color: T.cardSubText, fontWeight: 600, transition: 'color 0.35s ease' }}>Multi-Source 4K</span>
              </div>
            </div>

            {/* CARD 2: CHAT */}
            <div
              onClick={onOpenChat}
              onMouseEnter={() => setHoveredCard('chat')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: T.cardBgChat(hoveredCard === 'chat'),
                border: T.cardBorderChat(hoveredCard === 'chat'),
                borderRadius: 22, padding: '26px 28px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: 240,
                boxShadow: T.cardShadow('rgba(34,197,94)', hoveredCard === 'chat'),
                transform: hoveredCard === 'chat' ? 'translateY(-4px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 140, height: 140,
                background: L
                  ? 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 15,
                    background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 6px 18px rgba(34,197,94,0.45)'
                  }}>
                    <MessageSquare size={24} />
                  </div>
                  <span style={{
                    fontSize: 10.5, fontWeight: 800,
                    background: 'rgba(34,197,94,0.16)', border: '1px solid rgba(34,197,94,0.3)',
                    color: '#22c55e', padding: '4px 10px', borderRadius: 20,
                    letterSpacing: '0.5px', textTransform: 'uppercase'
                  }}>WhatsApp E2EE</span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: T.cardTitle, letterSpacing: '-0.3px', transition: 'color 0.35s ease' }}>
                  Lounge &amp; Direct Chats
                </h3>
                <p style={{ fontSize: 13.5, color: T.cardDesc, margin: 0, lineHeight: 1.55, transition: 'color 0.35s ease' }}>
                  Real-time group lounge, 1-on-1 private encrypted direct messages, voice notes, stickers, and reactions.
                </p>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T.cardDivider}`,
                transition: 'border-color 0.35s ease'
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 7 }}>
                  Open Lounge Messages <ArrowRight size={15} />
                </span>
                <span style={{ fontSize: 11.5, color: T.cardSubText, fontWeight: 600, transition: 'color 0.35s ease' }}>
                  {roomUsers.length} Online
                </span>
              </div>
            </div>

            {/* CARD 3: AI */}
            <div
              onClick={onOpenAI}
              onMouseEnter={() => setHoveredCard('ai')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: T.cardBgAi(hoveredCard === 'ai'),
                border: T.cardBorderAi(hoveredCard === 'ai'),
                borderRadius: 22, padding: '26px 28px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: 240,
                boxShadow: T.cardShadow('rgba(168,85,247)', hoveredCard === 'ai'),
                transform: hoveredCard === 'ai' ? 'translateY(-4px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative', overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute', top: -30, right: -30, width: 140, height: 140,
                background: L
                  ? 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{
                    width: 50, height: 50, borderRadius: 15,
                    background: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', boxShadow: '0 6px 18px rgba(168,85,247,0.45)'
                  }}>
                    <Bot size={24} />
                  </div>
                  <span style={{
                    fontSize: 10.5, fontWeight: 800,
                    background: 'rgba(168,85,247,0.16)', border: '1px solid rgba(168,85,247,0.3)',
                    color: '#c084fc', padding: '4px 10px', borderRadius: 20,
                    letterSpacing: '0.5px', textTransform: 'uppercase'
                  }}>Groq 70B AI</span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: T.cardTitle, letterSpacing: '-0.3px', transition: 'color 0.35s ease' }}>
                  ViAM AI Cinema Genie
                </h3>
                <p style={{ fontSize: 13.5, color: T.cardDesc, margin: 0, lineHeight: 1.55, transition: 'color 0.35s ease' }}>
                  Ask ending explanations, movie plot trivia, neural search, and live movie recommendations with <code style={{ fontSize: 12, background: L ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: 4 }}>/play &lt;movie&gt;</code>.
                </p>
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginTop: 22, paddingTop: 16, borderTop: `1px solid ${T.cardDivider}`,
                transition: 'border-color 0.35s ease'
              }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 7 }}>
                  Consult ViAM AI <ArrowRight size={15} />
                </span>
                <span style={{ fontSize: 11.5, color: T.cardSubText, fontWeight: 600, transition: 'color 0.35s ease' }}>Llama 3.3 70B</span>
              </div>
            </div>
          </div>
        </div>

        {/* ══ EXPANSION STATIONS ══ */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{
              fontSize: 16, fontWeight: 800, margin: 0,
              display: 'flex', alignItems: 'center', gap: 8, color: T.sectionTitle,
              transition: 'color 0.35s ease'
            }}>
              <Zap size={16} color="#eab308" />
              <span>Voice, Mesh &amp; Expansion Stations</span>
            </h3>
            <span style={{ fontSize: 11.5, color: T.sectionSub, transition: 'color 0.35s ease' }}>Modular suites for your lounge</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            {/* Station: HD Call */}
            <div
              onClick={() => onOpenCall(true)}
              style={{
                background: T.stationBg,
                border: `1px solid ${T.stationBorder}`,
                borderRadius: 18, padding: '18px 20px',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 16,
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(12px)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.background = L ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = T.stationBorder;
                e.currentTarget.style.background = T.stationBg;
                e.currentTarget.style.transform = '';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', boxShadow: '0 4px 12px rgba(2,132,199,0.35)'
              }}>
                <Video size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: T.stationTitle, transition: 'color 0.35s ease' }}>WebRTC HD Call</div>
                <div style={{ fontSize: 12, color: T.stationDesc, marginTop: 2, transition: 'color 0.35s ease' }}>Direct peer-to-peer video &amp; audio</div>
              </div>
              <ChevronRight size={17} color={L ? '#8a7060' : '#64748b'} />
            </div>

            {/* Station: Audio Lounge */}
            <div style={{
              background: L ? 'rgba(255,255,255,0.65)' : 'rgba(17,20,30,0.45)',
              border: `1px solid ${L ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 18, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              backdropFilter: 'blur(12px)',
              transition: 'background 0.4s ease, border-color 0.35s ease'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'linear-gradient(135deg, #10b981, #047857)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
              }}>
                <Music size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: T.stationTitle, transition: 'color 0.35s ease' }}>Audio Lounge</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '1px 6px', borderRadius: 4 }}>BETA</span>
                </div>
                <div style={{ fontSize: 12, color: T.stationDesc, marginTop: 2, transition: 'color 0.35s ease' }}>Synchronized music &amp; lo-fi stations</div>
              </div>
            </div>

            {/* Station: Arcade */}
            <div style={{
              background: L ? 'rgba(255,255,255,0.65)' : 'rgba(17,20,30,0.45)',
              border: `1px solid ${L ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 18, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              backdropFilter: 'blur(12px)',
              transition: 'background 0.4s ease, border-color 0.35s ease'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', boxShadow: '0 4px 12px rgba(245,158,11,0.25)'
              }}>
                <Gamepad2 size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: T.stationTitle, transition: 'color 0.35s ease' }}>Couple Arcade</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '1px 6px', borderRadius: 4 }}>SOON</span>
                </div>
                <div style={{ fontSize: 12, color: T.stationDesc, marginTop: 2, transition: 'color 0.35s ease' }}>Cinema trivia &amp; co-op guessing games</div>
              </div>
            </div>

            {/* Station: Memory Vault */}
            <div style={{
              background: L ? 'rgba(255,255,255,0.65)' : 'rgba(17,20,30,0.45)',
              border: `1px solid ${L ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 18, padding: '18px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              backdropFilter: 'blur(12px)',
              transition: 'background 0.4s ease, border-color 0.35s ease'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', boxShadow: '0 4px 12px rgba(236,72,153,0.25)'
              }}>
                <Image size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: T.stationTitle, transition: 'color 0.35s ease' }}>Memory Vault</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(236,72,153,0.2)', color: '#ec4899', padding: '1px 6px', borderRadius: 4 }}>SOON</span>
                </div>
                <div style={{ fontSize: 12, color: T.stationDesc, marginTop: 2, transition: 'color 0.35s ease' }}>Private encrypted photos &amp; timeline</div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
