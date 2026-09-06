import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, Heart, User, Move, EyeOff, Eye } from 'lucide-react';

export default function VideoCall({
  localStream,
  remoteStream,
  isMicMuted,
  isCamOff,
  toggleMic,
  toggleCam,
  isCallConnected,
  peerName,
  currentUser,
  layoutMode = 'floating', // 'floating' | 'sidebar'
  audioEnabled = false // Default video-only (no audio transmitted or played) for cinema facecam
}) {
  const [position, setPosition] = useState('bottom-right'); // 'bottom-right' | 'top-right' | 'bottom-left'
  const [isMinimized, setIsMinimized] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // If in Sidebar mode: render docked directly in the Right Lounge Sidebar (Below Live Chat, Above Encryption)
  if (layoutMode === 'sidebar') {
    return (
      <div
        className="sidebar-duo-cam-container"
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(12, 14, 20, 0.96)',
          backdropFilter: 'blur(16px)',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff5500', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            <Video size={13} color="#ff5500" /> Live Duo Cam
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="online-dot" style={{ background: isCallConnected ? '#22c55e' : '#f59e0b', width: '7px', height: '7px', borderRadius: '50%', boxShadow: isCallConnected ? '0 0 8px #22c55e' : 'none' }} />
            <span style={{ fontSize: '10.5px', color: isCallConnected ? '#22c55e' : '#f59e0b', fontWeight: '700' }}>
              {isCallConnected ? (peerName || 'Connected') : 'Waiting for partner...'}
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {/* Remote Partner Cam Card (Square Shape) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#050508',
              border: isCallConnected ? '1.5px solid rgba(34, 197, 94, 0.7)' : '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
            }}
          >
            {remoteStream && !isCamOff ? (
              <video ref={remoteVideoRef} autoPlay playsInline muted={!audioEnabled} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, rgba(255,85,0,0.08), rgba(20,16,14,0.96))' }}>
                <User size={28} color="#ff5500" />
                <span style={{ fontWeight: '700', fontSize: '10.5px', color: '#a1a1aa', textAlign: 'center', padding: '0 4px' }}>
                  {isCallConnected ? peerName : 'Partner'}
                </span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '6px', fontSize: '9.5px', fontWeight: '800', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
              {isCallConnected ? peerName : 'Partner'}
            </div>
          </div>

          {/* Local User Cam Card (Square Shape) */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: '14px',
              overflow: 'hidden',
              background: '#050508',
              border: isCamOff ? '1px solid rgba(239, 68, 68, 0.5)' : '1.5px solid rgba(255, 85, 0, 0.7)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)'
            }}
          >
            {localStream && !isCamOff ? (
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'linear-gradient(135deg, rgba(255,85,0,0.12), rgba(20,16,14,0.96))' }}>
                <User size={28} color="#ff7733" />
                <span style={{ fontWeight: '700', fontSize: '10.5px', color: '#a1a1aa' }}>You</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: '2px 8px', borderRadius: '6px', fontSize: '9.5px', fontWeight: '800', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
              You
            </div>

            {/* Quick Cam Controls on Local Card */}
            <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '4px', zIndex: 10 }}>
              {audioEnabled && toggleMic && (
                <button
                  type="button"
                  onClick={toggleMic}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isMicMuted ? '#ef4444' : 'rgba(0, 0, 0, 0.75)',
                    border: isMicMuted ? '1px solid #ef4444' : '1px solid rgba(255, 85, 0, 0.5)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMicMuted ? <MicOff size={11} color="#fff" /> : <Mic size={11} color="#ff7733" />}
                </button>
              )}
              <button
                type="button"
                onClick={toggleCam}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: isCamOff ? '#ef4444' : 'rgba(0, 0, 0, 0.75)',
                  border: isCamOff ? '1px solid #ef4444' : '1px solid #22c55e',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                title={isCamOff ? 'Cam On' : 'Cam Off'}
              >
                {isCamOff ? <VideoOff size={11} color="#fff" /> : <Video size={11} color="#22c55e" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cyclePosition = () => {
    if (position === 'bottom-right') setPosition('top-right');
    else if (position === 'top-right') setPosition('top-left');
    else setPosition('bottom-right');
  };

  const getPositionStyles = () => {
    if (position === 'top-right') {
      return { top: '20px', right: '20px', bottom: 'auto', left: 'auto' };
    }
    if (position === 'top-left') {
      return { top: '20px', left: '20px', bottom: 'auto', right: 'auto' };
    }
    // Default bottom-right (Elevated above player control bar)
    return { bottom: '100px', right: '20px', top: 'auto', left: 'auto' };
  };

  if (isMinimized) {
    return (
      <div
        style={{
          ...getPositionStyles(),
          position: 'absolute',
          background: 'rgba(18, 18, 24, 0.94)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(168, 85, 247, 0.4)',
          borderRadius: '30px',
          padding: '6px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.8), 0 0 15px rgba(168, 85, 247, 0.25)',
          zIndex: 90
        }}
        onClick={() => setIsMinimized(false)}
        title="Click to expand Face Cam Capsule"
      >
        <span className="online-dot" style={{ background: isCallConnected ? '#22c55e' : '#f59e0b' }} />
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#fff' }}>
          {isCallConnected ? `Face Cam • ${peerName}` : 'Face Cam'}
        </span>
        <Eye size={13} color="#c084fc" />
      </div>
    );
  }

  return (
    <div
      style={{
        ...getPositionStyles(),
        position: 'absolute',
        background: 'rgba(12, 14, 20, 0.92)',
        backdropFilter: 'blur(20px)',
        border: '1.5px solid rgba(255, 85, 0, 0.45)',
        borderRadius: '50px',
        padding: '6px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.85), 0 0 20px rgba(255, 85, 0, 0.3)',
        zIndex: 90,
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer'
      }}
      onClick={cyclePosition}
      title="Click to reposition floating capsule"
    >
      {/* 1. Remote Partner Mini Circle Cam */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          background: '#050508',
          border: isCallConnected ? '2px solid #22c55e' : '1.5px solid rgba(255, 255, 255, 0.2)',
          flexShrink: 0,
          boxShadow: isCallConnected ? '0 0 10px rgba(34, 197, 94, 0.5)' : 'none'
        }}
        title={isCallConnected ? `Partner: ${peerName}` : 'Waiting for partner...'}
      >
        {remoteStream && !isCamOff ? (
          <video ref={remoteVideoRef} autoPlay playsInline muted={!audioEnabled} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(255,85,0,0.15), rgba(20,16,14,0.95))' }}>
            <User size={20} color="#ff5500" />
          </div>
        )}
        <span style={{
          position: 'absolute', bottom: '2px', right: '2px', width: '8px', height: '8px',
          borderRadius: '50%', background: isCallConnected ? '#22c55e' : '#f59e0b',
          border: '1.5px solid #050508', boxShadow: isCallConnected ? '0 0 6px #22c55e' : 'none'
        }} />
      </div>

      {/* 2. Local User Mini Circle Cam */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          background: '#050508',
          border: isCamOff ? '1.5px solid #ef4444' : '2px solid #ff5500',
          flexShrink: 0,
          boxShadow: '0 0 12px rgba(255, 85, 0, 0.4)'
        }}
        title="You"
      >
        {localStream && !isCamOff ? (
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(255,85,0,0.2), rgba(20,16,14,0.95))' }}>
            <User size={20} color="#ff7733" />
          </div>
        )}
        {isMicMuted && (
          <div style={{
            position: 'absolute', top: '2px', right: '2px', background: '#ef4444',
            borderRadius: '50%', width: '14px', height: '14px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', border: '1px solid #050508'
          }}>
            <MicOff size={9} color="#fff" />
          </div>
        )}
      </div>
    </div>
  );
}
