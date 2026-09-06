/**
 * CYPR ViAM Advanced AI Voice Intent Parser
 * Supports English & Hinglish conversational commands.
 * Handles Play, Navigation, Theme Switching, Controls, and AI Questions.
 */

export function parseVoiceCommand(transcript) {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.trim().toLowerCase();
  console.log('[CYPR Voice AI Engine] Heard:', text);

  // 1. Theme Switching Commands ("switch to light theme", "light mode", "dark theme", "dark mode karo")
  if (/switch to light|light mode|light theme|white theme|light mode karo|enable light/i.test(text)) {
    return { action: 'SWITCH_THEME', theme: 'light' };
  }
  if (/switch to dark|dark mode|dark theme|black theme|dark mode karo|enable dark/i.test(text)) {
    return { action: 'SWITCH_THEME', theme: 'dark' };
  }
  if (/toggle theme|change theme|theme badlo/i.test(text)) {
    return { action: 'SWITCH_THEME', theme: 'toggle' };
  }

  // 2. Navigation Commands ("open message", "open messenger", "open chat", "open cinema", "open home", "open ai")
  if (/(?:open|go to|show|kholo)\s*(?:message|messages|messenger|chat|chats|chatting|inbox)/i.test(text) || /^(chat|messenger|message)$/i.test(text)) {
    return { action: 'NAVIGATE', page: 'chat' };
  }
  if (/(?:open|go to|show|kholo)\s*(?:cinema|theater|theatre|player|movie page)/i.test(text) || /^(cinema|theater)$/i.test(text)) {
    return { action: 'NAVIGATE', page: 'cinema' };
  }
  if (/(?:open|go to|show|kholo)\s*(?:home|home page|main page|hub)/i.test(text) || /^(home)$/i.test(text)) {
    return { action: 'NAVIGATE', page: 'home' };
  }
  if (/(?:open|go to|show|kholo|talk to)\s*(?:ai|viam ai|companion|gemini|bot)/i.test(text) || /^(ai|viam)$/i.test(text)) {
    return { action: 'NAVIGATE', page: 'ai' };
  }
  if (/(?:open|go to|show|kholo)\s*(?:profile|my profile|settings|account)/i.test(text) || /^(profile)$/i.test(text)) {
    return { action: 'NAVIGATE', page: 'profile' };
  }

  // 3. Play / Start specific movie or anime
  // e.g. "play interstellar", "chalao pathaan", "watch doraemon", "play solo leveling"
  const playMatch = text.match(/^(?:play|chalao|lagao|start|watch|dekhna hai|dekho)\s+(.+)$/i);
  if (playMatch) {
    return {
      action: 'SEARCH_AND_PLAY',
      query: playMatch[1].trim()
    };
  }

  // Reverse pattern: "interstellar chalao", "solo leveling play karo"
  const reversePlayMatch = text.match(/^(.+)\s+(?:chalao|lagao|play karo|start karo|play)$/i);
  if (reversePlayMatch) {
    return {
      action: 'SEARCH_AND_PLAY',
      query: reversePlayMatch[1].trim()
    };
  }

  // 4. Playback Controls (Pause, Resume, Seek, Volume)
  if (/^(pause|stop|ruk jao|roko|rok do|pause karo|thehero)$/i.test(text)) {
    return { action: 'PAUSE' };
  }

  if (/^(resume|play|chalu karo|start|continue|phir se chalao)$/i.test(text)) {
    return { action: 'RESUME' };
  }

  const forwardMatch = text.match(/(?:forward|skip|aage|ahead)\s*(\d+)?\s*(?:seconds?|secs?|s)?/i);
  if (forwardMatch) {
    const seconds = forwardMatch[1] ? parseInt(forwardMatch[1], 10) : 10;
    return { action: 'SEEK_RELATIVE', seconds };
  }

  const rewindMatch = text.match(/(?:rewind|back|backward|peeche)\s*(\d+)?\s*(?:seconds?|secs?|s)?/i);
  if (rewindMatch) {
    const seconds = rewindMatch[1] ? parseInt(rewindMatch[1], 10) : -10;
    return { action: 'SEEK_RELATIVE', seconds: -Math.abs(seconds) };
  }

  const volMatch = text.match(/(?:volume|aawaz|sound)\s*(\d+)\s*(?:percent|%)?/i);
  if (volMatch) {
    const vol = Math.min(100, Math.max(0, parseInt(volMatch[1], 10)));
    return { action: 'SET_VOLUME', volume: vol / 100 };
  }

  if (/^(mute|chup|silent)$/i.test(text)) return { action: 'MUTE' };
  if (/^(unmute|sound on|aawaz kholo)$/i.test(text)) return { action: 'UNMUTE' };

  // 5. Search Command
  const searchMatch = text.match(/(?:search|dhoondho|khojo|find)\s+(.+)$/i);
  if (searchMatch) {
    return { action: 'SEARCH', query: searchMatch[1].trim() };
  }

  // 6. General AI Conversational Query (Fallthrough to AI Voice Chat & TTS Response)
  if (text.length > 2) {
    return { action: 'AI_QUERY', query: text };
  }

  return null;
}
