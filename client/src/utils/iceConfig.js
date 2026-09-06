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

export const TURN_RELAY_SERVERS = [
  // OpenRelay by Metered (High-performance free global TURN network)
  // 1. Standard UDP Port 80 TURN (Bypasses firewalls blocking ports > 1024)
  {
    urls: 'turn:relay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  // 2. Standard UDP Port 443 TURN
  {
    urls: 'turn:relay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  // 3. TCP Port 443 TURN (Crucial for networks/ISPs dropping UDP packets)
  {
    urls: 'turn:relay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  // 4. Encrypted TLS TURNS Port 443 (Indistinguishable from HTTPS, passes strict corporate/campus firewalls)
  {
    urls: 'turns:relay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

export function getWebRTCConfiguration(customServers = null) {
  const iceServers = [];

  // 1. Custom TURN/STUN credentials (e.g. from environment or server)
  if (customServers && Array.isArray(customServers) && customServers.length > 0) {
    iceServers.push(...customServers);
  }

  // Check Vite client environment variables
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

  // 2. Default STUN and TURN Relays
  iceServers.push(...STUN_SERVERS);
  iceServers.push(...TURN_RELAY_SERVERS);

  return {
    iceServers,
    iceTransportPolicy: 'all',    // Allows both direct host/srflx candidates and TURN relays
    bundlePolicy: 'max-bundle',    // Crucial: muxes audio + video over single UDP connection to minimize NAT mappings
    rtcpMuxPolicy: 'require',      // Mux RTP and RTCP on same port
    iceCandidatePoolSize: 10       // Pre-gathers candidates for instant call connection
  };
}
