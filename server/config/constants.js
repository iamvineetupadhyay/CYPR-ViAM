module.exports = {
  DEFAULT_PORT: 4000,
  DEFAULT_MAX_CAPACITY: 2,
  MAX_ROOM_CAPACITY: 100,
  OTP_EXPIRATION_MS: 10 * 60 * 1000, // 10 minutes
  ROOM_CLEANUP_INACTIVITY_MS: 60 * 60 * 1000, // 1 hour
  DEFAULT_MEDIA_STATE: {
    sourceType: 'none',
    url: '',
    title: 'No movie selected',
    currentTime: 0,
    isPlaying: false,
    updatedAt: Date.now()
  }
};
