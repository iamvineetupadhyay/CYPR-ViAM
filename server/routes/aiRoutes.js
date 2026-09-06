const express = require('express');
const router = express.Router();
const GroqService = require('../services/groqService');

// 1. AI Chat Endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory, currentMovie } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const reply = await GroqService.getCompanionResponse(message, conversationHistory, currentMovie);
    res.json({ reply, timestamp: Date.now() });
  } catch (error) {
    console.error('[AI Chat Route Error]:', error);
    res.status(500).json({ error: 'Failed to generate AI response.' });
  }
});

// 2. AI Movie Recommendations & Smart Search (Watch History & Preference Aware)
router.post('/recommend', async (req, res) => {
  try {
    const { query, genre, mood, history, preferences } = req.body || {};
    let promptQuery = query || '';

    if (history && Array.isArray(history) && history.length > 0) {
      const pastTitles = history
        .map(item => (typeof item === 'string' ? item : item?.title))
        .filter(Boolean)
        .slice(0, 6)
        .join(', ');
      
      if (pastTitles) {
        promptQuery = `User's recent watch history includes: [${pastTitles}]. ${promptQuery ? `Specific preference: ${promptQuery}` : 'Recommend movies tailored to these watch history tastes and couple lounge vibes.'}`;
      }
    }

    if (preferences && Array.isArray(preferences) && preferences.length > 0) {
      promptQuery += ` User genre preferences: ${preferences.join(', ')}.`;
    }

    if (!promptQuery.trim()) {
      promptQuery = 'Top trending romantic, sci-fi and cinematic movies for couples';
    }

    const results = await GroqService.getMovieRecommendations(promptQuery, genre, mood);
    const recs = Array.isArray(results?.recommendations) ? results.recommendations : [];

    // Enrich each AI movie recommendation with real TMDB poster, rating & year
    const enriched = await Promise.all(
      recs.map(async (rec) => {
        try {
          const tmdbRes = await fetch(
            `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(rec.title)}&api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb`,
            { signal: AbortSignal.timeout(3500) }
          );
          if (tmdbRes.ok) {
            const data = await tmdbRes.json();
            const first = data.results?.[0];
            if (first) {
              return {
                ...rec,
                id: first.id,
                tmdbId: first.id,
                poster: first.poster_path ? `https://image.tmdb.org/t/p/w500${first.poster_path}` : (first.backdrop_path ? `https://image.tmdb.org/t/p/w500${first.backdrop_path}` : null),
                backdrop: first.backdrop_path ? `https://image.tmdb.org/t/p/w780${first.backdrop_path}` : null,
                rating: first.vote_average ? String(first.vote_average.toFixed(1)) : (rec.rating ? String(rec.rating).replace('/10', '') : '8.2'),
                year: first.release_date ? first.release_date.split('-')[0] : (rec.year || 'Cinema'),
                overview: first.overview || rec.overview,
                type: 'embed',
                url: `https://autoembed.co/movie/tmdb/${first.id}`
              };
            }
          }
        } catch (e) {
          // ignore error, return base rec
        }
        return {
          ...rec,
          id: rec.title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          rating: rec.rating ? String(rec.rating).replace('/10', '') : '8.0',
          type: 'embed',
          url: `https://autoembed.co/movie/tmdb/${encodeURIComponent(rec.title)}`
        };
      })
    );

    res.json({ recommendations: enriched });
  } catch (error) {
    console.error('[AI Recommend Route Error]:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations.' });
  }
});

// 3. AI Smart Replies Generator
router.post('/smart-replies', async (req, res) => {
  try {
    const { lastMessage, currentMovie } = req.body || {};
    const replies = await GroqService.getSmartReplies(lastMessage || 'Hey', currentMovie);
    res.json({ replies });
  } catch (error) {
    console.error('[AI Smart Replies Route Error]:', error);
    res.status(500).json({ error: 'Failed to generate smart replies.' });
  }
});

// 4. AI Movie Trivia
router.post('/trivia', async (req, res) => {
  try {
    const { movieTitle } = req.body || {};
    if (!movieTitle) return res.status(400).json({ error: 'Movie title is required.' });
    const trivia = await GroqService.getMovieTrivia(movieTitle);
    res.json({ trivia });
  } catch (error) {
    console.error('[AI Trivia Route Error]:', error);
    res.status(500).json({ error: 'Failed to generate trivia.' });
  }
});

module.exports = router;
