import React, { useState, useEffect } from 'react';
import {
  Search, Film, Video, Globe, HardDrive, X, Play, Star, Clock,
  Sparkles, ExternalLink, RefreshCw, Zap, Tag, ThumbsUp, Check, Sliders, Tv
} from 'lucide-react';
import { CURATED_COUPLE_PICKS, HDHUB4U_TOP_PICKS, detectSourceType, extractYouTubeId } from '../utils/movieSources';
import { SERVER_URL } from '../utils/apiUrl';
import { getT } from '../utils/themeTokens';

const FEATURED_CINEMA_MOVIES = [
  {
    id: 157336,
    tmdbId: 157336,
    title: 'Interstellar',
    year: '2014',
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    rating: '8.4',
    genre: 'Sci-Fi • Adventure',
    type: 'embed',
    url: 'https://autoembed.co/movie/tmdb/157336'
  },
  {
    id: 27205,
    tmdbId: 27205,
    title: 'Inception',
    year: '2010',
    poster: 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
    rating: '8.4',
    genre: 'Sci-Fi • Action',
    type: 'embed',
    url: 'https://autoembed.co/movie/tmdb/27205'
  },
  {
    id: 372058,
    tmdbId: 372058,
    title: 'Your Name',
    year: '2016',
    poster: 'https://image.tmdb.org/t/p/w500/vfJFJPepRKapMd5G2ro7klIRysq.jpg',
    rating: '8.5',
    genre: 'Anime • Romance',
    type: 'embed',
    url: 'https://autoembed.co/movie/tmdb/372058'
  },
  {
    id: 693134,
    tmdbId: 693134,
    title: 'Dune: Part Two',
    year: '2024',
    poster: 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
    rating: '8.2',
    genre: 'Sci-Fi • Action',
    type: 'embed',
    url: 'https://autoembed.co/movie/tmdb/693134'
  },
  {
    id: 129,
    tmdbId: 129,
    title: 'Spirited Away',
    year: '2001',
    poster: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
    rating: '8.5',
    genre: 'Anime • Fantasy',
    type: 'embed',
    url: 'https://autoembed.co/movie/tmdb/129'
  },
  {
    id: 872585,
    tmdbId: 872585,
    title: 'Oppenheimer',
    year: '2023',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    rating: '8.1',
    genre: 'Drama • History',
    type: 'embed',
    url: 'https://autoembed.co/movie/tmdb/872585'
  },
  {
    id: 299534,
    tmdbId: 299534,
    title: 'Avengers: Endgame',
    year: '2019',
    poster: 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
    rating: '8.3',
    genre: 'Action • Sci-Fi',
    type: 'embed',
    url: 'https://autoembed.co/movie/tmdb/299534'
  },
  {
    id: 569094,
    tmdbId: 569094,
    title: 'Across the Spider-Verse',
    year: '2023',
    poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    rating: '8.4',
    genre: 'Animation • Action',
    type: 'embed',
    url: 'https://autoembed.co/movie/tmdb/569094'
  }
];

const POPULAR_POSTERS = {
  'interstellar': 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
  'inception': 'https://image.tmdb.org/t/p/w500/edv5CZvWj09upOsy2Y6IwDhK8bt.jpg',
  'your name': 'https://image.tmdb.org/t/p/w500/vfJFJPepRKapMd5G2ro7klIRysq.jpg',
  'dune: part two': 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
  'dune 2': 'https://image.tmdb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg',
  'spirited away': 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
  'oppenheimer': 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
  'about time': 'https://image.tmdb.org/t/p/w500/i0OG1W1z91L3b0L1sJ1v5884BfG.jpg',
  'la la land': 'https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoYbOo4f6TVflBncP.jpg',
  'a quiet place': 'https://image.tmdb.org/t/p/w500/nAU74GmpUk7t5iklEp3bufwDq4n.jpg',
  'the dark knight': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
  'avengers: endgame': 'https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg',
  'across the spider-verse': 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
  'steins;gate': 'https://image.tmdb.org/t/p/w500/5T1bJbOa517z4p6zPqW5536585.jpg',
  'the midnight sky': 'https://image.tmdb.org/t/p/w500/5Dhnssi0z9bW0Vqf8hXkIeU4N2j.jpg',
  'summer wars': 'https://image.tmdb.org/t/p/w500/8d8w0p6ZqgG7f6zO7Vv436p4J5g.jpg'
};

const cleanTitleText = (title) => {
  if (!title) return '';
  return String(title)
    .replace(/&#8217;|&#039;|&rsquo;|&lsquo;/g, "'")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#8211;|&ndash;/g, '-')
    .replace(/&#8212;|&mdash;/g, '--')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

export default function SourcePicker({ isOpen, onClose, onSelectMedia, initialQuery = '', theme }) {
  const currentTheme = theme || (typeof document !== 'undefined' && (document.body.classList.contains('light-theme') || localStorage.getItem('cypr_theme') === 'light') ? 'light' : 'dark');
  const T = getT(currentTheme);

  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'ai' | 'local' | 'custom'
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'neural' | 'hdhub4u' | 'vibes'
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ movies: [], youtube: [] });
  const [hdhubResults, setHdhubResults] = useState([]);
  const [hdhubLiveHost, setHdhubLiveHost] = useState('');
  const [isHdhubLoading, setIsHdhubLoading] = useState(false);
  const [animeResults, setAnimeResults] = useState([]);
  const [isAnimeLoading, setIsAnimeLoading] = useState(false);
  const [resolvingMovieId, setResolvingMovieId] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [localFileName, setLocalFileName] = useState('');

  // AI Recommendation & Watch History state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [watchHistory, setWatchHistory] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);

  // Load Watch History on modal open
  useEffect(() => {
    if (isOpen) {
      try {
        const storedShows = localStorage.getItem('cypr_show_history');
        if (storedShows) {
          const parsed = JSON.parse(storedShows);
          if (Array.isArray(parsed)) {
            setWatchHistory(parsed);
          }
        }
      } catch (err) {
        console.warn('[Watch History Load Error]', err);
      }
    }
  }, [isOpen]);

  // Live debounced search as user types (shows exact searched movies with banners)
  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setSearchResults({ movies: [], youtube: [] });
      return;
    }
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 380);
    return () => clearTimeout(timer);
  }, [searchQuery, activeCategory]);

  // Helper to record selected media in watch history
  const saveToWatchHistory = (media) => {
    try {
      const existing = JSON.parse(localStorage.getItem('cypr_show_history') || '[]');
      const newEntry = {
        title: media.title,
        sourceType: media.sourceType || 'embed',
        url: media.url,
        watchedAt: Date.now(),
        category: media.category || 'Cinema'
      };
      const updated = [newEntry, ...existing.filter((item) => item.title !== media.title)].slice(0, 20);
      localStorage.setItem('cypr_show_history', JSON.stringify(updated));
      setWatchHistory(updated);
    } catch (err) {
      console.warn('[Save Watch History Error]', err);
    }
  };

  const fetchAiRecommendations = async (promptQuery, prefsOverride) => {
    setIsAiLoading(true);
    try {
      const prefs = prefsOverride !== undefined ? prefsOverride : selectedPreferences;
      const res = await fetch(`${SERVER_URL}/api/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: promptQuery || aiPrompt || '',
          history: watchHistory,
          preferences: prefs
        })
      });
      const data = await res.json();
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setAiRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('[AI Recommendation Error]', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Initial fetch of AI recommendations based on watch history when modal opens
  useEffect(() => {
    if (isOpen && aiRecommendations.length === 0) {
      fetchAiRecommendations();
    }
  }, [isOpen, watchHistory]);

  const toggleGenrePreference = (genre) => {
    let updated;
    if (selectedPreferences.includes(genre)) {
      updated = selectedPreferences.filter((g) => g !== genre);
    } else {
      updated = [...selectedPreferences, genre];
    }
    setSelectedPreferences(updated);
    fetchAiRecommendations(aiPrompt, updated);
  };

  const handleSelectAiMovie = (movie) => {
    saveToWatchHistory({ title: movie.title, sourceType: 'embed', category: movie.genre || 'AI Recommended' });
    const query = movie.title;
    setSearchQuery(query);
    setActiveTab('search');
    performSearch(query);
  };

  // Auto-search if initialQuery passed (e.g. from Voice Assistant)
  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load live WatchAnimeWorld content when user selects watchanimeworld tab
  useEffect(() => {
    if (activeCategory === 'watchanimeworld' && animeResults.length === 0) {
      fetchAnimeLive(searchQuery);
    }
  }, [activeCategory]);

  const fetchHdhubLive = async (query = '') => {
    setIsHdhubLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/search/hdhub4u?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setHdhubResults(data.movies || []);
      if (data.liveHost) setHdhubLiveHost(data.liveHost);
    } catch (err) {
      console.error('[HDHub4u Live Fetch Error]', err);
    } finally {
      setIsHdhubLoading(false);
    }
  };

  const fetchAnimeLive = async (query = '') => {
    setIsAnimeLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/search/watchanimeworld?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setAnimeResults(data.anime || []);
    } catch (err) {
      console.error('[WatchAnimeWorld Fetch Error]', err);
    } finally {
      setIsAnimeLoading(false);
    }
  };

  const performSearch = async (q, isNeural = false) => {
    if (!q || !q.trim()) return;
    setIsSearching(true);
    try {
      const endpoint = (isNeural || activeCategory === 'neural') ? '/api/search/neural' : '/api/search/all';
      const [allRes] = await Promise.all([
        fetch(`${SERVER_URL}${endpoint}?q=${encodeURIComponent(q.trim())}`).then((r) => r.json()).catch(() => ({ movies: [], youtube: [] })),
        fetchHdhubLive(q.trim()),
        fetchAnimeLive(q.trim())
      ]);
      setSearchResults({
        movies: allRes.movies || [],
        youtube: allRes.youtube || []
      });
    } catch (err) {
      console.error('[Search Error]', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectAnimeMovie = async (anime) => {
    saveToWatchHistory({ title: anime.title, sourceType: 'embed', category: 'WatchAnimeWorld' });
    setResolvingMovieId(anime.url || anime.id || anime.title);

    try {
      const res = await fetch(`${SERVER_URL}/api/search/watchanimeworld/resolve?url=${encodeURIComponent(anime.url || '')}&title=${encodeURIComponent(anime.title || '')}`);
      const data = await res.json();

      if (data && data.servers && data.servers.length > 0) {
        onSelectMedia({
          sourceType: 'embed',
          url: data.activeUrl || data.url || data.servers[0].url,
          title: data.title || anime.title,
          servers: data.servers
        });
      } else {
        onSelectMedia({
          sourceType: 'embed',
          url: `https://autoembed.co/movie/tmdb/${encodeURIComponent(anime.title)}`,
          title: anime.title,
          servers: [
            { name: '⚡ Server 1 (AutoEmbed 4K Anime)', url: `https://autoembed.co/movie/tmdb/${encodeURIComponent(anime.title)}`, sourceType: 'embed' },
            { name: '🔥 Server 2 (VidSrc Pro)', url: `https://vidsrc.to/embed/movie/${encodeURIComponent(anime.title)}`, sourceType: 'embed' }
          ]
        });
      }
    } catch (err) {
      console.error('[Resolve WatchAnimeWorld Error]', err);
      onSelectMedia({
        sourceType: 'embed',
        url: `https://autoembed.co/movie/tmdb/${encodeURIComponent(anime.title)}`,
        title: anime.title,
        servers: [
          { name: '⚡ Server 1 (AutoEmbed 4K Anime)', url: `https://autoembed.co/movie/tmdb/${encodeURIComponent(anime.title)}`, sourceType: 'embed' }
        ]
      });
    } finally {
      setResolvingMovieId(null);
      onClose();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeCategory === 'hdhub4u') {
      fetchHdhubLive(searchQuery);
    } else {
      performSearch(searchQuery);
    }
  };

  const handleSelectSearchResult = async (item) => {
    saveToWatchHistory(item);

    // 1. Direct streams (.mp4, .m3u8) -> OUR NATIVE PLAYER!
    if (item.type === 'direct' || item.url?.includes('.mp4') || item.url?.includes('.m3u8')) {
      onSelectMedia({
        sourceType: 'direct',
        url: item.url,
        title: item.title + (item.year ? ` (${item.year})` : ''),
        servers: item.servers || [{ name: '🔥 Native Stream (Direct)', url: item.url, sourceType: 'direct' }]
      });
      onClose();
      return;
    }

    // 2. HDHub4u post or streaming link -> Auto-resolve directly to player
    if (item.isHdhubLive || item.url?.includes('hdhub4u') || item.url?.includes('hdstream4u') || item.url?.includes('vidhide')) {
      handleSelectHdhubMovie(item);
      return;
    }

    // 2b. WatchAnimeWorld post or anime item -> Auto-resolve deep stream iframe
    if (item.source === 'watchanimeworld' || item.url?.includes('watchanimeworld')) {
      handleSelectAnimeMovie(item);
      return;
    }

    // 3. YouTube video -> YouTube API in stage
    if (item.type === 'youtube' || extractYouTubeId(item.url)) {
      onSelectMedia({
        sourceType: 'youtube',
        url: item.url,
        title: item.title + (item.year ? ` (${item.year})` : ''),
        servers: [{ name: '▶️ YouTube Stream', url: item.url, sourceType: 'youtube' }]
      });
      onClose();
      return;
    }

    // 4. Auto-resolve external embed movie
    setResolvingMovieId(item.id || item.url);
    try {
      const res = await fetch(`${SERVER_URL}/api/hdhub4u/resolve?title=${encodeURIComponent(item.title)}`);
      const data = await res.json();
      if (data && data.servers && data.servers.length > 0) {
        onSelectMedia({
          sourceType: data.sourceType || (data.activeUrl?.includes('.m3u8') ? 'direct' : 'embed'),
          url: data.activeUrl,
          title: item.title + (data.isSeries ? ` - S${data.season} E${data.episode}` : (item.year ? ` (${item.year})` : '')),
          servers: data.servers,
          subtitlesUrl: data.subtitlesUrl
        });
        onClose();
        return;
      }
    } catch (e) {
      console.warn('Auto-resolve note:', e);
    } finally {
      setResolvingMovieId(null);
    }

    onSelectMedia({
      sourceType: item.type || 'embed',
      url: item.url,
      title: item.title + (item.year ? ` (${item.year})` : ''),
      servers: item.servers || []
    });
    onClose();
  };

  const handleSelectHdhubMovie = async (m) => {
    saveToWatchHistory({ title: m.title, sourceType: 'hdhub4u', url: m.url });
    setResolvingMovieId(m.url);
    try {
      const res = await fetch(`${SERVER_URL}/api/hdhub4u/resolve?url=${encodeURIComponent(m.url)}`);
      const data = await res.json();
      if (data && data.servers && data.servers.length > 0) {
        onSelectMedia({
          sourceType: data.sourceType || (data.activeUrl?.includes('.m3u8') ? 'direct' : 'embed'),
          url: data.activeUrl,
          title: m.title + (data.isSeries ? ` - S${data.season} E${data.episode}` : (m.year ? ` (${m.year})` : '')),
          isSeries: data.isSeries,
          season: data.season || 1,
          episode: data.episode || 1,
          totalEpisodes: data.totalEpisodes || 10,
          imdbId: data.imdbId,
          pageUrl: m.url,
          servers: data.servers,
          subtitlesUrl: data.subtitlesUrl
        });
        onClose();
        return;
      }
    } catch (err) {
      console.error('[Failed to resolve HDHub4u stream]', err);
    } finally {
      setResolvingMovieId(null);
    }

    // Fallback if resolve fails
    onSelectMedia({
      sourceType: 'embed',
      url: m.url,
      title: m.title,
      servers: [{ name: 'HDHub4u Live Page', url: m.url }]
    });
    onClose();
  };

  const handleCustomUrlSubmit = (e) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    const url = customUrl.trim();
    const title = customTitle.trim() || 'Custom Stream';
    saveToWatchHistory({ title, url, sourceType: 'custom' });
    if (url.includes('hdhub4u') || url.includes('hdstream4u') || url.includes('vidhide') || url.includes('streamhide')) {
      handleSelectHdhubMovie({ url, title });
      return;
    }
    const detectedType = detectSourceType(url);
    onSelectMedia({
      sourceType: detectedType,
      url,
      title
    });
    onClose();
  };

  const handleLocalFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setLocalFileName(file.name);
    saveToWatchHistory({ title: file.name, url: fileUrl, sourceType: 'local' });
    onSelectMedia({
      sourceType: 'local',
      url: fileUrl,
      title: file.name
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        cursor: 'pointer',
        background: T.isLight ? 'rgba(0, 0, 0, 0.45)' : 'rgba(9, 10, 15, 0.88)',
        backdropFilter: 'blur(24px)'
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '740px',
          width: '95%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'default',
          background: T.isLight ? '#faf7f2' : T.surfaceModal,
          border: T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : `1px solid ${T.border2}`,
          borderRadius: '20px',
          boxShadow: T.isLight ? '0 24px 60px rgba(45, 30, 15, 0.16), 0 4px 18px rgba(0,0,0,0.04)' : '0 24px 60px rgba(0, 0, 0, 0.85)',
          padding: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Executive Minimalist Glass Header Banner */}
        <div
          style={{
            position: 'relative',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '16px',
            background: T.isLight ? 'linear-gradient(135deg, #ffffff 0%, #f6f1e8 100%)' : T.surfaceHero,
            border: T.isLight ? '1px solid rgba(0, 0, 0, 0.07)' : `1px solid ${T.border1}`,
            padding: '16px 20px',
            boxShadow: T.isLight ? '0 2px 10px rgba(0,0,0,0.03)' : '0 8px 24px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: '700',
                  color: '#ff5500',
                  background: T.isLight ? 'rgba(255, 85, 0, 0.08)' : 'rgba(255, 85, 0, 0.15)',
                  border: T.isLight ? '1px solid rgba(255, 85, 0, 0.22)' : '1px solid rgba(255, 85, 0, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={10} /> VIAM CINEMA SELECTION
              </span>
            </div>
            <h3
              style={{
                fontSize: '19px',
                fontWeight: '800',
                color: T.textPrimary,
                margin: '2px 0 3px',
                fontFamily: 'Outfit, sans-serif',
                letterSpacing: '-0.3px'
              }}
            >
              Choose Movie & Media
            </h3>
            <p style={{ fontSize: '12px', color: T.textMuted1, margin: 0 }}>
              Search streaming sources or explore cinema titles tailored for your watch lounge
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: T.isLight ? '#ede7dc' : T.pillBg,
              border: T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : `1px solid ${T.pillBorder}`,
              color: T.isLight ? '#4a3d30' : T.textMuted1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = T.isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = T.textPrimary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = T.isLight ? '#ede7dc' : T.pillBg;
              e.currentTarget.style.color = T.isLight ? '#4a3d30' : T.textMuted1;
            }}
            title="Close (Esc)"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('search')}
            style={{
              flex: 1.2,
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'search' ? '700' : '500',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'search'
                ? (T.isLight ? '#ffffff' : 'rgba(255, 85, 0, 0.16)')
                : (T.isLight ? 'rgba(0, 0, 0, 0.03)' : T.pillBg),
              color: activeTab === 'search'
                ? '#ff5500'
                : (T.isLight ? '#6b5a44' : T.textMuted1),
              border: activeTab === 'search'
                ? (T.isLight ? '1px solid rgba(255, 85, 0, 0.35)' : '1px solid rgba(255, 85, 0, 0.45)')
                : (T.isLight ? '1px solid rgba(0, 0, 0, 0.06)' : `1px solid ${T.pillBorder}`),
              boxShadow: activeTab === 'search'
                ? (T.isLight ? '0 2px 8px rgba(255, 85, 0, 0.12)' : '0 4px 14px rgba(255, 85, 0, 0.2)')
                : 'none'
            }}
          >
            <Search size={14} /> Instant Search
          </button>

          <button
            onClick={() => {
              setActiveTab('ai');
              if (aiRecommendations.length === 0) {
                fetchAiRecommendations();
              }
            }}
            style={{
              flex: 1.4,
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'ai' ? '700' : '500',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'ai'
                ? (T.isLight ? '#ffffff' : 'rgba(255, 85, 0, 0.16)')
                : (T.isLight ? 'rgba(0, 0, 0, 0.03)' : T.pillBg),
              color: activeTab === 'ai'
                ? '#ff5500'
                : (T.isLight ? '#6b5a44' : T.textMuted1),
              border: activeTab === 'ai'
                ? (T.isLight ? '1px solid rgba(255, 85, 0, 0.35)' : '1px solid rgba(255, 85, 0, 0.45)')
                : (T.isLight ? '1px solid rgba(0, 0, 0, 0.06)' : `1px solid ${T.pillBorder}`),
              boxShadow: activeTab === 'ai' ? '0 2px 8px rgba(255, 85, 0, 0.12)' : 'none'
            }}
          >
            <Sparkles size={14} /> ✨ AI Recommended
          </button>

          <button
            onClick={() => setActiveTab('local')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'local' ? '700' : '500',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'local'
                ? (T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.12)')
                : (T.isLight ? 'rgba(0, 0, 0, 0.03)' : T.pillBg),
              color: activeTab === 'local' ? T.textPrimary : (T.isLight ? '#6b5a44' : T.textMuted1),
              border: activeTab === 'local'
                ? (T.isLight ? '1px solid rgba(0, 0, 0, 0.14)' : `1px solid ${T.border3}`)
                : (T.isLight ? '1px solid rgba(0, 0, 0, 0.06)' : `1px solid ${T.pillBorder}`)
            }}
          >
            <HardDrive size={14} /> Local 4K
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            style={{
              flex: 1,
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: activeTab === 'custom' ? '700' : '500',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'custom'
                ? (T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.12)')
                : (T.isLight ? 'rgba(0, 0, 0, 0.03)' : T.pillBg),
              color: activeTab === 'custom' ? T.textPrimary : (T.isLight ? '#6b5a44' : T.textMuted1),
              border: activeTab === 'custom'
                ? (T.isLight ? '1px solid rgba(0, 0, 0, 0.14)' : `1px solid ${T.border3}`)
                : (T.isLight ? '1px solid rgba(0, 0, 0, 0.06)' : `1px solid ${T.pillBorder}`)
            }}
          >
            <Globe size={14} /> Custom Link
          </button>
        </div>

        {/* TAB 1: INSTANT SEARCH */}
        {activeTab === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color={T.isLight ? '#8a7c6f' : T.textMuted2} style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type movie or series (e.g. Interstellar, Stree 2, Lofi, Titanic)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    height: '40px',
                    fontSize: '13px',
                    background: T.isLight ? '#ffffff' : T.inputBg,
                    border: T.isLight ? '1px solid rgba(0, 0, 0, 0.12)' : `1px solid ${T.inputBorder}`,
                    borderRadius: '10px',
                    color: T.isLight ? '#1a1208' : T.inputText,
                    boxShadow: T.isLight ? '0 1px 4px rgba(0, 0, 0, 0.03)' : 'none',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#ff5500')}
                  onBlur={(e) => (e.target.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.12)' : T.inputBorder)}
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                style={{
                  padding: '0 20px',
                  height: '40px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff5500 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(255, 85, 0, 0.28)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  performSearch(searchQuery, false);
                }}
                style={{
                  padding: '6px 13px',
                  fontSize: '11px',
                  fontWeight: activeCategory === 'all' ? '700' : '500',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  background: activeCategory === 'all'
                    ? (T.isLight ? '#1a1208' : 'rgba(255, 255, 255, 0.16)')
                    : (T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)'),
                  color: activeCategory === 'all'
                    ? '#ffffff'
                    : (T.isLight ? '#524538' : '#a1a1aa'),
                  border: activeCategory === 'all'
                    ? (T.isLight ? '1px solid #1a1208' : '1px solid rgba(255, 255, 255, 0.3)')
                    : (T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)'),
                  boxShadow: activeCategory === 'all' && T.isLight ? '0 2px 6px rgba(0,0,0,0.12)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Film size={12} />
                <span>All Cinema</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('neural');
                  performSearch(searchQuery, true);
                }}
                style={{
                  padding: '6px 13px',
                  fontSize: '11px',
                  fontWeight: activeCategory === 'neural' ? '700' : '500',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  background: activeCategory === 'neural'
                    ? (T.isLight ? '#ff5500' : 'rgba(255, 85, 0, 0.25)')
                    : (T.isLight ? '#ffffff' : 'rgba(255, 85, 0, 0.08)'),
                  color: activeCategory === 'neural'
                    ? '#ffffff'
                    : (T.isLight ? '#ea580c' : '#fdba74'),
                  border: activeCategory === 'neural'
                    ? (T.isLight ? '1px solid #ff5500' : '1px solid rgba(255, 85, 0, 0.45)')
                    : (T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 85, 0, 0.2)'),
                  boxShadow: activeCategory === 'neural' && T.isLight ? '0 2px 6px rgba(255, 85, 0, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Sparkles size={12} />
                <span>Neural Plot (AI)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('hdhub4u')}
                style={{
                  padding: '6px 13px',
                  fontSize: '11px',
                  fontWeight: activeCategory === 'hdhub4u' ? '700' : '500',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  background: activeCategory === 'hdhub4u'
                    ? (T.isLight ? '#b45309' : 'rgba(245, 158, 11, 0.25)')
                    : (T.isLight ? '#ffffff' : 'rgba(245, 158, 11, 0.06)'),
                  color: activeCategory === 'hdhub4u'
                    ? '#ffffff'
                    : (T.isLight ? '#b45309' : '#fbbf24'),
                  border: activeCategory === 'hdhub4u'
                    ? (T.isLight ? '1px solid #b45309' : '1px solid rgba(245, 158, 11, 0.4)')
                    : (T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(245, 158, 11, 0.18)'),
                  boxShadow: activeCategory === 'hdhub4u' && T.isLight ? '0 2px 6px rgba(180, 83, 9, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Zap size={12} />
                <span>HDHub4u Stream</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategory('watchanimeworld');
                  if (animeResults.length === 0) fetchAnimeLive(searchQuery);
                }}
                style={{
                  padding: '6px 13px',
                  fontSize: '11px',
                  fontWeight: activeCategory === 'watchanimeworld' ? '700' : '500',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  background: activeCategory === 'watchanimeworld'
                    ? (T.isLight ? '#be185d' : 'rgba(236, 72, 153, 0.25)')
                    : (T.isLight ? '#ffffff' : 'rgba(236, 72, 153, 0.08)'),
                  color: activeCategory === 'watchanimeworld'
                    ? '#ffffff'
                    : (T.isLight ? '#be185d' : '#ec4899'),
                  border: activeCategory === 'watchanimeworld'
                    ? (T.isLight ? '1px solid #be185d' : '1px solid rgba(236, 72, 153, 0.45)')
                    : (T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(236, 72, 153, 0.2)'),
                  boxShadow: activeCategory === 'watchanimeworld' && T.isLight ? '0 2px 6px rgba(190, 24, 93, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Tv size={12} />
                <span>WatchAnimeWorld (Anime)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('vibes')}
                style={{
                  padding: '6px 13px',
                  fontSize: '11px',
                  fontWeight: activeCategory === 'vibes' ? '700' : '500',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  cursor: 'pointer',
                  background: activeCategory === 'vibes'
                    ? (T.isLight ? '#1d4ed8' : 'rgba(59, 130, 246, 0.25)')
                    : (T.isLight ? '#ffffff' : 'rgba(59, 130, 246, 0.06)'),
                  color: activeCategory === 'vibes'
                    ? '#ffffff'
                    : (T.isLight ? '#1d4ed8' : '#60a5fa'),
                  border: activeCategory === 'vibes'
                    ? (T.isLight ? '1px solid #1d4ed8' : '1px solid rgba(59, 130, 246, 0.4)')
                    : (T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(59, 130, 246, 0.18)'),
                  boxShadow: activeCategory === 'vibes' && T.isLight ? '0 2px 6px rgba(29, 78, 216, 0.2)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Video size={12} />
                <span>Lofi & Vibes</span>
              </button>
            </div>

            {/* Results Container */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Searching Indicator */}
              {isSearching && (
                <div style={{ textAlign: 'center', padding: '36px 16px', color: '#ff5500' }}>
                  <RefreshCw size={26} className="spinning" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '14px', fontWeight: '700', color: T.isLight ? '#1a1208' : '#f4f4f5', margin: 0 }}>
                    Searching for "{searchQuery}"...
                  </p>
                  <p style={{ fontSize: '11.5px', color: T.isLight ? '#78716c' : '#a1a1aa', marginTop: '4px' }}>
                    Scanning cinema databases, 4K streams & direct sources
                  </p>
                </div>
              )}

              {/* WatchAnimeWorld Category View */}
              {!isSearching && activeCategory === 'watchanimeworld' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: T.isLight ? 'rgba(219, 39, 119, 0.06)' : 'rgba(236, 72, 153, 0.06)',
                      border: T.isLight ? '1px solid rgba(219, 39, 119, 0.2)' : '1px solid rgba(236, 72, 153, 0.2)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      marginBottom: '14px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="online-dot" style={{ background: '#ec4899' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: T.isLight ? '#9d174d' : '#fbcfe8' }}>
                          🌸 Live WatchAnimeWorld Catalog
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: T.isLight ? '#78716c' : '#a1a1aa', marginTop: '2px' }}>
                        {isAnimeLoading ? 'Searching live anime & movies...' : `Found ${animeResults.length} anime streams`}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchAnimeLive(searchQuery)}
                      style={{
                        padding: '6px 10px',
                        fontSize: '11px',
                        background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                        border: T.isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                        color: T.isLight ? '#1a1208' : '#f4f4f5',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      title="Refresh Anime Catalog"
                    >
                      <RefreshCw size={12} className={isAnimeLoading ? 'spinning' : ''} />
                    </button>
                  </div>

                  {isAnimeLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                      <RefreshCw size={24} color="#ec4899" className="spinning" style={{ margin: '0 auto 10px' }} />
                      <p style={{ fontSize: '12px', color: T.isLight ? '#78716c' : '#a1a1aa' }}>Fetching live anime streams from watchanimeworld.one...</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px' }}>
                      {animeResults.map((item, i) => (
                        <div
                          key={item.id || i}
                          onClick={() => handleSelectAnimeMovie(item)}
                          style={{
                            background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.02)',
                            border: T.isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(236, 72, 153, 0.2)',
                            boxShadow: T.isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                            borderRadius: '10px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.6)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = T.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(236, 72, 153, 0.2)';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          <div style={{ width: '100%', aspectRatio: '2/3', background: '#121216', position: 'relative' }}>
                            {item.poster ? (
                              <img src={item.poster} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                <Tv size={24} color="#ec4899" />
                              </div>
                            )}
                            <span
                              style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                background: 'rgba(0,0,0,0.75)',
                                backdropFilter: 'blur(4px)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '9px',
                                fontWeight: '700',
                                color: '#ec4899',
                                border: '1px solid rgba(236, 72, 153, 0.4)'
                              }}
                            >
                              ANIME
                            </span>
                          </div>
                          <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                            <p style={{ fontSize: '12px', fontWeight: '600', color: T.isLight ? '#1a1208' : '#f4f4f5', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
                              {cleanTitleText(item.title)}
                            </p>
                            <span style={{ fontSize: '10px', color: '#ec4899', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                              <Play size={10} fill="#ec4899" /> Play Anime
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* HDHub4u Live Category View */}
              {!isSearching && activeCategory === 'hdhub4u' && (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: T.isLight ? 'rgba(217, 119, 6, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                      border: T.isLight ? '1px solid rgba(217, 119, 6, 0.22)' : '1px solid rgba(245, 158, 11, 0.2)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      marginBottom: '14px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="online-dot" style={{ background: '#22c55e' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: T.isLight ? '#b45309' : '#fbbf24' }}>
                          Live HDHub4u Mirror: {hdhubLiveHost ? hdhubLiveHost.replace('https://', '') : 'Auto-Resolving...'}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: T.isLight ? '#78716c' : '#a1a1aa', marginTop: '2px' }}>
                        {isHdhubLoading ? 'Scraping live website...' : `Found ${hdhubResults.length} real-time movies from live mirror`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => fetchHdhubLive(searchQuery)}
                        style={{
                          padding: '6px 10px',
                          fontSize: '11px',
                          background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                          border: T.isLight ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(255,255,255,0.1)',
                          color: T.isLight ? '#1a1208' : '#f4f4f5',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                        title="Refresh Live Content"
                      >
                        <RefreshCw size={12} className={isHdhubLoading ? 'spinning' : ''} />
                      </button>

                      <a
                        href={hdhubLiveHost || 'https://new5.hdhub4u.cl'}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          padding: '6px 12px',
                          fontSize: '11px',
                          background: T.isLight ? 'rgba(217, 119, 6, 0.15)' : 'rgba(245, 158, 11, 0.2)',
                          border: T.isLight ? '1px solid rgba(217, 119, 6, 0.35)' : '1px solid rgba(245, 158, 11, 0.4)',
                          color: T.isLight ? '#b45309' : '#fef3c7',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '600',
                          borderRadius: '8px'
                        }}
                      >
                        View Site <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {isHdhubLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                      <RefreshCw size={24} color="#fbbf24" className="spinning" style={{ margin: '0 auto 10px' }} />
                      <p style={{ fontSize: '12px', color: T.isLight ? '#78716c' : '#a1a1aa' }}>Fetching live movies from HDHub4u...</p>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px' }}>
                      {hdhubResults.map((m, i) => {
                        const isResolving = resolvingMovieId === m.url;
                        return (
                          <div
                            key={m.id || i}
                            onClick={() => !isResolving && handleSelectHdhubMovie(m)}
                            style={{
                              background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.02)',
                              border: isResolving ? '1px solid #fbbf24' : (T.isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)'),
                              boxShadow: T.isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              cursor: isResolving ? 'wait' : 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column',
                              opacity: resolvingMovieId && !isResolving ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!isResolving) {
                                e.currentTarget.style.borderColor = '#ff5500';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isResolving) {
                                e.currentTarget.style.borderColor = T.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
                                e.currentTarget.style.transform = 'translateY(0)';
                              }
                            }}
                          >
                            <div style={{ width: '100%', aspectRatio: '2/3', background: '#121216', position: 'relative' }}>
                              {m.poster ? (
                                <img src={m.poster} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                  <Film size={24} color="#71717a" />
                                </div>
                              )}
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  left: '6px',
                                  background: 'rgba(0,0,0,0.75)',
                                  backdropFilter: 'blur(4px)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '9px',
                                  fontWeight: '700',
                                  color: '#fbbf24',
                                  border: '1px solid rgba(245,158,11,0.3)'
                                }}
                              >
                                HDHUB4U
                              </span>
                              {m.year && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    bottom: '6px',
                                    right: '6px',
                                    background: 'rgba(0,0,0,0.75)',
                                    padding: '2px 5px',
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    color: '#d4d4d8'
                                  }}
                                >
                                  {m.year}
                                </span>
                              )}
                            </div>
                            <div style={{ padding: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <p
                                style={{
                                  fontSize: '11px',
                                  fontWeight: '600',
                                  color: T.isLight ? '#1a1208' : '#f4f4f5',
                                  lineHeight: '1.3',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                              >
                                {cleanTitleText(m.title)}
                              </p>
                              <span
                                style={{
                                  fontSize: '10px',
                                  color: isResolving ? '#fbbf24' : '#ff5500',
                                  marginTop: '6px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: '600'
                                }}
                              >
                                {isResolving ? (
                                  <>
                                    <RefreshCw size={10} className="spinning" /> Connecting...
                                  </>
                                ) : (
                                  <>
                                    <Play size={10} fill="#ff5500" /> Play in Lounge
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Matching Search Results (When user types a search query and results are returned) */}
              {!isSearching && searchQuery.trim() && (searchResults.movies.length > 0 || searchResults.youtube.length > 0) && activeCategory !== 'hdhub4u' && activeCategory !== 'watchanimeworld' && (
                <div>
                  {/* Results Header with clear button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.isLight ? '#524538' : '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🍿 Matching Results for "{searchQuery}" ({searchResults.movies.length + searchResults.youtube.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults({ movies: [], youtube: [] });
                      }}
                      style={{
                        fontSize: '11px',
                        color: '#ff5500',
                        background: T.isLight ? 'rgba(255, 85, 0, 0.08)' : 'rgba(255, 85, 0, 0.15)',
                        border: '1px solid rgba(255, 85, 0, 0.25)',
                        borderRadius: '6px',
                        padding: '3px 8px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      ✕ Clear Search
                    </button>
                  </div>

                  {/* Cinema Movies Grid */}
                  {searchResults.movies.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px', marginBottom: searchResults.youtube.length > 0 ? '16px' : '0' }}>
                      {searchResults.movies.map((m) => {
                        const isResolving = resolvingMovieId === (m.id || m.url);
                        return (
                          <div
                            key={m.id || m.url}
                            onClick={() => !isResolving && handleSelectSearchResult(m)}
                            style={{
                              background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                              border: T.isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                              boxShadow: T.isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                              borderRadius: '12px',
                              overflow: 'hidden',
                              cursor: isResolving ? 'wait' : 'pointer',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              flexDirection: 'column'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#ff5500';
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              if (T.isLight) e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 85, 0, 0.12)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = T.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
                              e.currentTarget.style.transform = 'translateY(0)';
                              if (T.isLight) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                            }}
                          >
                            <div style={{ width: '100%', aspectRatio: '2/3', background: '#121216', position: 'relative' }}>
                              {m.poster ? (
                                <img src={m.poster} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                  <Film size={28} color="#71717a" />
                                </div>
                              )}
                              {m.rating && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    background: 'rgba(0,0,0,0.78)',
                                    backdropFilter: 'blur(4px)',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    color: '#fbbf24',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                >
                                  <Star size={10} fill="#fbbf24" /> {m.rating}
                                </span>
                              )}
                              {m.year && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    bottom: '6px',
                                    left: '6px',
                                    background: 'rgba(0,0,0,0.7)',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontSize: '9.5px',
                                    fontWeight: '600',
                                    color: '#ffffff'
                                  }}
                                >
                                  {m.year}
                                </span>
                              )}
                            </div>
                            <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <p
                                  style={{
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    color: T.isLight ? '#1a1208' : '#f4f4f5',
                                    lineHeight: '1.3',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                    margin: 0
                                  }}
                                >
                                  {cleanTitleText(m.title)}
                                </p>
                                <p style={{ fontSize: '10px', color: T.isLight ? '#78716c' : '#a1a1aa', margin: '2px 0 0' }}>
                                  {m.genre || (m.year ? `Cinema • ${m.year}` : 'Cinema Stream')}
                                </p>
                              </div>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  color: isResolving ? '#f59e0b' : '#ff5500',
                                  marginTop: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontWeight: '700'
                                }}
                              >
                                {isResolving ? (
                                  <>
                                    <RefreshCw size={11} className="spinning" /> Connecting...
                                  </>
                                ) : (
                                  <>
                                    <Play size={11} fill="#ff5500" /> Play in Lounge
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* YouTube Streams if any */}
                  {searchResults.youtube.length > 0 && (
                    <div style={{ marginTop: '14px' }}>
                      <h4 style={{ fontSize: '11.5px', fontWeight: '700', color: T.isLight ? '#524538' : '#a1a1aa', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        ▶️ YouTube Video Results ({searchResults.youtube.length})
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {searchResults.youtube.map((v) => (
                          <div
                            key={v.id}
                            onClick={() => handleSelectSearchResult(v)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '8px 12px',
                              borderRadius: '10px',
                              background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.02)',
                              border: T.isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                              boxShadow: T.isLight ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#ff5500';
                              e.currentTarget.style.background = T.isLight ? 'rgba(255, 85, 0, 0.04)' : 'rgba(255, 85, 0, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = T.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
                              e.currentTarget.style.background = T.isLight ? '#ffffff' : 'rgba(255,255,255,0.02)';
                            }}
                          >
                            <div style={{ width: '88px', height: '52px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                              <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              {v.duration && (
                                <span style={{ position: 'absolute', bottom: '2px', right: '3px', background: 'rgba(0,0,0,0.8)', padding: '1px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: '700', color: '#fff' }}>
                                  {v.duration}
                                </span>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: '12.5px', fontWeight: '600', color: T.isLight ? '#1a1208' : '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                                {v.title}
                              </p>
                              <span style={{ fontSize: '11px', color: '#ff5500', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontWeight: '600' }}>
                                <Play size={10} fill="#ff5500" /> 1-Click Play in Lounge
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Empty Search State (User typed a query, but 0 matches found) */}
              {!isSearching && searchQuery.trim() && searchResults.movies.length === 0 && searchResults.youtube.length === 0 && activeCategory !== 'hdhub4u' && activeCategory !== 'watchanimeworld' && (
                <div style={{ textAlign: 'center', padding: '24px 16px', background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.02)', borderRadius: '14px', border: T.isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)' }}>
                  <Film size={32} color="#ff5500" style={{ margin: '0 auto 8px' }} />
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: T.isLight ? '#1a1208' : '#f4f4f5', margin: '0 0 4px' }}>
                    No direct streams found for "{searchQuery}"
                  </h4>
                  <p style={{ fontSize: '12px', color: T.isLight ? '#78716c' : '#a1a1aa', margin: '0 0 14px' }}>
                    Try another spelling or pick from trending popular cinema below:
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults({ movies: [], youtube: [] });
                    }}
                    style={{
                      padding: '7px 16px',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #ff5500 0%, #ea580c 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Browse Trending Movies
                  </button>
                </div>
              )}

              {/* Neural Plot (AI) Category View when no search query is typed */}
              {!isSearching && activeCategory === 'neural' && !searchQuery.trim() && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Neural AI Banner */}
                  <div
                    style={{
                      background: T.isLight ? 'linear-gradient(135deg, rgba(255, 85, 0, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)' : 'linear-gradient(135deg, rgba(255, 85, 0, 0.15) 0%, rgba(234, 88, 12, 0.06) 100%)',
                      border: T.isLight ? '1px solid rgba(255, 85, 0, 0.22)' : '1px solid rgba(255, 85, 0, 0.35)',
                      borderRadius: '12px',
                      padding: '12px 14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Sparkles size={16} color="#ff5500" />
                      <span style={{ fontSize: '13px', fontWeight: '800', color: T.isLight ? '#c2410c' : '#ff7733', fontFamily: 'Outfit, sans-serif' }}>
                        🧠 Neural AI Plot & Scene Search
                      </span>
                    </div>
                    <p style={{ fontSize: '11.5px', color: T.isLight ? '#524538' : '#d4d4d8', margin: '4px 0 10px', lineHeight: 1.4 }}>
                      Describe any movie memory, vague scene, or dialog (e.g. <em>"hero goes inside black hole to save daughter"</em> or <em>"ladka ladki train me milte hain"</em>) and Groq AI will instantly find and stream it!
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        'Astronaut enters black hole to save daughter',
                        'A thief enters dreams within dreams',
                        'Boy and girl swap bodies across time',
                        'Joker terrorizes Gotham hospital',
                        'Hero gets stuck in time loop battle'
                      ].map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => {
                            setSearchQuery(promptText);
                            performSearch(promptText, true);
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            background: T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)',
                            border: T.isLight ? '1px solid rgba(255, 85, 0, 0.25)' : '1px solid rgba(255, 85, 0, 0.35)',
                            color: T.isLight ? '#9a3412' : '#fdba74',
                            borderRadius: '14px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#ff5500';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.color = T.isLight ? '#9a3412' : '#fdba74';
                          }}
                        >
                          "{promptText}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section Title */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '800', color: T.isLight ? '#1a1208' : '#f4f4f5', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                        ✨ AI Recommended & Mind-Bending Cinema
                      </h4>
                      <p style={{ fontSize: '11px', color: T.isLight ? '#78716c' : '#a1a1aa', margin: '2px 0 0' }}>
                        Curated neural cinema matches ready to stream in Lounge
                      </p>
                    </div>
                  </div>

                  {/* Grid of AI Recommended Movies with Posters */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px' }}>
                    {(aiRecommendations.length > 0 ? aiRecommendations : FEATURED_CINEMA_MOVIES).map((movie, mIdx) => {
                      const isResolving = resolvingMovieId === (movie.id || movie.title);
                      const posterUrl = movie.poster || POPULAR_POSTERS[movie.title?.toLowerCase()] || (movie.backdrop ? movie.backdrop : null);
                      return (
                        <div
                          key={mIdx}
                          onClick={() => !isResolving && handleSelectSearchResult(movie)}
                          style={{
                            background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                            border: T.isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                            boxShadow: T.isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: isResolving ? 'wait' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#ff5500';
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            if (T.isLight) e.currentTarget.style.boxShadow = '0 6px 18px rgba(255, 85, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = T.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            if (T.isLight) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                          }}
                        >
                          <div style={{ width: '100%', aspectRatio: '2/3', background: '#121216', position: 'relative' }}>
                            {posterUrl ? (
                              <img src={posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                            ) : (
                              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                <Film size={28} color="#71717a" />
                              </div>
                            )}
                            <span
                              style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                background: 'rgba(0,0,0,0.78)',
                                backdropFilter: 'blur(4px)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '9px',
                                fontWeight: '700',
                                color: '#ff5500',
                                border: '1px solid rgba(255,85,0,0.35)'
                              }}
                            >
                              ✨ AI PICK
                            </span>
                            {movie.rating && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: 'rgba(0,0,0,0.78)',
                                  backdropFilter: 'blur(4px)',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  color: '#fbbf24',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <Star size={10} fill="#fbbf24" /> {movie.rating}
                              </span>
                            )}
                            {movie.year && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '6px',
                                  right: '6px',
                                  background: 'rgba(0,0,0,0.75)',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: '#ffffff'
                                }}
                              >
                                {movie.year}
                              </span>
                            )}
                          </div>
                          <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <p
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: T.isLight ? '#1a1208' : '#f4f4f5',
                                  lineHeight: '1.3',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  margin: 0
                                }}
                              >
                                {cleanTitleText(movie.title)}
                              </p>
                              <p style={{ fontSize: '10px', color: T.isLight ? '#78716c' : '#a1a1aa', margin: '2px 0 0', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {movie.whyWatch || movie.genre || 'AI Curated Match'}
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: '10.5px',
                                color: isResolving ? '#f59e0b' : '#ff5500',
                                marginTop: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: '700'
                              }}
                            >
                              {isResolving ? (
                                <>
                                  <RefreshCw size={11} className="spinning" /> Connecting...
                                </>
                              ) : (
                                <>
                                  <Play size={11} fill="#ff5500" /> Play in Lounge
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Clean Default State: FEATURED & TRENDING CINEMA WITH POSTER BANNERS */}
              {!isSearching && activeCategory !== 'neural' && (!searchQuery.trim() || (searchResults.movies.length === 0 && searchResults.youtube.length === 0 && activeCategory !== 'hdhub4u' && activeCategory !== 'watchanimeworld')) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Section Title */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <div>
                      <h4 style={{ fontSize: '13px', fontWeight: '800', color: T.isLight ? '#1a1208' : '#f4f4f5', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                        🎬 Featured Cinema & Trending Stream Picks
                      </h4>
                      <p style={{ fontSize: '11px', color: T.isLight ? '#78716c' : '#a1a1aa', margin: '2px 0 0' }}>
                        Click any movie to immediately load and stream together in your Lounge
                      </p>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#ff5500',
                        background: T.isLight ? 'rgba(255, 85, 0, 0.08)' : 'rgba(255, 85, 0, 0.15)',
                        border: '1px solid rgba(255, 85, 0, 0.25)',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}
                    >
                      READY TO STREAM
                    </span>
                  </div>

                  {/* Grid of Featured Movies with Posters */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px' }}>
                    {FEATURED_CINEMA_MOVIES.map((movie) => {
                      const isResolving = resolvingMovieId === movie.id;
                      return (
                        <div
                          key={movie.id}
                          onClick={() => !isResolving && handleSelectSearchResult(movie)}
                          style={{
                            background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.03)',
                            border: T.isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)',
                            boxShadow: T.isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: isResolving ? 'wait' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#ff5500';
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            if (T.isLight) e.currentTarget.style.boxShadow = '0 6px 18px rgba(255, 85, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = T.isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            if (T.isLight) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                          }}
                        >
                          <div style={{ width: '100%', aspectRatio: '2/3', background: '#121216', position: 'relative' }}>
                            <img
                              src={movie.poster}
                              alt={movie.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg';
                              }}
                            />
                            <span
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                background: 'rgba(0,0,0,0.78)',
                                backdropFilter: 'blur(4px)',
                                padding: '2px 6px',
                                borderRadius: '6px',
                                fontSize: '10px',
                                fontWeight: '700',
                                color: '#fbbf24',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Star size={10} fill="#fbbf24" /> {movie.rating}
                            </span>
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '6px',
                                left: '6px',
                                background: 'rgba(0,0,0,0.72)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontSize: '9.5px',
                                fontWeight: '600',
                                color: '#ffffff'
                              }}
                            >
                              {movie.year}
                            </span>
                          </div>
                          <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <p
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: T.isLight ? '#1a1208' : '#f4f4f5',
                                  lineHeight: '1.3',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  margin: 0
                                }}
                              >
                                {movie.title}
                              </p>
                              <p style={{ fontSize: '10px', color: T.isLight ? '#78716c' : '#a1a1aa', margin: '2px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {movie.genre}
                              </p>
                            </div>
                            <span
                              style={{
                                fontSize: '10.5px',
                                color: isResolving ? '#f59e0b' : '#ff5500',
                                marginTop: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: '700'
                              }}
                            >
                              {isResolving ? (
                                <>
                                  <RefreshCw size={11} className="spinning" /> Connecting...
                                </>
                              ) : (
                                <>
                                  <Play size={11} fill="#ff5500" /> Play in Lounge
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI RECOMMENDED DETAILED TAB */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchAiRecommendations();
              }}
              style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}
            >
              <div style={{ position: 'relative', flex: 1 }}>
                <Sparkles size={16} color="#ff5500" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Describe your movie mood (e.g. mind-bending sci-fi, cozy rom-com, dark mystery)..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    height: '40px',
                    fontSize: '13px',
                    background: T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                    border: T.isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: T.isLight ? '#1a1208' : '#f4f4f5',
                    boxShadow: T.isLight ? '0 1px 4px rgba(0,0,0,0.03)' : 'none',
                    outline: 'none'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#ff5500')}
                  onBlur={(e) => (e.target.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)')}
                />
              </div>
              <button
                type="submit"
                disabled={isAiLoading}
                style={{
                  padding: '0 20px',
                  height: '40px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #ff5500 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  boxShadow: '0 2px 10px rgba(255, 85, 0, 0.28)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {isAiLoading ? 'Asking AI...' : 'Ask AI'}
              </button>
            </form>

            {/* Quick Inspiration Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {[
                '🍿 Mind-Bending Sci-Fi Thrillers',
                '❤️ Cozy Date Night Rom-Coms',
                '🔪 Spine-Chilling Murder Mystery',
                '🌸 Feel-Good Studio Ghibli Anime',
                '🔥 High-Octane Action Blockbusters'
              ].map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAiPrompt(pill);
                    fetchAiRecommendations(pill);
                  }}
                  style={{
                    background: T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                    border: T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '16px',
                    padding: '4px 11px',
                    fontSize: '11px',
                    color: T.isLight ? '#524538' : '#a1a1aa',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ff5500';
                    e.currentTarget.style.borderColor = '#ff5500';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = T.isLight ? '#524538' : '#a1a1aa';
                    e.currentTarget.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* AI Recommendations Grid with Poster Banners (Matching Movie Preview Layout) */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {isAiLoading ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#ff5500' }}>
                  <Sparkles size={28} className="spinning" style={{ margin: '0 auto 10px' }} />
                  <p style={{ fontSize: '13.5px', fontWeight: '700', color: T.isLight ? '#1a1208' : '#f4f4f5', margin: 0 }}>
                    Groq AI is finding matches tailored to your watch history...
                  </p>
                  <p style={{ fontSize: '11px', color: T.isLight ? '#78716c' : '#a1a1aa', marginTop: '4px' }}>
                    Analyzing tone, cinematography, and couple lounge vibes
                  </p>
                </div>
              ) : aiRecommendations.length > 0 ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: '700', color: T.isLight ? '#524538' : '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ✨ AI Curated Movie Picks ({aiRecommendations.length})
                    </h4>
                    <button
                      type="button"
                      onClick={() => fetchAiRecommendations()}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        background: T.isLight ? 'rgba(255, 85, 0, 0.08)' : 'rgba(255, 85, 0, 0.15)',
                        border: '1px solid rgba(255, 85, 0, 0.25)',
                        color: '#ff5500',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: '600'
                      }}
                      title="Refresh AI Recommendations"
                    >
                      <RefreshCw size={11} className={isAiLoading ? 'spinning' : ''} /> Refresh AI
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '12px' }}>
                    {aiRecommendations.map((movie, idx) => {
                      const isResolving = resolvingMovieId === (movie.id || movie.url || movie.title);
                      const posterUrl = movie.poster || POPULAR_POSTERS[movie.title?.toLowerCase()] || (movie.backdrop ? movie.backdrop : null);
                      return (
                        <div
                          key={idx}
                          onClick={() => !isResolving && handleSelectSearchResult(movie)}
                          style={{
                            background: T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.03)',
                            border: isResolving ? '1px solid #ff5500' : (T.isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.06)'),
                            borderRadius: '12px',
                            overflow: 'hidden',
                            cursor: isResolving ? 'wait' : 'pointer',
                            boxShadow: T.isLight ? '0 2px 8px rgba(0,0,0,0.04)' : 'none',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            flexDirection: 'column'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#ff5500';
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            if (T.isLight) e.currentTarget.style.boxShadow = '0 6px 18px rgba(255, 85, 0, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.06)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            if (T.isLight) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                          }}
                        >
                          <div style={{ width: '100%', aspectRatio: '2/3', background: '#121216', position: 'relative' }}>
                            {posterUrl ? (
                              <img src={posterUrl} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                            ) : (
                              <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' }}>
                                <Film size={28} color="#ff5500" />
                              </div>
                            )}
                            <span
                              style={{
                                position: 'absolute',
                                top: '6px',
                                left: '6px',
                                background: 'rgba(0,0,0,0.78)',
                                backdropFilter: 'blur(4px)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '9px',
                                fontWeight: '700',
                                color: '#ff5500',
                                border: '1px solid rgba(255,85,0,0.35)'
                              }}
                            >
                              ✨ AI PICK
                            </span>
                            {movie.rating && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '6px',
                                  right: '6px',
                                  background: 'rgba(0,0,0,0.78)',
                                  backdropFilter: 'blur(4px)',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: '700',
                                  color: '#fbbf24',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '3px'
                                }}
                              >
                                <Star size={10} fill="#fbbf24" /> {movie.rating}
                              </span>
                            )}
                            {movie.year && (
                              <span
                                style={{
                                  position: 'absolute',
                                  bottom: '6px',
                                  right: '6px',
                                  background: 'rgba(0,0,0,0.75)',
                                  padding: '2px 5px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: '#ffffff'
                                }}
                              >
                                {movie.year}
                              </span>
                            )}
                          </div>

                          <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <p
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: T.isLight ? '#1a1208' : '#f4f4f5',
                                  lineHeight: '1.3',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  margin: 0
                                }}
                                title={movie.title}
                              >
                                {cleanTitleText(movie.title)}
                              </p>
                              <p
                                style={{
                                  fontSize: '10px',
                                  color: T.isLight ? '#78716c' : '#a1a1aa',
                                  margin: '2px 0 0',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 1,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden'
                                }}
                                title={movie.whyWatch || movie.overview || movie.genre}
                              >
                                {movie.whyWatch || movie.genre || 'Recommended'}
                              </p>
                            </div>

                            <span
                              style={{
                                fontSize: '10.5px',
                                color: isResolving ? '#fbbf24' : '#ff5500',
                                marginTop: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontWeight: '700'
                              }}
                            >
                              {isResolving ? (
                                <>
                                  <RefreshCw size={10} className="spinning" /> Connecting...
                                </>
                              ) : (
                                <>
                                  <Play size={10} fill="#ff5500" /> Play in Lounge
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: T.isLight ? '#78716c' : '#a1a1aa' }}>
                  <Sparkles size={24} color="#ff5500" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>Type any vibe or choose a quick prompt above!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: LOCAL 4K FILE */}
        {activeTab === 'local' && (
          <div style={{ textAlign: 'center', padding: '28px 20px', background: T.isLight ? '#ffffff' : 'rgba(255,255,255,0.02)', border: T.isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', boxShadow: T.isLight ? '0 2px 8px rgba(0,0,0,0.03)' : 'none' }}>
            <HardDrive size={38} color="#ff5500" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '800', color: T.isLight ? '#1a1208' : '#f4f4f5', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>Local 4K / 1080p File Co-Watching</h4>
            <p style={{ fontSize: '12px', color: T.isLight ? '#6b5a44' : '#a1a1aa', lineHeight: '1.5', marginBottom: '18px', maxWidth: '420px', margin: '0 auto 18px' }}>
              If you both have the movie downloaded on your laptops (from HDHub4u or Torrents), select it here!
              Zero buffering, zero cloud uploads, and 100% frame-sync co-watching!
            </p>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff5500 0%, #ea580c 100%)',
                border: 'none',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(255, 85, 0, 0.28)',
                cursor: 'pointer'
              }}
            >
              Select Video File from PC
              <input
                type="file"
                accept="video/*"
                onChange={handleLocalFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {localFileName && (
              <p style={{ marginTop: '12px', fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>
                ✓ Selected: {localFileName}
              </p>
            )}
          </div>
        )}

        {/* TAB 4: CUSTOM LINK */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomUrlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: T.isLight ? 'rgba(255, 85, 0, 0.06)' : 'rgba(245, 158, 11, 0.06)', border: T.isLight ? '1px solid rgba(255, 85, 0, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', padding: '10px 14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: T.isLight ? '#c2410c' : '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Film size={14} /> HDHub4u & Custom Direct Streams Supported
              </span>
              <p style={{ fontSize: '11px', color: T.isLight ? '#78716c' : '#a1a1aa', marginTop: '4px', lineHeight: '1.4', margin: '4px 0 0' }}>
                Paste any online streaming link from HDHub4u (HubCloud, FilePress, DoodStream) or direct MP4/M3U8 link to stream in synchronized clarity!
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: T.isLight ? '#524538' : '#a1a1aa', marginBottom: '6px', fontWeight: '600' }}>
                Paste Stream / Embed / MP4 URL:
              </label>
              <input
                type="url"
                required
                placeholder="https://hubcloud... or https://..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  background: T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                  border: T.isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: T.isLight ? '#1a1208' : '#f4f4f5',
                  outline: 'none'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ff5500')}
                onBlur={(e) => (e.target.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: T.isLight ? '#524538' : '#a1a1aa', marginBottom: '6px', fontWeight: '600' }}>
                Movie Title (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Stree 2 (HDHub4u)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  fontSize: '13px',
                  background: T.isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.04)',
                  border: T.isLight ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: T.isLight ? '#1a1208' : '#f4f4f5',
                  outline: 'none'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#ff5500')}
                onBlur={(e) => (e.target.style.borderColor = T.isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.1)')}
              />
            </div>
            <button
              type="submit"
              style={{
                marginTop: '8px',
                padding: '11px 16px',
                fontSize: '12px',
                fontWeight: '700',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ff5500 0%, #ea580c 100%)',
                border: 'none',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(255, 85, 0, 0.28)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Play size={14} fill="#ffffff" /> Load Stream for Lounge
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
