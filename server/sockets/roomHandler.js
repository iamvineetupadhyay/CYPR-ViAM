const { RoomStore } = require('../services/roomStore');

function registerRoomHandlers(io, socket, state) {
  
  socket.on('join-room', ({ roomId, user, passcode, maxCapacity, isPublic, isCreateMode }) => {
    const cleanRoomId = (roomId || 'default').toLowerCase().trim();
    state.currentRoom = cleanRoomId;
    state.currentUser = { ...user, socketId: socket.id };

    // Get room state
    let room = RoomStore.getRoom(cleanRoomId);

    if (!room) {
      // Room does not exist yet; initialize it and make the joining user the Host!
      room = RoomStore.createOrGetRoom(cleanRoomId, {
        maxCapacity: maxCapacity || 2,
        isPublic: !!isPublic,
        passcode: passcode || '',
        hostSocketId: socket.id,
        hostUser: state.currentUser
      });
    } else {
      // If the reconnecting user is the original host (or room has no active host), restore host permissions
      const isOriginalHost = (room.originalHostName && room.originalHostName === state.currentUser?.name) ||
                             (room.originalHostEmail && room.originalHostEmail === state.currentUser?.email);
      if (!room.hostSocketId || room.hostUser?.name === state.currentUser?.name || isOriginalHost) {
        room.hostSocketId = socket.id;
        room.hostUser = state.currentUser;
      }
    }

    const isHost = room.hostSocketId === socket.id ||
                   room.hostUser?.name === state.currentUser?.name ||
                   (room.originalHostName && room.originalHostName === state.currentUser?.name);

    // Check if user is already an approved member (reconnecting/refreshing without needing to re-knock)
    const userKey = (state.currentUser?.email || state.currentUser?.name || '').toLowerCase().trim();
    const isAlreadyApproved = room.approvedMembers && userKey && room.approvedMembers.has(userKey);

    // 1. STRICT PASSCODE CHECK FOR GUESTS (bypassed if already approved member reconnecting)
    if (room.passcode && !isHost && !isAlreadyApproved) {
      const isPasscodeCorrect = RoomStore.verifyPasscode(cleanRoomId, passcode);
      if (!isPasscodeCorrect) {
        console.warn(`🔒 [Passcode Denied] Socket ${socket.id} entered incorrect passcode ("${passcode}") for room "${cleanRoomId}". Expected: "${room.passcode}"`);
        return socket.emit('room-error', {
          code: 'PASSCODE_INVALID',
          message: `Incorrect passcode for private lounge "${cleanRoomId}". Access denied.`
        });
      }
    }

    // 2. KNOCK & HOST APPROVAL MECHANISM FOR PRIVATE ROOMS
    // (Bypassed if user is Host OR already an approved member of this room!)
    if (!isHost && !isAlreadyApproved && !room.isPublic && room.hostSocketId && !room.users.has(socket.id)) {
      console.log(`🚪 [Knock Request] User "${state.currentUser.name}" is knocking to enter private room ${cleanRoomId}`);
      
      // Store in waiting queue
      room.waitingUsers.set(socket.id, {
        socketId: socket.id,
        user: state.currentUser,
        timestamp: Date.now()
      });

      // Notify joining user that approval is pending
      socket.emit('knock-pending', {
        roomId: cleanRoomId,
        message: 'Waiting for Room Host approval to enter...'
      });

      // Notify host to approve or deny
      io.to(room.hostSocketId).emit('knock-request', {
        requestId: socket.id,
        user: state.currentUser,
        roomId: cleanRoomId
      });

      return;
    }

    // Direct entry for Host, public room, or pre-approved users
    completeUserJoin(io, socket, room, state.currentUser);
  });

  // Host Approves Knocking Guest
  socket.on('knock-accept', ({ targetSocketId }) => {
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || room.hostSocketId !== socket.id) return; // Only host can approve

    const waiting = room.waitingUsers.get(targetSocketId);
    if (waiting) {
      room.waitingUsers.delete(targetSocketId);
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        if (!room.approvedMembers) room.approvedMembers = new Set();
        const approvedKey = (waiting.user.email || waiting.user.name || '').toLowerCase().trim();
        if (approvedKey) room.approvedMembers.add(approvedKey);

        targetSocket.emit('knock-approved', { roomId: room.roomId });
        completeUserJoin(io, targetSocket, room, waiting.user);
        console.log(`✅ [Knock Approved] Host approved ${waiting.user.name} into room ${room.roomId}`);
      }
    }
  });

  // Host Denies Knocking Guest
  socket.on('knock-deny', ({ targetSocketId }) => {
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || room.hostSocketId !== socket.id) return; // Only host can deny

    const waiting = room.waitingUsers.get(targetSocketId);
    if (waiting) {
      room.waitingUsers.delete(targetSocketId);
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.emit('knock-rejected', {
          message: 'The Room Host declined your request to join this private lounge.'
        });
        console.log(`❌ [Knock Denied] Host denied ${waiting.user.name} from room ${room.roomId}`);
      }
    }
  });

  // Explicit Leave Room Handler
  socket.on('leave-room', ({ roomId }) => {
    const cleanRoomId = (roomId || state.currentRoom || '').toLowerCase().trim();
    if (!cleanRoomId) return;

    socket.leave(cleanRoomId);
    state.currentRoom = null;

    const room = RoomStore.getRoom(cleanRoomId);
    const user = RoomStore.removeUserFromRoom(cleanRoomId, socket.id);

    if (room) {
      // If user explicitly left, revoke approved member cache so re-entry requires password/knock if private
      if (user && room.approvedMembers) {
        const uKey = (user.email || user.name || '').toLowerCase().trim();
        room.approvedMembers.delete(uKey);
      }

      if (user) {
        RoomStore.logActivity(cleanRoomId, {
          type: 'leave',
          userName: user.name,
          userEmail: user.email,
          avatar: user.avatar,
          timestamp: Date.now()
        });

        socket.to(cleanRoomId).emit('user-left', {
          socketId: socket.id,
          userName: user.name
        });
      }

      const userList = Array.from(room.users.values());
      io.to(cleanRoomId).emit('room-users-update', {
        users: userList,
        hostSocketId: room.hostSocketId,
        maxCapacity: room.maxCapacity,
        isPublic: room.isPublic
      });

      io.to(cleanRoomId).emit('room-activity-update', {
        activities: room.activityLogs || []
      });
      console.log(`👋 [User Left] ${user?.name || socket.id} left room ${cleanRoomId}`);
    }
  });

  // Host Kicks / Throws User Out of Room
  socket.on('kick-user', ({ roomId, targetSocketId, targetUserName }) => {
    const cleanRoomId = (roomId || state.currentRoom || '').toLowerCase().trim();
    const room = RoomStore.getRoom(cleanRoomId);
    if (!room) return;

    const isHost = room.hostSocketId === socket.id ||
                   (room.originalHostName && room.originalHostName === state.currentUser?.name) ||
                   (room.originalHostEmail && room.originalHostEmail === state.currentUser?.email);

    if (!isHost) {
      return socket.emit('room-error', { code: 'UNAUTHORIZED', message: 'Only the Room Host can throw/kick users.' });
    }

    const targetSocket = targetSocketId ? io.sockets.sockets.get(targetSocketId) : null;
    const targetUser = targetSocketId ? room.users.get(targetSocketId) : null;
    const kickedName = targetUser?.name || targetUserName || 'Member';

    if (targetSocketId) {
      RoomStore.removeUserFromRoom(cleanRoomId, targetSocketId);
      if (targetSocket) {
        targetSocket.leave(cleanRoomId);
        targetSocket.emit('kicked-from-room', {
          roomId: cleanRoomId,
          message: `You were removed from the lounge by Host "${state.currentUser?.name || 'Host'}".`
        });
      }
    }

    // Revoke approval cache for kicked user
    if (targetUser && room.approvedMembers) {
      if (targetUser.email) room.approvedMembers.delete(targetUser.email.toLowerCase().trim());
      if (targetUser.name) room.approvedMembers.delete(targetUser.name.toLowerCase().trim());
    }

    // Log kick activity
    RoomStore.logActivity(cleanRoomId, {
      type: 'kicked',
      userName: kickedName,
      userEmail: targetUser?.email || '',
      avatar: targetUser?.avatar || '',
      by: state.currentUser?.name || 'Host',
      timestamp: Date.now()
    });

    // Broadcast user update & activity update
    const userList = Array.from(room.users.values());
    io.to(cleanRoomId).emit('room-users-update', {
      users: userList,
      hostSocketId: room.hostSocketId,
      maxCapacity: room.maxCapacity,
      isPublic: room.isPublic
    });

    io.to(cleanRoomId).emit('room-activity-update', {
      activities: room.activityLogs || []
    });

    // Announce kick in chat
    const kickNotice = {
      id: 'sys_' + Date.now(),
      text: `⚠️ **${kickedName}** was kicked from the lounge by Host **${state.currentUser?.name || 'Host'}**.`,
      senderId: 'system',
      senderName: 'CYPR ViAM System',
      timestamp: Date.now(),
      isAI: false,
      target: 'group',
      chatId: 'group'
    };
    io.to(cleanRoomId).emit('chat-message-received', kickNotice);
    RoomStore.addMessage(cleanRoomId, kickNotice);
    console.log(`⛔ [User Kicked] ${kickedName} kicked from ${cleanRoomId} by ${state.currentUser?.name}`);
  });

  // Query Room Details & Member Logs (for RoomsPage)
  socket.on('get-room-details', ({ roomId }) => {
    const targetRoomId = (roomId || state.currentRoom || '').toLowerCase().trim();
    const details = RoomStore.getRoomDetails(targetRoomId);
    if (details) {
      socket.emit('room-details-response', details);
    }
  });

  // Query All User Rooms (Active & Past History for RoomsPage)
  socket.on('get-my-rooms', ({ userEmail }) => {
    const cleanEmail = (userEmail || state.currentUser?.email || '').toLowerCase().trim();
    const activeRooms = RoomStore.getUserRoomsSummary(cleanEmail);
    const dbHistory = cleanEmail ? (DBService.getRoomHistory(cleanEmail, 30) || []) : [];
    socket.emit('my-rooms-response', {
      activeRooms,
      pastHistory: dbHistory
    });
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    if (state.currentRoom) {
      const room = RoomStore.getRoom(state.currentRoom);
      const user = RoomStore.removeUserFromRoom(state.currentRoom, socket.id);
      
      if (user && room) {
        RoomStore.logActivity(state.currentRoom, {
          type: 'leave',
          userName: user.name,
          userEmail: user.email,
          avatar: user.avatar,
          timestamp: Date.now()
        });

        socket.to(state.currentRoom).emit('user-left', {
          socketId: socket.id,
          userName: user.name
        });

        // Update remaining users about host change / user count
        const userList = Array.from(room.users.values());
        io.to(state.currentRoom).emit('room-users-update', {
          users: userList,
          hostSocketId: room.hostSocketId,
          maxCapacity: room.maxCapacity,
          isPublic: room.isPublic
        });

        io.to(state.currentRoom).emit('room-activity-update', {
          activities: room.activityLogs || []
        });
      }
    }
  });
}

function completeUserJoin(io, socket, room, user) {
  // STRICT CAPACITY CHECK
  if (room.users.size >= room.maxCapacity && !room.users.has(socket.id)) {
    console.warn(`[Room Denied] User "${user.name}" denied entry to room ${room.roomId} (Full: ${room.users.size}/${room.maxCapacity})`);
    return socket.emit('room-error', {
      code: 'ROOM_FULL',
      message: `Room "${room.roomId}" is full! Maximum capacity of ${room.maxCapacity} members reached.`
    });
  }

  socket.join(room.roomId);
  room.users.set(socket.id, user);

  if (!room.approvedMembers) room.approvedMembers = new Set();
  const uKey = (user.email || user.name || '').toLowerCase().trim();
  if (uKey) room.approvedMembers.add(uKey);

  console.log(`[User Joined] ${user.name} joined room ${room.roomId} (Occupancy: ${room.users.size}/${room.maxCapacity})`);

  // Explicit confirmation to joining socket so client immediately redirects to room
  socket.emit('room-joined', {
    roomId: room.roomId,
    isHost: room.hostSocketId === socket.id,
    maxCapacity: room.maxCapacity,
    isPublic: room.isPublic
  });

  if (room.cleanupTimer) {
    clearTimeout(room.cleanupTimer);
    room.cleanupTimer = null;
    console.log(`⏱️ [Cleanup Cancelled] User "${user.name}" joined "${room.roomId}", 2-hour inactivity timer cancelled.`);
  }

  RoomStore.logActivity(room.roomId, {
    type: 'join',
    userName: user.name,
    userEmail: user.email,
    avatar: user.avatar,
    timestamp: Date.now()
  });

  if (user.email) {
    try {
      const DBService = require('../services/dbService');
      DBService.addRoomHistory({
        userEmail: user.email,
        roomId: room.roomId,
        isHost: room.hostSocketId === socket.id
      });
    } catch (e) {
      console.warn('[DB Add Room History Error]', e.message);
    }
  }

  // Notify all users in the room about current participants and capacity
  const userList = Array.from(room.users.values());
  io.to(room.roomId).emit('room-users-update', {
    users: userList,
    newUser: user,
    hostSocketId: room.hostSocketId,
    maxCapacity: room.maxCapacity,
    isPublic: room.isPublic
  });

  io.to(room.roomId).emit('room-activity-update', {
    activities: room.activityLogs || []
  });

  // Send current media state and chat history to the newly joined/reconnected peer
  socket.emit('initial-media-state', room.mediaState);
  socket.emit('initial-chat-history', room.messages || []);
}

module.exports = registerRoomHandlers;
