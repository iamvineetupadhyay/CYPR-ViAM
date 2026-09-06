import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ConnectPage from './pages/ConnectPage';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import CinemaPage from './pages/CinemaPage';
import ProfilePage from './pages/ProfilePage';
import CallPage from './pages/CallPage';
import AiPage from './pages/AiPage';
import RoomsPage from './pages/RoomsPage';
import FloatingCallWindow from './components/FloatingCallWindow';
import GlobalIncomingCallModal from './components/GlobalIncomingCallModal';
import RoomPasscodeModal from './components/RoomPasscodeModal';
import { useWebRTC } from './hooks/useWebRTC';
import { SERVER_URL } from './utils/apiUrl';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [roomUsers, setRoomUsers] = useState([]);
  const [page, setPage] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const hasRoom = (params.get('room') || params.get('join') || sessionStorage.getItem('cypr_active_room') || '').trim();
      const savedPage = sessionStorage.getItem('cypr_active_page');
      if (hasRoom && savedPage && savedPage !== 'connect') {
        return savedPage;
      }
    } catch {}
    return 'connect';
  });
  const [callIsVideo, setCallIsVideo] = useState(true);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCallMinimized, setIsCallMinimized] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [passcodeModal, setPasscodeModal] = useState({ isOpen: false, roomId: '', error: '' });
  const [knockPending, setKnockPending] = useState(false);
  const [knockRequests, setKnockRequests] = useState([]);

  // Preserve active page across refresh
  useEffect(() => {
    if (page && page !== 'connect') {
      sessionStorage.setItem('cypr_active_page', page);
    }
  }, [page]);

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
      return { handled: true, success: true, feedback: `🎨 Switched to ${newTheme} theme!` };
    }

    if (parsed.action === 'NAVIGATE' || parsed.action === 'SEARCH_AND_PLAY') {
      const savedAccountStr = localStorage.getItem('cypr_user_account');
      let savedAccount = null;
      try { savedAccount = savedAccountStr ? JSON.parse(savedAccountStr) : null; } catch {}
      const isLoggedIn = Boolean(savedAccount && (savedAccount.email || savedAccount.name));
      const activeRoom = (roomId || sessionStorage.getItem('cypr_active_room') || '').trim();

      // 1. Guest user check: "agr user guest user h to Login and signup ko bole"
      if (!isLoggedIn) {
        const msg = "Please log in or sign up first to access this page.";
        speakText(msg);
        return {
          handled: true,
          success: false,
          feedback: "🔒 Pehle Login ya Signup karein! (Please Log In / Sign Up)"
        };
      }

      // If user is logged in and asks for personal profile
      if (parsed.action === 'NAVIGATE' && parsed.page === 'profile') {
        const msg = "Opening User Profile";
        speakText(msg);
        setPage('profile');
        return { handled: true, success: true, feedback: `👤 ${msg}` };
      }

      // 2. User logged in, but room not created/joined: "agr user login h aur room nhi banaya to room banane ko bole"
      if (!activeRoom) {
        const msg = "Please create or join a room first to access this page.";
        speakText(msg);
        return {
          handled: true,
          success: false,
          feedback: "🚪 Kripya pehle room banayein! (Please create a room first)"
        };
      }

      // 3. User logged in AND room created: "agr login bhi h room bhi created h to redirect kr do!!"
      if (parsed.action === 'NAVIGATE') {
        setPage(parsed.page);
        const pageNames = { chat: 'Messenger Chat', cinema: '4K Cinema Player', home: 'Home Hub', ai: 'ViAM AI Companion', profile: 'User Profile', rooms: 'Rooms Management' };
        const msg = `Opening ${pageNames[parsed.page] || parsed.page}`;
        speakText(msg);
        return { handled: true, success: true, feedback: `🚀 ${msg}` };
      }

      if (parsed.action === 'SEARCH_AND_PLAY') {
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

        return { handled: true, success: true, feedback: `🎬 Playing ${parsed.query}...` };
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

        // MANDATORY ACCOUNT CHECK: If guest has no account, DO NOT auto-join! Stay on connect page so AuthModal opens.
        if (!savedAccount) {
          console.log('🔒 [Lounge Entry Restricted] Guest must create an account to join room:', urlRoom);
          return;
        }

        const savedName = savedAccount?.name || 'User';
        const savedPasscode = sessionStorage.getItem(`cypr_passcode_${urlRoom}`) || '';

        const userObj = { name: savedName, socketId: newSocket.id, avatar: savedAccount?.avatar, email: savedAccount?.email };
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
      setPasscodeModal({ isOpen: false, roomId: '', error: '' });

      // Only navigate if user has an active room session (prevents bounce-back when user clicked Leave)
      const activeRoom = sessionStorage.getItem('cypr_active_room');
      if (!activeRoom) return;

      const savedPage = sessionStorage.getItem('cypr_active_page');
      setPage((prevPage) => (prevPage === 'connect' ? (savedPage && savedPage !== 'connect' ? savedPage : 'home') : prevPage));
    });

    newSocket.on('room-joined', ({ roomId, isHost }) => {
      setKnockPending(false);
      setPasscodeModal({ isOpen: false, roomId: '', error: '' });
      const savedPage = sessionStorage.getItem('cypr_active_page');
      setPage((prevPage) => (prevPage === 'connect' ? (savedPage && savedPage !== 'connect' ? savedPage : 'home') : prevPage));
    });

    newSocket.on('initial-media-state', (state) => { if (state) setMediaState(state); });
    newSocket.on('media-changed', (state) => setMediaState(state));

    // Security Knock & Approval Handlers
    newSocket.on('knock-pending', () => {
      setKnockPending(true);
      setPasscodeModal({ isOpen: false, roomId: '', error: '' });
    });

    newSocket.on('knock-approved', () => {
      setKnockPending(false);
      setPasscodeModal({ isOpen: false, roomId: '', error: '' });
      const savedPage = sessionStorage.getItem('cypr_active_page');
      setPage((prevPage) => (prevPage === 'connect' ? (savedPage && savedPage !== 'connect' ? savedPage : 'home') : prevPage));
    });

    newSocket.on('knock-rejected', ({ message }) => {
      setKnockPending(false);
      setPasscodeModal({ isOpen: false, roomId: '', error: '' });
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
        const params = new URLSearchParams(window.location.search);
        const targetRoom = (params.get('room') || params.get('join') || sessionStorage.getItem('cypr_active_room') || roomId || '').trim().toLowerCase();
        setPasscodeModal((prev) => ({
          isOpen: true,
          roomId: targetRoom,
          error: prev.isOpen ? '⚠️ Incorrect passcode. Please check with the room host.' : ''
        }));
        return;
      }
      sessionStorage.removeItem('cypr_active_room');
      alert(`⚠️ ${message}`);
      setPage('connect');
      setRoomId('');
      window.history.pushState({}, '', window.location.pathname);
    });

    // Global Incoming Call Signaling (Active across Cinema, Home, Profile, AI, and Chat)
    newSocket.on('call-invite', ({ from, fromName, isVideo }) => {
      console.log('📞 [Global Call Received]', { from, fromName, isVideo });
      setIncomingCall({ from, fromName, isVideo });
    });

    newSocket.on('call-ended', () => {
      setIncomingCall(null);
    });

    newSocket.on('call-declined', () => {
      setIncomingCall(null);
    });

    // Forced kick from Host
    newSocket.on('kicked-from-room', ({ roomId, message }) => {
      sessionStorage.removeItem('cypr_active_room');
      sessionStorage.removeItem('cypr_active_page');
      if (roomId) sessionStorage.removeItem(`cypr_passcode_${roomId}`);
      alert(`⛔ ${message || 'You have been kicked from the lounge by the Host.'}`);
      setPage('connect');
      setRoomId('');
      setCurrentUser(null);
      setRoomUsers([]);
      window.history.pushState({}, '', window.location.pathname);
    });

    return () => newSocket.disconnect();
  }, []);

  const handleConnect = ({ name, roomId: joinedRoomId, passcode, maxCapacity, isPublic, isCreateMode }) => {
    const cleanId = (joinedRoomId || 'cypr-lounge').toLowerCase().trim();
    const savedAccountStr = localStorage.getItem('cypr_user_account');
    let savedAccount = null;
    try { savedAccount = savedAccountStr ? JSON.parse(savedAccountStr) : null; } catch {}
    const finalName = name || savedAccount?.name || localStorage.getItem('cypr_user_name') || 'Host';
    const userObj = { name: finalName, socketId: socket?.id, avatar: savedAccount?.avatar, email: savedAccount?.email };
    setCurrentUser(userObj);
    setRoomId(cleanId);
    
    // Remember room & passcode in session storage so page refresh retains access
    sessionStorage.setItem('cypr_active_room', cleanId);
    sessionStorage.setItem('cypr_active_page', 'home');
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
    setIncomingCall(null);
    setPasscodeModal({ isOpen: false, roomId: '', error: '' });
    const leavingRoom = roomId || sessionStorage.getItem('cypr_active_room');
    sessionStorage.removeItem('cypr_active_room');
    sessionStorage.removeItem('cypr_active_page');
    if (leavingRoom) {
      sessionStorage.removeItem(`cypr_passcode_${leavingRoom}`);
    }
    setPage('connect');
    setCurrentUser(null);
    setRoomUsers([]);
    setRoomId('');
    if (socket && leavingRoom) {
      socket.emit('leave-room', { roomId: leavingRoom });
    }
    window.history.pushState({}, '', window.location.pathname);
  };

  const handlePasscodeSubmit = (enteredPasscode) => {
    const targetRoom = (passcodeModal.roomId || roomId || '').toLowerCase().trim();
    if (!enteredPasscode || !targetRoom) return;

    sessionStorage.setItem(`cypr_passcode_${targetRoom}`, enteredPasscode);
    const savedAccountStr = localStorage.getItem('cypr_user_account');
    let savedAccount = null;
    try { savedAccount = savedAccountStr ? JSON.parse(savedAccountStr) : null; } catch {}
    const savedName = savedAccount?.name || localStorage.getItem('cypr_user_name') || 'Guest User';
    const userObj = { name: savedName, socketId: socket?.id, avatar: savedAccount?.avatar, email: savedAccount?.email };
    setCurrentUser(userObj);
    setRoomId(targetRoom);

    if (socket) {
      socket.emit('join-room', {
        roomId: targetRoom,
        user: userObj,
        passcode: enteredPasscode,
        maxCapacity: 2,
        isPublic: false,
        isCreateMode: false
      });
    }
  };

  const handlePasscodeCancel = () => {
    setPasscodeModal({ isOpen: false, roomId: '', error: '' });
    handleLeave();
  };

  const handleOpenCall = (isVideo = true) => {
    setCallIsVideo(isVideo);
    setIsCallActive(true);
    setIsCallMinimized(false);
    setPage('call');
  };

  const handleAcceptIncomingCall = (callData) => {
    const isVideo = callData?.isVideo !== false;
    setCallIsVideo(isVideo);
    setIncomingCall(null);
    if (socket) {
      socket.emit('call-accepted', { to: callData?.from || roomId });
    }
    handleOpenCall(isVideo);
  };

  const handleDeclineIncomingCall = (callData) => {
    if (socket) {
      socket.emit('call-declined', { to: callData?.from || roomId });
    }
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    if (socket) socket.emit('call-ended', { to: roomId });
    webrtc.stopLocalMedia();
    setIsCallActive(false);
    setIsCallMinimized(false);
    setIncomingCall(null);
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
          onOpenRooms={() => setPage('rooms')}
          onOpenCall={handleOpenCall}
          onOpenProfile={() => setPage('profile')}
          onLeave={handleLeave}
        />
      )}

      {page === 'rooms' && (
        <RoomsPage
          {...sharedProps}
          onBack={() => setPage(roomId ? 'home' : 'connect')}
          onRejoinRoom={(code) => handleConnect({ name: currentUser?.name || 'User', roomId: code })}
          onOpenCreateRoom={() => {
            handleLeave();
            setPage('connect');
          }}
          onOpenProfile={() => setPage('profile')}
          onLogout={handleLeave}
        />
      )}

      {page === 'profile' && (
        <ProfilePage
          userAccount={currentUser}
          onBack={() => setPage(currentUser ? 'home' : 'connect')}
          onLogout={handleLeave}
          onOpenRooms={() => setPage('rooms')}
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
          onOpenRooms={() => setPage('rooms')}
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
          onOpenRooms={() => setPage('rooms')}
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
          onOpenRooms={() => setPage('rooms')}
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

      {/* GLOBAL INCOMING CALL MODAL WITH SYNTHESIZED RINGTONE (Active across ALL pages: Cinema, Home, Profile, AI, Chat) */}
      <GlobalIncomingCallModal
        incomingCall={incomingCall}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
      />

      {/* PRIVATE ROOM PASSCODE / PIN POPUP MODAL */}
      <RoomPasscodeModal
        isOpen={passcodeModal.isOpen}
        roomId={passcodeModal.roomId}
        errorMessage={passcodeModal.error}
        onSubmit={handlePasscodeSubmit}
        onCancel={handlePasscodeCancel}
        theme={theme}
      />
    </>
  );
}
