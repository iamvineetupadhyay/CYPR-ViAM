import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2,
  Minimize2, Volume2, ShieldCheck, User, Move
} from 'lucide-react';

export default function FloatingCallWindow({
  localStream,
  remoteStream,
  isMicMuted,
  isCamOff,
  isVideoCall,
  partnerName,
  isCallConnected,
  toggleMic,
  toggleCam,
  onExpand,
  onEndCall
}) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteBgVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  // Dynamic Camera Orientation
  const [isRemotePortrait, setIsRemotePortrait] = useState(false);
  const [isLocalPortrait, setIsLocalPortrait] = useState(false);

  const detectRemoteOrientation = () => {
    if (remoteVideoRef.current) {
      const { videoWidth, videoHeight } = remoteVideoRef.current;
      if (videoWidth && videoHeight) {
        setIsRemotePortrait(videoHeight > videoWidth);
      }
    }
  };

  const detectLocalOrientation = () => {
    if (localVideoRef.current) {
      const { videoWidth, videoHeight } = localVideoRef.current;
      if (videoWidth && videoHeight) {
        setIsLocalPortrait(videoHeight > videoWidth);
      }
    }
  };

  // Draggable position state
  const [pos, setPos] = useState({ x: window.innerWidth - 340, y: window.innerHeight - 240 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Play & attach local stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play()
        .then(() => detectLocalOrientation())
        .catch(err => console.warn('[Floating local play error]', err));
    }
  }, [localStream]);

  // Play & attach remote stream
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play()
        .then(() => detectRemoteOrientation())
        .catch(err => console.warn('[Floating remote play error]', err));
    }
    if (remoteBgVideoRef.current && remoteStream) {
      remoteBgVideoRef.current.srcObject = remoteStream;
      remoteBgVideoRef.current.play().catch(err => console.warn('[Floating remote bg play error]', err));
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(err => console.warn('[Floating remote audio play error]', err));
    }
  }, [remoteStream]);

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return; // Don't drag when clicking buttons
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos.x,
      initialY: pos.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = Math.max(10, Math.min(window.innerWidth - 310, dragRef.current.initialX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - 210, dragRef.current.initialY + dy));
      setPos({ x: newX, y: newY });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const hasRemoteVideo = Boolean(
    isVideoCall &&
    isCallConnected &&
    remoteStream &&
    remoteStream.getVideoTracks &&
    remoteStream.getVideoTracks().length > 0
  );

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: isRemotePortrait ? '205px' : '300px',
        height: isRemotePortrait ? '320px' : '190px',
        borderRadius: '20px',
        background: '#141417',
        border: '1.5px solid #27272a',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.95)',
        zIndex: 9999,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s'
      }}
    >
      {/* Hidden Audio Output */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Ambient Blurred Video Background for Portrait Mode */}
      {hasRemoteVideo && isRemotePortrait && (
        <video
          ref={remoteBgVideoRef}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: '-20px',
            width: 'calc(100% + 40px)',
            height: 'calc(100% + 40px)',
            objectFit: 'cover',
            filter: 'blur(30px) brightness(0.35)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
      )}

      {/* Primary Remote Video Feed */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        muted
        onLoadedMetadata={detectRemoteOrientation}
        onResize={detectRemoteOrientation}
        onTimeUpdate={detectRemoteOrientation}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: isRemotePortrait ? 'contain' : 'cover',
          zIndex: 2,
          display: hasRemoteVideo ? 'block' : 'none'
        }}
      />

      {/* Avatar Display when Video is Off or Connecting */}
      {!hasRemoteVideo && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'radial-gradient(circle at center, #18181b 0%, #09090b 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
          padding: '12px'
        }}>
          <div style={{
            width: '54px', height: '54px', borderRadius: '50%',
            background: '#09090b', border: '2px solid #ff5500',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', fontWeight: '800', color: '#ffffff',
            boxShadow: '0 0 20px rgba(255,85,0,0.3)'
          }}>
            {(partnerName || 'P')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
              {partnerName || 'Partner'}
            </div>
            <div style={{ fontSize: '11px', color: isCallConnected ? '#22c55e' : '#f59e0b', fontWeight: '600' }}>
              {isCallConnected ? 'Call Connected' : 'Calling...'}
            </div>
          </div>
        </div>
      )}

      {/* Local PIP Video (Small corner thumbnail inside floating card) */}
      {localStream && (
        <div style={{
          position: 'absolute', top: '8px', right: '8px', zIndex: 10,
          width: isLocalPortrait ? '42px' : '64px',
          height: isLocalPortrait ? '66px' : '44px',
          borderRadius: '10px',
          overflow: 'hidden', background: '#09090b', border: '1px solid #27272a',
          transition: 'width 0.25s ease, height 0.25s ease'
        }}>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={detectLocalOrientation}
            onResize={detectLocalOrientation}
            onTimeUpdate={detectLocalOrientation}
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: 'scaleX(-1)', display: !isCamOff ? 'block' : 'none'
            }}
          />
        </div>
      )}

      {/* Top Drag Indicator & Expand Button */}
      <div style={{
        position: 'absolute', top: '8px', left: '10px', zIndex: 15,
        display: 'flex', alignItems: 'center', gap: '6px'
      }}>
        <button
          onClick={onExpand}
          style={{
            background: 'rgba(9,9,11,0.8)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '4px 8px', color: '#ffffff',
            fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px',
            cursor: 'pointer'
          }}
          title="Expand Fullscreen Call"
        >
          <Maximize2 size={12} />
          <span>Full Call</span>
        </button>
      </div>

      {/* Bottom Floating Quick Control Dock */}
      <div style={{
        position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 20, display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', padding: '5px 12px'
      }}>
        {/* Toggle Mic */}
        <button
          onClick={toggleMic}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: isMicMuted ? '#ef4444' : '#18181b',
            border: 'none', color: '#ffffff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
          title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
        >
          {isMicMuted ? <MicOff size={14} /> : <Mic size={14} />}
        </button>

        {/* Toggle Camera */}
        {isVideoCall && (
          <button
            onClick={toggleCam}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: isCamOff ? '#ef4444' : '#18181b',
              border: 'none', color: '#ffffff', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
            }}
            title={isCamOff ? 'Turn Cam On' : 'Turn Cam Off'}
          >
            {isCamOff ? <VideoOff size={14} /> : <Video size={14} />}
          </button>
        )}

        {/* End Call */}
        <button
          onClick={onEndCall}
          style={{
            width: '34px', height: '34px', borderRadius: '50%',
            background: '#ef4444', border: 'none',
            color: '#ffffff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer'
          }}
          title="End Call"
        >
          <PhoneOff size={15} />
        </button>
      </div>
    </div>
  );
}
