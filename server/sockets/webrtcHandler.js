const { RoomStore } = require('../services/roomStore');

function registerWebRTCHandlers(io, socket, state) {
  // WebRTC SDP Offer Relay
  socket.on('webrtc-offer', ({ targetSocketId, offer, sender }) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    // Security check: ensure both target and sender are in the same room
    if (room && room.users.has(socket.id) && room.users.has(targetSocketId)) {
      socket.to(targetSocketId).emit('webrtc-offer', {
        offer,
        senderSocketId: socket.id,
        sender
      });
    }
  });

  // WebRTC SDP Answer Relay
  socket.on('webrtc-answer', ({ targetSocketId, answer }) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (room && room.users.has(socket.id) && room.users.has(targetSocketId)) {
      socket.to(targetSocketId).emit('webrtc-answer', {
        answer,
        senderSocketId: socket.id
      });
    }
  });

  // WebRTC ICE Candidate Relay
  socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (room && room.users.has(socket.id) && room.users.has(targetSocketId)) {
      socket.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate,
        senderSocketId: socket.id
      });
    }
  });

  // Cinema Face-to-Face Cam & Mic Request Relay
  socket.on('cinema-cam-request', (data) => {
    if (!state.currentRoom) return;
    socket.to(state.currentRoom).emit('cinema-cam-request', {
      from: data?.from || { name: 'Partner', socketId: socket.id },
      senderSocketId: socket.id,
      isVideo: data?.isVideo !== false
    });
  });

  socket.on('cinema-cam-accepted', (data) => {
    if (!state.currentRoom) return;
    socket.to(state.currentRoom).emit('cinema-cam-accepted', {
      from: data?.from || { name: 'Partner', socketId: socket.id },
      senderSocketId: socket.id
    });
  });

  socket.on('cinema-cam-declined', (data) => {
    if (!state.currentRoom) return;
    socket.to(state.currentRoom).emit('cinema-cam-declined', {
      from: data?.from || { name: 'Partner', socketId: socket.id }
    });
  });

  socket.on('cinema-cam-stopped', () => {
    if (!state.currentRoom) return;
    socket.to(state.currentRoom).emit('cinema-cam-stopped', {
      senderSocketId: socket.id
    });
  });
}

module.exports = registerWebRTCHandlers;
