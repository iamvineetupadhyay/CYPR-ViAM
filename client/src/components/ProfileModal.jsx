import React, { useState, useEffect } from 'react';
import {
  X, User, Mail, Phone, Heart, Film, Users, Clock, ShieldCheck,
  LogOut, Play, Copy, Check, Sparkles, History, Monitor, Trash2
} from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, userAccount, onLogout, onRejoinRoom, onPlayShow }) {
  const [activeTab, setActiveTab] = useState('rooms'); // 'rooms' | 'shows' | 'stats'
  const [roomHistory, setRoomHistory] = useState([]);
  const [showHistory, setShowHistory] = useState([]);
  const [copiedCode, setCopiedCode] = useState('');

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
      background: 'rgba(5, 3, 2, 0.88)',
      backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px', animation: 'fadeIn 0.25s ease-out'
    }}>
      <div style={{
        width: '100%', maxWidth: '780px', maxHeight: '90vh',
        background: '#0e0a08',
        border: '1.5px solid rgba(255, 85, 0, 0.35)',
        borderRadius: '28px',
        boxShadow: '0 30px 90px rgba(0,0,0,0.9), 0 0 40px rgba(255,85,0,0.2)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        position: 'relative'
      }}>

        {/* 1. TOP HEADER BANNER */}
        <div style={{
          padding: '24px 28px 18px',
          background: 'linear-gradient(135deg, rgba(255,85,0,0.15), rgba(128,0,255,0.1))',
          borderBottom: '1px solid rgba(255,85,0,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={userAccount?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"}
                alt={userAccount?.name || 'User'}
                style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  objectFit: 'cover', border: '2.5px solid #ff5500',
                  boxShadow: '0 0 20px rgba(255,85,0,0.4)'
                }}
              />
              <span style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 14, height: 14, borderRadius: '50%',
                background: '#10b981', border: '2px solid #0e0a08'
              }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '800', color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                  {userAccount?.name || 'CYPR Member'}
                </h2>
                <span style={{
                  fontSize: '11px', fontWeight: '800', textTransform: 'uppercase',
                  background: 'rgba(255,85,0,0.2)', color: '#ff5500',
                  border: '1px solid rgba(255,85,0,0.5)', borderRadius: '12px',
                  padding: '3px 10px', letterSpacing: '0.5px'
                }}>
                  👑 Pro Duo
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '6px', fontSize: '12.5px', color: 'rgba(255,255,255,0.6)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Mail size={13} color="#ff5500" /> {userAccount?.email || 'user@cypr.app'}
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
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#fff', borderRadius: '50%', width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,85,0,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. STATS SUMMARY ROW */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px',
          padding: '16px 28px', background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ background: 'rgba(255,85,0,0.08)', border: '1px solid rgba(255,85,0,0.2)', borderRadius: '16px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Rooms Joined</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#ff5500', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>
              {roomHistory.length || 1} Rooms
            </div>
          </div>

          <div style={{ background: 'rgba(128,0,255,0.08)', border: '1px solid rgba(128,0,255,0.2)', borderRadius: '16px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Shows Watched</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#a855f7', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>
              {showHistory.length || 2} Shows
            </div>
          </div>

          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Watch Time</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#10b981', marginTop: '2px', fontFamily: 'Outfit, sans-serif' }}>
              14.5 Hours
            </div>
          </div>

          <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '16px', padding: '12px 16px' }}>
            <div style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Security & E2EE</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f43f5e', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={16} /> AES-256
            </div>
          </div>
        </div>

        {/* 3. TAB NAVIGATION */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 28px 0', borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveTab('rooms')}
              style={{
                background: activeTab === 'rooms' ? 'rgba(255,85,0,0.15)' : 'transparent',
                border: 'none', borderBottom: activeTab === 'rooms' ? '2.5px solid #ff5500' : '2.5px solid transparent',
                color: activeTab === 'rooms' ? '#ff5500' : 'rgba(255,255,255,0.6)',
                padding: '10px 18px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.15s'
              }}
            >
              <Users size={16} />
              <span>Room History ({roomHistory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('shows')}
              style={{
                background: activeTab === 'shows' ? 'rgba(255,85,0,0.15)' : 'transparent',
                border: 'none', borderBottom: activeTab === 'shows' ? '2.5px solid #ff5500' : '2.5px solid transparent',
                color: activeTab === 'shows' ? '#ff5500' : 'rgba(255,255,255,0.6)',
                padding: '10px 18px', fontSize: '13.5px', fontWeight: '800', cursor: 'pointer',
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
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: '11.5px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
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
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  transition: 'all 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,85,0,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: 'rgba(255,85,0,0.15)', border: '1.5px solid rgba(255,85,0,0.4)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', fontWeight: '900', color: '#ff5500'
                    }}>
                      💕
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff', fontFamily: 'monospace' }}>
                          ROOM: {room.roomId.toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: '10.5px', fontWeight: '800',
                          background: room.status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)',
                          color: room.status === 'Active' ? '#10b981' : 'rgba(255,255,255,0.5)',
                          padding: '2px 8px', borderRadius: '10px'
                        }}>
                          {room.status || 'Active'}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
                        Partner: <strong style={{ color: '#fff' }}>{room.partner || 'Co-Watcher'}</strong> • Joined: {fmtDate(room.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => copyCode(room.roomId)}
                      style={{
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', padding: '8px 12px', borderRadius: '12px',
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
                        background: '#ff5500', border: 'none', color: '#fff',
                        padding: '8px 16px', borderRadius: '12px', fontSize: '12px',
                        fontWeight: '800', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', gap: '6px', boxShadow: '0 0 16px rgba(255,85,0,0.4)'
                      }}
                    >
                      <span>Rejoin Room 🚀</span>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '13.5px' }}>
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
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                    <img
                      src={show.thumbnail || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80"}
                      alt={show.title}
                      style={{ width: '70px', height: '48px', borderRadius: '10px', objectFit: 'cover', border: '1px solid rgba(255,85,0,0.3)' }}
                    />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {show.title}
                      </div>

                      <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#ff5500', fontWeight: '700', textTransform: 'uppercase' }}>
                          {show.sourceType || 'Movie Stream'}
                        </span>
                        <span>• {fmtDate(show.watchedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => { onClose(); onPlayShow?.(show); }}
                    style={{
                      background: 'rgba(255,85,0,0.15)', border: '1px solid rgba(255,85,0,0.4)',
                      color: '#ff5500', padding: '8px 16px', borderRadius: '12px',
                      fontSize: '12px', fontWeight: '800', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0
                    }}
                  >
                    <Play size={13} fill="#ff5500" />
                    <span>Play Again</span>
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255,255,255,0.4)', fontSize: '13.5px' }}>
                No shows watched yet. Select a movie or anime stream in Cinema mode to start!
              </div>
            )
          )}

        </div>

        {/* 5. FOOTER LOGOUT & ACTION BAR */}
        <div style={{
          padding: '16px 28px', background: '#090705',
          borderTop: '1px solid rgba(255,255,255,0.08)',
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
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#fff', padding: '8px 22px', borderRadius: '14px',
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
