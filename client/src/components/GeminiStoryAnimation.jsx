import React, { useState, useEffect } from 'react';
import {
  Sparkles, Heart, Globe, Video, MessageSquare, Film, Play, Pause,
  ChevronRight, ChevronLeft, ShieldCheck, CheckCircle2, Link2, Copy, Send
} from 'lucide-react';

export default function GeminiStoryAnimation() {
  const [activeStep, setActiveStep] = useState(0); // 0 to 4
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      id: 0,
      title: '1. The Long Distance',
      icon: Globe,
      subtitle: 'Miles apart, longing for a movie date...'
    },
    {
      id: 1,
      title: '2. Asking Gemini AI',
      icon: Sparkles,
      subtitle: 'Google Gemini AI recommends CYPR ViAM ✨'
    },
    {
      id: 2,
      title: '3. Instant E2EE Lounge',
      icon: ShieldCheck,
      subtitle: 'Entering private 256-bit encrypted room'
    },
    {
      id: 3,
      title: '4. HD WebRTC Video & Chat',
      icon: Video,
      subtitle: 'Face-to-face video call & love reactions'
    },
    {
      id: 4,
      title: '5. Synchronized 4K Cinema',
      icon: Film,
      subtitle: 'Pasting movie link & 0ms frame sync playback'
    }
  ];

  // Auto advance scenes when playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  return (
    <div style={{
      width: '100%', maxWidth: '1080px', margin: '0 auto',
      background: 'rgba(12, 15, 26, 0.9)',
      backdropFilter: 'blur(24px)',
      border: '1.5px solid rgba(255, 255, 255, 0.12)',
      borderRadius: '28px',
      padding: '32px 24px',
      boxShadow: '0 30px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(255, 0, 85, 0.12)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Header Title */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px', borderRadius: '20px',
          background: 'rgba(255, 0, 85, 0.1)', border: '1px solid rgba(255, 0, 85, 0.3)',
          color: '#ff0055', fontSize: '12px', fontWeight: '700', marginBottom: '10px'
        }}>
          <Sparkles size={14} />
          <span>Google Gemini AI Recommended Couple Story</span>
        </div>
        <h3 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', letterSpacing: '-0.5px' }}>
          How Long Distance Couples Connect on CYPR ViAM
        </h3>
      </div>

      {/* Step Navigator Chips */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto',
        paddingBottom: '12px', marginBottom: '24px',
        justifyContent: 'center'
      }}>
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = activeStep === idx;
          return (
            <button
              key={s.id}
              onClick={() => { setActiveStep(idx); setIsPlaying(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: '16px',
                border: '1.5px solid',
                borderColor: isActive ? '#ff0055' : 'rgba(255,255,255,0.08)',
                background: isActive ? 'rgba(255,0,85,0.15)' : 'rgba(255,255,255,0.03)',
                color: isActive ? '#ff0055' : 'var(--text-muted)',
                fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                transition: 'all 0.25s', whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} />
              <span>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Animated Display Window */}
      <div style={{
        background: 'rgba(7, 9, 16, 0.95)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px',
        height: '420px',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Window Top Controls */}
        <div style={{
          height: '40px', background: 'rgba(255,255,255,0.03)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px'
        }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            {steps[activeStep].subtitle}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-sub)', fontFamily: 'monospace' }}>
            SCENE {activeStep + 1}/5
          </div>
        </div>

        {/* Scene 1: The Long Distance Globe */}
        {activeStep === 0 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '24px',
            position: 'relative', background: 'radial-gradient(circle at center, rgba(128,0,255,0.15) 0%, transparent 70%)'
          }}>
            {/* Animated Globe & Connection Arc */}
            <div style={{ position: 'relative', width: '220px', height: '140px', marginBottom: '20px' }}>
              <div style={{
                position: 'absolute', left: '20px', top: '40px',
                background: 'rgba(255,0,85,0.2)', border: '1.5px solid #ff0055',
                padding: '8px 14px', borderRadius: '14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>🗽 New York</div>
                <div style={{ fontSize: '10px', color: '#ff0055', fontWeight: '700' }}>Ananya</div>
              </div>

              {/* Pulsing Arc Curve */}
              <svg width="220" height="140" style={{ position: 'absolute', inset: 0 }}>
                <path d="M 60 60 Q 110 0 160 60" fill="none" stroke="#ff0055" strokeWidth="2" strokeDasharray="4 4" />
                <circle cx="110" cy="30" r="4" fill="#00f5d4">
                  <animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" />
                </circle>
              </svg>

              <div style={{
                position: 'absolute', right: '20px', top: '40px',
                background: 'rgba(128,0,255,0.2)', border: '1.5px solid #8000ff',
                padding: '8px 14px', borderRadius: '14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>🇮🇳 Mumbai</div>
                <div style={{ fontSize: '10px', color: '#8000ff', fontWeight: '700' }}>Aarav</div>
              </div>
            </div>

            {/* Chat Dialogues */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '400px' }}>
              <div style={{
                alignSelf: 'flex-start', background: 'rgba(255,0,85,0.12)',
                border: '1px solid rgba(255,0,85,0.25)', padding: '10px 14px',
                borderRadius: '14px 14px 14px 2px', fontSize: '13px', color: '#fff'
              }}>
                Ananya: *"I miss our movie dates so much... 🥺 Can we watch something together?"*
              </div>
              <div style={{
                alignSelf: 'flex-end', background: 'rgba(128,0,255,0.12)',
                border: '1px solid rgba(128,0,255,0.25)', padding: '10px 14px',
                borderRadius: '14px 14px 2px 14px', fontSize: '13px', color: '#fff'
              }}>
                Aarav: *"Me too! But how without lag? Let me ask Google Gemini AI! ✨"*
              </div>
            </div>
          </div>
        )}

        {/* Scene 2: Google Gemini AI Recommendation */}
        {activeStep === 1 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '24px',
            background: 'radial-gradient(circle at center, rgba(0,245,212,0.1) 0%, transparent 70%)'
          }}>
            {/* Gemini Search Bar */}
            <div style={{
              width: '100%', maxWidth: '520px',
              background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(0,245,212,0.4)',
              borderRadius: '16px', padding: '14px 18px', marginBottom: '20px',
              boxShadow: '0 0 25px rgba(0,245,212,0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Sparkles size={18} color="#00f5d4" />
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#00f5d4' }}>Google Gemini AI</span>
              </div>
              <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600', fontFamily: 'monospace' }}>
                "Best app for long-distance couples to co-watch movies with HD video call & zero lag?"
              </div>
            </div>

            {/* Gemini AI Response Card */}
            <div style={{
              width: '100%', maxWidth: '520px',
              background: 'rgba(14, 18, 30, 0.9)', border: '1.5px solid rgba(255, 0, 85, 0.4)',
              borderRadius: '18px', padding: '18px 20px', position: 'relative'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle2 size={16} color="#10b981" />
                <span style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>Recommended: CYPR ViAM</span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                ✨ 100% Free • 256-Bit AES-GCM Encrypted • Zero-Lag Frame Synchronization • Built-in HD WebRTC Video &amp; Voice Call.
              </p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <span style={{ fontSize: '11px', background: 'rgba(255,0,85,0.15)', color: '#ff0055', padding: '3px 10px', borderRadius: '10px', fontWeight: '700' }}>
                  🚀 Open CYPR ViAM Lounge
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Scene 3: Entering Private E2EE Room */}
        {activeStep === 2 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '24px',
            background: 'radial-gradient(circle at center, rgba(16,185,129,0.1) 0%, transparent 70%)'
          }}>
            <div style={{
              width: '100%', maxWidth: '420px',
              background: 'rgba(14, 18, 30, 0.95)', border: '1.5px solid rgba(16,185,129,0.4)',
              borderRadius: '20px', padding: '24px', textAlign: 'center',
              boxShadow: '0 0 30px rgba(16,185,129,0.2)'
            }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(16,185,129,0.15)', color: '#10b981',
                padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
                fontWeight: '800', marginBottom: '14px'
              }}>
                <ShieldCheck size={14} />
                <span>🔒 E2EE Active (AES-GCM-256)</span>
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>
                Couple Lounge Connected: ROOM #LOVE24
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Zero-knowledge client encrypted session. Aarav &amp; Ananya are in room.
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" alt="Aarav" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #8000ff' }} />
                  <div style={{ fontSize: '11px', color: '#fff', fontWeight: '700', marginTop: '4px' }}>Aarav 👨</div>
                </div>
                <div style={{ fontSize: '20px', alignSelf: 'center' }}>❤️</div>
                <div style={{ textAlign: 'center' }}>
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Ananya" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #ff0055' }} />
                  <div style={{ fontSize: '11px', color: '#fff', fontWeight: '700', marginTop: '4px' }}>Ananya 👩</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scene 4: HD WebRTC Video & Encrypted Chat */}
        {activeStep === 3 && (
          <div style={{
            flex: 1, display: 'grid', gridTemplateColumns: '1fr 240px', gap: '12px', padding: '16px'
          }}>
            {/* Video Call PIP View */}
            <div style={{
              background: '#000', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
              position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80"
                alt="Ananya WebRTC Video"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute', bottom: '12px', left: '12px',
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                padding: '4px 10px', borderRadius: '10px', color: '#fff', fontSize: '11px', fontWeight: '700'
              }}>
                Ananya (1080p HD Video Call) 💖
              </div>

              {/* Small PIP for Aarav */}
              <div style={{
                position: 'absolute', top: '12px', right: '12px', width: '80px', height: '80px',
                borderRadius: '14px', overflow: 'hidden', border: '2px solid #8000ff'
              }}>
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" alt="Aarav" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
              padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '800', color: '#ff0055', textTransform: 'uppercase' }}>Encrypted Chat</div>
              <div style={{ background: 'rgba(255,0,85,0.15)', padding: '8px', borderRadius: '10px', fontSize: '11px', color: '#fff' }}>
                Ananya: "OMG I can see &amp; hear you so clearly! 😍"
              </div>
              <div style={{ background: 'rgba(128,0,255,0.15)', padding: '8px', borderRadius: '10px', fontSize: '11px', color: '#fff' }}>
                Aarav: "Yay! Let's paste the movie link now 🍿"
              </div>
            </div>
          </div>
        )}

        {/* Scene 5: Pasting Movie Link & Synchronized 4K Cinema */}
        {activeStep === 4 && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', padding: '16px'
          }}>
            {/* Link Paste Bar */}
            <div style={{
              display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,0,85,0.4)', borderRadius: '12px',
              padding: '8px 12px', marginBottom: '12px', alignItems: 'center'
            }}>
              <Link2 size={16} color="#ff0055" />
              <input
                type="text"
                readOnly
                value="https://youtube.com/watch?v=interstellar_4k_cinema"
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
              />
              <span style={{ background: '#ff0055', color: '#fff', fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '8px' }}>
                Pasted &amp; Synced ✓
              </span>
            </div>

            {/* Simulated 4K Cinema Player */}
            <div style={{
              flex: 1, background: 'radial-gradient(circle at center, rgba(255,0,85,0.2) 0%, #000 80%)',
              borderRadius: '16px', position: 'relative', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>🎬🍿</div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                  Interstellar (4K Frame-Synced)
                </div>
                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', marginTop: '4px' }}>
                  ▶ 0ms Latency Sync • Aarav &amp; Ananya Watching Together
                </div>
              </div>

              {/* Progress timeline */}
              <div style={{
                position: 'absolute', bottom: '12px', left: '16px', right: '16px',
                height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px'
              }}>
                <div style={{ width: '65%', height: '100%', background: '#ff0055', borderRadius: '2px' }} />
              </div>
            </div>
          </div>
        )}

        {/* Animation Play / Pause / Step Controls Bar */}
        <div style={{
          height: '48px', background: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px'
        }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,0,85,0.15)', border: '1px solid rgba(255,0,85,0.3)',
              color: '#ff0055', borderRadius: '12px', padding: '6px 12px',
              fontSize: '12px', fontWeight: '700', cursor: 'pointer'
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} fill="#ff0055" />}
            <span>{isPlaying ? 'Pause Auto-Play' : 'Play Story'}</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setActiveStep((prev) => (prev > 0 ? prev - 1 : steps.length - 1)); setIsPlaying(false); }}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => { setActiveStep((prev) => (prev + 1) % steps.length); setIsPlaying(false); }}
              style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
