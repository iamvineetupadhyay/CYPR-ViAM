import React, { useState, useEffect, useRef } from 'react';
import { Lock, Key, ArrowRight, X, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { getT } from '../utils/themeTokens';

export default function RoomPasscodeModal({
  isOpen,
  roomId = '',
  errorMessage = '',
  onSubmit,
  onCancel,
  theme = 'dark'
}) {
  const T = getT(theme);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setShowPasscode(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!passcode.trim()) return;
    onSubmit?.(passcode.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(5, 7, 12, 0.82)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'linear-gradient(165deg, rgba(24, 15, 29, 0.98) 0%, rgba(14, 9, 18, 0.98) 100%)',
          border: '1.5px solid rgba(244, 63, 94, 0.4)',
          borderRadius: '26px',
          padding: '32px 28px',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.95), 0 0 40px rgba(244, 63, 94, 0.25)',
          position: 'relative',
          color: '#ffffff',
          textAlign: 'center'
        }}
      >
        {/* Cancel / Close Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            title="Cancel"
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a1a1aa',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a1a1aa';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* Pulsing Lock Icon */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '18px' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-10px',
              borderRadius: '50%',
              border: '2px solid rgba(244, 63, 94, 0.35)',
              animation: 'pulse 2s infinite'
            }}
          />
          <div
            style={{
              width: '66px',
              height: '66px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.25) 0%, rgba(190, 18, 60, 0.1) 100%)',
              border: '2px solid #f43f5e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 30px rgba(244, 63, 94, 0.4)'
            }}
          >
            <Lock size={30} color="#f43f5e" />
          </div>
        </div>

        {/* Room Badge */}
        {roomId && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.35)',
              fontSize: '11px',
              fontWeight: '700',
              color: '#f43f5e',
              marginBottom: '12px',
              textTransform: 'lowercase'
            }}
          >
            <ShieldCheck size={13} color="#f43f5e" />
            <span>Room: {roomId}</span>
          </div>
        )}

        {/* Heading & Subtitle */}
        <h3
          style={{
            fontSize: '20px',
            fontWeight: '800',
            color: '#ffffff',
            margin: '0 0 8px 0',
            letterSpacing: '-0.3px'
          }}
        >
          Private Sanctuary Passcode
        </h3>
        <p
          style={{
            fontSize: '13px',
            color: '#cbd5e1',
            lineHeight: '1.5',
            margin: '0 0 22px 0',
            padding: '0 8px'
          }}
        >
          This sanctuary is protected. Enter passcode to request entry.
        </p>

        {/* Error Alert Banner if wrong passcode was entered */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.14)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#fca5a5',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Passcode Input Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <div
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#ff5500',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}
            >
              <Key size={18} />
            </div>

            <input
              ref={inputRef}
              type={showPasscode ? 'text' : 'password'}
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter room passcode / PIN..."
              autoComplete="off"
              style={{
                width: '100%',
                height: '48px',
                background: 'rgba(10, 10, 15, 0.85)',
                border: errorMessage ? '1.5px solid #ef4444' : '1.5px solid rgba(255, 85, 0, 0.4)',
                borderRadius: '14px',
                padding: '0 44px 0 42px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: '600',
                letterSpacing: showPasscode ? '0.5px' : '2px',
                outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#ff5500';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(255, 85, 0, 0.25), inset 0 2px 4px rgba(0,0,0,0.5)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errorMessage ? '#ef4444' : 'rgba(255, 85, 0, 0.4)';
                e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.5)';
              }}
            />

            {/* Toggle show/hide password */}
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              title={showPasscode ? 'Hide Passcode' : 'Show Passcode'}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px'
              }}
            >
              {showPasscode ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: onCancel ? '1fr 1.6fr' : '1fr', gap: '10px', marginTop: '6px' }}>
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                style={{
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#d4d4d8',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.14)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={!passcode.trim()}
              style={{
                height: '44px',
                borderRadius: '12px',
                background: !passcode.trim() ? '#271b29' : 'linear-gradient(135deg, #f43f5e 0%, #be123c 100%)',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '700',
                cursor: !passcode.trim() ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: !passcode.trim() ? 'none' : '0 6px 20px rgba(244, 63, 94, 0.45)',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseEnter={(e) => {
                if (passcode.trim()) e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                if (passcode.trim()) e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Unlock Sanctuary</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
