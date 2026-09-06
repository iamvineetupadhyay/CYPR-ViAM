import React from 'react';
import { Play, Film, ExternalLink, Sparkles } from 'lucide-react';
import { getT } from '../utils/themeTokens';

export default function FormattedAiResponse({ text, onPlayMovie, theme }) {
  if (!text) return null;

  const currentTheme = theme || (typeof document !== 'undefined' && document.body.classList.contains('light-theme') ? 'light' : 'dark');
  const T = getT(currentTheme);
  const isLight = T.isLight;

  // Split by double newline or single newline for paragraphs/lists
  const lines = text.split('\n');

  const renderFormattedInline = (str) => {
    // Check for inline /play <movie> or bold or backticks
    const parts = [];
    let remaining = str;
    let keyIdx = 0;

    // Regex for bold **text**, backticks `code`, and /play <movie>
    const regex = /(\*\*.*?\*\*|`.*?`|\/play\s+[^,\n]+)/g;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(str)) !== null) {
      // Text before match
      if (match.index > lastIndex) {
        parts.push(<span key={keyIdx++}>{str.substring(lastIndex, match.index)}</span>);
      }

      const matchedText = match[0];
      if (matchedText.startsWith('**') && matchedText.endsWith('**')) {
        const inner = matchedText.slice(2, -2);
        parts.push(
          <strong key={keyIdx++} style={{ color: isLight ? '#111827' : '#ffffff', fontWeight: 800 }}>
            {inner}
          </strong>
        );
      } else if (matchedText.startsWith('`') && matchedText.endsWith('`')) {
        const inner = matchedText.slice(1, -1);
        parts.push(
          <code
            key={keyIdx++}
            style={{
              background: isLight ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.15)',
              border: isLight ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
              color: isLight ? '#7e22ce' : '#c084fc',
              padding: '2px 6px',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            {inner}
          </code>
        );
      } else if (matchedText.startsWith('/play')) {
        const movieName = matchedText.replace('/play', '').trim();
        parts.push(
          <span
            key={keyIdx++}
            onClick={() => onPlayMovie && onPlayMovie(movieName)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: isLight ? 'rgba(255, 85, 0, 0.1)' : 'linear-gradient(135deg, rgba(255, 85, 0, 0.2) 0%, rgba(255, 85, 0, 0.1) 100%)',
              border: '1px solid rgba(255, 85, 0, 0.4)',
              color: isLight ? '#c2410c' : '#ff7733',
              padding: '2px 8px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '12.5px',
              margin: '0 4px',
              transition: 'all 0.15s ease'
            }}
            title={`Play "${movieName}" in Cinema Lounge`}
            onMouseEnter={e => e.currentTarget.style.background = isLight ? 'rgba(255, 85, 0, 0.18)' : 'rgba(255, 85, 0, 0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = isLight ? 'rgba(255, 85, 0, 0.1)' : 'rgba(255, 85, 0, 0.2)'}
          >
            <Play size={11} fill={isLight ? '#c2410c' : '#ff7733'} />
            <span>/play {movieName}</span>
          </span>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < str.length) {
      parts.push(<span key={keyIdx++}>{str.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : str;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '14.5px', lineHeight: 1.65, color: isLight ? '#18181b' : '#e2e8f0' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: 6 }} />;
        }

        // 1. Heading level 1/2/3 (# or ## or ### or **Title with emoji**)
        if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
          const headingText = trimmed.replace(/^#+\s*/, '');
          return (
            <h3
              key={idx}
              style={{
                fontSize: '17px',
                fontWeight: 900,
                color: isLight ? '#111827' : '#ffffff',
                margin: '12px 0 4px',
                fontFamily: 'Outfit, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                letterSpacing: '-0.2px'
              }}
            >
              <Sparkles size={15} color={isLight ? '#7e22ce' : '#c084fc'} />
              <span>{renderFormattedInline(headingText)}</span>
            </h3>
          );
        }

        // Standalone bold title like **Inception—the final spin 🌪️**
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && !trimmed.slice(2, -2).includes('**')) {
          const innerTitle = trimmed.slice(2, -2);
          return (
            <div
              key={idx}
              style={{
                fontSize: '16.5px',
                fontWeight: 800,
                color: isLight ? '#111827' : '#ffffff',
                margin: '8px 0 2px',
                display: 'flex',
                alignItems: 'center',
                gap: 7
              }}
            >
              <span style={{ width: 4, height: 16, borderRadius: 2, background: 'linear-gradient(to bottom, #a855f7, #38bdf8)' }} />
              <span>{innerTitle}</span>
            </div>
          );
        }

        // 2. Bullet list (- or * or •)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const content = trimmed.substring(2);
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingLeft: 4 }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: isLight ? '#7e22ce' : '#a855f7',
                boxShadow: isLight ? '0 0 6px rgba(126,34,206,0.3)' : '0 0 8px #a855f7',
                marginTop: 8,
                flexShrink: 0
              }} />
              <div style={{ flex: 1, color: isLight ? '#18181b' : '#e2e8f0' }}>{renderFormattedInline(content)}</div>
            </div>
          );
        }

        // 3. Numbered list (1. , 2. , etc.)
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const content = numMatch[2];
          return (
            <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingLeft: 4 }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 20,
                height: 20,
                borderRadius: '50%',
                background: isLight ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.15)',
                border: isLight ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(168, 85, 247, 0.3)',
                color: isLight ? '#7e22ce' : '#c084fc',
                fontSize: '11px',
                fontWeight: 800,
                marginTop: 2,
                flexShrink: 0
              }}>
                {num}
              </span>
              <div style={{ flex: 1, color: isLight ? '#18181b' : '#e2e8f0' }}>{renderFormattedInline(content)}</div>
            </div>
          );
        }

        // Standard Paragraph
        return (
          <p key={idx} style={{ margin: '3px 0', color: isLight ? '#18181b' : '#e2e8f0' }}>
            {renderFormattedInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}
