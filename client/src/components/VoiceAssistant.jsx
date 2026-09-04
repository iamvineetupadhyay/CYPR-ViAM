import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { parseVoiceCommand } from '../utils/speechParser';

export default function VoiceAssistant({ onCommand, onSearchMovie }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const recognitionRef = useRef(null);

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

  const handleFinalTranscript = (speechText) => {
    setFeedback(`Heard: "${speechText}"`);
    const parsed = parseVoiceCommand(speechText);

    if (parsed) {
      if (parsed.action === 'SEARCH_AND_PLAY') {
        setFeedback(`🎬 Playing: "${parsed.query}"`);
        onCommand(parsed);
      } else if (parsed.action === 'PAUSE') {
        setFeedback('⏸️ Paused playback');
        onCommand(parsed);
      } else if (parsed.action === 'RESUME') {
        setFeedback('▶️ Resumed playback');
        onCommand(parsed);
      } else if (parsed.action === 'SEEK_RELATIVE') {
        setFeedback(`⏩ Seeked ${parsed.seconds > 0 ? '+' : ''}${parsed.seconds}s`);
        onCommand(parsed);
      } else if (parsed.action === 'SET_VOLUME') {
        setFeedback(`🔊 Volume set`);
        onCommand(parsed);
      } else if (parsed.action === 'SEARCH') {
        setFeedback(`🔍 Searching: "${parsed.query}"`);
        onSearchMovie(parsed.query);
      }
    } else {
      setFeedback(`Could not understand: "${speechText}"`);
    }

    setTimeout(() => {
      setFeedback('');
      setTranscript('');
    }, 4000);
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
      setFeedback('Listening... Speak now (e.g. "Play Interstellar" or "Pause")');
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
          width: '36px', height: '36px', borderRadius: '50%',
          background: isListening ? '#ff0055' : 'rgba(255, 255, 255, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          color: isListening ? '#fff' : 'rgba(255, 255, 255, 0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s',
          boxShadow: isListening ? '0 0 20px rgba(255,0,85,0.7)' : 'none'
        }}
        title="Voice Assistant: Speak to search & play movies"
      >
        <Mic size={16} />
      </button>

      {/* Floating feedback notification toast */}
      {feedback && (
        <div style={{
          position: 'absolute', top: '44px', right: '0',
          background: 'rgba(14, 18, 30, 0.95)', border: '1px solid rgba(255, 0, 85, 0.4)',
          borderRadius: '12px', padding: '6px 14px', whiteSpace: 'nowrap',
          color: '#fff', fontSize: '11.5px', fontWeight: '700', zIndex: 999,
          boxShadow: '0 8px 30px rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Sparkles size={12} color="#ff0055" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
