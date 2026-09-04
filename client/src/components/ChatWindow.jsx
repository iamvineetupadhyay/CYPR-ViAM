import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play, Pause, Reply, Trash2, SmilePlus, Check, CheckCheck,
  Pin, Edit2, ExternalLink, CornerUpLeft, X, Lock, ShieldCheck,
  Paperclip, Ban, Bot, Sparkles
} from 'lucide-react';

const QUICK_REACTS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

const fmtTime = (ts) => {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
};

const formatDateDivider = (ts) => {
  if (!ts) return 'Today';
  const msgDate = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (msgDate.toDateString() === today.toDateString()) return 'TODAY';
  if (msgDate.toDateString() === yesterday.toDateString()) return 'YESTERDAY';
  return msgDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
};

/* ── WhatsApp Style Voice Player ── */
function VoicePlayer({ msg, isMine }) {
  const aRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const bars = Array.from({ length: 28 }, (_, i) =>
    Math.max(4, Math.min(24, 8 + Math.sin(i * 1.3) * 7 + (i % 4) * 1.5))
  );

  const toggle = () => {
    if (!aRef.current) return;
    if (playing) {
      aRef.current.pause();
      setPlaying(false);
    } else {
      aRef.current.play();
      setPlaying(true);
    }
  };

  useEffect(() => {
    const el = aRef.current;
    if (!el) return;
    const onEnd = () => { setPlaying(false); setProgress(0); };
    const onT = () => setProgress((el.currentTime / (el.duration || 1)) * 100);
    el.addEventListener('ended', onEnd);
    el.addEventListener('timeupdate', onT);
    return () => {
      el.removeEventListener('ended', onEnd);
      el.removeEventListener('timeupdate', onT);
    };
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 200, padding: '4px 0' }}>
      <audio ref={aRef} src={msg.content} preload="metadata" />
      <button
        onClick={toggle}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: isMine ? '#ff5500' : '#25d366',
          border: 'none', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
        }}
      >
        {playing ? <Pause size={15} fill="#fff" /> : <Play size={15} fill="#fff" style={{ marginLeft: 2 }} />}
      </button>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
        {bars.map((h, i) => (
          <div key={i} style={{
            width: 3, height: h, borderRadius: 2,
            background: isMine ? '#ff5500' : '#25d366',
            opacity: (i / bars.length) * 100 <= progress ? 1 : 0.35
          }} />
        ))}
      </div>

      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
        {msg.duration || '0:00'}
      </span>
    </div>
  );
}

/* ── Link Preview ── */
function LinkPreview({ url }) {
  const [meta, setMeta] = useState(null);
  useEffect(() => {
    const match = url.match(/^https?:\/\/([^/]+)/);
    if (match) setMeta({ domain: match[1] });
  }, [url]);

  if (!meta) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginTop: 6, padding: '8px 12px', borderRadius: 10,
      background: 'rgba(0,0,0,0.25)', textDecoration: 'none',
      borderLeft: '3px solid #ff5500', fontSize: 12
    }}>
      <ExternalLink size={13} color="#ff5500" style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.85)' }}>
        {url.length > 45 ? url.slice(0, 45) + '…' : url}
      </span>
    </a>
  );
}

/* ── Rich Markdown Parser for Chat & AI Messages ── */
function parseInlineMarkdown(str) {
  if (!str) return '';
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[^\s]+)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <strong key={i} style={{ color: '#ff7733', fontWeight: 800, textShadow: '0 0 10px rgba(255, 119, 51, 0.25)' }}>
          {inner}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1);
      return (
        <em key={i} style={{ color: 'rgba(255,255,255,0.88)', fontStyle: 'italic' }}>
          {inner}
        </em>
      );
    }
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: '#00f5d4', textDecoration: 'underline' }}>
          {part}
        </a>
      );
    }
    return part;
  });
}

function FormattedMessageText({ text }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13.5, lineHeight: 1.6, color: '#f4f4f5' }}>
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} style={{ height: 4 }} />;
        }

        // Headers (### or ##)
        if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
          const headerText = trimmed.replace(/^#+\s*/, '');
          return (
            <div key={lineIdx} style={{ fontSize: 13.5, fontWeight: 800, color: '#ff5500', letterSpacing: '0.3px', marginTop: 4 }}>
              {parseInlineMarkdown(headerText)}
            </div>
          );
        }

        // Horizontal line
        if (trimmed === '---' || trimmed === '***') {
          return <div key={lineIdx} style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />;
        }

        // Bullet point line (- item or * item)
        const isBullet = /^[*-]\s+/.test(trimmed);
        const isNumbered = /^\d+\.\s+/.test(trimmed);

        if (isBullet || isNumbered) {
          const content = trimmed.replace(/^([*-]|\d+\.)\s+/, '');
          return (
            <div key={lineIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingLeft: 2, margin: '1px 0' }}>
              <span style={{ color: '#ff5500', fontSize: 13, flexShrink: 0, marginTop: 0.5, fontWeight: '700' }}>
                {isNumbered ? trimmed.match(/^\d+\./)[0] : '•'}
              </span>
              <span style={{ flex: 1 }}>{parseInlineMarkdown(content)}</span>
            </div>
          );
        }

        return (
          <div key={lineIdx}>
            {parseInlineMarkdown(line)}
          </div>
        );
      })}
    </div>
  );
}

/* ── WhatsApp Message Bubble Component ── */
function WhatsAppBubble({ msg, isMine, onReply, onDelete, onEdit, onPin, onReact, isPinned }) {
  const isAI = msg.isAI || msg.senderId === 'viam-ai-bot' || msg.senderName?.includes('ViAM AI');
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text || '');
  const [lightbox, setLightbox] = useState(false);

  if (msg.deleted) {
    return (
      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', padding: '3px 14px' }}>
        <div style={{
          fontSize: 12, color: 'rgba(255,255,255,0.45)',
          background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '5px 12px',
          border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Ban size={12} color="#71717a" />
          <span>This message was deleted</span>
        </div>
      </div>
    );
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = (msg.text || msg.content || '').match(urlRegex);

  const renderContent = () => {
    if (msg.type === 'image') return (
      <>
        <img src={msg.content} alt="" onClick={() => setLightbox(true)}
          style={{ maxWidth: 260, maxHeight: 220, borderRadius: 12, display: 'block', cursor: 'pointer', objectFit: 'cover' }} />
        {lightbox && (
          <div onClick={() => setLightbox(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <img src={msg.content} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} />
          </div>
        )}
        {msg.text && (
          <div style={{ marginTop: 6 }}>
            <FormattedMessageText text={msg.text} />
          </div>
        )}
      </>
    );
    if (msg.type === 'gif') return <img src={msg.content} alt="" style={{ maxWidth: 240, borderRadius: 12, display: 'block' }} />;
    if (msg.type === 'voice') return <VoicePlayer msg={msg} isMine={isMine} />;
    if (msg.type === 'sticker') return <span style={{ fontSize: 52, lineHeight: 1.1, display: 'block' }}>{msg.content}</span>;
    if (msg.type === 'file') return (
      <a href={msg.content} download={msg.fileName} style={{
        display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
        color: '#fff', fontSize: 13, padding: '8px 12px', background: 'rgba(255,255,255,0.04)',
        borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)'
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: 'rgba(255,85,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff5500', flexShrink: 0
        }}>
          <Paperclip size={16} />
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>{msg.fileName || 'Attachment'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>{msg.fileSize || ''}</div>
        </div>
      </a>
    );
    if (editing) return (
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          value={editText}
          onChange={e => setEditText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { onEdit(msg.id, editText); setEditing(false); }
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid #ff5500',
            borderRadius: 8, padding: '4px 8px', color: '#fff', fontSize: 13.5,
            outline: 'none', minWidth: 140
          }}
          autoFocus
        />
        <button onClick={() => { onEdit(msg.id, editText); setEditing(false); }}
          style={{ background: '#ff5500', border: 'none', color: '#fff', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: '700' }}>Save</button>
      </div>
    );

    // Render formatted rich text
    return (
      <div>
        <FormattedMessageText text={msg.text || msg.content || ''} />
        {urls?.slice(0, 1).map((u, i) => <LinkPreview key={i} url={u} />)}
      </div>
    );
  };

  const isMedia = ['image', 'gif', 'sticker'].includes(msg.type);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        padding: '3px 16px',
        position: 'relative'
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* WhatsApp Hover Quick Actions Toolbar */}
      {hover && (
        <div style={{
          position: 'absolute', top: -10, [isMine ? 'left' : 'right']: 24, zIndex: 30,
          display: 'flex', alignItems: 'center', gap: 3,
          background: '#120e0b', border: '1px solid rgba(255,85,0,0.3)',
          borderRadius: 20, padding: '3px 8px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
          backdropFilter: 'blur(16px)'
        }}>
          {QUICK_REACTS.map(em => (
            <button
              key={em}
              onClick={() => { onReact(msg.id || msg.timestamp, em); setHover(false); }}
              style={{
                width: 26, height: 26, border: 'none', background: 'transparent',
                fontSize: 16, cursor: 'pointer', borderRadius: 8, transition: 'transform 0.15s'
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.3)'}
              onMouseLeave={e => e.currentTarget.style.transform = ''}
            >
              {em}
            </button>
          ))}
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.15)', margin: '0 3px' }} />
          <button onClick={() => onReply(msg)} title="Reply" style={actionBtnStyle}><Reply size={13} /></button>
          {isMine && msg.type === 'text' && (
            <button onClick={() => setEditing(true)} title="Edit" style={actionBtnStyle}><Edit2 size={13} /></button>
          )}
          <button onClick={() => onPin(msg)} title="Pin" style={{ ...actionBtnStyle, color: isPinned ? '#ff5500' : undefined }}><Pin size={13} /></button>
          {isMine && (
            <button onClick={() => onDelete(msg.id || msg.timestamp)} title="Delete" style={{ ...actionBtnStyle, color: '#ef4444' }}><Trash2 size={13} /></button>
          )}
        </div>
      )}

      <div style={{ maxWidth: '82%', display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start' }}>
        
        {/* Received Sender Name Header */}
        {!isMine && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, paddingLeft: 4 }}>
            <span style={{ fontSize: 11, fontWeight: '800', color: isAI ? '#ff5500' : '#ff7733' }}>
              {msg.senderName || 'Partner'}
            </span>
            {isAI && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: '#ff5500', background: 'rgba(255,85,0,0.15)',
                padding: '1px 5px', borderRadius: 4, border: '1px solid rgba(255,85,0,0.3)', letterSpacing: '0.5px'
              }}>
                GROQ 70B
              </span>
            )}
          </div>
        )}

        {/* Tail & Bubble Box */}
        <div style={{
          padding: isMedia ? '4px' : '10px 14px',
          borderRadius: msg.replyTo
            ? isMine ? '0 0 4px 16px' : '0 0 16px 4px'
            : isMine ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
          background: isMine
            ? 'rgba(255, 85, 0, 0.22)'
            : isAI
              ? 'linear-gradient(135deg, rgba(255, 85, 0, 0.12), rgba(20, 16, 14, 0.94))'
              : 'rgba(255, 255, 255, 0.08)',
          border: isMine
            ? '1.5px solid rgba(255, 85, 0, 0.45)'
            : isAI
              ? '1px solid rgba(255, 85, 0, 0.35)'
              : '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff',
          backdropFilter: 'blur(12px)',
          boxShadow: isMine
            ? '0 4px 18px rgba(255, 85, 0, 0.2)'
            : isAI
              ? '0 6px 24px rgba(0,0,0,0.6), 0 0 15px rgba(255, 85, 0, 0.12)'
              : '0 2px 10px rgba(0,0,0,0.3)',
          position: 'relative'
        }}>

          {/* Reply-to Container inside Bubble */}
          {msg.replyTo && (
            <div style={{
              padding: '6px 10px', borderRadius: 8,
              background: 'rgba(0,0,0,0.3)',
              borderLeft: '3px solid #ff5500',
              fontSize: 12, marginBottom: 6
            }}>
              <div style={{ fontWeight: 800, color: '#ff5500', fontSize: 11, marginBottom: 2 }}>
                {msg.replyTo.senderName}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {msg.replyTo.type === 'text' ? msg.replyTo.text : `[${msg.replyTo.type}]`}
              </div>
            </div>
          )}

          {renderContent()}

          {/* Timestamp & WhatsApp Double Checkmark Status Indicators */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 4, marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.6)',
            fontFamily: 'monospace'
          }}>
            {msg.edited && <span style={{ fontStyle: 'italic', marginRight: 2 }}>edited</span>}
            <span>{fmtTime(msg.timestamp)}</span>
            {isMine && (
              msg.read ? (
                <CheckCheck size={14} color="#00f5d4" title="Read by partner" />
              ) : msg.delivered ? (
                <CheckCheck size={14} color="rgba(255,255,255,0.7)" title="Delivered to partner" />
              ) : (
                <Check size={14} color="rgba(255,255,255,0.5)" title="Sent to server" />
              )
            )}
          </div>
        </div>

        {/* Reaction Badges */}
        {msg.reactions && Object.keys(msg.reactions).length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: -4, zIndex: 10 }}>
            {Object.entries(msg.reactions).map(([em, count]) => (
              <span key={em} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 12,
                background: '#120e0b', border: '1px solid rgba(255,85,0,0.3)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4)', color: '#fff'
              }}>
                {em} {count > 1 ? count : ''}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const actionBtnStyle = {
  width: 26, height: 26, border: 'none', background: 'transparent',
  color: 'rgba(255,255,255,0.7)', cursor: 'pointer', borderRadius: 6,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s'
};

/* ── WhatsApp Sticky Date Divider ── */
function DateDivider({ date }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', userSelect: 'none' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <span style={{
        fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.7)',
        padding: '4px 14px', borderRadius: 20,
        background: '#120e0b', border: '1px solid rgba(255,85,0,0.3)',
        letterSpacing: '1px', boxShadow: '0 2px 10px rgba(0,0,0,0.4)'
      }}>
        {date}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

/* ── WhatsApp Live Typing Dots Indicator ── */
function TypingIndicator({ name }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 20px' }}>
      <div style={{
        padding: '10px 16px', borderRadius: '16px 16px 16px 2px',
        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <span style={{ fontSize: 12, fontWeight: '700', color: '#ff5500' }}>{name || 'Partner'} is typing</span>
        <div style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: '#ff5500',
              animation: 'typingBounce 1.2s infinite',
              animationDelay: `${i * 0.2}s`
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── MAIN CHAT WINDOW EXPORT ── */
export default function ChatWindow({
  messages, setMessages, currentUser,
  onSendReaction, partnerTyping, socket
}) {
  const endRef = useRef(null);
  const listRef = useRef(null);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  useEffect(() => {
    if (window._chatSetReplyTo) window._chatSetReplyTo(replyTo);
  }, [replyTo]);
  useEffect(() => {
    window._chatSetReplyTo = setReplyTo;
    return () => { delete window._chatSetReplyTo; };
  }, []);

  const handleReact = useCallback((msgId, emoji) => {
    setMessages(prev => prev.map(m => {
      if ((m.id || m.timestamp) === msgId) {
        const reactions = { ...(m.reactions || {}) };
        reactions[emoji] = (reactions[emoji] || 0) + 1;
        return { ...m, reactions };
      }
      return m;
    }));
    socket?.emit('message-react', { messageId: msgId, emoji });
  }, [setMessages, socket]);

  const handleDelete = useCallback((msgId) => {
    setMessages(prev => prev.map(m =>
      (m.id || m.timestamp) === msgId ? { ...m, deleted: true } : m
    ));
  }, [setMessages]);

  const handleEdit = useCallback((msgId, newText) => {
    setMessages(prev => prev.map(m =>
      (m.id || m.timestamp) === msgId ? { ...m, text: newText, edited: true } : m
    ));
  }, [setMessages]);

  const handlePin = useCallback((msg) => {
    setPinnedMsg(prev => (prev?.timestamp === msg.timestamp ? null : msg));
  }, []);

  // Group messages by date
  const groups = [];
  let lastDate = '';
  messages.forEach(msg => {
    const d = formatDateDivider(msg.timestamp);
    if (d !== lastDate) {
      groups.push({ type: 'date', date: d });
      lastDate = d;
    }
    groups.push({ type: 'msg', msg });
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0b0806' }}>
      
        <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', fontSize: '11px', fontWeight: '600',
            background: '#141417', border: '1px solid #27272a', borderRadius: '20px',
            color: '#a1a1aa'
          }}>
            <Lock size={12} color="#a1a1aa" />
            <span>256-bit Encrypted Session</span>
          </span>
        </div>

      {/* Pinned Message Bar */}
      {pinnedMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px', borderBottom: '1px solid #27272a',
          background: '#141417'
        }}>
          <Pin size={14} color="#ff5500" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: '700', color: '#ff5500' }}>Pinned Message</div>
            <div style={{ fontSize: 12, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pinnedMsg.type === 'text' ? pinnedMsg.text : `[${pinnedMsg.type}]`}
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 0', scrollBehavior: 'smooth' }}>
        {messages.length === 0 && !partnerTyping ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ textAlign: 'center', color: '#a1a1aa', maxWidth: '360px' }}>
              <img
                src="/new_chat_cloud_illustration.png"
                alt="New Chat"
                style={{
                  width: '100%',
                  maxHeight: '220px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto 20px',
                  filter: 'drop-shadow(0 12px 30px rgba(0,0,0,0.8))'
                }}
              />
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', marginBottom: '6px' }}>
                Encrypted Lounge Session
              </div>
              <div style={{ fontSize: '13px', color: '#71717a', lineHeight: 1.5 }}>
                Send a message to start real-time encrypted chat & video sync.
              </div>
            </div>
          </div>
        ) : (
          groups.map((item, i) =>
            item.type === 'date' ? (
              <DateDivider key={`d-${i}`} date={item.date} />
            ) : (
              <WhatsAppBubble
                key={item.msg.timestamp || i}
                msg={item.msg}
                isMine={item.msg.senderName === currentUser?.name}
                onReply={setReplyTo}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPin={handlePin}
                onReact={handleReact}
                isPinned={pinnedMsg?.timestamp === item.msg.timestamp}
              />
            )
          )
        )}

        {partnerTyping && <TypingIndicator name={partnerTyping} />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
