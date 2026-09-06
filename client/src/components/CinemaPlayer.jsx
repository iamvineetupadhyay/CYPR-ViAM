import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Film,
  ShieldCheck,
  Tv,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SkipForward,
  Layers,
  Settings,
  Subtitles,
  Upload,
  Gauge,
  Sliders,
  Check,
  FileText,
  X,
  Volume1,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Link2,
  Server,
  Zap
} from 'lucide-react';
import Hls from 'hls.js';
import { extractYouTubeId } from '../utils/movieSources';
import { encryptPayload, decryptPayload } from '../utils/cryptoUtils';

function parseTimestamp(timeStr) {
  if (!timeStr) return NaN;
  const parts = timeStr.replace(',', '.').trim().split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  }
  return NaN;
}

function parseSRT(text) {
  if (!text) return [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\n+/);
  const cues = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      const timeLineIndex = lines.findIndex(l => l.includes('-->'));
      if (timeLineIndex !== -1) {
        const [startStr, endStr] = lines[timeLineIndex].split('-->').map(s => s.trim());
        const start = parseTimestamp(startStr);
        const end = parseTimestamp(endStr);
        const textLines = lines.slice(timeLineIndex + 1).join('\n').replace(/<[^>]+>/g, '').trim();
        if (!isNaN(start) && !isNaN(end) && textLines) {
          cues.push({ start, end, text: textLines });
        }
      }
    }
  }
  return cues;
}

export default function CinemaPlayer({
  mediaState,
  socket,
  currentUser,
  roomId,
  onOpenSourcePicker,
  onMediaChange,
  children // Floating Duo Webcams & Reactions rendered INSIDE theater so they survive fullscreen!
}) {
  const [isPlaying, setIsPlaying] = useState(mediaState.isPlaying || false);
  const [currentTime, setCurrentTime] = useState(mediaState.currentTime || 0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Settings, Subtitles, Quality, Audio Boost & Server Dropdown States
  const [isSubtitleDrawerOpen, setIsSubtitleDrawerOpen] = useState(false);
  const [isSettingsDrawerOpen, setIsSettingsDrawerOpen] = useState(false);
  const [isServerDropdownOpen, setIsServerDropdownOpen] = useState(false);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [subtitleCues, setSubtitleCues] = useState([]);
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');
  const [subtitleOffset, setSubtitleOffset] = useState(0); // in seconds
  const [subColor, setSubColor] = useState('white'); // 'white' | 'yellow'
  const [subSize, setSubSize] = useState('medium'); // 'small' | 'medium' | 'large'
  const [subFileName, setSubFileName] = useState('');

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioBoost, setAudioBoost] = useState(1); // 1 = 100%, 1.5 = 150%, 2 = 200%
  const [selectedQuality, setSelectedQuality] = useState('Auto');
  const [availableQualities, setAvailableQualities] = useState(['Auto', '1080p', '720p', '480p']);

  // Sync incoming mediaState prop changes from room
  useEffect(() => {
    if (!mediaState) return;
    if (mediaState.isPlaying !== undefined) {
      setIsPlaying(mediaState.isPlaying);
    }
    if (typeof mediaState.currentTime === 'number' && !isInternalUpdateRef.current) {
      setCurrentTime(mediaState.currentTime);
      if (videoRef.current && Math.abs((videoRef.current.currentTime || 0) - mediaState.currentTime) > 1.5) {
        videoRef.current.currentTime = mediaState.currentTime;
      } else if (ytPlayerRef.current?.seekTo && Math.abs((ytPlayerRef.current.getCurrentTime() || 0) - mediaState.currentTime) > 1.5) {
        ytPlayerRef.current.seekTo(mediaState.currentTime, true);
      }
    }
  }, [mediaState?.url, mediaState?.isPlaying, mediaState?.currentTime]);

  // Real-time smooth timer loop for YouTube and Video time sync on custom scrubber
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
        const cur = ytPlayerRef.current.getCurrentTime() || 0;
        const dur = ytPlayerRef.current.getDuration() || 0;
        setCurrentTime(cur);
        if (dur && dur > 0) setDuration(dur);
      } else if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime || 0);
        if (videoRef.current.duration) setDuration(videoRef.current.duration);
      }
    }, 250);

    return () => clearInterval(timer);
  }, [isPlaying, mediaState.sourceType]);

  // 404 / Playback Error Handling State
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [customLinkInput, setCustomLinkInput] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  useEffect(() => {
    setHasPlaybackError(false);
    setErrorDetails('');
    setIsReporting(false);
  }, [mediaState.url]);

  const reportStreamError = useCallback((customReason = 'Server 404 / Offline') => {
    setHasPlaybackError(true);
    setErrorDetails(customReason);
    setIsReporting(true);
    socket?.emit('player-playback-error', {
      roomId,
      movieTitle: mediaState.title,
      url: mediaState.url,
      reason: customReason
    });
    setTimeout(() => setIsReporting(false), 2500);
  }, [socket, roomId, mediaState.title, mediaState.url]);

  const handleCustomLinkPlay = (e) => {
    e?.preventDefault();
    const link = customLinkInput.trim();
    if (!link) return;
    const isYt = link.includes('youtube.com') || link.includes('youtu.be');
    const newMedia = {
      sourceType: isYt ? 'youtube' : 'direct',
      url: link,
      title: isYt ? '▶️ YouTube Stream' : '⚡ Custom Stream: ' + link,
      currentTime: 0,
      isPlaying: true
    };
    onMediaChange?.(newMedia);
    socket?.emit('media-change', newMedia);
    setHasPlaybackError(false);
    setCustomLinkInput('');
  };

  const hlsRef = useRef(null);
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);
  const activityTimeoutRef = useRef(null);
  const hideControlsTimerRef = useRef(null);

  const emitEncryptedSync = async (event, data) => {
    if (!socket) return;
    const encrypted = await encryptPayload(data, roomId);
    socket.emit(event, encrypted);
  };

  const handleUserActivity = () => {
    setShowControls(true);
    if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    if (isPlaying || isFullscreen) {
      activityTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  // Global Cinema Keyboard Shortcuts (Space, Left/Right, F, M)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handleSeekDelta(-10);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleSeekDelta(10);
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleTheaterFullscreen();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, isMuted, volume]);

  // Subtitle synchronization loop
  useEffect(() => {
    if (!subtitlesEnabled || subtitleCues.length === 0) {
      setCurrentSubtitleText('');
      return;
    }

    const interval = setInterval(() => {
      let time = 0;
      if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
        time = ytPlayerRef.current.getCurrentTime();
      } else if (videoRef.current) {
        time = videoRef.current.currentTime;
      } else {
        time = currentTime;
      }

      const adjustedTime = time + subtitleOffset;
      const activeCue = subtitleCues.find(c => adjustedTime >= c.start && adjustedTime <= c.end);
      setCurrentSubtitleText(activeCue ? activeCue.text : '');
    }, 200);

    return () => clearInterval(interval);
  }, [subtitlesEnabled, subtitleCues, subtitleOffset, currentTime, mediaState.sourceType]);

  // HLS stream support
  useEffect(() => {
    if ((mediaState.sourceType === 'direct' || mediaState.sourceType === 'local') && mediaState.url?.includes('.m3u8')) {
      if (Hls.isSupported() && videoRef.current) {
        if (hlsRef.current) hlsRef.current.destroy();
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(mediaState.url);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
          console.log('[HLS Engine] Manifest Parsed. Qualities detected:', data.levels.length);
          const levels = data.levels.map(l => `${l.height}p`);
          setAvailableQualities(['Auto', ...new Set(levels)]);
          if (isPlaying) {
            videoRef.current.play().catch(() => { });
          }
        });
        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
          // Lock to primary audio track (index 0) to prevent dual-audio echoing
          if (hls.audioTracks && hls.audioTracks.length > 1) {
            hls.audioTrack = 0;
          }
        });
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('[HLS Network Error] Attempting recovery...');
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('[HLS Media Error] Attempting recovery...');
                hls.recoverMediaError();
                break;
              default:
                console.error('[HLS Fatal Error]', data);
                hls.destroy();
                break;
            }
          }
        });
        hlsRef.current = hls;
      } else if (videoRef.current && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = mediaState.url;
      }
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [mediaState.url, mediaState.sourceType]);

  // Auto-load subtitles when provided by direct resolver
  useEffect(() => {
    if (mediaState.subtitlesUrl) {
      fetch(mediaState.subtitlesUrl)
        .then(r => r.text())
        .then(text => {
          const cues = parseSRT(text);
          if (cues && cues.length > 0) {
            setSubtitleCues(cues);
            setSubtitlesEnabled(true);
            setSubFileName('English Subtitles (Auto-Loaded)');
          }
        })
        .catch(err => console.warn('Could not auto-load subtitles:', err));
    }
  }, [mediaState.subtitlesUrl]);

  const handleSubtitleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSubFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const cues = parseSRT(text);
      setSubtitleCues(cues);
      setSubtitlesEnabled(true);
    };
    reader.readAsText(file);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    } else if (ytPlayerRef.current?.setPlaybackRate) {
      ytPlayerRef.current.setPlaybackRate(speed);
    }
  };

  const handleAudioBoostChange = (multiplier) => {
    setAudioBoost(multiplier);

    // 1. Direct HTML5 / HLS Video Web Audio API GainNode Amplification
    if (videoRef.current) {
      try {
        if (!audioCtxRef.current) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const ctx = new AudioContext();
          const source = ctx.createMediaElementSource(videoRef.current);
          const gainNode = ctx.createGain();
          source.connect(gainNode);
          gainNode.connect(ctx.destination);
          audioCtxRef.current = ctx;
          gainNodeRef.current = gainNode;
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.setTargetAtTime(multiplier, audioCtxRef.current.currentTime, 0.05);
        }
      } catch (err) {
        console.warn('[WebAudio API Boost Note]:', err);
        if (gainNodeRef.current) {
          try { gainNodeRef.current.gain.value = multiplier; } catch (e) { }
        }
      }
    }

    // 2. YouTube Stream Volume Boost (Max 100)
    if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.setVolume) {
      const boostedVolume = Math.min(100, Math.round(volume * 100 * multiplier));
      ytPlayerRef.current.setVolume(boostedVolume);
    }
  };

  const theaterRef = useRef(null);
  const videoRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);
  const isInternalUpdateRef = useRef(false);

  const ytVideoId = mediaState.sourceType === 'youtube' ? extractYouTubeId(mediaState.url) : null;

  // --- Anti-Redirect & Anti-Popup Guard ---
  useEffect(() => {
    // Block window.open popups initiated from embed frames
    const originalOpen = window.open;
    window.open = function (...args) {
      console.warn('[CYPR Anti-Redirect Shield] Blocked unauthorized window.open popup attempt:', args[0]);
      return null;
    };

    const handleBeforeUnload = (e) => {
      if (mediaState.sourceType === 'embed') {
        e.preventDefault();
        e.returnValue = 'CYPR ViAM: Unwanted redirect blocked!';
        return 'CYPR ViAM: Unwanted redirect blocked!';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [mediaState.sourceType]);

  // --- Fullscreen Change Detection ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // --- YouTube IFrame API Initialization ---
  useEffect(() => {
    if (mediaState.sourceType !== 'youtube' || !ytVideoId) {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch (e) { }
        ytPlayerRef.current = null;
      }
      return;
    }

    let isSubscribed = true;

    const initYt = () => {
      if (!isSubscribed || !ytContainerRef.current) return;
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch (e) { }
        ytPlayerRef.current = null;
      }

      // Create an inner div inside container so YouTube SDK does not mutate the React ref node
      ytContainerRef.current.innerHTML = '<div id="yt-player-slot" style="width:100%;height:100%;"></div>';

      try {
        ytPlayerRef.current = new window.YT.Player('yt-player-slot', {
          videoId: ytVideoId,
          playerVars: {
            autoplay: mediaState.isPlaying ? 1 : 0,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1,
            start: Math.floor(mediaState.currentTime || 0)
          },
          events: {
            onReady: (event) => {
              if (!isSubscribed) return;
              event.target.setVolume(volume * 100);
              setDuration(event.target.getDuration() || 0);
            },
            onError: (event) => {
              console.warn('[YouTube Player Error Event]', event.data);
              reportStreamError('YouTube Video Unavailable / 404');
            },
            onStateChange: (event) => {
              if (!isSubscribed || isInternalUpdateRef.current) return;

              if (event.data === 1) {
                setIsPlaying(true);
                const t = event.target.getCurrentTime() || 0;
                socket?.emit('media-play', { currentTime: t });
              } else if (event.data === 2) {
                setIsPlaying(false);
                const t = event.target.getCurrentTime() || 0;
                socket?.emit('media-pause', { currentTime: t });
              }
            }
          }
        });
      } catch (err) {
        console.warn('[YT Init Exception]:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initYt();
    } else {
      window.onYouTubeIframeAPIReady = initYt;
    }

    return () => {
      isSubscribed = false;
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch (e) { }
        ytPlayerRef.current = null;
      }
      if (ytContainerRef.current) {
        ytContainerRef.current.innerHTML = '';
      }
    };
  }, [mediaState.sourceType, ytVideoId, socket, roomId]);

  // --- Direct HTML5 Video Sync Listener ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video || mediaState.sourceType === 'youtube' || mediaState.sourceType === 'embed') return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      if (mediaState.currentTime) {
        video.currentTime = mediaState.currentTime;
      }
      if (mediaState.isPlaying) {
        video.play().catch(() => { });
      }
    };

    const handlePlay = () => {
      if (isInternalUpdateRef.current) return;
      setIsPlaying(true);
      socket?.emit('media-play', { currentTime: video.currentTime || 0 });
    };

    const handlePause = () => {
      if (isInternalUpdateRef.current) return;
      setIsPlaying(false);
      socket?.emit('media-pause', { currentTime: video.currentTime || 0 });
    };

    const handleSeeked = () => {
      if (isInternalUpdateRef.current) return;
      socket?.emit('media-seek', { currentTime: video.currentTime || 0 });
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [mediaState.sourceType, socket, mediaState.currentTime, mediaState.isPlaying]);

  // --- Incoming Sync Events from Peer via Socket ---
  useEffect(() => {
    if (!socket) return;

    const onMediaPlayed = (data) => {
      const t = typeof data?.currentTime === 'number' ? data.currentTime : 0;
      isInternalUpdateRef.current = true;
      setIsPlaying(true);
      setCurrentTime(t);

      if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(t, true);
        ytPlayerRef.current.playVideo();
      } else if (videoRef.current) {
        videoRef.current.currentTime = t;
        videoRef.current.play().catch(() => { });
      }

      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 400);
    };

    const onMediaPaused = (data) => {
      const t = typeof data?.currentTime === 'number' ? data.currentTime : undefined;
      isInternalUpdateRef.current = true;
      setIsPlaying(false);
      if (t !== undefined) setCurrentTime(t);

      if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.pauseVideo) {
        if (t !== undefined) ytPlayerRef.current.seekTo(t, true);
        ytPlayerRef.current.pauseVideo();
      } else if (videoRef.current) {
        if (t !== undefined) videoRef.current.currentTime = t;
        videoRef.current.pause();
      }

      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 400);
    };

    const onMediaSeeked = (data) => {
      const t = typeof data?.currentTime === 'number' ? data.currentTime : 0;
      isInternalUpdateRef.current = true;
      setCurrentTime(t);

      if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.seekTo) {
        ytPlayerRef.current.seekTo(t, true);
      } else if (videoRef.current) {
        videoRef.current.currentTime = t;
      }

      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 400);
    };

    const onMediaHeartbeat = (data) => {
      if (isInternalUpdateRef.current) return;
      const t = typeof data?.currentTime === 'number' ? data.currentTime : 0;
      let localT = 0;
      if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
        localT = ytPlayerRef.current.getCurrentTime() || 0;
      } else if (videoRef.current) {
        localT = videoRef.current.currentTime || 0;
      }

      if (Math.abs(localT - t) > 2.0) {
        console.log('[Cinema Sync Heartbeat] Resyncing drift:', localT, '->', t);
        isInternalUpdateRef.current = true;
        setCurrentTime(t);
        if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.seekTo) {
          ytPlayerRef.current.seekTo(t, true);
        } else if (videoRef.current) {
          videoRef.current.currentTime = t;
        }
        setTimeout(() => { isInternalUpdateRef.current = false; }, 400);
      }
    };

    socket.on('media-played', onMediaPlayed);
    socket.on('media-paused', onMediaPaused);
    socket.on('media-seeked', onMediaSeeked);
    socket.on('media-heartbeat', onMediaHeartbeat);

    return () => {
      socket.off('media-played', onMediaPlayed);
      socket.off('media-paused', onMediaPaused);
      socket.off('media-seeked', onMediaSeeked);
      socket.off('media-heartbeat', onMediaHeartbeat);
    };
  }, [socket, mediaState.sourceType]);

  // Periodic heartbeat from active player to keep both sides locked in 0ms drift
  useEffect(() => {
    if (!isPlaying || !socket) return;
    const heartbeatInterval = setInterval(() => {
      let t = 0;
      if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
        t = ytPlayerRef.current.getCurrentTime() || 0;
      } else if (videoRef.current) {
        t = videoRef.current.currentTime || 0;
      }
      if (t > 0) {
        socket.emit('media-heartbeat', { currentTime: t, isPlaying: true });
      }
    }, 4000);
    return () => clearInterval(heartbeatInterval);
  }, [isPlaying, mediaState.sourceType, socket]);

  // User Play/Pause Controls
  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    let t = currentTime;
    if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.getCurrentTime) {
      t = ytPlayerRef.current.getCurrentTime();
      if (nextState) {
        ytPlayerRef.current.playVideo();
        socket?.emit('media-play', { currentTime: t });
      } else {
        ytPlayerRef.current.pauseVideo();
        socket?.emit('media-pause', { currentTime: t });
      }
    } else if (videoRef.current) {
      t = videoRef.current.currentTime;
      if (nextState) {
        videoRef.current.play().catch(() => { });
        socket?.emit('media-play', { currentTime: t });
      } else {
        videoRef.current.pause();
        socket?.emit('media-pause', { currentTime: t });
      }
    }
  };

  const handleSeekDelta = (deltaSeconds) => {
    let t = currentTime + deltaSeconds;
    if (t < 0) t = 0;
    if (duration > 0 && t > duration) t = duration;

    setCurrentTime(t);
    if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.seekTo) {
      ytPlayerRef.current.seekTo(t, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = t;
    }
    socket?.emit('media-seek', { currentTime: t });
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (mediaState.sourceType === 'youtube' && ytPlayerRef.current) {
      if (nextMute) ytPlayerRef.current.mute();
      else ytPlayerRef.current.unMute();
    } else if (videoRef.current) {
      videoRef.current.muted = nextMute;
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setIsMuted(v === 0);
    if (mediaState.sourceType === 'youtube' && ytPlayerRef.current?.setVolume) {
      ytPlayerRef.current.setVolume(v * 100);
    } else if (videoRef.current) {
      videoRef.current.volume = v;
    }
  };

  // Fullscreen toggle on theater container (so Floating Cams stay on top!)
  const toggleTheaterFullscreen = () => {
    if (!theaterRef.current) return;

    if (!document.fullscreenElement) {
      theaterRef.current.requestFullscreen().catch((err) => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen error:', err);
      });
    }
  };

  const formatTime = (secs) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Auto-hide controls in fullscreen after mouse is idle
  const handleMouseMove = () => {
    handleUserActivity();
  };

  // --- Web Series & TV Show Episode Switcher Logic ---
  const isSeries = mediaState.isSeries || /season|series|episode|s\d+\s*e\d+/i.test(mediaState.title || '');
  const currentSeason = mediaState.season || 1;
  const currentEpisode = mediaState.episode || 1;
  const totalEpisodes = mediaState.totalEpisodes || 12;

  const handleSwitchEpisode = (newEpisode) => {
    if (newEpisode < 1) return;
    const targetSeason = currentSeason;
    const imdbId = mediaState.imdbId;

    let newServers = [];
    if (imdbId) {
      newServers = [
        { name: 'Server 1 (VidSrc)', url: `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${targetSeason}&episode=${newEpisode}` },
        { name: 'Server 2 (2Embed)', url: `https://2embed.cc/embed/tv/${imdbId}&s=${targetSeason}&e=${newEpisode}` },
        { name: 'Server 3 (VidSrc Multi)', url: `https://vidsrc.to/embed/tv/${imdbId}/${targetSeason}/${newEpisode}` },
        { name: 'Server 4 (VidSrc PM)', url: `https://vidsrc.pm/embed/tv?imdb=${imdbId}&season=${targetSeason}&episode=${newEpisode}` }
      ];
    } else {
      newServers = mediaState.servers || [];
    }

    const cleanTitle = (mediaState.title || 'Series').replace(/\s*-\s*S\d+\s*E\d+/i, '').replace(/\s*\(.*?\)/, '');
    const updated = {
      ...mediaState,
      isSeries: true,
      season: targetSeason,
      episode: newEpisode,
      url: newServers[0]?.url || mediaState.url,
      servers: newServers,
      title: `${cleanTitle} - S${targetSeason} E${newEpisode}`
    };
    onMediaChange?.(updated);
    socket?.emit('media-change', updated);
  };

  const handleSwitchSeason = (newSeason) => {
    if (newSeason < 1) return;
    const targetEpisode = 1;
    const imdbId = mediaState.imdbId;

    let newServers = [];
    if (imdbId) {
      newServers = [
        { name: 'Server 1 (VidSrc)', url: `https://vidsrc.me/embed/tv?imdb=${imdbId}&season=${newSeason}&episode=${targetEpisode}` },
        { name: 'Server 2 (2Embed)', url: `https://2embed.cc/embed/tv/${imdbId}&s=${newSeason}&e=${targetEpisode}` },
        { name: 'Server 3 (VidSrc Multi)', url: `https://vidsrc.to/embed/tv/${imdbId}/${newSeason}/${targetEpisode}` },
        { name: 'Server 4 (VidSrc PM)', url: `https://vidsrc.pm/embed/tv?imdb=${imdbId}&season=${newSeason}&episode=${targetEpisode}` }
      ];
    } else {
      newServers = mediaState.servers || [];
    }

    const cleanTitle = (mediaState.title || 'Series').replace(/\s*-\s*S\d+\s*E\d+/i, '').replace(/\s*\(.*?\)/, '');
    const updated = {
      ...mediaState,
      isSeries: true,
      season: newSeason,
      episode: targetEpisode,
      url: newServers[0]?.url || mediaState.url,
      servers: newServers,
      title: `${cleanTitle} - S${newSeason} E${targetEpisode}`
    };
    onMediaChange?.(updated);
    socket?.emit('media-change', updated);
  };

  return (
    <div
      ref={theaterRef}
      className={`theater-container ${isFullscreen ? 'fullscreen-mode' : ''}`}
      onMouseMove={handleMouseMove}
    >
      <div
        className="ambient-backlight"
        style={{
          opacity: isPlaying ? 0.85 : 0.35,
          background: isPlaying
            ? 'radial-gradient(ellipse at center, rgba(244, 63, 94, 0.4) 0%, rgba(139, 92, 246, 0.25) 45%, transparent 75%)'
            : 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.2) 0%, transparent 60%)'
        }}
      />

      {/* Anti-Redirect Shield Badge for Embeds */}
      {mediaState.sourceType === 'embed' && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 30,
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '11px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backdropFilter: 'blur(8px)'
          }}
        >
          <ShieldCheck size={14} /> Anti-Redirect Shield Active
        </div>
      )}

      {/* Main Video Viewport - STRICTLY OUR PLAYER */}
      <div
        className="player-wrapper"
        onMouseMove={handleUserActivity}
        onClick={handleUserActivity}
      >
        {mediaState.sourceType === 'youtube' && extractYouTubeId(mediaState.url) ? (
          /* YouTube Player — only when a valid YouTube ID is present */
          <div key="yt-player-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
            <div ref={ytContainerRef} style={{ width: '100%', height: '100%' }} />
          </div>
        ) : mediaState.sourceType === 'embed' && mediaState.url ? (
          /* Embed Player (Hdhub4u, VidSrc, etc.) — source's own player */
          <iframe
            key={mediaState.url}
            src={mediaState.url}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            title="Video Player"
          />
        ) : mediaState.url ? (
          /* Direct / Local / HLS Video Player */
          <video
            ref={videoRef}
            src={mediaState.url?.includes('.m3u8') ? undefined : mediaState.url}
            playsInline
            crossOrigin="anonymous"
            controls={false}
            onClick={togglePlay}
            onDoubleClick={toggleTheaterFullscreen}
            onError={(e) => {
              console.warn('[Video Player Error Event]', e);
              reportStreamError('HTML5 Video Stream Offline / 404');
            }}
            style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'pointer' }}
          />
        ) : (
          /* No source selected yet */
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)', gap: '12px'
          }}>
            <Film size={48} strokeWidth={1} />
            <span style={{ fontSize: '16px', fontWeight: '500' }}>Choose a movie to start watching</span>
            <button
              className="btn btn-primary"
              style={{ marginTop: '8px', padding: '8px 20px', fontSize: '13px' }}
              onClick={onOpenSourcePicker}
            >
              🎬 Choose Movie
            </button>
          </div>
        )}

        {/* 404 / Playback Error Recovery Overlay */}
        {hasPlaybackError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 45,
              background: 'rgba(9, 10, 15, 0.94)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              textAlign: 'center',
              color: '#fff'
            }}
          >
            <div
              style={{
                background: 'rgba(255, 85, 0, 0.12)',
                border: '1px solid rgba(255, 85, 0, 0.35)',
                padding: '16px',
                borderRadius: '50%',
                marginBottom: '14px',
                boxShadow: '0 0 35px rgba(255, 85, 0, 0.25)'
              }}
            >
              <AlertTriangle size={36} color="#ff5500" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#ff5500', background: 'rgba(255,85,0,0.15)', padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,85,0,0.3)' }}>
                🤖 ViAM AI Active
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>
                Stream Offline / 404 Error
              </span>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              Yeh Movie Stream Offline / 404 Error de raha hai!
            </h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', maxWidth: '460px', lineHeight: 1.5, marginBottom: '20px' }}>
              ViAM AI ne room chat me working stream link ke liye poochha hai. Agar aapke paas direct stream link, YouTube ya HDHub4u URL hai toh yahan paste karein:
            </p>

            {/* Direct Play Link Input */}
            <form
              onSubmit={handleCustomLinkPlay}
              style={{
                display: 'flex',
                gap: '8px',
                width: '100%',
                maxWidth: '480px',
                marginBottom: '18px'
              }}
            >
              <input
                type="url"
                value={customLinkInput}
                onChange={(e) => setCustomLinkInput(e.target.value)}
                placeholder="Paste working stream / MP4 / YouTube URL..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,85,0,0.4)',
                  color: '#fff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!customLinkInput.trim()}
                className="btn btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '13px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff5500, #e11d48)',
                  whiteSpace: 'nowrap'
                }}
              >
                ▶️ Play Now
              </button>
            </form>

            {/* Quick Actions (Switch Server / Open Picker / Retry) */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {mediaState.servers && mediaState.servers.length > 1 && (
                <button
                  onClick={() => {
                    const other = mediaState.servers.find(s => s.url !== mediaState.url) || mediaState.servers[0];
                    if (other) {
                      const updated = {
                        ...mediaState,
                        url: other.url,
                        sourceType: other.sourceType || (other.url?.includes('.m3u8') ? 'direct' : 'embed')
                      };
                      onMediaChange?.(updated);
                      socket?.emit('media-change', updated);
                      setHasPlaybackError(false);
                    }
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px' }}
                >
                  <RefreshCw size={13} style={{ marginRight: 6 }} /> Switch Server
                </button>
              )}
              <button
                onClick={onOpenSourcePicker}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px' }}
              >
                <Film size={13} style={{ marginRight: 6 }} /> Choose Another Movie
              </button>
              <button
                onClick={() => setHasPlaybackError(false)}
                className="btn btn-secondary"
                style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', opacity: 0.7 }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Center Big Play/Pause Indicator (Shown when paused in Native / YouTube mode ONLY) */}
        {mediaState.sourceType !== 'embed' && !isPlaying && (
          <div
            className="center-play-indicator"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            title="Play Movie (Space)"
          >
            <Play size={36} color="#fff" style={{ marginLeft: '4px' }} />
          </div>
        )}

        {/* Subtitles Overlay */}
        {subtitlesEnabled && currentSubtitleText && (
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 35,
              maxWidth: '85%',
              textAlign: 'center',
              pointerEvents: 'none',
              padding: '6px 16px',
              background: 'rgba(0, 0, 0, 0.82)',
              borderRadius: '8px',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.9)'
            }}
          >
            <span
              style={{
                color: subColor === 'yellow' ? '#fde047' : '#ffffff',
                fontSize: subSize === 'large' ? '22px' : subSize === 'small' ? '15px' : '18px',
                fontWeight: '700',
                letterSpacing: '0.3px',
                textShadow: '0 2px 4px #000, 0 0 2px #000',
                lineHeight: 1.45,
                whiteSpace: 'pre-wrap'
              }}
            >
              {currentSubtitleText}
            </span>
          </div>
        )}

        {/* FLOATING UNIFIED CINEMA CONTROLS OVERLAY — Clean & Non-Overlapping */}
        <div
          className="cinema-control-overlay"
          style={{
            opacity: (showControls || !isPlaying || mediaState.sourceType === 'embed') ? 1 : 0,
            pointerEvents: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Full-Width Interactive Timeline Scrubber Slider (Native & YouTube mode ONLY) */}
          {mediaState.sourceType !== 'embed' && (
            <div className="scrub-container" style={{ pointerEvents: 'auto' }}>
              <input
                type="range"
                min="0"
                max={duration || 100}
                step="0.5"
                value={currentTime || 0}
                onChange={(e) => {
                  const targetTime = parseFloat(e.target.value);
                  setCurrentTime(targetTime);
                  if (videoRef.current) {
                    videoRef.current.currentTime = targetTime;
                  } else if (ytPlayerRef.current?.seekTo) {
                    ytPlayerRef.current.seekTo(targetTime, true);
                  }
                  socket?.emit('media-seek', { currentTime: targetTime });
                }}
                className="cinema-scrubber"
                style={{
                  background: `linear-gradient(to right, #c084fc ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`
                }}
                title="Drag to Scrub Timeline"
              />
            </div>
          )}

          {/* Bottom Control Row */}
          <div className="cinema-control-row" style={{ pointerEvents: 'auto' }}>
            {/* Left Controls */}
            <div className="control-group">
              {mediaState.sourceType !== 'embed' ? (
                <>
                  <button
                    onClick={togglePlay}
                    className="ctrl-btn play-btn"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                  </button>

                  <button
                    onClick={() => handleSeekDelta(-10)}
                    className="ctrl-btn"
                    title="Rewind 10s (Left Arrow)"
                  >
                    <RotateCcw size={15} />
                  </button>

                  <button
                    onClick={() => handleSeekDelta(10)}
                    className="ctrl-btn"
                    title="Forward 10s (Right Arrow)"
                  >
                    <RotateCw size={15} />
                  </button>

                  <div className="volume-container">
                    <button
                      onClick={toggleMute}
                      className="ctrl-btn"
                      title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                      style={{ width: '30px', height: '30px' }}
                    >
                      {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="volume-slider"
                    />
                  </div>

                  <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    fontSize: '11px', fontWeight: '800', color: '#c084fc',
                    background: 'rgba(168, 85, 247, 0.15)', border: '1px solid rgba(168, 85, 247, 0.35)',
                    padding: '3px 10px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '5px'
                  }}>
                    <Zap size={12} color="#c084fc" /> Embed CDN Server
                  </span>
                </div>
              )}
            </div>

            {/* Center: Movie Title */}
            <div className="control-group" style={{ flex: 1, justifyContent: 'center' }}>
              <span className="movie-title-banner">
                {mediaState.title || 'CYPR Cinema'}
              </span>
            </div>

            {/* Right Controls */}
            <div className="control-group">
              {/* Server Switcher Dropdown (If multiple servers available) */}
              {mediaState.servers && mediaState.servers.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsServerDropdownOpen(!isServerDropdownOpen);
                      setIsSubtitleDrawerOpen(false);
                      setIsSettingsDrawerOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: '600',
                      borderRadius: '8px',
                      background: 'rgba(168, 85, 247, 0.18)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#e9d5ff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    title="Switch Streaming Server"
                  >
                    <Server size={13} color="#c084fc" />
                    <span>
                      {mediaState.servers.find((s) => s.url === mediaState.url)?.name || 'Server Selector'}
                    </span>
                    <ChevronDown size={12} style={{ transform: isServerDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  </button>

                  {isServerDropdownOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        bottom: '42px',
                        right: 0,
                        zIndex: 95,
                        width: '220px',
                        background: 'rgba(18, 18, 24, 0.96)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '12px',
                        backdropFilter: 'blur(20px)',
                        padding: '6px',
                        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ fontSize: '10px', fontWeight: '700', color: '#a1a1aa', padding: '4px 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Available Servers ({mediaState.servers.length})
                      </div>
                      {mediaState.servers.map((srv, idx) => {
                        const isSelected = mediaState.url === srv.url;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              const newSourceType = srv.sourceType || (srv.isNativePlayer || srv.url?.includes('.m3u8') ? 'direct' : 'embed');
                              const updated = {
                                ...mediaState,
                                url: srv.url,
                                sourceType: newSourceType,
                                subtitlesUrl: srv.subtitlesUrl || mediaState.subtitlesUrl
                              };
                              onMediaChange?.(updated);
                              socket?.emit('media-change', updated);
                              setIsServerDropdownOpen(false);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '7px 10px',
                              borderRadius: '8px',
                              background: isSelected ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.02)',
                              border: isSelected ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                              color: isSelected ? '#ffffff' : '#a1a1aa',
                              fontSize: '11px',
                              fontWeight: isSelected ? '700' : '500',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Server size={12} color={isSelected ? '#c084fc' : '#71717a'} />
                              <span>{srv.name}</span>
                            </div>
                            {isSelected && <Check size={12} color="#c084fc" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Subtitles Button */}
              <button
                onClick={() => {
                  setIsSubtitleDrawerOpen(!isSubtitleDrawerOpen);
                  setIsSettingsDrawerOpen(false);
                  setIsServerDropdownOpen(false);
                }}
                className={`ctrl-btn ${subtitlesEnabled ? 'active' : ''}`}
                title="Subtitles & Captions"
              >
                <Subtitles size={16} />
              </button>

              {/* Quality & Speed Settings */}
              <button
                onClick={() => {
                  setIsSettingsDrawerOpen(!isSettingsDrawerOpen);
                  setIsSubtitleDrawerOpen(false);
                  setIsServerDropdownOpen(false);
                }}
                className={`ctrl-btn ${isSettingsDrawerOpen ? 'active' : ''}`}
                title="Settings (Speed, Audio Boost, Quality)"
              >
                <Settings size={16} />
              </button>

              {/* Theater Fullscreen */}
              <button
                onClick={toggleTheaterFullscreen}
                className="ctrl-btn"
                title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Cinema Fullscreen (F)'}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Subtitles Settings Popover */}
        {isSubtitleDrawerOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              right: '60px',
              zIndex: 80,
              width: '300px',
              background: 'rgba(18, 18, 24, 0.96)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              padding: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Subtitles size={16} color="#c084fc" /> Subtitles
              </span>
              <button onClick={() => setIsSubtitleDrawerOpen(false)} className="btn btn-secondary btn-icon" style={{ width: '22px', height: '22px' }}>
                <X size={12} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Display Subtitles:</span>
              <button
                type="button"
                onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
                className={`btn ${subtitlesEnabled ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '3px 12px', fontSize: '11px', borderRadius: '12px' }}
              >
                {subtitlesEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div>
              <label className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '8px', fontSize: '11px', cursor: 'pointer', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.25)' }}>
                <Upload size={14} color="#c084fc" />
                <span>{subFileName ? subFileName : 'Upload .srt / .vtt file'}</span>
                <input type="file" accept=".srt,.vtt" onChange={handleSubtitleUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        )}

        {/* Settings (Speed & Audio Boost) Popover */}
        {isSettingsDrawerOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: '80px',
              right: '20px',
              zIndex: 80,
              width: '280px',
              background: 'rgba(18, 18, 24, 0.96)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              backdropFilter: 'blur(20px)',
              padding: '16px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Settings size={16} color="#c084fc" /> Cinema Settings
              </span>
              <button onClick={() => setIsSettingsDrawerOpen(false)} className="btn btn-secondary btn-icon" style={{ width: '22px', height: '22px' }}>
                <X size={12} />
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', color: '#a1a1aa', fontWeight: '600' }}>
                  Playback Speed:
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: playbackSpeed !== 1 ? '#ff5500' : '#a1a1aa' }}>
                  {playbackSpeed}x
                </span>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => handleSpeedChange(spd)}
                    style={{
                      flex: 1,
                      padding: '5px 0',
                      fontSize: '11px',
                      fontWeight: '800',
                      borderRadius: '8px',
                      background: playbackSpeed === spd ? 'linear-gradient(135deg, #ff5500, #e11d48)' : 'rgba(255,255,255,0.05)',
                      border: playbackSpeed === spd ? '1px solid #ff5500' : '1px solid rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: playbackSpeed === spd ? '0 0 12px rgba(255,85,0,0.5)' : 'none'
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11.5px', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Volume2 size={13} color="#22c55e" /> Super Audio Boost:
                </span>
                <span style={{ fontSize: '11.5px', fontWeight: '800', color: audioBoost > 1 ? '#22c55e' : '#a1a1aa' }}>
                  {Math.round(audioBoost * 100)}%
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
                {[1, 1.5, 2, 3].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleAudioBoostChange(b)}
                    style={{
                      padding: '5px 0',
                      fontSize: '11px',
                      fontWeight: '800',
                      borderRadius: '8px',
                      background: audioBoost === b ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.05)',
                      border: audioBoost === b ? '1px solid #22c55e' : '1px solid rgba(255,255,255,0.08)',
                      color: '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: audioBoost === b ? '0 0 12px rgba(34,197,94,0.5)' : 'none'
                    }}
                  >
                    {b * 100}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Web Series Episode & Season Navigation Bar */}
      {isSeries && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.15) 0%, rgba(15, 18, 24, 0.95) 40%)',
            borderBottom: '1px solid rgba(168, 85, 247, 0.25)',
            gap: '12px',
            overflowX: 'auto'
          }}
        >
          {/* Season Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tv size={13} color="#c084fc" /> Season:
            </span>
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSwitchSeason(s)}
                className={`btn ${currentSeason === s ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  borderRadius: '12px',
                  background: currentSeason === s ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.06)',
                  color: '#e9d5ff',
                  border: currentSeason === s ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                  fontWeight: currentSeason === s ? '700' : '500',
                  boxShadow: currentSeason === s ? '0 0 10px rgba(168, 85, 247, 0.4)' : 'none'
                }}
              >
                S{s}
              </button>
            ))}
          </div>

          {/* Episode Quick Switcher Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', padding: '2px 0' }}>
            <button
              type="button"
              onClick={() => handleSwitchEpisode(currentEpisode - 1)}
              disabled={currentEpisode <= 1}
              className="btn btn-secondary btn-icon"
              style={{ width: '26px', height: '26px', padding: 0, opacity: currentEpisode <= 1 ? 0.4 : 1 }}
              title="Previous Episode"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Episode Pills */}
            {Array.from({ length: Math.max(totalEpisodes, 10) }, (_, i) => i + 1).map((ep) => (
              <button
                key={ep}
                type="button"
                onClick={() => handleSwitchEpisode(ep)}
                className={`btn ${currentEpisode === ep ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: currentEpisode === ep ? '700' : '500',
                  borderRadius: '14px',
                  background: currentEpisode === ep ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.06)',
                  color: '#f4f4f5',
                  border: currentEpisode === ep ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: currentEpisode === ep ? '0 0 10px rgba(168, 85, 247, 0.4)' : 'none',
                  flexShrink: 0
                }}
              >
                Ep {ep}
              </button>
            ))}

            <button
              type="button"
              onClick={() => handleSwitchEpisode(currentEpisode + 1)}
              className="btn btn-primary"
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.85), rgba(126, 34, 206, 0.95))',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)'
              }}
              title="Next Episode"
            >
              Next Ep <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Sleek Compact Player Status Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 16px',
          background: 'rgba(12, 14, 20, 0.98)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '11px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#a1a1aa', fontWeight: '600' }}>
            Source: {mediaState.sourceType === 'youtube' ? '▶️ YouTube Stream' : mediaState.sourceType === 'direct' ? '⚡ Direct HLS Stream' : '🌐 Cinema Server CDN'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => reportStreamError('User Reported 404 / Video Stream Failed')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 10px',
              fontSize: '11px',
              borderRadius: '16px',
              background: isReporting ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#a1a1aa',
              cursor: 'pointer',
              fontWeight: '600'
            }}
            title="Stream not working? Click to ask ViAM AI in chat for an alternate link"
          >
            <AlertTriangle size={12} color="#a1a1aa" />
            <span>{isReporting ? 'Alerted AI!' : 'Report 404'}</span>
          </button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '10.5px',
              fontWeight: '600'
            }}
          >
            <ShieldCheck size={12} />
            <span>Protected</span>
          </div>
        </div>
      </div>

      {/* Floating Duo Webcams for Couple Lounge */}
      {children}
    </div>
  );
}
