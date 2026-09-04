import React, { useState, useEffect } from 'react';
import { Lock, Globe, Copy, Check, RefreshCw, Share2, ArrowRight, Users, X, LogIn, Plus, Sparkles, Key } from 'lucide-react';

function generateRandomRoomCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `viam-${suffix}`;
}

export default function RoomModal({ isOpen, onClose, onJoinRoom, defaultRoomId, initialMode = 'create', userAccount }) {
  const [userName, setUserName] = useState(() => userAccount?.name || localStorage.getItem('cypr_user_name') || '');
  const [mode, setMode] = useState(initialMode || (defaultRoomId ? 'join' : 'create'));
  const [roomType, setRoomType] = useState('private'); // 'private' | 'public'
  const [roomId, setRoomId] = useState(() => defaultRoomId || generateRandomRoomCode());
  const [maxCapacity, setMaxCapacity] = useState(2);
  const [passcode, setPasscode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const saved = userAccount?.name || localStorage.getItem('cypr_user_name') || '';
      if (saved && !userName) {
        setUserName(saved);
      }
    }
  }, [isOpen, userAccount]);

  useEffect(() => {
    if (defaultRoomId) {
      setRoomId(defaultRoomId);
      setMode('join');
    } else if (initialMode) {
      setMode(initialMode);
      if (initialMode === 'create' && (!roomId || roomId === defaultRoomId)) {
        setRoomId(generateRandomRoomCode());
      }
    }
  }, [defaultRoomId, initialMode]);

  if (!isOpen) return null;

  const generateNewCode = () => {
    setRoomId(generateRandomRoomCode());
  };

  const handleCodeChange = (e) => {
    let val = e.target.value.toLowerCase().trim();
    if (val.includes('?room=')) {
      val = val.split('?room=')[1].split('&')[0];
    }
    if (!val.startsWith('viam-')) {
      const clean = val.replace(/[^a-z0-9]/g, '').slice(0, 8);
      setRoomId(`viam-${clean}`);
    } else {
      const clean = val.slice(5).replace(/[^a-z0-9]/g, '').slice(0, 8);
      setRoomId(`viam-${clean}`);
    }
  };

  const getEffectiveCapacity = () => {
    return roomType === 'public' ? 100 : maxCapacity;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalName = userName.trim() || userAccount?.name || localStorage.getItem('cypr_user_name') || 'Guest User';
    const finalRoomId = (roomId || generateRandomRoomCode()).trim().toLowerCase();

    localStorage.setItem('cypr_user_name', finalName);

    onJoinRoom({
      name: finalName,
      roomId: finalRoomId,
      passcode: passcode.trim(),
      maxCapacity: mode === 'join' ? 2 : getEffectiveCapacity(),
      isPublic: mode === 'join' ? false : roomType === 'public',
      isCreateMode: mode === 'create'
    });
  };

  const shareableLink = `${window.location.origin}/?room=${encodeURIComponent(roomId.trim().toLowerCase())}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const capacityList = [2, 4, 8, 16];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(5, 5, 7, 0.88)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        maxWidth: '460px', width: '100%',
        background: '#09090b', border: '1.5px solid rgba(255, 85, 0, 0.3)',
        borderRadius: '22px', padding: '28px',
        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.95), 0 0 30px rgba(255,85,0,0.15)',
        position: 'relative', color: '#f4f4f5'
      }}>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: '18px', right: '18px',
              background: '#141417', border: '1px solid #27272a',
              color: '#71717a', borderRadius: '50%',
              width: '32px', height: '32px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#ff5500'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#71717a'; e.currentTarget.style.borderColor = '#27272a'; }}
          >
            <X size={16} />
          </button>
        )}

        {/* Minimalist Logo & Title */}
        <div style={{ textAlign: 'center', marginBottom: '18px' }}>
          <img src="/viam_logo.png" alt="VIAM" style={{ height: '48px', width: 'auto', marginBottom: '8px', objectFit: 'contain' }} />
          <h2 style={{ fontSize: '19px', fontWeight: '800', color: '#ffffff', margin: 0, letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {mode === 'create' ? <Sparkles size={18} color="#ff7733" /> : <Key size={18} color="#ff7733" />}
            <span>{mode === 'create' ? 'Create Co-Watch Lounge' : 'Join Existing Lounge'}</span>
          </h2>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '4px 0 0 0' }}>
            {mode === 'create' ? 'Configure your private room & invite your partner' : 'Enter room code to connect in real-time'}
          </p>
        </div>

        {/* Mode Selector Tabs (Create vs Join) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', background: '#141417', padding: '5px', borderRadius: '12px', border: '1px solid #27272a', marginBottom: '18px' }}>
          <button
            type="button"
            onClick={() => {
              setMode('create');
              if (!roomId.startsWith('viam-')) generateNewCode();
            }}
            style={{
              height: '38px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: mode === 'create' ? '#ff5500' : 'transparent',
              color: '#fff',
              fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: mode === 'create' ? '0 0 16px rgba(255,85,0,0.4)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <Plus size={15} /> Create Room
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            style={{
              height: '38px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: mode === 'join' ? '#ff5500' : 'transparent',
              color: '#fff',
              fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: mode === 'join' ? '0 0 16px rgba(255,85,0,0.4)' : 'none',
              transition: 'all 0.15s'
            }}
          >
            <LogIn size={15} /> Join Room
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Display Name Input */}
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Your Name
            </label>
            <input
              type="text"
              required
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              style={{
                width: '100%', height: '42px', background: '#141417',
                border: '1px solid #27272a', borderRadius: '10px',
                padding: '0 14px', fontSize: '14px', color: '#fff', outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#ff5500'}
              onBlur={e => e.currentTarget.style.borderColor = '#27272a'}
              autoFocus
            />
          </div>

          {/* Room Access Mode Selector — Only in Create Mode */}
          {mode === 'create' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Access Type
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#141417', padding: '4px', borderRadius: '10px', border: '1px solid #27272a' }}>
                <button
                  type="button"
                  onClick={() => setRoomType('private')}
                  style={{
                    height: '36px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    background: roomType === 'private' ? '#27272a' : 'transparent',
                    color: roomType === 'private' ? '#fff' : '#a1a1aa',
                    fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Lock size={13} /> Private
                </button>
                <button
                  type="button"
                  onClick={() => setRoomType('public')}
                  style={{
                    height: '36px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                    background: roomType === 'public' ? '#27272a' : 'transparent',
                    color: roomType === 'public' ? '#fff' : '#a1a1aa',
                    fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    transition: 'all 0.15s'
                  }}
                >
                  <Globe size={13} /> Public (100)
                </button>
              </div>
            </div>
          )}

          {/* Capacity Selector (Private Mode) — Only in Create Mode */}
          {mode === 'create' && roomType === 'private' && (
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Max Capacity
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {capacityList.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxCapacity(num)}
                    style={{
                      height: '38px', borderRadius: '8px', cursor: 'pointer',
                      background: maxCapacity === num ? '#ff5500' : '#141417',
                      border: maxCapacity === num ? '1px solid #ff5500' : '1px solid #27272a',
                      color: '#fff', fontSize: '13px', fontWeight: '700',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                      transition: 'all 0.15s'
                    }}
                  >
                    <Users size={12} /> {num}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Room Code Field */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Room Code
              </label>
              {mode === 'create' && (
                <button
                  type="button"
                  onClick={generateNewCode}
                  style={{
                    background: 'none', border: 'none', color: '#ff5500',
                    fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#ff8844'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ff5500'}
                >
                  <RefreshCw size={11} /> New Code
                </button>
              )}
            </div>
            <input
              type="text"
              required
              maxLength={11}
              placeholder="e.g. viam-x7k9p2"
              value={roomId}
              onChange={handleCodeChange}
              readOnly={mode === 'join' && !!defaultRoomId}
              style={{
                width: '100%', height: '42px', background: '#141417',
                border: '1px solid #27272a', borderRadius: '10px',
                padding: '0 14px', fontSize: '13px', color: '#ff5500', outline: 'none',
                fontFamily: 'monospace', fontWeight: '700', letterSpacing: '1px',
                opacity: mode === 'join' && !!defaultRoomId ? 0.9 : 1
              }}
            />
          </div>

          {/* Quick Copy Link Helper in Create Mode */}
          {mode === 'create' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(255,85,0,0.08)', border: '1px solid rgba(255,85,0,0.2)',
              borderRadius: '10px', padding: '8px 12px', fontSize: '12px'
            }}>
              <span style={{ color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                {shareableLink}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  background: copied ? '#22c55e' : '#ff5500', border: 'none',
                  color: '#fff', padding: '4px 10px', borderRadius: '6px',
                  fontSize: '11px', fontWeight: '700', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0
                }}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          )}

          {/* Optional Room Secret PIN / Passcode */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Room Passcode / PIN {mode === 'create' ? '(Optional Security)' : '(If Locked)'}
              </label>
              <Lock size={12} color="#ff5500" />
            </div>
            <input
              type="password"
              maxLength={8}
              placeholder={mode === 'create' ? 'Set secret passcode (e.g. 1234)' : 'Enter room passcode if set'}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              style={{
                width: '100%', height: '42px', background: '#141417',
                border: '1px solid #27272a', borderRadius: '10px',
                padding: '0 14px', fontSize: '13px', color: '#fff', outline: 'none',
                fontFamily: 'monospace', letterSpacing: '2px'
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#ff5500'}
              onBlur={e => e.currentTarget.style.borderColor = '#27272a'}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              width: '100%', height: '46px', borderRadius: '12px',
              fontSize: '14px', fontWeight: '700', color: '#fff',
              background: '#ff5500', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginTop: '6px', boxShadow: '0 0 20px rgba(255,85,0,0.4)', transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <span>{mode === 'create' ? '✨ Create & Enter Lounge 🚀' : '🚪 Join Lounge Now'}</span>
            <ArrowRight size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}
