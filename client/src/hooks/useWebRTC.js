import { useEffect, useRef, useState, useCallback } from 'react';
import { encryptPayload, decryptPayload } from '../utils/cryptoUtils';
import { getWebRTCConfiguration } from '../utils/iceConfig';

function createSyntheticStream() {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    let frame = 0;

    const timer = setInterval(() => {
      frame++;
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, 640, 480);

      // Glowing animated avatar circle
      const r = 80 + Math.sin(frame * 0.1) * 10;
      const grad = ctx.createRadialGradient(320, 240, 10, 320, 240, r);
      grad.addColorStop(0, '#ff5500');
      grad.addColorStop(1, '#ff0055');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(320, 240, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CYPR ViAM', 320, 240);
    }, 40);

    const stream = canvas.captureStream(25);
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      osc.connect(dst);
      osc.start();
      const aTrack = dst.stream.getAudioTracks()[0];
      if (aTrack) stream.addTrack(aTrack);
    } catch { }

    return stream;
  } catch (e) {
    return null;
  }
}

export function useWebRTC(socket, roomId, user) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isCallConnected, setIsCallConnected] = useState(false);
  const [peerName, setPeerName] = useState('Partner');

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const targetPeerIdRef = useRef(null);
  const isRestartingIceRef = useRef(false);

  // Initialize Local Media Stream (Camera + Mic) ON DEMAND
  const initLocalMedia = useCallback(async (isVideo = true, withAudio = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo ? {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } : false,
        audio: withAudio ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('[WebRTC] Camera/Mic access failed, checking fallback options:', err);
      if (withAudio) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = audioStream;
          setLocalStream(audioStream);
          return audioStream;
        } catch { }
      }
      const synthStream = createSyntheticStream();
      localStreamRef.current = synthStream;
      setLocalStream(synthStream);
      return synthStream;
    }
  }, []);

  const iceQueueRef = useRef([]);

  // Helper to ensure local media tracks are added to RTCPeerConnection
  const attachLocalTracks = useCallback((pc) => {
    const peer = pc || pcRef.current;
    if (peer && localStreamRef.current) {
      const senders = peer.getSenders();
      const existingTrackIds = senders.map((s) => s.track?.id).filter(Boolean);
      localStreamRef.current.getTracks().forEach((track) => {
        if (!existingTrackIds.includes(track.id)) {
          console.log('[WebRTC] Adding local media track to peer:', track.kind, track.id);
          peer.addTrack(track, localStreamRef.current);
        }
      });
    }
  }, []);

  // Process queued ICE candidates
  const processIceQueue = useCallback(async (pc) => {
    const peer = pc || pcRef.current;
    if (!peer || !peer.remoteDescription) return;
    while (iceQueueRef.current.length > 0) {
      const cand = iceQueueRef.current.shift();
      try {
        await peer.addIceCandidate(new RTCIceCandidate(cand));
      } catch (err) {
        console.warn('[WebRTC] Error adding queued ICE candidate:', err);
      }
    }
  }, []);

  // Helper to create RTCPeerConnection with STUN + TURN relay and cross-network resilience
  const createPeerConnection = useCallback((targetSocketId) => {
    if (pcRef.current && pcRef.current.signalingState !== 'closed') {
      try {
        pcRef.current.close();
      } catch { }
    }

    const rtcConfig = getWebRTCConfiguration();
    console.log('[WebRTC] Creating RTCPeerConnection with global STUN/TURN relays:', rtcConfig.iceServers.length, 'servers');
    const pc = new RTCPeerConnection(rtcConfig);
    pcRef.current = pc;
    targetPeerIdRef.current = targetSocketId;
    isRestartingIceRef.current = false;

    // Ensure transceiver m-lines exist for both audio and video
    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      pc.addTransceiver('video', { direction: 'sendrecv' });
    } catch (e) {
      console.warn('[WebRTC] Transceiver initialization note:', e?.message);
    }

    // Add local media tracks to peer connection
    attachLocalTracks(pc);

    // Handle remote tracks
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track?.kind, event.streams);
      let stream = event.streams && event.streams[0];
      if (!stream) {
        stream = new MediaStream();
        stream.addTrack(event.track);
      }
      setRemoteStream(stream);
      setIsCallConnected(true);
    };

    // Send local E2EE encrypted ICE candidates to target peer via signaling socket
    pc.onicecandidate = async (event) => {
      if (event.candidate && socket && targetSocketId) {
        try {
          const candidateData = event.candidate.toJSON ? event.candidate.toJSON() : event.candidate;
          const encryptedCandidate = await encryptPayload(candidateData, roomId);
          socket.emit('webrtc-ice-candidate', {
            targetSocketId,
            candidate: encryptedCandidate
          });
        } catch (err) {
          console.warn('[WebRTC] Failed to send ICE candidate:', err);
        }
      }
    };

    // Monitor ICE connection status for cross-network connectivity and automatic recovery
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE Connection State changed to:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setIsCallConnected(true);
        isRestartingIceRef.current = false;
      } else if (pc.iceConnectionState === 'failed') {
        console.warn('[WebRTC] ICE connection failed across networks. Triggering automatic ICE restart...');
        if (!isRestartingIceRef.current && targetPeerIdRef.current && pc.signalingState !== 'closed') {
          isRestartingIceRef.current = true;
          try {
            if (typeof pc.restartIce === 'function') {
              pc.restartIce();
            }
          } catch (restartErr) {
            console.warn('[WebRTC] native restartIce error:', restartErr);
          }
        }
      } else if (pc.iceConnectionState === 'disconnected') {
        console.log('[WebRTC] ICE disconnected (temporary network blip or carrier switch)');
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Peer Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsCallConnected(true);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        setIsCallConnected(false);
      }
    };

    return pc;
  }, [socket, roomId, attachLocalTracks]);

  // Create WebRTC SDP Offer and Send to Target Peer (Supports ICE restart for network handoffs)
  const createOfferAndSend = useCallback(async (targetSocketId, options = {}) => {
    console.log('[WebRTC] Creating SDP offer for target peer:', targetSocketId, options);
    let pc = pcRef.current;
    if (!pc || pc.signalingState === 'closed') {
      pc = createPeerConnection(targetSocketId);
    }
    attachLocalTracks(pc);

    try {
      const offerOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
        iceRestart: !!options.iceRestart
      };
      const offer = await pc.createOffer(offerOptions);
      await pc.setLocalDescription(offer);
      const encryptedOffer = await encryptPayload(offer, roomId);
      if (socket) {
        socket.emit('webrtc-offer', {
          targetSocketId,
          offer: encryptedOffer,
          sender: user
        });
      }
    } catch (err) {
      console.error('[WebRTC] Error creating SDP offer:', err);
    }
  }, [createPeerConnection, socket, roomId, user, attachLocalTracks]);

  // Stop Media Tracks (Turn Camera / Mic OFF)
  const stopLocalMedia = useCallback(() => {
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch { }
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch { }
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);
    setIsCallConnected(false);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // 1. Peer joined and notified us to initiate WebRTC offer
    const handlePeerReady = async ({ initiatorId, user: remoteUser }) => {
      console.log('[WebRTC] Peer is ready for connection:', initiatorId);
      if (remoteUser?.name) setPeerName(remoteUser.name);
      if (initiatorId && initiatorId !== socket.id) {
        createOfferAndSend(initiatorId);
      }
    };

    // 2. Incoming offer from the other peer
    const handleOffer = async ({ offer, senderSocketId, sender }) => {
      console.log('[WebRTC] Received E2EE encrypted offer from:', senderSocketId);
      if (sender?.name) setPeerName(sender.name);

      let pc = pcRef.current;
      if (!pc || pc.signalingState === 'closed') {
        pc = createPeerConnection(senderSocketId);
      }
      attachLocalTracks(pc);

      try {
        const rawOffer = await decryptPayload(offer, roomId);
        if (!rawOffer) return;

        // If in have-local-offer (glare), determine collision handling or rollback
        if (pc.signalingState !== 'stable') {
          console.warn('[WebRTC] Offer collision/glare detected. Rolling back local offer to accept remote offer.');
          try {
            await Promise.all([
              pc.setLocalDescription({ type: 'rollback' }),
              pc.setRemoteDescription(new RTCSessionDescription(rawOffer))
            ]);
          } catch {
            await pc.setRemoteDescription(new RTCSessionDescription(rawOffer));
          }
        } else {
          await pc.setRemoteDescription(new RTCSessionDescription(rawOffer));
        }

        await processIceQueue(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        const encryptedAnswer = await encryptPayload(answer, roomId);
        socket.emit('webrtc-answer', {
          targetSocketId: senderSocketId,
          answer: encryptedAnswer
        });
      } catch (err) {
        console.error('[WebRTC] Error handling offer:', err);
      }
    };

    // 3. Incoming answer from peer
    const handleAnswer = async ({ answer }) => {
      console.log('[WebRTC] Received E2EE encrypted answer');
      if (pcRef.current && answer) {
        try {
          const rawAnswer = await decryptPayload(answer, roomId);
          if (rawAnswer && pcRef.current.signalingState === 'have-local-offer') {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(rawAnswer));
            await processIceQueue(pcRef.current);
          }
        } catch (err) {
          console.error('[WebRTC] Error setting remote description:', err);
        }
      }
    };

    // 4. Incoming ICE candidate
    const handleCandidate = async ({ candidate }) => {
      if (candidate) {
        try {
          const rawCandidate = await decryptPayload(candidate, roomId);
          if (rawCandidate && (rawCandidate.candidate || rawCandidate.sdpMid !== null)) {
            if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(rawCandidate));
            } else {
              iceQueueRef.current.push(rawCandidate);
            }
          }
        } catch (err) {
          console.warn('[WebRTC] Non-fatal notice adding ICE candidate:', err?.message || err);
        }
      }
    };

    // 5. User left or call ended
    const handleUserLeft = () => {
      console.log('[WebRTC] Peer left room');
      stopLocalMedia();
    };

    const handleCallEnded = () => {
      console.log('[WebRTC] Call ended signaling received');
      stopLocalMedia();
    };

    socket.on('peer-ready', handlePeerReady);
    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleCandidate);
    socket.on('call-ended', handleCallEnded);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.off('peer-ready', handlePeerReady);
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleCandidate);
      socket.off('call-ended', handleCallEnded);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, createPeerConnection, createOfferAndSend, attachLocalTracks, processIceQueue, stopLocalMedia, roomId]);

  // Start Call (Trigger Camera / Mic On Demand)
  const startLocalCall = useCallback(async (isVideo = true, withAudio = true) => {
    const stream = await initLocalMedia(isVideo, withAudio);
    if (stream && socket) {
      socket.emit('peer-ready', { roomId, user });
    }
    return stream;
  }, [initLocalMedia, socket, roomId, user]);

  // Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks[0].enabled = nextState;
        setIsMicMuted(!nextState);
      }
    }
  };

  // Toggle Camera
  const toggleCam = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks[0].enabled = nextState;
        setIsCamOff(!nextState);
      }
    }
  };

  return {
    localStream,
    remoteStream,
    isMicMuted,
    isCamOff,
    isCallConnected,
    peerName,
    startLocalCall,
    createOfferAndSend,
    stopLocalMedia,
    toggleMic,
    toggleCam
  };
}