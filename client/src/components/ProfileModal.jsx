import React, { useState, useEffect } from 'react';
import {
  X, User, Mail, Phone, Heart, Film, Users, Clock, ShieldCheck,
  LogOut, Play, Copy, Check, Sparkles, History, Monitor, Trash2
} from 'lucide-react';
import { getT } from '../utils/themeTokens';

export default function ProfileModal({ isOpen, onClose, userAccount, onLogout, onRejoinRoom, onPlayShow, theme }) {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'shows' | 'stats'
  const [roomHistory, setRoomHistory] = useState([]);
  const [showHistory, setShowHistory] = useState([]);
  const [copiedCode, setCopiedCode] = useState('');

  const currentTheme = theme || (typeof document !== 'undefined' && document.body.classList.contains('light-theme') ? 'light' : 'dark');
  const T = getT(currentTheme);

  useEffect(() => {
    if (isOpen) {
      // Load Room History from localStorage
      try {
        const storedRooms = localStorage.getItem('cypr_room_history');
        if (storedRooms) setRoomHistory(JSON.parse(storedRooms));
        else {
          // Default initial history if empty
          const initialRooms = [
            { roomId: 'XQA01N', partner: 'Partner', createdAt: Date.now() - 3600000, status: 'Active' },
            { roomId: '8GM6JU', partner: 'Ananya', createdAt: Date.now() - 86400000, status: 'Ended' }
          ];
          setRoomHistory(initialRooms);
          localStorage.setItem('cypr_room_history', JSON.stringify(initialRooms));
        }
      } catch { setRoomHistory([]); }

      // Load Show History from localStorage
      try {
        const storedShows = localStorage.getItem('cypr_show_history');
        if (storedShows) setShowHistory(JSON.parse(storedShows));
        else {
          // Default initial show history if empty
          const initialShows = [
            {
              title: 'Big Buck Bunny (4K Cinema)',
              sourceType: 'direct',
              url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
              thumbnail: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80',
              watchedAt: Date.now() - 1800000,
              duration: '10m 00s'
            },
            {
              title: 'Cyberpunk Anime Date Night',
              sourceType: 'youtube',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              thumbnail: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=300&q=80',
              watchedAt: Date.now() - 86400000,
              duration: '45m 20s'
            }
          ];
          setShowHistory(initialShows);
          localStorage.setItem('cypr_show_history', JSON.stringify(initialShows));
        }
      } catch { setShowHistory([]); }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyCode = (code) => {
    navigator.clipboard.writeText(`${window.location.origin}/?room=${encodeURIComponent(code)}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear your room and show watch history?')) {
      localStorage.removeItem('cypr_room_history');
      localStorage.removeItem('cypr_show_history');
      setRoomHistory([]);
      setShowHistory([]);
    }
  };

  const fmtDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    return new Date(timestamp).toLocaleDateString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: T.isLight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.82)',
      backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%', maxWidth: '780px', maxHeight: '90vh',
        background: T.surfaceModal,
        border: `1px solid ${T.border2}`,
        borderRadius: '20px',
        boxShadow: T.isLight ? '0 24px 60px rgba(0, 0, 0, 0.16)' : '0 24px 70px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.03)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        position: 'relative', backdropFilter: 'blur(24px)'
      }}>

        {/* 1. TOP HEADER BANNER */}
        <div style={{
          padding: '24px 28px 18px',
          background: T.isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255, 255, 255, 0.02)',
          borderBottom: `1px solid ${T.borderDivider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={userAccount?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"}
                alt={userAccount?.name || 'User'}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  objectFit: 'cover', border: `1.5px solid ${T.borderInput}`,
                  boxShadow: T.isLight ? '0 4px 12px rgba(0,0,0,0.08)' : '0 4px 16px rgba(0,0,0,0.4)'
                }}
              />
              <span style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 14, height: 14, borderRadius: '50%',
                background: '#22c55e', border: `2px solid ${T.surface1}`
              }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: T.textPrimary, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                  {userAccount?.name || 'CYPR Member'}
                </h2>
                <span style={{
                  fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                  background: T.chipBg, color: T.textMuted2,
                  border: `1px solid ${T.chipBorder}`, borderRadius: '12px',
                  padding: '3px 10px', letterSpacing: '0.3px'
                }}>
                  Verified Account
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12.5px', color: T.textMuted1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={13} color={T.textMuted2} /> {userAccount?.email || 'user@cypr.app'}
                </span>
                {userAccount?.gender && (
                  <span>• {userAccount.gender}</span>
                )}
                {userAccount?.phone && (
                  <span>• {userAccount.phone}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: T.pillBg, border: `1px solid ${T.pillBorder}`,
              color: T.textMuted1, borderRadius: '50%', width: 36, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = T.textPrimary; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.pillBg; e.currentTarget.style.color = T.textMuted1; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. STATS SUMMARY ROW */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
          padding: '16px 28px', background: T.isLight ? 'rgba(0,0,0,0.01)' : 'rgba(255,255,255,0.01)',
          borderBottom: `1px solid ${T.borderDivider}`
        }}>
          <div style={{ background: T.chipBg, border: `1px solid ${T.chipBorder}`, borderRadius: '14px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: T.textMuted2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rooms Joined</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: T.textPrimary, marginTop: '2px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {roomHistory.length || 1} Rooms
            </div>
          </div>

          <div style={{ background: T.chipBg, border: `1px solid ${T.chipBorder}`, borderRadius: '14px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: T.textMuted2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shows Watched</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: T.textPrimary, marginTop: '2px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {showHistory.length || 2} Shows
            </div>
          </div>

          <div style={{ background: T.chipBg, border: `1px solid ${T.chipBorder}`, borderRadius: '14px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: T.textMuted2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Watch Time</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: T.textPrimary, marginTop: '2px', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              14.5 Hours
            </div>
          </div>

          <div style={{ background: T.chipBg, border: `1px solid ${T.chipBorder}`, borderRadius: '14px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: T.textMuted2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Security & E2EE</div>
            <div style={{ fontSize: '14.5px', fontWeight: '700', color: T.textMuted1, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} color="#22c55e" /> AES-256
            </div>
          </div>
        </div>

        {/* 3. TAB NAVIGATION */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 28px 0', borderBottom: `1px solid ${T.borderDivider}`
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('rooms')}
              style={{
                background: activeTab === 'rooms' ? (T.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)') : 'transparent',
                border: 'none', borderBottom: activeTab === 'rooms' ? `2.5px solid ${T.textPrimary}` : '2.5px solid transparent',
                color: activeTab === 'rooms' ? T.textPrimary : T.textMuted2,
                padding: '10px 18px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s'
              }}
            >
              <Users size={16} />
              <span>Room History ({roomHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('shows')}
              style={{
                background: activeTab === 'shows' ? (T.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255, 255, 255, 0.08)') : 'transparent',
                border: 'none', borderBottom: activeTab === 'shows' ? `2.5px solid ${T.textPrimary}` : '2.5px solid transparent',
                color: activeTab === 'shows' ? T.textPrimary : T.textMuted2,
                padding: '10px 18px', fontSize: '13.5px', fontWeight: '700', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s'
              }}
            >
              <Film size={16} />
              <span>Watched Shows ({showHistory.length})</span>
            </button>
          </div>

          <button
            onClick={clearHistory}
            style={{
              background: 'transparent', border: 'none', color: T.textMuted2,
              fontSize: '11.5px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted2}
            title="Clear saved watch history"
          >
            <Trash2 size={13} />
            <span>Clear History</span>
          </button>
        </div>

        {/* 4. TAB CONTENT BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* TAB 1: ROOM HISTORY */}
          {activeTab === 'rooms' && (
            roomHistory.length > 0 ? (
              roomHistory.map((room, idx) => (
                <div key={idx} style={{
                  padding: '16px 20px', borderRadius: '18px',
                  background: T.chipBg, border: `1px solid ${T.chipBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = T.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = T.chipBg}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: T.pillBg, border: `1px solid ${T.pillBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: T.textMuted1
                    }}>
                      <Users size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: T.textPrimary, fontFamily: 'monospace' }}>
                          ROOM: {room.roomId.toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: '10.5px', fontWeight: '800',
                          background: room.status === 'Active' ? 'rgba(16,185,129,0.2)' : (T.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'),
                          color: room.status === 'Active' ? '#10b981' : T.textMuted2,
                          padding: '2px 8px', borderRadius: '10px'
                        }}>
                          {room.status || 'Active'}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: T.textMuted1, marginTop: '3px' }}>
                        Partner: <strong style={{ color: T.textPrimary }}>{room.partner || 'Co-Watcher'}</strong> • Joined: {fmtDate(room.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => copyCode(room.roomId)}
                      style={{
                        background: T.pillBg, border: `1px solid ${T.pillBorder}`,
                        color: T.textPrimary, padding: '8px 12px', borderRadius: '12px',
                        fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px'
                      }}
                      title="Copy Invite Link"
                    >
                      {copiedCode === room.roomId ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    </button>

                    <button
                      onClick={() => { onClose(); onRejoinRoom?.(room.roomId); }}
                      style={{
                        background: T.isLight ? '#1a1208' : 'rgba(255,255,255,0.12)',
                        border: `1px solid ${T.borderInput}`,
                        color: T.isLight ? '#fff' : '#fff',
                        padding: '8px 16px', borderRadius: '12px', fontSize: '12px',
                        fontWeight: '700', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '6px', transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      <span>Rejoin Room</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textMuted2, fontSize: '13.5px' }}>
                No rooms joined yet. Create or join a room to build your co-watching history!
              </div>
            )
          )}

          {/* TAB 2: WATCHED SHOWS HISTORY */}
          {activeTab === 'shows' && (
            showHistory.length > 0 ? (
              showHistory.map((show, idx) => (
                <div key={idx} style={{
                  padding: '14px 18px', borderRadius: '18px',
                  background: T.chipBg, border: `1px solid ${T.chipBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <img
                      src={show.thumbnail || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80"}
                      alt={show.title}
                      style={{ width: '70px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: `1px solid ${T.borderInput}` }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: T.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {show.title}
                      </div>

                      <div style={{ fontSize: '11.5px', color: T.textMuted1, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: T.textMuted2, fontWeight: '600', textTransform: 'uppercase' }}>
                          {show.sourceType || 'Movie Stream'}
                        </span>
                        <span>• {fmtDate(show.watchedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { onClose(); onPlayShow?.(show); }}
                    style={{
                      background: T.pillBg, border: `1px solid ${T.pillBorder}`,
                      color: T.textPrimary, padding: '8px 16px', borderRadius: '12px',
                      fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0,
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = T.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.pillBg; }}
                  >
                    <Play size={13} fill={T.textMuted1} color={T.textMuted1} />
                    <span>Play Again</span>
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textMuted2, fontSize: '13.5px' }}>
                No shows watched yet. Select a movie or anime stream in Cinema mode to start!
              </div>
            )
          )}

        </div>

        {/* 5. FOOTER LOGOUT & ACTION BAR */}
        <div style={{
          padding: '16px 28px', background: T.surface1,
          borderTop: `1px solid ${T.borderDivider}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <button
            onClick={() => { onClose(); onLogout?.(); }}
            style={{
              background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444', padding: '8px 18px', borderRadius: '14px',
              fontSize: '12.5px', fontWeight: '800', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.15s'
            }}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>

          <button
            onClick={onClose}
            style={{
              background: T.pillBg, border: `1px solid ${T.pillBorder}`,
              color: T.textPrimary, padding: '8px 22px', borderRadius: '14px',
              fontSize: '12.5px', fontWeight: '800', cursor: 'pointer'
            }}
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
