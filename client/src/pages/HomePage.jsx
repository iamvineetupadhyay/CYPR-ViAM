import React, { useState } from 'react';
import {
  Film, MessageSquare, Bot, Phone, Video, Sparkles,
  Music, Gamepad2, Image, ShieldCheck, Users, Copy, Check,
  LogOut, ArrowRight, Play, Pause, Zap, Layers, Lock, Flame,
  Radio, Compass, ChevronRight, User, Tv, Wifi, Globe,
  Headphones, MonitorPlay, MessageCircle, Sliders, ExternalLink,
  Crown
} from 'lucide-react';
import HeaderProfileMenu from '../components/HeaderProfileMenu';

export default function HomePage({
  currentUser,
  roomId,
  roomUsers = [],
  mediaState,
  onNavigate,
  onOpenCinema,
  onOpenChat,
  onOpenAI,
  onOpenCall,
  onOpenProfile,
  onLeave
}) {
  const [copied, setCopied] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isMediaActive = Boolean(mediaState?.url);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#07080c',
      backgroundImage: `
        radial-gradient(circle at 15% 15%, rgba(255, 85, 0, 0.08) 0%, transparent 45%),
        radial-gradient(circle at 85% 20%, rgba(168, 85, 247, 0.07) 0%, transparent 45%),
        radial-gradient(circle at 50% 80%, rgba(34, 197, 94, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 50% 10%, #111420 0%, #07080c 70%)
      `,
      color: '#ffffff',
      fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflowX: 'hidden'
    }}>

      {/* ══════════════════════════════════════════════════════════════
          1. TOP APP HEADER & STATUS BAR
      ══════════════════════════════════════════════════════════════ */}
      <header style={{
        height: 64,
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(10, 12, 18, 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Standalone Large Brand Logo + Room Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <img
              src="/viam_logo.png"
              alt="CYPR ViAM"
              style={{
                height: 62,
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 16px rgba(255,85,0,0.55))',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>

          <div
            onClick={copyInvite}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 24,
              padding: '4px 12px 4px 10px',
              cursor: 'pointer',
              fontSize: 12,
              color: '#a1a1aa',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(8px)'
            }}
            title="Click to copy invite link"
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ff5500';
              e.currentTarget.style.background = 'rgba(255, 85, 0, 0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ color: '#ff661a', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.5px' }}>
              {roomId}
            </span>
            {copied ? <Check size={13} color="#22c55e" /> : <Copy size={13} color="#71717a" />}
          </div>
        </div>

        {/* Quick Top Actions & Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOpenCinema}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(255, 85, 0, 0.12)',
              border: '1px solid rgba(255, 85, 0, 0.3)',
              color: '#ff7733',
              padding: '7px 16px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#ff5500';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(255,85,0,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 85, 0, 0.12)';
              e.currentTarget.style.color = '#ff7733';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Film size={14} />
            <span>Cinema</span>
          </button>

          <button
            onClick={onOpenChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.09)',
              color: '#d4d4d8',
              padding: '7px 16px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#22c55e';
              e.currentTarget.style.color = '#22c55e';
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.08)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)';
              e.currentTarget.style.color = '#d4d4d8';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            }}
          >
            <MessageSquare size={14} />
            <span>Lounge Chat</span>
          </button>

          <button
            onClick={onOpenAI}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              padding: '7px 16px',
              borderRadius: 20,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#a855f7';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.boxShadow = '0 0 16px rgba(168,85,247,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)';
              e.currentTarget.style.color = '#c084fc';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <Sparkles size={14} />
            <span>ViAM AI</span>
          </button>

          <div style={{ width: 1, height: 22, background: 'rgba(255, 255, 255, 0.1)', margin: '0 4px' }} />

          <HeaderProfileMenu
            userAccount={currentUser}
            onOpenProfile={onOpenProfile}
            onOpenHistory={onOpenProfile}
            onLogout={onLeave}
          />
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          2. CINEMATIC COMMAND HERO BANNER
      ══════════════════════════════════════════════════════════════ */}
      <main style={{
        maxWidth: 1280,
        width: '100%',
        margin: '0 auto',
        padding: '32px 28px 48px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 32
      }}>

        {/* Master Bridge Hero Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(22, 25, 38, 0.85) 0%, rgba(13, 14, 22, 0.95) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 24,
          padding: '32px 36px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 28,
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle Ambient Backlight in Hero */}
          <div style={{
            position: 'absolute',
            top: -60,
            right: 120,
            width: 320,
            height: 240,
            background: 'radial-gradient(circle, rgba(255, 85, 0, 0.15) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(30px)'
          }} />

          {/* Left Text Block */}
          <div style={{ maxWidth: 660, zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(34, 197, 94, 0.12)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                color: '#22c55e',
                fontSize: 11.5,
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 20,
                letterSpacing: '0.4px'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
                ROOM ACTIVE • {roomUsers.length} ONLINE
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#a1a1aa',
                fontSize: 11.5,
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: 20
              }}>
                <ShieldCheck size={13} color="#22c55e" />
                <span>AES-256 E2EE Verified</span>
              </span>

              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#a1a1aa',
                fontSize: 11.5,
                fontWeight: 600,
                padding: '4px 12px',
                borderRadius: 20
              }}>
                <Zap size={13} color="#eab308" />
                <span>0ms Sync Mesh</span>
              </span>
            </div>

            <h1 style={{
              fontSize: '34px',
              fontWeight: 900,
              fontFamily: 'Outfit, sans-serif',
              margin: '0 0 12px',
              lineHeight: 1.15,
              letterSpacing: '-0.5px'
            }}>
              Welcome to the <span style={{
                background: 'linear-gradient(135deg, #ff7733 0%, #ff5500 50%, #e04400 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(255,85,0,0.3)'
              }}>CYPR Lounge</span> Hub
            </h1>

            <p style={{
              fontSize: 14.5,
              color: '#94a3b8',
              margin: '0 0 20px',
              lineHeight: 1.6,
              maxWidth: 580
            }}>
              Your centralized command deck for synchronized 4K co-watching, encrypted WhatsApp-style messaging, crystal clear WebRTC calls, and Groq 70B AI cinema intelligence.
            </p>

            {/* Room Members Avatars Strip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: 4 }}>
                {roomUsers.slice(0, 5).map((user, idx) => (
                  <div
                    key={user.socketId || idx}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: user.avatar ? 'transparent' : 'linear-gradient(135deg, #ff5500, #9333ea)',
                      border: '2px solid #0d0e16',
                      marginLeft: idx > 0 ? -8 : 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#fff',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                      overflow: 'hidden'
                    }}
                    title={user.name}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
                {roomUsers.length === 1
                  ? 'Solo Lounge (Share link with friends)'
                  : `${roomUsers.length} members connected in room`}
              </span>
            </div>
          </div>

          {/* Right Action / Active Stream Card */}
          <div style={{
            minWidth: 280,
            background: 'rgba(15, 17, 26, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 18,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            zIndex: 2
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Theater State
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: isMediaActive ? '#22c55e' : '#a1a1aa',
                background: isMediaActive ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)',
                padding: '2px 8px',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                {isMediaActive ? (
                  <>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e' }} />
                    {mediaState?.isPlaying ? 'PLAYING' : 'PAUSED'}
                  </>
                ) : (
                  'IDLE / READY'
                )}
              </span>
            </div>

            <div style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: '#f4f4f5',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 240
            }}>
              {mediaState?.title && mediaState.title !== 'No movie selected' ? mediaState.title : 'No Media Playing'}
            </div>

            <button
              onClick={onOpenCinema}
              style={{
                background: 'linear-gradient(135deg, #ff661a 0%, #ff5500 50%, #e04400 100%)',
                border: 'none',
                color: '#fff',
                padding: '12px 20px',
                borderRadius: 12,
                fontSize: 13.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 24px rgba(255, 85, 0, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 30px rgba(255, 85, 0, 0.5)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 85, 0, 0.35)';
              }}
            >
              <Play size={15} fill="#fff" />
              <span>{isMediaActive ? 'Jump into Stream' : 'Launch Cinema Lounge'}</span>
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            3. CORE FACILITY NAVIGATION CARDS (PRIMARY HUBS)
        ══════════════════════════════════════════════════════════════ */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20
          }}>
            <h2 style={{
              fontSize: 18,
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              color: '#f1f5f9'
            }}>
              <Compass size={19} color="#ff661a" />
              <span>Lounge Facilities & Command Hubs</span>
            </h2>
            <span style={{ fontSize: 12, color: '#64748b' }}>Select any station to enter</span>
          </div>

          {/* 3 Main Pillar Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 22
          }}>

            {/* 🍿 CARD 1: CINEMA CO-WATCH LOUNGE */}
            <div
              onClick={onOpenCinema}
              onMouseEnter={() => setHoveredCard('cinema')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === 'cinema'
                  ? 'linear-gradient(145deg, rgba(255, 85, 0, 0.14) 0%, rgba(20, 23, 36, 0.98) 100%)'
                  : 'linear-gradient(145deg, rgba(255, 85, 0, 0.06) 0%, rgba(14, 16, 25, 0.95) 100%)',
                border: hoveredCard === 'cinema'
                  ? '1.5px solid rgba(255, 85, 0, 0.6)'
                  : '1.5px solid rgba(255, 85, 0, 0.22)',
                borderRadius: 22,
                padding: '26px 28px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 240,
                boxShadow: hoveredCard === 'cinema'
                  ? '0 20px 48px rgba(255, 85, 0, 0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                transform: hoveredCard === 'cinema' ? 'translateY(-4px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Backlight Glow Accent */}
              <div style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 140,
                height: 140,
                background: 'radial-gradient(circle, rgba(255,85,0,0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 15,
                    background: 'linear-gradient(135deg, #ff661a 0%, #b83200 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 6px 18px rgba(255,85,0,0.45)'
                  }}>
                    <Film size={24} />
                  </div>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: 'rgba(255,85,0,0.16)',
                    border: '1px solid rgba(255,85,0,0.3)',
                    color: '#ff7733',
                    padding: '4px 10px',
                    borderRadius: 20,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    0ms Sync Stream
                  </span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: '#fff', letterSpacing: '-0.3px' }}>
                  Cinema Co-Watch Lounge
                </h3>
                <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
                  Synchronized 4K streaming player with YouTube, direct MP4, multiple servers, and in-sync timeline controls.
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 22,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.07)'
              }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#ff7733',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7
                }}>
                  Open Cinema Theater <ArrowRight size={15} />
                </span>
                <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Multi-Source 4K</span>
              </div>
            </div>

            {/* 💬 CARD 2: WHATSAPP LOVE LOUNGE */}
            <div
              onClick={onOpenChat}
              onMouseEnter={() => setHoveredCard('chat')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === 'chat'
                  ? 'linear-gradient(145deg, rgba(34, 197, 94, 0.12) 0%, rgba(20, 23, 36, 0.98) 100%)'
                  : 'linear-gradient(145deg, rgba(34, 197, 94, 0.05) 0%, rgba(14, 16, 25, 0.95) 100%)',
                border: hoveredCard === 'chat'
                  ? '1.5px solid rgba(34, 197, 94, 0.6)'
                  : '1.5px solid rgba(34, 197, 94, 0.22)',
                borderRadius: 22,
                padding: '26px 28px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 240,
                boxShadow: hoveredCard === 'chat'
                  ? '0 20px 48px rgba(34, 197, 94, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                transform: hoveredCard === 'chat' ? 'translateY(-4px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Backlight Glow Accent */}
              <div style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 140,
                height: 140,
                background: 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 15,
                    background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 6px 18px rgba(34,197,94,0.45)'
                  }}>
                    <MessageSquare size={24} />
                  </div>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: 'rgba(34,197,94,0.16)',
                    border: '1px solid rgba(34,197,94,0.3)',
                    color: '#22c55e',
                    padding: '4px 10px',
                    borderRadius: 20,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    WhatsApp E2EE
                  </span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: '#fff', letterSpacing: '-0.3px' }}>
                  Lounge & Direct Chats
                </h3>
                <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
                  Real-time group lounge, 1-on-1 private encrypted direct messages, voice notes, stickers, and reactions.
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 22,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.07)'
              }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#22c55e',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7
                }}>
                  Open Lounge Messages <ArrowRight size={15} />
                </span>
                <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>
                  {roomUsers.length} Online
                </span>
              </div>
            </div>

            {/* 🤖 CARD 3: VIAM AI CINEMA GENIE */}
            <div
              onClick={onOpenAI}
              onMouseEnter={() => setHoveredCard('ai')}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === 'ai'
                  ? 'linear-gradient(145deg, rgba(168, 85, 247, 0.14) 0%, rgba(20, 23, 36, 0.98) 100%)'
                  : 'linear-gradient(145deg, rgba(168, 85, 247, 0.06) 0%, rgba(14, 16, 25, 0.95) 100%)',
                border: hoveredCard === 'ai'
                  ? '1.5px solid rgba(168, 85, 247, 0.6)'
                  : '1.5px solid rgba(168, 85, 247, 0.22)',
                borderRadius: 22,
                padding: '26px 28px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 240,
                boxShadow: hoveredCard === 'ai'
                  ? '0 20px 48px rgba(168, 85, 247, 0.22), inset 0 1px 0 rgba(255,255,255,0.1)'
                  : '0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
                transform: hoveredCard === 'ai' ? 'translateY(-4px)' : 'none',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Backlight Glow Accent */}
              <div style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 140,
                height: 140,
                background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
                pointerEvents: 'none'
              }} />

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: 15,
                    background: 'linear-gradient(135deg, #a855f7 0%, #6b21a8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    boxShadow: '0 6px 18px rgba(168,85,247,0.45)'
                  }}>
                    <Bot size={24} />
                  </div>
                  <span style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: 'rgba(168,85,247,0.16)',
                    border: '1px solid rgba(168,85,247,0.3)',
                    color: '#c084fc',
                    padding: '4px 10px',
                    borderRadius: 20,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    Groq 70B AI
                  </span>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px', color: '#fff', letterSpacing: '-0.3px' }}>
                  ViAM AI Cinema Genie
                </h3>
                <p style={{ fontSize: 13.5, color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
                  Ask ending explanations, movie plot trivia, neural search, and live movie recommendations with `/play &lt;movie&gt;`.
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 22,
                paddingTop: 16,
                borderTop: '1px solid rgba(255,255,255,0.07)'
              }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#c084fc',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7
                }}>
                  Consult ViAM AI <ArrowRight size={15} />
                </span>
                <span style={{ fontSize: 11.5, color: '#64748b', fontWeight: 600 }}>Llama 3.3 70B</span>
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            4. VOICE & MODULAR EXPANSION STATIONS
        ══════════════════════════════════════════════════════════════ */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16
          }}>
            <h3 style={{
              fontSize: 16,
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#e2e8f0'
            }}>
              <Zap size={16} color="#eab308" />
              <span>Voice, Mesh & Expansion Stations</span>
            </h3>
            <span style={{ fontSize: 11.5, color: '#64748b' }}>Modular suites for your lounge</span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16
          }}>

            {/* STATION 1: WebRTC Calling Station */}
            <div
              onClick={() => onOpenCall(true)}
              style={{
                background: 'rgba(17, 20, 30, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 18,
                padding: '18px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                transition: 'all 0.2s ease',
                backdropFilter: 'blur(12px)'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.background = 'rgba(17, 20, 30, 0.75)';
                e.currentTarget.style.transform = '';
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
              }}>
                <Video size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#fff' }}>WebRTC HD Call</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Direct peer-to-peer video & audio</div>
              </div>
              <ChevronRight size={17} color="#64748b" />
            </div>

            {/* STATION 2: Music & Audio Sync Lounge (Beta) */}
            <div
              style={{
                background: 'rgba(17, 20, 30, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 18,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                backdropFilter: 'blur(12px)'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: 'linear-gradient(135deg, #10b981, #047857)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}>
                <Music size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: '#fff' }}>Audio Lounge</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(16,185,129,0.2)', color: '#10b981', padding: '1px 6px', borderRadius: 4 }}>BETA</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Synchronized music & lo-fi stations</div>
              </div>
            </div>

            {/* STATION 3: Arcade & Mini-Games (Coming Soon) */}
            <div
              style={{
                background: 'rgba(17, 20, 30, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 18,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                backdropFilter: 'blur(12px)'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
              }}>
                <Gamepad2 size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: '#fff' }}>Couple Arcade</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(245,158,11,0.2)', color: '#f59e0b', padding: '1px 6px', borderRadius: 4 }}>SOON</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Cinema trivia & co-op guessing games</div>
              </div>
            </div>

            {/* STATION 4: Photo & Memory Vault (Coming Soon) */}
            <div
              style={{
                background: 'rgba(17, 20, 30, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 18,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                backdropFilter: 'blur(12px)'
              }}
            >
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: 'linear-gradient(135deg, #ec4899, #be185d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(236, 72, 153, 0.25)'
              }}>
                <Image size={21} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: '#fff' }}>Memory Vault</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, background: 'rgba(236,72,153,0.2)', color: '#ec4899', padding: '1px 6px', borderRadius: 4 }}>SOON</span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Private encrypted photos & timeline</div>
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
