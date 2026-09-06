import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Mic, X, Paperclip, Image, FileText } from 'lucide-react';
import { getT } from '../utils/themeTokens';

const EMOJIS = [
  '❤️', '😘', '🥺', '😍', '🔥', '😂', '🥰', '💕', '🍿', '🎬', '✨', '💋', '🥂', '🫂', '🎉',
  '😭', '🤣', '😊', '💖', '🌹', '🦋', '🌙', '⭐', '💫', '🎵', '😏', '🤍', '💜', '🩷', '👍', '👏', '🤝',
  '😎', '🤩', '🥳', '🫶', '💯', '🙌', '✌️', '🫰', '💪', '🌸', '🌺', '☕', '🧋', '🍰', '🎀', '💌', '💍'
];

export default function ChatInput({ onSendMessage, socket, partnerName, currentUser, activeChat, compact = false, theme = 'dark' }) {
  const T = getT(theme);
  const [text, setText] = useState('');
  const [panel, setPanel] = useState(null); // null | 'emoji' | 'attach'
  const [isRecording, setIsRecording] = useState(false);
  const [recDur, setRecDur] = useState(0);
  const [replyTo, setReplyTo] = useState(null);

  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const recTimerRef = useRef(null);
  const typingRef = useRef(null);
  const taRef = useRef(null);
  const fileRef = useRef(null);
  const docRef = useRef(null);
  const attachMenuRef = useRef(null);

  // Listen for reply-to from ChatWindow
  useEffect(() => {
    window._chatSetReplyTo = setReplyTo;
    return () => { delete window._chatSetReplyTo; };
  }, []);

  // Close attachment menu on outside click
  useEffect(() => {
    if (panel !== 'attach') return;
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setPanel(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panel]);

  const send = (msg) => {
    onSendMessage?.({ ...msg, replyTo: replyTo || undefined });
    setReplyTo(null);
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    const recipientSocketId = activeChat?.type === 'direct' ? activeChat.id : 'group';
    socket?.emit('typing-start', { recipientSocketId });
    clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => socket?.emit('typing-stop', { recipientSocketId }), 1500);

    const ta = taRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, compact ? 80 : 120) + 'px';
    }
  };

  const handleSendText = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    send({ type: 'text', text: t });
    setText('');
    socket?.emit('typing-stop');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Image / Gallery Picker -> Sends as type: 'image'
  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert('Image must be under 15MB'); return; }
    const r = new FileReader();
    r.onload = ev => send({ type: 'image', content: ev.target.result, fileName: file.name });
    r.readAsDataURL(file);
    e.target.value = '';
    setPanel(null);
  };

  // Document Picker -> Sends as type: 'file' (unless user explicitly picks an image and wants photo)
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) { alert('File must be under 20MB'); return; }
    const r = new FileReader();
    r.onload = ev => send({
      type: 'file', content: ev.target.result,
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(0) + ' KB'
    });
    r.readAsDataURL(file);
    e.target.value = '';
    setPanel(null);
  };

  // Clipboard Image Paste (e.g. screenshots, Ctrl+V images)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type && items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          const r = new FileReader();
          r.onload = ev => send({ type: 'image', content: ev.target.result, fileName: 'Screenshot' });
          r.readAsDataURL(file);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = e => chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const m = Math.floor(recDur / 60), s = recDur % 60;
        send({ type: 'voice', content: url, duration: `${m}:${s.toString().padStart(2, '0')}` });
        stream.getTracks().forEach(t => t.stop());
        setRecDur(0);
      };
      mr.start();
      mediaRef.current = mr;
      setIsRecording(true);
      recTimerRef.current = setInterval(() => setRecDur(d => d + 1), 1000);
    } catch { console.warn('Mic access required for voice notes'); }
  };

  const stopRec = () => {
    mediaRef.current?.stop();
    clearInterval(recTimerRef.current);
    setIsRecording(false);
  };

  const togglePanel = (name) => setPanel(p => p === name ? null : name);
  const fmt = s => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const formatTextPlaceholder = () => {
    if (compact) return "Message or /play <movie>...";
    if (activeChat?.type === 'direct') {
      return `Message ${activeChat.name}...`;
    }
    return `Message Lounge or /play <movie>...`;
  };

  return (
    <div style={{
      background: compact ? 'transparent' : T.chatInputOuterBg,
      borderTop: compact ? 'none' : `1px solid ${T.border2}`,
      backdropFilter: 'blur(12px)',
      flexShrink: 0,
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box',
      transition: 'background 0.35s ease'
    }}>
      {/* WhatsApp Reply-To Bar */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px', borderBottom: `1px solid ${T.border2}`,
          background: T.chatReplyBg
        }}>
          <div style={{ width: 3, height: 36, borderRadius: 2, background: '#ff5500', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ff5500', marginBottom: 2 }}>
              Replying to {replyTo.senderName}
            </div>
            <div style={{ fontSize: 12, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.type === 'text' ? replyTo.text : `[${replyTo.type}]`}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)}
            style={{ background: 'none', border: 'none', color: T.textMuted2, cursor: 'pointer', padding: 4 }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Emoji Panel */}
      {panel === 'emoji' && (
        <div style={{ padding: 10, maxHeight: 160, overflowY: 'auto', borderBottom: `1px solid ${T.border2}`, display: 'flex', flexWrap: 'wrap', gap: 4, background: T.chatEmojiBg }}>
          {EMOJIS.map(em => (
            <button key={em} onClick={() => { setText(t => t + em); setPanel(null); }}
              style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = T.chipBg}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >{em}</button>
          ))}
        </div>
      )}

      {/* WhatsApp-Style Attachment Menu Popup */}
      {panel === 'attach' && (
        <div ref={attachMenuRef} style={{
          position: 'absolute',
          bottom: compact ? 52 : 62,
          left: compact ? 34 : 46,
          zIndex: 80,
          background: T.isLight ? '#ffffff' : '#1a1722',
          border: `1.5px solid ${T.isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 18,
          padding: '8px',
          boxShadow: T.isLight ? '0 10px 32px rgba(0,0,0,0.14)' : '0 16px 40px rgba(0,0,0,0.7)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          minWidth: 175,
          backdropFilter: 'blur(20px)',
          animation: 'bubbleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Option 1: Photos & Media (Opens fileRef, sends as type: 'image') */}
          <button
            type="button"
            onClick={() => {
              setPanel(null);
              fileRef.current?.click();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'transparent', border: 'none',
              padding: '8px 12px', borderRadius: 12,
              cursor: 'pointer', textAlign: 'left',
              color: T.textPrimary, transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 2px 10px rgba(168,85,247,0.45)', flexShrink: 0
            }}>
              <Image size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Photos &amp; Media</div>
              <div style={{ fontSize: 10.5, color: T.chatSubtext }}>Send as photo</div>
            </div>
          </button>

          {/* Option 2: Document (Opens docRef, sends as type: 'file') */}
          <button
            type="button"
            onClick={() => {
              setPanel(null);
              docRef.current?.click();
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'transparent', border: 'none',
              padding: '8px 12px', borderRadius: 12,
              cursor: 'pointer', textAlign: 'left',
              color: T.textPrimary, transition: 'background 0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = T.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 2px 10px rgba(59,130,246,0.45)', flexShrink: 0
            }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Document</div>
              <div style={{ fontSize: 10.5, color: T.chatSubtext }}>PDF, Docs, ZIP</div>
            </div>
          </button>
        </div>
      )}

      {/* Main WhatsApp-Style Input Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: compact ? 8 : 12,
        padding: compact ? '8px 10px' : '10px 16px',
        background: compact ? (T.isLight ? '#ffffff' : 'rgba(12, 14, 20, 0.98)') : T.chatInputBarBg,
        borderTop: `1px solid ${T.border2}`,
        boxSizing: 'border-box', width: '100%',
        transition: 'background 0.35s ease'
      }}>
        {/* Hidden inputs for Media and Documents */}
        <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleImage} />
        <input ref={docRef} type="file" style={{ display: 'none' }} onChange={handleFile} />

        {/* Action Icon: Emoji Picker */}
        <button
          onClick={() => togglePanel('emoji')}
          style={{
            background: 'transparent', border: 'none',
            color: panel === 'emoji' ? '#ff5500' : T.chatSubtext,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 4, transition: 'color 0.15s'
          }}
          title="Emojis"
          onMouseEnter={e => e.currentTarget.style.color = '#ff5500'}
          onMouseLeave={e => { if (panel !== 'emoji') e.currentTarget.style.color = T.chatSubtext; }}
        >
          <Smile size={compact ? 18 : 22} />
        </button>

        {/* Action Icon: Attachment with WhatsApp Menu */}
        <button
          onClick={() => togglePanel('attach')}
          style={{
            background: panel === 'attach' ? (T.isLight ? 'rgba(255,85,0,0.1)' : 'rgba(255,85,0,0.2)') : 'transparent',
            border: 'none',
            borderRadius: '50%',
            color: panel === 'attach' ? '#ff5500' : T.chatSubtext,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 6, transition: 'all 0.15s'
          }}
          title="Attach Photos or Documents"
          onMouseEnter={e => e.currentTarget.style.color = '#ff5500'}
          onMouseLeave={e => { if (panel !== 'attach') e.currentTarget.style.color = T.chatSubtext; }}
        >
          <Paperclip size={compact ? 18 : 22} />
        </button>

        {/* WhatsApp Capsule Input Box */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
          background: T.chatInputBoxBg,
          border: T.chatInputBoxBorder,
          borderRadius: 22, padding: compact ? '4px 12px' : '6px 16px',
          boxShadow: T.isLight ? '0 2px 10px rgba(0,0,0,0.05)' : '0 2px 10px rgba(0,0,0,0.2)', minWidth: 0,
          transition: 'background 0.3s ease, border-color 0.3s ease'
        }}>
          <textarea
            ref={taRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKey}
            onPaste={handlePaste}
            placeholder={formatTextPlaceholder()}
            style={{
              flex: 1, minHeight: compact ? 26 : 30, maxHeight: compact ? 80 : 120,
              background: 'transparent', border: 'none',
              color: T.textPrimary, fontSize: compact ? 13 : 14.5,
              fontFamily: 'inherit', resize: 'none', outline: 'none',
              lineHeight: 1.4, padding: '4px 0', minWidth: 0
            }}
          />

          {isRecording && (
            <span style={{ fontSize: 11, color: '#ef4444', fontWeight: '800', fontFamily: 'monospace' }}>
              🔴 {fmt(recDur)}
            </span>
          )}
        </div>

        {/* Action Button: Dynamic Send or Voice Note Button */}
        {text.trim() ? (
          <button
            onClick={handleSendText}
            style={{
              width: compact ? 36 : 42, height: compact ? 36 : 42, borderRadius: '50%',
              background: 'linear-gradient(135deg, #ff5500 0%, #e04400 100%)',
              border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(255,85,0,0.45)',
              transition: 'all 0.15s', flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
            title="Send Message"
          >
            <Send size={compact ? 15 : 18} fill="#fff" style={{ marginLeft: 2 }} />
          </button>
        ) : (
          <button
            onMouseDown={startRec} onMouseUp={stopRec}
            onTouchStart={startRec} onTouchEnd={stopRec}
            style={{
              width: compact ? 36 : 42, height: compact ? 36 : 42, borderRadius: '50%',
              background: isRecording ? '#ef4444' : 'transparent',
              border: 'none', color: isRecording ? '#fff' : T.chatSubtext,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0
            }}
            onMouseEnter={e => { if (!isRecording) e.currentTarget.style.color = '#ff5500'; }}
            onMouseLeave={e => { if (!isRecording) e.currentTarget.style.color = T.chatSubtext; }}
            title="Hold to Record Voice Note"
          >
            <Mic size={compact ? 18 : 22} />
          </button>
        )}
      </div>
    </div>
  );
}
