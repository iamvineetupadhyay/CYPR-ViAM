import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sparkles, Volume2 } from 'lucide-react';
import { parseVoiceCommand } from '../utils/speechParser';
import { getT } from '../utils/themeTokens';

export default function VoiceAssistant({ onCommand, onSearchMovie, onGlobalVoiceAction, theme, showLabel = true }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const recognitionRef = useRef(null);

  const currentTheme = theme || (typeof document !== 'undefined' && document.body.classList.contains('light-theme') ? 'light' : 'dark');
  const T = getT(currentTheme);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[Voice Assistant] Speech Recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const text = event.results[current][0].transcript;
      setTranscript(text);

      if (event.results[current].isFinal) {
        handleFinalTranscript(text);
      }
    };

    recognition.onerror = (event) => {
      console.error('[Voice Assistant Error]', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const speakText = (text) => {
    if ('speechSynthesis' in window && text) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('[Speech Synthesis Warning]', e);
      }
    }
  };

  const handleFinalTranscript = (speechText) => {
    setFeedback(`Heard: "${speechText}"`);
    const parsed = parseVoiceCommand(speechText);

    if (parsed) {
      if (parsed.action === 'SWITCH_THEME') {
        const msg = `Switching to ${parsed.theme} theme mode!`;
        setFeedback(`🎨 ${msg}`);
        speakText(msg);
        onGlobalVoiceAction?.(parsed);
      } else if (parsed.action === 'NAVIGATE') {
        const pageNames = { chat: 'Messenger Chat', cinema: '4K Cinema', home: 'Home Hub', ai: 'ViAM AI', profile: 'User Profile' };
        const msg = `Opening ${pageNames[parsed.page] || parsed.page}...`;
        setFeedback(`🚀 ${msg}`);
        speakText(msg);
        onGlobalVoiceAction?.(parsed);
      } else if (parsed.action === 'SEARCH_AND_PLAY') {
        const msg = `Searching & playing ${parsed.query}!`;
        setFeedback(`🎬 ${msg}`);
        speakText(msg);
        if (onGlobalVoiceAction) {
          onGlobalVoiceAction(parsed);
        } else {
          onCommand?.(parsed);
        }
      } else if (parsed.action === 'PAUSE') {
        setFeedback('⏸️ Paused playback');
        speakText('Paused');
        onCommand?.(parsed);
      } else if (parsed.action === 'RESUME') {
        setFeedback('▶️ Resumed playback');
        speakText('Resumed playback');
        onCommand?.(parsed);
      } else if (parsed.action === 'SEEK_RELATIVE') {
        setFeedback(`⏩ Seeked ${parsed.seconds > 0 ? '+' : ''}${parsed.seconds}s`);
        speakText(`Seeking ${parsed.seconds} seconds`);
        onCommand?.(parsed);
      } else if (parsed.action === 'SET_VOLUME') {
        setFeedback(`🔊 Volume adjusted`);
        onCommand?.(parsed);
      } else if (parsed.action === 'SEARCH') {
        setFeedback(`🔍 Searching: "${parsed.query}"`);
        speakText(`Searching for ${parsed.query}`);
        onSearchMovie?.(parsed.query);
      } else if (parsed.action === 'AI_QUERY') {
        setFeedback(`✨ Asking ViAM AI...`);
        if (onGlobalVoiceAction) {
          onGlobalVoiceAction(parsed);
        } else {
          speakText(`I processed: ${parsed.query}`);
        }
      }
    } else {
      setFeedback(`Could not understand: "${speechText}"`);
    }

    setTimeout(() => {
      setFeedback('');
      setTranscript('');
    }, 4500);
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setFeedback('Listening... Speak now (e.g. "Play Interstellar", "Light Mode", or "Open Messenger")');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Error starting speech:', e);
      }
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={toggleListen}
        style={{
          height: '34px',
          padding: showLabel ? '0 12px' : '0',
          width: showLabel ? 'auto' : '34px',
          borderRadius: '20px',
          background: isListening ? 'rgba(239, 68, 68, 0.18)' : T.pillBg,
          border: isListening ? '1.5px solid #ef4444' : `1px solid ${T.pillBorder}`,
          color: isListening ? '#ef4444' : (T.isLight ? '#7e22ce' : '#c084fc'),
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '12px',
          fontWeight: '700',
          boxShadow: isListening
            ? '0 0 16px rgba(239, 68, 68, 0.5)'
            : (T.isLight ? '0 2px 6px rgba(0,0,0,0.05)' : 'none')
        }}
        title="ViAM AI Voice Assistant (Speak: 'Play <movie>', 'Open Cinema', 'Open AI')"
      >
        <Mic size={14} color={isListening ? '#ef4444' : (T.isLight ? '#7e22ce' : '#c084fc')} />
        {showLabel && <span>{isListening ? 'Listening...' : 'Voice AI'}</span>}
      </button>

      {/* Floating feedback notification toast */}
      {feedback && (
        <div style={{
          position: 'absolute', top: '42px', right: '0',
          background: T.surfaceModal,
          border: `1px solid ${T.border}`,
          borderRadius: '12px', padding: '7px 14px', whiteSpace: 'nowrap',
          color: T.textPrimary, fontSize: '12px', fontWeight: '700', zIndex: 9999,
          boxShadow: T.isLight ? '0 10px 25px rgba(0,0,0,0.12)' : '0 8px 30px rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Sparkles size={13} color={T.isLight ? '#7e22ce' : '#c084fc'} />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
