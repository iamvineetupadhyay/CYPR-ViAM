import React, { useState, useRef, useEffect } from 'react';
import { User, History, LogOut, ChevronDown, ShieldCheck, Sparkles, Sliders, ExternalLink } from 'lucide-react';

export default function HeaderProfileMenu({ userAccount, onOpenProfile, onOpenHistory, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const user = userAccount || (() => {
    try {
      const saved = localStorage.getItem('cypr_user_account');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  })();

  // Close on outside click or escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!user) return null;

  const defaultAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80";

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Header Profile Trigger Chip */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: isOpen ? 'rgba(255,85,0,0.15)' : 'rgba(255,255,255,0.06)',
          border: isOpen ? '1px solid #ff5500' : '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px', padding: '3px 10px 3px 4px', cursor: 'pointer',
          boxShadow: isOpen ? '0 0 16px rgba(255,85,0,0.25)' : 'none',
          transition: 'all 0.15s ease', outline: 'none'
        }}
        onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; } }}
        onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; } }}
        title="Account & Profile Options"
      >
        <div style={{ position: 'relative', width: '26px', height: '26px' }}>
          <img
            src={user.avatar || defaultAvatar}
            alt={user.name}
            onError={e => { e.currentTarget.src = defaultAvatar; }}
            style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,85,0,0.6)' }}
          />
          <span style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 7, height: 7, borderRadius: '50%',
            background: '#22c55e', border: '1.5px solid #141417'
          }} />
        </div>

        <span style={{
          fontSize: '12px', fontWeight: '700', color: '#f4f4f5',
          fontFamily: 'Inter, sans-serif', maxWidth: '90px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {(user.name || '').split(' ')[0]}
        </span>

        <ChevronDown
          size={12}
          color="#a1a1aa"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </button>

      {/* Mature Executive Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: '240px', background: '#121215',
          border: '1px solid #27272a',
          borderRadius: '14px', padding: '6px',
          boxShadow: '0 20px 45px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04)',
          zIndex: 9999, animation: 'fadeIn 0.15s ease-out',
          backdropFilter: 'blur(20px)'
        }}>
          {/* User Profile Brief Card Header */}
          <div style={{
            padding: '10px 10px 10px',
            borderBottom: '1px solid #222226',
            marginBottom: '4px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <img
              src={user.avatar || defaultAvatar}
              alt={user.name}
              onError={e => { e.currentTarget.src = defaultAvatar; }}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #ff5500', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13.5px', fontWeight: '700', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '11px', color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                {user.email || 'Pro Member'}
              </div>
            </div>
          </div>

          {/* Option 1: Profile & Preferences */}
          <button
            onClick={() => { setIsOpen(false); onOpenProfile?.(); }}
            style={{
              width: '100%', padding: '9px 10px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: '#f4f4f5',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.12s', textAlign: 'left'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1c1c22'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <User size={15} color="#ff5500" />
              <span>Profile & Settings</span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#71717a', background: '#1c1c22', padding: '2px 6px', borderRadius: '4px' }}>Edit</span>
          </button>

          {/* Option 2: Watch & Room History */}
          <button
            onClick={() => { setIsOpen(false); onOpenHistory?.(); }}
            style={{
              width: '100%', padding: '9px 10px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: '#f4f4f5',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'background 0.12s', textAlign: 'left'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1c1c22'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <History size={15} color="#a855f7" />
              <span>Watch History</span>
            </div>
            <span style={{ fontSize: '10.5px', color: '#71717a', background: '#1c1c22', padding: '2px 6px', borderRadius: '4px' }}>Logs</span>
          </button>

          {/* Option 3: Security & E2EE Info */}
          <div style={{
            padding: '8px 10px', margin: '3px 0',
            background: 'rgba(34, 197, 94, 0.06)',
            borderRadius: '8px', border: '1px solid rgba(34, 197, 94, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#22c55e', fontWeight: '600' }}>
              <ShieldCheck size={14} />
              <span>AES-256 Verified</span>
            </div>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
          </div>

          <div style={{ height: '1px', background: '#222226', margin: '4px 0' }} />

          {/* Option 4: Sign Out / Logout */}
          <button
            onClick={() => { setIsOpen(false); onLogout?.(); }}
            style={{
              width: '100%', padding: '9px 10px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: '#ef4444',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '9px',
              transition: 'all 0.12s', textAlign: 'left'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={15} color="#ef4444" />
            <span>Sign Out / Leave</span>
          </button>
        </div>
      )}
    </div>
  );
}
