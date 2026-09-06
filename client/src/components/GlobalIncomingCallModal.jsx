import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Video, ShieldCheck, User } from 'lucide-react';

/**
 * Global Web Audio Synthesizer Ringtone
 * Plays a pleasant periodic 2-tone melodic chime without requiring external mp3 files.
 */
class RingtonePlayer {
  constructor() {
    this.ctx = null;
    this.interval = null;
  }

  start() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();

      const playChime = () => {
        if (!this.ctx || this.ctx.state === 'closed') return;
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }

        const now = this.ctx.currentTime;
        // Tone 1: 440 Hz (A4)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);
        gain1.gain.setValueAtTime(0, now);
        gain1.gain.linearRampToValueAtTime(0.18, now + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.5);

        // Tone 2: 554.37 Hz (C#5)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(554.37, now + 0.2);
        gain2.gain.setValueAtTime(0, now + 0.2);
        gain2.gain.linearRampToValueAtTime(0.22, now + 0.25);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + 0.2);
        osc2.stop(now + 0.7);

        // Tone 3: 659.25 Hz (E5)
        const osc3 = this.ctx.createOscillator();
        const gain3 = this.ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(659.25, now + 0.4);
        gain3.gain.setValueAtTime(0, now + 0.4);
        gain3.gain.linearRampToValueAtTime(0.25, now + 0.45);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
        osc3.connect(gain3);
        gain3.connect(this.ctx.destination);
        osc3.start(now + 0.4);
        osc3.stop(now + 1.1);
      };

      playChime();
      this.interval = setInterval(playChime, 2200);
    } catch (e) {
      console.warn('[RingtonePlayer] AudioContext note:', e);
    }
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.ctx) {
      try {
        this.ctx.close();
      } catch {}
      this.ctx = null;
    }
  }
}

export default function GlobalIncomingCallModal({
  incomingCall,
  onAccept,
  onDecline
}) {
  const ringtoneRef = useRef(null);

  useEffect(() => {
    if (incomingCall) {
      ringtoneRef.current = new RingtonePlayer();
      ringtoneRef.current.start();
    }
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.stop();
        ringtoneRef.current = null;
      }
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const isVideo = incomingCall.isVideo !== false;
  const callerName = incomingCall.fromName || 'Partner';
  const initial = callerName[0] ? callerName[0].toUpperCase() : 'P';

  const handleAccept = () => {
    if (ringtoneRef.current) ringtoneRef.current.stop();
    onAccept?.(incomingCall);
  };

  const handleDecline = () => {
    if (ringtoneRef.current) ringtoneRef.current.stop();
    onDecline?.(incomingCall);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: 'rgba(5, 7, 12, 0.75)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'linear-gradient(165deg, rgba(22, 24, 35, 0.98) 0%, rgba(12, 14, 22, 0.98) 100%)',
          border: '1.5px solid rgba(255, 85, 0, 0.45)',
          borderRadius: '28px',
          padding: '32px 24px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 85, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Subtle Ambient Radial Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: isVideo ? 'radial-gradient(circle, rgba(255,85,0,0.35) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(34,197,94,0.35) 0%, transparent 70%)',
            pointerEvents: 'none'
          }}
        />

        {/* Pulsing Avatar Ring */}
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <div
            style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
              border: '2px solid rgba(255, 85, 0, 0.4)',
              animation: 'pulse 1.8s infinite'
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '-22px',
              borderRadius: '50%',
              border: '1px solid rgba(255, 85, 0, 0.2)',
              animation: 'pulse 1.8s infinite 0.4s'
            }}
          />
          <div
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff5500, #e11d48)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '34px',
              fontWeight: '900',
              color: '#ffffff',
              boxShadow: '0 10px 30px rgba(255, 85, 0, 0.4)',
              position: 'relative',
              zIndex: 2
            }}
          >
            {initial}
          </div>

          {/* Call Kind Icon Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#090a0f',
              border: '2px solid #ff5500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ff5500',
              zIndex: 3
            }}
          >
            {isVideo ? <Video size={14} /> : <Phone size={14} />}
          </div>
        </div>

        {/* Caller Name */}
        <h3
          style={{
            margin: '0 0 6px 0',
            fontSize: '22px',
            fontWeight: '800',
            color: '#ffffff',
            letterSpacing: '-0.3px'
          }}
        >
          {callerName}
        </h3>

        {/* Call Description with Pulse Dot */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13.5px',
            color: '#a1a1aa',
            marginBottom: '28px'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
              animation: 'pulse 1.2s infinite'
            }}
          />
          <span>Incoming {isVideo ? 'Video Call' : 'Voice Call'}...</span>
        </div>

        {/* Action Buttons: Decline (Red) and Accept (Green) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            width: '100%'
          }}
        >
          {/* Decline Button */}
          <button
            type="button"
            onClick={handleDecline}
            style={{
              height: '52px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              color: '#f87171',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
              e.currentTarget.style.color = '#f87171';
            }}
          >
            <PhoneOff size={18} />
            <span>Decline</span>
          </button>

          {/* Accept Button */}
          <button
            type="button"
            onClick={handleAccept}
            style={{
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(34, 197, 94, 0.45)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(34, 197, 94, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.45)';
            }}
          >
            {isVideo ? <Video size={18} /> : <Phone size={18} />}
            <span>Accept Call</span>
          </button>
        </div>

        {/* Security E2EE pill */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)'
          }}
        >
          <ShieldCheck size={13} color="#22c55e" />
          <span>CYPR ViAM E2EE Protected Call</span>
        </div>
      </div>
    </div>
  );
}
