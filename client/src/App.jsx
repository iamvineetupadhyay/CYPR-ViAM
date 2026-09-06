import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ConnectPage from './pages/ConnectPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import CinemaPage from './pages/CinemaPage';
import ProfilePage from './pages/ProfilePage';
import CallPage from './pages/CallPage';
import AiPage from './pages/AiPage';
import FloatingCallWindow from './components/FloatingCallWindow';
import { useWebRTC } from './hooks/useWebRTC';
import { SERVER_URL } from './utils/apiUrl';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [roomUsers, setRoomUsers] = useState([]);
  const [page, setPage] = useState('connect'); // 'connect' | 'home' | 'chat' | 'cinema' | 'profile' | 'call'
  const [callIsVideo, setCallIsVideo] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [knockPending, setKnockPending] = useState(false);
  const [knockRequests, setKnockRequests] = useState([]);

  // Shared WebRTC instance attached at App root
  const webrtc = useWebRTC(socket, roomId, currentUser);

  // Shared media state — synced between Chat & Cinema page
  const [mediaState, setMediaState] = useState({
    sourceType: 'direct',
    url: '',
    title: 'No movie selected',
    currentTime: 0,
    isPlaying: false
  });

  const [theme, setTheme] = useState(() => localStorage.getItem('cypr_theme') || 'dark');

  // Handle Theme switching on root element
  useEffect(() => {
    localStorage.setItem('cypr_theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // Speech TTS Output Helper
  const speakText = (text) => {
    if ('speechSynthesis' in window && text) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('[Speech Synthesis Error]', e);
      }
    }
  };

  // Global AI Voice Intent Executor
  const handleGlobalVoiceAction = async (parsed) => {
    if (!parsed) return;

    if (parsed.action === 'SWITCH_THEME') {
      const newTheme = parsed.theme === 'toggle' ? (theme === 'dark' ? 'light' : 'dark') : parsed.theme;
      setTheme(newTheme);
      speakText(`Switched to ${newTheme} theme!`);
    } else if (parsed.action === 'NAVIGATE') {
      setPage(parsed.page);
      const pageNames = { chat: 'Messenger Chat', cinema: '4K Cinema Player', home: 'Home Hub', ai: 'ViAM AI Companion', profile: 'User Profile' };
      speakText(`Opening ${pageNames[parsed.page] || parsed.page}`);
    } else if (parsed.action === 'SEARCH_AND_PLAY') {
      speakText(`Searching and playing ${parsed.query} now.`);
      setPage('cinema');

      try {
        const isAnime = /anime|naruto|doraemon|solo leveling|one piece|dragon ball|pokemon|beyblade|jujutsu|bleach|attack on titan/i.test(parsed.query);
        const endpoint = isAnime
          ? `${SERVER_URL}/api/search/watchanimeworld/resolve?title=${encodeURIComponent(parsed.query)}`
          : `${SERVER_URL}/api/search/all?q=${encodeURIComponent(parsed.query)}`;

        const res = await fetch(endpoint);
        const data = await res.json();

        if (isAnime && data.servers && data.servers.length > 0) {
          const newMedia = {
            sourceType: 'embed',
            url: data.activeUrl || data.servers[0].url,
            title: data.title || parsed.query,
            servers: data.servers,
            isPlaying: true
          };
          setMediaState(newMedia);
          if (socket) socket.emit('change-media', newMedia);
        } else if (data.movies && data.movies.length > 0) {
          const top = data.movies[0];
          const newMedia = {
            sourceType: top.type || 'embed',
            url: top.url,
            title: top.title,
            servers: top.servers,
            isPlaying: true
          };
          setMediaState(newMedia);
          if (socket) socket.emit('change-media', newMedia);
        } else if (data.youtube && data.youtube.length > 0) {
          const yt = data.youtube[0];
          const newMedia = {
            sourceType: 'youtube',
            url: yt.url,
            title: yt.title,
            isPlaying: true
          };
          setMediaState(newMedia);
          if (socket) socket.emit('change-media', newMedia);
        }
      } catch (err) {
        console.error('[Voice Play Error]', err);
      }
    } else if (parsed.action === 'AI_QUERY') {
      try {
        const res = await fetch(`${SERVER_URL}/api/ai/companion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: parsed.query, currentMovie: mediaState })
        });
        const data = await res.json();
        const reply = data.reply || "I am ViAM AI, your cinema assistant.";
        speakText(reply);
      } catch (e) {
        speakText("I processed your query.");
      }
    }
  };

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10
    });
    setSocket(newSocket);

    // Auto-reconnect on page load / refresh if in room or URL has ?room=
    newSocket.on('connect', () => {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = (params.get('room') || params.get('join') || sessionStorage.getItem('cypr_active_room') || '').trim().toLowerCase();
      
      if (urlRoom) {
        const savedAccountStr = localStorage.getItem('cypr_user_account');
        let savedAccount = null;
        try { savedAccount = savedAccountStr ? JSON.parse(savedAccountStr) : null; } catch {}
        const savedName = savedAccount?.name || localStorage.getItem('cypr_user_name') || 'Guest User';
        const savedPasscode = sessionStorage.getItem(`cypr_passcode_${urlRoom}`) || '';

        const userObj = { name: savedName, socketId: newSocket.id, avatar: savedAccount?.avatar };
        setCurrentUser(userObj);
        setRoomId(urlRoom);
        sessionStorage.setItem('cypr_active_room', urlRoom);

        newSocket.emit('join-room', {
          roomId: urlRoom,
          user: userObj,
          passcode: savedPasscode,
          isCreateMode: false
        });
      }
    });

    newSocket.on('room-users-update', ({ users }) => {
      setRoomUsers(users);
      setKnockPending(false);
      setPage((prevPage) => (prevPage === 'connect' ? 'home' : prevPage));
    });

    newSocket.on('room-joined', ({ roomId, isHost }) => {
      setKnockPending(false);
      setPage('home');
    });

    newSocket.on('initial-media-state', (state) => { if (state) setMediaState(state); });
    newSocket.on('media-changed', (state) => setMediaState(state));

    // Security Knock & Approval Handlers
    newSocket.on('knock-pending', () => {
      setKnockPending(true);
    });

    newSocket.on('knock-approved', () => {
      setKnockPending(false);
      setPage('home');
    });

    newSocket.on('knock-rejected', ({ message }) => {
      setKnockPending(false);
      sessionStorage.removeItem('cypr_active_room');
      alert(`🔒 Access Denied: ${message || 'The Room Host declined your request.'}`);
      setPage('connect');
      setRoomId('');
      window.history.pushState({}, '', window.location.pathname);
    });

    newSocket.on('knock-request', (req) => {
      setKnockRequests((prev) => [...prev.filter((r) => r.requestId !== req.requestId), req]);
    });

    newSocket.on('room-error', ({ code, message }) => {
      setKnockPending(false);
      if (code === 'PASSCODE_INVALID') {
        const pass = prompt(`🔒 Private Lounge Locked!\n\nThis room is protected by a secret Passcode/PIN. Please enter the passcode to request entry:`);
        if (pass && pass.trim()) {
          const params = new URLSearchParams(window.location.search);
          const roomParam = (params.get('room') || params.get('join') || sessionStorage.getItem('cypr_active_room') || '').trim().toLowerCase();
          let savedName = localStorage.getItem('cypr_user_name') || 'Guest User';
          sessionStorage.setItem(`cypr_passcode_${roomParam}`, pass.trim());
          newSocket.emit('join-room', {
            roomId: roomParam,
            user: { name: savedName, socketId: newSocket.id },
            passcode: pass.trim(),
            maxCapacity: 2,
            isPublic: false
          });
          return;
        }
      }
      sessionStorage.removeItem('cypr_active_room');
      alert(`⚠️ ${message}`);
      setPage('connect');
      setRoomId('');
      window.history.pushState({}, '', window.location.pathname);
    });

    return () => newSocket.disconnect();
  }, []);

  const handleConnect = ({ name, roomId: joinedRoomId, passcode, maxCapacity, isPublic, isCreateMode }) => {
    const cleanId = (joinedRoomId || 'cypr-lounge').toLowerCase().trim();
    const finalName = name || localStorage.getItem('cypr_user_name') || 'Host';
    const userObj = { name: finalName, socketId: socket?.id };
    setCurrentUser(userObj);
    setRoomId(cleanId);
    
    // Remember room & passcode in session storage so page refresh retains access
    sessionStorage.setItem('cypr_active_room', cleanId);
    if (passcode) {
      sessionStorage.setItem(`cypr_passcode_${cleanId}`, passcode);
    }

    // If creating a room, redirect Host to Home Hub immediately
    if (isCreateMode) {
      setPage('home');
    }

    if (socket) {
      socket.emit('join-room', { roomId: cleanId, user: userObj, passcode, maxCapacity, isPublic, isCreateMode });
    }
    const newUrl = `${window.location.pathname}?room=${encodeURIComponent(cleanId)}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleAcceptKnock = (requestId) => {
    if (socket) socket.emit('knock-accept', { targetSocketId: requestId });
    setKnockRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  const handleDenyKnock = (requestId) => {
    if (socket) socket.emit('knock-deny', { targetSocketId: requestId });
    setKnockRequests((prev) => prev.filter((r) => r.requestId !== requestId));
  };

  const handleLeave = () => {
    if (isCallActive) handleEndCall();
    sessionStorage.removeItem('cypr_active_room');
    setPage('connect');
    setCurrentUser(null);
    setRoomUsers([]);
    setRoomId('');
    window.history.pushState({}, '', window.location.pathname);
  };

  const handleOpenCall = (isVideo = true) => {
    setCallIsVideo(isVideo);
    setIsCallActive(true);
    setIsCallMinimized(false);
    setPage('call');
  };

  const handleEndCall = () => {
    if (socket) socket.emit('call-ended', { to: roomId });
    webrtc.stopLocalMedia();
    setIsCallActive(false);
    setIsCallMinimized(false);
    setPage('chat');
  };

  // Shared props
  const sharedProps = { currentUser, roomId, socket, roomUsers, onGlobalVoiceAction: handleGlobalVoiceAction, theme, onToggleTheme: () => setTheme(t => t === 'dark' ? 'light' : 'dark') };

  return (
    <>
      {page === 'connect' && (
        <ConnectPage
          onConnect={handleConnect}
          onOpenProfile={() => setPage('profile')}
          onToggleTheme={sharedProps.onToggleTheme}
          theme={theme}
          onGlobalVoiceAction={sharedProps.onGlobalVoiceAction}
        />
      )}

      {page === 'home' && (
        <HomePage
          {...sharedProps}
          mediaState={mediaState}
          onNavigate={(target) => setPage(target)}
          onOpenCinema={() => setPage('cinema')}
          onOpenChat={() => setPage('chat')}
          onOpenAI={() => setPage('ai')}
          onOpenCall={handleOpenCall}
          onOpenProfile={() => setPage('profile')}
          onLeave={handleLeave}
        />
      )}

      {page === 'profile' && (
        <ProfilePage
          userAccount={currentUser}
          onBack={() => setPage(currentUser ? 'home' : 'connect')}
          onLogout={handleLeave}
          onRejoinRoom={(code) => handleConnect({ name: currentUser?.name || 'User', roomId: code })}
          onPlayShow={() => setPage('cinema')}
          theme={theme}
          onGlobalVoiceAction={sharedProps.onGlobalVoiceAction}
        />
      )}

      {page === 'cinema' && (
        <CinemaPage
          {...sharedProps}
          mediaState={mediaState}
          onBack={() => setPage('home')}
          onOpenChat={() => setPage('chat')}
          onOpenAI={() => setPage('ai')}
          onMediaChange={setMediaState}
          onOpenProfile={() => setPage('profile')}
        />
      )}

      {page === 'ai' && (
        <AiPage
          {...sharedProps}
          mediaState={mediaState}
          onNavigate={(target) => setPage(target)}
          onOpenHome={() => setPage('home')}
          onOpenCinema={() => setPage('cinema')}
          onOpenChat={() => setPage('chat')}
          onOpenProfile={() => setPage('profile')}
          onLeave={handleLeave}
        />
      )}

      {page === 'call' && (
        <CallPage
          {...sharedProps}
          webrtc={webrtc}
          initialIsVideo={callIsVideo}
          onBackToChat={() => {
            setIsCallMinimized(true);
            setPage('chat');
          }}
          onMinimizeCall={() => {
            setIsCallMinimized(true);
            setPage('home');
          }}
        />
      )}

      {page === 'chat' && (
        <ChatPage
          {...sharedProps}
          mediaState={mediaState}
          onMediaChange={setMediaState}
          onOpenHome={() => setPage('home')}
          onOpenCinema={() => setPage('cinema')}
          onOpenAI={() => setPage('ai')}
          onOpenProfile={() => setPage('profile')}
          onOpenCall={handleOpenCall}
          onLeave={handleLeave}
        />
      )}

      {/* Floating Video Call Window */}
      {isCallActive && isCallMinimized && page !== 'call' && (
        <FloatingCallWindow
          localStream={webrtc.localStream}
          remoteStream={webrtc.remoteStream}
          isMicMuted={webrtc.isMicMuted}
          isCamOff={webrtc.isCamOff}
          isVideoCall={callIsVideo}
          partnerName={webrtc.peerName}
          isCallConnected={webrtc.isCallConnected}
          toggleMic={webrtc.toggleMic}
          toggleCam={webrtc.toggleCam}
          onExpand={() => {
            setIsCallMinimized(false);
            setPage('call');
          }}
          onEndCall={handleEndCall}
        />
      )}

      {/* KNOCK PENDING WAITING OVERLAY (For Guest) */}
      {knockPending && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(5, 5, 8, 0.92)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px', textAlign: 'center', color: '#fff'
        }}>
          <div style={{
            background: '#120d09', border: '1px solid #ff5500', borderRadius: '24px',
            padding: '36px 32px', maxWidth: '420px', width: '100%',
            boxShadow: '0 20px 60px rgba(255, 85, 0, 0.25)', animation: 'pulse 2s infinite'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚪</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              Waiting for Host Approval
            </h3>
            <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: '1.6', marginBottom: '24px' }}>
              This private lounge is strictly protected. Your knock request has been sent to the Room Host.
            </p>
            <button
              onClick={handleLeave}
              style={{
                padding: '10px 24px', borderRadius: '10px', background: '#27272a',
                border: 'none', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              Cancel Request
            </button>
          </div>
        </div>
      )}

      {/* HOST KNOCK APPROVAL NOTIFICATION MODALS (For Host) */}
      {knockRequests.length > 0 && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 99999,
          display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '380px', width: '100%'
        }}>
          {knockRequests.map((req) => (
            <div
              key={req.requestId}
              style={{
                background: '#0d0d11', border: '1.5px solid #ff5500', borderRadius: '16px',
                padding: '18px 20px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.9)',
                color: '#fff', display: 'flex', flexDirection: 'column', gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: '#ff5500',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'
                }}>
                  🚪
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                    {req.user?.name || 'Guest User'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#a1a1aa' }}>
                    is knocking to enter your private lounge!
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => handleAcceptKnock(req.requestId)}
                  style={{
                    height: '36px', borderRadius: '8px', background: '#ff5500', border: 'none',
                    color: '#fff', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleDenyKnock(req.requestId)}
                  style={{
                    height: '36px', borderRadius: '8px', background: '#27272a', border: 'none',
                    color: '#a1a1aa', fontSize: '12px', fontWeight: '700', cursor: 'pointer'
                  }}
                >
                  ❌ Decline
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
