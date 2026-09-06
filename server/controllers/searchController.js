let cachedHdhubHost = null;
let lastHdhubCheck = 0;

async function getLiveHdhubHost() {
  const now = Date.now();
  if (cachedHdhubHost && (now - lastHdhubCheck < 10 * 60 * 1000)) {
    return cachedHdhubHost;
  }
  const endpoints = [
    'https://h4.suncdn.org/host/',
    'https://points.topapii.com/host/',
    'https://ml.theapii.org/host/',
    'https://dns.pingora.fyi/v2/host'
  ];
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep, { signal: AbortSignal.timeout(3000) });
      const d = await r.json();
      if (d && d.c) {
        const rawUrl = Buffer.from(d.c, 'base64').toString();
        const u = new URL(rawUrl);
        cachedHdhubHost = `${u.protocol}//${u.host}`;
        lastHdhubCheck = now;
        return cachedHdhubHost;
      }
    } catch (e) {
      // try next
    }
  }
  return cachedHdhubHost || 'https://new5.hdhub4u.cl';
}

async function extractDirectHlsStream(embedUrl) {
  try {
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://new5.hdhub4u.cl/'
      },
      signal: AbortSignal.timeout(5000)
    });
    const html = await res.text();
    const evalMatch = html.match(/eval\((function\(p,a,c,k,e,d\)[\s\S]*?)\)\s*<\/script>/);
    if (evalMatch) {
      const fn = new Function('return (' + evalMatch[1] + ')');
      const unpacked = fn();
      const linksMatch = unpacked.match(/var links\s*=\s*(\{[^;]+\});/);
      let streamUrl = null;
      if (linksMatch) {
        const links = JSON.parse(linksMatch[1]);
        streamUrl = links.hls2 || links.hls3 || (links.hls4 ? 'https://hdstream4u.com' + links.hls4 : null);
      }
      const vttMatch = unpacked.match(/file\s*:\s*"([^"]+\.vtt)"/i);
      const subUrl = vttMatch ? vttMatch[1] : null;
      return { streamUrl, subUrl };
    }
  } catch (err) {
    console.warn('[Direct Stream Extraction Error]:', err.message);
  }
  return { streamUrl: null, subUrl: null };
}

// 1. YouTube Search Scraper
async function searchYouTube(req, res) {
  const query = req.query.q;
  if (!query) return res.json({ results: [] });

  try {
    const response = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await response.text();
    const match = html.match(/ytInitialData\s*=\s*({.+?});<\/script>/);

    const videos = [];
    if (match) {
      const data = JSON.parse(match[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents || [];

      for (const item of contents) {
        if (item.videoRenderer) {
          const v = item.videoRenderer;
          videos.push({
            id: v.videoId,
            title: v.title?.runs?.[0]?.text || 'Video',
            url: `https://www.youtube.com/watch?v=${v.videoId}`,
            thumbnail: v.thumbnail?.thumbnails?.slice(-1)[0]?.url,
            duration: v.lengthText?.simpleText || '',
            type: 'youtube'
          });
          if (videos.length >= 8) break;
        }
      }
    }
    res.json({ results: videos });
  } catch (err) {
    console.error('[Search YouTube Error]', err);
    res.status(500).json({ error: 'Failed to search YouTube', results: [] });
  }
}

// 2. Open Movie Search & Embed Generator
async function searchMovies(req, res) {
  const query = req.query.q;
  if (!query) return res.json({ results: [] });

  try {
    const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb`);
    const data = await response.json();

    const movies = (data.results || []).slice(0, 10).map((m) => ({
      id: m.id,
      tmdbId: m.id,
      title: m.title,
      year: m.release_date ? m.release_date.split('-')[0] : '',
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      overview: m.overview,
      rating: m.vote_average ? m.vote_average.toFixed(1) : null,
      type: 'embed',
      url: `https://autoembed.co/movie/tmdb/${m.id}`,
      servers: [
        { name: '⚡ Server 1 (AutoEmbed CDN)', url: `https://autoembed.co/movie/tmdb/${m.id}`, speed: 'Fast 1080p' },
        { name: '🔥 Server 2 (VidSrc.to Pro)', url: `https://vidsrc.to/embed/movie/${m.id}`, speed: 'Ultra 4K' },
        { name: '🌟 Server 3 (VidSrc.cc Multi)', url: `https://vidsrc.cc/v2/embed/movie/${m.id}`, speed: 'Full HD' },
        { name: '🚀 Server 4 (Embed.su HD)', url: `https://embed.su/embed/movie/${m.id}`, speed: 'Ultra Fast' },
        { name: '💎 Server 5 (VidLink Pro)', url: `https://vidlink.pro/movie/${m.id}`, speed: '4K Stream' },
        { name: '🎬 Server 6 (2Embed Multi)', url: `https://2embed.cc/embed/movie/${m.id}`, speed: 'High Speed' },
        { name: '🔮 Server 7 (SuperEmbed Direct)', url: `https://multiembed.mov/directstream.php?video_id=${m.id}&tmdb=1`, speed: 'Ultra HD' },
        { name: '🌸 Server 8 (WatchAnimeWorld HD)', url: `https://watchanimeworld.one/?s=${encodeURIComponent(m.title)}`, speed: 'Anime & Movies 4K' },
        { name: '🛡️ Server 9 (SmashyStream)', url: `https://embed.smashystream.com/playere.php?tmdb=${m.id}`, speed: 'Backup Server' },
        { name: '🌐 Server 10 (VidSrc.me Mirror)', url: `https://vidsrc.me/embed/movie?tmdb=${m.id}`, speed: 'Mirror HD' },
        { name: '🍿 Server 11 (MoviesAPI Club)', url: `https://moviesapi.club/movie/${m.id}`, speed: 'Fast' }
      ]
    }));

    res.json({ results: movies });
  } catch (err) {
    console.error('[Search Movie Error]', err);
    res.status(500).json({ error: 'Failed to search movies', results: [] });
  }
}

// 3. HDHub4u Live Search & Scrape Endpoint
async function searchHdhub4u(req, res) {
  const query = req.query.q || '';
  try {
    const host = await getLiveHdhubHost();
    const searchUrl = query ? `${host}/?s=${encodeURIComponent(query)}` : `${host}/`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5500)
    });
    const html = await response.text();

    const fRegex = /<figure[^>]*>[\s\S]*?<a\s+href="([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/gi;
    let match;
    const items = [];
    while ((match = fRegex.exec(html)) !== null) {
      const rawTitle = match[3].replace(/<[^>]+>/g, '').replace(/&#038;/g, '&').trim();
      const cleanMatch = rawTitle.match(/^(.*?)(?:\s*\(((?:19|20)\d{2})\)|\s*\[)/);
      const cleanTitle = cleanMatch ? cleanMatch[1].trim() : rawTitle.split('[')[0].trim();
      const year = cleanMatch && cleanMatch[2] ? cleanMatch[2] : '';

      items.push({
        id: match[1],
        url: match[1],
        poster: match[2],
        rawTitle,
        title: cleanTitle || rawTitle,
        year,
        source: 'hdhub4u'
      });
    }

    res.json({ liveHost: host, movies: items });
  } catch (err) {
    console.error('[HDHub4u Live Search Error]', err);
    res.status(500).json({ error: 'HDHub4u search failed', liveHost: 'https://new5.hdhub4u.cl', movies: [] });
  }
}

async function getHdhubHost(req, res) {
  const host = await getLiveHdhubHost();
  res.json({ liveHost: host });
}

async function resolveHdhub4u(req, res) {
  let pageUrl = req.query.url;
  const searchTitle = req.query.title;

  try {
    if (!pageUrl && searchTitle) {
      const host = await getLiveHdhubHost();
      const searchRes = await fetch(`${host}/?s=${encodeURIComponent(searchTitle)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(4000)
      });
      const sHtml = await searchRes.text();
      const match = sHtml.match(/<a href="([^"]+)"[^>]*>[\s\S]*?<img[^>]+alt="([^"]+)"/i);
      if (match && match[1]) {
        pageUrl = match[1];
      }
    }

    if (!pageUrl) return res.status(400).json({ error: 'Missing url or title parameter' });

    let hdstreamUrl = null;
    if (/(?:hdstream4u|vidhide|streamhide)\.com\/(?:file|embed)\//i.test(pageUrl)) {
      hdstreamUrl = pageUrl.replace('/file/', '/embed/');
    }

    let html = '';
    let imdbId = null;
    let isSeries = false;
    let seasonNum = parseInt(req.query.season) || 1;
    let episodeNum = parseInt(req.query.episode) || 1;
    let totalEpisodes = 10;
    let hubstreamUrl = null;

    if (!hdstreamUrl) {
      const postRes = await fetch(pageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        signal: AbortSignal.timeout(6000)
      });
      html = await postRes.text();

      const imdbMatch = html.match(/imdb\.com\/title\/(tt\d+)/i);
      imdbId = imdbMatch ? imdbMatch[1] : null;

      isSeries = /season-?\d+|series|all-episodes|\bs\d{1,2}\b/i.test(pageUrl) || /<h1[^>]*>.*?(?:Season|Series|Episode|Episodes).*?<\/h1>/i.test(html);
      const seasonMatch = pageUrl.match(/season-?0?(\d+)/i) || html.match(/<h1[^>]*>.*?Season\s*0?(\d+).*?<\/h1>/i);
      seasonNum = parseInt(req.query.season) || (seasonMatch ? parseInt(seasonMatch[1]) : 1);
      episodeNum = parseInt(req.query.episode) || 1;

      const epMatches = [...html.matchAll(/(?:Episode|EP|Ep\.)\s*0?(\d{1,2})\b/gi)];
      const epsParsed = epMatches.map(m => parseInt(m[1])).filter(n => n > 0 && n <= 50);
      const epsFound = epsParsed.length > 0 ? Math.max(...epsParsed) : 10;
      totalEpisodes = Math.min(Math.max(epsFound, 8), 24);

      const hdstreamMatch = html.match(/href="([^"]*(?:hdstream4u|vidhide|streamhide)\.com\/(?:file|embed)\/[^"]*)"/i);
      hdstreamUrl = hdstreamMatch ? hdstreamMatch[1].replace('/file/', '/embed/') : null;

      const hubstreamMatches = [...html.matchAll(/href="([^"]*hubstream\.art\/#[^"]*)"/gi)].map(m => m[1]);
      if (isSeries && hubstreamMatches.length > 0) {
        hubstreamUrl = hubstreamMatches[episodeNum - 1] || hubstreamMatches[0];
      } else if (hubstreamMatches.length > 0) {
        hubstreamUrl = hubstreamMatches[0];
      }
    }

    let nativeExtraction = { streamUrl: null, subUrl: null };
    if (hdstreamUrl) {
      nativeExtraction = await extractDirectHlsStream(hdstreamUrl);
    }

    const servers = [];

    if (nativeExtraction.streamUrl) {
      servers.push({
        name: '🔥 CYPR Native Cinema (1080p Ultra HLS)',
        url: nativeExtraction.streamUrl,
        isNativePlayer: true,
        sourceType: 'direct',
        subtitlesUrl: nativeExtraction.subUrl
      });
      servers.push({
        name: '🔥 CYPR 1080p Ultra HD (Direct)',
        url: nativeExtraction.streamUrl,
        isNativePlayer: true,
        sourceType: 'direct',
        subtitlesUrl: nativeExtraction.subUrl
      });
      servers.push({
        name: '⚡ High-Speed CDN Mirror (Direct)',
        url: nativeExtraction.streamUrl,
        isNativePlayer: true,
        sourceType: 'direct',
        subtitlesUrl: nativeExtraction.subUrl
      });
    } else if (hdstreamUrl) {
      nativeExtraction = await extractDirectHlsStream(hdstreamUrl);
      if (nativeExtraction.streamUrl) {
        servers.push({
          name: '🔥 CYPR Direct Cinema',
          url: nativeExtraction.streamUrl,
          isNativePlayer: true,
          sourceType: 'direct',
          subtitlesUrl: nativeExtraction.subUrl
        });
      }
    }

    const activeServer = servers[0];

    res.json({
      success: true,
      imdbId,
      isSeries,
      season: seasonNum,
      episode: episodeNum,
      totalEpisodes,
      sourceType: 'direct',
      subtitlesUrl: nativeExtraction.subUrl,
      servers,
      activeUrl: activeServer?.url || hdstreamUrl || hubstreamUrl
    });
  } catch (err) {
    console.error('[HDHub4u Resolve Error]', err);
    res.status(500).json({ error: err.message });
  }
}

function getSeriesServers(req, res) {
  const { imdbId, tmdbId, season = 1, episode = 1 } = req.query;
  const s = parseInt(season) || 1;
  const e = parseInt(episode) || 1;
  const id = imdbId || tmdbId;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const servers = [
    { name: '⚡ Server 1 (AutoEmbed TV)', url: `https://autoembed.co/tv/tmdb/${id}/${s}/${e}`, speed: 'Fast 1080p' },
    { name: '🔥 Server 2 (VidSrc.to Pro)', url: `https://vidsrc.to/embed/tv/${id}/${s}/${e}`, speed: 'Ultra 4K' },
    { name: '🌟 Server 3 (VidSrc.cc TV)', url: `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}`, speed: 'Full HD' },
    { name: '🚀 Server 4 (Embed.su TV)', url: `https://embed.su/embed/tv/${id}/${s}/${e}`, speed: 'Ultra Fast' },
    { name: '💎 Server 5 (VidLink TV)', url: `https://vidlink.pro/tv/${id}/${s}/${e}`, speed: '4K Stream' },
    { name: '🎬 Server 6 (2Embed TV)', url: `https://2embed.cc/embed/tv/${id}&s=${s}&e=${e}`, speed: 'High Speed' },
    { name: '🔮 Server 7 (SuperEmbed TV)', url: `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${s}&e=${e}`, speed: 'Ultra HD' },
    { name: '🛡️ Server 8 (SmashyStream TV)', url: `https://embed.smashystream.com/playere.php?tmdb=${id}&season=${s}&episode=${e}`, speed: 'Backup' },
    { name: '🌐 Server 9 (VidSrc.me TV)', url: `https://vidsrc.me/embed/tv?imdb=${id}&season=${s}&episode=${e}`, speed: 'Mirror HD' },
    { name: '🍿 Server 10 (MoviesAPI Club)', url: `https://moviesapi.club/movie/${id}`, speed: 'Fast' }
  ];

  res.json({
    success: true,
    season: s,
    episode: e,
    servers,
    activeUrl: servers[0].url
  });
}

const DBService = require('../services/dbService');

async function searchAll(req, res) {
  const query = req.query.q;
  if (!query) return res.json({ movies: [], youtube: [] });

  // Log search activity for AI personalization
  DBService.logActivity(req.query.userEmail, req.query.userName, req.query.roomId, 'search', query);

  try {
    const fetchMoviePromise = fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb`, {
      signal: AbortSignal.timeout(2500)
    }).then((r) => r.json()).catch(() => ({ results: [] }));

    const fetchYtPromise = fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(3500)
    }).then((r) => r.text()).catch(() => '');

    const [moviesData, ytHtml] = await Promise.all([fetchMoviePromise, fetchYtPromise]);

    let movies = [];
    if (moviesData?.results) {
      movies = moviesData.results.slice(0, 8).map((m) => ({
        id: m.id,
        tmdbId: m.id,
        title: m.title,
        year: m.release_date ? m.release_date.split('-')[0] : '',
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        rating: m.vote_average ? m.vote_average.toFixed(1) : null,
        type: 'embed',
        url: `https://autoembed.co/movie/tmdb/${m.id}`,
        servers: [
          { name: '⚡ Server 1 (AutoEmbed CDN)', url: `https://autoembed.co/movie/tmdb/${m.id}`, speed: 'Fast 1080p' },
          { name: '🔥 Server 2 (VidSrc.to Pro)', url: `https://vidsrc.to/embed/movie/${m.id}`, speed: 'Ultra 4K' },
          { name: '🌟 Server 3 (VidSrc.cc Multi)', url: `https://vidsrc.cc/v2/embed/movie/${m.id}`, speed: 'Full HD' },
          { name: '🚀 Server 4 (Embed.su HD)', url: `https://embed.su/embed/movie/${m.id}`, speed: 'Ultra Fast' },
          { name: '💎 Server 5 (VidLink Pro)', url: `https://vidlink.pro/movie/${m.id}`, speed: '4K Stream' },
          { name: '🎬 Server 6 (2Embed Multi)', url: `https://2embed.cc/embed/movie/${m.id}`, speed: 'High Speed' },
          { name: '🔮 Server 7 (SuperEmbed Direct)', url: `https://multiembed.mov/directstream.php?video_id=${m.id}&tmdb=1`, speed: 'Ultra HD' },
          { name: '🛡️ Server 8 (SmashyStream)', url: `https://embed.smashystream.com/playere.php?tmdb=${m.id}`, speed: 'Backup Server' },
          { name: '🌐 Server 9 (VidSrc.me Mirror)', url: `https://vidsrc.me/embed/movie?tmdb=${m.id}`, speed: 'Mirror HD' },
          { name: '🍿 Server 10 (MoviesAPI Club)', url: `https://moviesapi.club/movie/${m.id}`, speed: 'Fast' }
        ]
      }));
    }

    let youtube = [];
    if (ytHtml) {
      const match = ytHtml.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
      if (match) {
        const data = JSON.parse(match[1]);
        const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents || [];
        for (const item of contents) {
          if (item.videoRenderer) {
            const v = item.videoRenderer;
            youtube.push({
              id: v.videoId,
              title: v.title?.runs?.[0]?.text || 'Video',
              url: `https://www.youtube.com/watch?v=${v.videoId}`,
              thumbnail: v.thumbnail?.thumbnails?.slice(-1)[0]?.url,
              duration: v.lengthText?.simpleText || '',
              type: 'youtube'
            });
            if (youtube.length >= 8) break;
          }
        }
      }
    }

    res.json({ movies, youtube });
  } catch (err) {
    console.error('[Combined Search Error]', err);
    res.status(500).json({ error: 'Search failed', movies: [], youtube: [] });
  }
}

// 8. Neural AI Semantic Search
async function searchNeural(req, res) {
  const query = req.query.q;
  if (!query || !query.trim()) {
    return res.json({ matches: [], movies: [], youtube: [] });
  }

  try {
    const GroqService = require('../services/groqService');
    const matches = await GroqService.resolveNeuralSearch(query.trim());

    if (matches && matches.length > 0) {
      // Search TMDB for all resolved candidates
      const moviePromises = matches.map(async (match) => {
        try {
          const tmdbRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(match.title)}&api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb`,
            { signal: AbortSignal.timeout(3500) }
          );
          if (tmdbRes.ok) {
            const data = await tmdbRes.json();
            const m = data.results?.[0];
            if (m) {
              return {
                id: m.id,
                tmdbId: m.id,
                title: m.title,
                year: m.release_date ? m.release_date.split('-')[0] : (match.year ? String(match.year) : ''),
                poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
                backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w780${m.backdrop_path}` : null,
                overview: m.overview || match.whyMatch,
                whyWatch: match.whyMatch,
                rating: m.vote_average ? m.vote_average.toFixed(1) : '8.0',
                type: 'embed',
                url: `https://autoembed.co/movie/tmdb/${m.id}`,
                servers: [
                  { name: '⚡ Server 1 (AutoEmbed CDN)', url: `https://autoembed.co/movie/tmdb/${m.id}`, speed: 'Fast 1080p' },
                  { name: '🔥 Server 2 (VidSrc.to Pro)', url: `https://vidsrc.to/embed/movie/${m.id}`, speed: 'Ultra 4K' },
                  { name: '🌟 Server 3 (VidSrc.cc Multi)', url: `https://vidsrc.cc/v2/embed/movie/${m.id}`, speed: 'Full HD' },
                  { name: '🚀 Server 4 (Embed.su HD)', url: `https://embed.su/embed/movie/${m.id}`, speed: 'Ultra Fast' }
                ]
              };
            }
          }
        } catch (e) {}
        return null;
      });

      const resolvedMovies = (await Promise.all(moviePromises)).filter(Boolean);
      if (resolvedMovies.length > 0) {
        return res.json({ movies: resolvedMovies, youtube: [], matches });
      }

      const topTitle = matches[0].title;
      req.query.q = topTitle;
      return searchAll(req, res);
    }

    return searchAll(req, res);
  } catch (err) {
    console.error('[Neural Search Controller Error]', err);
    res.status(500).json({ error: 'Neural search failed', matches: [], movies: [], youtube: [] });
  }
}

// 9. WatchAnimeWorld Dedicated Search & Scrape Endpoint
async function searchWatchAnimeWorld(req, res) {
  const query = req.query.q || '';
  try {
    const searchUrl = query ? `https://watchanimeworld.one/?s=${encodeURIComponent(query)}` : `https://watchanimeworld.one/`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(5500)
    });
    const html = await response.text();

    const articleRegex = /<a[^>]+href="([^"]+)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/gi;
    let match;
    const items = [];
    const seen = new Set();

    while ((match = articleRegex.exec(html)) !== null) {
      const href = match[1];
      const img = match[2];
      const rawTitle = match[3].replace(/<[^>]+>/g, '').trim();

      if (href && rawTitle && !seen.has(href) && href.includes('watchanimeworld.one')) {
        seen.add(href);
        items.push({
          id: href,
          url: href,
          poster: img,
          title: rawTitle,
          type: 'embed',
          source: 'watchanimeworld'
        });
      }
    }
    res.json({ anime: items });
  } catch (err) {
    console.error('[WatchAnimeWorld Search Error]', err);
    res.json({ anime: [] });
  }
}

// 10. WatchAnimeWorld Deep Page & Stream Resolver
async function resolveWatchAnimeWorld(req, res) {
  const pageUrl = req.query.url || '';
  const searchTitle = req.query.title || '';

  try {
    let extractedIframes = [];
    if (pageUrl && pageUrl.startsWith('http') && !pageUrl.includes('/category/')) {
      try {
        const response = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: AbortSignal.timeout(5000)
        });
        const html = await response.text();
        const iframeMatches = [...html.matchAll(/<iframe[^>]+(?:src|data-src)="([^"]+)"/gi)].map(m => m[1]);

        extractedIframes = iframeMatches.filter(src => {
          if (!src) return false;
          const lower = src.toLowerCase();
          return !lower.includes('google') && !lower.includes('facebook') && !lower.includes('telegram') &&
                 !lower.includes('disqus') && !lower.includes('doubleclick') && !lower.includes('challenge-platform') &&
                 !lower.includes('wp-admin') && !lower.includes('captcha');
        });
      } catch (err) {
        console.warn('[WatchAnimeWorld Page Scraping Warning]', err.message);
      }
    }

    // Clean title for TMDB matching
    let cleanTitle = (searchTitle || '').replace(/<[^>]+>/g, '').replace(/&#038;/g, '&');
    cleanTitle = cleanTitle.replace(/\s*[\(\[\{]?(?:Hindi|Tamil|Telugu|Japanese|Dubbed|Subbed|Download|Watch|Online|480p|720p|1080p|HD|Full Movie|Season \d+|Episodes?)[^\)\]\}]*[\)\]\}]?/gi, '').trim();
    cleanTitle = cleanTitle.replace(/\s*-\s*Watch Now.*/gi, '').trim();

    if (!cleanTitle && pageUrl) {
      const parts = pageUrl.split('/').filter(Boolean);
      cleanTitle = parts[parts.length - 1].replace(/-/g, ' ');
    }

    let tmdbMovie = null;
    let tmdbTv = null;
    if (cleanTitle) {
      try {
        const [resM, resT] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(cleanTitle)}&api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()).catch(() => null),
          fetch(`https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(cleanTitle)}&api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb`, { signal: AbortSignal.timeout(3000) }).then(r => r.json()).catch(() => null)
        ]);
        tmdbMovie = resM?.results?.[0];
        tmdbTv = resT?.results?.[0];
      } catch (err) {
        console.warn('[TMDB Search Warning]', err.message);
      }
    }

    const servers = [];

    // 1. Add direct iframe embeds extracted from WatchAnimeWorld post page
    extractedIframes.forEach((iframeUrl, idx) => {
      servers.push({
        name: `🌸 Server ${servers.length + 1} (WatchAnimeWorld Direct ${idx + 1})`,
        url: iframeUrl,
        sourceType: 'embed',
        speed: 'Anime Player'
      });
    });

    // 2. Add high-speed 4K/1080p Movie Embed Servers if TMDB Movie found
    if (tmdbMovie) {
      const mId = tmdbMovie.id;
      servers.push({ name: `⚡ Server ${servers.length + 1} (AutoEmbed 4K Anime)`, url: `https://autoembed.co/movie/tmdb/${mId}`, sourceType: 'embed', speed: 'Fast 1080p' });
      servers.push({ name: `🔥 Server ${servers.length + 1} (VidSrc.to Pro Anime)`, url: `https://vidsrc.to/embed/movie/${mId}`, sourceType: 'embed', speed: 'Ultra 4K' });
      servers.push({ name: `🌟 Server ${servers.length + 1} (VidSrc.cc Multi HD)`, url: `https://vidsrc.cc/v2/embed/movie/${mId}`, sourceType: 'embed', speed: 'Full HD' });
      servers.push({ name: `🚀 Server ${servers.length + 1} (Embed.su HD)`, url: `https://embed.su/embed/movie/${mId}`, sourceType: 'embed', speed: 'Ultra Fast' });
      servers.push({ name: `💎 Server ${servers.length + 1} (VidLink 4K)`, url: `https://vidlink.pro/movie/${mId}`, sourceType: 'embed', speed: '4K Stream' });
      servers.push({ name: `🎬 Server ${servers.length + 1} (2Embed Multi)`, url: `https://2embed.cc/embed/movie/${mId}`, sourceType: 'embed', speed: 'High Speed' });
      servers.push({ name: `🔮 Server ${servers.length + 1} (SuperEmbed Direct)`, url: `https://multiembed.mov/directstream.php?video_id=${mId}&tmdb=1`, sourceType: 'embed', speed: 'Ultra HD' });
      servers.push({ name: `🍿 Server ${servers.length + 1} (MoviesAPI Club)`, url: `https://moviesapi.club/movie/${mId}`, sourceType: 'embed', speed: 'Fast' });
    }

    // 3. Add TV Series Embed Servers if TMDB TV found
    if (tmdbTv) {
      const tId = tmdbTv.id;
      servers.push({ name: `📺 Server ${servers.length + 1} (AutoEmbed TV Series)`, url: `https://autoembed.co/tv/tmdb/${tId}/1/1`, sourceType: 'embed', speed: 'TV Fast 1080p' });
      servers.push({ name: `🔥 Server ${servers.length + 1} (VidSrc.to TV Series)`, url: `https://vidsrc.to/embed/tv/${tId}/1/1`, sourceType: 'embed', speed: 'TV Ultra 4K' });
      servers.push({ name: `🌟 Server ${servers.length + 1} (VidSrc.cc TV Series)`, url: `https://vidsrc.cc/v2/embed/tv/${tId}/1/1`, sourceType: 'embed', speed: 'TV Full HD' });
      servers.push({ name: `🚀 Server ${servers.length + 1} (Embed.su TV Series)`, url: `https://embed.su/embed/tv/${tId}/1/1`, sourceType: 'embed', speed: 'TV Ultra' });
      servers.push({ name: `💎 Server ${servers.length + 1} (VidLink TV Series)`, url: `https://vidlink.pro/tv/${tId}/1/1`, sourceType: 'embed', speed: 'TV 4K' });
    }

    // Fallback if no servers resolved
    if (servers.length === 0) {
      servers.push({
        name: '🌸 Server 1 (AutoEmbed Fallback)',
        url: `https://autoembed.co/movie/tmdb/${encodeURIComponent(cleanTitle || 'Doraemon')}`,
        sourceType: 'embed',
        speed: 'Standard'
      });
    }

    const activeUrl = servers[0].url;

    res.json({
      success: true,
      title: cleanTitle || searchTitle || 'Anime Movie',
      url: activeUrl,
      activeUrl,
      servers
    });
  } catch (err) {
    console.error('[WatchAnimeWorld Resolve Error]', err);
    res.status(500).json({ error: 'Failed to resolve anime player', servers: [] });
  }
}

module.exports = {
  searchYouTube,
  searchMovies,
  searchHdhub4u,
  getHdhubHost,
  resolveHdhub4u,
  getSeriesServers,
  searchAll,
  searchNeural,
  searchWatchAnimeWorld,
  resolveWatchAnimeWorld
};

