const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/authRoutes');
const searchRoutes = require('./routes/searchRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { generalApiLimiter } = require('./middleware/rateLimiter');
const { socketAuthMiddleware } = require('./middleware/socketAuth');

const registerRoomHandlers = require('./sockets/roomHandler');
const registerWebRTCHandlers = require('./sockets/webrtcHandler');
const registerMediaHandlers = require('./sockets/mediaHandler');
const registerChatHandlers = require('./sockets/chatHandler');

const app = express();

// Trust reverse proxy for Render / load balancers
app.set('trust proxy', 1);

// Security Hardening: Helmet Headers & CSP
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for flexible cross-origin media embedding
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS and Body Parsers
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// General Rate Limiter for all API routes
app.use('/api/', generalApiLimiter);

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'CYPR ViAM Signaling & Media Sync Server',
    architecture: 'Modular Security Engine v2.0',
    security: {
      rateLimiting: 'active',
      helmet: 'active',
      socketAuth: 'active',
      e2eePipelines: 'enforced'
    },
    time: new Date().toISOString()
  });
});

// Dynamic WebRTC ICE / STUN / TURN Server Relay Endpoint
let cachedMeteredIce = null;
let lastMeteredFetch = 0;

app.get('/api/webrtc/ice-servers', async (req, res) => {
  try {
    const meteredApiKey = process.env.METERED_API_KEY;
    const meteredAppName = process.env.METERED_APP_NAME;

    // 1. Dynamic Metered TURN Relay (If configured in server/.env)
    if (meteredAppName && (meteredApiKey || process.env.METERED_SECRET_KEY)) {
      const now = Date.now();
      if (cachedMeteredIce && (now - lastMeteredFetch < 15 * 60 * 1000)) {
        return res.json({ iceServers: cachedMeteredIce, source: 'metered-cached' });
      }

      let activeApiKey = meteredApiKey;
      if (!activeApiKey && process.env.METERED_SECRET_KEY) {
        try {
          const createRes = await fetch(`https://${meteredAppName}.metered.live/api/v1/turn/credential?secretKey=${process.env.METERED_SECRET_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: 'cypr-viam-client' }),
            signal: AbortSignal.timeout(3500)
          });
          const cred = await createRes.json();
          if (cred && cred.apiKey) {
            activeApiKey = cred.apiKey;
          }
        } catch (e) {}
      }

      if (activeApiKey) {
        try {
          const meteredRes = await fetch(`https://${meteredAppName}.metered.live/api/v1/turn/credentials?apiKey=${activeApiKey}`, {
            signal: AbortSignal.timeout(3500)
          });
          const data = await meteredRes.json();
          if (Array.isArray(data) && data.length > 0) {
            cachedMeteredIce = data;
            lastMeteredFetch = now;
            console.log(`📡 [WebRTC TURN] Successfully loaded ${data.length} dynamic TURN relay servers from Metered (${meteredAppName})`);
            return res.json({ iceServers: data, source: 'metered' });
          }
        } catch (err) {
          console.warn('⚠️ [WebRTC TURN] Metered fetch note:', err.message);
        }
      }
    }

    // 2. Custom TURN Relay from ENV
    const customTurnUrl = process.env.TURN_URL;
    const customTurnUser = process.env.TURN_USERNAME;
    const customTurnPass = process.env.TURN_CREDENTIAL;
    const customServers = [];

    if (customTurnUrl && customTurnUser && customTurnPass) {
      customServers.push({
        urls: customTurnUrl.includes(',') ? customTurnUrl.split(',').map(u => u.trim()) : customTurnUrl.trim(),
        username: customTurnUser.trim(),
        credential: customTurnPass.trim()
      });
    }

    // 3. Fallback to Global Anycast STUN servers
    const defaultStun = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      { urls: 'stun:global.stun.twilio.com:3478' },
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:stun.nextcloud.com:443' }
    ];

    res.json({
      iceServers: [...customServers, ...defaultStun],
      source: customServers.length > 0 ? 'custom-turn' : 'stun-default'
    });
  } catch (err) {
    console.error('❌ [WebRTC ICE Error]', err);
    res.status(500).json({ error: 'Failed to retrieve ICE servers' });
  }
});

// Serve frontend build static files in Production / Docker container
const fs = require('fs');

const publicPath = path.join(__dirname, 'public');
const localDistPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(publicPath, 'index.html'));
  });
} else if (fs.existsSync(localDistPath)) {
  app.use(express.static(localDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(localDistPath, 'index.html'));
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  maxHttpBufferSize: 2.5e7 // 25MB limit for attachments, images & media
});

// Socket Authentication Middleware
io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  console.log(`⚡ [Socket Connected] ID: ${socket.id} (Auth: ${socket.data?.isAuthenticated ? socket.data.jwtUser?.email : 'Guest'})`);

  const state = {
    currentRoom: null,
    currentUser: socket.data?.jwtUser ? {
      name: socket.data.jwtUser.name,
      email: socket.data.jwtUser.email,
      id: socket.data.jwtUser.id
    } : null
  };

  registerRoomHandlers(io, socket, state);
  registerWebRTCHandlers(io, socket, state);
  registerMediaHandlers(io, socket, state);
  registerChatHandlers(io, socket, state);
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`✨ [CYPR ViAM Modular Server] Listening on http://localhost:${PORT}`);
});
