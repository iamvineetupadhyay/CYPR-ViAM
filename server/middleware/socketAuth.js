/**
 * CYPR ViAM Socket.IO Authentication Middleware
 * Verifies JWT token on connection handshake.
 * Non-blocking: guests without token are allowed read-only access.
 */
const { verifyToken } = require('../utils/crypto');

/**
 * Socket.IO middleware that optionally authenticates via JWT.
 * Token should be passed in socket handshake: socket.auth = { token: '...' }
 */
function socketAuthMiddleware(socket, next) {
  const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      socket.data.jwtUser = decoded;  // { id, email, name }
      socket.data.isAuthenticated = true;
      console.log(`🔐 [Socket Auth] Authenticated: ${decoded.email} (${socket.id})`);
    } else {
      console.warn(`⚠️ [Socket Auth] Invalid token from ${socket.id} — allowing as guest`);
      socket.data.isAuthenticated = false;
    }
  } else {
    socket.data.isAuthenticated = false;
  }

  next(); // Non-blocking: always allow connection, restrict at handler level
}

/**
 * Guard helper — use inside socket event handlers to require auth
 * Usage: if (!requireAuth(socket)) return;
 */
function requireAuth(socket) {
  if (!socket.data.isAuthenticated) {
    socket.emit('auth-error', { message: 'Authentication required. Please log in to use this feature.' });
    return false;
  }
  return true;
}

module.exports = { socketAuthMiddleware, requireAuth };
