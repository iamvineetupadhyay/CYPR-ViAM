import React, { useState, useEffect, useRef } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize,
  Sparkles, Heart, Film
} from 'lucide-react';

export default function HeroStoryVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [isMuted, setIsMuted] = useState(true); // Default muted for browser autoplay permission
  const [videoSrc, setVideoSrc] = useState('/hero_story.mp4');

  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (v) {
      v.muted = isMuted;
      v.play().catch((err) => {
        console.warn('Autoplay prevented, trying fallback muted play:', err);
        v.muted = true;
        setIsMuted(true);
        v.play().catch(() => {});
      });
    }
  }, [videoSrc]);

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v && v.duration && !isNaN(v.duration)) setDuration(v.duration);
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (v) setCurrentTime(v.currentTime);
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (isPlaying) {
      v.pause();
      setIsPlaying(false);
    } else {
      v.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (v) {
      v.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    setCurrentTime(newTime);
    if (videoRef.current) videoRef.current.currentTime = newTime;
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    }
  };

  const formatTime = (sec) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        borderRadius: '24px',
        border: '1.5px solid rgba(255, 0, 85, 0.4)',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 50px rgba(255, 0, 85, 0.3)',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        background: '#070912'
      }}
    >
      {/* Widescreen Video Frame */}
      <div style={{
        width: '100%',
        height: '380px',
        background: 'radial-gradient(circle at center, #1a0826 0%, #070912 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Top Watermark Tag */}
        <div style={{
          position: 'absolute', top: '16px', left: '16px', zIndex: 30,
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'rgba(5, 6, 11, 0.85)', backdropFilter: 'blur(12px)',
          padding: '6px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.12)'
        }}>
          <Heart size={14} color="#ff0055" fill="#ff0055" />
          <span style={{ fontSize: '12px', fontWeight: '800', color: '#fff' }}>
            CYPR ViAM — Story Showcase
          </span>
        </div>

        {/* Unmute Audio Hint Button */}
        {isMuted && (
          <button
            onClick={toggleMute}
            style={{
              position: 'absolute', bottom: '16px', left: '16px', zIndex: 30,
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
              padding: '6px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            <VolumeX size={14} color="#ff0055" />
            <span>Click to Unmute Sound</span>
          </button>
        )}

        {/* Real Uploaded MP4 Video Stream */}
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onError={() => {
            if (videoSrc === '/hero_story.mp4') setVideoSrc('/A_widescreen_D_flat_vect.mp4');
          }}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onClick={togglePlay}
        />

        {/* Center Play/Pause Button Overlay (Visible on Pause) */}
        {!isPlaying && (
          <div
            onClick={togglePlay}
            style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#ff0055', boxShadow: '0 0 40px #ff0055',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', zIndex: 25
            }}
          >
            <Play size={32} fill="#fff" style={{ marginLeft: '4px' }} />
          </div>
        )}
      </div>

      {/* Clean Bottom Video Controls Bar */}
      <div style={{
        height: '52px', background: 'rgba(11, 14, 25, 0.96)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', alignItems: 'center', padding: '0 18px', gap: '14px',
        position: 'relative', zIndex: 30
      }}>
        <button
          onClick={togglePlay}
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff0055, #8000ff)',
            border: 'none', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            boxShadow: '0 0 14px rgba(255,0,85,0.4)', flexShrink: 0
          }}
        >
          {isPlaying ? <Pause size={15} /> : <Play size={15} fill="#fff" style={{ marginLeft: '2px' }} />}
        </button>

        <div
          onClick={handleSeek}
          style={{
            flex: 1, height: '5px', background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '3px', cursor: 'pointer', position: 'relative'
          }}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, height: '100%',
            width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            background: 'linear-gradient(90deg, #ff0055, #8000ff, #00f5d4)',
            borderRadius: '3px'
          }} />
        </div>

        <div style={{ fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace', flexShrink: 0 }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <button onClick={toggleMute} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
          {isMuted ? <VolumeX size={16} color="#ff0055" /> : <Volume2 size={16} color="#22c55e" />}
        </button>
        <button onClick={toggleFullscreen} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <Maximize size={16} />
        </button>
      </div>
    </div>
  );
}
