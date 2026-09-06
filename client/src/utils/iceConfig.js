import { SERVER_URL } from './apiUrl';

/**
 * Global High-Availability STUN & TURN Server Configuration
 * Enables WebRTC Audio & Video Calls across 2 different IP addresses,
 * different Wi-Fi networks, mobile 4G/5G carriers, Symmetric NATs & Firewalls.
 */

export const STUN_SERVERS = [
  // Google Public STUN Cluster (Global Anycast, fast round-trip)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },

  // Cloudflare Edge STUN (Port 3478)
  { urls: 'stun:stun.cloudflare.com:3478' },

  // Twilio Global STUN
  { urls: 'stun:global.stun.twilio.com:3478' },

  // Mozilla STUN
  { urls: 'stun:stun.services.mozilla.com' },

  // Alternate Port STUN (Port 443 - passes restrictive outbound firewall rules)
  { urls: 'stun:stun.nextcloud.com:443' }
];

let cachedDynamicIceServers = null;

/**
 * Loads dynamic verified ICE servers (including Metered TURN or custom TURN relays) from the backend
 */
export async function loadIceServersFromServer() {
  if (cachedDynamicIceServers && cachedDynamicIceServers.length > 0) {
    return cachedDynamicIceServers;
  }

  try {
    const res = await fetch(`${SERVER_URL}/api/webrtc/ice-servers`, {
      signal: AbortSignal.timeout(3000)
    });
    const data = await res.json();
    if (data && Array.isArray(data.iceServers) && data.iceServers.length > 0) {
      cachedDynamicIceServers = data.iceServers;
      console.log(`📡 [WebRTC Config] Loaded ${data.iceServers.length} ICE servers from backend (${data.source})`);
      return cachedDynamicIceServers;
    }
  } catch (err) {
    console.warn('[WebRTC Config] Server ICE fetch fallback to default STUN:', err?.message || err);
  }

  return STUN_SERVERS;
}

// Prefetch on module import
if (typeof window !== 'undefined') {
  loadIceServersFromServer().catch(() => {});
}

export function getWebRTCConfiguration(customServers = null) {
  const iceServers = [];

  // 1. Custom TURN/STUN credentials passed explicitly or fetched from backend
  if (customServers && Array.isArray(customServers) && customServers.length > 0) {
    iceServers.push(...customServers);
  } else if (cachedDynamicIceServers && cachedDynamicIceServers.length > 0) {
    iceServers.push(...cachedDynamicIceServers);
  }

  // 2. Check Vite client environment variables
  const envTurnUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURN_URL;
  const envTurnUser = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURN_USERNAME;
  const envTurnPass = typeof import.meta !== 'undefined' && import.meta.env?.VITE_TURN_CREDENTIAL;

  if (envTurnUrl && envTurnUser && envTurnPass) {
    iceServers.push({
      urls: envTurnUrl.includes(',') ? envTurnUrl.split(',').map(u => u.trim()) : envTurnUrl.trim(),
      username: envTurnUser.trim(),
      credential: envTurnPass.trim()
    });
  }

  // 3. Fallback to Verified Global Anycast STUN Servers
  if (iceServers.length === 0) {
    iceServers.push(...STUN_SERVERS);
  }

  return {
    iceServers,
    iceTransportPolicy: 'all',    // Allows both direct host/srflx candidates and TURN relays
    bundlePolicy: 'max-bundle',    // Crucial: muxes audio + video over single UDP connection to minimize NAT mappings
    rtcpMuxPolicy: 'require',      // Mux RTP and RTCP on same port
    iceCandidatePoolSize: 10       // Pre-gathers candidates for instant call connection
  };
}
