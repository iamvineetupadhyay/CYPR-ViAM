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
  layoutMode = 'floating' // 'floating' | 'sidebar'
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

  // If in Sidebar mode: render docked directly in the Right Lounge Sidebar
  if (layoutMode === 'sidebar') {
    return (
      <div
        className="sidebar-duo-cam-container"
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-glass)',
          background: 'rgba(10, 13, 22, 0.65)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#fda4af', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Heart size={13} color="#f43f5e" fill="#f43f5e" /> Couple Face-to-Face
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="online-dot" style={{ background: isCallConnected ? '#22c55e' : '#f59e0b' }} />
            <span style={{ fontSize: '10px', color: isCallConnected ? '#22c55e' : '#f59e0b', fontWeight: '600' }}>
              {isCallConnected ? peerName || 'Connected' : 'Waiting...'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Remote Partner Cam */}
          <div
            className={`cam-card ${isCallConnected ? 'speaking' : ''}`}
            style={{ width: '50%', height: '110px', margin: 0 }}
          >
            {remoteStream && !isCamOff ? (
              <video ref={remoteVideoRef} autoPlay playsInline className="cam-video" />
            ) : (
              <div className="cam-avatar-placeholder">
                <Heart size={22} color="#f43f5e" style={{ animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontWeight: '600', fontSize: '11px' }}>{isCallConnected ? peerName : 'Waiting...'}</span>
              </div>
            )}
            <div className="cam-badge">
              <span>{isCallConnected ? peerName : 'Partner'}</span>
            </div>
          </div>

          {/* Local User Cam */}
          <div
            className="cam-card"
            style={{ width: '50%', height: '110px', position: 'relative', margin: 0 }}
          >
            {localStream && !isCamOff ? (
              <video ref={localVideoRef} autoPlay playsInline muted className="cam-video" />
            ) : (
              <div className="cam-avatar-placeholder">
                <User size={20} />
                <span style={{ fontWeight: '600', fontSize: '11px' }}>{currentUser?.name || 'You'}</span>
              </div>
            )}
            <div className="cam-badge">
              <span>You</span>
            </div>

            {/* Quick Mic & Cam Controls */}
            <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', gap: '5px', zIndex: 10 }}>
              <button
                type="button"
                onClick={toggleMic}
                className="btn btn-icon"
                style={{
                  width: '26px',
                  height: '26px',
                  background: isMicMuted ? '#ef4444' : '#0f172a',
                  border: isMicMuted ? '1.5px solid #fda4af' : '1.5px solid #38bdf8',
                  color: '#fff',
                  boxShadow: isMicMuted ? '0 0 10px rgba(239, 68, 68, 0.7)' : '0 0 8px rgba(56, 189, 248, 0.5)',
                  cursor: 'pointer'
                }}
                title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMicMuted ? <MicOff size={12} color="#fff" /> : <Mic size={12} color="#38bdf8" />}
              </button>
              <button
                type="button"
                onClick={toggleCam}
                className="btn btn-icon"
                style={{
                  width: '26px',
                  height: '26px',
                  background: isCamOff ? '#ef4444' : '#0f172a',
                  border: isCamOff ? '1.5px solid #fda4af' : '1.5px solid #22c55e',
                  color: '#fff',
                  boxShadow: isCamOff ? '0 0 10px rgba(239, 68, 68, 0.7)' : '0 0 8px rgba(34, 197, 94, 0.5)',
                  cursor: 'pointer'
                }}
                title={isCamOff ? 'Cam On' : 'Cam Off'}
              >
                {isCamOff ? <VideoOff size={12} color="#fff" /> : <Video size={12} color="#22c55e" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cyclePosition = () => {
    if (position === 'bottom-right') setPosition('top-right');
    else if (position === 'top-right') setPosition('bottom-left');
    else setPosition('bottom-right');
  };

  const getPositionStyles = () => {
    if (position === 'top-right') {
      return { top: '24px', right: '24px', bottom: 'auto', left: 'auto' };
    }
    if (position === 'bottom-left') {
      return { bottom: '80px', left: '24px', top: 'auto', right: 'auto' };
    }
    // Default bottom-right (above control bar)
    return { bottom: '80px', right: '24px', top: 'auto', left: 'auto' };
  };

  if (isMinimized) {
    return (
      <div
        className="duo-cam-container"
        style={{
          ...getPositionStyles(),
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(244, 63, 94, 0.4)',
          borderRadius: '30px',
          padding: '8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 15px rgba(244, 63, 94, 0.3)'
        }}
        onClick={() => setIsMinimized(false)}
        title="Click to show Duo Cams"
      >
        <span className="online-dot" style={{ background: isCallConnected ? '#22c55e' : '#f59e0b' }} />
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#fff' }}>
          {isCallConnected ? `Face-to-Face with ${peerName}` : 'Waiting for partner...'}
        </span>
        <Eye size={15} color="#f43f5e" />
      </div>
    );
  }

  return (
    <div
      className="duo-cam-container"
      style={getPositionStyles()}
    >
      {/* Top Bar for Duo Cam Controls */}
      <div
        style={{
          position: 'absolute',
          top: '-36px',
          right: '0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '4px 10px',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)'
        }}
      >
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
          Position: {position.replace('-', ' ')}
        </span>
        <button
          onClick={cyclePosition}
          className="btn btn-icon"
          style={{
            width: '26px',
            height: '26px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff'
          }}
          title={`Move camera window (Current: ${position})`}
        >
          <Move size={13} />
        </button>
        <button
          onClick={() => setIsMinimized(true)}
          className="btn btn-icon"
          style={{
            width: '26px',
            height: '26px',
            background: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff'
          }}
          title="Minimize camera overlay"
        >
          <EyeOff size={13} />
        </button>
      </div>

      {/* Remote Partner Cam */}
      <div className={`cam-card ${isCallConnected ? 'speaking' : ''}`}>
        {remoteStream && !isCamOff ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="cam-video"
          />
        ) : (
          <div className="cam-avatar-placeholder">
            <User size={24} color="#a1a1aa" />
            <span style={{ fontWeight: '600' }}>{isCallConnected ? peerName : 'Waiting for partner...'}</span>
          </div>
        )}
        <div className="cam-badge">
          <span className="online-dot" style={{ background: isCallConnected ? '#22c55e' : '#71717a' }} />
          <span>{isCallConnected ? peerName : 'Connecting...'}</span>
        </div>
      </div>

      {/* Local User Cam */}
      <div className="cam-card" style={{ position: 'relative' }}>
        {localStream && !isCamOff ? (
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted // Mute local preview to prevent echo
            className="cam-video"
          />
        ) : (
          <div className="cam-avatar-placeholder">
            <User size={24} />
            <span style={{ fontWeight: '600' }}>{currentUser?.name || 'You'}</span>
          </div>
        )}

        <div className="cam-badge">
          <span>You</span>
        </div>

        {/* HIGH-CONTRAST, HIGHLY VISIBLE MIC & CAM CONTROLS */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '8px',
            zIndex: 10
          }}
        >
          {/* Mic Button */}
          <button
            onClick={toggleMic}
            className="btn btn-icon"
            style={{
              width: '32px',
              height: '32px',
              background: isMicMuted ? '#ef4444' : '#0f172a',
              border: isMicMuted ? '2px solid #fda4af' : '2px solid #38bdf8',
              color: '#ffffff',
              boxShadow: isMicMuted
                ? '0 0 14px rgba(239, 68, 68, 0.7)'
                : '0 0 12px rgba(56, 189, 248, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMicMuted ? <MicOff size={15} color="#fff" /> : <Mic size={15} color="#38bdf8" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={toggleCam}
            className="btn btn-icon"
            style={{
              width: '32px',
              height: '32px',
              background: isCamOff ? '#ef4444' : '#0f172a',
              border: isCamOff ? '2px solid #fda4af' : '2px solid #22c55e',
              color: '#ffffff',
              boxShadow: isCamOff
                ? '0 0 14px rgba(239, 68, 68, 0.7)'
                : '0 0 12px rgba(34, 197, 94, 0.5)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCamOff ? <VideoOff size={15} color="#fff" /> : <Video size={15} color="#22c55e" />}
          </button>
        </div>
      </div>
    </div>
  );
}
