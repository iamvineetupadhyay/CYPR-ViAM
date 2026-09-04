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

// 2. AI Movie Recommendations & Smart Search
router.post('/recommend', async (req, res) => {
  try {
    const { query, genre, mood } = req.body || {};
    const results = await GroqService.getMovieRecommendations(query || 'Top trending movies', genre, mood);
    res.json(results);
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
