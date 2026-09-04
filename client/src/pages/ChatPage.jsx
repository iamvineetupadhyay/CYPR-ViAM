import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heart, Film, Copy, Check, Moon, Sun,
  Phone, PhoneOff, Video, VideoOff,
  Mic, MicOff, X, Search, Users, Lock,
  ShieldCheck, Sparkles, Send, MessageSquare, Crown, User, Hash, Bot, Lightbulb, HelpCircle, Dices, Zap,
  Filter, LogOut, UserPlus, Home
} from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import ProfileModal from '../components/ProfileModal';
import HeaderProfileMenu from '../components/HeaderProfileMenu';
import { useWebRTC } from '../hooks/useWebRTC';
import { encryptPayload, decryptPayload } from '../utils/cryptoUtils';

/* ─────────────────────────────────────────
   QUICK AI PROMPTS
───────────────────────────────────────── */
const quickAiPrompts = [
  { label: 'Recommend a Movie', prompt: 'Recommend a movie for date night', icon: Film },
  { label: 'Explain Movie Ending', prompt: 'Explain the ending of Interstellar', icon: HelpCircle },
  { label: 'Movie Trivia', prompt: 'Give me fun trivia about Inception', icon: Sparkles },
  { label: 'Cinema Quiz Game', prompt: "Let's play a movie guessing quiz game", icon: Dices }
];

/* ─────────────────────────────────────────
   INCOMING CALL BANNER
───────────────────────────────────────── */
function IncomingCallBanner({ partnerName, onAccept, onDecline, isVideoCall }) {
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, background: '#141417',
      border: '1px solid #27272a',
      borderRadius: '16px', padding: '14px 20px',
      boxShadow: '0 20px 40px rgba(0,0,0,0.9)',
      display: 'flex', alignItems: 'center', gap: '16px',
      minWidth: 320
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        background: '#09090b', border: '1px solid #27272a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '18px', fontWeight: '700', color: '#fff',
        flexShrink: 0
      }}>
        {(partnerName || '?')[0].toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{partnerName || 'Partner'}</div>
        <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '2px' }}>
          Incoming {isVideoCall ? 'Video' : 'Voice'} call...
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onDecline} style={{
          width: 38, height: 38, borderRadius: '50%',
          background: '#ef4444', border: 'none', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }} title="Decline">
          <PhoneOff size={16} />
        </button>
        <button onClick={onAccept} style={{
          width: 38, height: 38, borderRadius: '50%',
          background: '#22c55e', border: 'none', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }} title="Accept">
          {isVideoCall ? <Video size={16} /> : <Phone size={16} />}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN CHAT PAGE WITH GROQ AI COMPANION
───────────────────────────────────────── */
export default function ChatPage({
  currentUser, roomId, socket, roomUsers = [],
  mediaState, onMediaChange, onOpenHome, onOpenCinema, onOpenProfile, onOpenCall, onLeave
}) {
  const [messages, setMessages] = useState([]);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('cypr_theme') || 'dark');
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Active Chat State: 'group' (Main Lounge) OR 'direct' (1-on-1 with member / AI)
  const [activeChat, setActiveChat] = useState({
    type: 'group',
    id: 'group',
    name: 'Main Lounge'
  });

  // Typing & Unread Indicators
  const [groupTyping, setGroupTyping] = useState(null);
  const [directTyping, setDirectTyping] = useState({}); // { [senderSocketId]: string (senderName) }
  const [unreadCounts, setUnreadCounts] = useState({}); // { [chatKey]: number }

  // Call state
  const callTypeRef = useRef('video');
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);

  const {
    localStream, remoteStream,
    isMicMuted, isCamOff, isCallConnected,
    peerName, startLocalCall, createOfferAndSend, stopLocalMedia, toggleMic, toggleCam
  } = useWebRTC(socket, roomId, currentUser);

  // When WebRTC connects, ensure activeCall remains active
  useEffect(() => {
    if (isCallConnected && !activeCall) {
      setActiveCall({ isVideo: callTypeRef.current === 'video' });
    }
  }, [isCallConnected, activeCall]);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cypr_theme', theme);
  }, [theme]);

  // Other members in room (excluding current client)
  const otherMembers = roomUsers.filter(u => u.socketId !== socket?.id && u.name !== currentUser?.name);

  // Clear unread badge when activeChat changes
  useEffect(() => {
    if (activeChat.type === 'group') {
      setUnreadCounts(prev => ({ ...prev, group: 0 }));
    } else if (activeChat.type === 'direct' && activeChat.id) {
      setUnreadCounts(prev => ({ ...prev, [activeChat.id]: 0 }));
    }
  }, [activeChat]);

  // Socket listeners for Messages, Reactions, Typing, and Calls
  useEffect(() => {
    if (!socket) return;

    socket.on('initial-chat-history', async (history) => {
      if (Array.isArray(history) && history.length > 0) {
        const decryptedList = await Promise.all(
          history.map(async (msg) => {
            if (msg.isAI) return msg;
            const dec = await decryptPayload(msg, roomId);
            return dec || msg;
          })
        );
        setMessages(decryptedList);
      }
    });

    socket.on('chat-message-received', async (data) => {
      const decrypted = data.isAI ? data : await decryptPayload(data, roomId);
      if (decrypted) {
        let targetChatKey = 'group';
        if (decrypted.recipientSocketId && decrypted.recipientSocketId !== 'group') {
          if (decrypted.senderId === socket.id) {
            targetChatKey = `dm_${decrypted.recipientSocketId}`;
          } else {
            targetChatKey = `dm_${decrypted.senderId}`;
          }
        }

        const enrichedMsg = {
          ...decrypted,
          chatId: decrypted.chatId || targetChatKey
        };

        setMessages(prev => {
          const isDuplicate = prev.some(m =>
            (m.id && enrichedMsg.id && m.id === enrichedMsg.id) ||
            (m.timestamp === enrichedMsg.timestamp && m.senderName === enrichedMsg.senderName && m.text === enrichedMsg.text)
          );
          if (isDuplicate) return prev;
          return [...prev, enrichedMsg];
        });

        // Update Unread Count if message is not in current active chat
        if (enrichedMsg.senderId !== socket.id) {
          if (enrichedMsg.recipientSocketId && enrichedMsg.recipientSocketId !== 'group') {
            const senderSocketId = enrichedMsg.senderId;
            setActiveChat(current => {
              if (current.type !== 'direct' || current.id !== senderSocketId) {
                setUnreadCounts(u => ({ ...u, [senderSocketId]: (u[senderSocketId] || 0) + 1 }));
              }
              return current;
            });
          } else {
            setActiveChat(current => {
              if (current.type !== 'group') {
                setUnreadCounts(u => ({ ...u, group: (u.group || 0) + 1 }));
              }
              return current;
            });
          }
        }
      }
    });

    socket.on('reaction-received', async (data) => {
      const decrypted = await decryptPayload(data, roomId);
      const emoji = decrypted?.emoji || data?.emoji;
      if (emoji) triggerFloatingEmoji(emoji);
    });

    // Typing Indicators
    socket.on('partner-typing', ({ senderName, senderSocketId, isDirect }) => {
      if (isDirect && senderSocketId) {
        setDirectTyping(prev => ({ ...prev, [senderSocketId]: senderName }));
      } else {
        setGroupTyping(senderName);
      }
    });

    socket.on('partner-typing-stop', ({ senderSocketId }) => {
      if (senderSocketId) {
        setDirectTyping(prev => {
          const copy = { ...prev };
          delete copy[senderSocketId];
          return copy;
        });
      } else {
        setGroupTyping(null);
      }
    });

    socket.on('call-invite', ({ from, fromName, isVideo }) => {
      callTypeRef.current = isVideo ? 'video' : 'voice';
      setIncomingCall({ from, fromName, isVideo });
    });

    socket.on('call-accepted', ({ fromSocketId }) => {
      setIncomingCall(null);
      const isVid = callTypeRef.current === 'video';
      setActiveCall({ isVideo: isVid });
      if (fromSocketId && createOfferAndSend) {
        createOfferAndSend(fromSocketId);
      }
    });

    socket.on('call-declined', () => {
      setIncomingCall(null);
      stopLocalMedia();
      setActiveCall(null);
    });

    socket.on('call-ended', () => {
      stopLocalMedia();
      setActiveCall(null);
      setIncomingCall(null);
    });

    socket.on('user-left', ({ userName }) => {
      if (activeCall) {
        stopLocalMedia();
        setActiveCall(null);
      }
      if (userName) {
        setMessages(prev => [...prev, {
          type: 'text', text: `👋 ${userName} left the lounge.`,
          senderName: 'System', timestamp: Date.now(), isSystem: true, chatId: 'group'
        }]);
      }
    });

    socket.on('media-changed', (newMedia) => {
      if (newMedia) {
        onMediaChange?.(newMedia);
      }
    });

    return () => {
      socket.off('initial-chat-history');
      socket.off('chat-message-received');
      socket.off('reaction-received');
      socket.off('partner-typing');
      socket.off('partner-typing-stop');
      socket.off('call-invite');
      socket.off('call-accepted');
      socket.off('call-declined');
      socket.off('call-ended');
      socket.off('user-left');
      socket.off('media-changed');
    };
  }, [socket, roomId, stopLocalMedia, createOfferAndSend, activeCall]);

  const triggerFloatingEmoji = useCallback((emoji) => {
    const id = Date.now() + Math.random();
    const left = 20 + Math.random() * 60;
    setFloatingEmojis(prev => [...prev, { id, emoji, left }]);
    setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 3000);
  }, []);

  // Send Message (Handles both Group Lounge & 1-on-1 Direct Message / AI Bot)
  const handleSendMessage = async (msgData) => {
    const msgId = Date.now().toString() + '-' + Math.random().toString(36).substr(2, 6);
    const isDirect = activeChat.type === 'direct';
    const targetChatId = isDirect ? `dm_${activeChat.id}` : 'group';

    const payload = {
      ...msgData,
      id: msgData.id || msgId,
      senderName: currentUser?.name || 'You',
      senderId: socket?.id,
      timestamp: Date.now(),
      chatId: targetChatId,
      recipientSocketId: isDirect ? activeChat.id : 'group',
      recipientName: isDirect ? activeChat.name : 'Main Lounge',
      target: isDirect ? 'direct' : 'group'
    };

    // Optimistic local append
    setMessages(prev => [...prev, payload]);

    socket?.emit('chat-message', payload);

    // If in 1-on-1 AI Bot mode, show typing indicator locally
    if (activeChat.id === 'viam-ai-bot') {
      setDirectTyping(prev => ({ ...prev, 'viam-ai-bot': 'ViAM AI 🤖' }));
    }
  };

  const handleSendReaction = async (emoji) => {
    triggerFloatingEmoji(emoji);
    const encrypted = await encryptPayload({ emoji, senderName: currentUser?.name }, roomId);
    socket?.emit('send-reaction', encrypted);
  };

  const startCall = async (isVideo) => {
    if (activeChat.id === 'viam-ai-bot') {
      alert("🤖 ViAM AI Voice Mode: Type in chat or use the Voice Assistant mic below!");
      return;
    }
    const targetTo = activeChat.type === 'direct' ? activeChat.id : roomId;
    socket?.emit('call-invite', { isVideo, to: targetTo });
    if (onOpenCall) {
      onOpenCall(isVideo);
    } else {
      callTypeRef.current = isVideo ? 'video' : 'voice';
      await startLocalCall(isVideo);
      setActiveCall({ isVideo });
    }
  };

  const endCall = () => {
    socket?.emit('call-ended', { to: roomId });
    stopLocalMedia();
    setActiveCall(null);
  };

  const acceptIncoming = async () => {
    const isVid = incomingCall?.isVideo ?? true;
    socket?.emit('call-accepted', { to: roomId, fromSocketId: incomingCall?.from });
    setIncomingCall(null);
    if (onOpenCall) {
      onOpenCall(isVid);
    } else {
      callTypeRef.current = isVid ? 'video' : 'voice';
      setActiveCall({ isVideo: isVid });
      await startLocalCall(isVid);
    }
  };

  const declineIncoming = () => {
    socket?.emit('call-declined', { to: roomId });
    setIncomingCall(null);
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?room=${encodeURIComponent(roomId)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter messages for current active thread
  const threadMessages = messages.filter(m => {
    if (activeChat.type === 'group') {
      return m.chatId === 'group' || (!m.chatId && !m.recipientSocketId) || m.target === 'group';
    } else if (activeChat.type === 'direct') {
      const targetDm = `dm_${activeChat.id}`;
      return m.chatId === targetDm;
    }
    return true;
  });

  // Filter with Search query if user types in search bar
  const displayedMessages = searchQuery.trim()
    ? threadMessages.filter(m => m.type === 'text' && (m.text || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : threadMessages;

  // Active Typing indicator for current view
  const currentTypingStatus = activeChat.type === 'group'
    ? groupTyping
    : (directTyping[activeChat.id] || null);

  // Filtered members for sidebar search
  const filteredMembers = otherMembers.filter(u =>
    (u.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#090a0f', fontFamily: "Plus Jakarta Sans, Inter, sans-serif" }}>

      {/* Floating emojis */}
      {floatingEmojis.map(item => (
        <div key={item.id} className="floating-emoji"
          style={{ left: `${item.left}%`, bottom: '30%', zIndex: 999 }}>
          {item.emoji}
        </div>
      ))}

      {/* Incoming call notification */}
      {incomingCall && (
        <IncomingCallBanner
          partnerName={incomingCall.fromName || 'Room Member'}
          isVideoCall={incomingCall.isVideo}
          onAccept={acceptIncoming}
          onDecline={declineIncoming}
        />
      )}

      {/* ═══════ LEFT PANEL: WHATSAPP-STYLE CHATS SIDEBAR ═══════ */}
      <aside style={{
        width: 360, flexShrink: 0,
        background: '#111218',
        borderRight: '1px solid rgba(255, 255, 255, 0.07)',
        display: 'flex', flexDirection: 'column',
        zIndex: 1, position: 'relative'
      }}>
        {/* WhatsApp Top Header Bar with Clean Prominent CYPR ViAM Branding */}
        <div style={{
          height: 68, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px',
          background: '#161722', borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {/* Standalone Large Brand Logo */}
          <div
            onClick={onOpenHome}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            title="Return to Home Hub"
          >
            <img
              src="/viam_logo.png"
              alt="CYPR ViAM"
              style={{
                height: '58px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 14px rgba(255,85,0,0.5))',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>

          {/* Room Code Link Pill */}
          <div
            onClick={copyInvite}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.09)',
              borderRadius: '16px', padding: '4px 10px', cursor: 'pointer',
              fontSize: '11.5px', color: '#ff7733', fontWeight: 700, fontFamily: 'monospace',
              transition: 'all 0.15s ease'
            }}
            title="Click to copy invite link"
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#ff5500'; e.currentTarget.style.background = 'rgba(255, 85, 0, 0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.09)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
            <span>{roomId}</span>
            {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} color="#71717a" />}
          </div>
        </div>

        {/* WhatsApp Search & Filter Bar */}
        <div style={{ padding: '8px 12px', background: '#111218', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              flex: 1, background: '#1c1d27',
              borderRadius: '8px', padding: '6px 12px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <Search size={15} color="#8696a0" />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  color: '#e9edef', fontSize: '13px', outline: 'none'
                }}
              />
              {searchQuery && (
                <X size={14} color="#8696a0" style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              )}
            </div>
            <button
              style={{
                background: 'transparent', border: 'none', color: '#8696a0',
                padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              title="Filter Chats"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* WhatsApp Chat List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* 1. MAIN LOUNGE (GROUP CHAT) */}
          <div
            onClick={() => setActiveChat({ type: 'group', id: 'group', name: 'Main Lounge' })}
            style={{
              padding: '12px 16px',
              background: activeChat.type === 'group' ? 'rgba(255, 85, 0, 0.08)' : 'transparent',
              borderLeft: activeChat.type === 'group' ? '3px solid #ff5500' : '3px solid transparent',
              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
              display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => { if (activeChat.type !== 'group') e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            onMouseLeave={e => { if (activeChat.type !== 'group') e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Group Avatar */}
            <div style={{
              width: 46, height: 46, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff5500, #b83200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(255,85,0,0.25)'
            }}>
              <Film size={22} />
            </div>

            {/* Chat Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '600', color: activeChat.type === 'group' ? '#ff5500' : '#e9edef' }}>
                  Main Lounge
                </span>
                <span style={{ fontSize: '11px', color: unreadCounts['group'] > 0 ? '#ff5500' : '#8696a0', fontWeight: '500' }}>
                  Now
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12.5px', color: '#8696a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {groupTyping ? (
                    <span style={{ color: '#ff5500', fontWeight: '600' }}>{groupTyping} is typing...</span>
                  ) : (
                    <>
                      <Users size={12} color="#8696a0" />
                      <span>{roomUsers.length} members co-watching</span>
                    </>
                  )}
                </div>
                {unreadCounts['group'] > 0 && (
                  <span style={{
                    background: '#ff5500', color: '#fff', fontSize: '10.5px', fontWeight: '700',
                    padding: '1px 6px', borderRadius: '10px', minWidth: '16px', textAlign: 'center'
                  }}>
                    {unreadCounts['group']}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Section Divider: DIRECT MESSAGES */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px 6px', fontSize: '11px', fontWeight: '700',
            textTransform: 'uppercase', color: '#8696a0', letterSpacing: '0.6px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={11} color="#8696a0" /> Direct Messages
            </span>
            <span style={{ background: 'rgba(255,255,255,0.06)', color: '#8696a0', padding: '1px 6px', borderRadius: '8px', fontSize: '10px' }}>
              {otherMembers.length}
            </span>
          </div>

          {/* 3. DYNAMIC MEMBER LIST FOR 1-ON-1 DIRECT MESSAGES */}
          {otherMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const isSelected = activeChat.type === 'direct' && activeChat.id === member.socketId;
              const isTyping = directTyping[member.socketId];
              const unread = unreadCounts[member.socketId] || 0;

              return (
                <div
                  key={member.socketId}
                  onClick={() => setActiveChat({
                    type: 'direct',
                    id: member.socketId,
                    name: member.name,
                    user: member
                  })}
                  style={{
                    padding: '12px 16px',
                    background: isSelected ? 'rgba(255, 85, 0, 0.08)' : 'transparent',
                    borderLeft: isSelected ? '3px solid #ff5500' : '3px solid transparent',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                    display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Member Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={member.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                      alt={member.name}
                      style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 10, height: 10, borderRadius: '50%',
                      background: isTyping ? '#ff5500' : '#22c55e',
                      border: '2px solid #111218'
                    }} />
                  </div>

                  {/* Name + Status */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: '600', color: isSelected ? '#ff5500' : '#e9edef', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {member.name}
                        </span>
                        {member.isHost && (
                          <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '1px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Crown size={9} /> Host
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: unread > 0 ? '#ff5500' : '#8696a0', fontWeight: '500' }}>
                        online
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '12.5px', color: isTyping ? '#ff5500' : '#8696a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isTyping ? (
                          `${member.name} is typing...`
                        ) : (
                          <>
                            <ShieldCheck size={12} color="#22c55e" />
                            <span>Private 1-on-1 Encrypted</span>
                          </>
                        )}
                      </div>
                      {unread > 0 && (
                        <span style={{
                          background: '#ff5500', color: '#fff', fontSize: '10.5px', fontWeight: '700',
                          padding: '1px 6px', borderRadius: '10px'
                        }}>
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{
              padding: '24px 16px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
            }}>
              <div style={{ fontSize: '12.5px', color: '#8696a0' }}>
                No other members in lounge yet.
              </div>
              <button
                onClick={copyInvite}
                style={{
                  padding: '8px 16px', borderRadius: '8px',
                  background: 'rgba(255,85,0,0.15)', border: '1px solid rgba(255,85,0,0.3)',
                  color: '#ff5500', fontSize: '12px', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#ff5500'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,85,0,0.15)'; e.currentTarget.style.color = '#ff5500'; }}
              >
                <UserPlus size={14} />
                <span>Invite Partner / Friend</span>
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp Sidebar Footer */}
        <div style={{
          padding: '10px 16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          background: '#161722', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#8696a0' }}>
            <Lock size={12} color="#22c55e" />
            <span>End-to-end encrypted session</span>
          </div>
          <button
            onClick={onLeave}
            style={{
              background: 'transparent', border: 'none', color: '#ef4444',
              fontSize: '11.5px', fontWeight: '700', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
            title="Leave Lounge"
          >
            <LogOut size={12} /> Leave
          </button>
        </div>
      </aside>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userAccount={currentUser}
        onLogout={onLeave}
      />

      {/* ═══════ RIGHT: CHAT THREAD & WHATSAPP DYNAMIC HEADER ═══════ */}
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, position: 'relative', zIndex: 1,
        background: '#0c0d14'
      }}>

        {/* WHATSAPP TOP HEADER BAR */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 20px',
          background: '#161722', borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0
        }}>
          {/* Header Left: Current Thread Info with WhatsApp Avatar & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeChat.type === 'group' ? (
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff5500, #b83200)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(255,85,0,0.3)'
              }}>
                <Film size={20} />
              </div>
            ) : activeChat.id === 'viam-ai-bot' ? (
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #a855f7, #6b21a8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', flexShrink: 0, boxShadow: '0 2px 8px rgba(168,85,247,0.3)'
              }}>
                <Bot size={20} />
              </div>
            ) : (
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={activeChat.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                  alt={activeChat.name}
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.15)' }}
                />
                <span style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#22c55e', border: '2px solid #161722'
                }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>
                  {activeChat.name}
                </span>
                {activeChat.id === 'viam-ai-bot' ? (
                  <span style={{
                    fontSize: '9.5px', fontWeight: '800', background: 'rgba(168,85,247,0.2)',
                    color: '#c084fc', padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase'
                  }}>
                    Groq 70B
                  </span>
                ) : activeChat.type === 'direct' ? (
                  <span style={{
                    fontSize: '9.5px', fontWeight: '700', background: 'rgba(34,197,94,0.15)',
                    color: '#22c55e', padding: '1px 6px', borderRadius: '4px'
                  }}>
                    1-on-1
                  </span>
                ) : null}
              </div>

              <div style={{ fontSize: '11.5px', color: activeChat.id === 'viam-ai-bot' ? '#c084fc' : '#8696a0', fontWeight: '500' }}>
                {currentTypingStatus ? `${currentTypingStatus} is typing...` : (
                  activeChat.id === 'viam-ai-bot'
                    ? 'AI Cinema Co-Host • Instant Intelligence'
                    : activeChat.type === 'group'
                    ? `${roomUsers.length} members online • Realtime video sync`
                    : 'Online • End-to-End Encrypted'
                )}
              </div>
            </div>
          </div>

          {/* Header Right: WhatsApp Action Icons Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Voice Call */}
            <button
              onClick={() => startCall(false)}
              disabled={!!activeCall}
              title={activeChat.type === 'direct' ? `Voice Call with ${activeChat.name}` : "Room Voice Call"}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: !activeCall ? 'pointer' : 'not-allowed', color: !activeCall ? '#aebac1' : '#54656f',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (!activeCall) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!activeCall) e.currentTarget.style.background = 'transparent'; }}
            >
              <Phone size={18} />
            </button>

            {/* Video Call */}
            <button
              onClick={() => startCall(true)}
              disabled={!!activeCall}
              title={activeChat.type === 'direct' ? `Video Call with ${activeChat.name}` : "Room Video Call"}
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'transparent', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: !activeCall ? 'pointer' : 'not-allowed', color: !activeCall ? '#aebac1' : '#54656f',
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { if (!activeCall) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { if (!activeCall) e.currentTarget.style.background = 'transparent'; }}
            >
              <Video size={18} />
            </button>

            {/* Watch Together / Cinema Mode */}
            <button
              onClick={onOpenCinema}
              title="Watch Movies Together (Cinema Lounge)"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,85,0,0.15)', border: 'none',
                color: '#ff5500',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,85,0,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,85,0,0.15)'}
            >
              <Film size={18} />
            </button>

            {/* Home Hub Switcher */}
            <button
              onClick={onOpenHome}
              title="Return to Lounge Home Hub"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'transparent', border: 'none',
                color: '#aebac1',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aebac1'; }}
            >
              <Home size={18} />
            </button>

            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

            {/* Profile Avatar Menu */}
            <HeaderProfileMenu
              userAccount={currentUser}
              onOpenProfile={onOpenProfile}
              onOpenHistory={onOpenProfile}
              onLogout={onLeave}
            />
          </div>
        </div>

        {/* Quick AI Action Chips Bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px',
          background: 'rgba(17, 18, 24, 0.75)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
          overflowX: 'auto', whiteSpace: 'nowrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '800', color: '#c084fc', textTransform: 'uppercase' }}>
            <Sparkles size={12} />
            <span>AI Prompts:</span>
          </div>
          {quickAiPrompts.map((p, idx) => {
            const IconComp = p.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage({ type: 'text', text: p.prompt })}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '16px', padding: '4px 10px',
                  color: '#e4e4e7', fontSize: '11.5px', fontWeight: '600',
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#c084fc'; e.currentTarget.style.background = 'rgba(168, 85, 247, 0.12)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'; e.currentTarget.style.color = '#e4e4e7'; }}
              >
                {IconComp && <IconComp size={12} color="#c084fc" />}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages Stream for Current Selected Thread */}
        <ChatWindow
          messages={displayedMessages}
          setMessages={setMessages}
          currentUser={currentUser}
          onSendReaction={handleSendReaction}
          partnerTyping={!searchQuery ? currentTypingStatus : null}
          socket={socket}
        />

        {/* WhatsApp-Style Chat Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          socket={socket}
          partnerName={activeChat.name}
          currentUser={currentUser}
          activeChat={activeChat}
        />
      </main>
    </div>
  );
}
