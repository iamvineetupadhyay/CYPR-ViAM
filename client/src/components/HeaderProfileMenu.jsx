import React, { useState, useRef, useEffect } from 'react';
import { User, History, LogOut, ChevronDown, ShieldCheck, Sparkles, Sliders, ExternalLink } from 'lucide-react';
import { getT } from '../utils/themeTokens';

export default function HeaderProfileMenu({ userAccount, onOpenProfile, onOpenHistory, onLogout, dropUp = false, theme }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  const currentTheme = theme || (typeof document !== 'undefined' && document.body.classList.contains('light-theme') ? 'light' : 'dark');
  const T = getT(currentTheme);

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
      {/* Mature Header Profile Trigger Chip */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: isOpen ? (T.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)') : T.pillBg,
          border: isOpen ? (T.isLight ? '1px solid rgba(0, 0, 0, 0.2)' : '1px solid rgba(255, 255, 255, 0.2)') : `1px solid ${T.pillBorder}`,
          borderRadius: '20px', padding: '3px 10px 3px 4px', cursor: 'pointer',
          boxShadow: isOpen ? (T.isLight ? '0 4px 16px rgba(0, 0, 0, 0.1)' : '0 4px 20px rgba(0, 0, 0, 0.5)') : 'none',
          transition: 'all 0.15s ease', outline: 'none'
        }}
        onMouseEnter={e => { if (!isOpen) { e.currentTarget.style.background = T.isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'; } }}
        onMouseLeave={e => { if (!isOpen) { e.currentTarget.style.background = T.pillBg; } }}
        title="Account & Profile Options"
      >
        <div style={{ position: 'relative', width: '26px', height: '26px' }}>
          <img
            src={user.avatar || defaultAvatar}
            alt={user.name}
            onError={e => { e.currentTarget.src = defaultAvatar; }}
            style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${T.borderInput}` }}
          />
          <span style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 7, height: 7, borderRadius: '50%',
            background: '#22c55e', border: `1.5px solid ${T.surface1}`
          }} />
        </div>

        <span style={{
          fontSize: '12.5px', fontWeight: '600', color: T.textPrimary,
          fontFamily: 'Plus Jakarta Sans, sans-serif', maxWidth: '90px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {(user.name || '').split(' ')[0]}
        </span>

        <ChevronDown
          size={12}
          color={T.textMuted2}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />
      </button>

      {/* Mature Executive Translucent Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          left: dropUp ? 0 : 'auto',
          right: dropUp ? 'auto' : 0,
          bottom: dropUp ? 'calc(100% + 8px)' : 'auto',
          top: dropUp ? 'auto' : 'calc(100% + 8px)',
          width: '240px', background: T.dropdownBg,
          border: `1px solid ${T.dropdownBorder}`,
          borderRadius: '14px', padding: '6px',
          boxShadow: T.isLight ? '0 16px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)' : '0 20px 45px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.03)',
          zIndex: 9999, animation: 'fadeIn 0.15s ease-out',
          backdropFilter: 'blur(24px)'
        }}>
          {/* User Profile Brief Card Header */}
          <div style={{
            padding: '10px 10px 10px',
            borderBottom: `1px solid ${T.borderDivider}`,
            marginBottom: '4px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <img
              src={user.avatar || defaultAvatar}
              alt={user.name}
              onError={e => { e.currentTarget.src = defaultAvatar; }}
              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${T.borderInput}`, flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13.5px', fontWeight: '600', color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </div>
              <div style={{ fontSize: '11px', color: T.textMuted2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                {user.email || 'Verified Account'}
              </div>
            </div>
          </div>

          {/* Option 1: Profile & Preferences */}
          <button
            onClick={() => { setIsOpen(false); onOpenProfile?.(); }}
            style={{
              width: '100%', padding: '9px 10px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: T.textPrimary,
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.12s', textAlign: 'left'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.dropdownHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <User size={15} color={T.textMuted2} />
              <span>Profile & Settings</span>
            </div>
            <span style={{ fontSize: '10.5px', color: T.textMuted2, background: T.chipBg, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${T.chipBorder}` }}>Edit</span>
          </button>

          {/* Option 2: Watch & Room History */}
          <button
            onClick={() => { setIsOpen(false); onOpenHistory?.(); }}
            style={{
              width: '100%', padding: '9px 10px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: T.textPrimary,
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.12s', textAlign: 'left'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.dropdownHover; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <History size={15} color={T.textMuted2} />
              <span>Watch History</span>
            </div>
            <span style={{ fontSize: '10.5px', color: T.textMuted2, background: T.chipBg, padding: '2px 6px', borderRadius: '4px', border: `1px solid ${T.chipBorder}` }}>Logs</span>
          </button>

          {/* Option 3: Security & E2EE Info */}
          <div style={{
            padding: '8px 10px', margin: '3px 0',
            background: T.chipBg,
            borderRadius: '8px', border: `1px solid ${T.chipBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: T.textMuted1, fontWeight: '500' }}>
              <ShieldCheck size={14} color="#22c55e" />
              <span>AES-256 Verified</span>
            </div>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
          </div>

          <div style={{ height: '1px', background: T.borderDivider, margin: '4px 0' }} />

          {/* Option 4: Sign Out / Logout */}
          <button
            onClick={() => { setIsOpen(false); onLogout?.(); }}
            style={{
              width: '100%', padding: '9px 10px', borderRadius: '8px',
              background: 'transparent', border: 'none', color: '#ef4444',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '9px',
              transition: 'all 0.12s', textAlign: 'left'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={15} color="#ef4444" />
            <span>Sign Out / Leave</span>
          </button>
        </div>
      )}
    </div>
  );
}
