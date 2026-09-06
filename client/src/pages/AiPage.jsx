import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Bot, Send, Mic, MicOff, Copy, Check, RotateCcw,
  Volume2, VolumeX, Trash2, Plus, MessageSquare, Film, Home,
  Menu, X, Play, Compass, Lightbulb, HelpCircle, Film as MovieIcon,
  Flame, Clapperboard, ChevronRight, Share2, ExternalLink, Zap,
  ThumbsUp, ThumbsDown, RefreshCw, MessageCircle, Sun, Moon
} from 'lucide-react';
import HeaderProfileMenu from '../components/HeaderProfileMenu';
import FormattedAiResponse from '../components/FormattedAiResponse';
import VoiceAssistant from '../components/VoiceAssistant';
import { SERVER_URL } from '../utils/apiUrl';
import { getT } from '../utils/themeTokens';


export default function AiPage({
  currentUser,
  roomId,
  roomUsers = [],
  mediaState,
  onNavigate,
  onOpenHome,
  onOpenCinema,
  onOpenChat,
  onOpenProfile,
  onLeave,
  onToggleTheme,
  onGlobalVoiceAction,
  theme = 'dark'
}) {
  const T = getT(theme);

  // Multi-Session Chat State (Gemini History Model)
  const [sessions, setSessions] = useState(() => {
    try {
      const saved = localStorage.getItem(`cypr_ai_sessions_${roomId || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      // Migrate legacy single history if available
      const oldHistory = localStorage.getItem(`cypr_ai_history_${roomId || 'default'}`);
      const oldMsgs = oldHistory ? JSON.parse(oldHistory) : [];
      return [{
        id: 'session_init',
        title: oldMsgs.length > 0 ? (oldMsgs[0].text.slice(0, 30) + '...') : 'New Cinema Chat',
        timestamp: Date.now(),
        messages: oldMsgs
      }];
    } catch {
      return [{ id: 'session_init', title: 'New Cinema Chat', timestamp: Date.now(), messages: [] }];
    }
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const saved = localStorage.getItem(`cypr_ai_sessions_${roomId || 'default'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return 'session_init';
  });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || {
    id: 'session_init',
    title: 'New Cinema Chat',
    timestamp: Date.now(),
    messages: []
  };

  const messages = activeSession.messages || [];

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [streamingMsgId, setStreamingMsgId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, streamingText]);

  // Persist sessions to local storage
  useEffect(() => {
    try {
      localStorage.setItem(`cypr_ai_sessions_${roomId || 'default'}`, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save AI sessions:', e);
    }
  }, [sessions, roomId]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Text-to-Speech (TTS)
  const handleSpeak = (text, msgId) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ''));
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Copy to clipboard
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Stream Typewriter Effect for newly arrived messages
  const streamResponse = (fullText, msgId) => {
    setStreamingMsgId(msgId);
    setStreamingText('');
    let idx = 0;
    const speed = Math.max(10, Math.min(22, Math.floor(1600 / fullText.length)));

    const interval = setInterval(() => {
      idx += 3;
      if (idx >= fullText.length) {
        setStreamingText(fullText);
        setStreamingMsgId(null);
        clearInterval(interval);
      } else {
        setStreamingText(fullText.substring(0, idx));
      }
    }, speed);
  };

  // 1. Create a Fresh New Chat (Preserving all previous sessions!)
  const handleCreateNewChat = () => {
    // If current session is already empty, just stay on it
    if (activeSession.messages.length === 0) {
      return;
    }

    const newId = `session_${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Cinema Chat',
      timestamp: Date.now(),
      messages: []
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setStreamingMsgId(null);
    setStreamingText('');
    setInput('');
  };

  // 2. Delete Single Session
  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== sessionId);
      if (filtered.length === 0) {
        const blank = { id: `session_${Date.now()}`, title: 'New Cinema Chat', timestamp: Date.now(), messages: [] };
        setActiveSessionId(blank.id);
        return [blank];
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  // 3. Clear All History
  const handleClearAllHistory = () => {
    const blank = { id: `session_${Date.now()}`, title: 'New Cinema Chat', timestamp: Date.now(), messages: [] };
    setSessions([blank]);
    setActiveSessionId(blank.id);
    localStorage.removeItem(`cypr_ai_sessions_${roomId || 'default'}`);
    localStorage.removeItem(`cypr_ai_history_${roomId || 'default'}`);
  };

  // 4. Send message to backend Groq AI
  const handleSendMessage = async (customPrompt = null, isRegenerate = false) => {
    let textToSend = (customPrompt || input).trim();

    if (isRegenerate) {
      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      if (lastUser) textToSend = lastUser.text;
    }

    if (!textToSend || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    // Update active session with user message and compute dynamic title
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const isFirstMessage = s.messages.length === 0;
        const newTitle = isFirstMessage ? (textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '')) : s.title;
        return {
          ...s,
          title: newTitle,
          messages: isRegenerate ? s.messages : [...s.messages, userMessage]
        };
      }
      return s;
    }));

    if (!isRegenerate) setInput('');
    setIsLoading(true);

    try {
      const convHistory = messages.slice(-8).map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch(`${SERVER_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: convHistory,
          currentMovie: mediaState?.title && mediaState.title !== 'No movie selected' ? mediaState.title : null
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const aiReply = data.reply || 'I am having trouble processing that right now. Please try again!';
      const aiMsgId = `ai-${Date.now()}`;

      const aiMessage = {
        id: aiMsgId,
        role: 'assistant',
        text: aiReply,
        timestamp: Date.now()
      };

      // Append AI response to the active session
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, aiMessage]
          };
        }
        return s;
      }));

      streamResponse(aiReply, aiMsgId);
    } catch (err) {
      console.error('[AI Chat Error]:', err);
      const errorMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ **Connection Note:** Could not connect to the Groq AI service. Please verify server connectivity or try again in a moment.\n\n*Error details: ${err.message}*`,
        timestamp: Date.now()
      };
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return { ...s, messages: [...s.messages, errorMessage] };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const starterPrompts = [
    {
      title: 'Mind-Bending Plot Analysis',
      subtitle: 'Explain the timeline and ending of Inception or Interstellar',
      prompt: 'Can you explain the ending and timeline of Christopher Nolan\'s Inception? Was Cobb still in a dream in the final scene?'
    },
    {
      title: 'Date Night Cinema Matcher',
      subtitle: 'Suggest romantic comedy or mystery movies for two',
      prompt: 'Suggest 4 great movies for a date night watch party. A mix of heartwarming romantic comedy and a light mystery!'
    },
    {
      title: 'Movie Trivia & Easter Eggs',
      subtitle: 'Behind-the-scenes secrets from legendary Hollywood films',
      prompt: 'Tell me 4 mind-blowing behind-the-scenes Easter eggs and trivia facts from The Dark Knight trilogy.'
    },
    {
      title: 'Live Cinema /play Launcher',
      subtitle: 'Ask how to launch movies directly in your synchronized room',
      prompt: 'How do I use the /play command to watch movies with my partner in the Cinema Lounge?'
    }
  ];

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      width: '100vw',
      background: T.isLight ? T.pageBg : '#08090e',
      backgroundImage: T.isLight ? 'none' : `
        radial-gradient(circle at 10% 20%, rgba(168, 85, 247, 0.08) 0%, transparent 45%),
        radial-gradient(circle at 90% 80%, rgba(56, 189, 248, 0.06) 0%, transparent 45%),
        radial-gradient(circle at 50% 50%, #0d0f17 0%, #06070a 100%)
      `,
      color: T.textPrimary,
      fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
      overflow: 'hidden',
      transition: 'background 0.4s ease, color 0.35s ease'
    }}>


      {/* ══════════════════════════════════════════════════════════════
          1. GEMINI-STYLE COLLAPSIBLE SIDEBAR (PRESERVED SESSIONS ONLY)
      ══════════════════════════════════════════════════════════════ */}
      <aside style={{
        width: sidebarOpen ? 290 : 0,
        minWidth: sidebarOpen ? 290 : 0,
        height: '100%',
        background: T.sidebarBg,
        backdropFilter: 'blur(24px)',
        borderRight: sidebarOpen ? `1px solid ${T.sidebarBorder}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        zIndex: 20
      }}>
        {/* Sidebar Brand Header */}
        <div style={{
          height: 64,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: `1px solid ${T.sidebarBorder}`,
          flexShrink: 0
        }}>
          <img
            src="/viam_logo.png"
            alt="ViAM AI"
            style={{
              height: 42,
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 10px rgba(168, 85, 247, 0.5))'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontWeight: 800,
              fontSize: 15,
              letterSpacing: '0.5px',
              background: 'linear-gradient(135deg, #ffffff 0%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              ViAM AI
            </span>
            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
              Cinema Intelligence
            </span>
          </div>
        </div>

        {/* "+ New Cinema Chat" Button (Pushed down nicely below header line) */}
        <div style={{ padding: '16px 16px 10px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={handleCreateNewChat}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              background: T.isLight
                ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(168, 85, 247, 0.16) 0%, rgba(236, 72, 153, 0.12) 100%)',
              border: `1px solid ${T.isLight ? 'rgba(168, 85, 247, 0.35)' : 'rgba(168, 85, 247, 0.4)'}`,
              borderRadius: 16,
              padding: '12px 18px',
              color: T.isLight ? '#7e22ce' : '#ffffff',
              fontSize: '13.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: T.isLight ? '0 2px 10px rgba(168, 85, 247, 0.12)' : '0 4px 18px rgba(168, 85, 247, 0.25)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#c084fc';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(168, 85, 247, 0.4)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(168, 85, 247, 0.25)';
              e.currentTarget.style.transform = '';
            }}
          >
            <Plus size={16} color={T.isLight ? '#7e22ce' : '#c084fc'} />
            <span>+ New Cinema Chat</span>
          </button>
        </div>

        {/* Recent Chat Sessions List (Gemini History) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: T.textMuted2,
            padding: '6px 8px',
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>Recent Chats</span>
            <span style={{ fontSize: 10, color: '#475569' }}>{sessions.length}</span>
          </div>

          {sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setStreamingMsgId(null);
                  setStreamingText('');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: isActive
                    ? T.aiSidebarSessionActive
                    : T.aiSidebarSessionBg,
                  border: isActive
                    ? `1.5px solid ${T.aiSidebarSessionBorder}`
                    : `1px solid ${T.border1}`,
                  color: isActive ? (T.isLight ? '#7c3aed' : '#f8fafc') : T.textMuted1,
                  fontSize: '12.5px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = T.isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.color = T.textPrimary;
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = T.aiSidebarSessionBg;
                    e.currentTarget.style.color = T.textMuted1;
                  }
                }}
              >
                <MessageSquare size={14} color={isActive ? '#a855f7' : T.textMuted3} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {session.title || 'Cinema Chat'}
                </span>

                {/* Delete Single Session Icon */}
                <button
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: T.textMuted3,
                    cursor: 'pointer',
                    padding: 4,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isActive ? 1 : 0.6,
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#ef4444';
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = T.textMuted3;
                    e.currentTarget.style.opacity = isActive ? '1' : '0.6';
                  }}
                  title="Delete chat"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '16px', borderTop: `1px solid ${T.sidebarBorder}`, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: T.textMuted3 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={11} color="#22c55e" /> Groq 70B Fast
            </span>
            <span>Room: {roomId}</span>
          </div>

          <button
            onClick={handleClearAllHistory}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              padding: '8px 12px',
              borderRadius: 10,
              fontSize: 11.5,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}
          >
            <Trash2 size={12} />
            <span>Clear All Chats</span>
          </button>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════
          2. MAIN GEMINI CONVERSATION CONTAINER
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

        {/* Top Header Bar */}
        <header style={{
          height: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: T.headerBg,
          backdropFilter: 'blur(24px)',
          borderBottom: `1px solid ${T.headerBorder}`,
          zIndex: 10,
          transition: 'background 0.35s ease, border-color 0.3s ease'
        }}>
          {/* Left: Website Logo on Left + Sidebar Toggle Button on Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* 1. Website Logo First */}
            <div
              onClick={onOpenHome}
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              title="Return to Home Hub"
            >
              <img
                src="/viam_logo.png"
                alt="CYPR ViAM"
                style={{
                  height: 48,
                  width: 'auto',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 14px rgba(168,85,247,0.5))',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
            </div>

            {/* 2. Sidebar Toggle Button on Right Side of Logo */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: T.pillBg,
                border: `1px solid ${T.pillBorder}`,
                color: T.textPrimary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 10,
                transition: 'all 0.15s ease'
              }}
              title="Toggle Sidebar"
              onMouseEnter={e => e.currentTarget.style.background = T.border2}
              onMouseLeave={e => e.currentTarget.style.background = T.pillBg}
            >
              <Menu size={18} />
            </button>
          </div>

          {/* Right Navigation & Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              onClick={onOpenHome}
              className="cinema-header-pill"
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: T.pillBg,
                border: `1px solid ${T.pillBorder}`,
                color: T.pillText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Return to Home Hub"
            >
              <Home size={16} />
            </button>

            <button
              onClick={onOpenCinema}
              className="cinema-header-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: T.pillBg,
                border: `1px solid ${T.pillBorder}`,
                color: T.pillText,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
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
              title="Open 4K Cinema Theater"
            >
              <Film size={15} color="#ff7733" />
              <span className="mobile-text-hidden">Cinema</span>
            </button>

            <button
              onClick={onOpenChat}
              className="cinema-header-pill"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: T.pillBg,
                border: `1px solid ${T.pillBorder}`,
                color: T.pillText,
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
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
              title="Open Chatting Messenger"
            >
              <MessageSquare size={15} color="#22c55e" />
              <span className="mobile-text-hidden">Chat</span>
            </button>

            {/* Voice Assistant */}
            <VoiceAssistant onGlobalVoiceAction={onGlobalVoiceAction} theme={theme} />

            <div style={{ width: 1, height: 20, background: T.border2, margin: '0 2px' }} />

            <HeaderProfileMenu
              userAccount={currentUser}
              onOpenProfile={onOpenProfile}
              onOpenHistory={onOpenProfile}
              onLogout={onLeave}
              theme={theme}
            />
          </div>
        </header>

        {/* Chat Scrollable Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 24px 140px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div style={{ maxWidth: 860, width: '100%', display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* 🌟 Welcome Gemini Screen (When Current Session is Blank) */}
            {messages.length === 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                marginTop: 40,
                animation: 'fadeIn 0.3s ease'
              }}>
                <div style={{
                  fontSize: '44px',
                  fontWeight: 900,
                  fontFamily: 'Outfit, sans-serif',
                  lineHeight: 1.2,
                  marginBottom: 8,
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 40%, #38bdf8 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Hello, {currentUser?.name || 'Cinephile'}
                </div>

                <div style={{ fontSize: '26px', fontWeight: 700, color: T.textMuted1, marginBottom: 36 }}>
                  How can ViAM AI assist your Cinema experience today?
                </div>

                {/* Gemini Suggestion Prompt Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 14,
                  width: '100%'
                }}>
                  {starterPrompts.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      style={{
                        background: T.aiCardBg,
                        border: `1px solid ${T.aiCardBorder}`,
                        borderRadius: 18,
                        padding: '18px 20px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        minHeight: 110,
                        transition: 'all 0.2s ease',
                        boxShadow: T.isLight ? '0 4px 16px rgba(0,0,0,0.06)' : '0 8px 24px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(12px)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#c084fc';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.background = T.isLight ? 'rgba(168, 85, 247, 0.08)' : 'rgba(168, 85, 247, 0.12)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = T.aiCardBorder;
                        e.currentTarget.style.transform = '';
                        e.currentTarget.style.background = T.aiCardBg;
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 800, color: T.textPrimary, marginBottom: 6 }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 12, color: T.textMuted1, lineHeight: 1.4 }}>
                        {item.subtitle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 💬 Conversation Stream */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isStreamingThis = streamingMsgId === msg.id;
              const displayText = isStreamingThis ? streamingText : msg.text;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    gap: 16,
                    alignItems: 'flex-start',
                    width: '100%'
                  }}
                >
                  {/* Gemini Sparkle / User Avatar Icon */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: isUser
                      ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                      : 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #38bdf8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                    boxShadow: isUser ? '0 4px 12px rgba(2, 132, 199, 0.3)' : '0 4px 18px rgba(168, 85, 247, 0.45)',
                    marginTop: 4
                  }}>
                    {isUser ? (
                      currentUser?.avatar ? (
                        <img src={currentUser.avatar} alt="User" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        currentUser?.name?.charAt(0)?.toUpperCase() || 'U'
                      )
                    ) : (
                      <Sparkles size={18} />
                    )}
                  </div>

                  {/* Message Content Bubble / Markdown Canvas */}
                  <div style={{
                    maxWidth: isUser ? '72%' : '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    flex: isUser ? 'none' : 1
                  }}>
                    {isUser ? (
                      <div style={{
                        background: T.aiUserBubbleBg,
                        border: `1px solid ${T.border3}`,
                        borderRadius: '20px 20px 4px 20px',
                        padding: '12px 18px',
                        color: '#ffffff',
                        fontSize: '14px',
                        lineHeight: 1.55,
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(16px)'
                      }}>
                        {msg.text}
                      </div>
                    ) : (
                      <div style={{
                        background: T.aiBubbleBg,
                        border: `1px solid ${T.aiBubbleBorder}`,
                        borderRadius: '20px 20px 20px 4px',
                        padding: '18px 22px',
                        color: T.textPrimary,
                        boxShadow: T.isLight ? '0 4px 16px rgba(0, 0, 0, 0.05)' : '0 10px 30px rgba(0, 0, 0, 0.45)',
                        backdropFilter: 'blur(20px)',
                        position: 'relative'
                      }}>
                        <FormattedAiResponse text={displayText} onPlayMovie={onOpenCinema} theme={theme} />

                        {/* Animated Typewriter Cursor */}
                        {isStreamingThis && (
                          <span style={{
                            display: 'inline-block',
                            width: 3,
                            height: 16,
                            background: '#c084fc',
                            marginLeft: 4,
                            animation: 'pulse 0.8s infinite',
                            verticalAlign: 'middle'
                          }} />
                        )}
                      </div>
                    )}

                    {/* Gemini Action Toolbar for AI responses */}
                    {!isUser && !isStreamingThis && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        paddingLeft: 4,
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => handleCopy(msg.text, msg.id)}
                          style={{
                            background: T.pillBg,
                            border: `1px solid ${T.pillBorder}`,
                            color: copiedId === msg.id ? '#22c55e' : T.textMuted1,
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: '11.5px',
                            fontWeight: 600,
                            transition: 'all 0.15s ease'
                          }}
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleSpeak(msg.text, msg.id)}
                          style={{
                            background: T.pillBg,
                            border: `1px solid ${T.pillBorder}`,
                            color: speakingId === msg.id ? '#38bdf8' : T.textMuted1,
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: '11.5px',
                            fontWeight: 600,
                            transition: 'all 0.15s ease'
                          }}
                          title={speakingId === msg.id ? 'Stop Speaking' : 'Read Aloud'}
                        >
                          {speakingId === msg.id ? <VolumeX size={13} color="#38bdf8" /> : <Volume2 size={13} />}
                          <span>{speakingId === msg.id ? 'Listening...' : 'Listen'}</span>
                        </button>

                        <button
                          onClick={() => handleSendMessage(null, true)}
                          style={{
                            background: T.pillBg,
                            border: `1px solid ${T.pillBorder}`,
                            color: T.textMuted1,
                            cursor: 'pointer',
                            padding: '4px 10px',
                            borderRadius: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: '11.5px',
                            fontWeight: 600,
                            transition: 'all 0.15s ease'
                          }}
                          title="Regenerate answer"
                        >
                          <RefreshCw size={12} />
                          <span>Regenerate</span>
                        </button>

                        {/* Quick Cinema Jump if message mentions /play */}
                        {msg.text.includes('/play') && (
                          <button
                            onClick={onOpenCinema}
                            style={{
                              background: 'linear-gradient(135deg, rgba(255, 85, 0, 0.2) 0%, rgba(255, 85, 0, 0.1) 100%)',
                              border: '1px solid rgba(255, 85, 0, 0.4)',
                              color: '#ff7733',
                              padding: '4px 12px',
                              borderRadius: 12,
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                          >
                            <Play size={11} fill="#ff7733" />
                            <span>Launch Player in Cinema</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* 🌌 Gemini Shimmering Thinking Waves Animation */}
            {isLoading && (
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #38bdf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 4px 18px rgba(168, 85, 247, 0.45)',
                  marginTop: 4
                }}>
                  <Sparkles size={18} />
                </div>

                <div style={{
                  background: T.aiBubbleBg,
                  border: `1px solid ${T.aiBubbleBorder}`,
                  borderRadius: '20px 20px 20px 4px',
                  padding: '16px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  minWidth: 260
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px', color: '#c084fc', fontWeight: 700 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#c084fc', animation: 'pulse 1s infinite' }} />
                    ViAM AI is thinking...
                  </div>

                  {/* Gemini Shimmering Wave Skeleton */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{
                      height: 10,
                      borderRadius: 6,
                      background: 'linear-gradient(90deg, rgba(168,85,247,0.1) 0%, rgba(56,189,248,0.25) 50%, rgba(168,85,247,0.1) 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite linear',
                      width: '90%'
                    }} />
                    <div style={{
                      height: 10,
                      borderRadius: 6,
                      background: 'linear-gradient(90deg, rgba(168,85,247,0.1) 0%, rgba(56,189,248,0.25) 50%, rgba(168,85,247,0.1) 100%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 1.5s infinite linear',
                      width: '65%'
                    }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            3. GEMINI FLOATING OMNIBAR INPUT CAPSULE
        ══════════════════════════════════════════════════════════════ */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px 20px',
          background: T.aiOmnibarGradient,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{
            maxWidth: 860,
            width: '100%',
            background: T.aiOmnibarBg,
            border: T.aiOmnibarBorder,
            borderRadius: 28,
            padding: '10px 16px 10px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            boxShadow: T.isLight ? '0 12px 32px rgba(0, 0, 0, 0.08), 0 0 16px rgba(168, 85, 247, 0.1)' : '0 16px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(168, 85, 247, 0.15)',
            backdropFilter: 'blur(24px)',
            transition: 'all 0.2s ease'
          }}>
            {/* Input Text Area */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask ViAM AI anything about movies, plots, endings, or type /play <movie>..."
              rows={1}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: T.textPrimary,
                fontSize: 14.5,
                outline: 'none',
                resize: 'none',
                maxHeight: 120,
                fontFamily: 'inherit',
                lineHeight: 1.4
              }}
            />

            {/* Voice Dictation Mic Button */}
            <button
              onClick={toggleSpeechRecognition}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: isListening ? '#ef4444' : T.pillBg,
                border: `1px solid ${T.pillBorder}`,
                color: isListening ? '#fff' : T.textPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={isListening ? 'Stop Listening' : 'Voice Input'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            {/* Gradient Send Button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!input.trim() || isLoading}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: input.trim() && !isLoading
                  ? 'linear-gradient(135deg, #a855f7 0%, #ec4899 50%, #38bdf8 100%)'
                  : (T.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)'),
                border: 'none',
                color: input.trim() && !isLoading ? '#fff' : (T.isLight ? '#94a3b8' : '#64748b'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                boxShadow: input.trim() && !isLoading ? '0 4px 16px rgba(168, 85, 247, 0.4)' : 'none'
              }}
              title="Send to ViAM AI"
            >
              <Send size={16} />
            </button>
          </div>

          <span style={{ fontSize: 11, color: T.textMuted3 }}>
            ViAM AI Cinema Genie • Powered by Groq Llama 3.3 70B • Real-time cinema sync across lounge
          </span>
        </div>

      </div>

    </div>
  );
}
