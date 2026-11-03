import { ImageResponse } from 'next/og';

import { ogImage, siteName, siteTagline } from '@/lib/site';

// Rendered once at build time and served as a static PNG at /og.png.
export const dynamic = 'force-static';

const games = [
  'Spin Wheel',
  'Scratch Card',
  'Slot Machine',
  'Bingo',
  'Dice',
  'Coin Flip',
  'Lucky Box',
];

/**
 * The site's Open Graph image. It uses only the font bundled with `next/og` (no font files are
 * fetched), and draws the logo mark inline.
 */
export function GET() {
  return new ImageResponse(
    <div
      style={{
        background: 'linear-gradient(135deg, #17142b 0%, #25194d 55%, #3b2f61 100%)',
        color: '#f8f5ff',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: '72px 80px',
        width: '100%',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 28 }}>
        <svg height="112" viewBox="0 0 64 64" width="112">
          <rect fill="#0f0a24" height="64" rx="16" width="64" />
          <circle cx="32" cy="32" fill="none" r="20" stroke="#ad96ff" strokeWidth="5" />
          <path
            d="M32 12v40M12 32h40M18 18l28 28M46 18 18 46"
            stroke="#ad96ff"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <circle cx="32" cy="32" fill="#ffffff" r="5" />
        </svg>
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>
          {siteName}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ color: '#e5e0f1', display: 'flex', fontSize: 44, lineHeight: 1.25 }}>
          {siteTagline}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {games.map((game) => (
            <div
              key={game}
              style={{
                background: 'rgba(173, 150, 255, 0.16)',
                border: '2px solid rgba(173, 150, 255, 0.55)',
                borderRadius: 999,
                color: '#f3edff',
                display: 'flex',
                fontSize: 26,
                padding: '8px 22px',
              }}
            >
              {game}
            </div>
          ))}
        </div>
      </div>
    </div>,
    { height: ogImage.height, width: ogImage.width },
  );
}
