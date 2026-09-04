/**
 * CYPR ViAM Instant Smart Intent Parser
 * Operates offline / zero-latency / unlimited forever without paid APIs.
 * Supports English and Hinglish conversational commands.
 */

export function parseVoiceCommand(transcript) {
  if (!transcript || typeof transcript !== 'string') return null;

  const text = transcript.trim().toLowerCase();
  console.log('[CYPR Voice Engine] Heard:', text);

  // 1. Play / Start specific movie or video
  // e.g. "play interstellar", "chalao pathaan", "play song kesariya", "lagao pushpa"
  const playMatch = text.match(/^(?:play|chalao|lagao|start|watch|dekhna hai|dekho)\s+(.+)$/i);
  if (playMatch) {
    return {
      action: 'SEARCH_AND_PLAY',
      query: playMatch[1].trim()
    };
  }

  // Reverse pattern: "interstellar chalao", "titanic play karo"
  const reversePlayMatch = text.match(/^(.+)\s+(?:chalao|lagao|play karo|start karo)$/i);
  if (reversePlayMatch) {
    return {
      action: 'SEARCH_AND_PLAY',
      query: reversePlayMatch[1].trim()
    };
  }

  // 2. Pause
  if (/^(pause|stop|ruk jao|roko|rok do|pause karo|thehero)$/i.test(text)) {
    return { action: 'PAUSE' };
  }

  // 3. Resume / Play current
  if (/^(resume|play|chalu karo|start|continue|phir se chalao)$/i.test(text)) {
    return { action: 'RESUME' };
  }

  // 4. Skip / Forward
  // "forward 10 seconds", "skip 30s", "10 second aage", "aage badhao"
  const forwardMatch = text.match(/(?:forward|skip|aage|ahead)\s*(\d+)?\s*(?:seconds?|secs?|s)?/i);
  if (forwardMatch) {
    const seconds = forwardMatch[1] ? parseInt(forwardMatch[1], 10) : 10;
    return { action: 'SEEK_RELATIVE', seconds: seconds };
  }

  // 5. Rewind / Backward
  const rewindMatch = text.match(/(?:rewind|back|backward|peeche)\s*(\d+)?\s*(?:seconds?|secs?|s)?/i);
  if (rewindMatch) {
    const seconds = rewindMatch[1] ? parseInt(rewindMatch[1], 10) : -10;
    return { action: 'SEEK_RELATIVE', seconds: -Math.abs(seconds) };
  }

  // 6. Volume Control
  // "volume 80", "volume 50 percent", "aawaz 100"
  const volMatch = text.match(/(?:volume|aawaz|sound)\s*(\d+)\s*(?:percent|%)?/i);
  if (volMatch) {
    const vol = Math.min(100, Math.max(0, parseInt(volMatch[1], 10)));
    return { action: 'SET_VOLUME', volume: vol / 100 };
  }
  if (/^(mute|chup|silent)$/i.test(text)) {
    return { action: 'MUTE' };
  }
  if (/^(unmute|sound on|aawaz kholo)$/i.test(text)) {
    return { action: 'UNMUTE' };
  }

  // 7. Search command
  const searchMatch = text.match(/(?:search|dhoondho|khojo|find)\s+(.+)$/i);
  if (searchMatch) {
    return { action: 'SEARCH', query: searchMatch[1].trim() };
  }

  // Fallback: If user just said a title or sentence
  if (text.length > 2) {
    return { action: 'SEARCH_AND_PLAY', query: text };
  }

  return null;
}
