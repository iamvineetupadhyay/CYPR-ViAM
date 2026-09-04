const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { searchRateLimiter } = require('../middleware/rateLimiter');

// Apply search rate limiter to protect upstream APIs and scraping pipelines
router.use(searchRateLimiter);

router.get('/youtube', searchController.searchYouTube);
router.get('/movies', searchController.searchMovies);
router.get('/hdhub4u', searchController.searchHdhub4u);
router.get('/hdhub4u/host', searchController.getHdhubHost);
router.get('/hdhub4u/resolve', searchController.resolveHdhub4u);
router.get('/series/servers', searchController.getSeriesServers);
router.get('/all', searchController.searchAll);
router.get('/neural', searchController.searchNeural);

module.exports = router;
