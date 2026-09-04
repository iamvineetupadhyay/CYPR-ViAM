import React, { useState, useEffect, useCallback } from 'react';
import {
  Heart, Film, ArrowLeft, Copy, Check, Users, Sparkles, Search,
  X, Paperclip, Smile, Send, Subtitles, Settings, Maximize, Play, Pause,
  Volume2, Video, VideoOff, Mic, MicOff, MessageSquare, Brain, Home,
  PhoneCall, PhoneOff, UserCheck, ShieldCheck, Zap
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

const SERVER_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:4000'
  : `${window.location.protocol}//${window.location.hostname}:4000`;

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
  onOpenProfile
}) {
  const [mediaState, setMediaState] = useState(initialMedia || {
    sourceType: 'direct',
    url: '',
    title: 'No movie selected',
    currentTime: 0,
    isPlaying: false
  });
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showAiCompanion, setShowAiCompanion] = useState(false);
  const [initialQuery, setInitialQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState([]);
  const [urlInput, setUrlInput] = useState('');
  const [showChatSidebar, setShowChatSidebar] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Face-to-Face Video & Mic Request States
  const [incomingCamRequest, setIncomingCamRequest] = useState(null);
  const [camRequestSent, setCamRequestSent] = useState(false);

  const {
    localStream, remoteStream,
    isMicMuted, isCamOff, isCallConnected, peerName,
    startLocalCall, stopLocalMedia, toggleMic, toggleCam
  } = useWebRTC(socket, roomId, currentUser);

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
        if (decrypted) setMediaState(decrypted);
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

        // Increment unread count if sidebar is closed
        setShowChatSidebar(current => {
          if (!current) setUnreadCount(c => c + 1);
          return current;
        });
      }
    });

    // Face-to-Face Video & Mic Socket Listeners
    socket.on('cinema-cam-request', (data) => {
      setIncomingCamRequest(data);
    });

    socket.on('cinema-cam-accepted', async () => {
      setCamRequestSent(false);
      await startLocalCall(true);
    });

    socket.on('cinema-cam-declined', (data) => {
      setCamRequestSent(false);
      alert(`⚠️ ${data.from?.name || 'Partner'} declined the camera & mic request.`);
    });

    socket.on('cinema-cam-stopped', () => {
      stopLocalMedia();
    });

    return () => {
      socket.off('media-changed');
      socket.off('initial-media-state');
      socket.off('initial-chat-history');
      socket.off('chat-message-received');
      socket.off('cinema-cam-request');
      socket.off('cinema-cam-accepted');
      socket.off('cinema-cam-declined');
      socket.off('cinema-cam-stopped');
    };
  }, [socket, roomId, onMediaChange, startLocalCall, stopLocalMedia]);

  const handleSelectMedia = async (newMedia) => {
    const updated = { ...mediaState, ...newMedia, currentTime: 0, isPlaying: true };
    setMediaState(updated);
    onMediaChange?.(updated);

    const encrypted = await encryptPayload(updated, roomId);
    socket?.emit('media-change', encrypted);
  };

  const handleSendChatMessage = async (msgData) => {
    const msgId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 6);
    const payload = typeof msgData === 'string'
      ? { id: msgId, text: msgData, senderName: currentUser?.name || 'You', timestamp: Date.now(), chatId: 'group' }
      : { id: msgId, ...msgData, senderName: currentUser?.name || 'You', timestamp: Date.now(), chatId: 'group' };

    setMessages((prev) => [...prev, payload]);
    const encrypted = await encryptPayload(payload, roomId);
    socket?.emit('chat-message', encrypted);
  };

  // Face-to-Face Cam Handlers
  const handleRequestFaceCam = () => {
    if (!socket) return;
    socket.emit('cinema-cam-request', { from: currentUser, isVideo: true, roomId });
    setCamRequestSent(true);
    setTimeout(() => setCamRequestSent(false), 12000);
  };

  const handleAcceptFaceCam = async () => {
    if (incomingCamRequest) {
      setIncomingCamRequest(null);
      await startLocalCall(true);
      socket?.emit('cinema-cam-accepted', { from: currentUser, roomId });
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      background: '#0b0806',
      color: '#fff',
      overflow: 'hidden',
      fontFamily: 'Plus Jakarta Sans, sans-serif',
      position: 'relative'
    }}>

      {/* ========================================================================= */}
      {/* 1. MATURE OBSIDIAN GLASS NAVIGATION BAR */}
      {/* ========================================================================= */}
      <div style={{
        height: '56px',
        background: 'rgba(9, 10, 15, 0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 18px',
        gap: '16px',
        zIndex: 50,
        flexShrink: 0
      }}>
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
              background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '20px', padding: '4px 12px 4px 10px', cursor: 'pointer',
              fontSize: '12px', color: '#a1a1aa', fontWeight: '600', transition: 'all 0.15s ease'
            }}
            title="Click to copy invite link"
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff5500'; e.currentTarget.style.background = 'rgba(255, 85, 0, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }} />
            <span style={{ color: '#ff661a', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '0.5px' }}>{roomId}</span>
            {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} color="#71717a" />}
          </div>
        </div>

        {/* Right Toolbar: Icon-First Actions with Tooltips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          
          {/* Movie Source Picker Chip */}
          <button
            onClick={() => setShowSourcePicker(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255, 85, 0, 0.14)', border: '1px solid rgba(255, 85, 0, 0.35)',
              borderRadius: '20px', padding: '5px 12px', color: '#fff', fontSize: '12px',
              fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 85, 0, 0.25)'; e.currentTarget.style.boxShadow = '0 0 14px rgba(255,85,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 85, 0, 0.14)'; e.currentTarget.style.boxShadow = 'none'; }}
            title="Browse Movies & Streaming Sources"
          >
            <Film size={14} color="#ff7733" />
            <span>Search Movies</span>
          </button>

          {/* Voice Assistant Mic */}
          <VoiceAssistant onCommand={handleVoiceCommand} onSearchMovie={() => setShowSourcePicker(true)} />

          {/* ViAM AI Movie Companion Toggle */}
          <button
            onClick={() => setShowAiCompanion(!showAiCompanion)}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: showAiCompanion ? 'rgba(255, 85, 0, 0.22)' : 'rgba(255, 255, 255, 0.05)',
              border: showAiCompanion ? '1px solid #ff5500' : '1px solid rgba(255, 255, 255, 0.1)',
              color: showAiCompanion ? '#ff5500' : 'rgba(255, 255, 255, 0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s ease',
              boxShadow: showAiCompanion ? '0 0 16px rgba(255,85,0,0.35)' : 'none'
            }}
            title="Toggle ViAM AI Movie Genie"
          >
            <Sparkles size={16} color={showAiCompanion ? '#ff5500' : '#a1a1aa'} />
          </button>

          {/* Dedicated Gemini AI Page Switcher */}
          <button
            onClick={onOpenAI}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '20px', padding: '5px 12px', color: '#c084fc', fontSize: '12px',
              fontWeight: '700', cursor: 'pointer', transition: 'all 0.15s ease'
            }}
            title="Open Full Gemini-Style Cinema AI Deck"
            onMouseEnter={e => { e.currentTarget.style.background = '#a855f7'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'; e.currentTarget.style.color = '#c084fc'; }}
          >
            <Brain size={14} />
            <span>ViAM AI</span>
          </button>

          {/* Home Hub Switcher */}
          <button
            onClick={onBack}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)'; }}
            title="Return to Lounge Home Hub"
          >
            <Home size={15} />
          </button>

          {/* Chat Sidebar Toggle in Navbar */}
          <button
            onClick={() => {
              setShowChatSidebar(prev => !prev);
              setUnreadCount(0);
            }}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: showChatSidebar ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              border: showChatSidebar ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
              color: showChatSidebar ? '#22c55e' : 'rgba(255, 255, 255, 0.8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s ease',
              position: 'relative'
            }}
            title="Toggle Cinema Chat Sidebar"
          >
            <MessageSquare size={15} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2, width: 14, height: 14,
                borderRadius: '50%', background: '#ff5500', color: '#fff',
                fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

          {/* Compact Profile Chip */}
          <HeaderProfileMenu
            userAccount={currentUser}
            onOpenProfile={onOpenProfile}
            onOpenHistory={onOpenProfile}
            onLogout={onBack}
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
            {/* Floating WebRTC Duo Webcams (Face-to-Face Live Overlay) */}
            <VideoCall
              localStream={localStream}
              remoteStream={remoteStream}
              isMicMuted={isMicMuted}
              isCamOff={isCamOff}
              toggleMic={toggleMic}
              toggleCam={toggleCam}
              isCallConnected={isCallConnected}
              peerName={peerName}
              currentUser={currentUser}
            />
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
                    is requesting to turn on Face-to-Face Video & Mic!
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
          <div style={{
            width: '330px', height: '100%', background: '#09090b',
            borderLeft: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', flexDirection: 'column', flexShrink: 0,
            overflow: 'hidden', position: 'relative'
          }}>
            {/* Header with Face-to-Face Video/Mic Trigger */}
            <div style={{
              height: '52px', padding: '0 12px',
              background: 'rgba(12, 14, 20, 0.98)', borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexShrink: 0, gap: '8px'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                    title="Request partner to turn on Face-to-Face Video & Mic"
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 85, 0, 0.35)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 85, 0, 0.2)'}
                  >
                    <Video size={12} color="#ff7733" />
                    <span>Face Cam</span>
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={toggleMic}
                      style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: isMicMuted ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        border: isMicMuted ? '1px solid #ef4444' : '1px solid #22c55e',
                        color: isMicMuted ? '#ef4444' : '#22c55e',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                      }}
                      title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
                    >
                      {isMicMuted ? <MicOff size={12} /> : <Mic size={12} />}
                    </button>

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
                      title="Stop Face-to-Face Cam"
                    >
                      <PhoneOff size={12} />
                    </button>
                  </div>
                )}

                {/* Close Sidebar Button */}
                <button
                  onClick={() => setShowChatSidebar(false)}
                  style={{
                    background: 'transparent', border: 'none', color: '#71717a',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#71717a'}
                  title="Hide Chat Sidebar (Click floating button to restore)"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Messages Stream Area */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <ChatWindow
                messages={messages}
                setMessages={setMessages}
                currentUser={currentUser}
                socket={socket}
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
      />

      {/* Groq AI Cinema Companion Floating Drawer */}
      <AiCinemaCompanion
        isOpen={showAiCompanion}
        onClose={() => setShowAiCompanion(false)}
        currentMovie={mediaState}
        socket={socket}
        roomId={roomId}
        currentUser={currentUser}
      />
    </div>
  );
}
