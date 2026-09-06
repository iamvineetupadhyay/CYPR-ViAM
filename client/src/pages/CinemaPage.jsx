import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, Film, ArrowLeft, Copy, Check, Users, Sparkles, Search,
  X, Paperclip, Smile, Send, Subtitles, Settings, Maximize, Play, Pause,
  Volume2, Video, VideoOff, Mic, MicOff, MessageSquare, Brain, Home,
  PhoneCall, PhoneOff, UserCheck, ShieldCheck, Zap, Sun, Moon
} from 'lucide-react';
import CinemaPlayer from '../components/CinemaPlayer';
import SourcePicker from '../components/SourcePicker';
import VideoCall from '../components/VideoCall';
import VoiceAssistant from '../components/VoiceAssistant';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import HeaderProfileMenu from '../components/HeaderProfileMenu';
import AiCinemaCompanion from '../components/AiCinemaCompanion';
import { useWebRTC } from '../hooks/useWebRTC';
import { encryptPayload, decryptPayload } from '../utils/cryptoUtils';
import { SERVER_URL } from '../utils/apiUrl';
import { getT } from '../utils/themeTokens';


export default function CinemaPage({
  currentUser,
  roomId,
  socket,
  roomUsers,
  onBack,
  onOpenChat,
  onOpenAI,
  onMediaChange,
  mediaState: initialMedia,
  onOpenProfile,
  onGlobalVoiceAction,
  onToggleTheme,
  theme = 'dark'
}) {
  const T = getT(theme);

  const [mediaState, setMediaState] = useState(initialMedia || {
    sourceType: 'direct',
    url: '',
    title: 'No movie selected',
    currentTime: 0,
    isPlaying: false
  });
  const [showSourcePicker, setShowSourcePicker] = useState(!initialMedia?.url);
  const [showAiCompanion, setShowAiCompanion] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [showChatSidebar, setShowChatSidebar] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Auto-open Source Picker modal if no movie URL is set to prevent blank screen
  useEffect(() => {
    if (!mediaState?.url) {
      setShowSourcePicker(true);
    }
  }, [mediaState?.url]);

  // Face-to-Face Video & Mic Request States
  const [incomingCamRequest, setIncomingCamRequest] = useState(null);
  const [camRequestSent, setCamRequestSent] = useState(false);

  const {
    localStream, remoteStream,
    isMicMuted, isCamOff, isCallConnected, peerName,
    startLocalCall, createOfferAndSend, stopLocalMedia, toggleMic, toggleCam
  } = useWebRTC(socket, roomId, currentUser);

  // Request initial room media state on join/mount
  useEffect(() => {
    if (socket) {
      socket.emit('media-sync-request');
    }
  }, [socket]);

  // Sync E2EE encrypted media state and chat messages from socket
  useEffect(() => {
    if (!socket) return;

    socket.on('media-changed', async (data) => {
      const decrypted = await decryptPayload(data, roomId);
      if (decrypted) {
        setMediaState(decrypted);
        onMediaChange?.(decrypted);
      }
    });

    socket.on('initial-media-state', async (data) => {
      if (data) {
        const decrypted = await decryptPayload(data, roomId);
        if (decrypted) {
          setMediaState(decrypted);
          onMediaChange?.(decrypted);
        }
      }
    });

    socket.on('initial-chat-history', async (history) => {
      if (Array.isArray(history) && history.length > 0) {
        const decryptedList = await Promise.all(
          history.map(async (msg) => {
            if (msg.isAI) return msg;
            const dec = msg.__e2ee ? await decryptPayload(msg, roomId) : msg;
            return dec || msg;
          })
        );
        setMessages(decryptedList);
      }
    });

    socket.on('chat-message-received', async (data) => {
      const decrypted = data.isAI ? data : (data.__e2ee ? await decryptPayload(data, roomId) : data);
      if (decrypted) {
        setMessages((prev) => {
          const isDuplicate = prev.some(m =>
            (m.id && decrypted.id && m.id === decrypted.id) ||
            (m.timestamp === decrypted.timestamp && m.senderName === decrypted.senderName && m.text === decrypted.text)
          );
          if (isDuplicate) return prev;
          return [...prev, decrypted];
        });

        // Emit delivery/seen tick to partner if received from partner
        if (decrypted.senderId && socket?.id && decrypted.senderId !== socket.id) {
          socket.emit('message-delivered', { messageId: decrypted.id || decrypted.timestamp, senderSocketId: decrypted.senderId });
          socket.emit('message-seen', { messageId: decrypted.id || decrypted.timestamp, senderSocketId: decrypted.senderId });
        }

        // Increment unread count if sidebar is closed
        setShowChatSidebar(current => {
          if (!current) setUnreadCount(c => c + 1);
          return current;
        });
      }
    });

    // WhatsApp Read Receipts Status Listener
    socket.on('message-status-update', ({ messageId, status }) => {
      setMessages(prev => prev.map(m => {
        const isTarget = (m.id && messageId && m.id === messageId) || (m.timestamp && m.timestamp === messageId);
        if (isTarget) {
          return {
            ...m,
            delivered: true,
            read: status === 'seen' ? true : m.read
          };
        }
        return m;
      }));
    });

    socket.on('message-deleted', ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        (m.id === messageId || m.timestamp === messageId) ? { ...m, deleted: true } : m
      ));
    });

    socket.on('message-reacted', ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => {
        const mId = String(m.id || m.timestamp);
        const targetId = String(messageId);
        if (mId === targetId || String(m.id) === targetId || String(m.timestamp) === targetId) {
          return { ...m, reactions: reactions || {} };
        }
        return m;
      }));
    });

    // Face-to-Face Video Socket Listeners (Strictly Video Only — No Audio)
    socket.on('cinema-cam-request', (data) => {
      setIncomingCamRequest(data);
    });

    socket.on('cinema-cam-accepted', async (data) => {
      setCamRequestSent(false);
      // Video ONLY, no audio!
      await startLocalCall(true, false);
      const targetId = data?.senderSocketId;
      if (targetId && createOfferAndSend) {
        createOfferAndSend(targetId);
      }
    });

    socket.on('cinema-cam-declined', (data) => {
      setCamRequestSent(false);
      alert(`⚠️ ${data.from?.name || 'Partner'} declined the Face Cam request.`);
    });

    socket.on('cinema-cam-stopped', () => {
      stopLocalMedia();
    });

    return () => {
      socket.off('media-changed');
      socket.off('initial-media-state');
      socket.off('initial-chat-history');
      socket.off('chat-message-received');
      socket.off('message-status-update');
      socket.off('message-deleted');
      socket.off('message-reacted');
      socket.off('cinema-cam-request');
      socket.off('cinema-cam-accepted');
      socket.off('cinema-cam-declined');
      socket.off('cinema-cam-stopped');
    };
  }, [socket, roomId, onMediaChange, startLocalCall, createOfferAndSend, stopLocalMedia]);

  const handleSelectMedia = async (newMedia) => {
    const updated = { ...mediaState, ...newMedia, currentTime: 0, isPlaying: true };
    setMediaState(updated);
    onMediaChange?.(updated);

    socket?.emit('media-change', updated);
  };

  const handleSendChatMessage = async (msgData) => {
    const msgId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 6);
    const payload = typeof msgData === 'string'
      ? { id: msgId, senderId: socket?.id, text: msgData, senderName: currentUser?.name || 'You', timestamp: Date.now(), chatId: 'group', target: 'group', recipientSocketId: 'group' }
      : { id: msgId, senderId: socket?.id, ...msgData, senderName: currentUser?.name || 'You', timestamp: Date.now(), chatId: 'group', target: 'group', recipientSocketId: 'group' };

    setMessages((prev) => [...prev, payload]);
    socket?.emit('chat-message', payload);
  };

  // Face-to-Face Cam Handlers (Strictly Video Only — No Audio)
  const handleRequestFaceCam = async () => {
    if (!socket) return;
    socket.emit('cinema-cam-request', { from: currentUser, isVideo: true, roomId });
    setCamRequestSent(true);
    // Video ONLY, no audio!
    await startLocalCall(true, false);
    setTimeout(() => setCamRequestSent(false), 12000);
  };

  const handleAcceptFaceCam = async () => {
    if (incomingCamRequest) {
      const requesterSocketId = incomingCamRequest.senderSocketId;
      setIncomingCamRequest(null);
      // Video ONLY, no audio!
      await startLocalCall(true, false);
      socket?.emit('cinema-cam-accepted', {
        from: currentUser,
        roomId,
        targetSocketId: requesterSocketId,
        senderSocketId: socket?.id
      });
      if (requesterSocketId && createOfferAndSend) {
        createOfferAndSend(requesterSocketId);
      }
    }
  };

  const handleDeclineFaceCam = () => {
    if (incomingCamRequest) {
      socket?.emit('cinema-cam-declined', { from: currentUser, roomId });
      setIncomingCamRequest(null);
    }
  };

  const handleStopFaceCam = () => {
    stopLocalMedia();
    socket?.emit('cinema-cam-stopped');
  };

  const handleVoiceCommand = async (parsed) => {
    if (parsed.action === 'SEARCH_AND_PLAY') {
      try {
        const res = await fetch(`${SERVER_URL}/api/search/all?q=${encodeURIComponent(parsed.query)}`);
        const data = await res.json();
        if (data.movies?.length > 0) {
          handleSelectMedia({ sourceType: data.movies[0].type, url: data.movies[0].url, title: data.movies[0].title });
        } else if (data.youtube?.length > 0) {
          handleSelectMedia({ sourceType: 'youtube', url: data.youtube[0].url, title: data.youtube[0].title });
        } else {
          setInitialQuery(parsed.query);
          setShowSourcePicker(true);
        }
      } catch { setInitialQuery(parsed.query); setShowSourcePicker(true); }
    } else if (parsed.action === 'SEARCH') {
      setInitialQuery(parsed.query);
      setShowSourcePicker(true);
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?room=${encodeURIComponent(roomId)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const partnerCount = roomUsers?.filter(u => u.socketId !== socket?.id).length || 0;
  const isVideoActive = Boolean(localStream || remoteStream || isCallConnected);

  return (
    <div className="app-page-dark" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: T.cinemaBg,
      color: T.textPrimary,
      overflow: 'hidden',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      position: 'relative',
      transition: 'background 0.4s ease, color 0.35s ease'
    }}>

      {/* ========================================================================= */}
      {/* 1. MATURE OBSIDIAN GLASS NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div
        className="cinema-nav-toolbar"
        style={{
          height: '56px',
          background: T.cinemaToolbarBg,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${T.border2}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          gap: '16px',
          zIndex: 50,
          flexShrink: 0,
          transition: 'background 0.4s ease, border-color 0.35s ease'
        }}
      >
        {/* Left: Brand Logo + Room Code Link Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <div
            onClick={onBack}
            style={{
              background: 'transparent', border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0
            }}
            title="Return to Home Hub"
          >
            <img
              src="/viam_logo.png"
              alt="CYPR ViAM"
              className="viam-logo-animated"
              style={{
                height: '56px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 14px rgba(255,85,0,0.5))'
              }}
            />
          </div>

          {/* Room Link Pill with Pulse Indicator */}
          <div
            onClick={copyInvite}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: T.chipBg, border: `1px solid ${T.chipBorder}`,
              borderRadius: '20px', padding: '4px 12px 4px 10px', cursor: 'pointer',
              fontSize: '12px', color: T.textMuted2, fontWeight: '600', transition: 'all 0.15s ease'
            }}
            title="Click to copy invite link"
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.border4; e.currentTarget.style.background = T.pillBg; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.chipBorder; e.currentTarget.style.background = T.chipBg; }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ color: T.textPrimary, fontFamily: 'monospace', fontWeight: '700', letterSpacing: '0.5px' }}>{roomId}</span>
            {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} color={T.textMuted2} />}
          </div>
        </div>

        {/* Right Toolbar: Exact Clean "4 Pills + 1 Mic" Layout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>

          {/* Pill 1: Choose Movie */}
          <button
            className="cinema-header-pill"
            onClick={() => setShowSourcePicker(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '36px', padding: '0 14px', borderRadius: '20px',
              background: T.pillBg,
              border: `1px solid ${T.pillBorder}`,
              color: T.pillText, fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255, 85, 0, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(255, 85, 0, 0.4)';
              e.currentTarget.style.color = '#ff7733';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = T.pillBg;
              e.currentTarget.style.borderColor = T.pillBorder;
              e.currentTarget.style.color = T.pillText;
            }}
            title="Browse & Choose Movies"
          >
            <Film size={15} color="#ff7733" />
            <span className="cinema-pill-text">Choose Movie</span>
          </button>

          {/* Pill 2: Lounge Chat */}
          <button
            className="cinema-header-pill"
            onClick={() => {
              setUnreadCount(0);
              onOpenChat?.();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '36px', padding: '0 14px', borderRadius: '20px',
              background: T.pillBg,
              border: `1px solid ${T.pillBorder}`,
              color: T.pillText, fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', transition: 'all 0.15s ease', position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(34, 197, 94, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.4)';
              e.currentTarget.style.color = '#22c55e';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = T.pillBg;
              e.currentTarget.style.borderColor = T.pillBorder;
              e.currentTarget.style.color = T.pillText;
            }}
            title="Open Full Chatting Messenger Page"
          >
            <MessageSquare size={15} color="#22c55e" />
            <span className="cinema-pill-text">Lounge Chat</span>
            {unreadCount > 0 && (
              <span style={{
                background: '#22c55e', color: '#fff',
                fontSize: '9.5px', fontWeight: 800, padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* +1 Mic: Voice Assistant Mic */}
          <VoiceAssistant onCommand={handleVoiceCommand} onSearchMovie={() => setShowSourcePicker(true)} onGlobalVoiceAction={onGlobalVoiceAction} theme={theme} />

          {/* Pill 3: ViAM AI Navigation */}
          <button
            className="cinema-header-pill"
            onClick={onOpenAI}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              height: '36px', padding: '0 14px', borderRadius: '20px',
              background: 'rgba(168, 85, 247, 0.15)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: T.pillText, fontSize: '13px', fontWeight: '700',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.25)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)';
              e.currentTarget.style.color = '#c084fc';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
              e.currentTarget.style.color = T.pillText;
            }}
            title="Open ViAM AI Gemini Companion Interface"
          >
            <Sparkles size={15} color="#c084fc" />
            <span className="cinema-pill-text">ViAM AI</span>
          </button>

          {/* Vertical Divider */}
          <div style={{ width: '1px', height: '20px', background: T.border2, margin: '0 2px' }} />

          {/* Pill 4: User Profile Menu */}
          <HeaderProfileMenu
            userAccount={currentUser}
            onOpenProfile={onOpenProfile}
            onOpenHistory={onOpenProfile}
            onLogout={onBack}
            theme={theme}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CINEMA PLAYER WITH RIGHT LIVE CHAT SIDEBAR */}
      {/* ========================================================================= */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* CENTER COLUMN: 4K CINEMA SCREEN & PLAYBACK */}
        <div style={{ flex: 1, background: '#000', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
          <CinemaPlayer
            mediaState={mediaState}
            socket={socket}
            currentUser={currentUser}
            roomId={roomId}
            onOpenSourcePicker={() => setShowSourcePicker(true)}
            onMediaChange={handleSelectMedia}
          >
            {/* Floating WebRTC Duo Webcams (Face-to-Face Live Overlay on Player ONLY IF Sidebar is Closed) */}
            {!showChatSidebar && isVideoActive && (
              <VideoCall
                layoutMode="floating"
                localStream={localStream}
                remoteStream={remoteStream}
                isCamOff={isCamOff}
                toggleCam={toggleCam}
                isCallConnected={isCallConnected}
                peerName={peerName}
                currentUser={currentUser}
                audioEnabled={false}
              />
            )}
          </CinemaPlayer>

          {/* 🌟 FLOATING ICON-ONLY TOGGLE BUTTON TO RE-OPEN CHAT WHEN CUT/COLLAPSED */}
          {!showChatSidebar && (
            <button
              onClick={() => {
                setShowChatSidebar(true);
                setUnreadCount(0);
              }}
              style={{
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                zIndex: 90,
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(255, 85, 0, 0.95) 0%, rgba(224, 68, 0, 0.98) 100%)',
                border: '1.5px solid rgba(255, 255, 255, 0.25)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 10px 32px rgba(0,0,0,0.7), 0 0 24px rgba(255,85,0,0.45)',
                backdropFilter: 'blur(16px)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                animation: unreadCount > 0 ? 'pulse 1.5s infinite' : 'none'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 14px 40px rgba(255,85,0,0.6)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '0 10px 32px rgba(0,0,0,0.7), 0 0 24px rgba(255,85,0,0.45)';
              }}
              title="Open Cinema Live Chat & Face-to-Face Cam"
            >
              <MessageSquare size={20} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#22c55e',
                  color: '#fff',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 900,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* 🌟 INCOMING FACE-TO-FACE VIDEO/MIC REQUEST MODAL (Over Cinema Screen) */}
          {incomingCamRequest && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 100,
              background: 'rgba(15, 18, 28, 0.96)',
              border: '1.5px solid #ff5500',
              borderRadius: '20px',
              padding: '18px 24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(255, 85, 0, 0.3)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '420px',
              width: '90%',
              animation: 'fadeIn 0.3s ease'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ff5500, #b83200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', boxShadow: '0 4px 16px rgba(255,85,0,0.4)'
                }}>
                  <Video size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14.5px', fontWeight: '800', color: '#fff' }}>
                    {incomingCamRequest.from?.name || 'Partner'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa' }}>
                    is requesting to turn on Face Cam (Silent Video Overlay)!
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={handleAcceptFaceCam}
                  style={{
                    height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    border: 'none', color: '#fff', fontSize: '12.5px', fontWeight: '800',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <Video size={14} /> Accept & Start
                </button>
                <button
                  onClick={handleDeclineFaceCam}
                  style={{
                    height: '38px', borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#a1a1aa', fontSize: '12.5px', fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Request Sent Waiting Feedback Toast */}
          {camRequestSent && (
            <div style={{
              position: 'absolute',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 95,
              background: 'rgba(15, 18, 28, 0.92)',
              border: '1px solid #ff5500',
              borderRadius: '16px',
              padding: '10px 20px',
              color: '#fff',
              fontSize: '12.5px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5500', animation: 'pulse 1s infinite' }} />
              <span>Face-to-Face video request sent to partner...</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: LIVE CINEMA CHAT SIDEBAR WITH TOP VIDEO/MIC CONTROLS */}
        {showChatSidebar && (
          <div
            className="cinema-mobile-chat-overlay"
            style={{
              width: '330px', height: '100%', background: T.cinemaSidebarBg,
              borderLeft: `1px solid ${T.border2}`,
              display: 'flex', flexDirection: 'column', flexShrink: 0,
              overflow: 'hidden', position: 'relative',
              transition: 'background 0.35s ease, border-color 0.3s ease'
            }}
          >
            {/* Header with Face-to-Face Video/Mic Trigger */}
            <div style={{
              height: '52px', padding: '0 12px',
              background: T.cinemaHeaderBg, borderBottom: `1px solid ${T.border2}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0, gap: '8px',
              transition: 'background 0.35s ease'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: T.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={14} color="#ff5500" />
                Live Chat
              </span>

              {/* 🌟 TOP REQUEST TO VIDEO CAMERA & MICROPHONE BUTTON */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {!isVideoActive ? (
                  <button
                    onClick={handleRequestFaceCam}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      background: 'linear-gradient(135deg, rgba(255, 85, 0, 0.2) 0%, rgba(255, 85, 0, 0.1) 100%)',
                      border: '1px solid rgba(255, 85, 0, 0.45)',
                      borderRadius: '16px', padding: '4px 10px',
                      color: '#ff7733', fontSize: '11px', fontWeight: '800',
                      cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                    title="Request partner to turn on Face Cam (Video Only)"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 85, 0, 0.35)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 85, 0, 0.2)'}
                  >
                    <Video size={12} color="#ff7733" />
                    <span>Face Cam</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={toggleCam}
                      style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: isCamOff ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        border: isCamOff ? '1px solid #ef4444' : '1px solid #22c55e',
                        color: isCamOff ? '#ef4444' : '#22c55e',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                      title={isCamOff ? 'Turn Camera On' : 'Turn Camera Off'}
                    >
                      {isCamOff ? <VideoOff size={12} /> : <Video size={12} />}
                    </button>

                    <button
                      onClick={handleStopFaceCam}
                      style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444',
                        color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                      title="Stop Face Cam"
                    >
                      <PhoneOff size={12} />
                    </button>
                  </div>
                )}

                {/* Close Sidebar Button */}
                <button
                  onClick={() => setShowChatSidebar(false)}
                  style={{
                    background: 'transparent', border: 'none', color: T.textMuted2,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = T.textPrimary}
                  onMouseLeave={e => e.currentTarget.style.color = T.textMuted2}
                  title="Hide Chat Sidebar (Click floating button to restore)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* 🌟 RECTANGULAR / SQUARE LIVE WEBCAM VIDEO CARDS (Below Live Chat Header, Above Encryption) */}
            {isVideoActive && (
              <VideoCall
                layoutMode="sidebar"
                localStream={localStream}
                remoteStream={remoteStream}
                isCamOff={isCamOff}
                toggleCam={toggleCam}
                isCallConnected={isCallConnected}
                peerName={peerName}
                currentUser={currentUser}
                audioEnabled={false}
              />
            )}

            {/* Messages Stream Area */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ChatWindow
                messages={messages}
                setMessages={setMessages}
                currentUser={currentUser}
                socket={socket}
                theme={theme}
              />
            </div>

            {/* Bottom Chat Input */}
            <div style={{ flexShrink: 0 }}>
              <ChatInput
                onSendMessage={handleSendChatMessage}
                socket={socket}
                currentUser={currentUser}
                partnerName={peerName}
                compact={true}
                theme={theme}
              />
            </div>
          </div>
        )}

      </div>

      {/* Source Picker Modal */}
      <SourcePicker
        isOpen={showSourcePicker}
        onClose={() => { setShowSourcePicker(false); setInitialQuery(''); }}
        onSelectMedia={handleSelectMedia}
        initialQuery={initialQuery}
        theme={theme}
      />

      {/* Groq AI Cinema Companion Floating Drawer */}
      <AiCinemaCompanion
        isOpen={showAiCompanion}
        onClose={() => setShowAiCompanion(false)}
        currentMovie={mediaState}
        socket={socket}
        roomId={roomId}
        currentUser={currentUser}
        theme={theme}
      />
    </div>
  );
}
