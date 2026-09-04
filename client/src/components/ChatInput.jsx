import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Mic, X, Paperclip } from 'lucide-react';

const EMOJIS = [
  '❤️', '😘', '🥺', '😍', '🔥', '😂', '🥰', '💕', '🍿', '🎬', '✨', '💋', '🥂', '🫂', '🎉',
  '😭', '🤣', '😊', '💖', '🌹', '🦋', '🌙', '⭐', '💫', '🎵', '😏', '🤍', '💜', '🩷', '👍', '👏', '🤝',
  '😎', '🤩', '🥳', '🫶', '💯', '🙌', '✌️', '🫰', '💪', '🌸', '🌺', '☕', '🧋', '🍰', '🎀', '💌', '💍'
];

export default function ChatInput({ onSendMessage, socket, partnerName, currentUser, activeChat, compact = false }) {
  const [text, setText] = useState('');
  const [panel, setPanel] = useState(null); // null | 'emoji'
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

  // Listen for reply-to from ChatWindow
  useEffect(() => {
    window._chatSetReplyTo = setReplyTo;
    return () => { delete window._chatSetReplyTo; };
  }, []);

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

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert('Image must be under 4MB'); return; }
    const r = new FileReader();
    r.onload = ev => send({ type: 'image', content: ev.target.result });
    r.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) { alert('File must be under 12MB'); return; }
    const r = new FileReader();
    r.onload = ev => send({
      type: 'file', content: ev.target.result,
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(0) + ' KB'
    });
    r.readAsDataURL(file);
    e.target.value = '';
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
      background: 'rgba(10, 11, 16, 0.95)',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      backdropFilter: 'blur(12px)',
      flexShrink: 0,
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* WhatsApp Reply-To Bar */}
      {replyTo && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px', borderBottom: '1px solid #27272a',
          background: '#141417'
        }}>
          <div style={{ width: 3, height: 36, borderRadius: 2, background: '#ff5500', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#ff5500', marginBottom: 2 }}>
              Replying to {replyTo.senderName}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {replyTo.type === 'text' ? replyTo.text : `[${replyTo.type}]`}
            </div>
          </div>
          <button onClick={() => setReplyTo(null)}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Emoji Panel */}
      {panel === 'emoji' && (
        <div style={{ padding: 10, maxHeight: 160, overflowY: 'auto', borderBottom: '1px solid #27272a', display: 'flex', flexWrap: 'wrap', gap: 4, background: '#141417' }}>
          {EMOJIS.map(em => (
            <button key={em} onClick={() => { setText(t => t + em); setPanel(null); }}
              style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8 }}
              onMouseEnter={e => e.currentTarget.style.background = '#27272a'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >{em}</button>
          ))}
        </div>
      )}

      {/* Main WhatsApp-Style Input Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: compact ? 8 : 12,
        padding: compact ? '8px 10px' : '10px 16px',
        background: '#161722', boxSizing: 'border-box', width: '100%'
      }}>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
        <input ref={docRef} type="file" style={{ display: 'none' }} onChange={handleFile} />

        {/* Action Icon: Emoji Picker */}
        <button
          onClick={() => togglePanel('emoji')}
          style={{
            background: 'transparent', border: 'none',
            color: panel === 'emoji' ? '#ff5500' : '#8696a0',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 4, transition: 'color 0.15s'
          }}
          title="Emojis"
          onMouseEnter={e => e.currentTarget.style.color = '#e9edef'}
          onMouseLeave={e => { if (panel !== 'emoji') e.currentTarget.style.color = '#8696a0'; }}
        >
          <Smile size={compact ? 18 : 22} />
        </button>

        {/* Action Icon: Attachment */}
        <button
          onClick={() => docRef.current?.click()}
          style={{
            background: 'transparent', border: 'none',
            color: '#8696a0',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 4, transition: 'color 0.15s'
          }}
          title="Attach File or Media"
          onMouseEnter={e => e.currentTarget.style.color = '#e9edef'}
          onMouseLeave={e => e.currentTarget.style.color = '#8696a0'}
        >
          <Paperclip size={compact ? 18 : 22} />
        </button>

        {/* WhatsApp Capsule Input Box */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
          background: '#1f202c',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 22, padding: compact ? '4px 12px' : '6px 16px',
          boxShadow: 'none', minWidth: 0
        }}>
          <textarea
            ref={taRef}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKey}
            placeholder={formatTextPlaceholder()}
            style={{
              flex: 1, minHeight: compact ? 26 : 30, maxHeight: compact ? 80 : 120,
              background: 'transparent', border: 'none',
              color: '#ffffff', fontSize: compact ? 13 : 14.5,
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
              background: '#ff5500',
              border: 'none', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(255,85,0,0.4)',
              transition: 'all 0.15s', flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
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
              border: 'none', color: isRecording ? '#fff' : '#8696a0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0
            }}
            onMouseEnter={e => { if (!isRecording) e.currentTarget.style.color = '#e9edef'; }}
            onMouseLeave={e => { if (!isRecording) e.currentTarget.style.color = '#8696a0'; }}
            title="Hold to Record Voice Note"
          >
            <Mic size={compact ? 18 : 22} />
          </button>
        )}
      </div>
    </div>
  );
}
