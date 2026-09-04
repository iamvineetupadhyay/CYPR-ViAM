import React, { useState, useEffect } from 'react';
import { Search, Film, Video, Globe, HardDrive, X, Play, Star, Clock, Sparkles, ExternalLink, RefreshCw } from 'lucide-react';
import { CURATED_COUPLE_PICKS, HDHUB4U_TOP_PICKS, detectSourceType } from '../utils/movieSources';
import { SERVER_URL } from '../utils/apiUrl';

export default function SourcePicker({ isOpen, onClose, onSelectMedia, initialQuery = '' }) {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'local' | 'custom'
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'hdhub4u' | 'vibes'
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState({ movies: [], youtube: [] });
  const [hdhubResults, setHdhubResults] = useState([]);
  const [hdhubLiveHost, setHdhubLiveHost] = useState('');
  const [isHdhubLoading, setIsHdhubLoading] = useState(false);
  const [resolvingMovieId, setResolvingMovieId] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [localFileName, setLocalFileName] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const fetchAiRecommendations = async (promptQuery) => {
    const q = promptQuery || aiPrompt || 'Top trending movies';
    setIsAiLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (data.recommendations) {
        setAiRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('[AI Recommendation Error]', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSelectAiMovie = (movie) => {
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

  // Load live HDHub4u content when user selects HDHub4u tab
  useEffect(() => {
    if (activeCategory === 'hdhub4u' && hdhubResults.length === 0) {
      fetchHdhubLive(searchQuery);
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

  const performSearch = async (q, isNeural = false) => {
    if (!q || !q.trim()) return;
    setIsSearching(true);
    try {
      const endpoint = (isNeural || activeCategory === 'neural') ? '/api/search/neural' : '/api/search/all';
      // Parallel fetch: TMDB/YT and HDHub4u
      const [allRes] = await Promise.all([
        fetch(`${SERVER_URL}${endpoint}?q=${encodeURIComponent(q.trim())}`).then(r => r.json()).catch(() => ({ movies: [], youtube: [] })),
        fetchHdhubLive(q.trim())
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeCategory === 'hdhub4u') {
      fetchHdhubLive(searchQuery);
    } else {
      performSearch(searchQuery);
    }
  };

  const handleSelectSearchResult = async (item) => {
    // 1. Direct streams (.mp4, .m3u8) -> OUR NATIVE PLAYER!
    if (item.type === 'direct' || item.url?.includes('.mp4') || item.url?.includes('.m3u8')) {
      onSelectMedia({
        sourceType: 'direct',
        url: item.url,
        title: item.title + (item.year ? ` (${item.year})` : ''),
        servers: item.servers || [{ name: '🔥 CYPR Native Cinema (Direct)', url: item.url, sourceType: 'direct' }]
      });
      onClose();
      return;
    }

    // 2. HDHub4u post or streaming link -> Auto-resolve directly to our player!
    if (item.isHdhubLive || item.url?.includes('hdhub4u') || item.url?.includes('hdstream4u') || item.url?.includes('vidhide')) {
      handleSelectHdhubMovie(item);
      return;
    }

    // 3. YouTube video -> YouTube API in our stage!
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

    // 4. If an external embed movie is clicked, attempt auto-resolution to direct HLS!
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
    if (url.includes('hdhub4u') || url.includes('hdstream4u') || url.includes('vidhide') || url.includes('streamhide')) {
      handleSelectHdhubMovie({ url, title: customTitle.trim() || 'Custom HDHub Stream' });
      return;
    }
    const detectedType = detectSourceType(url);
    onSelectMedia({
      sourceType: detectedType,
      url,
      title: customTitle.trim() || 'Custom Stream'
    });
    onClose();
  };

  const handleLocalFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileUrl = URL.createObjectURL(file);
    setLocalFileName(file.name);
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
      style={{ cursor: 'pointer' }}
    >
      <div
        className="modal-content"
        style={{ maxWidth: '640px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', cursor: 'default' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Elegant Hand-Drawn Movie Selection Banner */}
        <div style={{
          position: 'relative', borderRadius: '18px', overflow: 'hidden',
          marginBottom: '16px', border: '1.5px solid rgba(255, 85, 0, 0.4)',
          maxHeight: '130px', boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
        }}>
          <img
            src="/movie_picker_illustration.jpg"
            alt="Couple Movie Selection"
            style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(11,8,6,0.92) 25%, rgba(11,8,6,0.2) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: '#ff5500', letterSpacing: '1px', textTransform: 'uppercase' }}>
                MOVIE DATE SELECTION
              </span>
              <h3 style={{ fontSize: '20px', fontWeight: '900', color: '#fff', margin: '3px 0 2px', fontFamily: 'Outfit, sans-serif' }}>
                Pick a Movie Together
              </h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>
                Search movies, series, or YouTube videos to stream in 0ms sync
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
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('search')}
            className={`btn ${activeTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1.2, fontSize: '12px' }}
          >
            <Search size={14} /> Instant Search
          </button>
          <button
            onClick={() => {
              setActiveTab('ai');
              if (aiRecommendations.length === 0) {
                fetchAiRecommendations('Top trending romantic and mind-bending movies');
              }
            }}
            className={`btn ${activeTab === 'ai' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              flex: 1.3,
              fontSize: '12px',
              background: activeTab === 'ai' ? 'linear-gradient(135deg, #ff5500, #ea580c)' : 'rgba(255, 85, 0, 0.1)',
              color: activeTab === 'ai' ? '#fff' : '#ff5500',
              borderColor: 'rgba(255, 85, 0, 0.3)'
            }}
          >
            <Sparkles size={14} /> AI Genie (Groq)
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`btn ${activeTab === 'local' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '12px' }}
          >
            <HardDrive size={14} /> Local 4K File
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`btn ${activeTab === 'custom' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, fontSize: '12px' }}
          >
            <Globe size={14} /> Custom Link
          </button>
        </div>

        {/* TAB 1: INSTANT SEARCH (Default & Easy) */}
        {activeTab === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Search Input Bar */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type movie or song name (e.g. Interstellar, Pathaan, Lofi, Titanic)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="chat-input"
                  style={{ width: '100%', paddingLeft: '38px', fontSize: '13px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSearching}>
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  performSearch(searchQuery, false);
                }}
                className={`btn ${activeCategory === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}
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
                className={`btn ${activeCategory === 'neural' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: activeCategory === 'neural' ? 'linear-gradient(135deg, #ff5500, #ea580c)' : 'rgba(255, 85, 0, 0.12)',
                  color: activeCategory === 'neural' ? '#fff' : '#ff5500',
                  borderColor: 'rgba(255, 85, 0, 0.35)'
                }}
              >
                <Sparkles size={12} />
                <span>Neural Plot (AI)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('hdhub4u')}
                className={`btn ${activeCategory === 'hdhub4u' ? 'btn-primary' : 'btn-secondary'}`}
                style={{
                  padding: '4px 12px',
                  fontSize: '11px',
                  borderRadius: '20px',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  background: activeCategory === 'hdhub4u' ? 'linear-gradient(135deg, #f59e0b, #ea580c)' : 'rgba(245, 158, 11, 0.1)',
                  color: activeCategory === 'hdhub4u' ? '#fff' : '#fbbf24',
                  borderColor: 'rgba(245, 158, 11, 0.3)'
                }}
              >
                <Zap size={12} />
                <span>HDHub4u Stream</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCategory('vibes')}
                className={`btn ${activeCategory === 'vibes' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '11px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <Video size={12} />
                <span>Lofi & Vibes</span>
              </button>
            </div>

            {/* Results Container */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* HDHub4u Live Dynamic Category View (Zero Hardcoded!) */}
              {activeCategory === 'hdhub4u' && (
                <div>
                  {/* Live Host Banner with "View Full Site" Button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(234, 88, 12, 0.08))',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '10px',
                      padding: '10px 14px',
                      marginBottom: '14px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="online-dot" style={{ background: '#22c55e' }} />
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24' }}>
                          Live HDHub4u Server: {hdhubLiveHost ? hdhubLiveHost.replace('https://', '') : 'Auto-Resolving...'}
                        </span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {isHdhubLoading ? 'Scraping live website...' : `Found ${hdhubResults.length} real-time movies from official mirror`}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => fetchHdhubLive(searchQuery)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                        title="Refresh Live Content"
                      >
                        <RefreshCw size={12} className={isHdhubLoading ? 'spinning' : ''} />
                      </button>

                      <a
                        href={hdhubLiveHost || 'https://new5.hdhub4u.cl'}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-primary"
                        style={{
                          padding: '6px 14px',
                          fontSize: '11px',
                          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                          color: '#fff',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: '700',
                          borderRadius: '8px'
                        }}
                        title="Open official live HDHub4u site in new tab"
                      >
                        View Full Site <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {/* Loading Skeleton or Live Scraped Movie Grid */}
                  {isHdhubLoading ? (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                      <RefreshCw size={28} color="#f59e0b" className="spinning" style={{ margin: '0 auto 10px' }} />
                      <p style={{ fontSize: '13px', color: 'var(--text-sub)' }}>
                        Fetching real-time content from live HDHub4u mirror...
                      </p>
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
                              background: 'rgba(255,255,255,0.03)',
                              border: isResolving ? '1px solid #f59e0b' : '1px solid var(--border-glass)',
                              borderRadius: '10px',
                              overflow: 'hidden',
                              cursor: isResolving ? 'wait' : 'pointer',
                              transition: 'var(--transition-smooth)',
                              display: 'flex',
                              flexDirection: 'column',
                              opacity: resolvingMovieId && !isResolving ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!isResolving) {
                                e.currentTarget.style.borderColor = '#f59e0b';
                                e.currentTarget.style.transform = 'scale(1.02)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isResolving) {
                                e.currentTarget.style.borderColor = 'var(--border-glass)';
                                e.currentTarget.style.transform = 'scale(1)';
                              }
                            }}
                          >
                            <div style={{ width: '100%', aspectRatio: '2/3', background: '#111', position: 'relative' }}>
                              {m.poster ? (
                                <img src={m.poster} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                  <Film size={24} color="var(--text-sub)" />
                                </div>
                              )}
                              <span style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(245,158,11,0.85)', backdropFilter: 'blur(4px)', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '800', color: '#000' }}>
                                HDHUB4U
                              </span>
                              {m.year && (
                                <span style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.75)', padding: '2px 5px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', color: '#fbbf24' }}>
                                  {m.year}
                                </span>
                              )}
                            </div>
                            <div style={{ padding: '8px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <p style={{ fontSize: '11px', fontWeight: '700', color: '#fff', lineHeight: '1.3', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {m.title}
                              </p>
                              <span style={{ fontSize: '10px', color: isResolving ? '#fbbf24' : '#38bdf8', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}>
                                {isResolving ? (
                                  <>
                                    <RefreshCw size={11} className="spinning" /> Connecting Streams...
                                  </>
                                ) : (
                                  <>
                                    <Play size={10} fill="#38bdf8" /> Play in Cinema
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

              {/* Movies Section from Search */}
              {activeCategory !== 'hdhub4u' && searchResults.movies.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    🍿 Cinema Movies ({searchResults.movies.length})
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                    {searchResults.movies.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectSearchResult(m)}
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-glass)',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-rose)';
                          e.currentTarget.style.transform = 'scale(1.03)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-glass)';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <div style={{ width: '100%', aspectRatio: '2/3', background: '#111', position: 'relative' }}>
                          {m.poster ? (
                            <img src={m.poster} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                              <Film size={24} color="var(--text-sub)" />
                            </div>
                          )}
                          {m.rating && (
                            <span style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Star size={10} fill="#f59e0b" /> {m.rating}
                            </span>
                          )}
                        </div>
                        <div style={{ padding: '8px' }}>
                          <p style={{ fontSize: '12px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {m.title}
                          </p>
                          <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {m.year || 'Cinema'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* YouTube Results Section */}
              {activeCategory !== 'hdhub4u' && searchResults.youtube.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ▶️ YouTube Streams & Videos ({searchResults.youtube.length})
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
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--accent-rose)';
                          e.currentTarget.style.background = 'rgba(244,63,94,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-glass)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                        }}
                      >
                        <div style={{ width: '80px', height: '48px', borderRadius: '6px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
                          <img src={v.thumbnail} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          {v.duration && (
                            <span style={{ position: 'absolute', bottom: '2px', right: '3px', background: 'rgba(0,0,0,0.8)', padding: '1px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: '700' }}>
                              {v.duration}
                            </span>
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '12px', fontWeight: '600', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {v.title}
                          </p>
                          <span style={{ fontSize: '10px', color: '#c084fc', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Play size={10} fill="#c084fc" /> 1-Click Play in Lounge
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Initial Recommended Picks if no search done yet and not in hdhub4u */}
              {activeCategory !== 'hdhub4u' && searchResults.movies.length === 0 && searchResults.youtube.length === 0 && !isSearching && (
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text-sub)', marginBottom: '10px' }}>
                    Trending / Recommended for Couples:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {CURATED_COUPLE_PICKS.map((pick, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          handleSelectSearchResult(pick);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid var(--border-glass)',
                          cursor: 'pointer',
                          transition: 'var(--transition-smooth)'
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244,63,94,0.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <Play size={14} color="#f43f5e" />
                          <span style={{ fontSize: '13px', fontWeight: '500' }}>{pick.title}</span>
                        </div>
                        <span className="media-source-pill" style={{ fontSize: '10px' }}>{pick.category}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: AI MOVIE GENIE (Groq Powered Natural Language Recommendations) */}
        {activeTab === 'ai' && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* AI Prompt Input Bar */}
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
                  placeholder="Describe what you want (e.g. mind-bending sci-fi, cute rom-com, dark mystery)..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="chat-input"
                  style={{ width: '100%', paddingLeft: '38px', fontSize: '13px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isAiLoading}>
                {isAiLoading ? 'Asking Groq...' : 'Ask AI'}
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
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    cursor: 'pointer'
                  }}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* AI Results */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {isAiLoading ? (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: '#ff5500' }}>
                  <Sparkles size={28} className="spin-animation" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px', fontWeight: '700' }}>Groq Llama 3.3 is finding perfect matches...</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Analyzing tone, cinematography, and vibes</p>
                </div>
              ) : aiRecommendations.length > 0 ? (
                aiRecommendations.map((movie, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectAiMovie(movie)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, rgba(255, 85, 0, 0.06), rgba(255, 255, 255, 0.02))',
                      border: '1px solid rgba(255, 85, 0, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ff5500';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 85, 0, 0.2)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#fff' }}>
                          {movie.title}
                        </span>
                        {movie.year && (
                          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                            ({movie.year})
                          </span>
                        )}
                        {movie.rating && (
                          <span style={{ fontSize: '10px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '1px 6px', borderRadius: '4px', fontWeight: '700' }}>
                            ⭐ {movie.rating}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '11px', color: '#ff7733', marginTop: '3px', fontWeight: '600' }}>
                        💡 {movie.whyWatch || movie.overview}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '11px', fontWeight: '700', borderRadius: '8px', flexShrink: 0, marginLeft: '12px' }}
                    >
                      <Play size={12} fill="#fff" /> Watch Now
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                  <Sparkles size={24} color="#ff5500" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: '13px', fontWeight: '600' }}>Type any vibe or choose a topic above!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LOCAL 4K FILE */}
        {activeTab === 'local' && (
          <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
            <HardDrive size={40} color="#f43f5e" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Local 4K / 1080p File Co-Watching</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px', maxWidth: '420px', margin: '0 auto 16px' }}>
              If you both have the movie downloaded on your laptops (from HDHub4u or Torrents), select it here!
              Zero buffering, zero cloud uploads, and 100% frame-sync co-watching!
            </p>
            <label className="btn btn-primary" style={{ cursor: 'pointer', padding: '10px 20px' }}>
              Select Video from PC
              <input
                type="file"
                accept="video/*"
                onChange={handleLocalFileChange}
                style={{ display: 'none' }}
              />
            </label>
            {localFileName && (
              <p style={{ marginTop: '12px', fontSize: '13px', color: '#22c55e' }}>
                ✓ Selected: {localFileName}
              </p>
            )}
          </div>
        )}

        {/* TAB 3: CUSTOM / HDHUB4U LINK */}
        {activeTab === 'custom' && (
          <form onSubmit={handleCustomUrlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '10px 14px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Film size={14} /> HDHub4u Stream Links Supported
              </span>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: '1.4' }}>
                You can copy any online streaming link from HDHub4u (HubCloud, FilePress, StreamTape, DoodStream) or direct MP4 link and paste it below to watch together in sync!
              </p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Paste HDHub4u Stream / Embed / MP4 URL:
              </label>
              <input
                type="url"
                required
                placeholder="https://hubcloud... or https://streamtape... or https://..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="chat-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Movie Title (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Stree 2 (HDHub4u)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="chat-input"
                style={{ width: '100%' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '8px' }}>
              <Play size={14} /> Load & Synchronize for Both
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
