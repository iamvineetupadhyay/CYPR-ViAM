import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Heart, X, Smile } from 'lucide-react';

const ROMANTIC_EMOJIS = ['❤️', '😘', '🍿', '🥺', '🔥', '😂', '🥂', '💖'];

export default function ChatDrawer({
  messages,
  onSendMessage,
  onSendReaction,
  currentUser,
  isOpen,
  onToggle,
  videoCallComponent
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="btn btn-secondary btn-icon"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          zIndex: 60,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(12px)'
        }}
        title="Open Couple Chat"
      >
        <MessageSquare size={18} />
      </button>
    );
  }

  return (
    <aside className="chat-lounge">
      <div className="chat-header">
        <div className="chat-title">
          <Heart size={16} color="#f43f5e" fill="#f43f5e" />
          <span>Love Lounge Chat</span>
        </div>
        <button
          onClick={onToggle}
          className="btn btn-secondary btn-icon"
          style={{ width: '28px', height: '28px' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Couple Video Lounge in Right Sidebar */}
      {videoCallComponent && (
        <div className="chat-video-dock">
          {videoCallComponent}
        </div>
      )}

      {/* Messages Feed */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-sub)', marginTop: '40px', fontSize: '13px' }}>
            <p>No messages yet.</p>
            <p style={{ marginTop: '6px' }}>Whisper something sweet to your love! 💕</p>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isMine = m.senderId === currentUser?.socketId || m.senderName === currentUser?.name;
            return (
              <div
                key={idx}
                className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}
              >
                {!isMine && <div className="chat-sender">{m.senderName}</div>}
                <div>{m.text}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Instant Reactions Bar */}
      <div className="reaction-bar">
        {ROMANTIC_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="reaction-btn"
            onClick={() => onSendReaction(emoji)}
            title={`Send ${emoji} reaction`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input row */}
      <form onSubmit={handleSubmit} className="chat-input-row">
        <input
          type="text"
          placeholder="Whisper message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="chat-input"
        />
        <button type="submit" className="btn btn-primary btn-icon" style={{ width: '38px', height: '38px' }}>
          <Send size={15} />
        </button>
      </form>
    </aside>
  );
}
