require('dotenv').config();
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

// Security Hardening: Helmet Headers & CSP
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for flexible cross-origin media embedding
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS and Body Parsers
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Serve frontend build static files in Production / Docker container
const path = require('path');
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
  maxHttpBufferSize: 1e7 // 10MB limit for image attachments
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
