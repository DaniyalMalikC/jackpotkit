import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Accessible contract of the docs playground (`apps/docs/components/playground/`) and of each game
 * rendered inside it by `@jackpotkit/react`. Control names come from the playground and renderer
 * sources; update them together.
 */
export interface DocsGame {
  readonly id: string;
  readonly name: string;
  /** Plays one round with the keyboard, inside the preview. */
  readonly play: (preview: Locator) => Promise<void>;
  /** The callback that proves the round happened. */
  readonly event: 'onCall' | 'onComplete';
}

async function press(preview: Locator, name: RegExp): Promise<void> {
  const control = preview.getByRole('button', { name });
  await expect(control).toBeEnabled();
  await control.focus();
  await control.press('Enter');
}

export const docsGames: readonly DocsGame[] = [
  { event: 'onComplete', id: 'spin-wheel', name: 'Spin Wheel', play: (p) => press(p, /^Spin$/) },
  {
    event: 'onComplete',
    id: 'scratch-card',
    name: 'Scratch Card',
    play: (p) => press(p, /^Reveal card$/),
  },
  {
    event: 'onComplete',
    id: 'slot-machine',
    name: 'Slot Machine',
    play: (p) => press(p, /PULL TO SPIN/),
  },
  { event: 'onCall', id: 'bingo', name: 'Bingo', play: (p) => press(p, /^Call next number$/) },
  { event: 'onComplete', id: 'dice', name: 'Dice', play: (p) => press(p, /^Roll dice$/) },
  { event: 'onComplete', id: 'coin-flip', name: 'Coin Flip', play: (p) => press(p, /^Flip coin$/) },
  {
    event: 'onComplete',
    id: 'lucky-box',
    name: 'Lucky Box',
    play: async (p) => {
      await press(p, /^Violet$/);
      await press(p, /^Reveal selection$/);
    },
  },
];

export async function openPlayground(page: Page, game: string): Promise<Locator> {
  await page.goto(`/docs/${game}`);
  const playground = page.locator(`[data-playground="${game}"]`);
  await expect(playground).toBeVisible();
  // The preview is client-only; wait until the real component has rendered its live region.
  await expect(preview(playground).getByRole('status')).toHaveCount(1);
  return playground;
}

export function preview(playground: Locator): Locator {
  return playground.getByTestId('playground-preview');
}

export function code(playground: Locator): Locator {
  return playground.getByTestId('playground-code');
}

export function logEntries(playground: Locator, event?: string): Locator {
  const selector = event === undefined ? 'li' : `li[data-event="${event}"]`;
  return playground.getByTestId('event-log').locator(selector);
}

/** Shortens animations through the component's own `reduceMotion` prop. */
export async function reduceMotion(playground: Locator): Promise<void> {
  const select = playground.getByLabel('Reduce motion');
  if ((await select.count()) > 0) await select.selectOption('true');
}
