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
        background: 'linear-gradient(135deg, #170a0e 0%, #5c0a1f 55%, #800020 100%)',
        color: '#fffdd0',
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
          <rect fill="#170a0e" height="64" rx="16" width="64" />
          <circle cx="32" cy="32" fill="none" r="20" stroke="#d7707c" strokeWidth="5" />
          <path
            d="M32 12v40M12 32h40M18 18l28 28M46 18 18 46"
            stroke="#d7707c"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <circle cx="32" cy="32" fill="#f7edb9" r="5" />
        </svg>
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>
          {siteName}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{ color: '#f7edb9', display: 'flex', fontSize: 44, lineHeight: 1.25 }}>
          {siteTagline}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {games.map((game) => (
            <div
              key={game}
              style={{
                background: 'rgba(215, 112, 124, 0.18)',
                border: '2px solid rgba(215, 112, 124, 0.6)',
                borderRadius: 999,
                color: '#fffdd0',
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
