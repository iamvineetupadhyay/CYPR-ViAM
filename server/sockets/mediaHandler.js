const { RoomStore } = require('../services/roomStore');
const { createSocketRateLimiter } = require('../middleware/rateLimiter');

// Rate limiter to prevent media flood attacks (e.g. seek / play / pause spamming)
const mediaControlLimiter = createSocketRateLimiter(6, 1000); // max 6 actions per second

function sanitizeTime(time) {
  const num = Number(time);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

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
      updatedAt: Date.now()
    };
    io.to(state.currentRoom).emit('media-changed', room.mediaState);
  });

  socket.on('media-play', ({ currentTime }) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!mediaControlLimiter(socket.id)) return;

    const safeTime = sanitizeTime(currentTime);
    room.mediaState.isPlaying = true;
    room.mediaState.currentTime = safeTime;
    room.mediaState.updatedAt = Date.now();

    socket.to(state.currentRoom).emit('media-played', {
      currentTime: safeTime,
      senderId: socket.id,
      senderName: state.currentUser?.name
    });
  });

  socket.on('media-pause', ({ currentTime }) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!mediaControlLimiter(socket.id)) return;

    const safeTime = sanitizeTime(currentTime);
    room.mediaState.isPlaying = false;
    room.mediaState.currentTime = safeTime;
    room.mediaState.updatedAt = Date.now();

    socket.to(state.currentRoom).emit('media-paused', {
      currentTime: safeTime,
      senderId: socket.id,
      senderName: state.currentUser?.name
    });
  });

  socket.on('media-seek', ({ currentTime }) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!mediaControlLimiter(socket.id)) return;

    const safeTime = sanitizeTime(currentTime);
    room.mediaState.currentTime = safeTime;
    room.mediaState.updatedAt = Date.now();

    socket.to(state.currentRoom).emit('media-seeked', {
      currentTime: safeTime,
      senderId: socket.id,
      senderName: state.currentUser?.name
    });
  });

  socket.on('media-sync-request', () => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (room && room.users.has(socket.id)) {
      socket.emit('initial-media-state', room.mediaState);
    }
  });
}

module.exports = registerMediaHandlers;
