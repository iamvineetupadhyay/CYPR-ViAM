# 💖 CYPR ViAM — Synchronized Movie Lounge & Co-Watching for Couples

<div align="center">

> *"Your movie night. Yours only."* 🍿✨

[![CYPR ViAM Banner](https://img.shields.io/badge/CYPR%20ViAM-v1.0.0-ff5500?style=for-the-badge&logo=heart&logoColor=white)](https://github.com/iamvineetupadhyay/CYPR-ViAM)
[![License](https://img.shields.io/badge/License-MIT-00e5b4?style=for-the-badge)](LICENSE)
[![Encryption](https://img.shields.io/badge/Security-AES--256%20E2EE-0a8f70?style=for-the-badge&logo=shield)](https://github.com/iamvineetupadhyay/CYPR-ViAM)
[![Build Status](https://img.shields.io/badge/Build-Passing-22c55e?style=for-the-badge)](https://github.com/iamvineetupadhyay/CYPR-ViAM)

*A broadsheet editorial co-watching lounge engineered specifically for long-distance couples.*  
*Sync every frame with 0ms drift, talk face-to-face over HD WebRTC video, and share encrypted love notes.* 💌

[**✨ Try Live Lounge**](#-getting-started) • [**📖 Features**](#-core-features) • [**🛡️ Security**](#%EF%B8%8F-privacy--security) • [**🚀 Tech Stack**](#-tech-stack)

---

</div>

## 💌 Why CYPR ViAM?

Being in a long-distance relationship shouldn't mean sacrificing cozy movie dates on the couch. **CYPR ViAM** turns physical distance into digital togetherness:

- 🎬 **Zero-Drift Playback**: When one partner hits play or seek, playback syncs microsecond-perfectly on both screens.
- 🔒 **AES-256 E2EE Sealed Rooms**: Room keys stay on your devices. No logs, no recording, no unwanted third parties.
- 📹 **Floating Duo Webcams**: See your partner’s smile right beside your favorite film.
- 💖 **Live Love Burst Reactions**: Floating romantic emoji showers (`💖 🍿 🔥 ✨ 🥰 🎉`) across the screen.
- 🎨 **Press Date Editorial Style**: Warm paper canvas (`#F2F0EB`), flame-orange accents (`#FF5500`), and Space Grotesk & Satoshi typography.

---

## 🎬 Core Features

```
          ┌─────────────────────────────────────────────────────────────┐
          │                                                             │
          │                   🎥 4K CINEMA THEATER                      │
          │                                                             │
          │     [  Partner Cam  ]                 [  Your Cam  ]        │
          │        (Live HD)                         (Live HD)          │
          │                                                             │
          └─────────────────────────────────────────────────────────────┘
                     │                       │                      │
             0ms Frame Sync         AES-256 E2EE Chat       Groq 70B AI
```

### 🍿 1. Sub-Millisecond Frame Sync
Stream YouTube videos, direct MP4/WebM files, HLS streams, or custom video links with zero playback drift.

### 🔒 2. End-to-End Cryptography (AES-GCM-256)
Private 6-character room codes (`#LOVE24`). All chat messages, voice notes, and WebRTC signaling pass through client-side encryption.

### 📹 3. Built-In WebRTC Face-to-Face Calls
Low-latency peer-to-peer video calling with instant mic muting, camera toggles, and floating picture-in-picture window.

### 💬 4. WhatsApp-Style Encrypted Lounge Chat
Send direct messages, voice notes, custom stickers, and reaction bubbles in real-time.

### 🤖 5. ViAM AI Cinema Companion (Groq 70B)
Ask plot questions, movie ending breakdowns, trivia, or use `/play <movie>` to let AI search and load recommendations.

---

## 🎨 Design System — Press Date

> *Broadsheet grid meets flame-orange editorial; watching together as a headline act.*

| Token | Value | Description |
|-------|-------|-------------|
| **Canvas** | `#F2F0EB` | Warm light paper ground |
| **Foreground** | `#1A1A1A` | High-emphasis charcoal typography |
| **Primary Accent** | `#FF5500` | Flame-orange CTA button fill |
| **Secondary Accent** | `#00E5B4` | Teal E2EE badge signal |
| **Display Font** | `Space Grotesk` | Headline grotesk type |
| **Body Font** | `Satoshi` | Clean geometric body sans |

---

## 🚀 Tech Stack

### **Frontend**
- **Framework**: React 18 + Vite 5
- **Styling**: Vanilla CSS3 + Press Date Design System (`Space Grotesk` & `Satoshi`)
- **Icons**: Lucide React
- **Video Players**: HTML5 Video API + YouTube IFrame API + HLS.js

### **Backend**
- **Runtime**: Node.js + Express
- **Real-time Sync**: Socket.IO 4.7
- **Video Calls**: WebRTC Peer-to-Peer Mesh
- **Database**: SQLite3 (better-sqlite3) with WAL mode
- **AI Intelligence**: Groq 70B LLaMA-3 Neural Engine

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/iamvineetupadhyay/CYPR-ViAM.git
cd CYPR-ViAM
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 3. Configure Environment Variables
Create `server/.env`:
```env
PORT=4000
JWT_SECRET=cypr_super_secure_jwt_secret_2026!
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Run Development Servers
```bash
# Terminal 1: Start Backend Server
cd server
npm run dev

# Terminal 2: Start Frontend Client
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser! 🚀

---

## 🛡️ Privacy & Security Promise

- 🚫 **No Watch History Logging**: We do not store your watch history or video habits.
- 🔑 **Ephemeral Keys**: Passcodes and room session keys expire automatically.
- 🔒 **Direct WebRTC Signaling**: Video/audio streams flow directly peer-to-peer between partners.

---

## 💖 Made with Love for Couples Everywhere

*Dedicated to long-distance lovers bridging the miles, one movie night at a time.*

© 2026 **CYPR ViAM**. Made for two. 🍿✨
