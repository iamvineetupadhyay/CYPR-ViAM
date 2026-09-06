const { RoomStore } = require('../services/roomStore');

function registerWebRTCHandlers(io, socket, state) {
  // WebRTC SDP Offer Relay
  socket.on('webrtc-offer', ({ targetSocketId, offer, sender }) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (room && targetSocketId && room.users.has(socket.id) && room.users.has(targetSocketId)) {
      socket.to(targetSocketId).emit('webrtc-offer', {
        offer,
        senderSocketId: socket.id,
        sender
      });
    } else {
      socket.to(state.currentRoom).emit('webrtc-offer', {
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
    if (room && targetSocketId && room.users.has(socket.id) && room.users.has(targetSocketId)) {
      socket.to(targetSocketId).emit('webrtc-answer', {
        answer,
        senderSocketId: socket.id
      });
    } else {
      socket.to(state.currentRoom).emit('webrtc-answer', {
        answer,
        senderSocketId: socket.id
      });
    }
  });

  // WebRTC ICE Candidate Relay
  socket.on('webrtc-ice-candidate', ({ targetSocketId, candidate }) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (room && targetSocketId && room.users.has(socket.id) && room.users.has(targetSocketId)) {
      socket.to(targetSocketId).emit('webrtc-ice-candidate', {
        candidate,
        senderSocketId: socket.id
      });
    } else {
      socket.to(state.currentRoom).emit('webrtc-ice-candidate', {
        candidate,
        senderSocketId: socket.id
      });
    }
  });

  // Peer Ready Signaling (Triggers other peers in room to create an offer)
  socket.on('peer-ready', (data) => {
    const roomId = data?.roomId || state.currentRoom;
    if (!roomId) return;
    socket.to(roomId).emit('peer-ready', {
      initiatorId: socket.id,
      user: data?.user || { name: state.currentUser?.name || 'Peer', socketId: socket.id }
    });
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
