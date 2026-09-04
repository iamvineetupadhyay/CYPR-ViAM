/**
 * Groq AI Service for CYPR ViAM
 * Ultra-fast LLM inference using Llama 3.3 / Llama 3.1 on Groq
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const CANDIDATE_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const FAST_MODEL = 'openai/gpt-oss-20b';

// System prompt defining ViAM AI's personality and STRICT Cinema Domain Guardrails
const VIAM_SYSTEM_PROMPT = `You are ViAM AI (🤖), the intelligent, witty, and charming resident Cinema & Movie Companion on CYPR ViAM — a luxury private co-watching and cinema streaming lounge for couples and close friends.

### 🎬 YOUR CORE ROLE & EXPERTISE:
1. You are a world-class cinephile who knows every movie, TV series, anime, director, actor, hidden Easter egg, plot twist, cinematography trick, and film lore.
2. You speak natural, friendly English and fluent Hinglish/Hindi with warmth, enthusiasm, and emojis.
3. You help users with:
   - Movie, Anime & Series recommendations based on mood, genre, or couple date night vibes.
   - Explaining complex movie plots, theories, and endings (e.g. Inception, Interstellar, Shutter Island, Dark).
   - Movie trivia, fun behind-the-scenes facts, and actor info.
   - Interactive movie guessing games and trivia quizzes.
   - Watch party banter and cinema suggestions.

### 🚫 STRICT DOMAIN BOUNDARIES & NEGATIVE CONSTRAINTS (MANDATORY):
1. **NO OFF-TOPIC OR MATH QUESTIONS:**
   - If the user asks general non-movie queries (such as Math like "2+2", coding, homework, general science, finance, politics, or general trivia unrelated to cinema), DO NOT answer the math or off-topic question directly.
   - Instead, playfully and politely decline in witty Hinglish/English with cinephile humor, and redirect them back to movies.
2. **NO IMAGE GENERATION / NO XML / NO CODE FILES:**
   - You CANNOT generate images, photos, XML, SVG, HTML files, or raw code.
   - If asked, politely refuse and offer vivid text description of the movie scene instead.
3. **TOKEN EFFICIENCY & DIRECT ANSWERS (CRITICAL):**
   - Answer ONLY the user's immediate question directly and concisely.
   - DO NOT repeat or summarize past chats or previous questions.
   - Keep answers sharp, punchy (1-2 short paragraphs max), token-efficient, and beautifully formatted with bullet points and emojis.`;

async function callGroqAPI(messages, { model = DEFAULT_MODEL, temperature = 0.7, max_tokens = 350, response_format } = {}) {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    return generateFallbackResponse(messages);
  }

  // Try requested model first, then candidates
  const modelsToTry = [model, ...CANDIDATE_MODELS.filter(m => m !== model)];

  for (const currentModel of modelsToTry) {
    try {
      const payload = {
        model: currentModel,
        messages,
        temperature,
        max_tokens
      };

      if (response_format) {
        payload.response_format = response_format;
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        if (response.status === 404) {
          continue;
        }
        console.warn(`[Groq API Warning] Status ${response.status}: ${errText}`);
        continue;
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (error) {
      console.error(`[Groq API Error with model ${currentModel}]:`, error.message);
    }
  }

  return generateFallbackResponse(messages);
}

/**
 * 1. AI Chat & Companion Response (Ultra Token Efficient)
 */
async function getCompanionResponse(userMessage, conversationHistory = [], currentMovie = null) {
  const messages = [
    { role: 'system', content: VIAM_SYSTEM_PROMPT }
  ];

  if (currentMovie && currentMovie.title && currentMovie.title !== 'No movie selected') {
    messages.push({
      role: 'system',
      content: `[Current Lounge Movie Context: "${currentMovie.title}"]`
    });
  }

  // Only pass the immediate user question (prevents token burn & conversation echo)
  messages.push({ role: 'user', content: userMessage });

  const reply = await callGroqAPI(messages, { model: DEFAULT_MODEL, temperature: 0.65, max_tokens: 350 });
  return reply;
}

/**
 * 2. AI Movie Recommendations & Smart Search
 */
async function getMovieRecommendations(query, genre = '', mood = '') {
  const prompt = `Based on user query "${query}", genre "${genre}", and mood "${mood}", recommend 4 top-tier movies or shows.
Return ONLY a valid JSON object matching this schema:
{
  "recommendations": [
    {
      "title": "Movie Title",
      "year": 2023,
      "genre": "Sci-Fi / Romance",
      "rating": "8.5/10",
      "overview": "Short 2-sentence hook.",
      "whyWatch": "Why it fits this mood perfectly",
      "youtubeSearchQuery": "Movie Title official trailer"
    }
  ]
}`;

  const messages = [
    { role: 'system', content: 'You are an expert film recommendation engine. Output strictly valid JSON without markdown code fences.' },
    { role: 'user', content: prompt }
  ];

  const rawJson = await callGroqAPI(messages, {
    model: DEFAULT_MODEL,
    temperature: 0.6,
    max_tokens: 1000
  });

  try {
    const clean = rawJson.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return {
      recommendations: [
        {
          title: "Interstellar",
          year: 2014,
          genre: "Sci-Fi / Drama",
          rating: "8.7/10",
          overview: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
          whyWatch: "Mind-bending visuals and deeply emotional story.",
          youtubeSearchQuery: "Interstellar trailer"
        },
        {
          title: "About Time",
          year: 2013,
          genre: "Romance / Comedy / Sci-Fi",
          rating: "8.1/10",
          overview: "At the age of 21, Tim discovers he can travel in time and change what happens and has happened in his own life.",
          whyWatch: "One of the most heartwarming romantic movies ever made.",
          youtubeSearchQuery: "About Time trailer"
        }
      ]
    };
  }
}

/**
 * 3. AI Smart Replies Generator
 */
async function getSmartReplies(lastMessage, currentMovie = null) {
  const prompt = `Generate 3 short, natural, witty 1-tap quick chat replies to this message: "${lastMessage}".
${currentMovie?.title ? `Movie playing: "${currentMovie.title}"` : ''}
Return ONLY a JSON array of 3 strings: ["Reply 1", "Reply 2", "Reply 3"]`;

  const messages = [
    { role: 'system', content: 'You are an ultra-fast smart reply generator for real-time couple/friends chat. Return strictly JSON array.' },
    { role: 'user', content: prompt }
  ];

  const raw = await callGroqAPI(messages, { model: FAST_MODEL, temperature: 0.8, max_tokens: 100 });
  try {
    const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return ["Aww that's amazing! ❤️", "Haha wait for the twist! 🍿", "What do you think will happen next? 👀"];
  }
}

/**
 * 4. AI Movie Trivia & Insights Generator
 */
async function getMovieTrivia(movieTitle) {
  const prompt = `Provide 3 fascinating, mind-blowing trivia facts, Easter eggs, and director secrets about the movie "${movieTitle}".
Format cleanly with emojis.`;

  const messages = [
    { role: 'system', content: 'You are a passionate film trivia master. Provide engaging bullet points.' },
    { role: 'user', content: prompt }
  ];

  return await callGroqAPI(messages, { model: DEFAULT_MODEL, temperature: 0.7, max_tokens: 500 });
}

/**
 * 5. Neural / Semantic AI Movie Search Resolver
 * Converts natural language / Hinglish plot descriptions or actor scenes into exact movie candidates
 */
async function resolveNeuralSearch(userQuery) {
  const prompt = `The user is searching for a movie, show, or anime using natural language, plot description, vague scene memories, or Hinglish: "${userQuery}".
Identify the top 3 most likely exact movie/show matches.
Return strictly a JSON object:
{
  "matches": [
    {
      "title": "Exact Official Movie Title",
      "year": 2014,
      "whyMatch": "1 short sentence explaining why this matches the user's description"
    }
  ]
}`;

  const messages = [
    { role: 'system', content: 'You are a neural movie search resolver. You must output a JSON object with a "matches" array containing objects with keys "title" (string), "year" (number), and "whyMatch" (string).' },
    { role: 'user', content: prompt }
  ];

  const raw = await callGroqAPI(messages, {
    model: DEFAULT_MODEL,
    temperature: 0.1,
    max_tokens: 350,
    response_format: { type: 'json_object' }
  });

  try {
    const parsed = JSON.parse(raw);
    return parsed.matches || [];
  } catch (err) {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.matches || [];
      } catch {}
    }
    console.warn('[Neural Resolver JSON Parse Error]:', err.message);
  }
  return [];
}

/**
 * Intelligent Fallback Generator if API Key is missing or offline
 */
function generateFallbackResponse(messages) {
  const lastUserMsg = messages[messages.length - 1]?.content?.toLowerCase() || '';

  if (lastUserMsg.includes('recommend') || lastUserMsg.includes('suggest') || lastUserMsg.includes('batao')) {
    return `🍿 **ViAM AI Movie Picks for Tonight:**\n\n1. **About Time (2013)** — *Rom-Com/Sci-Fi*: Beautiful, touching time-travel romance.\n2. **Inception (2010)** — *Sci-Fi Thriller*: Christopher Nolan's legendary dream heist.\n3. **La La Land (2016)** — *Musical/Romance*: Modern masterpiece with incredible music.\n4. **A Quiet Place (2018)** — *Horror/Thriller*: Intense suspense best watched in the dark!\n\n💡 *Tip: Configure your \`GROQ_API_KEY\` in \`.env\` for live dynamic AI recommendations!*`;
  }

  if (lastUserMsg.includes('trivia') || lastUserMsg.includes('fact')) {
    return `🎬 **Did You Know? (Cinema Trivia):**\n\n✨ Christopher Nolan actually planted 500 acres of real corn for *Interstellar* and then sold the crop for a profit after filming!\n✨ In *The Dark Knight*, Heath Ledger directed the two homemade videos the Joker sends to GCN news himself.\n\nAsk me about any movie or plot explanation! 🤖`;
  }

  return `🤖 **Hey there! I am ViAM AI**, your personal cinema co-host & movie companion!\n\nYou can ask me:\n- 🍿 *"Recommend a romantic comedy for date night"*\n- 🧠 *"Explain the ending of Shutter Island"*\n- ❓ *"Give me trivia about Interstellar"*\n- 🎲 *"Start a movie quiz game"*\n\nHow can I help your lounge session right now? ✨`;
}

module.exports = {
  getCompanionResponse,
  getMovieRecommendations,
  getSmartReplies,
  getMovieTrivia,
  resolveNeuralSearch
};
