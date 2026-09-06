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
      ? 'linear-gradient(145deg, #f7f4ef 0%, #f0ebe0 50%, #ebe3d6 100%)'
      : '#07080c',
    pageColor: L ? '#1a1208' : '#ffffff',
    pageRadials: L
      ? `radial-gradient(circle at 15% 15%, rgba(255,120,0,0.05) 0%, transparent 45%),
         radial-gradient(circle at 85% 20%, rgba(168,85,247,0.04) 0%, transparent 45%),
         radial-gradient(circle at 50% 80%, rgba(34,197,94,0.03) 0%, transparent 50%)`
      : `radial-gradient(circle at 15% 15%, rgba(255,85,0,0.08) 0%, transparent 45%),
         radial-gradient(circle at 85% 20%, rgba(168,85,247,0.07) 0%, transparent 45%),
         radial-gradient(circle at 50% 80%, rgba(34,197,94,0.05) 0%, transparent 50%),
         radial-gradient(circle at 50% 10%, #111420 0%, #07080c 70%)`,

    // ── SURFACES ──
    surface1: L ? 'rgba(247, 242, 234, 0.95)' : 'rgba(10, 12, 18, 0.85)',    // Header
    surface2: L ? 'rgba(255, 255, 255, 0.97)' : 'rgba(14, 16, 25, 0.95)',    // Cards
    surface3: L ? 'rgba(255, 255, 255, 0.85)' : 'rgba(17, 20, 30, 0.75)',    // Stations
    surface4: L ? 'rgba(255, 255, 255, 0.65)' : 'rgba(17, 20, 30, 0.45)',    // Dim tiles
    surfaceHero: L
      ? 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(250,246,240,0.98) 100%)'
      : 'linear-gradient(135deg, rgba(22,25,38,0.85) 0%, rgba(13,14,22,0.95) 100%)',
    surfaceModal: L ? 'rgba(245, 240, 232, 0.98)' : 'rgba(10, 11, 18, 0.96)',
    surfaceSidebar: L ? '#ede7db' : '#0d0e1a',
    surfaceInput: L ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.05)',
    surfaceRightCard: L ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 17, 26, 0.9)',

    // ── BORDERS ──
    border1: L ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)',
    border2: L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    border3: L ? 'rgba(0,0,0,0.11)' : 'rgba(255,255,255,0.10)',
    border4: L ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.14)',
    borderInput: L ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.1)',
    borderDivider: L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.07)',

    // ── TEXT ──
    textPrimary: L ? '#1a1208' : '#ffffff',
    textSecondary: L ? '#2a1f14' : '#f4f4f5',
    textMuted1: L ? '#6b5a44' : '#94a3b8',   // Body / description
    textMuted2: L ? '#8a7060' : '#71717a',   // Labels
    textMuted3: L ? '#8a7060' : '#64748b',   // Faint / subtitles
    textMuted4: L ? '#7a6a54' : '#a1a1aa',   // Placeholder-ish

    // ── HEADER ──
    headerBg: L ? 'rgba(247, 242, 234, 0.95)' : 'rgba(10, 12, 18, 0.85)',
    headerBorder: L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.06)',

    // ── PILL / NAV BUTTONS ──
    pillBg: L ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)',
    pillBorder: L ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.09)',
    pillText: L ? '#2a1f14' : '#f4f4f5',

    // ── INPUTS ──
    inputBg: L ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.05)',
    inputBorder: L ? 'rgba(0,0,0,0.14)' : 'rgba(255,255,255,0.1)',
    inputText: L ? '#1a1208' : '#ffffff',
    inputPlaceholder: L ? '#8a7060' : '#71717a',

    // ── MESSAGE BUBBLES ──
    bubbleOwnBg: L ? 'linear-gradient(135deg, rgba(255,85,0,0.16) 0%, rgba(255,119,51,0.12) 100%)' : 'linear-gradient(135deg, rgba(255,85,0,0.22) 0%, rgba(224,68,0,0.28) 100%)',
    bubbleOwnBorder: L ? 'rgba(255,85,0,0.3)' : 'rgba(255,85,0,0.4)',
    bubbleOwnText: L ? '#200b00' : '#ffffff',
    bubbleOtherBg: L ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.05)',
    bubbleOtherBorder: L ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
    bubbleOtherText: L ? '#1a1208' : '#f4f4f5',

    // ── AVATAR ──
    avatarRing: L ? '#f0ebe0' : '#0d0e16',

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
