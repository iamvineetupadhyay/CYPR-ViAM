import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Play, Pause, Reply, Trash2, SmilePlus, Check, CheckCheck,
  Pin, Edit2, ExternalLink, CornerUpLeft, X, Lock, ShieldCheck,
  Paperclip, Ban, Bot, Sparkles, Film, Download
} from 'lucide-react';
import { getT } from '../utils/themeTokens';

const QUICK_REACTS = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

const fmtTime = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
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
function VoicePlayer({ msg, isMine, isLight = false }) {
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
          background: isMine ? '#ff5500' : (isLight ? '#16a34a' : '#25d366'),
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
            background: isMine ? '#ff5500' : (isLight ? '#16a34a' : '#25d366'),
            opacity: (i / bars.length) * 100 <= progress ? 1 : 0.35
          }} />
        ))}
      </div>

      <span style={{ fontSize: 11, fontWeight: 700, color: isLight ? (isMine ? '#431407' : '#1a1208') : 'rgba(255,255,255,0.7)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
        {msg.duration || '0:00'}
      </span>
    </div>
  );
}

/* ── Link Preview ── */
function LinkPreview({ url, isLight = false }) {
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
      background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.25)', textDecoration: 'none',
      borderLeft: '3px solid #ff5500', fontSize: 12
    }}>
      <ExternalLink size={13} color="#ff5500" style={{ flexShrink: 0 }} />
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: isLight ? '#1a1208' : 'rgba(255,255,255,0.85)' }}>
        {url.length > 45 ? url.slice(0, 45) + '…' : url}
      </span>
    </a>
  );
}

/* ── Rich Markdown Parser for Chat & AI Messages ── */
function parseInlineMarkdown(str, isLight = false) {
  if (!str) return '';
  const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|https?:\/\/[^\s]+)/g;
  const parts = str.split(tokenRegex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <strong key={i} style={{ color: '#ff5500', fontWeight: 800 }}>
          {inner}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      const inner = part.slice(1, -1);
      return (
        <em key={i} style={{ color: isLight ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)', fontStyle: 'italic' }}>
          {inner}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      const inner = part.slice(1, -1);
      return (
        <code key={i} style={{
          background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.12)',
          color: isLight ? '#9a3412' : '#fdba74',
          padding: '1px 5px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {inner}
        </code>
      );
    }
    if (/^https?:\/\/[^\s]+$/.test(part)) {
      return (
        <a key={i} href={part} target="_blank" rel="noreferrer" style={{ color: isLight ? '#0284c7' : '#00f5d4', textDecoration: 'underline' }}>
          {part}
        </a>
      );
    }
    return part;
  });
}

function FormattedMessageText({ text, isLight = false }) {
  if (!text) return null;
  const lines = text.split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13.5, lineHeight: 1.6, color: 'inherit' }}>
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
              {parseInlineMarkdown(headerText, isLight)}
            </div>
          );
        }

        // Horizontal line
        if (trimmed === '---' || trimmed === '***') {
          return <div key={lineIdx} style={{ height: 1, background: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)', margin: '4px 0' }} />;
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
              <span style={{ flex: 1, color: 'inherit' }}>{parseInlineMarkdown(content, isLight)}</span>
            </div>
          );
        }

        return (
          <div key={lineIdx} style={{ color: 'inherit' }}>
            {parseInlineMarkdown(line, isLight)}
          </div>
        );
      })}
    </div>
  );
}

/* ── Pristine Fullscreen Lightbox Modal (Direct document.body Portal) ── */
function LightboxModal({ src, fileName, onClose }) {
  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!src) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999999,
        background: 'rgba(5, 5, 8, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}
    >
      {/* Top Header Controls Bar */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
          zIndex: 10,
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          color: '#ffffff', fontSize: 14, fontWeight: 600,
          maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '0.2px'
        }}>
          {fileName || 'Photo Preview'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href={src}
            download={fileName || 'photo.png'}
            title="Download image"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff', cursor: 'pointer', textDecoration: 'none',
              transition: 'all 0.18s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 85, 0, 0.4)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Download size={18} />
          </a>

          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 38, height: 38, borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#ffffff', cursor: 'pointer',
              transition: 'all 0.18s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.5)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Main Preview Image */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth: '92vw',
          maxHeight: '84vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}
      >
        <img
          src={src}
          alt={fileName || 'Preview'}
          style={{
            maxWidth: '100%',
            maxHeight: '84vh',
            objectFit: 'contain',
            borderRadius: 14,
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.15)',
            userSelect: 'none',
            display: 'block'
          }}
        />
      </div>
    </div>,
    document.body
  );
}

/* ── WhatsApp Message Bubble Component ── */
function WhatsAppBubble({ msg, isMine, onReply, onDelete, onEdit, onPin, onReact, isPinned, theme = 'dark' }) {
  const T = getT(theme);
  const isAI = msg.isAI || msg.senderId === 'viam-ai-bot' || msg.senderName?.includes('ViAM AI');
  const [hover, setHover] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.text || '');
  const [lightbox, setLightbox] = useState(false);

  if (msg.isSystem || msg.senderName === 'System') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 16px', margin: '4px 0' }}>
        <div style={{
          fontSize: 11.5, fontWeight: 600, color: '#ff5500',
          background: 'rgba(255, 120, 0, 0.09)', border: '1px solid rgba(255, 120, 0, 0.22)',
          borderRadius: 20, padding: '5px 14px', backdropFilter: 'blur(10px)',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          boxShadow: T.isLight ? '0 2px 8px rgba(0,0,0,0.06)' : '0 4px 14px rgba(0,0,0,0.3)', letterSpacing: '0.2px'
        }}>
          <span>{msg.text || msg.content}</span>
        </div>
      </div>
    );
  }

  if (msg.deleted) {
    return (
      <div style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', padding: '3px 14px' }}>
        <div style={{
          fontSize: 12, color: T.chatSubtext,
          background: T.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '5px 12px',
          border: `1px solid ${T.border1}`, display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Ban size={12} color={T.chatSubtext} />
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
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12 }}>
          <img
            src={msg.content}
            alt={msg.fileName || 'Photo'}
            onClick={() => setLightbox(true)}
            style={{
              maxWidth: 280,
              maxHeight: 220,
              borderRadius: 12,
              display: 'block',
              cursor: 'pointer',
              objectFit: 'cover',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          />
        </div>
        {lightbox && (
          <LightboxModal
            src={msg.content}
            fileName={msg.fileName || 'Photo'}
            onClose={() => setLightbox(false)}
          />
        )}
        {msg.text && (
          <div style={{ marginTop: 6 }}>
            <FormattedMessageText text={msg.text} isLight={T.isLight} />
          </div>
        )}
      </>
    );
    if (msg.type === 'gif') return (
      <>
        <img
          src={msg.content}
          alt="GIF"
          onClick={() => setLightbox(true)}
          style={{ maxWidth: 240, borderRadius: 12, display: 'block', cursor: 'pointer' }}
        />
        {lightbox && (
          <LightboxModal
            src={msg.content}
            fileName="GIF"
            onClose={() => setLightbox(false)}
          />
        )}
      </>
    );
    if (msg.type === 'voice') return <VoicePlayer msg={msg} isMine={isMine} isLight={T.isLight} />;
    if (msg.type === 'sticker') return <span style={{ fontSize: 52, lineHeight: 1.1, display: 'block' }}>{msg.content}</span>;
    if (msg.type === 'file') {
      const isImgFile = msg.content?.startsWith('data:image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(msg.fileName || '');
      return (
        <>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            color: T.isLight ? '#1a1208' : '#fff', fontSize: 13, padding: '8px 12px',
            background: T.isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
            borderRadius: 12, border: T.isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.08)'
          }}>
            <div
              onClick={() => { if (isImgFile) setLightbox(true); }}
              style={{
                width: 34, height: 34, borderRadius: 8,
                background: 'rgba(255,85,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ff5500', flexShrink: 0,
                cursor: isImgFile ? 'pointer' : 'default',
                overflow: 'hidden'
              }}
              title={isImgFile ? 'Click to preview' : undefined}
            >
              {isImgFile ? (
                <img src={msg.content} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Paperclip size={16} />
              )}
            </div>
            <div
              onClick={() => { if (isImgFile) setLightbox(true); }}
              style={{ flex: 1, minWidth: 0, cursor: isImgFile ? 'pointer' : 'default' }}
              title={isImgFile ? 'Click to preview' : undefined}
            >
              <div style={{
                fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
              }}>
                {msg.fileName || 'Attachment'}
              </div>
              <div style={{ fontSize: 11, color: T.isLight ? '#786958' : 'rgba(255,255,255,0.6)' }}>
                {msg.fileSize || ''}
              </div>
            </div>
            <a
              href={msg.content}
              download={msg.fileName || 'attachment'}
              title="Download"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 6,
                background: 'rgba(255,85,0,0.15)', color: '#ff5500',
                textDecoration: 'none'
              }}
            >
              <Download size={14} />
            </a>
          </div>
          {lightbox && isImgFile && (
            <LightboxModal
              src={msg.content}
              fileName={msg.fileName || 'Attachment Preview'}
              onClose={() => setLightbox(false)}
            />
          )}
        </>
      );
    }
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
            background: T.isLight ? '#ffffff' : 'rgba(0,0,0,0.3)',
            border: '1px solid #ff5500',
            borderRadius: 8, padding: '4px 8px',
            color: T.isLight ? '#1a1208' : '#fff', fontSize: 13.5,
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
        <FormattedMessageText text={msg.text || msg.content || ''} isLight={T.isLight} />
        {urls?.slice(0, 1).map((u, i) => <LinkPreview key={i} url={u} isLight={T.isLight} />)}
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
            <span style={{ fontSize: 11, fontWeight: '800', color: isAI ? '#ff5500' : (T.isLight ? '#c2410c' : '#ff8533') }}>
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
            ? (T.isLight ? 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)' : 'linear-gradient(135deg, rgba(255, 85, 0, 0.28) 0%, rgba(200, 60, 0, 0.38) 100%)')
            : isAI
              ? (T.isLight ? 'linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%)' : 'linear-gradient(135deg, rgba(255, 85, 0, 0.12), rgba(20, 16, 14, 0.94))')
              : (T.isLight ? 'rgba(255, 255, 255, 0.97)' : 'linear-gradient(135deg, rgba(28, 30, 44, 0.95) 0%, rgba(20, 22, 34, 0.98) 100%)'),
          border: isMine
            ? (T.isLight ? '1.5px solid rgba(255, 85, 0, 0.35)' : '1px solid rgba(255, 110, 30, 0.5)')
            : isAI
              ? (T.isLight ? '1.5px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 85, 0, 0.35)')
              : (T.isLight ? '1.5px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)'),
          color: isMine
            ? (T.isLight ? '#431407' : '#ffffff')
            : isAI
              ? (T.isLight ? '#3b0764' : '#ffffff')
              : (T.isLight ? '#1a1208' : '#ffffff'),
          backdropFilter: 'blur(12px)',
          boxShadow: isMine
            ? (T.isLight ? '0 2px 10px rgba(255, 85, 0, 0.12)' : '0 4px 18px rgba(255, 85, 0, 0.22)')
            : isAI
              ? (T.isLight ? '0 4px 16px rgba(168, 85, 247, 0.12)' : '0 6px 24px rgba(0,0,0,0.6), 0 0 15px rgba(255, 85, 0, 0.12)')
              : (T.isLight ? '0 2px 12px rgba(0, 0, 0, 0.06)' : '0 4px 16px rgba(0,0,0,0.4)'),
          position: 'relative'
        }}>

          {/* Reply-to Container inside Bubble */}
          {msg.replyTo && (
            <div style={{
              padding: '6px 10px', borderRadius: 8,
              background: T.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.3)',
              borderLeft: '3px solid #ff5500',
              fontSize: 12, marginBottom: 6
            }}>
              <div style={{ fontWeight: 800, color: '#ff5500', fontSize: 11, marginBottom: 2 }}>
                {msg.replyTo.senderName}
              </div>
              <div style={{ color: T.isLight ? '#2a1f14' : 'rgba(255,255,255,0.75)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {msg.replyTo.type === 'text' ? msg.replyTo.text : `[${msg.replyTo.type}]`}
              </div>
            </div>
          )}

          {renderContent()}

          {/* Timestamp & WhatsApp Double Checkmark Status Indicators */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 4, marginTop: 4, fontSize: 10,
            color: isMine ? (T.isLight ? 'rgba(67, 20, 7, 0.65)' : 'rgba(255,255,255,0.6)') : (T.isLight ? 'rgba(26, 18, 8, 0.55)' : 'rgba(255,255,255,0.6)'),
            fontFamily: 'monospace'
          }}>
            {msg.edited && <span style={{ fontStyle: 'italic', marginRight: 2 }}>edited</span>}
            <span>{fmtTime(msg.timestamp)}</span>
            {isMine && (
              msg.read ? (
                <CheckCheck size={14} color="#34b7f1" title="Seen by partner" style={{ filter: 'drop-shadow(0 0 4px rgba(52, 183, 241, 0.6))' }} />
              ) : msg.delivered ? (
                <CheckCheck size={14} color={T.isLight ? 'rgba(67, 20, 7, 0.65)' : 'rgba(255,255,255,0.75)'} title="Delivered to partner" />
              ) : (
                <Check size={14} color={T.isLight ? 'rgba(67, 20, 7, 0.5)' : 'rgba(255,255,255,0.5)'} title="Sent to server" />
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
                background: T.isLight ? '#ffffff' : '#120e0b',
                border: `1px solid ${T.isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,85,0,0.3)'}`,
                color: T.textPrimary,
                boxShadow: T.isLight ? '0 2px 6px rgba(0,0,0,0.08)' : '0 2px 8px rgba(0,0,0,0.5)',
                display: 'flex', alignItems: 'center', gap: 3
              }}>
                <span>{em}</span>
                {count > 1 && <span style={{ fontWeight: 700, fontSize: 10 }}>{count}</span>}
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
function DateDivider({ date, theme = 'dark' }) {
  const T = getT(theme);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', userSelect: 'none' }}>
      <div style={{ flex: 1, height: 1, background: T.border2 }} />
      <span style={{
        fontSize: 11, fontWeight: '800', color: T.isLight ? '#7a6a54' : 'rgba(255,255,255,0.7)',
        padding: '4px 14px', borderRadius: 20,
        background: T.isLight ? '#ffffff' : '#120e0b',
        border: `1px solid ${T.isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,85,0,0.3)'}`,
        letterSpacing: '1px', boxShadow: T.isLight ? '0 2px 8px rgba(0,0,0,0.06)' : '0 2px 10px rgba(0,0,0,0.4)'
      }}>
        {date}
      </span>
      <div style={{ flex: 1, height: 1, background: T.border2 }} />
    </div>
  );
}

/* ── WhatsApp Live Typing Dots Indicator ── */
function TypingIndicator({ name, theme = 'dark' }) {
  const T = getT(theme);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 20px' }}>
      <div style={{
        padding: '10px 16px', borderRadius: '16px 16px 16px 2px',
        background: T.isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255,255,255,0.08)',
        border: `1px solid ${T.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255,255,255,0.12)'}`,
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: T.isLight ? '0 2px 10px rgba(0,0,0,0.05)' : 'none'
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
  onSendReaction, partnerTyping, socket,
  theme = 'dark'
}) {
  const T = getT(theme);
  const endRef = useRef(null);
  const listRef = useRef(null);
  const [pinnedMsg, setPinnedMsg] = useState(null);
  const [replyTo, setReplyTo] = useState(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  useEffect(() => {
    window._chatSetReplyTo = setReplyTo;
    return () => { delete window._chatSetReplyTo; };
  }, [replyTo]);
  useEffect(() => {
    if (!socket) return;
    const onStatusUpdate = ({ messageId, status }) => {
      setMessages(prev => prev.map(m => {
        const idMatches = (m.id || m.timestamp) === messageId || m.id === messageId;
        if (idMatches) {
          return {
            ...m,
            delivered: status === 'delivered' || status === 'seen' || m.delivered,
            read: status === 'seen' || m.read
          };
        }
        return m;
      }));
    };

    const onMsgDeleted = ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        (m.id || m.timestamp) === messageId ? { ...m, deleted: true } : m
      ));
    };

    const onMsgReacted = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(m => {
        const mId = String(m.id || m.timestamp);
        const targetId = String(messageId);
        if (mId === targetId || String(m.id) === targetId || String(m.timestamp) === targetId) {
          return { ...m, reactions: reactions || {} };
        }
        return m;
      }));
    };

    socket.on('message-status-update', onStatusUpdate);
    socket.on('message-deleted', onMsgDeleted);
    socket.on('message-reacted', onMsgReacted);

    // Auto-mark partner messages as seen/delivered
    messages.forEach(m => {
      const isFromPartner = (m.senderId && socket?.id) ? m.senderId !== socket.id : m.senderName !== currentUser?.name;
      if (isFromPartner && !m.read) {
        socket.emit('message-seen', { messageId: m.id || m.timestamp, senderSocketId: m.senderId });
      }
    });

    return () => {
      socket.off('message-status-update', onStatusUpdate);
      socket.off('message-deleted', onMsgDeleted);
      socket.off('message-reacted', onMsgReacted);
    };
  }, [socket, setMessages, currentUser?.name, messages.length]);

  const handleReact = useCallback((msgId, emoji) => {
    const cleanId = String(msgId);
    socket?.emit('message-react', { messageId: cleanId, emoji });
  }, [socket]);

  const handleDelete = useCallback((msgId) => {
    setMessages(prev => prev.map(m =>
      (m.id || m.timestamp) === msgId ? { ...m, deleted: true } : m
    ));
    socket?.emit('message-delete', { messageId: msgId });
  }, [setMessages, socket]);

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
    <div className="whatsapp-chat-bg" style={{
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: T.chatBg, transition: 'background 0.35s ease'
    }}>
      
        <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', fontSize: '11px', fontWeight: '600',
            background: T.isLight ? 'rgba(0, 0, 0, 0.04)' : '#141417',
            border: `1px solid ${T.border2}`, borderRadius: '20px',
            color: T.chatSubtext
          }}>
            <Lock size={12} color={T.chatSubtext} />
            <span>256-bit Encrypted Session</span>
          </span>
        </div>

      {/* Pinned Message Bar */}
      {pinnedMsg && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px', borderBottom: `1px solid ${T.border2}`,
          background: T.isLight ? 'rgba(255, 255, 255, 0.95)' : '#141417'
        }}>
          <Pin size={14} color="#ff5500" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: '700', color: '#ff5500' }}>Pinned Message</div>
            <div style={{ fontSize: 12, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pinnedMsg.type === 'text' ? pinnedMsg.text : `[${pinnedMsg.type}]`}
            </div>
          </div>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '10px 0', scrollBehavior: 'smooth' }}>
        {messages.length === 0 && !partnerTyping ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div style={{ textAlign: 'center', maxWidth: '380px' }}>
              <img
                src="/new_chat_cloud_illustration.png"
                alt="Cinema Lounge Chat"
                style={{
                  width: '100%',
                  maxHeight: '210px',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto 18px',
                  filter: T.isLight ? 'drop-shadow(0 8px 24px rgba(0,0,0,0.06))' : 'drop-shadow(0 12px 30px rgba(0,0,0,0.8))'
                }}
              />

              <h3
                style={{
                  fontSize: '17px',
                  fontWeight: '800',
                  color: T.textPrimary,
                  marginBottom: '6px',
                  letterSpacing: '-0.3px',
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                Encrypted Lounge Session
              </h3>

              <p
                style={{
                  fontSize: '13px',
                  color: T.isLight ? '#786958' : '#a1a1aa',
                  lineHeight: 1.5,
                  margin: '0 0 16px'
                }}
              >
                Send a message to start real-time encrypted chat &amp; video sync.
              </p>

              {/* Feature Badges */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: T.isLight ? '#3f3529' : '#d4d4d8',
                    background: T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.05)',
                    border: T.isLight ? '1px solid rgba(0, 0, 0, 0.07)' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '3px 9px',
                    borderRadius: '12px'
                  }}
                >
                  <Lock size={11} color="#ff5500" /> 256-bit Encrypted
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: T.isLight ? '#3f3529' : '#d4d4d8',
                    background: T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.05)',
                    border: T.isLight ? '1px solid rgba(0, 0, 0, 0.07)' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '3px 9px',
                    borderRadius: '12px'
                  }}
                >
                  <ShieldCheck size={11} color="#22c55e" /> Zero Logs
                </span>

                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: T.isLight ? '#3f3529' : '#d4d4d8',
                    background: T.isLight ? '#f5f2eb' : 'rgba(255, 255, 255, 0.05)',
                    border: T.isLight ? '1px solid rgba(0, 0, 0, 0.07)' : '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '3px 9px',
                    borderRadius: '12px'
                  }}
                >
                  <Sparkles size={11} color="#a855f7" /> AI Companion
                </span>
              </div>
            </div>
          </div>
        ) : (
          groups.map((item, i) =>
            item.type === 'date' ? (
              <DateDivider key={`d-${i}`} date={item.date} theme={theme} />
            ) : (
              <WhatsAppBubble
                key={item.msg.id || item.msg.timestamp || i}
                msg={item.msg}
                isMine={(item.msg.senderId && socket?.id) ? item.msg.senderId === socket.id : item.msg.senderName === currentUser?.name}
                onReply={setReplyTo}
                onDelete={handleDelete}
                onEdit={handleEdit}
                onPin={handlePin}
                onReact={handleReact}
                isPinned={pinnedMsg?.timestamp === item.msg.timestamp}
                theme={theme}
              />
            )
          )
        )}

        {partnerTyping && <TypingIndicator name={partnerTyping} theme={theme} />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
