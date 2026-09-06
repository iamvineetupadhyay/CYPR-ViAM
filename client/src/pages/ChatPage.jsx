import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heart, Film, Copy, Check, Moon, Sun, ArrowLeft,
  Phone, PhoneOff, Video, VideoOff,
  Mic, MicOff, X, Search, Users, Lock,
  ShieldCheck, Sparkles, Send, MessageSquare, Crown, User, Hash, Bot, Lightbulb, HelpCircle, Dices, Zap,
  Filter, LogOut, UserPlus, Home
} from 'lucide-react';
import ChatWindow from '../components/ChatWindow';
import ChatInput from '../components/ChatInput';
import ProfileModal from '../components/ProfileModal';
import HeaderProfileMenu from '../components/HeaderProfileMenu';
import VoiceAssistant from '../components/VoiceAssistant';
import { encryptPayload, decryptPayload } from '../utils/cryptoUtils';
import { getT } from '../utils/themeTokens';


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
   MAIN CHAT PAGE WITH GROQ AI COMPANION
───────────────────────────────────────── */
export default function ChatPage({
  currentUser, roomId, socket, roomUsers = [],
  mediaState, onMediaChange, onOpenHome, onOpenCinema, onOpenAI, onOpenRooms, onOpenProfile, onOpenCall, onLeave,
  onToggleTheme,
  onGlobalVoiceAction,
  theme = 'dark'
}) {
  const T = getT(theme);

  const [messages, setMessages] = useState([]);
  const [copied, setCopied] = useState(false);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

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

  // Theme is now driven by App.jsx prop — removed local theme state

  // Other members in room (excluding current client socket)
  const otherMembers = roomUsers.filter(u => u.socketId && u.socketId !== socket?.id);

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

    // Request full persistent chat history from server on mount
    socket.emit('get-chat-history', { roomId });

    socket.on('chat-message-received', async (data) => {
      const decrypted = data.isAI ? data : await decryptPayload(data, roomId);
      if (decrypted) {
        let targetChatKey = 'group';
        if (decrypted.recipientSocketId && decrypted.recipientSocketId !== 'group') {
          if (decrypted.senderId === socket?.id) {
            targetChatKey = `dm_${decrypted.recipientSocketId}`;
          } else {
            targetChatKey = `dm_${decrypted.senderId}`;
          }
        }

        const enrichedMsg = {
          ...decrypted,
          chatId: targetChatKey
        };

        setMessages(prev => {
          const isDuplicate = prev.some(m =>
            (m.id && enrichedMsg.id && m.id === enrichedMsg.id) ||
            (m.timestamp === enrichedMsg.timestamp && m.senderName === enrichedMsg.senderName && m.text === enrichedMsg.text)
          );
          if (isDuplicate) return prev;
          return [...prev, enrichedMsg];
        });

        // Update Unread Count & Emit WhatsApp Read Receipt
        if (enrichedMsg.senderId !== socket.id) {
          socket.emit('message-delivered', { messageId: enrichedMsg.id || enrichedMsg.timestamp, senderSocketId: enrichedMsg.senderId });
          socket.emit('message-seen', { messageId: enrichedMsg.id || enrichedMsg.timestamp, senderSocketId: enrichedMsg.senderId });

          if (enrichedMsg.recipientSocketId && enrichedMsg.recipientSocketId !== 'group') {
            const senderSocketId = enrichedMsg.senderId;
            setActiveChat(current => {
              if (current.type !== 'direct' || current.id !== senderSocketId) {
                setUnreadCounts(u => ({ ...u, [senderSocketId]: (u[senderSocketId] || 0) + 1 }));
              }
              return current;
            });
          } else {
            setGroupTyping(null);
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

    socket.on('reaction-received', async (data) => {
      const decrypted = await decryptPayload(data, roomId);
      const emoji = decrypted?.emoji || data?.emoji;
      if (emoji) triggerFloatingEmoji(emoji);
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

    // Typing Indicators
    socket.on('partner-typing', ({ senderName, senderSocketId, isDirect }) => {
      if (isDirect && senderSocketId) {
        setDirectTyping(prev => ({ ...prev, [senderSocketId]: senderName }));
      } else {
        setGroupTyping(senderName);
      }
    });

    socket.on('partner-typing-stop', ({ senderName, senderSocketId }) => {
      if (senderSocketId) {
        setDirectTyping(prev => {
          const copy = { ...prev };
          delete copy[senderSocketId];
          return copy;
        });
      }
      setGroupTyping(prev => (prev === senderName || !senderName ? null : prev));
    });

    socket.on('user-left', ({ userName }) => {
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
      socket.off('message-status-update');
      socket.off('message-deleted');
      socket.off('message-reacted');
      socket.off('reaction-received');
      socket.off('partner-typing');
      socket.off('partner-typing-stop');
      socket.off('user-left');
      socket.off('media-changed');
    };
  }, [socket, roomId]);

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

  const startCall = (isVideo) => {
    if (activeChat.id === 'viam-ai-bot') {
      alert("🤖 ViAM AI Voice Mode: Type in chat or use the Voice Assistant mic below!");
      return;
    }
    if (onOpenCall) {
      onOpenCall(isVideo);
    }
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
      const partnerSocketId = activeChat.id;
      return (
        (m.senderId === partnerSocketId && (m.recipientSocketId === socket?.id || m.recipientSocketId === 'direct')) ||
        (m.senderId === socket?.id && m.recipientSocketId === partnerSocketId) ||
        m.chatId === `dm_${partnerSocketId}` ||
        m.chatId === `dm_${socket?.id}`
      );
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
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: T.chatBg, color: T.textPrimary, fontFamily: "Plus Jakarta Sans, Inter, sans-serif", transition: 'background 0.4s ease, color 0.35s ease' }}>

      {/* Floating emojis */}
      {floatingEmojis.map(item => (
        <div key={item.id} className="floating-emoji"
          style={{ left: `${item.left}%`, bottom: '30%', zIndex: 999 }}>
          {item.emoji}
        </div>
      ))}

      {/* ═══════ LEFT PANEL: WHATSAPP-STYLE CHATS SIDEBAR ═══════ */}
      <aside
        className={`chat-page-sidebar ${showMobileChat ? 'mobile-hidden' : ''}`}
        style={{
          width: 360, flexShrink: 0,
          background: T.chatSidebarBg,
          borderRight: `1px solid ${T.border2}`,
          display: 'flex', flexDirection: 'column',
          zIndex: 1, position: 'relative',
          transition: 'background 0.4s ease, border-color 0.35s ease'
        }}
      >

        {/* WhatsApp Top Header Bar with Clean Prominent CYPR ViAM Branding & SVG Navigation Icons */}
        <div style={{
          height: 68, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 12px',
          background: T.chatSidebarBg,
          borderBottom: `1px solid ${T.border2}`,
          gap: '8px', transition: 'background 0.4s ease, border-color 0.35s ease'
        }}>

          {/* Brand Logo & Open ViAM AI */}
          <div
            onClick={onOpenHome}
            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexShrink: 0 }}
            title="Return to Home Hub"
          >
            <img
              src="/viam_logo.png"
              alt="CYPR ViAM"
              style={{
                height: '48px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 2px 14px rgba(255,85,0,0.5))'
              }}
            />
          </div>

          {/* SVG Navigation Icons Bar */}
          <div className="mobile-only-icons" style={{ alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* 1. Cinema Theater SVG Icon Button */}
            <button
              onClick={onOpenCinema}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255, 85, 0, 0.15)', border: '1px solid rgba(255, 85, 0, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ff7733', cursor: 'pointer', transition: 'all 0.15s ease'
              }}
              title="Open 4K Cinema Theater"
            >
              <Film size={18} color="#ff7733" />
            </button>

            {/* 2. ViAM AI Companion SVG Icon Button */}
            <button
              onClick={onOpenAI}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#c084fc', cursor: 'pointer', transition: 'all 0.15s ease'
              }}
              title="Open ViAM AI Companion"
            >
              <Sparkles size={18} color="#c084fc" />
            </button>

            {/* 3. Home Hub SVG Icon Button */}
            <button
              onClick={onOpenHome}
              style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#a1a1aa', cursor: 'pointer', transition: 'all 0.15s ease'
              }}
              title="Home Hub"
            >
              <Home size={18} color="#a1a1aa" />
            </button>

            {/* 4. Room Code Link Copy Pill */}
            <div
              onClick={copyInvite}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.04)',
                border: T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.09)',
                borderRadius: '18px', padding: '4px 10px', cursor: 'pointer',
                fontSize: '11px', color: T.isLight ? '#c2410c' : '#ff7733', fontWeight: 700, fontFamily: 'monospace'
              }}
              title="Click to copy invite link"
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
              <span>{roomId}</span>
              {copied ? <Check size={11} color="#22c55e" /> : <Copy size={11} color={T.isLight ? '#8c7d70' : '#71717a'} />}
            </div>
          </div>
        </div>

        {/* WhatsApp Search & Filter Bar */}
        <div style={{ padding: '8px 12px', background: T.chatSearchBg, borderBottom: `1px solid ${T.border1}`, transition: 'background 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              flex: 1, background: T.chatSearchInputBg,
              border: `1px solid ${T.borderInput}`,
              borderRadius: '8px', padding: '6px 12px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <Search size={15} color={T.chatSubtext} />
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', background: 'transparent', border: 'none',
                  color: T.textPrimary, fontSize: '13px', outline: 'none'
                }}
              />
              {searchQuery && (
                <X size={14} color={T.chatSubtext} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              )}
            </div>
            <button
              style={{
                background: 'transparent', border: 'none', color: T.chatSubtext,
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
            onClick={() => {
              setActiveChat({ type: 'group', id: 'group', name: 'Main Lounge' });
              setShowMobileChat(true);
            }}
            style={{
              padding: '12px 16px',
              background: activeChat.type === 'group' ? T.chatActiveItemBg : 'transparent',
              borderLeft: activeChat.type === 'group' ? (T.isLight ? '3px solid #ff5500' : '3px solid #e4e4e7') : '3px solid transparent',
              borderBottom: `1px solid ${T.chatCardBorder}`,
              display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
              transition: 'background 0.15s'
            }}
            onMouseEnter={e => { if (activeChat.type !== 'group') e.currentTarget.style.background = T.chatHoverItemBg; }}
            onMouseLeave={e => { if (activeChat.type !== 'group') e.currentTarget.style.background = 'transparent'; }}
          >
            {/* Group Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: T.isLight ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : 'linear-gradient(135deg, rgba(255,85,0,0.15), rgba(234,88,12,0.08))',
              border: T.isLight ? '1px solid rgba(255, 85, 0, 0.25)' : '1px solid rgba(255, 85, 0, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ff5500', flexShrink: 0,
              boxShadow: T.isLight ? '0 2px 8px rgba(255, 85, 0, 0.1)' : '0 2px 8px rgba(0,0,0,0.4)'
            }}>
              <Film size={20} />
            </div>

            {/* Chat Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '600', color: activeChat.type === 'group' ? (T.isLight ? '#ff5500' : '#ffffff') : T.textPrimary }}>
                  Main Lounge
                </span>
                <span style={{ fontSize: '11px', color: unreadCounts['group'] > 0 ? '#22c55e' : T.chatSubtext, fontWeight: '500' }}>
                  Now
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '12.5px', color: T.chatSubtext, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {groupTyping ? (
                    <span style={{ color: '#22c55e', fontWeight: '600' }}>{groupTyping} is typing...</span>
                  ) : (
                    <>
                      <Users size={12} color={T.chatSubtext} />
                      <span>{roomUsers.length} members co-watching</span>
                    </>
                  )}
                </div>
                {unreadCounts['group'] > 0 && (
                  <span style={{
                    background: '#22c55e', color: '#fff', fontSize: '10.5px', fontWeight: '700',
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
            textTransform: 'uppercase', color: T.chatSubtext, letterSpacing: '0.6px'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={11} color={T.chatSubtext} /> Direct Messages
            </span>
            <span style={{ background: T.chipBg, color: T.chatSubtext, padding: '1px 6px', borderRadius: '8px', fontSize: '10px' }}>
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
                  onClick={() => {
                    setActiveChat({
                      type: 'direct',
                      id: member.socketId,
                      name: member.name,
                      user: member
                    });
                    setShowMobileChat(true);
                  }}
                  style={{
                    padding: '12px 16px',
                    background: isSelected ? T.chatActiveItemBg : 'transparent',
                    borderLeft: isSelected ? (T.isLight ? '3px solid #ff5500' : '3px solid #e4e4e7') : '3px solid transparent',
                    borderBottom: `1px solid ${T.chatCardBorder}`,
                    display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = T.chatHoverItemBg; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Member Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={member.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"}
                      alt={member.name}
                      style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${T.border2}` }}
                    />
                    <span style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: 10, height: 10, borderRadius: '50%',
                      background: '#22c55e',
                      border: `2px solid ${T.isLight ? '#f0ebe0' : '#111218'}`
                    }} />
                  </div>

                  {/* Name + Status */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: '600', color: isSelected ? (T.isLight ? '#ff5500' : '#ffffff') : T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                          {member.name}
                        </span>
                        {member.isHost && (
                          <span style={{ fontSize: '9px', fontWeight: '800', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', padding: '1px 4px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            <Crown size={9} /> Host
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '11px', color: unread > 0 ? '#22c55e' : T.chatSubtext, fontWeight: '500' }}>
                        online
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '12.5px', color: isTyping ? '#22c55e' : T.chatSubtext, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
                          background: '#22c55e', color: '#fff', fontSize: '10.5px', fontWeight: '700',
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
              padding: '28px 16px', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
            }}>
              <div style={{ fontSize: '12px', color: T.isLight ? '#8c7d70' : '#8696a0' }}>
                No other members in lounge yet.
              </div>
              <button
                onClick={copyInvite}
                style={{
                  padding: '7px 14px', borderRadius: '10px',
                  background: T.isLight ? '#f5f2eb' : 'rgba(255,255,255,0.06)',
                  border: T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255,255,255,0.12)',
                  color: T.isLight ? '#443729' : '#e4e4e7',
                  fontSize: '11.5px', fontWeight: '700',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'all 0.15s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = T.isLight ? '#ede8de' : 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.color = '#ff5500';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = T.isLight ? '#f5f2eb' : 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.color = T.isLight ? '#443729' : '#e4e4e7';
                }}
              >
                <UserPlus size={13} />
                <span>Invite Partner / Friend</span>
              </button>
            </div>
          )}
        </div>

        {/* WhatsApp Sidebar Footer */}
        <div style={{
          padding: '10px 14px', borderTop: `1px solid ${T.border2}`,
          background: T.chatFooterBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '8px', transition: 'background 0.3s ease'
        }}>
          {/* Bottom Left: User Profile Avatar Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HeaderProfileMenu
              userAccount={currentUser}
              onOpenProfile={onOpenProfile}
              onOpenHistory={onOpenProfile}
              onOpenRooms={onOpenRooms}
              onLogout={onLeave}
              dropUp={true}
              theme={theme}
            />
          </div>

          {/* Bottom Right: Leave Lounge Button */}
          <button
            onClick={onLeave}
            style={{
              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', color: '#ef4444',
              fontSize: '11.5px', fontWeight: '700', cursor: 'pointer', borderRadius: '12px', padding: '5px 10px',
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
        theme={theme}
      />

      {/* ═══════ RIGHT: CHAT THREAD & WHATSAPP DYNAMIC HEADER ═══════ */}
      <main
        className={`chat-page-main ${!showMobileChat ? 'mobile-hidden' : ''}`}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          minWidth: 0, position: 'relative', zIndex: 1,
          background: T.chatBg,
          transition: 'background 0.35s ease'
        }}
      >

        {/* WHATSAPP TOP HEADER BAR */}
        <div style={{
          height: 60, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 16px',
          background: T.chatHeaderBg, borderBottom: `1px solid ${T.border2}`,
          flexShrink: 0, transition: 'background 0.35s ease, border-color 0.3s ease'
        }}>
          {/* Header Left: Current Thread Info with Mobile Back Button & Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowMobileChat(false)}
              className="mobile-back-btn"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ff5500',
                display: 'none',
                alignItems: 'center',
                cursor: 'pointer',
                padding: '4px',
                marginRight: '2px'
              }}
              title="Back to Lounge Members"
            >
              <ArrowLeft size={20} />
            </button>
            {activeChat.type === 'group' ? (
              <div style={{
                width: 38, height: 38, borderRadius: '10px',
                background: T.isLight ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : 'linear-gradient(135deg, rgba(255,85,0,0.15), rgba(234,88,12,0.08))',
                border: T.isLight ? '1px solid rgba(255, 85, 0, 0.25)' : '1px solid rgba(255, 85, 0, 0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ff5500', flexShrink: 0,
                boxShadow: T.isLight ? '0 2px 8px rgba(255, 85, 0, 0.1)' : '0 2px 8px rgba(0,0,0,0.4)'
              }}>
                <Film size={18} />
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
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: `1px solid ${T.border2}` }}
                />
                <span style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#22c55e', border: `2px solid ${T.isLight ? '#f0ebe0' : '#161722'}`
                }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: '700', color: T.textPrimary }}>
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

              <div style={{ fontSize: '11px', color: activeChat.id === 'viam-ai-bot' ? '#c084fc' : T.chatSubtext, fontWeight: '500' }}>
                {currentTypingStatus ? `${currentTypingStatus} is typing...` : (
                  activeChat.id === 'viam-ai-bot'
                    ? 'AI Assistant'
                    : activeChat.type === 'group'
                    ? `${roomUsers.length} online`
                    : 'online'
                )}
              </div>
            </div>
          </div>

          {/* Header Right: Voice Call, Video Call, and Desktop Navigation */}
          {/* Header Right: Sleek Action Control Center */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

            {/* 1. Voice Call Button */}
            <button
              onClick={() => startCall(false)}
              title={activeChat.type === 'direct' ? `Voice Call with ${activeChat.name}` : "Room Voice Call"}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.06)',
                border: T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: T.isLight ? '#166534' : '#22c55e',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = T.isLight ? 'rgba(34, 197, 94, 0.12)' : 'rgba(34, 197, 94, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <Phone size={16} />
            </button>

            {/* 2. Video Call Button */}
            <button
              onClick={() => startCall(true)}
              title={activeChat.type === 'direct' ? `Video Call with ${activeChat.name}` : "Room Video Call"}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.06)',
                border: T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: T.isLight ? '#c2410c' : '#ff7733',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = T.isLight ? 'rgba(255, 85, 0, 0.12)' : 'rgba(255, 85, 0, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(255, 85, 0, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <Video size={16} />
            </button>

            {/* 3. Cinema Theater Icon Button */}
            <button
              onClick={onOpenCinema}
              title="Watch & Choose Movies Together (4K Cinema)"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.06)',
                border: T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: T.isLight ? '#9a3412' : '#ea580c',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = T.isLight ? 'rgba(234, 88, 12, 0.12)' : 'rgba(234, 88, 12, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(234, 88, 12, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <Film size={16} />
            </button>

            {/* 4. ViAM AI Companion Icon Button */}
            <button
              onClick={onOpenAI}
              title="Open ViAM AI Companion"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.06)',
                border: T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                color: T.isLight ? '#7e22ce' : '#c084fc',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = T.isLight ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.25)';
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <Sparkles size={16} />
            </button>

            {/* 5. Voice Assistant */}
            <VoiceAssistant onGlobalVoiceAction={onGlobalVoiceAction} theme={theme} showLabel={false} />
          </div>
        </div>

        {/* Messages Stream for Current Selected Thread */}
        <ChatWindow
          messages={displayedMessages}
          setMessages={setMessages}
          currentUser={currentUser}
          onSendReaction={handleSendReaction}
          partnerTyping={!searchQuery ? currentTypingStatus : null}
          socket={socket}
          theme={theme}
        />

        {/* WhatsApp-Style Chat Input Bar */}
        <ChatInput
          onSendMessage={handleSendMessage}
          socket={socket}
          partnerName={activeChat.name}
          currentUser={currentUser}
          activeChat={activeChat}
          theme={theme}
        />
      </main>
    </div>
  );
}
