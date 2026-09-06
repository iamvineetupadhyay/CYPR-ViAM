import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff,
  ShieldCheck, Monitor, Volume2, VolumeX, Maximize2,
  Minimize2, Grid, User, RefreshCw, MessageSquare, ArrowLeft,
  Sparkles, Settings, Activity
} from 'lucide-react';
import { getT } from '../utils/themeTokens';

export default function CallPage({
  currentUser,
  roomId,
  socket,
  roomUsers,
  initialIsVideo = true,
  isInitiator = false,
  webrtc,
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

  const {
    localStream, remoteStream,
    isMicMuted, isCamOff, isCallConnected,
    peerName, startLocalCall, createOfferAndSend,
    stopLocalMedia, toggleMic, toggleCam
  } = webrtc || {};

  // Initialize Call on Mount: start local media, and ONLY emit call-invite if this user is the initiator!
  useEffect(() => {
    let mounted = true;
    const initCall = async () => {
      if (mounted && startLocalCall && !localStream) {
        await startLocalCall(isVideoCall);
        if (socket && isInitiator) {
          console.log('[CallPage] Initiator emitting call-invite to room:', roomId);
          socket.emit('call-invite', { isVideo: isVideoCall, to: roomId });
        }
      }
    };
    initCall();

    return () => {
      mounted = false;
    };
  }, [startLocalCall, isVideoCall, socket, isInitiator, roomId]);

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
      stopLocalMedia?.();
      onBackToChat?.();
    };

    const handleCallDeclined = () => {
      console.log('[CallPage] Call declined by partner');
      stopLocalMedia?.();
      alert('Partner declined the call.');
      onBackToChat?.();
    };

    const handleUserLeft = () => {
      console.log('[CallPage] Partner left room');
      stopLocalMedia?.();
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
      if (localVideoRef.current.srcObject !== localStream) {
        localVideoRef.current.srcObject = localStream;
      }
      localVideoRef.current.play()
        .then(() => detectLocalOrientation())
        .catch((err) => {
          if (err.name !== 'AbortError') console.warn('[CallPage] Local video play notice:', err?.message || err);
        });
    }
  }, [localStream, detectLocalOrientation]);

  // Attach remote stream to remote video & audio elements without interrupting active playback
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.play()
        .then(() => detectRemoteOrientation())
        .catch((err) => {
          if (err.name !== 'AbortError') console.warn('[CallPage] Remote video play notice:', err?.message || err);
        });
    }
    if (remoteBgVideoRef.current && remoteStream) {
      if (remoteBgVideoRef.current.srcObject !== remoteStream) {
        remoteBgVideoRef.current.srcObject = remoteStream;
      }
      remoteBgVideoRef.current.play().catch((err) => {
        if (err.name !== 'AbortError') console.warn('[CallPage] Remote BG video notice:', err?.message || err);
      });
    }
    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      remoteAudioRef.current.play().catch((err) => {
        if (err.name !== 'AbortError') console.warn('[CallPage] Remote audio notice:', err?.message || err);
      });
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
        height: '64px',
        padding: '0 clamp(12px, 3vw, 24px)',
        background: T.headerBg,
        backdropFilter: 'blur(16px)',
        borderBottom: `1px solid ${T.border2}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 20
      }}>
        {/* Left: Navigation, Back to Lounge & Minimize */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onBackToChat}
            style={{
              background: T.pillBg, border: `1px solid ${T.pillBorder}`,
              borderRadius: '12px', width: '38px', height: '38px',
              color: T.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            title="Return to Lounge Chat"
          >
            <ArrowLeft size={18} />
          </button>

          <button
            onClick={onMinimizeCall}
            style={{
              background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '12px', padding: '8px 12px',
              color: '#f43f5e', fontSize: '13px', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '6px',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            title="Minimize to Floating Video Call & Open Chat"
          >
            <Minimize2 size={16} />
            <span className="mobile-text-hidden">Float</span>
          </button>

          <div style={{
            background: T.chipBg, border: `1px solid ${T.chipBorder}`,
            borderRadius: '20px', padding: '6px 12px',
            fontSize: '12px', fontWeight: '600', color: T.textPrimary,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <ShieldCheck size={14} color="#f43f5e" />
            <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roomId}</span>
          </div>
        </div>

        {/* Center: Call Status & Live Timer Badge */}
        <div style={{
          background: T.surface2, border: `1px solid ${T.border2}`,
          borderRadius: '24px', padding: '5px 14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: T.isLight ? '0 4px 16px rgba(0,0,0,0.06)' : '0 4px 20px rgba(0,0,0,0.5)'
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: isCallConnected ? '#f43f5e' : '#f59e0b',
            boxShadow: isCallConnected ? '0 0 10px #f43f5e' : '0 0 10px #f59e0b'
          }} />
          <span style={{ fontSize: '13px', fontWeight: '700', color: T.textPrimary }}>
            {isCallConnected ? formatTimer(callTime) : 'Connecting...'}
          </span>
        </div>

        {/* Right: Security & Settings Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="mobile-text-hidden" style={{
            background: T.chipBg, border: `1px solid ${T.chipBorder}`,
            borderRadius: '16px', padding: '5px 10px',
            fontSize: '11px', fontWeight: '600', color: T.textMuted1,
            display: 'flex', alignItems: 'center', gap: '5px'
          }}>
            <Activity size={13} color="#f43f5e" />
            <span>{qualityMode}</span>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              width: 36, height: 36, borderRadius: '12px',
              background: T.pillBg, border: `1px solid ${T.pillBorder}`,
              color: T.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Settings size={16} />
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

        {/* Local PIP Preview Video: Adapts dynamically to portrait vs landscape with mobile-safe positioning */}
        <div style={{
          position: 'absolute',
          bottom: 'clamp(85px, 12vh, 105px)',
          right: 'clamp(12px, 3vw, 28px)',
          zIndex: 40,
          width: isLocalPortrait ? 'clamp(100px, 26vw, 135px)' : 'clamp(140px, 36vw, 220px)',
          height: isLocalPortrait ? 'clamp(150px, 36vw, 220px)' : 'clamp(95px, 24vw, 140px)',
          borderRadius: '20px',
          overflow: 'hidden', background: '#120917',
          border: '2px solid rgba(244, 63, 94, 0.4)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.9), 0 0 20px rgba(244, 63, 94, 0.2)',
          transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
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
                  background: qualityMode === mode ? '#f43f5e' : '#18181b',
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

      {/* ═══════ FIXED MOBILE-RESPONSIVE DOCK CONTROLS ═══════ */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        minHeight: '74px',
        padding: '10px 16px max(14px, env(safe-area-inset-bottom))',
        background: 'rgba(12, 8, 16, 0.94)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(244, 63, 94, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(8px, 2.5vw, 16px)',
        zIndex: 100,
        boxShadow: '0 -10px 35px rgba(0, 0, 0, 0.75)'
      }}>
        {/* Toggle Microphone */}
        <button
          onClick={toggleMic}
          style={{
            width: 'clamp(44px, 12vw, 54px)',
            height: 'clamp(44px, 12vw, 54px)',
            borderRadius: '50%',
            background: isMicMuted ? '#ef4444' : 'rgba(255,255,255,0.08)',
            border: isMicMuted ? 'none' : '1px solid rgba(255,255,255,0.12)',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
          }}
          title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Toggle Camera */}
        {isVideoCall && (
          <button
            onClick={toggleCam}
            style={{
              width: 'clamp(44px, 12vw, 54px)',
              height: 'clamp(44px, 12vw, 54px)',
              borderRadius: '50%',
              background: isCamOff ? '#ef4444' : 'rgba(255,255,255,0.08)',
              border: isCamOff ? 'none' : '1px solid rgba(255,255,255,0.12)',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
            }}
            title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isCamOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        )}

        {/* Share Screen */}
        <button
          onClick={handleToggleScreenShare}
          style={{
            width: 'clamp(44px, 12vw, 54px)',
            height: 'clamp(44px, 12vw, 54px)',
            borderRadius: '50%',
            background: isScreenSharing ? '#f43f5e' : 'rgba(255,255,255,0.08)',
            border: isScreenSharing ? 'none' : '1px solid rgba(255,255,255,0.12)',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
          }}
          title="Share Screen"
        >
          <Monitor size={20} />
        </button>

        {/* Toggle Speaker Audio */}
        <button
          onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
          style={{
            width: 'clamp(44px, 12vw, 54px)',
            height: 'clamp(44px, 12vw, 54px)',
            borderRadius: '50%',
            background: isSpeakerMuted ? '#ef4444' : 'rgba(255,255,255,0.08)',
            border: isSpeakerMuted ? 'none' : '1px solid rgba(255,255,255,0.12)',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0
          }}
          title={isSpeakerMuted ? 'Unmute Speaker' : 'Mute Speaker'}
        >
          {isSpeakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* End Call (Red Button) */}
        <button
          onClick={handleEndCall}
          style={{
            width: 'clamp(50px, 14vw, 62px)',
            height: 'clamp(50px, 14vw, 62px)',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ef4444 0%, #be123c 100%)',
            border: 'none',
            color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.55)',
            transition: 'transform 0.15s, background 0.15s',
            flexShrink: 0,
            marginLeft: '4px'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title="End Call"
        >
          <PhoneOff size={22} />
        </button>
      </footer>
    </div>
  );
}
