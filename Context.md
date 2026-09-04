# 🎬 CYPR ViAM (CYPR-MovieHub) — Complete AI Context & Project Story

> **Purpose of this file:** This document acts as the single source of truth for the CYPR ViAM project. Any future AI or developer reading this file can immediately understand the architecture, completed features, recent fixes, security mechanisms, and environment setup.

---

## 📌 Project Overview
**CYPR ViAM** is a real-time, synchronized co-watching cinema lounge and WebRTC video/audio calling web application specially designed for couples and close friends with **zero-compromise, privacy-focused security**.

- **Primary Goal:** Allow users in different locations to join private or public lounge rooms, stream movies together in sync, chat with end-to-end encryption (E2EE), send voice notes, and make real-time video/audio calls with synthetic stream fallback and strict anti-outsider room locking mechanisms.
- **Project Structure:** Monorepo with React Vite frontend (`client/`) and a standalone, modular Node.js Express + Socket.io backend (`server/`).

---

## 🏗️ Tech Stack & Modular Architecture

### Frontend (`/client`)
- **Framework:** React 18 + Vite
- **Styling:** Custom Vanilla CSS (`index.css`) with CSS variables, dark-mode glassmorphic aesthetics, glowing gradients, responsive layout design.
- **Real-Time Signaling & State Sync:** `socket.io-client`
- **WebRTC:** Native Browser `RTCPeerConnection` API wrapped in custom hook [`useWebRTC.js`](file:///c:/Users/vinee/projects/CYPR-MovieHub/client/src/hooks/useWebRTC.js).
- **Security / E2EE:** WebCrypto API (`AES-GCM` 256-bit encryption with PBKDF2 derived keys from Room ID in [`cryptoUtils.js`](file:///c:/Users/vinee/projects/CYPR-MovieHub/client/src/utils/cryptoUtils.js)).
- **Voice Assistant:** Web Speech API integration in [`speechParser.js`](file:///c:/Users/vinee/projects/CYPR-MovieHub/client/src/utils/speechParser.js) & [`VoiceAssistant.jsx`](file:///c:/Users/vinee/projects/CYPR-MovieHub/client/src/components/VoiceAssistant.jsx).

### Modular Backend (`/server`)
Enterprise-grade modular MVC + Socket structure:
```
server/
├── config/
│   ├── env.js             # Environment variables loader & validator
│   └── constants.js       # App constants & room capacity limits
├── middleware/
│   ├── authMiddleware.js  # JWT verification middleware
│   └── rateLimiter.js     # Express rate limiting (OTP & Auth protection)
├── controllers/
│   ├── authController.js  # Auth (OTP, signup, login) logic with bcrypt hashing
│   └── searchController.js# YouTube, TMDB, HDHub4u scraping APIs
├── routes/
│   ├── authRoutes.js      # Auth API endpoints (/api/auth/*)
│   └── searchRoutes.js    # Search & streaming API endpoints (/api/search/*)
├── sockets/
│   ├── roomHandler.js     # Room lifecycle, Passcode Validation, Knock/Host Approval logic
│   ├── webrtcHandler.js   # Encrypted WebRTC SDP & ICE candidate relay
│   ├── mediaHandler.js    # Co-watching video sync handlers
│   └── chatHandler.js     # Real-time chat & reaction handlers
├── services/
│   ├── mailerService.js   # Nodemailer email OTP transporter
│   └── roomStore.js       # Secure room state & waiting room manager
├── utils/
│   └── crypto.js          # Bcrypt hashing & JWT signing/verification
└── server.js              # Clean server bootstrap file (< 60 lines)
```

---

## 🔒 Security & Anti-Outsider Defense System

1. **Room Passcode / Secret PIN Protection**:
   - Host can set a 4-6 digit passcode when creating a private room.
   - Anyone attempting to join without the correct passcode is denied entry at the socket boundary (`PASSCODE_INVALID`).

2. **Host Knock & Approval Mechanism ("Knock to Join")**:
   - When an unapproved guest attempts to enter a private room, they are held in a secure **Waiting Room State** (`knock-pending`).
   - The Room Host receives an interactive socket notification (`knock-request`): `"🚪 [User Name] is knocking to enter your private lounge!"`.
   - Host clicks **Approve** (`knock-accept`) or **Decline** (`knock-deny`).
   - Outsiders CANNOT see room members, receive media state, or initiate WebRTC video streams until explicitly approved by the Host.

3. **Bcrypt Password Hashing & JWT Authentication**:
   - All passwords are encrypted with `bcryptjs`.
   - Authentication APIs issue signed JSON Web Tokens (JWT) for secure session verification.

4. **Rate Limiting**:
   - Express rate limiting enabled for OTP and Login/Signup routes to prevent brute-force attacks.

---

## 📁 Key File Map & Roles

| File / Folder | Role & Description |
| :--- | :--- |
| [`client/src/App.jsx`](file:///c:/Users/vinee/projects/CYPR-MovieHub/client/src/App.jsx) | Root container: manages navigation, socket setup, Knock/Host approval UI modals, shared WebRTC hook, and floating call modals. |
| [`client/src/components/RoomModal.jsx`](file:///c:/Users/vinee/projects/CYPR-MovieHub/client/src/components/RoomModal.jsx) | Room creation/joining modal with optional Passcode / PIN input. |
| [`client/src/hooks/useWebRTC.js`](file:///c:/Users/vinee/projects/CYPR-MovieHub/client/src/hooks/useWebRTC.js) | WebRTC manager: manages peer connection lifecycle, encrypted SDP/ICE exchange, synthetic canvas fallback stream (`createSyntheticStream`), mic/cam toggles. |
| [`client/src/utils/cryptoUtils.js`](file:///c:/Users/vinee/projects/CYPR-MovieHub/client/src/utils/cryptoUtils.js) | E2EE encryption/decryption using WebCrypto AES-GCM. Encrypts signaling payloads (offers, answers, candidates). |
| [`server/server.js`](file:///c:/Users/vinee/projects/CYPR-MovieHub/server/server.js) | Modular entry point (< 60 lines) connecting Express routes and Socket.io handlers. |
| [`server/sockets/roomHandler.js`](file:///c:/Users/vinee/projects/CYPR-MovieHub/server/sockets/roomHandler.js) | Core room security handler: passcode validation, host knock approval queue, capacity enforcement. |

---

## 🚀 How to Run the Project

### 1. Install Dependencies
```bash
# Backend dependencies
cd server
cmd /c "npm install"

# Frontend dependencies
cd ../client
cmd /c "npm install"
```

### 2. Start Modular Backend & Frontend
```bash
# Start Backend (from server directory)
node server.js

# Start Frontend (from client directory)
npm run dev
```
