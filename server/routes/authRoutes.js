const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { otpRateLimiter, authRateLimiter } = require('../middleware/rateLimiter');

router.post('/send-otp', otpRateLimiter, authController.sendOtp);
router.post('/verify-otp', authController.verifyOtp);
router.post('/signup', authRateLimiter, authController.signup);
router.post('/login', authRateLimiter, authController.login);
router.put('/profile', authController.updateProfile);

// History routes
router.post('/history/watch', authController.addWatchHistory);
router.get('/history/watch', authController.getWatchHistory);
router.post('/history/room', authController.addRoomHistory);
router.get('/history/room', authController.getRoomHistory);

module.exports = router;
