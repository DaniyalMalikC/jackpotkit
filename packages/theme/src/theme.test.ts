import { describe, expect, it } from 'vitest';

import { createJackpotTheme, defaultTheme, neonTheme } from './theme.js';

describe('JackpotKit themes', () => {
  it('provides frozen platform-neutral defaults', () => {
    expect(defaultTheme.animation).toMatchObject({
      bingoMarkDuration: 180,
      revealDuration: 320,
      slotDuration: 1_200,
      slotReelDelay: 180,
      spinDuration: 3_000,
      spinRotations: 6,
    });
    expect(defaultTheme.colors.scratchCover).toBe('#77718A');
    expect(defaultTheme.colors.bingoMarked).toBe('#6843D5');
    expect(defaultTheme.colors.slotBackground).toBe('#25194D');
    expect(defaultTheme.colors.wheelPalette).toHaveLength(6);
    expect(Object.isFrozen(defaultTheme)).toBe(true);
    expect(Object.isFrozen(defaultTheme.colors.wheelPalette)).toBe(true);
  });

  it('merges nested overrides without mutating the base theme', () => {
    const custom = createJackpotTheme({
      animation: { spinDuration: 500 },
      colors: { primary: '#123456' },
    });

    expect(custom.colors.primary).toBe('#123456');
    expect(custom.colors.surface).toBe(defaultTheme.colors.surface);
    expect(custom.animation.spinDuration).toBe(500);
    expect(defaultTheme.animation.spinDuration).toBe(3_000);
  });

  it('provides a contrasting optional neon preset', () => {
    expect(neonTheme.colors.background).not.toBe(defaultTheme.colors.background);
    expect(neonTheme.colors.onPrimary).toBe('#090617');
  });
});
