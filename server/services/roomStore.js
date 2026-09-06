const { DEFAULT_MEDIA_STATE, ROOM_CLEANUP_INACTIVITY_MS } = require('../config/constants');
const bcrypt = require('bcryptjs');
const DBService = require('./dbService');

// In-Memory Databases
const usersDB = new Map(); // email -> user profile object
const otpStore = new Map(); // email -> { otp, expiresAt }
const roomsDB = new Map();  // roomId -> room state object

// Seed default demo account
async function seedDemoAccount() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  usersDB.set('demo@cypr.com', {
    id: 'usr_demo',
    name: 'Vineet Sharma ✨',
    gender: 'Male',
    phone: '+91 9876543210',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    email: 'demo@cypr.com',
    password: hashedPassword,
    createdAt: new Date().toISOString()
  });
}
seedDemoAccount();

class RoomStore {
  static getRoom(roomId) {
    const cleanId = (roomId || 'default').toLowerCase().trim();
    return roomsDB.get(cleanId);
  }

  static createOrGetRoom(roomId, { maxCapacity, isPublic, passcode, hostSocketId, hostUser }) {
    const cleanId = (roomId || 'default').toLowerCase().trim();
    
    if (!roomsDB.has(cleanId)) {
      const cap = isPublic ? 100 : Math.min(Math.max(parseInt(maxCapacity) || 2, 2), 100);
      const savedMessages = DBService.getRoomMessages(cleanId) || [];
      const hostKey = hostUser ? (hostUser.email || hostUser.name || '').toLowerCase().trim() : '';
      const initialApproved = new Set();
      if (hostKey) initialApproved.add(hostKey);

      roomsDB.set(cleanId, {
        roomId: cleanId,
        hostSocketId: hostSocketId || null,
        hostUser: hostUser || null,
        originalHostName: hostUser?.name || null,
        originalHostEmail: hostUser?.email || null,
        passcode: passcode ? String(passcode).trim() : '',
        maxCapacity: cap,
        isPublic: !!isPublic,
        users: new Map(),
        waitingUsers: new Map(),
        approvedMembers: initialApproved,
        messages: savedMessages,
        mediaState: { ...DEFAULT_MEDIA_STATE, updatedAt: Date.now() },
        cleanupTimer: null
      });
      console.log(`🔒 [Room Created] Room "${cleanId}" (Messages loaded: ${savedMessages.length}, Host: ${hostUser?.name || 'Guest'})`);
    } else {
      const room = roomsDB.get(cleanId);
      if (!room.messages || room.messages.length === 0) {
        room.messages = DBService.getRoomMessages(cleanId) || [];
      }
      if (passcode && !room.passcode) {
        room.passcode = String(passcode).trim();
      }
      if (room.cleanupTimer) {
        clearTimeout(room.cleanupTimer);
        room.cleanupTimer = null;
      }
    }

    return roomsDB.get(cleanId);
  }

  static addMessage(roomId, msg) {
    const cleanId = (roomId || 'default').toLowerCase().trim();
    const room = this.getRoom(cleanId);
    if (room) {
      if (!room.messages) room.messages = [];
      room.messages.push(msg);
      if (room.messages.length > 200) {
        room.messages.shift();
      }
    }
    try {
      DBService.saveRoomMessage(cleanId, msg);
    } catch (err) {
      console.warn('[RoomStore DB Save Message Error]:', err.message);
    }
  }

  static toggleReaction(roomId, messageId, emoji, userId) {
    const cleanId = (roomId || 'default').toLowerCase().trim();
    const room = this.getRoom(cleanId);
    if (!room) return {};

    if (!room.messages) room.messages = [];
    const targetId = String(messageId);
    let msg = room.messages.find(m => String(m.id || m.timestamp) === targetId || String(m.id) === targetId || String(m.timestamp) === targetId);

    if (!msg) {
      msg = { id: targetId, reactions: {}, userReactions: {} };
      room.messages.push(msg);
    }

    if (!msg.userReactions) msg.userReactions = {};
    const uKey = String(userId || 'anon');

    // Toggle: if user clicked the same emoji, remove it
    if (msg.userReactions[uKey] === emoji) {
      delete msg.userReactions[uKey];
    } else {
      msg.userReactions[uKey] = emoji;
    }

    // Recompute exact counts per emoji
    const counts = {};
    for (const em of Object.values(msg.userReactions)) {
      if (em) {
        counts[em] = (counts[em] || 0) + 1;
      }
    }
    msg.reactions = counts;
    return msg.reactions;
  }

  static removeUserFromRoom(roomId, socketId) {
    const cleanId = (roomId || '').toLowerCase().trim();
    const room = roomsDB.get(cleanId);
    if (!room) return null;

    const user = room.users.get(socketId);
    room.users.delete(socketId);
    room.waitingUsers.delete(socketId);

    // Re-assign host if host left
    if (room.hostSocketId === socketId && room.users.size > 0) {
      const nextSocketId = room.users.keys().next().value;
      const nextUser = room.users.get(nextSocketId);
      room.hostSocketId = nextSocketId;
      room.hostUser = nextUser;
      console.log(`👑 [Host Shifted] New host for "${cleanId}" is ${nextUser?.name}`);
    }

    // Schedule cleanup if room is empty
    if (room.users.size === 0) {
      if (room.cleanupTimer) clearTimeout(room.cleanupTimer);
      room.cleanupTimer = setTimeout(() => {
        if (roomsDB.has(cleanId) && roomsDB.get(cleanId).users.size === 0) {
          roomsDB.delete(cleanId);
          console.log(`🧹 [Room Cleaned] Closed empty room "${cleanId}" after inactivity.`);
        }
      }, ROOM_CLEANUP_INACTIVITY_MS);
    }

    return user;
  }

  static verifyPasscode(roomId, providedPasscode) {
    const room = this.getRoom(roomId);
    if (!room || !room.passcode) return true; // No passcode set on room
    return String(providedPasscode || '').trim() === room.passcode;
  }
}

module.exports = {
  usersDB,
  otpStore,
  roomsDB,
  RoomStore
};
