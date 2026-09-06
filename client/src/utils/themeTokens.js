/**
 * CYPR ViAM — Centralized Theme Token Utility
 *
 * Usage in any page/component:
 *   import { getT } from '../utils/themeTokens';
 *   const T = getT(theme);
 *   // then use T.pageBg, T.surface2, T.textPrimary, etc.
 */

export function getT(theme = 'dark') {
  const L = theme === 'light';

  return {
    // ── Is Light ──
    isLight: L,
    theme: L ? 'light' : 'dark',

    // ── PAGE BACKGROUNDS ──
    pageBg: L
      ? 'linear-gradient(145deg, #fdfbfb 0%, #fcf4f6 50%, #f8e9ee 100%)'
      : '#09060b',
    pageColor: L ? '#1f0d14' : '#ffffff',
    pageRadials: L
      ? `radial-gradient(circle at 15% 15%, rgba(244,63,94,0.06) 0%, transparent 45%),
         radial-gradient(circle at 85% 20%, rgba(219,39,119,0.05) 0%, transparent 45%),
         radial-gradient(circle at 50% 80%, rgba(251,113,133,0.04) 0%, transparent 50%)`
      : `radial-gradient(circle at 15% 15%, rgba(244,63,94,0.12) 0%, transparent 45%),
         radial-gradient(circle at 85% 20%, rgba(168,85,247,0.08) 0%, transparent 45%),
         radial-gradient(circle at 50% 80%, rgba(225,29,72,0.08) 0%, transparent 50%),
         radial-gradient(circle at 50% 10%, #150918 0%, #09060b 70%)`,

    // ── ROMANTIC ACCENTS ──
    accentRose: '#f43f5e',
    accentRoseGlow: 'rgba(244, 63, 94, 0.45)',
    accentWine: '#be123c',
    accentBlush: L ? '#ffe4e6' : 'rgba(244, 63, 94, 0.15)',
    accentBlushBorder: L ? 'rgba(244, 63, 94, 0.25)' : 'rgba(244, 63, 94, 0.35)',

    // ── SURFACES ──
    surface1: L ? 'rgba(253, 248, 250, 0.95)' : 'rgba(12, 8, 15, 0.88)',    // Header
    surface2: L ? 'rgba(255, 255, 255, 0.98)' : 'rgba(18, 12, 22, 0.95)',    // Cards
    surface3: L ? 'rgba(255, 255, 255, 0.9)' : 'rgba(24, 15, 29, 0.8)',      // Stations
    surface4: L ? 'rgba(255, 255, 255, 0.65)' : 'rgba(24, 15, 29, 0.5)',     // Dim tiles
    surfaceHero: L
      ? 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(253,242,246,0.98) 100%)'
      : 'linear-gradient(135deg, rgba(28,15,32,0.9) 0%, rgba(14,9,18,0.98) 100%)',
    surfaceModal: L ? 'rgba(253, 246, 249, 0.98)' : 'rgba(14, 9, 18, 0.98)',
    surfaceSidebar: L ? '#f8eef2' : '#120917',
    surfaceInput: L ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.05)',
    surfaceRightCard: L ? 'rgba(255, 255, 255, 0.95)' : 'rgba(20, 13, 25, 0.92)',

    // ── BORDERS ──
    border1: L ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.06)',
    border2: L ? 'rgba(244,63,94,0.12)' : 'rgba(244,63,94,0.14)',
    border3: L ? 'rgba(244,63,94,0.18)' : 'rgba(255,255,255,0.12)',
    border4: L ? 'rgba(244,63,94,0.22)' : 'rgba(255,255,255,0.16)',
    borderInput: L ? 'rgba(244,63,94,0.18)' : 'rgba(255,255,255,0.12)',
    borderDivider: L ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.08)',

    // ── TEXT ──
    textPrimary: L ? '#1f0d14' : '#ffffff',
    textSecondary: L ? '#381622' : '#fdf2f4',
    textMuted1: L ? '#734d5b' : '#cbd5e1',   // Body / description
    textMuted2: L ? '#916b7a' : '#94a3b8',   // Labels
    textMuted3: L ? '#916b7a' : '#78716c',   // Faint / subtitles
    textMuted4: L ? '#805968' : '#a8a29e',   // Placeholder-ish

    // ── HEADER ──
    headerBg: L ? 'rgba(253, 248, 250, 0.95)' : 'rgba(12, 8, 15, 0.88)',
    headerBorder: L ? 'rgba(244,63,94,0.12)' : 'rgba(244,63,94,0.14)',

    // ── PILL / NAV BUTTONS ──
    pillBg: L ? 'rgba(244,63,94,0.06)' : 'rgba(255,255,255,0.05)',
    pillBorder: L ? 'rgba(244,63,94,0.15)' : 'rgba(244,63,94,0.2)',
    pillText: L ? '#381622' : '#fdf2f4',

    // ── INPUTS ──
    inputBg: L ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.06)',
    inputBorder: L ? 'rgba(244,63,94,0.18)' : 'rgba(255,255,255,0.12)',
    inputText: L ? '#1f0d14' : '#ffffff',
    inputPlaceholder: L ? '#916b7a' : '#78716c',

    // ── MESSAGE BUBBLES ──
    bubbleOwnBg: L ? 'linear-gradient(135deg, rgba(244,63,94,0.2) 0%, rgba(225,29,72,0.16) 100%)' : 'linear-gradient(135deg, rgba(244,63,94,0.32) 0%, rgba(190,18,60,0.38) 100%)',
    bubbleOwnBorder: L ? 'rgba(244,63,94,0.35)' : 'rgba(244,63,94,0.5)',
    bubbleOwnText: L ? '#290610' : '#ffffff',
    bubbleOtherBg: L ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.06)',
    bubbleOtherBorder: L ? 'rgba(244,63,94,0.12)' : 'rgba(255,255,255,0.08)',
    bubbleOtherText: L ? '#1f0d14' : '#fdf2f4',

    // ── AVATAR ──
    avatarRing: L ? '#fce7ee' : '#1a0d1d',

    // ── CHAT PAGE SPECIFICS ──
    chatBg: L ? '#faf8f5' : '#07080c',
    chatSidebarBg: L ? '#ffffff' : 'rgba(9,10,16,0.98)',
    chatHeaderBg: L ? '#ffffff' : '#12131b',
    chatSearchBg: L ? 'rgba(0,0,0,0.02)' : '#111218',
    chatSearchInputBg: L ? '#f5f2eb' : '#1c1d27',
    chatFooterBg: L ? '#ffffff' : '#12131b',
    chatActiveItemBg: L ? 'rgba(255,85,0,0.07)' : 'rgba(255,255,255,0.06)',
    chatHoverItemBg: L ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)',
    chatCardBorder: L ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.04)',
    chatSubtext: L ? '#786958' : '#8696a0',
    chatInputOuterBg: L ? '#ffffff' : 'rgba(10,11,16,0.95)',
    chatInputBarBg: L ? '#ffffff' : 'rgba(18,19,28,0.95)',
    chatInputBoxBg: L ? '#f5f2eb' : 'rgba(28,30,44,0.85)',
    chatInputBoxBorder: L ? '1px solid rgba(0,0,0,0.09)' : '1px solid rgba(255,255,255,0.1)',
    chatReplyBg: L ? '#ffffff' : '#141417',
    chatEmojiBg: L ? '#ffffff' : '#141417',

    // ── AI PAGE SPECIFICS ──
    aiBg: L ? '#f7f4ef' : '#08090e',
    aiSidebarBg: L ? '#ede7db' : '#0d0e1a',
    aiSidebarBorder: L ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.06)',
    aiSidebarSessionBg: L ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
    aiSidebarSessionActive: L ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.18)',
    aiSidebarSessionBorder: L ? 'rgba(168,85,247,0.35)' : 'rgba(168,85,247,0.4)',
    aiCardBg: L ? 'rgba(255,255,255,0.95)' : 'rgba(18,21,32,0.75)',
    aiCardBorder: L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    aiUserBubbleBg: L
      ? 'linear-gradient(135deg, #7e22ce 0%, #6b21a8 100%)'
      : 'linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)',
    aiBubbleBg: L ? 'rgba(255,255,255,0.97)' : 'rgba(15,18,28,0.75)',
    aiBubbleBorder: L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',
    aiOmnibarBg: L ? 'rgba(255,255,255,0.96)' : 'rgba(18,22,34,0.95)',
    aiOmnibarBorder: L ? '1.5px solid rgba(0,0,0,0.12)' : '1.5px solid rgba(255,255,255,0.12)',
    aiOmnibarGradient: L
      ? 'linear-gradient(to top, rgba(247,244,239,0.98) 60%, transparent 100%)'
      : 'linear-gradient(to top, #06070a 60%, transparent 100%)',

    // ── CINEMA PAGE SPECIFICS ──
    cinemaBg: L ? '#f0ebe0' : '#0b0806',
    cinemaToolbarBg: L ? 'rgba(247,242,234,0.97)' : 'rgba(9,10,15,0.96)',
    cinemaSidebarBg: L ? 'rgba(243,238,228,0.98)' : 'rgba(9,10,15,0.98)',
    cinemaHeaderBg: L ? 'rgba(247,242,234,0.98)' : 'rgba(12,14,20,0.98)',

    // ── CONNECT PAGE ──
    connectBg: L
      ? 'linear-gradient(145deg, #f7f4ef 0%, #ebe3d6 100%)'
      : 'linear-gradient(145deg, #0a0a14 0%, #050508 100%)',
    connectCardBg: L ? 'rgba(255,255,255,0.96)' : 'rgba(15,16,25,0.95)',

    // ── PROFILE PAGE ──
    profileBg: L ? '#f7f4ef' : '#07080c',
    profileCardBg: L ? 'rgba(255,255,255,0.97)' : '#141417',
    profileSubcardBg: L ? 'rgba(245,240,232,0.95)' : '#09090b',
    profileInputBg: L ? 'rgba(255,255,255,0.96)' : '#09090b',
    profileBorder: L ? 'rgba(0,0,0,0.09)' : '#27272a',

    // ── DROPDOWN & MODALS ──
    dropdownBg: L ? 'rgba(255,255,255,0.98)' : 'rgba(18,19,26,0.96)',
    dropdownBorder: L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',
    dropdownHover: L ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
    chipBg: L ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)',
    chipBorder: L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)',

    // ── SCROLLBAR ──
    scrollbarTrack: L ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)',
    scrollbarThumb: L ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.12)',

    // ── CARD HOVER HELPERS ──
    cardHoverBg: (colorRgb, hovered) => {
      if (!hovered) {
        return L
          ? 'rgba(255,255,255,0.97)'
          : `linear-gradient(145deg, rgba(${colorRgb},0.06) 0%, rgba(14,16,25,0.95) 100%)`;
      }
      return L
        ? `linear-gradient(145deg, rgba(${colorRgb},0.08) 0%, rgba(255,255,255,0.98) 100%)`
        : `linear-gradient(145deg, rgba(${colorRgb},0.14) 0%, rgba(20,23,36,0.98) 100%)`;
    },
    cardHoverBorder: (colorRgb, hovered) => {
      if (!hovered) return L ? `1.5px solid rgba(${colorRgb},0.18)` : `1.5px solid rgba(${colorRgb},0.22)`;
      return L ? `1.5px solid rgba(${colorRgb},0.38)` : `1.5px solid rgba(${colorRgb},0.6)`;
    },
    cardShadow: (colorRgb, hovered) => {
      if (!hovered) return L ? '0 4px 18px rgba(0,0,0,0.07)' : '0 12px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)';
      return L
        ? `0 20px 48px rgba(${colorRgb},0.14), 0 4px 16px rgba(0,0,0,0.07)`
        : `0 20px 48px rgba(${colorRgb},0.25), inset 0 1px 0 rgba(255,255,255,0.1)`;
    },
  };
}
