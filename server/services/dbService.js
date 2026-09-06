const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'cypr.db');
const db = new Database(dbPath);

// Enable WAL mode for high concurrency
db.pragma('journal_mode = WAL');

// Initialize database schemas
function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      gender TEXT,
      phone TEXT,
      dob TEXT,
      favoriteGenre TEXT,
      bio TEXT,
      avatar TEXT,
      preferredQuality TEXT DEFAULT '1080p',
      preferredLanguage TEXT DEFAULT 'en',
      subtitlesEnabled INTEGER DEFAULT 1,
      autoPlayNext INTEGER DEFAULT 1,
      theme TEXT DEFAULT 'dark',
      createdAt TEXT,
      updatedAt TEXT
    );

    CREATE TABLE IF NOT EXISTS otps (
      email TEXT PRIMARY KEY,
      otp TEXT NOT NULL,
      expiresAt INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      id TEXT PRIMARY KEY,
      userEmail TEXT NOT NULL,
      roomId TEXT,
      movieTitle TEXT NOT NULL,
      moviePoster TEXT,
      sourceType TEXT,
      url TEXT,
      watchedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_history (
      id TEXT PRIMARY KEY,
      userEmail TEXT NOT NULL,
      roomId TEXT NOT NULL,
      isHost INTEGER NOT NULL,
      joinedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS room_messages (
      id TEXT PRIMARY KEY,
      roomId TEXT NOT NULL,
      senderId TEXT,
      senderName TEXT NOT NULL,
      recipientSocketId TEXT,
      recipientName TEXT,
      target TEXT DEFAULT 'group',
      chatId TEXT DEFAULT 'group',
      type TEXT DEFAULT 'text',
      text TEXT,
      content TEXT,
      isAI INTEGER DEFAULT 0,
      avatar TEXT,
      timestamp INTEGER NOT NULL,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS user_activities (
      id TEXT PRIMARY KEY,
      userEmail TEXT,
      userName TEXT,
      roomId TEXT,
      activityType TEXT NOT NULL,
      detail TEXT NOT NULL,
      timestamp INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_room_messages_roomId ON room_messages(roomId);
    CREATE INDEX IF NOT EXISTS idx_user_activities_user ON user_activities(userEmail, userName);
  `);

  // Migrate existing tables if columns are missing
  try {
    const columns = db.pragma('table_info(users)').map(c => c.name);
    if (!columns.includes('preferredQuality')) db.exec("ALTER TABLE users ADD COLUMN preferredQuality TEXT DEFAULT '1080p'");
    if (!columns.includes('preferredLanguage')) db.exec("ALTER TABLE users ADD COLUMN preferredLanguage TEXT DEFAULT 'en'");
    if (!columns.includes('subtitlesEnabled')) db.exec("ALTER TABLE users ADD COLUMN subtitlesEnabled INTEGER DEFAULT 1");
    if (!columns.includes('autoPlayNext')) db.exec("ALTER TABLE users ADD COLUMN autoPlayNext INTEGER DEFAULT 1");
    if (!columns.includes('theme')) db.exec("ALTER TABLE users ADD COLUMN theme TEXT DEFAULT 'dark'");
  } catch (err) {
    console.warn('[DB Migration Warning]', err.message);
  }

  console.log(`🗄️ [SQLite Database] Initialized schema successfully at ${dbPath}`);
}

initDatabase();

// --- Database Operations ---

class DBService {
  // Users
  static getUserByEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(cleanEmail);
  }

  static createUser(user) {
    const stmt = db.prepare(`
      INSERT INTO users (
        id, name, email, password, gender, phone, dob, favoriteGenre, bio, avatar,
        preferredQuality, preferredLanguage, subtitlesEnabled, autoPlayNext, theme,
        createdAt, updatedAt
      )
      VALUES (
        @id, @name, @email, @password, @gender, @phone, @dob, @favoriteGenre, @bio, @avatar,
        @preferredQuality, @preferredLanguage, @subtitlesEnabled, @autoPlayNext, @theme,
        @createdAt, @updatedAt
      )
    `);
    stmt.run({
      id: user.id,
      name: user.name,
      email: user.email.toLowerCase(),
      password: user.password,
      gender: user.gender || 'Male',
      phone: user.phone || '',
      dob: user.dob || '',
      favoriteGenre: user.favoriteGenre || 'Sci-Fi',
      bio: user.bio || 'Co-watching movies together ❤️',
      avatar: user.avatar || '',
      preferredQuality: user.preferredQuality || '1080p',
      preferredLanguage: user.preferredLanguage || 'en',
      subtitlesEnabled: user.subtitlesEnabled !== undefined ? (user.subtitlesEnabled ? 1 : 0) : 1,
      autoPlayNext: user.autoPlayNext !== undefined ? (user.autoPlayNext ? 1 : 0) : 1,
      theme: user.theme || 'dark',
      createdAt: user.createdAt || new Date().toISOString(),
      updatedAt: user.updatedAt || new Date().toISOString()
    });
    return this.getUserByEmail(user.email);
  }

  static updateUserProfile(email, profileData) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const existing = this.getUserByEmail(cleanEmail);
    if (!existing) return null;

    const stmt = db.prepare(`
      UPDATE users SET
        name = @name,
        gender = @gender,
        phone = @phone,
        dob = @dob,
        favoriteGenre = @favoriteGenre,
        bio = @bio,
        avatar = @avatar,
        preferredQuality = @preferredQuality,
        preferredLanguage = @preferredLanguage,
        subtitlesEnabled = @subtitlesEnabled,
        autoPlayNext = @autoPlayNext,
        theme = @theme,
        updatedAt = @updatedAt
      WHERE email = @email
    `);

    stmt.run({
      email: cleanEmail,
      name: profileData.name || existing.name,
      gender: profileData.gender || existing.gender,
      phone: profileData.phone !== undefined ? profileData.phone : existing.phone,
      dob: profileData.dob !== undefined ? profileData.dob : existing.dob,
      favoriteGenre: profileData.favoriteGenre || existing.favoriteGenre,
      bio: profileData.bio !== undefined ? profileData.bio : existing.bio,
      avatar: profileData.avatar || existing.avatar,
      preferredQuality: profileData.preferredQuality || existing.preferredQuality || '1080p',
      preferredLanguage: profileData.preferredLanguage || existing.preferredLanguage || 'en',
      subtitlesEnabled: profileData.subtitlesEnabled !== undefined ? (profileData.subtitlesEnabled ? 1 : 0) : existing.subtitlesEnabled,
      autoPlayNext: profileData.autoPlayNext !== undefined ? (profileData.autoPlayNext ? 1 : 0) : existing.autoPlayNext,
      theme: profileData.theme || existing.theme || 'dark',
      updatedAt: new Date().toISOString()
    });

    return this.getUserByEmail(cleanEmail);
  }

  // OTPs
  static setOtp(email, otp, expiresAt) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const stmt = db.prepare(`
      INSERT INTO otps (email, otp, expiresAt)
      VALUES (?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET otp = excluded.otp, expiresAt = excluded.expiresAt
    `);
    stmt.run(cleanEmail, otp, expiresAt);
  }

  static getOtp(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const stmt = db.prepare('SELECT * FROM otps WHERE email = ?');
    return stmt.get(cleanEmail);
  }

  static deleteOtp(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const stmt = db.prepare('DELETE FROM otps WHERE email = ?');
    stmt.run(cleanEmail);
  }

  // Watch History
  static addWatchHistory({ userEmail, roomId, movieTitle, moviePoster, sourceType, url }) {
    if (!userEmail || !movieTitle) return;
    const stmt = db.prepare(`
      INSERT INTO watch_history (id, userEmail, roomId, movieTitle, moviePoster, sourceType, url, watchedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const id = 'his_' + Math.random().toString(36).substring(2, 9);
    stmt.run(id, userEmail.toLowerCase(), roomId || '', movieTitle, moviePoster || '', sourceType || 'direct', url || '', new Date().toISOString());
  }

  static getWatchHistory(userEmail, limit = 20) {
    const stmt = db.prepare('SELECT * FROM watch_history WHERE userEmail = ? ORDER BY watchedAt DESC LIMIT ?');
    return stmt.all((userEmail || '').toLowerCase(), limit);
  }

  // Room History
  static addRoomHistory({ userEmail, roomId, isHost }) {
    if (!userEmail || !roomId) return;
    const stmt = db.prepare(`
      INSERT INTO room_history (id, userEmail, roomId, isHost, joinedAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    const id = 'rmh_' + Math.random().toString(36).substring(2, 9);
    stmt.run(id, userEmail.toLowerCase(), roomId.toLowerCase(), isHost ? 1 : 0, new Date().toISOString());
  }

  static getRoomHistory(userEmail, limit = 20) {
    const stmt = db.prepare('SELECT * FROM room_history WHERE userEmail = ? ORDER BY joinedAt DESC LIMIT ?');
    return stmt.all((userEmail || '').toLowerCase(), limit);
  }

  // Room Messages (Persistent Chat until Room is deleted)
  static saveRoomMessage(roomId, msg) {
    if (!roomId || !msg) return;
    const cleanRoomId = roomId.trim().toLowerCase();
    const id = msg.id || ('msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO room_messages (
        id, roomId, senderId, senderName, recipientSocketId, recipientName,
        target, chatId, type, text, content, isAI, avatar, timestamp, data
      )
      VALUES (
        @id, @roomId, @senderId, @senderName, @recipientSocketId, @recipientName,
        @target, @chatId, @type, @text, @content, @isAI, @avatar, @timestamp, @data
      )
    `);

    stmt.run({
      id: String(id),
      roomId: cleanRoomId,
      senderId: msg.senderId || '',
      senderName: msg.senderName || 'Anonymous',
      recipientSocketId: msg.recipientSocketId || 'group',
      recipientName: msg.recipientName || '',
      target: msg.target || 'group',
      chatId: msg.chatId || (msg.recipientSocketId && msg.recipientSocketId !== 'group' ? `dm_${msg.recipientSocketId}` : 'group'),
      type: msg.type || 'text',
      text: msg.text || '',
      content: msg.content || '',
      isAI: msg.isAI ? 1 : 0,
      avatar: msg.avatar || '',
      timestamp: msg.timestamp || Date.now(),
      data: JSON.stringify(msg)
    });
  }

  static getRoomMessages(roomId, limit = 200) {
    if (!roomId) return [];
    const cleanRoomId = roomId.trim().toLowerCase();
    const stmt = db.prepare('SELECT * FROM room_messages WHERE roomId = ? ORDER BY timestamp ASC LIMIT ?');
    const rows = stmt.all(cleanRoomId, limit);
    return rows.map(r => {
      try {
        if (r.data) {
          const parsed = JSON.parse(r.data);
          return {
            ...parsed,
            id: r.id,
            roomId: r.roomId,
            senderId: r.senderId,
            senderName: r.senderName,
            recipientSocketId: r.recipientSocketId,
            recipientName: r.recipientName,
            target: r.target,
            chatId: r.chatId,
            type: r.type,
            text: r.text,
            content: r.content,
            isAI: r.isAI === 1,
            avatar: r.avatar,
            timestamp: r.timestamp
          };
        }
      } catch (err) {}
      return {
        id: r.id,
        roomId: r.roomId,
        senderId: r.senderId,
        senderName: r.senderName,
        recipientSocketId: r.recipientSocketId,
        recipientName: r.recipientName,
        target: r.target,
        chatId: r.chatId,
        type: r.type,
        text: r.text,
        content: r.content,
        isAI: r.isAI === 1,
        avatar: r.avatar,
        timestamp: r.timestamp
      };
    });
  }

  static deleteRoomMessages(roomId) {
    if (!roomId) return;
    const cleanRoomId = roomId.trim().toLowerCase();
    const stmt = db.prepare('DELETE FROM room_messages WHERE roomId = ?');
    stmt.run(cleanRoomId);
  }

  // --- User Activity & AI Memory Logging ---
  static logActivity(userEmail, userName, roomId, activityType, detail) {
    try {
      const id = 'act_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      const stmt = db.prepare(`
        INSERT INTO user_activities (id, userEmail, userName, roomId, activityType, detail, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id,
        (userEmail || 'guest').toLowerCase(),
        userName || 'Guest',
        roomId || 'default',
        activityType,
        typeof detail === 'object' ? JSON.stringify(detail) : String(detail),
        Date.now()
      );
    } catch (err) {
      console.warn('[DB Log Activity Error]:', err.message);
    }
  }

  static getUserMemory(userName, userEmail, limit = 15) {
    try {
      const cleanEmail = (userEmail || '').toLowerCase();
      const stmt = db.prepare(`
        SELECT activityType, detail, timestamp FROM user_activities
        WHERE userEmail = ? OR userName = ?
        ORDER BY timestamp DESC LIMIT ?
      `);
      return stmt.all(cleanEmail, userName || '', limit);
    } catch (err) {
      console.warn('[DB Get User Memory Error]:', err.message);
      return [];
    }
  }
}

module.exports = DBService;
