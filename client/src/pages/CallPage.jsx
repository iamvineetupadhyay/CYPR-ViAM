import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  ShieldCheck, Monitor, Volume2, VolumeX, Maximize2,
  Minimize2, Grid, User, RefreshCw, MessageSquare, ArrowLeft,
  Sparkles, Settings, Activity
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { getT } from '../utils/themeTokens';

export default function CallPage({
  currentUser,
  roomId,
  socket,
  roomUsers,
  initialIsVideo = true,
  webrtc: externalWebrtc,
  onBackToChat,
  onMinimizeCall,
  theme = 'dark'
}) {
  const T = getT(theme);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteBgVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const [isVideoCall, setIsVideoCall] = useState(initialIsVideo);
  const [callTime, setCallTime] = useState(0);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [qualityMode, setQualityMode] = useState('1080p Ultra HD');
  const [showSettings, setShowSettings] = useState(false);

  // Dynamic Camera Orientation (Portrait vs Landscape)
  const [isRemotePortrait, setIsRemotePortrait] = useState(false);
  const [isLocalPortrait, setIsLocalPortrait] = useState(false);

  const detectRemoteOrientation = useCallback(() => {
    if (remoteVideoRef.current) {
      const { videoWidth, videoHeight } = remoteVideoRef.current;
      if (videoWidth && videoHeight) {
        setIsRemotePortrait(videoHeight > videoWidth);
      }
    }
  }, []);

  const detectLocalOrientation = useCallback(() => {
    if (localVideoRef.current) {
      const { videoWidth, videoHeight } = localVideoRef.current;
      if (videoWidth && videoHeight) {
        setIsLocalPortrait(videoHeight > videoWidth);
      }
    }
  }, []);

  // Use external shared WebRTC instance if provided by App, otherwise fallback
  const internalWebrtc = useWebRTC(socket, roomId, currentUser);
  const webrtc = externalWebrtc || internalWebrtc;

  const {
    localStream, remoteStream,
    isMicMuted, isCamOff, isCallConnected,
    peerName, startLocalCall, createOfferAndSend,
    stopLocalMedia, toggleMic, toggleCam
  } = webrtc;

  // Initialize Call on Mount if local stream not active yet
  useEffect(() => {
    let mounted = true;
    const initCall = async () => {
      if (mounted && !localStream) {
        await startLocalCall(isVideoCall);
        if (socket) {
          socket.emit('call-invite', { isVideo: isVideoCall, to: roomId });
        }
      }
    };
    initCall();

    return () => {
      mounted = false;
    };
  }, []);

  // Socket event listeners for call lifecycle
  useEffect(() => {
    if (!socket) return;

    const handleCallAccepted = ({ fromSocketId }) => {
      console.log('[CallPage] Partner accepted call:', fromSocketId);
      if (fromSocketId && createOfferAndSend) {
        createOfferAndSend(fromSocketId);
      }
    };

    const handleCallEnded = () => {
      console.log('[CallPage] Call ended by partner');
      stopLocalMedia();
      onBackToChat?.();
    };

    const handleCallDeclined = () => {
      console.log('[CallPage] Call declined by partner');
      stopLocalMedia();
      alert('Partner declined the call.');
      onBackToChat?.();
    };

    const handleUserLeft = () => {
      console.log('[CallPage] Partner left room');
      stopLocalMedia();
      onBackToChat?.();
    };

    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-ended', handleCallEnded);
    socket.on('call-declined', handleCallDeclined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-ended', handleCallEnded);
      socket.off('call-declined', handleCallDeclined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, createOfferAndSend, stopLocalMedia, onBackToChat]);

  // Attach local media stream to local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play()
        .then(() => detectLocalOrientation())
        .catch((err) => console.warn('[CallPage] Local video play error:', err));
    }
  }, [localStream, detectLocalOrientation]);

  // Attach remote stream to remote video & audio elements
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play()
        .then(() => detectRemoteOrientation())
        .catch((err) => console.warn('[CallPage] Remote video play error:', err));
    }
    if (remoteBgVideoRef.current && remoteStream) {
      remoteBgVideoRef.current.srcObject = remoteStream;
      remoteBgVideoRef.current.play().catch((err) => console.warn('[CallPage] Remote BG video play error:', err));
    }
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((err) => console.warn('[CallPage] Remote audio play error:', err));
    }
  }, [remoteStream, detectRemoteOrientation]);

  // Call duration timer
  useEffect(() => {
    if (!isCallConnected) return;
    const interval = setInterval(() => setCallTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isCallConnected]);

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    if (socket) {
      socket.emit('call-ended', { to: roomId });
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    stopLocalMedia();
    onBackToChat?.();
  };

  const handleToggleScreenShare = async () => {
    if (isScreenSharing && screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
          if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
          }
        };
      } catch (err) {
        console.warn('[Screen Share Cancelled / Error]:', err);
      }
    }
  };

  const partner = roomUsers.find((u) => u.socketId !== socket?.id);
  const displayName = partner?.name || peerName || 'Partner';
  const hasRemoteVideo = Boolean(
    isVideoCall &&
    isCallConnected &&
    remoteStream &&
    remoteStream.getVideoTracks &&
    remoteStream.getVideoTracks().length > 0
  );

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: '#09090b', color: '#ffffff',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', inset: 0, zIndex: 9999,
      fontFamily: 'Inter, Plus Jakarta Sans, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Hidden Audio Element for Remote Sound Output */}
      <audio ref={remoteAudioRef} autoPlay playsInline muted={isSpeakerMuted} />

      {/* ═══════ TOP HEADER ═══════ */}
      <header style={{
        height: '68px', padding: '0 24px',
        background: T.headerBg,
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.border2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 20
      }}>
        {/* Left: Back to Chat & Floating Chat Mode Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToChat}
            style={{
              background: T.pillBg, border: `1px solid ${T.pillBorder}`,
              borderRadius: '12px', padding: '8px 14px',
              color: T.textPrimary, fontSize: '13px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = T.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = T.pillBg)}
          >
            <ArrowLeft size={16} />
            <span>Chat Room</span>
          </button>

          {/* Minimize / Floating Video Call Button */}
          <button
            onClick={onMinimizeCall || onBackToChat}
            style={{
              background: 'rgba(255, 85, 0, 0.12)', border: '1px solid rgba(255, 85, 0, 0.4)',
              borderRadius: '12px', padding: '8px 14px',
              color: '#ff5500', fontSize: '13px', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 85, 0, 0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 85, 0, 0.12)')}
            title="Minimize to Floating Video Call & Open Chat"
          >
            <Minimize2 size={16} />
            <span>Float & Chat</span>
          </button>

          <div style={{
            background: T.chipBg, border: `1px solid ${T.chipBorder}`,
            borderRadius: '20px', padding: '6px 14px',
            fontSize: '12px', fontWeight: '600', color: T.textPrimary,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <ShieldCheck size={15} color="#22c55e" />
            <span>Room: {roomId}</span>
          </div>
        </div>

        {/* Center: Call Status & Live Timer Badge */}
        <div style={{
          background: T.surface2, border: `1px solid ${T.border2}`,
          borderRadius: '24px', padding: '6px 20px',
          display: 'flex', alignItems: 'center', gap: '10px',
          boxShadow: T.isLight ? '0 4px 16px rgba(0,0,0,0.08)' : '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <span style={{
            width: 9, height: 9, borderRadius: '50%',
            background: isCallConnected ? '#22c55e' : '#f59e0b',
            boxShadow: isCallConnected ? '0 0 10px #22c55e' : '0 0 10px #f59e0b'
          }} />
          <span style={{ fontSize: '14px', fontWeight: '700', color: T.textPrimary }}>
            {isCallConnected ? formatTimer(callTime) : 'Connecting call...'}
          </span>
          <span style={{ fontSize: '11px', color: T.textMuted2, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ({isVideoCall ? 'Video' : 'Voice'})
          </span>
        </div>

        {/* Right: Security & Settings Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: T.chipBg, border: `1px solid ${T.chipBorder}`,
            borderRadius: '16px', padding: '6px 12px',
            fontSize: '12px', fontWeight: '600', color: T.textMuted1,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Activity size={14} color="#ff5500" />
            <span>{qualityMode}</span>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: 38, height: 38, borderRadius: '12px',
              background: T.pillBg, border: `1px solid ${T.pillBorder}`,
              color: T.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Settings size={17} />
          </button>
        </div>
      </header>

      {/* ═══════ MAIN STAGE AREA ═══════ */}
      <main style={{ flex: 1, position: 'relative', background: '#000000', overflow: 'hidden' }}>
        {/* Hidden Remote Audio Stream */}
        <audio ref={remoteAudioRef} autoPlay playsInline muted={isSpeakerMuted} />

        {/* Ambient Blurred Video Background for Portrait Feeds (WhatsApp / FaceTime style) */}
        {hasRemoteVideo && isRemotePortrait && (
          <video
            ref={remoteBgVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: 'absolute',
              inset: '-40px',
              width: 'calc(100% + 80px)',
              height: 'calc(100% + 80px)',
              objectFit: 'cover',
              filter: 'blur(45px) brightness(0.35) saturate(1.4)',
              zIndex: 1,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Primary Remote Video Feed: Adaptive Portrait / Landscape Presentation */}
        {hasRemoteVideo && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isRemotePortrait ? '24px' : '0',
            pointerEvents: 'none'
          }}>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={isSpeakerMuted}
              onLoadedMetadata={detectRemoteOrientation}
              onResize={detectRemoteOrientation}
              onTimeUpdate={detectRemoteOrientation}
              style={{
                width: isRemotePortrait ? 'auto' : '100%',
                height: isRemotePortrait ? '100%' : '100%',
                maxHeight: '100%',
                maxWidth: '100%',
                aspectRatio: isRemotePortrait ? '9 / 16' : 'auto',
                objectFit: 'contain',
                borderRadius: isRemotePortrait ? '24px' : '0px',
                boxShadow: isRemotePortrait ? '0 25px 80px rgba(0, 0, 0, 0.95), 0 0 45px rgba(255, 85, 0, 0.2)' : 'none',
                border: isRemotePortrait ? '1.5px solid rgba(255, 255, 255, 0.15)' : 'none',
                pointerEvents: 'auto',
                background: '#000000',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
        )}

        {/* Center Card: Displayed during Voice Call or when Remote Video is not available */}
        {!hasRemoteVideo && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'radial-gradient(circle at center, #18181b 0%, #09090b 100%)',
            padding: '24px'
          }}>
            <div style={{
              textAlign: 'center', background: '#141417',
              border: '1px solid #27272a', borderRadius: '32px',
              padding: '48px 56px', maxWidth: '420px', width: '100%',
              boxShadow: '0 30px 80px rgba(0,0,0,0.9)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px'
            }}>
              {/* Avatar Pulse Container */}
              <div style={{ position: 'relative' }}>
                <div className="avatar-pulse-ring" style={{
                  position: 'absolute', inset: '-12px', borderRadius: '50%',
                  border: '2px solid rgba(255, 85, 0, 0.4)',
                  animation: isCallConnected ? 'pulse 2s infinite' : 'none'
                }} />
                <div style={{
                  width: '110px', height: '110px', borderRadius: '50%',
                  background: '#09090b', border: '3px solid #ff5500',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '44px', fontWeight: '900', color: '#ffffff',
                  boxShadow: '0 0 30px rgba(255,85,0,0.3)'
                }}>
                  {displayName ? displayName[0].toUpperCase() : 'P'}
                </div>
              </div>

              <div>
                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
                  {displayName}
                </h2>
                <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: isCallConnected ? '#22c55e' : '#f59e0b', fontWeight: '600' }}>
                  {isCallConnected ? '❤️ End-to-End Encrypted Live Call' : '📞 Calling partner...'}
                </p>
              </div>

              {/* Dynamic Wave Visualizer */}
              <div style={{ display: 'flex', gap: '4px', height: '24px', alignItems: 'center', marginTop: '10px' }}>
                {[40, 75, 100, 60, 85, 45, 90, 30].map((h, idx) => (
                  <span
                    key={idx}
                    style={{
                      width: 4, height: isCallConnected ? `${h}%` : '20%',
                      background: '#ff5500', borderRadius: '2px',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Local PIP Preview Video: Adapts dynamically to portrait (135x220) vs landscape (220x140) */}
        <div style={{
          position: 'absolute', bottom: '110px', right: '32px', zIndex: 10,
          width: isLocalPortrait ? '135px' : '220px',
          height: isLocalPortrait ? '220px' : '140px',
          borderRadius: '20px',
          overflow: 'hidden', background: '#141417',
          border: '2px solid #27272a',
          boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
          transition: 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
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
              transform: 'scaleX(-1)',
              display: !isCamOff ? 'block' : 'none'
            }}
          />
          {isCamOff && (
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', color: '#71717a', gap: '6px'
            }}>
              <VideoOff size={24} />
              <span style={{ fontSize: '11px', fontWeight: '600' }}>Camera Off</span>
            </div>
          )}

          <div style={{
            position: 'absolute', bottom: '8px', left: '8px',
            background: 'rgba(9,9,11,0.85)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px', padding: '3px 8px',
            fontSize: '11px', fontWeight: '600', color: '#ffffff',
            display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            {isMicMuted ? <MicOff size={12} color="#ef4444" /> : <Mic size={12} color="#22c55e" />}
            <span>You</span>
          </div>
        </div>

        {/* Quality Settings Floating Menu */}
        {showSettings && (
          <div style={{
            position: 'absolute', top: '20px', right: '24px', zIndex: 30,
            background: '#141417', border: '1px solid #27272a',
            borderRadius: '20px', padding: '16px 20px', width: '260px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.9)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' }}>
              Video Stream Quality
            </div>
            {['1080p Ultra HD', '720p HD', 'Bandwidth Saver (Audio Only)'].map((mode) => (
              <button
                key={mode}
                onClick={() => { setQualityMode(mode); setShowSettings(false); }}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  borderRadius: '10px', marginBottom: '6px',
                  background: qualityMode === mode ? '#ff5500' : '#18181b',
                  color: '#ffffff', border: 'none', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {mode}
              </button>
            ))}
          </div>
        )}
      </main>

      {/* ═══════ BOTTOM DOCK CONTROLS ═══════ */}
      <footer style={{
        height: '84px', padding: '0 32px',
        background: 'rgba(18, 18, 20, 0.9)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid #27272a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '16px', zIndex: 20
      }}>
        {/* Toggle Microphone */}
        <button
          onClick={toggleMic}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: isMicMuted ? '#ef4444' : '#18181b',
            border: isMicMuted ? 'none' : '1px solid #27272a',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
          }}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMicMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {/* Toggle Camera */}
        {isVideoCall && (
          <button
            onClick={toggleCam}
            style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: isCamOff ? '#ef4444' : '#18181b',
              border: isCamOff ? 'none' : '1px solid #27272a',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
            }}
            title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}

        {/* Share Screen */}
        <button
          onClick={handleToggleScreenShare}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: isScreenSharing ? '#ff5500' : '#18181b',
            border: isScreenSharing ? 'none' : '1px solid #27272a',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
          }}
          title="Share Screen"
        >
          <Monitor size={22} />
        </button>

        {/* Toggle Speaker Audio */}
        <button
          onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            background: isSpeakerMuted ? '#ef4444' : '#18181b',
            border: isSpeakerMuted ? 'none' : '1px solid #27272a',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 6px 20px rgba(0,0,0,0.4)'
          }}
          title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
        >
          {isSpeakerMuted ? <VolumeX size={22} /> : <Volume2 size={22} />}
        </button>

        {/* End Call (Red Button) */}
        <button
          onClick={handleEndCall}
          style={{
            width: '60px', height: '60px', borderRadius: '50%',
            background: '#ef4444', border: 'none',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.5)',
            transition: 'transform 0.15s, background 0.15s',
            marginLeft: '8px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="End Call"
        >
          <PhoneOff size={24} />
        </button>
      </footer>
    </div>
  );
}
