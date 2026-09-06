import React, { useState, useEffect } from 'react';
import { Sparkles, Brain, Film, MessageSquare, Send, X, RefreshCw, ChevronRight, Zap, HelpCircle } from 'lucide-react';
import { getApiUrl } from '../utils/apiUrl';
import { getT } from '../utils/themeTokens';

export default function AiCinemaCompanion({ isOpen, onClose, currentMovie, socket, roomId, currentUser, theme }) {
  const currentTheme = theme || (typeof document !== 'undefined' && document.body.classList.contains('light-theme') ? 'light' : 'dark');
  const T = getT(currentTheme);

  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'ask' | 'trivia'
  const [trivia, setTrivia] = useState('');
  const [loadingTrivia, setLoadingTrivia] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ViAM AI',
      isAI: true,
      text: `🍿 Hey ${currentUser?.name || 'there'}! I'm your AI Cinema Companion powered by Groq Llama 3.3. Ask me anything about "${currentMovie?.title || 'the movie'}" or tap an instant insight below!`
    }
  ]);
  const [isAiTyping, setIsAiTyping] = useState(false);

  const movieTitle = currentMovie?.title && currentMovie.title !== 'No movie selected'
    ? currentMovie.title
    : 'Inception';

  // Fetch movie trivia when opened
  useEffect(() => {
    if (isOpen && !trivia) {
      fetchTrivia();
    }
  }, [isOpen, movieTitle]);

  const fetchTrivia = async () => {
    setLoadingTrivia(true);
    try {
      const res = await fetch(`${getApiUrl()}/api/ai/trivia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieTitle })
      });
      const data = await res.json();
      if (data.trivia) {
        setTrivia(data.trivia);
      }
    } catch (err) {
      console.error('[AI Trivia Error]', err);
    } finally {
      setLoadingTrivia(false);
    }
  };

  const handleSendPrompt = async (promptText) => {
    const textToSend = promptText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = { sender: currentUser?.name || 'You', isAI: false, text: textToSend.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!promptText) setChatInput('');
    setIsAiTyping(true);

    try {
      const res = await fetch(`${getApiUrl()}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend.trim(),
          conversationHistory: chatMessages.slice(-4),
          currentMovie: { title: movieTitle }
        })
      });
      const data = await res.json();
      const aiMsg = {
        sender: 'ViAM AI',
        isAI: true,
        text: data.reply || "I couldn't analyze this right now. Please check Groq API settings!"
      };
      setChatMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('[AI Chat Error]', err);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ViAM AI', isAI: true, text: "⚠️ Unable to connect to Groq AI service right now." }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="viam-ai-companion-drawer"
      style={{
        position: 'fixed',
        top: '64px',
        right: '16px',
        width: '380px',
        height: 'calc(100vh - 84px)',
        background: T.surfaceModal,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 85, 0, 0.25)',
        borderRadius: '16px',
        boxShadow: T.isLight ? '0 16px 40px rgba(0,0,0,0.12)' : '0 20px 50px rgba(0,0,0,0.8), 0 0 20px rgba(255, 85, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 100,
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        background: T.isLight ? 'rgba(255,85,0,0.08)' : 'linear-gradient(135deg, rgba(255,85,0,0.15), rgba(0,0,0,0.4))',
        borderBottom: `1px solid ${T.borderDivider}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #ff5500, #ea580c)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Brain size={16} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '800', color: T.textPrimary, letterSpacing: '0.3px' }}>
                ViAM AI Companion
              </span>
              <span style={{
                fontSize: '9px', fontWeight: '800', background: 'rgba(255, 85, 0, 0.2)',
                color: '#ff5500', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(255, 85, 0, 0.4)'
              }}>
                GROQ 70B
              </span>
            </div>
            <p style={{ fontSize: '10px', color: T.textMuted2, margin: 0, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '220px' }}>
              Context: {movieTitle}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            background: T.pillBg, border: 'none', color: T.textMuted1,
            cursor: 'pointer', borderRadius: '50%', width: '26px', height: '26px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <X size={15} />
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        background: T.isLight ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.3)',
        borderBottom: `1px solid ${T.borderDivider}`,
        padding: '6px'
      }}>
        <button
          onClick={() => setActiveTab('insights')}
          style={{
            flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '8px',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            background: activeTab === 'insights' ? 'rgba(255,85,0,0.18)' : 'transparent',
            color: activeTab === 'insights' ? '#ea580c' : T.textMuted1
          }}
        >
          <Sparkles size={12} /> Trivia & Secrets
        </button>
        <button
          onClick={() => setActiveTab('ask')}
          style={{
            flex: 1, padding: '6px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '8px',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
            background: activeTab === 'ask' ? 'rgba(255,85,0,0.18)' : 'transparent',
            color: activeTab === 'ask' ? '#ea580c' : T.textMuted1
          }}
        >
          <MessageSquare size={12} /> Ask ViAM AI
        </button>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeTab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Quick Action Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              <button
                onClick={() => {
                  setActiveTab('ask');
                  handleSendPrompt(`Explain the ending and hidden meaning of "${movieTitle}" without spoiling if possible, or give theory!`);
                }}
                style={{
                  background: T.pillBg, border: `1px solid ${T.pillBorder}`,
                  color: '#d97706', borderRadius: '20px', padding: '5px 12px', fontSize: '11px',
                  fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                <Sparkles size={12} color="#d97706" />
                <span>Explain Ending</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('ask');
                  handleSendPrompt(`Who are the main cast members and what are some fun behind-the-scenes facts about "${movieTitle}"?`);
                }}
                style={{
                  background: T.pillBg, border: `1px solid ${T.pillBorder}`,
                  color: '#0284c7', borderRadius: '20px', padding: '5px 12px', fontSize: '11px',
                  fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                <Film size={12} color="#0284c7" />
                <span>Cast & Easter Eggs</span>
              </button>
              <button
                onClick={fetchTrivia}
                disabled={loadingTrivia}
                style={{
                  background: 'rgba(255,85,0,0.12)', border: '1px solid rgba(255,85,0,0.3)',
                  color: '#ff7733', borderRadius: '20px', padding: '5px 12px', fontSize: '11px',
                  fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px'
                }}
              >
                <RefreshCw size={11} className={loadingTrivia ? 'spin-animation' : ''} />
                <span>Refresh Trivia</span>
              </button>
            </div>

            {/* Trivia Box */}
            <div style={{
              background: T.surface2,
              border: `1px solid ${T.border1}`,
              borderRadius: '12px',
              padding: '14px',
              fontSize: '12px',
              lineHeight: '1.6',
              color: T.textPrimary
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: '#ff7733', fontWeight: '700' }}>
                <Zap size={14} />
                <span>Cinema Insight</span>
              </div>
              {loadingTrivia ? (
                <div style={{ color: T.textMuted2, fontStyle: 'italic', padding: '10px 0' }}>
                  Groq AI is digging up fascinating trivia about {movieTitle}...
                </div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {trivia || `✨ Christopher Nolan's films are renowned for practical effects! Ask ViAM AI any specific scene question to get instant insights.`}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ask' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: msg.isAI ? 'flex-start' : 'flex-end',
                  maxWidth: '88%',
                  background: msg.isAI ? T.surface2 : 'linear-gradient(135deg, #ff5500, #ea580c)',
                  border: msg.isAI ? `1px solid ${T.border1}` : 'none',
                  borderRadius: '12px',
                  padding: '10px 12px',
                  fontSize: '12px',
                  lineHeight: '1.5',
                  color: msg.isAI ? T.textPrimary : '#fff'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: '700', marginBottom: '3px', color: msg.isAI ? '#ff5500' : 'rgba(255,255,255,0.9)' }}>
                  {msg.sender}
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              </div>
            ))}
            {isAiTyping && (
              <div style={{
                alignSelf: 'flex-start',
                background: T.pillBg,
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '11px',
                color: '#ff5500',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span className="typing-dot" /> ViAM AI is thinking on Groq...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Chat Bar */}
      <div style={{
        padding: '10px 12px',
        background: T.surface1,
        borderTop: `1px solid ${T.borderDivider}`
      }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setActiveTab('ask');
            handleSendPrompt();
          }}
          style={{ display: 'flex', gap: '8px' }}
        >
          <input
            type="text"
            placeholder={`Ask about ${movieTitle}...`}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            style={{
              flex: 1,
              background: T.inputBg,
              border: `1px solid ${T.inputBorder}`,
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '12px',
              color: T.inputText,
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            style={{
              background: '#ff5500',
              border: 'none',
              borderRadius: '8px',
              padding: '0 12px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}
