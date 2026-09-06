const { RoomStore } = require('../services/roomStore');
const { createSocketRateLimiter } = require('../middleware/rateLimiter');

// Rate limiter to prevent media flood attacks (e.g. seek / play / pause spamming)
const mediaControlLimiter = createSocketRateLimiter(6, 1000); // max 6 actions per second

function sanitizeTime(time) {
  const num = Number(time);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

const DBService = require('../services/dbService');

function registerMediaHandlers(io, socket, state) {
  socket.on('media-change', (newMedia) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!mediaControlLimiter(socket.id)) return;

    room.mediaState = {
      ...room.mediaState,
      ...newMedia,
      currentTime: 0,
      isPlaying: true,
      senderSocketId: socket.id,
      updatedAt: Date.now()
    };

    // Log watch activity to DB for AI personalization & memory
    if (newMedia && newMedia.title && newMedia.title !== 'No movie selected') {
      DBService.logActivity(state.currentUser?.email, state.currentUser?.name, state.currentRoom, 'watch', newMedia.title);
    }

    io.to(state.currentRoom).emit('media-changed', room.mediaState);
  });

  socket.on('media-play', (payload) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!mediaControlLimiter(socket.id)) return;

    const timeVal = payload?.currentTime !== undefined ? payload.currentTime : payload;
    const safeTime = sanitizeTime(timeVal);
    room.mediaState.isPlaying = true;
    room.mediaState.currentTime = safeTime;
    room.mediaState.updatedAt = Date.now();

    socket.to(state.currentRoom).emit('media-played', {
      currentTime: safeTime,
      senderId: socket.id,
      senderName: state.currentUser?.name
    });
  });

  socket.on('media-pause', (payload) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!mediaControlLimiter(socket.id)) return;

    const timeVal = payload?.currentTime !== undefined ? payload.currentTime : payload;
    const safeTime = sanitizeTime(timeVal);
    room.mediaState.isPlaying = false;
    room.mediaState.currentTime = safeTime;
    room.mediaState.updatedAt = Date.now();

    socket.to(state.currentRoom).emit('media-paused', {
      currentTime: safeTime,
      senderId: socket.id,
      senderName: state.currentUser?.name
    });
  });

  socket.on('media-seek', (payload) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!mediaControlLimiter(socket.id)) return;

    const timeVal = payload?.currentTime !== undefined ? payload.currentTime : payload;
    const safeTime = sanitizeTime(timeVal);
    room.mediaState.currentTime = safeTime;
    room.mediaState.updatedAt = Date.now();

    socket.to(state.currentRoom).emit('media-seeked', {
      currentTime: safeTime,
      senderId: socket.id,
      senderName: state.currentUser?.name
    });
  });

  // Periodic drift synchronization heartbeat from playing peer
  socket.on('media-heartbeat', (payload) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    const timeVal = payload?.currentTime !== undefined ? payload.currentTime : payload;
    const safeTime = sanitizeTime(timeVal);
    room.mediaState.currentTime = safeTime;
    if (payload?.isPlaying !== undefined) {
      room.mediaState.isPlaying = !!payload.isPlaying;
    }
    room.mediaState.updatedAt = Date.now();

    socket.to(state.currentRoom).emit('media-heartbeat', {
      currentTime: safeTime,
      isPlaying: room.mediaState.isPlaying,
      senderId: socket.id
    });
  });

  socket.on('media-sync-request', () => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (room && room.mediaState) {
      // Calculate real-time elapsed position if stream was playing
      let currentPosition = room.mediaState.currentTime || 0;
      if (room.mediaState.isPlaying && room.mediaState.updatedAt) {
        const elapsed = (Date.now() - room.mediaState.updatedAt) / 1000;
        currentPosition = Math.max(0, currentPosition + elapsed);
      }
      socket.emit('initial-media-state', {
        ...room.mediaState,
        currentTime: currentPosition
      });
    }
  });
}

module.exports = registerMediaHandlers;
