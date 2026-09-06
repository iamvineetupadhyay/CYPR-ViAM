const { RoomStore } = require('../services/roomStore');
const { createSocketRateLimiter } = require('../middleware/rateLimiter');
const GroqService = require('../services/groqService');
const DBService = require('../services/dbService');

// Anti-spam rate limiters for chat & reactions
const chatMsgLimiter = createSocketRateLimiter(8, 3000); // 8 messages per 3s
const reactionLimiter = createSocketRateLimiter(15, 3000); // 15 reactions per 3s

function sanitizeString(str, maxLength = 2000) {
  if (str === null || str === undefined) return '';
  const s = typeof str === 'string' ? str : String(str);
  return s.slice(0, maxLength).trim();
}

async function resolveMovieForPlay(queryOrUrl) {
  const q = (queryOrUrl || '').trim();
  if (!q) return null;

  // 1. Direct URL (YouTube, MP4, HLS, Stream)
  if (q.startsWith('http://') || q.startsWith('https://')) {
    const isYt = q.includes('youtube.com') || q.includes('youtu.be');
    return {
      sourceType: isYt ? 'youtube' : 'direct',
      url: q,
      title: isYt ? '▶️ YouTube Stream' : '⚡ Custom Stream: ' + q,
      servers: [
        { name: isYt ? '▶️ YouTube Stream' : '⚡ Direct Native Cinema Stream', url: q, sourceType: isYt ? 'youtube' : 'direct' }
      ]
    };
  }

  // 2. Search TMDB API
  try {
    const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(q)}&api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb`, {
      signal: AbortSignal.timeout(3000)
    });
    const tmdbData = await tmdbRes.json();
    if (tmdbData?.results?.length > 0) {
      const m = tmdbData.results[0];
      const yearStr = m.release_date ? ` (${m.release_date.split('-')[0]})` : '';
      return {
        sourceType: 'embed',
        url: `https://autoembed.co/movie/tmdb/${m.id}`,
        title: `${m.title}${yearStr}`,
        tmdbId: m.id,
        poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        servers: [
          { name: '⚡ Server 1 (AutoEmbed CDN)', url: `https://autoembed.co/movie/tmdb/${m.id}`, speed: 'Fast' },
          { name: '🔥 Server 2 (VidSrc.to Pro)', url: `https://vidsrc.to/embed/movie/${m.id}`, speed: 'Ultra HD' },
          { name: '🎬 Server 3 (2Embed Multi)', url: `https://2embed.cc/embed/movie/${m.id}`, speed: 'High' }
        ]
      };
    }
  } catch (err) {
    console.warn('[Play Command TMDB Search Error]:', err.message);
  }

  // 3. Try Neural Search Resolver via Groq
  try {
    const matches = await GroqService.resolveNeuralSearch(q);
    if (matches && matches.length > 0) {
      const topMatch = matches[0];
      const tmdbRes = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(topMatch.title)}&api_key=15d2ea6d0dc1d476efbca3eba2b9bbfb`, {
        signal: AbortSignal.timeout(3000)
      });
      const tmdbData = await tmdbRes.json();
      if (tmdbData?.results?.length > 0) {
        const m = tmdbData.results[0];
        const yearStr = m.release_date ? ` (${m.release_date.split('-')[0]})` : '';
        return {
          sourceType: 'embed',
          url: `https://autoembed.co/movie/tmdb/${m.id}`,
          title: `${m.title}${yearStr}`,
          tmdbId: m.id,
          poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
          servers: [
            { name: '⚡ Server 1 (AutoEmbed CDN)', url: `https://autoembed.co/movie/tmdb/${m.id}`, speed: 'Fast' },
            { name: '🔥 Server 2 (VidSrc.to Pro)', url: `https://vidsrc.to/embed/movie/${m.id}`, speed: 'Ultra HD' }
          ]
        };
      }
    }
  } catch (err) {
    console.warn('[Play Command Neural Search Error]:', err.message);
  }

  // 4. Try YouTube Search as fallback
  try {
    const ytRes = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' trailer')}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(3000)
    });
    const ytHtml = await ytRes.text();
    const match = ytHtml.match(/ytInitialData\s*=\s*({.+?});<\/script>/);
    if (match) {
      const data = JSON.parse(match[1]);
      const contents = data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents[0]?.itemSectionRenderer?.contents || [];
      for (const item of contents) {
        if (item.videoRenderer) {
          const v = item.videoRenderer;
          const title = v.title?.runs?.[0]?.text || '';
          const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          const hasMatch = words.length === 0 || words.some(w => title.toLowerCase().includes(w));
          if (hasMatch) {
            return {
              sourceType: 'youtube',
              url: `https://www.youtube.com/watch?v=${v.videoId}`,
              title: title || q,
              servers: [{ name: '▶️ YouTube Stream', url: `https://www.youtube.com/watch?v=${v.videoId}`, sourceType: 'youtube' }]
            };
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Play Command YouTube Search Error]:', err.message);
  }

  return null;
}

function registerChatHandlers(io, socket, state) {
  // Text message (Group or Direct 1-on-1)
  socket.on('chat-message', async (msg) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!chatMsgLimiter(socket.id)) {
      return socket.emit('rate-limit-warning', { message: 'Chatting too fast. Please slow down.' });
    }

    const cleanText = typeof msg.text === 'string' ? sanitizeString(msg.text, 5000) : '';
    const isMedia = ['image', 'file', 'voice', 'gif', 'sticker'].includes(msg.type) && !!msg.content;

    // Reject message only if neither text nor media content is present
    if (!cleanText && !isMedia) return;

    // Check for /play command (only for text messages)
    if (cleanText && cleanText.toLowerCase().startsWith('/play')) {
      const targetQuery = cleanText.replace(/^\/play\s*/i, '').trim();

      if (!targetQuery) {
        const helpAiMsg = {
          id: 'ai_' + Date.now(),
          text: `🍿 **ViAM AI Cinema Play Command:**\n\nMovie chalane ke liye command aise likhein:\n- \`/play Inception\`\n- \`/play Interstellar\`\n- \`/play <Direct Video / YouTube / MP4 URL>\``,
          senderId: 'viam-ai-bot',
          senderName: 'ViAM AI 🤖',
          timestamp: Date.now(),
          isAI: true
        };
        socket.emit('chat-message-received', helpAiMsg);
        return;
      }

      // Show typing indicator
      socket.emit('partner-typing', { senderName: 'ViAM AI 🤖', senderSocketId: 'viam-ai-bot', isDirect: false });

      const resolved = await resolveMovieForPlay(targetQuery);

      if (resolved) {
        const newMedia = {
          ...resolved,
          currentTime: 0,
          isPlaying: true
        };
        room.mediaState = newMedia;

        // Broadcast media-changed to everyone in the room in 0ms sync
        io.to(state.currentRoom).emit('media-changed', newMedia);

        const successAiMsg = {
          id: 'ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          text: `🎬 **Ab shuru ho rahi hai: ${newMedia.title}**! 🍿\n\nRoom ke sabhi members ke liye Cinema mode me synchronized streaming start ho gayi hai! Enjoy the movie! ✨`,
          senderId: 'viam-ai-bot',
          senderName: 'ViAM AI 🤖',
          timestamp: Date.now(),
          isAI: true,
          target: 'group',
          chatId: 'group'
        };
        io.to(state.currentRoom).emit('chat-message-received', successAiMsg);
        RoomStore.addMessage(state.currentRoom, successAiMsg);
      } else {
        // Movie not found -> Ask user for direct stream link
        const failAiMsg = {
          id: 'ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          text: `⚠️ **Arre! Mujhe "${targetQuery}" ka direct stream nahi mil paaya!** 🎬\n\nKya aapke paas is film ka koi direct streaming link, HDHub4u link ya MP4 URL hai? 🔗\n\nAap direct paste kar sakte hain: \`/play <link>\` aur main use sabhi members ke liye turant live synchronized play kar dunga! ✨`,
          senderId: 'viam-ai-bot',
          senderName: 'ViAM AI 🤖',
          timestamp: Date.now(),
          isAI: true,
          target: 'group',
          chatId: 'group'
        };
        io.to(state.currentRoom).emit('chat-message-received', failAiMsg);
        RoomStore.addMessage(state.currentRoom, failAiMsg);
      }
      return;
    }

    const outMsg = {
      ...msg,
      id: msg.id || (Date.now() + '-' + Math.random().toString(36).substr(2, 6)),
      type: msg.type || 'text',
      text: cleanText,
      content: isMedia ? msg.content : (msg.content || undefined),
      fileName: msg.fileName ? sanitizeString(msg.fileName, 255) : undefined,
      fileSize: msg.fileSize ? sanitizeString(msg.fileSize, 50) : undefined,
      duration: msg.duration ? sanitizeString(msg.duration, 50) : undefined,
      senderId: socket.id,
      senderName: state.currentUser?.name || msg.senderName || 'Anonymous',
      timestamp: msg.timestamp || Date.now()
    };

    if (msg.recipientSocketId && msg.recipientSocketId !== 'group') {
      // Direct 1-on-1 Message: route directly to recipient and echo back to sender
      if (msg.recipientSocketId !== 'viam-ai-bot') {
        io.to(msg.recipientSocketId).emit('chat-message-received', outMsg);
      }
      socket.emit('chat-message-received', outMsg);
      RoomStore.addMessage(state.currentRoom, outMsg);
    } else {
      // Main Lounge Group Message: broadcast to everyone in the room
      const groupMsg = { ...outMsg, target: 'group', chatId: 'group' };
      io.to(state.currentRoom).emit('chat-message-received', groupMsg);
      RoomStore.addMessage(state.currentRoom, groupMsg);
    }

    // AI Companion Bot Auto-Responder (@ai, @viam, or direct message to viam-ai-bot)
    const lowerText = cleanText ? cleanText.toLowerCase() : '';
    const isAiMention = lowerText && (lowerText.includes('@ai') || lowerText.includes('@viam') || lowerText.startsWith('ai ') || lowerText.startsWith('hey ai') || msg.recipientSocketId === 'viam-ai-bot');

    if (isAiMention) {
      const userPrompt = cleanText.replace(/@ai|@viam-ai|@viam|hey ai/gi, '').trim();

      // Log AI chat activity for personalized AI memory
      DBService.logActivity(state.currentUser?.email, state.currentUser?.name, state.currentRoom, 'ai_chat', userPrompt || cleanText);
      const userMemory = DBService.getUserMemory(state.currentUser?.name, state.currentUser?.email, 12);

      // Emit typing indicator
      if (msg.recipientSocketId === 'viam-ai-bot') {
        socket.emit('partner-typing', { senderName: 'ViAM AI 🤖', senderSocketId: 'viam-ai-bot', isDirect: true });
      } else {
        io.to(state.currentRoom).emit('partner-typing', { senderName: 'ViAM AI 🤖', isDirect: false });
      }

      setTimeout(async () => {
        try {
          const aiReply = await GroqService.getCompanionResponse(
            userPrompt || 'Hey ViAM AI, what can you do?',
            [],
            room.mediaState,
            userMemory
          );

          const aiMsg = {
            id: 'ai_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            text: aiReply,
            senderId: 'viam-ai-bot',
            senderName: 'ViAM AI 🤖',
            avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
            timestamp: Date.now(),
            isAI: true
          };

          if (msg.recipientSocketId === 'viam-ai-bot') {
            socket.emit('partner-typing-stop', { senderSocketId: 'viam-ai-bot' });
            socket.emit('chat-message-received', { ...aiMsg, chatId: 'dm_viam-ai-bot', recipientSocketId: socket.id });
          } else {
            io.to(state.currentRoom).emit('partner-typing-stop', { senderSocketId: 'viam-ai-bot' });
            const groupAiMsg = { ...aiMsg, target: 'group', chatId: 'group' };
            io.to(state.currentRoom).emit('chat-message-received', groupAiMsg);
            RoomStore.addMessage(state.currentRoom, groupAiMsg);
          }
        } catch (err) {
          console.error('[AI Chat Generation Error]:', err);
        }
      }, 350);
    }
  });

  // Rich media message (image, GIF, voice note, sticker)
  socket.on('chat-media', (msg) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!chatMsgLimiter(socket.id)) {
      return socket.emit('rate-limit-warning', { message: 'Media sharing rate limit reached.' });
    }

    const outMsg = {
      ...msg,
      senderId: socket.id,
      senderName: state.currentUser?.name || msg.senderName || 'Anonymous',
      timestamp: Date.now()
    };

    if (msg.recipientSocketId && msg.recipientSocketId !== 'group') {
      io.to(msg.recipientSocketId).emit('chat-message-received', outMsg);
      socket.emit('chat-message-received', outMsg);
      RoomStore.addMessage(state.currentRoom, outMsg);
    } else {
      const groupMsg = { ...outMsg, target: 'group', chatId: 'group' };
      io.to(state.currentRoom).emit('chat-message-received', groupMsg);
      RoomStore.addMessage(state.currentRoom, groupMsg);
    }
  });

  // Typing indicator
  socket.on('typing-start', (data) => {
    if (!state.currentRoom) return;
    const recipientSocketId = data?.recipientSocketId;
    if (recipientSocketId && recipientSocketId !== 'group') {
      io.to(recipientSocketId).emit('partner-typing', {
        senderName: state.currentUser?.name,
        senderSocketId: socket.id,
        isDirect: true
      });
    } else {
      socket.to(state.currentRoom).emit('partner-typing', {
        senderName: state.currentUser?.name,
        senderSocketId: socket.id,
        isDirect: false
      });
    }
  });

  socket.on('typing-stop', (data) => {
    if (!state.currentRoom) return;
    const recipientSocketId = data?.recipientSocketId;
    if (recipientSocketId && recipientSocketId !== 'group') {
      io.to(recipientSocketId).emit('partner-typing-stop', {
        senderSocketId: socket.id
      });
    } else {
      socket.to(state.currentRoom).emit('partner-typing-stop', {
        senderSocketId: socket.id
      });
    }
  });

  // Message reaction
  socket.on('message-react', ({ messageId, emoji }) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!reactionLimiter(socket.id)) return;

    const cleanMsgId = sanitizeString(messageId, 100);
    const cleanEmoji = sanitizeString(emoji, 20);
    if (!cleanMsgId || !cleanEmoji) return;

    const userId = state.currentUser?.name || state.currentUser?.email || socket.id;
    const updatedReactions = RoomStore.toggleReaction(state.currentRoom, cleanMsgId, cleanEmoji, userId);

    io.to(state.currentRoom).emit('message-reacted', {
      messageId: cleanMsgId,
      reactions: updatedReactions || {},
      emoji: cleanEmoji,
      senderId: socket.id,
      senderName: state.currentUser?.name
    });
  });

  // Floating reactions
  socket.on('send-reaction', (reaction) => {
    if (!state.currentRoom) return;
    const room = RoomStore.getRoom(state.currentRoom);
    if (!room || !room.users.has(socket.id)) return;

    if (!reactionLimiter(socket.id)) return;

    io.to(state.currentRoom).emit('reaction-received', {
      ...reaction,
      senderId: socket.id
    });
  });

  // WhatsApp Read Receipts (Delivered & Seen Ticks)
  socket.on('message-delivered', ({ messageId }) => {
    if (!state.currentRoom || !messageId) return;
    io.to(state.currentRoom).emit('message-status-update', { messageId, status: 'delivered' });
  });

  socket.on('message-seen', ({ messageId }) => {
    if (!state.currentRoom || !messageId) return;
    io.to(state.currentRoom).emit('message-status-update', { messageId, status: 'seen' });
  });

  // Message Delete for Everyone
  socket.on('message-delete', ({ messageId }) => {
    if (!state.currentRoom || !messageId) return;
    io.to(state.currentRoom).emit('message-deleted', { messageId });
  });


  // Call Signaling
  socket.on('call-invite', ({ isVideo }) => {
    if (!state.currentRoom) return;
    socket.to(state.currentRoom).emit('call-invite', {
      from: socket.id,
      fromName: state.currentUser?.name,
      isVideo: !!isVideo
    });
  });

  socket.on('call-accepted', () => {
    if (!state.currentRoom) return;
    socket.to(state.currentRoom).emit('call-accepted', {
      fromSocketId: socket.id,
      fromName: state.currentUser?.name
    });
  });

  socket.on('call-declined', () => {
    if (!state.currentRoom) return;
    socket.to(state.currentRoom).emit('call-declined', {
      fromSocketId: socket.id
    });
  });

  socket.on('call-ended', (data) => {
    const targetRoom = data?.to || state.currentRoom;
    if (!targetRoom) return;
    socket.to(targetRoom).emit('call-ended', {
      fromSocketId: socket.id
    });
  });

  // Video / Player 404 / Stream Playback Error Event
  socket.on('player-playback-error', ({ roomId, movieTitle, url, reason }) => {
    const targetRoom = (roomId || state.currentRoom || '').toLowerCase().trim();
    if (!targetRoom) return;

    const title = movieTitle || 'Yeh Movie / Video';
    console.warn(`⚠️ [Player Playback / 404 Error] Room "${targetRoom}": "${title}" failed to play. Reason: ${reason || 'Server 404 / Offline'}`);

    const aiAlertMsg = {
      id: 'ai_err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      text: `⚠️ **Video Playback Error / 404 Offline Alert!** 🎬\n\n"${title}" ka video stream load nahi ho pa raha hai ya server 404 offline hai!\n\n👉 **Kya aapke paas iska koi direct working link ya alternate URL hai?**\nBas chat me command likhein: \`/play <movie URL ya YouTube link>\`\n\nMain use turant sabhi room members ke liye live synchronized play kar dunga! ✨`,
      senderId: 'viam-ai-bot',
      senderName: 'ViAM AI 🤖',
      avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
      timestamp: Date.now(),
      isAI: true,
      target: 'group',
      chatId: 'group'
    };

    io.to(targetRoom).emit('chat-message-received', aiAlertMsg);
    RoomStore.addMessage(targetRoom, aiAlertMsg);
  });
}

module.exports = registerChatHandlers;
